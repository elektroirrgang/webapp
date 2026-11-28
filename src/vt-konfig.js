/* ===== Konfigurieren am PC (Max 28.11.2026) =====
   Rechte Box ohne Tabs: ohne Auswahl „Einsetzen“ (Katalog), mit Auswahl „Bearbeiten“ bzw. „n ausgewählt“, Übersicht über den Knopf oben.
   Eingesetzt wird an der roten Marke: Klick zwischen zwei Geräte oder auf freien Platz setzt sie, „+ Reihe hinzufügen“ bzw. das Reihenmenü (⋮)
   legt sie in eine neue, leere Reihe (ohne RCD). Leitungsschutz wird ausgewählt statt aus Kacheln gesucht (Hersteller, Serie, B/C, Nennstrom, Pole,
   Anzahl) – das Bild mit dem passenden Aufdruck kommt aus dem Gerätekatalog. Mehrfachauswahl mit Strg/Umschalt, Strg+D dupliziert,
   Strg+C/V kopiert an die Marke, Entf entfernt (zweimal). Eigene Vorlagen und Sondergeräte liegen auf diesem Gerät (META). */
Object.assign(LEG_WS,{ids:[],marke:null,kat:"ls",herst:"",such:"",anz:1,ls:null,sonder:{bez:"",te:1},clip:null});
const KF_KAT=[["vorl","Vorlagen"],["ls","Leitungsschutz"],["rcd","RCD"],["rcbo","FI/LS"],["kl","Klemmen"],["st","Steuern"],["sonder","Sondergerät"]];
const KF_HERST=[["Hager","Hager"],["Schneider Electric","Schneider"],["","Alle"]];
const KF_SER={"Hager":[["S","QuickConnect"],["N","Schraube"]],"Schneider Electric":[["resi","Resi9"],["ic60","iC60N"]]};
const KF_AMP={"Hager":[6,10,13,16,20,25,32,40,50,63],resi:[6,10,13,16,20,25,32,40],ic60:[6,10,13,16,20,25,32,40,50,63]};
/* Hersteller der Automaten-Auswahl: zuletzt benutzt, sonst Hersteller des Verteilers, sonst Hager. Die Listen filtern getrennt davon (Standard: alle). */
const kfHerst=L=>{ const m=typeof META!=="undefined"&&META.kfLs; if(m&&KF_SER[m.h]) return m.h; const h=(L&&L.gerHerst)||"Hager"; return /schneider/i.test(h)?"Schneider Electric":"Hager"; };
function kfLs(L){ let s=LEG_WS.ls;
  if(!s){ const h=kfHerst(L), m=typeof META!=="undefined"&&META.kfLs; s={h,ser:m&&m.h===h&&KF_SER[h].some(x=>x[0]===m.ser)?m.ser:KF_SER[h][0][0],ch:"B",amp:16,pol:1}; LEG_WS.ls=s; }
  if(!KF_SER[s.h].some(x=>x[0]===s.ser)) s.ser=KF_SER[s.h][0][0];
  const A=KF_AMP[s.h==="Hager"?"Hager":s.ser]; if(!A.includes(+s.amp)) s.amp=16; return s; }
const kfPad=n=>String(n).padStart(2,"0");
function kfLsMat(s){ const c=s.ch==="C"?"C":"B";
  if(s.h==="Hager") return `M${c}${s.ser}${s.pol}${kfPad(s.amp)}`;
  return s.ser==="resi"?`R9F2${c==="B"?3:4}${s.pol}${kfPad(s.amp)}`:`A9F0${c==="B"?3:4}${s.pol}${kfPad(s.amp)}`; }
const kfAsset=mat=>typeof gkMatAsset==="function"&&mat?gkMatAsset(mat):null;
const kfImg=(a,kl)=>a?`<img class="${kl||""}" src="${esc(gkBildURL(a))}"${gkAnpAttr(a)} alt="" loading="lazy">`:`<span class="kf-ohne">${icon("tag")}</span>`;
const kfPitch=L=>typeof gkPitch==="function"?gkPitch(L):18;

/* ---- Auswahl ---- */
function kfAuswahl(L){ const E=legE(L), S=new Set(LEG_WS.ids&&LEG_WS.ids.length?LEG_WS.ids:LEG_WS.id?[LEG_WS.id]:[]); return E.filter(e=>S.has(e.id)); }
const kfIstAn=id=>(LEG_WS.ids&&LEG_WS.ids.length?LEG_WS.ids:LEG_WS.id?[LEG_WS.id]:[]).includes(id);
function kfLeeren(){ LEG_WS.id=null; LEG_WS.ids=[]; LEG_WS.weg=null; LEG_WS.tab="ein"; }
function kfKlick(L,id,ev){ const E=legE(L); LEG_WS.weg=null;
  if(ev&&(ev.ctrlKey||ev.metaKey)){ const S=kfAuswahl(L).map(e=>e.id), i=S.indexOf(id); if(i>=0) S.splice(i,1); else S.push(id);
    LEG_WS.ids=S; LEG_WS.id=S.length?(i>=0?S[S.length-1]:id):null; LEG_WS.tab=S.length?"sel":"ein"; }
  else if(ev&&ev.shiftKey&&LEG_WS.id){ const a=E.findIndex(e=>e.id===LEG_WS.id), b=E.findIndex(e=>e.id===id); if(a<0||b<0){ LEG_WS.id=id; LEG_WS.ids=[id]; }
    else LEG_WS.ids=E.slice(Math.min(a,b),Math.max(a,b)+1).filter(e=>e.art!=="gr").map(e=>e.id); LEG_WS.tab="sel"; }
  else { LEG_WS.id=id; LEG_WS.ids=[id]; LEG_WS.tab="sel"; }
  const i=E.findIndex(e=>e.id===(LEG_WS.id||id)); if(i>=0) LEG_WS.marke={nach:Math.max(...kfAuswahl(L).map(e=>E.indexOf(e)),i),neu:false};
  render(); }

/* ---- Marke ---- */
function kfZiel(L){ const E=legE(L), M=LEG_WS.marke; return M?Math.max(0,Math.min(M.nach+1,E.length)):E.length; }
function kfRcdVor(E,i){ for(let j=i;j>=0;j--){ const e=E[j]; if(!e||e.art==="gr") return null; if(e.art==="rcd") return e; if(typeof legIstRcbo==="function"&&legIstRcbo(e)) return null; } return null; }
function kfPosText(L){ const E=legE(L), M=LEG_WS.marke, PL=legPlaetze(L), R=legReihen(L);
  if(M&&M.neu){ const e=E[M.nach]; const r=e&&PL[e.id]?PL[e.id].r:0; return r?`neue Reihe nach Reihe ${r}`:R.length?"neue Reihe vor Reihe 1":"erste Reihe"; }
  const i=kfZiel(L)-1, e=E[i]; if(!e) return E.length?"ganz vorn · Reihe 1":"erste Reihe";
  const r=kfRcdVor(E,i), pl=PL[e.id]; return [`${M?"nach":"am Ende, nach"} ${legKzA(e.kz)||legWsName(e)}`,pl?`Reihe ${pl.r}`:"",r?`an RCD ${legKzA(r.kz)||""}`.trim():""].filter(Boolean).join(" · "); }

/* ---- Einsetzen an der Marke: Kennzeichnung läuft weiter wie im Bestücken, neue Reihe beginnt mit Umbruch ---- */
function kfKz(L,art,pos){ if(typeof awKz!=="function") return ""; const alt=AW; AW={nach:pos}; try{ return awKz(L,art==="rcd"?"rcd":"sk").kz; } finally{ AW=alt; } }
function kfRein(L,teile,text){ if(!L||L.fertig||!teile.length) return; const E=legE(L), M=LEG_WS.marke, neu=!!(M&&M.neu); let i=kfZiel(L);
  const folgend=E[i], start=i, num=legSchemaNum(E);
  teile.forEach((t,k)=>{ const e={...gkClone(t),id:uid()}; delete e.umbruch; const kb=e.kb; delete e.kb;
    if(e.art==="rcd") e.kz=num?"":kfKz(L,"rcd",i-1);
    else if(e.art==="sk"||e.art==="res") e.kz=num?"":kfKz(L,"sk",i-1);
    else if(e.art==="ge"&&!e.kz){ const p=kb||"K", n=E.filter(x=>x.art==="ge"&&new RegExp("^-?"+p+"\\s*\\d").test(x.kz||"")).length; e.kz=`${p}${n+1}`; }
    else if(e.kz==null) e.kz="";
    if(k===0&&neu&&i>0) e.umbruch=true; E.splice(i,0,e); i++; });
  if(neu&&folgend&&E[i]===folgend) folgend.umbruch=true;
  LEG_WS.marke={nach:i-1,neu:false}; LEG_WS.anz=1; legSpeichern(L);
  const a=legE(L)[start], z=legE(L)[i-1]; toast(`${text||(teile.length+" eingesetzt")}${a&&a.kz?` · ${legKzA(a.kz)}${z!==a&&z.kz?" bis "+legKzA(z.kz):""}`:""}`);
  render(); }
const kfMal=(t,n)=>Array.from({length:Math.max(1,Math.min(24,n|0||1))},()=>gkClone(t));
/* Zuletzt benutzt (je Gerät) */
const KF_LETZT="irrgang_kf_letzt";
function kfLetzt(){ try{ return JSON.parse(localStorage.getItem(KF_LETZT)||"[]"); }catch(e){ return []; } }
function kfMerken(o){ try{ const A=kfLetzt().filter(x=>x.t!==o.t); A.unshift(o); localStorage.setItem(KF_LETZT,JSON.stringify(A.slice(0,6))); }catch(e){} }

/* ---- Teile aus Materialliste und Katalog ---- */
function kfMatTeil(m){ const t=matTech(m), hnr=matHnr(m.herstellerNr);
  if(t.art==="ge") return {art:"ge",bez:t.name,schutz:"",pole:1,te:t.te,mat:hnr,kb:t.kb||"K"};
  if(t.art==="rcd") return {art:"rcd",bez:"Fehlerstromschutzschalter",schutz:awSchutz(t),pole:1,te:t.te,mat:hnr};
  return {art:"sk",bez:"?",schutz:awSchutz(t),pole:+t.pole===3?3:1,te:t.te,mat:hnr}; }
async function kfKatTeil(a,L){ const T=gkTechnik(a), te=Math.round(a.dimension.width/kfPitch(L)*100)/100;
  if(a.article&&kfAsset(a.article)) return {art:T.art,bez:T.art==="ge"?a.model:T.art==="rcd"?"Fehlerstromschutzschalter":"?",schutz:T.schutz,pole:T.pole,te,mat:a.article};
  const data=await gkData(a), p=gkPayload(a,data), e=gkEintrag(a,p,L); delete e.id; delete e.kz; return e; }
const kfMatName=m=>{ const t=matTech(m); return t.art==="ge"?t.name:awName(t); };
function kfZeile(q,bild,t,s,te,extra){ return `<div class="kf-li"><span class="kf-th">${bild}</span><span class="kf-lt"><b>${esc(t)}</b><small>${esc(s||"")}</small></span>${te?`<em>${esc(te)}</em>`:""}${extra||""}<button type="button" class="kf-plus" data-act="kfAdd" data-q="${esc(q)}" title="${LEG_WS.anz>1?LEG_WS.anz+" × einsetzen":"Einsetzen"}">${icon("add")}</button></div>`; }
const kfMatZeile=m=>{ const t=matTech(m), hnr=matHnr(m.herstellerNr); return kfZeile("m:"+hnr,kfImg(kfAsset(hnr)),kfMatName(m),`${awHerstKurz(m.hersteller)} ${m.herstellerNr}`,`${gkZahl(+t.te||1)} TE`); };
const kfKatZeile=(a,L)=>kfZeile("k:"+a.id,kfImg(a),a.model,`${awHerstKurz(a.manufacturer)}${a.article?" · "+a.article:""}`,gkTeText(a.dimension.width,L));
function kfMatListe(art,herst){ return awGeraete().filter(m=>{ const t=matTech(m); return t&&t.art===art&&(!herst||m.hersteller===herst); })
  .sort((a,b)=>{ const x=matTech(a), y=matTech(b); return (x.pole||0)-(y.pole||0)||String(x.char||"").localeCompare(String(y.char||""))||(+x.in||0)-(+y.in||0)||(+x.idn||0)-(+y.idn||0); }); }
function kfKatListe(re,herst,ohne,lim){ return GK_INDEX.filter(a=>!a.isExampleAssembly&&re.test(a.category)&&(!herst||a.manufacturer===herst)&&!(a.article&&ohne.has(gkNorm(a.article)))).slice(0,lim||40); }

/* ---- Vorlagen ---- */
function kfFestVorlagen(L){ const s=kfLs(L), lsT=(amp,pol)=>({art:"sk",bez:"?",schutz:`B${amp}`,pole:pol,te:pol,mat:kfLsMat({...s,ch:"B",amp,pol})});
  const {rcd}=typeof awReiheGeraete==="function"?awReiheGeraete(L):{}, r=rcd?kfMatTeil(rcd):{art:"rcd",bez:"Fehlerstromschutzschalter",schutz:"40 A / 30 mA Typ A",pole:1,te:4};
  const kl=f=>({art:"kl",farbe:f,bez:f==="pe"?"PE 14-S":"N 14-S",schutz:"",pole:1,te:1});
  return [["RCD + 6 × B16 + N/PE",`RCD ${r.schutz||""} · 6 × LS B16 · N 14-S · PE 14-S`,[r,...kfMal(lsT(16,1),6),kl("n"),kl("pe")],[["rcd"],["ls",6],["kl","n"],["kl","pe"]]],
    ["RCD + 8 × B16",`RCD ${r.schutz||""} · 8 × LS B16`,[r,...kfMal(lsT(16,1),8)],[["rcd"],["ls",8]]],
    ["6 × B16 + N/PE","ohne RCD",[...kfMal(lsT(16,1),6),kl("n"),kl("pe")],[["ls",6],["kl","n"],["kl","pe"]]],
    ["Herd","LS B16 3-polig",[lsT(16,3)],[["ls",3]]],
    ["Klemmen N + PE","Pollmann N 14-S + PE 14-S",[kl("n"),kl("pe")],[["kl","n"],["kl","pe"]]]]; }
const kfEigene=()=>(typeof META!=="undefined"&&Array.isArray(META.kfVorlagen))?META.kfVorlagen:[];
function kfVorlageTeile(E){ return E.filter(e=>e.art!=="gr").map(e=>{ const t=gkClone(e); delete t.id; delete t.kz; delete t.umbruch; delete t.klemmenProjekt; if(t.art==="sk") t.bez="?"; return t; }); }
function kfVorlageSkizze(teile){ return teile.map(t=>t.art==="rcd"?["rcd"]:t.art==="kl"?["kl",t.farbe||"n"]:["ls",1]); }
function kfVorlageDlg(teile,vorschlag){ if(!teile.length) return; LEG_WS._vorl=teile;
  dialog("Als Vorlage speichern",`<label class="field"><span>Name</span><input id="f_kfVName" value="${esc(vorschlag||"")}" placeholder="z. B. Bad Standard" autocomplete="off"></label><p class="meta" style="margin:10px 4px 0">${teile.length} ${teile.length===1?"Gerät":"Geräte"} · liegt auf diesem Gerät unter „Einsetzen › Vorlagen“.</p>`,
    `<button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="kfVorlOk">Speichern</button>`); }

/* ---- Panel ---- */
function kfPanel(L){ const E=legE(L), zu=L.fertig; LEG_WS.ids=(LEG_WS.ids||[]).filter(id=>E.some(e=>e.id===id)); if(LEG_WS.id&&!E.some(e=>e.id===LEG_WS.id)) LEG_WS.id=null;
  if(LEG_WS.marke&&LEG_WS.marke.nach>=E.length) LEG_WS.marke=null;
  const A=kfAuswahl(L); let m=LEG_WS.tab; if(m==="sel"&&!A.length) m="ein"; if(m!=="ueb"&&m!=="sel") m="ein"; if(zu&&m==="ein") m=A.length?"sel":"ueb";
  const titel=m==="ein"?"Einsetzen":m==="ueb"?"Übersicht":A.length>1?`${A.length} ausgewählt`:"Bearbeiten";
  const knopf=m==="ein"?`<button type="button" class="kf-ib" data-act="kfUeb" title="Übersicht">${icon("liste")}</button>`:zu&&m==="ueb"?"":`<button type="button" class="kf-ib" data-act="kfZu" title="Zurück zum Einsetzen (Esc)">${icon("close")}</button>`;
  return `<aside class="card leg-ws-r"><div class="card-kopf leg-kopf leg-ws-rk"><h3>${titel}</h3>${knopf}</div>
    <div class="leg-ws-in">${m==="ein"?kfEin(L):m==="ueb"?legWsUeb(L):A.length>1?kfMehr(L,A):legWsSel(L)}</div></aside>`; }
function kfEin(L){ const k=LEG_WS.kat, q=LEG_WS.such.trim(), lsH=kfLs(L).h;
  const chip=(act,v,t,an)=>`<button type="button" data-act="${act}" data-v="${esc(v)}" aria-pressed="${!!an}">${esc(t)}</button>`;
  const ohneHerst=k==="vorl"||k==="kl"||k==="sonder";
  return `<div class="kf-pos"><span class="kf-dot"></span><b>${esc(kfPosText(L))}</b>${LEG_WS.marke?`<button type="button" class="btn-text" data-act="kfEnde">Ans Ende</button>`:`<small>Klick in die Zeichnung</small>`}</div>
    <div class="aw-such kf-such"><span class="aw-lupe">${icon("search")}</span><input id="kfSuch" type="search" data-kf="such" placeholder="Suchen: B16, RCD, EGN, Artikelnummer …" value="${esc(LEG_WS.such)}" autocomplete="off"></div>
    ${q?"":`<div class="kf-chips">${KF_KAT.map(([v,t])=>chip("kfKat",v,t,k===v)).join("")}</div>`}
    ${q||!ohneHerst?`<div class="kf-chips kf-h">${k==="ls"&&!q?KF_HERST.filter(([v])=>v).map(([v,t])=>chip("kfLsH",v,t,lsH===v)).join(""):KF_HERST.map(([v,t])=>chip("kfHerst",v,t,LEG_WS.herst===v)).join("")}</div>`:""}
    ${q?kfSuche(L,q):k==="ls"?kfLsHtml(L):k==="vorl"?kfVorlHtml(L):k==="sonder"?kfSonderHtml(L):kfListeHtml(L,k)}
    ${kfLetztHtml(L)}`; }
function kfAnzHtml(text){ return `<div class="kf-anz"><div class="kf-st"><button type="button" data-act="kfAnz" data-v="-1" title="Weniger">${icon("remove")}</button><b>${LEG_WS.anz}</b><button type="button" data-act="kfAnz" data-v="1" title="Mehr">${icon("add")}</button></div>${text?`<button type="button" class="btn-filled kf-go" data-act="kfLsRein">${esc(text)}</button>`:`<span class="kf-anz-t">${LEG_WS.anz>1?`jedes ＋ setzt ${LEG_WS.anz}× ein`:"Anzahl je ＋"}</span>`}</div>`; }
function kfLsHtml(L){ const s=kfLs(L), mat=kfLsMat(s), a=kfAsset(mat), A=KF_AMP[s.h==="Hager"?"Hager":s.ser];
  const z=(act,v,t,an)=>`<button type="button" data-act="${act}" data-v="${esc(v)}" aria-pressed="${!!an}">${esc(t)}</button>`;
  return `<div class="kf-konf"><button type="button" class="kf-prev" data-act="kfLsBild" title="Bild groß ansehen">${kfImg(a)}</button><div>
      <div class="kf-zt">Serie</div><div class="kf-z">${KF_SER[s.h].map(([v,t])=>z("kfLsSer",v,t,s.ser===v)).join("")}</div>
      <div class="kf-zt">Charakteristik · Pole</div><div class="kf-z">${["B","C"].map(c=>z("kfLsCh",c,c,s.ch===c)).join("")}<span class="kf-sp"></span>${[1,3].map(p=>z("kfLsPol",p,p+"-polig",s.pol===p)).join("")}</div>
      <div class="kf-zt">Nennstrom</div><div class="kf-z kf-amp">${A.map(n=>z("kfLsAmp",n,String(n),+s.amp===n)).join("")}</div>
      <div class="kf-zt kf-art">${esc(mat)}${a?` · ${gkZahl(a.dimension.width)} mm`:" · ohne Katalogbild"}</div></div></div>
    ${kfAnzHtml(`${LEG_WS.anz} × LS ${s.ch}${s.amp}${s.pol===3?" 3-polig":""} einsetzen`)}`; }
function kfListeHtml(L,k){ const herst=LEG_WS.herst; let h="";
  if(k==="kl"){ const kl=f=>{ const a=gkFuerEintrag({art:"kl",farbe:f}); return a?kfImg(a):`<span class="kf-ohne">${icon("tag")}</span>`; };
    return kfAnzHtml()+`<div class="kf-liste">${kfZeile("kl:n",kl("n"),"N-Klemme Pollmann N 14-S","blau · 14 Steck + 1 Schraub","1 TE")+kfZeile("kl:pe",kl("pe"),"PE-Klemme Pollmann PE 14-S","grün · 14 Steck + 1 Schraub","1 TE")+kfZeile("kl:a",kl("a"),"Abzweigklemme Pollmann A 14-S","grau · z. B. für eine Phase","1 TE")+kfZeile("res",`<span class="kf-ohne kf-leer"></span>`,"Leerplatz","unbestückt, ohne Gerät","1 TE")}</div>`; }
  const art=k==="rcd"?"rcd":k==="rcbo"?"rcbo":"ge", M=kfMatListe(art,herst), da=new Set(M.map(m=>gkNorm(matHnr(m.herstellerNr))));
  const re=k==="rcd"?/^Schutz - Fehlerstrom/:k==="rcbo"?/^Schutz - FI-LS/:/^(Steuern|Schalten|Messen|Signalisieren|Versorgen)/;
  const K=kfKatListe(re,herst,da,k==="st"?30:40);
  h+=kfAnzHtml();
  if(M.length) h+=`<div class="lbl leg-ws-lbl">Unsere Materialliste</div><div class="kf-liste">${M.map(kfMatZeile).join("")}</div>`;
  if(K.length) h+=`<div class="lbl leg-ws-lbl">Aus dem Gerätekatalog</div><div class="kf-liste">${K.map(a=>kfKatZeile(a,L)).join("")}</div>${k==="st"?`<p class="meta kf-hint">Mehr über die Suche oben, z. B. „Schütz“, „Zeitschaltuhr“ oder die Artikelnummer.</p>`:""}`;
  if(!M.length&&!K.length) h+=`<p class="meta kf-hint">Hier steht nichts${herst?" von "+esc(awHerstKurz(herst)):""}. Anderen Hersteller wählen oder oben suchen.</p>`;
  return h; }
function kfSuche(L,q){ const herst=LEG_WS.herst, qq=q.toLowerCase(), qn=qq.replace(/\s+/g,"");
  const M=awGeraete().filter(m=>{ const t=matTech(m); if(!t||(herst&&m.hersteller!==herst)) return false; const kurz=t.char?`${t.char}${t.in}`.toLowerCase():""; return kurz===qn||[kfMatName(m),m.herstellerNr,m.name,kurz,m.hersteller].join(" ").toLowerCase().includes(qq); }).slice(0,20);
  const da=new Set(M.map(m=>gkNorm(matHnr(m.herstellerNr)))), K=gkAwListe(q,herst,"").filter(a=>!(a.article&&da.has(gkNorm(a.article)))).slice(0,30);
  /* „B16“, „C20 3p“: passender Leitungsschutz aus der Auswahl oben, auch wenn es kein eigenes Bild gibt */
  const ls=qn.match(/^(?:ls)?([bc])(\d{1,2})(3p|3|-3)?$/);
  let h=kfAnzHtml();
  if(ls){ const s={...kfLs(L),ch:ls[1].toUpperCase(),amp:+ls[2],pol:ls[3]?3:1}, mat=kfLsMat(s); h+=`<div class="lbl leg-ws-lbl">Leitungsschutz</div><div class="kf-liste">${kfZeile("ls:"+JSON.stringify(s),kfImg(kfAsset(mat)),`LS ${s.ch}${s.amp}${s.pol===3?" 3-polig":""}`,`${awHerstKurz(s.h)} ${(KF_SER[s.h].find(x=>x[0]===s.ser)||[])[1]||""} · ${mat}`,`${s.pol} TE`)}</div>`; }
  if(M.length) h+=`<div class="lbl leg-ws-lbl">Unsere Materialliste</div><div class="kf-liste">${M.map(kfMatZeile).join("")}</div>`;
  if(K.length) h+=`<div class="lbl leg-ws-lbl">Gerätekatalog</div><div class="kf-liste">${K.map(a=>kfKatZeile(a,L)).join("")}</div>`;
  if(!ls&&!M.length&&!K.length) h+=`<p class="meta kf-hint">Nichts gefunden. Unter „Sondergerät“ lässt sich ein Gerät frei anlegen.</p>`;
  return h; }
function kfVorlHtml(L){ const F=kfFestVorlagen(L), U=kfEigene();
  const z=(q,t,s,skizze)=>`<div class="kf-vl"><span class="kf-mini">${awReiheSvg(skizze)}</span><span class="kf-lt"><b>${esc(t)}</b><small>${esc(s)}</small></span>${q.startsWith("u:")?`<button type="button" class="kf-ib kf-weg" data-act="kfVorlWeg" data-v="${esc(q.slice(2))}" title="Vorlage löschen">${icon("del")}</button>`:""}<button type="button" class="btn-tonal kf-vb" data-act="kfAdd" data-q="${esc(q)}">Einsetzen</button></div>`;
  return `<div class="lbl leg-ws-lbl">Irrgang-Vorlagen</div>${F.map(([t,s,teile,sk],i)=>z("v:"+i,t,`${s} · ${gkZahl(teile.reduce((n,x)=>n+(+x.te||1),0))} TE`,sk)).join("")}
    <div class="lbl leg-ws-lbl">Eigene Vorlagen</div>${U.length?U.map(v=>z("u:"+v.id,v.name,`${v.teile.length} ${v.teile.length===1?"Gerät":"Geräte"} · ${gkZahl(v.teile.reduce((n,x)=>n+(+x.te||1),0))} TE`,kfVorlageSkizze(v.teile))).join(""):`<p class="meta kf-hint">Geräte in der Zeichnung auswählen (Strg + Klick) und „Als Vorlage“ – oder im Reihenmenü ⋮ „Als Vorlage speichern“.</p>`}`; }
function kfSonderHtml(L){ const S=LEG_WS.sonder;
  return `<p class="meta kf-hint" style="margin-top:0">Erst oben suchen – der Gerätekatalog hat über 2.000 Geräte. Ist es nicht dabei, hier frei anlegen: in der Zeichnung ein neutrales Gerät mit Beschriftung.</p>
    <div class="kf-konf kf-sonder"><span class="kf-prev kf-sb"><span>${esc(S.bez||"Sondergerät")}</span></span><div>
      <label class="leg-wf breit"><small>Bezeichnung</small><input data-kf="sbez" value="${esc(S.bez)}" placeholder="z. B. PV-Wechselrichter Kommunikation" autocomplete="off"></label>
      <div class="kf-zt">Breite</div><div class="kf-z">${[1,2,3,4,6].map(n=>`<button type="button" data-act="kfSTe" data-v="${n}" aria-pressed="${+S.te===n}">${n} TE</button>`).join("")}</div></div></div>
    <div class="kf-anz"><button type="button" class="btn-tonal" data-act="kfSMerk" ${S.bez.trim()?"":"disabled"}>Als Vorlage</button><button type="button" class="btn-filled kf-go" data-act="kfSRein" ${S.bez.trim()?"":"disabled"}>Einsetzen</button></div>`; }
function kfLetztHtml(L){ const A=kfLetzt(); if(!A.length) return "";
  return `<div class="lbl leg-ws-lbl">Zuletzt benutzt</div><div class="kf-liste">${A.slice(0,4).map((o,i)=>kfZeile("z:"+i,kfImg(o.mat?kfAsset(o.mat):o.gk?GK_MAP.get(o.gk):null),o.t,o.s,o.te)).join("")}</div>`; }
/* Mehrere ausgewählt */
function kfMehr(L,A){ const zu=L.fertig, sk=A.filter(e=>e.art==="sk"), S=sk.map(legWsSchutz), gl=k=>{ const v=[...new Set(S.map(x=>x[k]))]; return v.length===1?v[0]:v.length?"gemischt":""; };
  const kzs=A.map(e=>legKzA(e.kz)).filter(Boolean), PL=legPlaetze(L), R=[...new Set(A.map(e=>PL[e.id]&&PL[e.id].r).filter(Boolean))];
  return `<div class="leg-ws-g kf-mg"><span class="leg-ws-b kf-mb">${kfImg(kfFuer(A[0]))}</span><span><b>${esc(kzs.length>6?kzs.slice(0,3).join(" · ")+" … "+kzs[kzs.length-1]:kzs.join(" · ")||A.length+" Geräte")}</b><small>${esc([`${gkZahl(A.reduce((n,e)=>n+legTE(e),0))} TE`,R.length?(R.length===1?"Reihe "+R[0]:"Reihen "+R.join(", ")):"",sk.length?`${sk.length} Stromkreise`:""].filter(Boolean).join(" · "))}</small></span></div>
    ${zu?"":`<div class="leg-ws-ak"><button type="button" data-act="kfDupl">${icon("copy")}<span>Duplizieren</span><kbd>Strg D</kbd></button><button type="button" data-act="kfAlsVorl">${icon("pin")}<span>Als Vorlage</span></button></div>
    <div class="leg-ws-ak"><button type="button" data-act="kfZug" data-d="-1">${icon("back")}<span>Nach vorn</span></button><button type="button" data-act="kfZug" data-d="1"><span>Nach hinten</span>${icon("chev")}</button></div>
    ${sk.length?`<div class="lbl leg-ws-lbl">Gemeinsam ändern · ${sk.length} Automaten</div><div class="leg-ws-3"><button type="button" class="leg-wf leg-wp" data-act="kfMPick" data-k="char"><small>Charakteristik</small><b>${esc(gl("char")||"–")}</b></button><button type="button" class="leg-wf leg-wp" data-act="kfMPick" data-k="amp"><small>Nennstrom</small><b>${esc(gl("amp")==="gemischt"?"gemischt":gl("amp")?gl("amp")+" A":"–")}</b></button><button type="button" class="leg-wf leg-wp" data-act="kfMPick" data-k="pole"><small>Pole</small><b>${esc((v=>v.length===1?v[0]+"-polig":"gemischt")([...new Set(sk.map(e=>+e.pole===3?3:1))]))}</b></button></div>`:""}
    <button type="button" class="leg-ws-weg${LEG_WS.weg==="mehr"?" sicher":""}" data-act="kfWeg">${icon("del")}<span>${LEG_WS.weg==="mehr"?`Wirklich ${A.length} entfernen?`:`${A.length} entfernen`}</span><kbd>Entf</kbd></button>`}
    <div class="lbl leg-ws-lbl">Mehrere auswählen</div><p class="meta kf-hint">Strg + Klick nimmt einzeln dazu · Umschalt + Klick wählt von–bis · Strg + C / Strg + V kopiert an die rote Marke – auch in eine andere Legende · Esc hebt die Auswahl auf.</p>`; }
const kfFuer=e=>e?(typeof gkFuerEintrag==="function"&&gkFuerEintrag(e)):null;

/* ---- Aktionen ---- */
function kfDupl(L){ const E=legE(L), A=kfAuswahl(L); if(!A.length||L.fertig) return; const last=Math.max(...A.map(e=>E.indexOf(e)));
  LEG_WS.marke={nach:last,neu:false}; const vor=legE(L).length; kfRein(L,kfVorlageTeile(A).map((t,k)=>{ if(A[k]&&A[k].art!=="sk") t.bez=A[k].bez; return t; }),A.length===1?"Dupliziert":`${A.length} dupliziert`);
  const N=legE(L), n=N.length-vor; LEG_WS.ids=N.slice(last+1,last+1+n).map(e=>e.id); LEG_WS.id=LEG_WS.ids[0]||null; LEG_WS.tab="sel"; render(); }
function kfWeg(L){ const A=kfAuswahl(L); if(!A.length||L.fertig) return; if(LEG_WS.weg!=="mehr"&&!(A.length===1&&LEG_WS.weg===A[0].id)){ LEG_WS.weg=A.length>1?"mehr":A[0].id; render(); return; }
  const E=legE(L), i=E.indexOf(A[0]), S=new Set(A.map(e=>e.id)); L.eintraege=E.filter(e=>!S.has(e.id)); legSpeichern(L);
  LEG_WS.marke=i>0?{nach:i-1,neu:false}:null; kfLeeren(); render(); toast(A.length===1?"Entfernt":`${A.length} entfernt`); }
function kfZug(L,d){ const E=legE(L), S=new Set(kfAuswahl(L).map(e=>e.id)); if(!S.size||L.fertig) return;
  const I=E.map((e,i)=>S.has(e.id)?i:-1).filter(i=>i>=0); if(d<0&&I[0]===0||d>0&&I[I.length-1]===E.length-1) return;
  (d<0?I:I.slice().reverse()).forEach(i=>{ const j=i+d; [E[i],E[j]]=[E[j],E[i]]; }); legSpeichern(L); render(); }
function kfMPick(b){ const L=legAkt(); if(!L||L.fertig) return; const sk=kfAuswahl(L).filter(e=>e.art==="sk"), k=b.dataset.k; if(!sk.length) return;
  const O=k==="char"?LEG_WS_OPT.char.map(x=>[x,x+"-Charakteristik"]):k==="amp"?LEG_WS_OPT.amp.map(x=>[String(x),x+" A"]):[["1","1-polig"],["3","3-polig"]];
  const wahl=v=>{ sk.forEach(e=>{ if(k==="pole"){ e.pole=+v; if(+v===3&&+e.te<3) delete e.te; if(+v===1&&+e.te===3) delete e.te; } else { const S=legWsSchutz(e); legWsSchutzSetzen(e,{...S,[k]:v}); } if(typeof legWsArtikelNeu==="function") legWsArtikelNeu(e); }); legSpeichern(L); render(); };
  const r=b.getBoundingClientRect(); kontextMenu(r.left,r.bottom,O.map(([v,t])=>({t,svg:'<span class="km-leer"></span>',fn:()=>wahl(v)})));
  const m=document.getElementById("menu"); if(m){ m.classList.toggle("km-lang",O.length>8); m.style.minWidth=Math.round(r.width)+"px"; const h=m.offsetHeight; if(r.bottom+4+h>innerHeight-8) m.style.top=Math.max(8,r.top-h-4)+"px"; } }
function kfReiheMenu(b){ const L=legAkt(); if(!L) return; const R=legReihen(L), ri=+b.dataset.r, r=R[ri]; if(!r) return; const E=legE(L), I=r.g.map(([,i])=>i), von=I[0], bis=I[I.length-1], ids=r.g.map(([e])=>e.id);
  const neuBei=(nach)=>{ LEG_WS.marke={nach,neu:true}; kfLeeren(); LEG_WS.kat=LEG_WS.kat==="sonder"?"ls":LEG_WS.kat; render(); };
  const zu=L.fertig, rc=b.getBoundingClientRect();
  kontextMenu(rc.right-240,rc.bottom+4,[
    !zu&&{t:"Reihe darüber einfügen",ic:"add",fn:()=>neuBei(von-1)},
    !zu&&{t:"Reihe darunter einfügen",ic:"add",fn:()=>neuBei(bis)},
    !zu&&{t:"Reihe duplizieren",ic:"copy",fn:()=>{ LEG_WS.marke={nach:bis,neu:true}; kfRein(L,kfVorlageTeile(r.g.map(([e])=>e)).map((t,k)=>{ const q=r.g[k]&&r.g[k][0]; if(q&&q.art!=="sk") t.bez=q.bez; return t; }),`Reihe ${ri+1} dupliziert`); }},
    {t:"Reihe auswählen",ic:"check",fn:()=>{ LEG_WS.ids=ids; LEG_WS.id=ids[0]; LEG_WS.tab="sel"; LEG_WS.weg=null; render(); }},
    {t:"Als Vorlage speichern",ic:"pin",fn:()=>kfVorlageDlg(kfVorlageTeile(r.g.map(([e])=>e)),`Reihe ${ri+1}`)},
    !zu&&"-",
    !zu&&{t:"Reihe löschen …",ic:"del",gefahr:true,fn:()=>{ LEG_WS.ids=ids; LEG_WS.id=ids[0]; LEG_WS.tab="sel"; LEG_WS.weg="mehr"; render(); toast("Zum Löschen unten rechts bestätigen"); }}]); }
async function kfAdd(L,q){ if(!L||L.fertig) return; const n=LEG_WS.anz||1;
  try{
    if(q.startsWith("m:")){ const m=awGeraete().find(x=>matHnr(x.herstellerNr)===q.slice(2)); if(!m) return; const t=kfMatTeil(m), nm=kfMatName(m);
      kfMerken({q,t:nm,s:`${awHerstKurz(m.hersteller)} ${m.herstellerNr}`,te:`${gkZahl(+t.te||1)} TE`,mat:t.mat}); kfRein(L,kfMal(t,n),`${n} × ${nm}`); return; }
    if(q.startsWith("k:")){ const a=GK_MAP.get(q.slice(2)); if(!a) return; const t=await kfKatTeil(a,L); if(legAkt()!==L) return;
      kfMerken({q,t:a.model,s:`${awHerstKurz(a.manufacturer)}${a.article?" · "+a.article:""}`,te:gkTeText(a.dimension.width,L),gk:a.id}); kfRein(L,kfMal(t,n),`${n} × ${a.model}`); return; }
    if(q.startsWith("ls:")){ const s=JSON.parse(q.slice(3)); LEG_WS.ls={...kfLs(L),...s}; kfLsRein(L); return; }
    if(q.startsWith("kl:")){ const f=q.slice(3); kfRein(L,kfMal({art:"kl",farbe:f,bez:f==="pe"?"PE 14-S":f==="a"?"A 14-S":"N 14-S",schutz:"",pole:1,te:1},n),`${n} × Klemme`); return; }
    if(q==="res"){ kfRein(L,kfMal({art:"res",bez:"",schutz:"",pole:1,te:1},n),`${n} × Leerplatz`); return; }
    if(q.startsWith("v:")){ const v=kfFestVorlagen(L)[+q.slice(2)]; if(v) kfRein(L,v[2],v[0]+" eingesetzt"); return; }
    if(q.startsWith("u:")){ const v=kfEigene().find(x=>x.id===q.slice(2)); if(v) kfRein(L,v.teile,v.name+" eingesetzt"); return; }
    if(q.startsWith("z:")){ const o=kfLetzt()[+q.slice(2)]; if(o&&o.q) kfAdd(L,o.q); return; }
  }catch(err){ toast(err.message||"Ging nicht"); } }
function kfLsRein(L){ const s=kfLs(L), mat=kfLsMat(s), n=LEG_WS.anz||1, t={art:"sk",bez:"?",schutz:`${s.ch}${s.amp}`,pole:s.pol,te:s.pol,mat};
  kfMerken({q:"ls:"+JSON.stringify({h:s.h,ser:s.ser,ch:s.ch,amp:s.amp,pol:s.pol}),t:`LS ${s.ch}${s.amp}${s.pol===3?" 3-polig":""}`,s:`${awHerstKurz(s.h)} ${(KF_SER[s.h].find(x=>x[0]===s.ser)||[])[1]||""} · ${mat}`,te:`${s.pol} TE`,mat});
  try{ META.kfLs={h:s.h,ser:s.ser}; metaSave(); }catch(e){}
  kfRein(L,kfMal(t,n),`${n} × LS ${s.ch}${s.amp}`); }

/* ---- Klicks ---- */
document.addEventListener("click",ev=>{ const b=ev.target.closest&&ev.target.closest('[data-act^="kf"]'); if(!b||b.disabled) return; const L=legAkt(); if(!L||!legWsAktiv(L)&&b.dataset.act!=="kfVorlOk") return;
  ev.stopPropagation(); ev.preventDefault(); const a=b.dataset.act, v=b.dataset.v, s=LEG_WS.ls;
  switch(a){
    case "kfUeb": LEG_WS.tab="ueb"; render(); return;
    case "kfZu": kfLeeren(); render(); return;
    case "kfEnde": LEG_WS.marke=null; render(); return;
    case "kfKat": LEG_WS.kat=v; render(); return;
    case "kfHerst": LEG_WS.herst=v; render(); return;
    case "kfLsH": { const l=kfLs(L); if(l.h!==v){ l.h=v; l.ser=KF_SER[v][0][0]; } render(); return; }
    case "kfAnz": LEG_WS.anz=Math.max(1,Math.min(24,(LEG_WS.anz||1)+(+v))); render(); return;
    case "kfLsSer": kfLs(L).ser=v; render(); return;
    case "kfLsCh": kfLs(L).ch=v; render(); return;
    case "kfLsPol": kfLs(L).pol=+v; render(); return;
    case "kfLsAmp": kfLs(L).amp=+v; render(); return;
    case "kfLsRein": kfLsRein(L); return;
    case "kfLsBild": { const im=b.querySelector("img"); if(im) legBildGross(im.currentSrc||im.src,`LS ${kfLs(L).ch}${kfLs(L).amp}`,kfLsMat(kfLs(L))); return; }
    case "kfAdd": kfAdd(L,b.dataset.q); return;
    case "kfMarke": LEG_WS.marke={nach:+b.dataset.i,neu:false}; kfLeeren(); render(); return;
    case "kfNeuReihe": LEG_WS.marke={nach:legE(L).length-1,neu:true}; kfLeeren(); render(); return;
    case "kfReihe": kfReiheMenu(b); return;
    case "kfDupl": kfDupl(L); return;
    case "kfWeg": kfWeg(L); return;
    case "kfZug": kfZug(L,+b.dataset.d); return;
    case "kfMPick": kfMPick(b); return;
    case "kfAlsVorl": kfVorlageDlg(kfVorlageTeile(kfAuswahl(L)),""); return;
    case "kfVorlOk": { const name=((document.getElementById("f_kfVName")||{}).value||"").trim(); if(!name){ toast("Bitte einen Namen eingeben"); return; }
      const T=LEG_WS._vorl||[]; META.kfVorlagen=[...kfEigene(),{id:uid(),name,teile:T}]; metaSave(); LEG_WS._vorl=null; closeOverlays(); LEG_WS.kat="vorl"; kfLeeren(); render(); toast(`Vorlage „${name}“ gespeichert`); return; }
    case "kfVorlWeg": { const V=kfEigene().find(x=>x.id===v); if(!V) return; if(LEG_WS._vweg!==v){ LEG_WS._vweg=v; toast(`Nochmal tippen: „${V.name}“ löschen`); setTimeout(()=>{ if(LEG_WS._vweg===v) LEG_WS._vweg=null; },4000); return; }
      META.kfVorlagen=kfEigene().filter(x=>x.id!==v); metaSave(); LEG_WS._vweg=null; render(); toast("Vorlage gelöscht"); return; }
    case "kfSTe": LEG_WS.sonder.te=+v; render(); return;
    case "kfSRein": case "kfSMerk": { const S=LEG_WS.sonder, bez=S.bez.trim(); if(!bez) return; const t={art:"ge",bez,schutz:"",pole:1,te:+S.te||1,sonder:true};
      if(a==="kfSMerk"){ kfVorlageDlg([t],bez); return; } kfMerken({q:"",t:bez,s:"Sondergerät",te:`${t.te} TE`}); kfRein(L,kfMal(t,LEG_WS.anz||1),bez+" eingesetzt"); return; }
  } },true);
document.addEventListener("input",ev=>{ const t=ev.target; if(!t.dataset||!t.dataset.kf) return; const L=legAkt(); if(!legWsAktiv(L)) return;
  if(t.dataset.kf==="such"){ LEG_WS.such=t.value; render(); }
  else if(t.dataset.kf==="sbez"){ LEG_WS.sonder.bez=t.value; const p=document.querySelector(".kf-sb span"); if(p) p.textContent=t.value||"Sondergerät"; document.querySelectorAll('[data-act="kfSRein"],[data-act="kfSMerk"]').forEach(x=>x.disabled=!t.value.trim()); } });
/* ---- Tastatur: Esc, Entf, Strg+D/C/V/A ---- */
document.addEventListener("keydown",ev=>{ const L=legAkt(); if(!L||!legWsAktiv(L)) return; const t=ev.target, tip=t&&(t.tagName==="INPUT"||t.tagName==="TEXTAREA"||t.isContentEditable);
  if(!document.getElementById("dlg").hidden||document.querySelector(".bv")||!document.getElementById("menu").hidden) return;
  const st=ev.ctrlKey||ev.metaKey, k=ev.key.toLowerCase();
  if(ev.key==="Escape"){ if(tip&&t.dataset.kf==="such"&&LEG_WS.such){ LEG_WS.such=""; render(); ev.preventDefault(); return; } if(LEG_WS.tab!=="ein"||LEG_WS.ids.length){ kfLeeren(); render(); ev.preventDefault(); } return; }
  if(tip) return;
  const A=kfAuswahl(L);
  if((ev.key==="Delete"||ev.key==="Backspace")&&A.length&&!L.fertig){ ev.preventDefault(); kfWeg(L); return; }
  if(ev.key==="Enter"&&LEG_WS.weg&&A.length){ ev.preventDefault(); kfWeg(L); return; }
  if(!st) return;
  if(k==="d"&&A.length&&!L.fertig){ ev.preventDefault(); kfDupl(L); return; }
  if(k==="c"&&A.length){ ev.preventDefault(); LEG_WS.clip=kfVorlageTeile(A).map((x,i)=>{ if(A[i].art!=="sk") x.bez=A[i].bez; return x; }); try{ localStorage.setItem("irrgang_kf_clip",JSON.stringify(LEG_WS.clip)); }catch(e){} toast(`${A.length} kopiert – Strg + V setzt an der roten Marke ein`); return; }
  if(k==="v"&&!L.fertig){ let C=LEG_WS.clip; if(!C){ try{ C=JSON.parse(localStorage.getItem("irrgang_kf_clip")||"null"); }catch(e){} } if(!C||!C.length) return; ev.preventDefault(); kfLeeren(); kfRein(L,C,`${C.length} eingefügt`); return; }
  if(k==="a"){ ev.preventDefault(); const ids=legE(L).filter(e=>e.art!=="gr").map(e=>e.id); LEG_WS.ids=ids; LEG_WS.id=ids[0]||null; LEG_WS.tab=ids.length?"sel":"ein"; LEG_WS.weg=null; render(); }
});
