/* Gerätebilder bleiben unverändert. Die Platzierung speichert Maße, Asset-ID und ein
   eingebettetes Bild: auch Druck, Projektexport und Offlinebetrieb brauchen keinen Server. */
const GK_INDEX=/*KATALOG_INDEX*/[];
const GK_PROFILE=/*KATALOG_PROFILE*/{};
const GK_ROOT=/*KATALOG_ROOT*/"";
const GK_MAP=new Map(GK_INDEX.map(a=>[a.id,a]));
let GK=null, GK_BLOCK=null;
const gkClone=v=>JSON.parse(JSON.stringify(v));
const gkZahl=n=>Number(n.toFixed(2)).toLocaleString("de-DE");
const gkURL=a=>{ const u=new URL(GK_ROOT+a.file,location.href).href; return typeof bspSrc==="function"?bspSrc(u):u; };
const gkSuch=v=>String(v||"").toLocaleLowerCase("de").normalize("NFD").replace(/[\u0300-\u036f]/g,"");
function gkFilter(items,q,manufacturer,category){ const words=gkSuch(q).split(/\s+/).filter(Boolean);return items.filter(a=>(!manufacturer||a.manufacturer===manufacturer)&&(!category||a.category===category)&&words.every(w=>gkSuch([a.manufacturer,a.model,a.article,a.series,a.category,...Object.values(a.params)].join(" ")).includes(w))); }
function gkOpen(target){ if(!legAkt()||legAkt().fertig)return; GK={target:target||null,q:"",manufacturer:"",category:"",limit:48,busy:false}; gkDialog(); }
function gkDialog(){
 const options=(key,label)=>`<label class="gk-field">${label}<select id="gk-${key}"><option value="">Alle</option>${[...new Set(GK_INDEX.map(a=>a[key]))].sort((a,b)=>a.localeCompare(b,"de")).map(v=>`<option value="${esc(v)}"${GK[key]===v?" selected":""}>${esc(v)}</option>`).join("")}</select></label>`;
 dialog("Gerätekatalog",`<div class="gk-filter"><label class="gk-field">Suche<input id="gk-q" type="search" placeholder="Hersteller, Gerät oder Artikelnummer" value="${esc(GK.q)}"></label>${options("manufacturer","Hersteller")}${options("category","Kategorie")}</div>${typeof BSP!=="undefined"&&BSP.liste&&!gkImSp()?`<p class="meta gk-fehlt">Die Gerätebilder liegen noch nicht im SharePoint. Der Entwickler lädt sie einmal hoch: Einstellungen › Labor › „Gerätekatalog-Bilder hochladen“.</p>`:""}<div id="gk-grid"></div>`,
 `<button class="btn-text" data-act="gkBlockNeu">Klemmblock planen</button><span style="flex:1"></span><button class="btn-tonal" data-act="awZu">Fertig</button>`,{breit:true});gkGrid();
}
function gkGrid(){ const el=document.getElementById("gk-grid");if(!el||!GK)return;
 const list=gkFilter(GK_INDEX,GK.q,GK.manufacturer,GK.category),shown=list.slice(0,GK.limit);
 el.innerHTML=`<p class="meta" role="status">${list.length} Varianten · ${shown.length} angezeigt</p><div class="aw-grid">${shown.map(a=>`<button type="button" class="aw-g" data-act="gkWahl" data-v="${a.id}"${GK.busy?" disabled":""}><span class="mat-foto aw-gb"><img loading="lazy" src="${esc(gkURL(a))}" alt="${esc(a.manufacturer+" "+a.model)}"></span><b>${esc(a.manufacturer)} · ${esc(a.model)}</b><small>${esc([a.article,...Object.values(a.params).slice(0,4)].filter(Boolean).join(" · "))}</small><small>${gkZahl(a.dimension.width)} × ${gkZahl(a.dimension.height)} mm${a.isExampleAssembly?" · Beispielaufbau":""}</small></button>`).join("")}</div>${list.length>shown.length?'<button class="btn-tonal" data-act="gkMehr">Weitere anzeigen</button>':""}${list.length?"":'<p class="meta">Keine Geräte gefunden.</p>'}`;
}
async function gkData(a){ const r=await fetch(gkURL(a));if(!r.ok)throw Error("Gerätebild konnte nicht geladen werden. Bitte online erneut versuchen.");const bytes=await r.arrayBuffer(),hash=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes)),n=>n.toString(16).padStart(2,"0")).join("");if(hash!==a.sha256)throw Error("Gerätebild ist unvollständig. Bitte erneut laden.");return new Promise((resolve,reject)=>{const reader=new FileReader;reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error("Bild konnte nicht gelesen werden."));reader.readAsDataURL(new Blob([bytes],{type:a.format==="SVG"?"image/svg+xml":"image/png"}));}); }
function gkPayload(a,data){ const d=a.dimension;if(!Number.isFinite(d.width)||d.width<=0||!Number.isFinite(d.height)||d.height<=0)throw Error("Gerätemaße fehlen.");return {schemaVersion:1,assetId:a.id,manufacturer:a.manufacturer,model:a.model,article:a.article,widthMm:d.width,heightMm:d.height,frontCenterMm:Number.isFinite(d.faceCenterFromTop)?d.faceCenterFromTop:d.height/2,data}; }
function gkTechnik(a){const p=a.params||{},rcd=a.type==="QD",sk=["QF","QFD"].includes(a.type),art=rcd?"rcd":sk?"sk":"ge",pole=sk&&/^(3|4)/.test(String(p.poles))?3:1;
 return {art,pole,schutz:rcd?[[p.amperage&&p.amperage+" A",p.residualCurrent&&p.residualCurrent+" mA"].filter(Boolean).join(" / "),p.RCDtype&&"Typ "+p.RCDtype].filter(Boolean).join(" "):sk?`${p.curve||""}${p.amperage||""}${a.type==="QFD"?" FI/LS":""}`:""};}
function gkPitch(L){return [17.5,18].includes(+L?.teMm)?+L.teMm:legGerTe(L||{});}
function gkTE(e,L){return e.katalog.widthMm/gkPitch(L||legAkt()||{});}
function gkExtents(row,L,H){const scale=LEG_P/gkPitch(L),a=row.g.map(([e])=>{ if(e.katalog) return e.katalog; const k=gkFuerEintrag(e); return k?{frontCenterMm:Number.isFinite(k.dimension.faceCenterFromTop)?k.dimension.faceCenterFromTop:k.dimension.height/2,heightMm:k.dimension.height}:null; }).filter(Boolean);return {top:Math.min(0,...a.map(a=>H/2-a.frontCenterMm*scale)),bottom:Math.max(H,...a.map(a=>H/2+(a.heightMm-a.frontCenterMm)*scale))};}
function gkEintrag(a,payload,L){const tech=gkTechnik(a);return {id:uid(),...tech,kz:tech.art==="ge"?"":awKz(L,tech.art).kz,bez:[a.manufacturer,a.model].join(" "),te:payload.widthMm/gkPitch(L),katalog:payload};}
async function gkWahl(id){if(!GK||GK.busy)return;const state=GK,a=GK_MAP.get(id),L=legAkt();if(!a||!L||L.fertig)return;state.busy=true;gkGrid();
 try{const data=await gkData(a);if(GK!==state||!document.getElementById("gk-grid")||legAkt()?.id!==L.id)return;const payload=gkPayload(a,data);if(payload.widthMm> (+L.teReihe||12)*gkPitch(L)+.01)throw Error("Dieses Gerät ist breiter als die eingestellte Reihe. Bitte zuerst die Verteilerbreite ändern.");
 if(state.target){const old=legE(L).find(e=>e.id===state.target);if(!old)throw Error("Gerät ist nicht mehr vorhanden.");const tech=gkTechnik(a);if(old.art!==tech.art||(old.art==="sk"&&(+old.pole||1)!==tech.pole))throw Error("Bitte ein Gerät derselben Art und Polzahl wählen. Andere Geräte als neuen Eintrag einsetzen.");Object.assign(old,{katalog:payload,te:payload.widthMm/gkPitch(L)});if(tech.art!=="ge")Object.assign(old,{schutz:tech.schutz,pole:tech.pole});delete old.mat;delete old.klemmenProjekt;legSpeichern(L);render();}
 else awEinsetzen(gkEintrag(a,payload,L));toast(a.manufacturer+" "+a.model+" eingesetzt");if(state.target){awZu();GK=null;}else {state.busy=false;gkDialog();}
 }catch(err){toast(err.message);state.busy=false;gkGrid();}}
/* Exakt derselbe Maßstab wie die Reihe: Breite wird niemals auf eine volle TE gerundet.
   Der 45-mm-Frontbezug liegt in derselben Höhe wie der bisherige Editor. */
function gkBild(e,x,y0,P){const a=e.katalog,L=legAkt(),scale=P/gkPitch(L),mid=y0+P*400/92/2;
 return `<image href="${esc(a.data)}" x="${x}" y="${mid-a.frontCenterMm*scale}" width="${a.widthMm*scale}" height="${a.heightMm*scale}" preserveAspectRatio="xMidYMid meet"/>`; }
/* ===== Katalogbilder für Artikel aus der Materialliste (Max 28.11.2026) =====
   Ein Artikel bekommt ein Katalogbild NUR, wenn Modell und Aufdruck genau stimmen – keine ähnlichen Fremdmodelle.
   1. Katalogeintrag, dessen Artikel oder Modell genau die Artikelnummer ist (CDA440D, HIM402, ST303 … und alles, was nachgereicht wird)
   2. Serienbild, dessen Aufdruck genau dieser Artikel ist (das MBS-Bild zeigt „MBS116A B16“ → nur MBS116, nicht MBS110)
   Alles andere zeigt weiter das bisherige Bild. */
const gkNorm=s=>String(s||"").toUpperCase().replace(/[\s.\-\/]/g,"");
const GK_MAT_SERIE={MBS116:["Hager","MBS",17.5],MBS316:["Hager","MBS",52.5],MCS116:["Hager","MCS",17.5],MCS316:["Hager","MCS",52.5],
  MBN116:["Hager","MBN",17.5],MBN316:["Hager","MBN",52.5],MCN116:["Hager","MCN",17.5],MCN316:["Hager","MCN",52.5],
  A9F04116:["Schneider Electric","iC60N",18],A9F04316:["Schneider Electric","iC60N",54],
  SBN116:["Hager","SBN",17.5],ESC425:["Hager","ESC",35],ESC440:["Hager","ESC",52.5],EPN510:["Hager","EPN",17.5]};
const GK_KL={n:"N 14-S · Schraube unten",pe:"PE 14-S · Schraube unten",a:"A 14-S · Schraube unten"};
let GK_NR=null;
function gkNrIndex(){ if(GK_NR) return GK_NR; GK_NR=new Map();
  GK_INDEX.forEach(a=>{ if(a.isExampleAssembly) return; [a.article,a.model].forEach(v=>{ const k=gkNorm(v); if(k.length>=5&&/\d/.test(k)&&!GK_NR.has(k)) GK_NR.set(k,a); }); }); return GK_NR; }
const GK_MAT_C=new Map();
/* Artikel, deren Katalog-SVG eine passende Vorlage ist: Aufdruck wird beim Anzeigen gesetzt (Max 28.11.2026).
   a = [Hersteller, Modell, Breite mm] · setzen/weg = Umschalter der Vorlage (CSS-Variablen am <svg>) · ersetzen = Text im Aufdruck.
   Die Datei im SharePoint bleibt unverändert. Nur Fälle, bei denen nach der Anpassung Modell UND Aufdruck stimmen. */
const GK_MAT_ANP={};
{   GK_MAT_ANP.CDS440D={a:["Hager","CDS",70],setzen:["A_40"],weg:["A_25"],ersetzen:[["25 A/IΔn","40 A/IΔn"],["440J","440D"]]};
  GK_MAT_ANP.CDS463D={a:["Hager","CDS",70],setzen:["A_63"],weg:["A_25"],ersetzen:[["25 A/IΔn","63 A/IΔn"],["463J","463D"]]};
  GK_MAT_ANP.SBN240={a:["Hager","SBN",35],setzen:["amp40","m2_2P_40"],weg:["amp16","m2_2P_16"],ersetzen:[["16A","40A"]]};
  GK_MAT_ANP.SBN440={a:["Hager","SBN",70],setzen:["amp40","m4_4P_40"],weg:["amp32","m4_4P_32"],ersetzen:[["32A","40A"]]}; }
const gkAnpKey=(a,anp)=>a.id+"|"+JSON.stringify([anp.vorlage||"",anp.setzen||[],anp.weg||[],anp.ersetzen||[]]);
/* ===== Vorlagen aus PNG-Bildern (Max 28.11.2026) =====
   Hager MBS/MBN/MCS/MCN gibt es nur als PNG mit fest gemaltem Aufdruck („MBS116A B16“) – die Original-SVGs hatten fehlende Bauteile.
   Die App baut daraus selbst eine Vorlage: PNG als Grundbild, Aufdruck mit einer Fläche in Gehäusefarbe abgedeckt, darüber echter Text.
   Platzhalter: {SER} Serie, {IN} Nennstrom, {IN2} Nennstrom zweistellig, {CHAR} Charakteristik, {IDN} Fehlerstrom.
   Maße in Bildpixeln; die Bilder selbst bleiben im SharePoint, hier stehen nur Positionen. */
const GK_VORLAGE={}; ["MBS","MBN","MCS","MCN"].forEach(ser=>[1,3].forEach(p=>{ GK_VORLAGE[`Hager|${ser}|${p*17.5}`]={
  deck:[11,273,141,59], farbe:p===1&&/N$/.test(ser)?"#F1F1F1":"#EEEEEE", schrift:"#6F8090",
  zeilen:[[13,299,28,`{SER}${p}{IN2}A`],[13,325,28,"{CHAR}{IN}"]] }; }));
const gkVorlageKey=a=>`${a.manufacturer}|${a.model}|${a.dimension.width}`;
const gkVorlageAsset=(h,m,w)=>{ const k=`${h}|${m}|${w}`; return GK_VORLAGE[k]?GK_INDEX.find(a=>gkVorlageKey(a)===k)||null:null; };
/* Serien mit Text-Aufdruck in der SVG (Schneider): Bild je Polzahl, Kennlinie/Nennstrom/Artikelnummer als Text ersetzen */
function gkSerieFuer(h,ser,pol,ch,inn){ ch=String(ch||"").toUpperCase(); if(!ch||!inn) return null; const pad=String(inn).padStart(2,"0");
  if(h==="Hager") return gkVorlageFuer(h,ser,pol,ch,inn);
  if(h==="Schneider Electric"&&ser==="Resi9"){   /* Grundbild B16 aus dem Nachtrag (1P bzw. 3P), Aufdruck wird umgeschrieben */
    const a=GK_INDEX.find(x=>x.manufacturer===h&&x.article===`R9F23${pol}16`); if(!a) return null;
    return {...a,_anp:{ersetzen:[[`R9F23${pol}16`,`R9F2${ch==="B"?3:4}${pol}${pad}`],["B16",`${ch}${inn}`]]}}; }
  if(h==="Schneider Electric"&&ser==="iC60N"){ const a=GK_INDEX.find(x=>x.manufacturer===h&&x.model==="iC60N"&&x.dimension.width===18*pol&&/\.svg$/i.test(x.file)); if(!a) return null;
    return {...a,_anp:{ersetzen:[["C 16A",`${ch} ${inn}A`],["C16",`${ch}${inn}`]]}}; }
  return null; }
/* Vorlage für einen Hager-Automaten nach Serie, Polzahl, Charakteristik und Nennstrom */
function gkVorlageFuer(h,ser,pol,ch,inn){ const a=gkVorlageAsset(h,ser,+pol*17.5); if(!a||!ch||!inn) return null;
  return {...a,_anp:{vorlage:gkVorlageKey(a),ersetzen:[["{SER}",ser],["{IN2}",String(inn).padStart(2,"0")],["{IN}",String(inn)],["{CHAR}",String(ch).toUpperCase()]]}}; }
function gkMatAsset(hnr){ const k=gkNorm(hnr); if(!k) return null; if(GK_MAT_C.has(k)) return GK_MAT_C.get(k);
  let a=null; const s=GK_MAT_SERIE[k], anp=GK_MAT_ANP[k];
  if(s) a=GK_INDEX.find(a=>a.manufacturer===s[0]&&a.model===s[1]&&Math.abs(a.dimension.width-s[2])<.3)||null;
  else if(gkNrIndex().get(k)) a=gkNrIndex().get(k);
  else if(anp){ const b=GK_INDEX.find(x=>x.manufacturer===anp.a[0]&&x.model===anp.a[1]&&Math.abs(x.dimension.width-anp.a[2])<.3&&/\.svg$/i.test(x.file)); if(b) a={...b,_anp:anp}; }
  else { const m=k.match(/^(M[BC][SN])([1-4])(\d\d)$/); if(m) a=gkVorlageFuer("Hager",m[1],+m[2],m[1][1],+m[3]); }   /* Hager-Automat ohne eigenes Bild → Vorlage */
  if(!a){ const r=k.match(/^R9F2([34])([1-4])(\d\d)$/), c=k.match(/^A9F0([34])([1-4])(\d\d)$/);   /* Schneider Resi9 bzw. iC60N: Kennlinie 3 = B, 4 = C */
    if(r) a=gkSerieFuer("Schneider Electric","Resi9",+r[2],r[1]==="3"?"B":"C",+r[3]); else if(c) a=gkSerieFuer("Schneider Electric","iC60N",+c[2],c[1]==="3"?"B":"C",+c[3]); }
  GK_MAT_C.set(k,a); return a; }
const gkKlFarbe=e=>e.farbe||(/pe/i.test(e.bez||"")?"pe":/^\s*a\b|abzweig/i.test(e.bez||"")?"a":"n");
function gkFuerEintrag(e){ if(!e||e.katalog) return null;
  if(e.art==="kl") return GK_INDEX.find(a=>a.manufacturer==="Pollmann"&&a.model===GK_KL[gkKlFarbe(e)])||null;
  if(e.mat) return gkMatAsset(e.mat);
  if(e.serie&&e.art==="sk"){ const m=String(e.schutz||"").match(/^\s*([A-Z])\s*(\d+)/i); if(m) return gkSerieFuer(e.serie.h,e.serie.m,+e.pole===3?3:1,m[1],+m[2]); }
  return null; }
/* Katalogbild eines zugeordneten Artikels zeichnen: Maßstab wie die Reihe, mittig im Platz (Breite aus der Legende bleibt) */
function gkBildAsset(a,x,w,y0,P){ const L=legAkt(),scale=P/gkPitch(L),mid=y0+P*400/92/2,d=a.dimension,fc=Number.isFinite(d.faceCenterFromTop)?d.faceCenterFromTop:d.height/2,bw=d.width*scale;
  return `<image href="${esc(gkBildURL(a))}"${gkAnpAttr(a)} x="${(x+(w*P-bw)/2).toFixed(1)}" y="${(mid-fc*scale).toFixed(1)}" width="${bw.toFixed(1)}" height="${(d.height*scale).toFixed(1)}" preserveAspectRatio="xMidYMid meet"/>`; }
const gkTeText=(mm,L)=>{ const t=mm/gkPitch(L||legAkt()||{}); return (Math.abs(t-Math.round(t))<.05?String(Math.round(t)):t.toFixed(1).replace(".",","))+" TE"; };
/* Katalog im Bestücken-Fenster: Gruppen aus dem Teil vor „ - “ der Kategorie */
const GK_DE=[["Ueberspannung","Überspannung"],["Schuetze","Schütze"],["Stromstoss","Stromstoß"],["Geraete","Geräte"],["Zubehoer","Zubehör"],["Gebaeude","Gebäude"],["Binaereingaenge","Binäreingänge"],["zaehler","zähler"],["stuecke","stücke"]];
const gkDe=t=>GK_DE.reduce((s,[a,b])=>s.split(a).join(b),String(t||""));   /* Kategorienamen im Index ohne Umlaute → richtig anzeigen */
const gkGruppe=a=>gkDe(String(a.category||"").split(" - ")[0]);
const GK_GRUPPEN=(()=>{ const z=new Map(); GK_INDEX.forEach(a=>{ if(!a.isExampleAssembly) z.set(gkGruppe(a),(z.get(gkGruppe(a))||0)+1); }); return [...z.entries()].sort((a,b)=>b[1]-a[1]).map(x=>x[0]); })();
const GK_HERST=(()=>{ const z=new Map(); GK_INDEX.forEach(a=>{ if(!a.isExampleAssembly) z.set(a.manufacturer,(z.get(a.manufacturer)||0)+1); }); const vorn=["Hager","Schneider Electric"];
  return [...vorn.filter(h=>z.has(h)),...[...z.entries()].filter(([h])=>!vorn.includes(h)).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],"de")).map(x=>x[0])]; })();
function gkAwListe(q,herst,gruppe){ return gkFilter(GK_INDEX.filter(a=>!a.isExampleAssembly&&(!gruppe||gkGruppe(a)===gruppe)),q,herst,""); }
/* Katalog-Gerät n-mal einsetzen (Bestücken-Fenster): Bild einmal holen, Kennzeichnung läuft weiter */
async function gkAwEinsetzen(id,n){ const a=GK_MAP.get(id),L=legAkt(); if(!a||!L||L.fertig) return 0;
  const data=await gkData(a); if(legAkt()?.id!==L.id) return 0; const payload=gkPayload(a,data);
  if(payload.widthMm>(+L.teReihe||12)*gkPitch(L)+.01) throw Error("Dieses Gerät ist breiter als die eingestellte Reihe. Bitte zuerst die Verteilerbreite ändern.");
  for(let i=0;i<n;i++) awEinsetzen(gkEintrag(a,gkClone(payload),L)); return n; }
/* ===== Beschriftungen der Katalog-SVGs (Max 28.11.2026) =====
   Fast alle Aufdrucke in den SVGs sind Text, oft mit eingebauten Umschaltern (CSS-Variablen am <svg>, z. B. CDS: --A_25 … --A_125,
   SBN: --amp16 … --amp125, auch verschachtelt). Die Analyse liest jede SVG einmal: gesetzte Umschalter, sichtbare Texte und welche
   Umschalter welchen Aufdruck-Teil zeigen. Ergebnis liegt privat im SharePoint neben den Bildern („katalog~beschriftung.json“),
   nicht im öffentlichen Projekt. gkSvgAnpassen setzt Umschalter und Text – Grundlage für die spätere Beschriftungs-Oberfläche. */
const GK_BS_NAME="katalog~beschriftung.json", GK_BS_PFAD="/bilder/katalog/beschriftung.json";
const GK_BS={daten:null,laeuft:false,fertig:0,gesamt:0,fehler:0,stop:false};
const gkDispVars=st=>{ const m=String(st||"").match(/display\s*:\s*(var\([^;]*)/); return m?(m[1].match(/--[\w-]+/g)||[]).map(x=>x.slice(2)):null; };
function gkSvgAnalyse(text){ const d=new DOMParser().parseFromString(text,"image/svg+xml"), r=d.documentElement; if(!r||r.nodeName!=="svg"||d.querySelector("parsererror")) return null;
  const an={}; String(r.getAttribute("style")||"").replace(/--([\w-]+)\s*:\s*([^;]+)/g,(m,k,v)=>{ an[k]=v.trim(); return m; });
  const sichtbar=el=>{ for(let n=el;n&&n.nodeType===1&&n!==r;n=n.parentNode){ const st=n.getAttribute("style")||""; if(/display\s*:\s*none/.test(st)) return false; const V=gkDispVars(st); if(V&&!V.some(v=>an[v]==="block")) return false; } return true; };
  const eigen=n=>[...n.childNodes].filter(c=>c.nodeType===3).map(c=>c.textContent).join("").trim();
  const t=[], sw={};
  d.querySelectorAll("text").forEach(tx=>{ if(!sichtbar(tx)) return; const z=[]; const lauf=n=>n.childNodes.forEach(c=>{ if(c.nodeType===3) z.push(c.textContent); else if(c.nodeType===1&&sichtbar(c)) lauf(c); }); lauf(tx);
    const s=z.join("").replace(/\s+/g," ").trim(); if(s) t.push(s.slice(0,200));
    tx.querySelectorAll("tspan").forEach(sp=>{ const V=gkDispVars(sp.getAttribute("style")); if(V&&V.length===1){ const e=eigen(sp); if(e) sw[V[0]]=e; } }); });
  return {an:Object.keys(an).filter(k=>an[k]==="block"),t:t.slice(0,40),sw}; }
/* Umschalter setzen/entfernen und Text im Aufdruck ersetzen – gibt neuen SVG-Text zurück */
function gkSvgAnpassen(text,anp){ anp=anp||{}; const d=new DOMParser().parseFromString(text,"image/svg+xml"), r=d.documentElement; if(!r||d.querySelector("parsererror")) return text;
  let st=String(r.getAttribute("style")||""); (anp.weg||[]).forEach(v=>{ st=st.replace(new RegExp("\\s*--"+v.replace(/[-]/g,"\\-")+"\\s*:[^;]*;?","g"),""); });
  (anp.setzen||[]).forEach(v=>{ if(!new RegExp("--"+v+"\\s*:").test(st)) st=(st.trim()&&!/;\s*$/.test(st)?st+";":st)+" --"+v+":block;"; }); r.setAttribute("style",st.trim());
  if((anp.ersetzen||[]).length){ const w=d.createTreeWalker(r,4); let n; while((n=w.nextNode())){ if(!n.parentNode||!n.parentNode.closest||!n.parentNode.closest("text")) continue; let x=n.textContent; anp.ersetzen.forEach(([a,b])=>{ x=x.split(a).join(b); }); if(x!==n.textContent) n.textContent=x; } }
  return new XMLSerializer().serializeToString(d); }
/* SVG-Text eines Katalogbilds holen (über den Service Worker, sonst direkt aus dem SharePoint) */
async function gkSvgText(a){ try{ const r=await fetch(gkURL(a)); if(r.ok){ const t=await r.text(); if(/^\s*(<\?xml|<svg|<!--)/i.test(t)) return t; } }catch(e){}
  const b=typeof bspBlob==="function"?(await bspBlob(bspPfad(gkSpName(a)),false)||await bspBlob(bspPfad(gkSpName(a)),true)):null; if(!b) throw Error("Bild nicht erreichbar"); return await (await fetch(b)).text(); }
/* Angepasste Bilder: einmal je Sitzung erzeugen, als Blob-Adresse merken; bis dahin ein leerer Platzhalter (kein falscher Aufdruck) */
const GK_ANP_URL=new Map(), GK_ANP_P=new Map(), GK_LEER="data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%2F%3E";
const gkAnpAttr=a=>a&&a._anp?` data-gkanp="${esc(gkAnpKey(a,a._anp))}"`:"";
function gkAufdruck(a,anp){ const key=gkAnpKey(a,anp); if(GK_ANP_P.has(key)) return GK_ANP_P.get(key);
  const pf0=gkAnpPfad(key);
  const p=(async()=>{ try{ const c=await caches.open("irrgang-bilder"), r=await c.match(pf0); if(r&&r.ok){ const t=await r.text(); if(/^\s*<svg/i.test(t)) return {fertig:t}; } }catch(e){} return anp.vorlage?gkVorlageText(a,anp.vorlage):gkSvgText(a); })().then(async t=>{ const fertig=t&&t.fertig, sv=fertig?t.fertig:gkSvgAnpassen(t,anp), pf=pf0;
      if(fertig){ GK_ANP_OK.add(pf); const u=navigator.serviceWorker&&navigator.serviceWorker.controller?pf:URL.createObjectURL(new Blob([sv],{type:"image/svg+xml"})); GK_ANP_URL.set(key,u);
        document.querySelectorAll("[data-gkanp]").forEach(el=>{ if(el.getAttribute("data-gkanp")===key) el.setAttribute(el.tagName==="IMG"?"src":"href",u); });
        if(document.querySelector(`img[src="${GK_LEER}"]`)&&typeof render==="function"&&!document.querySelector("#dlg:not([hidden])")) setTimeout(render,0); return u; }
      let u=null; try{ const c=await caches.open("irrgang-bilder"); await c.put(pf,new Response(sv,{headers:{"Content-Type":"image/svg+xml"}})); GK_ANP_OK.add(pf); if(navigator.serviceWorker&&navigator.serviceWorker.controller) u=pf; }catch(e){}
      if(!u) u=URL.createObjectURL(new Blob([sv],{type:"image/svg+xml"})); GK_ANP_URL.set(key,u);
      document.querySelectorAll("[data-gkanp]").forEach(el=>{ if(el.getAttribute("data-gkanp")!==key) return; el.setAttribute(el.tagName==="IMG"?"src":"href",u); const w=el.closest&&el.closest(".weg"); if(w) w.classList.remove("weg"); });
      if(document.querySelector(`img[src="${GK_LEER}"]`)&&typeof render==="function"&&!document.querySelector("#dlg:not([hidden])")) setTimeout(render,0);
      return u; })
    .catch(e=>{ GK_ANP_P.delete(key); console.warn("Aufdruck",a.id,e); return null; });
  GK_ANP_P.set(key,p); return p; }
/* Fertige Aufdrucke liegen im Bild-Speicher des Geräts („irrgang-bilder“) unter /bilder/katalog/anp/… – der Service Worker liefert sie
   wie jedes Bild aus: beim nächsten Öffnen sofort da, feste Adresse, kein Flackern. */
const gkAnpPfad=key=>{ let h=5381; for(let i=0;i<key.length;i++) h=((h<<5)+h+key.charCodeAt(i))|0; return "/bilder/katalog/anp/"+(h>>>0).toString(36)+".svg"; };
const GK_ANP_OK=new Set();
const gkAnpBereit=(async()=>{ try{ if(typeof caches==="undefined") return; const c=await caches.open("irrgang-bilder"); (await c.keys()).forEach(r=>{ const p=new URL(r.url).pathname; if(p.startsWith("/bilder/katalog/anp/")) GK_ANP_OK.add(p); });
  try{ Object.keys(localStorage).filter(k=>k.startsWith("irrgang_gkanp_")).forEach(k=>localStorage.removeItem(k)); }catch(e){}   /* alter Zwischenspeicher (1.11.10) */
  if(GK_ANP_OK.size&&document.querySelector("[data-gkanp]")&&typeof render==="function") render(); }catch(e){} })();
function gkBildURL(a){ if(!a) return ""; if(!a._anp) return gkURL(a); const key=gkAnpKey(a,a._anp); let u=GK_ANP_URL.get(key); if(u) return u;
  const pf=gkAnpPfad(key); if(GK_ANP_OK.has(pf)&&navigator.serviceWorker&&navigator.serviceWorker.controller){ GK_ANP_URL.set(key,pf); return pf; }
  gkAufdruck(a,a._anp); return GK_LEER; }
/* Vorlage als SVG-Text: PNG einbetten, Aufdruck abdecken, Platzhalter-Text darüber */
async function gkVorlageText(a,vk){ const V=GK_VORLAGE[vk]; if(!V) throw Error("Keine Vorlage");
  let b=null; try{ const r=await fetch(gkURL(a)); if(r.ok) b=await r.blob(); }catch(e){}
  if(!b||!b.size||!/^image\//.test(b.type)&&b.type!==""){ b=null; const u=typeof bspBlob==="function"?(await bspBlob(bspPfad(gkSpName(a)),false)||await bspBlob(bspPfad(gkSpName(a)),true)):null; if(!u) throw Error("Bild nicht erreichbar"); b=await (await fetch(u)).blob(); }
  const data=await new Promise((ok,nein)=>{ const fr=new FileReader(); fr.onload=()=>ok(fr.result); fr.onerror=nein; fr.readAsDataURL(b.type==="image/png"?b:b.slice(0,b.size,"image/png")); });
  const bm=await createImageBitmap(b), W=bm.width, H=bm.height; bm.close&&bm.close(); const [dx,dy,dw,dh]=V.deck;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${a.dimension.width}mm" height="${a.dimension.height}mm" viewBox="0 0 ${W} ${H}"><image href="${data}" width="${W}" height="${H}"/><rect x="${dx}" y="${dy}" width="${dw}" height="${dh}" fill="${V.farbe}"/>`
    +V.zeilen.map(([x,y,fs,t])=>`<text x="${x}" y="${y}" font-family="Arial, Helvetica, sans-serif" font-size="${fs}" fill="${V.schrift}">${t}</text>`).join("")+`</svg>`; }
/* Analyse laden (aus dem Bilder-Cache, sonst aus dem SharePoint) */
async function gkBsLaden(neu){ if(GK_BS.daten&&!neu) return GK_BS.daten;
  try{ const c="caches" in window?await caches.open("irrgang-bilder").catch(()=>null):null; let r=!neu&&c?await c.match(GK_BS_PFAD).catch(()=>null):null;
    if(!r){ const L=await bspListe(!!neu); const u=L&&L[GK_BS_PFAD]; if(!u) return null; r=await fetch(u,{cache:"no-store"}); if(!r.ok) return null; if(c) c.put(GK_BS_PFAD,r.clone()).catch(()=>{}); }
    GK_BS.daten=await r.json(); }catch(e){ console.warn("Beschriftungen",e); }
  return GK_BS.daten; }
const gkBeschriftung=id=>GK_BS.daten&&GK_BS.daten.assets?GK_BS.daten.assets[id]||null:null;
/* Alle SVGs einlesen und das Ergebnis in den SharePoint schreiben (Entwickler, Labor) */
async function gkBsErstellen(){ if(GK_BS.laeuft) return; if(typeof SYNC_ON==="undefined"||!SYNC_ON||!ME.signedIn){ toast("Erst mit dem Firmenkonto anmelden"); return; }
  const A=GK_INDEX.filter(a=>/\.svg$/i.test(a.file)), out={};
  Object.assign(GK_BS,{laeuft:true,stop:false,fertig:0,gesamt:A.length,fehler:0}); if(typeof gkFortZeigen==="function") gkFortZeigen();
  const Q=A.slice(); const lauf=async()=>{ while(Q.length&&!GK_BS.stop){ const a=Q.shift(); try{ const x=gkSvgAnalyse(await gkSvgText(a)); if(x) out[a.id]=x; else GK_BS.fehler++; }catch(e){ GK_BS.fehler++; } GK_BS.fertig++; if(GK_BS.fertig%25===0&&typeof gkFortZeigen==="function") gkFortZeigen(); } };
  try{ await bspListe(); await Promise.all(Array.from({length:6},lauf));
    if(!GK_BS.stop){ const daten={version:1,erstellt:new Date().toISOString(),index:GK_INDEX.length,svg:A.length,assets:out};
      await syncRoot(); const fid=await folderId(BSP_ORDNER,BSP_BIB);
      const r=await g(`/drives/${fid}:/${encodeURIComponent(GK_BS_NAME)}:/content`,{method:"PUT",headers:{"Content-Type":"application/json"},body:new Blob([JSON.stringify(daten)],{type:"application/json"})});
      if(!r.ok) throw Error("SharePoint meldet "+r.status);
      GK_BS.daten=daten; try{ const c=await caches.open("irrgang-bilder"); await c.put(GK_BS_PFAD,new Response(JSON.stringify(daten),{headers:{"Content-Type":"application/json"}})); }catch(e){}
      await bspListe(true); toast(`Beschriftungen von ${gkTsd(Object.keys(out).length)} SVGs gespeichert${GK_BS.fehler?` · ${GK_BS.fehler} nicht lesbar`:""}`); } }
  catch(e){ toast("Beschriftungen: "+(e.message||e)); }
  finally{ GK_BS.laeuft=false; if(nav.v==="gkbilder") render(); } }
function gkBsHtml(){ const D=GK_BS.daten, S=GK_BS, n=D?Object.keys(D.assets||{}).length:0;
  if(S.laeuft) return `<div class="gk-bar gross"><i style="width:${(S.gesamt?S.fertig/S.gesamt*100:0).toFixed(1)}%"></i></div><p class="meta" style="margin:10px 2px 0">${gkTsd(S.fertig)} von ${gkTsd(S.gesamt)} SVGs gelesen${S.fehler?` · ${S.fehler} nicht lesbar`:""}</p><div class="gk-knopf"><button type="button" class="btn-tonal" data-act="gkBsStop">Anhalten</button></div>`;
  let z=""; if(D){ const E=Object.values(D.assets||{}); const mitT=E.filter(e=>e.t.length).length, mitS=E.filter(e=>Object.keys(e.sw).length).length; z=`<p class="meta" style="margin:0 2px">${gkTsd(n)} SVGs ausgewertet · ${gkTsd(mitT)} mit Aufdruck · ${gkTsd(mitS)} mit Umschaltern für den Aufdruck · Stand ${esc(new Date(D.erstellt).toLocaleString("de-DE",{dateStyle:"short",timeStyle:"short"}))}</p>`; }
  return `${z||`<p class="meta" style="margin:0 2px">Noch nicht ausgewertet.</p>`}<div class="gk-knopf"><button type="button" class="btn-tonal" data-act="gkBsNeu">${D?"Neu einlesen":"Jetzt einlesen"}</button></div>`; }
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act="gkBsNeu"],[data-act="gkBsStop"]'); if(!b||b.disabled) return; e.preventDefault(); e.stopPropagation();
  if(typeof istEntwickler!=="function"||!istEntwickler()) return; if(b.dataset.act==="gkBsStop"){ GK_BS.stop=true; return; } gkBsErstellen(); render(); },true);
if(typeof setTimeout==="function") setTimeout(()=>{ if(typeof SYNC_ON!=="undefined"&&SYNC_ON&&typeof ME!=="undefined"&&ME.signedIn) gkBsLaden(); },6000);
function gkDetail(id){const L=legAkt(),e=L&&legE(L).find(x=>x.id===id);if(!e||!e.katalog)return;
 const a=e.katalog;dialog(a.manufacturer+" "+a.model,`<div class="gk-preview"><img src="${esc(a.data)}" alt="Gerätefront"></div><p>${esc(a.article||"Keine bestätigte Artikelnummer")} · ${gkZahl(a.widthMm)} × ${gkZahl(a.heightMm)} mm</p>`,
 `<button class="btn-text" data-act="gkBeschriftung" data-id="${e.id}">Beschriftung</button>${e.klemmenProjekt?`<button class="btn-text" data-act="gkBlockEdit" data-id="${e.id}">Klemmen und Brücken</button>`:`<button class="btn-text" data-act="gkErsetzen" data-id="${e.id}">Ersetzen</button>`}<span style="flex:1"></span><button class="btn-tonal" data-act="awZu">Schließen</button>`,{breit:true});}
function gkBlockNeu(id){const L=legAkt();if(!L||L.fertig)return;const entry=id&&legE(L).find(e=>e.id===id);GK_BLOCK={target:id||null,p:entry?gkClone(entry.klemmenProjekt):{schemaVersion:1,units:"mm",title:"Klemmblock",labelMode:"manual",showBridges:true,terminals:[gkTerminal()],bridges:[]},undo:[],redo:[],data:null};gkBlockDialog();}
function gkTerminal(){return {id:uid(),manufacturer:"WAGO",profile:"wago_2004_1201",netId:"",rcdGroup:"",label:{text:"",locked:false}};}
function gkBlockChange(fn){const s=GK_BLOCK,old=s.editBefore||gkClone(s.p);s.editBefore=null;try{fn(s.p);KlemmenEngine.validate(s.p,GK_PROFILE);s.undo.push(old);s.redo=[];gkBlockDialog();}catch(err){s.p=old;toast(err.message);gkBlockDialog();}}
function gkBlockDialog(){const s=GK_BLOCK;if(!s)return;const p=s.p,opts=p.terminals.map(t=>`<option value="${t.id}">${esc(t.label.text||t.id)}</option>`).join("");
 dialog("Klemmblock",`<p class="meta">WAGO 2004-1201 · 6,2 mm. Brücken 2004-402 zwischen direkt benachbarten Klemmen. Das Profil ist eine visuelle Planungsvorlage.</p><div id="gk-block-preview" class="gk-block-preview"></div><div class="gk-toolbar"><button class="btn-tonal" data-act="gkTAdd">Klemme hinzufügen</button><button class="btn-text" data-act="gkNum">Nummerieren</button><button class="btn-text" data-act="gkUndo"${s.undo.length?"":" disabled"}>Rückgängig</button><button class="btn-text" data-act="gkRedo"${s.redo.length?"":" disabled"}>Wiederholen</button></div><div class="gk-terminal-list">${p.terminals.map((t,i)=>`<div class="gk-terminal"><b>${i+1}</b><label class="gk-field">Beschriftung<input data-gk-t="${t.id}" data-gk-field="label" value="${esc(t.label.text)}"></label><label class="gk-field">Netz-ID<input data-gk-t="${t.id}" data-gk-field="netId" value="${esc(t.netId)}"></label><label class="gk-field">RCD-Gruppe<input data-gk-t="${t.id}" data-gk-field="rcdGroup" value="${esc(t.rcdGroup)}"></label><label><input type="checkbox" data-gk-t="${t.id}" data-gk-field="locked"${t.label.locked?" checked":""}> Fest</label><button class="btn-text" data-act="gkTCopy" data-id="${t.id}">Kopieren</button><button class="btn-text" data-act="gkTDel" data-id="${t.id}"${p.terminals.length===1?" disabled":""}>Entfernen</button></div>`).join("")}</div><h3>Brücken</h3><p class="meta">Netz-ID und RCD-Gruppe werden ausdrücklich an den Klemmen gesetzt. Eine Beschriftung verbindet keine Netze.</p><div class="gk-filter"><label class="gk-field">Von<select id="gk-von">${opts}</select></label><label class="gk-field">Nach<select id="gk-nach">${opts}</select></label><label class="gk-field">Schacht<select id="gk-slot"><option>A</option><option>B</option></select></label><button class="btn-tonal" data-act="gkBAdd">Brücke einsetzen</button></div>${p.bridges.map(b=>`<p>2004-402 · ${b.contacts.map(c=>esc(p.terminals.find(t=>t.id===c.terminalId)?.label.text||c.terminalId)+" / "+c.slotId).join(" ↔ ")} <button class="btn-text" data-act="gkBDel" data-id="${b.id}">Entfernen</button></p>`).join("")}`,
 `<button class="btn-text" data-act="gkBlockSvg">SVG exportieren</button><span style="flex:1"></span><button class="btn-text" data-act="awZu">Abbrechen</button><button class="btn-tonal" data-act="gkBlockSave">Übernehmen</button>`,{breit:true});gkBlockPreview();}
async function gkBlockPreview(){const state=GK_BLOCK;if(!state)return;try{if(!state.data)state.data=await gkData(GK_MAP.get(GK_PROFILE.wago_2004_1201.assetId));if(GK_BLOCK!==state)return;const el=document.getElementById("gk-block-preview");if(el)el.innerHTML=KlemmenEngine.render(state.p,GK_PROFILE,{[GK_PROFILE.wago_2004_1201.assetId]:state.data});}catch(err){toast(err.message);}}
function gkBlockSvg(){const s=GK_BLOCK;if(!s?.data)throw Error("Gerätebild wird noch geladen.");return KlemmenEngine.render(s.p,GK_PROFILE,{[GK_PROFILE.wago_2004_1201.assetId]:s.data});}
function gkDownload(text,name,type){const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
document.addEventListener("input",ev=>{const t=ev.target;if(t.id==="gk-q"&&GK){GK.q=t.value;GK.limit=48;gkGrid();}
 if(t.dataset.gkT&&GK_BLOCK&&t.type!=="checkbox"){const s=GK_BLOCK,a=s.p.terminals.find(a=>a.id===t.dataset.gkT);if(!a)return;s.editBefore=s.editBefore||gkClone(s.p);if(t.dataset.gkField==="label")a.label.text=t.value;else a[t.dataset.gkField]=t.value;gkBlockPreview();}});
document.addEventListener("change",ev=>{const t=ev.target;if(GK&&["gk-manufacturer","gk-category"].includes(t.id)){GK[t.id.slice(3)]=t.value;GK.limit=48;gkGrid();}
 if(t.dataset.gkT&&GK_BLOCK)gkBlockChange(p=>{const a=p.terminals.find(a=>a.id===t.dataset.gkT),k=t.dataset.gkField;if(k==="label")a.label.text=t.value;else if(k==="locked")a.label.locked=t.checked;else a[k]=t.value;});});
document.addEventListener("click",ev=>{const b=ev.target.closest?.('[data-act^="gk"],[data-act="legProdukt"]');if(!b||b.disabled)return;const act=b.dataset.act,id=b.dataset.id;if(act==="gkHoch"||act==="gkHochStop"||act==="gkHochNeu")return; /* Hochladen hat einen eigenen Handler (weiter unten) */
 if(act==="legProdukt"){const e=legAkt()&&legE(legAkt()).find(e=>e.id===id);if(!e?.katalog)return;ev.stopImmediatePropagation();gkDetail(id);return;}
 ev.stopImmediatePropagation();ev.preventDefault();try{switch(act){
 case "gkOpen":gkOpen();break;case "gkMehr":GK.limit+=48;gkGrid();break;case "gkWahl":gkWahl(b.dataset.v);break;
 case "gkErsetzen":gkOpen(id);break;case "gkBeschriftung":legSkDlg(id);break;
 case "gkBlockNeu":gkBlockNeu();break;case "gkBlockEdit":gkBlockNeu(id);break;
 case "gkTAdd":gkBlockChange(p=>p.terminals.push(gkTerminal()));break;
 case "gkTCopy":gkBlockChange(p=>{const i=p.terminals.findIndex(t=>t.id===id),t=gkClone(p.terminals[i]);t.id=uid();t.netId="";t.rcdGroup="";p.terminals.splice(i+1,0,t);});break;
 case "gkTDel":gkBlockChange(p=>{p.terminals=p.terminals.filter(t=>t.id!==id);p.bridges=p.bridges.filter(b=>!b.contacts.some(c=>c.terminalId===id));});break;
 case "gkNum":gkBlockChange(p=>p.terminals.forEach((t,i)=>{if(!t.label.locked)t.label.text=String(i+1);}));break;
 case "gkBAdd":gkBlockChange(p=>p.bridges.push({id:uid(),article:"2004-402",contacts:[{terminalId:document.getElementById("gk-von").value,slotId:document.getElementById("gk-slot").value},{terminalId:document.getElementById("gk-nach").value,slotId:document.getElementById("gk-slot").value}]}));break;
 case "gkBDel":gkBlockChange(p=>{p.bridges=p.bridges.filter(b=>b.id!==id);});break;
 case "gkUndo":case "gkRedo":{const s=GK_BLOCK,from=act==="gkUndo"?s.undo:s.redo,to=act==="gkUndo"?s.redo:s.undo;if(from.length){to.push(gkClone(s.p));s.p=from.pop();gkBlockDialog();}break;}
 case "gkBlockSvg":gkDownload(gkBlockSvg(),"Klemmblock.svg","image/svg+xml");break;
 case "gkBlockSave":{const L=legAkt(),s=GK_BLOCK;if(!L||L.fertig)break;const svg=gkBlockSvg(),width=s.p.terminals.length*6.2;if(width>(+L.teReihe||12)*gkPitch(L)+.01)throw Error("Klemmblock ist breiter als die Reihe.");const payload={schemaVersion:1,assetId:"block-"+(s.target||uid()),manufacturer:"WAGO",model:"Klemmblock",article:null,widthMm:width,heightMm:52.3,frontCenterMm:26.15,data:"data:image/svg+xml;base64,"+btoa(unescape(encodeURIComponent(svg)))};const e={id:s.target||uid(),art:"ge",kz:"",bez:"WAGO Klemmblock",te:width/gkPitch(L),katalog:payload,klemmenProjekt:gkClone(s.p)};if(s.target){const old=legE(L).find(t=>t.id===s.target);if(!old)throw Error("Klemmblock fehlt.");Object.assign(old,{katalog:payload,klemmenProjekt:e.klemmenProjekt,te:e.te});legSpeichern(L);render();}else awEinsetzen(e);GK_BLOCK=null;awZu();break;}
 }}catch(err){toast(err.message);}
},true);

/* ===== Katalogbilder in den SharePoint laden (Entwickler, 28.11.2026) =====
   Die Bilder liegen nicht öffentlich auf dem Server. Eigene Seite im Labor („Gerätekatalog-Bilder“): Stand je Hersteller, Ordner „Katalog“
   vom Laptop wählen, Fortschritt live. Jede SVG-/PNG-Datei wird über ihre SHA-256-Prüfsumme einem Index-Eintrag zugeordnet und als
   „katalog~assets~<id>.<endung>“ nach „_App/Bilder“ geladen; Vorhandenes wird übersprungen. Danach liefert der Service Worker sie wie alle
   Produktbilder aus (nur nach der Anmeldung). */
const GK_HOCH={laeuft:false,gesamt:0,fertig:0,neu:0,da:0,fremd:0,fehler:0,start:0,aktuell:"",ende:0,fehlerListe:[]};
const gkSpName=a=>bspName("/bilder/katalog/"+a.file);
const gkSpDa=a=>{ const L=(typeof BSP!=="undefined"&&BSP.liste)||{}; return !!L[bspPfad(gkSpName(a))]; };
function gkImSp(){ return GK_INDEX.filter(gkSpDa).length; }
const gkTsd=n=>Number(n||0).toLocaleString("de-DE");
function gkUploadZeile(){ if(!GK_INDEX.length) return ""; const n=gkImSp(), U=GK_HOCH;
  return `<div class="li" role="button" tabindex="0" data-act="nav:gkbilder"><span class="av">${icon("upload")}</span><span class="lt"><span class="h">Gerätekatalog-Bilder</span><span class="s">${esc(U.laeuft?`Wird hochgeladen … ${gkTsd(U.fertig)} von ${gkTsd(U.gesamt)} geprüft`:`${gkTsd(n)} von ${gkTsd(GK_INDEX.length)} im SharePoint`)}</span></span>${icon("chev")}</div>`; }
/* Zahlen für die Seite */
function gkStand(){ const H=new Map(); let da=0; for(const a of GK_INDEX){ const d=gkSpDa(a); if(d) da++; const h=H.get(a.manufacturer)||{n:0,da:0}; h.n++; if(d) h.da++; H.set(a.manufacturer,h); }
  return {da,n:GK_INDEX.length,H:[...H.entries()].sort((x,y)=>(x[1].n-x[1].da?0:1)-(y[1].n-y[1].da?0:1)||y[1].n-x[1].n)}; }
const gkDauer=ms=>{ const s=Math.max(0,Math.round(ms/1000)); return s<60?`${s} s`:`${Math.floor(s/60)} min ${s%60} s`; };
function gkFortHtml(){ const U=GK_HOCH, p=U.gesamt?U.fertig/U.gesamt:0, rest=U.fertig>10?(Date.now()-U.start)/U.fertig*(U.gesamt-U.fertig):0;
  return `<div class="gk-bar"><i style="width:${(p*100).toFixed(1)}%"></i></div>
    <div class="gk-zahl"><span><b>${gkTsd(U.fertig)}</b>von ${gkTsd(U.gesamt)} geprüft</span><span><b>${gkTsd(U.neu)}</b>hochgeladen</span><span><b>${gkTsd(U.da)}</b>schon da</span>${U.fremd?`<span><b>${gkTsd(U.fremd)}</b>nicht im Katalog</span>`:""}${U.fehler?`<span class="warn"><b>${gkTsd(U.fehler)}</b>Fehler</span>`:""}</div>
    <p class="meta" style="margin:8px 4px 0">${U.laeuft?esc(`${U.aktuell?U.aktuell+" · ":""}noch etwa ${gkDauer(rest)} – Fenster bitte offen lassen`):U.ende?esc(`Fertig nach ${gkDauer(U.ende-U.start)}`):""}</p>`; }
function gkSpView(){ if(typeof istEntwickler!=="function"||!istEntwickler()) return `<div class="narrow"><div class="empty">${icon("lock")}<h2>Nur für Entwickler</h2></div></div>`;
  const S=gkStand(), U=GK_HOCH, ok=typeof SYNC_ON!=="undefined"&&SYNC_ON&&ME.signedIn, liste=typeof BSP!=="undefined"&&BSP.liste;
  if(ok&&!liste) setTimeout(()=>bspListe(true).then(()=>{ if(nav.v==="gkbilder") render(); }),0);
  if(ok&&!GK_BS.daten&&!GK_BS.ladeVersuch){ GK_BS.ladeVersuch=1; setTimeout(()=>gkBsLaden().then(d=>{ if(d&&nav.v==="gkbilder") render(); }),0); }
  const p=S.n?S.da/S.n:0;
  return `<div class="narrow gk-sp">
    <section class="gk-kopf"><div class="gk-gross"><b>${gkTsd(S.da)}</b><span>von ${gkTsd(S.n)} Bildern im SharePoint</span></div>
      <div class="gk-bar gross"><i style="width:${(p*100).toFixed(1)}%"></i></div>
      <p class="meta" style="margin:10px 2px 0">${!ok?"Erst mit dem Firmenkonto anmelden – die Bilder gehen in den SharePoint der Firma.":!liste?"Stand wird geladen …":S.da===S.n?"Alle Katalogbilder sind im SharePoint. Neue Bilder einfach erneut hochladen – Vorhandenes wird übersprungen.":"Ordner „Katalog“ vom Laptop wählen. Die App erkennt jedes Bild an seiner Prüfsumme und lädt nur, was noch fehlt."}</p>
      <div class="gk-knopf">${U.laeuft?`<button type="button" class="btn-tonal" data-act="gkHochStop">Anhalten</button>`:`<button type="button" class="btn-filled" data-act="gkHoch" ${ok?"":"disabled"}>${icon("upload")}<span>Ordner „Katalog“ wählen</span></button>`}<button type="button" class="btn-text" data-act="gkHochNeu" ${ok?"":"disabled"}>Stand neu laden</button></div></section>
    ${U.gesamt?`<div class="sec-lbl">${U.laeuft?"Läuft gerade":"Letzter Durchgang"}</div><section class="gk-kopf" id="gkFort">${gkFortHtml()}</section>`:""}
    ${U.fehlerListe.length?`<div class="sec-lbl">Nicht hochgeladen</div><div class="list">${U.fehlerListe.slice(0,30).map(t=>`<div class="li"><span class="lt"><span class="h">${esc(t[0])}</span><span class="s">${esc(t[1])}</span></span></div>`).join("")}</div>`:""}
    <div class="sec-lbl">Beschriftungen der SVGs</div><section class="gk-kopf" id="gkBs">${gkBsHtml()}</section>
    <div class="sec-lbl">Je Hersteller</div>
    <div class="gk-her">${S.H.map(([h,x])=>`<div class="gk-hz${x.da===x.n?" voll":""}"><span class="gk-hn">${esc(h)}</span><span class="gk-hb"><i style="width:${(x.da/x.n*100).toFixed(1)}%"></i></span><span class="gk-hw">${gkTsd(x.da)} / ${gkTsd(x.n)}</span></div>`).join("")}</div>
    <p class="hint">Herkunft und Erlaubnis: 2.046 Grafiken von Electromarker (Nutzung per E-Mail bestätigt), die übrigen eigene Zeichnungen nach Hersteller-Maßen bzw. Hersteller-CAD.</p></div>`; }
let gkFortT=0;
function gkFortZeigen(){ if(nav.v!=="gkbilder") return; const n=Date.now(); if(n-gkFortT<250) return; gkFortT=n; const bs=document.getElementById("gkBs"); if(bs&&GK_BS.laeuft){ bs.innerHTML=gkBsHtml(); if(!GK_HOCH.laeuft) return; } const el=document.getElementById("gkFort"); if(el) el.innerHTML=gkFortHtml(); else render(); }
async function gkHochladen(files){ const U=GK_HOCH; if(U.laeuft) return;
  if(typeof SYNC_ON==="undefined"||!SYNC_ON||!ME.signedIn){ toast("Erst mit dem Firmenkonto anmelden"); return; }
  const F=[...files].filter(f=>/\.(svg|png)$/i.test(f.name)); if(!F.length){ toast("Im gewählten Ordner sind keine SVG- oder PNG-Dateien"); return; }
  Object.assign(U,{laeuft:true,stop:false,gesamt:F.length,fertig:0,neu:0,da:0,fremd:0,fehler:0,start:Date.now(),ende:0,aktuell:"",fehlerListe:[]}); render();
  const nachHash=new Map(); GK_INDEX.forEach(a=>{ if(!nachHash.has(a.sha256)) nachHash.set(a.sha256,[]); nachHash.get(a.sha256).push(a); });
  try{ await bspListe(true); const L=BSP.liste||{}, inArbeit=new Set(); await syncRoot(); const fid=await folderId(BSP_ORDNER,BSP_BIB);
    const arbeit=async()=>{ while(F.length&&!U.stop){ const f=F.shift(), rel=f.webkitRelativePath||f.name; U.aktuell=rel.split("/").slice(1,3).map(t=>t.replace(/_-_/g," – ").replace(/_/g," ")).join(" › ");
      try{ const buf=await f.arrayBuffer(), h=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",buf)),n=>n.toString(16).padStart(2,"0")).join(""), A=nachHash.get(h);
        if(!A){ U.fremd++; continue; }
        for(const a of A){ const name=gkSpName(a); if(L[bspPfad(name)]||inArbeit.has(name)){ U.da++; continue; } inArbeit.add(name);   /* gleiche Datei zweimal im Ordner: nur einmal hochladen */
          const r=await g(`/drives/${fid}:/${encodeURIComponent(name)}:/content`,{method:"PUT",headers:{"Content-Type":/\.svg$/i.test(a.file)?"image/svg+xml":"image/png"},body:new Blob([buf])});
          if(r.ok){ U.neu++; L[bspPfad(name)]=1; } else { U.fehler++; U.fehlerListe.push([rel,`SharePoint meldet ${r.status}`]); } } }
      catch(e){ U.fehler++; U.fehlerListe.push([rel,e.message||String(e)]); }
      finally{ U.fertig++; gkFortZeigen(); } } };
    await Promise.all([arbeit(),arbeit(),arbeit(),arbeit()]);
  }catch(e){ U.fehlerListe.push(["Abbruch",e.message||String(e)]); toast("Hochladen abgebrochen: "+(e.message||e)); }
  U.laeuft=false; U.ende=Date.now(); U.aktuell=""; await bspListe(true);
  if(U.neu&&!U.stop) setTimeout(()=>gkBsErstellen(),500);   /* neue Bilder → Beschriftungen gleich neu einlesen */
  toast(U.stop?"Angehalten – beim nächsten Mal geht es mit dem Rest weiter":`${gkTsd(U.neu)} hochgeladen · ${gkTsd(U.da)} waren schon da${U.fehler?` · ${U.fehler} Fehler`:""}`);
  if(nav.v==="gkbilder"||nav.v==="labor") render(); }
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act="gkHoch"],[data-act="gkHochStop"],[data-act="gkHochNeu"]'); if(!b||b.disabled) return; e.preventDefault(); e.stopPropagation();
  if(typeof istEntwickler!=="function"||!istEntwickler()) return; const a=b.dataset.act;
  if(a==="gkHochStop"){ GK_HOCH.stop=true; toast("Wird angehalten …"); return; }
  if(a==="gkHochNeu"){ bspListe(true).then(()=>{ render(); toast("Stand aktualisiert"); }); return; }
  if(GK_HOCH.laeuft) return;
  const i=document.createElement("input"); i.type="file"; i.multiple=true; i.webkitdirectory=true; i.hidden=true; document.body.appendChild(i);
  i.onchange=()=>{ const fs=i.files; i.remove(); if(fs&&fs.length) gkHochladen(fs); }; i.click(); },true);
