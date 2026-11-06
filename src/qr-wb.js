/* ===== QR-Aufkleber für Wallboxen (EVSE) – freiwillig, sinnvoll v. a. bei Ladeparks und Gewerbe (Max, 05.11.2026) =====
   Die Nummer steht am Gerät des Orts: ortRec(sid,lid).geraete[i].qr (nicht in den Prüfungen – STAMM_AUS).
   Link …/q/#NUMMER&a=wb → öffentliche Seite „Wallbox lädt nicht?“, Störung melden, Anleitung des Herstellers.
   Öffentliche Ladesäulen (Ort mit qrOeff): &a=ws → nur „Service / Wartung“, Fahrer gehen an die Hotline des Betreibers.
   &h=… ist das Kürzel des Herstellers für den Link zur Anleitung. Mehr passt nicht in den Link: schon 53 Zeichen sind die
   Grenze, bis zu der der QR auf dem Brother-Band 29 Zellen bleibt (sonst ragt er aus dem 18-mm-Druckbereich).
   Die öffentliche Seite hat keine Daten – Prüftermin, Seriennummer und Standort kennt nur die App (über die Nummer). */
const WB_HERST=[["me","Mennekes"],["ke","KEBA"],["se","Schneider"],["hu","Huawei"],["ab","ABL"],["we","Webasto"],["he","Heidelberg"],["al","Alfen"],["ea","Easee"],["go","go-e"],["za","Zaptec"],["co","Compleo"],["hg","Hager"],["wa","Wallbox"],["sm","SMA"],["fr","Fronius"],["eb","EVBox"],["cp","ChargePoint"]];
function qrWbHerst(g){ const r=typeof katVon==="function"&&katVon(g), t=String((r&&r.hersteller)||g.hersteller||g.typ||"").toLowerCase();
  const h=WB_HERST.find(([,n])=>t.startsWith(n.toLowerCase())||t.includes(n.toLowerCase()+" ")); return h?h[0]:""; }
/* alle Orte mit Geräten: Ladepark, Standort, Kundenadresse (k:<Kunde>) */
function qrWbOrte(){ const L=[];
  live("ladeparks").forEach(l=>L.push({sid:l.standortId,lid:l.id,o:l}));
  live("standorte").forEach(s=>L.push({sid:s.id,lid:null,o:s}));
  live("kunden").forEach(k=>L.push({sid:"k:"+k.id,lid:null,o:k}));
  return L; }
function qrWbOrtText(sid,lid){ const l=lid&&ladeparkOf(lid), k=kOrt(sid)?kundeOf(sid.slice(2)):null, s=!k&&standortOf(sid), kd=k||(s&&kundeOf(s.kundeId));
  return [kd&&kd.name,s&&s.name,l&&l.name].filter(Boolean).join(" › "); }
/* Nummer → Wallbox (nur festgeschriebene Geräte des Orts tragen eine Nummer) */
function qrAlle(){ const S=new Map(); for(const t of qrWbOrte()){ if(!Array.isArray(t.o.geraete)) continue; const A=t.o.geraete.filter(g=>!g.aus);
    t.o.geraete.forEach(g=>{ if(g.qr) S.set(g.qr,{...t,g,i:Math.max(0,A.indexOf(g))}); }); } return S; }
function qrArt(c){ const t=c&&qrAlle().get(c); return t&&t.o.qrOeff?"ws":"wb"; }
const qrLink=c=>{ const t=c&&qrAlle().get(c), h=t?qrWbHerst(t.g):""; return QR_URL+c+"&a="+(t&&t.o.qrOeff?"ws":"wb")+(h?"&h="+h:""); };
/* Zeile auf dem PDF-Etikett: Name der Wallbox – so findet man beim Bogen den richtigen Aufkleber */
function qrTexteApp(c){ const t=qrAlle().get(c); if(!t||t.o.qrOeff) return null; const n=sName(t.g,t.i); return {zeile:(n.length>16?n.slice(0,15)+"…":n)+" | Hilfe per Scan"}; }
const qrWbName=t=>sName(t.g,t.i);
function qrWbNav(t){ if(t.g.sn&&geraeteTreffer(t.g.sn).length) return {v:"geraet",sn:t.g.sn}; return t.lid?{v:"ladepark",id:t.lid}:kOrt(t.sid)?{v:"kunde",id:t.sid.slice(2)}:{v:"standort",id:t.sid}; }
const qrWbDarf=o=>!SYNC_ON||canEdit(o)||!!o.demo;

/* ---- Scanner (scanner.js) ---- */
function qrTreffer(c){ const t=qrAlle().get(c);
  if(!t) return {titel:`Aufkleber ${qrZeig(c)}`,sub:"Gehört zu keiner Wallbox – zuordnen oder in Gebäudetechnik suchen",ic:"neu",knopf:"Weiter"};
  return {titel:qrWbName(t),sub:[t.g.typ,qrWbOrtText(t.sid,t.lid)].filter(Boolean).join(" · "),ic:"wb",knopf:"Öffnen"}; }
let QR_WARTET="";
function qrOeffnen(c,nochmal){ c=qrNorm(c); if(!c){ toast("Kein Irrgang-Aufkleber erkannt"); return; }
  const t=qrAlle().get(c); if(t){ QR_WARTET=""; const vor=typeof nav!=="undefined"&&nav&&nav.v&&nav.v!=="login"?{...nav}:null; go({...qrWbNav(t),zur:vor}); return; }
  if(!nochmal&&SYNC_ON&&ME.signedIn&&typeof syncNow==="function"){ toast("Aufkleber wird gesucht …"); Promise.resolve(syncNow()).catch(()=>{}).then(()=>qrOeffnen(c,true)); return; }
  qrWbZuDlg(c); }
/* Aufruf über die Info-Seite: …/evse/#qr=NUMMER – nach der Anmeldung weiter (render() ruft qrNachLogin) */
function qrStart(){ const m=location.hash.match(/qr=([0-9A-Za-z]{6})/); if(!m) return; QR_WARTET=m[1].toUpperCase();
  try{ history.replaceState(null,"",location.pathname+location.search); }catch(e){} }
function qrNachLogin(){ if(!QR_WARTET||nav.v==="login") return; const c=QR_WARTET; QR_WARTET=""; setTimeout(()=>qrOeffnen(c),0); }
qrStart(); addEventListener("hashchange",()=>{ qrStart(); if(QR_WARTET&&typeof render==="function") render(); });

/* ---- Unbekannte Nummer: einer Wallbox zuordnen ---- */
let qrWbZu={c:"",such:""};
function qrWbGeraete(){ const L=[]; for(const t of qrWbOrte()){ const G=geraeteOrt(t.sid,t.lid); if(!G.length) continue; const A=G.filter(g=>!g.aus), ort=qrWbOrtText(t.sid,t.lid);
    A.forEach((g,i)=>L.push({...t,g,i,ort,updated:t.o.updated||0,such:[sName(g,i),g.typ,g.sn,g.ort,ort].filter(Boolean).join(" ")})); } return L; }
function qrWbZuListe(){ const q=qrWbZu.such.trim().toLowerCase(), A=qrWbGeraete().filter(e=>!q||suPasst(q,e.such)).sort((a,b)=>b.updated-a.updated).slice(0,q?40:8);
  if(!A.length) return `<p class="meta" style="margin:8px 4px">${q?"Keine Wallbox gefunden.":"Noch keine Wallboxen angelegt."}</p>`;
  return `<div class="list">${A.map(e=>`<div class="li" role="button" tabindex="0" data-act="qrWbZuOk" data-sid="${esc(e.sid)}" data-lid="${esc(e.lid||"")}" data-gid="${esc(e.g.gid)}">${stAv(e.g)}<span class="lt"><span class="h">${esc(sName(e.g,e.i))}</span><span class="s">${esc(e.ort)}</span><span class="s">${e.g.qr?`hat schon Aufkleber ${esc(qrZeig(e.g.qr))} – wird ersetzt`:esc([e.g.typ,e.g.sn&&`SN ${e.g.sn}`].filter(Boolean).join(" · "))}</span></span>${icon("chev")}</div>`).join("")}</div>`; }
function qrWbZuDlg(c){ qrWbZu={c,such:""};
  dialog(`Aufkleber ${qrZeig(c)}`,`<p>Diese Nummer gehört noch zu keiner Wallbox. Zu welcher gehört der Aufkleber?</p>
    <div class="fg1" style="margin-top:10px">${tf("qrWbSuch","Wallbox suchen","",{form:true,ph:"Kunde, Ladepark, Typ, Seriennummer"})}</div>
    <div class="lbl" style="margin:14px 4px 6px">Zuletzt bearbeitet</div><div id="qrWbZuL">${qrWbZuListe()}</div>
    <button type="button" class="qr-w" data-act="qrWbEcheck" style="margin-top:14px"><span class="av">${icon("qr")}</span><span class="lt"><span class="h">Aufkleber am Verteiler oder Netzwerkschrank?</span><span class="s">In Gebäudetechnik öffnen</span></span>${icon("chev")}</button>`,
    `<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button>`,{breit:true});
  setTimeout(()=>{ const f=document.getElementById("f_qrWbSuch"); if(f&&matchMedia("(pointer:coarse)").matches) f.blur(); },80); }
document.addEventListener("input",e=>{ if(e.target&&e.target.id==="f_qrWbSuch"){ qrWbZu.such=e.target.value; const l=document.getElementById("qrWbZuL"); if(l) l.innerHTML=qrWbZuListe();
  const lb=l&&l.previousElementSibling; if(lb) lb.textContent=qrWbZu.such.trim()?"Treffer":"Zuletzt bearbeitet"; } });

/* Nummer setzen; alte Zuordnung derselben Nummer wird gelöst. true = gespeichert */
function qrWbSetzen(sid,lid,gid,c){ const o=ortFest(sid,lid); if(!o) return false; if(!qrWbDarf(o)){ toast("Keine Berechtigung für diesen Ort"); return false; }
  const g=o.geraete.find(x=>x.gid===gid); if(!g) return false;
  const alt=c&&qrAlle().get(c); if(alt&&!(alt.o===o&&alt.g.gid===gid)){ delete alt.g.qr; alt.o.updated=Date.now(); if(alt.o!==o) saveRec(ortKind(alt.lid,alt.sid),alt.o,false); }
  if(c) g.qr=c; else delete g.qr; saveRec(ortKind(lid,sid),o,false); return true; }
const qrWbDruckName=(sid,lid,gid)=>{ const t=[...qrAlle().values()].find(x=>x.sid===sid&&(x.lid||null)===(lid||null)&&x.g.gid===gid); return t?`QR ${qrWbName(t)} ${t.g.qr}`.replace(/\s+/g," "):"QR Wallbox"; };

/* ---- Dialog „QR-Aufkleber“ am Ort (Ladepark, Standort, Kundenadresse) ---- */
let qrWbOrt=null;
function qrWbOrtDlg(sid,lid){ qrWbOrt={sid,lid:lid||null}; const o=ortRec(sid,lid); if(!o) return; const G=geraeteOrt(sid,lid).filter(g=>!g.aus), ed=qrWbDarf(o), ohne=G.filter(g=>!g.qr).length;
  const zeile=(g,i)=>`<div class="wbq-z">${g.qr?`<span class="wbq-qr">${qrSvg(g.qr,44)}</span>`:stAv(g)}<span class="lt"><span class="h">${esc(sName(g,i))}</span><span class="s">${g.qr?`Aufkleber <b>${esc(qrZeig(g.qr))}</b>`:"noch kein Aufkleber"}</span></span>
    ${ed?`<span class="wbq-kn">${g.qr?`<button type="button" class="wbq-b" data-act="qrWbDruck" data-gid="${esc(g.gid)}" aria-label="Drucken" title="Drucken">${icon("tag")}</button><button type="button" class="wbq-b weg" data-act="qrWbWegAsk" data-gid="${esc(g.gid)}" aria-label="Entfernen" title="Entfernen">${icon("del")}</button>`
      :`<button type="button" class="wbq-b" data-act="qrWbScan" data-gid="${esc(g.gid)}" aria-label="${DESK.matches?"Nummer eingeben":"Aufkleber scannen"}" title="${DESK.matches?"Nummer eingeben":"Aufkleber scannen"}">${icon("qr")}</button><button type="button" class="wbq-b voll" data-act="qrWbNeu" data-gid="${esc(g.gid)}">${icon("tag")}<span>Drucken</span></button>`}</span>`:""}</div>`;
  dialog("QR-Aufkleber",`<p class="wbq-ein">Freiwillig – sinnvoll bei Ladeparks und Gewerbe. Wer scannt, findet Hilfe und meldet Störungen mit der richtigen Nummer. Wir landen direkt bei der Wallbox.</p>
    <div class="lbl" style="margin:14px 4px 6px">Wer lädt hier?</div>
    <div class="wbq-wahl">${[["","Kunde · Gewerbe","Hilfe „Wallbox lädt nicht?“ und Störung melden"],["1","Öffentlich","Nur „Service / Wartung“ – Fahrer an die Hotline des Betreibers"]].map(([v,h,s])=>`<button type="button" data-act="qrWbOeff" data-v="${v}" aria-pressed="${String(!!o.qrOeff===!!v)}"${ed?"":" disabled"}><b>${h}</b><small>${s}</small></button>`).join("")}</div>
    <div class="lbl" style="margin:16px 4px 6px">Geräte · ${G.length}</div>
    ${G.length?`<div class="wbq-liste">${G.map(zeile).join("")}</div>`:`<p class="meta">Noch keine Geräte an diesem Ort.</p>`}
    <p class="hint" style="margin-top:12px">Draußen: Brother-Band TZe (laminiert) zuerst an einer Box testen. Ein Etikett je Wallbox – gut sichtbar, nicht auf das Typenschild.</p>`,
    `${ed&&ohne>1?`<button class="btn-text" data-act="qrWbAlle">Alle ohne Aufkleber · PDF (${ohne})</button>`:""}<span style="flex:1"></span><button class="btn-text" data-act="cancel">Schließen</button>`,{breit:true}); }
const qrWbOrtNeu=()=>{ if(qrWbOrt&&!document.getElementById("dlg").hidden) qrWbOrtDlg(qrWbOrt.sid,qrWbOrt.lid); };
/* Zeile auf der Ortsseite (unter den Geräten) */
function qrWbOrtZeile(sid,lid){ const G=geraeteOrt(sid,lid).filter(g=>!g.aus); if(!G.length) return ""; const n=G.filter(g=>g.qr).length;
  return `<button type="button" class="wbq-ort" data-act="qrWbOrt" data-sid="${esc(sid)}" data-lid="${esc(lid||"")}"><span class="av">${icon("qr")}</span><span class="lt"><span class="h">QR-Aufkleber</span><span class="s">${n?`${n} von ${G.length} Geräten beklebt`:"Freiwillig – Hilfe und Störmeldung per Scan"}</span></span>${icon("chev")}</button>`; }

/* ---- Karte in der Geräteakte ---- */
function qrWbAkteKarte(sn){ const T=geraeteTreffer(sn), L=T[0]; if(!L) return ""; const sid=L.p.standortId, lid=L.p.ladeparkId||null, gid=L.s.gid||L.s.id, o=ortRec(sid,lid); if(!o) return "";
  const A=geraeteOrt(sid,lid).filter(g=>!g.aus), g=A.find(x=>x.gid===gid); if(!g) return ""; const ed=qrWbDarf(o);
  const kn=(act,ic,t,kl)=>`<button type="button" class="qr-k${kl?" "+kl:""}" data-act="${act}" data-sid="${esc(sid)}" data-lid="${esc(lid||"")}" data-gid="${esc(gid)}">${icon(ic)}<span>${t}</span></button>`;
  return `<section class="card qr-karte" style="margin-top:12px"><h3>QR-Aufkleber</h3>${g.qr?`<div class="qr-zeile">${qrSvg(g.qr,112)}<div class="qr-txt"><small>${o.qrOeff?"Service / Wartung":"Anlagen-Nr."}</small><b class="qr-nr">${esc(qrZeig(g.qr))}</b><span class="meta">Scannen öffnet diese Wallbox. ${o.qrOeff?"Fremde sehen nur den Service-Hinweis.":"Fremde sehen Hilfe und Störmeldung."}</span></div></div>
      ${ed?`<div class="qr-knoepfe">${kn("qrWbDruck","tag","Drucken")}${kn("qrWbScan","qr","Ersetzen")}${kn("qrWbWegAsk","del","Entfernen","weg")}</div>`:""}`
    :`<p class="meta">Freiwillig. Kunden finden per Scan Hilfe und melden Störungen mit der richtigen Nummer – wir landen direkt hier.</p>
      ${ed?`<div class="qr-knoepfe zwei">${kn("qrWbScan","qr",DESK.matches?"Nummer eingeben":"Aufkleber scannen")}${kn("qrWbNeu","tag","Neuen drucken")}</div>`:""}`}</section>`; }

/* Knopf → Gerät: im Dialog aus qrWbOrt, in der Akte aus den data-Attributen */
function qrWbZiel(b){ if(b.dataset.sid!==undefined) return {sid:b.dataset.sid,lid:b.dataset.lid||null,gid:b.dataset.gid}; return qrWbOrt&&{sid:qrWbOrt.sid,lid:qrWbOrt.lid,gid:b.dataset.gid}; }
function qrWbScan(z){ const G=geraeteOrt(z.sid,z.lid), A=G.filter(g=>!g.aus), g=G.find(x=>x.gid===z.gid); if(!g) return; const nm=sName(g,Math.max(0,A.indexOf(g)));
  closeOverlays();
  scOeffnen({titel:"Aufkleber zuordnen",treffer:c=>{ const alt=qrAlle().get(c); return {titel:nm,sub:alt&&alt.g.gid===z.gid?"hat diesen Aufkleber schon":alt?`Aufkleber hängt noch an „${qrWbName(alt)}“ – wird umgehängt`:`Aufkleber ${qrZeig(c)} dieser Wallbox zuordnen`,ic:"wb",knopf:"Zuordnen"}; },
    aktion:c=>{ const alt=qrAlle().get(c); if(alt&&alt.g.gid===z.gid){ toast("Aufkleber ist schon dieser Wallbox zugeordnet"); return; }
      if(qrWbSetzen(z.sid,z.lid,z.gid,c)){ softRender(); toast(alt?`Aufkleber ${qrZeig(c)} umgehängt von „${qrWbName(alt)}“`:`Aufkleber ${qrZeig(c)} zugeordnet`); } }}); }

document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act^="qrWb"]'); if(!b||b.disabled) return; e.stopPropagation(); const a=b.dataset.act;
  if(a==="qrWbOrt"){ qrWbOrtDlg(b.dataset.sid,b.dataset.lid||null); return; }
  if(a==="qrWbOeff"){ const o=qrWbOrt&&ortRec(qrWbOrt.sid,qrWbOrt.lid); if(!o||!qrWbDarf(o)) return; const v=!!b.dataset.v; if(!!o.qrOeff===v) return;
    if(v) o.qrOeff=true; else delete o.qrOeff; saveRec(ortKind(qrWbOrt.lid,qrWbOrt.sid),o,false); qrWbOrtNeu();
    if(geraeteOrt(qrWbOrt.sid,qrWbOrt.lid).some(g=>g.qr)) toast("Schon geklebte Aufkleber zeigen die Art aus dem Druck – bei Bedarf neu drucken"); return; }
  if(a==="qrWbNeu"){ const z=qrWbZiel(b); if(!z) return; const c=qrNeu(); if(!qrWbSetzen(z.sid,z.lid,z.gid,c)) return; softRender(); closeOverlays(); qrDruckDlg(c,qrWbDruckName(z.sid,z.lid,z.gid)); return; }
  if(a==="qrWbDruck"){ const z=qrWbZiel(b); if(!z) return; const g=geraeteOrt(z.sid,z.lid).find(x=>x.gid===z.gid); if(!g||!g.qr) return; closeOverlays(); qrDruckDlg(g.qr,qrWbDruckName(z.sid,z.lid,z.gid)); return; }
  if(a==="qrWbScan"){ const z=qrWbZiel(b); if(z) qrWbScan(z); return; }
  if(a==="qrWbWegAsk"){ const z=qrWbZiel(b); if(!z) return; qrWbWeg=z; confirmDlg("Aufkleber entfernen?","Die Nummer gehört dann zu keiner Wallbox mehr. Scannt jemand den alten Aufkleber, fragt die App, wohin er gehört.","Entfernen","qrWbWegOk"); return; }
  if(a==="qrWbWegOk"){ const z=qrWbWeg; qrWbWeg=null; closeOverlays(); if(z&&qrWbSetzen(z.sid,z.lid,z.gid,"")){ softRender(); toast("Aufkleber entfernt"); } return; }
  if(a==="qrWbAlle"){ if(!qrWbOrt) return; const {sid,lid}=qrWbOrt, G=geraeteOrt(sid,lid).filter(g=>!g.aus&&!g.qr), S=qrAlle(), C=[];
    for(const g of G){ const c=qrNeu(S); if(qrWbSetzen(sid,lid,g.gid,c)) C.push(c); } closeOverlays(); softRender();
    if(C.length) qrPdfZeigen(C,false,`QR Wallboxen ${qrWbOrtText(sid,lid)} (${C.length} Stück)`.replace(/[\\/:*?"<>|]/g," ")); return; }
  if(a==="qrWbZuOk"){ const c=qrWbZu.c; if(!c) return; const sid=b.dataset.sid, lid=b.dataset.lid||null; if(!qrWbSetzen(sid,lid,b.dataset.gid,c)) return; closeOverlays();
    const t=qrAlle().get(c); if(t) go(qrWbNav(t)); toast(`Aufkleber ${qrZeig(c)} zugeordnet`); return; }
  if(a==="qrWbEcheck"){ const c=qrWbZu.c; closeOverlays(); location.href=`../echeck/#qr=${encodeURIComponent(c)}`; return; }
},true);
let qrWbWeg=null;
