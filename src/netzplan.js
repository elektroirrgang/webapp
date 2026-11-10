/* ===== Netzwerkplan als Liste (Max 10.11.2026) =====
   Wie Max' OneNote-Tabelle: je Port eine Zeile – Nummer (Dose.Port, z. B. 2.1), Ort, Kabel, Farbe.
   2.1 und 2.2 = eine Dose mit zwei Anschlüssen, in die ein Duplex-Kabel geht. Ort ist freier Text je Port (Fernseher, Accesspoint …),
   ein Raum ist nicht nötig: ohne Wahl landet die Dose im Raum „Ohne Raum“ (wird bei Bedarf angelegt), zuordnen geht später.
   Datenfelder an der Dose: nr {1:"2.1",2:"2.2"} (Beschriftung nach Dosennummer), po {1:"Fernseher",2:"Accesspoint"} (Ort je Port), vk {art,farbe}. */
const NP={id:null,ports:"2",art:"duplex",farbe:"orange",raumId:""};
const npNr=d=>{ const x=(d.nr&&d.nr[1])||""; const m=String(x).match(/^(\d+)/); return m?+m[1]:null; };
const npDosen=g=>g.dosen.slice().sort((a,b)=>{ const x=npNr(a), y=npNr(b); return (x==null)-(y==null)||(x||0)-(y||0)||(a.ord||0)-(b.ord||0); });
const npOhneRaum=g=>ecRaeume(g).find(r=>r.name==="Ohne Raum");
function npKarte(pr,g){ const zu=pr.status==="fertig", D=npDosen(g);
  const port=(d,i,k)=>{ const nr=(d.nr&&d.nr[i])||(d.pp&&d.pp[i])||"–", ort=(d.po&&d.po[i])||d.lage||"", rr=ecRaeume(g).find(x=>x.id===d.raumId), raum=rr&&rr.name!=="Ohne Raum"?ecRaumName(g,d.raumId):"", f=d.vk&&ecVkFarbe(d.vk.farbe);
    return `<div class="np-p"><span class="np-nr"${f?` style="--np:${f[2]}"`:""}>${esc(nr)}</span><span class="np-o">${esc(ort||"–")}${raum?`<small>${esc(raum)}</small>`:""}</span>
      <span class="np-k">${k?esc(d.vk&&d.vk.art==="duplex"?"Duplex":d.vk&&d.vk.art==="simplex"?"Simplex":""):""}${k&&f?`<i style="background:${f[2]}" title="${esc(f[1])}"></i>`:""}</span></div>`; };
  const dose=d=>{ const n=Math.max(1,+d.ports||1); return `<div class="np-d" role="button" tabindex="0" data-act="npDose" data-id="${esc(d.id)}"${zu?"":` data-wisch="np"`}>${Array.from({length:n},(_,j)=>port(d,j+1,j===0)).join("")}</div>`; };
  return `<section class="card np-karte"><div class="sec-row" style="margin:0 0 8px"><h3 style="margin:0">Netzwerkplan</h3>${zu?"":`<span class="ab-btns"><button class="ab-ic" data-act="npNeu" aria-label="Dose hinzufügen" title="Dose hinzufügen">${icon("add")}</button></span>`}</div>
    ${D.length?`<div class="np-kopfz"><span>Nr.</span><span>Ort</span><span>Kabel</span></div><div class="np-liste">${D.map(dose).join("")}</div>
      <p class="meta" style="margin:8px 4px 0">Antippen zum Ändern${zu?"":", nach links wischen zum Löschen"}. Räume sind freiwillig.</p>`
      :`<p class="meta">Noch keine Datendose. Mit + anlegen – Nummer, Ort und Kabel genügen, ein Raum ist nicht nötig.</p>`}
    ${zu||D.some(d=>npNr(d)===0)?"":`<button type="button" class="np-modem" data-act="npModem">${icon("add")}<span><b>Strecke zum Modem · 0.1</b><small>Vom Schrank zum Modem am Hausanschluss – die 0 ist immer der Hausanschluss</small></span></button>`}</section>`; }
function npDlg(dId,vor){ const pr=ecPr(), g=ecGeb(pr.ortId), d=dId&&g.dosen.find(x=>x.id===dId);
  const naechste=Math.max(0,...g.dosen.map(npNr).filter(x=>x!=null))+1;
  Object.assign(NP,d?{id:d.id,ports:String(Math.min(2,+d.ports||1)),art:(d.vk&&d.vk.art)||"",farbe:(d.vk&&d.vk.farbe)||"",raumId:d.raumId===(npOhneRaum(g)||{}).id?"":d.raumId}:{id:null,ports:NP.ports||"2",art:NP.art||"duplex",farbe:NP.farbe||"orange",raumId:""});
  if(vor) Object.assign(NP,{ports:"1",art:"simplex"});
  const orte=[...new Set(g.dosen.flatMap(x=>Object.values(x.po||{}).concat(x.lage||[])).map(s=>String(s).trim()).filter(Boolean))].slice(0,12);
  const R=ecRaeume(g).filter(r=>r.name!=="Ohne Raum");
  dialog(d?"Dose ändern":"Neue Dose",`<div class="fg1">${tf("npNr","Dosen-Nummer",d?String(npNr(d)??""):vor?"0":String(naechste),{form:true,ph:"z. B. 2 – 0 = Hausanschluss/Modem"})}</div>
    <div class="leg-eti-opt np-wahl" style="margin-top:12px">
      <div class="leg-eti-z"><span class="lbl">Anschlüsse</span><div class="chips">${[["1","1 Port"],["2","2 Ports"]].map(([v,t])=>`<button type="button" class="chip" data-act="npW" data-k="ports" data-v="${v}" aria-pressed="${NP.ports===v}">${t}</button>`).join("")}</div></div>
      <div class="leg-eti-z"><span class="lbl">Kabel</span><div class="chips">${[["duplex","Duplex"],["simplex","Simplex"]].map(([v,t])=>`<button type="button" class="chip" data-act="npW" data-k="art" data-v="${v}" aria-pressed="${NP.art===v}">${t}</button>`).join("")}</div></div>
      <div class="leg-eti-z"><span class="lbl">Farbe</span><div class="pk-wahl">${EC_VK_FARBE.map(([f,t,hex])=>`<button type="button" class="pk-sw${NP.farbe===f?" an":""}" data-act="npW" data-k="farbe" data-v="${f}" style="background:${hex}" title="${esc(t)}" aria-label="${esc(t)}"></button>`).join("")}</div></div></div>
    <div class="fg1">${tf("npOrt1",`Ort Port 1`,d?((d.po&&d.po[1])||d.lage||""):vor?"Modem (Hausanschluss)":"",{form:true,ph:"z. B. Kleine Theke, Fernseher"})}
      <div id="npOrt2Z"${NP.ports==="2"?"":" hidden"}>${tf("npOrt2",`Ort Port 2`,d?((d.po&&d.po[2])||""):"",{form:true,ph:"leer = wie Port 1"})}</div></div>
    ${orte.length?`<div class="chips np-orte" style="margin-top:8px">${orte.map(o=>`<button type="button" class="chip" data-act="npOrt" data-v="${esc(o)}">${esc(o)}</button>`).join("")}</div>`:""}
    <div class="fg1" style="margin-top:14px">${sf("npRaum","Raum (freiwillig)",NP.raumId,[["","– ohne Raum –"],...R.map(r=>[r.id,r.titel||r.name])],{form:true})}</div>
    <p class="meta" style="margin-top:8px">Beschriftung: Dosen-Nummer.Port, also ${esc(String(d?npNr(d)??naechste:vor?0:naechste))}.1${NP.ports==="2"?` und ${esc(String(d?npNr(d)??naechste:vor?0:naechste))}.2`:""}.</p>`,
    `${d?`<button class="btn-text danger" data-act="npDel">Löschen</button>`:""}<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="npOk">Speichern</button>`,{breit:true});
  setTimeout(()=>{ const a=document.activeElement; if(a&&a.id==="f_npNr") a.blur(); },80); }
function npRaumFuer(g,raumId){ if(raumId&&ecRaeume(g).some(r=>r.id===raumId)) return raumId; const o=npOhneRaum(g); if(o) return o.id;
  const e=ecEtagen(g)[0]; const r={id:uid(),name:"Ohne Raum"}; e.raeume.push(r); return r.id; }
function npLoeschen(g,id){ const d=g.dosen.find(x=>x.id===id); if(!d) return; const i=g.dosen.indexOf(d); g.dosen.splice(i,1); ecGebSpeichern(g); render();
  toast(npNr(d)!=null?`Dose ${npNr(d)} gelöscht`:"Dose gelöscht","Rückgängig",()=>{ const pr=ecPr(), g2=pr&&ecGeb(pr.ortId); if(!g2) return; g2.dosen.splice(Math.min(i,g2.dosen.length),0,d); ecGebSpeichern(g2); render(); }); }
WISCH_AKT.np={ links(id){ const pr=ecPr(); if(!pr) return; npLoeschen(ecGeb(pr.ortId),id); } };
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act="npNeu"],[data-act="npModem"],[data-act="npDose"],[data-act="npW"],[data-act="npOrt"],[data-act="npOk"],[data-act="npDel"]'); if(!b) return;
  e.stopImmediatePropagation(); e.preventDefault(); const a=b.dataset.act, pr=ecPr(); if(!pr) return; const g=ecGeb(pr.ortId);
  if(a==="npModem"){ if(pr.status==="fertig") return; npDlg(null,"modem"); return; }
  if(a==="npNeu"){ if(pr.status==="fertig") return; npDlg(null); return; }
  if(a==="npDose"){ if(pr.status==="fertig"){ toast("Prüfung ist abgeschlossen"); return; } npDlg(b.dataset.id); return; }
  if(a==="npW"){ const k=b.dataset.k; NP[k]=b.dataset.v; b.parentElement.querySelectorAll("button").forEach(x=>{ const an=x===b; x.setAttribute("aria-pressed",String(an)); x.classList.toggle("an",an); });
    if(k==="ports"){ const z=document.getElementById("npOrt2Z"); if(z) z.hidden=NP.ports!=="2"; if(NP.ports==="1"&&NP.art==="duplex"){ NP.art="simplex"; document.querySelectorAll('#dlg [data-k="art"]').forEach(x=>x.setAttribute("aria-pressed",String(x.dataset.v==="simplex"))); } }
    return; }
  if(a==="npOrt"){ const f1=document.getElementById("f_npOrt1"), f2=document.getElementById("f_npOrt2"), z=document.getElementById("npOrt2Z");
    const ziel=document.activeElement===f2||(f1&&f1.value.trim()&&z&&!z.hidden)?f2:f1; if(!ziel) return; ziel.value=b.dataset.v; ziel.dispatchEvent(new Event("input",{bubbles:true})); const t=ziel.closest(".tf"); if(t) t.classList.add("fl"); return; }
  if(a==="npDel"){ const id=NP.id; closeOverlays(); npLoeschen(g,id); return; }
  if(a==="npOk"){ const F=formVals(), N=parseInt(F.npNr,10); if(!(N>=0)){ toast("Bitte eine Dosen-Nummer eingeben"); return; }
    const dop=g.dosen.find(x=>x.id!==NP.id&&npNr(x)===N); if(dop){ toast(`Dose ${N} gibt es schon`); return; }
    const n=NP.ports==="2"?2:1, o1=(F.npOrt1||"").trim(), o2=(F.npOrt2||"").trim()||o1;
    const daten={...(N===0?{nutz:Object.fromEntries(Array.from({length:n},(_,j)=>[j+1,"uplink"]))}:{}),ports:n,nr:Object.fromEntries(Array.from({length:n},(_,j)=>[j+1,`${N}.${j+1}`])),po:n===2?{1:o1,2:o2}:{1:o1},vk:NP.art||NP.farbe?{art:NP.art||"",farbe:NP.farbe||""}:undefined,raumId:npRaumFuer(g,F.npRaum||"")};
    if(NP.id){ const d=g.dosen.find(x=>x.id===NP.id); if(!d) return; if(n<(+d.ports||1)&&d.pp) Object.keys(d.pp).forEach(k=>{ if(+k>n) delete d.pp[k]; }); Object.assign(d,daten); if(!d.vk) delete d.vk; d.lage=""; }
    else { const ord=Math.max(0,...g.dosen.filter(x=>x.raumId===daten.raumId).map(x=>x.ord||0))+1; g.dosen.push({id:uid(),ord,sId:g.schraenke.length===1?g.schraenke[0].id:"",pp:{},lage:"",...daten}); }
    ecGebSpeichern(g); closeOverlays(); render(); return; }
},true);
