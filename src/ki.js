/* ===== KI-Anbindung (vorbereitet 04.11.2026, gemeinsam für alle Apps) =====
   Bleibt aus, bis in der Übersicht unter Einstellungen › KI ein Zugang eingetragen und eingeschaltet ist (Datensatz einstellungen/"ki").
   Zwei Wege – beide ohne geheimen Schlüssel in der App (das Repo ist öffentlich):
   1. "azure": Azure OpenAI der Firma. Die App holt mit der Microsoft-Anmeldung ein Token für
      https://cognitiveservices.azure.com/.default – der Nutzer braucht in Azure die Rolle „Cognitive Services OpenAI User“.
   2. "proxy": eigener kleiner Server (Vorlage: server/ki-worker.js). Die App schickt ihr normales Microsoft-Token mit,
      der Server prüft es bei Microsoft (nur @elektro-irrgang.de) und hält den Schlüssel des KI-Anbieters geheim.
   Anfrageformat wie OpenAI „chat/completions“ (Text + Bilder als data:-URL); Antwort ist Text, auf Wunsch JSON. */
IC.mic=IC.mic||"M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z";
const KI_STD={art:"azure",endpoint:"",deployment:"",version:"2024-10-21"};
const KI_AZ_SCOPE=["https://cognitiveservices.azure.com/.default"];
function kiCfg(){ const r=typeof DB!=="undefined"&&DB.einstellungen&&DB.einstellungen.get("ki"); return r&&!r.deleted?{...KI_STD,...r}:{...KI_STD}; }
const kiAn=()=>{ const c=kiCfg(); return !!(c.aktiv&&c.endpoint&&(c.art!=="azure"||c.deployment)); };
const kiBereit=()=>kiAn()&&typeof Auth!=="undefined"&&!!Auth.account;
async function kiToken(c){ if(typeof Auth==="undefined"||!Auth.pca||!Auth.account) throw new Error("Erst mit dem Firmenkonto anmelden");
  const scopes=c.art==="azure"?KI_AZ_SCOPE:(typeof SCOPES!=="undefined"?SCOPES:["User.Read"]);
  try{ return (await Auth.pca.acquireTokenSilent({scopes,account:Auth.account})).accessToken; }
  catch(e){ throw Object.assign(new Error("Die KI braucht einmal deine Zustimmung – in den Einstellungen auf „KI verbinden“ tippen"),{zustimmung:true}); } }
function kiVerbinden(){ const c=kiCfg(); if(typeof Auth==="undefined"||!Auth.pca||!Auth.account){ toast("Erst mit dem Firmenkonto anmelden"); return; }
  if(typeof saveNow==="function") saveNow(); Auth.pca.acquireTokenRedirect({scopes:c.art==="azure"?KI_AZ_SCOPE:SCOPES,account:Auth.account}); }
/* Eine Anfrage. bilder: data:-URLs (JPEG). json: Antwort als Objekt. */
async function kiFrage({system,text,bilder=[],json=false,maxTokens=2500}){ const c=kiCfg(); if(!kiAn()) throw new Error("KI ist nicht eingerichtet");
  if(!navigator.onLine) throw new Error("Für die KI braucht es Internet");
  const tok=await kiToken(c); let r;
  if(c.art==="azure"){ const inhalt=bilder.length?[{type:"text",text},...bilder.map(u=>({type:"image_url",image_url:{url:u,detail:"high"}}))]:text;
    r=await fetch(`${c.endpoint.replace(/\/+$/,"")}/openai/deployments/${encodeURIComponent(c.deployment)}/chat/completions?api-version=${encodeURIComponent(c.version||KI_STD.version)}`,{method:"POST",
      headers:{"Authorization":"Bearer "+tok,"Content-Type":"application/json"},
      body:JSON.stringify({messages:[{role:"system",content:system},{role:"user",content:inhalt}],max_tokens:maxTokens,temperature:.2,...(json?{response_format:{type:"json_object"}}:{})})}); }
  else r=await fetch(c.endpoint,{method:"POST",headers:{"Authorization":"Bearer "+tok,"Content-Type":"application/json"},body:JSON.stringify({system,text,bilder,json,maxTokens,modell:c.deployment||""})});
  if(!r.ok){ let t=""; try{ t=(await r.json()).error; t=t&&(t.message||t)||""; }catch(e){} throw new Error(r.status===401||r.status===403?"Kein Zugriff auf die KI – Rechte in Azure bzw. am Server prüfen":`KI meldet Fehler ${r.status}${t?": "+String(t).slice(0,140):""}`); }
  const j=await r.json(), out=c.art==="azure"?(((j.choices||[])[0]||{}).message||{}).content||"":j.text||"";
  if(!json) return String(out).trim();
  const m=String(out).match(/\{[\s\S]*\}/); if(!m) throw new Error("Die KI hat keine verwertbare Antwort geliefert"); return JSON.parse(m[0]); }
/* Bilder für die KI verkleinern (lange Seite 1600 px reicht für Aufdrucke, spart Zeit und Kosten) */
function kiBild(file,max=1600){ return new Promise((ok,no)=>{ const url=URL.createObjectURL(file), img=new Image();
  img.onload=()=>{ const f=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight)), c=document.createElement("canvas"); c.width=Math.round(img.naturalWidth*f); c.height=Math.round(img.naturalHeight*f);
    c.getContext("2d").drawImage(img,0,0,c.width,c.height); URL.revokeObjectURL(url); ok(c.toDataURL("image/jpeg",.8)); };
  img.onerror=()=>{ URL.revokeObjectURL(url); no(new Error("Bild konnte nicht gelesen werden")); }; img.src=url; }); }
function kiFotos(mehrere=true){ return new Promise(ok=>{ const i=document.createElement("input"); i.type="file"; i.accept="image/*"; if(mehrere) i.multiple=true; else i.capture="environment"; i.style.display="none"; document.body.appendChild(i);
  i.onchange=()=>{ const F=[...(i.files||[])].slice(0,4); i.remove(); ok(F); }; i.click(); }); }

/* ---- Erzählen: Vollbild-Aufnahme (gleiche Optik wie „Diktieren“), danach wertet die KI aus ---- */
let KI_AUF=null;
function kiAufnahme({titel="Erzählen",tipp="",fertig}){ const SR=window.SpeechRecognition||window.webkitSpeechRecognition; if(!SR){ toast("Spracheingabe geht in diesem Browser nicht"); return; }
  kiAufnahmeZu(); const el=document.createElement("div"); el.className="ki-auf"; el.innerHTML=`<div class="ki-auf-blatt"><h2>${esc(titel)}</h2>
    <div class="vti-rec"><div class="vti-rec-kreis" id="kiKreis"><span class="w1"></span><span class="w2"></span><span class="kern">${icon("mic")}</span></div>
    <div class="vti-rec-zeit" id="kiZeit">0:00</div><div class="vti-rec-txt" id="kiTxt">Ich höre zu</div>${tipp?`<p class="vti-rec-tipp">${esc(tipp)}</p>`:""}
    <div class="vti-rec-k"><button type="button" class="btn-text" data-act="kiAufWeg">Verwerfen</button><button type="button" class="btn-filled vti-rec-ok" data-act="kiAufOk">Fertig</button></div></div></div>`;
  document.body.appendChild(el);
  const A=KI_AUF={el,seg:[],zw:"",t0:Date.now(),fertig,r:null,aus:false};
  const kreis=el.querySelector("#kiKreis"), txt=el.querySelector("#kiTxt"), zeit=el.querySelector("#kiZeit");
  A.uhr=setInterval(()=>{ const s=Math.floor((Date.now()-A.t0)/1000); zeit.textContent=`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`; },500);
  const zeig=()=>{ const n=(A.seg.join(" ")+" "+A.zw).trim().split(/\s+/).filter(Boolean).length; txt.textContent=n?`Ich höre zu · ${n} ${n===1?"Wort":"Wörter"}`:"Ich höre zu"; };
  const sitzung=()=>{ const r=new SR(); r.lang="de-DE"; r.continuous=true; r.interimResults=true; A.r=r; let n=0, letzte="";
    r.onresult=e=>{ let z=""; for(let i=n;i<e.results.length;i++){ const x=e.results[i], t=String(x[0].transcript||"").trim();
        if(x.isFinal){ n=i+1; const neu=letzte&&t.length>letzte.length&&t.toLowerCase().startsWith(letzte.toLowerCase()+" ")?t.slice(letzte.length).trim():t; letzte=t; if(neu) A.seg.push(neu); } else z+=(z?" ":"")+t; }
      A.zw=z; zeig(); kreis.classList.remove("hoert"); void kreis.offsetWidth; kreis.classList.add("hoert"); };
    r.onerror=e=>{ if(e.error==="not-allowed"||e.error==="service-not-allowed"){ toast("Mikrofon nicht erlaubt – in den Browser-Einstellungen freigeben"); kiAufnahmeZu(); } };
    r.onend=()=>{ if(A.zw){ A.seg.push(A.zw); A.zw=""; } if(!A.aus&&KI_AUF===A) sitzung(); };
    try{ r.start(); }catch(e){ toast("Spracheingabe konnte nicht starten"); kiAufnahmeZu(); } };
  sitzung(); }
function kiAufnahmeZu(){ const A=KI_AUF; KI_AUF=null; if(!A) return null; A.aus=true; clearInterval(A.uhr); if(A.r) try{ A.r.stop(); }catch(e){} if(A.zw){ A.seg.push(A.zw); A.zw=""; } A.el.remove(); return A; }
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act^="kiAuf"]'); if(!b) return; e.stopPropagation();
  if(b.dataset.act==="kiAufWeg"){ kiAufnahmeZu(); return; }
  if(b.dataset.act==="kiAufOk"){ const A=KI_AUF; if(!A) return; A.aus=true; clearInterval(A.uhr); if(A.r) try{ A.r.stop(); }catch(x){}
    const kreis=A.el.querySelector("#kiKreis"), txt=A.el.querySelector("#kiTxt"); kreis.className="vti-rec-kreis denkt"; txt.textContent="Die KI fasst zusammen …";
    A.el.querySelectorAll("button").forEach(x=>x.disabled=true);
    setTimeout(async()=>{ if(A.zw){ A.seg.push(A.zw); A.zw=""; } const roh=A.seg.join(" … ").trim();
      try{ if(!roh) throw new Error("Nichts gehört – Mikrofon prüfen und nochmal"); await A.fertig(roh); }catch(x){ toast(x.message||"KI nicht erreichbar"); }
      KI_AUF=null; A.el.remove(); },400); } },true);

/* ---- Einstellungen (Übersicht, nur Chef/Admin) ---- */
function kiEinstKarte(){ const c=kiCfg(), an=kiAn();
  const sel=(f,l,v,o)=>`<div class="tf fl"><select id="f_${f}" data-f="${f}">${o.map(([a,b])=>`<option value="${a}"${a===v?" selected":""}>${esc(b)}</option>`).join("")}</select><label for="f_${f}">${l}</label><span class="arr">${icon("drop")}</span></div>`;
  return `<section class="card ki-einst"><div class="card-kopf"><h3>KI</h3>${pill(an?"ok":"open",an?"eingeschaltet":"aus")}</div>
    <p class="meta">Vorbereitet für: Verteiler vom Foto ablesen, Diktat in Stromkreise übersetzen, Übergaben aus Erzähltem zusammenfassen. Ohne Zugang arbeiten die Apps wie bisher.</p>
    <div class="fg1">${sel("kiArt","Anbieter",c.art,[["azure","Azure OpenAI (Microsoft-Anmeldung)"],["proxy","Eigener Server (z. B. Cloudflare Worker)"]])}
      ${tf("kiEndpoint",c.art==="azure"?"Endpunkt":"Adresse des Servers",c.endpoint||"",{form:true,ph:c.art==="azure"?"https://<name>.openai.azure.com":"https://ki.<name>.workers.dev"})}
      ${tf("kiDeployment",c.art==="azure"?"Bereitstellung (Deployment-Name)":"Modell (optional)",c.deployment||"",{form:true,ph:c.art==="azure"?"z. B. gpt-4o":""})}</div>
    <div class="ki-knoepfe"><button type="button" class="btn-tonal" data-act="kiSpeichern" data-v="${an?0:1}">${an?"Ausschalten":"Speichern und einschalten"}</button>
      <button type="button" class="btn-tonal" data-act="kiTest">Verbindung testen</button><button type="button" class="btn-text" data-act="kiVerbinden">KI verbinden</button></div>
    <p class="hint">Der Schlüssel des KI-Anbieters steht nie in der App. Bei Azure braucht jeder Nutzer die Rolle „Cognitive Services OpenAI User“; beim eigenen Server prüft dieser die Microsoft-Anmeldung.</p></section>`; }
function kiSpeichern(an){ const F=typeof formVals==="function"?formVals():{}, alt=DB.einstellungen.get("ki"), neu=!alt;
  const r=Object.assign(alt||{id:"ki"},{art:F.kiArt||"azure",endpoint:(F.kiEndpoint||"").trim(),deployment:(F.kiDeployment||"").trim(),aktiv:!!an,deleted:false});
  if(an&&!r.endpoint){ toast("Bitte den Endpunkt eintragen"); return; } saveRec("einstellungen",r,neu); render(); toast(an?"KI eingeschaltet":"KI ausgeschaltet"); }
async function kiTest(){ toast("Frage die KI …"); try{ const t=await kiFrage({system:"Antworte knapp auf Deutsch.",text:"Antworte nur mit: Verbindung steht.",maxTokens:20}); toast("KI antwortet: "+t.slice(0,60)); }catch(e){ toast(e.message); } }
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act="kiSpeichern"],[data-act="kiTest"],[data-act="kiVerbinden"]'); if(!b) return; e.stopPropagation();
  if(b.dataset.act==="kiSpeichern") kiSpeichern(b.dataset.v==="1"); else if(b.dataset.act==="kiTest") kiTest(); else kiVerbinden(); },true);
