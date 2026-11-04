/* ===== Betriebsfristen, Mitarbeiterfristen und Unterweisungen (Übersicht, 04.11.2026) =====
   Im Prüffristen-Radar neben „Kunden“ zwei weitere Reiter:
   - Betrieb: eigene Prüfpflichten der Firma (Leitern, Feuerlöscher, Verbandkasten, eigene Elektrowerkzeuge …) plus die Kalibrierung der Messgeräte
   - Mitarbeiter: jährliche Unterweisung (jeder bestätigt in der App) und persönliche Fristen (Erste Hilfe, Vorsorge, Hubarbeitsbühne …)
   Alles mit Fälligkeit erscheint im Kalender (Ebene „Fristen“, Ocker). Anlegen und ändern: Chef und Büro; jeder sieht die Betriebsfristen,
   eigene Fristen und Unterweisungen, an denen er teilnimmt.
   Art „bfristen“: typ "betrieb" | "person" | "unterw". Gespeichert wie alle App-Daten (SharePoint), keine Gesundheitsdaten – nur Termine. */
Object.assign(IC,{bfLeiter:"M7 2v20h2v-3h6v3h2V2h-2v3H9V2H7zm2 5h6v3H9V7zm0 5h6v3H9v-3z",
  bfFeuer:"M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z",
  bfKreuz:"M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z",
  bfStecker:"M16 7V3h-2v4h-4V3H8v4H7c-1.1 0-2 .9-2 2v5.5L8.5 18v3h7v-3l3.5-3.5V9c0-1.1-.9-2-2-2h-1z",
  bfGurt:"M12 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm-3 6h6l1 6h-2l-.5 8h-3L10 14H8l1-6z",
  bfHaus:"M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",
  bfSchule:"M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z",
  bfHerz:"M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
  bfAuto:"M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z",
  bfStempel:"M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13zm-2.47 9.5L7 15l1.41-1.41 2.12 2.12 4.24-4.24L16.18 12.9l-5.65 5.6z"});
/* Vorlagen: [Schlüssel, Titel, Monate, Symbol, Hinweis] – Monate sind Vorschläge, jeder Eintrag lässt sich ändern */
const BF_BETRIEB=[["leiter","Leitern und Tritte",12,"bfLeiter","Sichtprüfung durch eine befähigte Person, mit Prüfplakette"],
  ["feuer","Feuerlöscher",24,"bfFeuer","Wartung durch Sachkundigen (ASR A2.2: spätestens alle 2 Jahre)"],
  ["verband","Verbandkästen",12,"bfKreuz","Inhalt und Ablaufdaten prüfen (Werkstatt und jedes Fahrzeug)"],
  ["dguv","Eigene Elektrowerkzeuge und Leitungsroller",6,"bfStecker","DGUV V3 – Richtwert 6 Monate, auf Baustellen 3 Monate"],
  ["psa","PSA gegen Absturz (Gurte, Falldämpfer)",12,"bfGurt","Prüfung durch Sachkundigen"],
  ["anlage","Elektrische Anlage der Werkstatt",48,"bfHaus","Wiederholungsprüfung der eigenen Anlage"],
  ["sonst","Sonstiges",12,"bfStempel",""]];
const BF_PERSON=[["eh","Erste-Hilfe-Fortbildung",24,"bfKreuz","Betriebliche Ersthelfer: alle 2 Jahre"],
  ["vorsorge","Arbeitsmedizinische Vorsorge",36,"bfHerz","Nur der Termin – keine Befunde eintragen"],
  ["hub","Unterweisung Hubarbeitsbühne",12,"bfLeiter",""],
  ["brand","Brandschutzhelfer",36,"bfFeuer","Empfehlung: alle 3–5 Jahre"],
  ["fs","Führerscheinkontrolle",6,"bfAuto","Bei Firmenfahrzeugen üblich: halbjährlich"],
  ["sonst","Sonstiges",12,"bfStempel",""]];
const BF_THEMEN=["5 Sicherheitsregeln und Arbeiten unter Spannung","Leitern und Tritte","Persönliche Schutzausrüstung","Erste Hilfe und Notfall","Brandschutz und Fluchtwege","Elektrowerkzeuge und Leitungsroller","Gefahrstoffe (z. B. Bauschaum, Kleber)","Ladungssicherung im Fahrzeug","Arbeiten auf Baustellen","Betriebshandbuch – Neuerungen"];
const BF_FARBE="#B7791F";
const bfDarf=()=>typeof anfVerw==="function"?anfVerw():!!ME.admin;
const bfAlle=()=>DB.bfristen?live("bfristen"):[];
const bfIch=()=>String(ME.mail||"").toLowerCase();
const bfVorlage=(typ,v)=>(typ==="person"?BF_PERSON:BF_BETRIEB).find(x=>x[0]===v)||(typ==="person"?BF_PERSON:BF_BETRIEB).slice(-1)[0];
const bfFaellig=r=>r.zuletzt&&+r.intervallM>0?frPlus(r.zuletzt,+r.intervallM):"";
const bfZeile=r=>({nie:!r.zuletzt,faellig:bfFaellig(r)});
/* Unterweisungen: die letzte, die schon stattgefunden hat, bestimmt die nächste Frist (12 Monate) */
const bfUnterw=()=>bfAlle().filter(r=>r.typ==="unterw").sort((a,b)=>String(b.datum||"").localeCompare(String(a.datum||"")));
const bfLetzteU=()=>bfUnterw().find(u=>u.datum&&u.datum<=today());
const bfUFaellig=()=>{ const u=bfLetzteU(); return u?frPlus(u.datum,12):""; };
const bfBest=(u,mail)=>u&&u.best&&u.best[String(mail||"").toLowerCase()];
/* Unterweisungen, die ich noch bestätigen muss (Termin ist heute oder vorbei) */
const bfZuBestaetigen=()=>bfUnterw().filter(u=>u.datum&&u.datum<=today()&&(u.teil||[]).includes(bfIch())&&!bfBest(u,bfIch()));
/* Betriebszeilen inkl. Messgeräte (nur lesen, gepflegt unter „Messgeräte“) */
function bfBetriebZeilen(){ const L=bfAlle().filter(r=>r.typ==="betrieb").map(r=>({r,...bfZeile(r)}));
  if(DB.geraete&&typeof gerKal==="function") live("geraete").filter(g=>!g.aus&&g.kal).forEach(g=>{ const b=gerKalBis(g.kal); if(!b) return;
    const iso=`${b.getFullYear()}-${String(b.getMonth()+1).padStart(2,"0")}-${String(b.getDate()).padStart(2,"0")}`; L.push({g,nie:false,faellig:iso}); });
  return L.sort((a,b)=>(a.nie?"0000":a.faellig||"9999").localeCompare(b.nie?"0000":b.faellig||"9999")); }
function bfPersonZeilen(mail){ return bfAlle().filter(r=>r.typ==="person"&&(!mail||String(r.mail).toLowerCase()===mail)).map(r=>({r,...bfZeile(r)})); }
/* Zahlen für Kopf und Startseite */
function bfZahlen(){ const t=today(), b=frPlus(t,3), Z=[...bfBetriebZeilen(),...(bfDarf()?bfPersonZeilen():bfPersonZeilen(bfIch()))], uf=bfUFaellig();
  if(bfDarf()) Z.push({nie:!uf,faellig:uf});
  return {ueber:Z.filter(x=>!x.nie&&x.faellig&&x.faellig<t).length,bald:Z.filter(x=>!x.nie&&x.faellig>=t&&x.faellig<=b).length}; }

/* ---------- Ansicht ---------- */
const bfStandPill=x=>{ if(x.nie||!x.faellig) return pill("open","Datum fehlt"); const [kl,txt]=frStand(x); return pill(kl,txt); };
function bfZeileHtml(x){ const t=today();
  if(x.g) return `<div class="fr-z" role="button" tabindex="0" data-act="nav" data-v="geraete"><span class="av">${icon("geraet")}</span><span class="lt"><span class="h">Kalibrierung ${esc(gerLabel(x.g))}</span><span class="s">${esc(gerName(x.g))} · gepflegt unter Messgeräte</span></span><span class="fr-d"><b>${esc(deDate(x.faellig))}</b>${bfStandPill(x)}</span></div>`;
  const r=x.r, v=bfVorlage(r.typ,r.vorlage), sub=[r.ort,r.zuletzt?`zuletzt ${deDate(r.zuletzt)}`:"noch nicht erledigt",+r.intervallM?`alle ${bfMonate(r.intervallM)}`:"",r.zust].filter(Boolean).join(" · ");
  return `<div class="fr-z" role="button" tabindex="0" data-act="bfAuf" data-id="${esc(r.id)}"><span class="av">${icon(v[3])}</span><span class="lt"><span class="h">${esc(r.titel||v[1])}</span><span class="s">${esc(sub)}</span></span>
    <span class="fr-d"><b>${x.nie||!x.faellig?"–":esc(deDate(x.faellig))}</b>${bfStandPill(x)}</span></div>`; }
const bfMonate=m=>{ m=+m; return m%12===0?(m===12?"12 Monate":`${m/12} Jahre`):`${m} Monate`; };
function bfBetriebView(){ const q=String(query||"").trim(), Z=bfBetriebZeilen().filter(x=>!q||suPasst(q,x.g?["Kalibrierung",gerLabel(x.g),gerName(x.g)]:[x.r.titel,x.r.ort,x.r.zust,x.r.notiz]));
  if(!Z.length) return `<p class="meta" style="margin:16px 4px">${q?`Nichts gefunden für „${esc(q)}“.`:bfDarf()?"Noch keine Betriebsfristen. Mit + anlegen – z. B. Leitern, Feuerlöscher, Verbandkästen.":"Noch keine Betriebsfristen angelegt."}</p>`;
  return `<section class="fr-k"><div class="fr-zeilen">${Z.map(bfZeileHtml).join("")}</div></section>`; }
function bfTeamView(){ const q=String(query||"").trim(), ich=bfIch(), chef=bfDarf(), T=(typeof team==="function"?team():[]).filter(m=>m.mail);
  const U=bfLetzteU(), naechste=bfUnterw().filter(u=>u.datum>today()).slice(-1)[0], uf=bfUFaellig();
  const uKarte=`<section class="fr-k bf-u"><div class="fr-kopf bf-ukopf"><span class="lt"><b>Jährliche Unterweisung</b><span>${U?`zuletzt ${esc(deDate(U.datum))}${U.durch?` durch ${esc(U.durch)}`:""}`:"noch keine erfasst"}${naechste?` · geplant ${esc(deDate(naechste.datum))}`:""}</span></span>
      <span class="fr-d"><b>${uf?esc(deDate(uf)):"–"}</b>${uf?bfStandPill({nie:false,faellig:uf}):pill("open","noch keine")}</span></div>
    <div class="fr-zeilen">${bfUnterw().slice(0,4).map(u=>{ const n=(u.teil||[]).length, b=(u.teil||[]).filter(m=>bfBest(u,m)).length, meins=(u.teil||[]).includes(ich), offen=meins&&!bfBest(u,ich)&&u.datum<=today();
      return `<div class="fr-z" role="button" tabindex="0" data-act="bfUAuf" data-id="${esc(u.id)}"><span class="av">${icon("bfSchule")}</span><span class="lt"><span class="h">${esc(u.titel||"Unterweisung")}</span><span class="s">${esc([deDate(u.datum)+(u.uhr?` · ${u.uhr} Uhr`:""),chef?`${b} von ${n} bestätigt`:meins?(bfBest(u,ich)?`bestätigt am ${deDate(new Date(bfBest(u,ich).ts).toISOString().slice(0,10))}`:"noch nicht bestätigt"):""].filter(Boolean).join(" · "))}</span></span>
        <span class="fr-d">${offen?pill("wip","bestätigen"):u.datum>today()?pill("open","geplant"):chef&&b<n?pill("wip",`${n-b} offen`):pill("ok","erledigt")}</span></div>`; }).join("")||`<p class="meta" style="margin:8px 16px 12px">${chef?"Mit + eine Unterweisung planen. Danach bestätigt jeder in der App, dass er teilgenommen hat – das ist der Nachweis.":"Noch keine Unterweisung erfasst."}</p>`}</div></section>`;
  const leute=(chef?T:T.filter(m=>String(m.mail).toLowerCase()===ich)).map(m=>{ const mail=String(m.mail).toLowerCase(), P=bfPersonZeilen(mail);
    const bu=U&&(U.teil||[]).includes(mail)?(bfBest(U,mail)?["ok","Unterweisung bestätigt"]:["wip","Unterweisung offen"]):null;
    if(q&&!suPasst(q,m.name,mail,P.map(x=>[x.r.titel,x.r.notiz]))) return "";
    const schlimm=P.some(x=>!x.nie&&frStand(x)[0]==="bad");
    return `<section class="fr-k${schlimm?" bad":""}"><div class="fr-kopf bf-pkopf">${typeof persAv==="function"?persAv(m.mail,m.name):""}<span class="lt"><b>${esc(m.name||m.mail)}</b><span>${bu?esc(bu[1]):"Keine Unterweisung zugeordnet"}</span></span>${chef?`<button type="button" class="ab-ic" data-act="bfNeuP" data-v="${esc(mail)}" aria-label="Frist für ${esc(m.name||"")} anlegen" title="Frist anlegen">${icon("add")}</button>`:""}</div>
      <div class="fr-zeilen">${P.length?P.map(bfZeileHtml).join(""):`<p class="meta" style="margin:4px 16px 12px">Keine persönlichen Fristen.</p>`}</div></section>`; }).join("");
  return uKarte+(leute||`<p class="meta" style="margin:16px 4px">${q?`Nichts gefunden für „${esc(q)}“.`:"Keine Mitarbeiter angelegt."}</p>`); }
/* Hinweis auf der Startseite: Unterweisung bestätigen */
function bfStartZeile(){ const U=bfZuBestaetigen(); if(!U.length) return "";
  return listOf(U.slice(0,2).map(u=>`<div class="li" role="button" tabindex="0" data-act="bfUAuf" data-id="${esc(u.id)}"><span class="av">${icon("bfSchule")}</span><span class="lt"><span class="h">Unterweisung bestätigen</span><span class="s">${esc([u.titel,`vom ${deDate(u.datum)}`].filter(Boolean).join(" · "))}</span><span class="st">${pill("wip","offen")}</span></span>${icon("chev")}</div>`)); }

/* ---------- Kalender (Ebene „Fristen“) ---------- */
function bfKalender(){ if(!DB.bfristen) return []; const ich=bfIch(), chef=bfDarf(), E=[];
  const tag=(iso,id,t,notiz,extra)=>{ const d=new Date(iso+"T00:00"); E.push(Object.assign({id:"bf:"+id,q:"frist",bf:id,t,von:d,bis:new Date(d.getFullYear(),d.getMonth(),d.getDate()+1),ganz:true,ort:"",notiz:notiz||"",mit:[],eigen:false,farbe:BF_FARBE,kalName:"Fristen"},extra||{})); };
  bfAlle().forEach(r=>{ if(r.typ==="unterw"){ if(!r.datum||(!chef&&!(r.teil||[]).includes(ich))) return;
      if(r.uhr&&/^\d{1,2}:\d{2}$/.test(r.uhr)){ const [h,mi]=r.uhr.split(":").map(Number), d=new Date(r.datum+"T00:00"); d.setHours(h,mi); E.push({id:"bf:"+r.id,q:"frist",bf:r.id,t:r.titel||"Unterweisung",von:d,bis:new Date(+d+60*60e3),ganz:false,ort:r.ort||"",notiz:(r.themen||[]).join(", "),mit:[],eigen:false,farbe:BF_FARBE,kalName:"Unterweisung"}); }
      else tag(r.datum,r.id,r.titel||"Unterweisung",(r.themen||[]).join(", "),{kalName:"Unterweisung"}); return; }
    const f=bfFaellig(r); if(!f) return;
    if(r.typ==="person"&&!chef&&String(r.mail).toLowerCase()!==ich) return;
    tag(f,r.id,`Fällig: ${r.titel||bfVorlage(r.typ,r.vorlage)[1]}${r.typ==="person"?` (${r.name||""})`:""}`,r.notiz||""); });
  const uf=bfUFaellig(); if(uf&&chef&&!bfUnterw().some(u=>u.datum>today())) tag(uf,"u-faellig","Fällig: Jährliche Unterweisung","Neue Unterweisung planen");
  return E; }

/* ---------- Fenster: Frist anlegen / ändern ---------- */
let BF_ED=null;
function bfFristDlg(r,typ,mail){ const neu=!r; typ=r?r.typ:typ; const V=typ==="person"?BF_PERSON:BF_BETRIEB, vk=r?r.vorlage||"sonst":V[0][0], vor=bfVorlage(typ,vk);
  const m=typ==="person"?(typeof team==="function"?team():[]).find(x=>String(x.mail).toLowerCase()===String(r?r.mail:mail).toLowerCase()):null;
  BF_ED={id:r&&r.id,typ,mail:r?r.mail:mail,name:r?r.name:m&&m.name||"",vorlage:vk};
  dialog(neu?(typ==="person"?`Frist für ${BF_ED.name||"Mitarbeiter"}`:"Neue Betriebsfrist"):(r.titel||vor[1]),
    `${neu?`<div class="chips bf-vorl">${V.map(([k,t])=>`<button type="button" class="chip" data-act="bfVorl" data-v="${k}" aria-pressed="${k===vk}">${esc(t)}</button>`).join("")}</div>`:""}
    <div class="fg1">${tf("bfT","Bezeichnung",r?r.titel:vor[1],{form:true})}
      ${typ==="betrieb"?tf("bfO","Wo / wie viele (optional)",r?r.ort:"",{form:true,ph:"z. B. Lager, 4 Stück · Bus 1 und 2"}):""}
      <div class="reihe2">${tf("bfI","Alle … Monate",String(r?r.intervallM:vor[2]),{form:true,type:"number",ph:"12"})}${tf("bfZ","Zuletzt erledigt",r?r.zuletzt||"":"",{form:true,type:"date"})}</div>
      ${typ==="betrieb"?tf("bfZu","Zuständig (optional)",r?r.zust:"",{form:true,ph:"z. B. A. Brandl"}):""}
      ${ta("bfN","Notiz (optional)",r?r.notiz:"",{form:true,ph:vor[4]||"z. B. Prüfplakette, Prüfer, Firma"})}</div>
    <p class="sup bf-hin" id="bfHin">${esc(vor[4]||"")}</p>
    ${r&&(r.verlauf||[]).length?`<div class="lbl" style="margin:14px 4px 6px">Erledigt</div><div class="bf-verlauf">${r.verlauf.slice(-6).reverse().map(v=>`<span>${esc(deDate(v.datum))}${v.wer?` · ${esc(v.wer)}`:""}</span>`).join("")}</div>`:""}`,
    `${!neu?`<button class="btn-text danger" data-act="bfDel">Löschen</button>`:""}<span style="flex:1"></span>${!neu?`<button class="btn-text" data-act="bfHeute">Heute erledigt</button>`:""}<button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="bfOk">Speichern</button>`); }
function bfAnsehen(r){ const v=bfVorlage(r.typ,r.vorlage), f=bfFaellig(r);
  dialog(r.titel||v[1],`<div class="bf-ans">${[["Fällig",f?deDate(f):"–"],["Zuletzt erledigt",r.zuletzt?deDate(r.zuletzt):"noch nicht"],["Intervall",+r.intervallM?`alle ${bfMonate(r.intervallM)}`:""],["Wo",r.ort],["Zuständig",r.zust],["Notiz",r.notiz]].filter(x=>x[1]).map(([l,w])=>`<div class="bb-ez"><small>${esc(l)}</small><span>${esc(w)}</span></div>`).join("")}</div>`,
    `<span style="flex:1"></span><button class="btn-text" data-act="cancel">Schließen</button>`); }
function bfSpeichern(heute){ const F=formVals(), E=BF_ED; if(!E) return; const neu=!E.id, r=neu?{id:uid(),typ:E.typ,verlauf:[]}:DB.bfristen.get(E.id); if(!r) return;
  const t=String(F.bfT||"").trim(); if(!t){ toast("Bitte eine Bezeichnung eingeben"); return; }
  const alt=r.zuletzt||""; Object.assign(r,{titel:t,vorlage:E.vorlage,intervallM:Math.max(0,Math.round(+String(F.bfI||"0").replace(",",".")||0)),zuletzt:heute?today():F.bfZ||"",notiz:F.bfN||""});
  if(E.typ==="betrieb") Object.assign(r,{ort:F.bfO||"",zust:F.bfZu||""}); else Object.assign(r,{mail:String(E.mail||"").toLowerCase(),name:E.name||""});
  if(r.zuletzt&&r.zuletzt!==alt){ r.verlauf=[...(r.verlauf||[]),{datum:r.zuletzt,wer:ME.name||""}].slice(-20); }
  saveRec("bfristen",r,neu); closeOverlays(); BF_ED=null; render(); toast(heute?`Erledigt – nächste Fälligkeit ${deDate(bfFaellig(r))||"–"}`:neu?"Frist angelegt":"Gespeichert"); }

/* ---------- Unterweisung ---------- */
let BF_U=null;
function bfUDlg(u){ const neu=!u, T=(typeof team==="function"?team():[]).filter(m=>m.mail);
  BF_U={id:u&&u.id,themen:new Set(u?u.themen||[]:BF_THEMEN.slice(0,5)),teil:new Set(u?u.teil||[]:T.map(m=>String(m.mail).toLowerCase()))};
  dialog(neu?"Unterweisung planen":"Unterweisung ändern",`<div class="fg1">${tf("buT","Titel",u?u.titel:"Jährliche Sicherheitsunterweisung",{form:true})}
      <div class="reihe2">${tf("buD","Datum",u?u.datum:today(),{form:true,type:"date"})}${tf("buU","Uhrzeit (optional)",u?u.uhr||"":"",{form:true,type:"time",ph:"08:00"})}</div>
      <div class="reihe2">${tf("buV","Unterweist",u?u.durch:(ME.name||""),{form:true})}${tf("buO","Ort (optional)",u?u.ort||"":"Werkstatt",{form:true})}</div></div>
    <div class="lbl" style="margin:14px 4px 6px">Themen</div><div class="chips bf-th">${[...new Set([...BF_THEMEN,...BF_U.themen])].map(t=>`<button type="button" class="chip" data-act="bfTh" data-v="${esc(t)}" aria-pressed="${BF_U.themen.has(t)}">${esc(t)}</button>`).join("")}</div>
    <div class="fg1" style="margin-top:8px">${tf("buX","Weiteres Thema (optional)","",{form:true,ph:"z. B. Neue Wallbox-Prüfanleitung"})}</div>
    <div class="lbl" style="margin:14px 4px 6px">Teilnehmer</div><div class="chips kal-mit bf-tl">${T.map(m=>{ const ml=String(m.mail).toLowerCase(); return `<button type="button" class="chip" data-act="bfTl" data-v="${esc(ml)}" aria-pressed="${BF_U.teil.has(ml)}">${typeof persAv==="function"?persAv(m.mail,m.name):""}${esc(m.name||m.mail)}</button>`; }).join("")}</div>
    <p class="sup" style="margin:12px 4px 0">Steht im Kalender (Ebene „Fristen“). Ab dem Termin sieht jeder Teilnehmer auf der Startseite „Unterweisung bestätigen“.</p>`,
    `${!neu?`<button class="btn-text danger" data-act="buDel">Löschen</button>`:""}<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="buOk">Speichern</button>`,{mittel:true}); }
function bfUSpeichern(){ const F=formVals(), E=BF_U; if(!E) return; const neu=!E.id, u=neu?{id:uid(),typ:"unterw",best:{}}:DB.bfristen.get(E.id); if(!u) return;
  if(!F.buD){ toast("Bitte ein Datum wählen"); return; } const x=String(F.buX||"").trim(); if(x) E.themen.add(x);
  Object.assign(u,{titel:F.buT||"Unterweisung",datum:F.buD,uhr:F.buU||"",durch:F.buV||"",ort:F.buO||"",themen:[...E.themen],teil:[...E.teil]});
  saveRec("bfristen",u,neu); closeOverlays(); BF_U=null; render(); toast(neu?"Unterweisung geplant – steht im Kalender":"Gespeichert"); }
function bfUAnsehen(u){ const ich=bfIch(), meins=(u.teil||[]).includes(ich), b=bfBest(u,ich), chef=bfDarf(), T=(typeof team==="function"?team():[]);
  const nm=m=>(T.find(x=>String(x.mail).toLowerCase()===m)||{}).name||m;
  const leute=chef?`<div class="lbl" style="margin:14px 4px 6px">Teilnehmer</div><div class="list">${(u.teil||[]).map(m=>{ const x=bfBest(u,m); return `<div class="li bf-tz">${typeof persAv==="function"?persAv(m,nm(m)):""}<span class="lt"><span class="h">${esc(nm(m))}</span><span class="s">${x?`bestätigt am ${esc(new Date(x.ts).toLocaleDateString("de-DE"))}`:"noch nicht bestätigt"}</span></span>${x?pill("ok","bestätigt"):pill("wip","offen")}</div>`; }).join("")}</div>`:"";
  const kann=meins&&!b&&u.datum<=today();
  dialog(u.titel||"Unterweisung",`<p class="sup" style="margin:0 0 12px">${esc([deDate(u.datum)+(u.uhr?` · ${u.uhr} Uhr`:""),u.ort,u.durch&&`Unterweist: ${u.durch}`].filter(Boolean).join(" · "))}</p>
    <div class="lbl" style="margin:0 4px 6px">Themen</div><ul class="bf-thl">${(u.themen||[]).map(t=>`<li>${esc(t)}</li>`).join("")||"<li>–</li>"}</ul>${leute}
    ${kann?`<p class="sup" style="margin:12px 4px 0">Mit „Teilgenommen“ bestätigst du, dass du an der Unterweisung teilgenommen und die Inhalte verstanden hast.</p>`:meins&&b?`<p class="sup" style="margin:12px 4px 0">Du hast am ${esc(new Date(b.ts).toLocaleDateString("de-DE"))} bestätigt.</p>`:meins&&u.datum>today()?`<p class="sup" style="margin:12px 4px 0">Bestätigen geht ab dem Termin.</p>`:""}`,
    `${chef?`<button class="btn-text" data-act="buEdit" data-id="${esc(u.id)}">Ändern</button>`:""}<span style="flex:1"></span>${chef?`<button class="btn-text" data-act="buPdf" data-id="${esc(u.id)}">Nachweis (PDF)</button>`:""}${kann?`<button class="btn-text" data-act="buJa" data-id="${esc(u.id)}">Teilgenommen</button>`:`<button class="btn-text" data-act="cancel">Schließen</button>`}`,{mittel:true}); }
function bfBestaetigen(id){ const u=DB.bfristen&&DB.bfristen.get(id); if(!u) return; u.best=Object.assign({},u.best||{},{[bfIch()]:{name:ME.name||"",ts:Date.now()}}); saveRec("bfristen",u); closeOverlays(); render(); toast("Teilnahme bestätigt"); }
async function bfUPdf(id){ const u=DB.bfristen&&DB.bfristen.get(id); if(!u) return; toast("Nachweis wird erstellt …");
  try{ const lib=await pdfLib(), d=new lib.jsPDF({unit:"mm",format:"a4"}), T=(typeof team==="function"?team():[]), nm=m=>(T.find(x=>String(x.mail).toLowerCase()===m)||{}).name||m;
    const S=pdfStil(d,{titel:"Nachweis Unterweisung",unter:`${u.titel||"Unterweisung"} | ${deDate(u.datum)}`,fuss:["Elektro Irrgang","Unterweisung vom "+deDate(u.datum)].join(" | ")}); S.kopf();
    S.abschnitt("Unterweisung"); S.werte([["Titel",u.titel],["Datum",deDate(u.datum)+(u.uhr?`, ${u.uhr} Uhr`:"")],["Ort",u.ort],["Unterweist",u.durch]]);
    S.abschnitt("Themen"); S.text((u.themen||[]).map(t=>"- "+t).join("\n")||"-");
    S.abschnitt("Teilnehmer"); S.tabelle(["Name","Bestätigt am","Status"],[80,50,52],(u.teil||[]).map(m=>{ const x=bfBest(u,m); return [nm(m),x?new Date(x.ts).toLocaleString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}):"-",x?"ok|bestätigt":"open|offen"]; }),2);
    S.text("Die Teilnehmer haben ihre Teilnahme in der Übersicht-App mit ihrem Microsoft-Konto bestätigt. Grundlage: § 12 ArbSchG, § 4 DGUV Vorschrift 1 (Unterweisung mindestens einmal jährlich).");
    saveFile(S.ende(),`${u.datum} Nachweis Unterweisung.pdf`); }catch(e){ console.error(e); toast("PDF konnte nicht erstellt werden – Internet für die PDF-Bibliothek nötig"); } }

/* ---------- Klicks ---------- */
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act^="bf"],[data-act^="bu"]'); if(!b||b.disabled) return; const a=b.dataset.act;
  if(!/^(bf|bu)[A-Z]/.test(a)) return; e.stopPropagation();
  const darf=bfDarf(), get=id=>DB.bfristen&&DB.bfristen.get(id);
  if(a==="bfAuf"){ const r=get(b.dataset.id); if(r) darf?bfFristDlg(r):bfAnsehen(r); return; }
  if(a==="bfUAuf"){ const u=get(b.dataset.id); if(u) bfUAnsehen(u); return; }
  if(a==="buJa"){ bfBestaetigen(b.dataset.id); return; }
  if(a==="buPdf"){ bfUPdf(b.dataset.id); return; }
  if(!darf) return;
  if(a==="bfNeu"){ closeOverlays(); if(b.dataset.v==="unterw") bfUDlg(null); else if(b.dataset.v==="person") bfMitarbeiterWahl(); else bfFristDlg(null,"betrieb"); return; }
  if(a==="bfNeuP"){ bfFristDlg(null,"person",b.dataset.v); return; }
  if(a==="bfVorl"){ const E=BF_ED; if(!E) return; const v=bfVorlage(E.typ,b.dataset.v); E.vorlage=v[0]; b.parentElement.querySelectorAll(".chip").forEach(c=>c.setAttribute("aria-pressed",String(c===b)));
    const set=(id,w)=>{ const el=document.getElementById(id); if(el) el.value=w; }; set("f_bfT",v[0]==="sonst"?"":v[1]); set("f_bfI",String(v[2])); const h=document.getElementById("bfHin"); if(h) h.textContent=v[4]||"";
    const n=document.getElementById("f_bfN"); if(n) n.placeholder=v[4]||"z. B. Prüfplakette, Prüfer, Firma"; if(v[0]==="sonst") document.getElementById("f_bfT")?.focus(); return; }
  if(a==="bfOk"){ bfSpeichern(false); return; }
  if(a==="bfHeute"){ bfSpeichern(true); return; }
  if(a==="bfDel"){ const r=BF_ED&&get(BF_ED.id); closeOverlays(); if(!r) return; r.deleted=true; saveRec("bfristen",r); render(); toast("Frist gelöscht","Rückgängig",()=>{ r.deleted=false; saveRec("bfristen",r); render(); }); return; }
  if(a==="bfTh"||a==="bfTl"){ const S=a==="bfTh"?BF_U.themen:BF_U.teil, v=b.dataset.v; S.has(v)?S.delete(v):S.add(v); b.setAttribute("aria-pressed",String(S.has(v))); return; }
  if(a==="buOk"){ bfUSpeichern(); return; }
  if(a==="buEdit"){ const u=get(b.dataset.id); if(u) bfUDlg(u); return; }
  if(a==="buDel"){ const u=BF_U&&get(BF_U.id); closeOverlays(); if(!u) return; u.deleted=true; saveRec("bfristen",u); render(); toast("Unterweisung gelöscht","Rückgängig",()=>{ u.deleted=false; saveRec("bfristen",u); render(); }); return; }
  if(a==="bfMa"){ closeOverlays(); bfFristDlg(null,"person",b.dataset.v); return; }
},true);
function bfMitarbeiterWahl(){ const T=(typeof team==="function"?team():[]).filter(m=>m.mail);
  dialog("Für wen?",listOf(T.map(m=>`<div class="li" role="button" tabindex="0" data-act="bfMa" data-v="${esc(String(m.mail).toLowerCase())}">${typeof persAv==="function"?persAv(m.mail,m.name):""}<span class="lt"><span class="h">${esc(m.name||m.mail)}</span></span>${icon("chev")}</div>`)),`<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button>`); }
/* „+“ im Radar: je nach Reiter */
function bfPlus(){ if(FR_TAB==="betrieb") return bfFristDlg(null,"betrieb");
  dialog("Neu",listOf([`<div class="li" role="button" tabindex="0" data-act="bfNeu" data-v="unterw"><span class="av">${icon("bfSchule")}</span><span class="lt"><span class="h">Unterweisung planen</span><span class="s">Termin, Themen, Teilnehmer – jeder bestätigt in der App</span></span>${icon("chev")}</div>`,
    `<div class="li" role="button" tabindex="0" data-act="bfNeu" data-v="person"><span class="av">${icon("person")}</span><span class="lt"><span class="h">Frist für einen Mitarbeiter</span><span class="s">z. B. Erste-Hilfe-Fortbildung, Führerscheinkontrolle</span></span>${icon("chev")}</div>`]),`<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button>`); }
/* Kalender: Antippen eines Fristen-Termins */
function bfKalAuf(id){ if(id==="u-faellig"){ if(bfDarf()) bfUDlg(null); return; } const r=DB.bfristen&&DB.bfristen.get(id); if(!r) return;
  if(r.typ==="unterw") bfUAnsehen(r); else if(bfDarf()) bfFristDlg(r); else bfAnsehen(r); }
