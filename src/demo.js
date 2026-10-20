/* Beispieldaten sind entfernt (20.10.2026). Dieser Teil räumt alte Beispieldatensätze (demo:true) einmalig
   von den Geräten – sie wurden nie nach SharePoint hochgeladen. */
const DEMO_SPEICHER=[["evse_daten",["kunden","standorte","ladeparks","pruefungen","katalog"]],["baustelle_daten",["baustellen","eintraege","notizen"]],["irrgang_apps",["vorgaenge"]]];
const DEMO_FOTOS={"demo-f-zp":"zp","demo-f-hak":"hak","demo-f-uvalt":"uvalt","demo-f-mangel":"mangel","demo-f-ue-baustrom":"baustrom","demo-f-ue-leerrohr":"leerrohr","demo-f-ue-uv":"uv","demo-f-ue-pa":"pa"};
function demoIdb(rq){ return new Promise((res,rej)=>{ rq.onsuccess=()=>res(rq.result); rq.onerror=()=>rej(rq.error); }); }
function demoTx(tx){ return new Promise(res=>{ tx.oncomplete=tx.onerror=tx.onabort=()=>res(); }); }
async function demoSchalten(){
  for(const [name,stores] of DEMO_SPEICHER){
    const db=await openStores(name,stores,true);
    for(const s of stores){ const alle=await demoIdb(db.transaction(s).objectStore(s).getAll()); const tx=db.transaction(s,"readwrite"); alle.filter(r=>r.demo).forEach(r=>tx.objectStore(s).delete(r.id)); await demoTx(tx); }
    db.close();
  }
  try{ const rq=indexedDB.open("baustelle_fotos",1); rq.onupgradeneeded=()=>rq.result.createObjectStore("f"); const db=await demoIdb(rq);
    if(db.objectStoreNames.contains("f")){ const tx=db.transaction("f","readwrite"); Object.keys(DEMO_FOTOS).forEach(id=>tx.objectStore("f").delete(id)); await demoTx(tx); } db.close(); }catch(e){}
  try{ const db=await demoIdb(indexedDB.open("evse_protokolle"));
    if(db.objectStoreNames.contains("meta")){ const m=await demoIdb(db.transaction("meta").objectStore("meta").getAll()), weg=m.filter(x=>x.demo).map(x=>x.id);
      if(weg.length){ const tx=db.transaction(["meta","blob"],"readwrite"); weg.forEach(id=>{ tx.objectStore("meta").delete(id); tx.objectStore("blob").delete(id); }); await demoTx(tx); } }
    db.close(); }catch(e){}
  location.reload();
}
const demoDa=()=>["kunden","standorte","baustellen","pruefungen","eintraege"].some(k=>DB[k]&&[...DB[k].values()].some(r=>r.demo));
let demoWeg=false;
const demoPruefen=()=>{ try{ if(!demoWeg&&demoDa()){ demoWeg=true; demoSchalten(); } }catch(e){} };
addEventListener("load",()=>{ setTimeout(demoPruefen,1500); setTimeout(demoPruefen,6000); });
