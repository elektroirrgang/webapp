/* Meine Arbeitszeit – persönliche Zeiterfassung, NUR auf diesem Gerät (Max 27.11.2026).
   Bewusst ohne Datenbank, ohne Abgleich, ohne SharePoint: niemand außer dem Mitarbeiter sieht oder ändert diese Zeiten,
   auch nicht Chef, Büro, Admins, KI oder der MCP-Server. Sichern geht nur über „Sichern“ (Datei) – bei Handywechsel wichtig.
   Gespeichert wird minutengenau; daneben steht, was nach der Viertelstunden-Rundung der Firma herauskommt
   (Beginn auf die nächste Viertelstunde aufgerundet, Ende auf die vorige abgerundet – einstellbar).
   Pausen: feste Pausen laut Handbuch werden abgezogen, soweit sie in die Arbeitszeit fallen; mehr als 6 h → mindestens 30 min. */
const ZT_KEY=()=>"irr.zeit.v1."+String(ME.mail||"ich").toLowerCase();
const ZT_STD={soll:38,rundBeginn:true,rundEnde:true,pausenAuto:true};
/* Wochentag (0 = So) → feste Pausen in Minuten ab 0:00 – laut Betriebshandbuch „Unsere Arbeitszeiten“ */
const ZT_PAUSEN={1:[[540,555],[720,750]],2:[[540,555],[720,750]],3:[[540,555],[720,750]],4:[[540,555],[720,750]],5:[[540,555]]};
const ZT_ART={arbeit:"Arbeit",urlaub:"Urlaub",krank:"Krank",feiertag:"Feiertag",ausgleich:"Freizeitausgleich"};
let ZT_TAB="woche", ZT_AB=null, ZT_E=null;
function ztLaden(){ try{ const d=JSON.parse(localStorage.getItem(ZT_KEY())||"null"); if(d&&Array.isArray(d.e)) return {lauf:null,einst:{},...d}; }catch(x){} return {e:[],lauf:null,einst:{}}; }
function ztSpeichern(d){ try{ localStorage.setItem(ZT_KEY(),JSON.stringify(d)); return true; }catch(x){ toast("Speichern ging nicht – Browser-Speicher gesperrt oder voll"); return false; } }
const ztEinst=d=>({...ZT_STD,...(d.einst||{})});
const ztMin=s=>{ const m=String(s||"").match(/^(\d{1,2}):(\d{2})/); return m?+m[1]*60+ +m[2]:null; };
const ztUhr=m=>`${String(Math.floor(m/60)).padStart(2,"0")}:${String(m%60).padStart(2,"0")}`;
const ztH=m=>{ const s=m<0?"−":"", a=Math.abs(Math.round(m)); return `${s}${Math.floor(a/60)}:${String(a%60).padStart(2,"0")} h`; };
const ztJetzt=()=>{ const d=new Date(); return {datum:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`,uhr:ztUhr(d.getHours()*60+d.getMinutes())}; };
const ztIso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const ztTagD=iso=>new Date(iso+"T12:00:00");
const ztMontag=iso=>{ const d=ztTagD(iso), w=(d.getDay()+6)%7; d.setDate(d.getDate()-w); return ztIso(d); };
const ztPlus=(iso,n)=>{ const d=ztTagD(iso); d.setDate(d.getDate()+n); return ztIso(d); };
const ztKW=iso=>{ const d=ztTagD(iso); d.setDate(d.getDate()+3-(d.getDay()+6)%7); const j=new Date(d.getFullYear(),0,4); return 1+Math.round(((d-j)/864e5-3+(j.getDay()+6)%7)/7); };
const ZT_WT=["So","Mo","Di","Mi","Do","Fr","Sa"], ZT_MON=["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
const ztKurz=iso=>`${ZT_WT[ztTagD(iso).getDay()]} ${iso.slice(8,10)}.${iso.slice(5,7)}.`;
/* Ein Tag: genau und nach Firmenrundung, jeweils nach Pause */
function ztTag(E,iso,ei){
  const wd=ztTagD(iso).getDay(), fenster=ei.pausenAuto?(ZT_PAUSEN[wd]||[]):[], soll=ei.soll/5;
  const ueber=(a,b)=>fenster.reduce((s,[x,y])=>s+Math.max(0,Math.min(b,y)-Math.max(a,x)),0);
  let da=0, ru=0, pDa=0, pRu=0, frei=0, hand=false;
  for(const e of E){ if(e.art&&e.art!=="arbeit"){ if(e.art!=="ausgleich") frei+=soll*60; continue; }
    const a=ztMin(e.von), b=ztMin(e.bis); if(a==null||b==null||b<=a) continue;
    const ra=ei.rundBeginn?Math.ceil(a/15)*15:a, rb=ei.rundEnde?Math.floor(b/15)*15:b;
    da+=b-a; ru+=Math.max(0,rb-ra);
    if(e.pause!=null&&e.pause!==""){ hand=true; pDa+=+e.pause; pRu+=+e.pause; } else { pDa+=ueber(a,b); pRu+=ueber(ra,Math.max(ra,rb)); } }
  if(!hand){ if(da-pDa>360&&pDa<30) pDa=30; if(ru-pRu>360&&pRu<30) pRu=30; }
  return {genau:Math.max(0,da-pDa)+frei, firma:Math.max(0,ru-pRu)+frei, pause:pDa, frei};
}
function ztZeitraum(d,von,tage){ const ei=ztEinst(d), T=[], heute=ztJetzt().datum; let g=0,f=0,soll=0,zukunft=false;
  for(let i=0;i<tage;i++){ const iso=ztPlus(von,i), E=d.e.filter(e=>e.datum===iso), r=ztTag(E,iso,ei), wd=ztTagD(iso).getDay();
    if(iso>heute) zukunft=true; else if(wd>=1&&wd<=5) soll+=ei.soll/5*60;  /* Soll nur bis heute – sonst steht mitten im Monat ein riesiges Minus */ g+=r.genau; f+=r.firma; T.push({iso,E,...r}); }
  return {T,genau:g,firma:f,soll,zukunft}; }
function ztZusammen(z,laufend){
  const k=(t,w,s,c="")=>`<div class="zt-k ${c}"><span>${t}</span><b>${w}</b>${s?`<small>${s}</small>`:""}</div>`;
  return `<div class="zt-sum">${k("Gearbeitet",ztH(z.genau),"minutengenau")}${k("Nach Firmenrundung",ztH(z.firma),"Viertelstunden")}
    ${k(z.zukunft?"Soll bis heute":"Soll",ztH(z.soll),"")}${k("Rundung kostet dich",ztH(z.genau-z.firma),"",z.genau-z.firma>0?"minus":"")}
    ${k("Stand gegenüber Soll",(z.genau-z.soll>0?"+":"")+ztH(z.genau-z.soll),"minutengenau",z.genau-z.soll<0?"minus":"plus")}${k("Nach Firmenrundung",(z.firma-z.soll>0?"+":"")+ztH(z.firma-z.soll),"",z.firma-z.soll<0?"minus":"plus")}</div>${laufend?`<p class="zt-mini">Ohne die laufende Zeit von heute.</p>`:""}`; }
function ztTagZeile(t){
  if(!t.E.length) return "";
  const txt=t.E.map(e=>e.art&&e.art!=="arbeit"?ZT_ART[e.art]:`${e.von}–${e.bis}${e.pause!=null&&e.pause!==""?` · Pause ${e.pause} min`:""}`).join(", ");
  const note=t.E.map(e=>e.notiz).filter(Boolean).join(" · ");
  return `<div class="li" role="button" tabindex="0" data-act="ztTag" data-id="${t.iso}"><span class="lt"><span class="h">${ztKurz(t.iso)}</span><span class="s">${esc(txt)}${t.pause&&!t.frei?` · Pause ${t.pause} min`:""}${note?` · ${esc(note)}`:""}</span></span>
    <span class="zt-std"><b>${ztH(t.genau)}</b>${t.firma!==t.genau?`<small>Firma ${ztH(t.firma)}</small>`:""}</span>${icon("chev")}</div>`; }
let ZT_PERSIST=false;
function ztView(){ const d=ztLaden(), ei=ztEinst(d), j=ztJetzt();
  /* Browser bitten, die Daten nicht von selbst zu löschen (Android/Chrome; iPhone: nur als App auf dem Home-Bildschirm sicher) */
  if(!ZT_PERSIST){ ZT_PERSIST=true; try{ navigator.storage&&navigator.storage.persist&&navigator.storage.persist(); }catch(x){} }
  if(!ZT_AB) ZT_AB=ZT_TAB==="woche"?ztMontag(j.datum):j.datum.slice(0,8)+"01";
  const lauf=d.lauf, laufMin=lauf?Math.max(0,ztMin(j.uhr)-ztMin(lauf.von)):0;
  const heute=ztTag(d.e.filter(e=>e.datum===j.datum),j.datum,ei);
  let kopf, z;
  if(ZT_TAB==="woche"){ z=ztZeitraum(d,ZT_AB,7); kopf=`KW ${ztKW(ZT_AB)} · ${ZT_AB.slice(8,10)}.${ZT_AB.slice(5,7)}.–${ztPlus(ZT_AB,6).slice(8,10)}.${ztPlus(ZT_AB,6).slice(5,7)}.`; }
  else { const m=ztTagD(ZT_AB), tage=new Date(m.getFullYear(),m.getMonth()+1,0).getDate(); z=ztZeitraum(d,ZT_AB,tage); kopf=`${ZT_MON[m.getMonth()]} ${m.getFullYear()}`; }
  const zeilen=z.T.map(ztTagZeile).filter(Boolean);
  return `<div class="narrow zt">
    <div class="zt-privat">${icon("lock")}<p><b>Nur auf diesem Gerät.</b> Niemand sonst sieht diese Zeiten – auch nicht Chef oder Büro. Vor einem Handywechsel „Sichern“.${/iPhone|iPad|Macintosh/.test(navigator.userAgent)&&!(matchMedia("(display-mode: standalone)").matches||navigator.standalone)?" <b>iPhone/iPad:</b> Die App über „Teilen → Zum Home-Bildschirm“ installieren, sonst löscht Safari die Zeiten nach einigen Tagen ohne Nutzung.":""}</p></div>
    <div class="zt-stempel">${lauf?`<div class="zt-lauf"><span>Läuft seit</span><b>${esc(lauf.von)} Uhr</b><small>${ztH(laufMin)} bisher${ei.rundBeginn&&ztMin(lauf.von)%15?` · Firma rechnet ab ${ztUhr(Math.ceil(ztMin(lauf.von)/15)*15)}`:""}</small></div>
        <button type="button" class="zt-knopf stopp" data-act="ztStopp">${icon("pending")}Arbeit beenden</button>`
      :`<button type="button" class="zt-knopf" data-act="ztStart">${icon("pending")}Arbeit beginnen</button>`}
      <p class="zt-heute">Heute: <b>${ztH(heute.genau)}</b>${heute.firma!==heute.genau?` · nach Firmenrundung ${ztH(heute.firma)}`:""}</p></div>
    <div class="hb-af-seg" role="tablist"><button type="button" role="tab" data-act="ztTab" data-k="woche" aria-selected="${ZT_TAB==="woche"}">Woche</button><button type="button" role="tab" data-act="ztTab" data-k="monat" aria-selected="${ZT_TAB==="monat"}">Monat</button></div>
    <div class="zt-nav"><button type="button" class="icon-btn" data-act="ztVor" data-n="-1" aria-label="Zurück">${icon("back")}</button><b>${kopf}</b><button type="button" class="icon-btn zt-weiter" data-act="ztVor" data-n="1" aria-label="Weiter">${icon("chev")}</button></div>
    ${ztZusammen(z,!!lauf&&j.datum>=ZT_AB&&j.datum<=z.T[z.T.length-1].iso)}
    ${zeilen.length?listOf(zeilen):`<p class="meta" style="margin:16px 4px">In diesem Zeitraum ist nichts eingetragen.</p>`}
    <div class="zt-aktionen"><button type="button" class="btn-tonal" data-act="ztCsv">${icon("doc")}Als Tabelle (CSV)</button><button type="button" class="btn-text" data-act="ztSichern">${icon("backup")}Sichern</button><button type="button" class="btn-text" data-act="ztLaden">${icon("upload")}Wiederherstellen</button><button type="button" class="btn-text" data-act="ztEinst">${icon("edit")}Einstellungen</button></div>
    <p class="hint">Soll ${String(ei.soll).replace(".",",")} h pro Woche. Urlaub, Krank und Feiertag zählen mit einem Fünftel davon. Pausen laut Handbuch werden abgezogen, soweit sie in deine Zeit fallen – über 6 h mindestens 30 min. Eigene Pause im Eintrag geht vor.</p></div>`; }
/* Eintrag anlegen/ändern – ein Tag kann mehrere Einträge haben.
   Eigene Auswahl statt System-Picker (Max 27.11.2026): Datum als Wochenleiste, Uhrzeit als zwei Drehräder (Stunde, Minute). */
let ZT_PF="von", ZT_DW=null;
const ZT_RH=40; /* Zeilenhöhe der Drehräder in px */
function ztWoche(sel){ const mo=ZT_DW||ztMontag(sel), heute=ztJetzt().datum, m=ztTagD(mo), so=ztPlus(mo,6), m2=ztTagD(so);
  const titel=m.getMonth()===m2.getMonth()?`${ZT_MON[m.getMonth()]} ${m.getFullYear()}`:`${ZT_MON[m.getMonth()].slice(0,3)} – ${ZT_MON[m2.getMonth()].slice(0,3)} ${m2.getFullYear()}`;
  return `<div class="zt-wk"><button type="button" class="icon-btn" data-act="ztDwN" data-n="-1" aria-label="Woche zurück">${icon("back")}</button><b>${titel}</b><button type="button" class="icon-btn zt-weiter" data-act="ztDwN" data-n="1" aria-label="Woche weiter">${icon("chev")}</button></div>
    <div class="zt-tage">${[0,1,2,3,4,5,6].map(i=>{ const iso=ztPlus(mo,i), d=ztTagD(iso); return `<button type="button" data-act="ztDw" data-d="${iso}" aria-pressed="${iso===sel}" class="${iso===heute?"heute":""}"><span>${ZT_WT[d.getDay()]}</span><b>${d.getDate()}</b></button>`; }).join("")}</div>`; }
const ztRad=(name,max)=>`<div class="zt-rad" data-rad="${name}" data-max="${max}"><div class="zt-rad-pad"></div>${Array.from({length:max},(_,i)=>`<div class="zt-rad-i" data-i="${i}">${String(i).padStart(2,"0")}</div>`).join("")}<div class="zt-rad-pad"></div></div>`;
function ztDlg(e){ const neu=!e; e=e||{id:"z"+Date.now().toString(36),datum:ztJetzt().datum,art:"arbeit",von:"07:30",bis:"16:30",pause:"",notiz:""}; ZT_E=e.id; ZT_PF="von"; ZT_DW=null;
  const arb=(e.art||"arbeit")==="arbeit";
  dialog(neu?"Zeit eintragen":"Eintrag ändern",`<input type="hidden" data-f="ztDat" value="${esc(e.datum)}"><input type="hidden" data-f="ztVon" value="${esc(e.von||"07:30")}"><input type="hidden" data-f="ztBis" value="${esc(e.bis||"16:30")}">
    <div class="zt-dat">${ztWoche(e.datum)}</div>
    <div class="fg1">${sf("ztArt","Art",e.art||"arbeit",Object.entries(ZT_ART),{form:true})}</div>
    <div class="zt-zeitwahl"${arb?"":" hidden"}>
      <div class="zt-felder"><button type="button" class="zt-feld" data-act="ztPf" data-k="von" aria-pressed="true"><span>Beginn</span><b>${esc(e.von||"07:30")}</b></button>
        <button type="button" class="zt-feld" data-act="ztPf" data-k="bis" aria-pressed="false"><span>Ende</span><b>${esc(e.bis||"16:30")}</b></button></div>
      <div class="zt-raeder"><div class="zt-band"></div>${ztRad("h",24)}<span class="zt-dp">:</span>${ztRad("m",60)}</div>
      <div class="zt-schnell"><button type="button" class="chip" data-act="ztJetztW">Jetzt</button>${["07:30","09:00","12:00","13:00","16:30"].map(t=>`<button type="button" class="chip" data-act="ztSetzW" data-t="${t}">${t}</button>`).join("")}</div>
      <div class="fg1" style="margin-top:14px">${tf("ztPause","Pause in Minuten",e.pause??"",{form:true,im:"numeric",ph:"leer = automatisch laut Handbuch"})}</div></div>
    <div class="fg1" style="margin-top:14px">${tf("ztNotiz","Notiz",e.notiz||"",{form:true,ph:"z. B. Baustelle, Überstunden"})}</div>`,
    `${neu?"":`<button class="btn-text danger" data-act="ztWeg">Löschen</button>`}<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-filled" data-act="ztOk">${neu?"Eintragen":"Speichern"}</button>`);
  setTimeout(()=>{ if(document.activeElement&&document.activeElement.blur) document.activeElement.blur(); ztRaederAuf(); },80);
  const art=$("#dlg").querySelector('[data-f="ztArt"]'); if(art) art.onchange=()=>{ const w=$("#dlg").querySelector(".zt-zeitwahl"); if(w){ w.hidden=art.value!=="arbeit"; if(!w.hidden) ztRaederAuf(); } }; }
const ztHid=n=>$("#dlg").querySelector(`[data-f="${n}"]`);
/* Räder auf den Wert des aktiven Feldes stellen und beim Drehen den Wert übernehmen */
function ztRaederAuf(){ const v=ztMin((ztHid(ZT_PF==="von"?"ztVon":"ztBis")||{}).value)??0;
  $("#dlg").querySelectorAll(".zt-rad").forEach(r=>{ const w=r.dataset.rad==="h"?Math.floor(v/60):v%60; r.scrollTop=w*ZT_RH; ztRadMarke(r,w);
    if(!r._an){ r._an=true; let t=null; r.addEventListener("scroll",()=>{ clearTimeout(t); ztRadMarke(r,Math.round(r.scrollTop/ZT_RH)); t=setTimeout(()=>ztRadFertig(r),90); },{passive:true}); } }); }
function ztRadMarke(r,i){ r.querySelectorAll(".zt-rad-i").forEach(x=>x.classList.toggle("an",+x.dataset.i===i)); }
function ztRadFertig(r){ const max=+r.dataset.max, i=Math.max(0,Math.min(max-1,Math.round(r.scrollTop/ZT_RH)));
  const h=ztHid(ZT_PF==="von"?"ztVon":"ztBis"); if(!h) return; const v=ztMin(h.value)??0;
  const neu=r.dataset.rad==="h"?i*60+v%60:Math.floor(v/60)*60+i; ztWertSetzen(ztUhr(neu),false); }
function ztWertSetzen(t,raeder){ const h=ztHid(ZT_PF==="von"?"ztVon":"ztBis"); if(!h) return; h.value=t;
  const f=$("#dlg").querySelector(`.zt-feld[data-k="${ZT_PF}"] b`); if(f) f.textContent=t; if(raeder) ztRaederAuf(); }
function ztTagDlg(iso){ const d=ztLaden(), E=d.e.filter(e=>e.datum===iso);
  if(E.length===1) return ztDlg(E[0]);
  dialog(ztKurz(iso),listOf(E.map(e=>`<div class="li" role="button" tabindex="0" data-act="ztEdit" data-id="${e.id}"><span class="lt"><span class="h">${e.art&&e.art!=="arbeit"?ZT_ART[e.art]:`${e.von}–${e.bis}`}</span>${e.notiz?`<span class="s">${esc(e.notiz)}</span>`:""}</span>${icon("chev")}</div>`)),
    `<span style="flex:1"></span><button class="btn-text" data-act="cancel">Schließen</button>`); }
function ztOk(){ const F=formVals(), d=ztLaden(), art=F.ztArt||"arbeit";
  if(!/^\d{4}-\d{2}-\d{2}$/.test(F.ztDat||"")){ toast("Bitte ein Datum wählen"); return; }
  if(art==="arbeit"){ const a=ztMin(F.ztVon), b=ztMin(F.ztBis); if(a==null||b==null){ toast("Bitte Beginn und Ende eintragen"); return; } if(b<=a){ toast("Ende muss nach dem Beginn liegen"); return; } }
  if(F.ztPause!==""&&!(+F.ztPause>=0)){ toast("Pause bitte in Minuten, z. B. 45"); return; }
  const r={id:ZT_E,datum:F.ztDat,art,von:art==="arbeit"?F.ztVon.slice(0,5):"",bis:art==="arbeit"?F.ztBis.slice(0,5):"",pause:F.ztPause===""?"":String(Math.round(+F.ztPause)),notiz:F.ztNotiz||""};
  d.e=d.e.filter(x=>x.id!==r.id).concat(r).sort((x,y)=>(x.datum+x.von).localeCompare(y.datum+y.von));
  if(ztSpeichern(d)){ closeOverlays(); render(); toast("Gespeichert"); } }
function ztDatei(name,inhalt,typ){ const b=new Blob([inhalt],{type:typ}), a=document.createElement("a"); a.href=URL.createObjectURL(b); a.download=name; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },1500); }
function ztCsv(){ const d=ztLaden(), ei=ztEinst(d), von=ZT_AB, tage=ZT_TAB==="woche"?7:new Date(ztTagD(von).getFullYear(),ztTagD(von).getMonth()+1,0).getDate(), z=ztZeitraum(d,von,tage);
  const k=m=>(m/60).toFixed(2).replace(".",","), q=s=>`"${String(s||"").replace(/"/g,'""')}"`;
  const Z=[["Datum","Tag","Art","Beginn","Ende","Pause (min)","Notiz","Stunden genau","Stunden Firmenrundung"].join(";")];
  z.T.forEach(t=>t.E.forEach((e,i)=>Z.push([t.iso.split("-").reverse().join("."),ZT_WT[ztTagD(t.iso).getDay()],ZT_ART[e.art||"arbeit"],e.von,e.bis,e.pause!==""&&e.pause!=null?e.pause:(i?"":t.pause),q(e.notiz),i?"":k(t.genau),i?"":k(t.firma)].join(";"))));
  Z.push(["Summe","","","","","","",k(z.genau),k(z.firma)].join(";"),["Soll","","","","","","",k(z.soll),""].join(";"));
  ztDatei(`Arbeitszeit ${ZT_TAB==="woche"?"KW "+ztKW(von)+" "+von.slice(0,4):ZT_MON[ztTagD(von).getMonth()]+" "+von.slice(0,4)}.csv`,"﻿"+Z.join("\r\n"),"text/csv;charset=utf-8"); }
function ztWiederherstellen(){ const i=document.createElement("input"); i.type="file"; i.accept=".json,application/json"; i.style.display="none"; document.body.appendChild(i);
  i.onchange=async()=>{ const f=i.files&&i.files[0]; i.remove(); if(!f) return; let n=null; try{ n=JSON.parse(await f.text()); }catch(x){}
    if(!n||n.art!=="irrgang-arbeitszeit"||!Array.isArray(n.e)){ toast("Das ist keine Sicherung der Arbeitszeit"); return; }
    const d=ztLaden(), ids=new Set(d.e.map(e=>e.id)); let neu=0; n.e.forEach(e=>{ if(e&&e.id&&!ids.has(e.id)){ d.e.push(e); neu++; } });
    d.e.sort((x,y)=>(x.datum+x.von).localeCompare(y.datum+y.von)); if(n.einst&&!Object.keys(d.einst||{}).length) d.einst=n.einst;
    if(ztSpeichern(d)){ render(); toast(neu?`${neu} Einträge übernommen`:"Alles schon vorhanden"); } };
  i.click(); }
function ztEinstDlg(){ const ei=ztEinst(ztLaden());
  dialog("Einstellungen",`<div class="fg1">${tf("ztSoll","Soll pro Woche",String(ei.soll).replace(".",","),{form:true,im:"decimal",sfx:"h"})}
    ${sf("ztRb","Beginn bei der Firmenrundung",ei.rundBeginn?"1":"0",[["1","auf die nächste Viertelstunde aufrunden"],["0","nicht runden"]],{form:true})}
    ${sf("ztRe","Ende bei der Firmenrundung",ei.rundEnde?"1":"0",[["1","auf die vorige Viertelstunde abrunden"],["0","nicht runden"]],{form:true})}
    ${sf("ztPa","Pausen",ei.pausenAuto?"1":"0",[["1","automatisch laut Handbuch"],["0","nur was ich selbst eintrage"]],{form:true})}</div>`,
    `<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-filled" data-act="ztEinstOk">Speichern</button>`); }
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act^="zt"]'); if(!b||b.disabled) return; e.stopPropagation(); const a=b.dataset.act;
  if(a==="ztStart"){ const d=ztLaden(), j=ztJetzt(); d.lauf={datum:j.datum,von:j.uhr}; if(ztSpeichern(d)){ render(); toast(`Läuft seit ${j.uhr} Uhr`); } return; }
  if(a==="ztStopp"){ const d=ztLaden(), j=ztJetzt(); if(!d.lauf) return; let bis=j.uhr; const nacht=j.datum!==d.lauf.datum; if(nacht) bis="23:59";
    if(ztMin(bis)>ztMin(d.lauf.von)) d.e.push({id:"z"+Date.now().toString(36),datum:d.lauf.datum,art:"arbeit",von:d.lauf.von,bis,pause:"",notiz:""});
    d.lauf=null; d.e.sort((x,y)=>(x.datum+x.von).localeCompare(y.datum+y.von)); if(ztSpeichern(d)){ render(); toast(nacht?"Über Mitternacht – bitte Ende prüfen":"Eingetragen"); } return; }
  if(a==="ztTab"){ ZT_TAB=b.dataset.k; ZT_AB=null; render(); return; }
  if(a==="ztVor"){ const n=+b.dataset.n; if(ZT_TAB==="woche") ZT_AB=ztPlus(ZT_AB,7*n); else { const m=ztTagD(ZT_AB); m.setDate(1); m.setMonth(m.getMonth()+n); ZT_AB=ztIso(m); } render(); return; }
  if(a==="ztNeu"){ ztDlg(null); return; }
  if(a==="ztPf"){ ZT_PF=b.dataset.k; $("#dlg").querySelectorAll(".zt-feld").forEach(x=>x.setAttribute("aria-pressed",String(x.dataset.k===ZT_PF))); ztRaederAuf(); return; }
  if(a==="ztDw"){ const h=ztHid("ztDat"); if(h) h.value=b.dataset.d; $("#dlg").querySelector(".zt-dat").innerHTML=ztWoche(b.dataset.d); return; }
  if(a==="ztDwN"){ const h=ztHid("ztDat"); ZT_DW=ztPlus(ZT_DW||ztMontag(h.value),7*+b.dataset.n); $("#dlg").querySelector(".zt-dat").innerHTML=ztWoche(h.value); return; }
  if(a==="ztJetztW"){ ztWertSetzen(ztJetzt().uhr,true); return; }
  if(a==="ztSetzW"){ ztWertSetzen(b.dataset.t,true); return; }
  if(a==="ztTag"){ ztTagDlg(b.dataset.id); return; }
  if(a==="ztEdit"){ const r=ztLaden().e.find(x=>x.id===b.dataset.id); if(r) ztDlg(r); return; }
  if(a==="ztOk"){ ztOk(); return; }
  if(a==="ztWeg"){ const d=ztLaden(); d.e=d.e.filter(x=>x.id!==ZT_E); if(ztSpeichern(d)){ closeOverlays(); render(); toast("Gelöscht"); } return; }
  if(a==="ztCsv"){ ztCsv(); return; }
  if(a==="ztSichern"){ const d=ztLaden(); ztDatei(`Arbeitszeit Sicherung ${ztJetzt().datum}.json`,JSON.stringify({art:"irrgang-arbeitszeit",version:1,gesichert:new Date().toISOString(),e:d.e,einst:d.einst||{}}),"application/json"); toast("Sicherung gespeichert – am besten an einen sicheren Ort legen"); return; }
  if(a==="ztLaden"){ ztWiederherstellen(); return; }
  if(a==="ztEinst"){ ztEinstDlg(); return; }
  if(a==="ztEinstOk"){ const F=formVals(), d=ztLaden(), s=parseFloat(String(F.ztSoll||"").replace(",","."));
    if(!(s>0&&s<=60)){ toast("Soll bitte in Stunden, z. B. 38"); return; }
    d.einst={soll:s,rundBeginn:F.ztRb==="1",rundEnde:F.ztRe==="1",pausenAuto:F.ztPa==="1"}; if(ztSpeichern(d)){ closeOverlays(); render(); toast("Gespeichert"); } return; }
},true);
function ztZeile(){ const d=ztLaden(); return d.lauf?`läuft seit ${d.lauf.von} Uhr`:"Nur für dich, nur auf diesem Gerät"; }
