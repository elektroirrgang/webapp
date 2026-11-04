/* ===== Gebäude eines Kunden/Standorts vorab anlegen (Gebäudetechnik, Kundenseite › „Gebäude“) – 04.11.2026 =====
   Derselbe Datensatz „gebaeude“ wie Prüfung, Verteiler und KNX: bauteile[{id,name,kurz}], etagen[{id,name,ebene,raeume[{id,name,bauteilId}]}].
   Gespeichert wird sofort bei jeder Änderung (ecGebSpeichern) – ohne Änderung entsteht kein Datensatz. */
Object.assign(IC,{gvGeb:"M17 11V3H7v4H3v14h8v-4h2v4h8V11h-4zM7 19H5v-2h2v2zm0-4H5v-2h2v2zm0-4H5V9h2v2zm4 4H9v-2h2v2zm0-4H9V9h2v2zm0-4H9V5h2v2zm4 8h-2v-2h2v2zm0-4h-2V9h2v2zm0-4h-2V5h2v2zm4 12h-2v-2h2v2zm0-4h-2v-2h2v2z",
  gvEdit:"M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"});
const GV={ort:"",et:"",raum:"",bt:"",gsHand:false,loesch:false};
const gvGeb=ort=>{ const g=ecGeb(ort); g.bauteile=g.bauteile||[]; return g; };
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
function gvView(){ const g=gvGeb(nav.ort), E=ecEtagen(g), B=g.bauteile, bt=id=>B.find(b=>b.id===id);
  const bauteile=`<div class="sec-row"><div class="sec-lbl">Bauteile · ${B.length}</div><span class="ab-btns"><button class="ab-ic" data-act="gvBtNeu" aria-label="Bauteil hinzufügen" title="Bauteil hinzufügen">${icon("add")}</button></span></div>
    ${B.length?`<div class="gv-bts">${B.map(b=>`<button type="button" class="gv-bt" data-act="gvBt" data-id="${esc(b.id)}"><b>${esc(b.name)}</b><small>${g.etagen.reduce((n,e)=>n+e.raeume.filter(x=>x.bauteilId===b.id).length,0)} Räume</small></button>`).join("")}</div>`
      :`<p class="meta">Nur nötig, wenn der Kunde mehrere Gebäude oder Gebäudeteile hat (z. B. Bauteil A bis H).</p>`}`;
  const etagen=E.map(e=>{ const gs=gvGs(e), gsT=gs!=null?ecGeschossName(gs):"", R=e.raeume||[];
    return `<div class="sec-row"><div class="sec-lbl">${esc(e.name)}${gsT&&gsT!==e.name?` <span class="gv-gs">${esc(gsT)}</span>`:""}</div><span class="ab-btns"><button class="ab-ic" data-act="gvEt" data-id="${esc(e.id)}" aria-label="Etage bearbeiten" title="Etage bearbeiten">${icon("gvEdit")}</button><button class="ab-ic" data-act="gvRaumNeu" data-id="${esc(e.id)}" aria-label="Räume hinzufügen" title="Räume hinzufügen">${icon("add")}</button></span></div>
      ${R.length?`<div class="gv-rs">${R.map(x=>{ const b=bt(x.bauteilId); return `<button type="button" class="gv-r" data-act="gvRaum" data-id="${esc(x.id)}"><b>${esc(x.name)}</b>${b?`<small>${esc(b.kurz||b.name)}</small>`:""}</button>`; }).join("")}</div>`:`<p class="meta">Noch keine Räume.</p>`}`; }).join("");
  return `<div class="narrow gv-seite">${bauteile}${etagen}<div class="gv-unten"><button type="button" class="btn-tonal" data-act="gvEtNeu">${icon("add")}Etage hinzufügen</button></div>
    <p class="meta" style="margin:16px 4px 0">Dieselben Bauteile, Etagen und Räume nutzen Prüfung, Verteiler und KNX. Räume stehen in der Reihenfolge, in der du sie anlegst – so laufen später auch die KNX-Adressen.</p></div>`; }
const gvAkt=()=>{ const g=nav.v==="geb"?gvGeb(nav.ort):nav.v==="kx"&&typeof kxGebAkt==="function"?kxGebAkt():null; if(g) g.bauteile=g.bauteile||[]; return g; };
const gvSpeichern=g=>{ if(g.knx) g.knx.updated=Date.now(); ecGebSpeichern(g); };

/* ---- Räume anlegen (auch aus KNX) ---- */
function gvRaumNeuDlg(g,etId){ if(!g) return; const B=g.bauteile, E=ecEtagen(g), et0=(etId&&E.find(e=>e.id===etId))||E.find(e=>e.raeume.length)||E[0]; GV.gsHand=false;
  dialog("Räume anlegen",`<div class="fg">${sf("kxBt","Bauteil",GV.bt&&B.some(b=>b.id===GV.bt)?GV.bt:"",[["","– ohne –"],...B.map(b=>[b.id,b.name])],{form:true})}${tf("kxBtNeu","oder neues Bauteil","",{form:true,ph:"z. B. B"})}</div>
    <div class="fg" style="margin-top:12px">${sf("kxEt","Etage",(et0||{}).id||"",E.map(e=>[e.id,e.name]),{form:true})}${tf("kxEtNeu","oder neue Etage","",{form:true,ph:"z. B. Level 4"})}</div>
    <div class="fg1" style="margin-top:12px">${sf("kxGs","Geschoss",et0&&gvGs(et0)!=null?String(gvGs(et0)):"",gvGsOpts(),{form:true})}</div>
    <p class="meta" style="margin:6px 4px 0">Heißt die Etage beim Kunden anders (z. B. „Level 4“), hier das echte Geschoss wählen. Gilt für die Etage überall, auch in der Prüfung.</p>
    <div class="fg1" style="margin-top:12px">${tf("kxRn","Räume","",{form:true,ph:"z. B. 403-407, 410, Flur"})}</div>
    <p class="meta" style="margin:8px 4px 0">In der Reihenfolge eintragen, in der du durchgehst – daraus folgen später die KNX-Adressen. Bereiche mit Bindestrich.</p>`,
    `<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="gvRaumOk">Anlegen</button>`,{breit:true});
  setTimeout(()=>{ const e=document.getElementById("f_kxRn"); if(e) e.focus(); },60); }
function gvRaumNamen(t){ const out=[]; String(t||"").split(/[,;\n]+/).map(s=>s.trim()).filter(Boolean).forEach(s=>{ const m=s.match(/^(\D*?)(\d+)\s*[-–]\s*\1?(\d+)$/);
    if(m&&+m[3]>=+m[2]&&+m[3]-+m[2]<200){ const w=m[2].length; for(let n=+m[2];n<=+m[3];n++) out.push(m[1]+String(n).padStart(m[2].startsWith("0")?w:0,"0")); } else out.push(s); }); return out; }
function gvRaumOk(){ const g=gvAkt(); if(!g) return; const F=formVals(), N=gvRaumNamen(F.kxRn); if(!N.length){ toast("Bitte Raumnummern eintragen"); return; }
  let bt=F.kxBt||""; if(F.kxBtNeu){ const vorh=g.bauteile.find(b=>b.name.toLowerCase()===F.kxBtNeu.toLowerCase()); bt=vorh?vorh.id:(()=>{ const b={id:"b-"+uid(),name:F.kxBtNeu}; g.bauteile.push(b); return b.id; })(); }
  let et=g.etagen.find(e=>e.id===F.kxEt); if(F.kxEtNeu){ et=g.etagen.find(e=>e.name.toLowerCase()===F.kxEtNeu.toLowerCase()); if(!et){ et={id:uid(),name:F.kxEtNeu,raeume:[]}; g.etagen.push(et); } }
  if(!et){ toast("Bitte eine Etage wählen"); return; }
  if(F.kxGs!==""&&F.kxGs!=null) et.ebene=+F.kxGs; else if(F.kxEtNeu){ const eb=ecEbeneRaten(F.kxEtNeu); if(eb!=null) et.ebene=eb; }
  /* gleicher Name auf derselben Etage: vorhandenen Raum nehmen (z. B. aus der Prüfung) und ihm das Bauteil geben, statt ihn doppelt anzulegen */
  let neu=0, zug=0; N.forEach(n=>{ const da=et.raeume.find(r=>r.name===n&&(!r.bauteilId||!bt||r.bauteilId===bt));
    if(da){ if(bt&&!da.bauteilId){ da.bauteilId=bt; zug++; } return; } et.raeume.push({id:uid(),name:n,...(bt?{bauteilId:bt}:{})}); neu++; });
  GV.bt=bt; gvSpeichern(g); closeOverlays(); render();
  toast(neu||zug?[neu&&`${neu} ${neu>1?"Räume":"Raum"} angelegt`,zug&&`${zug} vorhandene${zug>1?"":"r"} Raum Bauteil zugeordnet`].filter(Boolean).join(" · "):"Diese Räume gibt es schon"); }
/* Geschoss-Feld mitführen */
function gvGsSetzen(v){ const s=document.getElementById("f_kxGs"); if(!s) return; s.value=v==null?"":String(v); if(s.value!==(v==null?"":String(v))) s.value=""; }
document.addEventListener("change",ev=>{ const el=ev.target; if(el.id==="f_kxGs"||el.id==="f_gvGs"){ GV.gsHand=el.value!==""; return; }
  if(el.id==="f_kxEt"&&!(document.getElementById("f_kxEtNeu")||{}).value){ const g=gvAkt(), e=g&&g.etagen.find(x=>x.id===el.value); GV.gsHand=false; gvGsSetzen(e?gvGs(e):null); } });
document.addEventListener("input",ev=>{ const el=ev.target;
  if(el.id==="f_kxEtNeu"&&!GV.gsHand){ const v=el.value.trim(); if(v) gvGsSetzen(ecEbeneRaten(v)); else { const g=gvAkt(), e=g&&g.etagen.find(x=>x.id===(document.getElementById("f_kxEt")||{}).value); gvGsSetzen(e?gvGs(e):null); } }
  if(el.id==="f_gvEn"&&!GV.gsHand){ const s=document.getElementById("f_gvGs"), v=el.value.trim().replace(/\s*[-–]\s*\d+$/,""); if(s){ const eb=v?ecEbeneRaten(v):null; s.value=eb==null?"":String(eb); if(eb!=null&&s.value!==String(eb)) s.value=""; } } });

/* ---- Etage ---- */
function gvEtDlg(id){ const g=gvAkt(); if(!g) return; const e=id&&g.etagen.find(x=>x.id===id); GV.et=e?e.id:""; GV.gsHand=!!(e&&gvGs(e)!=null); GV.loesch=false;
  const vorschl=e?[]:["KG","EG","1. OG","2. OG","3. OG","DG"].filter(n=>!g.etagen.some(x=>x.name===n));
  dialog(e?"Etage bearbeiten":"Etage hinzufügen",`<div class="fg1">${tf("gvEn","Bezeichnung",e?e.name:"",{form:true,ph:e?"z. B. Level 4":"z. B. 1. OG, Level 4 oder Level 1-5"})}</div>
    ${vorschl.length?`<div class="chips ec-wahl">${vorschl.map(n=>`<button type="button" class="chip" data-act="gvEtVorschl" data-v="${esc(n)}">${esc(n)}</button>`).join("")}</div>`:""}
    <div class="fg1" style="margin-top:14px">${sf("gvGs",e?"Geschoss":"Geschoss (bei mehreren: das erste)",e&&gvGs(e)!=null?String(gvGs(e)):"",gvGsOpts(),{form:true})}</div>
    <p class="meta" style="margin-top:8px">Heißt die Etage beim Kunden anders, z. B. „Level 4“, hier das echte Geschoss wählen – sortiert wird danach, angezeigt der Name.${e?"":" Mehrere auf einmal mit Bindestrich: „Level 1-5“."}</p>`,
    `${e?`<button class="btn-text danger" data-act="gvEtWeg">Löschen</button>`:""}<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="gvEtOk">${e?"Speichern":"Hinzufügen"}</button>`,{breit:true});
  if(!e) setTimeout(()=>{ const x=document.getElementById("f_gvEn"); if(x) x.focus(); },60); }
function gvEtOk(){ const g=gvAkt(); if(!g) return; const F=formVals(), n=String(F.gvEn||"").trim(), gs=F.gvGs!==""&&F.gvGs!=null?+F.gvGs:null; if(!n){ toast("Bitte eine Bezeichnung eingeben"); return; }
  if(GV.et){ const e=g.etagen.find(x=>x.id===GV.et); if(!e) return; e.name=n; if(gs!=null) e.ebene=gs; else { const eb=ecEbeneRaten(n); if(eb!=null) e.ebene=eb; else delete e.ebene; } gvSpeichern(g); closeOverlays(); render(); return; }
  const m=n.match(/^(.*?)(-?\d+)\s*[-–]\s*(-?\d+)$/); let neu=0;
  const add=(name,eb)=>{ if(g.etagen.some(x=>x.name.toLowerCase()===name.toLowerCase())) return; const e={id:uid(),name,raeume:[]}; if(eb!=null) e.ebene=eb; g.etagen.push(e); neu++; };
  if(m&&+m[3]>=+m[2]&&+m[3]-+m[2]<=30){ const vor=m[1]; for(let k=+m[2];k<=+m[3];k++){ const name=`${vor}${k}`.trim(); add(name,gs!=null?gs+(k-+m[2]):ecEbeneRaten(name)); } }
  else add(n,gs!=null?gs:ecEbeneRaten(n));
  /* die leere Standard-Etage „EG“ (ohne Räume, ohne Geschoss von Hand) fällt weg, sobald eigene Etagen da sind */
  const std=g.etagen.find(x=>x.id==="eg"&&!x.raeume.length&&x.ebene==null); if(neu&&std&&g.etagen.length>1&&!g.etagen.some(x=>x!==std&&ecEbene(x)===0&&/^eg$/i.test(x.name))&&!/^(eg|erdgeschoss)/i.test(n)) g.etagen=g.etagen.filter(x=>x!==std);
  gvSpeichern(g); closeOverlays(); render(); toast(neu?`${neu} Etage${neu>1?"n":""} hinzugefügt`:"Diese Etage gibt es schon"); }
/* ---- Bauteil ---- */
function gvBtDlg(id){ const g=gvAkt(); if(!g) return; const b=id&&g.bauteile.find(x=>x.id===id); GV.bt=b?b.id:""; GV.loesch=false;
  dialog(b?"Bauteil bearbeiten":"Bauteil hinzufügen",`<div class="fg">${tf("gvBn","Bezeichnung",b?b.name:"",{form:true,ph:"z. B. B oder Halle 3"})}${tf("gvBk","Kürzel (optional)",b&&b.kurz||"",{form:true,ph:"z. B. B"})}</div>
    <p class="meta" style="margin-top:8px">Mehrere auf einmal mit Komma: „A, B, C“.</p>`,
    `${b?`<button class="btn-text danger" data-act="gvBtWeg">Löschen</button>`:""}<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="gvBtOk">${b?"Speichern":"Hinzufügen"}</button>`,{breit:true});
  if(!b) setTimeout(()=>{ const x=document.getElementById("f_gvBn"); if(x) x.focus(); },60); }
function gvBtOk(){ const g=gvAkt(); if(!g) return; const F=formVals(), n=String(F.gvBn||"").trim(); if(!n){ toast("Bitte eine Bezeichnung eingeben"); return; }
  if(GV.bt){ const b=g.bauteile.find(x=>x.id===GV.bt); if(!b) return; b.name=n; if(F.gvBk) b.kurz=F.gvBk; else delete b.kurz; }
  else n.split(/\s*,\s*/).filter(Boolean).forEach(x=>{ if(!g.bauteile.some(b=>b.name.toLowerCase()===x.toLowerCase())) g.bauteile.push({id:"b-"+uid(),name:x,...(F.gvBk&&!/,/.test(n)?{kurz:F.gvBk}:{})}); });
  gvSpeichern(g); closeOverlays(); render(); }
/* ---- Raum ---- */
const gvRaumFinden=(g,id)=>{ for(const e of g.etagen){ const r=e.raeume.find(x=>x.id===id); if(r) return {e,r}; } return null; };
const gvRaumBezug=(g,id)=>(g.stellen||[]).filter(s=>s.raumId===id).length+(g.dosen||[]).filter(d=>d.raumId===id).length+((g.knx&&g.knx.geraete)||[]).filter(d=>d.raumId===id).length;
function gvRaumDlg(id){ const g=gvAkt(), f=g&&gvRaumFinden(g,id); if(!f) return; GV.raum=id; GV.loesch=false; const E=ecEtagen(g);
  dialog("Raum bearbeiten",`<div class="fg1">${tf("gvRn","Bezeichnung",f.r.name,{form:true})}</div>
    <div class="fg" style="margin-top:12px">${sf("gvRb","Bauteil",f.r.bauteilId||"",[["","– ohne –"],...g.bauteile.map(b=>[b.id,b.name])],{form:true})}${sf("gvRe","Etage",f.e.id,E.map(e=>[e.id,e.name]),{form:true})}</div>
    <div class="gv-schieb"><span class="meta">Reihenfolge auf der Etage</span><button type="button" class="kx-tk" data-act="gvRAuf" aria-label="nach vorne">↑</button><button type="button" class="kx-tk" data-act="gvRAb" aria-label="nach hinten">↓</button></div>`,
    `<button class="btn-text danger" data-act="gvRaumWeg">Löschen</button><span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="gvRaumSp">Speichern</button>`,{breit:true}); }
function gvRaumSp(){ const g=gvAkt(), f=g&&gvRaumFinden(g,GV.raum); if(!f) return; const F=formVals(), n=String(F.gvRn||"").trim(); if(!n){ toast("Bitte eine Bezeichnung eingeben"); return; }
  f.r.name=n; if(F.gvRb) f.r.bauteilId=F.gvRb; else delete f.r.bauteilId;
  if(F.gvRe&&F.gvRe!==f.e.id){ const z=g.etagen.find(x=>x.id===F.gvRe); if(z){ f.e.raeume=f.e.raeume.filter(x=>x!==f.r); z.raeume.push(f.r); } }
  gvSpeichern(g); closeOverlays(); render(); }

/* ===== Klicks ===== */
document.addEventListener("click",ev=>{ const b=ev.target.closest&&ev.target.closest('[data-act^="gv"]'); if(!b) return; const a=b.dataset.act; ev.stopPropagation();
  if(a==="gvAuf"){ closeOverlays(); go({v:"geb",ort:b.dataset.v,...(nav.v==="kunde"||nav.v==="standort"?{von:{v:nav.v,id:nav.id}}:{})}); return; }
  if(a==="gvRaumNeu"){ gvRaumNeuDlg(gvAkt(),b.dataset.id); return; }
  if(a==="gvRaumOk"){ gvRaumOk(); return; }
  if(a==="gvEtNeu"){ gvEtDlg(); return; }
  if(a==="gvEt"){ gvEtDlg(b.dataset.id); return; }
  if(a==="gvEtVorschl"){ const x=document.getElementById("f_gvEn"); if(x){ x.value=b.dataset.v; x.dispatchEvent(new Event("input",{bubbles:true})); if(x.parentElement) x.parentElement.classList.add("fl"); } return; }
  if(a==="gvEtOk"){ gvEtOk(); return; }
  if(a==="gvEtWeg"){ const g=gvAkt(), e=g&&g.etagen.find(x=>x.id===GV.et); if(!e) return; if(g.etagen.length<2){ toast("Mindestens eine Etage bleibt"); return; } if(e.raeume.length){ toast("Erst die Räume dieser Etage löschen oder verschieben"); return; }
    g.etagen=g.etagen.filter(x=>x!==e); gvSpeichern(g); closeOverlays(); render(); return; }
  if(a==="gvBtNeu"){ gvBtDlg(); return; }
  if(a==="gvBt"){ gvBtDlg(b.dataset.id); return; }
  if(a==="gvBtOk"){ gvBtOk(); return; }
  if(a==="gvBtWeg"){ const g=gvAkt(); if(!g) return; const id=GV.bt, n=g.etagen.reduce((s,e)=>s+e.raeume.filter(r=>r.bauteilId===id).length,0)+g.verteiler.filter(v=>v.bauteilId===id).length;
    if(n&&!GV.loesch){ GV.loesch=true; b.textContent=`Trotzdem löschen (${n} Räume/Verteiler verlieren das Bauteil)`; return; }
    g.bauteile=g.bauteile.filter(x=>x.id!==id); g.etagen.forEach(e=>e.raeume.forEach(r=>{ if(r.bauteilId===id) delete r.bauteilId; })); g.verteiler.forEach(v=>{ if(v.bauteilId===id) v.bauteilId=""; }); GV.bt="";
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
