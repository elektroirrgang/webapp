/* ===== Bibliothek – gemeinsam für alle Apps (tools/build.py setzt sie ein) =====
   Zeigt alles Abgelegte: Prüfprotokolle und Baustellenberichte (PDFs im Gerätespeicher „evse_protokolle“, den alle Apps teilen),
   fertige Prüfungen aus der Share (wo die App Prüfungen kennt) und Dokumente/Fotos aus den Kundenablagen (Übersicht).
   Suche, Art-Chips, Filter-Fenster (Sortierung, Kunde), Kacheln/Liste als Schieberegler. Zustand je Gerät in META. */
const BB_ART=[["alle","Alle"],["prot","Prüfprotokolle"],["bericht","Baustellenberichte"],["dok","Dokumente"],["foto","Fotos"]];
const BB_IC={prot:"ev",bericht:"baustelle",dok:"doc",foto:"cam"};
const BB_SORT=[["neu","Neueste zuerst"],["alt","Älteste zuerst"],["name","Name A–Z"],["kunde","Kunde A–Z"]];
const BB_P={liste:"M19 13H5c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2zm0 6H5v-4h14v4zm0-16H5c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 6H5V5h14v4z",
  kacheln:"M3 3v8h8V3H3zm6 6H5V5h4v4zm-6 4v8h8v-8H3zm6 6H5v-4h4v4zm4-16v8h8V3h-8zm6 6h-4V5h4v4zm-6 4v8h8v-8h-8zm6 6h-4v-4h4v4z",filt:"M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"};
const bbIc=k=>BB_P[k]?`<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="${BB_P[k]}"/></svg>`:icon(k);
let BB_PROT=[], bbGeladen=false;
async function bbLaden(){
  try{ const d=await new Promise((res,rej)=>{ const r=indexedDB.open("evse_protokolle"); r.onupgradeneeded=()=>{ const x=r.result; if(!x.objectStoreNames.contains("meta")) x.createObjectStore("meta",{keyPath:"id"}); if(!x.objectStoreNames.contains("blob")) x.createObjectStore("blob"); }; r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error); });
    BB_PROT=d.objectStoreNames.contains("meta")?await new Promise(res=>{ const q=d.transaction("meta").objectStore("meta").getAll(); q.onsuccess=()=>res(q.result||[]); q.onerror=()=>res([]); }):[]; d.close(); }catch(e){ BB_PROT=[]; }
  bbGeladen=true; if(nav.v==="bibliothek"){ const r=document.getElementById("res"); if(r) r.innerHTML=bibListe(); else render(); }
}
const bbW=k=>{ const s=(META.bb||{})[k]; return s||{sort:"neu",art:"alle",kunde:"alle"}[k]; };
const bbSet=(k,v)=>{ META.bb=Object.assign({},META.bb||{},{[k]:v}); metaSave(); const r=document.getElementById("res"); if(r) r.innerHTML=bibListe(); const f=document.querySelector(".bb-f"); if(f) f.classList.toggle("an",bbAktiv()); };
const bbAktiv=()=>bbW("sort")!=="neu"||bbW("kunde")!=="alle";
const bbAnsicht=()=>META.bibAnsicht==="kacheln"?"kacheln":"liste";
const bbKunde=id=>{ const k=id&&typeof kundeOf==="function"?kundeOf(id):(id&&DB.kunden?DB.kunden.get(id):null); return k&&!k.deleted?k:null; };
const bbDatum=d=>d?String(d).split("-").reverse().join("."):"";
function bbEintraege(){
  const L=[], kn=id=>(bbKunde(id)||{}).name||"", lokal=new Set(BB_PROT.map(x=>x.pruefungId).filter(Boolean));
  BB_PROT.filter(x=>!x.demo).forEach(x=>L.push({art:x.app==="baustelle"?"bericht":"prot",titel:x.titel||x.name,kundeId:x.kundeId||"",kunde:kn(x.kundeId),t:x.created||0,
    info:[x.app==="baustelle"?"Baustelle":"EVSE",x.art,bbDatum(x.datum),x.auftragsnr&&`Auftrag ${x.auftragsnr}`,x.von&&x.von.name].filter(Boolean).join(" · "),
    pill:x.ergebnis?pill(x.ergebnis,x.ergebnis==="bad"?"nicht bestanden":"bestanden"):"",ziel:`data-act="bbOeffnen" data-id="${esc(x.id)}"`}));
  if(DB.pruefungen) [...DB.pruefungen.values()].filter(p=>!p.deleted&&p.pdfAblage&&!lokal.has(p.id)&&(!p.demo||(typeof demoAn==="function"&&demoAn()))).forEach(p=>{
    const s=p.standortId&&DB.standorte?DB.standorte.get(p.standortId):null;
    L.push({art:"prot",titel:[kn(p.kundeId),s&&s.name].filter(Boolean).join(" › ")||"Prüfung",kundeId:p.kundeId||"",kunde:kn(p.kundeId),t:p.updated||0,
      info:["EVSE",p.p&&p.p.art,p.p&&bbDatum(p.p.datum),"PDF in der Share"].filter(Boolean).join(" · "),pill:"",
      ziel:typeof pMenu==="function"?`data-act="open" data-id="${esc(p.id)}"`:`data-href="../evse/"`}); });
  if(DB.dateien) [...DB.dateien.values()].filter(d=>!d.deleted).forEach(d=>{ const st=d.bezugKind==="standorte"&&DB.standorte?DB.standorte.get(d.bezugId):null, k=bbKunde(d.bezugKind==="kunden"?d.bezugId:st&&st.kundeId), bild=/^image\//.test(d.typ||"");
    L.push({art:bild?"foto":"dok",titel:d.name||"Datei",kundeId:k?k.id:"",kunde:k?k.name:"",t:d.created||0,bild:bild?d.id:"",
      info:[k&&k.name,st&&st.name,d.created&&new Date(d.created).toLocaleDateString("de-DE")].filter(Boolean).join(" · "),pill:"",ziel:`data-act="dateiOeffnen" data-id="${esc(d.id)}"`}); });
  return L;
}
function bbGruppe(L,name,item){ const gr=[], b=x=>{ const c=String(x||"").trim().normalize("NFD").replace(/[̀-ͯ]/g,"").charAt(0).toUpperCase(); return /[A-Z]/.test(c)?c:"#"; };
  L.forEach(x=>{ const k=b(name(x)); if(!gr.length||gr[gr.length-1][0]!==k) gr.push([k,[]]); gr[gr.length-1][1].push(x); });
  return gr.map(([k,G])=>`<div class="abc-gr"><div class="abc-b" aria-hidden="true">${k}</div><div class="abc-l">${listOf(G.map(item))}</div></div>`).join(""); }
function bbMonate(L,item){ let h="", m=null, g=[]; const fl=()=>{ if(g.length) h+=`<div class="sec-lbl">${esc(m)}</div>${listOf(g)}`; g=[]; };
  for(const x of L){ const mm=x.t?new Date(x.t).toLocaleDateString("de-DE",{month:"long",year:"numeric"}):"Ohne Datum"; if(mm!==m){ fl(); m=mm; } g.push(item(x)); } fl(); return h; }
function bibListe(){
  if(!bbGeladen){ bbLaden(); return ""; }
  const art=bbW("art"), ku=bbW("kunde"), so=bbW("sort"), q=String(query||"").toLowerCase(), H=v=>String(v||"").toLowerCase().includes(q);
  const A=bbEintraege(), zahl=a=>a==="alle"?A.length:A.filter(x=>x.art===a).length;
  if(!A.length) return `<div class="empty bib-leer">${icon("folder")}<h2>Noch nichts in der Bibliothek</h2><p>Hier landen fertige Prüfprotokolle aus EVSE, Berichte aus Baustelle sowie Dokumente und Fotos aus den Kundenablagen.</p></div>`;
  const chips=`<div class="chips bib-chips">${BB_ART.filter(([a])=>a==="alle"||zahl(a)).map(([a,t])=>`<button class="chip" data-act="bbArt" data-v="${a}" aria-pressed="${art===a}">${esc(t)}<span class="chip-n">${zahl(a)}</span></button>`).join("")}</div>`;
  const L=A.filter(x=>(art==="alle"||x.art===art)&&(ku==="alle"||x.kundeId===ku)&&(!q||H(x.titel)||H(x.kunde)||H(x.info)));
  L.sort(so==="alt"?(a,b)=>a.t-b.t:so==="name"?(a,b)=>String(a.titel).localeCompare(String(b.titel),"de",{numeric:true}):so==="kunde"?(a,b)=>String(a.kunde||"~").localeCompare(String(b.kunde||"~"),"de")||b.t-a.t:(a,b)=>b.t-a.t);
  const info=bbAktiv()?`<p class="meta f-info">${L.length} ${L.length===1?"Eintrag":"Einträge"}${ku!=="alle"?` · ${esc((bbKunde(ku)||{}).name||"")}`:""} <button class="btn-text inl" data-act="bbReset">Filter aufheben</button></p>`:"";
  if(!L.length) return chips+info+`<div class="empty bib-leer klein">${icon("search")}<h2>Nichts gefunden</h2><p>Andere Suche oder anderen Filter versuchen.</p></div>`;
  const tag=x=>x.ziel.startsWith("data-href")?"a":"div", attr=x=>x.ziel.startsWith("data-href")?`href="${x.ziel.slice(11,-1)}" style="text-decoration:none;color:inherit"`:`role="button" tabindex="0" ${x.ziel}`;
  const zeile=x=>`<${tag(x)} class="li" ${attr(x)}>${x.bild?`<span class="av bib-thumb"><img data-datei="${esc(x.bild)}" alt=""></span>`:`<span class="av">${icon(BB_IC[x.art])}</span>`}
    <span class="lt"><span class="h">${esc(x.titel)}</span><span class="s">${esc(x.info)}</span>${x.pill?`<span class="st">${x.pill}</span>`:""}</span>${icon("chev")}</${tag(x)}>`;
  const kachel=x=>`<${tag(x)} class="bib-k" ${attr(x)}><span class="bib-kb${x.bild?" foto":""}">${x.bild?`<img data-datei="${esc(x.bild)}" alt="">`:icon(BB_IC[x.art])}</span>
    <span class="bib-kt"><b>${esc(x.titel)}</b><small>${esc(x.info)}</small>${x.pill?`<span class="st">${x.pill}</span>`:""}</span></${tag(x)}>`;
  setTimeout(()=>{ if(typeof bilderFuellen==="function") bilderFuellen(); },0);
  const inhalt=bbAnsicht()==="kacheln"?`<div class="bib-raster">${L.map(kachel).join("")}</div>`
    :so==="name"?bbGruppe(L,x=>x.titel,zeile):so==="kunde"?bbGruppe(L,x=>x.kunde||"#",zeile):bbMonate(L,zeile);
  return chips+info+inhalt;
}
function bibliothekView(){
  const k=bbAnsicht()==="kacheln"; if(bbGeladen) setTimeout(bbLaden,0); /* neu abgelegte PDFs sofort zeigen */
  return `<div class="narrow"><div class="bib-kopf"><div class="search mit-f">${icon("search")}<input id="q" type="search" placeholder="Name, Kunde, Auftrag oder Prüfer" value="${esc(query||"")}" autocomplete="off" aria-label="Suchen"><button type="button" class="such-f bb-f${bbAktiv()?" an":""}" data-act="bbFilter" aria-label="Filtern und sortieren" title="Filtern und sortieren">${bbIc("filt")}</button></div>
    <div class="seg ans-seg" role="group" aria-label="Ansicht"><button data-act="bbAnsicht" data-v="kacheln" aria-pressed="${k}" title="Kacheln">${bbIc("kacheln")}</button><button data-act="bbAnsicht" data-v="liste" aria-pressed="${!k}" title="Liste">${bbIc("liste")}</button></div></div>
    <div id="res">${bibListe()}</div></div>`;
}
function bbFilterFenster(btn){
  document.getElementById("fpop")?.remove(); document.getElementById("fpopBg")?.remove();
  const bg=document.createElement("div"); bg.id="fpopBg"; document.body.appendChild(bg); const m=document.createElement("div"); m.id="fpop"; m.className="fpop";
  const K=[...new Map(bbEintraege().filter(x=>x.kundeId).map(x=>[x.kundeId,x.kunde])).entries()].sort((a,b)=>a[1].localeCompare(b[1],"de"));
  const male=()=>{ m.innerHTML=`<div class="fp-t">Sortieren</div><div class="fp-sort">${BB_SORT.map(([v,t])=>`<button type="button" class="fp-i${bbW("sort")===v?" an":""}" data-bk="sort" data-bv="${v}">${esc(t)}</button>`).join("")}</div>`
    +(K.length?`<div class="fp-t">Kunde</div><div class="fp-chips">${[["alle","Alle Kunden"],...K].map(([v,t])=>`<button type="button" class="fp-c${bbW("kunde")===v?" an":""}" data-bk="kunde" data-bv="${esc(v)}">${esc(t)}</button>`).join("")}</div>`:"")
    +(bbAktiv()?`<div class="fp-f"><button type="button" class="btn-text" data-breset="1">Zurücksetzen</button></div>`:""); };
  male(); document.body.appendChild(m);
  const r=btn.getBoundingClientRect(), w=Math.min(340,innerWidth-16); m.style.width=w+"px"; m.style.left=Math.max(8,Math.min(r.right-w,innerWidth-w-8))+"px"; m.style.top=(r.bottom+8)+"px"; m.style.maxHeight=(innerHeight-r.bottom-24)+"px";
  m.addEventListener("click",e=>{ const a=e.target.closest("[data-bk]"); if(a){ bbSet(a.dataset.bk,a.dataset.bv); male(); return; } if(e.target.closest("[data-breset]")){ bbSet("sort","neu"); bbSet("kunde","alle"); male(); } });
  const zu=()=>{ m.remove(); bg.remove(); removeEventListener("resize",zu); }; bg.addEventListener("click",zu); addEventListener("resize",zu);
}
async function bbOeffnen(id){
  if(typeof pvOeffnen==="function"&&typeof PROT!=="undefined"&&PROT.some(x=>x.id===id)) return pvOeffnen(id);
  if(typeof bibOpen==="function"&&typeof PROT!=="undefined"&&PROT.some(x=>x.id===id)) return bibOpen(id);
  try{ const d=await new Promise((res,rej)=>{ const r=indexedDB.open("evse_protokolle"); r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error); });
    const b=await new Promise(res=>{ const q=d.transaction("blob").objectStore("blob").get(id); q.onsuccess=()=>res(q.result); q.onerror=()=>res(null); }); d.close();
    if(!b){ toast("PDF nicht gefunden"); return; } window.open(URL.createObjectURL(b),"_blank","noopener"); }catch(e){ toast("PDF nicht gefunden"); }
}
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act^="bb"]'); if(!b) return; e.stopPropagation(); e.preventDefault(); const a=b.dataset.act;
  if(a==="bbArt") bbSet("art",b.dataset.v);
  else if(a==="bbAnsicht"){ if(bbAnsicht()!==b.dataset.v){ META.bibAnsicht=b.dataset.v; metaSave(); render(); } }
  else if(a==="bbFilter") bbFilterFenster(b);
  else if(a==="bbReset"){ bbSet("sort","neu"); bbSet("kunde","alle"); }
  else if(a==="bbOeffnen") bbOeffnen(b.dataset.id);
},true);
document.addEventListener("keydown",e=>{ if(e.key==="Enter"&&e.target.matches&&e.target.matches('#app [data-act="bbOeffnen"]')){ e.preventDefault(); bbOeffnen(e.target.dataset.id); } });
document.addEventListener("input",e=>{ if(e.target&&e.target.id==="q"&&typeof nav!=="undefined"&&nav.v==="bibliothek"){ query=e.target.value; const r=document.getElementById("res"); if(r) r.innerHTML=bibListe(); } });
document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="visible"&&bbGeladen) bbLaden(); });
