/* ===== Wünsche und Feedback (alle Apps) =====
   Jeder sieht alle Einträge mit Namen, kann eigene eintragen und bei fremden „Ich auch“ sagen.
   Der Entwickler pflegt Status und Antwort und fasst Doppelte zusammen (der jüngere wird Teil des älteren:
   Text, Absender und Stimmen wandern mit, der jüngere verschwindet aus der Liste).
   Datensatz „wuensche“: {id,art:"wunsch"|"fehler"|"lob",app,titel,text,von,stimmen:[{mail,name,at}],status,statusAm,statusVon,
                          antwort,zusammen:[{id,titel,text,von,at}],inId (zusammengefasst in)} */
const WU_ART=[["wunsch","Wunsch"],["fehler","Fehler"],["lob","Lob"]];
const WU_ST=[["neu","Neu"],["geplant","Geplant"],["arbeit","In Arbeit"],["fertig","Umgesetzt"],["nein","Abgelehnt"]];
const WU_ST_PILL={neu:"open",geplant:"wip",arbeit:"wip",fertig:"ok",nein:"bad"};
const WU_APPS=[["uebersicht","Übersicht"],["baustelle","Baustelle"],["evse","EVSE"],["echeck","E-Check"],["alle","Alle Apps"]];
const WU_F=[["offen","Offen"],["fertig","Umgesetzt"],["nein","Abgelehnt"],["alle","Alle"]];
const wuApp=()=>{ const p=location.pathname; return /\/evse\//.test(p)?"evse":/\/baustelle\//.test(p)?"baustelle":/\/echeck\//.test(p)?"echeck":"uebersicht"; };
const wuDev=()=>typeof istEntwickler==="function"&&istEntwickler();
const wuIch=x=>!!x&&!!ME.mail&&String(x.mail||"").toLowerCase()===String(ME.mail).toLowerCase();
const wuAlle=()=>DB.wuensche?live("wuensche").filter(w=>!w.inId):[];
const wuStimmen=w=>(w.stimmen||[]).length+1; /* Absender zählt mit */
const wuName=x=>{ const p=x&&typeof profilVon==="function"&&profilVon(x.mail), v=p&&[p.vorname,p.nachname].filter(Boolean).join(" "); return v||(x&&x.name)||"Jemand"; };
/* Ähnlichkeit: Wortmengen ohne Füllwörter, grob auf den Wortstamm gekürzt */
const WU_STOP=new Set("der die das ein eine einen einem einer und oder aber auch noch nicht kein keine mit ohne für von zu zum zur im in am an auf aus bei bis man wenn dass ich du wir es ist sind war wäre wird werden kann können soll sollte bitte mal so wie was wo da dann mehr schon immer gibt hat haben".split(" "));
function wuWorte(t){ return new Set(String(t||"").toLowerCase().replace(/[^a-zäöüß0-9 ]+/g," ").split(/\s+/).filter(w=>w.length>2&&!WU_STOP.has(w)).map(w=>w.replace(/(ungen|ung|en|er|es|e|n|s)$/,"").slice(0,8))); }
function wuAehnlich(a,b){ const A=wuWorte(a), B=wuWorte(b); if(!A.size||!B.size) return 0; let n=0; A.forEach(w=>{ if(B.has(w)) n++; }); return n/Math.min(A.size,B.size)*.6+n/(A.size+B.size-n)*.4; }
const wuTxt=w=>`${w.titel||""} ${w.titel||""} ${w.text||""}`; /* Titel zählt doppelt */
/* mögliche Doppelte (für den Entwickler) */
function wuDoppelte(){ const L=wuAlle().filter(w=>w.status!=="fertig"&&w.status!=="nein"), P=[];
  for(let i=0;i<L.length;i++) for(let j=i+1;j<L.length;j++){ const s=wuAehnlich(wuTxt(L[i]),wuTxt(L[j])); if(s>=.42&&!(L[i].nichtDoppelt||[]).includes(L[j].id)&&!(L[j].nichtDoppelt||[]).includes(L[i].id)) P.push([L[i],L[j],s]); }
  return P.sort((a,b)=>b[2]-a[2]).slice(0,12); }
let WU_E=null;

/* ---- Seite ---- */
function wuenscheView(){ const f=META.wuF||"offen", L0=wuAlle(), dev=wuDev();
  const L=L0.filter(w=>f==="alle"?true:f==="offen"?!["fertig","nein"].includes(w.status||"neu"):(w.status||"neu")===f)
    .sort((a,b)=>(f==="offen"?wuStimmen(b)-wuStimmen(a):0)||(b.created||0)-(a.created||0));
  const n=k=>L0.filter(w=>k==="alle"?true:k==="offen"?!["fertig","nein"].includes(w.status||"neu"):(w.status||"neu")===k).length;
  const chips=`<div class="chips vg-chips wu-chips">${WU_F.map(([k,t])=>`<button class="chip" data-act="wuF" data-v="${k}" aria-pressed="${f===k}">${t}<span class="chip-n">${n(k)}</span></button>`).join("")}</div>`;
  const D=dev?wuDoppelte():[];
  const doppelt=D.length?`<div class="sec-lbl">Vielleicht doppelt · ${D.length}</div>${D.map(([a,b])=>`<div class="wu-dp"><div class="wu-dp-t"><b>${esc(a.titel)}</b><span>${esc(wuName(a.von))}</span></div><div class="wu-dp-t"><b>${esc(b.titel)}</b><span>${esc(wuName(b.von))}</span></div>
      <div class="wu-dp-f"><button class="btn-text" data-act="wuNichtDp" data-a="${esc(a.id)}" data-b="${esc(b.id)}">Nicht doppelt</button><button class="btn-tonal" data-act="wuMerge" data-a="${esc(a.id)}" data-b="${esc(b.id)}">Zusammenfassen</button></div></div>`).join("")}`:"";
  return `<div class="narrow wu-seite">
    <div class="wu-kopf"><p>Was fehlt, was nervt, was ist gut? Alle sehen alle Einträge – mit Namen. Gibt es deinen Wunsch schon, sag einfach „Ich auch“.</p><button class="btn-filled" data-act="wuNeu">${icon("add")}Eintragen</button></div>
    ${doppelt}${chips}
    ${L.length?L.map(wuKarte).join(""):`<p class="meta" style="margin:16px 4px">${f==="offen"?"Aktuell keine offenen Einträge.":"Hier ist noch nichts."}</p>`}</div>`; }
function wuKarte(w){ const st=w.status||"neu", ich=(w.stimmen||[]).some(wuIch)||wuIch(w.von), Z=w.zusammen||[];
  return `<div class="wu-k" role="button" tabindex="0" data-act="wuAuf" data-id="${esc(w.id)}">
    <div class="wu-kk"><span class="wu-art ${esc(w.art||"wunsch")}">${esc((WU_ART.find(x=>x[0]===w.art)||WU_ART[0])[1])}</span><b>${esc(w.titel||"Ohne Titel")}</b>${pill(WU_ST_PILL[st]||"open",(WU_ST.find(x=>x[0]===st)||WU_ST[0])[1])}</div>
    ${w.text?`<p class="wu-tx">${esc(w.text)}</p>`:""}
    ${w.antwort?`<p class="wu-ant"><em>Antwort${w.statusVon?` von ${esc(wuName(w.statusVon))}`:""}:</em> ${esc(w.antwort)}</p>`:""}
    <div class="wu-f"><span class="wu-von">${esc(wuName(w.von))} · ${esc(new Date(w.created||Date.now()).toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit",year:"2-digit"}))} · ${esc((WU_APPS.find(x=>x[0]===w.app)||WU_APPS[4])[1])}${Z.length?` · mit ${Z.length} weiteren zusammengefasst`:""}</span>
      <button class="wu-plus${ich?" an":""}" data-act="wuStimme" data-id="${esc(w.id)}" ${wuIch(w.von)?"disabled":""} aria-pressed="${ich}" title="${wuIch(w.von)?"Dein Eintrag":"Ich auch"}">Ich auch<b>${wuStimmen(w)}</b></button></div></div>`; }

/* ---- Fenster: neu / ansehen ---- */
function wuNeuDialog(w){ WU_E={id:w?w.id:null,art:w?w.art||"wunsch":"wunsch",app:w?w.app||"alle":wuApp()};
  dialog(w?"Eintrag bearbeiten":"Wunsch oder Feedback",`<div class="fg1">
    <div class="vg-drw"><span>Art</span>${seg("wuArt",WU_E.art,WU_ART)}</div>
    <div class="lbl" style="margin:10px 4px 6px">Betrifft</div><div class="chips wu-appw">${WU_APPS.map(([k,t])=>`<button type="button" class="chip" data-act="wuApp" data-v="${k}" aria-pressed="${WU_E.app===k}">${t}</button>`).join("")}</div>
    ${tf("wuT","Kurz in einem Satz",w?w.titel:"",{form:true,ph:"z. B. Fotos direkt aus der Galerie hochladen"})}
    ${ta("wuX","Genauer (optional)",w?w.text:"",{form:true,ph:"Was genau, wo in der App, warum wäre es hilfreich?"})}
    <div id="wuAehnl"></div></div>`,
    `<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="wuOk">${w?"Speichern":"Eintragen"}</button>`); }
function wuAehnlichZeigen(){ const z=document.getElementById("wuAehnl"); if(!z||!WU_E) return; const F=formVals(), t=`${F.wuT||""} ${F.wuT||""} ${F.wuX||""}`;
  if(String(F.wuT||"").trim().length<4){ z.innerHTML=""; return; }
  const L=wuAlle().filter(w=>w.id!==WU_E.id).map(w=>[w,wuAehnlich(t,wuTxt(w))]).filter(x=>x[1]>=.34).sort((a,b)=>b[1]-a[1]).slice(0,3);
  z.innerHTML=L.length?`<div class="wu-ae"><b>Gibt es vielleicht schon:</b>${L.map(([w])=>`<div class="wu-ae-z"><span>${esc(w.titel)}<small>${esc(wuName(w.von))} · ${wuStimmen(w)} ${wuStimmen(w)===1?"Stimme":"Stimmen"}</small></span>${wuIch(w.von)||(w.stimmen||[]).some(wuIch)?`<em>schon dabei</em>`:`<button type="button" class="btn-tonal" data-act="wuStimmeDlg" data-id="${esc(w.id)}">Ich auch</button>`}</div>`).join("")}<small>Dann reicht „Ich auch“ – ein neuer Eintrag ist nicht nötig.</small></div>`:""; }
function wuAnsehen(w){ const dev=wuDev(), st=w.status||"neu", S=w.stimmen||[], Z=w.zusammen||[]; WU_E={id:w.id,status:st};
  const andere=wuAlle().filter(x=>x.id!==w.id);
  dialog(w.titel||"Eintrag",`<div class="wu-dlg">
    <p class="wu-meta">${esc((WU_ART.find(x=>x[0]===w.art)||WU_ART[0])[1])} · ${esc((WU_APPS.find(x=>x[0]===w.app)||WU_APPS[4])[1])} · von ${esc(wuName(w.von))}, ${esc(new Date(w.created||Date.now()).toLocaleDateString("de-DE"))}</p>
    ${w.text?`<p class="wu-tx voll">${esc(w.text)}</p>`:""}
    ${Z.length?`<div class="sec-lbl">Zusammengefasst</div>${Z.map(z=>`<div class="wu-zs"><b>${esc(z.titel)}</b>${z.text?`<span>${esc(z.text)}</span>`:""}<small>${esc(wuName(z.von))}</small></div>`).join("")}`:""}
    <div class="sec-lbl">Dafür · ${wuStimmen(w)}</div><p class="wu-namen">${esc([wuName(w.von),...S.map(wuName)].join(", "))}</p>
    ${dev?`<div class="sec-lbl">Entwickler</div><div class="lbl" style="margin:0 4px 6px">Status</div>${seg("wuSt",st,WU_ST)}
      ${ta("wuAnt","Antwort an alle (optional)",w.antwort||"",{form:true,ph:"z. B. Kommt mit Version 1.1"})}
      ${andere.length?sf("wuIn","Zusammenfassen mit …","",[["","– nicht zusammenfassen –"],...andere.map(x=>[x.id,`${x.titel} (${wuName(x.von)})`])],{form:true}):""}`
      :w.antwort?`<p class="wu-ant"><em>Antwort:</em> ${esc(w.antwort)}</p>`:""}</div>`,
    `${dev||wuIch(w.von)?`<button class="btn-text danger" data-act="wuDel" data-id="${esc(w.id)}">Löschen</button>`:""}${wuIch(w.von)&&!dev?`<button class="btn-text" data-act="wuEdit" data-id="${esc(w.id)}">Bearbeiten</button>`:""}<span style="flex:1"></span><button class="btn-text" data-act="cancel">${dev?"Abbrechen":"Schließen"}</button>${dev?`<button class="btn-text" data-act="wuDevOk" data-id="${esc(w.id)}">Speichern</button>`:""}`); }
/* zusammenfassen: der jüngere geht im älteren auf */
function wuMerge(a,b){ if(!a||!b||a.id===b.id) return; const [alt,jung]=(a.created||0)<=(b.created||0)?[a,b]:[b,a];
  alt.zusammen=[...(alt.zusammen||[]),{id:jung.id,titel:jung.titel,text:jung.text||"",von:jung.von,at:jung.created},...(jung.zusammen||[])];
  const S=[...(alt.stimmen||[])]; [jung.von,...(jung.stimmen||[])].forEach(x=>{ if(x&&x.mail&&!S.some(y=>String(y.mail).toLowerCase()===String(x.mail).toLowerCase())&&String((alt.von||{}).mail).toLowerCase()!==String(x.mail).toLowerCase()) S.push({mail:x.mail,name:x.name,at:Date.now()}); });
  alt.stimmen=S; jung.inId=alt.id; saveRec("wuensche",alt); saveRec("wuensche",jung); toast(`Zusammengefasst in „${alt.titel}“`); }
function wuSpeichern(){ const F=formVals(); if(!String(F.wuT||"").trim()){ toast("Bitte kurz beschreiben, worum es geht"); return; }
  const neu=!WU_E.id, w=neu?{id:uid(),von:who(),stimmen:[],status:"neu"}:DB.wuensche.get(WU_E.id); if(!w) return;
  Object.assign(w,{art:WU_E.art,app:WU_E.app,titel:String(F.wuT).trim(),text:String(F.wuX||"").trim()}); saveRec("wuensche",w,neu); closeOverlays(); render(); toast(neu?"Danke – eingetragen":"Gespeichert"); }
function wuStimme(w){ if(!w||wuIch(w.von)) return; const S=w.stimmen||[], i=S.findIndex(wuIch); if(i>=0) S.splice(i,1); else S.push({mail:ME.mail,name:ME.name||"",at:Date.now()}); w.stimmen=S; saveRec("wuensche",w); }

/* Einstieg: Einstellungen (alle) und Entwickler-Bereich (mit Zahl der neuen) */
function wuZeile(){ if(!DB.wuensche) return ""; const n=wuAlle().filter(w=>!["fertig","nein"].includes(w.status||"neu")).length;
  return `<div class="li" role="button" tabindex="0" data-act="nav:wuensche"><span class="av">${icon("bulb")}</span><span class="lt"><span class="h">Wünsche und Feedback</span><span class="s">${n?`${n} offen – `:""}Ideen, Fehler und Lob für die Apps – sehen alle</span></span>${icon("chev")}</div>`; }
function wuEntwZeile(){ if(!DB.wuensche) return ""; const L=wuAlle(), neu=L.filter(w=>(w.status||"neu")==="neu").length, d=wuDoppelte().length;
  return `<div class="li" role="button" tabindex="0" data-act="nav:wuensche"><span class="av">${icon("bulb")}</span><span class="lt"><span class="h">Wünsche verwalten</span><span class="s">${[`${neu} neu`,d&&`${d} vielleicht doppelt`,`${L.length} insgesamt`].filter(Boolean).join(" · ")}</span></span>${icon("chev")}</div>`; }

document.addEventListener("input",e=>{ const f=e.target&&e.target.dataset&&e.target.dataset.f; if((f==="wuT"||f==="wuX")&&WU_E&&!WU_E.status) wuAehnlichZeigen(); });
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act^="wu"]'); if(!b) return; const a=b.dataset.act; if(!/^wu[A-Z]/.test(a)) return; e.stopImmediatePropagation(); e.preventDefault();
  const w=b.dataset.id&&DB.wuensche&&DB.wuensche.get(b.dataset.id), seg1=()=>{ b.parentElement.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x===b))); if(typeof segInd==="function") segInd(); };
  if(a==="wuF"){ META.wuF=b.dataset.v; metaSave(); render(); }
  else if(a==="wuNeu") wuNeuDialog(null);
  else if(a==="wuEdit"&&w) wuNeuDialog(w);
  else if(a==="wuArt"){ WU_E.art=b.dataset.v; seg1(); }
  else if(a==="wuApp"){ WU_E.app=b.dataset.v; seg1(); }
  else if(a==="wuOk") wuSpeichern();
  else if(a==="wuStimme"&&w){ wuStimme(w); render(); }
  else if(a==="wuStimmeDlg"&&w){ wuStimme(w); closeOverlays(); render(); toast(`„Ich auch“ bei „${w.titel}“`); }
  else if(a==="wuAuf"&&w) wuAnsehen(w);
  else if(a==="wuSt"){ WU_E.status=b.dataset.v; seg1(); }
  else if(a==="wuDevOk"&&w){ const F=formVals(); if(WU_E.status!==(w.status||"neu")||String(F.wuAnt||"")!==String(w.antwort||"")){ w.status=WU_E.status; w.antwort=String(F.wuAnt||"").trim(); w.statusAm=Date.now(); w.statusVon=who(); }
    saveRec("wuensche",w); if(F.wuIn){ const x=DB.wuensche.get(F.wuIn); if(x) wuMerge(w,x); } closeOverlays(); render(); if(!F.wuIn) toast("Gespeichert"); }
  else if(a==="wuDel"&&w){ w.deleted=true; saveRec("wuensche",w); closeOverlays(); render(); toast("Gelöscht","Rückgängig",()=>{ delete w.deleted; saveRec("wuensche",w); render(); }); }
  else if(a==="wuMerge"){ wuMerge(DB.wuensche.get(b.dataset.a),DB.wuensche.get(b.dataset.b)); render(); }
  else if(a==="wuNichtDp"){ const x=DB.wuensche.get(b.dataset.a); if(x){ x.nichtDoppelt=[...(x.nichtDoppelt||[]),b.dataset.b]; saveRec("wuensche",x); render(); } }
},true);
