/* ===== Verteiler (Gebäudetechnik) =====
   Ein Verteiler = ein Eintrag in gebaeude.verteiler des Orts (wie bei den Prüfungen und in der Übersicht).
   Seine Geräte liegen dort, wo die Prüfung sie schon kennt: RCDs in gebaeude.rcds, Stromkreise in gebaeude.stromkreise,
   Reserven und Zwischenüberschriften in gebaeude.vtTeile. Reihenfolge (pos), Breite (te), Reihenumbruch (umbruch) und Symbol (sym)
   stehen an den Einträgen selbst. Die Seite nutzt den Editor der Verteilerlegende (legende.js) über eine „virtuelle Legende“. */
const vtGeb=gid=>{ const g=DB.gebaeude.get(gid); return g&&!g.deleted?ecGebNorm(g):null; };
const vtRcdSchutz=r=>{ const t=[r.in&&`${r.in} A`,r.idn&&`${r.idn} mA`].filter(Boolean).join(" / "); return [t,r.typ&&`Typ ${r.typ}`].filter(Boolean).join(" "); };
function vtRcdLesen(t){ t=String(t||""); const a=t.match(/(\d+)\s*A(?![a-z])/i), m=t.match(/(\d+)\s*mA/i), y=t.match(/Typ\s*([A-Z+]+)/i); return {in:a?a[1]:"",idn:m?m[1]:"",typ:y?y[1].toUpperCase():""}; }
/* Einträge eines Verteilers in Anzeige-Reihenfolge: mit pos sortiert, ältere Einträge ohne pos hinter ihren RCD */
function vtEintraege(g,vId){ const R=g.rcds.filter(r=>r.vId===vId), S=g.stromkreise.filter(s=>s.vId===vId), T=(g.vtTeile||[]).filter(t=>t.vId===vId);
  const zuE=(o,art)=>art==="rcd"?{id:o.id,art:"rcd",kz:o.nr||"",bez:o.bez||"Fehlerstromschutzschalter",schutz:vtRcdSchutz(o),te:o.te,umbruch:o.umbruch,sym:o.sym,_rcd:o}
    :art==="sk"?{id:o.id,art:"sk",kz:o.nr||"",bez:o.bez||"",schutz:o.schutz||"",pole:o.pole||1,te:o.te,umbruch:o.umbruch,sym:o.sym,_rcdId:o.rcdId}
    :{id:o.id,art:o.art,kz:o.kz||"",bez:o.bez||"",schutz:o.schutz||"",te:o.te,umbruch:o.umbruch,sym:o.sym};
  const mit=[...R.map(o=>[o,"rcd"]),...S.map(o=>[o,"sk"]),...T.map(o=>[o,o.art])].filter(([o])=>typeof o.pos==="number").sort((a,b)=>a[0].pos-b[0].pos).map(([o,a])=>zuE(o,a));
  const ohne=[]; [...R].sort(ecNr).forEach(r=>{ if(typeof r.pos!=="number") ohne.push(zuE(r,"rcd")); S.filter(s=>s.rcdId===r.id&&typeof s.pos!=="number").sort(ecNr).forEach(s=>ohne.push(zuE(s,"sk"))); });
  S.filter(s=>typeof s.pos!=="number"&&!R.some(r=>r.id===s.rcdId)).sort(ecNr).forEach(s=>ohne.push(zuE(s,"sk")));
  T.filter(t=>typeof t.pos!=="number").forEach(t=>ohne.push(zuE(t,t.art)));
  const E=[...mit];
  ohne.forEach(e=>{ let i=-1; if(e.art==="sk"&&e._rcdId){ for(let k=E.length-1;k>=0;k--){ if(E[k].id===e._rcdId||E[k]._rcdId===e._rcdId){ i=k; break; } } }
    if(i<0) E.push(e); else E.splice(i+1,0,e); });
  return E; }
/* Virtuelle Legende: alles, was der Editor braucht, aus dem Gebäude */
function vtL(gid,vId){ const g=vtGeb(gid), v=g&&g.verteiler.find(x=>x.id===vId); if(!v) return null; const o=ecOrt(g.ortId), k=o.kunde;
  return {_geb:gid,_v:vId,id:"vt-"+vId,titel:v.name||"Verteiler",kunde:k?k.name:"",anschrift:adrText(o.standort)||adrText(k)||"",kundeId:k?k.id:"",standortId:o.standort?o.standort.id:"",ortId:g.ortId,
    netz:v.netz||"",ersteller:v.ersteller||"",stand:v.stand||"",fertig:!!v.fertig,teReihe:v.teReihe,teMm:v.teMm,eintraege:vtEintraege(g,vId),updated:v.updated,createdBy:v.createdBy}; }
/* Zurückschreiben in das Gebäude (vorhandene Felder der Prüfung wie Leitung oder Messwerte bleiben erhalten) */
function vtSchreiben(L){ const g=vtGeb(L._geb), v=g&&g.verteiler.find(x=>x.id===L._v); if(!v) return;
  Object.assign(v,{name:L.titel||v.name,netz:L.netz||"",ersteller:L.ersteller||"",stand:L.stand||"",fertig:!!L.fertig,teReihe:L.teReihe,teMm:L.teMm,updated:Date.now()});
  ["teReihe","teMm"].forEach(k=>{ if(v[k]==null) delete v[k]; });
  const E=legE(L), ids=new Set(E.map(e=>e.id)), opt=(o,e)=>{ ["te","umbruch","sym"].forEach(k=>{ if(e[k]) o[k]=e[k]; else delete o[k]; }); };
  g.vtTeile=(g.vtTeile||[]).filter(t=>t.vId!==L._v||ids.has(t.id));
  const wegSk=g.stromkreise.filter(s=>s.vId===L._v&&!ids.has(s.id)).map(s=>s.id);
  g.stellen.forEach(st=>{ if(wegSk.includes(st.skId)) st.skId=""; });
  g.stromkreise=g.stromkreise.filter(s=>s.vId!==L._v||ids.has(s.id)); g.rcds=g.rcds.filter(r=>r.vId!==L._v||ids.has(r.id));
  let rcd="";
  E.forEach((e,pos)=>{ if(e.art==="gr") rcd="";
    if(e.art==="rcd"){ rcd=e.id; let r=g.rcds.find(x=>x.id===e.id); if(!r){ r={id:e.id,vId:L._v}; g.rcds.push(r); } const w=vtRcdLesen(e.schutz);
      Object.assign(r,{nr:e.kz||"",bez:e.bez||"",in:w.in||r.in||"",idn:w.idn||r.idn||"",typ:w.typ||r.typ||"",pos}); opt(r,e); return; }
    if(e.art==="sk"){ let s=g.stromkreise.find(x=>x.id===e.id); if(!s){ s={id:e.id,vId:L._v}; g.stromkreise.push(s); }
      Object.assign(s,{nr:e.kz||"",bez:e.bez||"",schutz:String(e.schutz||"").replace(/\s*3-polig$/i,""),pole:+e.pole||1,rcdId:rcd,pos}); opt(s,e); return; }
    let t=(g.vtTeile||[]).find(x=>x.id===e.id); if(!t){ t={id:e.id,vId:L._v}; g.vtTeile.push(t); }
    Object.assign(t,{art:e.art,kz:e.kz||"",bez:e.bez||"",schutz:e.schutz||"",pos}); opt(t,e); });
  ecGebSpeichern(g); }
/* Legende ohne Kunde → Verteiler im Gebäude des gewählten Orts */
function vtAusLegende(L,ortId){ const g=ecGeb(ortId), vId=uid();
  g.verteiler.push({id:vId,name:L.titel||"Verteiler",netz:L.netz||"",ersteller:L.ersteller||"",stand:L.stand||ecHeute(),fertig:!!L.fertig,...(L.teReihe?{teReihe:L.teReihe}:{}),...(L.teMm?{teMm:L.teMm}:{})});
  ecGebSpeichern(g);
  const V={_geb:g.id,_v:vId,titel:L.titel,netz:L.netz,ersteller:L.ersteller,stand:L.stand,fertig:L.fertig,teReihe:L.teReihe,teMm:L.teMm,eintraege:legE(L).map(e=>({...e}))};
  vtSchreiben(V); L.deleted=true; L.movedTo=g.id+"/"+vId; saveRec("legenden",L); return {g:g.id,id:vId}; }

/* ---- Verteiler eines Kunden / Standorts ---- */
function vtOrte(kind,r){ return kind==="kunden"?["k:"+r.id,...standorteVon(r.id).map(s=>s.id)]:[r.id]; }
function vtListe(orte){ const L=[]; orte.forEach(o=>{ const g=vtGeb(ecGebId(o)); if(g) g.verteiler.forEach(v=>L.push({g,v})); }); return L; }
function vtItem({g,v},mitOrt){ const n=g.stromkreise.filter(s=>s.vId===v.id).length, o=mitOrt&&!String(g.ortId).startsWith("k:")?ecOrt(g.ortId):null;
  return `<div class="li" role="button" tabindex="0" data-act="vtAuf" data-g="${esc(g.id)}" data-id="${esc(v.id)}"><span class="av">${icon("ecMess")}</span>
    <span class="lt"><span class="h">${esc(v.name||"Verteiler")}</span><span class="s">${esc([o&&o.standort&&o.standort.name,`${n} Stromkreis${n===1?"":"e"}`,v.stand&&"Stand "+ecDatum(v.stand)].filter(Boolean).join(" · "))}</span>
    ${v.fertig?`<span class="st">${pill("ok","abgeschlossen")}</span>`:""}</span>${icon("chev")}</div>`; }
function vtBeiKunde(kind,r){ const V=vtListe(vtOrte(kind,r)), Lg=typeof legVon==="function"?legVon(kind,r.id):[];
  return kdKopf("Verteiler","vtNeu","Verteiler anlegen",` data-kind="${kind}" data-id="${esc(r.id)}"`)
    +(V.length||Lg.length?listOf([...V.map(x=>vtItem(x,kind==="kunden")),...Lg.map(L=>legItem(L,kind==="kunden"))]):`<p class="meta">Noch kein Verteiler. Hier entsteht der Verteiler mit Reihen, Stromkreisen, Legende und Beschriftung – auch für die Bestandsaufnahme.</p>`); }
let vtNeuBei=null;
function vtNeuDlg(kind,id){ const s=kind==="standorte"&&standortOf(id), k=kind==="kunden"?kundeOf(id):s?kundeOf(s.kundeId):null; if(!k) return;
  vtNeuBei={kid:k.id,ort:s?s.id:null};
  dialog("Neuer Verteiler",`<div class="fg1">${tf("legVt","Bezeichnung",LEG_VT[0],{form:true,ph:"z. B. HV Keller"})}</div>
    <div class="chips ec-wahl">${LEG_VT.map(v=>`<button type="button" class="chip" data-act="legSetz" data-ziel="f_legVt" data-v="${esc(v)}">${esc(v)}</button>`).join("")}</div>
    ${s?"":`<div class="fg1" style="margin-top:14px">${ecOrtFeld(k.id)}</div>`}`,
    `<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="vtNeuOk">Anlegen</button>`,{breit:true}); }
function vtNeuOk(){ const F=formVals(), B=vtNeuBei; if(!B) return; const ortId=B.ort||F.ecOrt||"k:"+B.kid, g=ecGeb(ortId), id=uid();
  g.verteiler.push({id,name:F.legVt||"Verteiler",stand:ecHeute(),ersteller:(n=>legTeam().includes(n)?n:"")(ME.name||(META.profil&&META.profil.name)||"")});
  ecGebSpeichern(g); vtNeuBei=null; closeOverlays(); go({v:"vt",g:g.id,id}); }
/* Einträge für die Liste unter Installation */
function vtListenEintraege(){ const L=[]; for(const g0 of live("gebaeude")){ const g=ecGebNorm(g0), o=ecOrt(g.ortId);
    g.verteiler.forEach(v=>{ const n=g.stromkreise.filter(s=>s.vId===v.id).length;
      L.push({vt:{g,v},id:"vt-"+v.id,kundeId:o.kunde?o.kunde.id:"",status:v.fertig?"fertig":"",datum:v.stand||"",updated:v.updated||g0.updated,titel:o.titel,pruefer:v.ersteller||"",
        such:[v.name,o.titel,v.ersteller,"Verteiler"].join(" "),n}); }); }
  return L; }
function vtListenItem({g,v}){ const o=ecOrt(g.ortId), n=g.stromkreise.filter(s=>s.vId===v.id).length;
  return `<div class="li" role="button" tabindex="0" data-act="vtAuf" data-g="${esc(g.id)}" data-id="${esc(v.id)}"><span class="av">${icon("ecMess")}</span>
    <span class="lt"><span class="h">${esc(o.titel)}</span><span class="s">${esc(["Verteiler",v.name,`${n} Stromkreis${n===1?"":"e"}`,v.stand&&ecDatum(v.stand),v.ersteller].filter(Boolean).join(" · "))}</span>
    <span class="st">${v.fertig?pill("ok","abgeschlossen"):pill("wip","in Arbeit")}</span></span>${icon("chev")}</div>`; }
function vtZuruck(gid){ const g=vtGeb(gid), o=g&&ecOrt(g.ortId); return o&&o.standort?{v:"standort",id:o.standort.id}:o&&o.kunde?{v:"kunde",id:o.kunde.id}:{v:"anlagen"}; }

document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act^="vt"]'); if(!b||b.disabled) return; e.stopPropagation(); const a=b.dataset.act;
  if(a==="vtAuf"){ go({v:"vt",g:b.dataset.g,id:b.dataset.id}); return; }
  if(a==="vtNeu"){ vtNeuDlg(b.dataset.kind,b.dataset.id); return; }
  if(a==="vtNeuOk"){ vtNeuOk(); return; } },true);
