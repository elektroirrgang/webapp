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
const anfOrt=a=>{ if(a.meldungId&&DB.vorgaenge){ const m=DB.vorgaenge.get(a.meldungId); if(m){ const k=m.kundeId&&typeof kundeOf==="function"&&kundeOf(m.kundeId); return [k&&k.name,typeof mlOrt==="function"&&mlOrt(m)].filter(Boolean).join(" · ")||"Meldung"; } }
  const b=anfBau(a); return b&&!b.deleted?b.name:"Allgemein (Lager / Werkstatt)"; };
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
  const ab=Date.now()-ML_TAGE*864e5, L=[], v=anfVerw(), alle=k=>DB[k]?[...DB[k].values()].filter(r=>!r.deleted&&(typeof nurDemo==="function"&&nurDemo()?r.demo:(!r.demo||r.sim))):[]; /* Simulation: nur auf diesem Gerät, wird nie abgeglichen */
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
  /* Aufträge: mir zugewiesen, neue Notizen an meinen Aufträgen, fürs Büro neue Anfragen */
  alle("vorgaenge").forEach(v=>{ const kd=(v.kundeId&&typeof kundeOf==="function"&&kundeOf(v.kundeId)||{}).name||v.kundeName||"Auftrag", go={v:"auftraege",sel:v.id};
    if(v.typ==="meldung"){ /* Meldung aus einem Rahmenauftrag */
      const mg={ml:v.id}, was=`${kd}${typeof mlOrt==="function"&&mlOrt(v)?" · "+mlOrt(v):""}: ${v.text||""}`;
      const ZM=Array.isArray(v.zustAlle)?v.zustAlle.filter(Boolean):[];
      ZM.filter(z=>mlIch(z)&&z.von&&!mlIch(z.von)&&(z.at||0)>=ab).forEach(z=>P("mz:"+v.id+":"+z.at,z.at,z.von,"hat dir eine Meldung zugewiesen",was,mg));
      if(anfVerw()&&!mlIch(v.createdBy)&&(v.created||0)>=ab) P("mn:"+v.id,v.created,v.createdBy,"Neue Meldung",was,mg);
      if(v.fertig&&!mlIch(v.fertig.wer)&&(v.fertig.at||0)>=ab&&(anfVerw()||ZM.some(mlIch)||mlIch(v.createdBy))) P("mf:"+v.id+":"+v.fertig.at,v.fertig.at,v.fertig.wer,v.status==="ohne"?"Meldung ohne Befund abgeschlossen":"hat eine Meldung erledigt",was,mg);
      return; }
    const ZL=Array.isArray(v.zustAlle)?v.zustAlle.filter(Boolean):(v.zust?[v.zust]:[]), zIch=ZL.some(mlIch);
    ZL.filter(z=>mlIch(z)&&z.von&&!mlIch(z.von)&&(z.at||0)>=ab).forEach(z=>{ const mit=ZL.filter(x=>!mlIch(x)).map(x=>x.name).filter(Boolean);
      P("vz:"+v.id+":"+z.at,z.at,z.von,"hat dir einen Auftrag zugewiesen",`${kd}${v.anliegen?": "+v.anliegen:""}${mit.length?` · mit ${mit.join(", ")}`:""}`,go); });
    const meins=zIch||mlIch(v.createdBy);
    (v.notizen||[]).filter(n=>!mlIch(n.wer)&&(n.at||0)>=ab&&(meins||!ZL.length&&v&&anfVerw())).forEach(n=>P("vn:"+n.id,n.at,n.wer,`Notiz zu ${kd}`,n.text,go));
    if(v&&anfVerw()&&v.s&&v.s.anfrage&&!v.s.auftrag&&!v.abgelehnt&&!mlIch(v.s.anfrage.wer)&&(v.s.anfrage.at||0)>=ab) P("va:"+v.id,v.s.anfrage.at,v.s.anfrage.wer,"Neue Anfrage ans Büro",`${kd}${v.anliegen?": "+v.anliegen:""}`,go);
    /* Rückmeldungen an den, der angefragt hat (und an Zuständige/Auftraggeber): angenommen, abgelehnt, Termin, ausgeführt */
    const S=v.s||{}, anfr=(S.anfrage&&S.anfrage.wer)||v.createdBy, frisch=x=>x&&!mlIch(x.wer)&&(x.at||0)>=ab, was=`${kd}${v.anliegen?": "+v.anliegen:""}`;
    if(frisch(S.auftrag)&&mlIch(anfr)) P("vok:"+v.id+":"+S.auftrag.at,S.auftrag.at,S.auftrag.wer,"hat deine Anfrage angenommen",`${was}${S.auftrag.nr?` · SCC ${S.auftrag.nr}`:""}`,go);
    if(frisch(v.abgelehnt)&&mlIch(anfr)) P("vab:"+v.id+":"+v.abgelehnt.at,v.abgelehnt.at,v.abgelehnt.wer,"hat deine Anfrage abgelehnt",`${was}${v.abgelehnt.grund?` – ${v.abgelehnt.grund}`:""}`,go);
    if(frisch(S.termin)&&(mlIch(anfr)||zIch||(S.auftrag&&mlIch(S.auftrag.wer)))) P("vt:"+v.id+":"+S.termin.at,S.termin.at,S.termin.wer,"hat einen Termin eingetragen",`${kd} · ${S.termin.datum?S.termin.datum.split("-").reverse().join("."):""}${S.termin.zeit?` ${S.termin.zeit} Uhr`:""}${S.termin.mit?` · ${S.termin.mit}`:""}`,go);
    if(frisch(S.ausgefuehrt)&&(anfVerw()||mlIch(anfr)||(S.auftrag&&mlIch(S.auftrag.wer)))) P("vx:"+v.id+":"+S.ausgefuehrt.at,S.ausgefuehrt.at,S.ausgefuehrt.wer,"hat einen Auftrag als ausgeführt gemeldet",was,go); });
  /* Wünsche: Entwickler erfährt Neues, der Absender die Antwort */
  alle("wuensche").filter(w=>!w.inId).forEach(w=>{ const go={v:"wuensche"};
    if(typeof istEntwickler==="function"&&istEntwickler()&&!mlIch(w.von)&&(w.created||0)>=ab) P("wu:"+w.id,w.created,w.von,w.art==="fehler"?"hat einen Fehler gemeldet":w.art==="lob"?"hat Lob dagelassen":"hat einen Wunsch eingetragen",w.titel||"",go);
    if(mlIch(w.von)&&w.statusVon&&!mlIch(w.statusVon)&&(w.statusAm||0)>=ab){ const st={neu:"Neu",geplant:"Geplant",arbeit:"In Arbeit",fertig:"Umgesetzt",nein:"Abgelehnt"}[w.status||"neu"];
      P("wus:"+w.id+":"+w.statusAm,w.statusAm,w.statusVon,"hat deinen Eintrag beantwortet",`${w.titel||""} – ${st}${w.antwort?`: ${w.antwort}`:""}`,go); } });
  alle("notizen").filter(n=>!mlIch(n.createdBy)&&(n.sicht==="firma"||(n.sicht==="personen"&&(n.personen||[]).map(x=>String(x).toLowerCase()).includes(String(ME.mail).toLowerCase())))&&(n.updated||0)>=ab)
    .forEach(n=>P("no:"+n.id,n.updated,n.createdBy,"hat eine Notiz geteilt",n.titel||"Notiz",{v:"notizen"}));
  return L;
}
function meldungen(){ const S=mlSt(); return meldungenRoh().filter(m=>!S.weg[m.id]).sort((a,b)=>(S.pin[b.id]?1:0)-(S.pin[a.id]?1:0)||b.t-a.t); }
const mlNeu=()=>{ const S=mlSt(); return meldungen().filter(m=>!S.gel[m.id]).length; };
function mlGlocke(){ setTimeout(()=>{ try{ mlMelden(); }catch(e){} },0); const b=document.getElementById("glBtn"); if(!b) return; const n=ME.mail?mlNeu():0;
  b.dataset.act="mlAuf"; b.removeAttribute("data-v");
  b.hidden=!ME.mail||nav.v==="login"; const z=document.getElementById("glN"); if(z){ z.textContent=n>9?"9+":String(n); z.hidden=!n; } b.setAttribute("aria-label",n?`${n} neue Benachrichtigungen`:"Benachrichtigungen");
  if(document.getElementById("mlPop")) mlFuellen(); if(typeof seitenFussText==="function") seitenFussText(); }
function mlAv(m){
  if(!m.von) return `<span class="ml-av sys">${mlSvg("sys")}</span>`;
  const p=typeof profilVon==="function"&&profilVon(m.von.mail);
  return p&&p.bild?`<span class="ml-av" style="background-image:url('${p.bild}')"></span>`:`<span class="ml-av">${esc(initials(m.von.name||"?"))}</span>`; }
function mlName(m){ if(!m.von) return "System"; const p=typeof profilVon==="function"&&profilVon(m.von.mail), v=p&&[p.vorname,p.nachname].filter(Boolean).join(" "); return v||m.von.name||"Jemand"; }
/* Kategorien: am PC als Spalte links, auf iPad und Handy als wischbare Chip-Zeile. „Meldungen“ zeigt die offenen
   Meldungen aus Rahmenaufträgen selbst (antippbar, mit Punkt, wenn es dazu etwas Neues gibt). */
const ML_KAT=[["alle","Alle"],["meldung","Meldungen"],["auftrag","Aufträge"],["material","Material"],["baustelle","Baustellen"],["pruefung","Prüfungen und Geräte"],["wunsch","Wünsche"]];
const ML_KAT_VON={mz:"meldung",mn:"meldung",mf:"meldung",vz:"auftrag",vn:"auftrag",va:"auftrag",vok:"auftrag",vab:"auftrag",vt:"auftrag",vx:"auftrag",anf:"material",anfst:"material",ue:"baustelle",no:"baustelle",pr:"pruefung",fae:"pruefung",kal:"pruefung",wu:"wunsch",wus:"wunsch"};
const mlKatVon=id=>ML_KAT_VON[String(id).split(":")[0]]||"alle";
const mlHatMeldungen=()=>typeof mlFilter==="function"&&!!DB.vorgaenge&&[...DB.vorgaenge.values()].some(v=>v.rahmen&&!v.deleted);
/* Meldung angetippt ⇒ alles Neue dazu als gelesen */
function mlGelesenFuer(mid){ const S=mlSt(); let ch=false; meldungen().forEach(x=>{ if(x.id.split(":")[1]===mid&&mlKatVon(x.id)==="meldung"&&!S.gel[x.id]){ S.gel[x.id]=1; ch=true; } }); if(ch){ mlStSpeichern(); mlGlocke(); mlFuellen(); } }
/* Benachrichtigungen sind eine eigene Seite („meldungen“, in allen Apps mit Glocke) – mehr Platz als das frühere Fenster */
let ML_VON=null;
function mlFuellen(){
  const pop=document.getElementById("mlPop"), seite=document.getElementById("mlSeite"); if(!pop&&!seite) return; const S=mlSt(), L=meldungen(), neu=L.filter(m=>!S.gel[m.id]).length;
  const zeile=m=>`<div class="ml-it${S.gel[m.id]?"":" neu"}${S.pin[m.id]?" ml-gepinnt":""}" data-act="mlKlick" data-id="${esc(m.id)}" role="button" tabindex="0">${mlAv(m)}
    <span class="ml-tx"><span class="ml-k"><b>${esc(mlName(m))}</b>${S.pin[m.id]?`<span class="ml-pinz" title="Angepinnt">${mlSvg("pin")}</span>`:""}<span class="ml-zeit">${esc(wann(m.t))}</span>${S.gel[m.id]?"":`<i class="ml-punkt" aria-label="ungelesen"></i>`}</span>
      <span class="ml-h">${esc(m.h)}</span>${m.s?`<span class="ml-s">${esc(m.s)}</span>`:""}</span>
    <span class="ml-ak"><button class="ml-b${S.pin[m.id]?" an":""}" data-act="mlPin" data-id="${esc(m.id)}" aria-label="${S.pin[m.id]?"Nicht mehr anpinnen":"Anpinnen"}" title="${S.pin[m.id]?"Nicht mehr anpinnen":"Anpinnen"}">${mlSvg("pin")}</button>
    <button class="ml-b" data-act="mlWeg" data-id="${esc(m.id)}" aria-label="Entfernen" title="Entfernen">${mlSvg("weg")}</button></span></div>`;
  /* Kategorien nur auf der Seite */
  const K=seite?ML_KAT.filter(([k])=>k==="alle"||(k==="meldung"?mlHatMeldungen():L.some(m=>mlKatVon(m.id)===k))):[];
  let kat=META.mlKat||"alle"; if(!K.some(x=>x[0]===kat)) kat="alle";
  const ungel=k=>L.filter(m=>!S.gel[m.id]&&(k==="alle"||mlKatVon(m.id)===k)).length;
  const kats=K.length>1?`<nav class="ml-kats" aria-label="Kategorien">${K.map(([k,t])=>{ const n=ungel(k); return `<button class="ml-kat" data-act="mlKat" data-v="${k}" aria-pressed="${k===kat}"><span>${esc(t)}</span>${n?`<i>${n>99?"99+":n}</i>`:""}</button>`; }).join("")}</nav>`:"";
  if(seite&&kat==="meldung"){ /* die Meldungen selbst */
    const neuIds=new Set(L.filter(m=>!S.gel[m.id]&&mlKatVon(m.id)==="meldung").map(m=>m.id.split(":")[1]));
    const f=META.mlF||"offen", M=mlFilter(f), G=new Map(); (f==="fertig"?M.slice(0,60):M).forEach(m=>{ if(!G.has(m.rahmenId)) G.set(m.rahmenId,[]); G.get(m.rahmenId).push(m); });
    const fch=`<div class="chips vg-chips ml-fch">${ML_F.map(([k,tx])=>`<button class="chip" data-act="vgMlF" data-v="${k}" aria-pressed="${f===k}">${esc(tx)}${k==="fertig"?"":`<span class="chip-n">${mlFilter(k).length}</span>`}</button>`).join("")}</div>`;
    const leer={offen:"Keine offenen Meldungen.",frei:"Alle offenen Meldungen haben einen Zuständigen.",mein:"Dir ist keine offene Meldung zugeordnet.",spaeter:"Nichts zurückgestellt.",fertig:"Noch nichts abgeschlossen."}[f];
    const inhalt=fch+([...G].map(([rid,R])=>{ const r=DB.vorgaenge.get(rid);
      return `<div class="sec-row"><div class="sec-lbl">${esc(vgKunde(r))} · Rahmenauftrag${r.s&&r.s.auftrag&&r.s.auftrag.nr?` · SCC ${esc(r.s.auftrag.nr)}`:""}</div><span class="ab-btns"><button class="ab-ic" data-act="vgMlNeu" data-id="${esc(rid)}" aria-label="Meldung erfassen" title="Meldung erfassen">${icon("add")}</button></span></div>${R.map(m=>mlZeile(m,neuIds.has(m.id))).join("")}`; }).join("")||`<p class="meta" style="margin:16px 4px">${leer}</p>`);
    seite.innerHTML=`<div class="ml-wrap">${kats}<div class="ml-inhalt">${inhalt}</div></div>`; if(pop) pop.innerHTML=""; return; }
  const LK=kat==="alle"?L:L.filter(m=>mlKatVon(m.id)===kat), neuK=LK.filter(m=>!S.gel[m.id]).length;
  const pin=LK.filter(m=>S.pin[m.id]), rest=LK.filter(m=>!S.pin[m.id]);
  const html=`<div class="ml-kopf"><b>${seite?`${neuK?`${neuK} neu`:"Keine neuen"}`:"Benachrichtigungen"}</b>${neuK?`<button class="ml-alle" data-act="mlAlleGel">Alle gelesen</button>`:""}</div>
    <div class="ml-liste">${LK.length?`${pin.length?`<div class="ml-gr">Angepinnt</div>${pin.map(zeile).join("")}${rest.length?`<div class="ml-gr">Neueste</div>`:""}`:""}${rest.map(zeile).join("")}`
      :`<div class="ml-leer"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg><span>Aktuell keine Benachrichtigungen</span></div>`}</div>
    ${Object.keys(S.weg).length?`<div class="ml-fuss"><button class="btn-text" data-act="mlWiederher">Entfernte wieder anzeigen</button></div>`:""}`;
  if(pop) pop.innerHTML=html; if(seite) seite.innerHTML=`<div class="ml-wrap">${kats}<div class="ml-inhalt">${html}</div></div>`;
}
function mlAuf(){ mlZu(); if(nav.v==="meldungen"){ go(ML_VON||{v:"start"}); return; } ML_VON=nav; go({v:"meldungen"}); }
function mlPlatz(){ const pop=document.getElementById("mlPop"), z=document.querySelector("#seitenFuss:not([hidden]) .sf-gl"), b=z||document.getElementById("glBtn"); if(!pop||!b) return; const r=b.getBoundingClientRect();
  if(z){ /* PC: Zeile „Benachrichtigungen“ unten in der Seitenleiste – Fenster öffnet nach oben rechts daneben */
    pop.style.top="auto"; pop.style.right="auto"; pop.style.left=Math.round(r.right+12)+"px"; pop.style.bottom=Math.max(8,Math.round(innerHeight-r.bottom))+"px"; return; }
  pop.style.bottom=""; pop.style.left=""; pop.style.top=Math.round(r.bottom+8)+"px"; pop.style.right=Math.max(8,Math.round(innerWidth-r.right-8))+"px"; }
function mlZu(){ const p=document.getElementById("mlPop"); if(p) p.remove(); }
function mlStSpeichern(){ /* nur IDs behalten, die es noch gibt */ const S=mlSt(), da=new Set(meldungenRoh().map(m=>m.id)); ["gel","weg","pin"].forEach(k=>Object.keys(S[k]).forEach(id=>{ if(!da.has(id)) delete S[k][id]; })); metaSave(); }
document.addEventListener("click",e=>{
  const b=e.target.closest&&e.target.closest('[data-act="mlKat"],[data-act="mlAuf"],[data-act="mlKlick"],[data-act="mlPin"],[data-act="mlWeg"],[data-act="mlAlleGel"],[data-act="mlWiederher"]');
  if(!b){ const p=document.getElementById("mlPop"); if(p&&!p.contains(e.target)) mlZu(); return; }
  e.stopPropagation(); e.preventDefault(); const a=b.dataset.act, id=b.dataset.id, S=mlSt();
  if(a==="mlAuf") return mlAuf();
  if(a==="mlKat"){ META.mlKat=b.dataset.v; metaSave(); mlFuellen(); return; }
  if(a==="mlPin"){ if(S.pin[id]) delete S.pin[id]; else S.pin[id]=1; }
  else if(a==="mlWeg"){ S.weg[id]=1; delete S.pin[id]; S.gel[id]=1; }
  else if(a==="mlAlleGel"){ const k=META.mlKat||"alle"; meldungen().filter(m=>k==="alle"||mlKatVon(m.id)===k).forEach(m=>S.gel[m.id]=1); }
  else if(a==="mlWiederher"){ S.weg={}; }
  else if(a==="mlKlick"){ S.gel[id]=1; mlStSpeichern(); const m=meldungen().find(x=>x.id===id); mlZu(); mlGlocke(); if(m&&m.go) mlGo(m.go); else mlFuellen(); return; }
  mlStSpeichern(); mlFuellen(); mlGlocke();
},true);
document.addEventListener("keydown",e=>{ if(e.key==="Escape") mlZu(); });
addEventListener("resize",mlPlatz);
/* Ziel öffnen: in der Übersicht gibt es Baustellen/Notizen nicht als Ansicht ⇒ Baustelle-App */
function mlGo(z){
  if(z&&z.ml){ /* Meldung aus einem Rahmenauftrag: in der Kategorie „Meldungen“ öffnen */ META.mlKat="meldung"; metaSave(); if(nav.v!=="meldungen"){ ML_VON=nav; go({v:"meldungen"}); } else mlFuellen();
    const m=DB.vorgaenge&&DB.vorgaenge.get(z.ml), r=m&&DB.vorgaenge.get(m.rahmenId); if(r&&typeof mlDialog==="function") setTimeout(()=>mlDialog(r,m),0); return; }
  if(["baustelle","notizen"].includes(z.v)&&typeof notizenView!=="function"){ location.href="../baustelle/"; return; } go(z); }
function meldungenView(){ setTimeout(mlFuellen,0); return `<div class="narrow"><div class="ml-seite" id="mlSeite"></div></div>`; }

/* ===== Neue Meldungen ankündigen =====
   App im Vordergrund: kleines Banner oben (Antippen öffnet, verschwindet nach ein paar Sekunden).
   App offen, aber im Hintergrund (anderes Fenster, anderer Tab, minimiert): Benachrichtigung vom System (Windows/macOS/iPad-Home-Bildschirm-App),
   wenn auf diesem Gerät eingeschaltet. Läuft ohne Server – geht also nur, solange die App irgendwo offen ist.
   Was schon angekündigt wurde, merkt sich das Gerät (je Konto); beim allerersten Mal wird nichts nachgeholt. */
const ML_GEZ="irrgang_ml_gezeigt|", ML_PUSH="irrgang_ml_push";
const mlLs=(k,v)=>{ try{ if(v===undefined) return localStorage.getItem(k); localStorage.setItem(k,v); }catch(e){ return null; } };
const mlKannSys=()=>"Notification" in window;
const mlPushAn=()=>mlLs(ML_PUSH)==="1"&&mlKannSys()&&Notification.permission==="granted";
function mlMelden(){ if(!ME||!ME.mail||(typeof nav!=="undefined"&&nav.v==="login")) return;
  const key=ML_GEZ+String(ME.mail).toLowerCase(); let G=null; try{ G=JSON.parse(mlLs(key)||"null"); }catch(e){}
  const S=mlSt(), L=meldungen().filter(m=>!S.gel[m.id]&&m.von&&!String(m.id).includes("demo-"));
  /* erstes Mal auf diesem Gerät: erst nach dem ersten Abgleich den Stand merken, sonst würde alles Geholte als „neu“ aufpoppen */
  if(!Array.isArray(G)){ if(typeof SYNC_ON!=="undefined"&&SYNC_ON&&!(META.sync&&META.sync.last)) return; mlLs(key,JSON.stringify(L.map(m=>m.id))); return; }
  const set=new Set(G), neu=L.filter(m=>!set.has(m.id));
  if(!neu.length) return;
  mlLs(key,JSON.stringify([...G,...neu.map(m=>m.id)].slice(-400)));
  const frisch=neu.filter(m=>Date.now()-(m.t||0)<12*36e5); if(!frisch.length) return;
  const vorne=document.visibilityState==="visible"&&document.hasFocus();
  /* Ob Windows/macOS gerade stumm sind („Nicht stören“), kann eine Webseite nicht erfahren – dann bleibt nur die Zahl an der Glocke. */
  /* nur eins von beiden: geht die Systemmeldung raus, kein Banner in der App; ist sie aus, blockiert oder schlägt fehl, das Banner (bleibt stehen, bis man es sieht) */
  if(!vorne&&mlPushAn()){ mlSystem(frisch).then(ok=>{ if(!ok) mlBanner(frisch,true); }); return; }
  mlBanner(frisch,!vorne); }
function mlOeffnenId(id){ document.getElementById("mlBan")?.remove(); if(id==="test") return; const S=mlSt(), m=id&&meldungen().find(x=>x.id===id);
  if(!m){ mlAuf(); return; } S.gel[id]=1; mlStSpeichern(); mlGlocke(); if(m.go) mlGo(m.go); }
let mlBanT=null;
function mlBanner(neu,bleibt){ document.getElementById("mlBan")?.remove(); clearTimeout(mlBanT); const m=neu[0], n=neu.length;
  const d=document.createElement("div"); d.id="mlBan"; d.className="ml-ban"; d.setAttribute("role","status");
  d.innerHTML=`<button type="button" class="ml-ban-in" data-ban="${esc(n===1?m.id:"")}">${n===1?mlAv(m):`<span class="ml-av">${n}</span>`}
    <span class="ml-tx"><span class="ml-k"><b>${esc(n===1?mlName(m):`${n} neue Benachrichtigungen`)}</b><span class="ml-zeit">jetzt</span></span>
    <span class="ml-h">${esc(n===1?m.h:neu.slice(0,3).map(x=>`${mlName(x)}: ${x.h}`).join(" · "))}</span>${n===1&&m.s?`<span class="ml-s">${esc(m.s)}</span>`:""}</span></button>
    <button type="button" class="ml-ban-x" aria-label="Schließen" title="Schließen">${mlSvg("weg")}</button>`;
  document.body.appendChild(d);
  /* Zeit läuft erst, wenn man hinschaut; Maus drüber hält das Banner */
  const weg=()=>{ d.classList.add("geht"); setTimeout(()=>d.remove(),220); };
  if(bleibt) d.classList.add("bleibt");
  const start=()=>{ clearTimeout(mlBanT); if(!bleibt&&document.visibilityState==="visible") mlBanT=setTimeout(weg,n===1?7000:9000); };
  d.addEventListener("pointerenter",()=>clearTimeout(mlBanT)); d.addEventListener("pointerleave",start);
  d.addEventListener("click",e=>{ e.stopPropagation(); if(e.target.closest(".ml-ban-x")){ weg(); return; } const b=e.target.closest("[data-ban]"); if(b) mlOeffnenId(b.dataset.ban); });
  const sicht=()=>{ if(!document.body.contains(d)){ document.removeEventListener("visibilitychange",sicht); return; } start(); };
  document.addEventListener("visibilitychange",sicht); start(); }
/* Symbol der Systemmeldung: bei einer Meldung von einer Person deren Profilbild (rund), sonst die Initialen auf rotem Kreis;
   Sammel- und Systemmeldungen bekommen das App-Symbol mit abgerundeten Ecken statt der eckigen weißen Kachel. */
async function mlSysIcon(m,n){ const S=192, c=document.createElement("canvas"); c.width=c.height=S; const x=c.getContext("2d");
  const bildLaden=src=>new Promise(ok=>{ if(!src) return ok(null); const i=new Image(); i.onload=()=>ok(i); i.onerror=()=>ok(null); i.src=src; });
  const p=n===1&&m.von&&typeof profilVon==="function"?profilVon(m.von.mail):null, foto=p&&p.bild?await bildLaden(p.bild):null;
  if(n===1&&m.von){ x.beginPath(); x.arc(S/2,S/2,S/2,0,Math.PI*2); x.closePath(); x.clip();
    if(foto){ const k=Math.max(S/foto.width,S/foto.height), w=foto.width*k, h=foto.height*k; x.drawImage(foto,(S-w)/2,(S-h)/2,w,h); }
    else { x.fillStyle="#E11D2F"; x.fillRect(0,0,S,S); x.fillStyle="#fff"; x.font="700 76px system-ui,Segoe UI,Arial"; x.textAlign="center"; x.textBaseline="middle"; x.fillText(initials(mlName(m)),S/2,S/2+4); } }
  else { const app=await bildLaden((document.querySelector('link[rel="apple-touch-icon"]')||document.querySelector('link[rel~="icon"]')||{}).href); if(!app) return "";
    const r=S*.225; x.beginPath(); x.moveTo(r,0); x.arcTo(S,0,S,S,r); x.arcTo(S,S,0,S,r); x.arcTo(0,S,0,0,r); x.arcTo(0,0,S,0,r); x.closePath(); x.clip(); x.drawImage(app,0,0,S,S); }
  try{ return c.toDataURL("image/png"); }catch(e){ return ""; } }
async function mlSystem(neu){ const m=neu[0], n=neu.length;
  const titel=n===1?(m.von?`${mlName(m)} ${m.h}`:m.h):`${n} neue Benachrichtigungen`, text=n===1?(m.s||""):neu.slice(0,4).map(x=>`${mlName(x)}: ${x.h}`).join("\n");
  const ic=await mlSysIcon(m,n)||(document.querySelector('link[rel="apple-touch-icon"]')||{}).href, id=n===1?m.id:"", tag="irrgang-"+(id||"mehr");
  /* zuerst über den Service Worker (geht auch am iPad als Home-Bildschirm-App), sonst direkt */
  mlFehler="";
  try{ const r=navigator.serviceWorker&&await navigator.serviceWorker.getRegistration(); if(r&&r.showNotification){ await r.showNotification(titel,{body:text,icon:ic,tag,renotify:true,data:{ml:id}}); mlWeg="Service Worker"; return true; } mlFehler="kein Service Worker"; }catch(e){ mlFehler="Service Worker: "+(e&&e.message||e); }
  try{ const no=new Notification(titel,{body:text,icon:ic,tag}); no.onclick=()=>{ try{ window.focus(); }catch(e){} no.close(); mlOeffnenId(id); }; mlWeg="direkt"; return true; }catch(e){ mlFehler+=" · direkt: "+(e&&e.message||e); return false; } }
let mlFehler="", mlWeg="";
navigator.serviceWorker&&navigator.serviceWorker.addEventListener("message",e=>{ if(e.data&&"ml" in e.data) mlOeffnenId(e.data.ml); });
setInterval(mlMelden,10000);
/* Schalter in „Mehr“ */
function mlGeraetZeile(){ const geht=mlKannSys(), verw=geht&&Notification.permission==="denied", an=mlPushAn();
  const sub=!geht?"Dieser Browser kann keine Benachrichtigungen zeigen – am iPad die App vom Home-Bildschirm öffnen"
    :verw?"Im Browser blockiert – über das Schloss neben der Adresse wieder erlauben"
    :an&&/Windows/.test(navigator.userAgent)?"An – kommt nichts, unter Windows › Benachrichtigungen Chrome und die App erlauben, „Nicht stören“ aus"
    :"Neue Aufträge, Zuweisungen und Notizen auch melden, wenn die App im Hintergrund offen ist";
  return `<div class="li" role="button" tabindex="0" data-act="mlPushUm"><span class="av">${icon("glocke")}</span><span class="lt"><span class="h">Benachrichtigungen auf diesem Gerät</span><span class="s">${esc(sub)}</span></span><span class="schalter${an?" an":""}" aria-hidden="true"><i></i></span></div>
`; }
document.addEventListener("click",async e=>{ const b=e.target.closest&&e.target.closest('[data-act="mlPushUm"]'); if(!b) return; e.stopPropagation(); e.preventDefault();
  if(mlPushAn()){ mlLs(ML_PUSH,"0"); render(); toast("Benachrichtigungen auf diesem Gerät aus"); return; }
  if(!mlKannSys()){ toast("Dieser Browser kann keine Benachrichtigungen zeigen"); return; }
  let p=Notification.permission; if(p==="default"){ try{ p=await Notification.requestPermission(); }catch(x){} }
  if(p==="granted"){ mlLs(ML_PUSH,"1"); render(); toast("Benachrichtigungen an – du bekommst Bescheid, auch wenn die App im Hintergrund ist"); }
  else { render(); toast("Nicht erlaubt – im Browser bei dieser Seite Benachrichtigungen erlauben"); } },true);

/* Tests: in 10 Sekunden oder in 60 Minuten. Der lange Test merkt sich den Zeitpunkt im Gerät und prüft alle 15 Sekunden,
   ob er fällig ist – so sieht man, ob die App im Hintergrund weiterläuft (Text sagt, wie verspätet sie kam bzw. dass die App zwischendurch beendet war). */
const ML_TEST="irrgang_ml_test";
const mlUhr=t=>new Date(t).toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"});
function mlTestLesen(){ try{ return JSON.parse(mlLs(ML_TEST)||"null"); }catch(e){ return null; } }
async function mlTestZeigen(h,txt){ const m={id:"test",von:null,h,s:txt,t:Date.now()}; let sys=false; if(mlPushAn()) sys=await mlSystem([m]);
  if(!sys) mlBanner([m],!(document.visibilityState==="visible"&&document.hasFocus()));
  if(mlPushAn()&&!sys) toast("Systemmeldung fehlgeschlagen: "+(mlFehler||"unbekannt")); }
const mlLaeuftSeit=Date.now();
function mlTestPruefen(){ const T=mlTestLesen(); if(!T||Date.now()<T.f) return; mlLs(ML_TEST,"");
  const zu=Math.round((Date.now()-T.f)/60000), neu=T.start<mlLaeuftSeit-1000? false : true;
  const wie=T.min>=60?`${T.min/60} Std.`:`${T.min} Min.`;
  const txt=`Gestartet ${mlUhr(T.start)}, fällig ${mlUhr(T.f)}, gekommen ${mlUhr(Date.now())}`+(!neu?` – erst beim Öffnen der App gekommen (${zu} Min. später), die App war zwischendurch beendet`:zu>=2?` – ${zu} Min. verspätet, die App war so lange angehalten`:" – pünktlich");
  mlTestZeigen(`Test nach ${wie}`,txt); }
setInterval(mlTestPruefen,15000); setTimeout(mlTestPruefen,3000);
document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="visible") setTimeout(mlTestPruefen,500); });
function mlTestZeile(){ const T=mlTestLesen(), lang=T&&T.min>=60;
  return `<div class="li" role="button" tabindex="0" data-act="mlTest" data-min="0"><span class="av">${icon("send")}</span><span class="lt"><span class="h">Test-Benachrichtigung</span><span class="s">Kommt nach 10 Sekunden – vorher die App in den Hintergrund legen oder das Fenster minimieren</span></span>${icon("chev")}</div>
    <div class="li" role="button" tabindex="0" data-act="mlTest" data-min="60"><span class="av">${icon("send")}</span><span class="lt"><span class="h">Langzeit-Test (60 Minuten)</span><span class="s">${lang?`Läuft – fällig um ${mlUhr(T.f)}. Antippen bricht ab.`:"Prüft, ob Meldungen auch nach langer Zeit im Hintergrund kommen – App danach einfach liegen lassen"}</span></span>${icon("chev")}</div>`; }
/* Diagnose: zeigt, woran es liegt, wenn am PC nichts erscheint */
function mlDiagZeile(){ return `<div class="li" role="button" tabindex="0" data-act="mlDiag"><span class="av">${icon("info")}</span><span class="lt"><span class="h">Benachrichtigungen prüfen</span><span class="s">Zeigt Erlaubnis, Schalter und sendet sofort eine Meldung</span></span>${icon("chev")}</div>`; }
document.addEventListener("click",async e=>{ const b=e.target.closest&&e.target.closest('[data-act="mlDiag"]'); if(!b) return; e.stopPropagation(); e.preventDefault();
  const sw=navigator.serviceWorker?await navigator.serviceWorker.getRegistration().catch(()=>null):null, win=/Windows/.test(navigator.userAgent), mac=/Macintosh/.test(navigator.userAgent)&&!("ontouchend" in document);
  const app=matchMedia("(display-mode: standalone)").matches||matchMedia("(display-mode: window-controls-overlay)").matches;
  const z=[["Browser kann Meldungen",mlKannSys()?"ja":"nein"],["Erlaubnis",mlKannSys()?({granted:"erlaubt",denied:"blockiert",default:"noch nicht gefragt"}[Notification.permission]):"–"],
    ["Schalter in „Mehr“",mlLs(ML_PUSH)==="1"?"an":"aus"],["Service Worker",sw?"aktiv":"fehlt"],["Läuft als",app?"installierte App":"Browser-Tab"]];
  let ok=false; if(mlKannSys()&&Notification.permission==="granted") ok=await mlSystem([{id:"test",von:null,h:"Prüfung",s:"Wenn du das siehst, klappen Benachrichtigungen auf diesem Gerät.",t:Date.now()}]);
  z.push(["Testmeldung",mlKannSys()&&Notification.permission==="granted"?(ok?`abgeschickt (${mlWeg})`:`Fehler: ${mlFehler}`):"nicht möglich ohne Erlaubnis"]);
  const tipp=win?`<p><b>Kam trotz „abgeschickt“ nichts an?</b> Dann hält Windows sie zurück:</p><ul><li>Windows-Einstellungen › System › Benachrichtigungen: oben „Benachrichtigungen“ an, darunter <b>Google Chrome</b>${app?" und <b>"+esc(document.title.split(" · ")[0])+"</b>":""} an</li><li>„Nicht stören“ bzw. „Fokus“ aus</li><li>In Chrome: Einstellungen › Datenschutz › Website-Einstellungen › Benachrichtigungen – diese Seite muss erlaubt sein</li></ul>`
    :mac?`<p><b>Kam trotz „abgeschickt“ nichts an?</b> Systemeinstellungen › Mitteilungen › Google Chrome (bzw. die App) erlauben, „Nicht stören“/Fokus aus.</p>`:`<p>Kam trotz „abgeschickt“ nichts an, blockiert das Betriebssystem die Meldungen (Einstellungen › Mitteilungen).</p>`;
  dialog("Benachrichtigungen prüfen",`<div class="list">${z.map(([k,v])=>`<div class="li"><span class="lt"><span class="h">${esc(v)}</span><span class="s">${esc(k)}</span></span></div>`).join("")}</div><div style="margin-top:12px">${tipp}</div>`,`<button class="btn-text" data-act="cancel">Schließen</button>`); },true);
let mlTestT=null;
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act="mlTest"]'); if(!b) return; e.stopPropagation(); e.preventDefault();
  const min=+b.dataset.min||0, hin=mlPushAn()?"":" – für Meldungen im Hintergrund oben „Benachrichtigungen auf diesem Gerät“ einschalten";
  if(min){ const T=mlTestLesen(); if(T&&T.min>=60){ mlLs(ML_TEST,""); render(); toast("Langzeit-Test abgebrochen"); return; }
    const jetzt=Date.now(); mlLs(ML_TEST,JSON.stringify({start:jetzt,f:jetzt+min*60000,min})); render(); toast(`Langzeit-Test läuft – kommt um ${mlUhr(jetzt+min*60000)}${hin}`); return; }
  clearTimeout(mlTestT); toast(mlPushAn()?"Kommt in 10 Sekunden – jetzt App wechseln oder Fenster minimieren":"Kommt in 10 Sekunden als Banner"+hin);
  mlTestT=setTimeout(()=>mlTestZeigen("Test-Benachrichtigung","So sieht eine Meldung aus – bei echten Meldungen öffnet Antippen den Auftrag."),10000); },true);

/* ===== Simulation: kompletter Auftragsablauf mit echten Benachrichtigungen (nur Entwickler) =====
   Legt Vorgänge nur auf diesem Gerät an (demo + sim: werden nie abgeglichen) und spielt Kollegen nach:
   1. Kollege stellt eine Anfrage ans Büro – du erteilst (oder lehnst ab) selbst unter „Aufträge“
   2. Chef nimmt deine eigene Anfrage an   3. Chef weist dir einen Auftrag zu   4. Chef lehnt eine andere Anfrage von dir ab
   5. nach deiner Bestätigung trägt ein Kollege den Termin ein   6. … und meldet ihn als ausgeführt   7. Notiz zu deinem Auftrag
   Die Schritte laufen weiter, wenn die App im Hintergrund ist – so sieht man die Meldungen wie im echten Betrieb. */
const SIM_KEY="irrgang_sim";
const simDel=id=>{ if(typeof dbDelHard==="function") return dbDelHard("vorgaenge",id); DB.vorgaenge.delete(id); try{ dbOf("vorgaenge").transaction("vorgaenge","readwrite").objectStore("vorgaenge").delete(id); }catch(e){} };
const simLesen=()=>{ try{ return JSON.parse(mlLs(SIM_KEY)||"null"); }catch(e){ return null; } };
const simSchreiben=S=>mlLs(SIM_KEY,S?JSON.stringify(S):"");
function simLeute(){ const T=(typeof team==="function"?team():[]).filter(m=>m.mail&&!mlIch(m)), w=m=>({name:m.name,mail:m.mail});
  const chef=T.find(m=>/^info@/.test(m.mail))||T[0]||{name:"J. Irrgang",mail:"info@elektro-irrgang.de"}, rest=T.filter(m=>m!==chef);
  return {chef:w(chef),a:w(rest[0]||{name:"M. Seipp",mail:"m.seipp@elektro-irrgang.de"}),b:w(rest[1]||rest[0]||{name:"A. Brandl",mail:"a.brandl@elektro-irrgang.de"})}; }
function simVg(id,daten){ let v=DB.vorgaenge.get(id); const neu=!v; v=Object.assign(v||{id,demo:true,sim:true},daten); if(neu){ v.created=Date.now(); }
  v.updated=Date.now(); dbPut("vorgaenge",v); return v; }
const simTag=n=>{ const d=new Date(Date.now()+n*864e5); return d.toISOString().slice(0,10); };
function simStart(){ if(!DB.vorgaenge){ toast("Aufträge gibt es in dieser App nicht"); return; } simEnde(true);
  const L=simLeute(), ich=who(), t=Date.now(), S={start:t,schritt:0,ich:{name:ich.name,mail:ich.mail},L,ids:{A:"sim-a-"+t,B:"sim-b-"+t,C:"sim-c-"+t,D:"sim-d-"+t},nach:0};
  /* deine eigenen Anfragen (warten aufs Büro) */
  simVg(S.ids.C,{kundeName:"Familie Becker (Simulation)",anliegen:"Herdanschluss prüfen, Sicherung fliegt",createdBy:S.ich,s:{anruf:{wer:S.ich,at:t-60000},anfrage:{wer:S.ich,at:t-50000}}});
  simVg(S.ids.D,{kundeName:"Hausverwaltung Klein (Simulation)",anliegen:"Außensteckdose Garage",createdBy:S.ich,s:{anruf:{wer:S.ich,at:t-40000},anfrage:{wer:S.ich,at:t-30000}}});
  simSchreiben(S); render();
  toast(anfVerw()?"Simulation läuft – gleich kommt eine Anfrage ans Büro. Öffne sie und erteile den Auftrag (oder lehn ab).":"Simulation läuft – die Meldungen kommen in den nächsten Minuten"); }
function simEnde(still){ const S=simLesen(); if(S&&S.ids) Object.values(S.ids).forEach(id=>{ if(DB.vorgaenge&&DB.vorgaenge.has(id)) simDel(id); });
  if(DB.vorgaenge) [...DB.vorgaenge.values()].filter(v=>v.sim).forEach(v=>simDel(v.id));
  simSchreiben(null); if(!still){ render(); toast("Simulation beendet – die Beispiel-Aufträge sind entfernt"); } }
function simTick(){ const S=simLesen(); if(!S||!DB.vorgaenge) return; const t=Date.now()-S.start, {chef,a,b}=S.L, A=DB.vorgaenge.get(S.ids.A); let tat=false;
  const schritt=(n,bed,fn)=>{ if(S.schritt===n&&bed){ fn(); S.schritt=n+1; S.nach=Date.now(); tat=true; } };
  schritt(0,t>=5000,()=>simVg(S.ids.A,{kundeName:"Bäckerei Krämer (Simulation)",anliegen:"FI löst immer wieder aus",dringend:true,createdBy:a,s:{anruf:{wer:a,at:Date.now()-20000},anfrage:{wer:a,at:Date.now()}}}));
  schritt(1,t>=20000,()=>{ const v=DB.vorgaenge.get(S.ids.C); if(v){ v.s.auftrag={wer:chef,at:Date.now(),nr:"26-1187"}; simVg(v.id,v); } });
  schritt(2,t>=32000,()=>simVg(S.ids.B,{kundeName:"Autohaus Lenz (Simulation)",anliegen:"Wallbox prüfen (Wiederholungsprüfung)",createdBy:chef,
    s:{anruf:{wer:chef,at:Date.now()-90000},anfrage:{wer:chef,at:Date.now()-80000},auftrag:{wer:chef,at:Date.now()-70000,nr:"26-1190"}},zust:{mail:S.ich.mail,name:S.ich.name,at:Date.now(),von:chef},zustAlle:[{mail:S.ich.mail,name:S.ich.name,at:Date.now(),von:chef},{mail:a.mail,name:a.name,at:Date.now(),von:chef}]}));
  schritt(3,t>=44000,()=>{ const v=DB.vorgaenge.get(S.ids.D); if(v){ v.abgelehnt={wer:chef,at:Date.now(),grund:"An die Hausverwaltung verwiesen"}; simVg(v.id,v); } });
  /* Schritt 4 wartet auf dich: Auftrag zur Anfrage A erteilen oder ablehnen. Bist du nicht im Büro, übernimmt das der Chef. */
  const erteilt=A&&A.s&&A.s.auftrag, abgelehnt=A&&A.abgelehnt;
  if(S.schritt===4&&A&&!erteilt&&!abgelehnt&&!anfVerw()&&t>=60000){ A.s.auftrag={wer:chef,at:Date.now(),nr:"26-1191"}; simVg(A.id,A); }
  schritt(4,(erteilt||abgelehnt)&&Date.now()-S.nach>=3000,()=>{ if(abgelehnt) S.schritt=5; });
  schritt(5,Date.now()-S.nach>=10000,()=>{ if(A&&A.s&&A.s.auftrag&&!A.abgelehnt){ A.s.termin={wer:b,at:Date.now(),datum:simTag(2),zeit:"08:00",mit:b.name}; simVg(A.id,A); } });
  schritt(6,Date.now()-S.nach>=12000,()=>{ if(A&&A.s&&A.s.termin&&!A.abgelehnt){ A.s.ausgefuehrt={wer:a,at:Date.now()}; simVg(A.id,A); } });
  schritt(7,Date.now()-S.nach>=8000,()=>{ const v=DB.vorgaenge.get(S.ids.B); if(v){ v.notizen=[...(v.notizen||[]),{id:"sim-n-"+Date.now(),at:Date.now(),wer:b,text:"Kunde ist erst ab 10 Uhr da, Schlüssel liegt beim Pförtner."}]; simVg(v.id,v); } });
  if(S.schritt>=8&&!S.fertig){ S.fertig=Date.now(); tat=true; }
  simSchreiben(S);
  if(tat){ mlGlocke(); if(typeof nav!=="undefined"&&(nav.v==="auftraege"||nav.v==="mehr")&&$("#dlg").hidden) render(); if(S.fertig&&document.visibilityState==="visible") toast("Simulation durch – über „Simulation beenden“ räumst du die Beispiel-Aufträge weg"); } }
setInterval(simTick,2000);
const SIM_TXT=["Gleich: Kollege stellt eine Anfrage ans Büro","Chef nimmt deine Anfrage an","Chef weist dir einen Auftrag zu","Chef lehnt deine zweite Anfrage ab","Wartet auf dich: Anfrage „Bäckerei Krämer“ unter Aufträge bestätigen oder ablehnen","Kollege trägt den Termin ein","Kollege meldet den Auftrag als ausgeführt","Kollege schreibt eine Notiz zu deinem Auftrag","fertig"];
function simZeile(){ if(!DB.vorgaenge) return ""; const S=simLesen();
  return `<div class="li" role="button" tabindex="0" data-act="simUm"><span class="av">${icon(S?"done":"info")}</span><span class="lt"><span class="h">${S?"Simulation beenden":"Auftragsablauf simulieren"}</span><span class="s">${S
      ?esc(`Schritt ${Math.min(S.schritt+1,8)} von 8: ${SIM_TXT[Math.min(S.schritt,8)]} – antippen beendet und entfernt die Beispiel-Aufträge`)
      :"Anfrage, Bestätigung, Zuweisung, Ablehnung, Termin, ausgeführt und Notiz – mit echten Benachrichtigungen, nur auf diesem Gerät"}</span></span>${icon("chev")}</div>`; }
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act="simUm"]'); if(!b) return; e.stopPropagation(); e.preventDefault(); if(simLesen()) simEnde(); else simStart(); },true);
