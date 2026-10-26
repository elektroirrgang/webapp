/* Dateien und Fotos zu Kunden, Standorten und Aufträgen – gemeinsam für Übersicht und Baustelle (tools/build.py setzt es ein).
   Datensatz „dateien“ {bezugKind, bezugId, name, typ, groesse}; der Inhalt liegt im Gerätespeicher „irrgang_dateien“
   (für alle Apps derselbe) und in SharePoint unter Kundendaten/_App-Daten/dateien/<id>.<endung>. */
IC.attach=IC.attach||"M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z";
const DATEI_DB="irrgang_dateien", dateiCache=new Map(); let dateiDB=null;
function dateiOpen(){ return new Promise((res,rej)=>{ if(!window.indexedDB) return rej(0); const r=indexedDB.open(DATEI_DB,1); r.onupgradeneeded=()=>r.result.createObjectStore("d"); r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error); }); }
async function dateiInit(){ try{ dateiDB=await dateiOpen(); }catch(e){ dateiDB=null; } }
const dateiBereit=dateiInit();
function dateiPut(id,blob){ dateiCache.set(id,blob); if(!dateiDB) return Promise.resolve(false);
  return new Promise(res=>{ try{ const t=dateiDB.transaction("d","readwrite"); t.objectStore("d").put(blob,id); t.oncomplete=()=>res(true); t.onerror=t.onabort=()=>res(false); }catch(e){ res(false); } }); }
async function dateiGet(id){ if(dateiCache.has(id)) return dateiCache.get(id); await dateiBereit; if(!dateiDB) return null;
  try{ const b=await idbReq(dateiDB.transaction("d").objectStore("d").get(id)); if(b) dateiCache.set(id,b); return b||null; }catch(e){ return null; } }
function dateiDel(id){ dateiCache.delete(id); if(dateiDB) try{ dateiDB.transaction("d","readwrite").objectStore("d").delete(id); }catch(e){} }
const urlCache=new Map();
async function dateiUrl(id){ if(urlCache.has(id)) return urlCache.get(id); const b=await dateiGet(id); if(!b) return null; const u=URL.createObjectURL(b); urlCache.set(id,u); return u; }
const dateienVon=(kind,id)=>live("dateien").filter(d=>d.bezugKind===kind&&d.bezugId===id).sort((a,b)=>(b.created||0)-(a.created||0));
const istBild=d=>/^image\//.test(d.typ||"");
const groesse=n=>n>=1048576?`${(n/1048576).toFixed(1).replace(".",",")} MB`:`${Math.max(1,Math.round(n/1024))} kB`;
const endung=d=>(String(d.name||"").match(/\.([a-z0-9]{1,5})$/i)||[,""])[1].toLowerCase()||(istBild(d)?"jpg":"bin");
let ablageZiel=null, ablageVorgabe=null, ablageWarte=null; /* Vorgabe: Ordner-Schlüssel aus KD_ORD ("" = direkt im Kundenordner), null = fragen */
/* eine Datei ablegen: Bilder werden verkleinert (JPEG), max. 25 MB; gibt den Datensatz zurück oder null */
async function dateiNeu(kind,id,f,extra){
  let blob=f, typ=f.type||"application/octet-stream", name=f.name||"Datei";
  if(/^image\//.test(typ)&&!/gif|svg/.test(typ)){ try{ blob=dataUrlToBlob(await fotoVerkleinern(f)); typ="image/jpeg"; name=name.replace(/\.[^.]+$/,"")+".jpg"; }catch(e){ toast("Ein Bild konnte nicht gelesen werden"); return null; } }
  if(blob.size>25*1048576){ toast(`„${name}“ ist größer als 25 MB`); return null; }
  const did=uid(); await dateiPut(did,blob);
  const d=saveRec("dateien",Object.assign({id:did,bezugKind:kind,bezugId:id,name,typ,groesse:blob.size},extra||{}),true); dateiQueue(did); return d||DB.dateien.get(did); }
async function dateiAufnehmen(el){
  const fs=[...el.files]; el.value=""; if(!fs.length||!ablageZiel) return;
  /* Dokumente: erst fragen, in welchen Ordner des Kunden (Fotos landen immer unter „Fotos“) */
  if(ablageVorgabe===null&&fs.some(f=>!/^image\//.test(f.type||""))&&typeof kdVorschlag==="function"){ ablageWarte={fs,ziel:ablageZiel}; ablageOrdnerDlg(kdVorschlag((fs.find(f=>!/^image\//.test(f.type||""))||{}).name,ablageZiel.kind),"ablOk"); return; }
  await ablageSpeichern(fs,ablageZiel,ablageVorgabe); ablageVorgabe=null;
}
async function ablageSpeichern(fs,ziel,ordner){ let n=0;
  const r=DB[ziel.kind]&&DB[ziel.kind].get(ziel.id), dm=r&&r.demo?{demo:true}:{};
  for(const f of fs){ const extra=Object.assign({},dm); if(ordner!==null&&ordner!==undefined&&!/^image\//.test(f.type||"")) extra.ordner=ordner; if(await dateiNeu(ziel.kind,ziel.id,f,extra)) n++; }
  if(n){ render(); toast(n===1?"Abgelegt":`${n} Dateien abgelegt`); } }
/* Ablegen von außen anstoßen (Bibliothek: „Hier ablegen“ im Kundenordner) */
function ablageStart(kind,id,foto,vorgabe){ ablageZiel={kind,id}; ablageVorgabe=foto?null:(vorgabe===undefined?null:vorgabe); const f=ablageInput();
  f.accept=foto?"image/*":"application/pdf,image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.dwg,.dxf,.msg,.eml"; if(foto) f.setAttribute("capture","environment"); else f.removeAttribute("capture"); f.multiple=!foto; f.click(); }
/* Ordnerwahl für Dokumente (Fenster mit Chips) */
function ablageOrdnerDlg(v,act,id){
  const W=[...KD_DOK.map(a=>[a,kdKat(a)]),["","Direkt im Kundenordner"]];
  dialog("In welchen Ordner?",`<p class="meta" style="margin:0 0 12px">Der Ordner im Kundenordner in SharePoint. Fotos landen immer unter „Fotos“.</p>
    <div class="chips abl-ord">${W.map(([a,t])=>`<button type="button" class="chip" data-act="ablOrd" data-v="${a}" aria-pressed="${a===v}">${esc(t)}</button>`).join("")}</div>`,
    `<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-filled" data-act="${act}"${id?` data-id="${esc(id)}"`:""}>${act==="ablUm"?"Verschieben":"Ablegen"}</button>`); }
const ablageOrt=d=>{ const kid=typeof kdDateiKunde==="function"&&kdDateiKunde(d), k=kid&&DB.kunden&&DB.kunden.get(kid); return k&&!k.deleted?["Kundenordner",...kdOrtDatei(d)].join(" › "):""; };
function dateiQueue(id){ if(!SYNC_ON) return; META.sync.dateiQueue=[...new Set([...(META.sync.dateiQueue||[]),id])]; metaSave(); syncSoon(); }
async function pushDateien(){
  const q=META.sync.dateiQueue||[]; if(!q.length) return; let fid=null;
  for(const id of [...q]){
    const d=DB.dateien.get(id), b=await dateiGet(id);
    if(d&&b&&!d.deleted&&!d.demo){ const kid=typeof kdDateiKunde==="function"?kdDateiKunde(d):"", it=kid&&bbKunde(kid)?await kdHoch(kid,[...kdOrtDatei(d),kdDateiName(d)],b,"rename"):null; /* Kundenordner (ablage.js) */
      if(it){ Object.assign(d,{item:it.id,ort:kdOrtDatei(d),ablage:it.name}); saveRec("dateien",d); }
      else { fid=fid||await folderId(`${CONFIG.dataFolder}/dateien`,BIB.dateien); const r=await g(`/drives/${fid}:/${id}.${endung(d)}:/content`,{method:"PUT",headers:{"Content-Type":d.typ||"application/octet-stream"},body:b}); if(!r.ok) throw new Error(`Datei hochladen fehlgeschlagen (${r.status})`); } }
    META.sync.dateiQueue=(META.sync.dateiQueue||[]).filter(x=>x!==id); metaSave();
  }
}
async function dateiHolen(d){
  if(d&&d.demo&&typeof demoDateiBlob==="function"){ const b=await demoDateiBlob(d); if(b){ await dateiPut(d.id,b); return b; } return null; }
  if(!SYNC_ON||!ME.signedIn||!navigator.onLine) return null;
  try{ await syncRoot(); if(d.item&&typeof kdItemId==="function"){ const it=await kdItemId(d.item); if(it){ const b=await (await readItem(it)).blob(); await dateiPut(d.id,b); return b; } }
    const meta=typeof kdAltItem==="function"?await kdAltItem(BIB.dateien,`${CONFIG.dataFolder}/dateien/${d.id}.${endung(d)}`):await gj(`/drives/${await folderId(`${CONFIG.dataFolder}/dateien`,BIB.dateien)}:/${d.id}.${endung(d)}`); if(!meta) return null;
    const b=await (await readItem(meta)).blob(); await dateiPut(d.id,b); return b; }catch(e){ return null; } }
async function bilderFuellen(){
  for(const el of document.querySelectorAll("img[data-datei]")){ const id=el.dataset.datei; let u=await dateiUrl(id);
    if(!u){ const d=DB.dateien.get(id); if(d&&await dateiHolen(d)) u=await dateiUrl(id); }
    if(u) el.src=u; else el.closest(".ab-k")?.classList.add("fehlt"); }
}
async function dateiOeffnen(id){
  const d=DB.dateien.get(id); if(!d) return;
  let b=await dateiGet(id); if(!b){ toast("Wird geladen …"); b=await dateiHolen(d); }
  if(!b){ toast(SYNC_ON?"Datei nicht erreichbar – Internet prüfen":"Datei liegt nur auf dem Gerät, auf dem sie abgelegt wurde"); return; }
  const u=await dateiUrl(id), darf=canEdit(d)||ME.admin;
  const ort=ablageOrt(d), kopf=`<p class="sup" style="margin:0 0 12px">${esc([groesse(d.groesse||b.size),vonText(d),wann(d.created)].filter(Boolean).join(" · "))}${ort?`<br>${esc(ort)}`:""}</p>`;
  dialog(d.name,kopf+(istBild(d)?`<img class="dimg" src="${u}" alt="">`:`<div class="ab-dok">${icon("doc")}<span>${esc(d.name)}</span></div>`),
    `${darf?`<button class="btn-text danger" data-act="dateiDelAsk" data-id="${id}">Löschen</button>`:""}<span style="flex:1"></span>${darf&&ort&&!istBild(d)?`<button class="btn-text" data-act="ablUmAsk" data-id="${id}">Ordner</button>`:""}<button class="btn-text" data-act="dateiSpeichern" data-id="${id}">${istBild(d)?"Speichern":"Öffnen"}</button><button class="btn-text" data-act="cancel">Schließen</button>`);
}

function ablageView(kind,r){
  const L=dateienVon(kind,r.id), bilder=L.filter(istBild), doks=L.filter(d=>!istBild(d));
  return `<div class="sec-row"><div class="sec-lbl">Dokumente und Fotos</div><span class="ab-btns">${kind==="kunden"&&typeof bibliothekView==="function"?`<button class="ab-ic" data-act="ablageOrdner" data-id="${esc(r.id)}" aria-label="Kundenordner öffnen" title="Kundenordner in der Bibliothek">${icon("folder")}</button>`:""}<button class="ab-ic" data-act="ablageFoto" data-kind="${kind}" data-id="${esc(r.id)}" aria-label="Foto aufnehmen" title="Foto aufnehmen">${icon("cam")}</button><button class="ab-ic" data-act="ablageDatei" data-kind="${kind}" data-id="${esc(r.id)}" aria-label="Datei anhängen" title="Datei anhängen">${icon("attach")}</button></span></div>
    ${L.length?`${bilder.length?`<div class="ab-grid">${bilder.map(d=>`<button class="ab-k" data-act="dateiOeffnen" data-id="${d.id}" aria-label="${esc(d.name)}"><img data-datei="${d.id}" alt=""><span class="ab-leer">${icon("cam")}</span></button>`).join("")}</div>`:""}
      ${doks.length?listOf(doks.map(d=>`<div class="li" role="button" tabindex="0" data-act="dateiOeffnen" data-id="${d.id}"><span class="av">${icon("doc")}</span><span class="lt"><span class="h">${esc(d.name)}</span><span class="s">${esc([groesse(d.groesse||0),vonText(d),wann(d.created)].filter(Boolean).join(" · "))}</span></span>${icon("chev")}</div>`)):""}`
    :`<p class="meta">Noch nichts abgelegt. Hier landen Angebote, Pläne, Schaltpläne oder schnelle Fotos vom Kunden – statt in OneNote.</p>`}`;
}

/* Klicks: Foto/Datei ablegen, öffnen, speichern, löschen – eigene Abfangung, die Apps brauchen dafür nichts */
function ablageInput(){ let f=document.getElementById("ablageFile"); if(!f){ f=document.createElement("input"); f.type="file"; f.id="ablageFile"; f.hidden=true; document.body.appendChild(f); } return f; }
document.addEventListener("click",async e=>{ const b=e.target.closest&&e.target.closest('[data-act="ablageFoto"],[data-act="ablageDatei"],[data-act="dateiOeffnen"],[data-act="dateiSpeichern"],[data-act="dateiDelAsk"],[data-act="dateiDelOk"],[data-act="ablOrd"],[data-act="ablOk"],[data-act="ablUmAsk"],[data-act="ablUm"],[data-act="ablageOrdner"]'); if(!b) return;
  e.stopPropagation(); e.preventDefault(); const a=b.dataset.act, id=b.dataset.id;
  if(a==="ablOrd"){ b.parentElement.querySelectorAll(".chip").forEach(c=>c.setAttribute("aria-pressed",String(c===b))); return; }
  const wahl=()=>{ const c=document.querySelector('#dlg .abl-ord .chip[aria-pressed="true"]'); return c?c.dataset.v:""; };
  if(a==="ablOk"){ const v=wahl(), w=ablageWarte; ablageWarte=null; closeOverlays(); if(w) await ablageSpeichern(w.fs,w.ziel,v); return; }
  if(a==="ablUmAsk"){ const d=DB.dateien.get(id); if(!d) return; closeOverlays(); ablageOrdnerDlg("ordner" in d?d.ordner:kdVorschlag(d.name,d.bezugKind),"ablUm",id); return; }
  if(a==="ablUm"){ const d=DB.dateien.get(id), v=wahl(); closeOverlays(); if(!d||!(canEdit(d)||ME.admin)) return; d.ordner=v; saveRec("dateien",d); render(); toast(`Liegt jetzt in „${v?kdKat(v):"Kundenordner"}“`); return; }
  if(a==="ablageOrdner"){ META.bibAnsicht="ordner"; metaSave(); BB_ORT={k:id,p:[]}; if(typeof query!=="undefined") query=""; go({v:"bibliothek"}); return; }
  if(a==="ablageFoto"||a==="ablageDatei"){ ablageZiel={kind:b.dataset.kind,id}; ablageVorgabe=null; const f=ablageInput();
    f.accept=a==="ablageFoto"?"image/*":"application/pdf,image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.dwg,.dxf"; if(a==="ablageFoto") f.setAttribute("capture","environment"); else f.removeAttribute("capture"); f.multiple=a!=="ablageFoto"; f.click(); }
  else if(a==="dateiOeffnen") dateiOeffnen(id);
  else if(a==="dateiSpeichern"){ const d=DB.dateien.get(id), bl=await dateiGet(id); if(!d||!bl) return;
    if(!istBild(d)){ const u=await dateiUrl(d.id); const w=window.open(u,"_blank"); if(w) return; } saveFile(bl,d.name); }
  else if(a==="dateiDelAsk"){ closeOverlays(); dialog("Datei löschen?",`<p>Die Datei wird für alle entfernt.</p>`,`<button class="btn-text danger" data-act="dateiDelOk" data-id="${esc(id)}">Löschen</button><span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button>`); }
  else if(a==="dateiDelOk"){ const d=DB.dateien.get(id); closeOverlays(); if(!d||!(canEdit(d)||ME.admin)) return; d.deleted=true; saveRec("dateien",d); dateiDel(d.id); urlCache.delete(d.id); render(); toast("Datei gelöscht"); }
},true);
document.addEventListener("change",e=>{ if(e.target&&e.target.id==="ablageFile") dateiAufnehmen(e.target); });
