/* ===== ETS-Projekt lesen – Probe (nur Entwickler, Gebäudetechnik) – 20.11.2026 =====
   Max: die Geräte stehen schon vollständig in der ETS (Raum, Adresse, Produkt, Bestellnummer, Programmierstand) – statt alles
   nochmal zu zählen, sollen sie aus dem ETS-Projekt kommen. Erst einmal nur LESEN und zeigen, was ankommt; gespeichert wird nichts,
   die Datei verlässt das Gerät nicht.
   Aufbau einer .knxproj (ZIP): M-xxxx/Hardware.xml (Produkte mit Bestellnummer) · P-xxxx.zip (Projekt, bei Passwortschutz
   AES-verschlüsselt) bzw. Ordner P-xxxx/ mit 0.xml (Topologie + Gebäudestruktur) und project.xml (Name).
   Passwort: ETS6 nimmt als ZIP-Passwort PBKDF2-HMAC-SHA256(Passwort als UTF-16LE, Salz „21.project.ets.knx.org“, 65536 Runden,
   32 Byte) in Base64 – ETS5 das Passwort selbst. Beides wird probiert (wie in xknxproject). ZIP mit AES liest zip.js (BSD-3, /vendor). */
let ETS_ZIP=null, ETS_LETZT=null;
function etsZipLib(){ if(window.zip&&window.zip.ZipReader) return Promise.resolve(window.zip); if(ETS_ZIP) return ETS_ZIP;
  ETS_ZIP=new Promise((ok,no)=>{ const s=document.createElement("script"); s.src="../vendor/zip-no-worker-inflate-2.7.69.min.js";
    s.onload=()=>{ try{ window.zip.configure({useWebWorkers:false}); }catch(e){} ok(window.zip); }; s.onerror=()=>{ ETS_ZIP=null; no(new Error("ZIP-Bibliothek nicht erreichbar")); }; document.head.appendChild(s); });
  return ETS_ZIP; }
async function etsPw6(pw){ const u=new Uint8Array(pw.length*2); for(let i=0;i<pw.length;i++){ const c=pw.charCodeAt(i); u[2*i]=c&255; u[2*i+1]=c>>8; }
  const k=await crypto.subtle.importKey("raw",u,"PBKDF2",false,["deriveBits"]);
  const b=new Uint8Array(await crypto.subtle.deriveBits({name:"PBKDF2",salt:new TextEncoder().encode("21.project.ets.knx.org"),iterations:65536,hash:"SHA-256"},k,256));
  let s=""; b.forEach(x=>s+=String.fromCharCode(x)); return btoa(s); }
const etsXml=t=>new DOMParser().parseFromString(t,"application/xml");
const etsTags=(el,n)=>[...el.getElementsByTagNameNS("*",n)];
const etsKinder=el=>[...el.children];
/* Produkt aus der Kennung, falls die Hardware.xml fehlt: „…_P-MTN6705.2D0008S“ → „MTN6705-0008S“ */
const etsAusId=id=>{ const m=/_P-(.+)$/.exec(id||""); return m?m[1].replace(/\.([0-9A-F]{2})/g,(_,h)=>String.fromCharCode(parseInt(h,16))):""; };
class EtsFehler extends Error{ constructor(art,t){ super(t); this.art=art; } }
async function etsLesen(file,pw){
  const Z=await etsZipLib(), aussen=new Z.ZipReader(new Z.BlobReader(file)), E=await aussen.getEntries();
  const text=e=>e.getData(new Z.TextWriter());
  /* Produkte */
  const P=new Map();
  for(const e of E.filter(e=>/^M-[^/]+\/Hardware\.xml$/i.test(e.filename))){ const d=etsXml(await text(e));
    etsTags(d,"Product").forEach(p=>P.set(p.getAttribute("Id"),{text:p.getAttribute("Text")||"",nr:p.getAttribute("OrderNumber")||"",reg:p.getAttribute("IsRailMounted")==="1"||p.getAttribute("IsRailMounted")==="true"})); }
  /* Projektdateien – offen oder im (verschlüsselten) P-xxxx.zip */
  let x0=null, pj=null, geschuetzt=false;
  const offen=E.find(e=>/^P-[^/]+\/0\.xml$/i.test(e.filename));
  if(offen){ x0=await text(offen); const p=E.find(e=>/^P-[^/]+\/project\.xml$/i.test(e.filename)); if(p) pj=await text(p); }
  else { const pz=E.find(e=>/^P-[^/]+\.zip$/i.test(e.filename)); if(!pz) throw new EtsFehler("format","In der Datei steckt kein ETS-Projekt (P-….zip fehlt).");
    const innen=new Z.ZipReader(new Z.BlobReader(await pz.getData(new Z.BlobWriter()))), IE=await innen.getEntries();
    const e0=IE.find(e=>/(^|\/)0\.xml$/i.test(e.filename)), ep=IE.find(e=>/(^|\/)project\.xml$/i.test(e.filename)); if(!e0) throw new EtsFehler("format","Im Projekt fehlt die 0.xml.");
    geschuetzt=!!e0.encrypted;
    if(geschuetzt){ if(!pw) throw new EtsFehler("pw","Das Projekt ist mit einem Passwort geschützt.");
      const K=[await etsPw6(pw),pw]; let ok=null;
      for(const k of K){ try{ x0=await e0.getData(new Z.TextWriter(),{password:k}); ok=k; break; }catch(e){ if(!/password|passwort/i.test(String(e&&e.message))) throw e; } }
      if(!ok) throw new EtsFehler("pw","Das Passwort passt nicht.");
      if(ep) try{ pj=await ep.getData(new Z.TextWriter(),{password:ok}); }catch(e){} }
    else { x0=await e0.getData(new Z.TextWriter()); if(ep) pj=await ep.getData(new Z.TextWriter()); }
    await innen.close(); }
  await aussen.close();
  /* Topologie: Bereich.Linie.Gerät */
  const d=etsXml(x0), G=[], byId=new Map();
  etsTags(d,"Area").forEach(a=>etsKinder(a).filter(l=>l.localName==="Line").forEach(l=>etsTags(l,"DeviceInstance").forEach(di=>{
    const pr=P.get(di.getAttribute("ProductRefId"))||{text:"",nr:etsAusId(di.getAttribute("ProductRefId"))}, adr=di.getAttribute("Address");
    const x={id:di.getAttribute("Id"),pa:adr!=null&&adr!==""?`${a.getAttribute("Address")}.${l.getAttribute("Address")}.${adr}`:"",linie:`${a.getAttribute("Address")}.${l.getAttribute("Address")}`,
      name:di.getAttribute("Name")||"",beschr:di.getAttribute("Description")||"",produkt:pr.text||etsAusId(di.getAttribute("ProductRefId"))||"Unbekanntes Gerät",nr:pr.nr||"",reg:!!pr.reg,
      geladen:["IndividualAddressLoaded","ApplicationProgramLoaded","ParametersLoaded","CommunicationPartLoaded"].every(k=>di.getAttribute(k)==="true"),ort:[]};
    G.push(x); byId.set(x.id,x); })));
  /* Gebäudestruktur: ETS6 <Locations><Space Type=…>, ETS5 <Buildings><BuildingPart …> */
  const ORTE=[], lauf=(el,pfad)=>etsKinder(el).forEach(c=>{
    if(c.localName==="Space"||c.localName==="BuildingPart"||c.localName==="Floor"||c.localName==="Room"){ const k={typ:c.getAttribute("Type")||c.localName,name:c.getAttribute("Name")||"",nr:c.getAttribute("Number")||""}, p=[...pfad,k];
      const refs=etsKinder(c).filter(r=>r.localName==="DeviceInstanceRef").map(r=>r.getAttribute("RefId"));
      ORTE.push({pfad:p,n:refs.length}); refs.forEach(id=>{ const x=byId.get(id); if(x&&!x.ort.length) x.ort=p; }); lauf(c,p); } });
  etsTags(d,"Locations").concat(etsTags(d,"Buildings")).forEach(w=>lauf(w,[]));
  const name=pj?((etsTags(etsXml(pj),"ProjectInformation")[0]||{getAttribute:()=>""}).getAttribute("Name")||""):"";
  const kopf=d.documentElement, ets=(kopf.getAttribute("CreatedBy")||"")+" "+(kopf.getAttribute("ToolVersion")||"");
  return {name,ets:ets.trim(),schema:(kopf.namespaceURI||"").split("/").pop(),geschuetzt,geraete:G,orte:ORTE,produkte:P.size}; }

/* ---- Anzeige ---- */
const ETS_TYP={Building:"Gebäude",BuildingPart:"Gebäudeteil",Floor:"Etage",Room:"Raum",Corridor:"Flur",Stairway:"Treppenhaus",DistributionBoard:"Verteiler",Function:"Funktion"};
function etsErgebnis(R){ const G=R.geraete, geladen=G.filter(x=>x.geladen).length, ohne=G.filter(x=>!x.ort.length);
  const vt=R.orte.filter(o=>o.pfad[o.pfad.length-1].typ==="DistributionBoard"), rm=R.orte.filter(o=>o.pfad[o.pfad.length-1].typ==="Room");
  const prod=new Map(); G.forEach(x=>{ const k=x.produkt+"|"+x.nr; prod.set(k,(prod.get(k)||0)+1); });
  const zeile=x=>`<div class="ets-g"><b>${esc(x.pa||"–")}</b><span>${esc(x.produkt)}${x.nr?` <small>${esc(x.nr)}</small>`:""}${x.beschr&&x.beschr!==(x.ort[x.ort.length-1]||{}).name?` <small>· ${esc(x.beschr)}</small>`:""}</span>${x.geladen?"":`<i>nicht programmiert</i>`}</div>`;
  /* nach Etage gruppiert, darin Räume und Verteiler */
  const gr=new Map(); G.filter(x=>x.ort.length).forEach(x=>{ const i=x.ort.findIndex(o=>o.typ==="Floor"), et=i>=0?x.ort.slice(0,i+1).map(o=>o.name).join(" › "):x.ort.slice(0,-1).map(o=>o.name).join(" › ")||"Ohne Etage", ziel=x.ort[x.ort.length-1];
    if(!gr.has(et)) gr.set(et,new Map()); const m=gr.get(et), k=(ETS_TYP[ziel.typ]||ziel.typ)+"|"+ziel.name; if(!m.has(k)) m.set(k,[]); m.get(k).push(x); });
  const pa=s=>s.split(".").map(n=>String(n).padStart(3,"0")).join(".");
  const orte=[...gr].map(([et,m])=>`<div class="sec-lbl">${esc(et)}</div>${[...m].sort((a,b)=>a[0].localeCompare(b[0],"de",{numeric:true})).map(([k,L])=>{ const [typ,nm]=k.split("|");
      return `<details class="ets-o"><summary><b>${esc(nm||"ohne Namen")}</b><small>${esc(typ)} · ${L.length} ${L.length===1?"Gerät":"Geräte"}</small></summary>${L.sort((a,b)=>pa(a.pa||"").localeCompare(pa(b.pa||""))).map(zeile).join("")}</details>`; }).join("")}`).join("");
  dialog(R.name||"ETS-Projekt",`<p class="sup" style="margin:0 0 12px">Nur gelesen – gespeichert wurde nichts. ${esc([R.ets,R.schema&&`Schema ${R.schema}`,R.geschuetzt?"mit Passwort":"ohne Passwort"].filter(Boolean).join(" · "))}</p>
    <div class="vu-kacheln ets-k">${[[G.length,"Geräte"],[rm.length,"Räume"],[vt.length,"Verteiler"],[`${geladen}/${G.length}`,"programmiert"]].map(([z,t])=>`<div class="vu-k"><b>${z}</b><span>${t}</span></div>`).join("")}</div>
    <div class="sec-lbl">Produkte</div><div class="ets-p">${[...prod].sort((a,b)=>b[1]-a[1]).map(([k,n])=>{ const [t,nr]=k.split("|"); return `<div><b>${n}×</b><span>${esc(t)}${nr?` <small>${esc(nr)}</small>`:""}</span></div>`; }).join("")}</div>
    ${orte}${ohne.length?`<div class="sec-lbl">Ohne Raum oder Verteiler (${ohne.length})</div>${ohne.map(zeile).join("")}`:""}`,
    `<span style="flex:1"></span><button class="btn-text" data-act="cancel">Schließen</button>`,{breit:true}); }

function etsWahl(){ const i=document.createElement("input"); i.type="file"; i.accept=".knxproj"; i.style.display="none";
  i.onchange=()=>{ const f=i.files&&i.files[0]; i.remove(); if(f){ ETS_LETZT=f; etsStart(""); } }; document.body.appendChild(i); i.click(); }
async function etsStart(pw){ const f=ETS_LETZT; if(!f) return; closeOverlays(); toast("ETS-Projekt wird gelesen …");
  try{ etsErgebnis(await etsLesen(f,pw)); }
  catch(e){ if(e&&e.art==="pw"){ etsPwDlg(e.message); return; } console.error(e); dialog("ETS-Projekt",`<p>Das ließ sich nicht lesen.</p><p class="sup">${esc(e&&e.message||String(e))}</p>`,`<span style="flex:1"></span><button class="btn-text" data-act="cancel">Schließen</button>`); } }
function etsPwDlg(hinweis){ dialog("Passwort des ETS-Projekts",`<p class="sup" style="margin:0 0 12px">${esc(hinweis)} Das Passwort bleibt auf diesem Gerät und wird nicht gespeichert.</p>
    <input id="etsPw" type="password" autocomplete="off" placeholder="Passwort" style="width:100%;box-sizing:border-box;border:0;border-radius:12px;padding:14px;background:var(--sc-high);color:inherit;font:16px var(--font)">`,
    `<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="etsLos">Öffnen</button>`);
  setTimeout(()=>{ const x=document.getElementById("etsPw"); if(x){ x.focus(); x.addEventListener("keydown",e=>{ if(e.key==="Enter"){ e.preventDefault(); etsStart(x.value); } }); } },50); }
function etsZeile(){ return `<div class="li" role="button" tabindex="0" data-act="etsWahl"><span class="av">${icon("upload")}</span><span class="lt"><span class="h">ETS-Projekt lesen (Probe)</span><span class="s">.knxproj wählen – zeigt Etagen, Räume, Verteiler und Geräte. Speichert nichts, die Datei bleibt auf dem Gerät</span></span>${icon("chev")}</div>`; }
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act="etsWahl"],[data-act="etsLos"]'); if(!b) return; e.preventDefault(); e.stopPropagation();
  if(b.dataset.act==="etsWahl") etsWahl(); else etsStart((document.getElementById("etsPw")||{}).value||""); },true);
