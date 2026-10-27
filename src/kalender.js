/* ===== Kalender (Übersicht) =====
   Zeigt den eigenen Outlook-Kalender (Microsoft Graph) und die Auftragstermine aus den Vorgängen. Termine lassen sich hier anlegen,
   ändern und löschen – Outlook muss dafür nicht geöffnet werden. Kollegen unter „Mit“ bekommen den Termin als Einladung in ihren Kalender.
   Recht „Calendars.ReadWrite“ wird erst beim ersten Öffnen des Kalenders angefragt (eigener Token), damit die übrige App davon unabhängig bleibt.
   Präsentation/Demo: dann nie echte Outlook-Termine, sondern Beispieltermine im Speicher. */
Object.assign(IC,{kal:"M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z",
  kalOrt:"M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z",
  kalUhr:"M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z",
  kalLeute:"M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"});
const KAL_SCOPES=["Calendars.ReadWrite"], KAL_TZ="Europe/Berlin", KAL_H=56, KAL_VON=6, KAL_BIS=20;
const KAL_SICHTEN=[["liste","Liste"],["woche","Woche"],["monat","Monat"]];
const KAL={ab:null,sicht:null,ev:[],geladen:"",lade:false,fehler:"",verbinden:false,demo:[],ebenen:{outlook:true,auftraege:true}};
try{ const e=JSON.parse(localStorage.getItem("irrgang_kal_ebenen")||"null"); if(e) Object.assign(KAL.ebenen,e); }catch(e){}
const kalSicht=()=>{ let s=KAL.sicht; if(!s){ try{ s=localStorage.getItem("irrgang_kal_sicht"); }catch(e){} } if(!s||!KAL_SICHTEN.some(x=>x[0]===s)) s=istHandy()?"liste":"woche"; if(istHandy()&&s==="woche") s="liste"; return s; };
/* --- Datum-Helfer (alles in lokaler Zeit) --- */
const kalTag=d=>{ const x=new Date(d); x.setHours(0,0,0,0); return x; };
const kalPlus=(d,n)=>{ const x=new Date(d); x.setDate(x.getDate()+n); return x; };
const kalMo=d=>{ const x=kalTag(d), w=(x.getDay()+6)%7; return kalPlus(x,-w); };
const kalIso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const kalZeit=d=>`${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
const kalGleich=(a,b)=>kalIso(a)===kalIso(b);
const kalLokal=s=>{ const m=String(s||"").match(/^(\d{4})-(\d\d)-(\d\d)(?:T(\d\d):(\d\d))?/); return m?new Date(+m[1],+m[2]-1,+m[3],+(m[4]||0),+(m[5]||0)):null; };
const kalKw=d=>{ const x=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())), t=x.getUTCDay()||7; x.setUTCDate(x.getUTCDate()+4-t); const j=new Date(Date.UTC(x.getUTCFullYear(),0,1)); return Math.ceil(((x-j)/864e5+1)/7); };
const kalWT=d=>d.toLocaleDateString("de-DE",{weekday:"short"}).replace(".","");
function kalBereich(){ const s=kalSicht(), ab=KAL.ab||new Date();
  if(s==="woche"){ const a=kalMo(ab); return {von:a,bis:kalPlus(a,7)}; }
  if(s==="monat"){ const e=new Date(ab.getFullYear(),ab.getMonth(),1), a=kalMo(e); return {von:a,bis:kalPlus(a,42),monat:e}; }
  const a=kalTag(ab); return {von:a,bis:kalPlus(a,28)}; }
/* --- Zugang zu Outlook --- */
async function kalToken(){ if(typeof Auth==="undefined") return null; if(Auth.test) return Auth.test.kalNein?null:Auth.test.token; if(!Auth.pca||!Auth.account) return null;
  try{ return (await Auth.pca.acquireTokenSilent({scopes:KAL_SCOPES,account:Auth.account})).accessToken; }catch(e){ return null; } }
function kalVerbinden(){ if(typeof Auth==="undefined"||!Auth.pca||!Auth.account){ toast("Erst mit dem Firmenkonto anmelden"); return; } if(typeof saveNow==="function") saveNow(); Auth.pca.acquireTokenRedirect({scopes:KAL_SCOPES,account:Auth.account}); }
async function kalG(pfad,opt={}){ const t=await kalToken(); if(!t){ KAL.verbinden=true; throw Object.assign(new Error("verbinden"),{verbinden:true}); }
  const r=await fetch(pfad.startsWith("http")?pfad:GRAPH+pfad,{...opt,headers:{Authorization:"Bearer "+t,Prefer:`outlook.timezone="${KAL_TZ}"`,...(opt.body?{"Content-Type":"application/json"}:{}),...(opt.headers||{})}});
  if(r.status===401||r.status===403){ KAL.verbinden=true; throw Object.assign(new Error("verbinden"),{verbinden:true}); }
  if(!r.ok){ let m=""; try{ m=(await r.json()).error.message; }catch(e){} throw new Error(m||("Fehler "+r.status)); }
  return r.status===204?null:r.json(); }
const KAL_SEL="subject,start,end,isAllDay,location,bodyPreview,showAs,sensitivity,organizer,attendees,isOrganizer,webLink,isCancelled";
function kalAusOutlook(e){ return {id:e.id,q:"outlook",t:e.subject||"(ohne Titel)",von:kalLokal(e.start&&e.start.dateTime),bis:kalLokal(e.end&&e.end.dateTime),ganz:!!e.isAllDay,
  ort:(e.location&&e.location.displayName)||"",notiz:e.bodyPreview||"",privat:e.sensitivity==="private",frei:e.showAs==="free",eigen:e.isOrganizer!==false,link:e.webLink||"",
  org:e.organizer&&e.organizer.emailAddress?e.organizer.emailAddress.name||e.organizer.emailAddress.address:"",
  mit:(e.attendees||[]).map(a=>({name:(a.emailAddress||{}).name||"",mail:String((a.emailAddress||{}).address||"").toLowerCase(),antw:(a.status||{}).response||""}))}; }
/* Beispieltermine für Präsentation/Demo – relativ zur aktuellen Woche */
function kalDemo(){ if(KAL.demo.length) return KAL.demo; const mo=kalMo(new Date()), z=(tag,h,m,dauer)=>{ const a=kalPlus(mo,tag); a.setHours(h,m||0,0,0); return [a,new Date(a.getTime()+dauer*60e3)]; };
  const mk=(id,t,[von,bis],o={})=>Object.assign({id,q:"outlook",t,von,bis,ganz:false,ort:"",notiz:"",privat:false,frei:false,eigen:true,link:"",org:"",mit:[],demo:true},o);
  const ganz=(tag,n)=>[kalPlus(mo,tag),kalPlus(mo,tag+n)];
  KAL.demo=[mk("demo-t1","Baubesprechung Kunststoffwerk Nordhang",z(1,9,0,90),{ort:"Werk Rommelsdorf, Am Werk 1, 51545 Waldbröl",mit:[{name:"M. Seipp",mail:""}]}),
    mk("demo-t2","Angebot Schreinerei Kraus durchgehen",z(1,14,0,60)),
    mk("demo-t3","Steuerberater",z(2,10,30,60),{privat:true}),
    mk("demo-t4","Übergabe Neubau Hoffmann",z(3,13,0,60),{ort:"Lindenweg 7, 51545 Waldbröl",mit:[{name:"A. Brandl",mail:""}]}),
    mk("demo-t5","Innungsversammlung",z(3,18,0,120),{ort:"Gummersbach"}),
    mk("demo-t6","Urlaub A. Brandl",ganz(4,1),{ganz:true,frei:true}),
    mk("demo-t7","Lieferung Hager-Verteiler",z(0,7,30,30),{ort:"Lager"}),
    mk("demo-t8","Kundentermin Jonas Kessler – Wallbox-Erweiterung",z(7,8,0,90),{ort:"Am Sonnenhang 1, 51545 Waldbröl"})];
  return KAL.demo; }
/* Auftragstermine aus den Vorgängen (Schritt „Termin“) */
function kalAuftraege(){ if(!KAL.ebenen.auftraege||typeof live!=="function"||!DB.vorgaenge) return [];
  return live("vorgaenge").filter(v=>v.typ!=="meldung"&&!v.deleted&&v.s&&v.s.termin&&v.s.termin.datum).map(v=>{ const T=v.s.termin, a=kalLokal(T.datum), m=String(T.zeit||"").match(/(\d{1,2})[:.](\d\d)/);
    if(!a) return null; let ganz=!m; if(m) a.setHours(+m[1],+m[2],0,0); const b=ganz?kalPlus(a,1):new Date(a.getTime()+2*3600e3);
    return {id:"vg-"+v.id,vg:v.id,q:"auftrag",t:`${typeof vgKunde==="function"?vgKunde(v):"Auftrag"} – ${String(v.anliegen||"").slice(0,60)}`,von:a,bis:b,ganz,ort:(v.kundeId&&typeof kundeOf==="function"&&kundeOf(v.kundeId)&&typeof adrText==="function")?adrText(kundeOf(v.kundeId)):"",
      notiz:[T.mit&&`Mit ${T.mit}`,v.s.auftrag&&v.s.auftrag.nr&&`Auftrag ${v.s.auftrag.nr}`].filter(Boolean).join(" · "),mit:T.mit?[{name:T.mit,mail:""}]:[],eigen:false,erledigt:!!(v.s.ausgefuehrt||v.s.erledigt)}; }).filter(Boolean); }
function kalAlle(von,bis){ const demo=typeof demoAn==="function"&&demoAn();
  const O=!KAL.ebenen.outlook?[]:demo?kalDemo():KAL.ev;
  return [...O,...kalAuftraege()].filter(e=>e.von&&e.bis&&e.von<bis&&(e.bis>von||(+e.bis===+e.von&&e.von>=von))).sort((a,b)=>(b.ganz-a.ganz)||a.von-b.von); }
/* Laden: Bereich der aktuellen Ansicht (+ eine Woche Puffer), letzter Stand bleibt fürs Offline-Anschauen */
try{ const c=JSON.parse(localStorage.getItem("irrgang_kal_cache")||"null"); if(c&&Array.isArray(c.ev)){ KAL.ev=c.ev.map(e=>({...e,von:new Date(e.von),bis:new Date(e.bis)})); KAL.cacheAm=c.am; } }catch(e){}
async function kalLaden(erzwingen){ if(typeof demoAn==="function"&&demoAn()) return; const {von,bis}=kalBereich(), a=kalPlus(von,-7), b=kalPlus(bis,7), key=kalIso(a)+"|"+kalIso(b);
  if(KAL.lade||(!erzwingen&&KAL.geladen===key&&Date.now()-(KAL.am||0)<120e3)) return; KAL.lade=true; KAL.fehler="";
  try{ let url=`/me/calendarView?startDateTime=${a.toISOString()}&endDateTime=${b.toISOString()}&$top=250&$orderby=start/dateTime&$select=${KAL_SEL}`, L=[];
    for(let n=0;url&&n<8;n++){ const r=await kalG(url); L.push(...(r.value||[])); url=r["@odata.nextLink"]||""; }
    const neu=L.filter(e=>!e.isCancelled).map(kalAusOutlook), ids=new Set(neu.map(e=>e.id));
    KAL.ev=[...KAL.ev.filter(e=>!ids.has(e.id)&&(e.bis<=a||e.von>=b)),...neu]; KAL.geladen=key; KAL.am=Date.now(); KAL.verbinden=false;
    try{ const behalten=KAL.ev.filter(e=>e.bis>kalPlus(new Date(),-14)&&e.von<kalPlus(new Date(),60)).slice(0,600); localStorage.setItem("irrgang_kal_cache",JSON.stringify({am:Date.now(),ev:behalten})); }catch(e){}
  }catch(e){ if(!e.verbinden) KAL.fehler=navigator.onLine?(e.message||"Kalender nicht erreichbar"):"Offline – zuletzt geladener Stand"; }
  KAL.lade=false; if(nav.v==="kalender"||nav.v==="start") (typeof softRender==="function"?softRender:render)(); }
/* --- Darstellung --- */
const kalFarbe=e=>e.q==="auftrag"?"kal-a":e.frei?"kal-f":"kal-o";
const kalTxtZeit=e=>e.ganz?"ganztägig":`${kalZeit(e.von)}–${kalZeit(e.bis)}`;
function kalKopf(){ const s=kalSicht(), B=kalBereich(), h=new Date();
  let titel=""; if(s==="woche"){ const e=kalPlus(B.von,6); titel=`KW ${kalKw(B.von)} · ${B.von.getDate()}.${B.von.getMonth()!==e.getMonth()?" "+B.von.toLocaleDateString("de-DE",{month:"short"}):""} – ${e.getDate()}. ${e.toLocaleDateString("de-DE",{month:"long",year:"numeric"})}`; }
  else if(s==="monat") titel=B.monat.toLocaleDateString("de-DE",{month:"long",year:"numeric"});
  else titel=kalGleich(B.von,h)?"Ab heute":`Ab ${B.von.toLocaleDateString("de-DE",{weekday:"short",day:"numeric",month:"long"})}`;
  const sichten=KAL_SICHTEN.filter(x=>!(istHandy()&&x[0]==="woche"));
  const demo=typeof demoAn==="function"&&demoAn();
  return `<div class="kal-kopf"><div class="kal-nav"><button class="kal-rund" data-act="kalSchritt" data-v="-1" aria-label="Zurück">${icon("back")}</button><button class="btn-tonal kal-heute" data-act="kalHeute">Heute</button><button class="kal-rund vor" data-act="kalSchritt" data-v="1" aria-label="Weiter">${icon("back")}</button><h2 class="kal-titel">${esc(titel)}</h2></div>
    ${seg("kalSicht",s,sichten,"kal-seg")}</div>
    <div class="chips kal-ebenen"><button class="chip" data-act="kalEbene" data-v="outlook" aria-pressed="${KAL.ebenen.outlook}"><i class="kal-punkt kal-o"></i>${demo?"Beispieltermine":"Mein Outlook"}</button><button class="chip" data-act="kalEbene" data-v="auftraege" aria-pressed="${KAL.ebenen.auftraege}"><i class="kal-punkt kal-a"></i>Auftragstermine</button>
      ${KAL.lade?`<span class="kal-stand">lädt …</span>`:KAL.fehler?`<span class="kal-stand warn">${esc(KAL.fehler)}</span>`:""}</div>`; }
function kalVerbindenKarte(){ return `<div class="kal-verb"><span class="kal-verb-ic">${icon("kal")}</span><div><b>Outlook-Kalender verbinden</b><p>Einmal bestätigen, dann siehst du hier deine Outlook-Termine und kannst neue anlegen. Die Auftragstermine siehst du auch ohne.</p><p class="sup">Erscheint bei Microsoft „Genehmigung durch Administrator erforderlich“, muss der Chef oder Alex die Kalender-Berechtigung der App einmal freigeben.</p></div><button class="btn-filled" data-act="kalVerbinden">Verbinden</button></div>`; }
function kalenderView(){ const s=kalSicht(), B=kalBereich(), demo=typeof demoAn==="function"&&demoAn();
  if(!demo&&KAL.ebenen.outlook) setTimeout(()=>kalLaden(),0);
  const E=kalAlle(B.von,B.bis);
  const inhalt=s==="woche"?kalWoche(B,E):s==="monat"?kalMonat(B,E):kalListe(B,E);
  return `<div class="narrow kal-seite kal-s-${s}">${kalKopf()}${!demo&&KAL.ebenen.outlook&&KAL.verbinden?kalVerbindenKarte():""}${inhalt}</div>`; }
const kalEvAttr=e=>`data-act="kalAuf" data-id="${esc(e.id)}"`;
function kalListe(B,E){ let h=""; for(let d=new Date(B.von);d<B.bis;d=kalPlus(d,1)){ const T=E.filter(e=>e.von<kalPlus(d,1)&&e.bis>d), heute=kalGleich(d,new Date());
    if(!T.length&&!heute) continue;
    h+=`<div class="kal-ltag${heute?" heute":""}"><div class="kal-ld"><b>${d.getDate()}</b><span>${esc(kalWT(d))}</span><small>${esc(d.toLocaleDateString("de-DE",{month:"short"}))}</small></div><div class="kal-lev">${T.length?T.map(e=>`<div class="kal-li ${kalFarbe(e)}${e.erledigt?" erl":""}" role="button" tabindex="0" ${kalEvAttr(e)}><span class="kal-lz">${esc(e.ganz?"ganztägig":kalGleich(e.von,d)?kalZeit(e.von):"weiter")}${!e.ganz&&kalGleich(e.von,d)?`<small>${esc(kalZeit(e.bis))}</small>`:""}</span><span class="kal-lt"><b>${esc(e.privat&&!e.eigen?"Privat":e.t)}</b>${e.ort?`<small>${icon("kalOrt")}${esc(e.ort)}</small>`:""}${e.mit&&e.mit.length?`<small>${icon("kalLeute")}${esc(e.mit.map(m=>m.name||m.mail).join(", "))}</small>`:""}</span></div>`).join(""):`<p class="kal-nix">Keine Termine</p>`}</div></div>`; }
  return h||`<p class="meta" style="margin:20px 4px">In den nächsten vier Wochen keine Termine.</p>`; }
/* Überlappende Termine eines Tages nebeneinander */
function kalSpalten(T){ const L=T.slice().sort((a,b)=>a.von-b.von||b.bis-a.bis), out=[]; let gruppe=[], ende=0;
  const fertig=()=>{ const sp=[]; gruppe.forEach(e=>{ let i=sp.findIndex(x=>x<=e.von); if(i<0){ i=sp.length; sp.push(0); } sp[i]=e.bis; out.push({e,i}); }); out.filter(x=>gruppe.includes(x.e)).forEach(x=>x.n=sp.length); gruppe=[]; };
  L.forEach(e=>{ if(gruppe.length&&e.von>=ende) fertig(); gruppe.push(e); ende=Math.max(ende,+e.bis); }); if(gruppe.length) fertig(); return out; }
function kalWoche(B,E){ const tage=[...Array(7)].map((_,i)=>kalPlus(B.von,i)), jetzt=new Date();
  let von=KAL_VON, bis=KAL_BIS; E.filter(e=>!e.ganz).forEach(e=>{ von=Math.min(von,e.von.getHours()); bis=Math.max(bis,Math.min(24,e.bis.getHours()+(e.bis.getMinutes()?1:0))); });
  const ganz=E.filter(e=>e.ganz||(e.bis-e.von)>=864e5);
  const kopf=`<div class="kal-wk"><span></span>${tage.map(d=>`<div class="kal-wkt${kalGleich(d,jetzt)?" heute":""}"><small>${esc(kalWT(d))}</small><b>${d.getDate()}</b></div>`).join("")}</div>`;
  const ganzZ=ganz.length?`<div class="kal-wg"><span class="kal-wgl">ganztägig</span>${tage.map(d=>`<div class="kal-wgt">${ganz.filter(e=>e.von<kalPlus(d,1)&&e.bis>d).map(e=>`<div class="kal-ev kal-evg ${kalFarbe(e)}" ${kalEvAttr(e)} role="button" tabindex="0">${esc(e.t)}</div>`).join("")}</div>`).join("")}</div>`:"";
  const std=[...Array(bis-von)].map((_,i)=>`<div class="kal-std" style="top:${i*KAL_H}px"><span>${von+i}:00</span></div>`).join("");
  const spalten=tage.map(d=>{ const T=E.filter(e=>!e.ganz&&(e.bis-e.von)<864e5&&e.von<kalPlus(d,1)&&e.bis>d);
    const ev=kalSpalten(T).map(({e,i,n})=>{ const a=new Date(Math.max(e.von,new Date(d.getFullYear(),d.getMonth(),d.getDate(),von))), b=new Date(Math.min(e.bis,new Date(d.getFullYear(),d.getMonth(),d.getDate(),bis))), top=((a.getHours()-von)*60+a.getMinutes())/60*KAL_H, hoch=Math.max(22,(b-a)/36e5*KAL_H-2);
      return `<div class="kal-ev ${kalFarbe(e)}${e.erledigt?" erl":""}${hoch<44?" klein":""}" ${kalEvAttr(e)} role="button" tabindex="0" style="top:${top}px;height:${hoch}px;left:calc(${i/n*100}% + 2px);width:calc(${100/n}% - 4px)"><b>${esc(e.privat&&!e.eigen?"Privat":e.t)}</b><small>${esc(kalZeit(e.von))}${e.ort&&hoch>=60?` · ${esc(e.ort)}`:""}</small></div>`; }).join("");
    const jl=kalGleich(d,jetzt)&&jetzt.getHours()>=von&&jetzt.getHours()<bis?`<i class="kal-jetzt" style="top:${((jetzt.getHours()-von)*60+jetzt.getMinutes())/60*KAL_H}px"></i>`:"";
    return `<div class="kal-wsp${kalGleich(d,jetzt)?" heute":""}" data-act="kalFrei" data-d="${kalIso(d)}" data-von="${von}">${ev}${jl}</div>`; }).join("");
  return `<div class="kal-woche">${kopf}${ganzZ}<div class="kal-wr" style="height:${(bis-von)*KAL_H}px">${std}<div class="kal-wsps">${spalten}</div></div></div>`; }
function kalMonat(B,E){ const jetzt=new Date(), mon=B.monat.getMonth();
  const kopf=[...Array(7)].map((_,i)=>`<div class="kal-mk">${esc(kalWT(kalPlus(B.von,i)))}</div>`).join("");
  const zellen=[...Array(42)].map((_,i)=>{ const d=kalPlus(B.von,i), T=E.filter(e=>e.von<kalPlus(d,1)&&e.bis>d), max=istHandy()?2:3;
    return `<div class="kal-mz${d.getMonth()!==mon?" fremd":""}${kalGleich(d,jetzt)?" heute":""}" data-act="kalTagAuf" data-d="${kalIso(d)}" role="button" tabindex="0"><span class="kal-mn">${d.getDate()}</span>${T.slice(0,max).map(e=>`<span class="kal-mev ${kalFarbe(e)}">${istHandy()?"":`${e.ganz?"":esc(kalZeit(e.von))+" "}`}${esc(e.privat&&!e.eigen?"Privat":e.t)}</span>`).join("")}${T.length>max?`<span class="kal-mmehr">+${T.length-max}</span>`:""}</div>`; }).join("");
  return `<div class="kal-monat"><div class="kal-mkopf">${kopf}</div><div class="kal-mgrid">${zellen}</div></div>`; }
/* --- Kachel auf der Startseite --- */
function kalKachel(anz,zeile,leer,gross){ const h=kalTag(new Date()), demo=typeof demoAn==="function"&&demoAn(); if(!demo&&KAL.ebenen.outlook&&!KAL.verbinden) setTimeout(()=>kalLadenStart(),0);
  const E=kalAlle(h,kalPlus(h,7)).filter(e=>e.bis>new Date()).sort((a,b)=>a.von-b.von||(b.ganz-a.ganz)), heute=E.filter(e=>e.von<kalPlus(h,1));
  const wann=e=>kalGleich(e.von,h)||(e.ganz&&e.von<=h)?(e.ganz?"heute":`heute ${kalZeit(e.von)}`):kalGleich(e.von,kalPlus(h,1))?(e.ganz?"morgen":`morgen ${kalZeit(e.von)}`):e.von.toLocaleDateString("de-DE",{weekday:"short",day:"numeric",month:"numeric"})+(e.ganz?"":` ${kalZeit(e.von)}`);
  return {ic:"kal",v:"kalender",sub:heute.length?`${heute.length} heute`:E.length?`nächster ${wann(E[0])}`:"Keine Termine diese Woche",plus:["kalNeu","Termin anlegen"],
    s:()=>gross(heute.length,"heute"),
    m:g=>E.length?E.slice(0,anz(g)).map(e=>zeile(e.privat&&!e.eigen?"Privat":e.t,[wann(e),e.ort].filter(Boolean).join(" · "))).join(""):leer(!demo&&KAL.verbinden?"Outlook noch nicht verbunden – im Kalender auf „Verbinden“.":"Keine Termine in den nächsten 7 Tagen.",true)}; }
/* Startseite lädt nur die nächsten Tage – unabhängig davon, welche Ansicht der Kalender gerade hat */
async function kalLadenStart(){ if(KAL.startAm&&Date.now()-KAL.startAm<300e3) return; KAL.startAm=Date.now(); const s=KAL.sicht, ab=KAL.ab; KAL.sicht="liste"; KAL.ab=new Date(); const k=KAL.geladen; KAL.geladen=""; try{ await kalLaden(true); }finally{ KAL.sicht=s; KAL.ab=ab; if(!KAL.geladen) KAL.geladen=k; } }
/* --- Termin anlegen / ändern --- */
let kalE=null;
function kalOrtListe(){ try{ return live("kunden").map(k=>[k.name,adrText(k)].filter(Boolean).join(", ")).concat(live("standorte").map(s=>{ const k=kundeOf(s.kundeId); return [k&&k.name,s.name,adrText(s)].filter(Boolean).join(", "); })); }catch(e){ return []; } }
function kalDialog(e,vor){ const neu=!e; const d=vor||kalTag(KAL.ab&&kalSicht()!=="liste"?new Date():new Date()), start=e?e.von:(()=>{ const x=new Date(d); if(!vor||!vor.getHours()){ const j=new Date(); x.setHours(kalGleich(x,j)?Math.min(20,j.getHours()+1):8,0,0,0); } return x; })();
  const ende=e?e.bis:new Date(start.getTime()+3600e3), ganz=e?e.ganz:false, ganzEnde=ganz?kalPlus(ende,-1):ende;
  kalE={id:e&&e.id,ganz,mit:new Set((e&&e.mit||[]).map(m=>m.mail).filter(Boolean)),mitAlt:(e&&e.mit||[]).filter(m=>m.mail)};
  const T=(typeof team==="function"?team():[]).filter(m=>m.mail&&String(m.mail).toLowerCase()!==String(ME.mail||"").toLowerCase());
  dialog(neu?"Neuer Termin":"Termin",`<div class="fg1">${tf("kalT","Titel",e?e.t:"",{form:true,ph:"z. B. Kundentermin, Baubesprechung"})}
    <div class="vg-drw"><span>Dauer</span>${seg("kalGanz",ganz?"1":"0",[["0","Mit Uhrzeit"],["1","Ganztägig"]])}</div>
    <div class="kal-zeiten${ganz?" ganz":""}">${tf("kalD","Beginn",kalIso(start),{form:true,type:"date"})}<span class="kal-uz">${tf("kalVon","Von",kalZeit(start),{form:true,type:"time",ph:"08:00"})}${tf("kalBis","Bis",kalZeit(ende),{form:true,type:"time",ph:"09:00"})}</span><span class="kal-gz">${tf("kalDE","Ende",kalIso(ganzEnde),{form:true,type:"date"})}</span></div>
    ${tf("kalOrt","Ort (optional)",e?e.ort:"",{form:true,list:"kalOrte",ph:"Kunde oder Adresse"})}${datalist("kalOrte",kalOrtListe())}
    ${T.length?`<div class="lbl" style="margin:12px 4px 6px">Mit – bekommen den Termin als Einladung in ihren Kalender</div><div class="chips kal-mit">${T.map(m=>`<button type="button" class="chip" data-act="kalMit" data-v="${esc(String(m.mail).toLowerCase())}" aria-pressed="${kalE.mit.has(String(m.mail).toLowerCase())}">${esc(m.name||m.mail)}</button>`).join("")}</div>`:""}
    ${ta("kalN","Notiz (optional)",e?e.notiz:"",{form:true,ph:"z. B. Schlüssel beim Nachbarn, Unterlagen mitbringen"})}</div>`,
    `${!neu?`<button class="btn-text danger" data-act="kalDel">Löschen</button>`:""}<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="kalOk">Speichern</button>`); }
/* fremde Termine (Einladungen) und Auftragstermine: nur ansehen */
function kalAnsehen(e){ const z=(ic,t)=>t?`<p class="kal-dz">${icon(ic)}<span>${esc(t)}</span></p>`:"";
  const wann=e.ganz?`${e.von.toLocaleDateString("de-DE",{weekday:"long",day:"numeric",month:"long"})}${(e.bis-e.von)>864e5?` – ${kalPlus(e.bis,-1).toLocaleDateString("de-DE",{day:"numeric",month:"long"})}`:""} · ganztägig`:`${e.von.toLocaleDateString("de-DE",{weekday:"long",day:"numeric",month:"long"})} · ${kalZeit(e.von)}–${kalZeit(e.bis)} Uhr`;
  dialog(e.privat&&!e.eigen?"Privat":e.t,`${z("kalUhr",wann)}${z("kalOrt",e.ort)}${z("kalLeute",(e.mit||[]).map(m=>m.name||m.mail).join(", "))}${e.org&&!e.eigen?z("person","Eingeladen von "+e.org):""}${e.notiz?`<p class="kal-dn">${esc(e.notiz)}</p>`:""}
    ${e.q==="auftrag"?`<p class="sup" style="margin:12px 4px 0">Termin aus einem Auftrag – ändern im Auftrag selbst.</p>`:""}`,
    `<span style="flex:1"></span>${e.q==="auftrag"?`<button class="btn-text" data-act="kalZumVg" data-id="${esc(e.vg)}">Auftrag öffnen</button>`:e.link?`<a class="btn-text" href="${esc(e.link)}" target="_blank" rel="noopener">In Outlook öffnen</a>`:""}<button class="btn-text" data-act="cancel">Schließen</button>`); }
function kalAus(F){ const ganz=kalE.ganz, d=F.kalD||kalIso(new Date());
  if(ganz){ const e=F.kalDE&&F.kalDE>=d?F.kalDE:d, b=kalPlus(kalLokal(e),1); return {von:`${d}T00:00:00`,bis:`${kalIso(b)}T00:00:00`,ganz}; }
  const v=/^\d\d:\d\d$/.test(F.kalVon)?F.kalVon:"08:00"; let b=/^\d\d:\d\d$/.test(F.kalBis)?F.kalBis:""; if(!b||b<=v){ const x=kalLokal(`${d}T${v}`); x.setHours(x.getHours()+1); b=kalZeit(x); }
  return {von:`${d}T${v}:00`,bis:`${d}T${b}:00`,ganz}; }
async function kalSpeichern(){ const F=formVals(); if(!F.kalT){ toast("Bitte einen Titel eintragen"); document.getElementById("f_kalT")?.focus(); return; }
  const z=kalAus(F), T=(typeof team==="function"?team():[]), demo=typeof demoAn==="function"&&demoAn();
  const mit=[...kalE.mit].map(m=>{ const t=T.find(x=>String(x.mail).toLowerCase()===m); return {emailAddress:{address:m,name:t?t.name:m},type:"required"}; });
  const body={subject:F.kalT,start:{dateTime:z.von,timeZone:KAL_TZ},end:{dateTime:z.bis,timeZone:KAL_TZ},isAllDay:z.ganz,location:{displayName:F.kalOrt||""},body:{contentType:"text",content:F.kalN||""},attendees:mit};
  if(demo){ const e={id:kalE.id||"demo-t"+uid(),q:"outlook",t:F.kalT,von:kalLokal(z.von),bis:kalLokal(z.bis),ganz:z.ganz,ort:F.kalOrt||"",notiz:F.kalN||"",mit:mit.map(a=>({name:a.emailAddress.name,mail:a.emailAddress.address})),eigen:true,demo:true};
    KAL.demo=[...kalDemo().filter(x=>x.id!==e.id),e]; closeOverlays(); render(); toast("Termin gespeichert (Beispiel)"); return; }
  const btn=document.querySelector('#dlg [data-act="kalOk"]'); if(btn){ btn.disabled=true; btn.textContent="Speichert …"; }
  try{ const r=kalE.id?await kalG(`/me/events/${encodeURIComponent(kalE.id)}`,{method:"PATCH",body:JSON.stringify(body)}):await kalG("/me/events",{method:"POST",body:JSON.stringify(body)});
    const e=kalAusOutlook(r||{...body,id:kalE.id}); KAL.ev=[...KAL.ev.filter(x=>x.id!==e.id),e]; closeOverlays(); render(); toast(mit.length&&!kalE.id?"Termin gespeichert – Einladungen verschickt":"Termin gespeichert"); kalLaden(true); }
  catch(err){ if(btn){ btn.disabled=false; btn.textContent="Speichern"; } toast(err.verbinden?"Outlook ist nicht verbunden":"Nicht gespeichert: "+(err.message||"Fehler")); } }
async function kalLoeschen(){ const id=kalE&&kalE.id; if(!id) return; const demo=typeof demoAn==="function"&&demoAn();
  if(demo){ KAL.demo=kalDemo().filter(x=>x.id!==id); closeOverlays(); render(); return; }
  try{ await kalG(`/me/events/${encodeURIComponent(id)}`,{method:"DELETE"}); KAL.ev=KAL.ev.filter(x=>x.id!==id); closeOverlays(); render(); toast("Termin gelöscht"); }
  catch(err){ toast("Nicht gelöscht: "+(err.message||"Fehler")); } }
function kalFinde(id){ const demo=typeof demoAn==="function"&&demoAn(); return [...(demo?kalDemo():KAL.ev),...kalAuftraege()].find(e=>e.id===id); }
document.addEventListener("click",ev=>{ const b=ev.target.closest&&ev.target.closest('[data-act^="kal"]'); if(!b) return; const a=b.dataset.act;
  const seg1=()=>{ b.parentElement.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x===b))); if(typeof segInd==="function") segInd(); };
  if(a==="kalAuf"){ ev.stopPropagation(); const e=kalFinde(b.dataset.id); if(!e) return; if(e.q==="outlook"&&e.eigen&&!(e.privat&&!e.eigen)) kalDialog(e); else kalAnsehen(e); }
  else if(a==="kalFrei"){ if(ev.target.closest(".kal-ev")) return; const r=b.getBoundingClientRect(), h=Math.floor((ev.clientY-r.top)/KAL_H*2)/2+(+b.dataset.von||KAL_VON), d=kalLokal(b.dataset.d); d.setHours(Math.floor(h),h%1?30:0,0,0); kalDialog(null,d); }
  else if(a==="kalTagAuf"){ KAL.ab=kalLokal(b.dataset.d); KAL.sicht=istHandy()?"liste":"woche"; try{ localStorage.setItem("irrgang_kal_sicht",KAL.sicht); }catch(e){} render(); }
  else if(a==="kalNeu"){ ev.stopPropagation(); kalDialog(null); }
  else if(a==="kalSicht"){ KAL.sicht=b.dataset.v; try{ localStorage.setItem("irrgang_kal_sicht",KAL.sicht); }catch(e){} render(); }
  else if(a==="kalSchritt"){ const s=kalSicht(), n=+b.dataset.v, ab=KAL.ab||new Date(); KAL.ab=s==="woche"?kalPlus(ab,7*n):s==="monat"?new Date(ab.getFullYear(),ab.getMonth()+n,1):kalPlus(ab,14*n); render(); }
  else if(a==="kalHeute"){ KAL.ab=null; render(); }
  else if(a==="kalEbene"){ const k=b.dataset.v; KAL.ebenen[k]=!KAL.ebenen[k]; try{ localStorage.setItem("irrgang_kal_ebenen",JSON.stringify(KAL.ebenen)); }catch(e){} render(); }
  else if(a==="kalVerbinden") kalVerbinden();
  else if(a==="kalGanz"){ kalE.ganz=b.dataset.v==="1"; seg1(); document.querySelector("#dlg .kal-zeiten")?.classList.toggle("ganz",kalE.ganz); }
  else if(a==="kalMit"){ const m=b.dataset.v; if(kalE.mit.has(m)) kalE.mit.delete(m); else kalE.mit.add(m); b.setAttribute("aria-pressed",String(kalE.mit.has(m))); }
  else if(a==="kalOk") kalSpeichern();
  else if(a==="kalDel") confirmDlg("Termin löschen?","Der Termin wird auch in Outlook gelöscht. Eingeladene bekommen eine Absage.","Löschen","kalDelJa");
  else if(a==="kalDelJa") kalLoeschen();
  else if(a==="kalZumVg"){ closeOverlays(); const v=DB.vorgaenge&&DB.vorgaenge.get(b.dataset.id); if(v&&typeof vgOpen==="function") vgOpen(v); }
},true);
