/* ===== Verteilerlegende (E-Check › Installation) =====
   Stromkreisliste für die Hager-Tasche im Verteiler: eine Zeile pro Stromkreis, Zwischenüberschriften, RCDs fett, Reserven als Schreiblinie.
   Geht ohne angelegten Kunden (Kunde und Anschrift frei eintragen). PDF im Stil der Prüfprotokolle (pdfStil). */
const LEG_ART=[["sk","Stromkreis"],["rcd","RCD"],["res","Reserve"],["gr","Überschrift"],["kl","Klemme"]];
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
function legSave(L){ if(L._geb) vtSchreiben(L); else saveRec("legenden",L); }
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
function legTabs(L){ return L&&(L.art==="hv"||L.zs)?[["zs","Zählerschrank","zsSchrank"],["sk","Stromkreise","zsBlitz"],["mat","Material","liste"],["ab","Abschluss","done"]]:[["sk","Stromkreise","zsBlitz"],["ab","Abschluss","done"]]; }
const legTab=L=>{ const T=legTabs(L); return T.some(x=>x[0]===nav.tab)?nav.tab:T[0][0]; };
function legFab(L){ if(!L||L.fertig) return null; const t=legTab(L); return t==="sk"?["awStart","Gerät","add"]:t==="zs"&&L.zs&&L.zs.felder&&L.zs.felder.length?["zsZpNeu","Zählerplatz","add"]:null; }
function legView(L){ const E=legE(L), tab=legTab(L);
  if(tab==="zs") return `<div class="narrow ec-spalte leg">${typeof zsKarte==="function"?zsKarte(L,true):""}</div>`;
  if(tab==="mat") return `<div class="narrow ec-spalte leg">${typeof zsMaterialKarte==="function"?zsMaterialKarte(L):""}</div>`;
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
        <div class="leg-fuss">${canEdit(L)?`<button type="button" class="btn-tonal leg-del" data-act="legDelAsk">${icon("del")}Löschen</button>`:""}<span style="flex:1"></span>${L.fertig?`<button type="button" class="btn-tonal" data-act="legFertig" data-v="0">${icon("edit")}Wieder öffnen</button>`:`<button type="button" class="btn-tonal" data-act="legFertig" data-v="1">${icon("done")}Fertig</button>`}<button type="button" class="btn-filled" data-act="legPdf">${icon("pdf")}PDF erstellen</button></div>
  </div>`; }

/* Karte „Stromkreise“ (Reiter Stromkreise) */
function legSkKarte(L,E){ return `<section class="card"><div class="card-kopf leg-kopf"><h3>Stromkreise${E.length?` <small class="leg-n">${legSkZahl(L)}</small>`:""}</h3>${E.length?seg("legAnsicht",legAnsicht(),[["liste","Liste"],["verteiler","Verteiler"]],"leg-seg"):""}</div>
      ${E.length?(legAnsicht()==="verteiler"?legVtView(L):legListeView(L)):`<p class="meta">Noch keine Geräte. Unten rechts über „Gerät“ einsetzen – Gerät aus der Materialliste antippen, die Kennzeichnung zählt mit.</p>`}
    </section>
`; }
/* ===== Ansichten der Stromkreise: Liste (je RCD eine Gruppe) und Verteiler (Reihen, Breite in TE) ===== */
const legAnsicht=()=>META.legAnsicht==="verteiler"?"verteiler":"liste";
const legBauart=L=>[{hv:"Zählerschrank / HV",uv:"Unterverteiler",gw:"Gewerbe / Standverteiler"}[L.art],L.zs&&typeof zsHerstText==="function"?zsHerstText(L.zs.hersteller):"",{ap:"Aufputz",up:"Unterputz"}[L.montage],L.zs&&+L.zs.hoehe?L.zs.hoehe+" mm":"",L.reihen&&`${L.reihen}-reihig · ${L.reihen*(+L.teReihe||12)} TE`].filter(Boolean).join(" · ");
const legTE=e=>e.art==="kl"?1:+e.te||(e.art==="rcd"?4:e.art==="sk"&&+e.pole===3?3:1);
const legOffen=e=>e.art==="sk"&&/^\s*\??\s*$/.test(e.bez||"");
/* Liste: RCD als Kopf, seine Automaten eingerückt darunter; Überschriften trennen */
function legListeView(L){ const E=legE(L), zu=L.fertig, B=[]; let g=null;
  E.forEach((e,i)=>{ if(e.art==="gr"){ B.push({gr:e}); g=null; } else if(e.art==="rcd"){ g={rcd:e,i,kids:[]}; B.push(g); } else if(g){ g.kids.push([e,i]); g.last=i; } else B.push({z:[e,i]}); });
  const zeile=([e],kl)=>`<button type="button" class="leg-r${kl||""}${e.art==="res"?" res":""}${legOffen(e)?" offen":""}" data-act="legEdit" data-id="${esc(e.id)}" ${zu?"disabled":""}><span class="kz">${esc(e.kz||"–")}</span><span class="bz">${e.art==="res"?"Reserve":legOffen(e)?"? – noch unbekannt":esc(e.bez)}</span>${legSchutz(e)?`<span class="sc">${esc(legSchutz(e))}</span>`:""}</button>`;
  return `<div class="leg-gl">${B.map(b=>b.gr?`<button type="button" class="leg-ue" data-act="legEdit" data-id="${esc(b.gr.id)}" ${zu?"disabled":""}>${esc(b.gr.bez||"Überschrift")}</button>`
    :b.z?`<div class="leg-grp solo">${zeile(b.z)}</div>`
    :`<div class="leg-grp"><button type="button" class="leg-gk" data-act="legEdit" data-id="${esc(b.rcd.id)}" ${zu?"disabled":""}><span class="kz">${esc(b.rcd.kz||"–")}</span><span class="bz">${esc(b.rcd.bez||"Fehlerstromschutzschalter")}<span class="leg-rcd">RCD</span></span>${b.rcd.schutz?`<span class="sc">${esc(b.rcd.schutz)}</span>`:""}</button>
      ${b.kids.map(k=>zeile(k," kind")).join("")}${zu?"":`<button type="button" class="leg-add" data-act="legNach" data-i="${b.last!=null?b.last:b.i}">${icon("add")}Stromkreis an ${esc(b.rcd.kz||"RCD")}</button>`}</div>`).join("")}</div>`; }
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
const LEG_H=()=>LEG_P*400/92;   /* Höhe eines Geräts im Verhältnis zur Breite */
/* Gerät zeichnen: x = linke Kante, w = Breite in TE, oben bei y0 (Mitte = Hutschiene) */
function legGeraetBild(e,x,w,y0,P,bild){ const H=P*400/92, B=bild||"../bilder/vt/";
  if(e.art==="kl"){ const fb=e.farbe||(/pe/i.test(e.bez||"")?"pe":/^\s*a\b|abzweig/i.test(e.bez||"")?"a":"n"), h=P*717/140; /* farbe geht beim Speichern verloren – Bezeichnung entscheidet; unverzerrt, höher als ein Automat */
    return `<image href="${B}pollmann-${fb==="pe"?"pe":fb==="a"?"a":"n"}14s.png" x="${x}" y="${(y0+H/2-h/2).toFixed(1)}" width="${w*P}" height="${h.toFixed(1)}"/>`; }
  const [f,bt]=legBildFuer(e); let s="";
  if(f==="blind1.jpg"){ for(let k=0;k<w;k++) s+=`<image href="${B}${f}" x="${x+k*P}" y="${y0}" width="${P}" height="${H.toFixed(1)}" preserveAspectRatio="none"/>`; return s; }
  s+=`<image href="${B}${f}" x="${x}" y="${y0}" width="${w*P}" height="${H.toFixed(1)}" preserveAspectRatio="none"/>`;
  /* Aufdruck im weißen Feld: Nennstrom bzw. RCD-Daten */
  const sc=e.art==="rcd"?String(e.schutz||"").replace(/\s*Typ.*$/i,"").replace(/\s*\/\s*/," "):legSchutz(e).replace(/\s*3-polig$/i,"").replace(/\s*FI\/LS.*$/i,"");
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
  const opt=(k,t,vals,cur)=>`<span class="leg-o"><span>${t}</span>${vals.map(v=>`<button type="button" class="chip" data-act="legOpt" data-k="${k}" data-v="${v}" aria-pressed="${String(cur)===String(v)}" ${zu?"disabled":""}>${String(v).replace(".",",")}</button>`).join("")}</span>`;
  return `<div class="leg-vopt">${opt("teReihe","TE je Reihe",[12,18,24],n)}${opt("teMm","mm je TE",[17.5,18],+L.teMm||17.5)}</div>`
    +R.map((r,ri)=>{ const GH=LEG_H(1), KY=GH+10; let x=0, hoch=KY+64; const g=r.g.map(([e,i,w])=>{ const X=x*P, Wd=w*P, sym=legSymFuer(e), z=legWrap(e.art==="res"?"Reserve":legOffen(e)?"?":e.bez,w>1?w*8:8), fz=w>1?10.5:z.some(t=>t.length>7)?9:10.5;
        const out=`<g class="leg-dev" data-act="legEdit" data-id="${esc(e.id)}"><title>${esc([e.kz,e.bez,legSchutz(e)].filter(Boolean).join(" · "))}</title>${legGeraet(e,X,w)}
          ${e.art==="kl"?"":`<rect x="${X+2}" y="${KY+(e.art==="kl"?20:0)}" width="${Wd-4}" height="20" rx="4" fill="${e.art==="rcd"?"#2F6FD1":e.art==="res"?"#A9AEB6":"#737A84"}"/><text x="${X+Wd/2}" y="${KY+14}" font-size="10.5" font-weight="800" text-anchor="middle" fill="#fff">${esc(String(e.kz||"").slice(0,w>1?16:7))}</text>`}
          ${sym?`<g transform="translate(${X+Wd/2-11} ${KY+28})" class="leg-sym">${legSymSvg(sym,22,true)}</g>`:""}
          ${z.map((t,k)=>`<text x="${X+Wd/2}" y="${KY+(sym?66:40)+(e.art==="kl"?20:0)+k*13}" font-size="${fz}" font-weight="600" text-anchor="middle" class="leg-st">${esc(t)}</text>`).join("")}</g>`; hoch=Math.max(hoch,KY+(sym?66:40)+(z.length-1)*13+10+(e.art==="kl"?20:0)); x+=w; return out; }).join("");
      const frei=n-r.te, last=r.g[r.g.length-1][1];
      const fr=frei>0?`<g class="leg-frei" ${zu?"":`data-act="legNach" data-i="${last}"`}><rect x="${x*P+2}" y="${GH*.12}" width="${frei*P-4}" height="${GH*.76}" rx="5" class="leg-fr"/><text x="${x*P+frei*P/2}" y="${frei>1?GH/2-4:GH/2-18}" font-size="${frei>1?12:10}" font-weight="800" text-anchor="middle" class="leg-frt">${frei>1?`${frei} TE frei`:"frei"}</text>${zu?"":`<text x="${x*P+frei*P/2}" y="${frei>1?GH/2+16:GH/2+2}" font-size="16" font-weight="700" text-anchor="middle" class="leg-frt">+</text>`}</g>`:"";
      return `<div class="leg-reihe" style="width:min(100%,${Math.round(B*1.45)+28}px)"><div class="leg-rk">Reihe ${ri+1}<span>${r.te} von ${n} TE belegt</span></div><div class="leg-rs"><svg viewBox="0 ${r.g.some(([e])=>e.art==="kl")?-20:0} ${B} ${hoch+(r.g.some(([e])=>e.art==="kl")?20:0)}" class="leg-svg" role="img" aria-label="Reihe ${ri+1}"><rect x="0" y="${GH/2-17}" width="${B}" height="34" rx="2" fill="#C9CDD2"/><rect x="0" y="${GH/2-11}" width="${B}" height="22" fill="#B5BAC0"/>${g}${fr}</svg></div></div>`; }).join(""); }

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
function legNaechsteKz(E,i){ for(let j=i;j>=0;j--){ const e=E[j]; if(!e||e.art==="gr"||!e.kz) continue;
    if(e.art==="rcd") return String(e.kz).trim()+(legZweistellig(E)?".01":".1");   /* direkt nach dem RCD: sein erster Automat */
    const t=legKzTeile(e.kz); if(!t) return ""; const l=t.z.length-1, w=t.z[l]; t.z[l]=String(+w+1).padStart(w.length,"0");
    return t.vor+t.z.join("."); }
  return ""; }
/* Nächster RCD in derselben Reihe (F 1.0 → F 1.1) bzw. erster RCD der nächsten Reihe (→ F 2.0) */
function legRcdKz(E,i,neueReihe){ let vor="F ", reihe=1, rcd=-1;
  for(let j=Math.min(i,E.length-1);j>=0;j--){ const e=E[j]; if(!e||e.art==="gr") continue; const t=legKzTeile(e.kz); if(!t) continue;
    vor=t.vor; reihe=+t.z[0]; if(e.art==="rcd"){ rcd=+(t.z[1]||0); break; } if(rcd<0&&t.z.length>=3){ rcd=+t.z[1]; break; } }
  if(neueReihe) return `${vor}${reihe+1}.0`;
  return `${vor}${reihe}.${rcd+1}`; }
function legSkDlg(id,nach){ const L=legAkt(); if(!L) return; const E=legE(L), i=id?E.findIndex(x=>x.id===id):-1, e=i>=0?E[i]:null;
  const pos=e?i:nach!=null?nach+1:E.length, art=e?e.art:"sk";
  const v=e||{art,kz:legNaechsteKz(E,pos-1),bez:"",schutz:"",pole:1};
  legDlg={id:e?e.id:null,pos,art:v.art,pole:String(v.pole||1),auto:e?null:v.kz,te:e&&e.te?String(e.te):"",umbruch:!!(e&&e.umbruch),sym:e&&e.sym||""};
  const rcdN=legRcdKz(E,pos-1,false), rcdR=legRcdKz(E,pos-1,true);
  const vorschl=[...new Set(live("legenden").flatMap(x=>legE(x).filter(y=>y.art==="sk"&&y.bez).map(y=>y.bez)))];
  dialog(e?"Zeile bearbeiten":"Neue Zeile",`<div class="chips ec-wahl leg-art">${LEG_ART.map(([k,t])=>`<button type="button" class="chip" data-act="legArt" data-v="${k}" aria-pressed="${k===v.art}">${t}</button>`).join("")}</div>
    <div class="fg1" style="margin-top:14px">
      <div class="leg-nur" data-nicht="gr">${tf("legKz","Kennzeichnung",v.kz||"",{form:true,ph:"z. B. F 1.0.1"})}</div>
      <div class="chips ec-wahl leg-nur" data-nur="rcd"><button type="button" class="chip" data-act="legSetz" data-ziel="f_legKz" data-v="${esc(rcdN)}">Nächster RCD: ${esc(rcdN)}</button><button type="button" class="chip" data-act="legSetz" data-ziel="f_legKz" data-v="${esc(rcdR)}">Neue Reihe: ${esc(rcdR)}</button></div>
      <div class="leg-nur" data-nicht="res">${tf("legBez",v.art==="gr"?"Überschrift":"Bezeichnung",v.bez||"",{form:true,ph:v.art==="gr"?"z. B. Erdgeschoss":v.art==="rcd"?"Fehlerstromschutzschalter":"z. B. Küche Steckdosen",list:"legBezListe"})}</div>
    </div>${datalist("legBezListe",vorschl)}
    <div class="leg-nur" data-nur="sk"><div class="lbl" style="margin-top:12px">Raum</div><div class="chips ec-wahl leg-vor">${LEG_RAUM.map(x=>`<button type="button" class="chip" data-act="legWort" data-v="${esc(x)}">${esc(x)}</button>`).join("")}</div>
      <div class="lbl" style="margin-top:12px">Verbraucher</div><div class="chips ec-wahl leg-vor">${LEG_WAS.map(x=>`<button type="button" class="chip" data-act="legWort" data-v="${esc(x)}">${esc(x)}</button>`).join("")}</div></div>
    <div class="leg-nur" data-nicht="gr"><div class="fg1" style="margin-top:16px">${tf("legSchutz","Absicherung",v.schutz||"",{form:true,ph:v.art==="rcd"?"z. B. 40 A / 30 mA Typ A":"z. B. B16"})}</div>
      <div class="chips ec-wahl leg-ls leg-nur" data-nicht="rcd">${LEG_LS.map(x=>`<button type="button" class="chip" data-act="legSetz" data-ziel="f_legSchutz" data-v="${x}">${x}</button>`).join("")}</div>
      <div class="chips ec-wahl leg-nur" data-nur="rcd">${LEG_RCD.map(x=>`<button type="button" class="chip" data-act="legSetz" data-ziel="f_legSchutz" data-v="${esc(x)}">${esc(x)}</button>`).join("")}</div></div>
    <div class="leg-nur" data-nur="sk"><div class="lbl" style="margin-top:12px">Pole</div><div class="chips ec-wahl">${[["1","1-polig"],["3","3-polig"]].map(([k,t])=>`<button type="button" class="chip" data-act="legPole" data-v="${k}" aria-pressed="${k===legDlg.pole}">${t}</button>`).join("")}</div></div>
    <div class="leg-nur" data-nicht="gr"><div class="lbl" style="margin-top:12px">Im Verteiler</div><div class="chips ec-wahl">${[["","Breite automatisch"],["1","1 TE"],["2","2 TE"],["3","3 TE"],["4","4 TE"]].map(([k,t])=>`<button type="button" class="chip" data-act="legTe" data-v="${k}" aria-pressed="${k===legDlg.te}">${t}</button>`).join("")}<button type="button" class="chip" data-act="legNr" aria-pressed="${legDlg.umbruch}">Neue Reihe ab hier</button></div>
      <div class="lbl" style="margin-top:12px">Symbol auf der Beschriftung</div><div class="chips ec-wahl leg-symw">${[["","Automatisch"],...LEG_SYM_LISTE,["keins","Kein Symbol"]].map(([k,t])=>`<button type="button" class="chip" data-act="legSym" data-v="${k}" aria-pressed="${k===legDlg.sym}" title="${esc(t)}">${LEG_SYM[k]?legSymSvg(k,18):""}${esc(t)}</button>`).join("")}</div></div>`,
    `${e?`<button class="btn-text danger" data-act="legSkDel">Löschen</button><button class="ab-ic" data-act="legOrd" data-d="-1" ${i?"":"disabled"} aria-label="Nach oben" title="Nach oben">${icon("chev")}</button><button class="ab-ic ab" data-act="legOrd" data-d="1" ${i<E.length-1?"":"disabled"} aria-label="Nach unten" title="Nach unten">${icon("chev")}</button>`:""}<span style="flex:1"></span>
      <button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="legSkOk" data-weiter="1">${e?"Darunter neu":"Nächster"}</button><button class="btn-text" data-act="legSkOk">Speichern</button>`,{breit:true});
  legArtZeigen(); }
function legArtZeigen(){ const a=legDlg&&legDlg.art; if(!a) return;
  document.querySelectorAll("#dlg .leg-nur").forEach(x=>x.hidden=(x.dataset.nur&&x.dataset.nur!==a)||(x.dataset.nicht&&x.dataset.nicht===a));
  const lb=document.querySelector('#dlg label[for="f_legBez"]'); if(lb) lb.textContent=a==="gr"?"Überschrift":"Bezeichnung";
  const bz=document.getElementById("f_legBez"); if(bz) bz.placeholder=a==="gr"?"z. B. Erdgeschoss":a==="rcd"?"Fehlerstromschutzschalter":"z. B. Küche Steckdosen";
  const sc=document.getElementById("f_legSchutz"); if(sc) sc.placeholder=a==="rcd"?"z. B. 40 A / 30 mA Typ A":"z. B. B16"; }
function legSkOk(weiter){ const L=legAkt(); if(!L||!legDlg) return; const F=formVals(), E=legE(L), a=legDlg.art;
  if(a==="gr"&&!F.legBez){ toast("Bitte eine Überschrift eintragen"); return; }
  if(a!=="gr"&&!F.legKz){ toast("Bitte eine Kennzeichnung eintragen"); return; }
  const r={id:legDlg.id||uid(),art:a,kz:a==="gr"?"":F.legKz,bez:a==="res"?"":a==="rcd"&&!F.legBez?"Fehlerstromschutzschalter":F.legBez,schutz:a==="gr"?"":F.legSchutz,pole:a==="sk"?+legDlg.pole:1,...(legDlg.te?{te:+legDlg.te}:{}),...(legDlg.umbruch?{umbruch:true}:{}),...(legDlg.sym?{sym:legDlg.sym}:{})};
  { const alt=E.find(x=>x.id===r.id); if(alt&&alt.mat&&alt.schutz===r.schutz&&alt.art===r.art) r.mat=alt.mat; }   /* Artikel aus der Materialliste bleibt, solange die Absicherung gleich ist */
  let i=E.findIndex(x=>x.id===r.id); if(i>=0) E[i]=r; else { E.splice(legDlg.pos,0,r); i=legDlg.pos; }
  legSpeichern(L); render();
  if(weiter) legSkDlg(null,i); else closeOverlays(); }

/* ---- PDF ---- */
async function legPdf(L){ const lib=await pdfLib(), d=new lib.jsPDF({unit:"mm",format:"a4"});
  const S=pdfStil(d,{titel:"Verteilerlegende",unter:`Stromkreisübersicht | ${L.titel||"Verteiler"}`,ehw:true,fuss:[L.kunde,L.titel,L.stand&&"Stand "+ecDatum(L.stand)].filter(Boolean).join(" | ")});
  const M=S.M, CW=S.CW, sp=[32,116,34];
  S.kopf(); S.abschnitt("Anlage");
  S.werte([["Kunde",L.kunde],["Verteiler",L.titel],["Anschrift",L.anschrift],["Stand",ecDatum(L.stand)],["Erstellt von",L.ersteller],...(L.netz?[["Netzform",L.netz]]:[])]);
  S.abschnitt("Hinweis für den Betreiber");
  S.text("Fehlerstromschutzschalter (RCD) alle 6 Monate über die Prüftaste „T“ auslösen. Schaltet der RCD dabei nicht ab, könnte er defekt sein. In diesem Fall bitte Elektro Irrgang informieren.");
  /* Kontakt groß wie im alten Verteilerplan */
  S.platz(14); const y=S.y+1, x2=M+CW/2;
  d.setTextColor(20); d.setFont("helvetica","bold"); d.setFontSize(12); d.text("Elektro Irrgang",M,y); d.setTextColor(...[225,29,47]); d.text("Tel. 02291 4878",x2,y);
  d.setFont("helvetica","normal"); d.setFontSize(10); d.setTextColor(40); d.text(pdfT("Hahner Weg 2 | 51545 Waldbröl"),M,y+5.2); d.text(pdfT("info@elektro-irrgang.de | www.elektro-irrgang.de"),x2,y+5.2);
  S.y=y+13;
  S.abschnitt("Stromkreise");
  const kz=()=>{ d.setFillColor(...S.NAVY); d.rect(M,S.y-4,CW,6,"F"); d.setTextColor(255); d.setFontSize(8); d.setFont("helvetica","bold"); let x=M+2; ["Kennzeichnung","Bezeichnung","Absicherung"].forEach((t,i)=>{ d.text(t,x,S.y); x+=sp[i]; }); S.y+=6; };
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
    S.y+=6+ex; });
  return S.ende(); }
async function legPdfMachen(){ const L=legAkt(); if(!L) return; if(!legE(L).length){ toast("Erst Stromkreise anlegen"); return; }
  toast("PDF wird erstellt …"); let blob; try{ blob=await legPdf(L); }catch(e){ console.error(e); toast("PDF konnte nicht erstellt werden – Internet für die PDF-Bibliothek nötig"); return; }
  const name=`Verteilerlegende ${[L.titel,L.kunde].filter(Boolean).join(" ")}`.replace(/[\\/:*?"<>|]+/g," ").trim()+".pdf", url=URL.createObjectURL(blob);
  toast("PDF erstellt","Öffnen",()=>{ if(DESK.matches){ const a=document.createElement("a"); a.href=url; a.download=name; document.body.appendChild(a); a.click(); a.remove(); window.open(url,"_blank","noopener"); } else window.open(url,"_blank","noopener"); }); }

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
  case "legNr": legDlg.umbruch=!legDlg.umbruch; b.setAttribute("aria-pressed",legDlg.umbruch); return;
  case "legSym": legDlg.sym=b.dataset.v; b.parentElement.querySelectorAll(".chip").forEach(c=>c.setAttribute("aria-pressed",c===b)); return;
  case "legAnsicht": META.legAnsicht=b.dataset.v; metaSave(); render(); return;
  case "legNach": legSkDlg(null,+b.dataset.i); return;
  case "legOpt": { if(!L) return; L[b.dataset.k]=+b.dataset.v; legSave(L); render(); return; }
  case "legSetz": { const f=document.getElementById(b.dataset.ziel); if(f){ f.value=b.dataset.v; f.parentElement.classList.add("fl"); } return; }
  case "legWort": { const f=document.getElementById("f_legBez"); if(!f) return; const w=b.dataset.v, t=f.value.trim();
      f.value=!t?w:t.split(/\s+/).includes(w)?t:t+" "+w; f.parentElement.classList.add("fl"); return; }
  case "legSkOk": legSkOk(!!b.dataset.weiter); return;
  case "legSkDel": { if(!L||!legDlg) return; L.eintraege=legE(L).filter(x=>x.id!==legDlg.id); legSpeichern(L); closeOverlays(); render(); return; }
  case "legOrd": { if(!L||!legDlg) return; const E=legE(L), i=E.findIndex(x=>x.id===legDlg.id), j=i+(+b.dataset.d); if(i<0||j<0||j>=E.length) return;
      [E[i],E[j]]=[E[j],E[i]]; legSpeichern(L); render(); legSkDlg(legDlg.id); return; }
  case "legPdf": legPdfMachen(); return;
  case "legFertig": { if(!L) return; L.fertig=b.dataset.v==="1"; legSave(L); render(); toast(L.fertig?"Abgeschlossen":"Wieder in Arbeit"); return; }
  case "legTab": nav.tab=b.dataset.v; closeOverlays(); render(); scrollTo(0,0); return;
  case "legDelAsk": confirmDlg(L&&L._geb?"Verteiler löschen?":"Legende löschen?",L&&L._geb?`„${L.titel}“ mit allen RCDs und Stromkreisen löschen? Messwerte früherer Prüfungen zu diesen Stromkreisen werden dann nicht mehr zugeordnet.`:`„${L&&L.titel||"Verteiler"}“ mit allen Zeilen löschen?`,"Löschen","legDelOk"); return;
  case "legDelOk": { if(!L) return; if(L._geb){ const g=vtGeb(L._geb); if(g){ L.eintraege=[]; vtSchreiben(L); const g2=vtGeb(L._geb); g2.verteiler=g2.verteiler.filter(v=>v.id!==L._v); ecGebSpeichern(g2); } go(vtZuruck(L._geb)); toast("Verteiler gelöscht"); return; }
      L.deleted=true; saveRec("legenden",L); go(legZuruck(L)); toast("Legende gelöscht"); return; }
  } },true);
document.addEventListener("change",e=>{ const el=e.target; if(el.id==="f_legZuK"){ const f=document.getElementById("legOrtFeld"); if(f) f.innerHTML=ecOrtFeld(el.value); return; }
  if(!el.dataset||!el.dataset.leg) return; const L=legAkt(); if(!L) return;
  const k=el.dataset.leg, v=el.value.trim(); if((L[k]||"")===v) return; L[k]=v; if(k==="stand") legSave(L); else legSpeichern(L);
  if(k==="titel"){ const t=document.querySelector("#topTitle span"); if(t) t.textContent=v||"Verteiler"; } });
