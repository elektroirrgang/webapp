/* iPad/PC: Der Seitenkopf (Zurück, Titel, Knöpfe rechts) sitzt in der festen Kopfleiste statt als zweiter Kopf im Inhalt.
   PC mit Seitenleiste: in derselben Zeile wie Glocke und Profilbild. iPad (Tab-Leiste oben): als zweite Zeile direkt darunter,
   ohne Lücke – beides ist ein Element, scrollender Inhalt kann nicht mehr dazwischen durchscheinen. */
const KOPF_PC=matchMedia("(min-width:1024px) and (hover:hover) and (pointer:fine)"), KOPF_BREIT=matchMedia("(min-width:744px)");
function kopfEinhaengen(){
  const tb=document.getElementById("topbar"), row=tb&&tb.querySelector(".tb-row"); if(!row) return;
  let slot=document.getElementById("tbKopf");
  if(!slot){ slot=document.createElement("div"); slot.id="tbKopf"; slot.className="tb-kopf"; }
  slSetzen(); const sk=document.querySelector("#app > .sk, #app > .edk");
  slot.textContent="";
  if(!KOPF_BREIT.matches||!sk){ slot.hidden=true; document.body.classList.remove("kopf-oben"); return; }
  slot.appendChild(sk); slot.hidden=false; document.body.classList.add("kopf-oben");
  if(KOPF_PC.matches){ slot.classList.add("pc"); if(slot.parentNode!==row) row.insertBefore(slot,row.firstChild); }
  else { slot.classList.remove("pc"); if(slot.parentNode!==tb||slot.previousElementSibling!==row) row.after(slot); }
  kopfAusrichten();
}
/* Kopf bündig mit der Inhaltsspalte */
function kopfAusrichten(){
  const slot=document.getElementById("tbKopf"), sk=slot&&slot.querySelector(".sk, .edk"); if(!sk||slot.hidden) return;
  const n=document.querySelector("#app > .narrow, #app > .wrap, #app > div:not(.edk-platz)"); sk.style.removeProperty("margin-left"); sk.style.removeProperty("width");
  if(!n) return; const a=n.getBoundingClientRect(), s=slot.getBoundingClientRect(); if(!a.width) return;
  const links=Math.max(0,a.left-s.left); sk.style.setProperty("margin-left",links+"px","important"); sk.style.setProperty("width",Math.max(0,Math.min(a.width,s.width-links))+"px","important");
}
addEventListener("resize",()=>{ clearTimeout(kopfAusrichten._t); kopfAusrichten._t=setTimeout(()=>{ if(KOPF_BREIT.matches&&!document.getElementById("tbKopf")?.hidden) kopfAusrichten(); },80); });
[KOPF_PC,KOPF_BREIT].forEach(m=>m.addEventListener&&m.addEventListener("change",()=>setTimeout(kopfEinhaengen,0)));
/* PC: Seitenleiste ganz ausblenden für die volle Bildschirmbreite. Ausblenden über den Knopf in der Leiste,
   zurück über das Hamburger-Menü oben links. Der Browser merkt sich den Zustand (gilt für alle Apps). */
const SL_IC={auf:"M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z",zu:"M3 18h13v-2H3v2zm0-5h10v-2H3v2zm0-7v2h13V6H3zm18 9.59L17.42 12 21 8.41 19.59 7l-5 5 5 5L21 15.59z"};
const slSvg=k=>`<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="${SL_IC[k]}"/></svg>`;
let slZu=false; try{ slZu=localStorage.getItem("irrgang_sl")==="zu"; }catch(e){}
function slSetzen(){
  document.body.classList.toggle("sl-zu",slZu&&KOPF_PC.matches);
  const row=document.querySelector("#topbar .tb-row");
  if(row){ let b=document.getElementById("slAuf"); if(!b){ b=document.createElement("button"); b.id="slAuf"; b.className="icon-btn sl-auf"; b.dataset.act="slUm"; b.setAttribute("aria-label","Seitenleiste einblenden"); b.title="Seitenleiste einblenden"; b.innerHTML=slSvg("auf"); }
    if(row.firstChild!==b) row.insertBefore(b,row.firstChild); }
  const h=document.querySelector("#navbar .nav-head");
  if(h&&!h.querySelector(".sl-zu-btn")){ const b=document.createElement("button"); b.className="icon-btn sl-zu-btn"; b.dataset.act="slUm"; b.setAttribute("aria-label","Seitenleiste ausblenden"); b.title="Seitenleiste ausblenden"; b.innerHTML=slSvg("zu"); h.appendChild(b); }
}
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act="slUm"]'); if(!b) return; e.stopPropagation(); e.preventDefault();
  slZu=!slZu; try{ localStorage.setItem("irrgang_sl",slZu?"zu":"auf"); }catch(_){} slSetzen(); setTimeout(kopfAusrichten,240); },true);
