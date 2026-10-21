/* ===== Irrgang-PDF-Layout – gemeinsam für alle Apps (tools/build.py setzt es ein) =====
   Vorlage ist das EVSE-Prüfprotokoll: weißer Kopf mit Logo links, Titel rechts (EVSE zusätzlich e-handwerk-Zeichen),
   rote Linie, graue Abschnittsbalken mit rotem Rand, Wertepaare mit Trennlinien, dunkle Tabellenköpfe, Ergebnis-Plaketten,
   Fußzeile mit Anschrift, Kontextzeile und Seitenzahl. jsPDF wird bei Bedarf nachgeladen (liegt unter /vendor). */
const PDF_EHW="<!--EHANDWERK-->";
const PDF_MAP={"²":"2","³":"3","≈":"ca.","Ω":"Ohm","≤":"<=","≥":">=","→":"->","↔":"<->","–":"-","—":"-","Δ":"d","…":"...","·":"|","„":"\"","“":"\"","”":"\"","÷":"/","×":"x","›":">"};
const pdfT=s=>String(s??"").replace(/[²³≈Ω≤≥→↔–—Δ…·„“”÷×›]/g,c=>PDF_MAP[c]);
let PDF_LIB=null;
function pdfLib(){ if(window.jspdf) return Promise.resolve(window.jspdf); if(PDF_LIB) return PDF_LIB;
  PDF_LIB=new Promise((ok,no)=>{ const s=document.createElement("script"); s.src="../vendor/jspdf.umd.min.js"; s.onload=()=>ok(window.jspdf); s.onerror=()=>{ PDF_LIB=null; no(new Error("PDF-Bibliothek nicht erreichbar")); }; document.head.appendChild(s); });
  return PDF_LIB; }
/* pdfStil(d,{titel,unter,fuss,ehw}) → Bausteine; y ist die aktuelle Schreibhöhe in mm */
function pdfStil(d,o){
  const W=210,M=14,CW=W-2*M, NAVY=[34,34,34],SIG=[225,29,47],GR=[93,107,123],LINE=[211,218,227],OKC=[31,138,76],BADC=[198,40,40],SUNK=[238,241,245];
  const S={W,M,CW,y:0,NAVY,GR,SUNK,LINE,OKC,BADC};
  S.kopf=(t,u)=>{ t=t||o.titel; u=u==null?o.unter:u; d.setFillColor(255,255,255); d.rect(0,0,W,26,"F");
    try{ d.addImage(LOGO_PDF,"PNG",M,6,57,10); }catch(e){}
    let tx=W-M; if(o.ehw){ const eh=14.8, ew=eh*525/462; try{ d.addImage(PDF_EHW,"JPEG",W-M-ew,4.6,ew,eh,"ehw"); }catch(e){} tx=W-M-ew-5; }
    d.setTextColor(...NAVY); d.setFont("helvetica","bold"); d.setFontSize(13); d.text(pdfT(t),tx,11,{align:"right"});
    d.setFont("helvetica","normal"); d.setFontSize(8); d.setTextColor(...GR); d.text(pdfT(u||"").slice(0,95),tx,17,{align:"right"});
    d.setFillColor(...SIG); d.rect(0,24,W,1.4,"F"); S.y=34;
    if(o.wasser){ d.setFont("helvetica","bold"); d.setFontSize(70); d.setTextColor(241,242,244); d.text(pdfT(o.wasser),52,200,{angle:35}); } };
  S.fuss=()=>{ d.setDrawColor(...LINE); d.line(M,284,W-M,284); d.setFont("helvetica","normal"); d.setFontSize(7); d.setTextColor(...GR);
    d.text("Elektro Irrgang | Hahner Weg 2 | 51545 Waldbröl | Tel. 02291 4878 | info@elektro-irrgang.de",M,288); if(o.fuss) d.text(pdfT(o.fuss),M,292); };
  S.seite=(t,u)=>{ S.fuss(); d.addPage(); S.kopf(t,u); };
  S.platz=(h,t,u)=>{ if(S.y+h>278) S.seite(t||o.titel+" (Fortsetzung)",u); };
  S.abschnitt=t=>{ S.platz(16); d.setFillColor(...SUNK); d.rect(M,S.y-4.5,CW,7,"F"); d.setFillColor(...SIG); d.rect(M,S.y-4.5,1.2,7,"F"); d.setTextColor(...NAVY); d.setFont("helvetica","bold"); d.setFontSize(9.5); d.text(pdfT(t),M+4,S.y); S.y+=8; };
  S.werte=prs=>{ const cw=CW/2, LH=3.7; d.setFontSize(8.5); for(let i=0;i<prs.length;i+=2){ let n=1; S.platz(8);
      for(let c=0;c<2&&i+c<prs.length;c++){ const [k,v]=prs[i+c],x=M+c*cw; d.setFont("helvetica","normal"); d.setTextColor(...GR); d.text(pdfT(k),x,S.y); d.setFont("helvetica","bold"); d.setTextColor(20);
        const l=d.splitTextToSize(pdfT(v||"-"),cw-35); d.text(l,x+32,S.y,{lineHeightFactor:1.15}); n=Math.max(n,l.length); }
      const ex=(n-1)*LH; d.setDrawColor(...LINE); d.line(M,S.y+ex+1.9,M+CW,S.y+ex+1.9); S.y+=ex+6.1; } S.y+=2; };
  S.text=t=>{ d.setFont("helvetica","normal"); d.setFontSize(8.5); d.setTextColor(30); const l=d.splitTextToSize(pdfT(t||"-"),CW); S.platz(l.length*4+4); d.text(l,M,S.y); S.y+=l.length*4+4; };
  S.plakette=(x,yy,r,txt)=>{ const col=r==="ok"?OKC:r==="bad"?BADC:GR; d.setFillColor(...col); const t=pdfT(txt||(r==="ok"?"bestanden":r==="bad"?"nicht bestanden":"offen")).toUpperCase();
    d.setFontSize(7.5); d.setFont("helvetica","bold"); const w=d.getTextWidth(t)+5; d.roundedRect(x-w,yy-3.6,w,5,1.2,1.2,"F"); d.setTextColor(255); d.text(t,x-w+2.5,yy); };
  /* Tabelle: sp = Spaltenbreiten in mm (Summe ≤ CW); erg = Index der Spalte mit Ergebnis-Plakette ("ok"/"bad"/"open") */
  S.tabelle=(kopf,sp,zeilen,erg)=>{ const kz=()=>{ d.setFillColor(...NAVY); d.rect(M,S.y-4,CW,6,"F"); d.setTextColor(255); d.setFontSize(8); d.setFont("helvetica","bold"); let x=M+2; kopf.forEach((t,i)=>{ d.text(pdfT(t),x,S.y); x+=sp[i]; }); S.y+=6; };
    S.platz(14); kz();
    zeilen.forEach((z,ri)=>{ if(S.y>272){ S.seite(); kz(); } if(ri%2){ d.setFillColor(...SUNK); d.rect(M,S.y-4,CW,6,"F"); } let x=M+2; d.setFont("helvetica","normal"); d.setFontSize(8); d.setTextColor(20);
      z.forEach((v,i)=>{ if(i===erg) S.plakette(M+CW-1,S.y,v); else { const t=d.splitTextToSize(pdfT(v||"-"),sp[i]-2)[0]; d.text(t,x,S.y); } x+=sp[i]; }); S.y+=6; }); S.y+=4; };
  S.unterschriften=(L)=>{ S.platz(44); const sw=(CW-12)/2; L.forEach(([l,name,datum],i)=>{ const x=M+i*(sw+12); d.setDrawColor(40); d.line(x,S.y+30,x+sw,S.y+30);
      d.setFont("helvetica","normal"); d.setFontSize(8); d.setTextColor(...GR); d.text(pdfT(`${l}: ${name||""} | ${datum||""}`),x,S.y+35); }); S.y+=42; };
  S.ende=nr=>{ S.fuss(); const N=d.getNumberOfPages(); for(let i=1;i<=N;i++){ d.setPage(i); d.setFont("helvetica","normal"); d.setFontSize(7); d.setTextColor(...GR); d.text(`Seite ${i} von ${N}`,W-M,292,{align:"right"}); if(nr) d.text(pdfT(`Protokoll-Nr. ${nr}`),W-M,288,{align:"right"}); }
    return d.output("blob"); };
  return S; }
