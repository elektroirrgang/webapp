/* ===== Standort (Max 13.11.2026) =====
   Beim ersten Start nach der Anmeldung fragt jede Irrgang-App einmal, ob sie den Standort nutzen darf –
   für das Wetter vor Ort, die Messbedingungen im Protokoll und Parkplätze in der Nähe.
   Der Standort wird nur in dem Moment abgefragt, nicht gespeichert und nicht an Kollegen weitergegeben.
   Antwort je Gerät in localStorage "irrgang_standort": "ja" | "nein" (leer = noch nicht gefragt). */
const STD_KEY="irrgang_standort";
const stdWahl=()=>{ try{ return localStorage.getItem(STD_KEY)||""; }catch(e){ return ""; } };
const stdSetzen=v=>{ try{ localStorage.setItem(STD_KEY,v); }catch(e){} };
const standortErlaubt=()=>stdWahl()==="ja"&&!!navigator.geolocation;
let STD_POS=null;
/* Position holen (höchstens alle 10 Minuten neu); null, wenn nicht erlaubt oder nicht verfügbar */
function standortJetzt(){ if(!standortErlaubt()) return Promise.resolve(null);
  if(STD_POS&&Date.now()-STD_POS.t<600000) return Promise.resolve(STD_POS);
  return new Promise(ok=>navigator.geolocation.getCurrentPosition(x=>{ STD_POS={lat:x.coords.latitude,lon:x.coords.longitude,t:Date.now()}; ok(STD_POS); },
    e=>{ if(e&&e.code===1) stdSetzen("nein"); ok(null); },{timeout:8000,maximumAge:600000})); }
function standortFrage(){
  if(typeof dialog!=="function") return;
  dialog("Standort verwenden?",`<p style="margin:0 0 12px">Die Apps nutzen deinen Standort für</p>
    <ul style="margin:0 0 12px;padding-left:20px;line-height:1.6"><li>das Wetter dort, wo du gerade bist,</li><li>die Messbedingungen im Prüfprotokoll (Temperatur, Luftfeuchte),</li><li>Parkplätze in der Nähe des Kunden.</li></ul>
    <p class="sup" style="margin:0">Der Standort wird nur in dem Moment abgefragt, nicht gespeichert und nicht an Kollegen weitergegeben. Du kannst das später in den Einstellungen deines Geräts ändern.</p>`,
    `<button class="btn-text" data-act="stdNein">Nicht jetzt</button><button class="btn-text" data-act="stdJa">Erlauben</button>`);
}
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act="stdJa"],[data-act="stdNein"]'); if(!b) return; e.stopImmediatePropagation(); e.preventDefault();
  if(typeof closeOverlays==="function") closeOverlays();
  if(b.dataset.act==="stdNein"){ stdSetzen("nein"); return; }
  if(!navigator.geolocation){ stdSetzen("nein"); if(typeof toast==="function") toast("Standort ist auf diesem Gerät nicht verfügbar"); return; }
  /* erst jetzt fragt iOS/Android selbst nach der Erlaubnis */
  navigator.geolocation.getCurrentPosition(x=>{ stdSetzen("ja"); STD_POS={lat:x.coords.latitude,lon:x.coords.longitude,t:Date.now()};
      if(typeof toast==="function") toast("Standort erlaubt"); if(typeof META!=="undefined"&&META&&META.wetter) META.wetter.t=0; if(typeof render==="function") render(); },
    err=>{ stdSetzen(err&&err.code===1?"nein":""); if(typeof toast==="function") toast(err&&err.code===1?"Standort nicht erlaubt – Wetter zeigt den Betrieb in Waldbröl":"Standort gerade nicht verfügbar"); },
    {timeout:10000,maximumAge:600000}); },true);
/* einmal nach der Anmeldung fragen – wenn kein anderes Fenster offen ist */
(()=>{ if(stdWahl()) return; let n=0; const t=setInterval(()=>{ n++; if(n>90||stdWahl()){ clearInterval(t); return; }
  const angemeldet=typeof ME!=="undefined"&&ME&&ME.mail, frei=!document.getElementById("dlg")||document.getElementById("dlg").hidden;
  if(!angemeldet||!frei) return; clearInterval(t);
  const fragen=()=>{ if(!stdWahl()) standortFrage(); };
  if(navigator.permissions&&navigator.permissions.query) navigator.permissions.query({name:"geolocation"}).then(s=>{ if(s.state==="granted") stdSetzen("ja"); else if(s.state==="denied") stdSetzen("nein"); else fragen(); }).catch(fragen);
  else fragen(); },2000); })();
