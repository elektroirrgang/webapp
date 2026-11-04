/* ===== Stromkreis-Rechner (alle Apps, 04.11.2026) =====
   Länge + Querschnitt + Last + Schutzorgan → Strom, Spannungsfall, Leitungswiderstand, erwartetes Zs, Abschaltbedingung, maximale Länge.
   Alle Zwischenwerte stehen ausgeschrieben (nichts vorher gerundet). Kupfer κ = 56 m/(Ω·mm²) bei 20 °C; die Abschaltbedingung
   rechnet wie EVSE mit Faktor 2/3 (Leiter im Fehlerfall warm). Spannungsfall: Empfehlung DIN 18015-1 max. 3 % ab Zähler.
   Aufruf: rcOeffnen({ph,kw,a,l,q,ch,in,zsv,zsm}) – alle Werte optional (Vorbelegung aus der App). */
const RC_IZ={1.5:[19.5,17.5],2.5:[27,24],4:[36,32],6:[46,41],10:[63,57],16:[85,76],25:[112,96]};   /* Iz Verlegeart C, 30 °C, ohne Häufung (DIN VDE 0298-4) – wie in der Legende */
const RC_K=56, RC_Q=["1,5","2,5","4","6","10","16","25"], RC_IN=["6","10","13","16","20","25","32","40","50","63"];
let RC={ph:1,kw:"",a:"",l:"",q:"2,5",ch:"B",in:"16",cos:"1",zsv:"",zsm:""};
const rcN=v=>{ const n=parseFloat(String(v??"").replace(",",".")); return isFinite(n)?n:NaN; };
const rcF=(n,st=2)=>isFinite(n)?Number(n).toLocaleString("de-DE",{maximumFractionDigits:st,minimumFractionDigits:0}):"–";
function rcOeffnen(pre){ RC=Object.assign({ph:1,kw:"",a:"",l:"",q:"2,5",ch:"B",in:"16",cos:"1",zsv:"",zsm:""},pre||{});
  const f=(id,l,v,o={})=>`<div class="tf fl${o.sfx?" has-sfx":""}"><input id="rc_${id}" data-rc="${id}" inputmode="decimal" value="${esc(v??"")}" placeholder="${esc(o.ph||" ")}" autocomplete="off"><label for="rc_${id}">${l}</label>${o.sfx?`<span class="sfx">${o.sfx}</span>`:""}</div>`;
  const chips=(k,L,fmt)=>`<div class="chips rc-chips">${L.map(v=>`<button type="button" class="chip" data-act="rcWahl" data-k="${k}" data-v="${v}" aria-pressed="${String(RC[k])===v}">${fmt?fmt(v):v}</button>`).join("")}</div>`;
  dialog("Stromkreis-Rechner",`<div class="rc">
    <div class="rc-z"><span class="lbl">Netz</span><div class="seg rc-seg" role="group">${[[1,"1-phasig 230 V"],[3,"3-phasig 400 V"]].map(([v,t])=>`<button type="button" data-act="rcWahl" data-k="ph" data-v="${v}" aria-pressed="${RC.ph==v}">${t}</button>`).join("")}</div></div>
    <div class="reihe2">${f("kw","Leistung",RC.kw,{sfx:"kW",ph:"z. B. 11"})}${f("a","oder Strom",RC.a,{sfx:"A",ph:"z. B. 16"})}</div>
    <div class="reihe2">${f("l","Länge (einfach)",RC.l,{sfx:"m",ph:"z. B. 25"})}${f("cos","cos φ",RC.cos,{ph:"1"})}</div>
    <div class="rc-z"><span class="lbl">Querschnitt (mm²)</span>${chips("q",RC_Q)}</div>
    <div class="rc-z"><span class="lbl">Schutzorgan</span>${chips("ch",["B","C"],v=>"Typ "+v)}${chips("in",RC_IN,v=>v+" A")}</div>
    <div class="reihe2">${f("zsv","Zs am Verteiler (optional)",RC.zsv,{sfx:"Ω",ph:"z. B. 0,35"})}${f("zsm","Zs gemessen am Ende (optional)",RC.zsm,{sfx:"Ω"})}</div>
    <div id="rcErg" class="rc-erg">${rcErgebnis()}</div></div>`,
    `<span style="flex:1"></span><button class="btn-text" data-act="cancel">Schließen</button>`,{mittel:true}); }
function rcErgebnis(){ const ph=+RC.ph, U=ph===3?400:230, U0=230, cos=rcN(RC.cos)>0&&rcN(RC.cos)<=1?rcN(RC.cos):1, L=rcN(RC.l), A=rcN(RC.q), In=rcN(RC.in), f=RC.ch==="C"?10:5, zsv=rcN(RC.zsv), zsm=rcN(RC.zsm);
  let I=rcN(RC.a), Iweg=""; const P=rcN(RC.kw)*1000;
  if(!isFinite(I)&&isFinite(P)){ I=ph===3?P/(Math.sqrt(3)*400*cos):P/(230*cos); Iweg=ph===3?`I = P ÷ (√3 × 400 V × cos φ) = ${rcF(P,0)} W ÷ (1,732 × 400 V × ${rcF(cos)}) = ${rcF(I)} A`:`I = P ÷ (230 V × cos φ) = ${rcF(P,0)} W ÷ (230 V × ${rcF(cos)}) = ${rcF(I)} A`; }
  const Z=[], zeile=(t,w,kl="")=>Z.push(`<div class="rc-r ${kl}"><span>${t}</span>${w?`<b>${w}</b>`:""}</div>`);
  if(isFinite(I)){ zeile(Iweg||`I = ${rcF(I)} A`,""); if(isFinite(In)&&I>In) zeile(`Achtung: Strom ${rcF(I)} A ist größer als das Schutzorgan ${RC.ch}${rcF(In)} (${rcF(In)} A)`,"","bad"); }
  if(isFinite(L)&&isFinite(A)&&A>0){
    if(isFinite(I)){ const du=ph===3?Math.sqrt(3)*L*I*cos/(RC_K*A):2*L*I*cos/(RC_K*A), pr=du/U*100;
      zeile(`Spannungsfall ΔU = ${ph===3?"√3":"2"} × L × I × cos φ ÷ (κ × A) = ${ph===3?"1,732":"2"} × ${rcF(L)} m × ${rcF(I)} A × ${rcF(cos)} ÷ (56 × ${rcF(A)} mm²) = ${rcF(du)} V`,`${rcF(pr)} %`,pr>3?"bad":pr>2.5?"warn":"ok");
      if(pr>3) zeile("Über 3 % – DIN 18015-1 empfiehlt höchstens 3 % ab Zähler. Größeren Querschnitt nehmen.","","bad");
      const lmax=0.03*U*RC_K*A/((ph===3?Math.sqrt(3):2)*I*cos); zeile(`Längste Leitung für 3 %: ${rcF(lmax,1)} m`,""); }
    const RL=2*L/(RC_K*A); zeile(`Leitungswiderstand Hin + Rück (L + PE) = 2 × ${rcF(L)} m ÷ (56 × ${rcF(A)} mm²) = ${rcF(RL,3)} Ω`,"");
    if(isFinite(In)&&RC_IZ[A]){ const iz=RC_IZ[A][ph===3?1:0]; zeile(`Belastbarkeit ${rcF(A)} mm²: Iz = ${rcF(iz,1)} A (Verlegeart C, 30 °C, ohne Häufung) ${In<=iz?"≥":"<"} I n = ${rcF(In)} A`,In<=iz?"passt":"zu klein",In<=iz?"ok":"bad"); }
    if(isFinite(In)){ const Ia=f*In, zmax=U0/Ia, zul=zmax*2/3; zeile(`Abschaltung: I a = ${f} × ${rcF(In)} A = ${rcF(Ia)} A → Zs max = 230 V ÷ ${rcF(Ia)} A = ${rcF(zmax,3)} Ω, mit Reserve × 2/3 = ${rcF(zul,3)} Ω`,"");
      if(isFinite(zsv)){ const ze=zsv+RL, st=ze<=zul?"ok":ze<=zmax?"warn":"bad"; zeile(`Erwartetes Zs am Ende = ${rcF(zsv,3)} Ω + ${rcF(RL,3)} Ω = ${rcF(ze,3)} Ω`,st==="ok"?"erfüllt":st==="warn"?"knapp":"zu hoch",st);
        const lz=(zul-zsv)*RC_K*A/2; zeile(lz>0?`Längste Leitung für die Abschaltbedingung: (${rcF(zul,3)} Ω − ${rcF(zsv,3)} Ω) × 56 × ${rcF(A)} mm² ÷ 2 = ${rcF(lz,1)} m`:"Schon am Verteiler ist Zs zu hoch – Abschaltbedingung nicht erreichbar.",""+"",lz>0?"":"bad");
        if(isFinite(zsm)){ const ab=zsm-ze; zeile(`Gemessen ${rcF(zsm,3)} Ω, erwartet ${rcF(ze,3)} Ω → Differenz ${rcF(ab,3)} Ω`,Math.abs(ab)<=Math.max(0.1,ze*0.2)?"passt":ab>0?"höher als erwartet":"niedriger als erwartet",Math.abs(ab)<=Math.max(0.1,ze*0.2)?"ok":"warn");
          if(ab>Math.max(0.1,ze*0.2)) zeile("Deutlich höher als gerechnet – Klemmstelle, Übergangswiderstand oder längere Leitung als angenommen?","","warn"); } } } }
  if(!Z.length) return `<p class="meta">Länge und Querschnitt eintragen – dazu Leistung oder Strom für den Spannungsfall, Zs am Verteiler für die Abschaltbedingung.</p>`;
  return Z.join("")+`<p class="sup rc-hin">Vereinfacht wie in der Ausbildung: Kupfer κ = 56 m/(Ω·mm²) bei 20 °C, Schutzleiter mit gleichem Querschnitt. „Knapp“ heißt: unter Zs max, aber ohne Reserve (Faktor 2/3, Leiter im Fehlerfall warm). Gleiche Rechnung wie „Berechnen“ am Stromkreis in Gebäudetechnik.</p>`; }
document.addEventListener("input",e=>{ const el=e.target.closest&&e.target.closest("[data-rc]"); if(!el) return; RC[el.dataset.rc]=el.value; if(el.dataset.rc==="kw"&&el.value) { RC.a=""; const a=document.getElementById("rc_a"); if(a) a.value=""; } if(el.dataset.rc==="a"&&el.value){ RC.kw=""; const k=document.getElementById("rc_kw"); if(k) k.value=""; } const r=document.getElementById("rcErg"); if(r) r.innerHTML=rcErgebnis(); });
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act="rcWahl"],[data-act="rcStart"]'); if(!b) return; e.stopPropagation(); e.preventDefault();
  if(b.dataset.act==="rcStart"){ let pre={}; try{ pre=JSON.parse(b.dataset.pre||"{}"); }catch(x){} rcOeffnen(pre); return; }
  RC[b.dataset.k]=b.dataset.k==="ph"?+b.dataset.v:b.dataset.v; b.parentElement.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));
  const r=document.getElementById("rcErg"); if(r) r.innerHTML=rcErgebnis(); },true);
/* Knopf „Rechnen“ mit Vorbelegung, z. B. rcKnopf({l:25,q:"6",ch:"B",in:"32",ph:3,kw:11}) */
const rcKnopf=(pre,txt)=>`<button type="button" class="btn-tonal rc-knopf" data-act="rcStart" data-pre="${esc(JSON.stringify(pre||{}))}">${icon("rcRech")}${txt||"Rechnen"}</button>`;
IC.rcRech=IC.rcRech||"M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5.97 4.06L14.09 6l1.41 1.41L16.91 6l1.06 1.06-1.41 1.41 1.41 1.41-1.06 1.06-1.41-1.4-1.41 1.41-1.06-1.06 1.41-1.41-1.41-1.42zm-6.78.66h5v1.5h-5v-1.5zM11.5 16h-2v2H8v-2H6v-1.5h2v-2h1.5v2h2V16zm6.5 1.25h-5v-1.5h5v1.5zm0-2.5h-5v-1.5h5v1.5z";
