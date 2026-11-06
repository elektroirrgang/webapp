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
const PARK={ton:null};
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
  const kopf=`<div class="park-kopf"><span class="park-av">${parkSvg()}</span><span class="park-tx"><b>${esc(parkTitel(r,art))}${art!=="frei"?` · höchstens ${esc(parkDauer(meins?P.min:min))}`:""}</b>${p.notiz?`<small>${esc(p.notiz)}</small>`:""}</span></div>`;
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
