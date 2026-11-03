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
    <div class="vu-titel"><span class="vu-ic">${icon(k&&kdArt(k)!=="privat"?"firma":"person")}</span><div><b>${esc(k?k.name:"Ohne Kunde")}</b>${adr?`<span>${esc(adr)}</span>`:""}</div></div>
    <div class="vu-chips">${chips.map(c=>`<span>${esc(c)}</span>`).join("")}${v.qr?`<span class="qr">${icon("qr")}${esc(qrZeig(v.qr))}</span>`:""}</div>
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
    :!letzte?{kl:"open",gross:"Noch nicht geprüft",klein:"Für diesen Verteiler liegt noch kein Prüfprotokoll vor."}
    :{kl:f.kl,gross:f.kl==="bad"?"Prüfung überfällig":f.kl==="wip"?"Prüfung bald fällig":"Prüfung aktuell",klein:`${vuNochText(f.iso)} · ${ecDatum(f.iso)}`};
  const pruef=`<section class="card"><h3>Prüfung</h3>
    <div class="vu-status ${status.kl}"><span class="vu-st-ic">${icon(status.kl==="ok"?"shield":status.kl==="open"?"ecMess":"warn")}</span><div><b>${esc(status.gross)}</b><span>${esc(status.klein)}</span></div></div>
    ${letzte?ecListe([ecLi({lead:icon("ecMess"),kopf:`Zuletzt geprüft am ${esc(ecDatum(letzte.datum))}`,text:esc([letzte.pruefart,letzte.pruefer].filter(Boolean).join(" · ")),rechts:ergL==="bad"?`<span class="m3-st bad">Mängel</span>`:ecSt("ok"),act:"ecOeffnen",id:letzte.id})]):""}
    ${mangel?`<div class="vu-mangel">${icon("warn")}<div><b>Mängel aus der letzten Prüfung</b><span>${esc(mangel.split("\n").slice(0,4).join(" · "))}${mangel.split("\n").length>4?" …":""}</span></div></div>`:""}
    <div class="vu-knoepfe">${laeuft?`<button type="button" class="btn-filled" data-act="ecOeffnen" data-id="${esc(laeuft.id)}">${icon("ecMess")}Weiterprüfen</button>`
      :`<button type="button" class="${!letzte||f.kl!=="ok"?"btn-filled":"btn-tonal"}" data-act="ecNeuOrt" data-art="anlage" data-ort="${esc(g.ortId)}">${icon("ecMess")}Prüfung starten</button>`}</div>
  </section>`;

  /* Inhalt des Verteilers in Zahlen – antippen springt in die Legende */
  const sk=E.filter(e=>e.art==="sk"), res=E.filter(e=>e.art==="res"||(e.art==="sk"&&/^reserve$/i.test((e.bez||"").trim()))).length;
  const rcd=E.filter(e=>e.art==="rcd").length+sk.filter(legIstRcbo).length, kap=(+L.reihen||0)*(+L.teReihe||12);
  const belegt=E.filter(e=>e.art!=="gr").reduce((s,e)=>s+legTE(e),0), frei=kap&&!(v.art==="hv"||L.zs)?Math.max(0,kap-belegt):null;
  const kachel=(n,t,tab)=>`<button type="button" class="vu-k" data-act="legTab" data-v="${tab}"><b>${n}</b><span>${t}</span></button>`;
  const zahlen=`<section class="card"><h3>Im Verteiler</h3><div class="vu-kacheln">
      ${kachel(sk.length-res,"Stromkreise","sk")}${kachel(rcd,"Fehlerschutz (RCD)","sk")}${kachel(res,"Reserve","sk")}${frei!=null?kachel(frei,"TE frei","uv"):kachel(belegt,"TE belegt","sk")}
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
