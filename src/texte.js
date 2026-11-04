/* ===== Texte aus der Übergabe (Baustelle, 04.11.2026) =====
   Einmal die Übergabe schreiben – daraus entstehen zum Kopieren:
   - Stundenzettel: knapp und sauber formuliert für den Kunden (zum Einfügen in SCC)
   - Berichtsheft: nur für Azubis, die beteiligt waren – ausführlicher, mit Baustelle, Kollegen und Material (zum Einfügen in Ezubis)
   Ohne KI nach festen Regeln (Abkürzungen ausschreiben, Sätze ordnen, Einheiten sauber); mit KI (ki.js) auf Wunsch ausformuliert. */
const TX_ABK=[[/\bUV\b/g,"Unterverteilung"],[/\bHV\b/g,"Hauptverteilung"],[/\bHAK\b/g,"Hausanschlusskasten"],[/\bPA\b/g,"Potentialausgleich"],[/\bPAS\b/g,"Potentialausgleichsschiene"],
  [/\bLS\b/g,"Leitungsschutzschalter"],[/\bFI\/LS\b/gi,"FI/LS-Schalter"],[/\bFI\b/g,"Fehlerstromschutzschalter"],[/\bRCD\b/g,"Fehlerstromschutzschalter"],[/\bÜSS\b/g,"Überspannungsschutz"],
  [/\bAP\b/g,"Aufputz"],[/\bUP\b/g,"Unterputz"],[/\bWB\b/g,"Wallbox"],[/\bWP\b/g,"Wärmepumpe"],[/\bPV\b/g,"Photovoltaik"],[/\bZS\b/g,"Zählerschrank"],[/\bSD\b/g,"Steckdose"],
  [/\bAbzw\.?\s?dose/gi,"Abzweigdose"],[/\bca\b\.?/g,"ca."],[/\bggf\b\.?/g,"ggf."]];
/* Leitungsquerschnitte: „NYM 5x2,5“ → „NYM-J 5×2,5 mm²“ */
const txLeitung=s=>s.replace(/\b(NYM|NYY)(?:-J)?\s*(\d+)\s*[x×*]\s*(\d+(?:[.,]\d+)?)(\s*mm²|\s*mm2|\s*qmm)?/gi,(m,t,a,q)=>`${t.toUpperCase()}-J ${a}×${q.replace(".",",")} mm²`)
  .replace(/(\d+)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*(mm²|mm2|qmm)/gi,(m,a,q)=>`${a}×${q.replace(".",",")} mm²`);
const txWort=s=>{ TX_ABK.forEach(([re,w])=>{ s=s.replace(re,w); }); return txLeitung(s).replace(/(\d)(mA|kA|A|V|kW|W|m)\b/g,"$1 $2"); };
const txMat=e=>(typeof matText==="function"?matText(e.mat):"").split("\n").filter(Boolean).map(z=>txWort(z.replace(/^(\d+(?:,\d+)?) Stk /,"$1 × ")));
function txPunkte(t){ return String(t||"").split(/\n+|;\s*|\s+-\s+|•/).map(x=>x.replace(/^[\s\-–*•·]+/,"").trim()).filter(Boolean)
  .map(x=>{ let s=txWort(x); s=s.charAt(0).toUpperCase()+s.slice(1); if(!/[.!?:]$/.test(s)) s+="."; return s; }); }
const txOrt=b=>{ const k=kundeOf(b.kundeId), s=ortVon(b); return {k,s,kn:k?k.name:"",ort:s&&s.ort||k&&k.ort||""}; };
const txLeute=e=>ekLeute(e).map(x=>{ const p=typeof profilVon==="function"&&x.mail&&profilVon(x.mail); return {mail:x.mail,name:(p&&[p.vorname,p.nachname].filter(Boolean).join(" "))||x.name}; });
function txStunden(e,b){ const P=txPunkte(e.stand).map(p=>p.replace(/\bgesetzt\b/g,"montiert")), M=txMat(e);
  if(!P.length) return "";
  return `Ausgeführte Arbeiten am ${deDate(e.datum)}:\n${P.map(p=>"- "+p).join("\n")}${M.length?`\n\nMaterial:\n${M.map(z=>"- "+z).join("\n")}`:""}`; }
function txBericht(e,b){ const P=txPunkte(e.stand), O=txPunkte(e.offen), {kn,ort}=txOrt(b), ich=String(ME.mail||"").toLowerCase(), mit=txLeute(e).filter(x=>x.mail!==ich).map(x=>x.name), M=txMat(e);
  if(!P.length) return "";
  const wo=[b.name,kn&&`bei ${kn}`,ort&&`in ${ort}`].filter(Boolean).join(" ");
  return `${deDate(e.datum)} – Baustelle ${wo}${mit.length?`, zusammen mit ${mit.join(", ")}`:""}.\n\nTätigkeiten:\n${P.map(p=>"- "+p).join("\n")}${M.length?`\n\nVerwendetes Material:\n${M.map(z=>"- "+z).join("\n")}`:""}${O.length?`\n\nNächste Schritte auf der Baustelle:\n${O.map(p=>"- "+p).join("\n")}`:""}`; }
/* Bin ich Azubi? (Stufe aus der Mitarbeiterliste, profil.js) */
const txIchAzubi=()=>{ const ich=String(ME.mail||"").toLowerCase(), m=(typeof teamAlle==="function"?teamAlle():team()).find(x=>String(x.mail||"").toLowerCase()===ich); return !!(m&&typeof maStufe==="function"&&maStufe(m).k==="azubi"); };
const txBeteiligt=e=>{ const ich=String(ME.mail||"").toLowerCase(); return !!ich&&ekLeute(e).some(x=>x.mail===ich); };
const TX_KI={stunden:"Du formulierst für einen Elektro-Handwerksbetrieb (Elektro Irrgang) den Tätigkeitstext für den Stundenzettel des Kunden. Sachlich, professionell, kurz, in der Vergangenheitsform ohne Personen („Zählerschrank montiert“). Aufzählung mit „- “. Nichts erfinden, nichts weglassen, Fachbegriffe korrekt (z. B. NYM-J 5×2,5 mm², Fehlerstromschutzschalter). Nur den Text ausgeben.",
  bericht:"Du schreibst für einen Auszubildenden (Elektroniker für Energie- und Gebäudetechnik) den Tagesbericht fürs Ausbildungsnachweisheft (Berichtsheft). Ich-Form, Präteritum, sachlich, etwas ausführlicher: was wurde gemacht, wie (Arbeitsschritte), mit welchem Material und worauf geachtet wurde (z. B. Sicherheitsregeln, Messungen) – aber nur, was aus den Stichworten hervorgeht oder fachlich zwingend dazugehört. Nichts erfinden. 5–10 Sätze oder kurze Absätze. Nur den Text ausgeben."};
const TX_KI_ERG=new Map();
IC.txKi=IC.txKi||"M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z";
function txAbschnitt(e){ const b=DB.baustellen.get(e.baustelleId); if(!b) return ""; const st=txStunden(e,b); if(!st) return "";
  const az=txIchAzubi()&&txBeteiligt(e), ki=typeof kiBereit==="function"&&kiBereit();
  const karte=(art,titel,sub,txt)=>{ const k=TX_KI_ERG.get(e.id+"|"+art), t=k||txt;
    return `<div class="tx-k"><div class="tx-kopf"><span class="lt"><b>${titel}</b><small>${esc(k?"mit KI ausformuliert":sub)}</small></span>
      ${ki?`<button class="tx-b" data-act="txKi" data-id="${esc(e.id)}" data-v="${art}" title="Mit KI ausformulieren">${icon("txKi")}<span>KI</span></button>`:""}<button class="tx-b haupt" data-act="txKopie" data-id="${esc(e.id)}" data-v="${art}">${icon("copy")}<span>Kopieren</span></button></div>
      <pre class="tx-t" id="tx_${art}_${esc(e.id)}">${esc(t)}</pre></div>`; };
  return `<div class="tx"><div class="sec-lbl">Zum Übernehmen</div>${karte("stunden","Stundenzettel","für SCC – sauber formuliert für den Kunden",st)}${az?karte("bericht","Berichtsheft","für Ezubis – nur für dich als Azubi",txBericht(e,b)):""}
    ${az?`<p class="sup tx-hin">Tipp: Ergänze im Berichtsheft noch, was du selbst gemacht oder dabei gelernt hast – das kann die App nicht wissen.</p>`:""}</div>`; }
async function txKopieren(t){ try{ await navigator.clipboard.writeText(t); return true; }catch(e){ const a=document.createElement("textarea"); a.value=t; a.style.position="fixed"; a.style.opacity="0"; document.body.appendChild(a); a.select(); let ok=false; try{ ok=document.execCommand("copy"); }catch(x){} a.remove(); return ok; } }
document.addEventListener("click",async ev=>{ const el=ev.target.closest&&ev.target.closest('[data-act="txKopie"],[data-act="txKi"]'); if(!el) return; ev.stopPropagation();
  const e=DB.eintraege.get(el.dataset.id), b=e&&DB.baustellen.get(e.baustelleId); if(!e||!b) return; const art=el.dataset.v;
  const txt=TX_KI_ERG.get(e.id+"|"+art)||(art==="bericht"?txBericht(e,b):txStunden(e,b));
  if(el.dataset.act==="txKopie"){ toast(await txKopieren(txt)?(art==="bericht"?"Kopiert – jetzt in Ezubis einfügen":"Kopiert – jetzt in SCC einfügen"):"Kopieren ging nicht – Text bitte markieren"); return; }
  el.disabled=true; const sp=el.querySelector("span"); if(sp) sp.textContent="…";
  try{ const t=await kiFrage({system:TX_KI[art],text:`Stichworte der Übergabe:\n${txt}`,maxTokens:900}); const r=String(t&&t.text||t||"").trim(); if(r){ TX_KI_ERG.set(e.id+"|"+art,r); const p=document.getElementById(`tx_${art}_${e.id}`); if(p) p.textContent=r; const s=el.closest(".tx-k")?.querySelector("small"); if(s) s.textContent="mit KI ausformuliert"; } }
  catch(x){ toast("KI nicht erreichbar – der Text nach Regeln bleibt"); }
  el.disabled=false; if(sp) sp.textContent="KI"; },true);
