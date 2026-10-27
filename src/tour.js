/* ===== Präsentationsmodus (nur Entwickler, nur iPad und PC) =====
   Geführte Vorstellung der Apps für die große Tafel: Bildschirm wird abgedunkelt, ein Bereich hervorgehoben, daneben eine große Erklärkarte.
   Weiter/Zurück per Knopf, Wischen auf der Karte, Pfeiltasten, Leertaste oder Präsentations-Fernbedienung (Bild auf/ab).
   P oder Esc = Pause (frei zeigen und erklären), danach geht es an derselben Stelle weiter.
   Beispieldaten: Beim Start wird die Demo eingeschaltet (nur auf diesem Gerät, nie hochgeladen), beim Beenden wieder entfernt.
   Schritt: {v, id, vor:()=>ziel, tun:()=>…, ziel:"css, css", t:"Titel", x:"Text", d:["Punkt", …], kap:true (Kapitelfolie)}
   Ohne sichtbares Ziel steht die Karte groß in der Mitte. Am Ende einer App geht es in die nächste (?tour=<app>). */
const TOUR_APP=(()=>{ const p=location.pathname; return /\/evse\//.test(p)?"evse":/\/baustelle\//.test(p)?"baustelle":/\/echeck\//.test(p)?"echeck":"uebersicht"; })();
const TOUR_NAME={uebersicht:"Übersicht",evse:"EVSE",baustelle:"Baustelle",echeck:"E-Check"};
const TOUR_FOLGE=["uebersicht","baustelle","evse","echeck"];
const TOUR_SK="irrgang_tour", TOUR_PULS="irrgang_tour_puls";
/* kleine Helfer für die Schritte (alle Funktionen der Apps sind hier sichtbar, aber nicht in jeder App vorhanden) */
const tourVg=id=>{ try{ if(typeof vgOpen==="function"&&DB.vorgaenge&&DB.vorgaenge.get(id)) vgOpen(DB.vorgaenge.get(id)); }catch(e){} };
const tourKlick=sel=>{ const el=[...document.querySelectorAll(sel)].find(x=>x.getBoundingClientRect().width>0); if(el) el.click(); return !!el; };
const tourMeldung=id=>{ try{ const m=DB.vorgaenge.get(id), r=m&&DB.vorgaenge.get(m.rahmenId); if(m&&r&&typeof mlDialog==="function") mlDialog(r,m); }catch(e){} };
const tourAnTab=t=>{ try{ META.anTab=t; }catch(e){} };
const TOURS={
  uebersicht:[
    {v:"start",kap:true,t:"Die Irrgang-Apps",x:"Vier Apps, ein Firmenkonto – vom Anruf bis zum Prüfprotokoll.",d:["Übersicht – Büro, Aufträge, Kunden, Anlagen","Baustelle – der Alltag draußen","EVSE – Wallbox-Prüfungen nach Norm","E-Check – Anlagen, Geräte, Netzwerk"]},
    {v:"start",kap:true,t:"Ein Speicher für alles",x:"Alles liegt in unserem SharePoint. Die Apps arbeiten auch ohne Netz und gleichen ab, sobald wieder Empfang da ist.",d:["Keine Zettel, keine WhatsApp-Fotos","Am Handy, iPad und PC dasselbe","Jeder meldet sich mit seinem Firmenkonto an"]},
    {v:"start",ziel:"#navbar",t:"Die Bereiche",x:"Start, Aufträge, Statistik, Kunden, Messgeräte und Bibliothek.",d:["Am Handy unten vier Bereiche, der Rest als Karten auf der Startseite","Am iPad und PC alles oben bzw. links"]},
    {v:"start",ziel:".wg-raster, .apps",t:"Die Startseite",x:"Jeder sieht sofort, was heute ansteht.",d:["Offenes Material, Aufträge, Prüfungen und Fristen, Baustellen","Über den Stift stellt sich jeder seine Startseite selbst zusammen"]},
    {v:"start",ziel:'.wg[data-w="material"]',t:"Material",x:"Was auf der Baustelle fehlt, kommt automatisch hier an.",d:["Das Büro setzt auf „bestellt“ und „da“","Wer angefordert hat, bekommt Bescheid","„Aus dem Lager“ – dann wird nichts bestellt"]},
    {v:"start",ziel:'.wg[data-w="pruefungen"], .wg[data-w="fristen"]',t:"Prüfungen und Fristen",x:"Wiederholungsprüfungen aus EVSE, E-Check und den Maschinen der Kunden – rechtzeitig sichtbar.",d:["Rot: überfällig · Gelb: bald fällig","Antippen führt direkt zur Prüfung"]},
    {v:"auftraege",ziel:".vg-tafel, .vt, .vg-l, #res",t:"Aufträge",x:"Jeder Auftrag läuft von links nach rechts durch.",d:["Anruf → Anfrage ans Büro → Auftrag mit SCC-Nummer → Termin → erledigt","Hängt etwas zu lange, wird es markiert","Karten lassen sich in die nächste Spalte ziehen"]},
    {v:"auftraege",tun:()=>tourVg("demo-v6"),vg:true,ziel:".vp",t:"Ein Auftrag im Detail",x:"Familie Hoffmann – Außensteckdose Terrasse.",d:["Verlauf: wer hat wann was gemacht","Zuständig, Termin, Notizen und Fotos","Mit dem Termin wird daraus eine Baustelle"]},
    {v:"auftraege",ziel:"#fab",t:"Neuer Vorgang",x:"Ein Anruf kommt rein: hier tippen, Kunde und Anliegen eintragen, fertig.",d:["Die Telefonnummer schlägt den Kunden vor","Das Büro bekommt die Anfrage und erteilt den Auftrag"]},
    {v:"auftraege",ziel:".ml-chip",t:"Rahmenaufträge und Meldungen",x:"Für Industriekunden: ein Rahmenauftrag fürs Jahr, darunter jede kleine Meldung.",d:["Wer hat gemeldet – Haustechnik, Schichtleitung, Dienstleister","Bauteil, Ebene und Maschine","Ergebnis, Zeit und Material – auch „kein Befund“"]},
    {v:"auftraege",tun:()=>tourMeldung("demo-m2"),auf:true,ziel:"#dlg .dlg, #dlg",t:"Eine Meldung",x:"Kunststoffwerk Nordhang: Störung an der Spritzgießmaschine in H1.",d:["Ort per Antippen: Bauteil H, Level 1 – kurz „H1“","Maschine M-17.1 aus der Anlagenliste des Kunden","Zuständig, noch zu tun, mitbringen – oder „aus dem Lager“"]},
    {v:"kunden",ziel:"#res, .search",t:"Kunden",x:"Alle Kunden aller Apps an einer Stelle.",d:["Suchen nach Name, Ort oder Ansprechpartner","Privat, Gewerbe oder Industrie – danach richtet sich, was angeboten wird"]},
    {v:"kunde",id:"demo-k6",ziel:".infok2",t:"Privatkunde",x:"Jonas Kessler – Einfamilienhaus mit Wärmepumpe, Wallbox und PV.",d:["Anrufen, E-Mail und Route mit einem Tipp","Dokumente, Fotos und Prüfungen des Hauses","Gebäude mit Etagen und Netzwerk aus dem E-Check"]},
    {v:"kunde",id:"demo-k7",ziel:".infok2",t:"Industriekunde",x:"Kunststoffwerk Nordhang – zwei Standorte, viele Maschinen.",d:["Ansprechpartner mit Rolle: Haustechnik, Einkauf","Melder für den Rahmenauftrag","Standorte: Werk Rommelsdorf und Lager Elsenroth"]},
    {v:"kunde",id:"demo-k7",ziel:'[data-act="anAuf"]',t:"Anlagen",x:"Gebäude, Verteiler und Maschinen des Kunden – je Standort getrennt.",d:["Bauteile und Ebenen mit Kürzel wie bei Merten: H1, A0","Fällige Prüfungen auf einen Blick"]},
    {v:"anl",id:"demo-s7",tun:()=>tourAnTab("masch"),ziel:"#anRes, .an-seite",t:"Maschinen",x:"Werk Rommelsdorf: jede Maschine mit Nummer, Ort und Prüffrist.",d:["Nach Bauteil und Ebene sortiert","Prüffrist: grün, bald fällig, überfällig","Suchen nach Nummer oder Bezeichnung"]},
    {v:"anl",id:"demo-s7",tun:()=>tourAnTab("vt"),ziel:".an-baum, #res",t:"Verteiler",x:"Von der Hauptverteilung bis zum Steuerschrank.",d:["HV → UV-H1-03 → Steuerschrank SGM 4711","Jeder Verteiler mit Einspeisung und Abgang","Wie viele Maschinen dranhängen"]},
    {v:"masch",id:"demo-an1",ziel:".an-weg",t:"Eine Maschine",x:"M-17.1 Spritzgießmaschine – woher kommt der Strom?",d:["Versorgungsweg: Verteiler › Abgang › Maschine","Absicherung und Zuleitung","Stammdaten: Hersteller, Typ, Baujahr, Leistung"]},
    {v:"masch",id:"demo-an1",ziel:"#app .narrow, #res",t:"Änderungen und Prüfungen",x:"Was wurde an der Maschine geändert, wann wurde sie geprüft?",d:["Änderungsprotokoll mit Grund und Monteur","Prüfungen mit Ergebnis und nächster Frist","Dokumente landen im Kundenordner unter Standort › Maschine"]},
    {v:"anl",id:"demo-s8",tun:()=>tourAnTab("masch"),ziel:"#anRes, .an-seite",t:"Zweiter Standort",x:"Lager Elsenroth – hier gibt es auch eine „M-17.1“: das Hubtor.",d:["Gleiche Nummer, anderer Standort – wird nie vermischt","Auch in der Bibliothek getrennte Ordner"]},
    {v:"meldungen",ziel:".ml-kats, #mlSeite, .ml-wrap",t:"Benachrichtigungen",x:"Was einen selbst betrifft – nach Bereichen sortiert.",d:["Meldungen, Aufträge, Material, Baustellen, Prüfungen, Wünsche","Antippen führt direkt hin","Am PC links die Bereiche, rechts die Liste"]},
    {v:"bibliothek",ziel:".bib-kopf, #res",t:"Bibliothek",x:"Alle Dokumente, Fotos und Protokolle – sortiert nach Kunde.",d:["Feste Ordner: Angebote, Pläne, Prüfprotokolle, Fotos …","Echtes SharePoint – im Büro genauso im Explorer","Vorschaubilder der PDFs"]},
    {v:"uebersicht",ziel:"#res, #app .narrow",t:"Statistik",x:"Wie läuft es? Aufträge, Prüfungen und Baustellen in Zahlen.",d:["Je Woche und Monat","Nur für Chef und Büro"]},
    {v:"geraete",ziel:"#res, #app .narrow",t:"Messgeräte",x:"Unsere Prüfgeräte mit Kalibrierung.",d:["Wann muss welches Gerät zur Kalibrierung","Wird in den Prüfprotokollen automatisch eingetragen"]},
    {v:"start",ziel:"#avBtn:not([hidden]), .sf-ich",t:"Konto und Einstellungen",x:"Name, Profilbild, Abgleich und Textgröße.",d:["Chef und Büro verwalten Mitarbeiter und Rechte","„Wünsche und Feedback“ – jeder kann Ideen eintragen und abstimmen"]},
    {kap:true,t:"Übersicht – fertig",x:"Weiter mit der Baustellen-App – der App für jeden Tag draußen."}],
  baustelle:[
    {kap:true,t:"Baustelle",x:"Die App für den Alltag draußen – vom Handy aus, auch ohne Netz.",d:["Baustellen mit Übergaben und Fotos","Material direkt ans Büro","Notizen, Checklisten und Skizzen"]},
    {v:"start",ziel:"#navbar",t:"Die Bereiche",x:"Baustellen, Aufträge, Notizen, Material, Kunden und Bibliothek."},
    {v:"start",ziel:"#res, #app .narrow",t:"Laufende Baustellen",x:"Alle Baustellen mit dem letzten Stand.",d:["Wer war zuletzt dort, was ist offen","Antippen öffnet die Baustelle"]},
    {v:"baustelle",id:"demo-b1",ziel:".infok2, #app .narrow",t:"Eine Baustelle",x:"Neubau Einfamilienhaus, Familie Hoffmann.",d:["Adresse mit Route, Ansprechpartner, Schlüssel","Auftragsnummer und Kunde","Dokumente und Pläne aus der Bibliothek"]},
    {v:"baustelle",id:"demo-b1",ziel:".ek-z",t:"Übergaben",x:"Jeden Tag kurz festhalten, was gemacht wurde.",d:["Wer war dabei – die Kürzel neben dem Datum","Der neueste Stand steht oben"]},
    {v:"baustelle",id:"demo-b1",tun:()=>{ try{ const e=DB.eintraege.get("demo-e1"); if(e&&typeof ekZeigen==="function") ekZeigen(e); }catch(_){} },auf:true,ziel:"#dlg .dlg, #dlg",t:"Eine Übergabe",x:"Leerrohre im OG verlegt, Dosen gesetzt.",d:["Stand: was gemacht wurde","Offen: was der nächste Kollege wissen muss","Material für morgen und Fotos"]},
    {v:"baustelle",id:"demo-b1",ziel:'[data-act="neuerEintrag"]',t:"Neue Übergabe",x:"Ein Tipp, drei Felder – in zwei Minuten erledigt.",d:["Fehlendes Material geht automatisch als Anforderung ans Büro","Fotos aus der Kamera oder Galerie","Der nächste Kollege weiß sofort Bescheid"]},
    {v:"notizen",ziel:"#res, #app .narrow",t:"Notizen",x:"Eigene Notizen, Checklisten, Skizzen und Fotos.",d:["Privat, mit Kollegen oder der ganzen Firma geteilt","Planungstafel für die Woche","Skizzen mit dem Stift auf dem iPad"]},
    {v:"material",ziel:"#res, #app .narrow",t:"Material",x:"Alle Anforderungen mit Stand.",d:["angefordert → bestellt → da","Zu welcher Baustelle es gehört"]},
    {v:"auftraege",ziel:"#res, #app .narrow",t:"Aufträge",x:"Dieselben Aufträge wie in der Übersicht.",d:["Mit Termin wird daraus eine Baustelle","Ist die Baustelle fertig, ist der Auftrag erledigt"]},
    {kap:true,t:"Baustelle – fertig",x:"Weiter mit EVSE, den Wallbox-Prüfungen."}],
  evse:[
    {kap:true,t:"EVSE – Wallbox-Prüfung",x:"Prüfprotokolle für Ladeeinrichtungen – Schritt für Schritt geführt.",d:["DIN VDE 0100-600 und 0100-722","Messwerte mit Grenzwerten","Am Ende ein fertiges PDF für den Kunden"]},
    {v:"start",ziel:"#navbar",t:"Die Bereiche",x:"Start, Kunden, Prüfungen, Fällig, Katalog und Bibliothek."},
    {v:"pruefungen",ziel:"#res",t:"Prüfungen",x:"Alle Prüfungen mit Stand.",d:["In Arbeit, mit Mängeln, fertig","Filter nach Prüfart und Prüfer"]},
    {v:"pruefungen",tun:()=>{ if(typeof oeffne==="function") oeffne("demo-p6"); },ziel:"#app .narrow, #app",t:"Eine Prüfung",x:"Wallbox in der Garage von Jonas Kessler – Erstprüfung.",d:["Prüfer, Messgerät und Adapter sind vorbelegt","Die Daten der Wallbox kommen aus dem Katalog","Mehrere Ladepunkte je Prüfung möglich"]},
    {v:"pruefungen",tun:()=>{ if(typeof oeffne==="function"){ oeffne("demo-p6"); go({v:"saeule",si:0,st:"lp0"}); } },ziel:"#app .narrow, #app",t:"Messen",x:"Jeder Messwert mit Sollwert – grün heißt im Grenzwert.",d:["Schutzleiter, Isolation, Schleifenimpedanz, RCD","Zs zulässig wird aus der Absicherung berechnet","Fehlersimulation mit dem FEV300"]},
    {v:"pruefungen",ziel:"#fab",t:"Neue Prüfung",x:"Kunde, Standort, Wallbox wählen – los geht’s.",d:["Wiederholungsprüfung: alte Prüfung lange drücken","Werte der letzten Prüfung als Vergleich"]},
    {v:"faellig",ziel:"#res, #app .narrow",t:"Fällige Prüfungen",x:"Welche Wallboxen wieder geprüft werden müssen.",d:["Nach Fälligkeit sortiert","Das Büro macht daraus direkt einen Auftrag"]},
    {v:"katalog",ziel:"#res, #app .narrow",t:"Wallbox-Katalog",x:"Typen mit Datenblatt, Leistung und Schutzeinrichtung.",d:["Einmal angelegt, bei jeder Prüfung wieder da","Gerätesuche über die Seriennummer"]},
    {v:"bibliothek",ziel:".bib-kopf, #res",t:"Protokolle",x:"Fertige Protokolle liegen als PDF im Kundenordner.",d:["Unter „Prüfprotokolle“","Gehen automatisch an info@ zur Rechnung"]},
    {kap:true,t:"EVSE – fertig",x:"Zum Schluss der E-Check."}],
  echeck:[
    {kap:true,t:"E-Check",x:"Anlagen, Geräte und Netzwerk prüfen – mit Gebäudeaufbau und Protokoll.",d:["Installation nach DIN VDE 0100-600 / 0105-100","Ortsveränderliche Geräte nach DIN VDE 0701-0702","Netzwerkverkabelung"]},
    {v:"anlagen",ziel:"#navbar",t:"Die Bereiche",x:"Installation, Geräte, Netzwerk, Kunden und Bibliothek."},
    {v:"anlagen",ziel:"#res, #app .narrow",t:"Installationsprüfung",x:"Alle Prüfungen der Elektroanlage.",d:["Mit Stand und nächster Frist","Antippen öffnet die Prüfung"]},
    {v:"ec",id:"demo-ec-anl",tab:"auftrag",ziel:"#app .narrow, #res",t:"Haus Kessler",x:"E-Check des Einfamilienhauses – Schritt für Schritt von links nach rechts.",d:["Auftrag, Gebäude, Besichtigung, Messen, Abschluss","Oben der Fortschritt: Stromkreise, Messpunkte, Mängel","Messgerät mit Kalibrierung ist vorbelegt"]},
    {v:"ec",id:"demo-ec-anl",tab:"gebaeude",ziel:"#app .narrow, #res",t:"Das Gebäude",x:"Etagen, Räume, Verteiler und Stromkreise.",d:["Einmal erfasst – bei der nächsten Prüfung wieder da","Dasselbe Gebäude wie unter „Anlagen“ in der Übersicht"]},
    {v:"ec",id:"demo-ec-anl",tab:"messen",ziel:"#app .narrow, #res",t:"Messen",x:"Je Stromkreis die Messwerte – mit Grenzwert.",d:["RCD, Schleifenimpedanz, Isolation","Mängel direkt mit Foto","Am Ende das Protokoll als PDF"]},
    {v:"netzwerk",ziel:"#res, #app .narrow",t:"Netzwerkprüfung",x:"Datenverkabelung qualifizieren – Schrank, Patchfeld, Dosen.",d:["Messung z. B. mit dem SignalTEK NT","Ergebnis je Link mit Länge und Klasse"]},
    {v:"ec",id:"demo-ec-netz",tab:"infra",ziel:"#app .narrow, #res",t:"Infrastruktur",x:"Netzwerkschrank mit Patchfeld und allen Dosen im Haus Kessler.",d:["Jede Dose mit Raum und Port","Fehler sofort sichtbar – z. B. Schlafzimmer und Terrasse","Beschriftung für den Etikettendrucker"]},
    {v:"geraete",ziel:"#res, #app .narrow",t:"Geräteprüfung",x:"Ortsveränderliche Geräte mit Schutzklasse, Messwerten und Frist."},
    {kap:true,t:"Das war’s",x:"Fragen? Alles, was hier gezeigt wurde, funktioniert am Handy, iPad und PC – mit demselben Firmenkonto.",d:["Ideen und Wünsche: Einstellungen › Wünsche und Feedback"]}]};

let TOUR=null;
/* Nur auf iPad und PC (ab iPad-Breite) – auf dem Handy ist dafür kein Platz und keiner präsentiert vom Handy */
const tourMoeglich=()=>matchMedia("(min-width:744px)").matches;
const tourMerk=()=>{ try{ if(TOUR) sessionStorage.setItem(TOUR_SK,JSON.stringify({app:TOUR.app,i:TOUR.i})); else sessionStorage.removeItem(TOUR_SK); }catch(e){} };
let tourPulsT=null;
const tourPuls=an=>{ clearInterval(tourPulsT); const p=()=>{ try{ localStorage.setItem(TOUR_PULS,String(Date.now())); }catch(e){} }; if(an){ p(); tourPulsT=setInterval(p,4000); } else { try{ localStorage.removeItem(TOUR_PULS); }catch(e){} } };
/* Beispieldaten einschalten (nur dieses Gerät); neu=true: frische Präsentation ⇒ „Nur Beispieldaten“ an */
function tourDemoAn(neu){ try{ if(neu) localStorage.setItem("irrgang_nur_demo","1"); if(typeof demoAn==="function"&&!demoAn()&&typeof demoUmschalten==="function") demoUmschalten(true); else if(typeof render==="function") render(); }catch(e){} }
function tourStart(app,ab,neu){ const L=TOURS[app||TOUR_APP]; if(!L||!L.length) return; if(!tourMoeglich()){ if(typeof toast==="function") toast("Den Präsentationsmodus gibt es auf iPad und PC"); return; }
  if(typeof closeOverlays==="function") closeOverlays(); tourDemoAn(neu);
  TOUR={app:app||TOUR_APP,i:Math.max(0,Math.min(ab||0,L.length-1))}; tourMerk(); tourPuls(true);
  document.body.classList.add("tour-an"); if(!document.getElementById("tourLayer")) document.body.insertAdjacentHTML("beforeend",`<div id="tourLayer" aria-live="polite"><div id="tourSpot"></div><div id="tourBox" role="dialog" aria-label="Präsentation"></div></div>`);
  document.getElementById("tourLayer").style.display=""; tourWisch(); tourFab(); setTimeout(tourZeig,250); }
/* Beenden: Beispieldaten wieder entfernen (lädt die App neu) */
function tourEnde(){ TOUR=null; tourMerk(); tourPuls(false); document.body.classList.remove("tour-an","tour-pause"); document.getElementById("tourLayer")?.remove(); document.getElementById("tourFab")?.remove(); tourMenuZu();
  try{ localStorage.setItem("irrgang_nur_demo","0"); }catch(e){}
  if(typeof demoAn==="function"&&demoAn()){ if(typeof toast==="function") toast("Präsentation beendet – Beispieldaten werden entfernt"); setTimeout(()=>demoUmschalten(false),600); } else if(typeof render==="function") render(); }
/* ---- Schwebender Knopf: pausieren (frei zeigen und erklären), fortsetzen, springen, beenden ---- */
const TOUR_IC={play:"M8 5v14l11-7z",pause:"M6 19h4V5H6v14zm8-14v14h4V5h-4z",zur:"M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z",vor:"M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"};
const tourSvg=k=>`<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="${TOUR_IC[k]}"/></svg>`;
/* Das iPad wird auf die Tafel gespiegelt – alle sehen, was auf dem iPad ist. Darum während der Präsentation KEIN schwebender Knopf:
   gesteuert wird über die Karte (Weiter/Zurück, Wischen), einen Bluetooth-Klicker oder lange auf den Kartenkopf drücken (Menü).
   Nur in der Pause bleibt ein kleiner runder Knopf zum Zurückkehren (lange drücken = Menü, verschiebbar). */
function tourFab(){ if(!TOUR) return; let f=document.getElementById("tourFab");
  if(!TOUR.pause){ f?.remove(); return; }
  if(!f){ document.body.insertAdjacentHTML("beforeend",`<button type="button" id="tourFab" aria-label="Präsentation steuern"></button>`); f=document.getElementById("tourFab");
    let pos=null; try{ pos=JSON.parse(localStorage.getItem("irrgang_tour_fab")||"null"); }catch(e){}
    const setz=(x,y)=>{ const w=f.offsetWidth||160, h=f.offsetHeight||48; f.style.left=Math.max(8,Math.min(innerWidth-w-8,x))+"px"; f.style.top=Math.max(8,Math.min(innerHeight-h-8,y))+"px"; };
    requestAnimationFrame(()=>setz(pos?pos.x*innerWidth:16,pos?pos.y*innerHeight:innerHeight-(f.offsetHeight||52)-16)); /* Standard: unten links */
    let zug=null, lang=null; f.addEventListener("pointerdown",e=>{ zug={x:e.clientX,y:e.clientY,l:f.offsetLeft,t:f.offsetTop,weit:false}; f.setPointerCapture(e.pointerId); clearTimeout(lang); lang=setTimeout(()=>{ if(zug&&!zug.weit){ zug.lang=true; tourLang=Date.now(); tourMenu(f); } },550); });
    f.addEventListener("pointermove",e=>{ if(!zug) return; const dx=e.clientX-zug.x, dy=e.clientY-zug.y; if(Math.hypot(dx,dy)>6){ zug.weit=true; clearTimeout(lang); } if(zug.weit){ setz(zug.l+dx,zug.t+dy); tourMenuZu(); } });
    f.addEventListener("pointerup",()=>{ clearTimeout(lang); if(!zug) return; const weit=zug.weit, lg=zug.lang; zug=null; if(lg){ f.dataset.gezogen="1"; setTimeout(()=>delete f.dataset.gezogen,50); return; } if(weit){ try{ localStorage.setItem("irrgang_tour_fab",JSON.stringify({x:f.offsetLeft/innerWidth,y:f.offsetTop/innerHeight})); }catch(e){} f.dataset.gezogen="1"; setTimeout(()=>delete f.dataset.gezogen,50); } }); }
  f.classList.add("pause"); f.setAttribute("aria-label","Präsentation fortsetzen – lange drücken für das Menü"); f.innerHTML=tourSvg("play"); }
function tourMenuZu(){ document.getElementById("tourMenu")?.remove(); }
function tourMenu(anker){ if(!TOUR) return; if(document.getElementById("tourMenu")){ tourMenuZu(); return; } const f=anker||document.getElementById("tourFab")||document.getElementById("tourBox"), L=TOURS[TOUR.app], nd=typeof nurDemo==="function"&&nurDemo();
  document.body.insertAdjacentHTML("beforeend",`<div id="tourMenu" role="menu">
    <button class="tm-i haupt" data-tour="${TOUR.pause?"weiterspielen":"pause"}">${tourSvg(TOUR.pause?"play":"pause")}<span>${TOUR.pause?"Präsentation fortsetzen":"Pausieren – frei zeigen"}</span></button>
    <div class="tm-reihe"><button class="tm-i" data-tour="zurueck" ${TOUR.i?"":"disabled"}>${tourSvg("zur")}Zurück</button><button class="tm-i" data-tour="weiter">Weiter${tourSvg("vor")}</button></div>
    <div class="tm-l">${esc(TOUR_NAME[TOUR.app])} – Schritt wählen</div><div class="tm-schritte">${L.map((s,k)=>`<button class="tm-s${k===TOUR.i?" an":""}${s.kap?" kap":""}" data-tour="geh" data-v="${k}"><b>${k+1}</b><span>${esc(s.t)}</span></button>`).join("")}</div>
    <div class="tm-l">Andere App</div><div class="tm-apps">${TOUR_FOLGE.map(a=>`<button class="tm-a${a===TOUR.app?" an":""}" data-tour="${a===TOUR.app?"geh":"app"}" data-v="${a===TOUR.app?0:a}">${esc(TOUR_NAME[a])}</button>`).join("")}</div>
    <button class="tm-i" data-tour="nurdemo"><span>Nur Beispieldaten</span><span class="schalter${nd?" an":""}" aria-hidden="true"><i></i></span></button>
    <button class="tm-i weg" data-tour="ende"><span>Präsentation beenden</span></button></div>`);
  const m=document.getElementById("tourMenu"), r=f.getBoundingClientRect(), w=m.offsetWidth, h=m.offsetHeight;
  m.style.left=Math.max(8,Math.min(innerWidth-w-8,r.left))+"px"; m.style.top=(r.top-h-8>8?r.top-h-8:Math.max(8,Math.min(innerHeight-h-8,r.bottom+8)))+"px";
  m.querySelector(".tm-s.an")?.scrollIntoView({block:"center"}); }
function tourPause(an){ if(!TOUR) return; TOUR.pause=an; const l=document.getElementById("tourLayer"); if(l) l.style.display=an?"none":""; document.body.classList.toggle("tour-pause",an); tourMenuZu(); tourFab(); if(!an) tourZeig(); }
function tourSicht(el){ if(!el) return false; const r=el.getBoundingClientRect(), st=getComputedStyle(el); return r.width>4&&r.height>4&&st.visibility!=="hidden"&&st.display!=="none"&&!el.closest("[hidden]"); }
function tourZiel(sel){ if(!sel) return null; for(const s of sel.split(/\s*,\s*/)){ const el=[...document.querySelectorAll(s)].find(tourSicht); if(el) return el; } return null; }
let tourVorher=null;
async function tourZeig(){ try{ await tourZeig2(); }catch(e){ console.warn("Präsentation:",e&&e.stack||e); } }
async function tourZeig2(){ if(!TOUR) return; const L=TOURS[TOUR.app], s=L[TOUR.i];
  /* Was der letzte Schritt geöffnet hat, wieder zu */
  if(tourVorher&&tourVorher!==s){ if(tourVorher.auf&&typeof closeOverlays==="function") closeOverlays(); }
  if(!s.vg){ try{ if(typeof VG_SEL!=="undefined"&&VG_SEL){ VG_SEL=null; if(nav.v==="auftraege"&&!s.tun) render(); } }catch(e){} }
  tourVorher=s;
  /* Seite wechseln, falls der Schritt woanders spielt */
  let z=s.vor?s.vor():null; if(!z&&s.v) z={v:s.v,...(s.id?{id:s.id}:{}),...(s.tab?{tab:s.tab}:{})};
  if(z&&typeof go==="function"){ const DET=["kunde","baustelle","anl","masch"]; if(DET.includes(z.v)&&!z.id){ const k=(typeof live==="function"?live("kunden"):[])[0]; if(z.v==="kunde"&&k) z.id=k.id; }
    if(!DET.includes(z.v)||z.id){ if(Object.keys(z).some(k=>nav[k]!==z[k])){ go(z); scrollTo(0,0); } else if(s.tun) go(z); } }
  if(s.tun){ try{ s.tun(); }catch(e){ console.warn("Präsentation:",e); } await new Promise(r=>setTimeout(r,450)); if(typeof render==="function"&&s.v==="anl") render(); }
  let el=null; for(let n=0;n<15&&s.ziel&&!s.kap&&!(el=tourZiel(s.ziel));n++) await new Promise(r=>setTimeout(r,100));
  if(!TOUR||TOURS[TOUR.app][TOUR.i]!==s)return;
  if(el){ const r=el.getBoundingClientRect(), H=innerHeight; /* große Bereiche: nur scrollen, wenn ihr Anfang nicht zu sehen ist */
    if(r.height>H*.6){ if(r.top<0||r.top>H*.45) scrollBy({top:r.top-90,behavior:"smooth"}); }
    else if(r.top<70||r.bottom>H-20) el.scrollIntoView({block:"center",behavior:"smooth"});
    await new Promise(r=>setTimeout(r,360)); }
  tourMale(el,s); }
/* Platz für die Karte: rechts, links, unten, oben – sonst unten in die Ecke über das Ziel */
function tourPlatz(x,y,w,h,bw,bh,W,H){ const g=20, rand=16, c=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  const opt=[["r",W-(x+w)-g-rand>=bw,()=>({left:x+w+g,top:c(y+h/2-bh/2,rand,H-bh-rand)})],["l",x-g-rand>=bw,()=>({left:x-g-bw,top:c(y+h/2-bh/2,rand,H-bh-rand)})],
    ["u",H-(y+h)-g-rand>=bh,()=>({left:c(x+w/2-bw/2,rand,W-bw-rand),top:y+h+g})],["o",y-g-rand>=bh,()=>({left:c(x+w/2-bw/2,rand,W-bw-rand),top:y-g-bh})]];
  /* breite Ziele lieber darunter/darüber, hohe lieber daneben */
  const reihe=w>W*.55?["u","o","r","l"]:["r","l","u","o"];
  for(const k of reihe){ const o=opt.find(x=>x[0]===k); if(o[1]) return o[2](); }
  return {left:W-bw-rand,top:c(H/2-bh/2,rand,H-bh-rand),dock:true}; /* kein Platz: Karte rechts andocken, Hervorhebung wird links davon gekürzt */ }
function tourMale(el,s){ const sp=document.getElementById("tourSpot"), bx=document.getElementById("tourBox"), ly=document.getElementById("tourLayer"); if(!sp||!bx||!TOUR) return; const L=TOURS[TOUR.app], i=TOUR.i, letzte=i===L.length-1;
  const naechste=TOUR_FOLGE[TOUR_FOLGE.indexOf(TOUR.app)+1], kap=!!s.kap||!el;
  const knopf=letzte?(naechste?`<button class="tb-w" data-tour="app" data-v="${naechste}">Weiter: ${esc(TOUR_NAME[naechste])}${tourSvg("vor")}</button>`:`<button class="tb-w" data-tour="ende">Präsentation beenden</button>`):`<button class="tb-w" data-tour="weiter">Weiter${tourSvg("vor")}</button>`;
  const punkte=s.d&&s.d.length?`<ul class="tb-d">${s.d.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:"";
  bx.className=kap?"kap":""; ly.classList.toggle("kap",kap);
  bx.innerHTML=`<div class="tb-k"><span class="tb-app">${esc(TOUR_NAME[TOUR.app])}</span><span class="tb-n">${i+1} / ${L.length}</span><button class="tb-zu" data-tour="pause" aria-label="Pause – frei zeigen" title="Pause (P)">${tourSvg("pause")}</button></div>
    <h3>${esc(s.t)}</h3>${s.x?`<p>${esc(s.x)}</p>`:""}${punkte}
    <div class="tb-bar"><i style="width:${Math.round((i+1)/L.length*100)}%"></i></div>
    <div class="tb-f">${i?`<button class="tb-z" data-tour="zurueck" aria-label="Zurück">${tourSvg("zur")}</button>`:""}<span style="flex:1"></span>${knopf}</div>`;
  const W=innerWidth, H=innerHeight;
  if(!kap){ const r=el.getBoundingClientRect(), p=10, x=Math.max(6,r.left-p), y=Math.max(6,r.top-p), w=Math.min(W-12,r.width+2*p), h=Math.min(H-12,r.height+2*p);
    Object.assign(sp.style,{left:x+"px",top:y+"px",width:w+"px",height:h+"px",opacity:1}); sp.classList.remove("leer"); sp.classList.remove("puls"); void sp.offsetWidth; sp.classList.add("puls");
    const bw=Math.min(Math.max(380,W*.34),560,W-32); bx.style.width=bw+"px"; bx.style.transform="none"; const bh=bx.offsetHeight;
    const pos=tourPlatz(x,y,w,h,bw,bh,W,H); Object.assign(bx.style,{left:pos.left+"px",top:pos.top+"px"});
    if(pos.dock&&x+w>pos.left-18&&pos.left-18-x>=220) sp.style.width=(pos.left-18-x)+"px"; }
  else { Object.assign(sp.style,{left:W/2+"px",top:H/2+"px",width:"0px",height:"0px",opacity:1}); sp.classList.add("leer");
    const bw=Math.min(760,W-48); bx.style.width=bw+"px"; Object.assign(bx.style,{left:"50%",top:"50%",transform:"translate(-50%,-50%)"}); }
  if(document.activeElement&&document.activeElement.blur) document.activeElement.blur(); }
function tourSchritt(d){ if(!TOUR) return; const L=TOURS[TOUR.app], n=TOUR.i+d; if(n<0) return; if(n>=L.length){ const nx=TOUR_FOLGE[TOUR_FOLGE.indexOf(TOUR.app)+1]; if(nx) tourApp(nx); else tourEnde(); return; } TOUR.i=n; tourMerk(); if(TOUR.pause) tourPause(false); else { tourFab(); tourZeig(); } }
function tourApp(app){ if(app===TOUR_APP){ if(TOUR){ TOUR.i=0; tourMerk(); tourFab(); tourZeig(); } else tourStart(app,0,true); return; }
  try{ sessionStorage.setItem(TOUR_SK,JSON.stringify({app,i:0})); }catch(e){} if(!TOUR) tourDemoAn(true);
  const pfad={uebersicht:"uebersicht",evse:"evse",baustelle:"baustelle",echeck:"echeck"}[app]; location.href=`../${pfad}/?tour=${app}`; }
/* Wischen auf der Karte (iPad): links = weiter, rechts = zurück. tourLang: Zeitpunkt des letzten langen Drückens – der Klick danach darf das Menü nicht gleich wieder schließen */
let tourLang=0;
function tourWisch(){ const l=document.getElementById("tourLayer"); if(!l||l.dataset.w) return; l.dataset.w="1"; let st=null;
  let lang=null;
  l.addEventListener("pointerdown",e=>{ st={x:e.clientX,y:e.clientY}; clearTimeout(lang); const k=e.target.closest&&e.target.closest(".tb-k"); if(k&&!e.target.closest("button")) lang=setTimeout(()=>{ st=null; tourLang=Date.now(); tourMenu(k); },550); });
  l.addEventListener("pointermove",e=>{ if(st&&Math.hypot(e.clientX-st.x,e.clientY-st.y)>8) clearTimeout(lang); });
  l.addEventListener("pointercancel",()=>clearTimeout(lang));
  l.addEventListener("pointerup",e=>{ clearTimeout(lang); if(!st||!TOUR||TOUR.pause) return; const dx=e.clientX-st.x, dy=e.clientY-st.y; st=null; if(Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)*1.5) tourSchritt(dx<0?1:-1); }); }
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest("[data-tour]"); if(b){ e.stopImmediatePropagation(); e.preventDefault(); const a=b.dataset.tour;
    if(a==="weiter"){ tourMenuZu(); tourSchritt(1); } else if(a==="zurueck"){ tourMenuZu(); tourSchritt(-1); } else if(a==="ende") tourEnde(); else if(a==="app"){ tourMenuZu(); tourApp(b.dataset.v); }
    else if(a==="pause") tourPause(true); else if(a==="weiterspielen") tourPause(false);
    else if(a==="geh"&&TOUR){ tourMenuZu(); TOUR.i=+b.dataset.v; tourMerk(); if(TOUR.pause) tourPause(false); else { tourFab(); tourZeig(); } }
    else if(a==="nurdemo"){ const an=!(typeof nurDemo==="function"&&nurDemo()); if(typeof nurDemoSetzen==="function") nurDemoSetzen(an); const s=b.querySelector(".schalter"); if(s) s.classList.toggle("an",an); if(TOUR&&!TOUR.pause) setTimeout(tourZeig,200); }
    else if(a==="start"){ if(typeof closeOverlays==="function") closeOverlays(); const app=b.dataset.v||TOUR_APP; if(app===TOUR_APP) tourStart(app,0,true); else tourApp(app); } return; }
  const fab=e.target.closest&&e.target.closest("#tourFab"); if(fab){ e.stopImmediatePropagation(); e.preventDefault(); if(!fab.dataset.gezogen) tourPause(false); return; }
  if(Date.now()-tourLang<900){ e.stopImmediatePropagation(); e.preventDefault(); return; }
  if(document.getElementById("tourMenu")&&!(e.target.closest&&e.target.closest("#tourMenu"))) tourMenuZu();
  if(TOUR&&!TOUR.pause&&e.target.closest&&e.target.closest("#tourLayer")){ e.stopImmediatePropagation(); e.preventDefault(); } },true);
document.addEventListener("keydown",e=>{ if(!TOUR) return; const k=e.key, tippt=e.target&&/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
  /* Klicker (Bluetooth, am iPad als Tastatur): Bild ab/auf = weiter/zurück, „Bildschirm schwarz“ (b oder .) und F5 = Pause/weiter */
  if(((["p","P","b","B","."].includes(k))&&!tippt&&!e.ctrlKey&&!e.metaKey)||k==="F5"||(k==="Escape"&&!TOUR.pause)){ e.preventDefault(); e.stopImmediatePropagation(); tourPause(!TOUR.pause); return; }
  if(TOUR.pause){ if(k==="PageDown"||k==="PageUp"){ e.preventDefault(); e.stopImmediatePropagation(); tourPause(false); } return; } /* pausiert: Tastatur gehört der App, nur der Klicker holt zurück */
  if(k==="m"||k==="M"){ e.preventDefault(); tourMenu(); return; }
  if(["ArrowRight","ArrowDown","PageDown"," ","Enter"].includes(k)){ e.preventDefault(); e.stopImmediatePropagation(); tourSchritt(1); }
  else if(["ArrowLeft","ArrowUp","PageUp","Backspace"].includes(k)){ e.preventDefault(); e.stopImmediatePropagation(); tourSchritt(-1); } },true);
addEventListener("resize",()=>{ if(TOUR){ if(!tourMoeglich()){ tourEnde(); return; } tourMenuZu(); if(!TOUR.pause) tourZeig(); } });
/* Nach dem Laden: Sprung aus einer anderen App (?tour=) oder Neuladen mitten in der Präsentation ⇒ weiter.
   Sonst: Beispieldaten noch an, aber nirgends läuft eine Präsentation (Tab geschlossen o. Ä.) ⇒ aufräumen. */
addEventListener("load",()=>{ let q=null, gem=null; try{ q=new URLSearchParams(location.search).get("tour"); gem=JSON.parse(sessionStorage.getItem(TOUR_SK)||"null"); }catch(e){}
  if(q&&TOURS[q]){ history.replaceState(null,"",location.pathname); setTimeout(()=>tourStart(q,gem&&gem.app===q?gem.i:0),1800); return; }
  if(gem&&gem.app===TOUR_APP&&TOURS[gem.app]){ setTimeout(()=>tourStart(gem.app,gem.i),1800); return; }
  setTimeout(()=>{ try{ if(TOUR||typeof demoAn!=="function"||!demoAn()) return; const p=+localStorage.getItem(TOUR_PULS)||0; if(Date.now()-p>15000){ localStorage.setItem("irrgang_nur_demo","0"); demoUmschalten(false); } }catch(e){} },5000); });
/* Zeile im Entwickler-Bereich + Auswahlfenster */
function tourZeile(){ if(!tourMoeglich()) return ""; return `<div class="li" role="button" tabindex="0" data-act="tourWahl"><span class="av">${icon("bulb")}</span><span class="lt"><span class="h">Präsentationsmodus</span><span class="s">Geführte Vorstellung der Apps mit Beispielkunden – für iPad und PC, auch auf der großen Tafel</span></span>${icon("chev")}</div>`; }
function tourWahl(){ const n=a=>TOURS[a].length;
  dialog("Präsentation starten",`<div class="list">${TOUR_FOLGE.map(a=>`<button class="li" data-tour="start" data-v="${a}"><span class="av">${icon("bulb")}</span><span class="lt"><span class="h">${esc(TOUR_NAME[a])}${a==="uebersicht"?" – von vorne":""}</span><span class="s">${n(a)} Schritte${a===TOUR_APP?" · diese App":" · öffnet die App"}</span></span>${icon("chev")}</button>`).join("")}</div>
    <p class="sup" style="margin:14px 4px 0">Gezeigt werden Beispielkunden (Familie Kessler, Kunststoffwerk Nordhang u. a.) – echte Kunden und Aufträge sind währenddessen ausgeblendet, nichts davon wird hochgeladen. Beim Beenden verschwinden die Beispieldaten wieder.</p>
    <p class="sup" style="margin:8px 4px 0">Auf der Tafel ist nur die App mit der Erklärkarte zu sehen – keine Steuerknöpfe. Weiter und zurück: Knöpfe auf der Karte, auf der Karte wischen oder Bluetooth-Klicker (Bild ab/auf). Pause zum freien Zeigen: Pause-Symbol auf der Karte oder Klicker-Taste „Bildschirm schwarz“. Zurück aus der Pause: kleiner runder Knopf unten links oder Klicker. Menü mit Schrittliste, App-Wechsel und Beenden: lange auf den Kopf der Karte drücken (bzw. auf den runden Knopf).</p>`,
    `<span style="flex:1"></span><button class="btn-text" data-act="cancel">Schließen</button>`); }
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act="tourWahl"]'); if(!b) return; e.stopImmediatePropagation(); e.preventDefault(); tourWahl(); },true);
