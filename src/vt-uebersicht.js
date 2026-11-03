/* ===== Verteiler: Reiter „Übersicht“ – hier landet man nach dem Scan des QR-Aufklebers =====
   Auf einen Blick: wessen Anlage, wann zuletzt geprüft, wann wieder fällig, offene Mängel, was im Verteiler steckt,
   welche Verteiler noch im Gebäude hängen (Einspeisung) und der Verlauf. Nur lesen – bearbeitet wird in den anderen Reitern. */
const vuBetrifft=(pr,vId)=>!pr.umfang||!Array.isArray(pr.umfang.vIds)||pr.umfang.vIds.includes(vId);
const vuPruefungen=(g,vId)=>live("echecks").filter(p=>(p.art||"anlage")==="anlage"&&String(p.ortId)===String(g.ortId)&&vuBetrifft(p,vId))
  .sort((a,b)=>String(b.datum||"").localeCompare(String(a.datum||""))||(b.updated||0)-(a.updated||0));
/* Fälligkeit wie im Prüfprotokoll: Datum + Frist (Standard 4 Jahre); gelb ab 3 Monate vorher */
function vuFaellig(pr){ if(!pr) return null; const iso=ecPlus(pr.datum,pr.fristM||48), t=ecHeute(), bald=ecPlus(t,3);
  return {iso,kl:iso<t?"bad":iso<=bald?"wip":"ok",txt:iso<t?`überfällig seit ${ecDatum(iso)}`:`fällig ${ecDatum(iso)}`}; }
const vuMonate=iso=>{ const a=new Date(ecHeute()+"T12:00"), b=new Date(iso+"T12:00"); return (b.getFullYear()-a.getFullYear())*12+b.getMonth()-a.getMonth(); };
const vuNochText=iso=>{ const m=vuMonate(iso); return m<0?`seit ${-m} Monat${m===-1?"":"en"} überfällig`:m===0?"diesen Monat fällig":m<24?`in ${m} Monat${m===1?"":"en"} fällig`:`in ${Math.floor(m/12)} Jahren fällig`; };
const vuTel=n=>"tel:"+String(n||"").replace(/[^\d+]/g,"");
/* Ergebnis: Messwerte oder eingetragene Mängel – steht im Protokoll Mängeltext, gilt sie als „mit Mängeln“ */
const vuErg=pr=>pr.status!=="fertig"?"wip":ecErgebnis(pr)==="bad"||String(pr.maengel||"").trim()?"bad":"ok";
const vuIso=ms=>{ const d=new Date(ms); d.setMinutes(d.getMinutes()-d.getTimezoneOffset()); return d.toISOString().slice(0,10); };

function vuView(L){ const g=vtGeb(L._geb), v=g&&g.verteiler.find(x=>x.id===L._v); if(!v) return "";
  const o=ecOrt(g.ortId), k=o.kunde, adr=L.anschrift, E=legE(L), P=vuPruefungen(g,v.id);
  const fertigP=P.filter(p=>p.status==="fertig"), letzte=fertigP[0], laeuft=P.find(p=>p.status!=="fertig"), f=vuFaellig(letzte);
  const von=v.vonVId&&g.verteiler.find(x=>x.id===v.vonVId), speist=g.verteiler.filter(x=>x.vonVId===v.id);
  const tel=k?telefoneVon(k):[], ap=k&&(k.ansprech||"");

  /* Kopf: Anlage, Kunde, Schnellaktionen */
  const chips=[v.art==="hv"||L.zs?"Hauptverteilung":v.art==="gw"?"Gewerbe":"Unterverteilung",L.netz,von&&`gespeist aus ${von.name||"Verteiler"}`].filter(Boolean);
  const kopf=`<section class="card vu-kopf">
    <div class="vu-titel"><span class="vu-ic">${icon(k&&kdArt(k)!=="privat"?"firma":"person")}</span><div><b>${esc(k?k.name:"Ohne Kunde")}</b>${adr?`<span>${esc(adr)}</span>`:""}<small class="vu-meta">${esc([...chips,v.qr&&`QR ${qrZeig(v.qr)}`].filter(Boolean).join(" · "))}</small></div></div>
    <div class="vu-aktionen">
      ${tel[0]?`<a class="vu-a" href="${esc(vuTel(tel[0].nr))}">${icon("phone")}<span>Anrufen</span></a>`:""}
      ${adr?`<a class="vu-a" href="${esc(mapsHref(adr))}" target="_blank" rel="noopener">${icon("route")}<span>Route</span></a>`:""}
      ${k?`<button type="button" class="vu-a" data-act="vuKunde">${icon("person")}<span>Kunde</span></button>`:""}
      <button type="button" class="vu-a" data-act="legTab" data-v="sk">${icon("zsBlitz")}<span>Legende</span></button>
    </div>
    ${tel.length>1||ap?`<p class="vu-kontakt">${esc([ap&&`Ansprechpartner: ${ap}`,...tel.map(t=>`${t.art} ${t.nr}`)].filter(Boolean).join(" · "))}</p>`:""}
  </section>`;

  /* Prüfstand: das, wofür man meistens scannt */
  const ergL=letzte&&vuErg(letzte), mangel=letzte&&(letzte.maengel||"").trim();
  const status=laeuft?{kl:"wip",gross:"Prüfung läuft",klein:`Begonnen ${ecDatum(laeuft.datum)}${laeuft.pruefer?` · ${laeuft.pruefer}`:""}`}
    :!letzte?{kl:"open",gross:"Noch nicht geprüft",klein:"Noch kein Prüfprotokoll vorhanden"}
    :{kl:f.kl,gross:f.kl==="bad"?"Prüfung überfällig":f.kl==="wip"?"Prüfung bald fällig":"Prüfung aktuell",klein:`${vuNochText(f.iso)} · ${ecDatum(f.iso)}`};
  const pruef=`<section class="card"><h3>Prüfung</h3>
    <div class="vu-status ${status.kl}"><span class="vu-st-ic">${icon(status.kl==="ok"?"shield":status.kl==="open"?"ecMess":"warn")}</span><div><b>${esc(status.gross)}</b><span>${esc(status.klein)}</span></div>
      ${laeuft?`<button type="button" class="vu-st-k" data-act="ecOeffnen" data-id="${esc(laeuft.id)}">Weiter</button>`:`<button type="button" class="vu-st-k" data-act="ecNeuOrt" data-art="anlage" data-ort="${esc(g.ortId)}">Prüfen</button>`}</div>
    ${letzte?ecListe([ecLi({lead:icon("ecMess"),kopf:`Zuletzt geprüft am ${esc(ecDatum(letzte.datum))}`,text:esc([letzte.pruefart,letzte.pruefer].filter(Boolean).join(" · ")),rechts:ergL==="bad"?`<span class="m3-st bad">Mängel</span>`:ecSt("ok"),act:"ecOeffnen",id:letzte.id})]):""}
    ${mangel?`<div class="vu-mangel">${icon("warn")}<div><b>Mängel aus der letzten Prüfung</b><span>${esc(mangel.split("\n").slice(0,4).join(" · "))}${mangel.split("\n").length>4?" …":""}</span></div></div>`:""}
  </section>`;

  /* Inhalt des Verteilers in Zahlen – antippen springt in die Legende */
  const sk=E.filter(e=>e.art==="sk"), res=E.filter(e=>e.art==="res"||(e.art==="sk"&&/^reserve$/i.test((e.bez||"").trim()))).length;
  const rcd=E.filter(e=>e.art==="rcd").length+sk.filter(legIstRcbo).length, kap=(+L.reihen||0)*(+L.teReihe||12);
  const belegt=E.filter(e=>e.art!=="gr").reduce((s,e)=>s+legTE(e),0), frei=kap&&!(v.art==="hv"||L.zs)?Math.max(0,kap-belegt):null;
  const kachel=(n,t,tab)=>`<button type="button" class="vu-k" data-act="legTab" data-v="${tab}"><b>${n}</b><span>${t}</span></button>`;
  const zahlen=`<section class="card"><h3>Im Verteiler</h3><div class="vu-kacheln">
      ${kachel(sk.length-res,"Stromkreise","sk")}${kachel(rcd,"RCD","sk")}${kachel(res,"Reserve","sk")}${frei!=null?kachel(frei,"TE frei","uv"):kachel(belegt,"TE belegt","sk")}
    </div>${L.stand||v.updated?`<p class="m3-hinweis">${esc([L.stand&&`Stand ${ecDatum(L.stand)}`,L.ersteller&&`aufgenommen von ${L.ersteller}`,v.updated&&`zuletzt geändert ${ecDatum(vuIso(v.updated))}`].filter(Boolean).join(" · "))}</p>`:""}</section>`;

  /* Gebäude: Einspeisung hoch und runter – ein Tipp wechselt den Verteiler, der Reiter Übersicht bleibt */
  const andere=g.verteiler.filter(x=>x.id!==v.id);
  const geb=andere.length?`<section class="card"><h3>Im Gebäude</h3>${ecListe(andere.map(x=>{ const n=g.stromkreise.filter(s=>s.vId===x.id).length, rel=x.id===v.vonVId?"speist diesen Verteiler":x.vonVId===v.id?"wird von hier gespeist":"";
      return ecLi({lead:icon("zsSchrank"),ton:rel?"ok":"",kopf:esc(x.name||"Verteiler"),text:esc([rel,`${n} Stromkreis${n===1?"":"e"}`].filter(Boolean).join(" · ")),act:"vuVt",id:x.id}); }))}</section>`:"";

  /* Verlauf: Prüfungen dieses Verteilers, dazu Wallbox-Prüfungen am selben Ort */
  const wb=(DB.protokolle?live("protokolle"):[]).filter(p=>o.standort?p.standortId===o.standort.id:k&&p.kundeId===k.id&&!p.standortId).sort((a,b)=>String((b.p||{}).datum||"").localeCompare(String((a.p||{}).datum||""))).slice(0,3);
  const verlauf=P.length||wb.length?`<section class="card"><h3>Verlauf</h3>${ecListe([
      ...P.slice(0,6).map(p=>{ const e=vuErg(p); return ecLi({lead:icon("ecMess"),ton:e==="bad"?"bad":e==="wip"?"wip":"ok",kopf:esc(`${p.pruefart||"Prüfung"} · ${ecDatum(p.datum)}`),text:esc([p.pruefer,p.status==="fertig"?(e==="bad"?"mit Mängeln":"ohne Mängel"):"in Arbeit"].filter(Boolean).join(" · ")),act:"ecOeffnen",id:p.id}); }),
      ...wb.map(p=>{ const d=(p.p||{}).datum, n=(p.a||{}).naechste; return ecLi({lead:icon("wallbox"),kopf:esc(`Wallbox-Prüfung · ${ecDatum(d)}`),text:esc([(p.p||{}).pruefer,n&&`nächste ${ecDatum(n)}`].filter(Boolean).join(" · "))}); })])}</section>`:"";

  return `<div class="narrow ec-spalte leg vu">${kopf}${pruef}${zahlen}${geb}${verlauf}</div>`; }

document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act^="vu"]'); if(!b||nav.v!=="vt") return; e.stopPropagation();
  if(b.dataset.act==="vuVt"){ go({v:"vt",g:nav.g,id:b.dataset.id,tab:"info"}); return; }
  if(b.dataset.act==="vuKunde"){ const L=vtL(nav.g,nav.id); if(L&&L.standortId) go({v:"standort",id:L.standortId}); else if(L&&L.kundeId) go({v:"kunde",id:L.kundeId}); }
},true);

/* ===== Verteiler: Reiter „Material“ – was verbaut ist bzw. bestellt werden muss, mit Herstellerfoto =====
   Bestückung aus der Legende (je Artikelnummer zusammengefasst, sonst nach Schutzangabe), dazu der Zählerschrank.
   Fotos: Herstellerbilder aus der Materialliste (MAT_INFO, liegen auf unserem Server) – fehlt eins, das neutrale Gerätebild. */
let VM_KAT=null;
const vmKatalog=()=>VM_KAT||(VM_KAT=(()=>{ const M=new Map(); (typeof awGeraete==="function"?awGeraete():[]).forEach(m=>M.set(matHnr(m.herstellerNr),m)); return M; })());
const vmArtName={rcd:"Fehlerstromschutzschalter",sk:"Leitungsschutzschalter",ge:"Gerät",kl:"Reihenklemme"};
function vmGruppen(L){ const K=vmKatalog(), G=new Map();
  legE(L).forEach(e=>{ if(e.art==="gr"||e.art==="res") return; const hnr=matHnr(e.mat), m=hnr&&K.get(hnr)||null, rb=e.art==="sk"&&legIstRcbo(e);
    const kl=e.art==="kl"?(/pe/i.test(e.bez||"")?"pe":/^\s*a\b|abzweig/i.test(e.bez||"")?"a":"n"):"";
    const key=m?"m:"+hnr:e.art==="kl"?"kl:"+kl:`${e.art}|${legSchutz(e)}|${e.te||""}`;
    let x=G.get(key); if(!x){ const t=m&&matTech(m);
      const titel=m?m.name:e.art==="kl"?`Reihenklemme ${kl==="pe"?"PE":kl==="a"?"Abzweig":"N"}`:e.art==="ge"?(e.schutz||e.bez||"Gerät"):`${rb?"FI/LS-Schalter":vmArtName[e.art]||"Gerät"} ${legSchutz(e)}`.trim();
      const unter=m?[m.hersteller&&m.herstellerNr&&`${m.hersteller} ${m.herstellerNr}`,matNr(m)&&`Sonepar\u00a0${matNr(m)}`,t&&t.te&&`${t.te}\u00a0TE`].filter(Boolean).join(" · ")
        :e.art==="kl"?"Pollmann 14-S":"Artikel noch nicht gewählt";
      const f=legBildFuer(e)[0], bild=m&&matBild(m)?bildLokal(matBild(m)):e.art==="kl"?`../bilder/vt/pollmann-${kl==="pe"?"pe":kl==="a"?"a":"n"}14s.png`:`../bilder/vt/${f}`;
      x={titel,unter,bild,n:0,ord:{rcd:0,sk:rb?2:1,ge:3,kl:4}[e.art]??5,offen:!m&&e.art!=="kl",nr:m?matNr(m):"",hnr:m?hnr:""}; G.set(key,x); }
    x.n++; });
  return [...G.values()].sort((a,b)=>a.ord-b.ord||a.titel.localeCompare(b.titel,"de",{numeric:true})); }
/* Zählerschrank-Positionen: steht eine Artikelnummer in Klammern und kennt die Materialliste sie, gibt es das Foto dazu */
function vmZs(L){ const zs=L.zs; if(!zs||!zs.felder||!zs.felder.length) return [];
  return zsMaterialDaten(zs,L.reihen).map(([t,n])=>{ const h=(t.match(/\(([A-Z0-9]{5,})\)\s*$/)||[])[1], i=h&&MAT_INFO[h];
    return {titel:h?t.replace(/\s*\([A-Z0-9]+\)\s*$/,"").replace(new RegExp("\\s*"+h+"$"),""):t,unter:h?`Hager · ${h}`.replace(/^Hager · (2C)/,"ABB · $1"):"",bild:i&&i.bild?bildLokal(i.bild):"",n,ic:/zähler/i.test(t)?"zsSchrank":/verteilerfeld/i.test(t)?"zsSchrank":/rj45|steuer/i.test(t)?"ecNetz":/apz|spannungsversorgung|einspeis|klemme/i.test(t)?"zsBlitz":"liste"}; }); }
const vmZeile=x=>`<div class="vm-z"><span class="vm-b${x.bild?"":" ic"}">${x.bild?`<img src="${esc(x.bild)}" alt="" loading="lazy" onerror="this.parentNode.classList.add('weg')">`:icon(x.ic||"liste")}</span>
  <span class="vm-t"><b>${esc(x.titel)}</b>${x.unter?`<small${x.offen?' class="offen"':""}>${esc(x.unter)}</small>`:""}</span><span class="vm-n">${x.n}×</span></div>`;
function vmView(L){ const V=vmGruppen(L), Z=vmZs(L), alle=V.reduce((s,x)=>s+x.n,0)+Z.reduce((s,x)=>s+x.n,0), off=V.filter(x=>x.offen).length;
  if(!V.length&&!Z.length) return `<div class="narrow ec-spalte leg"><section class="card"><h3>Material</h3><p class="meta">Noch nichts verbaut. Sobald Geräte im Verteiler stecken oder der Zählerschrank eingerichtet ist, steht hier die Liste.</p></section></div>`;
  return `<div class="narrow ec-spalte leg vm">
    <section class="card vm-kopf"><div><b>${alle}</b><span>Teile</span></div><div><b>${V.length+Z.length}</b><span>Positionen</span></div>${off?`<div class="offen"><b>${off}</b><span>ohne Artikel</span></div>`:""}
      <button type="button" class="vm-teilen" data-act="vmTeilen">${icon("share")}<span>Liste teilen</span></button></section>
    ${V.length?`<section class="card"><h3>Verteiler</h3><div class="vm-liste">${V.map(vmZeile).join("")}</div></section>`:""}
    ${Z.length?`<section class="card"><h3>Zählerschrank</h3><div class="vm-liste">${Z.map(vmZeile).join("")}</div></section>`:""}
  </div>`; }
/* Als Text für die Bestellung (Sonepar-Nummer vorne, wenn bekannt) */
function vmText(L){ const z=x=>`${x.n}× ${x.titel}${x.nr?` – Sonepar ${x.nr}`:x.hnr?` – ${x.hnr}`:""}`, V=vmGruppen(L), Z=vmZs(L);
  return [`Material ${L.titel}${L.kunde?` · ${L.kunde}`:""}`,"",...(V.length?["Verteiler:",...V.map(z),""]:[]),...(Z.length?["Zählerschrank:",...Z.map(x=>`${x.n}× ${x.titel}${x.unter?` (${x.unter.split(" · ").pop()})`:""}`)]:[])].join("\n").trim(); }
document.addEventListener("click",async e=>{ const b=e.target.closest&&e.target.closest('[data-act="vmTeilen"]'); if(!b) return; e.stopPropagation(); const L=legAkt(); if(!L) return; const t=vmText(L);
  if(navigator.share&&matchMedia("(pointer:coarse)").matches){ try{ await navigator.share({title:`Material ${L.titel}`,text:t}); return; }catch(x){ if(x&&x.name==="AbortError") return; } }
  try{ await navigator.clipboard.writeText(t); toast("Materialliste kopiert"); }catch(x){ toast("Kopieren nicht möglich"); } },true);
