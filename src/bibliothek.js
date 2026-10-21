/* ===== Bibliothek – gemeinsam für alle Apps (tools/build.py setzt sie ein) =====
   Zeigt alles Abgelegte: Prüfprotokolle und Baustellenberichte (PDFs im Gerätespeicher „evse_protokolle“, den alle Apps teilen),
   fertige Prüfungen aus der Share (wo die App Prüfungen kennt) und Dokumente/Fotos aus den Kundenablagen (Übersicht).
   Suche, Art-Chips, Filter-Fenster (Sortierung, Kunde), Kacheln/Liste als Schieberegler. Zustand je Gerät in META. */
const BB_ART=[["alle","Alle"],["prot","Prüfprotokolle"],["bericht","Baustellenberichte"],["dok","Dokumente"],["foto","Fotos"]];
const BB_IC={prot:"ev",bericht:"baustelle",dok:"doc",foto:"cam"};
const BB_SORT=[["neu","Neueste zuerst"],["alt","Älteste zuerst"],["name","Name A–Z"],["kunde","Kunde A–Z"]];
const BB_P={liste:"M19 13H5c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2zm0 6H5v-4h14v4zm0-16H5c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 6H5V5h14v4z",
  ordner:"M9.17 6l2 2H20v10H4V6h5.17M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z",
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
const bbAnsicht=()=>["kacheln","ordner"].includes(META.bibAnsicht)?META.bibAnsicht:"liste";
const bbKunde=id=>{ const k=id&&typeof kundeOf==="function"?kundeOf(id):(id&&DB.kunden?DB.kunden.get(id):null); return k&&!k.deleted?k:null; };
const bbDatum=d=>d?String(d).split("-").reverse().join("."):"";
function bbEintraege(){
  const L=[], kn=id=>(bbKunde(id)||{}).name||"", lokal=new Set(BB_PROT.map(x=>x.pruefungId).filter(Boolean));
  BB_PROT.filter(x=>!x.demo).forEach(x=>L.push({art:x.app==="baustelle"?"bericht":"prot",titel:x.titel||x.name,kundeId:x.kundeId||"",kunde:kn(x.kundeId),t:x.created||0,st:x.standortId||"",bs:x.baustelleId||"",bsName:x.baustelleId?String(x.titel||"").split(" · ").pop():"",
    info:[x.app==="baustelle"?"Baustelle":"EVSE",x.art,bbDatum(x.datum),x.auftragsnr&&`Auftrag ${x.auftragsnr}`,x.von&&x.von.name].filter(Boolean).join(" · "),
    pill:x.ergebnis?pill(x.ergebnis,x.ergebnis==="bad"?"nicht bestanden":"bestanden"):"",ziel:`data-act="bbOeffnen" data-id="${esc(x.id)}"`}));
  if(DB.pruefungen) [...DB.pruefungen.values()].filter(p=>!p.deleted&&p.pdfAblage&&!lokal.has(p.id)&&(!p.demo||(typeof demoAn==="function"&&demoAn()))).forEach(p=>{
    const s=p.standortId&&DB.standorte?DB.standorte.get(p.standortId):null;
    L.push({art:"prot",titel:[kn(p.kundeId),s&&s.name].filter(Boolean).join(" › ")||"Prüfung",kundeId:p.kundeId||"",kunde:kn(p.kundeId),t:p.updated||0,st:p.standortId||"",
      info:["EVSE",p.p&&p.p.art,p.p&&bbDatum(p.p.datum),"PDF in der Share"].filter(Boolean).join(" · "),pill:"",
      ziel:`data-act="bbShare" data-id="${esc(p.id)}"`}); });
  if(DB.dateien) [...DB.dateien.values()].filter(d=>!d.deleted).forEach(d=>{ const st=d.bezugKind==="standorte"&&DB.standorte?DB.standorte.get(d.bezugId):null, vg=d.bezugKind==="vorgaenge"&&DB.vorgaenge?DB.vorgaenge.get(d.bezugId):null, k=bbKunde(d.bezugKind==="kunden"?d.bezugId:st?st.kundeId:vg&&vg.kundeId), bild=/^image\//.test(d.typ||"");
    L.push({art:bild?"foto":"dok",titel:d.name||"Datei",kundeId:k?k.id:"",kunde:k?k.name:"",t:d.created||0,bild:bild?d.id:"",st:st?st.id:"",
      info:[k&&k.name,st&&st.name,d.created&&new Date(d.created).toLocaleDateString("de-DE")].filter(Boolean).join(" · "),pill:"",ziel:`data-act="dateiOeffnen" data-id="${esc(d.id)}"`}); });
  return L;
}
function bbGruppe(L,name,item){ const gr=[], b=x=>{ const c=String(x||"").trim().normalize("NFD").replace(/[̀-ͯ]/g,"").charAt(0).toUpperCase(); return /[A-Z]/.test(c)?c:"#"; };
  L.forEach(x=>{ const k=b(name(x)); if(!gr.length||gr[gr.length-1][0]!==k) gr.push([k,[]]); gr[gr.length-1][1].push(x); });
  return gr.map(([k,G])=>`<div class="abc-gr"><div class="abc-b" aria-hidden="true">${k}</div><div class="abc-l">${listOf(G.map(item))}</div></div>`).join(""); }
function bbMonate(L,item){ let h="", m=null, g=[]; const fl=()=>{ if(g.length) h+=`<div class="sec-lbl">${esc(m)}</div>${listOf(g)}`; g=[]; };
  for(const x of L){ const mm=x.t?new Date(x.t).toLocaleDateString("de-DE",{month:"long",year:"numeric"}):"Ohne Datum"; if(mm!==m){ fl(); m=mm; } g.push(item(x)); } fl(); return h; }
/* ===== Ordner-Ansicht: automatisch nach Kunde, darin Standorte und Baustellen – niemand muss einsortieren ===== */
let BB_ORT={k:null,u:null};
/* Ordner wie in der Dateien-App/GoodNotes: Farbe und Symbol je Kunde (steht am Kunden, gilt also für alle Geräte und alle im Team) */
const BB_FARBEN=[["papier","Papier","#E2C68C"],["rot","Rot","#E06A60"],["orange","Orange","#EE9F4C"],["gelb","Gelb","#E9C64A"],["gruen","Grün","#6DBB7B"],["tuerkis","Türkis","#4DB6AC"],["blau","Blau","#4FA6D8"],["violett","Violett","#9A80D2"],["rosa","Rosa","#E58FB4"],["grau","Grau","#A3A9B1"]];
const BB_SYM={stern:"M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z",
  blitz:"M7 2v11h3v9l7-12h-4l4-8z",
  wallbox:"M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33 0 1.38 1.12 2.5 2.5 2.5.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V9c0-.69-.28-1.32-.73-1.77zM18 10c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zM8 18v-4.5H6L10 6v5h2l-4 7z",
  haus:"M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",
  firma:"M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z",
  fabrik:"M22 22H2V10l7-3v2l5-2v3h3l1-8h3l1 8v12zM12 9.95l-5 2V10l-3 1.32V20h16v-8h-8V9.95zM11 18h2v-4h-2v4zm-4 0h2v-4H7v4zm10-4h-2v4h2v-4z",
  laden:"M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z",
  apotheke:"M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z",
  schule:"M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z",
  kirche:"M18 12.22V9l-5-2.5V5h2V3h-2V1h-2v2H9v2h2v1.5L6 9v3.22L2 14v8h8v-4c0-1.1.9-2 2-2s2 .9 2 2v4h8v-8l-4-1.78z",
  sonne:"M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z",
  werkzeug:"M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z",
  herz:"M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
  ort:"M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
  baustelle:"M13.78 15.3L19.78 21.3L21.89 19.14L15.89 13.14L13.78 15.3M17.5 10.1C17.11 10.1 16.69 10.05 16.36 9.91L4.97 21.25L2.86 19.14L10.27 11.74L8.5 9.96L7.78 10.66L6.33 9.25V12.11L5.63 12.81L2.11 9.25L2.81 8.55H5.62L4.22 7.14L7.78 3.58C8.95 2.41 10.83 2.41 12 3.58L9.89 5.74L11.3 7.14L10.59 7.85L12.38 9.63L14.2 7.75C14.06 7.42 14 7 14 6.63C14 4.66 15.56 3.11 17.5 3.11C18.09 3.11 18.61 3.25 19.08 3.53L16.41 6.2L17.91 7.7L20.58 5.03C20.86 5.5 21 6 21 6.63C21 8.55 19.45 10.1 17.5 10.1Z"};
const BB_SYM_WAHL=["stern","blitz","wallbox","haus","firma","fabrik","laden","apotheke","schule","kirche","sonne","werkzeug","herz"];
const bbFarbe=f=>(BB_FARBEN.find(x=>x[0]===f)||BB_FARBEN[0])[2];
/* Ordner-Bild: hinten mit Lasche, vorne heller, Symbol eingeprägt */
const bbOrdnerBild=(farbe,sym)=>`<svg class="bb-mappe" viewBox="0 0 120 92" style="--o:${bbFarbe(farbe)}" aria-hidden="true"><path class="ob" d="M4 14a9 9 0 0 1 9-9h27.5a9 9 0 0 1 6.8 3.1L52 13h55a9 9 0 0 1 9 9v57a9 9 0 0 1-9 9H13a9 9 0 0 1-9-9z"/><rect class="of" x="4" y="24" width="112" height="64" rx="10"/><rect class="ol" x="6" y="25" width="108" height="2" rx="1"/>${sym&&BB_SYM[sym]?`<svg x="44" y="40" width="32" height="32" viewBox="0 0 24 24"><path class="os" d="${BB_SYM[sym]}"/></svg>`:""}</svg>`;
function bbStilFenster(btn,kid){
  document.getElementById("fpop")?.remove(); document.getElementById("fpopBg")?.remove();
  const k=DB.kunden&&DB.kunden.get(kid); if(!k) return;
  const bg=document.createElement("div"); bg.id="fpopBg"; document.body.appendChild(bg); const m=document.createElement("div"); m.id="fpop"; m.className="fpop bb-stil";
  const male=()=>{ const o=k.ordner||{};
    m.innerHTML=`<div class="fp-t">Farbe</div><div class="bb-farben">${BB_FARBEN.map(([v,t,c])=>`<button type="button" class="bb-fa" data-sf="${v}" style="--o:${c}" aria-pressed="${(o.farbe||"papier")===v}" aria-label="${t}" title="${t}"></button>`).join("")}</div>
      <div class="fp-t">Symbol</div><div class="bb-syms"><button type="button" class="bb-sy ohne" data-ss="" aria-pressed="${!o.sym}" title="Ohne Symbol">Ohne</button>${BB_SYM_WAHL.map(v=>`<button type="button" class="bb-sy" data-ss="${v}" aria-pressed="${o.sym===v}" title="${v}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${BB_SYM[v]}"/></svg></button>`).join("")}</div>`; };
  male(); document.body.appendChild(m);
  const r=btn.getBoundingClientRect(), w=Math.min(340,innerWidth-16); m.style.width=w+"px"; m.style.left=Math.max(8,Math.min(r.left+r.width/2-w/2,innerWidth-w-8))+"px";
  const unten=innerHeight-r.bottom; if(unten>330){ m.style.top=(r.bottom+8)+"px"; } else { m.style.bottom=(innerHeight-r.top+8)+"px"; }
  m.addEventListener("click",e=>{ const f=e.target.closest("[data-sf]"), y=e.target.closest("[data-ss]"); if(!f&&!y) return;
    const o=Object.assign({},k.ordner||{}); if(f) o.farbe=f.dataset.sf; if(y) o.sym=y.dataset.ss; if(o.farbe==="papier") delete o.farbe; if(!o.sym) delete o.sym;
    k.ordner=Object.keys(o).length?o:undefined; if(!k.ordner) delete k.ordner; saveRec("kunden",k); male(); const rs=document.getElementById("res"); if(rs) rs.innerHTML=bibListe(); });
  const zu=()=>{ m.remove(); bg.remove(); removeEventListener("resize",zu); }; bg.addEventListener("click",zu); addEventListener("resize",zu);
}
const BB_OHNE="_ohne";
function bbOrdner(L,zeile){
  const kn=id=>id===BB_OHNE?"Ohne Kunde":(bbKunde(id)||{}).name||"Unbekannter Kunde", kk=x=>x.kundeId||BB_OHNE;
  const tag=t=>t?new Date(t).toLocaleDateString("de-DE"):"";
  const mappe=(attrs,name,art,G,stil,menuK)=>{ const t=Math.max(0,...G.map(x=>x.t||0));
    return `<div class="bb-m"><button class="bb-mk" data-act="bbOrdner" ${attrs} aria-label="${esc(name)} öffnen">${bbOrdnerBild(stil.farbe,stil.sym)}</button>
      <div class="bb-mn"><button class="bb-mt" data-act="bbOrdner" ${attrs}>${esc(name)}</button>${menuK?`<button class="bb-mm" data-act="bbStil" data-k="${esc(menuK)}" aria-label="Ordner gestalten" title="Farbe und Symbol"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg></button>`:""}</div>
      <small>${esc([art,`${G.length} ${G.length===1?"Datei":"Dateien"}`,t&&tag(t)].filter(Boolean).join(" · "))}</small></div>`; };
  const kStil=k=>{ const r=k!==BB_OHNE&&bbKunde(k); return {stil:(r&&r.ordner)||{},darf:!!(r&&(typeof kdDarf==="function"?kdDarf(r):typeof canEdit==="function"&&canEdit(r)))}; };
  const nach=(a,b)=>a[2].localeCompare(b[2],"de",{numeric:true});
  if(!BB_ORT.k||!L.some(x=>kk(x)===BB_ORT.k)){ BB_ORT={k:null,u:null};
    const M=new Map(); L.forEach(x=>{ const k=kk(x); if(!M.has(k)) M.set(k,[]); M.get(k).push(x); });
    const O=[...M].map(([k,G])=>[k,G,kn(k)]).sort((a,b)=>(a[0]===BB_OHNE)-(b[0]===BB_OHNE)||nach(a,b));
    return `<div class="bb-oraster">${O.map(([k,G,n])=>{ const S=kStil(k); return mappe(`data-k="${esc(k)}"`,n,"",G,S.stil,S.darf&&k); }).join("")}</div>`; }
  const K=L.filter(x=>kk(x)===BB_ORT.k), uKey=x=>x.bs?"b:"+x.bs:x.st?"s:"+x.st:"", U=new Map();
  K.forEach(x=>{ const u=uKey(x); if(!u) return; if(!U.has(u)) U.set(u,[]); U.get(u).push(x); });
  const uName=u=>{ const id=u.slice(2); if(u[0]==="b"){ const b=typeof DB!=="undefined"&&DB.baustellen&&DB.baustellen.get(id); return (b&&b.name)||(K.find(x=>x.bs===id)||{}).bsName||"Baustelle"; }
    const s=DB.standorte&&DB.standorte.get(id); return (s&&s.name)||"Standort"; };
  if(BB_ORT.u&&!U.has(BB_ORT.u)) BB_ORT.u=null;
  const pfad=`<nav class="bb-pfad" aria-label="Ordnerpfad"><button class="bb-zur" data-act="bbOrdner" data-k="${BB_ORT.u?esc(BB_ORT.k):""}" aria-label="Zurück" title="Zurück">${icon("chev")}</button>
    <button class="bb-pt" data-act="bbOrdner" data-k="">Alle Kunden</button><span class="bb-ps">›</span>${BB_ORT.u?`<button class="bb-pt" data-act="bbOrdner" data-k="${esc(BB_ORT.k)}">${esc(kn(BB_ORT.k))}</button><span class="bb-ps">›</span><b>${esc(uName(BB_ORT.u))}</b>`:`<b>${esc(kn(BB_ORT.k))}</b>`}</nav>`;
  if(BB_ORT.u) return pfad+listOf(U.get(BB_ORT.u).map(zeile));
  const lose=K.filter(x=>!uKey(x)), O=[...U].map(([u,G])=>[u,G,uName(u)]).sort((a,b)=>(a[0][0]>b[0][0]?1:a[0][0]<b[0][0]?-1:0)||nach(a,b));
  return pfad+(O.length?`<div class="bb-oraster">${O.map(([u,G,n])=>mappe(`data-k="${esc(BB_ORT.k)}" data-u="${esc(u)}"`,n,u[0]==="b"?"Baustelle":"Standort",G,{farbe:(kStil(BB_ORT.k).stil.farbe),sym:u[0]==="b"?"baustelle":"ort"},null)).join("")}</div>`:"")
    +(lose.length?(O.length?`<div class="sec-lbl">Direkt beim Kunden</div>`:"")+listOf(lose.map(zeile)):"");
}
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
  const pid=x=>{ const m=/data-act="bbOeffnen" data-id="([^"]+)"/.exec(x.ziel); return m?m[1]:""; };
  const kachel=x=>`<${tag(x)} class="bib-k" ${attr(x)}><span class="bib-kb${x.bild?" foto":""}${pid(x)?" pdf":""}" ${pid(x)?`data-pdf="${esc(pid(x))}"`:""}>${x.bild?`<img data-datei="${esc(x.bild)}" alt="">`:BB_VORSCHAU.get(pid(x))?`<img src="${BB_VORSCHAU.get(pid(x))}" alt="">`:icon(BB_IC[x.art])}</span>
    <span class="bib-kt"><b>${esc(x.titel)}</b><small>${esc(x.info)}</small>${x.pill?`<span class="st">${x.pill}</span>`:""}</span></${tag(x)}>`;
  setTimeout(()=>{ if(typeof bilderFuellen==="function") bilderFuellen(); bbVorschauen(); },0);
  if(bbAnsicht()==="ordner"&&!q) return chips+info+bbOrdner(L,zeile);
  const inhalt=bbAnsicht()==="kacheln"?`<div class="bib-raster">${L.map(kachel).join("")}</div>`
    :so==="name"?bbGruppe(L,x=>x.titel,zeile):so==="kunde"?bbGruppe(L,x=>x.kunde||"#",zeile):bbMonate(L,zeile);
  return chips+info+inhalt;
}
function bibliothekView(){
  const an=bbAnsicht(), k=an==="kacheln"; if(bbGeladen) setTimeout(bbLaden,0); /* neu abgelegte PDFs sofort zeigen */
  return `<div class="narrow"><div class="bib-kopf"><div class="search mit-f">${icon("search")}<input id="q" type="search" placeholder="Name, Kunde, Auftrag" value="${esc(query||"")}" autocomplete="off" aria-label="Suchen"><button type="button" class="such-f bb-f${bbAktiv()?" an":""}" data-act="bbFilter" aria-label="Filtern und sortieren" title="Filtern und sortieren">${bbIc("filt")}</button></div>
    <div class="seg ans-seg" role="group" aria-label="Ansicht"><button data-act="bbAnsicht" data-v="ordner" aria-pressed="${an==="ordner"}" title="Ordner nach Kunde">${bbIc("ordner")}</button><button data-act="bbAnsicht" data-v="kacheln" aria-pressed="${k}" title="Kacheln">${bbIc("kacheln")}</button><button data-act="bbAnsicht" data-v="liste" aria-pressed="${an==="liste"}" title="Liste">${bbIc("liste")}</button></div></div>
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
/* ===== Vorschaubilder: erste Seite der PDFs, klein gerendert (pdf.js) und für die Sitzung gemerkt ===== */
const BB_VORSCHAU=new Map(); let bbVorLaeuft=false;
async function bbBlob(id){ const d=await new Promise((res,rej)=>{ const r=indexedDB.open("evse_protokolle"); r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error); });
  const b=await new Promise(res=>{ const q=d.transaction("blob").objectStore("blob").get(id); q.onsuccess=()=>res(q.result); q.onerror=()=>res(null); }); d.close(); return b; }
async function bbVorschauen(){
  if(bbVorLaeuft||typeof pdfjsLaden!=="function") return; bbVorLaeuft=true;
  try{ for(const el of [...document.querySelectorAll(".bib-kb.pdf[data-pdf]")]){ const id=el.dataset.pdf; if(BB_VORSCHAU.has(id)){ if(!el.querySelector("img")) el.innerHTML=`<img src="${BB_VORSCHAU.get(id)}" alt="">`; continue; }
      try{ const [lib,b]=await Promise.all([pdfjsLaden(),bbBlob(id)]); if(!b) { BB_VORSCHAU.set(id,""); continue; }
        const doc=await lib.getDocument({data:new Uint8Array(await b.arrayBuffer())}).promise, pg=await doc.getPage(1), v0=pg.getViewport({scale:1}), sc=Math.min(2,420/v0.width), v=pg.getViewport({scale:sc});
        const c=document.createElement("canvas"); c.width=Math.round(v.width); c.height=Math.round(v.height); const x=c.getContext("2d"); x.fillStyle="#fff"; x.fillRect(0,0,c.width,c.height);
        await pg.render({canvasContext:x,viewport:v}).promise; const u=c.toDataURL("image/jpeg",.78); BB_VORSCHAU.set(id,u); try{ doc.destroy(); }catch(_){}
        document.querySelectorAll(`.bib-kb[data-pdf="${CSS.escape(id)}"]`).forEach(k=>k.innerHTML=`<img src="${u}" alt="">`); }
      catch(e){ BB_VORSCHAU.set(id,""); } } }
  finally{ bbVorLaeuft=false; }
}
/* ===== PDF aus der Share holen (Prüfung von einem anderen Gerät) – danach liegt es auch hier und öffnet sofort ===== */
async function bbShare(pid){
  const p=DB.pruefungen&&DB.pruefungen.get(pid); if(!p) return;
  if(p.demo){ toast("Beispiel aus der Demo-Vorschau – dazu gibt es kein echtes PDF"); return; }
  const da=BB_PROT.find(x=>x.pruefungId===pid); if(da) return bbOeffnen(da.id);
  if(!(typeof SYNC_ON!=="undefined"&&SYNC_ON&&typeof folderId==="function"&&typeof BIB!=="undefined"&&BIB.pdf)){ toast("PDF liegt in der Share – dafür bitte anmelden"); return; }
  toast("PDF wird geladen …");
  try{ const pa=String(p.pdfAblage), i=pa.lastIndexOf("/"), dir=i>0?pa.slice(0,i):"", file=pa.slice(i+1);
    await syncRoot(); const fid=await folderId(dir,BIB.pdf); const it=await gj(`/drives/${fid}:/${encodeURIComponent(file)}`); const blob=await (await readItem(it)).blob();
    const k=bbKunde(p.kundeId), s=p.standortId&&DB.standorte?DB.standorte.get(p.standortId):null;
    const x={id:"share-"+p.id,pruefungId:p.id,kundeId:p.kundeId||"",standortId:p.standortId||"",name:file.replace(/\.pdf$/i,""),titel:[k&&k.name,s&&s.name].filter(Boolean).join(" · ")||file,
      datum:(p.p&&p.p.datum)||"",art:(p.p&&p.p.art)||"",auftragsnr:(p.p&&p.p.auftragsnr)||"",pruefer:(p.p&&p.p.pruefer)||"",created:p.updated||Date.now(),von:p.updatedBy||null,fassung:1,size:blob.size,ausShare:true};
    const d=await new Promise((res,rej)=>{ const r=indexedDB.open("evse_protokolle"); r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error); });
    const tx=d.transaction(["meta","blob"],"readwrite"); tx.objectStore("meta").put(x); tx.objectStore("blob").put(blob,x.id); await new Promise(r=>{ tx.oncomplete=r; tx.onerror=r; }); d.close();
    BB_PROT.push(x); if(typeof PROT!=="undefined"&&!PROT.some(y=>y.id===x.id)) PROT.push(x);
    const r=document.getElementById("res"); if(r) r.innerHTML=bibListe(); bbOeffnen(x.id);
  }catch(e){ toast(navigator.onLine?"PDF in der Share nicht gefunden":"Kein Internet – PDF liegt in der Share"); }
}
async function bbOeffnen(id){
  if(typeof pvOeffnen==="function"&&typeof PROT!=="undefined"&&PROT.some(x=>x.id===id)) return pvOeffnen(id);
  if(typeof PROT!=="undefined"&&!PROT.some(x=>x.id===id)){ const x=BB_PROT.find(y=>y.id===id); if(x) PROT.push(x); }
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
  else if(a==="bbOrdner"){ BB_ORT={k:b.dataset.k||null,u:b.dataset.u||null}; const r=document.getElementById("res"); if(r) r.innerHTML=bibListe(); scrollTo(0,0); }
  else if(a==="bbStil") bbStilFenster(b,b.dataset.k);
  else if(a==="bbOeffnen") bbOeffnen(b.dataset.id);
  else if(a==="bbShare") bbShare(b.dataset.id);
},true);
document.addEventListener("keydown",e=>{ if(e.key==="Enter"&&e.target.matches&&e.target.matches('#app [data-act="bbOeffnen"]')){ e.preventDefault(); bbOeffnen(e.target.dataset.id); } });
document.addEventListener("input",e=>{ if(e.target&&e.target.id==="q"&&typeof nav!=="undefined"&&nav.v==="bibliothek"){ query=e.target.value; const r=document.getElementById("res"); if(r) r.innerHTML=bibListe(); } });
document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="visible"&&bbGeladen) bbLaden(); });
