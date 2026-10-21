/* ===== E-Check: Anlagenprüfung (Hausinstallation und Anlagen) und Geräteprüfung – nur in der E-Check-App =====
   Datensätze (Prüfprotokolle-Bibliothek, _App-Daten):
   - gebaeude {ortId, etagen:[{id,name,raeume:[{id,name}]}], verteiler:[{id,name,raumId}], stromkreise:[{id,vId,nr,bez,raeume:[],schutz,rcd,leitung}]}
     gehört zum Ort (Standort-ID oder „k:<Kunde>“ für die Kundenadresse) und bleibt für die nächste Prüfung erhalten.
   - echecks {art:"anlage"|"geraete", kundeId, standortId, ortId, datum, pruefart, pruefer, status, sicht:{}, werte:{<Stromkreis/Gerät>:{…}}, netz:{}, fristM, maengel}
   - betriebsmittel {ortId, kundeId, bez, typ, sn, inv, sk:"I"|"II"|"III", raum, zuletzt, naechste, erg}
   Grenzwerte: Anlage nach DIN VDE 0100-600 / 0105-100, Geräte nach DIN VDE 0701-0702. Die Rechnung für Z s steht ausgeschrieben dabei. */
IC.ecStecker=IC.ecStecker||"M16 7V3h-2v4h-4V3H8v4h-.01C6.9 7 6 7.9 6 8.99v5.49L9.5 18v3h5v-3l3.5-3.51v-5.5c0-1.1-.9-1.99-2-1.99z";
const EC_ART={anlage:"Anlagenprüfung",geraete:"Geräteprüfung"};
const EC_PRUEFART=["Wiederholungsprüfung","Erstprüfung","E-CHECK"];
/* Messgeräte pflegt die Übersicht (Mehr › Geräte); hier nur zur Auswahl */
const ecMessgeraete=()=>(DB.geraete?live("geraete"):[]).filter(x=>x.art==="mess"&&!x.aus);
const ecMgDaten=m=>({mess:[m.hersteller,m.modell].filter(Boolean).join(" ")||"Messgerät",sn:m.sn||"",kal:m.kal||"",mgId:m.id});
const ecHeute=()=>{ const d=new Date(); d.setMinutes(d.getMinutes()-d.getTimezoneOffset()); return d.toISOString().slice(0,10); };
const ecDatum=s=>s?String(s).split("-").reverse().join("."):"";
const ecPlus=(datum,m)=>{ const d=new Date((datum||ecHeute())+"T12:00:00"); d.setMonth(d.getMonth()+(+m||0)); return d.toISOString().slice(0,10); };
const ecFmt=n=>String(Math.round(n*1000)/1000).replace(".",",");
function ecOrt(ortId){ ortId=String(ortId||"");
  if(ortId.startsWith("k:")){ const k=kundeOf(ortId.slice(2)); return {kunde:k,standort:null,name:k?(adrText(k)||"Adresse des Kunden"):"",titel:k?k.name:"Unbekannter Kunde"}; }
  const s=standortOf(ortId), k=s&&kundeOf(s.kundeId); return {kunde:k,standort:s,name:s?s.name:"",titel:[k&&k.name,s&&s.name].filter(Boolean).join(" · ")||"Unbekannter Ort"}; }
const ecAlle=()=>live("echecks");
/* Feste ID je Ort: legen zwei Geräte das Gebäude gleichzeitig an, landet es in derselben Datei statt doppelt.
   Solange nichts eingetragen ist, wird es nur angezeigt und erst beim ersten Speichern angelegt. */
const ecGebId=ortId=>"g-"+String(ortId).replace(/[^A-Za-z0-9_-]/g,"_");
function ecGeb(ortId){ const g=DB.gebaeude.get(ecGebId(ortId)); if(g&&!g.deleted) return g;
  return {id:ecGebId(ortId),ortId,etagen:[{id:"eg",name:"EG",raeume:[]}],verteiler:[],stromkreise:[]}; }
const ecGebSpeichern=g=>{ const neu=!DB.gebaeude.has(g.id); delete g.deleted; saveRec("gebaeude",g,neu); };
const ecRaumName=(g,id)=>{ for(const e of g.etagen) for(const r of e.raeume) if(r.id===id) return `${e.name} · ${r.name}`; return ""; };
/* Reihenfolge der Stromkreise: Etage › Raum › Verteiler/Nr.; ohne Raum am Ende */
function ecSkReihe(g){ const L=[], drin=new Set(), nr=(a,b)=>String(a.nr||"").localeCompare(String(b.nr||""),"de",{numeric:true});
  for(const e of g.etagen) for(const r of e.raeume){ const S=g.stromkreise.filter(s=>(s.raeume||[]).includes(r.id)&&!drin.has(s.id)).sort(nr); S.forEach(s=>drin.add(s.id)); if(S.length) L.push({titel:`${e.name} · ${r.name}`,raum:r,S}); }
  const rest=g.stromkreise.filter(s=>!drin.has(s.id)).sort(nr); if(rest.length) L.push({titel:"Ohne Raum",raum:null,S:rest}); return L; }
const ecSkFlach=g=>ecSkReihe(g).flatMap(x=>x.S);

/* ---- Messwerte und Grenzwerte ---- */
const ecZahl=v=>{ const t=String(v??"").trim().replace(",","."); if(!t) return null; const m=t.match(/^([<>]?)\s*(\d+(?:\.\d+)?)/); return m?{g:m[1],n:+m[2]}:null; };
function ecLs(schutz){ const m=String(schutz||"").toUpperCase().replace(/\s/g,"").match(/^([BCDK])(\d+(?:[.,]\d+)?)/); if(!m) return null;
  const In=+m[2].replace(",","."), f={B:5,C:10,D:20,K:12}[m[1]], Ia=f*In; return {c:m[1],In,Ia,zs:230/Ia,txt:`230 V ÷ (${f} × ${ecFmt(In)} A) = ${ecFmt(230/Ia)} Ω`}; }
const ecRcd=rcd=>{ const m=String(rcd||"").match(/(\d+)\s*mA/i); return m?+m[1]:null; };
const EC_MW=[
  {k:"riso",l:"Isolationswiderstand R iso",kurz:"R iso",e:"MΩ",gw:()=>({min:1,txt:"≥ 1 MΩ"})},
  {k:"rlo",l:"Schutzleiter R LO",kurz:"R LO",e:"Ω",gw:()=>({max:1,txt:"≤ 1 Ω (Richtwert)"})},
  {k:"zs",l:"Schleifenimpedanz Z s",kurz:"Z s",e:"Ω",gw:sk=>{ const L=ecLs(sk.schutz); return L?{max:L.zs,txt:`${L.c}${ecFmt(L.In)}: ≤ ${L.txt}`}:{txt:"Schutzorgan beim Stromkreis angeben (z. B. B16)"}; }},
  {k:"rcdT",l:"RCD Auslösezeit",kurz:"RCD",e:"ms",gw:sk=>ecRcd(sk.rcd)?{max:300,txt:"≤ 300 ms"}:{txt:"kein RCD angegeben"}},
  {k:"rcdI",l:"RCD Auslösestrom",kurz:"I Δ",e:"mA",gw:sk=>{ const i=ecRcd(sk.rcd); return i?{max:i,txt:`≤ ${i} mA`}:{txt:"kein RCD angegeben"}; }}];
function ecWertStand(gw,v){ const z=ecZahl(v); if(!z) return ""; if(gw.min!=null) return z.n>=gw.min||z.g===">"?"ok":"bad"; if(gw.max!=null) return z.n<=gw.max||z.g==="<"?"ok":"bad"; return "ok"; }
function ecSkStand(pr,sk){ const w=(pr.werte||{})[sk.id]||{}; const st=EC_MW.map(d=>ecWertStand(d.gw(sk),w[d.k]));
  if(st.includes("bad")||String(w.mangel||"").trim()) return "bad"; if(w.riso&&(w.rlo||w.zs)) return "ok"; return st.some(Boolean)?"wip":"open"; }
/* Geräte nach DIN VDE 0701-0702 */
const EC_GW={rpe:{l:"Schutzleiterwiderstand R PE",kurz:"R PE",e:"Ω",gw:()=>({max:0.3,txt:"≤ 0,3 Ω (bis 5 m Leitung)"})},
  riso:{l:"Isolationswiderstand R iso",kurz:"R iso",e:"MΩ",gw:sk=>{ const m={I:1,II:2,III:0.25}[sk]||1; return {min:m,txt:`Schutzklasse ${sk}: ≥ ${ecFmt(m)} MΩ`}; }},
  ipe:{l:"Schutzleiterstrom I PE",kurz:"I PE",e:"mA",gw:()=>({max:3.5,txt:"≤ 3,5 mA"})},
  ib:{l:"Berührungsstrom I B",kurz:"I B",e:"mA",gw:()=>({max:0.5,txt:"≤ 0,5 mA"})}};
const EC_GSK={I:["rpe","riso","ipe"],II:["riso","ib"],III:["riso"]};
function ecGerStand(pr,bm){ const w=(pr.werte||{})[bm.id]||{}, sk=bm.sk||"I", L=EC_GSK[sk]||EC_GSK.I, st=L.map(k=>ecWertStand(EC_GW[k].gw(sk),w[k]));
  if(w.sicht==="nok"||w.funktion==="nok"||st.includes("bad")||String(w.mangel||"").trim()) return "bad";
  if(w.sicht==="ok"&&w.funktion==="ok"&&st.every(Boolean)) return "ok"; return w.sicht||w.funktion||st.some(Boolean)?"wip":"open"; }
const ecGeraeteAm=ortId=>live("betriebsmittel").filter(b=>b.ortId===ortId).sort((a,b)=>String(a.raum||"").localeCompare(String(b.raum||""),"de")||String(a.bez||"").localeCompare(String(b.bez||""),"de",{numeric:true}));
const EC_SICHT=["Auswahl und Errichtung der Betriebsmittel","Schutz gegen direktes Berühren (Abdeckungen, Gehäuse)","Leitungen und Kabel ohne Beschädigung","Leiterkennzeichnung (PE grün-gelb, N blau)",
  "Beschriftung der Stromkreise im Verteiler","Schutzpotentialausgleich vorhanden und angeschlossen","Fehlerstrom-Schutzeinrichtungen, wo gefordert","Überspannungsschutz, falls erforderlich",
  "Brandabschottungen / Brandschutz","Zugänglichkeit der Verteiler","Anschlüsse fest, keine Überhitzungsspuren","Dokumentation (Schaltpläne) vorhanden"];
const ecSichtZahl=pr=>EC_SICHT.filter((_,i)=>(pr.sicht||{})["s"+i]).length;
/* Gesamtergebnis */
function ecErgebnis(pr){ if((pr.art||"anlage")==="anlage"){ const g=ecGeb(pr.ortId), S=g?ecSkFlach(g).map(s=>ecSkStand(pr,s)):[];
    if(Object.values(pr.sicht||{}).includes("nok")||S.includes("bad")) return "bad"; return S.length&&S.every(x=>x==="ok")&&ecSichtZahl(pr)===EC_SICHT.length?"ok":"open"; }
  const B=ecGeraeteAm(pr.ortId).map(b=>ecGerStand(pr,b)).filter(x=>x!=="open"); if(B.includes("bad")) return "bad"; return B.length&&B.every(x=>x==="ok")?"ok":"open"; }
const EC_PILL={ok:["ok","i. O."],bad:["bad","Mangel"],wip:["wip","teilweise"],open:["open","offen"]};
const ecPill=s=>pill(EC_PILL[s][0],EC_PILL[s][1]);

/* ---- Listen ---- */
function ecItem(pr){ const o=ecOrt(pr.ortId), erg=ecErgebnis(pr), fertig=pr.status==="fertig";
  return `<div class="li" role="button" tabindex="0" data-act="ecOeffnen" data-id="${esc(pr.id)}"><span class="av">${icon(pr.art==="geraete"?"ecStecker":"home")}</span>
    <span class="lt"><span class="h">${esc(o.titel)}</span><span class="s">${esc([ecDatum(pr.datum),pr.pruefart,o.standort?"":o.name,pr.pruefer].filter(Boolean).join(" · "))}</span>
    <span class="st">${fertig?pill(erg==="bad"?"bad":"ok",erg==="bad"?"Mängel":"abgeschlossen"):pill("wip","in Arbeit")}</span></span>${icon("chev")}</div>`; }
function ecListeView(art){
  const L=ecAlle().filter(p=>(p.art||"anlage")===art).sort((a,b)=>String(b.datum||"").localeCompare(String(a.datum||""))||(b.updated||0)-(a.updated||0));
  const auf=L.filter(p=>p.status!=="fertig"), fertig=L.filter(p=>p.status==="fertig"); let h=`<div class="narrow">`;
  if(art==="geraete"){ const bis=ecPlus(ecHeute(),1), F=live("betriebsmittel").filter(b=>b.naechste&&b.naechste<=bis).sort((a,b)=>a.naechste.localeCompare(b.naechste));
    if(F.length){ const M=new Map(); F.forEach(b=>{ if(!M.has(b.ortId)) M.set(b.ortId,[]); M.get(b.ortId).push(b); });
      h+=`<div class="sec-lbl">Fällig in den nächsten 4 Wochen</div>${listOf([...M].map(([o,G])=>`<div class="li" role="button" tabindex="0" data-act="ecNeuOrt" data-art="geraete" data-ort="${esc(o)}"><span class="av">${icon("warn")}</span>
        <span class="lt"><span class="h">${esc(ecOrt(o).titel)}</span><span class="s">${G.length} Gerät${G.length>1?"e":""} · ab ${esc(ecDatum(G[0].naechste))}</span></span>${pill(G[0].naechste<ecHeute()?"bad":"wip",G[0].naechste<ecHeute()?"überfällig":"bald fällig")}</div>`))}`; } }
  if(!L.length) return h+`<div class="empty">${icon(art==="geraete"?"ecStecker":"home")}<h2>${art==="geraete"?"Noch keine Geräteprüfung":"Noch keine Anlagenprüfung"}</h2><p>${art==="geraete"
      ?"Ortsveränderliche Geräte (DGUV V3, DIN VDE 0701-0702): Geräte je Kunde erfassen, prüfen, Prüffrist setzen – das Protokoll landet in der Bibliothek."
      :"Hausinstallationen und Anlagen (DIN VDE 0100-600 / 0105-100): Etagen, Räume, Verteiler und Stromkreise anlegen, besichtigen, messen – das Protokoll landet in der Bibliothek."}</p></div></div>`;
  if(auf.length) h+=`<div class="sec-lbl">In Arbeit</div>${listOf(auf.map(ecItem))}`;
  if(fertig.length) h+=`<div class="sec-lbl">Abgeschlossen</div>${listOf(fertig.map(ecItem))}`;
  return h+`</div>`; }
/* Abschnitt in der Kunden-/Standortansicht */
function ecBeiKunde(kind,r){ const L=ecAlle().filter(p=>kind==="kunden"?p.kundeId===r.id:p.standortId===r.id).sort((a,b)=>String(b.datum||"").localeCompare(String(a.datum||"")));
  return kdKopf("Prüfungen","ecNeuHier","Prüfung anlegen",` data-kind="${kind}" data-id="${esc(r.id)}"`)+(L.length?listOf(L.map(ecItem)):`<p class="meta">Noch keine Prüfung.</p>`); }

/* ---- Neue Prüfung ---- */
function ecOrtFeld(kid,ort){ const k=kid&&kundeOf(kid); if(!k) return ""; const ss=standorteVon(k.id);
  return sf("ecOrt","Ort",ort||(ss.length===1?ss[0].id:"k:"+k.id),[["k:"+k.id,`Adresse des Kunden${adrText(k)?` (${adrText(k)})`:""}`],...ss.map(s=>[s.id,[s.name,s.ort].filter(Boolean).join(", ")])],{form:true}); }
let ecNeuArt="anlage";
function ecNeuDialog(art,kundeId,ort){ ecNeuArt=art; const K=live("kunden").sort((a,b)=>a.name.localeCompare(b.name,"de"));
  dialog(art==="anlage"?"Neue Anlagenprüfung":"Neue Geräteprüfung",`<div class="fg1">
    ${sf("ecKunde","Kunde",kundeId||"",[["","Kunde wählen …"],...K.map(k=>[k.id,k.name+(k.kdnr?` (${k.kdnr})`:"")])],{form:true})}
    <div id="ecOrtFeld">${ecOrtFeld(kundeId,ort)}</div>
    <div class="reihe2">${art==="anlage"?sf("ecArt","Art der Prüfung","Wiederholungsprüfung",EC_PRUEFART,{form:true}):sf("ecArt","Art der Prüfung","Wiederholungsprüfung",["Wiederholungsprüfung","Erstprüfung"],{form:true})}${tf("ecDatum","Prüfdatum",ecHeute(),{type:"date",form:true})}</div>
    ${K.length?"":`<p class="meta">Noch keine Kunden – erst unter „Kunden“ anlegen.</p>`}</div>`,
    `<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="ecNeuOk">Anlegen</button>`,{breit:true}); }
function ecNeuOk(){ const F=formVals(); if(!F.ecKunde){ toast("Bitte einen Kunden wählen"); return; }
  const ortId=F.ecOrt||"k:"+F.ecKunde, art=ecNeuArt;
  const pr={id:uid(),art,kundeId:F.ecKunde,standortId:ortId.startsWith("k:")?"":ortId,ortId,datum:F.ecDatum||ecHeute(),pruefart:F.ecArt||"",pruefer:who().name,status:"offen",
    sicht:{},werte:{},netz:{form:"TN-C-S"},geraet:ecMessgeraete()[0]?ecMgDaten(ecMessgeraete()[0]):{},fristM:art==="anlage"?48:12};
  saveRec("echecks",pr,true);
  closeOverlays(); go({v:"ec",id:pr.id,tab:art==="anlage"?"gebaeude":"geraete"}); }

/* ---- Prüfung ---- */
function ecKennzahlen(pr){ const k=(z,t,bar,rot)=>`<div class="ec-k"><b${rot?' class="rot"':""}>${z}</b><small>${t}</small>${bar!=null?`<span class="ec-bar"><i style="width:${Math.round(bar*100)}%"></i></span>`:""}</div>`;
  if(pr.art==="geraete"){ const B=ecGeraeteAm(pr.ortId), st=B.map(b=>ecGerStand(pr,b)), n=st.filter(x=>x==="ok"||x==="bad").length, m=st.filter(x=>x==="bad").length;
    return `<div class="ec-kz">${k(`${n} / ${B.length}`,"Geräte geprüft",B.length?n/B.length:0)}${k(m,"Mängel",null,m>0)}${k(`${pr.fristM||12} Mon.`,"Prüffrist")}${k(pr.geraet&&pr.geraet.mess||"–","Messgerät")}</div>`; }
  const g=ecGeb(pr.ortId), S=ecSkFlach(g), st=S.map(s=>ecSkStand(pr,s)), n=st.filter(x=>x==="ok"||x==="bad").length, m=st.filter(x=>x==="bad").length+Object.values(pr.sicht||{}).filter(v=>v==="nok").length, si=ecSichtZahl(pr);
  return `<div class="ec-kz">${k(`${si} / ${EC_SICHT.length}`,"Besichtigung",si/EC_SICHT.length)}${k(`${n} / ${S.length}`,"Stromkreise gemessen",S.length?n/S.length:0)}${k(m,"Mängel",null,m>0)}${k(esc((pr.netz||{}).form||"–"),`Netz${(pr.netz||{}).hak?` · HAK ${esc(pr.netz.hak)}`:""}`)}</div>`; }
function ecView(pr){ const an=(pr.art||"anlage")==="anlage", T=an?[["gebaeude","Gebäude"],["sicht",matchMedia("(max-width:479px)").matches?"Sicht":"Besichtigung"],["messen","Messen"],["abschluss","Abschluss"]]:[["geraete","Geräte"],["abschluss","Abschluss"]];
  const tab=T.some(x=>x[0]===nav.tab)?nav.tab:T[0][0], zu=pr.status==="fertig";
  const body=tab==="gebaeude"?ecGebView(pr):tab==="sicht"?ecSichtView(pr):tab==="messen"?ecMessView(pr):tab==="geraete"?ecGerListe(pr):ecAbschlussView(pr);
  return `<div class="narrow ec">${zu?`<div class="robanner">${icon("lock")}<span>Abgeschlossen am ${esc(ecDatum(pr.fertigAm||pr.datum))} – zum Ändern unter „Abschluss“ wieder öffnen.</span></div>`:""}
    ${ecKennzahlen(pr)}${seg("ecTab",tab,T,"ec-tabs")}<div class="ec-body${zu?" zu":""}">${body}</div></div>`; }
/* Gebäude: Etagen, Räume, Verteiler */
function ecGebView(pr){ const g=ecGeb(pr.ortId), et=g.etagen.find(e=>e.id===nav.et)||g.etagen[0];
  const zahl=r=>g.stromkreise.filter(s=>(s.raeume||[]).includes(r.id));
  const raum=r=>{ const S=zahl(r), st=S.map(s=>ecSkStand(pr,s)), n=st.filter(x=>x==="ok"||x==="bad").length, bad=st.filter(x=>x==="bad").length;
    return `<button class="ec-raum" data-act="ecRaum" data-id="${esc(r.id)}"><b>${esc(r.name)}</b><small>${S.length} Stromkreis${S.length===1?"":"e"}</small>
      <span class="ec-rst">${!S.length?pill("open","noch nichts"):bad?pill("bad",`${bad} Mangel`):n===S.length?pill("ok","geprüft"):pill(n?"wip":"open",n?`${n} von ${S.length} gemessen`:"offen")}</span></button>`; };
  return `<div class="ec-et">${g.etagen.map(e=>`<button class="ec-etk${e===et?" an":""}" data-act="ecEt" data-id="${esc(e.id)}">${esc(e.name)}</button>`).join("")}<button class="ec-etk plus" data-act="ecEtNeu" aria-label="Etage hinzufügen" title="Etage hinzufügen">${icon("add")}</button></div>
    <div class="ec-zwei"><div>${kdKopf(`Räume im ${esc(et?et.name:"")}`,et&&"ecRaumNeu","Raum hinzufügen")}
      ${et&&et.raeume.length?`<div class="ec-raster">${et.raeume.map(raum).join("")}</div>`:`<p class="meta">Noch keine Räume. Mit + anlegen – z. B. Küche, Bad, Flur, Hausanschlussraum.</p>`}
      ${et&&g.etagen.length>0?`<button class="btn-text ec-etedit" data-act="ecEtEdit" data-id="${esc(et.id)}">${icon("edit")}Etage „${esc(et.name)}“ umbenennen oder löschen</button>`:""}</div>
    <div>${kdKopf("Verteiler","ecVtNeu","Verteiler hinzufügen")}${g.verteiler.length?listOf(g.verteiler.map(v=>{ const n=g.stromkreise.filter(s=>s.vId===v.id).length;
      return `<div class="li" role="button" tabindex="0" data-act="ecVtEdit" data-id="${esc(v.id)}"><span class="av ec-uv">UV</span><span class="lt"><span class="h">${esc(v.name)}</span><span class="s">${esc([ecRaumName(g,v.raumId),`${n} Stromkreis${n===1?"":"e"}`].filter(Boolean).join(" · "))}</span></span>${icon("chev")}</div>`; })):`<p class="meta">Noch kein Verteiler.</p>`}</div></div>
    <p class="hint">Etagen, Räume, Verteiler und Stromkreise gehören zum Gebäude und bleiben für die nächste Prüfung erhalten.</p>`; }
/* Besichtigung */
function ecSichtView(pr){ const S=pr.sicht||{}, tri=(k)=>`<span class="ec-tri">${[["ok","i. O."],["nok","n. i. O."],["na","entfällt"]].map(([v,t])=>`<button data-act="ecSicht" data-k="${k}" data-v="${v}" aria-pressed="${S[k]===v}" class="${v}">${t}</button>`).join("")}</span>`;
  return `<div class="sec-row"><div class="sec-lbl">Besichtigen nach DIN VDE 0100-600</div><button class="btn-text" data-act="ecSichtAlle">Übrige i. O.</button></div>
    <div class="list ec-sicht">${EC_SICHT.map((t,i)=>`<div class="ec-sz"><span>${esc(t)}</span>${tri("s"+i)}</div>`).join("")}</div>`; }
/* Messen */
function ecMessView(pr){ const g=ecGeb(pr.ortId), R=ecSkReihe(g), vName=id=>(g.verteiler.find(v=>v.id===id)||{}).name||"";
  const zelle=(w,d,sk)=>{ const v=w[d.k], st=ecWertStand(d.gw(sk),v); return `<span class="mw ${st||"leer"}" data-l="${d.kurz}">${v?esc(v)+" "+d.e:"–"}</span>`; };
  const zeile=sk=>{ const w=(pr.werte||{})[sk.id]||{};
    return `<div class="ec-sk" role="button" tabindex="0" data-act="ecMess" data-id="${esc(sk.id)}"><span class="nr">${esc(sk.nr||"–")}</span><span class="bz">${esc(sk.bez||"Stromkreis")}<small>${esc([sk.leitung,vName(sk.vId)].filter(Boolean).join(" · "))}</small></span>
      <span class="sz">${esc(sk.schutz||"–")}<small>${esc(sk.rcd||"")}</small></span>${EC_MW.slice(0,4).map(d=>zelle(w,d,sk)).join("")}<span class="er">${ecPill(ecSkStand(pr,sk))}</span></div>`; };
  return kdKopf("Stromkreise","ecSkNeu","Stromkreis hinzufügen")+(R.length?`<div class="list ec-tab"><div class="ec-sk h"><span>Nr.</span><span>Stromkreis</span><span>Schutz</span>${EC_MW.slice(0,4).map(d=>`<span>${d.kurz}</span>`).join("")}<span>Ergebnis</span></div>
    ${R.map(x=>`<div class="ec-rk">${esc(x.titel)}</div>${x.S.map(zeile).join("")}`).join("")}</div><p class="hint">Antippen zum Messen – „Weiter“ springt zum nächsten Stromkreis. Rot: Grenzwert überschritten, wird als Mangel gewertet.</p>`
    :`<p class="meta">Noch keine Stromkreise. Mit + anlegen und einem oder mehreren Räumen zuordnen.</p>`); }
/* Geräte */
function ecGerListe(pr){ const B=ecGeraeteAm(pr.ortId);
  return kdKopf(`Geräte · ${B.length}`,"ecBmNeu","Gerät hinzufügen")+(B.length?listOf(B.map(b=>{ const st=ecGerStand(pr,b);
    return `<div class="li" role="button" tabindex="0" data-act="ecGer" data-id="${esc(b.id)}"><span class="av">${icon("ecStecker")}</span><span class="lt"><span class="h">${esc(b.bez||"Gerät")}</span>
      <span class="s">${esc([b.typ,b.inv&&`Inv. ${b.inv}`,`SK ${b.sk||"I"}`,b.raum,b.naechste&&`fällig ${ecDatum(b.naechste)}`].filter(Boolean).join(" · "))}</span></span>${ecPill(st)}</div>`; }))
    :`<p class="meta">Noch keine Geräte an diesem Ort. Mit + anlegen – z. B. Bohrmaschine, Kaffeemaschine, Verlängerung.</p>`); }
/* Abschluss */
function ecAbschlussView(pr){ const an=(pr.art||"anlage")==="anlage", erg=ecErgebnis(pr), zu=pr.status==="fertig", N=pr.netz||{}, G=pr.geraet||{};
  const feld=(k,l,v,o={})=>`<div class="tf${v||o.ph?" fl":""}"><input id="f_ec_${k.replace(".","_")}" data-ec="${k}" value="${esc(v||"")}" placeholder="${esc(o.ph||" ")}" ${o.type?`type="${o.type}"`:""} autocomplete="off" ${zu?"disabled":""}><label for="f_ec_${k.replace(".","_")}">${esc(l)}</label></div>`;
  const fr=an?[12,24,48]:[6,12,24];
  return `${an?`<div class="sec-lbl">Anlagendaten</div>${seg("ecNetz",N.form||"TN-C-S",[["TN-C-S","TN-C-S"],["TN-S","TN-S"],["TT","TT"]])}
      <div class="fg1 ec-fg"><div class="reihe2">${feld("netz.hak","Hausanschluss (z. B. 63 A)",N.hak)}${feld("auftragsnr","Auftragsnummer",pr.auftragsnr)}</div></div>`:feld("auftragsnr","Auftragsnummer",pr.auftragsnr)}
    <div class="sec-lbl">Messgerät und Prüfer</div>${!zu&&ecMessgeraete().length?`<div class="chips ec-mg">${ecMessgeraete().map(m=>`<button type="button" class="chip" data-act="ecMg" data-id="${esc(m.id)}" aria-pressed="${G.mgId===m.id}">${esc(ecMgDaten(m).mess)}${m.sn?` · ${esc(m.sn)}`:""}</button>`).join("")}</div>`:""}<div class="fg1 ec-fg"><div class="reihe2">${feld("geraet.mess","Messgerät",G.mess)}${feld("geraet.sn","Seriennummer",G.sn)}</div><div class="reihe2">${feld("geraet.kal","Kalibriert bis",G.kal,{ph:"z. B. 03/2027"})}${feld("pruefer","Prüfer",pr.pruefer)}</div></div>
    <div class="sec-row"><div class="sec-lbl">Mängel / Maßnahmen</div>${zu?"":`<button class="btn-text" data-act="ecMaengelAuto">Gefundene Mängel übernehmen</button>`}</div>
    <div class="fg1 ec-fg"><div class="tf${pr.maengel?" fl":""}"><textarea id="f_ec_maengel" data-ec="maengel" placeholder=" " ${zu?"disabled":""}>${esc(pr.maengel||"")}</textarea><label for="f_ec_maengel">Mängel und Maßnahmen</label></div></div>
    <div class="sec-lbl">Nächste Prüfung</div>${seg("ecFrist",String(pr.fristM||fr[1]),fr.map(m=>[String(m),m%12?`${m} Monate`:`${m/12} Jahr${m>12?"e":""}`]))}<p class="meta">Empfohlen bis ${esc(ecDatum(ecPlus(pr.datum,pr.fristM||fr[1])))} – die Frist legt der Betreiber fest.</p>
    <div class="ec-erg ${erg}"><span>${erg==="ok"?"Keine Mängel festgestellt.":erg==="bad"?"Mängel festgestellt – Beseitigung erforderlich.":"Prüfung noch nicht vollständig."}</span>${ecPill(erg)}</div>
    <div class="ec-knoepfe"><button class="btn-filled" data-act="ecPdf">${icon("pdf")}PDF erstellen</button>${zu?`<button class="btn-tonal" data-act="ecAuf">Wieder öffnen</button>`:`<button class="btn-tonal" data-act="ecFertig">${icon("done")}Prüfung abschließen</button>`}
      ${canEdit(pr)&&!zu?`<span style="flex:1"></span><button class="btn-text danger" data-act="ecDelAsk">Prüfung löschen</button>`:""}</div>`; }

/* ---- Dialoge ---- */
let ecDlg=null;
const ecPr=()=>nav.v==="ec"&&DB.echecks.get(nav.id);
function ecNameDlg(t,wert,act,del,extra){ dialog(t,`<div class="fg1">${tf("ecName","Bezeichnung",wert||"",{form:true})}${extra||""}</div>`,`${del?`<button class="btn-text danger" data-act="${del}">Löschen</button>`:""}<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="${act}">Speichern</button>`); }
function ecSkDlg(sk,raumId){ const pr=ecPr(), g=ecGeb(pr.ortId); ecDlg={sk:sk&&sk.id,raeume:new Set(sk?sk.raeume||[]:raumId?[raumId]:[])}; const v=sk||{};
  const RC=["","30 mA Typ A","30 mA Typ B","30 mA Typ F","30 mA Typ AC","100 mA Typ A","300 mA Typ A"];
  const chips=g.etagen.map(e=>e.raeume.length?`<div class="ec-chg"><small>${esc(e.name)}</small><div class="chips">${e.raeume.map(r=>`<button type="button" class="chip" data-act="ecSkRaum" data-id="${esc(r.id)}" aria-pressed="${ecDlg.raeume.has(r.id)}">${esc(r.name)}</button>`).join("")}</div></div>`:"").join("");
  dialog(sk?"Stromkreis bearbeiten":"Neuer Stromkreis",`<div class="fg1">
    <div class="reihe2">${sf("skV","Verteiler",v.vId||(g.verteiler[0]||{}).id||"",[...g.verteiler.map(x=>[x.id,x.name]),["__neu","Neuer Verteiler „Hauptverteiler“"]],{form:true})}${tf("skNr","Nr. / Bezeichnung im Verteiler",v.nr||"",{form:true,ph:"z. B. F3"})}</div>
    ${tf("skBez","Stromkreis",v.bez||"",{form:true,ph:"z. B. Steckdosen Küche"})}
    <div class="reihe2">${tf("skSchutz","Schutzorgan",v.schutz||"",{form:true,ph:"z. B. B16"})}${sf("skRcd","RCD",v.rcd||"",RC.map(x=>[x,x||"kein RCD"]),{form:true})}</div>
    ${tf("skLeitung","Leitung",v.leitung||"",{form:true,ph:"z. B. NYM-J 3×1,5"})}
    <div class="lbl" style="margin:8px 4px 0">Räume</div>${chips||`<p class="meta">Erst unter „Gebäude“ Räume anlegen.</p>`}</div>`,
    `${sk?`<button class="btn-text danger" data-act="ecSkDel">Löschen</button>`:""}<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="ecSkOk">Speichern</button>`,{breit:true}); }
/* Raum antippen: seine Stromkreise auf einen Blick, von hier messen oder anlegen */
function ecRaumDlg(raumId){ const pr=ecPr(), g=ecGeb(pr.ortId), zu=pr.status==="fertig", name=ecRaumName(g,raumId); if(!name) return;
  const S=g.stromkreise.filter(s=>(s.raeume||[]).includes(raumId)).sort((a,b)=>String(a.nr||"").localeCompare(String(b.nr||""),"de",{numeric:true}));
  dialog(name,S.length?`<div class="list">${S.map(sk=>`<div class="li" role="button" tabindex="0" data-act="ecMessAusRaum" data-id="${esc(sk.id)}"><span class="av ec-uv">${esc(sk.nr||"–")}</span><span class="lt"><span class="h">${esc(sk.bez||"Stromkreis")}</span><span class="s">${esc([sk.schutz,sk.rcd,sk.leitung].filter(Boolean).join(" · "))}</span></span>${ecPill(ecSkStand(pr,sk))}</div>`).join("")}</div>`
      :`<p class="meta">Diesem Raum ist noch kein Stromkreis zugeordnet.</p>`,
    `${zu?"":`<button class="btn-text" data-act="ecRaumEdit" data-id="${esc(raumId)}">Umbenennen</button>`}<span style="flex:1"></span><button class="btn-text" data-act="cancel">Schließen</button>${zu?"":`<button class="btn-text" data-act="ecSkNeuRaum" data-id="${esc(raumId)}">Stromkreis hinzufügen</button>`}`,{breit:true}); }
function ecMessDlg(skId){ const pr=ecPr(), g=ecGeb(pr.ortId), L=ecSkFlach(g), i=L.findIndex(s=>s.id===skId), sk=L[i]; if(!sk) return; ecDlg={mess:skId};
  const w=(pr.werte||{})[sk.id]||{}, zu=pr.status==="fertig";
  const feld=d=>{ const gw=d.gw(sk), st=ecWertStand(gw,w[d.k]);
    return `<div class="ec-feld ${st}" data-k="${d.k}"><label for="m_${d.k}">${esc(d.l)}</label><span class="ec-ein"><input id="m_${d.k}" data-mw="${d.k}" inputmode="decimal" value="${esc(w[d.k]||"")}" placeholder="–" autocomplete="off" ${zu?"disabled":""}><span>${d.e}</span></span><small class="ec-gw">${esc(gw.txt)}</small></div>`; };
  const vor=L[i-1], nach=L[i+1];
  dialog(`${sk.nr?sk.nr+" · ":""}${sk.bez||"Stromkreis"}`,`<p class="ec-sub">${esc([(sk.raeume||[]).map(r=>ecRaumName(g,r)).join(", "),sk.schutz,sk.rcd,sk.leitung].filter(Boolean).join(" · "))}</p>
    <div class="ec-felder">${EC_MW.map(feld).join("")}</div>
    ${zu?"":`<div class="chips ec-schnell"><button type="button" class="chip" data-act="ecMwSetz" data-k="riso" data-v=">500">&gt; 500 MΩ</button>${vor?`<button type="button" class="chip" data-act="ecMwWie" data-id="${esc(vor.id)}">wie ${esc(vor.nr||"vorheriger")}</button>`:""}<button type="button" class="chip" data-act="ecSkEditAusMess" data-id="${esc(sk.id)}">Stromkreis bearbeiten</button></div>`}
    <div class="tf${w.mangel?" fl":""}"><textarea id="m_mangel" data-mw="mangel" placeholder=" " ${zu?"disabled":""}>${esc(w.mangel||"")}</textarea><label for="m_mangel">Mangel / Bemerkung (optional)</label></div>`,
    `${vor?`<button class="btn-text" data-act="ecMessGeh" data-d="-1">‹ ${esc(vor.nr||"zurück")}</button>`:""}<span style="flex:1"></span><button class="btn-text" data-act="ecMessGeh" data-d="0">Fertig</button>${nach?`<button class="btn-text" data-act="ecMessGeh" data-d="1">Weiter zu ${esc(nach.nr||"nächstem")} ›</button>`:""}`,{breit:true});
  setTimeout(()=>{ const f=document.querySelector('#dlg [data-mw="riso"]'); if(f&&!f.value&&!zu&&matchMedia("(hover:hover)").matches) f.focus(); },60); }
function ecMessLesen(){ const pr=ecPr(); if(!pr||!ecDlg||!ecDlg.mess||pr.status==="fertig") return; const w={}; document.querySelectorAll("#dlg [data-mw]").forEach(el=>{ const v=el.value.trim(); if(v) w[el.dataset.mw]=v; });
  pr.werte=pr.werte||{}; const alt=JSON.stringify(pr.werte[ecDlg.mess]||{}); if(alt!==JSON.stringify(w)){ pr.werte[ecDlg.mess]=w; if(pr.status==="offen") pr.status="laeuft"; saveRec("echecks",pr); } }
function ecGerDlg(bmId){ const pr=ecPr(), B=ecGeraeteAm(pr.ortId), i=B.findIndex(b=>b.id===bmId), bm=B[i]; if(!bm) return; ecDlg={ger:bmId}; const w=(pr.werte||{})[bm.id]||{}, sk=bm.sk||"I", zu=pr.status==="fertig";
  const tri=(k,l)=>`<div class="ec-sz"><span>${l}</span><span class="ec-tri">${[["ok","i. O."],["nok","n. i. O."]].map(([v,t])=>`<button type="button" data-act="ecGerTri" data-k="${k}" data-v="${v}" aria-pressed="${w[k]===v}" class="${v}" ${zu?"disabled":""}>${t}</button>`).join("")}</span></div>`;
  const feld=k=>{ const d=EC_GW[k], gw=d.gw(sk), st=ecWertStand(gw,w[k]); return `<div class="ec-feld ${st}" data-k="${k}"><label for="m_${k}">${esc(d.l)}</label><span class="ec-ein"><input id="m_${k}" data-mw="${k}" data-gsk="${sk}" inputmode="decimal" value="${esc(w[k]||"")}" placeholder="–" autocomplete="off" ${zu?"disabled":""}><span>${d.e}</span></span><small class="ec-gw">${esc(gw.txt)}</small></div>`; };
  const vor=B[i-1], nach=B[i+1];
  dialog(bm.bez||"Gerät",`<p class="ec-sub">${esc([bm.typ,bm.sn&&`SN ${bm.sn}`,bm.inv&&`Inv. ${bm.inv}`,`Schutzklasse ${sk}`,bm.raum].filter(Boolean).join(" · "))}</p>
    <div class="list ec-sicht">${tri("sicht","Sichtprüfung (Gehäuse, Leitung, Stecker, Knickschutz)")}</div>
    <div class="ec-felder">${(EC_GSK[sk]||EC_GSK.I).map(feld).join("")}</div>
    <div class="list ec-sicht">${tri("funktion","Funktionsprüfung")}</div>
    ${zu?"":`<div class="chips ec-schnell"><button type="button" class="chip" data-act="ecMwSetz" data-k="riso" data-v=">300">&gt; 300 MΩ</button><button type="button" class="chip" data-act="ecBmEditAusPr" data-id="${esc(bm.id)}">Gerät bearbeiten</button></div>`}
    <div class="tf${w.mangel?" fl":""}"><textarea id="m_mangel" data-mw="mangel" placeholder=" " ${zu?"disabled":""}>${esc(w.mangel||"")}</textarea><label for="m_mangel">Mangel / Bemerkung (optional)</label></div>`,
    `${vor?`<button class="btn-text" data-act="ecGerGeh" data-d="-1">‹ zurück</button>`:""}<span style="flex:1"></span><button class="btn-text" data-act="ecGerGeh" data-d="0">Fertig</button>${nach?`<button class="btn-text" data-act="ecGerGeh" data-d="1">Weiter ›</button>`:""}`,{breit:true}); }
function ecGerLesen(){ const pr=ecPr(); if(!pr||!ecDlg||!ecDlg.ger||pr.status==="fertig") return; const alt=(pr.werte||{})[ecDlg.ger]||{}, w={sicht:alt.sicht,funktion:alt.funktion};
  document.querySelectorAll("#dlg [data-mw]").forEach(el=>{ const v=el.value.trim(); if(v) w[el.dataset.mw]=v; });
  document.querySelectorAll("#dlg [data-act=ecGerTri][aria-pressed=true]").forEach(b=>w[b.dataset.k]=b.dataset.v);
  Object.keys(w).forEach(k=>{ if(w[k]==null) delete w[k]; });
  pr.werte=pr.werte||{}; if(JSON.stringify(alt)!==JSON.stringify(w)){ pr.werte[ecDlg.ger]=w; if(pr.status==="offen") pr.status="laeuft"; saveRec("echecks",pr); } }
function ecBmDlg(bm){ const pr=ecPr(); ecDlg={bm:bm&&bm.id}; const v=bm||{sk:"I"};
  dialog(bm?"Gerät bearbeiten":"Neues Gerät",`<div class="fg1">${tf("bmBez","Bezeichnung",v.bez||"",{form:true,ph:"z. B. Bohrmaschine"})}
    <div class="reihe2">${tf("bmTyp","Hersteller / Typ",v.typ||"",{form:true,ph:"z. B. Bosch GSB 18V"})}${tf("bmSn","Seriennummer",v.sn||"",{form:true})}</div>
    <div class="reihe2">${tf("bmInv","Inventarnummer",v.inv||"",{form:true})}${tf("bmRaum","Standort im Gebäude",v.raum||"",{form:true,ph:"z. B. Werkstatt"})}</div>
    <div class="lbl" style="margin:8px 4px 0">Schutzklasse</div>${seg("bmSk",v.sk||"I",[["I","I – mit Schutzleiter"],["II","II – schutzisoliert"],["III","III – Schutzkleinspannung"]])}</div>`,
    `${bm?`<button class="btn-text danger" data-act="ecBmDel">Löschen</button>`:""}<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="ecBmOk">Speichern</button>`,{breit:true}); }
function ecMaengelText(pr){ const L=[];
  if((pr.art||"anlage")==="anlage"){ EC_SICHT.forEach((t,i)=>{ if((pr.sicht||{})["s"+i]==="nok") L.push(`Besichtigung: ${t} – nicht in Ordnung.`); });
    const g=ecGeb(pr.ortId); ecSkFlach(g).forEach(sk=>{ const w=(pr.werte||{})[sk.id]||{}, f=EC_MW.filter(d=>ecWertStand(d.gw(sk),w[d.k])==="bad");
      if(f.length||w.mangel) L.push(`${sk.nr||""} ${sk.bez||"Stromkreis"}: ${[...f.map(d=>`${d.kurz} ${w[d.k]} ${d.e} (Grenzwert ${d.gw(sk).txt})`),w.mangel].filter(Boolean).join("; ")}.`.trim()); }); }
  else ecGeraeteAm(pr.ortId).forEach(b=>{ const w=(pr.werte||{})[b.id]||{}, sk=b.sk||"I", f=(EC_GSK[sk]||[]).filter(k=>ecWertStand(EC_GW[k].gw(sk),w[k])==="bad");
    if(f.length||w.sicht==="nok"||w.funktion==="nok"||w.mangel) L.push(`${b.bez||"Gerät"}${b.inv?` (Inv. ${b.inv})`:""}: ${[w.sicht==="nok"&&"Sichtprüfung nicht in Ordnung",...f.map(k=>`${EC_GW[k].kurz} ${w[k]} ${EC_GW[k].e}`),w.funktion==="nok"&&"Funktion nicht in Ordnung",w.mangel].filter(Boolean).join("; ")}.`); });
  return L.join("\n"); }

/* ---- PDF im Irrgang-Layout (pdfstil.js) und Ablage in der Bibliothek ---- */
async function ecPdf(pr){ const lib=await pdfLib(), d=new lib.jsPDF({unit:"mm",format:"a4"}), o=ecOrt(pr.ortId), k=o.kunde, an=(pr.art||"anlage")==="anlage", erg=ecErgebnis(pr), G=pr.geraet||{}, N=pr.netz||{};
  const adr=x=>x?[x.name,adrText(x)].filter(Boolean).join(", "):"";
  const S=pdfStil(d,{titel:an?"Prüfprotokoll Elektroinstallation":"Prüfprotokoll ortsveränderliche Geräte",unter:an?`${pr.pruefart||"Prüfung"} | DIN VDE 0100-600 | DIN VDE 0105-100`:`${pr.pruefart||"Prüfung"} | DIN VDE 0701-0702 | DGUV Vorschrift 3`,ehw:true,
    fuss:[k&&k.name,o.standort&&o.standort.name,pr.auftragsnr&&`Auftrag ${pr.auftragsnr}`,`Prüfdatum ${ecDatum(pr.datum)}`].filter(Boolean).join(" | ")});
  S.kopf(); S.abschnitt("Auftragsdaten");
  S.werte([["Auftraggeber",adr(k)],["Auftragsnr.",pr.auftragsnr],["Kundennr.",k&&k.kdnr],["Ansprechpartner",k&&k.ansprech],["Prüfort",o.standort?adr(o.standort):"wie Auftraggeber"],["Art der Prüfung",pr.pruefart],
    ["Prüfdatum",ecDatum(pr.datum)],["Prüfer",pr.pruefer],["Messgerät",G.mess],["Seriennr.",G.sn],["Kal. gültig bis",G.kal],an?["Netzform",`${N.form||"-"} | 230/400 V${N.hak?` | HAK ${N.hak}`:""}`]:["Anzahl Geräte",String(ecGeraeteAm(pr.ortId).filter(b=>ecGerStand(pr,b)!=="open").length)]]);
  if(an){ const g=ecGeb(pr.ortId);
    S.abschnitt("Prüfumfang"); S.text(`Besichtigen, Erproben und Messen der elektrischen Anlage${o.standort?` „${o.standort.name}“`:""} nach DIN VDE 0100-600 bzw. DIN VDE 0105-100. Verteiler: ${g.verteiler.map(v=>v.name).join(", ")||"-"}.`);
    S.abschnitt("Besichtigung"); const half=Math.ceil(EC_SICHT.length/2), cw=S.CW/2; d.setFontSize(8);
    for(let i=0;i<half;i++){ S.platz(6); for(let c=0;c<2;c++){ const j=i+c*half, t=EC_SICHT[j]; if(!t) continue; const x=S.M+c*cw, v=(pr.sicht||{})["s"+j];
        d.setFont("helvetica","normal"); d.setTextColor(30); d.text(d.splitTextToSize(pdfT(t),cw-24)[0],x+2,S.y);
        d.setFont("helvetica","bold"); d.setTextColor(...(v==="ok"?S.OKC:v==="nok"?S.BADC:S.GR)); d.text(v==="ok"?"i.O.":v==="nok"?"n.i.O.":v==="na"?"entf.":"-",x+cw-4,S.y,{align:"right"}); }
      S.y+=5.5; } S.y+=3;
    S.abschnitt("Messwerte"); const R=ecSkReihe(g), Z=[];
    R.forEach(x=>{ Z.push(x.titel); x.S.forEach(sk=>{ const w=(pr.werte||{})[sk.id]||{}, L=ecLs(sk.schutz), st=ecSkStand(pr,sk);
      Z.push([sk.nr||"-",sk.bez||"-",[sk.schutz,sk.rcd&&"RCD "+sk.rcd.replace(" Typ ","/")].filter(Boolean).join(" "),w.riso?w.riso+" MOhm":"-",w.rlo?w.rlo+" Ohm":"-",w.zs?`${w.zs}${L?` / ${ecFmt(L.zs)}`:""} Ohm`:"-",w.rcdT?`${w.rcdT} ms${w.rcdI?` | ${w.rcdI} mA`:""}`:"-",st==="ok"?"ok|i.O.":st==="bad"?"bad|Mangel":"open|offen"]); }); });
    if(Z.length) S.tabelle(["Nr.","Stromkreis","Schutz","R iso","R LO","Z s / Grenzw.","RCD t | I","Ergebnis"],[11,40,30,20,17,25,22,17],Z,7); else S.text("Keine Stromkreise erfasst.");
    S.text("Grenzwerte: R iso >= 1 MOhm; Z s <= 230 V / Ia (Ia = 5 x In bei B, 10 x In bei C, 20 x In bei D); RCD: Auslösezeit <= 300 ms, Auslösestrom <= Bemessungsdifferenzstrom; R LO als Richtwert <= 1 Ohm."); }
  else { const B=ecGeraeteAm(pr.ortId).filter(b=>ecGerStand(pr,b)!=="open");
    S.abschnitt("Geprüfte Geräte");
    S.tabelle(["Gerät","Typ / Seriennr. / Inv.","SK","Sicht","R PE","R iso","I PE / I B","Funkt.","Ergebnis"],[34,44,8,12,15,17,18,12,22],B.map(b=>{ const w=(pr.werte||{})[b.id]||{}, st=ecGerStand(pr,b), t=v=>v==="ok"?"i.O.":v==="nok"?"n.i.O.":"-";
      return [b.bez||"-",[b.typ,b.sn,b.inv&&"Inv. "+b.inv].filter(Boolean).join(" | ")||"-",b.sk||"I",t(w.sicht),w.rpe?w.rpe+" Ohm":"-",w.riso?w.riso+" MOhm":"-",w.ipe?w.ipe+" mA":w.ib?w.ib+" mA":"-",t(w.funktion),st==="ok"?"ok|i.O.":st==="bad"?"bad|Mangel":"open|offen"]; }),8);
    S.text("Grenzwerte nach DIN VDE 0701-0702: R PE <= 0,3 Ohm (bis 5 m); R iso >= 1 MOhm (SK I), >= 2 MOhm (SK II), >= 0,25 MOhm (SK III); Schutzleiterstrom <= 3,5 mA; Berührungsstrom <= 0,5 mA."); }
  S.abschnitt("Gesamtergebnis"); S.platz(10); d.setFont("helvetica","bold"); d.setFontSize(10); d.setTextColor(20);
  d.text(pdfT(erg==="ok"?"Keine Mängel festgestellt.":erg==="bad"?"Mängel festgestellt - Beseitigung erforderlich.":"Prüfung unvollständig - nicht alle Werte erfasst."),S.M,S.y); S.plakette(S.M+S.CW-1,S.y,erg); S.y+=9;
  S.abschnitt("Festgestellte Mängel / Maßnahmen"); S.text(pr.maengel||ecMaengelText(pr)||"Keine.");
  S.abschnitt("Nächste Prüfung"); S.text(`Empfohlen bis ${ecDatum(ecPlus(pr.datum,pr.fristM||(an?48:12)))}. Die Frist legt der Betreiber fest.`);
  S.abschnitt("Unterschriften"); S.y+=2; S.unterschriften([["Prüfer",pr.pruefer,ecDatum(pr.datum)],["Auftraggeber",k&&k.ansprech||"",ecDatum(pr.datum)]]);
  return S.ende(pr.id.slice(-6).toUpperCase()); }
async function ecPdfAblegen(pr){ toast("PDF wird erstellt …");
  let blob; try{ blob=await ecPdf(pr); }catch(e){ toast("PDF konnte nicht erstellt werden – Internet für die PDF-Bibliothek nötig"); return; }
  const o=ecOrt(pr.ortId), k=o.kunde, an=(pr.art||"anlage")==="anlage", name=bbFs(`${pr.datum} ${an?"Anlagenprüfung":"Geräteprüfung"} ${k?k.name:""}${o.standort?" "+o.standort.name:""}`);
  const x={id:uid(),app:"echeck",echeckId:pr.id,kundeId:pr.kundeId||"",standortId:pr.standortId||"",name,titel:o.titel,datum:pr.datum,art:`${EC_ART[pr.art||"anlage"]}${pr.pruefart?" · "+pr.pruefart:""}`,auftragsnr:pr.auftragsnr||"",pruefer:pr.pruefer||"",
    ergebnis:ecErgebnis(pr)==="bad"?"bad":"ok",created:Date.now(),von:who(),size:blob.size,fassung:(pr.pdf||[]).length+1};
  try{ const db=await new Promise((res,rej)=>{ const q=indexedDB.open("evse_protokolle"); q.onupgradeneeded=()=>{ const z=q.result; if(!z.objectStoreNames.contains("meta")) z.createObjectStore("meta",{keyPath:"id"}); if(!z.objectStoreNames.contains("blob")) z.createObjectStore("blob"); }; q.onsuccess=()=>res(q.result); q.onerror=()=>rej(q.error); });
    if(!db.objectStoreNames.contains("meta")){ db.close(); throw 0; }
    const tx=db.transaction(["meta","blob"],"readwrite"); tx.objectStore("meta").put(x); tx.objectStore("blob").put(blob,x.id); await new Promise(ok=>{ tx.oncomplete=ok; tx.onerror=ok; }); db.close(); }catch(e){}
  if(typeof BB_PROT!=="undefined") BB_PROT.push(x);
  const dir=[k&&k.name,o.standort&&o.standort.name].filter(Boolean).map(bbFs).join("/")||"Ohne Zuordnung";
  bbProtMelden(x,{bib:"pdf",pfad:`${dir}/${name}.pdf`});
  pr.pdf=[...(pr.pdf||[]),{at:Date.now(),id:x.id}]; saveRec("echecks",pr); render();
  toast("PDF erstellt – liegt in der Bibliothek","Öffnen",()=>bbOeffnen(x.id)); }

/* ---- Klicks und Eingaben ---- */
document.addEventListener("change",e=>{ const el=e.target;
  if(el.id==="f_ecKunde"){ const f=document.getElementById("ecOrtFeld"); if(f) f.innerHTML=ecOrtFeld(el.value); return; }
  if(el.dataset&&el.dataset.ec){ const pr=ecPr(); if(!pr||pr.status==="fertig") return; const [a,b]=el.dataset.ec.split("."); if(b){ pr[a]=Object.assign({},pr[a]||{},{[b]:el.value.trim()}); } else pr[a]=el.value.trim(); saveRec("echecks",pr); } });
document.addEventListener("input",e=>{ const el=e.target; if(!el.dataset||!el.dataset.mw||el.dataset.mw==="mangel") return; const f=el.closest(".ec-feld"); if(!f) return;
  let gw=null; if(el.dataset.gsk) gw=EC_GW[el.dataset.mw].gw(el.dataset.gsk); else { const pr=ecPr(), g=pr&&ecGeb(pr.ortId), sk=g&&ecDlg&&g.stromkreise.find(s=>s.id===ecDlg.mess), d=EC_MW.find(x=>x.k===el.dataset.mw); if(sk&&d) gw=d.gw(sk); }
  if(gw){ f.classList.remove("ok","bad"); const st=ecWertStand(gw,el.value); if(st) f.classList.add(st); } });
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act^="ec"],[data-act="bmSk"],[data-act="ecTab"]'); if(!b||b.disabled) return; const a=b.dataset.act;
  if(!/^(ec|bmSk)/.test(a)) return; e.stopPropagation(); e.preventDefault();
  const pr=ecPr(), g=pr&&(pr.art||"anlage")==="anlage"?ecGeb(pr.ortId):null, zu=pr&&pr.status==="fertig", nichtZu=()=>{ if(zu){ toast("Prüfung ist abgeschlossen – unter „Abschluss“ wieder öffnen"); return false; } return true; };
  switch(a){
  case "ecNeuA": ecNeuDialog("anlage"); return;
  case "ecNeuG": ecNeuDialog("geraete"); return;
  case "ecNeuOrt": { const o=ecOrt(b.dataset.ort); ecNeuDialog(b.dataset.art,o.kunde&&o.kunde.id,b.dataset.ort); return; }
  case "ecNeuHier": { const r=DB[b.dataset.kind].get(b.dataset.id), kid=b.dataset.kind==="kunden"?r.id:r.kundeId, ort=b.dataset.kind==="kunden"?"k:"+r.id:r.id;
    dialog("Welche Prüfung?",`<div class="list">${[["anlage","Anlagenprüfung","Hausinstallation oder Anlage – Etagen, Räume, Stromkreise","home"],["geraete","Geräteprüfung","Ortsveränderliche Geräte nach DGUV V3","ecStecker"]].map(([v,t,s,i])=>`<div class="li" role="button" tabindex="0" data-act="ecNeuWahl" data-art="${v}" data-k="${esc(kid)}" data-ort="${esc(ort)}"><span class="av">${icon(i)}</span><span class="lt"><span class="h">${t}</span><span class="s">${s}</span></span>${icon("chev")}</div>`).join("")}</div>`,`<button class="btn-text" data-act="cancel">Abbrechen</button>`); return; }
  case "ecNeuWahl": closeOverlays(); ecNeuDialog(b.dataset.art,b.dataset.k,b.dataset.ort); return;
  case "ecNeuOk": ecNeuOk(); return;
  case "ecOeffnen": { const p=DB.echecks.get(b.dataset.id); if(p) go({v:"ec",id:p.id,tab:p.art==="geraete"?"geraete":p.status==="offen"?"gebaeude":"messen"}); return; }
  case "ecTab": nav.tab=b.dataset.v; render(); return;
  case "ecEt": { if(nav.et===b.dataset.id||(!nav.et&&g&&g.etagen[0]&&g.etagen[0].id===b.dataset.id)){ const et=g.etagen.find(x=>x.id===b.dataset.id); if(et){ ecDlg={et:et.id}; ecNameDlg("Etage bearbeiten",et.name,"ecEtOk","ecEtDel"); } return; } nav.et=b.dataset.id; render(); return; }
  case "ecEtEdit": { const et=g.etagen.find(x=>x.id===b.dataset.id); if(et){ ecDlg={et:et.id}; ecNameDlg("Etage bearbeiten",et.name,"ecEtOk","ecEtDel"); } return; }
  case "ecEtNeu": if(!nichtZu()) return; ecDlg={et:null}; ecNameDlg("Neue Etage","","ecEtOk",null,`<div class="chips">${["KG","EG","OG","1. OG","2. OG","DG"].filter(n=>!g.etagen.some(e=>e.name===n)).map(n=>`<button type="button" class="chip" data-act="ecNameSetz" data-v="${n}">${n}</button>`).join("")}</div>`); return;
  case "ecNameSetz": { const i=document.getElementById("f_ecName"); if(i){ i.value=b.dataset.v; i.parentElement.classList.add("fl"); } return; }
  case "ecEtOk": { const n=(formVals().ecName||"").trim(); if(!n){ toast("Bitte eine Bezeichnung eingeben"); return; } if(ecDlg.et){ g.etagen.find(x=>x.id===ecDlg.et).name=n; } else { const et={id:uid(),name:n,raeume:[]}; g.etagen.push(et); nav.et=et.id; } ecGebSpeichern(g); closeOverlays(); render(); return; }
  case "ecEtDel": { const et=g.etagen.find(x=>x.id===ecDlg.et); if(!et) return; if(g.etagen.length<2){ toast("Mindestens eine Etage bleibt"); return; } if(et.raeume.length){ toast("Erst die Räume dieser Etage löschen"); return; } g.etagen=g.etagen.filter(x=>x!==et); nav.et=null; ecGebSpeichern(g); closeOverlays(); render(); return; }
  case "ecRaumNeu": if(!nichtZu()) return; ecDlg={raum:null}; ecNameDlg("Neuer Raum","","ecRaumOk",null,`<div class="chips">${["Küche","Bad","Flur","Wohnen","Schlafen","Kind","Büro","Keller","Hausanschlussraum","Garage","Treppenhaus","Außen"].map(n=>`<button type="button" class="chip" data-act="ecNameSetz" data-v="${n}">${n}</button>`).join("")}</div>`); return;
  case "ecRaum": ecRaumDlg(b.dataset.id); return;
  case "ecRaumEdit": { let r=null; g.etagen.forEach(e=>e.raeume.forEach(x=>{ if(x.id===b.dataset.id) r=x; })); closeOverlays(); if(r){ if(!nichtZu()) return; ecDlg={raum:r.id}; ecNameDlg("Raum bearbeiten",r.name,"ecRaumOk","ecRaumDel"); } return; }
  case "ecSkNeuRaum": closeOverlays(); if(!nichtZu()) return; ecSkDlg(null,b.dataset.id); return;
  case "ecMessAusRaum": closeOverlays(); ecMessDlg(b.dataset.id); return;
  case "ecRaumOk": { const n=(formVals().ecName||"").trim(); if(!n){ toast("Bitte eine Bezeichnung eingeben"); return; }
    if(ecDlg.raum){ g.etagen.forEach(e=>e.raeume.forEach(x=>{ if(x.id===ecDlg.raum) x.name=n; })); } else { const et=g.etagen.find(e=>e.id===nav.et)||g.etagen[0]; et.raeume.push({id:uid(),name:n}); } ecGebSpeichern(g); closeOverlays(); render(); return; }
  case "ecRaumDel": { const id=ecDlg.raum; g.etagen.forEach(e=>{ e.raeume=e.raeume.filter(x=>x.id!==id); }); g.stromkreise.forEach(s=>{ s.raeume=(s.raeume||[]).filter(x=>x!==id); }); g.verteiler.forEach(v=>{ if(v.raumId===id) v.raumId=""; }); ecGebSpeichern(g); closeOverlays(); render(); return; }
  case "ecVtNeu": case "ecVtEdit": { if(a==="ecVtNeu"&&!nichtZu()) return; const v=a==="ecVtEdit"&&g.verteiler.find(x=>x.id===b.dataset.id); ecDlg={vt:v?v.id:null}; const R=g.etagen.flatMap(e=>e.raeume.map(r=>[r.id,`${e.name} · ${r.name}`]));
    ecNameDlg(v?"Verteiler bearbeiten":"Neuer Verteiler",v?v.name:"","ecVtOk",v?"ecVtDel":null,sf("ecVtRaum","Raum",v?v.raumId||"":"",[["","ohne Raum"],...R],{form:true})); if(!v){ const i=document.getElementById("f_ecName"); if(i&&!g.verteiler.length){ i.value="Hauptverteiler"; i.parentElement.classList.add("fl"); } } return; }
  case "ecVtOk": { const F=formVals(), n=(F.ecName||"").trim(); if(!n){ toast("Bitte eine Bezeichnung eingeben"); return; } if(ecDlg.vt){ const v=g.verteiler.find(x=>x.id===ecDlg.vt); v.name=n; v.raumId=F.ecVtRaum||""; } else g.verteiler.push({id:uid(),name:n,raumId:F.ecVtRaum||""}); ecGebSpeichern(g); closeOverlays(); render(); return; }
  case "ecVtDel": { if(g.stromkreise.some(s=>s.vId===ecDlg.vt)){ toast("Am Verteiler hängen noch Stromkreise"); return; } g.verteiler=g.verteiler.filter(x=>x.id!==ecDlg.vt); ecGebSpeichern(g); closeOverlays(); render(); return; }
  case "ecSkNeu": if(!nichtZu()) return; ecSkDlg(null); return;
  case "ecSkEditAusMess": { ecMessLesen(); const sk=g.stromkreise.find(s=>s.id===b.dataset.id); closeOverlays(); if(sk) ecSkDlg(sk); return; }
  case "ecSkRaum": { const id=b.dataset.id; if(ecDlg.raeume.has(id)) ecDlg.raeume.delete(id); else ecDlg.raeume.add(id); b.setAttribute("aria-pressed",String(ecDlg.raeume.has(id))); return; }
  case "ecSkOk": { const F=formVals(); let vId=F.skV; if(!vId||vId==="__neu"){ const v={id:uid(),name:"Hauptverteiler",raumId:""}; g.verteiler.push(v); vId=v.id; }
    const neu={vId,nr:F.skNr,bez:F.skBez,schutz:F.skSchutz.toUpperCase().replace(/\s+/g,""),rcd:F.skRcd,leitung:F.skLeitung,raeume:[...ecDlg.raeume]};
    if(ecDlg.sk) Object.assign(g.stromkreise.find(s=>s.id===ecDlg.sk),neu); else g.stromkreise.push({id:uid(),...neu}); ecGebSpeichern(g); closeOverlays(); if(nav.tab!=="messen"){ nav.tab="messen"; } render(); return; }
  case "ecSkDel": { g.stromkreise=g.stromkreise.filter(s=>s.id!==ecDlg.sk); ecGebSpeichern(g); closeOverlays(); render(); return; }
  case "ecMess": ecMessDlg(b.dataset.id); return;
  case "ecMwSetz": { const i=document.querySelector(`#dlg [data-mw="${b.dataset.k}"]`); if(i){ i.value=b.dataset.v; i.dispatchEvent(new Event("input",{bubbles:true})); } return; }
  case "ecMwWie": { const w=(pr.werte||{})[b.dataset.id]||{}; ["riso","rlo","zs","rcdT","rcdI"].forEach(k=>{ const i=document.querySelector(`#dlg [data-mw="${k}"]`); if(i&&w[k]){ i.value=w[k]; i.dispatchEvent(new Event("input",{bubbles:true})); } }); return; }
  case "ecMessGeh": { ecMessLesen(); const L=ecSkFlach(g), i=L.findIndex(s=>s.id===ecDlg.mess), d=+b.dataset.d; if(d&&L[i+d]){ render(); ecMessDlg(L[i+d].id); return; } closeOverlays(); ecDlg=null; render(); return; }
  case "ecSicht": { if(!nichtZu()) return; pr.sicht=Object.assign({},pr.sicht||{}); const k=b.dataset.k; pr.sicht[k]=pr.sicht[k]===b.dataset.v?undefined:b.dataset.v; if(!pr.sicht[k]) delete pr.sicht[k]; if(pr.status==="offen") pr.status="laeuft"; saveRec("echecks",pr); render(); return; }
  case "ecSichtAlle": { if(!nichtZu()) return; pr.sicht=Object.assign({},pr.sicht||{}); EC_SICHT.forEach((_,i)=>{ if(!pr.sicht["s"+i]) pr.sicht["s"+i]="ok"; }); saveRec("echecks",pr); render(); return; }
  case "ecNetz": { if(!nichtZu()) return; pr.netz=Object.assign({},pr.netz||{},{form:b.dataset.v}); saveRec("echecks",pr); render(); return; }
  case "ecMg": { if(!nichtZu()) return; const m=DB.geraete&&DB.geraete.get(b.dataset.id); if(m){ pr.geraet=ecMgDaten(m); saveRec("echecks",pr); render(); } return; }
  case "ecFrist": { if(!nichtZu()) return; pr.fristM=+b.dataset.v; saveRec("echecks",pr); render(); return; }
  case "ecMaengelAuto": { if(!nichtZu()) return; const t=ecMaengelText(pr); if(!t){ toast("Keine Mängel gefunden"); return; } pr.maengel=[pr.maengel,t].filter(Boolean).join(pr.maengel?"\n":""); saveRec("echecks",pr); render(); return; }
  case "ecFertig": { pr.status="fertig"; pr.fertigAm=ecHeute(); if(pr.art==="geraete") ecGeraeteAm(pr.ortId).forEach(bm=>{ const st=ecGerStand(pr,bm); if(st==="ok"||st==="bad"){ bm.zuletzt=pr.datum; bm.naechste=ecPlus(pr.datum,pr.fristM||12); bm.erg=st; saveRec("betriebsmittel",bm); } });
    saveRec("echecks",pr); render(); toast("Prüfung abgeschlossen","PDF erstellen",()=>ecPdfAblegen(DB.echecks.get(pr.id))); return; }
  case "ecAuf": pr.status="laeuft"; delete pr.fertigAm; saveRec("echecks",pr); render(); return;
  case "ecPdf": ecPdfAblegen(pr); return;
  case "ecDelAsk": confirmDlg("Prüfung löschen?","Die Prüfung wird in allen Apps entfernt. Gebäude, Räume, Stromkreise und Geräte bleiben erhalten.","Löschen","ecDel"); return;
  case "ecDel": { closeOverlays(); if(!canEdit(pr)) return; pr.deleted=true; saveRec("echecks",pr); go({v:pr.art==="geraete"?"geraete":"anlagen"}); toast("Prüfung gelöscht"); return; }
  case "ecBmNeu": if(!nichtZu()) return; ecBmDlg(null); return;
  case "ecBmEditAusPr": { ecGerLesen(); const bm=DB.betriebsmittel.get(b.dataset.id); closeOverlays(); if(bm) ecBmDlg(bm); return; }
  case "bmSk": { b.parentElement.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x===b))); return; }
  case "ecBmOk": { const F=formVals(), sk=(document.querySelector('#dlg [data-act="bmSk"][aria-pressed="true"]')||{dataset:{v:"I"}}).dataset.v; if(!F.bmBez){ toast("Bitte eine Bezeichnung eingeben"); return; }
    const o=ecOrt(pr.ortId), neu={bez:F.bmBez,typ:F.bmTyp,sn:F.bmSn,inv:F.bmInv,raum:F.bmRaum,sk};
    if(ecDlg.bm){ const bm=DB.betriebsmittel.get(ecDlg.bm); Object.assign(bm,neu); saveRec("betriebsmittel",bm); } else saveRec("betriebsmittel",{id:uid(),ortId:pr.ortId,kundeId:o.kunde?o.kunde.id:"",...neu},true);
    closeOverlays(); render(); return; }
  case "ecBmDel": { const bm=DB.betriebsmittel.get(ecDlg.bm); if(bm){ bm.deleted=true; saveRec("betriebsmittel",bm); } closeOverlays(); render(); return; }
  case "ecGer": ecGerDlg(b.dataset.id); return;
  case "ecGerTri": { b.parentElement.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x===b&&x.getAttribute("aria-pressed")!=="true"))); return; }
  case "ecGerGeh": { ecGerLesen(); const B=ecGeraeteAm(pr.ortId), i=B.findIndex(x=>x.id===ecDlg.ger), d=+b.dataset.d; if(d&&B[i+d]){ render(); ecGerDlg(B[i+d].id); return; } closeOverlays(); ecDlg=null; render(); return; }
  }
},true);
