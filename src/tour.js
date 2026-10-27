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
  tourZeig(); }
function tourEnde(){ TOUR=null; document.body.classList.remove("tour-an"); document.getElementById("tourLayer")?.remove(); }
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
function tourSchritt(d){ if(!TOUR) return; const L=TOURS[TOUR.app], n=TOUR.i+d; if(n<0) return; if(n>=L.length){ const nx=TOUR_FOLGE[TOUR_FOLGE.indexOf(TOUR.app)+1]; if(nx) tourApp(nx); else tourEnde(); return; } TOUR.i=n; tourZeig(); }
function tourApp(app){ if(app===TOUR_APP){ tourStart(app); return; } const pfad={uebersicht:"uebersicht",evse:"evse",baustelle:"baustelle",echeck:"echeck"}[app]; location.href=`../${pfad}/?tour=${app}`; }
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest("[data-tour]"); if(b){ e.stopImmediatePropagation(); e.preventDefault(); const a=b.dataset.tour;
    if(a==="weiter") tourSchritt(1); else if(a==="zurueck") tourSchritt(-1); else if(a==="ende") tourEnde(); else if(a==="app") tourApp(b.dataset.v);
    else if(a==="start"){ if(typeof closeOverlays==="function") closeOverlays(); tourStart(b.dataset.v||TOUR_APP); } return; }
  if(TOUR&&e.target.closest&&e.target.closest("#tourLayer")){ e.stopImmediatePropagation(); e.preventDefault(); } },true);
document.addEventListener("keydown",e=>{ if(!TOUR) return; const k=e.key;
  if(["ArrowRight","PageDown"," ","Enter"].includes(k)){ e.preventDefault(); e.stopImmediatePropagation(); tourSchritt(1); }
  else if(["ArrowLeft","PageUp","Backspace"].includes(k)){ e.preventDefault(); e.stopImmediatePropagation(); tourSchritt(-1); }
  else if(k==="Escape"){ e.preventDefault(); e.stopImmediatePropagation(); tourEnde(); } },true);
addEventListener("resize",()=>{ if(TOUR) tourZeig(); });
/* Sprung aus einer anderen App: ?tour=<app> startet nach dem Laden */
addEventListener("load",()=>{ try{ const q=new URLSearchParams(location.search).get("tour"); if(q&&TOURS[q]){ history.replaceState(null,"",location.pathname); setTimeout(()=>tourStart(q),1800); } }catch(e){} });
/* Zeile im Entwickler-Bereich + Auswahlfenster */
function tourZeile(){ return `<div class="li" role="button" tabindex="0" data-act="tourWahl"><span class="av">${icon("bulb")}</span><span class="lt"><span class="h">Präsentationsmodus</span><span class="s">Geführte Vorstellung der Apps – Weiter mit Pfeiltasten, Leertaste oder Fernbedienung</span></span>${icon("chev")}</div>`; }
function tourWahl(){ const z=(app,t)=>`<button class="li" data-tour="start" data-v="${app}"><span class="av">${icon("bulb")}</span><span class="lt"><span class="h">${esc(t)}</span><span class="s">${TOURS[app].length} Schritte${app===TOUR_APP?" · diese App":""}</span></span>${icon("chev")}</button>`;
  dialog("Präsentation starten",`<div class="list">${TOUR_FOLGE.filter(a=>a===TOUR_APP).map(a=>z(a,TOUR_NAME[a])).join("")}${TOUR_FOLGE.filter(a=>a!==TOUR_APP).map(a=>`<button class="li" data-tour="app" data-v="${a}"><span class="av">${icon("bulb")}</span><span class="lt"><span class="h">${esc(TOUR_NAME[a])}</span><span class="s">öffnet die App und startet dort</span></span>${icon("chev")}</button>`).join("")}</div>
    <p class="sup" style="margin:12px 4px 0">Reihenfolge für die Vorstellung: Übersicht → Baustelle → EVSE → E-Check; am Ende jeder Tour geht es mit „Weiter“ in die nächste App. Tipp: vorher unter „Entwickler“ die Demo-Vorschau einschalten, dann sind Beispielkunden und -aufträge zu sehen.</p>`,
    `<span style="flex:1"></span><button class="btn-text" data-act="cancel">Schließen</button>`); }
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act="tourWahl"]'); if(!b) return; e.stopImmediatePropagation(); e.preventDefault(); tourWahl(); },true);
