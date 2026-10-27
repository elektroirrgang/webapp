/* ===== Anlagen: Gebäude, Verteiler, Maschinen (Übersicht) =====
   Ein Modell für alle Apps, aufgebaut wie Wartungs-/CAFM-Software und die Referenzkennzeichnung (DIN EN IEC 81346):
   Ort (+)  = Bauteil → Ebene → Raum/Halle
   Versorgung (=) = Verteiler mit Einspeisung (eingespeist aus Verteiler X, Abgang Q12) → Maschine
   Betriebsmittel (−) = Maschine/Anlage mit Nummer, Stammdaten, Änderungsprotokoll, Prüffrist.
   Gebäude und Verteiler liegen im selben Datensatz „gebaeude“ wie beim E-Check (feste ID je Ort: „g-<ortId>“) –
   zusätzliche Felder: bauteile:[{id,name,kurz}], etagen[].kurz, verteiler[].{bauteilId,etageId,vonVId,vonAbgang,notiz}.
   Maschinen sind eigene Datensätze „anlagen“ (viele je Ort, jeder bearbeitet seine eigene Datei):
   {id,ortId,kundeId,nr,bez,hersteller,typ,baujahr,sn,leistung,spannung,bauteilId,etageId,raum,vId,abgang,absicherung,zuleitung,
    schrankVId,fristM,pruefungen:[{id,datum,erg,notiz,wer}],aenderungen:[{id,at,datum,was,warum,wer}],notiz}
   ortId: Standort-ID oder „k:<Kunde>“ (Adresse des Kunden). */
Object.assign(IC,{anMasch:"M19.93 8.21l-3.6 1.68L14 7.7V6.3l2.33-2.19 3.6 1.68c.38.18.82.01 1-.36.18-.38.01-.82-.36-1L16.65 2.7a.993.993 0 0 0-1.13.2l-1.97 1.85A1.5 1.5 0 0 0 12 4c-.83 0-1.5.67-1.5 1.5 0 .15.03.29.07.43L8.15 7.17a1.5 1.5 0 0 0-1.15-.42C6.17 6.75 5.5 7.42 5.5 8.25c0 .67.45 1.23 1.06 1.42L7.2 13H6c-1.1 0-2 .9-2 2v1h8v-1c0-1.1-.9-2-2-2H8.71l-.65-3.36 2.49-1.24c.28.22.62.35 1 .35.83 0 1.5-.67 1.5-1.5 0-.07-.01-.13-.02-.2l.92-.86 2.35 2.18c.29.26.71.33 1.07.17l3.6-1.68a.758.758 0 0 0 .36-1c-.17-.38-.62-.55-.99-.37zM4 22h16v-2H4v2z",
  anVt:"M14.69 2.21L4.33 11.49c-.64.58-.28 1.65.58 1.73L13 14l-4.85 6.76c-.22.31-.19.74.08 1.01.3.3.77.31 1.08.02l10.36-9.28c.64-.58.28-1.65-.58-1.73L11 10l4.85-6.76c.22-.31.19-.74-.08-1.01a.77.77 0 0 0-1.08-.02z",
  anGeb:"M17 11V3H7v4H3v14h8v-4h2v4h8V11h-4zM7 19H5v-2h2v2zm0-4H5v-2h2v2zm0-4H5V9h2v2zm4 4H9v-2h2v2zm0-4H9V9h2v2zm0-4H9V5h2v2zm4 8h-2v-2h2v2zm0-4h-2V9h2v2zm0-4h-2V5h2v2zm4 12h-2v-2h2v2zm0-4h-2v-2h2v2z"});
const anGebId=ortId=>"g-"+String(ortId).replace(/[^A-Za-z0-9_-]/g,"_");
const anOrtVon=(kundeId,standortId)=>standortId||("k:"+kundeId);
function anOrtInfo(ortId){ ortId=String(ortId||""); if(ortId.startsWith("k:")){ const k=kundeOf(ortId.slice(2)); return {k,s:null,titel:k?k.name:"Kunde"}; }
  const s=standortOf(ortId), k=s&&kundeOf(s.kundeId); return {k,s,titel:[k&&k.name,s&&s.name].filter(Boolean).join(" · ")||"Standort"}; }
const anRang=n=>{ n=String(n||"").toLowerCase().trim(); let m; if(/spitzboden/.test(n)) return 60; if(/^(dg|dach)/.test(n)) return 50;
  if((m=n.match(/^(\d+)\.?\s*(ug|untergeschoss|keller)/))) return -(+m[1]); if(/^(kg|ug|keller|untergeschoss)/.test(n)) return -1; if(/^(eg|erdgeschoss)/.test(n)) return 0;
  if((m=n.match(/^(\d+)\.?\s*(og|obergeschoss|etage)/))) return +m[1]; if((m=n.match(/^(level|lvl|ebene|l)\s*(-?\d+)/))) return +m[2]; return 99; };
/* Gebäude des Orts (wie im E-Check); ohne Datensatz werden Bauteile/Ebenen aus den früheren Textfeldern am Kunden/Standort übernommen */
const AN_NEU=new Map(); /* noch nicht gespeicherte Gebäude – gleiche Objekte (und IDs) bis zum ersten Speichern */
function anGeb(ortId){ const g0=DB.gebaeude&&DB.gebaeude.get(anGebId(ortId)), g=g0&&!g0.deleted?g0:(AN_NEU.get(ortId)||(AN_NEU.set(ortId,{id:anGebId(ortId),ortId}),AN_NEU.get(ortId)));
  g.bauteile=g.bauteile||[]; g.etagen=g.etagen||[]; g.verteiler=g.verteiler||[];
  if(!g._alt){ g._alt=1; const o=anOrtInfo(ortId), q=o.s||o.k; if(q&&typeof kdListe==="function"){
    if(!g.bauteile.length) kdListe(q.bauteile).forEach(n=>g.bauteile.push({id:"b-"+uid(),name:n}));
    if(!g.etagen.length||(g.etagen.length===1&&g.etagen[0].id==="eg"&&!(g.etagen[0].raeume||[]).length&&kdListe(q.ebenen).length)){ if(kdListe(q.ebenen).length) g.etagen=kdListe(q.ebenen).map(n=>({id:"e-"+uid(),name:n,raeume:[]})); } } }
  return g; }
const anGebSpeichern=g=>{ const neu=!DB.gebaeude.has(g.id); delete g.deleted; delete g._alt; saveRec("gebaeude",g,neu); AN_NEU.delete(g.ortId); };
const anEtagen=g=>[...g.etagen].sort((a,b)=>anRang(a.name)-anRang(b.name));
const anBt=(g,id)=>g.bauteile.find(b=>b.id===id), anEt=(g,id)=>g.etagen.find(e=>e.id===id), anVtB=(g,id)=>g.verteiler.find(v=>v.id===id);
/* Ortsangabe: mit Kürzeln „H1“, sonst „Bauteil H · Level 1“ */
function anOrtText(g,bauteilId,etageId,raum){ const b=bauteilId&&anBt(g,bauteilId), e=etageId&&anEt(g,etageId);
  const kurz=b&&e&&b.kurz&&e.kurz?`${b.kurz}${e.kurz}`:"";
  return [kurz||[b&&(/^bauteil/i.test(b.name)?b.name:`Bauteil ${b.name}`),e&&e.name].filter(Boolean).join(" · "),raum].filter(Boolean).join(" · "); }
const anMaschinen=ortId=>(DB.anlagen?live("anlagen"):[]).filter(m=>m.ortId===ortId).sort((a,b)=>String(a.nr||"").localeCompare(String(b.nr||""),"de",{numeric:true})||String(a.bez||"").localeCompare(String(b.bez||""),"de"));
const anMName=m=>[m.nr,m.bez].filter(Boolean).join(" · ")||"Maschine";
/* Prüffrist */
const anLetzte=m=>(m.pruefungen||[]).slice().sort((a,b)=>String(b.datum).localeCompare(String(a.datum)))[0]||null;
function anFaellig(m){ const l=anLetzte(m), f=+m.fristM||0; if(!f) return null; if(!l) return {txt:"noch nie geprüft",kl:"bad"};
  const d=new Date(l.datum+"T12:00"); d.setMonth(d.getMonth()+f); const iso=d.toISOString().slice(0,10), t=today();
  const bald=new Date(Date.now()+60*864e5).toISOString().slice(0,10);
  return {datum:iso,txt:iso<t?`überfällig seit ${deDate(iso)}`:`fällig ${deDate(iso)}`,kl:iso<t?"bad":iso<=bald?"wip":"ok"}; }
/* Versorgungsweg nach oben: Maschine ← Verteiler/Abgang ← … ← Einspeisung */
function anWeg(g,vId,abgang){ const W=[]; let v=vId&&anVtB(g,vId), ab=abgang, n=0;
  while(v&&n++<20){ W.unshift({v,ab}); ab=v.vonAbgang; v=v.vonVId&&anVtB(g,v.vonVId); } return W; }
const anWegText=(g,vId,abgang)=>anWeg(g,vId,abgang).map(x=>`${x.v.name}${x.ab?` / ${x.ab}`:""}`).join(" › ");

/* ---- Karte am Kunden/Standort ---- */
function anKarte(ortId){ if(!DB.gebaeude||!DB.anlagen) return ""; const g=anGeb(ortId), M=anMaschinen(ortId), F=M.map(anFaellig).filter(f=>f&&f.kl!=="ok").length;
  const sub=[g.bauteile.length&&`${g.bauteile.length} Bauteil${g.bauteile.length===1?"":"e"}`,g.verteiler.length&&`${g.verteiler.length} Verteiler`,M.length&&`${M.length} Maschine${M.length===1?"":"n"}`].filter(Boolean).join(" · ");
  return `<div class="sec-lbl">Anlagen</div>${listOf([`<div class="li" role="button" tabindex="0" data-act="anAuf" data-id="${esc(ortId)}"><span class="av">${icon("anMasch")}</span><span class="lt"><span class="h">Gebäude, Verteiler und Maschinen</span><span class="s">${esc(sub||"Noch nichts erfasst")}</span>${F?`<span class="st">${pill("bad",`${F} Prüfung${F===1?"":"en"} fällig`)}</span>`:""}</span>${icon("chev")}</div>`])}`; }

/* ---- Seite „Anlagen“ eines Orts ---- */
const AN_TABS=[["masch","Maschinen"],["vt","Verteiler"],["geb","Gebäude"]];
let AN_Q="", AN_BT="";
function anSeite(ortId){ const tab=META.anTab||"masch", g=anGeb(ortId);
  const tabs=`<div class="seg an-tabs" role="tablist">${AN_TABS.map(([k,t])=>`<button type="button" data-act="anTab" data-v="${k}" aria-pressed="${tab===k}">${t}</button>`).join("")}</div>`;
  let inhalt="";
  if(tab==="masch"){ const q=AN_Q.trim().toLowerCase(), H=x=>String(x||"").toLowerCase().includes(q);
    let M=anMaschinen(ortId); if(AN_BT) M=M.filter(m=>m.bauteilId===AN_BT); if(q) M=M.filter(m=>H(m.nr)||H(m.bez)||H(m.hersteller)||H(m.typ)||H(m.sn)||H(anOrtText(g,m.bauteilId,m.etageId,m.raum)));
    const chips=g.bauteile.length?`<div class="chips vg-chips an-bt"><button class="chip" data-act="anBtF" data-v="" aria-pressed="${!AN_BT}">Alle</button>${g.bauteile.map(b=>`<button class="chip" data-act="anBtF" data-v="${esc(b.id)}" aria-pressed="${AN_BT===b.id}">${esc(b.name)}</button>`).join("")}</div>`:"";
    inhalt=`<div class="search an-such">${icon("search")}<input id="anQ" type="search" placeholder="Nummer, Bezeichnung, Ort" value="${esc(AN_Q)}" autocomplete="off" aria-label="Maschinen suchen"></div>${chips}
      <div id="anRes">${anMListe(M,g)}</div>`; }
  else if(tab==="vt") inhalt=anVtBaum(g,ortId);
  else inhalt=anGebView(g,ortId);
  return `<div class="narrow an-seite">${tabs}${inhalt}</div>`; }
function anMListe(M,g){ if(!M.length) return `<p class="meta" style="margin:16px 4px">${AN_Q||AN_BT?"Nichts gefunden.":"Noch keine Maschine erfasst. Unten rechts „+ Maschine“."}</p>`;
  return listOf(M.map(m=>{ const f=anFaellig(m), w=anWegText(g,m.vId,m.abgang);
    return `<div class="li" role="button" tabindex="0" data-act="anMAuf" data-id="${esc(m.id)}"><span class="av">${icon("anMasch")}</span><span class="lt"><span class="h">${esc(anMName(m))}</span>
      <span class="s">${esc([anOrtText(g,m.bauteilId,m.etageId,m.raum),w&&`aus ${w}`].filter(Boolean).join(" · ")||[m.hersteller,m.typ].filter(Boolean).join(" ")||"Ort und Versorgung noch offen")}</span>
      ${f&&f.kl!=="ok"?`<span class="st">${pill(f.kl,f.txt)}</span>`:""}</span>${icon("chev")}</div>`; })); }
/* Verteiler als Baum nach Einspeisung */
function anVtBaum(g,ortId){ const kinder=id=>g.verteiler.filter(v=>(v.vonVId||"")===id&&(id||!v.vonVId||!anVtB(g,v.vonVId)));
  const M=anMaschinen(ortId), mz=id=>M.filter(m=>m.vId===id).length;
  const zeile=(v,t)=>`<div class="li an-vt" role="button" tabindex="0" data-act="anVEdit" data-id="${esc(v.id)}" style="--t:${t}"><span class="av">${icon("anVt")}</span><span class="lt"><span class="h">${esc(v.name||"Verteiler")}</span>
      <span class="s">${esc([anOrtText(g,v.bauteilId,v.etageId,""),v.vonVId&&anVtB(g,v.vonVId)?`aus ${anVtB(g,v.vonVId).name}${v.vonAbgang?` / ${v.vonAbgang}`:""}`:"Einspeisung",mz(v.id)&&`${mz(v.id)} Maschine${mz(v.id)===1?"":"n"}`].filter(Boolean).join(" · "))}</span></span>${icon("chev")}</div>`;
  const baum=(id,t)=>kinder(id).flatMap(v=>[zeile(v,t),...(t<8?baum(v.id,t+1):[])]);
  const L=baum("",0);
  return `<div class="sec-row"><div class="sec-lbl">Verteiler · ${g.verteiler.length}</div><span class="ab-btns"><button class="ab-ic" data-act="anVNeu" aria-label="Verteiler hinzufügen" title="Verteiler hinzufügen">${icon("add")}</button></span></div>
    ${L.length?`<div class="list an-baum">${L.join("")}</div>`:`<p class="meta">Noch kein Verteiler. Beginne mit der Hauptverteilung, darunter die Unterverteilungen mit „eingespeist aus“.</p>`}
    <p class="sup" style="margin:10px 4px 0">Stromkreise und Fehlerschutzschalter je Verteiler pflegt die E-Check-App – es ist derselbe Datensatz.</p>`; }
function anGebView(g){ const E=anEtagen(g);
  return `<div class="sec-row"><div class="sec-lbl">Bauteile · ${g.bauteile.length}</div><span class="ab-btns"><button class="ab-ic" data-act="anBNeu" aria-label="Bauteil hinzufügen" title="Bauteil hinzufügen">${icon("add")}</button></span></div>
    ${g.bauteile.length?`<div class="chips an-chips">${g.bauteile.map(b=>`<button class="chip" data-act="anBEdit" data-id="${esc(b.id)}">${esc(b.name)}${b.kurz?` <small>${esc(b.kurz)}</small>`:""}</button>`).join("")}</div>`:`<p class="meta">Keine Bauteile – nur nötig bei mehreren Gebäuden (z. B. A bis H).</p>`}
    <div class="sec-row"><div class="sec-lbl">Ebenen · ${E.length}</div><span class="ab-btns"><button class="ab-ic" data-act="anENeu" aria-label="Ebene hinzufügen" title="Ebene hinzufügen">${icon("add")}</button></span></div>
    ${E.length?`<div class="chips an-chips">${E.map(e=>`<button class="chip" data-act="anEEdit" data-id="${esc(e.id)}">${esc(e.name)}${e.kurz?` <small>${esc(e.kurz)}</small>`:""}${(e.raeume||[]).length?` <small>· ${(e.raeume||[]).length} Räume</small>`:""}</button>`).join("")}</div>`:`<p class="meta">Noch keine Ebene.</p>`}
    <p class="sup" style="margin:12px 4px 0">Kürzel (optional): Bauteil „H“ + Ebene „1“ ergibt „H1“ – so steht es dann überall. Räume pflegt die E-Check-App.</p>`; }

/* ---- Seite einer Maschine ---- */
function anMSeite(m){ const g=anGeb(m.ortId), f=anFaellig(m), l=anLetzte(m), W=anWeg(g,m.vId,m.abgang), schrank=m.schrankVId&&anVtB(g,m.schrankVId);
  const z=(l2,v)=>v?`<div class="dz"><span class="dz-t"><small>${esc(l2)}</small><span>${esc(v)}</span></span></div>`:"";
  const weg=W.length?`<div class="an-weg">${W.map(x=>`<span class="an-wk">${icon("anVt")}<b>${esc(x.v.name)}</b>${x.ab?`<small>${esc(x.ab)}</small>`:""}</span>`).join(`<span class="an-pf">›</span>`)}<span class="an-pf">›</span><span class="an-wk ziel">${icon("anMasch")}<b>${esc(m.nr||m.bez||"Maschine")}</b></span></div>`:`<p class="meta">Versorgung noch nicht eingetragen.</p>`;
  const A=(m.aenderungen||[]).slice().sort((a,b)=>String(b.datum||"").localeCompare(String(a.datum||""))||(b.at||0)-(a.at||0));
  const P=(m.pruefungen||[]).slice().sort((a,b)=>String(b.datum).localeCompare(String(a.datum)));
  const ML=typeof mlZeile==="function"?live("vorgaenge").filter(x=>x.typ==="meldung"&&x.anlageId===m.id).sort((a,b)=>(b.gemeldet||0)-(a.gemeldet||0)):[];
  return `<div class="narrow kd-seite an-m">
    <div class="infok2"><div class="qa-row"><button type="button" class="qa" data-act="anMEdit" data-id="${esc(m.id)}"><span class="qa-ic">${icon("edit")}</span><span>Bearbeiten</span></button><button type="button" class="qa" data-act="anANeu" data-id="${esc(m.id)}"><span class="qa-ic">${icon("notes")}</span><span>Änderung</span></button><button type="button" class="qa" data-act="anPNeu" data-id="${esc(m.id)}"><span class="qa-ic">${icon("doc")}</span><span>Prüfung</span></button></div>
      <div class="dz-list">${z("Maschinennummer",m.nr)}${z("Bezeichnung",m.bez)}${z("Hersteller / Typ",[m.hersteller,m.typ].filter(Boolean).join(" "))}${z("Baujahr / Seriennummer",[m.baujahr,m.sn&&`SN ${m.sn}`].filter(Boolean).join(" · "))}${z("Leistung / Spannung",[m.leistung&&`${m.leistung} kW`,m.spannung&&`${m.spannung} V`].filter(Boolean).join(" · "))}${z("Ort",anOrtText(g,m.bauteilId,m.etageId,m.raum))}${z("Notiz",m.notiz)}</div></div>
    <div class="sec-lbl">Versorgung</div>${weg}
    <div class="dz-list an-dz">${z("Absicherung",m.absicherung)}${z("Zuleitung",m.zuleitung)}${z("Steuerschrank / eigene Unterverteilung",schrank&&schrank.name)}</div>
    <div class="sec-row"><div class="sec-lbl">Prüfung${m.fristM?` · alle ${m.fristM} Monate`:""}</div><span class="ab-btns"><button class="ab-ic" data-act="anPNeu" data-id="${esc(m.id)}" aria-label="Prüfung eintragen" title="Prüfung eintragen">${icon("add")}</button></span></div>
    ${f?`<p class="an-frist">${pill(f.kl,f.txt)}${l?` <span class="meta">zuletzt ${esc(deDate(l.datum))} · ${esc(l.erg==="maengel"?"mit Mängeln":"bestanden")}</span>`:""}</p>`:m.fristM?"":`<p class="meta">Keine Prüffrist eingetragen (Bearbeiten).</p>`}
    ${P.length?listOf(P.map(p=>`<div class="li ruhig"><span class="av">${icon("doc")}</span><span class="lt"><span class="h">${esc(deDate(p.datum))} · ${esc(p.erg==="maengel"?"mit Mängeln":"bestanden")}</span><span class="s">${esc([p.wer&&p.wer.name,p.notiz].filter(Boolean).join(" · "))}</span></span></div>`)):""}
    <div class="sec-row"><div class="sec-lbl">Änderungsprotokoll · ${A.length}</div><span class="ab-btns"><button class="ab-ic" data-act="anANeu" data-id="${esc(m.id)}" aria-label="Änderung eintragen" title="Änderung eintragen">${icon("add")}</button></span></div>
    ${A.length?listOf(A.map(a=>`<div class="li" role="button" tabindex="0" data-act="anAEdit" data-id="${esc(m.id)}" data-a="${esc(a.id)}"><span class="av">${icon("notes")}</span><span class="lt"><span class="h">${esc(a.was||"Änderung")}</span><span class="s">${esc([deDate(a.datum),a.wer&&a.wer.name,a.warum&&`Grund: ${a.warum}`].filter(Boolean).join(" · "))}</span></span>${icon("chev")}</div>`)):`<p class="meta">Noch keine Änderung dokumentiert.</p>`}
    ${ML.length?`<div class="sec-lbl">Meldungen · ${ML.length}</div>${ML.map(x=>mlZeile(x)).join("")}`:""}
    ${typeof ablageView==="function"?ablageView("anlagen",m):""}
  </div>`; }

/* ---- Fenster ---- */
let anE=null;
const anChipReihe=(act,L,cur,label)=>L.length?`<div class="ml-oc"><span>${label}</span><div class="chips">${L.map(x=>`<button type="button" class="chip" data-act="${act}" data-v="${esc(x.id)}" aria-pressed="${cur===x.id}">${esc(x.name)}</button>`).join("")}</div></div>`:"";
function anMDialog(m,ortId){ const g=anGeb(m?m.ortId:ortId); anE=m?JSON.parse(JSON.stringify(m)):{id:null,ortId};
  const vts=[["","– noch offen –"],...g.verteiler.map(v=>[v.id,v.name||"Verteiler"])];
  dialog(m?"Maschine bearbeiten":"Neue Maschine",`<div class="fg1 an-dlg">
    <div class="row2">${tf("anNr","Maschinennummer",anE.nr||"",{form:true,ph:"z. B. 4711"})}${tf("anBez","Bezeichnung",anE.bez||"",{form:true,ph:"z. B. Spritzgießmaschine"})}</div>
    <div class="row2">${tf("anHer","Hersteller",anE.hersteller||"",{form:true})}${tf("anTyp","Typ",anE.typ||"",{form:true})}</div>
    <div class="reihe3">${tf("anBj","Baujahr",anE.baujahr||"",{form:true,im:"numeric"})}${tf("anSn","Seriennummer",anE.sn||"",{form:true})}${tf("anKw","Leistung (kW)",anE.leistung||"",{form:true,im:"decimal"})}</div>
    ${tf("anV","Spannung (V)",anE.spannung||"",{form:true,im:"numeric",ph:"z. B. 400"})}
    <div class="lbl" style="margin:12px 4px 6px">Ort</div>${anChipReihe("anMBt",g.bauteile,anE.bauteilId,"Bauteil")}${anChipReihe("anMEt",anEtagen(g),anE.etageId,"Ebene")}
    ${tf("anRaum","Halle / Raum / Achse (optional)",anE.raum||"",{form:true})}
    <div class="lbl" style="margin:12px 4px 6px">Versorgung</div>
    <div class="row2">${sf("anVt","Versorgt aus Verteiler",anE.vId||"",vts,{form:true})}${tf("anAb","Abgang im Verteiler",anE.abgang||"",{form:true,ph:"z. B. Q3"})}</div>
    <div class="row2">${tf("anSi","Absicherung",anE.absicherung||"",{form:true,ph:"z. B. C32 / 3-polig"})}${tf("anZu","Zuleitung",anE.zuleitung||"",{form:true,ph:"z. B. NYY-J 5×6 mm²"})}</div>
    ${sf("anSch","Eigener Steuerschrank / Unterverteilung",anE.schrankVId||"",[["","– keiner –"],...g.verteiler.map(v=>[v.id,v.name||"Verteiler"])],{form:true})}
    ${g.verteiler.length?"":`<p class="sup" style="margin:0 4px 8px">Verteiler legst du unter „Verteiler“ an – dann hier auswählen.</p>`}
    <div class="lbl" style="margin:12px 4px 6px">Prüfung</div>${tf("anFr","Prüffrist in Monaten (optional)",anE.fristM||"",{form:true,im:"numeric",ph:"z. B. 12"})}
    ${ta("anNo","Notiz",anE.notiz||"",{form:true})}</div>`,
    `${m&&(ME.admin||ME.buero)?`<button class="btn-text danger" data-act="anMDel" data-id="${esc(m.id)}">Löschen</button>`:""}<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="anMOk">${m?"Speichern":"Anlegen"}</button>`); }
function anMSpeichern(){ const F=formVals(); if(!F.anNr&&!F.anBez){ toast("Bitte Nummer oder Bezeichnung eintragen"); return; }
  const neu=!anE.id, m=neu?{id:uid(),ortId:anE.ortId,kundeId:(anOrtInfo(anE.ortId).k||{}).id||"",aenderungen:[],pruefungen:[]}:DB.anlagen.get(anE.id); if(!m) return;
  Object.assign(m,{nr:F.anNr,bez:F.anBez,hersteller:F.anHer,typ:F.anTyp,baujahr:F.anBj,sn:F.anSn,leistung:F.anKw,spannung:F.anV,bauteilId:anE.bauteilId||"",etageId:anE.etageId||"",raum:F.anRaum,
    vId:F.anVt,abgang:F.anAb,absicherung:F.anSi,zuleitung:F.anZu,schrankVId:F.anSch,fristM:F.anFr?+String(F.anFr).replace(",","."):"",notiz:F.anNo});
  saveRec("anlagen",m,neu); closeOverlays(); if(neu) go({v:"masch",id:m.id}); else render(); toast(neu?"Maschine angelegt":"Gespeichert"); }
function anVDialog(v,ortId){ const g=anGeb(ortId); anE=v?Object.assign({},v):{id:null}; anE.ortId=ortId;
  const andere=g.verteiler.filter(x=>!v||x.id!==v.id);
  dialog(v?"Verteiler bearbeiten":"Neuer Verteiler",`<div class="fg1 an-dlg">${tf("anVn","Bezeichnung",anE.name||"",{form:true,ph:"z. B. HV, UV-H1-03"})}
    <div class="lbl" style="margin:12px 4px 6px">Ort</div>${anChipReihe("anMBt",g.bauteile,anE.bauteilId,"Bauteil")}${anChipReihe("anMEt",anEtagen(g),anE.etageId,"Ebene")}
    <div class="lbl" style="margin:12px 4px 6px">Einspeisung</div>
    <div class="row2">${sf("anVvon","Eingespeist aus",anE.vonVId||"",[["","– Einspeisung / Trafo –"],...andere.map(x=>[x.id,x.name||"Verteiler"])],{form:true})}${tf("anVab","Abgang dort",anE.vonAbgang||"",{form:true,ph:"z. B. Q12"})}</div>
    ${ta("anVno","Notiz",anE.notiz||"",{form:true})}</div>`,
    `${v?`<button class="btn-text danger" data-act="anVDel" data-id="${esc(v.id)}">Löschen</button>`:""}<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="anVOk">${v?"Speichern":"Anlegen"}</button>`); }
function anVSpeichern(){ const F=formVals(); if(!F.anVn){ toast("Bitte eine Bezeichnung eintragen"); return; } const g=anGeb(anE.ortId);
  if(F.anVvon&&anE.id){ let x=anVtB(g,F.anVvon), n=0; while(x&&n++<30){ if(x.id===anE.id){ toast("Ein Verteiler kann nicht aus sich selbst gespeist werden"); return; } x=x.vonVId&&anVtB(g,x.vonVId); } }
  let v=anE.id&&anVtB(g,anE.id); if(!v){ v={id:"v-"+uid()}; g.verteiler.push(v); }
  Object.assign(v,{name:F.anVn,bauteilId:anE.bauteilId||"",etageId:anE.etageId||"",vonVId:F.anVvon||"",vonAbgang:F.anVab||"",notiz:F.anVno||""});
  anGebSpeichern(g); closeOverlays(); render(); toast("Gespeichert"); }
function anNameDialog(art,x,ortId){ anE={art,id:x&&x.id,ortId}; const B=art==="b";
  dialog(`${B?"Bauteil":"Ebene"} ${x?"bearbeiten":"hinzufügen"}`,`<div class="fg1"><div class="row2">${tf("anNn",B?"Bezeichnung":"Bezeichnung",x?x.name:"",{form:true,ph:B?"z. B. H":"z. B. Level 1"})}${tf("anNk","Kürzel (optional)",x&&x.kurz||"",{form:true,ph:B?"z. B. H":"z. B. 1"})}</div></div>`,
    `${x?`<button class="btn-text danger" data-act="anNDel">Löschen</button>`:""}<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="anNOk">${x?"Speichern":"Hinzufügen"}</button>`); }
function anADialog(m,a){ anE={mid:m.id,aid:a&&a.id};
  dialog(a?"Änderung":"Änderung dokumentieren",`<div class="fg1">${tf("anAd","Datum",a?a.datum:today(),{form:true,type:"date"})}
    ${ta("anAw","Was wurde geändert?",a?a.was:"",{form:true,ph:"z. B. Not-Aus-Kreis erweitert, Schütz K3 getauscht"})}${ta("anAg","Warum? (optional)",a?a.warum:"",{form:true,ph:"z. B. Umbau durch Hersteller, Defekt"})}</div>
    <p class="sup" style="margin:8px 4px 0">Fotos und Pläne dazu unten bei „Dokumente und Fotos“ an der Maschine ablegen.</p>`,
    `${a?`<button class="btn-text danger" data-act="anADel">Löschen</button>`:""}<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="anAOk">Speichern</button>`); }
function anPDialog(m){ anE={mid:m.id,erg:"ok"};
  dialog("Prüfung eintragen",`<div class="fg1">${tf("anPd","Datum",today(),{form:true,type:"date"})}<div class="vg-drw"><span>Ergebnis</span>${seg("anPErg","ok",[["ok","Bestanden"],["maengel","Mit Mängeln"]])}</div>${ta("anPn","Notiz (optional)","",{form:true,ph:"z. B. nach DIN VDE 0113-1 / 0105-100, Protokoll-Nr."})}</div>`,
    `<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="anPOk">Eintragen</button>`); }

document.addEventListener("input",e=>{ if(e.target&&e.target.id==="anQ"){ AN_Q=e.target.value; const r=document.getElementById("anRes"); if(r&&nav.v==="anl"){ const g=anGeb(nav.id), q=AN_Q.trim().toLowerCase(), H=x=>String(x||"").toLowerCase().includes(q);
  let M=anMaschinen(nav.id); if(AN_BT) M=M.filter(m=>m.bauteilId===AN_BT); if(q) M=M.filter(m=>H(m.nr)||H(m.bez)||H(m.hersteller)||H(m.typ)||H(m.sn)||H(anOrtText(g,m.bauteilId,m.etageId,m.raum))); r.innerHTML=anMListe(M,g); } } });
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act^="an"]'); if(!b||!/^an[A-Z]/.test(b.dataset.act)) return; e.stopImmediatePropagation(); e.preventDefault();
  const a=b.dataset.act, id=b.dataset.id, seg1=()=>{ b.parentElement.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x===b))); if(typeof segInd==="function") segInd(); };
  const ortId=nav.v==="anl"?nav.id:nav.v==="masch"?((DB.anlagen.get(nav.id)||{}).ortId):anE&&anE.ortId;
  if(a==="anAuf"){ AN_Q=""; AN_BT=""; go({v:"anl",id}); }
  else if(a==="anTab"){ META.anTab=b.dataset.v; metaSave(); render(); }
  else if(a==="anBtF"){ AN_BT=b.dataset.v; render(); }
  else if(a==="anMAuf") go({v:"masch",id});
  else if(a==="anMNeu") anMDialog(null,ortId);
  else if(a==="anMEdit"){ const m=DB.anlagen.get(id); if(m) anMDialog(m); }
  else if(a==="anMBt"||a==="anMEt"){ if(!anE) return; const k=a==="anMBt"?"bauteilId":"etageId", v=b.dataset.v; anE[k]=anE[k]===v?"":v;
    b.parentElement.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x.dataset.v===anE[k]))); }
  else if(a==="anMOk") anMSpeichern();
  else if(a==="anMDel"){ const m=DB.anlagen.get(id); if(!m) return; m.deleted=true; saveRec("anlagen",m); closeOverlays(); go({v:"anl",id:m.ortId}); toast("Maschine gelöscht","Rückgängig",()=>{ delete m.deleted; saveRec("anlagen",m); render(); }); }
  else if(a==="anVNeu") anVDialog(null,ortId);
  else if(a==="anVEdit"){ const v=anVtB(anGeb(ortId),id); if(v) anVDialog(v,ortId); }
  else if(a==="anVOk") anVSpeichern();
  else if(a==="anVDel"){ const g=anGeb(anE.ortId), hat=g.verteiler.some(x=>x.vonVId===id)||anMaschinen(anE.ortId).some(m=>m.vId===id||m.schrankVId===id)||(g.stromkreise||[]).some(s=>s.vId===id);
    if(hat){ toast("Am Verteiler hängen noch Verteiler, Maschinen oder Stromkreise"); return; } g.verteiler=g.verteiler.filter(x=>x.id!==id); anGebSpeichern(g); closeOverlays(); render(); toast("Verteiler gelöscht"); }
  else if(a==="anBNeu"||a==="anENeu") anNameDialog(a==="anBNeu"?"b":"e",null,ortId);
  else if(a==="anBEdit"||a==="anEEdit"){ const g=anGeb(ortId), x=a==="anBEdit"?anBt(g,id):anEt(g,id); if(x) anNameDialog(a==="anBEdit"?"b":"e",x,ortId); }
  else if(a==="anNOk"||a==="anNDel"){ const F=formVals(), g=anGeb(anE.ortId), L=anE.art==="b"?g.bauteile:g.etagen;
    if(a==="anNDel"){ const k=anE.art==="b"?"bauteilId":"etageId", benutzt=anMaschinen(anE.ortId).some(m=>m[k]===anE.id)||g.verteiler.some(v=>v[k]===anE.id)||(anE.art==="e"&&(anEt(g,anE.id).raeume||[]).length);
      if(benutzt){ toast("Wird noch von Maschinen, Verteilern oder Räumen benutzt"); return; } const i=L.findIndex(x=>x.id===anE.id); if(i>=0) L.splice(i,1); }
    else { if(!F.anNn){ toast("Bitte eine Bezeichnung eintragen"); return; } let x=anE.id&&L.find(y=>y.id===anE.id); if(!x){ x={id:(anE.art==="b"?"b-":"e-")+uid()}; if(anE.art==="e") x.raeume=[]; L.push(x); } x.name=F.anNn; x.kurz=F.anNk||""; }
    anGebSpeichern(g); closeOverlays(); render(); }
  else if(a==="anANeu"||a==="anAEdit"){ const m=DB.anlagen.get(id); if(m) anADialog(m,a==="anAEdit"?(m.aenderungen||[]).find(x=>x.id===b.dataset.a):null); }
  else if(a==="anAOk"||a==="anADel"){ const F=formVals(), m=DB.anlagen.get(anE.mid); if(!m) return; m.aenderungen=m.aenderungen||[];
    if(a==="anADel") m.aenderungen=m.aenderungen.filter(x=>x.id!==anE.aid);
    else { if(!F.anAw){ toast("Bitte eintragen, was geändert wurde"); return; } let x=anE.aid&&m.aenderungen.find(y=>y.id===anE.aid); if(!x){ x={id:uid(),at:Date.now(),wer:who()}; m.aenderungen.push(x); } Object.assign(x,{datum:F.anAd||today(),was:F.anAw,warum:F.anAg}); }
    saveRec("anlagen",m); closeOverlays(); render(); toast(a==="anADel"?"Gelöscht":"Änderung dokumentiert"); }
  else if(a==="anPNeu"){ const m=DB.anlagen.get(id); if(m) anPDialog(m); }
  else if(a==="anPErg"){ if(anE) anE.erg=b.dataset.v; seg1(); }
  else if(a==="anPOk"){ const F=formVals(), m=DB.anlagen.get(anE.mid); if(!m) return; m.pruefungen=[...(m.pruefungen||[]),{id:uid(),datum:F.anPd||today(),erg:anE.erg||"ok",notiz:F.anPn||"",wer:who(),at:Date.now()}];
    saveRec("anlagen",m); closeOverlays(); render(); toast("Prüfung eingetragen"); }
},true);
