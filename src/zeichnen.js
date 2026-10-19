/* ===== Zeichnen (Notiz-Block „Zeichnung“) =====
   Werkzeuge: Stift, Textmarker, Linie, Pfeil, Rechteck, Kreis, Text, Radierer (ganze Striche).
   Raster: leer, Kästchen, Linien, Punkte. Eigene Farben werden auf dem Gerät gemerkt.
   Daten je Block: striche=[{t,c,w,p,o?,s?,fs?}], h (Höhe in Einheiten bei Breite 1000), raster.
   Mit Apple Pencil zeichnet nur der Stift – die Hand auf dem Display wird dann ignoriert. */
const ZFARBEN=["#1F1F22","#C8102E","#1565C0","#2E7D32","#EF6C00","#F9A825","#6A1B9A"];
const ZG_W=[2,4,7,12,20];
const ZG_RASTER=[["","Leer"],["kaestchen","Kästchen"],["linien","Linien"],["punkte","Punkte"]];
const ZG_WZ=[["stift","Stift"],["marker","Textmarker"],["linie","Linie"],["pfeil","Pfeil"],["rechteck","Rechteck"],["kreis","Kreis"],["text","Text"],["radierer","Radierer"]];
const ZG_IC={
  stift:'<path d="M4 20l1.2-4.4L16.4 4.4a2.1 2.1 0 0 1 3 3L8.2 18.8z"/><path d="M14.5 6.3l3.2 3.2"/>',
  marker:'<path d="M7 13.5l7.5-9 4.5 4.5-9 7.5z"/><path d="M7 13.5l-2 2 3.5 3.5 2-2"/><path d="M4 21h9"/>',
  linie:'<path d="M5 19L19 5"/>',
  pfeil:'<path d="M5 19L19 5"/><path d="M10 5h9v9"/>',
  rechteck:'<rect x="4" y="6" width="16" height="12" rx="1.5"/>',
  kreis:'<circle cx="12" cy="12" r="8"/>',
  text:'<path d="M5 7V5h14v2"/><path d="M12 5v14"/><path d="M9 19h6"/>',
  radierer:'<path d="M8.5 19.5h11"/><path d="M5.2 15.3l9.5-9.5a2 2 0 0 1 2.8 0l2.2 2.2a2 2 0 0 1 0 2.8L12 18.5H8.4z"/><path d="M9.8 10.7l5 5"/>',
  undo:'<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  redo:'<path d="M15 14l5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
  leeren:'<path d="M4 7h16"/><path d="M6.5 7l1 12.2A2 2 0 0 0 9.5 21h5a2 2 0 0 0 2-1.8l1-12.2"/><path d="M9.5 7V4h5v3"/>',
  raster:'<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 9.33h16M4 14.66h16M9.33 4v16M14.66 4v16"/>',
  plus:'<path d="M12 5v14M5 12h14"/>'};
const zgIc=k=>`<svg class="zg-ic" viewBox="0 0 24 24" aria-hidden="true">${ZG_IC[k]||""}</svg>`;
const zgSchrift=w=>({2:24,4:32,7:44,12:60,20:84})[w]||32;
let ZG_LETZT={wz:"stift",farbe:ZFARBEN[0],w:4};
function zgEigene(){ try{ const a=JSON.parse(localStorage.getItem("zg_farben")||"[]"); return Array.isArray(a)?a.filter(c=>/^#[0-9a-f]{6}$/i.test(c)).slice(0,10):[]; }catch(e){ return []; } }
function zgEigeneSetzen(a){ try{ localStorage.setItem("zg_farben",JSON.stringify(a.slice(0,10))); }catch(e){} }

/* --- Geometrie --- */
function strichPfad(p){ if(p.length<4) return p.length?`M${p[0]} ${p[1]}l0.1 0`:"";
  let d=`M${p[0]} ${p[1]}`; for(let i=2;i<p.length-2;i+=2){ const mx=(p[i]+p[i+2])/2, my=(p[i+1]+p[i+3])/2; d+=`Q${p[i]} ${p[i+1]} ${mx} ${my}`; }
  return d+`L${p[p.length-2]} ${p[p.length-1]}`; }
function zgForm(s){ const t=s.t||"stift", p=s.p||[];
  if(t==="stift"||t==="marker") return strichPfad(p);
  const [x0,y0,x1,y1]=p; if(x1==null) return "";
  if(t==="linie") return `M${x0} ${y0}L${x1} ${y1}`;
  if(t==="rechteck") return `M${x0} ${y0}H${x1}V${y1}H${x0}Z`;
  if(t==="kreis"){ const cx=(x0+x1)/2, cy=(y0+y1)/2, rx=Math.max(.5,Math.abs(x1-x0)/2), ry=Math.max(.5,Math.abs(y1-y0)/2);
    return `M${cx-rx} ${cy}a${rx} ${ry} 0 1 0 ${2*rx} 0a${rx} ${ry} 0 1 0 ${-2*rx} 0`; }
  if(t==="pfeil"){ const a=Math.atan2(y1-y0,x1-x0), L=Math.max(18,(s.w||4)*3.5), k=.45;
    return `M${x0} ${y0}L${x1} ${y1}M${x1-L*Math.cos(a-k)} ${y1-L*Math.sin(a-k)}L${x1} ${y1}L${x1-L*Math.cos(a+k)} ${y1-L*Math.sin(a+k)}`; }
  return ""; }
/* Punkte zum Treffen (Radierer) und für den Ausschnitt der Vorschau */
function zgPunkte(s){ const t=s.t||"stift", p=s.p||[]; if(t==="stift"||t==="marker") return p;
  if(t==="text"){ const fs=s.fs||32, b=String(s.s||"").length*fs*.56; return [p[0],p[1],p[0]+b,p[1],p[0],p[1]-fs,p[0]+b,p[1]-fs,p[0]+b/2,p[1]-fs/2,p[0]+b/4,p[1]-fs/2,p[0]+3*b/4,p[1]-fs/2]; }
  const [x0,y0,x1,y1]=p, o=[], lin=(a,b,c,d)=>{ for(let i=0;i<=24;i++) o.push(a+(c-a)*i/24,b+(d-b)*i/24); };
  if(t==="linie"||t==="pfeil") lin(x0,y0,x1,y1);
  else if(t==="rechteck"){ lin(x0,y0,x1,y0); lin(x1,y0,x1,y1); lin(x1,y1,x0,y1); lin(x0,y1,x0,y0); }
  else if(t==="kreis"){ const cx=(x0+x1)/2, cy=(y0+y1)/2, rx=Math.abs(x1-x0)/2, ry=Math.abs(y1-y0)/2; for(let i=0;i<64;i++){ const a=i/64*Math.PI*2; o.push(cx+rx*Math.cos(a),cy+ry*Math.sin(a)); } }
  return o; }
function zBox(b){ let y0=Infinity,y1=-Infinity;
  for(const s of (b.striche||[])){ const P=zgPunkte(s), w=s.t==="text"?4:(s.w||4); for(let i=1;i<P.length;i+=2){ y0=Math.min(y0,P[i]-w); y1=Math.max(y1,P[i]+w); } }
  if(!isFinite(y0)) return [0,b.h||600]; y0=Math.max(0,y0-40); y1=Math.min(b.h||y1+40,y1+40); if(y1-y0<240){ const m=(y0+y1)/2; y0=Math.max(0,m-120); y1=y0+240; }
  return [Math.round(y0),Math.round(y1-y0)]; }
const zgEsc=t=>String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
function zgSvgEl(s){
  if(s.t==="text") return `<text x="${s.p[0]}" y="${s.p[1]}" fill="${s.c}" font-size="${s.fs||32}" font-weight="600" font-family="system-ui,-apple-system,Segoe UI,sans-serif">${zgEsc(s.s||"")}</text>`;
  return `<path d="${zgForm(s)}" stroke="${s.c}" stroke-width="${s.w}" fill="none" stroke-linecap="round" stroke-linejoin="round"${s.o?` stroke-opacity="${s.o}"`:""}/>`; }
function zgRasterSvg(r,id,y0,h){ if(!r) return "";
  const pat=r==="kaestchen"?`<path d="M40 0H0V40" fill="none" stroke="#D5DAE1" stroke-width="1.2"/>`:r==="linien"?`<path d="M0 40H40" fill="none" stroke="#D5DAE1" stroke-width="1.2"/>`:`<circle cx="20" cy="20" r="1.9" fill="#BFC6D0"/>`;
  return `<defs><pattern id="zr-${id}" width="40" height="40" patternUnits="userSpaceOnUse">${pat}</pattern></defs><rect x="0" y="${y0}" width="1000" height="${h}" fill="url(#zr-${id})"/>`; }
const zeichnungSvg=b=>{ const [y0,h]=zBox(b); return `<svg class="n-svg" viewBox="0 ${y0} 1000 ${h}" preserveAspectRatio="xMidYMid meet">${zgRasterSvg(b.raster,b.id,y0,h)}${(b.striche||[]).map(zgSvgEl).join("")}</svg>`; };

/* --- Editor --- */
let ZG=null;
function zeichnenOeffnen(b){
  const L=ZG_LETZT, eig=zgEigene();
  const sw=(c,eigen)=>`<button class="zg-f${eigen?" eigen":""}" data-z="farbe" data-v="${c}" style="--c:${c}" aria-pressed="${c===L.farbe}" aria-label="Farbe ${c}${eigen?" (gedrückt halten zum Entfernen)":""}"></button>`;
  const ov=document.createElement("div"); ov.className="zg"; ov.id="zg";
  ov.innerHTML=`<div class="zg-bar">
      <button class="zg-txt" data-z="abbr">Abbrechen</button>
      <div class="zg-mitte">
        <div class="zg-grp" role="toolbar" aria-label="Werkzeug">${ZG_WZ.map(([k,l])=>`<button class="zg-b" data-z="wz" data-v="${k}" aria-pressed="${k===L.wz}" aria-label="${l}" title="${l}">${zgIc(k)}</button>`).join("")}</div>
        <div class="zg-grp zg-farben" id="zgFarben">${ZFARBEN.map(c=>sw(c)).join("")}${eig.map(c=>sw(c,true)).join("")}<button class="zg-b" data-z="farbeNeu" aria-label="Eigene Farbe anlegen" title="Eigene Farbe anlegen">${zgIc("plus")}</button></div>
        <div class="zg-grp">
          <button class="zg-b" data-z="dicke" aria-label="Strichstärke" title="Strichstärke"><span class="zg-d" style="height:${Math.min(14,L.w)}px"></span></button>
          <button class="zg-b" data-z="raster" aria-label="Raster" title="Raster">${zgIc("raster")}</button>
          <button class="zg-b" data-z="undo" aria-label="Rückgängig" title="Rückgängig">${zgIc("undo")}</button>
          <button class="zg-b" data-z="redo" aria-label="Wiederholen" title="Wiederholen">${zgIc("redo")}</button>
          <button class="zg-b" data-z="leeren" aria-label="Alles löschen" title="Alles löschen">${zgIc("leeren")}</button></div>
      </div>
      <button class="zg-ok" data-z="ok">Fertig</button></div>
    <div class="zg-flaeche"><canvas></canvas></div>
    <div class="zg-pop" id="zgPop" hidden></div>
    <input type="color" id="zgFarbWahl" class="zg-farbwahl" value="${L.farbe}" tabindex="-1" aria-hidden="true">`;
  document.body.appendChild(ov); document.body.classList.add("zg-offen");
  const fl=ov.querySelector(".zg-flaeche"), cv=ov.querySelector("canvas"), ctx=cv.getContext("2d");
  const r=fl.getBoundingClientRect(), dpr=window.devicePixelRatio||1;
  const h=(b.striche||[]).length?(b.h||Math.round(1000*r.height/r.width)):Math.round(1000*r.height/r.width);
  const sk=Math.min(r.width/1000,r.height/h), cw=1000*sk, ch=h*sk;
  cv.style.width=cw+"px"; cv.style.height=ch+"px"; cv.width=Math.round(cw*dpr); cv.height=Math.round(ch*dpr);
  ZG={b,h,sk,dpr,ctx,cv,striche:(b.striche||[]).slice(),hist:[],redo:[],raster:b.raster||"",wz:L.wz,farbe:L.farbe,w:L.w,akt:null,stift:false,radiert:false};
  zgMalen();
  cv.addEventListener("pointerdown",zgDown); cv.addEventListener("pointermove",zgMove); cv.addEventListener("pointerup",zgUp); cv.addEventListener("pointercancel",zgUp);
  ov.addEventListener("click",zgKlick);
  ov.querySelector("#zgFarbWahl").addEventListener("change",zgFarbeNeu);
  ov.addEventListener("pointerdown",zgFarbDruck,true); ["pointerup","pointercancel","pointerleave"].forEach(t=>ov.addEventListener(t,()=>clearTimeout(zgFarbDruck.t),true));
}
function zgPunkt(ev){ const r=ZG.cv.getBoundingClientRect(); return [Math.round((ev.clientX-r.left)/ZG.sk),Math.round((ev.clientY-r.top)/ZG.sk)]; }
function zgMalen(){ const {ctx,dpr,sk}=ZG; ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,ZG.cv.width,ZG.cv.height); ctx.setTransform(dpr*sk,0,0,dpr*sk,0,0);
  zgRasterCanvas(ctx,ZG.raster,ZG.h);
  for(const s of [...ZG.striche,...(ZG.akt?[ZG.akt]:[])]) zgZeichne(ctx,s); }
function zgZeichne(ctx,s){ ctx.save(); ctx.globalAlpha=s.o||1;
  if(s.t==="text"){ ctx.fillStyle=s.c; ctx.font=`600 ${s.fs||32}px system-ui,-apple-system,"Segoe UI",sans-serif`; ctx.fillText(s.s||"",s.p[0],s.p[1]); }
  else { ctx.strokeStyle=s.c; ctx.lineWidth=s.w; ctx.lineCap="round"; ctx.lineJoin="round"; ctx.stroke(new Path2D(zgForm(s))); }
  ctx.restore(); }
function zgRasterCanvas(ctx,r,h){ if(!r) return; ctx.save();
  if(r==="punkte"){ ctx.fillStyle="#BFC6D0"; for(let y=20;y<h;y+=40) for(let x=20;x<1000;x+=40){ ctx.beginPath(); ctx.arc(x,y,1.9,0,Math.PI*2); ctx.fill(); } }
  else { ctx.strokeStyle="#D5DAE1"; ctx.lineWidth=1.2; ctx.beginPath(); for(let y=40;y<h;y+=40){ ctx.moveTo(0,y); ctx.lineTo(1000,y); } if(r==="kaestchen") for(let x=40;x<1000;x+=40){ ctx.moveTo(x,0); ctx.lineTo(x,h); } ctx.stroke(); }
  ctx.restore(); }
function zgSnap(){ ZG.hist.push(ZG.striche.slice()); if(ZG.hist.length>150) ZG.hist.shift(); ZG.redo=[]; }
function zgRadier(x,y){ const n=ZG.striche.length, rad=14;
  ZG.striche=ZG.striche.filter(s=>{ const P=zgPunkte(s), w=s.t==="text"?(s.fs||32)/2:(s.w||4); for(let i=0;i<P.length;i+=2) if(Math.hypot(P[i]-x,P[i+1]-y)<rad+w) return false; return true; });
  if(ZG.striche.length!==n) zgMalen(); }
function zgDown(ev){ zgPopZu(); if(ev.pointerType==="pen") ZG.stift=true; if(ZG.stift&&ev.pointerType==="touch") return;
  ev.preventDefault(); ZG.cv.setPointerCapture(ev.pointerId); const [x,y]=zgPunkt(ev);
  if(ZG.wz==="radierer"){ zgSnap(); ZG.radiert=true; ZG.vorRad=ZG.striche.length; zgRadier(x,y); return; }
  if(ZG.wz==="text"){ ZG.textAn=[x,y]; return; }
  const t=ZG.wz, s={t,c:ZG.farbe,w:t==="marker"?Math.max(14,ZG.w*3):ZG.w,p:t==="stift"||t==="marker"?[x,y]:[x,y,x,y]}; if(t==="marker") s.o=.35;
  ZG.akt=s; zgMalen(); }
function zgMove(ev){ if(ZG.stift&&ev.pointerType==="touch") return; const evs=ev.getCoalescedEvents?ev.getCoalescedEvents():[ev];
  for(const e of evs){ const [x,y]=zgPunkt(e);
    if(ZG.wz==="radierer"&&ZG.radiert) zgRadier(x,y);
    else if(ZG.akt){ const p=ZG.akt.p; if(ZG.akt.t==="stift"||ZG.akt.t==="marker"){ if(Math.hypot(p[p.length-2]-x,p[p.length-1]-y)>=2) p.push(x,y); } else { p[2]=x; p[3]=y; } } }
  if(ZG.akt) zgMalen(); }
function zgUp(ev){
  if(ZG.radiert){ ZG.radiert=false; if(ZG.striche.length===ZG.vorRad) ZG.hist.pop(); return; }
  if(ZG.textAn){ const [x,y]=ZG.textAn; ZG.textAn=null; zgTextFeld(x,y); return; }
  if(ZG.akt){ const s=ZG.akt; ZG.akt=null;
    const flach=!(s.t==="stift"||s.t==="marker")&&Math.hypot(s.p[2]-s.p[0],s.p[3]-s.p[1])<4;
    if(!flach){ zgSnap(); ZG.striche.push(s); } zgMalen(); } }
/* Text: Feld direkt an der Tippstelle, Enter oder Wegtippen übernimmt */
function zgTextFeld(x,y){ const alt=document.getElementById("zgText"); if(alt) alt.blur();
  const fs=zgSchrift(ZG.w), r=ZG.cv.getBoundingClientRect(), i=document.createElement("input");
  i.id="zgText"; i.className="zg-text"; i.setAttribute("enterkeyhint","done"); i.autocomplete="off";
  Object.assign(i.style,{left:(r.left+x*ZG.sk)+"px",top:(r.top+(y-fs*.85)*ZG.sk)+"px",fontSize:(fs*ZG.sk)+"px",color:ZG.farbe});
  document.getElementById("zg").appendChild(i);
  let fertig=false; const ok=()=>{ if(fertig||!ZG) return; fertig=true; const v=i.value.trim(); i.remove(); if(v){ zgSnap(); ZG.striche.push({t:"text",c:ZG.farbe,p:[x,y],s:v,fs}); zgMalen(); } };
  i.addEventListener("keydown",e=>{ if(e.key==="Enter"){ e.preventDefault(); ok(); } else if(e.key==="Escape"){ fertig=true; i.remove(); } });
  i.addEventListener("blur",ok); i.focus(); }
function zgZu(ok){ const t=document.getElementById("zgText"); if(t) t.blur();
  ZG_LETZT={wz:ZG.wz==="radierer"||ZG.wz==="text"?ZG_LETZT.wz:ZG.wz,farbe:ZG.farbe,w:ZG.w};
  if(ok&&nEntw){ const b=nBlock(ZG.b.id); if(b){ b.striche=ZG.striche; b.h=ZG.h; b.raster=ZG.raster; nAuto(); } }
  $("#zg").remove(); document.body.classList.remove("zg-offen"); ZG=null; nRender(); }
function zgPopZu(){ const p=document.getElementById("zgPop"); if(p) p.hidden=true; }
function zgPop(btn,html){ const p=document.getElementById("zgPop"); if(!p) return; if(!p.hidden&&p.dataset.fuer===btn.dataset.z){ p.hidden=true; return; }
  p.dataset.fuer=btn.dataset.z; p.innerHTML=html; p.hidden=false; const r=btn.getBoundingClientRect(), w=p.offsetWidth;
  p.style.top=(r.bottom+8)+"px"; p.style.left=Math.max(8,Math.min(innerWidth-w-8,r.left+r.width/2-w/2))+"px"; }
function zgFarbeSetzen(c){ ZG.farbe=c; document.querySelectorAll('#zg [data-z="farbe"]').forEach(x=>x.setAttribute("aria-pressed",String(x.dataset.v===c)));
  if(ZG.wz==="radierer") zgWerkzeug("stift"); }
function zgWerkzeug(k){ ZG.wz=k; document.querySelectorAll('#zg [data-z="wz"]').forEach(x=>x.setAttribute("aria-pressed",String(x.dataset.v===k))); }
function zgFarbeNeu(ev){ const c=String(ev.target.value||"").toUpperCase(); if(!/^#[0-9A-F]{6}$/.test(c)||!ZG) return;
  const a=zgEigene().filter(x=>x.toUpperCase()!==c); if(!ZFARBEN.includes(c)){ a.push(c); zgEigeneSetzen(a.slice(-10)); }
  const f=document.getElementById("zgFarben"); if(f&&!f.querySelector(`[data-v="${c}"]`)) f.querySelector('[data-z="farbeNeu"]').insertAdjacentHTML("beforebegin",`<button class="zg-f eigen" data-z="farbe" data-v="${c}" style="--c:${c}" aria-pressed="false" aria-label="Farbe ${c} (gedrückt halten zum Entfernen)"></button>`);
  zgFarbeSetzen(c); }
/* Eigene Farbe gedrückt halten ⇒ entfernen */
function zgFarbDruck(ev){ const t=ev.target.closest&&ev.target.closest(".zg-f.eigen"); clearTimeout(zgFarbDruck.t); if(!t) return;
  zgFarbDruck.t=setTimeout(()=>{ const c=t.dataset.v; zgEigeneSetzen(zgEigene().filter(x=>x.toUpperCase()!==c.toUpperCase())); t.remove(); zgFarbDruck.weg=true; setTimeout(()=>zgFarbDruck.weg=false,600);
    if(ZG&&ZG.farbe===c) zgFarbeSetzen(ZFARBEN[0]); toast("Farbe entfernt"); },600); }
function zgKlick(ev){ const t=ev.target.closest("[data-z]"); if(!t) return; const z=t.dataset.z;
  if(zgFarbDruck.weg){ zgFarbDruck.weg=false; return; }
  if(z!=="dicke"&&z!=="raster"&&z!=="w"&&z!=="r") zgPopZu();
  if(z==="abbr") zgZu(false); else if(z==="ok") zgZu(true);
  else if(z==="wz") zgWerkzeug(t.dataset.v);
  else if(z==="farbe") zgFarbeSetzen(t.dataset.v);
  else if(z==="farbeNeu"){ const i=document.getElementById("zgFarbWahl"); if(i){ i.value=ZG.farbe; if(i.showPicker) try{ i.showPicker(); return; }catch(e){} i.click(); } }
  else if(z==="undo"){ if(ZG.hist.length){ ZG.redo.push(ZG.striche); ZG.striche=ZG.hist.pop(); zgMalen(); } }
  else if(z==="redo"){ if(ZG.redo.length){ ZG.hist.push(ZG.striche); ZG.striche=ZG.redo.pop(); zgMalen(); } }
  else if(z==="leeren"){ if(ZG.striche.length){ zgSnap(); ZG.striche=[]; zgMalen(); toast("Zeichnung geleert","Rückgängig",()=>{ if(ZG&&ZG.hist.length){ ZG.redo.push(ZG.striche); ZG.striche=ZG.hist.pop(); zgMalen(); } }); } }
  else if(z==="dicke") zgPop(t,`<div class="zg-pop-r">${ZG_W.map(w=>`<button class="zg-b" data-z="w" data-v="${w}" aria-pressed="${w===ZG.w}" aria-label="Stärke ${w}"><span class="zg-pt" style="width:${Math.max(4,w*1.4)}px;height:${Math.max(4,w*1.4)}px"></span></button>`).join("")}</div>`);
  else if(z==="w"){ ZG.w=+t.dataset.v; const d=document.querySelector('#zg [data-z="dicke"] .zg-d'); if(d) d.style.height=Math.min(14,ZG.w)+"px"; zgPopZu(); if(ZG.wz==="radierer") zgWerkzeug("stift"); }
  else if(z==="raster") zgPop(t,`<div class="zg-pop-r">${ZG_RASTER.map(([v,l])=>`<button class="zg-rb" data-z="r" data-v="${v}" aria-pressed="${v===ZG.raster}">${l}</button>`).join("")}</div>`);
  else if(z==="r"){ ZG.raster=t.dataset.v; zgMalen(); zgPopZu(); } }
