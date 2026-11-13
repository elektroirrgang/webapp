/* Kundenansicht – gemeinsam für Übersicht, EVSE, Baustelle und E-Check (tools/build.py setzt es ein).
   Eckdaten mit Schnellknöpfen, kleine Karte mit Anhaltspunkten, Ansprechpartner mit Rolle.
   kdOben(r,kind,ss) = Eckdaten + Karte; kontakteView(kind,r); Ablage kommt aus dateien.js. */
function infoKarte(r,kind){
  const T=kind==="kunden"?telefoneVon(r):(r.tel?[{art:"Telefon vor Ort",nr:r.tel}]:[]);
  const adr=adrText(r), tel=T.length&&T[0].nr.replace(/[^\d+]/g,""), vorschlag=kind==="kunden"&&!r.web?webVorschlag(r):"";
  const qa=(href,ic,t,act)=>`<${href?`a href="${href}"${/^https/.test(href)?' target="_blank" rel="noopener"':""}`:`button type="button" data-act="${act}"`} class="qa"><span class="qa-ic">${icon(ic)}</span><span>${t}</span></${href?"a":"button"}>`;
  const aktionen=[tel&&qa("tel:"+tel,"phone","Anrufen"),r.mail&&qa("mailto:"+r.mail,"mail","E-Mail"),(r.park_lat&&typeof parkRouteHref==="function"?qa(parkRouteHref(r),"route","Route"):adr&&qa(mapsHref(adr),"route","Route")),
    kind==="kunden"&&(r.web?qa(webHref(r.web),"globe","Webseite"):kdArt(r)==="privat"?"":vorschlag?qa(webHref(vorschlag),"globe","Webseite"):canEdit(r)?qa("","search","Webseite suchen","webSuchen"):""),
    typeof nav!=="undefined"&&nav.id===r.id&&kdDarf(r)&&qa("","edit","Bearbeiten","editLoc")].filter(Boolean);
  /* Eckdaten nur zum Lesen – Anrufen, E-Mail, Route und Webseite gibt es oben als Knöpfe */
  const z=(ic,l,v)=>v?`<div class="dz"><span class="dz-ic">${icon(ic)}</span><span class="dz-t"><small>${l}</small><span>${esc(v)}</span></span></div>`:"";
  const art=kind==="kunden"?`${KD_ART_LANG[kdArt(r)]}${r.art?"":" (vorgeschlagen)"}${kdArt(r)==="privat"&&kdAnrede(r)?` · ${kdAnrede(r)} ${r.nachname||""}`.trimEnd():""}`:"";
  const zeilen=[z("firma","Kundenart",art),z("tag","Kundennummer",r.kdnr),z("ort","Adresse",adr),
    T.map(x=>`<a class="dz dz-tel" href="tel:${esc(x.nr.replace(/[^\d+]/g,""))}"><span class="dz-ic">${icon("phone")}</span><span class="dz-t"><small>${esc(T.length>1||kind!=="kunden"?x.art:"Telefon · "+x.art)}</small><span>${esc(x.nr)}</span></span></a>`).join(""),z("mail","E-Mail",r.mail),
    z("globe",r.web?"Webseite":"Webseite (aus der E-Mail-Adresse)",r.web?webText(r.web):vorschlag),z("notes","Notiz",r.notiz),typeof parkZeile==="function"?parkZeile(r,kind):""].join("");
  if(!aktionen.length&&!zeilen) return "";
  return `<div class="infok2">${aktionen.length?`<div class="qa-row">${aktionen.join("")}</div>`:""}${zeilen?`<div class="dz-list">${zeilen}</div>`:""}</div>`;
}
/* Kunden und Standorte pflegen: Chef/Admin und Büro */
const kdDarf=r=>!!(ME.admin||ME.buero||(r&&canEdit(r)));

/* ===== Ansprechpartner: mehrere Personen je Kunde/Standort, jeweils mit Rolle =====
   r.kontakte=[{id,rolle,name,tel,mail,notiz}]. Das alte Feld „ansprech“ bleibt als erster Name gefüllt, damit EVSE & Co. es weiter anzeigen. */
const KT_ROLLEN=["Inhaber","Geschäftsführung","Ansprechpartner","Hausmeister","Pförtner","Bauleitung","Buchhaltung","Mieter"];
function kontakteVon(r){ const L=(r.kontakte||[]).filter(x=>x&&(x.name||x.tel||x.mail)); return L.length||!r.ansprech?L:[{id:"alt",rolle:"Ansprechpartner",name:r.ansprech}]; }
function kontakteView(kind,r){
  const L=kontakteVon(r), darf=kdDarf(r);
  if(!L.length&&!darf) return "";
  const zeile=x=>{ const T=telefoneVon(x), tel=T.length&&T[0].nr.replace(/[^\d+]/g,"");
    return `<div class="kt-z"><button class="kt-haupt" ${darf?`data-act="ktEdit" data-kind="${kind}" data-k="${esc(x.id)}"`:"disabled"}><span class="kt-av">${esc(initials(x.name||x.rolle||"?"))}</span>
      <span class="kt-t"><b>${esc(x.name||"Ohne Namen")}</b><small>${esc([x.rolle,...T.map(t=>T.length>1?`${t.art} ${t.nr}`:t.nr),x.mail].filter(Boolean).join(" · "))}</small></span></button>
      ${T.length>1?`<button class="kt-b" data-act="ktAnruf" data-kind="${kind}" data-r="${esc(r.id)}" data-k="${esc(x.id)}" aria-label="${esc(x.name||"")} anrufen" title="Anrufen">${icon("phone")}</button>`:tel?`<a class="kt-b" href="tel:${tel}" aria-label="${esc(x.name||"")} anrufen" title="Anrufen">${icon("phone")}</a>`:""}${x.mail?`<a class="kt-b" href="mailto:${esc(x.mail)}" aria-label="E-Mail an ${esc(x.name||"")}" title="E-Mail">${icon("mail")}</a>`:""}</div>`; };
  return `<div class="kt-box"><div class="sec-row"><div class="sec-lbl">Ansprechpartner</div>${darf?`<span class="ab-btns"><button class="ab-ic" data-act="ktNeu" data-kind="${kind}" aria-label="Ansprechpartner hinzufügen" title="Ansprechpartner hinzufügen">${icon("add")}</button></span>`:""}</div>
    ${L.length?`<div class="kt-liste">${L.map(zeile).join("")}</div>`:`<p class="meta">Noch keine Ansprechpartner.</p>`}</div>`;
}
let ktForm=null;
function ktDialog(kind,r,x){
  ktForm={kind,rid:r.id,id:x&&x.id};
  const v=x||{rolle:kontakteVon(r).length?"":"Ansprechpartner"};
  dialog(x?"Ansprechpartner bearbeiten":"Ansprechpartner hinzufügen",`<div class="fg1">
    <div class="reihe2">${tf("ktName","Name",v.name,{form:true,ph:"z. B. Frau Schulte"})}${tf("ktRolle","Rolle",v.rolle,{form:true,list:"dl-ktr",ph:"z. B. Inhaber, Pförtner"})}</div>${datalist("dl-ktr",KT_ROLLEN)}
    <div class="kt-chips">${KT_ROLLEN.map(t=>`<button type="button" class="chip" data-act="ktRolleWahl" data-v="${esc(t)}">${esc(t)}</button>`).join("")}</div>
    <div class="reihe2">${tf("ktTel","Telefon",v.tel,{form:true,type:"tel"})}${tf("ktMail","E-Mail",v.mail,{form:true,type:"email"})}</div>
    ${tf("ktNotiz","Notiz",v.notiz,{form:true,ph:"z. B. erreichbar Mo–Fr vormittags"})}</div>`,
    `${x?`<button class="btn-text danger" data-act="ktDel">Entfernen</button>`:""}<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="ktSave">Speichern</button>`,{breit:true});
  telFelder(document.getElementById("dlg"),v,"ktTel","ktTelefone");
}
function ktSpeichern(del){
  const P=ktForm; if(!P) return; const r=DB[P.kind].get(P.rid); if(!r) return;
  let L=(r.kontakte||[]).slice(); if(!L.length&&r.ansprech) L=[{id:uid(),rolle:"Ansprechpartner",name:r.ansprech}];
  const id=P.id==="alt"?(L[0]&&L[0].id):P.id;
  if(del) L=L.filter(x=>x.id!==id);
  else { telSammeln(document.getElementById("dlg")); const F=formVals(); let T=[]; try{ T=F.ktTelefone?JSON.parse(F.ktTelefone):[]; }catch(e){}
    const x={id:id||uid(),name:F.ktName,rolle:F.ktRolle,tel:F.ktTel,telefone:T,mail:F.ktMail,notiz:F.ktNotiz};
    if(!x.name&&!x.tel&&!x.mail){ toast("Bitte mindestens Name, Telefon oder E-Mail eintragen"); return; }
    const i=L.findIndex(y=>y.id===x.id); if(i>=0) L[i]=x; else L.push(x); }
  r.kontakte=L; const h=L.find(x=>/ansprech/i.test(x.rolle||""))||L[0]; r.ansprech=h?h.name||"":"";
  saveRec(P.kind,r); ktForm=null; closeOverlays(); render(); toast(del?"Ansprechpartner entfernt":"Ansprechpartner gespeichert");
}

/* ===== Kleine Karte =====
   Moderne Vektorkarte (MapLibre + OpenFreeMap, kostenlos, ohne Schlüssel), hell/dunkel passend zum Design.
   Nur zum Anschauen: kein Zoomen/Verschieben, damit Scrollen über der Karte die Seite scrollt.
   Adresse → Koordinaten über Nominatim (OpenStreetMap); jedes Gerät merkt sich das Ergebnis (META.geo).
   Die Karte bleibt beim Neuzeichnen der Seite erhalten (kein Flackern), Ortswechsel schwenkt nur um. */
let karteWahl={};
const KARTE={el:null,map:null,mk:null,stil:"",lib:null};
const kDunkel=()=>{ const t=document.documentElement.dataset.theme; return t?t==="dark":matchMedia("(prefers-color-scheme: dark)").matches; };
function karteOrte(r,ss){ const o=[]; const a=adrText(r); if(a) o.push({id:r.id,t:ss.length?"Hauptsitz":"Adresse",a});
  ss.forEach(x=>{ const b=adrText(x); if(b&&!o.some(y=>y.a===b)) o.push({id:x.id,t:x.name||"Standort",a:b}); }); return o; }
function karteView(r,ss){
  const O=karteOrte(r,ss); if(!O.length) return `<div class="kd-karte leer"><span class="kd-lade">${icon("ort")}<span>Keine Adresse hinterlegt</span></span></div>`;
  const w=O.find(x=>x.id===karteWahl[r.id])||O[0]; KARTE.orte=KARTE.orte||{}; KARTE.orte[r.id]=O;
  setTimeout(()=>karteLaden(w.a),0);
  return `<div class="kd-karte" id="kdKarte" data-a="${esc(w.a)}" data-id="${esc(w.id)}"><div class="kd-slot"></div><span class="kd-lade">${icon("ort")}</span><button class="kd-zentr" data-act="karteZentr" hidden title="Zurück zum Ort" aria-label="Zurück zum Ort"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg></button>
    ${O.length>2?`<div class="kd-orte"><button class="kd-ort kd-ortwahl" data-act="karteOrtMenu" data-r="${esc(r.id)}" aria-pressed="true" aria-haspopup="menu" title="Standort wählen"><span>${esc(w.t)}</span><em>${O.indexOf(w)+1}/${O.length}</em><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg></button></div>`
      :O.length>1?`<div class="kd-orte">${O.map(x=>`<button class="kd-ort" data-act="karteOrt" data-r="${esc(r.id)}" data-id="${esc(x.id)}" aria-pressed="${x===w}">${esc(x.t)}</button>`).join("")}</div>`:""}</div>`;
}
function karteLib(){
  if(window.maplibregl) return Promise.resolve();
  if(KARTE.lib) return KARTE.lib;
  KARTE.lib=new Promise((ok,no)=>{ const c=document.createElement("link"); c.rel="stylesheet"; c.href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css"; document.head.appendChild(c);
    const j=document.createElement("script"); j.src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"; j.onload=ok; j.onerror=()=>{ KARTE.lib=null; no(); }; document.head.appendChild(j); });
  return KARTE.lib;
}
async function karteGeo(a){
  META.geo=META.geo||{}; if(META.geo[a]) return META.geo[a];
  const r=await fetch("https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=de&accept-language=de&q="+encodeURIComponent(a)); const j=await r.json();
  const g=j&&j[0]?{lat:+j[0].lat,lon:+j[0].lon}:{nix:1}; META.geo[a]=g; metaSave(); return g;
}
const karteFehler=(el,t)=>{ const l=el.querySelector(".kd-lade"); if(l){ l.innerHTML=`${icon("ort")}<span>${esc(t)}</span>`; l.hidden=false; } };
/* Kartenstile: hell = farbige Karte (OpenFreeMap „Liberty“), dunkel = Luftbild (Esri World Imagery) */
const karteStil=st=>st==="satellit"?{version:8,sources:{sat:{type:"raster",tileSize:256,maxzoom:19,tiles:["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
  attribution:"Luftbild © Esri, Maxar, Earthstar Geographics"}},layers:[{id:"sat",type:"raster",source:"sat",paint:{"raster-brightness-max":.92}}]}:"https://tiles.openfreemap.org/styles/"+st;
/* Anhaltspunkte aus OpenStreetMap (Overpass): Supermärkte, Kirchen, Tankstellen, Schulen, Apotheken, Rathaus, Bank, Krankenhaus, Feuerwehr, Bahnhof.
   Je Adresse 30 Tage im Gerät gemerkt; max. 12 Stück, nahe beieinander liegende werden ausgedünnt. Die eigenen Punkte der Kartenvorlage werden ausgeblendet. */
const POI_ART={supermarket:["Supermarkt","#2E7D32","M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"],
  place_of_worship:["Kirche","#6D4C41","M18 12.22V9l-5-2.5V5h2V3h-2V1h-2v2H9v2h2v1.5L6 9v3.22L2 14v8h8v-4c0-1.1.9-2 2-2s2 .9 2 2v4h8v-8l-4-1.78zM12 13.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"],
  fuel:["Tankstelle","#E65100","M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33 0 1.38 1.12 2.5 2.5 2.5.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V9c0-.69-.28-1.32-.73-1.77zM12 10H6V5h6v5zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"],
  school:["Schule","#1565C0","M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"],
  pharmacy:["Apotheke","#C62828","M21 5h-2.64l1.14-3.14L17.15 1l-1.46 4H3v2l2 6-2 6v2h18v-2l-2-6 2-6V5zm-5 9h-3v3h-2v-3H8v-2h3V9h2v3h3v2z"],
  hospital:["Krankenhaus","#C62828","M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"],
  townhall:["Rathaus","#455A64","M4 10v7h3v-7H4zm6 0v7h3v-7h-3zM2 22h19v-3H2v3zm14-12v7h3v-7h-3zm-4.5-9L2 6v2h19V6l-9.5-5z"],
  bank:["Bank","#455A64","M4 10v7h3v-7H4zm6 0v7h3v-7h-3zM2 22h19v-3H2v3zm14-12v7h3v-7h-3zm-4.5-9L2 6v2h19V6l-9.5-5z"],
  fire_station:["Feuerwehr","#D84315","M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"],
  station:["Bahnhof","#37474F","M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h2.23l2-2H14l2 2h2v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-3.58-4-8-4zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm3.5-7H6V6h5v4zm2 0V6h5v4h-5zm3.5 7c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"]};
/* 05.11.2026: E-Ladesäule, Baumarkt, Parkplatz dazu (Parkplatz anfangs aus) */
Object.assign(POI_ART,{charging_station:["E-Ladesäule","#00838F","m19.77 7.23.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33a2.5 2.5 0 0 0 2.5 2.5c.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v5a2.5 2.5 0 0 0 5 0V9c0-.69-.28-1.32-.73-1.77zM18 10c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zM8 18v-4.5H6L10 6v5h2l-4 7z"],doityourself:["Baumarkt","#F9A825","m18 3-3 3V3H9C6.24 3 4 5.24 4 8h5v3h6V8l3 3h2V3h-2zM9 13v7c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-7H9z"],parking:["Parkplatz","#1565C0","M13 3H6v18h4v-6h3c3.31 0 6-2.69 6-6s-2.69-6-6-6zm.2 8H10V7h3.2c1.1 0 2 .9 2 2s-.9 2-2 2z"]});
const POI_RANG_STD=["supermarket","place_of_worship","fuel","charging_station","station","townhall","doityourself","school","pharmacy","hospital","fire_station","bank","parking"];
const KA_AUS_STD=["parking"];
/* Symbole zum Auswählen (Material Icons, Apache 2.0) */
const KA_ICONS={local_grocery_store:"M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1.003 1.003 0 0 0 20 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z",shopping_cart:"M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1.003 1.003 0 0 0 20 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z",store:"M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z",storefront:"m21.9 8.89-1.05-4.37c-.22-.9-1-1.52-1.91-1.52H5.05c-.9 0-1.69.63-1.9 1.52L2.1 8.89c-.24 1.02-.02 2.06.62 2.88.08.11.19.19.28.29V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-6.94c.09-.09.2-.18.28-.28.64-.82.87-1.87.62-2.89zm-2.99-3.9 1.05 4.37c.1.42.01.84-.25 1.17-.14.18-.44.47-.94.47-.61 0-1.14-.49-1.21-1.14L16.98 5l1.93-.01zM13 5h1.96l.54 4.52c.05.39-.07.78-.33 1.07-.22.26-.54.41-.95.41-.67 0-1.22-.59-1.22-1.31V5zM8.49 9.52 9.04 5H11v4.69c0 .72-.55 1.31-1.29 1.31-.34 0-.65-.15-.89-.41a1.42 1.42 0 0 1-.33-1.07zm-4.45-.16L5.05 5h1.97l-.58 4.86c-.08.65-.6 1.14-1.21 1.14-.49 0-.8-.29-.93-.47-.27-.32-.36-.75-.26-1.17zM5 19v-6.03c.08.01.15.03.23.03.87 0 1.66-.36 2.24-.95.6.6 1.4.95 2.31.95.87 0 1.65-.36 2.23-.93.59.57 1.39.93 2.29.93.84 0 1.64-.35 2.24-.95.58.59 1.37.95 2.24.95.08 0 .15-.02.23-.03V19H5z",church:"M18 12.22V9l-5-2.5V5h2V3h-2V1h-2v2H9v2h2v1.5L6 9v3.22L2 14v8h8v-3c0-1.1.9-2 2-2s2 .9 2 2v3h8v-8l-4-1.78zm-6 1.28c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z",local_gas_station:"m19.77 7.23.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33a2.5 2.5 0 0 0 2.5 2.5c.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v5a2.5 2.5 0 0 0 5 0V9c0-.69-.28-1.32-.73-1.77zM12 10H6V5h6v5zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z",ev_station:"m19.77 7.23.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33a2.5 2.5 0 0 0 2.5 2.5c.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v5a2.5 2.5 0 0 0 5 0V9c0-.69-.28-1.32-.73-1.77zM18 10c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zM8 18v-4.5H6L10 6v5h2l-4 7z",electric_car:"M18.92 2.01C18.72 1.42 18.16 1 17.5 1h-11c-.66 0-1.21.42-1.42 1.01L3 8v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1V8l-2.08-5.99zM6.5 12c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm11 0c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 7l1.5-4.5h11L19 7H5zm2 13h4v-2l6 3h-4v2z",electrical_services:"M21 14c0-.55-.45-1-1-1h-2v2h2c.55 0 1-.45 1-1zm-1 3h-2v2h2c.55 0 1-.45 1-1s-.45-1-1-1zm-8-3h-2v4h2c0 1.1.9 2 2 2h3v-8h-3c-1.1 0-2 .9-2 2zM5 13c0-1.1.9-2 2-2h1.5c1.93 0 3.5-1.57 3.5-3.5S10.43 4 8.5 4H5c-.55 0-1 .45-1 1s.45 1 1 1h3.5c.83 0 1.5.67 1.5 1.5S9.33 9 8.5 9H7c-2.21 0-4 1.79-4 4s1.79 4 4 4h2v-2H7c-1.1 0-2-.9-2-2z",school:"M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3 1 9l11 6 9-4.91V17h2V9L12 3z",local_pharmacy:"M21 5h-2.64l1.14-3.14L17.15 1l-1.46 4H3v2l2 6-2 6v2h18v-2l-2-6 2-6V5zm-5 9h-3v3h-2v-3H8v-2h3V9h2v3h3v2z",medication:"M6 3h12v2H6zm11 3H7c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-1 9h-2.5v2.5h-3V15H8v-3h2.5V9.5h3V12H16v3z",healing:"m17.73 12.02 3.98-3.98a.996.996 0 0 0 0-1.41l-4.34-4.34a.996.996 0 0 0-1.41 0l-3.98 3.98L8 2.29a1.001 1.001 0 0 0-1.41 0L2.25 6.63a.996.996 0 0 0 0 1.41l3.98 3.98L2.25 16a.996.996 0 0 0 0 1.41l4.34 4.34c.39.39 1.02.39 1.41 0l3.98-3.98 3.98 3.98c.2.2.45.29.71.29.26 0 .51-.1.71-.29l4.34-4.34a.996.996 0 0 0 0-1.41l-3.99-3.98zM12 9c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-4.71 1.96L3.66 7.34l3.63-3.63 3.62 3.62-3.62 3.63zM10 13c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm2 2c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm2-4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2.66 9.34-3.63-3.62 3.63-3.63 3.62 3.62-3.62 3.63z",medical_services:"M20 6h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM10 4h4v2h-4V4zm6 11h-3v3h-2v-3H8v-2h3v-3h2v3h3v2z",local_hospital:"M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z",emergency:"m20.79 9.23-2-3.46L14 8.54V3h-4v5.54L5.21 5.77l-2 3.46L8 12l-4.79 2.77 2 3.46L10 15.46V21h4v-5.54l4.79 2.77 2-3.46L16 12z",account_balance:"M4 10h3v7H4zm6.5 0h3v7h-3zM2 19h20v3H2zm15-9h3v7h-3zm-5-9L2 6v2h20V6z",euro:"M15 18.5A6.48 6.48 0 0 1 9.24 15H15l1-2H8.58c-.05-.33-.08-.66-.08-1s.03-.67.08-1H15l1-2H9.24A6.491 6.491 0 0 1 15 5.5c1.61 0 3.09.59 4.23 1.57L21 5.3A8.955 8.955 0 0 0 15 3c-3.92 0-7.24 2.51-8.48 6H3l-1 2h4.06a8.262 8.262 0 0 0 0 2H3l-1 2h4.52c1.24 3.49 4.56 6 8.48 6 2.31 0 4.41-.87 6-2.3l-1.78-1.77c-1.13.98-2.6 1.57-4.22 1.57z",local_fire_department:"m12 12.9-2.13 2.09c-.56.56-.87 1.29-.87 2.07C9 18.68 10.35 20 12 20s3-1.32 3-2.94c0-.78-.31-1.52-.87-2.07L12 12.9zm16 6-.44.55C14.38 8.02 12 7.19 12 5.3V2S4 6 4 13c0 2.92 1.56 5.47 3.89 6.86-.56-.79-.89-1.76-.89-2.8 0-1.32.52-2.56 1.47-3.5L12 10.1l3.53 3.47c.95.93 1.47 2.17 1.47 3.5 0 1.02-.31 1.96-.85 2.75 1.89-1.15 3.29-3.06 3.71-5.3.66-3.55-1.07-6.9-3.86-8.52z",fire_extinguisher:"M7 19h10v1c0 1.1-.9 2-2 2H9c-1.1 0-2-.9-2-2v-1zm0-1h10v-5H7v5zM17 3v6l-3.15-.66c-.01 0-.01.01-.02.02 1.55.62 2.72 1.98 3.07 3.64H7.1c.34-1.66 1.52-3.02 3.07-3.64-.33-.26-.6-.58-.8-.95L5 6.5v-1l4.37-.91C9.87 3.65 10.86 3 12 3c.7 0 1.34.25 1.85.66L17 3zm-4 3c-.03-.59-.45-1-1-1s-1 .45-1 1 .45 1 1 1 1-.45 1-1z",train:"M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h2.23l2-2H14l2 2h2v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-3.58-4-8-4zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm3.5-7H6V6h5v4zm2 0V6h5v4h-5zm3.5 7c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z",directions_bus:"M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z",subway:"M7.01 9h10v5h-10zM17.8 2.8C16 2.09 13.86 2 12 2c-1.86 0-4 .09-5.8.8C3.53 3.84 2 6.05 2 8.86V22h20V8.86c0-2.81-1.53-5.02-4.2-6.06zm.2 13.08c0 1.45-1.18 2.62-2.63 2.62l1.13 1.12V20H15l-1.5-1.5h-2.83L9.17 20H7.5v-.38l1.12-1.12C7.18 18.5 6 17.32 6 15.88V9c0-2.63 3-3 6-3 3.32 0 6 .38 6 3v6.88z",local_parking:"M13 3H6v18h4v-6h3c3.31 0 6-2.69 6-6s-2.69-6-6-6zm.2 8H10V7h3.2c1.1 0 2 .9 2 2s-.9 2-2 2z",hardware:"m18 3-3 3V3H9C6.24 3 4 5.24 4 8h5v3h6V8l3 3h2V3h-2zM9 13v7c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-7H9z",handyman:"m21.67 18.17-5.3-5.3h-.99l-2.54 2.54v.99l5.3 5.3c.39.39 1.02.39 1.41 0l2.12-2.12a.996.996 0 0 0 0-1.41zm17.34 10.19 1.41-1.41 2.12 2.12a3 3 0 0 0 0-4.24l-3.54-3.54-1.41 1.41V1.71l-.7-.71-3.54 3.54.71.71h2.83l-1.41 1.41 1.06 1.06-2.89 2.89-4.13-4.13V5.06L4.83 2.04 2 4.87 5.03 7.9h1.41l4.13 4.13-.85.85H7.6l-5.3 5.3a.996.996 0 0 0 0 1.41l2.12 2.12c.39.39 1.02.39 1.41 0l5.3-5.3v-2.12l5.15-5.15 1.06 1.05z",home_repair_service:"M18 16h-2v-1H8v1H6v-1H2v5h20v-5h-4zm2-8h-3V6c0-1.1-.9-2-2-2H9c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v4h4v-2h2v2h8v-2h2v2h4v-4c0-1.1-.9-2-2-2zm-5 0H9V6h6v2z",construction:"m13.783 15.172 2.121-2.121 5.996 5.996-2.121 2.121zM17.5 10c1.93 0 3.5-1.57 3.5-3.5 0-.58-.16-1.12-.41-1.6l-2.7 2.7-1.49-1.49 2.7-2.7c-.48-.25-1.02-.41-1.6-.41C15.57 3 14 4.57 14 6.5c0 .41.08.8.21 1.16l-1.85 1.85-1.78-1.78.71-.71-1.41-1.41L12 3.49a3 3 0 0 0-4.24 0L4.22 7.03l1.41 1.41H2.81l-.71.71 3.54 3.54.71-.71V9.15l1.41 1.41.71-.71 1.78 1.78-7.41 7.41 2.12 2.12L16.34 9.79c.36.13.75.21 1.16.21z",warehouse:"M22 21V7L12 3 2 7v14h5v-9h10v9h5zm-11-2H9v2h2v-2zm2-3h-2v2h2v-2zm2 3h-2v2h2v-2z",local_cafe:"M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2a2 2 0 0 0 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z",restaurant:"M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z",bakery_dining:"M19.28 16.34 17.46 15s.32-.59.96-1.78a.944.944 0 0 1 1.6 0l.81 1.26c.19.3.21.68.06 1l-.22.47a.94.94 0 0 1-1.39.39zm-14.56 0a.946.946 0 0 1-1.39-.38l-.23-.47c-.15-.32-.13-.7.06-1l.81-1.26a.944.944 0 0 1 1.6 0c.65 1.18.97 1.77.97 1.77l-1.82 1.34zm10.64-6.97c.09-.68.73-1.06 1.27-.75l1.59.9c.46.26.63.91.36 1.41L16.5 15h-1.8l.66-5.63zm-6.73 0L9.3 15H7.5l-2.09-4.08c-.27-.5-.1-1.15.36-1.41l1.59-.9c.53-.3 1.18.08 1.27.76zM13.8 15h-3.6l-.74-6.88c-.07-.59.35-1.12.88-1.12h3.3c.53 0 .94.53.88 1.12L13.8 15z",place:"M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z",push_pin:"M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z",star:"M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z",flag:"M14.4 6 14 4H5v17h2v-7h5.6l.4 2h7V6z"};
/* Einstellungen der Karte (Entwickler, Übersicht › Einstellungen › „Karte beim Kunden“): firmenweit in einstellungen/karte
   {radius, max, abstand, pin, arten:{art:{an,farbe}}, rang:[…]} – fehlt etwas, gilt der Standard */
const KA_STD={radius:800,max:12,abstand:90,pin:""};
function kaCfg(){ const r=DB.einstellungen&&DB.einstellungen.get("karte"), o=r&&!r.deleted?r:{}, A=o.arten||{};
  const rang=(Array.isArray(o.rang)?o.rang.filter(k=>POI_ART[k]):[]).concat(POI_RANG_STD.filter(k=>!(o.rang||[]).includes(k)));
  return {radius:+o.radius||KA_STD.radius,max:+o.max||KA_STD.max,abstand:o.abstand!=null?+o.abstand:KA_STD.abstand,pin:o.pin||"",rang,
    an:k=>A[k]&&A[k].an!=null?A[k].an!==false:!KA_AUS_STD.includes(k),farbe:k=>(A[k]&&A[k].farbe)||POI_ART[k][1],
    icon:k=>(A[k]&&A[k].icon&&KA_ICONS[A[k].icon])||POI_ART[k][2]}; }
const POI_RANG=POI_RANG_STD;
/* Zwischenspeicher je Ort: Treffer 30 Tage, „nichts gefunden“ nur 1 Tag (sonst bleibt ein ausgelasteter Server einen Monat lang hängen).
   META.poi aus älteren Fassungen kann solche leeren Antworten enthalten → einmalig verworfen (poi2). */
async function kartePoiHolen(g){ const C=kaCfg(), key=g.lat.toFixed(4)+","+g.lon.toFixed(4)+"|"+C.radius+"|3"+(C.an("parking")?"p":""); if(META.poi) delete META.poi; META.poi2=META.poi2||{}; const alt=META.poi2[key];
  /* Overpass-Treffer 30 Tage; Ersatzquellen (vollständig nicht sicher) nur 1 Tag; nichts gefunden 1 Stunde */
  if(alt&&Date.now()-alt.t<(!alt.L.length?1/24:alt.q==="ov"?30:1)*864e5) return kaFiltern(alt.L,g,C);
  const um=`(around:${C.radius},${g.lat},${g.lon})`, q=`[out:json][timeout:15];(nwr${um}["shop"~"^(supermarket|doityourself)$"];nwr${um}["amenity"~"^(place_of_worship|fuel|charging_station|school|pharmacy|townhall|hospital|bank|fire_station${C.an("parking")?"|parking":""})$"];nwr${um}["railway"="station"];);out center 80;`;
  /* Overpass-Server sind oft ausgelastet (Okt. 2026: alle vier zeitweise ohne Antwort): alle gleichzeitig fragen, die erste brauchbare Antwort zählt (max. 10 s).
     Klappt keiner, ersatzweise Nominatim (je Art eine Suche im Kartenausschnitt, eine pro Sekunde laut Nutzungsregeln). */
  const ov=srv=>new Promise((ok,no)=>{ const ab=new AbortController(), t=setTimeout(()=>ab.abort(),10000);
    fetch(srv,{method:"POST",body:"data="+encodeURIComponent(q),headers:{"Content-Type":"application/x-www-form-urlencoded"},signal:ab.signal}).then(r=>r.ok?r.json():Promise.reject(r.status))
      .then(j=>{ /* ausgelastet: Overpass antwortet trotzdem mit 200, leerer Liste und „remark: runtime error …“ */ if(j&&Array.isArray(j.elements)&&!(j.remark&&/error|timeout|busy|out of memory/i.test(j.remark))) ok(j); else no(0); }).catch(no).finally(()=>clearTimeout(t)); });
  const SRV=["https://overpass-api.de/api/interpreter","https://overpass.private.coffee/api/interpreter","https://maps.mail.ru/osm/tools/overpass/api/interpreter","https://overpass.kumi.systems/api/interpreter"];
  const phP=kartePoiPhoton(g,C);   /* Ersatz gleich mitstarten – fällt Overpass aus, ist er schon da */
  let j=await new Promise(ok=>{ let offen=SRV.length; SRV.forEach(u=>ov(u).then(ok,()=>{ if(!--offen) ok(null); })); });
  let quelle="ov"; if(!j){ quelle="ph"; j=await phP; }
  if(!j){ quelle="nom"; j=await kartePoiNominatim(g,C.radius); }
  if(!j) throw new Error("Anhaltspunkte nicht erreichbar");
  const d=(a,b)=>Math.hypot((a.lat-b.lat)*111000,(a.lon-b.lon)*111000*Math.cos(a.lat*Math.PI/180));
  let L=(j.elements||[]).map(e=>{ const t=e.tags||{}, art=t.shop==="supermarket"?"supermarket":t.shop==="doityourself"?"doityourself":t.railway==="station"?"station":t.amenity, lat=e.lat||(e.center&&e.center.lat), lon=e.lon||(e.center&&e.center.lon);
    return POI_ART[art]&&lat?{art,lat,lon,n:String(t.name||t.brand||POI_ART[art][0]).slice(0,28)}:null; }).filter(Boolean);
  /* gemerkt werden alle Treffer (bis 80) – Auswahl, Reihenfolge, Höchstzahl und Abstand erst beim Anzeigen, damit Einstellungen sofort wirken */
  L=L.filter(x=>d(x,g)>25).slice(0,80).map(x=>({art:x.art,lat:x.lat,lon:x.lon,n:x.n})); const W=L;
  META.poi2[key]={t:Date.now(),L:W,q:quelle}; KARTE.poiQ=quelle; const ks=Object.keys(META.poi2); if(ks.length>60) delete META.poi2[ks[0]]; metaSave(); return kaFiltern(W,g,C); }
function kaFiltern(L,g,C){ const d=(a,b)=>Math.hypot((a.lat-b.lat)*111000,(a.lon-b.lon)*111000*Math.cos(a.lat*Math.PI/180));
  const S=L.filter(x=>POI_ART[x.art]&&C.an(x.art)).map(x=>Object.assign({},x,{d:d(x,g)})).sort((a,b)=>C.rang.indexOf(a.art)-C.rang.indexOf(b.art)||a.d-b.d);
  const W=[]; for(const x of S){ if(W.length>=C.max) break; if(C.abstand&&W.some(y=>d(x,y)<C.abstand)) continue; W.push(x); } return W; }
/* Ersatz über Nominatim: Suchbegriffe, die Nominatim als Kategorie versteht; Ergebnis im Overpass-Format */
const POI_NOM=[["supermarket","Supermarkt","shop/supermarket"],["place_of_worship","place of worship","amenity/place_of_worship"],["fuel","Tankstelle","amenity/fuel"],["station","railway station","railway/station"],
  ["charging_station","charging station","amenity/charging_station"],["doityourself","Baumarkt","shop/doityourself"],
  ["townhall","Rathaus","amenity/townhall"],["school","Schule","amenity/school"],["pharmacy","Apotheke","amenity/pharmacy"],["hospital","Krankenhaus","amenity/hospital"],["fire_station","Feuerwehr","amenity/fire_station"],["bank","Banken","amenity/bank"]];
/* Ersatz 1 (05.11.2026): Photon (komoot) – eine einzige Abfrage im Umkreis für alle Arten, schnell und ohne 1-pro-Sekunde-Grenze.
   Vorher ging die Ersatzsuche Art für Art über Nominatim (über 10 s) und blieb bei Abbruch oder Sperre unvollständig – z. B. bei Merten nur Kirchen, obwohl die Feuerwehr 80 m entfernt ist. */
const PH_TAG={supermarket:"shop:supermarket",doityourself:"shop:doityourself",station:"railway:station"};
async function kartePoiPhoton(g,C){ try{ const A=Object.keys(POI_ART).filter(k=>C.an(k)), tags=A.map(k=>"&osm_tag="+encodeURIComponent(PH_TAG[k]||"amenity:"+k)).join("");
    const ab=new AbortController(), t=setTimeout(()=>ab.abort(),12000);
    const r=await fetch(`https://photon.komoot.io/reverse?lon=${g.lon}&lat=${g.lat}&radius=${(C.radius/1000).toFixed(2)}&limit=50&lang=de${tags}`,{signal:ab.signal}); clearTimeout(t); if(!r.ok) return null;
    const F=(await r.json()).features||[]; return {elements:F.map(f=>{ const p=f.properties||{}, c=(f.geometry||{}).coordinates||[]; return {lat:c[1],lon:c[0],tags:{[p.osm_key]:p.osm_value,name:p.name||""}}; })}; }catch(e){ return null; } }
async function kartePoiNominatim(g,rad){ const f=(rad||800)/800, dx=.011*f, dy=.0072*f, vb=[g.lon-dx,g.lat+dy,g.lon+dx,g.lat-dy].join(","), E=[]; let ok=0;
  for(const [art,q,typ] of POI_NOM){
    try{ const r=await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&bounded=1&accept-language=de&viewbox=${vb}&q=${encodeURIComponent(q)}`); if(r.ok){ ok++;
        (await r.json()).filter(x=>`${x.category}/${x.type}`===typ).forEach(x=>{ const [k,v]=typ.split("/"); E.push({lat:+x.lat,lon:+x.lon,tags:{[k]:v,name:x.name||""}}); }); } }catch(e){}
    await new Promise(r=>setTimeout(r,1100)); }
  return ok?{elements:E}:null; }
async function kartePoi(g,a){ (KARTE.poi||[]).forEach(m=>m.remove()); KARTE.poi=[];
  let L=[]; try{ L=await kartePoiHolen(g); }catch(e){ console.warn("Anhaltspunkte:",e.message); KARTE.poiA=null; return; }
  const el=document.getElementById("kdKarte"); if(!el||el.dataset.a!==a||!KARTE.map) return;
  const C=kaCfg(); KARTE.poi=L.map(x=>{ const [t]=POI_ART[x.art], pfad=C.icon(x.art), f=C.farbe(x.art), d=document.createElement("div"); d.className="kd-poi"; d.title=`${t}: ${x.n}`;
    d.addEventListener("click",e=>{ e.stopPropagation(); const an=!d.classList.contains("zeig"); document.querySelectorAll(".kd-poi.zeig").forEach(x=>x.classList.remove("zeig")); d.classList.toggle("zeig",an); });
    d.innerHTML=`<i style="--poi:${f}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${pfad}"/></svg></i><span>${esc(x.n)}</span>`;
    return new maplibregl.Marker({element:d,anchor:"left",offset:[-13,0]}).setLngLat([x.lon,x.lat]).addTo(KARTE.map); });
  if(KARTE.mk){ const p=KARTE.mk.getElement(); p.parentNode&&p.parentNode.appendChild(p); } }
function karteVorlagePoiAus(){ try{ const st=KARTE.map.getStyle(); (st&&st.layers||[]).forEach(l=>{ if(/^poi/.test(l.id)) KARTE.map.setLayoutProperty(l.id,"visibility","none"); }); }catch(e){} }
const karteGrenze=c=>{ const f=Math.max(1,kaCfg().radius/800); return [[c[0]-.022*f,c[1]-.014*f],[c[0]+.022*f,c[1]+.014*f]]; };
async function karteLaden(a){
  const el=document.getElementById("kdKarte"); if(!el||el.dataset.a!==a) return;
  let g; try{ g=await karteGeo(a); }catch(e){ return karteFehler(el,"Karte gerade nicht erreichbar"); }
  if(g.nix) return karteFehler(el,"Adresse auf der Karte nicht gefunden");
  try{ await karteLib(); }catch(e){ return karteFehler(el,"Karte gerade nicht erreichbar"); }
  const el2=document.getElementById("kdKarte"); if(!el2||el2.dataset.a!==a) return;
  const slot=el2.querySelector(".kd-slot"), stil=kDunkel()?"satellit":"liberty", c=[g.lon,g.lat];
  if(!KARTE.map){
    KARTE.el=document.createElement("div"); KARTE.el.className="kd-map"; slot.appendChild(KARTE.el); KARTE.stil=stil;
    /* Umschauen erlaubt, aber nur in der Nähe: Zoom 13,5–18,5 und ca. 1,5 km um den Ort. Finger: mit zwei Fingern, PC: Strg/⌘ + Mausrad oder +/− */
    KARTE.map=new maplibregl.Map({container:KARTE.el,style:karteStil(stil),center:c,zoom:15.2,minZoom:13.5,maxZoom:18.5,maxBounds:karteGrenze(c),
      dragRotate:false,pitchWithRotate:false,touchPitch:false,keyboard:false,cooperativeGestures:false,scrollZoom:false,attributionControl:false,fadeDuration:0,
      locale:{"CooperativeGesturesHandler.WindowsHelpText":"Zum Zoomen Strg + Mausrad – oder + und −","CooperativeGesturesHandler.MacHelpText":"Zum Zoomen ⌘ + Mausrad – oder + und −","CooperativeGesturesHandler.MobileHelpText":"Mit zwei Fingern verschieben und zoomen",
        "NavigationControl.ZoomIn":"Vergrößern","NavigationControl.ZoomOut":"Verkleinern"}});
    KARTE.map.touchZoomRotate.disableRotation();
    /* 05.11.2026 (Max): mit einem Finger verschieben, mit zwei Fingern zoomen. Mausrad scrollt weiter die Seite – zoomen am PC mit Strg/⌘ + Mausrad, Doppelklick oder + und − */
    KARTE.el.addEventListener("wheel",e=>{ if(!(e.ctrlKey||e.metaKey)||!KARTE.map) return; e.preventDefault(); KARTE.map.easeTo({zoom:KARTE.map.getZoom()-Math.max(-1,Math.min(1,e.deltaY/100))*.6,duration:120,around:KARTE.map.unproject([e.offsetX,e.offsetY])}); },{passive:false});
    KARTE.map.on("styledata",karteVorlagePoiAus);
    KARTE.map.on("zoom",()=>{ const k=document.getElementById("kdKarte"); if(k) k.classList.toggle("fern",KARTE.map.getZoom()<14.6); });
    KARTE.map.addControl(new maplibregl.AttributionControl({compact:true}),"bottom-right");
    /* Quellenangabe immer eingeklappt (nur das ⓘ); MapLibre klappt sie beim ersten Laden von selbst auf – das wird sofort zurückgenommen, außer man hat selbst aufs ⓘ getippt */
    { const at=KARTE.el.querySelector(".maplibregl-ctrl-attrib"); let tipp=0;
      if(at){ at.addEventListener("pointerdown",e=>{ if(e.target.closest(".maplibregl-ctrl-attrib-button")) tipp=Date.now(); },true);
        const zu=()=>{ if(at.classList.contains("maplibregl-compact-show")&&Date.now()-tipp>800) at.classList.remove("maplibregl-compact-show"); };
        new MutationObserver(zu).observe(at,{attributes:true,attributeFilter:["class"]}); zu(); } }
    KARTE.map.addControl(new maplibregl.NavigationControl({showCompass:false}),"top-right");
    KARTE.map.on("moveend",()=>{ const z=document.querySelector("#kdKarte .kd-zentr"); if(!z||!KARTE.mk) return; const m=KARTE.map.project(KARTE.mk.getLngLat()), cc=KARTE.map.project(KARTE.map.getCenter());
      z.hidden=Math.hypot(m.x-cc.x,m.y-cc.y)<30&&Math.abs(KARTE.map.getZoom()-15.2)<.3; });
    /* falls der dunkle Kartenstil nicht lädt: hellen nehmen */
    KARTE.map.on("error",ev=>{ if(KARTE.stil==="liberty"&&!KARTE.map.isStyleLoaded()&&!KARTE.ersatz){ KARTE.ersatz=1; KARTE.stil="positron"; KARTE.map.setStyle(karteStil("positron")); } });
    if(window.ResizeObserver) new ResizeObserver(()=>{ if(KARTE.map&&KARTE.el.isConnected) KARTE.map.resize(); }).observe(KARTE.el);
    const m=document.createElement("div"); m.className="kd-pin"; if(kaCfg().pin) m.style.background=kaCfg().pin; KARTE.mk=new maplibregl.Marker({element:m,anchor:"bottom"}).setLngLat(c).addTo(KARTE.map);
  } else {
    slot.appendChild(KARTE.el); KARTE.map.resize();
    if(KARTE.stil!==stil){ KARTE.stil=stil; KARTE.map.setStyle(karteStil(stil)); }
    const alt=KARTE.mk.getLngLat(); KARTE.mk.setLngLat(c); KARTE.map.setMaxBounds(karteGrenze(c));
    if(Math.abs(alt.lng-c[0])+Math.abs(alt.lat-c[1])>1e-6) KARTE.map.easeTo({center:c,duration:500}); else KARTE.map.jumpTo({center:c});
  }
  const l=el2.querySelector(".kd-lade"); if(l) l.hidden=true;
  if(typeof parkKartePin==="function") parkKartePin();
  if(KARTE.poiA!==a||!(KARTE.poi||[]).length){ KARTE.poiA=a; kartePoi(g,a); }
}
matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change",()=>{ const el=document.getElementById("kdKarte"); if(el) karteLaden(el.dataset.a); });

/* Seitenkopf der Kundenansicht: Eckdaten und Karte nebeneinander (ab 900 px), darunter einspaltig */
const kdOben=(r,kind,ss)=>`<div class="kd-oben">${infoKarte(r,kind)}${typeof parkKarte==="function"?parkKarte(r,kind):""}${karteView(r,ss||[])}</div>`;
/* Abschnittskopf mit rundem Plus rechts – wie in der Übersicht */
/* Kunde/Standort: kein ⋮ – Bearbeiten steht als Schnellaktion in der Kontaktkarte, Löschen im Bearbeiten-Fenster */
function kdKopfKnopf(){ const b=document.getElementById("menuBtn"); if(b&&typeof VIEW_KIND!=="undefined"&&VIEW_KIND[nav.v]) b.hidden=true; }
const kdLoeschKnopf=(rec,darf)=>rec&&darf&&typeof nav!=="undefined"&&nav.id===rec.id?`<button class="btn-text danger" data-act="locDelAsk">Löschen</button>`:"";
const karteKopf=(t,act,label,extra)=>`<div class="card-kopf"><h3>${t}</h3>${act?`<span class="ab-btns"><button class="ab-ic" data-act="${act}"${extra||""} aria-label="${esc(label)}" title="${esc(label)}">${icon("add")}</button></span>`:""}</div>`;
const kdKopf=(t,act,label,extra)=>`<div class="sec-row"><div class="sec-lbl">${t}</div>${act?`<span class="ab-btns"><button class="ab-ic" data-act="${act}"${extra||""} aria-label="${esc(label)}" title="${esc(label)}">${icon("add")}</button></span>`:""}</div>`;

/* Klicks der Kundenansicht – eigene Abfangung, die Apps brauchen dafür nichts im eigenen switch */
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act="ktNeu"],[data-act="ktEdit"],[data-act="ktRolleWahl"],[data-act="ktSave"],[data-act="ktDel"],[data-act="karteZentr"],[data-act="karteOrt"],[data-act="karteOrtMenu"]'); if(!b) return;
  e.stopPropagation(); e.preventDefault(); const a=b.dataset.act;
  if(a==="ktNeu"||a==="ktEdit"){ const kind=b.dataset.kind, r=DB[kind]&&DB[kind].get(nav.id); if(!r||!kdDarf(r)) return; ktDialog(kind,r,b.dataset.k?kontakteVon(r).find(x=>x.id===b.dataset.k):null); }
  else if(a==="ktRolleWahl"){ const i=document.getElementById("f_ktRolle"); if(i){ i.value=b.dataset.v; i.dispatchEvent(new Event("input",{bubbles:true})); i.parentElement.classList.add("fl"); } }
  else if(a==="ktSave") ktSpeichern(false);
  else if(a==="ktDel") ktSpeichern(true);
  else if(a==="karteZentr"){ if(KARTE.map&&KARTE.mk) KARTE.map.easeTo({center:KARTE.mk.getLngLat(),zoom:15.2,duration:500}); }
  else if(a==="karteOrt"){ karteWahl[b.dataset.r]=b.dataset.id; render(); }
  /* ab 3 Standorten: Menü mit allen Orten (Name · Ort), aktueller markiert */
  else if(a==="karteOrtMenu"&&typeof kontextMenu==="function"){ const rid=b.dataset.r, O=(KARTE.orte||{})[rid]; if(!O||!O.length) return;
    const akt=O.find(x=>x.id===karteWahl[rid])||O[0], q=b.getBoundingClientRect();
    const stadt=a=>{ const t=String(a).split(",").pop().trim().replace(/^\d{5}\s*/,""); return t; };
    kontextMenu(q.left,q.bottom,O.map(x=>({t:x.t+(stadt(x.a)?" · "+stadt(x.a):""),ic:"ort",an:x===akt,fn:()=>{ karteWahl[rid]=x.id; render(); }}))); }
},true);

/* ===== Kundenart: Privat · Gewerbe · Industrie =====
   Wie in Handwerker-/Wartungssoftware: Kunde → Standort/Objekt → Gebäude/Bauteil → Ebene → Raum.
   Die Art steuert nur, was vorgeschlagen und eingeblendet wird – sie sperrt nichts (ein wachsender Gewerbekunde
   bekommt Bauteile oder einen Rahmenauftrag, ohne umgestellt werden zu müssen).
   Gespeichert am Kunden: art, bei Privat anrede/vorname/nachname (name = „Vorname Nachname“ für Suche und Ordner).
   Bauteile/Ebenen als Text („A, B, C“) am Kunden (ein Werk) oder am Standort (mehrere Liegenschaften).
   Ohne gesetzte Art wird sie aus dem Namen vorgeschlagen (GmbH, AG, KG … ⇒ Gewerbe, sonst Privat). */
Object.assign(IC,{ebene:"M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16z",kdGeb:IC.kdGeb||"M15 11V5l-3-3-3 3v2H3v14h18V11h-6zm-8 8H5v-2h2v2zm0-4H5v-2h2v2zm0-4H5V9h2v2zm6 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V9h2v2zm0-4h-2V5h2v2zm6 12h-2v-2h2v2zm0-4h-2v-2h2v2z"});
const KD_ARTEN=[["privat","Privat"],["gewerbe","Gewerbe"],["industrie","Industrie"]];
const KD_ART_LANG={privat:"Privatkunde",gewerbe:"Gewerbekunde",industrie:"Industriekunde"};
const KD_FIRMA_RE=/(\bgmbh|\bag\b|\bkg\b|\bohg\b|\bug\b|\bgbr\b|mbh\b|\be\.\s?k\b|\be\.\s?v\b|\bco\.|\bltd\b|\binc\b|\bse\b|kgaa|stiftung|apotheke|praxis|gemeinde|stadt |schule|kirche|klinik|hotel|gaststätte|autohaus|bäckerei|metzgerei|verwaltung|werk\b|werke\b|\bgruppe\b)/i;
const kdArt=k=>k&&KD_ARTEN.some(x=>x[0]===k.art)?k.art:(KD_FIRMA_RE.test(String(k&&k.name||""))?"gewerbe":"privat");
const kdListe=t=>Array.isArray(t)?t:String(t||"").split(/\s*[,;\n]\s*/).map(x=>x.trim()).filter(Boolean);
const kdOrteTitel=k=>kdArt(k)==="privat"?"Weitere Objekte":"Standorte";
const kdKeinOrt=k=>kdArt(k)==="privat"?"Das Objekt ist die Adresse des Kunden. Ein weiteres nur, wenn er z. B. ein zweites Haus hat.":"";
/* ===== Kundenseite – EIN Aufbau für alle Apps (Entscheidung Max 04.11.2026) =====
   Kopf + Karte · Ansprechpartner · [Block der App] · Weitere Objekte/Standorte · Dokumente und Fotos.
   Der Block zeigt nur, was die App kann (EVSE: Prüfverlauf, Baustelle: Baustellen, Gebäudetechnik: Prüfungen + Verteiler);
   die Übersicht zeigt alle Blöcke. Kein schwebender Knopf – Neues über das Plus im jeweiligen Abschnitt. */
function kdOrteBlock(k,ss){ return kdKopf(kdOrteTitel(k),kdDarf(k)&&"newStandort",kdArt(k)==="privat"?"Objekt hinzufügen":"Standort hinzufügen")
  +((typeof hsZeile==="function"?hsZeile(k):"")||ss.length?`<div class="list">${typeof hsZeile==="function"?hsZeile(k):""}${ss.map(s=>locItem("standorte",s)).join("")}</div>`:`<p class="meta">${esc(kdKeinOrt(k)||"Nur nötig, wenn der Kunde mehrere Adressen hat (z. B. Werk und Lager).")}</p>`); }
function kdSeite(r,kind,block){ const ss=kind==="kunden"?standorteVon(r.id):[];
  return `<div class="narrow kd-seite">${kdOben(r,kind,ss)}${kontakteView(kind,r)}${block||""}${kind==="kunden"?kdOrteBlock(r,ss):""}${ablageView(kind,r)}</div>`; }
const KD_ANREDE=[["herr","Herr"],["frau","Frau"],["","Ohne"]];
const kdAnrede=k=>({herr:"Herr",frau:"Frau"})[k&&k.anrede]||"";
/* Bearbeiten-Fenster (in allen Apps) nach dem Öffnen ergänzen: Kundenart, Privat-Felder, Bauteile/Ebenen */
function kdDlgErweitern(kind,rec){ const d=document.getElementById("dlg"), fg=d&&d.querySelector(".fg1"); if(!fg||!["kunden","standorte"].includes(kind)) return; const r=rec||{};
  const hid=(f,v)=>`<input type="hidden" data-f="${f}" value="${esc(v||"")}">`;
  const struktur=(zeigen)=>`<div class="kd-strukt"${zeigen?"":" hidden"}><div class="lbl" style="margin:12px 4px 6px">Gebäude und Ebenen (für Meldungen und Prüfungen)</div>
    ${tf("bauteile","Gebäude / Bauteile (mit Komma trennen)",kdListe(r.bauteile).join(", "),{form:true,ph:"z. B. A, B, C, D, E"})}${tf("ebenen","Ebenen (mit Komma trennen)",kdListe(r.ebenen).join(", "),{form:true,ph:"z. B. UG, EG, Level 1, Level 2"})}</div>`;
  if(kind==="kunden"){ const art=rec?kdArt(r):"privat", t=nameTeile(r.name||"");
    fg.insertAdjacentHTML("afterbegin",`<div class="kd-artw">${hid("art",art)}<div class="lbl" style="margin:0 4px 6px">Kundenart</div>${seg("kdArtW",art,KD_ARTEN)}</div>
      <div class="kd-priv"${art==="privat"?"":" hidden"}>${hid("anrede",r.anrede||"")}<div class="lbl" style="margin:8px 4px 6px">Anrede</div>${seg("kdAnrW",r.anrede||"",KD_ANREDE)}
        <div class="row2" style="margin-top:12px">${tf("vorname","Vorname",r.vorname||(r.art?"":t.vor)||"",{form:true})}${tf("nachname","Nachname",r.nachname||(r.art?"":t.nach)||"",{form:true})}</div></div>`);
    kdArtAnwenden(art); }
  /* Gebäude, Ebenen, Verteiler und Maschinen pflegt jetzt die Seite „Anlagen“ (Übersicht) – ein Modell für alle Apps */
  if(kind==="kunden") telFelder(d,r);
  /* Standort bearbeiten: „Zum Hauptsitz machen“ (Chef und Büro) */
  if(kind==="standorte"&&rec&&rec.id&&(ME.admin||ME.buero)) fg.insertAdjacentHTML("beforeend",`<div class="list" style="margin-top:16px"><div class="li" role="button" tabindex="0" data-act="ortMergeAsk" data-id="${esc(rec.id)}"><span class="av">${icon("move")}</span><span class="lt"><span class="h">Zusammenführen</span><span class="s">Doppelt angelegt? In den Hauptsitz oder einen anderen Standort übernehmen – alle Daten bleiben</span></span>${icon("chev")}</div><div class="li" role="button" tabindex="0" data-act="hsTauschAsk" data-id="${esc(rec.id)}"><span class="av">${icon("firma")}</span><span class="lt"><span class="h">Zum Hauptsitz machen</span><span class="s">Wenn die Firma ihre Zentrale hierher verlegt – der bisherige Hauptsitz wird ein Standort</span></span>${icon("chev")}</div></div>`);
  if(typeof parkDlgFelder==="function") parkDlgFelder(d,rec);
  adrHelfer(d);
}
function kdArtAnwenden(art){ const d=document.getElementById("dlg"); if(!d) return; const priv=art==="privat";
  const pv=d.querySelector(".kd-priv"); if(pv) pv.hidden=!priv;
  const nf=d.querySelector('[data-f="name"]'), tfN=nf&&nf.closest(".tf"); if(tfN) tfN.hidden=priv;
  if(nf) nf.placeholder=art==="industrie"?"z. B. Merten GmbH":"z. B. Musterfirma GmbH";
  const wf=d.querySelector('[data-f="web"]'), tfW=wf&&wf.closest(".tf"); if(tfW&&!wf.value) tfW.hidden=priv; /* Privatleute haben selten eine Webseite */
  const st=d.querySelector(".kd-strukt"); if(st&&art==="industrie") st.hidden=false;
  if(priv) kdNameAusTeilen(); }
function kdNameAusTeilen(){ const d=document.getElementById("dlg"); if(!d) return; const v=d.querySelector('[data-f="vorname"]'), n=d.querySelector('[data-f="nachname"]'), nf=d.querySelector('[data-f="name"]');
  if(v&&n&&nf&&(v.value.trim()||n.value.trim())) nf.value=[v.value.trim(),n.value.trim()].filter(Boolean).join(" "); }
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act="kdArtW"],[data-act="kdAnrW"]'); if(!b) return; e.stopImmediatePropagation(); e.preventDefault();
  b.parentElement.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x===b))); if(typeof segInd==="function") segInd();
  const d=document.getElementById("dlg"), f=b.dataset.act==="kdArtW"?"art":"anrede", h=d&&d.querySelector(`input[type=hidden][data-f="${f}"]`); if(h) h.value=b.dataset.v;
  if(f==="art") kdArtAnwenden(b.dataset.v); },true);
document.addEventListener("input",e=>{ const f=e.target&&e.target.dataset&&e.target.dataset.f; if((f==="vorname"||f==="nachname")&&e.target.closest("#dlg")) kdNameAusTeilen(); });

/* ===== Mehrere Telefonnummern je Kunde =====
   r.telefone=[{art,nr}] – als JSON-Text gespeichert, weil die Apps das Bearbeiten-Fenster flach speichern (formVals → Object.assign).
   r.tel bleibt die erste Nummer, damit EVSE, Meldungen, Aufnahme und Protokolle sie weiter zeigen. */
const TEL_ARTEN=["Mobil","Festnetz","Privat","Geschäftlich","Fax","Sonstige"];
const telArtRaten=n=>/^(\+49|0049|0)1[5-7]/.test(String(n||"").replace(/[\s\/().-]/g,""))?"Mobil":"Festnetz";
function telefoneVon(r){ if(!r) return []; let L=r.telefone; if(typeof L==="string"){ try{ L=JSON.parse(L); }catch(e){ L=null; } }
  L=(Array.isArray(L)?L:[]).filter(x=>x&&String(x.nr||"").trim()).map(x=>({art:x.art||telArtRaten(x.nr),nr:String(x.nr).trim()}));
  return L.length||!r.tel?L:[{art:telArtRaten(r.tel),nr:String(r.tel).trim()}]; }
let telN=0;
const telZeile=x=>{ const i=++telN; return `<div class="kd-tel"><div class="tf fl kd-tel-art"><select id="telA${i}" data-tel="art">${TEL_ARTEN.map(a=>`<option${a===x.art?" selected":""}>${a}</option>`).join("")}</select><label for="telA${i}">Art</label><span class="arr">${icon("drop")}</span></div>
  <div class="tf"><input id="telN${i}" data-tel="nr" type="tel" inputmode="tel" autocomplete="off" placeholder=" " value="${esc(x.nr||"")}"><label for="telN${i}">Nummer</label></div>
  <button type="button" class="kd-tel-weg" data-act="telWeg" aria-label="Nummer entfernen" title="Nummer entfernen">${icon("close")}</button></div>`; };
function telFelder(d,r,feld="tel",feldL="telefone"){ const tin=d.querySelector(`[data-f="${feld}"]`); if(!tin||d.querySelector(".kd-tels")) return;
  const tfT=tin.closest(".tf"), reihe=tfT.parentElement; const L=telefoneVon(r);
  const block=document.createElement("div"); block.className="kd-tels"; block.dataset.telf=feld; block.dataset.telfl=feldL;
  block.innerHTML=`<input type="hidden" data-f="${feld}" value=""><input type="hidden" data-f="${feldL}" value=""><div class="kd-tel-liste">${(L.length?L:[{art:"Mobil",nr:""}]).map(telZeile).join("")}</div>
    <button type="button" class="kd-tel-neu" data-act="telNeu">${icon("add")}<span>Weitere Nummer</span></button>`;
  if(reihe.classList.contains("fg1")) tfT.replaceWith(block);
  else { tfT.remove(); if(reihe.classList.contains("reihe3")){ reihe.classList.remove("reihe3"); reihe.classList.add("reihe2"); } reihe.before(block); } }
function telSammeln(d){ const b=d&&d.querySelector(".kd-tels"); if(!b) return;
  const L=[...b.querySelectorAll(".kd-tel")].map(z=>({art:z.querySelector('[data-tel="art"]').value,nr:z.querySelector('[data-tel="nr"]').value.replace(/\s+/g," ").trim()})).filter(x=>x.nr);
  b.querySelector(`[data-f="${b.dataset.telf||"tel"}"]`).value=L.length?L[0].nr:""; b.querySelector(`[data-f="${b.dataset.telfl||"telefone"}"]`).value=L.length?JSON.stringify(L):""; }
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('#dlg [data-act="telNeu"],#dlg [data-act="telWeg"],#dlg [data-act="saveLoc"],#dlg [data-act="ktSave"]'); if(!b) return; const d=document.getElementById("dlg");
  if(b.dataset.act==="saveLoc"){ telSammeln(d); adrFertig(d); return; } /* weiter zum Speichern der App */
  if(b.dataset.act==="ktSave"){ telSammeln(d); return; } /* Ansprechpartner: Nummern einsammeln, dann speichert ktSpeichern */
  e.stopPropagation(); e.preventDefault(); const liste=d.querySelector(".kd-tel-liste");
  if(b.dataset.act==="telNeu"){ const da=[...liste.querySelectorAll('[data-tel="art"]')].map(x=>x.value); liste.insertAdjacentHTML("beforeend",telZeile({art:TEL_ARTEN.find(a=>!da.includes(a))||"Sonstige",nr:""})); liste.lastElementChild.querySelector("input").focus(); }
  else { const z=b.closest(".kd-tel"); if(liste.children.length>1) z.remove(); else { const i=z.querySelector("input"); i.value=""; i.focus(); } } },true);
/* Art vorschlagen, sobald eine Mobilnummer erkennbar ist (nur solange man die Art nicht selbst angefasst hat) */
document.addEventListener("input",e=>{ const i=e.target; if(!(i&&i.dataset&&i.dataset.tel==="nr")) return; const s=i.closest(".kd-tel").querySelector('[data-tel="art"]');
  if(!s.dataset.selbst&&["Mobil","Festnetz"].includes(s.value)&&i.value.replace(/\D/g,"").length>=4) s.value=telArtRaten(i.value); });
document.addEventListener("change",e=>{ const s=e.target; if(s&&s.dataset&&s.dataset.tel==="art") s.dataset.selbst="1"; });

/* ===== Adresse: Vorschläge beim Tippen und saubere Schreibweise =====
   Vorschläge von Photon (OpenStreetMap-Daten, Server von Komoot in Deutschland, ohne Schlüssel). Es geht nur der getippte
   Adresstext hinaus – kein Name, keine Kundendaten. Ein Tipp füllt Straße + Hausnummer, PLZ und Ort.
   Schreibweise beim Verlassen des Feldes: „Hauptstr. 5 A“ → „Hauptstraße 5a“, „Kölner Str.“ → „Kölner Straße“. */
function strasseSchoen(v){ let t=String(v||"").replace(/\s+/g," ").trim(); if(!t) return t;
  t=t.replace(/(\p{Ll})str(?:\.|asse(?!\p{L})|(?=[\s\d]|$))/gu,"$1straße")
     .replace(/(^|[\s-])Str(?:\.|asse(?!\p{L})|(?=[\s\d]|$))/giu,"$1Straße")
     .replace(/(\p{L}\.?)(\d)/u,"$1 $2")
     .replace(/(\d)\s*-\s*(\d)/g,"$1-$2")
     .replace(/(\d)\s?([a-zA-Z])(?![\p{L}])/gu,(m,n,b)=>n+b.toLowerCase())
     .replace(/\.(?=\S)/g,". ").replace(/\s+/g," ");
  return t.charAt(0).toUpperCase()+t.slice(1); }
const ortSchoen=v=>{ const t=String(v||"").replace(/\s+/g," ").trim(); return t.charAt(0).toUpperCase()+t.slice(1); };
const ADR={t:0,ab:null,L:[],i:-1,el:null};
function adrHelfer(d){ const s=d.querySelector('[data-f="strasse"]'); if(!s||s.dataset.helfer) return; s.dataset.helfer="1"; s.setAttribute("autocomplete","off");
  const tf=s.closest(".tf"); tf.classList.add("adr-tf"); const box=document.createElement("div"); box.className="adr-vor"; box.hidden=true; box.setAttribute("role","listbox"); tf.appendChild(box);
  s.addEventListener("input",()=>{ clearTimeout(ADR.t); const q=s.value.trim(); if(q.length<3||!navigator.onLine){ adrZu(box); return; } ADR.t=setTimeout(()=>adrSuchen(s,box,q),280); });
  s.addEventListener("keydown",e=>{ if(box.hidden) return; const n=ADR.L.length;
    if(e.key==="ArrowDown"||e.key==="ArrowUp"){ e.preventDefault(); ADR.i=(ADR.i+(e.key==="ArrowDown"?1:-1)+n)%n; adrMalen(box); }
    else if(e.key==="Enter"&&ADR.i>=0){ e.preventDefault(); adrNehmen(d,ADR.L[ADR.i]); adrZu(box); }
    else if(e.key==="Escape"){ e.stopPropagation(); adrZu(box); } });
  s.addEventListener("blur",()=>setTimeout(()=>{ adrZu(box); s.value=strasseSchoen(s.value); },150));
  const o=d.querySelector('[data-f="ort"]'); if(o) o.addEventListener("blur",()=>{ o.value=ortSchoen(o.value); });
  const p=d.querySelector('[data-f="plz"]'); if(p) p.addEventListener("blur",()=>{ const z=p.value.replace(/\D/g,""); if(z.length===5) p.value=z; }); }
function adrFertig(d){ const s=d&&d.querySelector('[data-f="strasse"]'), o=d&&d.querySelector('[data-f="ort"]'); if(s) s.value=strasseSchoen(s.value); if(o) o.value=ortSchoen(o.value); }
const adrZu=box=>{ box.hidden=true; ADR.L=[]; ADR.i=-1; };
async function adrSuchen(s,box,q){ if(ADR.ab) ADR.ab.abort(); const ab=ADR.ab=new AbortController();
  /* Nähe Waldbröl bevorzugen, nur Deutschland */
  const u=`https://photon.komoot.io/api/?q=${encodeURIComponent(strasseSchoen(q))}&lang=de&limit=8&lat=50.877&lon=7.616&bbox=5.86,47.27,15.04,55.06&layer=house&layer=street`;
  let j; try{ const r=await fetch(u,{signal:ab.signal}); if(!r.ok) return; j=await r.json(); }catch(e){ return; }
  if(s.value.trim()!==q) return;
  const nr=(q.match(/\s(\d+\s?[a-zA-Z]?(?:\s?-\s?\d+\s?[a-zA-Z]?)?)\s*$/)||[])[1]||"", gesehen=new Set();
  ADR.L=(j.features||[]).map(f=>{ const p=f.properties||{}, haus=p.type==="house", str=haus?p.street:(p.type==="street"?p.name:p.street);
    if(!str||p.countrycode&&p.countrycode!=="DE") return null; const hn=haus?p.housenumber||"":nr.replace(/\s+/g,"");
    return {strasse:strasseSchoen([str,hn].filter(Boolean).join(" ")),plz:p.postcode||"",ort:p.city||p.town||p.village||p.locality||p.district||"",teil:p.district&&p.district!==(p.city||"")?p.district:""}; })
    .filter(x=>x&&x.plz&&!gesehen.has(x.strasse+x.plz)&&gesehen.add(x.strasse+x.plz)).slice(0,6);
  ADR.i=-1; if(!ADR.L.length){ adrZu(box); return; } adrMalen(box);
  box.onmousedown=e=>e.preventDefault();
  box.onclick=e=>{ const b=e.target.closest("[data-i]"); if(!b) return; adrNehmen(s.closest("#dlg"),ADR.L[+b.dataset.i]); adrZu(box); }; }
function adrMalen(box){ box.innerHTML=ADR.L.map((x,i)=>`<button type="button" class="adr-v${i===ADR.i?" an":""}" data-i="${i}" role="option"><span class="adr-ic">${icon("ort")}</span><span class="adr-t"><b>${esc(x.strasse)}</b><small>${esc([x.plz,x.ort].filter(Boolean).join(" ")+(x.teil?` · ${x.teil}`:""))}</small></span></button>`).join("")
  +`<p class="adr-q">Vorschläge: OpenStreetMap</p>`; box.hidden=false; }
function adrNehmen(d,x){ if(!d||!x) return; const setz=(f,v)=>{ const i=d.querySelector(`[data-f="${f}"]`); if(i&&v){ i.value=v; i.dispatchEvent(new Event("input",{bubbles:true})); } };
  setz("strasse",x.strasse); setz("plz",x.plz); setz("ort",x.ort); clearTimeout(ADR.t);
  const s=d.querySelector('[data-f="strasse"]'); if(s&&!/\d/.test(x.strasse)){ s.focus(); s.setSelectionRange(s.value.length,s.value.length); } }

/* Ansprechpartner mit mehreren Nummern: Antippen des Hörers fragt, welche */
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act="ktAnruf"]'); if(!b) return; e.stopPropagation(); e.preventDefault();
  const r=DB[b.dataset.kind]&&DB[b.dataset.kind].get(b.dataset.r), x=r&&(r.kontakte||[]).find(y=>y.id===b.dataset.k); if(!x) return;
  dialog(x.name||"Anrufen",listOf(telefoneVon(x).map(t=>`<a class="li" href="tel:${esc(t.nr.replace(/[^\d+]/g,""))}" style="text-decoration:none;color:inherit"><span class="av">${icon("phone")}</span><span class="lt"><span class="h">${esc(t.nr)}</span><span class="s">${esc(t.art)}</span></span>${icon("chev")}</a>`)),`<span style="flex:1"></span><button class="btn-text" data-act="cancel">Schließen</button>`); },true);

/* ===== Handy: höchstens 5 Reiter (04.11.2026) =====
   Wo Kunden UND Bibliothek Reiter sind und die Leiste sonst zu voll wird (Gebäudetechnik, Baustelle), gibt es auf dem Handy
   nur „Kunden“ – oben umschalten zwischen Kunden und Bibliothek. iPad und PC behalten beide Reiter. Die App merkt sich die letzte Wahl. */
const kbHandy=()=>typeof WIDE!=="undefined"&&!WIDE.matches;
function kbLetzt(v){ try{ if(v) localStorage.setItem("irrgang_kb",v); return localStorage.getItem("irrgang_kb")||"kunden"; }catch(e){ return "kunden"; } }
function kbSeg(v){ if(!kbHandy()) return ""; kbLetzt(v);
  return `<div class="kb-seg" role="group" aria-label="Anzeigen">${[["kunden","Kunden"],["bibliothek","Bibliothek"]].map(([k,t])=>`<button type="button" data-act="nav" data-v="${k}" aria-pressed="${k===v}">${t}</button>`).join("")}</div>`; }
/* Leiste: Bibliothek raus, „Kunden“ führt dorthin, wo man zuletzt war, und bleibt markiert */
const kbLeiste=L=>(L=typeof leisteOrdnen==="function"?leisteOrdnen(L):L,kbHandy()?L.filter(d=>d[0]!=="bibliothek").map(d=>d[0]==="kunden"?[kbLetzt()==="bibliothek"?"bibliothek":"kunden",d[1],d[2],"kunden"]:d):L);
const kbAktiv=a=>kbHandy()&&a==="bibliothek"?"kunden":a;

/* ===== Einstellungen „Karte beim Kunden“ (Entwickler) – 05.11.2026 ===== */
const KA_FARBEN=["#C8102E","#C62828","#D84315","#E65100","#F9A825","#2E7D32","#00838F","#1565C0","#3949AB","#7B1FA2","#6D4C41","#455A64","#37474F","#000000"];
function kaSpeichern(f){ const neu=!DB.einstellungen.has("karte"), r=DB.einstellungen.get("karte")||{id:"karte"}; f(r); r.deleted=false; saveRec("einstellungen",r,neu); }
function karteEinstView(){ const C=kaCfg(), r=DB.einstellungen.get("karte")||{};
  const seg3=(act,v,L,fmt)=>`<div class="knx-seg">${L.map(x=>`<button type="button" data-act="${act}" data-v="${x}" aria-pressed="${+v===x}">${fmt(x)}</button>`).join("")}</div>`;
  return `<div class="narrow ka-einst">
    <p class="meta" style="margin:0 4px 16px">Gilt für die Karte auf jeder Kunden- und Standortseite, in allen Apps und für alle Mitarbeiter.</p>
    <div class="sec-lbl">Suche</div>
    <div class="lbl">Umkreis</div>${seg3("kaRad",C.radius,[400,800,1500,3000],x=>x<1000?`${x} m`:`${String(x/1000).replace(".",",")} km`)}
    <div class="lbl" style="margin-top:12px">Höchstens so viele Punkte</div>${seg3("kaMax",C.max,[6,12,20,30],x=>String(x))}
    <div class="lbl" style="margin-top:12px">Mindestabstand zwischen Punkten</div>${seg3("kaAbst",C.abstand,[0,50,90,150],x=>x?`${x} m`:"aus")}
    <p class="meta" style="margin:8px 4px 0">Größerer Umkreis findet mehr, die Karte zoomt dafür weiter heraus. Der Mindestabstand verhindert, dass Punkte übereinanderliegen.</p>
    <div class="sec-row" style="margin-top:22px"><div class="sec-lbl">Anhaltspunkte</div></div>
    <p class="meta" style="margin:0 4px 8px">Reihenfolge = was zuerst gezeigt wird, wenn es mehr Treffer als erlaubt gibt. Antippen für Farbe, Symbol und an/aus.</p>
    <div class="ka-liste">${C.rang.map((k,i)=>{ const [t]=POI_ART[k], pfad=C.icon(k), an=C.an(k);
      return `<div class="ka-z${an?"":" aus"}"><button type="button" class="ka-k" data-act="kaArt" data-v="${k}"><i style="background:${C.farbe(k)}"><svg viewBox="0 0 24 24"><path d="${pfad}"/></svg></i><b>${esc(t)}</b><small>${an?"wird gezeigt":"ausgeblendet"}</small></button>
        <button type="button" class="kx-tk" data-act="kaAuf" data-i="${i}" ${i?"":"disabled"} aria-label="${esc(t)} nach oben">↑</button><button type="button" class="kx-tk" data-act="kaAb" data-i="${i}" ${i<C.rang.length-1?"":"disabled"} aria-label="${esc(t)} nach unten">↓</button></div>`; }).join("")}</div>
    <div class="sec-lbl" style="margin-top:22px">Markierung des Kunden</div>
    <div class="ka-farben">${["",...KA_FARBEN].map(f=>`<button type="button" class="ka-f${f?"":" std"}" data-act="kaPin" data-v="${f}" aria-pressed="${(r.pin||"")===f}" style="${f?`background:${f}`:""}" aria-label="${f||"Standard"}">${f?"":"Std"}</button>`).join("")}</div>
    <div class="kx-knoepfe" style="margin-top:24px"><button type="button" class="btn-tonal" data-act="kaStd">Alles auf Standard</button><button type="button" class="btn-tonal" data-act="kaNeu">Gemerkte Punkte neu suchen</button></div></div>`; }
function kaArtDlg(k){ const C=kaCfg(), [t]=POI_ART[k], pfad=C.icon(k), akt=((DB.einstellungen.get("karte")||{}).arten||{})[k]||{};
  dialog(t,`<div class="knx-seg">${[["1","zeigen"],["0","ausblenden"]].map(([v,x])=>`<button type="button" data-act="kaAn" data-k="${k}" data-v="${v}" aria-pressed="${(C.an(k)?"1":"0")===v}">${x}</button>`).join("")}</div>
    <div class="lbl" style="margin-top:14px">Farbe</div><div class="ka-farben">${KA_FARBEN.map(f=>`<button type="button" class="ka-f" data-act="kaFarbe" data-k="${k}" data-v="${f}" aria-pressed="${C.farbe(k).toLowerCase()===f.toLowerCase()}" style="background:${f}" aria-label="${f}"></button>`).join("")}</div>
    <div class="lbl" style="margin-top:14px">Symbol</div><div class="ka-icons">${Object.entries(KA_ICONS).map(([n,pf])=>`<button type="button" class="ka-ic" data-act="kaIcon" data-k="${k}" data-v="${n}" aria-pressed="${pfad===pf}" aria-label="${n}"><svg viewBox="0 0 24 24"><path d="${pf}"/></svg></button>`).join("")}</div>
    <div class="ka-vorschau"><span class="kd-poi zeig"><i style="--poi:${C.farbe(k)}"><svg viewBox="0 0 24 24"><path d="${pfad}"/></svg></i><span>${esc(t)}</span></span></div>`,
    `<button class="btn-text" data-act="kaArtStd" data-k="${k}">Standard</button><span style="flex:1"></span><button class="btn-text" data-act="cancel">Fertig</button>`); }
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act^="ka"]'); if(!b||!["kaRad","kaMax","kaAbst","kaArt","kaAuf","kaAb","kaPin","kaStd","kaNeu","kaAn","kaFarbe","kaArtStd","kaIcon"].includes(b.dataset.act)) return; e.stopPropagation();
  const a=b.dataset.act, v=b.dataset.v, k=b.dataset.k, y=scrollY, neu=()=>{ render(); scrollTo(0,y); };
  if(a==="kaRad"){ kaSpeichern(r=>r.radius=+v); neu(); return; }
  if(a==="kaMax"){ kaSpeichern(r=>r.max=+v); neu(); return; }
  if(a==="kaAbst"){ kaSpeichern(r=>r.abstand=+v); neu(); return; }
  if(a==="kaArt"){ kaArtDlg(v); return; }
  if(a==="kaAuf"||a==="kaAb"){ const R=kaCfg().rang.slice(), i=+b.dataset.i, j=a==="kaAuf"?i-1:i+1; if(j<0||j>=R.length) return; [R[i],R[j]]=[R[j],R[i]]; kaSpeichern(r=>r.rang=R); neu(); return; }
  if(a==="kaPin"){ kaSpeichern(r=>{ if(v) r.pin=v; else delete r.pin; }); neu(); return; }
  if(a==="kaStd"){ kaSpeichern(r=>{ ["radius","max","abstand","pin","arten","rang"].forEach(x=>delete r[x]); }); neu(); toast("Karte auf Standard"); return; }
  if(a==="kaNeu"){ if(META.poi2){ META.poi2={}; metaSave(); } toast("Wird beim nächsten Öffnen einer Kundenkarte neu gesucht"); return; }
  if(a==="kaAn"||a==="kaFarbe"||a==="kaArtStd"||a==="kaIcon"){ kaSpeichern(r=>{ r.arten=r.arten||{}; const o=r.arten[k]=r.arten[k]||{}; if(a==="kaAn") o.an=v==="1"; if(a==="kaFarbe") o.farbe=v; if(a==="kaIcon") o.icon=v; if(a==="kaArtStd"){ delete o.farbe; delete o.icon; } }); kaArtDlg(k); neu(); return; } },true);

/* ===== Standort zum Hauptsitz machen (Max 13.11.2026) =====
   Beispiel: Sarstedt verlegt die Zentrale von Rommelsdorf (Adresse des Kunden) nach Rheinbach (Standort).
   1. Neuer Standort für den alten Hauptsitz (Name frei, z. B. „Rommelsdorf“) – bekommt Adresse, Geräte, Parken, Gebäude des Kunden.
   2. Der Kunde bekommt Adresse, Geräte, Parken, Gebäude von Rheinbach; Ansprechpartner von Rheinbach kommen zum Kunden dazu.
   3. Rheinbach als Standort wird gelöscht – alles, was dort hing (Prüfungen, Ladeparks, Baustellen, Aufträge, E-Checks, Anlagen …), hängt jetzt am Hauptsitz;
      alles vom alten Hauptsitz hängt am neuen Standort.
   Punkt 3 läuft über einen Umzugsauftrag in „einstellungen“ (typ "hsTausch"): jede App setzt ihn für ihre Daten um, auf jedem Gerät, auch später nach dem Abgleich.
   Jeder umgestellte Datensatz merkt sich den Auftrag (hsT), damit nichts doppelt umgestellt wird. Dokumente im Kundenordner (SharePoint) bleiben, wo sie liegen. */
const HST_ORT=["strasse","plz","ort","adresse","geraete","park","bauteile","ebenen","lat","lon","geo"];
const HST_K=["pruefungen","ladeparks"]; /* EVSE: Adresse des Kunden = „k:<Kunde>“; sonst leer */
function hsTauschAsk(sid){ const s=DB.standorte&&DB.standorte.get(sid), k=s&&DB.kunden.get(s.kundeId); if(!s||!k) return;
  if(!(ME.admin||ME.buero)){ toast("Das dürfen Chef und Büro"); return; }
  const alt=typeof adrText==="function"?adrText(k):"", neu=typeof adrText==="function"?adrText(s):"";
  if(!neu){ toast("Keine Adresse hinterlegt – doppelt angelegt? Dann „Zusammenführen“ nehmen"); return; }
  dialog("Zum Hauptsitz machen?",`<p style="margin:0 0 12px"><b>${esc(s.name)}</b> wird der neue Hauptsitz von ${esc(k.name)}.</p>
    <ul style="margin:0 0 12px;padding-left:20px;line-height:1.55"><li>Neue Adresse beim Kunden: ${esc(neu)}</li><li>Der bisherige Hauptsitz${alt?` (${esc(alt)})`:""} wird ein normaler Standort.</li><li>Prüfungen, Ladeparks, Geräte, Baustellen und Aufträge ziehen mit ihrem Ort mit – es geht nichts verloren.</li></ul>
    <div class="fg1">${tf("hstName","Name für den bisherigen Hauptsitz",k.ort||"",{form:true,ph:"z. B. Rommelsdorf"})}</div>
    <p class="sup" style="margin:12px 0 0">Dokumente und Fotos im Kundenordner bleiben, wo sie liegen.</p>`,
    `<button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="hsTauschOk" data-id="${esc(sid)}">Hauptsitz wechseln</button>`); }
function hsTauschAusfuehren(sid,name){ const s=DB.standorte.get(sid), k=s&&DB.kunden.get(s.kundeId); if(!s||!k) return;
  const K=k.id, n={id:uid(),kundeId:K,name:name||"Bisheriger Hauptsitz",notiz:""};
  HST_ORT.forEach(f=>{ if(k[f]!==undefined&&k[f]!=="") n[f]=JSON.parse(JSON.stringify(k[f])); });
  saveRec("standorte",n,true);
  HST_ORT.forEach(f=>{ if(s[f]!==undefined&&s[f]!=="") k[f]=JSON.parse(JSON.stringify(s[f])); else delete k[f]; });
  const kt=(s.kontakte||[]).filter(x=>x&&(x.name||x.tel||x.mail)); if(kt.length) k.kontakte=[...(k.kontakte||[]),...kt.map(x=>Object.assign({},x,{id:uid()}))];
  const vo=[!kt.length&&s.ansprech,s.tel,s.notiz].filter(Boolean).join(" · "); if(vo) k.notiz=[k.notiz,`Vor Ort (früher Standort ${s.name}): ${vo}`].filter(Boolean).join("\n");
  saveRec("kunden",k,false);
  s.deleted=true; s.hsNach=K; saveRec("standorte",s,false);
  saveRec("einstellungen",{id:"hst-"+uid(),typ:"hsTausch",kundeId:K,alt:sid,neu:n.id,ts:Date.now()},true);
  hsTauschLauf(); return n; }
/* Umzugsaufträge für die Daten dieser App umsetzen */
function hsTauschLauf(){ if(typeof DB==="undefined"||!DB.einstellungen||typeof KINDS==="undefined") return 0;
  const T=live("einstellungen").filter(r=>(r.typ==="hsTausch"&&r.kundeId&&r.alt&&r.neu)||(r.typ==="ortMerge"&&r.kundeId&&r.von&&r.nach)).sort((a,b)=>(a.ts||0)-(b.ts||0)); if(!T.length) return 0; let n=0;
  for(const t of T){ const HQ="k:"+t.kundeId;
    if(t.typ==="ortMerge"){ n+=ortMergeEin(t); continue; }
    /* Gebäude/Verteiler: feste ID je Ort („g-<ortId>“) – Datensätze tauschen statt nur ortId ändern */
    if(DB.gebaeude){ const gid=o=>"g-"+String(o).replace(/[^A-Za-z0-9_-]/g,"_"), gHQ=DB.gebaeude.get(gid(HQ)), gS=DB.gebaeude.get(gid(t.alt));
      const offen=g=>g&&!g.deleted&&!(g.hsT||[]).includes(t.id)&&((g.created||0)<t.ts||g.ortId===t.alt);
      const kopie=(g,o)=>Object.assign(JSON.parse(JSON.stringify(g)),{id:gid(o),ortId:o,hsT:[...(g.hsT||[]),t.id]});
      const aHQ=offen(gHQ)?kopie(gHQ,t.neu):null, aS=offen(gS)?kopie(gS,HQ):null;
      if(aHQ){ delete aHQ._etag; delete aHQ._itemId; saveRec("gebaeude",aHQ,true); n++; }
      if(aS){ const ziel=DB.gebaeude.get(aS.id); delete aS._etag; delete aS._itemId; if(ziel){ if(ziel._etag) aS._etag=ziel._etag; if(ziel._itemId) aS._itemId=ziel._itemId; } saveRec("gebaeude",aS,false); gS.deleted=true; gS.hsT=[...(gS.hsT||[]),t.id]; saveRec("gebaeude",gS,false); n++; }
      else if(aHQ){ gHQ.deleted=true; gHQ.hsT=[...(gHQ.hsT||[]),t.id]; saveRec("gebaeude",gHQ,false); } }
    for(const kind of KINDS){ if(["kunden","standorte","einstellungen","gebaeude"].includes(kind)||!DB[kind]) continue;
      for(const r of DB[kind].values()){ if(!r||r.deleted||r.demo||(r.hsT||[]).includes(t.id)) continue;
        const bezS=kind==="dateien"&&r.bezugKind==="standorte"&&r.bezugId===t.alt;
        if(r.kundeId!==t.kundeId&&!(kind==="ladeparks"&&(r.standortId===t.alt||r.standortId===HQ))&&!bezS) continue;
        const nutztAlt=r.standortId===t.alt||r.ortId===t.alt||bezS;
        if((r.created||0)>=t.ts&&!nutztAlt) continue; /* nach dem Wechsel angelegt – gilt schon für den neuen Hauptsitz */
        let ch=false; const set=(f,v)=>{ if(r[f]!==v){ r[f]=v; ch=true; } };
        if("standortId" in r){ const v=r.standortId;
          if(v===HQ) set("standortId",t.neu);
          else if(v===t.alt) set("standortId",HST_K.includes(kind)?HQ:"");
          else if(!v&&!HST_K.includes(kind)&&r.kundeId===t.kundeId&&!(r.ortId&&r.ortId!==HQ)) set("standortId",t.neu); }
        if("ortId" in r){ if(r.ortId===HQ) set("ortId",t.neu); else if(r.ortId===t.alt) set("ortId",HQ); }
        if(bezS){ r.bezugKind="kunden"; r.bezugId=t.kundeId; ch=true; }
        if(ch){ r.hsT=[...(r.hsT||[]),t.id]; saveRec(kind,r,false); n++; } } } }
  return n; }
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act="hsTauschAsk"],[data-act="hsTauschOk"]'); if(!b) return; e.stopImmediatePropagation(); e.preventDefault();
  if(b.dataset.act==="hsTauschAsk"){ closeOverlays(); hsTauschAsk(b.dataset.id); return; }
  const nm=(document.querySelector('#dlg [data-f="hstName"]')||{}).value||""; if(!nm.trim()){ toast("Bitte einen Namen für den bisherigen Hauptsitz eingeben"); return; }
  const s=DB.standorte.get(b.dataset.id), K=s&&s.kundeId; closeOverlays(); const n=hsTauschAusfuehren(b.dataset.id,nm.trim()); if(!n) return;
  toast(`${s.name} ist jetzt der Hauptsitz – „${n.name}“ ist ein Standort`);
  if(typeof go==="function") go({v:"kunde",id:K}); else if(typeof render==="function") render(); },true);
addEventListener("load",()=>setTimeout(()=>{ try{ if(hsTauschLauf()&&typeof render==="function") render(); }catch(e){} },4000));
setInterval(()=>{ try{ if(hsTauschLauf()&&typeof softRender==="function") softRender(); }catch(e){} },30000);

/* ===== Standort zusammenführen (Max 13.11.2026) =====
   Doppelt angelegte Orte zusammenlegen, z. B. Standort „Hauptsitz Rommelsdorf“ in den Hauptsitz (Adresse des Kunden) oder zwei „Werk Rheinbach“.
   Ziel behält Name und Adresse (fehlt dort etwas, kommt es vom zusammengeführten Standort); Geräte, Ansprechpartner und Notizen kommen dazu.
   Alles, was am Standort hing, hängt danach am Ziel – über einen Auftrag in „einstellungen“ (typ "ortMerge"), den jede App für ihre Daten umsetzt. */
function ortMergeAsk(sid){ const s=DB.standorte&&DB.standorte.get(sid), k=s&&DB.kunden.get(s.kundeId); if(!s||!k) return;
  if(!(ME.admin||ME.buero)){ toast("Das dürfen Chef und Büro"); return; }
  const Z=[["k:"+k.id,"Hauptsitz",adrText(k)||"Adresse des Kunden"],...live("standorte").filter(x=>x.kundeId===k.id&&x.id!==sid).sort((a,b)=>String(a.name).localeCompare(String(b.name),"de")).map(x=>[x.id,x.name||"Standort",adrText(x)||""])];
  dialog("Zusammenführen",`<p style="margin:0 0 12px"><b>${esc(s.name)}</b> wird übernommen von …</p>
    <div class="list wahl">${Z.map(([id,n,a])=>`<div class="li" role="button" tabindex="0" data-act="ortMergeOk" data-von="${esc(sid)}" data-nach="${esc(id)}"><span class="av">${icon(id.startsWith("k:")?"firma":"ort")}</span><span class="lt"><span class="h">${esc(n)}</span>${a?`<span class="s">${esc(a)}</span>`:""}</span></div>`).join("")}</div>
    <p class="sup" style="margin:12px 0 0">Prüfungen, Ladeparks, Geräte, Ansprechpartner, Baustellen, Aufträge, E-Checks und Anlagen kommen mit. „${esc(s.name)}“ verschwindet danach aus der Liste. Dokumente im Kundenordner bleiben, wo sie liegen.</p>`,
    `<button class="btn-text" data-act="cancel">Abbrechen</button>`); }
function ortMergeAusfuehren(von,nach){ const s=DB.standorte.get(von), K=s&&s.kundeId, k=K&&DB.kunden.get(K); if(!s||!k) return null;
  const hq=nach==="k:"+K, z=hq?k:DB.standorte.get(nach); if(!z) return null;
  ["strasse","plz","ort","adresse","park","bauteile","ebenen","lat","lon","geo"].forEach(f=>{ const leer=z[f]===undefined||z[f]===""||(Array.isArray(z[f])&&!z[f].length); if(leer&&s[f]!==undefined&&s[f]!=="") z[f]=JSON.parse(JSON.stringify(s[f])); });
  if(Array.isArray(s.geraete)&&s.geraete.length){ const G=Array.isArray(z.geraete)?z.geraete:[], sch=g=>String(g.sn||g.gid||JSON.stringify(g)).toLowerCase();
    s.geraete.forEach(g=>{ if(!G.some(x=>sch(x)===sch(g))) G.push(JSON.parse(JSON.stringify(g))); }); z.geraete=G; }
  const kt=(s.kontakte||[]).filter(x=>x&&(x.name||x.tel||x.mail)); if(kt.length) z.kontakte=[...(z.kontakte||[]),...kt.map(x=>Object.assign({},x,{id:uid()}))];
  const vo=[!kt.length&&s.ansprech,s.tel,s.notiz].filter(Boolean).join(" · "); if(vo) z.notiz=[z.notiz,`Aus „${s.name}“: ${vo}`].filter(Boolean).join("\n");
  saveRec(hq?"kunden":"standorte",z,false);
  s.deleted=true; s.mergedInto=nach; saveRec("standorte",s,false);
  saveRec("einstellungen",{id:"stm-"+uid(),typ:"ortMerge",kundeId:K,von,nach,ts:Date.now()},true);
  hsTauschLauf(); return z; }
/* einen Zusammenführ-Auftrag für die Daten dieser App umsetzen (wiederholbar: was noch auf den alten Standort zeigt, wird umgehängt) */
function ortMergeEin(t){ const HQ="k:"+t.kundeId, hq=t.nach===HQ; let n=0;
  if(DB.gebaeude){ const gid=o=>"g-"+String(o).replace(/[^A-Za-z0-9_-]/g,"_"), q=DB.gebaeude.get(gid(t.von));
    if(q&&!q.deleted){ const z=DB.gebaeude.get(gid(t.nach));
      if(!z||z.deleted){ const c=Object.assign(JSON.parse(JSON.stringify(q)),{id:gid(t.nach),ortId:t.nach}); delete c.deleted; delete c._etag; delete c._itemId; if(z){ if(z._etag) c._etag=z._etag; if(z._itemId) c._itemId=z._itemId; } saveRec("gebaeude",c,!z); }
      else { for(const f of Object.keys(q)) if(Array.isArray(q[f])&&f!=="hsT"){ const A=Array.isArray(z[f])?z[f]:(z[f]=[]); q[f].forEach(x=>{ if(!(x&&x.id&&A.some(y=>y&&y.id===x.id))) A.push(x); }); } saveRec("gebaeude",z,false); }
      q.deleted=true; saveRec("gebaeude",q,false); n++; } }
  for(const kind of KINDS){ if(["kunden","standorte","einstellungen","gebaeude"].includes(kind)||!DB[kind]) continue;
    for(const r of DB[kind].values()){ if(!r||r.deleted||r.demo) continue; let ch=false;
      if(r.standortId===t.von){ r.standortId=hq?(HST_K.includes(kind)?HQ:""):t.nach; ch=true; }
      if(r.ortId===t.von){ r.ortId=t.nach; ch=true; }
      if(kind==="dateien"&&r.bezugKind==="standorte"&&r.bezugId===t.von){ if(hq){ r.bezugKind="kunden"; r.bezugId=t.kundeId; } else r.bezugId=t.nach; ch=true; }
      if(ch){ saveRec(kind,r,false); n++; } } }
  return n; }
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act="ortMergeAsk"],[data-act="ortMergeOk"]'); if(!b) return; e.stopImmediatePropagation(); e.preventDefault();
  if(b.dataset.act==="ortMergeAsk"){ closeOverlays(); ortMergeAsk(b.dataset.id); return; }
  const s=DB.standorte.get(b.dataset.von), K=s&&s.kundeId, nach=b.dataset.nach; closeOverlays(); const z=ortMergeAusfuehren(b.dataset.von,nach); if(!z) return;
  toast(`„${s.name}“ ist jetzt Teil von ${nach.startsWith("k:")?"Hauptsitz":"„"+(z.name||"Standort")+"“"}`);
  if(typeof go==="function") go({v:"kunde",id:K}); else if(typeof render==="function") render(); },true);
