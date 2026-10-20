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

/* ===== Benachrichtigungen (Glocke) =====
   Kleines Fenster an der Glocke wie am Laptop: wer, was, wann; anpinnen, entfernen, als gelesen markieren.
   Berechnet aus den Daten (nichts zusätzlich gespeichert); gelesen/entfernt/angepinnt merkt sich jedes Gerät (META.ml).
   Chef/Büro: neue Anforderungen, Übergaben, fertige Prüfprotokolle anderer + Systemhinweise (Kalibrierung, fällige Prüfungen).
   Jeder: Statusänderung der eigenen Anforderungen, mit mir geteilte Notizen. */
const ML_TAGE=14;
const ML_IC={pin:"M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z",
  weg:"M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
  sys:"M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"};
const mlSvg=k=>`<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="${ML_IC[k]}"/></svg>`;
const mlIch=r=>!!(r&&r.mail&&String(r.mail).toLowerCase()===String(ME.mail||"").toLowerCase());
const mlSt=()=>{ META.ml=META.ml||{gel:{},weg:{},pin:{}}; return META.ml; };
function meldungenRoh(){
  if(!ME.mail) return [];
  const ab=Date.now()-ML_TAGE*864e5, L=[], v=anfVerw(), alle=k=>DB[k]?[...DB[k].values()].filter(r=>!r.deleted&&!r.demo):[];
  const P=(id,t,von,h,s,go)=>L.push({id,t,von,h,s,go});
  if(v){
    anfAlle().filter(a=>(a.created||0)>=ab&&!mlIch(a.createdBy)).forEach(a=>P("anf:"+a.id,a.created,a.createdBy,"fordert Material an",`${anfOrt(a)}: ${anfPosText(a)}`,{v:"materialanf"}));
    alle("eintraege").filter(e=>(e.created||0)>=ab&&!mlIch(e.createdBy)).forEach(e=>{ const b=DB.baustellen&&DB.baustellen.get(e.baustelleId);
      P("ue:"+e.id,e.created,e.createdBy,`Übergabe: ${b?b.name:"Baustelle"}`,e.stand?String(e.stand).slice(0,90):"",{v:"baustelle",id:e.baustelleId}); });
    alle("pruefungen").filter(p=>p.pdfAblage&&(p.updated||0)>=ab&&!mlIch(p.updatedBy)).forEach(p=>{ const k=DB.kunden&&DB.kunden.get(p.kundeId);
      P("pr:"+p.id+":"+p.pdfAblage,p.updated,p.updatedBy,`Prüfprotokoll fertig: ${k?k.name:"Prüfung"}`,p.p&&p.p.art||"",p.standortId?{v:"standort",id:p.standortId}:null); });
    /* Systemhinweise */
    if(DB.geraete&&typeof gerKal==="function") [...DB.geraete.values()].filter(g=>!g.deleted&&!g.aus).forEach(g=>{ const k=gerKal(g); if(k&&(k.s==="ab"||k.s==="bald"))
      P("kal:"+g.id+":"+k.s+":"+(g.kal||""),Date.now()-1,null,k.s==="ab"?"Kalibrierung abgelaufen":"Kalibrierung läuft bald ab",`${gerName(g)}${g.sn?" · "+g.sn:""} – ${k.t}`,{v:"geraete"}); });
    if(typeof faellig==="function"){ const t=today(); faellig().filter(p=>p.a&&p.a.naechste&&p.a.naechste<t).slice(0,10).forEach(p=>{ const k=DB.kunden&&DB.kunden.get(p.kundeId);
      P("fae:"+p.id+":"+p.a.naechste,new Date(p.a.naechste+"T08:00:00").getTime(),null,"Wiederholungsprüfung überfällig",`${k?k.name:"Prüfung"} – fällig seit ${p.a.naechste.split("-").reverse().join(".")}`,p.standortId?{v:"standort",id:p.standortId}:null); }); }
  }
  anfAlle().filter(a=>anfMeine(a)&&a.status!=="angefordert"&&(a.statusAm||0)>=ab&&!mlIch(a.statusVon)).forEach(a=>P("anfst:"+a.id+":"+a.status,a.statusAm,a.statusVon,a.status==="da"?"hat dein Material als da markiert":"hat dein Material bestellt",`${anfOrt(a)}: ${anfPosText(a)}`,{v:"materialanf"}));
  alle("notizen").filter(n=>!mlIch(n.createdBy)&&(n.sicht==="firma"||(n.sicht==="personen"&&(n.personen||[]).map(x=>String(x).toLowerCase()).includes(String(ME.mail).toLowerCase())))&&(n.updated||0)>=ab)
    .forEach(n=>P("no:"+n.id,n.updated,n.createdBy,"hat eine Notiz geteilt",n.titel||"Notiz",{v:"notizen"}));
  return L;
}
function meldungen(){ const S=mlSt(); return meldungenRoh().filter(m=>!S.weg[m.id]).sort((a,b)=>(S.pin[b.id]?1:0)-(S.pin[a.id]?1:0)||b.t-a.t); }
const mlNeu=()=>{ const S=mlSt(); return meldungen().filter(m=>!S.gel[m.id]).length; };
function mlGlocke(){ const b=document.getElementById("glBtn"); if(!b) return; const n=ME.mail?mlNeu():0;
  b.dataset.act="mlAuf"; b.removeAttribute("data-v");
  b.hidden=!ME.mail||nav.v==="login"; const z=document.getElementById("glN"); if(z){ z.textContent=n>9?"9+":String(n); z.hidden=!n; } b.setAttribute("aria-label",n?`${n} neue Benachrichtigungen`:"Benachrichtigungen");
  if(document.getElementById("mlPop")) mlFuellen(); }
function mlAv(m){
  if(!m.von) return `<span class="ml-av sys">${mlSvg("sys")}</span>`;
  const p=typeof profilVon==="function"&&profilVon(m.von.mail);
  return p&&p.bild?`<span class="ml-av" style="background-image:url('${p.bild}')"></span>`:`<span class="ml-av">${esc(initials(m.von.name||"?"))}</span>`; }
function mlName(m){ if(!m.von) return "System"; const p=typeof profilVon==="function"&&profilVon(m.von.mail), v=p&&[p.vorname,p.nachname].filter(Boolean).join(" "); return v||m.von.name||"Jemand"; }
function mlFuellen(){
  const pop=document.getElementById("mlPop"); if(!pop) return; const S=mlSt(), L=meldungen(), neu=L.filter(m=>!S.gel[m.id]).length;
  const zeile=m=>`<div class="ml-it${S.gel[m.id]?"":" neu"}${S.pin[m.id]?" ml-gepinnt":""}" data-act="mlKlick" data-id="${esc(m.id)}" role="button" tabindex="0">${mlAv(m)}
    <span class="ml-tx"><span class="ml-k"><b>${esc(mlName(m))}</b><span class="ml-zeit">${esc(wann(m.t))}</span></span><span class="ml-h">${esc(m.h)}</span>${m.s?`<span class="ml-s">${esc(m.s)}</span>`:""}</span>
    <span class="ml-ak"><button class="ml-b${S.pin[m.id]?" an":""}" data-act="mlPin" data-id="${esc(m.id)}" aria-label="${S.pin[m.id]?"Nicht mehr anpinnen":"Anpinnen"}" title="${S.pin[m.id]?"Nicht mehr anpinnen":"Anpinnen"}">${mlSvg("pin")}</button>
    <button class="ml-b" data-act="mlWeg" data-id="${esc(m.id)}" aria-label="Entfernen" title="Entfernen">${mlSvg("weg")}</button></span></div>`;
  const pin=L.filter(m=>S.pin[m.id]), rest=L.filter(m=>!S.pin[m.id]);
  pop.innerHTML=`<div class="ml-kopf"><b>Benachrichtigungen</b>${neu?`<button class="btn-text" data-act="mlAlleGel">Alle gelesen</button>`:""}</div>
    <div class="ml-liste">${L.length?`${pin.length?`<div class="ml-gr">Angepinnt</div>${pin.map(zeile).join("")}${rest.length?`<div class="ml-gr">Neueste</div>`:""}`:""}${rest.map(zeile).join("")}`
      :`<p class="ml-leer">Aktuell keine Benachrichtigungen</p>`}</div>
    ${Object.keys(S.weg).length?`<div class="ml-fuss"><button class="btn-text" data-act="mlWiederher">Entfernte wieder anzeigen</button></div>`:""}`;
}
function mlAuf(){
  let pop=document.getElementById("mlPop"); if(pop){ mlZu(); return; }
  pop=document.createElement("div"); pop.id="mlPop"; pop.className="ml-pop"; pop.setAttribute("role","dialog"); pop.setAttribute("aria-label","Benachrichtigungen");
  document.body.appendChild(pop); mlFuellen(); mlPlatz();
}
function mlPlatz(){ const pop=document.getElementById("mlPop"), b=document.getElementById("glBtn"); if(!pop||!b) return; const r=b.getBoundingClientRect();
  pop.style.top=Math.round(r.bottom+8)+"px"; pop.style.right=Math.max(8,Math.round(innerWidth-r.right-8))+"px"; }
function mlZu(){ const p=document.getElementById("mlPop"); if(p) p.remove(); }
function mlStSpeichern(){ /* nur IDs behalten, die es noch gibt */ const S=mlSt(), da=new Set(meldungenRoh().map(m=>m.id)); ["gel","weg","pin"].forEach(k=>Object.keys(S[k]).forEach(id=>{ if(!da.has(id)) delete S[k][id]; })); metaSave(); }
document.addEventListener("click",e=>{
  const b=e.target.closest&&e.target.closest('[data-act="mlAuf"],[data-act="mlKlick"],[data-act="mlPin"],[data-act="mlWeg"],[data-act="mlAlleGel"],[data-act="mlWiederher"]');
  if(!b){ const p=document.getElementById("mlPop"); if(p&&!p.contains(e.target)) mlZu(); return; }
  e.stopPropagation(); e.preventDefault(); const a=b.dataset.act, id=b.dataset.id, S=mlSt();
  if(a==="mlAuf") return mlAuf();
  if(a==="mlPin"){ if(S.pin[id]) delete S.pin[id]; else S.pin[id]=1; }
  else if(a==="mlWeg"){ S.weg[id]=1; delete S.pin[id]; S.gel[id]=1; }
  else if(a==="mlAlleGel"){ meldungen().forEach(m=>S.gel[m.id]=1); }
  else if(a==="mlWiederher"){ S.weg={}; }
  else if(a==="mlKlick"){ S.gel[id]=1; mlStSpeichern(); const m=meldungen().find(x=>x.id===id); mlZu(); mlGlocke(); if(m&&m.go) mlGo(m.go); return; }
  mlStSpeichern(); mlFuellen(); mlGlocke();
},true);
document.addEventListener("keydown",e=>{ if(e.key==="Escape") mlZu(); });
addEventListener("resize",mlPlatz);
/* Ziel öffnen: in der Übersicht gibt es Baustellen/Notizen nicht als Ansicht ⇒ Baustelle-App */
function mlGo(z){ if(["baustelle","notizen"].includes(z.v)&&typeof notizenView!=="function"){ location.href="../baustelle/"; return; } go(z); }
function meldungenView(){ setTimeout(mlAuf,0); return ""; }
