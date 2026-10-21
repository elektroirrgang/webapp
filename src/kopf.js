/* iPad/PC: Der Seitenkopf (Zurück, Titel, Knöpfe rechts) sitzt in der festen Kopfleiste statt als zweiter Kopf im Inhalt.
   PC mit Seitenleiste: in derselben Zeile wie Glocke und Profilbild. iPad (Tab-Leiste oben): als zweite Zeile direkt darunter,
   ohne Lücke – beides ist ein Element, scrollender Inhalt kann nicht mehr dazwischen durchscheinen. */
const KOPF_PC=matchMedia("(min-width:1024px) and (hover:hover) and (pointer:fine)"), KOPF_BREIT=matchMedia("(min-width:744px)");
/* iPad/iPhone (Safari): beim Seitenwechsel blieben Teile der alten Seite stehen (z. B. Bibliothek-Ordner über den Notizen).
   Nach jedem Wechsel des Bereichs die Inhaltsfläche einmal neu zeichnen lassen. */
const KOPF_IOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
let kopfLetzteSeite="";
function kopfNeuZeichnen(){ const a=document.getElementById("app"); if(!a) return; const s=typeof nav!=="undefined"?nav.v+"|"+(nav.id||""):""; if(s===kopfLetzteSeite) return; kopfLetzteSeite=s;
  if(!KOPF_IOS) return; a.style.opacity=".999"; requestAnimationFrame(()=>requestAnimationFrame(()=>{ a.style.opacity=""; })); }
function kopfEinhaengen(){
  kopfNeuZeichnen();
  const tb=document.getElementById("topbar"), row=tb&&tb.querySelector(".tb-row"); if(!row) return;
  let slot=document.getElementById("tbKopf");
  if(!slot){ slot=document.createElement("div"); slot.id="tbKopf"; slot.className="tb-kopf"; }
  if(typeof demoNachfuellen==="function"){ demoMarke(); if(demoNachfuellen()){ setTimeout(()=>render(),0); } }
  kuerzelMarken(); const sk=document.querySelector("#app > .sk, #app > .edk");
  slot.textContent="";
  if(!KOPF_BREIT.matches||!sk){ slot.hidden=true; document.body.classList.remove("kopf-oben"); return; }
  /* iPad (Reiter oben): Seitentitel, der nur den gewählten Reiter wiederholt („Baustellen“ unter dem Reiter „Baustellen“), weglassen.
     Bleiben rechts Knöpfe oder ein Untertitel, bleibt der Kopf ohne Titel stehen; sonst entfällt er ganz. */
  if(!KOPF_PC.matches&&sk.classList.contains("sk")&&!sk.querySelector(".sk-zt")){ const h=sk.querySelector(".sk-t h1"), a=document.querySelector('#navbar [aria-current="page"]');
    const gleich=h&&a&&h.textContent.trim().toLowerCase()===a.textContent.trim().toLowerCase();
    if(gleich){ const rest=sk.querySelector(".sk-t p")||[...sk.children].some(c=>!c.classList.contains("sk-t")&&c.children.length+c.textContent.trim().length>0);
      if(!rest){ sk.remove(); slot.hidden=true; document.body.classList.remove("kopf-oben"); document.body.classList.add("kopf-weg"); return; }
      h.remove(); } }
  document.body.classList.remove("kopf-weg");
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
  const zp=KOPF_PC.matches&&sk.querySelector(".sk-zt"), min=zp?Math.max(0,zp.getBoundingClientRect().right-s.left+12):0, links=Math.max(min,a.left-s.left); sk.style.setProperty("margin-left",links+"px","important"); sk.style.setProperty("width",Math.max(0,Math.min(a.width,s.width-links))+"px","important");
}
addEventListener("resize",()=>{ clearTimeout(kopfAusrichten._t); kopfAusrichten._t=setTimeout(()=>{ if(KOPF_BREIT.matches&&!document.getElementById("tbKopf")?.hidden) kopfAusrichten(); },80); });
[KOPF_PC,KOPF_BREIT].forEach(m=>m.addEventListener&&m.addEventListener("change",()=>setTimeout(kopfEinhaengen,0)));

/* ===== PC: Hinweis-Blasen im App-Stil statt der grauen Browser-Tooltips =====
   Jedes title="…" wird beim Drüberfahren in data-tip umgewandelt und als eigene Blase gezeigt (nach kurzer Pause).
   data-kurz="N" zeigt dazu das Tastenkürzel. */
const TIP_PC=matchMedia("(hover:hover) and (pointer:fine)");
let tipEl=null, tipT=null, tipZiel=null;
function tipWeg(){ clearTimeout(tipT); tipT=null; tipZiel=null; if(tipEl) tipEl.classList.remove("an"); }
function tipZeigen(t){
  /* der rote Knopf wechselt je Seite – Text erst beim Zeigen aus seiner aktuellen Beschriftung bilden */
  if(t.dataset.tipFab){ const l=(t.getAttribute("aria-label")||"").trim(); t.dataset.tip=!l?"Neu anlegen":/\s/.test(l)||/anlegen|erstellen/i.test(l)?l:`${l} anlegen`; }
  if(!t.isConnected||!t.dataset.tip) return;
  if(!tipEl){ tipEl=document.createElement("div"); tipEl.className="tip"; tipEl.setAttribute("role","tooltip"); document.body.appendChild(tipEl); }
  tipEl.innerHTML=`<span>${esc(t.dataset.tip)}</span>${t.dataset.kurz?`<kbd>${esc(t.dataset.kurz)}</kbd>`:""}`;
  tipEl.style.left="0px"; tipEl.style.top="0px"; tipEl.classList.add("an");
  const r=t.getBoundingClientRect(), w=tipEl.offsetWidth, h=tipEl.offsetHeight;
  const x=Math.max(8,Math.min(innerWidth-w-8,r.left+r.width/2-w/2)), unten=r.bottom+8+h<innerHeight-8;
  tipEl.style.left=Math.round(x)+"px"; tipEl.style.top=Math.round(unten?r.bottom+8:r.top-h-8)+"px";
}
document.addEventListener("mouseover",e=>{
  if(!TIP_PC.matches) return; const t=e.target.closest&&e.target.closest("[title]:not(iframe):not(svg *),[data-tip],[data-tip-fab]");
  if(!t||t===tipZiel) return;
  if(t.hasAttribute("title")){ const v=t.getAttribute("title"); t.removeAttribute("title"); if(v){ t.dataset.tip=v; if(!t.getAttribute("aria-label")) t.setAttribute("aria-label",v); } }
  if(!t.dataset.tip&&!t.dataset.tipFab) return; tipWeg(); tipZiel=t; tipT=setTimeout(()=>tipZeigen(t),420);
});
document.addEventListener("mouseout",e=>{ if(tipZiel&&!(e.relatedTarget&&tipZiel.contains(e.relatedTarget))) tipWeg(); });
["mousedown","keydown","wheel"].forEach(t=>document.addEventListener(t,tipWeg,true)); addEventListener("scroll",tipWeg,true);

/* ===== Rechtsklick-Menü (gemeinsam): kontextMenu(x,y,[{t,ic,fn,gefahr,kurz},"-",…]) ===== */
let KM=[];
function kontextMenu(x,y,items){
  const m=document.getElementById("menu"), sc=document.getElementById("scrim"); if(!m||!sc) return;
  items=items.filter(Boolean); if(!items.length) return; KM=items.filter(i=>i!=="-"); let n=0;
  m.innerHTML=items.map(i=>i==="-"?"<hr>":`<button class="mi${i.gefahr?" danger":""}" role="menuitem" data-km="${n++}">${icon(i.ic)}<span>${esc(i.t)}</span>${i.kurz?`<kbd>${esc(i.kurz)}</kbd>`:""}</button>`).join("");
  m.style.right="auto"; m.hidden=false; sc.hidden=false; const w=m.offsetWidth, h=m.offsetHeight;
  m.style.left=Math.max(8,Math.min(innerWidth-w-8,x))+"px"; m.style.top=(y+4+h<innerHeight-8?y+4:Math.max(8,y-h-4))+"px";
  const f=m.querySelector(".mi"); if(f&&kontextMenu.tastatur) f.focus(); kontextMenu.tastatur=false;
}
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest("[data-km]"); if(!b) return; e.stopPropagation(); e.preventDefault();
  const it=KM[+b.dataset.km]; closeOverlays(); if(it&&it.fn) it.fn(); },true);

/* ===== Tastenkürzel (PC) ===== */
const KUERZEL=[["N","Neu anlegen (wie der rote Knopf unten rechts)"],["/ oder Strg K","Suche"],["↑ ↓","In Listen von Eintrag zu Eintrag"],["Enter","Eintrag öffnen"],
  ["Entf","Menü zum Eintrag (z. B. Löschen)"],["Alt ←","Zurück"],["Alt 1 … 9","Bereich in der Seitenleiste"],["Strg Enter oder Strg S","Im Fenster speichern"],["Esc","Fenster oder Menü schließen"],["?","Diese Übersicht"]];
const kzImFeld=t=>!!(t&&(t.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)));
const kzSichtbar=el=>!!(el&&!el.hidden&&el.getClientRects().length);
const LISTE_SEL="#app .li[role=button],#app a.li,#app button.li,#app .vg-k,#app .kt-haupt:not(:disabled),#app .wg.klick,#app .vk,#app .vr";
function kuerzelHilfe(){ dialog("Tastenkürzel",`<div class="kz-liste">${KUERZEL.map(([k,t])=>`<div class="kz-z"><span>${esc(t)}</span><span class="kz-k">${k.split(" oder ").map(x=>`<kbd>${esc(x)}</kbd>`).join(" ")}</span></div>`).join("")}</div>
  <p class="sup" style="margin:14px 4px 0">Rechtsklick auf Einträge öffnet das gleiche Menü wie Gedrückthalten am iPad.</p>`,`<span style="flex:1"></span><button class="btn-text" data-act="cancel">Schließen</button>`); }
document.addEventListener("keydown",e=>{
  if(typeof ZG!=="undefined"&&ZG) return; /* Zeichnen hat eigene Kürzel */
  const dlg=document.getElementById("dlg"), menu=document.getElementById("menu"), dlgOffen=dlg&&!dlg.hidden, menuOffen=menu&&!menu.hidden, cmd=e.ctrlKey||e.metaKey, k=e.key;
  /* im Fenster: Strg+Enter / Strg+S speichert */
  if(dlgOffen&&cmd&&(k==="Enter"||k.toLowerCase()==="s")){ const bs=[...dlg.querySelectorAll(".da button")].filter(b=>b.dataset.act!=="cancel"&&!b.classList.contains("danger")&&!b.disabled);
    if(bs.length){ e.preventDefault(); bs[bs.length-1].click(); } return; }
  /* im Menü: Pfeile */
  if(menuOffen&&(k==="ArrowDown"||k==="ArrowUp")){ const L=[...menu.querySelectorAll(".mi")]; if(!L.length) return; e.preventDefault(); const i=L.indexOf(document.activeElement);
    L[(i<0?(k==="ArrowDown"?0:L.length-1):(i+(k==="ArrowDown"?1:-1)+L.length)%L.length)].focus(); return; }
  if(dlgOffen||menuOffen||kzImFeld(e.target)) return;
  if(cmd&&k.toLowerCase()==="k"){ const q=document.getElementById("q"); if(q){ e.preventDefault(); q.focus(); q.select&&q.select(); } return; }
  if(e.altKey&&k==="ArrowLeft"){ const b=document.querySelector(".sk-zt,.sk-zur"); if(b&&kzSichtbar(b)){ e.preventDefault(); b.click(); } return; }
  if(e.altKey&&/^[1-9]$/.test(e.code.replace("Digit",""))&&e.code.startsWith("Digit")){ const L=[...document.querySelectorAll("#navbar .nav-item")].filter(kzSichtbar), it=L[+e.code.slice(5)-1]; if(it){ e.preventDefault(); it.click(); } return; }
  if(cmd||e.altKey) return;
  if(k==="?"){ e.preventDefault(); kuerzelHilfe(); return; }
  if(k==="Enter"&&document.activeElement&&document.activeElement.matches&&document.activeElement.matches("#app .wg.klick,#app .vk")){ e.preventDefault(); document.activeElement.click(); return; }
  if(k==="/"){ const q=document.getElementById("q"); if(q){ e.preventDefault(); q.focus(); } return; }
  if(k==="n"||k==="N"){ const f=document.getElementById("fab"); if(f&&!f.hidden&&kzSichtbar(f)){ e.preventDefault(); f.click(); } return; }
  if(k==="ArrowDown"||k==="ArrowUp"){ const L=[...document.querySelectorAll(LISTE_SEL)].filter(kzSichtbar); if(!L.length) return; e.preventDefault();
    const i=L.indexOf(document.activeElement), n=i<0?(k==="ArrowDown"?0:L.length-1):Math.max(0,Math.min(L.length-1,i+(k==="ArrowDown"?1:-1)));
    L[n].focus(); L[n].scrollIntoView({block:"nearest"}); return; }
  if((k==="Delete"||k==="Backspace")&&document.activeElement&&document.activeElement.matches&&document.activeElement.matches(LISTE_SEL)){
    e.preventDefault(); const el=document.activeElement, r=el.getBoundingClientRect(); kontextMenu.tastatur=true;
    el.dispatchEvent(new MouseEvent("contextmenu",{bubbles:true,cancelable:true,clientX:Math.round(r.left+40),clientY:Math.round(r.top+r.height/2)})); return; }
});
/* Kürzel auch in den Hinweis-Blasen zeigen */
function kuerzelMarken(){ const f=document.getElementById("fab"); if(f){ f.dataset.kurz="N"; f.dataset.tipFab="1"; } document.querySelectorAll(".sk-zt").forEach(b=>b.dataset.kurz="Alt ←"); const q=document.getElementById("q"); if(q){ q.dataset.kurz="/"; } }

/* ===== Selbst aktualisieren =====
   Neue Version da (Service Worker hat übernommen) ⇒ die App lädt sich von allein neu, sobald gerade nichts bearbeitet wird:
   kein Fenster offen, kein Eingabefeld aktiv, kein Editor (Prüfung, Übergabe, Notiz, Zeichnen), 8 Sekunden ohne Eingabe.
   Nach dem Neuladen erscheint kurz „Auf Version … aktualisiert“. */
let updWartet=false, updLetzteEingabe=Date.now();
["pointerdown","keydown","input"].forEach(t=>document.addEventListener(t,()=>{ updLetzteEingabe=Date.now(); },true));
function updSicher(){
  const dlg=document.getElementById("dlg"); if(dlg&&!dlg.hidden) return false;
  if(document.getElementById("pv")||document.getElementById("mlPop")||document.getElementById("fpop")) return false;
  const m=document.getElementById("menu"); if(m&&!m.hidden) return false;
  const a=document.activeElement; if(a&&(a.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))) return false;
  if(typeof ZG!=="undefined"&&ZG) return false;
  if(typeof cur!=="undefined"&&cur) return false;              /* EVSE: Prüfung offen */
  if(typeof entw!=="undefined"&&entw) return false;            /* Baustelle: Übergabe im Editor */
  if(typeof nEntw!=="undefined"&&nEntw&&typeof nav!=="undefined"&&nav.v==="notiz") return false;
  return document.visibilityState!=="visible"||Date.now()-updLetzteEingabe>8000;
}
function updVersuch(){ if(!updWartet) return; if(!updSicher()){ setTimeout(updVersuch,4000); return; }
  try{ if(typeof saveNow==="function") saveNow(); }catch(e){}
  try{ sessionStorage.setItem("irrgang_upd","1"); }catch(e){} location.reload(); }
function updNeu(){ if(updWartet) return; updWartet=true; updVersuch(); }
document.addEventListener("visibilitychange",()=>{ if(updWartet) updVersuch(); });
addEventListener("load",()=>{ try{ if(sessionStorage.getItem("irrgang_upd")){ sessionStorage.removeItem("irrgang_upd"); const v=typeof APP_VERSION!=="undefined"?String(APP_VERSION).split(" ")[0]:""; setTimeout(()=>toast(`Auf Version ${v} aktualisiert`),900); } }catch(e){} });
window.__updTest=updNeu; /* nur für automatische Tests */
