/* ===== Suchleisten – einheitlich in allen Apps (04.11.2026) =====
   Jede Suchleiste (input[type=search] in .search/.aw-such) bekommt automatisch:
   - einen eigenen Löschen-Knopf (statt des kleinen Browser-Kreuzes), sichtbar sobald etwas drinsteht
   - ein Mikrofon: antippen, Suchbegriff sagen – der Text landet im Feld und die Liste filtert sofort mit
   Funktioniert auch nach jedem Neuzeichnen, weil die Knöpfe beim Erscheinen eines Suchfelds ergänzt werden. */
/* ---- Treffer finden: intelligenter als „enthält“ ----
   - Groß/klein, Umlaute und Schreibweisen egal: Müller = Mueller = Muller, Straße = Strasse
   - mehrere Wörter in beliebiger Reihenfolge und über alle Felder: „richter nümbrecht“ findet Kunde Richter in Nümbrecht
   - Leer- und Satzzeichen egal: „4K7P2M“ = „4K7 P2M“, „B 16“ = „B16“, „0171 234“ = „0171234“
   - kleine Tippfehler ab 5 Buchstaben: „Richtr“, „Nümbercht“ */
const suNorm=s=>String(s??"").toLowerCase().normalize("NFD").replace(/a\u0308/g,"a").replace(/o\u0308/g,"o").replace(/u\u0308/g,"u").replace(/[\u0300-\u036f]/g,"").replace(/ß/g,"ss").replace(/ae/g,"a").replace(/oe/g,"o").replace(/ue/g,"u");
const SU_ZAHL={eins:"1",zwei:"2",drei:"3",vier:"4",funf:"5",sechs:"6",sieben:"7",acht:"8",neun:"9",zehn:"10",elf:"11",zwolf:"12",dreizehn:"13",vierzehn:"14",funfzehn:"15",sechzehn:"16",siebzehn:"17",achtzehn:"18",neunzehn:"19",zwanzig:"20"};
const suWorte=q=>suNorm(q).split(/[\s,;]+/).map(w=>w.trim()).filter(Boolean).map(w=>SU_ZAHL[w]||w);   /* gesprochene Zahlwörter: „Höhenstraße dreizehn“ = „Höhenstraße 13“ */
function suEinFehler(a,b){ if(a===b) return true; const la=a.length, lb=b.length; if(Math.abs(la-lb)>1) return false; let i=0,j=0,f=0;
  while(i<la&&j<lb){ if(a[i]===b[j]){ i++; j++; continue; } if(++f>1) return false; if(la===lb&&a[i]===b[j+1]&&a[i+1]===b[j]){ i+=2; j+=2; continue; } if(la>lb) i++; else if(lb>la) j++; else{ i++; j++; } }
  return f+(la-i)+(lb-j)<=1; }
/* wie es klingt: „Elektrik“ findet „Electric“, „Filips“ findet „Philips“, „Maier“ findet „Meyer“ (Spracheingabe schreibt nach Gehör) */
const suLaut=s=>s.replace(/ph/g,"f").replace(/th/g,"t").replace(/ck/g,"k").replace(/c(?=[eiy])/g,"z").replace(/c/g,"k").replace(/qu/g,"kw").replace(/y/g,"i").replace(/ey|ay|ai/g,"ei").replace(/dt/g,"t").replace(/v(?=[aeiou])/g,"w").replace(/([a-z])\1+/g,"$1");
function suPasst(q,...felder){ const W=suWorte(q); if(!W.length) return true;
  const t=suNorm(felder.flat(Infinity).filter(x=>x!=null&&x!=="").join(" ")), k=t.replace(/[^a-z0-9]/g,""), tok=t.split(/[^a-z0-9]+/).filter(Boolean);
  let tl=null, kl, tokl;
  return W.every(w=>{ const wk=w.replace(/[^a-z0-9]/g,""); if(!wk) return true; if(t.includes(w)||k.includes(wk)) return true;
    if(wk.length<3) return false;
    if(tl===null){ tl=suLaut(t); kl=tl.replace(/[^a-z0-9]/g,""); tokl=tl.split(/[^a-z0-9]+/).filter(Boolean); }
    const wl=suLaut(wk); if(kl.includes(wl)) return true;
    if(wl.length<5) return false; return tokl.some(x=>[wl.length-1,wl.length,wl.length+1].some(L=>L>0&&L<=x.length&&suEinFehler(wl,x.slice(0,L)))); }); }
/* Listen, die beim Tippen neu gefiltert werden (Ansicht → Funktion, die nur den Inhalt unter der Suchleiste liefert) */
const SU_LISTE=window.SU_LISTE=window.SU_LISTE||{};   /* über window, weil manche Module vor dieser Datei eingebunden sind */
/* Suchbegriff gehört zur Liste: in eine andere Liste wechseln leert ihn, zurück aus der Detailansicht behält ihn */
let SU_QV=null;
function suQView(){ if(typeof nav==="undefined") return; if(SU_QV!==nav.v){ SU_QV=nav.v; try{ query=""; }catch(e){} } }
const SU_SR=()=>window.SpeechRecognition||window.webkitSpeechRecognition;
if(typeof IC!=="undefined"&&!IC.mic) IC.mic="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z";
let SU_LAEUFT=null;   /* {id, r} */
function suKnoepfe(inp){ if(inp.dataset.su) return; inp.dataset.su="1"; const w=inp.closest(".search,.aw-such"); if(!w) return;
  w.classList.add("su");
  const x=document.createElement("button"); x.type="button"; x.className="su-x"; x.setAttribute("aria-label","Suche leeren"); x.innerHTML=icon("close"); x.hidden=!inp.value;
  inp.after(x);
  if(SU_SR()){ const m=document.createElement("button"); m.type="button"; m.className="su-mic"; m.setAttribute("aria-label","Suchbegriff sprechen"); m.title="Suchbegriff sprechen"; m.innerHTML=icon("mic"); x.after(m);
    if(SU_LAEUFT&&SU_LAEUFT.id===inp.id) w.classList.add("su-hoert"); } }
function suSetzen(id,txt){ const inp=document.getElementById(id); if(!inp) return; inp.value=txt; inp.dispatchEvent(new Event("input",{bubbles:true}));
  const neu=document.getElementById(id); if(neu){ const x=neu.parentElement&&neu.parentElement.querySelector(".su-x"); if(x) x.hidden=!txt; } }
function suHoerenStop(){ const L=SU_LAEUFT; SU_LAEUFT=null; if(L) try{ L.r.stop(); }catch(e){} if(L){ const i=document.getElementById(L.id); if(i&&i.dataset.ph){ i.placeholder=i.dataset.ph; delete i.dataset.ph; } } document.querySelectorAll(".su-hoert").forEach(w=>w.classList.remove("su-hoert")); }
function suHoeren(inp){ const SR=SU_SR(); if(!SR) return; if(SU_LAEUFT){ const gleich=SU_LAEUFT.id===inp.id; suHoerenStop(); if(gleich) return; }
  if(!inp.id) inp.id="su"+Math.random().toString(36).slice(2,8);
  const r=new SR(); r.lang="de-DE"; r.interimResults=true; r.continuous=false; r.maxAlternatives=1; SU_LAEUFT={id:inp.id,r};
  const w=inp.closest(".su"); if(w) w.classList.add("su-hoert"); const alt=inp.value; if(!inp.dataset.ph) inp.dataset.ph=inp.placeholder; inp.placeholder="Sprich jetzt …";
  r.onresult=e=>{ let t=""; for(let i=0;i<e.results.length;i++) t+=e.results[i][0].transcript;
    t=t.replace(/[.!?]+$/,"").replace(/\s+/g," ").trim(); if(SU_LAEUFT&&SU_LAEUFT.r===r){ suSetzen(inp.id,t); const n=document.getElementById(inp.id); const w2=n&&n.closest(".su"); if(w2) w2.classList.add("su-hoert"); } };
  r.onerror=e=>{ if(e.error==="not-allowed"||e.error==="service-not-allowed") toast("Mikrofon nicht erlaubt – in den Browser-Einstellungen freigeben"); else if(e.error==="network") toast("Spracheingabe braucht Internet"); else if(e.error==="no-speech") toast("Nichts gehört – nochmal versuchen"); if(alt!==undefined&&e.error!=="no-speech"&&e.error!=="aborted") suSetzen(inp.id,alt); };
  r.onend=()=>{ if(SU_LAEUFT&&SU_LAEUFT.r===r) suHoerenStop(); };
  try{ r.start(); }catch(e){ suHoerenStop(); toast("Spracheingabe konnte nicht starten"); } }
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest(".su-x,.su-mic"); if(!b) return; e.stopPropagation(); e.preventDefault();
  const inp=b.parentElement.querySelector("input[type=search]"); if(!inp) return;
  if(b.classList.contains("su-x")){ suHoerenStop(); suSetzen(inp.id,""); const n=document.getElementById(inp.id); if(n) n.focus(); return; }
  suHoeren(inp); },true);
document.addEventListener("input",e=>{ const t=e.target; if(t&&t.matches&&t.matches("input[type=search]")){ const x=t.parentElement&&t.parentElement.querySelector(".su-x"); if(x) x.hidden=!t.value; } });
/* neue Suchfelder sofort ausstatten */
(()=>{ const los=()=>{ document.querySelectorAll("input[type=search]").forEach(suKnoepfe);
    new MutationObserver(M=>{ for(const m of M) for(const n of m.addedNodes){ if(n.nodeType!==1) continue; if(n.matches&&n.matches("input[type=search]")) suKnoepfe(n); else if(n.querySelectorAll) n.querySelectorAll("input[type=search]").forEach(suKnoepfe); } }).observe(document.body,{childList:true,subtree:true}); };
  document.readyState==="loading"?document.addEventListener("DOMContentLoaded",los):los(); })();
