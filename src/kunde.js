/* Kundenansicht – gemeinsam für Übersicht, EVSE, Baustelle und E-Check (tools/build.py setzt es ein).
   Eckdaten mit Schnellknöpfen, kleine Karte mit Anhaltspunkten, Ansprechpartner mit Rolle.
   kdOben(r,kind,ss) = Eckdaten + Karte; kontakteView(kind,r); Ablage kommt aus dateien.js. */
function infoKarte(r,kind){
  const adr=adrText(r), tel=r.tel&&r.tel.replace(/[^\d+]/g,""), vorschlag=kind==="kunden"&&!r.web?webVorschlag(r):"";
  const qa=(href,ic,t,act)=>`<${href?`a href="${href}"${/^https/.test(href)?' target="_blank" rel="noopener"':""}`:`button type="button" data-act="${act}"`} class="qa"><span class="qa-ic">${icon(ic)}</span><span>${t}</span></${href?"a":"button"}>`;
  const aktionen=[tel&&qa("tel:"+tel,"phone","Anrufen"),r.mail&&qa("mailto:"+r.mail,"mail","E-Mail"),adr&&qa(mapsHref(adr),"route","Route"),
    kind==="kunden"&&(r.web?qa(webHref(r.web),"globe","Webseite"):vorschlag?qa(webHref(vorschlag),"globe","Webseite"):canEdit(r)?qa("","search","Webseite suchen","webSuchen"):""),
    typeof nav!=="undefined"&&nav.id===r.id&&kdDarf(r)&&qa("","edit","Bearbeiten","editLoc")].filter(Boolean);
  /* Eckdaten nur zum Lesen – Anrufen, E-Mail, Route und Webseite gibt es oben als Knöpfe */
  const z=(ic,l,v)=>v?`<div class="dz"><span class="dz-ic">${icon(ic)}</span><span class="dz-t"><small>${l}</small><span>${esc(v)}</span></span></div>`:"";
  const zeilen=[z("tag","Kundennummer",r.kdnr),z("ort","Adresse",adr),
    z("phone","Telefon",r.tel),z("mail","E-Mail",r.mail),
    z("globe",r.web?"Webseite":"Webseite (aus der E-Mail-Adresse)",r.web?webText(r.web):vorschlag),z("notes","Notiz",r.notiz)].join("");
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
  const zeile=x=>{ const tel=x.tel&&x.tel.replace(/[^\d+]/g,"");
    return `<div class="kt-z"><button class="kt-haupt" ${darf?`data-act="ktEdit" data-kind="${kind}" data-k="${esc(x.id)}"`:"disabled"}><span class="kt-av">${esc(initials(x.name||x.rolle||"?"))}</span>
      <span class="kt-t"><b>${esc(x.name||"Ohne Namen")}</b><small>${esc([x.rolle,x.tel,x.mail].filter(Boolean).join(" · "))}</small></span></button>
      ${tel?`<a class="kt-b" href="tel:${tel}" aria-label="${esc(x.name||"")} anrufen" title="Anrufen">${icon("phone")}</a>`:""}${x.mail?`<a class="kt-b" href="mailto:${esc(x.mail)}" aria-label="E-Mail an ${esc(x.name||"")}" title="E-Mail">${icon("mail")}</a>`:""}</div>`; };
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
}
function ktSpeichern(del){
  const P=ktForm; if(!P) return; const r=DB[P.kind].get(P.rid); if(!r) return;
  let L=(r.kontakte||[]).slice(); if(!L.length&&r.ansprech) L=[{id:uid(),rolle:"Ansprechpartner",name:r.ansprech}];
  const id=P.id==="alt"?(L[0]&&L[0].id):P.id;
  if(del) L=L.filter(x=>x.id!==id);
  else { const F=formVals(), x={id:id||uid(),name:F.ktName,rolle:F.ktRolle,tel:F.ktTel,mail:F.ktMail,notiz:F.ktNotiz};
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
  const w=O.find(x=>x.id===karteWahl[r.id])||O[0];
  setTimeout(()=>karteLaden(w.a),0);
  return `<div class="kd-karte" id="kdKarte" data-a="${esc(w.a)}"><div class="kd-slot"></div><span class="kd-lade">${icon("ort")}</span><button class="kd-zentr" data-act="karteZentr" hidden title="Zurück zum Ort" aria-label="Zurück zum Ort"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg></button>
    ${O.length>1?`<div class="kd-orte">${O.map(x=>`<button class="kd-ort" data-act="karteOrt" data-r="${esc(r.id)}" data-id="${esc(x.id)}" aria-pressed="${x===w}">${esc(x.t)}</button>`).join("")}</div>`:""}</div>`;
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
const POI_RANG=["supermarket","place_of_worship","fuel","station","townhall","school","pharmacy","hospital","fire_station","bank"];
/* Zwischenspeicher je Ort: Treffer 30 Tage, „nichts gefunden“ nur 1 Tag (sonst bleibt ein ausgelasteter Server einen Monat lang hängen).
   META.poi aus älteren Fassungen kann solche leeren Antworten enthalten → einmalig verworfen (poi2). */
async function kartePoiHolen(g){ const key=g.lat.toFixed(4)+","+g.lon.toFixed(4); if(META.poi) delete META.poi; META.poi2=META.poi2||{}; const alt=META.poi2[key];
  if(alt&&Date.now()-alt.t<(alt.L.length?30:1)*864e5) return alt.L;
  const um=`(around:800,${g.lat},${g.lon})`, q=`[out:json][timeout:15];(nwr${um}["shop"="supermarket"];nwr${um}["amenity"~"^(place_of_worship|fuel|school|pharmacy|townhall|hospital|bank|fire_station)$"];nwr${um}["railway"="station"];);out center 80;`;
  /* Overpass-Server sind oft ausgelastet (Okt. 2026: alle vier zeitweise ohne Antwort): alle gleichzeitig fragen, die erste brauchbare Antwort zählt (max. 10 s).
     Klappt keiner, ersatzweise Nominatim (je Art eine Suche im Kartenausschnitt, eine pro Sekunde laut Nutzungsregeln). */
  const ov=srv=>new Promise((ok,no)=>{ const ab=new AbortController(), t=setTimeout(()=>ab.abort(),10000);
    fetch(srv,{method:"POST",body:"data="+encodeURIComponent(q),headers:{"Content-Type":"application/x-www-form-urlencoded"},signal:ab.signal}).then(r=>r.ok?r.json():Promise.reject(r.status))
      .then(j=>{ /* ausgelastet: Overpass antwortet trotzdem mit 200, leerer Liste und „remark: runtime error …“ */ if(j&&Array.isArray(j.elements)&&!(j.remark&&/error|timeout|busy|out of memory/i.test(j.remark))) ok(j); else no(0); }).catch(no).finally(()=>clearTimeout(t)); });
  const SRV=["https://overpass-api.de/api/interpreter","https://overpass.private.coffee/api/interpreter","https://maps.mail.ru/osm/tools/overpass/api/interpreter","https://overpass.kumi.systems/api/interpreter"];
  let j=await new Promise(ok=>{ let offen=SRV.length; SRV.forEach(u=>ov(u).then(ok,()=>{ if(!--offen) ok(null); })); });
  if(!j) j=await kartePoiNominatim(g);
  if(!j) throw new Error("Anhaltspunkte nicht erreichbar");
  const d=(a,b)=>Math.hypot((a.lat-b.lat)*111000,(a.lon-b.lon)*111000*Math.cos(a.lat*Math.PI/180));
  let L=(j.elements||[]).map(e=>{ const t=e.tags||{}, art=t.shop==="supermarket"?"supermarket":t.railway==="station"?"station":t.amenity, lat=e.lat||(e.center&&e.center.lat), lon=e.lon||(e.center&&e.center.lon);
    return POI_ART[art]&&lat?{art,lat,lon,n:String(t.name||t.brand||POI_ART[art][0]).slice(0,28)}:null; }).filter(Boolean);
  L.forEach(x=>x.d=d(x,g)); L=L.filter(x=>x.d>25).sort((a,b)=>POI_RANG.indexOf(a.art)-POI_RANG.indexOf(b.art)||a.d-b.d);
  const W=[]; for(const x of L){ if(W.length>=12) break; if(W.some(y=>d(x,y)<90)) continue; W.push({art:x.art,lat:x.lat,lon:x.lon,n:x.n}); }
  META.poi2[key]={t:Date.now(),L:W}; const ks=Object.keys(META.poi2); if(ks.length>60) delete META.poi2[ks[0]]; metaSave(); return W; }
/* Ersatz über Nominatim: Suchbegriffe, die Nominatim als Kategorie versteht; Ergebnis im Overpass-Format */
const POI_NOM=[["supermarket","Supermarkt","shop/supermarket"],["place_of_worship","place of worship","amenity/place_of_worship"],["fuel","Tankstelle","amenity/fuel"],["station","railway station","railway/station"],
  ["townhall","Rathaus","amenity/townhall"],["school","Schule","amenity/school"],["pharmacy","Apotheke","amenity/pharmacy"],["hospital","Krankenhaus","amenity/hospital"],["fire_station","Feuerwehr","amenity/fire_station"],["bank","Banken","amenity/bank"]];
async function kartePoiNominatim(g){ const dx=.011, dy=.0072, vb=[g.lon-dx,g.lat+dy,g.lon+dx,g.lat-dy].join(","), E=[]; let ok=0;
  for(const [art,q,typ] of POI_NOM){
    try{ const r=await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&bounded=1&accept-language=de&viewbox=${vb}&q=${encodeURIComponent(q)}`); if(r.ok){ ok++;
        (await r.json()).filter(x=>`${x.category}/${x.type}`===typ).forEach(x=>{ const [k,v]=typ.split("/"); E.push({lat:+x.lat,lon:+x.lon,tags:{[k]:v,name:x.name||""}}); }); } }catch(e){}
    await new Promise(r=>setTimeout(r,1100)); }
  return ok?{elements:E}:null; }
async function kartePoi(g,a){ (KARTE.poi||[]).forEach(m=>m.remove()); KARTE.poi=[];
  let L=[]; try{ L=await kartePoiHolen(g); }catch(e){ console.warn("Anhaltspunkte:",e.message); KARTE.poiA=null; return; }
  const el=document.getElementById("kdKarte"); if(!el||el.dataset.a!==a||!KARTE.map) return;
  KARTE.poi=L.map(x=>{ const [t,f,pfad]=POI_ART[x.art], d=document.createElement("div"); d.className="kd-poi"; d.title=`${t}: ${x.n}`;
    d.addEventListener("click",e=>{ e.stopPropagation(); const an=!d.classList.contains("zeig"); document.querySelectorAll(".kd-poi.zeig").forEach(x=>x.classList.remove("zeig")); d.classList.toggle("zeig",an); });
    d.innerHTML=`<i style="--poi:${f}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${pfad}"/></svg></i><span>${esc(x.n)}</span>`;
    return new maplibregl.Marker({element:d,anchor:"left",offset:[-13,0]}).setLngLat([x.lon,x.lat]).addTo(KARTE.map); });
  if(KARTE.mk){ const p=KARTE.mk.getElement(); p.parentNode&&p.parentNode.appendChild(p); } }
function karteVorlagePoiAus(){ try{ const st=KARTE.map.getStyle(); (st&&st.layers||[]).forEach(l=>{ if(/^poi/.test(l.id)) KARTE.map.setLayoutProperty(l.id,"visibility","none"); }); }catch(e){} }
const karteGrenze=c=>[[c[0]-.022,c[1]-.014],[c[0]+.022,c[1]+.014]];
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
      dragRotate:false,pitchWithRotate:false,touchPitch:false,keyboard:false,cooperativeGestures:true,attributionControl:false,fadeDuration:0,
      locale:{"CooperativeGesturesHandler.WindowsHelpText":"Zum Zoomen Strg + Mausrad – oder + und −","CooperativeGesturesHandler.MacHelpText":"Zum Zoomen ⌘ + Mausrad – oder + und −","CooperativeGesturesHandler.MobileHelpText":"Mit zwei Fingern verschieben und zoomen",
        "NavigationControl.ZoomIn":"Vergrößern","NavigationControl.ZoomOut":"Verkleinern"}});
    KARTE.map.touchZoomRotate.disableRotation();
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
    const m=document.createElement("div"); m.className="kd-pin"; KARTE.mk=new maplibregl.Marker({element:m,anchor:"bottom"}).setLngLat(c).addTo(KARTE.map);
  } else {
    slot.appendChild(KARTE.el); KARTE.map.resize();
    if(KARTE.stil!==stil){ KARTE.stil=stil; KARTE.map.setStyle(karteStil(stil)); }
    const alt=KARTE.mk.getLngLat(); KARTE.mk.setLngLat(c); KARTE.map.setMaxBounds(karteGrenze(c));
    if(Math.abs(alt.lng-c[0])+Math.abs(alt.lat-c[1])>1e-6) KARTE.map.easeTo({center:c,duration:500}); else KARTE.map.jumpTo({center:c});
  }
  const l=el2.querySelector(".kd-lade"); if(l) l.hidden=true;
  if(KARTE.poiA!==a||!(KARTE.poi||[]).length){ KARTE.poiA=a; kartePoi(g,a); }
}
matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change",()=>{ const el=document.getElementById("kdKarte"); if(el) karteLaden(el.dataset.a); });

/* Seitenkopf der Kundenansicht: Eckdaten und Karte nebeneinander (ab 900 px), darunter einspaltig */
const kdOben=(r,kind,ss)=>`<div class="kd-oben">${infoKarte(r,kind)}${karteView(r,ss||[])}</div>`;
/* Abschnittskopf mit rundem Plus rechts – wie in der Übersicht */
/* Kunde/Standort: kein ⋮ – Bearbeiten steht als Schnellaktion in der Kontaktkarte, Löschen im Bearbeiten-Fenster */
function kdKopfKnopf(){ const b=document.getElementById("menuBtn"); if(b&&typeof VIEW_KIND!=="undefined"&&VIEW_KIND[nav.v]) b.hidden=true; }
const kdLoeschKnopf=(rec,darf)=>rec&&darf&&typeof nav!=="undefined"&&nav.id===rec.id?`<button class="btn-text danger" data-act="locDelAsk">Löschen</button>`:"";
const karteKopf=(t,act,label,extra)=>`<div class="card-kopf"><h3>${t}</h3>${act?`<span class="ab-btns"><button class="ab-ic" data-act="${act}"${extra||""} aria-label="${esc(label)}" title="${esc(label)}">${icon("add")}</button></span>`:""}</div>`;
const kdKopf=(t,act,label,extra)=>`<div class="sec-row"><div class="sec-lbl">${t}</div>${act?`<span class="ab-btns"><button class="ab-ic" data-act="${act}"${extra||""} aria-label="${esc(label)}" title="${esc(label)}">${icon("add")}</button></span>`:""}</div>`;

/* Klicks der Kundenansicht – eigene Abfangung, die Apps brauchen dafür nichts im eigenen switch */
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act="ktNeu"],[data-act="ktEdit"],[data-act="ktRolleWahl"],[data-act="ktSave"],[data-act="ktDel"],[data-act="karteZentr"],[data-act="karteOrt"]'); if(!b) return;
  e.stopPropagation(); e.preventDefault(); const a=b.dataset.act;
  if(a==="ktNeu"||a==="ktEdit"){ const kind=b.dataset.kind, r=DB[kind]&&DB[kind].get(nav.id); if(!r||!kdDarf(r)) return; ktDialog(kind,r,b.dataset.k?kontakteVon(r).find(x=>x.id===b.dataset.k):null); }
  else if(a==="ktRolleWahl"){ const i=document.getElementById("f_ktRolle"); if(i){ i.value=b.dataset.v; i.dispatchEvent(new Event("input",{bubbles:true})); i.parentElement.classList.add("fl"); } }
  else if(a==="ktSave") ktSpeichern(false);
  else if(a==="ktDel") ktSpeichern(true);
  else if(a==="karteZentr"){ if(KARTE.map&&KARTE.mk) KARTE.map.easeTo({center:KARTE.mk.getLngLat(),zoom:15.2,duration:500}); }
  else if(a==="karteOrt"){ karteWahl[b.dataset.r]=b.dataset.id; render(); }
},true);
