/* Aufträge (Vorgänge): Anruf → Anfrage → Auftrag → Termin → Ausgeführt.
   Schließt die Lücke vor SCC-CONTROL: Anrufe sofort festhalten, Anfrage ans Büro, Büro erteilt den Auftrag
   (SCC-Auftragsnummer), Termin eintragen. Anfrage darf jeder stellen, den Auftrag erteilt nur das Büro-Konto (info@).
   Mit dem Termin entsteht die Baustelle in der Baustellen-App (gleicher Gerätespeicher, gleicher Abgleich);
   steht die Baustelle auf „Fertig“, ist der Vorgang ausgeführt – und umgekehrt. */
const VG_S=[["anruf","Anruf"],["anfrage","Anfrage"],["auftrag","Auftrag"],["termin","Termin"],["ausgefuehrt","Ausgeführt","Fertig"]];
const VG_F=[["offen","Offen"],["buero","Wartet aufs Büro"],["termin","Ohne Termin"],["erledigt","Ausgeführt"],["abgelehnt","Abgelehnt"]];
const VG_BUERO=["info@elektro-irrgang.de"];
const istBuero=()=>VG_BUERO.includes(String(ME.mail||"").toLowerCase());
const vgStufe=v=>{ let n=-1; VG_S.forEach(([k],i)=>{ if(v.s&&v.s[k]) n=i; }); return n; };
const vgZu=v=>!!((v.s&&v.s.ausgefuehrt)||v.erledigt||v.abgelehnt);
const vgBau=v=>{ const b=v.baustelleId&&DB.baustellen&&DB.baustellen.get(v.baustelleId); return b&&!b.deleted?b:null; };
/* Abgleich mit der Baustellen-App: Baustelle „Fertig“ ⇒ Vorgang ausgeführt; wieder geöffnet ⇒ zurück */
function vgAbgleich(){ live("vorgaenge").forEach(v=>{ const b=vgBau(v); if(!b||!v.s||!v.s.termin||v.abgelehnt) return; const a=v.s.ausgefuehrt;
  if(b.status==="fertig"&&!a){ v.s.ausgefuehrt={wer:b.updatedBy||who(),at:b.updated||Date.now(),ausBaustelle:true}; saveRec("vorgaenge",v); }
  else if(b.status!=="fertig"&&a){ delete v.s.ausgefuehrt; saveRec("vorgaenge",v); } }); }
const vgAlle=()=>live("vorgaenge").sort((a,b)=>(!!a.dringend===!!b.dringend?0:a.dringend?-1:1)||((b.s&&b.s.anruf&&b.s.anruf.at)||0)-((a.s&&a.s.anruf&&a.s.anruf.at)||0));
const vgKunde=v=>v.kundeId&&kundeOf(v.kundeId)?kundeOf(v.kundeId).name:(v.kundeName||"Ohne Namen");
const vgZeit=t=>{ if(!t) return ""; const d=new Date(t), h=new Date(); const tag=d.toDateString()===h.toDateString()?"heute":new Date(h-864e5).toDateString()===d.toDateString()?"gestern":d.toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit"}); return `${tag}, ${d.toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"})}`; };
const vgVorn=n=>String(n||"").trim();
/* wie lange hängt der Vorgang schon im aktuellen Schritt? */
function vgAlter(v){ if(vgZu(v)) return null; const i=vgStufe(v); if(i<0) return null; const k=VG_S[i][0], seit=v.s[k].at||0, std=(Date.now()-seit)/36e5;
  const grenze=[24,48,72,null][i]; if(i>=3){ const d=v.s.termin&&v.s.termin.datum; if(d&&d<today()) return {txt:"Termin vorbei – noch nicht ausgeführt",kl:"wip"}; return null; }
  if(std<grenze) return null; const tage=Math.floor(std/24); return {txt:tage>=1?`seit ${tage} Tag${tage>1?"en":""}`:`seit ${Math.floor(std)} Std.`,kl:std>grenze*2?"bad":"wip"}; }
function vgFilter(f){ return vgAlle().filter(v=>f==="erledigt"?!!((v.s&&v.s.ausgefuehrt)||v.erledigt):f==="abgelehnt"?!!v.abgelehnt:f==="buero"?!vgZu(v)&&vgStufe(v)===1:f==="termin"?!vgZu(v)&&vgStufe(v)===2:!vgZu(v)); }
function vgNaechster(v){ const i=vgStufe(v); if(vgZu(v)) return null;
  if(i===0) return {act:"vgAnfrage",t:"Anfrage ans Büro"};
  if(i===1) return istBuero()?{act:"vgAuftrag",t:"Auftrag erteilen"}:{warte:"wartet aufs Büro"};
  if(i===2) return {act:"vgTermin",t:"Termin eintragen"};
  if(i===3) return {act:"vgAusgef",t:"Ausgeführt melden"};
  return null; }
function vgZelle(v,k,i){ const s=v.s&&v.s[k], st=vgStufe(v), id=esc(v.id), lbl=`<span class="vg-zk"><i class="vg-dot DOT"></i>${VG_S[i][2]?`<span class="vg-lv">${esc(VG_S[i][1])}</span><span class="vg-lk">${esc(VG_S[i][2])}</span>`:esc(VG_S[i][1])}</span>`;
  const knopf=(kl,dot,inhalt)=>`<button class="vg-z ${kl}" data-act="vgStep" data-id="${id}" data-k="${k}">${lbl.replace("DOT",dot)}${inhalt}</button>`;
  if(s){ const extra=k==="auftrag"&&s.nr?`<em>SCC ${esc(s.nr)}</em>`:k==="termin"&&s.datum?`<em>${esc(deDate(s.datum))}${s.zeit?` · ${esc(s.zeit)} Uhr`:""}${s.mit?` · ${esc(s.mit)}`:""}</em>`:"";
    return knopf("ok","ok",`<span class="vg-zw"><span class="vg-wer">${esc(vgVorn(s.wer&&s.wer.name)||"–")} · </span>${esc(vgZeit(s.at))}</span>${extra}`); }
  if(v.abgelehnt&&i===st+1) return knopf("bad","bad",`<span class="vg-zw">abgelehnt</span><em>${esc(vgVorn(v.abgelehnt.wer&&v.abgelehnt.wer.name)||"")}</em>`);
  if(i===st+1&&!vgZu(v)){ const n=vgNaechster(v);
    if(n&&n.act) return `<button class="vg-z next" data-act="${n.act}" data-id="${id}"><span class="vg-nt">${icon("add")}<span>${esc(n.t)}</span></span></button>${knopf("nextm","nx",`<span class="vg-zw">offen</span>`)}`;
    if(n&&n.warte) return knopf("warte","warte",`<span class="vg-zw">${esc(n.warte)}</span>`); }
  return `<div class="vg-z leer">${lbl.replace("DOT","")}</div>`; }
/* Pop-up zu einem einzelnen Schritt: was war der Anruf, ist die Anfrage beim Büro, welcher Auftrag, welcher Termin */
function vgSeit(t){ const h=(Date.now()-t)/36e5; return h<1?"seit weniger als einer Stunde":h<24?`seit ${Math.floor(h)} Std.`:`seit ${Math.floor(h/24)} Tag${Math.floor(h/24)>1?"en":""}`; }
function vgStepDlg(v,k){ const s=(v.s||{})[k], st=vgStufe(v), n=vgNaechster(v), id=esc(v.id), wer=x=>esc((x&&x.wer&&x.wer.name)||"–");
  const z=(l,w)=>w?`<div class="vg-kv"><span>${esc(l)}</span><b>${w}</b></div>`:"";
  const stat=(kl,t)=>`<div class="vg-stat ${kl}"><i class="vg-dot ${kl}"></i><span>${t}</span></div>`;
  let body="", weiter="";
  if(k==="anruf"){
    body=`<div class="vg-betr"><small>Betreff</small><p>${esc(v.anliegen||"–")}</p></div>${v.dringend?`<span class="vg-dr">dringend</span>`:""}
      ${z("Kunde",esc(vgKunde(v)))}${v.tel?z("Telefon",`<a class="vg-tel" href="tel:${esc(v.tel.replace(/[^\d+]/g,""))}">${icon("phone")}${esc(v.tel)}</a>`):""}
      ${z("Angenommen von",wer(s))}${z("Wann",esc(vgZeit(s&&s.at)))}`;
    if(st===0&&!vgZu(v)) weiter=`<button class="btn-text" data-act="vgAnfrage" data-id="${id}">Anfrage ans Büro</button>`; }
  else if(k==="anfrage"){
    body=s?stat("ok","An das Büro weitergeleitet")+z("Weitergeleitet von",wer(s))+z("Wann",esc(vgZeit(s.at))):stat("","Noch nicht an das Büro weitergeleitet");
    if(s) body+= v.s.auftrag?stat("ok",`Vom Büro angenommen – Auftrag erteilt${v.s.auftrag.nr?` (SCC ${esc(v.s.auftrag.nr)})`:""}`)
      : v.abgelehnt?stat("bad",`Vom Büro abgelehnt${v.abgelehnt.grund?`: ${esc(v.abgelehnt.grund)}`:""}`)
      : stat("warte",`Liegt beim Büro, ${vgSeit(s.at)} – noch nicht bearbeitet`);
    if(!s&&!vgZu(v)) weiter=`<button class="btn-text" data-act="vgAnfrage" data-id="${id}">Jetzt weiterleiten</button>`;
    else if(st===1&&!vgZu(v)&&istBuero()) weiter=`<button class="btn-text danger" data-act="vgAblehnen" data-id="${id}">Ablehnen</button><button class="btn-text" data-act="vgAuftrag" data-id="${id}">Auftrag erteilen</button>`; }
  else if(k==="auftrag"){
    if(s) body=stat("ok","Auftrag erteilt")+z("SCC-Auftragsnummer",esc(s.nr||"–"))+z("Erteilt von",wer(s))+z("Wann",esc(vgZeit(s.at)));
    else if(v.abgelehnt) body=stat("bad","Vom Büro abgelehnt")+z("Grund",esc(v.abgelehnt.grund||"–"))+z("Von",wer(v.abgelehnt))+z("Wann",esc(vgZeit(v.abgelehnt.at)));
    else if(st===1) body=stat("warte",`Wartet aufs Büro, ${vgSeit(v.s.anfrage.at)}`)+(istBuero()?"":`<p class="sup">Den Auftrag erteilt das Büro.</p>`);
    else body=stat("","Erst kommt die Anfrage ans Büro.");
    if(st===1&&!vgZu(v)&&istBuero()) weiter=`<button class="btn-text danger" data-act="vgAblehnen" data-id="${id}">Ablehnen</button><button class="btn-text" data-act="vgAuftrag" data-id="${id}">Auftrag erteilen</button>`; }
  else if(k==="termin"){ const bau=vgBau(v), offen=!vgZu(v);
    if(s) body=stat(s.datum<today()&&offen?"warte":"ok",s.datum<today()&&offen?"Termin ist vorbei – noch nicht ausgeführt":"Termin steht")
      +z("Datum",esc(deDate(s.datum)))+z("Uhrzeit",s.zeit?esc(s.zeit)+" Uhr":"")+z("Wer fährt hin",esc(s.mit||""))+z("Eingetragen von",wer(s))
      +(bau?z("Baustelle",`<a class="vg-link" href="../baustelle/">${esc(bau.name)} · ${esc({besichtigung:"Besichtigung",aktiv:"Aktiv",pausiert:"Pausiert",fertig:"Fertig"}[bau.status||"aktiv"])}</a>`):"");
    else body=stat("",st===2?"Noch kein Termin eingetragen":"Erst muss der Auftrag erteilt sein.")+(st===2?`<p class="sup">Mit dem Termin wird die Baustelle in der Baustellen-App angelegt.</p>`:"");
    if(offen&&st>=2) weiter=`<button class="btn-text" data-act="vgTermin" data-id="${id}">${s?"Termin ändern":"Termin eintragen"}</button>`; }
  else if(k==="ausgefuehrt"){ const bau=vgBau(v);
    if(s) body=stat("ok","Ausgeführt")+z("Gemeldet von",wer(s))+z("Wann",esc(vgZeit(s.at)))+(bau?z("Baustelle",`${esc(bau.name)} · Fertig`):"")+(s.ausBaustelle?`<p class="sup">Kam aus der Baustellen-App (Baustelle auf „Fertig“ gesetzt).</p>`:"");
    else if(st===3) body=stat("warte",(v.s.termin.datum<today()?"Termin war am ":"Termin am ")+esc(deDate(v.s.termin.datum))+" – noch nicht ausgeführt")+`<p class="sup">Wird automatisch erledigt, sobald die Baustelle in der Baustellen-App auf „Fertig“ steht.</p>`;
    else body=stat("","Erst kommt der Termin.");
    if(s&&!v.abgelehnt) weiter=`<button class="btn-text" data-act="vgWiederAuf" data-id="${id}">Wieder öffnen</button>`;
    else if(st===3) weiter=`<button class="btn-text" data-act="vgAusgef" data-id="${id}">Ausgeführt melden</button>`; }
  const titel={anruf:"Anruf",anfrage:"Anfrage",auftrag:"Auftrag",termin:"Termin",ausgefuehrt:"Ausgeführt"}[k];
  const zur=istBuero()&&k!=="anruf"?(s?`<button class="btn-text danger" data-act="vgZurueck" data-id="${id}" data-k="${k}">Zurücknehmen</button>`
      :v.abgelehnt&&vgStufe(v)+1===VG_S.findIndex(x=>x[0]===k)?`<button class="btn-text danger" data-act="vgAblZurueck" data-id="${id}">Ablehnung zurücknehmen</button>`:""):"";
  if(zur&&k==="ausgefuehrt") weiter=weiter.replace(/<button class="btn-text" data-act="vgWiederAuf"[^>]*>Wieder öffnen<\/button>/,"");
  dialog(`${titel} – ${vgKunde(v)}`,`<div class="vg-dlg">${body}</div>`,
    `${k==="anruf"?`<button class="btn-text" data-act="vgEdit" data-id="${id}">Bearbeiten</button>`:""}${zur}<span style="flex:1"></span>${weiter||`<button class="btn-text" data-act="cancel">Schließen</button>`}`); }
/* Büro: Schritte zurücknehmen (nicht den Anruf). Ein Schritt nimmt alle späteren mit, sonst passt die Kette nicht mehr. */
function vgBauUnberuehrt(b){ return b&&b.vorgangId&&!live("eintraege").some(e=>e.baustelleId===b.id)&&!(b.aufnahme&&(Object.keys(b.aufnahme.v||{}).length||b.aufnahme.sig)); }
function vgZurueckFragen(v,k){ const i=VG_S.findIndex(x=>x[0]===k), weg=VG_S.slice(i).filter(([kk])=>v.s&&v.s[kk]).map(x=>`„${x[1]}“`), bau=vgBau(v), mitTermin=v.s&&v.s.termin&&i<=3;
  const satz=weg.length>1?`Damit werden ${weg.slice(0,-1).join(", ")} und ${weg[weg.length-1]} zurückgenommen.`:`Damit wird ${weg[0]} zurückgenommen.`;
  const bauTxt=bau&&mitTermin?(vgBauUnberuehrt(bau)?` Die Baustelle „${bau.name}“ ist noch leer und wird wieder entfernt.`:` Die Baustelle „${bau.name}“ hat schon Einträge – sie bleibt, nur der Termin wird dort gelöscht.`):"";
  dialog(`${VG_S[i][1]} zurücknehmen?`,`<p style="margin:0">${esc(satz+bauTxt)}</p><p class="sup">Der Anruf selbst bleibt erhalten.</p>`,
    `<button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text danger" data-act="vgZurueckOk" data-id="${esc(v.id)}" data-k="${k}">Zurücknehmen</button>`); }
function vgZurueckTun(v,k){ const i=VG_S.findIndex(x=>x[0]===k), altS=JSON.parse(JSON.stringify(v.s||{})), altBau=v.baustelleId;
  const bau=vgBau(v), bauAlt=bau&&JSON.parse(JSON.stringify({status:bau.status,termin:bau.termin,deleted:bau.deleted}));
  VG_S.slice(i).forEach(([kk])=>{ if(v.s) delete v.s[kk]; }); delete v.erledigt; const altAbl=v.abgelehnt; if(i<=1) delete v.abgelehnt;
  if(bau){ if(i<=3){ if(vgBauUnberuehrt(bau)){ bau.deleted=true; delete v.baustelleId; } else { delete bau.termin; if(bau.status==="fertig") bau.status="aktiv"; } }
    else if(bau.status==="fertig") bau.status="aktiv"; saveRec("baustellen",bau); }
  saveRec("vorgaenge",v); closeOverlays(); render();
  toast(`${VG_S[i][1]} zurückgenommen`,"Rückgängig",()=>{ v.s=altS; if(altAbl) v.abgelehnt=altAbl; if(altBau) v.baustelleId=altBau; saveRec("vorgaenge",v); if(bau){ Object.assign(bau,bauAlt); if(!bauAlt.termin) delete bau.termin; if(!bauAlt.deleted) delete bau.deleted; saveRec("baustellen",bau); } render(); }); }
function vgKopf(v){ const a=vgAlter(v);
  return `<button class="vg-k" data-act="vgOpen" data-id="${esc(v.id)}"><span class="vg-kn">${v.dringend?`<i class="vg-dr">dringend</i>`:""}${esc(vgKunde(v))}</span>
    <span class="vg-kf">${v.tel?`<span>${icon("phone")}${esc(v.tel)}</span>`:""}${a?pill(a.kl,a.txt):""}${vgZu(v)&&!v.abgelehnt?pill("ok","ausgeführt"):v.abgelehnt?pill("bad",`abgelehnt${v.abgelehnt.wer&&v.abgelehnt.wer.name?` von ${vgVorn(v.abgelehnt.wer.name)}`:""}`):""}</span></button>`; }
function vgZeile(v){ return `<div class="vg-row${v.dringend?" dr":""}">${vgKopf(v)}${VG_S.map(([k],i)=>vgZelle(v,k,i)).join("")}${vgZu(v)?"":`<div class="vg-mob">${(()=>{ const n=vgNaechster(v); return n&&n.act?`<button class="btn-tonal" data-act="${n.act}" data-id="${esc(v.id)}">${icon("add")}${esc(n.t)}</button>`:""; })()}</div>`}</div>`; }
/* Suche + Sortier-/Filterknopf (gleiches Muster wie Kunden und Bibliothek) */
FDEF.vg={std:{sort:"dringend",dr:"alle",wer:"alle"},
  sort:[["dringend","Dringende zuerst"],["neu","Neueste zuerst"],["alt","Älteste zuerst"],["az","Kunde A–Z"],["termin","Nächster Termin zuerst"]],
  gruppen:[{k:"dr",t:"Dringend",opts:[["alle","Alle"],["ja","Nur dringende"]]},{k:"wer",t:"Person",opts:[["alle","Alle"],["mein","Nur meine"]]}],
  liste:()=>vgListe()};
const vgAt=v=>(v.s&&v.s.anruf&&v.s.anruf.at)||v.created||0;
function vgMein(v){ const m=String(ME.mail||"").toLowerCase(), n=String(ME.name||"").trim(); if(!m&&!n) return true;
  return Object.values(v.s||{}).some(x=>x&&x.wer&&((m&&String(x.wer.mail||"").toLowerCase()===m)||(n&&x.wer.name===n)))||(v.createdBy&&String(v.createdBy.mail||"").toLowerCase()===m)
    ||(n&&v.s&&v.s.termin&&String(v.s.termin.mit||"").split(/\s*,\s*/).includes(n)); }
function vgListe(){ const f=META.vgF||"offen", q=String(query||"").trim().toLowerCase(), H=x=>String(x||"").toLowerCase().includes(q);
  let L=vgFilter(f);
  if(q) L=L.filter(v=>H(vgKunde(v))||H(v.anliegen)||H(v.tel)||H(v.s&&v.s.auftrag&&v.s.auftrag.nr)||H(v.s&&v.s.termin&&v.s.termin.mit));
  if(fW("vg","dr")==="ja") L=L.filter(v=>v.dringend);
  if(fW("vg","wer")==="mein") L=L.filter(vgMein);
  const so=fW("vg","sort"), td=v=>(v.s&&v.s.termin&&v.s.termin.datum)||"9999";
  if(so==="neu") L.sort((a,b)=>vgAt(b)-vgAt(a)); else if(so==="alt") L.sort((a,b)=>vgAt(a)-vgAt(b));
  else if(so==="az") L.sort((a,b)=>vgKunde(a).replace(/^BEISPIEL\s+/,"").localeCompare(vgKunde(b).replace(/^BEISPIEL\s+/,""),"de")||vgAt(b)-vgAt(a));
  else if(so==="termin") L.sort((a,b)=>td(a).localeCompare(td(b))||vgAt(b)-vgAt(a));
  const kopf=`<div class="vg-th"><span>Kunde</span>${VG_S.map(([k,t])=>`<span class="vg-thk"><i class="vg-dot" style="background:var(--vg-${k}-d,var(--ok))"></i>${t}</span>`).join("")}</div>`;
  if(!L.length) return fInfo("vg",0,"Vorgang","Vorgänge")+`<p class="meta" style="margin:16px 4px">${q?`Nichts gefunden für „${esc(query)}“.`:"Keine Vorgänge in dieser Auswahl."}</p>`;
  let zeilen;
  if(so==="az"){ let b0=null; zeilen=L.map(v=>{ const b=(typeof abcB==="function"?abcB(vgKunde(v).replace(/^BEISPIEL\s+/,"")):vgKunde(v)[0]||"#"); const h=b!==b0?`<div class="vg-abc">${esc(b)}</div>`:""; b0=b; return h+vgZeile(v); }).join(""); }
  else zeilen=L.map(vgZeile).join("");
  return fInfo("vg",L.length,"Vorgang","Vorgänge")+`<div class="vg-tab">${kopf}${zeilen}</div>`; }
function vorgaengeView(){ vgAbgleich();
  const f=META.vgF||"offen", n=x=>vgFilter(x).length;
  const chips=`<div class="chips filt vg-chips">${VG_F.map(([k,t])=>`<button class="chip" data-act="vgFilter" data-v="${k}" aria-pressed="${f===k}">${icon("check")}${esc(t)}${k==="erledigt"||k==="abgelehnt"?"":` (${n(k)})`}</button>`).join("")}</div>`;
  if(!live("vorgaenge").length) return `<div class="narrow vg">${chips}<div class="empty">${icon("board")}<h2>Noch keine Aufträge</h2><p>Kommt ein Anruf rein: auf „+“ tippen, Kunde und Anliegen eintragen – fertig. Danach rückt der Vorgang Schritt für Schritt weiter: Anfrage ans Büro, Auftrag, Termin, ausgeführt.</p></div></div>`;
  return `<div class="narrow vg">${searchBar("Kunde, Betreff, SCC-Nr.",fKnopf("vg"))}${chips}<div id="res">${vgListe()}</div>
    <p class="hint">Anfrage stellen darf jeder. Den Auftrag erteilt das Büro und trägt dabei die Auftragsnummer aus SCC ein. Mit dem Termin entsteht die Baustelle in der Baustellen-App; steht sie dort auf „Fertig“, ist der Vorgang ausgeführt.</p></div>`; }
/* Erfassen / Bearbeiten */
let vgE=null;
function vgDialog(v){ vgE=v?JSON.parse(JSON.stringify(v)):{id:null,kundeName:"",tel:"",anliegen:"",dringend:false};
  const namen=live("kunden").map(k=>k.name);
  dialog(v?"Vorgang bearbeiten":"Neuer Vorgang",`<div class="fg1">
    ${tf("vgKunde","Kunde",v?vgKunde(v):"",{form:true,list:"dl-vgk",ph:"Name oder Firma"})}${datalist("dl-vgk",namen)}
    ${tf("vgTel","Telefon (Rückruf)",vgE.tel||"",{form:true,im:"tel",ph:"z. B. 0171 …"})}
    ${ta("vgAnliegen","Was möchte der Kunde?",vgE.anliegen||"",{form:true,ph:"z. B. Steckdose im Bad ohne Funktion"})}
    <div class="vg-drw"><span>Dringend</span>${seg("vgDring",vgE.dringend?"ja":"nein",[["nein","Nein"],["ja","Ja"]])}</div></div>`,
    `${v&&(istBuero()||(v.createdBy&&v.createdBy.mail===ME.mail))?`<button class="btn-text danger" data-act="vgDel" data-id="${esc(v.id)}">Löschen</button><span style="flex:1"></span>`:""}<button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="vgSpeichern">${v?"Speichern":"Anlegen"}</button>`); }
function vgSpeichern(){ const F=formVals(); if(!F.vgKunde&&!F.vgAnliegen){ toast("Bitte Kunde oder Anliegen eintragen"); return; }
  const k=live("kunden").find(x=>x.name.toLowerCase()===String(F.vgKunde||"").toLowerCase());
  const neu=!vgE.id, v=neu?{id:uid(),s:{anruf:{wer:who(),at:Date.now()}}}:DB.vorgaenge.get(vgE.id);
  Object.assign(v,{kundeId:k?k.id:"",kundeName:k?"":F.vgKunde,tel:F.vgTel,anliegen:F.vgAnliegen,dringend:!!vgE.dringend});
  if(neu&&k&&k.demo) v.demo=true; if(!F.vgTel&&k&&k.tel&&neu) v.tel=k.tel;
  saveRec("vorgaenge",v,neu); closeOverlays(); render(); toast(neu?"Vorgang angelegt":"Gespeichert",neu?"Anfrage ans Büro":null,neu?()=>vgSchritt(v.id,"anfrage"):null); }
function vgSchritt(id,k,extra={}){ const v=DB.vorgaenge.get(id); if(!v) return; v.s=v.s||{}; v.s[k]=Object.assign({wer:who(),at:Date.now()},extra); saveRec("vorgaenge",v); closeOverlays(); render();
  toast(k==="anfrage"?"Anfrage ans Büro gestellt":k==="auftrag"?"Auftrag erteilt":k==="termin"?"Termin eingetragen":"Gespeichert"); }
function vgOpen(v){ const n=vgNaechster(v);
  const verlauf=VG_S.filter(([k])=>v.s&&v.s[k]).map(([k,t])=>{ const s=v.s[k]; return `<div class="vg-vl"><i class="vg-dot ok"></i><b>${t}</b><span>${esc((s.wer&&s.wer.name)||"–")} · ${esc(vgZeit(s.at))}${k==="auftrag"&&s.nr?` · SCC ${esc(s.nr)}`:""}${k==="termin"&&s.datum?` · ${esc(deDate(s.datum))}${s.zeit?` ${esc(s.zeit)} Uhr`:""}${s.mit?` · ${esc(s.mit)}`:""}`:""}</span></div>`; }).join("")
    +(v.abgelehnt?`<div class="vg-vl"><i class="vg-dot bad"></i><b>Abgelehnt</b><span>${esc(v.abgelehnt.wer&&v.abgelehnt.wer.name||"–")} · ${esc(vgZeit(v.abgelehnt.at))}${v.abgelehnt.grund?` · ${esc(v.abgelehnt.grund)}`:""}</span></div>`:"")
    +(v.erledigt&&!(v.s&&v.s.ausgefuehrt)?`<div class="vg-vl"><i class="vg-dot ok"></i><b>Erledigt</b><span>${esc(v.erledigt.wer&&v.erledigt.wer.name||"–")} · ${esc(vgZeit(v.erledigt.at))}</span></div>`:"");
  const k=v.kundeId&&kundeOf(v.kundeId);
  dialog(vgKunde(v),`<div class="vg-dlg">${v.dringend?`<span class="vg-dr">dringend</span>`:""}<p class="vg-an">${esc(v.anliegen||"–")}</p>
      ${v.tel?`<a class="vg-tel" href="tel:${esc(v.tel.replace(/[^\d+]/g,""))}">${icon("phone")}${esc(v.tel)}</a>`:""}
      ${!k&&v.kundeName?`<p class="sup">Noch kein Kunde in der Kundendatenbank.</p>`:""}
      <div class="vg-vlauf">${verlauf}</div></div>`,
    `<button class="btn-text" data-act="vgEdit" data-id="${esc(v.id)}">Bearbeiten</button>${!vgZu(v)&&istBuero()&&vgStufe(v)===1?`<button class="btn-text danger" data-act="vgAblehnen" data-id="${esc(v.id)}">Ablehnen</button>`:""}<span style="flex:1"></span>
     ${n&&n.act?`<button class="btn-text" data-act="${n.act}" data-id="${esc(v.id)}">${esc(n.t)}</button>`:`<button class="btn-text" data-act="cancel">Schließen</button>`}`); }
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act^="vg"]'); if(!b) return; const a=b.dataset.act, id=b.dataset.id, v=id&&DB.vorgaenge.get(id);
  if(a==="vgDring"){ e.stopPropagation(); if(vgE) vgE.dringend=b.dataset.v==="ja"; b.parentElement.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",x===b)); if(typeof segInd==="function") segInd(); return; }
  e.stopPropagation(); e.preventDefault();
  if(a==="vgNeu") vgDialog(null);
  else if(a==="vgMitT"){ b.setAttribute("aria-pressed",b.getAttribute("aria-pressed")!=="true"); }
  else if(a==="vgMitPlus"){ const i=document.getElementById("f_vgMitNeu"), n=String(i&&i.value||"").trim(); if(!n) return; const w=document.querySelector("#dlg .vg-mit");
    if(![...w.querySelectorAll("[data-act=vgMitT]")].some(x=>x.dataset.v===n)) w.querySelector(".vg-mitp").insertAdjacentHTML("beforebegin",`<button type="button" class="vg-mitc" data-act="vgMitT" data-v="${esc(n)}" aria-pressed="true">${esc(n)}</button>`);
    i.value=""; }
  else if(a==="vgSpeichern") vgSpeichern();
  else if(a==="vgFilter"){ META.vgF=b.dataset.v; metaSave(); render(); }
  else if(a==="vgOpen"&&v) vgOpen(v);
  else if(a==="vgStep"&&v) vgStepDlg(v,b.dataset.k);
  else if(a==="vgEdit"&&v){ closeOverlays(); vgDialog(v); }
  else if(a==="vgAnfrage"&&v) vgSchritt(id,"anfrage");
  else if(a==="vgAuftrag"&&v){ if(!istBuero()){ toast("Den Auftrag erteilt das Büro"); return; }
    dialog("Auftrag erteilen",`<p class="sup" style="margin:0 0 12px">${esc(vgKunde(v))} – ${esc(v.anliegen||"")}</p><div class="fg1">${tf("vgNr","Auftragsnummer aus SCC (optional)","",{form:true,ph:"z. B. 2610-150"})}</div>`,
      `<button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="vgAuftragOk" data-id="${esc(id)}">Auftrag erteilen</button>`); }
  else if(a==="vgAuftragOk"&&v){ vgSchritt(id,"auftrag",{nr:formVals().vgNr||""}); }
  else if(a==="vgTermin"&&v){ const t=v.s.termin||{}, bau=vgBau(v), SS=v.kundeId?standorteVon(v.kundeId):[], kd=v.kundeId&&kundeOf(v.kundeId);
    const ortVor=kd?[kd.strasse,[kd.plz,kd.ort].filter(Boolean).join(" ")].filter(Boolean).join(", "):"";
    const ort=bau?"":SS.length?`${sf("vgOrt","Wo? (Standort der Baustelle)",SS.length===1?SS[0].id:"",[...(SS.length>1?[["","Bitte wählen"]]:[]),...SS.map(x=>[x.id,x.name]),["__neu","Anderer Ort …"]],{form:true})}<div id="vgOrtNeuW" hidden>${tf("vgOrtNeu","Anderer Ort (Adresse)","",{form:true,ph:"Straße, Ort"})}</div>`
      :tf("vgOrtNeu","Wo? (Adresse der Baustelle)",ortVor,{form:true,ph:"Straße, Ort"});
    dialog(v.s.termin?"Termin ändern":"Termin eintragen",`<p class="sup" style="margin:0 0 12px">${esc(vgKunde(v))} – ${esc(v.anliegen||"")}</p><div class="fg1">
      ${tf("vgDatum","Datum",t.datum||today(),{form:true,type:"date"})}${tf("vgZeitE","Uhrzeit",t.zeit||"",{form:true,ph:"z. B. 8:00"})}${vgMitWahl(t.mit)}${ort}</div>
      <p class="sup" style="margin:12px 0 0">${bau?`Der Termin wird auch an der Baustelle „${esc(bau.name)}“ geändert.`:"Dazu wird die Baustelle in der Baustellen-App angelegt – mit Termin und Auftragsnummer."}</p>`,
      `<button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="vgTerminOk" data-id="${esc(id)}">Eintragen</button>`); }
  else if(a==="vgTerminOk"&&v){ const F=formVals(); if(!F.vgDatum){ toast("Bitte ein Datum wählen"); return; }
    if(!vgBau(v)&&F.vgOrt===""&&document.getElementById("f_vgOrt")){ toast("Bitte den Standort wählen"); return; }
    F.vgMit=vgMitWerte(); const neuBau=!vgBau(v); vgZuBaustelle(v,F); vgSchritt(id,"termin",{datum:F.vgDatum,zeit:F.vgZeitE,mit:F.vgMit});
    if(neuBau) toast("Termin eingetragen – Baustelle angelegt"); }
  else if(a==="vgAusgef"&&v){ v.s.ausgefuehrt={wer:who(),at:Date.now()}; saveRec("vorgaenge",v); const bau=vgBau(v), alt=bau&&bau.status;
    if(bau){ bau.status="fertig"; saveRec("baustellen",bau); }
    closeOverlays(); render(); toast(bau?"Ausgeführt – Baustelle steht auf „Fertig“":"Als ausgeführt gemeldet","Rückgängig",()=>{ delete v.s.ausgefuehrt; saveRec("vorgaenge",v); if(bau){ bau.status=alt||"aktiv"; saveRec("baustellen",bau); } render(); }); }
  else if(a==="vgZurueck"&&v){ if(!istBuero()) return; vgZurueckFragen(v,b.dataset.k); }
  else if(a==="vgZurueckOk"&&v){ if(!istBuero()) return; vgZurueckTun(v,b.dataset.k); }
  else if(a==="vgAblZurueck"&&v){ if(!istBuero()) return; const alt=v.abgelehnt; delete v.abgelehnt; saveRec("vorgaenge",v); closeOverlays(); render(); toast("Ablehnung zurückgenommen – wartet wieder aufs Büro","Rückgängig",()=>{ v.abgelehnt=alt; saveRec("vorgaenge",v); render(); }); }
  else if(a==="vgWiederAuf"&&v){ delete v.s.ausgefuehrt; delete v.erledigt; saveRec("vorgaenge",v); const bau=vgBau(v); if(bau&&bau.status==="fertig"){ bau.status="aktiv"; saveRec("baustellen",bau); }
    closeOverlays(); render(); toast(bau?"Wieder offen – Baustelle steht wieder auf „Aktiv“":"Wieder offen"); }
  else if(a==="vgAblehnen"&&v){ dialog("Anfrage ablehnen",`<div class="fg1">${tf("vgGrund","Grund (optional)","",{form:true,ph:"z. B. machen wir nicht, an Kollegen verwiesen"})}</div>`,
      `<button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text danger" data-act="vgAblehnenOk" data-id="${esc(id)}">Ablehnen</button>`); }
  else if(a==="vgAblehnenOk"&&v){ v.abgelehnt={wer:who(),at:Date.now(),grund:formVals().vgGrund||""}; saveRec("vorgaenge",v); closeOverlays(); render(); toast("Anfrage abgelehnt"); }
  else if(a==="vgDel"&&v){ v.deleted=true; saveRec("vorgaenge",v); closeOverlays(); render(); toast("Vorgang gelöscht","Rückgängig",()=>{ delete v.deleted; saveRec("vorgaenge",v); render(); }); }
},true);
/* „Wer fährt hin?“ – Mehrfachauswahl aus dem Team, gespeichert als „A, B“ (so steht es auch an der Baustelle) */
function vgMitWahl(mit){ const ist=String(mit||"").split(/\s*,\s*/).filter(Boolean), namen=[...new Set([...team().map(m=>m.name),...ist])];
  return `<div class="vg-mitw"><span class="vg-mitl">Wer fährt hin? (mehrere möglich)</span><div class="vg-mit">${namen.map(n=>`<button type="button" class="vg-mitc" data-act="vgMitT" data-v="${esc(n)}" aria-pressed="${ist.includes(n)}">${esc(n)}</button>`).join("")}
    <span class="vg-mitp">${tf("vgMitNeu","Andere Person","",{form:true,ph:"Name"})}<button type="button" class="vg-mitadd" data-act="vgMitPlus" aria-label="Person hinzufügen">${icon("add")}</button></span></div></div>`; }
const vgMitWerte=()=>{ const n=[...document.querySelectorAll('#dlg [data-act=vgMitT][aria-pressed="true"]')].map(x=>x.dataset.v), x=String((document.getElementById("f_vgMitNeu")||{}).value||"").trim(); if(x&&!n.includes(x)) n.push(x); return n.join(", "); };
/* Baustelle zum Termin anlegen bzw. Termin an der Baustelle nachziehen */
function vgKurz(t,n=48){ t=String(t||"").trim(); if(t.length<=n) return t; const c=t.slice(0,n); return c.slice(0,Math.max(c.lastIndexOf(" "),30)).replace(/[\s,–-]+$/,"")+" …"; }
function vgZuBaustelle(v,F){ const termin={datum:F.vgDatum,zeit:F.vgZeitE||"",mit:F.vgMit||""}, nr=(v.s.auftrag&&v.s.auftrag.nr)||"", dm=v.demo?{demo:true}:{};
  let b=vgBau(v);
  if(b){ b.termin=termin; if(nr&&!b.auftragsnr) b.auftragsnr=nr; saveRec("baustellen",b); return b; }
  let k=v.kundeId&&kundeOf(v.kundeId);
  if(!k){ k=saveRec("kunden",Object.assign({id:uid(),name:v.kundeName||"Ohne Namen",tel:v.tel||""},dm),true); v.kundeId=k.id; v.kundeName=""; }
  let s=F.vgOrt&&F.vgOrt!=="__neu"?standortOf(F.vgOrt):null;
  if(!s){ const txt=String(F.vgOrtNeu||"").trim(), vonKunde=!txt||txt===[k.strasse,[k.plz,k.ort].filter(Boolean).join(" ")].filter(Boolean).join(", ");
    s=saveRec("standorte",Object.assign({id:uid(),kundeId:k.id,name:txt||"Beim Kunden"},vonKunde?{strasse:k.strasse||"",plz:k.plz||"",ort:k.ort||""}:{},dm),true); }
  b=saveRec("baustellen",Object.assign({id:uid(),kundeId:k.id,standortId:s.id,name:vgKurz(v.anliegen)||"Auftrag",auftragsnr:nr,notiz:v.anliegen||"",status:"aktiv",termin,vorgangId:v.id},dm),true);
  v.baustelleId=b.id; return b; }
/* Kunde gewählt ⇒ Rückrufnummer aus der Kundenakte (nur wenn das Feld leer ist oder noch die vorgeschlagene Nummer enthält) */
function vgTelVorschlag(){ const i=document.getElementById("f_vgKunde"), t=document.getElementById("f_vgTel"); if(!i||!t) return;
  const k=live("kunden").find(x=>x.name.toLowerCase()===i.value.trim().toLowerCase());
  if(!t.value.trim()||t.dataset.auto===t.value){ const n=(k&&k.tel)||""; t.value=n; t.dataset.auto=n; } }
["input","change"].forEach(ev=>document.addEventListener(ev,e=>{ if(e.target&&e.target.id==="f_vgKunde") vgTelVorschlag(); }));
document.addEventListener("change",e=>{ if(e.target&&e.target.id==="f_vgOrt"){ const w=document.getElementById("vgOrtNeuW"); if(w) w.hidden=e.target.value!=="__neu"; } });
/* Hinweis auf der Startseite */
function vgStartKarte(){ vgAbgleich(); const L=vgFilter("offen"); if(!L.length) return "";
  const buero=L.filter(v=>vgStufe(v)===1).length, ohne=L.filter(v=>vgStufe(v)===0).length, alt=L.filter(v=>vgAlter(v)).length;
  return `<button class="vg-start" data-act="nav" data-v="auftraege"><span class="vg-si">${icon("board")}</span><span class="vg-st"><b>${L.length} ${L.length===1?"offener Vorgang":"offene Vorgänge"}</b>
    <span>${[buero&&`${buero} warte${buero===1?"t":"n"} aufs Büro`,ohne&&`${ohne} Anruf${ohne===1?"":"e"} ohne Anfrage`,alt&&`${alt} liegen länger`].filter(Boolean).join(" · ")||"alles im Fluss"}</span></span>${icon("chev")}</button>`; }
