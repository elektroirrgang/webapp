/* ===== Kalender (Übersicht) =====
   Zeigt den eigenen Outlook-Kalender (Microsoft Graph) und die Auftragstermine aus den Vorgängen. Termine lassen sich hier anlegen,
   ändern und löschen – Outlook muss dafür nicht geöffnet werden. Kollegen unter „Mit“ bekommen den Termin als Einladung in ihren Kalender.
   Recht „Calendars.ReadWrite“ wird erst beim ersten Öffnen des Kalenders angefragt (eigener Token), damit die übrige App davon unabhängig bleibt.
   Präsentation/Demo: dann nie echte Outlook-Termine, sondern Beispieltermine im Speicher. */
Object.assign(IC,{kal:"M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z",
  kalOrt:"M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z",
  kalUhr:"M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z",
  kalWoche:"M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM8 18H4V6h4v12zm6 0h-4V6h4v12zm6 0h-4V6h4v12z",
  kalMonat:"M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM8 11H4V6h4v5zm6 0h-4V6h4v5zm6 0h-4V6h4v5zM8 18H4v-5h4v5zm6 0h-4v-5h4v5zm6 0h-4v-5h4v5z",
  kalListe:"M19 13H5c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2zm0 6H5v-4h14v4zm0-16H5c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 6H5V5h14v4z",
  kalPane:"M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4 16H5V5h10v14zm4 0h-2V5h2v14z",
  kalLeute:"M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"});
const KAL_SCOPES=["Calendars.ReadWrite"], KAL_TZ="Europe/Berlin", KAL_H=56, KAL_VON=0, KAL_BIS=24; /* ganzer Tag – der Chef parkt Platzhalter gern nachts um 2–3 Uhr */
const KAL_SICHTEN=[["liste","Liste"],["woche","Woche"],["monat","Monat"]];
const KAL={ab:null,sicht:null,ev:[],geladen:"",lade:false,fehler:"",verbinden:false,demo:[],ebenen:{outlook:true,auftraege:true,firma:true,meine:null}};
try{ const e=JSON.parse(localStorage.getItem("irrgang_kal_ebenen")||"null"); if(e) Object.assign(KAL.ebenen,e); }catch(e){}
function kalEbenenMerken(){ try{ localStorage.setItem("irrgang_kal_ebenen",JSON.stringify(KAL.ebenen)); }catch(e){} }
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
function kalVerbinden(){ try{ localStorage.removeItem(KAL_NEIN); }catch(e){} if(typeof Auth==="undefined"||!Auth.pca||!Auth.account){ toast("Erst mit dem Firmenkonto anmelden"); return; } if(typeof saveNow==="function") saveNow(); Auth.pca.acquireTokenRedirect({scopes:KAL_SCOPES,account:Auth.account}); }
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
/* Wer bin ich in den Auftragsterminen? Dort stehen Namen („M. Pevec, A. Brandl“) */
function kalIchNamen(){ const n=new Set([String(ME.name||"").trim()]); try{ const t=(typeof team==="function"?team():[]).find(x=>String(x.mail||"").toLowerCase()===String(ME.mail||"").toLowerCase()); if(t&&t.name) n.add(t.name); }catch(e){} n.delete(""); return n; }
const kalNurMeine=()=>KAL.ebenen.meine===null?!(typeof istBuero==="function"&&istBuero()):!!KAL.ebenen.meine; /* Büro sieht standardmäßig alle, Monteure nur ihre */
const kalUhr=t=>{ const m=String(t||"").match(/(\d{1,2})(?:[:.](\d\d))?/); return m?[+m[1],+(m[2]||0)]:null; };
function kalAuftraege(){ if(!KAL.ebenen.auftraege||typeof live!=="function"||!DB.vorgaenge) return []; const ich=kalIchNamen(), nur=kalNurMeine();
  return live("vorgaenge").filter(v=>v.typ!=="meldung"&&!v.deleted&&!v.abgelehnt&&v.s&&v.s.termin&&v.s.termin.datum).filter(v=>{ if(!nur) return true; return mitIch(v.s.termin)||(typeof vgZustIch==="function"&&vgZustIch(v)); }).map(v=>{ const T=v.s.termin, a=kalLokal(T.datum), m=kalUhr(T.zeit), e=kalUhr(T.bis);
    if(!a) return null; let ganz=!m; if(m) a.setHours(m[0],m[1],0,0); let b=ganz?kalPlus(a,1):new Date(a.getTime()+2*3600e3); if(!ganz&&e){ const x=new Date(a); x.setHours(e[0],e[1],0,0); if(x>a) b=x; }
    return {id:"vg-"+v.id,vg:v.id,q:"auftrag",t:`${typeof vgKunde==="function"?vgKunde(v):"Auftrag"} – ${String(v.anliegen||"").slice(0,60)}`,von:a,bis:b,ganz,ort:(v.kundeId&&typeof kundeOf==="function"&&kundeOf(v.kundeId)&&typeof adrText==="function")?adrText(kundeOf(v.kundeId)):"",
      notiz:[v.s.auftrag&&v.s.auftrag.nr&&`Auftrag ${v.s.auftrag.nr}`].filter(Boolean).join(" · "),mit:mitListe(T),eigen:false,erledigt:!!(v.s.ausgefuehrt||v.erledigt)}; }).filter(Boolean); }
/* ===== Eigene Kalender (ohne Outlook): liegen wie die Firmentermine in den Irrgang-Apps (Art „termine“, typ:"kal").
   Reservierte Farben: Outlook rot, Aufträge blau, Firmentermine grün. Eigene Kalender wählen aus der übrigen Palette –
   eine Farbe gibt es nur einmal (bei „für alle“ sichtbaren Kalendern firmenweit, sonst unter den Kalendern, die man selbst sieht). ===== */
const KAL_PAL=[["#e8710a","Orange"],["#f2b400","Gelb"],["#8e44ad","Lila"],["#00a3a3","Türkis"],["#d6336c","Pink"],["#8d6e63","Braun"],["#546e7a","Schiefer"],["#7c8b2a","Oliv"]];
const KAL_SICHT=[["ich","Nur ich"],["personen","Ausgewählte"],["alle","Alle"]];
const kalIchMail=()=>String(ME.mail||"").toLowerCase();
/* ===== Privater Bereich: „Nur ich“-Kalender liegen im eigenen OneDrive (App-Ordner, Berechtigung Files.ReadWrite.AppFolder).
   Dort sieht sie niemand außer dem Mitarbeiter selbst (Ausnahme: Microsoft-Administrator im Notfall).
   Solange die Berechtigung fehlt, liegen sie wie alles andere auf der SharePoint-Website und ziehen später von selbst um. ===== */
const KALP={ok:null,kal:[],t:[],am:0,lade:null,timer:0,offen:false}, KALP_SC=["Files.ReadWrite.AppFolder"], KALP_LS="irrgang_kal_privat";
const kalDemoAn=()=>typeof demoAn==="function"&&demoAn();
const kalPAn=()=>KALP.ok===true&&!kalDemoAn();
/* private Daten nur für den Mitarbeiter, dem sie gehören (falls sich mehrere ein Gerät teilen) */
const kalPMeins=()=>!kalDemoAn()&&!!KALP.mail&&KALP.mail===kalIchMail();
const kalPK=()=>kalPMeins()?KALP.kal:[], kalPT=()=>kalPMeins()?KALP.t:[];
const kalPDatei=()=>GRAPH+"/me/drive/special/approot:/kalender.json:/content";
try{ const c=JSON.parse(localStorage.getItem(KALP_LS)||"null"); if(c&&c.mail){ KALP.kal=c.kal||[]; KALP.t=c.t||[]; KALP.mail=c.mail; KALP.offen=!!c.offen; } }catch(e){}
function kalPCache(){ try{ localStorage.setItem(KALP_LS,JSON.stringify({mail:kalIchMail(),kal:KALP.kal,t:KALP.t,offen:KALP.offen})); }catch(e){} }
async function kalPToken(){ if(typeof Auth==="undefined") return null; if(Auth.test) return Auth.test.ordnerNein?null:Auth.test.token; if(!Auth.pca||!Auth.account) return null;
  try{ return (await Auth.pca.acquireTokenSilent({scopes:KALP_SC,account:Auth.account})).accessToken; }catch(e){ return null; } }
function kalPMischen(d){ const m=(alt,neu)=>{ const M=new Map(alt.map(x=>[x.id,x])); (neu||[]).forEach(x=>{ const a=M.get(x.id); if(!a||(x.upd||0)>(a.upd||0)) M.set(x.id,{...x,privat:true}); });
    const grenze=Date.now()-30*864e5; return [...M.values()].filter(x=>!(x.deleted&&(x.upd||0)<grenze)); };
  KALP.kal=m(KALP.kal,d&&d.kal); KALP.t=m(KALP.t,d&&d.t); }
async function kalPLaden(){ if(kalDemoAn()||KALP.lade) return; if(KALP.ok===false&&Date.now()-KALP.am<600e3) return; if(KALP.ok===true&&Date.now()-KALP.am<60e3){ kalPUmzug(); return; }
  KALP.am=Date.now(); if(KALP.mail&&KALP.mail!==kalIchMail()){ KALP.kal=[]; KALP.t=[]; KALP.offen=false; } KALP.mail=kalIchMail();
  const vorher=JSON.stringify([KALP.kal,KALP.t,KALP.ok]);
  KALP.lade=(async()=>{ const t=await kalPToken(); if(!t){ KALP.ok=false; return; }
    try{ const r=await fetch(kalPDatei(),{headers:{Authorization:"Bearer "+t}});
      if(r.status===404){ KALP.ok=true; return; } if(r.status===401||r.status===403){ KALP.ok=false; return; } if(!r.ok) return;
      kalPMischen(await r.json()); KALP.ok=true; }catch(e){ /* offline: Zwischenspeicher bleibt */ } })();
  try{ await KALP.lade; }finally{ KALP.lade=null; }
  if(KALP.ok){ kalPUmzug(); if(KALP.offen) kalPSpeichern(); } kalPCache();
  if(JSON.stringify([KALP.kal,KALP.t,KALP.ok])!==vorher&&typeof nav!=="undefined"&&(nav.v==="kalender"||nav.v==="start")) render(); }
function kalPSpeichern(){ KALP.offen=true; kalPCache(); clearTimeout(KALP.timer); KALP.timer=setTimeout(kalPSchreiben,600); }
async function kalPSchreiben(){ const t=await kalPToken(); if(!t){ toast("Privater Kalender: noch nicht im OneDrive gespeichert"); return; }
  try{ const g=await fetch(kalPDatei(),{headers:{Authorization:"Bearer "+t}}); if(g.ok) kalPMischen(await g.json());
    const strip=x=>{ const {privat,...r}=x; return r; };
    const r=await fetch(kalPDatei(),{method:"PUT",headers:{Authorization:"Bearer "+t,"Content-Type":"application/json"},body:JSON.stringify({v:1,kal:KALP.kal.map(strip),t:KALP.t.map(strip)})});
    if(!r.ok) throw new Error("Fehler "+r.status); KALP.offen=false; kalPCache(); }
  catch(e){ kalPCache(); /* bleibt „offen“, nächster Versuch beim nächsten Laden */ } }
/* einen Datensatz finden – privat (OneDrive) oder auf der SharePoint-Website */
function kalRec(id){ if(!id) return null; return kalPK().find(x=>x.id===id&&!x.deleted)||kalPT().find(x=>x.id===id&&!x.deleted)||(DB.termine&&DB.termine.get(id))||null; }
function kalAblegen(r,privat,neu){ if(privat){ r.privat=true; r.upd=Date.now(); if(!r.createdBy) r.createdBy={mail:ME.mail,name:ME.name}; const L=r.typ==="kal"?KALP.kal:KALP.t, i=L.findIndex(x=>x.id===r.id); if(i<0) L.push(r); else L[i]=r; kalPSpeichern(); }
  else { delete r.privat; delete r.upd; saveRec("termine",r,neu); } }
/* löschen; „leeren“ entfernt beim Umzug zusätzlich den Inhalt von der SharePoint-Website */
function kalEntfernen(r,leeren){ if(!r) return; if(r.privat){ r.deleted=true; r.upd=Date.now(); kalPSpeichern(); return; }
  if(leeren) Object.assign(r,{name:"",t:"",ort:"",notiz:"",personen:[]}); r.deleted=true; saveRec("termine",r); }
const kalTermineVon=kid=>[...(DB.termine?live("termine"):[]),...kalPT()].filter(t=>t.kal===kid&&!t.deleted);
/* Kalender speichern; wechselt er zwischen privat und SharePoint, zieht er mit allen Terminen um (mit neuen IDs) */
function kalKalAblegen(c,privat){ const alt=c.id&&kalRec(c.id);
  if(alt&&!!alt.privat!==privat){ const nid=uid(), T=kalTermineVon(alt.id), an=KAL.ebenen["k:"+alt.id];
    const neu={id:nid,typ:"kal",name:c.name,farbe:c.farbe,sicht:c.sicht,personen:c.personen||[]}; kalAblegen(neu,privat,true);
    T.forEach(t=>{ kalAblegen({id:uid(),kal:nid,t:t.t,von:t.von,bis:t.bis,ganz:!!t.ganz,ort:t.ort||"",notiz:t.notiz||""},privat,true); kalEntfernen(t,!t.privat); });
    kalEntfernen(alt,!alt.privat); if(an===false){ KAL.ebenen["k:"+nid]=false; kalEbenenMerken(); } return neu; }
  if(alt){ Object.assign(alt,c); kalAblegen(alt,!!alt.privat,false); return alt; }
  const r={typ:"kal",...c,id:uid(),...(kalDemoAn()?{demo:true}:{})}; kalAblegen(r,privat,true); return r; }
/* „Nur ich“-Kalender, die noch auf der SharePoint-Website liegen, ins OneDrive verschieben */
function kalPUmzug(){ if(!kalPAn()||!DB.termine) return; const L=live("termine").filter(c=>c.typ==="kal"&&!c.deleted&&!c.demo&&c.sicht==="ich"&&c.createdBy&&String(c.createdBy.mail||"").toLowerCase()===kalIchMail());
  L.forEach(c=>kalKalAblegen({...c},true)); if(L.length) toast(L.length===1?"Dein privater Kalender liegt jetzt geschützt in deinem OneDrive":"Deine privaten Kalender liegen jetzt geschützt in deinem OneDrive"); }
const kalKalAlle=()=>[...(DB.termine?live("termine").filter(t=>t.typ==="kal"&&!t.deleted):[]),...kalPK().filter(c=>!c.deleted)];
const kalKalMein=c=>c.privat||!c.createdBy||!c.createdBy.mail||String(c.createdBy.mail).toLowerCase()===kalIchMail();
const kalKalSichtbar=c=>kalKalMein(c)||c.sicht==="alle"||(c.sicht==="personen"&&(c.personen||[]).map(x=>String(x).toLowerCase()).includes(kalIchMail()));
const kalKalListe=()=>kalKalAlle().filter(kalKalSichtbar).sort((a,b)=>(kalKalMein(b)-kalKalMein(a))||String(a.name).localeCompare(String(b.name),"de"));
const kalKalAn=c=>KAL.ebenen["k:"+c.id]!==false;
/* belegte Farben für einen (neuen) Kalender mit dieser Sichtbarkeit */
function kalFarbenBelegt(sicht,ausser){ const L=sicht==="alle"?kalKalAlle():kalKalListe(); return new Set(L.filter(c=>c.id!==ausser).map(c=>c.farbe)); }
function kalEigene(){ if(!DB.termine) return []; const K=new Map(kalKalListe().filter(kalKalAn).map(c=>[c.id,c]));
  return [...live("termine"),...kalPT()].filter(t=>t.kal&&!t.deleted&&K.has(t.kal)).map(t=>{ const c=K.get(t.kal); return {id:t.id,q:"eigen",kal:c.id,kalName:c.name,farbe:c.farbe,t:t.t||c.name,von:kalLokal(t.von),bis:kalLokal(t.bis),ganz:!!t.ganz,ort:t.ort||"",notiz:t.notiz||"",mit:[],eigen:kalKalMein(c)||(typeof canEdit==="function"&&canEdit(t)),rec:t}; }).filter(e=>e.von&&e.bis); }
/* Firmentermine: in der App gespeichert (Abgleich über SharePoint), für alle sichtbar – z. B. Weihnachtsfeier, Teambesprechung */
function kalFirma(){ if(!KAL.ebenen.firma||!DB.termine) return []; return live("termine").filter(t=>!t.deleted&&t.typ!=="kal"&&!t.kal).map(t=>({id:t.id,q:"firma",t:t.t||"Firmentermin",von:kalLokal(t.von),bis:kalLokal(t.bis),ganz:!!t.ganz,ort:t.ort||"",notiz:t.notiz||"",mit:[],eigen:typeof canEdit==="function"&&canEdit(t)&&(typeof istBuero!=="function"||istBuero()),rec:t})).filter(e=>e.von&&e.bis); }
function kalAlle(von,bis){ const demo=typeof demoAn==="function"&&demoAn();
  const O=!KAL.ebenen.outlook?[]:demo?kalDemo():KAL.ev;
  return [...O,...kalAuftraege(),...kalFirma(),...kalEigene()].filter(e=>e.von&&e.bis&&e.von<bis&&(e.bis>von||(+e.bis===+e.von&&e.von>=von))).sort((a,b)=>(b.ganz-a.ganz)||a.von-b.von); }
/* Laden: Bereich der aktuellen Ansicht (+ eine Woche Puffer), letzter Stand bleibt fürs Offline-Anschauen */
try{ const c=JSON.parse(localStorage.getItem("irrgang_kal_cache")||"null"); if(c&&Array.isArray(c.ev)){ KAL.ev=c.ev.map(e=>({...e,von:new Date(e.von),bis:new Date(e.bis)})); KAL.cacheAm=c.am; } }catch(e){}
/* Laden: Bereich der aktuellen Ansicht (+ eine Woche Puffer). Wichtig: nie aus jedem Neuzeichnen heraus erneut laden –
   bis 0.99.32 lief bei einem Fehler (z. B. Outlook noch nicht freigegeben) eine Endlosschleife aus Laden und Neuzeichnen.
   Darum: je Zeitraum höchstens alle 2 min (nach Fehler 1 min), ohne Freigabe gar nicht mehr von selbst (gemerkt für 30 min). */
const KAL_NEIN="irrgang_kal_nein";
try{ if(Date.now()-(+localStorage.getItem(KAL_NEIN)||0)<30*60e3) KAL.verbinden=true; }catch(e){}
async function kalLaden(erzwingen,bereich){ if(typeof demoAn==="function"&&demoAn()) return; kalPLaden(); if(!erzwingen&&KAL.verbinden) return;
  const {von,bis}=bereich||kalBereich(), a=kalPlus(von,-7), b=kalPlus(bis,7), key=kalIso(a)+"|"+kalIso(b), v=KAL.versuch||{};
  if(KAL.lade||(!erzwingen&&v.key===key&&Date.now()-v.am<(v.ok?120e3:60e3))) return;
  KAL.lade=true; KAL.versuch={key,am:Date.now(),ok:false}; const vorher=JSON.stringify([KAL.fehler,KAL.verbinden,KAL.ev.length,KAL.am]);
  try{ let url=`/me/calendarView?startDateTime=${a.toISOString()}&endDateTime=${b.toISOString()}&$top=250&$orderby=start/dateTime&$select=${KAL_SEL}`, L=[];
    for(let n=0;url&&n<8;n++){ const r=await kalG(url); L.push(...(r.value||[])); url=r["@odata.nextLink"]||""; }
    const neu=L.filter(e=>!e.isCancelled).map(kalAusOutlook), ids=new Set(neu.map(e=>e.id));
    KAL.ev=[...KAL.ev.filter(e=>!ids.has(e.id)&&(e.bis<=a||e.von>=b)),...neu]; KAL.am=Date.now(); KAL.verbinden=false; KAL.fehler=""; KAL.versuch.ok=true;
    try{ localStorage.removeItem(KAL_NEIN); const behalten=KAL.ev.filter(e=>e.bis>kalPlus(new Date(),-14)&&e.von<kalPlus(new Date(),60)).slice(0,600); localStorage.setItem("irrgang_kal_cache",JSON.stringify({am:Date.now(),ev:behalten})); }catch(e){}
  }catch(e){ if(e.verbinden){ try{ localStorage.setItem(KAL_NEIN,String(Date.now())); }catch(_){} } else KAL.fehler=navigator.onLine?(e.message||"Kalender nicht erreichbar"):"Offline – zuletzt geladener Stand"; }
  KAL.lade=false;
  /* nur neu zeichnen, wenn sich etwas geändert hat */
  if(JSON.stringify([KAL.fehler,KAL.verbinden,KAL.ev.length,KAL.am])!==vorher&&(nav.v==="kalender"||nav.v==="start")) (typeof softRender==="function"?softRender:render)(); }
/* --- Darstellung --- */
const kalFarbe=e=>e.q==="auftrag"?"kal-a":e.q==="firma"?"kal-g":e.q==="eigen"?"kal-c":e.frei?"kal-f":"kal-o";
const kalCV=e=>e&&e.farbe?`--c:${e.farbe};`:"";
const kalTxtZeit=e=>e.ganz?"ganztägig":`${kalZeit(e.von)}–${kalZeit(e.bis)}`;
/* Zeitraum als Seitentitel (oben, die einzige Überschrift) */
function kalTitel(){ const s=kalSicht(), B=kalBereich(), h=new Date();
  if(s==="woche"){ const e=kalPlus(B.von,6), m=d=>d.toLocaleDateString("de-DE",{month:"short"}).replace(".",""); return `KW ${kalKw(B.von)} · ${B.von.getDate()}.${B.von.getMonth()!==e.getMonth()?" "+m(B.von):""} – ${e.getDate()}. ${m(e)} ${e.getFullYear()}`; }
  if(s==="monat") return B.monat.toLocaleDateString("de-DE",{month:"long",year:"numeric"});
  return kalGleich(B.von,h)?"Termine ab heute":`Termine ab ${B.von.toLocaleDateString("de-DE",{day:"numeric",month:"long"})}`; }
const kalFilterAktiv=()=>!KAL.ebenen.outlook||!KAL.ebenen.auftraege||!KAL.ebenen.firma||kalKalListe().some(c=>!kalKalAn(c));
/* Kopf: links Zurück/Heute/Weiter in einer Gruppe, rechts Filter und Ansicht als Symbole (wie neben der Suchleiste in den Aufträgen) */
function kalKopf(){ const s=kalSicht(), sichten=KAL_SICHTEN.filter(x=>!(istHandy()&&x[0]==="woche")), IC_S={liste:"kalListe",woche:"kalWoche",monat:"kalMonat"};
  const stand=KAL.lade?`<span class="kal-stand">lädt …</span>`:KAL.fehler?`<span class="kal-stand warn">${esc(KAL.fehler)}</span>`:"";
  return `<div class="kal-kopf"><div class="kal-nav"><button class="kal-np" data-act="kalSchritt" data-v="-1" aria-label="Zurück" title="Zurück">${icon("back")}</button><button class="kal-np heute" data-act="kalHeute">Heute</button><button class="kal-np vor" data-act="kalSchritt" data-v="1" aria-label="Weiter" title="Weiter">${icon("back")}</button></div><button class="kal-datp" data-act="kalDatum" aria-label="Datum wählen" title="Datum wählen">${icon("kal")}</button>${stand}
    <div class="kal-rechts">${kalPaneAn()?"":`<button class="kal-filt${kalFilterAktiv()?" an":""}" data-act="kalFilter" aria-label="Anzeigen: Outlook, Aufträge, Firmentermine" title="Anzeigen">${icon("filt")}</button>`}
    <div class="seg ans-seg kal-ans" role="group" aria-label="Ansicht">${sichten.map(([k,t])=>`<button data-act="kalSicht" data-v="${k}" aria-pressed="${s===k}" title="${esc(t)}" aria-label="${esc(t)}">${icon(IC_S[k])}</button>`).join("")}</div></div></div>`; }
function kalFilterDlg(){ const demo=typeof demoAn==="function"&&demoAn();
  const z=(k,f,t,s2,an,farbe,edit)=>`<div class="li kal-fz" role="button" tabindex="0" data-act="kalEbene" data-v="${k}"><span class="kal-fd ${farbe?"kal-c":f}"${farbe?` style="--c:${farbe}"`:""}></span><span class="lt"><span class="h">${esc(t)}</span><span class="s">${esc(s2)}</span></span>${edit?`<button type="button" class="ib kal-fe" data-act="kalKalEdit" data-id="${esc(edit)}" title="Kalender bearbeiten" aria-label="Kalender bearbeiten">${icon("edit")}</button>`:""}<span class="schalter${an?" an":""}" aria-hidden="true"><i></i></span></div>`;
  const sichtTxt=c=>kalKalMein(c)?(c.sicht==="alle"?"Für alle sichtbar":c.sicht==="personen"?`Sichtbar für ${((c.personen||[]).length)} Kollegen`:c.privat?"Nur für dich · geschützt in deinem OneDrive":kalDemoAn()?"Nur für dich":"Nur für dich · noch nicht geschützt")+"":`Von ${(c.createdBy&&c.createdBy.name)||"Kollege"}`;
  const eigene=kalKalListe();
  dialog("Kalender",`<div class="list">${z("outlook","kal-o",demo?"Beispieltermine":"Mein Outlook","Deine eigenen Termine aus Outlook",KAL.ebenen.outlook)}${z("auftraege","kal-a","Aufträge","Termine aus dem Schritt „Termin“ der Aufträge",KAL.ebenen.auftraege)}${z("firma","kal-g","Firmentermine","Für alle – z. B. Weihnachtsfeier, Teambesprechung",KAL.ebenen.firma)}</div>
    <div class="lbl" style="margin:16px 4px 6px">Eigene Kalender</div><div class="list">${eigene.map(c=>z("k:"+c.id,"",c.name,sichtTxt(c),kalKalAn(c),c.farbe,kalKalMein(c)?c.id:"")).join("")}
      <div class="li kal-fz" role="button" tabindex="0" data-act="kalKalNeu"><span class="kal-fd kal-plus">${icon("add")}</span><span class="lt"><span class="h">Kalender anlegen</span><span class="s">z. B. Urlaub, Schulungen, Berufsschule – auch ohne Outlook</span></span></div></div>
    <div class="list" style="margin-top:12px">${z("meine","","Nur meine Aufträge","Nur Aufträge, bei denen du eingeteilt oder zuständig bist",kalNurMeine())}</div>`,`<span style="flex:1"></span><button class="btn-text" data-act="cancel">Fertig</button>`); }
/* eigenen Kalender anlegen / bearbeiten */
let kalK=null;
function kalKalDlg(c,danach){ const neu=!c, belegt=kalFarbenBelegt(c?c.sicht:"ich",c&&c.id), frei=KAL_PAL.find(([f])=>!belegt.has(f));
  if(neu&&!frei){ toast("Alle Farben sind schon vergeben"); return; }
  kalK={id:c&&c.id,farbe:c?c.farbe:frei[0],sicht:c?c.sicht||"ich":"ich",personen:new Set((c&&c.personen||[]).map(x=>String(x).toLowerCase())),danach};
  const T=(typeof team==="function"?team():[]).filter(m=>m.mail&&String(m.mail).toLowerCase()!==kalIchMail());
  dialog(neu?"Neuer Kalender":"Kalender bearbeiten",`<div class="fg1">${tf("kalKN","Name",c?c.name:"",{form:true,ph:"z. B. Urlaub, Schulungen, Berufsschule"})}
    <div class="lbl" style="margin:12px 4px 8px">Farbe</div><div class="kal-pal">${kalPalHtml()}</div>
    <div class="lbl" style="margin:16px 4px 8px">Wer sieht den Kalender?</div><div class="kal-segz">${seg("kalKS",kalK.sicht,KAL_SICHT)}</div>
    <div class="kal-kp"${kalK.sicht==="personen"?"":" hidden"}><div class="chips kal-mit">${T.map(m=>`<button type="button" class="chip" data-act="kalKP" data-v="${esc(String(m.mail).toLowerCase())}" aria-pressed="${kalK.personen.has(String(m.mail).toLowerCase())}" title="${esc(persVoll(m.mail,m.name))}">${persAv(m.mail,m.name)}${esc(m.name||m.mail)}</button>`).join("")}</div></div>
    <p class="sup kal-ich-h"${kalK.sicht==="ich"?"":" hidden"} style="margin:12px 4px 0">${kalPAn()?"Liegt geschützt in deinem persönlichen OneDrive – Kollegen und Chef sehen ihn nicht.":"Liegt vorerst auf der Firmen-Website und ist nur in der App ausgeblendet. Sobald die IT die Berechtigung freigibt, zieht er von selbst geschützt in dein OneDrive um."}</p>
    <p class="sup" style="margin:12px 4px 0">Rot, Blau und Grün sind für Outlook, Aufträge und Firmentermine reserviert. Jede andere Farbe gibt es nur einmal.</p></div>`,
    `${!neu?`<button class="btn-text danger" data-act="kalKalDel">Löschen</button>`:""}<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="kalKalOk">Speichern</button>`); }
function kalPalHtml(){ const belegt=kalFarbenBelegt(kalK.sicht,kalK.id);
  return KAL_PAL.map(([f,t])=>{ const weg=belegt.has(f)&&f!==kalK.farbe; return `<button type="button" class="kal-sw${f===kalK.farbe?" an":""}" style="--c:${f}" data-act="kalKF" data-v="${f}" title="${esc(t)}${weg?" – schon vergeben":""}" aria-label="${esc(t)}" ${weg?"disabled":""}></button>`; }).join(""); }
function kalKalSpeichern(){ const F=formVals(); if(!F.kalKN){ toast("Bitte einen Namen eintragen"); document.getElementById("f_kalKN")?.focus(); return; }
  if(kalFarbenBelegt(kalK.sicht,kalK.id).has(kalK.farbe)){ toast("Diese Farbe ist schon vergeben – bitte eine andere wählen"); const p=document.querySelector("#dlg .kal-pal"); if(p) p.innerHTML=kalPalHtml(); return; }
  const r=kalKalAblegen({id:kalK.id,name:F.kalKN,farbe:kalK.farbe,sicht:kalK.sicht,personen:kalK.sicht==="personen"?[...kalK.personen]:[]},kalK.sicht==="ich"&&kalPAn());
  const d=kalK.danach; kalK=null; closeOverlays(); render(); if(d) d(r); else kalFilterDlg(); return r; }
function kalVerbindenKarte(){ return `<div class="kal-verb"><span class="kal-verb-ic">${icon("kal")}</span><span class="kal-verb-t"><span class="lang">Outlook ist noch nicht verbunden – Aufträge, Firmentermine und eigene Kalender gehen trotzdem.</span><span class="kurz">Outlook nicht verbunden</span></span><button class="btn-text" data-act="kalVerbHilfe">Mehr</button><button class="btn-tonal" data-act="kalVerbinden">Verbinden</button></div>`; }
function kalenderView(){ const s=kalSicht(), B=kalBereich(), demo=typeof demoAn==="function"&&demoAn();
  if(!demo&&KAL.ebenen.outlook) setTimeout(()=>kalLaden(),0);
  const E=kalAlle(B.von,B.bis);
  const inhalt=s==="woche"?kalWoche(B,E):s==="monat"?kalMonat(B,E):kalListe(B,E);
  const haupt=`${kalKopf()}${!demo&&KAL.ebenen.outlook&&KAL.verbinden?kalVerbindenKarte():""}${inhalt}`, pane=kalPaneAn();
  return `<div class="narrow kal-seite kal-s-${s}">${haupt}</div>${pane?`<aside class="kal-pane">${kalPanel()}</aside>`:""}`; }
/* Seitenbereich rechts (nur breiter PC): eigene Spalte am rechten Fensterrand – Spiegelbild der App-Leiste links,
   scrollt für sich (nicht mit dem Kalender), ein- und ausblendbar (localStorage irrgang_kal_panel = an | aus).
   Inhalt: kleiner Monat zum Springen, Kalender an/aus, „Als Nächstes“. */
const KAL_PC=matchMedia("(min-width:1280px) and (hover:hover) and (pointer:fine)");
const kalPaneGewollt=()=>{ try{ return localStorage.getItem("irrgang_kal_panel")!=="aus"; }catch(e){ return true; } };
const kalPaneAn=()=>false; /* Seitenleiste rechts auf Wunsch von Max entfernt (27.10.2026) – Springen per Monats-Fenster an „Heute“ */
/* wird bei jedem Neuzeichnen aufgerufen: Klasse am body nur, solange der Kalender offen ist */
function kalPaneKlasse(){ document.body.classList.remove("kal-mit-pane","kal-pc"); }
KAL_PC.addEventListener?.("change",()=>{ if(typeof nav!=="undefined"&&nav.v==="kalender") render(); });
/* kleines Monats-Fenster zum Springen (aus der Heute-Gruppe) */
function kalDatumPop(anker){ document.getElementById("kalPop")?.remove(); const ab=KAL.ab||new Date(), m=KAL.miniMon||new Date(ab.getFullYear(),ab.getMonth(),1), a=kalMo(m), jetzt=new Date(), B=kalBereich();
  const E=kalAlle(a,kalPlus(a,42)), hat=d=>E.some(e=>e.von<kalPlus(d,1)&&e.bis>d);
  const tage=[...Array(42)].map((_,i)=>{ const d=kalPlus(a,i), imB=kalSicht()==="woche"&&d>=B.von&&d<B.bis; return `<button class="kp-t${d.getMonth()!==m.getMonth()?" fremd":""}${kalGleich(d,jetzt)?" heute":""}${imB?" imb":""}" data-act="kalMiniTag" data-d="${kalIso(d)}">${d.getDate()}${hat(d)?"<i></i>":""}</button>`; }).join("");
  document.body.insertAdjacentHTML("beforeend",`<div id="kalPop" class="kal-pop" role="dialog" aria-label="Datum wählen"><div class="kp-mk"><b>${esc(m.toLocaleDateString("de-DE",{month:"long",year:"numeric"}))}</b><button class="kp-r" data-act="kalMini" data-v="-1" aria-label="Voriger Monat">${icon("back")}</button><button class="kp-r vor" data-act="kalMini" data-v="1" aria-label="Nächster Monat">${icon("back")}</button></div>
    <div class="kp-g">${["M","D","M","D","F","S","S"].map(x=>`<span>${x}</span>`).join("")}${tage}</div></div>`);
  const p=document.getElementById("kalPop"), r=(anker||document.querySelector(".kal-nav")).getBoundingClientRect(); p.style.left=Math.max(8,Math.min(innerWidth-p.offsetWidth-8,r.left))+"px"; p.style.top=(r.bottom+8)+"px"; }
function kalPanel(){ const ab=KAL.ab||new Date(), m=KAL.miniMon||new Date(ab.getFullYear(),ab.getMonth(),1), a=kalMo(m), jetzt=new Date(), B=kalBereich();
  const E=kalAlle(a,kalPlus(a,42)), hat=d=>E.some(e=>e.von<kalPlus(d,1)&&e.bis>d);
  const tage=[...Array(42)].map((_,i)=>{ const d=kalPlus(a,i), imB=kalSicht()==="woche"&&d>=B.von&&d<B.bis; return `<button class="kp-t${d.getMonth()!==m.getMonth()?" fremd":""}${kalGleich(d,jetzt)?" heute":""}${imB?" imb":""}" data-act="kalMiniTag" data-d="${kalIso(d)}">${d.getDate()}${hat(d)?"<i></i>":""}</button>`; }).join("");
  const demo=typeof demoAn==="function"&&demoAn(), ebene=(k,f,t)=>`<button class="kp-e" data-act="kalEbene" data-v="${k}" aria-pressed="${k==="meine"?kalNurMeine():!!KAL.ebenen[k]}"><span class="kp-q ${f}"></span>${esc(t)}</button>`;
  const h=kalTag(jetzt), N=kalAlle(h,kalPlus(h,14)).filter(e=>e.bis>jetzt).sort((x,y)=>x.von-y.von).slice(0,5);
  const wann=e=>kalGleich(e.von,h)?(e.ganz?"Heute":`Heute ${kalZeit(e.von)}`):kalGleich(e.von,kalPlus(h,1))?(e.ganz?"Morgen":`Morgen ${kalZeit(e.von)}`):e.von.toLocaleDateString("de-DE",{weekday:"short",day:"numeric",month:"short"})+(e.ganz?"":` · ${kalZeit(e.von)}`);
  return `<aside class="kal-panel"><button class="kp-neu" data-act="kalNeu">${icon("add")}Termin</button><div class="kp-box"><div class="kp-mk"><b>${esc(m.toLocaleDateString("de-DE",{month:"long",year:"numeric"}))}</b><button class="kp-r" data-act="kalMini" data-v="-1" aria-label="Voriger Monat">${icon("back")}</button><button class="kp-r vor" data-act="kalMini" data-v="1" aria-label="Nächster Monat">${icon("back")}</button></div>
    <div class="kp-g">${["M","D","M","D","F","S","S"].map(x=>`<span>${x}</span>`).join("")}${tage}</div></div>
    <div class="kp-box"><div class="kp-l">Kalender</div>${ebene("outlook","kal-o",demo?"Beispieltermine":"Mein Outlook")}${ebene("auftraege","kal-a","Aufträge")}${ebene("firma","kal-g","Firmentermine")}${ebene("meine","kp-nur","Nur meine Aufträge")}</div>
    <div class="kp-box"><div class="kp-l">Als Nächstes</div>${N.length?N.map(e=>`<button class="kp-n" ${kalEvAttr(e)}><span class="kp-q ${kalFarbe(e)}"></span><span><b>${esc(e.privat&&!e.eigen?"Privat":e.t)}</b><small>${esc(wann(e))}</small></span></button>`).join(""):`<p class="kp-leer">Keine Termine in den nächsten zwei Wochen.</p>`}</div></aside>`; }
const kalEvAttr=e=>`data-act="kalAuf" data-id="${esc(e.id)}"`;
/* Liste (Agenda): je Tag ein Abschnitt wie überall in der App („Heute · Dienstag, 27. Oktober“), darunter die Termine als Zeilen */
function kalTagName(d){ const h=kalTag(new Date()), n=Math.round((kalTag(d)-h)/864e5), lang=d.toLocaleDateString("de-DE",{weekday:"long",day:"numeric",month:"long"});
  return n===0?`Heute · ${lang}`:n===1?`Morgen · ${lang}`:lang; }
function kalListe(B,E){ let h="";
  for(let d=new Date(B.von);d<B.bis;d=kalPlus(d,1)){ const T=E.filter(e=>e.von<kalPlus(d,1)&&e.bis>d), heute=kalGleich(d,new Date());
    if(!T.length&&!heute) continue;
    h+=`<div class="sec-lbl kal-lk${heute?" heute":""}">${esc(kalTagName(d))}</div>${T.length?`<div class="list kal-ll">${T.map(e=>{ const erst=kalGleich(e.von,d);
      const zeit=e.ganz?`<b>Ganztägig</b>`:erst?`<b>${esc(kalZeit(e.von))}</b><small>bis ${esc(kalGleich(e.bis,d)?kalZeit(e.bis):kalPlus(e.bis,0).toLocaleDateString("de-DE",{day:"numeric",month:"numeric"}))}</small>`:`<b>weiter</b><small>bis ${esc(kalZeit(e.bis))}</small>`;
      const s2=[e.ort,e.mit&&e.mit.length?e.mit.map(m=>m.name||m.mail).join(", "):"",e.q==="auftrag"?"Auftrag":e.q==="firma"?"Firmentermin":e.q==="eigen"?e.kalName:""].filter(Boolean).join(" · ");
      return `<div class="li kal-lz2${e.erledigt?" erl":""}" role="button" tabindex="0" ${kalEvAttr(e)}><span class="kal-lzeit">${zeit}</span><span class="kal-lbar ${kalFarbe(e)}" style="${kalCV(e)}"></span><span class="lt"><span class="h">${esc(e.privat&&!e.eigen?"Privat":e.t)}</span>${s2?`<span class="s">${esc(s2)}</span>`:""}</span>${icon("chev")}</div>`; }).join("")}</div>`
      :`<p class="kal-nix">Keine Termine</p>`}`; }
  return `<div class="kal-lscroll">${h||`<p class="meta" style="margin:20px 4px">In den nächsten vier Wochen keine Termine.</p>`}</div>`; }
/* Überlappende Termine eines Tages nebeneinander */
function kalSpalten(T){ const L=T.slice().sort((a,b)=>a.von-b.von||b.bis-a.bis), out=[]; let gruppe=[], ende=0;
  const fertig=()=>{ const sp=[]; gruppe.forEach(e=>{ let i=sp.findIndex(x=>x<=e.von); if(i<0){ i=sp.length; sp.push(0); } sp[i]=e.bis; out.push({e,i}); }); out.filter(x=>gruppe.includes(x.e)).forEach(x=>x.n=sp.length); gruppe=[]; };
  L.forEach(e=>{ if(gruppe.length&&e.von>=ende) fertig(); gruppe.push(e); ende=Math.max(ende,+e.bis); }); if(gruppe.length) fertig(); return out; }
function kalWoche(B,E){ const tage=[...Array(7)].map((_,i)=>kalPlus(B.von,i)), jetzt=new Date();
  let von=KAL_VON, bis=KAL_BIS; E.filter(e=>!e.ganz).forEach(e=>{ von=Math.min(von,e.von.getHours()); bis=Math.max(bis,Math.min(24,e.bis.getHours()+(e.bis.getMinutes()?1:0))); });
  const ganz=E.filter(e=>e.ganz||(e.bis-e.von)>=864e5);
  const kopf=`<div class="kal-wk"><span></span>${tage.map(d=>`<div class="kal-wkt${kalGleich(d,jetzt)?" heute":""}"><small>${esc(kalWT(d))}</small><b>${d.getDate()}</b></div>`).join("")}</div>`;
  const ganzZ=ganz.length?`<div class="kal-wg"><span class="kal-wgl">ganztägig</span>${tage.map(d=>`<div class="kal-wgt">${ganz.filter(e=>e.von<kalPlus(d,1)&&e.bis>d).map(e=>`<div class="kal-ev kal-evg ${kalFarbe(e)}" style="${kalCV(e)}" ${kalEvAttr(e)} role="button" tabindex="0">${esc(e.t)}</div>`).join("")}</div>`).join("")}</div>`:"";
  const std=[...Array(bis-von)].map((_,i)=>`<div class="kal-std" style="top:${i*KAL_H}px"><span>${von+i}:00</span></div>`).join("");
  const spalten=tage.map(d=>{ const T=E.filter(e=>!e.ganz&&(e.bis-e.von)<864e5&&e.von<kalPlus(d,1)&&e.bis>d);
    const ev=kalSpalten(T).map(({e,i,n})=>{ const a=new Date(Math.max(e.von,new Date(d.getFullYear(),d.getMonth(),d.getDate(),von))), b=new Date(Math.min(e.bis,new Date(d.getFullYear(),d.getMonth(),d.getDate(),bis))), top=((a.getHours()-von)*60+a.getMinutes())/60*KAL_H, hoch=Math.max(22,(b-a)/36e5*KAL_H-2);
      return `<div class="kal-ev ${kalFarbe(e)}${e.erledigt?" erl":""}${hoch<44?" klein":""}" ${kalEvAttr(e)} role="button" tabindex="0" style="${kalCV(e)}top:${top}px;height:${hoch}px;left:calc(${i/n*100}% + 2px);width:calc(${100/n}% - 4px)"><b>${esc(e.privat&&!e.eigen?"Privat":e.t)}</b><small>${esc(kalZeit(e.von))}–${esc(kalZeit(e.bis))}${e.ort&&hoch>=80?` · ${esc(e.ort)}`:""}</small></div>`; }).join("");
    const jl=kalGleich(d,jetzt)&&jetzt.getHours()>=von&&jetzt.getHours()<bis?`<i class="kal-jetzt" style="top:${((jetzt.getHours()-von)*60+jetzt.getMinutes())/60*KAL_H}px"></i>`:"";
    return `<div class="kal-wsp${kalGleich(d,jetzt)?" heute":""}" data-act="kalFrei" data-d="${kalIso(d)}" data-von="${von}">${ev}${jl}</div>`; }).join("");
  const ziel=Math.max(0,((kalGleich(kalMo(jetzt),B.von)?jetzt.getHours()-1:7)-von)*KAL_H);
  setTimeout(()=>{ kalWHoehe(); const sc=document.querySelector(".kal-wscroll"); if(sc&&!sc.dataset.ok){ sc.scrollTop=KAL.wScroll!=null?KAL.wScroll:ziel; sc.dataset.ok="1"; sc.addEventListener("scroll",()=>{ KAL.wScroll=sc.scrollTop; },{passive:true}); } },0);
  return `<div class="kal-woche">${kopf}${ganzZ}<div class="kal-wscroll"><div class="kal-wr" style="height:${(bis-von)*KAL_H}px">${std}<div class="kal-wsps">${spalten}</div></div></div></div>`; }
function kalMonat(B,E){ const jetzt=new Date(), mon=B.monat.getMonth();
  const kopf=[...Array(7)].map((_,i)=>`<div class="kal-mk">${esc(kalWT(kalPlus(B.von,i)))}</div>`).join("");
  const zellen=[...Array(42)].map((_,i)=>{ const d=kalPlus(B.von,i), T=E.filter(e=>e.von<kalPlus(d,1)&&e.bis>d), max=istHandy()?2:3;
    return `<div class="kal-mz${d.getMonth()!==mon?" fremd":""}${kalGleich(d,jetzt)?" heute":""}" data-act="kalTagAuf" data-d="${kalIso(d)}" role="button" tabindex="0"><span class="kal-mn">${d.getDate()}</span>${T.slice(0,max).map(e=>`<span class="kal-mev ${kalFarbe(e)}" style="${kalCV(e)}">${istHandy()?"":`${e.ganz?"":esc(kalZeit(e.von))+" "}`}${esc(e.privat&&!e.eigen?"Privat":e.t)}</span>`).join("")}${T.length>max?`<span class="kal-mmehr">+${T.length-max}</span>`:""}</div>`; }).join("");
  return `<div class="kal-monat"><div class="kal-mkopf">${kopf}</div><div class="kal-mgrid">${zellen}</div></div>`; }
/* --- Kachel auf der Startseite --- */
function kalKachel(anz,zeile,leer,gross){ const h=kalTag(new Date()), demo=typeof demoAn==="function"&&demoAn(); if(!demo&&KAL.ebenen.outlook&&!KAL.verbinden) setTimeout(()=>kalLadenStart(),0);
  const E=kalAlle(h,kalPlus(h,7)).filter(e=>e.bis>new Date()).sort((a,b)=>a.von-b.von||(b.ganz-a.ganz)), heute=E.filter(e=>e.von<kalPlus(h,1));
  const wann=e=>kalGleich(e.von,h)||(e.ganz&&e.von<=h)?(e.ganz?"heute":`heute ${kalZeit(e.von)}`):kalGleich(e.von,kalPlus(h,1))?(e.ganz?"morgen":`morgen ${kalZeit(e.von)}`):e.von.toLocaleDateString("de-DE",{weekday:"short",day:"numeric",month:"numeric"})+(e.ganz?"":` ${kalZeit(e.von)}`);
  return {ic:"kal",v:"kalender",sub:heute.length?`${heute.length} heute`:E.length?`nächster ${wann(E[0])}`:"Keine Termine diese Woche",plus:["kalNeu","Termin anlegen"],
    s:()=>gross(heute.length,"heute"),
    m:g=>E.length?E.slice(0,anz(g)).map(e=>zeile(e.privat&&!e.eigen?"Privat":e.t,[wann(e),e.ort].filter(Boolean).join(" · "))).join(""):leer(!demo&&KAL.verbinden?"Outlook noch nicht verbunden – im Kalender auf „Verbinden“.":"Keine Termine in den nächsten 7 Tagen.",true)}; }
/* Startseite lädt nur die nächsten Tage – unabhängig davon, welche Ansicht der Kalender gerade hat */
function kalLadenStart(){ kalPLaden(); if(KAL.verbinden||(KAL.startAm&&Date.now()-KAL.startAm<300e3)) return; KAL.startAm=Date.now(); const h=kalTag(new Date()); kalLaden(false,{von:h,bis:kalPlus(h,7)}); }
/* --- Termin anlegen / ändern --- */
let kalE=null;
function kalOrtListe(){ try{ return live("kunden").map(k=>[k.name,adrText(k)].filter(Boolean).join(", ")).concat(live("standorte").map(s=>{ const k=kundeOf(s.kundeId); return [k&&k.name,s.name,adrText(s)].filter(Boolean).join(", "); })); }catch(e){ return []; } }
function kalDialog(e,vor,bisVor,ganzVor){ const neu=!e; const d=vor||kalTag(KAL.ab&&kalSicht()!=="liste"?new Date():new Date()), start=e?e.von:(()=>{ const x=new Date(d); if(!bisVor&&(!vor||!vor.getHours())){ const j=new Date(); x.setHours(kalGleich(x,j)?Math.min(20,j.getHours()+1):8,0,0,0); } return x; })();
  const ende=e?e.bis:bisVor||new Date(start.getTime()+3600e3), ganz=e?e.ganz:!!ganzVor, ganzEnde=ganz?kalPlus(ende,-1):ende;
  const buero=typeof istBuero==="function"&&istBuero(), demo=typeof demoAn==="function"&&demoAn();
  /* Kalender, in die man schreiben darf: Outlook (wenn verbunden), eigene Kalender, Firmentermine (Büro) */
  const outlookOk=demo||!KAL.verbinden, eigene=kalKalListe().filter(kalKalMein);
  const wahl=[...(outlookOk?[["outlook",demo?"Beispieltermine":"Mein Outlook","var(--primary)"]]:[]),...eigene.map(c=>[c.id,c.name,c.farbe]),...(eigene.length?[]:[["neu-ich","Mein Kalender",(KAL_PAL.find(([f])=>!kalFarbenBelegt("ich").has(f))||KAL_PAL[0])[0]]]),...(buero?[["firma","Firmentermine","#2e9b5b"]]:[])];
  const vor0=e?(e.q==="eigen"?e.kal:e.q):KAL.neuArt, art=wahl.some(w=>w[0]===vor0)?vor0:(e?e.q:wahl[0][0]);
  kalE={id:e&&e.id,ganz,art,mit:new Set((e&&e.mit||[]).map(m=>m.mail).filter(Boolean)),mitAlt:(e&&e.mit||[]).filter(m=>m.mail)};
  const T=(typeof team==="function"?team():[]).filter(m=>m.mail&&String(m.mail).toLowerCase()!==String(ME.mail||"").toLowerCase());
  const artWahl=neu&&wahl.length>1?`<div class="lbl" style="margin:0 4px 6px">Kalender</div><div class="chips kal-wahl">${wahl.map(([k,t,f])=>`<button type="button" class="chip kal-wc" data-act="kalArt" data-v="${esc(k)}" aria-pressed="${k===art}"><i class="kal-wd" style="background:${f}"></i>${esc(t)}</button>`).join("")}</div>`:"";
  dialog(neu?"Neuer Termin":art==="firma"?"Firmentermin":"Termin",`<div class="fg1 kal-dlg kal-art-${art==="outlook"?"outlook":art==="firma"?"firma":"eigen"}">${artWahl}${tf("kalT","Titel",e?e.t:"",{form:true,ph:"z. B. Kundentermin, Weihnachtsfeier"})}
    <div class="kal-segz">${seg("kalGanz",ganz?"1":"0",[["0","Mit Uhrzeit"],["1","Ganztägig"]])}</div>
    <div class="kal-zeiten${ganz?" ganz":""}">${tf("kalD","Beginn",kalIso(start),{form:true,type:"date"})}<span class="kal-uz">${tf("kalVon","Von",kalZeit(start),{form:true,type:"time",ph:"08:00"})}${tf("kalBis","Bis",kalZeit(ende),{form:true,type:"time",ph:"09:00"})}</span><span class="kal-gz">${tf("kalDE","Ende",kalIso(ganzEnde),{form:true,type:"date"})}</span></div>
    ${tf("kalOrt","Ort (optional)",e?e.ort:"",{form:true,list:"kalOrte",ph:"Kunde oder Adresse"})}${datalist("kalOrte",kalOrtListe())}
    <p class="sup kal-firma-h">Erscheint bei allen in den Irrgang-Apps im Kalender, in Grün – nicht in Outlook.</p><p class="sup kal-eigen-h">Liegt in den Irrgang-Apps (nicht in Outlook) und ist so sichtbar, wie der Kalender eingestellt ist.</p>
    ${T.length?`<div class="kal-mit-w"><div class="lbl" style="margin:12px 4px 6px">Mit – bekommen den Termin als Einladung in ihren Kalender</div><div class="chips kal-mit">${T.map(m=>`<button type="button" class="chip" data-act="kalMit" data-v="${esc(String(m.mail).toLowerCase())}" aria-pressed="${kalE.mit.has(String(m.mail).toLowerCase())}" title="${esc(persVoll(m.mail,m.name))}">${persAv(m.mail,m.name)}${esc(m.name||m.mail)}</button>`).join("")}</div></div>`:""}
    ${ta("kalN","Notiz (optional)",e?e.notiz:"",{form:true,ph:"z. B. Schlüssel beim Nachbarn, Unterlagen mitbringen"})}</div>`,
    `${!neu?`<button class="btn-text danger" data-act="kalDel">Löschen</button>`:""}<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="kalOk">Speichern</button>`,{mittel:true}); }
/* fremde Termine (Einladungen) und Auftragstermine: nur ansehen */
function kalAnsehen(e){ const z=(ic,t)=>t?`<p class="kal-dz">${icon(ic)}<span>${esc(t)}</span></p>`:"";
  const wann=e.ganz?`${e.von.toLocaleDateString("de-DE",{weekday:"long",day:"numeric",month:"long"})}${(e.bis-e.von)>864e5?` – ${kalPlus(e.bis,-1).toLocaleDateString("de-DE",{day:"numeric",month:"long"})}`:""} · ganztägig`:`${e.von.toLocaleDateString("de-DE",{weekday:"long",day:"numeric",month:"long"})} · ${kalZeit(e.von)}–${kalZeit(e.bis)} Uhr`;
  dialog(e.privat&&!e.eigen?"Privat":e.t,`${z("kalUhr",wann)}${z("kalOrt",e.ort)}${(e.mit||[]).length?`<p class="kal-dz">${icon("kalLeute")}<span class="kal-dleute">${e.mit.map(m=>m.mail?persName(m.mail,m.name||m.mail):`<span class="pn">${esc(m.name)}</span>`).join("")}</span></p>`:""}${e.org&&!e.eigen?z("person","Eingeladen von "+e.org):""}${e.notiz?`<p class="kal-dn">${esc(e.notiz)}</p>`:""}
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
  if(kalE.art!=="outlook"&&kalE.art!=="firma"){ let kid=kalE.art;
    if(kid==="neu-ich"){ const f=(KAL_PAL.find(([x])=>!kalFarbenBelegt("ich").has(x))||KAL_PAL[0])[0]; kid=kalKalAblegen({name:"Mein Kalender",farbe:f,sicht:"ich",personen:[]},kalPAn()).id; }
    const kal=kalRec(kid), privat=!!(kal&&kal.privat), daten={kal:kid,t:F.kalT,von:z.von.slice(0,16),bis:z.bis.slice(0,16),ganz:z.ganz,ort:F.kalOrt||"",notiz:F.kalN||""};
    let alt=kalE.id&&kalRec(kalE.id); if(alt&&!!alt.privat!==privat){ kalEntfernen(alt,!alt.privat); alt=null; }
    if(alt){ Object.assign(alt,daten); kalAblegen(alt,privat,false); } else kalAblegen({id:uid(),...daten,...(demo?{demo:true}:{})},privat,true);
    closeOverlays(); render(); toast("Termin gespeichert"); return; }
  if(kalE.art==="firma"){ const alt=kalE.id&&DB.termine.get(kalE.id), r=alt||{id:uid(),fuer:"alle",...(demo?{demo:true}:{})};
    Object.assign(r,{t:F.kalT,von:z.von.slice(0,16),bis:z.bis.slice(0,16),ganz:z.ganz,ort:F.kalOrt||"",notiz:F.kalN||""}); saveRec("termine",r,!alt); closeOverlays(); render(); toast("Firmentermin gespeichert – für alle sichtbar"); return; }
  if(demo){ const e={id:kalE.id||"demo-t"+uid(),q:"outlook",t:F.kalT,von:kalLokal(z.von),bis:kalLokal(z.bis),ganz:z.ganz,ort:F.kalOrt||"",notiz:F.kalN||"",mit:mit.map(a=>({name:a.emailAddress.name,mail:a.emailAddress.address})),eigen:true,demo:true};
    KAL.demo=[...kalDemo().filter(x=>x.id!==e.id),e]; closeOverlays(); render(); toast("Termin gespeichert (Beispiel)"); return; }
  const btn=document.querySelector('#dlg [data-act="kalOk"]'); if(btn){ btn.disabled=true; btn.textContent="Speichert …"; }
  try{ const r=kalE.id?await kalG(`/me/events/${encodeURIComponent(kalE.id)}`,{method:"PATCH",body:JSON.stringify(body)}):await kalG("/me/events",{method:"POST",body:JSON.stringify(body)});
    const e=kalAusOutlook(r||{...body,id:kalE.id}); KAL.ev=[...KAL.ev.filter(x=>x.id!==e.id),e]; closeOverlays(); render(); toast(mit.length&&!kalE.id?"Termin gespeichert – Einladungen verschickt":"Termin gespeichert"); kalLaden(true); }
  catch(err){ if(btn){ btn.disabled=false; btn.textContent="Speichern"; } toast(err.verbinden?"Outlook ist nicht verbunden":"Nicht gespeichert: "+(err.message||"Fehler")); } }
async function kalLoeschen(){ const id=kalE&&kalE.id; if(!id) return; const demo=typeof demoAn==="function"&&demoAn();
  if(kalE.art!=="outlook"){ kalEntfernen(kalRec(id)); closeOverlays(); render(); toast(kalE.art==="firma"?"Firmentermin gelöscht":"Termin gelöscht"); return; }
  if(demo){ KAL.demo=kalDemo().filter(x=>x.id!==id); closeOverlays(); render(); return; }
  try{ await kalG(`/me/events/${encodeURIComponent(id)}`,{method:"DELETE"}); KAL.ev=KAL.ev.filter(x=>x.id!==id); closeOverlays(); render(); toast("Termin gelöscht"); }
  catch(err){ toast("Nicht gelöscht: "+(err.message||"Fehler")); } }
function kalFinde(id){ const demo=typeof demoAn==="function"&&demoAn(); return [...(demo?kalDemo():KAL.ev),...kalAuftraege(),...kalFirma(),...kalEigene()].find(e=>e.id===id); }
document.addEventListener("click",ev=>{ const b=ev.target.closest&&ev.target.closest('[data-act^="kal"]'); if(!b) return; const a=b.dataset.act;
  const seg1=()=>{ b.parentElement.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x===b))); if(typeof segInd==="function") segInd(); };
  if(a==="kalAuf"){ ev.stopPropagation(); const e=kalFinde(b.dataset.id); if(!e) return; if((e.q==="outlook"||e.q==="firma"||e.q==="eigen")&&e.eigen) kalDialog(e); else kalAnsehen(e); }
  else if(a==="kalFrei"){ if(ev.target.closest(".kal-ev")||Date.now()-KZ.weg<500) return; const r=b.getBoundingClientRect(), h=Math.floor((ev.clientY-r.top)/KAL_H*2)/2+(+b.dataset.von||KAL_VON), d=kalLokal(b.dataset.d); d.setHours(Math.floor(h),h%1?30:0,0,0); kalDialog(null,d); }
  else if(a==="kalTagAuf"){ if(Date.now()-KZ.weg<500) return; KAL.ab=kalLokal(b.dataset.d); KAL.sicht=istHandy()?"liste":"woche"; try{ localStorage.setItem("irrgang_kal_sicht",KAL.sicht); }catch(e){} render(); }
  else if(a==="kalNeu"){ ev.stopPropagation(); kalDialog(null); }
  else if(a==="kalSicht"){ KAL.sicht=b.dataset.v; try{ localStorage.setItem("irrgang_kal_sicht",KAL.sicht); }catch(e){} render(); }
  else if(a==="kalSchritt"){ const s=kalSicht(), n=+b.dataset.v, ab=KAL.ab||new Date(); KAL.ab=s==="woche"?kalPlus(ab,7*n):s==="monat"?new Date(ab.getFullYear(),ab.getMonth()+n,1):kalPlus(ab,14*n); render(); }
  else if(a==="kalHeute"){ KAL.ab=null; KAL.miniMon=null; KAL.wScroll=null; render(); }
  else if(a==="kalMini"){ ev.stopPropagation(); const m=KAL.miniMon||new Date((KAL.ab||new Date()).getFullYear(),(KAL.ab||new Date()).getMonth(),1); KAL.miniMon=new Date(m.getFullYear(),m.getMonth()+(+b.dataset.v),1); if(document.getElementById("kalPop")) kalDatumPop(document.querySelector(".kal-nav")); else render(); }
  else if(a==="kalMiniTag"){ KAL.ab=kalLokal(b.dataset.d); KAL.miniMon=null; KAL.wScroll=null; document.getElementById("kalPop")?.remove(); render(); }
  else if(a==="kalDatum"){ ev.stopPropagation(); if(document.getElementById("kalPop")){ document.getElementById("kalPop").remove(); return; } KAL.miniMon=null; kalDatumPop(document.querySelector(".kal-nav")); }
  else if(a==="kalEbene"){ const k=b.dataset.v; KAL.ebenen[k]=k==="meine"?!kalNurMeine():k.startsWith("k:")?KAL.ebenen[k]===false:!KAL.ebenen[k]; try{ localStorage.setItem("irrgang_kal_ebenen",JSON.stringify(KAL.ebenen)); }catch(e){} const sw=b.querySelector(".schalter"); if(sw) sw.classList.toggle("an",k==="meine"?kalNurMeine():k.startsWith("k:")?KAL.ebenen[k]!==false:!!KAL.ebenen[k]); render(); }
  else if(a==="kalFilter"){ ev.stopPropagation(); kalFilterDlg(); }
  else if(a==="kalPane"){ try{ localStorage.setItem("irrgang_kal_panel",kalPaneGewollt()?"aus":"an"); }catch(e){} render(); }
  else if(a==="kalVerbHilfe") dialog("Outlook verbinden","<p style=\"margin:0 0 10px\">Mit „Verbinden“ bestätigst du einmal bei Microsoft, dann siehst du hier deine Outlook-Termine und kannst neue anlegen.</p><p class=\"sup\" style=\"margin:0\">Erscheint bei Microsoft „Genehmigung durch Administrator erforderlich“, muss die Kalender-Berechtigung der App erst einmal freigegeben werden (EDV Achenbach bzw. ein Administrator).</p>",`<span style="flex:1"></span><button class="btn-text" data-act="cancel">Schließen</button><button class="btn-text" data-act="kalVerbinden">Verbinden</button>`);
  else if(a==="kalVerbinden") kalVerbinden();
  else if(a==="kalGanz"){ kalE.ganz=b.dataset.v==="1"; seg1(); document.querySelector("#dlg .kal-zeiten")?.classList.toggle("ganz",kalE.ganz); }
  else if(a==="kalMit"){ const m=b.dataset.v; if(kalE.mit.has(m)) kalE.mit.delete(m); else kalE.mit.add(m); b.setAttribute("aria-pressed",String(kalE.mit.has(m))); }
  else if(a==="kalOk") kalSpeichern();
  else if(a==="kalDel") confirmDlg("Termin löschen?",kalE&&kalE.art==="firma"?"Der Firmentermin verschwindet bei allen aus dem Kalender.":kalE&&kalE.art!=="outlook"?"Der Termin wird aus dem Kalender gelöscht.":"Der Termin wird auch in Outlook gelöscht. Eingeladene bekommen eine Absage.","Löschen","kalDelJa");
  else if(a==="kalArt"){ kalE.art=b.dataset.v; KAL.neuArt=kalE.art; b.parentElement.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x===b))); const w=document.querySelector("#dlg .kal-dlg"), k=kalE.art==="outlook"?"outlook":kalE.art==="firma"?"firma":"eigen"; if(w){ ["outlook","firma","eigen"].forEach(x=>w.classList.toggle("kal-art-"+x,x===k)); } const h=document.querySelector("#dlg h2"); if(h) h.textContent=kalE.art==="firma"?"Neuer Firmentermin":"Neuer Termin"; }
  else if(a==="kalKalNeu"){ ev.stopPropagation(); kalKalDlg(null); }
  else if(a==="kalKalEdit"){ ev.stopPropagation(); const c=kalRec(b.dataset.id); if(c) kalKalDlg(c); }
  else if(a==="kalKF"){ if(b.disabled) return; kalK.farbe=b.dataset.v; b.parentElement.querySelectorAll(".kal-sw").forEach(x=>x.classList.toggle("an",x===b)); }
  else if(a==="kalKS"){ kalK.sicht=b.dataset.v; seg1(); const p=document.querySelector("#dlg .kal-kp"); if(p) p.hidden=kalK.sicht!=="personen"; const ih=document.querySelector("#dlg .kal-ich-h"); if(ih) ih.hidden=kalK.sicht!=="ich"; if(kalFarbenBelegt(kalK.sicht,kalK.id).has(kalK.farbe)){ const f=KAL_PAL.find(([x])=>!kalFarbenBelegt(kalK.sicht,kalK.id).has(x)); if(f) kalK.farbe=f[0]; } const pl=document.querySelector("#dlg .kal-pal"); if(pl) pl.innerHTML=kalPalHtml(); }
  else if(a==="kalKP"){ const m=b.dataset.v; if(kalK.personen.has(m)) kalK.personen.delete(m); else kalK.personen.add(m); b.setAttribute("aria-pressed",String(kalK.personen.has(m))); }
  else if(a==="kalKalOk") kalKalSpeichern();
  else if(a==="kalKalDel") confirmDlg("Kalender löschen?","Der Kalender und seine Termine verschwinden aus der Ansicht – bei allen, die ihn sehen.","Löschen","kalKalDelJa");
  else if(a==="kalKalDelJa"){ const r=kalK&&kalRec(kalK.id); if(r){ kalTermineVon(r.id).forEach(t=>kalEntfernen(t)); kalEntfernen(r); } kalK=null; closeOverlays(); render(); kalFilterDlg(); }
  else if(a==="kalDelJa") kalLoeschen();
  else if(a==="kalZumVg"){ closeOverlays(); const v=DB.vorgaenge&&DB.vorgaenge.get(b.dataset.id); if(v&&typeof vgOpen==="function") vgOpen(v); }
},true);

/* Monats-Fenster schließen: Klick daneben, Esc, Seitenwechsel */
document.addEventListener("click",e=>{ const p=document.getElementById("kalPop"); if(p&&!(e.target.closest&&(e.target.closest("#kalPop")||e.target.closest('[data-act="kalDatum"]')))) p.remove(); },true);
document.addEventListener("keydown",e=>{ if(e.key==="Escape") document.getElementById("kalPop")?.remove(); });

/* ===== Ziehen zum Anlegen =====
   Woche: in einer Tagesspalte von–bis aufziehen (15-Minuten-Raster) → neuer Termin mit dieser Zeit.
   Monat: über mehrere Tage ziehen → neuer ganztägiger Termin über diese Tage.
   Maus: sofort ziehen. Finger (iPad/Handy): kurz gedrückt halten, dann ziehen – sonst bleibt normales Scrollen. */
const KZ={a:null,weg:0,timer:0,t0:null};
function kzMin(sp,y){ const r=sp.getBoundingClientRect(), max=Math.round(r.height/KAL_H*60); return Math.max(0,Math.min(max-15,Math.floor((y-r.top)/KAL_H*4)*15)); }
const kzZeit=(sp,m)=>{ const d=kalLokal(sp.dataset.d); d.setHours(+sp.dataset.von||KAL_VON,0,0,0); return new Date(d.getTime()+m*6e4); };
function kzZeichne(){ const A=KZ.a; if(!A) return;
  if(A.art==="w"){ const m0=kzMin(A.sp,A.y0), m1=kzMin(A.sp,A.y), a=Math.min(m0,m1), b=Math.max(m0,m1)+15; A.von=kzZeit(A.sp,a); A.bis=kzZeit(A.sp,b);
    let el=A.sp.querySelector(".kal-sel"); if(!el){ el=document.createElement("div"); el.className="kal-sel"; A.sp.appendChild(el); }
    el.style.top=a/60*KAL_H+"px"; el.style.height=Math.max(14,(b-a)/60*KAL_H-2)+"px"; el.innerHTML=`<b>Neuer Termin</b><small>${kalZeit(A.von)}–${kalZeit(A.bis)}</small>`; el.classList.toggle("klein",(b-a)<45); }
  else { const z=document.elementFromPoint(A.x,A.y)?.closest(".kal-mz"); if(z) A.d1=z.dataset.d; const [a,b]=[A.d0,A.d1].sort();
    document.querySelectorAll(".kal-mz").forEach(t=>t.classList.toggle("kal-msel",t.dataset.d>=a&&t.dataset.d<=b)); A.von=kalLokal(a); A.bis=kalPlus(kalLokal(b),1); } }
function kzAufraeumen(){ document.querySelectorAll(".kal-sel").forEach(x=>x.remove()); document.querySelectorAll(".kal-msel").forEach(x=>x.classList.remove("kal-msel")); document.body.classList.remove("kz-zieht"); KZ.a=null; }
function kzStart(t,x,y,touch){ const sp=t.closest(".kal-wsp"), mz=t.closest(".kal-mz"); if(sp&&!t.closest(".kal-ev")) KZ.a={art:"w",sp,y0:y,y,x,touch,zug:!!touch};
  else if(mz) KZ.a={art:"m",d0:mz.dataset.d,d1:mz.dataset.d,x,y,y0:y,touch,zug:!!touch}; else return false;
  document.querySelector(".kal-hov")?.remove();
  if(touch){ document.body.classList.add("kz-zieht"); kzZeichne(); try{ navigator.vibrate&&navigator.vibrate(12); }catch(e){} } return true; }
function kzBewegt(x,y){ const A=KZ.a; if(!A) return; A.x=x; A.y=y; if(!A.zug){ if(A.art==="w"&&Math.abs(y-A.y0)<6) return; if(A.art==="m"){ const z=document.elementFromPoint(x,y)?.closest(".kal-mz"); if(!z||z.dataset.d===A.d0) return; } A.zug=true; document.body.classList.add("kz-zieht"); }
  if(A.art==="w"){ const sc=A.sp.closest(".kal-wscroll"); if(sc){ const r=sc.getBoundingClientRect(); if(y>r.bottom-30) sc.scrollTop+=10; else if(y<r.top+30) sc.scrollTop-=10; } }
  kzZeichne(); }
function kzEnde(){ const A=KZ.a; if(!A) return; const zug=A.zug; if(zug){ kzZeichne(); KZ.weg=Date.now(); } const von=A.von, bis=A.bis, art=A.art; kzAufraeumen();
  if(zug&&von&&bis) kalDialog(null,von,bis,art==="m"); }
document.addEventListener("pointerdown",e=>{ if(e.pointerType==="touch"||e.button!==0||!e.target.closest?.(".kal-wsp,.kal-mz")) return; if(kzStart(e.target,e.clientX,e.clientY,false)) e.preventDefault(); });
/* Vorschau beim Überfahren (nur Maus): blasses Kästchen „+ 10:00“ dort, wo ein Klick den Termin anlegen würde */
function kzVorschau(e){ const sp=e.pointerType==="mouse"&&!KZ.a&&e.target.closest?.(".kal-wsp"), alt=document.querySelector(".kal-hov");
  if(!sp||e.target.closest(".kal-ev")){ if(alt) alt.remove(); return; }
  const r=sp.getBoundingClientRect(), max=Math.round(r.height/KAL_H*60), m=Math.max(0,Math.min(max-30,Math.floor((e.clientY-r.top)/KAL_H*2)*30));
  let el=alt; if(!el||el.parentElement!==sp){ if(el) el.remove(); el=document.createElement("div"); el.className="kal-hov"; sp.appendChild(el); }
  if(el.dataset.m!==String(m)){ el.dataset.m=m; el.style.top=m/60*KAL_H+"px"; el.style.height=KAL_H/2-2+"px"; el.textContent="+ "+kalZeit(kzZeit(sp,m)); } }
document.addEventListener("pointermove",e=>{ if(KZ.a&&!KZ.a.touch){ kzBewegt(e.clientX,e.clientY); return; } kzVorschau(e); });
document.addEventListener("mouseout",e=>{ if(!e.relatedTarget||!e.relatedTarget.closest?.(".kal-wsp")) document.querySelector(".kal-hov")?.remove(); });
document.addEventListener("pointerup",e=>{ if(KZ.a&&!KZ.a.touch) kzEnde(); });
document.addEventListener("pointercancel",()=>{ if(KZ.a&&!KZ.a.touch) kzAufraeumen(); });
document.addEventListener("touchstart",e=>{ clearTimeout(KZ.timer); const t=e.target.closest?.(".kal-wsp,.kal-mz"); if(!t||e.touches.length>1||e.target.closest(".kal-ev")) return; const p=e.touches[0]; KZ.t0={x:p.clientX,y:p.clientY,el:e.target};
  KZ.timer=setTimeout(()=>{ if(KZ.t0) kzStart(KZ.t0.el,KZ.t0.x,KZ.t0.y,true); },420); },{passive:true});
document.addEventListener("touchmove",e=>{ const p=e.touches[0]; if(KZ.a&&KZ.a.touch){ e.preventDefault(); kzBewegt(p.clientX,p.clientY); return; } if(KZ.t0&&Math.hypot(p.clientX-KZ.t0.x,p.clientY-KZ.t0.y)>8){ clearTimeout(KZ.timer); KZ.t0=null; } },{passive:false});
document.addEventListener("touchend",e=>{ clearTimeout(KZ.timer); KZ.t0=null; if(KZ.a&&KZ.a.touch){ e.preventDefault(); kzEnde(); } });
document.addEventListener("touchcancel",()=>{ clearTimeout(KZ.timer); KZ.t0=null; if(KZ.a&&KZ.a.touch) kzAufraeumen(); });

/* Wochenraster genau bis zum Fensterrand: die Seite selbst scrollt nicht, nur die Stunden darin */
function kalWHoehe(){ const sc=document.querySelector(".kal-wscroll"); if(!sc) return; const nb=document.querySelector(".navbar"), nr=nb&&nb.getBoundingClientRect();
  const unten=nr&&nr.top>window.innerHeight/2&&nr.height?nr.top:window.innerHeight; let h=Math.max(300,Math.floor(unten-sc.getBoundingClientRect().top-12-20)); sc.style.maxHeight=h+"px";
  const se=document.scrollingElement, ueber=se.scrollHeight-se.clientHeight; if(ueber>0&&h-ueber>=300) sc.style.maxHeight=(h-ueber)+"px"; }
window.addEventListener("resize",()=>{ clearTimeout(KAL.rz); KAL.rz=setTimeout(kalWHoehe,100); });
