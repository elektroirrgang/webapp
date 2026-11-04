/* ===== Prüffristen-Radar (Übersicht, 04.11.2026) =====
   Sammelt alle wiederkehrenden Prüfungen aus den Apps an einer Stelle, nach Kunde gruppiert:
   - EVSE: letzte Prüfung je Standort/Ladepark, Frist aus „Nächste Prüfung“ (p.a.naechste)
   - Gebäudetechnik: letzte abgeschlossene Prüfung je Objekt und Art (Anlage 48 Monate, Geräte 12 Monate, sonst pr.fristM)
   - Maschinen (Anlagen): letzte Prüfung + Frist der Maschine
   Je Kunde: Anrufen und ein fertiges Anschreiben (öffnet das Mailprogramm – gesendet wird nur von Hand).
   „Angeschrieben“ wird am Kunden gemerkt (k.fristKontakt = {datum, wer}), damit nicht zwei Leute denselben Kunden anschreiben. */
const FR_ART={evse:["Ladeinfrastruktur","ev"],anlage:["Elektroinstallation","home"],geraete:["Geräteprüfung (DGUV V3)","geraet"],masch:["Maschine","anMasch"]};
const frPlus=(iso,m)=>{ const d=new Date(iso+"T12:00"); d.setMonth(d.getMonth()+(+m||0)); return d.toISOString().slice(0,10); };
const frOrtName=ortId=>{ const id=String(ortId||""); if(id.startsWith("k:")){ const k=kundeOf(id.slice(2)); return k?adrText(k)||"":""; } const s=standortOf(id); return s?[s.name,s.ort].filter(Boolean).join(", "):""; };
function frListe(){ const L=[];
  /* EVSE */
  if(typeof faellig==="function") faellig().forEach(p=>{ const s=standortOf(p.standortId), l=ladeparkOf(p.ladeparkId);
    L.push({key:"evse|"+p.standortId+"|"+(p.ladeparkId||""),art:"evse",kundeId:p.kundeId,ort:[s&&s.name,l&&l.name].filter(Boolean).join(" › "),faellig:p.a.naechste,zuletzt:p.p&&p.p.datum||""}); });
  /* Gebäudetechnik */
  if(DB.echecks){ const M=new Map(), laeuft=new Set();
    for(const e of live("echecks")){ if(e.demo&&typeof demoDa==="function"&&!demoDa()) continue; const art=e.art||"anlage"; if(art==="netz") continue; const k=e.ortId+"|"+art;
      if(e.status!=="fertig"){ laeuft.add(k); continue; }
      const q=M.get(k), d=e.fertigAm||e.datum||""; if(!q||d>(q.fertigAm||q.datum||"")) M.set(k,e); }
    M.forEach((e,k)=>{ if(laeuft.has(k)) return; const art=e.art||"anlage", d=e.fertigAm||e.datum; if(!d) return;
      const kid=e.kundeId||(String(e.ortId).startsWith("k:")?String(e.ortId).slice(2):(standortOf(e.ortId)||{}).kundeId);
      L.push({key:"ec|"+k,art,kundeId:kid,ort:frOrtName(e.ortId),faellig:frPlus(d,e.fristM||(art==="anlage"?48:12)),zuletzt:d}); }); }
  /* Maschinen */
  if(DB.anlagen&&typeof anFaellig==="function") for(const m of live("anlagen")){ if(!+m.fristM) continue; const l=anLetzte(m);
    L.push({key:"an|"+m.id,art:"masch",kundeId:m.kundeId,ort:anMName(m),faellig:l?frPlus(l.datum,m.fristM):"",zuletzt:l?l.datum:"",nie:!l}); }
  return L.filter(x=>x.kundeId&&kundeOf(x.kundeId)).sort((a,b)=>(a.faellig||"0000").localeCompare(b.faellig||"0000")); }
const frStand=x=>{ const t=today(); if(x.nie||!x.faellig) return ["bad","noch nie geprüft"]; if(x.faellig<t) return ["bad","überfällig"];
  return x.faellig<=frPlus(t,3)?["wip","bald fällig"]:["ok","später"]; };
const frMonat=iso=>iso?new Date(iso+"T12:00").toLocaleDateString("de-DE",{month:"long",year:"numeric"}):"";
let FR_FILTER="3";
function frGefiltert(){ const t=today(), bis=FR_FILTER==="alle"?"9999":frPlus(t,+FR_FILTER); return frListe().filter(x=>x.nie||!x.faellig||x.faellig<=bis); }
/* Zahlen für die Kachel auf der Startseite */
function frZahlen(){ const L=frListe(), t=today(), b=frPlus(t,3); return {ueber:L.filter(x=>x.nie||x.faellig<t).length,bald:L.filter(x=>!x.nie&&x.faellig>=t&&x.faellig<=b).length,L}; }
function frKarten(){ const q=String(query||"").trim(), G=new Map();
  frGefiltert().filter(x=>{ if(!q) return true; const k=kundeOf(x.kundeId)||{}; return suPasst(q,k.name,adrText(k),x.ort,(FR_ART[x.art]||[""])[0],deDate(x.faellig)); })
    .forEach(x=>{ if(!G.has(x.kundeId)) G.set(x.kundeId,[]); G.get(x.kundeId).push(x); });
  return G.size?[...G.entries()].map(frKarte).join(""):`<p class="meta" style="margin:16px 4px">${q?`Nichts gefunden für „${esc(q)}“.`:FR_FILTER==="alle"?"Noch keine wiederkehrenden Prüfungen erfasst.":"In diesem Zeitraum ist nichts fällig."}</p>`; }
SU_LISTE.fristen=frKarten;
function fristenView(){ const z=frZahlen();
  const chip=(v,txt)=>`<button type="button" class="chip" data-act="frFilter" data-v="${v}" aria-pressed="${FR_FILTER===v}">${txt}</button>`;
  return `<div class="narrow fr">
    <div class="fr-kpis"><div class="fr-kpi${z.ueber?" bad":""}"><b>${z.ueber}</b><span>überfällig</span></div><div class="fr-kpi"><b>${z.bald}</b><span>in 3 Monaten</span></div><div class="fr-kpi"><b>${new Set(z.L.map(x=>x.kundeId)).size}</b><span>Kunden mit Frist</span></div></div>
    ${searchBar("Kunde, Ort, Prüfung")}
    <div class="chips ec-wahl fr-filter">${chip("3","Nächste 3 Monate")}${chip("6","6 Monate")}${chip("12","12 Monate")}${chip("alle","Alle")}</div>
    <div id="res">${frKarten()}</div>
    <p class="hint">Fristen aus EVSE („Nächste Prüfung“), Gebäudetechnik (Installation 4 Jahre, Geräte 1 Jahr oder die Frist der Prüfung) und den Maschinen. „Anschreiben“ öffnet dein Mailprogramm mit einem fertigen Text – gesendet wird erst, wenn du auf Senden tippst.</p></div>`; }
function frKarte([kid,X]){ const k=kundeOf(kid), tel=(typeof telefoneVon==="function"?telefoneVon(k)[0]||{}:{}).nr||k.tel||"", fk=k.fristKontakt, schlimm=X.some(x=>frStand(x)[0]==="bad");
    return `<section class="fr-k${schlimm?" bad":""}">
      <button type="button" class="fr-kopf" data-act="nav" data-v="kunde" data-id="${esc(kid)}"><span class="lt"><b>${esc(k.name)}</b><span>${esc(adrText(k)||"")}</span></span>${icon("chev")}</button>
      <div class="fr-zeilen">${X.map(x=>{ const [kl,txt]=frStand(x), a=FR_ART[x.art]||["Prüfung","doc"];
        const ort=x.ort&&x.ort!==adrText(k)&&x.ort!==k.name?x.ort:"";
        return `<div class="fr-z"><span class="av">${icon(a[1])}</span><span class="lt"><span class="h">${esc(a[0])}</span><span class="s">${esc([ort,x.zuletzt?`zuletzt ${deDate(x.zuletzt)}`:""].filter(Boolean).join(" · "))}</span></span>
          <span class="fr-d"><b>${x.nie||!x.faellig?"–":esc(deDate(x.faellig))}</b>${pill(kl,txt)}</span></div>`; }).join("")}</div>
      ${fk&&fk.datum?`<p class="fr-info">${icon("mail")}Angeschrieben am ${esc(deDate(fk.datum))}${fk.wer?` von ${esc(fk.wer)}`:""}</p>`:""}
      <div class="fr-knoepfe">${tel?`<a class="fr-b" href="tel:${esc(tel.replace(/[^\d+]/g,""))}">${icon("phone")}<span>Anrufen</span></a>`:`<span class="fr-b aus">${icon("phone")}<span>Keine Nummer</span></span>`}
        ${k.mail?`<button type="button" class="fr-b haupt" data-act="frMail" data-id="${esc(kid)}">${icon("mail")}<span>${fk&&fk.datum?"Erneut anschreiben":"Anschreiben"}</span></button>`:`<button type="button" class="fr-b aus" data-act="nav" data-v="kunde" data-id="${esc(kid)}">${icon("mail")}<span>Keine E-Mail</span></button>`}</div></section>`; }
/* Anschreiben: förmlich, je nach Kundenart mit oder ohne Hinweis auf Betreiberpflichten */
function frMailText(k,X){ const priv=typeof kdArt==="function"?kdArt(k)==="privat":true, an=typeof kdAnrede==="function"?kdAnrede(k):"";
  const anrede=priv&&an&&k.nachname?`Sehr geehrte${an==="Herr"?"r":""} ${an} ${k.nachname},`:"Sehr geehrte Damen und Herren,";
  const FR_MAIL={evse:"Prüfung der Ladeeinrichtung",anlage:"Prüfung der Elektroinstallation",geraete:"Prüfung der ortsveränderlichen Geräte (DGUV Vorschrift 3)",masch:"Prüfung der Maschine"}, adr=adrText(k)||"";
  const zeile=x=>{ const a=FR_MAIL[x.art]||"Prüfung", t=today(); x={...x,ort:x.ort&&x.ort!==adr?x.ort:""}; const wann=x.nie||!x.faellig?"bisher nicht geprüft":x.faellig<t?`fällig seit ${frMonat(x.faellig)}`:`fällig im ${frMonat(x.faellig)}`;
    return `- ${a}${x.ort?` – ${x.ort}`:""}: ${x.zuletzt?`zuletzt geprüft am ${deDate(x.zuletzt)}, `:""}${wann}`; };
  const grund=priv?"Eine regelmäßige Prüfung erhält die Sicherheit Ihrer elektrischen Anlage und deckt Schäden auf, bevor etwas passiert."
    :"Als Betreiber sind Sie nach DGUV Vorschrift 3 und der Betriebssicherheitsverordnung zu wiederkehrenden Prüfungen verpflichtet. Das Prüfprotokoll dient Ihnen zugleich als Nachweis gegenüber Versicherung und Berufsgenossenschaft.";
  const ich=ME.name||(META.profil&&META.profil.name)||"";
  const body=`${anrede}\n\nfür Ihre Anlage${X.length>1?"n":""} steht die nächste wiederkehrende Prüfung an:\n\n${X.map(zeile).join("\n")}\n\n${grund}\n\nGern vereinbaren wir einen Termin. Antworten Sie einfach auf diese E-Mail oder rufen Sie uns unter 02291 4878 an.\n\nMit freundlichen Grüßen\n${ich?ich+"\n":""}Elektro Irrgang\nHahner Weg 2 · 51545 Waldbröl\nTel. 02291 4878 · info@elektro-irrgang.de`;
  return {betreff:`Wiederkehrende Prüfung Ihrer elektrischen Anlage${X.length>1?"n":""} – Terminvereinbarung`,body}; }
function frMail(kid){ const k=kundeOf(kid); if(!k||!k.mail) return; const X=frListe().filter(x=>x.kundeId===kid&&(x.nie||!x.faellig||x.faellig<=frPlus(today(),FR_FILTER==="alle"?24:+FR_FILTER)));
  const {betreff,body}=frMailText(k,X.length?X:frListe().filter(x=>x.kundeId===kid));
  location.href=`mailto:${encodeURIComponent(k.mail)}?subject=${encodeURIComponent(betreff)}&body=${encodeURIComponent(body)}`;
  const alt=k.fristKontakt||null; k.fristKontakt={datum:today(),wer:ME.name||""}; saveRec("kunden",k); render();
  toast("Als angeschrieben markiert","Rückgängig",()=>{ const k2=kundeOf(kid); if(!k2) return; if(alt) k2.fristKontakt=alt; else delete k2.fristKontakt; saveRec("kunden",k2); render(); }); }
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act^="fr"]'); if(!b||b.disabled) return; const a=b.dataset.act;
  if(a==="frFilter"){ e.stopPropagation(); FR_FILTER=b.dataset.v; render(); return; }
  if(a==="frMail"){ e.stopPropagation(); frMail(b.dataset.id); return; } },true);
