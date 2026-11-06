/* ===== Parken: Hinweis am Kunden/Standort + Parkscheiben-Erinnerung (Max 06.11.2026) =====
   Am Kunden/Standort (Bearbeiten-Fenster, alle Apps): park_art ("" | "scheibe" | "automat" | "frei"), park_min (Minuten), park_notiz.
   Gespeichert flach über formVals → Object.assign wie die übrigen Felder.
   „Parkscheibe gestellt“ startet eine Uhr auf DIESEM Gerät (localStorage PARK_LS). Scheibe = nächste halbe Stunde nach dem Ankommen
   (§ 13 Abs. 2 StVO), Ende = Scheibe + erlaubte Dauer. Parkschein: Ende = jetzt + Dauer.
   Live-Eintrag in den Benachrichtigungen, Glocke grün; 10 Min. vorher rot mit Ton und Vibration, bei Ablauf noch einmal.
   Grenze: Web-Apps laufen im Hintergrund nicht weiter (iOS hält sie an) – Ton/Vibration nur bei offener App; beim Zurückkommen
   wird sofort gewarnt. Für unterwegs gibt es zusätzlich eine Kalender-Erinnerung (.ics mit Alarm 10 Min. vorher). */
IC.park="M13 3H6v18h4v-6h3c3.31 0 6-2.69 6-6s-2.69-6-6-6zm.2 8H10V7h3.2c1.1 0 2 .9 2 2s-.9 2-2 2z";
const PARK_ARTEN=[["","Keine Angabe"],["scheibe","Parkscheibe"],["automat","Parkschein"],["frei","Frei parken"]];
const PARK_MIN=[["30","30 Min."],["60","1 Std."],["90","1,5 Std."],["120","2 Std."],["180","3 Std."]];
const PARK_LS="irrgang-park", PARK_VOR=10*60000;
const PARK={ton:null,pin:null};
const parkChips=(act,cur,opts)=>`<div class="park-chips" role="group">${opts.map(([v,t])=>`<button type="button" class="park-ch" data-act="${act}" data-v="${v}" aria-pressed="${String(cur)===String(v)}">${esc(t)}</button>`).join("")}</div>`;
const parkSvg=()=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${IC.park}"/></svg>`;
const parkVon=r=>({art:(r&&r.park_art)||"",min:+(r&&r.park_min)||0,notiz:String((r&&r.park_notiz)||"").trim()});
const parkDauer=m=>{ m=+m||0; if(!m) return ""; if(m<60) return `${m} Min.`; if(m%60===0) return `${m/60} Std.`; if(m%30===0) return `${String(m/60).replace(".",",")} Std.`; return `${Math.floor(m/60)} Std. ${m%60} Min.`; };
const parkUhr=t=>new Date(t).toLocaleTimeString("de-DE",{hour:"numeric",minute:"2-digit"});
const parkRest=ms=>{ const m=Math.max(1,Math.ceil(Math.abs(ms)/60000)), h=Math.floor(m/60); return h?`${h} Std.${m%60?` ${m%60} Min.`:""}`:`${m} Min.`; };
/* Parkscheibe: auf den Strich der halben Stunde, die dem Ankommen folgt */
function parkScheibe(t){ const d=new Date(t||Date.now()); const m=d.getMinutes(); d.setSeconds(0,0); d.setMinutes(m<30?30:60); return +d; }
const parkTitel=(r,art)=>({scheibe:"Parkscheibe",automat:"Parkschein",frei:"Frei parken"})[art]||"Parken";
function parkLaden(){ try{ const P=JSON.parse(localStorage.getItem(PARK_LS)||"null"); return P&&P.ende?P:null; }catch(e){ return null; } }
function parkSpeichern(P){ try{ if(P) localStorage.setItem(PARK_LS,JSON.stringify(P)); else localStorage.removeItem(PARK_LS); }catch(e){} }
/* Steht der Nutzer gerade auf der Seite des Orts? Dann bleibt die Glocke neutral (die Karte zeigt es ja) */
const parkHier=P=>!!(P&&typeof nav!=="undefined"&&typeof VIEW_KIND!=="undefined"&&nav.id===P.id&&VIEW_KIND[nav.v]===P.k);
function parkZustand(){ const P=parkLaden(); if(!P) return null; const rest=P.ende-Date.now(); return {P,rest,warn:rest<=PARK_VOR,hier:parkHier(P)}; }

/* ---- Karte auf der Kunden-/Standortseite ---- */
function parkKarte(r,kind){ const p=parkVon(r), P=parkLaden(), meins=!!(P&&P.id===r.id&&P.k===kind);
  if(!p.art&&!meins) return "";
  const art=meins?P.art:p.art, min=p.min||120;
  const kopf=`<div class="park-kopf"><span class="park-av">${parkSvg()}</span><span class="park-tx"><b>${esc(parkTitel(r,art))}${art!=="frei"?` · höchstens ${esc(parkDauer(meins?P.min:min))}`:""}</b>${p.notiz?`<small>${esc(p.notiz)}</small>`:""}${r.park_von?`<small class="park-von">Hinweis von ${esc(r.park_von)}${r.park_am?` · ${esc(new Date(r.park_am).toLocaleDateString("de-DE"))}`:""}</small>`:""}</span>${meins?"":`<button type="button" class="park-ed" data-act="parkQ" data-kind="${kind}" data-id="${esc(r.id)}" aria-label="Parkhinweis ändern" title="Parkhinweis ändern">${icon("edit")}</button>`}</div>`;
  let unten="";
  if(meins){ const rest=P.ende-Date.now(), warn=rest<=PARK_VOR, ges=Math.max(1,P.ende-P.start);
    unten=`<div class="park-lauf"><div class="park-zeit"><b id="parkRest">${rest>0?`noch ${parkRest(rest)}`:`abgelaufen seit ${parkRest(rest)}`}</b><small>${P.art==="scheibe"?`Scheibe ${parkUhr(P.scheibe)} · `:""}bis ${parkUhr(P.ende)}</small></div>
      <div class="park-bar"><i id="parkBar" style="width:${Math.max(0,Math.min(100,rest/ges*100)).toFixed(1)}%"></i></div>
      <div class="park-btns"><button type="button" class="park-b" data-act="parkEnde">Weggefahren</button><button type="button" class="park-b park-b2" data-act="parkKal">Kalender-Erinnerung</button></div></div>`;
    return `<section class="park-k aktiv${warn?" warn":""}" id="parkKarte" data-art="${esc(art)}">${kopf}${unten}</section>`; }
  if(art==="scheibe") unten=`<div class="park-los"><span class="park-hinw">Scheibe auf <b id="parkJetzt">${parkUhr(parkScheibe())}</b> stellen</span><button type="button" class="park-go" data-act="parkLos" data-kind="${kind}" data-id="${esc(r.id)}">Parkscheibe gestellt</button></div>`;
  else if(art==="automat") unten=`<div class="park-los"><span class="park-hinw">Erinnerung ab jetzt für ${esc(parkDauer(min))}</span><button type="button" class="park-go" data-act="parkLos" data-kind="${kind}" data-id="${esc(r.id)}">Parkschein gezogen</button></div>`;
  return `<section class="park-k" id="parkKarte" data-art="${esc(art)}">${kopf}${unten}</section>`; }

/* ---- Live-Eintrag in den Benachrichtigungen ---- */
function parkLiveEintrag(){ const Z=parkZustand(); if(!Z) return ""; const {P,rest,warn}=Z;
  const t=rest>0?(warn?`Parkzeit endet in ${parkRest(rest)}`:`Parken · noch ${parkRest(rest)}`):`Parkzeit abgelaufen seit ${parkRest(rest)}`;
  return `<button type="button" id="parkLive" class="kx-live${warn?" warn":""}" data-act="parkAuf"><span class="kx-live-av">${parkSvg()}</span><span class="kx-live-tx"><b>${esc(t)}</b><small>${P.art==="scheibe"?`Scheibe ${parkUhr(P.scheibe)} · `:""}bis ${parkUhr(P.ende)}${P.titel?` · ${esc(P.titel)}`:""}</small></span>${icon("chev")}</button>`; }

/* ---- Ton und Vibration ---- */
function parkTonFrei(){ try{ if(!PARK.ton){ const A=window.AudioContext||window.webkitAudioContext; if(A) PARK.ton=new A(); } if(PARK.ton&&PARK.ton.state==="suspended") PARK.ton.resume(); }catch(e){} }
function parkAlarm(stark){ const c=PARK.ton;
  if(c) try{ if(c.state==="suspended") c.resume(); const n=stark?5:3; for(let i=0;i<n;i++){ const t=i*.32, o=c.createOscillator(), v=c.createGain(); o.frequency.value=i%2?1320:990;
    v.gain.setValueAtTime(.0001,c.currentTime+t); v.gain.exponentialRampToValueAtTime(.3,c.currentTime+t+.02); v.gain.exponentialRampToValueAtTime(.0001,c.currentTime+t+.22); o.connect(v).connect(c.destination); o.start(c.currentTime+t); o.stop(c.currentTime+t+.25); } }catch(e){}
  try{ if(navigator.vibrate) navigator.vibrate(stark?[500,150,500,150,500,150,800]:[400,150,400,150,600]); else if(typeof navHaptik==="function"){ navHaptik(); setTimeout(navHaptik,180); setTimeout(navHaptik,360); } }catch(e){}
  const P=parkLaden(); if(P&&typeof toast==="function") toast(P.ende-Date.now()>0?`Parkzeit endet in ${parkRest(P.ende-Date.now())}${P.titel?` · ${P.titel}`:""}`:`Parkzeit abgelaufen${P.titel?` · ${P.titel}`:""}`); }
/* Nach einem Neuladen gibt es noch keinen Ton – der erste Fingertipp schaltet ihn wieder frei */
document.addEventListener("pointerdown",()=>{ if(parkLaden()) parkTonFrei(); },{passive:true,capture:true});

/* ---- Uhr: jede Sekunde Karte, Live-Eintrag und Glocke nachführen, Warnungen auslösen ---- */
function parkTick(){ const P=parkLaden(), k=document.getElementById("parkKarte");
  if(!P){ const j=document.getElementById("parkJetzt"); if(j){ const u=parkUhr(parkScheibe()); if(j.textContent!==u) j.textContent=u; } return; }
  const rest=P.ende-Date.now();
  if(rest<-3*36e5){ parkSpeichern(null); parkNeuZeichnen(); return; }   /* längst vorbei – aufräumen */
  if(rest<=0&&!P.w0){ P.w0=1; P.w10=1; parkSpeichern(P); parkAlarm(true); }
  else if(rest<=PARK_VOR&&!P.w10){ P.w10=1; parkSpeichern(P); parkAlarm(false); }
  if(k&&k.classList.contains("aktiv")){ const b=document.getElementById("parkRest"), bar=document.getElementById("parkBar"), warn=rest<=PARK_VOR;
    const t=rest>0?`noch ${parkRest(rest)}`:`abgelaufen seit ${parkRest(rest)}`; if(b&&b.textContent!==t) b.textContent=t;
    if(bar) bar.style.width=Math.max(0,Math.min(100,rest/Math.max(1,P.ende-P.start)*100)).toFixed(1)+"%"; k.classList.toggle("warn",warn); }
  const l=document.getElementById("parkLive"); if(l){ const h=parkLiveEintrag(); if(l.outerHTML!==h) l.outerHTML=h; }
  if(typeof liveGlocke==="function") liveGlocke(); }
function parkNeuZeichnen(){ if(typeof liveGlocke==="function") liveGlocke(); if((document.getElementById("mlSeite")||document.getElementById("mlPop"))&&typeof mlFuellen==="function") mlFuellen();
  if(typeof VIEW_KIND!=="undefined"&&VIEW_KIND[nav.v]&&typeof render==="function") render(); }
setInterval(parkTick,1000);
document.addEventListener("visibilitychange",()=>{ if(!document.hidden) parkTick(); });
setTimeout(()=>{ if(typeof liveGlocke==="function") liveGlocke(); },1500);

/* ---- Kalender-Erinnerung (.ics mit Alarm 10 Min. vor Ende) – klingelt auch, wenn die App zu ist ---- */
function parkIcs(P){ const z=t=>new Date(t).toISOString().replace(/[-:]/g,"").replace(/\.\d+/,""), e=s=>String(s||"").replace(/[\\,;]/g,m=>"\\"+m).replace(/\n/g,"\\n");
  return ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Elektro Irrgang//Parken//DE","BEGIN:VEVENT",`UID:park-${P.start}@elektro-irrgang.de`,`DTSTAMP:${z(Date.now())}`,`DTSTART:${z(P.ende-PARK_VOR)}`,`DTEND:${z(P.ende)}`,
    `SUMMARY:${e(`Parkzeit endet um ${parkUhr(P.ende)}${P.titel?` – ${P.titel}`:""}`)}`,`DESCRIPTION:${e(P.art==="scheibe"?`Parkscheibe auf ${parkUhr(P.scheibe)} gestellt.`:"Parkschein gezogen.")}`,
    "BEGIN:VALARM","ACTION:DISPLAY","DESCRIPTION:Parkzeit endet","TRIGGER:PT0M","END:VALARM","END:VEVENT","END:VCALENDAR"].join("\r\n"); }

/* ---- Klicks ---- */
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act="parkLos"],[data-act="parkEnde"],[data-act="parkAuf"],[data-act="parkKal"],[data-act="kdParkW"],[data-act="kdParkMinW"]'); if(!b) return;
  e.stopImmediatePropagation(); e.preventDefault(); const a=b.dataset.act;
  if(a==="parkLos"){ const kind=b.dataset.kind, r=DB[kind]&&DB[kind].get(b.dataset.id); if(!r) return; const p=parkVon(r), min=p.min||120, now=Date.now();
    const sch=p.art==="scheibe"?parkScheibe(now):now; parkTonFrei();
    parkSpeichern({k:kind,id:r.id,titel:r.name||"",art:p.art,min,start:now,scheibe:sch,ende:sch+min*60000});
    if(typeof navHaptik==="function") navHaptik(); parkNeuZeichnen(); return; }
  if(a==="parkEnde"){ parkSpeichern(null); parkNeuZeichnen(); return; }
  if(a==="parkAuf"){ const P=parkLaden(); if(!P) return; if(typeof mlZu==="function") mlZu(); if(typeof closeOverlays==="function") closeOverlays(); go({v:P.k==="kunden"?"kunde":"standort",id:P.id}); return; }
  if(a==="parkKal"){ const P=parkLaden(); if(!P) return; const f=new File([parkIcs(P)],"Parkzeit.ics",{type:"text/calendar"});
    if(navigator.canShare&&navigator.canShare({files:[f]})){ navigator.share({files:[f],title:"Parkzeit"}).catch(()=>{}); return; }
    const u=URL.createObjectURL(f), x=document.createElement("a"); x.href=u; x.download="Parkzeit.ics"; document.body.appendChild(x); x.click(); x.remove(); setTimeout(()=>URL.revokeObjectURL(u),4000); return; }
  /* Bearbeiten-Fenster */
  b.parentElement.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));
  const d=document.getElementById("dlg"), f=a==="kdParkW"?"park_art":"park_min", h=d&&d.querySelector(`input[type=hidden][data-f="${f}"]`); if(h) h.value=b.dataset.v;
  if(a==="kdParkW") parkDlgAnwenden(b.dataset.v); },true);

/* ---- Felder im Bearbeiten-Fenster (von kdDlgErweitern aufgerufen) ---- */
function parkDlgFelder(d,r){ const fg=d&&d.querySelector(".fg1"); if(!fg) return; const p=parkVon(r), min=String(p.min||120);
  const hid=(f,v)=>`<input type="hidden" data-f="${f}" value="${esc(v||"")}">`;
  const html=`<div class="kd-park">${hid("park_art",p.art)}<div class="lbl" style="margin:12px 4px 6px">Parken</div>${parkChips("kdParkW",p.art,PARK_ARTEN)}
    <div class="kd-park-min"${p.art==="scheibe"||p.art==="automat"?"":" hidden"}>${hid("park_min",p.art?min:String(r&&r.park_min||""))}<div class="lbl" style="margin:12px 4px 6px">Höchstens</div>${parkChips("kdParkMinW",min,PARK_MIN)}</div>
    <div class="kd-park-notiz"${p.art?"":" hidden"} style="margin-top:12px">${tf("park_notiz","Wo parken? (optional)",p.notiz,{form:true,ph:"z. B. Hof hinter dem Haus"})}</div></div>`;
  const nz=fg.querySelector('[data-f="notiz"]'), vor=nz&&nz.closest(".tf"); if(vor) vor.insertAdjacentHTML("beforebegin",html); else fg.insertAdjacentHTML("beforeend",html); }
function parkDlgAnwenden(art){ const d=document.getElementById("dlg"); if(!d) return; const m=d.querySelector(".kd-park-min"), n=d.querySelector(".kd-park-notiz");
  if(m) m.hidden=!(art==="scheibe"||art==="automat"); if(n) n.hidden=!art;
  const h=d.querySelector('input[type=hidden][data-f="park_min"]'); if(h&&(art==="scheibe"||art==="automat")&&!h.value){ const on=d.querySelector('.kd-park-min [aria-pressed="true"]'); h.value=on?on.dataset.v:"120"; } }

/* ===== Parkhinweis ohne Bearbeiten-Rechte (Max 06.11.2026): jeder Kollege kann vor Ort eintragen, was auf dem Schild steht =====
   Zeile in den Eckdaten („Parken · noch nichts hinterlegt“) bzw. Stift an der Parkkarte öffnen ein kleines Fenster.
   Dazu „In der Nähe suchen“: Parkplätze und Straßenränder aus OpenStreetMap (Overpass) im Umkreis von 400 m mit dem, was dort
   eingetragen ist (kostenlos, Parkschein, Parkscheibe, Höchstdauer). Oft ist nichts eingetragen – dann steht „Regel unbekannt“. */
function parkZeile(r,kind){ if(!r||!["kunden","standorte"].includes(kind)||parkVon(r).art||typeof ME==="undefined"||!ME.signedIn&&typeof SYNC_ON!=="undefined"&&SYNC_ON) return "";
  return `<button type="button" class="dz dz-park" data-act="parkQ" data-kind="${kind}" data-id="${esc(r.id)}"><span class="dz-ic">${parkSvg()}</span><span class="dz-t"><small>Parken</small><span>Noch nichts hinterlegt · eintragen</span></span>${icon("chev")}</button>`; }
const PARK_Q={kind:"",id:"",art:"",min:"120",nah:null,lade:false};
function parkQDlg(kind,id){ const r=DB[kind]&&DB[kind].get(id); if(!r) return; const p=parkVon(r);
  if(PARK_Q.id!==id||PARK_Q.kind!==kind) Object.assign(PARK_Q,{kind,id,art:p.art||"",min:String(p.min||120),nah:null,lade:false,pos:null,notiz:null});
  dialog("Parken",`<p class="ec-sub" style="margin:0 4px 12px">Gilt für alle Kollegen bei ${esc(r.name||"diesem Ort")}.</p>
    <div class="leg-eti-opt park-q">
      <div class="leg-eti-z"><span class="lbl">Hier gilt</span><div class="chips">${PARK_ARTEN.filter(x=>x[0]).map(([v,t])=>`<button type="button" class="chip" data-act="parkQW" data-v="${v}" aria-pressed="${PARK_Q.art===v}">${t}</button>`).join("")}</div></div>
      <div class="leg-eti-z" id="parkQMin"${PARK_Q.art==="scheibe"||PARK_Q.art==="automat"?"":" hidden"}><span class="lbl">Höchstens</span><div class="chips">${PARK_MIN.map(([v,t])=>`<button type="button" class="chip" data-act="parkQM" data-v="${v}" aria-pressed="${PARK_Q.min===v}">${t}</button>`).join("")}</div></div></div>
    ${tf("park_notiz","Wo parken? (optional)",PARK_Q.notiz!=null?PARK_Q.notiz:p.notiz,{form:true,ph:"z. B. Hof hinter dem Haus"})}
    ${parkPosHtml(r)}
    <div class="park-nah" id="parkNah">${parkNahHtml()}</div>`,
    `${p.art?`<button class="btn-text danger" data-act="parkQWeg">Hinweis entfernen</button>`:""}<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="parkQOk">Speichern</button>`);
  setTimeout(()=>{ const a=document.activeElement; if(a&&a.id==="f_park_notiz") a.blur(); },80); }
/* Stelle auf der Karte im Fenster: markiert (mit Entfernung zum Haus) oder setzen */
function parkPosHtml(r){ const pos=PARK_Q.pos===false?null:PARK_Q.pos||(r.park_lat?{lat:+r.park_lat,lon:+r.park_lon}:null);
  const knopf=(act,t,ic)=>`<button type="button" class="park-such park-such2" data-act="${act}">${ic}<span>${t}</span></button>`;
  const gps=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm8.94 3A8.99 8.99 0 0 0 13 3.06V1h-2v2.06A8.99 8.99 0 0 0 3.06 11H1v2h2.06A8.99 8.99 0 0 0 11 20.94V23h2v-2.06A8.99 8.99 0 0 0 20.94 13H23v-2h-2.06zM12 19a7 7 0 1 1 0-14 7 7 0 0 1 0 14z"/></svg>`;
  if(pos) return `<div class="park-pos"><div class="lbl">Auf der Karte</div><div class="park-nz"><span class="park-nz-t"><b>Parkplatz markiert</b><small>${PARK_Q.pos&&PARK_Q.pos.gen?`per Standort, auf ca. ${PARK_Q.pos.gen} m genau · `:""}„Route“ führt dorthin</small></span><button type="button" class="park-b" data-act="parkSetzen">Ändern</button></div>
    <button type="button" class="park-weg" data-act="parkPosWeg">Markierung entfernen</button></div>`;
  return `<div class="park-pos"><div class="lbl">Auf der Karte</div><div class="park-2">${knopf("parkGps","Ich stehe am Parkplatz",gps)}${knopf("parkSetzen","Auf der Karte setzen",parkSvg())}</div></div>`; }
function parkNahHtml(){ const N=PARK_Q.nah;
  if(PARK_Q.lade) return `<div class="lbl">In der Nähe</div><p class="meta park-nah-t">Suche in OpenStreetMap …</p>`;
  if(!N) return `<button type="button" class="park-such" data-act="parkNahSuchen">${parkSvg()}<span>Parkplätze in der Nähe suchen</span></button>`;
  if(N.fehler) return `<div class="lbl">In der Nähe</div><p class="meta park-nah-t">${esc(N.fehler)}</p><button type="button" class="park-such" data-act="parkNahSuchen">${parkSvg()}<span>Nochmal suchen</span></button>`;
  const st=N.strasse==="läuft"?`<p class="meta park-nah-t">Straßenränder werden noch gesucht …</p>`:"";
  if(!N.L.length) return `<div class="lbl">In der Nähe</div><p class="meta park-nah-t">${N.strasse==="läuft"?"Bisher kein Parkplatz gefunden.":"Im Umkreis von 500 m ist in OpenStreetMap kein Parkplatz eingetragen. Vor Ort aufs Schild schauen und oben eintragen."}</p>${st}`;
  return `<div class="lbl">In der Nähe · aus OpenStreetMap</div>${N.L.map((x,i)=>`<div class="park-nz"><span class="park-nz-t"><b>${esc(x.titel)}</b><small>${esc([x.m+" m",x.info||"Regel unbekannt"].join(" · "))}</small></span><button type="button" class="park-b" data-act="parkNahNimm" data-i="${i}">Übernehmen</button></div>`).join("")}
    ${st}<p class="meta park-nah-t">Nicht immer vollständig oder aktuell – vor Ort das Schild gilt.</p>`; }
/* Overpass: alle Server gleichzeitig, die erste brauchbare Antwort zählt (wie die Anhaltspunkte der Karte) */
function parkOverpass(q){ const SRV=["https://overpass-api.de/api/interpreter","https://overpass.private.coffee/api/interpreter","https://maps.mail.ru/osm/tools/overpass/api/interpreter","https://overpass.kumi.systems/api/interpreter"];
  const ov=u=>new Promise((ok,no)=>{ const ab=new AbortController(), t=setTimeout(()=>ab.abort(),25000);
    fetch(u,{method:"POST",body:"data="+encodeURIComponent(q),headers:{"Content-Type":"application/x-www-form-urlencoded"},signal:ab.signal}).then(r=>r.ok?r.json():Promise.reject(r.status))
      .then(j=>{ if(j&&Array.isArray(j.elements)&&!(j.remark&&/error|timeout|busy|out of memory/i.test(j.remark))) ok(j); else no(0); }).catch(no).finally(()=>clearTimeout(t)); });
  return new Promise(ok=>{ let offen=SRV.length; SRV.forEach(u=>ov(u).then(ok,()=>{ if(!--offen) ok(null); })); }); }
/* „2 hours“, „90 minutes“, „1:30“, „2 h“ → Minuten */
function parkMaxstay(v){ v=String(v||"").trim().toLowerCase(); if(!v||v==="no"||v==="unlimited") return 0; let m;
  if((m=v.match(/^(\d+):(\d\d)$/))) return +m[1]*60+ +m[2];
  if((m=v.match(/^([\d.,]+)\s*(h|hours?|std)/))) return Math.round(parseFloat(m[1].replace(",","."))*60);
  if((m=v.match(/^(\d+)\s*(min|minutes?)/))) return +m[1]; return 0; }
/* Tags eines Parkplatzes oder Straßenrands deuten → {art, min, info} */
function parkDeuten(t,strasse){ const W=Object.entries(t), hat=(re,v)=>W.some(([k,x])=>re.test(k)&&(v?v.test(String(x)):true));
  let art="", min=0;
  const pre=strasse?/^parking:(both|left|right)/:/^/;
  if(hat(strasse?/^parking:(both|left|right)(:[a-z_]+)*:authentication:disc$/:/^authentication:disc$/,/^yes$/)||hat(/^parking:condition(:(both|left|right))?$/,/disc/)||hat(/^parking:(both|left|right)(:[a-z_]+)*:restriction$/,/disc/)) art="scheibe";
  else if(hat(strasse?/^parking:(both|left|right)(:[a-z_]+)*:fee$/:/^fee$/,/^yes$/)||hat(/^parking:condition(:(both|left|right))?$/,/ticket|fee/)) art="automat";
  else if(hat(strasse?/^parking:(both|left|right)(:[a-z_]+)*:fee$/:/^fee$/,/^no$/)||hat(/^parking:condition(:(both|left|right))?$/,/^free$/)) art="frei";
  W.forEach(([k,x])=>{ if(!min&&(strasse?/^parking:(both|left|right)(:[a-z_]+)*:maxstay$|^parking:condition(:(both|left|right))?:maxstay$/:/^maxstay$/).test(k)) min=parkMaxstay(x); });
  const kunden=!strasse&&t.access==="customers";
  const info=[art==="scheibe"?"Parkscheibe":art==="automat"?"Parkschein":art==="frei"?"kostenlos":"",min?"höchstens "+parkDauer(min):"",kunden?"nur für Kunden":""].filter(Boolean).join(" · ");
  return {art,min,info,kunden}; }
/* 06.11.2026 nachgemessen (aus der App heraus): overpass-api.de antwortet mit 406, die Spiegel brauchen 20 s oder mehr bzw. gar nicht.
   Darum: Parkplätze über Nominatim (0,4 s, liefert die Tags als extratags), Straßenränder zusätzlich über Overpass im Hintergrund – kommen sie, werden sie ergänzt. */
async function parkNahSuchen(){ const r=DB[PARK_Q.kind]&&DB[PARK_Q.kind].get(PARK_Q.id); if(!r) return; const el=()=>document.getElementById("parkNah"), zeig=()=>{ if(el()) el().innerHTML=parkNahHtml(); };
  const id=PARK_Q.id;
  const adr=typeof adrText==="function"?adrText(r):""; if(!adr){ PARK_Q.nah={fehler:"Ohne Adresse kann ich nicht suchen."}; zeig(); return; }
  PARK_Q.lade=true; zeig();
  let g=null; try{ g=typeof karteGeo==="function"?await karteGeo(adr):null; }catch(e){}
  if(!g||g.nix){ PARK_Q.lade=false; PARK_Q.nah={fehler:"Die Adresse wurde auf der Karte nicht gefunden."}; zeig(); return; }
  const dist=(lat,lon)=>Math.round(Math.hypot((lat-g.lat)*111000,(lon-g.lon)*111000*Math.cos(g.lat*Math.PI/180))/10)*10;
  const L=[], gesehen=new Set();
  const dazu=(t,lat,lon,strasse,strName)=>{ if(!lat) return; const m=dist(+lat,+lon); if(m>500) return;
    if(!strasse&&(t.access==="private"||t.access==="no")) return;
    if(strasse&&!Object.entries(t).some(([k,x])=>/^parking:(both|left|right|lane:(both|left|right))$/.test(k)&&/lane|street_side|on_kerb|half_on_kerb|shoulder|parallel|diagonal|perpendicular|marked|yes/.test(x))) return;
    const D=parkDeuten(t,strasse), typ=t.parking==="multi-storey"?"Parkhaus":t.parking==="underground"?"Tiefgarage":t.parking==="street_side"||t.parking==="lane"?"Parkbucht":"Parkplatz";
    const titel=strasse?`Straßenrand ${t.name||""}`.trim():t.name?`${typ} ${t.name}`:(strName?`${typ} ${strName}`:typ);
    const key=titel+"|"+D.info; if(gesehen.has(key)) return; gesehen.add(key); L.push({titel,m,lat:+lat,lon:+lon,...D}); };
  /* Reihenfolge: öffentlich mit bekannter Regel, öffentlich ohne Regel, Kundenparkplätze (Supermarkt usw.) zuletzt – dort dürfen Handwerker eigentlich nicht stehen */
  const rang=x=>x.kunden?2:x.info?0:1;
  const fertig=()=>{ L.sort((a,b)=>rang(a)-rang(b)||a.m-b.m); PARK_Q.nah={L:L.slice(0,8),strasse:PARK_Q.nah&&PARK_Q.nah.strasse}; };
  /* 1. Parkplätze: Nominatim im Ausschnitt ±500 m */
  const dy=.0045, dx=dy/Math.cos(g.lat*Math.PI/180);
  let nj=null; try{ const ab=new AbortController(), t=setTimeout(()=>ab.abort(),12000);
    nj=await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&amenity=parking&bounded=1&limit=40&extratags=1&addressdetails=1&accept-language=de&countrycodes=de&viewbox=${g.lon-dx},${g.lat+dy},${g.lon+dx},${g.lat-dy}`,{signal:ab.signal}).then(x=>x.ok?x.json():null); clearTimeout(t); }catch(e){}
  if(PARK_Q.id!==id) return;
  PARK_Q.lade=false;
  if(Array.isArray(nj)) nj.forEach(x=>dazu({...(x.extratags||{}),amenity:"parking",...(x.name?{name:x.name}:{})},x.lat,x.lon,false,x.address&&(x.address.road||x.address.pedestrian||x.address.square)));
  PARK_Q.nah={strasse:"läuft"}; fertig(); if(!Array.isArray(nj)&&!L.length) PARK_Q.nah.fehler="";
  zeig();
  /* 2. Straßenränder: Overpass im Hintergrund */
  const q=`[out:json][timeout:20];way(around:200,${g.lat},${g.lon})["highway"][~"^parking:"~"."];out center tags 60;`;
  const j=await parkOverpass(q); if(PARK_Q.id!==id) return;
  (j&&j.elements||[]).forEach(e=>dazu(e.tags||{},e.center&&e.center.lat,e.center&&e.center.lon,true));
  PARK_Q.nah={strasse:j?"ok":"weg"}; fertig();
  if(!Array.isArray(nj)&&!j){ PARK_Q.nah={fehler:"Die Kartendienste antworten gerade nicht. Später nochmal versuchen."}; }
  zeig(); }
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act="parkQ"],[data-act="parkQW"],[data-act="parkQM"],[data-act="parkQOk"],[data-act="parkQWeg"],[data-act="parkNahSuchen"],[data-act="parkNahNimm"]'); if(!b) return;
  e.stopImmediatePropagation(); e.preventDefault(); const a=b.dataset.act, d=document.getElementById("dlg");
  const wahl=()=>{ d.querySelectorAll('[data-act="parkQW"]').forEach(x=>x.setAttribute("aria-pressed",String(x.dataset.v===PARK_Q.art))); d.querySelectorAll('[data-act="parkQM"]').forEach(x=>x.setAttribute("aria-pressed",String(x.dataset.v===PARK_Q.min)));
    const m=document.getElementById("parkQMin"); if(m) m.hidden=!(PARK_Q.art==="scheibe"||PARK_Q.art==="automat"); };
  if(a==="parkQ"){ PARK_Q.id=""; parkQDlg(b.dataset.kind,b.dataset.id); return; }
  if(a==="parkQW"){ PARK_Q.art=b.dataset.v; wahl(); return; }
  if(a==="parkQM"){ PARK_Q.min=b.dataset.v; wahl(); return; }
  if(a==="parkNahSuchen"){ parkNahSuchen(); return; }
  if(a==="parkNahNimm"){ const x=PARK_Q.nah&&PARK_Q.nah.L[+b.dataset.i]; if(!x) return; if(x.art) PARK_Q.art=x.art; if(x.lat) PARK_Q.pos={lat:x.lat,lon:x.lon}; if(x.min&&PARK_MIN.some(m=>+m[0]===x.min)) PARK_Q.min=String(x.min); else if(x.min) PARK_Q.min=String(x.min);
    const n=document.getElementById("f_park_notiz"); if(n){ n.value=`${x.titel}, ca. ${x.m} m`; n.dispatchEvent(new Event("input",{bubbles:true})); n.closest(".tf")&&n.closest(".tf").classList.add("fl"); }
    const pp=document.querySelector("#dlg .park-pos"), rr=DB[PARK_Q.kind]&&DB[PARK_Q.kind].get(PARK_Q.id); if(pp&&rr) pp.outerHTML=parkPosHtml(rr);
    wahl(); if(!x.art&&typeof toast==="function") toast("Regel unbekannt – oben auswählen, was auf dem Schild steht"); return; }
  if(a==="parkQOk"||a==="parkQWeg"){ const r=DB[PARK_Q.kind]&&DB[PARK_Q.kind].get(PARK_Q.id); if(!r) return; const n=document.getElementById("f_park_notiz");
    if(a==="parkQOk"&&!PARK_Q.art){ if(typeof toast==="function") toast("Bitte auswählen, was hier gilt"); return; }
    if(a==="parkQWeg"){ ["park_art","park_min","park_notiz","park_von","park_am","park_lat","park_lon"].forEach(k=>delete r[k]); }
    else Object.assign(r,{park_art:PARK_Q.art,park_min:PARK_Q.art==="scheibe"||PARK_Q.art==="automat"?PARK_Q.min:"",park_notiz:n?n.value.trim():"",park_von:(typeof ME!=="undefined"&&(ME.name||ME.mail))||"",park_am:Date.now()});
    if(a==="parkQOk"&&PARK_Q.pos){ r.park_lat=String(PARK_Q.pos.lat); r.park_lon=String(PARK_Q.pos.lon); } else if(a==="parkQOk"&&PARK_Q.pos===false){ delete r.park_lat; delete r.park_lon; }
    saveRec(PARK_Q.kind,r); PARK_Q.id=""; if(typeof closeOverlays==="function") closeOverlays(); if(typeof render==="function") render(); if(typeof toast==="function") toast(a==="parkQWeg"?"Parkhinweis entfernt":"Parkhinweis gespeichert – gilt für alle"); return; }
},true);

/* ===== Parkplatz auf der Kundenkarte (Max 06.11.2026) =====
   park_lat/park_lon am Kunden/Standort. Gesetzt über „Übernehmen“ (Treffer aus der Nähe), „Ich stehe am Parkplatz“ (GPS)
   oder „Auf der Karte setzen“ (Karte verschieben, Mitte = Parkplatz). Auf der Karte ein blaues P; „Route“ führt dann zum Parkplatz. */
const parkRec=id=>(DB.kunden&&DB.kunden.get(id))?["kunden",DB.kunden.get(id)]:(DB.standorte&&DB.standorte.get(id))?["standorte",DB.standorte.get(id)]:[null,null];
function parkRouteHref(r){ const z=`${r.park_lat},${r.park_lon}`; return /iPad|iPhone|Macintosh/.test(navigator.userAgent)?`https://maps.apple.com/?daddr=${z}&dirflg=d`:`https://www.google.com/maps/dir/?api=1&destination=${z}&travelmode=driving`; }
function parkKartePin(){ if(typeof KARTE==="undefined"||!KARTE.map||!window.maplibregl) return; const k=document.getElementById("kdKarte"); if(PARK.pin){ PARK.pin.remove(); PARK.pin=null; }
  if(!k) return; const [,r]=parkRec(k.dataset.id); if(!r||!r.park_lat) return;
  const d=document.createElement("div"); d.className="park-pin"; d.title="Parkplatz"; d.innerHTML=parkSvg();
  PARK.pin=new maplibregl.Marker({element:d,anchor:"center"}).setLngLat([+r.park_lon,+r.park_lat]).addTo(KARTE.map); }
/* Karte: Setzen-Modus */
function parkSetzenStart(){ const k=document.getElementById("kdKarte"); if(!k||typeof KARTE==="undefined"||!KARTE.map){ if(typeof toast==="function") toast("Die Karte ist noch nicht geladen"); return; }
  if(typeof closeOverlays==="function") closeOverlays();
  const p=PARK_Q.pos||(()=>{ const [,r]=parkRec(PARK_Q.id); return r&&r.park_lat?{lat:+r.park_lat,lon:+r.park_lon}:null; })();
  if(p) KARTE.map.jumpTo({center:[p.lon,p.lat],zoom:Math.max(KARTE.map.getZoom(),17)}); else KARTE.map.easeTo({zoom:Math.max(KARTE.map.getZoom(),17),duration:300});
  if(PARK.pin) PARK.pin.getElement().style.visibility="hidden";
  k.classList.add("park-setzen");
  k.insertAdjacentHTML("beforeend",`<div class="park-kreuz" aria-hidden="true">${parkSvg()}</div><div class="park-leiste"><span>Karte verschieben, bis das P auf dem Parkplatz steht</span><div><button type="button" class="park-b" data-act="parkSetzenAbbr">Abbrechen</button><button type="button" class="park-go" data-act="parkSetzenOk">Hier parken</button></div></div>`);
  k.scrollIntoView({behavior:"smooth",block:"center"}); }
function parkSetzenEnde(){ const k=document.getElementById("kdKarte"); if(!k) return; k.classList.remove("park-setzen"); k.querySelectorAll(".park-kreuz,.park-leiste").forEach(x=>x.remove()); if(PARK.pin) PARK.pin.getElement().style.visibility=""; }
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act="parkSetzen"],[data-act="parkSetzenOk"],[data-act="parkSetzenAbbr"],[data-act="parkGps"],[data-act="parkPosWeg"]'); if(!b) return;
  e.stopImmediatePropagation(); e.preventDefault(); const a=b.dataset.act;
  const merk=()=>{ const n=document.getElementById("f_park_notiz"); if(n) PARK_Q.notiz=n.value; };
  if(a==="parkSetzen"){ merk(); parkSetzenStart(); return; }
  if(a==="parkSetzenAbbr"){ parkSetzenEnde(); parkQDlg(PARK_Q.kind,PARK_Q.id); return; }
  if(a==="parkSetzenOk"){ const c=KARTE.map.getCenter(); PARK_Q.pos={lat:+c.lat.toFixed(6),lon:+c.lng.toFixed(6)}; parkSetzenEnde(); parkQDlg(PARK_Q.kind,PARK_Q.id); return; }
  if(a==="parkPosWeg"){ merk(); PARK_Q.pos=false; parkQDlg(PARK_Q.kind,PARK_Q.id); return; }
  if(a==="parkGps"){ if(!navigator.geolocation){ if(typeof toast==="function") toast("Standort ist auf diesem Gerät nicht verfügbar"); return; } merk(); b.disabled=true; b.querySelector("span").textContent="Standort wird bestimmt …";
    navigator.geolocation.getCurrentPosition(g=>{ PARK_Q.pos={lat:+g.coords.latitude.toFixed(6),lon:+g.coords.longitude.toFixed(6),gen:Math.round(g.coords.accuracy)}; parkQDlg(PARK_Q.kind,PARK_Q.id); },
      ()=>{ b.disabled=false; b.querySelector("span").textContent="Ich stehe am Parkplatz"; if(typeof toast==="function") toast("Standort nicht freigegeben oder nicht gefunden"); },{enableHighAccuracy:true,timeout:15000,maximumAge:0}); return; }
},true);
