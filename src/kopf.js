/* iPad/PC: Der Seitenkopf (Zurück, Titel, Knöpfe rechts) sitzt in der festen Kopfleiste statt als zweiter Kopf im Inhalt.
   PC mit Seitenleiste: in derselben Zeile wie Glocke und Profilbild. iPad (Tab-Leiste oben): als zweite Zeile direkt darunter,
   ohne Lücke – beides ist ein Element, scrollender Inhalt kann nicht mehr dazwischen durchscheinen. */
const KOPF_PC=matchMedia("(min-width:1024px) and (hover:hover) and (pointer:fine)"), KOPF_BREIT=matchMedia("(min-width:744px)");
function kopfEinhaengen(){
  const tb=document.getElementById("topbar"), row=tb&&tb.querySelector(".tb-row"); if(!row) return;
  let slot=document.getElementById("tbKopf");
  if(!slot){ slot=document.createElement("div"); slot.id="tbKopf"; slot.className="tb-kopf"; }
  const sk=document.querySelector("#app > .sk, #app > .edk");
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
  /* am PC sitzt der Zurück-Pfeil am linken Rand der Inhaltsfläche – Titel hält Abstand dazu */
  const min=KOPF_PC.matches&&sk.querySelector(".sk-zt")?64:0, links=Math.max(min,a.left-s.left); sk.style.setProperty("margin-left",links+"px","important"); sk.style.setProperty("width",Math.max(0,Math.min(a.width,s.width-links))+"px","important");
}
addEventListener("resize",()=>{ clearTimeout(kopfAusrichten._t); kopfAusrichten._t=setTimeout(()=>{ if(KOPF_BREIT.matches&&!document.getElementById("tbKopf")?.hidden) kopfAusrichten(); },80); });
[KOPF_PC,KOPF_BREIT].forEach(m=>m.addEventListener&&m.addEventListener("change",()=>setTimeout(kopfEinhaengen,0)));
