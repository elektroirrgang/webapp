/* ===== QR-Scanner für alle Apps (Entwurf C, 04.11.2026) =====
   Blatt von unten: die App bleibt im Hintergrund. Oben die Kamera mit Rahmen (Taschenlampe im Bild), darunter
   Chips „Alles · Verteiler · Netzwerkschrank · Nummer“ und „Zuletzt gescannt“ (pro Gerät, alle Apps).
   Erkannt → Rahmen grün, Scanner hält an und zeigt im Blatt, wohin der Aufkleber führt: „Öffnen“ oder „Weiter scannen“.
   Knopf oben rechts neben der Glocke in jeder App. In Gebäudetechnik öffnet er direkt (qr.js: qrTreffer/qrOeffnen),
   in den anderen Apps springt „Öffnen“ nach Gebäudetechnik (…/echeck/#qr=NUMMER).
   Aufruf: scOeffnen({titel, treffer:c=>({titel,sub,ic,knopf}), aktion:c=>…}) – mit treffer/aktion = Zuordnen-Modus (ohne Chips und Liste). */
IC.scQr=IC.scQr||"M3 11h8V3H3v8zm2-6h4v4H5V5zm-2 16h8v-8H3v8zm2-6h4v4H5v-4zM13 3v8h8V3h-8zm6 6h-4V5h4v4zm0 10h2v2h-2zm-6-6h2v2h-2zm2 2h2v2h-2zm-2 2h2v2h-2zm2 2h2v2h-2zm2-2h2v2h-2zm0-4h2v2h-2zm2 2h2v2h-2z";
const SC_IC={zu:"M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",licht:"M6 2v6l4 4v10h4V12l4-4V2H6zm2 2h8v1H8V4z",
  tast:"M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 7H8v-2h8v2zm0-4h-2v-2h2v2zm0-3h-2V8h2v2zm3 3h-2v-2h2v2zm0-3h-2V8h2v2z",
  vt:"M7 2v11h3v9l7-12h-4l4-8z",wb:"M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33a2.5 2.5 0 0 0 2.5 2.5c.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v5a2.5 2.5 0 0 0 5 0V9c0-.69-.28-1.32-.73-1.77zM18 10c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zM8 18v-4.5H6L10 6v5h2l-4 7z",schrank:"M3 4h18v6H3zm0 8h18v6H3zM6 6v2h2V6zm0 8v2h2v-2z",neu:"M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",foto:"M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zM9 2 7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z",qr:IC.scQr};
const scSvg=k=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${SC_IC[k]}"/></svg>`;
const SC_Z="23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
function scNorm(t){ if(typeof qrNorm==="function") return qrNorm(t); t=String(t||"").trim(); const m=t.match(/\/q\/?[#?]([0-9A-Za-z]{6})\b/)||t.match(/qr=([0-9A-Za-z]{6})\b/i); const c=(m?m[1]:t).toUpperCase().replace(/[\s-]/g,"");
  return /^[0-9A-Z]{6}$/.test(c)&&[...c].every(z=>SC_Z.includes(z))?c:""; }
const scZeig=c=>String(c||"").replace(/^(.{3})(.+)$/,"$1 $2");
/* Wallbox-Aufkleber (EVSE) außerhalb von EVSE: in den Geräten der Orte suchen, soweit diese App sie hat – oder am Link erkennen (&a=wb / &a=ws) */
const SC_EVSE=typeof qrWbOrte==="function";
function scWallbox(c){ if(SC_EVSE) return null;
  for(const k of ["ladeparks","standorte","kunden"]){ if(!DB[k]) continue; for(const o of live(k)){ const g=(o.geraete||[]).find(x=>x.qr===c); if(g) return {titel:g.name||g.typ||"Wallbox",sub:[g.typ,o.name].filter(Boolean).join(" · ")+" · öffnet in EVSE",ic:"wb",knopf:"Öffnen"}; } }
  if(SC&&SC.c===c&&/[&?#]a=w[bs]\b/i.test(SC.roh||"")) return {titel:`Wallbox ${scZeig(c)}`,sub:"Öffnet in EVSE",ic:"wb",knopf:"Öffnen"};
  return null; }
/* Ohne Gebäudetechnik: Aufkleber in den Gebäudedaten suchen, soweit diese App sie hat (Übersicht) */
function scSuche(c){ const W=scWallbox(c);
  if(typeof qrTreffer==="function"){ const T=qrTreffer(c); return W&&(!T||T.ic==="neu")?W:T; } if(W) return W;
  const G=DB.gebaeude?live("gebaeude"):[]; for(const g of G){ const ort=String(g.ortId||""), kid=ort.startsWith("k:")?ort.slice(2):((typeof standortOf==="function"&&standortOf(ort))||{}).kundeId, k=kid&&typeof kundeOf==="function"&&kundeOf(kid), st=!ort.startsWith("k:")&&typeof standortOf==="function"&&standortOf(ort);
    const sub=[k&&k.name,st&&st.name||k&&k.ort].filter(Boolean).join(" · ");
    const v=(g.verteiler||[]).find(x=>x.qr===c); if(v) return {titel:v.name||"Verteiler",sub,ic:"vt",knopf:"Öffnen"};
    const s=(g.schraenke||[]).find(x=>x.qr===c); if(s) return {titel:s.name||"Netzwerkschrank",sub,ic:"schrank",knopf:"Öffnen"}; }
  return {titel:`Aufkleber ${scZeig(c)}`,sub:"Öffnet in Gebäudetechnik",ic:"vt",knopf:"Öffnen"}; }
/* Zuletzt gescannt – nur auf diesem Gerät, für alle Apps gemeinsam (gleiche Adresse) */
const SC_LS="irrgang_scan_zuletzt";
function scZuletzt(){ try{ const L=JSON.parse(localStorage.getItem(SC_LS)||"[]"); return Array.isArray(L)?L:[]; }catch(e){ return []; } }
function scMerken(c,T){ if(!T||T.ic==="neu") return; try{ const L=scZuletzt().filter(x=>x.c!==c); L.unshift({c,t:Date.now(),titel:T.titel,sub:T.sub,ic:T.ic}); localStorage.setItem(SC_LS,JSON.stringify(L.slice(0,8))); }catch(e){} }
function scWann(t){ const d=new Date(t), h=new Date(), tag=x=>new Date(x.getFullYear(),x.getMonth(),x.getDate()).getTime(), n=Math.round((tag(h)-tag(d))/864e5);
  return n<=0?d.toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"}):n===1?"gestern":n<7?d.toLocaleDateString("de-DE",{weekday:"short"}).replace(".",""):d.toLocaleDateString("de-DE",{day:"numeric",month:"numeric"}); }
let SC=null;
const scZuord=()=>!!(SC&&(SC.opt.treffer||SC.opt.aktion));
function scListe(){ if(!SC) return; const box=SC.el.querySelector("#scListe"); if(!box) return;
  const f=SC.filter, L=scZuletzt().map(x=>{ let T=null; try{ T=scSuche(x.c); }catch(e){} if(!T||T.ic==="neu"||/^Aufkleber /.test(T.titel)) T={titel:x.titel,sub:x.sub,ic:x.ic}; return {...x,...T}; })
    .filter(x=>f==="alles"||x.ic===f);
  box.innerHTML=L.length?`<div class="sc-lbl">${SC.el.classList.contains("pc")?"Zuletzt geöffnet":"Zuletzt gescannt"}</div>${L.map(x=>`<button type="button" class="sc-li" data-sc="alt" data-c="${esc(x.c)}"><span class="sc-av">${scSvg(SC_IC[x.ic]&&x.ic!=="neu"?x.ic:"vt")}</span><span class="sc-kt"><b>${esc(x.titel||scZeig(x.c))}</b><small>${esc([x.sub,scWann(x.t)].filter(Boolean).join(" · "))}</small></span></button>`).join("")}`
    :`<p class="sc-leer">${f==="alles"?(SC.el.classList.contains("pc")?"Hier erscheinen die zuletzt geöffneten Anlagen.":"Hier erscheinen die zuletzt gescannten Aufkleber."):f==="schrank"?"Noch kein Netzwerkschrank gescannt.":f==="wb"?"Noch keine Wallbox gescannt.":"Noch kein Verteiler gescannt."}</p>`; }
function scZu(){ if(!SC) return; if(window.visualViewport){ visualViewport.removeEventListener("resize",scLage); visualViewport.removeEventListener("scroll",scLage); } removeEventListener("resize",scLage); document.removeEventListener("visibilitychange",scLage); const cam=SC; SC=null; cam.aus=true; try{ const b=cam.el.querySelector(".sc-bild"); if(b&&b.src) URL.revokeObjectURL(b.src); }catch(e){} try{ cam.st&&cam.st.getTracks().forEach(t=>t.stop()); }catch(e){}
  removeEventListener("keydown",scTaste); document.body.classList.remove("sc-offen"); cam.el.classList.add("weg"); setTimeout(()=>cam.el.remove(),220); }
function scTaste(e){ if(e.key==="Escape"&&SC){ e.preventDefault(); e.stopPropagation(); scZu(); } }
/* iPhone/iPad: kein Live-Bild, sondern ein Foto mit der iOS-Kamera (12 MP, Autofokus, Makro, ohne Kamera-Nachfrage).
   Safari kann QR-Codes im Live-Bild nicht selbst erkennen, und die Web-Kamera fragt in der Home-Bildschirm-App jedes Mal nach. */
const SC_IOS=/iP(hone|od|ad)/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
function scJq(){ return window.jsQR?Promise.resolve(window.jsQR):new Promise((ok,no)=>{ const s=document.createElement("script"); s.src="../vendor/jsqr.min.js"; s.onload=()=>ok(window.jsQR); s.onerror=()=>no(); document.head.appendChild(s); }); }
/* Foto (12 MP) auswerten: erst Mitte fast in voller Auflösung, dann ganzes Bild, dann Kacheln */
async function scFotoLesen(f,jq,info){
  const url=URL.createObjectURL(f), img=await new Promise((ok,no)=>{ const i=new Image(); i.onload=()=>ok(i); i.onerror=no; i.src=url; });
  const W=img.naturalWidth, H=img.naturalHeight, cv=document.createElement("canvas"), cx=cv.getContext("2d",{willReadFrequently:true});
  const lies=(x,y,w,h,max,inv)=>{ const z=Math.min(1,max/Math.max(w,h)); cv.width=Math.max(1,Math.round(w*z)); cv.height=Math.max(1,Math.round(h*z));
    cx.drawImage(img,x,y,w,h,0,0,cv.width,cv.height); const r=jq(cx.getImageData(0,0,cv.width,cv.height).data,cv.width,cv.height,{inversionAttempts:inv||"dontInvert"}); return r&&r.data||""; };
  const V=[[W*.25,H*.25,W*.5,H*.5,1600],[0,0,W,H,1600],[W*.35,H*.35,W*.3,H*.3,1400],[0,0,W,H,2400],[0,0,W,H,1000,"attemptBoth"]];
  for(let i=0;i<3;i++) for(let j=0;j<3;j++) V.push([W*i/4,H*j/4,W/2,H/2,1500]);
  try{ for(let k=0;k<V.length;k++){ const t=lies(...V[k]); if(t){ info&&info(k); return t; } await new Promise(r=>setTimeout(r,0)); } return ""; }
  finally{ URL.revokeObjectURL(url); cv.width=cv.height=0; } }
function scFoto(){ if(!SC) return; const i=SC.el.querySelector("#scDatei"); if(i){ i.value=""; i.click(); } }
async function scFotoDa(f){ const cam=SC; if(!cam||!f) return; [0,100,400,1000].forEach(ms=>setTimeout(scLage,ms)); const el=cam.el, hin=t=>{ const h=el.querySelector("#scHin"); if(h) h.textContent=t; };
  const bild=el.querySelector(".sc-bild"); try{ if(bild.src) URL.revokeObjectURL(bild.src); }catch(e){} bild.src=URL.createObjectURL(f); el.classList.add("liest"); hin("Wird gelesen …");
  let t=""; try{ t=await scFotoLesen(f,await scJq()); }catch(e){ if(SC===cam){ el.classList.remove("liest"); hin("Scanner braucht einmal Internet – Code eintippen"); } return; }
  if(SC!==cam) return; el.classList.remove("liest");
  const c=t&&scNorm(t); if(c){ hin("Erkannt"); scTreffer(c,t); return; }
  hin(t?"Das ist kein Irrgang-Aufkleber":"Kein Code erkannt – 20–30 cm Abstand, Licht von der Seite, nicht von vorn");
  el.querySelector(".sc-foto span").textContent="Nochmal fotografieren"; }
/* iOS: nach der Kamera (und bei offener Tastatur) stimmt „position:fixed; inset:0“ nicht mehr mit dem sichtbaren Bereich überein –
   die Ebene wird deshalb auf den tatsächlich sichtbaren Ausschnitt gelegt */
function scLage(){ if(!SC) return; const v=window.visualViewport, e=SC.el; if(!v) return; e.style.inset="auto"; e.style.left=v.offsetLeft+"px"; e.style.top=v.offsetTop+"px"; e.style.width=v.width+"px"; e.style.height=v.height+"px"; }
function scOeffnen(opt){ if(SC) scZu(); opt=opt||{}; if(typeof tipWeg==="function") tipWeg();
  /* Handy: Blatt von unten · iPad: Fenster in der Mitte · PC: Fenster in der Mitte, ohne Kamera – Code eintippen (z. B. wenn jemand von der Baustelle anruft) */
  const pc=typeof DESK!=="undefined"&&DESK.matches, mitte=pc||(typeof WIDE!=="undefined"?WIDE.matches:innerWidth>=744);
  const zu=!!(opt.treffer||opt.aktion), el=document.createElement("div"); el.className="sc"+(mitte?" mitte":"")+(pc?" pc":""); el.id="sc";
  if(pc&&!opt.titel) opt={...opt,titel:"Code eingeben"};
  const chip=(f,t)=>`<button type="button" class="sc-chip" data-sc="f" data-f="${f}" aria-pressed="${f==="alles"}"><span>${t}</span></button>`;
  el.innerHTML=`<div class="sc-scrim" data-sc="zu"></div><div class="sc-blatt" role="dialog" aria-modal="true" aria-label="${esc(opt.titel||"Aufkleber scannen")}">
    <div class="sc-griff"><i></i></div>
    <div class="sc-kopf"><b>${esc(opt.titel||"Aufkleber scannen")}</b><button type="button" class="sc-rk" data-sc="zu" aria-label="Schließen">${scSvg("zu")}</button></div>
    <div class="sc-cam"><video playsinline muted autoplay></video><div class="sc-loch"><i class="sc-e e1"></i><i class="sc-e e2"></i><i class="sc-e e3"></i><i class="sc-e e4"></i></div>
      <button type="button" class="sc-licht" data-sc="licht" aria-label="Taschenlampe" hidden>${scSvg("licht")}</button><p class="sc-hin" id="scHin">Kamera wird gestartet …</p>${SC_IOS&&!pc?`<img class="sc-bild" alt=""><button type="button" class="sc-foto" data-sc="foto"><i>${scSvg("foto")}</i><span>Aufkleber fotografieren</span></button><input type="file" id="scDatei" accept="image/*" capture="environment" hidden>`:""}
      <button type="button" class="sc-pill" data-sc="nr">${scSvg("tast")}<span>Code eintippen</span></button></div>
    <div class="sc-karte" id="scKarte" hidden></div>
    <div class="sc-rest">
      <div class="sc-ein" hidden>${pc?`<span class="sc-ein-ic">${scSvg("qr")}</span>`:""}<input id="scNr" placeholder="Code, z. B. 4K7 P2M" autocomplete="off" autocapitalize="characters" enterkeyhint="go" maxlength="9"><button type="button" class="sc-ok" data-sc="nrOk">${zu?"Zuordnen":"Öffnen"}</button></div>
      ${zu?"":`<div class="sc-chips">${chip("alles","Alles")+(SC_EVSE?chip("wb","Wallbox")+chip("vt","Verteiler"):chip("vt","Verteiler")+chip("schrank","Netzwerkschrank"))}</div><div id="scListe"></div>`}</div></div>`;
  document.body.appendChild(el); document.body.classList.add("sc-offen"); addEventListener("keydown",scTaste); if(window.visualViewport){ visualViewport.addEventListener("resize",scLage); visualViewport.addEventListener("scroll",scLage); } addEventListener("resize",scLage); document.addEventListener("visibilitychange",scLage);
  SC={el,opt,aus:false,pause:false,st:null,licht:false,filter:"alles"}; scListe(); scLage();
  requestAnimationFrame(()=>el.classList.add("da"));
  el.addEventListener("click",scKlick); el.querySelector("#scNr").addEventListener("keydown",e=>{ if(e.key==="Enter"){ e.preventDefault(); scNrOk(); } });
  /* Eingabe gleich als „4K7 P2M“ zeigen – so wie auf dem Aufkleber */
  el.querySelector("#scNr").addEventListener("input",e=>{ const i=e.target, r=i.value.toUpperCase().replace(/[^0-9A-Z]/g,"").slice(0,6), v=r.length>3?r.slice(0,3)+" "+r.slice(3):r; if(i.value!==v) i.value=v; });
  /* nach unten ziehen schließt */
  const bl=el.querySelector(".sc-blatt"); let y0=null, dy=0;
  if(!mitte) el.querySelectorAll(".sc-griff,.sc-kopf").forEach(z=>{ z.addEventListener("touchstart",e=>{ y0=e.touches[0].clientY; dy=0; bl.style.transition="none"; },{passive:true});
    z.addEventListener("touchmove",e=>{ if(y0==null) return; dy=Math.max(0,e.touches[0].clientY-y0); bl.style.transform=`translateY(${dy}px)`; },{passive:true});
    z.addEventListener("touchend",()=>{ if(y0==null) return; y0=null; bl.style.transition=""; bl.style.transform=""; if(dy>90) scZu(); }); });
  const hin=t=>{ const h=el.querySelector("#scHin"); if(h) h.textContent=t; };
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia||(typeof DESK!=="undefined"&&DESK.matches)){ el.classList.add("ohne"); hin(pc?"Der Code steht auf dem QR-Aufkleber unter „Anlage“ – 6 Zeichen, z. B. 4K7 P2M.":"Code vom Aufkleber eintippen"); scEingabe(true); return; }
  if(SC_IOS){ el.classList.add("foto"); hin("Aus 20–30 cm – der Aufkleber muss nicht bildfüllend sein");
    el.querySelector("#scDatei").addEventListener("change",e=>{ const f=e.target.files&&e.target.files[0]; if(f) scFotoDa(f); });
    scFoto(); return; }
  const cam=SC;
  navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080},advanced:[{focusMode:"continuous"}]},audio:false}).then(async st=>{
    if(cam.aus){ st.getTracks().forEach(t=>t.stop()); return; } cam.st=st; const vid=el.querySelector("video"); vid.srcObject=st; try{ await vid.play(); }catch(e){}
    hin("Aufkleber in den Rahmen halten");
    try{ const tr=st.getVideoTracks()[0], cap=tr.getCapabilities?tr.getCapabilities():{}; if(cap.torch) el.querySelector('[data-sc="licht"]').hidden=false;
      /* kleine Aufkleber (24-mm-Band): 2-fach zoomen, wo das Handy es kann – so bleibt man im Schärfebereich der Kamera */
      if(cap.zoom&&cap.zoom.max>=1.5) tr.applyConstraints({advanced:[{zoom:Math.min(2,cap.zoom.max)}]}).catch(()=>{});
      if(cap.focusMode&&cap.focusMode.includes("continuous")) tr.applyConstraints({advanced:[{focusMode:"continuous"}]}).catch(()=>{}); }catch(e){}
    let det=null; try{ if("BarcodeDetector" in window&&(await BarcodeDetector.getSupportedFormats()).includes("qr_code")) det=new BarcodeDetector({formats:["qr_code"]}); }catch(e){}
    let jq=null; if(!det){ try{ jq=await scJq(); }catch(e){ hin("Scanner braucht einmal Internet – Code eintippen"); return; } }
    const cv=document.createElement("canvas"), cx=cv.getContext("2d",{willReadFrequently:true}); let zuletzt="";
    /* Ausschnitt in der Bildmitte (dort ist der Rahmen) in voller Auflösung – kleine Codes werden nicht weggerechnet */
    let rd=0; const mitte=()=>{ const w=vid.videoWidth, h=vid.videoHeight, q=Math.round(Math.min(w,h)*0.75), z=Math.min(1,960/q); cv.width=q*z|0; cv.height=q*z|0;
      cx.drawImage(vid,(w-q)/2,(h-q)/2,q,q,0,0,cv.width,cv.height); return cv; };
    const runde=async()=>{ if(cam.aus) return; if(!cam.pause&&vid.readyState>=2){ let t=""; rd++;
        try{ if(det){ const r=await det.detect(rd%3?mitte():vid); t=r[0]&&r[0].rawValue||""; }
          else { mitte(); const r=jq(cx.getImageData(0,0,cv.width,cv.height).data,cv.width,cv.height,{inversionAttempts:rd%4?"dontInvert":"attemptBoth"}); t=r&&r.data||""; } }catch(e){}
        if(t){ const c=scNorm(t); if(c) scTreffer(c,t); else if(t!==zuletzt){ zuletzt=t; hin("Das ist kein Irrgang-Aufkleber"); setTimeout(()=>{ if(SC===cam&&!cam.pause) hin("Aufkleber in den Rahmen halten"); },1800); } } }
      setTimeout(runde,det?120:180); };
    runde();
  }).catch(e=>{ if(cam.aus) return; el.classList.add("ohne"); hin(/NotAllowed|Permission/i.test(e&&e.name||"")?"Kamera nicht erlaubt – Code eintippen":"Keine Kamera – Code eintippen"); scEingabe(true); }); }
function scEingabe(an){ if(!SC) return; const e=SC.el.querySelector(".sc-ein"), n=SC.el.querySelector('[data-sc="nr"]'); e.hidden=!an; if(n) n.hidden=an; if(an) setTimeout(()=>SC&&SC.el.querySelector("#scNr").focus(),60); }
function scNrOk(){ if(!SC) return; const c=scNorm(SC.el.querySelector("#scNr").value); if(!c){ const h=SC.el.querySelector("#scHin"); if(h) h.textContent="Der Code hat 6 Zeichen, z. B. 4K7 P2M"; return; } SC.el.querySelector("#scNr").blur(); scTreffer(c); }
function scTreffer(c,roh){ if(!SC||SC.pause) return; SC.pause=true; SC.c=c; SC.roh=roh||""; if(navigator.vibrate) try{ navigator.vibrate(40); }catch(e){}
  const T=(SC.opt.treffer||scSuche)(c)||{titel:`Aufkleber ${scZeig(c)}`,sub:"",ic:"vt",knopf:"Öffnen"}; SC.T=T;
  SC.el.classList.add("treffer"); scLage(); const k=SC.el.querySelector("#scKarte");
  k.innerHTML=`<div class="sc-k"><span class="sc-av">${scSvg(T.ic||"vt")}</span><div class="sc-kt"><b>${esc(T.titel)}</b>${T.sub?`<small>${esc(T.sub)}</small>`:""}<span class="sc-nr">${esc(scZeig(c))}</span></div></div>
    <div class="sc-kb"><button type="button" class="sc-n" data-sc="weiter">${SC.el.classList.contains("pc")?"Anderer Code":"Weiter scannen"}</button><button type="button" class="sc-h" data-sc="los">${esc(T.knopf||"Öffnen")}</button></div>`;
  k.hidden=false; if(SC.el.classList.contains("pc")) setTimeout(()=>{ const l=SC&&SC.el.querySelector('[data-sc="los"]'); if(l) l.focus(); },30); }
function scLos(c,T){ const f=SC&&SC.opt.aktion, art=SC&&SC.filter; if(!f) scMerken(c,T); scZu();
  if(f){ f(c); return; }
  if(T&&T.ic==="wb"&&!SC_EVSE){ location.href=`../evse/#qr=${encodeURIComponent(c)}`; return; }
  if(typeof qrOeffnen==="function"){ if(typeof qrZu!=="undefined") SC_ART=art==="schrank"?"schrank":"vt"; qrOeffnen(c); return; }
  location.href=`../echeck/#qr=${encodeURIComponent(c)}${art==="schrank"?"&art=schrank":""}`; }
var SC_ART="vt";
function scKlick(e){ const b=e.target.closest("[data-sc]"); if(!b||!SC) return; e.stopPropagation(); const a=b.dataset.sc;
  if(a==="zu") scZu();
  else if(a==="nr") scEingabe(true);
  else if(a==="foto") scFoto();
  else if(a==="nrOk") scNrOk();
  else if(a==="f"){ SC.filter=b.dataset.f; SC.el.querySelectorAll('[data-sc="f"]').forEach(x=>x.setAttribute("aria-pressed",String(x===b))); scListe(); }
  else if(a==="alt"){ const c=b.dataset.c, x=scZuletzt().find(z=>z.c===c); scLos(c,x); }
  else if(a==="licht"){ const tr=SC.st&&SC.st.getVideoTracks()[0]; if(!tr) return; SC.licht=!SC.licht; tr.applyConstraints({advanced:[{torch:SC.licht}]}).catch(()=>{}); b.classList.toggle("an",SC.licht); }
  else if(a==="weiter"){ SC.pause=false; SC.el.classList.remove("treffer"); SC.el.querySelector("#scKarte").hidden=true; if(SC.el.classList.contains("foto")&&!SC.el.classList.contains("ohne")){ scFoto(); return; } const n=SC.el.querySelector("#scNr"); if(n){ n.value=""; if(SC.el.classList.contains("ohne")) n.focus(); } }
  else if(a==="los") scLos(SC.c,SC.T); }
/* Knopf oben rechts neben der Glocke – in jeder App gleich */
function scKnopf(){ const gl=document.getElementById("glBtn"); if(!gl||document.getElementById("scBtn")) return;
  const b=document.createElement("button"); b.type="button"; b.className="glocke sc-btn"; b.id="scBtn"; b.dataset.act="scStart"; b.setAttribute("aria-label","QR-Aufkleber scannen"); b.title="QR-Aufkleber scannen";
  b.innerHTML=`<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="${IC.scQr}"/></svg>`; b.hidden=gl.hidden; gl.before(b);
  new MutationObserver(()=>{ b.hidden=gl.hidden; scPlatz(); }).observe(gl,{attributes:true,attributeFilter:["hidden"]});
  const n=document.getElementById("navbar"); if(n&&window.ResizeObserver) new ResizeObserver(()=>scPlatz()).observe(n); addEventListener("resize",()=>setTimeout(scPlatz,50)); scPlatz(); }
/* iPad: die Tab-Leiste sitzt mittig oben – ist sie breit, rückt sie so weit nach links, dass der Scanner-Knopf frei bleibt */
function scPlatz(){ const b=document.getElementById("scBtn"), n=document.getElementById("navbar"), bd=document.body; let ov=0;
  if(b&&!b.hidden&&n&&!n.hidden){ const rb=b.getBoundingClientRect(), rn=n.getBoundingClientRect(), cs=getComputedStyle(n);
    if(rb.width&&rn.width&&cs.position==="fixed"&&rn.top<rb.bottom&&rn.bottom>rb.top&&rn.width<innerWidth*0.9) ov=Math.ceil(innerWidth/2+rn.width/2+8-rb.left); }
  if(ov>0){ bd.style.setProperty("--sc-rueck",ov+"px"); bd.classList.add("sc-eng"); } else { bd.classList.remove("sc-eng"); bd.style.removeProperty("--sc-rueck"); } }
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",scKnopf); else setTimeout(scKnopf,0);
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act="scStart"]'); if(!b) return; e.stopPropagation(); e.preventDefault(); if(typeof closeOverlays==="function") closeOverlays(); scOeffnen(); },true);
