/* ===== Wünsche und Feedback (alle Apps) =====
   Jeder sieht alle Einträge mit Namen, kann eigene eintragen und bei fremden „Ich auch“ sagen.
   Der Entwickler pflegt Status und Antwort und fasst Doppelte zusammen (der jüngere wird Teil des älteren:
   Text, Absender und Stimmen wandern mit, der jüngere verschwindet aus der Liste).
   Datensatz „wuensche“: {id,art:"wunsch"|"fehler"|"lob",app,titel,text,von,stimmen:[{mail,name,at}],status,statusAm,statusVon,
                          antwort,zusammen:[{id,titel,text,von,at}],inId (zusammengefasst in)} */
const WU_ART=[["wunsch","Wunsch"],["fehler","Fehler"],["lob","Lob"]];
const WU_ST=[["neu","Neu"],["geplant","Geplant"],["arbeit","In Arbeit"],["fertig","Umgesetzt"],["nein","Abgelehnt"]];
const WU_ST_PILL={neu:"open",geplant:"wip",arbeit:"wip",fertig:"ok",nein:"bad"};
const WU_APPS=[["uebersicht","Übersicht"],["baustelle","Baustelle"],["evse","EVSE"],["echeck","Gebäudetechnik"],["alle","Alle Apps"]];
const WU_F=[["offen","Offen"],["fertig","Umgesetzt"],["nein","Abgelehnt"],["alle","Alle"]];
const wuApp=()=>{ const p=location.pathname; return /\/evse\//.test(p)?"evse":/\/baustelle\//.test(p)?"baustelle":/\/echeck\//.test(p)?"echeck":"uebersicht"; };
const wuDev=()=>typeof istEntwickler==="function"&&istEntwickler();
const wuIch=x=>!!x&&!!ME.mail&&String(x.mail||"").toLowerCase()===String(ME.mail).toLowerCase();
const wuAlle=()=>DB.wuensche?live("wuensche").filter(w=>!w.inId):[];
const wuStimmen=w=>(w.stimmen||[]).length+1; /* Absender zählt mit */
const wuName=x=>{ const p=x&&typeof profilVon==="function"&&profilVon(x.mail), v=p&&[p.vorname,p.nachname].filter(Boolean).join(" "); return v||(x&&x.name)||"Jemand"; };
/* ===== Ähnlichkeit, Stufe 1 (überall, sofort): Synonyme + deutscher Wortstamm (Snowball) =====
   „Bilder vom Handy übernehmen“ ≈ „Fotos aus der Galerie hochladen“: Synonyme werden auf ein gemeinsames Stichwort gelegt,
   zusammengesetzte Wörter („Fotogalerie“) bekommen zusätzlich die enthaltenen Stichworte. */
const WU_STOP=new Set("der die das den dem des ein eine einen einem einer eines und oder aber auch noch nicht kein keine keinen mit ohne für von vom zu zum zur im in ins am an auf aus bei bis man wenn dass ich du er sie wir ihr es ist sind war wäre wird werden würde kann können könnte soll sollte bitte mal so wie was wo da dann mehr schon immer gibt hat haben habe hätte gerne gern einfach direkt sehr nur alle jeder jede etwas möchte möchten will wollen wünsche wunsch statt anstatt sollen müsste muss neu".split(" "));
const WU_SYN=(()=>{ const G={
  foto:"foto fotos bild bilder aufnahme aufnahmen picture",galerie:"galerie fotoalbum album mediathek fotomediathek",kamera:"kamera knipsen fotografieren",
  handy:"handy smartphone telefon iphone mobiltelefon",tablet:"ipad tablet",pc:"pc computer rechner desktop laptop notebook browser",
  hochladen:"hochladen upload uploaden übernehmen anhängen importieren einfügen hinzufügen reinladen reinnehmen reinholen",runterladen:"herunterladen runterladen download downloaden exportieren export",
  protokoll:"protokoll prüfprotokoll prüfbericht messprotokoll",rechnung:"rechnung faktura abrechnung abrechnen",kunde:"kunde kunden auftraggeber bauherr bauherrin",
  baustelle:"baustelle baustellen projekt projekte",auftrag:"auftrag aufträge vorgang vorgänge",termin:"termin termine kalender",
  fehler:"fehler bug absturz abstürzen stürzt abstürzt abgestürzt crash crasht kaputt defekt hängt hängen funktioniert",speichern:"speichern sichern gespeichert gesichert",langsam:"langsam lädt laden ladezeit träge ruckelt",suchen:"suche suchen finden filter filtern",
  material:"material teile artikel ware bestellung bestellen",verteiler:"verteiler verteilung unterverteilung uv hv hauptverteilung zählerschrank schaltschrank",
  messgeraet:"messgerät messgeräte prüfgerät tester",wallbox:"wallbox wallboxen ladestation ladesäule ladepunkt evse",maschine:"maschine maschinen anlage anlagen",
  unterschrift:"unterschrift signatur unterschreiben",dunkel:"dunkel darkmode nachtmodus dunkelmodus",schrift:"schrift schriftgröße text größer lesbar",
  benachrichtigung:"benachrichtigung benachrichtigungen push glocke hinweis mitteilung",notiz:"notiz notizen vermerk kommentar",pdf:"pdf dokument dokumente datei dateien",
  offline:"offline netz empfang internet funkloch"}, M={};
  Object.entries(G).forEach(([k,v])=>v.split(" ").forEach(w=>M[w]="~"+k)); return M; })();
const WU_SYN_TEIL=Object.keys(WU_SYN).filter(k=>k.length>=4&&!["text","teil","netz","ware","test"].includes(k)).sort((a,b)=>b.length-a.length);
/* deutscher Snowball-Stemmer (Porter), kompakt */
function wuStamm(w){ const V="aeiouyäöü"; w=w.replace(/ß/g,"ss").replace(/([aeiouyäöü])u(?=[aeiouyäöü])/g,"$1U").replace(/([aeiouyäöü])y(?=[aeiouyäöü])/g,"$1Y");
  let r1=w.length, r2=w.length; for(let i=1;i<w.length;i++) if(!V.includes(w[i])&&V.includes(w[i-1])){ r1=i+1; break; }
  for(let i=r1+1;i<w.length;i++) if(!V.includes(w[i])&&V.includes(w[i-1])){ r2=i+1; break; } if(r1<3) r1=3;
  const in1=n=>w.length-n>=r1, in2=n=>w.length-n>=r2, ende=L=>L.find(x=>w.endsWith(x));
  let x=ende(["ern","em","er","en","es","e","s"]);
  if(x&&in1(x.length)){ if(x==="s"){ if("bdfghklmnrt".includes(w[w.length-2])) w=w.slice(0,-1); } else { w=w.slice(0,-x.length); if((x==="en"||x==="es"||x==="e")&&w.endsWith("niss")) w=w.slice(0,-1); } }
  x=ende(["est","en","er","st"]);
  if(x&&in1(x.length)){ if(x==="st"){ if(w.length-2>=4&&"bdfghklmnt".includes(w[w.length-3])) w=w.slice(0,-2); } else w=w.slice(0,-x.length); }
  x=ende(["isch","lich","heit","keit","end","ung","ig","ik"]);
  if(x&&in2(x.length)){ const vor=w.slice(0,-x.length);
    if(x==="end"||x==="ung"){ w=vor; if(w.endsWith("ig")&&!w.endsWith("eig")&&in2(2)) w=w.slice(0,-2); }
    else if(x==="ig"||x==="ik"||x==="isch"){ if(!vor.endsWith("e")) w=vor; }
    else if(x==="lich"||x==="heit"){ w=vor; const y=["er","en"].find(z=>w.endsWith(z)); if(y&&in1(2)) w=w.slice(0,-2); }
    else if(x==="keit"){ w=vor; const y=["lich","ig"].find(z=>w.endsWith(z)); if(y&&in2(y.length)) w=w.slice(0,-y.length); } }
  return w.replace(/Y/g,"y").replace(/U/g,"u").replace(/ä/g,"a").replace(/ö/g,"o").replace(/ü/g,"u"); }
function wuWorte(t){ const S=new Set();
  String(t||"").toLowerCase().replace(/[^a-zäöüß0-9 ]+/g," ").split(/\s+/).filter(w=>w.length>1&&!WU_STOP.has(w)).forEach(w=>{
    if(WU_SYN[w]){ S.add(WU_SYN[w]); return; }
    let teil=false; for(const k of WU_SYN_TEIL) if(w.length>k.length&&w.includes(k)){ S.add(WU_SYN[k]); teil=true; }
    const st=wuStamm(w); if(st.length>2&&(!teil||st.length>6)) S.add(st); });
  return S; }
function wuAehnlich(a,b){ const A=wuWorte(a), B=wuWorte(b); if(!A.size||!B.size) return 0; let n=0; A.forEach(w=>{ if(B.has(w)) n++; }); return n/Math.min(A.size,B.size)*.6+n/(A.size+B.size-n)*.4; }
const wuTxt=w=>`${w.titel||""} ${w.titel||""} ${w.text||""}`; /* Titel zählt doppelt */
/* mögliche Doppelte (für den Entwickler): Wortvergleich + – falls am PC gelaufen – KI-Vergleich */
const wuNicht=(a,b)=>(a.nichtDoppelt||[]).includes(b.id)||(b.nichtDoppelt||[]).includes(a.id);
function wuDoppelte(){ const L=wuAlle().filter(w=>w.status!=="fertig"&&w.status!=="nein"), P=[], ids=new Set(L.map(w=>w.id)), key=(a,b)=>[a.id,b.id].sort().join("|"), da=new Set();
  for(let i=0;i<L.length;i++) for(let j=i+1;j<L.length;j++){ const s=wuAehnlich(wuTxt(L[i]),wuTxt(L[j])); if(s>=.42&&!wuNicht(L[i],L[j])){ P.push([L[i],L[j],s,"wort"]); da.add(key(L[i],L[j])); } }
  WU_KI.paare.forEach(([a,b,s])=>{ const A=DB.wuensche.get(a.id), B=DB.wuensche.get(b.id); if(A&&B&&ids.has(A.id)&&ids.has(B.id)&&!wuNicht(A,B)&&!da.has(key(A,B))) P.push([A,B,s,"ki"]); });
  return P.sort((a,b)=>(a[3]==="ki")-(b[3]==="ki")||b[2]-a[2]).slice(0,20); }
/* ===== Stufe 2 (nur am PC, für den Entwickler): Sprachmodell im Browser vergleicht nach Bedeutung =====
   Mehrsprachiges Satzmodell über transformers.js; Texte verlassen das Gerät nicht. Beim ersten Mal wird das Modell geladen
   und vom Browser zwischengespeichert. Die KI schlägt nur Paare vor – zusammengefasst wird von Hand. */
const WU_KI_MODELL="Xenova/paraphrase-multilingual-MiniLM-L12-v2", WU_KI_GRENZE=.72;
const WU_KI={laeuft:false,text:"",paare:[],pipe:null,vek:new Map()};
const wuKiMoeglich=()=>matchMedia("(min-width:1024px) and (hover:hover) and (pointer:fine)").matches;
const wuKiStand=t=>{ WU_KI.text=t; const z=document.getElementById("wuKiStand"); if(z) z.textContent=t; };
async function wuKiSuchen(){ if(WU_KI.laeuft) return; WU_KI.laeuft=true; wuKiStand("KI-Modell wird geladen – beim ersten Mal rund 100 MB, danach aus dem Browser-Speicher …"); render();
  try{ if(!WU_KI.pipe){ const T=await import("https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2"); T.env.allowLocalModels=false;
      WU_KI.pipe=await T.pipeline("feature-extraction",WU_KI_MODELL,{progress_callback:x=>{ if(x&&x.status==="progress"&&/onnx/.test(x.file||"")) wuKiStand(`KI-Modell wird geladen … ${Math.round(x.progress||0)} %`); }}); }
    const L=wuAlle().filter(w=>!["fertig","nein"].includes(w.status||"neu")), txt=w=>`${w.titel||""}. ${w.text||""}`.trim();
    wuKiStand(`Vergleiche ${L.length} Einträge nach Bedeutung …`);
    for(const w of L){ const k=w.id+"|"+txt(w); if(!WU_KI.vek.has(k)){ const o=await WU_KI.pipe(txt(w),{pooling:"mean",normalize:true}); WU_KI.vek.set(k,Array.from(o.data)); } }
    const v=w=>WU_KI.vek.get(w.id+"|"+txt(w)), cos=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0), P=[];
    for(let i=0;i<L.length;i++) for(let j=i+1;j<L.length;j++){ const s=cos(v(L[i]),v(L[j])); if(s>=WU_KI_GRENZE&&!wuNicht(L[i],L[j])) P.push([L[i],L[j],s]); }
    WU_KI.paare=P.sort((a,b)=>b[2]-a[2]).slice(0,15); WU_KI.text=P.length?`KI: ${P.length} mögliche${P.length===1?"s Paar":" Paare"} gefunden (ab ${Math.round(WU_KI_GRENZE*100)} % Ähnlichkeit).`:"KI: keine weiteren Doppelten gefunden.";
  }catch(e){ console.warn("KI",e); WU_KI.text="KI konnte nicht geladen werden – beim ersten Mal ist Internet nötig."; }
  WU_KI.laeuft=false; render(); }
let WU_E=null;

/* ---- Seite ---- */
function wuenscheView(){ const f=META.wuF||"offen", L0=wuAlle(), dev=wuDev();
  const L=L0.filter(w=>f==="alle"?true:f==="offen"?!["fertig","nein"].includes(w.status||"neu"):(w.status||"neu")===f)
    .sort((a,b)=>(f==="offen"?wuStimmen(b)-wuStimmen(a):0)||(b.created||0)-(a.created||0));
  const n=k=>L0.filter(w=>k==="alle"?true:k==="offen"?!["fertig","nein"].includes(w.status||"neu"):(w.status||"neu")===k).length;
  const chips=`<div class="chips vg-chips wu-chips">${WU_F.map(([k,t])=>`<button class="chip" data-act="wuF" data-v="${k}" aria-pressed="${f===k}">${t}<span class="chip-n">${n(k)}</span></button>`).join("")}</div>`;
  const D=dev?wuDoppelte():[], ki=dev&&wuKiMoeglich();
  const kopfDp=ki||D.length?`<div class="sec-row"><div class="sec-lbl">Vielleicht doppelt${D.length?` · ${D.length}`:""}</div>${ki?`<span class="ab-btns"><button class="btn-tonal wu-ki" data-act="wuKi" ${WU_KI.laeuft?"disabled":""}>${WU_KI.laeuft?"KI arbeitet …":"Mit KI prüfen"}</button></span>`:""}</div>${WU_KI.text?`<p class="sup" id="wuKiStand" style="margin:0 4px 8px">${esc(WU_KI.text)}</p>`:`<p class="sup" id="wuKiStand" style="margin:0 4px 8px"></p>`}`:"";
  const doppelt=kopfDp+(D.length?`${D.map(([a,b,sc,q])=>`<div class="wu-dp"><span class="wu-q ${q}">${q==="ki"?`KI · ${Math.round(sc*100)} %`:"gleiche Begriffe"}</span><div class="wu-dp-t"><b>${esc(a.titel)}</b><span>${esc(wuName(a.von))}</span></div><div class="wu-dp-t"><b>${esc(b.titel)}</b><span>${esc(wuName(b.von))}</span></div>
      <div class="wu-dp-f"><button class="btn-text" data-act="wuNichtDp" data-a="${esc(a.id)}" data-b="${esc(b.id)}">Nicht doppelt</button><button class="btn-tonal" data-act="wuMerge" data-a="${esc(a.id)}" data-b="${esc(b.id)}">Zusammenfassen</button></div></div>`).join("")}`:"");
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
  else if(a==="wuKi") wuKiSuchen();
  else if(a==="wuMerge"){ wuMerge(DB.wuensche.get(b.dataset.a),DB.wuensche.get(b.dataset.b)); render(); }
  else if(a==="wuNichtDp"){ const x=DB.wuensche.get(b.dataset.a); if(x){ x.nichtDoppelt=[...(x.nichtDoppelt||[]),b.dataset.b]; saveRec("wuensche",x); render(); } }
},true);
