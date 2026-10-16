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
  const D={kunden:[],standorte:[],ladeparks:[],pruefungen:[],baustellen:[],eintraege:[],notizen:[]};

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
      bem:"Überspannungsschutz im Zählerplatz nachrüsten (Angebot separat)."},fotos:{fZp:["demo-f-zp"],fHak:["demo-f-hak"],fUv:["demo-f-uvalt"],fMangel:["demo-f-mangel"]},sig:"demo-sig",sigName:"Max Pevec",sigDatum:tag(-30),pdf:[{at:Date.now()-30*864e5,von:"Max Pevec"}]}}));
  D.baustellen.push(R("demo-b-halle",{kundeId:"demo-k-werk",standortId:"demo-s-werk",name:"LED-Beleuchtung Lagerhalle",auftragsnr:"",status:"besichtigung",
    notiz:"Anfrage von Frau Beispiel: alte Leuchtstoffröhren in Lagerhalle 2 gegen LED tauschen.",
    aufnahme:{v:{datum:tag(0),von:"Max Pevec",anwesend:"Frau Beispiel",objektart:"Gewerbe",nutzung:"Eigennutzung",zustand:["gepflegt"],
      wunsch:"Lagerhalle 2 (ca. 900 m²): 48 Leuchtstoffröhren-Leuchten gegen LED-Hallenstrahler tauschen, Steuerung über Präsenzmelder je Gang.",budget:"noch offen"},fotos:{}}}));
  const MON={name:"Monteur (Beispiel)",mail:""}, MAX={name:"Max Pevec",mail:""};
  const UE=(id,d,o,wer=MAX)=>D.eintraege.push(R(id,Object.assign({baustelleId:"demo-b-haus",datum:tag(d),fotos:[],createdBy:wer,updatedBy:wer},o)));
  UE("demo-e-haus-1",-15,{stand:"Baustelle eingerichtet. EG: Strom in Küche, Wohnzimmer und Flur abgeklemmt, Baustromverteiler am Zählerplatz angeschlossen. Staubschutzwand zum Treppenhaus gestellt.",offen:"Schlitze EG stemmen.",material:"Baustromverteiler, Staubschutzwand, 40 m² Abdeckvlies",fotos:["demo-f-ue-baustrom"]});
  UE("demo-e-haus-2",-14,{stand:"EG: Schlitze in Küche und Wohnzimmer gestemmt, Leerrohre M20 verlegt. Gerätedosen gesetzt.",offen:"Flur und Bad EG stemmen.",material:"Leerrohr M20 (2 Rollen), Gerätedosen 30 Stück",fotos:["demo-f-ue-leerrohr"]},MON);
  UE("demo-e-haus-3",-11,{stand:"EG: Flur und Bad fertig gestemmt. Herdanschlussdose und Geschirrspüler-Steckdose vorbereitet.",offen:"Leitungen EG ziehen.",material:"NYM-J 3×1,5 mm² (100 m), NYM-J 5×2,5 mm² (25 m)"});
  UE("demo-e-haus-4",-8,{stand:"EG: Alle Leitungen gezogen, UV-EG im Flur gesetzt und verdrahtet. FI/LS beschriftet.",offen:"UV-EG Abdeckung montieren, OG beginnen.",material:"",fotos:["demo-f-ue-uv"]},MON);
  UE("demo-e-haus-5",-5,{stand:"OG: Mieterin informiert, Strom OG abgeschaltet. Schlitze Bad und Schlafzimmer gestemmt.",offen:"Leerrohre OG verlegen. Achtung: Mieterin hat Homeoffice Mo–Mi, laute Arbeiten nur nachmittags.",material:"Leerrohr M20 (1 Rolle)"});
  UE("demo-e-haus-6",-1,{stand:"OG: Leerrohre in Bad und Schlafzimmer verlegt, Gehäuse UV-OG im Abstellraum montiert. Mangel entdeckt: Wasserleitung im Bad nicht im Potentialausgleich.",offen:"OG Leitungen ziehen, Bad: Schutzpotentialausgleich anschließen, danach Messung beider Etagen.",material:"Potentialausgleichsschiene, Erdungsbandschellen, NYM-J 3×2,5 mm² (50 m)",fotos:["demo-f-ue-pa"]});
  D.notizen=[R("demo-n-haus",{titel:"Materialliste OG",sicht:"firma",personen:[],baustelleId:"demo-b-haus",createdBy:MAX,updatedBy:MAX,bloecke:[
    {id:"demo-nb-1",typ:"check",items:[{id:"demo-ni-1",t:"UV-OG Verteiler 2-reihig",ok:true},{id:"demo-ni-2",t:"4× FI/LS B16 Typ A",ok:true},{id:"demo-ni-3",t:"NYM-J 3×1,5 mm² (100 m)",ok:false},{id:"demo-ni-4",t:"Potentialausgleichsschiene + Bandschellen",ok:false},{id:"demo-ni-5",t:"Rauchwarnmelder 3 Stück",ok:false}]},
    {id:"demo-nb-2",typ:"text",text:"Mieterin OG: Frau Schulz, Tel. 0171 0000001 – Termine 2 Tage vorher abstimmen."}]})];

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

/* Beispielfotos: werden beim Einblenden gezeichnet (keine echten Bilder im Code) */
function demoBild(art){
  const c=document.createElement("canvas"); c.width=800; c.height=600; const x=c.getContext("2d");
  const verlauf=(a,b)=>{ const g=x.createLinearGradient(0,0,0,600); g.addColorStop(0,a); g.addColorStop(1,b); x.fillStyle=g; x.fillRect(0,0,800,600); };
  const rr=(X,Y,w,h,r,f)=>{ x.beginPath(); x.roundRect(X,Y,w,h,r); x.fillStyle=f; x.fill(); };
  const ls=(X,Y,n)=>{ for(let i=0;i<n;i++){ rr(X+i*34,Y,30,70,4,"#f4f4f2"); rr(X+i*34+8,Y+22,14,22,2,i%4===0?"#1d6fd1":"#3a3a3a"); } };
  if(art==="zp"){ verlauf("#b9b2a6","#8f897e"); rr(150,40,500,520,10,"#e9e8e3"); rr(170,60,460,480,6,"#d9d8d2");
    for(const X of [190,410]){ rr(X,90,200,170,6,"#2f3133"); rr(X+30,115,140,60,4,"#c8d6c4"); x.fillStyle="#111"; x.font="bold 30px monospace"; x.fillText("0"+(X===190?"48213":"10577"),X+40,155); }
    ls(200,330,12); rr(190,440,420,60,4,"#c9c8c2"); }
  else if(art==="hak"){ verlauf("#a7a39b","#7d7a73"); rr(240,80,320,440,8,"#3b3d40"); rr(270,120,260,360,6,"#55585c"); for(let i=0;i<3;i++){ rr(300+i*70,180,50,140,6,"#d8c25a"); rr(312+i*70,200,26,100,4,"#f0e6b0"); }
    x.strokeStyle="#111"; x.lineWidth=18; for(let i=0;i<5;i++){ x.beginPath(); x.moveTo(320+i*40,480); x.lineTo(320+i*40,600); x.stroke(); } }
  else if(art==="uvalt"||art==="uv"){ verlauf(art==="uv"?"#ecebe7":"#c7c1b4",art==="uv"?"#d4d2cc":"#a29b8d"); rr(130,60,540,480,10,art==="uv"?"#ffffff":"#d6d1c4"); for(let r=0;r<3;r++) ls(160,100+r*140,14);
    if(art==="uvalt"){ x.strokeStyle="#7a5a2a"; x.lineWidth=3; for(let i=0;i<14;i++){ x.beginPath(); x.moveTo(175+i*34,100); x.bezierCurveTo(160+i*30,40,220+i*20,20,200+i*25,0); x.stroke(); } }
    else { x.fillStyle="#333"; x.font="14px sans-serif"; for(let i=0;i<14;i++) x.fillText("F"+(i+1),168+i*34,190); } }
  else if(art==="mangel"){ verlauf("#d9d4c8","#b8b1a2"); rr(200,180,400,240,12,"#efe9dc"); x.fillStyle="rgba(120,70,20,.55)"; x.beginPath(); x.ellipse(420,300,120,70,0.3,0,7); x.fill();
    x.strokeStyle="#c62828"; x.lineWidth=8; x.beginPath(); x.ellipse(420,300,170,110,0.3,0,7); x.stroke(); }
  else if(art==="baustrom"){ verlauf("#9fb3c4","#6f8291"); rr(260,120,280,380,14,"#1f5fae"); rr(290,160,220,90,8,"#e9eef3"); for(let i=0;i<4;i++) rr(300+i*52,300,40,50,8,"#f2c230"); }
  else if(art==="leerrohr"){ verlauf("#d8d2c6","#bdb5a6"); x.strokeStyle="#e47a1d"; x.lineWidth=22; x.lineCap="round"; for(let i=0;i<4;i++){ x.beginPath(); x.moveTo(120+i*40,600); x.bezierCurveTo(140+i*40,320,380+i*30,260,700,180+i*40); x.stroke(); } rr(560,140,90,90,45,"#9b9b98"); }
  else if(art==="pa"){ verlauf("#e3e1dc","#c3c0b8"); rr(120,240,560,70,10,"#c08a3e"); x.fillStyle="#7b5420"; for(let i=0;i<8;i++){ x.beginPath(); x.arc(170+i*66,275,14,0,7); x.fill(); } x.strokeStyle="#2e7d32"; x.lineWidth=14; x.beginPath(); x.moveTo(250,310); x.lineTo(250,600); x.stroke(); x.strokeStyle="#f2c230"; x.setLineDash([24,24]); x.stroke(); }
  x.setLineDash([]); x.fillStyle="rgba(0,0,0,.55)"; rr(16,548,190,36,8,"rgba(0,0,0,.55)"); x.fillStyle="#fff"; x.font="bold 18px sans-serif"; x.fillText("Beispielfoto",36,573);
  return c.toDataURL("image/jpeg",0.78);
}
function demoUnterschrift(){ const c=document.createElement("canvas"); c.width=600; c.height=220; const x=c.getContext("2d"); x.fillStyle="#fff"; x.fillRect(0,0,600,220);
  x.strokeStyle="#14202c"; x.lineWidth=4; x.lineCap="round"; x.beginPath(); x.moveTo(60,150);
  for(let i=0;i<=60;i++){ const t=i/60; x.lineTo(60+t*460, 130-Math.sin(t*18)*38*(1-t*0.5)-t*30); } x.stroke(); x.beginPath(); x.moveTo(90,170); x.quadraticCurveTo(300,190,520,150); x.stroke(); return c.toDataURL("image/jpeg",0.8); }
const DEMO_FOTOS={"demo-f-zp":"zp","demo-f-hak":"hak","demo-f-uvalt":"uvalt","demo-f-mangel":"mangel","demo-f-ue-baustrom":"baustrom","demo-f-ue-leerrohr":"leerrohr","demo-f-ue-uv":"uv","demo-f-ue-pa":"pa"};
async function demoFotosSchreiben(an){ try{ const rq=indexedDB.open("baustelle_fotos",1); rq.onupgradeneeded=()=>rq.result.createObjectStore("f"); const db=await demoIdb(rq);
    if(!db.objectStoreNames.contains("f")){ db.close(); return; }
    const tx=db.transaction("f","readwrite"), st=tx.objectStore("f"); Object.keys(DEMO_FOTOS).forEach(id=>{ if(an) st.put(demoBild(DEMO_FOTOS[id]),id); else st.delete(id); }); await demoTx(tx); db.close(); }catch(e){} }
function demoIdb(rq){ return new Promise((res,rej)=>{ rq.onsuccess=()=>res(rq.result); rq.onerror=()=>rej(rq.error); }); }
function demoTx(tx){ return new Promise(res=>{ tx.oncomplete=tx.onerror=tx.onabort=()=>res(); }); }
async function demoSchalten(an){
  for(const [name,stores] of DEMO_SPEICHER){
    const db=await openStores(name,stores,true);
    for(const s of stores){ const alle=await demoIdb(db.transaction(s).objectStore(s).getAll()); const tx=db.transaction(s,"readwrite"); alle.filter(r=>r.demo).forEach(r=>tx.objectStore(s).delete(r.id)); await demoTx(tx); }
    if(an){ const D=demoDaten(); const sig=demoUnterschrift(); (D.baustellen||[]).forEach(b=>{ if(b.aufnahme&&b.aufnahme.sig==="demo-sig") b.aufnahme.sig=sig; }); for(const s of stores){ if(!D[s]||!D[s].length) continue; const tx=db.transaction(s,"readwrite"); D[s].forEach(r=>tx.objectStore(s).put(r)); await demoTx(tx); } }
    db.close();
  }
  await demoFotosSchreiben(an);
  if(!an) try{ const db=await demoIdb(indexedDB.open("evse_protokolle"));
    if(db.objectStoreNames.contains("meta")){ const m=await demoIdb(db.transaction("meta").objectStore("meta").getAll()), weg=m.filter(x=>x.demo).map(x=>x.id);
      if(weg.length){ const tx=db.transaction(["meta","blob"],"readwrite"); weg.forEach(id=>{ tx.objectStore("meta").delete(id); tx.objectStore("blob").delete(id); }); await demoTx(tx); } }
    db.close(); }catch(e){}
  try{ sessionStorage.setItem("demo_toast",an?"Beispieldaten eingeblendet – in allen vier Apps":"Beispieldaten ausgeblendet – in allen vier Apps"); }catch(e){}
  location.reload();
}
const demoDa=()=>live("kunden").some(k=>k.demo);
addEventListener("load",()=>{ try{ const t=sessionStorage.getItem("demo_toast"); if(t){ sessionStorage.removeItem("demo_toast"); setTimeout(()=>toast(t),600); } }catch(e){} });
