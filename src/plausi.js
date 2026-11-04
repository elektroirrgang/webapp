/* ===== Plausibilitätsprüfung bei Messwerten (EVSE und Gebäudetechnik, 04.11.2026) =====
   Ergänzt die Grenzwerte (bestanden / nicht bestanden) um Hinweise direkt unter dem Feld:
   - Tippfehler und falsche Einheit (Sekunden statt ms, A statt mA, Komma vergessen, 400 V statt 230 V)
   - unrealistische Werte (Zs 0,01 Ω, R LO 0 Ω, RCD in 2 ms)
   - Quervergleiche (Zs der Außenleiter weichen stark ab, R LO größer als Zs, Zs kleiner als Zi)
   - Rechenweg zur Abschaltbedingung mit allen Zwischenwerten (I k = 230 V ÷ Zs …)
   Felder bekommen data-pl="<art>"; die App liefert den Bezug über plCtx(input) → {In, f, zul, idn, zs:[…], zsHier, zi, rlo}.
   Hinweise sind nie „falsch“ – nur „bitte nochmal hinsehen“. Der Grenzwert der App entscheidet weiter über bestanden. */
const plZahl=v=>{ const s=String(v??"").trim(); if(!s) return null; const m=s.replace(/\s/g,"").match(/^([<>≤≥]?)(\d+(?:[.,]\d+)?)/); if(!m) return null; return {g:m[1],n:+m[2].replace(",",".")}; };
const plF=(n,st=2)=>Number(n).toLocaleString("de-DE",{maximumFractionDigits:st,minimumFractionDigits:0});
function plHinweise(art,roh,c){ c=c||{}; const z=plZahl(roh); if(!z) return []; const v=z.n, H=[], w=t=>H.push({s:"warn",t}), i=t=>H.push({s:"info",t});
  if(art==="riso"){ if(z.g===">") return H;
    if(v===0) w("0 MΩ heißt Kurzschluss gegen PE oder zwischen den Leitern – Verbraucher abgeklemmt? Messung wiederholen.");
    else if(v>=1&&v<2) w("Nur knapp über 1 MΩ – Feuchtigkeit, alte Leitung oder noch angeschlossene Verbraucher (Überspannungsschutz, Netzteile)?");
    else if(v>0&&v<0.05) w("Sehr niedrig. Falls das Gerät kΩ anzeigt: 1 MΩ = 1000 kΩ – hier in MΩ eintragen."); }
  if(art==="rlo"){ if(v===0) w("0 Ω gibt es bei einem Schutzleiter nicht – Messleitungen vorher genullt (kompensiert)?");
    else if(v>2) w("Sehr hoch für einen Schutzleiter – Messleitungen genullt, Klemmstelle locker oder Unterbrechung?");
    if(c.zsHier&&v>c.zsHier) w(`R LO (${plF(v)} Ω) ist größer als Zs (${plF(c.zsHier)} Ω) – unplausibel, Zs enthält den Schutzleiter schon. Eine der beiden Messungen prüfen.`); }
  if(art==="zs"){ if(z.g==="<") return H;
    if(v<0.05) w("Unter 0,05 Ω ist für einen Endstromkreis unrealistisch – Messung direkt am Hausanschluss oder Komma verrutscht?");
    else if(v>20) w("Sehr hoch – Komma vergessen (z. B. 0,82 statt 82)? Oder Messung über einen hochohmigen Pfad?");
    if(c.zi&&v<c.zi) w(`Zs (${plF(v)} Ω) ist kleiner als Zi (${plF(c.zi)} Ω) – unplausibel, die Schleife ist immer mindestens so groß wie die Netzimpedanz.`);
    const L=(c.zs||[]).filter(x=>x&&x>0); if(L.length>=2){ const lo=Math.min(...L), hi=Math.max(...L); if(lo>0&&(hi-lo)/lo>0.5&&v===hi) w(`Deutlich höher als die anderen Außenleiter (${plF(lo)} … ${plF(hi)} Ω) – Klemmstelle oder Übergangswiderstand in diesem Außenleiter prüfen.`); }
    if(c.In&&c.f&&v>0){ const Ia=c.f*c.In, Ik=230/v; let t=`I k = 230 V ÷ ${plF(v,3)} Ω = ${plF(Ik)} A · nötig I a = ${c.f} × ${plF(c.In)} A = ${plF(Ia)} A`;
      if(c.zul){ const res=(c.zul-v)/c.zul*100; if(v<=c.zul) t+=res<10?` · knapp: nur ${plF(res,1)} % Reserve bis ${plF(c.zul)} Ω`:` · Reserve ${plF(res,1)} %`; else t+=` · Zs zu hoch: zulässig ≤ ${plF(c.zul)} Ω${Math.abs(c.zul-230/Ia*2/3)<0.01?" (mit Faktor 2/3, weil die Leitung im Fehlerfall warm wird)":""}`; }
      else t+=Ik>=Ia?" · Abschaltbedingung erfüllt":" · Abschaltbedingung NICHT erfüllt";
      (c.zul&&v<=c.zul&&(c.zul-v)/c.zul<0.1)?w(t):i(t); } }
  if(art==="u"){ if(v>360&&v<440) w("Das sieht nach Außenleiterspannung (400 V) aus – hier L gegen N messen (ca. 230 V).");
    else if(v<100||v>300) w("Für L–N unrealistisch (erwartet ca. 230 V) – Tippfehler oder Messpunkt falsch?"); }
  if(art==="unpe"&&v>=2&&v<10) w("N–PE erhöht – Belastung oder Übergangswiderstand im Neutralleiter? Richtung Verteiler nachgehen.");
  if(art==="ub"){ if(v>25&&v<=50) w("Für ein TN-Netz hoch (üblich unter 5 V) – Schutzleiter und Erdung prüfen."); }
  if(art==="t1"||art==="t5"){ if(v>0&&v<1) w("Unter 1 ms – in Sekunden eingetragen? Bitte in ms (z. B. 0,025 s = 25 ms).");
    else if(art==="t1"&&v<5) w("Unter 5 ms bei 1 × IΔN ist sehr schnell – Wert richtig abgelesen?");
    else if(art==="t1"&&v>200&&v<=300) w("Noch bestanden, aber langsam – Typ S (selektiv) oder alter RCD? Bei Typ S gelten andere Zeiten."); }
  if(art==="ria"){ if(v>0&&v<1) w("Unter 1 – in A eingetragen? Bitte in mA (z. B. 0,021 A = 21 mA).");
    else if(c.idn){ if(v<c.idn*0.5) w(`Löst schon bei ${plF(v)} mA aus (unter ½ × ${c.idn} mA) – Ableitströme der Verbraucher? Vor dem Tausch ohne Verbraucher wiederholen.`);
      else if(v<=c.idn&&v>c.idn*0.9) w(`Löst erst kurz vor ${c.idn} mA aus – RCD alt oder träge? Im Auge behalten.`); } }
  return H; }
/* Anzeige: unter dem Feld (EVSE: in der Beschriftung der Zeile, Gebäudetechnik: im Feld bzw. in der Messpunktzeile) */
function plZiel(el){ const m=el.closest(".mrow"); if(m) return m; return el.closest(".ec-feld")||(el.closest(".ec-pz")||{}).querySelector?.(".t")||el.parentElement; }
function plAlle(root){ (root||document).querySelectorAll("input[data-pl]").forEach(el=>{ const ziel=plZiel(el); if(!ziel) return;
  let c={}; try{ if(typeof plCtx==="function") c=plCtx(el)||{}; }catch(e){}
  const H=plHinweise(el.dataset.pl,el.value,c); let h=ziel.querySelector(":scope > .pl-h");
  if(!H.length){ if(h) h.remove(); return; }
  if(!h){ h=document.createElement("div"); h.className="pl-h"; ziel.appendChild(h); }
  const html=H.map(x=>`<span class="pl-${x.s}">${esc(x.t)}</span>`).join(""); if(h.innerHTML!==html) h.innerHTML=html; }); }
let PL_T=null; const plBald=()=>{ clearTimeout(PL_T); PL_T=setTimeout(()=>plAlle(),60); };
document.addEventListener("input",e=>{ if(e.target&&e.target.matches&&e.target.matches("input[data-pl]")) plBald(); },true);
new MutationObserver(m=>{ if(m.some(x=>[...x.addedNodes].some(n=>n.nodeType===1&&(n.matches?.("input[data-pl]")||n.querySelector?.("input[data-pl]"))))) plBald(); }).observe(document.documentElement,{childList:true,subtree:true});
