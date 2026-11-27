/* Weitere Schaubilder fürs Betriebshandbuch (Max 27.11.2026, nach Vorschau freigegeben):
   So klemmen wir, Datendose, Firmenfahrzeuge, Krankmeldung, Ladungssicherung, Baustellentag, Organigramm.
   Die Inhalte kommen aus Joachims Text: „[[klemmen]]“ / „[[fahrzeuge]]“ vor einer Tabelle und „[[baustellentag]]“ vor
   einer 1-2-3-Liste übernehmen die Tabelle bzw. Liste darunter. Ändert jemand den Text, ändert sich das Bild mit.
   Im Druck bleiben Tabelle und Liste wie bisher. */
IC.hbAuto=IC.hbAuto||"M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z";
IC.hbFoto=IC.hbFoto||"M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zM9 2 7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9z";
IC.hbKoffer=IC.hbKoffer||"M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z";
IC.hbSprechen=IC.hbSprechen||"M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z";
IC.hbWerkzeug=IC.hbWerkzeug||"M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z";
IC.hbBesen=IC.hbBesen||"M16 11h-1V3c0-1.1-.9-2-2-2h-2c-1.1 0-2 .9-2 2v8H8c-2.76 0-5 2.24-5 5v7h18v-7c0-2.76-2.24-5-5-5zm3 10h-2v-3c0-.55-.45-1-1-1s-1 .45-1 1v3h-2v-3c0-.55-.45-1-1-1s-1 .45-1 1v3H9v-3c0-.55-.45-1-1-1s-1 .45-1 1v3H5v-5c0-1.65 1.35-3 3-3h8c1.65 0 3 1.35 3 3v5z";
IC.hbBericht=IC.hbBericht||"M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z";
IC.hbPerson=IC.hbPerson||"M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z";
IC.hbChat=IC.hbChat||"M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z";
IC.hbSms=IC.hbSms||"M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 11H7V9h2v2zm4 0h-2V9h2v2zm4 0h-2V9h2v2z";
IC.hbBrief=IC.hbBrief||"M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z";

/* ---------- So klemmen wir ---------- */
let HB_KL=0;
const HB_KL_FARBE={"grün-gelb":"gg","gr/gb":"gg",schwarz:"#1C1C1E",braun:"#7A4A24",grau:"#9B9EA4",blau:"#2F74D0"};
/* Kurzzeichen für die Ader im Kabelquerschnitt */
function hbKlKurz(ader){ const a=String(ader);
  let m=a.match(/\bL([123])\b/); if(m) return "L"+m[1];
  if((m=a.match(/Buchse\s*(\d)/i))) return m[1];
  if(/neutral/i.test(a)) return "N"; if(/phase/i.test(a)) return "L"; if(/lampen/i.test(a)) return "LD";
  if(/taster/i.test(a)) return "T"; if(/auf\b/i.test(a)) return "Auf"; if(/\bab\b/i.test(a)) return "Ab"; if(/korresp/i.test(a)) return "K";
  return "·"; }
const hbKlFarben=t=>(String(t).replace(/\(.*\)/,"").match(/grün-gelb|gr\/gb|schwarz|braun|grau|blau/gi)||[]).map(x=>x.toLowerCase());
/* Querschnitt: Adern im Ring, Farbe + Kurzzeichen */
function hbKlQuer(adern,titel){ const n=adern.length, R=34, r=19;
  const k=adern.map(([f,l],i)=>{ const w=-Math.PI/2+i*2*Math.PI/n, x=(70+R*Math.cos(w)).toFixed(1), y=(70+R*Math.sin(w)).toFixed(1), c=HB_KL_FARBE[f];
    const hell=f==="grau"||c==="gg";
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${c==="gg"?"url(#hbGG)":c}"/>${l?`<text x="${x}" y="${(+y+5).toFixed(1)}" text-anchor="middle" font-size="${l.length>2?12:14}" font-weight="800" fill="${hell?"#111":"#fff"}"${c==="gg"?' paint-order="stroke" stroke="#fff" stroke-width="3"':""}>${esc(l)}</text>`:""}`; }).join("");
  return `<figure class="hb-kl-q"><svg viewBox="0 0 140 140" aria-hidden="true"><defs><pattern id="hbGG" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" fill="#2E9B45"/><rect width="5" height="10" fill="#F2C200"/></pattern></defs><circle cx="70" cy="70" r="66" fill="#D7D8DC"/><circle cx="70" cy="70" r="60" fill="#E9EAED"/>${k}</svg><figcaption>${titel}</figcaption></figure>`; }
/* Altes 5-adriges Kabel: Lage aus Joachims „zwischen …“-Angaben → Ring gn/ge · schwarz · blau · schwarz · braun */
function hbKlQuerschnitte(z){ if(!z.some(r=>/zwischen/i.test(r[1]||""))) return "";
  const alt=[["grün-gelb","PE"],["schwarz",""],["blau",""],["schwarz",""],["braun",""]];
  z.forEach(([ader,a])=>{ const l=hbKlKurz(ader), s=String(a||"").toLowerCase();
    if(/zwischen blau und (gr\/gb|grün-gelb)/.test(s)) alt[1][1]=l; else if(/zwischen braun und blau/.test(s)) alt[3][1]=l;
    else if(/^(immer )?braun\b/.test(s)) alt[4][1]=l; else if(/^blau\b/.test(s)) alt[2][1]=l; });
  const neu=[["grün-gelb","PE"],["blau",""],["braun",""],["schwarz",""],["grau",""]];
  z.forEach(([ader,,b])=>{ const F=hbKlFarben(b); if(F.length!==1) return; const p=neu.find(x=>x[0]===F[0]&&!x[1]); if(p) p[1]=hbKlKurz(ader); });
  return `<div class="hb-kl-qq">${hbKlQuer(alt,"Kabel alt")}${hbKlQuer(neu,"Kabel neu")}</div>`; }
function hbKlZelle(t){ const s=String(t||"").trim();
  if(!s||s==="?"||s==="–") return `<span class="hb-kl-ad fehlt"><i></i><span>fehlt noch</span></span>`;
  const m=s.match(/^(.*?)\s*\((.*)\)\s*$/), haupt=m?m[1]:s, klein=m?m[2]:"";
  return `<span class="hb-kl-ad"><span class="hb-kl-dots">${hbKlFarben(haupt).map(f=>{ const c=HB_KL_FARBE[f]; return `<i class="${c==="gg"?"gg":""}" style="${c==="gg"?"":`--f:${c}`}"></i>`; }).join("")}</span><span>${hbInl(haupt)}${klein?`<small>${esc(klein.replace(/gr\/gb/g,"gn/ge"))}</small>`:""}</span></span>`; }
function hbKlemmen(T,o){ if(o.druck) return hbTabelle(T); const K=T[0], R=T.slice(1); if(K.length<4||!R.length) return hbTabelle(T);
  const G=[]; R.forEach(r=>{ if(r[0]||!G.length) G.push({t:r[0]||"",z:[]}); G[G.length-1].z.push(r.slice(1)); });
  const i=Math.min(HB_KL,G.length-1), g=G[i];
  return `<div class="hbx hb-kl">
    <div class="hbx-chips" role="tablist">${G.map((x,j)=>`<button type="button" role="tab" data-act="hbKl" data-i="${j}" aria-selected="${j===i}">${esc(x.t.replace(/\s*\(.*\)/,""))}</button>`).join("")}</div>
    ${hbKlQuerschnitte(g.z)}
    <div class="hb-kl-tab"><div class="hb-kl-r kopf"><span></span><span>${esc(K[2].replace(/^Kabel\s*/i,""))}</span><span>${esc(K[3].replace(/^Kabel\s*/i,""))}</span></div>
      ${g.z.map(([ader,a,b])=>`<div class="hb-kl-r"><b>${hbInl(ader)}</b>${hbKlZelle(a)}${hbKlZelle(b)}</div>`).join("")}</div></div>`; }

/* ---------- Datendose T568B ---------- */
const HB_RJ=[["wor","weiß-orange"],["or","orange"],["wgn","weiß-grün"],["bl","blau"],["wbl","weiß-blau"],["gn","grün"],["wbr","weiß-braun"],["br","braun"]];
function hbDatendose(){ return `<div class="hbx hb-rj"><div class="hb-rj-pins">${HB_RJ.map(([k,t],i)=>`<div><i class="rj-${k}"></i><b>${i+1}</b><small>${t.replace("-","-<wbr>")}</small></div>`).join("")}</div>
  <p class="hbx-unter">Farbfolge nach T568B</p></div>`; }

/* ---------- Firmenfahrzeuge ---------- */
function hbKennzeichen(kz){ const s=String(kz||"").trim(), m=s.match(/^([A-ZÄÖÜ]{1,3})[-\s]+(.+)$/);
  const sterne=Array.from({length:12},(_,i)=>{ const w=i*Math.PI/6; return `<circle cx="${(10+7*Math.cos(w)).toFixed(1)}" cy="${(10+7*Math.sin(w)).toFixed(1)}" r="1.1" fill="#FFD400"/>`; }).join("");
  return `<span class="hb-kz" aria-label="Kennzeichen ${esc(s)}"><span class="eu"><svg viewBox="0 0 20 20" aria-hidden="true">${sterne}</svg><b>D</b></span><span class="txt">${m?`${esc(m[1])}<span class="plak" aria-hidden="true"><i></i><i class="hu"></i></span>${esc(m[2])}`:esc(s)}</span></span>`; }
function hbFahrzeuge(T,o){ if(o.druck) return hbTabelle(T); const K=T[0].map(k=>k.toLowerCase()), R=T.slice(1);
  const sp=re=>K.findIndex(k=>re.test(k)), iN=Math.max(0,sp(/fahrzeug|modell|typ/)), iK=sp(/kennzeichen/), iH=sp(/hersteller|marke/), iF=sp(/fahrer|zust/);
  if(iK<0||!R.length) return hbTabelle(T);
  return `<div class="hbx hb-fz">${R.map(r=>{ const f=iF>=0?String(r[iF]||"").trim():"", frei=!f||/^[–-]$/.test(f);
    return `<div class="hb-fz-k"><div class="hb-fz-o"><span class="hb-fz-i">${icon("hbAuto")}</span><div><b>${hbInl(r[iN]||"")}</b>${iH>=0&&r[iH]?`<span>${hbInl(r[iH])}</span>`:""}</div></div>${hbKennzeichen(r[iK])}
      ${iF>=0?`<div class="hb-fz-f${frei?" frei":""}">${icon("hbPerson")}${frei?"kein fester Fahrer":hbInl(f)}</div>`:""}</div>`; }).join("")}</div>`; }

/* ---------- Krankmeldung ----------
   Wird aus dem Artikeltext gelesen (Uhrzeit, Anruf-Knöpfe, Liste). Passt der Text nicht mehr zum Muster, bleibt er einfach Text. */
let HB_KM=null;
function hbKrankLesen(t){ const Z=String(t||"").replace(/\r/g,"").split("\n"), weg=new Set(), d={tel:[],nicht:[],au:null,digital:false,dauer:null,zeit:null,vertretung:false};
  const TEL=/^\[([^\]]+)\]\((tel:[+\d ]+)\)$/;
  Z.forEach((z,i)=>{ const s=z.trim(); let m;
    if(!d.zeit&&(m=s.match(/(\d{1,2})[:.](\d{2})\s*Uhr/))&&/meld|anruf|telefon/i.test(s)){ d.zeit=[+m[1],+m[2]]; d.zeitText=s; weg.add(i); return; }
    if((m=s.match(TEL))){ d.tel.push({n:m[1].replace(/\s+anrufen$/i,""),nr:m[2].slice(4)}); weg.add(i); return; }
    if(/^vertretung/i.test(s)){ d.vertretung=true; weg.add(i); return; }
    const li=s.replace(/^[-•·]\s+/,""); if(li===s) return;
    if(/whatsapp|sms|e-?mail/i.test(li)&&/nicht/i.test(li)){ d.nicht=["WhatsApp","SMS","E-Mail"].filter(k=>new RegExp(k.replace("-","-?"),"i").test(li)); weg.add(i); return; }
    if(/bescheinigung|krankschreibung|\bAU\b/i.test(li)){ d.au=/ersten|1\.\s*(krankheits)?tag/i.test(li)?1:null; d.auText=li; d.digital=/digital/i.test(li); weg.add(i); return; }
    if(/dauer/i.test(li)){ d.dauer=li; weg.add(i); } });
  if(!d.zeit||!d.tel.length) return null;
  return {d,rest:Z.filter((_,i)=>!weg.has(i)).join("\n")}; }
function hbUhr(h,m){ const wS=(h%12+m/60)*Math.PI/6, wM=m*Math.PI/30;
  return `<svg class="hb-km-uhr" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="30" fill="var(--sc-high)"/>${Array.from({length:12},(_,i)=>{ const w=i*Math.PI/6; return `<circle cx="${(32+24*Math.sin(w)).toFixed(1)}" cy="${(32-24*Math.cos(w)).toFixed(1)}" r="${i%3?1.2:2}" fill="var(--on-sv)"/>`; }).join("")}
    <path d="M32 32L${(32+13*Math.sin(wS)).toFixed(1)} ${(32-13*Math.cos(wS)).toFixed(1)}" stroke="var(--on-surface)" stroke-width="4" stroke-linecap="round"/><path d="M32 32L${(32+20*Math.sin(wM)).toFixed(1)} ${(32-20*Math.cos(wM)).toFixed(1)}" stroke="#E20019" stroke-width="3" stroke-linecap="round"/><circle cx="32" cy="32" r="3" fill="var(--on-surface)"/></svg>`; }
function hbKrankmeldung(){ const d=HB_KM; if(!d) return ""; let n=0; const z=d.zeit, zt=`${z[0]}:${String(z[1]).padStart(2,"0")}`;
  const sch=(kopf,inhalt,cls="")=>`<div class="hb-km-s${cls}"><span class="hb-km-n">${cls?"!":++n}</span><div>${kopf}${inhalt}</div></div>`;
  const KI={WhatsApp:"hbChat",SMS:"hbSms","E-Mail":"hbBrief"};
  return `<div class="hb-km">
    ${sch(`<b>Bis spätestens ${zt} Uhr anrufen</b>`,`<p>Persönlich und unverzüglich, zum Arbeitsbeginn.</p><div class="hb-km-anr">${hbUhr(z[0],z[1])}<div>${d.tel.map((t,i)=>`<a class="${i?"zw":""}" href="tel:${t.nr.replace(/\s/g,"")}">${icon("phone")}<span>${esc(t.n)}${i&&d.vertretung?"<small>Vertretung</small>":""}</span></a>`).join("")}</div></div>`)}
    ${d.nicht.length?sch(`<b>Gilt nicht als Krankmeldung</b>`,`<div class="hb-km-nix">${d.nicht.map(k=>`<span>${icon(KI[k])}<s>${k}</s></span>`).join("")}</div>`," nein"):""}
    ${d.auText?sch(`<b>Krankschreibung${d.au===1?" ab dem 1. Tag":""}</b>`,`${d.digital?"<p>Darf digital geschickt werden.</p>":`<p>${hbInl(d.auText)}</p>`}${d.au===1?`<div class="hb-km-tage"><span class="an">Tag 1<small>AU nötig</small></span><span>Tag 2</span><span>Tag 3</span></div>`:""}`):""}
    ${d.dauer?sch(`<b>Wenn möglich: Dauer sagen</b>`,`<p>Dann kann das Büro planen.</p>`):""}</div>`; }

/* ---------- Ladungssicherung (Werte DIN EN 12195-1) ---------- */
function hbLadung(){ const P=(x1,y1,x2,y2,c)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="7" stroke-linecap="round" marker-end="url(#hbSp${c==="#E20019"?"R":"O"})"/>`;
  const mk=(id,c)=>`<marker id="${id}" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="3.4" markerHeight="3.4" orient="auto"><path d="M0 0L10 5L0 10z" fill="${c}"/></marker>`;
  return `<div class="hbx hb-ld"><svg viewBox="0 0 340 232" role="img" aria-label="Kräfte auf die Ladung: 80 Prozent nach vorn, 50 Prozent zur Seite und nach hinten">
    <defs>${mk("hbSpR","#E20019")}${mk("hbSpO","#E07B00")}</defs>
    <rect x="70" y="62" width="170" height="106" rx="14" fill="var(--sc-high)"/><path d="M240 70h20a16 16 0 0 1 16 16v58a16 16 0 0 1-16 16h-20z" fill="var(--sc-highest)"/>
    <rect x="84" y="74" width="48" height="32" rx="6" fill="#B4682E"/><text x="108" y="94" text-anchor="middle" font-size="11" font-weight="800" fill="#fff">Kabel</text>
    <rect x="84" y="124" width="48" height="32" rx="6" fill="#2F62C0"/><text x="108" y="144" text-anchor="middle" font-size="11" font-weight="800" fill="#fff">Koffer</text>
    ${P(203,115,316,115,"#E20019")}${P(178,89,178,22,"#E07B00")}${P(178,141,178,206,"#E07B00")}${P(152,115,24,115,"#E07B00")}
    <circle cx="178" cy="115" r="27" fill="#6E7078"/><text x="178" y="119" text-anchor="middle" font-size="11.5" font-weight="800" fill="#fff">100 kg</text>
    <g font-weight="800"><text x="330" y="102" text-anchor="end" font-size="16" fill="#E20019">80 %</text><g font-size="15" fill="#E07B00"><text x="190" y="34">50 %</text><text x="190" y="206">50 %</text><text x="10" y="102">50 %</text></g></g>
    <text x="330" y="226" text-anchor="end" font-size="12" font-weight="700" fill="var(--on-sv)">Fahrtrichtung →</text></svg>
    <div class="hb-ld-z"><div><b>80 kg</b><span>drückt eine 100-kg-Trommel bei einer Vollbremsung nach vorn</span></div><div class="o"><b>50 kg</b><span>zur Seite beim Ausweichen und nach hinten</span></div></div>
    <p class="hbx-unter">So viel Prozent ihres Gewichts muss die Sicherung halten – nach DIN EN 12195-1.</p></div>`; }

/* ---------- Baustellentag ---------- */
function hbBtIcon(t){ return /^zurück/i.test(t)?"hbAuto":/tagesbericht|unterschrift/i.test(t)?"hbBericht":/säubern|aufräumen/i.test(t)?"hbBesen":/foto/i.test(t)?"hbFoto":
  /anmelden|durchsprechen/i.test(t)?"hbSprechen":/material|abfahrt/i.test(t)?"hbKoffer":"hbWerkzeug"; }
function hbBaustellentag(L,o){ if(o.druck) return `<ol>${L.map(x=>`<li>${hbInl(x)}</li>`).join("")}</ol>`;
  let ph=""; return `<div class="hbx hb-bt">${L.map((x,i)=>{ const zur=/^zurück in der firma/i.test(x), p=zur?"Zurück in der Firma":i===0&&/abfahrt/i.test(x)?"Vor der Abfahrt":"Beim Kunden";
    const kopf=p!==ph?`<div class="hb-bt-p">${p}</div>`:""; ph=p; const t=zur?x.replace(/^zurück in der firma:\s*/i,""):x;
    return `${kopf}<div class="hb-bt-s"><span class="hb-bt-i">${icon(hbBtIcon(x))}<b>${i+1}</b></span><div>${hbInl(t.charAt(0).toUpperCase()+t.slice(1))}${/foto/i.test(x)?`<em>${icon("hbFoto")}Foto</em>`:""}</div></div>`; }).join("")}</div>`; }

/* ---------- Organigramm aus Einstellungen › Team ---------- */
function hbOrganigramm(){ const T=(typeof team==="function"?team():[]).filter(m=>m&&m.name);
  const art=m=>{ const r=String(m.rolle||"").toLowerCase(); return /chef|inhaber|meister|geschäftsf/.test(r)||m.mail==="info@elektro-irrgang.de"?"chef":/büro|buero|verwalt/.test(r)?"buero":/azubi|auszubild|lehrling/.test(r)?"azubi":/gesell|monteur|elektrik|elektronik|techn/.test(r)?"gesell":"ohne"; };
  const P=m=>{ const n=String(m.name), k=n.split(/[\s.]+/).filter(Boolean).map(x=>x[0]).join("").slice(0,2).toUpperCase();
    return `<div class="hb-og-p ${art(m)}"><span class="av">${esc(k)}</span><div><b>${esc(n)}</b>${m.rolle?`<span>${esc(String(m.rolle).replace(/\s*·\s*firmenmail/i,""))}</span>`:""}</div></div>`; };
  const G=k=>T.filter(m=>art(m)===k), chef=G("chef"), rest=[["buero","Büro"],["gesell","Monteure"],["azubi","Auszubildende"],["ohne","Team"]];
  if(!T.length) return "";
  return `<div class="hbx hb-og">${chef.map(P).join("")}${chef.length?`<div class="hb-og-l"></div>`:""}
    ${rest.map(([k,t])=>{ const X=G(k); return X.length?`<div class="hb-og-k">${t}</div><div class="hb-og-g">${X.map(P).join("")}</div>`:""; }).join("")}
    ${G("ohne").length&&typeof hbDarf==="function"&&hbDarf()?`<p class="hbx-unter">Die Aufgabe (z. B. Geselle, Azubi, Büro) trägst du in Einstellungen › Team beim Mitarbeiter ein.</p>`:""}</div>`; }


/* ---------- Müll im Betrieb (Max 27.11.2026: kein Wirtschaftshof – Tonnen, Rollcontainer, Kupferkisten) ---------- */
const hbTonne=(f,d)=>`<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="6" y="9" width="36" height="6" rx="2" fill="${d}"/><path d="M9 16h30l-3 26a3 3 0 0 1-3 2H15a3 3 0 0 1-3-2z" fill="${f}"/>${[14,22.5,31].map(x=>`<rect x="${x}" y="21" width="3" height="17" rx="1.5" fill="#fff" opacity=".25"/>`).join("")}</svg>`;
const HB_MUELL_BILD={
  gruen:()=>hbTonne("#2E8B3E","#1F6B2D"), grau:()=>hbTonne("#7D7F86","#5E6066"),
  sack:()=>`<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M17 6c2 3 4 4 7 4s5-1 7-4l2 4c-1 2-3 3-4 4 6 3 11 11 11 20 0 6-6 10-16 10S8 40 8 34c0-9 5-17 11-20-1-1-3-2-4-4z" fill="#F2C200"/><path d="M19 14c3 1 7 1 10 0" stroke="#C49800" stroke-width="2" fill="none"/></svg>`,
  roll:()=>`<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="3" y="10" width="42" height="6" rx="2" fill="#5E6066"/><path d="M5 17h38l-2 20a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z" fill="#7D7F86"/>${[11,19,27,35].map(x=>`<rect x="${x}" y="21" width="2.5" height="13" rx="1.2" fill="#fff" opacity=".25"/>`).join("")}${[10,19,29,38].map(x=>`<circle cx="${x}" cy="42.5" r="3" fill="#333"/>`).join("")}</svg>`,
  kiste:()=>`<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 18c4-5 10-3 14-6 3 4 9 2 12 6 2-3 5-2 6 0z" fill="#B4682E"/><path d="M5 18h38l-3 24H8z" fill="#6E7078"/><path d="M5 18h38" stroke="#55575E" stroke-width="3"/>${[13,21,29,37].map(x=>`<rect x="${x-1}" y="23" width="3" height="14" rx="1.5" fill="#fff" opacity=".2"/>`).join("")}</svg>`,
  container:()=>`<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="3" y="12" width="42" height="28" rx="2" fill="#4F6B57"/>${[9,15,21,27,33,39].map(x=>`<rect x="${x-1}" y="15" width="2.5" height="22" rx="1" fill="#fff" opacity=".18"/>`).join("")}<rect x="3" y="12" width="42" height="3" fill="#3C5243"/></svg>`,
  bigpack:()=>`<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 16l5-8h22l5 8v24a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3z" fill="#ECEAE2"/><path d="M8 16h32M13 8l-3 8M35 8l3 8" stroke="#B9B5A6" stroke-width="2"/><path d="M12 24h24M12 31h24" stroke="#D3CFC1" stroke-width="1.5"/></svg>`,
  mulde:()=>`<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M3 18h42l-6 20H10z" fill="#3F6FB0"/><path d="M3 18h42" stroke="#2C548A" stroke-width="3"/><path d="M14 18c2-5 6-7 10-6 3-3 7-2 9 1 2-1 5 0 6 5z" fill="#A59C8C"/><rect x="8" y="38" width="32" height="4" rx="2" fill="#555"/></svg>`,
  sonst:()=>hbTonne("#2A2A2D","#141416") };
function hbMuellArt(w){ const t=String(w).toLowerCase(); return /big-?pack|buhck/.test(t)?"bigpack":/offen|baustelle/.test(t)?"mulde":/grün/.test(t)?"gruen":/rollcontainer/.test(t)?"roll":/grau/.test(t)?"grau":/gelb|sack/.test(t)?"sack":/kiste/.test(t)?"kiste":/materialcontainer|container/.test(t)?"container":"sonst"; }
function hbMuell(T,o){ if(o.druck) return hbTabelle(T); const R=T.slice(1).filter(r=>r[0]); if(!R.length) return hbTabelle(T);
  return `<div class="hbx hb-mu">${R.map(r=>`<div class="hb-mu-k"><span class="hb-mu-b">${HB_MUELL_BILD[hbMuellArt(r[1])]()}</span><div><span class="hb-mu-w">${hbInl(r[1]||"")}</span><b>${hbInl(r[0])}</b>${r[2]?`<small>${hbInl(r[2])}</small>`:""}</div></div>`).join("")}</div>`; }
/* Kreislauf: 1-2-3-4 im Kreis (z. B. Kupferkisten). Andere Anzahl → untereinander mit Pfeil zurück. */
function hbKreislauf(L,o){ if(o.druck) return `<ol>${L.map(x=>`<li>${hbInl(x)}</li>`).join("")}</ol>`;
  const art=x=>/schrotthändler|abhol/i.test(x)?["hbAuto",""]:/materialcontainer|oben/i.test(x)?["",HB_MUELL_BILD.container()]:/leer/i.test(x)?["",HB_MUELL_BILD.kiste().replace(/<path d="M8 18c4[^>]*>/,"")]:["",HB_MUELL_BILD.kiste()];
  const K=(x,i)=>{ const [ic,svg]=art(x); return `<div class="hb-kr-s"><span class="hb-kr-b">${ic?icon(ic):svg}<b>${i+1}</b></span><p>${hbInl(x)}</p></div>`; };
  if(L.length!==4) return `<div class="hbx hb-kr lang">${L.map(K).join("")}<p class="hbx-unter">Danach beginnt es wieder von vorn.</p></div>`;
  const P=(r)=>`<svg class="hb-kr-p ${r}" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h13M12 6l6 6-6 6" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  return `<div class="hbx hb-kr">${K(L[0],0)}${P("r")}${K(L[1],1)}${P("u1")}<span></span>${P("u2")}${K(L[3],3)}${P("l")}${K(L[2],2)}</div>`; }
/* Darf rein / darf nicht rein – aus den beiden Listen unter „## Darf … / ## Darf NICHT …“ */
let HB_JN=null;
function hbJaNein(){ const d=HB_JN; if(!d) return "";
  return `<div class="hb-jn"><div class="ja"><div class="hb-jn-k">Darf rein</div>${d.ja.map(x=>`<span>${hbInl(x)}</span>`).join("")}</div><div class="nein"><div class="hb-jn-k">Darf nicht rein</div>${d.nein.map(x=>`<span>${hbInl(x)}</span>`).join("")}</div></div>`; }
function hbJaNeinLesen(t){ const re=/(^|\n)##\s*(Darf (?!nicht)[^\n]*)\n((?:\s*[-•·]\s+[^\n]*\n?)+)\s*\n*##\s*Darf\s+NICHT[^\n]*\n((?:\s*[-•·]\s+[^\n]*\n?)+)/i, m=t.match(re); if(!m) return t;
  const L=x=>x.split("\n").map(z=>z.trim().replace(/^[-•·]\s+/,"")).filter(Boolean);
  HB_JN={ja:L(m[3]),nein:L(m[4])}; const titel=m[2].replace(/^Darf in den\s*/i,"Was darf in den ").replace(/\s*$/,"?");
  return t.replace(m[0],`${m[1]}## ${titel}\n[[janein]]\n\n`); }


/* ---------- Leitern (Max 27.11.2026): Maßband bis zur erlaubten Höhe + Sprossenleiter erlaubt / nicht erlaubt ---------- */
let HB_LT=null;
function hbLeiterLesen(t){ const m=t.match(/\n\s*[-•·]\s+[^\n]*?(\d+(?:,\d+)?)\s*m\s+Höhenunterschied[^\n]*\n\s*[-•·]\s+[^\n]*Sprossenleiter[^\n]*/i); if(!m) return t;
  HB_LT={m:m[1]}; return t.replace(m[0],"\n\n[[leiter]]\n"); }
function hbLeiter(){ const d=HB_LT; if(!d) return ""; const h=Math.max(1,Math.round(parseFloat(d.m.replace(",","."))));
  const L=`<svg viewBox="0 0 40 170" aria-hidden="true"><rect x="7" y="2" width="5" height="166" rx="2.5" fill="#E8A317"/><rect x="28" y="2" width="5" height="166" rx="2.5" fill="#E8A317"/>${Array.from({length:13},(_,i)=>`<rect x="10" y="${(170/14)*(i+1)-2}" width="20" height="3.2" rx="1.6" fill="#E8A317"/>`).join("")}</svg>`;
  return `<div class="hbx hb-lt"><div class="hb-lt-m"><div class="hb-lt-s">${Array.from({length:h+1},(_,i)=>`<div class="${i?"":"max"}"><span>${h-i} m</span><i></i></div>`).join("")}</div><div class="hb-lt-b">${L}</div></div>
    <div class="hb-lt-t"><b class="gross">${esc(d.m)} m</b><b>höchstens</b><span>Höhenunterschied, wenn die Leiter regelmäßig benutzt wird</span><small>TRBS 2121 Teil 2</small></div></div>
    <h3>Sprossenleiter</h3><div class="hb-jn hb-lt-jn"><div class="ja"><div class="hb-lt-k"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 17.01V10h-2v7.01h-3L15 21l4-3.99h-3zM9 3 5 6.99h3V14h2V6.99h3L9 3z" fill="currentColor"/></svg><span class="hb-jn-k">Erlaubt</span></div><p>Als Verkehrsweg – zum Hoch- und Runtersteigen</p></div>
    <div class="nein"><div class="hb-lt-k"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9A7.902 7.902 0 0 1 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1A7.902 7.902 0 0 1 20 12c0 4.42-3.58 8-8 8z" fill="currentColor"/></svg><span class="hb-jn-k">Nicht erlaubt</span></div><p>Als Standplatz oder Arbeitsplatz</p></div></div>`; }

/* Welche Schaubilder eine Tabelle oder Liste darunter übernehmen */
const HB_FANG={muell:{art:"tab",f:hbMuell},kreislauf:{art:"ol",f:hbKreislauf},klemmen:{art:"tab",f:hbKlemmen},fahrzeuge:{art:"tab",f:hbFahrzeuge},baustellentag:{art:"ol",f:hbBaustellentag}};
const HB_BILD={leiter:hbLeiter,janein:hbJaNein,datendose:hbDatendose,krankmeldung:hbKrankmeldung,ladung:hbLadung,organigramm:hbOrganigramm};

/* Automatisch in die passenden Artikel – Joachims Text bleibt, wie er ist */
function hbMitBildern(a,t,druck){ const id=a.id, ti=String(a.titel||"");
  const hat=k=>t.includes(`[[${k}]]`);
  if((id==="hb-klemmen"||/^so klemmen wir$/i.test(ti))){
    if(!hat("klemmen")){ const i=t.search(/(^|\n)\s*\|/); if(i>=0) t=t.slice(0,i)+(i?"\n":"")+"\n[[klemmen]]\n"+t.slice(i).replace(/^\n/,""); }
    if(!hat("datendose")&&!druck) t=t.replace(/(\n##\s*Datendosen[^\n]*\n)/i,"$1[[datendose]]\n\n"); }
  if((id==="hb-fz-zuordnung"||/zuordnung der firmenfahrzeuge/i.test(ti))&&!hat("fahrzeuge")){ const i=t.search(/(^|\n)\s*\|/); if(i>=0) t=t.slice(0,i)+(i?"\n":"")+"\n[[fahrzeuge]]\n"+t.slice(i).replace(/^\n/,""); }
  if((id==="hb-bs-alltag"||/^baustellenalltag$/i.test(ti))&&!hat("baustellentag")) t=t.replace(/(\n##\s*Ablauf eines Baustellentags[^\n]*\n)(\s*\n)?(\s*1\.\s)/i,"$1[[baustellentag]]\n$3");
  if((id==="hb-krank"||/arbeitsunfähigkeit|krankmeldung/i.test(ti))&&!druck&&!hat("krankmeldung")){ const k=hbKrankLesen(t);
    if(k){ HB_KM=k.d; const Z=k.rest.split("\n"); const e=Z.findIndex(z=>z.trim()); t=(e>=0?Z.slice(0,e+1).join("\n"):"")+"\n\n[[krankmeldung]]\n\n"+Z.slice(e+1).join("\n"); } }
  if((id==="hb-psa"||/leitern/i.test(ti))&&!druck&&!hat("leiter")) t=hbLeiterLesen(t);
  if((id==="hb-muell"||/^müll/i.test(ti))&&!druck&&!hat("janein")) t=hbJaNeinLesen(t);
  if((id==="hb-ladung"||/^ladungssicherung$/i.test(ti))&&!hat("ladung")){ const i=t.search(/\n>\s*Hat jemand anders/i); t=i>=0?t.slice(0,i)+"\n\n[[ladung]]\n"+t.slice(i):t.trim()+"\n\n[[ladung]]"; }
  if((id==="hb-organigramm"||/^organigramm$/i.test(ti))&&!hat("organigramm")){ const Z=t.split("\n"); t=Z[0]+"\n\n[[organigramm]]\n"+Z.slice(1).join("\n"); }
  return t; }

/* Müll-Artikel neu (Max 27.11.2026): Behälter so, wie sie im Betrieb wirklich stehen – ersetzt einmalig den eingespielten Text */
const HB_MUELL_TEXT="Müll wird bei uns getrennt. Einen eigenen Wirtschaftshof haben wir nicht – im Betrieb gibt es diese Behälter:\n\n[[muell]]\n| Abfall | Wohin | Hinweis |\n|---|---|---|\n| Kleine Pappe, Papier aus dem Büro, Kartons vom Auspacken | Grüne Tonne | |\n| Große Pappe | Pappe-Rollcontainer oben | Wird von der Müllabfuhr extra abgeholt |\n| Restmüll | Große graue Tonne | |\n| Verpackung, Folie, Kunststoff | Gelber Sack | |\n| Kabelreste, Kupferschrott | Kupferkiste im Lager | Der Schrotthändler holt ab |\n| Große Kupferreste (z. B. 5×35) | Materialcontainer oben | Unser verschlossener Lagercontainer |\n\n## Kupferkisten\n[[kreislauf]]\n1. Kabelreste und Kupferschrott kommen in die Kupferkiste im Lager.\n2. Ist die Kiste voll, kommt sie oben in den Materialcontainer (unser verschlossener Lagercontainer).\n3. Eine leere Kiste wieder runter ins Lager stellen.\n4. Der Schrotthändler holt die vollen Kisten ab.\n\n## Auf der Baustelle\n[[muell]]\n| Abfall | Wohin | Hinweis |\n|---|---|---|\n| Bauschutt | Big-Pack beim Kunden | Weißer Sack, den wir zum Kunden bestellen |\n| Größere Mengen Bauschutt | Offener Container beim Kunden | Wird zum Kunden bestellt |\n| Große Mengen Pappe | Container auf der Baustelle | Nur, wenn der Kunde das erlaubt |\n\n> **Tipp:** Bei Bad- und Wohnungssanierungen, bei denen der Kunde auch die Entsorgung beauftragt, stellen wir ein Buhck-Pack direkt an die Baustelle.\n\n## Was ist „reiner Bauschutt“?\nAlle mineralischen („steinernen“) Abfälle aus Neubau, Umbau, Sanierung und Abbruch – unbelastet: Steine, Putz, Mörtel, Estrich, Fliesen, Keramik, Dachpfannen, Beton.\n\n## Darf in den Bauschutt-Big-Pack\n- Beton, Estrich, zementgebundene Materialien\n- Dachziegel, Fliesen, Keramik, Porzellan\n\n## Darf NICHT in den Bauschutt\n- Bimssteine, Porenbetonsteine (Ytong)\n- Gipsabfälle, Gipskarton (Rigips)\n- Dämmstoffe, Holz\n- Bauschutt mit Anhaftungen von Bodenbelag (Laminat, Holz, Teppich) oder Tapete\n\n?? Baumischabfälle, Dämmstoff und Holz: Wohin genau? Im alten Text standen dafür eigene Behälter, die es im Betrieb nicht gibt.";
