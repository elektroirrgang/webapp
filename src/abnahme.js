/* ===== Abnahmeprotokoll (Baustelle, 04.11.2026) – dritter Reiter einer Baustelle =====
   Zum Abschluss: was gemacht wurde, was noch offen ist, Mängel, Einweisung und übergebene Unterlagen – Kunde und Monteur unterschreiben am iPad.
   „Speichern“ legt das PDF wie das Aufnahmeprotokoll in der Bibliothek ab (Kundenordner › Baustellenberichte).
   Daten: b.abnahme = {v:{…}, sigK, sigKName, sigM, sigMName, sigDatum, pdf:[…]} */
const ABN=[
  {id:"rahmen",t:"Abnahme",f:[
    {k:"datum",t:"date",l:"Datum"},
    {k:"art",t:"seg",l:"Art der Abnahme",o:["Gesamtabnahme","Teilabnahme"]},
    {k:"teil",t:"text",l:"Welcher Teil?",ph:"z. B. Erdgeschoss, Zählerschrank",wenn:v=>v.art==="Teilabnahme"},
    {k:"anwesend",t:"text",l:"Anwesend",ph:"z. B. Frau Schulte, Herr Becker (Architekt)"}]},
  {id:"leistung",t:"Ausgeführte Leistungen",uebern:true,f:[{k:"leistung",t:"area",l:"Was wurde gemacht?",gross:true,ph:"z. B. Zählerschrank erneuert, 12 Steckdosen und 6 Lichtauslässe im EG, Wallbox in der Garage"}]},
  {id:"offen",t:"Restarbeiten",f:[
    {k:"restJa",t:"seg",l:"Gibt es noch Restarbeiten?",o:["Nein","Ja"]},
    {k:"rest",t:"area",l:"Restarbeiten",ph:"z. B. Abdeckrahmen Küche nach Fliesenarbeiten",wenn:v=>v.restJa==="Ja"},
    {k:"restBis",t:"date",l:"Erledigt bis (geplant)",wenn:v=>v.restJa==="Ja"}]},
  {id:"maengel",t:"Mängel",f:[
    {k:"mJa",t:"seg",l:"Mängel bei der Abnahme",o:["Keine","Mängel vorhanden"]},
    {k:"m",t:"area",l:"Mängel",ph:"z. B. Steckdose Bad schief gesetzt – wird bis 15.11. getauscht",wenn:v=>v.mJa==="Mängel vorhanden"}]},
  {id:"einw",t:"Einweisung und Unterlagen",liste:["Ja","Nein","entfällt"],f:[
    {k:"eBed",l:"Einweisung in die Bedienung erfolgt"},{k:"eFi",l:"Prüftaste der Fehlerstromschutzschalter erklärt (alle 6 Monate)"},
    {k:"uProt",l:"Prüfprotokoll übergeben"},{k:"uLeg",l:"Verteilerlegende im Verteiler"},{k:"uAnl",l:"Bedienungsanleitungen übergeben"},{k:"uPass",l:"Anlagenpass übergeben"}]},
  {id:"bem",t:"Bemerkungen",f:[{k:"bem",t:"area",l:"Bemerkungen (optional)"}]},
  {id:"sig",t:"Unterschriften",sig:true,f:[]}];
const abDaten=b=>{ if(!b.abnahme) b.abnahme={v:{}}; b.abnahme.v=b.abnahme.v||{}; return b.abnahme; };
const abFeld=(f,v,ro)=>afFeld(f,v,ro).replace(/data-af=/g,"data-ab=").replace(/id="af_/g,'id="ab_').replace(/for="af_/g,'for="ab_').replace(/data-act="afSeg"/g,'data-act="abSeg"');
function abStand(sec,a){ if(sec.sig) return [(a.sigK?1:0)+(a.sigM?1:0),2]; const F=sec.f.filter(f=>afSichtbar(f,a.v)); return [F.filter(f=>afVoll(a.v[f.k])).length,F.length]; }
function abnahmeView(b){ const a=abDaten(b), v=a.v, ro=!canEdit(b), k=kundeOf(b.kundeId);
  if(!v.datum&&!ro){ v.datum=today(); v.art=v.art||"Gesamtabnahme"; }
  let h=`<div class="af-kopf"><span>${a.sigK?`Vom Kunden unterschrieben am ${esc(deDate(a.sigDatum||""))}`:"Zum Abschluss mit dem Kunden durchgehen und unterschreiben lassen."}</span>
    ${a.pdf&&a.pdf.length?`<span class="af-pdfinfo">${icon("folder")}Zuletzt gespeichert ${esc(new Date(a.pdf[a.pdf.length-1].at).toLocaleString("de-DE",{dateStyle:"short",timeStyle:"short"}))}</span>`:""}</div><div class="af-grid">`;
  for(const sec of ABN){ const [x,y]=abStand(sec,a), kl=x===0?"open":x>=y?"ok":"wip";
    h+=`<section class="card af-sec${sec.liste||sec.sig||sec.uebern?" wide":""}"><div class="af-h"><h3>${esc(sec.t)}</h3><span class="pill ${kl}" data-abp="${sec.id}">${x} / ${y}</span></div>`;
    if(sec.liste) h+=`<div class="af-liste">${sec.f.map(f=>`<div class="af-row"><span>${esc(f.l)}</span>${seg("abSeg",v[f.k]||"",sec.liste.map(o=>[o,o])).replace(/data-act="abSeg"/g,`data-act="abSeg" data-k="${f.k}"${ro?" disabled":""}`)}</div>`).join("")}</div>`;
    else if(sec.sig){ const box=(w,t,src,nm)=>`<div class="ab-sigbox">${src?`<img src="${src}" alt="Unterschrift ${t}"><span>${esc(nm||"")}</span>`:`<span class="meta">${t}: noch nicht unterschrieben</span>`}${ro?"":`<button class="btn-tonal" data-act="abSig" data-v="${w}">${icon("edit")}${src?"Neu unterschreiben":`Unterschrift ${t}`}</button>`}</div>`;
      h+=`${ro?"":`<div class="fg"><div class="tf fl"><input id="ab_kname" data-ab="kname" value="${esc(v.kname||(k&&k.ansprech)||"")}" placeholder=" " autocomplete="off"><label for="ab_kname">Name des Kunden / Auftraggebers</label></div></div>`}
        <div class="ab-sigs">${box("k","Kunde",a.sigK,a.sigKName)}${box("m","Monteur",a.sigM,a.sigMName)}</div>
        <p class="sup" style="margin:10px 2px 0">Mit seiner Unterschrift erklärt der Kunde die Abnahme der aufgeführten Leistungen. Restarbeiten und Mängel sind oben festgehalten.</p>`; }
    else { if(sec.uebern&&!ro) h+=`<button class="btn-text ab-uebern" data-act="abUebern">${icon("sync")}Aus den Übergaben übernehmen</button>`; h+=`<div class="fg">${sec.f.filter(f=>afSichtbar(f,v)).map(f=>abFeld(f,v,ro)).join("")}</div>`; }
    h+=`</section>`; }
  const P=(typeof PROT_B==="function"?PROT_B():[]).filter(x=>x.baustelleId===b.id&&x.art==="Abnahmeprotokoll");
  h+=`</div><div class="af-fuss"><span class="meta">${P.length?`${P.length} Fassung${P.length>1?"en":""} in der Bibliothek`:"Eingaben werden automatisch gesichert."}</span>${ro?"":`<button class="btn-filled" data-act="abPdf">${icon("done")}Speichern</button>`}</div>`;
  return h; }
const abB=()=>nav.v==="baustelle"&&nav.tab==="abnahme"?DB.baustellen.get(nav.id):null;
function abPills(b){ const a=abDaten(b); ABN.forEach(sec=>{ const e=document.querySelector(`[data-abp="${sec.id}"]`); if(!e) return; const [x,y]=abStand(sec,a); e.textContent=`${x} / ${y}`; e.className=`pill ${x===0?"open":x>=y?"ok":"wip"}`; }); }
document.addEventListener("input",e=>{ const el=e.target.closest&&e.target.closest("[data-ab]"); if(!el) return; const b=abB(); if(!b||!canEdit(b)) return; abDaten(b).v[el.dataset.ab]=el.value; afSpeichern(b); abPills(b); });
document.addEventListener("click",e=>{ const el=e.target.closest&&e.target.closest('[data-act^="ab"]'); if(!el||!/^ab[A-Z]/.test(el.dataset.act)) return; const b=abB(); if(!b) return; e.stopPropagation();
  if(!canEdit(b)) return; const a=abDaten(b), act=el.dataset.act, neu=()=>{ const y=scrollY; render(); scrollTo(0,y); };
  if(act==="abSeg"){ const k=el.dataset.k; a.v[k]=a.v[k]===el.dataset.v?"":el.dataset.v; afSpeichern(b,true); neu(); return; }
  if(act==="abUebern"){ const E=eintraegeVon(b.id).slice().sort((x,y)=>String(x.datum||"").localeCompare(String(y.datum||""))), L=E.filter(x=>String(x.stand||"").trim());
    if(!L.length){ toast("Noch keine Übergaben mit „Stand“"); return; }
    a.v.leistung=L.map(x=>`- ${deDate(x.datum)}: ${String(x.stand).trim().replace(/\n+/g,"; ")}`).join("\n");
    const o=(E[E.length-1]||{}).offen; if(o&&String(o).trim()&&!a.v.rest){ a.v.restJa="Ja"; a.v.rest=String(o).trim(); }
    afSpeichern(b,true); neu(); toast("Aus den Übergaben übernommen – bitte kurz prüfen und kürzen"); return; }
  if(act==="abSig"){ abUnterschrift(b,el.dataset.v); return; }
  if(act==="abPdf"){ abPdf(b); return; } },true);
function abUnterschrift(b,wer){ const a=abDaten(b), kunde=wer==="k", nm=kunde?(a.v.kname||"").trim():(who().name||"");
  if(kunde&&!nm){ toast("Bitte zuerst den Namen des Kunden eintragen"); document.getElementById("ab_kname")?.focus(); return; }
  const el=document.createElement("div"); el.className="af-sigvoll";
  el.innerHTML=`<div class="af-sigk"><button class="btn-text" data-s="weg">Abbrechen</button><b>Unterschrift ${kunde?"Kunde":"Monteur"}</b><button class="btn-text" data-s="leer">Löschen</button><button class="btn-filled sm" data-s="ok">Übernehmen</button></div>
    <div class="af-sigf"><canvas></canvas><div class="af-sigl"></div><p>${esc(nm)}${nm?" · ":""}mit dem Finger oder Stift unterschreiben</p></div>`;
  document.body.appendChild(el); document.body.style.overflow="hidden";
  const c=el.querySelector("canvas"), dpr=devicePixelRatio||1; c.width=c.offsetWidth*dpr; c.height=c.offsetHeight*dpr;
  const x=c.getContext("2d"); x.lineWidth=2.8*dpr; x.lineCap="round"; x.lineJoin="round"; x.strokeStyle="#14202c";
  let an=false,last=null,tinte=false; const pos=ev=>{ const r=c.getBoundingClientRect(); return [(ev.clientX-r.left)*dpr,(ev.clientY-r.top)*dpr]; };
  c.addEventListener("pointerdown",ev=>{ an=true; last=pos(ev); c.setPointerCapture(ev.pointerId); ev.preventDefault(); });
  c.addEventListener("pointermove",ev=>{ if(!an) return; const p=pos(ev); x.beginPath(); x.moveTo(...last); x.lineTo(...p); x.stroke(); last=p; tinte=true; });
  c.addEventListener("pointerup",()=>an=false); c.addEventListener("pointercancel",()=>an=false);
  const zu=()=>{ el.remove(); document.body.style.overflow=""; };
  el.addEventListener("click",ev=>{ const s=ev.target.closest("[data-s]"); if(!s) return; ev.stopPropagation();
    if(s.dataset.s==="weg") zu(); else if(s.dataset.s==="leer"){ x.clearRect(0,0,c.width,c.height); tinte=false; }
    else { if(!tinte){ toast("Bitte erst unterschreiben"); return; }
      const o=document.createElement("canvas"); o.width=c.width; o.height=c.height; const ox=o.getContext("2d"); ox.fillStyle="#fff"; ox.fillRect(0,0,o.width,o.height); ox.drawImage(c,0,0);
      const sig=o.toDataURL("image/jpeg",0.8); if(kunde){ a.sigK=sig; a.sigKName=nm; } else { a.sigM=sig; a.sigMName=nm; } a.sigDatum=today();
      afSpeichern(b,true); zu(); const y=scrollY; render(); scrollTo(0,y); toast("Unterschrift übernommen"); } }); }
async function abPdf(b){
  if(!window.jspdf){ toast("PDF-Erstellung nicht geladen"); return; }
  const a=abDaten(b), v=a.v, k=kundeOf(b.kundeId), s=ortVon(b);
  if(!a.sigK&&!confirmOhne(b)) return;
  const {jsPDF}=window.jspdf, d=new jsPDF({unit:"mm",format:"a4"}), W=210,M=14,CW=W-2*M, SIG=[225,29,47],GR=[93,107,123],LINE=[211,218,227],SUNK=[238,241,245];
  let y=0;
  const head=()=>{ try{ d.addImage(LOGO_PDF,"PNG",M,6,57,10); }catch(e){}
    d.setTextColor(34,34,34); d.setFont("helvetica","bold"); d.setFontSize(13); d.text("Abnahmeprotokoll",W-M,11,{align:"right"});
    d.setFont("helvetica","normal"); d.setFontSize(8); d.setTextColor(...GR); d.text(afPt([k&&k.name,b.name].filter(Boolean).join(" | ")).slice(0,95),W-M,17,{align:"right"});
    d.setFillColor(...SIG); d.rect(0,24,W,1.4,"F"); y=34; };
  const platz=h=>{ if(y+h>280){ d.addPage(); head(); } };
  const sec=t=>{ platz(16); d.setFillColor(...SUNK); d.rect(M,y-4.5,CW,7,"F"); d.setFillColor(...SIG); d.rect(M,y-4.5,1.2,7,"F"); d.setTextColor(34,34,34); d.setFont("helvetica","bold"); d.setFontSize(9.5); d.text(afPt(t),M+4,y); y+=8; };
  const kv=prs=>{ d.setFontSize(8.5); prs.filter(p=>p[1]).forEach(([l,w])=>{ const z=d.splitTextToSize(afPt(w),CW-58); platz(z.length*3.7+4); d.setFont("helvetica","normal"); d.setTextColor(...GR); d.text(afPt(l),M,y); d.setFont("helvetica","bold"); d.setTextColor(20); d.text(z,M+58,y,{lineHeightFactor:1.15}); const ex=(z.length-1)*3.7; d.setDrawColor(...LINE); d.line(M,y+ex+1.9,M+CW,y+ex+1.9); y+=ex+6.1; }); y+=2; };
  const lang=t=>{ if(!String(t||"").trim()) return; d.setFontSize(9); d.setFont("helvetica","normal"); d.setTextColor(20); const z=d.splitTextToSize(afPt(t),CW); for(let i=0;i<z.length;i+=20){ const st=z.slice(i,i+20); platz(st.length*4.2+2); d.text(st,M,y); y+=st.length*4.2; } y+=4; };
  head();
  sec("Auftrag");
  kv([["Kunde / Auftraggeber",k&&k.name],["Objekt",[s&&s.name,s&&[s.strasse,[s.plz,s.ort].filter(Boolean).join(" ")].filter(Boolean).join(", ")].filter(Boolean).join(", ")],["Baustelle",b.name],["Auftrag",b.auftragsnr],
    ["Datum der Abnahme",deDate(v.datum||"")],["Art",v.art==="Teilabnahme"?`Teilabnahme${v.teil?`: ${v.teil}`:""}`:v.art],["Anwesend",v.anwesend]]);
  if(String(v.leistung||"").trim()){ sec("Ausgeführte Leistungen"); lang(v.leistung); }
  sec("Restarbeiten"); if(v.restJa==="Ja"){ lang(v.rest||"-"); if(v.restBis) kv([["Erledigt bis (geplant)",deDate(v.restBis)]]); } else lang(v.restJa==="Nein"?"Keine Restarbeiten.":"-");
  sec("Mängel"); lang(v.mJa==="Mängel vorhanden"?(v.m||"Mängel vorhanden"):v.mJa==="Keine"?"Bei der Abnahme wurden keine Mängel festgestellt.":"-");
  const E=ABN.find(x=>x.id==="einw").f.filter(f=>v[f.k]); if(E.length){ sec("Einweisung und Unterlagen"); kv(E.map(f=>[f.l,v[f.k]])); }
  if(String(v.bem||"").trim()){ sec("Bemerkungen"); lang(v.bem); }
  sec("Abnahme"); lang("Mit seiner Unterschrift erklärt der Auftraggeber die Abnahme der oben aufgeführten Leistungen (§ 640 BGB). Festgehaltene Restarbeiten und Mängel werden von Elektro Irrgang erledigt.");
  platz(40); const yy=y;
  [[a.sigK,`Auftraggeber: ${a.sigKName||v.kname||""}`,M],[a.sigM,`Elektro Irrgang: ${a.sigMName||""}`,M+CW/2+4]].forEach(([sig,t,x])=>{ if(sig){ try{ d.addImage(sig,"JPEG",x,yy,60,22); }catch(e){} }
    d.setDrawColor(150); d.line(x,yy+24,x+80,yy+24); d.setFont("helvetica","normal"); d.setFontSize(8); d.setTextColor(...GR); d.text(afPt(t),x,yy+28); });
  d.text(afPt(`Datum: ${deDate(a.sigDatum||v.datum||"")}`),M,yy+33); y=yy+38;
  const N=d.getNumberOfPages(); for(let i=1;i<=N;i++){ d.setPage(i); d.setDrawColor(...LINE); d.line(M,284,W-M,284); d.setFont("helvetica","normal"); d.setFontSize(7); d.setTextColor(...GR);
    d.text("Elektro Irrgang | Hahner Weg 2 | 51545 Waldbröl | Tel. 02291 4878 | info@elektro-irrgang.de",M,288);
    d.text(afPt(`Abnahme vom ${deDate(v.datum||"")}${b.auftragsnr?` | Auftrag ${b.auftragsnr}`:""}`),M,292); d.text(`Seite ${i} von ${N}`,W-M,292,{align:"right"}); }
  const blob=d.output("blob"), name=afPt(`Abnahme ${deDate(v.datum||today())} ${k?k.name:""} ${b.name}`).replace(/[\\/:*?"<>|]+/g," ").replace(/\s+/g," ").trim();
  a.pdf=[...(a.pdf||[]),{at:Date.now(),von:who().name}]; afSpeichern(b,true);
  const fz=PROT_B().filter(x=>x.baustelleId===b.id&&x.art==="Abnahmeprotokoll").length+1;
  let x=null; try{ x=await protAblegenB({art:"Abnahmeprotokoll",titel:[k&&k.name,b.name].filter(Boolean).join(" · "),name,datum:v.datum||today(),auftragsnr:b.auftragsnr||"",
    baustelleId:b.id,kundeId:b.kundeId||"",standortId:b.standortId||"",fassung:fz,unterschrift:!!a.sigK,demo:!!b.demo},blob); }catch(e){}
  const y0=scrollY; render(); scrollTo(0,y0);
  if(x) toast(fz>1?`Gespeichert – Fassung ${fz} liegt in der Bibliothek`:"Gespeichert – das Abnahmeprotokoll liegt in der Bibliothek","Ansehen",()=>pvOeffnen(x.id)); else toast("Gespeichert. Ablage in der Bibliothek fehlgeschlagen"); }
/* ohne Unterschrift des Kunden: einmal nachfragen (zweites Tippen speichert trotzdem, z. B. als Entwurf) */
let AB_OHNE=0;
function confirmOhne(b){ if(Date.now()-AB_OHNE<6000){ AB_OHNE=0; return true; } AB_OHNE=Date.now(); toast("Der Kunde hat noch nicht unterschrieben – noch einmal „Speichern“ tippen, um es trotzdem abzulegen"); return false; }
