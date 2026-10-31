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
      <div class="aw-tt"><b>${esc(titel)}</b>${unter?`<small>${esc(unter)}</small>`:""}</div><button type="button" class="icon-btn" data-act="awZu" aria-label="Schließen">${icon("close")}</button></div>
    ${schritte?`<div class="aw-fort">${Array.from({length:schritte},(_,i)=>`<span${i<=schritt?' class="an"':""}></span>`).join("")}</div>`:""}
    <div class="aw-inhalt">${frage?`<h2 class="aw-frage">${esc(frage)}</h2>`:""}${hinweis?`<p class="aw-hinweis">${esc(hinweis)}</p>`:""}${inhalt}</div>
    ${fuss?`<div class="aw-fuss">${fuss}</div>`:""}`;
  $("#menu").hidden=true; $("#dlg").hidden=false; $("#scrim").hidden=false; $("#scrim").classList.add("dim");
  const ih=$("#dlg .aw-inhalt"); if(ih) ih.scrollTop=0; }
const awKachel=(act,v,bild,t,s,an)=>`<button type="button" class="aw-k" data-act="${act}" data-v="${esc(v)}" aria-pressed="${!!an}">${bild?`<span class="aw-kb">${bild}</span>`:""}<span class="aw-kt"><b>${esc(t)}</b>${s?`<small>${esc(s)}</small>`:""}</span></button>`;
function awZu(){ AW=null; $("#dlg").classList.remove("aw"); closeOverlays(); render(); }

/* ---------- Neuer Verteiler ---------- */
function awNeuStart(kind,id){ const s=kind==="standorte"&&standortOf(id), k=kind==="kunden"?kundeOf(id):s?kundeOf(s.kundeId):null;
  const ss=k&&!s?standorteVon(k.id):[];
  AW={typ:"neu",kid:k?k.id:"",ort:s?s.id:k&&!ss.length?"k:"+k.id:"",ortWahl:ss.length>0,i:0,d:{art:"",montage:"",reihen:0,name:"",netz:null},unter:k?(s?[k.name,s.name].filter(Boolean).join(" · "):k.name):"Ohne Kunde"};
  awNeuZeigen(); }
function awNeuSchritte(){ const hv=AW.d.art==="hv";
  if(hv) return ["art","hersteller","geraete","bedarf",...(ZS_MODELLE.some(m=>m.h===AW.d.hersteller)?["modell"]:[]),...(AW.ortWahl?["ort"]:[]),"vorschlag"];
  return ["art","montage","reihen",...(AW.ortWahl?["ort"]:[]),"name","netz"]; }
const awOrtPlz=()=>{ if(!AW.kid) return ""; const o=ecOrt(AW.ort||"k:"+AW.kid); return String(((o.standort&&o.standort.plz)?o.standort:o.kunde||{}).plz||"").trim(); };
function awNeuZeigen(){ const S=awNeuSchritte(), sk=AW.sub||S[AW.i], d=AW.d, R={titel:"Neuer Verteiler",unter:AW.unter,schritt:AW.i,schritte:S.length};
  if(sk==="hersteller") return awRahmen({...R,frage:"Welcher Hersteller?",hinweis:"Höhe, Reihen und Felder sind genormt – der Hersteller zählt für Material und Artikelnummern.",inhalt:`<div class="aw-liste">${ZS_HERST.map(([k,t,u])=>awKachel("awNeuW",k,"",t,u,d.hersteller===k)).join("")}</div>`});
  if(sk==="geraete") return awRahmen({...R,frage:"Einbaugeräte von?",hinweis:"LS, FI und FI/LS dieses Herstellers stehen beim Bestücken vorne.",inhalt:`<div class="aw-liste">${ZS_GERHERST.map(([k,t,u])=>awKachel("awNeuW",k,"",t,u,d.gerHerst===k&&d.gerHerst!=null)).join("")}</div>`});
  if(sk==="bedarf") return awRahmen({...R,...zsBedarfFenster(d.bedarf)});
  if(sk==="modell") return awRahmen({...R,...zsModellFenster(d)});
  if(sk==="vorschlag"){ const plz=awOrtPlz(); if(d.zs.nb==null&&ZS_PLZ_NB[plz]){ d.zs.nb=ZS_PLZ_NB[plz]; d.nbAuto=true; } return awRahmen({...R,...zsVorschlagFenster(d,plz)}); }
  if(sk==="felder") return awRahmen({...R,...zsFelderFenster(d.zs,d.reihen,"awSubZu","Fertig")});
  if(sk==="apz") return awRahmen({...R,...zsApzFenster(d.zs)});
  if(sk==="hoehe") return awRahmen({...R,...zsHoeheFenster(d.zs)});
  if(sk==="nb") return awRahmen({...R,...zsNbFenster(d.zs)});
  if(sk==="art") return awRahmen({...R,frage:"Was für ein Verteiler?",hinweis:"Antippen – es geht sofort weiter.",inhalt:`<div class="aw-liste">${AW_ART.map(([v,t,s])=>awKachel("awNeuW",v,awSvg(v),t,s,d.art===v)).join("")}</div>`});
  if(sk==="montage") return awRahmen({...R,frage:"Wie ist er montiert?",inhalt:`<div class="aw-liste">${awKachel("awNeuW","up",awSvg("up"),"Unterputz","in der Wand oder Hohlwand",d.montage==="up")}${awKachel("awNeuW","ap",awSvg("ap"),"Aufputz","auf der Wand",d.montage==="ap")}</div>`});
  if(sk==="reihen") return awRahmen({...R,frage:d.art==="hv"?"Wie viele Reihen im Verteilerfeld?":"Wie viele Reihen?",hinweis:"12 Teilungseinheiten (TE) je Reihe – das ist der Normalfall.",
    inhalt:`<div class="aw-liste aw-2sp">${[1,2,3,4,5,6,7,9].map(n=>awKachel("awNeuW",n,awReihenSvg(Math.min(n,6)),`${n}-reihig`,`${n*12} TE`,d.reihen===n)).join("")}</div>`});
  if(sk==="ort"){ const k=kundeOf(AW.kid), ss=standorteVon(AW.kid);
    return awRahmen({...R,frage:"Wo steht der Verteiler?",inhalt:`<div class="aw-liste">${awKachel("awNeuW","k:"+k.id,"","Adresse des Kunden",adrText(k)||k.name,AW.ort==="k:"+k.id)}${ss.map(s=>awKachel("awNeuW",s.id,"",s.name||"Standort",[adrText(s)].filter(Boolean).join(""),AW.ort===s.id)).join("")}</div>`}); }
  if(sk==="name"){ const N=AW_NAMEN[d.art]||AW_NAMEN.uv;
    return awRahmen({...R,frage:"Wie heißt er?",hinweis:"So steht er in der Liste und auf der Legende.",
      inhalt:`<div class="aw-liste aw-2sp">${N.map(n=>awKachel("awNeuW",n,"",n,"",d.name===n)).join("")}</div>
        <div class="fg1 aw-eigen">${tf("awName","Eigener Name",N.includes(d.name)?"":d.name,{form:true,ph:"z. B. UV Anbau"})}</div>`,
      fuss:`<span style="flex:1"></span><button type="button" class="btn-filled" data-act="awNameOk">Weiter</button>`}); }
  if(sk==="netz") return awRahmen({...R,frage:"Welche Netzform?",inhalt:`<div class="aw-liste">${AW_NETZ.map(([v,t,s])=>awKachel("awNeuW",v,"",t,s,d.netz===v)).join("")}</div>`}); }
function awNeuWahl(v){ const S=awNeuSchritte(), sk=AW.sub||S[AW.i], d=AW.d;
  if(sk==="art"){ if(d.art!==v){ d.zs=null; if(v==="hv"){ Object.assign(d,{bedarf:zsBedarfStd(),montage:"up",name:"HV",netz:"TN-C-S | 230/400 V",hersteller:d.hersteller||""}); } } d.art=v; }
  else if(sk==="hersteller"){ d.hersteller=v; if(d.zs) d.zs.hersteller=v; if(d.gerHerst==null) d.gerHerst=v==="hager"?"Hager":v==="sj"?"ABB":null; }
  else if(sk==="geraete") d.gerHerst=v;
  else if(sk==="montage") d.montage=v; else if(sk==="reihen") d.reihen=+v; else if(sk==="ort"){ AW.ort=v; if(d.zs&&d.nbAuto){ d.zs.nb=null; d.nbAuto=false; } } else if(sk==="name") d.name=v; else if(sk==="netz") d.netz=v;
  if(AW.sub){ AW.sub=null; awNeuZeigen(); return; }
  if(AW.i<S.length-1){ AW.i++; awNeuZeigen(); } else awNeuAnlegen(); }
function awNeuAnlegen(){ const d=AW.d, wer=(n=>legTeam().includes(n)?n:"")(ME.name||(META.profil&&META.profil.name)||""), extra={art:d.art,...(d.gerHerst?{gerHerst:d.gerHerst}:{}),montage:d.montage,reihen:d.art==="hv"&&d.zs&&+d.zs.hoehe?zsReihenSumme(d.zs,0):(d.reihen||(d.art==="hv"?5:3)),teReihe:12,...(d.art==="hv"&&d.zs?{zs:zsAbgleich(d.zs)}:{})};
  if(AW.kid){ const g=ecGeb(AW.ort||"k:"+AW.kid), id=uid();
    g.verteiler.push({id,name:d.name||"Verteiler",netz:d.netz||"",stand:ecHeute(),ersteller:wer,...extra}); ecGebSpeichern(g);
    AW=null; $("#dlg").classList.remove("aw"); closeOverlays(); go({v:"vt",g:g.id,id}); }
  else { const L={id:uid(),titel:d.name||"Verteiler",kunde:"",anschrift:"",kundeId:"",standortId:"",ortId:"",netz:d.netz||"",ersteller:wer,stand:ecHeute(),eintraege:[],...extra};
    saveRec("legenden",L,true); AW=null; $("#dlg").classList.remove("aw"); closeOverlays(); go({v:"legende",id:L.id}); }
  setTimeout(()=>{ awGeraetStart(); if(AW) { AW.zuletzt="Verteiler angelegt – jetzt die Geräte einsetzen"; awKatalog(); } },250); }

/* ---------- Gerät einsetzen ---------- */
const awGeraete=()=>matFirma().filter(m=>m.kategorie==="schutz"&&matTech(m));
function awName(t){ return t.art==="rcd"?`RCD ${t.in} A / ${t.idn} mA`:t.art==="rcbo"?`FI/LS ${t.char||""}${t.in}`:`LS ${t.char||""}${t.in} ${t.pole}-polig`; }
function awUnter(m){ const t=matTech(m); return [t.art==="rcd"||t.art==="rcbo"?`${t.art==="rcbo"?t.idn+" mA ":""}Typ ${t.typ||"A"}`:"",`${t.te} TE`,[m.hersteller==="Schneider Electric"?"Schneider":m.hersteller,m.herstellerNr].filter(Boolean).join(" ")].filter(Boolean).join(" · "); }
const awSchutz=t=>t.art==="rcd"?`${t.in} A / ${t.idn} mA Typ ${t.typ||"A"}`:t.art==="rcbo"?`${t.char||""}${t.in} FI/LS ${t.idn} mA Typ ${t.typ||"A"}`:`${t.char||""}${t.in}`;
function awNutzung(){ const z={}; const zaehl=x=>{ if(x&&x.mat) z[x.mat]=(z[x.mat]||0)+1; };
  live("gebaeude").forEach(g=>{ (g.rcds||[]).forEach(zaehl); (g.stromkreise||[]).forEach(zaehl); }); live("legenden").forEach(L=>legE(L).forEach(zaehl)); return z; }
/* Belegung: letzte Reihe und freie TE */
function awBelegung(L){ const n=+L.teReihe||12, R=legReihen(L), r=R.length||1, te=R.length?R[R.length-1].te:0; return {n,r,frei:n-te,reihen:+L.reihen||0}; }
function awBelegText(L){ const b=awBelegung(L); if(!legE(L).length) return `${b.reihen?b.reihen+"-reihig · ":""}noch leer`; return `Reihe ${b.r} · ${b.frei} von ${b.n} TE frei`; }
/* Kennzeichnung für das nächste Gerät */
function awKz(L,art){ const E=legE(L);
  if(art==="rcd"){ if(!E.length) return {kz:"F 1.0",umbruch:false}; const b=awBelegung(L), neu=b.frei<4; return {kz:legRcdKz(E,E.length-1,neu),umbruch:neu}; }
  const kz=legNaechsteKz(E,E.length-1); if(kz) return {kz,umbruch:false};
  return {kz:`F ${awBelegung(L).r}.${E.filter(e=>e.art!=="gr").length+1}`,umbruch:false}; }
const awRcdVor=L=>{ const E=legE(L); for(let i=E.length-1;i>=0;i--){ if(E[i].art==="gr") return null; if(E[i].art==="rcd") return E[i]; } return null; };
function awGeraetStart(){ const L=legAkt(); if(!L||L.fertig) return; const E=legE(L);
  AW={typ:"geraet",tab:E.some(e=>e.art==="rcd")?"ls":"rcd",such:"",letzt:null,zuletzt:"",m:null,was:"",raum:"",bez:"",bezHand:false,mehr:false};
  awKatalog(); }
function awKatalog(){ const L=legAkt(); if(!L){ awZu(); return; } AW.m=null;
  $("#dlg").classList.add("aw");
  awRahmen({titel:L.titel||"Verteiler",unter:awBelegText(L),inhalt:`<div class="aw-such"><span class="aw-lupe">${icon("search")}</span><input id="awSuch" type="search" placeholder="Suchen: B16, RCD, Typ A …" value="${esc(AW.such)}" autocomplete="off"></div>
      <div class="aw-tabs" role="group">${[["ls","Automaten"],["rcd","RCD"],["rcbo","FI/LS"],["sonst","Sonstiges"]].map(([k,t])=>`<button type="button" data-act="awTab" data-v="${k}" aria-pressed="${AW.tab===k}">${t}</button>`).join("")}</div>
      <div id="awGrid">${awGrid()}</div>`,
    fuss:`<span class="aw-fuss-info">${esc(AW.zuletzt||(legE(L).length?`${legE(L).filter(e=>e.art!=="gr").length} Geräte im Verteiler`:""))}</span><button type="button" class="btn-tonal" data-act="awZu">${legE(L).length?"Fertig":"Später bestücken"}</button>`});
  const z=$("#dlg .aw-zur"); if(z) z.hidden=true; }
function awGrid(){ const q=AW.such.trim().toLowerCase(), z=awNutzung(), L=legAkt(), E=L?legE(L):[];
  const herst=(()=>{ for(let i=E.length-1;i>=0;i--){ const m=E[i].mat&&awGeraete().find(x=>matHnr(x.herstellerNr)===E[i].mat); if(m) return m.hersteller; } return ""; })();
  if(!q&&AW.tab==="sonst") return `<div class="aw-grid">${[["res","Reserve","Platzhalter, 1 TE"],["gr","Überschrift","z. B. Erdgeschoss, Wohnung OG"],["kln","N-Klemme Pollmann N 14-S","blau · 14 Steck + 1 Schraub · 1 TE, hochkant"],["klpe","PE-Klemme Pollmann PE 14-S","grün · 14 Steck + 1 Schraub · 1 TE, hochkant"],["frei","Anderes Gerät","frei eintragen – ohne Materialliste"]].map(([k,t,s])=>`<button type="button" class="aw-g aw-g-ic" data-act="awSonst" data-v="${k}"><span class="aw-gb">${awSvg(k)}</span><b>${t}</b><small>${s}</small></button>`).join("")}</div>`;
  let A=awGeraete().map(m=>({m,t:matTech(m),hnr:matHnr(m.herstellerNr)}));
  if(q){ const qq=q.replace(/\s+/g,""); A=A.filter(x=>{ const kurz=x.t.char?`${x.t.char}${x.t.in}`.toLowerCase():""; return kurz===qq||[awName(x.t),awUnter(x.m),x.m.name,kurz].join(" ").toLowerCase().replace(/\s+/g," ").includes(q); }); }
  else A=A.filter(x=>x.t.art===AW.tab);
  const gh=L&&L.gerHerst||"";
  A.sort((a,b)=>(b.hnr===AW.letzt)-(a.hnr===AW.letzt)||(gh?(b.m.hersteller===gh)-(a.m.hersteller===gh):0)||(z[b.hnr]||0)-(z[a.hnr]||0)||(b.m.hersteller===herst)-(a.m.hersteller===herst)||(a.t.pole||0)-(b.t.pole||0)||String(a.t.char).localeCompare(String(b.t.char))||a.t.in-b.t.in||a.m.hersteller.localeCompare(b.m.hersteller));
  if(!A.length) return `<p class="aw-leer">Nichts gefunden. Unter „Sonstiges“ lässt sich ein Gerät frei eintragen.</p>`;
  return `<div class="aw-grid">${A.map(({m,t,hnr})=>`<button type="button" class="aw-g" data-act="awGeraet" data-v="${esc(hnr)}">${matFoto(m,"aw-gb")}<b>${esc(awName(t))}</b><small>${esc(awUnter(m))}</small>${hnr===AW.letzt?`<span class="aw-nochmal">Nochmal</span>`:""}</button>`).join("")}</div>`; }
function awEinsetzen(e){ const L=legAkt(); if(!L) return; legE(L).push(e); legSpeichern(L); render(); }
function awGeraetWahl(hnr){ const L=legAkt(), m=awGeraete().find(x=>matHnr(x.herstellerNr)===hnr); if(!L||!m) return; const t=matTech(m);
  if(t.art==="rcd"){ const k=awKz(L,"rcd"); awEinsetzen({id:uid(),art:"rcd",kz:k.kz,bez:"Fehlerstromschutzschalter",schutz:awSchutz(t),pole:1,te:t.te,mat:hnr,...(k.umbruch?{umbruch:true}:{})});
    AW.letzt=hnr; AW.zuletzt=`${k.kz} RCD eingesetzt – jetzt die Automaten dazu`; AW.tab="ls"; AW.such=""; awKatalog(); return; }
  AW.m=hnr; AW.was=""; AW.raum=""; AW.bez=""; AW.bezHand=false; AW.mehr=false; awWofuer(); }
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
function awSonst(k){ const L=legAkt(); if(!L) return;
  if(k==="res"){ const z=awKz(L,"sk"); awEinsetzen({id:uid(),art:"res",kz:z.kz,bez:"",schutz:"",pole:1,te:1}); AW.zuletzt=`${z.kz} Reserve eingesetzt`; awKatalog(); return; }
  if(k==="kln"||k==="klpe"){ const pe=k==="klpe"; awEinsetzen({id:uid(),art:"kl",farbe:pe?"pe":"n",kz:"",bez:pe?"PE 14-S":"N 14-S",schutz:"",pole:1,te:1}); AW.zuletzt=`${pe?"PE":"N"}-Klemme eingesetzt`; awKatalog(); return; }
  AW=null; $("#dlg").classList.remove("aw"); legSkDlg(null,null);
  if(k==="gr"&&legDlg){ legDlg.art="gr"; document.querySelectorAll('#dlg [data-act="legArt"]').forEach(c=>c.setAttribute("aria-pressed",c.dataset.v==="gr")); legArtZeigen(); } }

document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act^="aw"]'); if(!b||b.disabled) return; e.stopPropagation(); const a=b.dataset.act;
  switch(a){
  case "awStart": awGeraetStart(); return;
  case "awZu": awZu(); return;
  case "awZur": if(!AW) return awZu(); if(AW.typ==="neu"){ if(AW.sub){ AW.sub=AW.sub==="reihen"?"hoehe":null; if(AW.d.zs) zsAbgleich(AW.d.zs); awNeuZeigen(); } else if(AW.i>0){ AW.i--; awNeuZeigen(); } else awZu(); }
    else if(AW.typ==="zs"){ if(AW.schritte&&AW.i>0){ const z=zsAktZp(); if(z) zsZpLesen(z); AW.i--; zsZeigen(); } else awZu(); } else if(AW.m) awKatalog(); else awZu(); return;
  case "awNeuW": awNeuWahl(b.dataset.v); return;
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
  case "awTab": AW.tab=b.dataset.v; AW.such=""; { const s=document.getElementById("awSuch"); if(s) s.value=""; } $("#awGrid").innerHTML=awGrid(); document.querySelectorAll('#dlg [data-act="awTab"]').forEach(x=>x.setAttribute("aria-pressed",x===b)); return;
  case "awGeraet": awGeraetWahl(b.dataset.v); return;
  case "awSonst": awSonst(b.dataset.v); return;
  case "awWas": AW.was=AW.was===b.dataset.v?"":b.dataset.v; b.parentElement.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",x.dataset.v===AW.was)); awBezSetzen(); return;
  case "awRaum": AW.raum=AW.raum===b.dataset.v?"":b.dataset.v; b.parentElement.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",x.dataset.v===AW.raum)); awBezSetzen(); return;
  case "awMehr": { const f=document.getElementById("f_awBez"); if(f) AW.bez=f.value; AW.mehr=true; awWofuer(); return; }
  case "awUnbek": awOk(true,true); return;
  case "awOk": awOk(b.dataset.weiter==="1"); return;
  } },true);
document.addEventListener("input",e=>{ if(!AW) return;
  if(e.target.id==="awSuch"){ AW.such=e.target.value; const g=document.getElementById("awGrid"); if(g) g.innerHTML=awGrid(); document.querySelectorAll('#dlg [data-act="awTab"]').forEach(x=>x.setAttribute("aria-pressed",!AW.such.trim()&&x.dataset.v===AW.tab)); }
  if(e.target.id==="f_awBez"){ AW.bez=e.target.value; AW.bezHand=!!e.target.value.trim(); } });
