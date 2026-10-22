/* ===== Demo-Vorschau =====
   Über Einstellungen → „Demo-Vorschau“ einschaltbar. Dann erscheinen Beispielkunden, Aufträge, Baustellen, Übergaben,
   Materialanforderungen und Prüfungen in allen Apps – nur im Speicher dieses Geräts, mit demo:true markiert.
   Sie werden NIE nach SharePoint hochgeladen (der Abgleich überspringt demo-Datensätze). Beim Ausschalten wird alles
   wieder entfernt, auch was man an Beispieldaten geändert hat. Der Schalter gilt für alle Apps dieses Browsers. */
const DEMO_KEY="irrgang_demo";
/* Schalter gilt systemweit: er steht im eigenen Profil (wird abgeglichen) – so ist die Demo in allen Apps und auf allen eigenen Geräten an.
   Ohne Profil (nicht angemeldet) gilt der Schalter dieses Browsers. */
const demoProfil=()=>{ try{ return typeof profilVon==="function"&&typeof ME!=="undefined"&&ME.mail?profilVon(ME.mail):null; }catch(e){ return null; } };
const demoAn=()=>{ const p=demoProfil(); if(p&&typeof p.demoVorschau==="boolean") return p.demoVorschau; /* nicht „demo“ – Datensätze mit demo werden nie abgeglichen */ try{ return localStorage.getItem(DEMO_KEY)==="1"; }catch(e){ return false; } };
const DEMO_SPEICHER=[["evse_daten",["kunden","standorte","ladeparks","pruefungen","katalog"]],["baustelle_daten",["baustellen","eintraege","notizen","anforderungen"]],["irrgang_apps",["vorgaenge","geraete","dateien","protokolle"]]];
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
    r({id:"demo-v6",kundeId:"demo-k4",anliegen:"Außensteckdose Terrasse setzen",s:{anruf:{wer:P.bu,at:vor(9)},anfrage:{wer:P.bu,at:vor(9)},auftrag:{wer:P.bu,at:vor(7),nr:"A-24127"},termin:{wer:P.bu,at:vor(5),datum:tag(2),zeit:"7:30",mit:"A. Brandl"}},zust:{mail:P.ab.mail,name:P.ab.name,at:vor(5),von:P.bu},notizen:[{id:"demo-n1",wer:P.bu,at:vor(5),text:"Schlüssel liegt beim Nachbarn (Nr. 9)."}]},P.bu,vor(9)),
    r({id:"demo-v3",kundeId:"demo-k2",anliegen:"Zwei weitere Wallboxen an der Ausstellung",s:{anruf:{wer:P.bu,at:vor(6)},anfrage:{wer:P.bu,at:vor(6)},auftrag:{wer:P.bu,at:vor(4),nr:"A-24130"}}},P.bu,vor(6)),
    r({id:"demo-v4",kundeName:"Herr Schulz (Neukunde)",anliegen:"Wohnung renovieren – Steckdosen und Licht neu",tel:"0171 0000010",s:{anruf:{wer:P.bu,at:vor(1)}}},P.bu,vor(1)),
    r({id:"demo-v5",kundeId:"demo-k5",anliegen:"E-Check Haus B",s:{anruf:{wer:P.bu,at:vor(12)},anfrage:{wer:P.bu,at:vor(12)},auftrag:{wer:P.bu,at:vor(10),nr:"A-24062"},termin:{wer:P.bu,at:vor(8),datum:tag(-4),zeit:"8:00",mit:"M. Seipp"},ausgefuehrt:{wer:P.ms,at:vor(4)}},zust:{mail:P.ms.mail,name:P.ms.name,at:vor(10),von:P.bu}},P.bu,vor(12))];
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
  /* Bibliothek: zu jeder Beispiel-Prüfung mit PDF ein Eintrag – so zeigt die Demo die Ordner in allen Apps */
  const protokolle=pruefungen.filter(x=>x.pdfAblage).map(x=>{ const k=kunden.find(y=>y.id===x.kundeId), s=standorte.find(y=>y.id===x.standortId);
    return r({id:"demo-pb-"+x.id,app:"evse",bib:"pdf",pfad:"demo.pdf",pruefungId:x.id,kundeId:x.kundeId,standortId:x.standortId||"",name:"Prüfprotokoll "+x.p.datum,titel:[k&&k.name,s&&s.name].filter(Boolean).join(" · "),
      datum:x.p.datum,art:x.p.art,pruefer:x.p.pruefer,ergebnis:"ok",von:x.createdBy},x.createdBy,x.created); });
  /* Baustellen-Berichte und ein Prüfprotokoll mit Mängeln (PDF wird beim Öffnen erzeugt) */
  protokolle.forEach(x=>{ if(x.pruefungId==="demo-p2"){ x.ergebnis="bad"; x.maengel=true; } });
  protokolle.push(
    r({id:"demo-pb-b1",app:"baustelle",bib:"baustellen",pfad:"demo.pdf",kundeId:"demo-k4",baustelleId:"demo-b1",name:"Aufnahme Familie Hoffmann Neubau EFH",titel:"Familie Hoffmann · Elektroinstallation Neubau EFH",datum:tag(-19),art:"Aufnahmeprotokoll",auftragsnr:"A-24117",von:P.ai},P.ai,vor(19)),
    r({id:"demo-pb-b2",app:"baustelle",bib:"baustellen",pfad:"demo.pdf",kundeId:"demo-k2",standortId:"demo-s1",baustelleId:"demo-b2",name:"Aufnahme Autohaus Bergland Ladeinfrastruktur",titel:"Autohaus Bergland GmbH · Ladeinfrastruktur Werkstatt",datum:tag(-13),art:"Aufnahmeprotokoll",auftragsnr:"A-24121",von:P.ms},P.ms,vor(13)));
  /* Notizen: für die ganze Firma, für bestimmte Personen, ein Whiteboard */
  const nid=(()=>{ let i=0; return ()=>"demo-nb"+(++i); })();
  const notizen=[
    r({id:"demo-n-firma1",titel:"Wichtig für alle",sicht:"firma",personen:[],baustelleId:"",bloecke:[{id:nid(),typ:"text",text:"Lagerschlüssel hängt ab sofort im Büro am Brett. Fahrzeuge bitte abends volltanken."},
      {id:nid(),typ:"check",items:[{id:nid(),t:"Fahrzeugcheck Montag",ok:true},{id:nid(),t:"Prüfgeräte zur Kalibrierung (Wiha MFT one)",ok:false},{id:nid(),t:"Leiter Sprinter 2 tauschen",ok:false}]}]},P.bu,vor(1,4)),
    r({id:"demo-n-firma2",titel:"Ablauf Wallbox-Prüfung",sicht:"firma",personen:[],baustelleId:"",bloecke:[{id:nid(),typ:"liste",items:[{id:nid(),t:"Sichtprüfung und Typenschild"},{id:nid(),t:"Isolationswiderstand"},{id:nid(),t:"Schutzleiterwiderstand"},{id:nid(),t:"RCD Typ A + DC 6 mA"},{id:nid(),t:"Funktionstest mit FEV300"}]}]},P.mp,vor(6)),
    r({id:"demo-n-pers1",titel:"Hoffmann – Schlüssel",sicht:"personen",personen:[P.mp.mail,P.ab.mail],baustelleId:"demo-b1",bloecke:[{id:nid(),typ:"text",text:"Schlüssel liegt beim Nachbarn (Nr. 9). Bauherr ist ab 16 Uhr vor Ort."}]},P.ai,vor(2)),
    r({id:"demo-n-board",titel:"Planung KW 44",sicht:"firma",personen:[],board:true,baustelleId:"",bloecke:[{id:nid(),typ:"zeichnung",format:"board",raster:"punkte",striche:[
      {t:"zettel",c:"#FFE58A",p:[0,0,240,170],s:"Mo/Di\nHoffmann\nZählerschrank",fs:26},
      {t:"zettel",c:"#F8BBD0",p:[280,0,520,170],s:"Mi\nBergland\nWallboxen setzen",fs:26},
      {t:"zettel",c:"#B3E5FC",p:[560,0,800,170],s:"Do/Fr\nE-Check\nWohnbau Haus B",fs:26},
      {t:"zettel",c:"#C8E6C9",p:[280,220,520,390],s:"Material\nbis Di bestellen",fs:26}]}]},P.ai,vor(0,6))];
  /* Dokumente und Fotos in den Kundenablagen (Inhalt wird beim Öffnen erzeugt) */
  const dateien=[
    r({id:"demo-d1b",bezugKind:"kunden",bezugId:"demo-k2",name:"Angebot Wallboxen Ausstellung.pdf",typ:"application/pdf",groesse:48200,demoArt:"angebot"},P.bu,vor(5)),
    r({id:"demo-d2b",bezugKind:"standorte",bezugId:"demo-s1",name:"Zählerschrank Werkstatt.jpg",typ:"image/jpeg",groesse:182000,demoArt:"zaehler"},P.ms,vor(13)),
    r({id:"demo-d3b",bezugKind:"kunden",bezugId:"demo-k1",name:"Notleuchte Lager.jpg",typ:"image/jpeg",groesse:121000,demoArt:"leuchte"},P.ab,vor(1)),
    r({id:"demo-d4b",bezugKind:"kunden",bezugId:"demo-k5",name:"Schaltplan Haus B.pdf",typ:"application/pdf",groesse:63000,demoArt:"schaltplan"},P.bu,vor(30)),
    r({id:"demo-d5b",bezugKind:"standorte",bezugId:"demo-s3",name:"Unterverteilung Haus A.jpg",typ:"image/jpeg",groesse:150000,demoArt:"uv"},P.ms,vor(20))];
  return {kunden,standorte,baustellen,eintraege,vorgaenge,anforderungen,pruefungen,protokolle,notizen,dateien};
}
let demoCache=null;
/* Beispieldaten in den Speicher dieser App legen (nicht in die Datenbank) – true, wenn etwas dazugekommen ist */
function demoNachfuellen(){
  if(!demoAn()||typeof DB==="undefined"||typeof KINDS==="undefined") return false;
  demoCache=demoCache||demoDaten(); let neu=false; const uebersicht=KINDS.includes("vorgaenge");
  for(const [k,L] of Object.entries(demoCache)){ if(!DB[k]||!(KINDS.includes(k)||k==="notizen")||(k==="pruefungen"&&!uebersicht)) continue;
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
  try{ const db=await demoIdb(indexedDB.open("irrgang_dateien"));
    if(db.objectStoreNames.contains("d")){ const ks=(await demoIdb(db.transaction("d").objectStore("d").getAllKeys())).filter(k=>String(k).startsWith("demo-")); if(ks.length){ const tx=db.transaction("d","readwrite"); ks.forEach(k=>tx.objectStore("d").delete(k)); await demoTx(tx); } }
    db.close(); }catch(e){}
  try{ const db=await demoIdb(indexedDB.open("evse_protokolle"));
    if(db.objectStoreNames.contains("meta")){ const m=await demoIdb(db.transaction("meta").objectStore("meta").getAll()), weg=m.filter(x=>x.demo).map(x=>x.id);
      if(weg.length){ const tx=db.transaction(["meta","blob"],"readwrite"); weg.forEach(id=>{ tx.objectStore("meta").delete(id); tx.objectStore("blob").delete(id); }); await demoTx(tx); } }
    db.close(); }catch(e){}
  location.reload();
}
function demoUmschalten(an){
  try{ localStorage.setItem(DEMO_KEY,an?"1":"0"); }catch(e){}
  /* im eigenen Profil merken ⇒ alle Apps und Geräte ziehen beim nächsten Abgleich nach */
  try{ if(typeof ME!=="undefined"&&ME.mail&&DB.profile&&typeof saveRec==="function"){ const id=String(ME.mail).toLowerCase(), p=DB.profile.get(id);
    if(p){ p.demoVorschau=an; saveRec("profile",p); } else saveRec("profile",{id,demoVorschau:an},true); } }catch(e){}
  if(an){ demoNachfuellen(); render(); toast("Demo-Vorschau an – Beispieldaten werden nicht gespeichert oder synchronisiert"); }
  else demoSchalten();
}
const demoDa=()=>["kunden","standorte","baustellen","pruefungen","eintraege","vorgaenge","anforderungen"].some(k=>DB[k]&&[...DB[k].values()].some(r=>r.demo));
let demoWeg=false;
/* Demo aus, aber noch Beispieldaten auf dem Gerät (z. B. in einer anderen App ausgeschaltet) ⇒ aufräumen */
const demoPruefen=()=>{ try{ if(!demoAn()&&!demoWeg&&demoDa()){ demoWeg=true; demoSchalten(); } }catch(e){} };
addEventListener("load",()=>{ setTimeout(demoPruefen,1500); setTimeout(demoPruefen,6000); });
/* Schalter kommt evtl. erst mit dem Abgleich (andere App/anderes Gerät): regelmäßig nachsehen */
setInterval(()=>{ try{ if(demoAn()){ if(demoNachfuellen()) (typeof softRender==="function"?softRender:render)(); } else demoPruefen(); }catch(e){} },8000);
/* Zeile für „Mehr“ in allen Apps */
function demoZeile(){ return `<div class="li" role="button" tabindex="0" data-act="demoUm"><span class="av">${icon("bulb")}</span><span class="lt"><span class="h">Demo-Vorschau</span><span class="s">Beispielkunden, Aufträge, Baustellen, Prüfungen und Bibliothek zum Ausprobieren – gilt in allen Apps und auf allen deinen Geräten, Beispieldaten werden nie hochgeladen</span></span><span class="schalter${demoAn()?" an":""}" aria-hidden="true"><i></i></span></div>`; }
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act="demoUm"]'); if(!b) return; e.stopPropagation(); e.preventDefault(); demoUmschalten(!demoAn()); },true);
/* ===== Entwickler-Einstellungen (nur Rolle „Entwickler“): ganz unten in „Mehr“ ===== */
const istEntwickler=()=>{ try{ return typeof meineRollen==="function"&&meineRollen().includes("Entwickler"); }catch(e){ return false; } };
function entwicklerBereich(){ if(!istEntwickler()) return ""; const z=[typeof mlDiagZeile==="function"&&ME.mail?mlDiagZeile():"",typeof mlTestZeile==="function"&&ME.mail?mlTestZeile():""].join("").trim();
  return z?`<div class="sec-lbl">Entwickler</div><div class="list">${z}</div>`:""; }
/* Hinweis oben, solange die Demo läuft */
function demoMarke(){ const row=document.querySelector("#topbar .tb-row"); if(!row) return; let m=document.getElementById("demoMarke");
  if(!demoAn()){ if(m) m.remove(); return; }
  if(!m){ m=document.createElement("span"); m.id="demoMarke"; m.className="demo-marke"; m.textContent="Demo"; m.title="Demo-Vorschau: Beispieldaten in allen Apps. Ausschalten unter Mehr → Demo-Vorschau."; }
  const vor=document.getElementById("glBtn")||document.getElementById("avBtn"); if(vor&&m.nextSibling!==vor) row.insertBefore(m,vor); }

/* ===== Beispiel-PDFs und -Bilder für die Demo (ohne Bibliothek, läuft in allen Apps) ===== */
const DEMO_WIN={"–":"\x96","—":"\x97","„":"\x84","“":"\x93","”":"\x94","‚":"\x82","‘":"\x91","’":"\x92","€":"\x80","…":"\x85","•":"\x95","Ω":"Ohm","≥":">=","≤":"<=","→":"->","›":">"};
const demoWin=t=>[...String(t)].map(c=>DEMO_WIN[c]!==undefined?DEMO_WIN[c]:c.charCodeAt(0)<256?c:"?").join("");
/* kleines PDF (A4) aus Textzeilen, Flächen und Linien – Koordinaten in pt von oben links */
function demoPdfBauen(male){
  const W=595,H=842; let c="";
  const pe=x=>demoWin(x).replace(/[\\()]/g,m=>"\\"+m);
  const P={ text:(x,y,t,o={})=>{ const f=o.fett?"F2":"F1", z=o.gr||10, col=o.farbe||[.12,.12,.13]; c+=`${col.join(" ")} rg BT /${f} ${z} Tf ${x} ${H-y} Td (${pe(t)}) Tj ET\n`; },
    flaeche:(x,y,w,h,col)=>{ c+=`${col.join(" ")} rg ${x} ${H-y-h} ${w} ${h} re f\n`; },
    linie:(x1,y1,x2,y2,col=[.82,.83,.85],d=.6)=>{ c+=`${col.join(" ")} RG ${d} w ${x1} ${H-y1} m ${x2} ${H-y2} l S\n`; },
    schraeg:(t)=>{ c+=`q 0.94 0.94 0.95 rg 0.766 0.643 -0.643 0.766 150 260 cm BT /F2 96 Tf 0 0 Td (${pe(t)}) Tj ET Q\n`; } };
  male(P,W,H);
  const obj=["<< /Type /Catalog /Pages 2 0 R >>","<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>","<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
    `<< /Length ${c.length} >>\nstream\n${c}endstream`];
  let out="%PDF-1.4\n%\xE2\xE3\xCF\xD3\n"; const off=[];
  obj.forEach((o,i)=>{ off.push(out.length); out+=`${i+1} 0 obj\n${o}\nendobj\n`; });
  const x=out.length; out+=`xref\n0 ${obj.length+1}\n0000000000 65535 f \n`+off.map(n=>String(n).padStart(10,"0")+" 00000 n \n").join("")+`trailer\n<< /Size ${obj.length+1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF`;
  const u=new Uint8Array(out.length); for(let i=0;i<out.length;i++) u[i]=out.charCodeAt(i)&255; return new Blob([u],{type:"application/pdf"}); }
/* Briefkopf, Felderblock, Tabelle */
function demoPdfVorlage(titel,unter,felder,tab,schluss){ return demoPdfBauen((P,W)=>{
  const R=[.784,.063,.18], G=[.42,.43,.46];
  P.schraeg("BEISPIEL");
  P.flaeche(0,0,W,64,R); P.text(40,40,"Elektro Irrgang",{fett:1,gr:20,farbe:[1,1,1]}); P.text(W-230,34,"Hahner Weg 2 · 51545 Waldbröl",{gr:9,farbe:[1,1,1]}); P.text(W-230,48,"02291 4878 · info@elektro-irrgang.de",{gr:9,farbe:[1,1,1]});
  P.text(40,104,titel,{fett:1,gr:18}); if(unter) P.text(40,122,unter,{gr:10,farbe:G});
  let y=150; felder.forEach(([l,v],i)=>{ const x=i%2?310:40; if(i%2===0&&i) y+=36; P.text(x,y,l,{gr:8,farbe:G}); P.text(x,y+14,v||"–",{gr:11}); });
  y+=44; P.linie(40,y,W-40,y);
  if(tab){ y+=24; P.text(40,y,tab.t,{fett:1,gr:12}); y+=16; const sp=tab.sp;
    P.flaeche(40,y,W-80,20,[.95,.95,.96]); let x=46; tab.kopf.forEach((k,i)=>{ P.text(x,y+13,k,{fett:1,gr:8.5}); x+=sp[i]; }); y+=20;
    tab.zeilen.forEach(z=>{ let x=46; z.forEach((v,i)=>{ const schlecht=/nicht bestanden|Mangel/.test(v); P.text(x,y+14,v,{gr:9.5,farbe:schlecht?[.75,.1,.1]:undefined,fett:schlecht}); x+=sp[i]; }); y+=22; P.linie(40,y,W-40,y,[.9,.9,.92]); }); }
  (schluss||[]).forEach(([t,o])=>{ y+=o&&o.abstand?o.abstand:20; P.text(40,y,t,o||{}); });
  P.linie(40,780,W-40,780); P.text(40,796,"Erstellt mit der Demo-Vorschau der Irrgang-Apps – Beispieldaten, kein echtes Protokoll.",{gr:8,farbe:G}); }); }
/* Demo-PDFs im echten Irrgang-Layout (pdfstil.js wie das EVSE-Prüfprotokoll); ohne jsPDF (offline) die einfache Ersatzfassung */
function demoWasserzeichen(d){ const N=d.getNumberOfPages(); for(let i=1;i<=N;i++){ d.setPage(i); d.setFont("helvetica","bold"); d.setFontSize(70); d.setTextColor(236,238,241); d.text("BEISPIEL",52,200,{angle:35}); } }
async function demoProtBlob(r){
  const k=DB.kunden&&DB.kunden.get(r.kundeId), st=r.standortId&&DB.standorte&&DB.standorte.get(r.standortId), b=r.baustelleId&&DB.baustellen&&DB.baustellen.get(r.baustelleId);
  const datum=String(r.datum||"").split("-").reverse().join("."), adr=x=>x?[x.strasse,[x.plz,x.ort].filter(Boolean).join(" ")].filter(Boolean).join(", "):"";
  let lib; try{ lib=await pdfLib(); }catch(e){ return demoProtBlobEinfach(r); }
  const d=new lib.jsPDF({unit:"mm",format:"a4"});
  if(r.app==="baustelle"){ const bn=(b&&b.name)||String(r.titel||"").split(" · ").pop();
    const S=pdfStil(d,{wasser:"BEISPIEL",titel:"Aufnahmeprotokoll",unter:[k&&k.name,bn].filter(Boolean).join(" | "),fuss:`Aufnahme vom ${datum}${r.auftragsnr?` | Auftrag ${r.auftragsnr}`:""}`});
    S.kopf(); S.abschnitt("Auftragsdaten");
    S.werte([["Kunde",k&&k.name],["Auftragsnr.",r.auftragsnr],["Adresse",adr(k)],["Kundennr.",k&&k.kdnr],["Baustelle",bn],["Ansprechpartner",k&&k.ansprech],["Datum",datum],["Aufgenommen von",r.von&&r.von.name]]);
    S.abschnitt("Bestand und Wünsche");
    S.tabelle(["Bereich","Befund","Wunsch / Hinweis"],[42,58,82],[["Hausanschluss","TN-C-S, 63 A","-"],["Zählerschrank","Platz für 1 Zählerfeld","neuer Zählerschrank nach TAB"],["Unterverteilung OG","nicht vorhanden","UV 3-reihig mit FI/LS"],["Außenbereich","1 Steckdose","Außensteckdose Terrasse"],["Netzwerk","keins","Cat 7 in jedes Zimmer, Patchfeld im HAR"]]);
    S.abschnitt("Vereinbarungen"); S.text("Baustrom über Zählerschrank Bestand. Leerrohre werden vom Bauherrn bauseits gestellt. Nächster Termin nach Rohbauabnahme.");
    S.abschnitt("Unterschriften"); S.y+=2; S.unterschriften([["Aufgenommen",r.von&&r.von.name,datum],["Kunde",k&&k.ansprech||k&&k.name,datum]]);
    return S.ende(); }
  const bad=r.ergebnis==="bad", art=r.art||"Prüfung";
  const S=pdfStil(d,{wasser:"BEISPIEL",titel:"Prüfprotokoll Ladeeinrichtungen",unter:`${art} | DIN VDE 0100-600 | DIN VDE 0105-100`,ehw:true,fuss:[k&&k.name,st&&st.name,`Prüfdatum ${datum}`].filter(Boolean).join(" | ")});
  S.kopf(); S.abschnitt("Auftragsdaten");
  S.werte([["Auftraggeber",[k&&k.name,adr(k)].filter(Boolean).join(", ")],["Auftragsnr.",r.auftragsnr||"-"],["Kundennr.",k&&k.kdnr],["Ansprechpartner",k&&k.ansprech],["Standort",st?[st.name,adr(st)].filter(Boolean).join(", "):"wie Auftraggeber"],["Ladepark","-"],
    ["Prüfdatum",datum],["Prüfer",r.pruefer||(r.von&&r.von.name)],["Messgerät","Wiha MFT one"],["Prüfadapter","Fluke FEV300"],["Art der Prüfung",art],["Netzform","TN-S | 230/400 V"]]);
  S.abschnitt("Prüfumfang"); S.text("Prüfung der Ladeeinrichtungen einschließlich Zuleitung ab Verteiler: Besichtigen, Erproben und Messen nach DIN VDE 0100-600 bzw. DIN VDE 0105-100 sowie Funktionsprüfung mit Prüfadapter.");
  S.abschnitt("Übersicht Ladestationen");
  S.tabelle(["Ladestation","Hersteller / Typ","Seriennummer","Ladepunkte","Ergebnis"],[40,58,40,24,20],[["Wallbox 1","Mennekes AMTRON 4Business","1347122205BK","1","ok"],["Wallbox 2","Mennekes AMTRON 4Business","1347122219BK","1",bad?"bad":"ok"]],4);
  S.abschnitt("Messwerte");
  S.tabelle(["Ladepunkt","R iso","R PE","Z s","RCD t / I","DC 6 mA","Ergebnis"],[26,24,22,22,30,24,34],[["Wallbox 1",">500 MOhm","0,21 Ohm","0,38 Ohm","24 ms | 21 mA","ok","ok"],["Wallbox 2",">500 MOhm",bad?"1,84 Ohm":"0,24 Ohm","0,41 Ohm","26 ms | 22 mA","ok",bad?"bad":"ok"]],6);
  S.abschnitt("Gesamtergebnis"); d.setFont("helvetica","bold"); d.setFontSize(10); d.setTextColor(20);
  d.text(pdfT(bad?"Mängel festgestellt - Beseitigung erforderlich.":"Keine Mängel festgestellt. Die Ladeeinrichtungen entsprechen den Anforderungen."),S.M,S.y); S.plakette(S.M+S.CW-1,S.y,bad?"bad":"ok"); S.y+=9;
  S.abschnitt("Festgestellte Mängel / Maßnahmen"); S.text(bad?"Wallbox 2: Schutzleiterwiderstand 1,84 Ohm zu hoch. PE-Anschluss in der Wallbox nachziehen, danach erneut messen.":"Keine.");
  S.abschnitt("Nächste Prüfung"); S.text("Empfohlen in 1 Jahr. Die Frist legt der Betreiber fest.");
  S.abschnitt("Unterschriften"); S.y+=2; S.unterschriften([["Prüfer",r.pruefer||(r.von&&r.von.name),datum],["Auftraggeber",k&&k.ansprech,datum]]);
  return S.ende(String(r.id).slice(-6).toUpperCase()); }
function demoProtBlobEinfach(r){
  const k=DB.kunden&&DB.kunden.get(r.kundeId), st=r.standortId&&DB.standorte&&DB.standorte.get(r.standortId), b=r.baustelleId&&DB.baustellen&&DB.baustellen.get(r.baustelleId);
  const datum=String(r.datum||"").split("-").reverse().join(".");
  if(r.app==="baustelle") return demoPdfVorlage("Aufnahmeprotokoll",(b&&b.name)||String(r.titel||"").split(" · ").pop(),
    [["Kunde",k&&k.name],["Auftrag",r.auftragsnr],["Adresse",k&&[k.strasse,[k.plz,k.ort].filter(Boolean).join(" ")].filter(Boolean).join(", ")],["Datum",datum],["Aufgenommen von",r.von&&r.von.name],["Ansprechpartner",k&&k.ansprech]],
    {t:"Bestand und Wünsche",kopf:["Bereich","Befund","Wunsch / Hinweis"],sp:[120,180,220],zeilen:[["Hausanschluss","TN-C-S, 63 A","–"],["Zählerschrank","Platz für 1 Zählerfeld","neuer Zählerschrank nach TAB"],["Unterverteilung OG","nicht vorhanden","UV 3-reihig mit FI/LS"],["Außenbereich","1 Steckdose","Außensteckdose Terrasse"],["Netzwerk","keins","Cat 7 in jedes Zimmer"]]},
    [["Unterschrift Kunde: liegt vor",{gr:10}]]);
  const bad=r.ergebnis==="bad", art=r.art||"Prüfung";
  return demoPdfVorlage("Prüfprotokoll Ladeeinrichtung",`${art} nach DIN VDE 0100-600 / 0105-100`,
    [["Kunde",k&&k.name],["Standort",(st&&st.name)||"–"],["Datum",datum],["Prüfer",r.pruefer||(r.von&&r.von.name)],["Prüfgeräte","Wiha MFT one, Fluke FEV300"],["Ergebnis",bad?"nicht bestanden":"bestanden"]],
    {t:"Messwerte",kopf:["Ladepunkt","R iso","R PE","Z s","RCD","Ergebnis"],sp:[90,80,70,70,110,100],zeilen:[["LP 1 · 22 kW",">500 MOhm","0,21 Ohm","0,38 Ohm","24 ms · DC ok","bestanden"],["LP 2 · 22 kW",">500 MOhm",bad?"1,84 Ohm":"0,24 Ohm","0,41 Ohm","26 ms · DC ok",bad?"nicht bestanden":"bestanden"]]},
    bad?[["Mangel: Schutzleiterwiderstand LP 2 zu hoch – Anschluss PE am Ladepunkt nachziehen, danach erneut messen.",{fett:1,farbe:[.75,.1,.1],abstand:28}]]:[["Die Ladeeinrichtung entspricht den anerkannten Regeln der Technik.",{abstand:28}]]); }
async function demoBild(art){
  const c=document.createElement("canvas"); c.width=800; c.height=600; const x=c.getContext("2d");
  const g=x.createLinearGradient(0,0,0,600); g.addColorStop(0,"#D9D6CF"); g.addColorStop(1,"#B9B4AA"); x.fillStyle=g; x.fillRect(0,0,800,600);
  if(art==="leuchte"){ x.fillStyle="#EDEBE6"; x.fillRect(250,180,300,120); x.fillStyle="#2E7D32"; x.fillRect(300,205,200,70); x.fillStyle="#fff"; x.font="bold 40px sans-serif"; x.fillText("NOTAUSGANG",300,252); x.fillStyle="rgba(0,0,0,.25)"; x.fillRect(250,300,300,10); }
  else { x.fillStyle="#E9E7E2"; x.fillRect(180,60,440,480); x.fillStyle="#9C9890"; x.fillRect(180,60,440,10);
    for(let rw=0;rw<(art==="zaehler"?2:4);rw++){ const y=110+rw*(art==="zaehler"?200:105); x.fillStyle="#C7C3BB"; x.fillRect(210,y,380,art==="zaehler"?160:80);
      if(art==="zaehler"&&rw===0){ x.fillStyle="#2B2B2E"; x.fillRect(320,y+20,160,120); x.fillStyle="#7BD88F"; x.fillRect(340,y+40,120,30); }
      else for(let i=0;i<(art==="zaehler"?12:12);i++){ x.fillStyle=i%4===0?"#3A6FB0":"#F4F2EE"; x.fillRect(222+i*30,y+12,24,art==="zaehler"?130:56); x.fillStyle="#2B2B2E"; x.fillRect(230+i*30,y+28,8,14); } } }
  x.fillStyle="rgba(200,16,46,.85)"; x.fillRect(0,540,800,60); x.fillStyle="#fff"; x.font="bold 26px sans-serif"; x.fillText("Beispielfoto (Demo)",24,580);
  return await new Promise(ok=>c.toBlob(b=>ok(b),"image/jpeg",.82)); }
async function demoDateiBlob(d){ if(!d||!d.demo) return null; const a=d.demoArt;
  if(a==="angebot"||a==="schaltplan"){ try{ const lib=await pdfLib(), doc=new lib.jsPDF({unit:"mm",format:"a4"}), heute=new Date().toLocaleDateString("de-DE");
    if(a==="angebot"){ const S=pdfStil(doc,{wasser:"BEISPIEL",titel:"Angebot",unter:"Autohaus Bergland GmbH | Zwei weitere Wallboxen an der Ausstellung",fuss:"Angebot A-24130"}); S.kopf(); S.abschnitt("Angebotsdaten");
      S.werte([["Kunde","Autohaus Bergland GmbH"],["Angebot","A-24130"],["Datum",heute],["Gültig","30 Tage"],["Ansprechpartner","Thomas Berg"],["Bearbeiter","Büro"]]); S.abschnitt("Positionen");
      S.tabelle(["Pos.","Leistung","Menge","Preis netto"],[14,110,26,32],[["1","Wallbox Mennekes AMTRON 4Business 22 kW","2 Stück","3.980,00 EUR"],["2","NYY-J 5x16 mm², verlegt inkl. Befestigung","45 m","1.215,00 EUR"],["3","FI/LS Typ B in Unterverteilung","2 Stück","1.140,00 EUR"],["4","Erstprüfung mit Prüfprotokoll","1","290,00 EUR"]]);
      S.abschnitt("Summe"); S.text("Summe netto 6.625,00 EUR | zzgl. 19 % MwSt. 1.258,75 EUR | Gesamt 7.883,75 EUR"); return S.ende(); }
    const S=pdfStil(doc,{wasser:"BEISPIEL",titel:"Übersichtsschaltplan",unter:"Wohnbau Waldbröl eG | Haus B, Kaiserstraße 34",fuss:"Stand "+heute}); S.kopf(); S.abschnitt("Unterverteilung Haus B");
    S.tabelle(["Nr.","Schutzorgan","RCD","Stromkreis","Leitung"],[16,34,34,60,38],[["F1","B16","30 mA Typ A","Treppenhaus Licht","NYM-J 3x1,5"],["F2","B16","30 mA Typ A","Keller Steckdosen","NYM-J 3x2,5"],["F3","B16","-","Außenbeleuchtung","NYM-J 3x1,5"],["F4","B10","-","Klingelanlage","NYM-J 3x1,5"]]);
    return S.ende(); }catch(e){} }
  if(a==="angebot") return demoPdfVorlage("Angebot A-24130","Zwei weitere Wallboxen an der Ausstellung",[["Kunde","Autohaus Bergland GmbH"],["Datum",new Date().toLocaleDateString("de-DE")],["Gültig bis","30 Tage"],["Ansprechpartner","Thomas Berg"]],
    {t:"Positionen",kopf:["Pos.","Leistung","Menge","Preis"],sp:[40,300,70,100],zeilen:[["1","Wallbox Mennekes AMTRON 4Business 22 kW","2 Stück","3.980,00 €"],["2","NYY-J 5×16 mm², verlegt","45 m","1.215,00 €"],["3","LS/RCD Typ B in UV","2 Stück","1.140,00 €"],["4","Erstprüfung mit Protokoll","1","290,00 €"]]},
    [["Summe netto: 6.625,00 €",{fett:1,gr:12,abstand:28}]]);
  if(a==="schaltplan") return demoPdfVorlage("Übersichtsschaltplan Haus B","Kaiserstraße 34, Waldbröl",[["Kunde","Wohnbau Waldbröl eG"],["Stand",new Date().toLocaleDateString("de-DE")]],
    {t:"Stromkreise UV Haus B",kopf:["Nr.","Schutz","Stromkreis"],sp:[50,140,300],zeilen:[["F1","B16 / RCD 30 mA","Treppenhaus Licht"],["F2","B16 / RCD 30 mA","Keller Steckdosen"],["F3","B16","Außenbeleuchtung"],["F4","B10","Klingelanlage"]]});
  return await demoBild(a); }
