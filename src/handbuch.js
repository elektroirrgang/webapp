/* ===== Betriebshandbuch (Übersicht, 04.11.2026) =====
   Entscheidungen Max: Entwürfe zu jedem Kapitel (handbuch-vorlage.js), alle dürfen Änderungen vorschlagen, Chef/Büro geben frei;
   Suche, Fotos, „Gelesen“-Bestätigung (Nachweis z. B. für Unterweisungen), Checklisten zum Abhaken, Links aus den anderen Apps (#hb=<id>).
   Daten: Datenart „handbuch“ – je Artikel ein Datensatz {id,kapitel,titel,inhalt,checkliste[],fotos[],stand,frei:{von,am},verfasser?,ausgabe?,vorschlaege[],apps[]}.
   verfasser = wer den Text geschrieben hat (eingespieltes Handbuch: Joachim Irrgang), ausgabe = Stand der Vorlage („05.2026“) –
   gilt, solange der Artikel unverändert ist; jede neue Freigabe nimmt „ausgabe“ weg.
   Ein Entwurf aus der Vorlage existiert nur im Code, bis er bearbeitet oder freigegeben wird. stand>0 = gültig.
   Keine Lesepflicht (Max 27.11.2026: „gezwungenes Gelesen macht keinen Sinn“) – stattdessen werden kürzlich neue oder
   geänderte Artikel 14 Tage lang markiert. Alte profile.hbGelesen-Einträge bleiben liegen, werden aber nicht mehr benutzt. */
const hbDarf=()=>typeof anfVerw==="function"?anfVerw():!!ME.admin;
function hbAlle(){ const R=new Map(live("handbuch").map(r=>[r.id,r])), out=[];
  HB_VORLAGE.forEach(v=>{ const r=R.get(v.id); out.push(r?{...v,...r,vorlage:true}:{...v,vorlage:true,neu:true}); R.delete(v.id); });
  R.forEach(r=>out.push({...r}));
  const ord=Object.fromEntries(HB_KAPITEL.map(([k],i)=>[k,i]));
  out.forEach(a=>{ if(HB_KAP_ALT[a.kapitel]) a.kapitel=HB_KAP_ALT[a.kapitel]; });
  return out.map(a=>({...a,checkliste:a.checkliste||[],fotos:a.fotos||[],vorschlaege:(a.vorschlaege||[]).filter(x=>!x.erledigt)}))
    .sort((a,b)=>(ord[a.kapitel]??99)-(ord[b.kapitel]??99)||(a.ord??500)-(b.ord??500)); }
const hbArt=id=>hbAlle().find(a=>a.id===id)||null;
const hbGilt=a=>+a.stand>0;
const HB_VERFASSER="Joachim Irrgang";
/* „Ausgabe 05.2026“ (eingespielt, unverändert) oder „Stand 2 vom 03.12.2026“ */
const hbStandText=(a,lang)=>a.ausgabe?`Ausgabe ${a.ausgabe}`:lang?`Stand ${a.stand} vom ${ecDatumKurz(a.frei&&a.frei.am)}`:`Stand ${a.stand} · ${ecDatumKurz(a.frei&&a.frei.am)}`;
/* neu oder geändert in den letzten 14 Tagen – eingespielte, unveränderte Artikel (mit „ausgabe“) zählen nicht */
const hbKuerzlich=()=>{ const ab=new Date(Date.now()-14*864e5).toISOString().slice(0,10); return hbAlle().filter(a=>hbGilt(a)&&!a.ausgabe&&String(a.frei&&a.frei.am||"")>=ab); };
const hbNeuText=a=>+a.stand>1?"geändert":"neu";
/* einfacher Text → HTML: ## Überschrift, - Liste, 1. Liste, **fett**, Leerzeile = Absatz.
   27.11.2026 dazu: [Text](https://…) Link, [Text](tel:…) Anruf-Knopf, „> “ Hinweis, „?? “ noch offen (nur Chef/Büro sehen es),
   „| a | b |“ Tabelle (leere erste Zelle = gehört zur Gruppe darüber → Karten), [[aderfarben]] Aderfarben nach Baujahr, [[sicherheitsregeln]] Schaubild 5 Sicherheitsregeln, <br> in Zellen. */
const HB_FARBE={"grün-gelb":"gg","gr/gb":"gg","grüngelb":"gg",hellgrau:"#cfd0d6",hellblau:"#62aee8",schwarz:"#202124",braun:"#8a5a2b",grau:"#8e9096",blau:"#2a6fdb",rot:"#d93025"};
const hbAder=f=>{ const c=HB_FARBE[String(f).toLowerCase()]; return c==="gg"?`<i class="hb-ader gg" title="grün-gelb"></i>`:c?`<i class="hb-ader" style="--f:${c}" title="${esc(f)}"></i>`:""; };
const hbAdern=t=>String(t).split(/\s+/).map(hbAder).join("");
function hbInl(s){ return esc(s).replace(/&lt;br&gt;/g,"<br>").replace(/\*\*(.+?)\*\*/g,"<b>$1</b>")
  .replace(/\[([^\]]+)\]\((tel:[+\d ]+)\)/g,(m,t,u)=>`<a class="hb-tel" href="tel:${u.slice(4).replace(/\s/g,"")}">${icon("phone")}<span>${t}<small>${u.slice(4)}</small></span></a>`)
  .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g,(m,t,u)=>`<a href="${u}" target="_blank" rel="noopener">${t}</a>`); }
function hbZelle(s){ const m=String(s).match(/^(.*?)\s*(\(.*\))\s*$/), haupt=m?m[1]:String(s), klein=m?m[2]:"";
  const F=haupt.match(/grün-gelb|gr\/gb|hellgrau|hellblau|schwarz|braun|grau|blau|rot/gi)||[];
  return `${F.length?`<span class="hb-dots">${F.map(hbAder).join("")}</span>`:""}<span>${hbInl(haupt)}${klein?` <small>${esc(klein)}</small>`:""}</span>`; }
function hbTabelle(T){ const K=T[0], R=T.slice(1); if(!R.length) return "";
  if(R.some(r=>!r[0])){ const G=[]; R.forEach(r=>{ if(r[0]||!G.length) G.push({t:r[0],z:[]}); if(r.slice(1).some(Boolean)) G[G.length-1].z.push(r.slice(1)); });
    const n=K.length-1;
    return `<div class="hb-gruppen">${G.map(g=>`<section class="hb-gr"><h4>${hbInl(g.t)}</h4><div class="hb-gr-t" style="--n:${n}">${K.slice(1).map(k=>`<span class="hb-gr-k">${esc(k)}</span>`).join("")}${g.z.map(z=>K.slice(1).map((_,i)=>`<span class="hb-gr-c">${hbZelle(z[i]||"")}</span>`).join("")).join("")}</div></section>`).join("")}</div>`; }
  return `<div class="hb-tab-w"><table class="hb-tab"><thead><tr>${K.map(k=>`<th>${hbInl(k)}</th>`).join("")}</tr></thead><tbody>${R.map(r=>`<tr>${K.map((_,i)=>`<td>${hbZelle(r[i]||"")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`; }
function hbMd(t,o={}){ const Z=String(t||"").replace(/\r/g,"").split("\n"); let h="", liste="", tab=null, offen=null;
  const zu=()=>{ if(liste){ h+=`</${liste}>`; liste=""; } if(tab){ h+=hbTabelle(tab); tab=null; }
    if(offen){ if(!o.druck&&hbDarf()) h+=`<div class="hb-offen">${icon("warn")}<div><b>Noch offen – nur für Chef und Büro sichtbar</b>${offen.map(x=>`<p>${hbInl(x)}</p>`).join("")}</div></div>`; offen=null; } };
  Z.forEach(z=>{ const s=z.trim(); let m;
    if(/^\?\?/.test(s)){ const x=s.replace(/^\?\?\s*/,""); if(!offen){ zu(); offen=[]; } offen.push(x); return; }
    if(s.startsWith("|")){ const c=s.replace(/^\||\|$/g,"").split("|").map(x=>x.trim()); if(/^[-:\s|]+$/.test(s)) return; if(!tab){ zu(); tab=[]; } tab.push(c); return; }
    if(!s){ zu(); return; }
    if(s==="[[aderfarben]]"){ zu(); h+=hbAderfarben(o.druck); return; }
    if(s==="[[sicherheitsregeln]]"){ zu(); h+=hbSicherheitsregeln(o.druck); return; }
    if((m=s.match(/^>\s*(.+)/))){ zu(); h+=`<div class="hb-hinweis">${icon("info")}<p>${hbInl(m[1])}</p></div>`; return; }
    if((m=s.match(/^##\s+(.+)/))){ zu(); h+=`<h3>${hbInl(m[1])}</h3>`; return; }
    if((m=s.match(/^[-•·]\s+(.+)/))){ if(liste!=="ul"){ zu(); h+="<ul>"; liste="ul"; } h+=`<li>${hbInl(m[1])}</li>`; return; }
    if((m=s.match(/^\d+\.\s+(.+)/))){ if(liste!=="ol"){ zu(); h+="<ol>"; liste="ol"; } h+=`<li>${hbInl(m[1])}</li>`; return; }
    zu(); h+=`<p>${hbInl(s)}</p>`; }); zu(); return h; }
const hbOffen=a=>/(^|\n)\s*\?\?/.test(a.inhalt||"");
/* Aderfarben nach Baujahr – Inhalt aus dem Betriebshandbuch, Tabellen ab 2003 nach DIN VDE 0293-308 */
const HB_AF=[
 {k:"1930",t:"1930–1938",z:[["Nullleiter","hellgrau"],["Außenleiter","schwarz rot blau"]],a:[["2 Adern","hellgrau schwarz"],["3 Adern","hellgrau schwarz rot"],["4 Adern","hellgrau schwarz rot blau"]],h:"Kein eigener Schutzleiter. Die hellgraue Ader ist der Nullleiter (entspricht etwa dem heutigen PEN)."},
 {k:"1939",t:"1939–1964",z:[["Nullleiter (feste Anlage)","hellgrau"],["Schutzleiter (ortsveränderliche Geräte)","rot"],["Außenleiter","schwarz rot blau"]],a:[["2 Adern","hellgrau schwarz"],["3 Adern","hellgrau schwarz rot"],["4 Adern","hellgrau schwarz rot blau"],["5 Adern","hellgrau schwarz rot blau schwarz"]],h:"Ab 1958 darf die rote Ader auch in der festen Anlage Schutzleiter sein – aber nur, wenn neben dem Nullleiter ein eigener Schutzleiter verlegt ist."},
 {k:"1965",t:"1965–2002",z:[["Nullleiter (PEN)","grün-gelb"],["Mittelleiter","hellblau"],["Schutzleiter (auch nachverlegt)","grün-gelb"]],a:[],h:"Ab 1973 mit den Kurzzeichen Mp/SL (Nullleiter), Mp (Mittelleiter) und SL (Schutzleiter)."},
 {k:"2003",t:"ab 2003",z:[["Schutzleiter PE","grün-gelb"],["Neutralleiter N","blau"],["L1","braun"],["L2","schwarz"],["L3","grau"]],a:[["3 Adern mit PE","grün-gelb blau braun"],["4 Adern mit PE","grün-gelb braun schwarz grau"],["5 Adern mit PE","grün-gelb blau braun schwarz grau"],["2 Adern ohne PE","blau braun"],["3 Adern ohne PE","braun schwarz grau"],["4 Adern ohne PE","blau braun schwarz grau"],["5 Adern ohne PE","blau braun schwarz grau schwarz"]],h:"Nach DIN VDE 0293-308: Tabelle 1 für Leitungen mit grün-gelber Ader, Tabelle 2 ohne."}];
let HB_AFK="2003";
function hbAfZeit(e){ return `<div class="hb-af-zeit"><h4>${esc(e.t)}</h4><div class="hb-af-l">${e.z.map(([n,f])=>`<span class="hb-af-n">${esc(n)}</span><span class="hb-dots">${hbAdern(f)}</span><span class="hb-af-f">${esc(f.replace(/ /g,", "))}</span>`).join("")}</div>
  ${e.a.length?`<div class="hb-af-sub">Adern je Leitung</div><div class="hb-af-l">${e.a.map(([n,f])=>`<span class="hb-af-n">${esc(n)}</span><span class="hb-dots">${hbAdern(f)}</span><span class="hb-af-f">${esc(f.replace(/ /g,", "))}</span>`).join("")}</div>`:""}
  <p class="hb-af-h">${esc(e.h)}</p></div>`; }
function hbAderfarben(druck){ if(druck) return `<div class="hb-af">${HB_AF.map(hbAfZeit).join("")}</div>`;
  const e=HB_AF.find(x=>x.k===HB_AFK)||HB_AF[HB_AF.length-1];
  return `<div class="hb-af"><div class="hb-af-lbl">Baujahr der Anlage</div><div class="hb-af-seg" role="tablist">${HB_AF.map(x=>`<button type="button" role="tab" data-act="hbAf" data-k="${x.k}" aria-selected="${x===e}">${esc(x.t)}</button>`).join("")}</div>${hbAfZeit(e)}
    <div class="hb-hinweis warn">${icon("warn")}<p>Farben in Altanlagen nie trauen – vor dem Anklemmen messen.</p></div></div>`; }
/* Die fünf Sicherheitsregeln als Schaubild (DIN VDE 0105-100) – [[sicherheitsregeln]] oder automatisch im Artikel „Die fünf Sicherheitsregeln“.
   Zwei Richtungen: „Vor der Arbeit“ 1 → 5, „Nach der Arbeit“ in umgekehrter Reihenfolge 5 → 1. */
const HB5_SVG=(()=>{ const K="var(--on-surface)";
  /* gemeinsame Verläufe – realistische Farben, unabhängig vom Hell-/Dunkelmodus */
  const defs=`<defs>
    <linearGradient id="h5ls" x1="0" x2="1"><stop offset="0" stop-color="#d9dbde"/><stop offset=".18" stop-color="#f7f7f8"/><stop offset=".85" stop-color="#eceef0"/><stop offset="1" stop-color="#c9ccd0"/></linearGradient>
    <linearGradient id="h5cu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0b183"/><stop offset=".45" stop-color="#c8743f"/><stop offset="1" stop-color="#8a4a22"/></linearGradient>
    <linearGradient id="h5gelb" x1="0" x2="1"><stop offset="0" stop-color="#e3a400"/><stop offset=".35" stop-color="#ffd23f"/><stop offset="1" stop-color="#d99a00"/></linearGradient>
    <linearGradient id="h5sw" x1="0" x2="1"><stop offset="0" stop-color="#111"/><stop offset=".4" stop-color="#3a3a3a"/><stop offset="1" stop-color="#151515"/></linearGradient>
    <linearGradient id="h5rail" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c7cbcf"/><stop offset=".5" stop-color="#eef0f2"/><stop offset="1" stop-color="#9ea3a8"/></linearGradient>
    <linearGradient id="h5matte" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb21a"/><stop offset="1" stop-color="#e88a00"/></linearGradient>
    <pattern id="h5riefen" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 6L6 0" stroke="#c46f00" stroke-width="1" opacity=".55"/></pattern></defs>`;
  /* 1-poliger LS (18 mm) auf Hutschiene: Klemmschrauben, Typschild, Kipphebel unten = AUS */
  const ls=(x,y,an,lbl="B16")=>`<g transform="translate(${x} ${y})">
    <rect width="30" height="86" rx="3" fill="url(#h5ls)" stroke="#9aa0a6"/><rect x="3" y="4" width="24" height="12" rx="2" fill="#dfe2e5"/><circle cx="15" cy="10" r="4" fill="#b8bcc0" stroke="#7d8287"/><path d="M12 10h6M15 7v6" stroke="#6b7075" stroke-width="1.2"/>
    <rect x="3" y="70" width="24" height="12" rx="2" fill="#dfe2e5"/><circle cx="15" cy="76" r="4" fill="#b8bcc0" stroke="#7d8287"/><path d="M12 76h6M15 73v6" stroke="#6b7075" stroke-width="1.2"/>
    <rect x="6" y="22" width="18" height="30" rx="3" fill="#c4c8cc"/><rect x="8" y="${an?23:36}" width="14" height="15" rx="2.5" fill="${an?"#2b2b2b":"#3a3a3a"}"/><rect x="8" y="${an?23:36}" width="14" height="3" rx="1.5" fill="#5a5a5a"/>
    <text x="15" y="62" text-anchor="middle" font-size="7.5" font-weight="800" fill="#333">${lbl}</text><text x="25" y="${an?28:50}" font-size="6" font-weight="800" fill="${an?"#c62828":"#2e7d32"}">${an?"I":"0"}</text></g>`;
  const schiene=(x,y,w)=>`<rect x="${x}" y="${y}" width="${w}" height="10" fill="url(#h5rail)"/>${Array.from({length:Math.floor(w/14)},(_,i)=>`<rect x="${x+5+i*14}" y="${y+3}" width="6" height="4" rx="1" fill="#8d9297"/>`).join("")}`;
  const blitzAus=(x,y)=>`<g transform="translate(${x} ${y})"><circle cx="26" cy="26" r="25" fill="#fff" stroke="#c62828" stroke-width="4"/><path d="M30 8L16 29h9l-4 16 15-22h-9z" fill="#f2b705" stroke="#5a4500" stroke-width="1"/><path d="M8 44L44 8" stroke="#c62828" stroke-width="5" stroke-linecap="round"/></g>`;
  const schloss=(x,y)=>`<g transform="translate(${x} ${y})"><path d="M7 16V10a8 8 0 0 1 16 0v6" fill="none" stroke="#b9bec3" stroke-width="3.5"/><rect x="2" y="15" width="26" height="22" rx="4" fill="#d32f2f"/><rect x="2" y="15" width="26" height="5" rx="2" fill="#ef5350"/><circle cx="15" cy="25" r="3" fill="#222"/><path d="M15 26v5" stroke="#222" stroke-width="2"/></g>`;
  const schild=(x,y)=>`<g transform="translate(${x} ${y})"><rect width="104" height="70" rx="4" fill="#fff" stroke="#c62828" stroke-width="4"/><circle cx="22" cy="24" r="13" fill="#fff" stroke="#c62828" stroke-width="3.5"/><path d="M13 33l18-18" stroke="#c62828" stroke-width="3.5"/><path d="M24 15l-6 9h5l-2 8 7-10h-5z" fill="#222"/>
    <text x="41" y="21" font-size="11.5" font-weight="900" fill="#222">Nicht</text><text x="41" y="34" font-size="11.5" font-weight="900" fill="#222">schalten!</text><text x="8" y="56" font-size="10" font-weight="700" fill="#222">Es wird gearbeitet</text></g>`;
  /* Sammelschienen / Leiter */
  const schienen=(x,y,w)=>[0,1,2].map(i=>`<rect x="${x}" y="${y+i*26}" width="${w}" height="12" rx="2" fill="url(#h5cu)"/><text x="${x-6}" y="${y+i*26+10}" text-anchor="end" font-size="10" font-weight="800" fill="${K}">L${i+1}</text>`).join("");
  return [
    /* 1 Freischalten: drei LS auf Hutschiene, alle auf 0 */
    `${defs}${schiene(24,52,124)}${ls(28,14,false)}${ls(66,14,false)}${ls(104,14,false)}
     <path d="M156 34v40" stroke="#1565c0" stroke-width="5" stroke-linecap="round"/><path d="M147 66l9 12 9-12" fill="#1565c0"/><text x="156" y="94" text-anchor="middle" font-size="10" font-weight="800" fill="${K}">AUS</text>${blitzAus(206,30)}`,
    /* 2 Sichern: LS mit Sperrelement + Vorhängeschloss, Verbotsschild */
    `${defs}${schiene(20,52,60)}${ls(34,14,false)}<rect x="37" y="48" width="24" height="12" rx="3" fill="#d32f2f"/><circle cx="49" cy="54" r="3" fill="#7a1212"/>${schloss(34,62)}
     ${schild(150,40)}`,
    /* 3 Spannungsfreiheit: zweipoliger Spannungsprüfer (gelb/schwarz, Anzeige, LED-Skala, Spiralkabel, zweiter Griff) an Klemmen L und N */
    `${defs}<g transform="rotate(-8 70 70)"><rect x="40" y="14" width="56" height="104" rx="14" fill="url(#h5gelb)" stroke="#8a6200"/><rect x="44" y="70" width="48" height="44" rx="10" fill="url(#h5sw)"/>
       <rect x="50" y="22" width="36" height="20" rx="3" fill="#cfe3c8" stroke="#555"/><text x="68" y="37" text-anchor="middle" font-size="13" font-weight="900" font-family="monospace" fill="#1d3b16">0 V</text>
       ${["12","24","50","120","230","400"].map((v,i)=>`<circle cx="${52+i*6.4}" cy="50" r="2.4" fill="${i?"#7a8a80":"#43a047"}"/>`).join("")}<text x="68" y="62" text-anchor="middle" font-size="6.5" font-weight="700" fill="#5a4500">12 · 50 · 120 · 230 · 400</text>
       <rect x="62" y="0" width="12" height="16" rx="3" fill="#222"/><rect x="66" y="-14" width="4" height="16" fill="#c0c4c8"/>
       <circle cx="58" cy="92" r="6" fill="#444"/><circle cx="78" cy="92" r="6" fill="#444"/></g>
     <path d="M84 118c8 12 16-4 24 6s16-8 24 4 16-8 24 2 12-6 40-12" stroke="#1a1a1a" stroke-width="4" fill="none" stroke-linecap="round"/>
     <g transform="rotate(14 190 70)"><rect x="176" y="40" width="26" height="76" rx="11" fill="url(#h5sw)"/><rect x="176" y="40" width="26" height="22" rx="10" fill="url(#h5gelb)"/><rect x="185" y="22" width="8" height="20" rx="2" fill="#222"/><rect x="187.5" y="8" width="3" height="16" fill="#c0c4c8"/></g>
     <g transform="translate(232 18)"><rect width="56" height="58" rx="6" fill="#e9ebed" stroke="#9aa0a6"/>${["L","N","PE"].map((t,i)=>`<rect x="${6+i*17}" y="10" width="13" height="30" rx="2" fill="${["#8d5a3b","#1e88e5","#9ccc65"][i]}"/><circle cx="${12.5+i*17}" cy="18" r="3.5" fill="#b8bcc0" stroke="#666"/><text x="${12.5+i*17}" y="52" text-anchor="middle" font-size="8" font-weight="800" fill="#333">${t}</text>`).join("")}</g>
     <circle cx="276" cy="120" r="9" fill="#2e7d32"/><path d="M271 120l3.5 3.5 6.5-7" stroke="#fff" stroke-width="2.6" fill="none"/>`,
    /* 4 Erden und kurzschließen: Kupferschienen, Erdungsklemmen, Kurzschlussseil, grün-gelbes Erdungsseil zum Erder */
    `${defs}${schienen(30,14,250)}
     ${[0,1,2].map(i=>`<g transform="translate(150 ${8+i*26})"><rect x="-2" y="0" width="22" height="24" rx="3" fill="#5f6368"/><rect x="2" y="4" width="14" height="16" rx="2" fill="#80868b"/><rect x="6" y="-8" width="6" height="10" rx="1" fill="#3c4043"/></g>`).join("")}
     <path d="M168 18C188 26 188 38 168 44C188 52 188 64 168 70" stroke="#b0b0b0" stroke-width="5" fill="none"/><path d="M168 18C188 26 188 38 168 44C188 52 188 64 168 70" stroke="#d58a50" stroke-width="2" fill="none"/>
     <path d="M178 72C190 92 214 96 226 104" stroke="#2e7d32" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M178 72C190 92 214 96 226 104" stroke="#fdd835" stroke-width="6" stroke-dasharray="7 7" fill="none" stroke-linecap="round"/>
     <rect x="222" y="98" width="20" height="14" rx="3" fill="#5f6368"/><path d="M232 112v8M218 120h28M223 125h18M228 130h8" stroke="${K}" stroke-width="2.5"/>`,
    /* 5 Abdecken oder abschranken: isolierende Matte über Schienen, Absperrkette mit Pfosten und Warnzeichen */
    `${defs}${schienen(30,12,250)}
     <path d="M126 4h150a6 6 0 0 1 6 6v72a6 6 0 0 1-6 6H126z" fill="url(#h5matte)"/><path d="M126 4h150a6 6 0 0 1 6 6v72a6 6 0 0 1-6 6H126z" fill="url(#h5riefen)"/><rect x="126" y="4" width="6" height="84" fill="#c46f00"/>
     <g transform="translate(206 22)"><path d="M0 34L20 0l20 34z" fill="#f2b705" stroke="#222" stroke-width="2.5" stroke-linejoin="round"/><path d="M22 8l-7 13h6l-3 10 9-14h-6z" fill="#222"/></g>
     ${[34,108].map(x=>`<g transform="translate(${x} 86)"><rect x="-4" y="0" width="8" height="40" rx="2" fill="#fff" stroke="#b0b0b0"/>${[0,1,2].map(j=>`<rect x="-4" y="${4+j*12}" width="8" height="6" fill="#d32f2f"/>`).join("")}<ellipse cx="0" cy="40" rx="11" ry="3.5" fill="#d32f2f"/></g>`).join("")}
     <path d="M34 92Q71 110 108 92" stroke="#d32f2f" stroke-width="3" fill="none" stroke-dasharray="6 4"/><path d="M34 92Q71 110 108 92" stroke="#fff" stroke-width="3" fill="none" stroke-dasharray="6 4" stroke-dashoffset="5"/>`
  ].map(x=>`<svg viewBox="0 0 300 130" role="img" aria-hidden="true">${x}</svg>`); })();
const HB5=[
  {t:"Freischalten",k:"Anlage allpolig von allen Einspeisungen trennen – auch PV, Speicher, USV, Notstrom."},
  {t:"Gegen Wiedereinschalten sichern",k:"Abschließen, Sicherungen mitnehmen, Schild „Nicht schalten!“ mit Name und Datum."},
  {t:"Spannungsfreiheit feststellen",k:"An der Arbeitsstelle, allpolig – nur mit zweipoligem Spannungsprüfer.",h:"Prüfen – messen – prüfen: Prüfer vorher und nachher an einer bekannten Spannung testen. Kein Phasenprüfer, kein Multimeter."},
  {t:"Erden und kurzschließen",k:"Erst erden, dann kurzschließen – schützt, falls doch Spannung zurückkommt.",h:"Niederspannung: darf entfallen, wenn keine Spannung zurückkommen kann. Bei PV, Freileitung, Einspeisern und über 1.000 V immer."},
  {t:"Benachbarte, unter Spannung stehende Teile abdecken oder abschranken",k:"Was in der Nähe unter Spannung bleibt, isolierend abdecken oder abschranken."}];
/* Alle fünf auf einen Blick, untereinander – kein Durchklicken (Max 27.11.2026: „die Jungs haben keinen Bock, sich durchzuklicken“) */
function hbSicherheitsregeln(druck){
  return `<div class="hb5${druck?" druck":""}"><div class="hb5-kopf">Immer in dieser Reihenfolge</div>
    ${HB5.map((r,i)=>`<div class="hb5-r hb5-c${i+1}"><div class="hb5-bild">${HB5_SVG[i]}<span class="hb5-n">${i+1}</span></div>
      <h4 class="hb5-t">${esc(r.t)}</h4><p class="hb5-k">${esc(r.k)}</p>${r.h?`<p class="hb5-h">${icon("info")}<span>${esc(r.h)}</span></p>`:""}</div>`).join("")}
    <div class="hb5-fuss">${icon("warn")}<p><b>Keine Regel auslassen, Reihenfolge nicht ändern.</b> Nach der Arbeit geht es rückwärts: 5&nbsp;→&nbsp;1.</p></div></div>`; }
/* Artikel zu den Sicherheitsregeln bekommt das Schaubild auch ohne [[sicherheitsregeln]] im Text – ganz oben,
   die Erklärtexte darunter. Die nummerierte Liste „1. Freischalten … 5. …“ (samt Überschrift) entfällt dann. */
function hbMitSchaubild(a){ let t=String(a.inhalt||"");
  if(t.includes("[[sicherheitsregeln]]")||!(a.id==="hb-5sr"||/f(ü|ue)nf sicherheitsregeln|5 sicherheitsregeln/i.test(a.titel||""))) return t;
  t=t.replace(/(^|\n)(##[^\n]*\n)?\s*1\.\s*Freischalten[^\n]*(\n\s*[2-5]\.[^\n]*){4}/i,"\n");
  return "[[sicherheitsregeln]]\n\n"+t.trim(); }
let HB_Q="", HB_F="alle";
function hbUebersicht(){ const A=hbAlle(), q=HB_Q.trim().toLowerCase();
  const ung=hbKuerzlich(), entw=A.filter(a=>!hbGilt(a)), vor=A.filter(a=>a.vorschlaege.length);
  const off=hbDarf()?A.filter(hbOffen):[];
  let L=A; if(HB_F==="neu") L=ung; else if(HB_F==="entwurf") L=entw; else if(HB_F==="vorschlag") L=vor; else if(HB_F==="offen") L=off;
  if(q) L=L.filter(a=>suPasst(q,a.titel,a.inhalt,a.checkliste));
  const chip=(v,t,n)=>`<button type="button" class="chip" data-act="hbFilter" data-v="${v}" aria-pressed="${HB_F===v}">${t}${n!=null?` · ${n}`:""}</button>`;
  const item=a=>{ const st=!hbGilt(a)?pill("open","Entwurf"):ung.includes(a)?pill("wip",hbNeuText(a)):"";
    return `<div class="li" role="button" tabindex="0" data-act="hbAuf" data-id="${esc(a.id)}"><span class="av">${icon(a.checkliste.length?"check":"book")}</span><span class="lt"><span class="h">${esc(a.titel)}</span>
      <span class="s">${esc(hbGilt(a)?hbStandText(a):"noch nicht freigegeben")}${a.vorschlaege.length?` · ${a.vorschlaege.length} Vorschlag${a.vorschlaege.length===1?"":"e"}`:""}</span><span class="st">${st}</span></span>${icon("chev")}</div>`; };
  const nachKap=HB_KAPITEL.map(([k,t])=>[t,L.filter(a=>a.kapitel===k)]).concat([["Weitere",L.filter(a=>!HB_KAPITEL.some(([k])=>k===a.kapitel))]]).filter(([,X])=>X.length);
  return `<div class="narrow hb">
    <div class="search">${icon("search")}<input id="hbQ" type="search" value="${esc(HB_Q)}" placeholder="Im Handbuch suchen" autocomplete="off" aria-label="Im Handbuch suchen"></div>
    <div class="chips ec-wahl hb-filter">${chip("alle","Alle")}${ung.length?chip("neu","Kürzlich geändert",ung.length):""}${chip("entwurf","Entwürfe",entw.length)}${hbDarf()||vor.length?chip("vorschlag","Vorschläge",vor.length):""}${off.length?chip("offen","Offen",off.length):""}</div>
    ${nachKap.length?nachKap.map(([t,X])=>`<div class="sec-lbl">${esc(t)}</div>${listOf(X.map(item))}`).join(""):`<p class="meta" style="margin:16px 4px">${q?"Nichts gefunden.":"Hier ist gerade nichts."}</p>`}
    <div class="hb-aktionen"><button type="button" class="btn-tonal" data-act="hbDruck">${icon("druck")}Drucken oder als PDF</button>${hbEinspielDarf()?`<button type="button" class="btn-text" data-act="hbEinspielen">${icon("upload")}Handbuch einspielen</button>${hbEingespielt().length?`<button type="button" class="btn-text" data-act="hbVfDlg">${icon("person")}Verfasser und Ausgabe</button>`:""}`:""}</div>
    <p class="hint">${hbDarf()?"Entwürfe sind Vorschläge – erst nach deiner Freigabe gelten sie. Änderungsvorschläge der Kollegen landen unter „Vorschläge“.":"Fehlt etwas oder stimmt etwas nicht? Im Artikel „Änderung vorschlagen“ – der Chef gibt frei."}</p></div>`; }
const ecDatumKurz=iso=>iso?String(iso).slice(0,10).split("-").reverse().join("."):"";
/* Checklisten: abgehakt wird auf diesem Gerät (je Artikel), „Neu beginnen“ setzt zurück */
const hbCkKey=id=>"irrgang_hbck|"+id;
const hbCk=id=>{ try{ return JSON.parse(localStorage.getItem(hbCkKey(id))||"{}"); }catch(e){ return {}; } };
function hbArtikel(id){ const a=hbArt(id); if(!a) return `<div class="narrow"><p class="meta">Artikel nicht gefunden.</p></div>`; const ck=hbCk(a.id), n=a.checkliste.filter((_,i)=>ck[i]).length;
  const kap=(HB_KAPITEL.find(([k])=>k===a.kapitel)||[,""])[1];
  return `<div class="narrow hb hb-art">
    <p class="hb-meta">${esc([kap,a.verfasser?`von ${a.verfasser}`:"",hbGilt(a)?hbStandText(a,true)+(a.frei&&a.frei.von&&a.frei.von!==a.verfasser?`, freigegeben von ${a.frei.von}`:""):""].filter(Boolean).join(" · "))}</p>
    ${hbGilt(a)?"":`<div class="hb-entwurf">${icon("warn")}<span><b>Entwurf – noch nicht freigegeben.</b>${a.neu?" Vorschlag als Grundlage; bitte prüfen und an eure Praxis anpassen.":""}</span></div>`}
    <article class="hb-text">${hbMd(hbMitSchaubild(a))}</article>
    ${a.fotos.length?`<div class="hb-fotos">${a.fotos.map((f,i)=>`<button type="button" data-act="hbFoto" data-id="${esc(a.id)}" data-i="${i}"><img src="${esc(f)}" alt=""></button>`).join("")}</div>`:""}
    ${a.checkliste.length?`<section class="hb-ck"><div class="hb-ck-kopf"><b>Checkliste</b><span>${n} von ${a.checkliste.length}</span>${n?`<button type="button" class="btn-text" data-act="hbCkNeu" data-id="${esc(a.id)}">Neu beginnen</button>`:""}</div>
      ${a.checkliste.map((t,i)=>`<button type="button" class="hb-ck-z${ck[i]?" an":""}" data-act="hbCk" data-id="${esc(a.id)}" data-i="${i}" aria-pressed="${!!ck[i]}"><span class="hb-box"></span><span>${esc(t)}</span></button>`).join("")}</section>`:""}
    ${a.vorschlaege.length&&hbDarf()?`<div class="sec-lbl">Vorschläge</div>${a.vorschlaege.map(v=>`<section class="hb-vor"><p><b>${esc(v.von||"Jemand")}</b> · ${esc(ecDatumKurz(v.am))}${v.notiz?`<br>${esc(v.notiz)}`:""}</p>
      <details><summary>Vorgeschlagener Text ansehen</summary><div class="hb-text">${hbMd(v.inhalt)}</div>${(v.checkliste||[]).length?`<ul>${v.checkliste.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:""}</details>
      <div class="hb-vor-k"><button type="button" class="btn-text" data-act="hbVorWeg" data-id="${esc(a.id)}" data-v="${esc(v.id)}">Ablehnen</button><button type="button" class="btn-tonal" data-act="hbVorOk" data-id="${esc(a.id)}" data-v="${esc(v.id)}">Übernehmen und freigeben</button></div></section>`).join("")}`
      :a.vorschlaege.length?`<p class="meta">${a.vorschlaege.length} Vorschlag${a.vorschlaege.length===1?"":"e"} wartet auf Freigabe.</p>`:""}
    <div class="hb-fuss">${hbDarf()?`<button type="button" class="btn-tonal" data-act="hbEdit" data-id="${esc(a.id)}">${icon("edit")}Bearbeiten</button>${hbGilt(a)?"":`<button type="button" class="btn-filled" data-act="hbFrei" data-id="${esc(a.id)}">Freigeben</button>`}`
      :`<button type="button" class="btn-tonal" data-act="hbEdit" data-id="${esc(a.id)}">${icon("edit")}Änderung vorschlagen</button>`}</div></div>`; }
/* ---- Speichern ---- */
function hbRec(a){ const alt=DB.handbuch.get(a.id); return {r:alt||{id:a.id,kapitel:a.kapitel,titel:a.titel,inhalt:a.inhalt,checkliste:a.checkliste||[],fotos:a.fotos||[],apps:a.apps||[],stand:0,vorschlaege:[]},neu:!alt}; }
function hbFreigeben(id,w){ const a=hbArt(id); if(!a||!hbDarf()) return; const {r,neu}=hbRec(a); if(w) Object.assign(r,w);
  r.stand=(+r.stand||0)+1; r.frei={von:ME.name||"",am:today()}; delete r.ausgabe; r.deleted=false; saveRec("handbuch",r,neu); }
/* ---- Editor ---- */
let HB_ED=null;
function hbEditor(id){ const a=id?hbArt(id):{id:"hb-"+uid(),kapitel:HB_KAPITEL[0][0],titel:"",inhalt:"",checkliste:[],fotos:[],stand:0}; if(!a) return;
  HB_ED={id:a.id,neu:!id,fotos:[...(a.fotos||[])]}; const chef=hbDarf();
  dialog(id?(chef?"Artikel bearbeiten":"Änderung vorschlagen"):"Neuer Artikel",`<div class="fg1 hb-ed">
      ${tf("hbTitel","Titel",a.titel,{form:true,ph:"z. B. Verteiler bauen und beschriften"})}
      ${sf("hbKap","Kapitel",a.kapitel,HB_KAPITEL,{form:true})}
      ${ta("hbInhalt","Text",a.inhalt,{form:true,ph:"## Zwischenüberschrift\n- Aufzählung\n**fett**"})}
      ${ta("hbCk","Checkliste – ein Punkt pro Zeile (optional)",(a.checkliste||[]).join("\n"),{form:true})}
      <div class="hb-ed-fotos" id="hbEdFotos"></div>
      ${chef?"":ta("hbNotiz","Was hast du geändert und warum?","",{form:true,ph:"z. B. Steckdosenhöhe Küche bei uns 110 cm"})}
    </div>`,
    `<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-filled" data-act="hbEdOk">${chef?"Speichern und freigeben":"Vorschlag senden"}</button>`,{breit:true});
  hbEdFotos(); }
function hbEdFotos(){ const el=document.getElementById("hbEdFotos"); if(!el||!HB_ED) return;
  el.innerHTML=`<div class="lbl">Fotos (${HB_ED.fotos.length} von 4)</div><div class="hb-fotos">${HB_ED.fotos.map((f,i)=>`<span class="hb-ed-f"><img src="${esc(f)}" alt=""><button type="button" data-act="hbEdFotoWeg" data-i="${i}" aria-label="Foto entfernen">${icon("close")}</button></span>`).join("")}
    ${HB_ED.fotos.length<4?`<button type="button" class="hb-ed-plus" data-act="hbEdFotoNeu" aria-label="Foto hinzufügen">${icon("cam")}</button>`:""}</div>`; }
function hbEdOk(){ if(!HB_ED) return; const F=formVals(), t=(F.hbTitel||"").trim(); if(!t){ toast("Bitte einen Titel eingeben"); return; }
  const w={titel:t,kapitel:F.hbKap||HB_KAPITEL[0][0],inhalt:F.hbInhalt||"",checkliste:String(F.hbCk||"").split("\n").map(x=>x.trim()).filter(Boolean),fotos:HB_ED.fotos};
  const a=HB_ED.neu?{id:HB_ED.id,...w,stand:0}:hbArt(HB_ED.id); if(!a) return;
  if(hbDarf()){ if(HB_ED.neu){ saveRec("handbuch",{id:a.id,...w,apps:[],stand:1,frei:{von:ME.name||"",am:today()},vorschlaege:[]},true); } else hbFreigeben(a.id,w);
    const id=a.id; HB_ED=null; closeOverlays(); go({v:"hb",id}); toast("Gespeichert und freigegeben"); return; }
  const {r,neu}=hbRec(a); r.vorschlaege=(r.vorschlaege||[]).filter(x=>!x.erledigt); r.vorschlaege.push({id:uid(),von:ME.name||"",mail:ME.mail||"",am:today(),...w,notiz:(F.hbNotiz||"").trim()});
  saveRec("handbuch",r,neu); HB_ED=null; closeOverlays(); render(); toast("Vorschlag gesendet – Chef oder Büro geben frei"); }
function hbFotoDazu(){ const i=document.createElement("input"); i.type="file"; i.accept="image/*"; i.style.display="none"; document.body.appendChild(i);
  i.onchange=async()=>{ const f=i.files&&i.files[0]; i.remove(); if(!f||!HB_ED) return; try{ HB_ED.fotos.push(await (typeof kiBild==="function"?kiBild(f,1000):fotoVerkleinern(f))); hbEdFotos(); }catch(e){ toast("Foto konnte nicht gelesen werden"); } }; i.click(); }
/* ---- Handbuch einspielen (27.11.2026): JSON-Datei {art:"irrgang-betriebshandbuch",artikel:[{id,kapitel,ord,titel,inhalt,checkliste}]}
   Der Text liegt NICHT im Code (Repo ist öffentlich), sondern wird einmal eingespielt und dann über SharePoint verteilt. */
IC.druck=IC.druck||"M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z";
const hbEinspielDarf=()=>hbDarf()||(typeof istEntwickler==="function"&&istEntwickler());
let HB_EIN=null;
function hbEinspielen(){ const i=document.createElement("input"); i.type="file"; i.accept=".json,application/json"; i.style.display="none"; document.body.appendChild(i);
  i.onchange=async()=>{ const f=i.files&&i.files[0]; i.remove(); if(!f) return; let d=null; try{ d=JSON.parse(await f.text()); }catch(e){}
    if(!d||d.art!=="irrgang-betriebshandbuch"||!Array.isArray(d.artikel)||!d.artikel.length){ toast("Das ist keine Handbuch-Datei"); return; }
    const L=d.artikel.filter(x=>x&&x.id&&x.titel), alt=L.filter(x=>DB.handbuch.get(x.id)), frei=alt.filter(x=>+DB.handbuch.get(x.id).stand>0);
    HB_EIN=L; dialog("Handbuch einspielen",`<p class="sup" style="margin:0 0 12px">${L.length} Artikel aus „${esc(f.name)}“${d.stand?` (Stand ${esc(d.stand)})`:""}. Sie gelten danach sofort für alle.</p>
      ${listOf(HB_KAPITEL.map(([k,t])=>{ const n=L.filter(x=>x.kapitel===k).length; return n?`<div class="li"><span class="lt"><span class="h">${esc(t)}</span><span class="s">${n} Artikel</span></span></div>`:""; }).filter(Boolean))}
      <div class="fg1" style="margin-top:12px">${tf("hbEinVon","Verfasst von",d.verfasser||HB_VERFASSER,{form:true})}${tf("hbEinAusg","Ausgabe",d.stand||"",{form:true,ph:"z. B. 05.2026"})}</div>
      ${alt.length?`<p class="sup" style="margin:12px 0 0">${alt.length} davon ersetzen vorhandene Artikel${frei.length?`, ${frei.length} davon schon freigegeben – Fotos und Vorschläge bleiben erhalten`:" (bisher nur Entwürfe)"}.</p>`:""}`,
      `<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-filled" data-act="hbEinOk">Einspielen</button>`); };
  i.click(); }
/* Verfasser/Ausgabe nachträglich setzen – OHNE neuen Stand, damit niemand alles neu lesen muss.
   Betrifft die eingespielten Artikel (haben „ord“); Freigabe-Name nur bei unveränderten (Stand 1). */
const hbEingespielt=()=>hbAlle().filter(a=>hbGilt(a)&&a.ord!=null&&DB.handbuch.get(a.id));
function hbVerfDlg(){ const L=hbEingespielt(); if(!L.length){ toast("Keine eingespielten Artikel"); return; } const a0=L.find(a=>a.ausgabe)||{};
  dialog("Verfasser und Ausgabe",`<p class="sup" style="margin:0 0 12px">Gilt für die ${L.length} eingespielten Artikel. Der Stand bleibt gleich – niemand muss deshalb neu lesen.</p>
    <div class="fg1">${tf("hbVfVon","Verfasst von",L.find(a=>a.verfasser)?.verfasser||HB_VERFASSER,{form:true})}${tf("hbVfAusg","Ausgabe",a0.ausgabe||"05.2026",{form:true,ph:"z. B. 05.2026"})}</div>`,
    `<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-filled" data-act="hbVfOk">Übernehmen</button>`); }
function hbVfOk(){ if(!hbEinspielDarf()) return; const fv=formVals(), von=String(fv.hbVfVon||"").trim(), ausg=String(fv.hbVfAusg||"").trim(); let n=0;
  hbEingespielt().forEach(a=>{ const r=DB.handbuch.get(a.id); if(!r) return;
    if(von) r.verfasser=von; else delete r.verfasser;
    if(+r.stand===1){ if(von) r.frei={...(r.frei||{}),von}; if(ausg) r.ausgabe=ausg; else delete r.ausgabe; }
    saveRec("handbuch",r,false); n++; });
  closeOverlays(); render(); toast(`${n} Artikel geändert`); }
function hbEinOk(){ if(!HB_EIN||!hbEinspielDarf()) return; const L=HB_EIN; HB_EIN=null; const fv=formVals(), von=String(fv.hbEinVon||"").trim(), ausg=String(fv.hbEinAusg||"").trim();
  L.forEach(x=>{ const alt=DB.handbuch.get(x.id), r=alt||{id:x.id,fotos:[],apps:[],vorschlaege:[],stand:0};
    Object.assign(r,{kapitel:x.kapitel||"allgemein",ord:+x.ord||500,titel:x.titel,inhalt:x.inhalt||"",checkliste:x.checkliste||[]});
    r.stand=(+r.stand||0)+1; r.frei={von:von||ME.name||"",am:today()}; if(von) r.verfasser=von; else delete r.verfasser; if(ausg) r.ausgabe=ausg; else delete r.ausgabe;
    r.deleted=false; saveRec("handbuch",r,!alt); });
  closeOverlays(); HB_F="alle"; render(); toast(`${L.length} Artikel eingespielt und freigegeben`); }
/* ---- Drucken / PDF: alle freigegebenen Artikel als A4-Dokument (Druckbereich bleibt bis zur nächsten Berührung – Android meldet „fertig“ zu früh) ---- */
function hbDruckWeg(){ document.getElementById("hbDruck")?.remove(); document.getElementById("hbDruckSeite")?.remove(); document.body.classList.remove("hb-druckt"); }
const hbDruckbar=a=>String(a.inhalt||"").split("\n").some(z=>z.trim()&&!/^\?\?/.test(z.trim()))||(a.checkliste||[]).length;
function hbDrucken(){ const A=hbAlle().filter(a=>hbGilt(a)&&hbDruckbar(a)); if(!A.length){ toast("Noch keine freigegebenen Artikel"); return; } hbDruckWeg();
  const K=HB_KAPITEL.map(([k,t])=>[t,A.filter(a=>a.kapitel===k)]).concat([["Weitere",A.filter(a=>!HB_KAPITEL.some(([k])=>k===a.kapitel))]]).filter(([,X])=>X.length);
  const box=document.createElement("div"); box.id="hbDruck"; box.className="hb-d";
  box.innerHTML=`<section class="hb-d-titel">${typeof LOGO_PDF!=="undefined"&&/^data:/.test(LOGO_PDF)?`<img class="hb-d-logo" src="${LOGO_PDF}" alt="Elektro Irrgang">`:`<p class="hb-d-firma">Elektro Irrgang</p>`}<h1>Betriebshandbuch</h1>${(v=>v.length===1?`<p>${esc(v[0])}</p>`:"")([...new Set(A.map(a=>a.verfasser).filter(Boolean))])}<p>Stand ${esc(ecDatumKurz(today()))}</p></section>
    <section class="hb-d-inhalt"><h1>Inhalt</h1><ol class="hb-d-inh">${K.map(([t,X],i)=>`<li><b>${i+1} ${esc(t)}</b><ol>${X.map((a,j)=>`<li>${i+1}.${j+1} ${esc(a.titel)}</li>`).join("")}</ol></li>`).join("")}</ol></section>
    ${K.map(([t,X],i)=>`<section class="hb-d-kap"><h1>${i+1} ${esc(t)}</h1>${X.map((a,j)=>`<article class="hb-d-art"><h2>${i+1}.${j+1} ${esc(a.titel)}</h2><div class="hb-text">${hbMd(hbMitSchaubild(a),{druck:true})}</div>
      ${a.checkliste.length?`<div class="hb-d-ck"><b>Checkliste</b>${a.checkliste.map(c=>`<p><span class="hb-d-box"></span>${esc(c)}</p>`).join("")}</div>`:""}
      <p class="hb-d-stand">${esc([hbStandText(a,true),a.verfasser?`von ${a.verfasser}`:""].filter(Boolean).join(" · "))}</p></article>`).join("")}</section>`).join("")}`;
  const st=document.createElement("style"); st.id="hbDruckSeite"; st.textContent="@page{size:A4 portrait;margin:16mm 16mm 18mm}";
  document.head.appendChild(st); document.body.appendChild(box); document.body.classList.add("hb-druckt");
  setTimeout(()=>{ window.print(); setTimeout(()=>addEventListener("pointerdown",hbDruckWeg,{once:true,capture:true}),1500); },60); }
/* ---- Klicks ---- */
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act^="hb"]'); if(!b||b.disabled) return; e.stopPropagation(); const a=b.dataset.act, id=b.dataset.id;
  if(a==="hbAuf"){ go({v:"hb",id}); return; }
  if(a==="hbAf"){ HB_AFK=b.dataset.k; render(); return; }
  if(a==="hbDruck"){ hbDrucken(); return; }
  if(a==="hbEinspielen"){ if(hbEinspielDarf()) hbEinspielen(); return; }
  if(a==="hbEinOk"){ hbEinOk(); return; }
  if(a==="hbVfDlg"){ if(hbEinspielDarf()) hbVerfDlg(); return; }
  if(a==="hbVfOk"){ hbVfOk(); return; }
  if(a==="hbFilter"){ HB_F=b.dataset.v; render(); return; }
  if(a==="hbCk"){ const c=hbCk(id); c[b.dataset.i]=!c[b.dataset.i]; try{ localStorage.setItem(hbCkKey(id),JSON.stringify(c)); }catch(x){} render(); return; }
  if(a==="hbCkNeu"){ try{ localStorage.removeItem(hbCkKey(id)); }catch(x){} render(); return; }
  if(a==="hbFrei"){ hbFreigeben(id); render(); toast("Freigegeben"); return; }
  if(a==="hbEdit"){ hbEditor(id); return; }
  if(a==="hbNeu"){ hbEditor(null); return; }
  if(a==="hbEdOk"){ hbEdOk(); return; }
  if(a==="hbEdFotoNeu"){ hbFotoDazu(); return; }
  if(a==="hbEdFotoWeg"){ if(HB_ED){ HB_ED.fotos.splice(+b.dataset.i,1); hbEdFotos(); } return; }
  if(a==="hbFoto"){ const art=hbArt(id), f=art&&art.fotos[+b.dataset.i]; if(f) dialog("Foto",`<img src="${esc(f)}" alt="" style="width:100%;border-radius:16px">`,`<span style="flex:1"></span><button class="btn-text" data-act="cancel">Schließen</button>`,{breit:true}); return; }
  if(a==="hbVorOk"||a==="hbVorWeg"){ if(!hbDarf()) return; const art=hbArt(id); if(!art) return; const {r,neu}=hbRec(art), v=(r.vorschlaege||[]).find(x=>x.id===b.dataset.v); if(!v) return;
    r.vorschlaege=r.vorschlaege.filter(x=>x!==v);
    if(a==="hbVorOk"){ saveRec("handbuch",r,neu); hbFreigeben(id,{titel:v.titel,kapitel:v.kapitel,inhalt:v.inhalt,checkliste:v.checkliste||[],fotos:v.fotos||[]}); toast(`Vorschlag von ${v.von||"Kollege"} übernommen`); }
    else { saveRec("handbuch",r,neu); toast("Vorschlag abgelehnt"); }
    render(); return; } },true);
document.addEventListener("input",e=>{ if(e.target&&e.target.id==="hbQ"){ HB_Q=e.target.value; const pos=e.target.selectionStart; render(); const q=document.getElementById("hbQ"); if(q){ q.focus(); try{ q.setSelectionRange(pos,pos); }catch(x){} } } });
/* Startseite der Monteure (ohne Kachel-Dashboard): eine Zeile zum Handbuch */
function hbStartZeile(){ const n=hbKuerzlich().length;
  return listOf([`<div class="li" role="button" tabindex="0" data-act="nav" data-v="hb"><span class="av">${icon("book")}</span><span class="lt"><span class="h">Betriebshandbuch</span><span class="s">${n?`${n} Artikel neu oder geändert`:"Wie wir arbeiten – zum Nachschlagen"}</span>${n?`<span class="st">${pill("wip","neu")}</span>`:""}</span>${icon("chev")}</div>`]); }
window.addEventListener("hashchange",()=>{ if(/^#hb=/.test(location.hash)&&typeof nav!=="undefined"&&nav.v!=="login"){ const id=decodeURIComponent(location.hash.slice(4)); history.replaceState(null,"",location.pathname); go({v:"hb",id}); } });
