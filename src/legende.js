/* ===== Verteilerlegende (E-Check › Installation) =====
   Stromkreisliste für die Hager-Tasche im Verteiler: eine Zeile pro Stromkreis, Zwischenüberschriften, RCDs fett, Reserven als Schreiblinie.
   Geht ohne angelegten Kunden (Kunde und Anschrift frei eintragen). PDF im Stil der Prüfprotokolle (pdfStil). */
const LEG_ART=[["sk","Stromkreis"],["rcd","RCD"],["res","Reserve"],["gr","Überschrift"],["kl","Klemme"],["ge","Gerät"]];
const LEG_RAUM=["Küche","Bad","WC","Wohnzimmer","Schlafzimmer","Kinderzimmer","Büro","Flur","Treppenhaus","Keller","Hauswirtschaftsraum","Technikraum","Garage","Dachboden","Außen","Allgemein"];
const LEG_WAS=["Steckdosen","Licht","Herd","Backofen","Kochfeld","Spülmaschine","Kühlschrank","Waschmaschine","Trockner","Durchlauferhitzer","Heizung","Wärmepumpe","Wallbox","PV-Anlage","Rollläden","Brüstungskanal","EDV","Klingel","Außensteckdose"];
const LEG_LS=["B10","B13","B16","B20","B25","B32","C16"], LEG_RCD=["40 A / 30 mA Typ A","63 A / 30 mA Typ A","40 A / 30 mA Typ B","40 A / 300 mA Typ A"];
const LEG_VT=["HV","UV EG","UV OG","UV KG","UV DG","Zählerschrank"];
const LEG_NETZ=["","TN-C-S | 230/400 V","TN-S | 230/400 V","TT | 230/400 V"];
let legDlg=null;
const legAlle=()=>live("legenden").sort((a,b)=>(b.updated||0)-(a.updated||0));
const legAkt=()=>nav.v==="legende"?DB.legenden.get(nav.id):nav.v==="vt"&&typeof vtL==="function"?vtL(nav.g,nav.id):null;
const legE=L=>Array.isArray(L.eintraege)?L.eintraege:(L.eintraege=[]);
const legSkZahl=L=>legE(L).filter(e=>e.art==="sk"||e.art==="res").length;
const legSchutz=e=>[e.schutz,e.art==="sk"&&+e.pole===3?"3-polig":""].filter(Boolean).join(" ");
/* Speichern: freie Legende als eigener Datensatz, Verteiler zurück ins Gebäude */
/* ===== Betriebsmittelkennzeichen nach DIN EN IEC 81346 – automatisch (Max, 03.11.2026) =====
   Eine Nummer je GERÄT in Einbaureihenfolge (links → rechts, Reihe für Reihe), Automaten am RCD gestuft (siehe legNummern):
   -F = Schutzgeräte (RCD, LS, FI/LS, Reserve-Automat, NEOZED/SLS, Überspannungsschutz), -Q = Haupt-/Lasttrennschalter, Schütze,
   -K = Stromstoß-/Zeitrelais, Treppenlicht, -T = Trafo/Netzteil, -X = Klemmen. Leerplätze und Überschriften bekommen nichts.
   Der Einbauplatz (Reihe, TE) ist KEINE Nummer – er ergibt sich aus der Anordnung (legPlaetze).
   Umgestellt werden Verteiler ohne Kennzeichen, mit BMK oder mit dem Zwischenschema „FI 1 / 1, 2, 3“ (bis 03.11.2026);
   Verteiler mit dem alten Schema „F 1.0.1“ bleiben, wie sie sind. */
const LEG_BMK=/^-?[A-Z]{1,2}\s?\d+(?:\.\d+)?$/, LEG_NUM=/^\d+(?:-\d+)?$/, LEG_FI=/^(FI|RCD)\s*\d+$/i;
/* Schütz = Q, wie heute gelernt (DIN EN IEC 81346-2: Schütz schaltet Energie → Q) – auch wenn alte Software noch K schreibt. Vorrang: Schütz/Haupt-/Lasttrennschalter → Q,
   dann der Buchstabe aus dem Gerätekatalog (MAT_GE), dann ein von Hand gesetzter Buchstabe, dann der Name */
const legBmkArt=e=>{ if(e.art==="rcd"||e.art==="sk") return "F"; if(e.art==="kl") return "X"; if(e.art!=="ge") return "";
  const t=`${e.schutz||""} ${e.bez||""}`; if(/schütz|schuetz|haupt\s*schalter|hauptschalter|lasttrenn|trennschalter/i.test(t)) return "Q";
  const kb=e.mat&&typeof MAT_INFO!=="undefined"&&MAT_INFO[e.mat]&&MAT_INFO[e.mat].tech&&MAT_INFO[e.mat].tech.kb; if(kb) return kb;
  const hand=String(e.kz||"").trim().match(/^-?([A-Z])\s?\d/); if(hand&&/[FQKTX]/.test(hand[1])) return hand[1];
  return /stromsto|zeit|treppen|dämmer|relais|dimm|uhr/i.test(t)?"K":/trafo|transform|netzteil/i.test(t)?"T":"F"; };
function legSchemaNum(E){ const k=e=>String(e.kz||"").trim(); return E.filter(e=>legBmkArt(e)).every(e=>!k(e)||LEG_BMK.test(k(e))||LEG_NUM.test(k(e))||LEG_FI.test(k(e))); }
/* Gestuft (Max, 03.11.2026): Automaten hinter einem RCD tragen dessen Nummer – RCD -F1, dahinter -F1.1, -F1.2 …;
   FI/LS (eigener Fehlerstromschutz) und Automaten ohne RCD zählen auf der obersten Ebene weiter (-F2, -F3 …). Überschrift und FI/LS beenden die RCD-Gruppe. */
function legNummern(E){ if(!legSchemaNum(E)) return false; const z={}; let ch=false, rcd=null, sub=0; const setz=(e,kz)=>{ if(e.kz!==kz){ e.kz=kz; ch=true; } };
  E.forEach(e=>{ if(e.art==="gr"){ rcd=null; return; } const b=legBmkArt(e); if(!b) return;
    if(e.art==="sk"&&rcd&&!legIstRcbo(e)){ sub++; setz(e,`${rcd.kz}.${sub}`); return; }
    if(legIstRcbo(e)) rcd=null;
    z[b]=(z[b]||0)+1; setz(e,`-${b}${z[b]}`); if(e.art==="rcd"){ rcd=e; sub=0; } }); return ch; }
/* Einbauplatz je Gerät aus der Anordnung: Reihe und TE-Platz (wie in der Zeichnung) */
function legPlaetze(L){ const M={}; legReihen(L).forEach((r,ri)=>{ let t=0; r.g.forEach(([e,i,w])=>{ M[e.id]={r:ri+1,von:t+1,bis:t+w}; t+=w; }); }); return M; }
const legPlatzText=p=>p?`R${p.r} · ${p.von===p.bis?"Platz "+p.von:`Platz ${p.von}–${p.bis}`}`:"";
function legSave(L){ legNummern(legE(L)); if(L._geb) vtSchreiben(L); else saveRec("legenden",L); }
function legSpeichern(L){ L.stand=ecHeute(); legSave(L); }

/* ---- Ablage: beim Kunden/Standort, sonst im Ablageort „Ohne Kunde“ (Seite unter Kunden) ---- */
const legOhne=()=>legAlle().filter(L=>!L.kundeId||!kundeOf(L.kundeId));
const legVon=(kind,id)=>legAlle().filter(L=>kind==="kunden"?(kundeOf(L.kundeId)||{}).id===id:(standortOf(L.standortId)||{}).id===id);
function legItem(L,mitOrt){ const n=legSkZahl(L), o=mitOrt&&L.standortId&&standortOf(L.standortId);
  return `<div class="li" role="button" tabindex="0" data-act="legAuf" data-id="${esc(L.id)}"><span class="av">${icon("notes")}</span>
    <span class="lt"><span class="h">${esc(L.titel||"Verteiler")}</span><span class="s">${esc([o?o.name:!mitOrt?"":L.kundeId?"":L.kunde,`${n} Stromkreis${n===1?"":"e"}`,L.stand&&"Stand "+ecDatum(L.stand)].filter(Boolean).join(" · "))}</span></span>${icon("chev")}</div>`; }
/* Eintrag in der Liste unter Installation (zwischen den Prüfungen) */
const legListenAlle=()=>[...legAlle().map(legListenEintrag),...(typeof vtListenEintraege==="function"?vtListenEintraege():[])];
const legListenEintrag=L=>({leg:L,id:L.id,kundeId:kundeOf(L.kundeId)?L.kundeId:"",status:L.fertig?"fertig":"",datum:L.stand||"",updated:L.updated,titel:kundeOf(L.kundeId)?ecOrt(L.ortId||"k:"+L.kundeId).titel:(L.kunde||"Ohne Kunde"),pruefer:L.ersteller||"",createdBy:L.createdBy});
function legListenItem(L){ const e=legListenEintrag(L), n=legSkZahl(L);
  return `<div class="li" role="button" tabindex="0" data-act="legAuf" data-id="${esc(L.id)}"><span class="av">${icon("notes")}</span>
    <span class="lt"><span class="h">${esc(e.titel)}</span><span class="s">${esc(["Verteilerlegende",L.titel,`${n} Stromkreis${n===1?"":"e"}`,L.stand&&ecDatum(L.stand),L.ersteller].filter(Boolean).join(" · "))}</span>
    <span class="st">${L.fertig?pill("ok","abgeschlossen"):pill("wip","in Arbeit")}${kundeOf(L.kundeId)?"":pill("open","ohne Kunde")}</span></span>${icon("chev")}</div>`; }
/* Abschnitt in der Kunden-/Standortansicht */
function legBeiKunde(kind,r){ const A=legVon(kind,r.id);
  return kdKopf("Verteilerlegenden","legNeu","Legende anlegen",` data-kind="${kind}" data-id="${esc(r.id)}"`)+(A.length?listOf(A.map(L=>legItem(L,kind==="kunden"))):`<p class="meta">Noch keine Legende – Stromkreisliste für die Hager-Tasche im Verteiler.</p>`); }
/* Eintrag „Ohne Kunde“ ganz unten in der Kundenliste – im A–Z-Register unter „*“ */
function legOhneEintrag(abc){ const n=legOhne().length;
  const li=listOf([`<div class="li" role="button" tabindex="0" data-act="nav" data-v="ohnekunde"><span class="av">${icon("folder")}</span>
    <span class="lt"><span class="h">Ohne Kunde</span><span class="s">${n?`${n} Verteilerlegende${n===1?"":"n"} ohne Kunde`:"Verteilerlegenden, die noch keinem Kunden gehören"}</span></span>${icon("chev")}</div>`]);
  return abc?`<div class="abc-gr"><div class="abc-b" aria-hidden="true">*</div><div class="abc-l">${li}</div></div>`:`<div class="leg-ohne">${li}</div>`; }
/* Ablageort „Ohne Kunde“: je Art ein Abschnitt (bisher Verteilerlegenden, später mehr) */
function legOhneView(){ const A=legOhne();
  return `<div class="narrow">${A.length?`<div class="sec-lbl">Verteilerlegenden · ${A.length}</div>${listOf(A.map(legListenItem))}`:`<div class="empty">${icon("folder")}<h2>Hier liegt nichts</h2><p>Ablage für alles, was (noch) keinem Kunden gehört – z. B. Verteilerlegenden, die vor Ort schnell angelegt wurden. Zuordnen geht jederzeit über „Kunde zuordnen“.</p></div>`}</div>`; }

/* ---- Neue Legende (kid/ort aus der Kunden- oder Standortansicht, sonst ohne Kunde) ---- */
let legNeuBei=null;
function legNeuDlg(kind,id){ const s=kind==="standorte"&&standortOf(id), k=kind==="kunden"?kundeOf(id):s?kundeOf(s.kundeId):null;
  legNeuBei=k?{kid:k.id,ort:s?s.id:null}:null;
  dialog("Neue Verteilerlegende",`<div class="fg1">${tf("legVt","Verteiler",LEG_VT[0],{form:true,ph:"z. B. HV Keller"})}</div>
    <div class="chips ec-wahl">${LEG_VT.map(v=>`<button type="button" class="chip" data-act="legSetz" data-ziel="f_legVt" data-v="${esc(v)}">${esc(v)}</button>`).join("")}</div>
    ${k&&!s?`<div class="fg1" style="margin-top:14px">${ecOrtFeld(k.id)}</div>`:""}
    ${k?"":`<p class="meta" style="margin:12px 4px 0">Wird unter Kunden › „Ohne Kunde“ abgelegt. Kunde und Anschrift trägst du in der Legende ein oder ordnest sie später einem Kunden zu.</p>`}`,
    `<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="legNeuOk">Anlegen</button>`,{breit:true}); }
/* Zuordnung setzen: ortId wie bei den Prüfungen („k:<Kunde>“ oder Standort-ID) */
function legOrtSetzen(L,ortId){ const o=ortId?ecOrt(ortId):null;
  if(!o||!o.kunde){ L.kundeId=""; L.standortId=""; L.ortId=""; return; }
  L.ortId=ortId; L.kundeId=o.kunde.id; L.standortId=o.standort?o.standort.id:""; L.kunde=o.kunde.name;
  const adr=adrText(o.standort)||adrText(o.kunde); if(adr) L.anschrift=adr; }
function legNeuOk(){ const F=formVals(), B=legNeuBei;
  const L={id:uid(),titel:F.legVt||"Verteiler",kunde:"",anschrift:"",kundeId:"",standortId:"",ortId:"",netz:"",ersteller:(n=>legTeam().includes(n)?n:"")(ME.name||(META.profil&&META.profil.name)||""),stand:ecHeute(),eintraege:[]};
  if(B) legOrtSetzen(L,B.ort||F.ecOrt||"k:"+B.kid);
  saveRec("legenden",L,true); legNeuBei=null; closeOverlays(); go({v:"legende",id:L.id}); }
function legZuDlg(){ const L=legAkt(); if(!L) return; const K=live("kunden").sort((a,b)=>a.name.localeCompare(b.name,"de")), kid=(kundeOf(L.kundeId)||{}).id||"";
  dialog(kid?"Zuordnung ändern":"Kunde zuordnen",`<div class="fg1">${sf("legZuK","Kunde",kid,[["","Ohne Kunde"],...K.map(k=>[k.id,k.name+(k.kdnr?` (${k.kdnr})`:"")])],{form:true})}
    <div id="legOrtFeld">${ecOrtFeld(kid,L.ortId||"")}</div></div>
    <p class="meta" style="margin:12px 4px 0">Die Legende wird dabei zum Verteiler beim Kunden – mit allen Zeilen. Kunde und Anschrift kommen dann aus den Kundendaten.</p>`,
    `<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="legZuOk">Übernehmen</button>`,{breit:true}); }
function legZuruck(L){ const s=L&&L.standortId&&standortOf(L.standortId), k=L&&kundeOf(L.kundeId);
  return s?{v:"standort",id:s.id}:k?{v:"kunde",id:k.id}:{v:"ohnekunde"}; }

/* ---- Bearbeiten ---- */
const legFeld=(L,k,l,o={})=>`<div class="tf${L[k]||o.ph||o.type==="date"?" fl":""}"><input id="f_leg_${k}" data-leg="${k}" value="${esc(L[k]||"")}" placeholder="${esc(o.ph||" ")}" ${o.type?`type="${o.type}"`:""} autocomplete="off" ${L.fertig?"disabled":""}><label for="f_leg_${k}">${esc(l)}</label></div>`;
function legZeile(e,zu){ const t=e.art==="gr";
  return `<button type="button" class="leg-z z-${e.art}" data-act="legEdit" data-id="${esc(e.id)}" ${zu?"disabled":""}>${t?`<span class="bz">${esc(e.bez||"Überschrift")}</span>`
    :`<span class="kz">${esc(e.kz||"–")}</span><span class="bz">${e.art==="res"?`<i>Reserve</i>`:esc(e.bez||"–")}${e.art==="rcd"?` <span class="leg-rcd">RCD</span>`:""}</span><span class="sc">${esc(legSchutz(e))}</span>`}</button>`; }
/* Reiter der Verteilerseite – wie die Schritte einer Prüfung in EVSE unten in der Leiste */
function legTabs(L){ const T=L&&(L.art==="hv"||L.zs)?[["zs","Zählerschrank","zsSchrank","Zähler"],["sk","Stromkreise","zsBlitz"],["mat","Material","liste"],["ab","Abschluss","done"]]:L&&L.art==="gw"?[["sk","Stromkreise","zsBlitz"],["ab","Abschluss","done"]]:[["uv","Verteiler","zsSchrank"],["sk","Stromkreise","zsBlitz"],["ab","Abschluss","done"]];
  if(L&&L._geb&&!T.some(x=>x[0]==="mat")) T.splice(T.length-1,0,["mat","Material","liste"]);   /* Material auch beim Unterverteiler */
  return L&&L._geb&&typeof vuView==="function"?[["info","Übersicht","info"],...T]:T; }
/* Ohne gewählten Reiter: fertig aufgenommene Verteiler öffnen mit der Übersicht, neue/leere mit dem Aufbau */
const legTab=L=>{ const T=legTabs(L); if(T.some(x=>x[0]===nav.tab)) return nav.tab; const s=T[0][0]==="info"&&!legE(L).length&&!L.fertig?1:0; return T[s][0]; };
function legFab(L){ if(!L||L.fertig) return null; const t=legTab(L); return t==="sk"||t==="uv"?["awStart","Gerät","add"]:null; }
function legView(L){ const E=legE(L), tab=legTab(L);
  if(tab==="info") return vuView(L);
  if(tab==="zs") return `<div class="narrow ec-spalte leg">${typeof zsKarte==="function"?zsKarte(L,true):""}</div>`;
  if(tab==="uv") return `<div class="narrow ec-spalte leg">${legUvKarte(L)}${typeof hbLink==="function"?`<div class="leg-hb">${hbLink("hb-verteiler","So bauen und beschriften wir Verteiler")}</div>`:""}</div>`; /* Handbuch gehört zum Aufbauen, nicht in die Übersicht */
  if(tab==="mat") return typeof vmView==="function"?vmView(L):`<div class="narrow ec-spalte leg">${typeof zsMaterialKarte==="function"?zsMaterialKarte(L):""}</div>`;
  if(tab==="sk") return `<div class="narrow ec-spalte leg">${legSkKarte(L,E)}</div>`;
  return `<div class="narrow ec-spalte leg">
    <section class="card"><h3>${L._geb?"Angaben":"Anlage"}</h3>${(()=>{ const o=kundeOf(L.kundeId)?ecOrt(L.ortId||"k:"+L.kundeId):null;
      return `<div class="ec-hinweis leg-zu">${icon(o?"firma":"folder")}<span>${o?`Gehört zu <b>${esc(o.titel)}</b>${L.anschrift?` · ${esc(L.anschrift)}`:""}`:"Liegt unter „Ohne Kunde“"}</span>${L._geb?"":`<button type="button" class="btn-tonal" data-act="legZu">Kunde zuordnen</button>`}</div>`; })()}<div class="ec-fg">
      ${legBauart(L)?`<p class="leg-bauart">${esc(legBauart(L))}</p>`:""}
      <div class="reihe2">${legFeld(L,"titel","Verteiler",{ph:"z. B. HV Keller"})}${legFeld(L,"stand","Stand",{type:"date"})}</div>
      ${L._geb?"":`${legFeld(L,"kunde","Kunde",{ph:"Name oder Firma"})}
      ${legFeld(L,"anschrift","Anschrift",{ph:"Straße, PLZ Ort"})}`}
      <div class="reihe2"><div class="tf fl"><select id="f_leg_netz" data-leg="netz" ${L.fertig?"disabled":""}>${LEG_NETZ.map(n=>`<option value="${esc(n)}" ${n===(L.netz||"")?"selected":""}>${esc(n||"nicht angeben")}</option>`).join("")}</select><label for="f_leg_netz">Netzform</label><span class="arr">${icon("drop")}</span></div>${legWerSel(L)}</div>
    </div></section>
    ${L._geb&&typeof qrKarte==="function"?qrKarte(L):""}
    ${legEtiKarte(L)}
        <div class="leg-fuss">${canEdit(L)?`<button type="button" class="btn-tonal leg-del" data-act="legDelAsk">${icon("del")}Löschen</button>`:""}<span style="flex:1"></span>${L.fertig?`<button type="button" class="btn-tonal" data-act="legFertig" data-v="0">${icon("edit")}Bearbeiten</button>`:""}<button type="button" class="btn-tonal leg-pdf" data-act="legPdf">${icon("pdf")}PDF erstellen</button></div>
  </div>`; }

/* Karte „Verteiler“ beim Unterverteiler: Zeichnung mit der Bestückung, darunter Reihen und Montage direkt umstellbar */
function legUvKarte(L){ if(typeof uvZeichnung!=="function") return ""; const Z=uvZeichnung(L), n=+L.reihen||3, zu=L.fertig;
  const chip=(act,k,v,t,an)=>`<button type="button" class="chip" data-act="${act}" data-k="${k}" data-v="${v}" aria-pressed="${an}" ${zu?"disabled":""}>${t}</button>`;
  return `<section class="card zs-karte"><div class="card-kopf"><h3>Verteiler</h3><span class="zs-kopf-r">${legBildKnopf()}</span></div>
    <div class="zs-bild"${legBildAn()?"":" hidden"}>${Z.svg}</div>
    ${Z.ueber?`<p class="ec-hinweis">${icon("warn")}<span>${Z.ueber===1?"Eine Reihe passt":`${Z.ueber} Reihen passen`} nicht mehr in den Verteiler – mehr Reihen wählen.</span></p>`:""}
    ${(()=>{ /* Verteilertyp: genormte Hager-volta-Größen legen Reihen, Montage und TE fest – frei einstellen nur bei „anderer Typ“ */
      const M=uvMasse(L), frei=!M.modell||L.typFrei, mo=M.up?"Unterputz":"Aufputz";
      return `<button type="button" class="zs-zp leg-typ" data-act="uvTyp" ${zu?"disabled":""}><span class="zs-zn zs-bst">${icon("zsSchrank")}</span><span class="zs-zt"><b>${esc(frei?"Anderer Verteilertyp":`Hager volta ${M.modell}`)}</b><small>${esc(`${M.n}-reihig · ${mo} · ${frei?`${M.te} TE je Reihe`:`${M.n*M.te} TE`}`)}</small></span>${icon("chev")}</button>
      ${frei?`<div class="leg-vopt"><span class="leg-o"><span>Reihen</span>${[1,2,3,4,5,6,7,...(n>7?[n]:[])].map(v=>chip("legOpt","reihen",v,v,n===v)).join("")}</span>
        <span class="leg-o"><span>Montage</span>${chip("legOptS","montage","ap","Aufputz",L.montage==="ap")}${chip("legOptS","montage","up","Unterputz",L.montage!=="ap")}</span>
        <span class="leg-o"><span>TE je Reihe</span>${[12,18,24].map(v=>chip("legOpt","teReihe",v,v,(+L.teReihe||12)===v)).join("")}</span></div>`:""}`; })()}
    ${legVonFeld(L)}
    ${legE(L).length?"":`<p class="meta">Noch keine Geräte. Unten rechts über „Gerät“ einsetzen – Reihen-Vorlagen wie RCD + 6 × B16 gehen in einem Rutsch.</p>`}</section>`; }
/* Karte „Stromkreise“ (Reiter Stromkreise) */
function legSkKarte(L,E){ return `<section class="card"><div class="card-kopf leg-kopf"><h3>Stromkreise${E.length?` <small class="leg-n">${legSkZahl(L)}</small>`:""}</h3>${E.length?seg("legAnsicht",legAnsicht(),[["liste","Liste"],["verteiler","Verteiler"]],"leg-seg"):""}</div>
      ${E.length?(legAnsicht()==="verteiler"?legVtView(L):legListeView(L)):`<p class="meta">Noch keine Geräte. Unten rechts über „Gerät“ einsetzen – Gerät aus der Materialliste antippen, die Kennzeichnung zählt mit. Oder eine ganze Liste auf einmal einfügen.</p>`}
      ${nav.v==="vt"&&!L.fertig&&!E.length?`<div class="leg-imp"><button type="button" class="kd-tel-neu" data-act="vtImpHier">${icon("vtListe")}<span>Liste einfügen</span></button></div>`:""}
    </section>
`; }
/* ===== Ansichten der Stromkreise: Liste (je RCD eine Gruppe) und Verteiler (Reihen, Breite in TE) ===== */
const legAnsicht=()=>META.legAnsicht==="verteiler"?"verteiler":"liste";
const legBauart=L=>[{hv:"Zählerschrank / HV",uv:"Unterverteiler",gw:"Gewerbe / Standverteiler"}[L.art],L.zs&&typeof zsHerstText==="function"?zsHerstText(L.zs.hersteller):"",{ap:"Aufputz",up:"Unterputz"}[L.montage],L.zs&&+L.zs.hoehe?L.zs.hoehe+" mm":"",L.reihen&&`${L.reihen}-reihig · ${L.reihen*(+L.teReihe||12)} TE`].filter(Boolean).join(" · ");
/* Breite in TE. Dreipolige LS sind mindestens 3 TE breit – auch wenn aus der Aufnahme noch die Breite eines 1-poligen Artikels (1 TE) gespeichert ist */
const legTE=e=>e.art==="kl"?1:e.art==="sk"&&+e.pole===3?Math.max(3,+e.te||3):+e.te||(e.art==="rcd"?4:1);
/* FI/LS (RCBO) hat seinen eigenen Fehlerstromschutz: gehört NIE unter den RCD davor und beendet dessen Gruppe */
const legIstRcbo=e=>!!e&&e.art==="sk"&&/FI\s*\/\s*LS|LS\s*\/\s*FI|RCBO/i.test(e.schutz||"");
const legOffen=e=>e.art==="sk"&&/^\s*\??\s*$/.test(e.bez||"");
/* Liste: RCD als Kopf, seine Automaten eingerückt darunter; Überschriften trennen */
function legListeView(L){ const E=legE(L), zu=L.fertig, B=[], PL=legPlaetze(L); let g=null; const pl=e=>PL[e.id]?`<small class="leg-pl">${esc(legPlatzText(PL[e.id]))}</small>`:"";
  E.forEach((e,i)=>{ if(e.art==="gr"){ B.push({gr:e}); g=null; } else if(e.art==="rcd"){ g={rcd:e,i,kids:[]}; B.push(g); } else if(g&&e.art!=="ge"&&!legIstRcbo(e)){ g.kids.push([e,i]); g.last=i; } else if(legIstRcbo(e)){ g=null; B.push({z:[e,i]}); } else B.push({z:[e,i]}); });
  const zeile=([e],kl)=>`<button type="button" class="leg-r${kl||""}${e.art==="res"?" res":""}${legOffen(e)?" offen":""}" data-act="legEdit" data-id="${esc(e.id)}" ${zu?"disabled":""}><span class="kz">${esc(e.kz||"–")}</span><span class="bz">${e.art==="res"?"Leerplatz":legOffen(e)?"? – noch unbekannt":esc(e.bez)}${pl(e)}</span>${legSchutz(e)?`<span class="sc">${esc(legSchutz(e))}</span>`:""}</button>`;
  return `<div class="leg-gl">${B.map(b=>b.gr?`<button type="button" class="leg-ue" data-act="legEdit" data-id="${esc(b.gr.id)}" ${zu?"disabled":""}>${esc(b.gr.bez||"Überschrift")}</button>`
    :b.z?`<div class="leg-grp solo">${zeile(b.z)}</div>`
    :`<div class="leg-grp"><button type="button" class="leg-gk" data-act="legEdit" data-id="${esc(b.rcd.id)}" ${zu?"disabled":""}><span class="kz">${esc(b.rcd.kz||"–")}</span><span class="bz">${esc(b.rcd.bez||"Fehlerstromschutzschalter")}<span class="leg-rcd">RCD</span>${pl(b.rcd)}</span>${b.rcd.schutz?`<span class="sc">${esc(b.rcd.schutz)}</span>`:""}</button>
      ${b.kids.map(k=>zeile(k," kind")).join("")}${zu?"":`<button type="button" class="leg-add" data-act="legNach" data-i="${b.last!=null?b.last:b.i}">${icon("add")}Stromkreis an ${esc(b.rcd.kz||"RCD")}</button>`}</div>`).join("")}
    ${zu?"":`<div class="leg-neu"><button type="button" data-act="legNeuRcd">${icon("add")}Neuer RCD mit Stromkreisen</button></div>`}</div>`; }
/* Reihen bilden: Breite je Gerät in TE, „Neue Reihe ab hier“ bricht um */
function legReihen(L){ const n=+L.teReihe||12, R=[]; let r=null;
  legE(L).forEach((e,i)=>{ if(e.art==="gr") return; const w=Math.min(legTE(e),n); if(!r||e.umbruch||r.te+w>n){ r={te:0,g:[]}; R.push(r); } r.g.push([e,i,w]); r.te+=w; });
  return R; }
/* Gezeichneter Verteiler: Geräte schlicht und herstellerneutral, feste Größe (50 px je TE), darunter Beschriftung wie im Streifen */
const LEG_P=50;
/* Gerätebild je Eintrag (Frontansichten aus dem Konfigurator von zaehlerschrank24.de, 92 × 400 px je TE): [Datei, Bild-TE] */
function legBildFuer(e){ const t=legTE(e);
  if(e.art==="rcd") return ["rcd.jpg",4];
  if(e.art==="res") return ["blind1.jpg",1];
  if(e.art==="sk"){ if(+e.pole===3) return t>=4?["fils3.jpg",4]:["ls3.jpg",3]; return t>=2?["fils1.jpg",2]:["ls1.jpg",1]; }
  return ["blind1.jpg",1]; }
const LEG_H=()=>LEG_P*400/92;
/* Hager-Geräte (eigene Bilder, 184 × 800 px je TE, ohne Nennstrom-Aufdruck) nach Artikelnummer:
   [Datei, TE im Bild, Aufdruck x-Anteil, y-Anteil, Anker, Schriftgröße als Anteil der Höhe] */
const LEG_HAGER={"mbs-1p":[1,.53,.362,"middle",.045],"mbs-3p":[3,.183,.385,"middle",.045],
  "mbn-1p":[1,.55,.355,"middle",.045],"mbn-2p":[2,.275,.355,"middle",.045],"mbn-3p":[3,.183,.355,"middle",.045],"mbn-4p":[4,.2,.355,"middle",.045],
  "cds-2p":[2,.97,.30,"end",.034],"cda-2p":[2,.97,.30,"end",.034],"cds-4p":[4,.97,.345,"end",.045],"cda-4p":[4,.97,.345,"end",.045],
  "ads-1pn":[2,.25,.335,"start",.045],"ada-1pn":[2,.22,.335,"start",.045],"adm-4p":[4,.27,.43,"start",.045],"adx-4p":[4,.27,.33,"start",.045]};
/* Oberkante der blauen Hager-Linie im Bild (Pixel von 2000) – alle Geräte werden so verschoben, dass diese Linie
   in einer Flucht liegt wie im echten Verteiler (Mitte der Front auf der Hutschiene). Ohne Linie: Oberkante der Front. */
/* Unterkante der blauen Beschriftungsklappe im Bild – Abstand Linie→Klappe ist bei Hager immer gleich; die Bilder sind aber
   unterschiedlich gestaucht, deshalb wird jedes Bild senkrecht so skaliert, dass beide Kanten bei allen Geräten in einer Flucht liegen. */
const LEG_KAPPE={"ada-1pn":1580,"adm-4p":1546,"ads-1pn":1498,"adx-4p":1443,"cda-2p":1523,"cda-4p":1551,"cds-2p":1543,"cds-4p":1544,"egn100":1505,"egn103":1447,"emn001":1618,"epn510":1728,"eps410b":1655,"erc218":1708,"esc225":1528,"esc425":1644,"esc440":1523,"evn004":1588,"mbn-1p":1445,"mbn-2p":1502,"mbn-3p":1470,"mbn-4p":1527,"mbs-1p":1420,"mbs-3p":1495,"sbn116":1543,"sbn240":1555,"sbn440":1578}, LEG_KAPPE_ABST=990;
const LEG_LINIE={"ada-1pn":532,"adm-4p":640,"ads-1pn":489,"adx-4p":511,"cda-2p":511,"cda-4p":546,"cds-2p":514,"cds-4p":503,"egn100":576,"egn103":539,"egn200":554,"ehn010":470,"emn001":539,"epn510":637,"eps410b":739,"erc218":659,"esc225":548,"esc425":615,"esc440":620,"evn004":602,"ezm100":560,"him402":545,"him404":533,"him406":596,"mbn-1p":452,"mbn-2p":540,"mbn-3p":525,"mbn-4p":550,"mbs-1p":446,"mbs-3p":556,"sbn116":515,"sbn240":575,"sbn440":580,"st303":606}, LEG_LINIE_SOLL=540;
function legHagerBild(e,w){ const m=String(e.mat||"").toUpperCase().replace(/[\s.-]/g,""); let k="";
  if(typeof MAT_GE!=="undefined"){ const g=MAT_GE.find(x=>x[0]===m); if(g) return g[2]===w?{f:"hager/"+m.toLowerCase()+".webp",c:[w,0,0,"middle",0],k:m.toLowerCase()}:null; }
  if(/^M[BC]S/.test(m)) k=w>=3?"mbs-3p":"mbs-1p";
  else if(/^M[BC]N/.test(m)) k=["mbn-1p","mbn-2p","mbn-3p","mbn-4p"][Math.min(4,w)-1];
  else if(/^CDS/.test(m)) k=w>=4?"cds-4p":"cds-2p";
  else if(/^CD/.test(m)) k=w>=4?"cda-4p":"cda-2p";
  else if(/^ADS/.test(m)) k="ads-1pn"; else if(/^ADM/.test(m)) k="adm-4p";
  else if(/^AD/.test(m)) k=w>=4?"adx-4p":"ada-1pn";
  const c=LEG_HAGER[k]; return c&&c[0]===w?{f:"hager/"+k+".webp",c,k}:null; }   /* Höhe eines Geräts im Verhältnis zur Breite */
/* Gerät zeichnen: x = linke Kante, w = Breite in TE, oben bei y0 (Mitte = Hutschiene) */
function legGeraetBild(e,x,w,y0,P,bild){ const H=P*400/92, B=bild||"../bilder/vt/";
  if(e.art==="kl"){ const fb=e.farbe||(/pe/i.test(e.bez||"")?"pe":/^\s*a\b|abzweig/i.test(e.bez||"")?"a":"n"), h=P*717/140; /* farbe geht beim Speichern verloren – Bezeichnung entscheidet; unverzerrt, höher als ein Automat */
    return `<image href="${B}pollmann-${fb==="pe"?"pe":fb==="a"?"a":"n"}14s.png" x="${x}" y="${(y0+H/2-h/2).toFixed(1)}" width="${w*P}" height="${h.toFixed(1)}"/>`; }
  /* Aufdruck: Nennstrom bzw. RCD-Daten */
  const sc=e.art==="rcd"?String(e.schutz||"").replace(/\s*Typ.*$/i,"").replace(/\s*\/\s*/," "):legSchutz(e).replace(/\s*3-polig$/i,"").replace(/\s*FI\/LS.*$/i,"");
  const hb=legHagerBild(e,w);
  if(hb){ const [,fx,fy,an,fs]=hb.c, W=w*P, li=LEG_LINIE[hb.k], ka=LEG_KAPPE[hb.k], sv=li!=null&&ka?LEG_KAPPE_ABST/(ka-li):1, Hs=H*sv,
      yb=li!=null?y0+LEG_LINIE_SOLL/2000*H-li/2000*Hs:y0;
    return `<image href="${B}${hb.f}" x="${x}" y="${yb.toFixed(1)}" width="${W}" height="${Hs.toFixed(1)}" preserveAspectRatio="none"/>`
      +(sc?`<text x="${(x+W*fx).toFixed(1)}" y="${(yb+Hs*fy).toFixed(1)}" font-size="${(H*fs).toFixed(1)}" font-weight="700" text-anchor="${an}" dominant-baseline="middle" fill="#333">${esc(sc.slice(0,e.art==="rcd"?16:8))}</text>`:""); }
  const [f,bt]=legBildFuer(e); let s="";
  if(f==="blind1.jpg"){ for(let k=0;k<w;k++) s+=`<image href="${B}${f}" x="${x+k*P}" y="${y0}" width="${P}" height="${H.toFixed(1)}" preserveAspectRatio="none"/>`; return s; }
  s+=`<image href="${B}${f}" x="${x}" y="${y0}" width="${w*P}" height="${H.toFixed(1)}" preserveAspectRatio="none"/>`;
  /* Aufdruck im weißen Feld */
  if(sc) s+=`<text x="${(x+w*P/2).toFixed(1)}" y="${(y0+H*.72).toFixed(1)}" font-size="${(P*(e.art==="rcd"?.3:w>1?.36:.32)).toFixed(1)}" font-weight="800" text-anchor="middle" fill="#2A2D31">${esc(sc.slice(0,e.art==="rcd"?16:8))}</text>`;
  return s; }
function legGeraet(e,x,w){ return legGeraetBild(e,x,w,0,LEG_P); }
/* Text in schmale Felder umbrechen: zusammengesetzte Wörter an der Wortfuge trennen (Kinder-zimmer), sonst hart, höchstens 3 Zeilen */
const LEG_FUGE=/(zimmer|küche|maschine|licht|steckdosen|dosen|heizung|kanal|erhitzer|pumpe|garage|keller|raum|flur|bad|wohnung|anlage|versorgung|schalter|leuchte|beleuchtung|säule|box|sicherung|steuerung)$/i;
const legWrap=(t,max)=>{ const w=[]; String(t||"").split(/\s+/).filter(Boolean).forEach(x=>{ if(x.length>max){ const m=x.match(LEG_FUGE); if(m&&x.length-m[0].length>=3&&x.length-m[0].length<max){ w.push(x.slice(0,x.length-m[0].length)+"-"); x=x.slice(x.length-m[0].length); } }
    while(x.length>max){ w.push(x.slice(0,max-1)+"-"); x=x.slice(max-1); } w.push(x); });
  const Z=[]; let z=""; w.forEach(x=>{ if((z+" "+x).trim().length>max&&z){ Z.push(z); z=x; } else z=z.endsWith("-")?z+x:(z+" "+x).trim(); }); if(z) Z.push(z);
  return Z.length>3?[...Z.slice(0,2),Z[2].slice(0,max-1)+"…"]:Z; };
function legVtView(L){ const n=+L.teReihe||12, P=LEG_P, R=legReihen(L), zu=L.fertig, B=n*P;
  /* Handy: ganze Reihe passt in die Breite (kein seitliches Wischen). Im Bild nur die Kennzeichnung, darunter die Beschriftung als Liste. */
  const mobil=matchMedia("(max-width:599px)").matches, kzF=mobil?19:10.5, kzH=mobil?30:20;
  return R.map((r,ri)=>{ const GH=LEG_H(1), KY=GH+10; let x=0, hoch=KY+(mobil?kzH+8:64); const g=r.g.map(([e,i,w])=>{ const X=x*P, Wd=w*P, sym=mobil?"":legSymFuer(e), z=mobil?[]:legWrap(e.art==="res"?"Reserve":legOffen(e)?"?":e.bez,w>1?w*8:8), fz=w>1?10.5:z.some(t=>t.length>7)?9:10.5;
        const kz=String(e.kz||"").slice(0,w>1?16:7), eng=mobil&&kz.length*kzF*.62>Wd-8;
        const out=`<g class="leg-dev"${zu||e.art==="kl"||e.art==="res"?"":` data-act="legProdukt"`} data-id="${esc(e.id)}"><title>${esc([e.kz,e.bez,legSchutz(e)].filter(Boolean).join(" · "))}</title>${legGeraet(e,X,w)}
          ${e.art==="kl"?"":`<rect x="${X+2}" y="${KY}" width="${Wd-4}" height="${kzH}" rx="${mobil?6:4}" fill="${e.art==="rcd"?"#2F6FD1":e.art==="res"?"#A9AEB6":"#737A84"}"/><text x="${X+Wd/2}" y="${KY+kzH/2+kzF*.36}" font-size="${kzF}" font-weight="800" text-anchor="middle" fill="#fff"${eng?` textLength="${Wd-8}" lengthAdjust="spacingAndGlyphs"`:""}>${esc(kz)}</text>`}
          ${sym?`<g transform="translate(${X+Wd/2-11} ${KY+28})" class="leg-sym">${legSymSvg(sym,22,true)}</g>`:""}
          ${z.map((t,k)=>`<text x="${X+Wd/2}" y="${KY+(sym?66:40)+(e.art==="kl"?20:0)+k*13}" font-size="${fz}" font-weight="600" text-anchor="middle" class="leg-st">${esc(t)}</text>`).join("")}</g>`; if(!mobil) hoch=Math.max(hoch,KY+(sym?66:40)+(z.length-1)*13+10+(e.art==="kl"?20:0)); x+=w; return out; }).join("");
      const frei=n-r.te, last=r.g[r.g.length-1][1];
      const fr=frei>0?`<g class="leg-frei" ${zu?"":`data-act="legNach" data-i="${last}"`}><rect x="${x*P+2}" y="${GH*.12}" width="${frei*P-4}" height="${GH*.76}" rx="5" class="leg-fr"/><text x="${x*P+frei*P/2}" y="${frei>1?GH/2-4:GH/2-18}" font-size="${(frei>1?12:10)*(mobil?1.6:1)}" font-weight="800" text-anchor="middle" class="leg-frt">${frei>1?`${frei} TE frei`:"frei"}</text>${zu?"":`<text x="${x*P+frei*P/2}" y="${frei>1?GH/2+16*(mobil?1.6:1):GH/2+2}" font-size="${16*(mobil?1.6:1)}" font-weight="700" text-anchor="middle" class="leg-frt">+</text>`}</g>`:"";
      /* Beschriftung unter der Reihe (nur Handy): Kennzeichnung, Bezeichnung, Schutz – antippen bearbeitet */
      const leg=mobil?`<div class="leg-rl">${r.g.filter(([e])=>e.art!=="kl").map(([e])=>`<button type="button" class="leg-rl-z${e.art==="rcd"?" rcd":""}" data-act="legEdit" data-id="${esc(e.id)}" ${zu?"disabled":""}><span class="kz">${esc(e.kz||"–")}</span><span class="bz">${e.art==="res"?"Reserve":e.art==="rcd"?esc(e.bez||"Fehlerstromschutzschalter"):legOffen(e)?"? – noch unbekannt":esc(e.bez||"–")}</span><span class="sc">${esc(legSchutz(e))}</span></button>`).join("")}</div>`:"";
      return `<div class="leg-reihe" style="width:min(100%,${Math.round(B*1.45)+28}px)"><div class="leg-rk">Reihe ${ri+1}<span>${r.te} von ${n} TE belegt</span></div><div class="leg-rs"><svg viewBox="0 ${r.g.some(([e])=>e.art==="kl")?-20:0} ${B} ${hoch+(r.g.some(([e])=>e.art==="kl")?20:0)}" class="leg-svg" role="img" aria-label="Reihe ${ri+1}"><rect x="0" y="${GH/2-17}" width="${B}" height="34" rx="2" fill="#C9CDD2"/><rect x="0" y="${GH/2-11}" width="${B}" height="22" fill="#B5BAC0"/>${g}${fr}</svg></div>${leg}</div>`; }).join(""); }
/* ===== Symbole für Beschriftung (eigene, schlichte Piktogramme, 24er-Raster, Linien) ===== */
const LEG_SYM={
  steckdose:'<circle cx="12" cy="12" r="9"/><circle cx="8.6" cy="12" r="1.3" class="f"/><circle cx="15.4" cy="12" r="1.3" class="f"/>',
  licht:'<path d="M9 17h6M10 20h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V17h5v-1.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
  herd:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="2.4"/><circle cx="15.5" cy="8.5" r="2.4"/><circle cx="8.5" cy="15.5" r="2.4"/><circle cx="15.5" cy="15.5" r="2.4"/>',
  backofen:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 8h18"/><rect x="6.5" y="11" width="11" height="7" rx="1"/>',
  spuelmaschine:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 7h16"/><path d="M12 11c-1.6 2-2.4 3.2-2.4 4.2a2.4 2.4 0 0 0 4.8 0c0-1-.8-2.2-2.4-4.2z"/>',
  waschmaschine:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 7h16"/><circle cx="12" cy="14" r="4.5"/>',
  trockner:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 7h16"/><circle cx="12" cy="14" r="4.5"/><path d="M10.5 12.5c1 .8 2 .8 3 0M10.5 15.5c1 .8 2 .8 3 0"/>',
  kuehl:'<rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M5 9.5h14M8 5.5v2M8 12.5v3"/>',
  wasser:'<path d="M12 3c-3.5 4.5-5.5 7.5-5.5 10a5.5 5.5 0 0 0 11 0c0-2.5-2-5.5-5.5-10z"/><path d="M12.8 10l-2 3.4h2.6l-2 3.4"/>',
  heizung:'<path d="M6 5v14M10 5v14M14 5v14M18 5v14M4 19h16"/>',
  wp:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="10" cy="12" r="4.5"/><path d="M10 7.5v9M5.5 12h9M17 8v8"/>',
  wallbox:'<rect x="5" y="3" width="10" height="14" rx="2"/><path d="M8 7h4M10 17v2a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-4"/><path d="M16.5 12h3v3h-3z"/>',
  pv:'<path d="M5 5h14l2 10H3z"/><path d="M4 10h16M9.7 5l-.7 10M14.3 5l.7 10M12 15v4M8 19h8"/>',
  edv:'<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M9 20h6M12 16v4"/>',
  netzwerk:'<rect x="9" y="3" width="6" height="5" rx="1"/><rect x="3" y="16" width="6" height="5" rx="1"/><rect x="15" y="16" width="6" height="5" rx="1"/><path d="M12 8v4M6 16v-4h12v4"/>',
  klingel:'<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  rollladen:'<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M4 7h16M4 10.5h16M4 14h16"/>',
  aussen:'<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>',
  motor:'<circle cx="12" cy="12" r="8.5"/><path d="M8 15.5V8.5l4 4.5 4-4.5v7"/>' };
const LEG_SYM_LISTE=[["steckdose","Steckdose"],["licht","Licht"],["herd","Herd/Kochfeld"],["backofen","Backofen"],["spuelmaschine","Spülmaschine"],["waschmaschine","Waschmaschine"],["trockner","Trockner"],["kuehl","Kühlschrank"],["wasser","Durchlauferhitzer"],["heizung","Heizung"],["wp","Wärmepumpe"],["wallbox","Wallbox"],["pv","PV-Anlage"],["edv","EDV"],["netzwerk","Netzwerk"],["klingel","Klingel"],["rollladen","Rollladen"],["aussen","Außen/Allgemein"],["motor","Motor/Pumpe"]];
const LEG_SYM_WORT=[[/durchlauf|boiler|warmwasser/,"wasser"],[/wärmepumpe|\bwp\b/,"wp"],[/wallbox|ladest|ladesäule|ladepunkt/,"wallbox"],[/\bpv\b|photovolt|solar|wechselrichter/,"pv"],[/spül/,"spuelmaschine"],[/wasch/,"waschmaschine"],[/trockn/,"trockner"],[/kühl|gefrier/,"kuehl"],[/backofen|ofen/,"backofen"],[/herd|kochfeld/,"herd"],[/heiz/,"heizung"],[/edv|server|computer|\bpc\b/,"edv"],[/netzwerk|router|switch|knx|sat/,"netzwerk"],[/klingel|sprech/,"klingel"],[/roll|jalous|markise/,"rollladen"],[/pumpe|motor|garagentor|tor\b/,"motor"],[/licht|beleucht|lampe/,"licht"],[/steckd|dose|brüstung/,"steckdose"],[/außen|aussen|garten|allgemein|treppenhaus/,"aussen"]];
function legSymFuer(e){ if(e.art==="rcd"||e.art==="res") return ""; if(e.sym==="keins") return ""; if(e.sym&&LEG_SYM[e.sym]) return e.sym;
  const b=String(e.bez||"").toLowerCase(); const f=LEG_SYM_WORT.find(([re])=>re.test(b)); return f?f[1]:""; }
const legSymSvg=(k,px,inner)=>{ const p=LEG_SYM[k]; if(!p) return ""; const g=`<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p.replace(/class="f"/g,'fill="currentColor" stroke="none"')}</g>`;
  return inner?`<svg width="${px}" height="${px}" viewBox="0 0 24 24">${g}</svg>`:`<svg class="leg-symi" width="${px}" height="${px}" viewBox="0 0 24 24" aria-hidden="true">${g}</svg>`; };

/* „Erstellt von“: Mitarbeiter aus dem Team (ohne Büro); ein früher eingetragener Name bleibt wählbar */
const legTeam=()=>team().filter(m=>m.name&&(typeof maStufe!=="function"||maStufe(m).k!=="buero")).map(m=>m.name).sort((a,b)=>a.localeCompare(b,"de"));
function legWerSel(L){ const N=legTeam(), cur=L.ersteller||""; if(cur&&!N.includes(cur)) N.push(cur);
  return `<div class="tf fl"><select id="f_leg_ersteller" data-leg="ersteller" ${L.fertig?"disabled":""}>${["",...N].map(n=>`<option value="${esc(n)}" ${n===cur?"selected":""}>${esc(n||"bitte wählen")}</option>`).join("")}</select><label for="f_leg_ersteller">Erstellt von</label><span class="arr">${icon("drop")}</span></div>`; }
/* Kennzeichnung nach eurem Schema: Reihe.RCD für den RCD, Reihe.RCD.Automat für die Stromkreise darunter
   (F 1.0 = erster RCD, F 1.0.1 / F 1.0.2 = seine Automaten, F 1.1 = zweiter RCD, F 2.0 = erster RCD der zweiten Reihe).
   Zweistellige Automaten (F 1.0.01) nur, wenn die Legende schon so zählt (alte Pläne). */
const legKzTeile=kz=>{ const m=String(kz||"").trim().match(/^(.*?)(\d+(?:\.\d+)*)$/); return m?{vor:m[1],z:m[2].split(".")}:null; };
const legZweistellig=E=>E.some(e=>e.art!=="rcd"&&/\.0\d$/.test(String(e.kz||"").trim()));
function legNaechsteKz(E,i){ for(let j=i;j>=0;j--){ const e=E[j]; if(!e||e.art==="gr"||e.art==="ge"||e.art==="kl"||!e.kz) continue;
    if(LEG_BMK.test(String(e.kz).trim())){ let m=0; E.forEach(x=>{ const t=String(x.kz||"").match(/^-?F\s?(\d+)$/); if(t) m=Math.max(m,+t[1]); }); return `-F${m+1}`; }
    if(e.art==="rcd") return /^(FI|RCD)\s*\d+$/i.test(String(e.kz).trim())?"1":String(e.kz).trim()+(legZweistellig(E)?".01":".1");   /* direkt nach dem RCD: sein erster Automat – bei „FI 2“-Beschriftung zählen die Automaten je FI ab 1 */
    const rb=String(e.kz).trim().match(/^\d+-(\d+)$/); if(rb) return String(+rb[1]+1);
    const t=legKzTeile(e.kz); if(!t) return ""; const l=t.z.length-1, w=t.z[l]; t.z[l]=String(+w+1).padStart(w.length,"0");
    return t.vor+t.z.join("."); }
  return ""; }
/* Nächster RCD in derselben Reihe (F 1.0 → F 1.1) bzw. erster RCD der nächsten Reihe (→ F 2.0) */
function legRcdKz(E,i,neueReihe){ let vor="F ", reihe=1, rcd=-1;
  for(let j=Math.min(i,E.length-1);j>=0;j--){ const e=E[j]; if(!e||e.art==="gr"||e.art==="ge"||e.art==="kl") continue; const t=legKzTeile(e.kz); if(!t) continue;
    vor=t.vor; reihe=+t.z[0]; if(e.art==="rcd"){ rcd=+(t.z[1]||0); break; } if(rcd<0&&t.z.length>=3){ rcd=+t.z[1]; break; } }
  if(neueReihe) return `${vor}${reihe+1}.0`;
  return `${vor}${reihe}.${rcd+1}`; }
function legSkDlg(id,nach,neuArt){ const L=legAkt(); if(!L) return; const E=legE(L), i=id?E.findIndex(x=>x.id===id):-1, e=i>=0?E[i]:null;
  const pos=e?i:nach!=null?nach+1:E.length, art=e?e.art:neuArt||"sk";
  const bmk=E.some(x=>LEG_BMK.test(String(x.kz||"").trim())), v=e||{art,kz:art==="rcd"&&!bmk?legRcdKz(E,pos-1,false):legNaechsteKz(E,pos-1),bez:art==="rcd"?"Fehlerstromschutzschalter":"",schutz:art==="rcd"?"40 A / 30 mA Typ A":"",pole:1};
  legDlg={id:e?e.id:null,pos,art:v.art,pole:String(v.pole||1),auto:e?null:v.kz,te:e&&e.te?String(e.te):"",umbruch:!!(e&&e.umbruch),sym:e&&e.sym||""};
  const rcdN=legRcdKz(E,pos-1,false), rcdR=legRcdKz(E,pos-1,true);
  const vorschl=[...new Set(live("legenden").flatMap(x=>legE(x).filter(y=>y.art==="sk"&&y.bez).map(y=>y.bez)))];
  /* Aufgeräumt (03.11.2026): Auswahlfelder statt Chip-Wänden – Art, Raum, Verbraucher, Breite und Symbol als Picker, Absicherung mit Vorschlagsliste, Selteneres unter „Mehr“ */
  const wahl=(k,l,cur,opts,kl)=>`<div class="tf fl${kl?" "+kl:""}"><select id="legW_${k}" data-legw="${k}">${opts.map(([o,t])=>`<option value="${esc(o)}"${String(o)===String(cur)?" selected":""}>${esc(t)}</option>`).join("")}</select><label for="legW_${k}">${l}</label><span class="arr">${icon("drop")}</span></div>`;
  /* 03.11.2026 abends: kein „Mehr“-Klapper mehr; Pole + Breite in einer Zeile, Symbol und „Neue Reihe“ direkt sichtbar.
     Unten nur noch Löschen | Abbrechen · Speichern; Duplizieren, nach oben/unten als eigene Zeile darüber */
  const akt=(act,ic,txt,extra)=>`<button type="button" class="leg-ak" data-act="${act}"${extra||""}>${icon(ic)}<span>${txt}</span></button>`;
  dialog(e?"Zeile bearbeiten":"Neue Zeile",`<div class="fg1 leg-dlg">
      ${wahl("art","Art",v.art,LEG_ART)}
      <div class="row2">${`<div class="leg-nur" data-nicht="gr">${tf("legKz","Kennzeichnung",v.kz||"",{form:true,ph:"z. B. -F3"})}</div>`}
        <div class="leg-nur" data-nicht="gr">${tf("legSchutz","Absicherung",v.schutz||"",{form:true,ph:v.art==="rcd"?"z. B. 40 A / 30 mA Typ A":"z. B. B16",list:v.art==="rcd"?"legRcdListe":"legLsListe"})}</div></div>
      <div class="chips ec-wahl leg-nur${E.some(x=>LEG_BMK.test(String(x.kz||"").trim()))?" leg-weg":""}" data-nur="rcd"><button type="button" class="chip" data-act="legSetz" data-ziel="f_legKz" data-v="${esc(rcdN)}">Nächster RCD: ${esc(rcdN)}</button><button type="button" class="chip" data-act="legSetz" data-ziel="f_legKz" data-v="${esc(rcdR)}">Neue Reihe: ${esc(rcdR)}</button></div>
      <div class="leg-nur" data-nicht="res">${tf("legBez",v.art==="gr"?"Überschrift":"Bezeichnung",v.bez||"",{form:true,ph:v.art==="gr"?"z. B. Erdgeschoss":v.art==="rcd"?"Fehlerstromschutzschalter":"z. B. Küche Steckdosen",list:"legBezListe"})}</div>
      <div class="row2 leg-nur" data-nur="sk">${wahl("raum","Raum","",[["","wählen"],...LEG_RAUM.map(x=>[x,x])])}${wahl("was","Verbraucher","",[["","wählen"],...LEG_WAS.map(x=>[x,x])])}</div>
      <div class="row2 leg-nur" data-nicht="gr"><div class="leg-nur" data-nur="sk">${wahl("pole","Pole",legDlg.pole,[["1","1-polig"],["3","3-polig"]])}</div>${wahl("te","Breite",legDlg.te,[["","automatisch"],["1","1 TE"],["2","2 TE"],["3","3 TE"],["4","4 TE"]])}</div>
      <div class="leg-nur" data-nicht="gr">${wahl("sym","Symbol",legDlg.sym,[["","automatisch"],...LEG_SYM_LISTE,["keins","kein Symbol"]])}</div>
      <button type="button" class="leg-schalt leg-nur" data-nicht="gr" data-act="legNr" aria-pressed="${legDlg.umbruch}"><span>Neue Reihe ab hier</span><span class="schalter${legDlg.umbruch?" an":""}"><i></i></span></button>
      ${e?`<div class="leg-aks">${e.art!=="gr"?akt("legDupl","copy","Duplizieren"):""}${e.art==="sk"&&L._geb?akt("legRech","calc","Berechnen"):""}${akt("legOrd","chev","Nach oben",` data-d="-1" ${i?"":"disabled"}`)}${akt("legOrd","chev","Nach unten",` data-d="1" ${i<E.length-1?"":"disabled"}`)}</div>
      <div class="leg-dupl" id="legDuplW" hidden><span>Wie oft darunter einfügen?</span>${[1,2,3,4,5].map(n=>`<button type="button" class="chip" data-act="legDuplN" data-n="${n}">${n}×</button>`).join("")}<small>Gleiche Absicherung und Pole, ohne Bezeichnung</small></div>`:""}
    </div>${datalist("legBezListe",vorschl)}${datalist("legLsListe",LEG_LS)}${datalist("legRcdListe",LEG_RCD)}`,
    `${e?`<button class="btn-tonal leg-dlg-weg" data-act="legSkDel">${icon("del")}Löschen</button>`:""}<span style="flex:1"></span>
      <button class="btn-text" data-act="cancel">Abbrechen</button>${e?"":`<button class="btn-text" data-act="legSkOk" data-weiter="1" title="Speichern und gleich die nächste Zeile anlegen">Noch einer</button>`}<button class="btn-filled leg-dlg-ok" data-act="legSkOk">Speichern</button>`,{breit:true});
  legArtZeigen(); }
function legArtZeigen(){ const a=legDlg&&legDlg.art; if(!a) return;
  document.querySelectorAll("#dlg .leg-nur").forEach(x=>x.hidden=(x.dataset.nur&&x.dataset.nur!==a)||(x.dataset.nicht&&x.dataset.nicht===a));
  const lb=document.querySelector('#dlg label[for="f_legBez"]'); if(lb) lb.textContent=a==="gr"?"Überschrift":"Bezeichnung";
  const bz=document.getElementById("f_legBez"); if(bz) bz.placeholder=a==="gr"?"z. B. Erdgeschoss":a==="rcd"?"Fehlerstromschutzschalter":"z. B. Küche Steckdosen";
  const sc=document.getElementById("f_legSchutz"); if(sc){ sc.placeholder=a==="rcd"?"z. B. 40 A / 30 mA Typ A":"z. B. B16"; sc.dataset.vl=a==="rcd"?"legRcdListe":"legLsListe"; } }
function legSkOk(weiter){ const L=legAkt(); if(!L||!legDlg) return; const F=formVals(), E=legE(L), a=legDlg.art;
  if(a==="gr"&&!F.legBez){ toast("Bitte eine Überschrift eintragen"); return; }
  if(a!=="gr"&&!F.legKz&&!legSchemaNum(E)){ toast("Bitte eine Kennzeichnung eintragen"); return; }
  const r={id:legDlg.id||uid(),art:a,kz:a==="gr"?"":F.legKz,bez:a==="res"?"":a==="rcd"&&!F.legBez?"Fehlerstromschutzschalter":F.legBez,schutz:a==="gr"?"":F.legSchutz,pole:a==="sk"?+legDlg.pole:1,...(legDlg.te&&!(a==="sk"&&+legDlg.pole===3&&+legDlg.te<3)?{te:+legDlg.te}:{}),...(legDlg.umbruch?{umbruch:true}:{}),...(legDlg.sym?{sym:legDlg.sym}:{})};
  { const alt=E.find(x=>x.id===r.id); if(alt&&alt.mat&&alt.schutz===r.schutz&&alt.art===r.art&&(+alt.pole||1)===(+r.pole||1)) r.mat=alt.mat; }   /* Artikel aus der Materialliste bleibt, solange die Absicherung gleich ist */
  let i=E.findIndex(x=>x.id===r.id); if(i>=0) E[i]=r; else { E.splice(legDlg.pos,0,r); i=legDlg.pos; }
  if(weiter==="dupl") return i;
  legSpeichern(L); render();
  if(weiter) legSkDlg(null,i); else closeOverlays(); }
/* Duplizieren: erst die Änderungen im Dialog übernehmen, dann n Kopien direkt darunter – gleiche Art, Absicherung, Pole, Breite, Artikel; Bezeichnung leer */
/* Ende der Gruppe eines RCD: seine Automaten (nicht FI/LS, keine Geräte) folgen direkt – eine Kopie des RCD gehört HINTER sie, sonst würde sie ihm die Automaten wegnehmen */
function legGruppenEnde(E,i){ let j=i; while(j+1<E.length&&!["rcd","gr","ge"].includes(E[j+1].art)&&!legIstRcbo(E[j+1])) j++; return j; }
function legKopien(L,i,n){ const E=legE(L), num=legSchemaNum(E), neu=[]; const q=E[i]; if(q.art==="rcd") i=legGruppenEnde(E,i);
  for(let k=1;k<=n;k++){ const c={id:uid(),art:q.art,kz:num?"":q.art==="rcd"?legRcdKz(E,i+k-1,false):legNaechsteKz(E,i+k-1),bez:q.art==="rcd"?"Fehlerstromschutzschalter":"",schutz:q.schutz||"",pole:q.pole||1,...(q.te?{te:q.te}:{}),...(q.mat?{mat:q.mat}:{})}; E.splice(i+k,0,c); neu.push(c.id); }
  return neu; }
function legDuplizieren(n){ const L=legAkt(); if(!L||!legDlg) return; const i=legSkOk("dupl"); if(i==null) return; legKopien(L,i,n);
  legSpeichern(L); closeOverlays(); render(); toast(n===1?"Kopie eingefügt":`${n} Kopien eingefügt`); }

/* ---- Wischen in der Liste: nach links = löschen, nach rechts = duplizieren (beides mit „Rückgängig“) ----
   Die Zeile bleibt stehen, nur ihr Inhalt gleitet; dahinter erscheint rot (Mülleimer) bzw. hellrot (Kopie). */
(()=>{ let z=null, sperre=0; const SEL=".leg-r[data-id],.leg-gk[data-id],.leg-rl-z[data-id]";
  const ende=(ok)=>{ if(!z) return; const {el,dx}=z; z=null; el.classList.remove("zieht","sw-l","sw-r"); el.style.removeProperty("--dx");
    if(!ok) return; const L=legAkt(); if(!L||L.fertig) return; const E=legE(L), i=E.findIndex(x=>x.id===el.dataset.id); if(i<0) return; const e=E[i], name=e.kz||e.bez||"Zeile";
    if(dx<0){ E.splice(i,1); legSpeichern(L); render(); toast(`${name} gelöscht`,"Rückgängig",()=>{ const L2=legAkt(); if(!L2) return; legE(L2).splice(Math.min(i,legE(L2).length),0,e); legSpeichern(L2); render(); }); }
    else { const neu=legKopien(L,i,1); legSpeichern(L); render(); toast("Kopie eingefügt","Rückgängig",()=>{ const L2=legAkt(); if(!L2) return; L2.eintraege=legE(L2).filter(x=>!neu.includes(x.id)); legSpeichern(L2); render(); }); } };
  document.addEventListener("pointerdown",ev=>{ const el=ev.target.closest&&ev.target.closest(SEL); if(!el||el.disabled||ev.button>0) return; z={el,x:ev.clientX,y:ev.clientY,dx:0,an:false,w:el.offsetWidth,id:ev.pointerId}; },{passive:true});
  document.addEventListener("pointermove",ev=>{ if(!z||ev.pointerId!==z.id) return; const dx=ev.clientX-z.x, dy=ev.clientY-z.y;
    if(!z.an){ if(Math.abs(dy)>10&&Math.abs(dy)>Math.abs(dx)){ z=null; return; } if(Math.abs(dx)<12) return; z.an=true; z.el.classList.add("zieht"); try{ z.el.setPointerCapture(ev.pointerId); }catch(e){} }
    z.dx=Math.max(-z.w*.85,Math.min(z.w*.85,dx)); z.el.style.setProperty("--dx",z.dx+"px"); z.el.classList.toggle("sw-l",z.dx<0); z.el.classList.toggle("sw-r",z.dx>0);
    z.el.classList.toggle("bereit",Math.abs(z.dx)>Math.max(80,z.w*.3)); },{passive:true});
  const los=ev=>{ if(!z||ev.pointerId!==z.id) return; if(!z.an){ z=null; return; } sperre=Date.now(); const ok=Math.abs(z.dx)>Math.max(80,z.w*.3); z.el.classList.remove("bereit");
    if(ok&&navigator.vibrate) navigator.vibrate(15); ende(ok&&ev.type==="pointerup"); };
  document.addEventListener("pointerup",los); document.addEventListener("pointercancel",los);
  /* nach dem Wischen kein „Antippen“ hinterher */
  document.addEventListener("click",ev=>{ if(Date.now()-sperre<400&&ev.target.closest&&ev.target.closest(SEL)){ ev.stopPropagation(); ev.preventDefault(); } },true); })();

/* ---- PDF ---- */
async function legPdf(L){ const lib=await pdfLib(), d=new lib.jsPDF({unit:"mm",format:"a4"});
  const S=pdfStil(d,{titel:"Verteilerlegende",unter:`Stromkreisübersicht | ${L.titel||"Verteiler"}`,ehw:true,fuss:[L.kunde,L.titel,L.stand&&"Stand "+ecDatum(L.stand)].filter(Boolean).join(" | ")});
  const M=S.M, CW=S.CW, sp=[32,116,34];
  S.kopf(); S.abschnitt("Anlage");
  S.werte([["Kunde",L.kunde],["Verteiler",L.titel],["Anschrift",L.anschrift],["Stand",ecDatum(L.stand)],...(L.netz?[["Netzform",L.netz]]:[])]);   /* „Erstellt von“ bleibt intern in der App, gehört nicht auf den Aushang beim Kunden */
  S.abschnitt("Hinweis für den Betreiber");
  S.text("Fehlerstromschutzschalter (RCD) alle 6 Monate über die Prüftaste „T“ auslösen. Schaltet der RCD dabei nicht ab, könnte er defekt sein. In diesem Fall bitte Elektro Irrgang informieren.");
  /* Kontakt groß wie im alten Verteilerplan */
  const qrC=L._geb&&typeof qrMatrix==="function"&&((vtGeb(L._geb)||{verteiler:[]}).verteiler.find(x=>x.id===L._v)||{}).qr;
  S.platz(qrC?30:14); const y=S.y+1, x2=qrC?M+68:M+CW/2;
  if(qrC){ const Mx=qrMatrix(qrC), n=Mx.length, gr=21, z=gr/n, qx=M+CW-gr, qy=y-4; d.setFillColor(0,0,0); Mx.forEach((r,yy)=>r.forEach((on,xx)=>{ if(on) d.rect(qx+xx*z,qy+yy*z,z+0.02,z+0.02,"F"); }));
    d.setFont("helvetica","bold"); d.setFontSize(9); d.setTextColor(20); d.text("Anlage "+qrZeig(qrC),qx+gr/2,qy+gr+4,{align:"center"}); }
  d.setTextColor(20); d.setFont("helvetica","bold"); d.setFontSize(12); d.text("Elektro Irrgang",M,y); d.setTextColor(...[225,29,47]); d.text("Tel. 02291 4878",x2,y);
  d.setFont("helvetica","normal"); d.setFontSize(10); d.setTextColor(40); d.text(pdfT("Hahner Weg 2 | 51545 Waldbröl"),M,y+5.2); d.text(pdfT("info@elektro-irrgang.de | www.elektro-irrgang.de"),x2,y+5.2);
  S.y=y+(qrC?29:13);
  legPdfStromkreise(d,S,L);
  return S.ende(); }
/* Stromkreis-Tabelle – auch im Anlagenpass verwendet */
function legPdfStromkreise(d,S,L){ const M=S.M, CW=S.CW, PL=legPlaetze(L), mitPl=Object.keys(PL).length>0, sp=mitPl?[28,CW-28-34-26,34,26]:[32,CW-66,34];
  const plK=p=>p?`R${p.r} · ${p.von===p.bis?p.von:`${p.von}–${p.bis}`}`:"";   /* kurz für die Spalte: „R1 · 5–7“ */
  S.abschnitt("Stromkreise");
  const kz=()=>{ d.setFillColor(...S.NAVY); d.rect(M,S.y-4,CW,6,"F"); d.setTextColor(255); d.setFontSize(8); d.setFont("helvetica","bold"); let x=M+2; ["Kennzeichnung","Bezeichnung","Absicherung",...(mitPl?["Einbauplatz"]:[])].forEach((t,i)=>{ d.text(t,x,S.y); x+=sp[i]; }); S.y+=6; };
  S.platz(14); kz(); let zz=0;
  legE(L).forEach(e=>{ if(S.y>272){ S.seite(); kz(); }
    if(e.art==="gr"){ if(S.y>266){ S.seite(); kz(); } d.setFont("helvetica","bold"); d.setFontSize(8.5); d.setTextColor(...S.NAVY); d.text(pdfT(e.bez),M+2,S.y+1); d.setDrawColor(...S.LINE); d.line(M,S.y+2.6,M+CW,S.y+2.6); S.y+=7; zz=0; return; }
    const B=d.splitTextToSize(pdfT(e.bez||""),sp[1]-3).slice(0,2), ex=(B.length-1)*3.4; if(B.length>1&&S.y+ex>272){ S.seite(); kz(); }
    if(zz++%2){ d.setFillColor(...S.SUNK); d.rect(M,S.y-4,CW,6+ex,"F"); }
    d.setFontSize(8); d.setTextColor(20); d.setFont("helvetica",e.art==="rcd"?"bold":"normal");
    d.text(pdfT(e.kz||""),M+2,S.y);
    if(e.art==="res"){ d.setDrawColor(150); d.setLineWidth(.2); d.line(M+2+sp[0],S.y+.6,M+sp[0]+sp[1]-4,S.y+.6); }
    else d.text(B,M+2+sp[0],S.y,{lineHeightFactor:1.2});
    d.text(pdfT(legSchutz(e)),M+2+sp[0]+sp[1],S.y);
    if(mitPl&&PL[e.id]){ d.setFont("helvetica","normal"); d.setTextColor(...S.GR); d.text(pdfT(plK(PL[e.id])),M+2+sp[0]+sp[1]+sp[2],S.y); }
    S.y+=6+ex; });
}
async function legPdfMachen(){ const L=legAkt(); if(!L) return; if(!legE(L).length){ toast("Erst Stromkreise anlegen"); return; }
  /* Pflicht: erst QR-Aufkleber, dann Legende – der Code steht dann auch auf dem Ausdruck */
  if(L._geb&&typeof qrPflicht==="function"){ const g=vtGeb(L._geb), v=g&&g.verteiler.find(x=>x.id===L._v); if(v&&!v.qr){ qrPflicht([{g,x:v,art:"vt"}],"die Legende nicht erstellt werden"); return; } }
  toast("PDF wird erstellt …"); let blob; try{ blob=await legPdf(L); }catch(e){ console.error(e); toast("PDF konnte nicht erstellt werden – Internet für die PDF-Bibliothek nötig"); return; }
  /* wie das Prüfprotokoll: lokal ablegen und in den Kundenordner (Pläne und Schaltpläne) hochladen – „Öffnen“ zeigt die abgelegte Datei */
  const k=kundeOf(L.kundeId), datum=ecHeute(), name=bbFs(`${datum} Legende ${L.titel||""}`), vtId=L._v||L.id;
  const x={id:uid(),app:"legende",vtId,vtName:L.titel||"Verteiler",kundeId:k?k.id:"",standortId:L.standortId||"",name,titel:[k&&k.name,L.titel].filter(Boolean).join(" · ")||L.titel||"Verteiler",datum,art:"Verteilerlegende",created:Date.now(),von:who(),size:blob.size};
  try{ const db=await new Promise((res,rej)=>{ const q=indexedDB.open("evse_protokolle"); q.onupgradeneeded=()=>{ const z=q.result; if(!z.objectStoreNames.contains("meta")) z.createObjectStore("meta",{keyPath:"id"}); if(!z.objectStoreNames.contains("blob")) z.createObjectStore("blob"); }; q.onsuccess=()=>res(q.result); q.onerror=()=>rej(q.error); });
    if(db.objectStoreNames.contains("meta")){ const tx=db.transaction(["meta","blob"],"readwrite"); tx.objectStore("meta").put(x); tx.objectStore("blob").put(blob,x.id); await new Promise(ok=>{ tx.oncomplete=ok; tx.onerror=ok; }); } db.close(); }catch(e){}
  /* Stände von früheren Tagen wandern in „Ältere Stände“ (bleiben erhalten – Aufbewahrung wie Prüfprotokolle) */
  if(DB.protokolle) [...DB.protokolle.values()].filter(r=>!r.deleted&&r.app==="legende"&&r.vtId===vtId&&r.datum!==datum&&!r.archiv).forEach(r=>{ r.archiv=true; saveRec("protokolle",r); });
  if(typeof BB_PROT!=="undefined"){ const A=BB_PROT.filter(y=>y.app==="legende"&&y.vtId===vtId&&y.datum!==datum&&!y.archiv); A.forEach(y=>y.archiv=true);
    if(A.length) try{ const db=await new Promise((res,rej)=>{ const q=indexedDB.open("evse_protokolle"); q.onsuccess=()=>res(q.result); q.onerror=()=>rej(q.error); }); if(db.objectStoreNames.contains("meta")){ const tx=db.transaction("meta","readwrite"); A.forEach(y=>tx.objectStore("meta").put(y)); await new Promise(ok=>{ tx.oncomplete=ok; tx.onerror=ok; }); } db.close(); }catch(e){} }
  if(typeof BB_PROT!=="undefined"){ /* gleicher Verteiler, gleicher Tag: die ältere Fassung ersetzen statt doppelt listen */
    const alt=BB_PROT.filter(y=>y.app==="legende"&&y.vtId===vtId&&y.datum===datum); alt.forEach(y=>{ if(typeof bbProtWeg==="function") bbProtWeg(y.id); });
    BB_PROT=BB_PROT.filter(y=>!alt.includes(y)); BB_PROT.push(x); }
  if(typeof bbProtMelden==="function") bbProtMelden(x);
  toast(typeof bbSync==="function"&&bbSync()?"PDF in der Bibliothek abgelegt":"PDF erstellt","Öffnen",()=>bbOeffnen(x.id)); }

/* ---- Klicks und Eingaben ---- */
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act^="leg"]'); if(!b||b.disabled) return; e.stopPropagation(); const a=b.dataset.act, L=legAkt();
  switch(a){
  case "legNeu": awNeuStart(b.dataset.kind,b.dataset.id); return;
  case "legZu": legZuDlg(); return;
  case "legZuOk": { if(!L||L._geb) return; const F=formVals(); if(!F.legZuK){ closeOverlays(); return; }
      const z=vtAusLegende(L,F.ecOrt||"k:"+F.legZuK); closeOverlays(); go({v:"vt",g:z.g,id:z.id}); toast("Jetzt ein Verteiler beim Kunden"); return; }
  case "legNeuOk": legNeuOk(); return;
  case "legAuf": { const X=DB.legenden.get(b.dataset.id); if(X&&kundeOf(X.kundeId)&&typeof vtAusLegende==="function"){ const z=vtAusLegende(X,X.ortId||"k:"+X.kundeId); go({v:"vt",g:z.g,id:z.id}); return; } go({v:"legende",id:b.dataset.id}); return; }
  case "legSkNeu": legSkDlg(null,null); return;
  case "legEdit": legSkDlg(b.dataset.id); return;
  case "legArt": { legDlg.art=b.dataset.v; b.parentElement.querySelectorAll(".chip").forEach(c=>c.setAttribute("aria-pressed",c===b)); legArtZeigen();
      /* neue Zeile: Vorschlag zur Art passend tauschen, solange nichts von Hand eingetragen ist */
      const f=document.getElementById("f_legKz"), Lx=legAkt(); if(f&&Lx&&legDlg.auto!=null&&f.value.trim()===legDlg.auto){ const E=legE(Lx);
        legDlg.auto=legDlg.art==="rcd"?legRcdKz(E,legDlg.pos-1,false):legNaechsteKz(E,legDlg.pos-1); f.value=legDlg.auto; f.parentElement.classList.toggle("fl",!!f.value); }
      return; }
  case "legPole": legDlg.pole=b.dataset.v; b.parentElement.querySelectorAll(".chip").forEach(c=>c.setAttribute("aria-pressed",c===b)); return;
  case "legTe": legDlg.te=b.dataset.v; b.parentElement.querySelectorAll('[data-act="legTe"]').forEach(c=>c.setAttribute("aria-pressed",c===b)); return;
  case "legNr": { legDlg.umbruch=!legDlg.umbruch; b.setAttribute("aria-pressed",legDlg.umbruch); const sw=b.querySelector(".schalter"); if(sw) sw.classList.toggle("an",legDlg.umbruch); return; }
  case "legSym": legDlg.sym=b.dataset.v; b.parentElement.querySelectorAll(".chip").forEach(c=>c.setAttribute("aria-pressed",c===b)); return;
  case "legAnsicht": META.legAnsicht=b.dataset.v; metaSave(); render(); return;
  case "legNach": legSkDlg(null,+b.dataset.i); return;
  case "legNeuRcd": legSkDlg(null,legE(L).length-1,"rcd"); return;
  case "legOpt": { if(!L) return; L[b.dataset.k]=+b.dataset.v; legSave(L); render(); return; }
  case "legOptS": { if(!L) return; L[b.dataset.k]=b.dataset.v; legSave(L); render(); return; }
  case "legSetz": { const f=document.getElementById(b.dataset.ziel); if(f){ f.value=b.dataset.v; f.parentElement.classList.add("fl"); } return; }
  case "legWort": { const f=document.getElementById("f_legBez"); if(!f) return; const w=b.dataset.v, t=f.value.trim();
      f.value=!t?w:t.split(/\s+/).includes(w)?t:t+" "+w; f.parentElement.classList.add("fl"); return; }
  case "legSkOk": legSkOk(!!b.dataset.weiter); return;
  case "legDupl": { const w=document.getElementById("legDuplW"); if(w){ w.hidden=!w.hidden; if(!w.hidden) w.scrollIntoView({block:"nearest",behavior:"smooth"}); } return; }
  case "legDuplN": legDuplizieren(+b.dataset.n||1); return;
  case "legSkDel": { if(!L||!legDlg) return; L.eintraege=legE(L).filter(x=>x.id!==legDlg.id); legSpeichern(L); closeOverlays(); render(); return; }
  case "legOrd": { if(!L||!legDlg) return; const E=legE(L), i=E.findIndex(x=>x.id===legDlg.id), j=i+(+b.dataset.d); if(i<0||j<0||j>=E.length) return;
      [E[i],E[j]]=[E[j],E[i]]; legSpeichern(L); render(); legSkDlg(legDlg.id); return; }
  case "legPdf": legPdfMachen(); return;
  case "legEti": legEtiDlg(); return;
  case "legRech": if(legDlg&&legDlg.id) legRechDlg(legDlg.id); return;
  case "legRechQs": { if(!LR) return; LR.qs=+b.dataset.v; b.parentElement.querySelectorAll(".chip").forEach(c=>c.setAttribute("aria-pressed",c===b)); legRechZeigen(); return; }
  case "legRechOk": legRechOk(); return;
  case "legRechZur": { const id=LR&&LR.id; LR=null; if(id) legSkDlg(id); return; }
  case "legEtiW": { if(!L) return; LEG_ETI[b.dataset.k]=b.dataset.k==="inh"?b.dataset.v:+b.dataset.v; legEtiMerken(); legEtiDlg(); return; }
  case "legEtiTeilen": case "legEtiLaden": if(L) legEtiAusgeben(L,a==="legEtiTeilen"); return;
  case "legFertig": { if(!L) return;
    if(b.dataset.v==="1"&&L._geb&&typeof qrPflicht==="function"){ const g=vtGeb(L._geb), v=g&&g.verteiler.find(x=>x.id===L._v); if(v&&!v.qr){ qrPflicht([{g,x:v,art:"vt"}],"der Verteiler nicht abgeschlossen werden"); return; } }
    L.fertig=b.dataset.v==="1"; legSave(L); render(); toast(L.fertig?"Abgeschlossen":"Wieder in Arbeit"); return; }
  case "legTab": nav.tab=b.dataset.v; closeOverlays(); render(); scrollTo(0,0); return;
  case "legDelAsk": confirmDlg(L&&L._geb?"Verteiler löschen?":"Legende löschen?",L&&L._geb?`„${L.titel}“ mit allen RCDs und Stromkreisen löschen? Messwerte früherer Prüfungen zu diesen Stromkreisen werden dann nicht mehr zugeordnet.`:`„${L&&L.titel||"Verteiler"}“ mit allen Zeilen löschen?`,"Löschen","legDelOk"); return;
  case "legDelOk": { if(!L) return; if(L._geb){ const g=vtGeb(L._geb); if(g){ L.eintraege=[]; vtSchreiben(L); const g2=vtGeb(L._geb); g2.verteiler=g2.verteiler.filter(v=>v.id!==L._v); ecGebSpeichern(g2); } go(vtZuruck(L._geb)); toast("Verteiler gelöscht"); return; }
      L.deleted=true; saveRec("legenden",L); go(legZuruck(L)); toast("Legende gelöscht"); return; }
  } },true);
document.addEventListener("change",e=>{ const el=e.target; if(el.id==="f_legZuK"){ const f=document.getElementById("legOrtFeld"); if(f) f.innerHTML=ecOrtFeld(el.value); return; }
  if(!el.dataset||!el.dataset.leg) return; const L=legAkt(); if(!L) return;
  const k=el.dataset.leg, v=el.value.trim(); if((L[k]||"")===v) return; L[k]=v; if(k==="stand") legSave(L); else legSpeichern(L);
  if(k==="titel"){ const t=document.querySelector("#topTitle span"); if(t) t.textContent=v||"Verteiler"; } });

/* Picker im Fenster „Zeile bearbeiten“ */
document.addEventListener("change",ev=>{ const s=ev.target; if(!s||!s.dataset||!s.dataset.legw||!legDlg) return; const k=s.dataset.legw, v=s.value;
  if(k==="art"){ legDlg.art=v; legArtZeigen(); const f=document.getElementById("f_legKz"), Lx=legAkt();
    if(f&&Lx&&legDlg.auto!=null&&f.value.trim()===legDlg.auto){ const E=legE(Lx); legDlg.auto=v==="rcd"?legRcdKz(E,legDlg.pos-1,false):legNaechsteKz(E,legDlg.pos-1); f.value=legDlg.auto; f.parentElement.classList.toggle("fl",!!f.value); } return; }
  if(k==="raum"||k==="was"){ if(!v) return; const f=document.getElementById("f_legBez"); if(f){ const t=f.value.trim(); f.value=!t?v:t.split(/\s+/).includes(v)?t:t+" "+v; f.parentElement.classList.add("fl"); } s.value=""; return; }
  if(k==="pole"){ legDlg.pole=v; if(v==="3"&&+legDlg.te&&+legDlg.te<3){ legDlg.te=""; const t=document.getElementById("legW_te"); if(t) t.value=""; } } else if(k==="te") legDlg.te=v; else if(k==="sym") legDlg.sym=v; });

/* Schrankbild ein-/ausblenden (vor allem am Handy) – gilt für Zählerschrank- und Verteilerbild, je Gerät gemerkt */
const legBildAn=()=>!(META&&META.schrankBildAus);
const legBildKnopf=()=>`<button type="button" class="ab-ic zs-bild-um${legBildAn()?" offen":""}" data-act="legBildUm" aria-label="${legBildAn()?"Bild ausblenden":"Bild einblenden"}" title="${legBildAn()?"Bild ausblenden":"Bild einblenden"}">${icon("chev")}</button>`;
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act="legBildUm"]'); if(!b) return; e.stopPropagation(); e.preventDefault();
  META.schrankBildAus=legBildAn(); metaSave(); render(); },true);

/* Feld „Eingespeist aus“ – im Reiter Verteiler (UV) bzw. Zählerschrank (HV) */
function legVonFeld(L){ if(!L||!L._geb) return ""; const g=vtGeb(L._geb), v=g&&g.verteiler.find(x=>x.id===L._v); if(!g||!v) return ""; const A=g.verteiler.filter(x=>x.id!==v.id);
  if(!A.length) return ""; return `<div class="tf fl leg-von"><select id="f_leg_von" ${L.fertig?"disabled":""}><option value="">– direkt (Hausanschluss / Zähler) –</option>${A.map(x=>`<option value="${esc(x.id)}" ${x.id===v.vonVId?"selected":""}>${esc(x.name||"Verteiler")}</option>`).join("")}</select><label for="f_leg_von">Eingespeist aus</label><span class="arr">${icon("drop")}</span></div>`; }
/* „Eingespeist aus“ im Verteiler: steht am Verteiler im Gebäude (vonVId), nicht in der Legende */
document.addEventListener("change",ev=>{ const s=ev.target; if(!s||s.id!=="f_leg_von") return; const L=legAkt(); if(!L||!L._geb) return; const g=vtGeb(L._geb), v=g&&g.verteiler.find(x=>x.id===L._v); if(!v) return;
  const neu=s.value||""; let x=neu&&g.verteiler.find(y=>y.id===neu), n=0; while(x&&n++<30){ if(x.id===v.id){ toast("Ein Verteiler kann nicht aus sich selbst gespeist werden"); s.value=v.vonVId||""; return; } x=x.vonVId&&g.verteiler.find(y=>y.id===x.vonVId); }
  if(neu) v.vonVId=neu; else delete v.vonVId; v.updated=Date.now(); ecGebSpeichern(g); toast(neu?`Eingespeist aus ${(g.verteiler.find(y=>y.id===neu)||{}).name||"Verteiler"}`:"Direkt eingespeist"); });

/* Verteilertyp wählen (Unterverteiler): Hager volta UP (VU…NC) / AP (VA…CN) mit 1–5 Reihen à 12 TE, sonst „anderer Typ“ */
function uvTypDlg(){ const L=legAkt(); if(!L) return; const M=uvMasse(L), frei=!M.modell||L.typFrei;
  const zeile=(up,n)=>{ const nr=`${up?"VU":"VA"}${n*12}${up?"NC":"CN"}`, an=!frei&&M.modell===nr;
    return `<button type="button" class="li${an?" an":""}" data-act="uvTypOk" data-up="${up?1:0}" data-n="${n}"><span class="av">${n}</span><span class="lt"><span class="h">Hager volta ${nr}</span><span class="s">${n}-reihig · ${n*12} TE</span></span>${an?`<span class="m3-st ok">gewählt</span>`:icon("chev")}</button>`; };
  dialog("Verteilertyp",`<div class="sec-lbl">Unterputz</div>${listOf([1,2,3,4,5].map(n=>zeile(true,n)))}
    <div class="sec-lbl">Aufputz</div>${listOf([1,2,3,4,5].map(n=>zeile(false,n)))}
    <div class="sec-lbl">Sonstiges</div>${listOf([`<button type="button" class="li${frei?" an":""}" data-act="uvTypOk" data-frei="1"><span class="av">${icon("edit")}</span><span class="lt"><span class="h">Anderer Verteilertyp</span><span class="s">Reihen, Montage und TE je Reihe selbst einstellen</span></span>${frei?`<span class="m3-st ok">gewählt</span>`:icon("chev")}</button>`])}`,
    `<span style="flex:1"></span><button class="btn-text" data-act="cancel">Schließen</button>`,{breit:true}); }
document.addEventListener("click",ev=>{ const b=ev.target.closest&&ev.target.closest('[data-act="uvTyp"],[data-act="uvTypOk"]'); if(!b||b.disabled) return; ev.stopPropagation();
  if(b.dataset.act==="uvTyp"){ uvTypDlg(); return; } const L=legAkt(); if(!L) return;
  if(b.dataset.frei){ L.typFrei=true; } else { L.typFrei=false; L.reihen=+b.dataset.n; L.montage=b.dataset.up==="1"?"up":"ap"; L.teReihe=12; }
  legSave(L); closeOverlays(); render(); },true);

/* ===== Beschriftungsstreifen für den Brother P-touch: je Reihe ein Streifen, je Gerät ein Block so breit wie das Gerät =====
   Nutzt die Vorlage „Verteiler“ der Pro Label Tool-App (wie die Patchfeld-Streifen in der Netzwerkprüfung: ecLbxs, ecEtiSvg). */
const LEG_ETI={inh:"bez",band:9,te:17.5};
try{ const v=JSON.parse(localStorage.getItem("irrgang_legeti")||"null"); if(v) Object.assign(LEG_ETI,v); }catch(e){}
const legEtiMerken=()=>{ try{ localStorage.setItem("irrgang_legeti",JSON.stringify(LEG_ETI)); }catch(e){} };
/* Text eines Geräts auf dem Streifen – ohne Sonderzeichen, die nicht jede Druckerschrift hat */
function legEtiText(e){ if(e.art==="kl") return ""; if(e.art==="res") return LEG_ETI.inh==="kz"?String(e.kz||"").trim():"Reserve";
  const kz=String(e.kz||"").trim();
  const bez=e.art==="rcd"?(e.bez&&!/^fehlerstrom/i.test(e.bez)?e.bez:("FI "+String(e.schutz||"").replace(/\s*Typ.*$/i,"").replace(/\s*\/\s*/," ")).trim())
    :legOffen(e)?"":String(e.bez||"").trim();
  const t=LEG_ETI.inh==="kz"?kz:LEG_ETI.inh==="beide"?[kz,bez].filter(Boolean).join(" "):bez;
  return t.replace(/\s*·\s*/g," ").replace(/[→–]/g,"-").replace(/\s+/g," ").trim(); }
/* Streifen je Reihe: Blöcke = Geräte (Breite in TE), freie Plätze am Ende als ein leerer Block, damit der Streifen über die ganze Reihe geht */
function legEtiStreifen(L){ const n=+L.teReihe||12;
  return legReihen(L).map((r,ri)=>{ const T=[], M=[]; r.g.forEach(([e,,w])=>{ T.push(legEtiText(e)); M.push(w); });
    let frei=n-r.te; while(frei>0){ const w=Math.min(frei,9); T.push(""); M.push(w); frei-=w; }
    const p={band:LEG_ETI.band,block:LEG_ETI.te,anzahl:T.length,mult:M,trenn:"LINE",vertikal:false,umkehren:false,drucker:"PT-E560BT"};
    return {nr:ri+1,te:n,p,T,mm:n*LEG_ETI.te}; }).filter(st=>st.T.length<=50); }
function legEtiKarte(L){ if(typeof ecLbxs!=="function"||!legE(L).some(e=>e.art!=="gr")) return ""; const ST=legEtiStreifen(L); if(!ST.length) return "";
  return `<section class="card leg-eti-k"><h3>Beschriftungsstreifen</h3>
    <div class="leg-eti-v">${ecEtiSvg(ST[0].p,ST[0].T,true)}</div>
    <p class="meta">${ST.length===1?"Ein Streifen":`${ST.length} Streifen, je Reihe einer`} für den Brother P-touch · jedes Feld so breit wie das Gerät darunter.</p>
    <button type="button" class="btn-tonal leg-eti-b" data-act="legEti">${icon("tag")}Streifen drucken</button></section>`; }
function legEtiDlg(){ const L=legAkt(); if(!L) return; const ST=legEtiStreifen(L), chip=(k,v,t)=>`<button type="button" class="chip" data-act="legEtiW" data-k="${k}" data-v="${v}" aria-pressed="${String(LEG_ETI[k])===String(v)}">${t}</button>`;
  dialog("Beschriftungsstreifen",`<p class="ec-sub">Für die <b>Brother Pro Label Tool</b>-App (P-touch, z. B. PT-E560BT), Vorlage „Verteiler“.</p>
    <div class="lbl">Text auf dem Streifen</div><div class="chips ec-wahl">${chip("inh","bez","Bezeichnung")}${chip("inh","kz","Kennzeichnung")}${chip("inh","beide","Beides")}</div>
    <div class="lbl" style="margin-top:12px">Band</div><div class="chips ec-wahl">${chip("band",9,"9 mm")}${chip("band",12,"12 mm")}</div>
    <div class="lbl" style="margin-top:12px">Breite je TE</div><div class="chips ec-wahl">${chip("te",17.5,"17,5 mm · z. B. Hager")}${chip("te",18,"18 mm · z. B. Siemens")}</div>
    <div class="lbl" style="margin-top:14px">Vorschau · ${ST.length} Streifen</div>
    <div class="ec-baender leg-eti-l">${ST.map(st=>`<div class="ec-bd"><div class="ec-bd-k">Reihe ${st.nr} · ${st.te} TE · ${ecEtiMm(st.p,st.mm)} × ${st.p.band} mm</div><div class="leg-eti-v">${ecEtiSvg(st.p,st.T)}</div></div>`).join("")}</div>
    ${(()=>{ const z=LEG_ETI.band>=12?6.5:9, lang=ST.reduce((a,st)=>a+st.T.filter((t,i)=>t.length>z*st.p.mult[i]*LEG_ETI.te/17.5).length,0);
      return lang?`<p class="ec-hinweis">${icon("warn")}<span>${lang===1?"Ein Text ist":`${lang} Texte sind`} zu lang für das Feld und ${lang===1?"wird":"werden"} sehr klein gedruckt. Kürzere Bezeichnung wählen oder „Kennzeichnung“ drucken.</span></p>`:""; })()}
    <p class="meta" style="margin:8px 4px 0">Lange Texte verkleinert die App automatisch. Je Reihe kommt eine Datei.</p>
    <details class="ec-eti-hilfe"><summary>So druckst du in der App</summary><ol><li>„Teilen“ tippen und „Pro Label Tool“ wählen – oder herunterladen und in der App unter „Öffnen“ laden.</li><li>Blöcke, Breiten und Texte sind schon eingestellt, nur noch drucken.</li><li>Streifen am Anfang der Reihe ansetzen – freie Plätze am Ende bleiben leer.</li></ol></details>`,
    `${/android/i.test(navigator.userAgent)?`<button class="btn-text" data-act="ecEtiApp">App öffnen</button>`:""}<span style="flex:1"></span><button class="btn-text" data-act="cancel">Schließen</button><button class="btn-text" data-act="legEtiLaden">Herunterladen</button><button class="btn-text" data-act="legEtiTeilen">Teilen</button>`,{breit:true}); }
async function legEtiAusgeben(L,teilen){ const ST=legEtiStreifen(L); if(!ST.length){ toast("Nichts zu beschriften"); return; }
  const F=ST.map(st=>{ const name=bbFs(`${L.titel||"Verteiler"} Reihe ${st.nr}`); return new File([ecLbxs(name,st.p,st.T)],name+".lbxs",{type:"application/octet-stream"}); });
  if(teilen&&navigator.canShare&&navigator.canShare({files:F})){ try{ await navigator.share({files:F,title:F.length===1?F[0].name:`Beschriftung ${L.titel||""}`.trim()}); return; }catch(e){ if(e&&e.name==="AbortError") return; } }
  F.forEach((f,i)=>setTimeout(()=>{ const a=document.createElement("a"); a.href=URL.createObjectURL(f); a.download=f.name; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },1500); },i*400));
  const was=F.length===1?"Brother-Datei":`${F.length} Brother-Dateien`; toast(teilen?`Teilen geht hier nicht – ${was} heruntergeladen`:`${was} heruntergeladen`); }

/* ===== Stromkreis-Rechner: Spannungsfall, Abschaltbedingung (Zs), max. Länge, Belastbarkeit – und Vergleich mit dem letzten Messwert =====
   Vereinfachte Rechnung wie in der Ausbildung: Kupfer κ = 56 m/(Ω·mm²) bei 20 °C, cos φ = 1, Schutzleiter gleicher Querschnitt.
   Zs max = 230 V ÷ Ia (wie in der Prüfung), Ia = 5/10/20 × In für B/C/D. Länge, Querschnitt und Vorimpedanz werden am Stromkreis bzw. Verteiler gespeichert. */
const LR_KAPPA=56, LR_QS=[1.5,2.5,4,6,10,16];
/* Strombelastbarkeit Iz, Verlegeart C (auf/in der Wand), 30 °C, ohne Häufung – DIN VDE 0298-4: [2 belastete Adern, 3 belastete Adern] */
const LR_IZ={1.5:[19.5,17.5],2.5:[27,24],4:[36,32],6:[46,41],10:[63,57],16:[85,76]};
let LR=null;
const lrZ=v=>{ const t=String(v??"").trim().replace(",","."); return t&&isFinite(+t)?+t:null; };
const lrF=(n,d=2)=>(Math.round(n*10**d)/10**d).toLocaleString("de-DE",{minimumFractionDigits:0,maximumFractionDigits:d});
const lrQsAus=t=>{ const m=String(t||"").match(/[x×]\s*(\d+(?:[.,]\d+)?)/i)||String(t||"").match(/(\d+(?:[.,]\d+)?)\s*mm/i); const q=m?+m[1].replace(",","."):0; return LR_QS.includes(q)?q:0; };
/* letzter Messwert Zs zu diesem Stromkreis (höchster Wert an Stromkreis und seinen Messpunkten) */
function lrGemessen(g,sk){ if(typeof ecZsMax!=="function") return null;
  const P=live("echecks").filter(p=>p.ortId===g.ortId&&p.art==="anlage").sort((a,b)=>String(b.datum||"").localeCompare(String(a.datum||"")));
  for(const pr of P){ const z=ecZsMax(pr,g,sk); if(z) return {n:z.n,datum:pr.datum}; } return null; }
function legRechDlg(id){ const L=legAkt(); if(!L||!L._geb) return; const g=vtGeb(L._geb), sk=g&&g.stromkreise.find(x=>x.id===id), v=g&&g.verteiler.find(x=>x.id===L._v), e=legE(L).find(x=>x.id===id); if(!sk||!e) return;
  /* Werte aus dem offenen Zeilen-Dialog übernehmen (noch nicht gespeichert) */
  const F=typeof formVals==="function"?formVals():{}, schutz=F.legSchutz!=null?F.legSchutz:e.schutz, pole=legDlg&&legDlg.pole?+legDlg.pole:+e.pole||1;
  const ls=typeof ecLs==="function"?ecLs(schutz):null;
  LR={id,schutz,pole,ls,qs:lrQsAus(sk.leitung)||(ls&&ls.In>=20?4:ls&&ls.In>=16?2.5:1.5),mess:lrGemessen(g,sk)};
  const kopf=[e.kz,e.bez,schutz,pole===3?"3-polig":""].filter(Boolean).join(" · ");
  dialog("Stromkreis berechnen",`<p class="ec-sub">${esc(kopf)}</p>
    ${ls?"":`<p class="ec-hinweis">${icon("warn")}<span>Für die Abschaltbedingung braucht der Stromkreis eine Absicherung wie B16 oder C20.</span></p>`}
    <div class="lr-ein">${tf("lrLaenge","Leitungslänge",sk.laenge!=null?String(sk.laenge).replace(".",","):"",{form:true,ph:"z. B. 25",im:"decimal",sfx:"m"})}${tf("lrZe","Vorimpedanz",v&&v.ze!=null?String(v.ze).replace(".",","):"0,3",{form:true,im:"decimal",sfx:"Ω"})}</div>
    <div class="lbl" style="margin-top:12px">Querschnitt</div><div class="chips ec-wahl">${LR_QS.map(q=>`<button type="button" class="chip" data-act="legRechQs" data-v="${q}" aria-pressed="${q===LR.qs}">${lrF(q,1)} mm²</button>`).join("")}</div>
    <div id="lrErg" class="lr-erg"></div>
    <p class="lr-hin">Vereinfacht gerechnet: Kupfer κ = 56 m/(Ω·mm²) bei 20 °C, cos φ = 1, Schutzleiter mit gleichem Querschnitt. Vorimpedanz = Schleifenimpedanz am Verteiler; 0,3 Ω ist ein Schätzwert, solange dort nicht gemessen wurde. Ersetzt keine Messung.</p>`,
    `<button class="btn-text" data-act="legRechZur">Zurück</button><span style="flex:1"></span><button class="btn-filled" data-act="legRechOk">Speichern</button>`,{breit:true});
  legRechZeigen(); }
function legRechZeigen(){ const box=document.getElementById("lrErg"); if(!box||!LR) return;
  const l=lrZ((document.getElementById("f_lrLaenge")||{}).value), ze=lrZ((document.getElementById("f_lrZe")||{}).value)??0, A=LR.qs, ls=LR.ls, drei=LR.pole===3, I=ls?ls.In:null;
  const k=(st,t,w,s)=>`<div class="lr-k ${st}"><span class="t">${t}</span><span class="w">${w}</span><span class="s">${s}</span></div>`, B=[];
  const rS=l!=null?2*l/(LR_KAPPA*A):null;   /* Schleife L + PE */
  if(l!=null&&I){ const du=drei?Math.sqrt(3)*I*l/(LR_KAPPA*A):2*I*l/(LR_KAPPA*A), pz=du/(drei?400:230)*100;
    B.push(k(pz<=3?"ok":pz<=4?"knapp":"bad","Spannungsfall bei "+lrF(I,1)+" A",lrF(pz,1)+" %",`${lrF(du,1)} V ab diesem Verteiler · Empfehlung ≤ 3 % ab Zähler (DIN 18015-1)${pz>3&&pz<=4?", 4 % nach VDE 0100-520 noch zulässig":""}`)); }
  if(rS!=null&&ls){ const zs=ze+rS, mx=ls.zs, st=zs<=mx*2/3?"ok":zs<=mx?"knapp":"bad";
    B.push(k(st,"Schleifenimpedanz Zs",lrF(zs)+" Ω",`${lrF(ze)} Ω Vorimpedanz + ${lrF(rS)} Ω Leitung · zulässig ${ls.c}${lrF(ls.In,1)}: ≤ ${lrF(mx)} Ω${st==="knapp"?" – knapp, bei Betriebstemperatur steigt der Widerstand":""}`)); }
  if(ls&&I){ const lAb=Math.max(0,(ls.zs*2/3-ze)*LR_KAPPA*A/2), lDu=0.03*(drei?400:230)*LR_KAPPA*A/((drei?Math.sqrt(3):2)*I), lm=Math.min(lAb,lDu);
    B.push(k(l!=null&&l>lm?"bad":"","Maximale Länge",`${Math.floor(lm)} m`,`Abschaltung mit Reserve: ${Math.floor(lAb)} m · Spannungsfall 3 %: ${Math.floor(lDu)} m`)); }
  if(I){ const iz=LR_IZ[A][drei?1:0]; B.push(k(I<=iz?"ok":"bad","Belastbarkeit",I<=iz?"passt":"zu klein",`${ls.c}${lrF(I,1)} an ${lrF(A,1)} mm²: Iz = ${lrF(iz,1)} A (Verlegeart C, 30 °C, ohne Häufung)${I<=iz?"":" – größeren Querschnitt oder kleinere Absicherung"}`)); }
  if(LR.mess&&ls){ const m=LR.mess.n, st=m<=ls.zs?"ok":"bad", erw=rS!=null?ze+rS:null, viel=erw!=null&&m>erw*1.5+0.2;
    B.push(k(viel&&st==="ok"?"knapp":st,"Gemessen am "+new Date(LR.mess.datum+"T12:00").toLocaleDateString("de-DE"),lrF(m)+" Ω",st==="bad"?`über dem Grenzwert ${lrF(ls.zs)} Ω`:viel?`deutlich mehr als berechnet (${lrF(erw)} Ω) – Klemmstellen und Länge prüfen`:erw!=null?`passt zur Rechnung (${lrF(erw)} Ω)`:"unter dem Grenzwert")); }
  if(l==null) B.unshift(`<p class="meta" style="margin:0 4px">Länge eintragen – dann rechnet die App Spannungsfall und Schleifenimpedanz.</p>`);
  box.innerHTML=B.join(""); }
function legRechOk(){ const L=legAkt(); if(!L||!LR) return; const g=vtGeb(L._geb), sk=g&&g.stromkreise.find(x=>x.id===LR.id), v=g&&g.verteiler.find(x=>x.id===L._v); if(!sk) return;
  const l=lrZ((document.getElementById("f_lrLaenge")||{}).value), ze=lrZ((document.getElementById("f_lrZe")||{}).value);
  if(l!=null) sk.laenge=l; else delete sk.laenge;
  const q=lrF(LR.qs,1), alt=sk.leitung||""; if(!alt) sk.leitung=`NYM-J ${LR.pole===3?5:3}×${q}`; else if(lrQsAus(alt)&&lrQsAus(alt)!==LR.qs) sk.leitung=alt.replace(/([x×]\s*)\d+(?:[.,]\d+)?/i,"$1"+q);
  if(v&&ze!=null) v.ze=ze;
  ecGebSpeichern(g); const id=LR.id; LR=null; toast("Gespeichert"); legSkDlg(id); }
document.addEventListener("input",e=>{ if(LR&&e.target&&(e.target.id==="f_lrLaenge"||e.target.id==="f_lrZe")) legRechZeigen(); });
