/* ===== Bibliothek – gemeinsam für alle Apps (tools/build.py setzt sie ein) =====
   Zeigt alles Abgelegte: Prüfprotokolle und Baustellenberichte (PDFs im Gerätespeicher „evse_protokolle“, den alle Apps teilen),
   fertige Prüfungen aus der Share (wo die App Prüfungen kennt) und Dokumente/Fotos aus den Kundenablagen (Übersicht).
   Suche, Art-Chips, Filter-Fenster (Sortierung, Kunde), Kacheln/Liste als Schieberegler. Zustand je Gerät in META. */
const BB_ART=[["alle","Alle"],["prot","Prüfprotokolle"],["bericht","Baustellenberichte"],["dok","Dokumente"],["foto","Fotos"]];
const BB_IC={prot:"ev",bericht:"baustelle",dok:"doc",foto:"cam"};
const BB_SORT=[["neu","Neueste zuerst"],["alt","Älteste zuerst"],["name","Name A–Z"],["kunde","Kunde A–Z"]];
const BB_P={liste:"M19 13H5c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2zm0 6H5v-4h14v4zm0-16H5c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 6H5V5h14v4z",
  ordner:"M9.17 6l2 2H20v10H4V6h5.17M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z",
  kacheln:"M3 3v8h8V3H3zm6 6H5V5h4v4zm-6 4v8h8v-8H3zm6 6H5v-4h4v4zm4-16v8h8V3h-8zm6 6h-4V5h4v4zm-6 4v8h8v-8h-8zm6 6h-4v-4h4v4z",filt:"M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"};
const bbIc=k=>BB_P[k]?`<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="${BB_P[k]}"/></svg>`:icon(k);
let BB_PROT=[], bbGeladen=false;
/* ===== Bibliothek auf allen Geräten =====
   Zu jedem abgelegten PDF gibt es einen kleinen Datensatz „protokolle“, der mit den anderen Daten abgeglichen wird.
   Das PDF selbst liegt in SharePoint (EVSE: Prüfprotokolle/<Kunde>/<Standort>, Baustelle: Baustellen/Berichte/<Kunde>/<Baustelle>).
   Andere Geräte zeigen den Eintrag sofort und holen das PDF beim ersten Öffnen (danach liegt es auch dort im Gerät). */
const bbSync=()=>typeof DB!=="undefined"&&!!DB.protokolle&&typeof saveRec==="function";
const bbAppName=a=>a==="baustelle"?"Baustelle":a==="echeck"?"E-Check":"EVSE";
const BB_FELDER=["app","pruefungId","echeckId","kundeId","standortId","ladeparkId","baustelleId","name","titel","datum","art","auftragsnr","pruefer","ergebnis","nr","unterschrift","fassung","size","von","created"];
const bbFs=v=>String(v||"").replace(/[\\/:*?"<>|#%\u0000-\u001f]/g,"-").replace(/\s+/g," ").trim().replace(/[. ]+$/,"").slice(0,80)||"Unbenannt";
function bbZiel(x){ const k=bbKunde(x.kundeId), nm=(M,id)=>id&&M&&M.get(id)?M.get(id).name:"";
  if(k&&!k.demo) return {bib:"kd",pfad:[KD_WURZEL,kdOrdName(k),...kdOrtProt(x)].join("/")+"/"+bbFs(x.name)+".pdf"}; /* Kundenordner (ablage.js) */
  if(x.app==="baustelle") return {bib:"baustellen",pfad:["Berichte",k?k.name:"Ohne Kunde",nm(DB.baustellen,x.baustelleId)||String(x.titel||"").split(" · ").pop()||"Baustelle"].map(bbFs).join("/")+"/"+bbFs(x.name)+".pdf"};
  const dir=[k&&k.name,nm(DB.standorte,x.standortId),nm(DB.ladeparks,x.ladeparkId)].filter(Boolean).map(bbFs).join("/")||"Ohne Zuordnung";
  return {bib:"pdf",pfad:dir+"/"+bbFs(x.name)+".pdf"}; }
function bbProtMelden(x,opt){ if(!bbSync()||!x||x.demo||x.ausShare||DB.protokolle.has(x.id)) return; opt=opt||{};
  const z=opt.pfad&&!bbKunde(x.kundeId)?{bib:opt.bib||"pdf",pfad:opt.pfad}:bbZiel(x), r={id:x.id,bib:z.bib,pfad:z.pfad};
  BB_FELDER.forEach(f=>{ if(x[f]!==undefined&&x[f]!=="") r[f]=x[f]; });
  saveRec("protokolle",r,true);
  if(typeof SYNC_ON!=="undefined"&&SYNC_ON){ META.sync.protQueue=[...new Set([...(META.sync.protQueue||[]),x.id])]; metaSave(); }
  if(nav&&nav.v==="bibliothek"){ const rs=document.getElementById("res"); if(rs) rs.innerHTML=bibListe(); } }
function bbProtOben(id){ META.sync.protQueue=(META.sync.protQueue||[]).filter(x=>x!==id); metaSave(); }
function bbProtWeg(id){ if(!bbSync()) return; const r=DB.protokolle.get(id); bbProtOben(id); if(r&&!r.deleted){ r.deleted=true; saveRec("protokolle",r); } }
async function bbHoch(lib,pfad,blob){
  const i=pfad.lastIndexOf("/"), dir=pfad.slice(0,i), file=pfad.slice(i+1), fid=await folderId(dir,lib);
  if(blob.size<3.5*1048576){ const r=await g(`/drives/${fid}:/${encodeURIComponent(file)}:/content`,{method:"PUT",headers:{"Content-Type":"application/pdf"},body:blob}); if(!r.ok) throw new Error(`PDF hochladen fehlgeschlagen (${r.status})`); return; }
  const s=await gj(`/drives/${fid}:/${encodeURIComponent(file)}:/createUploadSession`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({item:{"@microsoft.graph.conflictBehavior":"replace"}})}), CH=320*1024*10;
  for(let o=0;o<blob.size;o+=CH){ const part=blob.slice(o,Math.min(o+CH,blob.size));
    const r=await fetch(s.uploadUrl,{method:"PUT",headers:{"Content-Range":`bytes ${o}-${o+part.size-1}/${blob.size}`},body:part}); if(!r.ok&&r.status!==202) throw new Error(`PDF hochladen fehlgeschlagen (${r.status})`); } }
/* beim Abgleich: ältere PDFs dieses Geräts einmalig melden, dann die Warteschlange hochladen */
async function pushProtokolle(){
  if(!bbSync()) return; if(!bbGeladen) await bbLaden();
  const weg=new Set([...DB.protokolle.values()].filter(r=>r.deleted).map(r=>r.id));
  BB_PROT.forEach(x=>{ if(!weg.has(x.id)&&!x.demo&&!x.ausShare&&!DB.protokolle.has(x.id)) bbProtMelden(x); });
  /* Prüfungen, deren PDF schon in der Share liegt (auch von Geräten mit älterer App): ein Eintrag „pa-<Prüfung>“, damit Baustelle und E-Check sie ebenfalls zeigen */
  if(DB.pruefungen){ const mit=new Set([...DB.protokolle.values()].filter(r=>!r.deleted&&!String(r.id).startsWith("pa-")).map(r=>r.pruefungId).filter(Boolean));
    for(const pr of DB.pruefungen.values()){ if(pr.deleted||pr.demo||!pr.pdfAblage||mit.has(pr.id)) continue; const id="pa-"+pr.id, alt=DB.protokolle.get(id);
      if(alt&&(alt.pfad===pr.pdfAblage||alt.umzugVon===pr.pdfAblage)) continue;
      const k=bbKunde(pr.kundeId), st=pr.standortId&&DB.standorte?DB.standorte.get(pr.standortId):null, pp=pr.p||{};
      const r=Object.assign(alt||{id},{app:"evse",bib:String(pr.pdfAblage).startsWith(KD_WURZEL+"/")?"kd":"pdf",pfad:pr.pdfAblage,pruefungId:pr.id,kundeId:pr.kundeId||"",standortId:pr.standortId||"",ladeparkId:pr.ladeparkId||"",
        name:String(pr.pdfAblage).split("/").pop().replace(/\.pdf$/i,""),titel:[k&&k.name,st&&st.name].filter(Boolean).join(" · ")||"Prüfung",datum:pp.datum||"",art:pp.art||"",auftragsnr:pp.auftragsnr||"",pruefer:pp.pruefer||"",created:pr.updated||Date.now(),von:pr.updatedBy||null});
      if(typeof protoResult==="function") try{ r.ergebnis=protoResult(pr)==="bad"?"bad":"ok"; }catch(e){}
      delete r.deleted; saveRec("protokolle",r,!alt); } }
  for(const id of [...(META.sync.protQueue||[])]){
    const r=DB.protokolle.get(id); if(!r||r.deleted){ bbProtOben(id); continue; }
    const b=await bbBlob(id).catch(()=>null); if(!b){ bbProtOben(id); continue; }
    if(r.bib!=="kd"&&!r.umzugVon&&bbKunde(r.kundeId)){ const z=bbZiel(r); if(z.bib==="kd"){ r.bib="kd"; r.pfad=z.pfad; saveRec("protokolle",r); } } /* Warteschlange von vor dem Umbau */
    if(r.bib==="kd"){ const it=await kdHoch(r.kundeId,kdRest(r.pfad),b,"replace"); if(it){ if(r.item!==it.id){ r.item=it.id; saveRec("protokolle",r); } bbProtOben(id); continue; } r.bib="pdf"; r.pfad="Ohne Zuordnung/"+r.pfad.split("/").pop(); saveRec("protokolle",r); }
    await bbHoch(BIB[r.bib]||BIB.pdf,r.pfad,b); bbProtOben(id); }
}
/* PDF eines anderen Geräts holen, im Gerät ablegen und öffnen */
async function bbFern(id){
  const r=DB.protokolle&&DB.protokolle.get(id); if(!r) return;
  if(r.demo){ if(typeof demoProtBlob!=="function") return; const blob=await demoProtBlob(r), x={id:r.id,demo:true}; BB_FELDER.forEach(f=>{ if(r[f]!==undefined) x[f]=r[f]; }); x.size=blob.size; x.created=r.created||Date.now();
    try{ const d=await new Promise((res,rej)=>{ const q=indexedDB.open("evse_protokolle"); q.onupgradeneeded=()=>{ const z=q.result; if(!z.objectStoreNames.contains("meta")) z.createObjectStore("meta",{keyPath:"id"}); if(!z.objectStoreNames.contains("blob")) z.createObjectStore("blob"); }; q.onsuccess=()=>res(q.result); q.onerror=()=>rej(q.error); });
      const tx=d.transaction(["meta","blob"],"readwrite"); tx.objectStore("meta").put(x); tx.objectStore("blob").put(blob,x.id); await new Promise(ok=>{ tx.oncomplete=ok; tx.onerror=ok; }); d.close(); }catch(e){}
    BB_PROT.push(x); if(typeof PROT!=="undefined"&&!PROT.some(y=>y.id===x.id)) PROT.push(x); const rs=document.getElementById("res"); if(rs) rs.innerHTML=bibListe(); bbOeffnen(x.id); return; }
  if(!(typeof SYNC_ON!=="undefined"&&SYNC_ON&&ME.signedIn)){ toast("Das PDF liegt in der Share – dafür bitte anmelden"); return; }
  if(!navigator.onLine){ toast("Kein Internet – das PDF liegt in der Share"); return; }
  toast("PDF wird geladen …");
  try{ await syncRoot(); const it=r.bib==="kd"?await kdItem(r.kundeId,kdRest(r.pfad),r.item):await kdAltItem(BIB[r.bib]||BIB.pdf,r.pfad);
    if(!it) throw {status:404}; const blob=await (await readItem(it)).blob();
    const x={id:r.id}; BB_FELDER.forEach(f=>{ if(r[f]!==undefined) x[f]=r[f]; }); x.size=blob.size; x.vonGeraet=true;
    const d=await new Promise((res,rej)=>{ const q=indexedDB.open("evse_protokolle"); q.onsuccess=()=>res(q.result); q.onerror=()=>rej(q.error); });
    const tx=d.transaction(["meta","blob"],"readwrite"); tx.objectStore("meta").put(x); tx.objectStore("blob").put(blob,x.id); await new Promise(ok=>{ tx.oncomplete=ok; tx.onerror=ok; }); d.close();
    BB_PROT.push(x); if(typeof PROT!=="undefined"&&!PROT.some(y=>y.id===x.id)) PROT.push(x);
    const rs=document.getElementById("res"); if(rs) rs.innerHTML=bibListe(); bbOeffnen(x.id);
  }catch(e){ toast(e&&e.status===404?"Das PDF ist noch nicht in der Share – das andere Gerät lädt es beim nächsten Abgleich hoch":"PDF konnte nicht geladen werden"); }
}
async function bbLaden(){
  try{ const d=await new Promise((res,rej)=>{ const r=indexedDB.open("evse_protokolle"); r.onupgradeneeded=()=>{ const x=r.result; if(!x.objectStoreNames.contains("meta")) x.createObjectStore("meta",{keyPath:"id"}); if(!x.objectStoreNames.contains("blob")) x.createObjectStore("blob"); }; r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error); });
    BB_PROT=d.objectStoreNames.contains("meta")?await new Promise(res=>{ const q=d.transaction("meta").objectStore("meta").getAll(); q.onsuccess=()=>res(q.result||[]); q.onerror=()=>res([]); }):[]; d.close(); }catch(e){ BB_PROT=[]; }
  bbGeladen=true; if(nav.v==="bibliothek"){ const r=document.getElementById("res"); if(r) r.innerHTML=bibListe(); else render(); }
}
const bbW=k=>{ const s=(META.bb||{})[k]; return s||{sort:"neu",art:"alle",kunde:"alle"}[k]; };
const bbSet=(k,v)=>{ META.bb=Object.assign({},META.bb||{},{[k]:v}); metaSave(); const r=document.getElementById("res"); if(r) r.innerHTML=bibListe(); const f=document.querySelector(".bb-f"); if(f) f.classList.toggle("an",bbAktiv()); };
const bbAktiv=()=>bbW("sort")!=="neu"||bbW("kunde")!=="alle";
const bbAnsicht=()=>["kacheln","ordner"].includes(META.bibAnsicht)?META.bibAnsicht:"liste";
const bbKunde=id=>{ const k=id&&typeof kundeOf==="function"?kundeOf(id):(id&&DB.kunden?DB.kunden.get(id):null); return k&&!k.deleted?k:null; };
const bbDatum=d=>d?String(d).split("-").reverse().join("."):"";
function bbEintraege(){
  const L=[], kn=id=>(bbKunde(id)||{}).name||"", P=bbSync()?[...DB.protokolle.values()]:[], weg=new Set(P.filter(r=>r.deleted).map(r=>r.id)), hier=new Set(BB_PROT.map(x=>x.id));
  const lokal=new Set([...BB_PROT,...P.filter(r=>!r.deleted)].map(x=>x.pruefungId).filter(Boolean));
  const ortP=x=>({ort:kdOrtProt(x),file:x.pfad?String(x.pfad).split("/").pop():bbFs(x.name)+".pdf",item:x.item||(DB.protokolle&&DB.protokolle.get(x.id)||{}).item||""});
  const protE=(x,ziel,fern)=>({...ortP(x),art:x.app==="baustelle"?"bericht":"prot",titel:x.titel||x.name,kundeId:x.kundeId||"",kunde:kn(x.kundeId),t:x.created||0,st:x.standortId||"",bs:x.baustelleId||"",bsName:x.baustelleId?String(x.titel||"").split(" · ").pop():"",
    info:[bbAppName(x.app),x.art,bbDatum(x.datum),x.auftragsnr&&`Auftrag ${x.auftragsnr}`,x.von&&x.von.name,fern&&"auf einem anderen Gerät erstellt"].filter(Boolean).join(" · "),
    pill:x.ergebnis?pill(x.ergebnis,x.ergebnis==="bad"?"nicht bestanden":"bestanden"):"",ziel});
  const echt=new Set([...BB_PROT,...P.filter(r=>!r.deleted&&!String(r.id).startsWith("pa-"))].map(x=>x.pruefungId).filter(Boolean)); /* „pa-“ nur, solange es zur Prüfung kein richtiges Protokoll gibt */
  P.filter(r=>!r.deleted&&!hier.has(r.id)&&!(String(r.id).startsWith("pa-")&&echt.has(r.pruefungId))).forEach(r=>L.push(protE(r,`data-act="bbFern" data-id="${esc(r.id)}"`,!r.demo)));
  const demo=typeof demoAn==="function"&&demoAn();
  BB_PROT.filter(x=>(!x.demo||(demo&&DB.protokolle&&DB.protokolle.has(x.id)))&&!weg.has(x.id)).forEach(x=>L.push({...ortP(x),art:x.app==="baustelle"?"bericht":"prot",titel:x.titel||x.name,kundeId:x.kundeId||"",kunde:kn(x.kundeId),t:x.created||0,st:x.standortId||"",bs:x.baustelleId||"",bsName:x.baustelleId?String(x.titel||"").split(" · ").pop():"",
    info:[bbAppName(x.app),x.art,bbDatum(x.datum),x.auftragsnr&&`Auftrag ${x.auftragsnr}`,x.von&&x.von.name].filter(Boolean).join(" · "),
    pill:x.ergebnis?pill(x.ergebnis,x.ergebnis==="bad"?"nicht bestanden":"bestanden"):"",ziel:`data-act="bbOeffnen" data-id="${esc(x.id)}"`}));
  if(DB.pruefungen) [...DB.pruefungen.values()].filter(p=>!p.deleted&&p.pdfAblage&&!lokal.has(p.id)&&(!p.demo||(typeof demoAn==="function"&&demoAn()))).forEach(p=>{
    const s=p.standortId&&DB.standorte?DB.standorte.get(p.standortId):null;
    L.push({ort:kdOrtProt({app:"evse",standortId:p.standortId,ladeparkId:p.ladeparkId}),file:String(p.pdfAblage).split("/").pop(),art:"prot",titel:[kn(p.kundeId),s&&s.name].filter(Boolean).join(" › ")||"Prüfung",kundeId:p.kundeId||"",kunde:kn(p.kundeId),t:p.updated||0,st:p.standortId||"",
      info:["EVSE",p.p&&p.p.art,p.p&&bbDatum(p.p.datum),"PDF in der Share"].filter(Boolean).join(" · "),pill:"",
      ziel:`data-act="bbShare" data-id="${esc(p.id)}"`}); });
  if(DB.dateien) [...DB.dateien.values()].filter(d=>!d.deleted).forEach(d=>{ const st=d.bezugKind==="standorte"&&DB.standorte?DB.standorte.get(d.bezugId):null, vg=d.bezugKind==="vorgaenge"&&DB.vorgaenge?DB.vorgaenge.get(d.bezugId):null, k=bbKunde(d.bezugKind==="kunden"?d.bezugId:st?st.kundeId:vg&&vg.kundeId), bild=/^image\//.test(d.typ||"");
    L.push({ort:kdOrtDatei(d),file:d.ablage||kdDateiName(d),item:d.item||"",art:bild?"foto":"dok",titel:d.name||"Datei",kundeId:k?k.id:"",kunde:k?k.name:"",t:d.created||0,bild:bild?d.id:"",st:st?st.id:"",
      info:[k&&k.name,st&&st.name,d.created&&new Date(d.created).toLocaleDateString("de-DE")].filter(Boolean).join(" · "),pill:"",ziel:`data-act="dateiOeffnen" data-id="${esc(d.id)}"`}); });
  return L;
}
function bbGruppe(L,name,item){ const gr=[], b=x=>{ const c=String(x||"").trim().normalize("NFD").replace(/[̀-ͯ]/g,"").charAt(0).toUpperCase(); return /[A-Z]/.test(c)?c:"#"; };
  L.forEach(x=>{ const k=b(name(x)); if(!gr.length||gr[gr.length-1][0]!==k) gr.push([k,[]]); gr[gr.length-1][1].push(x); });
  return gr.map(([k,G])=>`<div class="abc-gr"><div class="abc-b" aria-hidden="true">${k}</div><div class="abc-l">${listOf(G.map(item))}</div></div>`).join(""); }
function bbMonate(L,item){ let h="", m=null, g=[]; const fl=()=>{ if(g.length) h+=`<div class="sec-lbl">${esc(m)}</div>${listOf(g)}`; g=[]; };
  for(const x of L){ const mm=x.t?new Date(x.t).toLocaleDateString("de-DE",{month:"long",year:"numeric"}):"Ohne Datum"; if(mm!==m){ fl(); m=mm; } g.push(item(x)); } fl(); return h; }
/* ===== Ordner-Ansicht: automatisch nach Kunde, darin Standorte und Baustellen – niemand muss einsortieren ===== */
let BB_ORT={k:null,p:[]}; /* k: Kunde, p: Ordnerpfad im Kundenordner (z. B. ["Prüfprotokolle","Halle 2"]) */
const bbPEnc=p=>encodeURIComponent(JSON.stringify(p||[])), bbPDec=v=>{ try{ const p=JSON.parse(decodeURIComponent(v||"")); return Array.isArray(p)?p.map(String):[]; }catch(e){ return []; } };
/* Ordner wie in der Dateien-App/GoodNotes: Farbe und Symbol je Kunde (steht am Kunden, gilt also für alle Geräte und alle im Team) */
const BB_FARBEN=[["papier","Papier","#E2C68C"],["rot","Rot","#E06A60"],["orange","Orange","#EE9F4C"],["gelb","Gelb","#E9C64A"],["gruen","Grün","#6DBB7B"],["tuerkis","Türkis","#4DB6AC"],["blau","Blau","#4FA6D8"],["violett","Violett","#9A80D2"],["rosa","Rosa","#E58FB4"],["grau","Grau","#A3A9B1"]];
const BB_SYM={kunde:"M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",stern:"M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z",
  blitz:"M7 2v11h3v9l7-12h-4l4-8z",
  wallbox:"M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33 0 1.38 1.12 2.5 2.5 2.5.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V9c0-.69-.28-1.32-.73-1.77zM18 10c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zM8 18v-4.5H6L10 6v5h2l-4 7z",
  haus:"M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",
  firma:"M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z",
  fabrik:"M22 22H2V10l7-3v2l5-2v3h3l1-8h3l1 8v12zM12 9.95l-5 2V10l-3 1.32V20h16v-8h-8V9.95zM11 18h2v-4h-2v4zm-4 0h2v-4H7v4zm10-4h-2v4h2v-4z",
  laden:"M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z",
  apotheke:"M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z",
  schule:"M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z",
  kirche:"M18 12.22V9l-5-2.5V5h2V3h-2V1h-2v2H9v2h2v1.5L6 9v3.22L2 14v8h8v-4c0-1.1.9-2 2-2s2 .9 2 2v4h8v-8l-4-1.78z",
  sonne:"M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z",
  werkzeug:"M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z",
  herz:"M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
  ort:"M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
  baustelle:"M13.78 15.3L19.78 21.3L21.89 19.14L15.89 13.14L13.78 15.3M17.5 10.1C17.11 10.1 16.69 10.05 16.36 9.91L4.97 21.25L2.86 19.14L10.27 11.74L8.5 9.96L7.78 10.66L6.33 9.25V12.11L5.63 12.81L2.11 9.25L2.81 8.55H5.62L4.22 7.14L7.78 3.58C8.95 2.41 10.83 2.41 12 3.58L9.89 5.74L11.3 7.14L10.59 7.85L12.38 9.63L14.2 7.75C14.06 7.42 14 7 14 6.63C14 4.66 15.56 3.11 17.5 3.11C18.09 3.11 18.61 3.25 19.08 3.53L16.41 6.2L17.91 7.7L20.58 5.03C20.86 5.5 21 6 21 6.63C21 8.55 19.45 10.1 17.5 10.1Z"};
/* Kunden-Ordner tragen standardmäßig das Kunden-Symbol; „Ohne“ wird als sym:"ohne" gemerkt */
const BB_SYM_WAHL=["kunde","stern","blitz","wallbox","haus","firma","fabrik","laden","apotheke","schule","kirche","sonne","werkzeug","herz"];
const bbFarbe=f=>(BB_FARBEN.find(x=>x[0]===f)||BB_FARBEN[0])[2];
/* Ordner-Bild im GoodNotes-Stil: Rückwand mit weicher Lasche, ein Blatt Papier schaut heraus, Vorderseite mit sanftem Verlauf, Symbol eingeprägt (dunkel mit heller Unterkante) */
let BB_GID=0;
const BB_HELL=new Set(["papier","gelb"]);
function bbOrdnerBild(farbe,sym){ const g="bbg"+(++BB_GID), f=BB_FARBEN.some(x=>x[0]===farbe)?farbe:"papier";
  return `<svg class="bb-mappe${BB_HELL.has(f)?" hell":""}" viewBox="0 0 120 100" style="--o:${bbFarbe(f)}" aria-hidden="true">
    <defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".45" stop-color="#fff" stop-opacity=".06"/><stop offset="1" stop-color="#000" stop-opacity=".06"/></linearGradient></defs>
    <rect class="osh" x="6" y="38" width="108" height="61" rx="13"/><rect class="osh" x="4" y="36" width="112" height="62" rx="12" opacity=".5"/><path class="ob" d="M2 20a12 12 0 0 1 12-12h25c3.6 0 5.8 1.3 8 3.7l2.6 2.8c1.9 2 3.9 3.5 7.4 3.5H106a12 12 0 0 1 12 12v54a12 12 0 0 1-12 12H14A12 12 0 0 1 2 84z"/>
    <rect class="op2" x="15" y="20" width="90" height="46" rx="5" transform="rotate(-3 60 43)"/><rect class="op" x="13" y="22" width="94" height="46" rx="5"/>
    <rect class="of" x="2" y="32" width="116" height="64" rx="12"/><rect x="2" y="32" width="116" height="64" rx="12" fill="url(#${g})"/>
    <path class="ol" d="M14 32.6h92a11.4 11.4 0 0 1 11.4 11.4" fill="none" stroke-width="1.2"/>
    ${sym&&BB_SYM[sym]?`<svg x="45" y="49.8" width="30" height="30" viewBox="0 0 24 24"><path class="osl" d="${BB_SYM[sym]}"/></svg><svg x="45" y="49" width="30" height="30" viewBox="0 0 24 24"><path class="os" d="${BB_SYM[sym]}"/></svg>`:""}</svg>`; }
/* ===== Ordner-Menü: Rechtsklick oder der Pfeil neben dem Namen (PC), lange drücken (iPad/Handy, dort kein Pfeil) ===== */
IC.bbFarbe=IC.bbFarbe||"M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z";
IC.bbOffen=IC.bbOffen||"M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z";
IC.bbInfo=IC.bbInfo||"M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z";
IC.bbWeb=IC.bbWeb||"M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z";
const bbOrdWeb=(k,p)=>{ if(!p.length){ const r=kdoRec(k); return (r&&r.web)||""; } const c=BB_SP.get(bbSpKey(k,p.slice(0,-1))), f=c&&c.ordner.find(o=>o.name===p[p.length-1]); return (f&&f.web)||""; };
function bbOrdnerMenue(el,x,y){
  const k=el.dataset.k, p=bbPDec(el.dataset.p), kd=k&&k!==BB_OHNE?bbKunde(k):null, darf=!!(kd&&(typeof kdDarf==="function"?kdDarf(kd):typeof canEdit==="function"&&canEdit(kd)));
  const oeffnen=()=>{ BB_ORT={k,p}; const r=document.getElementById("res"); if(r) r.innerHTML=bibListe(); scrollTo(0,0); };
  const st=p.length>=2&&kd&&DB.standorte?[...DB.standorte.values()].find(s=>!s.deleted&&s.kundeId===k&&bbFs(s.name)===p[1]):null;
  const bs=p.length>=2&&kd&&p[0]===kdKat("berichte")&&typeof baustelleView==="function"&&DB.baustellen?[...DB.baustellen.values()].find(b=>!b.deleted&&b.kundeId===k&&bbFs(b.name)===p[1]):null;
  const web=bbOrdWeb(k,p);
  kontextMenu(x,y,[{t:"Öffnen",ic:"bbOffen",fn:oeffnen},"-",
    !p.length&&kd&&{t:"Zum Kunden",ic:"firma",fn:()=>go({v:"kunde",id:kd.id})},
    !p.length&&darf&&typeof locDialog==="function"&&{t:"Kunde bearbeiten",ic:"edit",fn:()=>locDialog("kunden",kd)},
    !p.length&&darf&&{t:"Farbe und Symbol",ic:"bbFarbe",fn:()=>bbStilFenster(el.querySelector(".bb-mm")||el,kd.id)},
    st&&{t:"Zum Standort",ic:"ort",fn:()=>go({v:"standort",id:st.id})},
    bs&&{t:"Zur Baustelle",ic:"baustelle",fn:()=>go({v:"baustelle",id:bs.id})},
    web&&{t:"In SharePoint öffnen",ic:"bbWeb",fn:()=>window.open(web,"_blank","noopener")},
    {t:"Eigenschaften",ic:"bbInfo",fn:()=>bbEigenschaften(k,p)}]);
}
const bbOrdSym=(p,name)=>!p.length?KD_SYM[kdKatVon(name)]||"":p[0]===kdKat("berichte")?"baustelle":p[0]===kdKat("prot")||p[0]===kdKat("fotos")?"ort":"";
function bbEigenschaften(k,p){
  const kd=k&&k!==BB_OHNE?bbKunde(k):null, unter=x=>p.every((s,i)=>x.ort[i]===s);
  const A=bbEintraege().filter(x=>(x.kundeId||BB_OHNE)===k&&unter(x)), EINZ={prot:"Prüfprotokoll",bericht:"Baustellenbericht",dok:"Dokument",foto:"Foto"}, arten=BB_ART.filter(([a])=>a!=="alle").map(([a,t])=>{ const n=A.filter(x=>x.art===a).length; return [n===1?EINZ[a]:t,n]; }).filter(x=>x[1]);
  const U=new Set(A.filter(x=>x.ort.length>p.length).map(x=>x.ort[p.length]));
  const t=A.length?Math.max(...A.map(x=>x.t||0)):0, tag=v=>v?new Date(v).toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric"}):"";
  const name=p.length?p[p.length-1]:kd?kd.name:"Ohne Kunde", r=kd&&kdoRec(k);
  const z=(l,v)=>v?`<div class="bb-ez"><small>${esc(l)}</small><span>${esc(v)}</span></div>`:"";
  const st=(kd&&kd.ordner)||{};
  dialog(name,`<div class="bb-eig"><div class="bb-ebild">${bbOrdnerBild(st.farbe,p.length?bbOrdSym(p.slice(0,-1),name):kd?(st.sym||"kunde"):"")}</div><div class="bb-el">
      ${z("Art",p.length?(p.length===1?"Ordner":"Unterordner")+(kd?` von ${kd.name}`:""):"Kunden-Ordner")}
      ${!p.length?z("Kundennummer",kd&&kd.kdnr)+z("Adresse",kd&&typeof adrText==="function"?adrText(kd):""):""}
      ${z("Inhalt",`${A.length} ${A.length===1?"Datei":"Dateien"}${arten.length?" – "+arten.map(([t,n])=>`${n} ${t}`).join(", "):""}`)}
      ${z("Unterordner",U.size?String(U.size):"")}
      ${z("In SharePoint",r&&r.name?["Kundendaten",KD_WURZEL,r.name,...p].join(" › "):"")}
      ${z("Zuletzt hinzugefügt",tag(t))}
      ${!p.length?z("Angelegt",kd&&[tag(kd.created),kd.createdBy&&kd.createdBy.name].filter(Boolean).join(" · ")):""}</div></div>`,
    `<span style="flex:1"></span><button class="btn-text" data-act="cancel">Schließen</button>`);
}
/* lange drücken (Finger/Stift) */
let bbLp=null, bbLpZeit=0;
document.addEventListener("pointerdown",e=>{ if(e.pointerType==="mouse") return; const m=e.target.closest&&e.target.closest(".bb-m[data-k]"); if(!m) return;
  const x=e.clientX, y=e.clientY; bbLp={x,y,t:setTimeout(()=>{ bbLp=null; bbLpZeit=Date.now(); if(navigator.vibrate) try{ navigator.vibrate(10); }catch(_){} bbOrdnerMenue(m,x,y); },480)}; });
document.addEventListener("pointermove",e=>{ if(bbLp&&Math.hypot(e.clientX-bbLp.x,e.clientY-bbLp.y)>10){ clearTimeout(bbLp.t); bbLp=null; } });
["pointerup","pointercancel"].forEach(t=>document.addEventListener(t,()=>{ if(bbLp){ clearTimeout(bbLp.t); bbLp=null; } },true));
addEventListener("scroll",()=>{ if(bbLp){ clearTimeout(bbLp.t); bbLp=null; } },true);
document.addEventListener("click",e=>{ if(Date.now()-bbLpZeit<700&&!(e.target.closest&&e.target.closest("#menu,#dlg,#fpop"))){ e.stopImmediatePropagation(); e.preventDefault(); } },true);
document.addEventListener("contextmenu",e=>{ const m=e.target.closest&&e.target.closest(".bb-m[data-k]"); if(!m) return; e.preventDefault(); if(Date.now()-bbLpZeit<1000) return; bbOrdnerMenue(m,e.clientX,e.clientY); });
function bbStilFenster(btn,kid){
  document.getElementById("fpop")?.remove(); document.getElementById("fpopBg")?.remove();
  const k=DB.kunden&&DB.kunden.get(kid); if(!k) return;
  const bg=document.createElement("div"); bg.id="fpopBg"; document.body.appendChild(bg); const m=document.createElement("div"); m.id="fpop"; m.className="fpop bb-stil";
  const male=()=>{ const o=k.ordner||{};
    m.innerHTML=`<div class="fp-t">Farbe</div><div class="bb-farben">${BB_FARBEN.map(([v,t,c])=>`<button type="button" class="bb-fa" data-sf="${v}" style="--o:${c}" aria-pressed="${(o.farbe||"papier")===v}" aria-label="${t}" title="${t}"></button>`).join("")}</div>
      <div class="fp-t">Symbol</div><div class="bb-syms"><button type="button" class="bb-sy ohne" data-ss="ohne" aria-pressed="${o.sym==="ohne"}" title="Ohne Symbol">Ohne</button>${BB_SYM_WAHL.map(v=>`<button type="button" class="bb-sy" data-ss="${v}" aria-pressed="${(o.sym||"kunde")===v}" title="${v}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${BB_SYM[v]}"/></svg></button>`).join("")}</div>`; };
  male(); document.body.appendChild(m);
  const r=btn.getBoundingClientRect(), w=Math.min(340,innerWidth-16); m.style.width=w+"px"; m.style.left=Math.max(8,Math.min(r.left+r.width/2-w/2,innerWidth-w-8))+"px";
  const unten=innerHeight-r.bottom; if(unten>330){ m.style.top=(r.bottom+8)+"px"; } else { m.style.bottom=(innerHeight-r.top+8)+"px"; }
  m.addEventListener("click",e=>{ const f=e.target.closest("[data-sf]"), y=e.target.closest("[data-ss]"); if(!f&&!y) return;
    const o=Object.assign({},k.ordner||{}); if(f) o.farbe=f.dataset.sf; if(y) o.sym=y.dataset.ss; if(o.farbe==="papier") delete o.farbe; if(!o.sym||o.sym==="kunde") delete o.sym;
    k.ordner=Object.keys(o).length?o:undefined; if(!k.ordner) delete k.ordner; saveRec("kunden",k); male(); const rs=document.getElementById("res"); if(rs) rs.innerHTML=bibListe(); });
  const zu=()=>{ m.remove(); bg.remove(); removeEventListener("resize",zu); }; bg.addEventListener("click",zu); addEventListener("resize",zu);
}
const BB_OHNE="_ohne";
/* Trennstellen für lange Ordnernamen – bricht dann sauber „Baustellen-berichte“ statt mitten im Wort */
const BB_TRENN=[["Baustellenberichte","Baustellen\u00ADberichte"],["Prüfprotokolle","Prüf\u00ADprotokolle"],["Datenblätter","Daten\u00ADblätter"],["Handbücher","Hand\u00ADbücher"],["Schriftverkehr","Schrift\u00ADverkehr"]];
const bbTrenn=n=>BB_TRENN.reduce((a,[x,y])=>a.split(x).join(y),String(n));
function bbOrdner(L,zeile){
  const kn=id=>id===BB_OHNE?"Ohne Kunde":(bbKunde(id)||{}).name||"Unbekannter Kunde", kk=x=>x.kundeId||BB_OHNE;
  const tag=t=>t?new Date(t).toLocaleDateString("de-DE"):"";
  const mappe=(attrs,name,art,n,t,stil,menu)=>`<div class="bb-m" ${attrs}><button class="bb-mk" data-act="bbOrdner" ${attrs} aria-label="${esc(name)} öffnen">${bbOrdnerBild(stil.farbe,stil.sym)}</button>
      <div class="bb-mn"><button class="bb-mt" data-act="bbOrdner" ${attrs}>${esc(bbTrenn(name))}</button>${menu!==false?`<button class="bb-mm" data-act="bbMenue" ${attrs} aria-label="Ordner-Menü" title="Öffnen, SharePoint, Eigenschaften"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg></button>`:""}</div>
      <small>${esc([art,n?`${n} ${n===1?"Eintrag":"Einträge"}`:"Leer",t&&tag(t)].filter(Boolean).join(" · "))}</small></div>`;
  const kStil=k=>{ const r=k!==BB_OHNE&&bbKunde(k), o=Object.assign({},(r&&r.ordner)||{}); if(r&&!o.sym) o.sym="kunde"; return o; };
  /* gleich heißende Kunden bleiben getrennte Ordner (Schlüssel ist der Kunde selbst); Reihenfolge dann nach Kundennummer */
  const kdnr=id=>String((bbKunde(id)||{}).kdnr||"");
  const nach=(a,b)=>a[2].localeCompare(b[2],"de",{numeric:true})||kdnr(a[0]).localeCompare(kdnr(b[0]),"de",{numeric:true})||String(a[0]).localeCompare(String(b[0]));
  /* ohne Filter: jeder Kunde hat seinen Ordner, auch wenn noch nichts drin liegt */
  const alle=bbW("art")==="alle"&&bbW("kunde")==="alle";
  if(!BB_ORT.k||!(L.some(x=>kk(x)===BB_ORT.k)||(alle&&BB_ORT.k!==BB_OHNE&&bbKunde(BB_ORT.k)))){ BB_ORT={k:null,p:[]};
    const M=new Map(); if(alle&&DB.kunden) [...DB.kunden.values()].filter(k=>!k.deleted).forEach(k=>M.set(k.id,[]));
    L.forEach(x=>{ const k=kk(x); if(!M.has(k)) M.set(k,[]); M.get(k).push(x); });
    const O=[...M].map(([k,G])=>[k,G,kn(k)]).sort((a,b)=>(a[0]===BB_OHNE)-(b[0]===BB_OHNE)||nach(a,b));
    if(!O.length) return `<p class="meta">Noch keine Kunden.</p>`;
    return `<div class="bb-oraster">${O.map(([k,G,n])=>mappe(`data-k="${esc(k)}"`,n,"",G.length,Math.max(0,...G.map(x=>x.t||0)),kStil(k),true)).join("")}</div>`; }
  const k=BB_ORT.k, ohne=k===BB_OHNE, p=BB_ORT.p, K=L.filter(x=>kk(x)===k), gleich=x=>p.every((s,i)=>x.ort[i]===s);
  const sub=new Map(), add=(n,c,t)=>{ const o=sub.get(n)||{n:0,t:0}; o.n+=c; o.t=Math.max(o.t,t||0); sub.set(n,o); };
  K.filter(x=>x.ort.length>p.length&&gleich(x)).forEach(x=>add(x.ort[p.length],1,x.t));
  if(!p.length&&!ohne) KD_ORD.forEach(([,n])=>add(n,0,0));
  const sp=ohne?null:bbSpStand(k,p), bekannt=new Set(L.map(x=>x.item).filter(Boolean));
  if(sp) sp.ordner.forEach(f=>{ const o=sub.get(f.name); if(!o) add(f.name,f.n,0); else if(f.n>o.n) o.n=f.n; });
  const F=K.filter(x=>x.ort.length===p.length&&gleich(x)), namen=new Set(F.map(x=>x.file));
  const extra=sp?sp.dateien.filter(f=>!bekannt.has(f.id)&&!namen.has(f.name)).sort((a,b)=>b.t-a.t):[];
  const rang=n=>{ const i=KD_ORD.findIndex(x=>x[1]===n); return p.length||i<0?99:i; };
  const O=[...sub].sort((a,b)=>rang(a[0])-rang(b[0])||a[0].localeCompare(b[0],"de",{numeric:true}));
  const stil=kStil(k), zur=p.length?`data-k="${esc(k)}" data-p="${bbPEnc(p.slice(0,-1))}"`:`data-k=""`;
  const kette=[[kn(k),[]],...p.map((s,i)=>[s,p.slice(0,i+1)])];
  const kat=kdKatVon(p[0]), hier=!ohne&&p.length<=1&&(!p.length||KD_DOK.includes(kat)||kat==="fotos");
  const pfad=`<nav class="bb-pfad" aria-label="Ordnerpfad"><button class="bb-zur" data-act="bbOrdner" ${zur} aria-label="Zurück" title="Zurück">${icon("chev")}</button>
    <button class="bb-pt" data-act="bbOrdner" data-k="">Alle Kunden</button>${kette.map(([n,pp],i)=>`<span class="bb-ps">›</span>`+(i===kette.length-1?`<b>${esc(n)}</b>`:`<button class="bb-pt" data-act="bbOrdner" data-k="${esc(k)}" data-p="${bbPEnc(pp)}">${esc(n)}</button>`)).join("")}
    ${hier?`<span class="bb-pl"></span><button class="ab-ic" data-act="bbHier" data-k="${esc(k)}" data-v="${kat==="fotos"?"fotos":kat}" aria-label="Hier ablegen" title="${kat==="fotos"?"Foto hier ablegen":"Datei hier ablegen"}">${icon(kat==="fotos"?"cam":"add")}</button>`:""}</nav>`;
  const spZeile=f=>`<div class="li" role="button" tabindex="0" data-act="bbSp" data-id="${esc(f.id)}"><span class="av">${icon(/^image\//.test(f.mime)?"cam":"doc")}</span>
    <span class="lt"><span class="h">${esc(f.name)}</span><span class="s">${esc(["In SharePoint abgelegt",f.von,f.t&&tag(f.t)].filter(Boolean).join(" · "))}</span></span>${icon("chev")}</div>`;
  const raster=O.length?`<div class="bb-kw"><div class="bb-oraster${!p.length&&!ohne?" kat":""}">${O.map(([n,o])=>mappe(`data-k="${esc(k)}" data-p="${bbPEnc([...p,n])}"`,n,"",o.n,o.t,{farbe:stil.farbe,sym:bbOrdSym(p,n)},true)).join("")}</div></div>`:"";
  const zeilen=[...F.map(zeile),...extra.map(spZeile)];
  return pfad+raster+(zeilen.length?(O.length?`<div class="sec-lbl">Dateien</div>`:"")+listOf(zeilen):O.length?"":`<p class="meta">${hier?"Noch nichts abgelegt. Dateien kommen über den Knopf oben rechts oder direkt in SharePoint hier hinein.":"Noch nichts abgelegt."}</p>`);
}
/* ===== Aufträge, Prüfungen und Baustellen im Kundenordner (nur Ordner-Ansicht) – auch ohne PDF =====
   Jede App zeigt, was sie kennt: Übersicht Aufträge, EVSE-Prüfungen und Baustellen; EVSE Prüfungen; Baustelle Baustellen und Aufträge; E-Check E-Checks.
   Hat eine Prüfung schon ein PDF, steht dort nur das PDF. Antippen öffnet den Eintrag in dieser App oder bietet die passende App an. */
const bbSymIc=s=>`<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="${BB_SYM[s]||BB_SYM.auftrag}"/></svg>`;
const bbZeile=x=>`<div class="li" role="button" tabindex="0" ${x.ziel}><span class="av">${x.sym?bbSymIc(x.sym):icon(BB_IC[x.art])}</span><span class="lt"><span class="h">${esc(x.titel)}</span><span class="s">${esc(x.info)}</span>${x.pill?`<span class="st">${x.pill}</span>`:""}</span>${icon("chev")}</div>`;
function bbAuftraege(){
  const L=[], demo=typeof demoAn==="function"&&demoAn(), ok=r=>r&&!r.deleted&&(!r.demo||demo)&&r.kundeId&&bbKunde(r.kundeId), kn=id=>(bbKunde(id)||{}).name||"";
  const nm=(k,id)=>id&&DB[k]&&DB[k].get(id)?DB[k].get(id).name:"", dt=v=>v?bbDatum(String(v).slice(0,10)):"";
  const mitPdf=new Set([...(DB.protokolle?DB.protokolle.values():[])].filter(r=>!r.deleted).flatMap(r=>[r.pruefungId,r.echeckId]).filter(Boolean));
  BB_PROT.forEach(x=>{ if(x.pruefungId) mitPdf.add(x.pruefungId); if(x.echeckId) mitPdf.add(x.echeckId); });
  const neu=(r,o)=>L.push(Object.assign({kundeId:r.kundeId,kunde:kn(r.kundeId),t:r.updated||r.created||0,file:"",item:"",pill:""},o));
  if(DB.vorgaenge) for(const v of DB.vorgaenge.values()){ if(!ok(v)) continue; const st=typeof vgStufe==="function"?vgStufe(v):-1, nr=v.s&&v.s.auftrag&&v.s.auftrag.nr;
    neu(v,{art:"auftrag",sym:"auftrag",ort:[kdKat("angebote")],titel:v.anliegen||"Auftrag",t:(v.s&&v.s.anruf&&v.s.anruf.at)||v.created||0,
      info:["Auftrag",v.abgelehnt?"abgelehnt":typeof VG_T!=="undefined"&&st>=0?VG_T[st]:"",nr&&`SCC ${nr}`,v.created&&new Date(v.created).toLocaleDateString("de-DE")].filter(Boolean).join(" · "),
      ziel:`data-act="bbAuf" data-k="vg" data-id="${esc(v.id)}"`}); }
  if(DB.pruefungen) for(const p of DB.pruefungen.values()){ if(!ok(p)||p.pdfAblage||mitPdf.has(p.id)) continue; const pp=p.p||{};
    neu(p,{art:"auftrag",sym:"blitz",ort:kdOrtProt({app:"evse",standortId:p.standortId,ladeparkId:p.ladeparkId}),titel:[pp.art||"Wallbox-Prüfung",nm("standorte",p.standortId)].filter(Boolean).join(" · "),
      info:["EVSE-Prüfung",dt(pp.datum),pp.auftragsnr&&`Auftrag ${pp.auftragsnr}`].filter(Boolean).join(" · "),pill:pill("wip","ohne PDF"),ziel:`data-act="bbAuf" data-k="pr" data-id="${esc(p.id)}"`}); }
  if(DB.echecks) for(const e of DB.echecks.values()){ if(!ok(e)||(e.pdf&&e.pdf.length)||mitPdf.has(e.id)) continue; const art=typeof EC_ART!=="undefined"&&EC_ART[e.art||"anlage"]||"E-Check";
    neu(e,{art:"auftrag",sym:"haus",ort:kdOrtProt({app:"echeck",standortId:e.standortId}),titel:[e.titel||art,nm("standorte",e.standortId)].filter(Boolean).join(" · "),
      info:[art,dt(e.datum),e.status==="fertig"?"abgeschlossen":"in Arbeit",e.auftragsnr&&`Auftrag ${e.auftragsnr}`].filter(Boolean).join(" · "),pill:pill("wip","ohne PDF"),ziel:`data-act="bbAuf" data-k="ec" data-id="${esc(e.id)}"`}); }
  if(DB.baustellen) for(const b of DB.baustellen.values()){ if(!ok(b)) continue;
    neu(b,{art:"auftrag",sym:"baustelle",ort:[kdKat("berichte"),bbFs(b.name||"Baustelle")],titel:b.name||"Baustelle",info:["Baustelle",b.status==="fertig"?"abgeschlossen":"läuft"].join(" · "),ziel:`data-act="bbAuf" data-k="bau" data-id="${esc(b.id)}"`}); }
  return L; }
function bbAufOeffnen(k,id){
  const weiter=(app,pfad,t)=>toast(`${t} liegt in der App ${app}`,`${app} öffnen`,()=>{ location.href=pfad; });
  if(k==="vg"){ const v=DB.vorgaenge&&DB.vorgaenge.get(id); if(!v) return; if(typeof vgOpen==="function") return vgOpen(v); return weiter("Übersicht","../uebersicht/","Der Auftrag"); }
  if(k==="pr"){ if(typeof oeffne==="function"&&typeof EDITOR!=="undefined") return oeffne(id); return weiter("EVSE","../evse/","Die Prüfung"); }
  if(k==="ec"){ const e=DB.echecks&&DB.echecks.get(id); if(e) return go({v:"ec",id,tab:e.status==="fertig"?"abschluss":"auftrag"}); return weiter("E-Check","../echeck/","Die Prüfung"); }
  if(k==="bau"){ if(typeof baustelleView==="function"&&DB.baustellen&&DB.baustellen.get(id)) return go({v:"baustelle",id}); return weiter("Baustelle","../baustelle/","Die Baustelle"); } }
function bibListe(){
  if(!bbGeladen){ bbLaden(); return ""; }
  const art=bbW("art"), ku=bbW("kunde"), so=bbW("sort"), q=String(query||"").toLowerCase(), H=v=>String(v||"").toLowerCase().includes(q);
  const A=bbEintraege(), zahl=a=>a==="alle"?A.length:A.filter(x=>x.art===a).length;
  const nurOrdner=!A.length&&bbAnsicht()==="ordner"&&!q&&DB.kunden&&[...DB.kunden.values()].some(k=>!k.deleted); /* Kundenordner gibt es auch ohne Dateien */
  if(nurOrdner) return bbOrdner(bbAuftraege().filter(x=>ku==="alle"||x.kundeId===ku),bbZeile);
  if(!A.length) return `<div class="empty bib-leer">${icon("folder")}<h2>Noch nichts in der Bibliothek</h2><p>Hier landen fertige Prüfprotokolle aus EVSE, Berichte aus Baustelle sowie Dokumente und Fotos aus den Kundenablagen.</p></div>`;
  const chips=`<div class="chips bib-chips">${BB_ART.filter(([a])=>a==="alle"||zahl(a)).map(([a,t])=>`<button class="chip" data-act="bbArt" data-v="${a}" aria-pressed="${art===a}">${esc(t)}<span class="chip-n">${zahl(a)}</span></button>`).join("")}</div>`;
  const L=A.filter(x=>(art==="alle"||x.art===art)&&(ku==="alle"||x.kundeId===ku)&&(!q||H(x.titel)||H(x.kunde)||H(x.info)||H((bbKunde(x.kundeId)||{}).kdnr)));
  L.sort(so==="alt"?(a,b)=>a.t-b.t:so==="name"?(a,b)=>String(a.titel).localeCompare(String(b.titel),"de",{numeric:true}):so==="kunde"?(a,b)=>String(a.kunde||"~").localeCompare(String(b.kunde||"~"),"de")||b.t-a.t:(a,b)=>b.t-a.t);
  const info=bbAktiv()?`<p class="meta f-info">${L.length} ${L.length===1?"Eintrag":"Einträge"}${ku!=="alle"?` · ${esc((bbKunde(ku)||{}).name||"")}`:""} <button class="btn-text inl" data-act="bbReset">Filter aufheben</button></p>`:"";
  if(!L.length) return chips+info+`<div class="empty bib-leer klein">${icon("search")}<h2>Nichts gefunden</h2><p>Andere Suche oder anderen Filter versuchen.</p></div>`;
  const tag=x=>x.ziel.startsWith("data-href")?"a":"div", attr=x=>x.ziel.startsWith("data-href")?`href="${x.ziel.slice(11,-1)}" style="text-decoration:none;color:inherit"`:`role="button" tabindex="0" ${x.ziel}`;
  const zeile=x=>`<${tag(x)} class="li" ${attr(x)}>${x.bild?`<span class="av bib-thumb"><img data-datei="${esc(x.bild)}" alt=""></span>`:`<span class="av">${x.sym?bbSymIc(x.sym):icon(BB_IC[x.art])}</span>`}
    <span class="lt"><span class="h">${esc(x.titel)}</span><span class="s">${esc(x.info)}</span>${x.pill?`<span class="st">${x.pill}</span>`:""}</span>${icon("chev")}</${tag(x)}>`;
  const pid=x=>{ const m=/data-act="bbOeffnen" data-id="([^"]+)"/.exec(x.ziel); return m?m[1]:""; };
  const kachel=x=>`<${tag(x)} class="bib-k" ${attr(x)}><span class="bib-kb${x.bild?" foto":""}${pid(x)?" pdf":""}" ${pid(x)?`data-pdf="${esc(pid(x))}"`:""}>${x.bild?`<img data-datei="${esc(x.bild)}" alt="">`:BB_VORSCHAU.get(pid(x))?`<img src="${BB_VORSCHAU.get(pid(x))}" alt="">`:icon(BB_IC[x.art])}</span>
    <span class="bib-kt"><b>${esc(x.titel)}</b><small>${esc(x.info)}</small>${x.pill?`<span class="st">${x.pill}</span>`:""}</span></${tag(x)}>`;
  setTimeout(()=>{ if(typeof bilderFuellen==="function") bilderFuellen(); bbVorschauen(); },0);
  if(bbAnsicht()==="ordner"&&!q) return chips+info+bbOrdner(art==="alle"?[...L,...bbAuftraege().filter(x=>ku==="alle"||x.kundeId===ku)]:L,zeile);
  const inhalt=bbAnsicht()==="kacheln"?`<div class="bib-raster">${L.map(kachel).join("")}</div>`
    :so==="name"?bbGruppe(L,x=>x.titel,zeile):so==="kunde"?bbGruppe(L,x=>x.kunde||"#",zeile):bbMonate(L,zeile);
  return chips+info+inhalt;
}
function bibliothekView(){
  const an=bbAnsicht(), k=an==="kacheln"; if(bbGeladen) setTimeout(bbLaden,0); /* neu abgelegte PDFs sofort zeigen */
  return `<div class="narrow"><div class="bib-kopf"><div class="search mit-f">${icon("search")}<input id="q" type="search" placeholder="Name, Kunde, Auftrag" value="${esc(query||"")}" autocomplete="off" aria-label="Suchen"><button type="button" class="such-f bb-f${bbAktiv()?" an":""}" data-act="bbFilter" aria-label="Filtern und sortieren" title="Filtern und sortieren">${bbIc("filt")}</button><button type="button" class="such-f such-ans" data-act="ansMenue" aria-label="Ansicht wechseln" title="Ansicht">${bbIc(an==="ordner"?"ordner":k?"kacheln":"liste")}</button></div>
    <div class="seg ans-seg" role="group" aria-label="Ansicht"><button data-act="bbAnsicht" data-v="ordner" aria-pressed="${an==="ordner"}" title="Ordner nach Kunde">${bbIc("ordner")}</button><button data-act="bbAnsicht" data-v="kacheln" aria-pressed="${k}" title="Kacheln">${bbIc("kacheln")}</button><button data-act="bbAnsicht" data-v="liste" aria-pressed="${an==="liste"}" title="Liste">${bbIc("liste")}</button></div></div>
    <div id="res">${bibListe()}</div></div>`;
}
function bbFilterFenster(btn){
  document.getElementById("fpop")?.remove(); document.getElementById("fpopBg")?.remove();
  const bg=document.createElement("div"); bg.id="fpopBg"; document.body.appendChild(bg); const m=document.createElement("div"); m.id="fpop"; m.className="fpop";
  const K=[...new Map(bbEintraege().filter(x=>x.kundeId).map(x=>[x.kundeId,x.kunde])).entries()].sort((a,b)=>a[1].localeCompare(b[1],"de"));
  const male=()=>{ m.innerHTML=`<div class="fp-t">Sortieren</div><div class="fp-sort">${BB_SORT.map(([v,t])=>`<button type="button" class="fp-i${bbW("sort")===v?" an":""}" data-bk="sort" data-bv="${v}">${esc(t)}</button>`).join("")}</div>`
    +(K.length?`<div class="fp-t">Kunde</div><div class="fp-chips">${[["alle","Alle Kunden"],...K].map(([v,t])=>`<button type="button" class="fp-c${bbW("kunde")===v?" an":""}" data-bk="kunde" data-bv="${esc(v)}">${esc(t)}</button>`).join("")}</div>`:"")
    +(bbAktiv()?`<div class="fp-f"><button type="button" class="btn-text" data-breset="1">Zurücksetzen</button></div>`:""); };
  male(); document.body.appendChild(m);
  const r=btn.getBoundingClientRect(), w=Math.min(340,innerWidth-16); m.style.width=w+"px"; m.style.left=Math.max(8,Math.min(r.right-w,innerWidth-w-8))+"px"; m.style.top=(r.bottom+8)+"px"; m.style.maxHeight=(innerHeight-r.bottom-24)+"px";
  m.addEventListener("click",e=>{ const a=e.target.closest("[data-bk]"); if(a){ bbSet(a.dataset.bk,a.dataset.bv); male(); return; } if(e.target.closest("[data-breset]")){ bbSet("sort","neu"); bbSet("kunde","alle"); male(); } });
  const zu=()=>{ m.remove(); bg.remove(); removeEventListener("resize",zu); }; bg.addEventListener("click",zu); addEventListener("resize",zu);
}
/* ===== Vorschaubilder: erste Seite der PDFs, klein gerendert (pdf.js) und für die Sitzung gemerkt ===== */
const BB_VORSCHAU=new Map(); let bbVorLaeuft=false;
async function bbBlob(id){ const d=await new Promise((res,rej)=>{ const r=indexedDB.open("evse_protokolle"); r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error); });
  const b=await new Promise(res=>{ const q=d.transaction("blob").objectStore("blob").get(id); q.onsuccess=()=>res(q.result); q.onerror=()=>res(null); }); d.close(); return b; }
async function bbVorschauen(){
  if(bbVorLaeuft||typeof pdfjsLaden!=="function") return; bbVorLaeuft=true;
  try{ for(const el of [...document.querySelectorAll(".bib-kb.pdf[data-pdf]")]){ const id=el.dataset.pdf; if(BB_VORSCHAU.has(id)){ if(!el.querySelector("img")) el.innerHTML=`<img src="${BB_VORSCHAU.get(id)}" alt="">`; continue; }
      try{ const [lib,b]=await Promise.all([pdfjsLaden(),bbBlob(id)]); if(!b) { BB_VORSCHAU.set(id,""); continue; }
        const doc=await lib.getDocument({data:new Uint8Array(await b.arrayBuffer())}).promise, pg=await doc.getPage(1), v0=pg.getViewport({scale:1}), sc=Math.min(2,420/v0.width), v=pg.getViewport({scale:sc});
        const c=document.createElement("canvas"); c.width=Math.round(v.width); c.height=Math.round(v.height); const x=c.getContext("2d"); x.fillStyle="#fff"; x.fillRect(0,0,c.width,c.height);
        await pg.render({canvasContext:x,viewport:v}).promise; const u=c.toDataURL("image/jpeg",.78); BB_VORSCHAU.set(id,u); try{ doc.destroy(); }catch(_){}
        document.querySelectorAll(`.bib-kb[data-pdf="${CSS.escape(id)}"]`).forEach(k=>k.innerHTML=`<img src="${u}" alt="">`); }
      catch(e){ BB_VORSCHAU.set(id,""); } } }
  finally{ bbVorLaeuft=false; }
}
/* ===== PDF aus der Share holen (Prüfung von einem anderen Gerät) – danach liegt es auch hier und öffnet sofort ===== */
async function bbShare(pid){
  const p=DB.pruefungen&&DB.pruefungen.get(pid); if(!p) return;
  if(p.demo){ toast("Beispiel aus der Demo-Vorschau – dazu gibt es kein echtes PDF"); return; }
  const da=BB_PROT.find(x=>x.pruefungId===pid); if(da) return bbOeffnen(da.id);
  if(!(typeof SYNC_ON!=="undefined"&&SYNC_ON&&typeof folderId==="function"&&typeof BIB!=="undefined"&&BIB.pdf)){ toast("PDF liegt in der Share – dafür bitte anmelden"); return; }
  toast("PDF wird geladen …");
  try{ const pa=String(p.pdfAblage), file=pa.slice(pa.lastIndexOf("/")+1);
    await syncRoot(); let it=pa.startsWith(KD_WURZEL+"/")?await kdItem(p.kundeId,kdRest(pa)):await kdAltItem(BIB.pdf,pa);
    if(!it){ const r=[...DB.protokolle.values()].find(x=>!x.deleted&&x.pruefungId===pid&&x.bib==="kd"); if(r) it=await kdItem(r.kundeId,kdRest(r.pfad),r.item); } /* schon in den Kundenordner umgezogen */
    if(!it) throw {status:404}; const blob=await (await readItem(it)).blob();
    const k=bbKunde(p.kundeId), s=p.standortId&&DB.standorte?DB.standorte.get(p.standortId):null;
    const x={id:"share-"+p.id,pruefungId:p.id,kundeId:p.kundeId||"",standortId:p.standortId||"",name:file.replace(/\.pdf$/i,""),titel:[k&&k.name,s&&s.name].filter(Boolean).join(" · ")||file,
      datum:(p.p&&p.p.datum)||"",art:(p.p&&p.p.art)||"",auftragsnr:(p.p&&p.p.auftragsnr)||"",pruefer:(p.p&&p.p.pruefer)||"",created:p.updated||Date.now(),von:p.updatedBy||null,fassung:1,size:blob.size,ausShare:true};
    const d=await new Promise((res,rej)=>{ const r=indexedDB.open("evse_protokolle"); r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error); });
    const tx=d.transaction(["meta","blob"],"readwrite"); tx.objectStore("meta").put(x); tx.objectStore("blob").put(blob,x.id); await new Promise(r=>{ tx.oncomplete=r; tx.onerror=r; }); d.close();
    BB_PROT.push(x); if(typeof PROT!=="undefined"&&!PROT.some(y=>y.id===x.id)) PROT.push(x);
    const r=document.getElementById("res"); if(r) r.innerHTML=bibListe(); bbOeffnen(x.id);
  }catch(e){ toast(navigator.onLine?"PDF in der Share nicht gefunden":"Kein Internet – PDF liegt in der Share"); }
}
async function bbOeffnen(id){
  if(typeof pvOeffnen==="function"&&typeof PROT!=="undefined"&&PROT.some(x=>x.id===id)) return pvOeffnen(id);
  if(typeof PROT!=="undefined"&&!PROT.some(x=>x.id===id)){ const x=BB_PROT.find(y=>y.id===id); if(x) PROT.push(x); }
  if(typeof pvOeffnen==="function"&&typeof PROT!=="undefined"&&PROT.some(x=>x.id===id)) return pvOeffnen(id);
  if(typeof bibOpen==="function"&&typeof PROT!=="undefined"&&PROT.some(x=>x.id===id)) return bibOpen(id);
  try{ const d=await new Promise((res,rej)=>{ const r=indexedDB.open("evse_protokolle"); r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error); });
    const b=await new Promise(res=>{ const q=d.transaction("blob").objectStore("blob").get(id); q.onsuccess=()=>res(q.result); q.onerror=()=>res(null); }); d.close();
    if(!b){ toast("PDF nicht gefunden"); return; } window.open(URL.createObjectURL(b),"_blank","noopener"); }catch(e){ toast("PDF nicht gefunden"); }
}
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act^="bb"]'); if(!b) return; e.stopPropagation(); e.preventDefault(); const a=b.dataset.act;
  if(a==="bbArt") bbSet("art",b.dataset.v);
  else if(a==="bbAnsicht"){ if(bbAnsicht()!==b.dataset.v){ META.bibAnsicht=b.dataset.v; metaSave(); render(); } }
  else if(a==="bbFilter") bbFilterFenster(b);
  else if(a==="bbReset"){ bbSet("sort","neu"); bbSet("kunde","alle"); }
  else if(a==="bbOrdner"){ BB_ORT={k:b.dataset.k||null,p:bbPDec(b.dataset.p)}; const r=document.getElementById("res"); if(r) r.innerHTML=bibListe(); scrollTo(0,0); }
  else if(a==="bbSp") bbSpOeffnen(b.dataset.id);
  else if(a==="bbAuf") bbAufOeffnen(b.dataset.k,b.dataset.id);
  else if(a==="bbWeb"){ if(b.dataset.u) window.open(b.dataset.u,"_blank","noopener"); }
  else if(a==="bbHier"){ if(typeof ablageStart==="function") ablageStart("kunden",b.dataset.k,b.dataset.v==="fotos",b.dataset.v==="fotos"?null:b.dataset.v||""); }
  else if(a==="bbStil") bbStilFenster(b,b.dataset.k);
  else if(a==="bbMenue"){ const m=b.closest(".bb-m"), r=b.getBoundingClientRect(); if(m) bbOrdnerMenue(m,r.left,r.bottom); }
  else if(a==="bbOeffnen") bbOeffnen(b.dataset.id);
  else if(a==="bbShare") bbShare(b.dataset.id);
  else if(a==="bbFern") bbFern(b.dataset.id);
},true);
document.addEventListener("keydown",e=>{ if(e.key==="Enter"&&e.target.matches&&e.target.matches('#app [data-act="bbOeffnen"]')){ e.preventDefault(); bbOeffnen(e.target.dataset.id); } });
document.addEventListener("input",e=>{ if(e.target&&e.target.id==="q"&&typeof nav!=="undefined"&&nav.v==="bibliothek"){ query=e.target.value; const r=document.getElementById("res"); if(r) r.innerHTML=bibListe(); } });
document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="visible"&&bbGeladen) bbLaden(); });
