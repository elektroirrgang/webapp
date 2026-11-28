/* ===== Labor (28.11.2026) – der Entwicklerbereich als eigene Seite, nur Rolle „Entwickler“ =====
   Einstellungen › Entwickler › Labor. Gleiche Seite in allen vier Apps (über KONTO_SEITEN in profil.js).
   Oben der Zustand dieses Geräts als Kacheln, darunter die Werkzeuge in Kategorien (Chips filtern).
   Fehlerprotokoll: Laufzeitfehler werden auf jedem Gerät still mitgeschrieben (nur lokal, höchstens 60, nichts wird hochgeladen);
   sehen kann sie nur der Entwickler hier im Labor.
   Wichtig: Dieser Teil wird in echeck VOR profil.js eingebunden – oben auf Dateiebene nur Funktionen und eigene Variablen,
   keine Zugriffe auf KONTO_SEITEN, META o. Ä. beim Laden. */
const LAB_FEHLER="irrgang_fehler", LAB_TESTS="irrgang_ml_tests";
Object.assign(IC,{
  labor:"M19.8 18.4 14 10.67V6.5l1.35-1.69c.26-.33.03-.81-.39-.81H9.04c-.42 0-.65.48-.39.81L10 6.5v4.17L4.2 18.4c-.49.66-.02 1.6.8 1.6h14c.82 0 1.29-.94.8-1.6z",
  labFehler:"M20 8h-2.81a5.985 5.985 0 0 0-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C12.96 5.06 12.49 5 12 5s-.96.06-1.41.17L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8zm-6 8h-4v-2h4v2zm0-4h-4v-2h4v2z",
  labGeraet:"M4 6h18V4H4c-1.1 0-2 .9-2 2v11H0v3h14v-3H4V6zm19 2h-6c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V9c0-.55-.45-1-1-1zm-1 9h-4v-7h4v7z",
  labNeu:"M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z",
  labDaten:"M2 20h20v-4H2v4zm2-3h2v2H4v-2zM2 4v4h20V4H2zm4 3H4V5h2v2zm-4 7h20v-4H2v4zm2-3h2v2H4v-2z",
  labVerlauf:"M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"});

/* ---- Fehlerprotokoll: still mitschreiben (alle Geräte, nur lokal) ---- */
function labLs(k,v){ try{ if(v===undefined) return localStorage.getItem(k); if(v===null) localStorage.removeItem(k); else localStorage.setItem(k,v); }catch(e){ return null; } }
function labListe(k){ try{ const L=JSON.parse(labLs(k)||"[]"); return Array.isArray(L)?L:[]; }catch(e){ return []; } }
function labMerk(k,eintrag,max){ const L=labListe(k); L.unshift(eintrag); labLs(k,JSON.stringify(L.slice(0,max))); }
const labApp=()=>String(document.title||"").split(" · ")[0]||"App";
function labFehlerMerk(msg,src,zeile,stack){ msg=String(msg||"Unbekannter Fehler").slice(0,300);
  const L=labListe(LAB_FEHLER), alt=L[0]; /* gleicher Fehler direkt nacheinander: nur zählen */
  if(alt&&alt.msg===msg&&alt.app===labApp()&&Date.now()-alt.t<60000){ alt.n=(alt.n||1)+1; alt.t=Date.now(); labLs(LAB_FEHLER,JSON.stringify(L)); return; }
  labMerk(LAB_FEHLER,{t:Date.now(),app:labApp(),v:typeof APP_VERSION!=="undefined"?APP_VERSION:"",msg,src:String(src||"").split("/").pop().slice(0,80),z:zeile||"",stack:String(stack||"").split("\n").slice(0,4).join("\n").slice(0,500),seite:typeof nav!=="undefined"&&nav?nav.v:""},60); }
addEventListener("error",e=>{ if(e&&e.message) labFehlerMerk(e.message,e.filename,e.lineno?`${e.lineno}:${e.colno||0}`:"",e.error&&e.error.stack); });
addEventListener("unhandledrejection",e=>{ const r=e&&e.reason; labFehlerMerk("Promise: "+(r&&r.message||r),"","",r&&r.stack); });

/* ---- Verlauf der Testbenachrichtigungen (anforderung.js ruft labTestMerk) ---- */
function labTestMerk(h,weg,fehler){ labMerk(LAB_TESTS,{t:Date.now(),app:labApp(),h,weg,fehler:fehler||""},20); if(typeof nav!=="undefined"&&nav&&nav.v==="labor"){ try{ render(); }catch(e){} } }

/* ---- Zustand dieses Geräts ---- */
let LAB_SP=null; /* Speicher-Schätzung (asynchron) */
function labSpeicherHolen(){ if(LAB_SP||!navigator.storage||!navigator.storage.estimate) return; LAB_SP={laedt:true};
  navigator.storage.estimate().then(s=>{ LAB_SP=s; if(nav.v==="labor") render(); }).catch(()=>{ LAB_SP={fehler:true}; }); }
let LAB_SW=null;
function labSwHolen(){ if(LAB_SW||!navigator.serviceWorker) return; LAB_SW={laedt:true};
  navigator.serviceWorker.getRegistration().then(async r=>{ let cache=""; try{ const k=await caches.keys(); cache=k.filter(x=>/-v\d/.test(x)).join(", "); }catch(e){}
    LAB_SW={da:!!(r&&r.active),warten:!!(r&&r.waiting),cache}; if(nav.v==="labor") render(); }).catch(()=>{ LAB_SW={da:false}; }); }
const labMb=b=>b>=1e9?`${(b/1e9).toLocaleString("de-DE",{maximumFractionDigits:1})} GB`:`${Math.round(b/1e6)} MB`;
function labGeraetText(){ const u=navigator.userAgent, ios=/iPhone|iPad|iPod/.test(u)||(/Macintosh/.test(u)&&"ontouchend" in document);
  const was=/iPhone/.test(u)?"iPhone":ios?"iPad":/Android/.test(u)?"Android":/Windows/.test(u)?"Windows":/Macintosh/.test(u)?"Mac":"Gerät";
  const app=matchMedia("(display-mode: standalone)").matches||matchMedia("(display-mode: window-controls-overlay)").matches||navigator.standalone;
  const br=/Edg\//.test(u)?"Edge":/Chrome\//.test(u)?"Chrome":/Firefox\//.test(u)?"Firefox":/Safari\//.test(u)?"Safari":"Browser";
  return {was,app:!!app,br,ios,t:`${was} · ${app?"installierte App":br+"-Tab"}`}; }
function labOffen(){ let n=0; try{ for(const k of Object.keys(DB)){ if(!(DB[k] instanceof Map)) continue; for(const r of DB[k].values()) if(r&&r._dirty&&!r.demo) n++; } }catch(e){} return n; }
function labZustand(){ labSpeicherHolen(); labSwHolen();
  const G=labGeraetText(), F=labListe(LAB_FEHLER), f24=F.filter(x=>Date.now()-x.t<864e5).length, offen=labOffen();
  const st=typeof SY!=="undefined"?SY.state:"aus", sync=typeof syncText==="function"?syncText():"";
  const nErl=!("Notification" in window)?["err","nicht möglich"]:Notification.permission==="granted"?(typeof mlPushAn==="function"&&mlPushAn()?["ok","an"]:["wip","erlaubt, Schalter aus"]):Notification.permission==="denied"?["err","blockiert"]:["wip","noch nicht gefragt"];
  const sp=LAB_SP&&LAB_SP.quota?[LAB_SP.usage/LAB_SP.quota>.8?"wip":"ok",`${labMb(LAB_SP.usage||0)} von ${labMb(LAB_SP.quota)}`]:["",LAB_SP&&LAB_SP.laedt?"wird gemessen …":"unbekannt"];
  const sw=!LAB_SW||LAB_SW.laedt?["","wird geprüft …"]:LAB_SW.warten?["wip","neue Version wartet"]:LAB_SW.da?["ok","aktiv"]:["err","fehlt"];
  const rollen=typeof meineRollen==="function"?meineRollen().filter(r=>r!=="Mitarbeiter"):[];
  return [
    ["Version",["ok",typeof APP_VERSION!=="undefined"?String(APP_VERSION).split(" · ")[0]:"?"],labApp()],
    ["Abgleich",!navigator.onLine?["err","offline"]:[st==="ok"?"ok":st==="läuft"?"wip":st==="aus"?"":"err",({ok:"abgeglichen","läuft":"läuft gerade",offline:"offline",fehler:"Fehler",anmelden:"abgemeldet",aus:"aus"})[st]||st],
      [offen?`${offen} ${offen===1?"Änderung wartet":"Änderungen warten"} aufs Hochladen`:"nichts offen",st==="ok"&&sync?sync.replace(/^Abgeglichen · /,"zuletzt "):st==="fehler"?sync:""].filter(Boolean).join(" · ")],
    ["Anmeldung",[ME&&ME.mail?"ok":"err",ME&&ME.mail?String(ME.mail).split("@")[0]:"nicht angemeldet"],rollen.join(", ")||"Mitarbeiter"],
    ["Benachrichtigungen",nErl,G.ios&&!G.app?"am iPhone/iPad nur als Home-Bildschirm-App":""],
    ["Service Worker",sw,LAB_SW&&LAB_SW.cache?LAB_SW.cache:""],
    ["Speicher",sp,"auf diesem Gerät"],
    ["Fehler (24 Std.)",[f24?"err":"ok",f24?String(f24):"keine"],F.length?`${F.length} im Protokoll`:""],
    ["Gerät",["",G.t],`${innerWidth}×${innerHeight} px · Pixel ×${devicePixelRatio}`]]; }
const labKachel=([t,[k,v],s])=>`<div class="lab-k"><span class="lab-k-t"><i class="lab-p ${k||"aus"}"></i>${esc(t)}</span><b>${esc(v)}</b>${s?`<small>${esc(s)}</small>`:""}</div>`;

/* ---- Werkzeuge nach Kategorie ---- */
const LAB_KAT=[["alle","Alle"],["ml","Benachrichtigungen"],["daten","Daten"],["ansicht","Ansicht"],["alle-ma","Für alle"],["diag","Diagnose"]];
let LAB_F="alle";
const labZ=(act,ic,t,s,extra="")=>`<div class="li" role="button" tabindex="0" data-act="${act}"${extra}><span class="av">${icon(ic)}</span><span class="lt"><span class="h">${esc(t)}</span>${s?`<span class="s">${esc(s)}</span>`:""}</span>${icon("chev")}</div>`;
const labF=(f,...a)=>{ try{ return typeof f==="function"?f(...a)||"":""; }catch(e){ labFehlerMerk("Labor: "+e.message,"labor.js","",e.stack); return ""; } };
function labTestVerlauf(){ const L=labListe(LAB_TESTS).slice(0,5); if(!L.length) return "";
  const uhr=t=>new Date(t).toLocaleString("de-DE",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit"});
  return `<div class="lab-verlauf"><div class="lab-vk">Letzte Tests auf diesem Gerät</div>${L.map(x=>`<div class="lab-vz"><i class="lab-p ${x.fehler?"err":"ok"}"></i><span><b>${esc(x.h)}</b><small>${esc(uhr(x.t))} · ${esc(x.app)} · ${esc(x.weg)}${x.fehler?" · "+esc(x.fehler):""}</small></span></div>`).join("")}</div>`; }
function labKategorien(){ const G=labGeraetText(), angemeldet=!!(ME&&ME.mail);
  const iosHinweis=G.ios?`<p class="lab-hw">Am iPhone und iPad hält iOS eine App im Hintergrund an. Tests mit Wartezeit kommen dann erst beim Öffnen – richtig im Hintergrund geht das erst mit dem Push-Server beim Umbau.</p>`:"";
  return [
    ["ml","Benachrichtigungen",(angemeldet?labF(typeof mlGeraetZeile==="function"&&mlGeraetZeile)+labF(typeof mlDiagZeile==="function"&&mlDiagZeile)+labF(typeof mlTestZeile==="function"&&mlTestZeile)+labF(typeof simZeile==="function"&&simZeile):""),iosHinweis+labTestVerlauf()],
    ["daten","Daten",labF(typeof demoZeile==="function"&&demoZeile)+labF(typeof taZeile==="function"&&taZeile)+labF(typeof kdImportZeile==="function"&&kdImportZeile)+labF(typeof etsZeile==="function"&&etsZeile)
      +labZ("syncNeu","sync","Alles neu abgleichen","Lädt alle Einträge neu von SharePoint – hilft, wenn auf diesem Gerät etwas fehlt"),""],
    ["ansicht","Ansicht und Vorführen",labF(typeof ansichtZeile==="function"&&ansichtZeile,false)+labF(typeof tourZeile==="function"&&tourZeile),""],
    ["alle-ma","Für alle Mitarbeiter",labF(typeof fnZeile==="function"&&fnZeile)+(typeof MEHR_SUB!=="undefined"&&MEHR_SUB.karteEinst?labZ("nav:karteEinst","ort","Karte beim Kunden","Farben, Umkreis und Anzahl der Anhaltspunkte"):"")+labF(typeof bspZeile==="function"&&typeof MEHR_SUB!=="undefined"&&MEHR_SUB.karteEinst&&bspZeile)+(angemeldet?labF(typeof wuEntwZeile==="function"&&wuEntwZeile):""),""],
    ["diag","Diagnose",labZ("labFehler","labFehler","Fehlerprotokoll",(n=>n?`${n} ${n===1?"Eintrag":"Einträge"} auf diesem Gerät – antippen zeigt Meldung, Stelle und App`:"Keine Fehler aufgezeichnet")(labListe(LAB_FEHLER).length))
      +labZ("labKopie","copy","Gerätebericht kopieren","Version, Gerät, Abgleich, Speicher und letzte Fehler als Text – für Fehlersuche oder Chat")
      +labZ("labNeu","labNeu","Neueste Version laden","Holt die App frisch vom Server. Gespeicherte Daten bleiben erhalten")
      +labZ("labDaten","labDaten","Einträge auf diesem Gerät","Anzahl je Datenart, mit Beispieldaten und gelöschten"),""]]; }
function laborView(){
  if(typeof istEntwickler!=="function"||!istEntwickler()) return `<div class="narrow"><div class="empty">${icon("labor")}<h2>Nur für Entwickler</h2></div></div>`;
  const K=labKategorien().filter(([,,z])=>String(z).trim());
  return `<div class="narrow lab">
    <div class="lab-zust">${labZustand().map(labKachel).join("")}</div>
    <div class="chips lab-chips">${LAB_KAT.filter(([k])=>k==="alle"||K.some(x=>x[0]===k)).map(([k,t])=>`<button type="button" class="chip" data-act="labF" data-v="${k}" aria-pressed="${LAB_F===k}">${icon("check")}${esc(t)}</button>`).join("")}</div>
    ${K.filter(([k])=>LAB_F==="alle"||LAB_F===k).map(([k,t,z,unten])=>`<div class="sec-lbl">${esc(t)}</div><div class="list">${z}</div>${unten||""}`).join("")}
    <p class="hint">Nur für dich sichtbar (Rolle „Entwickler“). Zustand und Fehlerprotokoll gelten für dieses Gerät.</p></div>`; }
/* Eintrag in den Einstellungen (ersetzt die frühere lange Entwicklerliste) */
function laborZeile(){ if(typeof istEntwickler!=="function"||!istEntwickler()) return "";
  const f=labListe(LAB_FEHLER).filter(x=>Date.now()-x.t<864e5).length;
  return `<div class="sec-lbl">Entwickler</div><div class="list"><div class="li" role="button" tabindex="0" data-act="nav:labor"><span class="av">${icon("labor")}</span><span class="lt"><span class="h">Labor</span><span class="s">${f?`${f} ${f===1?"Fehler":"Fehler"} in den letzten 24 Std. · `:""}Zustand, Tests, Daten und Diagnose</span></span>${icon("chev")}</div></div>`; }

/* ---- Dialoge ---- */
function labFehlerDlg(){ const L=labListe(LAB_FEHLER), uhr=t=>new Date(t).toLocaleString("de-DE",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit"});
  dialog("Fehlerprotokoll",L.length?`<div class="lab-fl">${L.map(x=>`<div class="lab-fz"><div class="lab-fk"><b>${esc(x.app)}</b><small>${esc(uhr(x.t))}${x.n>1?` · ${x.n}×`:""}${x.seite?` · Seite ${esc(x.seite)}`:""}</small></div><div class="lab-fm">${esc(x.msg)}</div>${x.src||x.z?`<small class="lab-fo">${esc([x.src,x.z].filter(Boolean).join(" · "))}</small>`:""}${x.stack?`<pre class="lab-fs">${esc(x.stack)}</pre>`:""}</div>`).join("")}</div>`
    :`<p class="sup" style="margin:0">Auf diesem Gerät wurden keine Fehler aufgezeichnet.</p>`,
    `${L.length?`<button class="btn-text danger" data-act="labFehlerWeg">Leeren</button>`:""}<span style="flex:1"></span>${L.length?`<button class="btn-text" data-act="labKopie">Kopieren</button>`:""}<button class="btn-text" data-act="cancel">Schließen</button>`,{mittel:true}); }
function labBericht(){ const Z=labZustand(), F=labListe(LAB_FEHLER).slice(0,10), G=labGeraetText();
  return [`Gerätebericht ${labApp()} · ${new Date().toLocaleString("de-DE")}`,...Z.map(([t,[,v],s])=>`${t}: ${v}${s?` (${s})`:""}`),`Browser: ${navigator.userAgent}`,`Seite: ${typeof nav!=="undefined"?nav.v:""}`,
    "",F.length?"Letzte Fehler:":"Keine Fehler aufgezeichnet.",...F.map(x=>`- ${new Date(x.t).toLocaleString("de-DE")} · ${x.app} ${x.v||""} · ${x.msg}${x.src?` · ${x.src} ${x.z}`:""}${x.n>1?` · ${x.n}×`:""}`),
    "",`Gerät: ${G.t}`].join("\n"); }
async function labKopieren(){ const t=labBericht(); try{ await navigator.clipboard.writeText(t); toast("Gerätebericht kopiert"); }catch(e){ dialog("Gerätebericht",`<textarea class="lab-ta" readonly>${esc(t)}</textarea>`,`<button class="btn-text" data-act="cancel">Schließen</button>`); } }
function labDatenDlg(){ const Z=[];
  try{ for(const k of Object.keys(DB)){ if(!(DB[k] instanceof Map)) continue; const A=[...DB[k].values()]; if(!A.length) continue;
    Z.push([k,A.filter(r=>!r.deleted&&!r.demo).length,A.filter(r=>r.demo).length,A.filter(r=>r.deleted).length,A.filter(r=>r._dirty&&!r.demo).length]); } }catch(e){}
  Z.sort((a,b)=>b[1]-a[1]);
  dialog("Einträge auf diesem Gerät",`<div class="lab-tab"><div class="lab-tr kopf"><span>Datenart</span><span>echt</span><span>Beispiel</span><span>gelöscht</span><span>offen</span></div>${Z.map(z=>`<div class="lab-tr"><span>${esc(z[0])}</span>${z.slice(1).map((n,i)=>`<span class="${i===3&&n?"warn":""}">${n||"–"}</span>`).join("")}</div>`).join("")}</div>
    <p class="sup" style="margin:10px 4px 0">„offen“ = auf diesem Gerät geändert, noch nicht hochgeladen.</p>`,`<button class="btn-text" data-act="cancel">Schließen</button>`,{mittel:true}); }
async function labNeuLaden(){ toast("Neueste Version wird geladen …");
  try{ const r=navigator.serviceWorker&&await navigator.serviceWorker.getRegistration(); if(r){ await r.update().catch(()=>{}); if(r.waiting) r.waiting.postMessage({type:"SKIP_WAITING"}); } }catch(e){}
  try{ const app=(location.pathname.split("/").filter(Boolean)[0]||""), K=await caches.keys(); const pre={uebersicht:"start",evse:"evse",echeck:"echeck",baustelle:"baustelle"}[app];
    await Promise.all(K.filter(k=>pre&&k.startsWith(pre+"-v")).map(k=>caches.delete(k))); }catch(e){}
  if(typeof saveNow==="function") try{ saveNow(); }catch(e){}
  setTimeout(()=>location.reload(),400); }
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act^="lab"]'); if(!b) return; const a=b.dataset.act;
  if(!["labF","labFehler","labFehlerWeg","labKopie","labNeu","labDaten"].includes(a)) return; e.stopPropagation(); e.preventDefault();
  if(typeof istEntwickler!=="function"||!istEntwickler()) return;
  if(a==="labF"){ LAB_F=b.dataset.v||"alle"; render(); return; }
  if(a==="labFehler"){ labFehlerDlg(); return; }
  if(a==="labFehlerWeg"){ labLs(LAB_FEHLER,null); closeOverlays(); render(); toast("Fehlerprotokoll geleert"); return; }
  if(a==="labKopie"){ labKopieren(); return; }
  if(a==="labDaten"){ labDatenDlg(); return; }
  if(a==="labNeu"){ labNeuLaden(); return; } },true);
