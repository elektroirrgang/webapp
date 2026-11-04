/* ===== PDF-Ansicht – EINE Fassung für alle vier Apps (wie eine eigene App in der App, überall gleich) =====
   Wird von tools/build.py in jede App eingesetzt (Platzhalter PDFANSICHT). Die App liefert PROT, protBlob und optional PV_EXTRA (eigene Menüpunkte). */
IC.swapV=IC.swapV||"M16 17.01V10h-2v7.01h-3L15 21l4-3.99h-3zM9 3 5 6.99h3V14h2V6.99h3L9 3z";IC.swapH=IC.swapH||"M6.99 11 3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z";IC.moreH=IC.moreH||"M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z";IC.share=IC.share||"M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z";IC.mail=IC.mail||"M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z";IC.pdf=IC.pdf||"M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z";IC.close=IC.close||"M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z";IC.chev=IC.chev||"M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z";
let pdfjsP=null, PV=null;
function pdfjsLaden(){ if(window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if(!pdfjsP) pdfjsP=new Promise((res,rej)=>{ const s=document.createElement("script"); s.src="pdfjs/pdf.min.js";
    s.onload=()=>{ try{ pdfjsLib.GlobalWorkerOptions.workerSrc="pdfjs/pdf.worker.min.js"; res(pdfjsLib); }catch(e){ rej(e); } }; s.onerror=()=>{ pdfjsP=null; rej(new Error("pdfjs")); }; document.head.appendChild(s); });
  return pdfjsP; }
async function pvOeffnen(id){
  const x=PROT.find(y=>y.id===id); if(!x) return; closeOverlays(); $("#pv")?.remove();
  document.body.insertAdjacentHTML("beforeend",`<div class="pv${PV_MODUS==="seiten"?" m-seiten":""}" id="pv" role="dialog" aria-modal="true" aria-label="Vorschau"><div class="pv-kopf"><div class="pv-l"><button class="pv-rund" data-act="pvZu" aria-label="Schließen">${icon("close")}</button></div><div class="pv-t" data-act="pvKopfAuf"><b>${esc(x.titel)}</b><span>${esc([deDate(x.datum),x.art,x.fassung>1?`Fassung ${x.fassung}`:""].filter(Boolean).join(" · "))}</span></div><div class="pv-r"><button class="pv-rund" data-act="pvTeilen" aria-label="Teilen">${icon("share")}</button><button class="pv-rund" data-act="pvMenu" aria-label="Weitere Aktionen" aria-haspopup="menu">${icon("moreH")}</button></div></div><div class="pv-seiten" id="pvSeiten"><p class="pv-lade">PDF wird geladen …</p></div><span class="pv-zahl" id="pvZahl"></span><button class="pv-pfeil l" data-act="pvZurueck" aria-label="Vorherige Seite">${icon("chev")}</button><button class="pv-pfeil r" data-act="pvWeiter" aria-label="Nächste Seite">${icon("chev")}</button></div>`);
  document.body.classList.add("pv-offen"); PV={id,z:1,doc:null}; const P=PV; pvGesten();
  try{ const [lib,blob]=await Promise.all([pdfjsLaden(),protBlob(id)]); if(PV!==P) return; if(!blob) throw new Error("blob");
    P.blob=blob; P.doc=await lib.getDocument({data:new Uint8Array(await blob.arrayBuffer())}).promise; if(PV!==P) return; $("#pvSeiten").innerHTML=""; await pvZeichnen(); }
  catch(e){ const s=$("#pvSeiten"); if(s&&PV===P) s.innerHTML=`<p class="pv-lade">Vorschau nicht möglich${navigator.onLine?"":" – beim allerersten Öffnen wird einmal Internet gebraucht"}.<br>Über ⋯ oben rechts lässt sich das PDF trotzdem speichern oder teilen.</p>`; }
}
const PV_KEY="pv_modus"; let PV_MODUS=(()=>{ try{ return localStorage.getItem(PV_KEY)==="seiten"?"seiten":"scroll"; }catch(e){ return "scroll"; } })();
function pvSeite(){ const box=$("#pvSeiten"); if(!box) return 1; const bl=[...box.querySelectorAll(".pv-blatt")]; if(!bl.length) return 1;
  if(PV_MODUS==="seiten") return Math.min(bl.length,Math.round(box.scrollLeft/Math.max(1,box.clientWidth))+1);
  const r=box.getBoundingClientRect(); let n=1; bl.forEach((b,i)=>{ if(b.getBoundingClientRect().top<r.top+r.height/2) n=i+1; }); return n; }
function pvGehe(n,glatt){ const box=$("#pvSeiten"); if(!box||!PV||!PV.doc) return; n=Math.max(1,Math.min(PV.doc.numPages,n)); const bl=box.querySelector(`.pv-blatt[data-s="${n}"]`); if(!bl) return;
  if(PV_MODUS==="seiten") box.scrollTo({left:(n-1)*box.clientWidth,behavior:glatt?"smooth":"auto"}); else box.scrollTo({top:bl.offsetTop-16,behavior:glatt?"smooth":"auto"}); }
function pvZahl(fest){ const P=PV, z=$("#pvZahl"); if(!P||!P.doc||!z) return; const n=pvSeite(); z.textContent=`${n} von ${P.doc.numPages}`;
  const l=$("#pv .pv-pfeil.l"), r=$("#pv .pv-pfeil.r"); if(l) l.disabled=n<=1; if(r) r.disabled=n>=P.doc.numPages;
  z.classList.add("an"); clearTimeout(P.st); P.st=setTimeout(()=>z.classList.remove("an"),1500); }
async function pvZeichnen(){ const P=PV, box=$("#pvSeiten"); if(!P||!P.doc||!box) return; const tok=P.tok=(P.tok||0)+1;
  const seiten=PV_MODUS==="seiten", bw=box.clientWidth, bh=box.clientHeight, dpr=Math.min(window.devicePixelRatio||1,2.5);
  for(let i=1;i<=P.doc.numPages;i++){ if(P.tok!==tok||PV!==P) return;
    const pg=await P.doc.getPage(i), v1=pg.getViewport({scale:1});
    const breite=Math.min(bw-24,1200)*P.z, hoehe=breite*v1.height/v1.width;
    let bl=box.querySelector(`.pv-blatt[data-s="${i}"]`); if(!bl){ bl=document.createElement("div"); bl.className="pv-blatt"; bl.dataset.s=i; bl.innerHTML=`<canvas class="pv-seite"></canvas>`; box.appendChild(bl); }
    const c=bl.firstChild; c.style.width=Math.floor(breite)+"px"; c.style.height=Math.floor(hoehe)+"px";
    const vp=pg.getViewport({scale:breite/v1.width*dpr}), off=document.createElement("canvas"); off.width=Math.floor(vp.width); off.height=Math.floor(vp.height);
    await pg.render({canvasContext:off.getContext("2d"),viewport:vp}).promise; if(P.tok!==tok||PV!==P) return;
    c.width=off.width; c.height=off.height; c.getContext("2d").drawImage(off,0,0); if(i===1) pvZahl(); }
}
function pvNeuAufbau(){ if(!PV) return; const n=pvSeite(), box=$("#pvSeiten"); if(!box) return; box.querySelectorAll(".pv-blatt").forEach(b=>b.remove()); PV.z=1;
  pvZeichnen().then(()=>{}); requestAnimationFrame(()=>requestAnimationFrame(()=>{ pvGehe(n); pvZahl(); })); }
function pvModus(m){ PV_MODUS=m; try{ localStorage.setItem(PV_KEY,m); }catch(e){} const pv=$("#pv"); if(!pv) return; pv.classList.toggle("m-seiten",m==="seiten"); pvNeuAufbau(); }
function pvZoom(z,cx,cy){ const P=PV, box=$("#pvSeiten"); if(!P||!box) return; z=Math.max(.5,Math.min(4,z)); const f=z/P.z; if(Math.abs(f-1)<.01) return;
  const el=PV_MODUS==="seiten"?box.querySelector(`.pv-blatt[data-s="${pvSeite()}"]`)||box:box;
  const r=el.getBoundingClientRect(), x=cx-r.left, y=cy-r.top, sl=el.scrollLeft, st=el.scrollTop;
  box.querySelectorAll(".pv-seite").forEach(c=>{ c.style.width=parseFloat(c.style.width)*f+"px"; c.style.height=parseFloat(c.style.height)*f+"px"; });
  P.z=z; P.zoomBis=Date.now()+200; el.scrollLeft=(sl+x)*f-x; el.scrollTop=(st+y)*f-y; }
function pvGesten(){ const box=$("#pvSeiten"); let pinch=null, tap=0, letzte=1, raf=0, ziel=null;
  const d=t=>Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);
  box.addEventListener("touchstart",e=>{ if(e.touches.length===2&&PV){ pinch={d:d(e.touches),z:PV.z}; PV.pinch=true; e.preventDefault(); }
    else if(e.touches.length===1){ const n=Date.now(); if(n-tap<300&&PV){ pvZoom(Math.abs(PV.z-1)>.05?1:2,e.touches[0].clientX,e.touches[0].clientY); pvScharf(); tap=0; e.preventDefault(); } else tap=n; } },{passive:false});
  box.addEventListener("touchmove",e=>{ if(pinch&&e.touches.length===2){ e.preventDefault();
    ziel=[pinch.z*d(e.touches)/pinch.d,(e.touches[0].clientX+e.touches[1].clientX)/2,(e.touches[0].clientY+e.touches[1].clientY)/2];
    if(!raf) raf=requestAnimationFrame(()=>{ raf=0; if(ziel) pvZoom(...ziel); }); } },{passive:false});
  const ende=e=>{ if(pinch&&e.touches.length<2){ pinch=null; if(PV){ PV.pinch=false; if(PV.z<1&&PV.z>.92) pvZoom(1,innerWidth/2,innerHeight/2); pvScharf(); } } };
  box.addEventListener("touchend",ende); box.addEventListener("touchcancel",ende);
  box.addEventListener("dblclick",e=>{ if(PV){ pvZoom(Math.abs(PV.z-1)>.05?1:2,e.clientX,e.clientY); pvScharf(); } });
  box.addEventListener("wheel",e=>{ if(e.ctrlKey&&PV){ e.preventDefault(); pvZoom(PV.z*(e.deltaY<0?1.1:1/1.1),e.clientX,e.clientY); pvScharf(); } },{passive:false});
  box.addEventListener("scroll",e=>{ if(!PV) return; const el=e.target; if(el===box){ pvZahl(); const n=pvSeite(); if(PV_MODUS==="seiten"&&n!==letzte){ letzte=n; if(PV.z>1){ PV.z=1; pvScharf(); } } }
    if(PV_MODUS==="seiten"&&el===box) return; if(!(el instanceof Element)) return;
    const t=el.scrollTop, alt=el._lt||0; el._lt=t; if(PV.pinch||Date.now()<(PV.zoomBis||0)) return; const pv=$("#pv"); if(!pv) return;
    if(t<24) pv.classList.remove("kompakt"); else if(t-alt>6) pv.classList.add("kompakt"); else if(alt-t>10) pv.classList.remove("kompakt"); },{passive:true,capture:true});
}
function pvScharf(){ if(!PV) return; clearTimeout(PV.zt); PV.zt=setTimeout(pvZeichnen,PV.pinch?400:120); }
function pvZu(){ PV=null; $("#pv")?.remove(); document.body.classList.remove("pv-offen"); closeOverlays(); }
function pvMenu(){ const x=PV&&PROT.find(y=>y.id===PV.id); if(!x) return;
  const it=[PV_MODUS==="seiten"?["pvModus","Durchgehend scrollen","swapV"]:["pvModus","Seitenweise blättern","swapH"],"-",["pvMail","Per Mail senden","mail"],["pvSpeichern","Auf dem Gerät speichern","pdf"]].concat(typeof PV_EXTRA==="function"?PV_EXTRA(x):[]);
  $("#menu").innerHTML=it.map(m=>m==="-"?"<hr>":`<button class="mi ${m[3]||""}" role="menuitem" data-act="${m[0]}">${icon(m[2])}<span>${m[1]}</span></button>`).join("");
  $("#menu").hidden=false; $("#scrim").hidden=false; }
async function pvAktion(a){ const x=PV&&PROT.find(y=>y.id===PV.id); if(!x) return; const blob=PV.blob||await protBlob(x.id); if(!blob){ toast("PDF nicht gefunden"); return; }
  const f=new File([blob],x.name+".pdf",{type:"application/pdf"});
  if(a==="pvSpeichern"){ saveFile(blob,x.name+".pdf"); return; }
  if(a==="pvTeilen"){ if(navigator.canShare&&navigator.canShare({files:[f]})){ try{ await navigator.share({files:[f],title:x.name}); }catch(e){} } else saveFile(blob,x.name+".pdf"); return; }
  const an=mailAn(); try{ navigator.clipboard&&navigator.clipboard.writeText(an); }catch(e){}
  const text=`Hallo,\n\nanbei ${/legende/i.test(x.art||"")?"die Verteilerlegende":"das Prüfprotokoll"} ${x.titel}${x.auftragsnr?`, Auftrag ${x.auftragsnr}`:""} vom ${deDate(x.datum)}.\n\nViele Grüße\n${who().name||x.pruefer||""}${who().mail?"\n"+who().mail:""}`;
  if(navigator.canShare&&navigator.canShare({files:[f]})){ try{ await navigator.share({files:[f],title:x.name,text}); toast(`Adresse ${an} liegt in der Zwischenablage`); }catch(e){} return; }
  saveFile(blob,x.name+".pdf"); location.href=`mailto:${an}?subject=${encodeURIComponent(x.name)}&body=${encodeURIComponent(text+"\n\n(PDF bitte anhängen)")}`; toast("PDF gespeichert – bitte in der Mail anhängen"); }
addEventListener("keydown",e=>{ if(!PV||!$("#menu").hidden||!$("#dlg").hidden) return; if(e.key==="Escape") pvZu(); else if(e.key==="ArrowRight"||e.key==="PageDown"){ e.preventDefault(); pvGehe(pvSeite()+1,true); } else if(e.key==="ArrowLeft"||e.key==="PageUp"){ e.preventDefault(); pvGehe(pvSeite()-1,true); } });
addEventListener("resize",()=>{ if(PV){ clearTimeout(PV.rt); PV.rt=setTimeout(pvNeuAufbau,200); } });
/* Knöpfe der Ansicht – nur die eigenen, App-eigene Menüpunkte (z. B. pvPruefung, pvLoesch) laufen weiter über die App */
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act^="pv"]'); if(!b) return; const a=b.dataset.act;
  const F={pvZu:()=>pvZu(),pvKopfAuf:()=>$("#pv")?.classList.remove("kompakt"),pvModus:()=>{ closeOverlays(); pvModus(PV_MODUS==="seiten"?"scroll":"seiten"); },
    pvZurueck:()=>pvGehe(pvSeite()-1,true),pvWeiter:()=>pvGehe(pvSeite()+1,true),pvMenu:()=>pvMenu(),pvMail:()=>{ closeOverlays(); pvAktion(a); },pvTeilen:()=>{ closeOverlays(); pvAktion(a); },pvSpeichern:()=>{ closeOverlays(); pvAktion(a); }};
  if(!F[a]) return; e.stopPropagation(); F[a](); },true);
