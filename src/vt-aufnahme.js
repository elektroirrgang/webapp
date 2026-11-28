/* ===== Verteiler aufnehmen: Assistent mit einer Frage pro Fenster =====
   „Neuer Verteiler“: Art → Montage → Größe → (Ort) → Name → Netzform, Kachel antippen = weiter.
   „+ Gerät“: Gerät aus der Materialliste (mit Foto) → bei Automaten „Wofür?“ → Kennzeichnung zählt selbst mit.
   Läuft im Dialogfeld #dlg (Handy: ganze Seite, iPad/PC: großes Fenster). Die Einträge landen im Editor der Verteilerlegende
   (legE / legSpeichern), beim Kunden also über vtSchreiben im Gebäude. Das Gerät merkt sich seine Artikelnummer in e.mat. */
let AW=null;
const AW_SVG={
  hv:'<rect x="11" y="4" width="26" height="40" rx="3" class="a"/><circle cx="24" cy="15" r="5" class="b"/><rect x="15" y="25" width="18" height="4" rx="1" class="b"/><rect x="15" y="32" width="18" height="4" rx="1" class="b"/>',
  uv:'<rect x="7" y="9" width="34" height="30" rx="3" class="a"/><rect x="11" y="14" width="26" height="5" rx="1" class="b"/><rect x="11" y="22" width="26" height="5" rx="1" class="b"/><rect x="11" y="30" width="26" height="5" rx="1" class="b"/>',
  gw:'<rect x="5" y="3" width="38" height="40" rx="3" class="a"/><path d="M24 3v40" class="c"/><rect x="9" y="8" width="11" height="4" rx="1" class="b"/><rect x="9" y="15" width="11" height="4" rx="1" class="b"/><rect x="28" y="8" width="11" height="4" rx="1" class="b"/><rect x="28" y="15" width="11" height="4" rx="1" class="b"/><rect x="8" y="43" width="6" height="3" class="b"/><rect x="34" y="43" width="6" height="3" class="b"/>',
  ap:'<rect x="4" y="4" width="8" height="40" class="b"/><rect x="12" y="11" width="22" height="26" rx="3" class="a"/><path d="M34 16v16" class="c"/>',
  up:'<rect x="4" y="4" width="20" height="40" class="b"/><rect x="10" y="11" width="16" height="26" rx="2" class="a"/><rect x="24" y="9" width="4" height="30" rx="1" class="a"/>',
  res:'<rect x="17" y="8" width="14" height="32" rx="2" class="a"/><path d="M20 24h8" class="c"/>',
  gr:'<rect x="7" y="12" width="34" height="6" rx="2" class="b"/><rect x="7" y="23" width="26" height="4" rx="1" class="a"/><rect x="7" y="31" width="30" height="4" rx="1" class="a"/>',
  kln:'<rect x="18" y="5" width="12" height="38" rx="2" fill="#2F8FE0"/>',
  kla:'<rect x="18" y="5" width="12" height="38" rx="2" fill="#A9AEB4"/>',
  klpe:'<rect x="18" y="5" width="12" height="38" rx="2" fill="#7CC242"/><rect x="28" y="5" width="2" height="38" fill="#E2C41C"/>',
  frei:'<rect x="17" y="8" width="14" height="32" rx="2" class="a"/><path d="M24 18v12M18 24h12" class="c"/>'};
const awSvg=k=>`<svg class="aw-svg" viewBox="0 0 48 48" aria-hidden="true">${AW_SVG[k]||""}</svg>`;
const awReihenSvg=n=>`<svg class="aw-svg" viewBox="0 0 48 48" aria-hidden="true"><rect x="6" y="4" width="36" height="40" rx="3" class="a"/>${Array.from({length:n},(_,i)=>{ const h=Math.min(5,24/n), g=(32-n*h)/(n+1); return `<rect x="10" y="${(8+g+i*(h+g)).toFixed(1)}" width="28" height="${h.toFixed(1)}" rx="1" class="b"/>`; }).join("")}</svg>`;
const AW_ART=[["hv","Zählerschrank / HV","mit Zählerplatz, Hauptverteilung"],["uv","Unterverteiler","Kleinverteiler, z. B. Hager volta"],["gw","Gewerbe / Standverteiler","größere Anlage, Industrie"]];
const AW_NAMEN={hv:["HV","Zählerschrank","HV Keller","HV Hausanschlussraum"],uv:["UV KG","UV EG","UV OG","UV DG","UV Garage","UV Werkstatt"],gw:["HV","UV Halle","UV Büro","UV Werkstatt"]};
const AW_NETZ=[["TN-C-S | 230/400 V","TN-C-S","am häufigsten im Haus"],["TN-S | 230/400 V","TN-S","getrennter N und PE ab Einspeisung"],["TT | 230/400 V","TT","eigener Erder, meist auf dem Land"],["","Weiß ich nicht","später eintragen"]];

/* ---------- Rahmen ---------- */
function awRahmen({titel,unter,schritt,schritte,frage,hinweis,inhalt,fuss}){
  $("#dlg").classList.remove("breit"); $("#dlg").classList.add("aw");
  $("#dlg").innerHTML=`<div class="aw-kopf"><button type="button" class="icon-btn aw-zur" data-act="awZur" aria-label="Zurück">${icon("back")}</button>
      <div class="aw-tt"><b>${esc(titel)}</b>${unter||schritte?`<small>${esc([unter,schritte>1?`Schritt ${Math.min(schritt+1,schritte)} von ${schritte}`:""].filter(Boolean).join(" · "))}</small>`:""}</div><button type="button" class="icon-btn" data-act="awZu" aria-label="Schließen">${icon("close")}</button></div>
    <div class="aw-inhalt">${frage?`<h2 class="aw-frage">${esc(frage)}</h2>`:""}${hinweis?`<p class="aw-hinweis">${esc(hinweis)}</p>`:""}${inhalt}</div>
    ${fuss?`<div class="aw-fuss">${fuss}</div>`:""}`;
  $("#menu").hidden=true; $("#dlg").hidden=false; $("#scrim").hidden=false; $("#scrim").classList.add("dim");
  const ih=$("#dlg .aw-inhalt"); if(ih) ih.scrollTop=0; }
const awKachel=(act,v,bild,t,s,an)=>`<button type="button" class="aw-k" data-act="${act}" data-v="${esc(v)}" aria-pressed="${!!an}">${bild?`<span class="aw-kb">${bild}</span>`:""}<span class="aw-kt"><b>${esc(t)}</b>${s?`<small>${esc(s)}</small>`:""}</span></button>`;
/* Bild in einer Auswahl-Kachel antippen → große Vorschau (Max 18.11.2026): zum Erkennen des Geräts.
   Text antippen wählt wie bisher aus; in der Vorschau geht beides: „Auswählen“ oder schließen. */
function awBildGross(kb,kOpt,inhalt){ const img=kb.querySelector("img"), k=kOpt||kb.closest(".aw-k"); if(!img&&!inhalt||!k) return;
  const t=(k.querySelector(".aw-kt b,b")||{}).textContent||"", s=[...k.querySelectorAll(kOpt?":scope>small":".aw-kt small")].map(x=>x.textContent).join(" · "), an=k.getAttribute("aria-pressed")==="true";
  const v=document.createElement("div"); v.className="aw-gross"; v.setAttribute("role","dialog"); v.setAttribute("aria-label",t||"Vorschau");
  v.innerHTML=`<div class="aw-gk"><div class="aw-gvb">${inhalt||`<img src="${esc(img.currentSrc||img.src)}" alt="">`}</div><div class="aw-gt"><b>${esc(t)}</b>${s?`<small>${esc(s)}</small>`:""}</div>
    <div class="aw-gf"><button type="button" class="btn-text" data-g="zu">Schließen</button>${an?`<span class="aw-gan">Ausgewählt</span>`:`<button type="button" class="btn-filled" data-g="ok">Auswählen</button>`}</div></div>`;
  v.addEventListener("click",e=>{ const b=e.target.closest("button"); if(b&&b.dataset.g==="ok"){ v.remove(); k.click(); return; } if(b||e.target===v) v.remove(); });
  document.body.appendChild(v); }
document.addEventListener("click",e=>{ const kb=e.target.closest&&e.target.closest(".aw-k .aw-kb"); if(!kb) return; const img=kb.querySelector("img"); if(!img||!img.naturalWidth) return;
  e.stopImmediatePropagation(); e.preventDefault(); awBildGross(kb); },true);
/* Schrank-Kachel: Lupe zeigt Foto und Skizze groß (Max 25.11.2026) */
document.addEventListener("click",e=>{ const box=e.target.closest&&e.target.closest(".zs-mod .zs-mod-svg"); if(!box) return; const img=box.querySelector("img.zs-mod-gross"); if(!img||!img.naturalWidth) return;
  e.stopImmediatePropagation(); e.preventDefault(); const k=box.closest(".zs-mod"), sk=box.querySelector(".zs-svg");
  awBildGross(box,k,`<div class="zs-mod-gv"><figure><img src="${esc(img.currentSrc||img.src)}" alt=""><figcaption>So sieht er aus</figcaption></figure>${sk?`<figure>${sk.outerHTML}<figcaption>Feldaufteilung</figcaption></figure>`:""}</div>`); },true);
document.addEventListener("keydown",e=>{ if(e.key==="Escape"){ const g=document.querySelector(".aw-gross"); if(g){ g.remove(); e.stopImmediatePropagation(); } } },true);
function awZu(){ AW=null; $("#dlg").classList.remove("aw"); closeOverlays(); render(); }

/* ---------- Neuer Verteiler ---------- */
function awNeuStart(kind,id){ const s=kind==="standorte"&&standortOf(id), k=kind==="kunden"?kundeOf(id):s?kundeOf(s.kundeId):null;
  const ss=k&&!s?standorteVon(k.id):[];
  AW={typ:"neu",kid:k?k.id:"",ort:s?s.id:k&&!ss.length?"k:"+k.id:"",ortWahl:ss.length>0,i:0,d:{art:"",montage:"",reihen:0,name:"",netz:null},unter:k?(s?[k.name,s.name].filter(Boolean).join(" · "):k.name):"Ohne Kunde"};
  awNeuZeigen(); }
function awNeuSchritte(){ const hv=AW.d.art==="hv";
  /* Zählerschrank gestrafft (26.11.2026): Hersteller als Umschalter auf der Modell-Seite (kein eigener Schritt).
     Neu: Bedarf → passende Modelle. Bestand: gleich „Welcher Schrank hängt da?“ – nur bei „weiß nicht“ danach die Felder. */
  if(hv) return AW.d.bestand?["art","zustand","geraete","modell",...(AW.d.ohneModell?["bedarf"]:[]),...(AW.ortWahl?["ort"]:[]),"vorschlag"]
    :["art","zustand","geraete","bedarf","modell",...(AW.ortWahl?["ort"]:[]),"vorschlag"];
  /* Unterverteiler (26.11.2026): Neu/Bestand · Montage mit Foto · Einbaugeräte · Modell (bringt Reihen und TE mit) · Name + Einspeisung auf einer Seite */
  if(AW.d.art==="uv") return ["art","zustand","montage","geraete","modell",...(AW.d.typFrei?["reihen"]:[]),...(AW.ortWahl?["ort"]:[]),"namevon"];
  /* Gewerbe / Industrie (26.11.2026): Typ (vector, univers Stand, Rittal, frei, alt) · Modell · Daten auf einer Seite (alles optional) · Name + Einspeisung */
  if(AW.d.art==="gw"){ const t=(AW.d.gw||{}).typ; return ["art","zustand","gwtyp",...(t&&GW_MOD[t]?["gwmodell"]:[]),"gwdaten",...(AW.ortWahl?["ort"]:[]),"namevon"]; }
  return ["art","montage","reihen",...(AW.ortWahl?["ort"]:[]),"name",...(awVonListe().length?["von"]:[]),"netz"]; }
/* ===== Gewerbe- und Industrieschränke ===== */
const GW_TYP={vector:["Hager vector IP65","Wandverteiler aus Kunststoff – Baustrom, Maschine, außen geschützt"],univers:["Hager univers Stand IP55","Standschrank mit Sockel, Felder à 250 mm"],rittal:["Rittal VX25","Schaltschrank mit Montageplatte, anreihbar"],alt:["Schneider / ABN (alt)","älterer Schrank – Maße und Daten frei"],frei:["Frei konfigurieren","beliebiger Hersteller, Maße, Schutzart"]};
const GW_MOD={
  vector:[{hnr:"VE112DN",n:1,h:302,b:310,t:151,ip:"IP65",bild:"https://assets.hager.com/step-content/P/HA_16279747/11/std.lang.all/VE112DN.webp"},{hnr:"VE212DN",n:2,h:427,b:310,t:151,ip:"IP65",bild:"https://assets.hager.com/step-content/P/HA_16279809/11/std.lang.all/VE212DN.webp"},{hnr:"VE312DN",n:3,h:552,b:310,t:151,ip:"IP65",bild:"https://assets.hager.com/step-content/P/HA_16279876/11/std.lang.all/VE312DN.webp"}],
  univers:[{hnr:"FR22S2",felder:2,h:2050,b:550,t:275,ip:"IP55",bild:"https://assets.hager.com/step-content/P/HA_16209342/11/std.lang.all/FR22S2.webp"},{hnr:"FR23S2",felder:3,h:2050,b:800,t:275,ip:"IP55",bild:"https://assets.hager.com/step-content/P/HA_16209391/11/std.lang.all/FR23S2.webp"},{hnr:"FR24S2",felder:4,h:2050,b:1050,t:275,ip:"IP55",bild:"https://assets.hager.com/step-content/P/HA_16209448/11/std.lang.all/FR24S2.webp"},{hnr:"FR25S2",felder:5,h:2050,b:1300,t:275,ip:"IP55",bild:"https://assets.hager.com/step-content/P/HA_16209464/11/std.lang.all/FR25S2.webp"}],
  rittal:[{hnr:"8606.000",h:2000,b:600,t:600,ip:"IP55"},{hnr:"8806.000",h:2000,b:800,t:600,ip:"IP55"}]};
const GW_HERST={vector:"Hager",univers:"Hager",rittal:"Rittal"};
const GW_EINSP=["Direkt auf Klemmen","Lasttrennschalter","NH-Lasttrenner 160 A","NH-Lasttrenner 250 A","NH-Lasttrenner 400 A","Leistungsschalter"], GW_SCHIENE=["keine","250 A","400 A","630 A"], GW_IP=["IP30","IP44","IP54","IP55","IP65"];
const gwMod=g=>g&&GW_MOD[g.typ]&&GW_MOD[g.typ].find(m=>m.hnr===g.hnr)||null;
const gwBild=m=>m&&m.bild?(typeof bildLokal==="function"?bildLokal(m.bild):m.bild):"";
function gwName(g){ g=g||{}; const m=gwMod(g); if(m) return g.typ==="rittal"?`Rittal VX25 ${m.hnr}`:g.typ==="vector"?`Hager vector ${m.hnr}`:`Hager univers ${m.hnr}`;
  return [g.hersteller||(g.typ==="alt"?"Schneider / ABN":""),g.typ==="frei"||g.typ==="alt"?"Schrank":(GW_TYP[g.typ]||["Schrank"])[0]].filter(Boolean).join(" ")||"Schrank"; }
function gwKurz(g){ g=g||{}; const m=gwMod(g)||{}, b=g.b||m.b, h=g.h||m.h, t=g.t||m.t;
  return [b&&h?`${b} × ${h}${t?" × "+t:""} mm`:"",g.ip||m.ip,m.n?`${m.n}-reihig · ${m.n*12} TE`:(m.felder||g.felder)?`${m.felder||g.felder} Felder`:g.reihen?`${g.reihen} Reihen`:""].filter(Boolean).join(" · "); }
function gwModellFenster(d){ const g=d.gw||{}, L=GW_MOD[g.typ]||[];
  const karte=m=>{ const u=gwBild(m); return `<button type="button" class="aw-g zs-mod" data-act="awGwMod" data-v="${esc(m.hnr)}"${g.hnr===m.hnr?' aria-pressed="true"':""}><span class="aw-gb zs-mod-svg">${u?`<img class="zs-mod-gross" src="${esc(u)}" alt="" loading="lazy" onerror="this.remove()">`:awSvg("gw")}</span><b>${esc(m.n?`${m.n}-reihig · ${m.n*12} TE`:m.felder?`${m.felder} Felder`:`${m.b} mm breit`)}</b><small>${esc(`${m.b} × ${m.h} × ${m.t} mm · ${m.ip}`)}</small><small class="zs-mod-nr">${esc((GW_HERST[g.typ]||"")+" "+m.hnr)}</small></button>`; };
  return {frage:d.bestand?"Welcher hängt / steht da?":"Welche Größe?",hinweis:`${(GW_TYP[g.typ]||[""])[0]}. Antippen übernimmt Maße und Schutzart.`,
    inhalt:`<div class="aw-grid">${L.map(karte).join("")}</div><div class="aw-lbl">Nicht dabei</div><div class="aw-liste">${awKachel("awGwMod","","","Andere Größe","Maße im nächsten Schritt eintragen",g.typ&&!g.hnr&&g.frei)}</div>`}; }
/* Daten auf einer Seite – alles optional. Bei Modell sind Maße und Schutzart schon gesetzt. */
function gwDatenHtml(g){ g=g||{}; const m=gwMod(g), chips=(k,L)=>`<div class="vti-chips">${L.map(v=>`<button type="button" class="chip" data-act="gwChip" data-k="${k}" data-v="${esc(v)}" aria-pressed="${g[k]===v}">${esc(v)}</button>`).join("")}</div>`;
  return `${m?"":`<div class="aw-lbl">Hersteller</div><div class="vti-chips">${["Hager","Rittal","Schneider","ABN","Spelsberg"].map(v=>`<button type="button" class="chip" data-act="gwHerstChip" data-v="${v}" aria-pressed="${g.hersteller===v}">${v}</button>`).join("")}</div>
      <div class="fg1">${tf("gwHerst","Hersteller / Typ (frei)",g.hersteller||"",{form:true,ph:"z. B. Schneider Prisma"})}</div>
      <div class="aw-lbl">Maße in mm</div><div class="gw-mass">${tf("gwB","Breite",g.b||"",{form:true,ph:"800"})}${tf("gwH","Höhe",g.h||"",{form:true,ph:"2000"})}${tf("gwT","Tiefe",g.t||"",{form:true,ph:"400"})}</div>
      <div class="aw-lbl">Schutzart</div>${chips("ip",GW_IP)}
      <div class="aw-lbl">Reihen für Einbaugeräte (je 12 TE)</div>${chips("reihen",["1","2","3","4","5","6","8","10"])}`}
    <div class="aw-lbl">Einspeisung</div>${chips("einsp",GW_EINSP)}
    <div class="aw-lbl">Sammelschiene</div>${chips("schiene",GW_SCHIENE)}`; }
function gwDatenLesen(g){ const v=id=>((document.getElementById("f_"+id)||{}).value||"").trim();
  if(document.getElementById("f_gwB")){ g.hersteller=v("gwHerst"); g.b=+v("gwB")||""; g.h=+v("gwH")||""; g.t=+v("gwT")||""; }
  document.querySelectorAll('#dlg [data-act="gwChip"]').forEach(x=>{ if(x.getAttribute("aria-pressed")==="true") g[x.dataset.k]=x.dataset.v; });
  return g; }
/* Verteiler, die am gewählten Ort schon da sind – daraus kann der neue gespeist werden (HV → UV) */
const awVonListe=()=>{ if(!AW||!AW.kid||!AW.ort&&AW.ortWahl) return []; const g=ecGeb(AW.ort||"k:"+AW.kid); return (g.verteiler||[]).filter(v=>v&&!v.deleted); };
const awOrtPlz=()=>{ if(!AW.kid) return ""; const o=ecOrt(AW.ort||"k:"+AW.kid); return String(((o.standort&&o.standort.plz)?o.standort:o.kunde||{}).plz||"").trim(); };
function awNeuZeigen(){ const S=awNeuSchritte(), sk=AW.sub||S[AW.i], d=AW.d, R={titel:"Neuer Verteiler",unter:AW.unter,schritt:AW.i,schritte:S.length};
  if(sk==="hersteller") return awRahmen({...R,frage:"Welcher Hersteller?",hinweis:"Höhe, Reihen und Felder sind genormt – der Hersteller zählt für Material und Artikelnummern.",inhalt:`<div class="aw-liste">${ZS_HERST.map(([k,t,u])=>awKachel("awNeuW",k,"",t,u,d.hersteller===k)).join("")}</div>`});
  if(sk==="geraete") return awRahmen({...R,frage:"Einbaugeräte von?",hinweis:"LS, FI und FI/LS dieses Herstellers stehen beim Bestücken vorne.",inhalt:`<div class="aw-liste">${ZS_GERHERST.map(([k,t,u])=>awKachel("awNeuW",k,"",t,u,d.gerHerst===k&&d.gerHerst!=null)).join("")}</div>`});
  if(sk==="bedarf") return awRahmen({...R,...zsBedarfFenster(d.bedarf),...(d.bestand?{frage:"Was ist im Schrank?",hinweis:"So, wie er jetzt hängt – Zählerplätze, Verteilerfelder, Multimedia."}:{})});
  if(sk==="modell"&&d.art!=="uv"){ const F=d.bestand?zsModellFensterBestand(d):zsModellFenster(d), hs=`<div class="knx-seg zs-hseg aw-hseg">${ZS_HERST.filter(x=>x[0]!=="andere").map(([k,t])=>`<button type="button" data-act="awHerstW" data-v="${k}" aria-pressed="${d.hersteller===k}">${esc(t)}</button>`).join("")}</div>`;
    return awRahmen({...R,...F,inhalt:hs+F.inhalt}); }
  if(sk==="vorschlag"){ const plz=awOrtPlz(); if(d.zs.nb==null&&ZS_PLZ_NB[plz]){ zsNbSetzen(d.zs,ZS_PLZ_NB[plz]); d.nbAuto=true; } return awRahmen({...R,...zsVorschlagFenster(d,plz)}); }
  if(sk==="felder") return awRahmen({...R,...zsFelderFenster(d.zs,d.reihen,"awSubZu","Fertig")});
  if(sk==="apz") return awRahmen({...R,...zsApzFenster(d.zs)});
  if(sk==="hoehe") return awRahmen({...R,...zsHoeheFenster(d.zs)});
  if(sk==="nb") return awRahmen({...R,...zsNbFenster(d.zs)});
  if(sk==="zustand"&&d.art==="uv") return awRahmen({...R,frage:"Neu oder Bestand?",hinweis:"Bestand: Der Verteiler bleibt – Baujahr (wenn bekannt) und was erneuert wurde, trägst du danach auf der Karte ein. Material ist nur, was ihr erneuert.",
    inhalt:`<div class="aw-liste">${awKachel("awNeuW","neu",awSvg("uv"),"Neu setzen","Verteiler wird neu montiert",d.bestand===false)}${awKachel("awNeuW","bestand","","Bestand aufnehmen","Verteiler ist schon da und bleibt",d.bestand===true)}</div>`});
  if(sk==="zustand") return awRahmen({...R,frage:"Neu oder Bestand?",hinweis:"Bestand: Der Schrank bleibt – Pflichtpunkte für neue Zählerplätze zählen dann nicht als „fehlt“, Material ist nur, was ihr erneuert.",
    inhalt:`<div class="aw-liste">${awKachel("awNeuW","neu",awSvg("hv"),"Neu aufbauen","Zählerschrank wird neu gesetzt",d.bestand===false)}${awKachel("awNeuW","bestand","","Bestand aufnehmen","Schrank ist schon da und bleibt – z. B. nur Zuleitung oder Erdung neu",d.bestand===true)}</div>`});
  if(sk==="art") return awRahmen({...R,frage:"Was für ein Verteiler?",hinweis:"Antippen – es geht sofort weiter.",inhalt:`<div class="aw-liste">${AW_ART.map(([v,t,s])=>awKachel("awNeuW",v,awSvg(v),t,s,d.art===v)).join("")}</div>
    ${typeof qlDlg==="function"?`<div class="aw-schnell-l">Nur die Legende, schnell</div><div class="aw-liste">${awKachel("qlStart","",icon("vtListe"),"Schnell-Legende","Nr · Schutz · Bezeichnung abtippen wie in Word – ohne Reihen und Geräte",false)}${awKachel("qlStartWord","",icon("ecImport"),"Alte Word-Legende laden",".docx wählen – die Stromkreise werden übernommen und sind danach hier bearbeitbar",false)}</div>`:""}`});
  if(sk==="montage"&&d.art==="uv"){ const ft=nr=>{ const u=uvFotoUrl(nr); return u?`<img class="aw-foto" src="${esc(u)}" alt="" loading="lazy" onerror="this.remove()">`:awSvg("uv"); };
    return awRahmen({...R,frage:d.bestand?"Wie ist er montiert?":"Wie wird er montiert?",hinweis:"Antippen – es geht sofort weiter.",
      inhalt:`<div class="aw-liste">${awKachel("awNeuW","up",ft("VU24NC"),"Unterputz","in der gemauerten Wand",d.montage==="up")}${awKachel("awNeuW","hw",ft("VH24NC"),"Hohlwand","Trockenbau / Ständerwand",d.montage==="hw")}${awKachel("awNeuW","ap",ft("VA24CN"),"Aufputz","auf der Wand, z. B. im Keller",d.montage==="ap")}</div>`}); }
  if(sk==="montage") return awRahmen({...R,frage:"Wie ist er montiert?",inhalt:`<div class="aw-liste">${awKachel("awNeuW","up",awSvg("up"),"Unterputz","in der Wand oder Hohlwand",d.montage==="up")}${awKachel("awNeuW","ap",awSvg("ap"),"Aufputz","auf der Wand",d.montage==="ap")}</div>`});
  if(sk==="reihen") return awRahmen({...R,frage:d.art==="hv"?"Wie viele Reihen im Verteilerfeld?":"Wie viele Reihen?",hinweis:"12 Teilungseinheiten (TE) je Reihe – das ist der Normalfall.",
    inhalt:`<div class="aw-liste aw-2sp">${[1,2,3,4,5,6,7,9].map(n=>awKachel("awNeuW",n,awReihenSvg(Math.min(n,6)),`${n}-reihig`,`${n*12} TE`,d.reihen===n)).join("")}</div>`});
  if(sk==="modell"&&d.art==="uv") return awRahmen({...R,...uvModellFenster(d.montage,d.typFrei?"frei":d.reihen,"awNeuW",d.bestand)});
  if(sk==="namevon") return awRahmen({...R,...awNameVonFenster()});
  if(sk==="gwtyp"){ const ft=u=>`<img class="aw-foto" src="${esc(typeof bildLokal==="function"?bildLokal(u):u)}" alt="" loading="lazy" onerror="this.remove()">`, g=d.gw||{};
    const T=[["vector",ft(GW_MOD.vector[1].bild)],["univers",ft(GW_MOD.univers[1].bild)],["rittal",awSvg("gw")],...(d.bestand?[["alt",awSvg("gw")]]:[]),["frei",awSvg("uv")]];
    return awRahmen({...R,frage:d.bestand?"Was für ein Schrank ist da?":"Was für ein Schrank?",hinweis:"Antippen – es geht sofort weiter.",inhalt:`<div class="aw-liste">${T.map(([k,b])=>awKachel("awNeuW",k,b,GW_TYP[k][0],GW_TYP[k][1],g.typ===k)).join("")}</div>`}); }
  if(sk==="gwmodell") return awRahmen({...R,...gwModellFenster(d)});
  if(sk==="gwdaten") return awRahmen({...R,frage:"Daten zum Schrank",hinweis:"Alles optional – je mehr du angibst, desto genauer die Doku. Später auf der Karte änderbar.",inhalt:`<div class="fg1 gw-daten">${gwDatenHtml(d.gw)}</div>`,fuss:`<span style="flex:1"></span><button type="button" class="btn-filled" data-act="awGwWeiter">Weiter</button>`});
  if(sk==="ort"){ const k=kundeOf(AW.kid), ss=standorteVon(AW.kid);
    return awRahmen({...R,frage:"Wo steht der Verteiler?",inhalt:`<div class="aw-liste">${awKachel("awNeuW","k:"+k.id,"","Adresse des Kunden",adrText(k)||k.name,AW.ort==="k:"+k.id)}${ss.map(s=>awKachel("awNeuW",s.id,"",s.name||"Standort",[adrText(s)].filter(Boolean).join(""),AW.ort===s.id)).join("")}</div>`}); }
  if(sk==="name"){ const N=AW_NAMEN[d.art]||AW_NAMEN.uv;
    return awRahmen({...R,frage:"Wie heißt er?",hinweis:"So steht er in der Liste und auf der Legende.",
      inhalt:`<div class="aw-liste aw-2sp">${N.map(n=>awKachel("awNeuW",n,"",n,"",d.name===n)).join("")}</div>
        <div class="fg1 aw-eigen">${tf("awName","Eigener Name",N.includes(d.name)?"":d.name,{form:true,ph:"z. B. UV Anbau"})}</div>`,
      fuss:`<span style="flex:1"></span><button type="button" class="btn-filled" data-act="awNameOk">Weiter</button>`}); }
  if(sk==="von"){ const L=awVonListe(); if(d.vonVId===undefined){ const hv=L.filter(v=>v.art==="hv"); d.vonVId=hv.length===1?hv[0].id:L.length===1?L[0].id:null; }
    return awRahmen({...R,frage:"Woher kommt die Zuleitung?",hinweis:"Dann steht der Verteiler in der Anlage unter seiner Einspeisung, z. B. HV → UV EG.",
      inhalt:`<div class="aw-liste">${L.map(v=>awKachel("awNeuW",v.id,awSvg(v.art==="hv"?"hv":"uv"),v.name||"Verteiler",v.art==="hv"?"Zählerschrank / HV":v.art==="gw"?"Gewerbe / Standverteiler":"Unterverteiler",d.vonVId===v.id)).join("")}${awKachel("awNeuW","-","","Direkt vom Hausanschluss","oder weiß ich noch nicht",d.vonVId==="")}</div>`}); }
  if(sk==="netz") return awRahmen({...R,frage:"Welche Netzform?",inhalt:`<div class="aw-liste">${AW_NETZ.map(([v,t,s])=>awKachel("awNeuW",v,"",t,s,d.netz===v)).join("")}</div>`}); }
/* Modell-Kacheln Hager volta (auch für „Modell wechseln“ auf der Karte) */
function uvModellFenster(mo,akt,act,bestand){ mo=mo||"up";
  const karte=n=>{ const nr=uvNr(mo,n), u=uvFotoUrl(nr), M=uvMasse({reihen:n,montage:mo,teReihe:12});
    return `<button type="button" class="aw-g zs-mod" data-act="${act}" data-v="${n}" data-mo="${mo}"${+akt===n?' aria-pressed="true"':""}><span class="aw-gb zs-mod-svg">${u?`<img class="zs-mod-gross" src="${esc(u)}" alt="" loading="lazy" onerror="this.remove()">`:awSvg("uv")}</span><b>volta ${n}-reihig</b><small>${n*12} TE · ${String(M.H).replace(".",",")} × ${M.W} mm</small><small class="zs-mod-nr">Hager ${nr}</small></button>`; };
  return {frage:bestand?"Welcher Verteiler hängt da?":"Welcher Verteiler?",hinweis:`Hager volta · ${uvMontText(mo)}. Antippen übernimmt Reihen, TE und Maße.`,
    inhalt:`<div class="aw-lbl">Hager volta ${uvMontText(mo)}</div><div class="aw-grid">${[1,2,3,4,5].map(karte).join("")}</div>
      <div class="aw-lbl">Anderes Fabrikat</div><div class="aw-liste">${awKachel(act,"frei","",bestand?"Anderer / weiß nicht":"Anderer Verteiler","Reihen und TE je Reihe selbst angeben",akt==="frei")}</div>`}; }
/* Name, Einspeisung und Netzform auf einer Seite – Netzform kommt von der Einspeisung */
function awNameVonFenster(){ const d=AW.d, N=AW_NAMEN[d.art]||AW_NAMEN.uv, L=awVonListe();
  if(d.vonVId===undefined){ const hv=L.filter(v=>v.art==="hv"); d.vonVId=hv.length===1?hv[0].id:L.length===1?L[0].id:""; const q=L.find(x=>x.id===d.vonVId); if(q&&q.netz&&d.netz==null) d.netz=q.netz; }
  if(!d.name) d.name=N[0];
  const q=L.find(x=>x.id===d.vonVId), netzVon=q&&q.netz;
  return {frage:"Name und Einspeisung",hinweis:netzVon?"Die Netzform kommt vom speisenden Verteiler.":"So steht er in der Liste und auf der Legende.",
    inhalt:`<div class="vti-chips aw-nv-namen">${N.map(n=>`<button type="button" class="chip" data-act="awNvName" data-v="${esc(n)}" aria-pressed="${d.name===n}">${esc(n)}</button>`).join("")}</div>
      <div class="fg1 aw-eigen">${tf("awName","Name des Verteilers",d.name||"",{form:true,ph:"z. B. UV Anbau"})}</div>
      ${L.length?`<div class="aw-lbl">Gespeist aus</div><div class="aw-liste">${L.map(v=>awKachel("awNvVon",v.id,awSvg(v.art==="hv"?"hv":"uv"),v.name||"Verteiler",[v.art==="hv"?"Zählerschrank / HV":v.art==="gw"?"Gewerbe / Standverteiler":"Unterverteiler",v.netz&&v.netz.split(" |")[0]].filter(Boolean).join(" · "),d.vonVId===v.id)).join("")}${awKachel("awNvVon","-","","Direkt vom Hausanschluss","oder weiß ich noch nicht",d.vonVId==="")}</div>`:""}
      ${netzVon?"":`<div class="aw-lbl">Netzform</div><div class="vti-chips">${AW_NETZ.map(([v,t])=>`<button type="button" class="chip" data-act="awNvNetz" data-v="${esc(v)}" aria-pressed="${(d.netz||"")===v&&d.netz!=null}">${esc(t)}</button>`).join("")}</div>`}`,
    fuss:`<span style="flex:1"></span><button type="button" class="btn-filled" data-act="awNvOk">Anlegen</button>`}; }
function awNeuWahl(v){ const S=awNeuSchritte(), sk=AW.sub||S[AW.i], d=AW.d;
  if(sk==="art"){ if(d.art!==v){ d.zs=null; if(v==="uv"&&d.gerHerst==null) d.gerHerst="Hager"; if(v==="hv"){ Object.assign(d,{bedarf:zsBedarfStd(),montage:"up",name:"HV",netz:"TN-C-S | 230/400 V",hersteller:d.hersteller||"hager"}); if(d.gerHerst==null) d.gerHerst="Hager"; } } d.art=v; }
  else if(sk==="zustand") d.bestand=v==="bestand";
  else if(sk==="gwtyp"){ const alt=d.gw||{}; d.gw=alt.typ===v?alt:{typ:v,...(v==="alt"?{hersteller:"Schneider / ABN"}:{})}; }
  else if(sk==="modell"&&d.art==="uv"){ if(v==="frei"){ d.typFrei=true; d.reihen=d.reihen||3; } else { d.typFrei=false; d.reihen=+v; d.teReihe=12; } }
  else if(sk==="hersteller"){ d.hersteller=v; if(d.zs) d.zs.hersteller=v; if(d.gerHerst==null) d.gerHerst=v==="hager"?"Hager":v==="sj"?"ABB":null; }
  else if(sk==="geraete") d.gerHerst=v;
  else if(sk==="montage") d.montage=v; else if(sk==="reihen") d.reihen=+v; else if(sk==="ort"){ AW.ort=v; if(d.zs&&d.nbAuto){ zsNbSetzen(d.zs,null); d.nbAuto=false; } } else if(sk==="name") d.name=v; else if(sk==="netz") d.netz=v;
  else if(sk==="von"){ d.vonVId=v==="-"?"":v; const q=awVonListe().find(x=>x.id===d.vonVId); if(q&&q.netz&&d.netz==null) d.netz=q.netz; }
  if(AW.sub){ AW.sub=null; awNeuZeigen(); return; }
  if(AW.i<S.length-1){ AW.i++; awNeuZeigen(); } else awNeuAnlegen(); }
function awNeuAnlegen(){ const d=AW.d, wer=(n=>legTeam().includes(n)?n:"")(ME.name||(META.profil&&META.profil.name)||""), extra={art:d.art,...(d.gerHerst?{gerHerst:d.gerHerst}:{}),montage:d.montage,reihen:d.art==="hv"&&d.zs&&+d.zs.hoehe?zsReihenSumme(d.zs,0):(d.reihen||(d.art==="hv"?5:3)),teReihe:12,...(d.art==="uv"&&d.typFrei?{typFrei:true}:{}),...((d.art==="uv"||d.art==="gw")&&d.bestand?{bst:{bestand:true}}:{}),...(d.art==="gw"&&d.gw?{gw:Object.fromEntries(Object.entries(d.gw).filter(([k,v])=>v!==""&&v!=null&&k!=="frei"))}:{}),...(d.art==="hv"&&d.zs?{zs:Object.assign(zsAbgleich(d.zs),d.bestand?{bestand:true}:{})}:{})};
  if(AW.kid){ const g=ecGeb(AW.ort||"k:"+AW.kid), id=uid();
    g.verteiler.push({id,name:d.name||"Verteiler",netz:d.netz||"",stand:ecHeute(),ersteller:wer,...extra,...(d.vonVId&&g.verteiler.some(x=>x.id===d.vonVId)?{vonVId:d.vonVId}:{})}); ecGebSpeichern(g);
    AW=null; $("#dlg").classList.remove("aw"); closeOverlays(); go({v:"vt",g:g.id,id}); }
  else { const L={id:uid(),titel:d.name||"Verteiler",kunde:"",anschrift:"",kundeId:"",standortId:"",ortId:"",netz:d.netz||"",ersteller:wer,stand:ecHeute(),eintraege:[],...extra};
    saveRec("legenden",L,true); AW=null; $("#dlg").classList.remove("aw"); closeOverlays(); go({v:"legende",id:L.id}); }
  setTimeout(()=>{ awGeraetStart(); if(AW) { AW.zuletzt="Verteiler angelegt – jetzt die Geräte einsetzen"; awKatalog(); } },250); }

/* ---------- Gerät einsetzen ---------- */
const awGeraete=()=>{ const F=matFirma(), da=new Set(F.map(m=>matHnr(m.herstellerNr))); return F.concat(MAT_KAT_EXTRA.filter(m=>!da.has(matHnr(m.herstellerNr)))).filter(m=>{ const t=matTech(m); return t&&(m.kategorie==="schutz"||t.art==="ge"); }); };
function awName(t){ return t.art==="ge"?t.name:t.art==="rcd"?`RCD ${t.in} A / ${t.idn} mA`:t.art==="rcbo"?`FI/LS ${t.char||""}${t.in}`:`LS ${t.char||""}${t.in} ${t.pole}-polig`; }
function awUnter(m){ const t=matTech(m); return [t.art==="rcd"||t.art==="rcbo"?`${t.art==="rcbo"?t.idn+" mA ":""}Typ ${t.typ||"A"}`:"",`${t.te} TE`,t.art==="ls"&&matSerie(m)?`${matSerie(m)[1]} · ${m.herstellerNr}`:[m.hersteller==="Schneider Electric"?"Schneider":m.hersteller,m.herstellerNr].filter(Boolean).join(" ")].filter(Boolean).join(" · "); }
const awSchutz=t=>t.art==="rcd"?`${t.in} A / ${t.idn} mA Typ ${t.typ||"A"}`:t.art==="rcbo"?`${t.char||""}${t.in} FI/LS ${t.idn} mA Typ ${t.typ||"A"}`:`${t.char||""}${t.in}`;
function awNutzung(){ const z={}; const zaehl=x=>{ if(x&&x.mat) z[x.mat]=(z[x.mat]||0)+1; };
  live("gebaeude").forEach(g=>{ (g.rcds||[]).forEach(zaehl); (g.stromkreise||[]).forEach(zaehl); }); live("legenden").forEach(L=>legE(L).forEach(zaehl)); return z; }
/* Belegung: letzte Reihe und freie TE */
function awBelegung(L){ const n=+L.teReihe||12, R=legReihen(L), r=R.length||1, te=R.length?R[R.length-1].te:0; return {n,r,frei:n-te,reihen:+L.reihen||0}; }
function awBelegText(L){ const b=awBelegung(L); if(!legE(L).length) return `${b.reihen?b.reihen+"-reihig · ":""}noch leer`; return `Reihe ${b.r} · ${b.frei} von ${b.n} TE frei`; }
/* Kennzeichnung für das nächste Gerät */
/* Einsetzposition (Max 18.11.2026): „Stromkreis an -F2“ setzt hinter den letzten Kreis dieses RCD ein (AW.nach = Index), sonst hinten anhängen */
const awEinfuegen=()=>typeof AW!=="undefined"&&AW&&AW.nach!=null;
function awPos(L){ const E=legE(L); return awEinfuegen()?Math.min(AW.nach,E.length-1):E.length-1; }
function awKz(L,art){ const E=legE(L), p=awPos(L);
  if(art==="rcd"){ if(!E.length) return {kz:"F 1.0",umbruch:false}; const neu=!awEinfuegen()&&awBelegung(L).frei<4; return {kz:legRcdKz(E,p,neu),umbruch:neu}; }
  const kz=legNaechsteKz(E,p); if(kz) return {kz,umbruch:false};
  return {kz:`F ${awBelegung(L).r}.${E.filter(e=>e.art!=="gr").length+1}`,umbruch:false}; }
const awRcdVor=L=>{ const E=legE(L); for(let i=awPos(L);i>=0;i--){ if(E[i].art==="gr") return null; if(E[i].art==="rcd") return E[i]; } return null; };
function awGeraetStart(opt){ const L=legAkt(); if(!L||L.fertig) return; const E=legE(L); opt=opt||{};
  AW={typ:"geraet",nach:opt.nach!=null?opt.nach:null,tab:opt.tab||(E.some(e=>e.art==="rcd")?"ls":"reihe"),serie:(typeof META!=="undefined"&&META.lsSerie)||"",such:"",letzt:null,zuletzt:"",m:null,was:"",raum:"",bez:"",bezHand:false,mehr:false,
    herst:(typeof META!=="undefined"&&META.awHerst)||"",gruppe:"",lim:60,sel:null,anz:1,busy:false};
  awKatalog(); }
/* Einsetzen in der Arbeitsfläche am PC (legende.js): derselbe Zustand, aber in der rechten Leiste statt im Fenster */
function awPanelStart(L,nach,tab){ const E=legE(L);
  AW={typ:"geraet",panel:true,nach:nach!=null&&nach>=0?nach:null,tab:tab||(E.some(e=>e.art==="rcd")?"ls":"reihe"),serie:(typeof META!=="undefined"&&META.lsSerie)||"",such:"",letzt:null,zuletzt:"",m:null,was:"",raum:"",bez:"",bezHand:false,mehr:false,
    herst:(typeof META!=="undefined"&&META.awHerst)||"",gruppe:"",lim:60,sel:null,anz:1,busy:false}; }
function awKatalog(){ if(AW&&AW.panel){ render(); setTimeout(awWahlZeigen,0); return; } const L=legAkt(); if(!L){ awZu(); return; } AW.m=null;
  $("#dlg").classList.add("aw");
  awRahmen({titel:L.titel||"Verteiler",unter:awBelegText(L),inhalt:`<div class="aw-such"><span class="aw-lupe">${icon("search")}</span><input id="awSuch" type="search" placeholder="${AW.tab==="kat"?"Hersteller, Gerät, Artikelnummer …":"B16, RCD, Typ A …"}" value="${esc(AW.such)}" autocomplete="off"></div>
      ${awEinfuegen()?`<div class="aw-pos"><span>Wird eingesetzt nach <b>${esc((legE(L)[awPos(L)]||{}).kz||"")}</b></span><button type="button" class="btn-text" data-act="awFrei">Ohne Produkt eintragen</button></div>`:""}
      ${awBelegtLeiste(L)}
      <div class="aw-tabs" role="group">${AW_TABS.filter(([k])=>!(awEinfuegen()&&k==="reihe")).map(([k,t])=>`<button type="button" data-act="awTab" data-v="${k}" aria-pressed="${AW.tab===k}">${t}</button>`).join("")}</div>
      <div id="awFilter">${awFilterHtml()}</div><div id="awGrid">${awGrid()}</div>`,
    fuss:`<button type="button" class="aw-fragen" data-act="awFragen" aria-pressed="${awFragen()}" title="Gilt beim Einsetzen eines einzelnen Automaten">Wofür gleich fragen</button><span class="aw-fuss-info">${esc(AW.zuletzt||(legE(L).length?`${legE(L).filter(e=>e.art!=="gr").length} Geräte im Verteiler`:""))}</span><button type="button" class="btn-tonal" data-act="awZu">${legE(L).length?"Fertig":"Später bestücken"}</button>`});
  const z=$("#dlg .aw-zur"); if(z) z.hidden=true;
  const fu=$("#dlg .aw-fuss"); if(fu){ const w=document.createElement("div"); w.id="awWahl"; w.className="aw-wahlb"; fu.before(w); awWahlZeigen(); } }
/* ===== Bestücken mit Herstellerfilter, Katalog-Tab und Mehrfachauswahl (Max 28.11.2026) =====
   Ein Fenster für alles: Artikel aus unserer Materialliste (Reihen, Automaten, RCD, FI/LS, Sonstiges) und alle Geräte aus dem Gerätekatalog.
   Antippen wählt ein Gerät aus, jedes weitere Antippen derselben Kachel zählt hoch. Unten steht die Auswahl mit Anzahl (− / +) und „Einsetzen“.
   Wofür-Frage nur bei genau einem Automaten; mehrere bekommen „?“ und werden später in der Legende benannt. */
const AW_TABS=[["reihe","Reihen"],["ls","Automaten"],["rcd","RCD"],["rcbo","FI/LS"],["sonst","Sonstiges"],["kat","Katalog"]];
const awHerstKurz=h=>h==="Schneider Electric"?"Schneider":h;
const awKatDa=()=>typeof GK_INDEX!=="undefined"&&GK_INDEX.length>0;
function awFilterHtml(){ const kat=AW.tab==="kat", chip=(act,v,t,an)=>`<button type="button" data-act="${act}" data-v="${esc(v)}" aria-pressed="${!!an}">${esc(t)}</button>`;
  let H=["Hager","Schneider Electric"], mehr=[];
  if(kat&&awKatDa()){ H=GK_HERST.slice(0,8); mehr=GK_HERST.slice(8); if(AW.herst&&!H.includes(AW.herst)&&!mehr.includes(AW.herst)) AW.herst=""; }
  else if(AW.herst&&!H.includes(AW.herst)) H=[...H,AW.herst];
  let o=`<div class="aw-serie aw-herst" role="group" aria-label="Hersteller">${chip("awHerst","","Alle Hersteller",!AW.herst)}${H.map(h=>chip("awHerst",h,awHerstKurz(h),AW.herst===h)).join("")}`
    +(mehr.length?`<label class="aw-mehrh${mehr.includes(AW.herst)?" an":""}"><select id="awHerstMehr" aria-label="Weitere Hersteller"><option value="">Weitere …</option>${mehr.map(h=>`<option value="${esc(h)}"${AW.herst===h?" selected":""}>${esc(h)}</option>`).join("")}</select></label>`:"")+`</div>`;
  if(kat&&awKatDa()) o+=`<div class="aw-serie" role="group" aria-label="Gerätegruppe">${chip("awGruppe","","Alle Gruppen",!AW.gruppe)}${GK_GRUPPEN.map(g=>chip("awGruppe",g,g,AW.gruppe===g)).join("")}</div>`;
  return o+awSerieChips(); }
const awHtml=(el,h)=>{ if(!el) return; if(AW&&AW.panel&&typeof legMorphHtml==="function") legMorphHtml(el,h); else el.innerHTML=h; };   /* in der Arbeitsfläche ohne Flackern */
function awFilterNeu(){ awHtml(document.getElementById("awFilter"),awFilterHtml()); awHtml(document.getElementById("awGrid"),awGrid()); awWahlZeigen(); }
/* Kachelbild eines Artikels: Katalogbild nur bei genauer Übereinstimmung, sonst das bisherige Bild */
function awMatBild(m,t){ const a=typeof gkMatAsset==="function"&&gkMatAsset(matHnr(m.herstellerNr));
  return a?`<span class="mat-foto aw-gb aw-kat"><img src="${esc(gkBildURL(a))}"${gkAnpAttr(a)} alt="" loading="lazy" onerror="this.parentNode.classList.add('weg')"></span>`:(matFoto(m,"aw-gb")||awOhneFoto(t,m)); }
const awIstSel=(k,v)=>!!AW.sel&&AW.sel.k===k&&AW.sel.v===v;
const awSelBadge=(k,v)=>awIstSel(k,v)?`<span class="aw-selz">${AW.anz}×</span>`:"";
const AW_SONST_ANZ={res:["Leerplatz","unbestückt · 1 TE",1],kln:["N-Klemme Pollmann N 14-S","1 TE, hochkant",1],klpe:["PE-Klemme Pollmann PE 14-S","1 TE, hochkant",1],kla:["Abzweigklemme Pollmann A 14-S","1 TE, hochkant",1]};
function awKatGrid(){ if(!awKatDa()) return `<p class="aw-leer">Der Gerätekatalog ist in dieser App nicht verfügbar.</p>`;
  const L=legAkt(), A=gkAwListe(AW.such,AW.herst,AW.gruppe), S=A.slice(0,AW.lim);
  const fehlt=typeof BSP!=="undefined"&&BSP.liste&&typeof gkImSp==="function"&&!gkImSp();
  if(!A.length) return `<p class="aw-leer">Nichts gefunden${AW.herst?` von ${esc(awHerstKurz(AW.herst))}`:""}. Filter oder Suche ändern.</p>`;
  return `${fehlt?`<p class="meta gk-fehlt">Die Gerätebilder liegen noch nicht im SharePoint. Der Entwickler lädt sie einmal hoch: Einstellungen › Labor › „Gerätekatalog-Bilder“.</p>`:""}<p class="aw-zahl">${A.length.toLocaleString("de-DE")} Geräte${A.length>S.length?` · ${S.length} angezeigt`:""}</p>
    <div class="aw-grid">${S.map(a=>{ const tl=String(a.category||"").split(" - ")[1]||"", p=a.params||{}, kurz=[p.curve&&p.amperage?p.curve+p.amperage:p.amperage?p.amperage+" A":"",p.residualCurrent?p.residualCurrent+" mA":"",p.poles||""].filter(Boolean).join(" · ");
      return `<button type="button" class="aw-g${awIstSel("kat",a.id)?" an":""}" data-act="awSel" data-k="kat" data-v="${a.id}"><span class="mat-foto aw-gb aw-kat"><img src="${esc(gkURL(a))}" alt="" loading="lazy" onerror="this.parentNode.classList.add('weg')"></span><b>${esc(awHerstKurz(a.manufacturer))} ${esc(a.model)}</b><small>${esc([gkDe(tl),kurz].filter(Boolean).join(" · "))}</small><small>${esc(gkTeText(a.dimension.width,L))} · ${esc(gkZahl(a.dimension.width))} mm</small>${awSelBadge("kat",a.id)}</button>`; }).join("")}</div>
    ${A.length>S.length?`<button type="button" class="btn-tonal aw-weiter" data-act="awKatMehr">Weitere ${Math.min(60,A.length-S.length)} anzeigen</button>`:""}`; }
/* Auswahl-Leiste über dem Fuß */
function awSelInfo(){ const sel=AW&&AW.sel; if(!sel) return null; const L=legAkt();
  if(sel.k==="mat"){ const m=awGeraete().find(x=>matHnr(x.herstellerNr)===sel.v); if(!m) return null; const t=matTech(m); return {bild:awMatBild(m,t),t:awName(t),s:awUnter(m),te:+t.te||1}; }
  if(sel.k==="kat"){ const a=typeof GK_MAP!=="undefined"&&GK_MAP.get(sel.v); if(!a) return null; return {bild:`<span class="mat-foto aw-gb aw-kat"><img src="${esc(gkURL(a))}" alt=""></span>`,t:`${awHerstKurz(a.manufacturer)} ${a.model}`,s:gkTeText(a.dimension.width,L),te:a.dimension.width/gkPitch(L)}; }
  const x=AW_SONST_ANZ[sel.v]; return x?{bild:`<span class="aw-gb aw-g-icb">${awSvg(sel.v)}</span>`,t:x[0],s:x[1],te:x[2]}:null; }
function awWahlZeigen(){ const w=document.getElementById("awWahl"); if(!w) return; const i=awSelInfo(); if(!i){ w.hidden=true; w.innerHTML=""; return; }
  const n=AW.anz, te=Math.round(i.te*n*10)/10, b=L=>awBelegung(L).frei, L=legAkt(), frei=L?b(L):0;
  w.hidden=false;
  awHtml(w,`<div class="aw-wb-bild">${i.bild}</div><div class="aw-wb-t"><b>${esc(i.t)}</b><small>${esc(i.s)}${n>1?` · zusammen ${String(te).replace(".",",")} TE`:""}${L&&te>frei+1e-6&&frei>0?` · Reihe hat noch ${frei} TE, Rest geht in die nächste`:""}</small></div>
    <div class="aw-step" role="group" aria-label="Anzahl"><button type="button" data-act="awAnz" data-d="-1" aria-label="Eins weniger"${n<=1?" disabled":""}>−</button><b aria-live="polite">${n}</b><button type="button" data-act="awAnz" data-d="1" aria-label="Eins mehr"${n>=24?" disabled":""}>+</button></div>
    <div class="aw-wb-ak"><button type="button" class="btn-text" data-act="awSelWeg">Abbrechen</button><button type="button" class="btn-filled" data-act="awRein"${AW.busy?" disabled":""}>${n>1?`${n}× einsetzen`:"Einsetzen"}</button></div>`); }
function awSel(k,v){ if(awIstSel(k,v)) AW.anz=Math.min(24,AW.anz+1); else { AW.sel={k,v}; AW.anz=1; }
  awHtml(document.getElementById("awGrid"),awGrid()); awWahlZeigen(); }
async function awRein(){ const sel=AW&&AW.sel, L=legAkt(); if(!sel||!L||AW.busy) return; const n=Math.max(1,Math.min(24,AW.anz|0));
  if(sel.k==="kat"){ AW.busy=true; awWahlZeigen();
    try{ await gkAwEinsetzen(sel.v,n); const a=GK_MAP.get(sel.v); if(!AW) return; AW.zuletzt=`${n}× ${awHerstKurz(a.manufacturer)} ${a.model} eingesetzt`; AW.sel=null; AW.anz=1; }
    catch(err){ toast(err.message); }
    finally{ if(AW){ AW.busy=false; awKatalog(); } } return; }
  if(sel.k==="sonst"){ AW.sel=null; AW.anz=1; for(let i=0;i<n;i++) awSonst(sel.v,true); AW.zuletzt=`${n}× ${AW_SONST_ANZ[sel.v][0]} eingesetzt`; awKatalog(); return; }
  AW.sel=null; AW.anz=1; awGeraetWahl(sel.v,n); }
/* Belegt-Leiste (Max 27.11.2026): beim Bestücken immer sehen, was schon auf der Hutschiene sitzt – die aktuelle Reihe als
   Mini-Schiene (Breite nach TE, freie Plätze gestrichelt), dazu Zahlen: Reihe, TE belegt, Automaten am RCD, Geräte gesamt */
function awKurz(e){ if(e.art==="rcd") return "RCD"; if(e.art==="res") return "Res"; if(e.art==="kl") return {n:"N",pe:"PE",a:"A"}[e.farbe]||"Kl";
  if(e.art==="ge") return e.kz||"Ger"; const s=String(e.schutz||"").match(/[BCDK]\s*\d+/i); return s?s[0].replace(/\s+/g,"").toUpperCase():(e.kz||"").replace(/^F\s*/,"")||"LS"; }
function awBelegtLeiste(L){ const E=legE(L); if(!E.filter(e=>e.art!=="gr").length) return "";
  const n=+L.teReihe||12, R=legReihen(L), p=awPos(L); let ri=R.findIndex(r=>r.g.some(([,i])=>i===p)); if(ri<0) ri=R.length-1; const r=R[ri];
  const rcd=awRcdVor(L); let anRcd=0; if(rcd){ for(let i=E.indexOf(rcd)+1;i<E.length;i++){ const e=E[i]; if(e.art==="rcd"||e.art==="gr") break; if(e.art==="sk") anRcd++; } }
  const ges=E.filter(e=>e.art==="sk").length, frei=n-r.te;
  const bl=r.g.map(([e,i,w])=>`<span class="aw-bl b-${e.art}${e.art==="kl"?" kl-"+(e.farbe||""):""}${i===p&&awEinfuegen()?" hier":""}" style="flex:${w} 0 0">${esc(awKurz(e))}</span>`).join("")+(frei>0?`<span class="aw-bl frei" style="flex:${frei} 0 0" aria-label="${frei} TE frei"></span>`:"");
  return `<div class="aw-belegt"><div class="aw-bz"><b>Reihe ${ri+1}</b><span>${r.te} von ${n} TE belegt</span>${rcd?`<span>an ${esc(rcd.kz||"RCD")}: <b>${anRcd}</b> ${anRcd===1?"Automat":"Automaten"}</span>`:""}<span>gesamt <b>${ges}</b> ${ges===1?"Automat":"Automaten"}</span></div><div class="aw-schiene">${bl}</div></div>`; }
/* Wie oft steckt dieses Produkt schon im Verteiler? */
function awAnzahl(L,hnr){ return L?legE(L).filter(e=>e.mat===hnr).length:0; }
const awAnzBadge=(L,hnr)=>{ const n=awAnzahl(L,hnr); return n?`<span class="aw-anz" title="${n}× schon im Verteiler" aria-label="${n}× schon im Verteiler">${n}×</span>`:""; };
/* Platzhalter, solange kein Herstellerfoto da ist: schlichter Automat mit der richtigen Polzahl */
function awOhneFoto(t,m){ const p=Math.max(1,Math.min(4,+t.pole||1)), w=14, x0=24-p*w/2, sch=/^R9F/.test(matHnr(m.herstellerNr))?"#3DCD58":/^A9F/.test(matHnr(m.herstellerNr))?"#3DCD58":"#2F6FD1";
  return `<span class="mat-foto aw-gb"><svg viewBox="0 0 48 48" style="width:62%;height:62%" aria-hidden="true">${Array.from({length:p},(_,k)=>{ const x=x0+k*w; return `<rect x="${x+.5}" y="6" width="${w-1}" height="36" rx="2" fill="#F1F2F4" stroke="#C3C7CC" stroke-width=".8"/><rect x="${x+4}" y="17" width="${w-8}" height="10" rx="1.5" fill="#3A3F45"/><rect x="${x+2}" y="31" width="${w-4}" height="2.5" rx="1" fill="${sch}"/>`; }).join("")}</svg></span>`; }
/* Ganze Reihen mit einem Tipp – Kennzeichnung läuft nach dem Schema der Legende (RCD, dann seine Automaten, dann der nächste RCD) */
const AW_REIHEN=[["r6kl","RCD + 6 × B16 + N/PE-Klemme","RCD 40 A/30 mA · 6 × B16 · N 14-S · PE 14-S · 12 TE",[["rcd"],["ls",6],["kl","n"],["kl","pe"]]],
  ["r8","RCD + 8 × B16","RCD 40 A/30 mA · 8 × B16 · 12 TE",[["rcd"],["ls",8]]],
  ["r6","6 × B16 + N/PE-Klemme","ohne RCD · 8 TE",[["ls",6],["kl","n"],["kl","pe"]]]];
function awReiheSvg(teile){ const T=[]; teile.forEach(([a,n])=>{ if(a==="rcd") T.push(["rcd",4]); else if(a==="ls") for(let i=0;i<n;i++) T.push(["ls",1]); else T.push([n,1]); });
  const W=T.reduce((s,x)=>s+x[1],0), u=44/Math.max(12,W); let x=2;
  return `<svg viewBox="0 0 48 30" style="width:90%;height:auto" aria-hidden="true"><rect x="0" y="13" width="48" height="4" rx="1" fill="#C3C7CC"/>${T.map(([a,w])=>{ const X=x, b=w*u-.6; x+=w*u;
    const f=a==="rcd"?"#E9ECF2":a==="n"?"#2F8FE0":a==="pe"?"#7CC242":"#F4F5F7";
    return `<rect x="${X.toFixed(2)}" y="${a==="n"||a==="pe"?3:6}" width="${b.toFixed(2)}" height="${a==="n"||a==="pe"?24:18}" rx=".8" fill="${f}" stroke="#AEB3B9" stroke-width=".3"/>${a==="rcd"||a==="ls"?`<rect x="${(X+b/2-.9).toFixed(2)}" y="11" width="1.8" height="5" rx=".4" fill="#3A3F45"/>`:""}${a==="rcd"?`<rect x="${(X+1).toFixed(2)}" y="19" width="${(b-2).toFixed(2)}" height="1.6" fill="#2F6FD1"/>`:""}`; }).join("")}</svg>`; }
function awSerieStd(L){ if(AW&&AW.serie) return AW.serie; if(META.lsSerie) return META.lsSerie; return L&&/schneider/i.test(L.gerHerst||"")?"ic60":"hqc"; }
function awReiheGeraete(L){ const se=awSerieStd(L), G=awGeraete(), schn=se==="ic60"||se==="resi";
  const ls=G.find(m=>{ const t=matTech(m); return t.art==="ls"&&t.char==="B"&&+t.in===16&&+t.pole===1&&(matSerie(m)||[])[0]===se; })||G.find(m=>{ const t=matTech(m); return t.art==="ls"&&t.char==="B"&&+t.in===16&&+t.pole===1; });
  /* RCD passend zur Serie: Hager Schraube → CDA, sonst QuickConnect (CDS) bzw. Schneider */
  const rcd=(se==="hsch"&&G.find(m=>matTech(m).art==="rcd"&&+matTech(m).in===40&&/^CDA/.test(matHnr(m.herstellerNr))))
    ||G.find(m=>{ const t=matTech(m); return t.art==="rcd"&&+t.in===40&&(schn?m.hersteller==="Schneider Electric":m.hersteller==="Hager")&&!(se!=="hsch"&&/^CDA/.test(matHnr(m.herstellerNr))); })||G.find(m=>matTech(m).art==="rcd");
  return {ls,rcd}; }
function awReihe(k){ const L=legAkt(), V=AW_REIHEN.find(x=>x[0]===k); if(!L||!V) return; const E=legE(L), {ls,rcd}=awReiheGeraete(L); let erst="", letzt="";
  V[3].forEach(([a,n])=>{ if(a==="rcd"&&rcd){ const t=matTech(rcd), kz=awKz(L,"rcd"); E.push({id:uid(),art:"rcd",kz:kz.kz,bez:"Fehlerstromschutzschalter",schutz:awSchutz(t),pole:1,te:t.te,mat:matHnr(rcd.herstellerNr),...(kz.umbruch?{umbruch:true}:{})}); erst=erst||kz.kz; letzt=kz.kz; }
    if(a==="ls"&&ls){ const t=matTech(ls); for(let i=0;i<n;i++){ const kz=awKz(L,"sk"); E.push({id:uid(),art:"sk",kz:kz.kz,bez:"?",schutz:awSchutz(t),pole:1,te:t.te,mat:matHnr(ls.herstellerNr)}); erst=erst||kz.kz; letzt=kz.kz; } }
    if(a==="kl") E.push({id:uid(),art:"kl",farbe:n,kz:"",bez:n==="pe"?"PE 14-S":"N 14-S",schutz:"",pole:1,te:1}); });
  legSpeichern(L); render(); AW.zuletzt=`Reihe eingesetzt: ${erst}${letzt&&letzt!==erst?" bis "+letzt:""}`; AW.tab="reihe"; awKatalog(); }
/* Serie der Automaten: Hager QuickConnect / Schraube, Schneider iC60 / Resi9 – wird je Gerät gemerkt */
function awSerieChips(){ if((AW.tab!=="ls"&&AW.tab!=="reihe")||AW.such.trim()) return ""; if(AW.serie==null) AW.serie=(META.lsSerie||"");
  const SE=MAT_SERIEN.filter(x=>!AW.herst||(AW.herst==="Hager"?/^h/.test(x[0]):AW.herst==="Schneider Electric"?!/^h/.test(x[0]):false)); if(AW.herst&&!SE.length) return ""; if(AW.serie&&!SE.some(x=>x[0]===AW.serie)) AW.serie="";
  return `<div class="aw-serie" role="group" aria-label="Serie">${[["","Alle Serien"],...SE.map(x=>[x[0],x[1]])].map(([k,t])=>`<button type="button" data-act="awSerie" data-v="${k}" aria-pressed="${AW.serie===k}">${t}</button>`).join("")}</div>`; }
function awGrid(){ if(AW.tab==="kat") return awKatGrid(); const q=AW.such.trim().toLowerCase(), z=awNutzung(), L=legAkt(), E=L?legE(L):[];
  const herst=(()=>{ for(let i=E.length-1;i>=0;i--){ const m=E[i].mat&&awGeraete().find(x=>matHnr(x.herstellerNr)===E[i].mat); if(m) return m.hersteller; } return ""; })();
  if(!q&&AW.tab==="reihe"){ const {ls,rcd}=awReiheGeraete(L);
    return `<p class="aw-hinweis">Setzt die ganze Reihe ein – Kennzeichnung läuft automatisch weiter, „Wofür“ trägst du später in der Legende ein. Automaten: ${esc(ls?`${(matSerie(ls)||[,""])[1]} ${ls.herstellerNr}`:"–")}${rcd?` · RCD ${esc(rcd.herstellerNr)}`:""}</p>
      <div class="aw-grid">${nav.v==="vt"?`<button type="button" class="aw-g aw-liste-k" data-act="vtImpHier"><span class="mat-foto aw-gb"><svg viewBox="0 0 48 48" style="width:56%;height:56%" aria-hidden="true"><path fill="currentColor" d="M8 12h22v4H8zm0 10h22v4H8zm0 10h14v4H8zm28-2v-6h4v6h6v4h-6v6h-4v-6h-6v-4z"/></svg></span><b>Liste einfügen</b><small>Papierliste, Excel oder Datei – alle Geräte auf einmal</small></button>`:""}${AW_REIHEN.map(([k,t,u,teile])=>`<button type="button" class="aw-g" data-act="awReihe" data-v="${k}"><span class="mat-foto aw-gb">${awReiheSvg(teile)}</span><b>${t}</b><small>${u}</small></button>`).join("")}</div>`; }
  if(!q&&AW.tab==="sonst"){ const klB=k=>{ const a=typeof gkFuerEintrag==="function"&&gkFuerEintrag({art:"kl",farbe:{kln:"n",klpe:"pe",kla:"a"}[k]}); return a?`<span class="mat-foto aw-gb aw-kat"><img src="${esc(gkURL(a))}" alt="" loading="lazy"></span>`:`<span class="aw-gb">${awSvg(k)}</span>`; };
    const GE=awGeraete().filter(m=>matTech(m).art==="ge"&&(!AW.herst||m.hersteller===AW.herst));
    return `<div class="aw-grid">${[["res","Leerplatz","unbestückt, ohne Gerät · 1 TE"],["gr","Überschrift","z. B. Erdgeschoss, Wohnung OG"],["kln","N-Klemme Pollmann N 14-S","blau · 14 Steck + 1 Schraub · 1 TE, hochkant"],["klpe","PE-Klemme Pollmann PE 14-S","grün · 14 Steck + 1 Schraub · 1 TE, hochkant"],["kla","Abzweigklemme Pollmann A 14-S","grau · z. B. für eine Phase · 1 TE, hochkant"],["frei","Anderes Gerät","frei eintragen – ohne Materialliste"]].map(([k,t,s])=>AW_SONST_ANZ[k]
        ?`<button type="button" class="aw-g aw-g-ic${awIstSel("sonst",k)?" an":""}" data-act="awSel" data-k="sonst" data-v="${k}">${/^kl/.test(k)?klB(k):`<span class="aw-gb">${awSvg(k)}</span>`}<b>${t}</b><small>${s}</small>${awSelBadge("sonst",k)}</button>`
        :`<button type="button" class="aw-g aw-g-ic" data-act="awSonst" data-v="${k}"><span class="aw-gb">${awSvg(k)}</span><b>${t}</b><small>${s}</small></button>`).join("")}${awKatDa()?`<button type="button" class="aw-g aw-g-ic" data-act="awBlock"><span class="aw-gb">${awSvg("frei")}</span><b>Klemmblock planen</b><small>WAGO 2004 mit Brücken</small></button>`:""}</div>`
    +(GE.length?`<div class="aw-lbl aw-ge-lbl">Schütze, Schalter, Uhren</div><div class="aw-grid">${GE.map(m=>{ const t=matTech(m), hnr=matHnr(m.herstellerNr); return `<button type="button" class="aw-g${awIstSel("mat",hnr)?" an":""}" data-act="awSel" data-k="mat" data-v="${esc(hnr)}">${awMatBild(m,t)}<b>${esc(t.name)}</b><small>${esc(`${t.te} TE · ${awHerstKurz(m.hersteller)} ${m.herstellerNr}`)}</small>${hnr===AW.letzt&&!awIstSel("mat",hnr)?`<span class="aw-nochmal">Nochmal</span>`:""}${awAnzBadge(L,hnr)}${awSelBadge("mat",hnr)}</button>`; }).join("")}</div>`:""); }
  let A=awGeraete().map(m=>({m,t:matTech(m),hnr:matHnr(m.herstellerNr)}));
  if(q){ const qq=q.replace(/\s+/g,""); A=A.filter(x=>{ const kurz=x.t.char?`${x.t.char}${x.t.in}`.toLowerCase():""; return kurz===qq||[awName(x.t),awUnter(x.m),x.m.name,kurz].join(" ").toLowerCase().replace(/\s+/g," ").includes(q); }); }
  else A=A.filter(x=>x.t.art===AW.tab&&(AW.tab!=="ls"||!AW.serie||(matSerie(x.m)||[])[0]===AW.serie));
  if(AW.herst) A=A.filter(x=>x.m.hersteller===AW.herst);
  const gh=L&&L.gerHerst||"";
  A.sort((a,b)=>(b.hnr===AW.letzt)-(a.hnr===AW.letzt)||(gh?(b.m.hersteller===gh)-(a.m.hersteller===gh):0)||(z[b.hnr]||0)-(z[a.hnr]||0)||(b.m.hersteller===herst)-(a.m.hersteller===herst)||(a.t.pole||0)-(b.t.pole||0)||String(a.t.char).localeCompare(String(b.t.char))||a.t.in-b.t.in||a.m.hersteller.localeCompare(b.m.hersteller));
  if(!A.length) return `<p class="aw-leer">${AW.herst?`In unserer Materialliste steht hier nichts von ${esc(awHerstKurz(AW.herst))}. Im Tab „Katalog“ stehen alle Geräte des Herstellers.`:"Nichts gefunden. Unter „Sonstiges“ lässt sich ein Gerät frei eintragen."}</p>`;
  return `<div class="aw-grid">${A.map(({m,t,hnr})=>`<button type="button" class="aw-g${awIstSel("mat",hnr)?" an":""}" data-act="awSel" data-k="mat" data-v="${esc(hnr)}">${awMatBild(m,t)}<b>${esc(awName(t))}</b><small>${esc(awUnter(m))}</small>${hnr===AW.letzt&&!awIstSel("mat",hnr)?`<span class="aw-nochmal">Nochmal</span>`:""}${awAnzBadge(L,hnr)}${awSelBadge("mat",hnr)}</button>`).join("")}</div>`; }
function awEinsetzen(e){ const L=legAkt(); if(!L) return; const E=legE(L); if(AW&&AW.panel&&typeof LEG_WS!=="undefined") LEG_WS.id=e.id;
  if(awEinfuegen()&&AW.nach<E.length-1){ E.splice(AW.nach+1,0,e); AW.nach++; } else { E.push(e); if(awEinfuegen()) AW.nach=E.length-1; }
  legSpeichern(L); render(); }
function awGeraetWahl(hnr,anz){ const L=legAkt(), m=awGeraete().find(x=>matHnr(x.herstellerNr)===hnr); if(!L||!m) return; const t=matTech(m), n=Math.max(1,anz|0||1); let erst="", letzt="";
  if(t.art==="ge"){ for(let i=0;i<n;i++){ const E=legE(L), z=E.filter(e=>e.art==="ge"&&new RegExp("^"+t.kb+"\\s*\\d").test(e.kz||"")).length, kz=`${t.kb}${z+1}`;
      awEinsetzen({id:uid(),art:"ge",kz,bez:t.name,schutz:"",pole:1,te:t.te,mat:hnr}); erst=erst||kz; letzt=kz; }
    AW.letzt=hnr; AW.zuletzt=`${erst}${letzt!==erst?" bis "+letzt:""} ${t.name} eingesetzt`; awKatalog(); return; }
  if(t.art==="rcd"){ for(let i=0;i<n;i++){ const k=awKz(L,"rcd"); awEinsetzen({id:uid(),art:"rcd",kz:k.kz,bez:"Fehlerstromschutzschalter",schutz:awSchutz(t),pole:1,te:t.te,mat:hnr,...(k.umbruch?{umbruch:true}:{})}); erst=erst||k.kz; letzt=k.kz; }
    AW.letzt=hnr; AW.zuletzt=`${erst}${letzt!==erst?" bis "+letzt:""} RCD eingesetzt – jetzt die Automaten dazu`; AW.tab="ls"; AW.such=""; awKatalog(); return; }
  AW.m=hnr; AW.was=""; AW.raum=""; AW.bez=""; AW.bezHand=false; AW.mehr=false;
  if(n===1){ if(awFragen()&&!AW.panel) awWofuer(); else awOk(true,true); return; }   /* Arbeitsfläche: „Wofür“ gleich rechts unter „Ausgewählt“ */
  for(let i=0;i<n;i++){ const k=awKz(L,"sk"); awEinsetzen({id:uid(),art:"sk",kz:k.kz,bez:"?",schutz:awSchutz(t),pole:+t.pole===3?3:1,te:t.te,mat:hnr}); erst=erst||k.kz; letzt=k.kz; }
  AW.letzt=hnr; AW.tab=t.art; AW.such=""; AW.zuletzt=`${n}× ${awName(t)} eingesetzt: ${erst} bis ${letzt} – „Wofür“ später in der Legende`; awKatalog(); }
/* „Wofür gleich fragen“: aus = erst bestücken, Wofür später in der Legende eintragen (je Gerät gemerkt) */
const awFragen=()=>typeof META!=="undefined"&&!!META.awFragen;
function awRaeume(L){ const s=new Set(), add=b=>String(b||"").split(/\s+/).forEach(w=>{ if(LEG_RAUM.includes(w)) s.add(w); });
  if(L._geb){ const g=vtGeb(L._geb); if(g) g.stromkreise.forEach(x=>add(x.bez)); } else legE(L).forEach(e=>add(e.bez));
  return [...s,...LEG_RAUM.filter(r=>!s.has(r))]; }
function awWofuer(){ const L=legAkt(), m=awGeraete().find(x=>matHnr(x.herstellerNr)===AW.m); if(!L||!m){ awKatalog(); return; } const t=matTech(m), k=awKz(L,"sk"), r=awRcdVor(L);
  const gross=+t.pole===3, oben=gross?["Herd","Durchlauferhitzer","Wallbox","Wärmepumpe","PV-Anlage","Heizung"]:["Steckdosen","Licht","Herd","Waschmaschine","Spülmaschine","Trockner"];
  const W=[...oben,...LEG_WAS.filter(w=>!oben.includes(w))], zeigW=AW.mehr?W:W.slice(0,6), Rm=awRaeume(L);
  awRahmen({titel:awName(t),unter:`wird ${k.kz}${r?` · an RCD ${r.kz}`:""}`,
    inhalt:`<div class="aw-gerat">${matFoto(m,"aw-gerat-b")}<span><b>${esc(awName(t))}</b><small>${esc(awUnter(m))}</small></span></div>
      <h2 class="aw-frage">Wofür ist der Kreis?</h2>
      <div class="aw-lbl">Was</div><div class="aw-wahl">${zeigW.map(w=>`<button type="button" data-act="awWas" data-v="${esc(w)}" aria-pressed="${AW.was===w}">${esc(w)}</button>`).join("")}${AW.mehr?"":`<button type="button" class="aw-mehr" data-act="awMehr">Weitere …</button>`}</div>
      <div class="aw-lbl">Raum</div><div class="aw-wahl">${Rm.map(w=>`<button type="button" data-act="awRaum" data-v="${esc(w)}" aria-pressed="${AW.raum===w}">${esc(w)}</button>`).join("")}</div>
      <div class="fg1 aw-eigen">${tf("awBez","Bezeichnung",AW.bez,{form:true,ph:"z. B. Steckdosen Küche"})}</div>
      <button type="button" class="aw-unbek" data-act="awUnbek">Noch unbekannt – später eintragen</button>`,
    fuss:`<button type="button" class="btn-tonal" data-act="awOk" data-weiter="0">Übernehmen</button><span style="flex:1"></span><button type="button" class="btn-filled" data-act="awOk" data-weiter="1">Übernehmen · nächstes</button>`}); }
function awBezSetzen(){ if(AW.bezHand) return; AW.bez=[AW.was,AW.raum].filter(Boolean).join(" "); const f=document.getElementById("f_awBez"); if(f){ f.value=AW.bez; f.parentElement.classList.toggle("fl",!!AW.bez); } }
function awOk(weiter,unbekannt){ const L=legAkt(), m=awGeraete().find(x=>matHnr(x.herstellerNr)===AW.m); if(!L||!m) return; const t=matTech(m), f=document.getElementById("f_awBez");
  const bez=unbekannt?"?":(f?f.value.trim():AW.bez)||"?", k=awKz(L,"sk");
  awEinsetzen({id:uid(),art:"sk",kz:k.kz,bez,schutz:awSchutz(t),pole:+t.pole===3?3:1,te:t.te,mat:AW.m});
  AW.letzt=AW.m; AW.tab=t.art; AW.such="";
  if(weiter){ AW.zuletzt=`${k.kz} ${bez==="?"?"(noch unbekannt)":bez} eingesetzt`; awKatalog(); } else awZu(); }
function awSonst(k,still){ const L=legAkt(); if(!L) return;
  if(k==="res"){ const z=awKz(L,"sk"); awEinsetzen({id:uid(),art:"res",kz:z.kz,bez:"",schutz:"",pole:1,te:1}); if(still) return; AW.zuletzt=`${z.kz} Leerplatz eingesetzt`; awKatalog(); return; }
  if(k==="kln"||k==="klpe"||k==="kla"){ const fb={kln:"n",klpe:"pe",kla:"a"}[k]; awEinsetzen({id:uid(),art:"kl",farbe:fb,kz:"",bez:{n:"N 14-S",pe:"PE 14-S",a:"A 14-S"}[fb],schutz:"",pole:1,te:1}); if(still) return; AW.zuletzt=`${{n:"N-Klemme",pe:"PE-Klemme",a:"Abzweigklemme"}[fb]} eingesetzt`; awKatalog(); return; }
  AW=null; $("#dlg").classList.remove("aw"); legSkDlg(null,null);
  if(k==="gr"&&legDlg){ legDlg.art="gr"; document.querySelectorAll('#dlg [data-act="legArt"]').forEach(c=>c.setAttribute("aria-pressed",c.dataset.v==="gr")); legArtZeigen(); } }

document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act^="aw"]'); if(!b||b.disabled) return; e.stopPropagation(); const a=b.dataset.act;
  switch(a){
  case "awStart": awGeraetStart(); return;
  case "awFrei": { const n=AW&&AW.nach!=null?AW.nach:null, art=AW&&AW.tab==="rcd"?"rcd":null; awZu(); setTimeout(()=>legSkDlg(null,n!=null?n:Math.max(0,legE(legAkt()).length-1),art),0); return; }
  case "awZu": awZu(); return;
  case "awZur": if(!AW||AW.typ==="produkt") return awZu(); if(AW.typ==="neu"){ if(AW.sub){ AW.sub=AW.sub==="reihen"?"hoehe":null; if(AW.d.zs) zsAbgleich(AW.d.zs); awNeuZeigen(); } else if(AW.i>0){ AW.i--; awNeuZeigen(); } else awZu(); }
    else if(AW.typ==="zs"){ if(AW.schritte&&AW.i>0){ const z=zsAktZp(); if(z) zsZpLesen(z); AW.i--; zsZeigen(); } else awZu(); } else if(AW.m) awKatalog(); else awZu(); return;
  case "awNeuW": awNeuWahl(b.dataset.v); return;
  case "awGwMod": { const d=AW.d, g=d.gw||(d.gw={}), m=GW_MOD[g.typ]&&GW_MOD[g.typ].find(x=>x.hnr===b.dataset.v);
      if(m){ Object.assign(g,{hnr:m.hnr,b:m.b,h:m.h,t:m.t,ip:m.ip,hersteller:GW_HERST[g.typ],frei:false}); if(m.n){ d.reihen=m.n; d.teReihe=12; } } else { Object.assign(g,{hnr:"",frei:true}); }
      const S=awNeuSchritte(); if(AW.i<S.length-1){ AW.i++; awNeuZeigen(); } else awNeuAnlegen(); return; }
  case "awGwWeiter": { const d=AW.d; d.gw=gwDatenLesen(d.gw||{}); if(d.gw.reihen) d.reihen=+d.gw.reihen; const S=awNeuSchritte(); if(AW.i<S.length-1){ AW.i++; awNeuZeigen(); } else awNeuAnlegen(); return; }
  case "awHerstW": { const d=AW.d; d.hersteller=b.dataset.v; if(d.zs) d.zs.hersteller=b.dataset.v; awNeuZeigen(); return; }
  case "awNvName": { AW.d.name=b.dataset.v; const i=document.getElementById("f_awName"); if(i) i.value=b.dataset.v; document.querySelectorAll('#dlg [data-act="awNvName"]').forEach(x=>x.setAttribute("aria-pressed",x===b)); return; }
  case "awNvVon": { const d=AW.d, i=document.getElementById("f_awName"); if(i) d.name=i.value.trim()||d.name; d.vonVId=b.dataset.v==="-"?"":b.dataset.v; const q=awVonListe().find(x=>x.id===d.vonVId); if(q&&q.netz) d.netz=q.netz; awNeuZeigen(); return; }
  case "awNvNetz": { const d=AW.d, i=document.getElementById("f_awName"); if(i) d.name=i.value.trim()||d.name; d.netz=b.dataset.v; document.querySelectorAll('#dlg [data-act="awNvNetz"]').forEach(x=>x.setAttribute("aria-pressed",x===b)); return; }
  case "awNvOk": { const d=AW.d, i=document.getElementById("f_awName"), n=i&&i.value.trim(); if(n) d.name=n; if(!d.name){ toast("Bitte einen Namen eingeben"); return; } if(d.netz==null) d.netz=""; awNeuAnlegen(); return; }
  case "awNeuWeiter": { const S=awNeuSchritte(), sk=S[AW.i]||"", d=AW.d;
      if(sk==="bedarf"){ if(zsBedarfZp(d.bedarf)<1){ toast("Mindestens einen Zählerplatz angeben"); return; } d.zs=zsAusBedarf(d.bedarf,d.zs); d.zs.hersteller=d.hersteller; }
      if(AW.i<S.length-1){ AW.i++; awNeuZeigen(); } else awNeuAnlegen(); return; }
  case "awBed": { const B=AW.d.bedarf, k=b.dataset.k; B[k]=Math.max(k==="vf"?1:0,Math.min(k==="vf"||k==="mm"?4:18,(+B[k]||0)+(+b.dataset.d))); const n=document.getElementById("awBed_"+k); if(n) n.textContent=B[k]; const sm=document.getElementById("awBedSum"); if(sm) sm.innerHTML=zsBedarfSumHtml(B); const bb=document.getElementById("awBedBild"); if(bb) bb.innerHTML=zsSvg(zsAusBedarf(B,null),0); return; }
  case "awSub": { const v=b.dataset.v; if(v==="bedarf"){ AW.i=awNeuSchritte().indexOf("bedarf"); AW.sub=null; } else AW.sub=v; awNeuZeigen(); return; }
  case "awModell": { const d=AW.d, m=ZS_MODELLE.find(x=>x.hnr===b.dataset.v); d.zs=m?zsAusModell(m,d.bedarf,d.zs):zsAusBedarf(d.bedarf,d.zs); d.zs.hersteller=d.hersteller; d.ohneModell=!m;
      if(m&&+m.hoehe!==1100&&+m.hoehe!==1400) d.reihen=d.reihen||5;
      if(AW.sub){ AW.sub=null; awNeuZeigen(); return; } const S=awNeuSchritte(); if(AW.i<S.length-1){ AW.i++; awNeuZeigen(); } else awNeuAnlegen(); return; }
  case "awSubZu": AW.sub=null; zsAbgleich(AW.d.zs); awNeuZeigen(); return;
  case "awNameOk": { const f=document.getElementById("f_awName"), v=f&&f.value.trim(); if(!v&&!AW.d.name){ toast("Bitte einen Namen antippen oder eintragen"); return; } awNeuWahl(v||AW.d.name); return; }
  case "awTab": AW.tab=b.dataset.v; AW.such=""; AW.lim=60; { const s=document.getElementById("awSuch"); if(s){ s.value=""; s.placeholder=AW.tab==="kat"?"Hersteller, Gerät, Artikelnummer …":"B16, RCD, Typ A …"; } } awFilterNeu(); document.querySelectorAll('#dlg [data-act="awTab"]').forEach(x=>x.setAttribute("aria-pressed",x===b)); { const ih=$("#dlg .aw-inhalt"), gr=document.getElementById("awGrid"); if(ih&&gr&&ih.scrollTop>gr.offsetTop) ih.scrollTop=0; } return;
  case "awHerst": AW.herst=b.dataset.v; AW.lim=60; META.awHerst=AW.herst; if(typeof metaSave==="function") metaSave(); awFilterNeu(); return;
  case "awGruppe": AW.gruppe=b.dataset.v; AW.lim=60; awFilterNeu(); return;
  case "awKatMehr": AW.lim+=60; awHtml(document.getElementById("awGrid"),awGrid()); return;
  case "awSel": awSel(b.dataset.k,b.dataset.v); return;
  case "awSelWeg": AW.sel=null; AW.anz=1; awHtml(document.getElementById("awGrid"),awGrid()); awWahlZeigen(); return;
  case "awAnz": AW.anz=Math.max(1,Math.min(24,AW.anz+(+b.dataset.d))); awWahlZeigen(); { const z=document.querySelector("#awGrid .aw-g.an .aw-selz"); if(z) z.textContent=AW.anz+"×"; } return;
  case "awRein": awRein(); return;
  case "awBlock": AW=null; $("#dlg").classList.remove("aw"); gkBlockNeu(); return;
  case "awGeraet": awGeraetWahl(b.dataset.v); return;
  case "awSonst": awSonst(b.dataset.v); return;
  case "awReihe": awReihe(b.dataset.v); return;
  case "awFragen": META.awFragen=!META.awFragen; if(typeof metaSave==="function") metaSave(); b.setAttribute("aria-pressed",!!META.awFragen); return;
  case "awSerie": AW.serie=b.dataset.v; META.lsSerie=AW.serie; if(typeof metaSave==="function") metaSave(); awFilterNeu(); return;
  case "awWas": AW.was=AW.was===b.dataset.v?"":b.dataset.v; b.parentElement.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",x.dataset.v===AW.was)); awBezSetzen(); return;
  case "awRaum": AW.raum=AW.raum===b.dataset.v?"":b.dataset.v; b.parentElement.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",x.dataset.v===AW.raum)); awBezSetzen(); return;
  case "awMehr": { const f=document.getElementById("f_awBez"); if(f) AW.bez=f.value; AW.mehr=true; awWofuer(); return; }
  case "awUnbek": awOk(true,true); return;
  case "awOk": awOk(b.dataset.weiter==="1"); return;
  } },true);
document.addEventListener("change",e=>{ if(AW&&e.target.id==="awHerstMehr"){ AW.herst=e.target.value; AW.lim=60; META.awHerst=AW.herst; if(typeof metaSave==="function") metaSave(); awFilterNeu(); } });
document.addEventListener("input",e=>{ if(!AW) return;
  if(e.target.id==="awSuch"){ AW.such=e.target.value; AW.lim=60; awHtml(document.getElementById("awGrid"),awGrid()); awHtml(document.getElementById("awFilter"),awFilterHtml()); document.querySelectorAll('#dlg [data-act="awTab"]').forEach(x=>x.setAttribute("aria-pressed",(AW.tab==="kat"||!AW.such.trim())&&x.dataset.v===AW.tab)); }
  if(e.target.id==="f_awBez"){ AW.bez=e.target.value; AW.bezHand=!!e.target.value.trim(); } });

/* ---------- Verteiler-Ansicht: Gerät antippen = nur das Produkt wählen (Bezeichnung usw. bleibt Sache der Liste) ----------
   Passende Artikel zuerst (gleiche Art, Charakteristik, Nennstrom, Pole), darunter die übrigen derselben Art. */
function awProdukt(id){ const L=legAkt(); if(!L||L.fertig) return; const e=legE(L).find(x=>x.id===id); if(!e) return;
  const rb=e.art==="sk"&&legIstRcbo(e), art=e.art==="rcd"?"rcd":rb?"rcbo":e.art==="sk"?"ls":e.art==="ge"?"ge":"";
  if(!art){ toast("Für Klemmen und Reserve gibt es keine Produktauswahl"); return; }
  AW={typ:"produkt",id};
  const pole=+e.pole===3?3:1, sc=String(e.schutz||"").replace(/\s+/g,"").toUpperCase(), z=awNutzung();
  const A=awGeraete().map(m=>({m,t:matTech(m),hnr:matHnr(m.herstellerNr)})).filter(x=>x.t&&x.t.art===art&&(art!=="ls"||+x.t.pole===pole));
  const passt=x=>art==="ge"||!sc?true:art==="rcd"?sc.includes(`${x.t.in}A`)&&sc.includes(`${x.t.idn}MA`):sc.startsWith(`${x.t.char||""}${x.t.in}`.toUpperCase());
  const si=x=>{ const s=matSerie(x.m); return s?MAT_SERIEN.indexOf(s):9; }, sort=(a,b)=>(z[b.hnr]||0)-(z[a.hnr]||0)||si(a)-si(b)||Math.abs((+a.t.in||16)-16)-Math.abs((+b.t.in||16)-16)||(+a.t.in||0)-(+b.t.in||0)||String(a.m.herstellerNr).localeCompare(String(b.m.herstellerNr));
  const P=A.filter(passt).sort(sort), R=A.filter(x=>!passt(x)).sort(sort);
  const kachel=x=>`<button type="button" class="aw-g${x.hnr===e.mat?" gewaehlt":""}" data-act="awProduktOk" data-v="${esc(x.hnr)}">${awMatBild(x.m,x.t)}<b>${esc(awName(x.t))}</b><small>${esc(awUnter(x.m))}</small>${x.hnr===e.mat?`<span class="aw-nochmal">Gewählt</span>`:""}</button>`;
  awRahmen({titel:[e.kz,e.bez&&e.bez!=="?"?e.bez:""].filter(Boolean).join(" · ")||"Gerät",unter:"Produkt wählen",
    inhalt:`${P.length?`<div class="aw-lbl">${sc?`Passend zu ${esc(legSchutz(e))}`:art==="ls"?`Automaten ${pole}-polig`:art==="rcd"?"RCD":art==="rcbo"?"FI/LS":"Geräte"}</div><div class="aw-grid">${P.map(kachel).join("")}</div>`:`<p class="aw-hinweis">Kein Artikel passt genau zu „${esc(legSchutz(e))}“ – unten alle derselben Art.</p>`}
      ${R.length?`<div class="aw-lbl">Weitere</div><div class="aw-grid">${R.map(kachel).join("")}</div>`:""}`,
    fuss:`${e.mat?`<button type="button" class="btn-text" data-act="awProduktOk" data-v="">Ohne Produkt</button>`:""}<span style="flex:1"></span><button type="button" class="btn-tonal" data-act="awZu">Schließen</button>`});
  const zr=$("#dlg .aw-zur"); if(zr) zr.hidden=true; $("#menu").hidden=true; $("#dlg").hidden=false; $("#scrim").hidden=false; $("#scrim").classList.add("dim"); }
function awProduktOk(hnr){ const L=legAkt(); if(!L||!AW||AW.typ!=="produkt") return; const e=legE(L).find(x=>x.id===AW.id); if(!e) return awZu();
  if(!hnr){ delete e.mat; legSpeichern(L); awZu(); toast("Produkt entfernt"); return; }
  const m=awGeraete().find(x=>matHnr(x.herstellerNr)===hnr); if(!m) return; const t=matTech(m);
  e.mat=hnr; if(t.te) e.te=t.te; if(t.art!=="ge"){ e.schutz=awSchutz(t); if(t.art==="ls") e.pole=+t.pole===3?3:1; }
  legSpeichern(L); awZu(); toast(`${e.kz||"Gerät"}: ${m.hersteller} ${m.herstellerNr}`); }
document.addEventListener("click",ev=>{ const b=ev.target.closest&&ev.target.closest('[data-act="legProdukt"],[data-act="awProduktOk"]'); if(!b) return; ev.stopPropagation();
  if(b.dataset.act==="legProdukt") awProdukt(b.dataset.id); else awProduktOk(b.dataset.v); },true);
/* Chips der Schrank-Daten: je Gruppe eins, nochmal antippen nimmt es weg; Hersteller-Chip füllt das Textfeld */
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act="gwChip"],[data-act="gwHerstChip"]'); if(!b) return; e.preventDefault(); e.stopPropagation();
  if(b.dataset.act==="gwHerstChip"){ const i=document.getElementById("f_gwHerst"); if(i) i.value=b.dataset.v; document.querySelectorAll('#dlg [data-act="gwHerstChip"]').forEach(x=>x.setAttribute("aria-pressed",x===b)); return; }
  const an=b.getAttribute("aria-pressed")!=="true"; document.querySelectorAll(`#dlg [data-act="gwChip"][data-k="${b.dataset.k}"]`).forEach(x=>x.setAttribute("aria-pressed",x===b&&an));
  if(!an&&AW&&AW.d&&AW.d.gw) delete AW.d.gw[b.dataset.k]; },true);
