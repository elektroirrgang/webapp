/* ===== Demo-Vorschau =====
   Über Einstellungen → „Demo-Vorschau“ einschaltbar. Dann erscheinen Beispielkunden, Aufträge, Baustellen, Übergaben,
   Materialanforderungen und Prüfungen in allen Apps – nur im Speicher dieses Geräts, mit demo:true markiert.
   Sie werden NIE nach SharePoint hochgeladen (der Abgleich überspringt demo-Datensätze). Beim Ausschalten wird alles
   wieder entfernt, auch was man an Beispieldaten geändert hat. Der Schalter gilt für alle Apps dieses Browsers. */
const DEMO_KEY="irrgang_demo";
const demoAn=()=>{ try{ return localStorage.getItem(DEMO_KEY)==="1"; }catch(e){ return false; } };
const DEMO_SPEICHER=[["evse_daten",["kunden","standorte","ladeparks","pruefungen","katalog"]],["baustelle_daten",["baustellen","eintraege","notizen","anforderungen"]],["irrgang_apps",["vorgaenge","geraete","dateien"]]];
const DEMO_FOTOS={"demo-f-zp":"zp","demo-f-hak":"hak","demo-f-uvalt":"uvalt","demo-f-mangel":"mangel","demo-f-ue-baustrom":"baustrom","demo-f-ue-leerrohr":"leerrohr","demo-f-ue-uv":"uv","demo-f-ue-pa":"pa"};
function demoDaten(){
  const T=864e5, jetzt=Date.now(), vor=(t,h=0)=>jetzt-t*T-h*36e5, tag=t=>new Date(jetzt+t*T).toISOString().slice(0,10);
  const P={ab:{name:"A. Brandl",mail:"a.brandl@elektro-irrgang.de"},ms:{name:"M. Seipp",mail:"m.seipp@elektro-irrgang.de"},mp:{name:"M. Pevec",mail:"m.pevec@elektro-irrgang.de"},ai:{name:"A. Irrgang",mail:"a.irrgang@elektro-irrgang.de"},bu:{name:"Büro",mail:"alex@elektro-irrgang.de"}};
  const r=(o,wer,t)=>Object.assign({demo:true,created:t,updated:t,createdBy:wer,updatedBy:wer},o);
  const kunden=[
    r({id:"demo-k1",name:"Löwen-Apotheke",kdnr:"D-1001",strasse:"Hauptstraße 12",plz:"51597",ort:"Morsbach",tel:"02294 900100",mail:"info@loewen-apotheke.example",
      kontakte:[{id:"demo-c1",name:"Dr. Sabine Kraft",rolle:"Inhaber",tel:"0171 0000001"},{id:"demo-c2",name:"Herr Weber",rolle:"Hausmeister",tel:"0171 0000002"}],ansprech:"Dr. Sabine Kraft"},P.bu,vor(40)),
    r({id:"demo-k2",name:"Autohaus Bergland GmbH",kdnr:"D-1002",strasse:"Industriestraße 4",plz:"51545",ort:"Waldbröl",tel:"02291 900200",mail:"service@bergland.example",
      kontakte:[{id:"demo-c3",name:"Thomas Berg",rolle:"Geschäftsführung",mail:"t.berg@bergland.example"},{id:"demo-c4",name:"Pförtnerhaus",rolle:"Pförtner",tel:"02291 900209"}],ansprech:"Thomas Berg"},P.bu,vor(60)),
    r({id:"demo-k3",name:"Schreinerei Kraus",kdnr:"D-1003",strasse:"Am Sägewerk 2",plz:"51674",ort:"Wiehl",tel:"02262 900300",kontakte:[{id:"demo-c5",name:"Peter Kraus",rolle:"Inhaber",tel:"0171 0000005"}],ansprech:"Peter Kraus"},P.ab,vor(25)),
    r({id:"demo-k4",name:"Familie Hoffmann",strasse:"Lindenweg 7",plz:"51545",ort:"Waldbröl",tel:"0171 0000007"},P.mp,vor(12)),
    r({id:"demo-k5",name:"Wohnbau Waldbröl eG",kdnr:"D-1005",strasse:"Kaiserstraße 30",plz:"51545",ort:"Waldbröl",mail:"technik@wohnbau.example",kontakte:[{id:"demo-c6",name:"Frau Lenz",rolle:"Ansprechpartner",tel:"02291 900500"}],ansprech:"Frau Lenz"},P.bu,vor(90))];
  const standorte=[
    r({id:"demo-s1",kundeId:"demo-k2",name:"Werkstatt",strasse:"Industriestraße 4",plz:"51545",ort:"Waldbröl"},P.bu,vor(60)),
    r({id:"demo-s2",kundeId:"demo-k2",name:"Ausstellung",strasse:"Industriestraße 6",plz:"51545",ort:"Waldbröl"},P.bu,vor(60)),
    r({id:"demo-s3",kundeId:"demo-k5",name:"Haus A",strasse:"Kaiserstraße 30",plz:"51545",ort:"Waldbröl"},P.bu,vor(90)),
    r({id:"demo-s4",kundeId:"demo-k5",name:"Haus B",strasse:"Kaiserstraße 34",plz:"51545",ort:"Waldbröl"},P.bu,vor(90)),
    r({id:"demo-s5",kundeId:"demo-k1",name:"Apotheke",strasse:"Hauptstraße 12",plz:"51597",ort:"Morsbach"},P.bu,vor(40)),
    r({id:"demo-s6",kundeId:"demo-k3",name:"Halle 2",strasse:"Am Sägewerk 2",plz:"51674",ort:"Wiehl"},P.ab,vor(25))];
  const baustellen=[
    r({id:"demo-b1",kundeId:"demo-k4",standortId:"",name:"Elektroinstallation Neubau EFH",auftragsnr:"A-24117",status:"aktiv"},P.ai,vor(20)),
    r({id:"demo-b2",kundeId:"demo-k2",standortId:"demo-s1",name:"Ladeinfrastruktur Werkstatt",auftragsnr:"A-24121",status:"aktiv"},P.ai,vor(14)),
    r({id:"demo-b3",kundeId:"demo-k3",standortId:"",name:"Unterverteilung Halle 2",auftragsnr:"A-24098",status:"pausiert"},P.ai,vor(35)),
    r({id:"demo-b4",kundeId:"demo-k5",standortId:"demo-s3",name:"Treppenhausbeleuchtung LED",auftragsnr:"A-24060",status:"fertig"},P.ai,vor(70))];
  const eintraege=[
    r({id:"demo-e1",baustelleId:"demo-b1",datum:tag(0),stand:"Leerrohre im OG verlegt, Dosen gesetzt.",offen:"Bad anschließen, Zählerschrank bestücken",mat:[],fotos:[],dabei:["A. Brandl","M. Pevec"]},P.ab,vor(0,3)),
    r({id:"demo-e2",baustelleId:"demo-b2",datum:tag(-1),stand:"Kabeltrasse montiert, NYY 5×16 eingezogen.",offen:"Wallboxen setzen nach Lieferung",mat:[],fotos:[],dabei:["M. Seipp"]},P.ms,vor(1,5)),
    r({id:"demo-e3",baustelleId:"demo-b1",datum:tag(-3),stand:"Baustrom eingerichtet, Erdung geprüft.",offen:"",mat:[],fotos:[],dabei:["A. Brandl"]},P.ab,vor(3)),
    r({id:"demo-e4",baustelleId:"demo-b3",datum:tag(-9),stand:"Alte UV demontiert.",offen:"Warten auf Freigabe vom Kunden",mat:[],fotos:[],dabei:["M. Seipp","A. Irrgang"]},P.ms,vor(9))];
  const vorgaenge=[
    r({id:"demo-v1",kundeId:"demo-k1",anliegen:"Notbeleuchtung im Lager prüfen, eine Leuchte defekt",tel:"02294 900100",dringend:true,s:{anruf:{wer:P.bu,at:vor(0,2)}}},P.bu,vor(0,2)),
    r({id:"demo-v2",kundeId:"demo-k3",anliegen:"Angebot für zwei Drehstromsteckdosen in der Halle",s:{anruf:{wer:P.ab,at:vor(2)},anfrage:{wer:P.ab,at:vor(2)}}},P.ab,vor(2)),
    r({id:"demo-v3",kundeId:"demo-k2",anliegen:"Zwei weitere Wallboxen an der Ausstellung",s:{anruf:{wer:P.bu,at:vor(6)},anfrage:{wer:P.bu,at:vor(6)},auftrag:{wer:P.bu,at:vor(4),nr:"A-24130"}}},P.bu,vor(6)),
    r({id:"demo-v4",kundeName:"Herr Schulz (Neukunde)",anliegen:"Wohnung renovieren – Steckdosen und Licht neu",tel:"0171 0000010",s:{anruf:{wer:P.bu,at:vor(1)}}},P.bu,vor(1)),
    r({id:"demo-v5",kundeId:"demo-k5",anliegen:"E-Check Haus B",s:{anruf:{wer:P.bu,at:vor(30)},anfrage:{wer:P.bu,at:vor(30)},auftrag:{wer:P.bu,at:vor(28),nr:"A-24062"},termin:{wer:P.bu,at:vor(20)},ausgefuehrt:{wer:P.ms,at:vor(15)}}},P.bu,vor(30))];
  const anforderungen=[
    r({id:"demo-a1",baustelleId:"demo-b1",eintragId:"",pos:[{t:"NYM-J 3×1,5",q:100,u:"m"},{t:"Wago 221-413",q:2,u:"Pck"}],notiz:"",status:"angefordert",statusAm:vor(0,3),statusVon:P.ab},P.ab,vor(0,3)),
    r({id:"demo-a2",baustelleId:"demo-b2",eintragId:"",pos:[{t:"Kabelbinder 300 mm",q:1,u:"Pck"},{t:"Hager LS B16",q:6,u:"Stück"}],notiz:"",status:"bestellt",statusAm:vor(0,20),statusVon:P.bu},P.ms,vor(1)),
    r({id:"demo-a3",baustelleId:"",eintragId:"",pos:[{t:"Isolierband schwarz",q:10,u:"Stück"}],notiz:"Fürs Lager",status:"angefordert",statusAm:vor(2),statusVon:P.mp},P.mp,vor(2))];
  const pr=(id,k,s,art,datum,naechste,pdf,wer,t)=>r({id,kundeId:k,standortId:s,ladeparkId:"",p:{datum,art,auftragsnr:"",pruefer:wer.name},a:{naechste,sigP:pdf?"x":""},s:[{lps:2}],pdfAblage:pdf?"demo.pdf":"",zst:pdf?"ok":"wip"},wer,t);
  const pruefungen=[
    pr("demo-p1","demo-k2","demo-s1","Erstprüfung",tag(-2),tag(363),true,P.mp,vor(2)),
    pr("demo-p2","demo-k1","demo-s5","Wiederholungsprüfung",tag(-400),tag(-35),true,P.ms,vor(400)),
    pr("demo-p3","demo-k5","demo-s3","Wiederholungsprüfung",tag(-330),tag(35),true,P.mp,vor(330)),
    pr("demo-p4","demo-k3","demo-s6","Erstprüfung",tag(0),"",false,P.ab,vor(0,1))];
  return {kunden,standorte,baustellen,eintraege,vorgaenge,anforderungen,pruefungen};
}
let demoCache=null;
/* Beispieldaten in den Speicher dieser App legen (nicht in die Datenbank) – true, wenn etwas dazugekommen ist */
function demoNachfuellen(){
  if(!demoAn()||typeof DB==="undefined"||typeof KINDS==="undefined") return false;
  demoCache=demoCache||demoDaten(); let neu=false; const uebersicht=KINDS.includes("vorgaenge");
  for(const [k,L] of Object.entries(demoCache)){ if(!DB[k]||!KINDS.includes(k)||(k==="pruefungen"&&!uebersicht)) continue;
    for(const x of L) if(!DB[k].has(x.id)){ DB[k].set(x.id,JSON.parse(JSON.stringify(x))); neu=true; } }
  return neu;
}
function demoIdb(rq){ return new Promise((res,rej)=>{ rq.onsuccess=()=>res(rq.result); rq.onerror=()=>rej(rq.error); }); }
function demoTx(tx){ return new Promise(res=>{ tx.oncomplete=tx.onerror=tx.onabort=()=>res(); }); }
/* Alles mit demo:true von diesem Gerät entfernen (auch Beispieldaten, die beim Ausprobieren geändert und dabei gespeichert wurden) */
async function demoSchalten(){
  for(const [name,stores] of DEMO_SPEICHER){
    try{ const db=await openStores(name,stores,true);
      for(const s of stores){ if(!db.objectStoreNames.contains(s)) continue; const alle=await demoIdb(db.transaction(s).objectStore(s).getAll()); const tx=db.transaction(s,"readwrite"); alle.filter(r=>r&&r.demo).forEach(r=>tx.objectStore(s).delete(r.id)); await demoTx(tx); }
      db.close(); }catch(e){}
  }
  try{ const rq=indexedDB.open("baustelle_fotos",1); rq.onupgradeneeded=()=>rq.result.createObjectStore("f"); const db=await demoIdb(rq);
    if(db.objectStoreNames.contains("f")){ const tx=db.transaction("f","readwrite"); Object.keys(DEMO_FOTOS).forEach(id=>tx.objectStore("f").delete(id)); await demoTx(tx); } db.close(); }catch(e){}
  try{ const db=await demoIdb(indexedDB.open("evse_protokolle"));
    if(db.objectStoreNames.contains("meta")){ const m=await demoIdb(db.transaction("meta").objectStore("meta").getAll()), weg=m.filter(x=>x.demo).map(x=>x.id);
      if(weg.length){ const tx=db.transaction(["meta","blob"],"readwrite"); weg.forEach(id=>{ tx.objectStore("meta").delete(id); tx.objectStore("blob").delete(id); }); await demoTx(tx); } }
    db.close(); }catch(e){}
  location.reload();
}
function demoUmschalten(an){
  try{ localStorage.setItem(DEMO_KEY,an?"1":"0"); }catch(e){}
  if(an){ demoNachfuellen(); render(); toast("Demo-Vorschau an – Beispieldaten werden nicht gespeichert oder synchronisiert"); }
  else demoSchalten();
}
const demoDa=()=>["kunden","standorte","baustellen","pruefungen","eintraege","vorgaenge","anforderungen"].some(k=>DB[k]&&[...DB[k].values()].some(r=>r.demo));
let demoWeg=false;
/* Demo aus, aber noch Beispieldaten auf dem Gerät (z. B. in einer anderen App ausgeschaltet) ⇒ aufräumen */
const demoPruefen=()=>{ try{ if(!demoAn()&&!demoWeg&&demoDa()){ demoWeg=true; demoSchalten(); } }catch(e){} };
addEventListener("load",()=>{ setTimeout(demoPruefen,1500); setTimeout(demoPruefen,6000); });
/* Hinweis oben, solange die Demo läuft */
function demoMarke(){ const row=document.querySelector("#topbar .tb-row"); if(!row) return; let m=document.getElementById("demoMarke");
  if(!demoAn()){ if(m) m.remove(); return; }
  if(!m){ m=document.createElement("span"); m.id="demoMarke"; m.className="demo-marke"; m.textContent="Demo"; m.title="Demo-Vorschau: Beispieldaten, nur auf diesem Gerät. Ausschalten in der Übersicht unter Einstellungen."; }
  const vor=document.getElementById("glBtn")||document.getElementById("avBtn"); if(vor&&m.nextSibling!==vor) row.insertBefore(m,vor); }
