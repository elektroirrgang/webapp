/* Material in der Übergabe: echte Liste statt Freitext.
   Jede Zeile: Menge · Einheit · Bezeichnung. Tippen schlägt bekannte Teile vor (Grundliste + alles, was auf
   Baustellen schon eingetragen wurde) und merkt sich die übliche Einheit. In der Übergabe-Karte kann jeder
   abhaken, was besorgt bzw. eingepackt ist. Gespeichert als e.mat=[{t,q,u,ok}]; e.material bleibt als Text der
   noch offenen Teile erhalten (für Teilen, Übersicht „Material offen“ und ältere Versionen). */
const MAT_EINHEITEN=["Stück","m","m²","Packung","Rolle","Ring","Karton","Satz","Sack","Paar","Tag","Pauschale"];
const MAT_GRUND=["NYM-J 3×1,5 mm²","NYM-J 3×2,5 mm²","NYM-J 5×1,5 mm²","NYM-J 5×2,5 mm²","NYM-J 5×4 mm²","NYM-J 5×6 mm²","NYM-J 5×10 mm²","NYM-J 7×1,5 mm²",
  "NYY-J 3×1,5 mm²","NYY-J 5×2,5 mm²","NYY-J 5×6 mm²","NYY-J 5×10 mm²","NYY-J 5×16 mm²","H07V-K 1,5 mm² grün-gelb","H07V-K 2,5 mm²","H07V-K 16 mm² grün-gelb","J-Y(St)Y 2×2×0,8","Cat.7 Verlegekabel",
  "LS B10","LS B16","LS B20","LS B32","LS C16","LS C32","FI 40 A 30 mA Typ A","FI 40 A 30 mA Typ B","FI/LS B16 Typ A","Überspannungsschutz Typ 1+2",
  "Reihenklemme 2,5 mm²","Reihenklemme 4 mm²","N-/PE-Klemme","Hutschiene","Phasenschiene 3-polig","Blindstreifen","Verteiler 2-reihig AP","Verteiler 3-reihig UP",
  "Wago 221-412","Wago 221-413","Wago 221-415","Wago 2273-202","Wago 2273-203","Aderendhülsen 1,5 mm²","Aderendhülsen 2,5 mm²",
  "Gerätedose 60 mm","Geräteverbindungsdose","Hohlwanddose","Abzweigdose AP","Abzweigdose UP","Herdanschlussdose",
  "Schuko-Steckdose UP","Steckdose 2-fach UP","Steckdose AP Feuchtraum","Ausschalter UP","Wechselschalter UP","Serienschalter UP","Taster UP","Abdeckrahmen 1-fach","Abdeckrahmen 2-fach","Abdeckrahmen 3-fach",
  "Leerrohr M20","Leerrohr M25","Leerrohr M32","Kabelkanal 40×60","Nagelschellen","Kabelschellen","Kabelbinder","Dübel 6 mm","Schrauben 4×40","Isolierband","Gips","Schnellzement",
  "Potentialausgleichsschiene","Erdungsschelle","Erdungsband","Rauchmelder","Bewegungsmelder","LED-Panel","Feuchtraumleuchte"];
const MAT_EINH_RE=[[/^(stk\.?|st\.?|stück|x|×)$/i,"Stück"],[/^(m|meter|lfm)$/i,"m"],[/^(m²|qm|m2)$/i,"m²"],[/^(pck\.?|pkg\.?|pack|packung(en)?|pkt\.?)$/i,"Packung"],[/^(rolle(n)?|rl\.?)$/i,"Rolle"],[/^(ring(e)?)$/i,"Ring"],
  [/^(karton(s)?|ktn\.?)$/i,"Karton"],[/^(satz|sätze|set)$/i,"Satz"],[/^(sack|säcke)$/i,"Sack"],[/^(paar)$/i,"Paar"]];
const matEinheitVon=w=>{ for(const [re,u] of MAT_EINH_RE) if(re.test(String(w||"").trim())) return u; return ""; };
/* Welche Einheit passt zu einem Teil? Erst was auf Baustellen zuletzt benutzt wurde, sonst eine Faustregel. */
function matStdEinheit(t){
  const k=String(t||"").trim().toLowerCase(); if(!k) return "Stück";
  const st=matStamm(t); if(st&&st.einheit) return st.einheit;
  for(const e of live("eintraege").slice().sort((a,b)=>(b.updated||0)-(a.updated||0))) for(const x of (e.mat||[])) if(String(x.t||"").trim().toLowerCase()===k&&x.u) return x.u;
  if(/nym|nyy|h07|j-y|cat\.?\s?\d|kabel(?!binder|kanal|schell)|leitung|leerrohr|kanal|erdungsband(?!schell)|litze/i.test(k)) return "m";
  if(/wago|aderendh|kabelbinder|dübel|schraub|nagelschell|kabelschell/i.test(k)) return "Packung";
  if(/isolierband/i.test(k)) return "Rolle";
  if(/gips|zement/i.test(k)) return "Sack";
  return "Stück";
}
const matZahl=s=>{ const n=parseFloat(String(s).replace(",",".")); return isNaN(n)?1:n; };
const matFmt=n=>String(Math.round(n*100)/100).replace(".",",");
/* „2× LS B16“, „50 m NYM-J 3×1,5“, „Leerrohr M20 (2 Rollen)“, „Wago 221-413 – 1 Pck“ → {t,q,u} */
function matZeile(s){
  s=String(s||"").replace(/^[\s\-–•*]+/,"").trim(); if(!s) return null;
  let m=/^(\d+(?:[.,]\d+)?)\s*(x|×|stk\.?|st\.?|stück|m²|qm|m|meter|lfm|pck\.?|pkg\.?|pack|packung(?:en)?|pkt\.?|rolle(?:n)?|rl\.?|ring(?:e)?|karton(?:s)?|ktn\.?|satz|sätze|set|sack|säcke|paar)?\.?\s+(.+)$/i.exec(s);
  if(m) return {t:m[3].trim(),q:matZahl(m[1]),u:matEinheitVon(m[2])||matStdEinheit(m[3])};
  m=/^(.+?)\s+(\d+(?:[.,]\d+)?)\s*([a-zäöü.²]+)$/i.exec(s);
  if(m&&matEinheitVon(m[3])) return {t:m[1].replace(/[\s\-–:(]+$/,"").trim(),q:matZahl(m[2]),u:matEinheitVon(m[3])};
  m=/^(.+?)\s*(?:\(|:|\s[-–]\s)\s*(\d+(?:[.,]\d+)?)\s*([a-zäöü.²]+)?\)?\s*$/i.exec(s);
  if(m&&!/×\s*$/.test(m[1])&&(m[3]?matEinheitVon(m[3]):true)) return {t:m[1].trim(),q:matZahl(m[2]),u:(m[3]&&matEinheitVon(m[3]))||matStdEinheit(m[1])};
  return {t:s,q:1,u:matStdEinheit(s)};
}
const matAusText=txt=>String(txt||"").split(/\n|;|,\s+(?=\D)|,\s+(?=\d+\s*(?:x|×|m²|qm|m|stk|stück|pck|rolle)(?:\s|\.|$))/i).map(matZeile).filter(Boolean);
const matText=L=>(L||[]).filter(x=>String(x.t||"").trim()).map(x=>`${matFmt(x.q)} ${x.u} ${x.t}`).join("\n");
const matListe=e=>Array.isArray(e.mat)?e.mat:matAusText(e.material).map(x=>Object.assign(x,{alt:true}));
const matOffen=e=>Array.isArray(e.mat)?e.mat.filter(x=>!x.ok&&String(x.t||"").trim()).length:(String(e.material||"").trim()?1:0);
/* Vorschläge: zuerst was auf Baustellen zuletzt benutzt wurde, dann die ganze Materialliste */
function matVorschlaege(){ const s=new Set(); live("eintraege").slice().sort((a,b)=>(b.updated||0)-(a.updated||0)).forEach(e=>(e.mat||[]).forEach(x=>x.t&&s.add(String(x.t).trim())));
  matAlle().forEach(m=>s.add(m.name)); return [...s]; }

/* Bearbeiten (Übergabe schreiben) */
function matEditor(){
  const L=entw.mat||[];
  const zeile=(x,i)=>`<div class="mat-row" data-i="${i}">
      <div class="mat-q"><button type="button" data-act="matMinus" data-i="${i}" aria-label="weniger">${icon("minus")}</button><input data-mq="${i}" inputmode="decimal" value="${esc(matFmt(x.q))}" aria-label="Menge"><button type="button" data-act="matPlus" data-i="${i}" aria-label="mehr">${icon("add")}</button></div>
      <div class="tf mat-u"><select data-mu="${i}" aria-label="Einheit">${MAT_EINHEITEN.map(u=>`<option ${u===x.u?"selected":""}>${u}</option>`).join("")}</select><span class="arr">${icon("drop")}</span></div>
      <input class="mat-t" data-mt="${i}" data-vl="dl-mat" value="${esc(x.t)}" placeholder="Bezeichnung" autocomplete="off" aria-label="Bezeichnung">
      <button type="button" class="mat-del" data-act="matDel" data-i="${i}" aria-label="Entfernen">${icon("close")}</button></div>`;
  return `<div class="mat-ed"><div class="mat-kopf"><span>Material für morgen</span>${L.length?`<small>${L.length} Position${L.length===1?"":"en"}</small>`:""}</div>
    <div class="mat-list">${L.map(zeile).join("")||`<p class="mat-leer">Noch nichts eingetragen. Unten tippen – Vorschläge erscheinen beim Schreiben, Menge und Einheit kannst du danach anpassen.</p>`}</div>
    <div class="mat-add"><input id="matNeu" data-vl="dl-mat" placeholder="Material hinzufügen, z. B. 50 m NYM-J 3×1,5" autocomplete="off" enterkeyhint="done"><button type="button" class="mat-plus" data-act="matAdd" aria-label="Hinzufügen">${icon("add")}</button></div>
    ${datalist("dl-mat",matVorschlaege())}</div>`;
}
function matLesen(){ if(!entw||!entw.mat) return;
  document.querySelectorAll("[data-mq]").forEach(el=>{ const x=entw.mat[+el.dataset.mq]; if(x) x.q=Math.max(0,matZahl(el.value)); });
  document.querySelectorAll("[data-mu]").forEach(el=>{ const x=entw.mat[+el.dataset.mu]; if(x) x.u=el.value; });
  document.querySelectorAll("[data-mt]").forEach(el=>{ const x=entw.mat[+el.dataset.mt]; if(x) x.t=el.value; }); }
let matBusy=false;
function matNeuAus(text){ if(matBusy) return; const i=document.getElementById("matNeu"); const x=matZeile(text!=null?text:(i&&i.value)); if(!x) { i&&i.focus(); return; }
  matBusy=true; entwLesen(); if(i) i.value=""; entw.mat=entw.mat||[]; const da=entw.mat.find(y=>String(y.t).trim().toLowerCase()===x.t.toLowerCase()&&y.u===x.u&&!y.ok);
  if(da) da.q+=x.q; else entw.mat.push({t:x.t,q:x.q,u:x.u,ok:false});
  const y=scrollY; render(); scrollTo(0,y); matBusy=false; const n=document.getElementById("matNeu"); if(n){ n.value=""; n.focus(); } }
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act="matHaken"],[data-act="matAdd"],[data-act="matPlus"],[data-act="matMinus"],[data-act="matDel"]'); if(!b) return; const a=b.dataset.act;
  if(a==="matHaken"&&e.target.closest('[data-act="matKopier"]')) return;
  if(a==="matHaken"){ e.stopPropagation(); const r=DB.eintraege.get(b.dataset.id); if(!r) return; const L=matListe(r).map(x=>({t:x.t,q:x.q,u:x.u,ok:!!x.ok})); const x=L[+b.dataset.i]; if(!x) return;
    x.ok=!x.ok; x.okVon=x.ok?who():null; r.mat=L; r.material=matText(L.filter(z=>!z.ok)); saveRec("eintraege",r); const y=scrollY; render(); scrollTo(0,y); return; }
  if(!entw) return; e.stopPropagation(); e.preventDefault(); const i=+b.dataset.i; entwLesen();
  if(a==="matAdd") return matNeuAus();
  const x=entw.mat&&entw.mat[i]; if(!x) return;
  const st=/^m²?$/.test(x.u)?5:1;
  if(a==="matPlus") x.q=st>1?Math.floor(x.q/st+1e-9)*st+st:Math.floor(x.q)+1;
  else if(a==="matMinus") x.q=Math.max(1,st>1?Math.ceil(x.q/st-1e-9)*st-st:Math.ceil(x.q)-1);
  else if(a==="matDel") entw.mat.splice(i,1);
  const y=scrollY; render(); scrollTo(0,y);
},true);
document.addEventListener("keydown",e=>{ if(e.key==="Enter"&&e.target&&e.target.id==="matNeu"&&!document.querySelector("#vlist .hl")){ e.preventDefault(); matNeuAus(); } });
/* Vorschlag aus der Liste gewählt ⇒ sofort übernehmen; Bezeichnung in einer Zeile geändert ⇒ Einheit nachziehen, wenn sie noch der Standard war */
document.addEventListener("change",e=>{ const t=e.target; if(!t||!entw||matBusy) return;
  if(t.id==="matNeu"&&t.value.trim()&&matVorschlaege().includes(t.value.trim())) matNeuAus();
  else if(t.dataset&&t.dataset.mt!=null){ entwLesen(); const x=entw.mat[+t.dataset.mt]; if(x&&x.u==="Stück"){ const u=matStdEinheit(x.t); if(u!=="Stück"){ x.u=u; const y=scrollY; render(); scrollTo(0,y); } } }
  else if(t.dataset&&(t.dataset.mu!=null||t.dataset.mq!=null)) matLesen(); });

/* Anzeige in der Übergabe-Karte */
function matBlock(e){
  const L=matListe(e); if(!L.length) return "";
  const neu=Array.isArray(e.mat), ok=L.filter(x=>x.ok).length;
  return `<div class="eb mat-k"><div class="mat-kk"><small>Material</small>${typeof anfChip==="function"?anfChip(e):""}${neu&&L.length?`<span>${ok} von ${L.length} besorgt</span>`:""}</div>
    <div class="mat-kl">${L.map((x,i)=>neu?`<button type="button" class="mat-ck${x.ok?" ok":""}" data-act="matHaken" data-id="${esc(e.id)}" data-i="${i}" aria-pressed="${!!x.ok}"><span class="mat-box">${x.ok?icon("check"):""}</span><b>${esc(matFmt(x.q))} ${esc(x.u)}</b><span class="mat-tt">${esc(x.t)}</span>${matNrChip(matNr(matStamm(x.t)))}${x.ok&&x.okVon&&x.okVon.name?`<small>besorgt von ${esc(x.okVon.name)}</small>`:""}</button>`
      :`<div class="mat-ck alt"><b>${esc(matFmt(x.q))} ${esc(x.u)}</b><span class="mat-tt">${esc(x.t)}</span>${matNrChip(matNr(matStamm(x.t)))}</div>`).join("")}</div></div>`;
}

/* ===== Materialstamm: eigener Bereich „Material“ =====
   Ein Datensatz je Teil: Bezeichnung, Kategorie, Einheit, Hersteller + Artikelnr., Bestellnummern (Sonepar, EGU, weitere),
   EAN, Notiz. Jeder darf anlegen und bearbeiten. Feste IDs aus dem Namen, damit Grundliste und neue Teile
   auf allen Geräten zusammenpassen. Teile, die in einer Übergabe neu eingetippt werden, landen als „neu“ hier. */
const MAT_KAT=[["leitung","Leitungen & Kabel"],["schutz","Schutzgeräte"],["verteiler","Verteiler & Zubehör"],["klemmen","Klemmen & Verbindung"],["dosen","Dosen"],
  ["schalter","Schalter & Steckdosen"],["kommu","Daten, SAT & Telefon"],["rohr","Rohr & Kanal"],["befest","Befestigung & Kleinmaterial"],["erdung","Erdung & Potentialausgleich"],["licht","Leuchten & Melder"],
  ["pausch","Geräte & Pauschalen"],["sonst","Sonstiges"]];
const MAT_KAT_TXT=Object.fromEntries(MAT_KAT);
/* Symbole je Kategorie (Strichzeichnung, 24er Raster) */
const MAT_IC={
  leitung:'<circle cx="12" cy="12" r="9.5"/><circle cx="12" cy="8.2" r="2.4"/><circle cx="8.6" cy="14.1" r="2.4"/><circle cx="15.4" cy="14.1" r="2.4"/>',
  schutz:'<rect x="6" y="2" width="12" height="20" rx="2.5"/><rect x="10" y="8" width="4" height="7" rx="1"/><path d="M9.5 5h5M9.5 18.5h5"/>',
  verteiler:'<rect x="3" y="3" width="18" height="18" rx="2.5"/><path d="M3 9h18M3 15h18M9 9v6M15 9v6"/>',
  klemmen:'<rect x="3" y="8.5" width="18" height="10.5" rx="2.5"/><path d="M7 8.5V4.5h2.5v4M10.75 8.5V4.5h2.5v4M14.5 8.5V4.5H17v4"/><circle class="f" cx="8.2" cy="14" r="1.3"/><circle class="f" cx="12" cy="14" r="1.3"/><circle class="f" cx="15.8" cy="14" r="1.3"/>',
  dosen:'<rect x="3.5" y="3.5" width="17" height="17" rx="3.5"/><circle class="f" cx="7.6" cy="7.6" r="1.2"/><circle class="f" cx="16.4" cy="7.6" r="1.2"/><circle class="f" cx="7.6" cy="16.4" r="1.2"/><circle class="f" cx="16.4" cy="16.4" r="1.2"/><path d="M10 12h4"/>',
  schalter:'<rect x="3" y="3" width="18" height="18" rx="4.5"/><circle cx="12" cy="12" r="5.5"/><circle class="f" cx="9.8" cy="12" r="1.1"/><circle class="f" cx="14.2" cy="12" r="1.1"/>',
  kommu:'<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M8 16.5v-5h2v-2h4v2h2v5z"/>',
  rohr:'<ellipse cx="6.5" cy="12" rx="2.5" ry="5.5"/><path d="M6.5 6.5h11a2.5 5.5 0 0 1 0 11h-11"/>',
  befest:'<rect x="7.5" y="2.5" width="9" height="3.5" rx="1"/><path d="M10 6v11l2 4.5 2-4.5V6M10 10l4-1.5M10 13.5l4-1.5M10 17l4-1.5"/>',
  erdung:'<path d="M12 3v9M4.5 12h15M7.5 16h9M10.5 20h3"/>',
  licht:'<path d="M9.2 18h5.6M10.2 21h3.6M12 3a6 6 0 0 0-3.6 10.8c.6.5.8 1.2.8 2.2h5.6c0-1 .2-1.7.8-2.2A6 6 0 0 0 12 3z"/>',
  pausch:'<rect x="3" y="8" width="18" height="12" rx="2.5"/><path d="M9 8V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V8M3 13.5h18M10.5 12v3h3v-3"/>',
  sonst:'<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9"/>'};
const matKatIc=k=>`<svg class="ic kic" viewBox="0 0 24 24" aria-hidden="true">${MAT_IC[k]||MAT_IC.sonst}</svg>`;
const matKatBadge=(k,cls="")=>`<span class="mk-ic k-${esc(k||"sonst")}${cls?" "+cls:""}" title="${esc(MAT_KAT_TXT[k]||"Sonstiges")}">${matKatIc(k||"sonst")}</span>`;
const MAT_LIEF=["Sonepar","EGU","EFG","Gäfgen","Kürzel","Rexel","FEGA & Schmitt","Obeta","Zajadacz","Hornbach Profi"];
function matKatRaten(n){ const k=String(n||"");
  if(/nym|nyy|h07|j-y|cat\.?\s?\d|kabel(?!binder|kanal|schell)|leitung|litze/i.test(k)) return "leitung";
  if(/\b(ls|fi|rcd|rcbo|fi\/ls)\b|überspannung|sicherung|schütz/i.test(k)) return "schutz";
  if(/verteiler|hutschiene|phasenschiene|blindstreifen|zählerplatz/i.test(k)) return "verteiler";
  if(/wago|klemme|aderendh/i.test(k)) return "klemmen";
  if(/dose(?!n?\s*\d+\s*stück)|dosen/i.test(k)&&!/steckdose/i.test(k)) return "dosen";
  if(/steckdose|schalter|taster|rahmen/i.test(k)) return "schalter";
  if(/rohr|kanal/i.test(k)) return "rohr";
  if(/dübel|schraub|schelle(?!.*erd)|kabelbinder|isolierband|gips|zement/i.test(k)&&!/erdung/i.test(k)) return "befest";
  if(/erdung|potential/i.test(k)) return "erdung";
  if(/leuchte|panel|melder|lampe|led/i.test(k)) return "licht";
  return "sonst"; }
/* Alle Teile: Firmenliste + eigene Datensätze. Ein Datensatz mit gleicher ID oder gleichem Namen ergänzt/überschreibt das Firmen-Teil. */
function matAlle(){ if(!DB.material) return [];
  const recs=[...DB.material.values()], byId=new Map(recs.map(r=>[r.id,r])), byName=new Map(), used=new Set(), out=[];
  recs.forEach(r=>{ if(!r.deleted) byName.set(matNorm(r.name),r); });
  const zu=new Map(); Object.entries(MAT_GRUND_ZU).forEach(([g,fn])=>{ const r=byName.get(matNorm(g)); if(r) zu.set(matNorm(fn),r); });
  matFirma().forEach(f=>{ const r=byId.get(f.id)||byName.get(matNorm(f.name))||zu.get(matNorm(f.name)); if(!r){ out.push(f); return; } if(used.has(r.id)) return; used.add(r.id); if(r.deleted) return;
    const m={...f}; Object.entries(r).forEach(([k,v])=>{ if(v===""||v==null||(Array.isArray(v)&&!v.length&&r.grund)) return; m[k]=v; });
    if(matNorm(m.name)!==matNorm(f.name)) m.listeName=f.name; out.push(m); });
  recs.forEach(r=>{ if(!used.has(r.id)&&!r.deleted) out.push(r); });
  return out; }
/* Kurze Namen der Grundliste, die eindeutig einem Artikel der Firmenliste entsprechen: Name bleibt, Nummern kommen aus der Liste */
const MAT_GRUND_ZU={"Wago 221-413":"WAGO Hebelklemme 3-polig","Wago 221-415":"WAGO Hebelklemme 5-polig","Aderendhülsen 1,5 mm²":"Aderendhülsen isoliert 1,5 mm²",
  "Aderendhülsen 2,5 mm²":"Aderendhülsen isoliert 2,5 mm²","Hutschiene":"Hutschiene gelocht","Herdanschlussdose":"Herdanschlussdose UP","Kabelkanal 40×60":"Kanal 40 / 60",
  "H07V-K 2,5 mm²":"Draht flexibel 2,5 mm²","Erdungsschelle":"Banderdungsschelle","Rauchmelder":"EI 650 Rauchmelder 10 Jahre","Gips":"Haftputz Gips / Rotband","Schnellzement":"Montagezement Raccofix"};
const matNrChip=nr=>nr?`<span class="mat-nr" role="button" tabindex="0" data-act="matKopier" data-nr="${esc(nr)}" aria-label="Nummer ${esc(nr)} kopieren">${esc(nr)}${icon("copy")}</span>`:"";
const matGet=id=>matAlle().find(m=>m.id===id)||null;
/* Vergleich ohne „mm²“ und mit x→×, damit „NYM-J 3x1,5“ und „NYM-J 3×1,5 mm²“ dasselbe Teil sind */
const matKey=t=>matNorm(String(t||"").replace(/mm2\b/gi,"mm²")).replace(/(\d)\s*×\s*(?=\d)/g,"$1×").replace(/\s*mm²/g,"").trim();
function matStamm(t){ const k=matNorm(t); if(!k||!DB.material) return null; const A=matAlle(); return A.find(m=>matNorm(m.name)===k)||(()=>{ const kk=matKey(t); return A.find(m=>matKey(m.name)===kk)||null; })(); }
function matStammSeed(){ if(!DB.material||(META.matSeed||0)>=1) return;
  MAT_GRUND.forEach(n=>{ const id=matSlug(n); if(DB.material.has(id)) return; const r=saveRec("material",{id,name:n,kategorie:matKatRaten(n),einheit:matStdEinheitRegel(n),grund:true},true); r.created=r.updated=1; dbPut("material",r); });
  META.matSeed=1; metaSave(); }
function matStdEinheitRegel(n){ const k=String(n).toLowerCase();
  if(/nym|nyy|h07|j-y|cat\.?\s?\d|kabel(?!binder|kanal|schell)|leitung|leerrohr|kanal|erdungsband(?!schell)|litze/i.test(k)) return "m";
  if(/wago|aderendh|kabelbinder|dübel|schraub|nagelschell|kabelschell/i.test(k)) return "Packung";
  if(/isolierband/i.test(k)) return "Rolle"; if(/gips|zement/i.test(k)) return "Sack"; return "Stück"; }
/* Neue Teile aus einer Übergabe in den Stamm übernehmen (als „neu“) */
function matStammMerken(L){ if(!DB.material) return; (L||[]).forEach(x=>{ const n=String(x.t||"").trim(); if(!n||matStamm(n)) return; const id=matSlug(n); if(DB.material.has(id)&&!DB.material.get(id).deleted) return;
  saveRec("material",{id,name:n,kategorie:matKatRaten(n),einheit:x.u||matStdEinheitRegel(n),neu:true},true); }); }
function matNutzung(){ const z={}, zul={}; live("eintraege").forEach(e=>(e.mat||[]).forEach(x=>{ const k=matNorm(x.t); z[k]=(z[k]||0)+1; zul[k]=Math.max(zul[k]||0,e.updated||0); })); return {z,zul}; }
const MAT_ANS=()=>META.matAns||"liste", MAT_SORT=()=>META.matSort||"kat", MAT_F=()=>META.matF||"alle";
function matNummern(m){ return [m.herstellerNr&&`${m.hersteller?m.hersteller+" ":""}${m.herstellerNr}`,m.sonepar&&`Sonepar ${m.sonepar}`,m.egu&&`EGU ${m.egu}`,...(m.weitere||[]).filter(w=>w&&w.nr).map(w=>`${w.bei||"Nr."} ${w.nr}`)].filter(Boolean); }
function materialListe(){
  const q=matNorm(query), f=MAT_F(), {z,zul}=matNutzung();
  let L=matAlle().filter(m=>f==="alle"?true:f==="neu"?m.neu:f==="haeufig"?z[matNorm(m.name)]:m.kategorie===f);
  if(q){ const W=q.replace(/(\d)\s*×\s*(?=\d)/g,"$1×").split(" ").filter(Boolean);
    L=L.filter(m=>{ const t=[m.name,m.hersteller,m.herstellerNr,m.sonepar,m.egu,m.ean,m.notiz,m.gruppe,m.listeName,MAT_KAT_TXT[m.kategorie],...(m.weitere||[]).flatMap(w=>[w.nr,w.bei])].map(matNorm).join(" | "); return W.every(w=>t.includes(w)); }); }
  const so=f==="haeufig"?"haeufig":MAT_SORT(), az=(a,b)=>a.name.localeCompare(b.name,"de",{numeric:true});
  if(so==="haeufig") L.sort((a,b)=>(z[matNorm(b.name)]||0)-(z[matNorm(a.name)]||0)||(zul[matNorm(b.name)]||0)-(zul[matNorm(a.name)]||0)||az(a,b)); else L.sort(az);
  if(!L.length) return `<p class="meta" style="text-align:center;margin-top:24px">${q?`Nichts gefunden für „${esc(query)}“.`:"Keine Teile in dieser Auswahl."}</p>${q?`<div style="text-align:center"><button class="btn-tonal" data-act="matStammNeu" data-name="${esc(query)}">${icon("add")}„${esc(query)}“ anlegen</button></div>`:""}`;
  const kachel=MAT_ANS()==="kacheln", gruppiert=so==="kat"&&f==="alle"&&!q;
  /* Zweitzeile: Einheit, Hersteller-Nr., andere Bestellnummern – die Hauptnummer steht im Feld unten */
  const unter=m=>{ const nr=matNr(m); return [matTechText(matTech(m))||m.einheit||"Stück",m.herstellerNr&&`${m.hersteller?m.hersteller+" ":""}${m.herstellerNr}`,
    ...(m.weitere||[]).filter(w=>w&&w.nr&&w.nr!==nr).map(w=>`${w.bei||"Nr."} ${w.nr}`),m.egu&&`EGU ${m.egu}`].filter(Boolean).join(" · "); };
  const item=m=>{ const n=z[matNorm(m.name)]||0, nr=matNr(m);
    return kachel?`<button class="mk" data-act="matStammOpen" data-id="${esc(m.id)}">
        ${matBild(m)?matFoto(m,"mk-bild"):""}${matBild(m)&&!m.neu&&!n?"":`<span class="mk-top">${matBild(m)?"":matKatBadge(m.kategorie)}${m.neu?pill("wip","neu"):""}${n?`<span class="mk-n">${n}× benutzt</span>`:""}</span>`}
        <span class="mk-name">${esc(m.name)}</span>
        <span class="mk-sub">${esc(unter(m))}</span>${m.listeName?`<span class="mk-sub mk-liste">Liste: ${esc(m.listeName)}</span>`:""}
        <span class="mk-fuss">${nr?matNrChip(nr):`<span class="mk-ohne">Keine Nummer</span>`}</span></button>`
      :`<button class="li ml" data-act="matStammOpen" data-id="${esc(m.id)}">${matBild(m)?matFoto(m,"av"):matKatBadge(m.kategorie,"av")}<span class="lt"><span class="h">${esc(m.name)}</span>
        <span class="s">${esc([unter(m),m.listeName&&"Liste: "+m.listeName].filter(Boolean).join(" · "))}</span></span>${m.neu?pill("wip","neu"):""}${n?`<span class="ml-n">${n}×</span>`:""}${matNrChip(nr)}</button>`; };
  const block=G=>kachel?`<div class="mk-grid">${G.map(item).join("")}</div>`:`<div class="list">${G.map(item).join("")}</div>`;
  if(gruppiert) return MAT_KAT.map(([k,t])=>{ const G=L.filter(m=>(m.kategorie||"sonst")===k); return G.length?`<div class="sec-lbl mat-sec">${matKatBadge(k,"sm")}<span>${esc(t)}</span><small>${G.length}</small></div>${block(G)}`:""; }).join("");
  return `<p class="meta f-info">${L.length} Teil${L.length===1?"":"e"}</p>`+block(L);
}
function materialView(){ matStammSeed();
  const f=MAT_F(), {z}=matNutzung(), A=matAlle(), anz=k=>A.filter(m=>k==="neu"?m.neu:k==="haeufig"?z[matNorm(m.name)]:m.kategorie===k).length;
  const chips=[["alle","Alle"],["haeufig","Häufig benutzt"],["neu","Neu"],...MAT_KAT].map(([k,t])=>{ const n=k==="alle"?0:anz(k); return k!=="alle"&&!n&&f!==k?"":`<button class="chip${MAT_KAT_TXT[k]?" mat-kc":""}" data-act="matF" data-v="${k}" aria-pressed="${f===k}">${MAT_KAT_TXT[k]?matKatIc(k):""}${esc(t)}${k==="alle"?"":`<small>${n}</small>`}</button>`; }).join("");
  const AO=typeof anfOffen==="function"?anfOffen():[], an=AO.filter(a=>a.status==="angefordert").length, be=AO.filter(a=>a.status==="bestellt").length;
  return `<div class="narrow mat-st"><button class="vg-start af-start" data-act="nav" data-v="materialanf"><span class="vg-si">${icon("lager")}</span><span class="vg-st"><b>Materialanforderungen</b>
    <span>${AO.length?[an&&`${an} angefordert`,be&&`${be} bestellt`].filter(Boolean).join(" · "):"Material anfordern oder Stand ansehen"}</span></span>${icon("chev")}</button>
    ${searchBar("Teil oder Nummer suchen")}
    <div class="chips filt mat-chips">${chips}</div>
    <div class="mat-opt"><div class="mat-sortw">${f==="haeufig"?"":seg("matSort",MAT_SORT(),[["kat","Kategorie"],["az","A–Z"],["haeufig","Häufig"]])}</div><div class="seg mat-ans" role="group">${[["liste","ansListe","Liste"],["kacheln","ansKachel","Kacheln"]].map(([v,ic,l])=>`<button type="button" data-act="matAns" data-v="${v}" aria-pressed="${MAT_ANS()===v}" aria-label="${l}" title="${l}">${icon(ic)}</button>`).join("")}</div></div>
    <div id="res">${materialListe()}</div>
    <p class="hint">Gemeinsame Materialliste für alle, mit der Firmen-Materialliste (Stand ${esc(MAT_FIRMA_STAND)}) samt Sonepar-, EFG- und Gäfgen-Nummern. Teile, die in einer Übergabe neu eingetippt werden, erscheinen hier als „neu“ – kurz prüfen, Kategorie und Nummern ergänzen.</p></div>`; }
let matEd=null;
function matStammDialog(m,name){ const r=m||{name:name||"",kategorie:matKatRaten(name),einheit:matStdEinheitRegel(name||"")}; matEd={id:m&&m.id, weitere:JSON.parse(JSON.stringify(r.weitere||[]))};
  const {z,zul}=matNutzung(), n=m?z[matNorm(m.name)]||0:0;
  dialog(m?"Material":"Neues Material",`<div class="fg1">
    ${m&&matBild(m)?`<div class="mat-gross">${matFoto(m)}${matTech(m)?`<span class="mat-techt">${esc(matTechText(matTech(m)))}</span>`:""}</div>`:""}
    ${tf("mName","Bezeichnung",r.name,{form:true,ph:"z. B. NYM-J 3×1,5 mm²"})}
    <div class="fg2">${sf("mKat","Kategorie",r.kategorie||"sonst",MAT_KAT,{form:true})}${sf("mEinh","Einheit",r.einheit||"Stück",MAT_EINHEITEN.map(u=>[u,u]),{form:true})}</div>
    <div class="lbl" style="margin:8px 4px 0">Hersteller</div>
    <div class="fg2">${tf("mHerst","Hersteller",r.hersteller||"",{form:true,list:"dl-mh",ph:"z. B. Hager"})}${tf("mHNr","Artikelnr. Hersteller",r.herstellerNr||"",{form:true,ph:"z. B. MBN116"})}</div>
    ${datalist("dl-mh",[...new Set([...matAlle().map(x=>x.hersteller).filter(Boolean),"Hager","ABB","Siemens","Schneider Electric","Eaton","Doepke","Wago","Busch-Jaeger","Gira","Jung","Berker","Kaiser","Spelsberg","OBO Bettermann","Fränkische","Lapp","Faber","Mennekes"])])}
    <div class="lbl" style="margin:8px 4px 0">Bestellnummern</div>
    <div class="fg2">${tf("mSon","Sonepar",r.sonepar||"",{form:true})}${tf("mEgu","EGU",r.egu||"",{form:true})}</div>
    <div id="mWeitere">${matWeitereHtml()}</div>
    <button type="button" class="btn-text mat-wplus" data-act="matWeiterPlus">${icon("add")}Weitere Bestellnummer</button>
    ${tf("mEan","EAN / GTIN (optional)",r.ean||"",{form:true,im:"numeric"})}
    ${ta("mNotiz","Notiz",r.notiz||"",{form:true,ph:"z. B. nur in Grau lieferbar, Alternative …"})}
    ${m&&m.firma?`<p class="sup">Aus der Firmen-Materialliste (Stand ${esc(MAT_FIRMA_STAND)})${m.gruppe?`, Abschnitt „${esc(m.gruppe)}“`:""}.${m.listeName?` Dort heißt es „${esc(m.listeName)}“.`:""}</p>`:""}
    ${m?`<p class="sup">${n?`${n}× in Übergaben verwendet, zuletzt ${esc(wann(zul[matNorm(m.name)]))}.`:"Noch nicht in Übergaben verwendet."}${m.updatedBy&&m.updatedBy.name?` Zuletzt geändert von ${esc(m.updatedBy.name)}.`:""}</p>`:""}
  </div>`,`${m?`<button class="btn-text danger" data-act="matStammDel" data-id="${esc(m.id)}">Löschen</button><span style="flex:1"></span>`:""}<button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="matStammSave">${m&&m.neu?"Prüfen & speichern":"Speichern"}</button>`); }
function matWeitereHtml(){ return (matEd.weitere||[]).map((w,i)=>`<div class="fg2 mat-w">${tf("mWb"+i,"Lieferant",w.bei||"",{form:true,list:"dl-ml"})}<div class="mat-wn">${tf("mWn"+i,"Bestellnummer",w.nr||"",{form:true})}<button type="button" class="icon-btn sm" data-act="matWeiterDel" data-i="${i}" aria-label="Entfernen">${icon("close")}</button></div></div>`).join("")+datalist("dl-ml",MAT_LIEF); }
function matWeitereLesen(F){ matEd.weitere=(matEd.weitere||[]).map((w,i)=>({bei:(F["mWb"+i]??w.bei)||"",nr:(F["mWn"+i]??w.nr)||""})); }
function matStammSpeichern(){ const F=formVals(); matWeitereLesen(F); const name=String(F.mName||"").trim(); if(!name){ toast("Bitte eine Bezeichnung eingeben"); return; }
  const doppelt=matAlle().find(m=>matNorm(m.name)===matNorm(name)&&m.id!==matEd.id); if(doppelt){ toast("Dieses Teil gibt es schon"); return; }
  const neu=!matEd.id, vorh=!neu&&DB.material.get(matEd.id), r=neu?{id:matSlug(name)}:(vorh||JSON.parse(JSON.stringify(matGet(matEd.id))));
  if(neu&&((DB.material.has(r.id)&&!DB.material.get(r.id).deleted)||matFirma().some(f=>f.id===r.id))) r.id=r.id+"-"+uid().slice(-4);
  Object.assign(r,{name,kategorie:F.mKat||"sonst",einheit:F.mEinh||"Stück",hersteller:F.mHerst,herstellerNr:F.mHNr,sonepar:F.mSon,egu:F.mEgu,ean:F.mEan,notiz:F.mNotiz,weitere:matEd.weitere.filter(w=>w.nr||w.bei)});
  delete r.neu; delete r.deleted; saveRec("material",r,neu||!vorh); closeOverlays(); render(); toast(neu?"Material angelegt":"Gespeichert"); }
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act="matKopier"],[data-act^="matStamm"],[data-act="matF"],[data-act="matSort"],[data-act="matAns"],[data-act^="matWeiter"]'); if(!b) return; const a=b.dataset.act;
  e.stopPropagation(); e.preventDefault();
  if(a==="matKopier"){ const nr=b.dataset.nr; (navigator.clipboard?navigator.clipboard.writeText(nr):Promise.reject()).then(()=>toast(`${nr} kopiert`),()=>toast(`Nummer: ${nr}`)); }
  else if(a==="matF"){ META.matF=b.dataset.v; metaSave(); render(); }
  else if(a==="matSort"){ META.matSort=b.dataset.v; metaSave(); render(); }
  else if(a==="matAns"){ META.matAns=b.dataset.v; metaSave(); render(); }
  else if(a==="matStammNeu") matStammDialog(null,b.dataset.name||"");
  else if(a==="matStammOpen"){ const m=matGet(b.dataset.id); if(m) matStammDialog(m); }
  else if(a==="matStammSave") matStammSpeichern();
  else if(a==="matStammDel"){ const vorh=DB.material.get(b.dataset.id), m=vorh||JSON.parse(JSON.stringify(matGet(b.dataset.id)||null)); if(!m) return; m.deleted=true; saveRec("material",m,!vorh); closeOverlays(); render(); toast("Material gelöscht","Rückgängig",()=>{ delete m.deleted; saveRec("material",m); render(); }); }
  else if(a==="matWeiterPlus"){ matWeitereLesen(formVals()); matEd.weitere.push({bei:"",nr:""}); document.getElementById("mWeitere").innerHTML=matWeitereHtml(); }
  else if(a==="matWeiterDel"){ matWeitereLesen(formVals()); matEd.weitere.splice(+b.dataset.i,1); document.getElementById("mWeitere").innerHTML=matWeitereHtml(); }
},true);
