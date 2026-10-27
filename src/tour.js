/* ===== Präsentationsmodus (nur Entwickler) =====
   Geführte Vorstellung der Apps: Bildschirm wird abgedunkelt, ein Bereich hervorgehoben, daneben eine Erklärkarte.
   Weiter/Zurück per Knopf, Pfeiltasten, Leertaste oder Präsentations-Fernbedienung (Bild auf/ab). Esc beendet.
   Eine Tour kann die Seite wechseln (Schritt mit v/id) und am Ende in die nächste App springen (?tour=<app>).
   Schritt: {v, id, vor, ziel:"css, css", t:"Titel", x:"Text"} – ohne sichtbares Ziel steht die Karte in der Mitte. */
const TOUR_APP=(()=>{ const p=location.pathname; return /\/evse\//.test(p)?"evse":/\/baustelle\//.test(p)?"baustelle":/\/echeck\//.test(p)?"echeck":"uebersicht"; })();
const TOUR_NAME={uebersicht:"Übersicht",evse:"EVSE",baustelle:"Baustelle",echeck:"E-Check"};
const TOUR_FOLGE=["uebersicht","baustelle","evse","echeck"];
const tourNav=v=>`.nav-item[data-v="${v}"]`;
const TOURS={
  uebersicht:[
    {v:"start",t:"Die Irrgang-Apps",x:"Vier Apps, ein Firmenkonto: Übersicht fürs Büro und den Überblick, Baustelle für den Alltag draußen, EVSE für Wallbox-Prüfungen, E-Check für Anlagen-, Geräte- und Netzwerkprüfungen. Alles liegt in unserem SharePoint – kein Zettel, keine WhatsApp-Fotos mehr."},
    {v:"start",ziel:"#navbar",t:"Navigation",x:"Unten (Handy) bzw. links (PC) die Bereiche: Start, Aufträge, Kunden, Bibliothek. Am PC zusätzlich Statistik und Messgeräte, am Handy stehen die als Karten auf der Startseite."},
    {v:"start",ziel:".wg-raster, .apps",t:"Startseite",x:"Jeder sieht hier, was heute zu tun ist: offenes Material, Aufträge, Prüfungen und Fristen, Baustellen. Über den Stift oben stellt sich jeder seine Startseite selbst zusammen."},
    {v:"start",ziel:'.wg[data-w="material"]',t:"Material",x:"Was auf Baustellen fehlt, landet automatisch hier. Das Büro sieht es sofort und setzt es auf „bestellt“ und „da“ – wer angefordert hat, bekommt Bescheid."},
    {v:"auftraege",ziel:".vt, .vg-l, .vg-tab, #res",t:"Aufträge",x:"Jeder Auftrag läuft von links nach rechts: Anruf → Anfrage ans Büro → Auftrag (mit SCC-Nummer) → Termin → erledigt. Hängt etwas zu lange, wird es markiert."},
    {v:"auftraege",ziel:"#fab",t:"Neuer Vorgang",x:"Kommt ein Anruf rein: hier tippen, Kunde und Anliegen eintragen, fertig. Das Büro bekommt die Anfrage und erteilt den Auftrag."},
    {v:"auftraege",ziel:".ml-chip",t:"Rahmenaufträge und Meldungen",x:"Für Großkunden wie Merten: ein Rahmenauftrag fürs Jahr, darunter jede kleine Meldung – wer sie gemeldet hat, Bauteil und Ebene, Maschine, wer zuständig ist, was mitzubringen ist und das Ergebnis, auch „kein Befund“."},
    {v:"kunden",ziel:".search",t:"Kunden",x:"Alle Kunden aller Apps an einer Stelle. Suchen nach Name, Ort oder Ansprechpartner. Jeder Kunde ist Privat, Gewerbe oder Industrie – danach richtet sich, was die App anbietet."},
    {v:"kunde",vor:()=>{ const k=(typeof live==="function"?live("kunden"):[]).sort((a,b)=>(b.art==="industrie")-(a.art==="industrie"))[0]; return k?{v:"kunde",id:k.id}:null; },ziel:".infok2",t:"Ein Kunde",x:"Eckdaten mit Anrufen, E-Mail und Route, darunter Ansprechpartner mit Rolle, Dokumente und Fotos, Standorte und alles, was es zu diesem Kunden gibt."},
    {v:"kunde",ziel:'[data-act="anAuf"]',t:"Anlagen",x:"Für Gewerbe und Industrie: Gebäude mit Bauteilen und Ebenen, Verteiler mit Einspeisung und Maschinen mit Nummer, Versorgungsweg, Änderungsprotokoll und Prüffrist – je Standort getrennt."},
    {v:"bibliothek",ziel:".bib-kopf, #res",t:"Bibliothek",x:"Alle Dokumente, Fotos und Prüfprotokolle – sortiert nach Kunde in festen Ordnern (Angebote, Pläne, Prüfprotokolle, Baustellenberichte, Fotos, Datenblätter, Schriftverkehr). Es ist echtes SharePoint: im Büro genauso im Explorer zu finden."},
    {ziel:"#glBtn:not([hidden]), .sf-gl",t:"Benachrichtigungen",x:"Was einen selbst betrifft: neue Aufträge, Zuweisungen, Meldungen, Material, fertige Protokolle. Nach Bereichen sortiert und direkt antippbar."},
    {ziel:"#avBtn:not([hidden]), .sf-ich",t:"Konto und Einstellungen",x:"Eigener Name und Profilbild, Abgleich-Status, Darstellung und Textgröße. Chef und Büro verwalten hier Mitarbeiter, Rechte und Prüfer."},
    {t:"Übersicht – fertig",x:"Weiter geht es mit der Baustellen-App – der App für jeden Tag draußen."}],
  baustelle:[
    {t:"Baustelle",x:"Die App für den Alltag: Baustellen, Übergaben, Fotos, Notizen und Material – vom Handy aus, auch ohne Netz. Alles kommt beim Abgleich ins SharePoint."},
    {ziel:"#navbar",t:"Bereiche",x:"Baustellen, Aufträge, Notizen, Material, Kunden und Bibliothek."},
    {v:"start",ziel:"#res, .narrow",t:"Baustellen",x:"Alle laufenden Baustellen. Antippen öffnet die Baustelle mit Übergaben, Fotos, Aufnahmeprotokoll und Dokumenten."},
    {v:"start",ziel:"#fab",t:"Neue Baustelle oder Übergabe",x:"Mit dem roten Knopf wird angelegt. Eine Übergabe hält fest, was gemacht wurde, was offen ist und welches Material morgen fehlt – das Material geht automatisch ans Büro."},
    {v:"notizen",ziel:"#res, .narrow",t:"Notizen",x:"Eigene Notizen, Checklisten, Skizzen und Fotos – privat oder mit Kollegen bzw. der ganzen Firma geteilt."},
    {v:"material",ziel:"#res, .narrow",t:"Material",x:"Materialanforderungen mit Stand: angefordert, bestellt, da."},
    {v:"auftraege",ziel:"#res, .narrow",t:"Aufträge",x:"Dieselben Aufträge wie in der Übersicht – mit Termin wird daraus eine Baustelle, ist die Baustelle fertig, ist der Auftrag erledigt."},
    {t:"Baustelle – fertig",x:"Weiter mit EVSE, den Wallbox-Prüfungen."}],
  evse:[
    {t:"EVSE – Wallbox-Prüfung",x:"Prüfprotokolle für Ladeeinrichtungen nach Norm – Schritt für Schritt geführt, Messwerte mit Grenzwerten, am Ende ein fertiges PDF für den Kunden."},
    {ziel:"#navbar",t:"Bereiche",x:"Start, Kunden, Prüfungen, Fällig und Bibliothek; am PC zusätzlich der Wallbox-Katalog."},
    {v:"pruefungen",ziel:"#res, .narrow",t:"Prüfungen",x:"Alle Prüfungen mit Stand: in Arbeit, bestanden, nicht bestanden. Antippen öffnet das Protokoll."},
    {v:"pruefungen",ziel:"#fab",t:"Neue Prüfung",x:"Kunde, Standort, Wallbox wählen – die Daten der Wallbox kommen aus dem Katalog, Messgerät und Prüfer sind vorbelegt."},
    {v:"faellig",ziel:"#res, .narrow",t:"Fällige Wiederholungsprüfungen",x:"Welche Wallboxen wieder geprüft werden müssen – das Büro kann daraus direkt Termine machen."},
    {v:"bibliothek",ziel:".bib-kopf, #res",t:"Protokolle",x:"Fertige Protokolle liegen als PDF im Kundenordner unter „Prüfprotokolle“ und gehen an info@ zur Rechnung."},
    {t:"EVSE – fertig",x:"Zum Schluss der E-Check."}],
  echeck:[
    {t:"E-Check",x:"Prüfung von Anlagen (DIN VDE 0100-600 / 0105-100), ortsveränderlichen Geräten (DIN VDE 0701-0702) und Netzwerkverkabelung – mit Gebäudeaufbau, Messwerten und Protokoll."},
    {ziel:"#navbar",t:"Bereiche",x:"Installation, Geräte, Netzwerk, Kunden und Bibliothek."},
    {v:"anlagen",ziel:"#res, .narrow",t:"Installationsprüfung",x:"Gebäude mit Etagen, Räumen, Verteilern, Fehlerschutzschaltern und Stromkreisen – einmal erfasst, bei der nächsten Prüfung wieder da. Es ist dasselbe Gebäudemodell wie unter „Anlagen“ in der Übersicht."},
    {v:"geraete",ziel:"#res, .narrow",t:"Geräteprüfung",x:"Ortsveränderliche Geräte mit Schutzklasse, Messwerten und Frist."},
    {v:"netzwerk",ziel:"#res, .narrow",t:"Netzwerk",x:"Datenverkabelung: Schränke, Dosen, Messergebnisse."},
    {t:"Das war’s",x:"Fragen? Alles, was hier gezeigt wurde, funktioniert am Handy, iPad und PC – mit demselben Firmenkonto."}]};

let TOUR=null;
function tourStart(app,ab){ const L=TOURS[app||TOUR_APP]; if(!L||!L.length) return; if(typeof closeOverlays==="function") closeOverlays(); TOUR={app:app||TOUR_APP,i:Math.max(0,Math.min(ab||0,L.length-1))};
  document.body.classList.add("tour-an"); if(!document.getElementById("tourLayer")) document.body.insertAdjacentHTML("beforeend",`<div id="tourLayer" aria-live="polite"><div id="tourSpot"></div><div id="tourBox" role="dialog" aria-label="Präsentation"></div></div>`);
  document.getElementById("tourLayer").style.display=""; tourFab(); tourZeig(); }
function tourEnde(){ TOUR=null; document.body.classList.remove("tour-an","tour-pause"); document.getElementById("tourLayer")?.remove(); document.getElementById("tourFab")?.remove(); tourMenuZu(); }
/* ---- Schwebender Knopf: pausieren (frei zeigen und erklären), fortsetzen, springen, beenden ---- */
const TOUR_IC={play:"M8 5v14l11-7z",pause:"M6 19h4V5H6v14zm8-14v14h4V5h-4z"};
const tourSvg=k=>`<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="${TOUR_IC[k]}"/></svg>`;
function tourFab(){ if(!TOUR) return; let f=document.getElementById("tourFab");
  if(!f){ document.body.insertAdjacentHTML("beforeend",`<button type="button" id="tourFab" aria-label="Präsentation steuern"></button>`); f=document.getElementById("tourFab");
    let pos=null; try{ pos=JSON.parse(localStorage.getItem("irrgang_tour_fab")||"null"); }catch(e){}
    const setz=(x,y)=>{ const w=f.offsetWidth||160, h=f.offsetHeight||48; f.style.left=Math.max(8,Math.min(innerWidth-w-8,x))+"px"; f.style.top=Math.max(8,Math.min(innerHeight-h-8,y))+"px"; };
    requestAnimationFrame(()=>setz(pos?pos.x*innerWidth:innerWidth/2-(f.offsetWidth||170)/2,pos?pos.y*innerHeight:innerHeight-(innerWidth>=744?76:150))); /* Standard: unten mittig */
    let zug=null; f.addEventListener("pointerdown",e=>{ zug={x:e.clientX,y:e.clientY,l:f.offsetLeft,t:f.offsetTop,weit:false}; f.setPointerCapture(e.pointerId); });
    f.addEventListener("pointermove",e=>{ if(!zug) return; const dx=e.clientX-zug.x, dy=e.clientY-zug.y; if(Math.hypot(dx,dy)>6) zug.weit=true; if(zug.weit){ setz(zug.l+dx,zug.t+dy); tourMenuZu(); } });
    f.addEventListener("pointerup",()=>{ if(!zug) return; const weit=zug.weit; zug=null; if(weit){ try{ localStorage.setItem("irrgang_tour_fab",JSON.stringify({x:f.offsetLeft/innerWidth,y:f.offsetTop/innerHeight})); }catch(e){} f.dataset.gezogen="1"; setTimeout(()=>delete f.dataset.gezogen,50); } }); }
  const L=TOURS[TOUR.app]; f.classList.toggle("pause",!!TOUR.pause);
  f.innerHTML=`${tourSvg(TOUR.pause?"play":"pause")}<span>${esc(TOUR_NAME[TOUR.app])} · ${TOUR.i+1}/${L.length}</span>`; }
function tourMenuZu(){ document.getElementById("tourMenu")?.remove(); }
function tourMenu(){ if(!TOUR) return; if(document.getElementById("tourMenu")){ tourMenuZu(); return; } const f=document.getElementById("tourFab"), L=TOURS[TOUR.app], nd=typeof nurDemo==="function"&&nurDemo();
  document.body.insertAdjacentHTML("beforeend",`<div id="tourMenu" role="menu">
    <button class="tm-i haupt" data-tour="${TOUR.pause?"weiterspielen":"pause"}">${tourSvg(TOUR.pause?"play":"pause")}<span>${TOUR.pause?"Präsentation fortsetzen":"Pausieren – frei zeigen"}</span></button>
    <div class="tm-reihe"><button class="tm-i" data-tour="zurueck" ${TOUR.i?"":"disabled"}>Zurück</button><button class="tm-i" data-tour="weiter">Weiter</button></div>
    <div class="tm-l">Schritt wählen</div><div class="tm-schritte">${L.map((s,k)=>`<button class="tm-s${k===TOUR.i?" an":""}" data-tour="geh" data-v="${k}"><b>${k+1}</b><span>${esc(s.t)}</span></button>`).join("")}</div>
    <button class="tm-i" data-tour="nurdemo"><span>Nur Beispieldaten</span><span class="schalter${nd?" an":""}" aria-hidden="true"><i></i></span></button>
    <button class="tm-i weg" data-tour="ende"><span>Präsentation beenden</span></button></div>`);
  const m=document.getElementById("tourMenu"), r=f.getBoundingClientRect(), w=m.offsetWidth, h=m.offsetHeight;
  m.style.left=Math.max(8,Math.min(innerWidth-w-8,r.left))+"px"; m.style.top=(r.top-h-8>8?r.top-h-8:Math.min(innerHeight-h-8,r.bottom+8))+"px"; }
function tourPause(an){ if(!TOUR) return; TOUR.pause=an; const l=document.getElementById("tourLayer"); if(l) l.style.display=an?"none":""; document.body.classList.toggle("tour-pause",an); tourMenuZu(); tourFab(); if(!an) tourZeig(); }
function tourSicht(el){ if(!el) return false; const r=el.getBoundingClientRect(), st=getComputedStyle(el); return r.width>4&&r.height>4&&st.visibility!=="hidden"&&st.display!=="none"&&!el.closest("[hidden]"); }
function tourZiel(sel){ if(!sel) return null; for(const s of sel.split(/\s*,\s*/)){ const el=[...document.querySelectorAll(s)].find(tourSicht); if(el) return el; } return null; }
async function tourZeig(){ if(!TOUR) return; const L=TOURS[TOUR.app], s=L[TOUR.i];
  /* Seite wechseln, falls der Schritt woanders spielt */
  let z=s.vor?s.vor():null; if(!z&&s.v) z={v:s.v,...(s.id?{id:s.id}:{})};
  if(z&&typeof go==="function"&&(nav.v!==z.v||(z.id&&nav.id!==z.id))){ if(z.v==="kunde"&&!z.id){ const k=(typeof live==="function"?live("kunden"):[])[0]; if(k) z.id=k.id; } if(z.v!=="kunde"||z.id) go(z); }
  let el=null; for(let n=0;n<15&&s.ziel&&!(el=tourZiel(s.ziel));n++) await new Promise(r=>setTimeout(r,100));
  if(!TOUR||TOURS[TOUR.app][TOUR.i]!==s) return;
  if(el){ el.scrollIntoView({block:"center",behavior:"smooth"}); await new Promise(r=>setTimeout(r,320)); }
  tourMale(el,s); }
function tourMale(el,s){ const sp=document.getElementById("tourSpot"), bx=document.getElementById("tourBox"); if(!sp||!bx||!TOUR) return; const L=TOURS[TOUR.app], i=TOUR.i, letzte=i===L.length-1;
  const naechste=TOUR_FOLGE[TOUR_FOLGE.indexOf(TOUR.app)+1];
  bx.innerHTML=`<div class="tb-k"><span class="tb-app">${esc(TOUR_NAME[TOUR.app])}</span><span class="tb-n">${i+1} von ${L.length}</span><button class="tb-zu" data-tour="ende" aria-label="Präsentation beenden" title="Beenden (Esc)">${icon("close")}</button></div>
    <h3>${esc(s.t)}</h3><p>${esc(s.x)}</p>
    <div class="tb-punkte">${L.map((_,k)=>`<i class="${k===i?"an":k<i?"war":""}"></i>`).join("")}</div>
    <div class="tb-f">${i?`<button class="btn-text" data-tour="zurueck">Zurück</button>`:""}<span style="flex:1"></span>${letzte?(naechste?`<button class="btn-text" data-tour="ende">Beenden</button><button class="btn-filled" data-tour="app" data-v="${naechste}">Weiter: ${esc(TOUR_NAME[naechste])}</button>`:`<button class="btn-filled" data-tour="ende">Fertig</button>`):`<button class="btn-filled" data-tour="weiter">Weiter</button>`}</div>`;
  const W=innerWidth, H=innerHeight;
  if(el){ const r=el.getBoundingClientRect(), p=8, x=Math.max(4,r.left-p), y=Math.max(4,r.top-p), w=Math.min(W-8,r.width+2*p), h=Math.min(H-8,r.height+2*p);
    Object.assign(sp.style,{left:x+"px",top:y+"px",width:w+"px",height:h+"px",opacity:1}); sp.classList.remove("leer");
    const bw=Math.min(400,W-24); bx.style.width=bw+"px"; const bh=bx.offsetHeight;
    let top=y+h+14, left=Math.min(Math.max(12,x+w/2-bw/2),W-bw-12);
    if(top+bh>H-12){ top=y-bh-14; if(top<12){ /* Ziel zu groß: Karte daneben oder unten in die Ecke */ if(x+w+bw+24<W){ left=x+w+14; top=Math.max(12,Math.min(y,H-bh-12)); } else if(x-bw-24>0){ left=x-bw-14; top=Math.max(12,Math.min(y,H-bh-12)); } else { top=H-bh-12; } } }
    Object.assign(bx.style,{left:left+"px",top:top+"px",transform:"none"}); }
  else { Object.assign(sp.style,{left:W/2+"px",top:H/2+"px",width:"0px",height:"0px",opacity:1}); sp.classList.add("leer");
    const bw=Math.min(520,W-24); bx.style.width=bw+"px"; Object.assign(bx.style,{left:"50%",top:"50%",transform:"translate(-50%,-50%)"}); }
  if(document.activeElement&&document.activeElement.blur) document.activeElement.blur(); }
function tourSchritt(d){ if(!TOUR) return; const L=TOURS[TOUR.app], n=TOUR.i+d; if(n<0) return; if(n>=L.length){ const nx=TOUR_FOLGE[TOUR_FOLGE.indexOf(TOUR.app)+1]; if(nx) tourApp(nx); else tourEnde(); return; } TOUR.i=n; if(TOUR.pause) tourPause(false); else { tourFab(); tourZeig(); } }
function tourApp(app){ if(app===TOUR_APP){ tourStart(app); return; } const pfad={uebersicht:"uebersicht",evse:"evse",baustelle:"baustelle",echeck:"echeck"}[app]; location.href=`../${pfad}/?tour=${app}`; }
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest("[data-tour]"); if(b){ e.stopImmediatePropagation(); e.preventDefault(); const a=b.dataset.tour;
    if(a==="weiter"){ tourMenuZu(); tourSchritt(1); } else if(a==="zurueck"){ tourMenuZu(); tourSchritt(-1); } else if(a==="ende") tourEnde(); else if(a==="app") tourApp(b.dataset.v);
    else if(a==="pause") tourPause(true); else if(a==="weiterspielen") tourPause(false);
    else if(a==="geh"&&TOUR){ tourMenuZu(); TOUR.i=+b.dataset.v; if(TOUR.pause) tourPause(false); else { tourFab(); tourZeig(); } }
    else if(a==="nurdemo"){ const an=!(typeof nurDemo==="function"&&nurDemo()); if(typeof nurDemoSetzen==="function") nurDemoSetzen(an); const s=b.querySelector(".schalter"); if(s) s.classList.toggle("an",an); if(TOUR&&!TOUR.pause) setTimeout(tourZeig,200); }
    else if(a==="start"){ if(typeof closeOverlays==="function") closeOverlays(); tourStart(b.dataset.v||TOUR_APP); } return; }
  const fab=e.target.closest&&e.target.closest("#tourFab"); if(fab){ e.stopImmediatePropagation(); e.preventDefault(); if(!fab.dataset.gezogen) tourMenu(); return; }
  if(document.getElementById("tourMenu")&&!(e.target.closest&&e.target.closest("#tourMenu"))) tourMenuZu();
  if(TOUR&&!TOUR.pause&&e.target.closest&&e.target.closest("#tourLayer")){ e.stopImmediatePropagation(); e.preventDefault(); } },true);
document.addEventListener("keydown",e=>{ if(!TOUR) return; const k=e.key, tippt=e.target&&/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
  if((k==="p"||k==="P")&&!tippt&&!e.ctrlKey&&!e.metaKey){ e.preventDefault(); tourPause(!TOUR.pause); return; }
  if(TOUR.pause) return; /* pausiert: Tastatur gehört wieder der App */
  if(["ArrowRight","PageDown"," ","Enter"].includes(k)){ e.preventDefault(); e.stopImmediatePropagation(); tourSchritt(1); }
  else if(["ArrowLeft","PageUp","Backspace"].includes(k)){ e.preventDefault(); e.stopImmediatePropagation(); tourSchritt(-1); }
  else if(k==="Escape"){ e.preventDefault(); e.stopImmediatePropagation(); tourEnde(); } },true);
addEventListener("resize",()=>{ if(TOUR){ tourMenuZu(); if(!TOUR.pause) tourZeig(); } });
/* Sprung aus einer anderen App: ?tour=<app> startet nach dem Laden */
addEventListener("load",()=>{ try{ const q=new URLSearchParams(location.search).get("tour"); if(q&&TOURS[q]){ history.replaceState(null,"",location.pathname); setTimeout(()=>tourStart(q),1800); } }catch(e){} });
/* Zeile im Entwickler-Bereich + Auswahlfenster */
function tourZeile(){ return `<div class="li" role="button" tabindex="0" data-act="tourWahl"><span class="av">${icon("bulb")}</span><span class="lt"><span class="h">Präsentationsmodus</span><span class="s">Geführte Vorstellung der Apps – Weiter mit Pfeiltasten, Leertaste oder Fernbedienung</span></span>${icon("chev")}</div>`; }
function tourWahl(){ const z=(app,t)=>`<button class="li" data-tour="start" data-v="${app}"><span class="av">${icon("bulb")}</span><span class="lt"><span class="h">${esc(t)}</span><span class="s">${TOURS[app].length} Schritte${app===TOUR_APP?" · diese App":""}</span></span>${icon("chev")}</button>`;
  dialog("Präsentation starten",`<div class="list">${TOUR_FOLGE.filter(a=>a===TOUR_APP).map(a=>z(a,TOUR_NAME[a])).join("")}${TOUR_FOLGE.filter(a=>a!==TOUR_APP).map(a=>`<button class="li" data-tour="app" data-v="${a}"><span class="av">${icon("bulb")}</span><span class="lt"><span class="h">${esc(TOUR_NAME[a])}</span><span class="s">öffnet die App und startet dort</span></span>${icon("chev")}</button>`).join("")}</div>
    <div class="list" style="margin-top:12px"><button class="li" data-tour="nurdemo"><span class="lt"><span class="h">Nur Beispieldaten zeigen</span><span class="s">Echte Kunden und Aufträge werden auf diesem Gerät ausgeblendet (nichts wird gelöscht). Schaltet die Demo-Vorschau mit ein.</span></span><span class="schalter${typeof nurDemo==="function"&&nurDemo()?" an":""}" aria-hidden="true"><i></i></span></button></div>
    <p class="sup" style="margin:12px 4px 0">Während der Präsentation unten in der Mitte der schwebende Knopf: antippen für Pause (frei zeigen und erklären), Fortsetzen, Schritt wählen, Beenden – verschiebbar. Taste P = Pause/Weiter. Reihenfolge für die Vorstellung: Übersicht → Baustelle → EVSE → E-Check; am Ende jeder Tour geht es mit „Weiter“ in die nächste App.</p>`,
    `<span style="flex:1"></span><button class="btn-text" data-act="cancel">Schließen</button>`); }
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act="tourWahl"]'); if(!b) return; e.stopImmediatePropagation(); e.preventDefault(); tourWahl(); },true);
