/* ===== Verteilerlegende (E-Check › Installation) =====
   Stromkreisliste für die Hager-Tasche im Verteiler: eine Zeile pro Stromkreis, Zwischenüberschriften, RCDs fett, Reserven als Schreiblinie.
   Geht ohne angelegten Kunden (Kunde und Anschrift frei eintragen). PDF im Stil der Prüfprotokolle (pdfStil). */
const LEG_ART=[["sk","Stromkreis"],["rcd","RCD"],["res","Reserve"],["gr","Überschrift"]];
const LEG_RAUM=["Küche","Bad","WC","Wohnzimmer","Schlafzimmer","Kinderzimmer","Büro","Flur","Treppenhaus","Keller","Hauswirtschaftsraum","Technikraum","Garage","Dachboden","Außen","Allgemein"];
const LEG_WAS=["Steckdosen","Licht","Herd","Backofen","Kochfeld","Spülmaschine","Kühlschrank","Waschmaschine","Trockner","Durchlauferhitzer","Heizung","Wärmepumpe","Wallbox","PV-Anlage","Rollläden","Brüstungskanal","EDV","Klingel","Außensteckdose"];
const LEG_LS=["B10","B13","B16","B20","B25","B32","C16"], LEG_RCD=["40 A / 30 mA Typ A","63 A / 30 mA Typ A","40 A / 30 mA Typ B","40 A / 300 mA Typ A"];
const LEG_VT=["HV","UV EG","UV OG","UV KG","UV DG","Zählerschrank"];
const LEG_NETZ=["","TN-C-S | 230/400 V","TN-S | 230/400 V","TT | 230/400 V"];
let legDlg=null;
const legAlle=()=>live("legenden").sort((a,b)=>(b.updated||0)-(a.updated||0));
const legAkt=()=>nav.v==="legende"&&DB.legenden.get(nav.id);
const legE=L=>Array.isArray(L.eintraege)?L.eintraege:(L.eintraege=[]);
const legSkZahl=L=>legE(L).filter(e=>e.art==="sk"||e.art==="res").length;
const legSchutz=e=>[e.schutz,e.art==="sk"&&+e.pole===3?"3-polig":""].filter(Boolean).join(" ");
function legSpeichern(L){ L.stand=ecHeute(); saveRec("legenden",L); }

/* ---- Abschnitt auf der Seite „Installation“ ---- */
function legAbschnitt(){ const A=legAlle();
  return kdKopf("Verteilerlegenden","legNeu","Legende anlegen")+(A.length?listOf(A.map(L=>`<div class="li" role="button" tabindex="0" data-act="legAuf" data-id="${esc(L.id)}"><span class="av">${icon("notes")}</span>
      <span class="lt"><span class="h">${esc(L.titel||"Verteiler")}</span><span class="s">${esc([L.kunde,`${legSkZahl(L)} Stromkreis${legSkZahl(L)===1?"":"e"}`,L.stand&&"Stand "+ecDatum(L.stand)].filter(Boolean).join(" · "))}</span></span>${icon("chev")}</div>`))
    :`<p class="meta leg-leer">Stromkreisliste für die Hager-Tasche im Verteiler – geht auch ohne angelegten Kunden.</p>`); }

/* ---- Neue Legende ---- */
function legNeuDlg(){ const K=live("kunden").sort((a,b)=>a.name.localeCompare(b.name,"de"));
  dialog("Neue Verteilerlegende",`<div class="fg1">${tf("legVt","Verteiler",LEG_VT[0],{form:true,ph:"z. B. HV Keller"})}</div>
    <div class="chips ec-wahl">${LEG_VT.map(v=>`<button type="button" class="chip" data-act="legSetz" data-ziel="f_legVt" data-v="${esc(v)}">${esc(v)}</button>`).join("")}</div>
    <div class="fg1" style="margin-top:14px">${sf("legKd","Kunde",K.length?"":"",[["","Ohne Kunde – frei eintragen"],...K.map(k=>[k.id,k.name+(k.kdnr?` (${k.kdnr})`:"")])],{form:true})}</div>`,
    `<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="legNeuOk">Anlegen</button>`,{breit:true}); }
function legNeuOk(){ const F=formVals(), k=F.legKd&&kundeOf(F.legKd);
  const L={id:uid(),titel:F.legVt||"Verteiler",kunde:k?k.name:"",anschrift:k?adrText(k):"",kundeId:k?k.id:"",netz:"",ersteller:ME.name||(META.profil&&META.profil.name)||"",stand:ecHeute(),eintraege:[]};
  saveRec("legenden",L,true); closeOverlays(); go({v:"legende",id:L.id}); }

/* ---- Bearbeiten ---- */
const legFeld=(L,k,l,o={})=>`<div class="tf${L[k]||o.ph||o.type==="date"?" fl":""}"><input id="f_leg_${k}" data-leg="${k}" value="${esc(L[k]||"")}" placeholder="${esc(o.ph||" ")}" ${o.type?`type="${o.type}"`:""} autocomplete="off"><label for="f_leg_${k}">${esc(l)}</label></div>`;
function legZeile(e){ const t=e.art==="gr";
  return `<button type="button" class="leg-z z-${e.art}" data-act="legEdit" data-id="${esc(e.id)}">${t?`<span class="bz">${esc(e.bez||"Überschrift")}</span>`
    :`<span class="kz">${esc(e.kz||"–")}</span><span class="bz">${e.art==="res"?`<i>Reserve</i>`:esc(e.bez||"–")}${e.art==="rcd"?` <span class="leg-rcd">RCD</span>`:""}</span><span class="sc">${esc(legSchutz(e))}</span>`}</button>`; }
function legView(L){ const E=legE(L);
  return `<div class="narrow ec-spalte leg">
    <section class="card"><h3>Anlage</h3><div class="ec-fg">
      <div class="reihe2">${legFeld(L,"titel","Verteiler",{ph:"z. B. HV Keller"})}${legFeld(L,"stand","Stand",{type:"date"})}</div>
      ${legFeld(L,"kunde","Kunde",{ph:"Name oder Firma"})}
      ${legFeld(L,"anschrift","Anschrift",{ph:"Straße, PLZ Ort"})}
      <div class="reihe2"><div class="tf fl"><select id="f_leg_netz" data-leg="netz">${LEG_NETZ.map(n=>`<option value="${esc(n)}" ${n===(L.netz||"")?"selected":""}>${esc(n||"nicht angeben")}</option>`).join("")}</select><label for="f_leg_netz">Netzform</label><span class="arr">${icon("drop")}</span></div>${legFeld(L,"ersteller","Erstellt von")}</div>
    </div></section>
    <section class="card"><h3>Stromkreise${E.length?` <small class="leg-n">${legSkZahl(L)}</small>`:""}</h3>
      ${E.length?`<div class="leg-l">${E.map(legZeile).join("")}</div>`:`<p class="meta">Noch keine Stromkreise. Unten rechts über „Stromkreis“ anlegen – mit „Nächster“ im Fenster geht es Zeile für Zeile weiter, die Kennzeichnung zählt mit.</p>`}
    </section>
    <div class="leg-fuss">${canEdit(L)?`<button type="button" class="btn-tonal leg-del" data-act="legDelAsk">${icon("del")}Löschen</button>`:""}<span style="flex:1"></span><button type="button" class="btn-filled" data-act="legPdf">${icon("pdf")}PDF erstellen</button></div>
  </div>`; }

/* Nächste Kennzeichnung: letzte Zahl der Zeile davor hochzählen (F 1.03 → F 1.04, Fi 4.1.20 → Fi 4.1.21); direkt nach einem RCD .01 anhängen */
function legNaechsteKz(E,i){ for(let j=i;j>=0;j--){ const e=E[j]; if(!e||e.art==="gr"||!e.kz) continue;
    if(e.art==="rcd") return String(e.kz).trim()+".01";   /* nach dem RCD: seine Stromkreise (Fi 4.1 → Fi 4.1.01) */
    const m=String(e.kz).match(/^(.*?)(\d+)(\D*)$/); if(!m) return ""; const n=+m[2]+1;
    return m[1]+String(n).padStart(m[2].length,"0"); }
  return "F 1.01"; }
function legSkDlg(id,nach){ const L=legAkt(); if(!L) return; const E=legE(L), i=id?E.findIndex(x=>x.id===id):-1, e=i>=0?E[i]:null;
  const pos=e?i:nach!=null?nach+1:E.length, art=e?e.art:"sk";
  const v=e||{art,kz:legNaechsteKz(E,pos-1),bez:"",schutz:"",pole:1};
  legDlg={id:e?e.id:null,pos,art:v.art,pole:String(v.pole||1)};
  const vorschl=[...new Set(live("legenden").flatMap(x=>legE(x).filter(y=>y.art==="sk"&&y.bez).map(y=>y.bez)))];
  dialog(e?"Zeile bearbeiten":"Neue Zeile",`<div class="chips ec-wahl leg-art">${LEG_ART.map(([k,t])=>`<button type="button" class="chip" data-act="legArt" data-v="${k}" aria-pressed="${k===v.art}">${t}</button>`).join("")}</div>
    <div class="fg1" style="margin-top:14px">
      <div class="leg-nur" data-nicht="gr">${tf("legKz","Kennzeichnung",v.kz||"",{form:true,ph:"z. B. F 1.01 oder Fi 4.1.01"})}</div>
      <div class="leg-nur" data-nicht="res">${tf("legBez",v.art==="gr"?"Überschrift":"Bezeichnung",v.bez||"",{form:true,ph:v.art==="gr"?"z. B. Erdgeschoss":v.art==="rcd"?"Fehlerstromschutzschalter":"z. B. Küche Steckdosen",list:"legBezListe"})}</div>
    </div>${datalist("legBezListe",vorschl)}
    <div class="leg-nur" data-nur="sk"><div class="lbl" style="margin-top:12px">Raum</div><div class="chips ec-wahl leg-vor">${LEG_RAUM.map(x=>`<button type="button" class="chip" data-act="legWort" data-v="${esc(x)}">${esc(x)}</button>`).join("")}</div>
      <div class="lbl" style="margin-top:12px">Verbraucher</div><div class="chips ec-wahl leg-vor">${LEG_WAS.map(x=>`<button type="button" class="chip" data-act="legWort" data-v="${esc(x)}">${esc(x)}</button>`).join("")}</div></div>
    <div class="leg-nur" data-nicht="gr"><div class="fg1" style="margin-top:16px">${tf("legSchutz","Absicherung",v.schutz||"",{form:true,ph:v.art==="rcd"?"z. B. 40 A / 30 mA Typ A":"z. B. B16"})}</div>
      <div class="chips ec-wahl leg-ls leg-nur" data-nicht="rcd">${LEG_LS.map(x=>`<button type="button" class="chip" data-act="legSetz" data-ziel="f_legSchutz" data-v="${x}">${x}</button>`).join("")}</div>
      <div class="chips ec-wahl leg-nur" data-nur="rcd">${LEG_RCD.map(x=>`<button type="button" class="chip" data-act="legSetz" data-ziel="f_legSchutz" data-v="${esc(x)}">${esc(x)}</button>`).join("")}</div></div>
    <div class="leg-nur" data-nur="sk"><div class="lbl" style="margin-top:12px">Pole</div><div class="chips ec-wahl">${[["1","1-polig"],["3","3-polig"]].map(([k,t])=>`<button type="button" class="chip" data-act="legPole" data-v="${k}" aria-pressed="${k===legDlg.pole}">${t}</button>`).join("")}</div></div>`,
    `${e?`<button class="btn-text danger" data-act="legSkDel">Löschen</button><button class="ab-ic" data-act="legOrd" data-d="-1" ${i?"":"disabled"} aria-label="Nach oben" title="Nach oben">${icon("chev")}</button><button class="ab-ic ab" data-act="legOrd" data-d="1" ${i<E.length-1?"":"disabled"} aria-label="Nach unten" title="Nach unten">${icon("chev")}</button>`:""}<span style="flex:1"></span>
      <button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="legSkOk" data-weiter="1">${e?"Darunter neu":"Nächster"}</button><button class="btn-text" data-act="legSkOk">Speichern</button>`,{breit:true});
  legArtZeigen(); }
function legArtZeigen(){ const a=legDlg&&legDlg.art; if(!a) return;
  document.querySelectorAll("#dlg .leg-nur").forEach(x=>x.hidden=(x.dataset.nur&&x.dataset.nur!==a)||(x.dataset.nicht&&x.dataset.nicht===a));
  const lb=document.querySelector('#dlg label[for="f_legBez"]'); if(lb) lb.textContent=a==="gr"?"Überschrift":"Bezeichnung";
  const bz=document.getElementById("f_legBez"); if(bz) bz.placeholder=a==="gr"?"z. B. Erdgeschoss":a==="rcd"?"Fehlerstromschutzschalter":"z. B. Küche Steckdosen";
  const sc=document.getElementById("f_legSchutz"); if(sc) sc.placeholder=a==="rcd"?"z. B. 40 A / 30 mA Typ A":"z. B. B16"; }
function legSkOk(weiter){ const L=legAkt(); if(!L||!legDlg) return; const F=formVals(), E=legE(L), a=legDlg.art;
  if(a==="gr"&&!F.legBez){ toast("Bitte eine Überschrift eintragen"); return; }
  if(a!=="gr"&&!F.legKz){ toast("Bitte eine Kennzeichnung eintragen"); return; }
  const r={id:legDlg.id||uid(),art:a,kz:a==="gr"?"":F.legKz,bez:a==="res"?"":a==="rcd"&&!F.legBez?"Fehlerstromschutzschalter":F.legBez,schutz:a==="gr"?"":F.legSchutz,pole:a==="sk"?+legDlg.pole:1};
  let i=E.findIndex(x=>x.id===r.id); if(i>=0) E[i]=r; else { E.splice(legDlg.pos,0,r); i=legDlg.pos; }
  legSpeichern(L); render();
  if(weiter) legSkDlg(null,i); else closeOverlays(); }

/* ---- PDF ---- */
async function legPdf(L){ const lib=await pdfLib(), d=new lib.jsPDF({unit:"mm",format:"a4"});
  const S=pdfStil(d,{titel:"Verteilerlegende",unter:`Stromkreisübersicht | ${L.titel||"Verteiler"}`,ehw:true,fuss:[L.kunde,L.titel,L.stand&&"Stand "+ecDatum(L.stand)].filter(Boolean).join(" | ")});
  const M=S.M, CW=S.CW, sp=[32,116,34];
  S.kopf(); S.abschnitt("Anlage");
  S.werte([["Kunde",L.kunde],["Verteiler",L.titel],["Anschrift",L.anschrift],["Stand",ecDatum(L.stand)],["Erstellt von",L.ersteller],...(L.netz?[["Netzform",L.netz]]:[])]);
  S.abschnitt("Hinweis für den Betreiber");
  S.text("Fehlerstromschutzschalter (RCD) alle 6 Monate über die Prüftaste „T“ auslösen. Schaltet der RCD dabei nicht ab, könnte er defekt sein. In diesem Fall bitte Elektro Irrgang informieren.");
  /* Kontakt groß wie im alten Verteilerplan */
  S.platz(14); const y=S.y+1, x2=M+CW/2;
  d.setTextColor(20); d.setFont("helvetica","bold"); d.setFontSize(12); d.text("Elektro Irrgang",M,y); d.setTextColor(...[225,29,47]); d.text("Tel. 02291 4878",x2,y);
  d.setFont("helvetica","normal"); d.setFontSize(10); d.setTextColor(40); d.text(pdfT("Hahner Weg 2 | 51545 Waldbröl"),M,y+5.2); d.text(pdfT("info@elektro-irrgang.de | www.elektro-irrgang.de"),x2,y+5.2);
  S.y=y+13;
  S.abschnitt("Stromkreise");
  const kz=()=>{ d.setFillColor(...S.NAVY); d.rect(M,S.y-4,CW,6,"F"); d.setTextColor(255); d.setFontSize(8); d.setFont("helvetica","bold"); let x=M+2; ["Kennzeichnung","Bezeichnung","Absicherung"].forEach((t,i)=>{ d.text(t,x,S.y); x+=sp[i]; }); S.y+=6; };
  S.platz(14); kz(); let zz=0;
  legE(L).forEach(e=>{ if(S.y>272){ S.seite(); kz(); }
    if(e.art==="gr"){ if(S.y>266){ S.seite(); kz(); } d.setFont("helvetica","bold"); d.setFontSize(8.5); d.setTextColor(...S.NAVY); d.text(pdfT(e.bez),M+2,S.y+1); d.setDrawColor(...S.LINE); d.line(M,S.y+2.6,M+CW,S.y+2.6); S.y+=7; zz=0; return; }
    const B=d.splitTextToSize(pdfT(e.bez||""),sp[1]-3).slice(0,2), ex=(B.length-1)*3.4; if(B.length>1&&S.y+ex>272){ S.seite(); kz(); }
    if(zz++%2){ d.setFillColor(...S.SUNK); d.rect(M,S.y-4,CW,6+ex,"F"); }
    d.setFontSize(8); d.setTextColor(20); d.setFont("helvetica",e.art==="rcd"?"bold":"normal");
    d.text(pdfT(e.kz||""),M+2,S.y);
    if(e.art==="res"){ d.setDrawColor(150); d.setLineWidth(.2); d.line(M+2+sp[0],S.y+.6,M+sp[0]+sp[1]-4,S.y+.6); }
    else d.text(B,M+2+sp[0],S.y,{lineHeightFactor:1.2});
    d.text(pdfT(legSchutz(e)),M+2+sp[0]+sp[1],S.y);
    S.y+=6+ex; });
  return S.ende(); }
async function legPdfMachen(){ const L=legAkt(); if(!L) return; if(!legE(L).length){ toast("Erst Stromkreise anlegen"); return; }
  toast("PDF wird erstellt …"); let blob; try{ blob=await legPdf(L); }catch(e){ console.error(e); toast("PDF konnte nicht erstellt werden – Internet für die PDF-Bibliothek nötig"); return; }
  const name=`Verteilerlegende ${[L.titel,L.kunde].filter(Boolean).join(" ")}`.replace(/[\\/:*?"<>|]+/g," ").trim()+".pdf", url=URL.createObjectURL(blob);
  toast("PDF erstellt","Öffnen",()=>{ if(DESK.matches){ const a=document.createElement("a"); a.href=url; a.download=name; document.body.appendChild(a); a.click(); a.remove(); window.open(url,"_blank","noopener"); } else window.open(url,"_blank","noopener"); }); }

/* ---- Klicks und Eingaben ---- */
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act^="leg"]'); if(!b||b.disabled) return; e.stopPropagation(); const a=b.dataset.act, L=legAkt();
  switch(a){
  case "legNeu": legNeuDlg(); return;
  case "legNeuOk": legNeuOk(); return;
  case "legAuf": go({v:"legende",id:b.dataset.id}); return;
  case "legSkNeu": legSkDlg(null,null); return;
  case "legEdit": legSkDlg(b.dataset.id); return;
  case "legArt": legDlg.art=b.dataset.v; b.parentElement.querySelectorAll(".chip").forEach(c=>c.setAttribute("aria-pressed",c===b)); legArtZeigen(); return;
  case "legPole": legDlg.pole=b.dataset.v; b.parentElement.querySelectorAll(".chip").forEach(c=>c.setAttribute("aria-pressed",c===b)); return;
  case "legSetz": { const f=document.getElementById(b.dataset.ziel); if(f){ f.value=b.dataset.v; f.parentElement.classList.add("fl"); } return; }
  case "legWort": { const f=document.getElementById("f_legBez"); if(!f) return; const w=b.dataset.v, t=f.value.trim();
      f.value=!t?w:t.split(/\s+/).includes(w)?t:t+" "+w; f.parentElement.classList.add("fl"); return; }
  case "legSkOk": legSkOk(!!b.dataset.weiter); return;
  case "legSkDel": { if(!L||!legDlg) return; L.eintraege=legE(L).filter(x=>x.id!==legDlg.id); legSpeichern(L); closeOverlays(); render(); return; }
  case "legOrd": { if(!L||!legDlg) return; const E=legE(L), i=E.findIndex(x=>x.id===legDlg.id), j=i+(+b.dataset.d); if(i<0||j<0||j>=E.length) return;
      [E[i],E[j]]=[E[j],E[i]]; legSpeichern(L); render(); legSkDlg(legDlg.id); return; }
  case "legPdf": legPdfMachen(); return;
  case "legDelAsk": confirmDlg("Legende löschen?",`„${L&&L.titel||"Verteiler"}“ mit allen Zeilen löschen?`,"Löschen","legDelOk"); return;
  case "legDelOk": { if(!L) return; L.deleted=true; saveRec("legenden",L); go({v:"anlagen"}); toast("Legende gelöscht"); return; }
  } },true);
document.addEventListener("change",e=>{ const el=e.target; if(!el.dataset||!el.dataset.leg) return; const L=legAkt(); if(!L) return;
  const k=el.dataset.leg, v=el.value.trim(); if((L[k]||"")===v) return; L[k]=v; if(k==="stand") saveRec("legenden",L); else legSpeichern(L);
  if(k==="titel"){ const t=document.querySelector("#topTitle span"); if(t) t.textContent=v||"Verteiler"; } });
