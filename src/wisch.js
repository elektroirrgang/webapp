/* ===== Wischen in Listen (Max 10.11.2026) =====
   Zeilen mit data-wisch="<typ>" und data-id wischen wie bei Apple Mail:
   nach links = Löschen (rot), nach rechts = Archivieren bzw. Zurückholen (blau, nur wenn data-wisch-r gesetzt).
   Ganz durchwischen (über 35 % der Breite) löst aus, sonst federt die Zeile zurück. Löschen ohne Rückfrage, dafür „Rückgängig“.
   Aktionen stehen in WISCH_AKT[typ] = {links(id), rechts(id)}. Maus: Rechtsklick-Menü bleibt wie bisher. */
const WISCH_AKT={};
const WISCH={z:null,x0:0,y0:0,dx:0,an:false,bg:null,w:1,sperre:0,id:0,schwelle:false};
function wischBg(z,rechts){ const p=z.parentElement; if(getComputedStyle(p).position==="static") p.style.position="relative";
  const bg=document.createElement("div"); bg.className="wisch-bg"; bg.style.top=z.offsetTop+"px"; bg.style.height=z.offsetHeight+"px"; bg.style.left=z.offsetLeft+"px"; bg.style.width=z.offsetWidth+"px";
  bg.innerHTML=`<span class="wisch-r">${icon(z.dataset.wischRIc||"archive")}<b>${esc(rechts||"")}</b></span><span class="wisch-l"><b>Löschen</b>${icon("del")}</span>`;
  p.insertBefore(bg,z); return bg; }
function wischEnde(los){ const z=WISCH.z, bg=WISCH.bg; WISCH.z=null; if(!z) return;
  const dx=WISCH.dx, typ=z.dataset.wisch, id=z.dataset.id, A=WISCH_AKT[typ]||{};
  if(WISCH.an) WISCH.sperre=Date.now()+400;
  const raus=los&&Math.abs(dx)>WISCH.w*.35&&(dx<0?!!A.links:!!(A.rechts&&z.dataset.wischR));
  z.style.transition="transform .22s ease"; z.style.transform=raus?`translateX(${dx<0?-WISCH.w:WISCH.w}px)`:"";
  setTimeout(()=>{ if(bg) bg.remove(); z.style.transition=""; if(!raus) z.style.transform=""; if(raus){ if(dx<0) A.links(id,z); else A.rechts(id,z); } },raus?200:230); }
document.addEventListener("pointerdown",e=>{ if(e.pointerType==="mouse"||e.button) return; const z=e.target.closest&&e.target.closest("[data-wisch]"); if(!z||WISCH.z) return;
  Object.assign(WISCH,{z,x0:e.clientX,y0:e.clientY,dx:0,an:false,bg:null,w:z.offsetWidth||1,schwelle:false,id:e.pointerId}); },{passive:true});
document.addEventListener("pointermove",e=>{ const z=WISCH.z; if(!z||e.pointerId!==WISCH.id) return; const dx=e.clientX-WISCH.x0, dy=e.clientY-WISCH.y0;
  if(!WISCH.an){ if(Math.abs(dy)>10&&Math.abs(dy)>Math.abs(dx)){ WISCH.z=null; return; } if(Math.abs(dx)<12||Math.abs(dx)<Math.abs(dy)*1.4) return;
    WISCH.an=true; WISCH.bg=wischBg(z,z.dataset.wischR); try{ z.setPointerCapture(e.pointerId); }catch(x){} }
  let d=dx; if(d>0&&!z.dataset.wischR) d=Math.min(d,40)*.4;   /* ohne Aktion rechts: nur leicht nachgeben */
  WISCH.dx=d; z.style.transform=`translateX(${d}px)`;
  if(WISCH.bg){ WISCH.bg.classList.toggle("links",d<0); WISCH.bg.classList.toggle("rechts",d>0); const s=Math.abs(d)>WISCH.w*.35; WISCH.bg.classList.toggle("voll",s);
    if(s!==WISCH.schwelle){ WISCH.schwelle=s; if(s&&typeof navHaptik==="function") navHaptik(); } } },{passive:true});
document.addEventListener("pointerup",e=>{ if(WISCH.z&&e.pointerId===WISCH.id) wischEnde(true); },{passive:true});
document.addEventListener("pointercancel",e=>{ if(WISCH.z&&e.pointerId===WISCH.id) wischEnde(false); },{passive:true});
/* nach dem Wischen kein Antippen auslösen (sonst öffnet sich die Zeile) */
document.addEventListener("click",e=>{ if(Date.now()<WISCH.sperre){ e.stopImmediatePropagation(); e.preventDefault(); } },true);
document.addEventListener("contextmenu",e=>{ if(WISCH.an&&WISCH.z) e.preventDefault(); },true);

/* ---- Prüfungen: links löschen, rechts archivieren / zurückholen ---- */
WISCH_AKT.ec={
  links(id){ const p=DB.echecks.get(id); if(!p) return; if(SYNC_ON&&!canEdit(p)&&!p.demo){ toast("Diese Prüfung darf nur der Ersteller oder ein Admin löschen"); render(); return; }
    p.deleted=true; saveRec("echecks",p); render(); toast("Prüfung gelöscht","Rückgängig",()=>{ p.deleted=false; saveRec("echecks",p); render(); }); },
  rechts(id){ const p=DB.echecks.get(id); if(!p) return; const war=!!p.archiv; if(war) delete p.archiv; else p.archiv=true; saveRec("echecks",p); render();
    toast(war?"Zurückgeholt":"Archiviert – steht beim Kunden unter „Archiviert“","Rückgängig",()=>{ if(war) p.archiv=true; else delete p.archiv; saveRec("echecks",p); render(); }); } };

/* ---- Netzwerkschränke beim Kunden (wie die Verteiler) ---- */
function schrBeiKunde(kind,r){ const S=[]; vtOrte(kind,r).forEach(o=>{ const g=vtGeb(ecGebId(o)); if(g) (g.schraenke||[]).forEach(s=>S.push({g,s,o})); });
  const P=live("echecks").filter(p=>p.art==="netz"&&!p.archiv);
  const zeile=({g,s,o})=>{ const raum=typeof ecRaumName==="function"?ecRaumName(g,s.raumId):"", D=(g.dosen||[]).filter(d=>d.sId===s.id).length, ort=kind==="kunden"&&!String(o).startsWith("k:")?ecOrt(o):null;
    return `<div class="li" role="button" tabindex="0" data-act="schrAuf" data-g="${esc(g.id)}" data-id="${esc(s.id)}" data-wisch="schr"><span class="av">${icon("ecNetz")}</span>
      <span class="lt"><span class="h">${esc(s.name||"Netzwerkschrank")}</span><span class="s">${esc([ort&&ort.standort&&ort.standort.name,raum,typeof ecSchrText==="function"?ecSchrText(s):"",`${D} Dose${D===1?"":"n"}`].filter(Boolean).join(" · "))}</span></span>${icon("chev")}</div>`; };
  return `<div class="sec-row"><div class="sec-lbl">Netzwerkschränke</div><span class="ab-btns"><button class="ab-ic" data-act="schrNeuHier" data-kind="${kind}" data-id="${esc(r.id)}" aria-label="Netzwerkschrank anlegen" title="Netzwerkschrank anlegen">${icon("add")}</button></span></div>`
    +(S.length?listOf(S.map(zeile)):`<p class="meta">Noch kein Netzwerkschrank. Schrank, Patchfelder und Datendosen entstehen in der Netzwerkprüfung.</p>`); }
/* Schrank löschen: Dosen behalten, verlieren nur die Zuordnung */
WISCH_AKT.schr={ links(id,z){ const g=vtGeb(z.dataset.g); if(!g) return; const s=(g.schraenke||[]).find(x=>x.id===id); if(!s) return;
  const D=(g.dosen||[]).filter(d=>d.sId===id).map(d=>d.id), i=g.schraenke.indexOf(s);
  g.dosen.forEach(d=>{ if(d.sId===id) d.sId=""; }); g.schraenke=g.schraenke.filter(x=>x.id!==id); ecGebSpeichern(g); render();
  toast(`„${s.name||"Netzwerkschrank"}“ gelöscht${D.length?` · ${D.length} Dose${D.length>1?"n":""} ohne Schrank`:""}`,"Rückgängig",()=>{ const g2=vtGeb(g.id); if(!g2) return; g2.schraenke.splice(Math.min(i,g2.schraenke.length),0,s);
    g2.dosen.forEach(d=>{ if(D.includes(d.id)) d.sId=id; }); ecGebSpeichern(g2); render(); }); } };
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act="schrAuf"],[data-act="schrNeuHier"]'); if(!b) return; e.stopImmediatePropagation(); e.preventDefault();
  if(b.dataset.act==="schrAuf"){ const g=vtGeb(b.dataset.g), s=g&&(g.schraenke||[]).find(x=>x.id===b.dataset.id); if(!s) return;
    const P=live("echecks").filter(p=>p.ortId===g.ortId&&p.art==="netz").sort((a,b)=>(!!a.archiv-!!b.archiv)||String(b.datum||"").localeCompare(String(a.datum||"")));
    if(P.length){ if(typeof ecRkTab!=="undefined") ecRkTab="ansicht"; go({v:"ec",id:P[0].id,tab:"infra",schr:s.id}); }
    else toast(`Für „${s.name||"Netzwerkschrank"}“ gibt es keine Netzwerkprüfung – den Schrank plant man in einer Netzwerkprüfung`); return; }
  /* Neu: in der neuesten Netzwerkprüfung des Kunden anlegen – gibt es keine, eine neue Netzwerkprüfung beginnen */
  const kind=b.dataset.kind, r=DB[kind].get(b.dataset.id); if(!r) return; const orte=vtOrte(kind,r);
  const P=live("echecks").filter(p=>p.art==="netz"&&!p.archiv&&p.status!=="fertig"&&orte.includes(p.ortId)).sort((a,b)=>String(b.datum||"").localeCompare(String(a.datum||"")));
  if(P.length){ go({v:"ec",id:P[0].id,tab:"infra"}); setTimeout(()=>{ const x=document.createElement("button"); x.hidden=true; x.dataset.act="ecSchrNeu"; document.body.appendChild(x); x.click(); x.remove(); },60); return; }
  ecNeuDialog("netz",kind==="kunden"?r.id:r.kundeId,kind==="kunden"?"k:"+r.id:r.id); toast("Den Schrank legst du in der Netzwerkprüfung an"); },true);
