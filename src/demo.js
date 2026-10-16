/* Beispieldaten – gemeinsam für alle vier Apps (wird von tools/build.py in jede App eingesetzt).
   Feste IDs (demo-…), damit jede App dieselben Datensätze anlegt, sieht und wieder entfernt.
   Ein- und Ausschalten schreibt direkt in die gemeinsamen Gerätespeicher (evse_daten, baustelle_daten)
   und lädt die App danach neu – so sehen alle Apps sofort denselben Stand. */
const DEMO_SPEICHER=[["evse_daten",["kunden","standorte","ladeparks","pruefungen","katalog"]],["baustelle_daten",["baustellen","eintraege","notizen"]]];
function demoDaten(){
  const T=new Date(); T.setHours(12,0,0,0);
  const tag=d=>{ const x=new Date(T); x.setDate(x.getDate()+d); return x.toISOString().slice(0,10); };
  const jahr=(j,d=0)=>{ const x=new Date(T); x.setFullYear(x.getFullYear()+j); x.setDate(x.getDate()+d); return x.toISOString().slice(0,10); };
  const jetzt=Date.now(), wer={name:"Beispiel",mail:""};
  const R=(id,o)=>Object.assign({id,demo:true,created:jetzt,updated:jetzt,createdBy:wer,updatedBy:wer},o);
  const SICHT_OK=Object.fromEntries(["gehaeuse","ladekabel","befestigung","umgebung","leitung","klemmen","schutz","kennz","schild"].map(k=>[k,"ok"]));
  const FUNKTION="Funktionsprüfung mit Prüfadapter Fluke FEV300: Zustände A–E (CP), Ladevorgang, Verriegelung und Abschaltung geprüft.";
  const UMFANG="Prüfung der Ladeeinrichtung für Elektrofahrzeuge nach DIN VDE 0100-722 einschließlich Zuleitung ab Unterverteilung.";
  // Messwerte leicht streuen, damit nicht alles gleich aussieht
  const z=(b,i,sp,st=2)=>(b+(((i*37+11)%17)/16-0.5)*sp).toFixed(st).replace(".",",");
  const lp=(i,ph3=true,o={})=>({v:Object.assign({risov:"500 V",rpe:z(0.07,i,0.04),riso:i%3?"200":z(48,i,30,0),pevt:"ok",cp:"ok",
      u1:z(232,i,6,1),u2:ph3?z(231,i,6,1):"",u3:ph3?z(233,i,6,1):"",unpe:z(0.5,i,0.6,1),dreh:ph3?"rechts (123)":"",
      zs1:z(0.38,i,0.08),zs2:ph3?z(0.37,i,0.08):"",zs3:ph3?z(0.39,i,0.08):"",r05:"ok",r1:z(24,i,10,1),r5:z(6,i,3,1),ria:String(19+(i*7)%9),ub:z(1.2,i,0.8,1),dc6:z(1.8,i,1.2,1),fe:"ok",ff:"ok"},o.v||{}),bem:o.bem||""});
  const leer=()=>({v:{risov:"500 V"},bem:""});
  const saeule=(n,sn,i,ort,o1,o2)=>({id:`demo-st-${sn}`,sicht:SICHT_OK,bauart:"Ladesäule",name:`Ladesäule ${n}`,typ:"Mennekes AMEDIO Professional+ 22 kW",katId:"kat-mennekes-amedio-professional-plus-22-kw",
    sn,ort,fw:"5.22.3",absTyp:"LS B",absIn:"32",zsMan:"",inenn:"32",rcd:"A + RDC-DD 6 mA",rcdTyp:"A",rdc:true,idn:"30",freigabe:"Ladekarte",phasen:3,lps:2,
    leitung:"NYY-J 5×16 mm²",laenge:String(30+n*8),lp:[o1===null?leer():lp(i,true,o1||{}),o2===null?leer():lp(i+50,true,o2||{})],fotos:{}});
  const wallbox=(n,name,sn,i,ort,o,extra={})=>Object.assign({id:`demo-st-${sn}`,sicht:SICHT_OK,bauart:"Wallbox",name,typ:"Mennekes AMTRON Charge Control 11 kW",katId:"kat-mennekes-amtron-charge-control-11-kw",
    sn,ort,fw:"5.32.0",absTyp:"LS B",absIn:"16",zsMan:"",inenn:"16",rcd:"A + RDC-DD 6 mA",rcdTyp:"A",rdc:true,idn:"30",freigabe:"App",phasen:3,lps:1,
    leitung:"NYM-J 5×6 mm²",laenge:"18",lp:[o===null?leer():lp(i,true,o||{}),leer()],fotos:{}},extra);
  const neuId=(s,p)=>Object.assign(JSON.parse(JSON.stringify(s)),{id:`${s.id}-${p}`,gid:s.id});
  const zeit=d=>{ const t=new Date(d+"T16:00:00").getTime(); return Math.min(t,jetzt-60000); };
  const pruef=(id,o,stationen,a,zst)=>R(id,Object.assign({created:zeit(o.datum),updated:o.datum===tag(0)?jetzt:zeit(o.datum),kundeId:o.k,standortId:o.s,ladeparkId:o.l||null,zst,
    p:{projekt:"",auftraggeber:"",auftragsnr:o.nr,standort:o.uv,datum:o.datum,pruefer:"Max Pevec",geraet:"Wiha MFT one",geraetSn:"MFT-000123",kal:"10.2027",adapter:"Fluke FEV300",adapterSn:"FEV-004711",
      art:o.art,normen:o.art==="Erstprüfung"?["DIN VDE 0100-600","DIN VDE 0100-722"]:["DIN VDE 0105-100","DIN VDE 0100-722"],netz:"TN-C-S",umfang:UMFANG},
    s:stationen,a:Object.assign({maengel:"",funktion:FUNKTION,naechste:"",fristJ:"1",sigP:"",sigK:"",sigPName:"Max Pevec",sigKName:"",abweichung:""},a)}));
  const D={kunden:[],standorte:[],ladeparks:[],pruefungen:[],baustellen:[],eintraege:[]};

  /* 1 · Werk mit mehreren Parkplätzen */
  D.kunden.push(R("demo-k-werk",{name:"BEISPIEL Industriewerk Homburg GmbH",kdnr:"40112",strasse:"Industriestraße 20",plz:"51588",ort:"Nümbrecht",
    ansprech:"Frau Beispiel (Facility Management)",tel:"02293 000000",mail:"facility@example.com",notiz:"Beispiel: Werk mit drei Ladeparks, jährliche Wiederholungsprüfung"}));
  D.standorte.push(R("demo-s-werk",{kundeId:"demo-k-werk",name:"Werk Nümbrecht",strasse:"Industriestraße 20",plz:"51588",ort:"Nümbrecht",ansprech:"Herr Pförtner",tel:"02293 000000-10",
    notiz:"Anmeldung an der Pforte. Unterverteilungen UV-P1 und UV-P2 im Trafogebäude, Schlüssel an der Pforte."}));
  D.ladeparks.push(R("demo-l-p1",{standortId:"demo-s-werk",name:"Mitarbeiterparkplatz P1",notiz:"6 Ladesäulen mit je 2 Ladepunkten, Zuleitung aus UV-P1"}));
  D.ladeparks.push(R("demo-l-bes",{standortId:"demo-s-werk",name:"Besucherparkplatz",notiz:"2 Ladesäulen vor dem Haupteingang, Zuleitung aus UV-P2"}));
  D.ladeparks.push(R("demo-l-fuhr",{standortId:"demo-s-werk",name:"Fuhrpark-Halle",notiz:"4 Wallboxen an der Hallenwand, Erweiterung um 4 weitere läuft (siehe Baustelle)"}));
  const W={k:"demo-k-werk",s:"demo-s-werk"};
  const P1=[1,2,3,4,5,6].map(n=>saeule(n,`1522${4100+n*13}MA.0${7000+n*41}`,n,`Stellplatz ${2*n-1}/${2*n}`));
  D.pruefungen.push(pruef("demo-p-p1-erst",{...W,l:"demo-l-p1",nr:"2510-210",uv:"UV-P1",datum:jahr(-1),art:"Erstprüfung"},P1.map(s=>neuId(s,"erst")),{naechste:tag(0)},"ok"));
  // heute: Wiederholungsprüfung, nur Säule 1–3 im Umfang, Säule 3 noch offen
  const P1h=P1.map((s,i)=>{ const x=neuId(s,"heute"); x.lp=i<2?[lp(i+7),lp(i+57)]:[leer(),leer()]; if(i>=2) x.sicht={}; return x; });
  D.pruefungen.push(pruef("demo-p-p1-heute",{...W,l:"demo-l-p1",nr:"2610-205",uv:"UV-P1",datum:tag(0),art:"Wiederholungsprüfung"},P1h,{pdfOhne:P1h.slice(3).map(s=>s.id)},"wip"));
  const BES=[1,2].map(n=>saeule(n,`1522${5200+n*17}MA.0${7400+n*23}`,n+20,`Besucherplatz ${2*n-1}/${2*n}`));
  D.pruefungen.push(pruef("demo-p-bes",{...W,l:"demo-l-bes",nr:"2511-061",uv:"UV-P2",datum:jahr(-1,30),art:"Erstprüfung"},BES.map(s=>neuId(s,"erst")),{naechste:tag(30)},"ok"));
  const FU=[1,2,3,4].map(n=>wallbox(n,`Wallbox ${n}`,`1491${3300+n*7}PP.0${5200+n*29}`,n+30,`Hallenwand Feld ${n}`));
  D.pruefungen.push(pruef("demo-p-fuhr-erst",{...W,l:"demo-l-fuhr",nr:"2409-115",uv:"UV-Halle",datum:jahr(-2,-20),art:"Erstprüfung"},FU.map(s=>neuId(s,"erst")),{naechste:jahr(-1,-20)},"ok"));
  const FUw=FU.map((s,i)=>{ const x=neuId(s,"wdh"); if(i===1) x.lp=[lp(41,true,{v:{riso:"0,6"},bem:"Isolationswiderstand 0,6 MΩ – Feuchtigkeit in der Anschlussdose. Wallbox bis zur Instandsetzung außer Betrieb genommen."}),leer()]; else x.lp=[lp(i+40),leer()]; return x; });
  D.pruefungen.push(pruef("demo-p-fuhr-wdh",{...W,l:"demo-l-fuhr",nr:"2609-088",uv:"UV-Halle",datum:tag(-20),art:"Wiederholungsprüfung"},FUw,
    {maengel:"Wallbox 2: Isolationswiderstand 0,6 MΩ (< 1 MΩ). Anschlussdose trocknen, Dichtung der Kabeleinführung erneuern, danach erneut messen.",naechste:jahr(1,-20),sigK:"",sigKName:"Frau Beispiel"},"bad"));
  D.baustellen.push(R("demo-b-fuhr",{kundeId:"demo-k-werk",standortId:"demo-s-werk",name:"Erweiterung Fuhrpark-Halle: 4 Wallboxen",auftragsnr:"2610-142",status:"aktiv",
    notiz:"4 weitere Wallboxen AMTRON Charge Control 11 kW an der Hallenwand, Zuleitung aus UV-Halle, Kabeltrasse vorhanden."}));
  D.eintraege.push(R("demo-e-fuhr-1",{baustelleId:"demo-b-fuhr",datum:tag(-6),stand:"Kabeltrasse an der Hallenwand verlängert, 4 Leitungen NYM-J 5×6 mm² von der UV-Halle gezogen.",offen:"Wandhalter setzen, Wallboxen montieren.",material:"4× Wandhalter, Kabelbinder UV-beständig",fotos:[]}));
  D.eintraege.push(R("demo-e-fuhr-2",{baustelleId:"demo-b-fuhr",datum:tag(-1),stand:"Wallbox 5 und 6 montiert und angeschlossen. LS und RCD in der UV-Halle gesetzt und beschriftet.",offen:"Wallbox 7 und 8 montieren, Inbetriebnahme, danach Erstprüfung mit der EVSE-App.",material:"2× LS B16 3-polig, 2× RCD Typ A 40 A 4-polig",fotos:[]}));

  /* 2 · Zweifamilienhaus mit zwei Etagen */
  D.kunden.push(R("demo-k-haus",{name:"BEISPIEL Familie Becker",kdnr:"20871",strasse:"Am Weiher 3",plz:"51545",ort:"Waldbröl",ansprech:"Herr Becker",tel:"02291 000000",
    notiz:"Beispiel: Zweifamilienhaus, Sanierung Elektro über zwei Etagen und Wallbox in der Garage"}));
  D.standorte.push(R("demo-s-haus",{kundeId:"demo-k-haus",name:"Zweifamilienhaus Am Weiher 3",strasse:"Am Weiher 3",plz:"51545",ort:"Waldbröl",ansprech:"Herr Becker",tel:"02291 000000",
    notiz:"EG: Familie Becker, OG: Einliegerwohnung (vermietet, Mieter vorher anrufen). Zählerplatz im Keller, je Etage eine Unterverteilung (UV-EG, UV-OG)."}));
  const HW=wallbox(1,"Wallbox Garage","1491350PP.05380",61,"Garage, Wand rechts",{v:{u2:"231,4",u3:"233,0"}});
  D.pruefungen.push(pruef("demo-p-haus",{k:"demo-k-haus",s:"demo-s-haus",nr:"2610-090",uv:"Zählerplatz Keller",datum:tag(-9),art:"Erstprüfung"},[neuId(HW,"erst")],{naechste:jahr(4,-9),fristJ:"4",sigKName:"Herr Becker"},"ok"));
  D.baustellen.push(R("demo-b-haus",{kundeId:"demo-k-haus",standortId:"demo-s-haus",name:"Sanierung Elektro EG und OG",auftragsnr:"2609-117",status:"aktiv",
    notiz:"Komplette Erneuerung der Elektroinstallation in beiden Etagen, je Etage neue Unterverteilung. Zählerplatz bleibt.",
    aufnahme:{v:{datum:tag(-30),von:"Max Pevec",anwesend:"Herr und Frau Becker",ansprech:"Herr Becker, 0171 0000000",
      objektart:"MFH",mfh:"Allgemeinbereich",nutzung:"Vermietung",zustand:["historisch gewachsen","gealtert"],baujahr:"1968 / Bad EG 2004",stockwerke:"KG, EG, OG",
      bauart:"Massivbau, Decken Beton, Innenwände teils Ständerwerk (OG).",
      wunsch:"Komplette Erneuerung der Elektroinstallation in EG und OG. Je Etage eine eigene Unterverteilung mit FI/LS. Küche EG mit Herd- und Geschirrspüleranschluss. Bad OG mit Potentialausgleich. Zählerplatz bleibt, wird nur nachgerüstet.",
      rahmen:["Kinder / Bewohner","feste Termine"],rahmenTxt:"OG vermietet – Termine mit Mieterin 2 Tage vorher abstimmen.",budget:"ca. 18.000 € netto",beginn:tag(-15),ende:tag(25),
      verantw:"Elektro: Elektro Irrgang · Putz- und Malerarbeiten: Kunde selbst",ansprechOk:"Ja",zeitfenster:"Mo–Fr 7:30–16:30 Uhr",budgetOk:"Ja",
      hakOrt:"Keller, Hausanschlussraum links",hakSich:{a:"3",b:"63"},hakZust:"i. O.",zuleitung:{a:"5",b:"16"},
      erdOrt:"Keller, neben HAK",erdZust:"gealtert",erdMess:"veranlasst",blitzOk:"Nein",paOk:"Nein",erdBem:"Wasserleitung nicht im Potentialausgleich, wird mit erledigt.",
      zpOrt:"Keller",zpVors:{a:"3",b:"35"},zpUess:"Nein",zpArt:["Drehstrom"],zpZust:"gealtert",zpRes:"Ja",zpResTxt:"1 Zählerfeld frei",
      uvAnz:"2",uvOrte:"UV-EG Flur, UV-OG Abstellraum (beide neu)",uvBj:"neu",uvZust:"gealtert",uvBeschr:"noch offen",uvAbg:"Ja",uvUess:"Nein",uvRes:"Ja",
      rZust:"gealtert",rZug:"Ja",staub:["Staubschutzwand","Abdeckvlies selbstklebend"],vliesSk:"40",instArt:"Unterputz",rBem:"EG: Küche, Wohnen, Flur, Bad · OG: 3 Zimmer, Bad, Abstellraum",
      sBlitz:"nicht vorhanden",sUess:"Nein",sRwm:"Ja",sBrand:"Nein",sFlucht:"nicht vorhanden",sEma:"nicht vorhanden",
      hWdvs:"Nein",hFenster:"Ja",hTuer:"Nein",hRoll:"Nein",
      fZp:"Ja",fHak:"Ja",fErd:"Ja",fUv:"Ja",fRaum:"Ja",fMangel:"Ja",
      dKunde:"Ja",dArbeit:"Ja",dTermin:"Ja",dPlaene:"noch zu klären",dGewerke:"Ja",dOffen:"Ja",dMaengel:"Ja",dKundeDurch:"Ja",
      bem:"Überspannungsschutz im Zählerplatz nachrüsten (Angebot separat)."},fotos:{},sigName:"Max Pevec",sigDatum:tag(-30)}}));
  D.baustellen.push(R("demo-b-halle",{kundeId:"demo-k-werk",standortId:"demo-s-werk",name:"LED-Beleuchtung Lagerhalle",auftragsnr:"",status:"besichtigung",
    notiz:"Anfrage von Frau Beispiel: alte Leuchtstoffröhren in Lagerhalle 2 gegen LED tauschen.",
    aufnahme:{v:{datum:tag(0),von:"Max Pevec",anwesend:"Frau Beispiel",objektart:"Gewerbe",nutzung:"Eigennutzung",zustand:["gepflegt"],
      wunsch:"Lagerhalle 2 (ca. 900 m²): 48 Leuchtstoffröhren-Leuchten gegen LED-Hallenstrahler tauschen, Steuerung über Präsenzmelder je Gang.",budget:"noch offen"},fotos:{}}}));
  D.eintraege.push(R("demo-e-haus-1",{baustelleId:"demo-b-haus",datum:tag(-14),stand:"EG: Schlitze gestemmt, Leerrohre in Küche, Wohnzimmer und Flur verlegt.",offen:"EG Leitungen ziehen, UV-EG setzen.",material:"Leerrohr M20 (2 Rollen), Gerätedosen 30 Stück",fotos:[]}));
  D.eintraege.push(R("demo-e-haus-2",{baustelleId:"demo-b-haus",datum:tag(-8),stand:"EG: Leitungen gezogen, UV-EG gesetzt und verdrahtet. Küche: Herdanschluss vorbereitet.",offen:"OG beginnen: Schlitze Bad und Schlafzimmer.",material:"NYM-J 3×1,5 mm² (100 m), NYM-J 5×2,5 mm² (25 m)",fotos:[]}));
  D.eintraege.push(R("demo-e-haus-3",{baustelleId:"demo-b-haus",datum:tag(-1),stand:"OG: Leerrohre in Bad und Schlafzimmer verlegt, Gehäuse UV-OG montiert.",offen:"OG Leitungen ziehen, im Bad Schutzpotentialausgleich anschließen, danach Messung beider Etagen.",material:"Potentialausgleichsschiene, Erdungsbandschellen, NYM-J 3×2,5 mm² (50 m)",fotos:[]}));

  /* 3 · Einzelne Wallbox */
  D.kunden.push(R("demo-k-wb",{name:"BEISPIEL Jonas Schmitz",kdnr:"20944",strasse:"Lindenweg 8",plz:"51588",ort:"Nümbrecht",tel:"02293 000000",notiz:"Beispiel: einzelne Wallbox am Einfamilienhaus"}));
  D.standorte.push(R("demo-s-wb",{kundeId:"demo-k-wb",name:"Einfamilienhaus Lindenweg 8",strasse:"Lindenweg 8",plz:"51588",ort:"Nümbrecht",notiz:"Wallbox im Carport, Zuleitung aus dem HAK-Raum (Keller)."}));
  const WB=wallbox(1,"Wallbox Carport","1491377PP.05411",71,"Carport",{},{freigabe:"Frei (ohne Freigabe)"});
  D.pruefungen.push(pruef("demo-p-wb",{k:"demo-k-wb",s:"demo-s-wb",nr:"2610-131",uv:"Zählerschrank Keller",datum:tag(-3),art:"Erstprüfung"},[neuId(WB,"erst")],{naechste:jahr(4,-3),fristJ:"4",sigKName:"Herr Schmitz"},"ok"));
  D.baustellen.push(R("demo-b-wb",{kundeId:"demo-k-wb",standortId:"demo-s-wb",name:"Wallbox Carport",auftragsnr:"2610-131",status:"fertig",notiz:"Wallbox 11 kW, Leitung durch den Garten im Leerrohr verlegt."}));
  D.eintraege.push(R("demo-e-wb-1",{baustelleId:"demo-b-wb",datum:tag(-3),stand:"Wallbox montiert, angeschlossen, in Betrieb genommen und geprüft (Protokoll in der EVSE-App).",offen:"",material:"",fotos:[]}));
  D.eintraege.forEach(e=>{ e.created=e.updated=zeit(e.datum); });
  return D;
}
function demoIdb(rq){ return new Promise((res,rej)=>{ rq.onsuccess=()=>res(rq.result); rq.onerror=()=>rej(rq.error); }); }
function demoTx(tx){ return new Promise(res=>{ tx.oncomplete=tx.onerror=tx.onabort=()=>res(); }); }
async function demoSchalten(an){
  for(const [name,stores] of DEMO_SPEICHER){
    const db=await openStores(name,stores,true);
    for(const s of stores){ const alle=await demoIdb(db.transaction(s).objectStore(s).getAll()); const tx=db.transaction(s,"readwrite"); alle.filter(r=>r.demo).forEach(r=>tx.objectStore(s).delete(r.id)); await demoTx(tx); }
    if(an){ const D=demoDaten(); for(const s of stores){ if(!D[s]||!D[s].length) continue; const tx=db.transaction(s,"readwrite"); D[s].forEach(r=>tx.objectStore(s).put(r)); await demoTx(tx); } }
    db.close();
  }
  if(!an) try{ const db=await demoIdb(indexedDB.open("evse_protokolle"));
    if(db.objectStoreNames.contains("meta")){ const m=await demoIdb(db.transaction("meta").objectStore("meta").getAll()), weg=m.filter(x=>x.demo).map(x=>x.id);
      if(weg.length){ const tx=db.transaction(["meta","blob"],"readwrite"); weg.forEach(id=>{ tx.objectStore("meta").delete(id); tx.objectStore("blob").delete(id); }); await demoTx(tx); } }
    db.close(); }catch(e){}
  try{ sessionStorage.setItem("demo_toast",an?"Beispieldaten eingeblendet – in allen vier Apps":"Beispieldaten ausgeblendet – in allen vier Apps"); }catch(e){}
  location.reload();
}
const demoDa=()=>live("kunden").some(k=>k.demo);
addEventListener("load",()=>{ try{ const t=sessionStorage.getItem("demo_toast"); if(t){ sessionStorage.removeItem("demo_toast"); setTimeout(()=>toast(t),600); } }catch(e){} });
