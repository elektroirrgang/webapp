/* ===== Fotos markieren (alle Apps, 04.11.2026) =====
   Pfeil, Maß (Doppelpfeil mit Beschriftung), Rechteck, Kreis, Text und Stift direkt aufs Foto – z. B. Leitungswege vor dem Verputzen.
   Aufruf: fmKnopf(quelle, ersetze) liefert den Knopf „Markieren“ für ein Foto-Fenster.
     quelle: Bildadresse (data:, blob:) oder async-Funktion, die eine liefert
     ersetze: async (dataUrl) => …  – speichert die markierte Fassung (JPEG) an der passenden Stelle
   Die Markierungen werden ins Bild gerechnet; jede App entscheidet selbst, ob das Original bleibt (Dateien: Kopie) oder ersetzt wird. */
const FM_IC={
  auswahl:'<path d="M6 3.5l12 7.2-5.2 1.3 3.1 6-2.4 1.2-3-6-4.5 3.5z"/>',
  stift:'<path d="M4 20l1.2-4.4L16.4 4.4a2.1 2.1 0 0 1 3 3L8.2 18.8z"/><path d="M14.5 6.3l3.2 3.2"/>',
  pfeil:'<path d="M5 19L19 5"/><path d="M10 5h9v9"/>',
  mass:'<path d="M5 19L19 5"/><path d="M11 5h8v8"/><path d="M13 19H5v-8"/>',
  rechteck:'<rect x="4" y="6" width="16" height="12" rx="1"/>',
  kreis:'<circle cx="12" cy="12" r="8"/>',
  text:'<path d="M5 7V5h14v2"/><path d="M12 5v14"/><path d="M9 19h6"/>',
  undo:'<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  redo:'<path d="M15 14l5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
  weg:'<path d="M4 7h16"/><path d="M6.5 7l1 12.2A2 2 0 0 0 9.5 21h5a2 2 0 0 0 2-1.8l1-12.2"/><path d="M9.5 7V4h5v3"/>'};
const fmIc=k=>`<svg class="fm-ic" viewBox="0 0 24 24" aria-hidden="true">${FM_IC[k]||""}</svg>`;
const FM_WZ=[["auswahl","Auswählen und verschieben"],["pfeil","Pfeil"],["mass","Maß mit Beschriftung"],["rechteck","Rechteck"],["kreis","Kreis"],["text","Text"],["stift","Stift"]];
const FM_FARBEN=[["#E11D2F","Rot"],["#FFC400","Gelb"],["#1E6FE8","Blau"],["#16A34A","Grün"],["#FFFFFF","Weiß"],["#111111","Schwarz"]];
const FM_DICKE=[1,1.7,2.6], FM_SCHRIFT=[8,11.5,16];
const FM_Z=new Map(); let FM=null;
function fmKnopf(quelle,ersetze){ const t="fm"+Math.random().toString(36).slice(2,9); FM_Z.set(t,{quelle,ersetze}); if(FM_Z.size>40) FM_Z.delete(FM_Z.keys().next().value);
  return `<button class="btn-text" data-act="fmStart" data-fm="${t}">Markieren</button>`; }
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act="fmStart"]'); if(!b) return; e.stopPropagation(); e.preventDefault();
  const z=FM_Z.get(b.dataset.fm); if(!z) return; if(typeof closeOverlays==="function") closeOverlays(); fmOeffnen(z.quelle,z.ersetze); },true);
/* Im Foto-Fenster sitzt „Markieren“ als Knopf auf dem Bild – die Knopfleiste darunter bleibt kurz (Handy) */
function fmDlgBeobachten(){ const d=document.getElementById("dlg"); if(!d||d.dataset.fm) return; d.dataset.fm="1";
  new MutationObserver(()=>{ const k=d.querySelector('.da [data-act="fmStart"]'), im=d.querySelector("img.dimg"); if(!k||!im||im.parentElement.classList.contains("fm-rahmen")) return;
    const r=document.createElement("div"); r.className="fm-rahmen"; im.replaceWith(r); r.append(im,k); k.className="fm-auf"; k.innerHTML=fmIc("stift")+"<span>Markieren</span>"; }).observe(d,{childList:true}); }
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",fmDlgBeobachten); else setTimeout(fmDlgBeobachten,0);
let FM_CFG=(()=>{ try{ return Object.assign({wz:"pfeil",farbe:"#E11D2F",dicke:1},JSON.parse(localStorage.getItem("fm-cfg")||"{}")); }catch(e){ return {wz:"pfeil",farbe:"#E11D2F",dicke:1}; } })();
const fmCfgSichern=()=>{ try{ localStorage.setItem("fm-cfg",JSON.stringify(FM_CFG)); }catch(e){} };
/* helle Farben bekommen einen dunklen Rand, dunkle einen hellen – Text bleibt auf jedem Untergrund lesbar */
const fmHell=c=>{ const n=parseInt(c.slice(1),16), r=n>>16&255, g=n>>8&255, b=n&255; return (r*299+g*587+b*114)/1000>150; };

async function fmOeffnen(quelle,ersetze){
  let src=quelle; try{ if(typeof quelle==="function") src=await quelle(); }catch(e){ src=null; }
  if(!src){ toast("Foto nicht verfügbar"); return; }
  const img=new Image(); img.src=src; try{ await img.decode(); }catch(e){ toast("Das Foto konnte nicht geöffnet werden"); return; }
  const ov=document.createElement("div"); ov.className="fm"; ov.id="fm";
  const knopf=(k,l)=>`<button class="fm-b" data-fz="wz" data-v="${k}" aria-pressed="${k===FM_CFG.wz}" aria-label="${l}" title="${l}">${fmIc(k)}</button>`;
  ov.innerHTML=`<div class="fm-bar"><button class="fm-txt" data-fz="abbr">Abbrechen</button>
      <span class="fm-mitte"><button class="fm-b" data-fz="undo" aria-label="Rückgängig" title="Rückgängig">${fmIc("undo")}</button><button class="fm-b" data-fz="redo" aria-label="Wiederholen" title="Wiederholen">${fmIc("redo")}</button></span>
      <button class="fm-ok" data-fz="ok">Fertig</button></div>
    <div class="fm-werkz"><span class="fm-gr" role="toolbar" aria-label="Werkzeuge">${FM_WZ.map(([k,l])=>knopf(k,l)).join("")}</span>
      <span class="fm-gr" aria-label="Farbe">${FM_FARBEN.map(([c,n])=>`<button class="fm-farbe" data-fz="farbe" data-v="${c}" style="--f:${c}" aria-pressed="${c===FM_CFG.farbe}" aria-label="${n}" title="${n}"></button>`).join("")}</span>
      <span class="fm-gr" aria-label="Stärke">${FM_DICKE.map((_,i)=>`<button class="fm-b fm-d" data-fz="dicke" data-v="${i}" aria-pressed="${i===FM_CFG.dicke}" aria-label="Stärke ${i+1}" title="${["Dünn","Mittel","Dick"][i]}"><i style="--d:${[4,7,11][i]}px"></i></button>`).join("")}
        <button class="fm-b fm-weg" data-fz="weg" aria-label="Markierung löschen" title="Ausgewählte Markierung löschen" hidden>${fmIc("weg")}</button></span></div>
    <div class="fm-flaeche"><canvas></canvas><p class="fm-tipp" id="fmTipp"></p></div>
    <div class="fm-frage" id="fmFrage" hidden></div>`;
  document.body.appendChild(ov); document.body.classList.add("fm-offen");
  const cv=ov.querySelector("canvas");
  FM={ov,cv,ctx:cv.getContext("2d"),img,W:img.naturalWidth,H:img.naturalHeight,formen:[],hist:[],redo:[],akt:null,sel:-1,drag:null,ersetze,k:1,ox:0,oy:0};
  FM.basis=Math.max(FM.W,FM.H)/220;
  fmLayout(); fmKnoepfe(); fmTipp();
  cv.addEventListener("pointerdown",fmDown); cv.addEventListener("pointermove",fmMove); cv.addEventListener("pointerup",fmUp); cv.addEventListener("pointercancel",fmUp);
  ov.addEventListener("click",fmKlick); addEventListener("resize",fmLayout); addEventListener("keydown",fmTaste);
}
function fmZu(){ if(!FM) return; removeEventListener("resize",fmLayout); removeEventListener("keydown",fmTaste); FM.ov.remove(); document.body.classList.remove("fm-offen"); FM=null; }
function fmLayout(){ if(!FM) return; const fl=FM.ov.querySelector(".fm-flaeche"), r=fl.getBoundingClientRect(), dpr=devicePixelRatio||1, rand=12;
  FM.cv.style.width=r.width+"px"; FM.cv.style.height=r.height+"px"; FM.cv.width=Math.round(r.width*dpr); FM.cv.height=Math.round(r.height*dpr); FM.dpr=dpr;
  FM.k=Math.min((r.width-2*rand)/FM.W,(r.height-2*rand)/FM.H); FM.ox=(r.width-FM.W*FM.k)/2; FM.oy=(r.height-FM.H*FM.k)/2; fmMalen(); }
const fmPunkt=e=>{ const r=FM.cv.getBoundingClientRect(); return {x:Math.max(0,Math.min(FM.W,(e.clientX-r.left-FM.ox)/FM.k)),y:Math.max(0,Math.min(FM.H,(e.clientY-r.top-FM.oy)/FM.k))}; };   /* nur aufs Foto, nicht daneben */
function fmTipp(){ const t=document.getElementById("fmTipp"); if(!t) return;
  t.textContent=FM.formen.length?"":{auswahl:"Markierung antippen, um sie zu verschieben oder zu löschen",pfeil:"Vom Anfang zur Spitze ziehen",mass:"Von Ende zu Ende ziehen, danach das Maß eingeben",rechteck:"Rahmen aufziehen",kreis:"Kreis aufziehen",text:"Dorthin tippen, wo der Text stehen soll",stift:"Frei zeichnen"}[FM_CFG.wz]||""; }
function fmKnoepfe(){ if(!FM) return; const ov=FM.ov;
  ov.querySelectorAll('[data-fz="wz"]').forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.v===FM_CFG.wz)));
  ov.querySelectorAll('[data-fz="farbe"]').forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.v===FM_CFG.farbe)));
  ov.querySelectorAll('[data-fz="dicke"]').forEach(b=>b.setAttribute("aria-pressed",String(+b.dataset.v===FM_CFG.dicke)));
  ov.querySelector('[data-fz="undo"]').disabled=!FM.hist.length; ov.querySelector('[data-fz="redo"]').disabled=!FM.redo.length;
  ov.querySelector('[data-fz="weg"]').hidden=FM.sel<0; }
const fmKopie=L=>JSON.parse(JSON.stringify(L));
function fmMerken(){ FM.hist.push(fmKopie(FM.formen)); if(FM.hist.length>60) FM.hist.shift(); FM.redo=[]; }
/* ---- Zeichnen (k = Maßstab Bild → Leinwand) ---- */
function fmForm(c,f,k){ const w=FM.basis*FM_DICKE[f.d]*k, P=q=>[q.x*k,q.y*k];
  c.save(); c.strokeStyle=f.c; c.fillStyle=f.c; c.lineWidth=w; c.lineCap="round"; c.lineJoin="round";
  const spitze=(a,b)=>{ const [x1,y1]=P(a),[x2,y2]=P(b), L=Math.max(w*4.2,10*k), wi=Math.atan2(y2-y1,x2-x1), s=.47;
    c.beginPath(); c.moveTo(x2,y2); c.lineTo(x2-L*Math.cos(wi-s),y2-L*Math.sin(wi-s)); c.lineTo(x2-L*Math.cos(wi+s),y2-L*Math.sin(wi+s)); c.closePath(); c.fill();
    return [x2-L*.8*Math.cos(wi),y2-L*.8*Math.sin(wi)]; };
  if(f.t==="stift"){ const p=f.p; if(!p.length){ c.restore(); return; } c.beginPath(); c.moveTo(...P(p[0]));
    if(p.length<3) p.slice(1).forEach(q=>c.lineTo(...P(q))); else { for(let i=1;i<p.length-1;i++){ const [ax,ay]=P(p[i]),[bx,by]=P(p[i+1]); c.quadraticCurveTo(ax,ay,(ax+bx)/2,(ay+by)/2); } c.lineTo(...P(p[p.length-1])); }
    if(p.length===1){ c.lineTo(p[0].x*k+.1,p[0].y*k); } c.stroke(); }
  else if(f.t==="pfeil"){ const e=spitze(f.a,f.b); c.beginPath(); c.moveTo(...P(f.a)); c.lineTo(...e); c.stroke(); }
  else if(f.t==="mass"){ const e1=spitze(f.a,f.b), e2=spitze(f.b,f.a); c.beginPath(); c.moveTo(...e2); c.lineTo(...e1); c.stroke();
    if(f.txt) fmSchrift(c,f.txt,(f.a.x+f.b.x)/2*k,(f.a.y+f.b.y)/2*k,FM.basis*FM_SCHRIFT[f.d]*k,f.c,true); }
  else if(f.t==="rechteck"){ const [x1,y1]=P(f.a),[x2,y2]=P(f.b); c.beginPath(); c.rect(Math.min(x1,x2),Math.min(y1,y2),Math.abs(x2-x1),Math.abs(y2-y1)); c.stroke(); }
  else if(f.t==="kreis"){ const [x1,y1]=P(f.a),[x2,y2]=P(f.b); c.beginPath(); c.ellipse((x1+x2)/2,(y1+y2)/2,Math.max(1,Math.abs(x2-x1)/2),Math.max(1,Math.abs(y2-y1)/2),0,0,Math.PI*2); c.stroke(); }
  else if(f.t==="text") fmSchrift(c,f.txt,f.a.x*k,f.a.y*k,FM.basis*FM_SCHRIFT[f.d]*k,f.c,false);
  c.restore(); }
function fmSchrift(c,txt,x,y,gr,farbe,ueber){ c.save(); c.font=`700 ${gr}px system-ui,-apple-system,"Segoe UI",Roboto,sans-serif`; c.textAlign="center"; c.textBaseline=ueber?"bottom":"middle";
  const yy=ueber?y-gr*.25:y; c.lineJoin="round"; c.lineWidth=gr*.24; c.strokeStyle=fmHell(farbe)?"rgba(0,0,0,.85)":"rgba(255,255,255,.95)"; c.strokeText(txt,x,yy); c.fillStyle=farbe; c.fillText(txt,x,yy); c.restore(); }
/* Umriss einer Markierung im Bild (für Auswahl und Antippen) */
function fmBox(f){ if(f.t==="text"||(f.t==="mass"&&f.txt)){ const c=FM.ctx, gr=FM.basis*FM_SCHRIFT[f.d]; c.save(); c.font=`700 ${gr}px system-ui,sans-serif`; const b=c.measureText(f.txt||"").width; c.restore();
    if(f.t==="text") return [f.a.x-b/2,f.a.y-gr*.65,f.a.x+b/2,f.a.y+gr*.65]; }
  const P=f.t==="stift"?f.p:[f.a,f.b]; return [Math.min(...P.map(q=>q.x)),Math.min(...P.map(q=>q.y)),Math.max(...P.map(q=>q.x)),Math.max(...P.map(q=>q.y))]; }
function fmTreffer(p){ const tol=Math.max(FM.basis*3,14/FM.k);
  const abst=(q,a,b)=>{ const dx=b.x-a.x, dy=b.y-a.y, l=dx*dx+dy*dy, t=l?Math.max(0,Math.min(1,((q.x-a.x)*dx+(q.y-a.y)*dy)/l)):0; return Math.hypot(q.x-a.x-t*dx,q.y-a.y-t*dy); };
  for(let i=FM.formen.length-1;i>=0;i--){ const f=FM.formen[i];
    if(f.t==="stift"){ for(let j=0;j<f.p.length;j++) if(abst(p,f.p[j],f.p[Math.min(j+1,f.p.length-1)])<tol) return i; continue; }
    if(f.t==="pfeil"||f.t==="mass"){ if(abst(p,f.a,f.b)<tol) return i; if(f.t==="mass"&&f.txt&&Math.hypot(p.x-(f.a.x+f.b.x)/2,p.y-(f.a.y+f.b.y)/2)<FM.basis*FM_SCHRIFT[f.d]*1.4) return i; continue; }
    const [x0,y0,x1,y1]=fmBox(f);
    if(f.t==="text"){ if(p.x>x0-tol&&p.x<x1+tol&&p.y>y0-tol&&p.y<y1+tol) return i; continue; }
    if(f.t==="rechteck"){ const innen=p.x>x0+tol&&p.x<x1-tol&&p.y>y0+tol&&p.y<y1-tol, aussen=p.x>x0-tol&&p.x<x1+tol&&p.y>y0-tol&&p.y<y1+tol; if(aussen&&!innen) return i; continue; }
    if(f.t==="kreis"){ const cx=(x0+x1)/2, cy=(y0+y1)/2, rx=Math.max(1,(x1-x0)/2), ry=Math.max(1,(y1-y0)/2), d=Math.hypot((p.x-cx)/rx,(p.y-cy)/ry); if(Math.abs(d-1)*Math.min(rx,ry)<tol) return i; } }
  return -1; }
function fmMalen(){ if(!FM) return; const c=FM.ctx, d=FM.dpr; c.setTransform(d,0,0,d,0,0); c.clearRect(0,0,FM.cv.width,FM.cv.height);
  c.drawImage(FM.img,FM.ox,FM.oy,FM.W*FM.k,FM.H*FM.k); c.save(); c.translate(FM.ox,FM.oy);
  FM.formen.forEach(f=>fmForm(c,f,FM.k)); if(FM.akt) fmForm(c,FM.akt,FM.k);
  if(FM.sel>=0&&FM.formen[FM.sel]){ const [x0,y0,x1,y1]=fmBox(FM.formen[FM.sel]), r=FM.basis*FM_DICKE[FM.formen[FM.sel].d]*FM.k+6;
    c.setLineDash([6,5]); c.lineWidth=2; c.strokeStyle="#fff"; c.strokeRect(x0*FM.k-r,y0*FM.k-r,(x1-x0)*FM.k+2*r,(y1-y0)*FM.k+2*r); c.setLineDash([6,5]); c.lineDashOffset=6; c.strokeStyle="#1E6FE8"; c.strokeRect(x0*FM.k-r,y0*FM.k-r,(x1-x0)*FM.k+2*r,(y1-y0)*FM.k+2*r); }
  c.restore(); }
/* ---- Eingabe ---- */
let FM_TAP=null;
function fmDown(e){ if(!FM||document.getElementById("fmFrage").hidden===false) return; e.preventDefault(); FM.cv.setPointerCapture(e.pointerId); const p=fmPunkt(e), wz=FM_CFG.wz;
  if(wz==="auswahl"||wz==="text"){ const i=fmTreffer(p);
    if(i>=0){ const jetzt=Date.now(), f=FM.formen[i]; if(FM_TAP&&FM_TAP.i===i&&jetzt-FM_TAP.t<400&&(f.t==="text"||f.t==="mass")){ FM_TAP=null; fmTextEingabe(f.txt||"",t=>{ fmMerken(); if(!t&&f.t==="text") FM.formen.splice(i,1); else f.txt=t; FM.sel=-1; fmKnoepfe(); fmMalen(); }); return; }
      FM_TAP={i,t:jetzt}; FM.sel=i; FM.drag={p,vor:fmKopie(FM.formen),bewegt:false}; fmKnoepfe(); fmMalen(); return; }
    if(wz==="auswahl"){ FM.sel=-1; fmKnoepfe(); fmMalen(); return; } }
  FM.sel=-1; fmKnoepfe();
  if(wz==="text"){ FM.textBei=p; return; }
  FM.akt=wz==="stift"?{t:"stift",c:FM_CFG.farbe,d:FM_CFG.dicke,p:[p]}:{t:wz,c:FM_CFG.farbe,d:FM_CFG.dicke,a:p,b:p}; fmMalen(); }
function fmMove(e){ if(!FM) return; const p=fmPunkt(e);
  if(FM.drag&&FM.sel>=0){ const dx=p.x-FM.drag.p.x, dy=p.y-FM.drag.p.y; if(!FM.drag.bewegt&&Math.hypot(dx,dy)*FM.k<4) return; FM.drag.bewegt=true;
    const f=FM.formen[FM.sel], o=FM.drag.vor[FM.sel], s=q=>({x:q.x+dx,y:q.y+dy}); if(f.t==="stift") f.p=o.p.map(s); else { f.a=s(o.a); if(o.b) f.b=s(o.b); } fmMalen(); return; }
  if(!FM.akt) return; if(FM.akt.t==="stift"){ const l=FM.akt.p[FM.akt.p.length-1]; if(Math.hypot(p.x-l.x,p.y-l.y)*FM.k>=1.5) FM.akt.p.push(p); } else FM.akt.b=p; fmMalen(); }
function fmUp(e){ if(!FM) return;
  if(FM.drag){ if(FM.drag.bewegt){ FM.hist.push(FM.drag.vor); FM.redo=[]; } FM.drag=null; fmKnoepfe(); return; }
  if(FM.textBei){ const p=FM.textBei; FM.textBei=null; fmTextEingabe("",t=>{ if(!t) return; fmMerken(); FM.formen.push({t:"text",c:FM_CFG.farbe,d:FM_CFG.dicke,a:p,txt:t}); fmKnoepfe(); fmTipp(); fmMalen(); }); return; }
  const f=FM.akt; FM.akt=null; if(!f){ fmMalen(); return; }
  const gross=f.t==="stift"||Math.hypot(f.b.x-f.a.x,f.b.y-f.a.y)*FM.k>=8;
  if(!gross){ fmMalen(); return; }
  fmMerken(); FM.formen.push(f); fmKnoepfe(); fmTipp(); fmMalen();
  if(f.t==="mass") fmTextEingabe("",t=>{ f.txt=t; fmMalen(); },"Maß, z. B. 30 cm"); }
function fmTextEingabe(wert,fertig,ph){ const q=document.getElementById("fmFrage"); if(!q) return;
  q.innerHTML=`<div class="fm-ein"><input id="fmText" value="${esc(wert)}" placeholder="${esc(ph||"Text")}" enterkeyhint="done" autocomplete="off" maxlength="60"><button class="fm-ok" data-fz="textOk">OK</button></div>`;
  q.hidden=false; FM.textFertig=fertig; const i=document.getElementById("fmText"); setTimeout(()=>{ i.focus(); i.select(); },30);
  i.addEventListener("keydown",e=>{ if(e.key==="Enter"){ e.preventDefault(); fmTextOk(); } else if(e.key==="Escape"){ e.preventDefault(); e.stopPropagation(); q.hidden=true; FM.textFertig=null; } }); }
function fmTextOk(){ const q=document.getElementById("fmFrage"), i=document.getElementById("fmText"); if(!q||!i) return; const t=i.value.trim(), f=FM.textFertig; q.hidden=true; FM.textFertig=null; if(f) f(t); }
function fmUndo(){ if(!FM.hist.length) return; FM.redo.push(fmKopie(FM.formen)); FM.formen=FM.hist.pop(); FM.sel=-1; fmKnoepfe(); fmTipp(); fmMalen(); }
function fmRedo(){ if(!FM.redo.length) return; FM.hist.push(fmKopie(FM.formen)); FM.formen=FM.redo.pop(); FM.sel=-1; fmKnoepfe(); fmMalen(); }
function fmWeg(){ if(FM.sel<0) return; fmMerken(); FM.formen.splice(FM.sel,1); FM.sel=-1; fmKnoepfe(); fmTipp(); fmMalen(); }
function fmTaste(e){ if(!FM) return; if(e.target&&e.target.id==="fmText") return;
  const z=(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="z"; if(z){ e.preventDefault(); e.shiftKey?fmRedo():fmUndo(); return; }
  if((e.key==="Delete"||e.key==="Backspace")&&FM.sel>=0){ e.preventDefault(); fmWeg(); return; }
  if(e.key==="Escape"){ e.preventDefault(); e.stopPropagation(); fmAbbrechen(); } }
function fmAbbrechen(){ if(!FM.formen.length&&!FM.hist.length){ fmZu(); return; }
  const q=document.getElementById("fmFrage"); q.innerHTML=`<div class="fm-ein fm-wirklich"><span>Markierungen verwerfen?</span><button class="fm-txt" data-fz="weiter">Weiter markieren</button><button class="fm-ok rot" data-fz="verwerfen">Verwerfen</button></div>`; q.hidden=false; }
async function fmFertig(){ if(!FM) return; if(!FM.formen.length){ fmZu(); return; }
  const c=document.createElement("canvas"); c.width=FM.W; c.height=FM.H; const x=c.getContext("2d"); x.drawImage(FM.img,0,0); FM.formen.forEach(f=>fmForm(x,f,1));
  const data=c.toDataURL("image/jpeg",.9), ers=FM.ersetze; fmZu();
  try{ await ers(data); toast("Markiertes Foto gespeichert"); }catch(e){ console.error(e); toast("Speichern hat nicht geklappt"); } }
function fmKlick(e){ const b=e.target.closest("[data-fz]"); if(!b||!FM) return; const a=b.dataset.fz;
  if(a==="wz"){ FM_CFG.wz=b.dataset.v; fmCfgSichern(); if(FM_CFG.wz!=="auswahl"&&FM_CFG.wz!=="text") FM.sel=-1; fmKnoepfe(); fmTipp(); fmMalen(); }
  else if(a==="farbe"){ FM_CFG.farbe=b.dataset.v; fmCfgSichern(); if(FM.sel>=0){ fmMerken(); FM.formen[FM.sel].c=b.dataset.v; } fmKnoepfe(); fmMalen(); }
  else if(a==="dicke"){ FM_CFG.dicke=+b.dataset.v; fmCfgSichern(); if(FM.sel>=0){ fmMerken(); FM.formen[FM.sel].d=+b.dataset.v; } fmKnoepfe(); fmMalen(); }
  else if(a==="undo") fmUndo(); else if(a==="redo") fmRedo(); else if(a==="weg") fmWeg();
  else if(a==="abbr") fmAbbrechen(); else if(a==="ok") fmFertig();
  else if(a==="textOk") fmTextOk();
  else if(a==="weiter") document.getElementById("fmFrage").hidden=true;
  else if(a==="verwerfen") fmZu(); }
/* fotoCache-Fotos (alle Apps): neue ID statt Überschreiben, damit andere Geräte die neue Fassung sicher laden */
async function fmFotoNeu(data){ const id=uid(); await fotoPut(id,data); fotoQueue(id); return id; }
