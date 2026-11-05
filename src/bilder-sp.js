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
    BSP.liste=m; BSP.t=Date.now(); BSP.anzahl=Object.keys(m).length; await bspAnSw(m); setTimeout(bspNachladen,400);
  }catch(e){ console.warn("Bilderliste",e); }
  finally{ BSP.laeuft=false; fertig(); }
  return BSP.liste; }
setTimeout(()=>bspListe(),2500);
setInterval(()=>{ if(document.visibilityState==="visible") bspListe(); },5*60e3);
document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="visible") bspListe(); });

/* ---- Einmaliger Umzug (Entwickler, Übersicht › Mehr › Verwaltung): Bilder vom Server in den SharePoint kopieren ---- */
const BSP_UMZUG={laeuft:false,fertig:0,neu:0,fehler:0,gesamt:0,abbruch:false};
async function bspAlleDateien(){ try{ const r=await fetch("../bilder/alle.json?"+Date.now(),{cache:"no-store"}); if(!r.ok) return []; return await r.json(); }catch(e){ return []; } }
function bspZeile(){ return `<div class="li" role="button" tabindex="0" data-act="bspDlg"><span class="av">${icon("upload")}</span><span class="lt"><span class="h">Produktbilder im SharePoint</span><span class="s">${BSP.liste?`${BSP.anzahl} Bilder hinter der Anmeldung`:"Bilder aus dem öffentlichen Server übernehmen"}</span></span>${icon("chev")}</div>`; }
async function bspDlg(){ const A=await bspAlleDateien(), L=(await bspListe(true))||{}, fehlt=A.filter(p=>!L[bspPfad(bspName(p))]);
  const U=BSP_UMZUG;
  dialog("Produktbilder im SharePoint",`<p>Herstellerfotos und Feldgrafiken liegen künftig nur noch im SharePoint der Firma (Bibliothek „Kundendaten“ › „_App/Bilder“) – sichtbar erst nach der Anmeldung. Danach werden sie vom öffentlichen Server gelöscht.</p>
    <p style="margin:12px 0"><b>${A.length}</b> auf dem Server · <b>${A.length-fehlt.length}</b> im SharePoint · <b>${fehlt.length}</b> fehlen noch</p>
    <p class="hint" id="bspStand">${U.laeuft?`Läuft … ${U.fertig} von ${U.gesamt}`:fehlt.length?`Einmal hochladen, dauert je nach Netz einige Minuten (rund ${Math.round(A.length/3)} MB). App dabei offen lassen.`:A.length?"Alle Bilder sind im SharePoint. Sie können jetzt vom Server gelöscht werden.":"Keine Bilder mehr auf dem Server – die Apps laden alles aus dem SharePoint."}</p>`,
    `<span style="flex:1"></span><button class="btn-text" data-act="cancel">Schließen</button>${fehlt.length&&!U.laeuft?`<button class="btn-text" data-act="bspLos">${fehlt.length} hochladen</button>`:""}`);
  BSP_UMZUG.fehlt=fehlt; }
async function bspHochladen(){ const U=BSP_UMZUG; if(U.laeuft) return; const P=(U.fehlt||[]).slice(); if(!P.length) return;
  Object.assign(U,{laeuft:true,fertig:0,neu:0,fehler:0,gesamt:P.length,abbruch:false});
  const stand=()=>{ const s=document.getElementById("bspStand"); if(s) s.textContent=`Läuft … ${U.fertig} von ${U.gesamt}${U.fehler?` · ${U.fehler} Fehler`:""}`; };
  try{ await syncRoot(); const fid=await folderId(BSP_ORDNER,BSP_BIB);
    for(const p of P){ if(U.abbruch) break;
      try{ const r=await fetch("../bilder/"+p,{cache:"no-store"}); if(!r.ok) throw new Error("Server "+r.status);
        const b=await r.blob(), up=await g(`/drives/${fid}:/${encodeURIComponent(bspName(p))}:/content`,{method:"PUT",headers:{"Content-Type":b.type||"application/octet-stream"},body:b});
        if(!up.ok) throw new Error("SharePoint "+up.status); U.neu++;
      }catch(e){ U.fehler++; console.warn("Bild",p,e); }
      U.fertig++; stand(); }
  } finally{ U.laeuft=false; }
  await bspListe(true);
  toast(U.fehler?`${U.neu} Bilder hochgeladen, ${U.fehler} fehlgeschlagen – nochmal starten`:`${U.neu} Bilder im SharePoint`);
  if(!document.getElementById("dlg").hidden&&document.getElementById("bspStand")) bspDlg(); }
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act="bspDlg"],[data-act="bspLos"]'); if(!b) return; e.stopPropagation();
  if(b.dataset.act==="bspDlg") bspDlg(); else { b.disabled=true; bspHochladen(); } },true);
