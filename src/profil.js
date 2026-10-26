/* Eigenes Profil – gemeinsam für alle Apps (tools/build.py setzt es ein).
   Datensatz „profile“ je Mitarbeiter (id = Mail, klein): {vorname, nachname, ruf, bild (kleines JPEG als data-URL)}.
   Liegt in „Kundendaten/_App-Daten/profile“, damit Name und Bild in allen Apps und auf allen Geräten gleich sind.
   Ändern kann jeder nur sein eigenes Profil. Die Rolle kommt aus Microsoft (Chef weist sie zu), hier wird sie nur angezeigt. */
const ROLLE_TXT={Admin:["Admin","darf alles, vergibt Rollen in Microsoft"],Buero:["Büro","Aufträge, Material bestellen, Kunden pflegen"],
  Entwickler:["Entwickler","wie Admin, dazu Testwerkzeuge"],Mitarbeiter:["Mitarbeiter","bearbeitet eigene Prüfungen, Übergaben und Notizen"]};
function meineRollen(){ const a=typeof Auth!=="undefined"&&Auth.account; return (a&&a.idTokenClaims&&a.idTokenClaims.roles)||[]; }
function meineRolle(){ const R=meineRollen(); const k=["Admin","Entwickler","Buero","Mitarbeiter"].find(x=>R.includes(x)); return k?ROLLE_TXT[k]:ME.admin?ROLLE_TXT.Admin:ROLLE_TXT.Mitarbeiter; }
const profilVon=mail=>mail&&DB.profile?DB.profile.get(String(mail).toLowerCase()):null;
let msName=null;
/* Microsoft-Anzeigename bereinigen: „Maximilian Pevec / Elektro Irrgang“, „Joachim Irrgang | Elektro Irrgang“, „Pevec, Max“ → Vor- und Nachname */
const nameSauber=n=>String(n||"").split(/\s+[|/–]\s+|\s*[|/]\s*/)[0].replace(/\s+/g," ").trim();
function nameTeile(n){ n=nameSauber(n); if(n.includes("@")) return {vor:"",nach:""}; if(n.includes(",")){ const [nach,vor]=n.split(",").map(x=>x.trim()); return {vor:vor||"",nach:nach||""}; }
  const t=n.split(" ").filter(Boolean); return t.length>1?{vor:t.slice(0,-1).join(" "),nach:t[t.length-1]}:{vor:t[0]||"",nach:""}; }
const pfKaputt=p=>!!(p&&/[|/]/.test(`${p.vorname||""}${p.nachname||""}`));
/* Profil auf ME anwenden: Name für „erstellt von“, Prüfer usw.; ruf für die Begrüßung */
function profilAnwenden(){
  if(!ME||!ME.mail) return; if(msName==null||!ME._pf){ const t=nameTeile(ME.name); msName=[t.vor,t.nach].filter(Boolean).join(" ")||ME.name; }
  const p0=profilVon(ME.mail), p=pfKaputt(p0)?null:p0, voll=p?[p.vorname,p.nachname].filter(Boolean).join(" ").trim():"";
  ME.name=voll||msName||ME.name; ME.ruf=(p&&(p.ruf||p.vorname))||nameTeile(msName).vor||ME.name; ME.bild=p&&p.bild||""; ME._pf=true;
}
function profilAvatar(){ profilAnwenden(); const b=document.getElementById("avBtn"), t=document.getElementById("avTxt"); if(!b) return;
  if(ME.bild){ b.style.backgroundImage=`url("${ME.bild}")`; b.classList.add("mit-bild"); if(t) t.textContent=""; }
  else { b.style.backgroundImage=""; b.classList.remove("mit-bild"); } }
let pfBild=null;
function kontoDialog(){
  profilAnwenden(); const p0=profilVon(ME.mail)||{}, kaputt=pfKaputt(p0), p=kaputt?Object.assign({},p0,{vorname:null,nachname:null}):p0, r=meineRolle(); pfBild=p.bild||"";
  const t=nameTeile(msName||ME.name), vn=p.vorname!=null&&p.vorname!==""?p.vorname:t.vor, nn=p.nachname!=null&&p.nachname!==""?p.nachname:t.nach;
  dialog("Mein Profil",`<div class="pf-kopf"><button type="button" class="pf-bild" data-act="pfBildWahl" aria-label="Profilbild ändern" style="${pfBild?`background-image:url('${pfBild}')`:""}">${pfBild?"":esc(initials(ME.name))}<span class="pf-cam">${icon("cam")}</span></button>
      <div class="pf-info"><b>${esc(ME.mail)}</b><span class="pf-rolle">${esc(r[0])}</span><small>${esc(r[1])}</small></div></div>
    ${pfBild?`<button type="button" class="btn-text pf-weg" data-act="pfBildWeg">Bild entfernen</button>`:""}
    <div class="fg1" style="margin-top:12px"><div class="row2">${tf("vorname","Vorname",vn,{form:true})}${tf("nachname","Nachname",nn,{form:true})}</div>
      ${tf("ruf","So möchte ich begrüßt werden",p.ruf||"",{form:true,ph:vn||"z. B. Max"})}</div>
    <p class="sup" style="margin:12px 4px 0">Den Namen sehen alle Kollegen, z. B. bei „Dabei“ und als Ersteller von Übergaben. Die Rolle vergibt der Chef in Microsoft.</p>
    ${typeof syncText==="function"?`<p class="sup" id="syncState" style="margin:8px 4px 0">${esc(syncText())}</p>`:""}
    <input type="file" id="pfDatei" accept="image/*" hidden>`,
    `<button class="btn-text danger" data-act="logout">Abmelden</button><span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="pfSave">Speichern</button>`);
}
async function pfBildLaden(f){
  try{ const url=URL.createObjectURL(f), img=new Image(); await new Promise((ok,no)=>{ img.onload=ok; img.onerror=no; img.src=url; });
    const s=Math.min(img.width,img.height), c=document.createElement("canvas"); c.width=c.height=192;
    c.getContext("2d").drawImage(img,(img.width-s)/2,(img.height-s)/2,s,s,0,0,192,192); URL.revokeObjectURL(url);
    pfBild=c.toDataURL("image/jpeg",0.82); const b=document.querySelector(".pf-bild"); if(b){ b.style.backgroundImage=`url('${pfBild}')`; b.firstChild&&b.firstChild.nodeType===3&&(b.firstChild.textContent=""); }
  }catch(e){ toast("Das Bild konnte nicht gelesen werden"); } }
function pfSpeichern(){
  const F={}; document.querySelectorAll("#dlg [data-f]").forEach(e=>F[e.dataset.f]=String(e.value||"").trim());
  const id=String(ME.mail||"").toLowerCase(); if(!id) return; const alt=DB.profile.get(id), r=alt||{id};
  Object.assign(r,{vorname:F.vorname,nachname:F.nachname,ruf:F.ruf,bild:pfBild||""}); saveRec("profile",r,!alt);
  ME._pf=false; profilAnwenden(); closeOverlays(); render(); toast("Profil gespeichert");
}
/* Klicks und Dateiwahl – eigene Abfangung, damit die Apps nur „konto“ umleiten müssen */
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act="pfBildWahl"],[data-act="pfBildWeg"],[data-act="pfSave"]'); if(!b) return;
  e.stopPropagation(); const a=b.dataset.act;
  if(a==="pfBildWahl"){ const i=document.getElementById("pfDatei"); if(i) i.click(); }
  else if(a==="pfBildWeg"){ pfBild=""; const x=document.querySelector(".pf-bild"); if(x){ x.style.backgroundImage=""; } b.remove(); }
  else if(a==="pfSave") pfSpeichern(); },true);
document.addEventListener("change",e=>{ if(e.target&&e.target.id==="pfDatei"&&e.target.files[0]) pfBildLaden(e.target.files[0]); });

/* ===== Abgleich: Punkt am Profilbild und Karte oben auf der Konto-Seite – gemeinsam für alle Apps =====
   Punkt: grün = abgeglichen, rot = Fehler/Anmeldung, grau = offline. Während des Abgleichs dreht ein feiner Ring ums Profilbild
   und der Punkt pulsiert; danach „ploppt“ er einmal grün auf. Kurze Abgleiche bleiben mindestens 0,9 s sichtbar, sonst flackert es nur. */
let syncSeit=0, syncVerz=null;
function syncPunkt(){ const av=document.getElementById("avBtn"); if(av&&!syncVerz) av.dataset.sync=SY.state; }
function syncAnzeige(s){
  const av=document.getElementById("avBtn"), war=av&&av.dataset.sync;
  const setz=()=>{ syncVerz=null; if(av){ const vor=av.dataset.sync; av.dataset.sync=SY.state;
      if(vor==="läuft"&&SY.state==="ok"){ av.classList.remove("sync-fertig"); void av.offsetWidth; av.classList.add("sync-fertig"); setTimeout(()=>av.classList.remove("sync-fertig"),800); } }
    syncKarteAkt(); };
  clearTimeout(syncVerz); syncVerz=null;
  if(s==="läuft"){ syncSeit=Date.now(); setz(); }
  else { const rest=900-(Date.now()-syncSeit); if(war==="läuft"&&rest>0){ syncVerz=setTimeout(setz,rest); } else setz(); }
  const e=document.getElementById("syncState"); if(e) e.textContent=syncText(); }
/* was noch hochgeladen werden muss: geänderte Datensätze + wartende Fotos, Dateien, PDFs */
function syncOffen(){ let n=0;
  try{ for(const k of Object.keys(DB)) for(const r of DB[k].values()) if(r&&r._dirty&&!r.demo) n++; }catch(e){}
  const q=(META&&META.sync)||{}; ["protQueue","dateiQueue","fotoQueue"].forEach(x=>{ n+=(q[x]||[]).length; }); return n; }
const SYNC_P={cloud:"M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z",
  sync:"M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z",
  aus:"M19.35 10.04C18.67 6.59 15.64 4 12 4c-1.48 0-2.85.43-4.01 1.17l1.46 1.46C10.21 6.23 11.08 6 12 6c3.04 0 5.5 2.46 5.5 5.5v.5H19c1.66 0 3 1.34 3 3 0 1.13-.64 2.11-1.56 2.62l1.45 1.45C23.16 18.16 24 16.68 24 15c0-2.64-2.05-4.78-4.65-4.96zM3 5.27l2.75 2.74C2.56 8.15 0 10.77 0 14c0 3.31 2.69 6 6 6h11.73l2 2L21 20.73 4.27 4 3 5.27zM7.73 10l8 8H6c-2.21 0-4-1.79-4-4s1.79-4 4-4h1.73z",
  warn:"M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"};
function syncKarte(){
  if(typeof SYNC_ON==="undefined"||!SYNC_ON) return "";
  const s=SY.state||"ok", n=syncOffen(), t=META.sync.last?new Date(META.sync.last):null;
  const zeit=t?(new Date().toDateString()===t.toDateString()?`heute ${t.toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"})}`:t.toLocaleString("de-DE",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})):"noch nie";
  const aend=x=>`${x} ${x===1?"Änderung":"Änderungen"}`;
  const K={ok:["Abgeglichen","cloud",`Zuletzt ${zeit}${n?` · ${aend(n)} warten`:" · alles hochgeladen"}`],
    "läuft":["Wird abgeglichen …","sync",n?`${aend(n)} werden hochgeladen`:"Neue Daten werden geholt"],
    offline:["Offline","aus",`Zuletzt ${zeit}${n?` · ${aend(n)} warten auf Internet`:""}`],
    fehler:["Abgleich fehlgeschlagen","warn",`${SY.err||"Unbekannter Fehler"} · tippen zum Wiederholen`],
    anmelden:["Anmeldung abgelaufen","warn","Tippen, um dich neu anzumelden – bis dahin bleibt alles auf dem Gerät"]}[s]||["Abgleich","cloud",""];
  return `<button type="button" class="sync-k" id="syncKarte" data-z="${s}" data-act="syncKarte" aria-live="polite">
    <span class="sync-ic"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${SYNC_P[K[1]]}"/></svg>${n&&s!=="läuft"?`<span class="sync-n">${n>99?"99+":n}</span>`:""}</span>
    <span class="sync-t"><b>${K[0]}</b><small>${esc(K[2])}</small></span>${s==="läuft"?"":`<span class="sync-los">${s==="anmelden"?"Anmelden":"Abgleichen"}</span>`}</button>`; }
function syncKarteAkt(){ const el=document.getElementById("syncKarte"); if(el) el.outerHTML=syncKarte(); }
/* Sicherung für Apps ohne eigene (Übersicht, E-Check): alle Datensätze + Fotos aus dem Gerätespeicher */
function sichernAlle(name){
  const daten={}; KINDS.forEach(k=>{ daten[k]=[...DB[k].values()].filter(r=>!r.demo).map(strip); });
  const fotos={}; if(typeof fotoCache!=="undefined") fotoCache.forEach((v,k)=>{ if(typeof v==="string") fotos[k]=v; });
  saveFile(new Blob([JSON.stringify({app:name,version:1,saved:Date.now(),daten,fotos})],{type:"application/json"}),`${name}_Sicherung_${today()}.json`);
  toast("Sicherung erstellt"); }
async function sicherungEinlesen(f){
  try{ const d=JSON.parse(await new Response(f).text()); if(!d||!d.daten) throw 0; let neu=0, akt=0;
    for(const k of KINDS) for(const r of (d.daten[k]||[])){ if(!r||!r.id) continue; const loc=DB[k].get(r.id);
      if(!loc){ r._dirty=!r.demo; dbPut(k,r); neu++; } else if((r.updated||0)>(loc.updated||0)){ r._etag=loc._etag; r._itemId=loc._itemId; r._dirty=!r.demo; dbPut(k,r); akt++; } }
    if(d.fotos&&typeof fotoPut==="function") for(const [k,v] of Object.entries(d.fotos)) if(!fotoCache.has(k)){ await fotoPut(k,v); if(typeof fotoQueue==="function") fotoQueue(k); }
    syncSoon(); render(); toast(`${neu} neu, ${akt} aktualisiert`);
  }catch(e){ toast("Die Datei ist keine gültige Sicherung"); } }
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act="syncKarte"],[data-act="sichernAlle"],[data-act="sicherungLaden"]'); if(!b) return;
  e.stopPropagation(); e.preventDefault(); const a=b.dataset.act;
  if(a==="syncKarte"){ if(SY.state==="anmelden") Auth.relogin(); else if(SY.state!=="läuft"){ if(!navigator.onLine){ toast("Kein Internet – der Abgleich startet automatisch, sobald du wieder online bist"); return; } syncNow(true); } }
  else if(a==="sichernAlle") sichernAlle(b.dataset.name||document.title.split(" · ")[0]||"Irrgang");
  else if(a==="sicherungLaden"){ let i=document.getElementById("sicherungDatei"); if(!i){ i=document.createElement("input"); i.type="file"; i.id="sicherungDatei"; i.accept=".json,application/json"; i.hidden=true; document.body.appendChild(i);
      i.addEventListener("change",()=>{ const f=i.files[0]; i.value=""; if(f) sicherungEinlesen(f); }); } i.click(); } },true);
