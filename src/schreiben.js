/* ===== Bedenkenanmeldung und Behinderungsanzeige (Baustelle, 04.11.2026) =====
   Wenn auf der Baustelle etwas nicht passt (Vorarbeiten mangelhaft, Planung bedenklich, Arbeiten blockiert): schriftlich und rechtzeitig melden.
   Mit VOB/B: § 4 Abs. 3 (Bedenken) bzw. § 6 Abs. 1 (Behinderung). Ohne VOB/B (BGB-Vertrag, meist Privatkunden) ohne Paragrafen, Inhalt gleich.
   Ergebnis: Brief als PDF (Irrgang-Kopf, Fotos im Anhang), liegt in der Bibliothek; „Senden“ teilt das PDF (iPad/Handy) oder lädt es und öffnet eine Mail.
   Daten: b.schreiben = [{id, art, vob, an, anAdr, bereich, sach, folgen, vorschlag, seit, frist, fotos:[ids], datum, von, versendet:{at,wie}}]
   Der Wortlaut ist ein Vorschlag – vor dem ersten echten Einsatz vom Chef freigeben lassen. */
const BS_ART={bedenken:["Bedenkenanmeldung","§ 4 Abs. 3 VOB/B"],behinderung:["Behinderungsanzeige","§ 6 Abs. 1 VOB/B"]};
const bsListe=b=>(b.schreiben||[]).filter(s=>!s.deleted).sort((x,y)=>(y.datum||"").localeCompare(x.datum||""));
function bsAbschnitt(b){ const L=bsListe(b), ro=!canEdit(b);
  return `<div class="sec-row"><div class="sec-lbl">Bedenken und Behinderungen</div>${ro?"":`<button class="plus-k" data-act="bsNeu" aria-label="Bedenken oder Behinderung melden" title="Bedenken oder Behinderung melden">${icon("add")}</button>`}</div>
    ${L.length?listOf(L.map(s=>`<div class="li" role="button" tabindex="0" data-act="bsAuf" data-id="${esc(s.id)}"><span class="av">${icon(s.art==="behinderung"?"warn":"doc")}</span><span class="lt"><span class="h">${esc(BS_ART[s.art][0])} · ${esc(deDate(s.datum))}</span><span class="s">${esc([s.bereich,s.an].filter(Boolean).join(" · ")||"–")}</span><span class="st">${s.versendet?pill("ok",`versendet ${deDate(new Date(s.versendet.at).toISOString().slice(0,10))}`):pill("open","Entwurf")}</span></span>${icon("chev")}</div>`))
      :`<p class="meta">Vorarbeiten mangelhaft, Planung bedenklich oder Arbeiten blockiert? Mit + schriftlich anmelden – schützt uns bei Gewährleistung und Terminen.</p>`}`; }
let BS_E=null;
function bsWahl(b){ dialog("Was möchtest du melden?",listOf([
  `<div class="li" role="button" tabindex="0" data-act="bsArt" data-v="bedenken"><span class="av">${icon("doc")}</span><span class="lt"><span class="h">Bedenkenanmeldung</span><span class="s">Vorarbeiten, Material oder Planung sind so nicht in Ordnung – z. B. Leitungsweg durch Brandwand, Untergrund nass</span></span>${icon("chev")}</div>`,
  `<div class="li" role="button" tabindex="0" data-act="bsArt" data-v="behinderung"><span class="av">${icon("warn")}</span><span class="lt"><span class="h">Behinderungsanzeige</span><span class="s">Wir können nicht weiterarbeiten – z. B. Trockenbau nicht fertig, kein Zugang, Material des Kunden fehlt</span></span>${icon("chev")}</div>`]),
  `<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button>`); }
/* Fotos der Baustelle (aus den Übergaben) zum Auswählen */
const bsBauFotos=b=>[...new Set(eintraegeVon(b.id).flatMap(e=>e.fotos||[]))].filter(id=>fotoCache.has(id)).slice(0,24);
function bsDialog(b,s,art){ const k=kundeOf(b.kundeId), neu=!s; art=s?s.art:art; const A=BS_ART[art];
  BS_E={bid:b.id,id:s&&s.id,art,vob:s?s.vob!==false:true,fotos:new Set(s?s.fotos||[]:[])};
  const beh=art==="behinderung", F=[...new Set([...bsBauFotos(b),...BS_E.fotos])];
  dialog(neu?A[0]:`${A[0]} vom ${deDate(s.datum)}`,`<div class="fg1">
      <div class="vg-drw"><span>VOB/B vereinbart?</span>${seg("bsVob",BS_E.vob?"ja":"nein",[["ja","Ja"],["nein","Nein / unklar"]])}</div>
      <p class="sup bs-vobh" style="margin:-4px 4px 8px">${BS_E.vob?`Brief verweist auf ${A[1]}.`:"Ohne Paragrafen – bei Privatkunden meist ein BGB-Vertrag. Die Hinweispflicht gilt trotzdem."}</p>
      ${tf("bsAn","An",s?s.an:(k?k.name:""),{form:true,ph:"Auftraggeber, z. B. Familie Schulte oder Architekt"})}
      ${ta("bsAdr","Anschrift",s?s.anAdr:(k?[k.strasse,[k.plz,k.ort].filter(Boolean).join(" ")].filter(Boolean).join("\n"):""),{form:true,ph:"Straße\nPLZ Ort"})}
      ${tf("bsBer","Bereich / Gewerk",s?s.bereich:"",{form:true,ph:beh?"z. B. Trockenbau OG, Treppenhaus":"z. B. Bad OG, Vorwand"})}
      ${ta("bsSach",beh?"Was behindert uns?":"Was haben wir festgestellt?",s?s.sach:"",{form:true,ph:beh?"z. B. Ständerwerk im OG ist noch nicht gestellt, Leitungen können nicht verlegt werden":"z. B. Die vorhandene Zuleitung zum Bad (NYM 3×1,5) ist für den geplanten Durchlauferhitzer nicht ausgelegt"})}
      ${beh?`<div class="reihe2">${tf("bsSeit","Behindert seit",s?s.seit:today(),{form:true,type:"date"})}${tf("bsFrist","Bitte um Abhilfe bis",s?s.frist:"",{form:true,type:"date"})}</div>`
        :tf("bsFrist","Bitte um Entscheidung bis",s?s.frist:"",{form:true,type:"date"})}
      ${ta("bsFolgen",beh?"Auswirkungen (Termine, Kosten)":"Mögliche Folgen",s?s.folgen:"",{form:true,ph:beh?"z. B. Fertigstellung EG verschiebt sich voraussichtlich um eine Woche":"z. B. Überlastung der Leitung, Brandgefahr"})}
      ${ta("bsVor",beh?"Vorschlag (optional)":"Unser Vorschlag (optional)",s?s.vorschlag:"",{form:true,ph:beh?"z. B. Wir setzen in der Zwischenzeit im EG fort":"z. B. Neue Zuleitung 5×6 mm² vom Verteiler, Angebot folgt"})}</div>
    <div class="lbl" style="margin:14px 4px 6px">Fotos (kommen in die Anlage)</div>
    <div class="bs-fotos">${F.map(id=>`<button type="button" class="bs-f" data-act="bsFoto" data-id="${esc(id)}" aria-pressed="${BS_E.fotos.has(id)}"><img src="${fotoCache.get(id)}" alt=""></button>`).join("")}<button type="button" class="bs-f neu" data-act="bsFotoNeu" aria-label="Foto aufnehmen">${icon("cam")}</button></div>
    <input type="file" id="bsFotoIn" accept="image/*" capture="environment" hidden>
    <p class="sup" style="margin:12px 4px 0">Der Text ist ein Vorschlag. Vor dem ersten Versand vom Chef abnehmen lassen.${s&&s.versendet?` Versendet am ${esc(new Date(s.versendet.at).toLocaleDateString("de-DE"))} (${esc(s.versendet.wie)}).`:""}</p>`,
    `${!neu?`<button class="btn-text danger" data-act="bsDel">Löschen</button>`:""}<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="bsOk">Speichern</button><button class="btn-text" data-act="bsSenden">Senden</button>`,{mittel:true}); }
function bsLesen(){ const E=BS_E, b=E&&DB.baustellen.get(E.bid); if(!b) return null; const F=formVals();
  if(!String(F.bsSach||"").trim()){ toast(E.art==="behinderung"?"Bitte beschreiben, was euch behindert":"Bitte beschreiben, was ihr festgestellt habt"); return null; }
  b.schreiben=b.schreiben||[]; let s=E.id&&b.schreiben.find(x=>x.id===E.id);
  if(!s){ s={id:uid(),art:E.art,datum:today(),von:who()}; b.schreiben.push(s); E.id=s.id; }
  Object.assign(s,{vob:E.vob,an:F.bsAn||"",anAdr:F.bsAdr||"",bereich:F.bsBer||"",sach:F.bsSach||"",folgen:F.bsFolgen||"",vorschlag:F.bsVor||"",seit:F.bsSeit||"",frist:F.bsFrist||"",fotos:[...E.fotos]});
  saveRec("baustellen",b); return {b,s}; }
/* Brief als PDF */
async function bsPdf(b,s){ if(!window.jspdf) throw new Error("PDF-Erstellung nicht geladen");
  const {jsPDF}=window.jspdf, d=new jsPDF({unit:"mm",format:"a4"}), W=210,M=22,CW=W-2*M, SIG=[225,29,47],GR=[93,107,123];
  const A=BS_ART[s.art], beh=s.art==="behinderung", k=kundeOf(b.kundeId), o=ortVon(b), P=t=>afPt(t);
  let y=0; const neu=()=>{ d.addPage(); y=24; }, platz=h=>{ if(y+h>275) neu(); };
  try{ d.addImage(LOGO_PDF,"PNG",M,12,57,10); }catch(e){}
  d.setFillColor(...SIG); d.rect(0,28,W,1.2,"F");
  d.setFont("helvetica","normal"); d.setFontSize(7.5); d.setTextColor(...GR); d.text(P("Elektro Irrgang | Hahner Weg 2 | 51545 Waldbröl"),M,42);
  d.setFontSize(10.5); d.setTextColor(20); d.text([P(s.an||(k&&k.name)||""),...String(s.anAdr||"").split("\n").map(P)].filter(Boolean),M,49,{lineHeightFactor:1.35});
  d.setFontSize(9); d.setTextColor(...GR); d.text(P(`Waldbröl, ${deDate(s.datum)}`),W-M,49,{align:"right"});
  if(b.auftragsnr) d.text(P(`Auftrag ${b.auftragsnr}`),W-M,54,{align:"right"});
  y=80; d.setFont("helvetica","bold"); d.setFontSize(12); d.setTextColor(20);
  const betreff=`${A[0]}${s.vob?` gemäß ${A[1]}`:""}`; d.text(P(betreff),M,y); y+=6;
  d.setFont("helvetica","normal"); d.setFontSize(10); d.text(P(`Bauvorhaben: ${[b.name,o&&o.name!==b.name?o.name:"",o&&[o.strasse,o.ort].filter(Boolean).join(", ")].filter(Boolean).join(" – ")}${s.bereich?` | Bereich: ${s.bereich}`:""}`).slice(0,110),M,y); y+=11;
  const abs=(t,fett)=>{ if(!String(t||"").trim()) return; d.setFont("helvetica",fett?"bold":"normal"); d.setFontSize(10); const z=d.splitTextToSize(P(t),CW); for(let i=0;i<z.length;i+=40){ const st=z.slice(i,i+40); platz(st.length*4.8+2); d.text(st,M,y,{lineHeightFactor:1.4}); y+=st.length*4.8; } y+=4; };
  const frist=s.frist?deDate(s.frist):"";
  abs("Sehr geehrte Damen und Herren,");
  if(beh){
    abs("hiermit zeigen wir an, dass wir in der Ausführung unserer Leistungen an dem oben genannten Bauvorhaben behindert sind.");
    abs("Ursache der Behinderung:",true); abs(s.sach);
    if(s.seit) abs(`Die Behinderung besteht seit dem ${deDate(s.seit)}.`);
    if(s.folgen){ abs("Auswirkungen:",true); abs(s.folgen); }
    abs(s.vob?"Die vereinbarten Ausführungsfristen verlängern sich um die Dauer der Behinderung zuzüglich eines angemessenen Zuschlags für die Wiederaufnahme der Arbeiten (§ 6 Abs. 2 und 4 VOB/B). Daraus entstehende Mehrkosten behalten wir uns vor.":"Die vereinbarten Termine verschieben sich um die Dauer der Behinderung. Daraus entstehende Mehrkosten behalten wir uns vor.");
    if(s.vorschlag){ abs("Unser Vorschlag:",true); abs(s.vorschlag); }
    abs(`Wir bitten Sie, die Behinderung${frist?` bis zum ${frist}`:" umgehend"} zu beseitigen. Sobald dies geschehen ist, nehmen wir die Arbeiten unverzüglich wieder auf.`); }
  else {
    abs("bei der Ausführung unserer Arbeiten an dem oben genannten Bauvorhaben haben wir Folgendes festgestellt:");
    abs(s.sach);
    abs(`Gegen die vorgesehene Ausführung melden wir hiermit${s.vob?" gemäß § 4 Abs. 3 VOB/B":""} Bedenken an.`);
    if(s.folgen){ abs("Mögliche Folgen:",true); abs(s.folgen); }
    if(s.vorschlag){ abs("Unser Vorschlag:",true); abs(s.vorschlag); }
    abs(`Bitte teilen Sie uns${frist?` bis zum ${frist}`:" kurzfristig"} schriftlich mit, wie verfahren werden soll. Bis zu Ihrer Entscheidung führen wir die betroffenen Arbeiten nicht aus. Halten Sie an der vorgesehenen Ausführung fest, übernehmen wir für die daraus entstehenden Folgen keine Gewähr.`); }
  abs("Für Rückfragen stehen wir Ihnen gern zur Verfügung.");
  abs("Mit freundlichen Grüßen"); platz(18); y+=6; d.setFont("helvetica","bold"); d.text(P((s.von&&s.von.name)||who().name||""),M,y); y+=5; d.setFont("helvetica","normal"); d.text("Elektro Irrgang",M,y); y+=10;
  if((s.fotos||[]).length){ abs(`Anlage: ${s.fotos.length} Foto${s.fotos.length>1?"s":""}`);
    neu(); d.setFont("helvetica","bold"); d.setFontSize(11); d.text(P(`Anlage – Fotos zur ${A[0]} vom ${deDate(s.datum)}`),M,y); y+=8;
    let x=M; for(const id of s.fotos){ const src=fotoCache.get(id); if(!src) continue; try{ const p=d.getImageProperties(src), h=70, w=Math.min(CW/2-3,h*p.width/p.height); if(x+w>M+CW+0.1){ x=M; y+=h+6; } platz(h+4); d.addImage(src,"JPEG",x,y,w,h); x+=w+6; }catch(e){} } }
  const N=d.getNumberOfPages(); for(let i=1;i<=N;i++){ d.setPage(i); d.setFont("helvetica","normal"); d.setFontSize(7); d.setTextColor(...GR);
    d.text("Elektro Irrgang | Hahner Weg 2 | 51545 Waldbröl | Tel. 02291 4878 | info@elektro-irrgang.de",M,288); d.text(`Seite ${i} von ${N}`,W-M,288,{align:"right"}); }
  return d.output("blob"); }
const bsName=(b,s)=>afPt(`${BS_ART[s.art][0]} ${deDate(s.datum)} ${(kundeOf(b.kundeId)||{}).name||""} ${b.name}`).replace(/[\\/:*?"<>|]+/g," ").replace(/\s+/g," ").trim();
async function bsAblegenUndSenden(){ const r=bsLesen(); if(!r) return; const {b,s}=r; closeOverlays();
  const fehlt=(s.fotos||[]).filter(id=>!fotoCache.has(id)); if(fehlt.length&&typeof fotoFetch==="function"){ fotoFetch(fehlt); toast("Fotos werden noch geladen – gleich noch einmal tippen"); return; }
  let blob; try{ blob=await bsPdf(b,s); }catch(e){ console.error(e); toast("PDF konnte nicht erstellt werden"); return; }
  const name=bsName(b,s)+".pdf";
  try{ await protAblegenB({art:BS_ART[s.art][0],titel:[kundeOf(b.kundeId)&&kundeOf(b.kundeId).name,b.name].filter(Boolean).join(" · "),name:bsName(b,s),datum:s.datum,auftragsnr:b.auftragsnr||"",baustelleId:b.id,kundeId:b.kundeId||"",standortId:b.standortId||"",demo:!!b.demo},blob); }catch(e){}
  const k=kundeOf(b.kundeId), file=new File([blob],name,{type:"application/pdf"}); let wie="";
  if(navigator.canShare&&navigator.canShare({files:[file]})){ try{ await navigator.share({files:[file],title:BS_ART[s.art][0]}); wie="geteilt"; }catch(e){ if(e&&e.name==="AbortError"){ render(); toast("Im Ordner abgelegt – noch nicht versendet"); return; } } }
  if(!wie){ saveFile(blob,name); if(k&&k.mail){ location.href=`mailto:${encodeURIComponent(k.mail)}?subject=${encodeURIComponent(`${BS_ART[s.art][0]} – ${b.name}`)}&body=${encodeURIComponent(`Sehr geehrte Damen und Herren,\n\nanbei erhalten Sie unsere ${BS_ART[s.art][0]} zum Bauvorhaben ${b.name}.\n\nMit freundlichen Grüßen\n${who().name||""}\nElektro Irrgang\nTel. 02291 4878`)}`; } wie="E-Mail"; }
  s.versendet={at:Date.now(),wie,von:who().name||""}; saveRec("baustellen",b); render();
  toast(wie==="E-Mail"?"PDF geladen – bitte an die E-Mail anhängen":"Versendet und in der Bibliothek abgelegt","Rückgängig",()=>{ delete s.versendet; saveRec("baustellen",b); render(); }); }
document.addEventListener("click",async e=>{ const el=e.target.closest&&e.target.closest('[data-act^="bs"]'); if(!el||!/^bs[A-Z]/.test(el.dataset.act)) return;
  const b=nav.v==="baustelle"&&DB.baustellen.get(nav.id); if(!b) return; e.stopPropagation(); const a=el.dataset.act;
  if(a==="bsAuf"){ const s=(b.schreiben||[]).find(x=>x.id===el.dataset.id); if(s) bsDialog(b,s); return; }
  if(!canEdit(b)) return;
  if(a==="bsNeu"){ bsWahl(b); return; }
  if(a==="bsArt"){ bsDialog(b,null,el.dataset.v); return; }
  if(a==="bsVob"){ BS_E.vob=el.dataset.v==="ja"; el.parentElement.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x===el)));
    const h=document.querySelector(".bs-vobh"); if(h) h.textContent=BS_E.vob?`Brief verweist auf ${BS_ART[BS_E.art][1]}.`:"Ohne Paragrafen – bei Privatkunden meist ein BGB-Vertrag. Die Hinweispflicht gilt trotzdem."; return; }
  if(a==="bsFoto"){ const id=el.dataset.id; BS_E.fotos.has(id)?BS_E.fotos.delete(id):BS_E.fotos.add(id); el.setAttribute("aria-pressed",String(BS_E.fotos.has(id))); return; }
  if(a==="bsFotoNeu"){ document.getElementById("bsFotoIn")?.click(); return; }
  if(a==="bsOk"){ if(bsLesen()){ closeOverlays(); render(); toast("Gespeichert – noch nicht versendet"); } return; }
  if(a==="bsSenden"){ bsAblegenUndSenden(); return; }
  if(a==="bsDel"){ const s=BS_E&&(b.schreiben||[]).find(x=>x.id===BS_E.id); closeOverlays(); if(!s) return; s.deleted=true; saveRec("baustellen",b); render(); toast("Gelöscht","Rückgängig",()=>{ delete s.deleted; saveRec("baustellen",b); render(); }); return; } },true);
document.addEventListener("change",async e=>{ if(e.target.id!=="bsFotoIn") return; const f=e.target.files[0]; e.target.value=""; if(!f||!BS_E) return;
  let data; try{ data=await fotoVerkleinern(f); }catch(x){ toast("Das Bild konnte nicht gelesen werden"); return; }
  const id=uid(); await fotoPut(id,data); fotoQueue(id); BS_E.fotos.add(id);
  const w=document.querySelector(".bs-fotos"), neu=w&&w.querySelector(".bs-f.neu"); if(neu) neu.insertAdjacentHTML("beforebegin",`<button type="button" class="bs-f" data-act="bsFoto" data-id="${esc(id)}" aria-pressed="true"><img src="${data}" alt=""></button>`); });
