/* ===== Handbuch-Baukasten (Max 27.11.2026) =====
   Artikel werden aus Bausteinen zusammengesetzt – niemand tippt mehr „##“, „> “ oder „[[aderfarben]]“.
   Gespeichert wird weiter das bisherige Textformat (hbMd), damit alte Artikel, Druck, Suche und MCP-Server unverändert funktionieren:
   hbBauLesen() macht aus dem Text Bausteine, hbBauText() aus den Bausteinen wieder Text.
   Bearbeiten nur am PC oder iPad (hbGrossGenug) – am Handy ist der Baukasten zu eng. */
IC.hbHoch=IC.hbHoch||"M7 14l5-5 5 5z"; IC.hbRunter=IC.hbRunter||"M7 10l5 5 5-5z";
IC.hbTab=IC.hbTab||"M3 3h18v18H3V3zm2 2v4h6V5H5zm8 0v4h6V5h-6zm-8 6v4h6v-4H5zm8 0v4h6v-4h-6zm-8 6v2h6v-2H5zm8 0v2h6v-2h-6z";
IC.hbTitel=IC.hbTitel||"M5 4v3h5.5v12h3V7H19V4z";
IC.hbListe=IC.hbListe||"M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z";
IC.hbZahl=IC.hbZahl||"M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z";
const HB_BAU_TYPEN=[["text","Text","notes"],["ueberschrift","Überschrift","hbTitel"],["liste","Aufzählung","hbListe"],["schritte","Schritte 1-2-3","hbZahl"],
  ["hinweis","Hinweis","info"],["warnung","Warnung","warn"],["tabelle","Tabelle","hbTab"],["anruf","Anruf-Knopf","phone"],["link","Link","globe"],["schaubild","Schaubild","chart"],["offen","Noch offen","pending"]];
const HB_SCHAUBILDER=[["aderfarben","Aderfarben nach Baujahr","Farben der Adern je nach Baujahr der Anlage, zum Umschalten"],
  ["sicherheitsregeln","Die 5 Sicherheitsregeln","Alle fünf Regeln mit Bild und kurzem Text"],
  ["arbeitstag","So rechnet sich ein Arbeitstag","Tagesbalken Mo–Do und Freitag, Soll 7:36 h, Rechnung"]];
let HB_BL=[], HB_BAU_PLUS=null, HB_BAU_MODUS="bau", HB_BAU_VORHER=null;
const hbGrossGenug=()=>{ try{ return Math.min(screen.width,screen.height)>=600||matchMedia("(pointer:fine)").matches; }catch(e){ return true; } };
/* ---- Text ↔ Bausteine ---- */
function hbBauLesen(t){ const Z=String(t||"").replace(/\r/g,"").split("\n"), B=[]; let i=0;
  const TEL=/^\[([^\]]+)\]\((tel:[+\d ]+)\)$/, LINK=/^\[([^\]]+)\]\((https?:[^)\s]+)\)$/;
  const besonders=s=>!s||/^\[\[\w+\]\]$/.test(s)||/^##\s/.test(s)||/^>/.test(s)||/^\?\?/.test(s)||s.startsWith("|")||/^[-•·]\s+/.test(s)||/^\d+\.\s+/.test(s)||TEL.test(s)||LINK.test(s);
  while(i<Z.length){ const s=Z[i].trim(); let m;
    if(!s){ i++; continue; }
    if((m=s.match(/^\[\[(\w+)\]\]$/))){ B.push({typ:"schaubild",name:m[1]}); i++; continue; }
    if((m=s.match(/^##\s+(.+)/))){ B.push({typ:"ueberschrift",text:m[1]}); i++; continue; }
    if((m=s.match(/^>\s*!\s*(.+)/))){ B.push({typ:"warnung",text:m[1]}); i++; continue; }
    if((m=s.match(/^>\s*(.+)/))){ B.push({typ:"hinweis",text:m[1]}); i++; continue; }
    if((m=s.match(/^\?\?\s*(.*)/))){ B.push({typ:"offen",text:m[1]}); i++; continue; }
    if((m=s.match(TEL))){ B.push({typ:"anruf",name:m[1],nummer:m[2].slice(4)}); i++; continue; }
    if((m=s.match(LINK))){ B.push({typ:"link",name:m[1],url:m[2]}); i++; continue; }
    if(s.startsWith("|")){ const T=[]; while(i<Z.length&&Z[i].trim().startsWith("|")){ const r=Z[i].trim(); if(!/^[-:\s|]+$/.test(r)) T.push(r.replace(/^\||\|$/g,"").split("|").map(x=>x.trim().replace(/<br>/g,"\n"))); i++; }
      const n=Math.max(...T.map(r=>r.length)); B.push({typ:"tabelle",kopf:(T[0]||[]).concat(Array(n).fill("")).slice(0,n),zeilen:T.slice(1).map(r=>r.concat(Array(n).fill("")).slice(0,n))}); continue; }
    if(/^[-•·]\s+/.test(s)){ const L=[]; while(i<Z.length&&/^[-•·]\s+/.test(Z[i].trim())){ L.push(Z[i].trim().replace(/^[-•·]\s+/,"")); i++; } B.push({typ:"liste",punkte:L}); continue; }
    if(/^\d+\.\s+/.test(s)){ const L=[]; while(i<Z.length&&/^\d+\.\s+/.test(Z[i].trim())){ L.push(Z[i].trim().replace(/^\d+\.\s+/,"")); i++; } B.push({typ:"schritte",punkte:L}); continue; }
    const L=[]; while(i<Z.length&&!besonders(Z[i].trim())){ L.push(Z[i].trim()); i++; } B.push({typ:"text",text:L.join("\n")}); }
  return B; }
const hbEinZeile=s=>String(s||"").replace(/\s*\n\s*/g," ").trim();
function hbBauText(B){ return B.map(b=>{ switch(b.typ){
    case "text": return String(b.text||"").split("\n").map(x=>x.trim()).filter(Boolean).join("\n");
    case "ueberschrift": return b.text&&b.text.trim()?"## "+hbEinZeile(b.text):"";
    case "liste": return (b.punkte||[]).map(hbEinZeile).filter(Boolean).map(x=>"- "+x).join("\n");
    case "schritte": return (b.punkte||[]).map(hbEinZeile).filter(Boolean).map((x,i)=>`${i+1}. ${x}`).join("\n");
    case "hinweis": return b.text&&b.text.trim()?"> "+hbEinZeile(b.text):"";
    case "warnung": return b.text&&b.text.trim()?"> ! "+hbEinZeile(b.text):"";
    case "offen": return b.text&&b.text.trim()?"?? "+hbEinZeile(b.text):"";
    case "anruf": return b.nummer&&b.nummer.trim()?`[${hbEinZeile(b.name)||"Anrufen"}](tel:${b.nummer.replace(/[^+\d ]/g,"").trim()})`:"";
    case "link": return /^https?:\/\//.test(b.url||"")?`[${hbEinZeile(b.name)||b.url}](${b.url.trim()})`:"";
    case "schaubild": return b.name?`[[${b.name}]]`:"";
    case "tabelle": { const z=r=>"| "+r.map(c=>String(c||"").trim().replace(/\|/g,"/").replace(/\n/g,"<br>")||" ").join(" | ")+" |";
      const K=b.kopf||[], R=(b.zeilen||[]).filter(r=>r.some(c=>String(c||"").trim())); if(!K.length) return "";
      return [z(K),"|"+K.map(()=>"---").join("|")+"|",...R.map(z)].join("\n"); }
    default: return ""; } }).map((t,i,A)=>t).reduce((o,t,i)=>{ if(!t) return o; /* mehrere „Noch offen“ hintereinander bleiben eine Box */
      return o+(o?(t.startsWith("?? ")&&/(^|\n)\?\? [^\n]*$/.test(o)?"\n":"\n\n"):"")+t; },""); }
/* ---- Anzeige im Editor ---- */
const hbBauTyp=t=>HB_BAU_TYPEN.find(x=>x[0]===t)||[t,t,"notes"];
const hbBF=(i,k,v,o={})=>o.mehr?`<textarea class="hbb-f" data-hbb="${i}" data-k="${k}" rows="${o.rows||2}" placeholder="${esc(o.ph||"")}">${esc(v||"")}</textarea>`
  :`<input class="hbb-f" data-hbb="${i}" data-k="${k}" value="${esc(v||"")}" placeholder="${esc(o.ph||"")}"${o.im?` inputmode="${o.im}"`:""}>`;
function hbBauKoerper(b,i){ switch(b.typ){
  case "text": return `${hbBF(i,"text",b.text,{mehr:true,rows:3,ph:"Text schreiben … **fett** geht mit dem Knopf"})}<div class="hbb-mini"><button type="button" class="chip" data-act="hbBFett" data-i="${i}"><b>F</b> Fett</button></div>`;
  case "ueberschrift": return hbBF(i,"text",b.text,{ph:"Zwischenüberschrift"});
  case "hinweis": case "warnung": case "offen": return hbBF(i,"text",b.text,{mehr:true,rows:2,ph:b.typ==="offen"?"Was ist noch unklar? Sehen nur Chef und Büro.":b.typ==="warnung"?"Worauf unbedingt achten?":"Was soll auffallen?"});
  case "anruf": return `<div class="hbb-2">${hbBF(i,"name",b.name,{ph:"Text, z. B. Joachim anrufen"})}${hbBF(i,"nummer",b.nummer,{ph:"Nummer",im:"tel"})}</div>`;
  case "link": return `<div class="hbb-2">${hbBF(i,"name",b.name,{ph:"Text, z. B. DGUV-Information"})}${hbBF(i,"url",b.url,{ph:"https://…",im:"url"})}</div>`;
  case "liste": case "schritte": return `<div class="hbb-punkte">${(b.punkte||[]).map((p,j)=>`<div class="hbb-p"><span class="hbb-pz">${b.typ==="schritte"?j+1+".":"•"}</span>${hbBF(i,"p"+j,p,{ph:"Punkt"})}<button type="button" class="icon-btn" data-act="hbBPWeg" data-i="${i}" data-j="${j}" aria-label="Punkt entfernen">${icon("close")}</button></div>`).join("")}</div>
      <button type="button" class="btn-text hbb-plus-k" data-act="hbBPNeu" data-i="${i}">${icon("add")}Punkt</button>`;
  case "tabelle": { const n=(b.kopf||[]).length;
    return `<div class="hbb-tab" style="--n:${n}">${(b.kopf||[]).map((k,c)=>`<div class="hbb-th">${hbBF(i,"k"+c,k,{ph:"Spalte"})}${n>1?`<button type="button" class="icon-btn" data-act="hbBSWeg" data-i="${i}" data-c="${c}" aria-label="Spalte entfernen">${icon("close")}</button>`:""}</div>`).join("")}
      ${(b.zeilen||[]).map((r,z)=>r.map((c,s)=>`<div class="hbb-td">${hbBF(i,`z${z}_${s}`,c,{mehr:true,rows:1})}${s===n-1?`<button type="button" class="icon-btn" data-act="hbBZWeg" data-i="${i}" data-z="${z}" aria-label="Zeile entfernen">${icon("close")}</button>`:""}</div>`).join("")).join("")}</div>
      <div class="hbb-mini"><button type="button" class="btn-text" data-act="hbBZNeu" data-i="${i}">${icon("add")}Zeile</button>${n<5?`<button type="button" class="btn-text" data-act="hbBSNeu" data-i="${i}">${icon("add")}Spalte</button>`:""}</div>
      <p class="hbb-tipp">Mehrere Zeilen in einer Zelle: einfach Enter drücken. Ist die erste Spalte einer Zeile leer, gehört sie zur Zeile darüber – daraus werden Karten.</p>`; }
  case "schaubild": { const s=HB_SCHAUBILDER.find(x=>x[0]===b.name);
    return `<div class="hbb-sb">${HB_SCHAUBILDER.map(([k,t,d])=>`<button type="button" data-act="hbBSb" data-i="${i}" data-k="${k}" aria-pressed="${k===b.name}"><b>${esc(t)}</b><span>${esc(d)}</span></button>`).join("")}</div>${s?"":`<p class="hbb-tipp">Bitte ein Schaubild wählen.</p>`}`; }
  default: return ""; } }
function hbBauPlus(i){ if(HB_BAU_PLUS!==i) return `<button type="button" class="hbb-plus" data-act="hbBPlus" data-i="${i}">${icon("add")}Baustein</button>`;
  return `<div class="hbb-wahl">${HB_BAU_TYPEN.filter(([t])=>t!=="offen"||hbDarf()).map(([t,n,ic])=>`<button type="button" data-act="hbBNeu" data-i="${i}" data-t="${t}">${icon(ic)}<span>${n}</span></button>`).join("")}
    <button type="button" class="hbb-zu" data-act="hbBPlus" data-i="">Abbrechen</button></div>`; }
function hbBauZeigen(){ const el=document.getElementById("hbBau"), h=$("#dlg").querySelector('[data-f="hbInhalt"]'); if(!el) return;
  if(h) h.value=hbBauText(HB_BL);
  const kopf=`<div class="hbb-kopf"><div class="hb-af-seg" role="tablist"><button type="button" role="tab" data-act="hbBModus" data-k="bau" aria-selected="${HB_BAU_MODUS==="bau"}">Bausteine</button><button type="button" role="tab" data-act="hbBModus" data-k="vorschau" aria-selected="${HB_BAU_MODUS==="vorschau"}">Vorschau</button></div>
    <button type="button" class="btn-tonal hbb-ki" data-act="hbBKi">${icon("bulb")}Mit KI aufbereiten</button>${HB_BAU_VORHER?`<button type="button" class="btn-text" data-act="hbBKiZurueck">Rückgängig</button>`:""}</div>`;
  if(HB_BAU_MODUS==="vorschau"){ el.innerHTML=kopf+`<div class="hbb-vorschau hb"><article class="hb-text">${hbBauText(HB_BL)?hbMd(hbBauText(HB_BL)):`<p class="meta">Noch leer.</p>`}</article></div>`; return; }
  el.innerHTML=kopf+`<div class="hbb-liste">${HB_BL.map((b,i)=>{ const [,n,ic]=hbBauTyp(b.typ); return `${hbBauPlus(i)}<section class="hbb hbb-${b.typ}"><div class="hbb-k">${icon(ic)}<b>${n}</b><span style="flex:1"></span>
      <button type="button" class="icon-btn" data-act="hbBHoch" data-i="${i}" aria-label="Nach oben"${i?"":" disabled"}>${icon("hbHoch")}</button><button type="button" class="icon-btn" data-act="hbBRunter" data-i="${i}" aria-label="Nach unten"${i<HB_BL.length-1?"":" disabled"}>${icon("hbRunter")}</button><button type="button" class="icon-btn" data-act="hbBWeg" data-i="${i}" aria-label="Baustein löschen">${icon("del")}</button></div>
      ${hbBauKoerper(b,i)}</section>`; }).join("")}${hbBauPlus(HB_BL.length)}</div>`; }
function hbBauNeu(t){ return t==="liste"||t==="schritte"?{typ:t,punkte:["",""]}:t==="tabelle"?{typ:t,kopf:["",""],zeilen:[["",""],["",""]]}:t==="anruf"?{typ:t,name:"",nummer:""}:t==="link"?{typ:t,name:"",url:""}:t==="schaubild"?{typ:t,name:""}:{typ:t,text:""}; }
/* KI: aus Stichpunkten oder einem groben Text einen Artikel im Handbuch-Format machen */
const HB_KI_SYSTEM=`Du hilfst beim Betriebshandbuch eines kleinen Elektro-Handwerksbetriebs (Elektro Irrgang). Mach aus dem Text einen gut lesbaren Artikel auf Deutsch, kurz und praktisch für Monteure.
Antworte NUR mit dem Artikeltext in diesem Format, eine Sache pro Zeile, Leerzeile zwischen Blöcken:
## Zwischenüberschrift
Normaler Satz (mit **fett** für Wichtiges)
- Aufzählungspunkt
1. Schritt in fester Reihenfolge
> Hinweis, der auffallen soll
> ! Warnung (Sicherheit, Verbote)
| Spalte | Spalte |
|---|---|
| Zelle | Zelle |
[Name anrufen](tel:0123 456789)
[Linktext](https://…)
Schaubilder, nur wenn sie wirklich passen, als eigene Zeile: [[aderfarben]] (Aderfarben nach Baujahr), [[sicherheitsregeln]] (5 Sicherheitsregeln), [[arbeitstag]] (Arbeitszeit/Pausen-Rechnung).
Erfinde keine Fakten, Zahlen, Namen oder Telefonnummern. Was im Text fehlt oder unklar ist, als eigene Zeile mit „?? “ am Anfang notieren.`;
async function hbBauKi(){ if(typeof kiAn!=="function"||!kiAn()){ toast("KI ist noch nicht eingerichtet – Einstellungen › KI"); return; }
  const t=hbBauText(HB_BL); if(t.length<15){ toast("Erst ein paar Stichpunkte als Text-Baustein schreiben"); return; }
  const titel=($("#dlg").querySelector('[data-f="hbTitel"]')||{}).value||"";
  toast("KI bereitet den Artikel auf …");
  try{ const a=await kiFrage({system:HB_KI_SYSTEM,text:`Titel: ${titel}\n\n${t}`,maxTokens:2500});
    const B=hbBauLesen(String(a||"").replace(/^```\w*\n?|```$/g,"").trim()); if(!B.length){ toast("Die KI hat nichts Brauchbares geliefert"); return; }
    HB_BAU_VORHER=HB_BL; HB_BL=B; HB_BAU_MODUS="vorschau"; hbBauZeigen(); toast("Fertig – in der Vorschau prüfen, „Rückgängig“ holt deinen Text zurück"); }
  catch(e){ toast("KI: "+(e.message||e)); } }
document.addEventListener("input",e=>{ const f=e.target.closest&&e.target.closest("[data-hbb]"); if(!f) return; const b=HB_BL[+f.dataset.hbb], k=f.dataset.k; if(!b) return; let m;
  if((m=k.match(/^p(\d+)$/))) b.punkte[+m[1]]=f.value; else if((m=k.match(/^k(\d+)$/))) b.kopf[+m[1]]=f.value; else if((m=k.match(/^z(\d+)_(\d+)$/))) b.zeilen[+m[1]][+m[2]]=f.value; else b[k]=f.value;
  const h=$("#dlg").querySelector('[data-f="hbInhalt"]'); if(h) h.value=hbBauText(HB_BL);
  if(f.tagName==="TEXTAREA"){ f.style.height="auto"; f.style.height=f.scrollHeight+"px"; } });
document.addEventListener("click",e=>{ const el=e.target.closest&&e.target.closest('[data-act^="hbB"]'); if(!el||el.disabled) return; e.stopPropagation(); const a=el.dataset.act, i=+el.dataset.i, b=HB_BL[i];
  if(a==="hbBPlus"){ HB_BAU_PLUS=el.dataset.i===""?null:i; hbBauZeigen(); return; }
  if(a==="hbBNeu"){ HB_BL.splice(i,0,hbBauNeu(el.dataset.t)); HB_BAU_PLUS=null; hbBauZeigen(); const f=document.querySelector(`#hbBau [data-hbb="${i}"]`); if(f) f.focus(); return; }
  if(a==="hbBWeg"){ HB_BL.splice(i,1); hbBauZeigen(); return; }
  if(a==="hbBHoch"&&i>0){ [HB_BL[i-1],HB_BL[i]]=[HB_BL[i],HB_BL[i-1]]; hbBauZeigen(); return; }
  if(a==="hbBRunter"&&i<HB_BL.length-1){ [HB_BL[i+1],HB_BL[i]]=[HB_BL[i],HB_BL[i+1]]; hbBauZeigen(); return; }
  if(a==="hbBPNeu"&&b){ b.punkte.push(""); hbBauZeigen(); const f=document.querySelector(`#hbBau [data-hbb="${i}"][data-k="p${b.punkte.length-1}"]`); if(f) f.focus(); return; }
  if(a==="hbBPWeg"&&b){ b.punkte.splice(+el.dataset.j,1); hbBauZeigen(); return; }
  if(a==="hbBZNeu"&&b){ b.zeilen.push(b.kopf.map(()=>"")); hbBauZeigen(); return; }
  if(a==="hbBZWeg"&&b){ b.zeilen.splice(+el.dataset.z,1); hbBauZeigen(); return; }
  if(a==="hbBSNeu"&&b){ b.kopf.push(""); b.zeilen.forEach(r=>r.push("")); hbBauZeigen(); return; }
  if(a==="hbBSWeg"&&b){ const c=+el.dataset.c; b.kopf.splice(c,1); b.zeilen.forEach(r=>r.splice(c,1)); hbBauZeigen(); return; }
  if(a==="hbBSb"&&b){ b.name=el.dataset.k; hbBauZeigen(); return; }
  if(a==="hbBFett"&&b){ const f=document.querySelector(`#hbBau textarea[data-hbb="${i}"]`); if(!f) return; const s=f.selectionStart, en=f.selectionEnd; if(s===en){ toast("Erst Text markieren, dann Fett"); return; }
    b.text=f.value.slice(0,s)+"**"+f.value.slice(s,en)+"**"+f.value.slice(en); hbBauZeigen(); return; }
  if(a==="hbBModus"){ HB_BAU_MODUS=el.dataset.k; hbBauZeigen(); return; }
  if(a==="hbBKi"){ hbBauKi(); return; }
  if(a==="hbBKiZurueck"){ if(HB_BAU_VORHER){ HB_BL=HB_BAU_VORHER; HB_BAU_VORHER=null; HB_BAU_MODUS="bau"; hbBauZeigen(); } return; }
},true);
