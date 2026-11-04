/* ===== Anlagenpass (Gebäudetechnik, 04.11.2026) =====
   Eine PDF je Objekt für Kunde, Vermieter oder Hausverwaltung: Objekt, alle Verteiler (mit Einspeisung und Anlagen-Nr.),
   alle Prüfungen mit Ergebnis und nächster Fälligkeit, offene Mängel, Hinweise für den Betreiber
   und danach je Verteiler eine Seite mit QR-Code und Stromkreisliste.
   Abgelegt wie die Legende in der Bibliothek: Pläne und Schaltpläne › Anlagenpass (ältere Fassungen in „Ältere Stände“). */
function apDaten(gid){ const g=vtGeb(gid); if(!g) return null; const o=ecOrt(g.ortId), k=o.kunde;
  const V=g.verteiler.map(v=>({v,L:vtL(g.id,v.id)})).filter(x=>x.L);
  const P=live("echecks").filter(p=>String(p.ortId)===String(g.ortId)).sort((a,b)=>String(b.datum||"").localeCompare(String(a.datum||"")));
  return {g,o,k,V,P,adr:o.standort?adrText(o.standort)||o.standort.name:adrText(k)||""}; }
/* QR-Code als Kästchen zeichnen (scharf in jeder Größe, kein Bild nötig) */
function apQr(d,c,x,y,mm){ if(typeof qrMatrix!=="function") return; const M=qrMatrix(c), n=M.length, s=mm/n; d.setFillColor(0,0,0);
  M.forEach((z,r)=>z.forEach((on,q)=>{ if(on) d.rect(x+q*s,y+r*s,s+.02,s+.02,"F"); })); }
async function apPdf(gid){ const A=apDaten(gid); if(!A) throw new Error("Objekt nicht gefunden"); const {g,o,k,V,P,adr}=A;
  const lib=await pdfLib(), d=new lib.jsPDF({unit:"mm",format:"a4"}), heute=ecHeute();
  const S=pdfStil(d,{titel:"Anlagenpass",unter:`Elektrische Anlage | ${[o.titel,o.standort?"":adr].filter(Boolean).join(" | ")}`,fuss:[k&&k.name,adr,"Stand "+ecDatum(heute)].filter(Boolean).join(" | ")});
  const M=S.M, CW=S.CW;
  S.kopf();
  const nSk=V.reduce((n,x)=>n+legE(x.L).filter(e=>e.art==="sk").length,0), nRcd=V.reduce((n,x)=>n+legE(x.L).filter(e=>e.art==="rcd").length,0);
  const netz=(V.find(x=>x.L.netz)||{L:{}}).L.netz||"";
  S.abschnitt("Objekt");
  S.werte([["Eigentümer/Kunde",k&&k.name],["Anschrift",adr],["Verteiler",String(V.length)],["Stromkreise",`${nSk}${nRcd?` an ${nRcd} Fehlerstromschutzschalter${nRcd===1?"":"n"}`:""}`],...(netz?[["Netzform",netz]]:[]),["Stand",ecDatum(heute)]]);
  if(V.length){ S.abschnitt("Verteiler");
    const name=id=>{ const x=g.verteiler.find(v=>v.id===id); return x?x.name||"Verteiler":""; };
    S.tabelle(["Verteiler","Eingespeist aus","Bauart","Anlagen-Nr.","Stromkreise"],[38,38,58,26,22],
      V.map(({v,L})=>[v.name||"Verteiler",v.vonVId?name(v.vonVId):"Hausanschluss",legBauart(L)||"-",v.qr?qrZeig(v.qr):"-",String(legE(L).filter(e=>e.art==="sk").length)])); }
  S.abschnitt("Prüfungen");
  if(P.length){ const fertig=P.filter(p=>p.status==="fertig");
    S.tabelle(["Datum","Prüfung","Prüfer","Nächste Prüfung","Ergebnis"],[22,66,38,32,24],P.map(p=>{ const art=(EC_ART[p.art||"anlage"]||"Prüfung")+(p.pruefart?` (${p.pruefart})`:"");
      const erg=p.status!=="fertig"?"open|in Arbeit":(typeof vuErg==="function"&&(p.art||"anlage")==="anlage"?vuErg(p):(String(p.maengel||"").trim()?"bad":"ok"))==="bad"?"bad|Mängel":"ok|bestanden";
      const nx=fertig.find(q=>(q.art||"anlage")===(p.art||"anlage"))===p?ecDatum(ecPlus(p.fertigAm||p.datum,p.fristM||((p.art||"anlage")==="anlage"?48:12))):"-";   /* nur bei der jeweils neuesten Prüfung einer Art */
      return [ecDatum(p.datum),art,p.pruefer||"-",nx,erg]; }),4);
    const m=fertig.find(p=>(p.art||"anlage")==="anlage"&&String(p.maengel||"").trim());
    if(m&&m===fertig.find(p=>(p.art||"anlage")==="anlage")){ S.abschnitt("Mängel aus der letzten Prüfung"); S.text(`Prüfung vom ${ecDatum(m.datum)}:\n${String(m.maengel).trim()}`); } }
  else S.text("Für dieses Objekt ist noch keine Prüfung dokumentiert.");
  S.abschnitt("Hinweise für den Betreiber");
  S.text("Fehlerstromschutzschalter (RCD) etwa alle 6 Monate über die Prüftaste „T“ auslösen. Schaltet der RCD dabei nicht ab, bitte Elektro Irrgang informieren.");
  S.text("Elektrische Anlagen müssen regelmäßig geprüft werden: in Wohngebäuden empfohlen alle 4 Jahre (E-Check), bei gewerblicher Nutzung nach DGUV Vorschrift 3 in den vom Betreiber festgelegten Fristen. Änderungen und Erweiterungen nur durch eine Elektrofachkraft.");
  if(V.some(x=>x.v.qr)) S.text("Die QR-Aufkleber an den Verteilern führen zur Kontaktseite mit Störungshilfe. Bitte bei Anfragen die dort genannte Anlagen-Nr. angeben.");
  S.platz(14); { const y=S.y+1, x2=M+CW/2;
    d.setTextColor(20); d.setFont("helvetica","bold"); d.setFontSize(12); d.text("Elektro Irrgang",M,y); d.setTextColor(225,29,47); d.text("Tel. 02291 4878",x2,y);
    d.setFont("helvetica","normal"); d.setFontSize(10); d.setTextColor(40); d.text(pdfT("Hahner Weg 2 | 51545 Waldbröl"),M,y+5.2); d.text(pdfT("info@elektro-irrgang.de | www.elektro-irrgang.de"),x2,y+5.2); S.y=y+13; }
  /* je Verteiler eine eigene Seite */
  V.forEach(({v,L})=>{ S.seite(`Verteiler ${v.name||""}`.trim(),`Anlagenpass | ${o.titel}`);
    S.abschnitt("Angaben");
    const von=v.vonVId?(g.verteiler.find(x=>x.id===v.vonVId)||{}).name||"":"Hausanschluss";
    S.werte([["Bauart",legBauart(L)],["Eingespeist aus",von],["Netzform",L.netz],["Stand",ecDatum(L.stand)]]);
    if(v.qr){ S.platz(36); const y=S.y-2; apQr(d,v.qr,M,y,28);
      d.setFont("helvetica","normal"); d.setFontSize(8); d.setTextColor(...S.GR); d.text("Anlagen-Nr.",M+34,y+6);
      d.setFont("helvetica","bold"); d.setFontSize(18); d.setTextColor(20); d.text(qrZeig(v.qr),M+34,y+14);
      d.setFont("helvetica","normal"); d.setFontSize(8.5); d.setTextColor(40); d.text(d.splitTextToSize(pdfT("Der Aufkleber mit diesem Code hängt am Verteiler. Scannen öffnet Kontakt und Störungshilfe; Mitarbeiter von Elektro Irrgang sehen direkt die Anlagendaten."),CW-36),M+34,y+20);
      S.y=y+34; }
    if(legE(L).length) legPdfStromkreise(d,S,L); else S.text("Für diesen Verteiler sind noch keine Stromkreise erfasst."); });
  return S.ende(); }
async function apMachen(gid){ const A=apDaten(gid); if(!A) return; if(!A.V.length&&!A.P.length){ toast("Für dieses Objekt gibt es noch keine Verteiler oder Prüfungen"); return; }
  toast("Anlagenpass wird erstellt …"); let blob; try{ blob=await apPdf(gid); }catch(e){ console.error(e); toast("PDF konnte nicht erstellt werden – Internet für die PDF-Bibliothek nötig"); return; }
  const {g,o,k}=A, datum=ecHeute(), schl="pass:"+g.ortId, name=bbFs(`${datum} Anlagenpass ${o.standort?o.standort.name:k?k.name:""}`.trim());
  const x={id:uid(),app:"anlagenpass",vtId:schl,vtName:"Anlagenpass",kundeId:k?k.id:"",standortId:o.standort?o.standort.id:"",name,titel:o.titel,datum,art:"Anlagenpass",created:Date.now(),von:who(),size:blob.size};
  const idb=()=>new Promise((res,rej)=>{ const q=indexedDB.open("evse_protokolle"); q.onupgradeneeded=()=>{ const z=q.result; if(!z.objectStoreNames.contains("meta")) z.createObjectStore("meta",{keyPath:"id"}); if(!z.objectStoreNames.contains("blob")) z.createObjectStore("blob"); }; q.onsuccess=()=>res(q.result); q.onerror=()=>rej(q.error); });
  try{ const db=await idb(); if(db.objectStoreNames.contains("meta")){ const tx=db.transaction(["meta","blob"],"readwrite"); tx.objectStore("meta").put(x); tx.objectStore("blob").put(blob,x.id); await new Promise(ok=>{ tx.oncomplete=ok; tx.onerror=ok; }); } db.close(); }catch(e){}
  /* frühere Tage → „Ältere Stände“, gleicher Tag → ersetzen (wie bei der Legende) */
  if(DB.protokolle) [...DB.protokolle.values()].filter(r=>!r.deleted&&r.app==="anlagenpass"&&r.vtId===schl&&r.datum!==datum&&!r.archiv).forEach(r=>{ r.archiv=true; saveRec("protokolle",r); });
  if(typeof BB_PROT!=="undefined"){ BB_PROT.filter(y=>y.app==="anlagenpass"&&y.vtId===schl&&y.datum!==datum).forEach(y=>y.archiv=true);
    const alt=BB_PROT.filter(y=>y.app==="anlagenpass"&&y.vtId===schl&&y.datum===datum); alt.forEach(y=>{ if(typeof bbProtWeg==="function") bbProtWeg(y.id); });
    BB_PROT=BB_PROT.filter(y=>!alt.includes(y)); BB_PROT.push(x); }
  if(typeof bbProtMelden==="function") bbProtMelden(x);
  toast(typeof bbSync==="function"&&bbSync()?"Anlagenpass in der Bibliothek abgelegt":"Anlagenpass erstellt","Öffnen",()=>bbOeffnen(x.id)); }
/* Eintrag unter „Verteiler“ beim Kunden: je Objekt mit Verteilern oder Prüfungen ein Anlagenpass */
function apEintraege(kind,r){ const orte=vtOrte(kind,r);
  return orte.map(o=>{ const g=vtGeb(ecGebId(o)); if(!g) return ""; const nP=live("echecks").filter(p=>String(p.ortId)===String(o)).length; if(!g.verteiler.length&&!nP) return "";
    const ort=ecOrt(o), sub=[ort.standort?ort.standort.name:"",`${g.verteiler.length} Verteiler`,`${nP} Prüfung${nP===1?"":"en"}`].filter(Boolean).join(" · ");
    return `<div class="li" role="button" tabindex="0" data-act="apMachen" data-g="${esc(g.id)}"><span class="av">${icon("doc")}</span><span class="lt"><span class="h">Anlagenpass erstellen</span><span class="s">${esc(sub)} · PDF für Kunde oder Hausverwaltung</span></span>${icon("chev")}</div>`; }).join(""); }
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act="apMachen"]'); if(!b) return; e.stopPropagation(); apMachen(b.dataset.g); },true);
