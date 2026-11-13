/* ===== Kunden-Import (nur Entwickler) – Max 13.11.2026 =====
   Datei: JSON im Format „irrgang-kunden“, Version 1 (Vorlage unter Einstellungen › Entwickler › „Vorlage für den Kunden-Import“).
   Aufbau: { format, version, kunden:[ { Kunde …, ansprechpartner:[], hauptsitz:{ladeparks:[],ladestationen:[]}, standorte:[ { …, ladeparks:[ {…, ladestationen:[]} ], ladestationen:[] } ] } ] }
   Ein einzelner Kunde ohne „kunden“-Liste geht auch. Schlüssel mit „_“ am Anfang werden ignoriert (Platz für Hinweise).
   Abgleich: Kunde über Kundennummer, sonst gleicher Name → vorhandener Kunde wird ergänzt (leere Felder füllen, Neues dazu), nichts überschrieben.
   Standorte und Ladeparks über den Namen, Ladestationen über die Seriennummer (sonst Bezeichnung).
   Ladestationen werden nur in der EVSE-App angelegt (dort gibt es die Prüfwerte); die Übersicht übernimmt Kunde, Standorte, Ladeparks und Ansprechpartner. */
const KDI_ARTEN=["privat","gewerbe","industrie"];
const kdiEntw=()=>typeof istEntwickler==="function"&&istEntwickler();
const kdiGeht=()=>typeof DB!=="undefined"&&!!DB.kunden&&!!DB.standorte&&!!DB.ladeparks;
const kdiStation=()=>typeof newSaeule==="function"&&typeof stamm==="function"&&typeof ortFest==="function";
const kdiS=v=>v===undefined||v===null?"":String(v).trim();
const kdiN=v=>kdiS(v).toLowerCase().replace(/\s+/g," ");
const kdiL=v=>Array.isArray(v)?v:[];
function kdiVorlage(){ return {format:"irrgang-kunden",version:1,
  _hilfe:{
    kunde:"name (Pflicht), art (privat | gewerbe | industrie), kdnr, strasse, plz, ort, telefone [{art, nr}] mit art: Mobil, Festnetz, Privat, Geschäftlich, Fax, Sonstige, mail, web, notiz. Bei Privatkunden zusätzlich anrede (herr | frau), vorname, nachname.",
    ansprechpartner:"name, rolle, tel, mail, notiz – beim Kunden und bei jedem Standort möglich",
    hauptsitz:"Ladeparks und Ladestationen an der Adresse des Kunden",
    standorte:"name (Pflicht), strasse, plz, ort, tel, notiz, ansprechpartner, ladeparks, ladestationen",
    ladeparks:"name (Pflicht), notiz, ladestationen",
    ladestationen:"bauart (Wallbox | Ladesäule), name, typ (Hersteller und Modell), sn, stellplatz, phasen (1 | 3), ladepunkte (1 | 2), absicherung (z. B. B32, C40), rcbo (true = FI/LS), rcd (A | A-EV | F | B | B-EV), idn (30 | 100 | 300), rdc (true = RDC-DD in der Station), strom (16 | 32 je Ladepunkt), zuleitung, bmk (Beschriftung im Verteiler, z. B. -F12). Wird nur in der EVSE-App angelegt.",
    abgleich:"Gleiche Kundennummer oder gleicher Name = vorhandener Kunde wird ergänzt, nichts überschrieben. Standorte und Ladeparks über den Namen, Ladestationen über die Seriennummer."},
  kunden:[{name:"Musterfirma GmbH",art:"industrie",kdnr:"10001",strasse:"Musterstraße 1",plz:"51545",ort:"Waldbröl",telefone:[{art:"Geschäftlich",nr:"02291 0000"}],mail:"info@musterfirma.example",web:"musterfirma.example",notiz:"",
    ansprechpartner:[{name:"Frau Beispiel",rolle:"Haustechnik",tel:"0170 0000000",mail:"",notiz:""}],
    hauptsitz:{ladeparks:[{name:"Parkplatz Nord",ladestationen:[{bauart:"Ladesäule",name:"",typ:"",sn:"",stellplatz:"P1",phasen:3,ladepunkte:2,absicherung:"B32",rcbo:false,rcd:"A-EV",idn:30,rdc:false,strom:32,zuleitung:"NYY-J 5×10 mm²",bmk:"-F1"}]}],ladestationen:[]},
    standorte:[{name:"Lager Musterdorf",strasse:"Lagerweg 5",plz:"51588",ort:"Nümbrecht",tel:"",notiz:"Schlüssel beim Pförtner",ansprechpartner:[],ladeparks:[],
      ladestationen:[{bauart:"Wallbox",name:"",typ:"",sn:"",stellplatz:"",phasen:3,ladepunkte:1,absicherung:"B16",rcbo:true,rcd:"A",idn:30,rdc:true,strom:16,zuleitung:"",bmk:""}]}]}]}; }
function kdiVorlageLaden(){ const b=new Blob([JSON.stringify(kdiVorlage(),null,2)],{type:"application/json"}); saveFile(b,"Kunden-Import Vorlage.json"); toast("Vorlage gespeichert"); }
/* Datei lesen → Plan (was wird angelegt/ergänzt) */
function kdiPlan(j){ const F=[], K=[];
  if(!j||typeof j!=="object") return {F:["Die Datei ist kein JSON-Objekt."],K};
  if(j.format&&j.format!=="irrgang-kunden") F.push(`Unbekanntes Format „${j.format}“ – erwartet „irrgang-kunden“.`);
  if(j.version&&+j.version>1) F.push(`Version ${j.version} ist neuer als diese App (kennt Version 1).`);
  const L=Array.isArray(j.kunden)?j.kunden:j.name?[j]:[]; if(!L.length) F.push("Keine Kunden gefunden („kunden“-Liste fehlt oder ist leer).");
  L.forEach((k,i)=>{ const n=kdiS(k.name)||[kdiS(k.vorname),kdiS(k.nachname)].filter(Boolean).join(" "); if(!n){ F.push(`Kunde ${i+1}: Name fehlt.`); return; }
    const da=live("kunden").find(x=>(kdiS(k.kdnr)&&kdiS(x.kdnr)===kdiS(k.kdnr))||kdiN(x.name)===kdiN(n));
    kdiL(k.standorte).forEach((s,si)=>{ if(!kdiS(s.name)) F.push(`${n}, Standort ${si+1}: Name fehlt.`); });
    const st=[...kdiL(k.hauptsitz&&k.hauptsitz.ladestationen),...kdiL(k.hauptsitz&&k.hauptsitz.ladeparks).flatMap(l=>kdiL(l.ladestationen)),...kdiL(k.standorte).flatMap(s=>[...kdiL(s.ladestationen),...kdiL(s.ladeparks).flatMap(l=>kdiL(l.ladestationen))])];
    st.forEach(x=>{ if(x.rcd&&!["A","A-EV","F","B","B-EV"].includes(kdiS(x.rcd))) F.push(`${n}: RCD-Typ „${x.rcd}“ unbekannt (A, A-EV, F, B, B-EV).`); if(x.absicherung&&!/^\s*[BCDK]?\s*\d+(?:[.,]\d+)?\s*A?\s*$/i.test(String(x.absicherung))) F.push(`${n}: Absicherung „${x.absicherung}“ nicht lesbar (z. B. B32).`); });
    K.push({k,n,da,nSt:kdiL(k.standorte).length,nLp:kdiL(k.hauptsitz&&k.hauptsitz.ladeparks).length+kdiL(k.standorte).reduce((a,s)=>a+kdiL(s.ladeparks).length,0),nGer:st.length,nKt:kdiL(k.ansprechpartner).length+kdiL(k.standorte).reduce((a,s)=>a+kdiL(s.ansprechpartner).length,0)}); });
  return {F,K}; }
let KDI=null, KDI_Z={};
function kdiWaehlen(){ const i=document.createElement("input"); i.type="file"; i.accept=".json,application/json,text/plain"; i.onchange=async()=>{ const f=i.files&&i.files[0]; if(!f) return; let j;
    try{ j=JSON.parse((await f.text()).replace(/^﻿/,"")); }catch(e){ dialog("Import nicht möglich",`<p>Die Datei „${esc(f.name)}“ ist kein gültiges JSON.</p><p class="sup">${esc(e.message)}</p>`,`<button class="btn-text" data-act="cancel">Schließen</button>`); return; }
    const P=kdiPlan(j); KDI=P;
    const z=P.K.map(x=>`<div class="li"><span class="av">${icon("firma")}</span><span class="lt"><span class="h">${esc(x.n)}</span><span class="s">${esc([x.da?"vorhanden – wird ergänzt":"neu",x.nSt&&`${x.nSt} Standort${x.nSt===1?"":"e"}`,x.nLp&&`${x.nLp} Ladepark${x.nLp===1?"":"s"}`,x.nGer&&`${x.nGer} Ladestation${x.nGer===1?"":"en"}`,x.nKt&&`${x.nKt} Ansprechpartner`].filter(Boolean).join(" · "))}</span></span></div>`).join("");
    const ohneSt=P.K.some(x=>x.nGer)&&!kdiStation();
    dialog("Kunden importieren",`${P.F.length?`<div style="margin:0 0 12px;padding:12px 16px;border-radius:16px;background:color-mix(in srgb,var(--error,#B3261E) 12%,transparent);color:var(--on-surface)">${P.F.map(t=>`<p style="margin:0 0 4px">${esc(t)}</p>`).join("")}</div>`:""}
      ${z?`<div class="list">${z}</div>`:""}${ohneSt?`<p class="sup" style="margin:12px 0 0">Ladestationen werden nur in der EVSE-App angelegt – hier kommen Kunde, Standorte, Ladeparks und Ansprechpartner.</p>`:""}
      <p class="sup" style="margin:12px 0 0">Vorhandene Angaben werden nicht überschrieben, nur ergänzt.</p>`,
      `<button class="btn-text" data-act="cancel">Abbrechen</button>${P.K.length&&!P.F.length?`<button class="btn-text" data-act="kdiOk">Importieren</button>`:""}`); };
  i.click(); }
const kdiKt=L=>kdiL(L).map(x=>({id:uid(),name:kdiS(x.name),rolle:kdiS(x.rolle),tel:kdiS(x.tel),telefone:kdiS(x.tel)?[{art:typeof telArtRaten==="function"?telArtRaten(x.tel):"Festnetz",nr:kdiS(x.tel)}]:[],mail:kdiS(x.mail),notiz:kdiS(x.notiz)})).filter(x=>x.name||x.tel||x.mail);
function kdiFuellen(r,q,felder){ let ch=false; felder.forEach(f=>{ const v=kdiS(q[f]); if(v&&!kdiS(r[f])){ r[f]=v; ch=true; } }); return ch; }
function kdiKtDazu(r,L){ const neu=kdiKt(L).filter(x=>!(r.kontakte||[]).some(y=>kdiN(y.name)&&kdiN(y.name)===kdiN(x.name))); if(!neu.length) return 0;
  r.kontakte=[...(r.kontakte||[]),...neu]; if(!r.ansprech){ const h=r.kontakte.find(x=>/ansprech/i.test(x.rolle||""))||r.kontakte[0]; r.ansprech=h?h.name||"":""; } return neu.length; }
/* eine Ladestation am Ort (sid, lid) – Werte wie im Geräte-Fenster */
function kdiStationAnlegen(sid,lid,x){ const o=ortFest(sid,lid); if(!o) return 0; o.geraete=o.geraete||[];
  const sn=kdiS(x.sn), nm=kdiS(x.name), pl=kdiS(x.stellplatz), ba=/säule|saeule/i.test(kdiS(x.bauart))?"Ladesäule":"Wallbox";
  if(o.geraete.some(g=>!g.aus&&((sn&&kdiS(g.sn)===sn)||(!sn&&nm&&kdiN(g.name)===kdiN(nm))||(!sn&&!nm&&pl&&kdiN(g.ort)===kdiN(pl))))) return 0;
  /* ohne Seriennummer, Name und Stellplatz: nur so viele anlegen, wie am Ort von dieser Bauart noch fehlen (erneuter Import legt nichts doppelt an) */
  if(!sn&&!nm&&!pl){ const key=sid+"|"+(lid||"")+"|"+ba; KDI_Z[key]=KDI_Z[key]||{basis:o.geraete.filter(g=>!g.aus&&(g.bauart||"Ladesäule")===ba).length,n:0}; if(++KDI_Z[key].n<=KDI_Z[key].basis) return 0; }
  const s=newSaeule(1,ba); s.name=nm; s.typ=kdiS(x.typ); s.sn=sn; s.ort=kdiS(x.stellplatz);
  if(+x.phasen===1||+x.phasen===3) s.phasen=+x.phasen; if(+x.ladepunkte===1||+x.ladepunkte===2) s.lps=+x.ladepunkte;
  const m=kdiS(x.absicherung).match(/^([BCDK])?\s*(\d+(?:[.,]\d+)?)/i); if(m){ if(m[1]) s.absTyp=/^[BC]$/i.test(m[1])?"LS "+m[1].toUpperCase():"manuell"; const a=m[2].replace(",","."); s.absIn=a; if(typeof GT_IN!=="undefined"&&!GT_IN.includes(a)) s.absInAnders=true; }
  if(x.rcbo===true) s.rcbo=true;
  if(kdiS(x.rcd)&&typeof setRcd==="function") setRcd(s,kdiS(x.rcd),x.rdc===true); else if(x.rdc===true&&typeof setRcd==="function") setRcd(s,"A",true);
  if([30,100,300].includes(+x.idn)) s.idn=String(+x.idn); if(+x.strom) s.inenn=String(+x.strom);
  if(kdiS(x.zuleitung)) s.leitung=kdiS(x.zuleitung); if(kdiS(x.bmk)) s.bmk=kdiS(x.bmk);
  o.geraete.push(Object.assign(stamm(s),{gid:s.id})); if(typeof nummeriere==="function") nummeriere(o.geraete.filter(g=>!g.aus));
  saveRec(typeof ortKind==="function"?ortKind(lid,sid):lid?"ladeparks":sid.startsWith("k:")?"kunden":"standorte",o,false); return 1; }
function kdiAusfuehren(){ const P=KDI; if(!P) return; KDI=null; KDI_Z={}; const Z={k:0,kE:0,s:0,l:0,g:0,kt:0}, statOk=kdiStation(); let erster=null;
  const lpAm=(sid,L)=>kdiL(L).forEach(lq=>{ const nm=kdiS(lq.name); if(!nm) return; let l=live("ladeparks").find(x=>x.standortId===sid&&kdiN(x.name)===kdiN(nm));
    if(!l){ l=saveRec("ladeparks",{id:uid(),standortId:sid,name:nm,notiz:kdiS(lq.notiz)},true); Z.l++; }
    if(statOk) kdiL(lq.ladestationen).forEach(x=>{ Z.g+=kdiStationAnlegen(sid,l.id,x); }); });
  for(const {k:q,n,da} of P.K){ let k=da;
    if(!k){ k={id:uid(),name:n,adresse:""}; Z.k++; } else Z.kE++;
    const art=KDI_ARTEN.includes(kdiS(q.art))?kdiS(q.art):""; if(art&&!k.art) k.art=art;
    kdiFuellen(k,q,["kdnr","strasse","plz","ort","mail","web","anrede","vorname","nachname"]);
    if(kdiS(q.notiz)&&!kdiS(k.notiz)) k.notiz=kdiS(q.notiz);
    const T=kdiL(q.telefone).map(t=>({art:kdiS(t.art)||"Geschäftlich",nr:kdiS(t.nr)})).filter(t=>t.nr);
    if(T.length&&!(typeof telefoneVon==="function"?telefoneVon(k):[]).length){ k.telefone=JSON.stringify(T); k.tel=T[0].nr; }
    Z.kt+=kdiKtDazu(k,q.ansprechpartner); saveRec("kunden",k,!da); erster=erster||k;
    const hq="k:"+k.id;
    lpAm(hq,q.hauptsitz&&q.hauptsitz.ladeparks);
    if(statOk) kdiL(q.hauptsitz&&q.hauptsitz.ladestationen).forEach(x=>{ Z.g+=kdiStationAnlegen(hq,null,x); });
    for(const sq of kdiL(q.standorte)){ const nm=kdiS(sq.name); if(!nm) continue;
      let s=live("standorte").find(x=>x.kundeId===k.id&&kdiN(x.name)===kdiN(nm)), neu=!s;
      if(neu){ s={id:uid(),kundeId:k.id,name:nm,adresse:""}; Z.s++; }
      kdiFuellen(s,sq,["strasse","plz","ort","tel","notiz"]); Z.kt+=kdiKtDazu(s,sq.ansprechpartner); saveRec("standorte",s,neu);
      lpAm(s.id,sq.ladeparks);
      if(statOk) kdiL(sq.ladestationen).forEach(x=>{ Z.g+=kdiStationAnlegen(s.id,null,x); }); } }
  closeOverlays();
  toast([Z.k&&`${Z.k} Kunde${Z.k===1?"":"n"} neu`,Z.kE&&`${Z.kE} ergänzt`,Z.s&&`${Z.s} Standort${Z.s===1?"":"e"}`,Z.l&&`${Z.l} Ladepark${Z.l===1?"":"s"}`,Z.g&&`${Z.g} Ladestation${Z.g===1?"":"en"}`,Z.kt&&`${Z.kt} Ansprechpartner`].filter(Boolean).join(" · ")||"Nichts Neues – alles war schon da");
  if(erster&&P.K.length===1&&typeof go==="function") go({v:"kunde",id:erster.id}); else if(typeof render==="function") render(); }
/* Zeilen im Entwickler-Bereich */
function kdImportZeile(){ if(!kdiEntw()||!kdiGeht()) return "";
  return `<div class="li" role="button" tabindex="0" data-act="kdiWahl"><span class="av">${icon("upload")}</span><span class="lt"><span class="h">Kunden importieren</span><span class="s">JSON-Datei mit Kunde, Standorten, Ladeparks${kdiStation()?" und Ladestationen":""} – vorher siehst du, was passiert</span></span>${icon("chev")}</div>
    <div class="li" role="button" tabindex="0" data-act="kdiVorlage"><span class="av">${icon("doc")}</span><span class="lt"><span class="h">Vorlage für den Kunden-Import</span><span class="s">Beispieldatei mit allen Feldern und Erklärung herunterladen</span></span>${icon("chev")}</div>`; }
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act="kdiWahl"],[data-act="kdiVorlage"],[data-act="kdiOk"]'); if(!b) return; e.stopImmediatePropagation(); e.preventDefault();
  if(!kdiEntw()) return; const a=b.dataset.act;
  if(a==="kdiWahl") kdiWaehlen(); else if(a==="kdiVorlage") kdiVorlageLaden(); else kdiAusfuehren(); },true);
