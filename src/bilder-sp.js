/* ===== Produktbilder aus dem SharePoint der Firma (05.11.2026) =====
   Herstellerfotos, Feldgrafiken (zaehlerschrank24.de, Freigabe nur für die interne App) und Gerätebilder liegen nicht mehr
   öffentlich auf dem Server, sondern im SharePoint unter „_App/Bilder“ – lesbar nur nach der Anmeldung.
   Die Seiten verweisen weiter auf „../bilder/…“. Der Service Worker liefert diese Adressen aus dem Bilder-Cache des Geräts;
   fehlt ein Bild, holt er es über die Download-Liste, die diese Datei ihm nach der Anmeldung schickt (Adressen gelten rund 1 h).
   Im SharePoint liegen alle Bilder flach in einem Ordner: „vt/hager/esc225.webp“ heißt dort „vt~hager~esc225.webp“. */
const BSP_ORDNER="_App/Bilder", BSP_BIB="Kundendaten";   /* Bibliothek „Kundendaten“ der SharePoint-Website */
const bspName=p=>String(p).replace(/^.*?\/bilder\//,"").replace(/^\/+/,"").replace(/\//g,"~");
const bspPfad=n=>"/bilder/"+String(n).replace(/~/g,"/");
const BSP={liste:null,t:0,laeuft:false,anzahl:0};
async function bspAnSw(liste){ try{ if(!("serviceWorker" in navigator)) return; const r=await navigator.serviceWorker.ready; const sw=navigator.serviceWorker.controller||r.active; if(sw) sw.postMessage({bilderListe:liste}); }catch(e){} }
/* Bilder, die vor der Liste nicht laden konnten, noch einmal anfordern */
function bspNachladen(){ document.querySelectorAll('img[src*="/bilder/"],image[href*="/bilder/"]').forEach(i=>{
  if(i.tagName==="IMG"){ if(i.complete&&!i.naturalWidth){ const s=i.src; i.src=""; i.src=s; const p=i.closest(".weg"); if(p) p.classList.remove("weg"); } }
  else { const h=i.getAttribute("href"); i.setAttribute("href",""); i.setAttribute("href",h); } }); }
async function bspListe(erzwingen){
  if(typeof SYNC_ON==="undefined"||!SYNC_ON||typeof ME==="undefined"||!ME.signedIn) return BSP.liste;
  if(BSP.laeuft){ await BSP.p; if(!erzwingen) return BSP.liste; }
  if(!erzwingen&&BSP.liste&&Date.now()-BSP.t<40*60e3) return BSP.liste;
  BSP.laeuft=true; let fertig; BSP.p=new Promise(r=>fertig=r);
  try{ await syncRoot(); const fid=await folderId(BSP_ORDNER,BSP_BIB), L=await listAll(fid), m={};
    L.forEach(it=>{ if(it.file&&it["@microsoft.graph.downloadUrl"]) m[bspPfad(it.name)]=it["@microsoft.graph.downloadUrl"]; });
    BSP.liste=m; BSP.t=Date.now(); BSP.anzahl=Object.keys(m).length; await bspAnSw(m); setTimeout(bspNachladen,400); setTimeout(()=>bspAuto(),1500); setTimeout(()=>bspVorab(),4000);
  }catch(e){ console.warn("Bilderliste",e); }
  finally{ BSP.laeuft=false; fertig(); }
  return BSP.liste; }
setTimeout(()=>bspListe(),800);
/* Einmal geladene Bilder bleiben im Gerätespeicher („irrgang-bilder“, auch über Updates hinweg). Im WLAN holt die App alle
   noch fehlenden Bilder leise vorab, damit sie beim ersten Anzeigen nicht erst nachladen. Speicher als „dauerhaft“ anfragen,
   damit der Browser ihn nicht bei Platzmangel leert. */
let BSP_VORAB=false;
async function bspVorab(){ if(BSP_VORAB||!BSP.liste||bspMobilfunk()||!("caches" in window)) return; BSP_VORAB=true;
  try{ if(navigator.storage&&navigator.storage.persist) navigator.storage.persist().catch(()=>{});
    const c=await caches.open("irrgang-bilder"), P=[];
    for(const pfad of Object.keys(BSP.liste)) if(!(await c.match(pfad))) P.push(pfad);
    const lauf=async()=>{ while(P.length){ const p=P.shift(); try{ await fetch(p); }catch(e){} await new Promise(r=>setTimeout(r,60)); } };
    await Promise.all([lauf(),lauf(),lauf()]);
  }catch(e){ BSP_VORAB=false; } }
setInterval(()=>{ if(document.visibilityState==="visible") bspListe(); },5*60e3);
document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="visible") bspListe(); });

/* ---- Umzug in den SharePoint: läuft beim Entwickler von selbst im Hintergrund (Max, 05.11.2026) ----
   Sobald die Liste da ist und auf dem Server noch Bilder liegen, die im SharePoint fehlen, lädt die App sie hoch –
   vier gleichzeitig, mit Fortschrittskarte unten. Nur eine App bzw. ein Tab gleichzeitig (Sperre im Gerätespeicher).
   Nicht im Mobilfunk (rund 80 MB). Fehlgeschlagene Bilder versucht der nächste Start erneut. */
const BSP_UMZUG={laeuft:false,fertig:0,neu:0,fehler:0,gesamt:0,t0:0,zu:false,fehlt:[]};
const BSP_SPERRE="irrgang_bilder_umzug";
const bspEntw=()=>typeof meineRollen==="function"&&meineRollen().includes("Entwickler");
const bspMobilfunk=()=>{ const c=navigator.connection; return !!(c&&(c.type==="cellular"||c.saveData)); };
function bspGesperrt(){ try{ const t=+localStorage.getItem(BSP_SPERRE)||0; return Date.now()-t<15000; }catch(e){ return false; } }
function bspSperren(an){ try{ an?localStorage.setItem(BSP_SPERRE,String(Date.now())):localStorage.removeItem(BSP_SPERRE); }catch(e){} }
/* Was noch auf dem öffentlichen Server liegt: alle.json bleibt nach dem Löschen stehen – deshalb an der ersten Datei prüfen, ob es sie dort noch gibt */
async function bspAlleDateien(){ try{ const r=await fetch("../bilder/alle.json?"+Date.now(),{cache:"no-store"}); if(!r.ok) return []; const A=await r.json(); if(!A.length) return [];
  const h=await fetch("../bilder/"+A[0]+"?probe="+Date.now(),{method:"HEAD",cache:"no-store"}).catch(()=>null); return h&&h.ok?A:[]; }catch(e){ return []; } }
async function bspFehlende(){ const A=await bspAlleDateien(), L=BSP.liste||{}; return {A,fehlt:A.filter(p=>!L[bspPfad(bspName(p))])}; }
/* von bspListe aufgerufen, wenn die Liste neu ist */
async function bspAuto(){ if(BSP_UMZUG.laeuft||!bspEntw()||bspMobilfunk()||bspGesperrt()) return;
  const {fehlt}=await bspFehlende(); if(!fehlt.length) return;
  /* Prüfen, ob die Dateien auf dem Server überhaupt noch liegen (nach dem Löschen nicht mehr) */
  try{ const r=await fetch("../bilder/"+fehlt[0]+"?probe="+Date.now(),{method:"HEAD",cache:"no-store"}); if(!r.ok) return; }catch(e){ return; }
  BSP_UMZUG.fehlt=fehlt; bspHochladen(); }

/* ---- Fortschrittskarte ---- */
const BSP_RING=2*Math.PI*20;
function bspKarte(){ let k=document.getElementById("bspKarte"); const U=BSP_UMZUG;
  if(U.zu&&U.laeuft) return;
  /* PC mit Seitenleiste: kleines Kästchen unten in der Leiste über „Einstellungen“ – Handy/iPad: Karte unten */
  const sf=document.querySelector("#seitenFuss:not([hidden])");
  if(k&&!!sf!==k.classList.contains("klein")){ k.remove(); k=null; }
  if(!k){ k=document.createElement("div"); k.id="bspKarte"; k.className="bsp-karte"+(sf?" klein":""); k.setAttribute("role","status");
    k.innerHTML=`<span class="bsp-ring"><svg viewBox="0 0 48 48" aria-hidden="true"><circle class="bg" cx="24" cy="24" r="20"/><circle class="vg" cx="24" cy="24" r="20" stroke-dasharray="${BSP_RING.toFixed(2)}" stroke-dashoffset="${BSP_RING.toFixed(2)}"/></svg><span class="bsp-ic">${icon("upload")}</span></span>
      <span class="bsp-t"><b></b><small></small><span class="bsp-bar"><i></i></span></span><button type="button" class="bsp-zu" data-act="bspZu" aria-label="Ausblenden">${icon("bspZu")}</button>`;
    if(sf) sf.prepend(k); else document.body.appendChild(k); requestAnimationFrame(()=>k.classList.add("da")); }
  const klein=k.classList.contains("klein");
  const q=U.gesamt?U.fertig/U.gesamt:0, rest=U.fertig>3?Math.round((Date.now()-U.t0)/U.fertig*(U.gesamt-U.fertig)/1000):null;
  k.querySelector(".vg").setAttribute("stroke-dashoffset",(BSP_RING*(1-q)).toFixed(2));
  k.querySelector(".bsp-bar i").style.width=(q*100).toFixed(1)+"%";
  k.classList.toggle("fertig",!U.laeuft);
  k.querySelector("b").textContent=klein?(U.laeuft?"Bilder in den SharePoint":U.fehler?`${U.neu} von ${U.gesamt} Bildern oben`:`${U.gesamt} Bilder im SharePoint`):U.laeuft?"Produktbilder ziehen um":U.fehler?`${U.neu} von ${U.gesamt} Bildern im SharePoint`:`${U.gesamt} Bilder im SharePoint`;
  k.querySelector("small").textContent=klein?(U.laeuft?`${U.fertig} von ${U.gesamt}${rest!=null?` · ${rest>=90?`${Math.round(rest/60)}\u00a0Min.`:`${Math.max(5,rest)}\u00a0s`}`:""}`:U.fehler?`${U.fehler} beim nächsten Start`:"nur nach Anmeldung sichtbar"):U.laeuft?`In den SharePoint · ${U.fertig} von ${U.gesamt}${rest!=null?` · noch ${rest>=90?`ca.\u00a0${Math.round(rest/60)}\u00a0Min.`:`${Math.max(5,rest)}\u00a0s`}`:" · wird vorbereitet"}${U.fehler?` · ${U.fehler} Fehler`:""}`
    :U.fehler?`${U.fehler} nicht geklappt – der nächste Start versucht es erneut`:"Ab jetzt nur noch nach der Anmeldung sichtbar";
  if(!U.laeuft){ k.querySelector(".bsp-ic").innerHTML=icon(U.fehler?"bspWarn":"bspLock"); clearTimeout(k._weg); k._weg=setTimeout(()=>bspKarteWeg(),U.fehler?9000:6000); } }
function bspKarteWeg(){ const k=document.getElementById("bspKarte"); if(!k) return; k.classList.remove("da"); setTimeout(()=>k.remove(),300); }
Object.assign(IC,{bspLock:"M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z",
  bspZu:"M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
  bspWarn:"M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"});

async function bspHochladen(){ const U=BSP_UMZUG; if(U.laeuft) return; const P=(U.fehlt||[]).slice(); if(!P.length) return;
  Object.assign(U,{laeuft:true,fertig:0,neu:0,fehler:0,gesamt:P.length,t0:Date.now(),zu:false});
  bspSperren(true); const puls=setInterval(()=>bspSperren(true),5000); bspKarte();
  try{ await syncRoot(); const fid=await folderId(BSP_ORDNER,BSP_BIB);
    const eins=async p=>{ for(let v=0;v<2;v++){ try{ const r=await fetch("../bilder/"+p,{cache:"no-store"}); if(!r.ok) throw new Error("Server "+r.status);
          const b=await r.blob(), up=await g(`/drives/${fid}:/${encodeURIComponent(bspName(p))}:/content`,{method:"PUT",headers:{"Content-Type":b.type||"application/octet-stream"},body:b});
          if(!up.ok) throw new Error("SharePoint "+up.status); U.neu++; return; }catch(e){ if(v) { U.fehler++; console.warn("Bild",p,e); } } } };
    const arbeiter=async()=>{ while(P.length){ const p=P.shift(); await eins(p); U.fertig++; bspKarte(); bspStandDlg(); } };
    await Promise.all([arbeiter(),arbeiter(),arbeiter(),arbeiter()]);
  }catch(e){ console.warn("Umzug",e); U.fehler+=P.length; U.fertig=U.gesamt; }
  finally{ U.laeuft=false; clearInterval(puls); bspSperren(false); }
  await bspListe(true); U.zu=false; bspKarte(); bspStandDlg();
  if(typeof nav!=="undefined"&&nav.v==="mehr"&&typeof render==="function") render(); }

/* ---- Zeile in Einstellungen › Verwaltung und Detailfenster ---- */
function bspZeile(){ const U=BSP_UMZUG; return `<div class="li" role="button" tabindex="0" data-act="bspDlg"><span class="av">${icon(U.laeuft?"upload":"bspLock")}</span><span class="lt"><span class="h">Produktbilder im SharePoint</span><span class="s">${U.laeuft?`Wird hochgeladen … ${U.fertig} von ${U.gesamt}`:BSP.liste?`${BSP.anzahl} Bilder, nur nach der Anmeldung sichtbar`:"Wird beim nächsten Start geprüft"}</span></span>${icon("chev")}</div>`; }
function bspStandDlg(){ const s=document.getElementById("bspStand"), U=BSP_UMZUG; if(s&&U.laeuft) s.textContent=`Wird im Hintergrund hochgeladen … ${U.fertig} von ${U.gesamt}`; }
async function bspDlg(){ await bspListe(true); const {A,fehlt}=await bspFehlende(), U=BSP_UMZUG;
  dialog("Produktbilder im SharePoint",`<p>Herstellerfotos und Feldgrafiken liegen im SharePoint der Firma (Bibliothek „Kundendaten“ › „_App/Bilder“) und sind nur nach der Anmeldung sichtbar. Fehlende Bilder lädt die App beim Entwickler von selbst hoch, sobald sie geöffnet wird.</p>
    <p style="margin:12px 0"><b>${BSP.anzahl}</b> im SharePoint${A.length?` · <b>${A.length}</b> noch auf dem öffentlichen Server · <b>${fehlt.length}</b> fehlen im SharePoint`:""}</p>
    <p class="hint" id="bspStand">${U.laeuft?`Wird im Hintergrund hochgeladen … ${U.fertig} von ${U.gesamt}`:fehlt.length?(bspMobilfunk()?"Im Mobilfunk wird nicht hochgeladen – im WLAN geht es von selbst los.":"Startet gleich von selbst."):A.length?"Alle Bilder sind im SharePoint. Sie können vom öffentlichen Server gelöscht werden.":"Keine Bilder mehr auf dem öffentlichen Server."}</p>`,
    `<span style="flex:1"></span><button class="btn-text" data-act="cancel">Schließen</button>${fehlt.length&&!U.laeuft?`<button class="btn-text" data-act="bspLos">Jetzt hochladen</button>`:""}`);
  U.fehlt=fehlt; }
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act="bspDlg"],[data-act="bspLos"],[data-act="bspZu"]'); if(!b) return; e.stopPropagation();
  if(b.dataset.act==="bspDlg") bspDlg();
  else if(b.dataset.act==="bspZu"){ BSP_UMZUG.zu=true; bspKarteWeg(); }
  else { closeOverlays(); bspHochladen(); } },true);
