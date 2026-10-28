/* ===== QR-Aufkleber für Verteiler =====
   Jeder Aufkleber trägt eine Nummer (6 Zeichen, ohne 0/O/1/I) und den Link https://webapp.elektro-irrgang.de/q/#NUMMER.
   Fremde landen auf der öffentlichen Info-Seite (/q/, ohne Daten). Wer im Browser schon angemeldet ist, wird von dort
   in diese App geleitet (#qr=NUMMER) und landet direkt beim Verteiler. Die Nummer steht am Verteiler als v.qr.
   Bögen werden vorgedruckt (70 × 36 mm, 24 je A4) und vor Ort per Scan einem Verteiler zugeordnet. */
const QR_URL="https://webapp.elektro-irrgang.de/q/#", QR_ZEICHEN="23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
Object.assign(IC,{qr:"M3 11h8V3H3v8zm2-6h4v4H5V5zm-2 16h8v-8H3v8zm2-6h4v4H5v-4zM13 3v8h8V3h-8zm6 6h-4V5h4v4zm0 10h2v2h-2zm-6-6h2v2h-2zm2 2h2v2h-2zm-2 2h2v2h-2zm2 2h2v2h-2zm2-2h2v2h-2zm0-4h2v2h-2zm2 2h2v2h-2z"});
const qrZeig=c=>String(c||"").replace(/^(.{3})(.+)$/,"$1 $2");
/* Nummer aus gescanntem Text oder Eingabe: ganze URL, „#qr=…“ oder nur die Nummer */
function qrNorm(t){ t=String(t||"").trim(); const m=t.match(/\/q\/?[#?]([0-9A-Za-z]{6})\b/)||t.match(/qr=([0-9A-Za-z]{6})\b/i); const c=(m?m[1]:t).toUpperCase().replace(/[\s-]/g,"");
  return /^[0-9A-Z]{6}$/.test(c)&&[...c].every(z=>QR_ZEICHEN.includes(z))?c:""; }
function qrAlle(){ const S=new Map(); for(const g0 of live("gebaeude")){ const g=ecGebNorm(g0); g.verteiler.forEach(v=>{ if(v.qr) S.set(v.qr,{g,v}); }); } return S; }
function qrNeu(belegt){ const S=belegt||qrAlle(); let c=""; const r=new Uint32Array(6);
  do{ crypto.getRandomValues(r); c=[...r].map(x=>QR_ZEICHEN[x%QR_ZEICHEN.length]).join(""); }while(S.has(c)); S.set(c,1); return c; }
/* QR als Matrix (qrcode-generator) – als SVG für die App, als Rechtecke fürs PDF */
function qrMatrix(c){ const q=qrcode(0,"M"); q.addData(QR_URL+c); q.make(); const n=q.getModuleCount(), M=[]; for(let y=0;y<n;y++){ M.push([]); for(let x=0;x<n;x++) M[y].push(q.isDark(y,x)); } return M; }
function qrSvg(c,px){ const M=qrMatrix(c), n=M.length, r=n+8; let d=""; M.forEach((z,y)=>z.forEach((on,x)=>{ if(on) d+=`M${x+4} ${y+4}h1v1h-1z`; }));
  return `<svg class="qr-svg" viewBox="0 0 ${r} ${r}" width="${px}" height="${px}" shape-rendering="crispEdges" aria-label="QR-Code ${esc(qrZeig(c))}"><rect width="${r}" height="${r}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`; }

/* ---- Öffnen nach Scan ---- */
let QR_WARTET="";
function qrOeffnen(c,nochmal){ c=qrNorm(c); if(!c){ toast("Kein Irrgang-Aufkleber erkannt"); return; }
  const t=qrAlle().get(c); if(t){ QR_WARTET=""; go({v:"vt",g:t.g.id,id:t.v.id}); return; }
  if(!nochmal&&SYNC_ON&&ME.signedIn&&typeof syncNow==="function"){ toast("Aufkleber wird gesucht …"); Promise.resolve(syncNow()).catch(()=>{}).then(()=>qrOeffnen(c,true)); return; }
  qrZuDlg(c); }
/* Aufruf über die Info-Seite: …/echeck/#qr=NUMMER – nach der Anmeldung weiter */
function qrStart(){ const m=location.hash.match(/qr=([0-9A-Za-z]{6})/); if(!m) return; QR_WARTET=m[1].toUpperCase();
  try{ history.replaceState(null,"",location.pathname+location.search); }catch(e){} qrNachLogin(); }
function qrNachLogin(){ if(!QR_WARTET||nav.v==="login") return; const c=QR_WARTET; QR_WARTET=""; setTimeout(()=>qrOeffnen(c),0); }
addEventListener("hashchange",qrStart);

/* ---- Unbekannter Aufkleber: einem Verteiler zuordnen ---- */
let qrZu={c:"",such:""};
function qrZuListe(){ const q=qrZu.such.trim().toLowerCase(), A=vtListenEintraege().filter(e=>!q||e.such.toLowerCase().includes(q)).sort((a,b)=>(b.updated||0)-(a.updated||0)).slice(0,q?40:8);
  return A.length?listOf(A.map(({vt:{g,v}})=>{ const o=ecOrt(g.ortId); return `<div class="li" role="button" tabindex="0" data-act="qrZuOk" data-g="${esc(g.id)}" data-id="${esc(v.id)}"><span class="av">${icon("ecMess")}</span><span class="lt"><span class="h">${esc(v.name||"Verteiler")}</span><span class="s">${esc([o.titel,v.qr&&"hat schon "+qrZeig(v.qr)].filter(Boolean).join(" · "))}</span></span>${icon("chev")}</div>`; }))
    :`<p class="meta">${q?"Kein Verteiler gefunden.":"Noch keine Verteiler angelegt."}</p>`; }
function qrZuDlg(c){ qrZu={c,such:""};
  dialog("Neuer Aufkleber",`<div class="qr-neu">${qrSvg(c,72)}<div><b class="qr-nr">${esc(qrZeig(c))}</b><p class="meta">Dieser Aufkleber ist noch keinem Verteiler zugeordnet. Verteiler wählen, an dem er klebt.</p></div></div>
    <div class="fg1">${tf("qrSuch","Kunde oder Verteiler suchen","",{form:true,ph:"Name, Ort, Verteiler"})}</div><div id="qrZuL">${qrZuListe()}</div>
    <p class="hint">Fehlt der Verteiler? Erst beim Kunden anlegen, dann den Aufkleber noch einmal scannen.</p>`,
    `<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button>`,{breit:true}); }
document.addEventListener("input",e=>{ if(e.target&&e.target.id==="f_qrSuch"){ qrZu.such=e.target.value; const l=document.getElementById("qrZuL"); if(l) l.innerHTML=qrZuListe(); } });
function qrSetzen(gid,vId,c){ const g=vtGeb(gid), v=g&&g.verteiler.find(x=>x.id===vId); if(!v) return false;
  const alt=qrAlle().get(c); if(alt&&alt.v.id!==vId){ delete alt.v.qr; alt.v.updated=Date.now(); ecGebSpeichern(alt.g); }
  v.qr=c; v.updated=Date.now(); ecGebSpeichern(g); return true; }

/* ---- Karte auf der Verteiler-Seite ---- */
function qrKarte(L){ const g=vtGeb(L._geb), v=g&&g.verteiler.find(x=>x.id===L._v); if(!v) return "";
  return `<section class="card qr-karte"><h3>QR-Aufkleber</h3>${v.qr?`<div class="qr-zeile">${qrSvg(v.qr,76)}<div class="qr-txt"><b class="qr-nr">${esc(qrZeig(v.qr))}</b><span class="meta">Klebt am Verteiler. Scannen öffnet diese Seite, Fremde sehen nur unsere Kontaktdaten.</span></div></div>
      <div class="qr-knoepfe"><button type="button" class="btn-tonal" data-act="qrDruck1">${icon("pdf")}Drucken</button><button type="button" class="btn-text" data-act="qrScanZu">Ersetzen</button><button type="button" class="btn-text danger" data-act="qrWegAsk">Entfernen</button></div>`
    :`<p class="meta">Noch kein Aufkleber. Einen vom Bogen aufkleben und scannen – oder einen einzelnen für diesen Verteiler drucken.</p>
      <div class="qr-knoepfe"><button type="button" class="btn-tonal" data-act="qrScanZu">${icon("qr")}Aufkleber scannen</button><button type="button" class="btn-tonal" data-act="qrNeu1">${icon("pdf")}Einzeln drucken</button></div>`}</section>`; }

/* ---- Scanner (Kamera) ---- */
let QR_CAM=null;
function qrJsqr(){ if(window.jsQR) return Promise.resolve(window.jsQR); return new Promise((ok,no)=>{ const s=document.createElement("script"); s.src="../vendor/jsqr.min.js"; s.onload=()=>ok(window.jsQR); s.onerror=()=>no(new Error("Scanner nicht erreichbar")); document.head.appendChild(s); }); }
function qrStop(){ if(!QR_CAM) return; QR_CAM.aus=true; try{ QR_CAM.st&&QR_CAM.st.getTracks().forEach(t=>t.stop()); }catch(e){} QR_CAM=null; }
function qrScan(ziel){ qrStop();
  dialog("Aufkleber scannen",`<div class="qr-cam"><video id="qrVid" playsinline muted autoplay></video><span class="qr-rahmen"></span><p class="qr-cam-msg" id="qrMsg">Kamera wird gestartet …</p></div>
    <div class="fg1" style="margin-top:14px">${tf("qrNr","Oder Nummer eintippen","",{form:true,ph:"z. B. 4K7 P2M"})}</div>`,
    `<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="qrNrOk">Öffnen</button>`,{breit:true});
  setTimeout(()=>{ const f=document.getElementById("f_qrNr"); if(f&&document.activeElement===f) f.blur(); },90);
  const cam=QR_CAM={ziel:ziel||null,aus:false}, msg=t=>{ const m=document.getElementById("qrMsg"); if(m) m.textContent=t; };
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){ msg("Keine Kamera verfügbar – Nummer unten eintippen."); return; }
  navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1280},height:{ideal:720}},audio:false}).then(async st=>{
    if(cam.aus){ st.getTracks().forEach(t=>t.stop()); return; } cam.st=st; const vid=document.getElementById("qrVid"); if(!vid){ qrStop(); return; }
    vid.srcObject=st; try{ await vid.play(); }catch(e){} msg("Aufkleber in den Rahmen halten");
    let det=null; try{ if("BarcodeDetector" in window&&(await BarcodeDetector.getSupportedFormats()).includes("qr_code")) det=new BarcodeDetector({formats:["qr_code"]}); }catch(e){}
    let jq=null; if(!det){ try{ jq=await qrJsqr(); }catch(e){ msg("Scanner braucht einmal Internet – Nummer unten eintippen."); return; } }
    const cv=document.createElement("canvas"), cx=cv.getContext("2d",{willReadFrequently:true});
    const runde=async()=>{ if(cam.aus||document.getElementById("dlg").hidden){ qrStop(); return; }
      if(vid.readyState>=2){ let t="";
        try{ if(det){ const r=await det.detect(vid); t=r[0]&&r[0].rawValue||""; }
          else { const w=vid.videoWidth, h=vid.videoHeight, s=Math.min(1,640/Math.max(w,h)); cv.width=w*s|0; cv.height=h*s|0; cx.drawImage(vid,0,0,cv.width,cv.height); const r=jq(cx.getImageData(0,0,cv.width,cv.height).data,cv.width,cv.height,{inversionAttempts:"dontInvert"}); t=r&&r.data||""; } }catch(e){}
        if(t){ const c=qrNorm(t); if(c){ const z=cam.ziel; qrStop(); closeOverlays(); if(navigator.vibrate) navigator.vibrate(40); z?qrZuweisen(z,c):qrOeffnen(c); return; } msg("Das ist kein Irrgang-Aufkleber"); } }
      setTimeout(runde,det?120:180); };
    runde();
  }).catch(e=>{ msg(/NotAllowed|Permission/i.test(e&&e.name||"")?"Kamera nicht erlaubt – in den Einstellungen freigeben oder Nummer eintippen.":"Kamera nicht verfügbar – Nummer unten eintippen."); }); }
function qrZuweisen(z,c){ const alt=qrAlle().get(c);
  if(alt&&alt.v.id===z.id){ toast("Aufkleber ist schon diesem Verteiler zugeordnet"); return; }
  qrSetzen(z.g,z.id,c); render(); toast(alt?`Aufkleber ${qrZeig(c)} umgehängt von „${alt.v.name||"Verteiler"}“`:`Aufkleber ${qrZeig(c)} zugeordnet`); }

/* ---- PDF: einzelner Aufkleber (70 × 36 mm) oder A4-Bogen 3 × 8 ---- */
let QR_LOGO=null;   /* Logo für die Aufkleber verkleinert (das Original wäre je PDF rund 1 MB) */
function qrLogo(){ return QR_LOGO||(QR_LOGO=new Promise(ok=>{ const i=new Image(); i.onload=()=>{ const w=560, h=Math.round(w*i.naturalHeight/i.naturalWidth), c=document.createElement("canvas"); c.width=w; c.height=h; c.getContext("2d").drawImage(i,0,0,w,h); ok({src:c.toDataURL("image/png"),r:h/w}); }; i.onerror=()=>ok(null); i.src=LOGO_PDF; })); }
function qrEtikett(d,x,y,c,logo){ const W=70,H=36, Q=27, qx=x+4, qy=y+(H-Q)/2, M=qrMatrix(c), n=M.length, m=Q/n;
  d.setFillColor(0,0,0); M.forEach((z,r)=>{ let s=-1; z.forEach((on,k)=>{ if(on&&s<0) s=k; if((!on||k===n-1)&&s>=0){ const e=on?k+1:k; d.rect(qx+s*m,qy+r*m,(e-s)*m+.02,m+.02,"F"); s=-1; } }); });
  const tx=x+Q+8, tw=W-Q-11;
  if(logo) try{ d.addImage(logo.src,"PNG",tx,y+4.2,tw,tw*logo.r,"irrlogo","FAST"); }catch(e){}
  d.setTextColor(93,107,123); d.setFont("helvetica","normal"); d.setFontSize(5.7); d.text("Elektrische Anlage | Doku per Scan",tx,y+13.4);
  d.setFontSize(5.6); d.text("Anlagen-Nr.",tx,y+18.4);
  d.setTextColor(20,20,20); d.setFont("helvetica","bold"); d.setFontSize(15); d.text(qrZeig(c),tx,y+24.6);
  d.setTextColor(225,29,47); d.setFontSize(8.4); d.text("Tel. 02291 4878",tx,y+31.2); }
async function qrPdf(codes,einzeln){ const lib=await pdfLib(), logo=await qrLogo(); let d;
  if(einzeln){ d=new lib.jsPDF({unit:"mm",format:[70,36],orientation:"landscape",compress:true}); codes.forEach((c,i)=>{ if(i) d.addPage([70,36],"landscape"); qrEtikett(d,0,0,c,logo); }); }
  else { d=new lib.jsPDF({unit:"mm",format:"a4",compress:true}); codes.forEach((c,i)=>{ const p=i%24; if(i&&!p) d.addPage(); qrEtikett(d,(p%3)*70,4.5+Math.floor(p/3)*36,c,logo); }); }
  return d.output("blob"); }
async function qrPdfZeigen(codes,einzeln,name){ toast("PDF wird erstellt …"); let b; try{ b=await qrPdf(codes,einzeln); }catch(e){ console.error(e); toast("PDF konnte nicht erstellt werden – Internet für die PDF-Bibliothek nötig"); return; }
  const url=URL.createObjectURL(b); toast("Aufkleber bereit","Öffnen",()=>{ if(DESK.matches){ const a=document.createElement("a"); a.href=url; a.download=name+".pdf"; document.body.appendChild(a); a.click(); a.remove(); } window.open(url,"_blank","noopener"); }); }
function qrBogenDlg(){ dialog("QR-Aufkleber drucken",`<p>Jeder Aufkleber bekommt eine neue Nummer. Vor Ort aufkleben und mit der App scannen – dann gehört er zum Verteiler.</p>
  <div class="chips ec-wahl" style="margin-top:12px">${[1,2,5].map(n=>`<button type="button" class="chip" data-act="qrBogenOk" data-n="${n}">${n} ${n>1?"Bögen":"Bogen"} · ${n*24} Stück</button>`).join("")}</div>
  <p class="hint">Format 70 × 36 mm, 24 Stück je A4-Bogen (3 × 8, ohne Rand links und rechts). Für den Schaltschrank Folien-Etiketten nehmen. Beim Drucken „Tatsächliche Größe“ bzw. 100 % wählen.</p>`,
  `<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button>`); }

document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act^="qr"]'); if(!b||b.disabled) return; e.stopPropagation(); const a=b.dataset.act;
  if(a==="qrScan"){ qrScan(); return; }
  if(a==="qrScanZu"){ if(nav.v!=="vt") return; qrScan({g:nav.g,id:nav.id}); return; }
  if(a==="qrNrOk"){ const c=qrNorm((document.getElementById("f_qrNr")||{}).value); if(!c){ toast("Nummer hat 6 Zeichen, z. B. 4K7 P2M"); return; } const z=QR_CAM&&QR_CAM.ziel; qrStop(); closeOverlays(); z?qrZuweisen(z,c):qrOeffnen(c); return; }
  if(a==="qrZuOk"){ const c=qrZu.c; if(!c) return; qrSetzen(b.dataset.g,b.dataset.id,c); closeOverlays(); go({v:"vt",g:b.dataset.g,id:b.dataset.id}); toast(`Aufkleber ${qrZeig(c)} zugeordnet`); return; }
  if(a==="qrNeu1"){ if(nav.v!=="vt") return; const c=qrNeu(); qrSetzen(nav.g,nav.id,c); render(); const v=(vtGeb(nav.g)||{verteiler:[]}).verteiler.find(x=>x.id===nav.id); qrPdfZeigen([c],true,`QR-Aufkleber ${v&&v.name||""} ${c}`.trim()); return; }
  if(a==="qrDruck1"){ const v=nav.v==="vt"&&(vtGeb(nav.g)||{verteiler:[]}).verteiler.find(x=>x.id===nav.id); if(v&&v.qr) qrPdfZeigen([v.qr],true,`QR-Aufkleber ${v.name||""} ${v.qr}`.trim()); return; }
  if(a==="qrWegAsk"){ confirmDlg("Aufkleber entfernen?","Die Nummer gehört dann zu keinem Verteiler mehr. Scannt jemand den alten Aufkleber, fragt die App, wohin er gehört.","Entfernen","qrWegOk"); return; }
  if(a==="qrWegOk"){ const g=vtGeb(nav.g), v=g&&g.verteiler.find(x=>x.id===nav.id); if(v){ delete v.qr; v.updated=Date.now(); ecGebSpeichern(g); } closeOverlays(); render(); return; }
  if(a==="qrBogen"){ qrBogenDlg(); return; }
  if(a==="qrBogenOk"){ const n=+b.dataset.n||1, S=qrAlle(), C=[]; for(let i=0;i<n*24;i++) C.push(qrNeu(S)); closeOverlays(); qrPdfZeigen(C,false,`QR-Aufkleber ${ecHeute()} (${C.length} Stück)`); return; }
},true);
