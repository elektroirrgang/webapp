/* Aufnahmeprotokoll (Ortstermin / Bestandsaufnahme) – Unterreiter einer Baustelle in der Baustellen-App.
   Daten liegen in der Baustelle unter b.aufnahme = {v:{…Werte}, fotos:{key:[ids]}, sig, sigName, sigDatum, pdf:[…]}.
   Aufbau nach dem Papierbogen der Geschäftsführung, aber direkt mit Werten statt „erfasst ja/nein“. */
const Z3=["i. O.","n. i. O.","gealtert"], JN=["Ja","Nein"], J3=["Ja","Nein","noch offen"];
const AF_HAT=(v,k,x)=>Array.isArray(v[k])&&v[k].includes(x);
const AUFN=[
  {id:"termin",t:"Ortstermin",f:[
    {k:"datum",t:"date",l:"Datum"},
    {k:"von",t:"text",l:"Aufgenommen von"},
    {k:"anwesend",t:"text",l:"Anwesend beim Termin",ph:"z. B. Herr Becker, Architekt"}]},
  {id:"kunde",t:"Kunde",kunde:true,f:[
    {k:"ansprech",t:"text",l:"Ansprechpartner vor Ort"},
    {k:"rechnung",t:"area",l:"Rechnungsadresse (falls abweichend)"},
    {k:"kontakte",t:"area",l:"Weitere Kontakte / Bemerkungen"}]},
  {id:"objekt",t:"Objekt",f:[
    {k:"objektart",t:"seg",l:"Objektart",o:["EFH","MFH","Gewerbe","Kommune","Sonstiges"]},
    {k:"mfh",t:"seg",l:"Bereich im Mehrfamilienhaus",o:["Allgemeinbereich","Wohnung"],wenn:v=>v.objektart==="MFH"},
    {k:"wohnung",t:"text",l:"Wohnung Nr.",wenn:v=>v.objektart==="MFH"&&v.mfh==="Wohnung"},
    {k:"objektSonst",t:"text",l:"Objektart – welche?",wenn:v=>v.objektart==="Sonstiges"},
    {k:"nutzung",t:"seg",l:"Nutzung",o:["Eigennutzung","Vermietung","Leerstand"]},
    {k:"zustand",t:"chips",l:"Zustand des Gebäudes",o:["neuwertig","gepflegt","historisch gewachsen","gebastelt","gealtert","gedämmt","wird gedämmt"]},
    {k:"baujahr",t:"text",l:"Baujahr / letzte Sanierung",ph:"z. B. 1972 / Bad 2010"},
    {k:"stockwerke",t:"text",l:"Stockwerke",ph:"z. B. KG, EG, OG, DG"},
    {k:"bauart",t:"area",l:"Bauart / Besonderheiten",ph:"z. B. Holzständerwerk, Asbestverdacht"}]},
  {id:"wunsch",t:"Kundenwunsch und Aufgabe",f:[
    {k:"wunsch",t:"area",l:"Was soll gemacht werden? Offene Fragen, Klärungsbedarf",gross:true},
    {k:"rahmen",t:"chips",l:"Rahmenbedingungen",o:["Homeoffice","Kinder / Bewohner","Haustiere","feste Termine","Sonstiges"]},
    {k:"rahmenTxt",t:"text",l:"Details zu den Rahmenbedingungen",ph:"z. B. Homeoffice Mo–Mi, Hund im Garten",wenn:v=>(v.rahmen||[]).length>0},
    {k:"budget",t:"text",l:"Budget",ph:"z. B. ca. 15.000 €"},
    {k:"beginn",t:"date",l:"Wunschtermin Beginn"},
    {k:"ende",t:"date",l:"Wunschtermin Ende"},
    {k:"notizen",t:"area",l:"Notizen"}]},
  {id:"start",t:"Absprachen zum Baustellenstart",f:[
    {k:"verantw",t:"area",l:"Wer macht was? Verantwortlich",ph:"z. B. Elektro: wir · Trockenbau: Fa. Müller · Bauleitung: Architekt"},
    {k:"ansprechOk",t:"seg",l:"Ansprechpartner geklärt",o:JN},
    {k:"zeitfenster",t:"text",l:"Termine / Zeitfenster des Kunden",ph:"z. B. Zugang nur Mo–Fr 8–16 Uhr"},
    {k:"budgetOk",t:"seg",l:"Budget mit dem Kunden besprochen",o:JN}]},
  {id:"hak",t:"Hausanschluss (HAK) und Hauptzuleitung",f:[
    {k:"hakOrt",t:"text",l:"Standort HAK",ph:"z. B. Keller, Hausanschlussraum"},
    {k:"hakSich",t:"pair",l:"Sicherung im HAK",u:"A",p:["3","63"]},
    {k:"hakZust",t:"seg",l:"Zustand HAK",o:Z3},
    {k:"zuleitung",t:"pair",l:"Hauptzuleitung Adern × Querschnitt",u:"mm²",p:["5","16"]},
    {k:"leitungswege",t:"area",l:"Leitungswege / Bemerkungen"}]},
  {id:"erdung",t:"Erdungsanlage und Potentialausgleich",f:[
    {k:"erdOrt",t:"text",l:"Standort Haupterdungsschiene / Erdungsanlage"},
    {k:"erdZust",t:"seg",l:"Zustand und Ausführung",o:Z3},
    {k:"erdMess",t:"seg",l:"Erforderliche Messungen",o:["durchgeführt","veranlasst","nicht nötig"]},
    {k:"erdWert",t:"num",l:"Erdungswiderstand",u:"Ω",wenn:v=>v.erdMess==="durchgeführt"},
    {k:"blitzOk",t:"seg",l:"Blitzschutz berücksichtigt",o:JN},
    {k:"paOk",t:"seg",l:"Alle metallisch leitfähigen Teile im Potentialausgleich",o:JN},
    {k:"erdBem",t:"area",l:"Bemerkungen"}]},
  {id:"zp",t:"Zählerplatz",f:[
    {k:"zpOrt",t:"text",l:"Standort Zählerplatz"},
    {k:"zpVors",t:"pair",l:"Vorsicherung / Hauptschalter",u:"A",p:["3","35"]},
    {k:"zpUess",t:"seg",l:"Überspannungsschutz vorhanden",o:JN},
    {k:"zpArt",t:"chips",l:"Zähler",o:["Wechselstrom","Drehstrom","HT/NT","Zweirichtungszähler"]},
    {k:"zpZust",t:"seg",l:"Allgemeiner Zustand",o:Z3},
    {k:"zpRes",t:"seg",l:"Platzreserven",o:JN},
    {k:"zpResTxt",t:"text",l:"Platzreserven – Details",ph:"z. B. 1 Zählerfeld frei",wenn:v=>v.zpRes==="Ja"}]},
  {id:"uv",t:"Unterverteilungen",f:[
    {k:"uvAnz",t:"num",l:"Anzahl Unterverteilungen"},
    {k:"uvOrte",t:"area",l:"Standorte",ph:"z. B. UV-EG Flur, UV-OG Abstellraum"},
    {k:"uvBj",t:"text",l:"Baujahr / Errichtung"},
    {k:"uvZust",t:"seg",l:"Allgemeiner Zustand",o:Z3},
    {k:"uvBeschr",t:"seg",l:"Beschriftung und Dokumentation geprüft",o:J3},
    {k:"uvAbg",t:"seg",l:"Abgehende Leitungen erfasst",o:J3},
    {k:"uvUess",t:"seg",l:"Überspannungsschutz geprüft",o:JN},
    {k:"uvRes",t:"seg",l:"Platzreserven vorhanden",o:J3},
    {k:"uvBem",t:"area",l:"Bemerkungen"}]},
  {id:"raeume",t:"Arbeitsbereiche, Räume und Installationsart",f:[
    {k:"rZust",t:"seg",l:"Allgemeiner Zustand",o:Z3},
    {k:"rZug",t:"seg",l:"Zugänglichkeit, freie Arbeitsflächen",o:JN},
    {k:"staub",t:"chips",l:"Schutz gegen Schmutz und Staub",o:["Staubsauger","Luftwäscher","Staubschutzwand","Abdeckvlies selbstklebend","Abdeckvlies"]},
    {k:"vliesSk",t:"num",l:"Abdeckvlies selbstklebend",u:"m²",wenn:v=>AF_HAT(v,"staub","Abdeckvlies selbstklebend")},
    {k:"vlies",t:"num",l:"Abdeckvlies",u:"m²",wenn:v=>AF_HAT(v,"staub","Abdeckvlies")},
    {k:"instArt",t:"seg",l:"Installationsart",o:["Aufputz","Unterputz","gemischt"]},
    {k:"rBem",t:"area",l:"Räume / Bemerkungen",ph:"z. B. Küche, Bad, Wohnzimmer – Bad: Fliesen bleiben"}]},
  {id:"sicher",t:"Sicherheitstechnik, Überspannungs- und Blitzschutz",liste:["Ja","Nein","nicht vorhanden"],f:[
    {k:"sBlitz",l:"Äußerer Blitzschutz berücksichtigt"},{k:"sUess",l:"Überspannungsableiter an Zählerplatz / UV"},{k:"sRwm",l:"Rauchwarnmelder"},
    {k:"sBrand",l:"Brandabschottungen"},{k:"sFlucht",l:"Fluchtwegbeleuchtung"},{k:"sEma",l:"Einbruchmeldeanlage"}]},
  {id:"huelle",t:"Gebäudehülle",liste:["Ja","Nein","wird ausgeführt"],f:[
    {k:"hWdvs",l:"Gebäude gedämmt (WDVS)"},{k:"hFenster",l:"Fenster neu"},{k:"hTuer",l:"Haustür neu"},{k:"hRoll",l:"Rollläden / Jalousien neu"}]},
  {id:"fotos",t:"Fotodokumentation",fotos:true,f:[
    {k:"fZp",l:"Zählerplatz und Zähler – mit und ohne Abdeckung"},{k:"fHak",l:"Hausanschlusskasten – geöffnet und geschlossen"},
    {k:"fErd",l:"Erdungsanlage und Potentialausgleich"},{k:"fUv",l:"Unterverteilungen – mit und ohne Abdeckung"},
    {k:"fRaum",l:"Arbeitsbereiche / Räume mit Installationsart"},{k:"fMangel",l:"Erkennbare Mängel / Besonderheiten"}]},
  {id:"doku",t:"Abschlusskontrolle",liste:["Ja","Nein","noch zu klären"],f:[
    {k:"dKunde",l:"Kundendaten vollständig"},{k:"dArbeit",l:"Arbeitsbeschreibung erstellt"},{k:"dTermin",l:"Wunschtermin Beginn / Ende erfasst"},
    {k:"dPlaene",l:"Grundrisse / Schaltpläne / Datenblätter erfasst"},{k:"dGewerke",l:"Schnittstellen zu anderen Gewerken erfasst"},
    {k:"dOffen",l:"Offene Punkte dokumentiert"},{k:"dMaengel",l:"Erkennbare Mängel definiert und bewertet"},{k:"dKundeDurch",l:"Dokumentation mit dem Kunden durchgegangen"}]},
  {id:"bem",t:"Bemerkungen",f:[{k:"bem",t:"area",l:"Bemerkungen",gross:true}]},
  {id:"abschluss",t:"Abschluss",sig:true,f:[]}
];
const AF_FOTO_MAX=2;
const afDaten=b=>{ if(!b.aufnahme) b.aufnahme={v:{},fotos:{}}; const a=b.aufnahme; a.v=a.v||{}; a.fotos=a.fotos||{}; return a; };
const afSichtbar=(f,v)=>!f.wenn||f.wenn(v);
const afVoll=x=>Array.isArray(x)?x.length>0:x!=null&&String(x).trim()!==""&&!(typeof x==="object"&&!Array.isArray(x)&&!Object.values(x).some(y=>String(y||"").trim()));
function afStand(sec,a){ if(sec.sig) return [a.sig?1:0,1]; const F=sec.f.filter(f=>afSichtbar(f,a.v)); return [F.filter(f=>afVoll(a.v[f.k])||(sec.fotos&&(a.fotos[f.k]||[]).length)).length,F.length]; }
function afGesamt(b){ const a=afDaten(b); let n=0,m=0; AUFN.forEach(s=>{ const [x,y]=afStand(s,a); n+=x; m+=y; }); return [n,m]; }
const afFotoIds=b=>b&&b.aufnahme?Object.values(b.aufnahme.fotos||{}).flat():[];

function afFeld(f,v,ro){
  const val=v[f.k], id="af_"+f.k, dis=ro?" disabled":"";
  if(f.t==="text"||f.t==="date"||f.t==="num"){
    const typ=f.t==="date"?"date":"text", im=f.t==="num"?' inputmode="decimal"':"";
    return `<div class="tf fl${f.u?" has-sfx":""}"><input id="${id}" data-af="${f.k}" type="${typ}"${im} value="${esc(val||"")}" placeholder="${esc(f.ph||" ")}" autocomplete="off"${dis}><label for="${id}">${esc(f.l)}</label>${f.u?`<span class="sfx">${esc(f.u)}</span>`:""}</div>`; }
  if(f.t==="area") return `<div class="tf fl full${f.gross?" gross":""}"><textarea id="${id}" data-af="${f.k}" placeholder="${esc(f.ph||" ")}"${dis}>${esc(val||"")}</textarea><label for="${id}">${esc(f.l)}</label></div>`;
  if(f.t==="pair"){ const p=val||{}; return `<div class="af-pair"><div class="lbl">${esc(f.l)}</div><div class="af-pair-f">
      <div class="tf"><input data-af="${f.k}" data-af2="a" inputmode="numeric" value="${esc(p.a||"")}" placeholder="${esc(f.p[0])}" aria-label="${esc(f.l)} Anzahl"${dis}></div><span class="af-x">×</span>
      <div class="tf has-sfx"><input data-af="${f.k}" data-af2="b" inputmode="decimal" value="${esc(p.b||"")}" placeholder="${esc(f.p[1])}" aria-label="${esc(f.l)} Wert"${dis}><span class="sfx">${esc(f.u)}</span></div></div></div>`; }
  if(f.t==="seg") return `<div class="af-seg full"><div class="lbl">${esc(f.l)}</div>${seg("afSeg",val||"",f.o.map(o=>[o,o])).replace(/data-act="afSeg"/g,`data-act="afSeg" data-k="${f.k}"${dis}`)}</div>`;
  if(f.t==="chips") return `<div class="af-seg full"><div class="lbl">${esc(f.l)}</div><div class="chips af-chips">${f.o.map(o=>`<button type="button" class="chip" data-act="afChip" data-k="${f.k}" data-v="${esc(o)}" aria-pressed="${AF_HAT(v,f.k,o)}"${dis}>${esc(o)}</button>`).join("")}</div></div>`;
  return "";
}
function afFotos(k,a,ro){ const ids=a.fotos[k]||[];
  return `<div class="af-fotos">${ids.map(id=>{ const src=fotoCache.get(id); return src?`<button class="foto" data-act="afFotoZeig" data-k="${k}" data-id="${id}" aria-label="Foto ansehen"><img src="${src}" alt=""></button>`:`<div class="foto leer">${icon("sync")}</div>`; }).join("")}
    ${!ro&&ids.length<AF_FOTO_MAX?`<button class="foto leer" data-act="afFoto" data-k="${k}" aria-label="Foto aufnehmen">${icon("cam")}</button>`:""}</div>`; }
function aufnahmeView(b){
  const a=afDaten(b), v=a.v, ro=!canEdit(b), [n,m]=afGesamt(b), k=kundeOf(b.kundeId), s=ortVon(b);
  if(!v.datum&&!ro){ v.datum=today(); v.von=v.von||who().name; if(s&&s.ansprech&&!v.ansprech) v.ansprech=s.ansprech; }
  let h=`<div class="af-kopf"><div class="af-bar"><i style="width:${m?Math.round(n/m*100):0}%"></i></div><span>${n} von ${m} Angaben</span>
    ${a.pdf&&a.pdf.length?`<span class="af-pdfinfo">${icon("folder")}Zuletzt gespeichert ${esc(new Date(a.pdf[a.pdf.length-1].at).toLocaleString("de-DE",{dateStyle:"short",timeStyle:"short"}))}</span>`:""}</div>`;
  h+=`<div class="af-grid">`;
  for(const sec of AUFN){ const [x,y]=afStand(sec,a);
    const kl=x===0?"open":x>=y?"ok":"wip", pl=`<span class="pill ${kl}" data-afp="${sec.id}">${x} / ${y}</span>`;
    h+=`<section class="card af-sec${sec.liste||sec.fotos?" wide":""}" data-afs="${sec.id}"><div class="af-h"><h3>${esc(sec.t)}</h3>${pl}</div>`;
    if(sec.kunde) h+=`<div class="af-kd">${icon("firma")}<div><b>${esc(k?k.name:"Ohne Kunde")}</b><span>${esc([s&&s.name,s&&[s.strasse,[s.plz,s.ort].filter(Boolean).join(" ")].filter(Boolean).join(", ")].filter(Boolean).join(" · "))}</span><span>${esc([k&&k.tel,k&&k.mail].filter(Boolean).join(" · "))}</span></div></div>`;
    if(sec.liste) h+=`<div class="af-liste">${sec.f.map(f=>`<div class="af-row"><span>${esc(f.l)}</span>${seg("afSeg",v[f.k]||"",sec.liste.map(o=>[o,o])).replace(/data-act="afSeg"/g,`data-act="afSeg" data-k="${f.k}"${ro?" disabled":""}`)}</div>`).join("")}</div>`;
    else if(sec.fotos) h+=`<p class="sup">Abhaken, ob fotografiert wurde. Fotos direkt hier anhängen ist optional – je Punkt höchstens ${AF_FOTO_MAX}, nur was für Angebot und Planung wichtig ist.</p><div class="af-liste">${sec.f.map(f=>`<div class="af-row af-frow"><span>${esc(f.l)}</span><div class="af-fr">${seg("afSeg",v[f.k]||"",[["Ja","Ja"],["Nein","Nein"]]).replace(/data-act="afSeg"/g,`data-act="afSeg" data-k="${f.k}"${ro?" disabled":""}`)}${afFotos(f.k,a,ro)}</div></div>`).join("")}</div>`;
    else if(sec.sig) h+=`<div class="af-sig">${a.sig?`<img src="${a.sig}" alt="Unterschrift"><span>${esc(a.sigName||"")} · ${esc(deDate(a.sigDatum||""))}</span>`:`<span class="meta">Noch nicht unterschrieben.</span>`}
        ${ro?"":`<button class="btn-tonal" data-act="afSig">${icon("edit")}${a.sig?"Neu unterschreiben":"Unterschreiben (Monteur)"}</button>`}</div>`;
    else h+=`<div class="fg">${sec.f.filter(f=>afSichtbar(f,v)).map(f=>afFeld(f,v,ro)).join("")}</div>`;
    h+=`</section>`; }
  const P=(typeof PROT_B==="function"?PROT_B():[]).filter(x=>x.baustelleId===b.id);
  h+=`</div><div class="af-fuss"><span class="meta">${P.length?`${P.length} Fassung${P.length>1?"en":""} in der Bibliothek`:"Eingaben werden automatisch gesichert."}</span>${ro?"":`<button class="btn-filled" data-act="afPdf">${icon("done")}Speichern</button>`}</div>`;
  return h;
}
let afT=null;
function afSpeichern(b,sofort){ clearTimeout(afT); const go=()=>{ saveRec("baustellen",b); }; if(sofort) go(); else afT=setTimeout(go,700); }
function afPillsAktual(b){ const a=afDaten(b); AUFN.forEach(sec=>{ const e=document.querySelector(`[data-afp="${sec.id}"]`); if(!e) return; const [x,y]=afStand(sec,a); e.textContent=`${x} / ${y}`; e.className=`pill ${x===0?"open":x>=y?"ok":"wip"}`; });
  const [n,m]=afGesamt(b), bar=document.querySelector(".af-bar i"), t=document.querySelector(".af-kopf > span"); if(bar) bar.style.width=(m?Math.round(n/m*100):0)+"%"; if(t) t.textContent=`${n} von ${m} Angaben`; }
const afB=()=>nav.v==="baustelle"&&nav.tab==="aufnahme"?DB.baustellen.get(nav.id):null;
document.addEventListener("input",e=>{ const el=e.target.closest&&e.target.closest("[data-af]"); if(!el) return; const b=afB(); if(!b||!canEdit(b)) return; const a=afDaten(b), k=el.dataset.af;
  if(el.dataset.af2){ a.v[k]=Object.assign({},a.v[k],{[el.dataset.af2]:el.value}); } else a.v[k]=el.value;
  afSpeichern(b); afPillsAktual(b); });
document.addEventListener("click",e=>{ const el=e.target.closest&&e.target.closest('[data-act^="af"]'); if(!el) return; const b=afB(); if(!b) return; const a=afDaten(b), k=el.dataset.k, act=el.dataset.act;
  if(act==="afFotoZeig"){ e.stopPropagation(); dialog("Foto",`<img class="dimg" src="${fotoCache.get(el.dataset.id)}" alt="">`,canEdit(b)?`<button class="btn-text danger" data-act="afFotoWeg" data-k="${k}" data-id="${el.dataset.id}">Löschen</button><span style="flex:1"></span><button class="btn-text" data-act="cancel">Schließen</button>`:`<button class="btn-text" data-act="cancel">Schließen</button>`); return; }
  if(act==="afPdf"){ e.stopPropagation(); afPdf(b); return; }
  if(!canEdit(b)) return; e.stopPropagation();
  if(act==="afSeg"){ a.v[k]=a.v[k]===el.dataset.v?"":el.dataset.v; afSpeichern(b,true); const y=scrollY; render(); scrollTo(0,y); return; }
  if(act==="afChip"){ const L=new Set(a.v[k]||[]); L.has(el.dataset.v)?L.delete(el.dataset.v):L.add(el.dataset.v); a.v[k]=[...L]; afSpeichern(b,true); const y=scrollY; render(); scrollTo(0,y); return; }
  if(act==="afFoto"){ afFotoZiel=k; $("#afFotoIn").click(); return; }
  if(act==="afFotoWeg"){ closeOverlays(); a.fotos[k]=(a.fotos[k]||[]).filter(x=>x!==el.dataset.id); fotoDel([el.dataset.id]); afSpeichern(b,true); const y=scrollY; render(); scrollTo(0,y); return; }
  if(act==="afSig"){ afUnterschrift(b); return; }
},true);
let afFotoZiel=null;
document.addEventListener("change",async e=>{ if(e.target.id!=="afFotoIn") return; const el=e.target, f=el.files[0]; el.value=""; const b=afB(); if(!f||!b||!afFotoZiel) return;
  let data; try{ data=await fotoVerkleinern(f); }catch(x){ toast("Das Bild konnte nicht gelesen werden"); return; }
  const a=afDaten(b), id=uid(), ok=await fotoPut(id,data); a.fotos[afFotoZiel]=[...(a.fotos[afFotoZiel]||[]),id].slice(0,AF_FOTO_MAX); fotoQueue(id);
  const sec=AUFN.find(s=>s.fotos); if(sec&&!a.v[afFotoZiel]) a.v[afFotoZiel]="Ja";
  afSpeichern(b,true); const y=scrollY; render(); scrollTo(0,y); if(!ok) toast("Foto nur bis zum Schließen der App gespeichert – Speicher nicht verfügbar"); });

/* Unterschrift */
function afUnterschrift(b){
  const a=afDaten(b), nm=a.v.von||who().name||"";
  const el=document.createElement("div"); el.className="af-sigvoll";
  el.innerHTML=`<div class="af-sigk"><button class="btn-text" data-s="weg">Abbrechen</button><b>Unterschrift Monteur</b><button class="btn-text" data-s="leer">Löschen</button><button class="btn-filled sm" data-s="ok">Übernehmen</button></div>
    <div class="af-sigf"><canvas></canvas><div class="af-sigl"></div><p>${esc(nm)}${nm?" · ":""}mit dem Finger oder Stift unterschreiben</p></div>`;
  document.body.appendChild(el); document.body.style.overflow="hidden";
  const c=el.querySelector("canvas"), dpr=devicePixelRatio||1; c.width=c.offsetWidth*dpr; c.height=c.offsetHeight*dpr;
  const x=c.getContext("2d"); x.lineWidth=2.8*dpr; x.lineCap="round"; x.lineJoin="round"; x.strokeStyle="#14202c";
  let an=false,last=null,tinte=false; const pos=ev=>{ const r=c.getBoundingClientRect(); return [(ev.clientX-r.left)*dpr,(ev.clientY-r.top)*dpr]; };
  c.addEventListener("pointerdown",ev=>{ an=true; last=pos(ev); c.setPointerCapture(ev.pointerId); ev.preventDefault(); });
  c.addEventListener("pointermove",ev=>{ if(!an) return; const p=pos(ev); x.beginPath(); x.moveTo(...last); x.lineTo(...p); x.stroke(); last=p; tinte=true; });
  c.addEventListener("pointerup",()=>an=false); c.addEventListener("pointercancel",()=>an=false);
  const zu=()=>{ el.remove(); document.body.style.overflow=""; };
  el.addEventListener("click",ev=>{ const s=ev.target.closest("[data-s]"); if(!s) return; ev.stopPropagation();
    if(s.dataset.s==="weg") zu(); else if(s.dataset.s==="leer"){ x.clearRect(0,0,c.width,c.height); tinte=false; }
    else { if(!tinte){ toast("Bitte erst unterschreiben"); return; }
      const o=document.createElement("canvas"); o.width=c.width; o.height=c.height; const ox=o.getContext("2d"); ox.fillStyle="#fff"; ox.fillRect(0,0,o.width,o.height); ox.drawImage(c,0,0);
      a.sig=o.toDataURL("image/jpeg",0.8); a.sigName=nm; a.sigDatum=today(); afSpeichern(b,true); zu(); const y=scrollY; render(); scrollTo(0,y); toast("Unterschrift übernommen"); } }); }

/* PDF */
const AF_PDFMAP={"²":"2","³":"3","≈":"ca.","Ω":"Ohm","≤":"<=","≥":">=","→":"->","–":"-","…":"...","·":"|","„":"\"","“":"\"","×":"x"};
const afPt=s=>String(s??"").replace(/[²³≈Ω≤≥→–…·„“×]/g,c=>AF_PDFMAP[c]);
function afWert(f,v){ const x=v[f.k]; if(f.t==="pair") return x&&(x.a||x.b)?`${x.a||"?"} × ${x.b||"?"} ${f.u}`:""; if(Array.isArray(x)) return x.join(", "); if(f.t==="date") return deDate(x||""); return x?`${x}${f.u?" "+f.u:""}`:""; }
async function afPdf(b){
  if(!window.jspdf){ toast("PDF-Erstellung nicht geladen"); return; }
  const a=afDaten(b), v=a.v, ids=afFotoIds(b), fehlt=ids.filter(id=>!fotoCache.has(id));
  if(fehlt.length){ fotoFetch(fehlt); toast("Fotos werden noch geladen – gleich noch einmal tippen"); return; }
  const k=kundeOf(b.kundeId), s=ortVon(b);
  const {jsPDF}=window.jspdf, d=new jsPDF({unit:"mm",format:"a4"}), W=210,M=14,CW=W-2*M, SIG=[225,29,47],GR=[93,107,123],LINE=[211,218,227],SUNK=[238,241,245];
  let y=0;
  const head=()=>{ try{ d.addImage(LOGO_PDF,"PNG",M,6,57,10); }catch(e){}
    d.setTextColor(34,34,34); d.setFont("helvetica","bold"); d.setFontSize(13); d.text("Aufnahmeprotokoll",W-M,11,{align:"right"});
    d.setFont("helvetica","normal"); d.setFontSize(8); d.setTextColor(...GR); d.text(afPt([k&&k.name,b.name].filter(Boolean).join(" | ")).slice(0,95),W-M,17,{align:"right"});
    d.setFillColor(...SIG); d.rect(0,24,W,1.4,"F"); y=34; };
  const neu=()=>{ d.addPage(); head(); };
  const platz=h=>{ if(y+h>280) neu(); };
  const sec=t=>{ platz(16); d.setFillColor(...SUNK); d.rect(M,y-4.5,CW,7,"F"); d.setFillColor(...SIG); d.rect(M,y-4.5,1.2,7,"F"); d.setTextColor(34,34,34); d.setFont("helvetica","bold"); d.setFontSize(9.5); d.text(afPt(t),M+4,y); y+=8; };
  const kv=prs=>{ const cw=CW/2; d.setFontSize(8.5); for(let i=0;i<prs.length;i+=2){ let n=1; const zeilen=[];
      for(let c=0;c<2&&i+c<prs.length;c++){ d.setFont("helvetica","bold"); const l=d.splitTextToSize(afPt(prs[i+c][1]||"-"),cw-50); d.setFont("helvetica","normal"); const lb=d.splitTextToSize(afPt(prs[i+c][0]),45); zeilen.push([lb,l]); n=Math.max(n,l.length,lb.length); }
      platz(n*3.7+4);
      for(let c=0;c<zeilen.length;c++){ const x=M+c*cw; d.setFont("helvetica","normal"); d.setTextColor(...GR); d.text(zeilen[c][0],x,y,{lineHeightFactor:1.15}); d.setFont("helvetica","bold"); d.setTextColor(20); d.text(zeilen[c][1],x+48,y,{lineHeightFactor:1.15}); }
      const ex=(n-1)*3.7; d.setDrawColor(...LINE); d.line(M,y+ex+1.9,M+CW,y+ex+1.9); y+=ex+6.1; } y+=2; };
  const lang=(l,t)=>{ if(!String(t||"").trim()) return; d.setFontSize(8.5); const z=d.splitTextToSize(afPt(t),CW); platz(z.length*4+8); d.setFont("helvetica","normal"); d.setTextColor(...GR); d.text(afPt(l),M,y); y+=4.2; d.setTextColor(20); d.text(z,M,y); y+=z.length*4+3; };
  head();
  sec("Kunde und Objekt");
  kv([["Kunde",k&&k.name],["Objekt",[s&&s.name,s&&[s.strasse,[s.plz,s.ort].filter(Boolean).join(" ")].filter(Boolean).join(", ")].filter(Boolean).join(", ")],["Telefon",k&&k.tel],["E-Mail",k&&k.mail],["Baustelle",b.name],["Auftrag",b.auftragsnr]]);
  for(const S of AUFN){ if(S.sig||S.kunde&&false) continue;
    const F=S.f.filter(f=>afSichtbar(f,v));
    if(S.liste){ const R=F.filter(f=>v[f.k]); if(!R.length) continue; sec(S.t); kv(R.map(f=>[f.l,v[f.k]])); continue; }
    if(S.fotos){ const R=F.filter(f=>v[f.k]||(a.fotos[f.k]||[]).length); if(!R.length) continue; sec(S.t);
      for(const f of R){ const L=a.fotos[f.k]||[]; d.setFontSize(8.5); platz(L.length?52:8); d.setFont("helvetica","normal"); d.setTextColor(...GR); d.text(afPt(f.l),M,y); d.setFont("helvetica","bold"); d.setTextColor(20); d.text(afPt(L.length?`${L.length} Foto${L.length>1?"s":""}`:(v[f.k]||"-")),M+CW,y,{align:"right"}); y+=3;
        if(L.length){ let x=M; for(const id of L){ const src=fotoCache.get(id); try{ const p=d.getImageProperties(src), h=44, w=Math.min(80,h*p.width/p.height); d.addImage(src,"JPEG",x,y,w,h); x+=w+4; }catch(e){} } y+=48; } else y+=3; }
      y+=2; continue; }
    const kurz=F.filter(f=>f.t!=="area"&&afWert(f,v)), lg=F.filter(f=>f.t==="area"&&String(v[f.k]||"").trim());
    if(!kurz.length&&!lg.length) continue; sec(S.t); if(kurz.length) kv(kurz.map(f=>[f.l,afWert(f,v)])); lg.forEach(f=>lang(f.l,v[f.k])); }
  sec("Abschluss / Freigabe"); platz(34);
  if(a.sig){ try{ d.addImage(a.sig,"JPEG",M,y,60,22); }catch(e){} }
  d.setDrawColor(150); d.line(M,y+24,M+80,y+24); d.setFont("helvetica","normal"); d.setFontSize(8); d.setTextColor(...GR);
  d.text(afPt(`Monteur / Mitarbeiter: ${a.sigName||v.von||""}`),M,y+28); d.text(afPt(`Datum: ${deDate(a.sigDatum||v.datum||"")}`),M+100,y+28); y+=34;
  const N=d.getNumberOfPages(); for(let i=1;i<=N;i++){ d.setPage(i); d.setDrawColor(...LINE); d.line(M,284,W-M,284); d.setFont("helvetica","normal"); d.setFontSize(7); d.setTextColor(...GR);
    d.text("Elektro Irrgang | Hahner Weg 2 | 51545 Waldbröl | Tel. 02291 4878 | info@elektro-irrgang.de",M,288);
    d.text(afPt(`Aufnahme vom ${deDate(v.datum||"")}${b.auftragsnr?` | Auftrag ${b.auftragsnr}`:""}`),M,292); d.text(`Seite ${i} von ${N}`,W-M,292,{align:"right"}); }
  const blob=d.output("blob"), name=afPt(`Aufnahme ${deDate(v.datum||today())} ${k?k.name:""} ${b.name}`).replace(/[\\/:*?"<>|]+/g," ").replace(/\s+/g," ").trim();
  a.pdf=[...(a.pdf||[]),{at:Date.now(),von:who().name}]; afSpeichern(b,true);
  const fz=PROT_B().filter(x=>x.baustelleId===b.id).length+1;
  let x=null; try{ x=await protAblegenB({art:"Aufnahmeprotokoll",titel:[k&&k.name,b.name].filter(Boolean).join(" · "),name,datum:v.datum||today(),auftragsnr:b.auftragsnr||"",
    baustelleId:b.id,kundeId:b.kundeId||"",standortId:b.standortId||"",fassung:fz,unterschrift:!!a.sig,demo:!!b.demo},blob); }catch(e){}
  const y0=scrollY; render(); scrollTo(0,y0);
  if(x) toast(fz>1?`Gespeichert – Fassung ${fz} liegt in der Bibliothek`:"Gespeichert – das Protokoll liegt in der Bibliothek","Ansehen",()=>pvOeffnen(x.id)); else toast("Gespeichert. Ablage in der Bibliothek fehlgeschlagen");
}
