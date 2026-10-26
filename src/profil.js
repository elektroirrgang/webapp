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
/* Konto als eigene Seite (Unterseite von „Mehr“); kontoDialog bleibt für alte Aufrufe und leitet um */
function kontoDialog(){ pfBild=null; go({v:"konto"}); }
function kontoView(){
  profilAnwenden(); const p0=profilVon(ME.mail)||{}, kaputt=pfKaputt(p0), p=kaputt?Object.assign({},p0,{vorname:null,nachname:null}):p0, r=meineRolle(); if(pfBild===null||pfBild===undefined) pfBild=p.bild||"";
  const t=nameTeile(msName||ME.name), vn=p.vorname!=null&&p.vorname!==""?p.vorname:t.vor, nn=p.nachname!=null&&p.nachname!==""?p.nachname:t.nach;
  return `<div class="narrow pf-seite"><section class="pf-karte"><button type="button" class="pf-bild gross" data-act="pfBildWahl" aria-label="Profilbild ändern" style="${pfBild?`background-image:url('${pfBild}')`:""}">${pfBild?"":esc(initials(ME.name))}<span class="pf-cam">${icon("cam")}</span></button>
      <b class="pf-name">${esc(ME.name)}</b><span class="pf-mail">${esc(ME.mail)}</span><span class="pf-rolle">${esc(r[0])}</span><small class="pf-rtext">${esc(r[1])}</small>
      ${pfBild?`<button type="button" class="btn-text pf-weg" data-act="pfBildWeg">Bild entfernen</button>`:""}</section>
    <div class="sec-lbl">Name</div>
    <div class="fg1"><div class="row2">${tf("vorname","Vorname",vn,{form:true})}${tf("nachname","Nachname",nn,{form:true})}</div>
      ${tf("ruf","So möchte ich begrüßt werden",p.ruf||"",{form:true,ph:vn||"z. B. Max"})}</div>
    <p class="meta" style="margin:10px 4px 0">Den Namen sehen alle Kollegen, z. B. bei „Dabei“ und als Ersteller von Übergaben. Die Rolle vergibt der Chef in Microsoft.</p>
    <div class="pf-fuss"><button class="btn-text danger" data-act="logout">Abmelden</button><span style="flex:1"></span><button class="btn-filled" data-act="pfSave">Speichern</button></div>
    <input type="file" id="pfDatei" accept="image/*" hidden></div>`; }
function kontoDialogAlt(){
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
  const F={}; document.querySelectorAll(nav.v==="konto"?".pf-seite [data-f]":"#dlg [data-f]").forEach(e=>F[e.dataset.f]=String(e.value||"").trim());
  const id=String(ME.mail||"").toLowerCase(); if(!id) return; const alt=DB.profile.get(id), r=alt||{id};
  Object.assign(r,{vorname:F.vorname,nachname:F.nachname,ruf:F.ruf,bild:pfBild||""}); saveRec("profile",r,!alt);
  ME._pf=false; profilAnwenden(); closeOverlays(); pfBild=null; render(); toast("Profil gespeichert");
}
/* Klicks und Dateiwahl – eigene Abfangung, damit die Apps nur „konto“ umleiten müssen */
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act="pfBildWahl"],[data-act="pfBildWeg"],[data-act="pfSave"]'); if(!b) return;
  e.stopPropagation(); const a=b.dataset.act;
  if(a==="pfBildWahl"){ const i=document.getElementById("pfDatei"); if(i) i.click(); }
  else if(a==="pfBildWeg"){ pfBild=""; const x=document.querySelector(".pf-bild"); if(x){ x.style.backgroundImage=""; x.firstChild&&x.firstChild.nodeType===3||x.insertAdjacentText("afterbegin",initials(ME.name)); } b.remove(); }
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
  const e=document.getElementById("syncState"); if(e) e.textContent=syncText(); if(typeof seitenFussText==="function") setTimeout(seitenFussText,s==="läuft"?0:950); }
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
    <span class="sync-t"><b>${K[0]}</b><small>${esc(K[2])}</small></span>${s==="läuft"?"":`<span class="sync-los" data-act="syncJetzt" role="button">${s==="anmelden"?"Anmelden":"Abgleichen"}</span>`}</button>`; }
function syncKarteAkt(){ const el=document.getElementById("syncKarte"); if(el) el.outerHTML=syncKarte(); }
/* ===== Backup – nur Chef und Entwickler (ME.admin), eigene Unterseite „Backup“ in allen Apps =====
   Einstellungen je Gerät in META.backup: {inhalt:{kunden,arbeit,team,fotos}, erinnerung:"aus"|"woche"|"monat", zuletzt}.
   Dokumente, PDFs und Kundenordner liegen in SharePoint (dort Papierkorb und Versionen) und sind nicht Teil der Datei. */
const BK_ARBEIT={"EVSE":"Prüfungen, Ladeparks, Katalog und Messgeräte","Baustelle":"Baustellen, Übergaben, Notizen, Material und Aufträge","E-Check":"Anlagen, Geräte, Netzwerke und Messgeräte","Übersicht":"Aufträge, Prüfungen, Baustellen und Messgeräte"};
const bkApp=()=>document.title.split(" · ")[0]||"Irrgang";
const BK_GRUPPEN=[["kunden","Kunden und Standorte",["kunden","standorte","ladeparks"]],["arbeit","",null],["team","Mitarbeiterprofile und Einstellungen",["profile","einstellungen"]]];
const bkW=()=>{ const b=Object.assign({inhalt:{},erinnerung:"aus",zuletzt:0},META.backup||{}); b.inhalt=Object.assign({kunden:true,arbeit:true,team:true,fotos:true},b.inhalt||{}); return b; };
const bkSet=o=>{ META.backup=Object.assign(bkW(),o); metaSave(); };
const BK_TAGE={woche:7,monat:30};
const bkFaellig=()=>{ const b=bkW(), t=BK_TAGE[b.erinnerung]; return !!t&&(!b.zuletzt||Date.now()-b.zuletzt>t*864e5); };
function bkArten(g){ const alle=Object.keys(DB).filter(k=>DB[k] instanceof Map), fest=BK_GRUPPEN.filter(x=>x[2]).flatMap(x=>x[2]);
  const G=BK_GRUPPEN.find(x=>x[0]===g); return (G&&G[2]?G[2]:alle.filter(k=>!fest.includes(k))).filter(k=>alle.includes(k)); }
function bkZeile(){ if(!ME.admin) return ""; const b=bkW(), t=b.zuletzt?new Date(b.zuletzt).toLocaleDateString("de-DE"):"";
  return `<div class="li" role="button" tabindex="0" data-act="nav:backup"><span class="av">${icon("backup")}</span><span class="lt"><span class="h">Backup</span><span class="s">${esc(bkFaellig()?(t?`Fällig – letzte Sicherung am ${t}`:"Fällig – noch keine Sicherung"):t?`Letzte Sicherung am ${t}`:"Sicherung erstellen und laden")}</span>${bkFaellig()?`<span class="st">${pill("wip","fällig")}</span>`:""}</span>${icon("chev")}</div>`; }
function backupView(){
  if(!ME.admin) return `<div class="narrow"><div class="empty">${icon("backup")}<h2>Nur für Chef und Entwickler</h2><p>Sicherungen erstellt und lädt der Chef.</p></div></div>`;
  const b=bkW(), I=b.inhalt, t=b.zuletzt?new Date(b.zuletzt).toLocaleString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}):"";
  const n=k=>bkArten(k).reduce((s,x)=>s+[...DB[x].values()].filter(r=>!r.deleted&&!r.demo).length,0), nF=typeof fotoCache!=="undefined"?fotoCache.size:0;
  const sch=(k,titel,sub)=>`<div class="li" role="button" tabindex="0" data-act="bkInhalt" data-k="${k}"><span class="lt"><span class="h">${esc(titel)}</span><span class="s">${esc(sub)}</span></span><span class="schalter${I[k]?" an":""}" aria-hidden="true"><i></i></span></div>`;
  const E=[["aus","Aus"],["woche","Jede Woche"],["monat","Jeden Monat"]];
  return `<div class="narrow">
    <div class="sync-k bk-k" data-z="${bkFaellig()?"fehler":t?"ok":"offline"}"><span class="sync-ic"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${IC.backup||SYNC_P.cloud}"/></svg></span>
      <span class="sync-t"><b>${t?"Letzte Sicherung":"Noch keine Sicherung"}</b><small>${esc(t?`${t} · auf diesem Gerät erstellt`:"Auf diesem Gerät wurde noch keine Sicherungsdatei erstellt")}${bkFaellig()?" · wieder fällig":""}</small></span></div>
    <div class="sec-lbl">Was soll rein?</div><div class="list">
      ${sch("kunden","Kunden und Standorte",`${n("kunden")} Einträge`)}
      ${sch("arbeit",BK_ARBEIT[bkApp()]||"Daten dieser App",`${n("arbeit")} Einträge`)}
      ${sch("team","Mitarbeiterprofile und Einstellungen",`${n("team")} Einträge`)}
      ${sch("fotos","Fotos",nF?`${nF} Fotos auf diesem Gerät`:"Fotos, die auf diesem Gerät liegen")}</div>
    <div class="bk-los"><button class="btn-filled" data-act="bkErstellen">${icon("backup")}Sicherung erstellen</button></div>
    <div class="sec-lbl">Erinnerung</div>
    <div class="chips">${E.map(([v,tx])=>`<button class="chip" data-act="bkErinnerung" data-v="${v}" aria-pressed="${b.erinnerung===v}">${tx}</button>`).join("")}</div>
    <p class="meta" style="margin:6px 4px 0">Ist eine Sicherung fällig, steht das auf der Konto-Seite bei „Backup“.</p>
    <div class="sec-lbl">Wiederherstellen</div><div class="list">
      <div class="li" role="button" tabindex="0" data-act="bkLaden"><span class="av">${icon("upload")}</span><span class="lt"><span class="h">Sicherung laden</span><span class="s">Datei auswählen – neuere Einträge ersetzen ältere, gelöscht wird nichts</span></span>${icon("chev")}</div></div>
    <p class="hint">Geladene Daten werden danach abgeglichen und sind für alle sichtbar. Dokumente, PDFs und Kundenordner liegen in SharePoint (mit Papierkorb und Versionen) und gehören nicht in diese Datei.</p></div>`; }
async function bkErstellen(){
  const b=bkW(), I=b.inhalt, kinds=["kunden","arbeit","team"].filter(k=>I[k]).flatMap(bkArten);
  if(!kinds.length&&!I.fotos){ toast("Bitte mindestens einen Inhalt auswählen"); return; }
  const daten={}; kinds.forEach(k=>{ daten[k]=[...DB[k].values()].filter(r=>!r.demo).map(strip); });
  const fotos={}; if(I.fotos&&typeof fotoCache!=="undefined") fotoCache.forEach((v,k)=>{ if(typeof v==="string") fotos[k]=v; });
  const extra=I.arbeit&&typeof backupExtra==="function"?await backupExtra():{};
  const app=bkApp(); saveFile(new Blob([JSON.stringify(Object.assign({app,version:4,saved:Date.now(),inhalt:I,daten,fotos},extra))],{type:"application/json"}),`${app}_Sicherung_${today()}.json`);
  bkSet({zuletzt:Date.now()}); render(); toast(`Sicherung erstellt – ${kinds.reduce((s,k)=>s+daten[k].length,0)} Einträge${I.fotos?`, ${Object.keys(fotos).length} Fotos`:""}`); }
async function sicherungEinlesen(f){
  if(typeof importBackup==="function"){ await importBackup({files:[f],set value(v){}}); return; } /* EVSE, Baustelle: eigene Wiederherstellung (alte Formate, Anhänge) */
  try{ const d=JSON.parse(await new Response(f).text()); if(!d||!d.daten) throw 0; let neu=0, akt=0;
    for(const k of Object.keys(d.daten)) if(DB[k] instanceof Map) for(const r of (d.daten[k]||[])){ if(!r||!r.id) continue; const loc=DB[k].get(r.id);
      if(!loc){ r._dirty=!r.demo; dbPut(k,r); neu++; } else if((r.updated||0)>(loc.updated||0)){ r._etag=loc._etag; r._itemId=loc._itemId; r._dirty=!r.demo; dbPut(k,r); akt++; } }
    if(d.fotos&&typeof fotoPut==="function") for(const [k,v] of Object.entries(d.fotos)) if(!fotoCache.has(k)){ await fotoPut(k,v); if(typeof fotoQueue==="function") fotoQueue(k); }
    syncSoon(); render(); toast(`${neu} neu, ${akt} aktualisiert`);
  }catch(e){ toast("Die Datei ist keine gültige Sicherung"); } }
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act="syncJetzt"],[data-act="syncKarte"],[data-act="bkInhalt"],[data-act="bkErstellen"],[data-act="bkErinnerung"],[data-act="bkLaden"]'); if(!b) return;
  e.stopPropagation(); e.preventDefault(); const a=b.dataset.act;
  if(a==="syncKarte"&&nav.v!=="abgleich"){ go({v:"abgleich"}); return; } /* Karte auf der Konto-Seite öffnet die Abgleich-Seite, der Knopf gleicht ab */
  if(a==="syncKarte"||a==="syncJetzt"){ if(SY.state==="anmelden") Auth.relogin(); else if(SY.state!=="läuft"){ if(!navigator.onLine){ toast("Kein Internet – der Abgleich startet automatisch, sobald du wieder online bist"); return; } syncNow(true); } }
  else if(!ME.admin) return;
  else if(a==="bkInhalt"){ const I=bkW().inhalt; I[b.dataset.k]=!I[b.dataset.k]; bkSet({inhalt:I}); render(); }
  else if(a==="bkErinnerung"){ bkSet({erinnerung:b.dataset.v}); render(); }
  else if(a==="bkErstellen") bkErstellen();
  else if(a==="bkLaden"){ let i=document.getElementById("sicherungDatei"); if(!i){ i=document.createElement("input"); i.type="file"; i.id="sicherungDatei"; i.accept=".json,application/json"; i.hidden=true; document.body.appendChild(i);
      i.addEventListener("change",()=>{ const f=i.files[0]; i.value=""; if(f) sicherungEinlesen(f); }); } i.click(); } },true);

/* ===== Weitere Einstellungen auf der Konto-Seite – gemeinsam für alle Apps =====
   Start mit (je App und Gerät, META.startV) · Textgröße (für alle Apps auf diesem Gerät, localStorage „irrgang_text“)
   · Speicher auf diesem Gerät (anzeigen, sichere Kopien aufräumen) · Stand Kundenordner (nur Chef/Entwickler) */
Object.assign(IC,{einTxt:IC.einTxt||"M9 4v3h5v12h3V7h5V4H9zm-6 8h3v7h3v-7h3V9H3v3z",einSp:IC.einSp||"M2 20h20v-4H2v4zm2-3h2v2H4v-2zM2 4v4h20V4H2zm4 3H4V5h2v2zm-4 7h20v-4H2v4zm2-3h2v2H4v-2z",
  einStart:IC.einStart||"M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"});
const TXT_GR=[["normal","Normal",1],["gross","Groß",1.12],["sehrgross","Sehr groß",1.25]];
const txtGr=()=>{ try{ return localStorage.getItem("irrgang_text")||"normal"; }catch(e){ return "normal"; } };
function txtAnwenden(){ const f=(TXT_GR.find(x=>x[0]===txtGr())||TXT_GR[0])[2]; document.documentElement.style.zoom=f===1?"":String(f); }
txtAnwenden();
const einTop=()=>typeof topdest==="function"?topdest():typeof TOPDEST!=="undefined"?TOPDEST:[];
function startBereich(){ const v=META.startV; if(v&&einTop().some(x=>x[0]===v)) nav={v}; }
const einZ=(act,ic,t,sub)=>`<div class="li" role="button" tabindex="0" data-act="${act}"><span class="av">${icon(ic)}</span><span class="lt"><span class="h">${t}</span>${sub?`<span class="s">${esc(sub)}</span>`:""}</span>${icon("chev")}</div>`;
function darstellungZeilen(){ const T=einTop(), st=T.find(x=>x[0]===META.startV)||T[0];
  return einZ("einStartDlg","einStart","Start mit",st?st[1]:"")+einZ("einTextDlg","einTxt","Textgröße",(TXT_GR.find(x=>x[0]===txtGr())||TXT_GR[0])[1]+" · für alle Apps auf diesem Gerät"); }
function geraetZeilen(mitPush){ return (mitPush&&typeof mlGeraetZeile==="function"&&ME.mail?mlGeraetZeile():"")+einZ("nav:speicher","einSp","Speicher auf diesem Gerät","Belegung anzeigen und aufräumen"); }
/* Konto-Seite – Reihenfolge für alle Apps gleich: Konto · Abgleich · Darstellung · Apps · Dieses Gerät · Verwaltung · App-Eigenes · Info · Entwickler (mit Demo-Vorschau) */
function kontoSeite(o){ const sek=(t,z)=>{ z=(Array.isArray(z)?z.join(""):z||"").trim(); return z?`<div class="sec-lbl">${t}</div><div class="list">${z}</div>`:""; };
  const demoFremd=typeof demoAn==="function"&&demoAn()&&!(typeof istEntwickler==="function"&&istEntwickler())?sek("Demo",demoZeile()):""; /* wer sie anhat, muss sie auch ausschalten können */
  const pcFuss=typeof KOPF_PC!=="undefined"&&KOPF_PC.matches; /* PC: Konto steht unten in der Seitenleiste – hier nicht doppelt */
  return `<div class="narrow konto-s">${syncKarte()}${pcFuss?"":sek("Konto",o.konto)}${sek("Darstellung",o.darstellung)}${o.apps||""}${sek("Dieses Gerät",o.geraet)}${sek("Verwaltung",o.verwaltung)}${o.eigenes||""}${kontoInfoKarte(o.info||[])}${demoFremd}${entwicklerBereich()}</div>`; }
/* Info: eine Karte mit App-Symbol, Version und den Seiten als Chips (statt drei Listenzeilen) */
function kontoInfoKarte(L){ const ic=(document.querySelector('link[rel="apple-touch-icon"]')||{}).href||"", app=document.title.split(" · ")[0];
  const zeilen=L.map(([act,i,t,sub])=>`<div class="li" role="button" tabindex="0" data-act="${act}"><span class="av">${icon(i)}</span><span class="lt"><span class="h">${esc(t)}</span>${sub?`<span class="s">${esc(sub)}</span>`:""}</span>${icon("chev")}</div>`).join("");
  return `<div class="sec-lbl">Info</div><div class="list">${zeilen}</div>
    <section class="info-k" role="button" tabindex="0" data-act="nav:about" aria-label="Über die App">${ic?`<img class="info-ic" src="${ic}" alt="">`:""}<div class="info-t"><b>${esc(app)}</b><small>Version ${esc(typeof APP_VERSION!=="undefined"?APP_VERSION:"")}</small></div>${icon("chev")}
</section>`; }
const einChips=(act,L,an)=>`<div class="chips ein-chips">${L.map(([v,t])=>`<button type="button" class="chip" data-act="${act}" data-v="${esc(v)}" aria-pressed="${v===an}">${esc(t)}</button>`).join("")}</div>`;
/* Speicher: PDFs (evse_protokolle), Dateien (irrgang_dateien), Fotos (Gerätespeicher der App) */
async function einIdb(name,store){ return new Promise(res=>{ try{ const r=indexedDB.open(name); r.onsuccess=()=>{ const d=r.result; if(!d.objectStoreNames.contains(store)){ d.close(); return res(null); } res(d); }; r.onerror=()=>res(null); }catch(e){ res(null); } }); }
async function einBlobs(name,store){ const d=await einIdb(name,store); if(!d) return []; const out=[];
  await new Promise(ok=>{ const c=d.transaction(store).objectStore(store).openCursor(); c.onsuccess=()=>{ const x=c.result; if(!x){ ok(); return; } out.push([x.key,(x.value&&x.value.size)||0]); x.continue(); }; c.onerror=()=>ok(); }); d.close(); return out; }
const mb=n=>n>=1048576?`${(n/1048576).toFixed(1).replace(".",",")} MB`:`${Math.max(0,Math.round(n/1024))} kB`;
const EIN_TAGE=60;
async function einAufraeumbar(){
  const P=await einBlobs("evse_protokolle","blob"), D=await einBlobs("irrgang_dateien","d"), grenze=Date.now()-EIN_TAGE*864e5, q=META.sync||{};
  const pOk=([id])=>{ const r=DB.protokolle&&DB.protokolle.get(id), m=(typeof BB_PROT!=="undefined"?BB_PROT:[]).find(x=>x.id===id); return !!(r&&!r.deleted&&r.item&&!(q.protQueue||[]).includes(id)&&m&&(m.created||0)<grenze); };
  const dOk=([id])=>{ const d=DB.dateien&&DB.dateien.get(id); return !!(d&&d.item&&!(q.dateiQueue||[]).includes(id)&&(d.created||0)<grenze); };
  return {P,D,pW:P.filter(pOk),dW:D.filter(dOk)}; }
async function einSpeicher(){
  const est=navigator.storage&&navigator.storage.estimate?await navigator.storage.estimate().catch(()=>null):null, A=await einAufraeumbar();
  const sum=L=>L.reduce((s,x)=>s+x[1],0), fotoB=typeof fotoCache!=="undefined"?[...fotoCache.values()].reduce((s,v)=>s+(typeof v==="string"?v.length*.75:0),0):0;
  const z=(t,v)=>`<div class="bb-ez"><small>${esc(t)}</small><span>${esc(v)}</span></div>`, frei=sum(A.pW)+sum(A.dW);
  dialog("Speicher auf diesem Gerät",`<div class="bb-el">
      ${est?z("Belegt",`${mb(est.usage||0)}${est.quota?` von ${mb(est.quota)} möglich`:""}`):""}
      ${z("PDFs (Protokolle, Berichte)",`${A.P.length} · ${mb(sum(A.P))}`)}${z("Dokumente und Fotos aus Kundenablagen",`${A.D.length} · ${mb(sum(A.D))}`)}
      ${fotoB?z("Fotos dieser App",mb(fotoB)):""}</div>
    <p class="meta" style="margin:12px 0 0">${frei?`Aufräumen entfernt ${A.pW.length+A.dW.length} lokale Kopien (${mb(frei)}), die älter als ${EIN_TAGE} Tage sind und sicher in SharePoint liegen. Beim nächsten Öffnen werden sie wieder geladen – dafür braucht es dann Internet.`:"Gerade gibt es nichts aufzuräumen: Lokale Kopien werden erst entfernt, wenn sie älter als "+EIN_TAGE+" Tage sind und sicher in SharePoint liegen."}</p>`,
    `<span style="flex:1"></span><button class="btn-text" data-act="cancel">Schließen</button>${frei?`<button class="btn-text" data-act="einAufr">Aufräumen</button>`:""}`); }
async function einAufraeumen(){ const A=await einAufraeumbar(); let n=0, b=0;
  if(A.pW.length){ const d=await einIdb("evse_protokolle","blob"); if(d){ const tx=d.transaction(["meta","blob"],"readwrite"); A.pW.forEach(([id,s])=>{ tx.objectStore("meta").delete(id); tx.objectStore("blob").delete(id); n++; b+=s; }); await new Promise(ok=>{ tx.oncomplete=ok; tx.onerror=ok; }); d.close();
      const weg=new Set(A.pW.map(x=>x[0])); if(typeof BB_PROT!=="undefined") BB_PROT=BB_PROT.filter(x=>!weg.has(x.id)); if(typeof PROT!=="undefined") PROT=PROT.filter(x=>!weg.has(x.id)); } }
  if(A.dW.length){ A.dW.forEach(([id,s])=>{ if(typeof dateiDel==="function"){ dateiDel(id); n++; b+=s; } }); }
  closeOverlays(); SP_STAND=null; render(); toast(n?`${n} Kopien entfernt · ${mb(b)} frei`:"Nichts zum Aufräumen"); }
/* Stand der Kundenordner (ablage.js) – nur Chef/Entwickler */
function kdoZeile(){ if(!ME.admin||typeof kdoRec!=="function"||!SYNC_ON) return ""; const K=[...DB.kunden.values()].filter(k=>!k.deleted&&!k.demo), n=K.filter(k=>kdoRec(k.id)).length;
  return einZ("nav:kundenordner","folder","Kundenordner in SharePoint",`${n} von ${K.length} Kunden angelegt${typeof KD_FEHLT!=="undefined"&&KD_FEHLT.size?` · ${KD_FEHLT.size} Hinweise`:""}`); }
function kdoStand(){
  const K=[...DB.kunden.values()].filter(k=>!k.deleted&&!k.demo), kOk=K.filter(k=>kdoRec(k.id)).length;
  const P=[...DB.protokolle.values()].filter(r=>!r.deleted&&!r.demo&&bbKunde(r.kundeId)), pOk=P.filter(r=>r.bib==="kd"&&r.item).length;
  const D=DB.dateien?[...DB.dateien.values()].filter(d=>!d.deleted&&!d.demo&&kdDateiKunde(d)&&bbKunde(kdDateiKunde(d))):[], dOk=D.filter(d=>d.item).length;
  const z=(t,a,b)=>`<div class="bb-ez"><small>${esc(t)}</small><span>${a} von ${b}${a<b?` · ${b-a} offen`:""}</span></div>`;
  dialog("Kundenordner in SharePoint",`<p class="meta" style="margin:0 0 10px">Kundendaten › ${KD_WURZEL} › Kundennummer und Name. Neues landet direkt dort, Älteres zieht beim Abgleich nach und nach um (höchstens 20 Schritte je Abgleich).</p>
    <div class="bb-el">${z("Kundenordner angelegt",kOk,K.length)}${z("Protokolle und Berichte im Kundenordner",pOk,P.length)}${z("Dokumente und Fotos im Kundenordner",dOk,D.length)}
      ${KD_FEHLT.size?`<div class="bb-ez"><small>Hinweise</small><span>${KD_FEHLT.size} Einträge gingen in dieser Sitzung nicht – meist fehlt die Datei schon an der alten Stelle. „Weitermachen“ versucht es erneut.</span></div>`:""}</div>`,
    `<button class="btn-text" data-act="kdoWeb">In SharePoint öffnen</button><span style="flex:1"></span><button class="btn-text" data-act="cancel">Schließen</button><button class="btn-text" data-act="kdoWeiter">Weitermachen</button>`); }
document.addEventListener("click",async e=>{ const b=e.target.closest&&e.target.closest('[data-act^="ein"],[data-act^="kdo"]'); if(!b) return; const a=b.dataset.act;
  if(!["einStartDlg","einStart","einTextDlg","einText","einSpeicher","einAufr","kdoStand","kdoWeiter","kdoWeb"].includes(a)) return; e.stopPropagation(); e.preventDefault();
  if(a==="einStartDlg"){ const T=einTop(); dialog("Start mit",`<p class="meta" style="margin:0 0 12px">Mit dieser Seite öffnet die App auf diesem Gerät.</p>${einChips("einStart",T.map(x=>[x[0],x[1]]),META.startV||T[0][0])}`,`<span style="flex:1"></span><button class="btn-text" data-act="cancel">Fertig</button>`); }
  else if(a==="einStart"){ META.startV=b.dataset.v; metaSave(); b.parentElement.querySelectorAll(".chip").forEach(c=>c.setAttribute("aria-pressed",String(c===b))); render(); }
  else if(a==="einTextDlg") dialog("Textgröße",`<p class="meta" style="margin:0 0 12px">Gilt für alle Apps auf diesem Gerät.</p>${einChips("einText",TXT_GR.map(x=>[x[0],x[1]]),txtGr())}`,`<span style="flex:1"></span><button class="btn-text" data-act="cancel">Fertig</button>`);
  else if(a==="einText"){ try{ localStorage.setItem("irrgang_text",b.dataset.v); }catch(_){} txtAnwenden(); b.parentElement.querySelectorAll(".chip").forEach(c=>c.setAttribute("aria-pressed",String(c===b))); render(); }
  else if(a==="einSpeicher") einSpeicher();
  else if(a==="einAufr") einAufraeumen();
  else if(!ME.admin) return;
  else if(a==="kdoStand") kdoStand();
  else if(a==="kdoWeiter"){ KD_FEHLT.clear(); closeOverlays(); if(!navigator.onLine){ toast("Kein Internet"); return; } toast("Kundenordner: es geht weiter"); syncNow(true); }
  else if(a==="kdoWeb"){ const w=window.open("about:blank","_blank"); try{ await syncRoot(); const id=(await folderId(KD_WURZEL,BIB.kunden)).split("/items/")[1], it=await gj(`/drives/${kdDrive()}/items/${id}`); if(w) w.location.href=it.webUrl; }catch(_){ if(w) w.close(); toast("SharePoint ist gerade nicht erreichbar"); } }
},true);
window.addEventListener("storage",e=>{ if(e.key==="irrgang_text") txtAnwenden(); });

/* ===== Unterseiten der Konto-Seite – jede App setzt sie über KONTO_SEITEN in render() ein ===== */
let SP_STAND=null;
function abgleichView(){
  const q=(META.sync)||{}, NAMEN={kunden:"Kunden",standorte:"Standorte",ladeparks:"Ladeparks",pruefungen:"Prüfungen",katalog:"Katalog",geraete:"Messgeräte",profile:"Profile",dateien:"Dokumente und Fotos (Einträge)",protokolle:"PDF-Einträge",einstellungen:"Einstellungen",
    baustellen:"Baustellen",eintraege:"Tagesstände",material:"Material",anforderungen:"Materialanforderungen",notizen:"Notizen",vorgaenge:"Aufträge",gebaeude:"Gebäude",echecks:"E-Checks",betriebsmittel:"Betriebsmittel"};
  const W=[]; for(const k of Object.keys(DB)){ if(!(DB[k] instanceof Map)) continue; const n=[...DB[k].values()].filter(r=>r&&r._dirty&&!r.demo).length; if(n) W.push([NAMEN[k]||k,n]); }
  [["PDFs",q.protQueue],["Dateien",q.dateiQueue],["Fotos",q.fotoQueue]].forEach(([t,L])=>{ if(L&&L.length) W.push([t+" (hochladen)",L.length]); });
  const z=(t,v)=>`<div class="bb-ez"><small>${esc(t)}</small><span>${esc(v)}</span></div>`, t=q.last?new Date(q.last).toLocaleString("de-DE"):"noch nie";
  const nk=typeof konflikte!=="undefined"?konflikte.length:0;
  return `<div class="narrow">${syncKarte()}
    <div class="sec-lbl">Wartet auf Upload</div>${W.length?`<div class="list">${W.map(([n,c])=>`<div class="li"><span class="lt"><span class="h">${esc(n)}</span></span><span class="pill wip">${c}</span></div>`).join("")}</div>`:`<p class="meta" style="margin:0 4px">Nichts – alle Änderungen sind hochgeladen.</p>`}
    <div class="sec-lbl">Verbindung</div><section class="card"><div class="bb-el">${z("Letzter Abgleich",t)}${z("Angemeldet als",ME.mail||"–")}${z("Ablage",String(CONFIG.shareUrl||"").replace(/^https:\/\//,""))}
      ${z("Verfahren",q.deltaAus?"Vollständig auflisten (Änderungsabfrage nicht erlaubt)":"Nur Änderungen abfragen")}${nk?z("Konflikte beim letzten Abgleich",String(nk)):""}${SY.err&&SY.state==="fehler"?z("Letzter Fehler",SY.err):""}</div></section>
    <div class="sec-lbl">Wenn etwas fehlt</div><div class="list"><div class="li" role="button" tabindex="0" data-act="syncNeu"><span class="av">${icon("sync")}</span><span class="lt"><span class="h">Alles neu laden</span><span class="s">Fragt beim nächsten Abgleich alles komplett bei SharePoint ab statt nur die Änderungen – dauert etwas länger, löscht nichts</span></span>${icon("chev")}</div></div></div>`; }
function kdoView(){
  if(!ME.admin||!SYNC_ON) return `<div class="narrow"><div class="empty">${icon("folder")}<h2>Nur für Chef und Entwickler</h2></div></div>`;
  const K=[...DB.kunden.values()].filter(k=>!k.deleted&&!k.demo), ohne=K.filter(k=>!kdoRec(k.id));
  const P=[...DB.protokolle.values()].filter(r=>!r.deleted&&!r.demo&&bbKunde(r.kundeId)), pOk=P.filter(r=>r.bib==="kd"&&r.item).length;
  const D=DB.dateien?[...DB.dateien.values()].filter(d=>!d.deleted&&!d.demo&&kdDateiKunde(d)&&bbKunde(kdDateiKunde(d))):[], dOk=D.filter(d=>d.item).length;
  const bar=(t,a,b)=>{ const pz=b?Math.round(a/b*100):100; return `<div class="kdo-z"><div class="kdo-t"><b>${esc(t)}</b><span>${a} von ${b}</span></div><div class="kdo-b"><i style="width:${pz}%"></i></div></div>`; };
  const name=x=>{ const id=x.slice(1); if(x[0]==="k") return (bbKunde(id)||{}).name||"Kunde"; if(x[0]==="p"){ const r=DB.protokolle.get(id); return r?`PDF „${r.name||r.titel||id}“`:"PDF"; } const d=DB.dateien&&DB.dateien.get(id); return d?`Datei „${d.name}“`:"Datei"; };
  return `<div class="narrow"><p class="meta" style="margin:0 4px 12px">Kundendaten › ${KD_WURZEL} › Kundennummer und Name, darin die sieben Ordner. Neues landet direkt dort, Älteres zieht beim Abgleich nach und nach um.</p>
    <section class="card kdo-k">${bar("Kundenordner angelegt",K.length-ohne.length,K.length)}${bar("Protokolle und Berichte umgezogen",pOk,P.length)}${bar("Dokumente und Fotos umgezogen",dOk,D.length)}</section>
    <div class="kdo-knoepfe"><button class="btn-tonal" data-act="kdoWeb">${icon("folder")}In SharePoint öffnen</button><button class="btn-filled" data-act="kdoWeiter">${icon("sync")}Weitermachen</button></div>
    ${KD_FEHLT.size?`<div class="sec-lbl">Hinweise</div><p class="meta" style="margin:0 4px 8px">Diese Einträge gingen in dieser Sitzung nicht – meist fehlt die Datei schon an der alten Stelle. „Weitermachen“ versucht es erneut.</p><div class="list">${[...KD_FEHLT].slice(0,30).map(x=>`<div class="li"><span class="lt"><span class="h">${esc(name(x))}</span></span></div>`).join("")}</div>`:""}
    ${ohne.length&&ohne.length<=30?`<div class="sec-lbl">Noch ohne Ordner</div><div class="list">${ohne.map(k=>`<div class="li"><span class="lt"><span class="h">${esc(k.name)}</span>${k.kdnr?`<span class="s">${esc(k.kdnr)}</span>`:""}</span></div>`).join("")}</div>`:""}</div>`; }
function speicherView(){
  if(!SP_STAND||Date.now()-SP_STAND.t>15000) speicherLaden();
  const S=SP_STAND, z=(t,v)=>`<div class="bb-ez"><small>${esc(t)}</small><span>${esc(v)}</span></div>`;
  if(!S) return `<div class="narrow"><p class="meta">Wird ermittelt …</p></div>`;
  const sum=L=>L.reduce((a,x)=>a+x[1],0), frei=sum(S.A.pW)+sum(S.A.dW), q=S.est&&S.est.quota?Math.min(100,Math.round((S.est.usage||0)/S.est.quota*100)):0;
  return `<div class="narrow">${S.est?`<section class="card kdo-k"><div class="kdo-z"><div class="kdo-t"><b>Belegt</b><span>${mb(S.est.usage||0)}${S.est.quota?` von ${mb(S.est.quota)}`:""}</span></div><div class="kdo-b"><i style="width:${Math.max(2,q)}%"></i></div></div></section>`:""}
    <div class="sec-lbl">Auf diesem Gerät</div><section class="card"><div class="bb-el">${z("PDFs (Protokolle, Berichte)",`${S.A.P.length} · ${mb(sum(S.A.P))}`)}${z("Dokumente und Fotos aus Kundenablagen",`${S.A.D.length} · ${mb(sum(S.A.D))}`)}${S.foto?z("Fotos dieser App",mb(S.foto)):""}</div></section>
    <div class="sec-lbl">Aufräumen</div><p class="meta" style="margin:0 4px 10px">${frei?`Entfernt ${S.A.pW.length+S.A.dW.length} lokale Kopien (${mb(frei)}), die älter als ${EIN_TAGE} Tage sind und sicher in SharePoint liegen. Beim nächsten Öffnen werden sie wieder geladen – dafür braucht es Internet.`:`Gerade gibt es nichts aufzuräumen. Lokale Kopien werden erst entfernt, wenn sie älter als ${EIN_TAGE} Tage sind und sicher in SharePoint liegen.`}</p>
    ${frei?`<div class="kdo-knoepfe"><button class="btn-filled" data-act="einAufr">Aufräumen</button></div>`:""}</div>`; }
async function speicherLaden(){ if(speicherLaden.l) return; speicherLaden.l=true;
  try{ const est=navigator.storage&&navigator.storage.estimate?await navigator.storage.estimate().catch(()=>null):null, A=await einAufraeumbar();
    const foto=typeof fotoCache!=="undefined"?[...fotoCache.values()].reduce((s,v)=>s+(typeof v==="string"?v.length*.75:0),0):0;
    SP_STAND={t:Date.now(),est,A,foto}; if(nav.v==="speicher") render(); }finally{ speicherLaden.l=false; } }
const KONTO_SEITEN={...(typeof meldungenView==="function"?{meldungen:["Benachrichtigungen",meldungenView]}:{}),datenschutz:["Datenschutz",datenschutzView],konto:["Konto",kontoView],abgleich:["Abgleich",abgleichView],kundenordner:["Kundenordner",kdoView],speicher:["Speicher",speicherView],backup:["Backup",backupView]};
Object.assign(MEHR_SUB,{datenschutz:"Datenschutz",konto:"Konto",abgleich:"Abgleich",kundenordner:"Kundenordner",speicher:"Speicher",backup:"Backup"});
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act="syncNeu"],[data-act="entwKlapp"]'); if(!b) return; e.stopPropagation(); e.preventDefault();
  if(b.dataset.act==="syncNeu"){ META.sync.delta={}; metaSave(); if(!navigator.onLine){ toast("Kein Internet – beim nächsten Abgleich wird alles neu geladen"); return; } toast("Alles wird neu geladen …"); syncNow(true); }
  else { META.entwZu=!META.entwZu; metaSave(); const y=scrollY; render(); scrollTo(0,y); } },true);

/* ===== Datenschutzhinweise – gemeinsam für alle Apps (früher nur EVSE). Gelb markierte Stellen legt der Betrieb fest. ===== */
const DS_STAND="Oktober 2026";
function datenschutzView(){
  const F=FIRMA, ph=t=>`<span class="ph">${t}</span>`, h=(n,t)=>`<h4>${n}. ${t}</h4>`, app=document.title.split(" · ")[0];
  return rechtsSeite(`<h3>Datenschutzhinweise zu den Apps von ${F.name}</h3>
    <p class="note-doc">Gilt für Übersicht, EVSE, Baustelle und E-Check (Sie sind gerade in „${esc(app)}“). Stand: ${DS_STAND}. Gelb markiert ist, was vor einer Veröffentlichung noch geprüft wird.</p>
    ${h(1,"Verantwortlicher")}
    <p>${F.name}, Inhaber ${F.inhaber}<br>${F.strasse}, ${F.ort}<br>Telefon ${F.tel} · <a href="mailto:${F.mail}">${F.mail}</a></p>
    <p><b>Datenschutzbeauftragter:</b> nicht benannt – dazu besteht keine Pflicht (§ 38 BDSG).</p>
    ${h(2,"Wofür die Apps da sind")}
    <p>Die Apps sind interne Werkzeuge von ${F.name}. Mitarbeiter nehmen damit Aufträge auf, dokumentieren Prüfungen (Wallboxen und Ladesäulen, Hausinstallationen, ortsveränderliche Geräte, Netzwerke) und Baustellen, legen Dokumente und Fotos zu Kunden ab und erstellen Protokolle und Berichte als PDF. Kunden bedienen die Apps nicht selbst.</p>
    ${h(3,"Welche Daten verarbeitet werden")}
    <p><b>Kunden und Ansprechpartner:</b> Firmen- bzw. Personenname, Anschrift, Kundennummer, Ansprechpartner, Telefon, E-Mail, Standorte, Auftrags- und SCC-Auftragsnummern, Anliegen und Termine.</p>
    <p><b>Prüfungen und Anlagen:</b> Angaben zu Ladeeinrichtungen, Elektroinstallation, Geräten und Netzwerk (Hersteller, Typ, Seriennummer, Ort), Messwerte, Mängel, Prüfdatum und nächster Prüftermin.</p>
    <p><b>Baustellen:</b> Tagesstände, offene Punkte, Material, Notizen (privat, für Personen oder für die Firma freigegeben) und Berichte.</p>
    <p><b>Fotos und Dokumente:</b> Fotos der Technik und Dokumente zu Kunden (z. B. Angebote, Pläne, Datenblätter, Schriftverkehr). Fotos zeigen die Technik, nicht Personen.</p>
    <p><b>Unterschriften:</b> Unterschrift und Name des Prüfers sowie des Auftraggebers bzw. seines Vertreters.</p>
    <p><b>Mitarbeiter:</b> Name, dienstliche E-Mail-Adresse und Rolle aus dem Microsoft-Firmenkonto, freiwillig ein Profilbild und ein Rufname; wer einen Eintrag angelegt oder zuletzt geändert hat; verwendete Messgeräte.</p>
    ${h(4,"Zwecke und Rechtsgrundlagen")}
    <p>Durchführung und Dokumentation von Aufträgen und Prüfungen (Art. 6 Abs. 1 lit. b DSGVO). Nachweis normgerechter Prüfungen, Planung von Wiederholungsprüfungen, Abstimmung im Team und Absicherung bei Gewährleistung oder Haftung (Art. 6 Abs. 1 lit. f DSGVO – berechtigtes Interesse an einer vollständigen Dokumentation). Aufbewahrung nach gesetzlichen Pflichten (Art. 6 Abs. 1 lit. c DSGVO). Daten der Mitarbeiter: Durchführung des Beschäftigungsverhältnisses (Art. 6 Abs. 1 lit. b DSGVO, § 26 BDSG).</p>
    ${h(5,"Wo die Daten gespeichert werden")}
    <p><b>Auf dem Gerät:</b> Eingaben, Fotos und PDFs liegen im Speicher des Browsers auf dem jeweiligen iPad, Handy oder PC, damit die Apps auch ohne Netz funktionieren.</p>
    <p><b>Microsoft 365:</b> Nach der Anmeldung mit dem Firmenkonto werden die Daten im Microsoft-365-Speicher (SharePoint) von ${F.name} abgelegt, Dokumente und Protokolle in Kundenordnern; private Notizen im OneDrive des jeweiligen Mitarbeiters. Microsoft verarbeitet diese Daten als Auftragsverarbeiter (Art. 28 DSGVO) auf Grundlage der Microsoft-Vertragsbedingungen.</p>
    ${h(6,"Empfänger")}
    <p>Protokolle und Berichte erhält der Auftraggeber bzw. eine von ihm benannte Stelle (z. B. Betreiber, Hausverwaltung, Versicherer). Innerhalb von ${F.name} haben nur Mitarbeiter mit Firmenkonto Zugriff; was sie ändern dürfen, richtet sich nach ihrer Rolle.</p>
    <p>Auftragsverarbeiter: Microsoft Ireland Operations Ltd. (Microsoft 365) und EDV Achenbach als IT-Dienstleister mit Zugriff auf den Microsoft-365-Mandanten.</p>
    ${h(7,"Bereitstellung der Apps und Dienste Dritter")}
    <p>Die Apps werden über GitHub Pages (GitHub Inc., USA) ausgeliefert. Beim Aufruf verarbeitet GitHub technisch notwendige Verbindungsdaten wie IP-Adresse, Zeitpunkt und Browsertyp (Art. 6 Abs. 1 lit. f DSGVO). Kunden- oder Prüfdaten liegen dort nicht. Die Übermittlung in die USA stützt sich auf das EU-US Data Privacy Framework. ${ph("Vor Veröffentlichung prüfen: GitHub in der Liste auf dataprivacyframework.gov")}</p>
    <p>Für einzelne Funktionen ruft das Gerät direkt Dienste Dritter auf; dabei werden die IP-Adresse und die jeweilige Anfrage übertragen, aber keine Kunden- oder Prüfdaten außer bei der Adresssuche:</p>
    <ul><li><b>Karten:</b> Kartenkacheln von OpenFreeMap und Luftbilder von Esri (ArcGIS).</li>
      <li><b>Adresssuche:</b> Nominatim (OpenStreetMap Foundation) – übertragen wird die eingegebene Adresse.</li>
      <li><b>Wetter</b> (Übersicht): Bright Sky (Daten des Deutschen Wetterdienstes) – übertragen wird der ungefähre Ort.</li>
</ul>
    <p>Rechtsgrundlage ist jeweils Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an funktionierenden Karten, Adressen und Wetterangaben).</p>
    <p><b>Produktbilder</b> in den Katalogen liegen auf unserem eigenen Server und werden nicht von Herstellerseiten geladen. Nur ein Bild, das ein Mitarbeiter selbst als Internetadresse einträgt, kommt direkt von der jeweiligen Seite.</p>
    ${h(8,"Keine Cookies, kein Tracking")}
    <p>Die Apps setzen keine Cookies und nutzen keine Analyse- oder Werbedienste. Für die Anmeldung wird die Microsoft-Anmeldeseite aufgerufen. Benachrichtigungen erzeugt die App selbst auf dem Gerät; es wird kein Push-Dienst eines Dritten verwendet.</p>
    ${h(9,"Speicherdauer")}
    <p>Prüfprotokolle und zugehörige Fotos werden 10 Jahre nach der Prüfung aufbewahrt, mindestens bis zur nächsten Wiederholungsprüfung. Kundendaten und Dokumente werden gelöscht, wenn sie nicht mehr benötigt werden und keine Aufbewahrungspflicht besteht. Gelöschte Dateien liegen danach noch bis zu 93 Tage im SharePoint-Papierkorb. Auf einem Gerät gespeicherte Daten werden mit dem Löschen in der App, über „Speicher auf diesem Gerät“ oder mit dem Entfernen der Websitedaten des Browsers gelöscht.</p>
    ${h(10,"Sicherheit")}
    <p>Die Verbindung läuft verschlüsselt (HTTPS). Die Anmeldung erfolgt über das Microsoft-Firmenkonto mit den dort geltenden Sicherheitsregeln (z. B. Zwei-Faktor); der Zugriff ist auf die eine SharePoint-Website der Apps beschränkt. Geräte sind mit Code gesperrt. Sicherungsdateien (Backup) können nur Chef und Entwickler erstellen.</p>
    ${h(11,"Ihre Rechte")}
    <p>Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit (Art. 15–20 DSGVO) und können der Verarbeitung auf Grundlage berechtigter Interessen widersprechen (Art. 21 DSGVO). Wenden Sie sich dazu an die oben genannte Adresse.</p>
    <p>Beschwerden können Sie an die Aufsichtsbehörde richten: Landesbeauftragte für Datenschutz und Informationsfreiheit Nordrhein-Westfalen, Kavalleriestraße 2–4, 40213 Düsseldorf.</p>
    <p>Eine automatisierte Entscheidungsfindung oder ein Profiling findet nicht statt.</p>
    ${h(12,"Hinweise für Mitarbeiter")}
    <p>Keine Personen und keine Kfz-Kennzeichen fotografieren – nur die Technik. Geräte immer mit Code sperren. PDFs und Sicherungsdateien nicht über private Konten oder Messenger verschicken. Geht ein Gerät verloren, sofort den Chef und EDV Achenbach informieren.</p>
    <p class="warnline">${icon("warn")}Entwurf: vor der Weitergabe an Dritte vom Betrieb freigeben und rechtlich prüfen lassen.</p>`); }

/* ===== Stufe im Betrieb (Chef, Meister, Geselle, Azubi …) – steht in der Mitarbeiterliste (einstellungen „team“) =====
   Azubis mit Ausbildungsende werden ab dem Tag danach automatisch als Geselle angezeigt; mit Beginn steht das Lehrjahr dabei. */
const MA_STUFEN=[["chef","Chef"],["meister","Meister"],["geselle","Geselle"],["azubi","Azubi"],["buero","Büro"],["aushilfe","Aushilfe"]];
const maRolleRest=m=>String((m&&m.rolle)||"").replace(/\bChef\b\s*·?\s*/i,"").replace(/^\s*·\s*|\s*·\s*$/g,"").trim();
function maStufe(m){ if(!m) return {k:"",t:""}; let k=m.stufe||(/\bchef\b/i.test(m.rolle||"")?"chef":""), t=(MA_STUFEN.find(x=>x[0]===k)||[,""])[1], heute=new Date().toISOString().slice(0,10), auto=false;
  if(k==="azubi"&&m.azubiBis&&m.azubiBis<heute){ k="geselle"; t="Geselle"; auto=true; }
  else if(k==="azubi"){ const lj=maLehrjahr(m); t=lj?`Azubi · ${lj}. Lehrjahr`:"Azubi"; }
  return {k,t,auto}; }
function maPillen(m){ const st=maStufe(m);
  /* „Mitarbeiter“ hat jeder im Betrieb (außer dem Chef); Admin bzw. Entwickler kommt als eigene Pille dazu, die Rechte bleiben wie eingestellt */
  return [st.t&&pill("stufe",st.t),st.k!=="chef"&&pill("open","Mitarbeiter"),m.entwickler?pill("ok","Entwickler"):m.admin&&pill("ok","Admin"),m.pruefer&&pill("wip","Prüfer"),m.status==="weg"&&pill("open","ausgeschieden")].filter(Boolean).join(""); }
/* Lehrjahr: normal aus „Ausbildung seit“ gerechnet. Weicht es ab (Betriebswechsel, Verkürzung, Wiederholung), wird es von Hand gesetzt
   (lj + ljAm) und zählt ab dann zu jedem Jahrestag des Ausbildungsbeginns (ohne Beginn: 1. August) eins weiter. */
function maLehrjahr(m){ const n=new Date(), mon=(a,b)=>(b.getFullYear()-a.getFullYear())*12+b.getMonth()-a.getMonth()-(b.getDate()<a.getDate()?1:0);
  if(m.lj){ const am=new Date((m.ljAm||n.toISOString().slice(0,10))+"T12:00"), v=m.azubiVon?new Date(m.azubiVon+"T12:00"):new Date(am.getFullYear(),7,1,12);
    let z=0; for(let y=am.getFullYear();y<=n.getFullYear();y++){ const tag=new Date(y,v.getMonth(),v.getDate(),12); if(tag>am&&tag<=n) z++; } return Math.min(4,Math.max(1,(+m.lj)+z)); }
  if(m.azubiVon) return Math.min(4,Math.max(1,Math.floor(mon(new Date(m.azubiVon+"T12:00"),n)/12)+1));
  return 0; }
