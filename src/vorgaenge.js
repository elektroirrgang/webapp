/* Aufträge (Vorgänge): Anruf → Anfrage → Auftrag → Termin → Ausgeführt.
   Schließt die Lücke vor SCC-CONTROL: Anrufe sofort festhalten, Anfrage ans Büro, Büro erteilt den Auftrag
   (SCC-Auftragsnummer), Termin eintragen. Anfrage darf jeder stellen, den Auftrag erteilt nur das Büro-Konto (info@).
   Mit dem Termin entsteht die Baustelle in der Baustellen-App (gleicher Gerätespeicher, gleicher Abgleich);
   steht die Baustelle auf „Fertig“, ist der Vorgang ausgeführt – und umgekehrt. */
Object.assign(IC,{vgTafel:"M3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2zm2 0h4v14H5V5zm6 0h8v6h-8V5zm0 8h8v6h-8v-6z",vgListe:"M19 13H5c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2zm0 6H5v-4h14v4zm0-16H5c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 6H5V5h14v4z"}); IC.send=IC.send||"M2.01 21L23 12 2.01 3 2 10l15 2-15 2z";
const VG_S=[["anruf","Anruf"],["anfrage","Anfrage"],["auftrag","Auftrag"],["termin","Termin"],["ausgefuehrt","Ausgeführt","Fertig"]];
const VG_F=[["offen","Offen"],["buero","Wartet aufs Büro"],["termin","Ohne Termin"],["erledigt","Ausgeführt"],["abgelehnt","Abgelehnt"]];
const VG_BUERO=["info@elektro-irrgang.de"];
const istBuero=()=>VG_BUERO.includes(String(ME.mail||"").toLowerCase())||!!ME.buero||!!ME.admin;
const vgStufe=v=>{ let n=-1; VG_S.forEach(([k],i)=>{ if(v.s&&v.s[k]) n=i; }); return n; };
const vgZu=v=>!!((v.s&&v.s.ausgefuehrt)||v.erledigt||v.abgelehnt);
const VG_HIER=()=>typeof baustelleView==="function";
const vgBauLink=(b,inhalt,kl)=>VG_HIER()?`<button class="${kl}" data-act="nav" data-v="baustelle" data-id="${esc(b.id)}">${inhalt}</button>`:`<a class="${kl}" href="../baustelle/">${inhalt}</a>`;
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
      +(bau?z("Baustelle",vgBauLink(bau,`${esc(bau.name)} · ${esc({besichtigung:"Besichtigung",aktiv:"Aktiv",pausiert:"Pausiert",fertig:"Fertig"}[bau.status||"aktiv"])}`,"vg-link")):"");
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
/* ===== Ansicht: Tafel (Spalten wie Trello) oder Liste – gleiche Karten, umschaltbar ===== */
const VG_T=["Neu","Beim Büro","Beauftragt","Geplant","Erledigt"];
const VG_NEXT_T=["Ans Büro geben","Auftrag erteilen","Termin eintragen","Erledigt melden"];
let VG_SEL=null;
const VG_PC=matchMedia("(min-width:1024px)"), vgWide=()=>typeof WIDE!=="undefined"&&WIDE.matches;
/* Tabelle nur ab Laptop-Breite – darunter fällt sie auf Tafel (iPad) bzw. Liste (Handy) zurück */
const vgAnsicht=()=>{ let a=META.vgAnsicht||(VG_PC.matches?"tabelle":vgWide()?"tafel":"liste"); if(a==="tabelle"&&!VG_PC.matches) a=vgWide()?"tafel":"liste"; return a; };
/* Zuständig: mehrere Personen möglich (v.zustAlle); v.zust bleibt die erste – für ältere App-Stände auf anderen Geräten */
const vgZustL=v=>Array.isArray(v.zustAlle)?v.zustAlle.filter(Boolean):(v.zust?[v.zust]:[]);
const vgZustIch=v=>vgZustL(v).some(p=>vgIstIch(p));
const vgZustHat=(v,mail)=>vgZustL(v).some(p=>String(p.mail||"").toLowerCase()===String(mail||"").toLowerCase());
function vgZustSchreiben(v,L){ v.zustAlle=L; v.zust=L[0]||null; saveRec("vorgaenge",v); }
const vgZustNamen=v=>vgZustL(v).map(p=>p.name||"").filter(Boolean);
const vgZustAv=(v,kl)=>{ const L=vgZustL(v); return L.length?`<span class="vk-ps">${L.slice(0,3).map(z=>`<span class="${kl||"vk-p"}${vgIstIch(z)?" ich":""}" title="Zuständig: ${esc(z.name||"")}">${esc(initials(z.name||"?"))}</span>`).join("")}${L.length>3?`<span class="${kl||"vk-p"} mehr">+${L.length-3}</span>`:""}</span>`:""; };
const vgDarfZust=v=>istBuero()||!vgZustL(v).length||vgZustIch(v);
const vgIstIch=p=>!!p&&!!ME.mail&&String(p.mail||"").toLowerCase()===String(ME.mail).toLowerCase();
/* darf ich den Auftrag in Spalte ti schieben? (nur ein Schritt vor; zurück nur Büro/Chef) */
function vgDarfNach(v,ti){ const fi=vgStufe(v); if(v.abgelehnt||ti===fi) return false;
  if(ti<fi) return istBuero();
  if(ti!==fi+1) return false;
  if(ti===1) return true;
  if(ti===4) return istBuero()||vgZustIch(v);
  return istBuero(); }
FDEF.vg={std:{sort:"dringend",dr:"alle",wer:"alle"},
  sort:[["dringend","Dringende zuerst"],["neu","Neueste zuerst"],["alt","Älteste zuerst"],["az","Kunde A–Z"],["termin","Nächster Termin zuerst"],["zust","Zuständig A–Z"],["seit","Am längsten im Schritt"]],
  gruppen:[{k:"dr",t:"Dringend",opts:[["alle","Alle"],["ja","Nur dringende"]]},{k:"wer",t:"Person",opts:[["alle","Alle"],["mein","Meine"],["zust","Mir zugewiesen"]]}],
  liste:()=>vgListe()};
const vgAt=v=>(v.s&&v.s.anruf&&v.s.anruf.at)||v.created||0;
function vgMein(v){ const m=String(ME.mail||"").toLowerCase(), n=String(ME.name||"").trim(); if(!m&&!n) return true;
  return vgZustIch(v)||Object.values(v.s||{}).some(x=>x&&x.wer&&((m&&String(x.wer.mail||"").toLowerCase()===m)||(n&&x.wer.name===n)))||(v.createdBy&&String(v.createdBy.mail||"").toLowerCase()===m)
    ||(n&&v.s&&v.s.termin&&String(v.s.termin.mit||"").split(/\s*,\s*/).includes(n)); }
/* Suche + Filter (Person, dringend) + Sortierung – gilt für Tafel und Liste */
function vgGefiltert(L){ const q=String(query||"").trim().toLowerCase(), H=x=>String(x||"").toLowerCase().includes(q);
  if(q) L=L.filter(v=>H(vgKunde(v))||H(v.anliegen)||H(v.tel)||H(v.s&&v.s.auftrag&&v.s.auftrag.nr)||H(v.s&&v.s.termin&&v.s.termin.mit)||vgZustNamen(v).some(H));
  if(fW("vg","dr")==="ja") L=L.filter(v=>v.dringend);
  const w=fW("vg","wer"); if(w==="mein") L=L.filter(vgMein); else if(w==="zust"){ const ich=new Set(vgMeine().map(v=>v.id)); L=L.filter(v=>vgZustIch(v)||ich.has(v.id)); }
  const so=fW("vg","sort"), td=v=>(v.s&&v.s.termin&&v.s.termin.datum)||"9999";
  if(so==="neu") L.sort((a,b)=>vgAt(b)-vgAt(a)); else if(so==="alt") L.sort((a,b)=>vgAt(a)-vgAt(b));
  else if(so==="az") L.sort((a,b)=>vgKunde(a).localeCompare(vgKunde(b),"de")||vgAt(b)-vgAt(a));
  else if(so==="termin") L.sort((a,b)=>td(a).localeCompare(td(b))||vgAt(b)-vgAt(a));
  else if(so==="zust") L.sort((a,b)=>String((a.zust&&a.zust.name)||"~").localeCompare(String((b.zust&&b.zust.name)||"~"),"de")||vgAt(b)-vgAt(a));
  else if(so==="seit") L.sort((a,b)=>vgSchrittAt(a)-vgSchrittAt(b));
  return L; }
const vgFotos=v=>typeof dateienVon==="function"?dateienVon("vorgaenge",v.id):[];
function vgKarte(v,liste){ const a=vgAlter(v), t=v.s&&v.s.termin, nr=v.s&&v.s.auftrag&&v.s.auftrag.nr, nk=(v.notizen||[]).length, nf=vgFotos(v).length, st=vgStufe(v), z=v.zust;
  const next=liste&&!vgZu(v)&&st<4&&vgDarfNach(v,st+1)?`<button class="vk-next" data-act="vgWeiter" data-id="${esc(v.id)}">${esc(VG_NEXT_T[st])}${icon("chev")}</button>`:"";
  return `<div class="vk${v.dringend?" dr":""}${a?" haengt":""}${VG_SEL===v.id?" an":""}${v.abgelehnt?" abgl":""}" data-act="vgSel" data-id="${esc(v.id)}" role="button" tabindex="0">
    <div class="vk-k"><b>${esc(vgKunde(v))}</b>${v.dringend?`<span class="vk-dr">dringend</span>`:""}${liste?`<span class="vk-st s${st}">${esc(v.abgelehnt?"Abgelehnt":VG_T[Math.max(0,st)])}</span>`:""}</div>
    ${v.anliegen?`<p class="vk-a">${esc(v.anliegen)}</p>`:""}
    <div class="vk-f">${t&&t.datum?`<span class="vk-c">${esc(new Date(t.datum+"T12:00").toLocaleDateString("de-DE",{weekday:"short",day:"2-digit",month:"2-digit"}))}${t.zeit?` · ${esc(t.zeit)}`:""}</span>`:""}${nr?`<span class="vk-c">SCC ${esc(nr)}</span>`:""}
      ${nk?`<span class="vk-c" title="${nk} Notiz${nk>1?"en":""}">${icon("notes")}${nk}</span>`:""}${nf?`<span class="vk-c" title="${nf} Foto/Datei">${icon("cam")}${nf}</span>`:""}
      ${a?`<span class="vk-alt">${esc(a.txt)}</span>`:""}<span class="vk-sp"></span>${vgZustAv(v)}${next}</div></div>`; }
function vgTafel(L){
  const grenze=Date.now()-14*864e5;
  return `<div class="vt">${VG_T.map((t,i)=>{ let C=L.filter(v=>!v.abgelehnt&&Math.max(0,vgStufe(v))===i);
    if(i===4) C=C.filter(v=>((v.s.ausgefuehrt&&v.s.ausgefuehrt.at)||0)>=grenze);
    return `<section class="vs" data-i="${i}"><div class="vs-k"><b>${t}</b><span>${C.length}</span></div><div class="vs-l">${C.map(v=>vgKarte(v,false)).join("")||`<p class="vs-leer">${i===0?"Neue Anrufe landen hier":"Leer"}</p>`}</div>
      ${i===4?`<button class="btn-text vs-mehr" data-act="vgZurListe" data-v="erledigt">Alle erledigten${icon("chev")}</button>`:""}</section>`; }).join("")}</div>`; }
function vgListe(){ const tafel=vgAnsicht()==="tafel";
  if(vgAnsicht()==="tabelle"){ const L=vgGefiltert(vgKListe(vgKAkt())); return fInfo("vg",L.length,"Auftrag","Aufträge")+vgTabelle(L); }
  if(tafel){ const L=vgGefiltert(vgAlle()); return fInfo("vg",L.length,"Auftrag","Aufträge")+vgTafel(L); }
  const f=META.vgF||"offen", L=vgGefiltert(vgFilter(f));
  if(!L.length) return fInfo("vg",0,"Auftrag","Aufträge")+`<p class="meta" style="margin:16px 4px">${query?`Nichts gefunden für „${esc(query)}“.`:"Keine Aufträge in dieser Auswahl."}</p>`;
  return fInfo("vg",L.length,"Auftrag","Aufträge")+`<div class="vg-l">${L.map(v=>vgKarte(v,true)).join("")}</div>`; }
function vorgaengeView(){ vgAbgleich();
  if(nav.sel){ VG_SEL=nav.sel; delete nav.sel; }
  const ans=vgAnsicht(), tafel=ans!=="liste", f=META.vgF||"offen", n=x=>vgFilter(x).length, w=fW("vg","wer"), kAkt=vgKAkt();
  const chips=tafel?`<div class="chips vg-chips"><button class="chip" data-act="vgWer" data-v="alle" aria-pressed="${w==="alle"}">Alle</button><button class="chip" data-act="vgWer" data-v="mein" aria-pressed="${w==="mein"}">Meine</button><button class="chip" data-act="vgWer" data-v="zust" aria-pressed="${w==="zust"}">Mir zugewiesen</button><button class="chip" data-act="vgDr" aria-pressed="${fW("vg","dr")==="ja"}">Nur dringende</button>${ans==="tabelle"?`<span class="vg-chsp"></span><button class="chip" data-act="vgK" data-v="erledigt" aria-pressed="${kAkt==="erledigt"}">Erledigt</button><button class="chip" data-act="vgK" data-v="abgelehnt" aria-pressed="${kAkt==="abgelehnt"}">Abgelehnt</button>`:""}</div>`
    :`<div class="chips vg-chips">${VG_F.map(([k,t])=>`<button class="chip" data-act="vgFilter" data-v="${k}" aria-pressed="${f===k}">${esc(t)}${k==="erledigt"||k==="abgelehnt"?"":`<span class="chip-n">${n(k)}</span>`}</button>`).join("")}</div>`;
  const kopf=`<div class="bib-kopf">${searchBar("Kunde, Anliegen, SCC-Nr., Person",fKnopf("vg"))}<div class="seg ans-seg" role="group" aria-label="Ansicht">${VG_PC.matches?`<button data-act="vgAnsicht" data-v="tabelle" aria-pressed="${ans==="tabelle"}" title="Tabelle">${icon("vgTabelle")}</button>`:""}<button data-act="vgAnsicht" data-v="tafel" aria-pressed="${ans==="tafel"}" title="Tafel">${icon("vgTafel")}</button><button data-act="vgAnsicht" data-v="liste" aria-pressed="${ans==="liste"}" title="Liste">${icon("vgListe")}</button></div></div>`;
  const v=VG_SEL&&DB.vorgaenge.get(VG_SEL); if(VG_SEL&&(!v||v.deleted)) VG_SEL=null;
  if(!live("vorgaenge").length) return `<div class="narrow vg">${kopf}<div class="empty bib-leer">${icon("vgTafel")}<h2>Noch keine Aufträge</h2><p>Kommt ein Anruf rein: „N“ drücken oder auf „+ Vorgang“ – Kunde und Anliegen eintragen, fertig. Danach wandert die Karte von links nach rechts: Neu, beim Büro, beauftragt, geplant, erledigt.</p></div></div>`;
  if(ans==="tabelle") vgMarkAufraeumen();
  return `<div class="narrow vg${VG_SEL?" mit-panel":""}${ans==="tafel"?" ist-tafel":""}${ans==="tabelle"?" ist-tabelle":""}">${kopf}${ans==="tabelle"?vgKennzahlen():""}${chips}<div id="res">${vgListe()}</div></div>${VG_SEL&&v?vgPanel(v):""}${ans==="tabelle"?vgLeiste():""}`; }
/* ===== Seitenleiste: alles zu einem Auftrag ===== */
function vgVerlauf(v){ const E=[];
  VG_S.forEach(([k,t],i)=>{ const s=v.s&&v.s[k]; if(s) E.push({at:s.at||0,html:`<div class="vv-e schritt"><i class="vv-p s${i}"></i><div><b>${esc(k==="anruf"&&s.vorOrt?"Vor Ort gemeldet":VG_T[i])}</b><span>${esc((s.wer&&s.wer.name)||"–")} · ${esc(vgZeit(s.at))}${k==="auftrag"&&s.nr?` · SCC ${esc(s.nr)}`:""}${k==="termin"&&s.datum?` · ${esc(deDate(s.datum))}${s.zeit?` ${esc(s.zeit)} Uhr`:""}${s.mit?` · ${esc(s.mit)}`:""}`:""}</span></div>${istBuero()&&k!=="anruf"?`<button class="vv-z" data-act="vgZurueck" data-id="${esc(v.id)}" data-k="${k}" title="Zurücknehmen">${icon("back")}</button>`:""}</div>`}); });
  if(v.abgelehnt) E.push({at:v.abgelehnt.at||0,html:`<div class="vv-e schritt"><i class="vv-p bad"></i><div><b>Abgelehnt</b><span>${esc((v.abgelehnt.wer&&v.abgelehnt.wer.name)||"–")} · ${esc(vgZeit(v.abgelehnt.at))}${v.abgelehnt.grund?` · ${esc(v.abgelehnt.grund)}`:""}</span></div>${istBuero()?`<button class="vv-z" data-act="vgAblZurueck" data-id="${esc(v.id)}" title="Ablehnung zurücknehmen">${icon("back")}</button>`:""}</div>`});
  vgZustL(v).filter(z=>z.at).forEach(z=>E.push({at:z.at,html:`<div class="vv-e info"><i class="vv-p"></i><div><span>${esc((z.von&&z.von.name)||"")} hat ${esc(z.name||"")} zugewiesen · ${esc(vgZeit(z.at))}</span></div></div>`}));
  (v.notizen||[]).forEach(n=>E.push({at:n.at||0,html:`<div class="vv-e notiz${vgIstIch(n.wer)?" ich":""}"><span class="vv-av">${esc(initials((n.wer&&n.wer.name)||"?"))}</span><div class="vv-blase"><b>${esc((n.wer&&n.wer.name)||"–")}<small>${esc(vgZeit(n.at))}</small></b><p>${esc(n.text)}</p></div></div>`}));
  return E.sort((a,b)=>a.at-b.at).map(e=>e.html).join(""); }
function vgPanel(v){ const st=vgStufe(v), id=esc(v.id), k=v.kundeId&&kundeOf(v.kundeId), tel=v.tel&&v.tel.replace(/[^\d+]/g,""), F=vgFotos(v);
  const T=team().filter(m=>m.mail), zust=v.zust, next=!vgZu(v)&&st<4?(vgDarfNach(v,st+1)?{act:"vgWeiter",t:VG_NEXT_T[st]}:{warte:st===1?"Wartet aufs Büro":"Weiter macht das Büro"}):null;
  return `<aside class="vp" role="dialog" aria-label="Auftrag ${esc(vgKunde(v))}">
    <div class="vp-kopf"><div class="vp-t"><b>${esc(vgKunde(v))}</b><small>${esc(v.abgelehnt?"Abgelehnt":VG_T[Math.max(0,st)])}${v.dringend?" · dringend":""}</small></div>
      <button class="vp-zu" data-act="vgSelZu" aria-label="Schließen" title="Schließen">${icon("close")}</button></div>
    <div class="vp-in">
      <div class="vp-schritte">${VG_T.map((t,i)=>`<span class="${i<=st?"da":""}${i===st?" jetzt":""}"><i></i>${t}</span>`).join("")}</div>
      ${v.anliegen?`<p class="vp-an">${esc(v.anliegen)}</p>`:""}
      <div class="vp-qa">${tel?`<a class="vp-q" href="tel:${esc(tel)}">${icon("phone")}<span>${esc(v.tel)}</span></a>`:""}${k?`<button class="vp-q" data-act="nav" data-v="kunde" data-id="${esc(k.id)}">${icon("firma")}<span>Kunde öffnen</span></button>`:""}${vgBau(v)?vgBauLink(vgBau(v),`${icon("baustelle")}<span>Baustelle</span>`,"vp-q"):""}${vgVonBau(v)&&vgVonBau(v)!==vgBau(v)?vgBauLink(vgVonBau(v),`${icon("baustelle")}<span>Gemeldet auf ${esc(vgKurz(vgVonBau(v).name,28))}</span>`,"vp-q"):""}</div>
      <div class="vp-ab"><div class="vp-l">Zuständig${vgZustL(v).length>1?` · ${vgZustL(v).length} Personen`:""}</div><div class="vp-zust">${T.map(m=>`<button class="vp-pc" data-act="vgZust" data-id="${id}" data-mail="${esc(m.mail)}" aria-pressed="${vgZustHat(v,m.mail)}" ${vgDarfZust(v)?"":"disabled"}>${esc(m.name)}</button>`).join("")}</div></div>
      <div class="vp-ab"><div class="sec-row" style="margin:0"><div class="vp-l">Fotos und Dateien</div><span class="ab-btns"><button class="ab-ic" data-act="ablageFoto" data-kind="vorgaenge" data-id="${id}" title="Foto aufnehmen">${icon("cam")}</button><button class="ab-ic" data-act="ablageDatei" data-kind="vorgaenge" data-id="${id}" title="Datei anhängen">${icon("attach")}</button></span></div>
        ${F.length?`<div class="vp-fotos">${F.map(d=>/^image\//.test(d.typ||"")?`<button class="ab-k" data-act="dateiOeffnen" data-id="${esc(d.id)}" aria-label="${esc(d.name)}"><img data-datei="${esc(d.id)}" alt=""></button>`:`<button class="vp-datei" data-act="dateiOeffnen" data-id="${esc(d.id)}">${icon("doc")}<span>${esc(d.name)}</span></button>`).join("")}</div>`:""}</div>
      <div class="vp-ab"><div class="vp-l">Verlauf</div><div class="vv">${vgVerlauf(v)}</div></div>
    </div>
    <div class="vp-notiz">${tf("vgNotiz","Notiz schreiben …","",{form:true})}<button class="vp-senden" data-act="vgNotizOk" data-id="${id}" aria-label="Notiz senden" title="Senden (Enter)">${icon("send")}</button></div>
    <div class="vp-fuss">${vgDarfLoeschen(v)?`<button class="btn-text danger" data-act="vgDelFrage" data-id="${id}">Löschen</button>`:""}<button class="btn-text" data-act="vgEdit" data-id="${id}">Bearbeiten</button><span style="flex:1"></span>
      ${!vgZu(v)&&istBuero()&&st===1?`<button class="btn-text danger" data-act="vgAblehnen" data-id="${id}">Ablehnen</button>`:""}
      ${next&&next.act?`<button class="vp-weiter" data-act="vgWeiter" data-id="${id}">${esc(next.t)}</button>`:next&&next.warte?`<span class="vp-warte">${esc(next.warte)}</span>`:vgZu(v)&&!v.abgelehnt&&(istBuero()||vgIstIch(v.zust))?`<button class="btn-text" data-act="vgWiederAuf" data-id="${id}">Wieder öffnen</button>`:""}</div>
  </aside>`; }
/* nächster Schritt – derselbe Weg wie beim Ziehen in die nächste Spalte */
function vgWeiter(v){ const st=vgStufe(v); if(vgZu(v)||!vgDarfNach(v,st+1)) return;
  const act=["vgAnfrage","vgAuftrag","vgTermin","vgAusgef"][st]; if(act) vgKlick(act,v.id); }
function vgKlick(act,id,extra){ const b=document.createElement("button"); b.dataset.act=act; b.dataset.id=id; if(extra) Object.assign(b.dataset,extra); b.hidden=true; document.body.appendChild(b); b.click(); b.remove(); }
function vgOpen(v){ VG_SEL=v.id; if(nav.v!=="auftraege") go({v:"auftraege"}); else render(); }

/* Erfassen / Bearbeiten */
let vgE=null;
function vgDialog(v){ vgE=v?JSON.parse(JSON.stringify(v)):{id:null,kundeName:"",tel:"",anliegen:"",dringend:false}; vgE.zustSel=v?vgZustL(v).map(p=>String(p.mail||"").toLowerCase()):[];
  dialog(v?"Vorgang bearbeiten":"Neuer Vorgang",`<div class="fg1">
    <div class="vgk-w">${tf("vgKunde","Kunde",v?vgKunde(v):"",{form:true,ph:"Name oder Firma"})}<div class="vgk" id="vgkVl" role="listbox" hidden></div><p class="vgk-hin" id="vgkHin"></p></div>
    ${tf("vgTel","Telefon (Rückruf)",vgE.tel||"",{form:true,im:"tel",ph:"z. B. 0171 …"})}
    ${ta("vgAnliegen","Was möchte der Kunde?",vgE.anliegen||"",{form:true,ph:"z. B. Steckdose im Bad ohne Funktion"})}
    <div class="vg-drw"><span>Dringend</span>${seg("vgDring",vgE.dringend?"ja":"nein",[["nein","Nein"],["ja","Ja"]])}</div>
    <div class="lbl" style="margin:8px 4px 6px">Zuständig (optional, mehrere möglich)</div><div class="chips vg-zw">${team().filter(m=>m.mail).map(m=>`<button type="button" class="chip" data-act="vgZustDlg" data-mail="${esc(m.mail)}" aria-pressed="${vgE.zustSel.includes(String(m.mail).toLowerCase())}">${esc(m.name)}</button>`).join("")}</div></div>`,
    `${v&&(istBuero()||(v.createdBy&&v.createdBy.mail===ME.mail))?`<button class="btn-text danger" data-act="vgDel" data-id="${esc(v.id)}">Löschen</button><span style="flex:1"></span>`:""}<button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="vgSpeichern">${v?"Speichern":"Anlegen"}</button>`); }
function vgSpeichern(){ const F=formVals(); if(!F.vgKunde&&!F.vgAnliegen){ toast("Bitte Kunde oder Anliegen eintragen"); return; }
  const k=live("kunden").find(x=>x.name.toLowerCase()===String(F.vgKunde||"").toLowerCase());
  const neu=!vgE.id, v=neu?{id:uid(),s:{anruf:{wer:who(),at:Date.now()}}}:DB.vorgaenge.get(vgE.id);
  Object.assign(v,{kundeId:k?k.id:"",kundeName:k?"":F.vgKunde,tel:F.vgTel,anliegen:F.vgAnliegen,dringend:!!vgE.dringend});
  { const alt=vgZustL(v), sel=vgE.zustSel||[], gleich=alt.length===sel.length&&alt.every(p=>sel.includes(String(p.mail||"").toLowerCase()));
    if(!gleich&&(neu||vgDarfZust(v))) vgZustSchreiben(v,sel.map(mail=>alt.find(p=>String(p.mail||"").toLowerCase()===mail)||(m=>m&&{mail:m.mail,name:m.name,at:Date.now(),von:who()})(team().find(x=>String(x.mail).toLowerCase()===mail))).filter(Boolean)); }
  if(neu&&k&&k.demo) v.demo=true; if(!F.vgTel&&k&&k.tel&&neu) v.tel=k.tel;
  saveRec("vorgaenge",v,neu); closeOverlays(); render(); toast(neu?"Vorgang angelegt":"Gespeichert",neu?"Anfrage ans Büro":null,neu?()=>vgSchritt(v.id,"anfrage"):null); }
function vgSchritt(id,k,extra={}){ const v=DB.vorgaenge.get(id); if(!v) return; v.s=v.s||{}; v.s[k]=Object.assign({wer:who(),at:Date.now()},extra); saveRec("vorgaenge",v); closeOverlays(); render();
  toast(k==="anfrage"?"Anfrage ans Büro gestellt":k==="auftrag"?"Auftrag erteilt":k==="termin"?"Termin eingetragen":"Gespeichert"); }
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act^="vg"]'); if(!b) return; const a=b.dataset.act, id=b.dataset.id, v=id&&DB.vorgaenge.get(id);
  if(a==="vgZustDlg"){ e.stopPropagation(); if(!vgE) return; const m=String(b.dataset.mail).toLowerCase(); vgE.zustSel=vgE.zustSel.includes(m)?vgE.zustSel.filter(x=>x!==m):[...vgE.zustSel,m]; b.setAttribute("aria-pressed",String(vgE.zustSel.includes(m))); return; }
  if(a==="vgDring"){ e.stopPropagation(); if(vgE) vgE.dringend=b.dataset.v==="ja"; b.parentElement.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",x===b)); if(typeof segInd==="function") segInd(); return; }
  e.stopPropagation(); e.preventDefault();
  if(b.closest("#menu")) closeOverlays();
  if(a==="vgNeu") vgDialog(null);
  else if(a==="vgSel"&&v){ if(Date.now()-vgLpZeit<500) return; if(nav.v!=="auftraege"){ vgOpen(v); return; } VG_SEL=VG_SEL===v.id?null:v.id; render(); }
  else if(a==="vgSelZu"){ VG_SEL=null; render(); }
  else if(a==="vgWeiter"&&v) vgWeiter(v);
  else if(a==="vgAnsicht"){ if(vgAnsicht()!==b.dataset.v){ META.vgAnsicht=b.dataset.v; metaSave(); render(); } }
  else if(a==="vgWer"){ fSet("vg","wer",b.dataset.v); render(); }
  else if(a==="vgDr"){ fSet("vg","dr",fW("vg","dr")==="ja"?"alle":"ja"); render(); }
  else if(a==="vgZurListe"){ META.vgAnsicht="liste"; META.vgF=b.dataset.v; metaSave(); render(); }
  else if(a==="vgZust"&&v){ if(!vgDarfZust(v)) return; const m=team().find(x=>String(x.mail).toLowerCase()===String(b.dataset.mail).toLowerCase()); if(!m) return; vgZustSetzen(v,m); render(); }
  else if(a==="vgNotizOk"&&v){ const i=document.getElementById("f_vgNotiz"), t=String(i&&i.value||"").trim(); if(!t) return;
    v.notizen=(v.notizen||[]).concat([{id:uid(),wer:who(),at:Date.now(),text:t}]); saveRec("vorgaenge",v); render();
    setTimeout(()=>{ const n=document.getElementById("f_vgNotiz"); if(n) n.focus(); const vv=document.querySelector(".vp-in"); if(vv) vv.scrollTop=vv.scrollHeight; },0); }
  else if(a==="vgDelFrage"&&v){ if(!vgDarfLoeschen(v)) return; closeOverlays();
    dialog("Vorgang löschen?",`<p>„${esc(vgKunde(v))}“ wird für alle gelöscht. Direkt danach kannst du es noch rückgängig machen.</p>`,
      `<button class="btn-text danger" data-act="vgDel" data-id="${esc(v.id)}">Löschen</button><span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button>`); }
  else if(a==="vgMitT"){ b.setAttribute("aria-pressed",b.getAttribute("aria-pressed")!=="true"); }
  else if(a==="vgMitPlus"){ const i=document.getElementById("f_vgMitNeu"), n=String(i&&i.value||"").trim(); if(!n) return; const w=document.querySelector("#dlg .vg-mit");
    if(![...w.querySelectorAll("[data-act=vgMitT]")].some(x=>x.dataset.v===n)) w.querySelector(".vg-mitp").insertAdjacentHTML("beforebegin",`<button type="button" class="vg-mitc" data-act="vgMitT" data-v="${esc(n)}" aria-pressed="true">${esc(n)}</button>`);
    i.value=""; }
  else if(a==="vgSpeichern") vgSpeichern();
  else if(a==="vgK"){ const k=b.dataset.v; if(nav.v!=="auftraege"){ META.vgK=k; if(!VG_PC.matches) META.vgF=k==="buero"?"buero":"offen"; metaSave(); go({v:"auftraege"}); return; } META.vgK=vgKAkt()===k&&k!=="offen"?"offen":k; metaSave(); render(); }
  else if(a==="vgSort"){ const k=b.dataset.v; fSet("vg","sort",fW("vg","sort")===k?"dringend":k); render(); }
  else if(a==="vgMark"&&v){ if(VG_MARK.has(v.id)) VG_MARK.delete(v.id); else VG_MARK.add(v.id); render(); }
  else if(a==="vgMarkAlle"){ const ids=[...document.querySelectorAll(".vr[data-id]")].map(x=>x.dataset.id), alle=ids.length&&ids.every(i=>VG_MARK.has(i)); ids.forEach(i=>alle?VG_MARK.delete(i):VG_MARK.add(i)); render(); }
  else if(a==="vgMarkWeg"){ VG_MARK.clear(); render(); }
  else if(a==="vgMarkZust"){ const r=b.getBoundingClientRect(), M=vgMarkiert().filter(vgDarfZust);
    kontextMenu(r.left,r.top-8,[...team().filter(m=>m.mail).map(m=>({t:`${m.name} dazunehmen`,ic:"person",fn:()=>{ M.forEach(x=>{ if(!vgZustHat(x,m.mail)) vgZustSetzen(x,m,true); }); toast(`${m.name} ist jetzt bei ${M.length} ${M.length===1?"Auftrag":"Aufträgen"} zuständig`); VG_MARK.clear(); render(); }})),"-",{t:"Niemand mehr zuständig",ic:"close",fn:()=>{ M.forEach(x=>vgZustSetzen(x,null,true)); VG_MARK.clear(); render(); }}]); }
  else if(a==="vgMarkBuero"){ const M=vgMarkiert().filter(x=>!vgZu(x)&&vgStufe(x)===0), t=Date.now(); M.forEach(x=>{ x.s.anfrage={wer:who(),at:t}; saveRec("vorgaenge",x); }); VG_MARK.clear(); render(); toast(`${M.length} ${M.length===1?"Anfrage":"Anfragen"} ans Büro gegeben`); }
  else if(a==="vgMarkDel"){ const M=vgMarkiert().filter(vgDarfLoeschen);
    dialog(`${M.length} ${M.length===1?"Auftrag":"Aufträge"} löschen?`,`<p>${esc(M.map(vgKunde).slice(0,6).join(", "))}${M.length>6?" …":""} – wird für alle gelöscht. Direkt danach kannst du es noch rückgängig machen.</p>`,
      `<button class="btn-text danger" data-act="vgMarkDelOk">Löschen</button><span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button>`); }
  else if(a==="vgMarkDelOk"){ const M=vgMarkiert().filter(vgDarfLoeschen); M.forEach(x=>{ x.deleted=true; saveRec("vorgaenge",x); }); VG_MARK.clear(); closeOverlays(); render();
    toast(`${M.length} gelöscht`,"Rückgängig",()=>{ M.forEach(x=>{ delete x.deleted; saveRec("vorgaenge",x); }); render(); }); }
  else if(a==="vgZustPick"&&v){ if(!vgDarfZust(v)) return; const r=b.getBoundingClientRect();
    kontextMenu(r.left,r.bottom,[...team().filter(m=>m.mail).map(m=>({t:vgZustHat(v,m.mail)?`${m.name} entfernen`:m.name,ic:vgZustHat(v,m.mail)?"close":"person",fn:()=>{ vgZustSetzen(v,m); render(); }})),...(vgZustL(v).length>1?["-",{t:"Niemand",ic:"close",fn:()=>{ vgZustSetzen(v,null); render(); }}]:[])]); }
  else if(a==="vgNrEd"&&v){ if(!istBuero()) return; vgInline(b,`<input class="vt-in" id="vgNrIn" data-id="${esc(v.id)}" value="${esc((v.s.auftrag&&v.s.auftrag.nr)||"")}" placeholder="SCC-Nr." autocomplete="off">`); }
  else if(a==="vgTerminEd"&&v){ if(!istBuero()) return; const t=v.s.termin||{};
    vgInline(b,`<span class="vt-ed2" data-id="${esc(v.id)}"><input class="vt-in" id="vgTdIn" type="date" value="${esc(t.datum||today())}"><input class="vt-in" id="vgTzIn" value="${esc(t.zeit||"")}" placeholder="Uhrzeit" autocomplete="off"></span>`); }
  else if(a==="vgMelden"){ const bb=DB.baustellen.get(b.dataset.id); if(bb) vgMeldenDlg(bb); }
  else if(a==="vgMFoto"){ const f=document.getElementById("vgMFotoIn"); if(f) f.click(); }
  else if(a==="vgMFotoWeg"){ const i=+b.dataset.i, x=VG_MF.splice(i,1)[0]; if(x) URL.revokeObjectURL(x.url); vgMFotosMalen(); }
  else if(a==="vgMeldenOk") vgMeldenOk();
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
    const ort=bau?"":SS.length?`${sf("vgOrt","Wo? (Standort der Baustelle)",SS.length===1?SS[0].id:(vgVonBau(v)&&SS.some(x=>x.id===vgVonBau(v).standortId)?vgVonBau(v).standortId:""),[...(SS.length>1?[["","Bitte wählen"]]:[]),...SS.map(x=>[x.id,x.name]),["__neu","Anderer Ort …"]],{form:true})}<div id="vgOrtNeuW" hidden>${tf("vgOrtNeu","Anderer Ort (Adresse)","",{form:true,ph:"Straße, Ort"})}</div>`
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
  else if(a==="vgDel"&&v){ if(!vgDarfLoeschen(v)) return; v.deleted=true; saveRec("vorgaenge",v); closeOverlays(); render(); toast("Vorgang gelöscht","Rückgängig",()=>{ delete v.deleted; saveRec("vorgaenge",v); render(); }); }
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
/* Kundenauswahl im Vorgang: Treffer direkt unter dem Feld im Fenster (statt schwebender Liste) – mit Ort und Telefon,
   leer = zuletzt bearbeitete Kunden; darunter ein Hinweis, ob es ein bekannter oder ein neuer Kunde ist */
let vgkHl=-1;
const vgkExakt=q=>live("kunden").find(k=>!k.mergedInto&&k.name.toLowerCase()===String(q||"").trim().toLowerCase());
function vgkTreffer(q){ q=String(q||"").trim().toLowerCase(); const K=live("kunden").filter(k=>!k.mergedInto);
  if(!q) return K.sort((a,b)=>(b.updated||b.created||0)-(a.updated||a.created||0)).slice(0,5);
  const H=x=>String(x||"").toLowerCase().includes(q);
  return K.filter(k=>H(k.name)||H(k.ort)||H(k.kdnr)||H(k.ansprech)).sort((a,b)=>(a.name.toLowerCase().startsWith(q)?0:1)-(b.name.toLowerCase().startsWith(q)?0:1)||a.name.localeCompare(b.name,"de")).slice(0,6); }
function vgkMalen(offen){ const i=document.getElementById("f_vgKunde"), w=document.getElementById("vgkVl"), h=document.getElementById("vgkHin"); if(!i||!w) return;
  const q=i.value.trim(), ex=vgkExakt(q), L=offen&&!ex?vgkTreffer(q):[];
  const mark=t=>{ const p=q?t.toLowerCase().indexOf(q.toLowerCase()):-1; return p<0?esc(t):esc(t.slice(0,p))+"<b>"+esc(t.slice(p,p+q.length))+"</b>"+esc(t.slice(p+q.length)); };
  w.hidden=!L.length; vgkHl=-1;
  w.innerHTML=(q?"":`<div class="vgk-g">Zuletzt</div>`)+L.map(k=>`<button type="button" class="vgk-i" role="option" data-vgk="${esc(k.id)}"><span class="vgk-av">${icon("firma")}</span><span class="vgk-t"><span class="vgk-n">${mark(k.name)}</span><small>${esc([k.ort,k.tel].filter(Boolean).join(" · ")||"ohne Adresse")}</small></span></button>`).join("");
  if(h) h.innerHTML=ex?`${icon("firma")}<span>Bestandskunde${ex.ort?` · ${esc(ex.ort)}`:""}</span>`:q&&!L.length?`${icon("add")}<span>Neuer Kunde – wird mit dem Termin angelegt</span>`:"";
  if(h) h.classList.toggle("neu",!ex); }
function vgkNimm(id){ const k=DB.kunden.get(id), i=document.getElementById("f_vgKunde"); if(!k||!i) return; i.value=k.name; vgTelVorschlag(); vgkMalen(false);
  const n=document.getElementById("f_vgTel"); if(n&&!n.value) n.focus(); else { const a=document.getElementById("f_vgAnliegen"); if(a) a.focus(); } }
document.addEventListener("focusin",e=>{ if(e.target&&e.target.id==="f_vgKunde") vgkMalen(true); });
document.addEventListener("input",e=>{ if(e.target&&e.target.id==="f_vgKunde") vgkMalen(true); });
document.addEventListener("focusout",e=>{ if(e.target&&e.target.id==="f_vgKunde") setTimeout(()=>{ if(document.activeElement!==e.target) vgkMalen(false); },120); });
document.addEventListener("pointerdown",e=>{ if(e.target.closest&&e.target.closest("#vgkVl")) e.preventDefault(); },true);
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest("[data-vgk]"); if(!b) return; e.preventDefault(); e.stopPropagation(); vgkNimm(b.dataset.vgk); },true);
document.addEventListener("keydown",e=>{ if(!e.target||e.target.id!=="f_vgKunde") return; const w=document.getElementById("vgkVl"); if(!w||w.hidden) return; const B=[...w.querySelectorAll("[data-vgk]")]; if(!B.length) return;
  if(e.key==="ArrowDown"||e.key==="ArrowUp"){ e.preventDefault(); e.stopPropagation(); vgkHl=(vgkHl+(e.key==="ArrowDown"?1:-1)+B.length)%B.length; B.forEach((x,j)=>x.classList.toggle("hl",j===vgkHl)); }
  else if(e.key==="Enter"&&vgkHl>=0){ e.preventDefault(); e.stopPropagation(); vgkNimm(B[vgkHl].dataset.vgk); }
  else if(e.key==="Escape"){ e.preventDefault(); e.stopPropagation(); vgkMalen(false); } },true);
function vgTelVorschlag(){ const i=document.getElementById("f_vgKunde"), t=document.getElementById("f_vgTel"); if(!i||!t) return;
  const k=live("kunden").find(x=>x.name.toLowerCase()===i.value.trim().toLowerCase());
  if(!t.value.trim()||t.dataset.auto===t.value){ const n=(k&&k.tel)||""; t.value=n; t.dataset.auto=n; } }
["input","change"].forEach(ev=>document.addEventListener(ev,e=>{ if(e.target&&e.target.id==="f_vgKunde") vgTelVorschlag(); }));
document.addEventListener("change",e=>{ if(e.target&&e.target.id==="f_vgOrt"){ const w=document.getElementById("vgOrtNeuW"); if(w) w.hidden=e.target.value!=="__neu"; } });
/* Hinweis auf der Startseite */
function vgStartKarte(){ vgAbgleich(); const L=vgFilter("offen"); if(!L.length) return "";
  const buero=L.filter(v=>vgStufe(v)===1).length, ohne=L.filter(v=>vgStufe(v)===0).length, alt=L.filter(v=>vgAlter(v)).length;
  return `<button class="vg-start" data-act="nav" data-v="auftraege"><span class="vg-si">${icon("vgTafel")}</span><span class="vg-st"><b>${L.length} ${L.length===1?"offener Vorgang":"offene Vorgänge"}</b>
    <span>${[buero&&`${buero} warte${buero===1?"t":"n"} aufs Büro`,ohne&&`${ohne} Anruf${ohne===1?"":"e"} ohne Anfrage`,alt&&`${alt} liegen länger`].filter(Boolean).join(" · ")||"alles im Fluss"}</span></span>${icon("chev")}</button>`; }

/* Gedrückt halten (iPad) oder Rechtsklick (PC) auf eine Vorgangskarte: kleines Menü – Öffnen, Bearbeiten, Löschen.
   Löschen dürfen Büro/Chef und wer den Vorgang angelegt hat. */
const vgDarfLoeschen=v=>!!v&&(istBuero()||!!(v.createdBy&&String(v.createdBy.mail||"").toLowerCase()===String(ME.mail||"").toLowerCase()));
function vgMenu(v,x,y){ if(!v) return;
  kontextMenu(x,y,[{t:"Öffnen",ic:"chev",kurz:"Enter",fn:()=>vgOpen(v)},{t:"Bearbeiten",ic:"edit",fn:()=>vgDialog(v)},
    ...(vgDarfLoeschen(v)?["-",{t:"Löschen",ic:"del",gefahr:true,fn:()=>{ const b=document.createElement("button"); b.dataset.act="vgDelFrage"; b.dataset.id=v.id; document.body.appendChild(b); b.click(); b.remove(); }}]:[])]); }
let vgLp=null, vgLpZeit=0;
document.addEventListener("pointerdown",e=>{ const k=e.target.closest&&e.target.closest(".vg-l .vk[data-id],.vr[data-id]"); if(!k||e.pointerType==="mouse") return;
  const x=e.clientX, y=e.clientY; clearTimeout(vgLp&&vgLp.t);
  vgLp={x,y,t:setTimeout(()=>{ vgLpZeit=Date.now(); if(navigator.vibrate) try{ navigator.vibrate(10); }catch(_){} vgMenu(DB.vorgaenge.get(k.dataset.id),x,y); },480)}; });
const vgLpStop=()=>{ if(vgLp){ clearTimeout(vgLp.t); vgLp=null; } };
document.addEventListener("pointermove",e=>{ if(vgLp&&Math.hypot(e.clientX-vgLp.x,e.clientY-vgLp.y)>10) vgLpStop(); });
["pointerup","pointercancel","scroll"].forEach(t=>document.addEventListener(t,vgLpStop,true));
/* der Klick beim Loslassen soll weder die Karte öffnen noch das Menü gleich wieder schließen */
document.addEventListener("click",e=>{ if(Date.now()-vgLpZeit<500&&!(e.target.closest&&e.target.closest("#menu,#dlg"))){ e.stopPropagation(); e.preventDefault(); } },true);
document.addEventListener("contextmenu",e=>{ const k=e.target.closest&&e.target.closest(".vk[data-id],.vr[data-id]"); if(!k) return; e.preventDefault(); if(vgZ&&vgZ.an) return;
  if(Date.now()-vgLpZeit<1000||(vgLp&&e.pointerType&&e.pointerType!=="mouse")) return; vgLpStop(); vgMenu(DB.vorgaenge.get(k.dataset.id),e.clientX,e.clientY); });

/* ===== Karten ziehen (Maus sofort, Finger nach kurzem Halten) – Ablegen in der nächsten Spalte = nächster Schritt ===== */
let vgZ=null;
function vgZiehStart(z){ const r=z.el.getBoundingClientRect(), g=z.el.cloneNode(true); g.classList.add("vk-geist"); g.style.width=r.width+"px"; g.style.left=r.left+"px"; g.style.top=r.top+"px";
  document.body.appendChild(g); z.g=g; z.dx=z.x0-r.left; z.dy=z.y0-r.top; z.an=true; z.el.classList.add("zieht"); document.body.classList.add("vg-zieht");
  const v=DB.vorgaenge.get(z.id); document.querySelectorAll(".vs[data-i]").forEach(s=>{ const i=+s.dataset.i; s.classList.toggle("darf",!!v&&vgDarfNach(v,i)); s.classList.toggle("nein",!!v&&i!==Math.max(0,vgStufe(v))&&!vgDarfNach(v,i)); });
  try{ navigator.vibrate&&navigator.vibrate(8); }catch(_){} }
function vgZiehEnde(abbruch){ const z=vgZ; vgZ=null; if(!z) return; clearTimeout(z.t); if(!z.an) return;
  z.g&&z.g.remove(); z.el.classList.remove("zieht"); document.body.classList.remove("vg-zieht"); vgLpZeit=Date.now();
  const ziel=document.querySelector(".vs.ueber"); document.querySelectorAll(".vs").forEach(s=>s.classList.remove("darf","nein","ueber"));
  /* Finger gehalten, aber nicht bewegt ⇒ Menü wie beim Rechtsklick */
  if(!abbruch&&!z.maus&&!z.bewegt){ vgMenu(DB.vorgaenge.get(z.id),z.x0,z.y0); return; }
  if(abbruch||!ziel) return; const v=DB.vorgaenge.get(z.id), ti=+ziel.dataset.i; if(!v) return; const fi=Math.max(0,vgStufe(v)); if(ti===fi) return;
  if(!vgDarfNach(v,ti)){ toast(ti<fi?"Zurücknehmen darf nur das Büro":ti>fi+1?"Bitte Schritt für Schritt – immer in die nächste Spalte":ti===4?"Erledigt melden darf das Büro oder der Zuständige":"Diesen Schritt macht das Büro"); return; }
  if(ti<fi) vgKlick("vgZurueck",v.id,{k:VG_S[ti+1][0]}); else vgWeiter(v); }
document.addEventListener("pointerdown",e=>{ if(e.button>0) return; const el=e.target.closest&&e.target.closest(".vt .vk[data-id]"); if(!el||e.target.closest("button,a")) return;
  vgZ={el,id:el.dataset.id,x0:e.clientX,y0:e.clientY,pid:e.pointerId,maus:e.pointerType==="mouse",an:false};
  if(!vgZ.maus) vgZ.t=setTimeout(()=>{ if(vgZ&&!vgZ.an){ vgZiehStart(vgZ); vgZiehBewege(vgZ.x0,vgZ.y0); } },320); });
function vgZiehBewege(x,y){ const z=vgZ; if(!z||!z.g) return; z.g.style.left=(x-z.dx)+"px"; z.g.style.top=(y-z.dy)+"px";
  z.g.style.visibility="hidden"; const unter=document.elementFromPoint(x,y); z.g.style.visibility="";
  const s=unter&&unter.closest&&unter.closest(".vs[data-i]"); document.querySelectorAll(".vs.ueber").forEach(x=>{ if(x!==s) x.classList.remove("ueber"); }); if(s) s.classList.add("ueber");
  /* am Rand der Tafel waagerecht mitscrollen (iPad hochkant) */
  const t=document.querySelector(".vt"); if(t){ const r=t.getBoundingClientRect(); if(x>r.right-40) t.scrollLeft+=14; else if(x<r.left+40) t.scrollLeft-=14; } }
document.addEventListener("pointermove",e=>{ const z=vgZ; if(!z||e.pointerId!==z.pid) return; const d=Math.hypot(e.clientX-z.x0,e.clientY-z.y0);
  if(!z.an){ if(z.maus&&d>6){ vgZiehStart(z); } else if(!z.maus&&d>10){ clearTimeout(z.t); vgZ=null; return; } else return; }
  if(d>10) z.bewegt=true; e.preventDefault(); vgZiehBewege(e.clientX,e.clientY); },{passive:false});
document.addEventListener("pointerup",e=>{ if(vgZ&&e.pointerId===vgZ.pid) vgZiehEnde(false); });
document.addEventListener("pointercancel",()=>vgZiehEnde(true));
document.addEventListener("keydown",e=>{ if(e.key==="Escape"&&vgZ) vgZiehEnde(true);
  else if(e.key==="Escape"&&VG_MARK.size&&!VG_SEL&&nav.v==="auftraege"&&document.getElementById("dlg").hidden&&document.getElementById("menu").hidden){ VG_MARK.clear(); render(); }
  else if(e.key==="Escape"&&VG_SEL&&nav.v==="auftraege"&&document.getElementById("dlg").hidden&&document.getElementById("menu").hidden){ VG_SEL=null; render(); }
  else if(e.key==="Enter"&&e.target&&e.target.id==="f_vgNotiz"){ e.preventDefault(); vgKlick("vgNotizOk",VG_SEL); } });
/* Finger: Tafel soll beim Ziehen nicht scrollen */
document.addEventListener("touchmove",e=>{ if(vgZ&&vgZ.an) e.preventDefault(); },{passive:false});

/* ===== Baustellen-App: Zusatzwunsch vor Ort direkt ans Büro melden (mit Fotos) und „Meine Aufträge“ ===== */
const vgVonBau=v=>{ const b=v.vonBau&&DB.baustellen&&DB.baustellen.get(v.vonBau); return b&&!b.deleted?b:null; };
const vgZuBau=b=>live("vorgaenge").filter(v=>v.baustelleId===b.id||v.vonBau===b.id).sort((x,y)=>vgAt(y)-vgAt(x));
let VG_MF=[], vgMBau=null;
function vgMeldenDlg(b){ VG_MF.forEach(x=>URL.revokeObjectURL(x.url)); VG_MF=[]; vgMBau=b.id; vgE={id:null,dringend:false};
  const k=kundeOf(b.kundeId);
  dialog("Auftrag melden",`<p class="sup" style="margin:0 0 12px">${esc([k&&k.name,b.name].filter(Boolean).join(" · "))}</p><div class="fg1">
    ${ta("vgAnliegen","Was soll gemacht werden?","",{form:true,ph:"z. B. Kunde möchte zusätzlich eine Außensteckdose an der Terrasse"})}
    <div class="vg-drw"><span>Dringend</span>${seg("vgDring","nein",[["nein","Nein"],["ja","Ja"]])}</div></div>
    <div class="vg-mf-k"><span>Fotos</span></div><div class="vg-mf" id="vgMF"></div>
    <input type="file" id="vgMFotoIn" accept="image/*" capture="environment" multiple hidden>
    <p class="sup" style="margin:12px 0 0">Geht direkt als Anfrage ans Büro. Das Büro erteilt den Auftrag und plant den Termin.</p>`,
    `<button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="vgMeldenOk">Ans Büro melden</button>`);
  vgMFotosMalen(); setTimeout(()=>{ const t=document.getElementById("f_vgAnliegen"); if(t) t.focus(); },60); }
function vgMFotosMalen(){ const w=document.getElementById("vgMF"); if(!w) return;
  w.innerHTML=VG_MF.map((x,i)=>`<span class="vg-mf-b"><img src="${x.url}" alt=""><button type="button" data-act="vgMFotoWeg" data-i="${i}" aria-label="Foto entfernen" title="Foto entfernen">${icon("close")}</button></span>`).join("")
    +(VG_MF.length<8?`<button type="button" class="vg-mf-neu" data-act="vgMFoto" aria-label="Foto aufnehmen" title="Foto aufnehmen">${icon("cam")}</button>`:""); }
document.addEventListener("change",e=>{ if(!e.target||e.target.id!=="vgMFotoIn") return; [...e.target.files].slice(0,8-VG_MF.length).forEach(f=>VG_MF.push({f,url:URL.createObjectURL(f)})); e.target.value=""; vgMFotosMalen(); });
async function vgMeldenOk(){ const F=formVals(), t=String(F.vgAnliegen||"").trim(), b=DB.baustellen.get(vgMBau); if(!b) return;
  if(!t&&!VG_MF.length){ toast("Bitte kurz beschreiben, was gemacht werden soll"); return; }
  const k=kundeOf(b.kundeId), jetzt=Date.now(), dm=b.demo?{demo:true}:{};
  const v=Object.assign({id:uid(),s:{anruf:{wer:who(),at:jetzt,vorOrt:true},anfrage:{wer:who(),at:jetzt}},kundeId:k?k.id:"",kundeName:k?"":b.name,tel:(k&&k.tel)||"",anliegen:t||"Siehe Fotos",dringend:!!(vgE&&vgE.dringend),vonBau:b.id},dm);
  saveRec("vorgaenge",v,true); const L=VG_MF; VG_MF=[]; closeOverlays();
  let n=0; for(const x of L){ if(typeof dateiNeu==="function"&&await dateiNeu("vorgaenge",v.id,x.f,b.demo?{demo:true}:null)) n++; URL.revokeObjectURL(x.url); }
  render(); toast(n?`Ans Büro gemeldet – mit ${n} Foto${n>1?"s":""}`:"Ans Büro gemeldet","Öffnen",()=>vgOpen(v)); }
/* Abschnitt an der Baustelle: zugehörige Aufträge + „melden“ */
function vgBauAbschnitt(b){ const L=vgZuBau(b);
  return `<div class="sec-row"><div class="sec-lbl">Aufträge</div><button class="plus-k" data-act="vgMelden" data-id="${esc(b.id)}" aria-label="Auftrag ans Büro melden" title="Auftrag ans Büro melden">${icon("add")}</button></div>
    ${L.length?`<div class="vg-l">${L.map(v=>vgKarte(v,true)).join("")}</div>`:`<p class="meta">Will der Kunde noch etwas zusätzlich? Mit + direkt ans Büro melden – gern mit Foto.</p>`}`; }
/* „Meine Aufträge“: mir zugewiesen oder ich fahre zum Termin hin – solange nicht erledigt */
function vgMeine(){ const n=String(ME.name||"").trim();
  return vgAlle().filter(v=>!vgZu(v)&&(vgZustIch(v)||(n&&v.s&&v.s.termin&&String(v.s.termin.mit||"").split(/\s*,\s*/).includes(n)))); }
function vgMeineKarte(){ const L=vgMeine(); if(!L.length) return "";
  return `<div class="vg-meine"><div class="sec-row" style="margin-top:0"><div class="sec-lbl">Meine Aufträge · ${L.length}</div>${L.length>3?`<button class="btn-text" data-act="vgAlleMeine">Alle</button>`:""}</div>
    <div class="vg-l">${L.slice(0,3).map(v=>vgKarte(v,true)).join("")}</div></div>`; }
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act="vgAlleMeine"]'); if(!b) return; e.stopPropagation();
  META.vgAnsicht="liste"; META.vgF="offen"; META.f=Object.assign({},META.f||{},{"vg.wer":"zust"}); metaSave(); go({v:"auftraege"}); },true);

/* ===== Büro-Tabelle (PC): eine Zeile je Auftrag, eine Spalte je Schritt; Kennzahlen, Sortieren, direkt bearbeiten, mehrere markieren ===== */
Object.assign(IC,{vgTabelle:"M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM8 20H4v-4h4v4zm0-6H4v-4h4v4zm0-6H4V4h4v4zm6 12h-4v-4h4v4zm0-6h-4v-4h4v4zm0-6h-4V4h4v4zm6 12h-4v-4h4v4zm0-6h-4v-4h4v4zm0-6h-4V4h4v4z",vgSort:"M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z"});
const VG_MARK=new Set();
VG_PC.addEventListener?.("change",()=>{ if(typeof nav!=="undefined"&&nav.v==="auftraege") render(); });
const vgSchrittAt=v=>{ const i=vgStufe(v); return i<0?vgAt(v):((v.s[VG_S[i][0]]||{}).at||vgAt(v)); };
/* Kalenderwoche Mo–So */
function vgWocheGrenzen(){ const d=new Date(); d.setHours(12,0,0,0); const mo=new Date(d-((d.getDay()+6)%7)*864e5), so=new Date(+mo+6*864e5), f=x=>x.toISOString().slice(0,10); return [f(mo),f(so)]; }
const vgWoche=v=>{ const d=v.s&&v.s.termin&&v.s.termin.datum; if(!d||vgZu(v)) return false; const [a,b]=vgWocheGrenzen(); return d>=a&&d<=b; };
const VG_K=[["offen","Offen"],["buero","Beim Büro"],["haengt","Hängen"],["woche","Diese Woche geplant"]];
const vgKAkt=()=>META.vgK||"offen";
function vgKListe(k){ const L=vgAlle();
  return k==="buero"?L.filter(v=>!vgZu(v)&&vgStufe(v)===1):k==="haengt"?L.filter(v=>!vgZu(v)&&vgAlter(v)):k==="woche"?L.filter(vgWoche)
    :k==="erledigt"?L.filter(v=>!!((v.s&&v.s.ausgefuehrt)||v.erledigt)&&!v.abgelehnt):k==="abgelehnt"?L.filter(v=>!!v.abgelehnt):L.filter(v=>!vgZu(v)); }
function vgKennzahlen(){ const k=vgKAkt();
  return `<div class="vkz">${VG_K.map(([id,t])=>{ const n=vgKListe(id).length;
    return `<button class="vkz-k${id==="haengt"&&n?" warn":""}" data-act="vgK" data-v="${id}" aria-pressed="${k===id}"><b>${n}</b><span>${esc(t)}</span></button>`; }).join("")}</div>`; }
const vgKurzDat=t=>t?new Date(t).toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit"}):"";
function vgTZelle(v,i){ const k=VG_S[i][0], s=v.s&&v.s[k], st=vgStufe(v), id=esc(v.id), bu=istBuero(), wer=x=>esc(vgVorn(x&&x.wer&&x.wer.name)||"–");
  if(s){ let l1=esc(vgZeit(s.at)), l2=wer(s)+(k==="anruf"&&s.vorOrt?" · vor Ort":"");
    if(k==="auftrag"){ l1=s.nr?(bu?`<button class="vt-ed" data-act="vgNrEd" data-id="${id}" title="SCC-Nr. ändern">SCC ${esc(s.nr)}</button>`:`SCC ${esc(s.nr)}`):(bu?`<button class="vt-ed leer" data-act="vgNrEd" data-id="${id}">+ SCC-Nr.</button>`:"ohne SCC-Nr."); l2=`${wer(s)} · ${esc(vgKurzDat(s.at))}`; }
    if(k==="termin"){ const d=s.datum?new Date(s.datum+"T12:00").toLocaleDateString("de-DE",{weekday:"short",day:"2-digit",month:"2-digit"}):"ohne Datum";
      l1=bu&&!vgZu(v)?`<button class="vt-ed" data-act="vgTerminEd" data-id="${id}" title="Termin ändern">${d}</button>`:d; l2=[s.zeit?esc(s.zeit):"",esc(s.mit||"")].filter(Boolean).join(" · ")||wer(s); }
    return `<div class="vt-z ok s${i}"><span class="vt-1">${l1}</span><span class="vt-2">${l2}</span></div>`; }
  if(v.abgelehnt&&i===st+1) return `<div class="vt-z bad"><span class="vt-1">Abgelehnt</span><span class="vt-2">${esc(vgVorn(v.abgelehnt.wer&&v.abgelehnt.wer.name)||"")}${v.abgelehnt.grund?` · ${esc(v.abgelehnt.grund)}`:""}</span></div>`;
  if(i===st+1&&!vgZu(v)) return vgDarfNach(v,i)?`<button class="vt-z next" data-act="vgWeiter" data-id="${id}" title="${esc(VG_NEXT_T[st])}">${icon("add")}<span>${esc(["Ans Büro","Erteilen","Termin","Erledigt"][st])}</span></button>`
    :`<div class="vt-z warte"><span class="vt-1">${st===1?"Wartet aufs Büro":"Macht das Büro"}</span></div>`;
  return `<div class="vt-z leer"></div>`; }
function vgTZeile(v){ const a=vgAlter(v), ZL=vgZustL(v), z=ZL[0], m=VG_MARK.has(v.id), id=esc(v.id), tel=v.tel;
  return `<div class="vr${v.dringend?" dr":""}${VG_SEL===v.id?" an":""}${m?" mark":""}${v.abgelehnt?" abgl":""}" data-act="vgSel" data-id="${id}" role="button" tabindex="0">
    <button class="vr-m" data-act="vgMark" data-id="${id}" role="checkbox" aria-checked="${m}" aria-label="Markieren"><i></i></button>
    <div class="vr-k"><span class="vr-n"><b>${esc(vgKunde(v))}</b>${v.dringend?`<span class="vk-dr">dringend</span>`:""}</span>${v.anliegen?`<span class="vr-a">${esc(v.anliegen)}</span>`:""}${tel?`<span class="vr-t">${icon("phone")}${esc(tel)}</span>`:""}</div>
    ${VG_T.map((t,i)=>vgTZelle(v,i)).join("")}
    <div class="vr-z">${vgDarfZust(v)?`<button class="vr-zb${z?"":" leer"}" data-act="vgZustPick" data-id="${id}" title="Zuständig ändern">`:`<span class="vr-zb${z?"":" leer"}">`}${z?`<span class="vk-p${vgIstIch(z)?" ich":""}">${esc(initials(z.name||"?"))}</span><span class="vr-zn" title="${esc(vgZustNamen(v).join(", "))}">${esc(ZL.length>1?`${z.name||""} +${ZL.length-1}`:(z.name||""))}</span>`:`<span class="vr-zn">${vgDarfZust(v)?"Zuweisen":"–"}</span>`}${vgDarfZust(v)?"</button>":"</span>"}</div>
    <div class="vr-s">${a?`<span class="vr-alt ${a.kl}">${esc(a.txt.replace(/^seit /,""))}</span>`:`<span class="vr-ok">${esc(vgSeitKurz(vgSchrittAt(v)))}</span>`}</div></div>`; }
function vgSeitKurz(t){ const h=(Date.now()-t)/36e5; return h<1?"gerade":h<24?`${Math.floor(h)} Std.`:`${Math.floor(h/24)} Tag${Math.floor(h/24)>1?"e":""}`; }
function vgTabelle(L){ const so=fW("vg","sort"), sk=(k,t,cls)=>`<button class="vr-h${so===k?" an":""}${cls?" "+cls:""}" data-act="vgSort" data-v="${k}" title="Sortieren">${t}${so===k?icon("vgSort"):""}</button>`;
  const ids=L.map(v=>v.id), alle=ids.length&&ids.every(i=>VG_MARK.has(i)), teil=!alle&&ids.some(i=>VG_MARK.has(i));
  const kopf=`<div class="vr-kopf"><button class="vr-m" data-act="vgMarkAlle" role="checkbox" aria-checked="${alle?"true":teil?"mixed":"false"}" aria-label="Alle markieren"><i></i></button>
    ${sk("az","Kunde")}${VG_T.map((t,i)=>i===0?sk("neu",`<i class="vr-d s0"></i>${t}`):i===3?sk("termin",`<i class="vr-d s3"></i>${t}`):`<span class="vr-h"><i class="vr-d s${i}"></i>${t}</span>`).join("")}${sk("zust","Zuständig","zu")}${sk("seit","Seit","re")}</div>`;
  if(!L.length) return `<div class="vr-tab">${kopf}</div><p class="meta" style="margin:16px 4px">${query?`Nichts gefunden für „${esc(query)}“.`:"Keine Aufträge in dieser Auswahl."}</p>`;
  return `<div class="vr-tab${VG_MARK.size?" markiert":""}">${kopf}${L.map(vgTZeile).join("")}</div>`; }
const vgMarkiert=()=>[...VG_MARK].map(i=>DB.vorgaenge.get(i)).filter(v=>v&&!v.deleted);
function vgMarkAufraeumen(){ [...VG_MARK].forEach(i=>{ const v=DB.vorgaenge.get(i); if(!v||v.deleted) VG_MARK.delete(i); }); }
function vgLeiste(){ const M=vgMarkiert(); if(!M.length) return "";
  const nz=M.filter(vgDarfZust).length, nb=M.filter(x=>!vgZu(x)&&vgStufe(x)===0).length, nd=M.filter(vgDarfLoeschen).length;
  return `<div class="vg-bar" role="toolbar" aria-label="Markierte Aufträge"><button class="vg-bar-x" data-act="vgMarkWeg" aria-label="Markierung aufheben" title="Markierung aufheben">${icon("close")}</button><b>${M.length} markiert</b><span class="vg-bar-sp"></span>
    ${nz?`<button class="vg-bar-b" data-act="vgMarkZust">${icon("person")}<span>Zuweisen</span></button>`:""}${nb?`<button class="vg-bar-b" data-act="vgMarkBuero">${icon("send")}<span>Ans Büro geben${nb<M.length?` (${nb})`:""}</span></button>`:""}
    ${nd?`<button class="vg-bar-b gefahr" data-act="vgMarkDel">${icon("del")}<span>Löschen${nd<M.length?` (${nd})`:""}</span></button>`:""}</div>`; }
/* m = null: niemand mehr zuständig; sonst Person dazunehmen bzw. – wenn schon dabei – herausnehmen */
function vgZustSetzen(v,m,still){ if(!vgDarfZust(v)) return; let L=vgZustL(v).slice(), weg=false;
  if(!m) L=[]; else if(vgZustHat(v,m.mail)){ L=L.filter(p=>String(p.mail||"").toLowerCase()!==String(m.mail).toLowerCase()); weg=true; } else L.push({mail:m.mail,name:m.name,at:Date.now(),von:who()});
  vgZustSchreiben(v,L);
  if(!still) toast(!m?"Zuständigkeit entfernt":weg?`${vgIstIch(m)?"Du bist":m.name+" ist"} nicht mehr zuständig`:vgIstIch(m)?"Du bist jetzt zuständig":`${m.name} ist jetzt zuständig – bekommt eine Benachrichtigung`); }
/* direkt in der Zelle bearbeiten: Enter speichert, Esc bricht ab, Klick daneben speichert */
let vgInl=null;
function vgInline(b,html){ if(vgInl) return; const w=document.createElement("span"); w.className="vt-inl"; w.innerHTML=html; b.replaceWith(w); vgInl={w}; const i=w.querySelector("input"); i.focus(); if(i.select&&i.type!=="date") i.select();
  w.addEventListener("click",e=>e.stopPropagation());
  w.addEventListener("keydown",e=>{ if(e.key==="Enter"){ e.preventDefault(); vgInlineFertig(true); } else if(e.key==="Escape"){ e.preventDefault(); e.stopPropagation(); vgInlineFertig(false); } });
  w.addEventListener("focusout",e=>{ if(!w.contains(e.relatedTarget)) setTimeout(()=>{ if(vgInl&&vgInl.w===w&&!w.contains(document.activeElement)) vgInlineFertig(true); },0); }); }
function vgInlineFertig(ok){ const z=vgInl; vgInl=null; if(!z) return;
  if(ok){ const nr=z.w.querySelector("#vgNrIn"), td=z.w.querySelector("#vgTdIn");
    if(nr){ const v=DB.vorgaenge.get(nr.dataset.id), x=nr.value.trim(); if(v&&v.s.auftrag&&(v.s.auftrag.nr||"")!==x){ v.s.auftrag.nr=x; const b=vgBau(v); if(b&&x){ b.auftragsnr=x; saveRec("baustellen",b); } saveRec("vorgaenge",v); toast(x?"SCC-Nr. gespeichert":"SCC-Nr. entfernt"); } }
    if(td){ const v=DB.vorgaenge.get(td.parentElement.dataset.id), d=td.value, zt=z.w.querySelector("#vgTzIn").value.trim();
      if(v&&v.s.termin&&d&&(d!==v.s.termin.datum||zt!==(v.s.termin.zeit||""))){ v.s.termin.datum=d; v.s.termin.zeit=zt; const b=vgBau(v); if(b){ b.termin=Object.assign({},b.termin||{},{datum:d,zeit:zt}); saveRec("baustellen",b); } saveRec("vorgaenge",v); toast("Termin geändert"); } } }
  render(); }
