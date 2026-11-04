/* ===== KNX-Projekte (Gebäudetechnik, Reiter „KNX“) – 04.11.2026 =====
   Aufgebaut wie die Verteiler: Liste der Projekte (je Kunde/Standort), im Projekt eigene Reiter Übersicht · Räume · Geräte · Programmieren.
   Daten im Gebäude-Datensatz (gebaeude, wie Verteiler und Räume):
     g.etagen[].raeume[]  – dieselben Räume wie in der Gebäudetechnik; neu: raum.bauteilId (Bauteil A, B …)
     g.knx = { an:true, linien:[{id,bereich,linie,start,raeume:[raumId…]}], geraete:[{id,raumId,typ,zustand,nr,notiz,prog,einb,pruef,problem,created}] }
       zustand: neu | vorhanden | ersetzt;  prog/einb/pruef: {at,von};  problem: {art:"defekt"|"problem",notiz,von,at}
   Gerätearten (Reihenfolge = Reihenfolge der Adressen im Raum) firmenweit in einstellungen/knx.
   Adressen: je Linie Raum für Raum in der Reihenfolge der Linie, im Raum nach Geräteart, nur Geräte mit Busanschluss.
   Programmieren zu zweit: kleine Datei je Projekt in der Firmen-Cloud (…/knxsitzung/<Projekt>.json), beide Seiten fragen alle 2 s nach. */
Object.assign(IC,{kxRaum:"M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",kxProg:"M20 13H4c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h16c.55 0 1-.45 1-1v-6c0-.55-.45-1-1-1zM7 19c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM20 3H4c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h16c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1zM7 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z",
  kxListe:"M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z",kxUeb:"M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z",kxTipp:"M9 11.24V7.5a2.5 2.5 0 0 1 5 0v3.74c1.21-.81 2-2.18 2-3.74C16 5.01 13.99 3 11.5 3S7 5.01 7 7.5c0 1.56.79 2.93 2 3.74zm9.84 4.63l-4.54-2.26c-.17-.07-.35-.11-.54-.11H13v-6c0-.83-.67-1.5-1.5-1.5S10 6.67 10 7.5v10.74l-3.43-.72c-.08-.01-.15-.03-.24-.03-.31 0-.59.13-.79.33l-.79.8 4.94 4.94c.27.27.65.44 1.06.44h6.79c.75 0 1.33-.55 1.44-1.28l.75-5.27c.01-.07.02-.14.02-.2 0-.62-.38-1.16-.91-1.38z"});
/* ---- Gerätearten ---- */
const KX_TYP_STD=[["jal","Jalousieaktor",1,1],["schalt","Schaltaktor",1,1],["dimm","Dimmaktor",1,1],["heiz","Heizungsaktor",1,1],["praes","Präsenzmelder",1,1],["bew","Bewegungsmelder",1,1],
  ["rtr","Raumthermostat",1,2],["tast","Taster",1,1],["bin","Binäreingang",1,1],["disp","Display",1,1],["stell","Stellantrieb",0,1],["motor","Jalousiemotor",0,1]].map(([id,name,bus,eti])=>({id,name,bus:!!bus,eti}));
function kxTypen(){ const r=DB.einstellungen&&DB.einstellungen.get("knx"); return r&&!r.deleted&&Array.isArray(r.typen)&&r.typen.length?r.typen:KX_TYP_STD; }
function kxTypenSpeichern(L){ const neu=!DB.einstellungen.has("knx"), r=DB.einstellungen.get("knx")||{id:"knx"}; r.typen=L; r.deleted=false; saveRec("einstellungen",r,neu); }
const kxTyp=id=>kxTypen().find(t=>t.id===id)||{id,name:id||"Gerät",bus:true,eti:1};
const kxRang=id=>{ const i=kxTypen().findIndex(t=>t.id===id); return i<0?999:i; };
/* ---- Daten ---- */
const kxNorm=g=>{ g.bauteile=g.bauteile||[]; const k=g.knx=g.knx||{}; k.linien=k.linien||[]; k.geraete=k.geraete||[]; return k; };
const kxProjekte=()=>live("gebaeude").filter(g=>g.knx&&g.knx.an).map(g0=>ecGebNorm(g0));
function kxRaeume(g){ const B=g.bauteile||[], out=[];
  ecEtagen(g).forEach(e=>e.raeume.forEach((r,i)=>out.push({r,e,b:r.bauteilId&&B.find(x=>x.id===r.bauteilId),i})));
  return out.sort((x,y)=>{ const bx=x.b?B.indexOf(x.b):-1, by=y.b?B.indexOf(y.b):-1; return bx-by; }); }
const kxRaumInfo=(g,rid)=>kxRaeume(g).find(x=>x.r.id===rid);
const kxGruppe=x=>[x.b&&(/^bauteil/i.test(x.b.name)?x.b.name:`Bauteil ${x.b.name}`),x.e.name].filter(Boolean).join(" · ");
const kxRaumTitel=(g,rid)=>{ const x=kxRaumInfo(g,rid); return x?`${x.r.name}`:"Raum"; };
const kxLinie=(g,id)=>kxNorm(g).linien.find(l=>l.id===id);
const kxLinieVonRaum=(g,rid)=>kxNorm(g).linien.find(l=>(l.raeume||[]).includes(rid));
const kxNull=()=>typeof KNX_ETI==="undefined"||KNX_ETI.null!==false;
function kxPA(g,d){ if(d.nr==null||d.nr==="") return ""; const l=kxLinieVonRaum(g,d.raumId); if(!l) return ""; const n=+d.nr; return `${l.bereich}.${l.linie}.${kxNull()&&n<10?"0"+n:n}`; }
const kxSort=(g,A)=>{ const R=kxRaeume(g).map(x=>x.r.id); return A.slice().sort((a,b)=>R.indexOf(a.raumId)-R.indexOf(b.raumId)||kxRang(a.typ)-kxRang(b.typ)||(a.created||0)-(b.created||0)); };
const kxGeraete=(g,rid)=>kxSort(g,kxNorm(g).geraete.filter(d=>!rid||d.raumId===rid));
const kxFertig=d=>d.prog&&d.einb&&d.pruef&&!d.problem;
function kxZustandText(d){ if(d.problem) return d.problem.art==="defekt"?"defekt":"Problem"; if(kxFertig(d)) return "fertig";
  const T=[]; if(d.prog) T.push(d.einb?"programmiert":"vorprogrammiert"); if(d.einb) T.push("eingebaut"); if(d.pruef) T.push("überprüft"); return T.join(" · ")||"offen"; }
const kxTon=d=>d.problem?(d.problem.art==="defekt"?"bad":"wip"):kxFertig(d)?"ok":"";
const kxWer=()=>({at:Date.now(),von:(typeof ME!=="undefined"&&(ME.name||ME.mail))||""});
const kxSpeichern=g=>{ g.knx.updated=Date.now(); ecGebSpeichern(g); };
const kxGebAkt=()=>{ const g=nav.g&&vtGeb(nav.g); return g&&g.knx&&g.knx.an?(kxNorm(g),g):null; };
const kxDatum=t=>t?new Date(t).toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit"}):"";

/* ===== Liste im Reiter „KNX“ ===== */
function kxListeInhalt(){ const q=(typeof query!=="undefined"?query:"").trim().toLowerCase(), P=kxProjekte().map(g=>({g,o:ecOrt(g.ortId)})).filter(({g,o})=>!q||suPasst(q,o.titel,(o.kunde||{}).kdnr)).sort((a,b)=>(b.g.knx.updated||b.g.updated||0)-(a.g.knx.updated||a.g.updated||0));
  if(!P.length) return q?`<p class="meta" style="margin:16px 4px">Kein KNX-Projekt gefunden.</p>`:`<div class="empty">${icon("knx")}<h2>Noch kein KNX-Projekt</h2><p>Mit „Projekt“ einen Kunden wählen – dann Räume anlegen, Geräte bei der Begehung zählen, Adressen vergeben und zu zweit programmieren.</p></div>`;
  return listOf(P.map(({g,o})=>{ const G=g.knx.geraete||[], bus=G.filter(d=>kxTyp(d.typ).bus), p=bus.filter(d=>d.prog).length, def=G.filter(d=>d.problem).length, R=kxRaeume(g).length;
    return `<div class="li" role="button" tabindex="0" data-act="kxAuf" data-g="${esc(g.id)}"><span class="av">${icon("knx")}</span><span class="lt"><span class="h">${esc(o.titel)}</span>
      <span class="s">${esc([`${R} Räume`,`${G.length} Geräte`,bus.length?`${p} von ${bus.length} programmiert`:""].filter(Boolean).join(" · "))}</span>
      <span class="st">${def?pill("bad",`${def} defekt`):bus.length&&p===bus.length&&G.every(kxFertig)?pill("ok","fertig"):pill("wip","in Arbeit")}</span></span>${icon("chev")}</div>`; })); }
function knxView(){ return `<div class="narrow">${searchBar("Kunde, Ort",null)}<div id="res">${kxListeInhalt()}</div>
  <div class="sec-lbl" style="margin-top:24px">Ohne Projekt</div>${listOf([`<div class="li" role="button" tabindex="0" data-act="knxEti"><span class="av">${icon("tag")}</span><span class="lt"><span class="h">Etiketten für eine Linie</span><span class="s">Adressbereich von Hand, z. B. 6.1.01 bis 6.1.36 – für den Brother, 6 mm</span></span>${icon("chev")}</div>`])}</div>`; }
if(typeof SU_LISTE!=="undefined") SU_LISTE.knx=kxListeInhalt;
/* beim Kunden / Standort, wie die Verteiler */
function kxBeiKunde(kind,r){ const orte=kind==="kunden"?["k:"+r.id,...standorteVon(r.id).map(s=>s.id)]:[r.id], P=kxProjekte().filter(g=>orte.includes(g.ortId));
  return kdKopf("KNX","kxNeuHier","KNX-Projekt anlegen",` data-kind="${kind}" data-id="${esc(r.id)}"`)+(P.length?listOf(P.map(g=>{ const o=ecOrt(g.ortId), G=g.knx.geraete||[];
    return `<div class="li" role="button" tabindex="0" data-act="kxAuf" data-g="${esc(g.id)}"><span class="av">${icon("knx")}</span><span class="lt"><span class="h">${esc(o.standort?o.standort.name||o.titel:"KNX-Projekt")}</span><span class="s">${G.length} Geräte · ${kxRaeume(g).length} Räume</span></span>${icon("chev")}</div>`; })):`<p class="meta">Noch kein KNX-Projekt.</p>`); }
/* neues Projekt */
function kxNeuDlg(kundeId,ort){ const K=live("kunden").sort((a,b)=>a.name.localeCompare(b.name,"de"));
  dialog("Neues KNX-Projekt",`<div class="fg1">${sf("ecKunde","Kunde",kundeId||"",[["","Kunde wählen …"],...K.map(k=>[k.id,k.name+(k.kdnr?` (${k.kdnr})`:"")])],{form:true})}<div id="ecOrtFeld">${ecOrtFeld(kundeId,ort)}</div></div>
    ${K.length?"":`<p class="meta">Noch keine Kunden – erst unter „Kunden“ anlegen.</p>`}<p class="meta" style="margin:12px 4px 0">Räume und Bauteile sind dieselben wie in der übrigen Gebäudetechnik dieses Kunden.</p>`,
    `<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="kxNeuOk">Anlegen</button>`,{breit:true}); }
function kxNeuOk(){ const F=formVals(); if(!F.ecKunde){ toast("Bitte einen Kunden wählen"); return; }
  const ortId=F.ecOrt||"k:"+F.ecKunde, g=ecGeb(ortId); kxNorm(g); g.knx.an=true; g.knx.created=g.knx.created||Date.now(); kxSpeichern(g); closeOverlays(); go({v:"kx",g:g.id,tab:"raeume"}); }

/* ===== Projekt ===== */
const KX_TABS=[["ueb","Übersicht","kxUeb"],["raeume","Räume","kxRaum"],["geraete","Geräte","kxListe"],["prog","Programmieren","kxProg"]];
const kxTab=()=>KX_TABS.some(t=>t[0]===nav.tab)?nav.tab:"ueb";
function kxTitel(g){ if(nav.raum){ const x=kxRaumInfo(g,nav.raum); return {title:x?x.r.name:"Raum",sub:x?kxGruppe(x):""}; } const o=ecOrt(g.ortId); return {title:o.titel,sub:"KNX-Projekt"}; }
function kxFab(g){ const t=kxTab(); if(t==="raeume"&&!nav.raum) return ["kxRaumNeu","Räume","add"]; if(t==="ueb") return ["kxLinieNeu","Linie","add"]; return null; }
function kxProjektView(g){ kxNorm(g); const t=kxTab();
  if(t==="raeume") return nav.raum?kxRaumView(g,nav.raum):kxRaeumeView(g);
  if(t==="geraete") return kxGeraeteView(g);
  if(t==="prog") return kxProgView(g);
  return kxUebView(g); }
/* ---- Übersicht ---- */
function kxUebView(g){ const G=g.knx.geraete, bus=G.filter(d=>kxTyp(d.typ).bus), mitAdr=bus.filter(d=>kxPA(g,d)), n=k=>G.filter(d=>d[k]).length, P=G.filter(d=>d.problem);
  const kachel=(z,t,tab)=>`<button type="button" class="vu-k" data-act="kxTab" data-v="${tab}"><b>${z}</b><span>${t}</span></button>`;
  const zahlen=`<section class="card"><h3>Stand</h3><div class="vu-kacheln">${kachel(kxRaeume(g).length,"Räume","raeume")}${kachel(G.length,"Geräte","geraete")}${kachel(`${mitAdr.length}/${bus.length}`,"mit Adresse","geraete")}${kachel(n("prog"),"programmiert","geraete")}${kachel(n("einb"),"eingebaut","geraete")}${kachel(n("pruef"),"überprüft","geraete")}${kachel(G.filter(kxFertig).length,"fertig","geraete")}${kachel(P.length,"Probleme","geraete")}</div></section>`;
  const prob=P.length?`<section class="card kx-prob"><h3>Funktioniert nicht</h3>${ecListe(kxSort(g,P).map(d=>ecLi({lead:icon("warn"),ton:d.problem.art==="defekt"?"bad":"wip",kopf:esc([kxPA(g,d),kxTyp(d.typ).name].filter(Boolean).join(" · ")),text:esc([kxRaumTitel(g,d.raumId),d.problem.art==="defekt"?"defekt":"Problem",d.problem.notiz,d.problem.von&&`gemeldet von ${d.problem.von}`].filter(Boolean).join(" · ")),act:"kxGer",id:d.id})))}</section>`:"";
  const L=g.knx.linien, lin=`<section class="card"><div class="card-kopf"><h3>Linien</h3></div>${L.length?ecListe(L.map(l=>{ const R=(l.raeume||[]).map(rid=>kxRaumTitel(g,rid)), D=G.filter(d=>(l.raeume||[]).includes(d.raumId)&&kxTyp(d.typ).bus), a=D.filter(d=>d.nr!=null&&d.nr!=="").length;
      return ecLi({lead:`<b>${esc(l.bereich+"."+l.linie)}</b>`,breit:true,kopf:esc(R.length?(R.length>3?`${R[0]} … ${R[R.length-1]} (${R.length} Räume)`:R.join(", ")):"noch keine Räume"),text:esc(`${D.length} Busgeräte · ${a} mit Adresse`),act:"kxLinie",id:l.id}); }))
      +`<div class="kx-knoepfe">${L.map(l=>`<button type="button" class="btn-tonal" data-act="kxAdr" data-id="${esc(l.id)}">${icon("kxListe")}Adressen ${esc(l.bereich+"."+l.linie)}</button><button type="button" class="btn-tonal" data-act="kxEti" data-id="${esc(l.id)}">${icon("tag")}Etiketten ${esc(l.bereich+"."+l.linie)}</button>`).join("")}</div>`
    :`<p class="meta">Noch keine Linie. Eine Linie gehört zu einer Gruppe von Räumen, z. B. Raum 403–407 = Linie 6.1. Unten rechts mit „Linie“ anlegen.</p>`}</section>`;
  const typ=`<section class="card">${ecListe([ecLi({lead:icon("kxListe"),kopf:"Gerätearten und Reihenfolge",text:esc(kxTypen().filter(t=>t.bus).slice(0,5).map(t=>t.name).join(" › ")+" …"),act:"kxTypen"})])}</section>`;
  return `<div class="narrow ec-spalte">${prob}${zahlen}${lin}${typ}</div>`; }
/* ---- Räume ---- */
function kxRaeumeView(g){ const R=kxRaeume(g); if(!R.length) return `<div class="narrow"><div class="empty">${icon("kxRaum")}<h2>Noch keine Räume</h2><p>Unten rechts „Räume“: Bauteil, Etage und Raumnummern als Bereich, z. B. 403–407 – in der Reihenfolge, in der du durchgehst.</p></div></div>`;
  const grp=new Map(); R.forEach(x=>{ const k=kxGruppe(x); if(!grp.has(k)) grp.set(k,[]); grp.get(k).push(x); });
  return `<div class="narrow">${[...grp].map(([k,L])=>`<div class="sec-lbl">${esc(k||"Ohne Etage")}</div>${ecListe(L.map(({r})=>{ const D=kxGeraete(g,r.id), l=kxLinieVonRaum(g,r.id), off=D.filter(d=>!kxFertig(d)).length, p=D.filter(d=>d.problem).length;
      return ecLi({lead:icon("kxRaum"),ton:p?"bad":D.length&&!off?"ok":"",kopf:esc(r.name),text:esc([D.length?`${D.length} Geräte`:"noch nichts erfasst",D.length?(off?`${off} offen`:"alles fertig"):"",p?`${p} mit Problem`:"",l?`Linie ${l.bereich}.${l.linie}`:""].filter(Boolean).join(" · ")),act:"kxRaumAuf",id:r.id}); }))}`).join("")}</div>`; }
let KX_ZUSTAND="neu";
function kxRaumView(g,rid){ const D=kxGeraete(g,rid), T=kxTypen();
  const zaehl=T.map(t=>{ const n=D.filter(d=>d.typ===t.id).length;
    return `<div class="kx-z${n?" hat":""}"><span class="kx-zn"><b>${esc(t.name)}</b>${t.bus?"":`<small>ohne Busanschluss</small>`}</span><button type="button" class="kx-pm" data-act="kxMinus" data-v="${esc(t.id)}" aria-label="${esc(t.name)} entfernen" ${n?"":"disabled"}>−</button><b class="kx-n">${n}</b><button type="button" class="kx-pm plus" data-act="kxPlus" data-v="${esc(t.id)}" aria-label="${esc(t.name)} hinzufügen">+</button></div>`; }).join("");
  return `<div class="narrow ec-spalte"><section class="card"><h3>Begehung</h3><p class="meta" style="margin:0 0 10px">Zählen, was in den Raum kommt. Neue Geräte gelten als:</p>
    <div class="knx-seg kx-zst">${[["neu","neu"],["vorhanden","vorhanden"],["ersetzt","ersetzt"]].map(([v,t])=>`<button type="button" data-act="kxZst" data-v="${v}" aria-pressed="${KX_ZUSTAND===v}">${t}</button>`).join("")}</div>
    <div class="kx-zliste">${zaehl}</div></section>
    <section class="card"><h3>Geräte in diesem Raum</h3>${D.length?kxGerListe(g,D):`<p class="meta">Noch keine Geräte – oben zählen.</p>`}</section></div>`; }
/* Gerätezeile mit Status zum Abhaken */
function kxGerZeile(g,d){ const t=kxTyp(d.typ), pa=kxPA(g,d), st=(k,txt)=>`<button type="button" class="kx-st${d[k]?" an":""}" data-act="kxSt" data-id="${esc(d.id)}" data-k="${k}" aria-pressed="${!!d[k]}">${txt}</button>`;
  return `<div class="kx-g ${kxTon(d)}"><button type="button" class="kx-gk" data-act="kxGer" data-id="${esc(d.id)}"><span class="kx-pa${pa?"":" leer"}">${esc(pa||(t.bus?"–":"kein Bus"))}</span><span class="kx-gt"><b>${esc(t.name)}${d.zustand&&d.zustand!=="neu"?` <i>${esc(d.zustand)}</i>`:""}</b><small>${esc([kxZustandText(d),d.problem&&d.problem.notiz,d.notiz].filter(Boolean).join(" · "))}</small></span></button>
    <span class="kx-sts">${t.bus?st("prog","Prog."):""}${st("einb","Einb.")}${st("pruef","Gepr.")}</span></div>`; }
const kxGerListe=(g,D)=>`<div class="kx-gl">${D.map(d=>kxGerZeile(g,d)).join("")}</div>`;
/* ---- Geräte (Checkliste über alles) ---- */
let KX_FILTER="alle";
function kxGeraeteView(g){ let D=kxGeraete(g); const n={alle:D.length,offen:D.filter(d=>!kxFertig(d)).length,problem:D.filter(d=>d.problem).length};
  if(KX_FILTER==="offen") D=D.filter(d=>!kxFertig(d)); if(KX_FILTER==="problem") D=D.filter(d=>d.problem);
  const grp=new Map(); D.forEach(d=>{ if(!grp.has(d.raumId)) grp.set(d.raumId,[]); grp.get(d.raumId).push(d); });
  return `<div class="narrow"><div class="knx-seg kx-filter">${[["alle","Alle"],["offen","Offen"],["problem","Probleme"]].map(([v,t])=>`<button type="button" data-act="kxFilter" data-v="${v}" aria-pressed="${KX_FILTER===v}">${t} · ${n[v]}</button>`).join("")}</div>
    ${D.length?[...grp].map(([rid,L])=>`<div class="sec-lbl">${esc(kxRaumTitel(g,rid))}</div>${kxGerListe(g,L)}`).join(""):`<p class="meta" style="margin:16px 4px">${KX_FILTER==="problem"?"Keine Geräte mit Problem.":KX_FILTER==="offen"?"Keine offenen Geräte.":"Noch keine Geräte – unter „Räume“ bei der Begehung zählen."}</p>`}</div>`; }

/* ---- Dialoge ---- */
let KX_GS_HAND=false;
const kxGsOpts=()=>[["","aus der Bezeichnung erkennen"],...EC_GESCHOSS.map(([v,t])=>[String(v),t])];
function kxRaumNeuDlg(){ const g=kxGebAkt(); if(!g) return; const B=g.bauteile, E=ecEtagen(g), et0=E.find(e=>e.raeume.length)||E[0]; KX_GS_HAND=false;
  dialog("Räume anlegen",`<div class="fg">${sf("kxBt","Bauteil","",[["","– ohne –"],...B.map(b=>[b.id,b.name])],{form:true})}${tf("kxBtNeu","oder neues Bauteil","",{form:true,ph:"z. B. B"})}</div>
    <div class="fg" style="margin-top:12px">${sf("kxEt","Etage",(et0||{}).id||"",E.map(e=>[e.id,e.name]),{form:true})}${tf("kxEtNeu","oder neue Etage","",{form:true,ph:"z. B. Level 4"})}</div>
    <div class="fg1" style="margin-top:12px">${sf("kxGs","Geschoss",et0&&et0.ebene!=null&&et0.ebene!==""?String(et0.ebene):"",kxGsOpts(),{form:true})}</div>
    <p class="meta" style="margin:6px 4px 0">Heißt die Etage beim Kunden anders (z. B. „Level 4“), hier das echte Geschoss wählen. Gilt für die Etage überall, auch in der Prüfung.</p>
    <div class="fg1" style="margin-top:12px">${tf("kxRn","Räume","",{form:true,ph:"z. B. 403-407, 410, Flur"})}</div>
    <p class="meta" style="margin:8px 4px 0">In der Reihenfolge eintragen, in der du durchgehst – daraus folgen später die Adressen. Bereiche mit Bindestrich.</p>`,
    `<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="kxRaumOk">Anlegen</button>`,{breit:true});
  setTimeout(()=>{ const e=document.getElementById("f_kxRn"); if(e) e.focus(); },60); }
/* Geschoss-Feld mitführen: Etage gewählt → deren Geschoss; neue Etage getippt → aus dem Namen raten, solange nicht von Hand gewählt */
function kxGsSetzen(v){ const s=document.getElementById("f_kxGs"); if(!s) return; s.value=v==null?"":String(v); if(s.value!==(v==null?"":String(v))) s.value=""; }
document.addEventListener("change",ev=>{ const el=ev.target, g=nav.v==="kx"&&kxGebAkt(); if(!g) return;
  if(el.id==="f_kxGs"){ KX_GS_HAND=el.value!==""; return; }
  if(el.id==="f_kxEt"&&!(document.getElementById("f_kxEtNeu")||{}).value){ const e=g.etagen.find(x=>x.id===el.value); KX_GS_HAND=false; kxGsSetzen(e&&e.ebene!=null&&e.ebene!==""?e.ebene:null); } });
document.addEventListener("input",ev=>{ const el=ev.target; if(el.id!=="f_kxEtNeu"||KX_GS_HAND) return; const v=el.value.trim();
  if(v) kxGsSetzen(ecEbeneRaten(v)); else { const g=kxGebAkt(), e=g&&g.etagen.find(x=>x.id===(document.getElementById("f_kxEt")||{}).value); kxGsSetzen(e&&e.ebene!=null&&e.ebene!==""?e.ebene:null); } });
function kxRaumNamen(t){ const out=[]; String(t||"").split(/[,;\n]+/).map(s=>s.trim()).filter(Boolean).forEach(s=>{ const m=s.match(/^(\D*?)(\d+)\s*[-–]\s*\1?(\d+)$/);
    if(m&&+m[3]>=+m[2]&&+m[3]-+m[2]<200){ const w=m[2].length; for(let n=+m[2];n<=+m[3];n++) out.push(m[1]+String(n).padStart(m[2].startsWith("0")?w:0,"0")); } else out.push(s); }); return out; }
function kxRaumOk(){ const g=kxGebAkt(); if(!g) return; const F=formVals(), N=kxRaumNamen(F.kxRn); if(!N.length){ toast("Bitte Raumnummern eintragen"); return; }
  let bt=F.kxBt||""; if(F.kxBtNeu){ const vorh=g.bauteile.find(b=>b.name.toLowerCase()===F.kxBtNeu.toLowerCase()); bt=vorh?vorh.id:(()=>{ const b={id:"b-"+uid(),name:F.kxBtNeu}; g.bauteile.push(b); return b.id; })(); }
  let et=g.etagen.find(e=>e.id===F.kxEt); if(F.kxEtNeu){ et=g.etagen.find(e=>e.name.toLowerCase()===F.kxEtNeu.toLowerCase()); if(!et){ et={id:uid(),name:F.kxEtNeu,raeume:[]}; g.etagen.push(et); } }
  if(!et){ toast("Bitte eine Etage wählen"); return; }
  if(F.kxGs!==""&&F.kxGs!=null) et.ebene=+F.kxGs; else if(F.kxEtNeu){ const eb=ecEbeneRaten(F.kxEtNeu); if(eb!=null) et.ebene=eb; }
  let neu=0; N.forEach(n=>{ if(et.raeume.some(r=>r.name===n&&(r.bauteilId||"")===bt)) return; et.raeume.push({id:uid(),name:n,...(bt?{bauteilId:bt}:{})}); neu++; });
  kxSpeichern(g); closeOverlays(); render(); toast(neu?`${neu} ${neu>1?"Räume":"Raum"} angelegt`:"Diese Räume gibt es schon"); }
/* Linie anlegen/bearbeiten: Bereich.Linie, Startnummer, Räume in Reihenfolge */
let KX_LDLG=null;
function kxLinieDlg(id){ const g=kxGebAkt(); if(!g) return; const l=id&&kxLinie(g,id), R=kxRaeume(g);
  KX_LDLG={id:l?l.id:"",raeume:new Set(l?l.raeume:[])};
  const andere=rid=>{ const x=kxLinieVonRaum(g,rid); return x&&(!l||x.id!==l.id)?x:null; };
  dialog(l?`Linie ${l.bereich}.${l.linie}`:"Neue Linie",`<div class="knx-felder" style="grid-template-columns:1fr 1fr">${tf("kxLn","Linie",l?`${l.bereich}.${l.linie}`:"",{form:true,ph:"z. B. 6.1",im:"decimal"})}${tf("kxLs","Erste Gerätenummer",String(l&&l.start||1),{form:true,im:"numeric"})}</div>
    <div class="lbl" style="margin-top:12px">Räume dieser Linie</div>${R.length?`<div class="kx-rwahl">${R.map(x=>{ const a=andere(x.r.id); return `<button type="button" class="kx-rw${a?" fremd":""}" data-act="kxLRaum" data-v="${esc(x.r.id)}" aria-pressed="${KX_LDLG.raeume.has(x.r.id)}"><b>${esc(x.r.name)}</b>${a?`<small>${esc(a.bereich+"."+a.linie)}</small>`:""}</button>`; }).join("")}</div>`:`<p class="meta">Erst Räume anlegen.</p>`}
    <p class="meta" style="margin:8px 4px 0">Reihenfolge der Adressen = Reihenfolge der Räume (wie unter „Räume“).</p>`,
    `${l?`<button class="btn-text" data-act="kxLinieWeg" data-id="${esc(l.id)}" style="color:var(--err)">Löschen</button>`:""}<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="kxLinieOk">Speichern</button>`,{breit:true}); }
function kxLinieOk(){ const g=kxGebAkt(); if(!g||!KX_LDLG) return; const F=formVals(), m=String(F.kxLn||"").trim().replace(/\.$/,"").match(/^(\d{1,2})\.(\d{1,2})$/);
  if(!m||+m[1]>15||+m[2]>15){ toast("Linie wie in der ETS, z. B. 6.1"); return; }
  const R=kxRaeume(g).map(x=>x.r.id).filter(rid=>KX_LDLG.raeume.has(rid)), start=Math.max(0,Math.min(255,+F.kxLs||1));
  g.knx.linien.forEach(l=>{ if(l.id!==KX_LDLG.id) l.raeume=(l.raeume||[]).filter(rid=>!R.includes(rid)); });   /* ein Raum gehört zu einer Linie */
  let l=KX_LDLG.id&&kxLinie(g,KX_LDLG.id); if(!l){ l={id:uid()}; g.knx.linien.push(l); }
  Object.assign(l,{bereich:+m[1],linie:+m[2],start,raeume:R}); kxSpeichern(g); KX_LDLG=null; closeOverlays(); render(); toast(`Linie ${l.bereich}.${l.linie} gespeichert`); }
/* Adressen vergeben */
function kxAdrDlg(id){ const g=kxGebAkt(), l=g&&kxLinie(g,id); if(!l) return; const D=kxSort(g,g.knx.geraete.filter(d=>(l.raeume||[]).includes(d.raumId)&&kxTyp(d.typ).bus)), ohne=D.filter(d=>d.nr==null||d.nr===""), prog=D.filter(d=>d.prog&&d.nr!=null&&d.nr!=="");
  dialog(`Adressen Linie ${l.bereich}.${l.linie}`,`<p>${D.length} Geräte mit Busanschluss in ${(l.raeume||[]).length} Räumen, ${D.length-ohne.length} haben schon eine Adresse.</p>
    <p class="meta">Reihenfolge: Raum für Raum wie unter „Räume“, im Raum nach Geräteart (${esc(kxTypen().filter(t=>t.bus).slice(0,4).map(t=>t.name).join(", "))} …). Start bei ${l.bereich}.${l.linie}.${kxNull()&&l.start<10?"0"+l.start:l.start}.</p>
    ${prog.length?`<p class="meta" style="color:var(--err)">${prog.length} Geräte sind schon programmiert – „Alle neu“ würde deren Adresse ändern.</p>`:""}`,
    `<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button>${D.length-ohne.length?`<button class="btn-text" data-act="kxAdrOk" data-id="${esc(l.id)}" data-v="alle">Alle neu</button>`:""}<button class="btn-text" data-act="kxAdrOk" data-id="${esc(l.id)}" data-v="fehlend" ${ohne.length?"":"disabled"}>${D.length-ohne.length?`Fehlende vergeben (${ohne.length})`:"Vergeben"}</button>`,{breit:true}); }
function kxAdrOk(id,alle){ const g=kxGebAkt(), l=g&&kxLinie(g,id); if(!l) return; const D=kxSort(g,g.knx.geraete.filter(d=>(l.raeume||[]).includes(d.raumId)&&kxTyp(d.typ).bus));
  if(alle){ let n=l.start||1; D.forEach(d=>{ d.nr=n++; }); }
  else { const belegt=new Set(D.filter(d=>d.nr!=null&&d.nr!=="").map(d=>+d.nr)); let n=l.start||1; D.filter(d=>d.nr==null||d.nr==="").forEach(d=>{ while(belegt.has(n)) n++; d.nr=n; belegt.add(n); n++; }); }
  kxSpeichern(g); closeOverlays(); render(); toast(`Adressen für Linie ${l.bereich}.${l.linie} vergeben`); }
/* Etiketten einer Linie → CSV in die Cloud (Name mit Kunde und Linie), Raumthermostate usw. doppelt */
async function kxEtiketten(id){ const g=kxGebAkt(), l=g&&kxLinie(g,id); if(!l) return; const D=kxSort(g,g.knx.geraete.filter(d=>(l.raeume||[]).includes(d.raumId)&&kxTyp(d.typ).bus)).filter(d=>kxPA(g,d));
  if(!D.length){ toast("Erst Adressen vergeben"); return; } const Z=[]; D.forEach(d=>{ const pa=kxPA(g,d); for(let i=0;i<(+kxTyp(d.typ).eti||1);i++) Z.push(pa); });
  const o=ecOrt(g.ortId), name=bbFs(`KNX ${o.titel} Linie ${l.bereich}.${l.linie}`)+".csv", f=new File([ecCsv([["Physikalische Adresse"],...Z.map(x=>[x])])],name,{type:"text/csv"});
  toast("Etiketten-Liste wird abgelegt …"); if(typeof knxCloud==="function"&&await knxCloud(f,name)){ toast(`${Z.length} Etiketten · liegt in OneDrive › Kundendaten › Etiketten › ${name}`); return; }
  if(typeof knxAusgeben==="function") knxAusgeben([f],true); }
/* Gerät */
function kxGerDlg(id){ const g=kxGebAkt(), d=g&&g.knx.geraete.find(x=>x.id===id); if(!d) return; const t=kxTyp(d.typ), pa=kxPA(g,d), p=d.problem;
  const sw=(k,txt)=>`<button type="button" data-act="kxSt" data-id="${esc(d.id)}" data-k="${k}" data-dlg="1" aria-pressed="${!!d[k]}">${txt}${d[k]?`<small>${esc(kxDatum(d[k].at))}${d[k].von?" · "+esc(d[k].von):""}</small>`:""}</button>`;
  dialog(`${pa?pa+" · ":""}${t.name}`,`<p class="meta" style="margin:0 0 10px">${esc(kxRaumTitel(g,d.raumId))}${d.zustand?` · ${esc(d.zustand)}`:""}</p>
    <div class="lbl">Status</div><div class="knx-seg kx-dst">${t.bus?sw("prog",d.einb?"programmiert":"vorprogrammiert"):""}${sw("einb","eingebaut")}${sw("pruef","überprüft")}</div>
    <div class="lbl" style="margin-top:12px">Funktioniert es?</div><div class="knx-seg kx-prob-wahl">${[["","in Ordnung"],["problem","Problem"],["defekt","defekt"]].map(([v,tx])=>`<button type="button" data-act="kxProbWahl" data-v="${v}" aria-pressed="${(p?p.art:"")===v}">${tx}</button>`).join("")}</div>
    <div class="fg1" style="margin-top:10px">${tf("kxPn","Was ist los?",p&&p.notiz||"",{form:true,ph:"z. B. reagiert nicht, LED aus"})}</div>
    <div class="fg" style="margin-top:12px">${sf("kxZu","Zustand",d.zustand||"neu",[["neu","neu"],["vorhanden","vorhanden"],["ersetzt","ersetzt"]],{form:true})}${t.bus?tf("kxNr","Gerätenummer",d.nr!=null?String(d.nr):"",{form:true,im:"numeric",ph:"automatisch"}):""}</div>
    <div class="fg1" style="margin-top:12px">${tf("kxNo","Notiz",d.notiz||"",{form:true,ph:"z. B. hinter der Tür, ETS-Name"})}</div>`,
    `<button class="btn-text" data-act="kxGerWeg" data-id="${esc(d.id)}" style="color:var(--err)">Löschen</button><span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="kxGerOk" data-id="${esc(d.id)}">Speichern</button>`,{breit:true});
  KX_PROB=p?p.art:""; }
let KX_PROB="";
function kxGerOk(id){ const g=kxGebAkt(), d=g&&g.knx.geraete.find(x=>x.id===id); if(!d) return; const F=formVals();
  d.zustand=F.kxZu||d.zustand||"neu"; d.notiz=F.kxNo||""; if(F.kxNr!==undefined){ const n=String(F.kxNr).trim(); d.nr=n===""?null:Math.max(0,Math.min(255,+n||0)); }
  if(KX_PROB){ const alt=d.problem; d.problem={art:KX_PROB,notiz:F.kxPn||"",...(alt&&alt.art===KX_PROB&&alt.notiz===(F.kxPn||"")?{von:alt.von,at:alt.at}:kxWer())}; } else delete d.problem;
  kxSpeichern(g); closeOverlays(); render(); }
/* Gerätearten und Reihenfolge */
let KX_TDLG=null;
function kxTypenDlg(){ KX_TDLG=KX_TDLG||kxTypen().map(t=>({...t})); const L=KX_TDLG;
  dialog("Gerätearten",`<p class="meta" style="margin:0 0 10px">Die Reihenfolge bestimmt die Adressen im Raum: oben zuerst. Gilt für alle Projekte.</p>
    <div class="kx-tl">${L.map((t,i)=>`<div class="kx-tz"><span class="kx-tn"><b>${esc(t.name)}</b><small>${t.bus?`Busgerät · ${t.eti>1?"2 Etiketten":"1 Etikett"}`:"ohne Busanschluss"}</small></span>
      <button type="button" class="kx-tk" data-act="kxTBus" data-i="${i}" aria-pressed="${t.bus}" title="Busanschluss">Bus</button>${t.bus?`<button type="button" class="kx-tk" data-act="kxTEti" data-i="${i}" aria-pressed="${t.eti>1}" title="zwei Etiketten (z. B. Ober- und Unterteil)">2×</button>`:`<span class="kx-tk leer"></span>`}
      <button type="button" class="kx-tk" data-act="kxTAuf" data-i="${i}" ${i?"":"disabled"} aria-label="nach oben">↑</button><button type="button" class="kx-tk" data-act="kxTAb" data-i="${i}" ${i<L.length-1?"":"disabled"} aria-label="nach unten">↓</button></div>`).join("")}</div>
    <div class="fg1" style="margin-top:12px">${tf("kxTNeu","Neue Geräteart","",{form:true,ph:"z. B. Wetterstation"})}</div>`,
    `<button class="btn-text" data-act="kxTStd">Standard</button><span style="flex:1"></span><button class="btn-text" data-act="kxTAbbr">Abbrechen</button><button class="btn-text" data-act="kxTOk">Speichern</button>`,{breit:true}); }

/* ===== Programmieren zu zweit ===== */
const KX_PROG={rolle:"",g:"",sitz:null,timer:null,letzt:"",busy:false,fehler:""};
async function kxSitzOrdner(){ if(typeof SYNC_ON==="undefined"||!SYNC_ON||typeof ME==="undefined"||!ME.signedIn) throw new Error("ohne Anmeldung");
  if(!KX_PROG.fid){ if(typeof syncRoot==="function") await syncRoot(); KX_PROG.fid=await folderId(`${CONFIG.dataFolder}/knxsitzung`,BIB.gebaeude); } return KX_PROG.fid; }
const kxSitzName=gid=>encodeURIComponent(String(gid).replace(/[^\w-]/g,"_")+".json");
async function kxSitzLesen(gid){ const fid=await kxSitzOrdner(), r=await g(`/drives/${fid}:/${kxSitzName(gid)}?t=${Date.now()}`,{cache:"no-store"}); if(r.status===404) return null; if(!r.ok) throw new Error("Lesen "+r.status);
  const it=await r.json(); if(KX_PROG.etag&&it.eTag===KX_PROG.etag&&KX_PROG.sitzRoh) return KX_PROG.sitzRoh;   /* unverändert – nicht neu laden */
  const c=await readItem(it); try{ const s=JSON.parse(await c.text()); KX_PROG.etag=it.eTag; KX_PROG.sitzRoh=s; return s; }catch(e){ return null; } }
async function kxSitzSchreiben(gid,s){ s.seq=Date.now(); const fid=await kxSitzOrdner(), r=await g(`/drives/${fid}:/${kxSitzName(gid)}:/content`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(s)}); if(!r.ok) throw new Error("Schreiben "+r.status); KX_PROG.sitz=s; KX_PROG.sitzRoh=s; try{ KX_PROG.etag=(await r.json()).eTag; }catch(e){} return s; }
/* nächstes Gerät: in Adress-Reihenfolge, Busgerät mit Adresse, noch nicht programmiert, ohne Problem */
const kxNaechstes=(g,ab)=>{ const D=kxGeraete(g).filter(d=>kxTyp(d.typ).bus&&kxPA(g,d)&&!d.prog&&!d.problem); if(!ab) return D[0]; const i=D.findIndex(d=>d.id===ab); return D[i+1]||D.find(d=>d.id!==ab); };
function kxProgView(g){ kxPopupZu(); const R=KX_PROG.rolle&&KX_PROG.g===g.id?KX_PROG.rolle:"", s=KX_PROG.sitz&&KX_PROG.sitz.g===g.id?KX_PROG.sitz:null, D=kxGeraete(g).filter(d=>kxTyp(d.typ).bus&&kxPA(g,d)), offen=D.filter(d=>!d.prog);
  if(!R) return `<div class="narrow ec-spalte"><section class="card"><h3>Programmieren zu zweit</h3><p class="meta" style="margin:0 0 14px">Einer sitzt an der ETS, der andere drückt vor Ort die Programmiertasten. Beide öffnen hier dieses Projekt und wählen ihre Rolle.</p>
    <div class="kx-rollen"><button type="button" class="kx-rolle" data-act="kxRolle" data-v="ets">${icon("kxProg")}<b>Ich programmiere</b><span>am Laptop mit der ETS</span></button><button type="button" class="kx-rolle" data-act="kxRolle" data-v="taste">${icon("kxTipp")}<b>Ich drücke die Tasten</b><span>vor Ort am Gerät</span></button></div>
    <p class="meta" style="margin:14px 4px 0">${offen.length} von ${D.length} Geräten mit Adresse sind noch nicht programmiert.${D.length?"":" Erst unter „Übersicht“ Adressen vergeben."}</p></section></div>`;
  const kopf=`<div class="kx-pkopf"><span>${R==="ets"?"Du programmierst":"Du drückst die Tasten"}${KX_PROG.fehler?` · <b style="color:var(--err)">${esc(KX_PROG.fehler)}</b>`:""}</span><button type="button" class="btn-text" data-act="kxRolleEnde">Beenden</button></div>`;
  if(R==="taste"){ const d=s&&s.status==="angefordert"&&g.knx.geraete.find(x=>x.id===s.geraet);
    return `<div class="narrow ec-spalte">${kopf}<section class="card kx-warte">${d?kxTasteKarte(g,d,s):`<div class="kx-puls">${icon("kxTipp")}</div><h3>Warte auf das nächste Gerät …</h3><p class="meta">Sobald dein Kollege ein Gerät anfordert, erscheint es hier – auch wenn du in einem anderen Reiter bist.</p>`}</section></div>`; }
  /* ETS-Seite */
  const akt=s&&s.status!=="fertig"&&g.knx.geraete.find(x=>x.id===s.geraet), nx=akt?null:kxNaechstes(g,s&&s.geraet);
  let karte;
  if(akt&&s.status==="angefordert") karte=`<div class="kx-puls">${icon("kxTipp")}</div><h3>${esc(kxPA(g,akt))} angefordert</h3><p class="meta">${esc(kxTyp(akt.typ).name)} · ${esc(kxRaumTitel(g,akt.raumId))}<br>Warte, bis dein Kollege die Programmiertaste gedrückt hat …</p><div class="kx-knoepfe"><button type="button" class="btn-tonal" data-act="kxAbbr">Abbrechen</button></div>`;
  else if(akt&&s.status==="gedrueckt") karte=`<div class="kx-ok">${icon("kxProg")}</div><h3>Taste an ${esc(kxPA(g,akt))} gedrückt</h3><p class="meta">${esc(kxTyp(akt.typ).name)} · ${esc(kxRaumTitel(g,akt.raumId))} – jetzt in der ETS programmieren.</p><div class="kx-knoepfe"><button type="button" class="btn-tonal" data-act="kxProbl">Problem</button><button type="button" class="btn-filled" data-act="kxFertig">Programmiert – weiter</button></div>`;
  else if(akt&&s.status==="problem") karte=`<div class="kx-puls warn">${icon("warn")}</div><h3>${esc(kxPA(g,akt))}: Problem gemeldet</h3><p class="meta">${esc(s.notiz||"Dein Kollege findet das Gerät nicht oder es reagiert nicht.")}</p><div class="kx-knoepfe"><button type="button" class="btn-tonal" data-act="kxAnf" data-id="${esc(akt.id)}">Nochmal anfordern</button><button type="button" class="btn-filled" data-act="kxUeberspr">Überspringen</button></div>`;
  else karte=nx?`<h3>Nächstes Gerät</h3><div class="kx-next"><b>${esc(kxPA(g,nx))}</b><span>${esc(kxTyp(nx.typ).name)} · ${esc(kxRaumTitel(g,nx.raumId))}</span></div><div class="kx-knoepfe"><button type="button" class="btn-filled" data-act="kxAnf" data-id="${esc(nx.id)}">${icon("kxTipp")}Anfordern</button></div>`
    :`<h3>Alles programmiert</h3><p class="meta">${D.length?"Alle Geräte mit Adresse sind programmiert.":"Noch keine Geräte mit Adresse."}</p>`;
  const rest=offen.filter(d=>!akt||d.id!==akt.id);
  return `<div class="narrow ec-spalte">${kopf}<section class="card kx-warte">${karte}</section>
    ${rest.length?`<section class="card"><h3>Noch offen · ${rest.length}</h3>${ecListe(rest.slice(0,40).map(d=>ecLi({lead:`<b>${esc(kxPA(g,d))}</b>`,breit:true,kopf:esc(kxTyp(d.typ).name),text:esc(kxRaumTitel(g,d.raumId)+(d.problem?" · Problem":"")),act:"kxAnf",id:d.id,rechts:`<span class="kx-anf">Anfordern</span>`})))}</section>`:""}</div>`; }
function kxTasteKarte(g,d,s){ return `<div class="kx-gross"><small>Bitte Programmiertaste drücken</small><b>${esc(kxPA(g,d))}</b><span>${esc(kxTyp(d.typ).name)}</span><span class="kx-raum">${esc(kxRaumTitel(g,d.raumId))}${(()=>{ const x=kxRaumInfo(g,d.raumId); return x?` · ${esc(kxGruppe(x))}`:""; })()}</span></div>
  <div class="kx-knoepfe"><button type="button" class="btn-tonal" data-act="kxNichtGef">Problem</button><button type="button" class="btn-filled" data-act="kxGedrueckt">Gedrückt</button></div>${s.von?`<p class="meta" style="text-align:center;margin-top:10px">angefordert von ${esc(s.von)}</p>`:""}`; }
/* Abfrage alle 2 s, solange eine Rolle aktiv ist – auch außerhalb des Reiters (Helfer bekommt dann ein Fenster) */
function kxProgStart(rolle,gid){ KX_PROG.rolle=rolle; KX_PROG.g=gid; KX_PROG.fehler=""; clearInterval(KX_PROG.timer); KX_PROG.timer=setInterval(kxAbfrage,2000); kxAbfrage(); try{ navigator.wakeLock&&navigator.wakeLock.request("screen").then(w=>KX_PROG.wl=w).catch(()=>{}); }catch(e){} }
function kxProgEnde(){ clearInterval(KX_PROG.timer); KX_PROG.timer=null; KX_PROG.rolle=""; KX_PROG.sitz=null; try{ KX_PROG.wl&&KX_PROG.wl.release(); }catch(e){} kxPopupZu(); }
async function kxAbfrage(){ if(!KX_PROG.rolle||KX_PROG.busy) return; KX_PROG.busy=true;
  try{ const s=await kxSitzLesen(KX_PROG.g); KX_PROG.fehler=""; const sig=s?s.seq+"|"+s.status:"";
    if(sig!==KX_PROG.letzt){ KX_PROG.letzt=sig; KX_PROG.sitz=s;
      if(s&&KX_PROG.rolle==="taste"&&s.status==="angefordert"){ if(navigator.vibrate) try{ navigator.vibrate([200,100,200]); }catch(e){} }
      if(s&&KX_PROG.rolle==="ets"&&s.status==="gedrueckt"){ if(navigator.vibrate) try{ navigator.vibrate(120); }catch(e){} }
      kxAnzeigen(); } }
  catch(e){ const f=e.message==="ohne Anmeldung"?"nur mit Anmeldung und Internet":"keine Verbindung"; if(KX_PROG.fehler!==f){ KX_PROG.fehler=f; kxAnzeigen(); } }
  KX_PROG.busy=false; }
function kxAnzeigen(){ if(nav.v==="kx"&&nav.g===KX_PROG.g&&kxTab()==="prog"){ kxPopupZu(); render(); return; }
  /* Helfer außerhalb des Reiters: Fenster über allem */
  const s=KX_PROG.sitz, g=vtGeb(KX_PROG.g), d=g&&s&&s.status==="angefordert"&&KX_PROG.rolle==="taste"&&(kxNorm(g).geraete.find(x=>x.id===s.geraet));
  if(d) kxPopup(kxTasteKarte(g,d,s)); else kxPopupZu(); }
function kxPopup(html){ let el=document.getElementById("kxPop"); if(!el){ el=document.createElement("div"); el.id="kxPop"; el.innerHTML=`<div class="kx-pop-in"></div>`; document.body.appendChild(el); } el.querySelector(".kx-pop-in").innerHTML=html; }
function kxPopupZu(){ const el=document.getElementById("kxPop"); if(el) el.remove(); }
async function kxSetze(st,extra){ const s={...(KX_PROG.sitz||{}),...extra,status:st,g:KX_PROG.g,wer:(ME&&ME.name)||""}; try{ await kxSitzSchreiben(KX_PROG.g,s); KX_PROG.letzt=s.seq+"|"+s.status; }catch(e){ toast("Keine Verbindung – nochmal versuchen"); return false; } kxAnzeigen(); return true; }
async function kxAnfordern(g,d){ return kxSetze("angefordert",{geraet:d.id,pa:kxPA(g,d),typ:kxTyp(d.typ).name,raum:kxRaumTitel(g,d.raumId),von:(ME&&ME.name)||"",notiz:""}); }

/* ===== Klicks ===== */
document.addEventListener("click",async ev=>{ const b=ev.target.closest&&ev.target.closest('[data-act^="kx"]'); if(!b) return; const a=b.dataset.act; ev.stopPropagation();
  if(a==="kxAuf"){ closeOverlays(); go({v:"kx",g:b.dataset.g,tab:"ueb",...(nav.v==="kunde"||nav.v==="standort"?{von:{v:nav.v,id:nav.id}}:{})}); return; }
  if(a==="kxNeu"){ kxNeuDlg(); return; }
  if(a==="kxNeuHier"){ const s=b.dataset.kind==="standorte"&&standortOf(b.dataset.id), kid=s?s.kundeId:b.dataset.id; kxNeuDlg(kid,s?s.id:""); return; }
  if(a==="kxNeuOk"){ kxNeuOk(); return; }
  if(a==="kxTab"){ nav.tab=b.dataset.v; nav.raum=null; closeOverlays(); render(); scrollTo(0,0); return; }
  if(a==="kxRaumAuf"){ nav.raum=b.dataset.id; render(); scrollTo(0,0); return; }
  if(a==="kxRaumNeu"){ kxRaumNeuDlg(); return; }
  if(a==="kxRaumOk"){ kxRaumOk(); return; }
  if(a==="kxLinieNeu"){ kxLinieDlg(); return; }
  if(a==="kxLinie"){ kxLinieDlg(b.dataset.id); return; }
  if(a==="kxLRaum"){ const v=b.dataset.v; if(KX_LDLG.raeume.has(v)) KX_LDLG.raeume.delete(v); else KX_LDLG.raeume.add(v); b.setAttribute("aria-pressed",String(KX_LDLG.raeume.has(v))); return; }
  if(a==="kxLinieOk"){ kxLinieOk(); return; }
  if(a==="kxLinieWeg"){ const g=kxGebAkt(); if(!g) return; g.knx.linien=g.knx.linien.filter(l=>l.id!==b.dataset.id); kxSpeichern(g); closeOverlays(); render(); return; }
  if(a==="kxAdr"){ kxAdrDlg(b.dataset.id); return; }
  if(a==="kxAdrOk"){ kxAdrOk(b.dataset.id,b.dataset.v==="alle"); return; }
  if(a==="kxEti"){ kxEtiketten(b.dataset.id); return; }
  if(a==="kxZst"){ KX_ZUSTAND=b.dataset.v; b.parentElement.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x===b))); return; }
  if(a==="kxPlus"||a==="kxMinus"){ const g=kxGebAkt(); if(!g||!nav.raum) return; const t=b.dataset.v;
    if(a==="kxPlus") g.knx.geraete.push({id:uid(),raumId:nav.raum,typ:t,zustand:KX_ZUSTAND,created:Date.now()});
    else { const D=g.knx.geraete.filter(d=>d.raumId===nav.raum&&d.typ===t), weg=D.slice().reverse().find(d=>!d.prog&&!d.einb&&!d.pruef)||null; if(!weg){ toast("Nur noch bearbeitete Geräte – zum Löschen das Gerät antippen"); return; } g.knx.geraete=g.knx.geraete.filter(d=>d!==weg); }
    const y=scrollY; kxSpeichern(g); render(); scrollTo(0,y); return; }
  if(a==="kxSt"){ const g=kxGebAkt(); if(!g) return; const d=g.knx.geraete.find(x=>x.id===b.dataset.id), k=b.dataset.k; if(!d) return; if(d[k]) delete d[k]; else d[k]=kxWer();
    const y=scrollY; kxSpeichern(g); if(b.dataset.dlg){ b.setAttribute("aria-pressed",String(!!d[k])); if(k==="prog"||k==="einb"){ const pb=b.parentElement.querySelector('[data-k="prog"]'); if(pb) pb.firstChild.textContent=d.einb?"programmiert":"vorprogrammiert"; } render(); return; } render(); scrollTo(0,y); return; }
  if(a==="kxGer"){ kxGerDlg(b.dataset.id); return; }
  if(a==="kxGerOk"){ kxGerOk(b.dataset.id); return; }
  if(a==="kxGerWeg"){ const g=kxGebAkt(); if(!g) return; g.knx.geraete=g.knx.geraete.filter(d=>d.id!==b.dataset.id); kxSpeichern(g); closeOverlays(); render(); return; }
  if(a==="kxProbWahl"){ KX_PROB=b.dataset.v; b.parentElement.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x===b))); return; }
  if(a==="kxFilter"){ KX_FILTER=b.dataset.v; render(); return; }
  if(a==="kxTypen"){ KX_TDLG=null; kxTypenDlg(); return; }
  if(a==="kxTBus"||a==="kxTEti"||a==="kxTAuf"||a==="kxTAb"){ const i=+b.dataset.i, L=KX_TDLG; if(!L) return;
    if(a==="kxTBus") L[i].bus=!L[i].bus; if(a==="kxTEti") L[i].eti=L[i].eti>1?1:2;
    if(a==="kxTAuf"&&i>0) [L[i-1],L[i]]=[L[i],L[i-1]]; if(a==="kxTAb"&&i<L.length-1) [L[i+1],L[i]]=[L[i],L[i+1]];
    const n=document.getElementById("f_kxTNeu"), v=n?n.value:""; kxTypenDlg(); const n2=document.getElementById("f_kxTNeu"); if(n2&&v){ n2.value=v; n2.parentElement.classList.add("fl"); } return; }
  if(a==="kxTStd"){ KX_TDLG=KX_TYP_STD.map(t=>({...t})); kxTypenDlg(); return; }
  if(a==="kxTAbbr"){ KX_TDLG=null; closeOverlays(); return; }
  if(a==="kxTOk"){ const L=KX_TDLG||kxTypen(), n=(document.getElementById("f_kxTNeu")||{}).value; if(n&&n.trim()) L.push({id:"t-"+uid(),name:n.trim(),bus:true,eti:1}); kxTypenSpeichern(L.map(t=>({id:t.id,name:t.name,bus:!!t.bus,eti:+t.eti||1}))); KX_TDLG=null; closeOverlays(); render(); toast("Gerätearten gespeichert"); return; }
  /* Programmieren */
  if(a==="kxRolle"){ const g=kxGebAkt(); if(!g) return; kxProgStart(b.dataset.v,g.id); render(); return; }
  if(a==="kxRolleEnde"){ kxProgEnde(); render(); return; }
  if(a==="kxAnf"){ const g=kxGebAkt()||vtGeb(KX_PROG.g); if(!g) return; if(!KX_PROG.rolle) kxProgStart("ets",g.id); const d=kxNorm(g).geraete.find(x=>x.id===b.dataset.id); if(d) await kxAnfordern(g,d); return; }
  if(a==="kxAbbr"){ await kxSetze("fertig",{geraet:""}); return; }
  if(a==="kxGedrueckt"){ await kxSetze("gedrueckt",{}); toast("Gemeldet – dein Kollege programmiert jetzt"); return; }
  if(a==="kxNichtGef"){ await kxSetze("problem",{notiz:"Gerät nicht gefunden oder reagiert nicht"}); return; }
  if(a==="kxProbl"){ const g=vtGeb(KX_PROG.g), s=KX_PROG.sitz, d=g&&s&&kxNorm(g).geraete.find(x=>x.id===s.geraet); if(d){ d.problem={art:"problem",notiz:"beim Programmieren",...kxWer()}; kxSpeichern(g); } const nx=g&&kxNaechstes(g,s&&s.geraet); if(nx) await kxAnfordern(g,nx); else await kxSetze("fertig",{geraet:""}); return; }
  if(a==="kxFertig"||a==="kxUeberspr"){ const g=vtGeb(KX_PROG.g), s=KX_PROG.sitz, d=g&&s&&kxNorm(g).geraete.find(x=>x.id===s.geraet);
    if(d&&a==="kxFertig"){ d.prog=kxWer(); kxSpeichern(g); }
    const nx=g&&kxNaechstes(g,s&&s.geraet); if(nx) await kxAnfordern(g,nx); else await kxSetze("fertig",{geraet:""}); return; }
},true);
