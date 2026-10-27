/* ===== Kundenordner in SharePoint – gemeinsam für alle Apps (tools/build.py hängt es an die Bibliothek) =====
   Kundendaten › Kunden › <Kd.-Nr. Name> › <Art> › <Standort | Baustelle> › Datei
   Welcher Ordner zu welchem Kunden gehört, steht in einstellungen „kdo-<Kunde>“ (SharePoint-ID des Ordners). So bleibt die
   Zuordnung, wenn der Kunde in der App oder der Ordner in SharePoint umbenannt wird; die App benennt ihn beim Abgleich nach.
   Bestand (Prüfprotokolle/<Kunde>/…, Baustellen/Berichte/…, _App-Daten/dateien/<id>) zieht beim Abgleich nach und nach um –
   höchstens 20 Schritte je Abgleich, damit der Abgleich schnell bleibt. Alte Dateien landen dabei im SharePoint-Papierkorb. */
const KD_ORD=[["angebote","Angebote und Aufträge"],["plaene","Pläne und Schaltpläne"],["prot","Prüfprotokolle"],["berichte","Baustellenberichte"],["fotos","Fotos"],["daten","Datenblätter und Handbücher"],["post","Schriftverkehr"]];
const KD_DOK=["angebote","plaene","daten","post"], KD_WURZEL="Kunden";
const KD_SYM={angebote:"auftrag",plaene:"plan",prot:"blitz",berichte:"baustelle",fotos:"foto",daten:"buch",post:"brief"};
Object.assign(BB_SYM,{auftrag:"M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z",
  plan:"M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z",
  foto:"M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zM9 2 7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z",
  buch:"M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z",
  brief:"M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"});
const kdKat=a=>(KD_ORD.find(x=>x[0]===a)||[,""])[1];
const kdKatVon=n=>(KD_ORD.find(x=>x[1]===n)||[""])[0];
const kdOrdName=k=>bbFs([k.kdnr,k.name].map(x=>String(x||"").trim()).filter(Boolean).join(" "));
const kdoRec=kid=>{ const r=typeof DB!=="undefined"&&DB.einstellungen&&DB.einstellungen.get("kdo-"+kid); return r&&!r.deleted?r:null; };
const kdAn=()=>typeof SYNC_ON!=="undefined"&&SYNC_ON&&typeof ME!=="undefined"&&!!ME.signedIn&&typeof folderId==="function"&&!!DB.einstellungen;
const kdDrive=()=>(SY.bibs&&SY.bibs[BIB.kunden])||SY.drive;
const kdEnc=segs=>segs.map(encodeURIComponent).join("/");
const kdRest=pfad=>String(pfad||"").split("/").slice(2);
const KD_JSON={"Content-Type":"application/json"};
const kdFehler=x=>Object.assign(new Error(`Microsoft meldet Fehler ${x.status}`),{status:x.status});
/* Dateiname: Endung bleibt, Rest wie alle Ablagenamen bereinigt */
function kdDateiName(d){ const n=String(d.name||"Datei"), m=/(\.[a-z0-9]{1,5})$/i.exec(n), ext=m?m[1].toLowerCase():(/^image\//.test(d.typ||"")?".jpg":"");
  return bbFs((m?n.slice(0,-m[1].length):n).slice(0,70))+ext; }
/* Wohin gehört was (Ordner unterhalb des Kundenordners) */
function kdOrtProt(x){ const nm=(k,id)=>id&&DB[k]&&DB[k].get(id)?DB[k].get(id).name:"";
  if(x.app==="baustelle") return [kdKat("berichte"),nm("baustellen",x.baustelleId)||String(x.titel||"").split(" · ").pop()||"Baustelle"].map(bbFs);
  return [kdKat("prot"),nm("standorte",x.standortId),nm("ladeparks",x.ladeparkId)].filter(Boolean).map(bbFs); }
function kdDateiKunde(d){ if(!d) return ""; if(d.bezugKind==="kunden") return d.bezugId||"";
  const s=d.bezugKind==="standorte"&&DB.standorte&&DB.standorte.get(d.bezugId); if(s) return s.kundeId||"";
  const an=d.bezugKind==="anlagen"&&DB.anlagen&&DB.anlagen.get(d.bezugId); if(an) return an.kundeId||"";
  const v=d.bezugKind==="vorgaenge"&&DB.vorgaenge&&DB.vorgaenge.get(d.bezugId); return v?v.kundeId||"":""; }
function kdVorschlag(name,kind){ const n=String(name||"").toLowerCase();
  if(/angebot|auftrag|bestellung|lieferschein|aufma(ß|ss)|leistungsverzeichnis|\blv\b/.test(n)) return "angebote";
  if(/plan|schalt|grundriss|zeichnung|skizze|\.dwg$|\.dxf$/.test(n)) return "plaene";
  if(/datenblatt|handbuch|anleitung|manual|datasheet|montage|zertifikat|konformit/.test(n)) return "daten";
  if(/brief|schreiben|rechnung|mahnung|kündigung|\.msg$|\.eml$/.test(n)) return "post";
  return kind==="vorgaenge"?"angebote":""; }
function kdOrtDatei(d){
  /* Maschine: Kategorie › Standort › „<Nr> <Bezeichnung>“ – gleiche Maschinennummern an verschiedenen Standorten
     (z. B. M-17.1 in Rommelsdorf und in Elsenroth) landen so nie im selben Ordner. Fotos einer Meldung zu einer Maschine ebenso. */
  const vgM=d.bezugKind==="vorgaenge"&&DB.vorgaenge&&DB.vorgaenge.get(d.bezugId), an=d.bezugKind==="anlagen"&&DB.anlagen?DB.anlagen.get(d.bezugId):vgM&&vgM.anlageId&&DB.anlagen&&/^image\//.test(d.typ||"")?DB.anlagen.get(vgM.anlageId):null;
  if(an&&!an.deleted){ const mn=[an.nr,an.bez].filter(Boolean).join(" ")||"Maschine", so=an.ortId&&!String(an.ortId).startsWith("k:")&&DB.standorte&&DB.standorte.get(an.ortId), sn=so?so.name||"Standort":"";
    if(/^image\//.test(d.typ||"")) return [kdKat("fotos"),sn,mn].filter(Boolean).map(bbFs); const a="ordner" in d&&d.ordner?d.ordner:(kdVorschlag(d.name,d.bezugKind)||"plaene"); return [kdKat(a)||kdKat("plaene"),sn,mn].filter(Boolean).map(bbFs); }
  const vg=d.bezugKind==="vorgaenge"&&DB.vorgaenge&&DB.vorgaenge.get(d.bezugId), st=d.bezugKind==="standorte"?d.bezugId:vg?vg.standortId:"";
  const sn=st&&DB.standorte&&DB.standorte.get(st)?DB.standorte.get(st).name:"";
  if(/^image\//.test(d.typ||"")) return [kdKat("fotos"),sn].filter(Boolean).map(bbFs);
  const a="ordner" in d?d.ordner:kdVorschlag(d.name,d.bezugKind); return a&&kdKat(a)?[kdKat(a)]:[]; }

/* ===== SharePoint ===== */
async function kdUnterAnlegen(drive,item){
  const req=KD_ORD.map(([,n],i)=>({id:String(i+1),method:"POST",url:`/drives/${drive}/items/${item}/children`,headers:KD_JSON,body:{name:n,folder:{},"@microsoft.graph.conflictBehavior":"fail"}}));
  const x=await g("/$batch",{method:"POST",headers:KD_JSON,body:JSON.stringify({requests:req})}); if(x.ok) return;
  for(const [,n] of KD_ORD){ const y=await g(`/drives/${drive}/items/${item}/children`,{method:"POST",headers:KD_JSON,body:JSON.stringify({name:n,folder:{},"@microsoft.graph.conflictBehavior":"fail"})}); if(!y.ok&&y.status!==409) throw kdFehler(y); } }
/* Kundenordner holen; fehlt er, wird er mit den Unterordnern angelegt. pruefen: gemerkte ID erst bei SharePoint nachfragen */
async function kdOrdner(kid,pruefen){
  const k=bbKunde(kid); if(!k||k.demo) return null; await syncRoot();
  const drive=kdDrive(), soll=kdOrdName(k); let r=kdoRec(kid);
  if(r&&r.item&&pruefen){ const x=await g(`/drives/${drive}/items/${r.item}`); if(x.status===404) r=null; else if(!x.ok) throw kdFehler(x); }
  if(r&&r.item){
    if(r.soll===soll) return {drive,item:r.item};
    const x=await g(`/drives/${drive}/items/${r.item}`,{method:"PATCH",headers:KD_JSON,body:JSON.stringify({name:soll})});
    if(x.ok){ const j=await x.json(); Object.assign(r,{name:j.name,soll,web:j.webUrl||r.web||""}); saveRec("einstellungen",r); return {drive,item:r.item}; }
    if(x.status===409){ r.soll=soll; saveRec("einstellungen",r); return {drive,item:r.item}; } /* Name schon vergeben – alten Namen behalten */
    if(x.status!==404) throw kdFehler(x); r=null;
  }
  const w=(await folderId(KD_WURZEL,BIB.kunden)).split("/items/")[1];
  const belegt=new Set([...DB.einstellungen.values()].filter(x=>!x.deleted&&x.kundeId&&x.kundeId!==kid&&String(x.id).startsWith("kdo-")).map(x=>x.item));
  let it=null;
  for(const name of [soll,bbFs(`${soll} (${String(kid).slice(-5)})`)]){
    const x=await g(`/drives/${drive}/items/${w}/children`,{method:"POST",headers:KD_JSON,body:JSON.stringify({name,folder:{},"@microsoft.graph.conflictBehavior":"fail"})});
    if(x.ok){ it=await x.json(); break; }
    if(x.status!==409) throw kdFehler(x);
    const da=await gj(`/drives/${drive}/items/${w}:/${encodeURIComponent(name)}`); if(!belegt.has(da.id)){ it=da; break; } /* von Hand angelegter Ordner wird übernommen */
  }
  if(!it) throw new Error("Kundenordner konnte nicht angelegt werden");
  await kdUnterAnlegen(drive,it.id);
  const alt=DB.einstellungen.get("kdo-"+kid), rec=Object.assign(alt||{id:"kdo-"+kid},{kundeId:kid,item:it.id,name:it.name,soll,web:it.webUrl||""}); delete rec.deleted;
  saveRec("einstellungen",rec,!alt); return {drive,item:it.id}; }
/* Unterordner (wird angelegt, wenn er fehlt); IDs gemerkt je Elternordner, also unabhängig von Umbenennungen */
async function kdUnter(kid,segs,pruefen){
  const o=await kdOrdner(kid,pruefen); if(!o) return null; let p=o.item;
  for(const s of segs){ const key="kd:"+p+"/"+s; if(SY.folders[key]&&!pruefen){ p=SY.folders[key]; continue; }
    const pf=`/drives/${o.drive}/items/${p}:/${encodeURIComponent(s)}`; let x=await g(pf);
    if(x.status===404){ x=await g(`/drives/${o.drive}/items/${p}/children`,{method:"POST",headers:KD_JSON,body:JSON.stringify({name:s,folder:{},"@microsoft.graph.conflictBehavior":"fail"})}); if(x.status===409) x=await g(pf); }
    if(!x.ok) throw kdFehler(x); p=(await x.json()).id; SY.folders[key]=p; }
  if(META.sync.root){ META.sync.root.folders=SY.folders; metaSave(); }
  return {drive:o.drive,item:p}; }
/* Hochladen in den Kundenordner; rest = [...Ordner, Dateiname]. konflikt: "replace" (Protokolle) oder "rename" (Dateien). Gibt das SharePoint-Element zurück */
async function kdHoch(kid,rest,blob,konflikt){
  const segs=rest.slice(0,-1), name=rest[rest.length-1];
  const los=async o=>{ const base=`/drives/${o.drive}/items/${o.item}:/${encodeURIComponent(name)}:`;
    if(blob.size<3.5*1048576) return g(`${base}/content?@microsoft.graph.conflictBehavior=${konflikt}`,{method:"PUT",headers:{"Content-Type":blob.type||"application/octet-stream"},body:blob});
    const s=await g(`${base}/createUploadSession`,{method:"POST",headers:KD_JSON,body:JSON.stringify({item:{"@microsoft.graph.conflictBehavior":konflikt}})}); if(!s.ok) return s;
    const url=(await s.json()).uploadUrl, CH=320*1024*10; let r=null;
    for(let i=0;i<blob.size;i+=CH){ const part=blob.slice(i,Math.min(i+CH,blob.size)); r=await fetch(url,{method:"PUT",headers:{"Content-Range":`bytes ${i}-${i+part.size-1}/${blob.size}`},body:part}); if(!r.ok&&r.status!==202) return r; }
    return r; };
  let o=await kdUnter(kid,segs); if(!o) return null; let r=await los(o);
  if(r.status===404){ Object.keys(SY.folders).forEach(k=>{ if(k.startsWith("kd:")) delete SY.folders[k]; }); o=await kdUnter(kid,segs,true); r=await los(o); } /* Ordner in SharePoint gelöscht */
  if(!r.ok) throw kdFehler(r); return r.json(); }
async function kdItemId(id){ const x=await g(`/drives/${kdDrive()}/items/${id}`); if(x.status===404) return null; if(!x.ok) throw kdFehler(x); return x.json(); }
/* Datei im Kundenordner suchen: erst über die gemerkte ID, sonst über den Pfad. null = nicht da */
async function kdItem(kid,rest,item){ await syncRoot();
  if(item){ const it=await kdItemId(item); if(it) return it; }
  const r=kdoRec(kid); if(!r||!r.item) return null;
  const x=await g(`/drives/${kdDrive()}/items/${r.item}:/${kdEnc(rest)}`); if(x.status===404) return null; if(!x.ok) throw kdFehler(x); return x.json(); }
/* Element an altem Ort (nur lesen, legt nichts an) */
async function kdAltItem(lib,pfad){ const d=SY.bibs&&SY.bibs[lib], segs=String(pfad).split("/").filter(Boolean); if(!segs.length) return null;
  const x=await g(d?`/drives/${d}/items/root:/${kdEnc(segs)}`:`/drives/${SY.drive}/items/${SY.rootId}:/${kdEnc(segs)}`);
  if(x.status===404) return null; if(!x.ok) throw kdFehler(x); return x.json(); }
/* leere alte Ordner (bis zu 3 Ebenen) nach dem Umzug wegräumen – nie die Bibliothek selbst oder _App-Daten */
async function kdAltAufraeumen(drive,id){
  for(let i=0;i<3&&id;i++){ const x=await g(`/drives/${drive}/items/${id}`); if(!x.ok) return; const it=await x.json();
    if(it.root||!it.folder||it.folder.childCount>0||it.name===CONFIG.dataFolder||!it.parentReference||!it.parentReference.id) return;
    await g(`/drives/${drive}/items/${id}`,{method:"DELETE"}); id=it.parentReference.id; } }
async function kdWeg(q){ if(!q) return; const d=q.parentReference&&q.parentReference.driveId, p=q.parentReference&&q.parentReference.id;
  const x=await g(`/drives/${d}/items/${q.id}`,{method:"DELETE"}); if(x.ok&&p) await kdAltAufraeumen(d,p); }

/* ===== Umzug und Pflege beim Abgleich ===== */
const KD_FEHLT=new Set(); let kdPflegeLaeuft=false;
async function kdProtUmziehen(r){
  const k=bbKunde(r.kundeId), alt=String(r.pfad||""), datei=alt.split("/").pop()||bbFs(r.name)+".pdf", rest=[...kdOrtProt(r),datei];
  const q=alt?await kdAltItem(BIB[r.bib]||BIB.pdf,alt):null;
  let it=await kdItem(r.kundeId,rest);
  if(!it){ const blob=q?await (await readItem(q)).blob():await bbBlob(r.id).catch(()=>null);
    if(!blob){ KD_FEHLT.add("p"+r.id); return; } it=await kdHoch(r.kundeId,rest,blob,"replace"); }
  if(!it) return;
  if(q&&q.id!==it.id) await kdWeg(q);
  Object.assign(r,{umzugVon:alt,bib:"kd",pfad:[KD_WURZEL,kdOrdName(k),...rest].join("/"),item:it.id}); saveRec("protokolle",r); }
async function kdDateiUmziehen(d,kid,soll){
  const name=kdDateiName(d), z=await kdUnter(kid,soll), drive=kdDrive(); if(!z) return;
  const haengen=async id=>{ const x=await g(`/drives/${drive}/items/${id}?@microsoft.graph.conflictBehavior=rename`,{method:"PATCH",headers:KD_JSON,body:JSON.stringify({parentReference:{id:z.item},name})});
    if(x.status===404) return null; if(!x.ok) throw kdFehler(x); return x.json(); };
  let it=d.item?await haengen(d.item):null;
  if(!it){ const q=await kdAltItem(BIB.dateien,`${CONFIG.dataFolder}/dateien/${d.id}.${endung(d)}`);
    if(q&&q.parentReference&&q.parentReference.driveId===drive) it=await haengen(q.id);
    else { const b=q?await (await readItem(q)).blob():await dateiGet(d.id); if(!b){ KD_FEHLT.add("d"+d.id); return; }
      it=await kdHoch(kid,[...soll,name],b,"rename"); if(q) await kdWeg(q); } }
  Object.assign(d,{item:it.id,ort:soll,ablage:it.name}); saveRec("dateien",d); }
async function kdPflege(){
  if(!kdAn()||kdPflegeLaeuft||!navigator.onLine) return; kdPflegeLaeuft=true; let n=0;
  const schritt=async(key,fn)=>{ if(n>=20) return false; n++; try{ await fn(); }catch(e){ if(e&&e.auth) throw e; KD_FEHLT.add(key); console.warn("Kundenordner",key,e); } return true; };
  const wartet=(q,id)=>(META.sync[q]||[]).includes(id);
  try{
    for(const k of [...DB.kunden.values()]){ if(k.deleted||k.demo||KD_FEHLT.has("k"+k.id)) continue; const r=kdoRec(k.id); if(r&&r.item&&r.soll===kdOrdName(k)) continue;
      if(!await schritt("k"+k.id,()=>kdOrdner(k.id))) return; }
    for(const r of [...DB.protokolle.values()]){ if(r.deleted||r.demo||KD_FEHLT.has("p"+r.id)||wartet("protQueue",r.id)||!bbKunde(r.kundeId)) continue;
      if(r.bib==="kd"){ if(r.item) continue;
        if(!await schritt("p"+r.id,async()=>{ const it=await kdItem(r.kundeId,kdRest(r.pfad)); if(it){ r.item=it.id; saveRec("protokolle",r); } else KD_FEHLT.add("p"+r.id); })) return; continue; }
      if(!await schritt("p"+r.id,()=>kdProtUmziehen(r))) return; }
    if(DB.dateien) for(const d of [...DB.dateien.values()]){ if(d.demo||KD_FEHLT.has("d"+d.id)||wartet("dateiQueue",d.id)) continue;
      if(d.deleted){ if(d.item&&!d.spWeg&&!await schritt("d"+d.id,async()=>{ const x=await g(`/drives/${kdDrive()}/items/${d.item}`,{method:"DELETE"}); if(x.ok||x.status===404){ d.spWeg=true; saveRec("dateien",d); } })) return; continue; }
      const kid=kdDateiKunde(d); if(!kid||!bbKunde(kid)) continue; const soll=kdOrtDatei(d);
      if(d.item&&JSON.stringify(d.ort||[])===JSON.stringify(soll)) continue;
      if(!await schritt("d"+d.id,()=>kdDateiUmziehen(d,kid,soll))) return; }
  } finally { kdPflegeLaeuft=false; if(n&&typeof nav!=="undefined"&&nav.v==="bibliothek"){ const rs=document.getElementById("res"); if(rs) rs.innerHTML=bibListe(); } }
}

/* ===== Was in SharePoint liegt (auch vom Büro direkt abgelegt) – für die Ordner-Ansicht der Bibliothek ===== */
const BB_SP=new Map(), BB_SP_LAEUFT=new Set(), bbSpKey=(k,p)=>k+"|"+p.join("/");
function bbSpStand(k,p){ const key=bbSpKey(k,p), c=BB_SP.get(key); if(!c||Date.now()-c.t>60000) bbSpLaden(k,p); return c||null; }
async function bbSpLaden(k,p){
  const key=bbSpKey(k,p), r=kdoRec(k); if(BB_SP_LAEUFT.has(key)||!kdAn()||!navigator.onLine||!r||!r.item) return; BB_SP_LAEUFT.add(key);
  try{ await syncRoot(); const d=kdDrive(), x=await g(`/drives/${d}/items/${r.item}${p.length?":/"+kdEnc(p)+":":""}/children?$top=200`);
    let L=[]; if(x.ok) L=(await x.json()).value||[]; else if(x.status!==404) return;
    BB_SP.set(key,{t:Date.now(),
      ordner:L.filter(i=>i.folder).map(i=>({id:i.id,name:i.name,n:i.folder.childCount||0,web:i.webUrl||""})),
      dateien:L.filter(i=>i.file).map(i=>({id:i.id,name:i.name,size:i.size||0,mime:(i.file&&i.file.mimeType)||"",web:i.webUrl||"",t:Date.parse(i.lastModifiedDateTime||"")||0,
        von:(i.lastModifiedBy&&i.lastModifiedBy.user&&i.lastModifiedBy.user.displayName)||""}))});
    if(typeof nav!=="undefined"&&nav.v==="bibliothek"&&BB_ORT.k===k&&bbSpKey(k,BB_ORT.p)===key){ const rs=document.getElementById("res"); if(rs){ const y=scrollY; rs.innerHTML=bibListe(); scrollTo(0,y); } }
  }catch(e){} finally{ BB_SP_LAEUFT.delete(key); } }
function bbSpDatei(id){ for(const c of BB_SP.values()){ const f=c.dateien.find(x=>x.id===id); if(f) return f; } return null; }
async function bbSpOeffnen(id){
  const f=bbSpDatei(id); if(!f) return; const bild=/^image\//.test(f.mime), pdf=/pdf/i.test(f.mime)||/\.pdf$/i.test(f.name);
  if(!bild&&!pdf){ window.open(f.web,"_blank","noopener"); return; }
  const w=pdf?window.open("about:blank","_blank"):null; toast("Wird geladen …");
  try{ await syncRoot(); const it=await gj(`/drives/${kdDrive()}/items/${id}`), u=URL.createObjectURL(await (await readItem(it)).blob());
    if(w){ w.location.href=u; return; }
    dialog(f.name,`<p class="sup" style="margin:0 0 12px">${esc(["In SharePoint abgelegt",f.von,f.t&&new Date(f.t).toLocaleDateString("de-DE")].filter(Boolean).join(" · "))}</p><img class="dimg" src="${u}" alt="">`,
      `<button class="btn-text" data-act="bbWeb" data-u="${esc(f.web)}">In SharePoint öffnen</button><span style="flex:1"></span><button class="btn-text" data-act="cancel">Schließen</button>`);
  }catch(e){ if(w) w.close(); toast(navigator.onLine?"Datei konnte nicht geladen werden":"Kein Internet – die Datei liegt in SharePoint"); } }
