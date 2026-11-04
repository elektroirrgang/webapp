/* ===== Gebäude eines Kunden/Standorts vorab anlegen (Gebäudetechnik, Kundenseite › „Gebäude“) – 04.11.2026 =====
   Derselbe Datensatz „gebaeude“ wie Prüfung, Verteiler und KNX: bauteile[{id,name,kurz}], etagen[{id,name,ebene,raeume[{id,name,bauteilId}]}].
   Gespeichert wird sofort bei jeder Änderung (ecGebSpeichern) – ohne Änderung entsteht kein Datensatz. */
Object.assign(IC,{gvGeb:"M17 11V3H7v4H3v14h8v-4h2v4h8V11h-4zM7 19H5v-2h2v2zm0-4H5v-2h2v2zm0-4H5V9h2v2zm4 4H9v-2h2v2zm0-4H9V9h2v2zm0-4H9V5h2v2zm4 8h-2v-2h2v2zm0-4h-2V9h2v2zm0-4h-2V5h2v2zm4 12h-2v-2h2v2zm0-4h-2v-2h2v2z",
  gvEdit:"M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"});
const GV={ort:"",et:"",raum:"",bt:"",gsHand:false,loesch:false,sel:null,selOrt:""};
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
    return `<div class="li" role="button" tabindex="0" data-act="gvEtAuf" data-id="${esc(e.id)}"><span class="av gv-av">${esc(gsT&&gsT!==e.name?gsT.replace(/\.\s*OG$/,". OG"):"")||icon("gvGeb")}</span><span class="lt"><span class="h">${esc(e.name)}</span><span class="s">${R.length?`${R.length} ${R.length===1?"Raum":"Räume"} · ${esc(vorschau)}`:"Noch keine Räume"}</span></span>${icon("chev")}</div>`; };
  const etagen=`<div class="sec-row"><div class="sec-lbl">${selB?`Etagen in ${esc(selB.name)}`:"Etagen"} · ${E.length}</div><span class="ab-btns"><button class="ab-ic" data-act="gvEtNeu" aria-label="Etage hinzufügen" title="Etage hinzufügen">${icon("add")}</button></span></div>`
    +(E.length?listOf(E.map(zeile)):`<p class="meta">${selB?`${esc(selB.name)} hat noch keine Etagen – mit „+“ anlegen, auch mehrere auf einmal („Level 1-5“).`:"Noch keine Etagen."}</p>`);
  return `<div class="narrow gv-seite">${kopf}${zuordnen}${etagen}
    <p class="meta" style="margin:20px 4px 0">Dieselben Bauteile, Etagen und Räume nutzen Prüfung, Verteiler und KNX.</p></div>`; }
/* eigene Seite einer Etage mit ihren Räumen */
function gvEtSeite(g,e){ const R=e.raeume||[];
  return `<div class="narrow gv-seite"><div class="sec-row"><div class="sec-lbl">Räume · ${R.length}</div><span class="ab-btns"><button class="ab-ic" data-act="gvEt" data-id="${esc(e.id)}" aria-label="Etage bearbeiten" title="Etage bearbeiten">${icon("gvEdit")}</button><button class="ab-ic" data-act="gvRaumNeu" data-id="${esc(e.id)}" aria-label="Räume hinzufügen" title="Räume hinzufügen">${icon("add")}</button></span></div>
    ${R.length?`<div class="gv-rs">${R.map(x=>`<button type="button" class="gv-r" data-act="gvRaum" data-id="${esc(x.id)}"><b>${esc(x.name)}</b></button>`).join("")}</div>`:`<p class="meta">Noch keine Räume – mit „+“ oder unten rechts anlegen, z. B. „403-407“.</p>`}
    <p class="meta" style="margin:20px 4px 0">Reihenfolge = Reihenfolge beim Durchgehen (und der KNX-Adressen). Raum antippen zum Umbenennen, Verschieben oder Löschen.</p></div>`; }
function gvTitel(){ const g=gvGeb(nav.ort), e=nav.et&&g.etagen.find(x=>x.id===nav.et); if(!e) return {title:ecOrt(nav.ort).titel,sub:"Gebäude"};
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
let GV_VOR=false;
function gvBtDlg(id){ const g=gvAkt(); if(!g) return; const b=id&&g.bauteile.find(x=>x.id===id); GV.bt=b?b.id:""; GV.loesch=false; GV_VOR=!!(b&&b.raumVor);
  dialog(b?"Bauteil bearbeiten":"Bauteil hinzufügen",`<div class="fg">${tf("gvBn","Bezeichnung",b?b.name:"",{form:true,ph:"z. B. Bauteil B oder Halle 3"})}${tf("gvBk","Kürzel (optional)",b&&b.kurz||"",{form:true,ph:"z. B. B"})}</div>
    ${b?"":`<p class="meta" style="margin-top:8px">Mehrere auf einmal mit Komma: „Bauteil A, Bauteil B“.</p>`}
    <div class="lbl" style="margin-top:14px">Raumnummern</div><div class="knx-seg gv-vor">${[["0","nur die Nummer"],["1",`mit Bauteil davor`]].map(([v,t])=>`<button type="button" data-act="gvVorWahl" data-v="${v}" aria-pressed="${GV_VOR===(v==="1")}">${t}</button>`).join("")}</div>
    <p class="meta" id="gvVorBsp" style="margin-top:8px">${gvVorBsp()}</p>`,
    `${b?`<button class="btn-text danger" data-act="gvBtWeg">Löschen</button>`:""}<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="gvBtOk">${b?"Speichern":"Hinzufügen"}</button>`,{breit:true});
  if(!b) setTimeout(()=>{ const x=document.getElementById("f_gvBn"); if(x) x.focus(); },60); }
function gvVorBsp(){ const n=((document.getElementById("f_gvBn")||{}).value||"").split(",")[0].trim(), k=((document.getElementById("f_gvBk")||{}).value||"").trim();
  const v=gvVorText({name:n,kurz:k})||"B"; return GV_VOR?`Du tippst „403-407“, angelegt wird ${esc(v)} 403 bis ${esc(v)} 407. Vorhandene Räume dieses Bauteils bekommen den Zusatz beim Speichern auch. Davor steht das Kürzel, sonst die Bezeichnung ohne „Bauteil“.`:"Räume heißen so, wie du sie eintippst (z. B. 403)."; }
document.addEventListener("input",ev=>{ if((ev.target.id==="f_gvBn"||ev.target.id==="f_gvBk")&&document.getElementById("gvVorBsp")) document.getElementById("gvVorBsp").innerHTML=gvVorBsp(); });
function gvBtOk(){ const g=gvAkt(); if(!g) return; const F=formVals(), n=String(F.gvBn||"").trim(); if(!n){ toast("Bitte eine Bezeichnung eingeben"); return; }
  let geaendert=0;
  if(GV.bt){ const b=g.bauteile.find(x=>x.id===GV.bt); if(!b) return; const alt=gvVor(b); b.name=n; if(F.gvBk) b.kurz=F.gvBk; else delete b.kurz; if(GV_VOR) b.raumVor=true; else delete b.raumVor; const neu=gvVor(b);
    if(alt!==neu) g.etagen.forEach(e=>{ if((e.bauteilId||"")!==b.id) return; e.raeume.forEach(r=>{ const m=neu?(gvOhneVor(alt,r.name)):gvOhneVor(alt,r.name), z=neu?gvMitVor(b,m):m; if(z!==r.name){ r.name=z; geaendert++; } }); }); }
  else n.split(/\s*,\s*/).filter(Boolean).forEach((x,i)=>{ if(!g.bauteile.some(b=>b.name.toLowerCase()===x.toLowerCase())){ const b={id:"b-"+uid(),name:x,...(F.gvBk&&!/,/.test(n)?{kurz:F.gvBk}:{}),...(GV_VOR?{raumVor:true}:{})}; g.bauteile.push(b); } });
  gvSpeichern(g); closeOverlays(); render(); if(geaendert) toast(`${geaendert} Raumnummer${geaendert===1?"":"n"} angepasst`); }
/* ---- Raum ---- */
const gvRaumFinden=(g,id)=>{ for(const e of g.etagen){ const r=e.raeume.find(x=>x.id===id); if(r) return {e,r}; } return null; };
const gvRaumBezug=(g,id)=>(g.stellen||[]).filter(s=>s.raumId===id).length+(g.dosen||[]).filter(d=>d.raumId===id).length+((g.knx&&g.knx.geraete)||[]).filter(d=>d.raumId===id).length;
function gvRaumDlg(id){ const g=gvAkt(), f=g&&gvRaumFinden(g,id); if(!f) return; GV.raum=id; GV.loesch=false; const E=ecEtagen(g);
  dialog("Raum bearbeiten",`<div class="fg1">${tf("gvRn","Bezeichnung",f.r.name,{form:true})}</div>
    <div class="fg1" style="margin-top:12px">${sf("gvRe",g.bauteile.length?"Bauteil und Etage":"Etage",f.e.id,E.map(e=>[e.id,gvEtName(g,e)]),{form:true})}</div>
    <div class="gv-schieb"><span class="meta">Reihenfolge auf der Etage</span><button type="button" class="kx-tk" data-act="gvRAuf" aria-label="nach vorne">↑</button><button type="button" class="kx-tk" data-act="gvRAb" aria-label="nach hinten">↓</button></div>`,
    `<button class="btn-text danger" data-act="gvRaumWeg">Löschen</button><span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="gvRaumSp">Speichern</button>`,{breit:true}); }
function gvRaumSp(){ const g=gvAkt(), f=g&&gvRaumFinden(g,GV.raum); if(!f) return; const F=formVals(), n=String(F.gvRn||"").trim(); if(!n){ toast("Bitte eine Bezeichnung eingeben"); return; }
  f.r.name=n;
  if(F.gvRe&&F.gvRe!==f.e.id){ const z=g.etagen.find(x=>x.id===F.gvRe); if(z){ f.e.raeume=f.e.raeume.filter(x=>x!==f.r); z.raeume.push(f.r); if(z.bauteilId) f.r.bauteilId=z.bauteilId; else delete f.r.bauteilId; } }
  gvSpeichern(g); closeOverlays(); render(); }

/* ===== Klicks ===== */
document.addEventListener("click",ev=>{ const b=ev.target.closest&&ev.target.closest('[data-act^="gv"]'); if(!b) return; const a=b.dataset.act; ev.stopPropagation();
  if(a==="gvAuf"){ closeOverlays(); go({v:"geb",ort:b.dataset.v,...(nav.v==="kunde"||nav.v==="standort"?{von:{v:nav.v,id:nav.id}}:{})}); return; }
  if(a==="gvRaumNeu"){ gvRaumNeuDlg(gvAkt(),b.dataset.id||(nav.v==="geb"&&nav.et)||""); return; }
  if(a==="gvEtAuf"){ nav.et=b.dataset.id; render(); scrollTo(0,0); return; }
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
  if(a==="gvRaum"){ gvRaumDlg(b.dataset.id); return; }
  if(a==="gvRaumSp"){ gvRaumSp(); return; }
  if(a==="gvRAuf"||a==="gvRAb"){ const g=gvAkt(), f=g&&gvRaumFinden(g,GV.raum); if(!f) return; const L=f.e.raeume, i=L.indexOf(f.r), j=a==="gvRAuf"?i-1:i+1; if(j<0||j>=L.length) return; [L[i],L[j]]=[L[j],L[i]]; gvSpeichern(g); render(); toast(`${f.r.name} ist jetzt an Stelle ${j+1}`); return; }
  if(a==="gvRaumWeg"){ const g=gvAkt(), id=GV.raum, n=g?gvRaumBezug(g,id):0; if(!g) return;
    if(n&&!GV.loesch){ GV.loesch=true; b.textContent=`Mit ${n} Einträgen löschen`; return; }
    g.etagen.forEach(e=>{ e.raeume=e.raeume.filter(x=>x.id!==id); }); g.stellen=(g.stellen||[]).filter(s=>s.raumId!==id); g.dosen=(g.dosen||[]).filter(d=>d.raumId!==id);
    (g.schraenke||[]).forEach(s=>{ if(s.raumId===id) s.raumId=""; }); g.verteiler.forEach(v=>{ if(v.raumId===id) v.raumId=""; });
    if(g.knx){ g.knx.geraete=(g.knx.geraete||[]).filter(d=>d.raumId!==id); (g.knx.linien||[]).forEach(l=>{ l.raeume=(l.raeume||[]).filter(r=>r!==id); }); }
    gvSpeichern(g); closeOverlays(); render(); return; }
},true);
