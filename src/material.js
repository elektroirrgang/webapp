/* Material in der Übergabe: echte Liste statt Freitext.
   Jede Zeile: Menge · Einheit · Bezeichnung. Tippen schlägt bekannte Teile vor (Grundliste + alles, was auf
   Baustellen schon eingetragen wurde) und merkt sich die übliche Einheit. In der Übergabe-Karte kann jeder
   abhaken, was besorgt bzw. eingepackt ist. Gespeichert als e.mat=[{t,q,u,ok}]; e.material bleibt als Text der
   noch offenen Teile erhalten (für Teilen, Übersicht „Material offen“ und ältere Versionen). */
const MAT_EINHEITEN=["Stück","m","m²","Packung","Rolle","Ring","Karton","Satz","Sack","Paar"];
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
function matVorschlaege(){ const s=new Set(MAT_GRUND); live("eintraege").forEach(e=>(e.mat||[]).forEach(x=>x.t&&s.add(String(x.t).trim()))); return [...s]; }

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
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act^="mat"]'); if(!b) return; const a=b.dataset.act;
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
  return `<div class="eb mat-k"><div class="mat-kk"><small>Material</small>${neu&&L.length?`<span>${ok} von ${L.length} besorgt</span>`:""}</div>
    <div class="mat-kl">${L.map((x,i)=>neu?`<button type="button" class="mat-ck${x.ok?" ok":""}" data-act="matHaken" data-id="${esc(e.id)}" data-i="${i}" aria-pressed="${!!x.ok}"><span class="mat-box">${x.ok?icon("check"):""}</span><b>${esc(matFmt(x.q))} ${esc(x.u)}</b><span class="mat-tt">${esc(x.t)}</span>${x.ok&&x.okVon&&x.okVon.name?`<small>besorgt von ${esc(x.okVon.name)}</small>`:""}</button>`
      :`<div class="mat-ck alt"><b>${esc(matFmt(x.q))} ${esc(x.u)}</b><span class="mat-tt">${esc(x.t)}</span></div>`).join("")}</div></div>`;
}
