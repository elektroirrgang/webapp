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
  const zuE=(o,art)=>art==="rcd"?{id:o.id,art:"rcd",kz:o.nr||"",bez:o.bez||"Fehlerstromschutzschalter",schutz:vtRcdSchutz(o),te:o.te,umbruch:o.umbruch,sym:o.sym,mat:o.mat,_rcd:o}
    :art==="sk"?{id:o.id,art:"sk",kz:o.nr||"",bez:o.bez||"",schutz:o.schutz||"",pole:o.pole||1,te:o.te,umbruch:o.umbruch,sym:o.sym,mat:o.mat,_rcdId:o.rcdId}
    :{id:o.id,art:o.art,kz:o.kz||"",bez:o.bez||"",schutz:o.schutz||"",te:o.te,umbruch:o.umbruch,sym:o.sym,mat:o.mat};
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
    netz:v.netz||"",ersteller:v.ersteller||"",stand:v.stand||"",fertig:!!v.fertig,art:v.art,montage:v.montage,reihen:v.reihen,zs:v.zs,gerHerst:v.gerHerst,typFrei:!!v.typFrei,teReihe:v.teReihe,teMm:v.teMm,eti:v.eti,eintraege:(E=>{ if(!v.fertig) legNummern(E); return E; })(vtEintraege(g,vId)),updated:v.updated,createdBy:v.createdBy}; }
/* Zurückschreiben in das Gebäude (vorhandene Felder der Prüfung wie Leitung oder Messwerte bleiben erhalten) */
function vtSchreiben(L){ const g=vtGeb(L._geb), v=g&&g.verteiler.find(x=>x.id===L._v); if(!v) return;
  Object.assign(v,{name:L.titel||v.name,netz:L.netz||"",ersteller:L.ersteller||"",stand:L.stand||"",fertig:!!L.fertig,teReihe:L.teReihe,teMm:L.teMm,montage:L.montage,reihen:L.reihen,updated:Date.now()}); if(L.typFrei) v.typFrei=true; else delete v.typFrei; if(L.eti&&Object.keys(L.eti).length) v.eti=L.eti; else delete v.eti; if(L.zs) v.zs=L.zs;
  ["teReihe","teMm","montage","reihen"].forEach(k=>{ if(v[k]==null) delete v[k]; });
  const E=legE(L), ids=new Set(E.map(e=>e.id)), opt=(o,e)=>{ ["te","umbruch","sym","mat"].forEach(k=>{ if(e[k]) o[k]=e[k]; else delete o[k]; }); };
  g.vtTeile=(g.vtTeile||[]).filter(t=>t.vId!==L._v||ids.has(t.id));
  const wegSk=g.stromkreise.filter(s=>s.vId===L._v&&!ids.has(s.id)).map(s=>s.id);
  g.stellen.forEach(st=>{ if(wegSk.includes(st.skId)) st.skId=""; });
  g.stromkreise=g.stromkreise.filter(s=>s.vId!==L._v||ids.has(s.id)); g.rcds=g.rcds.filter(r=>r.vId!==L._v||ids.has(r.id));
  let rcd="";
  E.forEach((e,pos)=>{ if(e.art==="gr") rcd="";
    if(e.art==="rcd"){ rcd=e.id; let r=g.rcds.find(x=>x.id===e.id); if(!r){ r={id:e.id,vId:L._v}; g.rcds.push(r); } const w=vtRcdLesen(e.schutz);
      Object.assign(r,{nr:e.kz||"",bez:e.bez||"",in:w.in||r.in||"",idn:w.idn||r.idn||"",typ:w.typ||r.typ||"",pos}); opt(r,e); return; }
    if(e.art==="sk"){ let s=g.stromkreise.find(x=>x.id===e.id); if(!s){ s={id:e.id,vId:L._v}; g.stromkreise.push(s); } const rb=legIstRcbo(e); if(rb) rcd="";
      Object.assign(s,{nr:e.kz||"",bez:e.bez||"",schutz:String(e.schutz||"").replace(/\s*3-polig$/i,""),pole:+e.pole||1,rcdId:rb?"":rcd,pos}); opt(s,e); return; }
    let t=(g.vtTeile||[]).find(x=>x.id===e.id); if(!t){ t={id:e.id,vId:L._v}; g.vtTeile.push(t); }
    Object.assign(t,{art:e.art,kz:e.kz||"",bez:e.bez||"",schutz:e.schutz||"",pos}); opt(t,e); });
  ecGebSpeichern(g); }
/* Legende ohne Kunde → Verteiler im Gebäude des gewählten Orts */
function vtAusLegende(L,ortId){ const g=ecGeb(ortId), vId=uid();
  g.verteiler.push({id:vId,name:L.titel||"Verteiler",netz:L.netz||"",ersteller:L.ersteller||"",stand:L.stand||ecHeute(),fertig:!!L.fertig,...(L.teReihe?{teReihe:L.teReihe}:{}),...(L.teMm?{teMm:L.teMm}:{}),...(L.art?{art:L.art}:{}),...(L.montage?{montage:L.montage}:{}),...(L.reihen?{reihen:L.reihen}:{}),...(L.zs?{zs:L.zs}:{})});
  ecGebSpeichern(g);
  const V={_geb:g.id,_v:vId,titel:L.titel,netz:L.netz,ersteller:L.ersteller,stand:L.stand,fertig:L.fertig,teReihe:L.teReihe,teMm:L.teMm,montage:L.montage,reihen:L.reihen,eintraege:legE(L).map(e=>({...e}))};
  vtSchreiben(V); L.deleted=true; L.movedTo=g.id+"/"+vId; saveRec("legenden",L); return {g:g.id,id:vId}; }

/* ---- Verteiler eines Kunden / Standorts ---- */
function vtOrte(kind,r){ return kind==="kunden"?["k:"+r.id,...standorteVon(r.id).map(s=>s.id)]:[r.id]; }
/* Reihenfolge wie die Einspeisung: HV, darunter die daraus gespeisten UVs (vonVId) */
function vtListe(orte){ const L=[]; orte.forEach(o=>{ const g=vtGeb(ecGebId(o)); if(!g) return; const V=g.verteiler, da=new Set(V.map(v=>v.id)), gesehen=new Set();
  const lauf=(v,t)=>{ if(gesehen.has(v.id)) return; gesehen.add(v.id); L.push({g,v,t}); V.filter(x=>x.vonVId===v.id).forEach(x=>lauf(x,t+1)); };
  V.filter(v=>!v.vonVId||!da.has(v.vonVId)).forEach(v=>lauf(v,0)); V.forEach(v=>lauf(v,0)); }); return L; }
function vtItem({g,v},mitOrt){ const n=g.stromkreise.filter(s=>s.vId===v.id).length, o=mitOrt&&!String(g.ortId).startsWith("k:")?ecOrt(g.ortId):null, von=v.vonVId&&g.verteiler.find(x=>x.id===v.vonVId);
  return `<div class="li" role="button" tabindex="0" data-act="vtAuf" data-g="${esc(g.id)}" data-id="${esc(v.id)}"><span class="av">${icon("ecMess")}</span>
    <span class="lt"><span class="h">${esc(v.name||"Verteiler")}</span><span class="s">${esc([o&&o.standort&&o.standort.name,von&&`aus ${von.name||"Verteiler"}`,`${n} Stromkreis${n===1?"":"e"}`,v.stand&&"Stand "+ecDatum(v.stand)].filter(Boolean).join(" · "))}</span>
    ${v.fertig?`<span class="st">${pill("ok","abgeschlossen")}</span>`:""}</span>${icon("chev")}</div>`; }
function vtBeiKunde(kind,r){ const V=vtListe(vtOrte(kind,r)), Lg=typeof legVon==="function"?legVon(kind,r.id):[];
  return `<div class="sec-row"><div class="sec-lbl">Verteiler</div><span class="ab-btns"><button class="ab-ic" data-act="vtImp" data-kind="${kind}" data-id="${esc(r.id)}" aria-label="Liste einfügen" title="Liste einfügen – Legende schnell aus einer Liste">${icon("vtListe")}</button><button class="ab-ic" data-act="vtNeu" data-kind="${kind}" data-id="${esc(r.id)}" aria-label="Verteiler anlegen" title="Verteiler anlegen">${icon("add")}</button></span></div>`
    +(V.length||Lg.length?listOf([...V.map(x=>vtItem(x,kind==="kunden")),...Lg.map(L=>legItem(L,kind==="kunden"))]):`<p class="meta">Noch kein Verteiler. Hier entsteht der Verteiler mit Reihen, Stromkreisen, Legende und Beschriftung – auch für die Bestandsaufnahme.</p>`)
    +(typeof apEintraege==="function"?(h=>h?`<div class="list ap-liste">${h}</div>`:"")(apEintraege(kind,r)):""); }
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
function vtListenEintraege(){ const L=[]; for(const g0 of live("gebaeude")){ if(typeof ortTotSicher==="function"&&ortTotSicher(g0.ortId)) continue; const g=ecGebNorm(g0), o=ecOrt(g.ortId);
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
  if(a==="vtNeu"){ awNeuStart(b.dataset.kind,b.dataset.id); return; }
  if(a==="vtNeuOk"){ vtNeuOk(); return; }
  if(a==="vtImp"){ vtImpDlg(b.dataset.kind,b.dataset.id); return; }
  if(a==="vtImpHier"){ vtImpHier(); return; }
  if(a==="vtImpOk"){ vtImpAnlegen(); return; }
  if(a==="vtImpDatei"){ vtImpDatei(); return; } },true);
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('#dlg [data-act^="vti"]'); if(!b||b.disabled) return; const a=b.dataset.act;
  if(a==="vtiWeiter"){ e.stopPropagation(); if(vtiPruefSchritt(vtiSchritt+1)) vtiZeig(vtiSchritt+1); return; }
  if(a==="vtiZurueck"){ e.stopPropagation(); vtiZeig(Math.max(1,vtiSchritt-1)); return; }
  if(a==="vtiSchritt"){ e.stopPropagation(); const n=+b.dataset.s; if(n<=vtiSchritt||vtiPruefSchritt(n)) vtiZeig(n); return; }
  if(a==="vtiZielW"){ e.stopPropagation(); const z=document.getElementById("f_vtiZiel"); if(z) z.value=b.dataset.v; b.parentElement.querySelectorAll(".vti-ziel").forEach(x=>x.setAttribute("aria-pressed",x===b));
    const neu=document.querySelector("#dlg .vti-neu"); if(neu) neu.hidden=!!b.dataset.v; return; } },true);

/* ===== Liste einfügen: Legende schnell aus einer Liste (Papierliste abgetippt, aus Excel kopiert oder als Datei) =====
   Eine Zeile pro Gerät, Spalten mit ; oder Tab (oder |). Die Reihenfolge der Spalten ist egal – erkannt wird am Inhalt:
     Kennzeichen (F 1.0.1, F3, -Q1), Schutz (B16, C 32 3-polig, FI 40A 30mA Typ A, FI/LS B16 30mA), Leitung (NYM-J 3x2,5), Rest = Bezeichnung.
   „# Text“ = Überschrift, „Reserve“ = Reserveplatz. LS-Zeilen unter einem FI gehören zu ihm; alternativ Spalte „FI1“/„FI 2“ als Verweis.
   Fehlende Kennzeichen vergibt die App nach eurem Schema (F 1.0 / F 1.0.1 …). Übernommen wird über vtSchreiben – wie aus dem Editor. */
IC.vtListe=IC.vtListe||"M14 10H3v2h11v-2zm0-4H3v2h11V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM3 16h7v-2H3v2z";
const VTI_BSP="FI 1\nB16; Küche\nB16; Flur\nHerd 3-polig\nReserve\n---\nFI 2\nKinderzimmer\nGarage";
const vtiRcbo=t=>/FI\s*\/\s*LS|LS\s*\/\s*FI|RCBO/i.test(t);
const vtiRcd=t=>!vtiRcbo(t)&&(/\b(FI|RCD|RCCB|Fehlerstrom)/i.test(t)||/\d\s*mA\b/i.test(t)||/\b0[,.]03\s*A\b/i.test(t));
const vtiLs=t=>/(^|[^A-Za-z])[BCDKZ]\s?(6|10|13|16|20|25|32|35|40|50|63|80|100|125)(\s?A)?(?![\d])/i.test(t)||/^(LS\s*)?\d{1,3}\s?A$/i.test(t.trim());
const vtiKz=t=>/^-?(F|Q)\s?\d+(\.\d+)*$/i.test(t.trim())||/^\d{1,3}$/.test(t.trim());
const vtiFiRef=t=>{ const m=t.trim().match(/^(FI|RCD)\s*-?\s*(\d+)$/i); return m?+m[2]:0; };
const vtiLeitung=t=>/\b(NYM|NYY|NHXMH|H07|H05|J-?Y|Cu|mm²|mm2)\b|\b\d\s?[x×]\s?\d+([,.]\d+)?\b/i.test(t);
function vtiPole(t){ return /\b(3|4|drei|vier)\s?-?\s?(p|pol|polig|phasig)\b|\b3\s?[x×]\s?[BCD]|\b3L\b|400\s?V|3~|dreh/i.test(t)?3:1; }
function vtiRcdSchutz(t){ const s=t.replace(/(\d)[,.](\d)/g,"$1.$2"), A=s.match(/(\d{2,3})\s*A(?![a-z])/i), m=s.match(/(\d{2,3})\s*mA/i)||(/\b0\.03\s*A/i.test(s)?[0,"30"]:/\b0\.3\s*A/i.test(s)?[0,"300"]:null),
    y=s.match(/Typ\s*(A|B\+?|F|AC|EV)\b/i)||s.match(/\b(A|B\+?|F)\s*$/);
  const w={in:A?A[1]:"",idn:m?m[1]:"",typ:y?y[1].toUpperCase():""}; return vtRcdSchutz(w)||(/^(fi|rcd|rccb|fehlerstrom\w*)$/i.test(t.trim())?"":t.trim()); }
function vtiLsSchutz(t){ const s=t.replace(/\s+/g," ").trim(), m=s.match(/(^|[^A-Za-z])([BCDKZ])\s?(\d{1,3})(\s?A)?(?!\d)/i), a=s.match(/^(?:LS\s*)?(\d{1,3})\s?A$/i);
  let r=m?m[2].toUpperCase()+m[3]:a?a[1]+" A":s;
  if(vtiRcbo(s)){ const mm=s.match(/(\d{2,3})\s*mA/i), y=s.match(/Typ\s*(A|B\+?|F|AC)\b/i); r+=` FI/LS ${mm?mm[1]:"30"} mA Typ ${y?y[1].toUpperCase():"A"}`; }
  return r; }
const VTI_LEER=/^(leer|frei|leerplatz|leerfeld|blind\w*|abdeckung)$/i;
const VTI_GERAET=/\b(NEOZED|NEOZET|NEOSET|Neozed|D0[1-3]|SLS|Hauptschalter|Lasttrenn\w*|Überspannung\w*|ÜSS|Schütz|Stromstoß\w*|Zeitschalt\w*|Klingeltrafo|Trafo|Transformator|Netzteil|Zeitrel\w*|Relais\w*|Treppenlicht\w*|Dämmerungs\w*)\b/i;
function vtImpLesen(text){ const E=[], fehlt=[]; let rcdNr=0, umbruch=false; const rcds=[];
  const neu=e=>{ if(umbruch){ e.umbruch=true; umbruch=false; } if(curAnz) e._anz=true; E.push(e); return e; };
  const roh=String(text||"").replace(/\r/g,"").split("\n").map(z=>z.trim()).filter(z=>z&&!z.startsWith("//")), zeilen=[], exp=new Set(); let curAnz=false;
  roh.forEach(z=>{ const m=z.match(/^(\d{1,2})\s*[x×]\s*(.+)$/i); if(m&&+m[1]>0){ for(let i=0;i<Math.min(+m[1],48);i++){ exp.add(zeilen.length); zeilen.push(m[2].trim()); } } else zeilen.push(z); });
  zeilen.forEach((z,zi)=>{ curAnz=exp.has(zi);
    if(zi===0&&/\b(bezeichnung|schutz|kennz|stromkreis|nr\.?)\b/i.test(z)&&!vtiLs(z)&&!vtiRcd(z)) return;   /* Kopfzeile aus Excel */
    /* „Fi“ ohne Nummer/Werte = ein TE des FI: mehrere „Fi“ direkt hintereinander sind EIN FI mit so vielen TE (z. B. 4× Fi = 4-poliger FI, 4 TE) */
    if(/^(fi|rcd)$/i.test(z)){ const v=E[E.length-1]; if(v&&v.art==="rcd"&&v._te&&!umbruch){ v._te++; v.te=v._te; return; }
      rcdNr++; const e={id:uid(),art:"rcd",kz:`FI ${rcdNr}`,bez:"",schutz:"",_nr:rcdNr,_te:1}; rcds.push(e); neu(e); return; }
    if(/^#/.test(z)){ neu({id:uid(),art:"gr",bez:z.replace(/^#+\s*/,""),kz:"",schutz:""}); return; }
    if(/^(-{2,}|_{2,}|=+|neue reihe|reihe\s*\d*)$/i.test(z)){ umbruch=true; return; }
    /* Anzahl nur mit x: „3x leer“ = 3 Leerplätze, „2x Reserve“ = 2 Reserve-Automaten. „6 Reserve“ = Platz 6 ist ein Reserve-Automat */
    if(VTI_LEER.test(z)){ neu({id:uid(),art:"res",kz:"",bez:"",schutz:""}); return; }
    if(VTI_GERAET.test(z)){ const T=(/[;\t|]/.test(z)?z.split(/[;\t|]/):[z]).map(f=>f.trim()).filter(Boolean); let kz=""; if(T.length>1&&vtiKz(T[0])) kz=T.shift();
      const typ=T.find(f=>VTI_GERAET.test(f))||"", bez=T.filter(f=>f!==typ).join(" "); neu({id:uid(),art:"ge",kz,bez:bez||typ,schutz:bez?typ:"",te:vtiPole(z)===3?3:1}); return; }
    let vorn=""; { const m=!/[;\t|]/.test(z)&&z.match(/^(\d{1,3})(?:[.)]\s*|\s+)(?![AaxX×]\b)(\D.*)$/); if(m){ vorn=m[1]; z=m[2].trim(); } }
    const F=(/[;\t|]/.test(z)?z.split(/[;\t|]/):z.split(/\s{2,}/)).map(f=>f.trim()).filter(Boolean);
    let kz="", schutz="", leitung="", ref=0; const rest=[];
    /* ohne Trennzeichen: „F3 B16 Küche“, „B16 Küche“ oder „Küche B16“ */
    const m1=F.length===1&&!vtiRcd(z)?z.match(/^(?:(-?[FQ]\s?\d+(?:\.\d+)*)\s+)?((?:FI\/LS\s+)?[BCDKZ]\s?\d{1,3}(?:\s?A)?(?:\s+\d{2,3}\s?mA)?(?:\s+Typ\s*[A-Z+]+)?(?:\s+3-?p(?:olig)?)?)\s+(?!\d{2,3}\s?mA(?:\s+Typ\s*[A-Z+]+)?$)(.+)$/i):null,
      m2=F.length===1&&!m1&&!vtiRcd(z)?z.match(/^(?:(-?[FQ]\s?\d+(?:\.\d+)*)\s+)?(?!(?:FI|LS)\s*\/)(.+?)\s+((?:FI\/LS\s+)?[BCDKZ]\s?\d{1,3}(?:\s?A)?(?:\s+\d{2,3}\s?mA)?(?:\s+Typ\s*[A-Z+]+)?(?:\s+3-?p(?:olig)?)?)$/i):null;
    if(m1){ kz=m1[1]||""; schutz=m1[2]; rest.push(m1[3]); } else if(m2){ kz=m2[1]||""; schutz=m2[3]; rest.push(m2[2]); }
    else F.forEach(f=>{ if(!kz&&vtiKz(f)) kz=f;
      else if(!schutz&&(vtiRcd(f)||vtiRcbo(f)||vtiLs(f))) schutz=f; else if(schutz&&!ref&&vtiFiRef(f)) ref=vtiFiRef(f);
      else if(!leitung&&vtiLeitung(f)&&!vtiLs(f)) leitung=f; else rest.push(f); });
    if(!kz&&vorn) kz=vorn;
    if(kz) kz=kz.replace(/^-/,"").replace(/^([A-Za-z]+)\s?(\d)/,(m,x,y)=>x.toUpperCase()+" "+y);
    const bez=rest.join(" ").replace(/\s+/g," ").trim(), alles=[schutz,bez].join(" ");
    if(VTI_LEER.test(bez)&&!schutz){ neu({id:uid(),art:"res",kz,bez:"",schutz:""}); return; }
    if(/^(reserve|res\.?)$/i.test(bez)&&!schutz){ const e=neu({id:uid(),art:"sk",kz,bez:"Reserve",schutz:"",pole:1}); return; }
    if(schutz&&vtiRcd(schutz)||!schutz&&vtiRcd(bez)&&/\d/.test(bez)){ rcdNr++;
      /* „FI 2“ allein = so ist der FI beschriftet → Kennzeichen, keine Werte */
      const nm=(schutz||bez).trim().match(/^(FI|RCD)\s*-?\s*(\d+)$/i); if(nm&&!kz){ kz=`${nm[1].toUpperCase()} ${nm[2]}`; if(schutz) schutz="FI"; else bez=""; }
      const e={id:uid(),art:"rcd",kz,bez:/^(FI|RCD)\b/i.test(bez)||vtiRcd(bez)?"":bez,schutz:vtiRcdSchutz(schutz||bez),_nr:rcdNr};
      if(nm) e.schutz=""; const p=/\b2\s?-?\s?(p|pol|polig)\b/i.test(alles)?2:0; if(p) e.te=2; rcds.push(e); neu(e); return; }
    const pol=vtiPole(alles), bez2=pol===3?bez.replace(/\s*\b(?:3|4|drei|vier)\s?-?\s?(?:p|pol|polig|phasig)\b\.?|\s*\bdrehstrom\b/gi,"").replace(/\s+/g," ").trim()||bez:bez;   /* „Herd 3-polig“ → Herd, 3-polig */
    const e={id:uid(),art:"sk",kz,bez:bez2,schutz:schutz?vtiLsSchutz(schutz):"",pole:pol}; if(vtiRcbo(schutz||"")&&e.pole!==3) e.te=2; if(leitung) e.leitung=leitung; if(ref) e._ref=ref; if(!schutz) fehlt.push(e.id);
    neu(e); });
  /* Verweise „FI 2“: Stromkreis hinter den zweiten FI (und dessen andere Stromkreise) setzen */
  if(E.some(e=>e._ref)){ const mitRef=E.filter(e=>e._ref&&rcds[e._ref-1]); const R=E.filter(e=>!mitRef.includes(e));
    mitRef.forEach(e=>{ const r=rcds[e._ref-1]; let i=R.indexOf(r); while(i+1<R.length&&R[i+1].art==="sk"&&!R[i+1]._frei) i++; R.splice(i+1,0,e); });
    E.length=0; E.push(...R); }
  /* Wie auf euren Listen: dreimal derselbe Name direkt hintereinander (CEE, CEE, CEE / Herd ×3) = EIN 3-poliger Automat */
  for(let i=0;i<E.length-2;i++){ const a=E[i], b=E[i+1], c=E[i+2], gl=(x,y)=>x.art==="sk"&&y.art==="sk"&&!x._anz&&!y._anz&&x.bez&&x.bez.toLowerCase()===y.bez.toLowerCase()&&(x.schutz||"")===(y.schutz||"")&&!y.umbruch&&+x.pole!==3&&+y.pole!==3;
    if(a.bez!=="Reserve"&&gl(a,b)&&gl(a,c)){ a.pole=3; [b,c].forEach(x=>{ const j=fehlt.indexOf(x.id); if(j>=0) fehlt.splice(j,1); }); E.splice(i+1,2); } }
  return {E,fehlt}; }
/* Fehlende Kennzeichen nach dem Schema der Legende vergeben (auch fortlaufend hinter vorhandenen Zeilen) */
function vtiKzVergeben(vorher,E){ const A=[...vorher];
  /* Ohne eigene Kennzeichen oder schon im BMK-Schema: Betriebsmittelkennzeichen -F1, -F2 … fortlaufend (legNummern) */
  const k=e=>String(e.kz||"").trim(), alle=[...vorher,...E].filter(e=>e.art==="sk"||e.art==="rcd");
  if(!alle.some(e=>k(e))||legSchemaNum([...vorher,...E])){
    E.forEach(e=>{ if((e.art==="sk"||e.art==="rcd")&&!k(e)) e._auto=true; });
    const kopie=[...vorher.map(x=>({...x})),...E]; if(!kopie.some(e=>k(e))&&kopie.length) E.forEach(e=>{ if(legBmkArt(e)) e.kz="-F0"; }); legNummern(kopie); return E; }
  E.forEach(e=>{ if(e.art==="sk"||e.art==="rcd"){ if(!e.kz){ e.kz=e.art==="rcd"?legRcdKz(A,A.length-1,false):legNaechsteKz(A,A.length-1)||"F 1"; e._auto=true; } } A.push(e); }); return E; }
/* Reihe je Eintrag wie im Editor: neue Reihe bei „umbruch“ oder wenn die 12 TE voll sind */
function vtiReihen(E,teR){ const n=teR||12; let r=0, te=0, erst=true; return E.map(e=>{ if(e.art==="gr") return r||1; const w=Math.min(legTE(e),n);
  if(erst){ r=1; te=0; erst=false; } else if(e.umbruch||te+w>n){ r++; te=0; } te+=w; return r; }); }
let vtImp=null;
function vtImpZiele(kid){ const orte=["k:"+kid,...standorteVon(kid).map(s=>s.id)], L=[]; orte.forEach(o=>{ const g=vtGeb(ecGebId(o)); if(g) g.verteiler.forEach(v=>L.push({g,v,o})); }); return L; }
/* „Liste einfügen“ in drei Schritten (04.11.2026): 1 Verteiler · 2 Stromkreise · 3 Prüfen. Alle Felder bleiben im Dialog, nur der Schritt wird umgeschaltet. */
let vtiSchritt=1;
function vtImpDlg(kind,id,vorwahl){ const s=kind==="standorte"&&standortOf(id), k=kind==="kunden"?kundeOf(id):s?kundeOf(s.kundeId):null; if(!k) return;
  const Z=vtImpZiele(k.id).filter(x=>!s||x.o===s.id); vtImp={kid:k.id,ort:s?s.id:null,Z};
  const ziel=vorwahl||"", ss=s?[]:standorteVon(k.id), hv=(Z.find(x=>x.v.art==="hv"||/^hv\b|haupt/i.test(x.v.name||""))||Z[0]||{v:{}}).v.id||"";
  const wahl=(v,ic,t,u)=>`<button type="button" class="vti-ziel" data-act="vtiZielW" data-v="${esc(v)}" aria-pressed="${v===ziel}"><span class="av">${icon(ic)}</span><span class="lt"><span class="h">${esc(t)}</span>${u?`<span class="s">${esc(u)}</span>`:""}</span><span class="vti-radio"></span></button>`;
  dialog("Liste einfügen",`<div class="vti-stepper">${["Verteiler","Liste","Prüfen"].map((t,i)=>`<button type="button" class="vti-st" data-act="vtiSchritt" data-s="${i+1}"><b>${i+1}</b><span>${t}</span></button>`).join("")}</div>
    <div class="fg1">
      <section class="vti-s" data-s="1">
        <input type="hidden" id="f_vtiZiel" data-f="vtiZiel" value="${esc(ziel)}">
        ${Z.length?`<div class="lbl">Wohin kommt die Liste?</div><div class="vti-ziele">${wahl("","add","Neuer Verteiler","Wird beim Kunden neu angelegt")}${Z.map(x=>wahl(x.g.id+"|"+x.v.id,"zsSchrank",x.v.name||"Verteiler",`${x.g.stromkreise.filter(t=>t.vId===x.v.id).length} Stromkreise · Liste wird hinten angehängt`)).join("")}</div>`:""}
        <div class="vti-neu fg1"${ziel?" hidden":""}>
          ${tf("vtiName","Name des Verteilers",Z.length?"":"HV",{form:true,ph:"z. B. UV EG"})}
          <div class="vti-chips">${LEG_VT.map(v=>`<button type="button" class="chip" data-act="legSetz" data-ziel="f_vtiName" data-v="${esc(v)}">${esc(v)}</button>`).join("")}</div>
          ${Z.length?sf("vtiVon","Eingespeist aus",hv,[["","Hausanschluss / weiß ich nicht"],...Z.map(x=>[x.v.id,x.v.name||"Verteiler"])],{form:true}):""}
          ${ss.length?ecOrtFeld(k.id):""}
        </div>
      </section>
      <section class="vti-s" data-s="2" hidden>
        <div class="vti-wege">${vtiSR()?`<button type="button" class="vti-weg vti-mic" data-act="vtiDiktat">${icon("mic")}<span>Diktieren</span></button>`:""}${typeof kiAn==="function"&&kiAn()?`<button type="button" class="vti-weg vti-ki" data-act="vtiFoto">${icon("cam")}<span>Foto</span></button>`:""}<button type="button" class="vti-weg" data-act="vtImpDatei">${icon("ecImport")}<span>Datei laden</span></button></div>
        <div class="vti-rec" id="vtiRec" hidden>
          <div class="vti-rec-kreis" id="vtiRecKreis"><span class="w1"></span><span class="w2"></span><span class="kern">${icon("mic")}</span></div>
          <div class="vti-rec-zeit" id="vtiRecZeit">0:00</div><div class="vti-rec-txt" id="vtiRecTxt">Ich höre zu</div>
          <p class="vti-rec-tipp">Sprich die Stromkreise einfach der Reihe nach – Pausen zum Überlegen sind kein Problem. Zum Schluss auf „Fertig“, dann zeigt die App die Liste zum Prüfen.</p>
          <p class="vti-rec-bsp">„FI eins · F1 B16 Küche · Herd dreipolig · Reserve · neue Reihe“<br>„löschen“ nimmt das letzte Gerät wieder raus</p>
          <div class="vti-rec-k"><button type="button" class="btn-text" data-act="vtiRecAbbr">Verwerfen</button><button type="button" class="btn-filled vti-rec-ok" data-act="vtiRecOk">Fertig</button></div>
        </div>
        <div class="tf vti-text"><textarea id="vtiText" spellcheck="false" placeholder="${esc(VTI_BSP)}" aria-label="Liste, eine Zeile pro Gerät"></textarea></div>
        <p class="vti-tipp">Eine Zeile pro Gerät. Spalten mit ; oder Tab – direkt aus Excel kopierbar. <code>---</code> = neue Reihe, „# Text“ = Überschrift.</p>
      </section>
      <section class="vti-s" data-s="3" hidden>
        <div class="vti-nach" id="vtiNach" hidden><button type="button" class="vti-weg" data-act="vtiDiktat">${icon("mic")}<span>Weiter diktieren</span></button><button type="button" class="vti-weg" data-act="vtiSchritt" data-s="2">${icon("edit")}<span>Text ändern</span></button></div>
        <div id="vtiVorschau" class="vti-vor"></div>
        <details class="vti-gehoert" id="vtiGehoert" hidden><summary>Was die App gehört bzw. erkannt hat</summary><p></p></details>
      </section>
    </div>`,
    `<button class="btn-text vti-f" data-f="1" data-act="cancel">Abbrechen</button><button class="btn-text vti-f" data-f="23" data-act="vtiZurueck">Zurück</button><span style="flex:1"></span><button class="btn-filled vti-f" data-f="12" data-act="vtiWeiter">Weiter</button><button class="btn-filled vti-f" data-f="3" data-act="vtImpOk">Übernehmen</button>`,{breit:true});
  VTI_GEHOERT=""; vtiZeig(ziel?2:1); }
function vtiZeig(n){ if(n!==2&&VTI_SR) vtiDiktatStop(); vtiSchritt=n;
  document.querySelectorAll("#dlg .vti-s").forEach(x=>x.hidden=+x.dataset.s!==n);
  document.querySelectorAll("#dlg .vti-st").forEach(x=>{ const s=+x.dataset.s; x.classList.toggle("an",s===n); x.classList.toggle("fertig",s<n); });
  document.querySelectorAll("#dlg .vti-f").forEach(x=>x.hidden=!x.dataset.f.includes(String(n)));
  const neu=document.querySelector("#dlg .vti-neu"); if(neu) neu.hidden=!!vtImpAktZiel();
  if(n===3){ vtImpVorschau(); const g=document.getElementById("vtiGehoert"), nb=document.getElementById("vtiNach"); if(g){ g.hidden=!VTI_GEHOERT; g.querySelector("p").textContent=VTI_GEHOERT; } if(nb) nb.hidden=!VTI_GEHOERT||!vtiSR(); }
  const sc=document.querySelector("#dlg .dlg-body")||document.querySelector("#dlg"); if(sc) sc.scrollTop=0;
  if(n===2){ const ta=document.getElementById("vtiText"); if(ta&&!ta.value&&!matchMedia("(pointer:coarse)").matches) ta.focus(); } }
function vtiPruefSchritt(n){ /* darf man von vtiSchritt nach n? */
  if(n>1&&!vtImpAktZiel()&&!((document.getElementById("f_vtiName")||{}).value||"").trim()){ toast("Bitte einen Namen für den Verteiler eingeben"); vtiZeig(1); return false; }
  if(n>2&&!((document.getElementById("vtiText")||{}).value||"").trim()){ toast("Noch keine Stromkreise eingetragen"); vtiZeig(2); return false; }
  return true; }
function vtImpAktZiel(){ const z=document.getElementById("f_vtiZiel"); return z&&z.value?z.value.split("|"):null; }
function vtImpVorschau(){ const box=document.getElementById("vtiVorschau"); if(!box) return; const t=(document.getElementById("vtiText")||{}).value||"";
  const neu=document.querySelector("#dlg .vti-neu"); if(neu) neu.hidden=!!vtImpAktZiel();
  if(!t.trim()){ box.innerHTML=`<p class="meta">Vorschau erscheint, sobald etwas eingetragen ist.</p>`; return; }
  const {E,fehlt}=vtImpLesen(t), zi=vtImpAktZiel(), vorher=zi?legE(vtL(zi[0],zi[1])||{eintraege:[]}):[]; vtiKzVergeben(vorher,E);
  let inFi=false, rAlt=0; const RW=vtiReihen(E), RN=Math.max(0,...RW);
  /* Einbauplatz in der Vorschau (gilt so für einen neuen Verteiler; beim Anhängen verschiebt er sich hinter das Vorhandene) */
  const PLV=(()=>{ const n=12, out=[]; let r=0, t=0, erst=true; E.forEach((e,i)=>{ if(e.art==="gr"){ out[i]=""; return; } const w=Math.min(legTE(e),n); if(erst){ r=1; t=0; erst=false; } else if(e.umbruch||t+w>n){ r++; t=0; } out[i]=zi?"":legPlatzText({r,von:t+1,bis:t+w}); t+=w; }); return out; })();
  box.innerHTML=`<div class="vti-kopf"><b>${E.filter(e=>e.art==="sk").length} Stromkreise · ${E.filter(e=>e.art==="rcd").length} FI${E.some(e=>e.art==="res")?` · ${E.filter(e=>e.art==="res").length} Reserve`:""}${RN>1?` · ${RN} Reihen`:""}</b>${fehlt.length?`<span class="vti-warn">${fehlt.length}× kein Schutz erkannt</span>`:""}</div>`
   +E.map((e,i)=>{ const rk=e.art!=="gr"&&RN>1&&RW[i]!==rAlt?`<div class="vti-reihe">Reihe ${rAlt=RW[i]}</div>`:"";
     if(e.art==="gr"){ inFi=false; return `<div class="vti-z" data-art="gr">${esc(e.bez)}</div>`; } if(e.art==="rcd") inFi=true;
     const ein=e.art==="sk"||e.art==="res"?inFi:false;
     return rk+`<div class="vti-z" data-art="${e.art}"${ein?" data-ein":""}${fehlt.includes(e.id)?" data-warn":""}><span class="v-kz">${esc(e.kz)}${e._auto?"<i>*</i>":""}</span><span class="v-bz">${e.art==="ge"?`<b class="vti-ge">Gerät</b> `:""}${e.art==="res"?"<i>Leerplatz</i>":esc(e.bez||(e.art==="rcd"?"Fehlerstromschutzschalter":"–"))}</span><span class="v-sc">${esc([e.schutz,e.pole===3?"3-polig":""].filter(Boolean).join(" ")||(e.art==="res"||e.art==="ge"?"":"?"))}</span><span class="v-lt">${esc(PLV[i]||e.leitung||"")}</span></div>`; }).join("")
   +(E.some(e=>e._auto)?`<p class="meta" style="margin:8px 4px 0">* Kennzeichen von der App vergeben</p>`:""); }
document.addEventListener("input",e=>{ if(e.target&&e.target.id==="vtiText") vtImpVorschau(); });
document.addEventListener("change",e=>{ if(e.target&&e.target.id==="f_vtiZiel") vtImpVorschau(); });
function vtImpDatei(){ const i=document.createElement("input"); i.type="file"; i.accept=".txt,.csv,.tsv,text/plain,text/csv"; i.style.display="none"; document.body.appendChild(i);
  i.onchange=async()=>{ const f=i.files&&i.files[0]; i.remove(); if(!f) return; const buf=await f.arrayBuffer(); let t=new TextDecoder("utf-8").decode(buf); if(t.includes("�")) t=new TextDecoder("windows-1252").decode(buf);
    const ta=document.getElementById("vtiText"); if(ta){ ta.value=t.replace(/^﻿/,""); vtImpVorschau(); } }; i.click(); }
function vtImpAnlegen(){ const B=vtImp; if(!B) return; const t=(document.getElementById("vtiText")||{}).value||""; const {E}=vtImpLesen(t);
  if(!E.length){ toast("Die Liste ist leer"); return; }
  const F=formVals(), zi=vtImpAktZiel(); let gid, vId;
  if(zi){ [gid,vId]=zi; }
  else { const ortId=B.ort||F.ecOrt||"k:"+B.kid, g=ecGeb(ortId); vId=uid(); gid=g.id;
    const von=F.vtiVon&&g.verteiler.some(x=>x.id===F.vtiVon)?{vonVId:F.vtiVon}:{};
    g.verteiler.push({id:vId,name:F.vtiName||"Verteiler",stand:ecHeute(),ersteller:(n=>legTeam().includes(n)?n:"")(ME.name||(META.profil&&META.profil.name)||""),...von}); ecGebSpeichern(g); }
  const L=vtL(gid,vId); if(!L){ toast("Verteiler nicht gefunden"); return; }
  if(!zi){ const RW=vtiReihen(E,L.teReihe); L.reihen=Math.max(1,...RW); }
  vtiKzVergeben(legE(L),E); const neu=E.map(e=>{ const o={...e}; ["_auto","_ref","_nr","_te","_anz","leitung"].forEach(k=>delete o[k]); if(o.art==="rcd"&&+o.te===1) delete o.te; return o; });
  L.eintraege=[...legE(L),...neu]; legNummern(L.eintraege); vtSchreiben(L);
  const g2=vtGeb(gid); if(g2&&E.some(e=>e.leitung)){ E.forEach(e=>{ if(!e.leitung) return; const s=g2.stromkreise.find(x=>x.id===e.id); if(s) s.leitung=e.leitung; }); ecGebSpeichern(g2); }
  vtImp=null; closeOverlays(); go({v:"vt",g:gid,id:vId}); toast(`${E.filter(e=>e.art==="sk").length} Stromkreise und ${E.filter(e=>e.art==="rcd").length} FI übernommen`); }

/* Aus dem geöffneten Verteiler heraus: Ziel ist genau dieser Verteiler (Reiter Stromkreise und Fenster „Gerät“) */
function vtImpHier(){ if(nav.v!=="vt") return; const g=vtGeb(nav.g); if(!g) return; const o=ecOrt(g.ortId), gid=nav.g, vId=nav.id;
  if(typeof AW!=="undefined") AW=null; $("#dlg").classList.remove("aw"); closeOverlays();
  if(o.standort) vtImpDlg("standorte",o.standort.id,gid+"|"+vId); else if(o.kunde) vtImpDlg("kunden",o.kunde.id,gid+"|"+vId); }

/* ===== Legende diktieren (Feature 04.11.2026) =====
   Spracherkennung des Browsers (Chrome/Android: Google, Safari: Apple) – je erkannter Satz eine Zeile im Importformat,
   danach läuft alles wie beim Einfügen (Vorschau, FI-Gruppen, 3× = 3-polig, BMK). */
IC.mic=IC.mic||"M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z";
const vtiSR=()=>window.SpeechRecognition||window.webkitSpeechRecognition||null;
const VTI_ZAHL={ein:1,eins:1,einmal:1,zwei:2,zweimal:2,drei:3,dreimal:3,vier:4,viermal:4,fünf:5,fünfmal:5,sechs:6,sechsmal:6,sieben:7,siebenmal:7,acht:8,achtmal:8,neun:9,neunmal:9,zehn:10,zehnmal:10,elf:11,zwölf:12,dreizehn:13,sechzehn:16,zwanzig:20,fünfundzwanzig:25,zweiunddreißig:32};
/* gesprochener Satz → Zeilen im Importformat */
function vtiSprache(roh){ const Z=[];
  String(roh||"").split(/\s*(?:[,;]|\bnächster\b|\bnächste\b|\bweiter\b)\s*/i).map(s=>s.trim()).filter(Boolean).forEach(s=>{
    let z=s.replace(/[.!?]+$/,"").replace(/\s+/g," ").trim(); if(!z) return;
    /* typische Verhörer der Spracherkennung bei Elektro-Begriffen */
    z=z.replace(/^(kehrt|kert|hert|herz|heard|hört)\b/i,"Herd").replace(/\b(be|bee|beh)\s*(\d{1,2})\b/gi,"B$2").replace(/\b(ce|zeh|tse)\s*(\d{1,2})\b/gi,"C$2").replace(/\b(ef ih|eff i|f\.\s?i\.?)\b/gi,"FI").replace(/\breserven?\b/gi,"Reserve");
    /* Zahlwörter → Ziffern (nicht in Wörtern wie „Einfahrt“) */
    z=z.replace(/\b(einmal|zweimal|dreimal|viermal|fünfmal|sechsmal|siebenmal|achtmal|neunmal|zehnmal)\b/gi,w=>VTI_ZAHL[w.toLowerCase()]+"x").replace(/\b(\d+)\s*mal\b/gi,"$1x");
    z=z.replace(/\b([bck])\s*(\d{1,2}|sechzehn|zehn|dreizehn|zwanzig|fünfundzwanzig|zweiunddreißig)\b/gi,(m,c,n)=>c.toUpperCase()+(VTI_ZAHL[String(n).toLowerCase()]||n));
    z=z.replace(/\b(fehlerstromschutzschalter|fehlerstrom-schutzschalter|fi-schalter|f i|ef i)\b/gi,"FI").replace(/\b(fi|rcd)\s+(eins|zwei|drei|vier|fünf|sechs|\d)\b/gi,(m,f,n)=>"FI "+(VTI_ZAHL[String(n).toLowerCase()]||n));
    if(/^(neue|nächste) reihe$/i.test(z)){ Z.push("---"); return; }
    /* „Herd 3x“ → „3x Herd“ */
    const hinten=z.match(/^(.+?)\s+(\d{1,2})x$/i); if(hinten) z=`${hinten[2]}x ${hinten[1]}`;
    z=z.replace(/\b(drei|ein|vier|3|1|4)\s*-?\s*(polig|phasig|pol)\b/gi,(m,n)=>({drei:3,ein:1,vier:4}[n.toLowerCase()]||n)+"-polig").replace(/\b1-polig\b\s*/gi,"").trim();
    /* „Herd dreimal“ = dreimal untereinander → wird beim Einlesen ein 3-poliger Automat (Irrgang-Schreibweise); andere Anzahlen bleiben „Nx“ = einzelne Geräte */
    const drei=z.match(/^3x\s+(.+)$/i); if(drei){ const n=drei[1].charAt(0).toUpperCase()+drei[1].slice(1); Z.push(n,n,n); return; }
    /* Absicherung vorne mit ; trennen: „B16 Küche“ → „B16; Küche“ */
    z=z.replace(/^(\d+x\s+)?([BCK]\d{1,2})\s+(?!polig|dreipolig)(.+)$/i,(m,a,s2,r)=>`${a||""}${s2}; ${r}`);
    z=z.replace(/^(\d+x\s+)?(.)/,(m,a,c)=>(a||"")+c.toUpperCase());
    Z.push(z); });
  return Z; }

/* ===== Diktat als Ganzes verstehen (04.11.2026, 2. Fassung) =====
   Nicht mehr „jede Pause = neue Zeile“: alles Gesprochene wird gesammelt und als Folge von Bausteinen gelesen.
   Ein neues Gerät beginnt bei Kennzeichnung (F3), FI, Reserve/leer, „neue Reihe“, „nächster/weiter/Komma“ –
   oder wenn ein Gerät schon Name und Absicherung hat und wieder ein Name bzw. eine zweite Absicherung kommt.
   Eine Atempause trennt nur, wenn das Gerät davor schon einen Namen hat (und der nicht auf „und/mit …“ endet).
   „löschen“ / „streichen“ / „falsch“ nimmt das letzte Gerät wieder raus. */
const VTI_NR={eins:1,ein:1,zwei:2,zwo:2,drei:3,vier:4,fünf:5,sechs:6,sieben:7,acht:8,neun:9,zehn:10,elf:11,zwölf:12,dreizehn:13,vierzehn:14,fünfzehn:15,sechzehn:16,siebzehn:17,achtzehn:18,zwanzig:20,fünfundzwanzig:25,zweiunddreißig:32,vierzig:40,fünfzig:50,sechzig:60,dreiundsechzig:63};
const VTI_VERHOERT=[[/^(kehrt|kert|hert|herz|heard|hört)$/i,"Herd"]];
/* Erzähltes in Bausteine übersetzen: Füllwörter raus, Ordnungszahlen/„Reihe“, Geräte, Mengen („zwei B16 für A und B“) */
const VTI_ORD={erste:1,ersten:1,erster:1,zweite:2,zweiten:2,zweiter:2,dritte:3,dritten:3,dritter:3,vierte:4,vierten:4,vierter:4,fünfte:5,fünften:5,sechste:6,sechsten:6,siebte:7,siebten:7,achte:8,achten:8};
function vtiDiktatNorm(seg){
  let t=" "+seg.map(x=>String(x||"").trim()).filter(Boolean).join(" | ")+" ";
  t=t.replace(/[.!?,;:]+(?=\s|$)/g," | ").replace(/(\d)-(?=[A-Za-zÄÖÜäöü])/g,"$1 ").replace(/([A-Za-zÄÖÜäöüß])-(?=[A-Za-zÄÖÜäöü])/g,"$1 ");
  t=t.replace(/\bneo\s*z(?:ed|et)?\b(?:\s*(?:element|sockel|sicherung|lasttrenner))?/gi," Neozed ").replace(/\bneozed\s+(element|sockel|sicherung)\b/gi,"Neozed");
  t=t.replace(/\b(fi\s*\/\s*ls|fi\s+ls|ls\s*\/\s*fi|rcbos?|rcbo\s*schalter)\b/gi," RCBO ");
  t=t.replace(/\b(?:mit\s+)?(?:ein\s+bisschen|etwas|bisschen|einem|ein)?\s*(?:platz|lücke)(?:\s+(?:frei|dazwischen|daneben))?\b/gi," leer ");
  t=t.replace(/\b(?:in\s+)?(?:der|die|dem)?\s*(erste|ersten|erster|zweite|zweiten|zweiter|dritte|dritten|dritter|vierte|vierten|vierter|fünfte|fünften|sechste|sechsten|siebte|siebten|achte|achten)\s+reihe\b/gi," ⏎ ");
  t=t.replace(/\breihe\s+(\d|eins|zwei|drei|vier|fünf|sechs)\b/gi," ⏎ ").replace(/\b(neue|nächste)\s*\|?\s*reihe\b/gi," ⏎ ");
  t=t.replace(/\b(?:im|in\s+dem|in\s+der)?\s*(erste|ersten|zweite|zweiten|dritte|dritten)?\s*verteiler\s*feld\s*(\d|eins|zwei|drei)?\b/gi,(m,o,n)=>` ⧉${o?VTI_ORD[o.toLowerCase()]:n?(VTI_NR[n.toLowerCase()]||n):""} `);
  t=t.replace(/\b(und\s+)?einmal\b/gi," ‡ ").replace(/\bplus\b/gi," und ");
  t=t.replace(/\b(eins|zwei|zwo|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf|dreizehn|vierzehn|fünfzehn|sechzehn|siebzehn|achtzehn|zwanzig|fünfundzwanzig|zweiunddreißig|vierzig|fünfzig|sechzig|dreiundsechzig)\b/gi,w=>VTI_NR[w.toLowerCase()]);
  t=t.replace(/\b(ein|zwei|drei|vier)(polig|phasig)(e|en|er|es)?\b/gi,(m,n,w)=>(VTI_NR[n.toLowerCase()]||1)+" polig").replace(/\b(\d)\s*-?\s*(polig|phasig)(e|en|er|es)\b/gi,"$1 polig");
  t=t.replace(/\b(drei|vier|zwei)mal\b/gi,(m,n)=>VTI_NR[n.toLowerCase()]+" mal");
  /* Füllwörter */
  t=t.replace(/\b(sicherungs)?automat(en)?\b|\bleitungsschutzschalter\b|\bls\s*schalter\b|\bsicherungen?\b/gi," ");
  t=t.replace(/\b(also|ähm?|ähh|öhm|hm|dann|danach|daneben|dort|hier|da|drin|drinnen|haben|hat|habe|wir|ich|gibt|es|ist|sind|noch|wieder|nochmal|ja|jetzt|verbaut|eingebaut|sitzt|sitzen|zuständig|absichert|absichern|abgesichert|die|der|das|den|dem|des|ein|eine|einen|einem|einer|für|vom|zum|zur|was|welche|welcher|welches|in|auf|mit|dazu|okay|gut|genau)\b/gi," ");
  t=t.replace(/(\d)\s*\|\s*(?=-?\s*(polig|phasig|pol|mal|x)\b)/gi,"$1 ").replace(/\b([bcdk]|be|bee|zeh|ce|tse|f|ef|eff)\s*\|\s*(?=\d)/gi,"$1 ");
  t=t.replace(/\b(nächster|nächste|nächstes|weiter|komma)\b/gi," , ").replace(/(\s*\|\s*)+/g," | ");
  return t.replace(/\s+/g," ").trim(); }
function vtiDiktatLesen(seg){
  const t=vtiDiktatNorm(seg);
  const T=[]; let r=t, m;
  const RE=[["sep",/^,/],["pause",/^\|/],["reihe",/^⏎/],["feld",/^⧉(\d*)/],["teil",/^‡/],["weg",/^(löschen|lösch|streichen|streich|falsch)\b/i],
    ["kommentar",/^(aber|weil|wobei|obwohl|sondern|allerdings|macht|keinen|sinn)\b/i],
    ["rcbo",/^RCBO\b/],
    ["fi",/^(fehlerstrom\s*schutz\s*schalter|fehlerstromschutz|fi\s*schalter|fi|rcd|rccb|f\s?i)\b(?:\s*(\d{1,2})\b(?!\s*(?:a|ampere|ma|milliampere)\b))?/i],
    ["kz",/^-?(?:f|ef|eff)\s*-?\s*(\d{1,2})(?:\s*(?:\.|punkt)\s*(\d{1,2}))?\b/i],
    ["ls",/^(b|c|d|k|be|bee|zeh|ce|tse)\s*-?\s*(\d{1,3})\s*(?:a|ampere)?\b/i],
    ["ma",/^(\d{2,3})\s*(ma|milliampere)\b/i],["amp",/^(?:(typ\s*)?(a|f|b)\s+)?(\d{1,3})\s*(a|ampere)\b/i],["typ",/^typ\s*(a|b|f|ac)\b/i],
    ["anz",/^(\d)\s+(?=(?:(?:b|c|d|k|be|zeh)\s*-?\s*\d{1,3}\b|RCBO\b|reserve|neozed|leer))/i],
    ["pol",/^(\d)\s*-?\s*(polig|phasig|pol)\b/i],["pol3",/^(drehstrom|400\s?volt)\b/i],
    ["mal",/^(\d{1,2})\s*(mal|x)\b/i],["res",/^(reserve|reserven)\b/i],["leer",/^(leerplatz|leer|frei)\b/i],
    ["ge",new RegExp("^"+VTI_GERAET.source.replace(/^\\b/,""),"i")],["wort",/^[^\s|,⏎⧉‡]+/]];
  while(r){ r=r.replace(/^\s+/,""); if(!r) break; let ok=false;
    for(const [k,re] of RE){ if((m=r.match(re))){ T.push([k,m]); r=r.slice(m[0].length); ok=true; break; } }
    if(!ok) r=r.slice(1); }
  /* Reihenfolge erkennen: „Küche B16“ (Name zuerst) oder „B16 Küche“? */
  let wl=0, lw=0; { const Q=T.filter(([k])=>k!=="pause"); for(let i=1;i<Q.length;i++){ if(Q[i-1][0]==="wort"&&Q[i][0]==="ls") wl++; if(Q[i-1][0]==="ls"&&Q[i][0]==="wort"&&!(i>1&&Q[i-2][0]==="kz")) lw++; } }
  const nameZuerst=wl>lw;
  const STARK=["sep","reihe","feld","fi","rcbo","kz","ls","anz","res","leer","ge","weg"];
  const G=[]; let cur=null, vor="", weich=false, kom=false, anz=0, pol=0;
  const neu=o=>{ cur={name:[],...o}; if(anz){ cur.anz=anz; anz=0; } if(pol){ cur.pol=pol; pol=0; } G.push(cur); weich=false; return cur; };
  const offen=()=>cur&&!cur.art&&!weich;
  const naechst=i=>{ for(let j=i+1;j<T.length;j++) if(T[j][0]!=="pause") return T[j]; return null; };
  T.forEach(([k,m],i)=>{
    if(STARK.includes(k)) kom=false;
    if(k==="kommentar"){ kom=true; return; }
    if(kom&&k==="wort") return;
    if(k==="sep"){ cur=null; }
    else if(k==="pause"){ if(cur&&cur.name&&cur.name.length&&!/^(und|im|am|an|bis)$/i.test(cur.name[cur.name.length-1])) weich=true; return; }
    else if(k==="reihe"){ G.push({art:"reihe"}); cur=null; }
    else if(k==="feld"){ G.push({art:"feld",n:m[1]||""}); cur=null; }
    else if(k==="teil"){ if(cur&&!cur.art) cur.name.push("‡"); weich=false; }
    else if(k==="weg"){ const j=G.map(x=>x.art!=="reihe"&&x.art!=="feld").lastIndexOf(true); if(j>=0) G.splice(j,1); cur=null; }
    else if(k==="fi"){ cur={art:"fi",n:m[2]||"",pol}; pol=0; anz=0; G.push(cur); }
    else if(k==="rcbo") neu({rcbo:true});
    else if(k==="ma"||k==="typ"){ const z=G[G.length-1]; if(z&&(z.art==="fi"||z.rcbo)){ if(k==="ma") z.ma=m[1]; } }
    else if(k==="amp"){ const z=cur&&(cur.art==="fi"||cur.rcbo)?cur:null; if(z){ if(z.art==="fi") z.a=m[3]; else if(!z.ls) z.ls="B"+m[3]; } }
    else if(k==="kz") neu({kz:"F"+m[1]+(m[2]?"."+m[2]:"")});
    else if(k==="ls"){ const ls={b:"B",be:"B",bee:"B",c:"C",zeh:"C",ce:"C",tse:"C",d:"D",k:"K"}[m[1].toLowerCase()]+m[2], nx=naechst(i);
      if(cur&&cur.rcbo&&!cur.ls&&!cur.name.length) cur.ls=ls;
      else if(cur&&!cur.art&&!cur.ls&&!cur.res&&!cur.ge&&cur.name.length&&(nameZuerst||!nx||nx[0]!=="wort"||/^und$/i.test(nx[1][0]))) cur.ls=ls;   /* „Küche … B16“ */
      else if(offen()&&!cur.ls&&!cur.res&&!cur.ge&&!cur.name.length) cur.ls=ls; else neu({ls}); }
    else if(k==="anz"){ anz=+m[1]; cur=null; }
    else if(k==="pol"||k==="pol3"){ const n=k==="pol3"?3:+m[1], nx=naechst(i);
      if(nx&&["fi","rcbo","ls","ge","anz"].includes(nx[0])&&(vor===""||!cur||cur.ls||cur.art||["sep","reihe","feld","pause"].includes(vor))) pol=n;   /* „vierpoliger RCD“ */
      else { const z=cur&&cur.art==="fi"?cur:G.filter(x=>!x.art||x.art==="fi").pop(); if(z) z.pol=n; } }
    else if(k==="mal"){ const z=G.filter(x=>!x.art).pop(); if(z) z.mal=+m[1]; }
    else if(k==="res"){ if(offen()&&!cur.name.length&&!cur.res&&!cur.ge) cur.res=true; else neu({res:true}); }
    else if(k==="leer"){ G.push({art:"leer",anz}); anz=0; cur=null; }
    else if(k==="ge") neu({ge:m[0]});
    else { const w=m[0];
      if(/^und$/i.test(w)){ const nx=naechst(i); if(!(cur&&!cur.art&&cur.name.length&&vor==="wort"&&nx&&nx[0]==="wort")) { vor=k; return; } }   /* „und“ nur mitten im Namen */
      const dran=offen()&&!cur.res&&(cur.name.length?vor==="wort"||vor==="teil":!(nameZuerst&&cur.ls&&!cur.kz));
      if(dran) cur.name.push(w); else neu({}).name.push(w); }
    vor=k; });
  /* Zeilen im Importformat */
  const Z=[], K=[]; let ersteReihe=true;
  const gross=s=>s.charAt(0).toUpperCase()+s.slice(1);
  G.forEach((g,gi)=>{
    if(g.art==="reihe"){ if(!Z.length||Z[Z.length-1]==="---"||/^#/.test(Z[Z.length-1])){ return; } Z.push("---"); K.push("neue Reihe"); return; }
    if(g.art==="feld"){ Z.push(`# Verteilerfeld${g.n?" "+g.n:""}`); K.push(`Verteilerfeld${g.n?" "+g.n:""}`); return; }
    if(g.art==="fi"){ const w=[g.a?g.a+"A":"",g.ma?g.ma+"mA":""].filter(Boolean).join(" / "), p=g.pol===2?" 2-polig":"";
      const z=(g.n?`FI ${g.n}`:"Fehlerstromschutzschalter")+(w?" "+w:"")+p; Z.push(g.n&&!w&&!p?`FI ${g.n}`:z); K.push(["FI"+(g.n?" "+g.n:""),w,g.pol?g.pol+"-polig":""].filter(Boolean).join(" · ")); return; }
    if(g.art==="leer"){ const n=Math.max(1,g.anz||1); Z.push(n>1?`${n}x leer`:"leer"); K.push(n>1?`${n}× Leerplatz`:"Leerplatz"); return; }
    let roh=g.res?"Reserve":g.name.join(" ").replace(/^\S+/,w=>{ const v=VTI_VERHOERT.find(([re])=>re.test(w)); return v?v[1]:w; });
    const sch=g.rcbo?("FI/LS"+(g.ls?" "+g.ls:"")):g.ls||"", polT=g.pol===3||g.pol===4?" 3-polig":"";
    const zeile=nm=>{ nm=gross(nm.replace(/\s*‡\s*/g," ").replace(/\s+/g," ").trim()); return g.ge?[g.kz,g.ge,(nm+polT).trim()].filter(Boolean).join("; "):[g.kz,sch,(nm+polT).trim()].filter(Boolean).join("; "); };
    const kurz=nm=>[g.kz,g.ge||"",gross(nm.replace(/\s*‡\s*/g," ").trim()),sch,polT.trim()].filter(Boolean).join(" · ");
    const n=g.anz||g.mal||1;
    if(n>1){ const teile=roh.split(/\s*‡\s*|\s+und\s+/).map(x=>x.trim()).filter(Boolean);
      if(teile.length===n){ teile.forEach(x=>{ Z.push(zeile(x)); K.push(kurz(x)); }); return; }   /* „zwei B16 für Kinderzimmer 1 und Kinderzimmer 2“ */
      if(g.mal===3&&!polT&&!sch&&!g.kz&&!g.ge){ const nm=gross(roh); Z.push(nm,nm,nm); K.push(`${nm} · 3-polig`); return; }
      Z.push(`${n}x ${zeile(roh)}`); K.push(`${n}× ${kurz(roh)}`); return; }
    Z.push(zeile(roh)); K.push(kurz(roh)); });
  while(Z.length&&Z[Z.length-1]==="---"){ Z.pop(); K.pop(); }
  return {Z,K}; }
let VTI_SR=null;
/* Aufnahme: erst nur zuhören (Animation, Zeit, Wortzahl), bei „Fertig“ alles zusammen auswerten und in „Prüfen“ zeigen */
let VTI_REC=null, VTI_GEHOERT="";
function vtiRecUi(an){ const dlg=document.getElementById("dlg"); if(dlg) dlg.classList.toggle("vti-rec-an",!!an);
  const r=document.getElementById("vtiRec"); if(r) r.hidden=!an; }
function vtiDiktatStop(verwerfen){ const r=VTI_SR; VTI_SR=null; if(r){ r._aus=true; if(r._fertig) r._fertig(); try{ r.stop(); }catch(e){} }
  const R=VTI_REC; if(R&&R.uhr) clearInterval(R.uhr); if(verwerfen!==false){ VTI_REC=null; vtiRecUi(false); } return R; }
function vtiDiktatStart(){ const SR=vtiSR(); if(!SR){ toast("Diktieren geht in diesem Browser nicht"); return; } vtiDiktatStop();
  if(vtiSchritt!==2) vtiZeig(2);
  const ta=document.getElementById("vtiText"), R=VTI_REC={seg:[],zw:"",basis:ta?ta.value.replace(/\s+$/,""):"",t0:Date.now()};
  const kreis=document.getElementById("vtiRecKreis"), txt=document.getElementById("vtiRecTxt"), zeit=document.getElementById("vtiRecZeit");
  if(kreis) kreis.className="vti-rec-kreis"; vtiRecUi(true);
  const zeig=()=>{ const n=(R.seg.join(" ")+" "+R.zw).trim().split(/\s+/).filter(Boolean).length; if(txt) txt.textContent=n?`Ich höre zu · ${n} ${n===1?"Wort":"Wörter"}`:"Ich höre zu"; };
  R.uhr=setInterval(()=>{ const s=Math.floor((Date.now()-R.t0)/1000); if(zeit) zeit.textContent=`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`; },500);
  const puls=()=>{ if(!kreis) return; kreis.classList.remove("hoert"); void kreis.offsetWidth; kreis.classList.add("hoert"); };
  const sitzung=()=>{ const r=new SR(); r.lang="de-DE"; r.continuous=true; r.interimResults=true; r.maxAlternatives=1; VTI_SR=r;
    let n=0, letzte="";
    r.onresult=e=>{ let z="";
      for(let i=n;i<e.results.length;i++){ const x=e.results[i], t=String(x[0].transcript||"").trim();
        if(x.isFinal){ n=i+1;
          /* Chrome auf Android liefert manchmal den ganzen bisherigen Satz noch einmal – dann nur das Neue nehmen */
          const neu=letzte&&t.length>letzte.length&&t.toLowerCase().startsWith(letzte.toLowerCase()+" ")?t.slice(letzte.length).trim():t; letzte=t; if(neu) R.seg.push(neu); }
        else z+=(z?" ":"")+t; }
      R.zw=z; zeig(); puls(); };
    r.onerror=e=>{ if(e.error==="not-allowed"||e.error==="service-not-allowed"){ toast("Mikrofon nicht erlaubt – in den Browser-Einstellungen freigeben"); vtiDiktatStop(); } else if(e.error==="network"){ toast("Diktieren braucht Internet"); vtiDiktatStop(); } };
    /* Chrome hört nach Stille auf: was noch nicht bestätigt war, trotzdem behalten – dann weiterhören, bis „Fertig“ */
    r.onend=()=>{ if(R.zw){ R.seg.push(R.zw); R.zw=""; } if(VTI_SR===r&&!r._aus&&VTI_REC===R) sitzung(); };
    r._fertig=()=>{ if(R.zw){ R.seg.push(R.zw); R.zw=""; } };
    try{ r.start(); }catch(e){ toast("Diktieren konnte nicht starten"); vtiDiktatStop(); } };
  sitzung(); zeig(); }
function vtiDiktatFertig(){ const R=vtiDiktatStop(false); if(!R) return; const kreis=document.getElementById("vtiRecKreis"), txt=document.getElementById("vtiRecTxt");
  if(kreis) kreis.className="vti-rec-kreis denkt"; if(txt) txt.textContent="Wird ausgewertet …";
  setTimeout(async()=>{ if(VTI_REC!==R) return;
    if(typeof kiBereit==="function"&&kiBereit()&&R.seg.length){ if(txt) txt.textContent="Die KI wertet aus …";
      try{ const j=await kiFrage({system:VTI_KI_SYSTEM,text:`So hat der Elektriker den Verteiler beschrieben (Spracherkennung, Pausen als „…“):\n${R.seg.join(" … ")}`,json:true});
        if(VTI_REC!==R) return; VTI_REC=null; vtiRecUi(false); const ta=document.getElementById("vtiText"); if(ta) ta.value=R.basis; vtiKiUebernehmen(j,R.seg.join(" … ")+" (von der KI ausgewertet)"); return; }
      catch(e){ toast("KI nicht erreichbar – ausgewertet ohne KI"); } }
    if(VTI_REC!==R) return; VTI_REC=null; vtiRecUi(false);
    const {Z}=vtiDiktatLesen(R.seg), ta=document.getElementById("vtiText");
    if(!Z.length){ toast(R.seg.length?"Nichts Brauchbares verstanden – bitte nochmal":"Nichts gehört – Mikrofon prüfen und nochmal"); return; }
    if(ta) ta.value=R.basis+(R.basis?"\n":"")+Z.join("\n");
    VTI_GEHOERT=[VTI_GEHOERT,R.seg.join(" … ")].filter(Boolean).join(" … ");
    vtiZeig(3); },900); }
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act="vtiDiktat"]'); if(b){ e.stopPropagation(); if(VTI_SR) vtiDiktatStop(); else vtiDiktatStart(); return; }
  if(b===null&&e.target.closest&&e.target.closest('#dlg [data-act="vtiRecOk"]')){ e.stopPropagation(); vtiDiktatFertig(); return; }
  if(e.target.closest&&e.target.closest('#dlg [data-act="vtiRecAbbr"]')){ e.stopPropagation(); vtiDiktatStop(); return; }
  if(VTI_SR&&e.target.closest&&e.target.closest('#dlg [data-act="cancel"],#dlg [data-act="vtImpOk"],#scrim')) vtiDiktatStop(); },true);

/* ===== KI: Verteiler vom Foto ablesen, Diktat übersetzen (vorbereitet 04.11.2026 – aktiv erst mit KI-Zugang, siehe ki.js) =====
   Die KI liefert Zeilen im selben Format wie „Liste einfügen“ – danach läuft alles wie gewohnt über „Prüfen“. */
const VTI_KI_SYSTEM=`Du hilfst Elektrikern von Elektro Irrgang, die Stromkreisliste eines Verteilers zu erfassen.
Gib die Geräte im folgenden Zeilenformat aus, eine Zeile pro Gerät, je Hutschiene von links nach rechts, die Reihen von oben nach unten:
- "---" beginnt eine neue Reihe (Hutschiene). "# Text" ist eine Überschrift, z. B. "# Verteilerfeld 2".
- Fehlerstromschutzschalter: "Fehlerstromschutzschalter 40A / 30mA" (Werte nur, wenn erkennbar; "2-polig" anhängen, wenn 2-polig).
- Leitungsschutzschalter: "B16; Bezeichnung", 3-polig: "B16; Bezeichnung 3-polig". FI/LS-Schalter (RCBO): "FI/LS B16; Bezeichnung".
- Reserve-Automat ohne Verbraucher: "B16; Reserve". Freier Platz oder Blindabdeckung: "leer".
- Andere Geräte mit Typ vorn: "Neozed; Bezeichnung", "Hauptschalter", "Überspannungsschutz", "Schütz; Bezeichnung", "Stromstoßschalter; Bezeichnung", "Treppenlichtautomat", "Klingeltrafo".
- Bezeichnung nur, wenn sie lesbar ist (Beschriftungsstreifen, Legende) bzw. gesagt wurde – sonst nur die Absicherung, z. B. "B16".
- Nichts erfinden. Was du nicht sicher erkennst, lässt du weg und nennst es im Hinweis.
Antworte nur mit JSON: {"zeilen":["…"],"hinweis":"kurz, was unsicher war oder fehlt (leer, wenn alles klar)"}`;
function vtiKiAnzeige(txt){ vtiRecUi(true); const k=document.getElementById("vtiRecKreis"), t=document.getElementById("vtiRecTxt"), z=document.getElementById("vtiRecZeit");
  if(k) k.className="vti-rec-kreis denkt"; if(t) t.textContent=txt; if(z) z.textContent=""; document.getElementById("dlg").classList.add("vti-ki-an"); }
function vtiKiFertig(){ vtiRecUi(false); const d=document.getElementById("dlg"); if(d) d.classList.remove("vti-ki-an"); }
function vtiKiUebernehmen(j,quelle){ const Z=(j&&Array.isArray(j.zeilen)?j.zeilen:[]).map(z=>String(z||"").trim()).filter(Boolean), ta=document.getElementById("vtiText");
  if(!Z.length) throw new Error("Die KI hat keine Geräte erkannt");
  if(ta){ const b=ta.value.replace(/\s+$/,""); ta.value=b+(b?"\n":"")+Z.join("\n"); }
  VTI_GEHOERT=[VTI_GEHOERT,quelle+(j.hinweis?` – Hinweis der KI: ${j.hinweis}`:"")].filter(Boolean).join(" … "); vtiZeig(3); }
async function vtiFoto(){ if(!kiAn()){ toast("KI ist nicht eingerichtet"); return; } if(vtiSchritt!==2) vtiZeig(2);
  const F=await kiFotos(true); if(!F.length) return; vtiKiAnzeige(F.length>1?`Die KI liest ${F.length} Fotos …`:"Die KI liest den Verteiler …");
  try{ const B=[]; for(const f of F) B.push(await kiBild(f));
    const j=await kiFrage({system:VTI_KI_SYSTEM,text:`Hier ${B.length>1?`sind ${B.length} Fotos desselben Verteilers`:"ist ein Foto eines Verteilers"}. Erstelle die Stromkreisliste.`,bilder:B,json:true});
    vtiKiFertig(); vtiKiUebernehmen(j,`Vom Foto (${B.length} Bild${B.length>1?"er":""}) abgelesen`); }
  catch(e){ vtiKiFertig(); toast(e.message||"KI nicht erreichbar"); } }
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('#dlg [data-act="vtiFoto"]'); if(!b) return; e.stopPropagation(); vtiFoto(); },true);
