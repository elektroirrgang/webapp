/* ===== Funktionen für alle (26.11.2026) =====
   Zentrale Schalter, die der Entwickler unter Profil › Entwickler umlegt. Gelten sofort für alle Mitarbeiter in allen vier Apps:
   liegen als Datensatz einstellungen/"funktionen" ({aus:{schluessel:true}}) und werden wie alle Einstellungen über SharePoint verteilt.
   Neue Funktion: Zeile in FN_LISTE ergänzen und an den Stellen, die sie zeigen, fnAn("schluessel") abfragen. */
const FN_LISTE=[
  ["materialanf","Materialanforderungen","Anfordern, Liste und Start-Kachel. „Mitbringen“ im Auftrag bleibt als Text"]];
IC.fnSchalter="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z";
function fnRec(){ return typeof DB!=="undefined"&&DB.einstellungen?DB.einstellungen.get("funktionen"):null; }
function fnAn(k){ const r=fnRec(); return !(r&&!r.deleted&&r.aus&&r.aus[k]); }
function fnSetzen(k,an){ if(!DB.einstellungen) return; const neu=!DB.einstellungen.has("funktionen"), r=DB.einstellungen.get("funktionen")||{id:"funktionen"};
  r.aus=Object.assign({},r.aus); if(an) delete r.aus[k]; else r.aus[k]=true; r.deleted=false; r.geaendertVon=who(); saveRec("einstellungen",r,neu); }
function fnZeile(){ if(!DB.einstellungen) return ""; const aus=FN_LISTE.filter(([k])=>!fnAn(k));
  return `<div class="li" role="button" tabindex="0" data-act="fnAuf"><span class="av">${icon("fnSchalter")}</span><span class="lt"><span class="h">Funktionen für alle</span><span class="s">${esc(aus.length?`Ausgeschaltet: ${aus.map(x=>x[1]).join(", ")}`:"Alles eingeschaltet – hier zentral für alle Mitarbeiter ein- und ausschalten")}</span></span>${icon("chev")}</div>`; }
function fnListeHtml(){ return FN_LISTE.map(([k,t,s])=>{ const an=fnAn(k);
  return `<div class="li" role="switch" tabindex="0" aria-checked="${an}" data-act="fnUm" data-k="${k}"><span class="lt"><span class="h">${esc(t)}</span><span class="s">${esc(s)}</span></span><span class="schalter${an?" an":""}" aria-hidden="true"><i></i></span></div>`; }).join(""); }
function fnDlg(){ dialog("Funktionen für alle",`<p class="sup" style="margin:0 0 12px">Gilt sofort für alle Mitarbeiter – in Übersicht, EVSE, Gebäudetechnik und Baustelle. Ausschalten löscht nichts: Vorhandenes bleibt gespeichert und ist nach dem Einschalten wieder da.</p><div class="list" id="fnL">${fnListeHtml()}</div>`,
  `<span style="flex:1"></span><button class="btn-text" data-act="cancel">Fertig</button>`); }
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act="fnAuf"],[data-act="fnUm"]'); if(!b) return; e.preventDefault(); e.stopPropagation();
  if(typeof istEntwickler==="function"&&!istEntwickler()) return;
  if(b.dataset.act==="fnAuf"){ fnDlg(); return; }
  const k=b.dataset.k, an=!fnAn(k); fnSetzen(k,an); const L=document.getElementById("fnL"); if(L) L.innerHTML=fnListeHtml();
  const t=(FN_LISTE.find(x=>x[0]===k)||[,k])[1]; toast(`${t} ${an?"eingeschaltet":"ausgeschaltet"} – gilt für alle`); try{ render(); }catch(x){} },true);
