/* ===== QR-Aufkleber – gemeinsamer Kern (Gebäudetechnik: Verteiler/Netzwerkschrank, EVSE: Wallbox) =====
   Nummer, QR-Matrix, PDF-Etikett 70 × 36 mm, Brother-Band 24 mm und Druck-Dialog.
   Jede App legt selbst fest: qrAlle() (Nummer → Objekt), qrArt(c) (Art im Link) und qrLink(c). */
const QR_URL="https://webapp.elektro-irrgang.de/q/#", QR_ZEICHEN="23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
Object.assign(IC,{qr:"M3 11h8V3H3v8zm2-6h4v4H5V5zm-2 16h8v-8H3v8zm2-6h4v4H5v-4zM13 3v8h8V3h-8zm6 6h-4V5h4v4zm0 10h2v2h-2zm-6-6h2v2h-2zm2 2h2v2h-2zm-2 2h2v2h-2zm2 2h2v2h-2zm2-2h2v2h-2zm0-4h2v2h-2zm2 2h2v2h-2z"});
const qrZeig=c=>String(c||"").replace(/^(.{3})(.+)$/,"$1 $2");
/* Nummer aus gescanntem Text oder Eingabe: ganze URL, „#qr=…“ oder nur die Nummer */
function qrNorm(t){ t=String(t||"").trim(); const m=t.match(/\/q\/?[#?]([0-9A-Za-z]{6})\b/)||t.match(/qr=([0-9A-Za-z]{6})\b/i); const c=(m?m[1]:t).toUpperCase().replace(/[\s-]/g,"");
  return /^[0-9A-Z]{6}$/.test(c)&&[...c].every(z=>QR_ZEICHEN.includes(z))?c:""; }
function qrNeu(belegt){ const S=belegt||qrAlle(); let c=""; const r=new Uint32Array(6);
  do{ crypto.getRandomValues(r); c=[...r].map(x=>QR_ZEICHEN[x%QR_ZEICHEN.length]).join(""); }while(S.has(c)); S.set(c,1); return c; }
/* QR als Matrix (qrcode-generator) – als SVG für die App, als Rechtecke fürs PDF */
/* Texte auf dem Aufkleber je Art – die App kann sie mit qrTexteApp(c) überschreiben (z. B. Name der Wallbox) */
const QR_TEXTE={"":{zeile:"Elektrische Anlage | Doku per Scan",nr:"Anlagen-Nr."},wb:{zeile:"Wallbox | Hilfe per Scan",nr:"Anlagen-Nr."},ws:{zeile:"Ladestation | Service per Scan",nr:"Service / Wartung"}};
function qrTexte(c){ const a=typeof qrArt==="function"?qrArt(c):"", T=QR_TEXTE[a]||QR_TEXTE[""], X=typeof qrTexteApp==="function"&&qrTexteApp(c); return X?{...T,...X}:T; }
function qrMatrix(c){ const q=qrcode(0,"M"); q.addData(qrLink(c)); q.make(); const n=q.getModuleCount(), M=[]; for(let y=0;y<n;y++){ M.push([]); for(let x=0;x<n;x++) M[y].push(q.isDark(y,x)); } return M; }
function qrSvg(c,px){ const M=qrMatrix(c), n=M.length, r=n+8; let d=""; M.forEach((z,y)=>z.forEach((on,x)=>{ if(on) d+=`M${x+4} ${y+4}h1v1h-1z`; }));
  return `<svg class="qr-svg" viewBox="0 0 ${r} ${r}" width="${px}" height="${px}" shape-rendering="crispEdges" aria-label="QR-Code ${esc(qrZeig(c))}"><rect width="${r}" height="${r}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`; }

/* ---- PDF: einzelner Aufkleber (70 × 36 mm) oder A4-Bogen 3 × 8 ---- */
let QR_LOGO=null;   /* Logo für die Aufkleber verkleinert (das Original wäre je PDF rund 1 MB) */
function qrLogo(){ return QR_LOGO||(QR_LOGO=new Promise(ok=>{ const i=new Image(); i.onload=()=>{ const w=560, h=Math.round(w*i.naturalHeight/i.naturalWidth), c=document.createElement("canvas"); c.width=w; c.height=h; c.getContext("2d").drawImage(i,0,0,w,h); ok({src:c.toDataURL("image/png"),r:h/w}); }; i.onerror=()=>ok(null); i.src=LOGO_PDF; })); }
function qrEtikett(d,x,y,c,logo){ const T=qrTexte(c), W=70,H=36, Q=27, qx=x+4, qy=y+(H-Q)/2, M=qrMatrix(c), n=M.length, m=Q/n;
  d.setFillColor(0,0,0); M.forEach((z,r)=>{ let s=-1; z.forEach((on,k)=>{ if(on&&s<0) s=k; if((!on||k===n-1)&&s>=0){ const e=on?k+1:k; d.rect(qx+s*m,qy+r*m,(e-s)*m+.02,m+.02,"F"); s=-1; } }); });
  const tx=x+Q+8, tw=W-Q-11;
  if(logo) try{ d.addImage(logo.src,"PNG",tx,y+4.2,tw,tw*logo.r,"irrlogo","FAST"); }catch(e){}
  d.setTextColor(93,107,123); d.setFont("helvetica","normal"); d.setFontSize(5.7); d.text(T.zeile,tx,y+13.4,{maxWidth:tw});
  d.setFontSize(5.6); d.text(T.nr,tx,y+18.4);
  d.setTextColor(20,20,20); d.setFont("helvetica","bold"); d.setFontSize(15); d.text(qrZeig(c),tx,y+24.6);
  d.setTextColor(225,29,47); d.setFontSize(8.4); d.text("Tel. 02291 4878",tx,y+31.2); }
async function qrPdf(codes,einzeln){ const lib=await pdfLib(), logo=await qrLogo(); let d;
  if(einzeln){ d=new lib.jsPDF({unit:"mm",format:[70,36],orientation:"landscape",compress:true}); codes.forEach((c,i)=>{ if(i) d.addPage([70,36],"landscape"); qrEtikett(d,0,0,c,logo); }); }
  else { d=new lib.jsPDF({unit:"mm",format:"a4",compress:true}); codes.forEach((c,i)=>{ const p=i%24; if(i&&!p) d.addPage(); qrEtikett(d,(p%3)*70,4.5+Math.floor(p/3)*36,c,logo); }); }
  return d.output("blob"); }
async function qrPdfZeigen(codes,einzeln,name){ toast("PDF wird erstellt …"); let b; try{ b=await qrPdf(codes,einzeln); }catch(e){ console.error(e); toast("PDF konnte nicht erstellt werden – Internet für die PDF-Bibliothek nötig"); return; }
  const url=URL.createObjectURL(b); toast("Aufkleber bereit","Öffnen",()=>{ if(DESK.matches){ const a=document.createElement("a"); a.href=url; a.download=name+".pdf"; document.body.appendChild(a); a.click(); a.remove(); } window.open(url,"_blank","noopener"); }); }
/* ---- Brother P-touch 24 mm (PT-E560BT): .lbxs wie eine in der Brother-App gespeicherte Datei (Vorlage „Asset management 24 mm“) ----
   Band 68 pt breit, Druckhöhe 51,2 pt (≈ 18 mm). QR als Brother-Barcode-Objekt (die App rechnet ihn selbst), Zelle 1,6 pt. Fehlerkorrektur 7 %: mit 15 % nimmt Brother für den Link eine Stufe größer (33 statt 29 Zellen = 18,6 mm), dann ragt der Code aus dem Druckbereich und stößt an den Text. */
const QR_BAND_L=128;   /* Länge des Inhalts in pt (45 mm; mit den Rändern der Brother-App ≈ 49 mm Etikett) */
function qrLbxXml(c){ const T=qrTexte(c), id=()=>Math.floor(Math.random()*0xFFFFF).toString(16), x2=v=>ecXml(v);
  const font=(sz,b)=>`<text:ptFontInfo><text:logFont name="sans-serif" width="0" italic="false" weight="${b?700:400}" charSet="0" pitchAndFamily="2"></text:logFont><text:fontExt effect="NOEFFECT" underline="0" strikeout="0" size="${sz}pt" orgSize="28.8pt" textColor="#000000" textPrintColorNumber="1"></text:fontExt></text:ptFontInfo>`;
  const stil=(x,y,w,h,pen)=>`<pt:objectStyle x="${x}pt" y="${y}pt" width="${w}pt" height="${h}pt" backColor="#FFFFFF" backPrintColorNumber="0" ropMode="COPYPEN" angle="0" anchor="TOPLEFT" flip="NONE"><pt:pen style="${pen||"NULL"}" widthX="0.5pt" widthY="0.5pt" color="#000000" printColorNumber="1"></pt:pen><pt:brush style="NULL" color="#000000" printColorNumber="1" id="0"></pt:brush><pt:expanded objectName="" objectID="${id()}" ID="0" lock="0" templateMergeTarget="LABELLIST" templateMergeType="NONE" templateMergeID="0" allowOutOfBoundsTransfer="false" linkStatus="NONE" linkID="0"></pt:expanded></pt:objectStyle>`;
  const tx=(x,y,w,h,sz,b,t)=>`<text:text>${stil(x,y,w,h)}${font(sz,b)}<text:textControl control="FIXEDFRAME" clipFrame="false" aspectNormal="true" shrink="true" autoLF="false" avoidImage="false"></text:textControl><text:textAlign horizontalAlignment="LEFT" verticalAlignment="CENTER" inLineAlignment="BASELINE"></text:textAlign><text:textStyle vertical="false" nullBlock="false" charSpace="0" lineSpace="0" orgPoint="${sz}pt" combinedChars="false"></text:textStyle><text:transferSettings editOnPrintFormat="" editOnPrintOrder="0"></text:transferSettings><pt:data>${x2(t)}</pt:data><text:stringItem charLen="${[...t].length}">${font(sz,b)}</text:stringItem></text:text>`;
  const L=QR_BAND_L, tX=68.7, tW=Math.round((L+5.6-tX-1)*10)/10;   /* Brother zeichnet den QR ≈ 1,1 mm weiter rechts/unten als angegeben – 7,5 pt ergibt 3,75 mm Rand ringsum */
  return `<?xml version="1.0" encoding="UTF-8"?>\n<pt:document xmlns:pt="http://schemas.brother.info/ptouch/2007/lbx/main" xmlns:style="http://schemas.brother.info/ptouch/2007/lbx/style" xmlns:text="http://schemas.brother.info/ptouch/2007/lbx/text" xmlns:draw="http://schemas.brother.info/ptouch/2007/lbx/draw" xmlns:image="http://schemas.brother.info/ptouch/2007/lbx/image" xmlns:barcode="http://schemas.brother.info/ptouch/2007/lbx/barcode" xmlns:database="http://schemas.brother.info/ptouch/2007/lbx/database" xmlns:table="http://schemas.brother.info/ptouch/2007/lbx/table" xmlns:cable="http://schemas.brother.info/ptouch/2007/lbx/cable" version="1.11" generator="com.brother.ptouch.mobilecablelabeltool2">`
    +`<pt:body currentSheet="24" direction="LTR"><style:sheet name="24"><style:paper media="0" width="68pt" height="2834.4pt" marginLeft="8.4pt" marginTop="5.6pt" marginRight="8.4pt" marginBottom="5.6pt" orientation="landscape" autoLength="true" monochromeDisplay="true" printColorDisplay="false" printColorsID="0" paperColor="#FFFFFF" paperInk="#000000" split="1" format="261" backgroundTheme="0" printerID="32560" printerName="Brother PT-E560BT"></style:paper>`
    +`<style:cutLine regularCut="0pt" freeCut=""></style:cutLine><style:backGround x="5.6pt" y="8.4pt" width="${L}pt" height="51.2pt" brushStyle="NULL" brushId="0" userPattern="NONE" userPatternId="0" color="#000000" printColorNumber="1" backColor="#FFFFFF" backPrintColorNumber="0"></style:backGround><pt:objects>`
    +`<barcode:barcode>${stil(7.5,7.5,46.4,46.4,"INSIDEFRAME")}<barcode:barcodeStyle protocol="QRCODE" lengths="48" zeroFill="false" barWidth="1.2pt" barRatio="1:3" humanReadable="true" humanReadableAlignment="LEFT" checkDigit="false" autoLengths="true" margin="true" sameLengthBar="false" bearerBar="false"></barcode:barcodeStyle><barcode:qrcodeStyle model="2" eccLevel="7%" cellSize="1.6pt" mbcs="65001" joint="1" version="auto"></barcode:qrcodeStyle><pt:data>${x2(qrLink(c))}</pt:data></barcode:barcode>`
    +tx(tX,9.4,tW,12,10,true,"Elektro Irrgang")+tx(tX,21.4,tW,7.6,6,false,T.nr)+tx(tX,28.4,tW,17.6,16,true,qrZeig(c))+tx(tX,46.2,tW,11.6,8.5,true,"Tel. 02291 4878")
    +`</pt:objects></style:sheet></pt:body></pt:document>`; }
const qrLbxs=(name,c)=>ecZip([{name:"config.json",daten:JSON.stringify({Version:"1.0",CurrentLbx:name+".lbx",CurrentCsv:""})},{name:name+".lbx",daten:ecZip([{name:"label.xml",daten:qrLbxXml(c)},{name:"prop.xml",daten:ecLbxProp(name)}])}]);
/* Vorschau des Bands in mm (QR 18 mm, Text daneben) */
function qrBandSvg(c){ const T=qrTexte(c), M=qrMatrix(c), n=M.length, Q=18, m=Q/n, L=56, H=24, y0=3; let d="";
  M.forEach((z,y)=>z.forEach((on,x)=>{ if(on) d+=`M${(2.6+x*m).toFixed(3)} ${(y0+y*m).toFixed(3)}h${m.toFixed(3)}v${m.toFixed(3)}h-${m.toFixed(3)}z`; }));
  const tx=2.6+Q+2.8;
  return `<svg class="qr-band" viewBox="0 0 ${L} ${H}" role="img" aria-label="Vorschau Brother-Band 24 mm"><rect width="${L}" height="${H}" rx="1.2" fill="#fff"/><path d="${d}" fill="#000"/>
    <text x="${tx}" y="7.2" font-size="3.5" font-weight="800" fill="#000">Elektro Irrgang</text><text x="${tx}" y="10.2" font-size="2.1" fill="#000">${esc(T.nr)}</text>
    <text x="${tx}" y="16.2" font-size="5.6" font-weight="800" fill="#000">${esc(qrZeig(c))}</text><text x="${tx}" y="20.4" font-size="3" font-weight="700" fill="#000">Tel. 02291 4878</text></svg>`; }
let qrDruckC="", qrDruckName="";
function qrDruckDlg(c,name){ qrDruckC=c; qrDruckName=name;
  dialog("Aufkleber drucken",`<div class="qr-band-v">${qrBandSvg(c)}</div>
    <div class="qr-wahl">
      <button type="button" class="qr-w" data-act="qrBrother"><span class="av">${icon("tag")}</span><span class="lt"><span class="h">Brother · 24-mm-Band</span><span class="s">Für den PT-E560BT – Datei geht an die Brother-App</span></span>${icon("chev")}</button>
      <button type="button" class="qr-w" data-act="qrPdf1"><span class="av">${icon("pdf")}</span><span class="lt"><span class="h">PDF · Etikett 70 × 36 mm</span><span class="s">Für Etikettendrucker oder Bogen im Büro</span></span>${icon("chev")}</button>
    </div>`,`<span style="flex:1"></span><button class="btn-text" data-act="cancel">Schließen</button>`); }
async function qrBrother(){ const c=qrDruckC; if(!c) return; const name=bbFs(qrDruckName||`QR ${c}`), f=new File([qrLbxs(name,c)],name+".lbxs",{type:"application/octet-stream"});
  closeOverlays();
  if(navigator.canShare&&navigator.canShare({files:[f]})){ try{ await navigator.share({files:[f],title:f.name}); return; }catch(e){ if(e&&e.name==="AbortError") return; } }
  const a=document.createElement("a"); a.href=URL.createObjectURL(f); a.download=f.name; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },1500);
  toast("Brother-Datei heruntergeladen – in der Brother-App öffnen und drucken"); }
/* Druck-Dialog: Brother oder PDF */
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act="qrBrother"],[data-act="qrPdf1"]'); if(!b||b.disabled) return; e.stopPropagation();
  if(b.dataset.act==="qrBrother"){ qrBrother(); return; }
  const c=qrDruckC; closeOverlays(); if(c) qrPdfZeigen([c],true,qrDruckName||`QR ${c}`); },true);
