/* Materialanforderungen + Meldungen – gemeinsam für Übersicht und Baustelle (von tools/build.py eingesetzt).
   Präfix „anf“, weil „af…“ schon das Aufnahmeprotokoll (aufnahme.js) belegt.
   Anforderung: {id, baustelleId ("" = allgemein, z. B. Lager/Werkstatt), eintragId (aus einer Übergabe), pos:[{t,q,u}], notiz,
   status: angefordert → bestellt → da, statusAm, statusVon}. Aus jeder Übergabe mit offenem Material entsteht automatisch eine.
   Bestellen dürfen Chef, Büro und Entwickler; als „da“ markieren darf zusätzlich, wer angefordert hat. */
const ANF_ST=[["angefordert","Angefordert"],["bestellt","Bestellt"],["da","Da"]];
const ANF_TXT=Object.fromEntries(ANF_ST);
const anfVerw=()=>!!(ME.admin||ME.buero);
const anfFmt=n=>String(Math.round((+n||0)*100)/100).replace(".",",");
const anfPosText=a=>(a.pos||[]).map(x=>`${anfFmt(x.q)} ${x.u||""} ${x.t}`.replace(/\s+/g," ").trim()).join(", ");
const anfBau=a=>a.baustelleId&&DB.baustellen&&DB.baustellen.get(a.baustelleId);
const anfOrt=a=>{ const b=anfBau(a); return b&&!b.deleted?b.name:"Allgemein (Lager / Werkstatt)"; };
const anfMeine=a=>!!(a.createdBy&&a.createdBy.mail&&String(a.createdBy.mail).toLowerCase()===String(ME.mail||"").toLowerCase());
const anfAlle=()=>(DB.anforderungen?[...DB.anforderungen.values()]:[]).filter(a=>!a.deleted&&(a.pos||[]).length);
const anfOffen=()=>anfAlle().filter(a=>a.status!=="da");
const anfPill=a=>pill(a.status==="da"?"ok":a.status==="bestellt"?"wip":"open",ANF_TXT[a.status]||"Angefordert");

/* Übergabe gespeichert ⇒ offene Positionen als Anforderung (solange noch nicht bestellt, wird sie mitgeändert) */
function anfAusUebergabe(e){
  if(!e||!DB.anforderungen) return;
  const pos=(e.mat||[]).filter(x=>!x.ok&&String(x.t||"").trim()).map(x=>({t:String(x.t).trim(),q:x.q,u:x.u}));
  const a=[...DB.anforderungen.values()].find(x=>x.eintragId===e.id&&!x.deleted);
  if(a){ if(a.status!=="angefordert"||JSON.stringify(a.pos)===JSON.stringify(pos)) return; if(!pos.length) a.deleted=true; a.pos=pos; saveRec("anforderungen",a); return; }
  if(!pos.length) return;
  saveRec("anforderungen",{id:uid(),baustelleId:e.baustelleId||"",eintragId:e.id,pos,notiz:"",status:"angefordert",statusAm:Date.now(),statusVon:who()},true);
}
function anfStatus(a,st){
  if(!a||a.status===st) return; if(st==="bestellt"&&!anfVerw()) return; if(st==="da"&&!anfVerw()&&!anfMeine(a)) return;
  a.status=st; a.statusAm=Date.now(); a.statusVon=who(); saveRec("anforderungen",a);
  /* Da ⇒ in der Übergabe abhaken, damit dort nichts mehr offen steht */
  const e=st==="da"&&a.eintragId&&DB.eintraege&&DB.eintraege.get(a.eintragId);
  if(e&&Array.isArray(e.mat)){ let ch=false; e.mat.forEach(x=>{ if(!x.ok&&a.pos.some(p=>String(p.t).trim().toLowerCase()===String(x.t).trim().toLowerCase())){ x.ok=true; x.okVon=who(); ch=true; } });
    if(ch){ e.material=e.mat.filter(z=>!z.ok).map(x=>`${anfFmt(x.q)} ${x.u} ${x.t}`).join("\n"); saveRec("eintraege",e); } }
  toast(st==="bestellt"?"Als bestellt markiert":st==="da"?"Als da markiert":"Status geändert");
}
/* Eine Zeile in Listen. knapp = Dashboard */
function anfZeile(a,knapp){
  const v=anfVerw(), wer=a.createdBy&&a.createdBy.name||"", t=a.status==="angefordert"?a.created:a.statusAm;
  const knopf=a.status==="angefordert"&&v?`<button class="btn-tonal sm" data-act="afSt" data-id="${esc(a.id)}" data-v="bestellt">Bestellt</button>`
    :a.status==="bestellt"&&(v||anfMeine(a))?`<button class="btn-tonal sm" data-act="afSt" data-id="${esc(a.id)}" data-v="da">Da</button>`:"";
  return `<div class="li ruhig af-z"><span class="lt"><span class="h">${esc(anfOrt(a))}</span><span class="s">${esc(anfPosText(a))}</span>
    ${knapp?"":a.notiz?`<span class="s">${esc(a.notiz)}</span>`:""}<span class="st">${anfPill(a)}<span class="af-m">${esc([wer,t&&wann(t)].filter(Boolean).join(" · "))}</span></span></span>${knopf}</div>`;
}
function anfListeView(){
  const A=anfAlle().sort((x,y)=>(y.statusAm||y.created||0)-(x.statusAm||x.created||0)), zwei=Date.now()-14*864e5;
  const g=st=>A.filter(a=>a.status===st&&(st!=="da"||(a.statusAm||0)>=zwei));
  const teil=(st,t)=>{ const L=g(st); return L.length?`<div class="sec-lbl">${t} · ${L.length}</div>${listOf(L.map(a=>anfZeile(a)))}`:""; };
  return `<div class="af-liste">${A.length?"":`<p class="meta">Keine Anforderungen. Material aus den Übergaben landet automatisch hier, Allgemeines (z. B. fürs Lager) über „Anfordern“.</p>`}
    ${teil("angefordert","Angefordert")}${teil("bestellt","Bestellt")}${teil("da","Da (letzte 14 Tage)")}</div>`;
}
function anfDialog(baustelleId){
  const B=(DB.baustellen?[...DB.baustellen.values()]:[]).filter(b=>!b.deleted&&(b.status||"aktiv")!=="fertig").sort((a,b)=>String(a.name).localeCompare(String(b.name),"de"));
  dialog("Material anfordern",`<div class="fg1">${sf("bs","Wofür?",baustelleId||"",[["","Allgemein (Lager / Werkstatt)"],...B.map(b=>[b.id,b.name])],{form:true})}
    ${ta("pos","Was wird gebraucht? (eine Zeile pro Teil)","",{form:true,ph:"z. B.\n50 m NYM-J 3×1,5\n2 Pck Wago 221-413\n1 Rolle Isolierband"})}
    ${ta("notiz","Notiz (optional)","",{form:true,ph:"z. B. bis Donnerstag, Lieferung auf die Baustelle"})}</div>`,
    `<button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="afOk">Anfordern</button>`);
}
function anfZeileParsen(s){ s=String(s||"").replace(/^[\s\-–•*]+/,"").trim(); if(!s) return null;
  if(typeof matZeile==="function"){ const x=matZeile(s); if(x) return {t:x.t,q:x.q,u:x.u}; }
  const m=/^(\d+(?:[.,]\d+)?)\s*([a-zäöü²]+\.?)?\s+(.+)$/i.exec(s); return m?{t:m[3],q:parseFloat(m[1].replace(",",".")),u:m[2]||"Stück"}:{t:s,q:1,u:"Stück"}; }
function anfSpeichern(){
  const raw={}; document.querySelectorAll("#dlg [data-f]").forEach(e=>raw[e.dataset.f]=e.value);
  const pos=String(raw.pos||"").split("\n").map(anfZeileParsen).filter(Boolean);
  if(!pos.length){ toast("Bitte mindestens ein Teil eintragen"); return; }
  saveRec("anforderungen",{id:uid(),baustelleId:raw.bs||"",eintragId:"",pos,notiz:String(raw.notiz||"").trim(),status:"angefordert",statusAm:Date.now(),statusVon:who()},true);
  closeOverlays(); render(); toast("Angefordert – Chef und Büro sehen es in der Übersicht");
}
/* Status-Pill in der Übergabe-Karte */
function anfChip(e){ const a=e&&anfAlle().find(x=>x.eintragId===e.id); return a?anfPill(a):""; }

/* ===== Meldungen (Glocke) =====
   Werden aus den Daten berechnet, nichts Zusätzliches wird gespeichert. „Gelesen bis“ merkt sich jedes Gerät.
   Chef/Büro: neue Anforderungen, neue Übergaben, abgeschlossene Prüfungen anderer.
   Jeder: Statusänderung der eigenen Anforderungen, mit mir geteilte Notizen. */
const ML_TAGE=14;
const mlIch=r=>!!(r&&r.mail&&String(r.mail).toLowerCase()===String(ME.mail||"").toLowerCase());
function meldungen(){
  if(!ME.mail) return [];
  const ab=Date.now()-ML_TAGE*864e5, L=[], v=anfVerw(), alle=k=>DB[k]?[...DB[k].values()].filter(r=>!r.deleted&&!r.demo):[];
  if(v){
    anfAlle().filter(a=>(a.created||0)>=ab&&!mlIch(a.createdBy)).forEach(a=>L.push({t:a.created,ic:"lager",h:`${(a.createdBy||{}).name||"Jemand"} fordert Material an`,s:`${anfOrt(a)}: ${anfPosText(a)}`,go:{v:"materialanf"}}));
    alle("eintraege").filter(e=>(e.created||0)>=ab&&!mlIch(e.createdBy)).forEach(e=>{ const b=DB.baustellen&&DB.baustellen.get(e.baustelleId);
      L.push({t:e.created,ic:"baustelle",h:`Neue Übergabe: ${b?b.name:"Baustelle"}`,s:`${(e.createdBy||{}).name||""}${e.stand?" · "+String(e.stand).slice(0,80):""}`,go:{v:"baustelle",id:e.baustelleId}}); });
    alle("pruefungen").filter(p=>p.pdfAblage&&(p.updated||0)>=ab&&!mlIch(p.updatedBy)).forEach(p=>{ const k=DB.kunden&&DB.kunden.get(p.kundeId);
      L.push({t:p.updated,ic:"doc",h:`Prüfprotokoll fertig: ${k?k.name:"Prüfung"}`,s:`${(p.updatedBy||{}).name||""} · ${p.p&&p.p.art||""}`,go:null}); });
  }
  anfAlle().filter(a=>anfMeine(a)&&a.status!=="angefordert"&&(a.statusAm||0)>=ab&&!mlIch(a.statusVon)).forEach(a=>L.push({t:a.statusAm,ic:"lager",h:a.status==="da"?"Dein Material ist da":"Dein Material ist bestellt",s:`${anfOrt(a)}: ${anfPosText(a)}`,go:{v:"materialanf"}}));
  alle("notizen").filter(n=>!mlIch(n.createdBy)&&(n.sicht==="firma"||(n.sicht==="personen"&&(n.personen||[]).map(x=>String(x).toLowerCase()).includes(String(ME.mail).toLowerCase())))&&(n.updated||0)>=ab)
    .forEach(n=>L.push({t:n.updated,ic:"notes",h:`${(n.createdBy||{}).name||"Jemand"} hat eine Notiz geteilt`,s:n.titel||"Notiz",go:{v:"notizen"}}));
  return L.sort((a,b)=>b.t-a.t);
}
const mlNeu=()=>{ const g=META.mlGelesen||0; return meldungen().filter(m=>m.t>g).length; };
function mlGlocke(){ const b=document.getElementById("glBtn"); if(!b) return; const n=ME.mail?mlNeu():0;
  b.hidden=!ME.mail||nav.v==="login"; const z=document.getElementById("glN"); if(z){ z.textContent=n>9?"9+":String(n); z.hidden=!n; } b.setAttribute("aria-label",n?`${n} neue Meldungen`:"Meldungen"); }
function meldungenView(){
  const L=meldungen(), g=META.mlGelesen||0;
  setTimeout(()=>{ META.mlGelesen=Date.now(); metaSave(); mlGlocke(); },1500);
  if(!L.length) return `<div class="empty">${icon("glocke")}<h2>Aktuell keine Meldungen</h2><p>Hier erscheint, was andere für dich Neues gemacht haben – z. B. Materialanforderungen, Übergaben oder geteilte Notizen.</p></div>`;
  return `<div class="narrow">${listOf(L.map((m,i)=>`<div class="li${m.go?"":" ruhig"}${m.t>g?" ml-neu":""}" ${m.go?`role="button" tabindex="0" data-act="mlGo" data-i="${i}"`:""}><span class="av">${icon(m.ic)}</span>
    <span class="lt"><span class="h">${esc(m.h)}</span><span class="s">${esc(m.s)}</span><span class="st"><span class="af-m">${esc(wann(m.t))}</span></span></span>${m.go?icon("chev"):""}</div>`))}
    <p class="hint">Meldungen der letzten ${ML_TAGE} Tage.</p></div>`;
}
function mlGo(i){ const m=meldungen()[i]; if(!m||!m.go) return; go(m.go); }
