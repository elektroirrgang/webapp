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
const matSlug=t=>"mat-"+String(t).toLowerCase().replace(/×/g,"x").replace(/ä/g,"ae").replace(/ö/g,"oe").replace(/ü/g,"ue").replace(/ß/g,"ss").replace(/²/g,"2").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const matNorm=t=>String(t||"").trim().toLowerCase().replace(/\s+/g," ").replace(/x(?=\d)/g,"×");
/* Herstellerfotos und technische Daten je Hersteller-Artikelnummer. Die Fotos holt der Bilder-Bot auf unseren Server (tools/bilder.py).
   tech: art ls|rcd|rcbo, char B/C, in (A), pole, te (Teilungseinheiten), typ (RCD-Typ), idn (mA) – daraus rechnet später der Verteiler. */
const matHnr=n=>String(n||"").replace(/\s+/g,"").toUpperCase();
const MAT_INFO={
  MBS110:{bild:"https://assets.hager.com/step-content/P/HA_16255176/11/std.lang.all/MBS110.webp",tech:{art:"ls",char:"B",in:10,pole:1,te:1}},
  MBS116:{bild:"https://assets.hager.com/step-content/P/HA_16255195/11/std.lang.all/MBS116.webp",tech:{art:"ls",char:"B",in:16,pole:1,te:1}},
  MBS120:{bild:"https://assets.hager.com/step-content/P/HA_16255196/11/std.lang.all/MBS120.webp",tech:{art:"ls",char:"B",in:20,pole:1,te:1}},
  MBS125:{bild:"https://assets.hager.com/step-content/P/HA_16255197/11/std.lang.all/MBS125.webp",tech:{art:"ls",char:"B",in:25,pole:1,te:1}},
  MBS132:{bild:"https://assets.hager.com/step-content/P/HA_16255198/11/std.lang.all/MBS132.webp",tech:{art:"ls",char:"B",in:32,pole:1,te:1}},
  MCS116:{bild:"https://assets.hager.com/step-content/P/HA_16256279/11/std.lang.all/MCS116.webp",tech:{art:"ls",char:"C",in:16,pole:1,te:1}},
  MBS316:{bild:"https://assets.hager.com/step-content/P/HA_16255234/11/std.lang.all/MBS316.webp",tech:{art:"ls",char:"B",in:16,pole:3,te:3}},
  MCS316:{bild:"https://assets.hager.com/step-content/P/HA_16256337/11/std.lang.all/MCS316.webp",tech:{art:"ls",char:"C",in:16,pole:3,te:3}},
  CDS440D:{bild:"https://assets.hager.com/step-content/P/HA_16197936/11/std.lang.all/CDS440D.webp",tech:{art:"rcd",in:40,idn:30,typ:"A",pole:4,te:4}},
  CDS463D:{bild:"https://assets.hager.com/step-content/P/HA_16197955/11/std.lang.all/CDS463D.webp",tech:{art:"rcd",in:63,idn:30,typ:"A",pole:4,te:4}},
  ADS916D:{bild:"https://assets.hager.com/step-content/P/HA_16371443/11/std.lang.all/ADS916D.webp",tech:{art:"rcbo",char:"B",in:16,idn:30,typ:"A",pole:"1+N",te:2}},
  A9F03116:{bild:"https://www.elektrikshop.de/images/product_images/original_images/2736_0.jpg",tech:{art:"ls",char:"B",in:16,pole:1,te:1}},
  A9F04116:{bild:"https://www.elektrikshop.de/images/product_images/original_images/2748_0.jpg",tech:{art:"ls",char:"C",in:16,pole:1,te:1}},
  A9F03132:{bild:"https://www.elektrikshop.de/images/product_images/original_images/2739_0.jpg",tech:{art:"ls",char:"B",in:32,pole:1,te:1}},
  A9F03316:{bild:"https://www.elektrikshop.de/images/product_images/original_images/2742_0.jpg",tech:{art:"ls",char:"B",in:16,pole:3,te:3}},
  A9F04316:{bild:"https://www.elektrikshop.de/images/product_images/original_images/2754_0.jpg",tech:{art:"ls",char:"C",in:16,pole:3,te:3}},
  A9F03332:{bild:"https://www.elektrikshop.de/images/product_images/original_images/2745_0.jpg",tech:{art:"ls",char:"B",in:32,pole:3,te:3}},
  A9Z21440:{bild:"https://www.elektrikshop.de/images/product_images/original_images/2763_0.jpg",tech:{art:"rcd",in:40,idn:30,typ:"A",pole:4,te:4}},
  A9Z21463:{bild:"https://www.elektrikshop.de/images/product_images/original_images/2764_0.jpg",tech:{art:"rcd",in:63,idn:30,typ:"A",pole:4,te:4}},
  A9D56616:{bild:"https://www.elektrikshop.de/images/product_images/original_images/2770_0.jpg",tech:{art:"rcbo",char:"B",in:16,idn:30,typ:"A",pole:"1+N",te:2}}};
const matInfo=m=>m?MAT_INFO[matHnr(m.herstellerNr)]||null:null;
const matBild=m=>m&&(m.bild||(matInfo(m)||{}).bild)||"";
const matTech=m=>m&&(m.tech||(matInfo(m)||{}).tech)||null;
/* Kurzbeschreibung der technischen Daten: „B 16 A · 1-polig · 1 TE“, „RCD 40 A / 30 mA Typ A · 4-polig · 4 TE“ */
function matTechText(t){ if(!t) return ""; const p=t.pole?`${t.pole}-polig`:"", te=t.te?`${t.te} TE`:"";
  if(t.art==="rcd") return [`RCD ${t.in} A / ${t.idn} mA Typ ${t.typ||"A"}`,p,te].filter(Boolean).join(" · ");
  if(t.art==="rcbo") return [`FI/LS ${t.char||""}${t.in} · ${t.idn} mA Typ ${t.typ||"A"}`,p,te].filter(Boolean).join(" · ");
  return [`${t.char||""} ${t.in} A`.trim(),p,te].filter(Boolean).join(" · "); }
const matFoto=(m,cls)=>{ const u=matBild(m); return u?`<span class="mat-foto${cls?" "+cls:""}"><img src="${esc(typeof bildLokal==="function"?bildLokal(u):u)}" alt="" loading="lazy" onerror="this.parentNode.classList.add('weg')"></span>`:""; };
/* Firmen-Materialliste (MAT_FIRMA, unten) ist fest eingebaut und wird NICHT als Datensätze gespeichert – sonst müsste jedes
   Gerät ~400 Dateien hochladen. Gespeichert wird nur, was jemand ändert oder löscht (gleiche ID überschreibt das Firmen-Teil). */
let matFirmaObj=null;
function matFirma(){ if(matFirmaObj) return matFirmaObj;
  matFirmaObj=MAT_FIRMA.map(([name,kategorie,einheit,hersteller,herstellerNr,sonepar,efg,gae,kz,notiz,g])=>({id:matSlug(name),name,kategorie,einheit:einheit||"Stück",
    hersteller:hersteller||"",herstellerNr:herstellerNr||"",sonepar:sonepar||"",weitere:[efg&&{bei:"EFG",nr:efg},gae&&{bei:"Gäfgen",nr:gae},kz&&{bei:"Kürzel",nr:kz}].filter(Boolean),
    notiz:notiz||"",gruppe:MAT_FIRMA_GR[g]||"",firma:true}));
  return matFirmaObj; }
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
/* Die Nummer, mit der der Artikel gesucht wird: Spalte „EDV-Nummer Sonepar“ der Firmenliste – dort stehen auch die Kürzel der Pauschalen */
function matNr(m){ if(!m) return ""; return m.sonepar||((m.weitere||[]).find(w=>w&&w.bei==="Kürzel"&&w.nr)||{}).nr||""; }
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
/* MAT_FIRMA_START – erzeugt aus „MateriallisteIrrgang1125.pdf“ (Stand 03.09.2025). Felder:
   [Bezeichnung, Kategorie, Einheit (leer = Stück), Hersteller, Artikelnr. Hersteller, Sonepar, EFG, Gäfgen, Kürzel, Notiz, Abschnitt] */
const MAT_FIRMA_STAND="03.09.2025";
const MAT_FIRMA_GR=["Verteilungseinbau","Kabelschuhe","Reihenklemmen","Maschinen, Messgeräte, Pauschalen","Relais / Eltako","Neozed Material","DIAZED Material","Feinsicherungen","NH Sicherungen","Sicherungsautomaten Hager","FI-Schalter Hager","Sicherungsautomaten Schneider","FI-Schalter Schneider","BALS Quick Connect","Schuko-Stecker","Nagelschellen / Nagelscheiben","Sammelhalterungen","Weiteres Installationsmaterial","Kabelbinder","CADDY / ERICO Material","Bauchemie","Unterputzdosen","Hohlwanddosen","Feuchtraum Abzweigdosen","Verschraubungen","Muffen und Zubehör","Klemmen","Bettermann Quick Schellen","Kunststoffstangenrohr FPKu-EM-F","FFKuS-EM-F schweres Betonrohr","FBY Rohr leichtes Betonrohr","Klickrohr","Bügelschellen und Zubehör","Brandschutz","Kanäle","Eckkanal","Fußleistenkanal 80 mm Tehalit","Brüstungskanäle","Stahlkanäle","Fernmeldeleitungen J-Y(St)Y","EIB-/Busleitung","SAT Material","Datenleitung / Netzwerk","Telefondosen","NYM-J","Erdkabel","Draht starr H07V-U","Ölflex","Gummikabel","Schlauchleitung","Leuchten & Zubehör","Schiffsarmaturen","Leuchtmittel","Philips LED Leuchten rund","Feuchtraum LED Leuchten","Herdanschlussdosen / Dreikammerdosen","Batterien","Einsätze","Erdungsmaterial","HILTI","Durchlauferhitzer","E Check","Rolladenzubehör","Klingel Material"];
const MAT_FIRMA=[
["Schalter mit Kontrolllampe grün 1×16 A","verteiler","","","SVN 413","5700144","","","","",0],
["Schütz, 20 A Hager","verteiler","","Hager","ESC325S","5705897","QESC325SHA","4873796","","",0],
["Schütz, 40 A Hager","verteiler","","Hager","ESC440","5706006","","1435054","","",0],
["Schütz, 63 A Hager","verteiler","","Hager","ES463","5701710","","1435055","","",0],
["3-Phasen Schiene für 12 TE 210 mm","verteiler","","","KDN363A","0606731","","","","",0],
["3-Phasen Schiene für 12 TE 210 mm für FI","verteiler","","","KDN363F","0606733","","","","",0],
["4-Phasen Schiene für FI / LS 12 TE 210 mm","verteiler","","","KDN451D","0606736","","","","",0],
["Berührungsschutz für Phasenschienen","verteiler","","","KZ059","0603415","","","","",0],
["Phasenschiene Senkrecht 3-fach links","verteiler","","","KCF668L","3402674","","","","",0],
["Phasenschiene Senkrecht 2-fach links","verteiler","","","KCF663L","3402671","","","","",0],
["1-Phasen Schiene Quick Connect","verteiler","","","KDN163 A","","","","","",0],
["Verdrahtungsbrücken 10 mm² 250 mm lang","verteiler","","","","0611611","","","","",0],
["Abgangskabelbaum Zähler 10 mm²","verteiler","","","","0672761","","","","",0],
["Zugangskabelbaum Zähler 10 mm²","verteiler","","","","0672701","","","","",0],
["Draht flexibel 1,5 mm²","leitung","m","","H07V-K1,5","7500011","","","","",0],
["Draht flexibel 2,5 mm²","leitung","m","","","7500014","","","","",0],
["Draht flexibel 6 mm²","leitung","m","","","7500019","","","","",0],
["Draht flexibel 10 mm² H07V-K 10,0","leitung","m","","","0102194","","","","",0],
["Draht flexibel 16 mm²","leitung","m","","","0102203","","","","",0],
["Draht flexibel 25 mm²","leitung","m","","","0102226","","","","",0],
["Aderendhülsen isoliert 1,5 mm²","klemmen","Packung","","","0352775","","","","",0],
["Aderendhülsen isoliert 2,5 mm²","klemmen","Packung","","","0352777","","","","",0],
["Aderendhülsen isoliert 6 mm²","klemmen","Packung","","","0351576","","","","",0],
["Aderendhülsen isoliert 10 mm²","klemmen","Packung","","","0736819","QAEHI1018RTK","","","",0],
["Aderendhülsen isoliert 16 mm²","klemmen","Packung","","","0736820","QAEHI1618BLK","","","",0],
["Quetschkabelschuh 10, Gabelform","klemmen","","","","0352448","","","","",0],
["Duohülse 10 mm²","klemmen","","","","0352390","","","","",0],
["Stossverbinder 1,5 - 2,5 mm² Isoliert","klemmen","","","","0352676","","","","",0],
["STOSSVERBINDER 16mm²","klemmen","","","","0352107","","","","",0],
["STOSSVERBINDER 25 mm²","klemmen","","","","","","1121482","","",0],
["Klingeltrafo 8 Volt 1 A","verteiler","","","St 301","0603510","","1513110","","",0],
["Abdeckstreifen","verteiler","","","S 35S","0602180","","","","",0],
["Maico Nachlaufrelais VZ 6","verteiler","","Maico","","1602475","","","","",0],
["HAGER Plantasche zum Einkleben","verteiler","","Hager","FZ 794","0602195","","","","",0],
["5-polige isolierte Hauptleitungsklemme","verteiler","","","KH25C","0604858","","1210024","","",0],
["Hager Einspeiseadapter 1-25qmm, 5-polig","verteiler","","Hager","K96ESA5","2204265","","","","",0],
["EHZ Adapterplatte","verteiler","","","KU33LHE","5607490","","","","",0],
["Eaton EHZ Adapter NUR Intern","verteiler","","Eaton","ZSD-Z3","5601206","","","","",0],
["EATON Haube für EHZ Adapter ZSD","verteiler","","Eaton","","0633011","","","","",0],
["N / PE Klemme PTU 16/14×2,5 eltric","verteiler","","eltric","","","4922120","","","",0],
["Hutschienenzähler EGB Sinus 85","verteiler","","","","114555","","","","",0],
["Hutschiene gelocht","verteiler","","","","0480411","","","","",0],
["Stiftkabelschuh 35 mm²","klemmen","","","","0352360","","","","",1],
["Rohrkabelschuh 35 mm² / 10","klemmen","","","","0352042","","","","",1],
["Rohrkabelschuh 35 mm² / 8","klemmen","","","","0352041","","","","",1],
["WAGO Inst.-Etagenklemme L/N-T/PE 4 mm²","klemmen","","WAGO","2003-7641","0417367","","","","",2],
["WAGO Inst.-Etagenklemme L/L/PE 4 mm²","klemmen","","WAGO","2003-7642","0417368","","","","",2],
["WAGO Inst.-Etagenklemme L/N/PE 4 mm²","klemmen","","WAGO","2003-7646","0417370","","","","",2],
["WAGO Abschlussplatte","klemmen","","WAGO","2003-7692","0417606","","","","",2],
["WAGO Schachtelbrücker","klemmen","","WAGO","2002-482","0466262","","","","",2],
["WAGO Sammelschienenträger","klemmen","","WAGO","2009-305","0417452","","","","",2],
["WAGO Endklammer","klemmen","","WAGO","249-117","0452720","","","","",2],
["Sammelschiene 10×3 mm","klemmen","","","210-133","0452670","","","","",2],
["WAGO Inst.-Etagenklemme N/L/PE 6 mm²","klemmen","","WAGO","2005-7646","0431342","","","","",2],
["WAGO Inst.-Etagenklemme L/L/PE 6 mm²","klemmen","","WAGO","2005-7642","0431339","","","","",2],
["WAGO Endplatte 6 mm² Endplatte","klemmen","","WAGO","2005-7692","0431344","","","","",2],
["Beschriftungspauschale für Reihenklemmen","pausch","Pauschale","","","","","","beschr1","",3],
["Durchgangsklemme 16 mm grau","klemmen","","","2016-1201","0417255","","","","",2],
["Durchgangsklemme 16 mm blau","klemmen","","","2016-1204","0417257","","","","",2],
["Durchgangsklemme 16 mm grün gelb","klemmen","","","2016-1207","0417261","","","","",2],
["Endplatte 2016","klemmen","","","2016-1292","0417322","","","","",2],
["WAGO N trennklemme 16 mm²","klemmen","","WAGO","2016-7714","0479484","","","","",2],
["Schutzleiterklemme 10 mm²","klemmen","","","783-607","0452244","","","","",2],
["Querbrücker 70 A grau","klemmen","","","283-402","0452643","","","","",2],
["WAGO N Trennklemme 10 mm²","klemmen","","WAGO","783-613","0452249","","","","",2],
["Stromstoßschalter 230 Volt","verteiler","","","S 12 - 100 - 230","0665403","","","","",4],
["Schalt-,Steuer,Koppelrelais ER12-001-8..230V UC (Hutschiene)","verteiler","","Eltako","ER12-001-UC","0632857","","","","Hutschiene",4],
["Schalt-,Steuer,Koppelrelais ER12-001-8..230V UC (UP Version)","verteiler","","Eltako","ER61-UC","0632859","","","","UP Version",4],
["Neozed Element komplett","pausch","Pauschale","","","","","","neozed","Leistung",5],
["Isolierte Neozedelemente 3×16 A. D 01","schutz","","","","0630112","","","","",5],
["Isolierte Neozedelemente 3×63 A. D 02","schutz","","","","5801813","","2261860","","",5],
["LINOCUR-Lasttrennschalter, D02, 63A 3pol","schutz","","","","5801551","","","","",5],
["Schraubkappen D 01 bis 16 Ampere","schutz","","","","0630485","","","","",5],
["Schraubkappen D 02 bis 63 Ampere","schutz","","","","0630481","","2261871","","",5],
["Neozedsicherungen 2 - 63 Ampere","schutz","","","","0630413","","2261859","","",5],
["Passhülseneinsätze 2 - 50 Ampere","schutz","","","","0630462","","1266526","","",5],
["DIAZED Sicherungen 2 - 63 Ampere","schutz","","","","5812065","","","","",6],
["Feinsicherungen","schutz","","","","0639306","","","","",7],
["NH Sicherungen Gr 00 16 - 100 Ampere","schutz","","","","0610388","","","","",8],
["LS Hager 10 A/B 1-polig","schutz","","Hager","MBS 110","0606806","","","","",9],
["LS Hager 16 A/B 1-polig","schutz","","Hager","MBS 116","0606808","","1275132","","",9],
["LS Hager 16 A/C 1-polig","schutz","","Hager","MCS 116","0607120","","","","",9],
["LS Hager 20 A/B 1-polig","schutz","","Hager","MBS 120","0606809","","","","",9],
["LS Hager 25 A/B 1-polig","schutz","","Hager","MBS 125","0606810","","","","",9],
["LS Hager 32 A/B 1-polig","schutz","","Hager","MBS 132","0606811","","","","",9],
["LS Hager 16 A/B 3-polig","schutz","","Hager","MBS 316","0606818","","","","",9],
["LS Hager 16 A/C 3-polig","schutz","","Hager","MCS 316","0606863","","","","In der Firmenliste stand MBS 316 (das ist B 16) – für C 16 3-polig ist es MCS 316",9],
["FI Hager 40/0,03 4-polig","schutz","","Hager","CDS440D","0606663","","","","",10],
["FI Hager 63/0,03 4-polig","schutz","","Hager","CDS463D","0606664","","","","",10],
["FI/LS Hager 16A/B - 30 mA","schutz","","Hager","ADS916D","5705400","","","","",10],
["LS Schneider 16 A/B 1-polig","schutz","","Schneider Electric","A9F03116","5706693","","","","",11],
["LS Schneider 16 A/C 1-polig","schutz","","Schneider Electric","A9F04116","5706760","","","","",11],
["LS Schneider 32 A/B 1-polig","schutz","","Schneider Electric","A9F03132","5706696","","","","Herstellernr. fehlte in der Firmenliste – A9F03132 ergänzt (iC60N B32 1-polig)",11],
["LS Schneider 16 A/B 3-polig","schutz","","Schneider Electric","A9F03316","5706716","","","","",11],
["LS Schneider 16 A/C 3-polig","schutz","","Schneider Electric","A9F04316","5706790","","","","",11],
["LS Schneider 32 A/B 3-polig","schutz","","Schneider Electric","A9F03332","5706719","","","","",11],
["FI Schneider 40/0,03 4-polig","schutz","","Schneider Electric","A9Z21440","5707624","","","","In der Firmenliste stand A9Z26440 (500-mA-FI) – auf A9Z21440 (30 mA Typ A) korrigiert, Sonepar-Nr. unverändert. Noch prüfen.",12],
["FI Schneider 63/0,03 4-polig","schutz","","Schneider Electric","A9Z21463","5707625","","","","In der Firmenliste stand A9Z26463 (500-mA-FI) – auf A9Z21463 (30 mA Typ A) korrigiert, Sonepar-Nr. unverändert. Noch prüfen.",12],
["FI/LS Schneider 16A/B - 30 mA","schutz","","Schneider Electric","A9D56616","5706619","","","","",12],
["3 Phasen Schiene","verteiler","","Schneider Electric","A9XPH312","0791687","","","","",12],
["BALS Quick Connect Stecker 5×16 A","schalter","","Bals","","1000111","","","","",13],
["BALS Quick Connect Kupplung 5×16 A","schalter","","Bals","","1000112","","","","",13],
["BALS Quick Connect Steckdose 5×16 A","schalter","","Bals","","1000584","","","","",13],
["BALS Quick Connect Stecker 5×32 A","schalter","","Bals","","1002207","","","","",13],
["BALS Quick Connect Kupplung 5×32 A","schalter","","Bals","","1002210","","","","",13],
["BALS Quick Connect Steckdose 5×32 A","schalter","","Bals","","1022007","","","","",13],
["SCHUKO Stecker weiß","schalter","","","122427","0921004","","","","",14],
["SCHUKO Kupplung weiß","schalter","","","122415","","","","","",14],
["SCHUKO Gummi Stecker schwarz","schalter","","","123551","","","","","",14],
["SCHUKO Gummi Kupplung schwarz","schalter","","","173091","","","","","",14],
["Befestigungspauschale Dübel Schraube 6 & 8 mm","pausch","Pauschale","","","","","","bef1","",3],
["Nagelschellen 7 - 12, Nägel 35","befest","Packung","","","0420847","","","","",15],
["Nagelschellen 17 - 21","befest","Packung","","","0420205","","","","",15],
["Nagelschellen 21 - 25","befest","Packung","","","0420206","","","","",15],
["OBO Nagelfix 1966/60 60 Nägel Nagelscheiben","befest","Packung","OBO Bettermann","","0420423","","1165758","","",15],
["Sammelhalterungen max. 30 Leitungen","befest","","","2031","0420452","","","","",16],
["Montageband / Lochband","befest","Rolle","","","0420374","","","","",17],
["Obo Dübel","befest","Packung","OBO Bettermann","","0443533","","","","",17],
["Gipskartondübel, Metall incl. Schraube","befest","Packung","","","0441260","","","","",17],
["Hakennägel 70 mm","befest","Packung","","","0421773","","","","",17],
["Deckenhaken","befest","","","","0420793","","","","",17],
["F-Clip","befest","","eltric","","190100","","","","",17],
["Cimco Kabelbinder 360×4,8","befest","Packung","Cimco","181369","0428719","","","","",18],
["Erico Kastenklemme mit Gewinde 172060","befest","","ERICO","","2637160","","","","",19],
["ERICO Klammer P7 für Lichtbänder","befest","","ERICO","","0438487","","","","",19],
["Notglied P 1","befest","","ERICO","","0438495","","","","",19],
["Knotenkette CHK 30K 900 N","befest","","ERICO","","0438285","","","","",19],
["Silikon 310 ml","befest","","","","0441740","","","","",20],
["Bauschaum","befest","","","","0441460","CAREMS750","","","",20],
["Montagekleber","befest","","","","0397028","","","","",20],
["Acryl 310 ml","befest","","","","0441347","","","","",20],
["Kai. 1174-25 Federdeckel 70 mm","dosen","","Kaiser","","0473124","","","","",21],
["Geräteschraube, 3,2×40 mm","dosen","Packung","","","0473092","","","","",21],
["Putzausgleichring Höhe 24 mm","dosen","","","","0473088","","","","",21],
["Signaldeckel / Putzdeckel","dosen","","","","0473136","","","","",21],
["Haftputz Gips / Rotband","dosen","Sack","","","1754039","","","","",21],
["Montagezement Raccofix","dosen","Sack","Knauf","","1754041","","","","",21],
["KAISER Schalterklemmdose winddicht","dosen","","Kaiser","1555-21","0472879","","","","",21],
["KAISER Electronicdose winddicht","dosen","","Kaiser","1068-21","0312032","","","","",21],
["Wandauslassdose Schiffchen","dosen","","","","0473110","","","","",21],
["KAISER Winddichte Hohlwand Schalterdosen","dosen","","Kaiser","9264-21","0435085","","","","",22],
["KAISER Verbindungsstutzen","dosen","","Kaiser","9060-98","0400095","","","","",22],
["KAISER HW-Elektronikdose ECONFlex luftdicht","dosen","","Kaiser","9268-94","8402642","","","","",22],
["KAISER Hohlwand Schalterklemm dosen","dosen","","Kaiser","9064-01","0473240","","","","",22],
["KAISER Hohlwand Schalterdosen","dosen","","Kaiser","9063-01","","","","","",22],
["Thermoplast Dose 89×43×37 Mini Dose","dosen","","","mini 25","0472050","","","","",23],
["Thermoplast Dose 85×85×37","dosen","","","","0496221","","","","OBO mit Logo",23],
["Thermoplast Dose 130×85×38","dosen","","","i 16","0473061","","","","",23],
["Kabelverschraubung, SKINTOP M 16 Lapp","befest","","Lapp","","0484144","","","","",24],
["Kabelverschraubung, SKINTOP M 20 Lapp","befest","","Lapp","","0484143","","","","",24],
["Kabelverschraubung, SKINTOP M 25 Lapp","befest","","Lapp","","0484274","","","","",24],
["Kabelverschraubung, SKINTOP M 32 Lapp","befest","","Lapp","","0484275","","","","",24],
["Kabelverschraubung, SKINTOP M 40 Lapp","befest","","Lapp","","0484276","","","","",24],
["Schrumpfmuffe 5×1,5 -6 mm²","klemmen","","","","0321516","","","","",25],
["Schrumpfmuffe 5×1,5 -16 mm²","klemmen","","","","0320079","","1103221","","",25],
["Schrumpfmuffe 4×25 mm²","klemmen","","","","","","1103212","","",25],
["Schrumpfschlauch SRH2 22-6","klemmen","","","","0321783","","","","",25],
["Schrumpfschlauch SRH2 34-7","klemmen","","","","0321779","","","","",25],
["Gießharz 286 ml. Krümmelharz Spelsberg","klemmen","","Spelsberg","","","","","","",25],
["Cellpack Kabel Reparaturset S","klemmen","","Cellpack","SRMH3 1,5","","","5141680","","",25],
["3M Telec. Scotchcast 8882 Kabelharz","klemmen","","3M","","0318158","","","","",25],
["Kaltschrumpf Schlauch","klemmen","","","","0320413","","","","",25],
["Hellermann Kabel-Reparatur-Set LVRK-24/6-200-POX-BK","klemmen","","HellermannTyton","","0312274","","","","",25],
["WAGO Klemmen 5×2,5","klemmen","","WAGO","2273-205","0486604","","","","",26],
["WAGO Klemmen 8×2,5","klemmen","","WAGO","2273-208","0486605","","","","",26],
["WAGO Hebelklemme 5-polig","klemmen","","WAGO","221-415","5101553","","","","",26],
["WAGO Hebelklemme 3-polig","klemmen","","WAGO","221-413","5101552","","","","",26],
["WAGO Befestigungsadapter","klemmen","","WAGO","221-500","2203219","","","","",26],
["WAGO Klemme 3×2,5 - 6 mm","klemmen","","WAGO","773-173","0463791","","","","",26],
["WAGO MICRO Klemmen 4-polig","klemmen","","WAGO","243-304","0452211","","","","",26],
["Telefonverbinder mit Fettfüllung","klemmen","","","","4513787","","","","",26],
["OBO Quick-Schelle M20","rohr","","OBO Bettermann","","0409027","QQUICKM20","2134713","","",27],
["OBO Quick-Schelle M25","rohr","","OBO Bettermann","","0409028","QQUICKM25","2134714","","",27],
["OBO Quick-Schelle M32","rohr","","OBO Bettermann","","0409029","QQUICKM32","2134715","","",27],
["OBO Quick-Schelle M40","rohr","","OBO Bettermann","","0409036","QQUICKM40","2134716","","",27],
["Kunststoffrohr FPKu-EM-F M20","rohr","m","","","0500348","QKUPA20H","","","Bund 111 m",28],
["Kunststoffrohr FPKu-EM-F M25","rohr","m","","","0500350","QKUPA25H","","","Bund 57 m",28],
["Kunststoffrohr FPKu-EM-F M32","rohr","m","","","0500351","QKUPA32H","","","Bund 57 m",28],
["Kunststoffrohr FPKu-EM-F M40","rohr","m","","","0500352","QKUPA40H","","","Bund 21 m",28],
["Kunststoffrohr FPKu-EM-F M20, 2-m-Stange","rohr","","","","2127448","","","","",28],
["Kunststoffrohr FPKu-EM-F M25, 2-m-Stange","rohr","","","","2127449","","","","",28],
["Betonrohr FFKuS-EM-F M20 (schwer)","rohr","m","","","0500377","","","","Ring 50 m",29],
["Betonrohr FFKuS-EM-F M25 (schwer)","rohr","m","","","0500378","","","","Ring 50 m",29],
["Betonrohr FFKuS-EM-F M32 (schwer)","rohr","m","","","0500379","","","","Ring 25 m",29],
["Betonrohr FFKuS-EM-F M40 (schwer)","rohr","m","","","0500380","","","","Ring 25 m",29],
["Betonrohr FFKuS-EM-F M50 (schwer)","rohr","m","","","0500381","","","","Ring 25 m",29],
["FBY-ELF M16 (leichtes Betonrohr)","rohr","m","","","0500355","","","","",30],
["FBY-ELF M20 (leichtes Betonrohr)","rohr","m","","","0500356","","","","",30],
["FBY-ELF M25 (leichtes Betonrohr)","rohr","m","","","0500357","","","","",30],
["FBY-ELF M40 (leichtes Betonrohr)","rohr","m","","","0500359","","","","",30],
["Fränkische Wellrohr verschließbar, geschlitzt sw CO-FLEX-PP-UV 20","rohr","m","Fränkische","","0501205","","","","",31],
["Fränkische Wellrohr verschließbar, geschlitzt sw CO-FLEX-PP-UV 23","rohr","m","Fränkische","","0502578","","","","",31],
["Fränkische Wellrohr verschließbar, geschlitzt sw CO-FLEX-PP-UV 45","rohr","m","Fränkische","","0502580","","","","",31],
["Bügelschelle Niedax BK 26","befest","","Niedax","","","QNIBK26N","","","",32],
["Bügelschelle Niedax BK 34","befest","","Niedax","","","QNIBK34N","","","",32],
["Bügelschelle Niedax BK 50","befest","","Niedax","","","QNIBK50N","","","",32],
["Gegenwanne Niedax GW 26","befest","","Niedax","","","QGW26N","","","",32],
["Gegenwanne Niedax GW 34","befest","","Niedax","","","QGW34N","","","",32],
["Gegenwanne Niedax GW 50","befest","","Niedax","","","QGW50N","","","",32],
["OBO Profilscheine 1268 L","befest","","OBO Bettermann","","","QOBO1268SL2000","","","",32],
["FLAMRO Brandschutzmasse Kartusche 0,4 kg","sonst","","FLAMRO","30004","","","","","",33],
["FLAMRO Schild für","sonst","","FLAMRO","","","","","","Bezeichnung in der Liste unvollständig",33],
["FLAMRO Dämmschichtbildner Kartusche 0,4 kg","sonst","","FLAMRO","DSB-W","","","FLDSB400","","",33],
["FLAMRO Schild für DSB","sonst","","FLAMRO","","","","FLKSALAR","","",33],
["Flamro Systemplatte SPN 60 mm","sonst","","FLAMRO","","","","","","",33],
["FLAMRO Brandschutzmasse Eimer 12,5 kg","sonst","","FLAMRO","10125","","","","","",33],
["Kanal 15 / 15","rohr","m","","LF 20020","0490317","","","","",34],
["Kanal 15 / 30","rohr","m","","WDK 15030","0404340","","","","",34],
["Kanal 30 / 30","rohr","m","","WDK 30030","0492149","","","","",34],
["Kanal 40 / 40","rohr","m","","LF 40040","0492154","","","","",34],
["Kanal 40 / 60","rohr","m","","LF 40060","0492155","","9030602","","",34],
["Kanal 60 / 60","rohr","m","","LF 60060","0492165","","","","",34],
["Kanal 60 / 110","rohr","m","","LF 60100","0492169","","","","",34],
["Kanal 60 / 170","rohr","m","","WDK 60170","0404439","","","","",34],
["Eckkanal 40 mm Tehalit","rohr","","Tehalit","EK 40040","0497018","","","","",35],
["Eckkanal Kupplung","rohr","","Tehalit","L 2774","0497055","","","","",35],
["Eckkanal Endstück","rohr","","Tehalit","L 2773","0497052","","","","",35],
["Eckkanal Außeneck","rohr","","Tehalit","L 2772","0497050","","","","",35],
["Eckkanal Inneneck","rohr","","Tehalit","L 2771","0497049","","","","",35],
["Eckkanal T Abzeiger","rohr","","Tehalit","L 2778","0497056","","","","",35],
["Fußleistenkanal 80 mm Unterteil","rohr","m","Tehalit","SL 200801","5207313","","","","",36],
["Fußleistenkanal 80 mm Oberteil","rohr","m","Tehalit","SL 2008029010","5207315","","","","",36],
["Fußleistenkanal Kupplung","rohr","","Tehalit","SL 2008079010","5207351","","","","",36],
["Fußleistenkanal Endstück","rohr","","Tehalit","SL 2008069010","5207343","","","","",36],
["Fußleistenkanal Außeneck","rohr","","Tehalit","SL 2008039010","5207327","","","","",36],
["Fußleistenkanal Inneneck","rohr","","Tehalit","SL 2008049010","5207335","","","","",36],
["Fußleistenkanal 2 fach Steckdosen Modul","rohr","","Tehalit","SL200809009010","5207370","","","","",36],
["Fußleistenkanal Blende für Steckdosen Modul","rohr","","Tehalit","SL20080A9010","5207412","","","","",36],
["Fußleistenkanal Geräteträger universal","rohr","","Tehalit","SL200809019010","5209084","","","","",36],
["Tehalit Aufbodenkanal18×75mm SL 18075 gr","rohr","m","Tehalit","","5495311","","","","",36],
["Brüstungskanal 70 / 130","rohr","m","","GK-70130RW","5207577","","","","",37],
["Brüstungskanal Oberteil","rohr","m","","GK-OTGRW","5207641","","","","",37],
["Endplatte 70 / 130","rohr","","","GK-E70130RW","5207601","","","","",37],
["CEE 16 A Gerätedose komplett","rohr","","","CEE 16E2","0435090","","","","",37],
["Gerätedose 1 fach","rohr","","","71GD6","0430441","","","","",37],
["Gerätedose 2 fach","rohr","","","71GD7","5200596","","","","",37],
["Flanschrahmen für blaue CEE","rohr","","OBO Bettermann","6288820","","","","","",37],
["NIEDAX LLK 40.040 natur vz","rohr","m","Niedax","","2150830","","","","",38],
["NIEDAX LLK 60.060 natur vz","rohr","m","Niedax","","2150832","","","","",38],
["Fernmelde-Innenkabel J-2Y(ST)Y 2×2×0,6","leitung","m","","","0145632","","","","",39],
["J-Y(St)Y 2×2×0,6","leitung","m","","","0140032","","1070002","","",39],
["J-Y(St)Y 4×2×0,6","leitung","m","","","0140034","","1070004","","",39],
["J-Y(St)Y 6×2×0,6","leitung","m","","","0140036","","1070006","","",39],
["J-Y(St)Y 2×2×0,8","leitung","m","","","","","1070052","","",39],
["J-Y(St)Y 4×2×0,8","leitung","m","","","","","1070054","","",39],
["J-Y(St)Y 6×2×0,8","leitung","m","","","","","1070056","","",39],
["J-Y(St)Y 10×2×0,8","leitung","m","","","","","1070060","","",39],
["EIB-Busleitung 2×2×0,8","leitung","m","","","0140116","","","","",40],
["KOAX Kabel 75 Ohm","kommu","m","","","1907327","","","","",41],
["Astro Dachsparrenhalter","kommu","","Astro","","1922457","","","","",41],
["Kathrein Mastkappe","kommu","","Kathrein","","1926071","","","","",41],
["F Verbinder","kommu","","","","8738208","","","","",41],
["F Stecker","kommu","","","","1903662","","","","",41],
["SAT 3 Loch Anschlussdose","kommu","","","EDA 302 F","1906754","","","","",41],
["SAT 3 Loch Durchgangsdose","kommu","","","GDA 313 F","1906755","","","","",41],
["SAT 3 Loch Doppel Anschlussdose","kommu","","Hirschmann","","1906760","","","","",41],
["SIMPLEX Datenleitung KAT 7 600 MHZ","kommu","m","","","2110837","QUC900SS23R","","","",42],
["DUPLEX Datenleitung Kat 7 600 MHZ","kommu","m","","","2105091","","","","",42],
["Draka Datenkabel, Kat.7, S/FTP AWG23","kommu","m","Draka","","4530494","","","","Erdkabel",42],
["Datendose KAT 6 2 x RJ 45 Dose LSA plus","kommu","","","","4598529","","","","BTR E Dat Design",42],
["Datendose KAT 6 2 x RJ 45 Rahmen & Module","kommu","","","","4598523","","","","BTR E Dat Modul",42],
["BTR Anschlussdose Leerrahmen","kommu","","BTR","","4503842","","","","",42],
["BTR E Dat Modul Cat 6 a","kommu","","BTR","","4528393","","","","TN E-DAT modul",42],
["BTR E Dat Modul Cat 6 Hutschienenmontage","kommu","","BTR","","4506795","","","","",42],
["Patchkabel 2 mtr. CAT 6","kommu","","","","4514440","","","","",42],
["BTR Verbindungsmodul","kommu","","BTR","130863-02-f","4538291","","","","",42],
["Cat 7 Verbindungsmodul","kommu","","","","4521067","","","","",42],
["Modulträger 24 Port leer","kommu","","","","4598520","","","","",42],
["Satz Patchfeldschrauben 4 Stck","kommu","Satz","","","0430866","","","","",42],
["Dätwyler Keystone für Schneider Electric Optiline Kanal","kommu","","Dätwyler","","4527499","","","","",42],
["R&M 24 Port Patchfeld","kommu","","R&M (Reichle & De-Massari)","R305120","4508188","","","","",42],
["R&M Anschlussmodul Keystone","kommu","","R&M (Reichle & De-Massari)","R302372","4508187","","","","",42],
["R&M UP Rahmen DIN Anschlussdose 2 Port weiss","kommu","","R&M (Reichle & De-Massari)","R306010","4508196","","","","",42],
["R&M AP Dose 2 Port","kommu","","R&M (Reichle & De-Massari)","R310786","4508425","","","","",42],
["AP TAE Dosen N/F/N","kommu","","","","1239225","","","","",43],
["TAE UP Dose N/F/N","kommu","","","465236","0805186","","","","",43],
["NYM-J 1×6 mm²","leitung","m","","","0110303","","","","",44],
["NYM-J 1×16 mm²","leitung","m","","","0110319","","","","",44],
["NYM-J 3×1,5 mm²","leitung","m","","","0110320","","1020310","","",44],
["NYM-J 5×1,5 mm²","leitung","m","","","0110350","","1020510","","",44],
["NYM-J 7×1,5 mm²","leitung","m","","","0110374","","1020710","","",44],
["NYM-J 3×2,5 mm²","leitung","m","","","0110328","","1020320","","",44],
["NYM-J 5×2,5 mm²","leitung","m","","","0110358","","1020520","","",44],
["NYM-J 3×6 mm²","leitung","m","","","0110523","","","","",44],
["NYM-J 4×6 mm²","leitung","m","","","0110333","","1020460","","",44],
["NYM-J 5×4 mm²","leitung","m","","","0110362","","1020540","","",44],
["NYM-J 5×6 mm²","leitung","m","","","0110554","","1020560","","",44],
["NYM-J 5×10 mm²","leitung","m","","","0110558","","1020570","","",44],
["NYM-J 5×16 mm²","leitung","m","","","0110355","","1020580","","",44],
["NYM-J 5×25 mm²","leitung","m","","","0110356","","","","",44],
["Lautsprecherleitung 2×1,5","leitung","m","","","1957146","","","","",44],
["NYY-J 3×1,5 mm²","leitung","m","","","0200340","","1098031","","",45],
["NYY-J 5×1,5 mm²","leitung","m","","","0200420","","1098063","","",45],
["NYY-J 3×2,5 mm²","leitung","m","","","0200580","","","","",45],
["NYY-J 5×2,5 mm²","leitung","m","","","0200587","","1098064","","",45],
["NYY-J 5×6 mm²","leitung","m","","","0200425","","","","",45],
["NYY 1×16 mm²","leitung","m","","","0200307","","","","",45],
["Draht starr H07V-U 1,5 mm²","leitung","m","","","0100103","","","","",46],
["Draht starr H07V-U 2,5 mm²","leitung","m","","","0100123","q7vu025br","","","",46],
["ÖLFLEX CL110 5×1,5","leitung","m","Lapp","","0122549","","","","",47],
["YSLY - IZ 4×1 Steuerleitung","leitung","m","","","0132342","","","","",47],
["Gummikabel H07RN-F 3×1,5","leitung","m","","","","","","","",48],
["Gummikabel H07RN-F 3×2,5","leitung","m","","","","Q7RNF3025R","","","",48],
["Gummikabel H07RN-F 5G 1,5","leitung","m","","","","","","","",48],
["Gummischlauchleitung H07RN-F 5G 2,5","leitung","m","","","","","","","",48],
["Schlauchleitung H05VV-F 3×1,5","leitung","m","","","0105115","","","","",49],
["Schlauchleitung H05VV-F 5×1,5","leitung","m","","","0105618","","","","",49],
["Knotenkette CHK 30K 900 N (Leuchten & Zubehör)","licht","","","","1404362","","","","",50],
["Schiffsarmaturen Megaman LED","licht","","Megaman","","4623024","","","","",51],
["Baustellenfassung E 27","licht","","","","1403302","","","","",51],
["Entsorgung von Leuchtstofflampen","pausch","Pauschale","","","","","","i1","",52],
["Megaman LED Leuchten rund","licht","","Megaman","","5016646","","","","",52],
["Megaman Bewegungsmelder für Leuchte","licht","","Megaman","","1423024","","","","",52],
["Ersatzmodul Magnetisch","licht","","","","2517349","","","","",52],
["Philips LED Leuchten rund","licht","","Philips","","7213122","","","","",53],
["Philips LED Leuchten rund mit BWM","licht","","Philips","","7213118","","","","",53],
["PHILIPS LED Leuchte 1500 mm lang","licht","","Philips","","2808859","","","","",54],
["Ledvance 4000 K, 6200 lm, 55 W / Alt 2×58 Watt","licht","","Ledvance","","3002369","","","","",54],
["Herdanschlussdose UP","dosen","","","","0869145","","","","",55],
["Herdanschlussleitung 1,5 mtr. 5×2,5 mm²","dosen","","","","0916003","","","","",55],
["Varta 4914 High Energy Mignon AA","sonst","","Varta","","1240733","","","","",56],
["Varta 4914 High Energy Baby LR 14","sonst","","Varta","","1241324","","","","",56],
["Varta 4914 High Energy 9 V Block","sonst","","Varta","","1240856","","","","",56],
["Merten Einsatz Wechselschalter","schalter","","Merten","meg3116-0000","0852048","","","","",57],
["Merten Einsatz Doppelwechsel","schalter","","Merten","meg3126-0000","0852053","","","","",57],
["Merten Einsatz Kontrollschalter","schalter","","Merten","meg3106-0000","0852045","","","","",57],
["Merten Einsatz Kreuzschalter","schalter","","Merten","meg3117-0000","0852049","","","","",57],
["Merten Einsatz Rolloschalter","schalter","","Merten","meg3715-0000","0852181","","","","",57],
["Merten Einsatz Serienschalter","schalter","","Merten","meg3115-0000","0852047","","","","",57],
["Merten Einsatz Taster mit Meldekontakt","schalter","","Merten","meg3154-0000","0852065","","","","",57],
["Merten Einsatz Serienkontrollschalter","schalter","","Merten","meg3105-0000","0852044","","","","",57],
["Merten Einsatz Taster","schalter","","Merten","meg3150-0000","0852058","","","","",57],
["Merten M-Smart 1-fach Gehäuse polarweiß","schalter","","Merten","512119","0831087","","","","",57],
["Merten M-Smart 2-fach Gehäuse polarweiß","schalter","","Merten","512219","0831093","","","","",57],
["Merten M-Smart 3-fach Gehäuse polarweiß","schalter","","Merten","512319","0831509","","","","",57],
["Merten M-Smart 1-fach Rahmen M weiß & polarweiß","schalter","","Merten","484119","0808568","","","","",57],
["Merten M-Smart 2-fach Rahmen M weiß & polarweiß","schalter","","Merten","484219","0808569","","","","",57],
["Merten M-Smart 3-fach Rahmen M weiß & polarweiß","schalter","","Merten","484319","0808574","","","","",57],
["Merten M-Smart 4-fach Rahmen M weiß & polarweiß","schalter","","Merten","484419","0808575","","","","",57],
["Merten M-Smart 5-fach Rahmen M weiß & polarweiß","schalter","","Merten","484519","0808576","","","","",57],
["Merten M-Smart Wippe","schalter","","Merten","433119","0801560","","","","",57],
["Merten M-Smart Kontrollwippe","schalter","","Merten","431019","0837581","","","","",57],
["Merten M-Smart Serienwippe","schalter","","Merten","433519","0801570","","","","",57],
["Merten M-Smart Rollowippe","schalter","","Merten","435519","0801635","","","","",57],
["Merten M-Smart Serienkontrollwippe","schalter","","Merten","Meg3420-0419","0852044","","","","",57],
["Merten M-Smart TAE Abdeckung","schalter","","Merten","297919","0803497","","","","",57],
["Merten M-Smart SAT Abdeckung","schalter","","Merten","297519","0803543","","","","",57],
["Merten M-Smart UAE Abdeckung","schalter","","Merten","298019","0803500","","","","",57],
["Merten M-Smart Blindabdeckung","schalter","","Merten","391819","0803484","","","","",57],
["Merten M-Smart Steckdose Kinderschutz","schalter","","Merten","meg2300-0419","0851411","","","","",57],
["Merten M-Smart SCHUKO-Doppel-Steckdose","schalter","","Merten","meg2420-1419","0866125","","","","",57],
["Merten AQUASTAR Kombination Schalter + Steckdose","schalter","","Merten","meg3494-8019","0861786","","","","",57],
["Merten AQUASTAR Wechselschalter","schalter","","Merten","meg3116-8019","0861770","","","","",57],
["Merten AQUASTAR Serienschalter","schalter","","Merten","meg3115-8019","0861767","","","","",57],
["Merten AQUASTAR Kontrollschalter","schalter","","Merten","meg3106-8019","0861763","","","","",57],
["Merten AQUASTAR Steckdose 1-fach","schalter","","Merten","meg2300-8019","0861720","","","","",57],
["Merten AQUASTAR Steckdose 2-fach","schalter","","Merten","meg2320-8019","0861723","","","","",57],
["Merten AQUASTAR Steckdose 3-fach","schalter","","Merten","meg2390-8019","0861740","","","","",57],
["Merten AQUASTAR Taster","schalter","","Merten","MEG3150-8019","0861775","","","","",57],
["Bewegungsmelder ARGUS 220 Connect","licht","","Merten","565419","0872008","","","","",57],
["Bewegungsmelder Esylux MDW 200i","licht","","Esylux","","6400712","","","","",57],
["EI 650 Rauchmelder 10 Jahre","licht","","Ei Electronics","EI650","","","","","",57],
["Wartungsheft Rauchmelder","licht","","","","","","5603908","","",57],
["Potentialausgleichsschiene","erdung","","","","0430176","","","","",58],
["Banderdungsschelle","erdung","","","","0430105","","","","",58],
["OBO Staberder / Tiefenerder 1,5 Meter V4a","erdung","","OBO Bettermann","","0434473","Q620902DE","","","",58],
["OBO Erderspitze","erdung","","OBO Bettermann","","0430217","","","","",58],
["Dehn Anschlussklemme","erdung","","Dehn","","0434472","","","","",58],
["DENSO Binde","erdung","Rolle","","","0434179","","","","",58],
["OBO V4 A Kreuzverbinder","erdung","","OBO Bettermann","","","q252810v4a","","","",58],
["OBO V4A Runddraht Edelstahl","erdung","m","OBO Bettermann","","","","","","",58],
["Verbindungsklemme Armierung Neubau","erdung","","","","5900822","","","","",58],
["HILTI Schraubanker HUS 3-H 10×50 5/-/-","befest","Packung","Hilti","","2079911","","","","",59],
["HILTI Schraubanker HUS P 6×40 / 5","befest","Packung","Hilti","","428663","","","","",59],
["HILTI Schraubanker HUS 3-A 6×35 M8/18","befest","Packung","Hilti","","416741","","","","",59],
["Gasnagel x-GN 20 MX","befest","Packung","","","","","","","",59],
["Schelle x-EKS 20 MX M 20","befest","","","","","","","","",59],
["Schelle x-EKS 25 MX M 25","befest","","","","","","","","",59],
["Stiebel-El Durchlauferhitzer DHB 24 ST thermotron","sonst","","Stiebel Eltron","","4200358","dhb24st","","","",60],
["Solarleitung 6 mm²","leitung","m","","","1207534","","","","",60],
["CIMCO Stecker und Buchse MS 4","sonst","","Cimco","","","","5855376","","",60],
["Netzwerkmessgerät","pausch","Pauschale","","","","","","M1","",3],
["E Check Messgerät","pausch","Pauschale","","","","","","M2","",3],
["Gerätetester","pausch","Pauschale","","","","","","M3","",3],
["SAT Messgerät","pausch","Pauschale","","","","","","M4","",3],
["Diamantsäge oder DD pro Tag","pausch","Tag","","","","","","M5","",3],
["Pauschale Zähler bei Versorger beantragen","pausch","Pauschale","","","","","","M6","",3],
["Laptop","pausch","Pauschale","","","","","","M7","",3],
["HILTI Bohr / Stemmhammer","pausch","Pauschale","Hilti","","","","","M8","",3],
["Netzanalysegerät HT","pausch","Pauschale","","","","","","M9","",3],
["Kernbohrmaschine","pausch","Pauschale","","","","","","M10","",3],
["Klauke Hydraulische Presszange","pausch","Pauschale","","","","","","M11","",3],
["E Checktester für Ladesäulen incl. E Check Messgerät","pausch","Pauschale","","","","","","EMOB","",3],
["Beschriftungspauschale für Verteiler / Zählerschränke","pausch","Pauschale","","","","","","beschr2","",3],
["Befestigungspauschale Dübel Schraube 10 mm","pausch","Pauschale","","","","","","bef2","",3],
["Schnittkosten der Lieferanten","pausch","Pauschale","","","","","","schnitt","",3],
["Baustelleneinrichtung","pausch","Pauschale","","","","","","baust1","",3],
["Abdeckmaterial / Teppiche ca 1/2 Rolle","pausch","Pauschale","","","","","","Abd1","",3],
["Rollgerüst Tagespauschale","pausch","Tag","","","","","","Gerüst","",3],
["Eimer 12 l Bauschutt entsorgen","pausch","","","","","","","Bauschutt","",3],
["Absperrung gelb Mobil","pausch","Pauschale","","","","","","Absper","",3],
["Beschriftungsband 1 Rolle gelb","befest","Rolle","","","2108319","","","","",3],
["E Check Aufkleber inklusive Barcode","pausch","Pauschale","","","","","","beschr3","",61],
["RFID Kabelbinder","befest","Packung","","","6906618","","","","",61],
["Verzinkte Achtkantstahlwelle SW60, Länge 6m","sonst","","","","1156141","","","","",62],
["Verzinkte Teleskop-Achtkantstahlwelle SW60, variabel einsetzbar von 1,10m bis 2,10m","sonst","","","","7000753","","","","",62],
["Kugellagereinsatz zur Montage im Gegenlager","sonst","","","","1156121","","","","",62],
["Befestigungsfeder 140mm ab SW50 4051","sonst","","","","1156159","","","","",62],
["Gegenlager für Fertigkasten","sonst","","","","1156112","","","","",62],
["Walzenkapsel SW 60","sonst","","","","1156123","","","","",62],
["Friedl.D911S Funkgong Libra+ 90dB silber","sonst","","Friedland","","","QGONGD911S","","","",63]];
/* MAT_FIRMA_END */
