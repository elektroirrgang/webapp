/* ===== QR-Aufkleber für Verteiler =====
   Jeder Aufkleber trägt eine Nummer (6 Zeichen, ohne 0/O/1/I) und den Link https://webapp.elektro-irrgang.de/q/#NUMMER.
   Fremde landen auf der öffentlichen Info-Seite (/q/, ohne Daten). Wer im Browser schon angemeldet ist, wird von dort
   in diese App geleitet (#qr=NUMMER) und landet direkt beim Verteiler. Die Nummer steht am Verteiler als v.qr.
   Bögen werden vorgedruckt (70 × 36 mm, 24 je A4) und vor Ort per Scan einem Verteiler zugeordnet. */
/* Aufkleber → Verteiler (art "vt") oder Netzwerkschrank (art "schrank"); x ist das Objekt (Verteiler bzw. Schrank) */
function qrAlle(){ const S=new Map(); for(const g0 of live("gebaeude")){ const g=ecGebNorm(g0); g.verteiler.forEach(v=>{ if(v.qr) S.set(v.qr,{g,v,x:v,art:"vt"}); }); (g.schraenke||[]).forEach(x=>{ if(x.qr) S.set(x.qr,{g,x,art:"schrank"}); }); } return S; }
const qrArtName=t=>t.art==="schrank"?"Netzwerkschrank":"Verteiler";
/* für den Scanner (scanner.js): was steckt hinter der Nummer? */
function qrTreffer(c){ const t=qrAlle().get(c);
  if(!t) return {titel:"Neuer Aufkleber",sub:"Noch keinem Verteiler oder Netzwerkschrank zugeordnet",ic:"neu",knopf:"Zuordnen"};
  const o=ecOrt(t.g.ortId); return {titel:t.x.name||qrArtName(t),sub:[qrArtName(t),o.titel].filter(Boolean).join(" · "),ic:t.art==="schrank"?"schrank":"vt",knopf:"Öffnen"}; }
/* Netzwerkschrank öffnen: in der neuesten Netzwerkprüfung des Objekts, Bereich „Infrastruktur“ */
function qrSchrankOeffnen(g,x){ const P=live("echecks").filter(p=>p.ortId===g.ortId&&p.art==="netz").sort((a,b)=>String(b.datum||"").localeCompare(String(a.datum||"")));
  if(P.length){ if(typeof ecRkTab!=="undefined") ecRkTab="ansicht"; go({v:"ec",id:P[0].id,tab:"infra",schr:x.id}); return; }
  toast(`Für „${x.name||"Netzwerkschrank"}“ gibt es noch keine Netzwerkprüfung`); }
/* Art im Link – die öffentliche Seite (q/) hat keine Daten und erkennt so, was sie zeigen soll.
   Ergibt sich automatisch aus der Zuordnung: Netzwerkschrank → &a=netz, Zählerschrank (HV/Zählerschrank) → &a=zs, Unterverteilung → ohne.
   Vorgedruckte Bögen sind noch keinem Ort zugeordnet und tragen deshalb keine Art. */
function qrArt(c){ const t=c&&qrAlle().get(c); if(!t) return ""; if(t.art==="schrank") return "netz"; return t.x&&(t.x.art==="hv"||t.x.zs)?"zs":""; }
const qrLink=c=>{ const a=qrArt(c); return QR_URL+c+(a?"&a="+a:""); };

/* ---- Öffnen nach Scan ---- */
let QR_WARTET="";
function qrOeffnen(c,nochmal){ c=qrNorm(c); if(!c){ toast("Kein Irrgang-Aufkleber erkannt"); return; }
  const t=qrAlle().get(c); if(t){ QR_WARTET=""; if(typeof SC_ART!=="undefined") SC_ART="vt"; if(t.art==="schrank") qrSchrankOeffnen(t.g,t.x); else go({v:"vt",g:t.g.id,id:t.v.id,tab:"info"}); return; }
  if(!nochmal&&SYNC_ON&&ME.signedIn&&typeof syncNow==="function"){ toast("Aufkleber wird gesucht …"); Promise.resolve(syncNow()).catch(()=>{}).then(()=>qrOeffnen(c,true)); return; }
  qrZuDlg(c); }
/* Aufruf über die Info-Seite: …/echeck/#qr=NUMMER – nach der Anmeldung weiter */
function qrStart(){ const m=location.hash.match(/qr=([0-9A-Za-z]{6})/); if(!m) return; QR_WARTET=m[1].toUpperCase(); if(/art=schrank/.test(location.hash)&&typeof SC_ART!=="undefined") SC_ART="schrank";
  try{ history.replaceState(null,"",location.pathname+location.search); }catch(e){} qrNachLogin(); }
function qrNachLogin(){ if(!QR_WARTET||nav.v==="login") return; const c=QR_WARTET; QR_WARTET=""; setTimeout(()=>qrOeffnen(c),0); }
addEventListener("hashchange",qrStart);

/* ---- Unbekannter Aufkleber: einem Verteiler zuordnen ---- */
let qrZu={c:"",such:"",art:"vt"};
function qrSchrEintraege(){ const L=[]; for(const g0 of live("gebaeude")){ const g=ecGebNorm(g0), o=ecOrt(g.ortId); (g.schraenke||[]).forEach(x=>L.push({g,x,o,updated:g.updated||0,such:[x.name,o.titel,x.qr].filter(Boolean).join(" ")})); } return L; }
function qrZuListe(){ if(qrZu.art==="schrank"){ const q=qrZu.such.trim().toLowerCase(), A=qrSchrEintraege().filter(e=>!q||suPasst(q,e.such)).sort((a,b)=>b.updated-a.updated).slice(0,q?40:8);
    return A.length?listOf(A.map(({g,x,o})=>`<div class="li" role="button" tabindex="0" data-act="qrZuOk" data-art="schrank" data-g="${esc(g.id)}" data-id="${esc(x.id)}"><span class="av">${icon("ecNetz")}</span><span class="lt"><span class="h">${esc(x.name||"Netzwerkschrank")}</span><span class="s">${esc([o.titel,x.qr&&`hat schon ${qrZeig(x.qr)}`].filter(Boolean).join(" · "))}</span></span>${icon("chev")}</div>`)):`<p class="meta">${q?"Kein Netzwerkschrank gefunden.":"Noch keine Netzwerkschränke angelegt."}</p>`; }
  const q=qrZu.such.trim().toLowerCase(), A=vtListenEintraege().filter(e=>!q||suPasst(q,e.such)).sort((a,b)=>(b.updated||0)-(a.updated||0)).slice(0,q?40:8);
  return A.length?listOf(A.map(({vt:{g,v}})=>{ const o=ecOrt(g.ortId); return `<div class="li" role="button" tabindex="0" data-act="qrZuOk" data-g="${esc(g.id)}" data-id="${esc(v.id)}"><span class="av">${icon("ecMess")}</span><span class="lt"><span class="h">${esc(v.name||"Verteiler")}</span><span class="s">${esc([o.titel,v.qr&&"hat schon "+qrZeig(v.qr)].filter(Boolean).join(" · "))}</span></span>${icon("chev")}</div>`; }))
    :`<p class="meta">${q?"Kein Verteiler gefunden.":"Noch keine Verteiler angelegt."}</p>`; }
function qrZuDlg(c){ qrZu={c,such:"",art:typeof SC_ART!=="undefined"&&SC_ART==="schrank"?"schrank":"vt"}; if(typeof SC_ART!=="undefined") SC_ART="vt";
  dialog("Neuer Aufkleber",`<div class="qr-neu">${qrSvg(c,72)}<div><b class="qr-nr">${esc(qrZeig(c))}</b><p class="meta">Dieser Aufkleber ist noch nicht zugeordnet. Wählen, wo er klebt.</p></div></div>
    <div class="seg qr-art" role="group">${[["vt","Verteiler"],["schrank","Netzwerkschrank"]].map(([v,t])=>`<button type="button" data-act="qrZuArt" data-v="${v}" aria-pressed="${v===qrZu.art}">${t}</button>`).join("")}</div>
    <div class="fg1">${tf("qrSuch","Kunde, Verteiler oder Schrank suchen","",{form:true,ph:"Name, Ort"})}</div><div id="qrZuL">${qrZuListe()}</div>
    <p class="hint">Fehlt er? Erst beim Kunden anlegen (Verteiler unter Installation, Schrank in der Netzwerkprüfung), dann den Aufkleber noch einmal scannen.</p>`,
    `<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button>`,{breit:true}); }
document.addEventListener("input",e=>{ if(e.target&&e.target.id==="f_qrSuch"){ qrZu.such=e.target.value; const l=document.getElementById("qrZuL"); if(l) l.innerHTML=qrZuListe(); } });
function qrSetzen(gid,vId,c,art){ const g=vtGeb(gid), v=g&&(art==="schrank"?(g.schraenke||[]):g.verteiler).find(x=>x.id===vId); if(!v) return false;
  const alt=qrAlle().get(c); if(alt&&alt.x.id!==vId){ delete alt.x.qr; alt.x.updated=Date.now(); ecGebSpeichern(alt.g); }
  v.qr=c; v.updated=Date.now(); ecGebSpeichern(g); return true; }
/* Ziel der Aufkleber-Knöpfe auf der aktuellen Seite: Verteiler oder Netzwerkschrank */
function qrZielHier(){ if(nav.v==="vt"){ const g=vtGeb(nav.g), x=g&&g.verteiler.find(v=>v.id===nav.id); return x?{g:nav.g,id:nav.id,art:"vt",x}:null; }
  if(nav.v==="ec"&&nav.schr){ const p=DB.echecks.get(nav.id); if(!p) return null; const g=ecGeb(p.ortId), x=g&&(g.schraenke||[]).find(s=>s.id===nav.schr); return x?{g:g.id,id:x.id,art:"schrank",x}:null; } return null; }

/* ---- Karte auf der Verteiler-Seite ---- */
function qrKarte(L){ const g=vtGeb(L._geb), v=g&&g.verteiler.find(x=>x.id===L._v); if(!v) return "";
  const kn=(act,ic,t,kl)=>`<button type="button" class="qr-k${kl?" "+kl:""}" data-act="${act}">${icon(ic)}<span>${t}</span></button>`;
  return `<section class="card qr-karte"><h3>QR-Aufkleber</h3>${v.qr?`<div class="qr-zeile">${qrSvg(v.qr,112)}<div class="qr-txt"><small>Anlagen-Nr.</small><b class="qr-nr">${esc(qrZeig(v.qr))}</b><span class="meta">Scannen öffnet die Übersicht. Fremde sehen nur Kontakt und Störungshilfe.</span></div></div>
      <div class="qr-knoepfe">${kn("qrDruck1","tag","Drucken")}${kn("qrScanZu","qr","Ersetzen")}${kn("qrWegAsk","del","Entfernen","weg")}</div>`
    :`<p class="meta">Noch kein Aufkleber. Einen vom Bogen aufkleben und scannen – oder direkt einen neuen drucken (Brother 24 mm oder PDF).</p>
      <div class="qr-knoepfe zwei">${kn("qrScanZu","qr",DESK.matches?"Nummer eingeben":"Aufkleber scannen")}${kn("qrNeu1","tag","Neuen drucken")}</div>`}</section>`; }

function qrKarteSchrank(g,x,zu){ const kn=(act,ic,t,kl)=>`<button type="button" class="qr-k${kl?" "+kl:""}" data-act="${act}">${icon(ic)}<span>${t}</span></button>`;
  return `<section class="card qr-karte" style="margin-top:12px"><h3>QR-Aufkleber</h3>${x.qr?`<div class="qr-zeile">${qrSvg(x.qr,112)}<div class="qr-txt"><small>Anlagen-Nr.</small><b class="qr-nr">${esc(qrZeig(x.qr))}</b><span class="meta">Scannen öffnet diesen Netzwerkschrank.</span></div></div>
      ${zu?"":`<div class="qr-knoepfe">${kn("qrDruck1","tag","Drucken")}${kn("qrScanZu","qr","Ersetzen")}${kn("qrWegAsk","del","Entfernen","weg")}</div>`}`
    :`<p class="meta">Noch kein Aufkleber. Einen vom Bogen aufkleben und scannen – oder direkt einen neuen drucken.</p>
      ${zu?"":`<div class="qr-knoepfe zwei">${kn("qrScanZu","qr",DESK.matches?"Nummer eingeben":"Aufkleber scannen")}${kn("qrNeu1","tag","Neuen drucken")}</div>`}`}</section>`; }


/* ---- Pflicht: ohne QR-Aufkleber kein Abschluss (Max, 04.11.2026) ----
   Gilt für Verteiler (Legende „Abschließen“, Installationsprüfung) und Netzwerkschränke (Netzwerkprüfung).
   Kein „ohne Aufkleber abschließen“ – fehlt einer, bleibt es offen und steht in der Liste „ohne QR-Aufkleber“. */
function qrFehlend(pr){ const g=ecGeb(pr.ortId), U=pr.umfang||{};
  if(ecNz(pr)) return (g.schraenke||[]).filter(x=>!x.qr&&(!U.sIds||U.sIds.includes(x.id))).map(x=>({g,x,art:"schrank"}));
  if(ecAn(pr)) return g.verteiler.filter(v=>!v.qr&&(!U.vIds||U.vIds.includes(v.id))).map(x=>({g,x,art:"vt"}));
  return []; }
let QR_PFL=null;
function qrPflichtListe(){ return listOf(QR_PFL.filter(t=>!t.x.qr).map(t=>`<div class="li qr-pfl"><span class="av">${icon(t.art==="schrank"?"ecNetz":"qr")}</span><span class="lt"><span class="h">${esc(t.x.name||qrArtName(t))}</span><span class="s">${qrArtName(t)} · noch kein Aufkleber</span></span>
    <button type="button" class="btn-tonal" data-act="qrPflDruck" data-g="${esc(t.g.id)}" data-id="${esc(t.x.id)}" data-art="${t.art}">${icon("tag")}Drucken</button></div>`)); }
function qrPflicht(L,was){ QR_PFL=L;
  dialog("QR-Aufkleber fehlt",`<p>Ohne QR-Aufkleber kann ${esc(was||"nicht abgeschlossen werden")}. Bitte erst drucken und aufkleben – außen auf den Deckel oder an die Seite.</p>
    <div id="qrPflL">${qrPflichtListe()}</div>
    <p class="hint">Klebt schon ein Aufkleber dran, der noch nicht zugeordnet ist? <button type="button" class="btn-text" data-act="qrPflScan" style="padding:0;min-height:0">Aufkleber scannen</button></p>`,
    `<span style="flex:1"></span><button class="btn-text" data-act="cancel">Schließen</button>`); }
/* Liste „ohne QR-Aufkleber“ in Installation (Verteiler) und Netzwerk (Schränke) */
function qrOhne(art){ const L=[]; for(const g0 of live("gebaeude")){ const g=ecGebNorm(g0);
    if(art==="netz") (g.schraenke||[]).forEach(x=>{ if(!x.qr) L.push({g,x,art:"schrank"}); });
    else g.verteiler.forEach(x=>{ if(!x.qr) L.push({g,x,art:"vt"}); }); } return L; }
function qrOhneZeile(art){ if(art!=="anlage"&&art!=="netz") return ""; const n=qrOhne(art).length; if(!n) return "";
  const t=art==="netz"?`${n} Netzwerkschr${n>1?"änke":"ank"}`:`${n} Verteiler`;
  return `<div class="qr-ohne">${listOf([`<div class="li" role="button" tabindex="0" data-act="qrOhneDlg" data-art="${art}"><span class="av">${icon("warn")}</span><span class="lt"><span class="h">${t} ohne QR-Aufkleber</span><span class="s">Antippen und nachholen</span></span>${icon("chev")}</div>`])}</div>`; }
function qrOhneDlg(art){ const L=qrOhne(art).sort((a,b)=>(b.g.updated||0)-(a.g.updated||0));
  dialog(art==="netz"?"Netzwerkschränke ohne QR-Aufkleber":"Verteiler ohne QR-Aufkleber",listOf(L.map(t=>{ const o=ecOrt(t.g.ortId);
    return `<div class="li" role="button" tabindex="0" data-act="qrOhneAuf" data-g="${esc(t.g.id)}" data-id="${esc(t.x.id)}" data-art="${t.art}"><span class="av">${icon(t.art==="schrank"?"ecNetz":"qr")}</span><span class="lt"><span class="h">${esc(t.x.name||qrArtName(t))}</span><span class="s">${esc(o.titel||"")}</span></span>${icon("chev")}</div>`; })),
    `<span style="flex:1"></span><button class="btn-text" data-act="cancel">Schließen</button>`,{breit:true}); }

/* ---- Scanner (Kamera) ---- */
let QR_CAM=null;
function qrJsqr(){ if(window.jsQR) return Promise.resolve(window.jsQR); return new Promise((ok,no)=>{ const s=document.createElement("script"); s.src="../vendor/jsqr.min.js"; s.onload=()=>ok(window.jsQR); s.onerror=()=>no(new Error("Scanner nicht erreichbar")); document.head.appendChild(s); }); }
function qrStop(){ if(!QR_CAM) return; QR_CAM.aus=true; try{ QR_CAM.st&&QR_CAM.st.getTracks().forEach(t=>t.stop()); }catch(e){} QR_CAM=null; }
/* PC: keine Kamera – nur die Nummer vom Aufkleber eintippen */
function qrNrDlg(ziel){ qrStop(); QR_CAM={ziel:ziel||null,aus:true};
  dialog(ziel?"Aufkleber zuordnen":"Aufkleber öffnen",`<div class="fg1">${tf("qrNr","Nummer vom Aufkleber","",{form:true,ph:"z. B. 4K7 P2M"})}</div><p class="hint">Steht groß auf dem Aufkleber, 6 Zeichen.</p>`,
    `<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="qrNrOk">${ziel?"Zuordnen":"Öffnen"}</button>`); }
function qrScan(ziel){ if(typeof scOeffnen==="function"){ qrStop();
    if(!ziel){ scOeffnen(); return; }
    const t=ziel.art==="schrank"?"Netzwerkschrank":"Verteiler", nm=(ziel.x&&ziel.x.name)||t;
    scOeffnen({titel:"Aufkleber zuordnen",treffer:c=>{ const alt=qrAlle().get(c); return {titel:nm,sub:alt&&alt.x.id===ziel.id?"hat diesen Aufkleber schon":alt?`Aufkleber hängt noch an „${alt.x.name||qrArtName(alt)}“ – wird umgehängt`:`Aufkleber ${qrZeig(c)} diesem ${t} zuordnen`,ic:ziel.art==="schrank"?"schrank":"vt",knopf:"Zuordnen"}; },aktion:c=>qrZuweisen(ziel,c)}); return; }
  if(DESK.matches){ qrNrDlg(ziel); return; } qrStop();
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
  if(alt&&alt.x.id===z.id){ toast(`Aufkleber ist schon diesem ${z.art==="schrank"?"Netzwerkschrank":"Verteiler"} zugeordnet`); return; }
  qrSetzen(z.g,z.id,c,z.art); render(); toast(alt?`Aufkleber ${qrZeig(c)} umgehängt von „${alt.x.name||qrArtName(alt)}“`:`Aufkleber ${qrZeig(c)} zugeordnet`); }

function qrBogenDlg(){ dialog("QR-Aufkleber drucken",`<p>Jeder Aufkleber bekommt eine neue Nummer. Vor Ort aufkleben und mit der App scannen – dann gehört er zum Verteiler.</p>
  <div class="chips ec-wahl" style="margin-top:12px">${[1,2,5].map(n=>`<button type="button" class="chip" data-act="qrBogenOk" data-n="${n}">${n} ${n>1?"Bögen":"Bogen"} · ${n*24} Stück</button>`).join("")}</div>
  <p class="hint">Format 70 × 36 mm, 24 Stück je A4-Bogen (3 × 8, ohne Rand links und rechts). Für den Schaltschrank Folien-Etiketten nehmen. Beim Drucken „Tatsächliche Größe“ bzw. 100 % wählen.</p>`,
  `<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button>`); }

document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act^="qr"]'); if(!b||b.disabled) return; e.stopPropagation(); const a=b.dataset.act;
  if(a==="qrScan"){ qrScan(); return; }
  if(a==="qrScanZu"){ const z=qrZielHier(); if(z) qrScan(z); return; }
  if(a==="qrZuArt"){ qrZu.art=b.dataset.v; b.parentElement.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x===b))); const l=document.getElementById("qrZuL"); if(l) l.innerHTML=qrZuListe(); return; }
  if(a==="qrNrOk"){ const c=qrNorm((document.getElementById("f_qrNr")||{}).value); if(!c){ toast("Nummer hat 6 Zeichen, z. B. 4K7 P2M"); return; } const z=QR_CAM&&QR_CAM.ziel; QR_CAM=QR_CAM&&QR_CAM.aus?null:QR_CAM; qrStop(); closeOverlays(); z?qrZuweisen(z,c):qrOeffnen(c); return; }
  if(a==="qrZuOk"){ const c=qrZu.c; if(!c) return; const art=b.dataset.art==="schrank"?"schrank":"vt"; qrSetzen(b.dataset.g,b.dataset.id,c,art); closeOverlays();
    if(art==="schrank"){ const g=vtGeb(b.dataset.g), x=g&&(g.schraenke||[]).find(s=>s.id===b.dataset.id); if(g&&x) qrSchrankOeffnen(g,x); } else go({v:"vt",g:b.dataset.g,id:b.dataset.id}); toast(`Aufkleber ${qrZeig(c)} zugeordnet`); return; }
  if(a==="qrNeu1"){ const z=qrZielHier(); if(!z) return; const c=qrNeu(); qrSetzen(z.g,z.id,c,z.art); render(); qrDruckDlg(c,`QR ${z.x.name||""} ${c}`.replace(/\s+/g," ")); return; }
  if(a==="qrDruck1"){ const z=qrZielHier(); if(z&&z.x.qr) qrDruckDlg(z.x.qr,`QR ${z.x.name||""} ${z.x.qr}`.replace(/\s+/g," ")); return; }
  if(a==="qrWegAsk"){ const z=qrZielHier(); confirmDlg("Aufkleber entfernen?",`Die Nummer gehört dann zu keinem ${z&&z.art==="schrank"?"Netzwerkschrank":"Verteiler"} mehr. Scannt jemand den alten Aufkleber, fragt die App, wohin er gehört.`,"Entfernen","qrWegOk"); return; }
  if(a==="qrWegOk"){ const z=qrZielHier(); if(z){ delete z.x.qr; z.x.updated=Date.now(); ecGebSpeichern(vtGeb(z.g)); } closeOverlays(); render(); return; }
  if(a==="qrBogen"){ qrBogenDlg(); return; }
  if(a==="qrPflDruck"){ const art=b.dataset.art==="schrank"?"schrank":"vt", g=vtGeb(b.dataset.g), x=g&&(art==="schrank"?(g.schraenke||[]):g.verteiler).find(y=>y.id===b.dataset.id); if(!x) return;
    const c=qrNeu(); qrSetzen(g.id,x.id,c,art); render(); qrDruckDlg(c,`QR ${x.name||""} ${c}`.replace(/\s+/g," ")); return; }
  if(a==="qrPflScan"){ closeOverlays(); if(typeof scOeffnen==="function") scOeffnen(); return; }
  if(a==="qrOhneDlg"){ qrOhneDlg(b.dataset.art); return; }
  if(a==="qrOhneAuf"){ closeOverlays(); const g=vtGeb(b.dataset.g); if(!g) return; if(b.dataset.art==="schrank"){ const x=(g.schraenke||[]).find(y=>y.id===b.dataset.id); if(x) qrSchrankOeffnen(g,x); } else go({v:"vt",g:g.id,id:b.dataset.id,tab:"info"}); return; }
  if(a==="qrBogenOk"){ const n=+b.dataset.n||1, S=qrAlle(), C=[]; for(let i=0;i<n*24;i++) C.push(qrNeu(S)); closeOverlays(); qrPdfZeigen(C,false,`QR-Aufkleber ${ecHeute()} (${C.length} Stück)`); return; }
},true);
