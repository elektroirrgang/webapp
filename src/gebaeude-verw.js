/* ===== Gebäude eines Kunden/Standorts vorab anlegen (Gebäudetechnik, Kundenseite › „Gebäude“) – 04.11.2026 =====
   Derselbe Datensatz „gebaeude“ wie Prüfung, Verteiler und KNX: bauteile[{id,name,kurz}], etagen[{id,name,ebene,raeume[{id,name,bauteilId}]}].
   Gespeichert wird sofort bei jeder Änderung (ecGebSpeichern) – ohne Änderung entsteht kein Datensatz. */
Object.assign(IC,{gvGeb:"M17 11V3H7v4H3v14h8v-4h2v4h8V11h-4zM7 19H5v-2h2v2zm0-4H5v-2h2v2zm0-4H5V9h2v2zm4 4H9v-2h2v2zm0-4H9V9h2v2zm0-4H9V5h2v2zm4 8h-2v-2h2v2zm0-4h-2V9h2v2zm0-4h-2V5h2v2zm4 12h-2v-2h2v2zm0-4h-2v-2h2v2z",
  gvEdit:"M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"});
const GV={ort:"",et:"",raum:"",bt:"",gsHand:false,loesch:false,sel:null,selOrt:"",teil:"",ber:"",berDlg:""};
/* Bauteil = eigenes Gebäude mit eigenen Etagen: etagen[].bauteilId. Ältere Etagen ohne Bauteil, deren Räume alle in einem Bauteil liegen, gehören zu diesem. */
const gvAbc=(a,b)=>String(a.name||"").localeCompare(String(b.name||""),"de",{numeric:true,sensitivity:"base"});
function gvNorm(g){ g.bauteile=g.bauteile||[]; (g.bauteile||[]).forEach(b=>{ const v=b.raumVor&&gvVorText(b); if(!v) return; g.etagen.forEach(e=>{ if((e.bauteilId||"")!==b.id) return; e.raeume.forEach(r=>{ if(new RegExp("^"+v.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"\\d","i").test(r.name)) r.name=`${v} ${r.name.slice(v.length)}`; }); }); }); if(g.bauteile.length>1) g.bauteile.sort(gvAbc);   /* Bauteile immer A–Z */ g.etagen.forEach(e=>{ if(e.bauteilId&&!g.bauteile.some(b=>b.id===e.bauteilId)) delete e.bauteilId;
    if(!e.bauteilId&&e.raeume&&e.raeume.length){ const S=new Set(e.raeume.map(r=>r.bauteilId||"")); if(S.size===1){ const v=[...S][0]; if(v&&g.bauteile.some(b=>b.id===v)) e.bauteilId=v; } } }); return g; }
const gvGeb=ort=>gvNorm(ecGeb(ort));
const gvEtBt=(g,e)=>e&&e.bauteilId&&g.bauteile.find(b=>b.id===e.bauteilId);
const gvEtVon=(g,bt)=>ecEtagen(g).filter(e=>(e.bauteilId||"")===(bt||""));
const gvEtName=(g,e)=>{ const b=gvEtBt(g,e); return (b?(b.kurz||b.name)+" · ":"")+e.name; };
/* Anzeige in der Prüfung: Bauteil vor den Etagennamen (nicht gespeichert) */
function gvBtMarken(g){ const B=g.bauteile||[]; (g.etagen||[]).forEach(e=>{ const b=e.bauteilId&&B.find(x=>x.id===e.bauteilId); try{ Object.defineProperty(e,"_bt",{value:b?(b.kurz||b.name):"",enumerable:false,configurable:true,writable:true}); }catch(x){} }); }
function gvSel(g){ const B=g.bauteile; if(GV.selOrt!==g.ortId){ GV.selOrt=g.ortId; GV.sel=null; }
  const ohne=g.etagen.some(e=>!e.bauteilId&&(e.raeume.length||e.id!=="eg"));
  if(GV.sel!=null&&(GV.sel===""?(ohne||!B.length):B.some(b=>b.id===GV.sel))) return GV.sel;
  const b=B.find(x=>g.etagen.some(e=>e.bauteilId===x.id))||B[0]; GV.sel=b?b.id:""; return GV.sel; }
const gvGs=e=>e.ebene!=null&&e.ebene!==""?+e.ebene:null;
const gvGsOpts=()=>[["","aus der Bezeichnung erkennen"],...EC_GESCHOSS.map(([v,t])=>[String(v),t])];
const gvZahl=g=>{ const R=g.etagen.reduce((n,e)=>n+(e.raeume||[]).length,0); return {b:g.bauteile.length,e:g.etagen.length,r:R}; };
const gvLeer=g=>!DB.gebaeude.has(g.id)||(!g.bauteile.length&&gvZahl(g).r===0&&g.etagen.length<=1);
function gvText(g){ if(gvLeer(g)) return "Noch nichts angelegt – Bauteile, Etagen und Räume"; const z=gvZahl(g);
  return [z.b&&`${z.b} Bauteil${z.b===1?"":"e"}`,`${z.e} Etage${z.e===1?"":"n"}`,`${z.r} Räume`].filter(Boolean).join(" · "); }
/* Block auf der Kunden-/Standortseite */
function gvBeiKunde(kind,r){ const O=kind==="kunden"?[{id:"k:"+r.id,name:"Adresse des Kunden"},...standorteVon(r.id).map(s=>({id:s.id,name:s.name||"Standort"}))]:[{id:r.id,name:r.name}];
  return `<div class="sec-row"><div class="sec-lbl">Gebäude</div></div>`+listOf(O.map(o=>{ const g=gvGeb(o.id);
    return `<div class="li" role="button" tabindex="0" data-act="gvAuf" data-v="${esc(o.id)}"><span class="av">${icon("gvGeb")}</span><span class="lt"><span class="h">${esc(O.length>1?o.name:"Bauteile, Etagen, Räume")}</span><span class="s">${esc(gvText(g))}</span></span>${icon("chev")}</div>`; })); }
/* Seite */
function gvView(){ const g=gvGeb(nav.ort), B=g.bauteile, sel=gvSel(g), ohneE=g.etagen.filter(e=>!e.bauteilId&&(e.raeume.length||e.id!=="eg")), selB=B.find(b=>b.id===sel);
  const nR=bt=>g.etagen.filter(e=>(e.bauteilId||"")===bt).reduce((n,e)=>n+e.raeume.length,0);
  const kopf=`<div class="sec-row"><div class="sec-lbl">Bauteile · ${B.length}</div><span class="ab-btns">${selB?`<button class="ab-ic" data-act="gvBt" data-id="${esc(selB.id)}" aria-label="Bauteil ${esc(selB.name)} bearbeiten" title="${esc(selB.name)} bearbeiten">${icon("gvEdit")}</button>`:""}<button class="ab-ic" data-act="gvBtNeu" aria-label="Bauteil hinzufügen" title="Bauteil hinzufügen">${icon("add")}</button></span></div>
    ${B.length?`<div class="gv-bts">${B.map(b=>`<button type="button" class="gv-bt" data-act="gvBtSel" data-v="${esc(b.id)}" aria-pressed="${sel===b.id}"><b>${esc(b.name)}</b><small>${(n=>`${n} Etage${n===1?"":"n"}`)(gvEtVon(g,b.id).length)} · ${(n=>`${n} ${n===1?"Raum":"Räume"}`)(nR(b.id))}</small></button>`).join("")}${ohneE.length?`<button type="button" class="gv-bt" data-act="gvBtSel" data-v="" aria-pressed="${sel===""}"><b>Ohne Bauteil</b><small>${ohneE.length} Etage${ohneE.length===1?"":"n"}</small></button>`:""}</div>`
      :`<p class="meta">Nur nötig, wenn der Kunde mehrere Gebäude oder Gebäudeteile hat (z. B. Bauteil A bis H). Jedes Bauteil hat dann seine eigenen Etagen.</p>`}`;
  if(nav.et){ const e=g.etagen.find(x=>x.id===nav.et); if(e) return gvEtSeite(g,e); nav.et=null; }
  const E=B.length?gvEtVon(g,sel):ecEtagen(g);
  const zuordnen=B.length&&sel===""&&ohneE.length?`<section class="card gv-zu"><b>Diese Etagen gehören noch zu keinem Bauteil.</b><div class="kx-knoepfe">${B.map(b=>`<button type="button" class="btn-tonal" data-act="gvEtZu" data-v="${esc(b.id)}">Alle zu ${esc(b.name)}</button>`).join("")}</div><p class="meta" style="margin:8px 0 0">Oder einzeln: Etage öffnen › Stift.</p></section>`:"";
  const zeile=e=>{ const gs=gvGs(e), gsT=gs!=null?ecGeschossName(gs):"", R=e.raeume||[], vorschau=R.length>4?`${R.slice(0,3).map(r=>r.name).join(", ")} … ${R[R.length-1].name}`:R.map(r=>r.name).join(", ");
    const bar=R.length&&R.some(r=>r.zustand)?`<span class="gv-bar">${GV_ZST.map(([v,t,k])=>{ const n=R.filter(r=>r.zustand===v).length; return n?`<i class="ra-${k}" style="flex:${n}" title="${n} ${t}"></i>`:""; }).join("")}${(n=>n?`<i class="leer" style="flex:${n}"></i>`:"")(R.filter(r=>!gvZst(r.zustand)).length)}</span>`:"";
    return `<div class="li" role="button" tabindex="0" data-act="gvEtAuf" data-id="${esc(e.id)}"><span class="av gv-av">${esc(gsT&&gsT!==e.name?gsT.replace(/\.\s*OG$/,". OG"):"")||icon("gvGeb")}</span><span class="lt"><span class="h">${esc(e.name)}</span><span class="s">${R.length?`${R.length} ${R.length===1?"Raum":"Räume"} · ${esc(vorschau)}`:"Noch keine Räume"}</span>${bar}</span>${icon("chev")}</div>`; };
  const etagen=`<div class="sec-row"><div class="sec-lbl">${selB?`Etagen in ${esc(selB.name)}`:"Etagen"} · ${E.length}</div><span class="ab-btns"><button class="ab-ic" data-act="gvEtNeu" aria-label="Etage hinzufügen" title="Etage hinzufügen">${icon("add")}</button></span></div>`
    +(E.length?listOf(E.map(zeile)):`<p class="meta">${selB?`${esc(selB.name)} hat noch keine Etagen – mit „+“ anlegen, auch mehrere auf einmal („Level 1-5“).`:"Noch keine Etagen."}</p>`);
  GV.normal=`${kopf}${zuordnen}${etagen}<p class="meta" style="margin:20px 4px 0">Dieselben Bauteile, Etagen und Räume nutzen Prüfung, Verteiler und KNX.</p>`;
  return `<div class="narrow gv-seite">${GV.normal}</div>`; }
/* Raumname in Nummer und Bezeichnung zerlegen: „B 409 Herren WC“ → B 409 | Herren WC */
function gvNr(n){ n=String(n||"").trim(); const m=n.match(/^((?:[A-Za-zÄÖÜäöü]{1,3}[ .-]?)?\d[\w./-]*)\s+(.+)$/); return m?{nr:m[1],txt:m[2]}:/\d/.test(n)&&n.length<=12?{nr:n,txt:""}:{nr:"",txt:n}; }
const gvBer=e=>(e.bereiche=e.bereiche||[]);
/* ---- Suche, Filter, Ansicht (Liste/Kacheln) ---- */
let GV_ANS=(()=>{ try{ return localStorage.getItem("irrgang_gv_ansicht")||"liste"; }catch(e){ return "liste"; } })();
GV.f={arten:[],ber:"",vt:false,zst:""};
const gvFAktiv=()=>GV.f.arten.length||GV.f.ber||GV.f.vt||GV.f.zst;
const gvSuchAktiv=()=>!!(String(typeof query!=="undefined"?query:"").trim()||gvFAktiv());
const gvVtIm=(g,r)=>(g.verteiler||[]).filter(v=>v.raumId===r.id);
function gvSuchKopf(g,e){ const sb=searchBar(e?"Raum suchen":"Raum im Gebäude suchen",{act:"gvFilt",aktiv:!!gvFAktiv(),n:gvFAktiv()?String(GV.f.arten.length+(GV.f.ber?1:0)+(GV.f.vt?1:0)+(GV.f.zst?1:0)):""});
  const ans=`<button type="button" class="such-f" data-act="gvAns" aria-label="${GV_ANS==="liste"?"Als Kacheln zeigen":"Als Liste zeigen"}" title="${GV_ANS==="liste"?"Kacheln":"Liste"}">${icon(GV_ANS==="liste"?"kxUeb":"kxListe")}</button>`;
  return sb.replace(/<\/div>\s*$/,ans+"</div>"); }
/* Treffer: Räume mit Ort */
function gvAlleRaeume(g,e){ const out=[]; (e?[e]:ecEtagen(g)).forEach(et=>et.raeume.forEach(r=>out.push({r,e:et,art:raVon(g,r,et)}))); return out; }
function gvFiltern(g,L){ const q=String(typeof query!=="undefined"?query:"").trim(); return L.filter(x=>{ const a=raArt(x.art), z=x.r.bereichId&&gvBer(x.e).find(b=>b.id===x.r.bereichId);
    if(GV.f.arten.length&&!GV.f.arten.includes(x.art||"sonst")) return false; if(GV.f.zst&&(GV.f.zst==="_ohne"?!!gvZst(x.r.zustand):x.r.zustand!==GV.f.zst)) return false; if(GV.f.ber&&x.r.bereichId!==GV.f.ber) return false; if(GV.f.vt&&!gvVtIm(g,x.r).length) return false;
    return !q||suPasst(q,x.r.name,a&&a.name,z&&z.name,x.e.name,gvVtIm(g,x.r).map(v=>v.name)); }); }
function gvRes(){ const g=gvGeb(nav.ort), e=nav.et&&g.etagen.find(x=>x.id===nav.et);
  if(e) return gvEtInhalt(g,e);
  if(!gvSuchAktiv()) return GV.normal||"";
  const T=gvFiltern(g,gvAlleRaeume(g,null)); if(!T.length) return `<p class="meta" style="margin:16px 4px">Kein Raum gefunden.</p>`;
  return `<div class="gv-grp">${T.length} ${T.length===1?"Raum":"Räume"}</div>`+gvRaeumeHtml(g,T,{ort:true}); }
if(typeof SU_LISTE!=="undefined") SU_LISTE.geb=gvRes;
/* eine Zeile / eine Kachel */
function gvRaumHtml(g,x,o){ o=o||{}; const z=gvNr(x.r.name), a=raArt(x.art), V=gvVtIm(g,x.r), ber=x.r.bereichId&&gvBer(x.e).find(b=>b.id===x.r.bereichId);
  const txt=z.txt||(z.nr?(a?a.name:""):x.r.name), ort=o.ort?[gvEtName(g,x.e),ber&&ber.name].filter(Boolean).join(" · "):"";
  const vt=V.length?`<span class="gv-vt" title="Verteiler: ${esc(V.map(v=>v.name).join(", "))}">${icon("ra_verteil")}${GV_ANS==="liste"||o.teil?esc(V.map(v=>v.name).join(", ")):""}</span>`:"";
  const act=o.act||"gvRaum", an=o.an?" an":"";
  const prob=g.knx&&g.knx.an&&(g.knx.geraete||[]).some(d=>d.raumId===x.r.id&&d.problem), nF=typeof dateienVon==="function"?dateienVon("raeume",x.r.id).length:0, nN=(x.r.notizen||[]).length;
  const hinw=o.teil?"":`${prob?`<span class="gv-hw warn" title="Gerät defekt oder Problem">${icon("warn")}</span>`:""}${nN?`<span class="gv-hw" title="${nN} Notiz${nN===1?"":"en"}">${icon("gvEdit")}</span>`:""}${nF?`<span class="gv-hw" title="${nF} Fotos/Dateien">${icon("cam")}</span>`:""}`;
  const zs=gvZst(x.r.zustand), zc=zs?` gv-zs zs-${zs[0]}`:"";
  if(GV_ANS==="kachel"&&!o.teil) return `<button type="button" class="gv-k${an}${zc}" data-act="${act}" data-id="${esc(x.r.id)}">${raIcon(x.art,"klein")}<b>${esc(z.nr||txt)}</b><small>${esc(z.nr?txt:(a?a.name:""))}</small>${ort?`<small class="gv-ort">${esc(ort)}</small>`:""}${vt}${hinw?`<span class="gv-hws">${hinw}</span>`:""}</button>`;
  return `<button type="button" class="gv-rz${an}${zc}" data-act="${act}" data-id="${esc(x.r.id)}">${raIcon(x.art)}<span class="gv-nr${z.nr?"":" leer"}">${esc(z.nr||"–")}</span><span class="gv-rt"><span>${esc(txt)}</span>${ort||zs?`<small>${esc([zs&&zs[1],ort].filter(Boolean).join(" · "))}</small>`:""}</span>${hinw}${vt}${o.rechts||""}</button>`; }
const gvRaeumeHtml=(g,L,o)=>`<div class="${GV_ANS==="kachel"&&!(o&&o.teil)?"gv-kl":"gv-rl"}">${L.map(x=>gvRaumHtml(g,x,o)).join("")}</div>`;
/* Etagenseite */
function gvEtSeite(g,e){ const R=e.raeume||[]; if(nav.raum){ const r=R.find(x=>x.id===nav.raum); if(r) return gvRaumSeite(g,e,r); nav.raum=null; }
  const verw=`<div class="sec-lbl" style="margin-top:24px">Etage</div>${listOf([
    `<div class="li" role="button" tabindex="0" data-act="gvTeilAn" data-id="${esc(e.id)}"><span class="av">${icon("kxUeb")}</span><span class="lt"><span class="h">Räume auswählen und einteilen</span><span class="s">Mehrere Räume auf einmal: Bereich (links, Mitte, rechts …), Raumart oder Etage</span></span>${icon("chev")}</div>`,
    `<div class="li" role="button" tabindex="0" data-act="gvEt" data-id="${esc(e.id)}"><span class="av">${icon("gvEdit")}</span><span class="lt"><span class="h">Etage bearbeiten</span><span class="s">Name, Geschoss, Bauteil</span></span>${icon("chev")}</div>`])}`;
  if(!R.length) return `<div class="narrow gv-seite"><p class="meta" style="margin:8px 4px 0">Noch keine Räume – unten rechts mit „Räume“ anlegen, z. B. „403-407, 409-411“.</p>${verw}</div>`;
  if(GV.teil===e.id) return gvTeilSeite(g,e);
  return `<div class="narrow gv-seite">${gvSuchKopf(g,e)}<div id="res">${gvEtInhalt(g,e)}</div>${verw}
    <p class="meta" style="margin:16px 4px 0">Reihenfolge = Reihenfolge beim Durchgehen (und der KNX-Adressen). Raum antippen zum Umbenennen, Verschieben, für Raumart, Verteiler oder zum Löschen.</p></div>`; }
function gvEtInhalt(g,e){ const B=gvBer(e), alle=gvAlleRaeume(g,e), L=gvFiltern(g,alle);
  const chips=gvFAktiv()||String(typeof query!=="undefined"?query:"").trim()?`<div class="gv-grp" style="margin-top:4px">${L.length} von ${alle.length} Räumen</div>`:"";
  if(!L.length) return chips+`<p class="meta" style="margin:16px 4px">Kein Raum gefunden.</p>`;
  const grp=[...B.map(b=>({b,L:L.filter(x=>x.r.bereichId===b.id)})),{b:null,L:L.filter(x=>!x.r.bereichId||!B.some(b=>b.id===x.r.bereichId))}].filter(x=>x.L.length);
  return chips+grp.map(({b,L})=>`${B.length?`<div class="gv-grp">${esc(b?b.name:"Ohne Bereich")} · ${L.length}</div>`:""}${gvRaeumeHtml(g,L)}`).join(""); }
/* Auswählen und einteilen: erst Räume antippen (bleiben ausgewählt), dann unten Bereich / Raumart / Etage zuweisen */
GV.wsel=new Set();
function gvTeilSeite(g,e){ const R=gvAlleRaeume(g,e), B=gvBer(e), n=[...GV.wsel].filter(id=>R.some(x=>x.r.id===id)).length;
  const schnell=[["alle","Alle"],...B.map(z=>[z.id,z.name]),...(B.length&&R.some(x=>!x.r.bereichId)?[["ohne","Ohne Bereich"]]:[])].map(([v,t])=>{ const ids=gvWahlIds(R,v), an=ids.length&&ids.every(i=>GV.wsel.has(i));
    return `<button type="button" class="gv-berk" data-act="gvSelGrp" data-v="${esc(v)}" aria-pressed="${an}"><b>${esc(t)}</b><small>${ids.length}</small></button>`; }).join("");
  const grp=[...B.map(z=>({z,L:R.filter(x=>x.r.bereichId===z.id)})),{z:null,L:R.filter(x=>!x.r.bereichId||!B.some(z=>z.id===x.r.bereichId))}].filter(x=>x.L.length);
  return `<div class="narrow gv-seite gv-wahl"><div class="gv-wahlkopf"><span><b>${n?`${n} ausgewählt`:"Räume auswählen"}</b><small>${n?"Unten zuweisen – die Auswahl bleibt danach bestehen.":"Antippen zum Auswählen, oder ganze Gruppen:"}</small></span><button type="button" class="btn-filled sm" data-act="gvTeilAus">Fertig</button></div>
    <div class="gv-ber gv-schnell">${schnell}</div>
    ${grp.map(({z,L})=>`${B.length?`<div class="gv-grp">${esc(z?z.name:"Ohne Bereich")} · ${L.length}</div>`:""}<div class="gv-rl">${L.map(x=>gvRaumHtml(g,x,{act:"gvSelR",teil:true,an:GV.wsel.has(x.r.id)})).join("")}</div>`).join("")}
    <div class="gv-aktbar${n?"":" aus"}"><button type="button" data-act="gvSetBer" ${n?"":"disabled"}>${icon("kxUeb")}<span>Bereich</span></button><button type="button" data-act="gvSetArt" ${n?"":"disabled"}>${icon("ra_buero")}<span>Raumart</span></button><button type="button" data-act="gvSetZst" ${n?"":"disabled"}>${icon("ra_technik")}<span>Zustand</span></button><button type="button" data-act="gvSetEt" ${n?"":"disabled"}>${icon("ra_treppe")}<span>Etage</span></button></div></div>`; }
const gvWahlIds=(R,v)=>R.filter(x=>v==="alle"||(v==="ohne"?!x.r.bereichId:x.r.bereichId===v)).map(x=>x.r.id);
const gvSelRaeume=(g,e)=>e.raeume.filter(r=>GV.wsel.has(r.id));
function gvSetBerDlg(){ const g=gvAkt(), e=g&&g.etagen.find(x=>x.id===nav.et); if(!e) return; const S=gvSelRaeume(g,e), B=gvBer(e);
  dialog(`Bereich für ${S.length} ${S.length===1?"Raum":"Räume"}`,`<div class="gv-wahlliste">${B.map(z=>`<div class="gv-wz"><button type="button" class="gv-wzk" data-act="gvBerSetzen" data-v="${esc(z.id)}"><b>${esc(z.name)}</b><small>${e.raeume.filter(r=>r.bereichId===z.id).length} Räume</small></button><button type="button" class="ab-ic" data-act="gvBerEd" data-v="${esc(z.id)}" aria-label="${esc(z.name)} umbenennen oder löschen">${icon("gvEdit")}</button></div>`).join("")}
    <div class="gv-wz"><button type="button" class="gv-wzk leer" data-act="gvBerSetzen" data-v=""><b>Kein Bereich</b></button></div></div>
    <div class="fg1" style="margin-top:12px">${tf("gvBerNeuN","Neuer Bereich","",{form:true,ph:"z. B. Links, Mitte/WCs, Rechts, Flur"})}</div>`,
    `<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="gvBerNeuSetzen">Anlegen und zuweisen</button>`,{breit:true}); }
function gvSetArtDlg(){ const g=gvAkt(), e=g&&g.etagen.find(x=>x.id===nav.et); if(!e) return; const S=gvSelRaeume(g,e);
  dialog(`Raumart für ${S.length} ${S.length===1?"Raum":"Räume"}`,`<div class="gv-artwahl">${Object.keys(RA_KAT).map(k=>{ const A=RA_LISTE.filter(a=>a.kat===k); return `<div class="gv-artgrp"><small>${esc(RA_KAT[k])}</small><div>${A.map(a=>`<button type="button" class="gv-ak ra-${a.kat}" data-act="gvArtSetzen" data-v="${a.id}">${icon("ra_"+a.id)}${esc(a.name)}</button>`).join("")}</div></div>`; }).join("")}</div>`,
    `<button class="btn-text" data-act="gvArtSetzen" data-v="">Automatisch (aus Name/Nutzung)</button><span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button>`,{breit:true}); }
function gvSetEtDlg(){ const g=gvAkt(), e=g&&g.etagen.find(x=>x.id===nav.et); if(!e) return; const S=gvSelRaeume(g,e), E=ecEtagen(g).filter(x=>x!==e);
  dialog(`${S.length} ${S.length===1?"Raum":"Räume"} verschieben`,E.length?`<div class="gv-wahlliste">${E.map(x=>`<div class="gv-wz"><button type="button" class="gv-wzk" data-act="gvEtSetzen" data-v="${esc(x.id)}"><b>${esc(gvEtName(g,x))}</b><small>${x.raeume.length} Räume</small></button></div>`).join("")}</div>`:`<p class="meta">Es gibt keine andere Etage.</p>`,
    `<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button>`,{breit:true}); }
function gvBerDlg(id){ const g=gvAkt(), e=g&&g.etagen.find(x=>x.id===nav.et); if(!e) return; const b=id&&gvBer(e).find(x=>x.id===id); GV.berDlg=b?b.id:""; GV.loesch=false;
  dialog(b?"Bereich bearbeiten":"Neuer Bereich",`<div class="fg1">${tf("gvBen","Bezeichnung",b?b.name:"",{form:true,ph:"z. B. Links, Mitte/WCs, Rechts, Flur"})}</div>${b?"":`<p class="meta" style="margin-top:8px">Mehrere auf einmal mit Komma: „Links, Mitte, Rechts, Flur“.</p>`}`,
    `${b?`<button class="btn-text danger" data-act="gvBerWeg">Löschen</button>`:""}<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="gvBerOk">${b?"Speichern":"Anlegen"}</button>`,{breit:true});
  setTimeout(()=>{ const x=document.getElementById("f_gvBen"); if(x) x.focus(); },60); }
/* ===== Raumseite: was ist im Raum (Verteiler, Anschlusspunkte, Netzwerk, KNX), dazu Notizen und Fotos ===== */
const gvNotizen=r=>(r.notizen=r.notizen||[]);
/* Bauzustand je Raum (Farbe = Farbgruppe der Raumarten) */
/* Bauzustand je nach Vorhaben des Bauteils (Neubau / Sanierung / Bestand); Farbgruppe wie Raumarten */
const GV_VORH={neubau:{name:"Neubau",L:[["rohbau","Rohbau","technik"],["fein","Feininstallation","arbeit"],["geprueft","Geprüft","halle"],["fertig","Fertig","wohnen"]]},
  sanierung:{name:"Sanierung / Umbau",L:[["bestand","Bestand aufgenommen","sonst"],["demontage","Demontage","kueche"],["install","Installation","arbeit"],["geprueft","Geprüft","halle"],["fertig","Fertig","wohnen"]]},
  bestand:{name:"Bestand (nur prüfen)",L:[["offen","Offen","sonst"],["geprueft","Geprüft","halle"],["maengel","Mängel","elektro"],["fertig","Fertig","wohnen"]]}};
const GV_ZST=(()=>{ const m=new Map(); Object.values(GV_VORH).forEach(v=>v.L.forEach(z=>{ if(!m.has(z[0])) m.set(z[0],z); })); return [...m.values()]; })();
const gvZst=id=>GV_ZST.find(z=>z[0]===id);
const gvVorh=(g,e)=>{ const b=e&&gvEtBt(g,e); return (b?b.vorhaben:g.vorhaben)||"sanierung"; };
const gvZstL=(g,e)=>{ const L=GV_VORH[gvVorh(g,e)].L; return L; };
const gvZstSeg=(r,act,g,e)=>`<div class="gv-zst">${(g?gvZstL(g,e):GV_ZST).map(([v,t,k])=>`<button type="button" class="ra-${k}" data-act="${act||"gvZstW"}" data-v="${v}" aria-pressed="${r.zustand===v}">${t}</button>`).join("")}</div>`;
/* Geräteprüfung (DGUV V3/V4): Gerät gehört zum Raum über raumId; alte Freitexte, die eindeutig auf einen Raum passen, zählen mit */
const gvNorm1=t=>String(t||"").toLowerCase().replace(/\s+/g,"");
function gvBmRaumId(g,bm){ if(bm.raumId) return bm.raumId; const t=gvNorm1(bm.raum); if(!t) return "";
  const R=gvAlleRaeume(g,null).filter(x=>{ const n=gvNorm1(x.r.name), nr=gvNorm1(gvNr(x.r.name).nr); return n===t||(nr&&(nr===t||nr.replace(/^[a-zäöü]+/,"")===t)); }); return R.length===1?R[0].r.id:""; }
const gvBmIm=(g,r)=>DB.betriebsmittel?live("betriebsmittel").filter(b=>b.ortId===g.ortId&&gvBmRaumId(g,b)===r.id):[];
/* Material: im Raum, dazu Standard vom Bauteil (oder vom Gebäude ohne Bauteil) */
const gvMatRaum=r=>(r.material=r.material||[]);
const gvMatOben=(g,e)=>{ const b=gvEtBt(g,e); return b?{wo:b.name,L:(b.material=b.material||[]),bt:b.id}:{wo:"Gebäude",L:(g.material=g.material||[]),bt:""}; };
const gvMatZeile=(m,scope)=>`<div class="li" role="button" tabindex="0" data-act="gvMat" data-id="${esc(m.id)}" data-s="${scope}"><span class="av">${icon("ra_lager")}</span><span class="lt"><span class="h">${esc(m.bez)}</span><span class="s">${esc([m.artnr&&`Art.-Nr. ${m.artnr}`,m.menge&&`${String(m.menge).replace(".",",")} ${m.einheit||"Stk"}`].filter(Boolean).join(" · ")||(scope==="oben"?"Standard":""))}</span></span>${icon("chev")}</div>`;
const gvFotos=(r,phase)=>typeof dateienVon==="function"?dateienVon("raeume",r.id).filter(d=>istBild(d)&&(phase==="rohbau"?d.phase==="rohbau":d.phase!=="rohbau")):[];
const gvFotoGrid=L=>L.length?`<div class="ab-grid">${L.map(d=>`<button class="ab-k" data-act="dateiOeffnen" data-id="${d.id}" aria-label="${esc(d.name)}"><img data-datei="${d.id}" alt=""><span class="ab-leer">${icon("cam")}</span></button>`).join("")}</div>`:"";
function gvRaumSeite(g,e,r){ const a=raArt(raVon(g,r,e)), z=r.bereichId&&gvBer(e).find(b=>b.id===r.bereichId), bt=gvEtBt(g,e);
  const V=gvVtIm(g,r), S=(g.stellen||[]).filter(x=>x.raumId===r.id).sort((x,y)=>(x.ord||0)-(y.ord||0)), D=(g.dosen||[]).filter(x=>x.raumId===r.id).sort((x,y)=>(x.ord||0)-(y.ord||0)), SR=(g.schraenke||[]).filter(x=>x.raumId===r.id);
  const K=g.knx&&g.knx.an?(g.knx.geraete||[]).filter(d=>d.raumId===r.id):[], KP=K.filter(d=>d.problem), N=gvNotizen(r), BM=gvBmIm(g,r), MO=gvMatOben(g,e), MR=gvMatRaum(r);
  const thema=(nr,t,knoepfe,inhalt)=>`<div class="sec-row gv-thema"><div class="sec-lbl"><span class="gv-tnr">${nr}</span>${t}</div>${knoepfe?`<span class="ab-btns">${knoepfe}</span>`:""}</div>${inhalt}`;
  const knopf=(act,ic,lbl,extra)=>`<button class="ab-ic" data-act="${act}"${extra||""} aria-label="${lbl}" title="${lbl}">${icon(ic)}</button>`;
  const kopf=`<section class="card gv-rkopf"><div class="gv-rk1">${raIcon(a?a.id:"sonst")}<div><b>${esc(a?a.name:"Ohne Raumart")}</b><small>${esc([z&&z.name,e.name,bt&&bt.name].filter(Boolean).join(" · "))}</small></div>${knopf("gvRaumEd","gvEdit","Raum bearbeiten",` data-id="${esc(r.id)}"`)}</div>
    <div class="lbl" style="margin:12px 2px 6px">Bauzustand · ${esc(GV_VORH[gvVorh(g,e)].name)}</div>${gvZstSeg(r,"",g,e)}</section>`;
  const prob=KP.length?`<section class="card kx-prob"><h3>Funktioniert nicht</h3>${ecListe(KP.map(d=>ecLi({lead:icon("warn"),ton:d.problem.art==="defekt"?"bad":"wip",kopf:esc([typeof kxPA==="function"&&kxPA(g,d),typeof kxTyp==="function"?kxTyp(d.typ).name:d.typ].filter(Boolean).join(" · ")),text:esc([d.problem.art==="defekt"?"defekt":"Problem",d.problem.notiz,d.problem.von].filter(Boolean).join(" · ")),act:"gvZuKnx",id:r.id})))}</section>`:"";
  const FR=gvFotos(r,"rohbau");
  const t1=thema(1,"Leitungswege / vor dem Verschließen",knopf("gvLeitung","gvEdit","Leitungsweg beschreiben")+knopf("gvFotoRohbau","cam","Foto, solange offen"),
    `${r.leitung?`<button type="button" class="gv-notiz" data-act="gvLeitung"><span>${esc(r.leitung)}</span></button>`:""}${gvFotoGrid(FR)}${!r.leitung&&!FR.length?`<p class="meta">Fotos, solange Wand oder Decke offen sind – am besten mit Zollstock im Bild, dann sieht man später, wo die Leitungen liegen.</p>`:""}`);
  const lst=L=>listOf(L);
  const t2=S.length?thema(2,`Elektroinstallation · ${S.length}`,"",lst(S.map(x=>{ const k=x.skId&&(g.stromkreise||[]).find(y=>y.id===x.skId); return `<div class="li"><span class="av">${icon("ecStecker")}</span><span class="lt"><span class="h">${esc((x.ord?x.ord+" · ":"")+(typeof ecStName==="function"?ecStName(x):"Anschlusspunkt"))}</span><span class="s">${esc([x.lage,k&&(typeof ecSkName==="function"?ecSkName(k):k.nr)].filter(Boolean).join(" · ")||"ohne Stromkreis")}</span></span></div>`; }))):"";
  const t3=BM.length?thema(3,`Geräte (DGUV V3) · ${BM.length}`,"",lst(BM.map(b=>{ const f=b.naechste&&b.naechste<ecHeute(); return `<div class="li"><span class="av">${icon("ecStecker")}</span><span class="lt"><span class="h">${esc(b.bez||"Gerät")}</span><span class="s">${esc([b.typ,b.inv&&`Inv. ${b.inv}`,b.zuletzt&&`geprüft ${ecDatum(b.zuletzt)}`,b.naechste&&`fällig ${ecDatum(b.naechste)}`].filter(Boolean).join(" · "))}</span>${f?`<span class="st">${pill("bad","fällig")}</span>`:b.erg?`<span class="st">${pill(b.erg==="ok"?"ok":"bad",b.erg==="ok"?"bestanden":"nicht bestanden")}</span>`:""}</span></div>`; }))):"";
  const t4=V.length?thema(4,`Verteiler · ${V.length}`,"",lst(V.map(v=>`<div class="li" role="button" tabindex="0" data-act="gvZuVt" data-id="${esc(v.id)}"><span class="av">${icon("ra_verteil")}</span><span class="lt"><span class="h">${esc(v.name||"Verteiler")}</span><span class="s">${esc((n=>`${n} Stromkreis${n===1?"":"e"}`)((g.stromkreise||[]).filter(k=>k.vId===v.id).length))}</span></span>${icon("chev")}</div>`))):"";
  const t5=SR.length||D.length?thema(5,`Netzwerk · ${SR.length+D.length}`,"",lst([...SR.map(x=>`<div class="li"><span class="av">${icon("ecNetz")}</span><span class="lt"><span class="h">${esc(x.name||"Netzwerkschrank")}</span><span class="s">Netzwerkschrank</span></span></div>`),...D.map(x=>`<div class="li"><span class="av">${icon("ra_server")}</span><span class="lt"><span class="h">${esc((x.ord?x.ord+" · ":"")+(typeof ecDoseName==="function"?ecDoseName(x):"Datendose"))}</span><span class="s">${esc(x.lage||"")}</span></span></div>`)])):"";
  const t6=K.length?thema(6,`KNX · ${K.length}`,"",lst(K.slice().sort((x,y)=>(typeof kxRang==="function"?kxRang(x.typ)-kxRang(y.typ):0)).map(d=>{ const pa=typeof kxPA==="function"?kxPA(g,d):"", t=typeof kxTyp==="function"?kxTyp(d.typ):{name:d.typ};
    return `<div class="li" role="button" tabindex="0" data-act="gvZuKnx" data-id="${esc(r.id)}"><span class="av gv-pa">${esc(pa||"–")}</span><span class="lt"><span class="h">${esc(t.name)}</span><span class="s">${esc(typeof kxZustandText==="function"?kxZustandText(d):"")}</span>${d.problem?`<span class="st">${pill(d.problem.art==="defekt"?"bad":"wip",d.problem.art==="defekt"?"defekt":"Problem")}</span>`:""}</span>${icon("chev")}</div>`; }))):"";
  const t7=thema(7,"Material",knopf("gvMatNeu","add","Material hinzufügen"),
    `${MR.length?lst(MR.map(m=>gvMatZeile(m,"raum"))):""}${MO.L.length?`<div class="gv-grp">Standard für ${esc(MO.wo)}</div>${lst(MO.L.map(m=>gvMatZeile(m,"oben")))}`:""}${!MR.length&&!MO.L.length?`<p class="meta">Schalterprogramm, Farbe, Leitungstypen – was für das ganze ${bt?"Bauteil":"Gebäude"} gilt, einmal als Standard eintragen.</p>`:""}`);
  const FN=gvFotos(r,""), DK=typeof dateienVon==="function"?dateienVon("raeume",r.id).filter(d=>!istBild(d)):[];
  const t8=thema(8,"Notizen und Fotos",knopf("gvNotiz","gvEdit","Notiz hinzufügen")+knopf("ablageFoto","cam","Foto aufnehmen",` data-kind="raeume" data-id="${esc(r.id)}"`)+knopf("ablageDatei","attach","Datei ablegen",` data-kind="raeume" data-id="${esc(r.id)}"`),
    `${N.length?`<div class="gv-notizen">${N.slice().sort((x,y)=>(y.at||0)-(x.at||0)).map(n=>`<button type="button" class="gv-notiz" data-act="gvNotiz" data-id="${esc(n.id)}"><span>${esc(n.text)}</span><small>${esc([n.von,n.at&&new Date(n.at).toLocaleDateString("de-DE")].filter(Boolean).join(" · "))}</small></button>`).join("")}</div>`:""}
     ${gvFotoGrid(FN)}${DK.length?lst(DK.map(d=>`<div class="li" role="button" tabindex="0" data-act="dateiOeffnen" data-id="${d.id}"><span class="av">${icon("doc")}</span><span class="lt"><span class="h">${esc(d.name)}</span><span class="s">${esc(groesse(d.groesse||0))}</span></span>${icon("chev")}</div>`)):""}
     ${!N.length&&!FN.length&&!DK.length?`<p class="meta">Noch nichts – z. B. „Decke abgehängt, Revisionsöffnung links“.</p>`:""}`);
  return `<div class="narrow gv-seite gv-raum">${kopf}${prob}${t1}${t2}${t3}${t4}${t5}${t6}${t7}${t8}</div>`; }
function gvMatDlg(id,scope){ const g=gvAkt(), f=g&&gvRaumFinden(g,nav.raum); if(!f) return; const MO=gvMatOben(g,f.e), L=scope==="oben"?MO.L:gvMatRaum(f.r), m=id&&L.find(x=>x.id===id); GV.mat={id:m?m.id:"",scope:scope||"raum"};
  dialog(m?"Material bearbeiten":"Material hinzufügen",`<div class="fg1">${tf("gvMb","Bezeichnung",m?m.bez:"",{form:true,ph:"z. B. Merten D-Life Steckdose polarweiß, NYM-J 3x1,5"})}</div>
    <div class="fg" style="margin-top:12px">${tf("gvMa","Artikelnummer (optional)",m&&m.artnr||"",{form:true,ph:"z. B. MEG2300-6035"})}<div class="reihe2">${tf("gvMm","Menge",m&&m.menge!=null?String(m.menge).replace(".",","):"",{form:true,im:"decimal",ph:"–"})}${sf("gvMe","Einheit",m&&m.einheit||"Stk",[["Stk","Stk"],["m","m"],["Pkg","Pkg"],["Rolle","Rolle"]],{form:true})}</div></div>
    ${m?"":`<div class="lbl" style="margin-top:14px">Gilt für</div><div class="knx-seg gv-matscope">${[["raum","nur diesen Raum"],["oben",`ganzes ${MO.bt?"Bauteil":"Gebäude"}`]].map(([v,t])=>`<button type="button" data-act="gvMatScope" data-v="${v}" aria-pressed="${GV.mat.scope===v}">${t}</button>`).join("")}</div>`}
    ${m&&scope==="oben"?`<p class="meta" style="margin-top:10px">Standard für ${esc(MO.wo)} – die Änderung gilt für alle Räume.</p>`:""}`,
    `${m?`<button class="btn-text danger" data-act="gvMatWeg">Löschen</button>`:""}<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="gvMatOk">Speichern</button>`,{breit:true}); }
function gvLeitungDlg(){ const g=gvAkt(), f=g&&gvRaumFinden(g,nav.raum); if(!f) return;
  dialog("Leitungsweg",`<div class="fg1">${ta("gvLw","Wie laufen die Leitungen?",f.r.leitung||"",{form:true,ph:"z. B. Zuleitung von UV 4.1 oben waagerecht 30 cm unter Decke, dann senkrecht neben Tür"})}</div>`,
    `<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="gvLeitungOk">Speichern</button>`,{breit:true}); }
function gvNotizDlg(id){ const g=gvAkt(), f=g&&gvRaumFinden(g,nav.raum); if(!f) return; const n=id&&gvNotizen(f.r).find(x=>x.id===id); GV.notiz=n?n.id:"";
  dialog(n?"Notiz bearbeiten":"Neue Notiz",`<div class="fg1">${ta("gvNt","Notiz",n?n.text:"",{form:true,ph:"z. B. Decke abgehängt, Revisionsöffnung links"})}</div>`,
    `${n?`<button class="btn-text danger" data-act="gvNotizWeg">Löschen</button>`:""}<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="gvNotizOk">Speichern</button>`,{breit:true});
  setTimeout(()=>{ const x=document.getElementById("f_gvNt"); if(x){ x.focus(); x.setSelectionRange(x.value.length,x.value.length); } },60); }
function gvTitel(){ const g=gvGeb(nav.ort), e=nav.et&&g.etagen.find(x=>x.id===nav.et); if(!e) return {title:ecOrt(nav.ort).titel,sub:"Gebäude"};
  const rr=nav.raum&&e.raeume.find(x=>x.id===nav.raum); if(rr){ const a=raArt(raVon(g,rr,e)); return {title:rr.name,sub:[a&&a.name,e.name].filter(Boolean).join(" · ")}; }
  const b=gvEtBt(g,e), gs=gvGs(e), gsT=gs!=null?ecGeschossName(gs):""; return {title:e.name,sub:[b&&b.name,gsT&&gsT!==e.name?gsT:""].filter(Boolean).join(" · ")||"Etage"}; }
const gvAkt=()=>{ const g=nav.v==="geb"?gvGeb(nav.ort):nav.v==="kx"&&typeof kxGebAkt==="function"?kxGebAkt():null; return g?gvNorm(g):null; };
const gvSpeichern=g=>{ if(g.knx) g.knx.updated=Date.now(); ecGebSpeichern(g); };

/* ---- Räume anlegen (auch aus KNX) ---- */
const gvEtOpts=(g,bt)=>{ const E=gvEtVon(g,bt); return E.length?E.map(e=>[e.id,e.name]):[["","– noch keine, rechts neue eintragen –"]]; };
function gvRaumNeuDlg(g,etId){ if(!g) return; gvNorm(g); const B=g.bauteile, E=ecEtagen(g), etA=etId&&E.find(e=>e.id===etId);
  const bt=etA?(etA.bauteilId||""):nav.v==="geb"?gvSel(g):(GV.bt&&B.some(b=>b.id===GV.bt)?GV.bt:(B.length?B[0].id:"")), EB=gvEtVon(g,bt), et0=etA||EB.find(e=>e.raeume.length)||EB[0]; GV.gsHand=false;
  dialog("Räume anlegen",`<div class="fg">${sf("kxBt","Bauteil",bt,[...(B.length&&!g.etagen.some(e=>!e.bauteilId&&e.raeume.length)?[]:[["","– ohne –"]]),...B.map(b=>[b.id,b.name])],{form:true})}${tf("kxBtNeu","oder neues Bauteil","",{form:true,ph:"z. B. B"})}</div>
    <div class="fg" style="margin-top:12px"><div id="kxEtFeld">${sf("kxEt","Etage",(et0||{}).id||"",gvEtOpts(g,bt),{form:true})}</div>${tf("kxEtNeu","oder neue Etage","",{form:true,ph:"z. B. Level 4"})}</div>
    <div class="fg1" style="margin-top:12px">${sf("kxGs","Geschoss",et0&&gvGs(et0)!=null?String(gvGs(et0)):"",gvGsOpts(),{form:true})}</div>
    <p class="meta" style="margin:6px 4px 0">Heißt die Etage beim Kunden anders (z. B. „Level 4“), hier das echte Geschoss wählen. Gilt für die Etage überall, auch in der Prüfung.</p>
    <div class="fg1" style="margin-top:12px">${tf("kxRn","Räume","",{form:true,ph:"z. B. 403-407, 410, Flur"})}</div>
    <p class="meta" style="margin:8px 4px 0">In der Reihenfolge eintragen, in der du durchgehst – daraus folgen später die KNX-Adressen. Bereiche mit Bindestrich.${B.some(gvVor)?" Ist beim Bauteil „mit Bauteil davor“ eingestellt, kommt der Zusatz automatisch (403 → B 403).":""}</p>`,
    `<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="gvRaumOk">Anlegen</button>`,{breit:true});
  setTimeout(()=>{ const e=document.getElementById("f_kxRn"); if(e) e.focus(); },60); }
function gvRaumNamen(t){ const out=[]; String(t||"").split(/[,;\n]+/).map(s=>s.trim()).filter(Boolean).forEach(s=>{ const m=s.match(/^(\D*?)(\d+)\s*[-–]\s*\1?(\d+)$/);
    if(m&&+m[3]>=+m[2]&&+m[3]-+m[2]<200){ const w=m[2].length; for(let n=+m[2];n<=+m[3];n++) out.push(m[1]+String(n).padStart(m[2].startsWith("0")?w:0,"0")); } else out.push(s); }); return out; }
function gvRaumOk(){ const g=gvAkt(); if(!g) return; const F=formVals(), N=gvRaumNamen(F.kxRn); if(!N.length){ toast("Bitte Raumnummern eintragen"); return; }
  let bt=F.kxBt||"", btNeu=false; if(F.kxBtNeu){ btNeu=!g.bauteile.some(b=>b.name.toLowerCase()===F.kxBtNeu.toLowerCase()); const vorh=g.bauteile.find(b=>b.name.toLowerCase()===F.kxBtNeu.toLowerCase()); bt=vorh?vorh.id:(()=>{ const b={id:"b-"+uid(),name:F.kxBtNeu}; g.bauteile.push(b); return b.id; })(); }
  let et=!btNeu&&g.etagen.find(e=>e.id===F.kxEt&&(e.bauteilId||"")===bt); if(F.kxEtNeu){ et=g.etagen.find(e=>(e.bauteilId||"")===bt&&e.name.toLowerCase()===F.kxEtNeu.toLowerCase()); if(!et){ et={id:uid(),name:F.kxEtNeu,raeume:[],...(bt?{bauteilId:bt}:{})}; g.etagen.push(et); } }
  if(!et){ if(btNeu){ const b=g.bauteile.find(x=>x.id===bt); if(b) g.bauteile=g.bauteile.filter(x=>x!==b); } toast("Bitte eine Etage wählen oder neu eintragen"); return; }
  if(F.kxGs!==""&&F.kxGs!=null) et.ebene=+F.kxGs; else if(F.kxEtNeu){ const eb=ecEbeneRaten(F.kxEtNeu); if(eb!=null) et.ebene=eb; }
  /* gleicher Name auf derselben Etage: vorhandenen Raum nehmen (z. B. aus der Prüfung) und ihm das Bauteil geben, statt ihn doppelt anzulegen */
  const bb=g.bauteile.find(x=>x.id===(et.bauteilId||bt)); let neu=0, zug=0; N.map(n=>gvMitVor(bb,n)).forEach(n=>{ const da=et.raeume.find(r=>r.name===n&&(!r.bauteilId||!bt||r.bauteilId===bt));
    if(da){ if(bt&&!da.bauteilId){ da.bauteilId=bt; zug++; } return; } et.raeume.push({id:uid(),name:n,...(bt?{bauteilId:bt}:{})}); neu++; });
  GV.bt=bt; if(nav.v==="geb"){ GV.sel=bt; } gvSpeichern(g); closeOverlays(); render();
  toast(neu||zug?[neu&&`${neu} ${neu>1?"Räume":"Raum"} angelegt`,zug&&`${zug} vorhandene${zug>1?"":"r"} Raum Bauteil zugeordnet`].filter(Boolean).join(" · "):"Diese Räume gibt es schon"); }
/* Geschoss-Feld mitführen */
function gvGsSetzen(v){ const s=document.getElementById("f_kxGs"); if(!s) return; s.value=v==null?"":String(v); if(s.value!==(v==null?"":String(v))) s.value=""; }
document.addEventListener("change",ev=>{ const el=ev.target; if(el.id==="f_kxGs"||el.id==="f_gvGs"){ GV.gsHand=el.value!==""; return; }
  if(el.id==="f_kxBt"&&document.getElementById("kxEtFeld")){ const g=gvAkt(); if(!g) return; const E=gvEtVon(g,el.value), f=document.getElementById("kxEtFeld");
    f.innerHTML=sf("kxEt","Etage",(E.find(e=>e.raeume.length)||E[0]||{}).id||"",gvEtOpts(g,el.value),{form:true}); const s=document.getElementById("f_kxEt");
    if(!(document.getElementById("f_kxEtNeu")||{}).value){ const e=g.etagen.find(x=>x.id===(s||{}).value); GV.gsHand=false; gvGsSetzen(e?gvGs(e):null); } return; }
  if(el.id==="f_kxEt"&&!(document.getElementById("f_kxEtNeu")||{}).value){ const g=gvAkt(), e=g&&g.etagen.find(x=>x.id===el.value); GV.gsHand=false; gvGsSetzen(e?gvGs(e):null); } });
document.addEventListener("input",ev=>{ const el=ev.target;
  if(el.id==="f_kxEtNeu"&&!GV.gsHand){ const v=el.value.trim(); if(v) gvGsSetzen(ecEbeneRaten(v)); else { const g=gvAkt(), e=g&&g.etagen.find(x=>x.id===(document.getElementById("f_kxEt")||{}).value); gvGsSetzen(e?gvGs(e):null); } }
  if(el.id==="f_gvEn"&&!GV.gsHand){ const s=document.getElementById("f_gvGs"), v=el.value.trim().replace(/\s*[-–]\s*\d+$/,""); if(s){ const eb=v?ecEbeneRaten(v):null; s.value=eb==null?"":String(eb); if(eb!=null&&s.value!==String(eb)) s.value=""; } } });

/* ---- Etage ---- */
function gvEtDlg(id){ const g=gvAkt(); if(!g) return; const e=id&&g.etagen.find(x=>x.id===id); GV.et=e?e.id:""; const B=g.bauteile, bt0=e?(e.bauteilId||""):nav.v==="geb"?gvSel(g):""; GV.gsHand=!!(e&&gvGs(e)!=null); GV.loesch=false;
  const vorschl=e?[]:["KG","EG","1. OG","2. OG","3. OG","DG"].filter(n=>!gvEtVon(g,bt0).some(x=>x.name===n));
  dialog(e?"Etage bearbeiten":"Etage hinzufügen",`<div class="fg1">${tf("gvEn","Bezeichnung",e?e.name:"",{form:true,ph:e?"z. B. Level 4":"z. B. 1. OG, Level 4 oder Level 1-5"})}</div>
    ${B.length?`<div class="fg1" style="margin-top:12px">${sf("gvEb","Bauteil",bt0,[["","– ohne –"],...B.map(b=>[b.id,b.name])],{form:true})}</div>`:""}
    ${vorschl.length?`<div class="chips ec-wahl">${vorschl.map(n=>`<button type="button" class="chip" data-act="gvEtVorschl" data-v="${esc(n)}">${esc(n)}</button>`).join("")}</div>`:""}
    <div class="fg1" style="margin-top:14px">${sf("gvGs",e?"Geschoss":"Geschoss (bei mehreren: das erste)",e&&gvGs(e)!=null?String(gvGs(e)):"",gvGsOpts(),{form:true})}</div>
    <p class="meta" style="margin-top:8px">Heißt die Etage beim Kunden anders, z. B. „Level 4“, hier das echte Geschoss wählen – sortiert wird danach, angezeigt der Name.${e?"":" Mehrere auf einmal mit Bindestrich: „Level 1-5“."}</p>`,
    `${e?`<button class="btn-text danger" data-act="gvEtWeg">Löschen</button>`:""}<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="gvEtOk">${e?"Speichern":"Hinzufügen"}</button>`,{breit:true});
  if(!e) setTimeout(()=>{ const x=document.getElementById("f_gvEn"); if(x) x.focus(); },60); }
function gvEtOk(){ const g=gvAkt(); if(!g) return; const F=formVals(), n=String(F.gvEn||"").trim(), gs=F.gvGs!==""&&F.gvGs!=null?+F.gvGs:null; if(!n){ toast("Bitte eine Bezeichnung eingeben"); return; }
  const bt=F.gvEb||"";
  if(GV.et){ const e=g.etagen.find(x=>x.id===GV.et); if(!e) return; e.name=n; if((e.bauteilId||"")!==bt){ if(bt) e.bauteilId=bt; else delete e.bauteilId; e.raeume.forEach(r=>{ if(bt) r.bauteilId=bt; else delete r.bauteilId; }); if(nav.v==="geb") GV.sel=bt; } if(gs!=null) e.ebene=gs; else { const eb=ecEbeneRaten(n); if(eb!=null) e.ebene=eb; else delete e.ebene; } gvSpeichern(g); closeOverlays(); render(); return; }
  const m=n.match(/^(.*?)(-?\d+)\s*[-–]\s*(-?\d+)$/); let neu=0;
  const add=(name,eb)=>{ if(gvEtVon(g,bt).some(x=>x.name.toLowerCase()===name.toLowerCase())) return; const e={id:uid(),name,raeume:[],...(bt?{bauteilId:bt}:{})}; if(eb!=null) e.ebene=eb; g.etagen.push(e); neu++; };
  if(m&&+m[3]>=+m[2]&&+m[3]-+m[2]<=30){ const vor=m[1]; for(let k=+m[2];k<=+m[3];k++){ const name=`${vor}${k}`.trim(); add(name,gs!=null?gs+(k-+m[2]):ecEbeneRaten(name)); } }
  else add(n,gs!=null?gs:ecEbeneRaten(n));
  /* die leere Standard-Etage „EG“ (ohne Räume, ohne Geschoss von Hand) fällt weg, sobald eigene Etagen da sind */
  const std=g.etagen.find(x=>x.id==="eg"&&!x.raeume.length&&x.ebene==null); if(neu&&std&&g.etagen.length>1&&!g.etagen.some(x=>x!==std&&ecEbene(x)===0&&/^eg$/i.test(x.name))&&!/^(eg|erdgeschoss)/i.test(n)) g.etagen=g.etagen.filter(x=>x!==std);
  if(nav.v==="geb") GV.sel=bt; gvSpeichern(g); closeOverlays(); render(); toast(neu?`${neu} Etage${neu>1?"n":""} hinzugefügt`:"Diese Etage gibt es schon"); }
/* ---- Bauteil ---- */
/* Raumnummern mit Bauteil davor (z. B. Bauteil B: 403 → B403) – Zusatz = Kürzel, sonst Name ohne „Bauteil“ */
const gvVorText=b=>String(b&&(b.kurz||String(b.name||"").replace(/^bauteil\s*/i,""))||"").trim();
const gvVor=b=>b&&b.raumVor?gvVorText(b):"";
/* mit Leerzeichen dazwischen: „B 403“ */
const gvOhneVor=(v,n)=>v&&n.toLowerCase().startsWith(v.toLowerCase())&&/^\s*\d/.test(n.slice(v.length))?n.slice(v.length).trim():n;
const gvMitVor=(b,n)=>{ const v=gvVor(b); if(!v) return n; const o=gvOhneVor(v,n); return o!==n||!n.toLowerCase().startsWith(v.toLowerCase())?`${v} ${o}`:n; };
let GV_VOR=false, GV_NUTZ="", GV_VORHW="sanierung";
function gvBtDlg(id){ const g=gvAkt(); if(!g) return; const b=id&&g.bauteile.find(x=>x.id===id); GV.bt=b?b.id:""; GV.loesch=false; GV_VOR=!!(b&&b.raumVor); GV_NUTZ=b?(b.nutzung||""):""; GV_VORHW=b&&b.vorhaben||"sanierung";
  dialog(b?"Bauteil bearbeiten":"Bauteil hinzufügen",`<div class="fg">${tf("gvBn","Bezeichnung",b?b.name:"",{form:true,ph:"z. B. Bauteil B oder Halle 3"})}${tf("gvBk","Kürzel (optional)",b&&b.kurz||"",{form:true,ph:"z. B. B"})}</div>
    ${b?"":`<p class="meta" style="margin-top:8px">Mehrere auf einmal mit Komma: „Bauteil A, Bauteil B“.</p>`}
    <div class="lbl" style="margin-top:14px">Vorhaben (bestimmt die Bauzustände)</div><div class="knx-seg gv-vorh">${Object.entries(GV_VORH).map(([v,o])=>`<button type="button" data-act="gvVorhW" data-v="${v}" aria-pressed="${GV_VORHW===v}">${esc(o.name.split(" ")[0])}</button>`).join("")}</div>
    <div class="lbl" style="margin-top:14px">Nutzung (Raumart für reine Nummern)</div><div class="knx-seg gv-nutz">${RA_NUTZUNG.map(([v,t])=>`<button type="button" data-act="gvNutzW" data-v="${v}" aria-pressed="${(GV_NUTZ||"")===v}">${t}</button>`).join("")}</div>
    <div class="lbl" style="margin-top:14px">Raumnummern</div><div class="knx-seg gv-vor">${[["0","nur die Nummer"],["1",`mit Bauteil davor`]].map(([v,t])=>`<button type="button" data-act="gvVorWahl" data-v="${v}" aria-pressed="${GV_VOR===(v==="1")}">${t}</button>`).join("")}</div>
    <p class="meta" id="gvVorBsp" style="margin-top:8px">${gvVorBsp()}</p>`,
    `${b?`<button class="btn-text danger" data-act="gvBtWeg">Löschen</button>`:""}<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="gvBtOk">${b?"Speichern":"Hinzufügen"}</button>`,{breit:true});
  if(!b) setTimeout(()=>{ const x=document.getElementById("f_gvBn"); if(x) x.focus(); },60); }
function gvVorBsp(){ const n=((document.getElementById("f_gvBn")||{}).value||"").split(",")[0].trim(), k=((document.getElementById("f_gvBk")||{}).value||"").trim();
  const v=gvVorText({name:n,kurz:k})||"B"; return GV_VOR?`Du tippst „403-407“, angelegt wird ${esc(v)} 403 bis ${esc(v)} 407. Vorhandene Räume dieses Bauteils bekommen den Zusatz beim Speichern auch. Davor steht das Kürzel, sonst die Bezeichnung ohne „Bauteil“.`:"Räume heißen so, wie du sie eintippst (z. B. 403)."; }
document.addEventListener("input",ev=>{ if((ev.target.id==="f_gvBn"||ev.target.id==="f_gvBk")&&document.getElementById("gvVorBsp")) document.getElementById("gvVorBsp").innerHTML=gvVorBsp(); });
function gvBtOk(){ const g=gvAkt(); if(!g) return; const F=formVals(), n=String(F.gvBn||"").trim(); if(!n){ toast("Bitte eine Bezeichnung eingeben"); return; }
  let geaendert=0;
  if(GV.bt){ const b=g.bauteile.find(x=>x.id===GV.bt); if(!b) return; const alt=gvVor(b); b.name=n; if(F.gvBk) b.kurz=F.gvBk; else delete b.kurz; if(GV_VOR) b.raumVor=true; else delete b.raumVor; if(GV_NUTZ) b.nutzung=GV_NUTZ; else delete b.nutzung; b.vorhaben=GV_VORHW; const neu=gvVor(b);
    if(alt!==neu) g.etagen.forEach(e=>{ if((e.bauteilId||"")!==b.id) return; e.raeume.forEach(r=>{ const m=neu?(gvOhneVor(alt,r.name)):gvOhneVor(alt,r.name), z=neu?gvMitVor(b,m):m; if(z!==r.name){ r.name=z; geaendert++; } }); }); }
  else n.split(/\s*,\s*/).filter(Boolean).forEach((x,i)=>{ if(!g.bauteile.some(b=>b.name.toLowerCase()===x.toLowerCase())){ const b={id:"b-"+uid(),name:x,...(F.gvBk&&!/,/.test(n)?{kurz:F.gvBk}:{}),...(GV_VOR?{raumVor:true}:{}),...(GV_NUTZ?{nutzung:GV_NUTZ}:{}),vorhaben:GV_VORHW}; g.bauteile.push(b); } });
  gvSpeichern(g); closeOverlays(); render(); if(geaendert) toast(`${geaendert} Raumnummer${geaendert===1?"":"n"} angepasst`); }
/* ---- Raum ---- */
const gvRaumFinden=(g,id)=>{ for(const e of g.etagen){ const r=e.raeume.find(x=>x.id===id); if(r) return {e,r}; } return null; };
const gvRaumBezug=(g,id)=>(g.stellen||[]).filter(s=>s.raumId===id).length+(g.dosen||[]).filter(d=>d.raumId===id).length+((g.knx&&g.knx.geraete)||[]).filter(d=>d.raumId===id).length;
function gvRaumDlg(id){ const g=gvAkt(), f=g&&gvRaumFinden(g,id); if(!f) return; GV.raum=id; GV.loesch=false; GV.vtSel=new Set((g.verteiler||[]).filter(v=>v.raumId===id).map(v=>v.id)); const E=ecEtagen(g);
  dialog("Raum bearbeiten",`<div class="fg1">${tf("gvRn","Bezeichnung",f.r.name,{form:true})}</div>
    <div class="fg1" style="margin-top:12px">${sf("gvRe",g.bauteile.length?"Bauteil und Etage":"Etage",f.e.id,E.map(e=>[e.id,gvEtName(g,e)]),{form:true})}</div>
    ${gvBer(f.e).length?`<div class="fg1" style="margin-top:12px">${sf("gvRber","Bereich",f.r.bereichId||"",[["","– ohne –"],...gvBer(f.e).map(b=>[b.id,b.name])],{form:true})}</div>`:""}
    <div class="fg1" style="margin-top:12px">${(()=>{ const auto=raVon(g,{...f.r,art:""},f.e); return sf("gvRart","Raumart",f.r.art||"",[["",`automatisch${auto?` (${raArt(auto).name})`:""}`],...Object.keys(RA_KAT).flatMap(k=>RA_LISTE.filter(a=>a.kat===k).map(a=>[a.id,`${a.name} · ${RA_KAT[k]}`]))],{form:true}); })()}</div>
    <div class="lbl" style="margin-top:14px">Verteiler in diesem Raum</div>
    ${(g.verteiler||[]).length?`<div class="gv-vtw">${g.verteiler.map(v=>{ const w=v.raumId&&v.raumId!==f.r.id&&gvRaumFinden(g,v.raumId); return `<button type="button" class="gv-berk" data-act="gvVtW" data-v="${esc(v.id)}" aria-pressed="${v.raumId===f.r.id}"><b>${esc(v.name||"Verteiler")}</b>${w?`<small>jetzt in ${esc(w.r.name)}</small>`:""}</button>`; }).join("")}</div>`:""}
    <div class="fg1" style="margin-top:8px">${tf("gvRvtNeu","Neuer Verteiler hier (Name)","",{form:true,ph:"z. B. UV 4.1"})}</div>
    <div class="gv-schieb"><span class="meta">Reihenfolge auf der Etage</span><button type="button" class="kx-tk" data-act="gvRAuf" aria-label="nach vorne">↑</button><button type="button" class="kx-tk" data-act="gvRAb" aria-label="nach hinten">↓</button></div>`,
    `<button class="btn-text danger" data-act="gvRaumWeg">Löschen</button><span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="gvRaumSp">Speichern</button>`,{breit:true}); }
function gvRaumSp(){ const g=gvAkt(), f=g&&gvRaumFinden(g,GV.raum); if(!f) return; const F=formVals(), n=String(F.gvRn||"").trim(); if(!n){ toast("Bitte eine Bezeichnung eingeben"); return; }
  f.r.name=n; if(F.gvRart) f.r.art=F.gvRart; else delete f.r.art;
  (g.verteiler||[]).forEach(v=>{ if(GV.vtSel.has(v.id)) v.raumId=f.r.id; else if(v.raumId===f.r.id) v.raumId=""; });
  if(String(F.gvRvtNeu||"").trim()) g.verteiler.push({id:uid(),name:String(F.gvRvtNeu).trim(),raumId:f.r.id,stand:ecHeute(),ersteller:(typeof ME!=="undefined"&&ME.name)||""});
  if(F.gvRber!==undefined){ if(F.gvRber) f.r.bereichId=F.gvRber; else delete f.r.bereichId; }
  if(F.gvRe&&F.gvRe!==f.e.id){ const z=g.etagen.find(x=>x.id===F.gvRe); if(z){ f.e.raeume=f.e.raeume.filter(x=>x!==f.r); z.raeume.push(f.r); if(nav.raum===f.r.id) nav.et=z.id; delete f.r.bereichId; if(z.bauteilId) f.r.bauteilId=z.bauteilId; else delete f.r.bauteilId; } }
  gvSpeichern(g); closeOverlays(); render(); }

/* ===== Klicks ===== */
document.addEventListener("click",ev=>{ const b=ev.target.closest&&ev.target.closest('[data-act^="gv"]'); if(!b) return; const a=b.dataset.act; ev.stopPropagation();
  if(a==="gvAuf"){ closeOverlays(); go({v:"geb",ort:b.dataset.v,...(nav.v==="kunde"||nav.v==="standort"?{von:{v:nav.v,id:nav.id}}:{})}); return; }
  if(a==="gvRaumNeu"){ gvRaumNeuDlg(gvAkt(),b.dataset.id||(nav.v==="geb"&&nav.et)||""); return; }
  if(a==="gvEtAuf"){ nav.et=b.dataset.id; GV.teil=""; GV.f={arten:[],ber:"",vt:false,zst:""}; if(typeof query!=="undefined") query=""; render(); scrollTo(0,0); return; }
  if(a==="gvTeilAn"){ GV.teil=b.dataset.id; GV.wsel=new Set(); render(); scrollTo(0,0); return; }
  if(a==="gvSelR"){ const id=b.dataset.id; if(GV.wsel.has(id)) GV.wsel.delete(id); else GV.wsel.add(id); const y=scrollY; render(); scrollTo(0,y); return; }
  if(a==="gvSelGrp"){ const g=gvAkt(), e=g&&g.etagen.find(x=>x.id===nav.et); if(!e) return; const ids=gvWahlIds(gvAlleRaeume(g,e),b.dataset.v), alle=ids.every(i=>GV.wsel.has(i)); ids.forEach(i=>{ if(alle) GV.wsel.delete(i); else GV.wsel.add(i); }); const y=scrollY; render(); scrollTo(0,y); return; }
  if(a==="gvSetBer"){ gvSetBerDlg(); return; }
  if(a==="gvSetArt"){ gvSetArtDlg(); return; }
  if(a==="gvSetEt"){ gvSetEtDlg(); return; }
  if(a==="gvBerSetzen"||a==="gvBerNeuSetzen"){ const g=gvAkt(), e=g&&g.etagen.find(x=>x.id===nav.et); if(!e) return; let id=b.dataset.v||"";
    if(a==="gvBerNeuSetzen"){ const n=String(formVals().gvBerNeuN||"").trim(); if(!n){ toast("Bitte einen Namen für den Bereich eintragen"); return; } const da=gvBer(e).find(z=>z.name.toLowerCase()===n.toLowerCase()); id=da?da.id:(()=>{ const z={id:"z-"+uid(),name:n}; gvBer(e).push(z); return z.id; })(); }
    const S=gvSelRaeume(g,e); S.forEach(r=>{ if(id) r.bereichId=id; else delete r.bereichId; }); gvSpeichern(g); closeOverlays(); const y=scrollY; render(); scrollTo(0,y);
    const z=gvBer(e).find(x=>x.id===id); toast(`${S.length} ${S.length===1?"Raum":"Räume"} ${z?`→ ${z.name}`:"ohne Bereich"}`); return; }
  if(a==="gvArtSetzen"){ const g=gvAkt(), e=g&&g.etagen.find(x=>x.id===nav.et); if(!e) return; const v=b.dataset.v||"", S=gvSelRaeume(g,e); S.forEach(r=>{ if(v) r.art=v; else delete r.art; }); gvSpeichern(g); closeOverlays(); const y=scrollY; render(); scrollTo(0,y);
    toast(`${S.length} ${S.length===1?"Raum":"Räume"} → ${v?raArt(v).name:"Raumart automatisch"}`); return; }
  if(a==="gvEtSetzen"){ const g=gvAkt(), e=g&&g.etagen.find(x=>x.id===nav.et), z=g&&g.etagen.find(x=>x.id===b.dataset.v); if(!e||!z) return; const S=gvSelRaeume(g,e);
    e.raeume=e.raeume.filter(r=>!GV.wsel.has(r.id)); S.forEach(r=>{ delete r.bereichId; if(z.bauteilId) r.bauteilId=z.bauteilId; else delete r.bauteilId; z.raeume.push(r); }); GV.wsel=new Set(); gvSpeichern(g); closeOverlays(); render(); toast(`${S.length} ${S.length===1?"Raum":"Räume"} nach ${z.name} verschoben`); return; }
  if(a==="gvTeilAus"){ GV.teil=""; render(); return; }
  if(a==="gvTeilW"){ GV.teilArt=b.dataset.v; render(); return; }
  if(a==="gvArtW"){ GV.art=GV.art===b.dataset.v?"":b.dataset.v; const y=scrollY; render(); scrollTo(0,y); return; }
  if(a==="gvTeilA"){ const g=gvAkt(), f=g&&gvRaumFinden(g,b.dataset.id); if(!f) return; if(!GV.art){ toast("Erst oben eine Raumart wählen"); return; }
    if(f.r.art===GV.art) delete f.r.art; else f.r.art=GV.art; const y=scrollY; gvSpeichern(g); render(); scrollTo(0,y); return; }
  if(a==="gvAns"){ GV_ANS=GV_ANS==="liste"?"kachel":"liste"; try{ localStorage.setItem("irrgang_gv_ansicht",GV_ANS); }catch(e){} const y=scrollY; render(); scrollTo(0,y); return; }
  if(a==="gvArtF"){ const k=b.dataset.v, i=GV.f.arten.indexOf(k); if(i<0) GV.f.arten.push(k); else GV.f.arten.splice(i,1); const y=scrollY; render(); scrollTo(0,y); return; }
  if(a==="gvFilt"){ gvFiltDlg(); return; }
  if(a==="gvFArt"||a==="gvFBer"||a==="gvFVt"){ if(a==="gvFArt"){ const k=b.dataset.v, i=GV.f.arten.indexOf(k); if(i<0) GV.f.arten.push(k); else GV.f.arten.splice(i,1); } if(a==="gvFBer") GV.f.ber=GV.f.ber===b.dataset.v?"":b.dataset.v; if(a==="gvFVt") GV.f.vt=!GV.f.vt; gvFiltDlg(); render(); return; }
  if(a==="gvFAus"){ GV.f={arten:[],ber:"",vt:false,zst:""}; closeOverlays(); render(); return; }
  if(a==="gvFOk"){ closeOverlays(); render(); return; }
  if(a==="gvVorhW"){ GV_VORHW=b.dataset.v; b.parentElement.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x===b))); return; }
  if(a==="gvNutzW"){ GV_NUTZ=b.dataset.v; b.parentElement.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x===b))); return; }
  if(a==="gvVtW"){ const v=b.dataset.v; if(GV.vtSel.has(v)) GV.vtSel.delete(v); else GV.vtSel.add(v); b.setAttribute("aria-pressed",String(GV.vtSel.has(v))); return; }
  if(a==="gvBerW"){ GV.ber=b.dataset.v; const y=scrollY; render(); scrollTo(0,y); return; }
  if(a==="gvBerNeu"){ gvBerDlg(); return; }
  if(a==="gvBerEd"){ gvBerDlg(b.dataset.v); return; }
  if(a==="gvBerOk"){ const g=gvAkt(), e=g&&g.etagen.find(x=>x.id===nav.et); if(!e) return; const n=String(formVals().gvBen||"").trim(); if(!n){ toast("Bitte eine Bezeichnung eingeben"); return; }
    if(GV.berDlg){ const x=gvBer(e).find(z=>z.id===GV.berDlg); if(x) x.name=n; }
    else { let erst=""; n.split(/\s*,\s*/).filter(Boolean).forEach(t=>{ if(gvBer(e).some(z=>z.name.toLowerCase()===t.toLowerCase())) return; const z={id:"z-"+uid(),name:t}; gvBer(e).push(z); if(!erst) erst=z.id; }); if(erst) GV.ber=erst; }
    gvSpeichern(g); closeOverlays(); render(); return; }
  if(a==="gvBerWeg"){ const g=gvAkt(), e=g&&g.etagen.find(x=>x.id===nav.et); if(!e) return; const id=GV.berDlg; e.bereiche=gvBer(e).filter(z=>z.id!==id); e.raeume.forEach(r=>{ if(r.bereichId===id) delete r.bereichId; }); if(GV.ber===id) GV.ber=e.bereiche[0]?e.bereiche[0].id:"";
    gvSpeichern(g); closeOverlays(); render(); return; }
  if(a==="gvTeilR"){ const g=gvAkt(), f=g&&gvRaumFinden(g,b.dataset.id); if(!f) return; if(!GV.ber){ toast("Erst oben einen Bereich wählen"); return; }
    if(f.r.bereichId===GV.ber) delete f.r.bereichId; else f.r.bereichId=GV.ber; const y=scrollY; gvSpeichern(g); render(); scrollTo(0,y); return; }
  if(a==="gvRaumOk"){ gvRaumOk(); return; }
  if(a==="gvEtNeu"){ gvEtDlg(); return; }
  if(a==="gvEt"){ gvEtDlg(b.dataset.id); return; }
  if(a==="gvEtVorschl"){ const x=document.getElementById("f_gvEn"); if(x){ x.value=b.dataset.v; x.dispatchEvent(new Event("input",{bubbles:true})); if(x.parentElement) x.parentElement.classList.add("fl"); } return; }
  if(a==="gvEtOk"){ gvEtOk(); return; }
  if(a==="gvEtWeg"){ const g=gvAkt(), e=g&&g.etagen.find(x=>x.id===GV.et); if(!e) return; if(g.etagen.length<2){ toast("Mindestens eine Etage bleibt"); return; } if(e.raeume.length){ toast("Erst die Räume dieser Etage löschen oder verschieben"); return; }
    g.etagen=g.etagen.filter(x=>x!==e); if(nav.et===e.id) nav.et=null; gvSpeichern(g); closeOverlays(); render(); return; }
  if(a==="gvBtNeu"){ gvBtDlg(); return; }
  if(a==="gvBt"){ gvBtDlg(b.dataset.id); return; }
  if(a==="gvVorWahl"){ GV_VOR=b.dataset.v==="1"; b.parentElement.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x===b))); const p=document.getElementById("gvVorBsp"); if(p) p.innerHTML=gvVorBsp(); return; }
  if(a==="gvBtSel"){ GV.sel=b.dataset.v; render(); return; }
  if(a==="gvEtZu"){ const g=gvAkt(); if(!g) return; const bt=b.dataset.v, bb=g.bauteile.find(x=>x.id===bt); let n=0; g.etagen.forEach(e=>{ if(!e.bauteilId&&(e.raeume.length||e.id!=="eg")){ e.bauteilId=bt; e.raeume.forEach(r=>{ r.bauteilId=bt; }); n++; } });
    GV.sel=bt; gvSpeichern(g); render(); toast(`${n} Etage${n===1?"":"n"} zu ${bb?bb.name:"Bauteil"}`); return; }
  if(a==="gvBtOk"){ gvBtOk(); return; }
  if(a==="gvBtWeg"){ const g=gvAkt(); if(!g) return; const id=GV.bt, n=g.etagen.filter(e=>e.bauteilId===id).length+g.etagen.reduce((s,e)=>s+e.raeume.filter(r=>r.bauteilId===id).length,0)+g.verteiler.filter(v=>v.bauteilId===id).length;
    if(n&&!GV.loesch){ GV.loesch=true; b.textContent=`Trotzdem löschen (Etagen, Räume und Verteiler verlieren das Bauteil)`; return; }
    g.bauteile=g.bauteile.filter(x=>x.id!==id); g.etagen.forEach(e=>{ if(e.bauteilId===id) delete e.bauteilId; e.raeume.forEach(r=>{ if(r.bauteilId===id) delete r.bauteilId; }); }); g.verteiler.forEach(v=>{ if(v.bauteilId===id) v.bauteilId=""; }); GV.bt="";
    gvSpeichern(g); closeOverlays(); render(); return; }
  if(a==="gvRaum"){ const g=gvAkt(), f=g&&gvRaumFinden(g,b.dataset.id); if(!f) return; if(nav.v==="geb"){ nav.et=f.e.id; nav.raum=f.r.id; render(); scrollTo(0,0); } else gvRaumDlg(b.dataset.id); return; }
  if(a==="gvRaumEd"){ gvRaumDlg(b.dataset.id); return; }
  if(a==="gvZstW"){ const g=gvAkt(), f=g&&gvRaumFinden(g,nav.raum); if(!f) return; if(f.r.zustand===b.dataset.v) delete f.r.zustand; else f.r.zustand=b.dataset.v; const y=scrollY; gvSpeichern(g); render(); scrollTo(0,y); return; }
  if(a==="gvFZst"){ GV.f.zst=GV.f.zst===b.dataset.v?"":b.dataset.v; gvFiltDlg(); render(); return; }
  if(a==="gvSetZst"){ const g=gvAkt(), e=g&&g.etagen.find(x=>x.id===nav.et); if(!e) return; const S=gvSelRaeume(g,e);
    dialog(`Bauzustand für ${S.length} ${S.length===1?"Raum":"Räume"}`,`<div class="gv-wahlliste">${gvZstL(g,e).map(([v,t,k])=>`<div class="gv-wz"><button type="button" class="gv-wzk gv-zk ra-${k}" data-act="gvZstSetzen" data-v="${v}"><b>${t}</b></button></div>`).join("")}<div class="gv-wz"><button type="button" class="gv-wzk leer" data-act="gvZstSetzen" data-v=""><b>Kein Zustand</b></button></div></div>`,`<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button>`,{breit:true}); return; }
  if(a==="gvZstSetzen"){ const g=gvAkt(), e=g&&g.etagen.find(x=>x.id===nav.et); if(!e) return; const v=b.dataset.v, S=gvSelRaeume(g,e); S.forEach(r=>{ if(v) r.zustand=v; else delete r.zustand; }); gvSpeichern(g); closeOverlays(); const y=scrollY; render(); scrollTo(0,y); toast(`${S.length} ${S.length===1?"Raum":"Räume"} → ${v?gvZst(v)[1]:"ohne Zustand"}`); return; }
  if(a==="gvLeitung"){ gvLeitungDlg(); return; }
  if(a==="gvLeitungOk"){ const g=gvAkt(), f=g&&gvRaumFinden(g,nav.raum); if(!f) return; const t=String((document.getElementById("f_gvLw")||{}).value||"").trim(); if(t) f.r.leitung=t; else delete f.r.leitung; gvSpeichern(g); closeOverlays(); render(); return; }
  if(a==="gvFotoRohbau"){ const rid=nav.raum; let el=document.getElementById("gvFotoIn"); if(!el){ el=document.createElement("input"); el.type="file"; el.id="gvFotoIn"; el.hidden=true; el.accept="image/*"; el.multiple=true; document.body.appendChild(el); }
    el.onchange=async()=>{ const fs=[...el.files]; el.value=""; let n=0; for(const f of fs){ if(await dateiNeu("raeume",rid,f,{phase:"rohbau"})) n++; } if(n){ render(); toast(n===1?"Foto unter „Leitungswege“ abgelegt":`${n} Fotos unter „Leitungswege“ abgelegt`); } }; el.click(); return; }
  if(a==="gvMatNeu"){ gvMatDlg("","raum"); return; }
  if(a==="gvMat"){ gvMatDlg(b.dataset.id,b.dataset.s); return; }
  if(a==="gvMatScope"){ GV.mat.scope=b.dataset.v; b.parentElement.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x===b))); return; }
  if(a==="gvMatOk"||a==="gvMatWeg"){ const g=gvAkt(), f=g&&gvRaumFinden(g,nav.raum); if(!f) return; const MO=gvMatOben(g,f.e), L=GV.mat.scope==="oben"?MO.L:gvMatRaum(f.r);
    if(a==="gvMatWeg"){ const i=L.findIndex(x=>x.id===GV.mat.id); if(i>=0) L.splice(i,1); }
    else { const F=formVals(), bez=String(F.gvMb||"").trim(); if(!bez){ toast("Bitte eine Bezeichnung eingeben"); return; } const mg=String(F.gvMm||"").trim().replace(",","."), m=GV.mat.id&&L.find(x=>x.id===GV.mat.id)||(()=>{ const x={id:uid()}; L.push(x); return x; })();
      Object.assign(m,{bez,artnr:String(F.gvMa||"").trim(),menge:mg===""||isNaN(+mg)?null:+mg,einheit:F.gvMe||"Stk"}); if(!m.artnr) delete m.artnr; if(m.menge==null) delete m.menge; }
    gvSpeichern(g); closeOverlays(); render(); return; }
  if(a==="gvNotiz"){ gvNotizDlg(b.dataset.id); return; }
  if(a==="gvNotizOk"){ const g=gvAkt(), f=g&&gvRaumFinden(g,nav.raum); if(!f) return; const t=String((document.getElementById("f_gvNt")||{}).value||"").trim(); const N=gvNotizen(f.r);
    if(GV.notiz){ const n=N.find(x=>x.id===GV.notiz); if(n){ if(!t){ f.r.notizen=N.filter(x=>x!==n); } else { n.text=t; n.geaendert=Date.now(); } } } else if(t) N.push({id:uid(),text:t,von:(typeof ME!=="undefined"&&ME.name)||"",at:Date.now()});
    gvSpeichern(g); closeOverlays(); render(); return; }
  if(a==="gvNotizWeg"){ const g=gvAkt(), f=g&&gvRaumFinden(g,nav.raum); if(!f) return; f.r.notizen=gvNotizen(f.r).filter(x=>x.id!==GV.notiz); gvSpeichern(g); closeOverlays(); render(); return; }
  if(a==="gvZuVt"){ const g=gvAkt(); if(!g) return; go({v:"vt",g:g.id,id:b.dataset.id}); return; }
  if(a==="gvZuKnx"){ const g=gvAkt(); if(!g||!g.knx||!g.knx.an) return; go({v:"kx",g:g.id,tab:"raeume",raum:b.dataset.id}); return; }
  if(a==="gvRaumSp"){ gvRaumSp(); return; }
  if(a==="gvRAuf"||a==="gvRAb"){ const g=gvAkt(), f=g&&gvRaumFinden(g,GV.raum); if(!f) return; const L=f.e.raeume, i=L.indexOf(f.r), j=a==="gvRAuf"?i-1:i+1; if(j<0||j>=L.length) return; [L[i],L[j]]=[L[j],L[i]]; gvSpeichern(g); render(); toast(`${f.r.name} ist jetzt an Stelle ${j+1}`); return; }
  if(a==="gvRaumWeg"){ const g=gvAkt(), id=GV.raum, n=g?gvRaumBezug(g,id):0; if(!g) return;
    if(n&&!GV.loesch){ GV.loesch=true; b.textContent=`Mit ${n} Einträgen löschen`; return; }
    g.etagen.forEach(e=>{ e.raeume=e.raeume.filter(x=>x.id!==id); }); g.stellen=(g.stellen||[]).filter(s=>s.raumId!==id); g.dosen=(g.dosen||[]).filter(d=>d.raumId!==id);
    (g.schraenke||[]).forEach(s=>{ if(s.raumId===id) s.raumId=""; }); g.verteiler.forEach(v=>{ if(v.raumId===id) v.raumId=""; });
    if(nav.raum===id) nav.raum=null;
    if(g.knx){ g.knx.geraete=(g.knx.geraete||[]).filter(d=>d.raumId!==id); (g.knx.linien||[]).forEach(l=>{ l.raeume=(l.raeume||[]).filter(r=>r!==id); }); }
    gvSpeichern(g); closeOverlays(); render(); return; }
},true);

function gvFiltDlg(){ const g=gvGeb(nav.ort), e=nav.et&&g.etagen.find(x=>x.id===nav.et), alle=gvAlleRaeume(g,e||null), arten=[...new Set(alle.map(x=>x.art||"sonst"))].sort((a,b)=>RA_LISTE.findIndex(x=>x.id===a)-RA_LISTE.findIndex(x=>x.id===b)), B=e?gvBer(e):[];
  dialog("Filtern",`<div class="lbl">Raumart</div><div class="gv-artgrp"><div>${arten.map(k=>{ const a=raArt(k); return `<button type="button" class="gv-ak ra-${a.kat}" data-act="gvFArt" data-v="${k}" aria-pressed="${GV.f.arten.includes(k)}">${icon("ra_"+k)}${esc(a.name)} · ${alle.filter(x=>(x.art||"sonst")===k).length}</button>`; }).join("")}</div></div>
    ${B.length?`<div class="lbl" style="margin-top:14px">Bereich</div><div class="gv-ber">${B.map(z=>`<button type="button" class="gv-berk" data-act="gvFBer" data-v="${esc(z.id)}" aria-pressed="${GV.f.ber===z.id}"><b>${esc(z.name)}</b></button>`).join("")}</div>`:""}
    <div class="lbl" style="margin-top:14px">Bauzustand</div><div class="gv-zst">${[...(e?gvZstL(g,e):GV_ZST),["_ohne","ohne Zustand","sonst"]].map(([v,t,k])=>`<button type="button" class="ra-${k}" data-act="gvFZst" data-v="${v}" aria-pressed="${GV.f.zst===v}">${t}</button>`).join("")}</div>
    <div class="lbl" style="margin-top:14px">Verteiler</div><div class="gv-ber"><button type="button" class="gv-berk" data-act="gvFVt" aria-pressed="${GV.f.vt}"><b>Nur Räume mit Verteiler</b><small>${alle.filter(x=>gvVtIm(g,x.r).length).length}</small></button></div>`,
    `<button class="btn-text" data-act="gvFAus">Zurücksetzen</button><span style="flex:1"></span><button class="btn-text" data-act="gvFOk">Fertig</button>`,{breit:true}); }
