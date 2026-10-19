/* ===== Zeichnen (Notiz-Block „Zeichnung“) – v3, Aufbau wie GoodNotes =====
   Oben die Werkzeuge, darunter schwebend die Optionen des aktiven Werkzeugs, links schwebend Rückgängig/Wiederholen.
   Das Blatt liegt mittig und wächst beim Schreiben nach unten. Mit Apple Pencil: Stift zeichnet, Finger scrollt.
   Ohne Pencil: zwei Finger scrollen. Mausrad scrollt ebenfalls.
   Daten je Block: striche, h (Höhe bei Breite 1000), raster, rmm (Rastergröße mm), rs (Linienstärke 0–2), rf (grau/blau), papier.
   Objekte: stift {c,w,p,d?} · fueller {c,w,p,pr} · marker {c,w,p,o} · Formen {t,c,w,p:[x0,y0,x1,y1],d?,fill?}
            text {v:2,p:[x,y oben-links],s,fs,c,bw?,b?,i?,fam?,al?,bg?}
   Objekte werden nie verändert, sondern ersetzt – so bleiben die Rückgängig-Stände sauber. */
const ZFARBEN=["#1F1F22","#C8102E","#1565C0","#2E7D32","#EF6C00","#F9A825","#6A1B9A","#00838F","#6D4C41","#9E9E9E","#FFFFFF"];
const ZMARKER=["#FFEB3B","#C6FF00","#FF80AB","#80D8FF","#FFAB40","#EA80FC"];
const ZG_FS=[12,14,16,18,20,24,28,32,40,48,60,72,96];
const ZG_FAM={modern:["Modern",'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif'],klassisch:["Klassisch",'Georgia,"Times New Roman",serif'],hand:["Handschrift",'"Noteworthy","Bradley Hand","Segoe Print","Comic Sans MS",cursive'],tech:["Technisch",'ui-monospace,"SF Mono",Menlo,Consolas,monospace']};
const ZG_PAPIER={"":["Weiß","#FFFFFF"],creme:["Creme","#FBF6E6"],grau:["Grau","#EEF0F3"],dunkel:["Dunkel","#25272B"]};
const ZG_RASTER=[["","Leer"],["kaestchen","Kästchen"],["linien","Linien"],["punkte","Punkte"],["mm","Millimeter"],["iso","Isometrisch"]];
const ZG_RMM=[4,5,7,10];
const ZG_RS=["Hell","Mittel","Kräftig"];
const ZG_FORMEN=[["linie","Linie"],["pfeil","Pfeil"],["doppelpfeil","Doppelpfeil"],["rechteck","Rechteck"],["rund","Abgerundet"],["kreis","Kreis"],["dreieck","Dreieck"],["raute","Raute"]];
const ZG_STIL=[["","Durchgezogen"],["strich","Gestrichelt"],["punkt","Gepunktet"]];
const ZG_BG=[["","Ohne"],["farbe","Getönt"],["notiz","Notizzettel"]];
const ZG_GESCHLOSSEN=["rechteck","rund","kreis","dreieck","raute"];
const ZG_IST_FORM=k=>ZG_FORMEN.some(f=>f[0]===k);
const ZG_MM=1000/210;
const ZG_IC={
  lasso:'<path d="M7.5 15.5C4.5 14.3 3 12.4 3 10.3 3 6.8 7 4 12 4s9 2.8 9 6.3-4 6.2-9 6.2c-.9 0-1.8-.1-2.6-.2" stroke-dasharray="2.6 2.4"/><path d="M8.6 14.6c-1.6.8-2 2.4-1 3.4 1 1 3 .6 3.4-1"/><path d="M8 18.3l-1.3 2.4"/>',
  kugel:'<path d="M4 20l1.2-4.4L16.4 4.4a2.1 2.1 0 0 1 3 3L8.2 18.8z"/><path d="M14.5 6.3l3.2 3.2"/>',
  fueller:'<path d="M4 20l3.2-8.6L14 6l4 4-5.4 6.8z"/><path d="M4 20l5.6-5.6"/><circle cx="10.6" cy="13.4" r="1.2"/><path d="M14 6l2-2 4 4-2 2"/>',
  marker:'<path d="M7 13.5l7.5-9 4.5 4.5-9 7.5z"/><path d="M7 13.5l-2 2 3.5 3.5 2-2"/><path d="M4 21h9"/>',
  radierer:'<path d="M8.5 19.5h11"/><path d="M5.2 15.3l9.5-9.5a2 2 0 0 1 2.8 0l2.2 2.2a2 2 0 0 1 0 2.8L12 18.5H8.4z"/><path d="M9.8 10.7l5 5"/>',
  text:'<path d="M5 7V5h14v2"/><path d="M12 5v14"/><path d="M9 19h6"/>',
  linie:'<path d="M5 19L19 5"/>',
  pfeil:'<path d="M5 19L19 5"/><path d="M10 5h9v9"/>',
  doppelpfeil:'<path d="M5 19L19 5"/><path d="M11 5h8v8"/><path d="M13 19H5v-8"/>',
  rechteck:'<rect x="4" y="6" width="16" height="12" rx="1"/>',
  rund:'<rect x="4" y="6" width="16" height="12" rx="4.5"/>',
  kreis:'<circle cx="12" cy="12" r="8"/>',
  dreieck:'<path d="M12 4.5l8.5 15h-17z"/>',
  raute:'<path d="M12 3.5l8.5 8.5-8.5 8.5L3.5 12z"/>',
  undo:'<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  redo:'<path d="M15 14l5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
  zu:'<path d="M6 6l12 12M18 6L6 18"/>',
  leeren:'<path d="M4 7h16"/><path d="M6.5 7l1 12.2A2 2 0 0 0 9.5 21h5a2 2 0 0 0 2-1.8l1-12.2"/><path d="M9.5 7V4h5v3"/>',
  seite:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M5 9h14M5 15h14M12 3v18"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  minus:'<path d="M5 12h14"/>',
  fett:'<path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z"/>',
  kursiv:'<path d="M10 5h8M6 19h8M14 5l-4 14"/>',
  al_l:'<path d="M4 6h16M4 10h10M4 14h16M4 18h10"/>',
  al_m:'<path d="M4 6h16M7 10h10M4 14h16M7 18h10"/>',
  al_r:'<path d="M4 6h16M10 10h10M4 14h16M10 18h10"/>',
  fuellung:'<rect x="4" y="5" width="16" height="14" rx="2.5" fill="currentColor" fill-opacity=".28"/>',
  bg:'<rect x="3.5" y="5" width="17" height="14" rx="2.5" fill="currentColor" fill-opacity=".22"/><path d="M8 9.5h8M8 13.5h5"/>',
  stil:'<path d="M4 7h16"/><path d="M4 12h3.5M10.2 12h3.6M16.5 12H20"/><path d="M4 17h.01M8 17h.01M12 17h.01M16 17h.01M20 17h.01" stroke-width="2.6"/>',
  gerade:'<path d="M4 18L20 6"/><path d="M4 21h16" stroke-opacity=".4"/>',
  chev:'<path d="M7 10l5 5 5-5"/>',
  schere:'<circle cx="6" cy="7" r="2.6"/><circle cx="6" cy="17" r="2.6"/><path d="M8.3 8.5L20 17.5M8.3 15.5L20 6.5"/>',
  kopie:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  dupl:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M14 11v6M11 14h6"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  bild:'<rect x="3.5" y="5" width="17" height="14" rx="2.5"/><circle cx="9" cy="10" r="1.7"/><path d="M20.5 16.5l-5-5-8.5 7.5"/>',
  unter:'<path d="M7 4v7a5 5 0 0 0 10 0V4"/><path d="M5 20h14"/>',
  pinsel:'<path d="M14.5 4.5l5 5"/><path d="M20.4 3.6a2 2 0 0 0-2.8 0L9.5 11.7l2.8 2.8 8.1-8.1a2 2 0 0 0 0-2.8z"/><path d="M9.5 11.7c-2.4-.4-4.6 1.3-4.9 3.7-.2 1.8-.9 3.1-2.1 3.9 3.6 1.4 7.6.6 9.2-2.2.6-1 .8-1.9.6-2.6"/>',
  box:'<rect x="4.5" y="5.5" width="15" height="13" rx="1" stroke-dasharray="3 2.6"/>',
  hoch:'<rect x="6.5" y="3.5" width="11" height="17" rx="1.5"/>',
  quer:'<rect x="3.5" y="6.5" width="17" height="11" rx="1.5"/>'};
const zgIc=k=>`<svg class="zg-ic" viewBox="0 0 24 24" aria-hidden="true">${ZG_IC[k]||""}</svg>`;
const zgEsc=t=>String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const zgKontrast=c=>{ const n=parseInt(String(c).slice(1),16); if(isNaN(n)) return "#fff"; const r=n>>16&255, g=n>>8&255, b=n&255; return (r*299+g*587+b*114)/1000>150?"#1F1F22":"#FFFFFF"; };
const zgR=n=>Math.round(n*10)/10;

/* --- Einstellungen je Werkzeug (merkt sich das Gerät) --- */
const ZG_STD={wz:"stift",stift:{art:"kugel",c:"#1F1F22",ws:[2,4,7],wi:1,d:""},marker:{c:"#FFEB3B",ws:[14,24,36],wi:1,gerade:false},
  radierer:{modus:"strich",nurMarker:false,ws:[8,18,36],wi:1},text:{c:"#1F1F22",fs:28,fam:"modern",b:false,i:false,u:false,al:"l",bg:""},lasso:{art:"frei"},
  form:{art:"rechteck",c:"#1F1F22",ws:[2,4,8],wi:1,d:"",fill:false},seite:{raster:"kaestchen",rmm:5,rs:1,rf:"grau",papier:"",format:"hoch"}};
function zgCfgLaden(){ let c={}; try{ c=JSON.parse(localStorage.getItem("zg_cfg")||"{}")||{}; }catch(e){}
  const o={wz:["lasso","stift","marker","radierer","text","form"].includes(c.wz)?c.wz:ZG_STD.wz};
  for(const k of Object.keys(ZG_STD)) if(k!=="wz"){ const v=c[k]&&typeof c[k]==="object"?c[k]:{}; o[k]={...ZG_STD[k],...v};
    if(ZG_STD[k].ws){ if(!(Array.isArray(o[k].ws)&&o[k].ws.length===3&&o[k].ws.every(n=>n>0&&n<200))) o[k].ws=ZG_STD[k].ws.slice(); else o[k].ws=o[k].ws.slice(); if(!(o[k].wi>=0&&o[k].wi<=2)) o[k].wi=1; } }
  if(!ZG_IST_FORM(o.form.art)) o.form.art="rechteck";
  return o; }
function zgCfgSichern(){ try{ localStorage.setItem("zg_cfg",JSON.stringify(ZG.cfg)); }catch(e){} }
function zgEigene(){ try{ const a=JSON.parse(localStorage.getItem("zg_farben")||"[]"); return Array.isArray(a)?a.filter(c=>/^#[0-9a-f]{6}$/i.test(c)).map(c=>c.toUpperCase()).slice(-16):[]; }catch(e){ return []; } }
function zgEigeneSetzen(a){ try{ localStorage.setItem("zg_farben",JSON.stringify(a.slice(-16))); }catch(e){} }
let ZG_CLIP=null;

/* --- Text messen und umbrechen (gleich für Zeichenfläche und Vorschau) --- */
const zgMessCtx=(()=>{ try{ return document.createElement("canvas").getContext("2d"); }catch(e){ return null; } })();
const zgFam=s=>(ZG_FAM[s.fam]||ZG_FAM.modern)[1];
const zgFont=s=>`${s.i?"italic ":""}${s.b?700:500} ${s.fs||28}px ${zgFam(s)}`;
const zgLH=s=>(s.fs||28)*1.25;
const zgMassC=new Map();
function zgTextMass(s){ const key=zgFont(s)+"|"+(s.bw||0)+"|"+(s.s||""); let m=zgMassC.get(key); if(m) return m;
  const c=zgMessCtx, fs=s.fs||28, mw=t=>c?c.measureText(t).width:t.length*fs*.56; if(c) c.font=zgFont(s);
  const roh=String(s.s||"").split("\n"); let L=roh;
  if(s.bw){ L=[]; for(const z of roh){ let akt=""; for(const wort of z.split(/(\s+)/)){ const t=akt+wort;
        if(akt&&mw(t.trimEnd())>s.bw){ L.push(akt.trimEnd()); akt=wort.trimStart(); } else akt=t;
        while(mw(akt)>s.bw&&akt.length>1){ let n=akt.length; while(n>1&&mw(akt.slice(0,n))>s.bw) n--; L.push(akt.slice(0,n)); akt=akt.slice(n); } }
      L.push(akt); } }
  const lw=L.map(mw), w=s.bw||Math.max(fs*.6,...lw);
  m={L,lw,w,h:Math.max(1,L.length)*zgLH(s)}; if(zgMassC.size>800) zgMassC.clear(); zgMassC.set(key,m); return m; }
const zgAlX=(s,m,k)=>s.al==="m"?(m.w-m.lw[k])/2:s.al==="r"?m.w-m.lw[k]:0;

/* --- Geometrie --- */
function strichPfad(p){ if(p.length<4) return p.length?`M${p[0]} ${p[1]}l0.1 0`:"";
  let d=`M${p[0]} ${p[1]}`; for(let i=2;i<p.length-2;i+=2){ const mx=(p[i]+p[i+2])/2, my=(p[i+1]+p[i+3])/2; d+=`Q${p[i]} ${p[i+1]} ${zgR(mx)} ${zgR(my)}`; }
  return d+`L${p[p.length-2]} ${p[p.length-1]}`; }
/* Füller: Umriss mit wechselnder Breite (Druck des Pencil bzw. Tempo) als gefüllte Fläche */
function zgFuellerPfad(s){ const p=s.p, n=p.length/2, pr=s.pr||[]; if(!n) return "";
  const rad=i=>Math.max(.45,(s.w||4)/2*(.3+1.15*(pr[i]==null?.6:pr[i])));
  if(n<2){ const r=zgR(rad(0)); return `M${zgR(p[0]-r)} ${p[1]}a${r} ${r} 0 1 0 ${2*r} 0a${r} ${r} 0 1 0 ${-2*r} 0`; }
  const R=[]; for(let i=0;i<n;i++){ let a=0,k=0; for(let j=Math.max(0,i-2);j<=Math.min(n-1,i+2);j++){ a+=rad(j); k++; } R.push(a/k); }
  const Lp=[],Rp=[]; for(let i=0;i<n;i++){ const a=Math.max(0,i-1), b=Math.min(n-1,i+1); let dx=p[2*b]-p[2*a], dy=p[2*b+1]-p[2*a+1]; const l=Math.hypot(dx,dy)||1; dx/=l; dy/=l;
    Lp.push([p[2*i]-dy*R[i],p[2*i+1]+dx*R[i]]); Rp.push([p[2*i]+dy*R[i],p[2*i+1]-dx*R[i]]); }
  const kante=(E,erst)=>{ let d=(erst?"M":"L")+`${zgR(E[0][0])} ${zgR(E[0][1])}`; for(let i=1;i<E.length-1;i++) d+=`Q${zgR(E[i][0])} ${zgR(E[i][1])} ${zgR((E[i][0]+E[i+1][0])/2)} ${zgR((E[i][1]+E[i+1][1])/2)}`; const z=E[E.length-1]; return d+`L${zgR(z[0])} ${zgR(z[1])}`; };
  const re=Rp.slice().reverse(), rE=zgR(R[n-1]), rA=zgR(R[0]);
  return kante(Lp,true)+`A${rE} ${rE} 0 0 0 ${zgR(re[0][0])} ${zgR(re[0][1])}`+kante(re,false)+`A${rA} ${rA} 0 0 0 ${zgR(Lp[0][0])} ${zgR(Lp[0][1])}Z`; }
/* Formen: [Hauptpfad, Pfeilspitzen] – Spitzen werden nie gestrichelt */
function zgFormTeile(s){ const t=s.t||"stift", p=s.p||[];
  if(t==="stift"||t==="marker") return [strichPfad(p),""];
  if(t==="poly"){ let d=""; for(let i=0;i<p.length;i+=2) d+=(i?"L":"M")+p[i]+" "+p[i+1]; return [d+(s.zu?"Z":""),""]; }
  const [x0,y0,x1,y1]=p; if(x1==null) return ["",""];
  const spitze=(xa,ya,xb,yb)=>{ const a=Math.atan2(yb-ya,xb-xa), L=Math.max(16,(s.w||4)*3.4), k=.45; return `M${zgR(xb-L*Math.cos(a-k))} ${zgR(yb-L*Math.sin(a-k))}L${xb} ${yb}L${zgR(xb-L*Math.cos(a+k))} ${zgR(yb-L*Math.sin(a+k))}`; };
  if(t==="linie") return [`M${x0} ${y0}L${x1} ${y1}`,""];
  if(t==="pfeil") return [`M${x0} ${y0}L${x1} ${y1}`,spitze(x0,y0,x1,y1)];
  if(t==="doppelpfeil") return [`M${x0} ${y0}L${x1} ${y1}`,spitze(x0,y0,x1,y1)+spitze(x1,y1,x0,y0)];
  const xa=Math.min(x0,x1), xb=Math.max(x0,x1), ya=Math.min(y0,y1), yb=Math.max(y0,y1), mx=zgR((xa+xb)/2), my=zgR((ya+yb)/2);
  if(t==="rechteck") return [`M${xa} ${ya}H${xb}V${yb}H${xa}Z`,""];
  if(t==="rund"){ const r=zgR(Math.min(40,(xb-xa)*.22,(yb-ya)*.22)); return [`M${zgR(xa+r)} ${ya}H${zgR(xb-r)}A${r} ${r} 0 0 1 ${xb} ${zgR(ya+r)}V${zgR(yb-r)}A${r} ${r} 0 0 1 ${zgR(xb-r)} ${yb}H${zgR(xa+r)}A${r} ${r} 0 0 1 ${xa} ${zgR(yb-r)}V${zgR(ya+r)}A${r} ${r} 0 0 1 ${zgR(xa+r)} ${ya}Z`,""]; }
  if(t==="kreis"){ const rx=zgR(Math.max(.5,(xb-xa)/2)), ry=zgR(Math.max(.5,(yb-ya)/2)); return [`M${zgR(mx-rx)} ${my}a${rx} ${ry} 0 1 0 ${2*rx} 0a${rx} ${ry} 0 1 0 ${-2*rx} 0Z`,""]; }
  if(t==="dreieck") return [`M${mx} ${ya}L${xb} ${yb}L${xa} ${yb}Z`,""];
  if(t==="raute") return [`M${mx} ${ya}L${xb} ${my}L${mx} ${yb}L${xa} ${my}Z`,""];
  return ["",""]; }
/* Punkte entlang eines Objekts (Treffer, Radierer, Lasso) */
/* Drehung: Linien, Striche und Vielecke werden direkt gedreht (Punkte); Formen mit Rahmen, Text und Bilder merken sich den Winkel (rot) */
const ZG_PUNKTART=["stift","marker","fueller","linie","pfeil","doppelpfeil","poly"];
function zgDreh(P,cx,cy,r){ const co=Math.cos(r), si=Math.sin(r), o=new Array(P.length); for(let i=0;i<P.length;i+=2){ const dx=P[i]-cx, dy=P[i+1]-cy; o[i]=cx+dx*co-dy*si; o[i+1]=cy+dx*si+dy*co; } return o; }
const zgZentrum=s=>{ const [a,b,c,d]=zgBoxRoh(s); return [(a+c)/2,(b+d)/2]; };
function zgPunkte(s){ const P=zgPunkteRoh(s); if(!s.rot) return P; const [cx,cy]=zgZentrum(s); return zgDreh(P,cx,cy,s.rot); }
function zgPunkteRoh(s){ const t=s.t||"stift", p=s.p||[]; if(t==="stift"||t==="marker"||t==="fueller") return p;
  if(t==="text"||t==="bild"){ const [a,b,c,d]=zgBoxRoh(s); return [a,b,c,b,c,d,a,d,a,b,(a+c)/2,(b+d)/2]; }
  if(t==="poly"){ const o=[], n=p.length/2; for(let i=0;i<n-(s.zu?0:1);i++){ const j=(i+1)%n; for(let k=0;k<24;k++) o.push(p[2*i]+(p[2*j]-p[2*i])*k/24,p[2*i+1]+(p[2*j+1]-p[2*i+1])*k/24); } if(!s.zu) o.push(p[p.length-2],p[p.length-1]); else o.push(p[0],p[1]); return o; }
  const [x0,y0,x1,y1]=p, o=[], lin=(a,b,c,d)=>{ for(let i=0;i<=24;i++) o.push(a+(c-a)*i/24,b+(d-b)*i/24); };
  const xa=Math.min(x0,x1), xb=Math.max(x0,x1), ya=Math.min(y0,y1), yb=Math.max(y0,y1), mx=(xa+xb)/2, my=(ya+yb)/2;
  if(t==="linie"||t==="pfeil"||t==="doppelpfeil") lin(x0,y0,x1,y1);
  else if(t==="rechteck"||t==="rund"){ lin(xa,ya,xb,ya); lin(xb,ya,xb,yb); lin(xb,yb,xa,yb); lin(xa,yb,xa,ya); }
  else if(t==="kreis"){ const rx=(xb-xa)/2, ry=(yb-ya)/2; for(let i=0;i<=64;i++){ const a=i/64*Math.PI*2; o.push(mx+rx*Math.cos(a),my+ry*Math.sin(a)); } }
  else if(t==="dreieck"){ lin(mx,ya,xb,yb); lin(xb,yb,xa,yb); lin(xa,yb,mx,ya); }
  else if(t==="raute"){ lin(mx,ya,xb,my); lin(xb,my,mx,yb); lin(mx,yb,xa,my); lin(xa,my,mx,ya); }
  return o; }
/* Pfad- und Rahmen-Speicher je Objekt (Objekte werden ersetzt, nie verändert) */
const zgPC=new WeakMap();
function zgCache(s){ let c=zgPC.get(s); if(c&&c.p===s.p&&c.n===s.p.length&&c.w===s.w) return c;
  const t=s.t==="fueller"?[zgFuellerPfad(s),""]:(s.t==="text"||s.t==="bild")?["",""]:zgFormTeile(s); c={p:s.p,n:s.p.length,w:s.w,d:t[0],k:t[1],P:null,K:null,box:null,boxD:null,rot:null}; zgPC.set(s,c); return c; }
const zgP2=s=>{ const c=zgCache(s); if(!c.P) c.P=new Path2D(c.d||"M0 0"); return c.P; };
const zgK2=s=>{ const c=zgCache(s); if(!c.k) return null; if(!c.K) c.K=new Path2D(c.k); return c.K; };
function zgBox(s){ if(!s.rot) return zgBoxRoh(s); const c=zgCache(s); if(c.boxD&&c.rot===s.rot) return c.boxD;
  const [a,b,cc,d]=zgBoxRoh(s), E=zgDreh([a,b,cc,b,cc,d,a,d],(a+cc)/2,(b+d)/2,s.rot), xs=[E[0],E[2],E[4],E[6]], ys=[E[1],E[3],E[5],E[7]];
  c.boxD=[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)]; c.rot=s.rot; return c.boxD; }
function zgBoxRoh(s){ if(s.t==="text"){ const m=zgTextMass(s), px=s.bg?8:0, py=s.bg?5:0; return [s.p[0]-px,s.p[1]-py,s.p[0]+m.w+px,s.p[1]+m.h+py]; }
  if(s.t==="bild"){ const [x0,y0,x1,y1]=s.p; return [Math.min(x0,x1),Math.min(y0,y1),Math.max(x0,x1),Math.max(y0,y1)]; }
  const c=zgCache(s); if(c.box) return c.box; const P=zgPunkteRoh(s), w=(s.w||4)/2+(s.t==="pfeil"||s.t==="doppelpfeil"?Math.max(16,(s.w||4)*3.4)*.5:0);
  let a=Infinity,b=Infinity,cc=-Infinity,d=-Infinity; for(let i=0;i<P.length;i+=2){ a=Math.min(a,P[i]); cc=Math.max(cc,P[i]); b=Math.min(b,P[i+1]); d=Math.max(d,P[i+1]); }
  c.box=[a-w,b-w,cc+w,d+w]; return c.box; }
/* Texte aus der ersten Fassung (Grundlinie statt oben-links) umrechnen */
function zgNorm(s){ if(s.t==="text"&&s.v!==2) return {...s,v:2,p:[s.p[0],s.p[1]-(s.fs||32)*.95]}; return s; }
function zBox(b){ let y0=Infinity,y1=-Infinity; for(const s of (b.striche||[])){ const [,t,,u]=zgBox(zgNorm(s)); y0=Math.min(y0,t); y1=Math.max(y1,u); }
  if(!isFinite(y0)) return [0,Math.min(b.h||600,600)]; y0=Math.max(0,y0-40); y1=y1+40; if(y1-y0<240){ const m=(y0+y1)/2; y0=Math.max(0,m-120); y1=y0+240; }
  return [Math.round(y0),Math.round(y1-y0)]; }
const zgDash=s=>s.d==="strich"?[s.w*3,s.w*2.2]:s.d==="punkt"?[0.01,s.w*2.2]:[];

/* --- Raster: gleiche Linien für Zeichenfläche und Vorschau --- */
function zgRasterTeile(r,y0,y1,xa=0,xb=1000){ const t=r.raster; if(!t) return null;
  const g=r.rmm?r.rmm*ZG_MM:40, dunkel=r.papier==="dunkel", rs=r.rs==null?1:r.rs;
  const farbe=r.rf==="blau"?(dunkel?"#5A7AA8":rs===2?"#7FA3D6":"#A3C0E6"):(dunkel?"#5A5E66":rs===2?"#A9B0BA":"#C7CCD4");
  const wm=[.85,1.15,1.7][rs]||1.15, am=[.55,.85,1][rs]||.85;
  let fein="",mittel="",stark="",punkte=""; const H=y=>`M${xa} ${zgR(y)}H${xb}`, V=x=>`M${zgR(x)} ${zgR(y0)}V${zgR(y1)}`, ab=(a,s)=>Math.ceil(a/s)*s;
  if(t==="kaestchen"||t==="linien"){ for(let y=Math.max(g,ab(y0,g));y<=y1;y+=g) mittel+=H(y); if(t==="kaestchen") for(let x=ab(xa,g);x<=xb;x+=g) if(x) mittel+=V(x); }
  else if(t==="punkte"){ const rad=zgR(1.3+wm); for(let y=Math.floor(y0/g)*g+g/2;y<=y1;y+=g) if(y>0) for(let x=Math.floor(xa/g)*g+g/2;x<xb;x+=g) punkte+=`M${zgR(x-rad)} ${zgR(y)}a${rad} ${rad} 0 1 0 ${2*rad} 0a${rad} ${rad} 0 1 0 ${-2*rad} 0`; }
  else if(t==="mm"){ for(let k=Math.max(1,Math.ceil(y0/ZG_MM));k*ZG_MM<=y1;k++){ const l=H(k*ZG_MM); if(k%10===0) stark+=l; else if(k%5===0) mittel+=l; else fein+=l; }
    for(let k=Math.ceil(xa/ZG_MM);k*ZG_MM<=xb;k++){ if(!k) continue; const l=V(k*ZG_MM), a=Math.abs(k); if(a%10===0) stark+=l; else if(a%5===0) mittel+=l; else fein+=l; } }
  else if(t==="iso"){ const dx=g*Math.sqrt(3)/2, s=1/Math.sqrt(3); for(let x=ab(xa,dx);x<=xb;x+=dx) if(Math.abs(x)>.01) mittel+=V(x);
    for(let c=Math.floor((y0-xb*s)/g)*g;c<=y1-xa*s+g;c+=g) mittel+=`M${xa} ${zgR(c+xa*s)}L${xb} ${zgR(c+xb*s)}`;
    for(let c=Math.floor((y0+xa*s)/g)*g;c<=y1+xb*s+g;c+=g) mittel+=`M${xa} ${zgR(c-xa*s)}L${xb} ${zgR(c-xb*s)}`; }
  return {farbe,teile:[{d:fein,w:.6*wm,a:.5*am},{d:mittel,w:1*wm,a:am},{d:stark,w:1.5*wm,a:Math.min(1,am*1.15)},{d:punkte,f:1,a:am}].filter(x=>x.d)}; }
function zgRasterSvg(b,y0,y1,o){ o=o||{}; const r=zgRasterTeile(b,y0,y1,o.xa==null?-2000:o.xa,o.xb==null?3000:o.xb); if(!r) return ""; const ns=o.fein?` vector-effect="non-scaling-stroke"`:"";
  return r.teile.map(x=>x.f?`<path d="${x.d}" fill="${r.farbe}" fill-opacity="${zgR(x.a)}"/>`:`<path d="${x.d}" fill="none" stroke="${r.farbe}" stroke-width="${o.fein?zgR(x.w*.9):zgR(x.w)}" stroke-opacity="${zgR(x.a)}"${ns}/>`).join(""); }

/* --- Vorschau (SVG) --- */
function zgSvgEl(s,dunkel){ s=zgNorm(s); const inn=zgSvgElRoh(s,dunkel); if(!s.rot) return inn; const [cx,cy]=zgZentrum(s); return `<g transform="rotate(${zgR(s.rot*180/Math.PI)} ${zgR(cx)} ${zgR(cy)})">${inn}</g>`; }
function zgSvgElRoh(s,dunkel){
  if(s.t==="bild"){ const [a,b,c,d]=zgBoxRoh(s), src=typeof fotoCache!=="undefined"&&fotoCache.get(s.foto); return src?`<image href="${src}" x="${zgR(a)}" y="${zgR(b)}" width="${zgR(c-a)}" height="${zgR(d-b)}" preserveAspectRatio="none"/>`:`<rect x="${zgR(a)}" y="${zgR(b)}" width="${zgR(c-a)}" height="${zgR(d-b)}" fill="#E3E5E9"/>`; }
  if(s.t==="text"){ const m=zgTextMass(s), lh=zgLH(s), fs=s.fs||28; let bg="";
    if(s.bg){ const [a,b,c,d]=zgBoxRoh(s); bg=`<rect x="${zgR(a)}" y="${zgR(b)}" width="${zgR(c-a)}" height="${zgR(d-b)}" rx="8" fill="${s.bg==="notiz"?"#FFF1A8":s.c}"${s.bg==="notiz"?"":` fill-opacity=".14"`}/>`; }
    return bg+`<text fill="${s.c}" font-size="${fs}" font-weight="${s.b?700:500}"${s.i?` font-style="italic"`:""} font-family="${zgEsc(zgFam(s))}">${m.L.map((z,i)=>`<tspan x="${zgR(s.p[0]+zgAlX(s,m,i))}" y="${zgR(s.p[1]+i*lh+fs*.95)}">${zgEsc(z)||" "}</tspan>`).join("")}</text>`
      +(s.u?m.L.map((z,i)=>m.lw[i]?`<rect x="${zgR(s.p[0]+zgAlX(s,m,i))}" y="${zgR(s.p[1]+i*lh+fs*1.07)}" width="${zgR(m.lw[i])}" height="${zgR(Math.max(1,fs*.065))}" fill="${s.c}"/>`:"").join(""):""); }
  const c=zgCache(s);
  if(s.t==="fueller") return `<path d="${c.d}" fill="${s.c}"/>`;
  const da=s.d?` stroke-dasharray="${zgDash(s).map(zgR).join(" ")}"`:"", mul=s.t==="marker"&&!dunkel?` style="mix-blend-mode:multiply"`:"";
  return `<path d="${c.d}" stroke="${s.c}" stroke-width="${s.w}" fill="${zgGefuellt(s)?s.c:"none"}"${zgGefuellt(s)?` fill-opacity=".18"`:""} stroke-linecap="round" stroke-linejoin="round"${s.o?` stroke-opacity="${s.o}"`:""}${da}${mul}/>`+(c.k?`<path d="${c.k}" stroke="${s.c}" stroke-width="${s.w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`:""); }
/* Vorschau: Papier und Raster laufen seitlich weiter, damit bei schmalen Ausschnitten kein Rand entsteht */
const zgPapierFarbe=b=>(ZG_PAPIER[b.papier]||ZG_PAPIER[""])[1];
const zeichnungSvg=b=>{ const [y0,h]=zBox(b), pap=zgPapierFarbe(b);
  return `<svg class="n-svg" viewBox="0 ${y0} 1000 ${h}" preserveAspectRatio="xMidYMid meet" style="overflow:visible"><rect x="-2000" y="${y0}" width="5000" height="${h}" fill="${pap}"/>${zgRasterSvg(b,y0,y0+h)}${(b.striche||[]).map(s=>zgSvgEl(s,b.papier==="dunkel")).join("")}</svg>`; };

/* ===== Editor ===== */
let ZG=null;
const ZG_MALT=["stift","marker","radierer","form"];
const zgWzIc=c=>({lasso:"lasso",stift:c.stift.art==="fueller"?"fueller":"kugel",marker:"marker",radierer:"radierer",text:"text",form:c.form.art});
function zeichnenOeffnen(b){
  const cfg=zgCfgLaden(), neu=!(b.striche||[]).length&&b.raster==null&&!b.papier;
  const seite=neu?{...cfg.seite}:{raster:b.raster||"",rmm:b.rmm,rs:b.rs==null?1:b.rs,rf:b.rf||"grau",papier:b.papier||"",format:b.format||"hoch"};
  const ic=zgWzIc(cfg), wz=(k,l)=>`<button class="zg-b" data-z="wz" data-v="${k}" aria-pressed="${k===cfg.wz}" aria-label="${l}" title="${l}">${zgIc(ic[k])}</button>`;
  const ov=document.createElement("div"); ov.className="zg"; ov.id="zg";
  ov.innerHTML=`<div class="zg-bar">
      <button class="zg-b" data-z="abbr" aria-label="Abbrechen" title="Abbrechen">${zgIc("zu")}</button>
      <div class="zg-werkz" role="toolbar" aria-label="Werkzeuge">${wz("lasso","Lasso – auswählen, verschieben, vergrößern")}${wz("stift","Stift")}${wz("marker","Textmarker")}${wz("radierer","Radierer")}${wz("text","Text")}${wz("form","Formen")}<button class="zg-b" data-z="bild" aria-label="Bild einfügen" title="Bild einfügen">${zgIc("bild")}</button></div>
      <div class="zg-rechts"><button class="zg-b" data-z="seite" aria-label="Papier und Vorlage" title="Papier und Vorlage">${zgIc("pinsel")}</button><button class="zg-ok" data-z="ok">Fertig</button></div></div>
    <div class="zg-flaeche"><canvas></canvas>
      <div class="zg-undo"><button class="zg-b" data-z="undo" aria-label="Rückgängig" title="Rückgängig">${zgIc("undo")}</button><button class="zg-b" data-z="redo" aria-label="Wiederholen" title="Wiederholen">${zgIc("redo")}</button></div><button class="zg-chip zg-zoom" data-z="zoom1" title="Zurück auf 100 %" hidden>100 %</button>
      <div class="zg-opt" id="zgOpt"></div></div>
    <div class="zg-sel" id="zgSel" hidden></div>
    <div class="zg-pop" id="zgPop" hidden></div>
    <input type="color" id="zgFarbWahl" class="zg-farbwahl" tabindex="-1" aria-hidden="true">
    <input type="file" id="zgBildWahl" accept="image/*" hidden>`;
  document.body.appendChild(ov); document.body.classList.add("zg-offen");
  const fl=ov.querySelector(".zg-flaeche"), cv=fl.querySelector("canvas");
  ZG={b,ov,fl,cv,ctx:cv.getContext("2d"),cfg,seite,seiteAend:false,h:Math.max(b.h||0,seite.format==="quer"?707:1414),striche:(b.striche||[]).map(zgNorm),hist:[],redo:[],
    sy:0,sx:0,z:1,sk0:0,zoomZeit:0,sel:[],akt:null,lasso:null,zug:null,rad:null,edit:null,ta:null,extra:0,stift:false,penDown:false,pid:null,tz:new Map(),pz:new Map(),pan:null,mom:0,scrollZeit:0,tapAlt:null,start:null,textTap:null};
  zgOptBauen(); zgLayout();
  cv.addEventListener("pointerdown",zgDown); cv.addEventListener("pointermove",zgMove); cv.addEventListener("pointerup",zgUp); cv.addEventListener("pointercancel",zgUp);
  cv.addEventListener("wheel",e=>{ e.preventDefault(); zgMomentStop();
    if(e.ctrlKey){ const r=ZG.cv.getBoundingClientRect(); zgZoomBei(e.clientX-r.left,e.clientY-r.top,ZG.z*Math.exp(-e.deltaY*.01)); }
    else zgScrollen(ZG.sy+e.deltaY,false,ZG.sx+e.deltaX); },{passive:false});
  cv.addEventListener("click",()=>{ if(ZG&&ZG.ta&&document.activeElement!==ZG.ta) ZG.ta.focus({preventScroll:true}); });
  ov.addEventListener("click",zgKlick); ov.addEventListener("input",zgEingabe);
  ["#zgOpt","#zgPop","#zgSel",".zg-undo",".zg-zoom"].forEach(s=>ov.querySelector(s).addEventListener("mousedown",e=>{ if(!e.target.closest("input")) e.preventDefault(); }));
  ov.querySelector("#zgFarbWahl").addEventListener("change",zgFarbeNeu);
  ov.querySelector("#zgBildWahl").addEventListener("change",zgBildNeu);
  ov.addEventListener("pointerdown",zgFarbDruck,true); ["pointerup","pointercancel","pointerleave"].forEach(t=>ov.addEventListener(t,()=>clearTimeout(zgFarbDruck.t),true));
  ZG.ro=window.ResizeObserver?new ResizeObserver(()=>{ if(ZG) zgLayout(); }):null; if(ZG.ro) ZG.ro.observe(fl); else addEventListener("resize",zgLayout);
  ZG.taste=zgTaste; document.addEventListener("keydown",ZG.taste);
  if(window.visualViewport){ ZG.vvF=()=>{ if(ZG&&ZG.ta) setTimeout(zgSichtbar,60); }; visualViewport.addEventListener("resize",ZG.vvF); }
}
/* Ansicht: z = Zoom (1 = Blattbreite), sx/sy = Verschiebung in Bildschirmpunkten; sk = Bildschirmpunkte je Blatteinheit, px = linker Blattrand */
function zgLayout(){ if(!ZG) return; const r=ZG.fl.getBoundingClientRect(), dpr=window.devicePixelRatio||1, ay=ZG.sk?ZG.sy/ZG.sk:0, ax=ZG.sk?ZG.sx/ZG.sk:0;
  if(!r.width||!r.height) return;
  ZG.vw=r.width; ZG.vh=r.height; ZG.dpr=dpr; ZG.sk0=Math.min(r.width-32,ZG.seite.format==="quer"?1240:880)/1000; ZG.top=r.width<700?122:76;
  ZG.cv.width=Math.round(r.width*dpr); ZG.cv.height=Math.round(r.height*dpr);
  zgGeom(); zgScrollen(ay*ZG.sk,true,ax*ZG.sk); }
function zgGeom(){ ZG.sk=ZG.sk0*ZG.z; const W=1000*ZG.sk, frei=ZG.vw-32; ZG.pw=W;
  if(W<=frei){ ZG.sx=0; ZG.px=Math.round((ZG.vw-W)/2); } else { ZG.sx=Math.max(0,Math.min(W-frei,ZG.sx)); ZG.px=16-ZG.sx; } }
const zgMaxSy=()=>Math.max(0,ZG.top+ZG.h*ZG.sk+48-ZG.vh)+(ZG.edit?ZG.extra:0);
const zgMaxSx=()=>Math.max(0,1000*ZG.sk-(ZG.vw-32));
/* Zoomen, sodass der Blattpunkt unter (cx,cy) dort bleibt */
function zgZoomBei(cx,cy,z){ const P=[(cx-ZG.px)/ZG.sk,(cy-ZG.top+ZG.sy)/ZG.sk]; ZG.z=Math.max(.5,Math.min(6,z)); if(Math.abs(ZG.z-1)<.03) ZG.z=1; ZG.sk=ZG.sk0*ZG.z; ZG.zoomZeit=Date.now();
  zgScrollen(ZG.top-(cy-P[1]*ZG.sk),false,16-(cx-P[0]*ZG.sk)); }
function zgScrollen(y,still,x){ if(!ZG) return; if(x!=null) ZG.sx=x; zgGeom(); ZG.sy=Math.max(0,Math.min(zgMaxSy(),y)); if(!still) ZG.scrollZeit=Date.now(); zgMalen();
  clearTimeout(zgScrollen.t); if(!still) zgScrollen.t=setTimeout(()=>{ if(ZG) zgMalen(); },900); }
function zgPunkt(ev){ const r=ZG.cv.getBoundingClientRect(); return [zgR((ev.clientX-r.left-ZG.px)/ZG.sk),zgR((ev.clientY-r.top-ZG.top+ZG.sy)/ZG.sk)]; }
const zgPapier=()=>(ZG_PAPIER[ZG.seite.papier]||ZG_PAPIER[""])[1];

/* --- Malen --- */
function zgMalen(){ if(!ZG||!ZG.sk) return; const {ctx,dpr,sk,px,pw}=ZG, oy=ZG.top-ZG.sy, ph=ZG.h*sk;
  ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,ZG.vw,ZG.vh);
  ctx.save(); ctx.shadowColor="rgba(0,0,0,.22)"; ctx.shadowBlur=16; ctx.shadowOffsetY=2; ctx.fillStyle=zgPapier(); ctx.fillRect(px,oy,pw,ph); ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.rect(px,oy,pw,ph); ctx.clip(); ctx.translate(px,oy); ctx.scale(sk,sk);
  const y0=Math.max(0,(ZG.sy-ZG.top)/sk), y1=Math.min(ZG.h,(ZG.sy-ZG.top+ZG.vh)/sk);
  const r=zgRasterTeile(ZG.seite,y0,y1); if(r){ for(const t of r.teile){ ctx.globalAlpha=t.a; if(t.f){ ctx.fillStyle=r.farbe; ctx.fill(new Path2D(t.d)); } else { ctx.strokeStyle=r.farbe; ctx.lineWidth=t.w/Math.max(1,ZG.z); ctx.stroke(new Path2D(t.d)); } } ctx.globalAlpha=1; }
  const dunkel=ZG.seite.papier==="dunkel", ed=ZG.edit?ZG.edit.i:null;
  ZG.striche.forEach((s,i)=>{ if(i===ed) return; const b=zgBox(s); if(b[3]<y0-30||b[1]>y1+30) return; zgZeichne(ctx,s,dunkel); });
  if(ZG.akt) zgZeichne(ctx,ZG.akt,dunkel);
  if(ZG.lasso&&ZG.lasso.length>2){ ctx.save(); ctx.strokeStyle=ZG_BLAU; ctx.lineWidth=1.6/sk; ctx.setLineDash([5/sk,4/sk]); ctx.fillStyle="rgba(211,18,47,.05)"; const L=ZG.lasso, p=new Path2D(ZG.lassoBox?`M${L[0]} ${L[1]}L${L[2]} ${L[3]}L${L[4]} ${L[5]}L${L[6]} ${L[7]}Z`:strichPfad(L)+"Z"); ctx.fill(p); ctx.stroke(p); ctx.restore(); }
  if(ZG.rad&&ZG.rad.pos){ const [x,y]=ZG.rad.pos; ctx.save(); ctx.strokeStyle="rgba(0,0,0,.45)"; ctx.fillStyle="rgba(255,255,255,.35)"; ctx.lineWidth=1.2/sk; ctx.beginPath(); ctx.arc(x,y,zgRadR(),0,Math.PI*2); ctx.fill(); ctx.stroke(); ctx.restore(); }
  ctx.restore();
  ctx.save(); ctx.translate(px,oy); ctx.scale(sk,sk); zgAuswahlRahmen(ctx); ctx.restore();
  if(Date.now()-ZG.scrollZeit<800&&zgMaxSy()>0){ const ges=ZG.top+ZG.h*sk+48, l=Math.max(40,ZG.vh*ZG.vh/ges), y=(ZG.vh-l)*(ZG.sy/Math.max(1,zgMaxSy()));
    ctx.fillStyle="rgba(120,120,128,.55)"; ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(ZG.vw-7,y+2,4,l-4,2); else ctx.rect(ZG.vw-7,y+2,4,l-4); ctx.fill(); }
  if(Date.now()-ZG.scrollZeit<800&&zgMaxSx()>0){ const ges=1000*sk+32, l=Math.max(40,ZG.vw*ZG.vw/ges), x=(ZG.vw-l)*(ZG.sx/Math.max(1,zgMaxSx()));
    ctx.fillStyle="rgba(120,120,128,.55)"; ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(x+2,ZG.vh-7,l-4,4,2); else ctx.rect(x+2,ZG.vh-7,l-4,4); ctx.fill(); }
  const zc=ZG.ov.querySelector(".zg-zoom"); if(zc){ const t=Math.round(ZG.z*100)+" %", aus=ZG.z===1; if(zc.hidden!==aus) zc.hidden=aus; if(zc.textContent!==t) zc.textContent=t; }
  zgSelLeiste(); zgTextPos();
  const u=ZG.ov.querySelector('[data-z="undo"]'), rd=ZG.ov.querySelector('[data-z="redo"]'); if(u) u.disabled=!ZG.hist.length; if(rd) rd.disabled=!ZG.redo.length; }
const zgBilder=new Map();
function zgBildEl(id){ let im=zgBilder.get(id); if(!im){ const src=typeof fotoCache!=="undefined"&&fotoCache.get(id); if(!src) return null; im=new Image(); im.onload=()=>{ if(ZG) zgMalen(); }; im.src=src; zgBilder.set(id,im); } return im.complete&&im.naturalWidth?im:null; }
function zgZeichne(ctx,s,dunkel){ ctx.save();
  if(s.rot){ const [cx,cy]=zgZentrum(s); ctx.translate(cx,cy); ctx.rotate(s.rot); ctx.translate(-cx,-cy); }
  if(s.t==="bild"){ const [a,b,c,d]=zgBoxRoh(s), im=zgBildEl(s.foto); if(im) ctx.drawImage(im,a,b,c-a,d-b); else { ctx.fillStyle="#E3E5E9"; ctx.fillRect(a,b,c-a,d-b); } }
  else if(s.t==="text"){ const m=zgTextMass(s), lh=zgLH(s), fs=s.fs||28;
    if(s.bg){ const [a,b,c,d]=zgBoxRoh(s); ctx.fillStyle=s.bg==="notiz"?"#FFF1A8":s.c; ctx.globalAlpha=s.bg==="notiz"?1:.14; ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(a,b,c-a,d-b,8); else ctx.rect(a,b,c-a,d-b); ctx.fill(); ctx.globalAlpha=1; }
    ctx.fillStyle=s.c; ctx.font=zgFont(s); ctx.textBaseline="alphabetic"; m.L.forEach((z,i)=>{ const x=s.p[0]+zgAlX(s,m,i), y=s.p[1]+i*lh+fs*.95; ctx.fillText(z,x,y); if(s.u&&m.lw[i]) ctx.fillRect(x,y+fs*.12,m.lw[i],Math.max(1,fs*.065)); }); }
  else if(s.t==="fueller"){ ctx.fillStyle=s.c; ctx.fill(zgP2(s)); }
  else { if(s.t==="marker"&&!dunkel) ctx.globalCompositeOperation="multiply"; ctx.globalAlpha=s.o||1;
    if(zgGefuellt(s)){ ctx.save(); ctx.globalAlpha=.18; ctx.fillStyle=s.c; ctx.fill(zgP2(s)); ctx.restore(); }
    ctx.strokeStyle=s.c; ctx.lineWidth=s.w; ctx.lineCap="round"; ctx.lineJoin="round"; if(s.d) ctx.setLineDash(zgDash(s)); ctx.stroke(zgP2(s));
    const k=zgK2(s); if(k){ ctx.setLineDash([]); ctx.stroke(k); } }
  ctx.restore(); }
function zgSnap(){ ZG.hist.push(ZG.striche.slice()); if(ZG.hist.length>200) ZG.hist.shift(); ZG.redo=[]; }
function zgWachsen(unten){ if(unten>ZG.h-350) ZG.h=Math.ceil((unten+700)/100)*100; }

/* --- Treffer, Lasso, Auswahl --- */
const zgSchliessbar=s=>ZG_GESCHLOSSEN.includes(s.t)||(s.t==="poly"&&!!s.zu);
const zgGefuellt=s=>!!s.fill&&zgSchliessbar(s);
const ZG_LINIENART=["linie","pfeil","doppelpfeil","poly"];
function zgToleranz(ev){ return ((ev&&ev.pointerType==="pen")?8:16)/ZG.sk; }
function zgTrifft(s,x,y,tol){ if(s.t==="text"||s.t==="bild"||zgGefuellt(s)){ if(s.rot){ const [cx,cy]=zgZentrum(s); [x,y]=zgDreh([x,y],cx,cy,-s.rot); } const [a,b,c,d]=zgBoxRoh(s); return x>=a-tol&&x<=c+tol&&y>=b-tol&&y<=d+tol; }
  const P=zgPunkte(s), w=(s.w||4)/2+tol; for(let k=0;k<P.length;k+=2) if(Math.hypot(P[k]-x,P[k+1]-y)<w) return true;
  for(let k=2;k<P.length;k+=2){ const ax=P[k-2],ay=P[k-1],bx=P[k],by=P[k+1], l=(bx-ax)**2+(by-ay)**2; if(!l) continue; const u=Math.max(0,Math.min(1,((x-ax)*(bx-ax)+(y-ay)*(by-ay))/l)); if(Math.hypot(ax+u*(bx-ax)-x,ay+u*(by-ay)-y)<w) return true; }
  return false; }
function zgTreffer(x,y,tol){ for(let i=ZG.striche.length-1;i>=0;i--){ const s=ZG.striche[i], [a,b,c,d]=zgBox(s); if(x<a-tol||x>c+tol||y<b-tol||y>d+tol) continue; if(zgTrifft(s,x,y,tol)) return i; } return null; }
function zgInnen(P,x,y){ let inn=false; for(let i=0,j=P.length-2;i<P.length;j=i,i+=2){ const xi=P[i],yi=P[i+1],xj=P[j],yj=P[j+1]; if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi) inn=!inn; } return inn; }
function zgLassoWahl(L){ const out=[]; ZG.striche.forEach((s,i)=>{ if(s.t==="text"){ const [a,b,c,d]=zgBox(s); if(zgInnen(L,(a+c)/2,(b+d)/2)) out.push(i); return; }
    const P=zgPunkte(s); let n=0,k=0; for(let j=0;j<P.length;j+=2){ n++; if(zgInnen(L,P[j],P[j+1])) k++; } if(n&&k/n>=.6) out.push(i); }); return out; }
function zgSelBox(){ let a=Infinity,b=Infinity,c=-Infinity,d=-Infinity; for(const i of ZG.sel){ const s=ZG.striche[i]; if(!s) continue; const x=zgBox(s); a=Math.min(a,x[0]); b=Math.min(b,x[1]); c=Math.max(c,x[2]); d=Math.max(d,x[3]); }
  return isFinite(a)?[a,b,c,d]:null; }
const zgPad=()=>10/ZG.sk;
/* Auswahl wie GoodNotes (in Irrgang-Rot): dünner Rahmen, runde Eckgriffe, kleine Punkte an den Seiten, Drehgriff als Kreis mit Pfeil.
   Der Rahmen dreht sich bei einem einzelnen gedrehten Objekt mit; der Drehgriff wandert beim Drehen um die Auswahl herum. */
const ZG_BLAU="#D3122F"; /* Auswahlfarbe: Irrgang-Rot */
function zgRahmen(){ const eins=ZG.sel.length===1?ZG.striche[ZG.sel[0]]:null;
  if(eins&&eins.rot&&!ZG_PUNKTART.includes(eins.t)){ const [a,b,c,d]=zgBoxRoh(eins); return {lok:true,a,b,c,d,cx:(a+c)/2,cy:(b+d)/2,rot:eins.rot}; }
  const B=zgSelBox(); if(!B) return null; const [a,b,c,d]=B; return {lok:false,a,b,c,d,cx:(a+c)/2,cy:(b+d)/2,rot:0}; }
function zgGriffe(){ if(!ZG.sel.length) return null; const key=ZG.sel.join(","); if(ZG.selKey!==key){ ZG.selKey=key; ZG.selDreh=0; }
  const F=zgRahmen(); if(!F) return null; const p=zgPad(), aus=12/ZG.sk, eins=ZG.sel.length===1?ZG.striche[ZG.sel[0]]:null, out={f:F,box:zgSelBox(),punkte:false,g:[]};
  const W=(x,y)=>F.rot?zgDreh([x,y],F.cx,F.cy,F.rot):[x,y];
  if(eins&&ZG_LINIENART.includes(eins.t)){ out.punkte=true; for(let k=0;k<eins.p.length;k+=2) out.g.push({art:"pkt",k:k/2,x:eins.p[k],y:eins.p[k+1]}); }
  else { const alle=eins&&eins.t==="text"?["nw","ne","sw","se","w","e"]:["nw","n","ne","e","se","s","sw","w"];
    for(const h of alle){ let lx=h.includes("w")?F.a-p:h.includes("e")?F.c+p:F.cx, ly=h.includes("n")?F.b-p:h.includes("s")?F.d+p:F.cy;
      if(h==="n") ly-=aus; else if(h==="s") ly+=aus; else if(h==="w") lx-=aus; else if(h==="e") lx+=aus;
      const [x,y]=W(lx,ly); out.g.push({art:h,x,y}); } }
  /* Drehgriff: Richtung „unten“, mitgedreht; passt er nicht auf den Bildschirm, kommt er auf die andere Seite */
  const phi=F.lok?F.rot:(ZG.selDreh||0), ux=-Math.sin(phi), uy=Math.cos(phi), hw=(F.c-F.a)/2+p, hh=(F.d-F.b)/2+p, ab=44/ZG.sk;
  const dist=F.lok?hh+ab:Math.min(Math.abs(ux)>1e-6?hw/Math.abs(ux):Infinity,Math.abs(uy)>1e-6?hh/Math.abs(uy):Infinity)+ab;
  let x=F.cx+ux*dist, y=F.cy+uy*dist; const sx=ZG.px+x*ZG.sk, sy=ZG.top-ZG.sy+y*ZG.sk;
  if(!(ZG.zug&&ZG.zug.art==="griff")&&(sy>ZG.vh-30||sy<ZG.top-10||sx<24||sx>ZG.vw-24)){ x=F.cx-ux*dist; y=F.cy-uy*dist; }
  out.dreh={x,y}; out.g.push({art:"rot",x,y}); return out; }
function zgGriffTreffer(x,y){ const G=zgGriffe(), tol=20/ZG.sk; if(!G) return null; let best=null, bd=tol; for(const g of G.g){ const d=Math.hypot(x-g.x,y-g.y)-(g.art==="rot"?6/ZG.sk:0); if(d<bd){ bd=d; best=g; } } return best; }
function zgSelInnen(x,y,ev){ const G=zgGriffe(); if(!G) return false;
  if(G.punkte||ZG.selWz) return ZG.sel.some(i=>zgTrifft(ZG.striche[i],x,y,zgToleranz(ev)));
  const F=G.f, p=zgPad(); if(F.rot) [x,y]=zgDreh([x,y],F.cx,F.cy,-F.rot); return x>=F.a-p&&x<=F.c+p&&y>=F.b-p&&y<=F.d+p; }
function zgAuswahlRahmen(ctx){ if(!ZG.sel.length||ZG.edit) return; const G=zgGriffe(); if(!G) return; const F=G.f, p=zgPad(), sk=ZG.sk;
  ctx.save(); ctx.strokeStyle=ZG_BLAU; ctx.lineWidth=1.5/sk;
  if(!G.punkte){ const E=F.rot?zgDreh([F.a-p,F.b-p,F.c+p,F.b-p,F.c+p,F.d+p,F.a-p,F.d+p],F.cx,F.cy,F.rot):[F.a-p,F.b-p,F.c+p,F.b-p,F.c+p,F.d+p,F.a-p,F.d+p];
    ctx.beginPath(); ctx.moveTo(E[0],E[1]); for(let i=2;i<8;i+=2) ctx.lineTo(E[i],E[i+1]); ctx.closePath(); ctx.stroke(); }
  for(const g of G.g){ if(g.art==="rot") continue; const gross=g.art==="pkt"||g.art.length===2;
    ctx.beginPath(); ctx.arc(g.x,g.y,(g.art==="pkt"?8:gross?7:4.5)/sk,0,Math.PI*2);
    if(gross){ ctx.fillStyle="#fff"; ctx.fill(); ctx.lineWidth=1.8/sk; ctx.stroke(); } else { ctx.fillStyle=ZG_BLAU; ctx.fill(); } }
  if(G.dreh){ const {x,y}=G.dreh, R=15/sk, r=R*.5; ctx.beginPath(); ctx.arc(x,y,R,0,Math.PI*2); ctx.fillStyle="#fff"; ctx.fill(); ctx.lineWidth=1.6/sk; ctx.stroke();
    ctx.lineWidth=1.7/sk; ctx.lineCap="round"; ctx.lineJoin="round";
    for(const st of [0,Math.PI]){ ctx.beginPath(); ctx.arc(x,y,r,st+.35,st+2.55); ctx.stroke(); const ea=st+2.55, ex=x+r*Math.cos(ea), ey=y+r*Math.sin(ea), tx=-Math.sin(ea), ty=Math.cos(ea);
      ctx.beginPath(); ctx.moveTo(ex+(tx*.0-Math.cos(ea)*.45)*r*.9,ey+(ty*.0-Math.sin(ea)*.45)*r*.9); ctx.lineTo(ex+tx*r*.55,ey+ty*r*.55); ctx.lineTo(ex+Math.cos(ea)*.45*r*.9,ey+Math.sin(ea)*.45*r*.9); ctx.stroke(); }
    const z=ZG.zug; if(z&&z.art==="griff"&&z.g.art==="rot"&&z.anzeige!=null){ const t=z.anzeige+"°"; ctx.font=`700 ${13/sk}px system-ui,-apple-system,sans-serif`; const w=ctx.measureText(t).width+14/sk, hx=x-w/2, hy=y-R-30/sk;
      ctx.fillStyle="rgba(31,31,34,.88)"; ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(hx,hy,w,22/sk,11/sk); else ctx.rect(hx,hy,w,22/sk); ctx.fill(); ctx.fillStyle="#fff"; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillText(t,x,hy+11/sk); } }
  ctx.restore(); }
const zgPageZuClient=(x,y)=>{ const r=ZG.cv.getBoundingClientRect(); return [r.left+ZG.px+x*ZG.sk,r.top+ZG.top-ZG.sy+y*ZG.sk]; };
const zgRel=(cx,cy)=>{ const r=ZG.ov.getBoundingClientRect(); return [cx-r.left,cy-r.top]; };
/* Leiste Ausschneiden/Kopieren/Duplizieren/Löschen: auf der Seite gegenüber dem Drehgriff */
function zgSelLeiste(){ const bar=ZG.ov.querySelector("#zgSel"); if(!ZG.sel.length||ZG.edit||ZG.zug){ bar.hidden=true; return; }
  const G=zgGriffe(); if(!G){ bar.hidden=true; return; } const einText=ZG.sel.length===1&&ZG.striche[ZG.sel[0]].t==="text";
  const k=(z,ic,l,rot)=>`<button class="zg-b${rot?" zg-rot":""}" data-z="${z}" aria-label="${l}" title="${l}">${zgIc(ic)}</button>`;
  const html=(einText?k("selEdit","edit","Text bearbeiten"):"")+k("selAus","schere","Ausschneiden")+k("selKopie","kopie","Kopieren")+k("selDup","dupl","Duplizieren")+k("selDel","leeren","Löschen",1);
  if(bar.dataset.h!==html){ bar.innerHTML=html; bar.dataset.h=html; }
  bar.hidden=false; const F=G.f, p=zgPad(), pts=G.punkte?ZG.striche[ZG.sel[0]].p.reduce((o,v,i)=>(i%2?o[o.length-1].push(v):o.push([v]),o),[]):G.g.filter(g=>g.art!=="rot").map(g=>[g.x,g.y]);
  if(!pts.length){ bar.hidden=true; return; }
  const sc=pts.map(([x,y])=>zgRel(...zgPageZuClient(x,y))), T=Math.min(...sc.map(q=>q[1]))-14, U=Math.max(...sc.map(q=>q[1]))+14, [Lx]=zgRel(...zgPageZuClient(F.cx,F.cy)), [,Hy]=zgRel(...zgPageZuClient(G.dreh.x,G.dreh.y)), [,Cy]=zgRel(...zgPageZuClient(F.cx,F.cy));
  const fr=ZG.fl.getBoundingClientRect(), [,flTop]=zgRel(0,fr.top), bw=bar.offsetWidth, bh=bar.offsetHeight, H=ZG.ov.clientHeight, griffUnten=Hy>Cy;
  let top=griffUnten?T-bh:U; if(griffUnten&&top<flTop+ZG.top-20) top=Math.max(U,Hy+24); if(!griffUnten&&top+bh>H-12) top=Math.min(T,Hy-24)-bh;
  top=Math.max(flTop+8,Math.min(top,H-bh-12));
  bar.style.left=Math.max(8,Math.min(ZG.ov.clientWidth-bw-8,Lx-bw/2))+"px"; bar.style.top=top+"px"; }
/* Griff ziehen */
function zgGriffZiehen(z,x,y){ const g=z.g, [a,b,c,d]=z.box, MIN=8, p=zgPad(), F=z.f;
  if(g.art==="rot"){ const cx=F.cx, cy=F.cy; if(z.a0==null) z.a0=Math.atan2(ZG.start.y-cy,ZG.start.x-cx);
    let dw=Math.atan2(y-cy,x-cx)-z.a0; const eins=z.orig.length===1?z.orig[0]:null, basis=F.lok?(eins.rot||0):(z.d0||0);
    /* leichtes Einrasten bei 0°, 45°, 90° … (±4°) */
    const ges=basis+dw, st=Math.round(ges/(Math.PI/4))*(Math.PI/4); if(Math.abs(ges-st)<.07) dw=st-basis;
    let grad=Math.round((basis+dw)*180/Math.PI)%360; if(grad<0) grad+=360; z.anzeige=grad; if(!F.lok) ZG.selDreh=(z.d0||0)+dw;
    ZG.sel.forEach((i,k)=>{ const o=z.orig[k];
      if(ZG_PUNKTART.includes(o.t)){ ZG.striche[i]={...o,p:zgDreh(o.p,cx,cy,dw).map(zgR)}; return; }
      const [ox,oy]=zgZentrum(o), [nx,ny]=zgDreh([ox,oy],cx,cy,dw), dx=nx-ox, dy=ny-oy; let rw=((o.rot||0)+dw)%(2*Math.PI); if(Math.abs(rw)<1e-4||Math.abs(Math.abs(rw)-2*Math.PI)<1e-4) rw=0;
      const n={...o,p:o.p.map((v,j)=>zgR(j%2?v+dy:v+dx))}; if(rw) n.rot=+rw.toFixed(5); else delete n.rot; ZG.striche[i]=n; });
    return; }
  if(g.art==="pkt"){ const i=ZG.sel[0], o=z.orig[0], P=o.p.slice(); let nx=x, ny=y;
    if(P.length===4){ const k=g.k?0:2; [nx,ny]=zgWinkelFang(P[k],P[k+1],nx,ny); }
    P[2*g.k]=zgR(nx); P[2*g.k+1]=zgR(ny); ZG.striche[i]={...o,p:P}; return; }
  const h=g.art, eins=z.orig.length===1?z.orig[0]:null, aus=12/ZG.sk;
  /* Griff liegt außerhalb des Rahmens: Zeigerposition auf die Rahmenkante zurückrechnen */
  const kante=(lx,ly)=>[h.includes("w")?lx+p+(h==="w"?aus:0):h.includes("e")?lx-p-(h==="e"?aus:0):lx, h.includes("n")?ly+p+(h==="n"?aus:0):h.includes("s")?ly-p-(h==="s"?aus:0):ly];
  if(F.lok){ /* einzelnes gedrehtes Objekt: im eigenen (ungedrehten) Rahmen rechnen */
    const o=eins, i=ZG.sel[0], [lx,ly]=zgDreh([x,y],F.cx,F.cy,-F.rot), [qx,qy]=kante(lx,ly), fa=F.a, fb=F.b, fc=F.c, fd=F.d;
    let A=fa,B=fb,C=fc,D=fd; if(h.includes("w")) A=Math.min(qx,fc-MIN); if(h.includes("e")) C=Math.max(qx,fa+MIN); if(h.includes("n")) B=Math.min(qy,fd-MIN); if(h.includes("s")) D=Math.max(qy,fb+MIN);
    if((o.t==="bild"||o.t==="text")&&h.length===2){ const f=Math.max((C-A)/(fc-fa),(D-B)/(fd-fb)); if(h.includes("w")) A=fc-(fc-fa)*f; else C=fa+(fc-fa)*f; if(h.includes("n")) B=fd-(fd-fb)*f; else D=fb+(fd-fb)*f; }
    const [wx,wy]=zgDreh([(A+C)/2,(B+D)/2],F.cx,F.cy,F.rot), n={...o};
    if(o.t==="text"){ const fs=o.fs||28; if(h==="w"||h==="e") n.bw=zgR(Math.max(fs*1.5,C-A-(o.bg?16:0))); else { const f=(C-A)/(fc-fa); n.fs=Math.max(6,zgR(fs*f)); if(o.bw) n.bw=zgR(o.bw*f); }
      const m=zgTextMass(n); n.p=[zgR(wx-m.w/2),zgR(wy-m.h/2)]; }
    else { const r=o.t==="bild"?0:(o.w||4)/2, hw=Math.max(1,(C-A)/2-r), hh=Math.max(1,(D-B)/2-r); n.p=[zgR(wx-hw),zgR(wy-hh),zgR(wx+hw),zgR(wy+hh)]; }
    ZG.striche[i]=n; return; }
  const [px,py]=kante(x,y);
  if(eins&&eins.t==="text"){ const i=ZG.sel[0], o=eins, m=zgTextMass(o), fs=o.fs||28;
    if(h==="e"){ ZG.striche[i]={...o,bw:zgR(Math.max(fs*1.5,px-o.p[0]))}; return; }
    if(h==="w"){ const re=o.p[0]+m.w, l=Math.min(px,re-fs*1.5); ZG.striche[i]={...o,p:[zgR(l),o.p[1]],bw:zgR(re-l)}; return; }
    const ax=h.includes("w")?c:a, ay=h.includes("n")?d:b, f=Math.max(.2,Math.abs(px-ax)/Math.max(1,c-a));
    const n={...o,fs:Math.max(6,zgR(fs*f)),p:[zgR(ax+(o.p[0]-ax)*f),zgR(ay+(o.p[1]-ay)*f)]}; if(o.bw) n.bw=zgR(o.bw*f); ZG.striche[i]=n; return; }
  let A=a,B=b,C=c,D=d; if(h.includes("w")) A=Math.min(px,c-MIN); if(h.includes("e")) C=Math.max(px,a+MIN); if(h.includes("n")) B=Math.min(py,d-MIN); if(h.includes("s")) D=Math.max(py,b+MIN);
  let fx=(C-A)/Math.max(1e-6,c-a), fy=(D-B)/Math.max(1e-6,d-b);
  /* Bild an der Ecke: Seitenverhältnis bleibt */
  if(eins&&eins.t==="bild"&&h.length===2){ const f=Math.max(fx,fy); fx=fy=f; if(h.includes("w")) A=c-(c-a)*f; else C=a+(c-a)*f; if(h.includes("n")) B=d-(d-b)*f; else D=b+(d-b)*f; }
  ZG.sel.forEach((i,k)=>{ const o=z.orig[k];
    if(o.rot&&!ZG_PUNKTART.includes(o.t)){ /* gedreht (in Gruppe): Mitte mitnehmen, Größe gleichmäßig */
      const [ox,oy]=zgZentrum(o), nx=A+(ox-a)*fx, ny=B+(oy-b)*fy, f=Math.sqrt(Math.abs(fx*fy)), n={...o};
      if(o.t==="text"){ n.fs=Math.max(6,zgR((o.fs||28)*f)); if(o.bw) n.bw=zgR(o.bw*f); const m=zgTextMass(n); n.p=[zgR(nx-m.w/2),zgR(ny-m.h/2)]; }
      else { const [ra,rb,rc,rd]=zgBoxRoh(o), hw=(rc-ra)/2*f, hh=(rd-rb)/2*f; n.p=[zgR(nx-hw),zgR(ny-hh),zgR(nx+hw),zgR(ny+hh)]; }
      ZG.striche[i]=n; return; }
    ZG.striche[i]={...o,p:o.p.map((v,j)=>zgR(j%2?B+(v-b)*fy:A+(v-a)*fx))}; }); }
function zgWinkelFang(x0,y0,x,y){ const ang=Math.atan2(y-y0,x-x0), sn=Math.round(ang/(Math.PI/4))*(Math.PI/4); if(Math.abs(ang-sn)<.09){ const l=Math.hypot(x-x0,y-y0); return [zgR(x0+l*Math.cos(sn)),zgR(y0+l*Math.sin(sn))]; } return [x,y]; }

/* --- Formerkennung: Strich zeichnen und am Ende kurz halten ⇒ gerade Linie, Rechteck, Kreis, Dreieck oder Vieleck --- */
function zgRdp(P,eps){ if(P.length<3) return P.slice(); const [x1,y1]=P[0],[x2,y2]=P[P.length-1], dx=x2-x1, dy=y2-y1, l=Math.hypot(dx,dy);
  let mi=-1, md=0; for(let i=1;i<P.length-1;i++){ const d=l>1e-6?Math.abs(dy*P[i][0]-dx*P[i][1]+x2*y1-y2*x1)/l:Math.hypot(P[i][0]-x1,P[i][1]-y1); if(d>md){ md=d; mi=i; } }
  if(md>eps){ const a=zgRdp(P.slice(0,mi+1),eps), b=zgRdp(P.slice(mi),eps); return a.slice(0,-1).concat(b); }
  return [P[0],P[P.length-1]]; }
function zgEckenBereinigen(V,zu){ let fertig=false; while(!fertig&&V.length>(zu?3:2)){ fertig=true;
    for(let i=zu?0:1;i<(zu?V.length:V.length-1);i++){ const p=V[(i-1+V.length)%V.length], q=V[i], r=V[(i+1)%V.length];
      let d=Math.abs(Math.atan2(r[1]-q[1],r[0]-q[0])-Math.atan2(q[1]-p[1],q[0]-p[0])); if(d>Math.PI) d=2*Math.PI-d;
      if(d<.42||Math.hypot(q[0]-p[0],q[1]-p[1])<6){ V=V.slice(0,i).concat(V.slice(i+1)); fertig=false; break; } } }
  return V; }
function zgErkenne(a){ const P=[]; for(let i=0;i<a.p.length;i+=2) P.push([a.p[i],a.p[i+1]]); if(P.length<4) return null;
  let L=0; for(let i=1;i<P.length;i++) L+=Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]);
  let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity; P.forEach(([x,y])=>{ x0=Math.min(x0,x); x1=Math.max(x1,x); y0=Math.min(y0,y); y1=Math.max(y1,y); });
  const w=x1-x0, h=y1-y0, diag=Math.hypot(w,h); if(diag<24||L<30) return null;
  const A=P[0], E=P[P.length-1], D=Math.hypot(E[0]-A[0],E[1]-A[1]);
  const basis={c:a.c,w:a.t==="fueller"?zgR(Math.max(1,a.w*.62)):a.w}; if(a.d) basis.d=a.d;
  if(D/L>.9){ const [ex,ey]=zgWinkelFang(A[0],A[1],E[0],E[1]); return {...basis,t:"linie",p:[zgR(A[0]),zgR(A[1]),zgR(ex),zgR(ey)]}; }
  const zu=D<Math.max(30,diag*.25); let V=zgRdp(P,Math.max(6,diag*.06));
  if(zu){ if(V.length>2&&Math.hypot(V[V.length-1][0]-V[0][0],V[V.length-1][1]-V[0][1])<Math.max(30,diag*.25)) V=V.slice(0,-1);
    V=zgEckenBereinigen(V,true);
    /* Flächenanteil am umschließenden Rechteck: Rechteck ≈ 0,9–1, Kreis/Ellipse ≈ 0,79, Dreieck/Raute ≈ 0,5 */
    let fl=0; for(let i=0;i<P.length;i++){ const [xa,ya]=P[i], [xb,yb]=P[(i+1)%P.length]; fl+=xa*yb-xb*ya; } fl=Math.abs(fl)/2;
    /* kleinstes (auch schräges) umschließendes Rechteck – so werden auch schief gezeichnete Rechtecke erkannt */
    const mx=(x0+x1)/2, my=(y0+y1)/2; let best=null;
    for(let g=0;g<90;g+=2){ const th=g*Math.PI/180, co=Math.cos(th), si=Math.sin(th); let a0=Infinity,b0=Infinity,a1=-Infinity,b1=-Infinity;
      for(const [x,y] of P){ const u=(x-mx)*co+(y-my)*si, v=-(x-mx)*si+(y-my)*co; if(u<a0) a0=u; if(u>a1) a1=u; if(v<b0) b0=v; if(v>b1) b1=v; }
      const A=(a1-a0)*(b1-b0); if(!best||A<best.A) best={A,th,a0,a1,b0,b1}; }
    const anteil=fl/Math.max(1,best.A), bw=best.a1-best.a0, bh=best.b1-best.b0;
    let th=best.th; if(th>Math.PI/4){ th-=Math.PI/2; } /* kleinsten Winkel nehmen */
    const lu=(best.a0+best.a1)/2, lv=(best.b0+best.b1)/2, cx=mx+lu*Math.cos(best.th)-lv*Math.sin(best.th), cy=my+lu*Math.sin(best.th)+lv*Math.cos(best.th);
    const [sw,sh]=Math.abs(th-best.th)>1e-6?[bh,bw]:[bw,bh], rund=Math.min(sw,sh)/Math.max(sw,sh)>.82;
    const rahmenForm=t=>{ const gerade=Math.abs(th)<.12||(t==="kreis"&&rund); const n={...basis,t,p:gerade?[zgR(x0),zgR(y0),zgR(x1),zgR(y1)]:[zgR(cx-sw/2),zgR(cy-sh/2),zgR(cx+sw/2),zgR(cy+sh/2)]}; if(!gerade) n.rot=+th.toFixed(5); return n; };
    const poly=()=>({...basis,t:"poly",zu:true,p:V.flat().map(zgR)});
    if(V.length===3&&anteil<.72) return poly();
    if(anteil>=.86&&Math.min(sw,sh)>10) return rahmenForm("rechteck");
    if(anteil>=.66&&Math.min(sw,sh)>10) return rahmenForm("kreis");
    if(V.length>=3&&V.length<=6) return poly();
    return null; }
  V=zgEckenBereinigen(V,false); if(V.length>=3&&V.length<=8) return {...basis,t:"poly",zu:false,p:V.flat().map(zgR)};
  return null; }
function zgHalten(x,y){ clearTimeout(ZG.haltT); ZG.haltP=[x,y]; ZG.haltT=setTimeout(zgFormAusHand,520); }
function zgFormAusHand(){ const a=ZG&&ZG.akt; if(!a||a._erkannt||!(a.t==="stift"||a.t==="fueller")) return; const f=zgErkenne(a); if(!f) return; f._erkannt=true; ZG.akt=f; zgMalen(); }

/* --- Zeiger: Stift zeichnet, Finger scrollt (mit Pencil) bzw. zwei Finger scrollen --- */
const zgMitte=()=>{ let x=0,y=0,n=0; ZG.pz.forEach(p=>{ x+=p.x; y+=p.y; n++; }); const r=ZG.cv.getBoundingClientRect(); return n?[x/n-r.left,y/n-r.top]:[0,0]; };
const zgAbst=()=>{ const a=[...ZG.pz.values()]; return a.length>=2?Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y):0; };
/* Ein Finger verschiebt, zwei Finger verschieben und zoomen (Blattpunkt unter den Fingern bleibt dort) */
function zgPanStart(){ zgMomentStop(); const [cx,cy]=zgMitte(); ZG.pan={P:[(cx-ZG.px)/ZG.sk,(cy-ZG.top+ZG.sy)/ZG.sk],d0:zgAbst(),z0:ZG.z,t:performance.now(),vx:0,vy:0,lx:cx,ly:cy}; }
function zgPanMove(){ const P=ZG.pan, [cx,cy]=zgMitte(), now=performance.now(), dt=Math.max(1,now-P.t);
  P.vx=P.vx*.6+((cx-P.lx)/dt)*.4; P.vy=P.vy*.6+((cy-P.ly)/dt)*.4; P.lx=cx; P.ly=cy; P.t=now;
  if(P.d0>20){ const d=zgAbst(); if(d>0){ let z=Math.max(.5,Math.min(6,P.z0*d/P.d0)); if(Math.abs(z-1)<.05) z=1; ZG.z=z; ZG.zoomZeit=now; } }
  ZG.sk=ZG.sk0*ZG.z; zgScrollen(ZG.top-(cy-P.P[1]*ZG.sk),false,16-(cx-P.P[0]*ZG.sk)); }
function zgMomentStop(){ cancelAnimationFrame(ZG.mom); ZG.mom=0; }
function zgMoment(vx,vy){ let t=performance.now(); const f=now=>{ if(!ZG) return; const dt=Math.max(1,now-t); t=now; const k=Math.pow(.94,dt/16); vx*=k; vy*=k; if(Math.hypot(vx,vy)<.03) return; zgScrollen(ZG.sy-vy*dt,false,ZG.sx-vx*dt); ZG.mom=requestAnimationFrame(f); }; ZG.mom=requestAnimationFrame(f); }
/* Lange auf eine freie Stelle drücken ⇒ kleines Menü: Einfügen, Text, Bild */
function zgLangStart(ev,x,y){ clearTimeout(ZG.langT); ZG.lang={cx:ev.clientX,cy:ev.clientY,x,y,id:ev.pointerId}; ZG.langT=setTimeout(zgLangDruck,550); }
function zgLangStop(){ clearTimeout(ZG.langT); ZG.lang=null; }
function zgLangDruck(){ const L=ZG&&ZG.lang; if(!L) return; ZG.lang=null; ZG.langFired=L.id;
  ZG.lasso=null; ZG.textTap=null; ZG.akt=null; clearTimeout(ZG.haltT); ZG.pan=null; ZG.pz.clear(); ZG.pid=null; zgMomentStop(); zgMalen();
  ZG.kPos=[L.x,L.y]; const k=(z,ic,l,aus)=>`<button class="zg-chip" data-z="${z}"${aus?" disabled":""}>${zgIc(ic)}${l}</button>`;
  const p=ZG.ov.querySelector("#zgPop"); p.dataset.fuer="kontext"; p.innerHTML=`<div class="zg-pop-r zg-kontext">${k("einfHier","dupl","Einfügen",!ZG_CLIP)}${k("textHier","text","Text")}${k("bildHier","bild","Bild")}</div>`; p.hidden=false;
  const [x,y]=zgRel(L.cx,L.cy), w=p.offsetWidth, h=p.offsetHeight; let top=y-h-28; if(top<8) top=y+28;
  p.style.left=Math.max(8,Math.min(ZG.ov.clientWidth-w-8,x-w/2))+"px"; p.style.top=top+"px"; }
function zgAktionAbbrechen(){ zgLangStop(); clearTimeout(ZG.haltT); ZG.akt=null; ZG.lasso=null; ZG.textTap=null; ZG.zug=null; if(ZG.rad){ if(!ZG.rad.aend) ZG.hist.pop(); ZG.rad=null; } ZG.pid=null; }
function zgDown(ev){ if(!ZG) return; zgPopZu();
  if(ZG.ta){ ev.preventDefault(); ZG.ta.blur(); return; }
  const typ=ev.pointerType; try{ ZG.cv.setPointerCapture(ev.pointerId); }catch(e){}
  if(typ==="pen"){ ZG.stift=true; ZG.penDown=true; if(ZG.pan){ ZG.pan=null; ZG.pz.clear(); } }
  if(typ==="touch"){ if(ZG.penDown) return; ZG.tz.set(ev.pointerId,{x:ev.clientX,y:ev.clientY});
    if(ZG.tz.size>=2){ ev.preventDefault(); zgAktionAbbrechen(); ZG.pz=new Map(ZG.tz); zgPanStart(); zgMalen(); return; }
    if(ZG.stift&&ZG_MALT.includes(ZG.cfg.wz)){ ev.preventDefault(); ZG.pz=new Map(ZG.tz); zgPanStart(); const [lx,ly]=zgPunkt(ev); zgLangStart(ev,lx,ly); return; } }
  if(ZG.pid!=null) return;
  ev.preventDefault(); zgMomentStop(); ZG.pid=ev.pointerId;
  const [x,y]=zgPunkt(ev), wz=ZG.cfg.wz; ZG.start={x,y,cx:ev.clientX,cy:ev.clientY,typ,bewegt:false};
  /* Auswahl bearbeiten: Griff ziehen oder Auswahl verschieben */
  if(ZG.sel.length&&(wz==="lasso"||ZG.selWz)){ const g=zgGriffTreffer(x,y), orig=ZG.sel.map(i=>ZG.striche[i]);
    if(g){ zgSnap(); const G=zgGriffe(); ZG.zug={art:"griff",g,orig,box:zgSelBox(),f:G.f,d0:ZG.selDreh||0}; zgMalen(); return; }
    if(zgSelInnen(x,y,ev)){ zgSnap(); ZG.zug={art:"ziehen",orig,x,y}; return; } }
  if(ZG.selWz){ ZG.sel=[]; ZG.selWz=false; }
  if(wz==="lasso"){ ZG.lasso=[x,y]; ZG.lassoBox=ZG.cfg.lasso.art==="box"; zgLangStart(ev,x,y); return; }
  if(wz==="text"){ ZG.textTap={x,y}; zgLangStart(ev,x,y); return; }
  if(wz==="radierer"){ zgSnap(); ZG.rad={aend:false,pos:[x,y],last:[x,y]}; zgRadier(x,y); zgMalen(); return; }
  ZG.sel=[]; const c=ZG.cfg;
  if(wz==="stift"){ const w=c.stift.ws[c.stift.wi]; ZG.akt=c.stift.art==="fueller"?{t:"fueller",c:c.stift.c,w:zgR(w*1.6),p:[x,y],pr:[zgDruck(ev,null)]}:{t:"stift",c:c.stift.c,w,p:[x,y]}; if(c.stift.art!=="fueller"&&c.stift.d) ZG.akt.d=c.stift.d; zgHalten(x,y); }
  else if(wz==="marker") ZG.akt={t:"marker",c:c.marker.c,w:c.marker.ws[c.marker.wi],p:[x,y],o:.5,_g:c.marker.gerade};
  if(ZG_MALT.includes(wz)&&wz!=="radierer") zgLangStart(ev,x,y);
  if(wz==="form"){ ZG.akt={t:c.form.art,c:c.form.c,w:c.form.ws[c.form.wi],p:[x,y,x,y]}; if(c.form.d) ZG.akt.d=c.form.d; if(c.form.fill&&ZG_GESCHLOSSEN.includes(c.form.art)) ZG.akt.fill=true; }
  zgOptBauen(); zgMalen(); }
function zgDruck(e,akt){ if(e.pointerType==="pen"&&e.pressure>0) return Math.round(Math.max(.05,Math.min(1,e.pressure))*100)/100;
  if(!akt) return .6; const p=akt.p, n=p.length; const [x,y]=zgPunkt(e), d=Math.hypot(x-p[n-2],y-p[n-1]); const ziel=Math.max(.3,Math.min(1,1.05-d/16)); const alt=akt.pr[akt.pr.length-1];
  return Math.round((alt*.65+ziel*.35)*100)/100; }
function zgMove(ev){ if(!ZG) return; const id=ev.pointerId;
  if(ZG.lang&&ZG.lang.id===id&&Math.hypot(ev.clientX-ZG.lang.cx,ev.clientY-ZG.lang.cy)>8) zgLangStop();
  if(ZG.langFired===id) return;
  if(ZG.tz.has(id)) ZG.tz.set(id,{x:ev.clientX,y:ev.clientY});
  if(ZG.pan&&ZG.pz.has(id)){ ZG.pz.set(id,{x:ev.clientX,y:ev.clientY}); zgPanMove(); return; }
  if(id!==ZG.pid) return;
  let evs=ev.getCoalescedEvents&&ev.pointerType!=="mouse"?ev.getCoalescedEvents():[ev]; if(!evs||!evs.length) evs=[ev]; const st=ZG.start;
  if(st&&!st.bewegt&&Math.hypot(ev.clientX-st.cx,ev.clientY-st.cy)>7) st.bewegt=true;
  const [x,y]=zgPunkt(ev);
  if(ZG.textTap){ if(st.bewegt){ /* Ziehen im Textmodus scrollt */ ZG.textTap=null; ZG.pid=null; ZG.pz=new Map([[id,{x:st.cx,y:st.cy}]]); zgPanStart(); ZG.pz.set(id,{x:ev.clientX,y:ev.clientY}); } return; }
  if(ZG.zug){ const z=ZG.zug; if(!st.bewegt) return;
    if(z.art==="ziehen"){ const dx=x-z.x, dy=y-z.y; ZG.sel.forEach((i,k)=>{ const o=z.orig[k]; ZG.striche[i]={...o,p:o.p.map((v,j)=>zgR(j%2?v+dy:v+dx))}; }); }
    else if(z.art==="griff") zgGriffZiehen(z,x,y);
    zgMalen(); return; }
  if(ZG.lasso){ const L=ZG.lasso;
    if(ZG.lassoBox){ const x0=st.x, y0=st.y; ZG.lasso=[x0,y0,x,y0,x,y,x0,y]; }
    else if(Math.hypot(L[L.length-2]-x,L[L.length-1]-y)>3/ZG.sk) L.push(x,y);
    zgMalen(); return; }
  if(ZG.rad){ const [lx,ly]=ZG.rad.last, r=zgRadR(), n=Math.max(1,Math.ceil(Math.hypot(x-lx,y-ly)/(r/2))); for(let k=1;k<=n;k++) zgRadier(lx+(x-lx)*k/n,ly+(y-ly)*k/n); ZG.rad.last=[x,y]; ZG.rad.pos=[x,y]; zgMalen(); return; }
  const a=ZG.akt; if(!a) return;
  if(a._erkannt&&a.t!=="linie") return;
  if(a.t==="stift"||a.t==="fueller"||(a.t==="marker"&&!a._g)){ for(const e of evs){ const [ex,ey]=zgPunkt(e), p=a.p; if(Math.hypot(p[p.length-2]-ex,p[p.length-1]-ey)>=(a.t==="fueller"?1.2:2)){ if(a.t==="fueller") a.pr.push(zgDruck(e,a)); p.push(ex,ey); } }
    if((a.t==="stift"||a.t==="fueller")&&ZG.haltP&&Math.hypot(x-ZG.haltP[0],y-ZG.haltP[1])>5/ZG.sk) zgHalten(x,y); }
  else if(a.t==="marker"){ a.p=[a.p[0],a.p[1],x,y]; }
  else { const [x0,y0]=a.p; let [nx,ny]=["linie","pfeil","doppelpfeil"].includes(a.t)?zgWinkelFang(x0,y0,x,y):[x,y]; a.p=[x0,y0,nx,ny]; }
  zgMalen(); }
function zgUp(ev){ if(!ZG) return; const id=ev.pointerId;
  if(ZG.lang&&ZG.lang.id===id) zgLangStop();
  if(ZG.langFired===id){ ZG.langFired=null; ZG.tz.delete(id); ZG.pz.delete(id); if(ev.pointerType==="pen") ZG.penDown=false; return; }
  if(ev.pointerType==="pen") ZG.penDown=false;
  ZG.tz.delete(id);
  if(ZG.pz.has(id)){ ZG.pz.delete(id); if(!ZG.pz.size){ const P=ZG.pan; ZG.pan=null; if(P&&P.d0<=20&&performance.now()-P.t<90&&Math.hypot(P.vx,P.vy)>.15){ const c=v=>Math.max(-4,Math.min(4,v)); zgMoment(c(P.vx),c(P.vy)); } } else if(ZG.pan) zgPanStart(); return; }
  if(id!==ZG.pid) return; ZG.pid=null; clearTimeout(ZG.haltT); const st=ZG.start||{};
  if(ZG.textTap){ const {x,y}=ZG.textTap; ZG.textTap=null; const i=zgTreffer(x,y,6/ZG.sk); if(i!=null&&ZG.striche[i].t==="text") zgTextFeld(i); else zgTextFeld(null,x,Math.max(0,y-(ZG.cfg.text.fs||28)*.62)); return; }
  if(ZG.zug){ const z=ZG.zug; ZG.zug=null;
    if(!st.bewegt){ ZG.hist.pop(); if(z.art==="ziehen"&&!ZG.selWz&&ZG.sel.length===1&&ZG.striche[ZG.sel[0]].t==="text"){ zgTextFeld(ZG.sel[0]); return; } }
    else { const B=zgSelBox(); if(B) zgWachsen(B[3]); }
    zgOptBauen(); zgMalen(); return; }
  if(ZG.lasso){ const L=ZG.lasso; ZG.lasso=null;
    if(!st.bewegt||(!ZG.lassoBox&&L.length<8)){ const i=zgTreffer(st.x,st.y,zgToleranz(ev)), jetzt=Date.now();
      if(i!=null&&ZG.tapAlt&&ZG.tapAlt.i===i&&jetzt-ZG.tapAlt.t<380&&ZG.striche[i].t==="text"){ ZG.tapAlt=null; zgTextFeld(i); return; }
      ZG.tapAlt=i!=null?{i,t:jetzt}:null; ZG.sel=i!=null?[i]:[]; }
    else ZG.sel=zgLassoWahl(L);
    ZG.selWz=false; zgOptBauen(); zgMalen(); return; }
  if(ZG.rad){ if(!ZG.rad.aend) ZG.hist.pop(); ZG.rad=null; zgMalen(); return; }
  const a=ZG.akt; if(!a) return; ZG.akt=null; delete a._g; const erk=a._erkannt; delete a._erkannt;
  /* Linie oder Form mit Stift/Formwerkzeug antippen ⇒ Griffe zeigen statt Punkt setzen */
  if(!st.bewegt&&!erk&&(a.t==="stift"||a.t==="fueller"||ZG_IST_FORM(a.t))){ const i=zgTreffer(st.x,st.y,zgToleranz(ev)), s=i!=null&&ZG.striche[i];
    if(s&&(ZG_IST_FORM(s.t)||s.t==="poly")){ ZG.sel=[i]; ZG.selWz=true; zgOptBauen(); zgMalen(); return; } }
  if(!st.bewegt&&!erk&&(a.t==="stift"||a.t==="fueller"||a.t==="marker")){ const n=80; const nah=ZG.striche.some(o=>{ if(o.t==="bild") return false; const [a1,b1,c1,d1]=zgBox(o); return st.x>a1-n&&st.x<c1+n&&st.y>b1-n&&st.y<d1+n; });
    if(!nah){ zgMalen(); return; } }
  const kurz=ZG_IST_FORM(a.t)&&Math.hypot(a.p[2]-a.p[0],a.p[3]-a.p[1])<4;
  if(!kurz){ zgSnap(); ZG.striche.push(a); zgWachsen(zgBox(a)[3]); if(erk||ZG_IST_FORM(a.t)){ ZG.sel=[ZG.striche.length-1]; ZG.selWz=true; } }
  zgOptBauen(); zgMalen(); }

/* --- Radierer: ganzer Strich oder präzise (teilt Striche) --- */
const zgRadR=()=>{ const r=ZG.cfg.radierer; return r.ws[r.wi]; };
function zgRadier(x,y){ const R=ZG.cfg.radierer, r=zgRadR(), praez=R.modus==="praezise"; let aend=false; const neu=[];
  for(const s of ZG.striche){ if((R.nurMarker&&s.t!=="marker")||s.t==="bild"){ neu.push(s); continue; } const [a,b,c,d]=zgBox(s);
    if(x<a-r||x>c+r||y<b-r||y>d+r){ neu.push(s); continue; }
    if(s.t==="text"){ if(!praez&&x>=a&&x<=c&&y>=b&&y<=d){ aend=true; continue; } neu.push(s); continue; }
    if(!praez){ if(zgTrifft(s,x,y,r)){ aend=true; continue; } neu.push(s); continue; }
    const T=zgTeile(s,x,y,r); if(!T){ neu.push(s); continue; } aend=true; neu.push(...T); }
  if(aend){ ZG.striche=neu; ZG.rad.aend=true; ZG.sel=[]; } }
function zgTeile(s,x,y,r){ const P=zgPunkte(s), PR=s.t==="fueller"?s.pr||[]:null, rr=r+(s.w||4)/2*(s.t==="fueller"?.5:1), Q=[],QR=[];
  for(let i=0;i<P.length;i+=2){ Q.push(P[i],P[i+1]); if(PR) QR.push(PR[i/2]); if(i+3<P.length){ const dx=P[i+2]-P[i], dy=P[i+3]-P[i+1], l=Math.hypot(dx,dy), n=Math.floor(l/(r/2));
      for(let k=1;k<=n;k++){ Q.push(zgR(P[i]+dx*k/(n+1)),zgR(P[i+1]+dy*k/(n+1))); if(PR) QR.push(PR[i/2]); } } }
  let getroffen=false; const L=[]; let akt=null;
  for(let i=0;i<Q.length;i+=2){ if(Math.hypot(Q[i]-x,Q[i+1]-y)<rr){ getroffen=true; if(akt){ L.push(akt); akt=null; } continue; } if(!akt) akt={p:[],pr:[]}; akt.p.push(Q[i],Q[i+1]); if(PR) akt.pr.push(QR[i/2]); }
  if(akt) L.push(akt); if(!getroffen) return null;
  const basis=s.t==="stift"||s.t==="marker"||s.t==="fueller"?{...s}:{t:"stift",c:s.c,w:s.w,...(s.d?{d:s.d}:{})};
  return L.filter(t=>t.p.length>=4).map(t=>{ const n={...basis,p:t.p}; if(PR) n.pr=t.pr; return n; }); }

/* --- Textfeld: wächst mit dem Text, bricht am Rand um, Enter = neue Zeile, Wegtippen übernimmt --- */
function zgTextFeld(i,x,y){ if(ZG.ta) ZG.ta.blur();
  const T=ZG.cfg.text, s=i!=null?{...ZG.striche[i]}:{t:"text",v:2,p:[zgR(Math.max(0,x)),zgR(Math.max(0,y))],s:"",fs:T.fs,c:T.c,b:T.b,i:T.i,u:T.u,fam:T.fam,al:T.al,bg:T.bg};
  if(i!=null) ["fs","c","b","i","u","fam","al","bg"].forEach(k=>{ if(s[k]!=null) T[k]=s[k]; });
  ZG.edit={i,s,bw:s.bw}; ZG.sel=[]; ZG.extra=420;
  const ta=document.createElement("textarea"); ta.id="zgText"; ta.className="zg-text"; ta.value=s.s||""; ta.rows=1; ta.spellcheck=true; ta.setAttribute("autocapitalize","sentences");
  ZG.fl.appendChild(ta); ZG.ta=ta;
  ta.addEventListener("input",zgTextPassen);
  let fertig=false; const ok=abbr=>{ if(fertig||!ZG) return; fertig=true; const e=ZG.edit, v=ta.value.replace(/\s+$/,""); ta.remove(); ZG.ta=null; ZG.edit=null; ZG.extra=0;
    if(!abbr){ const n={...e.s,s:v}, bw=e.bw||e.bwAuto; if(bw) n.bw=zgR(bw); else delete n.bw;
      if(e.i!=null){ zgSnap(); if(!v) ZG.striche.splice(e.i,1); else ZG.striche[e.i]=n; }
      else if(v){ zgSnap(); ZG.striche.push(n); zgWachsen(zgBox(n)[3]); } }
    zgCfgSichern(); zgOptBauen(); zgScrollen(ZG.sy,true); };
  ta.addEventListener("keydown",e=>{ if(e.key==="Escape"){ e.preventDefault(); ok(true); } });
  ta.addEventListener("blur",()=>ok(false));
  zgOptBauen(); zgTextPassen(); zgMalen();
  try{ ta.focus({preventScroll:true}); }catch(e){ ta.focus(); }
  setTimeout(zgSichtbar,380); }
function zgTextPassen(){ const e=ZG&&ZG.edit, ta=ZG&&ZG.ta; if(!e||!ta) return; const s=e.s, tmp={...s,s:ta.value||" "};
  let bw=e.bw; if(!bw){ const m=zgTextMass({...tmp,bw:0}); if(s.p[0]+m.w>1000-12) bw=Math.max(s.fs*2,1000-12-s.p[0]); }
  e.bwAuto=e.bw?0:bw; const m=zgTextMass({...tmp,bw}); e.m=m; e.mw=Math.max(m.w,(s.fs||28)*1.2); zgTextPos(); }
function zgTextPos(){ const e=ZG&&ZG.edit, ta=ZG&&ZG.ta; if(!e||!ta||!e.m) return; const s=e.s, sk=ZG.sk, bg=s.bg==="notiz"?"#FFF1A8":s.bg==="farbe"?s.c+"24":"rgba(255,255,255,.55)";
  Object.assign(ta.style,{left:(ZG.px+s.p[0]*sk-4)+"px",top:(ZG.top-ZG.sy+s.p[1]*sk-2)+"px",width:(e.mw*sk+3)+"px",height:(e.m.h*sk)+"px",fontSize:(s.fs*sk)+"px",lineHeight:(zgLH(s)*sk)+"px",
    transformOrigin:(4+e.mw*sk/2)+"px "+(2+e.m.h*sk/2)+"px",transform:s.rot?`rotate(${s.rot}rad)`:"none",fontFamily:zgFam(s),fontWeight:s.b?700:500,fontStyle:s.i?"italic":"normal",textDecoration:s.u?"underline":"none",textAlign:s.al==="m"?"center":s.al==="r"?"right":"left",color:s.c,background:bg}); }
function zgSichtbar(){ if(!ZG||!ZG.ta) return; const r=ZG.ta.getBoundingClientRect(), vv=window.visualViewport, unten=vv?vv.offsetTop+vv.height:innerHeight;
  const fr=ZG.fl.getBoundingClientRect(); if(r.bottom+20>unten) zgScrollen(ZG.sy+(r.bottom+20-unten),true); else if(r.top<fr.top+ZG.top-10) zgScrollen(ZG.sy-(fr.top+ZG.top-10-r.top),true); }
/* Text-Eigenschaft ändern: beim Schreiben am offenen Feld, sonst an der Auswahl; immer auch als Vorgabe merken */
function zgTextSetzen(k,fn){ const T=ZG.cfg.text;
  if(ZG.edit){ const s=ZG.edit.s, v=fn(s); ZG.edit.s={...s,[k]:v}; T[k]=v; zgTextPassen(); zgMalen(); }
  else if(ZG.sel.length){ zgSnap(); ZG.sel.forEach(i=>{ const s=ZG.striche[i]; if(s.t!=="text") return; const v=fn(s); ZG.striche[i]={...s,[k]:v}; T[k]=v; }); zgMalen(); }
  else T[k]=fn(T);
  zgCfgSichern(); zgOptBauen(); }

/* --- Optionsleiste (schwebend, je Werkzeug) --- */
const zgFarbListe=wz=>{ const g=wz==="marker"?ZMARKER:ZFARBEN; return [...g,...zgEigene().filter(c=>!g.includes(c))]; };
const zgSw=(c,aktiv)=>{ const eig=!ZFARBEN.includes(c)&&!ZMARKER.includes(c), an=c.toUpperCase()===String(aktiv||"").toUpperCase();
  return `<button class="zg-f${eig?" eigen":""}" data-z="farbe" data-v="${c}" style="--c:${c};--k:${zgKontrast(c)}" aria-pressed="${an}" aria-label="Farbe ${c}${eig?", gedrückt halten zum Entfernen":""}"${an?' title="Nochmal tippen: Farbe ändern"':""}></button>`; };
const zgKarussell=(liste,aktiv)=>`<div class="zg-farben" id="zgFarben">${liste.map(c=>zgSw(c,aktiv)).join("")}<button class="zg-b zg-fplus" data-z="farbeNeu" aria-label="Eigene Farbe anlegen" title="Eigene Farbe anlegen">${zgIc("plus")}</button></div>`;
const zgPunktKnopf=c=>`<button class="zg-b" data-z="farbPop" aria-label="Farbe" title="Farbe"><span class="zg-fdot" style="--c:${c}"></span></button>`;
const zgTr='<i class="zg-tr"></i>';
const zgKnopf=(z,v,ic,l,an)=>`<button class="zg-b" data-z="${z}"${v!=null?` data-v="${v}"`:""} aria-pressed="${!!an}" aria-label="${l}" title="${l}">${zgIc(ic)}</button>`;
const zgChip=(z,v,l,an)=>`<button class="zg-chip" data-z="${z}" data-v="${v}" aria-pressed="${!!an}">${l}</button>`;
function zgGroessen(k){ const c=ZG.cfg[k]; return [6,11,17].map((d,n)=>`<button class="zg-b zg-gr" data-z="gr" data-v="${n}" aria-pressed="${n===c.wi}" aria-label="Größe ${n+1} (${c.ws[n]})" title="Nochmal tippen: genau einstellen"><span class="zg-pt" style="--d:${d}px"></span></button>`).join(""); }
function zgTextOpt(s){ const fs=Math.round(s.fs||28), al=s.al||"l";
  return zgPunktKnopf(s.c)+zgTr+`<button class="zg-b" data-z="fsStufe" data-v="-1" aria-label="Schrift kleiner" title="Schrift kleiner">${zgIc("minus")}</button><button class="zg-chip zg-fsz" data-z="fsPop" aria-label="Schriftgröße ${fs}">${fs}</button><button class="zg-b" data-z="fsStufe" data-v="1" aria-label="Schrift größer" title="Schrift größer">${zgIc("plus")}</button>`
    +`<button class="zg-chip zg-fam" data-z="famPop" style="font-family:${zgEsc(zgFam(s))}">${(ZG_FAM[s.fam]||ZG_FAM.modern)[0]}${zgIc("chev")}</button>`+zgTr
    +zgKnopf("tFett",null,"fett","Fett",s.b)+zgKnopf("tKursiv",null,"kursiv","Kursiv",s.i)+zgKnopf("tUnter",null,"unter","Unterstrichen",s.u)+zgKnopf("tAl",null,"al_"+al,"Ausrichtung")+zgKnopf("bgPop",null,"bg","Hintergrund",!!s.bg); }
function zgOptBauen(){ if(!ZG) return; const o=ZG.ov.querySelector("#zgOpt"), c=ZG.cfg, wz=c.wz; let h="";
  if(!ZG.sel.length) ZG.selWz=false; const selO=ZG.sel.map(i=>ZG.striche[i]).filter(Boolean);
  if(ZG.edit) h=zgTextOpt(ZG.edit.s);
  else if(selO.length&&!ZG.selWz){ const txt=selO.filter(s=>s.t==="text"), str=selO.filter(s=>s.t!=="text"&&s.t!=="bild");
    if(!txt.length&&!str.length) h=`<span class="zg-hint">Bild verschieben, an den Ecken vergrößern, am Pfeil drehen</span>`;
    else if(txt.length===selO.length) h=zgTextOpt(txt[0]);
    else { h=txt.length?zgPunktKnopf(selO[0].c):zgKarussell(zgFarbListe(""),selO[0].c);
      if(txt.length) h+=zgTr+`<button class="zg-b" data-z="fsStufe" data-v="-1" aria-label="Schrift kleiner">${zgIc("minus")}</button><button class="zg-b" data-z="fsStufe" data-v="1" aria-label="Schrift größer">${zgIc("plus")}</button>`;
      if(str.length) h+=zgTr+`<button class="zg-chip" data-z="selStaerke">Stärke</button>`+zgKnopf("stilPop",null,"stil","Linienart");
      if(str.some(zgSchliessbar)) h+=zgKnopf("selFill",null,"fuellung","Füllung",str.some(s=>s.fill)); } }
  else if(wz==="lasso") h=zgKnopf("lassoArt","frei","lasso","Freihand einkreisen",c.lasso.art!=="box")+zgKnopf("lassoArt","box","box","Rechteck aufziehen",c.lasso.art==="box")+zgTr+`<span class="zg-hint">${c.lasso.art==="box"?"Rechteck aufziehen":"Einkreisen"} oder antippen</span>`+(ZG_CLIP?zgChip("einf","","Einfügen"):"")+(ZG.striche.length?zgChip("alle","","Alles auswählen"):"");
  else if(wz==="stift") h=zgKnopf("art","kugel","kugel","Kugelschreiber",c.stift.art!=="fueller")+zgKnopf("art","fueller","fueller","Füller (Druck und Tempo)",c.stift.art==="fueller")+(c.stift.art!=="fueller"?zgKnopf("stilPop",null,"stil","Linienart",!!c.stift.d):"")+zgTr+zgGroessen("stift")+zgTr+zgKarussell(zgFarbListe("stift"),c.stift.c);
  else if(wz==="marker") h=zgKnopf("gerade",null,"gerade","Gerade Linie",c.marker.gerade)+zgTr+zgGroessen("marker")+zgTr+zgKarussell(zgFarbListe("marker"),c.marker.c);
  else if(wz==="radierer") h=zgChip("radModus","strich","Ganzer Strich",c.radierer.modus!=="praezise")+zgChip("radModus","praezise","Präzise",c.radierer.modus==="praezise")+zgTr+zgChip("nurMarker","","Nur Marker",c.radierer.nurMarker)+zgTr+zgGroessen("radierer");
  else if(wz==="text") h=zgTextOpt(c.text);
  else if(wz==="form") h=`<button class="zg-b zg-mehrb" data-z="formPop" aria-label="Form wählen" title="Form wählen">${zgIc(c.form.art)}<i class="zg-mehr"></i></button>`+zgKnopf("formFill",null,"fuellung","Füllung",c.form.fill)+zgKnopf("stilPop",null,"stil","Linienart",!!c.form.d)+zgTr+zgGroessen("form")+zgTr+zgKarussell(zgFarbListe("form"),c.form.c);
  if(o.dataset.h!==h){ const alt=o.querySelector("#zgFarben"), sl=alt?alt.scrollLeft:0, gl=alt?alt.dataset.l:""; o.innerHTML=h; o.dataset.h=h; const f=o.querySelector("#zgFarben");
    if(f){ const l=[...f.querySelectorAll(".zg-f")].map(x=>x.dataset.v).join(); f.dataset.l=l; const gleich=l===gl; if(gleich) f.scrollLeft=sl;
      f.addEventListener("scroll",()=>zgFade(f),{passive:true}); zgFarbeZeigen(f,gleich); } }
  const ic=zgWzIc(c); ZG.ov.querySelectorAll('[data-z="wz"]').forEach(b=>{ b.setAttribute("aria-pressed",String(b.dataset.v===wz)); const n=zgIc(ic[b.dataset.v]); if(b.dataset.ic!==n){ b.innerHTML=n; b.dataset.ic=n; } }); }
/* Gewählte Farbe in die Mitte des Farbstreifens holen (ganz sichtbar, nie halb am Rand) */
function zgFarbeZeigen(f,weich){ const a=f.querySelector('.zg-f[aria-pressed="true"]'); if(a){ const L=a.offsetLeft-4, ziel=Math.max(0,Math.min(f.scrollWidth-f.clientWidth,L-(f.clientWidth-38)/2));
    if(Math.abs(ziel-f.scrollLeft)>1){ if(weich&&f.scrollTo) f.scrollTo({left:ziel,behavior:"smooth"}); else f.scrollLeft=ziel; } } zgFade(f); }
function zgFade(f){ f.classList.toggle("fl",f.scrollLeft>1); f.classList.toggle("fr",f.scrollLeft+f.clientWidth<f.scrollWidth-1); }
function zgWerkzeug(k){ if(ZG.ta) ZG.ta.blur(); ZG.cfg.wz=k; if(k!=="lasso") ZG.sel=[]; zgCfgSichern(); zgOptBauen(); zgMalen(); }
const zgFarbZiel=()=>({stift:"stift",marker:"marker",text:"text",form:"form"})[ZG.cfg.wz];
function zgFarbeSetzen(c){ c=c.toUpperCase();
  if(ZG.edit){ zgTextSetzen("c",()=>c); return; }
  if(ZG.sel.length){ zgSnap(); ZG.sel.forEach(i=>{ ZG.striche[i]={...ZG.striche[i],c}; }); if(ZG.selWz&&zgFarbZiel()){ ZG.cfg[zgFarbZiel()].c=c; zgCfgSichern(); } zgOptBauen(); zgMalen(); return; }
  let z=zgFarbZiel(); if(!z){ ZG.cfg.wz="stift"; z="stift"; } ZG.cfg[z].c=c; zgCfgSichern(); zgOptBauen(); zgMalen(); }
function zgFarbWahlOeffnen(btn,ersetzen){ const i=ZG.ov.querySelector("#zgFarbWahl"); if(!i) return; const r=btn.getBoundingClientRect(), [x,y]=zgRel(r.left+r.width/2,r.bottom);
  i.style.left=x+"px"; i.style.top=y+"px"; i.dataset.ersetzen=ersetzen||""; const akt=ZG.sel.length?ZG.striche[ZG.sel[0]].c:ZG.edit?ZG.edit.s.c:(ZG.cfg[zgFarbZiel()]||{}).c; i.value=/^#[0-9a-f]{6}$/i.test(akt||"")?akt.toLowerCase():"#1f1f22";
  if(i.showPicker) try{ i.showPicker(); return; }catch(e){} i.click(); }
function zgFarbeNeu(ev){ const c=String(ev.target.value||"").toUpperCase(); if(!/^#[0-9A-F]{6}$/.test(c)||!ZG) return; const alt=(ev.target.dataset.ersetzen||"").toUpperCase();
  if(!ZFARBEN.includes(c)&&!ZMARKER.includes(c)){ const e=zgEigene().filter(x=>x!==c), k=alt?e.indexOf(alt):-1; if(k>=0) e.splice(k,1,c); else e.push(c); zgEigeneSetzen(e); }
  zgPopZu(); zgFarbeSetzen(c); }
/* Eigene Farbe gedrückt halten ⇒ entfernen */
function zgFarbDruck(ev){ const t=ev.target.closest&&ev.target.closest(".zg-f.eigen"); clearTimeout(zgFarbDruck.t); if(!t) return;
  zgFarbDruck.t=setTimeout(()=>{ const c=t.dataset.v.toUpperCase(); zgEigeneSetzen(zgEigene().filter(x=>x!==c)); zgFarbDruck.weg=true; setTimeout(()=>zgFarbDruck.weg=false,600);
    t.remove(); toast("Farbe entfernt"); },600); }

/* --- Popups --- */
function zgPopZu(){ const p=ZG&&ZG.ov.querySelector("#zgPop"); if(p){ p.hidden=true; p.dataset.fuer=""; } }
function zgPop(btn,html,key,rechts){ const p=ZG.ov.querySelector("#zgPop"); if(!p.hidden&&p.dataset.fuer===key){ zgPopZu(); return; }
  p.dataset.fuer=key; p.innerHTML=html; p.hidden=false; const r=btn.getBoundingClientRect(), [x,y]=zgRel(r.left,r.bottom), w=p.offsetWidth, W=ZG.ov.clientWidth;
  p.style.top=(y+8)+"px"; p.style.left=Math.max(8,Math.min(W-w-8,rechts?x+r.width-w:x+r.width/2-w/2))+"px"; }
const zgPopZeile=(t,inh)=>`<div class="zg-pop-sec">${t}</div><div class="zg-pop-r">${inh}</div>`;
/* Seite gestalten: eigenes Fenster mit Format, Papier und Vorlagen als Vorschaubilder */
function zgSeiteBlatt(){ if(ZG.ta) ZG.ta.blur(); zgPopZu(); let el=ZG.ov.querySelector("#zgBlatt");
  if(!el){ el=document.createElement("div"); el.id="zgBlatt"; el.className="zg-blatt"; ZG.ov.appendChild(el); el.addEventListener("click",e=>{ if(e.target===el) el.hidden=true; }); }
  el.innerHTML=zgSeiteHtml(); el.hidden=false; }
function zgSeiteHtml(){ const S=ZG.seite, quer=S.format==="quer", pap=(ZG_PAPIER[S.papier]||ZG_PAPIER[""])[1], vw=quer?420:297, vh=quer?297:420;
  const ch=(z,v,l,an)=>`<button class="zg-rb" data-z="${z}" data-v="${v}" aria-pressed="${!!an}">${l}</button>`;
  const mini=r=>`<svg viewBox="0 0 ${vw} ${vh}" aria-hidden="true"><rect width="${vw}" height="${vh}" fill="${pap}"/>${zgRasterSvg({...S,raster:r},0,vh,{xa:0,xb:vw,fein:true})}</svg>`;
  const block=(t,inh)=>`<div><div class="zg-pop-sec">${t}</div>${inh}</div>`;
  const format=block("Format",`<div class="zg-formate">${[["hoch","Hochformat"],["quer","Querformat"]].map(([k,l])=>`<button class="zg-format" data-z="format" data-v="${k}" aria-pressed="${(S.format||"hoch")===k}">${zgIc(k)}${l}</button>`).join("")}</div>`);
  const papier=block("Papier",`<div class="zg-pop-r">${Object.entries(ZG_PAPIER).map(([k,[l,c]])=>`<button class="zg-rb zg-pap" data-z="papier" data-v="${k}" aria-pressed="${S.papier===k}" style="--c:${c}"><span></span>${l}</button>`).join("")}</div>`);
  const vorlage=block("Vorlage",`<div class="zg-vorlagen${quer?" quer":""}">${ZG_RASTER.map(([v,l])=>`<button class="zg-vorl" data-z="raster" data-v="${v}" aria-pressed="${S.raster===v}">${mini(v)}<span>${l}</span></button>`).join("")}</div>`);
  const groesse=S.raster&&S.raster!=="mm"?block("Rastergröße",`<div class="zg-pop-r">${ZG_RMM.map(m=>ch("rmm",m,m+" mm",S.rmm===m)).join("")}</div>`):"";
  const linien=S.raster?block("Linien",`<div class="zg-pop-r">${ZG_RS.map((l,k)=>ch("rs",k,l,(S.rs==null?1:S.rs)===k)).join("")}${zgTr}${ch("rf","grau","Grau",S.rf!=="blau")}${ch("rf","blau","Blau",S.rf==="blau")}</div>`):"";
  return `<div class="zg-blatt-k" role="dialog" aria-label="Papier und Vorlage">
    <div class="zg-blatt-kopf"><b>Papier und Vorlage</b><button class="zg-b" data-z="blattZu" aria-label="Schließen">${zgIc("zu")}</button></div>
    <div class="zg-blatt-zeile">${format}${papier}</div>${vorlage}${groesse||linien?`<div class="zg-blatt-zeile">${groesse}${linien}</div>`:""}
    <button class="zg-rb zg-rot zg-leer" data-z="leeren">${zgIc("leeren")}Alles löschen</button></div>`; }
function zgSeiteSetzen(k,v){ const alt=ZG.seite.format; ZG.seite={...ZG.seite,[k]:v}; ZG.seiteAend=true; ZG.cfg.seite={...ZG.seite}; zgCfgSichern();
  if(k==="format"&&v!==alt){ let unten=0; ZG.striche.forEach(s=>{ unten=Math.max(unten,zgBox(s)[3]); }); const basis=v==="quer"?707:1414; ZG.h=Math.max(basis,unten?Math.ceil((unten+350)/100)*100:0); zgLayout(); }
  const el=ZG.ov.querySelector("#zgBlatt"); if(el&&!el.hidden) el.innerHTML=zgSeiteHtml(); zgMalen(); }
function zgFarbenPop(btn){ const akt=ZG.sel.length?ZG.striche[ZG.sel[0]].c:ZG.edit?ZG.edit.s.c:ZG.cfg.text.c, liste=[...ZFARBEN,...ZMARKER,...zgEigene().filter(c=>!ZFARBEN.includes(c)&&!ZMARKER.includes(c))];
  zgPop(btn,`<div class="zg-pop-g">${liste.map(c=>zgSw(c,akt)).join("")}<button class="zg-b zg-fplus" data-z="farbeNeu" aria-label="Eigene Farbe anlegen">${zgIc("plus")}</button></div>`,"farben"); }

/* --- Klicks --- */
function zgKlick(ev){ const t=ev.target.closest("[data-z]"); if(!t||!ZG||t.tagName==="INPUT") return; const z=t.dataset.z, v=t.dataset.v, c=ZG.cfg;
  if(zgFarbDruck.weg){ zgFarbDruck.weg=false; return; }
  const imPop=!!t.closest("#zgPop");
  if(!imPop&&!["seite","abbr","farbPop","famPop","fsPop","bgPop","stilPop","formPop","selStaerke","gr"].includes(z)) zgPopZu();
  switch(z){
    case "abbr": if(!ZG.hist.length&&!ZG.seiteAend){ zgZu(false); return; } zgPop(t,`<div class="zg-pop-r"><span class="zg-pop-t">Änderungen verwerfen?</span><button class="zg-rb zg-rot" data-z="verwerfen">Verwerfen</button></div>`,"abbr"); return;
    case "verwerfen": zgZu(false); return;
    case "bild": if(ZG.ta) ZG.ta.blur(); ZG.bildPos=null; ZG.ov.querySelector("#zgBildWahl").click(); return;
    case "zoom1": zgZoomBei(ZG.vw/2,ZG.vh/2,1); return;
    case "ok": zgZu(true); return;
    case "wz": zgWerkzeug(v); return;
    case "undo": if(ZG.ta) ZG.ta.blur(); if(ZG.hist.length){ ZG.redo.push(ZG.striche); ZG.striche=ZG.hist.pop(); ZG.sel=[]; zgOptBauen(); zgMalen(); } return;
    case "redo": if(ZG.redo.length){ ZG.hist.push(ZG.striche); ZG.striche=ZG.redo.pop(); ZG.sel=[]; zgOptBauen(); zgMalen(); } return;
    case "farbe": if(t.getAttribute("aria-pressed")==="true"&&!imPop){ zgFarbWahlOeffnen(t,t.classList.contains("eigen")?v:""); return; } zgFarbeSetzen(v); if(imPop) zgPopZu(); return;
    case "farbeNeu": zgFarbWahlOeffnen(t,""); return;
    case "farbPop": zgFarbenPop(t); return;
    case "gr": { const k=zgFarbZiel()||c.wz, C=c[k]; if(!C||!C.ws) return; const n=+v;
      if(C.wi===n){ const max=k==="radierer"?80:k==="marker"?60:40; zgPop(t,`<div class="zg-pop-r zg-slider"><input type="range" min="1" max="${max}" step="0.5" value="${C.ws[n]}" data-z="grWert" data-k="${k}" data-n="${n}" aria-label="Größe"><span class="zg-wert">${C.ws[n]}</span></div>`,"gr"); return; }
      zgPopZu(); C.wi=n; zgCfgSichern();
      if(ZG.selWz&&ZG.sel.length){ zgSnap(); ZG.sel.forEach(i=>{ const s=ZG.striche[i]; if(s.t!=="text") ZG.striche[i]={...s,w:C.ws[n]}; }); zgMalen(); }
      zgOptBauen(); return; }
    case "lassoArt": c.lasso.art=v; zgCfgSichern(); zgOptBauen(); return;
    case "art": c.stift.art=v; zgCfgSichern(); zgOptBauen(); return;
    case "gerade": c.marker.gerade=!c.marker.gerade; zgCfgSichern(); zgOptBauen(); return;
    case "radModus": c.radierer.modus=v; zgCfgSichern(); zgOptBauen(); return;
    case "nurMarker": c.radierer.nurMarker=!c.radierer.nurMarker; zgCfgSichern(); zgOptBauen(); return;
    case "formPop": zgPop(t,`<div class="zg-pop-r">${ZG_FORMEN.map(([k,l])=>`<button class="zg-b" data-z="formArt" data-v="${k}" aria-pressed="${k===c.form.art}" aria-label="${l}" title="${l}">${zgIc(k)}</button>`).join("")}</div>`,"form"); return;
    case "formArt": c.form.art=v; zgCfgSichern(); zgPopZu(); zgOptBauen(); return;
    case "formFill": c.form.fill=!c.form.fill; zgCfgSichern(); zgOptBauen(); return;
    case "selFill": { const an=!ZG.sel.some(i=>ZG.striche[i].fill); zgSnap(); ZG.sel.forEach(i=>{ const s=ZG.striche[i]; if(zgSchliessbar(s)) ZG.striche[i]={...s,fill:an}; }); zgOptBauen(); zgMalen(); return; }
    case "stilPop": { const akt=ZG.sel.length?((ZG.sel.map(i=>ZG.striche[i]).find(s=>s.t!=="text")||{}).d||""):c.wz==="form"?c.form.d:c.stift.d;
      zgPop(t,`<div class="zg-pop-s">${ZG_STIL.map(([k,l])=>`<button class="zg-rb zg-stil" data-z="stil" data-v="${k}" aria-pressed="${(akt||"")===k}"><svg viewBox="0 0 60 8" aria-hidden="true"><path d="M4 4H56" stroke="currentColor" stroke-width="3" stroke-linecap="round"${k==="strich"?' stroke-dasharray="9 6"':k==="punkt"?' stroke-dasharray="0.1 7"':""}/></svg>${l}</button>`).join("")}</div>`,"stil"); return; }
    case "stil": zgPopZu(); if(ZG.sel.length){ zgSnap(); ZG.sel.forEach(i=>{ const s=ZG.striche[i]; if(s.t==="text"||s.t==="bild") return; if(s.t==="fueller"){ if(v) ZG.striche[i]={t:"stift",c:s.c,w:zgR(Math.max(1,s.w*.62)),p:s.p,d:v}; return; } const n={...s}; if(v) n.d=v; else delete n.d; ZG.striche[i]=n; }); zgMalen(); }
      else if(c.wz==="form") c.form.d=v; else c.stift.d=v; zgCfgSichern(); zgOptBauen(); return;
    case "selStaerke": { const s0=ZG.sel.map(i=>ZG.striche[i]).find(s=>s.t!=="text"&&s.t!=="bild"); if(!s0) return;
      zgPop(t,`<div class="zg-pop-r zg-slider"><input type="range" min="0.5" max="40" step="0.5" value="${s0.w}" data-z="selW" aria-label="Stärke"><span class="zg-wert">${s0.w}</span></div>`,"selW"); ZG.selWSnap=false; return; }
    case "fsStufe": { const r=+v; zgTextSetzen("fs",s=>{ const f=s.fs||28; if(r>0){ const n=ZG_FS.find(x=>x>f+.01); return n||ZG_FS[ZG_FS.length-1]; } const k=[...ZG_FS].reverse().find(x=>x<f-.01); return k||ZG_FS[0]; }); return; }
    case "fsPop": { const akt=Math.round((ZG.edit?ZG.edit.s:ZG.sel.length?ZG.striche[ZG.sel[0]]:c.text).fs||28); zgPop(t,`<div class="zg-pop-g zg-fsg">${ZG_FS.map(f=>`<button class="zg-rb" data-z="fs" data-v="${f}" aria-pressed="${f===akt}">${f}</button>`).join("")}</div>`,"fs"); return; }
    case "fs": zgPopZu(); zgTextSetzen("fs",()=>+v); return;
    case "famPop": { const akt=(ZG.edit?ZG.edit.s:ZG.sel.length?ZG.striche[ZG.sel[0]]:c.text).fam||"modern"; zgPop(t,`<div class="zg-pop-s">${Object.entries(ZG_FAM).map(([k,[l,f]])=>`<button class="zg-rb zg-links" data-z="fam" data-v="${k}" aria-pressed="${k===akt}" style="font-family:${zgEsc(f)}">${l}</button>`).join("")}</div>`,"fam"); return; }
    case "fam": zgPopZu(); zgTextSetzen("fam",()=>v); return;
    case "tFett": zgTextSetzen("b",s=>!s.b); return;
    case "tKursiv": zgTextSetzen("i",s=>!s.i); return;
    case "tUnter": zgTextSetzen("u",s=>!s.u); return;
    case "tAl": zgTextSetzen("al",s=>({l:"m",m:"r",r:"l"})[s.al||"l"]); return;
    case "bgPop": { const akt=(ZG.edit?ZG.edit.s:ZG.sel.length?ZG.striche[ZG.sel[0]]:c.text).bg||""; zgPop(t,`<div class="zg-pop-s">${ZG_BG.map(([k,l])=>`<button class="zg-rb zg-links" data-z="bg" data-v="${k}" aria-pressed="${k===akt}">${l}</button>`).join("")}</div>`,"bg"); return; }
    case "bg": zgPopZu(); zgTextSetzen("bg",()=>v); return;
    case "seite": zgSeiteBlatt(); return;
    case "blattZu": { const el=ZG.ov.querySelector("#zgBlatt"); if(el) el.hidden=true; return; }
    case "format": zgSeiteSetzen("format",v); return;
    case "papier": zgSeiteSetzen("papier",v); return;
    case "raster": zgSeiteSetzen("raster",v); return;
    case "rmm": zgSeiteSetzen("rmm",+v); return;
    case "rs": zgSeiteSetzen("rs",+v); return;
    case "rf": zgSeiteSetzen("rf",v); return;
    case "leeren": zgPopZu(); { const el=ZG.ov.querySelector("#zgBlatt"); if(el) el.hidden=true; } if(ZG.striche.length){ zgSnap(); ZG.striche=[]; ZG.sel=[]; zgOptBauen(); zgMalen(); toast("Zeichnung geleert","Rückgängig",()=>{ if(ZG&&ZG.hist.length){ ZG.redo.push(ZG.striche); ZG.striche=ZG.hist.pop(); zgMalen(); } }); } return;
    case "alle": ZG.sel=ZG.striche.map((s,i)=>i); ZG.selWz=false; zgOptBauen(); zgMalen(); return;
    case "einf": zgEinfuegen(); return;
    case "einfHier": zgPopZu(); ZG.cfg.wz="lasso"; zgEinfuegen(ZG.kPos); return;
    case "textHier": zgPopZu(); if(ZG.kPos) zgTextFeld(null,ZG.kPos[0],Math.max(0,ZG.kPos[1]-(ZG.cfg.text.fs||28)*.62)); return;
    case "bildHier": zgPopZu(); ZG.bildPos=ZG.kPos; ZG.ov.querySelector("#zgBildWahl").click(); return;
    case "selEdit": if(ZG.sel.length===1) zgTextFeld(ZG.sel[0]); return;
    case "selKopie": zgKopieren(); toast(ZG.sel.length===1?"Kopiert":"Kopiert ("+ZG.sel.length+")"); return;
    case "selAus": zgKopieren(); zgSelLoeschen(); return;
    case "selDup": { zgSnap(); const neu=ZG.sel.map(i=>{ const s=ZG.striche[i]; return {...s,p:s.p.map(x=>x+24)}; }); const n0=ZG.striche.length; ZG.striche.push(...neu); ZG.sel=neu.map((s,k)=>n0+k); zgOptBauen(); zgMalen(); return; }
    case "selDel": zgSelLoeschen(); return; } }
function zgEingabe(ev){ const t=ev.target; if(!ZG||!t.dataset||!t.dataset.z) return; const w=t.parentNode.querySelector(".zg-wert");
  if(t.dataset.z==="grWert"){ const C=ZG.cfg[t.dataset.k]; C.ws[+t.dataset.n]=+t.value; if(w) w.textContent=t.value; zgCfgSichern(); }
  else if(t.dataset.z==="selW"){ if(!ZG.selWSnap){ zgSnap(); ZG.selWSnap=true; } ZG.sel.forEach(i=>{ const s=ZG.striche[i]; if(s.t!=="text"&&s.t!=="bild") ZG.striche[i]={...s,w:+t.value}; }); if(w) w.textContent=t.value; zgMalen(); } }
/* Bild ins Blatt: liegt unter allem Geschriebenen, damit man darauf schreiben kann */
async function zgBildNeu(ev){ const f=ev.target.files&&ev.target.files[0]; ev.target.value=""; if(!f||!ZG) return;
  let data; try{ data=await fotoVerkleinern(f); }catch(e){ toast("Das Bild konnte nicht gelesen werden"); return; }
  const id=uid(); await fotoPut(id,data); try{ if(typeof fotoQueue==="function") fotoQueue(id); }catch(e){}
  const im=new Image(); im.onload=()=>{ if(!ZG) return; zgBilder.set(id,im); const vb=Math.min(700,(ZG.vw-80)/ZG.sk), w=Math.min(vb,1000-40), h=w*im.naturalHeight/Math.max(1,im.naturalWidth);
    const bp=ZG.bildPos; ZG.bildPos=null; const cx=Math.max(w/2+20,Math.min(1000-w/2-20,bp?bp[0]:(ZG.vw/2-ZG.px)/ZG.sk)), cy=Math.max(h/2+20,bp?bp[1]:(ZG.vh/2-ZG.top+ZG.sy)/ZG.sk);
    zgSnap(); ZG.striche.unshift({t:"bild",foto:id,p:[zgR(cx-w/2),zgR(cy-h/2),zgR(cx+w/2),zgR(cy+h/2)]}); ZG.cfg.wz="lasso"; ZG.sel=[0]; ZG.selWz=false; zgWachsen(cy+h/2); zgOptBauen(); zgScrollen(ZG.sy,true); };
  im.src=data; }
function zgKopieren(){ ZG_CLIP=ZG.sel.map(i=>({...ZG.striche[i],p:ZG.striche[i].p.slice()})); zgOptBauen(); }
function zgSelLoeschen(){ if(!ZG.sel.length) return; zgSnap(); const weg=new Set(ZG.sel); ZG.striche=ZG.striche.filter((s,i)=>!weg.has(i)); ZG.sel=[]; zgOptBauen(); zgMalen(); }
function zgEinfuegen(pos){ if(!ZG_CLIP||!ZG_CLIP.length) return; let a=Infinity,b=Infinity,c=-Infinity,d=-Infinity; ZG_CLIP.forEach(s=>{ const x=zgBox(s); a=Math.min(a,x[0]); b=Math.min(b,x[1]); c=Math.max(c,x[2]); d=Math.max(d,x[3]); });
  const mitte=(ZG.sy-ZG.top+ZG.vh/2)/ZG.sk; let dx=(ZG.vw/2-ZG.px)/ZG.sk-(a+c)/2, dy=Math.max(10,mitte-(d-b)/2)-b; if(pos){ dx=pos[0]-(a+c)/2; dy=Math.max(10-b,pos[1]-(b+d)/2); } zgSnap(); const n0=ZG.striche.length;
  ZG.striche.push(...ZG_CLIP.map(s=>({...s,p:s.p.map((v,j)=>zgR(j%2?v+dy:v+dx))}))); ZG.sel=ZG_CLIP.map((s,k)=>n0+k); ZG.selWz=false; zgWachsen(d+dy); zgOptBauen(); zgMalen(); }
function zgTaste(e){ if(!ZG||ZG.ta) return; const cmd=e.metaKey||e.ctrlKey, k=(e.key||"").toLowerCase();
  if(cmd&&k==="z"){ e.preventDefault(); ZG.ov.querySelector(`[data-z="${e.shiftKey?"redo":"undo"}"]`).click(); }
  else if((e.key==="Backspace"||e.key==="Delete")&&ZG.sel.length){ e.preventDefault(); zgSelLoeschen(); }
  else if(cmd&&k==="c"&&ZG.sel.length) zgKopieren();
  else if(cmd&&k==="v"&&ZG_CLIP){ e.preventDefault(); ZG.cfg.wz="lasso"; zgEinfuegen(); }
  else if(e.key==="Escape"&&ZG.sel.length){ ZG.sel=[]; zgOptBauen(); zgMalen(); } }
function zgZu(ok){ if(ZG.ta) ZG.ta.blur(); zgMomentStop(); zgCfgSichern();
  if(ok&&nEntw){ const b=nBlock(ZG.b.id); if(b){ const S=ZG.seite; b.striche=ZG.striche; b.h=ZG.h; b.raster=S.raster; b.rmm=S.rmm; b.rs=S.rs; b.rf=S.rf; b.papier=S.papier; b.format=S.format; nAuto(); } }
  if(ZG.ro) ZG.ro.disconnect(); else removeEventListener("resize",zgLayout); document.removeEventListener("keydown",ZG.taste); if(ZG.vvF&&window.visualViewport) visualViewport.removeEventListener("resize",ZG.vvF);
  ZG.ov.remove(); document.body.classList.remove("zg-offen"); ZG=null; nRender(); }
/* Für automatische Tests: Zustand lesbar machen (ändert nichts) */
try{ Object.defineProperty(window,"__zg",{get:()=>ZG,configurable:true}); window.__zgf={zgBox,zgBoxRoh,zgTextMass,zgGriffe,zgZentrum}; }catch(e){}
