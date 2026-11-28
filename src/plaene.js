/* ===== Pläne (Gebäudetechnik, 28.11.2026) =====
   Grundrisse und Raumansichten als PDF oder Bild – der geplottete Plan auf dem Tisch, nur digital.
   Datensätze:
     plaene        {id, ortId, titel, art:"grundriss"|"raum", dateiId, seite, W, H, mass:{a:[x,y],b:[x,y],m}, raeume:[{id,name,poly:[[x,y]…],notiz}], eltern:{planId,raumId}}
     planeintraege {id, planId, typ:"sym"|"leitung"|"skizze"|"text", sym, gw, x, y, h, pts:[[x,y]…], text, aend:true|false, erledigt:{name,mail,at}}
   Koordinaten in Planpunkten (PDF-Seite bei Maßstab 1, bei Bildern Pixel). Einträge sind eigene Datensätze, damit zwei Leute gleichzeitig
   eintragen können, ohne sich zu überschreiben. Die Datei liegt im Kundenordner unter „Pläne und Schaltpläne“, Raumfotos unter „Fotos“.
   Raum erkennen: Plan als Rasterbild, Linien = Wände; Türöffnungen werden über einen Mindestabstand zur Wand abgetrennt (≈ 56 cm, Türen bis etwa 1,10 m werden abgetrennt). */
Object.assign(IC,{
  plan:"M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z",
  pnHand:"M23 5.5V20c0 2.2-1.8 4-4 4h-7.3c-1.08 0-2.1-.43-2.85-1.19L1 14.83s1.26-1.23 1.3-1.25c.22-.19.49-.29.79-.29.22 0 .42.06.6.16.04.01 4.31 2.46 4.31 2.46V4c0-.83.67-1.5 1.5-1.5S11 3.17 11 4v7h1V1.5c0-.83.67-1.5 1.5-1.5S15 .67 15 1.5V11h1V2.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5V11h1V5.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5z",
  pnRaum:"M3 5v4h2V5h4V3H5c-1.1 0-2 .9-2 2zm2 10H3v4c0 1.1.9 2 2 2h4v-2H5v-4zm14 4h-4v2h4c1.1 0 2-.9 2-2v-4h-2v4zm0-16h-4v2h4v4h2V5c0-1.1-.9-2-2-2z",
  pnSym:"M16 7V3h-2v4h-4V3H8v4h-.01C6.9 7 6 7.9 6 8.99v5.49L9.5 18v3h5v-3l3.5-3.51v-5.5c0-1.1-.9-1.99-2-1.99z",
  pnLeitung:"M4 19h4.6l6.4-11H20V6h-6.15L7.45 17H4z",
  pnStift:"M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
  pnText:"M5 4v3h5.5v12h3V7H19V4z",
  pnMass:"M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 10H3V8h2v4h2V8h2v4h2V8h2v4h2V8h2v4h2V8h2v8z",
  pnPlus:"M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zm2.5-4h-2v2H9v-2H7V9h2V7h1v2h2v1z",
  pnMinus:"M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM7 9h5v1H7z",
  pnFit:"M3 5v4h2V5h4V3H5c-1.1 0-2 .9-2 2zm2 10H3v4c0 1.1.9 2 2 2h4v-2H5v-4zm14 4h-4v2h4c1.1 0 2-.9 2-2v-4h-2v4zm0-16h-4v2h4v4h2V5c0-1.1-.9-2-2-2z",
  pnUndo:"M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"});

/* ---- Gewerke und Symbole (angelehnt an DIN EN 60617, vereinfacht) ---- */
const PN_GW={strom:["Steckdosen und Anschlüsse","#D7262E"],licht:["Licht","#E08A00"],daten:["Daten und Medien","#2F74D0"],bus:["KNX und Melder","#2E9B45"],sonst:["Sonstiges","#6B6F76"]};
const PN_SYM=[
  ["steckdose","Steckdose","strom",30],["steckdose2","Doppelsteckdose","strom",30],["arbeit","Arbeitsplatte","strom",115],["herd","Herdanschluss","strom",60],["cee","CEE-Dose","strom",105],
  ["schalter","Schalter","licht",105],["wechsel","Wechselschalter","licht",105],["taster","Taster","licht",105],["leuchte","Deckenleuchte","licht",null],["wandleuchte","Wandleuchte","licht",200],["spot","Einbaustrahler","licht",null],
  ["daten","Datendose","daten",30],["tv","TV / SAT","daten",30],
  ["melder","Bewegungsmelder","bus",null],["rauch","Rauchmelder","bus",null],["knx","KNX-Taster","bus",105],
  ["dose","Abzweigdose","sonst",null],["uv","Verteiler","sonst",null]];
const pnSymDef=k=>PN_SYM.find(s=>s[0]===k)||PN_SYM[0];
const PN_HOEHEN=[[null,"ohne"],[30,"30 cm"],[60,"60 cm"],[105,"105 cm"],[115,"115 cm"],[200,"200 cm"],["decke","Decke"]];
/* Symbol als SVG-Gruppe um (0,0), Kantenlänge 1 – wird auf Planmaß skaliert */
function pnSymForm(k,c){ const st=`fill="none" stroke="${c}" stroke-width=".09" stroke-linecap="round"`, bg=`<circle r=".5" fill="#fff" opacity=".92"/>`;
  switch(k){
    case "steckdose": return bg+`<path d="M-.32 .1a.32 .32 0 0 1 .64 0" ${st}/><path d="M0 .1v.32" ${st}/>`;
    case "steckdose2": return bg+`<path d="M-.32 .1a.32 .32 0 0 1 .64 0" ${st}/><path d="M-.1 .1v.32M.1 .1v.32" ${st}/>`;
    case "arbeit": return bg+`<path d="M-.32 .12a.32 .32 0 0 1 .64 0" ${st}/><path d="M0 .12v.3M-.36 -.26h.72" ${st}/>`;
    case "herd": return bg+`<rect x="-.32" y="-.32" width=".64" height=".64" rx=".06" ${st}/><circle cx="-.12" cy="-.1" r=".08" fill="${c}"/><circle cx=".12" cy="-.1" r=".08" fill="${c}"/><circle cx="0" cy=".14" r=".08" fill="${c}"/>`;
    case "cee": return bg+`<circle r=".32" ${st}/><path d="M-.2 0h.4M0 -.2v.4" ${st}/>`;
    case "schalter": return bg+`<circle r=".14" fill="${c}"/><path d="M.1 -.1L.38 -.38" ${st}/>`;
    case "wechsel": return bg+`<circle r=".14" fill="${c}"/><path d="M.1 -.1L.38 -.38M-.1 .1L-.38 .38" ${st}/>`;
    case "taster": return bg+`<circle r=".26" ${st}/><circle r=".1" fill="${c}"/>`;
    case "leuchte": return bg+`<circle r=".34" ${st}/><path d="M-.24 -.24L.24 .24M.24 -.24L-.24 .24" ${st}/>`;
    case "wandleuchte": return bg+`<circle r=".3" ${st}/><path d="M-.21 -.21L.21 .21M.21 -.21L-.21 .21M-.42 -.3v.6" ${st}/>`;
    case "spot": return bg+`<circle r=".22" ${st}/><circle r=".07" fill="${c}"/>`;
    case "daten": return bg+`<path d="M-.3 .18L0 -.3L.3 .18z" ${st}/><text y=".17" text-anchor="middle" font-size=".26" font-weight="800" fill="${c}">D</text>`;
    case "tv": return bg+`<rect x="-.3" y="-.24" width=".6" height=".44" rx=".05" ${st}/><path d="M-.12 .3h.24" ${st}/>`;
    case "melder": return bg+`<path d="M-.32 .14a.32 .32 0 0 1 .64 0z" ${st}/><path d="M-.18 -.12l-.1 -.14M0 -.18v-.18M.18 -.12l.1 -.14" ${st}/>`;
    case "rauch": return bg+`<circle r=".32" ${st}/><text y=".1" text-anchor="middle" font-size=".28" font-weight="800" fill="${c}">R</text>`;
    case "knx": return bg+`<rect x="-.3" y="-.3" width=".6" height=".6" rx=".08" ${st}/><text y=".1" text-anchor="middle" font-size=".24" font-weight="800" fill="${c}">K</text>`;
    case "dose": return bg+`<circle r=".2" fill="${c}"/>`;
    case "uv": return `<rect x="-.48" y="-.3" width=".96" height=".6" rx=".06" fill="#fff" opacity=".92"/><rect x="-.42" y="-.24" width=".84" height=".48" ${st}/><path d="M-.42 -.24L.42 .24" ${st}/>`;
  } return bg; }
const pnSymSvg=(k,c,px=28)=>`<svg viewBox="-.55 -.55 1.1 1.1" width="${px}" height="${px}" aria-hidden="true">${pnSymForm(k,c)}</svg>`;

/* ---- Daten ---- */
const pnAlle=()=>live("plaene");
const pnVon=id=>{ const p=DB.plaene&&DB.plaene.get(id); return p&&!p.deleted?p:null; };
const pnEintraege=pid=>live("planeintraege").filter(e=>e.planId===pid).sort((a,b)=>(a.created||0)-(b.created||0));
const pnOffen=pid=>pnEintraege(pid).filter(e=>e.aend&&!e.erledigt);
const pnDarf=p=>!!p&&(ME.admin||canEdit(p));
const pnDarfE=e=>!!e&&(ME.admin||canEdit(e));
function pnOrtKind(ortId){ ortId=String(ortId||""); return ortId.startsWith("k:")?["kunden",ortId.slice(2)]:["standorte",ortId]; }
const pnFlaeche=poly=>{ let a=0; for(let i=0,j=poly.length-1;i<poly.length;j=i++) a+=(poly[j][0]+poly[i][0])*(poly[j][1]-poly[i][1]); return Math.abs(a/2); };
const pnIn=(pt,poly)=>{ let c=false; for(let i=0,j=poly.length-1;i<poly.length;j=i++){ const [xi,yi]=poly[i],[xj,yj]=poly[j]; if(((yi>pt[1])!==(yj>pt[1]))&&(pt[0]<(xj-xi)*(pt[1]-yi)/(yj-yi)+xi)) c=!c; } return c; };
const pnMpp=p=>p&&p.mass&&p.mass.m>0?p.mass.m/Math.hypot(p.mass.b[0]-p.mass.a[0],p.mass.b[1]-p.mass.a[1]):0; /* Meter je Planpunkt */
const pnM=(p,len)=>{ const m=pnMpp(p); return m?len*m:0; };
const pnMText=m=>m>=10?`${m.toLocaleString("de-DE",{maximumFractionDigits:1})} m`:`${m.toLocaleString("de-DE",{minimumFractionDigits:2,maximumFractionDigits:2})} m`;
const pnQm=(p,poly)=>{ const m=pnMpp(p); return m?pnFlaeche(poly)*m*m:0; };
const pnLaenge=pts=>{ let s=0; for(let i=1;i<pts.length;i++) s+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]); return s; };
const pnRaumVon=(p,pt)=>(p.raeume||[]).find(r=>r.poly&&r.poly.length>2&&pnIn(pt,r.poly))||null;
/* Symbolgröße: 35 cm im Plan, ohne Maßstab 1,4 % der langen Seite */
const pnSymGr=p=>{ const m=pnMpp(p); return m?Math.min(.35/m,Math.max(p.W,p.H)*.03):Math.max(p.W,p.H)*.014; };
const pnStrich=p=>Math.max(p.W,p.H)*.0018;

/* ---- Plan-Datei laden (PDF über pdf.js, sonst Bild) ---- */
const PN_DOK=new Map(); /* dateiId → {art:"pdf",pdf} | {art:"bild",img} */
async function pnDok(p){ if(PN_DOK.has(p.dateiId)) return PN_DOK.get(p.dateiId);
  const d=DB.dateien.get(p.dateiId); if(!d) throw new Error("Die Plandatei fehlt");
  let b=await dateiGet(d.id); if(!b) b=await dateiHolen(d); if(!b) throw new Error(SYNC_ON?"Plan nicht erreichbar – Internet prüfen":"Der Plan liegt nur auf dem Gerät, auf dem er hochgeladen wurde");
  let o; if(/pdf/i.test(d.typ||"")||/\.pdf$/i.test(d.name||"")){ const lib=await pdfjsLaden(); o={art:"pdf",pdf:await lib.getDocument({data:new Uint8Array(await b.arrayBuffer())}).promise}; }
  else { const u=URL.createObjectURL(b); const img=await new Promise((ok,nein)=>{ const i=new Image(); i.onload=()=>ok(i); i.onerror=()=>nein(new Error("Bild nicht lesbar")); i.src=u; }); o={art:"bild",img}; }
  PN_DOK.set(p.dateiId,o); return o; }
/* zeichnet die Seite in ein Canvas mit Faktor s (Planpunkte → Pixel) */
async function pnMalen(p,s,cv){ const o=await pnDok(p); cv.width=Math.max(1,Math.round(p.W*s)); cv.height=Math.max(1,Math.round(p.H*s)); const x=cv.getContext("2d");
  x.fillStyle="#fff"; x.fillRect(0,0,cv.width,cv.height);
  if(o.art==="pdf"){ const pg=await o.pdf.getPage(p.seite||1); await pg.render({canvasContext:x,viewport:pg.getViewport({scale:s})}).promise; }
  else x.drawImage(o.img,0,0,cv.width,cv.height); return cv; }
/* Größe der Seite in Planpunkten (beim Anlegen) */
async function pnGroesse(p){ const o=await pnDok(p); if(o.art==="pdf"){ const v=(await o.pdf.getPage(p.seite||1)).getViewport({scale:1}); return [v.width,v.height,o.pdf.numPages]; } return [o.img.naturalWidth,o.img.naturalHeight,1]; }
/* Vorschaubild für die Liste */
const PN_VS=new Map();
async function pnVorschau(p){ const k=p.dateiId+":"+(p.seite||1); if(PN_VS.has(k)) return PN_VS.get(k);
  PN_VS.set(k,null); try{ const cv=await pnMalen(p,320/Math.max(p.W,p.H),document.createElement("canvas")); const u=cv.toDataURL("image/jpeg",.8); PN_VS.set(k,u); return u; }catch(e){ PN_VS.delete(k); return null; } }
async function pnVorschauenFuellen(){ for(const el of document.querySelectorAll("img[data-plvs]")){ const p=pnVon(el.dataset.plvs); if(!p||!p.W) continue; const u=await pnVorschau(p); if(u&&el.isConnected){ el.src=u; el.closest(".pn-k")?.classList.add("da"); } } }

/* ---- Raum erkennen ---- */
/* Chamfer-Abstand (3-4) jedes Pixels zum nächsten Pixel mit m[i]=1 */
function pnAbstand(m,w,h){ const n=w*h, D=new Float32Array(n); for(let i=0;i<n;i++) D[i]=m[i]?0:1e9;
  for(let y=0;y<h;y++) for(let x=0;x<w;x++){ const i=y*w+x; if(!D[i]) continue; let v=D[i];
    if(x>0) v=Math.min(v,D[i-1]+3); if(y>0){ v=Math.min(v,D[i-w]+3); if(x>0) v=Math.min(v,D[i-w-1]+4); if(x<w-1) v=Math.min(v,D[i-w+1]+4); } D[i]=v; }
  for(let y=h-1;y>=0;y--) for(let x=w-1;x>=0;x--){ const i=y*w+x; if(!D[i]) continue; let v=D[i];
    if(x<w-1) v=Math.min(v,D[i+1]+3); if(y<h-1){ v=Math.min(v,D[i+w]+3); if(x<w-1) v=Math.min(v,D[i+w+1]+4); if(x>0) v=Math.min(v,D[i+w-1]+4); } D[i]=v; }
  return D; }
/* Kleine, freistehende Teile (Raumbeschriftung, Stützen, Symbole) entfernen: Zusammenhangsflächen, deren Umriss in beiden Richtungen kleiner als max Pixel ist */
function pnKleinWeg(m,w,h,max){ const n=w*h, gesehen=new Uint8Array(n), q=new Int32Array(n);
  for(let i0=0;i0<n;i0++){ if(!m[i0]||gesehen[i0]) continue; let qa=0,qe=0,x0=1e9,x1=-1,y0=1e9,y1=-1; gesehen[i0]=1; q[qe++]=i0;
    while(qa<qe){ const i=q[qa++], x=i%w, y=(i/w)|0; if(x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; if(y>y1)y1=y;
      const nb=[x>0?i-1:-1,x<w-1?i+1:-1,i>=w?i-w:-1,i<n-w?i+w:-1]; for(const j of nb) if(j>=0&&m[j]&&!gesehen[j]){ gesehen[j]=1; q[qe++]=j; } }
    if(x1-x0<max&&y1-y0<max) for(let k=0;k<qe;k++) m[q[k]]=0; }
  return m; }
/* Erst mit gefilterten Linien (Schraffuren geschlossen, dünne Möbel-/Türlinien entfernt – nur mit Maßstab), sonst mit allen Linien */
function pnRaumErkennen(p,quelle,pt){
  const k=Math.min(1,1800/Math.max(quelle.width,quelle.height)), cv=document.createElement("canvas"); cv.width=Math.round(quelle.width*k); cv.height=Math.round(quelle.height*k);
  const cx0=cv.getContext("2d",{willReadFrequently:true}); cx0.drawImage(quelle,0,0,cv.width,cv.height);
  const s=cv.width/p.W, w=cv.width, h=cv.height, n=w*h, dat=cx0.getImageData(0,0,w,h).data;
  const ink=new Uint8Array(n); for(let i=0;i<n;i++){ const r=dat[i*4],g=dat[i*4+1],b=dat[i*4+2]; ink[i]=(r*.3+g*.59+b*.11)<190?1:0; }
  const mpp=pnMpp(p), pxm=mpp?s/mpp:0; /* Pixel je Meter */
  if(pxm){ const rc=Math.max(1,Math.round(.04*pxm)), ro=Math.floor(.03*pxm);
    if(ro>=1){ const A=pnAbstand(ink,w,h), zu=new Uint8Array(n); for(let i=0;i<n;i++) zu[i]=A[i]<=3*rc?1:0;           /* Schraffur zu Fläche */
      const B=pnAbstand(zu.map(v=>1-v),w,h), gz=new Uint8Array(n); for(let i=0;i<n;i++) gz[i]=B[i]>3*rc?1:0;
      const C=pnAbstand(gz.map(v=>1-v),w,h), kern=new Uint8Array(n); for(let i=0;i<n;i++) kern[i]=C[i]>3*ro?1:0;   /* dünne Linien weg */
      const E=pnAbstand(kern,w,h), dick=new Uint8Array(n); for(let i=0;i<n;i++) dick[i]=E[i]<=3*ro?1:0;
      pnKleinWeg(dick,w,h,Math.round(1.6*pxm));
      const r=pnRaumAus(p,dick,w,h,s,pt); if(r) return r; } }
  return pnRaumAus(p,pnKleinWeg(ink,w,h,Math.round(Math.max(w,h)*.01)),w,h,s,pt); }
function pnRaumAus(p,ink,w,h,s,pt){ const n=w*h, D=pnAbstand(ink,w,h);
  const mpp=pnMpp(p), R=Math.max(3,Math.min(90,mpp?(.56/mpp)*s:Math.max(w,h)*.014))*3; /* in Chamfer-Einheiten */
  let sx=Math.round(pt[0]*s), sy=Math.round(pt[1]*s); if(sx<0||sy<0||sx>=w||sy>=h) return null;
  /* Startpunkt auf einem Raumtext? In der Nähe den freiesten Punkt suchen */
  if(D[sy*w+sx]<R){ let best=-1, bi=-1; const rad=Math.round(R/3*2); for(let dy=-rad;dy<=rad;dy+=2) for(let dx=-rad;dx<=rad;dx+=2){ const x=sx+dx,y=sy+dy; if(x<0||y<0||x>=w||y>=h) continue; const v=D[y*w+x]; if(v>best){ best=v; bi=y*w+x; } } if(best<R) return null; sx=bi%w; sy=(bi/w)|0; }
  /* Kerne: zusammenhängende Flächen, die mindestens R von jeder Linie entfernt sind – Türöffnungen trennen sie */
  const lab=new Int32Array(n), q=new Int32Array(n); let nl=0;
  const nb4=(i,x,f)=>{ if(x>0) f(i-1); if(x<w-1) f(i+1); if(i>=w) f(i-w); if(i<n-w) f(i+w); };
  for(let i0=0;i0<n;i0++){ if(lab[i0]||D[i0]<R) continue; nl++; let qa=0,qe=0; lab[i0]=nl; q[qe++]=i0;
    while(qa<qe){ const i=q[qa++]; nb4(i,i%w,j=>{ if(!lab[j]&&D[j]>=R){ lab[j]=nl; q[qe++]=j; } }); } }
  const ziel=lab[sy*w+sx]; if(!ziel) return null;
  /* Rest der freien Fläche dem nächsten Kern zuschlagen (alle Kerne wachsen gleichzeitig) – die Grenze liegt dann mitten in der Tür */
  { let qa=0,qe=0; for(let i=0;i<n;i++) if(lab[i]) q[qe++]=i;
    while(qa<qe){ const i=q[qa++], L=lab[i]; nb4(i,i%w,j=>{ if(!lab[j]&&!ink[j]){ lab[j]=L; q[qe++]=j; } }); } }
  const raum=new Uint8Array(n); let fl=0, rand=false; for(let i=0;i<n;i++) if(lab[i]===ziel){ raum[i]=1; fl++; const x=i%w; if(x===0||x===w-1||i<w||i>=n-w) rand=true; }
  if(fl>n*.6||rand) return null; /* ausgelaufen (Plan ohne geschlossene Wände oder Fläche außerhalb des Gebäudes) */
  /* Rand verfolgen (Moore) */
  let start=-1; for(let i=0;i<n;i++) if(raum[i]){ start=i; break; } if(start<0) return null;
  const pts=[], NB=[[-1,0],[-1,-1],[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1]], an=(x,y)=>x>=0&&y>=0&&x<w&&y<h&&raum[y*w+x];
  let cx=start%w, cy=(start/w)|0, dir=4; const x0=cx,y0=cy; let guard=0;
  do{ pts.push([cx,cy]); let ok=false; for(let k=0;k<8;k++){ const d=(dir+6+k)%8, nx=cx+NB[d][0], ny=cy+NB[d][1]; if(an(nx,ny)){ cx=nx; cy=ny; dir=d; ok=true; break; } } if(!ok) break; }
  while((cx!==x0||cy!==y0)&&++guard<n);
  if(pts.length<8) return null;
  /* vereinfachen (Douglas-Peucker) */
  const dp=(P,eps)=>{ if(P.length<3) return P; let dm=0, ix=0; const [ax,ay]=P[0],[bx,by]=P[P.length-1], L=Math.hypot(bx-ax,by-ay)||1;
    for(let i=1;i<P.length-1;i++){ const d=Math.abs((by-ay)*P[i][0]-(bx-ax)*P[i][1]+bx*ay-by*ax)/L; if(d>dm){ dm=d; ix=i; } }
    return dm>eps?[...dp(P.slice(0,ix+1),eps).slice(0,-1),...dp(P.slice(ix),eps)]:[P[0],P[P.length-1]]; };
  const mitte=Math.floor(pts.length/2), poly=[...dp(pts.slice(0,mitte+1),1.6).slice(0,-1),...dp([...pts.slice(mitte),pts[0]],1.6).slice(0,-1)];
  if(poly.length<3) return null;
  return poly.map(([x,y])=>[+(x/s).toFixed(1),+(y/s).toFixed(1)]); }

/* ---- Zustand des Betrachters ---- */
const PN={id:null,el:null,cv:null,s:0,z:1,tx:0,ty:0,werk:"hand",sym:"steckdose",h:30,gw:"strom",ans:"",pts:null,sel:null,mass:null,laedt:false,fehler:"",zeigen:true,raumSel:null};
const PN_WERK=[["hand","Ansehen","pnHand"],["raum","Raum","pnRaum"],["sym","Symbol","pnSym"],["leitung","Leitung","pnLeitung"],["stift","Skizze","pnStift"],["text","Text","pnText"]];
const pnAnsicht=p=>PN.ans||(ME.admin?"fach":"bau");

/* ---- Liste (Reiter „Pläne“) ---- */
function plaeneView(){ const L=pnAlle().filter(p=>p.art!=="raum"||!p.eltern); const R=pnAlle().filter(p=>p.art==="raum"&&p.eltern);
  if(!pnAlle().length) return `<div class="narrow"><div class="empty">${icon("plan")}<h2>Noch keine Pläne</h2><p>Grundriss oder Raumansicht als PDF oder Foto hochladen – dann Räume antippen, Steckdosen, Leitungen und Änderungen eintragen.</p></div></div>`;
  const G=new Map(); L.forEach(p=>{ const k=p.ortId||""; if(!G.has(k)) G.set(k,[]); G.get(k).push(p); });
  const karte=p=>{ const off=pnOffen(p.id).length, kinder=R.filter(x=>x.eltern.planId===p.id).length;
    return `<button type="button" class="pn-k" data-act="pnAuf" data-id="${esc(p.id)}"><span class="pn-vs"><img data-plvs="${esc(p.id)}" alt="">${icon("plan")}</span><span class="pn-kt"><b>${esc(p.titel||"Plan")}</b><small>${esc([p.art==="raum"?"Raumansicht":"Grundriss",(p.raeume||[]).length&&`${p.raeume.length} ${p.raeume.length===1?"Raum":"Räume"}`,kinder&&`${kinder} Raumansicht${kinder===1?"":"en"}`].filter(Boolean).join(" · "))}</small>${off?`<span class="pill wip">${off} ${off===1?"Änderung offen":"Änderungen offen"}</span>`:""}</span></button>`; };
  setTimeout(pnVorschauenFuellen,0);
  return `<div class="pn-liste">${[...G.entries()].sort((a,b)=>ecOrt(a[0]).titel.localeCompare(ecOrt(b[0]).titel,"de")).map(([o,P])=>`<div class="sec-lbl">${esc(ecOrt(o).titel)}</div><div class="pn-grid">${P.sort((a,b)=>(b.updated||0)-(a.updated||0)).map(karte).join("")}</div>`).join("")}</div>`; }

/* ---- Neuer Plan ---- */
let PN_NEU=null; /* {eltern} */
function pnNeuDlg(o={}){ PN_NEU=o; const K=live("kunden").sort((a,b)=>a.name.localeCompare(b.name,"de")), el=o.eltern&&pnVon(o.eltern.planId), raum=el&&(el.raeume||[]).find(r=>r.id===o.eltern.raumId);
  dialog(raum?`Plan für ${raum.name}`:"Neuer Plan",`<div class="fg1">
    ${el?"":`${sf("ecKunde","Kunde",o.kundeId||"",[["","Kunde wählen …"],...K.map(k=>[k.id,k.name+(k.kdnr?` (${k.kdnr})`:"")])],{form:true})}<div id="ecOrtFeld">${ecOrtFeld(o.kundeId)}</div>`}
    ${tf("pnT","Bezeichnung",raum?`${raum.name} – Ansicht`:"",{form:true,ph:raum?"z. B. Küche Wandansicht":"z. B. Grundriss EG"})}
    ${el?"":`<div class="lbl" style="margin:12px 4px 6px">Art</div>${seg("pnArt",o.art||"grundriss",[["grundriss","Grundriss"],["raum","Raumansicht"]])}`}</div>
    <p class="meta" style="margin:12px 4px 0">PDF oder Foto. Der Plan landet im Kundenordner unter „Pläne und Schaltpläne“.</p>`,
    `<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="pnNeuDatei">Datei wählen</button>`,{breit:true}); }
let pnDateiInput=null;
function pnDateiWahl(fertig,accept){ if(!pnDateiInput){ pnDateiInput=document.createElement("input"); pnDateiInput.type="file"; pnDateiInput.hidden=true; document.body.appendChild(pnDateiInput); }
  pnDateiInput.accept=accept||"application/pdf,.pdf,image/*"; pnDateiInput.onchange=()=>{ const f=pnDateiInput.files[0]; pnDateiInput.value=""; if(f) fertig(f); }; pnDateiInput.click(); }
async function pnNeuAnlegen(f,F){ const o=PN_NEU||{}, el=o.eltern&&pnVon(o.eltern.planId), ortId=el?el.ortId:(F.ecOrt||(F.ecKunde?"k:"+F.ecKunde:""));
  if(!ortId){ toast("Bitte einen Kunden wählen"); return; }
  const [kind,bid]=pnOrtKind(ortId); toast("Plan wird gelesen …");
  const d=await dateiNeu(kind,bid,f,{ordner:"plaene"}); if(!d) return;
  const p={id:uid(),ortId,titel:F.pnT||String(f.name||"Plan").replace(/\.[^.]+$/,""),art:el?"raum":(o.art||"grundriss"),dateiId:d.id,seite:1,raeume:[]};
  if(el) p.eltern={planId:el.id,raumId:o.eltern.raumId};
  try{ const [W,H,n]=await pnGroesse(p); p.W=+W.toFixed(1); p.H=+H.toFixed(1); p.seiten=n; }catch(e){ toast(e.message||"Datei nicht lesbar"); return; }
  saveRec("plaene",p,true); closeOverlays(); pnOeffnen(p.id,el?{v:"plan",id:el.id}:null);
  if(p.seiten>1) setTimeout(()=>toast(`Das PDF hat ${p.seiten} Seiten – Seite 1 ist geöffnet, wechseln über ⋮`),400); }

/* ---- Betrachter ---- */
function pnOeffnen(id,zur){ const p=pnVon(id); if(!p) return; if(PN.id!==id){ PN.id=id; PN.cv=null; PN.s=0; PN.z=0; PN.werk="hand"; PN.pts=null; PN.sel=null; PN.fehler=""; PN.mass=null; PN.raumSel=null; }
  nav={v:"plan",id,zur:zur||{v:"plaene"}}; closeOverlays(); render(); scrollTo(0,0); }
function planView(p){ const ans=pnAnsicht(p), off=pnOffen(p.id), darf=pnDarf(p);
  const werk=PN_WERK.filter(([k])=>k!=="raum"||darf);
  const symLeiste=PN.werk==="sym"?`<div class="pn-pal">${PN_SYM.map(([k,t,g])=>`<button type="button" class="pn-sy${PN.sym===k?" an":""}" data-act="pnSymW" data-v="${k}" title="${esc(t)}" aria-label="${esc(t)}">${pnSymSvg(k,PN_GW[g][1],26)}<span>${esc(t)}</span></button>`).join("")}</div>
    <div class="chips pn-h">${PN_HOEHEN.map(([v,t])=>`<button type="button" class="chip" data-act="pnHoehe" data-v="${v===null?"":v}" aria-pressed="${String(PN.h??"")===String(v??"")}">${icon("check")}${esc(t)}</button>`).join("")}</div>`:"";
  const gwLeiste=["leitung","stift","text"].includes(PN.werk)?`<div class="chips pn-gw">${Object.entries(PN_GW).map(([k,[t,c]])=>`<button type="button" class="chip" data-act="pnGw" data-v="${k}" aria-pressed="${PN.gw===k}"><i class="pn-fp" style="background:${c}"></i>${esc(t)}</button>`).join("")}</div>`:"";
  const hinweis={raum:"Raum antippen – er wird automatisch erkannt. Klappt es nicht, die Ecken nacheinander antippen.",sym:"Symbol wählen und an die Stelle im Plan tippen.",leitung:"Punkte nacheinander antippen, „Fertig“ beendet die Leitung.",stift:"Mit dem Stift oder Finger zeichnen. Verschieben mit zwei Fingern.",text:"An die Stelle tippen, an die der Text soll."}[PN.werk]||"";
  const zeichnen=PN.pts&&PN.pts.length;
  return `<div class="pn-seite">
    <div class="pn-kopf">${seg("pnAns",ans,[["fach","Fachplan"],["bau","Baustelle"]],"pn-ans")}<span style="flex:1"></span>
      ${!p.mass&&darf?`<button type="button" class="btn-tonal pn-knopf" data-act="pnMassStart">${icon("pnMass")}Maßstab festlegen</button>`:p.mass?`<span class="pn-mst">${icon("pnMass")}Maßstab gesetzt</span>`:""}
      <button type="button" class="icon-btn" data-act="pnMenue" aria-label="Weitere Optionen">${icon("more")}</button></div>
    <div class="pn-werk">${werk.map(([k,t,i])=>`<button type="button" class="pn-w${PN.werk===k?" an":""}" data-act="pnWerk" data-v="${k}">${icon(i)}<span>${t}</span></button>`).join("")}</div>
    ${symLeiste}${gwLeiste}
    ${PN.mass?`<p class="pn-hw an">${PN.mass.length<2?"Ersten Punkt einer bekannten Strecke antippen (z. B. eine bemaßte Wand).":"Zweiten Punkt antippen."}</p>`:hinweis?`<p class="pn-hw">${esc(hinweis)}</p>`:""}
    <div class="pn-buehne${ans==="bau"?" bau":""}" id="pnWrap"><div class="pn-laden">${PN.fehler?esc(PN.fehler):"Plan wird geladen …"}</div></div>
    <div class="pn-unten">
      <div class="pn-zoom"><button type="button" class="icon-btn" data-act="pnZoom" data-v="1.4" aria-label="Vergrößern">${icon("pnPlus")}</button><button type="button" class="icon-btn" data-act="pnZoom" data-v="0.7" aria-label="Verkleinern">${icon("pnMinus")}</button><button type="button" class="icon-btn" data-act="pnFit" aria-label="Ganzen Plan zeigen">${icon("pnFit")}</button></div>
      <span style="flex:1"></span>
      ${zeichnen?`<button type="button" class="btn-text" data-act="pnPtsWeg">Verwerfen</button><button type="button" class="btn-filled sm" data-act="pnPtsOk">Fertig</button>`:`<button type="button" class="btn-text pn-knopf" data-act="pnUndo">${icon("pnUndo")}Rückgängig</button>`}</div>
    ${pnRaeumeHtml(p)}${pnAendHtml(p,off)}</div>`; }
function pnRaeumeHtml(p){ const R=p.raeume||[]; if(!R.length) return "";
  const E=pnEintraege(p.id);
  return `<div class="sec-lbl">Räume</div><div class="list">${R.map(r=>{ const n=E.filter(e=>e.typ==="sym"&&pnIn([e.x,e.y],r.poly)).length, qm=pnQm(p,r.poly), k=pnKinder(p.id,r.id).length, f=pnRaumFotos(r.id).length;
    return `<div class="li" role="button" tabindex="0" data-act="pnRaumAuf" data-id="${esc(r.id)}"><span class="av">${icon("pnRaum")}</span><span class="lt"><span class="h">${esc(r.name||"Raum")}</span><span class="s">${esc([qm&&`ca. ${qm.toLocaleString("de-DE",{maximumFractionDigits:1})} m²`,`${n} ${n===1?"Symbol":"Symbole"}`,f&&`${f} ${f===1?"Foto":"Fotos"}`,k&&`${k} ${k===1?"Plan":"Pläne"}`].filter(Boolean).join(" · "))}</span></span>${icon("chev")}</div>`; }).join("")}</div>`; }
function pnAendHtml(p,off){ if(!off.length) return "";
  return `<div class="sec-lbl">Änderungen von der Baustelle</div><div class="list">${off.map(e=>{ const r=e.x!=null?pnRaumVon(p,[e.x,e.y]):null;
    return `<div class="li" role="button" tabindex="0" data-act="pnEAuf" data-id="${esc(e.id)}"><span class="av pn-av-a">${e.typ==="sym"?pnSymSvg(e.sym,PN_GW[pnSymDef(e.sym)[2]][1],26):icon(e.typ==="text"?"pnText":e.typ==="leitung"?"pnLeitung":"pnStift")}</span><span class="lt"><span class="h">${esc(pnETitel(p,e))}${r?` · ${esc(r.name)}`:""}</span><span class="s">${esc([e.createdBy&&e.createdBy.name,wann(e.created)].filter(Boolean).join(" · "))}</span></span>${ME.admin?`<button type="button" class="btn-tonal pn-knopf" data-act="pnUebernehmen" data-id="${esc(e.id)}">Übernehmen</button>`:""}</div>`; }).join("")}</div>`; }
const pnETitel=(p,e)=>e.typ==="sym"?pnSymDef(e.sym)[1]+(e.h?` · ${e.h==="decke"?"Decke":e.h+" cm"}`:""):e.typ==="leitung"?`Leitung${pnM(p,pnLaenge(e.pts||[]))?` · ${pnMText(pnM(p,pnLaenge(e.pts)))}`:""}`:e.typ==="text"?`„${e.text||""}“`:"Skizze";
const pnKinder=(pid,rid)=>pnAlle().filter(x=>x.eltern&&x.eltern.planId===pid&&(!rid||x.eltern.raumId===rid));
const pnRaumFotos=rid=>live("dateien").filter(d=>d.raumId===rid&&istBild(d)).sort((a,b)=>(b.created||0)-(a.created||0));

/* ---- Bühne: Canvas + SVG, bleibt zwischen render()-Aufrufen erhalten ---- */
function pnBuehne(){ if(PN.el) return PN.el; const el=document.createElement("div"); el.className="pn-in";
  el.innerHTML=`<div class="pn-flaeche"><canvas></canvas><svg class="pn-svg" xmlns="http://www.w3.org/2000/svg"></svg></div>`; PN.el=el; pnGesten(el); return el; }
async function pnMount(){ if(nav.v!=="plan") return; const w=document.getElementById("pnWrap"), p=pnVon(nav.id); if(!w||!p) return;
  const el=pnBuehne(); w.innerHTML=""; w.appendChild(el); el.classList.toggle("bau",pnAnsicht(p)==="bau");
  if(PN.cv&&PN.cvId===p.id){ pnSvg(); pnTransform(); return; }
  if(PN.laedt===p.id) return; PN.laedt=p.id; PN.fehler="";
  try{ const box=w.getBoundingClientRect(), s=Math.min(Math.sqrt(12e6/(p.W*p.H)),Math.max(2,2*(box.width||800)/p.W*devicePixelRatio)), cv=el.querySelector("canvas");
    await pnMalen(p,s,cv); cv.style.width=p.W+"px"; cv.style.height=p.H+"px"; PN.cv=cv; PN.cvId=p.id; PN.s=s;
    const fl=el.querySelector(".pn-flaeche"); fl.style.width=p.W+"px"; fl.style.height=p.H+"px";
    if(!PN.z) pnEinpassen(); pnSvg(); pnTransform(); }
  catch(e){ PN.fehler=e.message||"Plan konnte nicht geladen werden"; const l=w.querySelector(".pn-laden"); if(l) l.textContent=PN.fehler; else w.innerHTML=`<div class="pn-laden">${esc(PN.fehler)}</div>`; }
  finally{ PN.laedt=false; } }
function pnEinpassen(){ const p=pnVon(PN.id), w=document.getElementById("pnWrap"); if(!p||!w) return; const b=w.getBoundingClientRect();
  PN.z=Math.min(b.width/p.W,b.height/p.H)*.96; PN.tx=(b.width-p.W*PN.z)/2; PN.ty=(b.height-p.H*PN.z)/2; }
function pnTransform(){ const f=PN.el&&PN.el.querySelector(".pn-flaeche"); if(f) f.style.transform=`translate(${PN.tx}px,${PN.ty}px) scale(${PN.z})`; }
function pnZoomUm(f,cx,cy){ const w=document.getElementById("pnWrap"); if(!w) return; const b=w.getBoundingClientRect(); if(cx==null){ cx=b.width/2; cy=b.height/2; }
  const z=Math.max(.05,Math.min(40,PN.z*f)), k=z/PN.z; PN.tx=cx-(cx-PN.tx)*k; PN.ty=cy-(cy-PN.ty)*k; PN.z=z; pnTransform(); }
/* Bildschirm → Plan */
function pnPunkt(ev){ const w=document.getElementById("pnWrap"), b=w.getBoundingClientRect(); return [(ev.clientX-b.left-PN.tx)/PN.z,(ev.clientY-b.top-PN.ty)/PN.z]; }

/* Overlay zeichnen */
function pnSvg(){ const p=pnVon(PN.id), svg=PN.el&&PN.el.querySelector(".pn-svg"); if(!p||!svg) return;
  svg.setAttribute("viewBox",`0 0 ${p.W} ${p.H}`); svg.setAttribute("width",p.W); svg.setAttribute("height",p.H);
  const bau=pnAnsicht(p)==="bau", S=pnSymGr(p), sw=pnStrich(p), E=pnEintraege(p.id), fs=S*.55;
  const raeume=(p.raeume||[]).map(r=>{ const sel=PN.raumSel===r.id, c=r.poly.reduce((a,q)=>[a[0]+q[0]/r.poly.length,a[1]+q[1]/r.poly.length],[0,0]), qm=pnQm(p,r.poly);
    return `<g class="pn-r${sel?" sel":""}" data-r="${esc(r.id)}"><path d="M${r.poly.map(q=>q.join(" ")).join("L")}Z" fill="${sel?"rgba(215,38,46,.16)":bau?"rgba(47,116,208,.06)":"rgba(47,116,208,.04)"}" stroke="${sel?"#D7262E":"rgba(47,116,208,.55)"}" stroke-width="${sw*(sel?2.2:1.2)}" stroke-dasharray="${sel?"":sw*4+" "+sw*3}"/>
      ${bau||sel?`<g transform="translate(${c[0]} ${c[1]})"><text text-anchor="middle" font-size="${fs*1.5}" font-weight="800" fill="#1d1d1f" paint-order="stroke" stroke="#fff" stroke-width="${fs*.35}">${esc(r.name||"Raum")}</text>${qm?`<text y="${fs*1.6}" text-anchor="middle" font-size="${fs}" font-weight="600" fill="#5b5e63" paint-order="stroke" stroke="#fff" stroke-width="${fs*.3}">ca. ${qm.toLocaleString("de-DE",{maximumFractionDigits:1})} m²</text>`:""}</g>`:""}</g>`; }).join("");
  const ein=E.map(e=>{ const c=e.typ==="sym"?PN_GW[pnSymDef(e.sym)[2]][1]:(PN_GW[e.gw]||PN_GW.sonst)[1], neu=e.aend&&!e.erledigt, sel=PN.sel===e.id, mark=neu?`<circle cx="${e.x??(e.pts&&e.pts[0][0])}" cy="${e.y??(e.pts&&e.pts[0][1])}" r="${S*.95}" fill="none" stroke="#F0A000" stroke-width="${sw*2.5}"/>`:"";
    if(e.typ==="sym") return `<g data-e="${esc(e.id)}" class="pn-e${sel?" sel":""}">${neu?mark:""}<g transform="translate(${e.x} ${e.y}) scale(${S})">${pnSymForm(e.sym,c)}</g>${e.h&&(bau||sel)?`<text x="${e.x+S*.62}" y="${e.y+S*.2}" font-size="${fs*.9}" font-weight="700" fill="${c}" paint-order="stroke" stroke="#fff" stroke-width="${fs*.25}">${e.h==="decke"?"D":e.h}</text>`:""}${sel?`<circle cx="${e.x}" cy="${e.y}" r="${S*.8}" fill="none" stroke="#1d1d1f" stroke-width="${sw*1.5}" stroke-dasharray="${sw*3} ${sw*2}"/>`:""}</g>`;
    if(e.typ==="leitung"||e.typ==="skizze"){ const P=e.pts||[]; if(P.length<2) return ""; const L=pnM(p,pnLaenge(P)), m=P[Math.floor(P.length/2)];
      return `<g data-e="${esc(e.id)}" class="pn-e${sel?" sel":""}"><polyline points="${P.map(q=>q.join(",")).join(" ")}" fill="none" stroke="${c}" stroke-width="${sw*(e.typ==="leitung"?2.2:2.6)}" stroke-linecap="round" stroke-linejoin="round" ${e.typ==="leitung"?`stroke-dasharray="${sw*6} ${sw*3}"`:""} opacity="${sel?1:.9}"/>${neu?`<polyline points="${P.map(q=>q.join(",")).join(" ")}" fill="none" stroke="#F0A000" stroke-width="${sw*7}" opacity=".28" stroke-linecap="round"/>`:""}${e.typ==="leitung"&&L?`<text x="${m[0]}" y="${m[1]-S*.4}" text-anchor="middle" font-size="${fs*.9}" font-weight="700" fill="${c}" paint-order="stroke" stroke="#fff" stroke-width="${fs*.25}">${pnMText(L)}</text>`:""}</g>`; }
    if(e.typ==="text") return `<g data-e="${esc(e.id)}" class="pn-e${sel?" sel":""}">${mark}<text x="${e.x}" y="${e.y}" font-size="${fs*1.3}" font-weight="700" fill="${c}" paint-order="stroke" stroke="#fff" stroke-width="${fs*.35}">${esc(e.text||"")}</text></g>`;
    return ""; }).join("");
  const offen=PN.pts&&PN.pts.length?`<polyline points="${PN.pts.map(q=>q.join(",")).join(" ")}" fill="${PN.werk==="raum"?"rgba(215,38,46,.12)":"none"}" stroke="${PN.werk==="raum"?"#D7262E":(PN_GW[PN.gw]||PN_GW.sonst)[1]}" stroke-width="${sw*2.2}" stroke-linejoin="round"/>${PN.pts.map(q=>`<circle cx="${q[0]}" cy="${q[1]}" r="${sw*3}" fill="#fff" stroke="#D7262E" stroke-width="${sw}"/>`).join("")}`:"";
  const mass=PN.mass&&PN.mass.length?PN.mass.map(q=>`<circle cx="${q[0]}" cy="${q[1]}" r="${sw*4}" fill="#D7262E"/>`).join(""):"";
  svg.innerHTML=`<g class="pn-rr">${raeume}</g><g>${ein}</g><g>${offen}${mass}</g>`; }

/* ---- Gesten: ein Finger/Maus = Werkzeug, zwei Finger = verschieben und zoomen, Mausrad = zoomen ---- */
function pnGesten(el){ const P=new Map(); let start=null, pinch=null, strich=null;
  el.addEventListener("pointerdown",ev=>{ if(ev.button>0&&ev.pointerType==="mouse"&&ev.button!==1) return; el.setPointerCapture(ev.pointerId); P.set(ev.pointerId,{x:ev.clientX,y:ev.clientY});
    if(P.size===2){ strich=null; start=null; const [a,b]=[...P.values()]; pinch={d:Math.hypot(a.x-b.x,a.y-b.y),mx:(a.x+b.x)/2,my:(a.y+b.y)/2,z:PN.z,tx:PN.tx,ty:PN.ty}; return; }
    start={x:ev.clientX,y:ev.clientY,t:Date.now(),tx:PN.tx,ty:PN.ty,id:ev.pointerId,bewegt:false};
    if(PN.werk==="stift"&&!PN.mass&&ev.button!==1){ strich=[pnPunkt(ev)]; } });
  el.addEventListener("pointermove",ev=>{ if(!P.has(ev.pointerId)) return; P.set(ev.pointerId,{x:ev.clientX,y:ev.clientY});
    if(pinch&&P.size>=2){ const [a,b]=[...P.values()], d=Math.hypot(a.x-b.x,a.y-b.y), mx=(a.x+b.x)/2, my=(a.y+b.y)/2, w=document.getElementById("pnWrap").getBoundingClientRect();
      const z=Math.max(.05,Math.min(40,pinch.z*d/pinch.d)), k=z/pinch.z, cx=pinch.mx-w.left, cy=pinch.my-w.top;
      PN.z=z; PN.tx=cx-(cx-pinch.tx)*k+(mx-pinch.mx); PN.ty=cy-(cy-pinch.ty)*k+(my-pinch.my); pnTransform(); return; }
    if(!start||start.id!==ev.pointerId) return; const dx=ev.clientX-start.x, dy=ev.clientY-start.y; if(Math.hypot(dx,dy)>6) start.bewegt=true;
    if(strich){ strich.push(pnPunkt(ev)); PN.pts=strich; pnSvg(); return; }
    if(start.bewegt){ PN.tx=start.tx+dx; PN.ty=start.ty+dy; pnTransform(); } });
  const ende=ev=>{ if(!P.has(ev.pointerId)) return; P.delete(ev.pointerId); if(pinch){ if(P.size<2) pinch=null; start=null; return; }
    if(strich&&start&&start.id===ev.pointerId){ const S=strich; strich=null; PN.pts=null; start=null; if(S.length>2) pnEintrag({typ:"skizze",pts:S.map(q=>[+q[0].toFixed(1),+q[1].toFixed(1)]),gw:PN.gw}); else pnSvg(); return; }
    if(start&&start.id===ev.pointerId&&!start.bewegt&&Date.now()-start.t<600) pnTipp(pnPunkt(ev),ev); start=null; };
  el.addEventListener("pointerup",ende); el.addEventListener("pointercancel",ev=>{ P.delete(ev.pointerId); pinch=null; start=null; strich=null; PN.pts=PN.werk==="stift"?null:PN.pts; });
  el.addEventListener("wheel",ev=>{ ev.preventDefault(); const w=document.getElementById("pnWrap").getBoundingClientRect(); if(ev.ctrlKey||ev.metaKey||Math.abs(ev.deltaY)>=40||ev.deltaMode) pnZoomUm(Math.exp(-ev.deltaY*(ev.ctrlKey?.01:.0018)),ev.clientX-w.left,ev.clientY-w.top); else { PN.tx-=ev.deltaX; PN.ty-=ev.deltaY; pnTransform(); } },{passive:false});
  el.addEventListener("dblclick",ev=>{ if(PN.werk==="hand"){ const w=document.getElementById("pnWrap").getBoundingClientRect(); pnZoomUm(1.8,ev.clientX-w.left,ev.clientY-w.top); } }); }

/* Antippen je Werkzeug */
async function pnTipp(pt,ev){ const p=pnVon(PN.id); if(!p) return;
  if(PN.mass){ PN.mass.push(pt); pnSvg(); if(PN.mass.length===2) pnMassDlg(); return; }
  if(PN.werk==="hand"){ const h=document.elementFromPoint(ev.clientX,ev.clientY), t=h&&h.closest&&h.closest("[data-e]"); if(t){ PN.sel=t.dataset.e; pnSvg(); pnEDlg(t.dataset.e); return; }
    const r=pnRaumVon(p,pt); PN.sel=null; if(r){ PN.raumSel=r.id; pnSvg(); pnRaumDlg(r.id); } else { PN.raumSel=null; pnSvg(); } return; }
  if(PN.werk==="sym"){ const [,,,hStd]=pnSymDef(PN.sym); pnEintrag({typ:"sym",sym:PN.sym,x:+pt[0].toFixed(1),y:+pt[1].toFixed(1),h:PN.h===undefined?hStd:PN.h}); return; }
  if(PN.werk==="text"){ pnTextDlg(pt); return; }
  if(PN.werk==="leitung"){ PN.pts=[...(PN.pts||[]),[+pt[0].toFixed(1),+pt[1].toFixed(1)]]; pnSvg(); if(PN.pts.length<=2) render(); return; }
  if(PN.werk==="raum"){
    if(PN.pts&&PN.pts.length){ const a=PN.pts[0], nah=Math.hypot(pt[0]-a[0],pt[1]-a[1])*PN.z<18; if(nah&&PN.pts.length>2){ pnRaumNeu(PN.pts); return; } PN.pts.push([+pt[0].toFixed(1),+pt[1].toFixed(1)]); pnSvg(); if(PN.pts.length===1) render(); return; }
    const da=pnRaumVon(p,pt); if(da){ PN.raumSel=da.id; pnSvg(); pnRaumDlg(da.id); return; }
    let poly=null; try{ poly=PN.cv&&pnRaumErkennen(p,PN.cv,pt); }catch(e){ poly=null; }
    if(poly){ PN.pts=null; pnRaumNeu(poly); }
    else { PN.pts=[[+pt[0].toFixed(1),+pt[1].toFixed(1)]]; render(); toast("Raum nicht eindeutig erkannt – Ecken nacheinander antippen, zum Schluss den ersten Punkt"); } } }
function pnEintrag(o){ const p=pnVon(PN.id); if(!p) return; const bau=pnAnsicht(p)==="bau";
  const e=Object.assign({id:uid(),planId:p.id,aend:bau},o, p.demo?{demo:true}:{}); saveRec("planeintraege",e,true); PN.pts=null; PN_UNDO.push(e.id); pnSvg(); if(bau||e.aend) render(); }
const PN_UNDO=[];

/* ---- Raum anlegen, Raum-Fenster ---- */
function pnRaumNeu(poly){ const p=pnVon(PN.id); if(!p||!pnDarf(p)) return; PN.pts=null;
  const g=typeof ecGeb==="function"?ecGeb(p.ortId):null, vor=g?[...new Set(g.etagen.flatMap(e=>(e.raeume||[]).map(r=>r.name)).filter(Boolean))]:[];
  PN.neuPoly=poly; pnSvg(); const qm=pnQm(p,poly);
  dialog("Raum benennen",`<div class="fg1">${tf("pnRn","Name","",{form:true,list:"pnRnL",ph:"z. B. Küche"})}${datalist("pnRnL",["Küche","Wohnen","Essen","Flur","Bad","WC","Schlafen","Kind","Büro","HWR","Abstellraum","Diele","Keller","Garage",...vor])}</div>
    <p class="meta" style="margin:10px 4px 0">${qm?`Fläche laut Maßstab: ca. ${qm.toLocaleString("de-DE",{maximumFractionDigits:1})} m²`:"Mit Maßstab wird die Fläche berechnet."}</p>`,
    `<span style="flex:1"></span><button class="btn-text" data-act="pnRaumAbbr">Abbrechen</button><button class="btn-text" data-act="pnRaumOk">Speichern</button>`); }
function pnRaumDlg(rid){ const p=pnVon(PN.id), r=p&&(p.raeume||[]).find(x=>x.id===rid); if(!r) return; const darf=pnDarf(p);
  const E=pnEintraege(p.id).filter(e=>e.typ==="sym"&&pnIn([e.x,e.y],r.poly)), Z={}; E.forEach(e=>{ const t=pnSymDef(e.sym)[1]; Z[t]=(Z[t]||0)+1; });
  const L=pnEintraege(p.id).filter(e=>e.typ==="leitung"&&(e.pts||[]).some(q=>pnIn(q,r.poly))), lm=L.reduce((s,e)=>s+pnM(p,pnLaenge(e.pts||[])),0);
  const F=pnRaumFotos(r.id), K=pnKinder(p.id,r.id), qm=pnQm(p,r.poly);
  dialog(r.name||"Raum",`<p class="sup" style="margin:0 0 12px">${esc([qm&&`ca. ${qm.toLocaleString("de-DE",{maximumFractionDigits:1})} m²`,p.titel].filter(Boolean).join(" · "))}</p>
    <div class="lbl" style="margin:0 4px 6px">Im Raum</div>${Object.keys(Z).length||lm?`<div class="pn-zahl">${Object.entries(Z).map(([t,n])=>`<span><b>${n}</b>${esc(t)}</span>`).join("")}${lm?`<span><b>${pnMText(lm)}</b>Leitung</span>`:""}</div>`:`<p class="meta" style="margin:0 4px">Noch nichts eingetragen.</p>`}
    <div class="lbl" style="margin:16px 4px 6px">Fotos</div><div class="pn-fotos">${F.map(d=>`<button type="button" class="ab-k" data-act="dateiOeffnen" data-id="${d.id}"><img data-datei="${d.id}" alt=""><span class="ab-leer">${icon("cam")}</span></button>`).join("")}<button type="button" class="pn-fneu" data-act="pnFoto" data-id="${esc(r.id)}">${icon("cam")}<span>Foto</span></button></div>
    <p class="meta" style="margin:6px 4px 0">Zum Beispiel, wo Leitungen liegen, bevor zugeputzt wird.</p>
    <div class="lbl" style="margin:16px 4px 6px">Pläne für diesen Raum</div>${K.length?`<div class="list">${K.map(x=>`<div class="li" role="button" tabindex="0" data-act="pnAufZ" data-id="${esc(x.id)}"><span class="av">${icon("plan")}</span><span class="lt"><span class="h">${esc(x.titel||"Plan")}</span><span class="s">${esc(wann(x.created))}</span></span>${icon("chev")}</div>`).join("")}</div>`:""}
    <button type="button" class="btn-tonal pn-knopf" style="margin-top:8px" data-act="pnKindNeu" data-id="${esc(r.id)}">${icon("add")}Plan hinzufügen (z. B. Küchenplan)</button>
    <div class="fg1" style="margin-top:16px">${ta("pnRnotiz","Notiz",r.notiz||"",{form:true,ph:"z. B. Arbeitsplatte 90 cm, Herd links"})}${darf?tf("pnRname","Name",r.name||"",{form:true}):""}</div>`,
    `${darf?`<button class="btn-text danger" data-act="pnRaumWeg" data-id="${esc(r.id)}">Löschen</button>`:""}<span style="flex:1"></span><button class="btn-text" data-act="pnRaumZu">Schließen</button><button class="btn-text" data-act="pnRaumSpeichern" data-id="${esc(r.id)}">Speichern</button>`,{breit:true});
  setTimeout(()=>{ if(typeof bilderFuellen==="function") bilderFuellen(); },0); }
function pnEDlg(eid){ const p=pnVon(PN.id), e=DB.planeintraege.get(eid); if(!p||!e||e.deleted) return; const darf=pnDarfE(e), r=e.x!=null?pnRaumVon(p,[e.x,e.y]):null;
  dialog(pnETitel(p,e),`<p class="sup" style="margin:0 0 12px">${esc([r&&r.name,e.createdBy&&e.createdBy.name,wann(e.created)].filter(Boolean).join(" · "))}${e.aend?`<br>${e.erledigt?`Übernommen von ${esc(e.erledigt.name||"")} · ${esc(wann(e.erledigt.at))}`:"Änderung von der Baustelle – noch nicht übernommen"}`:""}</p>
    ${e.typ==="sym"&&darf?`<div class="lbl" style="margin:0 4px 6px">Höhe</div><div class="chips">${PN_HOEHEN.map(([v,t])=>`<button type="button" class="chip" data-act="pnEHoehe" data-id="${esc(e.id)}" data-v="${v===null?"":v}" aria-pressed="${String(e.h??"")===String(v??"")}">${icon("check")}${esc(t)}</button>`).join("")}</div>`:""}
    ${e.typ==="text"&&darf?`<div class="fg1">${tf("pnEt","Text",e.text||"",{form:true})}</div>`:""}`,
    `${darf?`<button class="btn-text danger" data-act="pnEWeg" data-id="${esc(e.id)}">Löschen</button>`:""}<span style="flex:1"></span>${e.aend&&!e.erledigt&&ME.admin?`<button class="btn-text" data-act="pnUebernehmen" data-id="${esc(e.id)}">Übernehmen</button>`:""}<button class="btn-text" data-act="pnEZu">${e.typ==="text"&&darf?"Speichern":"Schließen"}</button>`); }
function pnTextDlg(pt){ PN.textPt=pt; dialog("Text",`<div class="fg1">${tf("pnTx","Text","",{form:true,ph:"z. B. Leerrohr bis Dachboden"})}</div>`,`<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="pnTextOk">Eintragen</button>`); }
function pnMassDlg(){ const [a,b]=PN.mass; dialog("Maßstab festlegen",`<p class="sup" style="margin:0 0 12px">Wie lang ist die Strecke zwischen den beiden Punkten in Wirklichkeit?</p><div class="fg1">${tf("pnMm","Länge in Metern","",{form:true,im:"decimal",ph:"z. B. 4,26"})}</div>`,
  `<span style="flex:1"></span><button class="btn-text" data-act="pnMassAbbr">Abbrechen</button><button class="btn-text" data-act="pnMassOk">Übernehmen</button>`); void a; void b; }
function pnMenue(){ const p=pnVon(PN.id); if(!p) return; const darf=pnDarf(p);
  dialog(p.titel||"Plan",`<div class="list">
    ${darf?`<div class="li" role="button" tabindex="0" data-act="pnMassStart"><span class="av">${icon("pnMass")}</span><span class="lt"><span class="h">Maßstab ${p.mass?"neu festlegen":"festlegen"}</span><span class="s">Zwei Punkte einer bekannten Strecke antippen – dann Flächen und Leitungslängen</span></span>${icon("chev")}</div>`:""}
    ${p.seiten>1&&darf?`<div class="li" role="button" tabindex="0" data-act="pnSeite"><span class="av">${icon("doc")}</span><span class="lt"><span class="h">Seite ${p.seite||1} von ${p.seiten}</span><span class="s">Andere Seite des PDF zeigen</span></span>${icon("chev")}</div>`:""}
    <div class="li" role="button" tabindex="0" data-act="dateiOeffnen" data-id="${esc(p.dateiId)}"><span class="av">${icon("doc")}</span><span class="lt"><span class="h">Originaldatei</span><span class="s">Im Kundenordner unter „Pläne und Schaltpläne“</span></span>${icon("chev")}</div>
    <div class="li" role="switch" tabindex="0" data-act="pnZeigen" aria-checked="${PN.zeigen}"><span class="av">${icon("pnHand")}</span><span class="lt"><span class="h">Einträge zeigen</span><span class="s">Aus: nur der Plan, z. B. zum Vergleichen</span></span><span class="schalter${PN.zeigen?" an":""}" aria-hidden="true"><i></i></span></div></div>
    ${darf?`<div class="fg1" style="margin-top:14px">${tf("pnTitel","Bezeichnung",p.titel||"",{form:true})}</div>`:""}`,
    `${darf?`<button class="btn-text danger" data-act="pnWegAsk">Löschen</button>`:""}<span style="flex:1"></span><button class="btn-text" data-act="${darf?"pnTitelOk":"cancel"}">${darf?"Speichern":"Schließen"}</button>`); }

/* ---- Klicks ---- */
document.addEventListener("click",async e=>{ const b=e.target.closest&&e.target.closest('[data-act^="pn"]'); if(!b) return; const a=b.dataset.act; if(!/^pn[A-Z]/.test(a)) return;
  e.stopPropagation(); e.preventDefault(); const p=pnVon(PN.id), id=b.dataset.id;
  switch(a){
    case "pnNeu": pnNeuDlg(); return;
    case "pnArt": PN_NEU=Object.assign(PN_NEU||{},{art:b.dataset.v}); b.parentElement.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x===b))); if(typeof segInd==="function") segInd(); return;
    case "pnNeuDatei": { const F=formVals(); if(!(PN_NEU&&PN_NEU.eltern)&&!F.ecKunde){ toast("Bitte einen Kunden wählen"); return; } pnDateiWahl(f=>pnNeuAnlegen(f,F)); return; }
    case "pnAuf": pnOeffnen(id); return;
    case "pnAufZ": closeOverlays(); pnOeffnen(id,{v:"plan",id:PN.id}); return;
    case "pnAns": PN.ans=b.dataset.v; PN.sel=null; render(); return;
    case "pnWerk": PN.werk=b.dataset.v; PN.pts=null; PN.sel=null; PN.mass=null; render(); return;
    case "pnSymW": PN.sym=b.dataset.v; PN.h=pnSymDef(PN.sym)[3]; render(); return;
    case "pnHoehe": PN.h=b.dataset.v===""?null:b.dataset.v==="decke"?"decke":+b.dataset.v; render(); return;
    case "pnGw": PN.gw=b.dataset.v; render(); return;
    case "pnZoom": pnZoomUm(+b.dataset.v||1); return;
    case "pnFit": pnEinpassen(); pnTransform(); return;
    case "pnPtsWeg": PN.pts=null; render(); return;
    case "pnPtsOk": if(PN.werk==="raum"&&PN.pts&&PN.pts.length>2){ pnRaumNeu(PN.pts); return; } if(PN.werk==="leitung"&&PN.pts&&PN.pts.length>1){ pnEintrag({typ:"leitung",pts:PN.pts,gw:PN.gw}); render(); return; } PN.pts=null; render(); return;
    case "pnUndo": { let x=null; while(PN_UNDO.length&&!x){ const r=DB.planeintraege.get(PN_UNDO.pop()); if(r&&!r.deleted&&pnDarfE(r)) x=r; } if(!x){ toast("Nichts zum Rückgängigmachen"); return; } x.deleted=true; saveRec("planeintraege",x); pnSvg(); render(); toast("Rückgängig gemacht"); return; }
    case "pnMenue": pnMenue(); return;
    case "pnMassStart": closeOverlays(); PN.mass=[]; PN.werk="hand"; render(); return;
    case "pnMassAbbr": PN.mass=null; closeOverlays(); render(); return;
    case "pnMassOk": { const m=parseFloat(String(formVals().pnMm||"").replace(",",".")); if(!(m>0)){ toast("Bitte die Länge in Metern eingeben"); return; } if(!p||!pnDarf(p)) return;
      p.mass={a:PN.mass[0].map(v=>+v.toFixed(1)),b:PN.mass[1].map(v=>+v.toFixed(1)),m}; saveRec("plaene",p); PN.mass=null; closeOverlays(); render(); toast("Maßstab gespeichert – Flächen und Längen werden berechnet"); return; }
    case "pnRaumAbbr": PN.neuPoly=null; closeOverlays(); pnSvg(); return;
    case "pnRaumOk": { const n=String(formVals().pnRn||"").trim(); if(!n){ toast("Bitte einen Namen eingeben"); return; } if(!p||!PN.neuPoly) return;
      p.raeume=[...(p.raeume||[]),{id:uid(),name:n,poly:PN.neuPoly}]; PN.neuPoly=null; saveRec("plaene",p); closeOverlays(); PN.werk="raum"; render(); toast(`${n} angelegt`); return; }
    case "pnRaumAuf": PN.raumSel=id; pnSvg(); pnRaumDlg(id); return;
    case "pnRaumZu": PN.raumSel=null; closeOverlays(); pnSvg(); return;
    case "pnRaumSpeichern": { const r=p&&(p.raeume||[]).find(x=>x.id===id); if(!r) return; const F=formVals(); r.notiz=F.pnRnotiz||""; if(pnDarf(p)&&F.pnRname) r.name=F.pnRname; saveRec("plaene",p); PN.raumSel=null; closeOverlays(); render(); toast("Gespeichert"); return; }
    case "pnRaumWeg": if(!p||!pnDarf(p)) return; p.raeume=(p.raeume||[]).filter(x=>x.id!==id); saveRec("plaene",p); PN.raumSel=null; closeOverlays(); render(); toast("Raum entfernt – Einträge und Fotos bleiben"); return;
    case "pnFoto": { const r=p&&(p.raeume||[]).find(x=>x.id===id); if(!r) return; const [kind,bid]=pnOrtKind(p.ortId);
      pnDateiWahl(async f=>{ const d=await dateiNeu(kind,bid,f,Object.assign({planId:p.id,raumId:r.id},p.demo?{demo:true}:{})); if(d){ toast("Foto abgelegt"); pnRaumDlg(r.id); render(); } },"image/*"); return; }
    case "pnKindNeu": closeOverlays(); pnNeuDlg({eltern:{planId:PN.id,raumId:id}}); return;
    case "pnEAuf": { const x=DB.planeintraege.get(id); if(!x) return; PN.sel=id; if(x.x!=null){ const w=document.getElementById("pnWrap").getBoundingClientRect(); PN.z=Math.max(PN.z,1.2*w.width/(p.W||1000)*3); PN.tx=w.width/2-x.x*PN.z; PN.ty=w.height/2-x.y*PN.z; pnTransform(); } pnSvg(); pnEDlg(id); return; }
    case "pnEZu": { const x=DB.planeintraege.get(PN.sel||""); const F=formVals(); if(x&&x.typ==="text"&&F.pnEt!==undefined&&pnDarfE(x)&&F.pnEt!==x.text){ x.text=F.pnEt; saveRec("planeintraege",x); } PN.sel=null; closeOverlays(); pnSvg(); return; }
    case "pnEHoehe": { const x=DB.planeintraege.get(id); if(!x||!pnDarfE(x)) return; x.h=b.dataset.v===""?null:b.dataset.v==="decke"?"decke":+b.dataset.v; saveRec("planeintraege",x); b.parentElement.querySelectorAll("button").forEach(y=>y.setAttribute("aria-pressed",String(y===b))); pnSvg(); return; }
    case "pnEWeg": { const x=DB.planeintraege.get(id); if(!x||!pnDarfE(x)) return; x.deleted=true; saveRec("planeintraege",x); PN.sel=null; closeOverlays(); render(); toast("Eintrag gelöscht"); return; }
    case "pnUebernehmen": { const x=DB.planeintraege.get(id); if(!x||!ME.admin) return; x.erledigt={name:ME.name||"",mail:ME.mail||"",at:Date.now()}; saveRec("planeintraege",x); PN.sel=null; closeOverlays(); render(); toast("Übernommen"); return; }
    case "pnTextOk": { const t=String(formVals().pnTx||"").trim(); if(!t){ toast("Bitte einen Text eingeben"); return; } closeOverlays(); pnEintrag({typ:"text",x:+PN.textPt[0].toFixed(1),y:+PN.textPt[1].toFixed(1),text:t.slice(0,200),gw:PN.gw}); return; }
    case "pnZeigen": PN.zeigen=!PN.zeigen; b.setAttribute("aria-checked",String(PN.zeigen)); b.querySelector(".schalter")?.classList.toggle("an",PN.zeigen); PN.el?.classList.toggle("ohne",!PN.zeigen); return;
    case "pnSeite": { if(!p||!pnDarf(p)) return; p.seite=(p.seite||1)%(p.seiten||1)+1; try{ const [W,H]=await pnGroesse(p); p.W=+W.toFixed(1); p.H=+H.toFixed(1); }catch(x){} saveRec("plaene",p); PN.cv=null; PN.z=0; closeOverlays(); render(); return; }
    case "pnTitelOk": { const t=String(formVals().pnTitel||"").trim(); if(p&&t&&pnDarf(p)&&t!==p.titel){ p.titel=t; saveRec("plaene",p); } closeOverlays(); render(); return; }
    case "pnWegAsk": confirmDlg("Plan löschen?",`„${p&&p.titel||"Plan"}“ mit Räumen und Einträgen wird entfernt. Die Datei im Kundenordner bleibt.`,"Löschen","pnWeg"); return;
    case "pnWeg": { if(!p||!pnDarf(p)) return; p.deleted=true; saveRec("plaene",p); pnEintraege(p.id).forEach(x=>{ x.deleted=true; saveRec("planeintraege",x); }); closeOverlays(); PN.id=null; PN.el=null; go({v:"plaene"}); toast("Plan gelöscht"); return; }
  } },true);
document.addEventListener("change",e=>{ const el=e.target; if(el.id==="f_ecKunde"&&document.querySelector('#dlg [data-act="pnNeuDatei"]')){ const f=document.getElementById("ecOrtFeld"); if(f) f.innerHTML=ecOrtFeld(el.value); } });
addEventListener("resize",()=>{ if(nav&&nav.v==="plan"&&PN.cv){ /* Größe der Bühne geändert: Lage behalten */ pnTransform(); } });
