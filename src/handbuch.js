/* ===== Betriebshandbuch (Übersicht, 04.11.2026) =====
   Entscheidungen Max: Entwürfe zu jedem Kapitel (handbuch-vorlage.js), alle dürfen Änderungen vorschlagen, Chef/Büro geben frei;
   Suche, Fotos, „Gelesen“-Bestätigung (Nachweis z. B. für Unterweisungen), Checklisten zum Abhaken, Links aus den anderen Apps (#hb=<id>).
   Daten: Datenart „handbuch“ – je Artikel ein Datensatz {id,kapitel,titel,inhalt,checkliste[],fotos[],stand,frei:{von,am},vorschlaege[],apps[]}.
   Ein Entwurf aus der Vorlage existiert nur im Code, bis er bearbeitet oder freigegeben wird. stand>0 = gültig.
   Gelesen: am eigenen Profil (profile.hbGelesen = {id: stand}) – so überschreiben sich zwei Leute nicht gegenseitig. */
const hbDarf=()=>typeof anfVerw==="function"?anfVerw():!!ME.admin;
function hbAlle(){ const R=new Map(live("handbuch").map(r=>[r.id,r])), out=[];
  HB_VORLAGE.forEach(v=>{ const r=R.get(v.id); out.push(r?{...v,...r,vorlage:true}:{...v,vorlage:true,neu:true}); R.delete(v.id); });
  R.forEach(r=>out.push({...r}));
  const ord=Object.fromEntries(HB_KAPITEL.map(([k],i)=>[k,i]));
  return out.map(a=>({...a,checkliste:a.checkliste||[],fotos:a.fotos||[],vorschlaege:(a.vorschlaege||[]).filter(x=>!x.erledigt)}))
    .sort((a,b)=>(ord[a.kapitel]??99)-(ord[b.kapitel]??99)||(a.ord??500)-(b.ord??500)); }
const hbArt=id=>hbAlle().find(a=>a.id===id)||null;
const hbGilt=a=>+a.stand>0;
function hbGelesenMap(mail){ const p=DB.profile&&DB.profile.get(String(mail||ME.mail||"").toLowerCase()); return p&&p.hbGelesen||{}; }
const hbUngelesen=()=>{ const G=hbGelesenMap(); return hbAlle().filter(a=>hbGilt(a)&&+G[a.id]!==+a.stand); };
/* einfacher Text → HTML: ## Überschrift, - Liste, 1. Liste, **fett**, Leerzeile = Absatz */
function hbMd(t){ const Z=String(t||"").replace(/\r/g,"").split("\n"); let h="", liste="";
  const zu=()=>{ if(liste){ h+=`</${liste}>`; liste=""; } }, fett=s=>esc(s).replace(/\*\*(.+?)\*\*/g,"<b>$1</b>");
  Z.forEach(z=>{ const s=z.trim(); let m;
    if(!s){ zu(); return; }
    if((m=s.match(/^##\s+(.+)/))){ zu(); h+=`<h3>${fett(m[1])}</h3>`; return; }
    if((m=s.match(/^[-•]\s+(.+)/))){ if(liste!=="ul"){ zu(); h+="<ul>"; liste="ul"; } h+=`<li>${fett(m[1])}</li>`; return; }
    if((m=s.match(/^\d+\.\s+(.+)/))){ if(liste!=="ol"){ zu(); h+="<ol>"; liste="ol"; } h+=`<li>${fett(m[1])}</li>`; return; }
    zu(); h+=`<p>${fett(s)}</p>`; }); zu(); return h; }
let HB_Q="", HB_F="alle";
function hbUebersicht(){ const A=hbAlle(), G=hbGelesenMap(), q=HB_Q.trim().toLowerCase();
  const ung=A.filter(a=>hbGilt(a)&&+G[a.id]!==+a.stand), entw=A.filter(a=>!hbGilt(a)), vor=A.filter(a=>a.vorschlaege.length);
  let L=A; if(HB_F==="neu") L=ung; else if(HB_F==="entwurf") L=entw; else if(HB_F==="vorschlag") L=vor;
  if(q) L=L.filter(a=>[a.titel,a.inhalt,...a.checkliste].join(" ").toLowerCase().includes(q));
  const chip=(v,t,n)=>`<button type="button" class="chip" data-act="hbFilter" data-v="${v}" aria-pressed="${HB_F===v}">${t}${n!=null?` · ${n}`:""}</button>`;
  const item=a=>{ const gel=hbGilt(a)&&+G[a.id]===+a.stand, st=!hbGilt(a)?pill("open","Entwurf"):gel?"":pill("wip",G[a.id]?"geändert":"neu");
    return `<div class="li" role="button" tabindex="0" data-act="hbAuf" data-id="${esc(a.id)}"><span class="av">${icon(a.checkliste.length?"check":"book")}</span><span class="lt"><span class="h">${esc(a.titel)}</span>
      <span class="s">${esc(hbGilt(a)?`Stand ${a.stand} · ${ecDatumKurz(a.frei&&a.frei.am)}`:"noch nicht freigegeben")}${a.vorschlaege.length?` · ${a.vorschlaege.length} Vorschlag${a.vorschlaege.length===1?"":"e"}`:""}</span><span class="st">${st}</span></span>${icon("chev")}</div>`; };
  const nachKap=HB_KAPITEL.map(([k,t])=>[t,L.filter(a=>a.kapitel===k)]).concat([["Weitere",L.filter(a=>!HB_KAPITEL.some(([k])=>k===a.kapitel))]]).filter(([,X])=>X.length);
  return `<div class="narrow hb">
    <div class="tf hb-such"><input id="hbQ" type="search" value="${esc(HB_Q)}" placeholder="Im Handbuch suchen" autocomplete="off" aria-label="Im Handbuch suchen"><span class="hb-lupe">${icon("search")}</span></div>
    <div class="chips ec-wahl hb-filter">${chip("alle","Alle")}${chip("neu","Zu lesen",ung.length)}${chip("entwurf","Entwürfe",entw.length)}${hbDarf()||vor.length?chip("vorschlag","Vorschläge",vor.length):""}</div>
    ${nachKap.length?nachKap.map(([t,X])=>`<div class="sec-lbl">${esc(t)}</div>${listOf(X.map(item))}`).join(""):`<p class="meta" style="margin:16px 4px">${q?"Nichts gefunden.":"Hier ist gerade nichts."}</p>`}
    <p class="hint">${hbDarf()?"Entwürfe sind Vorschläge – erst nach deiner Freigabe gelten sie. Änderungsvorschläge der Kollegen landen unter „Vorschläge“.":"Fehlt etwas oder stimmt etwas nicht? Im Artikel „Änderung vorschlagen“ – der Chef gibt frei."}</p></div>`; }
const ecDatumKurz=iso=>iso?String(iso).slice(0,10).split("-").reverse().join("."):"";
/* Checklisten: abgehakt wird auf diesem Gerät (je Artikel), „Neu beginnen“ setzt zurück */
const hbCkKey=id=>"irrgang_hbck|"+id;
const hbCk=id=>{ try{ return JSON.parse(localStorage.getItem(hbCkKey(id))||"{}"); }catch(e){ return {}; } };
function hbArtikel(id){ const a=hbArt(id); if(!a) return `<div class="narrow"><p class="meta">Artikel nicht gefunden.</p></div>`; const G=hbGelesenMap(), gel=hbGilt(a)&&+G[a.id]===+a.stand, ck=hbCk(a.id), n=a.checkliste.filter((_,i)=>ck[i]).length;
  const kap=(HB_KAPITEL.find(([k])=>k===a.kapitel)||[,""])[1];
  const leser=hbDarf()&&hbGilt(a)?(()=>{ const T=team(); const ja=T.filter(m=>+hbGelesenMap(m.mail)[a.id]===+a.stand); return `<details class="hb-leser"><summary>Gelesen von ${ja.length} von ${T.length}</summary><div>${T.map(m=>`<span class="${ja.includes(m)?"ja":"nein"}">${esc(m.name||m.mail)}</span>`).join("")}</div></details>`; })():"";
  return `<div class="narrow hb hb-art">
    <p class="hb-meta">${esc([kap,hbGilt(a)?`Stand ${a.stand} vom ${ecDatumKurz(a.frei&&a.frei.am)}${a.frei&&a.frei.von?`, freigegeben von ${a.frei.von}`:""}`:""].filter(Boolean).join(" · "))}</p>
    ${hbGilt(a)?"":`<div class="hb-entwurf">${icon("warn")}<span><b>Entwurf – noch nicht freigegeben.</b>${a.neu?" Vorschlag als Grundlage; bitte prüfen und an eure Praxis anpassen.":""}</span></div>`}
    <article class="hb-text">${hbMd(a.inhalt)}</article>
    ${a.fotos.length?`<div class="hb-fotos">${a.fotos.map((f,i)=>`<button type="button" data-act="hbFoto" data-id="${esc(a.id)}" data-i="${i}"><img src="${esc(f)}" alt=""></button>`).join("")}</div>`:""}
    ${a.checkliste.length?`<section class="hb-ck"><div class="hb-ck-kopf"><b>Checkliste</b><span>${n} von ${a.checkliste.length}</span>${n?`<button type="button" class="btn-text" data-act="hbCkNeu" data-id="${esc(a.id)}">Neu beginnen</button>`:""}</div>
      ${a.checkliste.map((t,i)=>`<button type="button" class="hb-ck-z${ck[i]?" an":""}" data-act="hbCk" data-id="${esc(a.id)}" data-i="${i}" aria-pressed="${!!ck[i]}"><span class="hb-box"></span><span>${esc(t)}</span></button>`).join("")}</section>`:""}
    ${hbGilt(a)?(gel?`<p class="hb-gelesen">${icon("check")}Gelesen</p>`:`<button type="button" class="hb-lesen" data-act="hbGelesen" data-id="${esc(a.id)}">${icon("check")}Gelesen und verstanden</button>`):""}
    ${leser}
    ${a.vorschlaege.length&&hbDarf()?`<div class="sec-lbl">Vorschläge</div>${a.vorschlaege.map(v=>`<section class="hb-vor"><p><b>${esc(v.von||"Jemand")}</b> · ${esc(ecDatumKurz(v.am))}${v.notiz?`<br>${esc(v.notiz)}`:""}</p>
      <details><summary>Vorgeschlagener Text ansehen</summary><div class="hb-text">${hbMd(v.inhalt)}</div>${(v.checkliste||[]).length?`<ul>${v.checkliste.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:""}</details>
      <div class="hb-vor-k"><button type="button" class="btn-text" data-act="hbVorWeg" data-id="${esc(a.id)}" data-v="${esc(v.id)}">Ablehnen</button><button type="button" class="btn-tonal" data-act="hbVorOk" data-id="${esc(a.id)}" data-v="${esc(v.id)}">Übernehmen und freigeben</button></div></section>`).join("")}`
      :a.vorschlaege.length?`<p class="meta">${a.vorschlaege.length} Vorschlag${a.vorschlaege.length===1?"":"e"} wartet auf Freigabe.</p>`:""}
    <div class="hb-fuss">${hbDarf()?`<button type="button" class="btn-tonal" data-act="hbEdit" data-id="${esc(a.id)}">${icon("edit")}Bearbeiten</button>${hbGilt(a)?"":`<button type="button" class="btn-filled" data-act="hbFrei" data-id="${esc(a.id)}">Freigeben</button>`}`
      :`<button type="button" class="btn-tonal" data-act="hbEdit" data-id="${esc(a.id)}">${icon("edit")}Änderung vorschlagen</button>`}</div></div>`; }
/* ---- Speichern ---- */
function hbRec(a){ const alt=DB.handbuch.get(a.id); return {r:alt||{id:a.id,kapitel:a.kapitel,titel:a.titel,inhalt:a.inhalt,checkliste:a.checkliste||[],fotos:a.fotos||[],apps:a.apps||[],stand:0,vorschlaege:[]},neu:!alt}; }
function hbFreigeben(id,w){ const a=hbArt(id); if(!a||!hbDarf()) return; const {r,neu}=hbRec(a); if(w) Object.assign(r,w);
  r.stand=(+r.stand||0)+1; r.frei={von:ME.name||"",am:today()}; r.deleted=false; saveRec("handbuch",r,neu); }
/* ---- Editor ---- */
let HB_ED=null;
function hbEditor(id){ const a=id?hbArt(id):{id:"hb-"+uid(),kapitel:HB_KAPITEL[0][0],titel:"",inhalt:"",checkliste:[],fotos:[],stand:0}; if(!a) return;
  HB_ED={id:a.id,neu:!id,fotos:[...(a.fotos||[])]}; const chef=hbDarf();
  dialog(id?(chef?"Artikel bearbeiten":"Änderung vorschlagen"):"Neuer Artikel",`<div class="fg1 hb-ed">
      ${tf("hbTitel","Titel",a.titel,{form:true,ph:"z. B. Verteiler bauen und beschriften"})}
      ${sf("hbKap","Kapitel",a.kapitel,HB_KAPITEL,{form:true})}
      ${ta("hbInhalt","Text",a.inhalt,{form:true,ph:"## Zwischenüberschrift\n- Aufzählung\n**fett**"})}
      ${ta("hbCk","Checkliste – ein Punkt pro Zeile (optional)",(a.checkliste||[]).join("\n"),{form:true})}
      <div class="hb-ed-fotos" id="hbEdFotos"></div>
      ${chef?"":ta("hbNotiz","Was hast du geändert und warum?","",{form:true,ph:"z. B. Steckdosenhöhe Küche bei uns 110 cm"})}
    </div>`,
    `<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-filled" data-act="hbEdOk">${chef?"Speichern und freigeben":"Vorschlag senden"}</button>`,{breit:true});
  hbEdFotos(); }
function hbEdFotos(){ const el=document.getElementById("hbEdFotos"); if(!el||!HB_ED) return;
  el.innerHTML=`<div class="lbl">Fotos (${HB_ED.fotos.length} von 4)</div><div class="hb-fotos">${HB_ED.fotos.map((f,i)=>`<span class="hb-ed-f"><img src="${esc(f)}" alt=""><button type="button" data-act="hbEdFotoWeg" data-i="${i}" aria-label="Foto entfernen">${icon("close")}</button></span>`).join("")}
    ${HB_ED.fotos.length<4?`<button type="button" class="hb-ed-plus" data-act="hbEdFotoNeu" aria-label="Foto hinzufügen">${icon("cam")}</button>`:""}</div>`; }
function hbEdOk(){ if(!HB_ED) return; const F=formVals(), t=(F.hbTitel||"").trim(); if(!t){ toast("Bitte einen Titel eingeben"); return; }
  const w={titel:t,kapitel:F.hbKap||HB_KAPITEL[0][0],inhalt:F.hbInhalt||"",checkliste:String(F.hbCk||"").split("\n").map(x=>x.trim()).filter(Boolean),fotos:HB_ED.fotos};
  const a=HB_ED.neu?{id:HB_ED.id,...w,stand:0}:hbArt(HB_ED.id); if(!a) return;
  if(hbDarf()){ if(HB_ED.neu){ saveRec("handbuch",{id:a.id,...w,apps:[],stand:1,frei:{von:ME.name||"",am:today()},vorschlaege:[]},true); } else hbFreigeben(a.id,w);
    const id=a.id; HB_ED=null; closeOverlays(); go({v:"hb",id}); toast("Gespeichert und freigegeben – alle sehen den Artikel als neu"); return; }
  const {r,neu}=hbRec(a); r.vorschlaege=(r.vorschlaege||[]).filter(x=>!x.erledigt); r.vorschlaege.push({id:uid(),von:ME.name||"",mail:ME.mail||"",am:today(),...w,notiz:(F.hbNotiz||"").trim()});
  saveRec("handbuch",r,neu); HB_ED=null; closeOverlays(); render(); toast("Vorschlag gesendet – Chef oder Büro geben frei"); }
function hbFotoDazu(){ const i=document.createElement("input"); i.type="file"; i.accept="image/*"; i.style.display="none"; document.body.appendChild(i);
  i.onchange=async()=>{ const f=i.files&&i.files[0]; i.remove(); if(!f||!HB_ED) return; try{ HB_ED.fotos.push(await (typeof kiBild==="function"?kiBild(f,1000):fotoVerkleinern(f))); hbEdFotos(); }catch(e){ toast("Foto konnte nicht gelesen werden"); } }; i.click(); }
/* ---- Klicks ---- */
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act^="hb"]'); if(!b||b.disabled) return; e.stopPropagation(); const a=b.dataset.act, id=b.dataset.id;
  if(a==="hbAuf"){ go({v:"hb",id}); return; }
  if(a==="hbFilter"){ HB_F=b.dataset.v; render(); return; }
  if(a==="hbCk"){ const c=hbCk(id); c[b.dataset.i]=!c[b.dataset.i]; try{ localStorage.setItem(hbCkKey(id),JSON.stringify(c)); }catch(x){} render(); return; }
  if(a==="hbCkNeu"){ try{ localStorage.removeItem(hbCkKey(id)); }catch(x){} render(); return; }
  if(a==="hbGelesen"){ const art=hbArt(id), pid=String(ME.mail||"").toLowerCase(); if(!art||!pid) return; const alt=DB.profile.get(pid), r=alt||{id:pid};
    r.hbGelesen={...(r.hbGelesen||{}),[id]:+art.stand}; saveRec("profile",r,!alt); render(); toast("Als gelesen bestätigt"); return; }
  if(a==="hbFrei"){ hbFreigeben(id); render(); toast("Freigegeben – alle sehen den Artikel als neu"); return; }
  if(a==="hbEdit"){ hbEditor(id); return; }
  if(a==="hbNeu"){ hbEditor(null); return; }
  if(a==="hbEdOk"){ hbEdOk(); return; }
  if(a==="hbEdFotoNeu"){ hbFotoDazu(); return; }
  if(a==="hbEdFotoWeg"){ if(HB_ED){ HB_ED.fotos.splice(+b.dataset.i,1); hbEdFotos(); } return; }
  if(a==="hbFoto"){ const art=hbArt(id), f=art&&art.fotos[+b.dataset.i]; if(f) dialog("Foto",`<img src="${esc(f)}" alt="" style="width:100%;border-radius:16px">`,`<span style="flex:1"></span><button class="btn-text" data-act="cancel">Schließen</button>`,{breit:true}); return; }
  if(a==="hbVorOk"||a==="hbVorWeg"){ if(!hbDarf()) return; const art=hbArt(id); if(!art) return; const {r,neu}=hbRec(art), v=(r.vorschlaege||[]).find(x=>x.id===b.dataset.v); if(!v) return;
    r.vorschlaege=r.vorschlaege.filter(x=>x!==v);
    if(a==="hbVorOk"){ saveRec("handbuch",r,neu); hbFreigeben(id,{titel:v.titel,kapitel:v.kapitel,inhalt:v.inhalt,checkliste:v.checkliste||[],fotos:v.fotos||[]}); toast(`Vorschlag von ${v.von||"Kollege"} übernommen`); }
    else { saveRec("handbuch",r,neu); toast("Vorschlag abgelehnt"); }
    render(); return; } },true);
document.addEventListener("input",e=>{ if(e.target&&e.target.id==="hbQ"){ HB_Q=e.target.value; const pos=e.target.selectionStart; render(); const q=document.getElementById("hbQ"); if(q){ q.focus(); try{ q.setSelectionRange(pos,pos); }catch(x){} } } });
/* Startseite der Monteure (ohne Kachel-Dashboard): eine Zeile zum Handbuch */
function hbStartZeile(){ const n=hbUngelesen().length;
  return listOf([`<div class="li" role="button" tabindex="0" data-act="nav" data-v="hb"><span class="av">${icon("book")}</span><span class="lt"><span class="h">Betriebshandbuch</span><span class="s">${n?`${n} Artikel zu lesen`:"Wie wir arbeiten – zum Nachschlagen"}</span>${n?`<span class="st">${pill("wip","neu")}</span>`:""}</span>${icon("chev")}</div>`]); }
window.addEventListener("hashchange",()=>{ if(/^#hb=/.test(location.hash)&&typeof nav!=="undefined"&&nav.v!=="login"){ const id=decodeURIComponent(location.hash.slice(4)); history.replaceState(null,"",location.pathname); go({v:"hb",id}); } });
