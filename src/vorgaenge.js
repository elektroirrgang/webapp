/* Aufträge (Vorgänge): Anruf → Anfrage → Auftrag → Termin.
   Schließt die Lücke vor SCC-CONTROL: Anrufe sofort festhalten, Anfrage ans Büro, Büro erteilt den Auftrag
   (SCC-Auftragsnummer), Termin eintragen. Anfrage darf jeder stellen, Auftrag nur das Büro (Admins). */
const VG_S=[["anruf","Anruf"],["anfrage","Anfrage"],["auftrag","Auftrag"],["termin","Termin"]];
const VG_F=[["offen","Offen"],["buero","Wartet aufs Büro"],["termin","Ohne Termin"],["erledigt","Erledigt"],["abgelehnt","Abgelehnt"]];
const istBuero=()=>!!ME.admin;
const vgStufe=v=>{ let n=-1; VG_S.forEach(([k],i)=>{ if(v.s&&v.s[k]) n=i; }); return n; };
const vgZu=v=>!!(v.erledigt||v.abgelehnt);
const vgAlle=()=>live("vorgaenge").sort((a,b)=>(!!a.dringend===!!b.dringend?0:a.dringend?-1:1)||((b.s&&b.s.anruf&&b.s.anruf.at)||0)-((a.s&&a.s.anruf&&a.s.anruf.at)||0));
const vgKunde=v=>v.kundeId&&kundeOf(v.kundeId)?kundeOf(v.kundeId).name:(v.kundeName||"Ohne Namen");
const vgZeit=t=>{ if(!t) return ""; const d=new Date(t), h=new Date(); const tag=d.toDateString()===h.toDateString()?"heute":new Date(h-864e5).toDateString()===d.toDateString()?"gestern":d.toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit"}); return `${tag}, ${d.toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"})}`; };
const vgVorn=n=>String(n||"").trim();
/* wie lange hängt der Vorgang schon im aktuellen Schritt? */
function vgAlter(v){ if(vgZu(v)) return null; const i=vgStufe(v); if(i<0) return null; const k=VG_S[i][0], seit=v.s[k].at||0, std=(Date.now()-seit)/36e5;
  const grenze=[24,48,72,null][i]; if(i===3){ const d=v.s.termin&&v.s.termin.datum; if(d&&d<today()) return {txt:"Termin vorbei – abschließen?",kl:"wip"}; return null; }
  if(std<grenze) return null; const tage=Math.floor(std/24); return {txt:tage>=1?`seit ${tage} Tag${tage>1?"en":""}`:`seit ${Math.floor(std)} Std.`,kl:std>grenze*2?"bad":"wip"}; }
function vgFilter(f){ return vgAlle().filter(v=>f==="erledigt"?!!v.erledigt:f==="abgelehnt"?!!v.abgelehnt:f==="buero"?!vgZu(v)&&vgStufe(v)===1:f==="termin"?!vgZu(v)&&vgStufe(v)===2:!vgZu(v)); }
function vgNaechster(v){ const i=vgStufe(v); if(vgZu(v)) return null;
  if(i===0) return {act:"vgAnfrage",t:"Anfrage ans Büro"};
  if(i===1) return istBuero()?{act:"vgAuftrag",t:"Auftrag erteilen"}:{warte:"wartet aufs Büro"};
  if(i===2) return {act:"vgTermin",t:"Termin eintragen"};
  return {act:"vgErledigt",t:"Abschließen"}; }
function vgZelle(v,k,i){ const s=v.s&&v.s[k], st=vgStufe(v);
  if(s){ const extra=k==="auftrag"&&s.nr?`<em>SCC ${esc(s.nr)}</em>`:k==="termin"&&s.datum?`<em>${esc(deDate(s.datum))}${s.zeit?` · ${esc(s.zeit)} Uhr`:""}${s.mit?` · ${esc(s.mit)}`:""}</em>`:"";
    return `<div class="vg-z ok"><span class="vg-zk"><i class="vg-dot ok"></i>${esc(VG_S[i][1])}</span><span class="vg-zw"><span class="vg-wer">${esc(vgVorn(s.wer&&s.wer.name)||"–")} · </span>${esc(vgZeit(s.at))}</span>${extra}</div>`; }
  if(i===st+1&&!vgZu(v)){ const n=vgNaechster(v); if(n&&n.act) return `<button class="vg-z next" data-act="${n.act}" data-id="${esc(v.id)}"><span class="vg-zk"><i class="vg-dot nx"></i>${esc(VG_S[i][1])}</span><span class="vg-nt">${icon("add")}<span>${esc(n.t)}</span></span><span class="vg-zw vg-nm">offen</span></button>`;
    if(n&&n.warte) return `<div class="vg-z warte"><span class="vg-zk"><i class="vg-dot warte"></i>${esc(VG_S[i][1])}</span><span class="vg-zw">${esc(n.warte)}</span></div>`; }
  return `<div class="vg-z leer"><span class="vg-zk"><i class="vg-dot"></i>${esc(VG_S[i][1])}</span></div>`; }
function vgKopf(v){ const a=vgAlter(v);
  return `<button class="vg-k" data-act="vgOpen" data-id="${esc(v.id)}"><span class="vg-kn">${v.dringend?`<i class="vg-dr">dringend</i>`:""}${esc(vgKunde(v))}</span><span class="vg-ka">${esc(v.anliegen||"")}</span>
    <span class="vg-kf">${v.tel?`<span>${icon("phone")}${esc(v.tel)}</span>`:""}${a?pill(a.kl,a.txt):""}${v.erledigt?pill("ok","erledigt"):v.abgelehnt?pill("bad","abgelehnt"):""}</span></button>`; }
function vgZeile(v){ return `<div class="vg-row${v.dringend?" dr":""}">${vgKopf(v)}${VG_S.map(([k],i)=>vgZelle(v,k,i)).join("")}${vgZu(v)?"":`<div class="vg-mob">${(()=>{ const n=vgNaechster(v); return n&&n.act?`<button class="btn-tonal" data-act="${n.act}" data-id="${esc(v.id)}">${icon("add")}${esc(n.t)}</button>`:n&&n.warte?`<span class="meta">${esc(n.warte)}</span>`:""; })()}</div>`}</div>`; }
function vorgaengeView(){
  const f=META.vgF||"offen", L=vgFilter(f), n=x=>vgFilter(x).length;
  const chips=`<div class="chips filt vg-chips">${VG_F.map(([k,t])=>`<button class="chip" data-act="vgFilter" data-v="${k}" aria-pressed="${f===k}">${icon("check")}${esc(t)}${k==="erledigt"||k==="abgelehnt"?"":` (${n(k)})`}</button>`).join("")}</div>`;
  if(!live("vorgaenge").length) return `<div class="narrow vg">${chips}<div class="empty">${icon("board")}<h2>Noch keine Aufträge</h2><p>Kommt ein Anruf rein: unten auf „Anruf“ tippen, Kunde und Anliegen eintragen – fertig. Danach rückt der Vorgang Schritt für Schritt weiter: Anfrage ans Büro, Auftrag, Termin.</p></div></div>`;
  return `<div class="narrow vg">${chips}<div class="vg-tab"><div class="vg-th"><span>Kunde und Anliegen</span>${VG_S.map(([,t])=>`<span>${t}</span>`).join("")}</div>
    ${L.length?L.map(vgZeile).join(""):`<p class="meta" style="margin:16px 4px">Keine Vorgänge in dieser Auswahl.</p>`}</div>
    <p class="hint">Anfrage stellen darf jeder. Den Auftrag erteilt das Büro und trägt dabei die Auftragsnummer aus SCC ein.</p></div>`; }
/* Erfassen / Bearbeiten */
let vgE=null;
function vgDialog(v){ vgE=v?JSON.parse(JSON.stringify(v)):{id:null,kundeName:"",tel:"",anliegen:"",dringend:false};
  const namen=live("kunden").map(k=>k.name);
  dialog(v?"Vorgang bearbeiten":"Anruf erfassen",`<div class="fg1">
    ${tf("vgKunde","Kunde",v?vgKunde(v):"",{form:true,list:"dl-vgk",ph:"Name oder Firma"})}${datalist("dl-vgk",namen)}
    ${tf("vgTel","Telefon (Rückruf)",vgE.tel||"",{form:true,im:"tel",ph:"z. B. 0171 …"})}
    ${ta("vgAnliegen","Was möchte der Kunde?",vgE.anliegen||"",{form:true,ph:"z. B. Steckdose im Bad ohne Funktion"})}
    <div class="vg-drw"><span>Dringend</span>${seg("vgDring",vgE.dringend?"ja":"nein",[["nein","Nein"],["ja","Ja"]])}</div></div>`,
    `${v&&(istBuero()||(v.createdBy&&v.createdBy.mail===ME.mail))?`<button class="btn-text danger" data-act="vgDel" data-id="${esc(v.id)}">Löschen</button><span style="flex:1"></span>`:""}<button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="vgSpeichern">${v?"Speichern":"Anruf festhalten"}</button>`); }
function vgSpeichern(){ const F=formVals(); if(!F.vgKunde&&!F.vgAnliegen){ toast("Bitte Kunde oder Anliegen eintragen"); return; }
  const k=live("kunden").find(x=>x.name.toLowerCase()===String(F.vgKunde||"").toLowerCase());
  const neu=!vgE.id, v=neu?{id:uid(),s:{anruf:{wer:who(),at:Date.now()}}}:DB.vorgaenge.get(vgE.id);
  Object.assign(v,{kundeId:k?k.id:"",kundeName:k?"":F.vgKunde,tel:F.vgTel,anliegen:F.vgAnliegen,dringend:!!vgE.dringend});
  if(neu&&k&&k.demo) v.demo=true; if(!F.vgTel&&k&&k.tel&&neu) v.tel=k.tel;
  saveRec("vorgaenge",v,neu); closeOverlays(); render(); toast(neu?"Anruf festgehalten":"Gespeichert",neu?"Anfrage ans Büro":null,neu?()=>vgSchritt(v.id,"anfrage"):null); }
function vgSchritt(id,k,extra={}){ const v=DB.vorgaenge.get(id); if(!v) return; v.s=v.s||{}; v.s[k]=Object.assign({wer:who(),at:Date.now()},extra); saveRec("vorgaenge",v); closeOverlays(); render();
  toast(k==="anfrage"?"Anfrage ans Büro gestellt":k==="auftrag"?"Auftrag erteilt":k==="termin"?"Termin eingetragen":"Gespeichert"); }
function vgOpen(v){ const n=vgNaechster(v);
  const verlauf=VG_S.filter(([k])=>v.s&&v.s[k]).map(([k,t])=>{ const s=v.s[k]; return `<div class="vg-vl"><i class="vg-dot ok"></i><b>${t}</b><span>${esc((s.wer&&s.wer.name)||"–")} · ${esc(vgZeit(s.at))}${k==="auftrag"&&s.nr?` · SCC ${esc(s.nr)}`:""}${k==="termin"&&s.datum?` · ${esc(deDate(s.datum))}${s.zeit?` ${esc(s.zeit)} Uhr`:""}${s.mit?` · ${esc(s.mit)}`:""}`:""}</span></div>`; }).join("")
    +(v.abgelehnt?`<div class="vg-vl"><i class="vg-dot bad"></i><b>Abgelehnt</b><span>${esc(v.abgelehnt.wer&&v.abgelehnt.wer.name||"–")} · ${esc(vgZeit(v.abgelehnt.at))}${v.abgelehnt.grund?` · ${esc(v.abgelehnt.grund)}`:""}</span></div>`:"")
    +(v.erledigt?`<div class="vg-vl"><i class="vg-dot ok"></i><b>Erledigt</b><span>${esc(v.erledigt.wer&&v.erledigt.wer.name||"–")} · ${esc(vgZeit(v.erledigt.at))}</span></div>`:"");
  const k=v.kundeId&&kundeOf(v.kundeId);
  dialog(vgKunde(v),`<div class="vg-dlg">${v.dringend?`<span class="vg-dr">dringend</span>`:""}<p class="vg-an">${esc(v.anliegen||"–")}</p>
      ${v.tel?`<a class="vg-tel" href="tel:${esc(v.tel.replace(/[^\d+]/g,""))}">${icon("phone")}${esc(v.tel)}</a>`:""}
      ${!k&&v.kundeName?`<p class="sup">Noch kein Kunde in der Kundendatenbank.</p>`:""}
      <div class="vg-vlauf">${verlauf}</div></div>`,
    `<button class="btn-text" data-act="vgEdit" data-id="${esc(v.id)}">Bearbeiten</button>${!vgZu(v)&&istBuero()&&vgStufe(v)>=1&&vgStufe(v)<3?`<button class="btn-text danger" data-act="vgAblehnen" data-id="${esc(v.id)}">Ablehnen</button>`:""}<span style="flex:1"></span>
     ${n&&n.act?`<button class="btn-text" data-act="${n.act}" data-id="${esc(v.id)}">${esc(n.t)}</button>`:`<button class="btn-text" data-act="cancel">Schließen</button>`}`); }
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act^="vg"]'); if(!b) return; const a=b.dataset.act, id=b.dataset.id, v=id&&DB.vorgaenge.get(id);
  if(a==="vgDring"){ e.stopPropagation(); if(vgE) vgE.dringend=b.dataset.v==="ja"; b.parentElement.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",x===b)); if(typeof segInd==="function") segInd(); return; }
  e.stopPropagation(); e.preventDefault();
  if(a==="vgNeu") vgDialog(null);
  else if(a==="vgSpeichern") vgSpeichern();
  else if(a==="vgFilter"){ META.vgF=b.dataset.v; metaSave(); render(); }
  else if(a==="vgOpen"&&v) vgOpen(v);
  else if(a==="vgEdit"&&v){ closeOverlays(); vgDialog(v); }
  else if(a==="vgAnfrage"&&v) vgSchritt(id,"anfrage");
  else if(a==="vgAuftrag"&&v){ if(!istBuero()){ toast("Den Auftrag erteilt das Büro"); return; }
    dialog("Auftrag erteilen",`<p class="sup" style="margin:0 0 12px">${esc(vgKunde(v))} – ${esc(v.anliegen||"")}</p><div class="fg1">${tf("vgNr","Auftragsnummer aus SCC (optional)","",{form:true,ph:"z. B. 2610-150"})}</div>`,
      `<button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="vgAuftragOk" data-id="${esc(id)}">Auftrag erteilen</button>`); }
  else if(a==="vgAuftragOk"&&v){ vgSchritt(id,"auftrag",{nr:formVals().vgNr||""}); }
  else if(a==="vgTermin"&&v){ dialog("Termin eintragen",`<p class="sup" style="margin:0 0 12px">${esc(vgKunde(v))} – ${esc(v.anliegen||"")}</p><div class="fg1">
      ${tf("vgDatum","Datum",today(),{form:true,type:"date"})}${tf("vgZeitE","Uhrzeit",(v.s.termin&&v.s.termin.zeit)||"",{form:true,ph:"z. B. 8:00"})}${tf("vgMit","Wer fährt hin? (optional)","",{form:true,list:"dl-vgm",ph:"Name"})}${datalist("dl-vgm",team().map(m=>m.name))}</div>`,
      `<button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="vgTerminOk" data-id="${esc(id)}">Eintragen</button>`); }
  else if(a==="vgTerminOk"&&v){ const F=formVals(); if(!F.vgDatum){ toast("Bitte ein Datum wählen"); return; } vgSchritt(id,"termin",{datum:F.vgDatum,zeit:F.vgZeitE,mit:F.vgMit}); }
  else if(a==="vgErledigt"&&v){ v.erledigt={wer:who(),at:Date.now()}; saveRec("vorgaenge",v); closeOverlays(); render(); toast("Vorgang abgeschlossen","Rückgängig",()=>{ delete v.erledigt; saveRec("vorgaenge",v); render(); }); }
  else if(a==="vgAblehnen"&&v){ dialog("Anfrage ablehnen",`<div class="fg1">${tf("vgGrund","Grund (optional)","",{form:true,ph:"z. B. machen wir nicht, an Kollegen verwiesen"})}</div>`,
      `<button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text danger" data-act="vgAblehnenOk" data-id="${esc(id)}">Ablehnen</button>`); }
  else if(a==="vgAblehnenOk"&&v){ v.abgelehnt={wer:who(),at:Date.now(),grund:formVals().vgGrund||""}; saveRec("vorgaenge",v); closeOverlays(); render(); toast("Anfrage abgelehnt"); }
  else if(a==="vgDel"&&v){ v.deleted=true; saveRec("vorgaenge",v); closeOverlays(); render(); toast("Vorgang gelöscht","Rückgängig",()=>{ delete v.deleted; saveRec("vorgaenge",v); render(); }); }
},true);
/* Hinweis auf der Startseite */
function vgStartKarte(){ const L=vgFilter("offen"); if(!L.length) return "";
  const buero=L.filter(v=>vgStufe(v)===1).length, ohne=L.filter(v=>vgStufe(v)===0).length, alt=L.filter(v=>vgAlter(v)).length;
  return `<button class="vg-start" data-act="nav" data-v="auftraege"><span class="vg-si">${icon("board")}</span><span class="vg-st"><b>${L.length} ${L.length===1?"offener Vorgang":"offene Vorgänge"}</b>
    <span>${[buero&&`${buero} warte${buero===1?"t":"n"} aufs Büro`,ohne&&`${ohne} Anruf${ohne===1?"":"e"} ohne Anfrage`,alt&&`${alt} liegen länger`].filter(Boolean).join(" · ")||"alles im Fluss"}</span></span>${icon("chev")}</button>`; }
