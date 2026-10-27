/* ===== Beispieldaten für den Präsentationsmodus =====
   Startet der Präsentationsmodus, wird die Demo eingeschaltet (nur auf diesem Gerät). Dann erscheinen Beispielkunden, Aufträge, Baustellen, Übergaben,
   Materialanforderungen und Prüfungen in allen Apps – nur im Speicher dieses Geräts, mit demo:true markiert.
   Sie werden NIE nach SharePoint hochgeladen (der Abgleich überspringt demo-Datensätze). Beim Beenden der Präsentation wird alles
   wieder entfernt, auch was man an Beispieldaten geändert hat. Der Schalter gilt für alle Apps dieses Browsers.
   Bis 27.10.2026 gab es zusätzlich eine eigene „Demo-Vorschau“ (im Profil gespeichert, auf allen Geräten) – die ist weg. */
const DEMO_KEY="irrgang_demo";
/* Schalter gilt systemweit: er steht im eigenen Profil (wird abgeglichen) – so ist die Demo in allen Apps und auf allen eigenen Geräten an.
   Ohne Profil (nicht angemeldet) gilt der Schalter dieses Browsers. */
const demoProfil=()=>{ try{ return typeof profilVon==="function"&&typeof ME!=="undefined"&&ME.mail?profilVon(ME.mail):null; }catch(e){ return null; } };
const demoAn=()=>{ try{ return localStorage.getItem(DEMO_KEY)==="1"; }catch(e){ return false; } };
const DEMO_SPEICHER=[["evse_daten",["kunden","standorte","ladeparks","pruefungen","katalog"]],["baustelle_daten",["baustellen","eintraege","notizen","anforderungen"]],["irrgang_apps",["vorgaenge","geraete","dateien","protokolle","gebaeude","anlagen","termine"]],["echeck_daten",["gebaeude","echecks","betriebsmittel"]]];
const DEMO_FOTOS={"demo-f-zp":"zp","demo-f-hak":"hak","demo-f-uvalt":"uvalt","demo-f-mangel":"mangel","demo-f-ue-baustrom":"baustrom","demo-f-ue-leerrohr":"leerrohr","demo-f-ue-uv":"uv","demo-f-ue-pa":"pa"};
function demoDaten(){
  const T=864e5, jetzt=Date.now(), vor=(t,h=0)=>jetzt-t*T-h*36e5, tag=t=>new Date(jetzt+t*T).toISOString().slice(0,10);
  const P={ab:{name:"A. Brandl",mail:"a.brandl@elektro-irrgang.de"},ms:{name:"M. Seipp",mail:"m.seipp@elektro-irrgang.de"},mp:{name:"M. Pevec",mail:"m.pevec@elektro-irrgang.de"},ai:{name:"A. Irrgang",mail:"a.irrgang@elektro-irrgang.de"},bu:{name:"Büro",mail:"alex@elektro-irrgang.de"}};
  const r=(o,wer,t)=>Object.assign({demo:true,created:t,updated:t,createdBy:wer,updatedBy:wer},o);
  const kunden=[
    r({id:"demo-k1",art:"gewerbe",name:"Löwen-Apotheke",kdnr:"D-1001",strasse:"Hauptstraße 12",plz:"51597",ort:"Morsbach",tel:"02294 900100",mail:"info@loewen-apotheke.example",
      kontakte:[{id:"demo-c1",name:"Dr. Sabine Kraft",rolle:"Inhaber",tel:"0171 0000001"},{id:"demo-c2",name:"Herr Weber",rolle:"Hausmeister",tel:"0171 0000002"}],ansprech:"Dr. Sabine Kraft"},P.bu,vor(40)),
    r({id:"demo-k2",art:"gewerbe",name:"Autohaus Bergland GmbH",kdnr:"D-1002",strasse:"Industriestraße 4",plz:"51545",ort:"Waldbröl",tel:"02291 900200",mail:"service@bergland.example",
      kontakte:[{id:"demo-c3",name:"Thomas Berg",rolle:"Geschäftsführung",mail:"t.berg@bergland.example"},{id:"demo-c4",name:"Pförtnerhaus",rolle:"Pförtner",tel:"02291 900209"}],ansprech:"Thomas Berg"},P.bu,vor(60)),
    r({id:"demo-k3",art:"gewerbe",name:"Schreinerei Kraus",kdnr:"D-1003",strasse:"Am Sägewerk 2",plz:"51674",ort:"Wiehl",tel:"02262 900300",kontakte:[{id:"demo-c5",name:"Peter Kraus",rolle:"Inhaber",tel:"0171 0000005"}],ansprech:"Peter Kraus"},P.ab,vor(25)),
    r({id:"demo-k4",art:"privat",anrede:"",vorname:"Familie",nachname:"Hoffmann",name:"Familie Hoffmann",strasse:"Lindenweg 7",plz:"51545",ort:"Waldbröl",tel:"0171 0000007"},P.mp,vor(12)),
    r({id:"demo-k5",art:"gewerbe",name:"Wohnbau Waldbröl eG",kdnr:"D-1005",strasse:"Kaiserstraße 30",plz:"51545",ort:"Waldbröl",mail:"technik@wohnbau.example",kontakte:[{id:"demo-c6",name:"Frau Lenz",rolle:"Ansprechpartner",tel:"02291 900500"}],ansprech:"Frau Lenz"},P.bu,vor(90))];
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
    r({id:"demo-v6",kundeId:"demo-k4",anliegen:"Außensteckdose Terrasse setzen",s:{anruf:{wer:P.bu,at:vor(9)},anfrage:{wer:P.bu,at:vor(9)},auftrag:{wer:P.bu,at:vor(7),nr:"A-24127"},termin:{wer:P.bu,at:vor(5),datum:tag(2),zeit:"7:30",bis:"10:00",mit:"A. Brandl, M. Pevec"}},zust:{mail:P.ab.mail,name:P.ab.name,at:vor(5),von:P.bu},notizen:[{id:"demo-n1",wer:P.bu,at:vor(5),text:"Schlüssel liegt beim Nachbarn (Nr. 9)."}]},P.bu,vor(9)),
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
    pr("demo-p4","demo-k3","demo-s6","Erstprüfung",tag(0),"",false,P.ab,vor(0,1)),
    pr("demo-p6","demo-k6","","Erstprüfung",tag(-20),tag(1440),true,P.mp,vor(20)),
    pr("demo-p7","demo-k7","demo-s7","Wiederholungsprüfung",tag(-370),tag(-5),true,P.ms,vor(370))];
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
  const H=demoHaus(r,P,vor,tag); kunden.push(H.kunde);
  /* Industriekunde: zwei Werke, Bauteile/Ebenen, Verteiler mit Einspeisung, Maschinen, Rahmenauftrag mit Meldungen */
  kunden.push(r({id:"demo-k7",art:"industrie",name:"Kunststoffwerk Nordhang GmbH",kdnr:"D-1007",strasse:"Am Werk 1",plz:"51545",ort:"Waldbröl",tel:"02291 900700",mail:"technik@nordhang.example",
    kontakte:[{id:"demo-c7",name:"Herr Albers",rolle:"Haustechnik",tel:"0171 0000071"},{id:"demo-c8",name:"Frau Yilmaz",rolle:"Einkauf",mail:"einkauf@nordhang.example"}],ansprech:"Herr Albers",
    melder:[{id:"demo-ml1",name:"Herr Becker",firma:"FM-Dienstleister Gebäudeservice",tel:"0171 0000072"},{id:"demo-ml2",name:"Schichtleitung",firma:"Produktion"}]},P.bu,vor(200)));
  standorte.push(r({id:"demo-s7",kundeId:"demo-k7",name:"Werk Rommelsdorf",strasse:"Am Werk 1",plz:"51545",ort:"Waldbröl"},P.bu,vor(200)),
    r({id:"demo-s8",kundeId:"demo-k7",name:"Lager Elsenroth",strasse:"Lagerweg 3",plz:"51647",ort:"Gummersbach"},P.bu,vor(200)));
  const geb7=r({id:"g-demo-s7",ortId:"demo-s7",bauteile:[{id:"demo-bt-a",name:"A",kurz:"A"},{id:"demo-bt-h",name:"H",kurz:"H"}],
    etagen:[{id:"demo-et-0",name:"EG",kurz:"0",raeume:[]},{id:"demo-et-1",name:"Level 1",kurz:"1",raeume:[]}],
    verteiler:[{id:"demo-v-hv",name:"HV",bauteilId:"demo-bt-a",etageId:"demo-et-0",vonVId:"",vonAbgang:""},{id:"demo-v-uv",name:"UV-H1-03",bauteilId:"demo-bt-h",etageId:"demo-et-1",vonVId:"demo-v-hv",vonAbgang:"Q12"},{id:"demo-v-sk",name:"Steuerschrank SGM 4711",bauteilId:"demo-bt-h",etageId:"demo-et-1",vonVId:"demo-v-uv",vonAbgang:"Q3"}],
    rcds:[],stromkreise:[],stellen:[],schraenke:[],dosen:[]},P.mp,vor(30));
  const geb8=r({id:"g-demo-s8",ortId:"demo-s8",bauteile:[],etagen:[{id:"demo-et-l",name:"Lagerhalle",kurz:"",raeume:[]}],verteiler:[{id:"demo-v-l",name:"UV Lager",etageId:"demo-et-l",vonVId:"",vonAbgang:""}],rcds:[],stromkreise:[],stellen:[],schraenke:[],dosen:[]},P.mp,vor(30));
  const anlagen=[
    r({id:"demo-an1",ortId:"demo-s7",kundeId:"demo-k7",nr:"M-17.1",bez:"Spritzgießmaschine",hersteller:"Arburg",typ:"Allrounder 570",baujahr:"2018",leistung:"45",spannung:"400",bauteilId:"demo-bt-h",etageId:"demo-et-1",raum:"Halle 3",
      vId:"demo-v-uv",abgang:"Q3",absicherung:"C63",zuleitung:"NYY-J 5×16 mm²",schrankVId:"demo-v-sk",fristM:12,pruefungen:[{id:"demo-p1",datum:tag(-300),erg:"ok",notiz:"nach DIN VDE 0113-1",wer:P.mp}],
      aenderungen:[{id:"demo-a1",at:vor(40),datum:tag(-40),was:"Not-Aus-Kreis um Schutztür erweitert",warum:"Umbau durch Hersteller",wer:P.mp}]},P.mp,vor(60)),
    r({id:"demo-an2",ortId:"demo-s7",kundeId:"demo-k7",nr:"M-17.2",bez:"Granulattrockner",hersteller:"Motan",bauteilId:"demo-bt-h",etageId:"demo-et-1",raum:"Halle 3",vId:"demo-v-uv",abgang:"Q4",absicherung:"C16",zuleitung:"NYY-J 5×2,5 mm²",fristM:12,pruefungen:[],aenderungen:[]},P.mp,vor(60)),
    r({id:"demo-an4",ortId:"demo-s7",kundeId:"demo-k7",nr:"K-1",bez:"Druckluftkompressor",hersteller:"Kaeser",typ:"ASD 40",baujahr:"2015",leistung:"22",spannung:"400",bauteilId:"demo-bt-a",etageId:"demo-et-0",raum:"Kompressorraum",vId:"demo-v-hv",abgang:"Q7",absicherung:"C50",zuleitung:"NYY-J 5×10 mm²",fristM:12,
      pruefungen:[{id:"demo-p4",datum:tag(-380),erg:"maengel",notiz:"Schutzleiterverbindung Motor nachgezogen",wer:P.ms}],aenderungen:[]},P.ms,vor(80)),
    r({id:"demo-an5",ortId:"demo-s7",kundeId:"demo-k7",nr:"KR-10",bez:"Hallenkran 10 t",hersteller:"Demag",baujahr:"2012",spannung:"400",bauteilId:"demo-bt-h",etageId:"demo-et-1",raum:"Halle 3",vId:"demo-v-uv",abgang:"Q1",absicherung:"C32",zuleitung:"Schleifleitung",fristM:12,
      pruefungen:[{id:"demo-p5",datum:tag(-330),erg:"ok",notiz:"UVV-Prüfung zusammen mit Kranservice",wer:P.mp}],aenderungen:[{id:"demo-a5",at:vor(150),datum:tag(-150),was:"Funkfernsteuerung nachgerüstet",warum:"Kundenwunsch",wer:P.ai}]},P.mp,vor(80)),
    r({id:"demo-an6",ortId:"demo-s8",kundeId:"demo-k7",nr:"RBG-1",bez:"Regalbediengerät",hersteller:"Jungheinrich",etageId:"demo-et-l",vId:"demo-v-l",abgang:"Q4",absicherung:"C25",fristM:12,pruefungen:[],aenderungen:[]},P.ms,vor(60)),
    r({id:"demo-an3",ortId:"demo-s8",kundeId:"demo-k7",nr:"M-17.1",bez:"Hubtor Lager",hersteller:"Hörmann",etageId:"demo-et-l",vId:"demo-v-l",abgang:"Q2",absicherung:"C10",fristM:12,pruefungen:[{id:"demo-p2",datum:tag(-400),erg:"ok",wer:P.ms}],aenderungen:[]},P.ms,vor(60))];
  const rid="demo-v-rahmen";
  vorgaenge.push(r({id:rid,kundeId:"demo-k7",anliegen:"Elektro-Kleinaufträge 2026",rahmen:true,s:{anruf:{wer:P.bu,at:vor(300)},anfrage:{wer:P.bu,at:vor(300)},auftrag:{wer:P.bu,at:vor(299),nr:"26-0042"}}},P.bu,vor(300)),
    r({id:"demo-m1",typ:"meldung",rahmenId:rid,kundeId:"demo-k7",standortId:"demo-s7",bauteil:"C",ebene:"EG",raum:"Flur",text:"Notbeleuchtung flackert",melderId:"demo-ml1",status:"offen",gemeldet:vor(0,2),dringend:true,zustAlle:[],zust:null},P.bu,vor(0,2)),
    r({id:"demo-m2",typ:"meldung",rahmenId:rid,kundeId:"demo-k7",standortId:"demo-s7",bauteil:"H",ebene:"Level 1",raum:"Halle 3",anlageId:"demo-an1",text:"Maschine löst Sicherung aus",melderId:"demo-ml2",status:"offen",gemeldet:vor(1),
      zustAlle:[Object.assign({at:vor(1),von:P.bu},P.mp)],zust:Object.assign({at:vor(1),von:P.bu},P.mp)},P.bu,vor(1)),
    r({id:"demo-m3",typ:"meldung",rahmenId:rid,kundeId:"demo-k7",standortId:"demo-s7",bauteil:"E",raum:"WC",text:"Licht kontrollieren",melderId:"demo-ml1",status:"spaeter",gemeldet:vor(3),todo:"EVG ausbauen, LED-Ersatzmodul einsetzen",mitbringen:"1 Stück LED-Ersatzmodul 1500 mm",mitLager:true,
      zustAlle:[Object.assign({at:vor(2),von:P.bu},P.ms)],zust:Object.assign({at:vor(2),von:P.bu},P.ms)},P.bu,vor(3)),
    r({id:"demo-m4",typ:"meldung",rahmenId:rid,kundeId:"demo-k7",standortId:"demo-s7",bauteil:"A/B",ebene:"EG",text:"Licht defekt, Bewegungsmelder prüfen",melderId:"demo-ml1",status:"ohne",gemeldet:vor(5),notiz:"Vor Ort alles in Ordnung",zeit:0.25,fertig:{wer:P.mp,at:vor(4)}},P.bu,vor(5)));
  /* Firmentermine (Kalender der Übersicht): für alle sichtbar */
  const jahr=new Date().getFullYear(), d6=`${jahr}-12-06`, mo=(()=>{ const x=new Date(); x.setHours(0,0,0,0); x.setDate(x.getDate()-((x.getDay()+6)%7)); return x; })(), iso=x=>`${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-${String(x.getDate()).padStart(2,"0")}`;
  const termine=[r({id:"demo-ft1",t:"Weihnachtsfeier",von:`${d6}T00:00`,bis:`${jahr}-12-07T00:00`,ganz:true,ort:"Gasthaus zur Post, Waldbröl",notiz:"Ab 18 Uhr, Partner sind eingeladen.",fuer:"alle"},P.bu,vor(20)),
    r({id:"demo-ft2",t:"Teambesprechung",von:`${iso(new Date(mo.getTime()+4*864e5))}T07:00`,bis:`${iso(new Date(mo.getTime()+4*864e5))}T07:45`,ganz:false,ort:"Werkstatt",notiz:"Wochenplanung KW",fuer:"alle"},P.bu,vor(3))];
  return {kunden,standorte,baustellen,eintraege,vorgaenge,anforderungen,pruefungen,protokolle,notizen,dateien,gebaeude:[...H.gebaeude,geb7,geb8],echecks:H.echecks,anlagen:[...H.anlagen,...anlagen],termine};
}
/* Demo-Haus „Am Sonnenhang“: komplettes Gebäude für die E-Check-App – fünf Geschosse plus Garage auf EG-Ebene,
   Hauptverteilung im Keller, drei Unterverteilungen, großer Serverschrank im Technikraum (KG) und ein Mini-Verteiler im 2. OG.
   Dazu eine laufende Installationsprüfung (E-CHECK) und eine laufende Netzwerkprüfung mit ein paar typischen Fehlern. */
function demoHaus(r,P,vor,tag){
  const kunde=r({id:"demo-k6",art:"privat",anrede:"herr",vorname:"Jonas",nachname:"Kessler",name:"Jonas Kessler",kdnr:"D-1006",strasse:"Am Sonnenhang 1",plz:"51545",ort:"Waldbröl",tel:"0171 0000016",mail:"j.kessler@mail.example",
    kontakte:[{id:"demo-c6k",name:"Jonas Kessler",rolle:"Eigentümer",tel:"0171 0000016"},{id:"demo-c6l",name:"Lea Kessler",rolle:"Eigentümerin",tel:"0171 0000017"}],ansprech:"Jonas Kessler",notiz:"Einfamilienhaus Baujahr 2019: KG, EG, OG, Garage. PV 9,8 kWp mit Speicher, Wärmepumpe, Wallbox 11 kW, Glasfaser."},P.bu,vor(30));
  const ET=[["kg","KG",-1,["Hausanschlussraum","Heizungsraum","Technikraum","Werkstatt","Waschküche","Weinkeller","Heimkino","Flur KG"]],
    ["eg","EG",0,["Diele","Gäste-WC","Küche","Speisekammer","Wohnen / Essen","Büro","Wintergarten","Flur EG","Terrasse"]],
    ["ga","Garage",0,["Doppelgarage","Fahrradraum"]],
    ["og1","1. OG",1,["Schlafen","Ankleide","Bad","Kind 1","Kind 2","Bad Kinder","Flur OG","Balkon"]],
    ];
  const R={}; const etagen=ET.map(([id,name,ebene,L])=>({id:"dh-"+id,name,ebene,raeume:L.map((n,i)=>{ const rid=`dh-${id}-${i+1}`; R[`${id}:${n}`]=rid; return {id:rid,name:n}; })}));
  const raum=(e,n)=>{ const x=R[`${e}:${n}`]; if(!x) throw new Error("Demo-Raum fehlt: "+e+" "+n); return x; };
  const da=(e,n)=>!!R[`${e}:${n}`];
  const verteiler=[{id:"dh-hv",name:"Zählerschrank / HV",raumId:raum("kg","Hausanschlussraum")},{id:"dh-uveg",name:"UV EG",raumId:raum("eg","Flur EG")},
    {id:"dh-uvga",name:"UV Garage",raumId:raum("ga","Doppelgarage")},{id:"dh-uvog",name:"UV OG",raumId:raum("og1","Flur OG")}];
  const rcds=[["hv1","dh-hv","1","A",40,30],["hv2","dh-hv","2","F",40,30],["hv3","dh-hv","3","A",16,30,1],["eg1","dh-uveg","1","A",40,30],["eg2","dh-uveg","2","A",40,30],["eg3","dh-uveg","3","F",40,30],
    ["ga1","dh-uvga","1","A",40,30],["ga2","dh-uvga","2","A",40,30],["og1","dh-uvog","1","A",40,30],["og2","dh-uvog","2","A",40,30],["og3","dh-uvog","3","A",40,30]]
    .map(([id,vId,nr,typ,In,idn,fils])=>({id:"dh-r-"+id,vId,nr,typ,in:String(In),idn:String(idn),...(fils?{fils:true}:{})}));
  const L15="NYM-J 3×1,5", L25="NYM-J 3×2,5", L525="NYM-J 5×2,5", L56="NYM-J 5×6";
  /* Stromkreise: [Verteiler, Nr, Bezeichnung, Schutz, RCD, Leitung, Stellen [Etage, Raum, Art, Fach, Lage]] */
  const SK=[
    ["hv","F1","Licht KG","B10","hv1",L15,["Hausanschlussraum","Heizungsraum","Technikraum","Werkstatt","Waschküche","Weinkeller","Heimkino","Flur KG"].map(n=>["kg",n,"licht",1,"Decke"])],
    ["hv","F2","Steckdosen HAR und Technikraum","B16","hv1",L25,[["kg","Hausanschlussraum","sd",2,"Eingang"],["kg","Technikraum","sd",2,"neben Tür"],["kg","Technikraum","sd",2,"Arbeitsfläche"]]],
    ["hv","F3","Serverschrank (eigener Kreis)","B16","hv1",L25,[["kg","Technikraum","sd",3,"Serverschrank"]]],
    ["hv","F4","Werkstatt Steckdosen","B16","hv1",L25,[["kg","Werkstatt","sd",3,"Arbeitsfläche"],["kg","Werkstatt","sd",3,"Arbeitsfläche"],["kg","Werkstatt","sd",1,"neben Tür"]]],
    ["hv","F5","Werkstatt CEE 16 A","C16","hv1",L525,[["kg","Werkstatt","fest",1,"CEE-Dose 16 A"]]],
    ["hv","F6","Waschmaschine","B16","hv2",L25,[["kg","Waschküche","sd",1,"Waschmaschine"]]],
    ["hv","F7","Trockner","B16","hv2",L25,[["kg","Waschküche","sd",1,"Trockner"]]],
    ["hv","F8","Waschküche Steckdosen","B16","hv2",L25,[["kg","Waschküche","sd",2,"Arbeitsfläche"]]],
    ["hv","F9","Heizung / WP-Innengerät","B16","hv2",L25,[["kg","Heizungsraum","fest",1,"Wärmepumpe Innengerät"],["kg","Heizungsraum","sd",1,"neben Tür"]]],
    ["hv","F10","Wärmepumpe Außengerät","C16","",L525,[["kg","Heizungsraum","fest",1,"Außengerät (Durchführung)"]]],
    ["hv","F11","Heimkino","B16","hv1",L25,[["kg","Heimkino","sd",3,"TV"],["kg","Heimkino","sd",2,"Beamer"],["kg","Heimkino","sd",1,"neben Tür"]]],
    ["hv","F12","Weinkeller Klimagerät","B16","hv1",L25,[["kg","Weinkeller","fest",1,"Klimagerät"]]],
    ["hv","F13","Außensteckdosen Terrasse","B16","hv3",L25,[["eg","Terrasse","sd",2,"Außen"],["eg","Terrasse","sd",1,"Außen"]]],
    ["uveg","F1","Licht EG","B10","eg1",L15,["Diele","Gäste-WC","Küche","Speisekammer","Wohnen / Essen","Büro","Wintergarten","Flur EG"].map(n=>["eg",n,"licht",1,"Decke"])],
    ["uveg","F2","Diele, Flur, Gäste-WC","B16","eg1",L25,[["eg","Diele","sd",1,"Eingang"],["eg","Flur EG","sd",2,"neben Tür"],["eg","Gäste-WC","sd",1,"neben Tür"]]],
    ["uveg","F3","Küche Arbeitsfläche links","B16","eg3",L25,[["eg","Küche","sd",2,"Arbeitsfläche"],["eg","Küche","sd",2,"Arbeitsfläche"]]],
    ["uveg","F4","Küche Arbeitsfläche rechts","B16","eg3",L25,[["eg","Küche","sd",3,"Arbeitsfläche"]]],
    ["uveg","F5","Herd","B16","eg3",L525,[["eg","Küche","herd",1,""]]],
    ["uveg","F6","Geschirrspüler","B16","eg3",L25,[["eg","Küche","sd",1,"Geschirrspüler"]]],
    ["uveg","F7","Kühl-/Gefrierkombi","B16","eg2",L25,[["eg","Küche","sd",1,"Kühlschrank"],["eg","Speisekammer","sd",1,"Gefriertruhe"]]],
    ["uveg","F8","Backofen / Dampfgarer","B16","eg3",L25,[["eg","Küche","fest",1,"Backofen"]]],
    ["uveg","F9","Wohnen Steckdosen","B16","eg2",L25,[["eg","Wohnen / Essen","sd",3,"TV"],["eg","Wohnen / Essen","sd",2,"neben Fenster"],["eg","Wohnen / Essen","sd",1,"neben Tür"]]],
    ["uveg","F10","Essen Steckdosen","B16","eg2",L25,[["eg","Wohnen / Essen","sd",2,"neben Fenster"],["eg","Wohnen / Essen","sd",2,"Arbeitsfläche"]]],
    ["uveg","F11","Büro","B16","eg1",L25,[["eg","Büro","sd",3,"Schreibtisch"],["eg","Büro","sd",3,"Schreibtisch"],["eg","Büro","sd",1,"neben Tür"]]],
    ["uveg","F12","Wintergarten","B16","eg1",L25,[["eg","Wintergarten","sd",2,"neben Fenster"],["eg","Wintergarten","sd",2,"neben Fenster"]]],
    ["uveg","F13","Rollläden EG","B10","eg2",L15,[["eg","Wohnen / Essen","fest",1,"Rollladenmotoren"]]],
    ["uvga","F1","Wallbox 11 kW","B16","ga1",L56,[["ga","Doppelgarage","fest",1,"Wallbox"]]],
    ["uvga","F2","Licht Garage","B10","ga2",L15,[["ga","Doppelgarage","licht",1,"Decke"],["ga","Fahrradraum","licht",1,"Decke"]]],
    ["uvga","F3","Steckdosen Garage","B16","ga2",L25,[["ga","Doppelgarage","sd",2,"Arbeitsfläche"],["ga","Doppelgarage","sd",2,"neben Tür"],["ga","Fahrradraum","sd",2,"E-Bike laden"]]],
    ["uvga","F4","Garagentor","B16","ga2",L25,[["ga","Doppelgarage","fest",1,"Torantrieb"]]],
    ["uvog","F1","Licht 1. OG","B10","og1",L15,["Schlafen","Ankleide","Bad","Kind 1","Kind 2","Bad Kinder","Flur OG"].map(n=>["og1",n,"licht",1,"Decke"])],
    ["uvog","F2","Schlafen","B16","og1",L25,[["og1","Schlafen","sd",2,"Bett"],["og1","Schlafen","sd",2,"Bett"],["og1","Schlafen","sd",2,"TV"]]],
    ["uvog","F3","Ankleide, Flur OG, Balkon","B16","og1",L25,[["og1","Ankleide","sd",1,"neben Tür"],["og1","Flur OG","sd",1,"neben Tür"],["og1","Balkon","sd",2,"Außen"]]],
    ["uvog","F4","Bad","B16","og2",L25,[["og1","Bad","sd",2,"Waschtisch"],["og1","Bad","fest",1,"Handtuchheizkörper"]]],
    ["uvog","F5","Kind 1","B16","og2",L25,[["og1","Kind 1","sd",3,"Schreibtisch"],["og1","Kind 1","sd",2,"Bett"],["og1","Kind 1","sd",1,"neben Tür"]]],
    ["uvog","F6","Kind 2","B16","og2",L25,[["og1","Kind 2","sd",3,"Schreibtisch"],["og1","Kind 2","sd",2,"Bett"],["og1","Kind 2","sd",1,"neben Tür"]]],
    ["uvog","F7","Bad Kinder","B16","og2",L25,[["og1","Bad Kinder","sd",2,"Waschtisch"]]],
    ["uvog","F8","Licht 2. OG und DG","B10","og3",L15,[...["Gästezimmer","Arbeitszimmer","Musikzimmer","Duschbad","Flur 2. OG","Abstellraum (Netzwerk)"].map(n=>["og2",n,"licht",1,"Decke"]),...["Galerie","Abstellraum DG"].map(n=>["dg",n,"licht",1,"Decke"])]],
    ["uvog","F9","Gäste- und Musikzimmer","B16","og3",L25,[["og2","Gästezimmer","sd",2,"Bett"],["og2","Gästezimmer","sd",2,"TV"],["og2","Musikzimmer","sd",3,"neben Fenster"],["og2","Musikzimmer","sd",2,"neben Tür"]]],
    ["uvog","F10","Arbeitszimmer 2. OG","B16","og3",L25,[["og2","Arbeitszimmer","sd",3,"Schreibtisch"],["og2","Arbeitszimmer","sd",3,"Schreibtisch"],["og2","Arbeitszimmer","sd",1,"neben Tür"]]],
    ["uvog","F11","Duschbad 2. OG","B16","og3",L25,[["og2","Duschbad","sd",2,"Waschtisch"]]],
    ["uvog","F12","Durchlauferhitzer 2. OG","B32","",L56,[["og2","Duschbad","fest",1,"Durchlauferhitzer 21 kW"]]],
    ["uvog","F13","Netzwerk-Verteiler 2. OG","B16","og3",L25,[["og2","Abstellraum (Netzwerk)","sd",2,"Netzwerkschrank"]]],
    ["uvog","F14","DG Galerie","B16","og3",L25,[["dg","Galerie","sd",3,"TV"],["dg","Galerie","sd",2,"neben Fenster"],["dg","Abstellraum DG","sd",1,"neben Tür"],["dg","Dachterrasse","sd",2,"Außen"]]],
    ["uvog","F15","Rollläden OG","B10","og1",L15,[["og1","Schlafen","fest",1,"Rollladenmotoren"]]]];
  const stromkreise=[], stellen=[], ord={}; let si=0;
  SK.map(x=>{ const y=x.slice(); y[6]=x[6].filter(st=>da(st[0],st[1])); return y; }).filter(x=>x[6].length).forEach(([v,nr,bez,schutz,rcd,leitung,St],k)=>{ const id=`dh-sk-${v}-${nr}`; stromkreise.push({id,vId:"dh-"+v,nr,bez,schutz,rcdId:rcd?"dh-r-"+rcd:"",leitung});
    St.forEach(([e,n,art,fach,lage])=>{ const raumId=raum(e,n); ord[raumId]=(ord[raumId]||0)+1; stellen.push({id:`dh-st-${++si}`,raumId,ord:ord[raumId],art,fach,lage,skId:id}); }); });
  /* Netzwerk: Serverschrank KG (Patchfeld 1–3), Mini-Verteiler 2. OG (Patchfeld 4) */
  const schraenke=[
    {id:"dh-s1",nr:1,name:"Serverschrank",raumId:raum("kg","Technikraum"),he:42,bauart:"stand",breite:800,tiefe:1000,farbe:"auto",teile:[
      {id:"t1",typ:"luefter",pos:1,he:1,name:"Lüftereinschub"},{id:"t2",typ:"patch",pos:2,he:1,ports:24,nr:1,kat:"metz-130921"},{id:"t3",typ:"kabel",pos:3,he:1},{id:"t4",typ:"patch",pos:4,he:1,ports:24,nr:2,kat:"metz-130921"},{id:"t5",typ:"kabel",pos:5,he:1},
      {id:"t6",typ:"patch",pos:6,he:1,ports:24,nr:3,kat:"metz-130921"},{id:"t7",typ:"kabel",pos:7,he:1},{id:"t8",typ:"switch",pos:8,he:1,ports:48,poe:true,name:"USW-Pro-48-PoE",tiefe:400,kat:"uni-pro48poe"},{id:"t9",typ:"kabel",pos:9,he:1},
      {id:"t10",typ:"switch",pos:10,he:1,ports:8,name:"USW-Aggregation",tiefe:200,kat:"uni-agg"},{id:"t11",typ:"router",pos:12,he:1,name:"UDM-Pro",tiefe:286,kat:"udm-pro"},
      {id:"t12",typ:"boden",pos:13,he:2,name:"FRITZ!Box 5590 Fiber",kat:"fritz-5590"},{id:"t13",typ:"nas",pos:16,he:2,name:"RS1221+",tiefe:560,kat:"syno-rs1221"},
      {id:"t14",typ:"sonst",pos:19,he:2,name:"Home-Server (Proxmox, Home Assistant)",tiefe:650},{id:"t15",typ:"boden",pos:22,he:2,name:"KNX-IP-Router und Smart-Home-Gateways"},
      {id:"t16",typ:"pdu",pos:38,he:1,name:"Steckdosenleiste 8-fach, schaltbar"},{id:"t17",typ:"usv",pos:40,he:2,name:"APC Smart-UPS 1500 RM",tiefe:480}]},
    {id:"dh-s2",nr:2,name:"Mini-Verteiler",raumId:raum("og1","Flur OG"),he:9,bauart:"wand",breite:600,tiefe:450,farbe:"auto",teile:[
      {id:"m1",typ:"patch",pos:1,he:1,ports:24,nr:1,kat:"metz-130921"},{id:"m2",typ:"kabel",pos:2,he:1},{id:"m3",typ:"switch",pos:3,he:1,ports:24,poe:true,name:"USW-24-PoE",tiefe:220,kat:"uni-24poe"},
      {id:"m4",typ:"boden",pos:5,he:2,name:"Uplink: Glasfaser vom Serverschrank"},{id:"m5",typ:"pdu",pos:9,he:1,name:"Steckdosenleiste 6-fach"}]}];
  /* Datendosen: [Etage, Raum, Ports, Lage, Patchfeld] – Ports im Patchfeld werden der Reihe nach vergeben; 4 = Patchfeld 1 im Mini-Verteiler.
     Zwei Schränke ⇒ Schema „Schranknummer.Patchfeld.Port“ (beschr:"nr"): angezeigt als 1.1.13 / 2.1.5, gespeichert 1.13 / 1.5 */
  const DO=[["kg","Heimkino",2,"TV",1],["kg","Heizungsraum",1,"Wärmepumpe (Modbus)",1],["kg","Werkstatt",2,"Arbeitsfläche",1],["kg","Flur KG",1,"Decke (WLAN-AP)",1],
    ["eg","Diele",2,"Eingang",1],["eg","Büro",2,"Schreibtisch",1],["eg","Büro",2,"Schreibtisch",1],["eg","Wohnen / Essen",2,"TV",1],["eg","Wohnen / Essen",1,"Decke (WLAN-AP)",1],
    ["eg","Küche",1,"neben Tür",1],["eg","Wintergarten",1,"Decke (WLAN-AP)",1],["eg","Terrasse",1,"Außen (Kamera)",1],
    ["ga","Doppelgarage",2,"Wallbox (Lastmanagement)",2],["ga","Doppelgarage",1,"Decke (WLAN-AP)",2],["ga","Doppelgarage",1,"Außen (Kamera Einfahrt)",2],
    ["og1","Schlafen",2,"TV",4],["og1","Kind 1",2,"Schreibtisch",4],["og1","Kind 2",2,"Schreibtisch",4],["og1","Flur OG",1,"Decke (WLAN-AP)",4],["og1","Balkon",1,"Außen (Kamera)",4],
    ["og2","Arbeitszimmer",2,"Schreibtisch",4],["og2","Arbeitszimmer",2,"Schreibtisch",4],["og2","Musikzimmer",2,"neben Tür",4],["og2","Gästezimmer",2,"TV",4],["og2","Flur 2. OG",1,"Decke (WLAN-AP)",4],
    ["dg","Galerie",2,"TV",4],["dg","Galerie",1,"Decke (WLAN-AP)",4],["dg","Dachterrasse",1,"Außen (Kamera)",4]];
  const frei={}, dosen=[], dord={}; DO.filter(x=>da(x[0],x[1])).forEach(([e,n,ports,lage,pf],i)=>{ const raumId=raum(e,n), pp={}; for(let p=1;p<=ports;p++){ frei[pf]=(frei[pf]||0)+1; pp[p]=`${pf===4?1:pf}.${frei[pf]}`; }
    dord[raumId]=(dord[raumId]||0)+1; const zw=/WLAN/.test(lage)?"ap":/Kamera/.test(lage)?"kamera":/TV/.test(lage)?"tv":/Wärmepumpe|Wallbox/.test(lage)?"smart":"arbeitsplatz", nutz={}; for(let p=1;p<=ports;p++) nutz[p]=zw==="arbeitsplatz"&&p===2&&/Schreibtisch/.test(lage)?"telefon":zw;
    dosen.push({id:`dh-d-${i+1}`,raumId,ord:dord[raumId],ports,lage,sId:pf===4?"dh-s2":"dh-s1",pp,nutz}); });
  const g=r({id:"g-k_demo-k6",ortId:"k:demo-k6",etagen,verteiler,rcds,stromkreise,stellen,schraenke,dosen,beschr:"nr",pkFarben:{an:true,z:{arbeitsplatz:"blau",ap:"gelb",kamera:"schwarz",telefon:"gruen",tv:"weiss",smart:"orange",drucker:"violett",uplink:"rot"}},anschluss:{art:"glasfaser",anbieter:"Deutsche Glasfaser",raumId:raum("kg","Technikraum"),ont:"box",weg:"glas_zum_schrank",routerKat:"fritz-5590",routerOrt:"s:dh-s1",notiz:"Glasfaser im Leerrohr vom Hausübergabepunkt bis in den Serverschrank, GF-TA im Schrank"}},P.mp,vor(6));
  /* Netzwerkprüfung (läuft): fast alles gemessen, ein paar typische Fehler, im OG der Balkon noch offen */
  const nw={}; let li=0;
  dosen.forEach(d=>{ for(let p=1;p<=d.ports;p++){ const id=`${d.id}.${p}`, et=Object.keys(R).find(k=>R[k]===d.raumId).split(":")[0], i=li++;
    if(/Balkon/.test(Object.keys(R).find(k=>R[k]===d.raumId))) continue; /* noch nicht gemessen */
    const basis={kg:9,eg:21,ga:34,og1:31,og2:7,dg:14}[et]||20, len=(basis+((i*7.3)%17)).toFixed(1).replace(".",",");
    const w={wm:"ok",wmap:"12345678",wmS:"ok",len,v10:"ok",v100:"ok",v1g:"ok"}; if(/WLAN|Kamera/.test(d.lage)){ w.poe="ok"; w.poeW=/WLAN/.test(d.lage)?"12,4":"6,8"; } else w.poe="na";
    nw[id]=w; } });
  const dose=(raumName,nr)=>dosen.filter(d=>Object.keys(R).find(k=>R[k]===d.raumId).endsWith(":"+raumName))[nr||0];
  const k2=dose("Kind 2"); Object.assign(nw[k2.id+".1"],{wm:"nok",wmap:"12645378",wmF:"Paar 3/6 verpolt"});
  const sch=dose("Schlafen"); Object.assign(nw[sch.id+".2"],{wm:"nok",wmap:"12345608",wmF:"Ader 7 offen",v1g:"nok"});
  const ter2=dose("Terrasse"); Object.assign(nw[ter2.id+".1"],{len:"104,5",mangel:"Leitungsweg zur Terrasse zu lang – Kamera über PoE-Extender oder vom Mini-Verteiler im OG neu anfahren"});
  const gap=dose("Doppelgarage",1); Object.assign(nw[gap.id+".1"],{poe:"nok",poeW:"",mangel:"Access Point startet unter Last neu – PoE-Budget bzw. Kabel prüfen"});
  const hz=dose("Heizungsraum"); nw[hz.id+".1"]={ng:"Wärmepumpe angeschlossen, Port nicht abgeklemmt"};
  const netz=r({id:"demo-ec-netz",art:"netz",kundeId:"demo-k6",standortId:"",ortId:"k:demo-k6",datum:tag(-1),pruefart:"Abnahme",pruefer:P.mp.name,status:"laeuft",
    kabel:"Cat 7 Verlegekabel S/FTP, Cat 6A Module",belegung:"T568A",schirm:"ja",sicht:{},werte:nw,netz:{},umfang:null,
    geraet:{mess:"Trend Networks SignalTEK NT",kurz:"SignalTEK NT",sn:"DEMO-0001",kal:""}},P.mp,vor(1));
  /* Installationsprüfung (E-CHECK, läuft): Keller, EG und Garage gemessen, OG noch offen; Mangel an der Terrasse */
  const iw={}; let zi=0; const zs=()=>(0.42+((zi++*0.137)%0.9)).toFixed(2).replace(".",",");
  rcds.filter(x=>!/og/.test(x.id)).forEach((x,i)=>{ iw[x.id]={t1:String(16+i*3),t5:String(8+i),idelta:String(19+i),ub:"0,"+(5+i)}; });
  stromkreise.filter(s=>s.vId!=="dh-uvog").forEach((s,i)=>{ iw[s.id]={riso:i%4===2?"280":">500",rlo:(0.12+(i%6)*0.07).toFixed(2).replace(".",",")}; if(!s.rcdId||s.schutz.startsWith("C")||stellen.filter(st=>st.skId===s.id).every(st=>st.art==="licht")) iw[s.id].zs=zs(); });
  stellen.forEach((st,k)=>{ const sk=stromkreise.find(s=>s.id===st.skId); if(!sk||sk.vId==="dh-uvog"||st.art==="licht"||st.art==="sonst") return; const n=st.art==="sd"?st.fach:1;
    for(let p=1;p<=n;p++) iw[`${st.id}.${p}`]={zs:zs()}; });
  const ter=stellen.find(st=>st.raumId===raum("eg","Terrasse")); iw[ter.id+".1"]={zs:"3,12",mangel:"Z s zu hoch – Klemmstelle in der Außendose prüfen"};
  const sicht={}; for(let i=0;i<12;i++) sicht["s"+i]="ok"; sicht.s4="nok"; sicht.s7="na";
  const anl=r({id:"demo-ec-anl",art:"anlage",kundeId:"demo-k6",standortId:"",ortId:"k:demo-k6",datum:tag(-3),pruefart:"E-CHECK",pruefer:P.ms.name,status:"laeuft",
    sicht,werte:iw,netz:{form:"TN-C-S",hak:"63 A"},umfang:null,fristM:48,geraet:{mess:"Wiha MFT one",kurz:"MFT 1",sn:"MFT1-DEMO",kal:"03/2027"}},P.ms,vor(3));
  const A=(id,o)=>r(Object.assign({id,ortId:"k:demo-k6",kundeId:"demo-k6",pruefungen:[],aenderungen:[]},o),P.mp,vor(20));
  const anlagen=[
    A("demo-an-wp",{nr:"WP-1",bez:"Wärmepumpe",hersteller:"Bosch",typ:"Compress 6800i AW 12 E",baujahr:"2019",leistung:"5,5",spannung:"400",etageId:"dh-kg",raum:"Heizungsraum / Außengerät Garten",vId:"dh-hv",abgang:"F10",absicherung:"C16",zuleitung:"NYM-J 5×2,5 mm²",fristM:12,
      pruefungen:[{id:"demo-wp-p",datum:tag(-200),erg:"ok",notiz:"Wartung mit Heizungsbauer",wer:P.ms}],aenderungen:[{id:"demo-wp-a",at:vor(90),datum:tag(-90),was:"Modbus-Anbindung an Netzwerk (Datendose Heizungsraum)",warum:"PV-Überschussregelung",wer:P.mp}]}),
    A("demo-an-wb",{nr:"WB-1",bez:"Wallbox 11 kW",hersteller:"KEBA",typ:"KeContact P30 x-series",baujahr:"2023",leistung:"11",spannung:"400",etageId:"dh-ga",raum:"Doppelgarage",vId:"dh-uvga",abgang:"F1",absicherung:"B16",zuleitung:"NYM-J 5×6 mm²",fristM:48,
      pruefungen:[{id:"demo-wb-p",datum:tag(-20),erg:"ok",notiz:"Erstprüfung nach DIN VDE 0100-722 (EVSE-App)",wer:P.mp}]}),
    A("demo-an-pv",{nr:"PV-1",bez:"PV-Anlage 9,8 kWp mit Speicher",hersteller:"Fronius / BYD",typ:"Symo GEN24 8.0 Plus · HVS 10.2",baujahr:"2021",leistung:"9,8",spannung:"400",etageId:"dh-kg",raum:"Technikraum",vId:"dh-hv",abgang:"F14",absicherung:"B20",zuleitung:"NYM-J 5×4 mm²",fristM:48,pruefungen:[],aenderungen:[]})];
  return {kunde,gebaeude:[g],echecks:[anl,netz],anlagen}; }

let demoCache=null;
/* Beispieldaten in den Speicher dieser App legen (nicht in die Datenbank) – true, wenn etwas dazugekommen ist */
function demoNachfuellen(){
  if(!demoAn()||typeof DB==="undefined"||typeof KINDS==="undefined") return false;
  demoCache=demoCache||demoDaten(); let neu=false; const uebersicht=KINDS.includes("vorgaenge");
  const evse=!uebersicht&&typeof newProto==="function"&&typeof newSaeule==="function"; /* EVSE: vollständige Protokolle statt Listen-Platzhalter */
  for(const [k,L] of Object.entries(demoCache)){ if(!DB[k]||!(KINDS.includes(k)||k==="notizen")||(k==="pruefungen"&&!uebersicht&&!evse)) continue;
    for(const x of L) if(!DB[k].has(x.id)){ let r=JSON.parse(JSON.stringify(x)); if(k==="pruefungen"&&evse){ try{ r=demoEvseVoll(r); }catch(e){ continue; } } DB[k].set(x.id,r); neu=true; } }
  return neu;
}
/* EVSE-Beispielprotokoll mit echten Messwerten (alle im Grenzwert). fertig=false: Sichtprüfung und die ersten Messungen erledigt, Rest offen */
const DEMO_WERTE={rpe:"0,12",riso12:"299",riso13:"299",riso23:"299",riso1pe:"287",riso2pe:"299",riso3pe:"264",risov:"500 V",pevt:"ok",cp:"ok",u1:"231",u2:"232",u3:"229",unpe:"0,4",dreh:"rechts (123)",zs1:"0,38",zs2:"0,41",zs3:"0,39",ria:"21",ub:"1,2",r1:"24",dc6ms:"2800",r05:"ok",r5:"12",fe:"ok",ff:"ok"};
const DEMO_WB={"demo-p6":[["Wallbox Garage","Heidelberg Energy Control 11 kW","EC-2318841","Garage, Rückwand"]],"demo-p1":[["Wallbox 1","ABL eMH3 22 kW","ABL-77310","Werkstatt, Tor 1"],["Wallbox 2","ABL eMH3 22 kW","ABL-77311","Werkstatt, Tor 2"]],"demo-p4":[["Wallbox Halle","Mennekes Amtron 11 kW","AM-55120","Halle 2, Stütze B4"]]};
/* gezeichnete Beispiel-Unterschrift als PNG (wie vom Unterschriftenfeld) */
function demoUnterschrift(n){ try{ const c=document.createElement("canvas"); c.width=360; c.height=110; const g=c.getContext("2d"); g.strokeStyle="#1d2a5a"; g.lineWidth=3; g.lineCap=g.lineJoin="round"; g.beginPath();
  for(let t=0;t<=1;t+=.005){ const x=20+t*320, y=60+Math.sin(t*(n===1?23:17))*22*(1-t*.6)+Math.sin(t*(n===1?7:5)+n)*12; t?g.lineTo(x,y):g.moveTo(x,y); } g.stroke();
  g.beginPath(); g.moveTo(40,92); g.quadraticCurveTo(180,80,330,88); g.stroke(); return c.toDataURL("image/png"); }catch(e){ return ""; } }
function demoEvseVoll(x){ const p=newProto(), fertig=!!x.pdfAblage, wb=DEMO_WB[x.id]||[["Wallbox 1","Wallbox 11 kW","SN-"+x.id.slice(-2),""]];
  p.id=x.id; p.kundeId=x.kundeId; p.standortId=x.standortId||null; p.ladeparkId=x.ladeparkId||null;
  Object.assign(p.p,{datum:x.p.datum,art:x.p.art,pruefer:x.p.pruefer,auftragsnr:x.id==="demo-p6"?"A-24109":x.p.auftragsnr||"",geraetSn:"MFT-104422",kal:"03/2027"});
  p.s=wb.map((w,i)=>{ const s=newSaeule(i+1,"Wallbox"); Object.assign(s,{name:w[0],typ:w[1],sn:w[2],ort:w[3],fw:"1.4.2",absTyp:"LS B",absIn:"16",inenn:"16",phasen:3,lps:1,freigabe:"11 kW"});
    SICHT.forEach(r=>s.sicht[r.k]=fertig||i===0?"ok":"");
    const ks=Object.keys(DEMO_WERTE), bis=fertig?ks.length:i===0?ks.indexOf("zs1"):1; /* in Arbeit: bis vor die Schleifenimpedanz */
    ks.slice(0,bis).forEach(k=>s.lp[0].v[k]=DEMO_WERTE[k]); return s; });
  p.a=Object.assign(p.a,{naechste:x.a&&x.a.naechste||"",sigP:fertig?demoUnterschrift(1):"",sigPName:fertig?x.p.pruefer:"",sigK:fertig?demoUnterschrift(2):"",sigKName:fertig?(x.id==="demo-p6"?"Jonas Kessler":"Auftraggeber"):""});
  return Object.assign(p,{demo:true,pdfAblage:x.pdfAblage||"",createdBy:x.createdBy,created:x.created,updated:x.updated,updatedBy:x.updatedBy}); }
function demoIdb(rq){ return new Promise((res,rej)=>{ rq.onsuccess=()=>res(rq.result); rq.onerror=()=>rej(rq.error); }); }
function demoTx(tx){ return new Promise(res=>{ tx.oncomplete=tx.onerror=tx.onabort=()=>res(); }); }
/* Alles mit demo:true von diesem Gerät entfernen (auch Beispieldaten, die beim Ausprobieren geändert und dabei gespeichert wurden) */
async function demoSchalten(){
  for(const [name,stores] of DEMO_SPEICHER){
    try{ const db=await openStores(name,stores,true);
      for(const s of stores){ if(!db.objectStoreNames.contains(s)) continue; const alle=await demoIdb(db.transaction(s).objectStore(s).getAll()); const tx=db.transaction(s,"readwrite"); alle.filter(r=>r&&r.demo&&!r.sim).forEach(r=>tx.objectStore(s).delete(r.id)); /* sim: Auftrags-Simulation räumt selbst auf */ await demoTx(tx); }
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
  if(an){ demoNachfuellen(); render(); }
  else demoSchalten();
}
/* „Nur Beispieldaten“ für Vorführungen: echte Kunden, Aufträge usw. werden ausgeblendet (nur auf diesem Gerät, nichts wird gelöscht).
   Funktionsdeklaration, damit live() sie auch vor dieser Stelle aufrufen kann. */
const DEMO_NUR_KEY="irrgang_nur_demo", DEMO_NUR_IMMER=["einstellungen","profile","geraete","katalog"];
function nurDemo(){ try{ return localStorage.getItem(DEMO_NUR_KEY)==="1"&&demoAn(); }catch(e){ return false; } }
function nurDemoFilter(k,r){ return !nurDemo()||!!r.demo||DEMO_NUR_IMMER.includes(k); }
function nurDemoSetzen(an){ try{ localStorage.setItem(DEMO_NUR_KEY,an?"1":"0"); }catch(e){} if(an&&!demoAn()) demoUmschalten(true); render(); }
const demoDa=()=>["kunden","standorte","baustellen","pruefungen","eintraege","vorgaenge","anforderungen","gebaeude","echecks","anlagen","termine"].some(k=>DB[k]&&[...DB[k].values()].some(r=>r.demo&&!r.sim));
let demoWeg=false;
/* Demo aus, aber noch Beispieldaten auf dem Gerät (z. B. in einer anderen App ausgeschaltet) ⇒ aufräumen */
const demoPruefen=()=>{ try{ if(!demoAn()&&!demoWeg&&demoDa()){ demoWeg=true; demoSchalten(); } }catch(e){} };
addEventListener("load",()=>{ setTimeout(demoPruefen,1500); setTimeout(demoPruefen,6000); });
/* Schalter kommt evtl. erst mit dem Abgleich (andere App/anderes Gerät): regelmäßig nachsehen */
setInterval(()=>{ try{ if(demoAn()){ if(demoNachfuellen()) (typeof softRender==="function"?softRender:render)(); } else demoPruefen(); }catch(e){} },8000);
/* ===== Entwickler-Einstellungen (nur Rolle „Entwickler“): ganz unten in „Mehr“ ===== */
/* Entwickler: Rolle in Microsoft oder in der Mitarbeiterliste der Übersicht als „Entwickler“ eingetragen */
const istEntwickler=()=>{ try{ if(typeof meineRollen==="function"&&meineRollen().includes("Entwickler")) return true;
  const T=typeof EINST!=="undefined"&&EINST.team||[], ich=String((typeof ME!=="undefined"&&ME.mail)||"").toLowerCase(); return !!ich&&T.some(m=>m.mail===ich&&m.entwickler&&m.status!=="weg"); }catch(e){ return false; } };
function entwicklerBereich(){ if(!istEntwickler()) return ""; const z=[typeof mlDiagZeile==="function"&&ME.mail?mlDiagZeile():"",typeof mlTestZeile==="function"&&ME.mail?mlTestZeile():"",typeof simZeile==="function"&&ME.mail?simZeile():"",typeof wuEntwZeile==="function"&&ME.mail?wuEntwZeile():"",typeof tourZeile==="function"?tourZeile():""].join("").trim();
  if(!z) return ""; const zu=!!META.entwZu; /* ein- und ausklappbar, Zustand je Gerät */
  return `<button type="button" class="sec-lbl sec-klapp" data-act="entwKlapp" aria-expanded="${!zu}">Entwickler<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg></button>${zu?"":`<div class="list">${z}</div>`}`; }
/* keine Markierung mehr am Profilbild (der gelbe Ring ist weg) – nur die Klasse für evtl. Sonderfälle */
function demoMarke(){ document.getElementById("demoMarke")?.remove(); document.getElementById("demoStil")?.remove(); document.body.classList.toggle("demo-an",demoAn());
  const av=document.getElementById("avBtn"); if(av&&(av.title||"").startsWith("Demo")) av.removeAttribute("title"); }

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
  P.linie(40,780,W-40,780); P.text(40,796,"Beispiel aus dem Präsentationsmodus der Irrgang-Apps – kein echtes Protokoll.",{gr:8,farbe:G}); }); }
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
