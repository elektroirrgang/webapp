/* ===== E-Check: Installationsprüfung (Hausinstallation und Anlagen) und Geräteprüfung – nur in der E-Check-App =====
   Ablauf wie in EVSE: in der Prüfung zeigt die Seitenleiste die Schritte
     Installation: Auftrag › Gebäude › Besichtigung › Messen › Abschluss
     Geräte:       Auftrag › Geräte › Abschluss
     Netzwerk:     Auftrag › Gebäude › Messen › Abschluss (Datenverkabelung, siehe unten)
   „Abschluss“ ist gesperrt, bis alles im Prüfumfang erledigt ist (Stromkreise dürfen bewusst „nicht gemessen“ mit Grund sein).

   Datensätze (Prüfprotokolle-Bibliothek, _App-Daten):
   - gebaeude {ortId, etagen:[{id,name,raeume:[{id,name}]}], verteiler:[{id,name,raumId}],
       rcds:[{id,vId,nr,typ,in,idn}], stromkreise:[{id,vId,nr,bez,schutz,rcdId,leitung}],
       stellen:[{id,raumId,ord,art,fach,lage,skId}]}
     Gehört zum Ort (Standort-ID oder „k:<Kunde>“) und bleibt für die nächste Prüfung erhalten.
     Eine „Stelle“ ist eine Einbaustelle im Raum (z. B. 3-fach-Kombination); jede Steckdose darin ist ein Messpunkt
     „<Stelle>.<1..n>“. Nummeriert wird im Raum in Reihenfolge der Stellen (1, 2.1, 2.2, 2.3, 3 …) – Vorschlag: ab der Tür im Uhrzeigersinn.
   - echecks {art, kundeId, standortId, ortId, datum, pruefart, pruefer, auftragsnr, bez, status, sicht:{}, netz:{}, geraet:{},
       umfang:{vIds|null}, umfangText, werte:{<Stromkreis>:{riso,rlo,zs,ng,mangel}, <Messpunkt>:{zs,ub,zi,ik,mangel}, <RCD>:{t1,t5,idelta,ub}, <Gerät>:{…}},
       fristM, maengel, importe:[]}
   - betriebsmittel {ortId, kundeId, bez, typ, sn, inv, sk:"I"|"II"|"III", raum, zuletzt, naechste, erg}
   Messen wie mit dem Wiha MFT one: erster Punkt hinter einem RCD per AUTO-Test (Z s, U B, RCD, R iso), weitere Punkte nur Z s („std. RCD“).
   Grenzwerte: Anlage nach DIN VDE 0100-600 / 0105-100, Geräte nach DIN VDE 0701-0702. Die Rechnung für Z s steht ausgeschrieben dabei. */
IC.ecStecker=IC.ecStecker||"M16 7V3h-2v4h-4V3H8v4h-.01C6.9 7 6 7.9 6 8.99v5.49L9.5 18v3h5v-3l3.5-3.51v-5.5c0-1.1-.9-1.99-2-1.99z";
IC.ecMess=IC.ecMess||"M20.38 8.57l-1.23 1.85a8 8 0 0 1-.22 7.58H5.07A8 8 0 0 1 15.58 6.85l1.85-1.23A10 10 0 0 0 3.35 19a2 2 0 0 0 1.72 1h13.85a2 2 0 0 0 1.74-1 10 10 0 0 0-.27-10.44zm-9.79 6.84a2 2 0 0 0 2.83 0l5.66-8.49-8.49 5.66a2 2 0 0 0 0 2.83z";
IC.ecSicht=IC.ecSicht||"M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z";
IC.ecNetz=IC.ecNetz||"M13 22h8v-7h-3v-4h-5V9h3V2H8v7h3v2H6v4H3v7h8v-7H8v-2h8v2h-3z";
IC.ecImport=IC.ecImport||"M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z";
const EC_ART={anlage:"Installationsprüfung",geraete:"Geräteprüfung",netz:"Netzwerkprüfung"};
const ecListeV=art=>({geraete:"geraete",netz:"netzwerk"}[art]||"anlagen");
const EC_PRUEFART=["Wiederholungsprüfung","Erstprüfung","E-CHECK"];
const EC_SART={sd:"Steckdose",herd:"Herdanschluss",fest:"Festanschluss",licht:"Licht",sonst:"Sonstiges"};
const EC_LAGE=["Eingang","unterm Schalter","neben Tür","neben Fenster","Arbeitsfläche","Bett","TV","Schreibtisch","Außen"];
/* Messgeräte pflegt die Übersicht (Messgeräte); hier nur zur Auswahl */
/* Einsatz: „installation“ (Installation/EVSE), „geraete“ (Geräteprüfung) oder „beide“; ohne Angabe gilt ein PAT als Gerätetester */
const ecEinsatz=g=>g.einsatz||(/\bPAT\b/i.test(g.modell||"")?"geraete":/signaltek|lantek|navitek|netzwerk|kabeltester|ethernet/i.test(`${g.hersteller||""} ${g.modell||""}`)?"netzwerk":"installation");
const ecMessgeraete=art=>(DB.geraete?live("geraete"):[]).filter(x=>x.art==="mess"&&!x.aus&&(!art||(art==="netz"?["netzwerk"]:[art==="geraete"?"geraete":"installation","beide"]).includes(ecEinsatz(x)))).sort((a,b)=>String(a.kurz||a.modell||"").localeCompare(String(b.kurz||b.modell||""),"de",{numeric:true}));
const ecMgDaten=m=>({mess:[m.hersteller,m.modell].filter(Boolean).join(" ")||"Messgerät",kurz:m.kurz||"",sn:m.sn||"",kal:m.kal||"",mgId:m.id});
const ecMgLabel=m=>(m.kurz?m.kurz+" · ":"")+([m.hersteller,m.modell].filter(Boolean).join(" ")||"Messgerät");
/* Prüfer legt die Übersicht fest (Mitarbeiter › Prüfer); ist niemand markiert, bleibt das Feld frei */
const ecPrueferListe=()=>team().filter(m=>m.pruefer);
const ecStdPruefer=()=>{ const L=ecPrueferListe(); return !L.length||L.some(m=>m.mail===ME.mail)?who().name:""; };
const ecHeute=()=>{ const d=new Date(); d.setMinutes(d.getMinutes()-d.getTimezoneOffset()); return d.toISOString().slice(0,10); };
const ecDatum=s=>s?String(s).split("-").reverse().join("."):"";
const ecPlus=(datum,m)=>{ const d=new Date((datum||ecHeute())+"T12:00:00"); d.setMonth(d.getMonth()+(+m||0)); return d.toISOString().slice(0,10); };
const ecFmt=n=>String(Math.round(n*1000)/1000).replace(".",",");
const ecNr=(a,b)=>String(a.nr||"").localeCompare(String(b.nr||""),"de",{numeric:true});
function ecOrt(ortId){ ortId=String(ortId||"");
  if(ortId.startsWith("k:")){ const k=kundeOf(ortId.slice(2)); return {kunde:k,standort:null,name:k?(adrText(k)||"Adresse des Kunden"):"",titel:k?k.name:"Unbekannter Kunde"}; }
  const s=standortOf(ortId), k=s&&kundeOf(s.kundeId); return {kunde:k,standort:s,name:s?s.name:"",titel:[k&&k.name,s&&s.name].filter(Boolean).join(" · ")||"Unbekannter Ort"}; }
const ecAlle=()=>live("echecks");
const ecAn=pr=>(pr.art||"anlage")==="anlage";

/* ---- Gebäude ---- */
/* Feste ID je Ort: legen zwei Geräte das Gebäude gleichzeitig an, landet es in derselben Datei statt doppelt.
   Solange nichts eingetragen ist, wird es nur angezeigt und erst beim ersten Speichern angelegt. */
const ecGebId=ortId=>"g-"+String(ortId).replace(/[^A-Za-z0-9_-]/g,"_");
const ecRcdText=t=>{ t=String(t||""); const i=t.match(/(\d+)\s*mA/i), y=t.match(/Typ\s*([A-Z+]+)/i); return {idn:i?i[1]:"",typ:y?y[1].toUpperCase():""}; };
function ecGebNorm(g){ g.etagen=g.etagen&&g.etagen.length?g.etagen:[{id:"eg",name:"EG",raeume:[]}]; g.verteiler=g.verteiler||[]; g.rcds=g.rcds||[]; g.stromkreise=g.stromkreise||[]; g.stellen=g.stellen||[]; g.schraenke=g.schraenke||[]; g.dosen=g.dosen||[];
  /* frühere Fassung: RCD als Text am Stromkreis → eigenes RCD-Objekt am Verteiler (feste ID, damit Werte beim Neuladen bleiben) */
  for(const s of g.stromkreise){ if(s.rcd&&!s.rcdId){ const t=ecRcdText(s.rcd), id=("r-"+(s.vId||"x")+"-"+t.idn+t.typ).replace(/[^A-Za-z0-9_-]/g,"_");
      if(!g.rcds.some(r=>r.id===id)) g.rcds.push({id,vId:s.vId||"",nr:String(g.rcds.filter(r=>r.vId===s.vId).length+1),typ:t.typ,in:"",idn:t.idn}); s.rcdId=id; }
    delete s.rcd; }
  return g; }
function ecGeb(ortId){ const g=DB.gebaeude.get(ecGebId(ortId)); if(g&&!g.deleted) return ecGebNorm(g); return ecGebNorm({id:ecGebId(ortId),ortId}); }
const ecGebSpeichern=g=>{ const neu=!DB.gebaeude.has(g.id); delete g.deleted; saveRec("gebaeude",g,neu); };
/* Etagen: Bezeichnung frei (z. B. „Level 1“), Geschoss als Zahl für die Reihenfolge (KG = -1, EG = 0, 1. OG = 1 … DG = 50) */
const EC_GESCHOSS=[[-3,"3. UG"],[-2,"2. UG"],[-1,"KG / UG"],[0,"EG"],...Array.from({length:12},(_,i)=>[i+1,`${i+1}. OG`]),[50,"DG"],[60,"Spitzboden"]];
const ecGeschossName=n=>(EC_GESCHOSS.find(x=>x[0]===+n)||[0,""])[1];
function ecEbeneRaten(n){ n=String(n||"").toLowerCase().replace(/\s+/g," ").trim(); let m;
  if(/spitzboden/.test(n)) return 60; if(/^(dg|dach)/.test(n)) return 50;
  if((m=n.match(/^(\d+)\.?\s*(ug|untergeschoss|keller)/))) return -(+m[1]);
  if(/^(kg|ug|keller|untergeschoss|souterrain)/.test(n)) return -1;
  if(/^(eg|erdgeschoss|parterre)/.test(n)) return 0;
  if((m=n.match(/^(\d+)\.?\s*(og|obergeschoss|etage|stock)/))) return +m[1];
  if((m=n.match(/^(og|obergeschoss|etage|stock)\s*(\d+)/))) return +m[2];
  if(/^og/.test(n)) return 1;
  if((m=n.match(/^(level|lvl|ebene|l)\s*(-?\d+)/))) return +m[2]-1;
  return null; }
const ecEbene=e=>e.ebene!=null&&e.ebene!==""?+e.ebene:(ecEbeneRaten(e.name)??0);
const ecEtagen=g=>g.etagen.map((e,i)=>[e,i]).sort((a,b)=>ecEbene(a[0])-ecEbene(b[0])||a[1]-b[1]).map(x=>x[0]);
const ecEtStd=g=>{ const E=ecEtagen(g); return E.find(e=>ecEbene(e)===0)||E[0]; };
/* Anzeige: „Level 1 (EG)“, wenn Bezeichnung und Geschoss nicht dasselbe sind */
const ecEtLabel=e=>{ const gs=ecGeschossName(ecEbene(e)); return !gs||ecEbeneRaten(e.name)===ecEbene(e)&&!/^(level|lvl|ebene|l)\s*\d/i.test(e.name)?e.name:`${e.name} (${gs})`; };
const ecRaumName=(g,id)=>{ for(const e of g.etagen) for(const r of e.raeume) if(r.id===id) return `${e.name} · ${r.name}`; return ""; };
const ecRaeume=g=>ecEtagen(g).flatMap(e=>e.raeume.map(r=>({...r,etage:e,titel:`${ecEtLabel(e)} · ${r.name}`})));
const ecSkListe=g=>[...g.stromkreise].sort((a,b)=>{ const va=g.verteiler.findIndex(v=>v.id===a.vId), vb=g.verteiler.findIndex(v=>v.id===b.vId); return (va<0?999:va)-(vb<0?999:vb)||ecNr(a,b); });
const ecVtName=(g,id)=>(g.verteiler.find(v=>v.id===id)||{}).name||"";
const ecRcdVon=(g,sk)=>sk&&sk.rcdId?g.rcds.find(r=>r.id===sk.rcdId):null;
const ecRcdName=r=>`${r.fils?"FI/LS":"RCD"} ${r.nr||""}`.trim();
const ecRcdInfo=r=>[r.in&&`${r.in} A`,r.idn&&`${r.idn} mA`,r.typ&&`Typ ${r.typ}`].filter(Boolean).join(" / ");
const ecSkName=sk=>[sk.nr,sk.bez||"Stromkreis"].filter(Boolean).join(" · ");
const ecStName=st=>st.art==="sd"?((+st.fach||1)>1?`${st.fach}-fach-Kombination`:"Steckdose"):EC_SART[st.art]||"Anschlusspunkt";
const ecPflicht=st=>st.art!=="licht"&&st.art!=="sonst";
/* Messpunkte eines Raums in Reihenfolge: Stelle k mit n Steckdosen → k.1 … k.n */
function ecRaumPunkte(g,raumId){ const S=g.stellen.filter(s=>s.raumId===raumId).sort((a,b)=>(a.ord||0)-(b.ord||0)), P=[];
  S.forEach((st,k)=>{ const n=st.art==="sd"?Math.max(1,+st.fach||1):1; for(let i=1;i<=n;i++) P.push({id:`${st.id}.${i}`,nr:n>1?`${k+1}.${i}`:`${k+1}`,st,i,raumId}); }); return P; }
const ecAllePunkte=g=>ecRaeume(g).flatMap(r=>ecRaumPunkte(g,r.id));
const ecSkPunkte=(g,skId)=>ecAllePunkte(g).filter(p=>p.st.skId===skId);
const ecSkVon=(g,p)=>p.st.skId?g.stromkreise.find(s=>s.id===p.st.skId):null;
const ecSkRaeume=(g,sk)=>[...new Set(g.stellen.filter(s=>s.skId===sk.id).map(s=>s.raumId))].map(id=>ecRaumName(g,id)).filter(Boolean);
const ecPunktName=(g,p)=>`${ecRaumName(g,p.raumId)} ${p.nr} · ${ecStName(p.st)}${p.st.lage?` (${p.st.lage})`:""}`;
const ecImUmfang=(pr,sk)=>!(pr.umfang&&pr.umfang.vIds)||!sk||!sk.vId||pr.umfang.vIds.includes(sk.vId);

/* ---- Messwerte und Grenzwerte ---- */
const ecZahl=v=>{ const t=String(v??"").trim().replace(",","."); if(!t) return null; const m=t.match(/^([<>]?)\s*(\d+(?:\.\d+)?)/); return m?{g:m[1],n:+m[2]}:null; };
function ecLs(schutz){ const m=String(schutz||"").toUpperCase().replace(/\s/g,"").match(/^([BCDK])(\d+(?:[.,]\d+)?)/); if(!m) return null;
  const In=+m[2].replace(",","."), f={B:5,C:10,D:20,K:12}[m[1]], Ia=f*In; return {c:m[1],In,Ia,zs:230/Ia,txt:`230 V ÷ (${f} × ${ecFmt(In)} A) = ${ecFmt(230/Ia)} Ω`}; }
/* Feld-Beschreibungen; gw(bezug) liefert {min,max,txt}. Bezug ist der Stromkreis (riso, rlo, zs) bzw. der RCD (t1, t5, idelta). */
const EC_F={
  riso:{l:"Isolationswiderstand R iso",kurz:"R iso",e:"MΩ",gw:()=>({min:1,txt:"≥ 1 MΩ"})},
  rlo:{l:"Schutzleiter R LO",kurz:"R LO",e:"Ω",gw:()=>({max:1,txt:"≤ 1 Ω (Richtwert)"})},
  zs:{l:"Schleifenimpedanz Z s",kurz:"Z s",e:"Ω",gw:sk=>{ const L=sk&&ecLs(sk.schutz); return L?{max:L.zs,txt:`${L.c}${ecFmt(L.In)}: ≤ ${L.txt}`}:{txt:sk?"Schutzorgan beim Stromkreis angeben (z. B. B16)":"erst einem Stromkreis zuordnen"}; }},
  ub:{l:"Berührungsspannung U B",kurz:"U B",e:"V",gw:()=>({max:50,txt:"≤ 50 V"})},
  zi:{l:"Netzimpedanz Z i",kurz:"Z i",e:"Ω",gw:()=>({txt:"zur Dokumentation"})},
  ik:{l:"Kurzschlussstrom I k",kurz:"I k",e:"A",gw:()=>({txt:"zur Dokumentation"})},
  t1:{l:"Auslösezeit bei 1 × IΔN",kurz:"t 1×",e:"ms",gw:()=>({max:300,txt:"≤ 300 ms"})},
  t5:{l:"Auslösezeit bei 5 × IΔN",kurz:"t 5×",e:"ms",gw:()=>({max:40,txt:"≤ 40 ms"})},
  idelta:{l:"Auslösestrom IΔ",kurz:"IΔ",e:"mA",gw:r=>r&&+r.idn?{min:r.idn/2,max:+r.idn,txt:`${ecFmt(r.idn/2)} … ${r.idn} mA`}:{txt:"IΔN beim RCD angeben"}}};
function ecWertStand(gw,v){ const z=ecZahl(v); if(!z) return "";
  if(gw.min!=null&&!(z.n>=gw.min||z.g===">")) return "bad"; if(gw.max!=null&&!(z.n<=gw.max||z.g==="<")) return "bad"; return "ok"; }
const ecW=(pr,id)=>(pr.werte||{})[id]||{};
function ecPunktStand(pr,g,p){ const sk=ecSkVon(g,p); if(sk&&ecW(pr,sk.id).ng) return "ng";
  const w=ecW(pr,p.id), a=sk?ecWertStand(EC_F.zs.gw(sk),w.zs):(w.zs?"ok":""), b=ecWertStand(EC_F.ub.gw(),w.ub);
  if(a==="bad"||b==="bad"||String(w.mangel||"").trim()) return "bad"; if(w.zs) return "ok"; return ecPflicht(p.st)?"open":"opt"; }
function ecRcdStand(pr,r){ const w=ecW(pr,r.id), st=["t1","t5","idelta","ub"].map(k=>ecWertStand(EC_F[k].gw(r),w[k]));
  if(st.includes("bad")) return "bad"; return w.t1?"ok":st.some(Boolean)?"wip":"open"; }
const ecSkZsPflicht=(g,sk)=>!ecSkPunkte(g,sk.id).some(p=>ecPflicht(p.st)); /* ohne Steckdosen o. Ä.: Z s direkt am Stromkreis */
function ecSkStand(pr,g,sk){ const w=ecW(pr,sk.id); if(w.ng) return "ng";
  const P=ecSkPunkte(g,sk.id), ps=P.map(p=>ecPunktStand(pr,g,p)), r=ecRcdVon(g,sk), rs=r?ecRcdStand(pr,r):"ok", eigen=ecSkZsPflicht(g,sk);
  const st=["riso","rlo"].concat(eigen?["zs"]:[]).map(k=>ecWertStand(EC_F[k].gw(sk),w[k]));
  if(st.includes("bad")||ps.includes("bad")||rs==="bad"||String(w.mangel||"").trim()) return "bad";
  const zsDa=eigen?(!!w.zs||ps.includes("ok")):!ps.includes("open");
  if(w.riso&&zsDa&&rs==="ok") return "ok"; return st.some(Boolean)||ps.includes("ok")||rs!=="open"?"wip":"open"; }
function ecZsMax(pr,g,sk){ const L=[ecW(pr,sk.id).zs,...ecSkPunkte(g,sk.id).map(p=>ecW(pr,p.id).zs)].map(ecZahl).filter(Boolean); if(!L.length) return null; return L.reduce((a,b)=>b.n>a.n?b:a); }
/* Geräte nach DIN VDE 0701-0702 */
const EC_GW={rpe:{l:"Schutzleiterwiderstand R PE",kurz:"R PE",e:"Ω",gw:()=>({max:0.3,txt:"≤ 0,3 Ω (bis 5 m Leitung)"})},
  riso:{l:"Isolationswiderstand R iso",kurz:"R iso",e:"MΩ",gw:sk=>{ const m={I:1,II:2,III:0.25}[sk]||1; return {min:m,txt:`Schutzklasse ${sk}: ≥ ${ecFmt(m)} MΩ`}; }},
  ipe:{l:"Schutzleiterstrom I PE",kurz:"I PE",e:"mA",gw:()=>({max:3.5,txt:"≤ 3,5 mA"})},
  ib:{l:"Berührungsstrom I B",kurz:"I B",e:"mA",gw:()=>({max:0.5,txt:"≤ 0,5 mA"})}};
const EC_GSK={I:["rpe","riso","ipe"],II:["riso","ib"],III:["riso"]};
function ecGerStand(pr,bm){ const w=ecW(pr,bm.id), sk=bm.sk||"I", L=EC_GSK[sk]||EC_GSK.I, st=L.map(k=>ecWertStand(EC_GW[k].gw(sk),w[k]));
  if(w.ng) return "ng";
  if(w.sicht==="nok"||w.funktion==="nok"||st.includes("bad")||String(w.mangel||"").trim()) return "bad";
  if(w.sicht==="ok"&&w.funktion==="ok"&&st.every(Boolean)) return "ok"; return w.sicht||w.funktion||st.some(Boolean)?"wip":"open"; }
const ecGeraeteAm=ortId=>live("betriebsmittel").filter(b=>b.ortId===ortId).sort((a,b)=>String(a.raum||"").localeCompare(String(b.raum||""),"de")||String(a.bez||"").localeCompare(String(b.bez||""),"de",{numeric:true}));
const EC_SICHT=["Auswahl und Errichtung der Betriebsmittel","Schutz gegen direktes Berühren (Abdeckungen, Gehäuse)","Leitungen und Kabel ohne Beschädigung","Leiterkennzeichnung (PE grün-gelb, N blau)",
  "Beschriftung der Stromkreise im Verteiler","Schutzpotentialausgleich vorhanden und angeschlossen","Fehlerstrom-Schutzeinrichtungen, wo gefordert","Überspannungsschutz, falls erforderlich",
  "Brandabschottungen / Brandschutz","Zugänglichkeit der Verteiler","Anschlüsse fest, keine Überhitzungsspuren","Dokumentation (Schaltpläne) vorhanden"];
const ecSichtZahl=pr=>EC_SICHT.filter((_,i)=>(pr.sicht||{})["s"+i]).length;
/* Was fehlt noch bis zum Abschluss? (leer = Abschluss frei) */
function ecFehlt(pr){ const F=[]; if(!String(pr.pruefer||"").trim()) F.push("kein Prüfer gewählt (Auftrag)");
  if(ecAn(pr)){ const g=ecGeb(pr.ortId), s=EC_SICHT.length-ecSichtZahl(pr); if(s) F.push(`${s} Besichtigungspunkt${s>1?"e":""}`);
    const S=g.stromkreise.filter(x=>ecImUmfang(pr,x)); if(!S.length) F.push("noch kein Stromkreis");
    const o=S.filter(x=>["open","wip"].includes(ecSkStand(pr,g,x))).length; if(o) F.push(`${o} Stromkreis${o>1?"e":""} nicht fertig gemessen`);
    const ohne=ecAllePunkte(g).filter(p=>!p.st.skId).length; if(ohne) F.push(`${ohne} Messpunkt${ohne>1?"e":""} ohne Stromkreis`); }
  else if(ecNz(pr)){ const g=ecGeb(pr.ortId), L=ecNetListe(pr,g); if(!L.length) F.push("noch keine Datendose");
    const o=L.filter(p=>["open","wip"].includes(ecNetStand(pr,p))).length; if(o) F.push(`${o} Link${o>1?"s":""} nicht fertig gemessen`); }
  else { const B=ecGeraeteAm(pr.ortId); if(!B.length) F.push("noch kein Gerät"); const o=B.filter(b=>["open","wip"].includes(ecGerStand(pr,b))).length; if(o) F.push(`${o} Gerät${o>1?"e":""} nicht fertig geprüft`); }
  return F; }
function ecErgebnis(pr){
  if(ecAn(pr)){ const g=ecGeb(pr.ortId); if(Object.values(pr.sicht||{}).includes("nok")||g.stromkreise.filter(x=>ecImUmfang(pr,x)).some(x=>ecSkStand(pr,g,x)==="bad")) return "bad"; return ecFehlt(pr).length?"open":"ok"; }
  if(ecNz(pr)){ const g=ecGeb(pr.ortId); if(ecNetListe(pr,g).some(p=>ecNetStand(pr,p)==="bad")) return "bad"; return ecFehlt(pr).length?"open":"ok"; }
  const B=ecGeraeteAm(pr.ortId).map(b=>ecGerStand(pr,b)); if(B.includes("bad")) return "bad"; return ecFehlt(pr).length?"open":"ok"; }
const EC_PILL={ok:["ok","i. O."],bad:["bad","Mangel"],wip:["wip","teilweise"],open:["open","offen"],ng:["open","nicht gemessen"],opt:["open","optional"]};
const ecPill=s=>pill(EC_PILL[s][0],EC_PILL[s][1]);

/* ---- Listen ---- */
function ecItem(pr){ const o=ecOrt(pr.ortId), erg=ecErgebnis(pr), fertig=pr.status==="fertig";
  return `<div class="li" role="button" tabindex="0" data-act="ecOeffnen" data-id="${esc(pr.id)}"><span class="av">${icon(pr.art==="geraete"?"ecStecker":pr.art==="netz"?"ecNetz":"home")}</span>
    <span class="lt"><span class="h">${esc(o.titel)}</span><span class="s">${esc([ecDatum(pr.datum),pr.pruefart,pr.bez,o.standort?"":o.name,pr.pruefer].filter(Boolean).join(" · "))}</span>
    <span class="st">${fertig?pill(erg==="bad"?"bad":"ok",erg==="bad"?"Mängel":"abgeschlossen"):pill("wip","in Arbeit")}</span></span>${icon("chev")}</div>`; }
function ecListeView(art){
  const L=ecAlle().filter(p=>(p.art||"anlage")===art).sort((a,b)=>String(b.datum||"").localeCompare(String(a.datum||""))||(b.updated||0)-(a.updated||0));
  const auf=L.filter(p=>p.status!=="fertig"), fertig=L.filter(p=>p.status==="fertig"); let h=`<div class="narrow">`;
  if(art==="geraete"){ const bis=ecPlus(ecHeute(),1), F=live("betriebsmittel").filter(b=>b.naechste&&b.naechste<=bis).sort((a,b)=>a.naechste.localeCompare(b.naechste));
    if(F.length){ const M=new Map(); F.forEach(b=>{ if(!M.has(b.ortId)) M.set(b.ortId,[]); M.get(b.ortId).push(b); });
      h+=`<div class="sec-lbl">Fällig in den nächsten 4 Wochen</div>${listOf([...M].map(([o,G])=>`<div class="li" role="button" tabindex="0" data-act="ecNeuOrt" data-art="geraete" data-ort="${esc(o)}"><span class="av">${icon("warn")}</span>
        <span class="lt"><span class="h">${esc(ecOrt(o).titel)}</span><span class="s">${G.length} Gerät${G.length>1?"e":""} · ab ${esc(ecDatum(G[0].naechste))}</span></span>${pill(G[0].naechste<ecHeute()?"bad":"wip",G[0].naechste<ecHeute()?"überfällig":"bald fällig")}</div>`))}`; } }
  if(!L.length&&art==="netz") return h+`<div class="empty">${icon("ecNetz")}<h2>Noch keine Netzwerkprüfung</h2><p>Datenverkabelung qualifizieren (z. B. mit dem SignalTEK CT): Netzwerkschrank und Datendosen anlegen, jeden Link messen – das Protokoll landet in der Bibliothek.</p></div></div>`;
  if(!L.length) return h+`<div class="empty">${icon(art==="geraete"?"ecStecker":"home")}<h2>${art==="geraete"?"Noch keine Geräteprüfung":"Noch keine Installationsprüfung"}</h2><p>${art==="geraete"
      ?"Ortsveränderliche Geräte (DGUV V3, DIN VDE 0701-0702): Geräte je Kunde erfassen, prüfen, Prüffrist setzen – das Protokoll landet in der Bibliothek."
      :"Hausinstallationen und Anlagen (DIN VDE 0100-600 / 0105-100): Räume, Verteiler, Stromkreise und Steckdosen anlegen, besichtigen, messen – das Protokoll landet in der Bibliothek."}</p></div></div>`;
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
  dialog(`Neue ${EC_ART[art]||"Prüfung"}`,`<div class="fg1">
    ${sf("ecKunde","Kunde",kundeId||"",[["","Kunde wählen …"],...K.map(k=>[k.id,k.name+(k.kdnr?` (${k.kdnr})`:"")])],{form:true})}
    <div id="ecOrtFeld">${ecOrtFeld(kundeId,ort)}</div>
    ${K.length?"":`<p class="meta">Noch keine Kunden – erst unter „Kunden“ anlegen.</p>`}</div>
    <p class="meta" style="margin:12px 4px 0">Prüfart, Messgerät und Umfang legst du danach im Schritt „Auftrag“ fest.</p>`,
    `<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="ecNeuOk">Anlegen</button>`,{breit:true}); }
function ecNeuOk(){ const F=formVals(); if(!F.ecKunde){ toast("Bitte einen Kunden wählen"); return; }
  const ortId=F.ecOrt||"k:"+F.ecKunde, art=ecNeuArt, vorher=ecAlle().filter(p=>p.ortId===ortId&&(p.art||"anlage")===art).sort((a,b)=>String(b.datum).localeCompare(String(a.datum)))[0];
  const MG=ecMessgeraete(art), zuletzt=ecAlle().filter(p=>(p.art||"anlage")===art&&p.geraet&&p.geraet.mgId).sort((a,b)=>(b.updated||0)-(a.updated||0))[0];
  const mg=MG.find(m=>m.bei&&m.bei===ME.mail)||(zuletzt&&MG.find(m=>m.id===zuletzt.geraet.mgId))||MG.find(m=>/\bCT\b/.test(m.modell||""))||MG[0]; /* zugeteilt > zuletzt benutzt > neuerer Tester */
  const pr={id:uid(),art,kundeId:F.ecKunde,standortId:ortId.startsWith("k:")?"":ortId,ortId,datum:ecHeute(),pruefart:vorher?"Wiederholungsprüfung":(art==="anlage"?"Erstprüfung":art==="netz"?"Abnahme":"Wiederholungsprüfung"),pruefer:ecStdPruefer(),status:"offen",
    sicht:{},werte:{},netz:vorher&&vorher.netz?{...vorher.netz}:{form:"TN-C-S"},geraet:mg?ecMgDaten(mg):{},umfang:vorher&&vorher.umfang?{...vorher.umfang}:null,fristM:vorher&&vorher.fristM||(art==="anlage"?48:12)};
  saveRec("echecks",pr,true);
  closeOverlays(); go({v:"ec",id:pr.id,tab:"auftrag"}); }

/* ---- Schritte (Seitenleiste in der Prüfung) ---- */
function ecSchritte(pr){ const zu=ecFehlt(pr).length&&pr.status!=="fertig";
  return ecAn(pr)?[["auftrag","Auftrag","project"],["gebaeude","Gebäude","home"],["sicht",matchMedia("(max-width:479px)").matches?"Sicht":"Besichtigung","ecSicht"],["messen","Messen","ecMess"],["abschluss","Abschluss","done",zu]]
    :ecNz(pr)?[["auftrag","Auftrag","project"],["gebaeude","Gebäude","home"],["infra",matchMedia("(max-width:479px)").matches?"Infra":"Infrastruktur","ecNetz"],["messen","Messen","ecMess"],["abschluss","Abschluss","done",zu]]
    :[["auftrag","Auftrag","project"],["geraete","Geräte","ecStecker"],["abschluss","Abschluss","done",zu]]; }
const ecTab=pr=>{ const T=ecSchritte(pr); return T.some(x=>x[0]===nav.tab)?nav.tab:"auftrag"; };
const ecWeiter=(v,t)=>`<div class="ec-weiter"><button class="btn-filled" data-act="ecTab" data-v="${v}">${esc(t)}${icon("chev")}</button></div>`;

/* ---- Prüfung ---- */
/* Kachel „Messgerät“ in der Leiste: Bild, Kurzname, Kalibrierstatus – antippen öffnet die Auswahl */
function ecKMg(pr){ const M=ecMgAktuell(pr), kal=M.mess?ecKal(M.kal):null, zu=pr.status==="fertig";
  return `<button type="button" class="ec-k ec-kmg" data-act="ecPick" data-w="mg" ${zu?"disabled":""} title="Messgerät wählen">${ecMgBild(M.bild)}<span class="ec-kmg-t"><b>${esc(M.mess?(M.kurz||M.mess):"wählen")}</b><small>${M.mess?`<i class="sd ${kal.s==="ok"?"ok":kal.s==="wip"?"wip":"bad"}"></i>${esc(kal.s==="ok"?"kalibriert":kal.s==="wip"?"Kalibrierung läuft ab":"Kalibrierung fehlt")}`:"Messgerät"}</small></span></button>`; }
function ecKennzahlen(pr){ const k=(z,t,bar,rot)=>`<div class="ec-k"><b${rot?' class="rot"':""}>${z}</b><small>${t}</small>${bar!=null?`<span class="ec-bar"><i style="width:${Math.round(bar*100)}%"></i></span>`:""}</div>`;
  if(ecNz(pr)){ const g=ecGeb(pr.ortId), L=ecNetListe(pr,g), st=L.map(p=>ecNetStand(pr,p)), n=st.filter(x=>["ok","bad","ng"].includes(x)).length, m=st.filter(x=>x==="bad").length, D=new Set(L.map(p=>p.d.id)).size;
    return `<div class="ec-kz">${k(`${n} / ${L.length}`,"Links gemessen",L.length?n/L.length:0)}${k(D,`Datendose${D===1?"":"n"}`)}${k(m,"Mängel",null,m>0)}${ecKMg(pr)}</div>`; }
  if(!ecAn(pr)){ const B=ecGeraeteAm(pr.ortId), st=B.map(b=>ecGerStand(pr,b)), n=st.filter(x=>["ok","bad","ng"].includes(x)).length, m=st.filter(x=>x==="bad").length;
    return `<div class="ec-kz">${k(`${n} / ${B.length}`,"Geräte geprüft",B.length?n/B.length:0)}${k(m,"Mängel",null,m>0)}${k(`${pr.fristM||12} Mon.`,"Prüffrist")}${ecKMg(pr)}</div>`; }
  const g=ecGeb(pr.ortId), S=g.stromkreise.filter(x=>ecImUmfang(pr,x)), st=S.map(s=>ecSkStand(pr,g,s)), n=st.filter(x=>["ok","bad","ng"].includes(x)).length;
  const P=ecAllePunkte(g).filter(p=>ecImUmfang(pr,ecSkVon(g,p))&&ecPflicht(p.st)), pn=P.filter(p=>["ok","bad","ng"].includes(ecPunktStand(pr,g,p))).length;
  const m=st.filter(x=>x==="bad").length+Object.values(pr.sicht||{}).filter(v=>v==="nok").length, si=ecSichtZahl(pr);
  return `<div class="ec-kz">${k(`${n} / ${S.length}`,"Stromkreise fertig",S.length?n/S.length:0)}${k(`${pn} / ${P.length}`,"Messpunkte",P.length?pn/P.length:0)}${k(m,"Mängel",null,m>0)}${ecKMg(pr)}</div>`; }
function ecView(pr){ const tab=ecTab(pr), zu=pr.status==="fertig";
  const schr=tab==="infra"&&ecNz(pr)&&nav.schr&&ecGeb(pr.ortId).schraenke.find(x=>x.id===nav.schr);
  const body=schr?ecRackView(pr,schr):tab==="auftrag"?ecAuftragView(pr):tab==="gebaeude"?ecGebView(pr):tab==="infra"?ecInfraView(pr):tab==="sicht"?ecSichtView(pr):tab==="messen"?(ecNz(pr)?ecNetMessView(pr):ecMessView(pr)):tab==="geraete"?ecGerListe(pr):ecAbschlussView(pr);
  return `<div class="narrow ec">${zu?`<div class="robanner">${icon("lock")}<span>Abgeschlossen am ${esc(ecDatum(pr.fertigAm||pr.datum))} – zum Ändern unter „Abschluss“ wieder öffnen.</span></div>`:""}
    <div class="ec-body${zu?" zu":""}">${body}</div></div>`; }
const ecFeld=(pr,k,l,v,o={})=>{ const id="f_ec_"+k.replace(".","_"), zu=pr.status==="fertig";
  return `<div class="tf${v||o.ph||o.type==="date"?" fl":""}${o.full?" full":""}"><input id="${id}" data-ec="${k}" value="${esc(v||"")}" placeholder="${esc(o.ph||" ")}" ${o.type?`type="${o.type}"`:""} autocomplete="off" ${zu?"disabled":""}><label for="${id}">${esc(l)}</label></div>`; };
const ecWahlSel=(pr,k,l,v,opts)=>{ const id="f_ec_"+k.replace(".","_");
  return `<div class="tf fl"><select id="${id}" data-ec="${k}" ${pr.status==="fertig"?"disabled":""}>${opts.map(o=>`<option ${o===v?"selected":""}>${esc(o)}</option>`).join("")}</select><label for="${id}">${esc(l)}</label><span class="arr">${icon("drop")}</span></div>`; };
function ecUmfangAuto(pr,g){ const V=g.verteiler.filter(v=>ecImUmfang(pr,{vId:v.id})), aus=g.verteiler.filter(v=>!ecImUmfang(pr,{vId:v.id}));
  return `Besichtigen, Erproben und Messen der elektrischen Anlage nach DIN VDE 0100-600 bzw. DIN VDE 0105-100${V.length?`. Verteiler: ${V.map(v=>v.name).join(", ")}`:""}.${aus.length?` Nicht Bestandteil dieser Prüfung: ${aus.map(v=>v.name).join(", ")}.`:""}`; }
/* Auftrag: gruppierte Einstellungen wie in den System-Einstellungen – Zeile antippen öffnet die Auswahl, Texte direkt in der Zeile */
const EC_PA={anlage:EC_PRUEFART,geraete:["Wiederholungsprüfung","Erstprüfung"],netz:["Abnahme","Wiederholungsprüfung","Fehlersuche"]};
const EC_KABEL=["Cat 5e U/UTP","Cat 6 U/UTP","Cat 6A U/FTP","Cat 6A S/FTP","Cat 7 S/FTP Verlegekabel, Cat 6A Module","Cat 7A S/FTP Verlegekabel, Cat 6A Module"];
function ecKalBis(t){ t=String(t||"").trim(); let m; if((m=t.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/))) return new Date(+m[3],+m[2]-1,+m[1]); if((m=t.match(/^(\d{1,2})[./](\d{4})$/))) return new Date(+m[2],+m[1],0); return null; }
function ecKal(kal){ if(!kal) return {s:"bad",t:"Kalibrierung fehlt"}; const b=ecKalBis(kal); if(!b) return {s:"wip",t:`kalibriert bis ${kal}`}; const rest=Math.floor((b-new Date())/864e5);
  return rest<0?{s:"bad",t:`Kalibrierung abgelaufen (${kal})`}:rest<=60?{s:"wip",t:`Kalibrierung läuft ab ${kal}`}:{s:"ok",t:`kalibriert bis ${kal}`}; }
/* gewähltes Messgerät: aktuelle Daten aus „Messgeräte“, sonst die beim Auswählen gemerkten */
function ecMgAktuell(pr){ const G=pr.geraet||{}, m=G.mgId&&DB.geraete&&DB.geraete.get(G.mgId); return m&&!m.deleted?{...ecMgDaten(m),bild:m.bild||m.bildUrl||""}:{...G}; }
const ecMgBild=(u,gross)=>`<span class="ec-mgb${gross?" gross":""}">${icon("ecMess")}${u?`<img src="${esc(u)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">`:""}</span>`;
const ecZ=(l,inhalt,o={})=>`<${o.act?"button type=\"button\"":"div"} class="ec-zl${o.act?" tap":""}"${o.act?` data-act="${o.act}"${o.w?` data-w="${o.w}"`:""}${o.dis?" disabled":""}`:""}><span class="ec-zl-l">${l}${o.s?`<small>${esc(o.s)}</small>`:""}</span>${inhalt}${o.act&&!o.dis&&!o.ohneChev?icon("chev"):""}</${o.act?"button":"div"}>`;
const ecZWert=(v,ph)=>`<span class="ec-zl-w${v?"":" leer"}">${esc(v||ph||"–")}</span>`;
const ecZFeld=(pr,k,v,ph,typ)=>`<input class="ec-zl-in" id="f_ec_${k}" data-ec="${k}" value="${esc(v||"")}" placeholder="${esc(ph||"")}" ${typ?`type="${typ}"`:""} autocomplete="off" ${pr.status==="fertig"?"disabled":""} aria-label="${esc(ph||k)}">`;
const ecZSeg=(act,cur,opts,zu)=>`<span class="ec-sg">${opts.map(([v,t])=>`<button type="button" data-act="${act}" data-v="${v}" aria-pressed="${String(cur)===String(v)}" ${zu?"disabled":""}>${esc(t)}</button>`).join("")}</span>`;
const ecGr=(titel,zeilen,fuss)=>`<section class="ec-gru">${titel?`<h3 class="ec-grt">${titel}</h3>`:""}<div class="ec-gr">${zeilen.join("")}</div>${fuss?`<p class="ec-grf">${fuss}</p>`:""}</section>`;
/* Auftrag wie in EVSE: oben die Kennzahlen, darunter Karten untereinander */
function ecAuftragView(pr){ const o=ecOrt(pr.ortId), an=ecAn(pr), nz=ecNz(pr), N=pr.netz||{}, zu=pr.status==="fertig", g=an||nz?ecGeb(pr.ortId):null, M=ecMgAktuell(pr), kal=M.mess?ecKal(M.kal):null;
  const PL=ecPrueferListe(), chipsP=PL.length&&!zu?`<div class="chips ec-wahl">${PL.map(m=>`<button type="button" class="chip" data-act="ecPruefer" data-n="${esc(m.name)}" aria-pressed="${m.name===pr.pruefer}">${esc(m.name)}</button>`).join("")}</div>`:"";
  const auftrag=`<section class="card"><h3>Auftrag</h3><div class="ec-ortz">${icon("ort")}<div><b>${esc(o.kunde?o.kunde.name:"Kein Kunde")}</b><span>${esc(o.standort?[o.standort.name,adrText(o.standort)].filter(Boolean).join(" · "):(o.name||""))}</span></div></div>
    <div class="ec-fg"><div class="reihe2">${ecFeld(pr,"auftragsnr","Auftragsnummer",pr.auftragsnr)}${ecFeld(pr,"datum","Prüfdatum",pr.datum,{type:"date"})}</div>
      ${ecFeld(pr,"pruefer","Prüfer",pr.pruefer)}${chipsP}
      ${ecFeld(pr,"bez","Bezeichnung (optional)",pr.bez,{ph:an?"z. B. Einfamilienhaus, Erweiterung Küche":nz?"z. B. Neubau Büro, Erweiterung 2. OG":"z. B. Büro und Werkstatt"})}</div></section>`;
  /* Messgerät: nur auswählen – Seriennummer und Kalibrierung kommen aus „Messgeräte“ */
  const MG=ecMessgeraete(pr.art||"anlage"), G=pr.geraet||{}, hand=M.mess&&!G.mgId;
  const mg=`<section class="card"><h3>Messgerät</h3><div class="ec-fg"><div class="tf fl"><select id="f_ecMg" ${zu?"disabled":""}>${!G.mgId&&!hand?`<option value="" selected>– wählen –</option>`:""}${MG.map(m=>`<option value="${esc(m.id)}" ${m.id===G.mgId?"selected":""}>${esc(ecMgLabel(m))}</option>`).join("")}${hand?`<option value="__hand" selected>${esc(M.mess)} (von Hand)</option>`:""}<option value="__neu">Von Hand eintragen …</option></select><label for="f_ecMg">Messgerät</label><span class="arr">${icon("drop")}</span></div></div>
    ${M.mess?`<div class="ec-mginfo">${ecMgBild(M.bild)}<span>${esc(M.sn?`Seriennummer ${M.sn}`:"Seriennummer fehlt")}</span>${pill(kal.s,kal.t)}</div>`:MG.length?"":`<p class="meta" style="margin:10px 4px 0">Noch kein passendes Messgerät – in der Übersicht unter „Messgeräte“ anlegen${nz?" (Einsatz „Netzwerk“)":""}.</p>`}</section>`;
  const sg=(l,act,cur,opts)=>`<div class="ec-sgz"><span class="lbl">${l}</span>${ecZSeg(act,cur,opts,zu)}</div>`;
  const pruef=`<section class="card"><h3>Prüfung</h3><div class="ec-fg">${ecWahlSel(pr,"pruefart","Prüfart",pr.pruefart,EC_PA[pr.art||"anlage"]||EC_PRUEFART)}
      ${nz?`${ecFeld(pr,"kabel","Verkabelung",pr.kabel,{ph:"z. B. Cat 7 Verlegekabel, Cat 6A Module"})}${zu?"":`<div class="chips ec-wahl">${EC_KABEL.map(x=>`<button type="button" class="chip" data-act="ecPickSet" data-w="kabel" data-v="${esc(x)}" aria-pressed="${x===pr.kabel}">${esc(x)}</button>`).join("")}</div>`}
        ${sg("Belegung","ecBelegStd",ecWmStd(pr),[["T568A","T568A"],["T568B","T568B"]])}${sg("Schirm","ecSchirmStd",pr.schirm==="nein"?"nein":"ja",[["ja","geschirmt"],["nein","ungeschirmt"]])}`
      :an?`${sg("Netzform","ecNetz",N.form||"TN-C-S",[["TN-C-S","TN-C-S"],["TN-S","TN-S"],["TT","TT"]])}${ecFeld(pr,"netz.hak","Hausanschluss (z. B. 63 A)",N.hak)}`:""}</div>
    <p class="meta" style="margin:10px 4px 0">${nz?"Übertragungsprüfung (Qualifizierung) nach IEEE 802.3 – keine Zertifizierung nach DIN EN 50173; dafür braucht es ein Zertifizierungs-Messgerät.":an?"Nach DIN VDE 0100-600 (Erstprüfung) bzw. DIN VDE 0105-100 (Wiederholungsprüfung).":"Nach DIN VDE 0701-0702 und DGUV Vorschrift 3."}</p></section>`;
  let umf="";
  if(nz||an){ const L=nz?g.schraenke.map(s2=>[s2.id,s2.name,ecNetImUmfang(pr,{sId:s2.id})]):g.verteiler.map(v=>[v.id,v.name,ecImUmfang(pr,{vId:v.id})]), act=nz?"ecUmfangS":"ecUmfangV";
    umf=`<section class="card"><h3>Prüfumfang</h3>${L.length?`<div class="lbl">Welche ${nz?"Netzwerkschränke":"Verteiler"} werden heute geprüft?</div><div class="chips ec-wahl">${L.map(([id,n,ein])=>`<button type="button" class="chip" data-act="${act}" data-id="${esc(id)}" aria-pressed="${ein}" ${zu?"disabled":""}>${esc(n)}</button>`).join("")}</div>`
      :`<p class="meta">${nz?"Netzwerkschränke":"Verteiler"} legst du im nächsten Schritt „Gebäude“ an – dann wählst du hier, welche heute geprüft werden.</p>`}
      <div class="ec-fg" style="margin-top:12px"><div class="tf fl"><textarea id="f_ec_umfangText" data-ec="umfangText" placeholder="${esc(nz?ecNetUmfangAuto(pr,g):ecUmfangAuto(pr,g))}" ${zu?"disabled":""}>${esc(pr.umfangText||"")}</textarea><label for="f_ec_umfangText">Text im Protokoll (leer = automatisch)</label></div></div></section>`; }
  const wer=(x,t)=>x&&x.name?` ${t} ${esc(x.name)}`:"", wann=t=>new Date(t).toLocaleString("de-DE",{dateStyle:"medium",timeStyle:"short"});
  return `${ecKennzahlen(pr)}<div class="ec-spalte">${auftrag}${mg}${pruef}${umf}</div>${ecWeiter(an||nz?"gebaeude":"geraete",an||nz?"Weiter zum Gebäude":"Weiter zu den Geräten")}
    <p class="by-line">Angelegt${wer(pr.createdBy,"von")} am ${wann(pr.created||Date.now())}${pr.updated&&pr.updatedBy&&pr.updatedBy.name?` · zuletzt geändert von ${esc(pr.updatedBy.name)} am ${wann(pr.updated)}`:""}</p>`; }
/* Auswahl-Fenster */
const ecWahlZ=(act,w,v,titel,sub,an,extra)=>`<button type="button" class="ec-wz${an?" an":""}" data-act="${act}" data-w="${w}" data-v="${esc(v)}">${extra||""}<span class="ec-zl-l"><b>${esc(titel)}</b>${sub?`<small>${sub}</small>`:""}</span></button>`;
function ecPickDlg(w){ const pr=ecPr(); if(!pr) return; const knopf=`<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button>`;
  if(w==="pruefart") return dialog("Prüfart",`<div class="ec-wl">${(EC_PA[pr.art||"anlage"]||EC_PRUEFART).map(x=>ecWahlZ("ecPickSet","pruefart",x,x,"",x===pr.pruefart)).join("")}</div>`,knopf);
  if(w==="pruefer"){ const L=ecPrueferListe().length?ecPrueferListe():team();
    return dialog("Prüfer",`<div class="ec-wl">${L.map(m=>ecWahlZ("ecPickSet","pruefer",m.name,m.name,m.pruefer?"Prüfer":"",m.name===pr.pruefer)).join("")}</div>
      <div class="fg1" style="margin-top:12px">${tf("ecPrName","Andere Person",L.some(m=>m.name===pr.pruefer)?"":pr.pruefer||"",{form:true})}</div>${ecPrueferListe().length?"":`<p class="meta" style="margin-top:8px">Wer prüfen darf, legst du in der Übersicht unter Mitarbeiter fest.</p>`}`,
      `<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="ecPickPrName">Übernehmen</button>`); }
  if(w==="mg"){ const MG=ecMessgeraete(pr.art||"anlage"), G=pr.geraet||{};
    return dialog("Messgerät",MG.length?`<div class="ec-wl">${MG.map(m=>{ const k=ecKal(m.kal); return ecWahlZ("ecPickSet","mg",m.id,ecMgLabel(m),`${esc(m.sn?`SN ${m.sn}`:"Seriennummer fehlt")} ${pill(k.s,k.t)}`,m.id===G.mgId,ecMgBild(m.bild||m.bildUrl,true)); }).join("")}</div>`
      :`<p class="meta">Noch kein passendes Messgerät. In der Übersicht unter „Messgeräte“ anlegen${ecNz(pr)?" – Einsatz „Netzwerk“":""}.</p>`,
      `<button class="btn-text" data-act="ecPickMgHand">Von Hand eintragen</button>${knopf}`,{breit:true}); }
  if(w==="kabel") return dialog("Kabel",`<div class="ec-wl">${EC_KABEL.map(x=>ecWahlZ("ecPickSet","kabel",x,x,"",x===pr.kabel)).join("")}</div>
      <div class="fg1" style="margin-top:12px">${tf("ecKabel","Eigene Angabe",EC_KABEL.includes(pr.kabel)?"":pr.kabel||"",{form:true,ph:"z. B. Cat 7 S/FTP, LSA-Module"})}</div>`,
      `<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="ecPickKabelText">Übernehmen</button>`,{breit:true});
  if(w==="umfang"){ const g=ecGeb(pr.ortId), auto=ecNz(pr)?ecNetUmfangAuto(pr,g):ecUmfangAuto(pr,g);
    return dialog("Text im Protokoll",`<p class="ec-sub">Leer lassen, dann schreibt die App den Text selbst:</p><p class="ec-auto">${esc(auto)}</p>
      <div class="tf${pr.umfangText?" fl":""}"><textarea id="f_umfangText" placeholder=" ">${esc(pr.umfangText||"")}</textarea><label for="f_umfangText">Eigener Text</label></div>`,
      `<button class="btn-text" data-act="ecUmfangAuto">Automatisch</button><span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="ecUmfangOk">Speichern</button>`,{breit:true}); } }
function ecMgHandDlg(){ const pr=ecPr(), G=pr.geraet||{};
  dialog("Messgerät von Hand",`<div class="fg1">${tf("mgMess","Messgerät",G.mgId?"":G.mess||"",{form:true,ph:"Hersteller und Modell"})}<div class="reihe2">${tf("mgSn","Seriennummer",G.mgId?"":G.sn||"",{form:true})}${tf("mgKal","Kalibriert bis",G.mgId?"":G.kal||"",{form:true,ph:"z. B. 03/2027"})}</div></div>
    <p class="meta" style="margin-top:8px">Nur für Leihgeräte o. Ä. – eigene Messgeräte besser in der Übersicht anlegen, dann stehen sie hier zur Auswahl.</p>`,
    `<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="ecMgHandOk">Übernehmen</button>`,{breit:true}); }

/* Gebäude: Etagen und Räume links, Verteiler mit RCDs und Stromkreisen rechts */
function ecGebView(pr){ const g=ecGeb(pr.ortId), et=g.etagen.find(e=>e.id===nav.et)||ecEtStd(g), nz=ecNz(pr);
  const raum=r=>{ if(nz) return ecNetRaumKachel(pr,g,r); const P=ecRaumPunkte(g,r.id), S=[...new Set(P.map(p=>p.st.skId).filter(Boolean))].map(id=>g.stromkreise.find(s=>s.id===id)).filter(Boolean).sort(ecNr), ohne=P.some(p=>!p.st.skId);
    const st=P.filter(p=>ecPflicht(p.st)).map(p=>ecPunktStand(pr,g,p)), n=st.filter(x=>x!=="open").length, bad=st.filter(x=>x==="bad").length;
    return `<button class="ec-raum" data-act="ecRaum" data-id="${esc(r.id)}"><b>${esc(r.name)}</b><small>${P.length} Messpunkt${P.length===1?"":"e"}${S.length?` · ${esc(S.map(s=>s.nr||"?").join(", "))}`:""}</small>
      <span class="ec-rst">${!P.length?pill("open","noch leer"):bad?pill("bad",`${bad} Mangel`):ohne?pill("wip","Stromkreis fehlt"):n===st.length&&st.length?pill("ok","gemessen"):pill(n?"wip":"open",n?`${n} von ${st.length} gemessen`:"offen")}</span></button>`; };
  const skZeile=sk=>{ const R=ecSkRaeume(g,sk); return `<div class="ec-vz sk" role="button" tabindex="0" data-act="ecSkEdit" data-id="${esc(sk.id)}"><span class="nr">${esc(sk.nr||"–")}</span><span class="t">${esc(sk.bez||"Stromkreis")}<small>${esc([sk.schutz,sk.leitung,R.join(", ")].filter(Boolean).join(" · "))}</small></span>${icon("chev")}</div>`; };
  const vt=v=>{ const R=g.rcds.filter(r=>r.vId===v.id).sort(ecNr), S=ecSkListe(g).filter(s=>s.vId===v.id), ohne=S.filter(s=>!s.rcdId||!R.some(r=>r.id===s.rcdId));
    return `<div class="ec-vt${ecImUmfang(pr,{vId:v.id})?"":" aus"}"><div class="ec-vz kopf" role="button" tabindex="0" data-act="ecVtEdit" data-id="${esc(v.id)}"><span class="av ec-uv">${icon("ecMess")}</span><span class="t"><b>${esc(v.name)}</b><small>${esc([ecRaumName(g,v.raumId),`${S.length} Stromkreis${S.length===1?"":"e"}`,ecImUmfang(pr,{vId:v.id})?"":"nicht im Prüfumfang"].filter(Boolean).join(" · "))}</small></span>${icon("edit")}</div>
      ${R.map(r=>`<div class="ec-vz rcd" role="button" tabindex="0" data-act="ecRcdEdit" data-id="${esc(r.id)}"><span class="nr">${r.fils?"FI/LS":"RCD"}</span><span class="t">${esc(ecRcdName(r))}<small>${esc(ecRcdInfo(r)||"Daten fehlen")}</small></span>${icon("chev")}</div>
        ${S.filter(s=>s.rcdId===r.id).map(skZeile).join("")}`).join("")}
      ${ohne.length&&R.length?`<div class="ec-vz rcd ohne"><span class="nr"></span><span class="t">ohne RCD</span></div>`:""}${ohne.map(skZeile).join("")}
      ${pr.status==="fertig"?"":`<div class="ec-vt-f"><button class="btn-text" data-act="ecRcdNeu" data-v="${esc(v.id)}">${icon("add")}RCD</button><button class="btn-text" data-act="ecSkNeu" data-v="${esc(v.id)}">${icon("add")}Stromkreis</button></div>`}</div>`; };
  const ohneV=ecSkListe(g).filter(s=>!s.vId||!g.verteiler.some(v=>v.id===s.vId));
  return `<div class="ec-et">${ecEtagen(g).map(e=>{ const gs=ecGeschossName(ecEbene(e)), zwei=ecEtLabel(e)!==e.name; return `<button class="ec-etk${e===et?" an":""}${zwei?" zwei":""}" data-act="ecEt" data-id="${esc(e.id)}">${esc(e.name)}${zwei?`<small>${esc(gs)}</small>`:""}</button>`; }).join("")}${pr.status==="fertig"?"":`<button class="ec-etk plus" data-act="ecEtNeu" aria-label="Etage hinzufügen" title="Etage hinzufügen">${icon("add")}</button>`}</div>
    <div class="${nz?"ec-eins":"ec-zwei"}"><div>${kdKopf(`Räume im ${esc(et?et.name:"")}`,et&&"ecRaumNeu","Raum hinzufügen")}
      ${et&&et.raeume.length?`<div class="ec-raster">${et.raeume.map(raum).join("")}</div>`:`<p class="meta">Noch keine Räume. Mit + anlegen – z. B. Küche, Bad, Flur, Hausanschlussraum.</p>`}
      ${et&&pr.status!=="fertig"?`<button class="btn-text ec-etedit" data-act="ecEtEdit" data-id="${esc(et.id)}">${icon("edit")}Etage „${esc(et.name)}“ umbenennen oder löschen</button>`:""}</div>
    ${nz?"":`<div>${kdKopf("Verteiler","ecVtNeu","Verteiler hinzufügen")}${g.verteiler.length?g.verteiler.map(vt).join(""):`<p class="meta">Noch kein Verteiler. Am besten zuerst den Verteiler mit seinen RCDs und Stromkreisen anlegen, dann durch die Räume gehen.</p>`}
      ${ohneV.length?`<div class="ec-vt"><div class="ec-vz kopf"><span class="t"><b>Ohne Verteiler</b></span></div>${ohneV.map(skZeile).join("")}</div>`:""}</div>`}</div>
    <p class="hint">${nz?"Raum antippen, um Datendosen in Laufreihenfolge anzulegen. Netzwerkschränke und Patchfelder kommen im nächsten Schritt „Infrastruktur“. Räume und Etagen teilt sich die Netzwerkprüfung mit der Installationsprüfung.":"Raum antippen, um Steckdosen und andere Anschlusspunkte in Laufreihenfolge anzulegen (Vorschlag: ab der Tür im Uhrzeigersinn). Alles bleibt für die nächste Prüfung erhalten."}</p>
    ${nz?ecWeiter("infra","Weiter zur Infrastruktur"):ecWeiter("sicht","Weiter zur Besichtigung")}`; }
/* Infrastruktur (Netzwerk): Netzwerkschränke mit kleiner Vorschau, Kennzahlen, Dosen ohne Schrank */
function ecRkMini(pr,g,s){ const {M}=ecRkLinks(g,s); return `<div class="rk-bau mini ${ecSchrFarbe(s)}"><div class="rk mini" style="--n:${ecSchrHe(s)}">${ecSchrTeile(s).map(t=>ecRkTeilHtml(pr,g,s,t,M)).join("")}</div></div>`; }
function ecInfraView(pr){ const g=ecGeb(pr.ortId), zu=pr.status==="fertig", S=g.schraenke, P=S.map(s=>ecRkPlanung(pr,g,s));
  const B=P.reduce((a,x)=>a+x.B,0), T=P.reduce((a,x)=>a+x.ports,0), SW=P.reduce((a,x)=>a+x.swPorts,0), bad=P.reduce((a,x)=>a+x.H.filter(h=>h[0]==="bad").length,0), hw=P.reduce((a,x)=>a+x.H.filter(h=>h[0]==="wip").length,0);
  const k=(z,t,bar,rot)=>`<div class="ec-k"><b${rot?' class="rot"':""}>${z}</b><small>${t}</small>${bar!=null?`<span class="ec-bar"><i style="width:${Math.round(bar*100)}%"></i></span>`:""}</div>`;
  const karte=(s,PL)=>{ const T2=ecSchrTeile(s), haupt=T2.filter(t=>["switch","router","usv"].includes(t.typ)).map(ecRkName), b2=PL.H.filter(h=>h[0]==="bad").length, h2=PL.H.filter(h=>h[0]==="wip").length;
    return `<div class="ec-ik" role="button" tabindex="0" data-act="ecRkAuf" data-id="${esc(s.id)}" data-ctx="ecSchrEdit">${ecRkMini(pr,g,s)}<div class="ec-ik-t"><b>${esc(s.name)}</b><span>${esc([ecSchrText(s),ecRaumName(g,s.raumId)].filter(Boolean).join(" · "))}</span>
      <span>${PL.B} von ${PL.ports} Patchports belegt · ${PL.frei} HE frei</span>${haupt.length?`<span class="ec-ik-g">${esc(haupt.join(" · "))}</span>`:""}
      <span class="ec-ik-p">${b2?pill("bad",`${b2} Problem${b2>1?"e":""}`):h2?pill("wip",`${h2} Hinweis${h2>1?"e":""}`):pill("ok","Planung passt")}${ecNetImUmfang(pr,{sId:s.id})?"":pill("open","nicht im Prüfumfang")}</span></div>${icon("chev")}</div>`; };
  const A=ecNetAlle(g), ohne=A.filter(p=>!p.d.sId||!S.some(s=>s.id===p.d.sId));
  return `<div class="ec-kz">${k(S.length,`Netzwerkschr${S.length===1?"ank":"änke"}`)}${k(`${B} / ${T}`,"Patchports belegt",T?B/T:0)}${k(SW,"Switch-Ports")}${k(bad||hw,bad?"Probleme":"Hinweise",null,bad>0)}</div>
    ${kdKopf("Netzwerkschränke",zu?"":"ecSchrNeu","Schrank hinzufügen")}
    ${S.length?`<div class="ec-iks">${S.map((s,i)=>karte(s,P[i])).join("")}</div><p class="meta" style="margin:8px 4px 0">Antippen öffnet den Schrank. Bearbeiten: Rechtsklick, am Handy lange drücken.</p>`
      :`<div class="empty">${icon("ecNetz")}<h2>Noch kein Netzwerkschrank</h2><p>Leg den Hauptschrank an – z. B. im Technikraum – und, falls vorhanden, Unterverteiler auf den Etagen. Patchfelder, Switches und alles Weitere planst du im Schrank.</p></div>`}
    ${ohne.length?`<div class="sec-lbl" style="margin-top:20px">Datendosen ohne Schrank · ${ohne.length} Port${ohne.length>1?"s":""}</div><div class="list">${ohne.map(p=>`<div class="li" role="button" tabindex="0" data-act="ecDose" data-id="${esc(p.d.id)}"><span class="av">${icon("ecNetz")}</span><span class="lt"><span class="h">${esc(ecLinkName(g,p))}</span><span class="s">${esc([ecDoseName(p.d),p.d.lage].filter(Boolean).join(" · "))}</span></span>${icon("chev")}</div>`).join("")}</div>`:""}
    ${ecWeiter("messen","Weiter zum Messen")}`; }
/* Besichtigung */
function ecSichtView(pr){ const S=pr.sicht||{}, tri=(k)=>`<span class="ec-tri">${[["ok","i. O."],["nok","n. i. O."],["na","entfällt"]].map(([v,t])=>`<button data-act="ecSicht" data-k="${k}" data-v="${v}" aria-pressed="${S[k]===v}" class="${v}">${t}</button>`).join("")}</span>`;
  return `<div class="sec-row"><div class="sec-lbl">Besichtigen nach DIN VDE 0100-600</div><button class="btn-text" data-act="ecSichtAlle">Übrige i. O.</button></div>
    <div class="list ec-sicht">${EC_SICHT.map((t,i)=>`<div class="ec-sz"><span>${esc(t)}</span>${tri("s"+i)}</div>`).join("")}</div>${ecWeiter("messen","Weiter zum Messen")}`; }
/* Messen: nach Verteiler (so misst man) oder nach Raum (so läuft man durchs Haus) */
const ecMw=(v,e,st,l)=>`<span class="mw ${st||"leer"}" data-l="${l}">${v?esc(v)+" "+e:"–"}</span>`;
function ecMessView(pr){ const g=ecGeb(pr.ortId), mv=nav.mv==="raum"?"raum":"vt", S=g.stromkreise.filter(s=>ecImUmfang(pr,s)), fertig=S.filter(s=>!["open","wip"].includes(ecSkStand(pr,g,s))).length;
  let h=`<div class="ec-mkopf">${seg("ecMv",mv,[["vt","Verteiler"],["raum","Räume"]],"ec-mv")}<span class="ec-mknoepfe">${pr.status==="fertig"?"":`<button class="btn-tonal" data-act="ecImport">${icon("ecImport")}Sparkify-Import</button>`}</span></div>
    <p class="meta">${fertig} von ${S.length} Stromkreisen fertig${(pr.importe||[]).length?` · ${pr.importe.length} Datei${pr.importe.length>1?"en":""} importiert`:""}</p>`;
  if(!g.stromkreise.length&&!g.stellen.length) return h+`<p class="meta">Noch nichts zu messen. Unter „Gebäude“ Verteiler, Stromkreise und Räume anlegen – oder eine Sparkify-Datei importieren, dann legt die App Stromkreise und Messpunkte selbst an.</p>`;
  if(mv==="vt"){ const zeile=sk=>{ const w=ecW(pr,sk.id), P=ecSkPunkte(g,sk.id), zm=ecZsMax(pr,g,sk), gz=EC_F.zs.gw(sk), R=ecSkRaeume(g,sk), st=ecSkStand(pr,g,sk);
      const pz=P.filter(p=>ecPflicht(p.st)), pn=pz.filter(p=>ecPunktStand(pr,g,p)!=="open").length;
      return `<div class="ec-sk${ecImUmfang(pr,sk)?"":" aus"}" role="button" tabindex="0" data-act="ecMess" data-id="${esc(sk.id)}"><span class="nr">${esc(sk.nr||"–")}</span><span class="bz">${esc(sk.bez||"Stromkreis")}<small>${esc(w.ng?`nicht gemessen: ${w.ng}`:R.join(", ")||"keinem Raum zugeordnet")}</small></span>
        <span class="sz">${esc(sk.schutz||"–")}<small>${pz.length?`${pn}/${pz.length} Punkte`:""}</small></span>${ecMw(w.riso,"MΩ",ecWertStand(EC_F.riso.gw(),w.riso),"R iso")}${ecMw(w.rlo,"Ω",ecWertStand(EC_F.rlo.gw(),w.rlo),"R LO")}
        ${ecMw(zm?(zm.g+ecFmt(zm.n)):"","Ω",zm?ecWertStand(gz,zm.g+zm.n):"","Z s max")}<span class="er">${ecPill(st)}</span></div>`; };
    const rcdZeile=r=>{ const w=ecW(pr,r.id), st=ecRcdStand(pr,r);
      return `<div class="ec-rcd" role="button" tabindex="0" data-act="ecRcdMess" data-id="${esc(r.id)}"><span class="nr">${esc(ecRcdName(r))}</span><span class="bz">${esc(ecRcdInfo(r))}</span>
        ${ecMw(w.t1,"ms",ecWertStand(EC_F.t1.gw(r),w.t1),"t 1×")}${ecMw(w.idelta,"mA",ecWertStand(EC_F.idelta.gw(r),w.idelta),"IΔ")}${ecMw(w.ub,"V",ecWertStand(EC_F.ub.gw(),w.ub),"U B")}<span class="er">${ecPill(st)}</span></div>`; };
    const V=[...g.verteiler,{id:"",name:"Ohne Verteiler"}];
    h+=`<div class="list ec-tab"><div class="ec-sk h"><span>Nr.</span><span>Stromkreis</span><span>Schutz</span><span>R iso</span><span>R LO</span><span>Z s max</span><span>Ergebnis</span></div>`;
    V.forEach(v=>{ const SS=ecSkListe(g).filter(s=>v.id?s.vId===v.id:(!s.vId||!g.verteiler.some(x=>x.id===s.vId))); if(!SS.length) return; const R=g.rcds.filter(r=>r.vId===v.id).sort(ecNr);
      h+=`<div class="ec-rk">${esc(v.name)}${v.id&&!ecImUmfang(pr,{vId:v.id})?" · nicht im Prüfumfang":""}</div>`;
      R.forEach(r=>{ const RS=SS.filter(s=>s.rcdId===r.id); if(!RS.length) return; h+=rcdZeile(r)+RS.map(zeile).join(""); });
      h+=SS.filter(s=>!s.rcdId||!R.some(r=>r.id===s.rcdId)).map(zeile).join(""); });
    h+=`</div><p class="hint">Stromkreis antippen: oben steht, was am MFT one einzustellen ist, darunter R iso, RCD und Z s an jedem Messpunkt. „Weiter“ springt zum nächsten Stromkreis.</p>`; }
  else { const R=ecRaeume(g).filter(r=>ecRaumPunkte(g,r.id).length);
    if(!R.length) h+=`<p class="meta">Noch keine Messpunkte. Unter „Gebäude“ einen Raum antippen und Steckdosen anlegen.</p>`;
    h+=R.map(r=>{ const P=ecRaumPunkte(g,r.id);
      return `<div class="sec-row"><div class="sec-lbl">${esc(r.titel)}</div>${pr.status==="fertig"?"":`<button class="btn-text" data-act="ecRaumMess" data-id="${esc(r.id)}">${icon("ecMess")}Raum messen</button>`}</div>
        <div class="list">${P.map(p=>{ const sk=ecSkVon(g,p), w=ecW(pr,p.id), st=ecPunktStand(pr,g,p);
          return `<div class="ec-pt" role="button" tabindex="0" data-act="ecRaumMess" data-id="${esc(r.id)}"><span class="nr">${esc(p.nr)}</span><span class="bz">${esc(ecStName(p.st))}<small>${esc(p.st.lage||"")}</small></span>
            <span class="sz">${esc(sk?sk.nr||sk.bez||"":"kein Stromkreis")}<small>${esc(sk&&sk.schutz||"")}</small></span>${ecMw(w.zs,"Ω",sk?ecWertStand(EC_F.zs.gw(sk),w.zs):"","Z s")}<span class="er">${ecPill(st)}</span></div>`; }).join("")}</div>`; }).join("");
    h+=`<p class="hint">„Raum messen“: alle Punkte des Raums in Laufreihenfolge, je ein Feld für Z s – Werte, die je Stromkreis gelten (R iso, RCD), stehen unter „Nach Verteiler“.</p>`; }
  return h+ecWeiter("abschluss","Weiter zum Abschluss"); }
/* Geräte */
function ecGerListe(pr){ const B=ecGeraeteAm(pr.ortId);
  return kdKopf(`Geräte · ${B.length}`,"ecBmNeu","Gerät hinzufügen")+(B.length?listOf(B.map(b=>{ const st=ecGerStand(pr,b), w=ecW(pr,b.id);
    return `<div class="li" role="button" tabindex="0" data-act="ecGer" data-id="${esc(b.id)}"><span class="av">${icon("ecStecker")}</span><span class="lt"><span class="h">${esc(b.bez||"Gerät")}</span>
      <span class="s">${esc([b.typ,b.inv&&`Inv. ${b.inv}`,`SK ${b.sk||"I"}`,b.raum,w.ng?`nicht geprüft: ${w.ng}`:b.naechste&&`fällig ${ecDatum(b.naechste)}`].filter(Boolean).join(" · "))}</span></span>${ecPill(st==="ng"?"ng":st)}</div>`; }))
    :`<p class="meta">Noch keine Geräte an diesem Ort. Mit + anlegen – z. B. Bohrmaschine, Kaffeemaschine, Verlängerung.</p>`)+ecWeiter("abschluss","Weiter zum Abschluss"); }
/* Abschluss */
function ecAbschlussView(pr){ const an=ecAn(pr), nz=ecNz(pr), F=ecFehlt(pr), zu=pr.status==="fertig";
  if(F.length&&!zu) return `<div class="ec-gesperrt">${icon("lock")}<h2>Abschluss noch nicht möglich</h2><p>Es fehlen noch:</p><ul>${F.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>
    <div class="ec-knoepfe">${nz?`<button class="btn-tonal" data-act="ecTab" data-v="messen">Zum Messen</button>`:an?`<button class="btn-tonal" data-act="ecTab" data-v="sicht">Zur Besichtigung</button><button class="btn-tonal" data-act="ecTab" data-v="messen">Zum Messen</button>`:`<button class="btn-tonal" data-act="ecTab" data-v="geraete">Zu den Geräten</button>`}</div>
    <p class="meta">${nz?"Ein Link, der nicht gemessen werden kann, lässt sich beim Messen als „nicht gemessen“ mit Grund markieren.":`Ein Stromkreis, der nicht gemessen werden kann, lässt sich beim Messen als „nicht gemessen“ mit Grund markieren.`}</p></div>`;
  const erg=ecErgebnis(pr), fr=an?[12,24,48]:[6,12,24];
  return `${ecKennzahlen(pr)}<div class="sec-row"><div class="sec-lbl">Mängel / Maßnahmen</div>${zu?"":`<button class="btn-text" data-act="ecMaengelAuto">Gefundene Mängel übernehmen</button>`}</div>
    <div class="ec-fg"><div class="tf${pr.maengel?" fl":""}"><textarea id="f_ec_maengel" data-ec="maengel" placeholder=" " ${zu?"disabled":""}>${esc(pr.maengel||"")}</textarea><label for="f_ec_maengel">Mängel und Maßnahmen</label></div></div>
    ${nz?"":`<div class="sec-lbl">Nächste Prüfung</div>`}${nz?"":seg("ecFrist",String(pr.fristM||fr[1]),fr.map(m=>[String(m),m%12?`${m} Monate`:`${m/12} Jahr${m>12?"e":""}`]))}${nz?"":`<p class="meta">Empfohlen bis ${esc(ecDatum(ecPlus(pr.datum,pr.fristM||fr[1])))} – die Frist legt der Betreiber fest.</p>`}
    <div class="ec-erg ${erg}"><span>${erg==="ok"?"Keine Mängel festgestellt.":erg==="bad"?"Mängel festgestellt – Beseitigung erforderlich.":"Prüfung noch nicht vollständig."}</span>${ecPill(erg)}</div>
    <div class="ec-knoepfe"><button class="btn-filled" data-act="ecPdf">${icon("pdf")}PDF erstellen</button>${zu?`<button class="btn-tonal" data-act="ecAuf">Wieder öffnen</button>`:`<button class="btn-tonal" data-act="ecFertig">${icon("done")}Prüfung abschließen</button>`}
      ${canEdit(pr)&&!zu?`<span style="flex:1"></span><button class="btn-text danger" data-act="ecDelAsk">Prüfung löschen</button>`:""}</div>`; }

/* ---- Dialoge ---- */
let ecDlg=null, ecLetzterSk="";
const ecPr=()=>nav.v==="ec"&&DB.echecks.get(nav.id);
const ecChips=(gr,opts,cur,dis)=>`<div class="chips ec-wahl">${opts.map(([v,t])=>`<button type="button" class="chip" data-act="ecWahl" data-g="${gr}" data-v="${esc(v)}" aria-pressed="${String(cur)===String(v)}" ${dis?"disabled":""}>${esc(t)}</button>`).join("")}</div>`;
function ecEtDlg(et){ const pr=ecPr(), g=ecGeb(pr.ortId); ecDlg={et:et?et.id:null,ebeneHand:!!(et&&et.ebene!=null)};
  const vorschl=["KG","EG","1. OG","2. OG","3. OG","DG"].filter(n=>!g.etagen.some(e=>e.name===n&&e!==et));
  dialog(et?"Etage bearbeiten":"Neue Etage",`<div class="fg1">${tf("ecName","Bezeichnung",et?et.name:"",{form:true,ph:"z. B. 1. OG oder Level 2"})}</div>
    ${vorschl.length?`<div class="chips ec-wahl">${vorschl.map(n=>`<button type="button" class="chip" data-act="ecNameSetz" data-v="${n}">${n}</button>`).join("")}</div>`:""}
    <div class="fg1" style="margin-top:14px">${sf("ecEbene","Geschoss (bestimmt die Reihenfolge)",et?String(ecEbene(et)):"",[["","aus der Bezeichnung erkennen"],...EC_GESCHOSS.map(([v,t])=>[String(v),t])],{form:true})}</div>
    <p class="meta" style="margin-top:8px">Heißt die Etage beim Kunden anders, z. B. „Level 1“, hier das echte Geschoss wählen (EG) – sortiert wird danach, angezeigt der Name.</p>
    ${et?"":`<button type="button" class="btn-text" data-act="ecEtSerieDlg" style="margin-top:6px">${icon("add")}Mehrere auf einmal (Level 1 bis 5 …)</button>`}`,
    `${et?`<button class="btn-text danger" data-act="ecEtDel">Löschen</button>`:""}<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="ecEtOk">Speichern</button>`,{breit:true}); }
function ecNameDlg(t,wert,act,del,extra){ dialog(t,`<div class="fg1">${tf("ecName","Bezeichnung",wert||"",{form:true})}${extra||""}</div>`,`${del?`<button class="btn-text danger" data-act="${del}">Löschen</button>`:""}<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="${act}">Speichern</button>`); }
/* Raum: Anschlusspunkte in Laufreihenfolge */
function ecRaumDlg(raumId){ if(ecNz(ecPr())) return ecNetRaumDlg(raumId); const pr=ecPr(), g=ecGeb(pr.ortId), zu=pr.status==="fertig", name=ecRaumName(g,raumId); if(!name) return; ecDlg={raumDlg:raumId};
  const S=g.stellen.filter(s=>s.raumId===raumId).sort((a,b)=>(a.ord||0)-(b.ord||0));
  dialog(name,S.length?`<div class="list ec-stl">${S.map((st,k)=>{ const sk=st.skId&&g.stromkreise.find(s=>s.id===st.skId), n=st.art==="sd"?+st.fach||1:1;
      return `<div class="ec-st"><span class="nr">${k+1}${n>1?`<small>.1–.${n}</small>`:""}</span><button type="button" class="ec-st-t" data-act="ecStelle" data-id="${esc(st.id)}" ${zu?"disabled":""}><b>${esc(ecStName(st))}${st.lage?` · ${esc(st.lage)}`:""}</b><small>${sk?esc(ecSkName(sk)+(sk.schutz?" · "+sk.schutz:"")):'<span class="rot">noch keinem Stromkreis zugeordnet</span>'}</small></button>
        ${zu?"":`<span class="ec-ord"><button type="button" data-act="ecOrd" data-id="${esc(st.id)}" data-d="-1" ${k?"":"disabled"} aria-label="nach vorn">${icon("chev")}</button><button type="button" class="ab" data-act="ecOrd" data-id="${esc(st.id)}" data-d="1" ${k<S.length-1?"":"disabled"} aria-label="nach hinten">${icon("chev")}</button></span>`}</div>`; }).join("")}</div>
      <p class="meta" style="margin:10px 4px 0">Reihenfolge = Nummerierung im Protokoll. Vorschlag: ab der Tür im Uhrzeigersinn.</p>`
      :`<p class="meta">Noch keine Anschlusspunkte. Leg sie in der Reihenfolge an, in der du durch den Raum gehst – z. B. ab der Tür im Uhrzeigersinn.</p>`,
    `${zu?"":`<button class="btn-text" data-act="ecRaumEdit" data-id="${esc(raumId)}">Umbenennen</button>`}<span style="flex:1"></span><button class="btn-text" data-act="cancel">Schließen</button>${zu?"":`${S.length?`<button class="btn-text" data-act="ecRaumMess" data-id="${esc(raumId)}">Messen</button>`:""}<button class="btn-text" data-act="ecStelleNeu" data-id="${esc(raumId)}">Anschlusspunkt</button>`}`,{breit:true}); }
function ecStelleDlg(stId,raumId){ const pr=ecPr(), g=ecGeb(pr.ortId), st=stId&&g.stellen.find(x=>x.id===stId), v=st||{art:"sd",fach:1,lage:"",skId:g.stromkreise.some(s=>s.id===ecLetzterSk)?ecLetzterSk:""};
  ecDlg={stelle:stId||null,raumId:st?st.raumId:raumId,w:{art:v.art,fach:String(v.fach||1),anz:"1"}};
  const SK=ecSkListe(g).map(s=>[s.id,`${ecSkName(s)}${s.schutz?" · "+s.schutz:""}${s.vId?" · "+ecVtName(g,s.vId):""}`]);
  dialog(st?"Anschlusspunkt bearbeiten":`Neu in ${ecRaumName(g,ecDlg.raumId)}`,`<div class="lbl">Art</div>${ecChips("art",Object.entries(EC_SART),v.art)}
    <div id="ecFachZeile" ${v.art==="sd"?"":"hidden"}><div class="lbl" style="margin-top:12px">Steckdosen an dieser Stelle</div>${ecChips("fach",[["1","Einfach"],["2","2-fach"],["3","3-fach"],["4","4-fach"],["5","5-fach"]],v.fach||1)}</div>
    ${st?"":`<div class="lbl" style="margin-top:12px">Wie oft gleich anlegen</div>${ecChips("anz",[["1","1×"],["2","2×"],["3","3×"],["4","4×"],["5","5×"],["6","6×"]],"1")}`}
    <div class="fg1" style="margin-top:16px">${sf("ecSk","Stromkreis",v.skId||"",[["","– noch offen –"],...SK],{form:true})}${tf("ecLage","Lage (optional)",v.lage||"",{form:true,ph:"z. B. unterm Schalter"})}</div>
    ${ecChips("lage",EC_LAGE.map(x=>[x,x]),"")}${SK.length?"":`<p class="meta" style="margin-top:8px">Noch keine Stromkreise – die legst du unter „Gebäude“ am Verteiler an. Zuordnen geht auch später.</p>`}`,
    `${st?`<button class="btn-text danger" data-act="ecStelleDel">Löschen</button>`:""}<span style="flex:1"></span><button class="btn-text" data-act="ecZumRaum">Abbrechen</button><button class="btn-text" data-act="ecStelleOk">Speichern</button>`,{breit:true}); }
function ecSkDlg(sk,vId){ const pr=ecPr(), g=ecGeb(pr.ortId); ecDlg={sk:sk&&sk.id}; const v=sk||{vId:vId||(g.verteiler[0]||{}).id||""};
  dialog(sk?"Stromkreis bearbeiten":"Neuer Stromkreis",`<div class="fg1">
    <div class="reihe2">${sf("skV","Verteiler",v.vId||"",[...g.verteiler.map(x=>[x.id,x.name]),["","ohne Verteiler"]],{form:true})}${tf("skNr","Nr. im Verteiler",v.nr||"",{form:true,ph:"z. B. F3"})}</div>
    ${tf("skBez","Bezeichnung",v.bez||"",{form:true,ph:"z. B. Steckdosen Küche Arbeitsfläche"})}
    <div class="reihe2">${tf("skSchutz","Schutzorgan",v.schutz||"",{form:true,ph:"z. B. B16"})}<div id="ecRcdFeld">${ecRcdFeld(g,v.vId,v.rcdId)}</div></div></div>
    ${ecChips("schutz",["B6","B10","B13","B16","B20","B25","C16","B32"].map(x=>[x,x]),"")}
    <div class="fg1" style="margin-top:12px">${tf("skLeitung","Leitung",v.leitung||"",{form:true,ph:"z. B. NYM-J 3×2,5"})}</div>
    ${ecChips("leitung",["NYM-J 3×1,5","NYM-J 3×2,5","NYM-J 5×1,5","NYM-J 5×2,5","NYM-J 5×6"].map(x=>[x,x]),"")}`,
    `${sk?`<button class="btn-text danger" data-act="ecSkDel">Löschen</button>`:""}<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="ecSkOk">Speichern</button>`,{breit:true}); }
const ecRcdFeld=(g,vId,cur)=>sf("skRcd","RCD",cur||"",[["","kein RCD"],...g.rcds.filter(r=>r.vId===vId).sort(ecNr).map(r=>[r.id,`${ecRcdName(r)}${ecRcdInfo(r)?" · "+ecRcdInfo(r):""}`])],{form:true});
function ecRcdDlg(r,vId){ const pr=ecPr(), g=ecGeb(pr.ortId), v=r||{vId,nr:String(g.rcds.filter(x=>x.vId===vId).length+1),typ:"A",idn:"30",in:"40"}; ecDlg={rcd:r&&r.id,vId:v.vId,w:{typ:v.typ,idn:String(v.idn||""),in:String(v.in||""),bauart:v.fils?"fils":"rcd"}};
  dialog(r?`${ecRcdName(r)} bearbeiten`:`Neuer RCD in ${ecVtName(g,v.vId)||"Verteiler"}`,`<div class="fg1">${tf("rcdNr","Nummer / Bezeichnung",v.nr||"",{form:true,ph:"z. B. 1 oder FI2"})}</div>
    <div class="lbl" style="margin-top:12px">Bauart</div>${ecChips("bauart",[["rcd","RCD (FI)"],["fils","FI/LS-Kombination"]],v.fils?"fils":"rcd")}
    <div class="lbl" style="margin-top:12px">Typ</div>${ecChips("typ",[["A","Typ A"],["F","Typ F"],["B","Typ B"],["AC","Typ AC"]],v.typ)}
    <div class="lbl" style="margin-top:12px">Bemessungsdifferenzstrom IΔN</div>${ecChips("idn",[["10","10 mA"],["30","30 mA"],["100","100 mA"],["300","300 mA"]],String(v.idn||""))}
    <div class="lbl" style="margin-top:12px">Bemessungsstrom</div>${ecChips("in",[["25","25 A"],["40","40 A"],["63","63 A"],["80","80 A"]],String(v.in||""))}`,
    `${r?`<button class="btn-text danger" data-act="ecRcdDel">Löschen</button>`:""}<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="ecRcdOk">Speichern</button>`,{breit:true}); }
/* Messfeld (großes Zahlenfeld mit Grenzwert-Ampel) und kompaktes Feld für Messpunkte */
function ecMessFeld(pr,z,k,bezug,zu){ const d=EC_F[k], w=ecW(pr,z), gw=d.gw(bezug), st=ecWertStand(gw,w[k]);
  return `<div class="ec-feld ${st}"><label for="m_${esc(z)}_${k}">${esc(d.l)}</label><span class="ec-ein"><input id="m_${esc(z)}_${k}" data-z="${esc(z)}" data-k="${k}" inputmode="decimal" value="${esc(w[k]||"")}" placeholder="–" autocomplete="off" ${zu?"disabled":""}><span>${d.e}</span></span><small class="ec-gw">${esc(gw.txt)}</small></div>`; }
function ecPunktZeile(pr,g,p,zu,mitSk){ const sk=ecSkVon(g,p), w=ecW(pr,p.id), gw=EC_F.zs.gw(sk), st=sk?ecWertStand(gw,w.zs):"";
  return `<div class="ec-pz ${st}"><span class="nr">${esc(p.nr)}</span><span class="t">${esc(ecStName(p.st))}${p.st.lage?` · ${esc(p.st.lage)}`:""}<small>${mitSk?(sk?esc(ecSkName(sk)+(sk.schutz?" · "+sk.schutz:"")):'<span class="rot">kein Stromkreis</span>'):esc(ecRaumName(g,p.raumId))}${ecPflicht(p.st)?"":" · optional"}</small></span>
    <span class="ec-ein klein"><input data-z="${esc(p.id)}" data-k="zs" inputmode="decimal" value="${esc(w.zs||"")}" placeholder="Z s" autocomplete="off" aria-label="Z s ${esc(p.nr)}" ${zu?"disabled":""}><span>Ω</span></span></div>`; }
/* Stromkreis messen: alles, was zu diesem Kreis gehört, in einem Fenster */
function ecMessDlg(skId){ const pr=ecPr(), g=ecGeb(pr.ortId), L=ecSkListe(g).filter(s=>ecImUmfang(pr,s)), i=L.findIndex(s=>s.id===skId), sk=L[i]||g.stromkreise.find(s=>s.id===skId); if(!sk) return; ecDlg={mess:sk.id};
  const w=ecW(pr,sk.id), zu=pr.status==="fertig", r=ecRcdVon(g,sk), P=ecSkPunkte(g,sk.id), eigen=ecSkZsPflicht(g,sk), rw=r?ecW(pr,r.id):{}, vor=L[i-1], nach=L[i+1];
  const ls=ecLs(sk.schutz), tipp=`Am MFT one einstellen: LS ${ls?`${ls.c} ${ecFmt(ls.In)} A`:"(Schutzorgan fehlt)"}${r?` · RCD Typ ${r.typ||"?"} ${r.idn||"?"} mA`:" · kein RCD"}. `
    +(r&&!rw.t1?`Erster Punkt: AUTO-Test (Z s, U B, RCD, R iso). Weitere Punkte: Z s im Modus „std. RCD“.`:r?`RCD schon gemessen – an den Punkten nur noch Z s im Modus „std. RCD“.`:`Z s im Modus „o.RCD“.`);
  dialog(ecSkName(sk),`<p class="ec-sub">${esc([ecVtName(g,sk.vId),sk.schutz,r&&`${ecRcdName(r)} (${ecRcdInfo(r)})`,sk.leitung].filter(Boolean).join(" · "))}</p>
    ${zu?"":`<div class="ec-tipp">${icon("info")}<span>${esc(tipp)}</span></div>`}
    <div id="ecNgZeile" ${w.ng?"":"hidden"}><div class="tf fl"><input id="m_ng" data-z="${esc(sk.id)}" data-k="ng" value="${esc(w.ng||"")}" placeholder="z. B. nicht zugänglich, Abschaltung nicht möglich" ${zu?"disabled":""}><label for="m_ng">Nicht gemessen – Grund</label></div></div>
    <div id="ecMessTeil" ${w.ng?"hidden":""}>
    <div class="sec-lbl">Stromkreis</div><div class="ec-felder">${ecMessFeld(pr,sk.id,"riso",sk,zu)}${ecMessFeld(pr,sk.id,"rlo",sk,zu)}${eigen?ecMessFeld(pr,sk.id,"zs",sk,zu):""}</div>
    ${r?`<div class="sec-lbl">${esc(ecRcdName(r))} · gilt für alle Stromkreise daran</div><div class="ec-felder">${["t1","idelta","t5","ub"].map(k=>ecMessFeld(pr,r.id,k,r,zu)).join("")}</div>`:""}
    ${P.length?`<div class="sec-lbl">Messpunkte · Z s</div><div class="list ec-pzl">${P.map(p=>ecPunktZeile(pr,g,p,zu,false)).join("")}</div><small class="ec-gw" style="margin:6px 4px 0">${esc(EC_F.zs.gw(sk).txt)}</small>`:eigen?"":""}
    </div>
    ${zu?"":`<div class="chips ec-schnell"><button type="button" class="chip" data-act="ecMwSetz" data-k="riso" data-z="${esc(sk.id)}" data-v=">500">R iso &gt; 500 MΩ</button><button type="button" class="chip" data-act="ecNg" aria-pressed="${!!w.ng}">Nicht gemessen …</button><button type="button" class="chip" data-act="ecSkEditAusMess" data-id="${esc(sk.id)}">Stromkreis bearbeiten</button></div>`}
    <div class="tf${w.mangel?" fl":""}"><textarea id="m_mangel" data-z="${esc(sk.id)}" data-k="mangel" placeholder=" " ${zu?"disabled":""}>${esc(w.mangel||"")}</textarea><label for="m_mangel">Mangel / Bemerkung (optional)</label></div>`,
    `${vor?`<button class="btn-text" data-act="ecMessGeh" data-d="-1">‹ ${esc(vor.nr||"zurück")}</button>`:""}<span style="flex:1"></span><button class="btn-text" data-act="ecMessGeh" data-d="0">Fertig</button>${nach?`<button class="btn-text" data-act="ecMessGeh" data-d="1">Weiter zu ${esc(nach.nr||"nächstem")} ›</button>`:""}`,{breit:true});
  setTimeout(()=>{ const f=document.querySelector('#dlg input[data-k]:not([disabled])'); if(f&&!f.value&&!zu&&matchMedia("(hover:hover)").matches) f.focus(); },60); }
/* RCD allein messen (aus der Verteiler-Ansicht) */
function ecRcdMessDlg(rId){ const pr=ecPr(), g=ecGeb(pr.ortId), r=g.rcds.find(x=>x.id===rId); if(!r) return; ecDlg={rcdMess:r.id}; const zu=pr.status==="fertig", S=g.stromkreise.filter(s=>s.rcdId===r.id).sort(ecNr);
  dialog(`${ecRcdName(r)} · ${ecRcdInfo(r)}`,`<p class="ec-sub">${esc(ecVtName(g,r.vId))} · schützt ${esc(S.map(s=>s.nr||s.bez).join(", ")||"noch keinen Stromkreis")}</p>
    ${zu?"":`<div class="ec-tipp">${icon("info")}<span>${esc(`Am MFT one: RCD Typ ${r.typ||"?"}, IΔN ${r.idn||"?"} mA – Auslösezeit bei 1× und 5× IΔN, Auslösestrom (Rampe). Der AUTO-Test liefert alles in einem Durchgang.`)}</span></div>`}
    <div class="ec-felder">${["t1","idelta","t5","ub"].map(k=>ecMessFeld(pr,r.id,k,r,zu)).join("")}</div>`,
    `<button class="btn-text" data-act="ecRcdEditAusMess" data-id="${esc(r.id)}">RCD bearbeiten</button><span style="flex:1"></span><button class="btn-text" data-act="ecMessGeh" data-d="0">Fertig</button>`,{breit:true}); }
/* Raum messen: Laufreihenfolge, je Punkt ein Z-s-Feld; fehlende Stromkreise direkt zuordnen */
function ecRaumMessDlg(raumId){ const pr=ecPr(), g=ecGeb(pr.ortId), R=ecRaeume(g).filter(r=>ecRaumPunkte(g,r.id).length), i=R.findIndex(r=>r.id===raumId); if(i<0) return; ecDlg={raumMess:raumId};
  const zu=pr.status==="fertig", P=ecRaumPunkte(g,raumId), SK=ecSkListe(g), vor=R[i-1], nach=R[i+1];
  dialog(`${R[i].titel} · messen`,`${zu?"":`<div class="ec-tipp">${icon("info")}<span>Am MFT one Z s messen (an RCD-Kreisen Modus „std. RCD“). Reihenfolge wie im Raum angelegt.</span></div>`}
    <div class="list ec-pzl">${P.map(p=>ecPunktZeile(pr,g,p,zu,true)+(p.st.skId||zu||p.i>1?"":`<div class="ec-pz-zu">${sf("zu_"+p.st.id,"Stromkreis zuordnen","",[["","– wählen –"],...SK.map(s=>[s.id,`${ecSkName(s)}${s.schutz?" · "+s.schutz:""}`])],{form:true})}</div>`)).join("")}</div>`,
    `${vor?`<button class="btn-text" data-act="ecRaumGeh" data-id="${esc(vor.id)}">‹ ${esc(vor.name)}</button>`:""}<span style="flex:1"></span><button class="btn-text" data-act="ecRaumGeh" data-id="">Fertig</button>${nach?`<button class="btn-text" data-act="ecRaumGeh" data-id="${esc(nach.id)}">Weiter: ${esc(nach.name)} ›</button>`:""}`,{breit:true});
  setTimeout(()=>{ const f=[...document.querySelectorAll('#dlg input[data-k="zs"]:not([disabled])')].find(x=>!x.value); if(f&&!zu&&matchMedia("(hover:hover)").matches) f.focus(); },60); }
/* alle Messfelder im offenen Fenster übernehmen */
function ecWerteLesen(){ const pr=ecPr(); if(!pr||pr.status==="fertig") return; let ch=false; pr.werte=pr.werte||{};
  document.querySelectorAll("#dlg [data-z][data-k]").forEach(el=>{ if(el.tagName==="BUTTON") return; const z=el.dataset.z, k=el.dataset.k, v=el.value.trim(), w=Object.assign({},pr.werte[z]||{});
    if((w[k]||"")===v) return; if(v) w[k]=v; else delete w[k]; pr.werte[z]=w; ch=true; });
  if(ch){ if(pr.status==="offen") pr.status="laeuft"; saveRec("echecks",pr); } }
/* Geräte */
function ecGerDlg(bmId){ const pr=ecPr(), B=ecGeraeteAm(pr.ortId), i=B.findIndex(b=>b.id===bmId), bm=B[i]; if(!bm) return; ecDlg={ger:bmId}; const w=ecW(pr,bm.id), sk=bm.sk||"I", zu=pr.status==="fertig";
  const tri=(k,l)=>`<div class="ec-sz"><span>${l}</span><span class="ec-tri">${[["ok","i. O."],["nok","n. i. O."]].map(([v,t])=>`<button type="button" data-act="ecGerTri" data-k="${k}" data-v="${v}" aria-pressed="${w[k]===v}" class="${v}" ${zu?"disabled":""}>${t}</button>`).join("")}</span></div>`;
  const feld=k=>{ const d=EC_GW[k], gw=d.gw(sk), st=ecWertStand(gw,w[k]); return `<div class="ec-feld ${st}"><label for="m_${k}">${esc(d.l)}</label><span class="ec-ein"><input id="m_${k}" data-mw="${k}" data-gsk="${sk}" inputmode="decimal" value="${esc(w[k]||"")}" placeholder="–" autocomplete="off" ${zu?"disabled":""}><span>${d.e}</span></span><small class="ec-gw">${esc(gw.txt)}</small></div>`; };
  const vor=B[i-1], nach=B[i+1];
  dialog(bm.bez||"Gerät",`<p class="ec-sub">${esc([bm.typ,bm.sn&&`SN ${bm.sn}`,bm.inv&&`Inv. ${bm.inv}`,`Schutzklasse ${sk}`,bm.raum].filter(Boolean).join(" · "))}</p>
    <div id="ecNgZeile" ${w.ng?"":"hidden"}><div class="tf fl"><input id="m_ng" data-mw="ng" value="${esc(w.ng||"")}" placeholder="z. B. nicht vorhanden, defekt ausgesondert" ${zu?"disabled":""}><label for="m_ng">Nicht geprüft – Grund</label></div></div>
    <div id="ecMessTeil" ${w.ng?"hidden":""}><div class="list ec-sicht">${tri("sicht","Sichtprüfung (Gehäuse, Leitung, Stecker, Knickschutz)")}</div>
    <div class="ec-felder">${(EC_GSK[sk]||EC_GSK.I).map(feld).join("")}</div>
    <div class="list ec-sicht">${tri("funktion","Funktionsprüfung")}</div></div>
    ${zu?"":`<div class="chips ec-schnell"><button type="button" class="chip" data-act="ecMwSetz" data-k="riso" data-v=">300">&gt; 300 MΩ</button><button type="button" class="chip" data-act="ecNg" aria-pressed="${!!w.ng}">Nicht geprüft …</button><button type="button" class="chip" data-act="ecBmEditAusPr" data-id="${esc(bm.id)}">Gerät bearbeiten</button></div>`}
    <div class="tf${w.mangel?" fl":""}"><textarea id="m_mangel" data-mw="mangel" placeholder=" " ${zu?"disabled":""}>${esc(w.mangel||"")}</textarea><label for="m_mangel">Mangel / Bemerkung (optional)</label></div>`,
    `${vor?`<button class="btn-text" data-act="ecGerGeh" data-d="-1">‹ zurück</button>`:""}<span style="flex:1"></span><button class="btn-text" data-act="ecGerGeh" data-d="0">Fertig</button>${nach?`<button class="btn-text" data-act="ecGerGeh" data-d="1">Weiter ›</button>`:""}`,{breit:true}); }
function ecGerLesen(){ const pr=ecPr(); if(!pr||!ecDlg||!ecDlg.ger||pr.status==="fertig") return; const alt=ecW(pr,ecDlg.ger), w={sicht:alt.sicht,funktion:alt.funktion};
  document.querySelectorAll("#dlg [data-mw]").forEach(el=>{ const v=el.value.trim(); if(v) w[el.dataset.mw]=v; });
  document.querySelectorAll("#dlg [data-act=ecGerTri][aria-pressed=true]").forEach(b=>w[b.dataset.k]=b.dataset.v);
  if(document.getElementById("ecNgZeile")&&document.getElementById("ecNgZeile").hidden) delete w.ng;
  Object.keys(w).forEach(k=>{ if(w[k]==null) delete w[k]; });
  pr.werte=pr.werte||{}; if(JSON.stringify(alt)!==JSON.stringify(w)){ pr.werte[ecDlg.ger]=w; if(pr.status==="offen") pr.status="laeuft"; saveRec("echecks",pr); } }
function ecBmDlg(bm){ ecDlg={bm:bm&&bm.id}; const v=bm||{sk:"I"};
  dialog(bm?"Gerät bearbeiten":"Neues Gerät",`<div class="fg1">${tf("bmBez","Bezeichnung",v.bez||"",{form:true,ph:"z. B. Bohrmaschine"})}
    <div class="reihe2">${tf("bmTyp","Hersteller / Typ",v.typ||"",{form:true,ph:"z. B. Bosch GSB 18V"})}${tf("bmSn","Seriennummer",v.sn||"",{form:true})}</div>
    <div class="reihe2">${tf("bmInv","Inventarnummer",v.inv||"",{form:true})}${tf("bmRaum","Standort im Gebäude",v.raum||"",{form:true,ph:"z. B. Werkstatt"})}</div>
    <div class="lbl" style="margin:8px 4px 0">Schutzklasse</div>${seg("bmSk",v.sk||"I",[["I","I – mit Schutzleiter"],["II","II – schutzisoliert"],["III","III – Schutzkleinspannung"]])}</div>`,
    `${bm?`<button class="btn-text danger" data-act="ecBmDel">Löschen</button>`:""}<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="ecBmOk">Speichern</button>`,{breit:true}); }
function ecMaengelText(pr){ const L=[];
  if(ecAn(pr)){ EC_SICHT.forEach((t,i)=>{ if((pr.sicht||{})["s"+i]==="nok") L.push(`Besichtigung: ${t} – nicht in Ordnung.`); });
    const g=ecGeb(pr.ortId), rcdGemeldet=new Set();
    ecSkListe(g).filter(s=>ecImUmfang(pr,s)).forEach(sk=>{ const w=ecW(pr,sk.id); if(w.ng) return; const T=[];
      ["riso","rlo"].concat(ecSkZsPflicht(g,sk)?["zs"]:[]).forEach(k=>{ if(ecWertStand(EC_F[k].gw(sk),w[k])==="bad") T.push(`${EC_F[k].kurz} ${w[k]} ${EC_F[k].e} (Grenzwert ${EC_F[k].gw(sk).txt})`); });
      ecSkPunkte(g,sk.id).forEach(p=>{ const pw=ecW(pr,p.id); if(ecWertStand(EC_F.zs.gw(sk),pw.zs)==="bad") T.push(`Z s ${pw.zs} Ω an ${ecRaumName(g,p.raumId)} ${p.nr} (Grenzwert ${EC_F.zs.gw(sk).txt})`); if(pw.mangel) T.push(`${ecRaumName(g,p.raumId)} ${p.nr}: ${pw.mangel}`); });
      if(w.mangel) T.push(w.mangel);
      if(T.length) L.push(`${ecSkName(sk)}: ${T.join("; ")}.`);
      const r=ecRcdVon(g,sk); if(r&&!rcdGemeldet.has(r.id)&&ecRcdStand(pr,r)==="bad"){ rcdGemeldet.add(r.id); const rw=ecW(pr,r.id);
        L.push(`${ecRcdName(r)} (${ecVtName(g,r.vId)}): ${["t1","t5","idelta","ub"].filter(k=>ecWertStand(EC_F[k].gw(r),rw[k])==="bad").map(k=>`${EC_F[k].kurz} ${rw[k]} ${EC_F[k].e} (Grenzwert ${EC_F[k].gw(r).txt})`).join("; ")}.`); } }); }
  else if(ecNz(pr)) L.push(...ecNetMaengel(pr,ecGeb(pr.ortId)));
  else ecGeraeteAm(pr.ortId).forEach(b=>{ const w=ecW(pr,b.id), sk=b.sk||"I", f=(EC_GSK[sk]||[]).filter(k=>ecWertStand(EC_GW[k].gw(sk),w[k])==="bad");
    if(!w.ng&&(f.length||w.sicht==="nok"||w.funktion==="nok"||w.mangel)) L.push(`${b.bez||"Gerät"}${b.inv?` (Inv. ${b.inv})`:""}: ${[w.sicht==="nok"&&"Sichtprüfung nicht in Ordnung",...f.map(k=>`${EC_GW[k].kurz} ${w[k]} ${EC_GW[k].e}`),w.funktion==="nok"&&"Funktion nicht in Ordnung",w.mangel].filter(Boolean).join("; ")}.`); });
  return L.join("\n"); }

/* ---- Netzwerkprüfung (Datenverkabelung, z. B. mit dem Trend Networks SignalTEK CT) ----
   Gebäude wie bei der Installation (Etagen, Räume); dazu
     schraenke:[{id,name,raumId}]  Netzwerkschrank / Patchfeld
     dosen:[{id,raumId,ord,ports,lage,sId,pp:{"1":"A01","2":"A02"}}]  Datendose mit 1–4 Ports, je Port der Patchport im Schrank
   Schrank zusätzlich {pf: Anzahl Patchfelder, ports: Ports je Patchfeld}. Beschriftung der Dose = Patchport „<Patchfeld>.<Port>“ (1.13).
   Ein Link ist „<Dose>.<Port>“ (Nummer im Raum wie bei Steckdosen: 1, 2.1, 2.2 …).
   Werte je Link: wm (Belegung ok|nok), wmF (Fehlerbild), len (m), v10/v100/v1g (ok|nok), poe (ok|nok|na), poeW, ng, mangel.
   Qualifizierung (Übertragungsprüfung), keine Zertifizierung nach DIN EN 50173 / ISO/IEC 11801 – so steht es auch im Protokoll. */
const EC_NLAGE=["Eingang","neben Tür","Schreibtisch","TV","Decke (WLAN-AP)","Boden","Außen"];
const EC_NV=[["v10","10 Mbit/s"],["v100","100 Mbit/s"],["v1g","1 Gbit/s"]];
const EC_NLEN={max:100,txt:"≤ 100 m (Channel, IEEE 802.3)"};
const ecNz=pr=>pr&&pr.art==="netz";
const ecSchrName=(g,id)=>(g.schraenke.find(s=>s.id===id)||{}).name||"";
const ecNetImUmfang=(pr,d)=>!(pr.umfang&&pr.umfang.sIds)||!d||!d.sId||pr.umfang.sIds.includes(d.sId);
function ecNetPunkte(g,raumId){ const D=g.dosen.filter(d=>d.raumId===raumId).sort((a,b)=>(a.ord||0)-(b.ord||0)), P=[];
  D.forEach((d,k)=>{ const n=Math.max(1,+d.ports||1); for(let i=1;i<=n;i++) P.push({id:`${d.id}.${i}`,nr:n>1?`${k+1}.${i}`:`${k+1}`,d,i,raumId,pp:((d.pp||{})[i]||"").trim()}); }); return P; }
const ecNetAlle=g=>ecRaeume(g).flatMap(r=>ecNetPunkte(g,r.id));
/* Reihenfolge beim Messen: je Schrank nach Patchport (so steckt man um), danach Links ohne Schrank in Raumfolge */
function ecNetListe(pr,g){ const A=ecNetAlle(g).filter(p=>ecNetImUmfang(pr,p.d)), L=[];
  [...g.schraenke.map(s=>s.id),""].forEach(sId=>{ const T=A.filter(p=>sId?p.d.sId===sId:(!p.d.sId||!g.schraenke.some(s=>s.id===p.d.sId)));
    if(sId) T.sort((a,b)=>(a.pp?0:1)-(b.pp?0:1)||a.pp.localeCompare(b.pp,"de",{numeric:true})); L.push(...T); }); return L; }
const ecDoseName=d=>`${(+d.ports||1)>1?`${d.ports}-Port-`:""}Datendose`;
/* mit Beschriftung zählt nur die (1.13 steht auf der Dose); ohne Beschriftung die Laufnummer im Raum */
const ecLinkOrt=(g,p)=>p.pp?ecRaumName(g,p.raumId):`${ecRaumName(g,p.raumId)} ${p.nr}`;
const ecLinkName=(g,p)=>p.pp?`Dose ${p.pp} (${ecRaumName(g,p.raumId)})`:`${ecRaumName(g,p.raumId)} ${p.nr}`;
function ecNetStand(pr,p){ const w=ecW(pr,p.id); if(w.ng) return "ng";
  const tests=[w.wm,...EC_NV.map(x=>w[x[0]]),w.poe], lenSt=ecWertStand(EC_NLEN,w.len);
  if(tests.includes("nok")||lenSt==="bad"||String(w.mangel||"").trim()) return "bad";
  if(w.wm==="ok"&&EC_NV.some(x=>w[x[0]]==="ok")) return "ok";
  return tests.some(Boolean)||w.len?"wip":"open"; }
const ecNetV=w=>{ const b=[...EC_NV].reverse().find(x=>w[x[0]]); return b?{t:b[1].replace(" Mbit/s"," M").replace(" Gbit/s"," G"),st:EC_NV.some(x=>w[x[0]]==="nok")?"bad":"ok"}:null; };
function ecNetMaengel(pr,g){ const L=[];
  ecNetListe(pr,g).forEach(p=>{ const w=ecW(pr,p.id); if(w.ng) return; const T=[];
    if(w.wm==="nok") T.push(`Belegung nicht in Ordnung${w.wmF?` (${w.wmF})`:""}`);
    if(ecWertStand(EC_NLEN,w.len)==="bad") T.push(`Länge ${w.len} m (Grenzwert ${EC_NLEN.txt})`);
    EC_NV.forEach(([k,t])=>{ if(w[k]==="nok") T.push(`Übertragung ${t} nicht bestanden`); });
    if(w.poe==="nok") T.push("PoE-Lasttest nicht bestanden"); if(w.mangel) T.push(w.mangel);
    if(T.length) L.push(`${ecLinkName(g,p)}: ${T.join("; ")}.`); }); return L; }
const ecNetUmfangAuto=(pr,g)=>{ const S=g.schraenke.filter(s=>ecNetImUmfang(pr,{sId:s.id})), aus=g.schraenke.filter(s=>!ecNetImUmfang(pr,{sId:s.id}));
  return `Übertragungsprüfung (Qualifizierung) der Datenverkabelung zwischen Patchfeld und Datendose: Belegung, Länge und Übertragung nach IEEE 802.3 (Ethernet 10/100/1000 Mbit/s), bei Bedarf PoE unter Last${S.length?`. Netzwerkschränke: ${S.map(s=>s.name).join(", ")}`:""}.${aus.length?` Nicht Bestandteil dieser Prüfung: ${aus.map(s=>s.name).join(", ")}.`:""} Keine Zertifizierung nach DIN EN 50173 / ISO/IEC 11801.`; };

/* Gebäude: rechte Spalte mit den Netzwerkschränken und ihren Ports */
/* Beschriftung wie bei uns üblich: „<Patchfeld>.<Port>“ – Dose und Keystone tragen dieselbe Nummer (1.13 = Patchfeld 1, Port 13) */
const ecPpTeile=t=>{ const m=String(t||"").trim().match(/^P?(\d+)\s*[.\-/]\s*(\d+)$/i); return m?{pf:+m[1],port:+m[2]}:null; };
const ecSchrPf=s=>Math.max(1,+(s&&s.pf)||1), ecSchrPorts=s=>Math.max(1,+(s&&s.ports)||24);
function ecPfFrei(g,sId,pf,ohne){ let max=0; g.dosen.forEach(d=>{ if(d.sId!==sId||d.id===ohne) return; Object.values(d.pp||{}).forEach(t=>{ const x=ecPpTeile(t); if(x&&x.pf===+pf&&x.port>max) max=x.port; }); }); return max+1; }
function ecNetSchrankSpalte(pr,g){ const A=ecNetAlle(g), zu=pr.status==="fertig";
  const zeile=p=>`<div class="ec-vz sk" role="button" tabindex="0" data-act="ecDose" data-id="${esc(p.d.id)}"><span class="nr">${esc(p.pp||"–")}</span><span class="t">${esc(ecLinkOrt(g,p))}<small>${esc([ecDoseName(p.d),p.d.lage].filter(Boolean).join(" · "))}</small></span>${icon("chev")}</div>`;
  const raster=(s,P)=>ecPfListe(s).map(({nr:pf,ports:n})=>{
    return `<div class="ec-pfk">Patchfeld ${pf}</div><div class="ec-pf" style="grid-template-columns:repeat(${Math.min(n,12)},minmax(0,1fr))">${Array.from({length:n},(_,k)=>{ const port=k+1, L=P.filter(p=>{ const x=ecPpTeile(p.pp); return x&&x.pf===pf&&x.port===port; });
      if(!L.length) return `<span class="ec-ks frei" title="${pf}.${port} frei">${port}</span>`;
      const st=ecNetStand(pr,L[0]), kl=L.length>1?"bad":st==="ok"?"ok":st==="bad"?"bad":"belegt";
      return `<button type="button" class="ec-ks ${kl}" data-act="ecDose" data-id="${esc(L[0].d.id)}" title="${esc(`${pf}.${port} · ${ecRaumName(g,L[0].raumId)}${L.length>1?" · doppelt vergeben":""}`)}">${port}</button>`; }).join("")}</div>`; }).join("");
  const schr=s=>{ const P=ecNetListe({},g).filter(p=>p.d.sId===s.id), ein=ecNetImUmfang(pr,{sId:s.id}), PL=ecRkPlanung(pr,g,s), bad=PL.H.filter(h=>h[0]==="bad").length, hw=PL.H.filter(h=>h[0]==="wip").length;
    return `<div class="li${ein?"":" aus"}" role="button" tabindex="0" data-act="ecRkAuf" data-id="${esc(s.id)}" data-ctx="ecSchrEdit"><span class="av ec-uv">${icon("ecNetz")}</span>
      <span class="lt"><span class="h">${esc(s.name)}</span><span class="s">${esc([ecSchrText(s),ecRaumName(g,s.raumId)].filter(Boolean).join(" · "))}</span><span class="s">${esc([`${PL.B} von ${PL.ports} Patchports belegt`,ein?"":"nicht im Prüfumfang"].filter(Boolean).join(" · "))}</span>
      <span class="st">${bad?pill("bad",`${bad} Problem${bad>1?"e":""}`):hw?pill("wip",`${hw} Hinweis${hw>1?"e":""}`):pill("ok","Planung passt")}</span></span>${icon("chev")}</div>`; };
  const ohne=A.filter(p=>!p.d.sId||!g.schraenke.some(s=>s.id===p.d.sId));
  return `${kdKopf("Netzwerkschränke",zu?"":"ecSchrNeu","Schrank hinzufügen")}${g.schraenke.length?listOf(g.schraenke.map(schr))+`<p class="meta" style="margin:8px 4px 0">Antippen öffnet den Schrank. Bearbeiten: Rechtsklick, am Handy lange drücken.</p>`:`<p class="meta">Noch kein Netzwerkschrank. Am besten zuerst den Schrank mit seinen Patchfeldern anlegen, dann durch die Räume gehen und jede Datendose eintragen.</p>`}
    ${ohne.length?`<div class="ec-vt"><div class="ec-vz kopf"><span class="t"><b>Ohne Schrank</b></span></div>${ohne.map(zeile).join("")}</div>`:""}`; }
function ecNetRaumKachel(pr,g,r){ const P=ecNetPunkte(g,r.id), st=P.map(p=>ecNetStand(pr,p)), n=st.filter(x=>x!=="open"&&x!=="wip").length, bad=st.filter(x=>x==="bad").length, D=g.dosen.filter(d=>d.raumId===r.id).length;
  return `<button class="ec-raum" data-act="ecRaum" data-id="${esc(r.id)}"><b>${esc(r.name)}</b><small>${D} Dose${D===1?"":"n"} · ${P.length} Port${P.length===1?"":"s"}</small>
    <span class="ec-rst">${!P.length?pill("open","noch leer"):bad?pill("bad",`${bad} Mangel`):n===P.length?pill("ok","gemessen"):pill(n?"wip":"open",n?`${n} von ${P.length} gemessen`:"offen")}</span></button>`; }

/* Raum: Datendosen in Laufreihenfolge */
function ecNetRaumDlg(raumId){ const pr=ecPr(), g=ecGeb(pr.ortId), zu=pr.status==="fertig", name=ecRaumName(g,raumId); if(!name) return; ecDlg={raumDlg:raumId};
  const D=g.dosen.filter(d=>d.raumId===raumId).sort((a,b)=>(a.ord||0)-(b.ord||0));
  dialog(name,D.length?`<div class="list ec-stl">${D.map((d,k)=>{ const n=+d.ports||1, pp=Array.from({length:n},(_,i)=>((d.pp||{})[i+1]||"").trim()), s=ecSchrName(g,d.sId);
      return `<div class="ec-st"><span class="nr">${k+1}${n>1?`<small>.1–.${n}</small>`:""}</span><button type="button" class="ec-st-t" data-act="ecDose" data-id="${esc(d.id)}" ${zu?"disabled":""}><b>${esc(ecDoseName(d))}${d.lage?` · ${esc(d.lage)}`:""}</b><small>${s||pp.some(Boolean)?esc([s,pp.some(Boolean)&&`Port ${pp.map(x=>x||"?").join(", ")}`].filter(Boolean).join(" · ")):'<span class="rot">noch keinem Patchport zugeordnet</span>'}</small></button>
        ${zu?"":`<span class="ec-ord"><button type="button" data-act="ecDoseOrd" data-id="${esc(d.id)}" data-d="-1" ${k?"":"disabled"} aria-label="nach vorn">${icon("chev")}</button><button type="button" class="ab" data-act="ecDoseOrd" data-id="${esc(d.id)}" data-d="1" ${k<D.length-1?"":"disabled"} aria-label="nach hinten">${icon("chev")}</button></span>`}</div>`; }).join("")}</div>
      <p class="meta" style="margin:10px 4px 0">Reihenfolge = Nummerierung im Protokoll. Vorschlag: ab der Tür im Uhrzeigersinn.</p>`
      :`<p class="meta">Noch keine Datendosen. Leg sie in der Reihenfolge an, in der du durch den Raum gehst, und trag den Port im Patchfeld ein.</p>`,
    `${zu?"":`<button class="btn-text" data-act="ecRaumEdit" data-id="${esc(raumId)}">Umbenennen</button>`}<span style="flex:1"></span><button class="btn-text" data-act="cancel">Schließen</button>${zu?"":`<button class="btn-text" data-act="ecDoseNeu" data-id="${esc(raumId)}">Datendose</button>`}`,{breit:true}); }
let ecLetzterSchr="";
let ecLetzterPf=1;
const ecPfWahl=(s,pf)=>{ const L=s?ecPfListe(s):[{nr:1}]; return L.some(x=>x.nr===+pf)?+pf:(L[0]||{nr:1}).nr; };
const ecPfChips=(g,sId,pf)=>{ const s=g.schraenke.find(x=>x.id===sId), L=s?ecPfListe(s):[{nr:1}]; return `<div class="lbl" style="margin-top:4px">Patchfeld</div>${ecChips("pf",L.map(x=>[String(x.nr),`Patchfeld ${x.nr}`]),String(ecPfWahl(s,pf)))}`; };
function ecDoseDlg(dId,raumId){ const pr=ecPr(), g=ecGeb(pr.ortId), d=dId&&g.dosen.find(x=>x.id===dId), v=d||{ports:2,lage:"",sId:g.schraenke.some(s=>s.id===ecLetzterSchr)?ecLetzterSchr:(g.schraenke.length===1?g.schraenke[0].id:""),pp:{}};
  const n=+v.ports||1, t0=ecPpTeile((v.pp||{})[1]), pf=t0?t0.pf:ecPfWahl(g.schraenke.find(x=>x.id===v.sId),ecLetzterPf), start=t0?t0.port:ecPfFrei(g,v.sId,pf,dId);
  ecDlg={dose:dId||null,raumId:d?d.raumId:raumId,w:{ports:String(n),anz:"1",pf:String(pf)}};
  const pp=i=>d?((v.pp||{})[i]||""):`${pf}.${start+i-1}`;
  dialog(d?"Datendose bearbeiten":`Neu in ${ecRaumName(g,ecDlg.raumId)}`,`<div class="lbl">Ports an der Dose</div>${ecChips("ports",[["1","1 Port"],["2","2 Ports"],["3","3 Ports"],["4","4 Ports"]],String(n))}
    ${d?"":`<div class="lbl" style="margin-top:12px">Wie oft gleich anlegen</div>${ecChips("anz",[["1","1×"],["2","2×"],["3","3×"],["4","4×"],["5","5×"],["6","6×"]],"1")}`}
    <div class="fg1" style="margin-top:16px">${sf("ecSchr","Netzwerkschrank",v.sId||"",[["","– noch offen –"],...g.schraenke.map(s=>[s.id,s.name])],{form:true})}</div>
    <div id="ecPfZeile">${ecPfChips(g,v.sId,pf)}</div>
    <div class="fg1" style="margin-top:12px">${tf("ppStart","Port im Patchfeld (erster Port der Dose)",String(start),{form:true,ph:"z. B. 13"})}
      <div class="ec-pp">${[1,2,3,4].map(i=>`<div data-pp="${i}" ${i>n?"hidden":""}>${tf("pp"+i,`Beschriftung Port ${i} (Dose = Patchfeld)`,pp(i),{form:true,ph:"z. B. 1.13"})}</div>`).join("")}</div>
      ${tf("ecLage","Lage (optional)",v.lage||"",{form:true,ph:"z. B. Schreibtisch"})}</div>
    ${ecChips("nlage",EC_NLAGE.map(x=>[x,x]),"")}
    <p class="meta" style="margin-top:8px">Beschriftung = Patchfeld.Port, z. B. 1.13 – so steht es auf der Dose und am Keystone im Patchfeld.${d?"":" Bei mehreren Dosen zählt die App die Ports weiter."}${g.schraenke.length?"":" Netzwerkschränke legst du unter „Gebäude“ rechts an – zuordnen geht auch später."}</p>`,
    `${d?`<button class="btn-text danger" data-act="ecDoseDel">Löschen</button>`:""}<span style="flex:1"></span><button class="btn-text" data-act="ecZumRaum">Abbrechen</button><button class="btn-text" data-act="ecDoseOk">Speichern</button>`,{breit:true}); }
/* Patchfeld + erster Port → Beschriftung der Ports (1.13, 1.14 …) */
function ecPpFuellen(){ if(!ecDlg||!("dose" in ecDlg)) return; const st=document.getElementById("f_ppStart"), z=parseInt(st&&st.value,10), n=+ecDlg.w.ports||1; if(!(z>0)) return;
  for(let i=1;i<=4;i++){ const f=document.getElementById("f_pp"+i); if(!f) continue; f.value=i<=n?`${ecDlg.w.pf||1}.${z+i-1}`:""; f.parentElement.classList.toggle("fl",!!f.value); } }
/* „A01“ → „A02“, „1-12“ → „1-13“; ohne Zahl am Ende bleibt es leer */
const ecPpPlus=(s,k)=>{ const t=ecPpTeile(s); if(t) return `${t.pf}.${t.port+k}`; const m=String(s||"").match(/^(.*?)(\d+)$/); if(!m) return ""; const z=String(+m[2]+k); return m[1]+(m[2].length>z.length?z.padStart(m[2].length,"0"):z); };

/* ---- Schrankplaner: Netzwerkschrank in Höheneinheiten (HE) bestücken, Patchfelder mit belegten Ports, Prüfung der Planung, Stückliste ----
   Schrank {he, bauart:"wand"|"stand", teile:[{id,typ,pos,he,name,ports,nr,poe}]}; pos = oberste HE des Teils, gezählt von oben (1 = ganz oben).
   Patchfelder tragen eine feste Nummer (nr) – die steht in der Beschriftung der Dosen (1.13) und ändert sich beim Verschieben nicht. */
const EC_RK={patch:"Patchfeld",switch:"Switch",kabel:"Kabelführung",boden:"Fachboden",router:"Router / Firewall",usv:"USV",pdu:"Steckdosenleiste",luefter:"Lüftereinschub",blind:"Blindblende",sonst:"Sonstiges"};
const EC_RKSTD={patch:{he:1,ports:24},switch:{he:1,ports:24},kabel:{he:1},boden:{he:1},router:{he:1},usv:{he:2},pdu:{he:1},luefter:{he:1},blind:{he:1},sonst:{he:1}};
const EC_RKHE=[6,9,12,15,18,20,22,24,27,32,42,47];
/* Vorauswahl gängiger Schränke: [Bauart, HE, Breite, Tiefe] in mm */
const EC_RKVOR=[["wand",6,600,450],["wand",9,600,450],["wand",12,600,450],["wand",12,600,600],["wand",15,600,600],["wand",18,600,600],["wand",20,600,600],["stand",22,600,800],["stand",27,800,800],["stand",32,800,800],["stand",42,800,800],["stand",42,800,1000],["stand",47,800,1000]];
const EC_RKTIEFEN={wand:[250,300,400,450,500,600],stand:[600,800,1000,1200]};
/* typische Einbautiefe ab Frontschiene in mm – nur fürs Bild, solange keine Tiefe eingetragen ist */
const EC_RKT={patch:120,switch:250,kabel:80,router:220,usv:420,pdu:60,luefter:120,blind:15,sonst:200};
const ecSchrTiefe=s=>+(s&&s.tiefe)||(s&&s.bauart==="stand"?800:450), ecSchrBreite=s=>+(s&&s.breite)||600;
const ecSchrNutzbar=s=>Math.max(100,ecSchrTiefe(s)-100); /* Annahme: Tür, Rückwand und Schienenabstand kosten zusammen etwa 100 mm */
const ecRkTiefe=(s,t)=>+t.tiefe||(t.typ==="boden"?ecSchrNutzbar(s):EC_RKT[t.typ]||200);
const ecSchrFarbe=s=>s&&s.farbe==="hell"?"hell":s&&s.farbe==="dunkel"?"dunkel":"auto";
const ecSchrText=s=>[`${ecSchrHe(s)} HE`,s.bauart==="stand"?"Standschrank":"Wandschrank",`${ecSchrBreite(s)} × ${ecSchrTiefe(s)} mm`].join(" · ");
function ecSchrLesen(){ if(!ecDlg||!ecDlg.w) return; const F=formVals(); if(F.ecName!=null) ecDlg.w.name=F.ecName; if(F.ecVtRaum!=null) ecDlg.w.raumId=F.ecVtRaum; }
function ecSchrDlg(){ const pr=ecPr(), g=ecGeb(pr.ortId), W=ecDlg.w, vor=EC_RKVOR.findIndex(p=>p[0]===W.bauart&&String(p[1])===W.he&&String(p[2])===W.breite&&String(p[3])===W.tiefe);
  dialog(ecDlg.schr?"Netzwerkschrank bearbeiten":"Neuer Netzwerkschrank",`<div class="fg1">${tf("ecName","Bezeichnung",W.name||"",{form:true,ph:"z. B. Netzwerkschrank EG"})}${sf("ecVtRaum","Raum",W.raumId||"",[["","ohne Raum"],...ecRaeume(g).map(r=>[r.id,r.titel])],{form:true})}</div>
    <div class="lbl" style="margin-top:14px">Vorauswahl</div><div class="chips ec-wahl rk-vor">${EC_RKVOR.map((p,i)=>`<button type="button" class="chip" data-act="ecWahl" data-g="vor" data-v="${i}" aria-pressed="${i===vor}">${p[0]==="wand"?"Wand":"Stand"} ${p[1]} HE · ${p[3]} tief</button>`).join("")}</div>
    <div class="lbl" style="margin-top:14px">Bauart</div>${ecChips("bauart",[["wand","Wandschrank"],["stand","Standschrank"]],W.bauart)}
    <div class="lbl" style="margin-top:12px">Höheneinheiten</div>${ecChips("he",EC_RKHE.map(x=>[String(x),`${x} HE`]),W.he)}
    <div class="lbl" style="margin-top:12px">Breite</div>${ecChips("breite",[["600","600 mm"],["800","800 mm (mit Kabelkanälen)"]],W.breite)}
    <div class="lbl" style="margin-top:12px">Tiefe</div>${ecChips("tiefe",(EC_RKTIEFEN[W.bauart]||EC_RKTIEFEN.wand).map(x=>[String(x),`${x} mm`]),W.tiefe)}
    <div class="lbl" style="margin-top:12px">Farbe in der Zeichnung</div>${ecChips("farbe",[["auto","wie die App (hell/dunkel)"],["hell","Lichtgrau (RAL 7035)"],["dunkel","Schwarz (RAL 9005)"]],W.farbe)}
    ${ecDlg.geplant?`<p class="meta" style="margin-top:10px">Patchfelder, Switches und alles Weitere legst du unter „Schrank planen“ fest.</p>`:`<div class="lbl" style="margin-top:12px">Patchfelder</div>${ecChips("pfAnz",[1,2,3,4,5,6].map(x=>[String(x),String(x)]),W.pfAnz)}<div class="lbl" style="margin-top:12px">Ports je Patchfeld</div>${ecChips("pfPorts",[["12","12"],["16","16"],["24","24"],["48","48"]],W.pfPorts)}`}
    <p class="meta" style="margin-top:10px">Nutzbare Einbautiefe rechnet die App mit Schranktiefe − 100 mm (Tür, Rückwand, Schienen). Das genaue Maß steht im Datenblatt des Schranks.</p>`,
    `${ecDlg.schr?`<button class="btn-text danger" data-act="ecSchrDel">Löschen</button>`:""}<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="ecSchrOk">Speichern</button>`,{breit:true}); }
/* ältere Schränke ohne Bestückung: aus „Anzahl Patchfelder × Ports“ ableiten (Patchfeld, darunter Kabelführung) */
function ecSchrTeile(s){ if(!s) return []; if(Array.isArray(s.teile)) return s.teile; const L=[]; let pos=1;
  for(let j=1;j<=Math.max(1,+s.pf||1);j++){ L.push({id:`p${j}`,typ:"patch",pos:pos++,he:1,ports:Math.max(1,+s.ports||24),nr:j}); L.push({id:`k${j}`,typ:"kabel",pos:pos++,he:1}); } return L; }
const ecSchrHe=s=>Math.max(+(s&&s.he)||0,...ecSchrTeile(s).map(t=>t.pos+t.he-1),s&&s.he?0:12);
const ecPfListe=s=>ecSchrTeile(s).filter(t=>t.typ==="patch").map(t=>({nr:+t.nr||1,ports:Math.max(1,+t.ports||24),id:t.id})).sort((a,b)=>a.nr-b.nr);
const ecRkFrei=(s,pos,he,ohne)=>pos>=1&&pos+he-1<=ecSchrHe(s)&&!ecSchrTeile(s).some(t=>t.id!==ohne&&pos<=t.pos+t.he-1&&t.pos<=pos+he-1);
const ecRkErsterFrei=(s,he)=>{ for(let p=1;p<=ecSchrHe(s)-he+1;p++) if(ecRkFrei(s,p,he)) return p; return 0; };
const ecRkName=t=>t.name||(t.typ==="patch"?`Patchfeld ${t.nr||""}`.trim():EC_RK[t.typ]||"Teil");
/* Links und Ports dieses Schranks */
function ecRkLinks(g,s){ const M=new Map(), D=[];
  ecNetAlle(g).filter(p=>p.d.sId===s.id).forEach(p=>{ const x=ecPpTeile(p.pp); if(!x){ D.push(p); return; } const k=`${x.pf}.${x.port}`; if(!M.has(k)) M.set(k,[]); M.get(k).push(p); }); return {M,ohne:D}; }
function ecRkPlanung(pr,g,s){ const T=ecSchrTeile(s), N=ecSchrHe(s), belegtHe=T.reduce((a,t)=>a+t.he,0), frei=N-belegtHe, {M,ohne}=ecRkLinks(g,s), PF=ecPfListe(s), H=[];
  const ports=PF.reduce((a,p)=>a+p.ports,0), B=M.size, SW=T.filter(t=>t.typ==="switch"), swPorts=SW.reduce((a,t)=>a+(+t.ports||0),0);
  H.push(frei<0?["bad",`Mehr Teile als Platz: ${belegtHe} HE geplant, der Schrank hat ${N} HE.`]:frei<Math.ceil(N*0.2)?["wip",`Nur ${frei} von ${N} HE frei – für spätere Erweiterungen sind rund 20 % Reserve üblich.`]:["ok",`${frei} von ${N} HE frei`]);
  H.push(!PF.length?["wip","Noch kein Patchfeld geplant."]:B>ports?["bad",`${B} Ports belegt, aber nur ${ports} Patchports vorhanden.`]:["ok",`${B} von ${ports} Patchports belegt`]);
  const falsch=[...M.keys()].filter(k=>{ const x=ecPpTeile(k), pf=PF.find(p=>p.nr===x.pf); return !pf||x.port>pf.ports; });
  if(falsch.length) H.push(["bad",`Dose ${falsch.join(", ")}: dieses Patchfeld bzw. diesen Port gibt es im Schrank nicht.`]);
  const dop=[...M].filter(x=>x[1].length>1).map(x=>x[0]); if(dop.length) H.push(["bad",`Port ${dop.join(", ")} ist doppelt vergeben.`]);
  if(ohne.length) H.push(["wip",`${ohne.length} Port${ohne.length>1?"s":""} ohne Beschriftung nach Patchfeld.Port – im Raster nicht sichtbar.`]);
  if(B) H.push(!SW.length?["wip",`Noch kein Switch geplant – für ${B} belegte Ports braucht es mindestens ${B} Switch-Ports.`]:swPorts<B?["bad",`Es fehlen ${B-swPorts} Switch-Ports (${swPorts} geplant, ${B} belegt).`]:["ok",`Switch-Ports reichen: ${swPorts} für ${B} belegte Ports`]);
  const poe=[...M.values()].flat().filter(p=>{ const w=ecW(pr,p.id); return w.poe==="ok"||w.poe==="nok"||/WLAN|AP|Kamera/i.test(p.d.lage||""); }).length;
  if(poe&&!SW.some(t=>t.poe)) H.push(["wip",`${poe} Port${poe>1?"s":""} brauchen PoE (Messung oder WLAN-AP/Kamera), aber kein PoE-Switch ist geplant.`]);
  T.filter(t=>t.typ==="patch").forEach(t=>{ if(!T.some(k=>k.typ==="kabel"&&(k.pos===t.pos+t.he||k.pos+k.he===t.pos))) H.push(["tipp",`Tipp: Direkt über oder unter ${ecRkName(t)} eine Kabelführung einplanen.`]); });
  const nb=ecSchrNutzbar(s); T.filter(t=>+t.tiefe&&+t.tiefe>nb).forEach(t=>H.push(["bad",`${ecRkName(t)} ist ${t.tiefe} mm tief – nutzbar sind bei ${ecSchrTiefe(s)} mm Schranktiefe nur etwa ${nb} mm.`]));
  if((SW.length||T.some(t=>t.typ==="router"))&&!T.some(t=>t.typ==="pdu")) H.push(["tipp","Tipp: Noch keine Steckdosenleiste für Switch und Router geplant."]);
  return {H,N,frei,B,ports,swPorts}; }
function ecRkStueck(g,s){ const T=ecSchrTeile(s), G=new Map();
  T.filter(t=>t.typ!=="blind").forEach(t=>{ const k=[EC_RK[t.typ],t.ports&&(t.typ==="patch"||t.typ==="switch")?`${t.ports} Port`:"",t.poe?"PoE":"",`${t.he} HE`].filter(Boolean).join(", ")+(t.name&&t.typ!=="patch"?` – ${t.name}`:""); G.set(k,(G.get(k)||0)+1); });
  const L=[[1,`${s.bauart==="stand"?"Standschrank":"Wandschrank"} 19", ${ecSchrHe(s)} HE, ${ecSchrBreite(s)} × ${ecSchrTiefe(s)} mm (B × T)`],...[...G].map(([k,n])=>[n,k])], {M}=ecRkLinks(g,s), D=g.dosen.filter(d=>d.sId===s.id), fr=ecSchrHe(s)-T.reduce((a,t)=>a+t.he,0);
  if(M.size){ L.push([M.size,"Keystone-Module (Patchfeld)"]); L.push([M.size,"Patchkabel"]); }
  const DG=new Map(); D.forEach(d=>{ const k=`Datendose ${d.ports||1}-fach`; DG.set(k,(DG.get(k)||0)+1); }); DG.forEach((n,k)=>L.push([n,k]));
  if(fr>0) L.push([fr,"Blindblende 1 HE (für die freien HE)"]); return L; }
/* Zeichnung */
function ecRkTeilHtml(pr,g,s,t,M){
  const ports=(n,fn)=>{ const c=Math.min(n,24); return `<span class="rk-ports" style="--c:${c}">${Array.from({length:n},(_,i)=>fn(i+1)).join("")}</span>`; };
  let innen="";
  if(t.typ==="patch") innen=ports(Math.max(1,+t.ports||24),port=>{ const L=M.get(`${t.nr}.${port}`); if(!L) return `<span class="rk-p" title="${t.nr}.${port} frei"></span>`;
      const st=ecNetStand(pr,L[0]), kl=L.length>1?"bad":st==="ok"?"ok":st==="bad"?"bad":"belegt";
      return `<button type="button" class="rk-p ${kl}" data-act="ecRkPort" data-id="${esc(L[0].d.id)}" title="${esc(`${t.nr}.${port} · ${ecRaumName(g,L[0].raumId)}${L.length>1?" · doppelt":""}`)}"></button>`; });
  else if(t.typ==="switch") innen=ports(Math.max(1,+t.ports||24),()=>`<span class="rk-p sw"></span>`)+`<span class="rk-sfp"></span><span class="rk-sfp"></span>${t.poe?`<span class="rk-tag">PoE</span>`:""}`;
  else if(t.typ==="pdu") innen=`<span class="rk-reihe">${Array.from({length:Math.min(8,4+t.he*4)},()=>`<span class="rk-dose"></span>`).join("")}</span>`;
  else if(t.typ==="luefter") innen=`<span class="rk-reihe">${Array.from({length:4},()=>`<span class="rk-fan"></span>`).join("")}</span>`;
  else if(t.typ==="usv") innen=`<span class="rk-reihe"><span class="rk-led"></span><span class="rk-led"></span><span class="rk-led an"></span></span>`;
  else if(t.typ==="router") innen=`<span class="rk-reihe">${Array.from({length:5},()=>`<span class="rk-p sw" style="width:14px"></span>`).join("")}</span>`;
  return `<div class="rk-t rk-${t.typ}" data-act="ecRkTeil" data-id="${esc(t.id)}" style="grid-row:${t.pos} / span ${t.he}" title="${esc(ecRkName(t))}">
    <span class="rk-griff" data-act="ecRkGriff" data-drag="${esc(t.id)}" aria-label="verschieben"></span><span class="rk-n">${esc(t.typ==="patch"?`P${t.nr}`:ecRkName(t))}</span>${innen}</div>`; }
function ecRackView(pr,s){ const g=ecGeb(pr.ortId), zu=pr.status==="fertig", N=ecSchrHe(s), T=ecSchrTeile(s), {M}=ecRkLinks(g,s), P=ecRkPlanung(pr,g,s), belegt=new Set();
  T.forEach(t=>{ for(let i=t.pos;i<t.pos+t.he;i++) belegt.add(i); });
  const nr=i=>`<span class="rk-he" style="grid-row:${i}">${i}</span><span class="rk-he r" style="grid-row:${i}">${i}</span>`;
  const leer=i=>belegt.has(i)?"":`<button type="button" class="rk-leer" data-act="ecRkLeer" data-pos="${i}" style="grid-row:${i}" ${zu?"disabled":""} aria-label="HE ${i} frei – Teil einsetzen"><span>+</span></button>`;
  const ic={ok:"done",bad:"warn",wip:"warn",tipp:"info"};
  const zeile=p=>`<div class="ec-vz sk" role="button" tabindex="0" data-act="ecRkPort" data-id="${esc(p.d.id)}"><span class="nr">${esc(p.pp||"–")}</span><span class="t">${esc(ecLinkOrt(g,p))}<small>${esc([ecDoseName(p.d),p.d.lage].filter(Boolean).join(" · "))}</small></span>${ecPill(ecNetStand(pr,p))}</div>`;
  const Lk=ecNetListe({},g).filter(p=>p.d.sId===s.id);
  return `<div class="rk-seite"><div class="rk-kopf"><button class="icon-btn" data-act="ecRkZu" aria-label="Zurück zur Infrastruktur" title="Zurück zur Infrastruktur">${icon("back")}</button><div class="rk-kt"><h2>${esc(s.name)}</h2><p>${esc([ecOrt(pr.ortId).titel,ecSchrText(s),ecRaumName(g,s.raumId)].filter(Boolean).join(" · "))}</p></div>
      ${zu?"":`<button class="btn-tonal" data-act="ecSchrEdit" data-id="${esc(s.id)}">${icon("edit")}Bearbeiten</button>`}</div>
    <div class="rk-inhalt"><div class="rk-zwei"><div>
      ${zu?"":`<div class="chips rk-pal">${["patch","switch","kabel","boden","router","pdu","usv","luefter","blind"].map(t2=>`<button type="button" class="chip" data-act="ecRkNeu" data-t="${t2}">${icon("add")}${EC_RK[t2]}</button>`).join("")}</div>`}
      <div class="rk-bau ${ecSchrFarbe(s)}"><div class="rk-front"><div class="rk-ks">Vorderansicht</div><div class="rk${ecSchrBreite(s)>=800?" b800":""}" style="--n:${N}">${Array.from({length:N},(_,i)=>nr(i+1)+leer(i+1)).join("")}${T.map(t=>ecRkTeilHtml(pr,g,s,t,M)).join("")}</div></div>
        <div class="rk-side"><div class="rk-ks">Seite · ${ecSchrTiefe(s)} mm</div><div class="rk-sv" style="--n:${N}"><i class="rk-nb" style="left:${Math.round(ecSchrNutzbar(s)/ecSchrTiefe(s)*100)}%" title="nutzbar etwa ${ecSchrNutzbar(s)} mm"></i>
          ${T.map(t=>{ const tf2=ecRkTiefe(s,t), zu2=tf2>ecSchrNutzbar(s); return `<span class="rk-sb rk-${t.typ}${+t.tiefe?"":" geschaetzt"}${zu2?" zutief":""}" style="grid-row:${t.pos} / span ${t.he};width:${Math.min(100,Math.round(tf2/ecSchrTiefe(s)*100))}%" title="${esc(`${ecRkName(t)}: ${tf2} mm${+t.tiefe?"":" (typisch)"}`)}"></span>`; }).join("")}</div></div></div>
      <p class="hint">Teil antippen zum Bearbeiten, am Griff links ziehen zum Verschieben. Freie HE antippen, um dort etwas einzusetzen. Im Patchfeld: grau = belegt, grün = gemessen i. O., rot = Mangel. Seitenansicht: Einbautiefe der Teile, Strich = nutzbare Tiefe; blass = typischer Wert, solange keine Tiefe eingetragen ist.</p></div>
    <div class="rk-rechts"><section class="card"><h3>Planung</h3><ul class="rk-hw">${P.H.map(([k,t2])=>`<li class="${k}">${icon(ic[k])}<span>${esc(t2)}</span></li>`).join("")}</ul></section>
      <section class="card"><h3>Stückliste</h3>${(()=>{ const L=ecRkStueck(g,s); return L.length?`<ul class="rk-sl">${L.map(([n,t2])=>`<li><b>${n}×</b><span>${esc(t2)}</span></li>`).join("")}</ul>`:`<p class="meta">Noch nichts geplant.</p>`; })()}
        <p class="meta">Keystones und Patchkabel = belegte Ports; Längen der Patchkabel nach Abstand Patchfeld–Switch wählen.</p></section>
      <section class="card rk-bel"><h3>Belegung · ${Lk.length} Port${Lk.length===1?"":"s"}</h3>${Lk.length?`<div class="list">${Lk.map(zeile).join("")}</div>`:`<p class="meta">Noch keine Dose an diesem Schrank. Dosen legst du unter „Gebäude“ in den Räumen an.</p>`}</section></div></div></div></div>`; }
/* Teil bearbeiten */
function ecRkDlg(z){ const pr=ecPr(), g=ecGeb(pr.ortId), s=g.schraenke.find(x=>x.id===nav.schr); if(!s) return; ecDlg={rk:z}; const N=ecSchrHe(s), mitPorts=z.typ==="patch"||z.typ==="switch";
  dialog(z.id?`${ecRkName(z)} bearbeiten`:`${EC_RK[z.typ]} einsetzen`,`<div class="lbl">Art</div>${ecChips("rkTyp",Object.entries(EC_RK),z.typ)}
    <div class="fg1" style="margin-top:14px">${tf("rkName",z.typ==="patch"?"Bezeichnung (optional)":"Bezeichnung / Modell (optional)",z.name||"",{form:true,ph:{switch:"z. B. UniFi USW-24-PoE",router:"z. B. FRITZ!Box 7590",boden:"z. B. für FRITZ!Box und NAS",usv:"z. B. APC Smart-UPS 750"}[z.typ]||""})}
      <div class="reihe2">${sf("rkPos","Position (HE von oben)",String(z.pos),Array.from({length:N},(_,i)=>[String(i+1),`HE ${i+1}${ecRkFrei(s,i+1,+z.he||1,z.id)?"":" – belegt"}`]),{form:true})}${z.typ==="patch"?tf("rkNr","Patchfeld-Nummer",String(z.nr||""),{form:true,ph:"1"}):tf("rkTiefe","Einbautiefe in mm (optional)",z.tiefe?String(z.tiefe):"",{form:true,ph:`typisch ${EC_RKT[z.typ]||200}`})}</div></div>
    <div class="lbl" style="margin-top:12px">Höhe</div>${ecChips("rkHe",[["1","1 HE"],["2","2 HE"],["3","3 HE"],["4","4 HE"]],String(z.he||1))}
    ${mitPorts?`<div class="lbl" style="margin-top:12px">Ports</div>${ecChips("rkPorts",[["8","8"],["12","12"],["16","16"],["24","24"],["48","48"]],String(z.ports||24))}`:""}
    ${z.typ==="switch"?`<div class="lbl" style="margin-top:12px">PoE</div>${ecChips("rkPoe",[["0","ohne PoE"],["1","mit PoE"]],z.poe?"1":"0")}`:""}
    ${z.typ==="patch"?`<p class="meta" style="margin-top:10px">Die Nummer steht vorn in der Beschriftung der Dosen (1.13 = Patchfeld 1, Port 13) und bleibt beim Verschieben gleich.</p>`:""}`,
    `${z.id?`<button class="btn-text danger" data-act="ecRkDel">Entfernen</button>`:""}<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="ecRkOk">Speichern</button>`,{breit:true}); }
function ecRkNeuZ(s,typ,pos){ const d=EC_RKSTD[typ]||{he:1}, he=d.he, p=pos&&ecRkFrei(s,+pos,he)?+pos:pos&&ecRkFrei(s,+pos,1)?+pos:ecRkErsterFrei(s,he)||ecRkErsterFrei(s,1);
  const z={typ,pos:p||1,he:p&&!ecRkFrei(s,p,he)?1:he,ports:d.ports||0,name:"",poe:false};
  if(typ==="patch") z.nr=Math.max(0,...ecPfListe(s).map(x=>x.nr))+1; return {z,platz:!!p}; }
function ecRkLesen(){ const z=ecDlg&&ecDlg.rk; if(!z) return; const F=formVals(); if(F.rkName!=null) z.name=String(F.rkName).trim(); if(F.rkPos) z.pos=+F.rkPos; if(F.rkNr!=null&&String(F.rkNr).trim()) z.nr=+F.rkNr; if(F.rkTiefe!=null) z.tiefe=parseInt(F.rkTiefe,10)||0; }
/* Rechtsklick bzw. lange drücken (Handy) auf [data-ctx] löst die dort genannte Aktion aus, z. B. Schrank bearbeiten */
let ecCtxZeit=0, ecCtxT=null, ecCtxSchlucken=false;
function ecCtx(el){ if(Date.now()-ecCtxZeit<800) return; ecCtxZeit=Date.now(); const b=document.createElement("button"); b.hidden=true; b.dataset.act=el.dataset.ctx; b.dataset.id=el.dataset.id||""; document.body.appendChild(b); b.click(); b.remove(); }
document.addEventListener("contextmenu",e=>{ const el=e.target.closest&&e.target.closest("[data-ctx]"); if(!el) return; e.preventDefault(); ecCtx(el); });
document.addEventListener("pointerdown",e=>{ if(e.pointerType!=="touch") return; const el=e.target.closest&&e.target.closest("[data-ctx]"); if(!el) return; const x=e.clientX, y=e.clientY; clearTimeout(ecCtxT);
  ecCtxT=setTimeout(()=>{ ecCtxSchlucken=true; ecCtx(el); if(navigator.vibrate) try{ navigator.vibrate(15); }catch(_){} },550);
  const ab=ev=>{ if(ev.type==="pointermove"&&Math.hypot(ev.clientX-x,ev.clientY-y)<10) return; clearTimeout(ecCtxT); document.removeEventListener("pointermove",ab); document.removeEventListener("pointerup",ab); document.removeEventListener("pointercancel",ab); };
  document.addEventListener("pointermove",ab); document.addEventListener("pointerup",ab); document.addEventListener("pointercancel",ab); });
document.addEventListener("click",e=>{ if(ecCtxSchlucken){ ecCtxSchlucken=false; e.preventDefault(); e.stopPropagation(); } },true);
/* Ziehen am Griff: Schritt = eine HE */
let ecRkZug=null;
document.addEventListener("pointerdown",e=>{ const h=e.target.closest&&e.target.closest("[data-drag]"); if(!h) return; const el=h.closest(".rk-t"), rk=h.closest(".rk"); const pr=ecPr(); if(!el||!rk||!pr||pr.status==="fertig") return;
  const g=ecGeb(pr.ortId), s=g.schraenke.find(x=>x.id===nav.schr), t=s&&ecSchrTeile(s).find(x=>x.id===h.dataset.drag); if(!t) return;
  const schritt=parseFloat(getComputedStyle(rk).getPropertyValue("--he"))+2; ecRkZug={id:t.id,y0:e.clientY,el,schritt,pos0:t.pos,he:t.he,d:0};
  try{ h.setPointerCapture(e.pointerId); }catch(_){} el.classList.add("zieh"); e.preventDefault(); });
document.addEventListener("pointermove",e=>{ if(!ecRkZug) return; const dy=e.clientY-ecRkZug.y0; ecRkZug.d=Math.round(dy/ecRkZug.schritt); ecRkZug.el.style.transform=`translateY(${dy}px)`; });
const ecRkLos=()=>{ const z=ecRkZug; if(!z) return; ecRkZug=null; z.el.style.transform=""; z.el.classList.remove("zieh"); if(!z.d) return;
  const pr=ecPr(), g=ecGeb(pr.ortId), s=g.schraenke.find(x=>x.id===nav.schr); if(!s) return; const np=z.pos0+z.d;
  if(!ecRkFrei(s,np,z.he,z.id)){ toast("Dort ist kein Platz – erst etwas verschieben oder entfernen"); return; }
  s.teile=ecSchrTeile(s).map(t=>t.id===z.id?{...t,pos:np}:t); ecGebSpeichern(g); render(); };
document.addEventListener("pointerup",ecRkLos); document.addEventListener("pointercancel",ecRkLos);

/* Messen */
function ecNetMessView(pr){ const g=ecGeb(pr.ortId), L=ecNetListe(pr,g), fertig=L.filter(p=>!["open","wip"].includes(ecNetStand(pr,p))).length;
  let h=`<p class="meta">${fertig} von ${L.length} Links fertig</p>`;
  if(!L.length) return h+`<p class="meta">Noch nichts zu messen. Unter „Gebäude“ einen Netzwerkschrank anlegen und in den Räumen die Datendosen.</p>`+ecWeiter("abschluss","Weiter zum Abschluss");
  const zeile=p=>{ const w=ecW(pr,p.id), st=ecNetStand(pr,p), v=ecNetV(w);
    return `<div class="ec-sk" role="button" tabindex="0" data-act="ecNetMess" data-id="${esc(p.id)}"><span class="nr">${esc(p.pp||"–")}</span><span class="bz">${esc(ecLinkOrt(g,p))}<small>${esc(w.ng?`nicht gemessen: ${w.ng}`:[ecDoseName(p.d),p.d.lage].filter(Boolean).join(" · "))}</small></span>
      <span class="sz"><span class="lbm">Belegung </span>${w.wm==="ok"?"i. O.":w.wm==="nok"?'<b class="rot">Fehler</b>':"–"}${w.wm==="nok"&&w.wmF?`<small>${esc(w.wmF)}</small>`:""}</span>${ecMw(w.len,"m",ecWertStand(EC_NLEN,w.len),"Länge")}${ecMw(v?v.t:"","",v?v.st:"","Übertr.")}${ecMw(w.poe&&w.poe!=="na"?(w.poe==="ok"?"i. O.":"Fehler"):w.poe==="na"?"entf.":"","",w.poe==="ok"?"ok":w.poe==="nok"?"bad":"","PoE")}<span class="er">${ecPill(st)}</span></div>`; };
  h+=`<div class="list ec-tab"><div class="ec-sk h"><span>Port</span><span>Datendose</span><span>Belegung</span><span>Länge</span><span>Übertragung</span><span>PoE</span><span>Ergebnis</span></div>`;
  [...g.schraenke,{id:"",name:"Ohne Schrank"}].forEach(s=>{ const T=L.filter(p=>s.id?p.d.sId===s.id:(!p.d.sId||!g.schraenke.some(x=>x.id===p.d.sId))); if(!T.length) return;
    h+=`<div class="ec-rk">${esc(s.name)}</div>${T.map(zeile).join("")}`; });
  return h+`</div><p class="hint">Link antippen: Belegung, Länge, Übertragung und PoE eintragen. „Weiter“ springt zum nächsten Port im Schrank.</p>`+ecWeiter("abschluss","Weiter zum Abschluss"); }
function ecNetMessDlg(id){ const pr=ecPr(), g=ecGeb(pr.ortId), L=ecNetListe(pr,g), i=L.findIndex(p=>p.id===id), p=L[i]||ecNetAlle(g).find(x=>x.id===id); if(!p) return;
  const w=ecW(pr,p.id), wm0=ecWmLesen(w.wmap); ecDlg={netMess:p.id,wm:{m:wm0||ecWmGerade(),s:w.wmS||ecWmSchirmStd(pr),sel:null,leer:!wm0&&w.wm!=="ok",auto:wm0?ecWmText(wm0,w.wmS||""):""}};
  const zu=pr.status==="fertig", vor=L[i-1], nach=L[i+1], lenSt=ecWertStand(EC_NLEN,w.len);
  const tri=(k,l,na)=>`<div class="ec-sz"><span>${l}</span><span class="ec-tri">${[["ok","i. O."],["nok","n. i. O."],...(na?[["na","entfällt"]]:[])].map(([v,t])=>`<button type="button" data-act="ecNetTri" data-k="${k}" data-v="${v}" aria-pressed="${w[k]===v}" class="${v}" ${zu?"disabled":""}>${t}</button>`).join("")}</span></div>`;
  dialog(p.pp?`Dose ${p.pp} · ${ecRaumName(g,p.raumId)}`:ecLinkName(g,p),`<p class="ec-sub">${esc([ecSchrName(g,p.d.sId)||"ohne Schrank",ecDoseName(p.d)+((+p.d.ports||1)>1?` (Port ${p.i})`:""),p.d.lage].filter(Boolean).join(" · "))}</p>
    ${zu?"":`<div class="ec-tipp">${icon("info")}<span>${esc(pr.geraet&&(pr.geraet.kurz||pr.geraet.mess)?`Am ${pr.geraet.kurz||pr.geraet.mess}`:"Am Netzwerktester")}: Hauptgerät an den Patchport, Remote an die Datendose. Kabeltest für Belegung und Länge, danach der Übertragungstest. PoE nur, wenn an der Dose ein PoE-Gerät hängt.</span></div>`}
    <div id="ecNgZeile" ${w.ng?"":"hidden"}><div class="tf fl"><input id="m_ng" data-nw="ng" value="${esc(w.ng||"")}" placeholder="z. B. Raum nicht zugänglich, Dose verbaut" ${zu?"disabled":""}><label for="m_ng">Nicht gemessen – Grund</label></div></div>
    <div id="ecMessTeil" ${w.ng?"hidden":""}>
      <div class="list ec-sicht">${tri("wm","Belegung (Wiremap)")}</div>
      <div id="ecWm">${ecWmBereich(pr)}</div>
      <div class="fg1" style="margin-top:8px">${tf("nwF","Fehlerbild (bei n. i. O.)",w.wmF||"",{form:true,ph:"z. B. Paar 3/6 vertauscht, Ader 7 offen"})}</div>
      <div class="ec-felder"><div class="ec-feld ${lenSt}"><label for="m_len">Länge</label><span class="ec-ein"><input id="m_len" data-nw="len" inputmode="decimal" value="${esc(w.len||"")}" placeholder="–" autocomplete="off" ${zu?"disabled":""}><span>m</span></span><small class="ec-gw">${esc(EC_NLEN.txt)}</small></div>
        <div class="ec-feld"><label for="m_poeW">PoE-Last (optional)</label><span class="ec-ein"><input id="m_poeW" data-nw="poeW" inputmode="decimal" value="${esc(w.poeW||"")}" placeholder="–" autocomplete="off" ${zu?"disabled":""}><span>W</span></span><small class="ec-gw">zur Dokumentation</small></div></div>
      <div class="sec-lbl">Übertragung</div><div class="list ec-sicht">${EC_NV.map(([k,t])=>tri(k,t)).join("")}</div>
      <div class="sec-lbl">PoE</div><div class="list ec-sicht">${tri("poe","PoE unter Last",true)}</div></div>
    ${zu?"":`<div class="chips ec-schnell"><button type="button" class="chip" data-act="ecNetAlleOk">Alles i. O.</button><button type="button" class="chip" data-act="ecNg" aria-pressed="${!!w.ng}">Nicht gemessen …</button><button type="button" class="chip" data-act="ecDoseAusMess" data-id="${esc(p.d.id)}">Dose bearbeiten</button></div>`}
    <div class="tf${w.mangel?" fl":""}"><textarea id="m_mangel" data-nw="mangel" placeholder=" " ${zu?"disabled":""}>${esc(w.mangel||"")}</textarea><label for="m_mangel">Mangel / Bemerkung (optional)</label></div>`,
    `${vor?`<button class="btn-text" data-act="ecNetGeh" data-d="-1">‹ ${esc(vor.pp||vor.nr)}</button>`:""}<span style="flex:1"></span><button class="btn-text" data-act="ecNetGeh" data-d="0">Fertig</button>${nach?`<button class="btn-text" data-act="ecNetGeh" data-d="1">Weiter zu ${esc(nach.pp||nach.nr)} ›</button>`:""}`,{breit:true}); }
function ecNetLesen(){ const pr=ecPr(); if(!pr||!ecDlg||!ecDlg.netMess||pr.status==="fertig") return; const id=ecDlg.netMess, alt=ecW(pr,id), w={};
  document.querySelectorAll("#dlg [data-act=ecNetTri][aria-pressed=true]").forEach(b=>w[b.dataset.k]=b.dataset.v);
  document.querySelectorAll("#dlg [data-nw]").forEach(el=>{ const v=el.value.trim(); if(v) w[el.dataset.nw]=el.dataset.nw==="len"||el.dataset.nw==="poeW"?v.replace(".",","):v; });
  const f=document.getElementById("f_nwF"); if(f&&f.value.trim()) w.wmF=f.value.trim();
  if(document.getElementById("ecNgZeile")&&document.getElementById("ecNgZeile").hidden) delete w.ng;
  if(ecDlg.wm&&!ecDlg.wm.leer){ w.wmap=ecDlg.wm.m.join(""); w.wmS=ecDlg.wm.s; }
  pr.werte=pr.werte||{}; if(JSON.stringify(alt)!==JSON.stringify(w)){ if(Object.keys(w).length) pr.werte[id]=w; else delete pr.werte[id]; if(pr.status==="offen") pr.status="laeuft"; saveRec("echecks",pr); } }

/* Belegungsplan (Wiremap) wie am Tester: links Patchfeld, rechts Dose, je Ader eine Linie in ihrer Farbe, Schirm als eigene Linie.
   Gespeichert als w.wmap = 8 Zeichen, Stelle i = wo Ader i an der Dose ankommt ("1"–"8", "0" offen, "k" Kurzschluss), w.wmS = ok|offen|none */
const EC_WMF={gn:"#2E9D4A",or:"#F08A1C",bl:"#2563C9",br:"#7A4A2A"};
const EC_WMSTD={T568A:[["gn",1],["gn"],["or",1],["bl"],["bl",1],["or"],["br",1],["br"]],T568B:[["or",1],["or"],["gn",1],["bl"],["bl",1],["gn"],["br",1],["br"]]};
const EC_WMNAME={gn:"grün",or:"orange",bl:"blau",br:"braun"};
const ecWmAder=(std,i)=>{ const [f,w]=(EC_WMSTD[std]||EC_WMSTD.T568A)[i-1]; return w?`weiß-${EC_WMNAME[f]}`:EC_WMNAME[f]; };
const ecWmGerade=()=>[1,2,3,4,5,6,7,8];
const ecWmLesen=t=>{ t=String(t||""); return t.length===8?[...t].map(c=>c==="k"?"k":+c):null; };
const ecWmStd=pr=>pr.belegung==="T568B"?"T568B":"T568A";
const ecWmSchirmStd=pr=>pr.schirm==="nein"?"none":"ok";
const ecWmIstGerade=m=>m.every((x,i)=>x===i+1);
function ecWmText(m,s){ const T=[], key=m.join("");
  if(key==="36145278") T.push("Crossover (Paar 1/2 ↔ 3/6)"); else if(key==="36178245") T.push("Crossover alle Paare (Gigabit)");
  else { const off=m.map((x,i)=>x===0?i+1:0).filter(Boolean), kz=m.map((x,i)=>x==="k"?i+1:0).filter(Boolean), weg=new Set();
    if(off.length) T.push(`Ader${off.length>1?"n":""} ${off.join(", ")} offen`);
    if(kz.length) T.push(`Kurzschluss Ader ${kz.join("/")}`);
    m.forEach((x,i)=>{ const p=i+1; if(typeof x!=="number"||!x||x===p||weg.has(p)) return;
      if(m[x-1]===p){ weg.add(p); weg.add(x); const paar=[[1,2],[3,6],[4,5],[7,8]].some(([a,b])=>(a===p&&b===x)||(a===x&&b===p)); T.push(paar?`Paar ${Math.min(p,x)}/${Math.max(p,x)} verpolt`:`Ader ${p} und ${x} vertauscht`); }
      else { weg.add(p); T.push(`Ader ${p} → ${x}`); } }); }
  if(s==="offen") T.push("Schirm unterbrochen"); return T.join(", "); }
function ecWmSvg(z){ const {m,s,std,sel,leer}=z, Y=i=>34+(i-1)*26, xl=46, xr=294, a=112, b=228, F=EC_WMSTD[std]||EC_WMSTD.T568A, kz=m.map((x,i)=>x==="k"?i+1:0).filter(Boolean);
  const linie=(i)=>{ const [f,w]=F[i-1], ziel=m[i-1], y1=Y(i), c=EC_WMF[f];
    let d; if(ziel===0) d=`M${xl+12} ${y1}H${(a+b)/2}`; else if(ziel==="k") d=`M${xl+12} ${y1}H${a}L${b-14} ${y1}`; else { const y2=Y(ziel); d=`M${xl+12} ${y1}H${a}L${b} ${y2}H${xr-12}`; }
    const o=`<path d="${d}" class="wm-o" stroke-width="9"/>`, base=w?`<path d="${d}" stroke="#fff" stroke-width="7"/><path d="${d}" stroke="${c}" stroke-width="7" stroke-dasharray="7 7"/>`:`<path d="${d}" stroke="${c}" stroke-width="7"/>`;
    const ende=ziel===0?`<g class="wm-x"><path d="M${(a+b)/2+4} ${y1-6}l12 12M${(a+b)/2+16} ${y1-6}l-12 12"/></g>`:"";
    return o+base+ende; };
  const pin=(seite,i)=>{ const x=seite==="l"?xl:xr, an=seite==="l"&&sel===i, ziel=seite==="r"&&sel&&m[sel-1]===i;
    return `<g class="wm-pin${an?" an":""}${ziel?" ziel":""}" data-act="ecWmPin" data-s="${seite}" data-p="${i}" role="button" aria-label="${seite==="l"?"Patchfeld":"Dose"} Pin ${i}"><rect x="${x-22}" y="${Y(i)-13}" width="44" height="26" fill="transparent" stroke="none"/><circle cx="${x}" cy="${Y(i)}" r="12"/><text x="${x}" y="${Y(i)+4.5}">${i}</text></g>`; };
  const sy=Y(9)+12;
  const schirm=s==="none"?`<text x="170" y="${sy+4}" class="wm-st">ungeschirmt</text>`
    :`<path d="M${xl+12} ${sy}H${s==="offen"?150:xr-12}" class="wm-s${s==="offen"?" offen":""}" stroke-width="5"/>${s==="offen"?`<path d="M190 ${sy}H${xr-12}" class="wm-s offen" stroke-width="5"/><g class="wm-x"><path d="M158 ${sy-6}l12 12M170 ${sy-6}l-12 12"/></g>`:""}`;
  return `<svg class="ec-wm${leer?" leer":""}" viewBox="0 0 340 ${sy+22}" role="img" aria-label="Belegungsplan">
    <text x="${xl}" y="14" class="wm-k">Patchfeld</text><text x="${xr}" y="14" class="wm-k">Dose</text>
    <g fill="none" stroke-linecap="butt">${ecWmGerade().map(linie).join("")}</g>
    ${kz.length>1?`<path d="M${b-14} ${Y(Math.min(...kz))}V${Y(Math.max(...kz))}" class="wm-kz" stroke-width="4"/>`:""}${kz.map(i=>`<circle cx="${b-14}" cy="${Y(i)}" r="5" class="wm-kp"/>`).join("")}
    <g fill="none">${schirm}</g><g class="wm-sl"><circle cx="${xl}" cy="${sy}" r="12"/><text x="${xl}" y="${sy+4.5}">S</text>${s==="none"?"":`<circle cx="${xr}" cy="${sy}" r="12"/><text x="${xr}" y="${sy+4.5}">S</text>`}</g>
    ${ecWmGerade().map(i=>pin("l",i)+pin("r",i)).join("")}</svg>`; }
function ecWmBereich(pr){ const z=ecDlg.wm, std=ecWmStd(pr), zu=pr.status==="fertig", t=ecWmText(z.m,z.s);
  return `${ecWmSvg({...z,std})}
    <p class="ec-wm-t ${z.leer?"":t?"bad":"ok"}">${z.leer?"Noch nicht eingetragen – Pin links antippen, dann rechts, wo die Ader ankommt.":t?esc(t):`Alle Adern 1:1${z.s==="ok"?", Schirm durchgängig":""}`}</p>
    ${zu?"":`${z.sel?`<div class="chips ec-wahl"><span class="ec-wm-sel">Ader ${z.sel} (${esc(ecWmAder(std,z.sel))}):</span><button type="button" class="chip" data-act="ecWmSetz" data-v="0">offen</button><button type="button" class="chip" data-act="ecWmSetz" data-v="k">Kurzschluss</button><button type="button" class="chip" data-act="ecWmSetz" data-v="g">gerade</button></div>`:""}
    <div class="chips ec-wahl"><button type="button" class="chip" data-act="ecWmVorlage" data-v="12345678">1:1</button><button type="button" class="chip" data-act="ecWmVorlage" data-v="36145278">Crossover</button>
      <span class="ec-wm-sel">Schirm:</span>${[["ok","durchgängig"],["offen","unterbrochen"],["none","ungeschirmt"]].map(([v,t2])=>`<button type="button" class="chip" data-act="ecWmSchirm" data-v="${v}" aria-pressed="${z.s===v}">${t2}</button>`).join("")}</div>`}`; }
/* nach jeder Änderung: Bild neu zeichnen, „Belegung“ und Fehlerbild mitziehen */
function ecWmNeu(pr){ const z=ecDlg.wm; z.leer=false; const el=document.getElementById("ecWm"); if(el) el.innerHTML=ecWmBereich(pr);
  const t=ecWmText(z.m,z.s), v=t?"nok":"ok"; document.querySelectorAll('#dlg [data-act=ecNetTri][data-k=wm]').forEach(x=>x.setAttribute("aria-pressed",String(x.dataset.v===v)));
  const f=document.getElementById("f_nwF"); if(f&&(!f.value.trim()||f.value===z.auto)){ f.value=t; f.parentElement.classList.toggle("fl",!!t); } z.auto=t; }

/* PDF-Teil */
function ecNetPdf(pr,S,pl){ const g=ecGeb(pr.ortId), L=ecNetListe(pr,g), t=v=>v==="ok"?"i.O.":v==="nok"?"n.i.O.":v==="na"?"entf.":"-";
  S.abschnitt("Prüfumfang"); S.text(pr.umfangText||ecNetUmfangAuto(pr,g));
  S.abschnitt("Links"); const Z=[];
  [...g.schraenke,{id:"",name:"Ohne Schrank"}].forEach(s=>{ const T=L.filter(p=>s.id?p.d.sId===s.id:(!p.d.sId||!g.schraenke.some(x=>x.id===p.d.sId))); if(!T.length) return; Z.push(s.name);
    T.forEach(p=>{ const w=ecW(pr,p.id), st=ecNetStand(pr,p);
      Z.push([p.pp||"-",[ecLinkOrt(g,p),p.d.lage,w.ng&&`nicht gemessen: ${w.ng}`].filter(Boolean).join(" - "),w.wm==="nok"?`n.i.O.${w.wmF?": "+w.wmF:""}`:t(w.wm),w.len?w.len+" m":"-",t(w.v10),t(w.v100),t(w.v1g),w.poe==="ok"&&w.poeW?`i.O. ${w.poeW} W`:t(w.poe),st==="ng"?"open|n. gem.":pl(st)]); }); });
  if(Z.length) S.tabelle(["Port","Raum","Belegung","Länge","10 M","100 M","1 G","PoE","Ergebnis"],[16,50,24,16,12,14,12,16,22],Z,8); else S.text("Keine Links erfasst.");
  S.text(`Grenzwerte und Hinweise: Belegung nach T568A/B ohne Vertauschung, Unterbrechung oder Kurzschluss; Länge des Channels <= 100 m; Übertragung nach IEEE 802.3 (10BASE-T, 100BASE-TX, 1000BASE-T) mit dem Messgerät bestanden. Diese Prüfung weist die Übertragungsfähigkeit der Links nach (Qualifizierung). Sie ersetzt keine Zertifizierung (Abnahmemessung mit Kategorie- bzw. Klassengrenzwerten nach DIN EN 50173 / ISO/IEC 11801).`); }

/* ---- Sparkify-Import (JSON-Export der Sparkify-Weboberfläche: Projekt › Export › Installationsprüfung › JSON) ----
   Je Dokumentation eine Liste von Messungen ohne Zeitstempel/Namen – zugeordnet wird über die Reihenfolge.
   Empfehlung: in Sparkify je Raum eine Dokumentation, im Raum in Laufreihenfolge messen. */
const EC_EINH={"Ω":{"mΩ":0.001,"Ω":1,"kΩ":1000,"MΩ":1e6},"MΩ":{"kΩ":0.001,"MΩ":1,"GΩ":1000,"Ω":1e-6},"ms":{"ms":1,"s":1000},"mA":{"mA":1,"A":1000},"V":{"V":1,"mV":0.001},"A":{"A":1,"kA":1000}};
function ecSpWert(s,ziel){ s=String(s||"").trim(); if(!s) return ""; const m=s.replace(",",".").match(/^([<>]?)\s*(\d+(?:\.\d+)?)\s*([a-zA-ZΩµ]*)/); if(!m) return "";
  const f=(EC_EINH[ziel]||{})[m[3]||ziel]; return m[1]+ecFmt(+m[2]*(f==null?1:f)); }
let ecImp=null;
function ecImportStart(){ const i=document.createElement("input"); i.type="file"; i.accept=".json,application/json"; i.style.display="none"; document.body.appendChild(i);
  i.addEventListener("change",async()=>{ const f=i.files&&i.files[0]; i.remove(); if(!f) return;
    let d; try{ d=JSON.parse(await f.text()); }catch(e){ toast("Datei nicht lesbar – bitte den JSON-Export aus Sparkify wählen"); return; }
    const docs=(Array.isArray(d)?d:[d]).filter(x=>x&&Array.isArray(x.circuits));
    if(!docs.length){ toast("Keine Messungen in der Datei gefunden"); return; }
    ecImportVorbereiten(docs,f.name); }); i.click(); }
/* Stromkreis-Nummer: „FI2 F1“ → F1, „1“ → 1; verglichen wird ohne „F“ (F1 = 1) */
function ecSkSchluessel(row){ const fn=String(row.fuse_number||"").trim(), m=fn.match(/\bF\s*(\d+[\w.]*)\s*$/i); return m?"F"+m[1]:fn||String(row.circuit_name||"").trim(); }
const ecNrNorm=v=>String(v||"").trim().toLowerCase().replace(/^f\s*/,"").replace(/\s+/g,"");
const ecSkFinden=(g,key,vId)=>{ const n=ecNrNorm(key); if(!n) return null; return g.stromkreise.find(s=>s.vId===vId&&ecNrNorm(s.nr)===n)||g.stromkreise.find(s=>ecNrNorm(s.nr)===n); };
const ecVtWort=n=>/^(uv|hv|nv|sv|verteiler|unterverteil|hauptverteil|zähler|zaehler|hak)\b/i.test(String(n||"").trim());
const ecOhneVt=n=>String(n||"").replace(/^(uv|hv|nv|sv|verteiler|unterverteilung|hauptverteilung)[\s\-–:]*/i,"").trim()||String(n||"");
/* gleiche Stromkreis-Nummer, verschiedene Namen → die Namen sind Messpunkte (z. B. „Doppelsteckdose oben/unten“) */
const ecImpNamen=(d,key)=>[...new Set(d.rows.filter(x=>x.key===key).map(x=>String(x.r.circuit_name||"").trim()).filter(Boolean))];
function ecImportVorbereiten(docs,datei){ const pr=ecPr(), g=ecGeb(pr.ortId), et=g.etagen.find(e=>e.id===nav.et)||ecEtStd(g), R=ecRaeume(g);
  const raumNach=n=>{ n=String(n||"").trim().toLowerCase(); const r=R.find(x=>x.name.toLowerCase()===n); return r?r.id:"__neu"; };
  const vtNach=n=>{ n=String(n||"").trim().toLowerCase(); const v=g.verteiler.find(x=>x.name.toLowerCase()===n); return v?v.id:"__neu"; };
  ecImp={datei,vId:g.verteiler[0]?g.verteiler[0].id:"__neu",etId:et.id,docs:docs.map(d=>{ const name=d.documentation_name||"Messungen", vt=ecVtWort(name);
    return {name,typ:vt?"vt":"raum",vId:vtNach(name),raumId:raumNach(vt?ecOhneVt(name):name),kdnr:d.client&&d.client.customer_number||"",netz:d.system_info&&d.system_info.grid_type||"",anlass:d.system_info&&d.system_info.inspection_reason||"",
      rows:d.circuits.map(r=>({r,key:ecSkSchluessel(r),ziel:""}))}; })};
  ecImportZiele(); ecImportDlg(); }
/* Ziele vorschlagen. Raum: der Reihe nach auf freie Punkte des Raums, sonst neu.
   Verteiler: Stromkreis mit nur einer Messung → Wert direkt am Stromkreis; mehrere Messungen → je Messung ein Messpunkt. */
function ecImportZiele(){ const pr=ecPr(), g=ecGeb(pr.ortId);
  ecImp.docs.forEach(d=>{ const P=d.raumId==="__neu"?[]:ecRaumPunkte(g,d.raumId), belegt=new Set();
    d.rows.forEach(x=>{ const vId=d.typ==="vt"?d.vId:ecImp.vId, sk=ecSkFinden(g,x.key,vId), viele=d.rows.filter(y=>y.key===x.key).length>1;
      if(d.typ==="vt"&&!viele){ x.ziel="__sk"; return; }
      const p=P.find(p=>!belegt.has(p.id)&&!ecW(pr,p.id).zs&&(!p.st.skId||(sk&&p.st.skId===sk.id))); x.ziel=p?p.id:"__neu"; if(p) belegt.add(p.id); }); }); }
function ecImportDlg(){ const pr=ecPr(), g=ecGeb(pr.ortId), o=ecOrt(pr.ortId), R=ecRaeume(g);
  const kdWarn=ecImp.docs.map(d=>d.kdnr).filter(Boolean).find(n=>o.kunde&&o.kunde.kdnr&&String(o.kunde.kdnr)!==String(n));
  const anz=ecImp.docs.reduce((s,d)=>s+d.rows.length,0), mitRaum=ecImp.docs.some(d=>d.typ==="raum");
  const kurz=r=>[r.fuse_number,r.circuit_name].filter(Boolean).join(" · ")+" — "+[r.loop_impedance&&`Z s ${ecSpWert(r.loop_impedance,"Ω")} Ω`,r.insulation_resistance&&`R iso ${ecSpWert(r.insulation_resistance,"MΩ")} MΩ`,r.protective_earth_resistance&&`R LO ${ecSpWert(r.protective_earth_resistance,"Ω")} Ω`,(r.rcd_tripping_time_1||r.rcd_tripping_time)&&`RCD ${ecSpWert(r.rcd_tripping_time_1||r.rcd_tripping_time,"ms")} ms`].filter(Boolean).join(" · ");
  dialog("Sparkify-Import",`<p class="ec-sub">${esc(ecImp.datei)} · ${anz} Messung${anz===1?"":"en"} in ${ecImp.docs.length} Dokumentation${ecImp.docs.length===1?"":"en"}</p>
    ${kdWarn?`<div class="ec-tipp warn">${icon("warn")}<span>Kundennummer in der Datei (${esc(kdWarn)}) passt nicht zu ${esc(o.kunde.name)} (${esc(o.kunde.kdnr)}). Richtige Datei?</span></div>`:""}
    <div class="fg1"><div class="reihe2">${mitRaum?sf("impV","Neue Stromkreise in Verteiler",ecImp.vId,[...g.verteiler.map(v=>[v.id,v.name]),["__neu","Neuer Verteiler „Hauptverteiler“"]],{form:true}):""}${sf("impEt","Neue Räume auf Etage",ecImp.etId,ecEtagen(g).map(e=>[e.id,ecEtLabel(e)]),{form:true})}</div></div>
    ${ecImp.docs.map((d,di)=>{ const P=d.raumId==="__neu"?[]:ecRaumPunkte(g,d.raumId), rName=d.typ==="vt"?ecOhneVt(d.name):d.name;
      return `<div class="ec-imp"><div class="ec-imp-k"><b>„${esc(d.name)}“ ist ein</b>${ecChips("impTyp"+di,[["raum","Raum"],["vt","Verteiler"]],d.typ)}</div>
        <div class="fg1"><div class="reihe2">${d.typ==="vt"?sf("impDV_"+di,"Verteiler",d.vId,[...g.verteiler.map(v=>[v.id,v.name]),["__neu",`Neuer Verteiler „${d.name}“`]],{form:true}):""}
          ${sf("impR_"+di,d.typ==="vt"?"Messpunkte im Raum":"Raum",d.raumId,[...R.map(r=>[r.id,r.titel]),["__neu",`Neuer Raum „${rName}“`]],{form:true})}</div></div>
        <div class="list">${d.rows.map((x,ri)=>`<div class="ec-imp-z"><span class="nr">${ri+1}</span><span class="t">${esc(kurz(x.r))}</span>
          <div class="ec-imp-s">${sf(`impZ_${di}_${ri}`,"Ziel",x.ziel,[...P.map(p=>[p.id,`${p.nr} · ${ecStName(p.st)}${p.st.lage?" ("+p.st.lage+")":""}`]),["__neu","neue Steckdose anlegen"],["__sk","am Stromkreis (ohne Messpunkt)"],["__skip","nicht übernehmen"]],{form:true})}</div></div>`).join("")}</div></div>`; }).join("")}
    <p class="meta" style="margin-top:10px">Stromkreise werden über die Nummer gefunden (F1 = 1), fehlende Stromkreise und RCDs legt die App an. Vorhandene Werte werden überschrieben.</p>`,
    `<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="ecImportOk">Übernehmen</button>`,{breit:true}); }
function ecImportLesen(){ const F=formVals(); if(F.impV) ecImp.vId=F.impV; if(F.impEt) ecImp.etId=F.impEt;
  ecImp.docs.forEach((d,di)=>{ if(F["impR_"+di]!=null) d.raumId=F["impR_"+di]; if(F["impDV_"+di]!=null) d.vId=F["impDV_"+di]; d.rows.forEach((x,ri)=>{ const v=F[`impZ_${di}_${ri}`]; if(v!=null) x.ziel=v; }); }); }
function ecImportOk(){ ecImportLesen(); const pr=ecPr(), g=ecGeb(pr.ortId); let n=0;
  const vtSicher=(id,name)=>{ if(id&&id!=="__neu"&&g.verteiler.some(v=>v.id===id)) return id; const da=g.verteiler.find(v=>v.name===name); if(da) return da.id; const v={id:uid(),name,raumId:""}; g.verteiler.push(v); return v.id; };
  const et=g.etagen.find(e=>e.id===ecImp.etId)||ecEtStd(g);
  pr.werte=pr.werte||{}; const setz=(id,o)=>{ const w=Object.assign({},pr.werte[id]||{}); Object.entries(o).forEach(([k,v])=>{ if(v) w[k]=v; }); pr.werte[id]=w; };
  for(const d of ecImp.docs){ const vId=d.typ==="vt"?vtSicher(d.vId,d.name):vtSicher(ecImp.vId,"Hauptverteiler");
    let raumId=d.raumId; const raumSicher=()=>{ if(raumId&&raumId!=="__neu"&&ecRaumName(g,raumId)) return raumId; const r={id:uid(),name:d.typ==="vt"?ecOhneVt(d.name):d.name}; et.raeume.push(r); raumId=r.id; return raumId; };
    if(d.netz&&["TN-C-S","TN-S","TT"].includes(d.netz)&&!(pr.netz&&pr.netz.formGesetzt)) pr.netz=Object.assign({},pr.netz||{},{form:d.netz});
    /* Prüfanlass aus Sparkify, solange die Prüfart nicht von Hand gewählt wurde */
    if(!pr.pruefartGesetzt&&ecAn(pr)){ if(/neuanlage|erst|neubau/i.test(d.anlass)) pr.pruefart="Erstprüfung"; else if(/wiederhol/i.test(d.anlass)) pr.pruefart="Wiederholungsprüfung"; else if(/e-?check/i.test(d.anlass)) pr.pruefart="E-CHECK"; }
    for(const x of d.rows){ if(x.ziel==="__skip") continue; const r=x.r, key=x.key, namen=ecImpNamen(d,key);
      /* Stromkreis */ let sk=ecSkFinden(g,key,vId);
      const schutz=(String(r.fuse_type||"")+String(r.fuse_rated_current||"")).replace(/\s/g,""), leitung=[r.cable_type,r.conductor_cross_section&&`${r.conductor_cross_section} mm²`].filter(Boolean).join(" ");
      const bez=namen.length===1?namen[0]:(()=>{ const W=namen.map(n=>n.split(/\s+/)), out=[]; for(let i=0;i<W[0].length&&W.every(w=>w[i]===W[0][i]);i++) out.push(W[0][i]); return out.join(" "); })();
      if(!sk){ sk={id:uid(),vId,nr:key,bez,schutz,leitung,rcdId:""}; g.stromkreise.push(sk); }
      else { if(!sk.schutz) sk.schutz=schutz; if(!sk.leitung) sk.leitung=leitung; if(!sk.bez&&bez) sk.bez=bez; }
      /* RCD: hat der Stromkreis schon einen, gelten die Werte für diesen; sonst nach Nummer suchen oder anlegen.
         Gleiche Nummer und gleicher Bemessungsstrom wie der LS → FI/LS-Kombination (RCBO) */
      let rcd=ecRcdVon(g,sk); if(!rcd&&(r.rcd_type||r.rcd_residual_current||r.rcd_circuit_number)){ const v2=sk.vId||vId, nr=String(r.rcd_circuit_number||"").trim()||"1";
        rcd=g.rcds.find(q=>q.vId===v2&&String(q.nr)===nr); const t=ecRcdText(`${r.rcd_residual_current} ${r.rcd_type}`), inn=String(r.rcd_rated_current||"").replace(/\D/g,"");
        if(!rcd){ rcd={id:uid(),vId:v2,nr,typ:t.typ,idn:t.idn,in:inn,fils:!!inn&&inn===String(r.fuse_rated_current||"").replace(/\D/g,"")&&ecNrNorm(nr)===ecNrNorm(key)}; g.rcds.push(rcd); } }
      if(rcd&&!sk.rcdId) sk.rcdId=rcd.id;
      /* Wohin mit Z s? am Stromkreis oder an einem Messpunkt */
      const pw={zs:ecSpWert(r.loop_impedance,"Ω"),ub:ecSpWert(r.contact_voltage,"V"),zi:ecSpWert(r.line_impedance,"Ω"),ik:ecSpWert(r.short_circuit_current,"A"),modus:r.measurement_mode||""};
      if(x.ziel==="__sk") setz(sk.id,pw);
      else { let pid=x.ziel;
        if(!pid||pid==="__neu"||!ecAllePunkte(g).some(p=>p.id===pid)){ const rid=raumSicher(), ord=Math.max(0,...g.stellen.filter(s=>s.raumId===rid).map(s=>s.ord||0))+1,
            st={id:uid(),raumId:rid,ord,art:"sd",fach:1,lage:namen.length>1?String(r.circuit_name||"").trim():"",skId:sk.id}; g.stellen.push(st); pid=st.id+".1"; }
        else { const st=g.stellen.find(s=>s.id===pid.split(".")[0]); if(st&&!st.skId) st.skId=sk.id; }
        setz(pid,pw); }
      setz(sk.id,{riso:ecSpWert(r.insulation_resistance,"MΩ"),rlo:ecSpWert(r.protective_earth_resistance,"Ω")});
      if(rcd) setz(rcd.id,{t1:ecSpWert(r.rcd_tripping_time_1||r.rcd_tripping_time,"ms"),t5:ecSpWert(r.rcd_tripping_time_5,"ms"),idelta:ecSpWert(r.rcd_current,"mA"),ub:r.rcd_tripping_time_1||r.rcd_current?ecSpWert(r.contact_voltage,"V"):""});
      n++; } }
  ecGebSpeichern(g); pr.importe=[...(pr.importe||[]),{datei:ecImp.datei,at:Date.now(),n,von:who().name}]; if(pr.status==="offen") pr.status="laeuft"; saveRec("echecks",pr);
  ecImp=null; closeOverlays(); render(); toast(`${n} Messung${n===1?"":"en"} übernommen`); }

/* ---- PDF im Irrgang-Layout (pdfstil.js) und Ablage in der Bibliothek ---- */
async function ecPdf(pr){ const lib=await pdfLib(), d=new lib.jsPDF({unit:"mm",format:"a4"}), o=ecOrt(pr.ortId), k=o.kunde, an=ecAn(pr), erg=ecErgebnis(pr), G=ecMgAktuell(pr), N=pr.netz||{};
  const adr=x=>x?[x.name,adrText(x)].filter(Boolean).join(", "):"", pl=st=>st==="ok"?"ok|i.O.":st==="bad"?"bad|Mangel":st==="ng"?"open|n. gem.":"open|offen";
  const nz=ecNz(pr), S=pdfStil(d,{titel:nz?"Prüfprotokoll Netzwerkverkabelung":an?"Prüfprotokoll Elektroinstallation":"Prüfprotokoll ortsveränderliche Geräte",unter:nz?`${pr.pruefart||"Prüfung"} | Übertragungsprüfung (Qualifizierung) | IEEE 802.3`:an?`${pr.pruefart||"Prüfung"} | DIN VDE 0100-600 | DIN VDE 0105-100`:`${pr.pruefart||"Prüfung"} | DIN VDE 0701-0702 | DGUV Vorschrift 3`,ehw:true,
    fuss:[k&&k.name,o.standort&&o.standort.name,pr.auftragsnr&&`Auftrag ${pr.auftragsnr}`,`Prüfdatum ${ecDatum(pr.datum)}`].filter(Boolean).join(" | ")});
  S.kopf(); S.abschnitt("Auftragsdaten");
  S.werte([["Auftraggeber",adr(k)],["Auftragsnr.",pr.auftragsnr],["Kundennr.",k&&k.kdnr],["Ansprechpartner",k&&k.ansprech],["Prüfort",o.standort?adr(o.standort):"wie Auftraggeber"],["Art der Prüfung",pr.pruefart],
    ["Prüfdatum",ecDatum(pr.datum)],["Prüfer",pr.pruefer],["Messgerät",G.mess],["Seriennr.",G.sn],["Kal. gültig bis",G.kal],nz?["Verkabelung",[pr.kabel,ecWmStd(pr),pr.schirm==="nein"?"ungeschirmt":"geschirmt"].filter(Boolean).join(" | ")]:an?["Netzform",`${N.form||"-"} | 230/400 V${N.hak?` | HAK ${N.hak}`:""}`]:["Anzahl Geräte",String(ecGeraeteAm(pr.ortId).filter(b=>!["open","ng"].includes(ecGerStand(pr,b))).length)],
    ...(pr.bez?[["Bezeichnung",pr.bez]]:[])]);
  if(nz) ecNetPdf(pr,S,pl);
  else if(an){ const g=ecGeb(pr.ortId), SK=ecSkListe(g).filter(s=>ecImUmfang(pr,s));
    S.abschnitt("Prüfumfang"); S.text(pr.umfangText||ecUmfangAuto(pr,g));
    S.abschnitt("Besichtigung"); const half=Math.ceil(EC_SICHT.length/2), cw=S.CW/2; d.setFontSize(8);
    for(let i=0;i<half;i++){ S.platz(6); for(let c=0;c<2;c++){ const j=i+c*half, t=EC_SICHT[j]; if(!t) continue; const x=S.M+c*cw, v=(pr.sicht||{})["s"+j];
        d.setFont("helvetica","normal"); d.setTextColor(30); d.text(d.splitTextToSize(pdfT(t),cw-24)[0],x+2,S.y);
        d.setFont("helvetica","bold"); d.setTextColor(...(v==="ok"?S.OKC:v==="nok"?S.BADC:S.GR)); d.text(v==="ok"?"i.O.":v==="nok"?"n.i.O.":v==="na"?"entf.":"-",x+cw-4,S.y,{align:"right"}); }
      S.y+=5.5; } S.y+=3;
    const R=g.rcds.filter(r=>SK.some(s=>s.rcdId===r.id));
    if(R.length){ S.abschnitt("Fehlerstrom-Schutzeinrichtungen (RCD)");
      S.tabelle(["RCD","Verteiler","Daten","t 1x IdN","t 5x IdN","Ausl.-strom","U B","Ergebnis"],[18,32,42,18,18,18,14,22],R.map(r=>{ const w=ecW(pr,r.id);
        return [ecRcdName(r),ecVtName(g,r.vId)||"-",ecRcdInfo(r)||"-",w.t1?w.t1+" ms":"-",w.t5?w.t5+" ms":"-",w.idelta?w.idelta+" mA":"-",w.ub?w.ub+" V":"-",pl(ecRcdStand(pr,r))]; }),7); }
    S.abschnitt("Stromkreise"); const Z=[];
    [...g.verteiler,{id:"",name:"Ohne Verteiler"}].forEach(v=>{ const L=SK.filter(s=>v.id?s.vId===v.id:(!s.vId||!g.verteiler.some(x=>x.id===s.vId))); if(!L.length) return; Z.push(v.name);
      L.forEach(sk=>{ const w=ecW(pr,sk.id), L2=ecLs(sk.schutz), zm=ecZsMax(pr,g,sk), r=ecRcdVon(g,sk), R2=ecSkRaeume(g,sk).map(x=>x.split(" · ").pop());
        Z.push([sk.nr||"-",[sk.bez,R2.length&&`(${R2.join(", ")})`,w.ng&&`nicht gemessen: ${w.ng}`].filter(Boolean).join(" ")||"-",sk.schutz||"-",r?ecRcdName(r):"-",w.riso?w.riso+" MOhm":"-",w.rlo?w.rlo+" Ohm":"-",
          zm?`${zm.g}${ecFmt(zm.n)}${L2?` / ${ecFmt(L2.zs)}`:""} Ohm`:"-",pl(ecSkStand(pr,g,sk))]); }); });
    if(Z.length) S.tabelle(["Nr.","Stromkreis (Räume)","Schutz","RCD","R iso","R LO","Z s max / Grenzw.","Ergebnis"],[12,54,15,15,20,16,30,20],Z,7); else S.text("Keine Stromkreise erfasst.");
    const MP=[]; ecRaeume(g).forEach(r=>{ const P=ecRaumPunkte(g,r.id).filter(p=>ecImUmfang(pr,ecSkVon(g,p))); if(!P.length) return; MP.push(r.titel);
      P.forEach(p=>{ const sk=ecSkVon(g,p), w=ecW(pr,p.id), st=ecPunktStand(pr,g,p); MP.push([p.nr,`${ecStName(p.st)}${p.st.lage?` - ${p.st.lage}`:""}`,sk?[sk.nr,sk.schutz].filter(Boolean).join(" "):"-",w.zs?w.zs+" Ohm":"-",w.zi?w.zi+" Ohm":"-",w.ik?w.ik+" A":"-",w.ub?w.ub+" V":"-",st==="opt"?"open|-":pl(st)]); }); });
    if(MP.length){ S.abschnitt("Messpunkte"); S.tabelle(["Nr.","Anschlusspunkt","Stromkreis","Z s","Z i","I k","U B","Ergebnis"],[14,56,26,20,18,16,12,20],MP,7); }
    S.text("Grenzwerte: R iso >= 1 MOhm; Z s <= 230 V / Ia (Ia = 5 x In bei B, 10 x In bei C, 20 x In bei D); RCD: Auslösezeit <= 300 ms bei IdN und <= 40 ms bei 5 x IdN, Auslösestrom zwischen 0,5 und 1 x IdN, Berührungsspannung <= 50 V; R LO als Richtwert <= 1 Ohm."); }
  else { const B=ecGeraeteAm(pr.ortId).filter(b=>ecGerStand(pr,b)!=="open");
    S.abschnitt("Geprüfte Geräte");
    S.tabelle(["Gerät","Typ / Seriennr. / Inv.","SK","Sicht","R PE","R iso","I PE / I B","Funkt.","Ergebnis"],[34,44,8,12,15,17,18,12,22],B.map(b=>{ const w=ecW(pr,b.id), st=ecGerStand(pr,b), t=v=>v==="ok"?"i.O.":v==="nok"?"n.i.O.":"-";
      return [b.bez||"-",[b.typ,b.sn,b.inv&&"Inv. "+b.inv,w.ng&&"nicht geprüft: "+w.ng].filter(Boolean).join(" | ")||"-",b.sk||"I",t(w.sicht),w.rpe?w.rpe+" Ohm":"-",w.riso?w.riso+" MOhm":"-",w.ipe?w.ipe+" mA":w.ib?w.ib+" mA":"-",t(w.funktion),st==="ng"?"open|n. gepr.":pl(st)]; }),8);
    S.text("Grenzwerte nach DIN VDE 0701-0702: R PE <= 0,3 Ohm (bis 5 m); R iso >= 1 MOhm (SK I), >= 2 MOhm (SK II), >= 0,25 MOhm (SK III); Schutzleiterstrom <= 3,5 mA; Berührungsstrom <= 0,5 mA."); }
  S.abschnitt("Gesamtergebnis"); S.platz(10); d.setFont("helvetica","bold"); d.setFontSize(10); d.setTextColor(20);
  d.text(pdfT(erg==="ok"?"Keine Mängel festgestellt.":erg==="bad"?"Mängel festgestellt - Beseitigung erforderlich.":"Prüfung unvollständig - nicht alle Werte erfasst."),S.M,S.y); S.plakette(S.M+S.CW-1,S.y,erg); S.y+=9;
  S.abschnitt("Festgestellte Mängel / Maßnahmen"); S.text(pr.maengel||ecMaengelText(pr)||"Keine.");
  if(!nz){ S.abschnitt("Nächste Prüfung"); S.text(`Empfohlen bis ${ecDatum(ecPlus(pr.datum,pr.fristM||(an?48:12)))}. Die Frist legt der Betreiber fest.`); }
  S.abschnitt("Unterschriften"); S.y+=2; S.unterschriften([["Prüfer",pr.pruefer,ecDatum(pr.datum)],["Auftraggeber",k&&k.ansprech||"",ecDatum(pr.datum)]]);
  return S.ende(pr.id.slice(-6).toUpperCase()); }
async function ecPdfAblegen(pr){ toast("PDF wird erstellt …");
  let blob; try{ blob=await ecPdf(pr); }catch(e){ console.error(e); toast("PDF konnte nicht erstellt werden – Internet für die PDF-Bibliothek nötig"); return; }
  const o=ecOrt(pr.ortId), k=o.kunde, an=ecAn(pr), name=bbFs(`${pr.datum} ${EC_ART[pr.art||"anlage"]||"Prüfung"} ${k?k.name:""}${o.standort?" "+o.standort.name:""}`);
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
  if(el.id==="f_ecMg"){ const pr=ecPr(); if(!pr||pr.status==="fertig") return; if(el.value==="__neu"){ ecMgHandDlg(); render(); return; } if(el.value==="__hand"||!el.value) return;
    const m=DB.geraete&&DB.geraete.get(el.value); if(m){ pr.geraet=ecMgDaten(m); saveRec("echecks",pr); render(); } return; }
  if(el.id==="f_ecKunde"){ const f=document.getElementById("ecOrtFeld"); if(f) f.innerHTML=ecOrtFeld(el.value); return; }
  if(el.id==="f_ecEbene"&&ecDlg&&"ebeneHand" in ecDlg){ ecDlg.ebeneHand=el.value!==""; return; }
  if(el.id==="f_ecSchr"&&ecDlg&&"dose" in ecDlg){ const pr=ecPr(), g=ecGeb(pr.ortId), s2=g.schraenke.find(x=>x.id===el.value), pf=ecPfWahl(s2,+ecDlg.w.pf||1); ecDlg.w.pf=String(pf);
    const z=document.getElementById("ecPfZeile"); if(z) z.innerHTML=ecPfChips(g,el.value,pf); const st=document.getElementById("f_ppStart"); if(st){ st.value=String(ecPfFrei(g,el.value,pf,ecDlg.dose)); st.parentElement.classList.add("fl"); } ecPpFuellen(); return; }
  if(el.id==="f_skV"){ const pr=ecPr(), f=document.getElementById("ecRcdFeld"); if(pr&&f) f.innerHTML=ecRcdFeld(ecGeb(pr.ortId),el.value,""); return; }
  if(ecImp&&/^f_imp(R_|DV_|V$|Et$)/.test(el.id)){ ecImportLesen(); ecImportZiele(); ecImportDlg(); return; }
  if(/^f_zu_/.test(el.id)&&el.value){ const pr=ecPr(), g=ecGeb(pr.ortId), st=g.stellen.find(s=>s.id===el.id.slice(5)); if(st){ ecWerteLesen(); st.skId=el.value; ecLetzterSk=el.value; ecGebSpeichern(g); const r=ecDlg&&ecDlg.raumMess; render(); if(r) ecRaumMessDlg(r); } return; }
  if(el.dataset&&el.dataset.ec){ const pr=ecPr(); if(!pr||pr.status==="fertig") return; const [a,b]=el.dataset.ec.split("."); if(a==="pruefart") pr.pruefartGesetzt=true; if(b){ pr[a]=Object.assign({},pr[a]||{},{[b]:el.value.trim()}); } else pr[a]=el.value.trim(); saveRec("echecks",pr); } });
document.addEventListener("input",e=>{ const el=e.target; if(!el.dataset) return;
  if(el.id==="f_ppStart"){ ecPpFuellen(); return; }
  if(el.id==="f_ecName"&&ecDlg&&"ebeneHand" in ecDlg&&!ecDlg.ebeneHand){ const s2=document.getElementById("f_ecEbene"), v=ecEbeneRaten(el.value); if(s2) s2.value=v==null?"":String(v); return; }
  if(el.dataset.mw&&el.dataset.gsk){ const f=el.closest(".ec-feld"); if(!f) return; const st=ecWertStand(EC_GW[el.dataset.mw].gw(el.dataset.gsk),el.value); f.classList.remove("ok","bad"); if(st) f.classList.add(st); return; }
  if(!el.dataset.z||!el.dataset.k||!EC_F[el.dataset.k]) return; const pr=ecPr(); if(!pr) return; const g=ecGeb(pr.ortId), z=el.dataset.z, k=el.dataset.k;
  const bezug=["t1","t5","idelta"].includes(k)||(k==="ub"&&g.rcds.some(r=>r.id===z))?g.rcds.find(r=>r.id===z):z.includes(".")?ecSkVon(g,{st:g.stellen.find(s=>s.id===z.split(".")[0])||{}}):g.stromkreise.find(s=>s.id===z);
  const f=el.closest(".ec-feld,.ec-pz"); if(!f) return; const st=ecWertStand(EC_F[k].gw(bezug),el.value); f.classList.remove("ok","bad"); if(st) f.classList.add(st); });
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act^="ec"],[data-act="bmSk"]'); if(!b||b.disabled) return; const a=b.dataset.act;
  e.stopPropagation(); e.preventDefault();
  const pr=ecPr(), g=pr&&pr.art!=="geraete"?ecGeb(pr.ortId):null, zu=pr&&pr.status==="fertig", nichtZu=()=>{ if(zu){ toast("Prüfung ist abgeschlossen – unter „Abschluss“ wieder öffnen"); return false; } return true; };
  const sp=()=>{ ecGebSpeichern(g); };
  switch(a){
  case "ecNeuA": ecNeuDialog("anlage"); return;
  case "ecNeuG": ecNeuDialog("geraete"); return;
  case "ecNeuN": ecNeuDialog("netz"); return;
  case "ecNeuOrt": { const o=ecOrt(b.dataset.ort); ecNeuDialog(b.dataset.art,o.kunde&&o.kunde.id,b.dataset.ort); return; }
  case "ecNeuHier": { const r=DB[b.dataset.kind].get(b.dataset.id), kid=b.dataset.kind==="kunden"?r.id:r.kundeId, ort=b.dataset.kind==="kunden"?"k:"+r.id:r.id;
    dialog("Welche Prüfung?",`<div class="list">${[["anlage","Installationsprüfung","Hausinstallation oder Anlage – Räume, Verteiler, Stromkreise, Steckdosen","home"],["geraete","Geräteprüfung","Ortsveränderliche Geräte nach DGUV V3","ecStecker"],["netz","Netzwerkprüfung","Datenverkabelung – Netzwerkschrank, Datendosen, Links","ecNetz"]].map(([v,t,s,i])=>`<div class="li" role="button" tabindex="0" data-act="ecNeuWahl" data-art="${v}" data-k="${esc(kid)}" data-ort="${esc(ort)}"><span class="av">${icon(i)}</span><span class="lt"><span class="h">${t}</span><span class="s">${s}</span></span>${icon("chev")}</div>`).join("")}</div>`,`<button class="btn-text" data-act="cancel">Abbrechen</button>`); return; }
  case "ecNeuWahl": closeOverlays(); ecNeuDialog(b.dataset.art,b.dataset.k,b.dataset.ort); return;
  case "ecNeuOk": ecNeuOk(); return;
  case "ecOeffnen": { const p=DB.echecks.get(b.dataset.id); if(p) go({v:"ec",id:p.id,tab:p.status==="fertig"?"abschluss":p.status==="offen"?"auftrag":p.art==="geraete"?"geraete":"messen"}); return; }
  case "ecTab": { if(!pr) return; const T=ecSchritte(pr).find(x=>x[0]===b.dataset.v);
    if(T&&T[3]){ toast(`Abschluss erst, wenn alles fertig ist – noch offen: ${ecFehlt(pr).join(", ")}`); if(typeof navIndSetzen==="function") navIndSetzen(); return; }
    nav.tab=b.dataset.v; nav.schr=null; closeOverlays(); render(); scrollTo(0,0); return; }
  case "ecMv": nav.mv=b.dataset.v; render(); return;
  case "ecPick": if(!nichtZu()) return; ecPickDlg(b.dataset.w); return;
  case "ecPickSet": { if(!nichtZu()) return; const w=b.dataset.w, v=b.dataset.v;
    if(w==="pruefart"){ pr.pruefart=v; pr.pruefartGesetzt=true; } else if(w==="pruefer") pr.pruefer=v; else if(w==="kabel") pr.kabel=v;
    else if(w==="mg"){ const m=DB.geraete&&DB.geraete.get(v); if(!m) return; pr.geraet=ecMgDaten(m); }
    saveRec("echecks",pr); closeOverlays(); render(); return; }
  case "ecPickPrName": { const n=(formVals().ecPrName||"").trim(); if(!n){ toast("Bitte einen Namen eingeben oder oben wählen"); return; } pr.pruefer=n; saveRec("echecks",pr); closeOverlays(); render(); return; }
  case "ecPickKabelText": { const n=(formVals().ecKabel||"").trim(); if(!n){ toast("Bitte eine Angabe eingeben oder oben wählen"); return; } pr.kabel=n; saveRec("echecks",pr); closeOverlays(); render(); return; }
  case "ecPickMgHand": ecMgHandDlg(); return;
  case "ecMgHandOk": { const F=formVals(); if(!(F.mgMess||"").trim()){ toast("Bitte das Messgerät angeben"); return; } pr.geraet={mess:F.mgMess.trim(),sn:(F.mgSn||"").trim(),kal:(F.mgKal||"").trim()}; saveRec("echecks",pr); closeOverlays(); render(); return; }
  case "ecUmfangAuto": pr.umfangText=""; saveRec("echecks",pr); closeOverlays(); render(); return;
  case "ecUmfangOk": { const t=document.getElementById("f_umfangText"); pr.umfangText=(t&&t.value||"").trim(); saveRec("echecks",pr); closeOverlays(); render(); return; }
  case "ecPruefer": { if(!nichtZu()) return; pr.pruefer=b.dataset.n; saveRec("echecks",pr); render(); return; }
  case "ecMg": { if(!nichtZu()) return; const m=DB.geraete&&DB.geraete.get(b.dataset.id); if(m){ pr.geraet=ecMgDaten(m); saveRec("echecks",pr); render(); } return; }
  case "ecUmfangV": { if(!nichtZu()) return; const alle=ecGeb(pr.ortId).verteiler.map(v=>v.id); let L=pr.umfang&&pr.umfang.vIds?[...pr.umfang.vIds]:[...alle];
    L=L.includes(b.dataset.id)?L.filter(x=>x!==b.dataset.id):[...L,b.dataset.id]; if(!L.length){ toast("Mindestens ein Verteiler gehört zur Prüfung"); return; }
    pr.umfang=alle.every(x=>L.includes(x))?null:{vIds:L}; saveRec("echecks",pr); render(); return; }
  case "ecWahl": { const gr=b.dataset.g; b.parentElement.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));
    if(ecDlg&&"geplant" in ecDlg&&["vor","bauart","he","breite","tiefe","farbe","pfAnz","pfPorts"].includes(gr)){ const v=b.dataset.v; ecSchrLesen();
      if(gr==="vor"){ const p=EC_RKVOR[+v]; Object.assign(ecDlg.w,{bauart:p[0],he:String(p[1]),breite:String(p[2]),tiefe:String(p[3])}); ecSchrDlg(); return; }
      ecDlg.w[gr]=v; if(gr==="bauart"){ const T=EC_RKTIEFEN[v]; if(!T.includes(+ecDlg.w.tiefe)) ecDlg.w.tiefe=String(v==="stand"?800:450); ecSchrDlg(); } return; }
    if(ecDlg&&ecDlg.rk&&/^rk/.test(gr)){ const z=ecDlg.rk, v=b.dataset.v; ecRkLesen();
      if(gr==="rkTyp"){ const s2=g&&g.schraenke.find(x=>x.id===nav.schr), d=EC_RKSTD[v]||{he:1}; z.typ=v; z.he=d.he; z.ports=d.ports||0; if(v==="patch"&&!z.nr&&s2) z.nr=Math.max(0,...ecPfListe(s2).map(x=>x.nr))+1; ecRkDlg(z); return; }
      if(gr==="rkHe") z.he=+v; if(gr==="rkPorts") z.ports=+v; if(gr==="rkPoe") z.poe=v==="1"; return; }
    if(gr==="lage"||gr==="nlage"||gr==="schutz"||gr==="leitung"){ const i=document.getElementById({lage:"f_ecLage",nlage:"f_ecLage",schutz:"f_skSchutz",leitung:"f_skLeitung"}[gr]); if(i){ i.value=b.dataset.v; i.parentElement.classList.add("fl"); } return; }
    if(/^impTyp\d+$/.test(gr)&&ecImp){ ecImportLesen(); const d=ecImp.docs[+gr.slice(6)]; if(d){ d.typ=b.dataset.v; ecImportZiele(); ecImportDlg(); } return; }
    if(ecDlg&&ecDlg.w) ecDlg.w[gr]=b.dataset.v; if(gr==="art"){ const z=document.getElementById("ecFachZeile"); if(z) z.hidden=b.dataset.v!=="sd"; }
    if(gr==="ports") document.querySelectorAll("#dlg [data-pp]").forEach(x=>x.hidden=+x.dataset.pp>+b.dataset.v);
    if(gr==="pf"&&ecDlg&&"dose" in ecDlg){ const pr2=ecPr(), g2=ecGeb(pr2.ortId), st=document.getElementById("f_ppStart"); if(st){ st.value=String(ecPfFrei(g2,(document.getElementById("f_ecSchr")||{}).value||"",b.dataset.v,ecDlg.dose)); st.parentElement.classList.add("fl"); } }
    if(gr==="ports"||gr==="pf") ecPpFuellen(); return; }
  /* Etagen und Räume */
  case "ecEt": { const akt=g.etagen.find(e=>e.id===nav.et)||ecEtStd(g); if(akt&&akt.id===b.dataset.id){ if(zu) return; ecEtDlg(akt); return; } nav.et=b.dataset.id; render(); return; }
  case "ecEtEdit": { if(!nichtZu()) return; const et=g.etagen.find(x=>x.id===b.dataset.id); if(et) ecEtDlg(et); return; }
  case "ecEtNeu": if(!nichtZu()) return; ecEtDlg(null); return;
  case "ecNameSetz": { const i=document.getElementById("f_ecName"); if(i){ i.value=b.dataset.v; i.parentElement.classList.add("fl"); i.dispatchEvent(new Event("input",{bubbles:true})); } return; }
  case "ecEtOk": { const F=formVals(), n=(F.ecName||"").trim(), eb=F.ecEbene!==""&&F.ecEbene!=null?+F.ecEbene:(ecEbeneRaten(n)??0); if(!n){ toast("Bitte eine Bezeichnung eingeben"); return; }
    if(ecDlg.et){ Object.assign(g.etagen.find(x=>x.id===ecDlg.et),{name:n,ebene:eb}); } else { const et={id:uid(),name:n,ebene:eb,raeume:[]}; g.etagen.push(et); nav.et=et.id; } sp(); closeOverlays(); render(); return; }
  case "ecEtDel": { const et=g.etagen.find(x=>x.id===ecDlg.et); if(!et) return; if(g.etagen.length<2){ toast("Mindestens eine Etage bleibt"); return; } if(et.raeume.length){ toast("Erst die Räume dieser Etage löschen"); return; } g.etagen=g.etagen.filter(x=>x!==et); nav.et=null; sp(); closeOverlays(); render(); return; }
  case "ecEtSerie": { const F=formVals(), von=+F.esVon, bis=+F.esBis, ab=+F.esAb; if(!(bis>=von)){ toast("Bitte einen gültigen Bereich wählen"); return; } if(bis-von>15){ toast("Höchstens 16 Etagen auf einmal"); return; }
    for(let n=von;n<=bis;n++){ const name=`${F.esName||"Level"} ${n}`; if(g.etagen.some(e=>e.name===name)) continue; g.etagen.push({id:uid(),name,ebene:ab+(n-von),raeume:[]}); }
    if(g.etagen.length>1&&g.etagen.some(e=>e.id==="eg"&&!e.raeume.length&&e.name==="EG")&&g.etagen.some(e=>e.id!=="eg"&&ecEbene(e)===0)) g.etagen=g.etagen.filter(e=>!(e.id==="eg"&&!e.raeume.length&&e.name==="EG"));
    nav.et=null; sp(); closeOverlays(); render(); return; }
  case "ecEtSerieDlg": { dialog("Mehrere Etagen anlegen",`<p class="ec-sub">Für Gebäude mit eigener Zählung, z. B. Level 1 bis 5, wobei Level 1 das Erdgeschoss ist.</p><div class="fg1">${tf("esName","Bezeichnung",b.dataset.n||"Level",{form:true})}<div class="reihe2">${sf("esVon","von",String(1),Array.from({length:21},(_,i)=>[String(i-5),String(i-5)]),{form:true})}${sf("esBis","bis",String(5),Array.from({length:21},(_,i)=>[String(i-5),String(i-5)]),{form:true})}</div>${sf("esAb","Die erste davon ist",String(0),EC_GESCHOSS.map(([v,t])=>[String(v),t]),{form:true})}</div><p class="meta" style="margin-top:10px">Das „EG“, das jedes neue Gebäude hat, wird dabei entfernt, solange es leer ist.</p>`,`<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="ecEtSerie">Anlegen</button>`,{breit:true}); return; }
  case "ecRaumNeu": if(!nichtZu()) return; ecDlg={raum:null}; ecNameDlg("Neuer Raum","","ecRaumOk",null,`<div class="chips">${["Küche","Bad","Flur","Wohnen","Schlafen","Kind","Büro","Keller","Hausanschlussraum","Garage","Treppenhaus","Außen"].map(n=>`<button type="button" class="chip" data-act="ecNameSetz" data-v="${n}">${n}</button>`).join("")}</div>`); return;
  case "ecRaum": ecRaumDlg(b.dataset.id); return;
  case "ecRaumEdit": { let r=null; g.etagen.forEach(e=>e.raeume.forEach(x=>{ if(x.id===b.dataset.id) r=x; })); if(r&&nichtZu()){ ecDlg={raum:r.id}; ecNameDlg("Raum bearbeiten",r.name,"ecRaumOk","ecRaumDel"); } return; }
  case "ecRaumOk": { const n=(formVals().ecName||"").trim(); if(!n){ toast("Bitte eine Bezeichnung eingeben"); return; }
    if(ecDlg.raum){ g.etagen.forEach(e=>e.raeume.forEach(x=>{ if(x.id===ecDlg.raum) x.name=n; })); sp(); render(); ecRaumDlg(ecDlg.raum); return; }
    const et=g.etagen.find(e=>e.id===nav.et)||ecEtStd(g), r={id:uid(),name:n}; et.raeume.push(r); sp(); render(); ecRaumDlg(r.id); return; }
  case "ecRaumDel": { const id=ecDlg.raum, n=g.stellen.filter(s=>s.raumId===id).length+g.dosen.filter(d=>d.raumId===id).length; if(n&&!b.dataset.ok){ b.dataset.ok="1"; b.textContent=`Mit ${n} Anschlusspunkt${n>1?"en":""} und Dose${n>1?"n":""} löschen`; return; }
    g.etagen.forEach(e=>{ e.raeume=e.raeume.filter(x=>x.id!==id); }); g.stellen=g.stellen.filter(s=>s.raumId!==id); g.dosen=g.dosen.filter(d=>d.raumId!==id); g.schraenke.forEach(s=>{ if(s.raumId===id) s.raumId=""; }); g.verteiler.forEach(v=>{ if(v.raumId===id) v.raumId=""; }); sp(); closeOverlays(); render(); return; }
  /* Anschlusspunkte */
  case "ecStelleNeu": if(!nichtZu()) return; ecStelleDlg(null,b.dataset.id); return;
  case "ecStelle": if(!nichtZu()) return; ecStelleDlg(b.dataset.id); return;
  case "ecZumRaum": { if(ecDlg&&ecDlg.ausRack){ closeOverlays(); return; } if(ecDlg&&ecDlg.netMessZurueck){ ecNetMessDlg(ecDlg.netMessZurueck); return; } const r=ecDlg&&ecDlg.raumId; if(r) ecRaumDlg(r); else closeOverlays(); return; }
  case "ecStelleOk": { const F=formVals(), W=ecDlg.w, raumId=ecDlg.raumId, neu={art:W.art,fach:W.art==="sd"?+W.fach||1:1,lage:(F.ecLage||"").trim(),skId:F.ecSk||""}; ecLetzterSk=neu.skId;
    if(ecDlg.stelle) Object.assign(g.stellen.find(s=>s.id===ecDlg.stelle),neu);
    else { let ord=Math.max(0,...g.stellen.filter(s=>s.raumId===raumId).map(s=>s.ord||0)); for(let i=0;i<(+W.anz||1);i++) g.stellen.push({id:uid(),raumId,ord:++ord,...neu}); }
    sp(); render(); ecRaumDlg(raumId); return; }
  case "ecStelleDel": { const st=g.stellen.find(s=>s.id===ecDlg.stelle), raumId=ecDlg.raumId; if(st&&!b.dataset.ok&&pr.werte&&Object.keys(pr.werte).some(k=>k.startsWith(st.id+"."))){ b.dataset.ok="1"; b.textContent="Mit Messwerten löschen"; return; }
    g.stellen=g.stellen.filter(s=>s.id!==ecDlg.stelle); sp(); render(); ecRaumDlg(raumId); return; }
  case "ecOrd": { const st=g.stellen.find(s=>s.id===b.dataset.id); if(!st) return; const S=g.stellen.filter(s=>s.raumId===st.raumId).sort((x,y)=>(x.ord||0)-(y.ord||0)), i=S.indexOf(st), j=i+(+b.dataset.d); if(j<0||j>=S.length) return;
    [S[i],S[j]]=[S[j],S[i]]; S.forEach((s,k)=>s.ord=k+1); sp(); render(); ecRaumDlg(st.raumId); return; }
  /* Verteiler, RCDs, Stromkreise */
  case "ecVtNeu": case "ecVtEdit": { if(!nichtZu()) return; const v=a==="ecVtEdit"&&g.verteiler.find(x=>x.id===b.dataset.id); ecDlg={vt:v?v.id:null};
    ecNameDlg(v?"Verteiler bearbeiten":"Neuer Verteiler",v?v.name:"","ecVtOk",v?"ecVtDel":null,sf("ecVtRaum","Raum",v?v.raumId||"":"",[["","ohne Raum"],...ecRaeume(g).map(r=>[r.id,r.titel])],{form:true}));
    if(!v){ const i=document.getElementById("f_ecName"); if(i&&!g.verteiler.length){ i.value="Hauptverteiler"; i.parentElement.classList.add("fl"); } } return; }
  case "ecVtOk": { const F=formVals(), n=(F.ecName||"").trim(); if(!n){ toast("Bitte eine Bezeichnung eingeben"); return; } if(ecDlg.vt){ const v=g.verteiler.find(x=>x.id===ecDlg.vt); v.name=n; v.raumId=F.ecVtRaum||""; } else g.verteiler.push({id:uid(),name:n,raumId:F.ecVtRaum||""}); sp(); closeOverlays(); render(); return; }
  case "ecVtDel": { if(g.stromkreise.some(s=>s.vId===ecDlg.vt)){ toast("Am Verteiler hängen noch Stromkreise"); return; } g.verteiler=g.verteiler.filter(x=>x.id!==ecDlg.vt); g.rcds=g.rcds.filter(r=>r.vId!==ecDlg.vt); sp(); closeOverlays(); render(); return; }
  case "ecRcdNeu": if(!nichtZu()) return; ecRcdDlg(null,b.dataset.v); return;
  case "ecRcdEdit": if(!nichtZu()) return; ecRcdDlg(g.rcds.find(r=>r.id===b.dataset.id)); return;
  case "ecRcdEditAusMess": { ecWerteLesen(); if(!nichtZu()) return; ecRcdDlg(g.rcds.find(r=>r.id===b.dataset.id)); return; }
  case "ecRcdOk": { const F=formVals(), W=ecDlg.w, neu={nr:(F.rcdNr||"").trim()||"1",typ:W.typ||"",idn:W.idn||"",in:W.in||"",fils:W.bauart==="fils"};
    if(ecDlg.rcd) Object.assign(g.rcds.find(r=>r.id===ecDlg.rcd),neu); else g.rcds.push({id:uid(),vId:ecDlg.vId,...neu}); sp(); closeOverlays(); render(); return; }
  case "ecRcdDel": { if(g.stromkreise.some(s=>s.rcdId===ecDlg.rcd)){ toast("Am RCD hängen noch Stromkreise – erst dort „kein RCD“ wählen"); return; } g.rcds=g.rcds.filter(r=>r.id!==ecDlg.rcd); sp(); closeOverlays(); render(); return; }
  case "ecSkNeu": if(!nichtZu()) return; ecSkDlg(null,b.dataset.v); return;
  case "ecSkEdit": if(!nichtZu()) return; ecSkDlg(g.stromkreise.find(s=>s.id===b.dataset.id)); return;
  case "ecSkEditAusMess": { ecWerteLesen(); if(!nichtZu()) return; const sk=g.stromkreise.find(s=>s.id===b.dataset.id); if(sk) ecSkDlg(sk); return; }
  case "ecSkOk": { const F=formVals(); if(!F.skNr&&!F.skBez){ toast("Bitte Nummer oder Bezeichnung eingeben"); return; }
    const neu={vId:F.skV||"",nr:F.skNr,bez:F.skBez,schutz:(F.skSchutz||"").toUpperCase().replace(/\s+/g,""),rcdId:F.skRcd||"",leitung:F.skLeitung};
    if(ecDlg.sk) Object.assign(g.stromkreise.find(s=>s.id===ecDlg.sk),neu); else g.stromkreise.push({id:uid(),...neu}); sp(); closeOverlays(); render(); return; }
  case "ecSkDel": { const n=g.stellen.filter(s=>s.skId===ecDlg.sk).length; if(n&&!b.dataset.ok){ b.dataset.ok="1"; b.textContent=`Löschen (${n} Punkt${n>1?"e":""} werden „offen“)`; return; }
    g.stellen.forEach(s=>{ if(s.skId===ecDlg.sk) s.skId=""; }); g.stromkreise=g.stromkreise.filter(s=>s.id!==ecDlg.sk); sp(); closeOverlays(); render(); return; }
  /* Messen */
  case "ecMess": ecMessDlg(b.dataset.id); return;
  case "ecRcdMess": ecRcdMessDlg(b.dataset.id); return;
  case "ecRaumMess": ecWerteLesen(); ecRaumMessDlg(b.dataset.id); return;
  case "ecRaumGeh": { ecWerteLesen(); render(); if(b.dataset.id) ecRaumMessDlg(b.dataset.id); else { closeOverlays(); ecDlg=null; } return; }
  case "ecMwSetz": { const i=document.querySelector(b.dataset.z?`#dlg [data-z="${b.dataset.z}"][data-k="${b.dataset.k}"]`:`#dlg [data-mw="${b.dataset.k}"]`); if(i){ i.value=b.dataset.v; i.dispatchEvent(new Event("input",{bubbles:true})); } return; }
  case "ecNg": { const an2=b.getAttribute("aria-pressed")!=="true", z=document.getElementById("ecNgZeile"), m=document.getElementById("ecMessTeil"); b.setAttribute("aria-pressed",String(an2));
    if(z) z.hidden=!an2; if(m) m.hidden=an2; const i=document.getElementById("m_ng"); if(i){ if(an2) setTimeout(()=>i.focus(),30); else i.value=""; } return; }
  case "ecMessGeh": { ecWerteLesen(); if(ecDlg&&ecDlg.mess){ const L=ecSkListe(g).filter(s=>ecImUmfang(pr,s)), i=L.findIndex(s=>s.id===ecDlg.mess), d=+b.dataset.d; if(d&&L[i+d]){ render(); ecMessDlg(L[i+d].id); return; } }
    closeOverlays(); ecDlg=null; render(); return; }
  case "ecSicht": { if(!nichtZu()) return; pr.sicht=Object.assign({},pr.sicht||{}); const k=b.dataset.k; pr.sicht[k]=pr.sicht[k]===b.dataset.v?undefined:b.dataset.v; if(!pr.sicht[k]) delete pr.sicht[k]; if(pr.status==="offen") pr.status="laeuft"; saveRec("echecks",pr); render(); return; }
  case "ecSichtAlle": { if(!nichtZu()) return; pr.sicht=Object.assign({},pr.sicht||{}); EC_SICHT.forEach((_,i)=>{ if(!pr.sicht["s"+i]) pr.sicht["s"+i]="ok"; }); saveRec("echecks",pr); render(); return; }
  case "ecNetz": { if(!nichtZu()) return; pr.netz=Object.assign({},pr.netz||{},{form:b.dataset.v,formGesetzt:true}); saveRec("echecks",pr); render(); return; }
  case "ecFrist": { if(!nichtZu()) return; pr.fristM=+b.dataset.v; saveRec("echecks",pr); render(); return; }
  case "ecImport": if(!nichtZu()) return; ecImportStart(); return;
  case "ecImportOk": ecImportOk(); return;
  case "ecMaengelAuto": { if(!nichtZu()) return; const t=ecMaengelText(pr); if(!t){ toast("Keine Mängel gefunden"); return; } pr.maengel=[pr.maengel,t].filter(Boolean).join(pr.maengel?"\n":""); saveRec("echecks",pr); render(); return; }
  case "ecFertig": { const F=ecFehlt(pr); if(F.length){ toast(`Noch offen: ${F.join(", ")}`); return; }
    pr.status="fertig"; pr.fertigAm=ecHeute(); if(pr.art==="geraete") ecGeraeteAm(pr.ortId).forEach(bm=>{ const st=ecGerStand(pr,bm); if(st==="ok"||st==="bad"){ bm.zuletzt=pr.datum; bm.naechste=ecPlus(pr.datum,pr.fristM||12); bm.erg=st; saveRec("betriebsmittel",bm); } });
    saveRec("echecks",pr); render(); toast("Prüfung abgeschlossen","PDF erstellen",()=>ecPdfAblegen(DB.echecks.get(pr.id))); return; }
  case "ecAuf": pr.status="laeuft"; delete pr.fertigAm; saveRec("echecks",pr); render(); return;
  case "ecPdf": ecPdfAblegen(pr); return;
  case "ecDelAsk": confirmDlg("Prüfung löschen?","Die Prüfung wird in allen Apps entfernt. Gebäude, Räume, Stromkreise und Geräte bleiben erhalten.","Löschen","ecDel"); return;
  case "ecDel": { closeOverlays(); if(!canEdit(pr)) return; pr.deleted=true; saveRec("echecks",pr); go({v:ecListeV(pr.art)}); toast("Prüfung gelöscht"); return; }
  /* Geräte */
  case "ecBmNeu": if(!nichtZu()) return; ecBmDlg(null); return;
  case "ecBmEditAusPr": { ecGerLesen(); const bm=DB.betriebsmittel.get(b.dataset.id); closeOverlays(); if(bm) ecBmDlg(bm); return; }
  case "bmSk": { b.parentElement.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x===b))); return; }
  case "ecBmOk": { const F=formVals(), sk=(document.querySelector('#dlg [data-act="bmSk"][aria-pressed="true"]')||{dataset:{v:"I"}}).dataset.v; if(!F.bmBez){ toast("Bitte eine Bezeichnung eingeben"); return; }
    const o=ecOrt(pr.ortId), neu={bez:F.bmBez,typ:F.bmTyp,sn:F.bmSn,inv:F.bmInv,raum:F.bmRaum,sk};
    if(ecDlg.bm){ const bm=DB.betriebsmittel.get(ecDlg.bm); Object.assign(bm,neu); saveRec("betriebsmittel",bm); } else saveRec("betriebsmittel",{id:uid(),ortId:pr.ortId,kundeId:o.kunde?o.kunde.id:"",...neu},true);
    closeOverlays(); render(); return; }
  case "ecBmDel": { const bm=DB.betriebsmittel.get(ecDlg.bm); if(bm){ bm.deleted=true; saveRec("betriebsmittel",bm); } closeOverlays(); render(); return; }
  case "ecGer": ecGerDlg(b.dataset.id); return;
  /* Schrankplaner */
  case "ecRkAuf": nav.schr=b.dataset.id; closeOverlays(); render(); scrollTo(0,0); return;
  case "ecRkZu": nav.schr=null; render(); scrollTo(0,0); return;
  case "ecRkGriff": return;
  case "ecRkNeu": case "ecRkLeer": { if(!nichtZu()) return; const s2=g.schraenke.find(x=>x.id===nav.schr); if(!s2) return; const r=ecRkNeuZ(s2,b.dataset.t||"patch",b.dataset.pos);
    if(!r.platz){ toast("Kein Platz mehr frei – Schrank größer wählen oder etwas entfernen"); return; } ecRkDlg(r.z); return; }
  case "ecRkTeil": { if(!nichtZu()) return; const s2=g.schraenke.find(x=>x.id===nav.schr), t=s2&&ecSchrTeile(s2).find(x=>x.id===b.dataset.id); if(t) ecRkDlg({...t}); return; }
  case "ecRkPort": { if(!nichtZu()) return; ecDoseDlg(b.dataset.id); if(ecDlg) ecDlg.ausRack=true; return; }
  case "ecRkOk": { const s2=g.schraenke.find(x=>x.id===nav.schr); if(!s2||!ecDlg||!ecDlg.rk) return; ecRkLesen(); const z=ecDlg.rk;
    if(!ecRkFrei(s2,z.pos,z.he,z.id)){ toast(`Ab HE ${z.pos} ist nicht genug Platz für ${z.he} HE`); return; }
    if(z.typ==="patch"){ if(!(z.nr>0)){ toast("Bitte eine Patchfeld-Nummer angeben"); return; } if(ecPfListe(s2).some(x=>x.nr===z.nr&&x.id!==z.id)){ toast(`Patchfeld ${z.nr} gibt es schon`); return; } }
    const t={id:z.id||uid(),typ:z.typ,pos:z.pos,he:z.he}; if(z.name) t.name=z.name; if(z.typ==="patch"||z.typ==="switch") t.ports=z.ports||24; if(z.typ==="patch") t.nr=z.nr; if(z.typ==="switch"&&z.poe) t.poe=true; if(z.tiefe&&z.typ!=="patch") t.tiefe=z.tiefe;
    const L=ecSchrTeile(s2).filter(x=>x.id!==t.id); s2.teile=[...L,t].sort((a2,b2)=>a2.pos-b2.pos); sp(); closeOverlays(); render(); return; }
  case "ecRkDel": { const s2=g.schraenke.find(x=>x.id===nav.schr); if(!s2||!ecDlg||!ecDlg.rk) return; const z=ecDlg.rk;
    if(z.typ==="patch"&&!b.dataset.ok){ const n=[...ecRkLinks(g,s2).M.keys()].filter(k=>ecPpTeile(k).pf===z.nr).length; if(n){ b.dataset.ok="1"; b.textContent=`Trotzdem entfernen (${n} Port${n>1?"s":""} belegt)`; return; } }
    s2.teile=ecSchrTeile(s2).filter(x=>x.id!==z.id); sp(); closeOverlays(); render(); return; }
  /* Netzwerk */
  case "ecUmfangS": { if(!nichtZu()) return; const alle=g.schraenke.map(s=>s.id); let L=pr.umfang&&pr.umfang.sIds?[...pr.umfang.sIds]:[...alle];
    L=L.includes(b.dataset.id)?L.filter(x=>x!==b.dataset.id):[...L,b.dataset.id]; if(!L.length){ toast("Mindestens ein Schrank gehört zur Prüfung"); return; }
    pr.umfang=alle.every(x=>L.includes(x))?null:{sIds:L}; saveRec("echecks",pr); render(); return; }
  case "ecSchrNeu": case "ecSchrEdit": { if(!nichtZu()) return; const s2=a==="ecSchrEdit"&&g.schraenke.find(x=>x.id===b.dataset.id);
    ecDlg={schr:s2?s2.id:null,geplant:!!(s2&&Array.isArray(s2.teile)),w:{name:s2?s2.name:(g.schraenke.length?"":"Netzwerkschrank"),raumId:s2?s2.raumId||"":"",pfAnz:String(ecSchrPf(s2)),pfPorts:String(ecSchrPorts(s2)),
      he:String(s2?ecSchrHe(s2):12),bauart:s2&&s2.bauart||"wand",breite:String(s2?ecSchrBreite(s2):600),tiefe:String(s2?ecSchrTiefe(s2):450),farbe:s2&&s2.farbe||"auto"}}; ecSchrDlg(); return; }
  case "ecSchrOk": { ecSchrLesen(); const W=ecDlg.w, n=(W.name||"").trim(); if(!n){ toast("Bitte eine Bezeichnung eingeben"); return; } const he=+W.he||12;
    const daten={name:n,raumId:W.raumId||"",he,bauart:W.bauart,breite:+W.breite||600,tiefe:+W.tiefe||450,farbe:W.farbe||"auto"};
    if(ecDlg.schr){ const s2=g.schraenke.find(x=>x.id===ecDlg.schr);
      if(Array.isArray(s2.teile)&&s2.teile.some(t=>t.pos+t.he-1>he)){ toast(`Bei ${he} HE passt die geplante Bestückung nicht mehr – erst Teile nach oben schieben oder entfernen`); return; }
      Object.assign(s2,daten); if(!Array.isArray(s2.teile)){ s2.pf=+W.pfAnz||1; s2.ports=+W.pfPorts||24; } }
    else { const s2={id:uid(),...daten,pf:+W.pfAnz||1,ports:+W.pfPorts||24}; g.schraenke.push(s2); ecLetzterSchr=s2.id; } sp(); closeOverlays(); render(); return; }
  case "ecSchrDel": { const n=g.dosen.filter(d=>d.sId===ecDlg.schr).length; if(n&&!b.dataset.ok){ b.dataset.ok="1"; b.textContent=`Löschen (${n} Dose${n>1?"n":""} ohne Schrank)`; return; }
    g.dosen.forEach(d=>{ if(d.sId===ecDlg.schr) d.sId=""; }); g.schraenke=g.schraenke.filter(x=>x.id!==ecDlg.schr); sp(); closeOverlays(); render(); return; }
  case "ecDoseNeu": if(!nichtZu()) return; ecDoseDlg(null,b.dataset.id); return;
  case "ecDose": if(!nichtZu()) return; ecDoseDlg(b.dataset.id); return;
  case "ecDoseAusMess": { ecNetLesen(); if(!nichtZu()) return; const zur=ecDlg&&ecDlg.netMess; ecDoseDlg(b.dataset.id); ecDlg.netMessZurueck=zur; return; }
  case "ecDoseOk": { const F=formVals(), W=ecDlg.w, raumId=ecDlg.raumId, n=+W.ports||1, anz=ecDlg.dose?1:(+W.anz||1), pp1=[1,2,3,4].map(i=>(F["pp"+i]||"").trim());
    const nurErster=pp1[0]&&!pp1.slice(1,n).some(Boolean), basis={ports:n,lage:(F.ecLage||"").trim(),sId:F.ecSchr||""}; ecLetzterSchr=basis.sId;
    const ppFuer=k=>{ const o={}; for(let i=1;i<=n;i++){ const v=nurErster?(k===0&&i===1?pp1[0]:ecPpPlus(pp1[0],k*n+i-1)):(k===0?pp1[i-1]:ecPpPlus(pp1[i-1],k*n)); if(v) o[i]=v; } return o; };
    if(ecDlg.dose) Object.assign(g.dosen.find(d=>d.id===ecDlg.dose),basis,{pp:ppFuer(0)});
    else { let ord=Math.max(0,...g.dosen.filter(d=>d.raumId===raumId).map(d=>d.ord||0)); for(let k=0;k<anz;k++) g.dosen.push({id:uid(),raumId,ord:++ord,...basis,pp:ppFuer(k)}); }
    ecLetzterPf=+W.pf||1;
    const N=new Map(); g.dosen.filter(d=>d.sId&&d.sId===basis.sId).forEach(d=>Object.values(d.pp||{}).forEach(t=>{ const k=String(t).trim(); if(k) N.set(k,(N.get(k)||0)+1); })); const dop=[...N].filter(x=>x[1]>1).map(x=>x[0]);
    const ausRack=ecDlg&&ecDlg.ausRack; sp(); render(); if(ausRack) closeOverlays(); else if(ecDlg&&ecDlg.netMessZurueck) ecNetMessDlg(ecDlg.netMessZurueck); else ecNetRaumDlg(raumId);
    if(dop.length) toast(`Achtung: Port ${dop.join(", ")} ist im Schrank doppelt vergeben`); return; }
  case "ecDoseDel": { const d=g.dosen.find(x=>x.id===ecDlg.dose), raumId=ecDlg.raumId; if(d&&!b.dataset.ok&&pr.werte&&Object.keys(pr.werte).some(k=>k.startsWith(d.id+"."))){ b.dataset.ok="1"; b.textContent="Mit Messwerten löschen"; return; }
    const ausRack=ecDlg.ausRack; g.dosen=g.dosen.filter(x=>x.id!==ecDlg.dose); sp(); render(); if(ausRack) closeOverlays(); else ecNetRaumDlg(raumId); return; }
  case "ecDoseOrd": { const d=g.dosen.find(x=>x.id===b.dataset.id); if(!d) return; const D=g.dosen.filter(x=>x.raumId===d.raumId).sort((x,y)=>(x.ord||0)-(y.ord||0)), i=D.indexOf(d), j=i+(+b.dataset.d); if(j<0||j>=D.length) return;
    [D[i],D[j]]=[D[j],D[i]]; D.forEach((x,k)=>x.ord=k+1); sp(); render(); ecNetRaumDlg(d.raumId); return; }
  case "ecNetMess": ecNetMessDlg(b.dataset.id); return;
  case "ecNetTri": { b.parentElement.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x===b&&x.getAttribute("aria-pressed")!=="true"))); return; }
  case "ecNetAlleOk": { document.querySelectorAll('#dlg [data-act="ecNetTri"]').forEach(x=>{ if(x.dataset.k!=="poe") x.setAttribute("aria-pressed",String(x.dataset.v==="ok")); });
    if(ecDlg&&ecDlg.wm){ const z=ecDlg.wm; z.m=ecWmGerade(); z.sel=null; if(z.s==="offen") z.s=ecWmSchirmStd(pr); ecWmNeu(pr); } return; }
  case "ecWmPin": { if(zu||!ecDlg||!ecDlg.wm) return; const z=ecDlg.wm, p=+b.dataset.p, zeich=()=>{ const el=document.getElementById("ecWm"); if(el) el.innerHTML=ecWmBereich(pr); };
    if(b.dataset.s==="l"){ z.sel=z.sel===p?null:p; zeich(); return; }
    if(!z.sel){ const l=z.m.findIndex(x=>x===p); z.sel=l>=0?l+1:null; zeich(); return; }
    const i=z.sel-1, alt=z.m[i], r=z.m.findIndex((x,j)=>x===p&&j!==i); if(r>=0) z.m[r]=alt; z.m[i]=p; z.sel=null; ecWmNeu(pr); return; }
  case "ecWmSetz": { const z=ecDlg&&ecDlg.wm; if(!z||!z.sel) return; const i=z.sel-1, v=b.dataset.v;
    if(v==="g"){ const alt=z.m[i], r=z.m.findIndex((x,j)=>x===i+1&&j!==i); if(r>=0) z.m[r]=alt; z.m[i]=i+1; } else z.m[i]=v==="k"?"k":0; z.sel=null; ecWmNeu(pr); return; }
  case "ecWmVorlage": { const z=ecDlg&&ecDlg.wm; if(!z) return; z.m=ecWmLesen(b.dataset.v); z.sel=null; ecWmNeu(pr); return; }
  case "ecWmSchirm": { const z=ecDlg&&ecDlg.wm; if(!z) return; z.s=b.dataset.v; ecWmNeu(pr); return; }
  case "ecBelegStd": { if(!nichtZu()) return; pr.belegung=b.dataset.v; saveRec("echecks",pr); render(); return; }
  case "ecSchirmStd": { if(!nichtZu()) return; pr.schirm=b.dataset.v; saveRec("echecks",pr); render(); return; }
  case "ecNetGeh": { ecNetLesen(); const L=ecNetListe(pr,g), i=L.findIndex(p=>p.id===(ecDlg&&ecDlg.netMess)), d=+b.dataset.d; if(d&&L[i+d]){ render(); ecNetMessDlg(L[i+d].id); return; } closeOverlays(); ecDlg=null; render(); return; }
  case "ecGerTri": { b.parentElement.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x===b&&x.getAttribute("aria-pressed")!=="true"))); return; }
  case "ecGerGeh": { ecGerLesen(); const B=ecGeraeteAm(pr.ortId), i=B.findIndex(x=>x.id===ecDlg.ger), d=+b.dataset.d; if(d&&B[i+d]){ render(); ecGerDlg(B[i+d].id); return; } closeOverlays(); ecDlg=null; render(); return; }
  }
},true);
