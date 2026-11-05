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
  ecEtagen(g).forEach(e=>e.raeume.forEach((r,i)=>out.push({r,e,b:(r.bauteilId||e.bauteilId)&&B.find(x=>x.id===(r.bauteilId||e.bauteilId)),i})));
  return out.sort((x,y)=>{ const bx=x.b?B.indexOf(x.b):-1, by=y.b?B.indexOf(y.b):-1; return bx-by; }); }
const kxRaumInfo=(g,rid)=>kxRaeume(g).find(x=>x.r.id===rid);
const kxGruppe=x=>{ const z=x.r.bereichId&&(x.e.bereiche||[]).find(b=>b.id===x.r.bereichId); return [x.b&&(/^bauteil/i.test(x.b.name)?x.b.name:`Bauteil ${x.b.name}`),x.e.name,z&&z.name].filter(Boolean).join(" · "); };
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

/* ===== Testprojekt (nur Entwickler): Bürogebäude mit zwei Leveln – zum Ausprobieren von „Programmieren zu zweit“ =====
   Bauteil B, Level 3 (Linien 5.1–5.3) und Level 4 (6.1–6.3): links 7 Büros, Mitte WCs, Teeküche, Vorflur und Flur, rechts 7 Büros.
   Echte Datensätze (werden abgeglichen, damit Handy und iPad dasselbe Projekt sehen), Kunde „Testkunde KNX“ – darf gelöscht werden.
   Ist es schon da, setzt der Knopf alle Häkchen (programmiert, eingebaut, geprüft, Problem) zurück. */
const KX_TEST_K="test-knx-kunde";
const kxTestDa=()=>{ const k=DB.kunden&&DB.kunden.get(KX_TEST_K); return !!(k&&!k.deleted); };
function kxTestprojekt(){
  if(kxTestDa()){ const g=ecGeb("k:"+KX_TEST_K); kxNorm(g).geraete.forEach(d=>{ delete d.prog; delete d.einb; delete d.pruef; delete d.problem; }); kxSpeichern(g); toast("Testprojekt zurückgesetzt – alles wieder offen"); go({v:"kx",g:g.id,tab:"ueb"}); return; }
  saveRec("kunden",{id:KX_TEST_K,art:"gewerbe",name:"Testkunde KNX (Bürogebäude)",kdnr:"TEST-KNX",strasse:"Teststraße 1",plz:"51545",ort:"Waldbröl",notiz:"Testdaten zum Ausprobieren von „Programmieren zu zweit“ – darf gelöscht werden."},true);
  const g={id:ecGebId("k:"+KX_TEST_K),ortId:"k:"+KX_TEST_K}; let n=0; const id=x=>`tk-${x}`;
  g.bauteile=[{id:id("b"),name:"B"}];
  const geraete=[], linien=[], dev=(rid,typ)=>geraete.push({id:id("d"+(++n)),raumId:rid,typ,zustand:"neu",created:Date.now()+n});
  const buero=["jal","praes","tast","rtr","stell","motor"], wc=["praes","tast"], tee=["praes","tast","rtr","stell"];
  g.etagen=[[3,2,5],[4,3,6]].map(([lv,eb,ber])=>{ const e={id:id("e"+lv),name:`Level ${lv}`,ebene:eb,bauteilId:id("b"),raeume:[],bereiche:[{id:id(`z${lv}l`),name:"links"},{id:id(`z${lv}m`),name:"Mitte"},{id:id(`z${lv}r`),name:"rechts"}]};
    const raum=(nm,z,typen)=>{ const r={id:id(`r${lv}-${e.raeume.length+1}`),name:nm,bauteilId:id("b"),bereichId:id(`z${lv}${z}`)}; e.raeume.push(r); typen.forEach(t=>dev(r.id,t)); return r.id; };
    const L=[], M=[], R=[];
    for(let i=1;i<=7;i++) L.push(raum(`B ${lv}0${i} Büro`,"l",buero));
    M.push(raum(`B ${lv}08 WC Damen`,"m",wc),raum(`B ${lv}09 WC Herren`,"m",wc),raum(`B ${lv}10 Teeküche`,"m",tee),raum(`B ${lv}11 Vorflur`,"m",["praes"]),raum(`Flur Level ${lv}`,"m",["praes","praes","praes","tast","tast"]));
    for(let i=12;i<=18;i++) R.push(raum(`B ${lv}${i} Büro`,"r",buero));
    [[1,L],[2,M],[3,R]].forEach(([li,rs])=>linien.push({id:id(`l${ber}${li}`),bereich:ber,linie:li,start:1,raeume:rs}));
    return e; });
  ecGebNorm(g); g.knx={an:true,created:Date.now(),linien,geraete};
  /* Adressen je Linie Raum für Raum, nur Busgeräte */
  linien.forEach(l=>{ let nr=l.start; kxSort(g,geraete.filter(d=>l.raeume.includes(d.raumId)&&kxTyp(d.typ).bus)).forEach(d=>{ d.nr=nr++; }); });
  saveRec("gebaeude",g,true); toast("Testprojekt angelegt – auf dem Handy erscheint es nach dem Abgleich"); go({v:"kx",g:g.id,tab:"ueb"}); }
/* ===== Liste im Reiter „KNX“ ===== */
function kxListeInhalt(){ const q=(typeof query!=="undefined"?query:"").trim().toLowerCase(), P=kxProjekte().map(g=>({g,o:ecOrt(g.ortId)})).filter(({g,o})=>!q||suPasst(q,o.titel,(o.kunde||{}).kdnr)).sort((a,b)=>(b.g.knx.updated||b.g.updated||0)-(a.g.knx.updated||a.g.updated||0));
  if(!P.length) return q?`<p class="meta" style="margin:16px 4px">Kein KNX-Projekt gefunden.</p>`:`<div class="empty">${icon("knx")}<h2>Noch kein KNX-Projekt</h2><p>Mit „Projekt“ einen Kunden wählen – dann Räume anlegen, Geräte bei der Begehung zählen, Adressen vergeben und zu zweit programmieren.</p></div>`;
  return listOf(P.map(({g,o})=>{ const G=g.knx.geraete||[], bus=G.filter(d=>kxTyp(d.typ).bus), p=bus.filter(d=>d.prog).length, def=G.filter(d=>d.problem).length, R=kxRaeume(g).length;
    return `<div class="li" role="button" tabindex="0" data-act="kxAuf" data-g="${esc(g.id)}"><span class="av">${icon("knx")}</span><span class="lt"><span class="h">${esc(o.titel)}</span>
      <span class="s">${esc([`${R} Räume`,`${G.length} Geräte`,bus.length?`${p} von ${bus.length} programmiert`:""].filter(Boolean).join(" · "))}</span>
      <span class="st">${def?pill("bad",`${def} defekt`):bus.length&&p===bus.length&&G.every(kxFertig)?pill("ok","fertig"):pill("wip","in Arbeit")}</span></span>${icon("chev")}</div>`; })); }
function knxView(){ return `<div class="narrow">${searchBar("Kunde, Ort",null)}<div id="res">${kxListeInhalt()}</div>
  <div class="sec-lbl" style="margin-top:24px">Ohne Projekt</div>${listOf([...(typeof istEntwickler==="function"&&istEntwickler()?[`<div class="li" role="button" tabindex="0" data-act="kxTest"><span class="av">${icon("knx")}</span><span class="lt"><span class="h">${kxTestDa()?"Testprojekt zurücksetzen":"Testprojekt anlegen"}</span><span class="s">Bürogebäude, Bauteil B, Level 3 und 4 · Linien 5.1–5.3 und 6.1–6.3 · nur für Entwickler sichtbar</span></span>${icon("chev")}</div>`]:[]),`<div class="li" role="button" tabindex="0" data-act="knxEti"><span class="av">${icon("tag")}</span><span class="lt"><span class="h">Etiketten für eine Linie</span><span class="s">Adressbereich von Hand, z. B. 6.1.01 bis 6.1.36 – für den Brother, 6 mm</span></span>${icon("chev")}</div>`])}</div>`; }
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
      return ecLi({lead:typeof raIcon==="function"?raIcon(raVon(g,r,kxRaumInfo(g,r.id).e)):icon("kxRaum"),ton:p?"bad":D.length&&!off?"ok":"",kopf:esc(r.name),text:esc([D.length?`${D.length} Geräte`:"noch nichts erfasst",D.length?(off?`${off} offen`:"alles fertig"):"",p?`${p} mit Problem`:"",l?`Linie ${l.bereich}.${l.linie}`:""].filter(Boolean).join(" · ")),act:"kxRaumAuf",id:r.id}); }))}`).join("")}</div>`; }
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
/* Räume anlegen: gemeinsamer Dialog in gebaeude-verw.js (gvRaumNeuDlg) */
let KX_LDLG=null;
function kxLinieDlg(id){ const g=kxGebAkt(); if(!g) return; const l=id&&kxLinie(g,id), R=kxRaeume(g);
  KX_LDLG={id:l?l.id:"",raeume:new Set(l?l.raeume:[])};
  const andere=rid=>{ const x=kxLinieVonRaum(g,rid); return x&&(!l||x.id!==l.id)?x:null; };
  dialog(l?`Linie ${l.bereich}.${l.linie}`:"Neue Linie",`<div class="knx-felder" style="grid-template-columns:1fr 1fr">${tf("kxLn","Linie",l?`${l.bereich}.${l.linie}`:"",{form:true,ph:"z. B. 6.1",im:"decimal"})}${tf("kxLs","Erste Gerätenummer",String(l&&l.start||1),{form:true,im:"numeric"})}</div>
    ${(()=>{ const Z=[], mehrB=(g.bauteile||[]).length>1; ecEtagen(g).forEach(e=>(e.bereiche||[]).forEach(z=>{ const ids=e.raeume.filter(r=>r.bereichId===z.id).map(r=>r.id); if(!ids.length) return; const b=mehrB&&e.bauteilId&&g.bauteile.find(x=>x.id===e.bauteilId); Z.push({z,e,ids,t:[b&&(b.kurz||String(b.name).replace(/^bauteil\s*/i,"")),e.name,z.name].filter(Boolean).join(" · ")}); }));
      return Z.length?`<div class="lbl" style="margin-top:12px">Bereich übernehmen</div><div class="kx-zonen">${Z.map(x=>`<button type="button" class="kx-zon" data-act="kxLZone" data-v="${esc(x.ids.join(","))}" aria-pressed="${x.ids.every(i=>KX_LDLG.raeume.has(i))}"><b>${esc(x.t)}</b><small>${x.ids.length} Räume</small></button>`).join("")}</div>`:""; })()}
    <div class="lbl" style="margin-top:12px">Räume dieser Linie</div>${R.length?`<div class="kx-rwahl">${R.map(x=>{ const a=andere(x.r.id), z=typeof gvNr==="function"?gvNr(x.r.name):{nr:x.r.name,txt:""}; return `<button type="button" class="kx-rw${a?" fremd":""}" data-act="kxLRaum" data-v="${esc(x.r.id)}" aria-pressed="${KX_LDLG.raeume.has(x.r.id)}" title="${esc(x.r.name)}"><b>${esc(z.nr||z.txt)}</b>${a?`<small>${esc(a.bereich+"."+a.linie)}</small>`:z.nr&&z.txt?`<small>${esc(z.txt)}</small>`:""}</button>`; }).join("")}</div>`:`<p class="meta">Erst Räume anlegen.</p>`}
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

/* ===== Programmieren zu zweit (05.11.2026, Version 2) =====
   Einer an der ETS (iPad/Laptop = Kommandozentrale), ein oder mehrere Helfer vor Ort (Handy), jeder mit eigener Zone (Linie).
   Koppeln über 4-stelligen Code oder QR (…#kxk=<Projekt>.<Code>). Gerät = eigene Geräte-ID, auch bei gleichem Konto.
   Dateien in der Firmen-Cloud …/knxsitzung/:
     <Projekt>.json          – schreibt nur die ETS: Code, Anforderungen je Helfer, Timer, Stand
     <Projekt>~h~<Gerät>.json – schreibt nur der Helfer: Code, Zone, Antwort (gedrückt/Problem), Lebenszeichen
   Beide fragen jede Sekunde nach (Lebenszeichen alle 10 s). */
const KX_PROG={rolle:"",g:"",sitz:null,helfer:{},timer:null,letzt:"",busy:false,fehler:"",lokal:{},join:{code:"",zone:""},ton:null,herz:0,autoT:null,fertigAuto:{}};
const KX_DEV=(()=>{ try{ let d=localStorage.getItem("kx-geraet"); if(!d){ d=Math.random().toString(36).slice(2,10); localStorage.setItem("kx-geraet",d); } return d; }catch(e){ return "g"+Math.random().toString(36).slice(2,8); } })();
const kxGeraetName=()=>{ const u=navigator.userAgent; return /iPhone/.test(u)?"iPhone":/iPad/.test(u)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1)?"iPad":/Android/.test(u)?"Android":"PC"; };
const kxIch=()=>(typeof ME!=="undefined"&&(ME.name||ME.mail))||"Ich";
const kxKurz=n=>String(n||"?").split(/[\s.]+/).filter(Boolean).slice(0,2).map(x=>x[0].toUpperCase()).join("");
const kxLName=l=>l?`Linie ${l.bereich}.${l.linie}`:"Alle Linien";
async function kxSitzOrdner(){ if(typeof SYNC_ON==="undefined"||!SYNC_ON||typeof ME==="undefined"||!ME.signedIn) throw new Error("ohne Anmeldung");
  if(!KX_PROG.fid){ if(typeof syncRoot==="function") await syncRoot(); KX_PROG.fid=await folderId(`${CONFIG.dataFolder}/knxsitzung`,BIB.gebaeude); } return KX_PROG.fid; }
const kxBasis=gid=>String(gid).replace(/[^\w-]/g,"_");
const kxSitzName=gid=>encodeURIComponent(kxBasis(gid)+".json");
const kxHelfName=(gid,dev)=>encodeURIComponent(kxBasis(gid)+"~h~"+dev+".json");
async function kxSitzLesen(gid){ const fid=await kxSitzOrdner(), r=await g(`/drives/${fid}:/${kxSitzName(gid)}?t=${Date.now()}`,{cache:"no-store"}); if(r.status===404) return null; if(!r.ok) throw new Error("Lesen "+r.status);
  const it=await r.json(); if(KX_PROG.etag&&it.eTag===KX_PROG.etag&&KX_PROG.sitzRoh) return KX_PROG.sitzRoh;
  const c=await readItem(it); try{ const s=JSON.parse(await c.text()); KX_PROG.etag=it.eTag; KX_PROG.sitzRoh=s; return s; }catch(e){ return null; } }
async function kxDateiSchreiben(name,obj){ const fid=await kxSitzOrdner(), r=await g(`/drives/${fid}:/${name}:/content`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(obj)}); if(!r.ok) throw new Error("Schreiben "+r.status); try{ return (await r.json()).eTag; }catch(e){ return ""; } }
async function kxSitzSchreiben(gid,s){ s.seq=Date.now(); s.ets={dev:KX_DEV,wer:kxIch(),at:Date.now()}; s.stand=kxStand(vtGeb(gid)); const e=await kxDateiSchreiben(kxSitzName(gid),s); KX_PROG.sitz=s; KX_PROG.sitzRoh=s; KX_PROG.etag=e; KX_PROG.herz=Date.now(); return s; }
async function kxHelfSchreiben(){ const j=KX_PROG.join, h={v:2,g:KX_PROG.g,dev:KX_DEV,wer:kxIch(),geraet:kxGeraetName(),code:j.code,zone:j.zone,at:Date.now(),antwort:KX_PROG.antwort||null};
  await kxDateiSchreiben(kxHelfName(KX_PROG.g,KX_DEV),h); KX_PROG.herz=Date.now(); }
/* Helfer-Dateien (nur ETS): Ordner auflisten, nur geänderte nachladen */
async function kxHelferLesen(gid){ const fid=await kxSitzOrdner(), r=await g(`/drives/${fid}/children?$top=200&t=${Date.now()}`,{cache:"no-store"}); if(!r.ok) throw new Error("Lesen "+r.status);
  const vor=kxBasis(gid)+"~h~", L=((await r.json()).value||[]).filter(it=>it.name&&it.name.startsWith(vor)), neu={};
  for(const it of L){ const alt=KX_PROG.helfer[it.name]; if(alt&&alt.etag===it.eTag){ neu[it.name]=alt; continue; }
    try{ const h=JSON.parse(await (await readItem(it)).text()); neu[it.name]={...h,etag:it.eTag,name:it.name}; }catch(e){} }
  KX_PROG.helfer=neu; return neu; }
async function kxDateiWeg(name){ try{ const fid=await kxSitzOrdner(); await g(`/drives/${fid}:/${name}`,{method:"DELETE"}); }catch(e){} }
/* ---- Zonen, nächstes Gerät, Stand ---- */
const kxZoneVon=(g,d)=>{ const l=kxLinieVonRaum(g,d.raumId); return l?l.id:""; };
const kxAktiveIds=()=>{ const A=(KX_PROG.sitz&&KX_PROG.sitz.auf)||{}; return new Set(Object.values(A).filter(a=>a&&(a.status==="angefordert"||a.status==="laeuft")).map(a=>a.geraet)); };
const kxOffen=g=>kxGeraete(g).filter(d=>kxTyp(d.typ).bus&&kxPA(g,d)&&!d.prog&&!d.problem);
function kxNaechstesZone(g,zone,ohne){ const bes=kxAktiveIds(); return kxOffen(g).find(d=>!bes.has(d.id)&&d.id!==ohne&&(!zone||kxZoneVon(g,d)===zone)); }
function kxStand(g){ if(!g) return null; const D=kxGeraete(g).filter(d=>kxTyp(d.typ).bus&&kxPA(g,d)), z={};
  D.forEach(d=>{ const k=kxZoneVon(g,d)||"-"; z[k]=z[k]||[0,0]; z[k][1]++; if(d.prog) z[k][0]++; }); return {n:D.filter(d=>d.prog).length,m:D.length,zonen:z}; }
const kxFrisch=at=>at&&Date.now()-at<30000;
/* Helfer, die mit dem aktuellen Code verbunden sind */
const kxVerbunden=()=>{ const s=KX_PROG.sitz; if(!s||!s.code) return []; return Object.values(KX_PROG.helfer).filter(h=>h.code===s.code).sort((a,b)=>String(a.wer).localeCompare(String(b.wer))||String(a.dev).localeCompare(String(b.dev))); };
/* Zustand einer Anforderung aus ETS-Sicht (Antwort des Helfers eingerechnet) */
function kxZustand(a,h){ if(!a) return "frei"; if(a.status==="laeuft"||a.status==="fertig"||a.status==="abgebrochen") return a.status;
  const an=h&&h.antwort&&h.antwort.id===a.id?h.antwort.status:""; return an==="gedrueckt"?"gedrueckt":an==="problem"?"problem":"angefordert"; }
/* ---- Bausteine ---- */
const kxSvgP=(k,cls)=>`<svg class="${cls||""}" viewBox="0 0 24 24" aria-hidden="true"><path d="${IC[k]}"/></svg>`;
Object.assign(IC,{kxLap:"M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z",kxHand:"M15.5 1h-8C6.12 1 5 2.12 5 3.5v17C5 21.88 6.12 23 7.5 23h8c1.38 0 2.5-1.12 2.5-2.5v-17C18 2.12 16.88 1 15.5 1zm-4 21c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.5-4H7V4h9v14z"});
const kxVerb=(an,txt)=>`<span class="kxz-verb${an?" an":""}">${kxSvgP("kxLap")}<span class="kxz-leit"><i></i></span>${kxSvgP("kxHand")}${txt?`<span>${esc(txt)}</span>`:""}</span>`;
const kxSchritte=n=>`<div class="kxz-schr">${["Angefordert","Taste gedrückt","Programmiert"].map((t,i)=>`<span class="${i<n?"fe":i===n?"an":""}"><i></i>${t}</span>`).join("<em></em>")}</div>`;
const kxRing=(id,gr,txt)=>{ const r=gr==="k"?31:88, w=gr==="k"?9:14, v=gr==="k"?76:200, u=(2*Math.PI*r).toFixed(1);
  return `<div class="kxz-ring ${gr==="k"?"k":""}" ${id?`data-kxuhr="${esc(id)}"`:""}><svg viewBox="0 0 ${v} ${v}"><circle cx="${v/2}" cy="${v/2}" r="${r}" fill="none" stroke-width="${w}" class="hg"/><circle cx="${v/2}" cy="${v/2}" r="${r}" fill="none" stroke-width="${w}" stroke-linecap="round" class="vg" stroke-dasharray="${u}" stroke-dashoffset="0"/></svg><div class="z"><b>–</b>${txt?`<small>${esc(txt)}</small>`:""}</div></div>`; };
const kxMini=(n,m)=>{ const r=31,u=2*Math.PI*r, a=m?n/m:0; return `<div class="kxz-ring k"><svg viewBox="0 0 76 76"><circle cx="38" cy="38" r="${r}" fill="none" stroke-width="9" class="hg"/><circle cx="38" cy="38" r="${r}" fill="none" stroke-width="9" stroke-linecap="round" class="ok" stroke-dasharray="${(u*a).toFixed(1)} ${u.toFixed(1)}"/></svg><div class="z"><b>${n}/${m}</b></div></div>`; };
const kxPuls=(klein,grau)=>`<div class="kxz-puls${klein?" k":""}${grau?" grau":""}">${icon("kxTipp")}</div>`;
function kxQrSvg(text){ try{ const q=qrcode(0,"M"); q.addData(text); q.make(); const n=q.getModuleCount(); let d=""; for(let y=0;y<n;y++) for(let x=0;x<n;x++) if(q.isDark(y,x)) d+=`M${x+2} ${y+2}h1v1h-1z`; return `<svg viewBox="0 0 ${n+4} ${n+4}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#111"/></svg>`; }catch(e){ return ""; } }
const kxLink=(gid,code)=>`${location.origin}${location.pathname}#kxk=${kxBasis(gid)}.${code}`;
/* ---- Ansicht ---- */
function kxProgView(g){ kxPopupZu(); const R=KX_PROG.rolle&&KX_PROG.g===g.id?KX_PROG.rolle:"";
  const D=kxGeraete(g).filter(d=>kxTyp(d.typ).bus&&kxPA(g,d)), offen=D.filter(d=>!d.prog);
  if(!R) return `<div class="narrow ec-spalte"><section class="card"><h3>Programmieren zu zweit</h3><p class="meta" style="margin:0 0 14px">Einer sitzt an der ETS, die anderen drücken vor Ort die Programmiertasten – jeder in seiner Zone. Das ETS-Gerät zeigt einen Code, die Helfer verbinden sich damit.</p>
    <div class="kx-rollen"><button type="button" class="kx-rolle" data-act="kxRolle" data-v="ets">${icon("kxProg")}<b>Ich programmiere</b><span>an der ETS – Kommandozentrale</span></button><button type="button" class="kx-rolle" data-act="kxRolle" data-v="taste">${icon("kxTipp")}<b>Ich drücke die Tasten</b><span>vor Ort, mit dem Handy</span></button></div>
    <p class="meta" style="margin:14px 4px 0">${offen.length} von ${D.length} Geräten mit Adresse sind noch nicht programmiert.${D.length?"":" Erst unter „Übersicht“ Linien anlegen und Adressen vergeben."}</p></section></div>`;
  return R==="ets"?kxEtsView(g,D):kxHelferView(g); }
function kxEtsView(g,D){ const s=KX_PROG.sitz, H=kxVerbunden(), fr=H.filter(h=>kxFrisch(h.at)), L=kxNorm(g).linien, st=kxStand(g)||{n:0,m:0,zonen:{}};
  const kopf=`<div class="kxz-kopf"><div><b>Du programmierst</b><small>${KX_PROG.fehler?`<span style="color:var(--err)">${esc(KX_PROG.fehler)}</span>`:`${fr.length} ${fr.length===1?"Helfer":"Helfer"} verbunden`}</small></div>${kxVerb(fr.length>0,"")}<button type="button" class="btn-text" data-act="kxRolleEnde">Beenden</button></div>`;
  if(!s) return `<div class="narrow ec-spalte">${kopf}<section class="card kx-warte">${kxPuls(true,true)}<h3>Sitzung wird angelegt …</h3></section></div>`;
  const code=s.code||"", link=kxLink(g.id,code), viel=!fr.length||KX_PROG.codeAuf;
  const koppel=viel?`<section class="card kxz-koppel"><div class="kxz-qr">${kxQrSvg(link)}</div><div><h3>Helfer verbinden</h3><p class="meta">Mit dem Scanner der App den QR scannen – oder im Projekt „Ich drücke die Tasten“ und den Code eingeben</p><div class="kxz-ziff">${[...code].map(z=>`<span>${z}</span>`).join("")}</div>${fr.length?`<button type="button" class="btn-text" data-act="kxCodeZu">Ausblenden</button>`:""}</div></section>`
    :`<button type="button" class="kxz-codezeile" data-act="kxCodeAuf">${icon("scQr")}<span>Code <b>${esc(code)}</b> · weitere Helfer verbinden</span>${icon("chev")}</button>`;
  const karten=H.map(h=>kxEtsHelferKarte(g,h)).join("");
  const freieZonen=L.filter(l=>!fr.some(h=>h.zone===l.id)&&!fr.some(h=>!h.zone));
  const zonenStand=L.map(l=>{ const z=st.zonen[l.id]||[0,0], h=fr.find(x=>x.zone===l.id); return `<div class="kxz-bar"><span>${esc(kxLName(l))}${h?` · ${esc(h.wer)}`:fr.some(x=>!x.zone)?"":" · frei"}</span><i><b style="width:${z[1]?Math.round(z[0]/z[1]*100):0}%"></b></i><em>${z[0]}/${z[1]}</em></div>`; }).join("");
  const dauer=s.dauer||20;
  const einst=`<div class="kxz-einst"><span>Timer</span>${[10,20,30,45].map(t=>`<button type="button" class="kxz-chip" data-act="kxDauer" data-v="${t}" aria-pressed="${t===dauer}">${t} s</button>`).join("")}<button type="button" class="kxz-chip" data-act="kxAuto" aria-pressed="${s.auto!==false}">Automatisch weiter</button></div>`;
  return `<div class="narrow ec-spalte">${kopf}${koppel}${karten||`<section class="card kx-warte">${kxPuls(true,true)}<h3>Noch kein Helfer verbunden</h3><p class="meta">Sobald sich jemand mit dem Code verbindet, erscheint er hier mit seiner Zone.</p></section>`}
    ${freieZonen.length&&fr.length?`<p class="meta" style="margin:0 6px 12px">Ohne Helfer: ${freieZonen.map(l=>esc(kxLName(l))).join(" · ")}</p>`:""}
    <section class="card"><div class="kxz-fort">${kxMini(st.n,st.m)}<div><h3>${st.n} von ${st.m} programmiert</h3><p class="meta">${st.m-st.n} offen</p></div></div>${zonenStand?`<div class="kxz-bars">${zonenStand}</div>`:""}${einst}</section>
    ${(()=>{ const bes=kxAktiveIds(), R=kxOffen(g).filter(d=>!bes.has(d.id)); return R.length?`<section class="card"><h3>Noch offen · ${R.length}</h3>${ecListe(R.slice(0,40).map(d=>{ const l=kxLinieVonRaum(g,d.raumId); return ecLi({lead:`<b>${esc(kxPA(g,d))}</b>`,breit:true,kopf:esc(kxTyp(d.typ).name),text:esc(kxRaumTitel(g,d.raumId)+(l?" · "+kxLName(l):"")),act:"kxAnf",id:d.id,rechts:`<span class="kx-anf">Anfordern</span>`}); }))}</section>`:""; })()}</div>`; }
function kxEtsHelferKarte(g,h){ const s=KX_PROG.sitz, a=s.auf&&s.auf[h.dev], z=kxZustand(a,h), l=kxNorm(g).linien.find(x=>x.id===h.zone), frisch=kxFrisch(h.at);
  const kopf=`<div class="kxz-helf"><span class="kxz-av${frisch?" ok":""}">${esc(kxKurz(h.wer))}</span><div><b>${esc(h.wer||"Helfer")}</b><small>${frisch?"verbunden":"keine Verbindung"} · ${esc(h.geraet||"")}</small></div><span class="kxz-zone">${esc(kxLName(l))}</span></div>`;
  const d=a&&kxNorm(g).geraete.find(x=>x.id===a.geraet), was=a?`${esc(a.typ||"")} · ${esc(a.raum||"")}`:"";
  let inhalt="";
  if(z==="angefordert") inhalt=`${kxSchritte(0)}<div class="kxz-mitte">${kxPuls(true)}<h3>${esc(a.pa)} bei ${esc(h.wer)} angefordert</h3><p class="meta">${was}<br>Warte, bis die Programmiertaste gedrückt ist …</p></div><div class="kx-knoepfe"><button type="button" class="btn-tonal" data-act="kxAbbr" data-h="${esc(h.dev)}">Abbrechen</button></div>`;
  else if(z==="gedrueckt") inhalt=`${kxSchritte(1)}<div class="kxz-mitte"><div class="kxz-ok">${icon("kxTipp")}</div><h3>Taste an ${esc(a.pa)} gedrückt</h3><p class="meta">${was} – ETS jetzt starten</p></div><div class="kx-knoepfe"><button type="button" class="btn-tonal" data-act="kxUeberspr" data-h="${esc(h.dev)}">Problem</button><button type="button" class="btn-filled" data-act="kxStart" data-h="${esc(h.dev)}">Programmierung starten</button></div>`;
  else if(z==="laeuft") inhalt=`${kxSchritte(2)}<div class="kxz-mitte">${kxRing(h.dev+"|"+a.id,"g",`von 0:${String(a.dauer||20).padStart(2,"0")}`)}<h3>${esc(a.pa)} wird programmiert</h3><p class="meta">${was}</p></div><div class="kx-knoepfe"><button type="button" class="btn-tonal" data-act="kxPlus10" data-h="${esc(h.dev)}">+10 s</button><button type="button" class="btn-tonal" data-act="kxUeberspr" data-h="${esc(h.dev)}">Problem</button><button type="button" class="btn-filled" data-act="kxFertig" data-h="${esc(h.dev)}">Fertig</button></div>`;
  else if(z==="problem") inhalt=`<div class="kxz-mitte"><div class="kxz-puls k warn">${icon("warn")}</div><h3>${esc(a.pa)}: Problem gemeldet</h3><p class="meta">${esc((h.antwort&&h.antwort.notiz)||"Gerät nicht gefunden oder reagiert nicht")}</p></div><div class="kx-knoepfe"><button type="button" class="btn-tonal" data-act="kxNochmal" data-h="${esc(h.dev)}">Nochmal anfordern</button><button type="button" class="btn-filled" data-act="kxUeberspr" data-h="${esc(h.dev)}">Überspringen</button></div>`;
  else { const nx=kxNaechstesZone(g,h.zone), fertig=z==="fertig"&&a&&Date.now()-(a.ende||0)<6000;
    inhalt=`${fertig?`<div class="kxz-erfolg"><span class="pk"></span><span>${esc(a.pa)} programmiert</span><button type="button" class="btn-text" data-act="kxRueck" data-h="${esc(h.dev)}">Rückgängig</button></div>`:""}
      ${nx?`<div class="kxz-next"><b>${esc(kxPA(g,nx))}</b><span>${esc(kxTyp(nx.typ).name)} · ${esc(kxRaumTitel(g,nx.raumId))}</span></div><div class="kx-knoepfe"><button type="button" class="btn-filled" data-act="kxAnfH" data-h="${esc(h.dev)}" data-id="${esc(nx.id)}">${icon("kxTipp")}Anfordern</button></div>`
        :`<p class="meta" style="margin:10px 2px 0">In dieser Zone ist nichts mehr offen.</p>`}`; }
  return `<section class="card kxz-karte${z==="laeuft"?" laeuft":""}">${kopf}${inhalt}</section>`; }
function kxHelferView(g){ const s=KX_PROG.sitz, j=KX_PROG.join, L=kxNorm(g).linien;
  const ok=s&&s.code&&j.verbunden&&s.code===j.code&&kxFrisch(s.ets&&s.ets.at);
  const l=L.find(x=>x.id===j.zone);
  if(!j.verbunden) return `<div class="narrow ec-spalte"><section class="card"><h3>Mit ETS verbinden</h3><p class="meta" style="margin:0 0 12px">Code vom ETS-Gerät eingeben – oder mit dem Scanner der App den QR-Code scannen</p>
    <input id="kxCode" class="kxz-codein" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="––––" value="${esc(j.code||"")}">
    <div class="kx-knoepfe"><button type="button" class="btn-tonal" data-act="kxScan">${icon("scQr")}QR scannen</button></div>
    <h3 style="margin-top:18px">Deine Zone</h3><p class="meta" style="margin:0 0 10px">Du bekommst nur Geräte aus dieser Zone</p>
    <div class="kxz-chips">${[...L.map(x=>[x.id,kxLName(x)]),["","Alle"]].map(([id,t])=>`<button type="button" class="kxz-chip gross" data-act="kxZone" data-v="${esc(id)}" aria-pressed="${(j.zone||"")===id}">${esc(t)}</button>`).join("")}</div>
    ${KX_PROG.fehler?`<p class="meta" style="color:var(--err);margin-top:12px">${esc(KX_PROG.fehler)}</p>`:""}
    <div class="kx-knoepfe" style="margin-top:16px"><button type="button" class="btn-tonal" data-act="kxRolleEnde">Zurück</button><button type="button" class="btn-filled" data-act="kxVerbinden">Verbinden</button></div></section></div>`;
  const kopf=`<div class="kxz-kopf"><div><b>${esc(kxLName(l))}</b><small>${ok?`verbunden mit ${esc(s.ets.wer||"ETS")}`:j.code&&s&&s.code&&s.code!==j.code?"Code passt nicht mehr – neu verbinden":"warte auf das ETS-Gerät …"}</small></div>${kxVerb(ok,"")}<button type="button" class="btn-text" data-act="kxRolleEnde">Beenden</button></div>`;
  return `<div class="narrow ec-spalte">${kopf}${kxHelferInhalt(g,s,ok)}</div>`; }
function kxHelferInhalt(g,s,ok){ const a=s&&s.auf&&s.auf[KX_DEV], an=KX_PROG.antwort, z=!a?"frei":a.status==="laeuft"||a.status==="fertig"||a.status==="abgebrochen"?a.status:an&&an.id===a.id?(an.status==="problem"?"problem":"gedrueckt"):"angefordert";
  const zst=s&&s.stand&&s.stand.zonen&&s.stand.zonen[KX_PROG.join.zone||"-"], st=KX_PROG.join.zone?zst:s&&s.stand?[s.stand.n,s.stand.m]:null;
  const fort=st?`<section class="card"><div class="kxz-fort">${kxMini(st[0],st[1])}<div><h3>${KX_PROG.join.zone?"Deine Zone":"Alle Zonen"}</h3><p class="meta">${st[1]-st[0]} ${st[1]-st[0]===1?"Gerät":"Geräte"} offen</p></div></div></section>`:"";
  if(ok&&z==="angefordert") return `<section class="card kxz-helfer">${kxSchritte(0)}${kxTasteKarte(g,a)}</section>`;
  if(ok&&z==="gedrueckt") return `<section class="card kxz-helfer">${kxSchritte(1)}<div class="kxz-mitte"><div class="kxz-ok">${icon("kxTipp")}</div><div class="kxz-pa">${esc(a.pa)}</div><h3>Gemeldet</h3><p class="meta">Warte, bis die ETS startet – nichts anderes drücken</p></div></section>${fort}`;
  if(ok&&z==="laeuft") return `<section class="card kxz-helfer">${kxSchritte(2)}<div class="kxz-mitte">${kxRing("ich|"+a.id,"g","wird programmiert")}<div class="kxz-pa m">${esc(a.pa)}</div><p class="kxz-typ">${esc(a.typ||"")}</p><p class="meta">${esc(a.raum||"")}</p></div><div class="kxz-hinweis">${icon("warn")}<span>Keine weitere Programmiertaste im Raum drücken, bis der Ring durch ist</span></div></section>`;
  if(ok&&z==="problem") return `<section class="card kxz-helfer"><div class="kxz-mitte"><div class="kxz-puls k warn">${icon("warn")}</div><h3>Problem gemeldet</h3><p class="meta">${esc(a.pa)} · warte, was die ETS entscheidet</p></div></section>${fort}`;
  const fertig=ok&&z==="fertig"&&a&&Date.now()-(a.ende||0)<6000, nx=s&&s.vorschau&&s.vorschau[KX_DEV];
  return `${fertig?`<div class="kxz-erfolg"><span class="pk"></span><span>${esc(a.pa)} fertig</span></div>`:""}<section class="card kx-warte">${kxPuls(false,true)}<h3>${ok?"Warte auf das nächste Gerät …":"Warte auf das ETS-Gerät …"}</h3>
    <p class="meta">${ok&&nx?`Als Nächstes in deiner Zone:<br><b class="kxz-vor">${esc(nx.pa)} · ${esc(nx.typ)} · ${esc(nx.raum)}</b><br>Du kannst schon hingehen.`:ok?"Sobald ein Gerät angefordert wird, klingelt es – auch in einem anderen Reiter.":"Ist das ETS-Gerät noch in „Programmieren“? Sonst Beenden und neu verbinden."}</p></section>${fort}`; }
function kxTasteKarte(g,a){ const x=g&&kxRaumInfo(g,(kxNorm(g).geraete.find(d=>d.id===a.geraet)||{}).raumId);
  return `<div class="kx-gross kxz-rein"><small>Programmiertaste drücken</small>${kxPuls()}<b>${esc(a.pa)}</b><span>${esc(a.typ||"")}</span><span class="kx-raum">${esc(a.raum||"")}${x?` · ${esc(kxGruppe(x))}`:""}</span></div>
  <div class="kx-knoepfe"><button type="button" class="btn-tonal" data-act="kxNichtGef">Problem</button><button type="button" class="btn-filled" data-act="kxGedrueckt">Gedrückt</button></div>${a.von?`<p class="meta" style="text-align:center;margin-top:10px">angefordert von ${esc(a.von)}</p>`:""}`; }
/* ---- Uhr: Ringe laufen ohne neu zu zeichnen ---- */
function kxRest(id){ const s=KX_PROG.sitz; if(!s||!s.auf) return null; const [dev,aid]=id.split("|"), a=dev==="ich"?s.auf[KX_DEV]:s.auf[dev]; if(!a||a.id!==aid||a.status!=="laeuft") return null;
  let start=a.start; if(KX_PROG.rolle==="taste"){ const k=a.id+"|"+a.start; start=KX_PROG.lokal[k]=KX_PROG.lokal[k]||Date.now(); }
  const ges=(a.dauer||20)*1000; return {rest:Math.max(0,start+ges-Date.now()),ges,dev:dev==="ich"?KX_DEV:dev}; }
function kxTick(){ if(!KX_PROG.rolle) return; document.querySelectorAll("[data-kxuhr]").forEach(el=>{ const r=kxRest(el.dataset.kxuhr); if(!r) return; const c=el.querySelector(".vg"), u=+c.getAttribute("stroke-dasharray");
    c.style.strokeDashoffset=(u*(1-r.rest/r.ges)).toFixed(1); const sek=Math.ceil(r.rest/1000); el.querySelector(".z b").textContent=`0:${String(sek).padStart(2,"0")}`; el.classList.toggle("knapp",sek<=3); });
  /* ETS: abgelaufen → automatisch fertig */
  if(KX_PROG.rolle==="ets"&&KX_PROG.sitz&&KX_PROG.sitz.auf) Object.entries(KX_PROG.sitz.auf).forEach(([dev,a])=>{ if(a&&a.status==="laeuft"&&Date.now()>a.start+(a.dauer||20)*1000&&!KX_PROG.fertigAuto[a.id]){ KX_PROG.fertigAuto[a.id]=1; kxFertigMachen(dev); } }); }
setInterval(kxTick,250);
/* ---- Ton (Helfer) ---- */
function kxTonAn(){ try{ if(!KX_PROG.ton){ const A=window.AudioContext||window.webkitAudioContext; if(A) KX_PROG.ton=new A(); } KX_PROG.ton&&KX_PROG.ton.resume&&KX_PROG.ton.resume(); }catch(e){} }
function kxPiep(){ const c=KX_PROG.ton; if(!c) return; try{ [0,.18].forEach(t=>{ const o=c.createOscillator(), v=c.createGain(); o.frequency.value=t?1320:990; v.gain.setValueAtTime(.0001,c.currentTime+t); v.gain.exponentialRampToValueAtTime(.25,c.currentTime+t+.02); v.gain.exponentialRampToValueAtTime(.0001,c.currentTime+t+.15); o.connect(v).connect(c.destination); o.start(c.currentTime+t); o.stop(c.currentTime+t+.16); }); }catch(e){} }
function kxRuetteln(m){ try{ if(navigator.vibrate) navigator.vibrate(m||[200,100,200]); else if(typeof navHaptik==="function"){ navHaptik(); setTimeout(navHaptik,180); } }catch(e){} }
/* ---- Start/Ende ---- */
async function kxProgStart(rolle,gid){ KX_PROG.rolle=rolle; KX_PROG.g=gid; KX_PROG.fehler=""; KX_PROG.sitz=null; KX_PROG.etag=""; KX_PROG.sitzRoh=null; KX_PROG.helfer={}; KX_PROG.letzt=""; KX_PROG.antwort=null; KX_PROG.codeAuf=false;
  if(rolle==="taste"){ KX_PROG.join={code:KX_PROG.join.g===gid?KX_PROG.join.code:"",zone:KX_PROG.join.g===gid?KX_PROG.join.zone:"",g:gid,verbunden:false}; }
  clearInterval(KX_PROG.timer);
  try{ navigator.wakeLock&&navigator.wakeLock.request("screen").then(w=>KX_PROG.wl=w).catch(()=>{}); }catch(e){}
  if(rolle==="ets"){ try{ const alt=await kxSitzLesen(gid);
      if(alt&&alt.v===2&&alt.code&&alt.ets&&alt.ets.dev===KX_DEV&&Date.now()-alt.ets.at<3*36e5){ KX_PROG.sitz=alt; await kxSitzSchreiben(gid,alt); }
      else { const code=String(1000+Math.floor(Math.random()*9000)); await kxSitzSchreiben(gid,{v:2,g:gid,code,dauer:(alt&&alt.v===2&&alt.dauer)||20,auto:alt&&alt.v===2?alt.auto!==false:true,auf:{},vorschau:{}}); } }
    catch(e){ KX_PROG.fehler=e.message==="ohne Anmeldung"?"nur mit Anmeldung und Internet":"keine Verbindung"; }
    KX_PROG.timer=setInterval(kxAbfrage,1000); kxAbfrage(); }
  kxMerken(); kxAnzeigen(true); }
function kxProgEnde(){ clearInterval(KX_PROG.timer); KX_PROG.timer=null; const r=KX_PROG.rolle, gid=KX_PROG.g;
  if(r==="taste"&&KX_PROG.join.verbunden) kxDateiWeg(kxHelfName(gid,KX_DEV));
  if(r==="ets"&&KX_PROG.sitz){ const s={...KX_PROG.sitz,code:"",auf:{}}; kxSitzSchreiben(gid,s).catch(()=>{}); }
  KX_PROG.rolle=""; KX_PROG.sitz=null; KX_PROG.join.verbunden=false; try{ KX_PROG.wl&&KX_PROG.wl.release(); }catch(e){} kxPopupZu(); kxMerken(); kxLeiste(); }
async function kxVerbinden(){ const j=KX_PROG.join, c=(document.getElementById("kxCode")||{}).value||j.code; j.code=String(c||"").replace(/\D/g,"").slice(0,4);
  if(j.code.length!==4){ KX_PROG.fehler="Der Code hat 4 Ziffern"; render(); return; }
  kxTonAn(); KX_PROG.fehler="";
  try{ const s=await kxSitzLesen(KX_PROG.g); if(!s||s.v!==2||s.code!==j.code||!kxFrisch(s.ets&&s.ets.at)){ KX_PROG.fehler=!s||!s.code?"Auf dem ETS-Gerät läuft gerade keine Sitzung":"Code passt nicht"; render(); return; }
    KX_PROG.sitz=s; j.verbunden=true; await kxHelfSchreiben(); }
  catch(e){ KX_PROG.fehler=e.message==="ohne Anmeldung"?"nur mit Anmeldung und Internet":"keine Verbindung"; render(); return; }
  clearInterval(KX_PROG.timer); KX_PROG.timer=setInterval(kxAbfrage,1000); kxMerken(); toast(`Verbunden mit ${s_wer()}`); kxAnzeigen(true); }
const s_wer=()=>(KX_PROG.sitz&&KX_PROG.sitz.ets&&KX_PROG.sitz.ets.wer)||"der ETS";
/* ---- Abfrage jede Sekunde ---- */
async function kxAbfrage(){ if(!KX_PROG.rolle||KX_PROG.busy) return; KX_PROG.busy=true;
  try{ const gid=KX_PROG.g;
    if(KX_PROG.rolle==="ets"){ const alt=JSON.stringify(Object.values(KX_PROG.helfer).map(h=>[h.dev,h.code,h.zone,h.antwort,kxFrisch(h.at)]));
      await kxHelferLesen(gid);
      const vorher=KX_PROG.sigH; KX_PROG.sigH=JSON.stringify(Object.values(KX_PROG.helfer).map(h=>[h.dev,h.code,h.zone,h.antwort,kxFrisch(h.at)]));
      /* gedrückt gemeldet → kurz rütteln */
      const s=KX_PROG.sitz; if(s) kxVerbunden().forEach(h=>{ const a=s.auf&&s.auf[h.dev]; if(a&&h.antwort&&h.antwort.id===a.id&&h.antwort.status==="gedrueckt"&&!KX_PROG.lokal["g"+a.id]){ KX_PROG.lokal["g"+a.id]=1; kxRuetteln(120); } });
      if(s&&Date.now()-KX_PROG.herz>10000) await kxEtsSchreiben();
      if(KX_PROG.fehler){ KX_PROG.fehler=""; kxAnzeigen(true); } else if(vorher!==KX_PROG.sigH) kxAnzeigen(); else kxLeiste(); }
    else { const s=await kxSitzLesen(gid), sig=s?JSON.stringify([s.seq,s.code,kxFrisch(s.ets&&s.ets.at)]):"";
      if(KX_PROG.join.verbunden&&Date.now()-KX_PROG.herz>10000) await kxHelfSchreiben();
      if(sig!==KX_PROG.letzt||KX_PROG.fehler){ KX_PROG.letzt=sig; const a0=KX_PROG.sitz&&KX_PROG.sitz.auf&&KX_PROG.sitz.auf[KX_DEV]; KX_PROG.sitz=s; KX_PROG.fehler="";
        const a=s&&s.auf&&s.auf[KX_DEV];
        if(a&&a.status==="angefordert"&&KX_PROG.gesehen!==a.id){ KX_PROG.gesehen=a.id; if(KX_PROG.antwort&&KX_PROG.antwort.id!==a.id) KX_PROG.antwort=null; kxMerken(); if(!(KX_PROG.antwort&&KX_PROG.antwort.id===a.id)){ kxPiep(); kxRuetteln(); } }
        kxAnzeigen(); }
      /* außerhalb des Reiters: offene Anforderung immer als Fenster zeigen */
      else if(!kxImReiter()&&!document.getElementById("kxPop")) kxAnzeigen(); else kxLeiste(); } }
  catch(e){ const f=e.message==="ohne Anmeldung"?"nur mit Anmeldung und Internet":"keine Verbindung"; if(KX_PROG.fehler!==f){ KX_PROG.fehler=f; kxAnzeigen(true); } }
  KX_PROG.busy=false; }
const kxImReiter=()=>nav.v==="kx"&&nav.g===KX_PROG.g&&kxTab()==="prog";
function kxAnzeigen(){ kxLeiste(); if(kxImReiter()){ kxPopupZu(); const y=scrollY; render(); scrollTo(0,y); return; }
  /* Helfer außerhalb des Reiters: Fenster über allem */
  const s=KX_PROG.sitz, g=vtGeb(KX_PROG.g), a=s&&s.auf&&s.auf[KX_DEV], an=KX_PROG.antwort;
  if(KX_PROG.rolle==="taste"&&g&&a&&a.status==="angefordert"&&!(an&&an.id===a.id)) kxPopup(kxTasteKarte(g,a)); else kxPopupZu(); }
/* Symbol in der Kopfzeile (links neben dem QR-Knopf), solange eine Sitzung läuft – Punkt grün = verbunden, grau = keine Verbindung,
   rot pulsierend = es ist etwas zu tun (Taste gedrückt / Programmiertaste drücken). Antippen führt in den Reiter „Programmieren“. */
IC.kxGeraete="M4 6h18V4H4c-1.1 0-2 .9-2 2v11H0v3h14v-3H4V6zm19 2h-6c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V9c0-.55-.45-1-1-1zm-1 9h-4v-7h4v7z";
/* Handy: statt Symbol in der (engen) Kopfzeile ein Live-Eintrag ganz oben in den Benachrichtigungen; die Glocke pulsiert rot, wenn etwas zu tun ist */
const kxHandy=()=>typeof WIDE!=="undefined"?!WIDE.matches:innerWidth<744;
function kxLeiste(){ let el=document.getElementById("kxKopf"); const alt=document.getElementById("kxBar"), gl=document.getElementById("glBtn"); if(alt) alt.remove();
  const live=()=>{ if((document.getElementById("mlSeite")||document.getElementById("mlPop"))&&typeof mlFuellen==="function") mlFuellen(); };
  if(!KX_PROG.rolle){ if(el){ el.remove(); if(typeof scPlatz==="function") scPlatz(); } if(gl) gl.classList.remove("kx-gl-warn","kx-gl-live"); live(); return; }
  const s=KX_PROG.sitz; let t="", warn=false, ok=false;
  if(KX_PROG.rolle==="ets"){ const H=kxVerbunden().filter(h=>kxFrisch(h.at)), ged=s&&H.find(h=>kxZustand(s.auf&&s.auf[h.dev],h)==="gedrueckt"), pr=s&&H.find(h=>kxZustand(s.auf&&s.auf[h.dev],h)==="problem");
    ok=H.length>0; t=ged?`${s.auf[ged.dev].pa}: Taste gedrückt – jetzt starten`:pr?`${s.auf[pr.dev].pa}: Problem gemeldet`:`Programmieren · ${H.length} Helfer verbunden`; warn=!!(ged||pr)&&!kxImReiter(); }
  else { const a=s&&s.auf&&s.auf[KX_DEV], an=KX_PROG.antwort; ok=!!(KX_PROG.join.verbunden&&s&&kxFrisch(s.ets&&s.ets.at));
    t=!KX_PROG.join.verbunden?"Programmieren: nicht verbunden":a&&a.status==="laeuft"?`${a.pa} wird programmiert`:a&&a.status==="angefordert"?`${a.pa}: Programmiertaste drücken`:"Programmieren: warte auf das nächste Gerät";
    warn=!!(a&&a.status==="angefordert"&&!(an&&an.id===a.id))&&!kxImReiter(); }
  KX_PROG.stat={t,warn,ok};
  if(kxHandy()){ if(el){ el.remove(); el=null; } if(gl){ gl.classList.toggle("kx-gl-warn",warn); gl.classList.toggle("kx-gl-live",!warn); } live(); return; }
  if(gl) gl.classList.remove("kx-gl-warn","kx-gl-live"); live();
  if(!el){ const sc=document.getElementById("scBtn")||document.getElementById("glBtn"); if(!sc) return;
    el=document.createElement("button"); el.type="button"; el.id="kxKopf"; el.className="glocke kx-kopfbtn";
    el.addEventListener("click",ev=>{ ev.stopPropagation(); if(typeof closeOverlays==="function") closeOverlays(); go({v:"kx",g:KX_PROG.g,tab:"prog"}); },true);
    sc.before(el); if(typeof scPlatz==="function") setTimeout(scPlatz,0); }
  el.className="glocke kx-kopfbtn"+(warn?" warn":ok?" ok":""); el.setAttribute("aria-label",t); el.title=t;
  el.innerHTML=`<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="${IC.kxGeraete}"/></svg><i></i>`; }
/* Live-Eintrag für die Benachrichtigungen (Handy und iPad) */
function kxLiveMeldung(){ if(!KX_PROG.rolle) return ""; const st=KX_PROG.stat||{t:"Programmieren läuft",warn:false,ok:false}, g=vtGeb(KX_PROG.g), o=g&&typeof ecOrt==="function"?ecOrt(g.ortId):null;
  return `<div class="ml-gr">Live</div><button type="button" class="kx-live${st.warn?" warn":""}" data-act="kxLiveAuf"><span class="kx-live-av">${kxVerb(st.ok,"")}</span><span class="kx-live-tx"><b>${esc(st.t)}</b><small>${KX_PROG.rolle==="ets"?"Du programmierst":"Du drückst die Tasten"}${o&&o.titel?` · ${esc(o.titel)}`:""}</small></span>${icon("chev")}</button>`; }
addEventListener("resize",()=>{ if(KX_PROG.rolle) kxLeiste(); });
/* Sitzung merken: App im Hintergrund oder von iOS beendet → beim nächsten Öffnen geht es weiter (bis 3 h) */
function kxMerken(){ try{ if(KX_PROG.rolle) localStorage.setItem("kx-sitzung",JSON.stringify({rolle:KX_PROG.rolle,g:KX_PROG.g,join:KX_PROG.join,antwort:KX_PROG.antwort||null,gesehen:KX_PROG.gesehen||"",at:Date.now()})); else localStorage.removeItem("kx-sitzung"); }catch(e){} }
function kxFortsetzen(n){ let m=null; try{ m=JSON.parse(localStorage.getItem("kx-sitzung")||"null"); }catch(e){} if(!m||!m.g||Date.now()-m.at>3*36e5||KX_PROG.rolle) return;
  if(typeof DB==="undefined"||!DB.gebaeude||!vtGeb(m.g)||typeof ME==="undefined"||!ME.signedIn){ if((n||0)<40) setTimeout(()=>kxFortsetzen((n||0)+1),500); return; }
  if(m.rolle==="ets"){ kxProgStart("ets",m.g); return; }
  KX_PROG.join={...m.join,g:m.g}; const war=!!m.join.verbunden; kxProgStart("taste",m.g).then(()=>{ if(war){ KX_PROG.join.verbunden=true; KX_PROG.antwort=m.antwort||null; KX_PROG.gesehen=m.gesehen||""; KX_PROG.herz=0; clearInterval(KX_PROG.timer); KX_PROG.timer=setInterval(kxAbfrage,1000); kxMerken(); kxAbfrage(); } }); }
setTimeout(()=>kxFortsetzen(),800);
/* zurück in die App (aus dem Hintergrund): sofort nachfragen statt auf den nächsten Takt zu warten */
document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="visible"&&KX_PROG.rolle){ KX_PROG.herz=0; kxAbfrage(); try{ navigator.wakeLock&&navigator.wakeLock.request("screen").then(w=>KX_PROG.wl=w).catch(()=>{}); }catch(e){} } });
function kxPopup(html){ let el=document.getElementById("kxPop"); if(!el){ el=document.createElement("div"); el.id="kxPop"; el.innerHTML=`<div class="kx-pop-in"></div>`; document.body.appendChild(el); } el.querySelector(".kx-pop-in").innerHTML=html; }
function kxPopupZu(){ const el=document.getElementById("kxPop"); if(el) el.remove(); }
/* ---- ETS: schreiben, anfordern, Timer ---- */
async function kxEtsSchreiben(){ const g=vtGeb(KX_PROG.g), s=KX_PROG.sitz; if(!s) return false;
  s.vorschau={}; if(g) kxVerbunden().forEach(h=>{ const nx=kxNaechstesZone(g,h.zone,s.auf&&s.auf[h.dev]&&s.auf[h.dev].geraet); if(nx) s.vorschau[h.dev]={pa:kxPA(g,nx),typ:kxTyp(nx.typ).name,raum:kxRaumTitel(g,nx.raumId)}; });
  try{ await kxSitzSchreiben(KX_PROG.g,s); return true; }catch(e){ toast("Keine Verbindung – nochmal versuchen"); return false; } }
async function kxAnfordernFuer(dev,g,d){ const s=KX_PROG.sitz; if(!s||!d) return; s.auf=s.auf||{};
  s.auf[dev]={id:Math.random().toString(36).slice(2,9),geraet:d.id,pa:kxPA(g,d),typ:kxTyp(d.typ).name,raum:kxRaumTitel(g,d.raumId),zone:kxZoneVon(g,d),status:"angefordert",at:Date.now(),von:kxIch()};
  await kxEtsSchreiben(); kxAnzeigen(); }
/* Gerät ohne Helferwahl anfordern (Liste): Helfer der Zone, sonst einer mit „Alle“, sonst der erste freie */
function kxHelferFuer(g,d){ const H=kxVerbunden().filter(h=>kxFrisch(h.at)), z=kxZoneVon(g,d), frei=h=>{ const a=KX_PROG.sitz.auf&&KX_PROG.sitz.auf[h.dev]; const st=kxZustand(a,h); return st==="frei"||st==="fertig"||st==="abgebrochen"; };
  return H.find(h=>h.zone===z&&frei(h))||H.find(h=>!h.zone&&frei(h))||H.find(frei)||null; }
async function kxFertigMachen(dev){ const s=KX_PROG.sitz, a=s&&s.auf&&s.auf[dev], g=vtGeb(KX_PROG.g); if(!a||!g) return;
  const d=kxNorm(g).geraete.find(x=>x.id===a.geraet); if(d&&!d.prog){ d.prog=kxWer(); kxSpeichern(g); }
  a.status="fertig"; a.ende=Date.now(); await kxEtsSchreiben(); kxAnzeigen(); kxWeiter(dev,a.id); }
function kxWeiter(dev,aid){ const s=KX_PROG.sitz; if(!s||s.auto===false) return; setTimeout(async()=>{ const s2=KX_PROG.sitz, a=s2&&s2.auf&&s2.auf[dev], g=vtGeb(KX_PROG.g);
    if(!a||a.id!==aid||a.status!=="fertig"||!g||KX_PROG.rolle!=="ets") return; const h=kxVerbunden().find(x=>x.dev===dev); if(!h||!kxFrisch(h.at)) return;
    const nx=kxNaechstesZone(g,h.zone,a.geraet); if(nx) await kxAnfordernFuer(dev,g,nx); },1800); }
/* QR-Link „…#kxk=<Projekt>.<Code>“ (vom Scanner oder beim Öffnen): Projekt öffnen, als Helfer mit Code */
function kxLinkPruefen(n){ const m=/[#&]kxk=([\w-]+)\.(\d{4})/.exec(location.hash||""); if(!m) return false;
  const g=(typeof vtGeb==="function"&&DB.gebaeude&&live("gebaeude").find(x=>kxBasis(x.id)===m[1]));
  if(!g){ if((n||0)<20) setTimeout(()=>kxLinkPruefen((n||0)+1),500); return true; }
  try{ history.replaceState(null,"",location.pathname+location.search); }catch(e){}
  KX_PROG.join={code:m[2],zone:"",g:g.id,verbunden:false}; if(typeof closeOverlays==="function") closeOverlays();
  go({v:"kx",g:g.id,tab:"prog"}); kxProgStart("taste",g.id); return true; }
addEventListener("hashchange",()=>kxLinkPruefen()); setTimeout(()=>kxLinkPruefen(),400);

/* ===== Klicks ===== */
document.addEventListener("click",async ev=>{ const b=ev.target.closest&&ev.target.closest('[data-act^="kx"]'); if(!b) return; const a=b.dataset.act; ev.stopPropagation();
  if(a==="kxAuf"){ closeOverlays(); go({v:"kx",g:b.dataset.g,tab:"ueb",...(nav.v==="kunde"||nav.v==="standort"?{von:{v:nav.v,id:nav.id}}:{})}); return; }
  if(a==="kxNeu"){ kxNeuDlg(); return; }
  if(a==="kxNeuHier"){ const s=b.dataset.kind==="standorte"&&standortOf(b.dataset.id), kid=s?s.kundeId:b.dataset.id; kxNeuDlg(kid,s?s.id:""); return; }
  if(a==="kxNeuOk"){ kxNeuOk(); return; }
  if(a==="kxTab"){ nav.tab=b.dataset.v; nav.raum=null; closeOverlays(); render(); scrollTo(0,0); return; }
  if(a==="kxRaumAuf"){ nav.raum=b.dataset.id; render(); scrollTo(0,0); return; }
  if(a==="kxRaumNeu"){ gvRaumNeuDlg(kxGebAkt()); return; }
  if(a==="kxLinieNeu"){ kxLinieDlg(); return; }
  if(a==="kxLinie"){ kxLinieDlg(b.dataset.id); return; }
  if(a==="kxLRaum"){ const v=b.dataset.v; if(KX_LDLG.raeume.has(v)) KX_LDLG.raeume.delete(v); else KX_LDLG.raeume.add(v); b.setAttribute("aria-pressed",String(KX_LDLG.raeume.has(v)));
    document.querySelectorAll('#dlg [data-act="kxLZone"]').forEach(x=>x.setAttribute("aria-pressed",String(x.dataset.v.split(",").every(i=>KX_LDLG.raeume.has(i))))); return; }
  if(a==="kxLZone"){ const ids=b.dataset.v.split(","), alle=ids.every(i=>KX_LDLG.raeume.has(i)); ids.forEach(i=>{ if(alle) KX_LDLG.raeume.delete(i); else KX_LDLG.raeume.add(i); });
    document.querySelectorAll('#dlg [data-act="kxLRaum"]').forEach(x=>x.setAttribute("aria-pressed",String(KX_LDLG.raeume.has(x.dataset.v))));
    document.querySelectorAll('#dlg [data-act="kxLZone"]').forEach(x=>x.setAttribute("aria-pressed",String(x.dataset.v.split(",").every(i=>KX_LDLG.raeume.has(i))))); return; }
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
  if(a==="kxTest"){ kxTestprojekt(); return; }
  if(a==="kxLiveAuf"){ if(typeof mlZu==="function") mlZu(); if(typeof closeOverlays==="function") closeOverlays(); go({v:"kx",g:KX_PROG.g,tab:"prog"}); return; }
  /* Programmieren zu zweit */
  const kxA=()=>{ const s=KX_PROG.sitz; return s&&s.auf&&s.auf[b.dataset.h]; };
  if(a==="kxRolle"){ const g=kxGebAkt(); if(!g) return; await kxProgStart(b.dataset.v,g.id); return; }
  if(a==="kxRolleEnde"){ kxProgEnde(); render(); return; }
  if(a==="kxCodeAuf"||a==="kxCodeZu"){ KX_PROG.codeAuf=a==="kxCodeAuf"; render(); return; }
  if(a==="kxDauer"){ if(KX_PROG.sitz){ KX_PROG.sitz.dauer=+b.dataset.v; await kxEtsSchreiben(); kxAnzeigen(); } return; }
  if(a==="kxAuto"){ if(KX_PROG.sitz){ KX_PROG.sitz.auto=KX_PROG.sitz.auto===false; await kxEtsSchreiben(); kxAnzeigen(); } return; }
  if(a==="kxAnfH"){ const g=vtGeb(KX_PROG.g), d=g&&kxNorm(g).geraete.find(x=>x.id===b.dataset.id); if(d) await kxAnfordernFuer(b.dataset.h,g,d); return; }
  if(a==="kxAnf"){ const g=kxGebAkt()||vtGeb(KX_PROG.g); if(!g) return; if(KX_PROG.rolle!=="ets"){ toast("Erst unter „Programmieren“ „Ich programmiere“ wählen"); return; }
    const d=kxNorm(g).geraete.find(x=>x.id===b.dataset.id), h=d&&kxHelferFuer(g,d); if(!h){ toast("Kein freier Helfer verbunden"); return; } await kxAnfordernFuer(h.dev,g,d); return; }
  if(a==="kxAbbr"){ const x=kxA(); if(x){ x.status="abgebrochen"; await kxEtsSchreiben(); kxAnzeigen(); } return; }
  if(a==="kxStart"){ const x=kxA(); if(x){ x.status="laeuft"; x.start=Date.now(); x.dauer=KX_PROG.sitz.dauer||20; await kxEtsSchreiben(); kxAnzeigen(); } return; }
  if(a==="kxPlus10"){ const x=kxA(); if(x&&x.status==="laeuft"){ x.dauer=(x.dauer||20)+10; await kxEtsSchreiben(); } return; }
  if(a==="kxFertig"){ const x=kxA(); if(x){ KX_PROG.fertigAuto[x.id]=1; await kxFertigMachen(b.dataset.h); } return; }
  if(a==="kxUeberspr"){ const x=kxA(), g=vtGeb(KX_PROG.g); if(!x||!g) return; KX_PROG.fertigAuto[x.id]=1; const d=kxNorm(g).geraete.find(y=>y.id===x.geraet);
    if(d){ d.problem={art:"problem",notiz:"beim Programmieren übersprungen",...kxWer()}; kxSpeichern(g); } x.status="abgebrochen"; x.ende=Date.now(); await kxEtsSchreiben(); kxAnzeigen();
    if(KX_PROG.sitz.auto!==false){ const h=kxVerbunden().find(y=>y.dev===b.dataset.h), nx=h&&kxNaechstesZone(g,h.zone,x.geraet); if(nx) await kxAnfordernFuer(b.dataset.h,g,nx); } return; }
  if(a==="kxNochmal"){ const x=kxA(), g=vtGeb(KX_PROG.g), d=x&&g&&kxNorm(g).geraete.find(y=>y.id===x.geraet); if(d) await kxAnfordernFuer(b.dataset.h,g,d); return; }
  if(a==="kxRueck"){ const x=kxA(), g=vtGeb(KX_PROG.g), d=x&&g&&kxNorm(g).geraete.find(y=>y.id===x.geraet); if(d&&d.prog){ delete d.prog; kxSpeichern(g); } if(x){ x.status="abgebrochen"; await kxEtsSchreiben(); kxAnzeigen(); } return; }
  /* Helfer */
  const kxCodeMerken=()=>{ const c=document.getElementById("kxCode"); if(c) KX_PROG.join.code=c.value.replace(/\D/g,"").slice(0,4); };
  if(a==="kxZone"){ kxCodeMerken(); KX_PROG.join.zone=b.dataset.v; render(); return; }
  if(a==="kxVerbinden"){ kxCodeMerken(); await kxVerbinden(); return; }
  if(a==="kxScan"){ kxCodeMerken(); if(typeof scOeffnen==="function") scOeffnen(); return; }
  if(a==="kxGedrueckt"||a==="kxNichtGef"){ const x=KX_PROG.sitz&&KX_PROG.sitz.auf&&KX_PROG.sitz.auf[KX_DEV]; if(!x) return;
    KX_PROG.antwort={id:x.id,status:a==="kxGedrueckt"?"gedrueckt":"problem",notiz:a==="kxGedrueckt"?"":"Gerät nicht gefunden oder reagiert nicht",at:Date.now()}; kxMerken(); kxPopupZu(); kxAnzeigen();
    try{ await kxHelfSchreiben(); }catch(e){ KX_PROG.antwort=null; kxAnzeigen(); toast("Keine Verbindung – nochmal tippen"); } return; }
},true);
