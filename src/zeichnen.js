/* ===== Zeichnen (Notiz-Block „Zeichnung“) – v2 =====
   Eine Leiste oben: links Abbrechen / Rückgängig / Wiederholen, Mitte Werkzeuge + Farben (wischbar), rechts Stärke, Seite, Fertig.
   Werkzeuge: Auswahl (verschieben, duplizieren, löschen, umfärben), Stift, Textmarker, Formen (Linie, Pfeil, Rechteck, Kreis), Text, Radierer.
   Textfelder wie in GoodNotes: wachsen mit dem Text, Breite am Griff ziehbar, später bearbeiten, Größe und Fett einstellbar.
   Daten je Block: striche=[{t,c,w,p,o?} | {t:"text",v:2,p:[x,y oben-links],s,fs,c,bw?,b?}], h (Höhe bei Breite 1000), raster.
   Mit Apple Pencil zeichnet nur der Stift – die Hand auf dem Display wird beim Zeichnen ignoriert. */
const ZFARBEN=["#1F1F22","#C8102E","#1565C0","#2E7D32","#EF6C00","#F9A825","#6A1B9A","#00838F","#6D4C41","#9E9E9E"];
const ZG_W=[2,4,7,12,20];
const ZG_FS=[16,20,24,28,34,40,48,60,72,96];
const ZG_RASTER=[["","Leer"],["kaestchen","Kästchen"],["linien","Linien"],["punkte","Punkte"]];
const ZG_FORMEN=[["linie","Linie"],["pfeil","Pfeil"],["rechteck","Rechteck"],["kreis","Kreis"]];
const ZG_IST_FORM=k=>ZG_FORMEN.some(f=>f[0]===k);
const ZG_IC={
  auswahl:'<path d="M5 3l14 7.5-6.2 1.8L10 18.5z"/><path d="M13 12.5l5 5"/>',
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
  zu:'<path d="M6 6l12 12M18 6L6 18"/>',
  leeren:'<path d="M4 7h16"/><path d="M6.5 7l1 12.2A2 2 0 0 0 9.5 21h5a2 2 0 0 0 2-1.8l1-12.2"/><path d="M9.5 7V4h5v3"/>',
  seite:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M5 9h14M5 15h14M12 3v18"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  dup:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  edit:'<path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17z"/>',
  fett:'<path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z"/>',
  kleiner:'<path d="M4 18l4-11 4 11M5.5 14h5"/><path d="M15 12h6"/>',
  groesser:'<path d="M4 18l4-11 4 11M5.5 14h5"/><path d="M15 12h6M18 9v6"/>'};
const zgIc=k=>`<svg class="zg-ic" viewBox="0 0 24 24" aria-hidden="true">${ZG_IC[k]||""}</svg>`;
let ZG_LETZT={wz:"stift",form:"rechteck",farbe:ZFARBEN[0],w:4,fs:28};
function zgEigene(){ try{ const a=JSON.parse(localStorage.getItem("zg_farben")||"[]"); return Array.isArray(a)?a.filter(c=>/^#[0-9a-f]{6}$/i.test(c)).slice(0,12):[]; }catch(e){ return []; } }
function zgEigeneSetzen(a){ try{ localStorage.setItem("zg_farben",JSON.stringify(a.slice(-12))); }catch(e){} }

/* --- Text messen und umbrechen (gleich für Zeichenfläche und Vorschau) --- */
const zgMessCtx=(()=>{ try{ return document.createElement("canvas").getContext("2d"); }catch(e){ return null; } })();
const zgFont=s=>`${s.b?700:500} ${s.fs||28}px system-ui,-apple-system,"Segoe UI",Roboto,sans-serif`;
const zgLH=s=>(s.fs||28)*1.25;
function zgZeilen(s){ const c=zgMessCtx, roh=String(s.s||"").split("\n"); if(!c) return roh; c.font=zgFont(s); if(!s.bw) return roh;
  const out=[]; for(const z of roh){ let akt=""; for(const wort of z.split(/(\s+)/)){ const t=akt+wort; if(akt&&c.measureText(t.trimEnd()).width>s.bw){ out.push(akt.trimEnd()); akt=wort.trimStart(); } else akt=t;
      while(c.measureText(akt).width>s.bw&&akt.length>1){ let n=akt.length; while(n>1&&c.measureText(akt.slice(0,n)).width>s.bw) n--; out.push(akt.slice(0,n)); akt=akt.slice(n); } }
    out.push(akt); } return out; }
function zgTextMass(s){ const L=zgZeilen(s), c=zgMessCtx; let w=s.bw||0; if(!w){ if(c){ c.font=zgFont(s); w=Math.max(...L.map(l=>c.measureText(l).width),(s.fs||28)*.6); } else w=Math.max(...L.map(l=>l.length))*(s.fs||28)*.56; }
  return {L,w,h:Math.max(1,L.length)*zgLH(s)}; }

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
function zgPunkte(s){ const t=s.t||"stift", p=s.p||[]; if(t==="stift"||t==="marker") return p;
  if(t==="text"){ const m=zgTextMass(s), x=p[0], y=p[1]; return [x,y,x+m.w,y,x,y+m.h,x+m.w,y+m.h,x+m.w/2,y+m.h/2,x+m.w/4,y+m.h/2,x+3*m.w/4,y+m.h/2]; }
  const [x0,y0,x1,y1]=p, o=[], lin=(a,b,c,d)=>{ for(let i=0;i<=24;i++) o.push(a+(c-a)*i/24,b+(d-b)*i/24); };
  if(t==="linie"||t==="pfeil") lin(x0,y0,x1,y1);
  else if(t==="rechteck"){ lin(x0,y0,x1,y0); lin(x1,y0,x1,y1); lin(x1,y1,x0,y1); lin(x0,y1,x0,y0); }
  else if(t==="kreis"){ const cx=(x0+x1)/2, cy=(y0+y1)/2, rx=Math.abs(x1-x0)/2, ry=Math.abs(y1-y0)/2; for(let i=0;i<64;i++){ const a=i/64*Math.PI*2; o.push(cx+rx*Math.cos(a),cy+ry*Math.sin(a)); } }
  return o; }
function zgBox(s){ if(s.t==="text"){ const m=zgTextMass(s); return [s.p[0],s.p[1],s.p[0]+m.w,s.p[1]+m.h]; }
  const P=zgPunkte(s), w=(s.w||4)/2; let a=Infinity,b=Infinity,c=-Infinity,d=-Infinity; for(let i=0;i<P.length;i+=2){ a=Math.min(a,P[i]); c=Math.max(c,P[i]); b=Math.min(b,P[i+1]); d=Math.max(d,P[i+1]); }
  return [a-w,b-w,c+w,d+w]; }
function zBox(b){ let y0=Infinity,y1=-Infinity; for(const s of (b.striche||[])){ const [,t,,u]=zgBox(zgNorm(s)); y0=Math.min(y0,t); y1=Math.max(y1,u); }
  if(!isFinite(y0)) return [0,b.h||600]; y0=Math.max(0,y0-40); y1=Math.min(b.h||y1+40,y1+40); if(y1-y0<240){ const m=(y0+y1)/2; y0=Math.max(0,m-120); y1=y0+240; }
  return [Math.round(y0),Math.round(y1-y0)]; }
/* Texte aus der ersten Fassung (Grundlinie statt oben-links) umrechnen */
function zgNorm(s){ if(s.t==="text"&&s.v!==2) return {...s,v:2,p:[s.p[0],s.p[1]-(s.fs||32)*.95]}; return s; }
const zgEsc=t=>String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
function zgSvgEl(s){ s=zgNorm(s);
  if(s.t==="text"){ const m=zgTextMass(s), lh=zgLH(s); return `<text fill="${s.c}" font-size="${s.fs}" font-weight="${s.b?700:500}" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif">${m.L.map((z,i)=>`<tspan x="${s.p[0]}" y="${s.p[1]+i*lh+(s.fs||28)*.95}">${zgEsc(z)||" "}</tspan>`).join("")}</text>`; }
  return `<path d="${zgForm(s)}" stroke="${s.c}" stroke-width="${s.w}" fill="none" stroke-linecap="round" stroke-linejoin="round"${s.o?` stroke-opacity="${s.o}"`:""}/>`; }
function zgRasterSvg(r,id,y0,h){ if(!r) return "";
  const pat=r==="kaestchen"?`<path d="M40 0H0V40" fill="none" stroke="#D5DAE1" stroke-width="1.2"/>`:r==="linien"?`<path d="M0 40H40" fill="none" stroke="#D5DAE1" stroke-width="1.2"/>`:`<circle cx="20" cy="20" r="1.9" fill="#BFC6D0"/>`;
  return `<defs><pattern id="zr-${id}" width="40" height="40" patternUnits="userSpaceOnUse">${pat}</pattern></defs><rect x="0" y="${y0}" width="1000" height="${h}" fill="url(#zr-${id})"/>`; }
const zeichnungSvg=b=>{ const [y0,h]=zBox(b); return `<svg class="n-svg" viewBox="0 ${y0} 1000 ${h}" preserveAspectRatio="xMidYMid meet">${zgRasterSvg(b.raster,b.id,y0,h)}${(b.striche||[]).map(zgSvgEl).join("")}</svg>`; };

/* --- Editor --- */
let ZG=null;
const zgSw=(c,eigen,aktiv)=>`<button class="zg-f${eigen?" eigen":""}" data-z="farbe" data-v="${c}" style="--c:${c}" aria-pressed="${c===aktiv}" aria-label="Farbe ${c}${eigen?" – gedrückt halten zum Entfernen":""}"></button>`;
function zeichnenOeffnen(b){
  const L=ZG_LETZT, eig=zgEigene(), formIc=L.form||"rechteck";
  const wz=(k,l,ic)=>`<button class="zg-b" data-z="wz" data-v="${k}" aria-pressed="${k===L.wz||(k==="formen"&&ZG_IST_FORM(L.wz))}" aria-label="${l}" title="${l}">${zgIc(ic||k)}</button>`;
  const ov=document.createElement("div"); ov.className="zg"; ov.id="zg";
  ov.innerHTML=`<div class="zg-bar">
      <div class="zg-grp"><button class="zg-b" data-z="abbr" aria-label="Abbrechen" title="Abbrechen">${zgIc("zu")}</button>
        <button class="zg-b" data-z="undo" aria-label="Rückgängig" title="Rückgängig">${zgIc("undo")}</button>
        <button class="zg-b" data-z="redo" aria-label="Wiederholen" title="Wiederholen">${zgIc("redo")}</button></div>
      <div class="zg-mitte">
        <div class="zg-grp" role="toolbar" aria-label="Werkzeug">${wz("auswahl","Auswählen und verschieben")}${wz("stift","Stift")}${wz("marker","Textmarker")}<button class="zg-b zg-formen" data-z="wz" data-v="formen" aria-pressed="${ZG_IST_FORM(L.wz)}" aria-label="Formen" title="Formen (nochmal tippen zum Wechseln)">${zgIc(formIc)}<i class="zg-mehr"></i></button>${wz("text","Text")}${wz("radierer","Radierer")}</div>
        <div class="zg-grp zg-farbenbox"><div class="zg-farben" id="zgFarben">${ZFARBEN.map(c=>zgSw(c,false,L.farbe)).join("")}${eig.map(c=>zgSw(c,true,L.farbe)).join("")}<button class="zg-b zg-fplus" data-z="farbeNeu" aria-label="Eigene Farbe anlegen" title="Eigene Farbe anlegen">${zgIc("plus")}</button></div></div>
      </div>
      <div class="zg-grp"><button class="zg-b" data-z="dicke" aria-label="${L.wz==="text"?"Schriftgröße":"Strichstärke"}" title="Stärke / Schriftgröße">${L.wz==="text"?'<span class="zg-fsb" style="font-size:17px">Aa</span>':`<span class="zg-d" style="height:${Math.min(14,L.w)}px"></span>`}</button>
        <button class="zg-b" data-z="seite" aria-label="Seite: Raster, alles löschen" title="Seite">${zgIc("seite")}</button></div>
      <button class="zg-ok" data-z="ok">Fertig</button></div>
    <div class="zg-flaeche"><canvas></canvas></div>
    <div class="zg-sel" id="zgSel" hidden></div>
    <div class="zg-pop" id="zgPop" hidden></div>
    <input type="color" id="zgFarbWahl" class="zg-farbwahl" value="${L.farbe}" tabindex="-1" aria-hidden="true">`;
  document.body.appendChild(ov); document.body.classList.add("zg-offen");
  const fl=ov.querySelector(".zg-flaeche"), cv=ov.querySelector("canvas"), ctx=cv.getContext("2d");
  const r=fl.getBoundingClientRect(), dpr=window.devicePixelRatio||1;
  const h=(b.striche||[]).length?(b.h||Math.round(1000*r.height/r.width)):Math.round(1000*r.height/r.width);
  const sk=Math.min(r.width/1000,r.height/h), cw=1000*sk, ch=h*sk;
  cv.style.width=cw+"px"; cv.style.height=ch+"px"; cv.width=Math.round(cw*dpr); cv.height=Math.round(ch*dpr);
  ZG={b,h,sk,dpr,ctx,cv,striche:(b.striche||[]).map(zgNorm),hist:[],redo:[],raster:b.raster||"",wz:L.wz,form:L.form||"rechteck",farbe:L.farbe,w:L.w,fs:L.fs||28,akt:null,stift:false,radiert:false,sel:null,edit:null,zug:null};
  zgMalen();
  cv.addEventListener("pointerdown",zgDown); cv.addEventListener("pointermove",zgMove); cv.addEventListener("pointerup",zgUp); cv.addEventListener("pointercancel",zgUp);
  ov.addEventListener("click",zgKlick);
  ov.querySelector("#zgFarbWahl").addEventListener("change",zgFarbeNeu);
  ov.addEventListener("pointerdown",zgFarbDruck,true); ["pointerup","pointercancel","pointerleave"].forEach(t=>ov.addEventListener(t,()=>clearTimeout(zgFarbDruck.t),true));
  const akt=ov.querySelector('.zg-f[aria-pressed="true"]'); if(akt) akt.scrollIntoView({inline:"center",block:"nearest"});
}
function zgPunkt(ev){ const r=ZG.cv.getBoundingClientRect(); return [Math.round((ev.clientX-r.left)/ZG.sk),Math.round((ev.clientY-r.top)/ZG.sk)]; }
function zgMalen(){ const {ctx,dpr,sk}=ZG; ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,ZG.cv.width,ZG.cv.height); ctx.setTransform(dpr*sk,0,0,dpr*sk,0,0);
  zgRasterCanvas(ctx,ZG.raster,ZG.h);
  ZG.striche.forEach((s,i)=>{ if(i!==ZG.edit) zgZeichne(ctx,s); }); if(ZG.akt) zgZeichne(ctx,ZG.akt);
  zgAuswahlZeigen(); zgKnoepfe(); }
function zgKnoepfe(){ const u=document.querySelector('#zg [data-z="undo"]'), r=document.querySelector('#zg [data-z="redo"]'); if(u) u.disabled=!ZG.hist.length; if(r) r.disabled=!ZG.redo.length; }
function zgZeichne(ctx,s){ ctx.save(); ctx.globalAlpha=s.o||1;
  if(s.t==="text"){ const m=zgTextMass(s), lh=zgLH(s); ctx.fillStyle=s.c; ctx.font=zgFont(s); ctx.textBaseline="alphabetic"; m.L.forEach((z,i)=>ctx.fillText(z,s.p[0],s.p[1]+i*lh+s.fs*.95)); }
  else { ctx.strokeStyle=s.c; ctx.lineWidth=s.w; ctx.lineCap="round"; ctx.lineJoin="round"; ctx.stroke(new Path2D(zgForm(s))); }
  ctx.restore(); }
function zgRasterCanvas(ctx,r,h){ if(!r) return; ctx.save();
  if(r==="punkte"){ ctx.fillStyle="#BFC6D0"; for(let y=20;y<h;y+=40) for(let x=20;x<1000;x+=40){ ctx.beginPath(); ctx.arc(x,y,1.9,0,Math.PI*2); ctx.fill(); } }
  else { ctx.strokeStyle="#D5DAE1"; ctx.lineWidth=1.2; ctx.beginPath(); for(let y=40;y<h;y+=40){ ctx.moveTo(0,y); ctx.lineTo(1000,y); } if(r==="kaestchen") for(let x=40;x<1000;x+=40){ ctx.moveTo(x,0); ctx.lineTo(x,h); } ctx.stroke(); }
  ctx.restore(); }
function zgSnap(){ ZG.hist.push(ZG.striche.slice()); if(ZG.hist.length>150) ZG.hist.shift(); ZG.redo=[]; }
/* Objekt ändern ohne die Rückgängig-Kopie zu verändern: vorher klonen */
function zgKlon(i){ const s=ZG.striche[i], k={...s,p:s.p.slice()}; ZG.striche[i]=k; return k; }
function zgTreffer(x,y){ for(let i=ZG.striche.length-1;i>=0;i--){ const s=ZG.striche[i];
    if(s.t==="text"){ const [a,b,c,d]=zgBox(s); if(x>=a-10&&x<=c+10&&y>=b-10&&y<=d+10) return i; continue; }
    const P=zgPunkte(s), w=(s.w||4)/2+14; for(let k=0;k<P.length;k+=2) if(Math.hypot(P[k]-x,P[k+1]-y)<w) return i; }
  return null; }
function zgRadier(x,y){ const n=ZG.striche.length;
  ZG.striche=ZG.striche.filter(s=>{ if(s.t==="text"){ const [a,b,c,d]=zgBox(s); return !(x>=a&&x<=c&&y>=b&&y<=d); } const P=zgPunkte(s), w=s.w||4; for(let i=0;i<P.length;i+=2) if(Math.hypot(P[i]-x,P[i+1]-y)<14+w) return false; return true; });
  if(ZG.striche.length!==n){ ZG.sel=null; zgMalen(); } }

/* --- Auswahl: Rahmen, Griff (Textbreite) und kleine Leiste darüber --- */
function zgAuswahlZeigen(){ const bar=document.getElementById("zgSel"); if(!bar) return; const i=ZG.sel, s=i!=null&&ZG.striche[i];
  if(!s||ZG.edit!=null){ bar.hidden=true; return; }
  const {ctx}=ZG, [a,b,c,d]=zgBox(s), pad=8;
  ctx.save(); ctx.strokeStyle="#C8102E"; ctx.lineWidth=1.6/ZG.sk; ctx.setLineDash([6/ZG.sk,5/ZG.sk]); ctx.strokeRect(a-pad,b-pad,c-a+2*pad,d-b+2*pad); ctx.setLineDash([]);
  if(s.t==="text"){ ctx.fillStyle="#fff"; ctx.beginPath(); ctx.arc(c+pad,(b+d)/2,9/ZG.sk,0,Math.PI*2); ctx.fill(); ctx.stroke(); }
  ctx.restore();
  const t=s.t==="text";
  bar.innerHTML=(t?`<button class="zg-b" data-z="selEdit" aria-label="Text bearbeiten" title="Text bearbeiten">${zgIc("edit")}</button><button class="zg-b" data-z="selKlein" aria-label="Schrift kleiner" title="Schrift kleiner">${zgIc("kleiner")}</button><span class="zg-fs">${s.fs}</span><button class="zg-b" data-z="selGross" aria-label="Schrift größer" title="Schrift größer">${zgIc("groesser")}</button><button class="zg-b" data-z="selFett" aria-pressed="${!!s.b}" aria-label="Fett" title="Fett">${zgIc("fett")}</button><i class="zg-tr"></i>`:"")
    +`<button class="zg-b" data-z="selDup" aria-label="Duplizieren" title="Duplizieren">${zgIc("dup")}</button><button class="zg-b zg-rot" data-z="selDel" aria-label="Löschen" title="Löschen">${zgIc("leeren")}</button>`;
  bar.hidden=false; const r=ZG.cv.getBoundingClientRect(), bw=bar.offsetWidth, bh=bar.offsetHeight;
  let left=r.left+((a+c)/2)*ZG.sk-bw/2, top=r.top+(b-pad)*ZG.sk-bh-10; if(top<r.top+4) top=r.top+(d+pad)*ZG.sk+10;
  bar.style.left=Math.max(8,Math.min(innerWidth-bw-8,left))+"px"; bar.style.top=Math.max(8,top)+"px"; }

/* --- Zeiger --- */
function zgDown(ev){ zgPopZu(); const offen=document.getElementById("zgText"); if(offen){ ev.preventDefault(); offen.blur(); return; }
  if(ZG.pid!=null&&ZG.pid!==ev.pointerId) return;
  const finger=ev.pointerType==="touch"; if(ev.pointerType==="pen") ZG.stift=true;
  const zeichnet=!(ZG.wz==="auswahl"||ZG.wz==="text"); if(ZG.stift&&finger&&zeichnet) return;
  ev.preventDefault(); ZG.pid=ev.pointerId; try{ ZG.cv.setPointerCapture(ev.pointerId); }catch(e){} const [x,y]=zgPunkt(ev);
  if(ZG.wz==="auswahl"){ const i=ZG.sel, s=i!=null&&ZG.striche[i];
    if(s){ const [a,b,c,d]=zgBox(s);
      if(s.t==="text"&&Math.hypot(x-(c+8),y-(b+d)/2)<26){ zgSnap(); const k=zgKlon(i); ZG.zug={art:"breite",x0:k.p[0]}; return; }
      if(x>=a-12&&x<=c+12&&y>=b-12&&y<=d+12){ zgSnap(); zgKlon(i); ZG.zug={art:"ziehen",x,y,p:ZG.striche[i].p.slice(),bewegt:false}; return; } }
    const t=zgTreffer(x,y); ZG.sel=t; if(t!=null){ zgSnap(); zgKlon(t); ZG.zug={art:"ziehen",x,y,p:ZG.striche[t].p.slice(),bewegt:false}; } zgMalen(); return; }
  if(ZG.wz==="radierer"){ zgSnap(); ZG.radiert=true; ZG.vorRad=ZG.striche.length; zgRadier(x,y); return; }
  if(ZG.wz==="text"){ ZG.textAn=[x,y]; return; }
  ZG.sel=null; const t=ZG.wz, s={t,c:ZG.farbe,w:t==="marker"?Math.max(14,ZG.w*3):ZG.w,p:t==="stift"||t==="marker"?[x,y]:[x,y,x,y]}; if(t==="marker") s.o=.35;
  ZG.akt=s; zgMalen(); }
function zgMove(ev){ if(ZG.pid!==ev.pointerId) return; if(ZG.stift&&ev.pointerType==="touch"&&!(ZG.wz==="auswahl"||ZG.wz==="text")) return;
  const evs=ev.getCoalescedEvents?ev.getCoalescedEvents():[ev];
  if(ZG.zug){ const [x,y]=zgPunkt(ev), s=ZG.striche[ZG.sel]; if(!s) return;
    if(ZG.zug.art==="breite"){ s.bw=Math.max((s.fs||28)*2,x-8-ZG.zug.x0); }
    else { const dx=x-ZG.zug.x, dy=y-ZG.zug.y; if(Math.abs(dx)+Math.abs(dy)>2) ZG.zug.bewegt=true; s.p=ZG.zug.p.map((v,k)=>k%2?v+dy:v+dx); }
    zgMalen(); return; }
  for(const e of evs){ const [x,y]=zgPunkt(e);
    if(ZG.wz==="radierer"&&ZG.radiert) zgRadier(x,y);
    else if(ZG.akt){ const p=ZG.akt.p; if(ZG.akt.t==="stift"||ZG.akt.t==="marker"){ if(Math.hypot(p[p.length-2]-x,p[p.length-1]-y)>=2) p.push(x,y); } else { p[2]=x; p[3]=y; } } }
  if(ZG.akt) zgMalen(); }
function zgUp(ev){ if(ev&&ZG.pid!==ev.pointerId) return; ZG.pid=null;
  if(ZG.zug){ const z=ZG.zug; ZG.zug=null; if(z.art==="ziehen"&&!z.bewegt){ ZG.hist.pop(); } zgMalen(); return; }
  if(ZG.radiert){ ZG.radiert=false; if(ZG.striche.length===ZG.vorRad) ZG.hist.pop(); return; }
  if(ZG.textAn){ const [x,y]=ZG.textAn; ZG.textAn=null; const t=zgTreffer(x,y); if(t!=null&&ZG.striche[t].t==="text") zgTextFeld(t); else zgTextFeld(null,x,y-Math.round(ZG.fs*.6)); return; }
  if(ZG.akt){ const s=ZG.akt; ZG.akt=null;
    const flach=!(s.t==="stift"||s.t==="marker")&&Math.hypot(s.p[2]-s.p[0],s.p[3]-s.p[1])<4;
    if(!flach){ zgSnap(); ZG.striche.push(s); } zgMalen(); } }

/* --- Textfeld: wächst mit dem Text, bricht am Rand um, Enter = neue Zeile, Wegtippen übernimmt --- */
function zgTextFeld(i,x,y){ const alt=document.getElementById("zgText"); if(alt) alt.blur();
  const s=i!=null?ZG.striche[i]:{t:"text",v:2,p:[Math.max(0,x),Math.max(0,y)],s:"",fs:ZG.fs,c:ZG.farbe,b:false};
  ZG.edit=i; ZG.sel=null; zgMalen();
  const r=ZG.cv.getBoundingClientRect(), ta=document.createElement("textarea"); ta.id="zgText"; ta.className="zg-text"; ta.value=s.s||""; ta.rows=1; ta.spellcheck=true;
  Object.assign(ta.style,{left:(r.left+s.p[0]*ZG.sk-6)+"px",top:(r.top+s.p[1]*ZG.sk-2)+"px",fontSize:(s.fs*ZG.sk)+"px",lineHeight:(zgLH(s)*ZG.sk)+"px",color:s.c,fontWeight:s.b?700:500});
  document.getElementById("zg").appendChild(ta);
  const rechts=r.right-8, passen=()=>{ const tmp={...s,s:ta.value||" "}; let bw=s.bw;
      if(!bw){ const m=zgTextMass(tmp); if(r.left+(s.p[0]+m.w)*ZG.sk+20>rechts) bw=Math.max(s.fs*2,(rechts-r.left)/ZG.sk-s.p[0]-10); }
      const m=zgTextMass({...tmp,bw}); ta.style.width=(Math.max(m.w,s.fs*1.5)*ZG.sk+16)+"px"; ta.style.height=(m.h*ZG.sk+10)+"px"; ta._bw=bw; };
  passen(); ta.addEventListener("input",passen);
  let fertig=false; const ok=abbr=>{ if(fertig||!ZG) return; fertig=true; const v=ta.value.replace(/\s+$/,""); ta.remove(); ZG.edit=null;
    if(!abbr){ if(i!=null){ zgSnap(); if(!v){ ZG.striche.splice(i,1); } else { const k=zgKlon(i); k.s=v; k.bw=ta._bw||k.bw; } }
      else if(v){ zgSnap(); ZG.striche.push({...s,s:v,bw:ta._bw||undefined}); ZG.sel=ZG.wz==="auswahl"?ZG.striche.length-1:null; } }
    zgMalen(); };
  ta.addEventListener("keydown",e=>{ if(e.key==="Escape"){ e.preventDefault(); ok(true); } });
  ta.addEventListener("blur",()=>ok(false)); ta.focus(); }
function zgZu(ok){ const t=document.getElementById("zgText"); if(t) t.blur();
  ZG_LETZT={wz:ZG.wz==="radierer"||ZG.wz==="auswahl"?ZG_LETZT.wz:ZG.wz,form:ZG.form,farbe:ZG.farbe,w:ZG.w,fs:ZG.fs};
  if(ok&&nEntw){ const b=nBlock(ZG.b.id); if(b){ b.striche=ZG.striche; b.h=ZG.h; b.raster=ZG.raster; nAuto(); } }
  $("#zg").remove(); document.body.classList.remove("zg-offen"); ZG=null; nRender(); }
function zgPopZu(){ const p=document.getElementById("zgPop"); if(p) p.hidden=true; }
function zgPop(btn,html,key){ const p=document.getElementById("zgPop"); if(!p) return; const k=key||btn.dataset.z; if(!p.hidden&&p.dataset.fuer===k){ p.hidden=true; return; }
  p.dataset.fuer=k; p.innerHTML=html; p.hidden=false; const r=btn.getBoundingClientRect(), w=p.offsetWidth;
  p.style.top=(r.bottom+8)+"px"; p.style.left=Math.max(8,Math.min(innerWidth-w-8,r.left+r.width/2-w/2))+"px"; }
function zgFarbeSetzen(c){ ZG.farbe=c; document.querySelectorAll('#zg [data-z="farbe"]').forEach(x=>x.setAttribute("aria-pressed",String(x.dataset.v===c)));
  if(ZG.sel!=null&&ZG.striche[ZG.sel]){ zgSnap(); zgKlon(ZG.sel).c=c; zgMalen(); return; }
  if(ZG.wz==="radierer"||ZG.wz==="auswahl") zgWerkzeug("stift"); }
function zgWerkzeug(k){ ZG.wz=k; if(k!=="auswahl"){ ZG.sel=null; }
  document.querySelectorAll('#zg [data-z="wz"]').forEach(x=>x.setAttribute("aria-pressed",String(x.dataset.v===k||(x.dataset.v==="formen"&&ZG_IST_FORM(k)))));
  const f=document.querySelector("#zg .zg-formen"); if(f&&ZG_IST_FORM(k)){ ZG.form=k; f.firstElementChild.outerHTML=zgIc(k); }
  const d=document.querySelector('#zg [data-z="dicke"]'); if(d){ d.innerHTML=k==="text"?'<span class="zg-fsb" style="font-size:17px">Aa</span>':`<span class="zg-d" style="height:${Math.min(14,ZG.w)}px"></span>`; d.setAttribute("aria-label",k==="text"?"Schriftgröße":"Strichstärke"); }
  zgMalen(); }
function zgFarbeNeu(ev){ const c=String(ev.target.value||"").toUpperCase(); if(!/^#[0-9A-F]{6}$/.test(c)||!ZG) return;
  if(!ZFARBEN.includes(c)){ zgEigeneSetzen([...zgEigene().filter(x=>x.toUpperCase()!==c),c]); }
  const f=document.getElementById("zgFarben"); if(f&&!f.querySelector(`[data-v="${c}"]`)){ f.querySelector('[data-z="farbeNeu"]').insertAdjacentHTML("beforebegin",zgSw(c,true,c)); }
  zgFarbeSetzen(c); const n=f&&f.querySelector(`[data-v="${c}"]`); if(n) n.scrollIntoView({inline:"center",block:"nearest",behavior:"smooth"}); }
/* Eigene Farbe gedrückt halten ⇒ entfernen */
function zgFarbDruck(ev){ const t=ev.target.closest&&ev.target.closest(".zg-f.eigen"); clearTimeout(zgFarbDruck.t); if(!t) return;
  zgFarbDruck.t=setTimeout(()=>{ const c=t.dataset.v; zgEigeneSetzen(zgEigene().filter(x=>x.toUpperCase()!==c.toUpperCase())); t.remove(); zgFarbDruck.weg=true; setTimeout(()=>zgFarbDruck.weg=false,600);
    if(ZG&&ZG.farbe===c) zgFarbeSetzen(ZFARBEN[0]); toast("Farbe entfernt"); },600); }
function zgSchriftStufe(fs,r){ const i=ZG_FS.findIndex(v=>v>=fs); const j=Math.max(0,Math.min(ZG_FS.length-1,(i<0?ZG_FS.length-1:i)+r)); return ZG_FS[j]; }
function zgKlick(ev){ const t=ev.target.closest("[data-z]"); if(!t) return; const z=t.dataset.z;
  if(zgFarbDruck.weg){ zgFarbDruck.weg=false; return; }
  if(!["dicke","seite","w","r","fs","formen","form","abbr","verwerfen"].includes(z)&&!(z==="wz"&&t.dataset.v==="formen")) zgPopZu();
  if(z==="abbr"){ if(!ZG.hist.length){ zgZu(false); return; } zgPop(t,`<div class="zg-pop-r"><span class="zg-pop-t">Änderungen verwerfen?</span><button class="zg-rb zg-rot" data-z="verwerfen">Verwerfen</button></div>`); }
  else if(z==="verwerfen") zgZu(false);
  else if(z==="ok") zgZu(true);
  else if(z==="wz"){ const v=t.dataset.v;
    if(v==="formen"){ if(ZG_IST_FORM(ZG.wz)) zgPop(t,`<div class="zg-pop-r">${ZG_FORMEN.map(([k,l])=>`<button class="zg-b" data-z="form" data-v="${k}" aria-pressed="${k===ZG.wz}" aria-label="${l}" title="${l}">${zgIc(k)}</button>`).join("")}</div>`,"formen"); else zgWerkzeug(ZG.form||"rechteck"); }
    else zgWerkzeug(v); }
  else if(z==="form"){ zgWerkzeug(t.dataset.v); zgPopZu(); }
  else if(z==="farbe") zgFarbeSetzen(t.dataset.v);
  else if(z==="farbeNeu"){ const i=document.getElementById("zgFarbWahl"); if(i){ i.value=ZG.farbe; if(i.showPicker) try{ i.showPicker(); return; }catch(e){} i.click(); } }
  else if(z==="undo"){ if(ZG.hist.length){ ZG.redo.push(ZG.striche); ZG.striche=ZG.hist.pop(); ZG.sel=null; zgMalen(); } }
  else if(z==="redo"){ if(ZG.redo.length){ ZG.hist.push(ZG.striche); ZG.striche=ZG.redo.pop(); ZG.sel=null; zgMalen(); } }
  else if(z==="dicke"&&(ZG.wz==="text"||(ZG.sel!=null&&ZG.striche[ZG.sel]&&ZG.striche[ZG.sel].t==="text"))){ const akt=ZG.sel!=null&&ZG.striche[ZG.sel]?ZG.striche[ZG.sel].fs:ZG.fs;
    zgPop(t,`<div class="zg-pop-r">${ZG_FS.filter(v=>v<=72).map(v=>`<button class="zg-b zg-fsb" data-z="fs" data-v="${v}" aria-pressed="${v===akt}" aria-label="Schriftgröße ${v}" style="font-size:${Math.round(11+v/6)}px">A</button>`).join("")}</div>`); }
  else if(z==="fs"){ ZG.fs=+t.dataset.v; zgPopZu(); const s=ZG.sel!=null&&ZG.striche[ZG.sel]; if(s&&s.t==="text"){ zgSnap(); zgKlon(ZG.sel).fs=ZG.fs; zgMalen(); } }
  else if(z==="dicke") zgPop(t,`<div class="zg-pop-r">${ZG_W.map(w=>`<button class="zg-b" data-z="w" data-v="${w}" aria-pressed="${w===ZG.w}" aria-label="Stärke ${w}"><span class="zg-pt" style="width:${Math.max(4,w*1.4)}px;height:${Math.max(4,w*1.4)}px"></span></button>`).join("")}</div>`);
  else if(z==="w"){ ZG.w=+t.dataset.v; const d=document.querySelector('#zg [data-z="dicke"] .zg-d'); if(d) d.style.height=Math.min(14,ZG.w)+"px"; zgPopZu();
    const s=ZG.sel!=null&&ZG.striche[ZG.sel]; if(s&&s.t!=="text"){ zgSnap(); const k=zgKlon(ZG.sel); k.w=k.t==="marker"?Math.max(14,ZG.w*3):ZG.w; zgMalen(); } else if(ZG.wz==="radierer") zgWerkzeug("stift"); }
  else if(z==="seite") zgPop(t,`<div class="zg-pop-s"><div class="zg-pop-r">${ZG_RASTER.map(([v,l])=>`<button class="zg-rb" data-z="r" data-v="${v}" aria-pressed="${v===ZG.raster}">${l}</button>`).join("")}</div><button class="zg-rb zg-rot" data-z="leeren">${zgIc("leeren")}Alles löschen</button></div>`);
  else if(z==="r"){ ZG.raster=t.dataset.v; zgMalen(); zgPopZu(); }
  else if(z==="leeren"){ zgPopZu(); if(ZG.striche.length){ zgSnap(); ZG.striche=[]; ZG.sel=null; zgMalen(); toast("Zeichnung geleert","Rückgängig",()=>{ if(ZG&&ZG.hist.length){ ZG.redo.push(ZG.striche); ZG.striche=ZG.hist.pop(); zgMalen(); } }); } }
  else if(z.startsWith("sel")&&ZG.sel!=null&&ZG.striche[ZG.sel]){ const i=ZG.sel;
    if(z==="selEdit") zgTextFeld(i);
    else if(z==="selDel"){ zgSnap(); ZG.striche.splice(i,1); ZG.sel=null; zgMalen(); }
    else if(z==="selDup"){ zgSnap(); const s=ZG.striche[i], k={...s,p:s.p.map(v=>v+24)}; ZG.striche.push(k); ZG.sel=ZG.striche.length-1; zgMalen(); }
    else if(z==="selKlein"||z==="selGross"){ zgSnap(); const k=zgKlon(i); k.fs=zgSchriftStufe(k.fs||28,z==="selGross"?1:-1); ZG.fs=k.fs; zgMalen(); }
    else if(z==="selFett"){ zgSnap(); const k=zgKlon(i); k.b=!k.b; zgMalen(); } } }
