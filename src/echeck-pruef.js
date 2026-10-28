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
const ecMgDaten=m=>({mess:[m.hersteller,m.modell].filter(Boolean).join(" ")||"Messgerät",kurz:m.kurz||"",sn:m.sn||"",snR:m.snR||"",kal:m.kal||"",mgId:m.id});
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
/* ---- M3-Liste: ein Baustein für alle Listen ----
   lead: Inhalt der runden Fläche links (Symbol, Kurztext) · ton: ok|bad|wip|open|tipp färbt die Fläche · kopf/text: Überschrift und Zusatzzeile · rechts: Wert/Status rechts
   act/id: macht die Zeile antippbar (Pfeil rechts nur, wenn nichts anderes rechts steht) */
const ecLi=o=>{ const tap=!!o.act;
  return `<div class="m3-li${tap?" tap":""}"${tap?` role="button" tabindex="0" data-act="${o.act}"${o.id!=null?` data-id="${esc(o.id)}"`:""}${o.extra||""}`:""}>${o.lead!=null?`<span class="m3-lead${o.ton?" "+o.ton:""}${o.breit?" breit":""}">${o.lead}</span>`:""}<span class="m3-t"><span class="m3-h">${o.kopf}</span>${o.text?`<span class="m3-s">${o.text}</span>`:""}</span>${o.rechts!=null?`<span class="m3-r">${o.rechts}</span>`:tap?icon("chev"):""}</div>`; };
const ecListe=Z=>`<div class="m3-list">${Z.join("")}</div>`;
/* Status als farbiger Text rechts (statt Pille) */
const ecSt=st=>{ const x=EC_PILL[st]||EC_PILL.open; return `<span class="m3-st ${x[0]}">${esc(st==="ng"?"n. gem.":x[1])}</span>`; };

/* ---- Listen ---- */
function ecItem(pr){ const o=ecOrt(pr.ortId), erg=ecErgebnis(pr), fertig=pr.status==="fertig";
  return `<div class="li" role="button" tabindex="0" data-act="ecOeffnen" data-id="${esc(pr.id)}" data-ctx="ecPrCtx"><span class="av">${icon(pr.art==="geraete"?"ecStecker":pr.art==="netz"?"ecNetz":"home")}</span>
    <span class="lt"><span class="h">${esc(o.titel)}</span><span class="s">${esc([ecDatum(pr.datum),pr.pruefart,pr.bez,o.standort?"":o.name,pr.pruefer].filter(Boolean).join(" · "))}</span>
    <span class="st">${fertig?pill(erg==="bad"?"bad":"ok",erg==="bad"?"Mängel":"abgeschlossen"):pill("wip","in Arbeit")}</span></span>${icon("chev")}</div>`; }
/* Prüfungslisten: Suchleiste und Filter wie bei den Kunden (filter.js), Rechtsklick/lange drücken = löschen */
const EC_LISTE_ART={anlagen:"anlage",geraete:"geraete",netzwerk:"netz"};
["anlage","geraete","netz"].forEach(art=>{ FDEF["ec_"+art]={std:{sort:"neu",status:"alle",wer:"alle"},sort:[["neu","Neueste zuerst"],["alt","Älteste zuerst"],["az","Ort A–Z"]],
  gruppen:[{k:"status",t:"Status",opts:[["alle","Alle"],["arbeit","In Arbeit"],["fertig","Abgeschlossen"],["maengel","Mit Mängeln"]]},{k:"wer",t:"Prüfer",opts:[["alle","Alle"],["meine","Meine"]]}],
  liste:()=>ecListeInhalt(art)}; });
/* Installation: Verteilerlegenden stehen mit in der Liste – Filter nach Art und „Ohne Kunde“ */
Object.assign(FDEF.ec_anlage.std,{typ:"alle",kunde:"alle"});
FDEF.ec_anlage.gruppen.unshift({k:"typ",t:"Art",opts:[["alle","Alle"],["pruef","Prüfungen"],["leg","Verteiler und Legenden"]]});
FDEF.ec_anlage.gruppen.push({k:"kunde",t:"Kunde",opts:[["alle","Alle"],["ohne","Ohne Kunde"]]});
function ecListeInhalt(art){ const n="ec_"+art, q=query.trim().toLowerCase(), H=v=>String(v||"").toLowerCase().includes(q), st=fW(n,"status"), wer=fW(n,"wer"), so=fW(n,"sort");
  let L=ecAlle().filter(p=>(p.art||"anlage")===art);
  const mitLeg=art==="anlage"&&typeof legAlle==="function";
  if(mitLeg){ const typ=fW(n,"typ"); if(typ==="leg") L=[]; if(typ!=="pruef") L=L.concat(legListenAlle()); if(fW(n,"kunde")==="ohne") L=L.filter(p=>!kundeOf(p.kundeId)); }
  if(q) L=L.filter(p=>{ if(p.leg) return [p.leg.titel,p.leg.kunde,p.leg.anschrift,p.leg.ersteller,"Verteilerlegende",ecDatum(p.datum)].some(H); if(p.vt) return H(p.such)||H(ecDatum(p.datum)); const o=ecOrt(p.ortId); return H(o.titel)||H(o.name)||H(p.bez)||H(p.pruefer)||H(p.pruefart)||H(p.auftragsnr)||H(ecDatum(p.datum)); });
  if(st==="arbeit") L=L.filter(p=>p.status!=="fertig"); else if(st==="fertig") L=L.filter(p=>p.status==="fertig"); else if(st==="maengel") L=L.filter(p=>!p.leg&&!p.vt&&ecErgebnis(p)==="bad");
  if(wer==="meine") L=L.filter(p=>p.pruefer===who().name||(p.createdBy&&p.createdBy.mail===ME.mail));
  const tit=p=>p.leg?p.titel:ecOrt(p.ortId).titel, item=p=>p.leg?legListenItem(p.leg):p.vt?vtListenItem(p.vt):ecItem(p), [ein,mehr]=mitLeg?["Eintrag","Einträge"]:["Prüfung","Prüfungen"];
  const dt=(a,b)=>String(b.datum||"").localeCompare(String(a.datum||""))||(b.updated||0)-(a.updated||0);
  L.sort(so==="alt"?(a,b)=>dt(b,a):so==="az"?(a,b)=>tit(a).localeCompare(tit(b),"de"):dt);
  const auf=L.filter(p=>p.status!=="fertig"), fertig=L.filter(p=>p.status==="fertig");
  if(!L.length) return `${fInfo(n,0,ein,mehr)}<p class="meta">${mitLeg?"Nichts gefunden.":"Keine Prüfung gefunden."}</p>`;
  const hint=`<p class="hint">Rechtsklick oder lange drücken: anpinnen oder löschen</p>`;
  if(!q&&!fAktiv(n)&&L.length>EC_KURZ&&!ecListeAlle[n]){ const P=ecPins(), pin=P.map(id=>L.find(p=>p.id===id)).filter(Boolean).slice(0,EC_KURZ);
    const rest=L.filter(p=>!pin.includes(p)).sort((a,b)=>(b.updated||0)-(a.updated||0)||String(b.datum||"").localeCompare(String(a.datum||""))).slice(0,EC_KURZ-pin.length);
    const alle=`<button class="btn-text" data-act="ecListeAlle" data-n="${n}">Alle ${L.length}</button>`;
    return (pin.length?`<div class="sec-row"><div class="sec-lbl">Angepinnt</div>${rest.length?"":alle}</div>${listOf(pin.map(item))}`:"")
      +(rest.length?`<div class="sec-row"><div class="sec-lbl">Zuletzt bearbeitet</div>${alle}</div>${listOf(rest.map(item))}`:"")+hint; }
  const zu=!q&&!fAktiv(n)&&L.length>EC_KURZ?`<button class="btn-text" data-act="ecListeAlle" data-n="${n}">Nur die letzten ${EC_KURZ}</button>`:"";
  return `${fInfo(n,L.length,ein,mehr)}${auf.length?`<div class="sec-row"><div class="sec-lbl">In Arbeit</div>${zu}</div>${listOf(auf.map(item))}`:""}${fertig.length?`<div class="sec-row"><div class="sec-lbl">Abgeschlossen</div>${auf.length?"":zu}</div>${listOf(fertig.map(item))}`:""}${hint}`; }
/* Angepinnte Prüfungen (je Gerät, wie die Pins in EVSE); Kurzliste zeigt höchstens 5 */
const EC_KURZ=5, ecListeAlle={};
const ecPins=()=>Array.isArray(META.ecPins)?META.ecPins:[];
function ecPinUm(id){ const P=[...ecPins()], i=P.indexOf(id); if(i>=0) P.splice(i,1); else P.unshift(id); META.ecPins=P; metaSave(); render(); toast(i<0?"Angepinnt – steht oben in der Liste":"Nicht mehr angepinnt"); }
function ecListeView(art){
  const L=ecAlle().filter(p=>(p.art||"anlage")===art).concat(art==="anlage"&&typeof legListenAlle==="function"?legListenAlle():[]); let h=`<div class="narrow">`;
  if(art==="geraete"){ const bis=ecPlus(ecHeute(),1), F=live("betriebsmittel").filter(b=>b.naechste&&b.naechste<=bis).sort((a,b)=>a.naechste.localeCompare(b.naechste));
    if(F.length){ const M=new Map(); F.forEach(b=>{ if(!M.has(b.ortId)) M.set(b.ortId,[]); M.get(b.ortId).push(b); });
      h+=`<div class="sec-lbl">Fällig in den nächsten 4 Wochen</div>${listOf([...M].map(([o,G])=>`<div class="li" role="button" tabindex="0" data-act="ecNeuOrt" data-art="geraete" data-ort="${esc(o)}"><span class="av">${icon("warn")}</span>
        <span class="lt"><span class="h">${esc(ecOrt(o).titel)}</span><span class="s">${G.length} Gerät${G.length>1?"e":""} · ab ${esc(ecDatum(G[0].naechste))}</span></span>${pill(G[0].naechste<ecHeute()?"bad":"wip",G[0].naechste<ecHeute()?"überfällig":"bald fällig")}</div>`))}`; } }
  if(!L.length&&art==="netz") return h+`<div class="empty">${icon("ecNetz")}<h2>Noch keine Netzwerkprüfung</h2><p>Datenverkabelung qualifizieren (z. B. mit dem SignalTEK NT): Netzwerkschrank und Datendosen anlegen, jeden Link messen – das Protokoll landet in der Bibliothek.</p></div>${ecRkDefs()}${ecKatVorschau()}</div>`;
  if(!L.length) return h+`<div class="empty">${icon(art==="geraete"?"ecStecker":"home")}<h2>${art==="geraete"?"Noch keine Geräteprüfung":"Noch keine Installationsprüfung"}</h2><p>${art==="geraete"
      ?"Ortsveränderliche Geräte (DGUV V3, DIN VDE 0701-0702): Geräte je Kunde erfassen, prüfen, Prüffrist setzen – das Protokoll landet in der Bibliothek."
      :"Hausinstallationen und Anlagen (DIN VDE 0100-600 / 0105-100): Räume, Verteiler, Stromkreise und Steckdosen anlegen, besichtigen, messen – das Protokoll landet in der Bibliothek."}</p></div></div>`;
  return h+`${searchBar("Ort, Kunde, Prüfer oder Datum suchen",fKnopf("ec_"+art))}<div id="res">${ecListeInhalt(art)}</div>${art==="netz"?ecRkDefs()+ecKatVorschau():""}</div>`; }
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
  const mg=MG.find(m=>m.bei&&m.bei===ME.mail)||(zuletzt&&MG.find(m=>m.id===zuletzt.geraet.mgId))||MG.find(m=>/\b(NT|CT)\b/.test(m.modell||""))||MG[0]; /* zugeteilt > zuletzt benutzt > neuerer Tester */
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
  return `<button type="button" class="ec-k ec-kmg" data-act="ecPick" data-w="mg" ${zu?"disabled":""} title="Messgerät wählen">${ecMgBild(M.bild)}<span class="ec-kmg-t"><b>${esc(M.mess?(M.kurz||M.mess):"wählen")}</b><small>${M.mess&&ecNz(pr)&&!M.kal?esc(M.sn?`SN ${M.sn}`:"Messgerät"):M.mess?`<i class="sd ${kal.s==="ok"?"ok":kal.s==="wip"?"wip":"bad"}"></i>${esc(kal.s==="ok"?"kalibriert":kal.s==="wip"?"Kalibrierung läuft ab":"Kalibrierung fehlt")}`:"Messgerät"}</small></span></button>`; }
function ecKennzahlen(pr){ const k=(z,t,bar,rot)=>`<div class="ec-k"><b${rot?' class="rot"':""}>${z}</b><small>${t}</small>${bar!=null?`<span class="ec-bar"><i style="width:${Math.round(bar*100)}%"></i></span>`:""}</div>`;
  if(ecNz(pr)){ const g=ecGeb(pr.ortId), L=ecNetListe(pr,g), st=L.map(p=>ecNetStand(pr,p)), n=st.filter(x=>["ok","bad","ng"].includes(x)).length, m=st.filter(x=>x==="bad").length, D=new Set(L.map(p=>p.d.id)).size;
    return `<div class="ec-kz">${k(`${n} / ${L.length}`,"Links gemessen",L.length?n/L.length:0)}${k(D,`Datendose${D===1?"":"n"}`)}${k(m,"Mängel",null,m>0)}${ecKMg(pr)}</div>`; }
  if(!ecAn(pr)){ const B=ecGeraeteAm(pr.ortId), st=B.map(b=>ecGerStand(pr,b)), n=st.filter(x=>["ok","bad","ng"].includes(x)).length, m=st.filter(x=>x==="bad").length;
    return `<div class="ec-kz">${k(`${n} / ${B.length}`,"Geräte geprüft",B.length?n/B.length:0)}${k(m,"Mängel",null,m>0)}${k(`${pr.fristM||12} Mon.`,"Prüffrist")}${ecKMg(pr)}</div>`; }
  const g=ecGeb(pr.ortId), S=g.stromkreise.filter(x=>ecImUmfang(pr,x)), st=S.map(s=>ecSkStand(pr,g,s)), n=st.filter(x=>["ok","bad","ng"].includes(x)).length;
  const P=ecAllePunkte(g).filter(p=>ecImUmfang(pr,ecSkVon(g,p))&&ecPflicht(p.st)), pn=P.filter(p=>["ok","bad","ng"].includes(ecPunktStand(pr,g,p))).length;
  const m=st.filter(x=>x==="bad").length+Object.values(pr.sicht||{}).filter(v=>v==="nok").length, si=ecSichtZahl(pr);
  return `<div class="ec-kz">${k(`${n} / ${S.length}`,"Stromkreise fertig",S.length?n/S.length:0)}${k(`${pn} / ${P.length}`,"Messpunkte",P.length?pn/P.length:0)}${k(m,"Mängel",null,m>0)}${ecKMg(pr)}</div>`; }
/* zuletzt geöffneter Bereich je Prüfung – beim Öffnen geht es dort weiter (statt immer „Messen“) */
let ecPrWeg="";
const ecTabGemerkt=id=>{ try{ return (JSON.parse(localStorage.getItem("irrgang_ec_tab")||"{}"))[id]||""; }catch(e){ return ""; } };
const ecTabMerken=(id,t)=>{ try{ const m=JSON.parse(localStorage.getItem("irrgang_ec_tab")||"{}"); if(m[id]===t) return; m[id]=t; const k=Object.keys(m); if(k.length>200) delete m[k[0]]; localStorage.setItem("irrgang_ec_tab",JSON.stringify(m)); }catch(e){} };
function ecView(pr){ const tab=ecTab(pr), zu=pr.status==="fertig"; ecTabMerken(pr.id,tab);
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
function ecMgAktuell(pr){ const G=pr.geraet||{}, m=G.mgId&&DB.geraete&&DB.geraete.get(G.mgId); return m&&!m.deleted?{...ecMgDaten(m),bild:m.bild||bildLokal(m.bildUrl)||""}:{...G}; }
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
    ${M.mess?`<div class="ec-mginfo">${ecMgBild(M.bild)}<span>${esc(M.sn?`Seriennummer ${M.sn}${M.snR?` · Gegenstelle ${M.snR}`:""}`:"Seriennummer fehlt")}</span>${nz&&!M.kal?"":pill(kal.s,kal.t)}</div>`:MG.length?"":`<p class="meta" style="margin:10px 4px 0">Noch kein passendes Messgerät – in der Übersicht unter „Messgeräte“ anlegen${nz?" (Einsatz „Netzwerk“)":""}.</p>`}</section>`;
  const sg=(l,act,cur,opts)=>`<div class="ec-sgz"><span class="lbl">${l}</span>${ecZSeg(act,cur,opts,zu)}</div>`;
  const pruef=`<section class="card"><h3>Prüfung</h3><div class="ec-fg">${ecWahlSel(pr,"pruefart","Prüfart",pr.pruefart,EC_PA[pr.art||"anlage"]||EC_PRUEFART)}
      ${nz?`${ecFeld(pr,"kabel","Verkabelung",pr.kabel,{ph:"z. B. Cat 7 Verlegekabel, Cat 6A Module"})}${zu?"":`<div class="chips ec-wahl">${EC_KABEL.map(x=>`<button type="button" class="chip" data-act="ecPickSet" data-w="kabel" data-v="${esc(x)}" aria-pressed="${x===pr.kabel}">${esc(x)}</button>`).join("")}</div>`}
        ${sg("Belegung","ecBelegStd",ecWmStd(pr),[["T568A","T568A"],["T568B","T568B"]])}${sg("Schirm","ecSchirmStd",pr.schirm==="nein"?"nein":"ja",[["ja","geschirmt"],["nein","ungeschirmt"]])}${sg("Verlegekabel","ecVkArt",(g.vk||{}).art||"",[["simplex","Simplex"],["duplex","Duplex"]])}<div class="ec-sgz"><span class="lbl">Mantelfarbe</span><span class="pk-wahl">${ecVkSw("ecVkFarbe",(g.vk||{}).farbe||"",zu)}</span></div>${sg("Beschriftung","ecBeschrSet",ecBeschr(g),EC_BESCHR.map(x=>[x[0],x[1]]))}`
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
    return dialog("Messgerät",MG.length?`<div class="ec-wl">${MG.map(m=>{ const k=ecKal(m.kal); return ecWahlZ("ecPickSet","mg",m.id,ecMgLabel(m),`${esc(m.sn?`SN ${m.sn}`:"Seriennummer fehlt")} ${ecNz(pr)&&!m.kal?"":pill(k.s,k.t)}`,m.id===G.mgId,ecMgBild(m.bild||bildLokal(m.bildUrl),true)); }).join("")}</div>`
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
      <div class="ec-vt-f"><button class="btn-text" data-act="vtAuf" data-g="${esc(g.id)}" data-id="${esc(v.id)}">${icon("ecMess")}Verteiler öffnen</button><span style="flex:1"></span>${pr.status==="fertig"?"":`<button class="btn-text" data-act="ecRcdNeu" data-v="${esc(v.id)}">${icon("add")}RCD</button><button class="btn-text" data-act="ecSkNeu" data-v="${esc(v.id)}">${icon("add")}Stromkreis</button>`}</div></div>`; };
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
function ecRkMini(pr,g,s){ const {M}=ecRkLinks(g,s); return `<div class="rk-bau mini ${ecSchrFarbe(s)}"><div class="rk-geh ${s.bauart==="stand"?"stand":"wand"}"><div class="rk-dach"></div><div class="rk mini" style="--n:${ecSchrHe(s)}"><span class="rk-schiene l"></span><span class="rk-schiene r"></span>${ecSchrTeile(s).map(t=>ecRkTeilHtml(pr,g,s,t,M)).join("")}</div><div class="rk-sockel"></div></div></div>`; }
/* Beschriftungsschema: vor dem Anlegen der Dosen festlegen, gilt für das ganze Gebäude */
function ecBeschrKarte(g,zu){ const b=ecBeschr(g), ohneK=b==="kennung"?g.schraenke.filter(s=>!String(s.kennung||"").trim()):[];
  const info=b==="pp"&&ecSchrMehr(g)?'<span class="rot">Bei mehreren Schränken ist „1.13“ nicht eindeutig – besser ein Schema mit Schrank wählen.</span>'
    :b==="kennung"?(ohneK.length?`<span class="rot">Noch ohne Kennung: ${esc(ohneK.map(s=>s.name).join(", "))} – im Schrank unter „Bearbeiten“ eintragen.</span>`:"Die Kennung trägst du je Schrank unter „Bearbeiten“ ein, z. B. „ZVERT 2.2“.")
    :b==="nr"?"Die Schranknummer steht je Schrank unter „Bearbeiten“.":"Für Anlagen mit einem Schrank.";
  return `<div class="ec-beschr"><div class="lbl">Beschriftung der Ports</div>${ecChips("beschr",EC_BESCHR.map(x=>[x[0],x[1]]),b,zu)}<p class="meta">${esc(EC_BESCHR.find(x=>x[0]===b)[2])} · ${info}</p></div>`; }
function ecInfraView(pr){ const g=ecGeb(pr.ortId), zu=pr.status==="fertig", S=g.schraenke, P=S.map(s=>ecRkPlanung(pr,g,s)); if(!zu&&ecPpNormal(g)) ecGebSpeichern(g);
  const B=P.reduce((a,x)=>a+x.B,0), T=P.reduce((a,x)=>a+x.ports,0), SW=P.reduce((a,x)=>a+x.swPorts,0), bad=P.reduce((a,x)=>a+x.H.filter(h=>h[0]==="bad").length,0), hw=P.reduce((a,x)=>a+x.H.filter(h=>h[0]==="wip").length,0);
  const k=(z,t,bar,rot)=>`<div class="ec-k"><b${rot?' class="rot"':""}>${z}</b><small>${t}</small>${bar!=null?`<span class="ec-bar"><i style="width:${Math.round(bar*100)}%"></i></span>`:""}</div>`;
  const lead=s2=>{ const b=ecBeschr(g); return b==="nr"?String(ecSchrNr(g,s2)):b==="kennung"&&String(s2.kennung||"").trim()?esc(s2.kennung):icon("ecNetz"); };
  const zeile=(s2,PL)=>{ const b2=PL.H.filter(h=>h[0]==="bad").length, h2=PL.H.filter(h=>h[0]==="wip").length, ein=ecNetImUmfang(pr,{sId:s2.id});
    return ecLi({act:"ecRkAuf",id:s2.id,extra:' data-ctx="ecSchrEdit"',lead:lead(s2),breit:ecBeschr(g)==="kennung"&&!!String(s2.kennung||"").trim(),ton:b2?"bad":"",kopf:esc(s2.name),
      text:esc([[`${ecSchrHe(s2)} HE`,s2.bauart==="stand"?"Standschrank":"Wandschrank",ecRaumName(g,s2.raumId)].filter(Boolean).join(" · "),`${PL.B} von ${PL.ports} Ports belegt · ${PL.frei} HE frei${ein?"":" · nicht im Prüfumfang"}`].join("\n")).replace("\n","<br>"),
      rechts:b2?`<span class="m3-st bad">${b2} Problem${b2>1?"e":""}</span>`:h2?`<span class="m3-st wip">${h2} Hinweis${h2>1?"e":""}</span>`:`<span class="m3-st ok">passt</span>`}); };
  const A=ecNetAlle(g), ohne=A.filter(p=>!p.d.sId||!S.some(s=>s.id===p.d.sId));
  return `<div class="ec-kz">${k(S.length,`Netzwerkschr${S.length===1?"ank":"änke"}`)}${k(`${B} / ${T}`,"Patchports belegt",T?B/T:0)}${k(SW,"Switch-Ports")}${k(bad||hw,bad?"Probleme":"Hinweise",null,bad>0)}</div>
    <div class="ec-spalte ec-infra">
    <section class="card"><h3>Internetanschluss</h3>${ecListe(ecAnZeilen(g,zu))}</section>
    <section class="card"><h3>Patchkabel-Farben</h3>${ecListe(ecPkZeilen(g,zu))}</section>
    <section class="card">${karteKopf("Netzwerkschränke",zu?"":"ecSchrNeu","Schrank hinzufügen")}${S.length?ecListe(S.map((s2,i)=>zeile(s2,P[i]))):`<p class="meta">${zu?"Kein Netzwerkschrank angelegt.":"Noch kein Netzwerkschrank – mit + anlegen, z. B. den Hauptschrank im Technikraum."}</p>`}
      ${S.length&&!zu?`<p class="m3-hinweis">Bearbeiten: Rechtsklick, am Handy lange drücken</p>`:""}</section>
    ${ohne.length?`<section class="card"><h3>Datendosen ohne Schrank <span class="m3-neben">${ohne.length} Port${ohne.length>1?"s":""}</span></h3>${ecListe(ohne.map(p=>ecLi({act:"ecDose",id:p.d.id,lead:icon("ecNetz"),ton:"wip",kopf:esc(ecLinkName(g,p)),text:esc([ecDoseName(p.d),p.d.lage].filter(Boolean).join(" · "))})))}</section>`:""}
    ${S.length?`<section class="card"><h3>Etiketten</h3>${ecListe([ecLi({act:"ecEti",id:"",lead:icon("tag"),kopf:"Beschriften mit Brother",text:"Patchfeld-Streifen, Schilder, Dosen und Kabel"})])}</section>`:""}
    </div>
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

/* ---- Netzwerkprüfung (Datenverkabelung, z. B. mit dem Trend Networks SignalTEK NT) ----
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
  D.forEach((d,k)=>{ const n=Math.max(1,+d.ports||1); for(let i=1;i<=n;i++) { const roh=((d.pp||{})[i]||"").trim(); P.push({id:`${d.id}.${i}`,nr:n>1?`${k+1}.${i}`:`${k+1}`,d,i,raumId,ppk:roh,pp:roh?ecPpVoll(g,d.sId,roh):""}); } }); return P; }
const ecNetAlle=g=>ecRaeume(g).flatMap(r=>ecNetPunkte(g,r.id));
/* Reihenfolge beim Messen: je Schrank nach Patchport (so steckt man um), danach Links ohne Schrank in Raumfolge */
function ecNetListe(pr,g){ const A=ecNetAlle(g).filter(p=>ecNetImUmfang(pr,p.d)), L=[];
  [...g.schraenke.map(s=>s.id),""].forEach(sId=>{ const T=A.filter(p=>sId?p.d.sId===sId:(!p.d.sId||!g.schraenke.some(s=>s.id===p.d.sId)));
    if(sId) T.sort((a,b)=>(a.ppk?0:1)-(b.ppk?0:1)||a.ppk.localeCompare(b.ppk,"de",{numeric:true})); L.push(...T); }); return L; }
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
/* Beschriftung Patchfeld.Port (1.13); ab zwei Schränken Schrank.Patchfeld.Port (1.1.13) – sonst gäbe es „1.13“ in jedem Schrank */
const ecPpTeile=t=>{ const m=String(t||"").trim().match(/^P?(\d+)\s*[.\-/]\s*(\d+)(?:\s*[.\-/]\s*(\d+))?$/i); return !m?null:m[3]?{s:+m[1],pf:+m[2],port:+m[3]}:{pf:+m[1],port:+m[2]}; };
const ecSchrMehr=g=>g.schraenke.length>1;
const ecSchrNr=(g,s)=>!s?0:+s.nr>0?+s.nr:g.schraenke.indexOf(s)+1;
/* Beschriftungsschema je Gebäude, vorher festlegen: pp = 1.13 · nr = 1.1.13 (Schranknummer vorn) · kennung = „ZVERT 2.2 1.13“ (Kennung des Schranks vorn) */
const EC_BESCHR=[["pp","1.13","Patchfeld.Port"],["nr","1.1.13","Schranknummer.Patchfeld.Port"],["kennung","Kennung 1.13","Kennung des Schranks + Patchfeld.Port"]];
const ecBeschr=g=>g.beschr||(ecSchrMehr(g)?"nr":"pp");
/* Gespeichert wird an der Dose nur Patchfeld.Port (und der Schrank) – die volle Beschriftung entsteht hier aus dem Schema */
function ecPpVoll(g,sId,roh){ const x=ecPpTeile(roh); if(!x) return String(roh||"").trim(); const sch=sId&&g.schraenke.find(v=>v.id===sId), b=ecBeschr(g), k=`${x.pf}.${x.port}`;
  if(!sch) return k; if(b==="nr") return `${ecSchrNr(g,sch)}.${k}`; if(b==="kennung"&&String(sch.kennung||"").trim()) return `${String(sch.kennung).trim()} ${k}`; return k; }
const ecPpText=(g,sId,pf,port)=>ecPpVoll(g,sId,`${pf}.${port}`);
/* 0.69.0 hat 1.1.13 gespeichert → zurück auf 1.13; Anzahl der Änderungen */
function ecPpNormal(g){ let n=0; g.dosen.forEach(d=>Object.keys(d.pp||{}).forEach(k=>{ const x=ecPpTeile(d.pp[k]); if(x&&x.s){ d.pp[k]=`${x.pf}.${x.port}`; n++; } })); return n; }
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
  dialog(name,D.length?`<div class="list ec-stl">${D.map((d,k)=>{ const n=+d.ports||1, pp=Array.from({length:n},(_,i)=>{ const t=((d.pp||{})[i+1]||"").trim(); return t?ecPpVoll(g,d.sId,t):""; }), s=ecSchrName(g,d.sId);
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
      <div class="ec-pp">${[1,2,3,4].map(i=>`<div data-pp="${i}" ${i>n?"hidden":""} class="ec-pp-z">${tf("pp"+i,`Beschriftung Port ${i} (Dose = Patchfeld)`,pp(i),{form:true,ph:"z. B. 1.13"})}${sf("nz"+i,`Verwendung Port ${i}`,(v.nutz||{})[i]||"",[["","– offen –"],...EC_PK_ZWECK.map(([zw,t])=>{ const f=ecPkFarbe(g,zw); return [zw,f?`${t} · ${f[1]}`:t]; })],{form:true})}</div>`).join("")}</div>
      ${tf("ecLage","Lage (optional)",v.lage||"",{form:true,ph:"z. B. Schreibtisch"})}</div>
    ${ecChips("nlage",EC_NLAGE.map(x=>[x,x]),"")}
    ${(()=>{ const st=ecVk(g,null), o=v.vk||{}; return `<div class="lbl" style="margin-top:14px">Verlegekabel zur Dose</div><input type="hidden" id="f_vkArt" data-f="vkArt" value="${esc(o.art||"")}"><input type="hidden" id="f_vkFarbe" data-f="vkFarbe" value="${esc(o.farbe||"")}">
      <div class="chips ec-wahl">${[["",`wie Standard${st.art?` (${st.art==="duplex"?"Duplex":"Simplex"})`:""}`],["simplex","Simplex"],["duplex","Duplex"]].map(([x,t])=>`<button type="button" class="chip" data-act="ecVkDose" data-k="art" data-v="${x}" aria-pressed="${(o.art||"")===x}">${esc(t)}</button>`).join("")}</div>
      <div class="pk-wahl" style="margin-top:10px">${EC_VK_FARBE.map(([f,t,hex])=>`<button type="button" class="pk-sw${o.farbe===f?" an":""}" data-act="ecVkDose" data-k="farbe" data-v="${f}" style="background:${hex}" title="${esc(t)}" aria-label="Mantel ${esc(t)}"></button>`).join("")}<button type="button" class="pk-sw keine${o.farbe?"":" an"}" data-act="ecVkDose" data-k="farbe" data-v="" title="wie Standard" aria-label="Mantelfarbe wie Standard">–</button></div>
      <p class="meta" style="margin-top:6px">Standard steht unter „Auftrag“ → Prüfung${st.art||st.farbe?`: ${esc(ecVkText(st))}`:" (noch nicht festgelegt)"}. Duplex = zwei Kabel unter einem Mantel, z. B. für eine 2-fach-Dose.</p>`; })()}
    <p class="meta" style="margin-top:8px">${ecBeschr(g)==="pp"?"Beschriftung = Patchfeld.Port, z. B. 1.13 – so steht es auf der Dose und am Keystone im Patchfeld.":`Hier nur Patchfeld.Port eintragen, z. B. 1.13 – den Schrank setzt die App nach eurem Schema davor (${esc(EC_BESCHR.find(x=>x[0]===ecBeschr(g))[1])}).`}${d?"":" Bei mehreren Dosen zählt die App die Ports weiter."}${g.schraenke.length?"":" Netzwerkschränke legst du unter „Gebäude“ rechts an – zuordnen geht auch später."}</p>`,
    `${d?`<button class="btn-text danger" data-act="ecDoseDel">Löschen</button>`:""}<span style="flex:1"></span><button class="btn-text" data-act="ecZumRaum">Abbrechen</button><button class="btn-text" data-act="ecDoseOk">Speichern</button>`,{breit:true}); }
/* Patchfeld + erster Port → Beschriftung der Ports (1.13, 1.14 …) */
function ecPpFuellen(){ if(!ecDlg||!("dose" in ecDlg)) return; const st=document.getElementById("f_ppStart"), z=parseInt(st&&st.value,10), n=+ecDlg.w.ports||1; if(!(z>0)) return;
  for(let i=1;i<=4;i++){ const f=document.getElementById("f_pp"+i); if(!f) continue; f.value=i<=n?`${ecDlg.w.pf||1}.${z+i-1}`:""; f.parentElement.classList.toggle("fl",!!f.value); } }
/* „A01“ → „A02“, „1-12“ → „1-13“; ohne Zahl am Ende bleibt es leer */
const ecPpPlus=(s,k)=>{ const t=ecPpTeile(s); if(t) return `${t.s?t.s+".":""}${t.pf}.${t.port+k}`; const m=String(s||"").match(/^(.*?)(\d+)$/); if(!m) return ""; const z=String(+m[2]+k); return m[1]+(m[2].length>z.length?z.padStart(m[2].length,"0"):z); };

/* ---- Schrankplaner: Netzwerkschrank in Höheneinheiten (HE) bestücken, Patchfelder mit belegten Ports, Prüfung der Planung, Stückliste ----
   Schrank {he, bauart:"wand"|"stand", teile:[{id,typ,pos,he,name,ports,nr,poe}]}; pos = oberste HE des Teils, gezählt von oben (1 = ganz oben).
   Patchfelder tragen eine feste Nummer (nr) – die steht in der Beschriftung der Dosen (1.13) und ändert sich beim Verschieben nicht. */
const EC_RK={patch:"Patchfeld",switch:"Switch",kabel:"Kabelführung",boden:"Fachboden",router:"Router / Firewall",usv:"USV",pdu:"Steckdosenleiste",luefter:"Lüftereinschub",blind:"Blindblende",nas:"NAS / Rekorder",sonst:"Sonstiges"};
const EC_RKSTD={patch:{he:1,ports:24},switch:{he:1,ports:24},kabel:{he:1},boden:{he:1},router:{he:1},usv:{he:2},pdu:{he:1},luefter:{he:1},blind:{he:1},nas:{he:1},sonst:{he:1}};
const EC_RKHE=[6,9,12,15,18,20,22,24,27,32,42,47];
/* Vorauswahl gängiger Schränke: [Bauart, HE, Breite, Tiefe] in mm */
const EC_RKVOR=[["wand",6,600,450],["wand",9,600,450],["wand",12,600,450],["wand",12,600,600],["wand",15,600,600],["wand",18,600,600],["wand",20,600,600],["stand",22,600,800],["stand",27,800,800],["stand",32,800,800],["stand",42,800,800],["stand",42,800,1000],["stand",47,800,1000]];
const EC_RKTIEFEN={wand:[250,300,400,450,500,600],stand:[600,800,1000,1200]};
/* typische Einbautiefe ab Frontschiene in mm – nur fürs Bild, solange keine Tiefe eingetragen ist */
const EC_RKT={patch:120,switch:250,kabel:80,router:220,usv:420,pdu:60,luefter:120,blind:15,nas:450,sonst:200};
const ecSchrTiefe=s=>+(s&&s.tiefe)||(s&&s.bauart==="stand"?800:450), ecSchrBreite=s=>+(s&&s.breite)||600;
const ecSchrNutzbar=s=>Math.max(100,ecSchrTiefe(s)-100); /* Annahme: Tür, Rückwand und Schienenabstand kosten zusammen etwa 100 mm */
const ecRkTiefe=(s,t)=>+t.tiefe||(t.typ==="boden"?ecSchrNutzbar(s):EC_RKT[t.typ]||200);
const ecSchrFarbe=s=>s&&s.farbe==="hell"?"hell":s&&s.farbe==="dunkel"?"dunkel":"auto";
const ecSchrText=s=>[`${ecSchrHe(s)} HE`,s.bauart==="stand"?"Standschrank":"Wandschrank",`${ecSchrBreite(s)} × ${ecSchrTiefe(s)} mm`].join(" · ");
function ecSchrLesen(){ if(!ecDlg||!ecDlg.w) return; const F=formVals(); if(F.ecName!=null) ecDlg.w.name=F.ecName; if(F.ecSNr!=null) ecDlg.w.nr=F.ecSNr; if(F.ecSKenn!=null) ecDlg.w.kennung=F.ecSKenn; if(F.ecVtRaum!=null) ecDlg.w.raumId=F.ecVtRaum; }
function ecSchrDlg(){ const pr=ecPr(), g=ecGeb(pr.ortId), W=ecDlg.w, vor=EC_RKVOR.findIndex(p=>p[0]===W.bauart&&String(p[1])===W.he&&String(p[2])===W.breite&&String(p[3])===W.tiefe);
  const mehr=g.schraenke.length+(ecDlg.schr?0:1)>1;
  dialog(ecDlg.schr?"Netzwerkschrank bearbeiten":"Neuer Netzwerkschrank",`<div class="fg1">${tf("ecName","Bezeichnung",W.name||"",{form:true,ph:"z. B. Netzwerkschrank EG"})}${ecBeschr(g)==="nr"&&mehr?tf("ecSNr","Schranknummer (erste Stelle der Beschriftung)",W.nr||"",{form:true,im:"numeric",ph:"z. B. 1"}):""}${ecBeschr(g)==="kennung"?tf("ecSKenn","Kennung (steht vor Patchfeld.Port)",W.kennung||"",{form:true,ph:"z. B. ZVERT 2.2"}):""}${sf("ecVtRaum","Raum",W.raumId||"",[["","ohne Raum"],...ecRaeume(g).map(r=>[r.id,r.titel])],{form:true})}</div>
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
  ecNetAlle(g).filter(p=>p.d.sId===s.id).forEach(p=>{ const x=ecPpTeile(p.ppk); if(!x){ D.push(p); return; } const k=`${x.pf}.${x.port}`; if(!M.has(k)) M.set(k,[]); M.get(k).push(p); }); return {M,ohne:D}; }
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
  T.filter(t=>t.typ!=="blind").forEach(t=>{ const K=ecRkKat(t.kat); if(K){ const k=`${EC_RK[t.typ]} ${ecRkKatName(K)}, ${K.he} HE – ${ecRkKatNr(K)}`; G.set(k,(G.get(k)||0)+1); return; } const k=[EC_RK[t.typ],t.ports&&(t.typ==="patch"||t.typ==="switch")?`${t.ports} Port`:"",t.poe?"PoE":"",`${t.he} HE`].filter(Boolean).join(", ")+(t.name&&t.typ!=="patch"&&t.name!==EC_RK[t.typ]?` – ${t.name}`:""); G.set(k,(G.get(k)||0)+1); });
  const L=[[1,`${s.bauart==="stand"?"Standschrank":"Wandschrank"} 19", ${ecSchrHe(s)} HE, ${ecSchrBreite(s)} × ${ecSchrTiefe(s)} mm (B × T)`],...[...G].map(([k,n])=>[n,k])], {M}=ecRkLinks(g,s), D=g.dosen.filter(d=>d.sId===s.id), fr=ecSchrHe(s)-T.reduce((a,t)=>a+t.he,0);
  if(M.size){ const KS=new Map(); [...M.keys()].forEach(k=>{ const pf=T.find(t=>t.typ==="patch"&&String(t.nr)===k.split(".")[0]), K=pf&&ecRkKat(pf.kat), n=K&&K.keystone?`Keystone-Module ${K.keystone.name} – Art.-Nr. ${K.keystone.artnr}`:"Keystone-Module (Patchfeld)"; KS.set(n,(KS.get(n)||0)+1); });
    KS.forEach((n,k)=>L.push([n,k]));
    const PK=new Map(); [...M.values()].forEach(Lp=>{ const k=ecPkPort(g,Lp[0].d,Lp[0].i), t=k.f?`Patchkabel ${k.f[1].toLowerCase()} – ${ecPkZweckName(k.zw)}`:"Patchkabel"; PK.set(t,(PK.get(t)||0)+1); });
    [...PK].sort((a,b)=>(a[0]==="Patchkabel")-(b[0]==="Patchkabel")||b[1]-a[1]).forEach(([t,n])=>L.push([n,t])); }
  const DG=new Map(); D.forEach(d=>{ const k=`Datendose ${d.ports||1}-fach`; DG.set(k,(DG.get(k)||0)+1); }); DG.forEach((n,k)=>L.push([n,k]));
  if(fr>0) L.push([fr,"Blindblende 1 HE (für die freien HE)"]); return L; }
/* Patchkabel-Stecker in der Farbe des Schemas (Knickschutz + Rastnase) */
const ecPkStecker=(g,p,x,y,w,h)=>{ const k=ecPkPort(g,p.d,p.i); if(!k.f) return ""; const c=k.f[2];
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1" fill="${c}" stroke="rgba(0,0,0,.35)" stroke-width=".3"/><rect x="${x+w*.3}" y="${y+h*.15}" width="${w*.4}" height="${h*.22}" rx=".4" fill="rgba(255,255,255,.35)"/>`; };
/* Zeichnung */
function ecRackView(pr,s){ const g=ecGeb(pr.ortId), zu=pr.status==="fertig", N=ecSchrHe(s), T=ecSchrTeile(s), {M}=ecRkLinks(g,s), P=ecRkPlanung(pr,g,s), belegt=new Set();
  T.forEach(t=>{ for(let i=t.pos;i<t.pos+t.he;i++) belegt.add(i); });
  const nr=i=>`<span class="rk-he" style="grid-row:${i}">${i}</span><span class="rk-he r" style="grid-row:${i}">${i}</span>`;
  const leer=i=>belegt.has(i)?"":`<button type="button" class="rk-leer" data-act="ecRkLeer" data-pos="${i}" style="grid-row:${i}" ${zu?"disabled":""} aria-label="HE ${i} frei – Teil einsetzen"><span>+</span></button>`;
  const Lk=ecNetListe({},g).filter(p=>p.d.sId===s.id), ST=ecRkStueck(g,s), sym={ok:"",bad:icon("warn"),wip:icon("warn"),tipp:icon("info")};
  const planung=ecListe(P.H.map(([k,t2])=>ecLi({lead:k==="ok"?'<i class="m3-dot"></i>':sym[k],ton:k,kopf:esc(t2)})));
  const stueck=ST.length?ecListe(ST.map(([n,t2])=>{ const [a,...b2]=t2.split(" – "); return ecLi({lead:`${n}×`,breit:true,kopf:esc(a),text:b2.length?esc(b2.join(" – ")):""}); })):`<p class="meta">Noch nichts geplant.</p>`;
  const beleg=Lk.length?ecListe(Lk.map(p=>{ const k=ecPkPort(g,p.d,p.i); return ecLi({act:"ecRkPort",id:p.d.id,lead:esc(p.pp||"–"),breit:true,kopf:esc(ecLinkOrt(g,p)),text:(k.f?ecPkDot(k.f[2]):"")+esc([k.zw?ecPkZweckName(k.zw):"",ecDoseName(p.d),p.d.lage,ecVkText(ecVk(g,p.d))].filter(Boolean).join(" · ")),rechts:ecSt(ecNetStand(pr,p))}); })):`<p class="meta">Noch keine Dose an diesem Schrank. Dosen legst du unter „Gebäude“ in den Räumen an.</p>`;
  const nB=P.H.filter(h=>h[0]==="bad").length, nW=P.H.filter(h=>h[0]==="wip").length, tab=["ansicht","belegung","stueck","planung"].includes(ecRkTab)?ecRkTab:"ansicht";
  const TABS=[["ansicht","Ansicht",""],["belegung","Belegung",String(Lk.length)],["stueck","Stückliste",""],["planung","Planung",nB?`<i class="sd bad"></i>`:nW?`<i class="sd wip"></i>`:""]];
  const ansicht=`<section class="card rk-zeich"><div class="rk-zk"><h3>${ecRkSeiteAn()?"Vorderansicht und Seite":"Vorderansicht"}</h3></div>
      ${ecRkDefs()}<div class="rk-bau gross${ecRkSeiteAn()?" seite":""}${ecSchrBreite(s)>=800?" b800":""} ${ecSchrFarbe(s)}"><div class="rk-front"><div class="rk-geh ${s.bauart==="stand"?"stand":"wand"}${ecSchrBreite(s)>=800?" b800":""}"><div class="rk-dach"></div><div class="rk" style="--n:${N}"><span class="rk-schiene l"></span><span class="rk-schiene r"></span>${Array.from({length:N},(_,i)=>nr(i+1)+leer(i+1)).join("")}${T.map(t=>ecRkTeilHtml(pr,g,s,t,M)).join("")}</div><div class="rk-sockel"></div></div></div>
        <div class="rk-side"><div class="rk-sgeh ${s.bauart==="stand"?"stand":"wand"}"><div class="rk-sdach"></div><div class="rk-sv" style="--n:${N}"><i class="rk-stuer" title="Tür"></i><i class="rk-swand" title="Rückwand"></i><i class="rk-sfr" style="left:calc(${(ecRkVorn(s)/ecSchrTiefe(s)*100).toFixed(2)}% - 3px)" title="vordere Schiene"></i><i class="rk-nb" style="left:calc(${((ecRkVorn(s)+ecSchrNutzbar(s))/ecSchrTiefe(s)*100).toFixed(2)}% - 3px)" title="hintere Schiene – nutzbar etwa ${ecSchrNutzbar(s)} mm"></i>
          ${T.map(t=>ecRkSeiteTeil(s,t)).join("")}</div><div class="rk-ssockel"></div></div><div class="rk-smass"><span>vorne</span><span>${ecSchrTiefe(s)} mm</span><span>hinten</span></div></div></div>
</section>`;
  const inhalt=tab==="belegung"?`<section class="card"><h3>Belegung <span class="m3-neben">${Lk.length} Port${Lk.length===1?"":"s"}</span></h3>${beleg}</section>`
    :tab==="stueck"?`<section class="card"><h3>Stückliste</h3>${stueck}<p class="m3-hinweis">Keystones und Patchkabel = belegte Ports</p></section>`
    :tab==="planung"?`<section class="card"><h3>Planung</h3>${planung}</section>`:ansicht;
  return `<div class="rk-seite">
    <div class="rk-inhalt rk-${tab}">${inhalt}</div>
    ${zu||tab!=="ansicht"?"":`<button class="fab rk-fab" data-act="ecRkWahl">${icon("add")}<span>Teil einsetzen</span></button>`}</div>`; }
let ecRkTab="ansicht";
/* ---- Internetanschluss des Gebäudes: Art, Übergabepunkt, Modem, Weg bis zum Netzwerkschrank, Router ----
   g.anschluss={art,anbieter,raumId,ont,weg,routerKat,routerText,routerOrt,notiz} – gilt für das Gebäude, nicht nur für eine Prüfung */
const EC_AN_ART=[["glasfaser","Glasfaser"],["dsl","DSL"],["kabel","Kabel"],["mobil","Mobilfunk"],["keiner","kein Anschluss"]];
const EC_AN_DOSE={glasfaser:"Glasfaser-Anschlussdose (GF-TA)",dsl:"TAE-Dose",kabel:"Multimediadose",mobil:"",keiner:""};
const EC_AN_ONT=[["ont","eigenes Glasfaser-Modem (ONT)"],["box","im Router eingebaut (z. B. FRITZ!Box Fiber)"]];
const EC_AN_WEG=[["router_am_anschluss","Router am Hausanschluss, Netzwerkkabel zum Schrank"],["lan_zum_schrank","Netzwerkkabel vom Modem zum Router im Schrank"],["glas_zum_schrank","Glasfaser bis in den Schrank, Modem und Router im Schrank"],["im_schrank","Hausanschluss direkt im Schrank"]];
const ecAnRouter=()=>EC_RKKAT.filter(K=>ecKatIstRouter(K));
function ecAnZeilen(g,zu){ const A=g.anschluss;
  if(!A||!A.art) return [ecLi({act:zu?null:"ecAnschluss",lead:icon("globe"),ton:"plus",kopf:"Internetanschluss festlegen",text:"Glasfaser, DSL oder Kabel – wo er ankommt und wie er in den Schrank kommt"})];
  const art=(EC_AN_ART.find(x=>x[0]===A.art)||[,""])[1], K=ecRkKat(A.routerKat), router=K?ecRkKatName(K):A.routerText||"", ort=A.routerOrt?(A.routerOrt.startsWith("s:")?ecSchrName(g,A.routerOrt.slice(2)):ecRaumName(g,A.routerOrt.slice(2))):"";
  const Z=[ecLi({act:zu?null:"ecAnschluss",lead:icon("globe"),kopf:esc([art,A.anbieter].filter(Boolean).join(" · ")),text:esc([EC_AN_DOSE[A.art]&&`Übergabe: ${EC_AN_DOSE[A.art]}`,A.raumId&&ecRaumName(g,A.raumId),A.art==="glasfaser"&&A.ont?(A.ont==="box"?"Modem im Router":"eigenes Modem (ONT)"):""].filter(Boolean).join(" · "))})];
  if(A.weg) Z.push(ecLi({act:zu?null:"ecAnschluss",lead:icon("route"),kopf:esc((EC_AN_WEG.find(x=>x[0]===A.weg)||[,""])[1]),text:A.art==="glasfaser"&&A.weg==="glas_zum_schrank"?"Glasfaser im Leerrohr bis zum Schrank, Spleiß bzw. Anschlussdose dort":""}));
  if(router||ort) Z.push(ecLi({act:zu?null:"ecAnschluss",lead:icon("ecNetz"),kopf:esc(router||"Router"),text:esc(ort?`steht in: ${ort}`:"Standort offen")}));
  if(A.notiz) Z.push(ecLi({act:zu?null:"ecAnschluss",lead:icon("notes"),kopf:"Notiz",text:esc(A.notiz)}));
  return Z; }
function ecAnDlg(){ const pr=ecPr(), g=ecGeb(pr.ortId); if(!ecDlg||!ecDlg.an) ecDlg={an:true,w:{...(g.anschluss||{art:"glasfaser"})}}; const W=ecDlg.w;
  const orte=[["","– offen –"],...g.schraenke.map(x=>["s:"+x.id,`Schrank: ${x.name}`]),...ecRaeume(g).map(x=>["r:"+x.id,x.titel])];
  dialog("Internetanschluss",`<div class="lbl">Anschluss</div>${ecChips("anArt",EC_AN_ART,W.art||"")}
    ${W.art&&W.art!=="keiner"?`<div class="fg1" style="margin-top:14px">${tf("anAnbieter","Anbieter (optional)",W.anbieter||"",{form:true,ph:"z. B. Telekom, Deutsche Glasfaser, Vodafone"})}
      ${EC_AN_DOSE[W.art]?sf("anRaum",`Raum der ${EC_AN_DOSE[W.art]}`,W.raumId||"",[["","– offen –"],...ecRaeume(g).map(x=>[x.id,x.titel])],{form:true}):""}</div>
      ${W.art==="glasfaser"?`<div class="lbl" style="margin-top:14px">Glasfaser-Modem</div>${ecChips("anOnt",EC_AN_ONT,W.ont||"")}`:""}
      ${W.art!=="mobil"?`<div class="lbl" style="margin-top:14px">Weg zum Netzwerkschrank</div><div class="ec-an-weg">${ecChips("anWeg",EC_AN_WEG,W.weg||"")}</div>`:""}
      <div class="fg1" style="margin-top:14px">${sf("anRouter","Router",W.routerKat||"",[["","– anderer, unten eintragen –"],...ecAnRouter().map(K=>[K.id,ecRkKatName(K)])],{form:true})}
        ${W.routerKat?"":tf("anRouterText","Router (Text)",W.routerText||"",{form:true,ph:"z. B. Speedport Smart 4, Genexis-Modem"})}
        ${sf("anRouterOrt","Router steht in",W.routerOrt||"",orte,{form:true})}
        ${ta("anNotiz","Notiz (optional)",W.notiz||"",{form:true,ph:"z. B. Leerrohr vom HÜP zum Schrank, Glasfaser gespleißt"})}</div>`:""}`,
    `${g.anschluss?`<button class="btn-text danger" data-act="ecAnWeg">Entfernen</button>`:""}<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="ecAnOk">Speichern</button>`,{breit:true}); }
function ecAnLesen(){ if(!ecDlg||!ecDlg.an) return; const F=formVals(), W=ecDlg.w;
  if(F.anAnbieter!=null) W.anbieter=F.anAnbieter; if(F.anRaum!=null) W.raumId=F.anRaum; if(F.anRouter!=null) W.routerKat=F.anRouter; if(F.anRouterText!=null) W.routerText=F.anRouterText; if(F.anRouterOrt!=null) W.routerOrt=F.anRouterOrt; if(F.anNotiz!=null) W.notiz=F.anNotiz; }
/* ---- Patchkabel-Farben: je Gebäude ein Farbschema nach Verwendung des Ports (g.pkFarben={an,z:{zweck:farbe}}); Verwendung je Port in der Dose (d.nutz={port:zweck}) ---- */
const EC_PK_ZWECK=[["arbeitsplatz","Arbeitsplatz / PC"],["ap","WLAN-Access-Point"],["kamera","Kamera"],["telefon","Telefon"],["tv","TV / Multimedia"],["smart","Smart Home / Haustechnik"],["drucker","Drucker"],["uplink","Uplink, Router, Server"]];
const EC_PK_FARBE=[["blau","Blau","#1E6FD9"],["gelb","Gelb","#F2C200"],["gruen","Grün","#2E9E4F"],["rot","Rot","#D7263D"],["orange","Orange","#F07F1A"],["violett","Violett","#7B4FC9"],["pink","Pink","#E05AA8"],["grau","Grau","#8C9096"],["schwarz","Schwarz","#22252A"],["weiss","Weiß","#F4F5F6"]];
/* Verlegekabel (Dose ↔ Patchfeld, das gemessene Kabel): Simplex/Duplex und Mantelfarbe. Standard je Gebäude (g.vk), abweichend je Dose (d.vk) */
const EC_VK_FARBE=[["orange","Orange","#F07F1A"],["gelb","Gelb","#F2C200"],["gruen","Grün","#2E9E4F"],["grau","Grau","#8C9096"],["weiss","Weiß","#F4F5F6"],["blau","Blau","#1E6FD9"],["violett","Violett","#7B4FC9"],["schwarz","Schwarz","#22252A"]];
const ecVk=(g,d)=>{ const st=g.vk||{}, o=(d&&d.vk)||{}; return {art:o.art||st.art||"",farbe:o.farbe||st.farbe||"",eigen:!!(o.art||o.farbe)}; };
const ecVkFarbe=f=>EC_VK_FARBE.find(x=>x[0]===f)||null;
const ecVkText=v=>[v.art?(v.art==="duplex"?"Duplex":"Simplex"):"",v.farbe&&ecVkFarbe(v.farbe)?`Mantel ${ecVkFarbe(v.farbe)[1].toLowerCase()}`:""].filter(Boolean).join(", ");
const ecVkSw=(act,cur,zu,leer)=>`${EC_VK_FARBE.map(([f,t,hex])=>`<button type="button" class="pk-sw${cur===f?" an":""}" data-act="${act}" data-v="${f}" style="background:${hex}" title="${esc(t)}" aria-label="Mantel ${esc(t)}" ${zu?"disabled":""}></button>`).join("")}${leer?`<button type="button" class="pk-sw keine${cur?"":" an"}" data-act="${act}" data-v="" title="${esc(leer)}" aria-label="${esc(leer)}" ${zu?"disabled":""}>–</button>`:""}`;
const EC_PK_STD={arbeitsplatz:"blau",ap:"gelb",kamera:"schwarz",telefon:"gruen",tv:"weiss",smart:"orange",drucker:"violett",uplink:"rot"};
const ecPkFarbe=(g,zw)=>{ const P=g.pkFarben; if(!P||!P.an||!zw) return null; const f=(P.z||{})[zw]; return f?EC_PK_FARBE.find(x=>x[0]===f)||null:null; };
const ecPkZweckName=zw=>(EC_PK_ZWECK.find(x=>x[0]===zw)||[,""])[1];
const ecPkDot=(hex,gross)=>`<i class="pk-dot${gross?" gross":""}" style="background:${hex}"></i>`;
/* Verwendung und Farbe eines Ports (für Belegung, Stückliste, Zeichnung) */
const ecPkPort=(g,d,i)=>{ const zw=d&&d.nutz&&d.nutz[i]||""; return {zw,f:ecPkFarbe(g,zw)}; };
function ecPkZeilen(g,zu){ const P=g.pkFarben, A=ecNetAlle(g);
  if(!P||!P.an) return [ecLi({act:zu?null:"ecPkDlg",lead:icon("palette"),ton:"plus",kopf:"Farbschema festlegen",text:"z. B. blau für Arbeitsplätze, gelb für WLAN, rot für Uplinks – erscheint in Belegung, Stückliste und Schrankansicht"})];
  return EC_PK_ZWECK.filter(([zw])=>(P.z||{})[zw]).map(([zw,t])=>{ const f=ecPkFarbe(g,zw), n=A.filter(p=>(p.d.nutz||{})[p.i]===zw).length;
    return ecLi({act:zu?null:"ecPkDlg",lead:ecPkDot(f[2],true),kopf:esc(t),text:esc(`${f[1]}${n?` · ${n} Port${n>1?"s":""}`:" · noch kein Port"}`)}); }); }
function ecPkDialog(){ const pr=ecPr(), g=ecGeb(pr.ortId); if(!ecDlg||!ecDlg.pk) ecDlg={pk:true,z:{...((g.pkFarben&&g.pkFarben.an&&g.pkFarben.z)||EC_PK_STD)}}; const Z=ecDlg.z;
  dialog("Patchkabel-Farben",`<p class="meta" style="margin:0 2px 12px">Welche Farbe bekommt das Patchkabel – je nach dem, was an der Dose hängt? Die Verwendung legst du bei jeder Datendose fest.</p>
    <div class="pk-liste">${EC_PK_ZWECK.map(([zw,t])=>`<div class="pk-zeile"><span class="pk-t">${esc(t)}</span><span class="pk-wahl">${EC_PK_FARBE.map(([f,ft,hex])=>`<button type="button" class="pk-sw${Z[zw]===f?" an":""}" data-act="ecPkWahl" data-z="${zw}" data-f="${f}" style="background:${hex}" aria-label="${esc(`${t}: ${ft}`)}" title="${esc(ft)}"></button>`).join("")}<button type="button" class="pk-sw keine${Z[zw]?"":" an"}" data-act="ecPkWahl" data-z="${zw}" data-f="" aria-label="${esc(`${t}: keine Farbe`)}" title="keine Vorgabe">–</button></span></div>`).join("")}</div>`,
    `${g.pkFarben&&g.pkFarben.an?`<button class="btn-text danger" data-act="ecPkAus">Ausschalten</button>`:""}<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="ecPkOk">Speichern</button>`,{breit:true}); }
/* ---- Netzwerk-Katalog (Prospekt): alle Modelle mit Frontansicht – zum Nachschlagen und um Kunden zu zeigen, wie es aussehen kann ---- */
const EC_KATGR=[["alle","Alle"],["patch","Patchfelder"],["switch","Switches"],["router","Gateways und Router"],["modem","Modems"],["nas","NAS, Server und Rekorder"],["zubehoer","Strom und Zubehör"],["boden","Auf Fachboden"]];
let ecKatFilter="alle";
/* Kachelbild: Rackgerät ohne Ohren, Gerät auf dem Fachboden eng um das Gerät */
function ecRkKachelSvg(K){ const v=ecRkFrontSvg(K), H=K.he*RK_U; let x=16.5, w=449.6, y=0, h=H;
  if(K.typ==="boden"&&K.bild){ const dw=K.bild.breite||(K.zeichnung==="fritz"?226:K.zeichnung==="ugreen"?256:(K.bild.schaechte||2)>2?200:108), dh=Math.min(H-10,(K.bild.hoehe||(K.zeichnung==="fritz"?46:166))+(K.zeichnung==="fritz"?22:0)), p=Math.max(14,dw*.12);
    x=(RK_B-dw)/2-p; w=dw+2*p; y=Math.max(0,H-8-dh-p*.6); h=H-y; }
  return v.replace(`viewBox="0 0 ${RK_B} ${H}"`,`viewBox="${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}"`).replace(/style="aspect-ratio:[^"]*"/,`style="aspect-ratio:${(w/h).toFixed(3)}"`); }
function ecRkFrontSvg(K){ const t={id:"k",typ:K.typ,pos:1,he:K.he,ports:K.ports,nr:1,kat:K.id,name:K.kurz||"",poe:!!K.poe,voll:true};
  const html=ecRkTeilHtml(null,null,null,t,new Map()), a=html.indexOf("<svg"), b=html.lastIndexOf("</svg>")+6, H=K.he*RK_U;
  return html.slice(a,b).replace('class="rk-svg"','class="kat-svg"').replace('preserveAspectRatio="none"',`preserveAspectRatio="xMidYMid meet" style="aspect-ratio:${RK_B}/${H.toFixed(2)}"`); }
const ecKatIstRouter=K=>K.typ==="router"||K.zeichnung==="fritz"||!!(K.bild&&K.bild.art==="router");
/* Gerätegruppen: Gateways und NAS gibt es im Rack und als Tischgerät auf dem Fachboden */
const ecKatHaupt=K=>{ const a=K.bild&&K.bild.art; return ecKatIstRouter(K)?"router":a==="modem"?"modem":a==="switch"?"switch":a==="usv"?"zubehoer":a==="server"?"nas":K.typ==="nas"||K.zeichnung==="desk"||K.zeichnung==="ugreen"?"nas":["pdu","usv","kabel","blind","luefter"].includes(K.typ)?"zubehoer":K.typ; };
const ecKatIn=(K,g)=>g==="boden"?K.typ==="boden":ecKatHaupt(K)===g;
const ecKatArt=K=>{ if(K.typ!=="boden") return EC_RK[K.typ]||""; const a=K.bild&&K.bild.art; return (ecKatIstRouter(K)?"Router":a==="modem"?"Modem":a==="switch"?"Switch":a==="usv"?"USV":a==="server"?"Server":"NAS")+" auf Fachboden"; };
const ecKatFakten=K=>[`${K.he} HE`,K.ports&&K.typ!=="router"&&K.typ!=="boden"?`${K.ports} Ports`:"",K.poe?"PoE":""].filter(Boolean).join(" · ");
/* Echte Fotos im Katalog: je Gerät ein Datensatz „nkfoto-<id>“ in den Einstellungen (wird mit allen geteilt) –
   eigenes Foto (verkleinert, im Datensatz) oder Bild-Link. Ohne Foto bleibt die Zeichnung; im Schrankplaner immer die Zeichnung. */
const ecKatFotoRec=id=>{ const r=DB.einstellungen&&DB.einstellungen.get("nkfoto-"+id); return r&&!r.deleted&&(r.foto||r.url)?r:null; };
/* Reihenfolge: eigenes Foto > eigener Bild-Link > Herstellerbild aus dem Katalog (bildUrl). Lädt ein Bild nicht, bleibt die Zeichnung darunter sichtbar. */
const ecKatFotoSrc=K=>{ const r=ecKatFotoRec(K.id); return r?(r.foto||r.url):(bildLokal(K.bildUrl)||""); };
const ecKatBildHtml=K=>{ const src=ecKatFotoSrc(K); return ecRkKachelSvg(K)+(src?`<img class="kat-foto" src="${esc(src)}" alt="" referrerpolicy="no-referrer" loading="lazy" onerror="this.remove()">`:""); };
function ecKatFotoSpeichern(id,w){ const key="nkfoto-"+id, neu=!DB.einstellungen.has(key), r=DB.einstellungen.get(key)||{id:key,katId:id}; Object.assign(r,w,{by:who(),at:Date.now()}); r.deleted=!(r.foto||r.url); saveRec("einstellungen",r,neu); }
function ecKatFotoVerkleinern(file){ return new Promise((res,rej)=>{ const url=URL.createObjectURL(file), img=new Image();
  img.onload=()=>{ const f=Math.min(1,900/Math.max(img.naturalWidth,img.naturalHeight)), c=document.createElement("canvas"); c.width=Math.round(img.naturalWidth*f); c.height=Math.round(img.naturalHeight*f);
    const g=c.getContext("2d"); g.fillStyle="#fff"; g.fillRect(0,0,c.width,c.height); g.drawImage(img,0,0,c.width,c.height); URL.revokeObjectURL(url); res(c.toDataURL("image/jpeg",.8)); };
  img.onerror=()=>{ URL.revokeObjectURL(url); rej(0); }; img.src=url; }); }
function ecKatFotoWaehlen(id){ const i=document.createElement("input"); i.type="file"; i.accept="image/*"; i.style.display="none"; document.body.appendChild(i);
  i.addEventListener("change",async()=>{ const f=i.files&&i.files[0]; i.remove(); if(!f) return;
    try{ ecKatFotoSpeichern(id,{foto:await ecKatFotoVerkleinern(f)}); closeOverlays(); render(); toast("Foto gespeichert – sehen alle im Katalog"); }catch(e){ toast("Das Bild ließ sich nicht öffnen"); } });
  i.click(); }
function ecKatBildDlg(K){ const r=ecKatFotoRec(K.id), src=ecKatFotoSrc(K), darf=r&&(ME.admin||!r.by||!r.by.mail||r.by.mail===ME.mail);
  dialog(ecRkKatName(K),`${ecRkDefs()}${src?`<div class="kat-gross foto"><img src="${esc(src)}" alt="" referrerpolicy="no-referrer" onerror="this.closest('.kat-gross').remove()"></div><p class="sup" style="margin:8px 0 14px">${!r?"Herstellerbild – vor Ort gilt das Typschild":r.foto?"Eigenes Foto":"Bild über Link"}${r&&r.by&&r.by.name?` · ${esc(r.by.name)}`:""}</p><div class="lbl">Zeichnung im Schrankplaner</div>`:""}
    <div class="kat-gross">${ecRkFrontSvg(K)}</div><p class="sup" style="margin:8px 0 0">${src?"Die Zeichnung bleibt für den Schrank – maßstäblich nach Herstellerangaben.":"Noch kein Foto. Ein Foto vom Gerät (oder ein Bild-Link vom Hersteller) ersetzt die Zeichnung in Katalog und Steckbrief."}</p>`,
    `${src&&darf?`<button class="btn-text danger" data-act="ecKatFotoWeg">Entfernen</button>`:""}<span style="flex:1"></span><button class="btn-text" data-act="ecKatLink">Bild-Link</button><button class="btn-text" data-act="ecKatFotoNeu">${r&&r.foto?"Foto ersetzen":"Foto"}</button><button class="btn-text" data-act="cancel">Schließen</button>`,{breit:true}); }
/* Katalog 1:1 wie in EVSE: Suche, nach Hersteller gruppierte Kacheln (weißes Bildfeld), Steckbrief-Seite */
function ecKatKachel(K,von){ return `<button class="ktile" data-act="ecKatAuf" data-id="${esc(K.id)}"${von?` data-von="${von}"`:""}><span class="ktile-bild">${ecKatBildHtml(K)}</span>
  <span class="ktile-t"><b>${esc(K.kurz||K.modell)}</b><span>${esc(ecKatFakten(K))}</span><small>${esc(ecKatArt(K))}</small></span></button>`; }
/* Filter/Sortieren an der Suchleiste (gleiches Fenster wie bei den Prüfungslisten) */
FDEF.ec_kat={std:{sort:"hersteller",typ:"alle",hst:"alle"},sort:[["hersteller","Nach Hersteller"],["typ","Nach Gerätegruppe"],["az","Modell A–Z"]],
  gruppen:[{k:"typ",t:"Gerätegruppe",opts:EC_KATGR},{k:"hst",t:"Hersteller",get opts(){ return [["alle","Alle"],...[...new Set(EC_RKKAT.map(K=>K.hersteller))].sort((x,y)=>x.localeCompare(y,"de")).map(h=>[h,h])]; }}],
  liste:()=>ecKatListe()};
function ecKatListe(){ const n="ec_kat", q=String(query||"").trim().toLowerCase(), typ=fW(n,"typ"), hst=fW(n,"hst"), so=fW(n,"sort");
  const L=EC_RKKAT.filter(K=>(typ==="alle"||ecKatIn(K,typ))&&(hst==="alle"||K.hersteller===hst)&&(!q||[K.hersteller,K.modell,K.kurz,K.artnr,K.sku,ecKatArt(K)].filter(Boolean).join(" ").toLowerCase().includes(q)));
  if(!L.length) return `${fInfo(n,0,"Gerät","Geräte")}<p class="meta" style="text-align:center;margin-top:24px">${q?`Nichts gefunden für „${esc(query)}“.`:"Keine Geräte für diesen Filter."}</p>`;
  const nm=K=>K.kurz||K.modell, info=fInfo(n,L.length,"Gerät","Geräte");
  if(so==="az") return info+`<div class="katgrid">${[...L].sort((x,y)=>nm(x).localeCompare(nm(y),"de")).map(ecKatKachel).join("")}</div>`;
  const grp=new Map(), key=so==="typ"?K=>(EC_KATGR.find(g=>g[0]===ecKatHaupt(K))||[,"Sonstiges"])[1]:K=>K.hersteller;
  (so==="typ"?EC_KATGR.slice(1).flatMap(g=>L.filter(K=>ecKatHaupt(K)===g[0])):[...L].sort((x,y)=>x.hersteller.localeCompare(y.hersteller,"de"))).forEach(K=>{ const k=key(K); if(!grp.has(k)) grp.set(k,[]); grp.get(k).push(K); });
  return info+[...grp].map(([h,G])=>`<div class="sec-lbl">${esc(h)}</div><div class="katgrid">${G.map(ecKatKachel).join("")}</div>`).join(""); }
function ecKatalogView(){ return `<div class="narrow">${ecRkDefs()}${searchBar("Hersteller, Modell, Art.-Nr.",fKnopf("ec_kat"))}<div id="res">${ecKatListe()}</div></div>`; }
/* Vorschau auf der Netzwerk-Startseite: was bei uns am meisten verbaut ist, aufgefüllt mit je einem Gerät pro Gruppe */
function ecKatVorschau(){ const cnt=new Map();
  for(const g0 of live("gebaeude")) for(const sc of ecGebNorm(g0).schraenke||[]) for(const t of ecSchrTeile(sc)) if(t.kat&&ecRkKat(t.kat)) cnt.set(t.kat,(cnt.get(t.kat)||0)+1);
  const ids=[...cnt].sort((a,b)=>b[1]-a[1]).map(x=>x[0]);
  for(const id of ["metz-130921","uni-pro48poe","udm-pro","syno-ds923","fritz-5590"]) if(!ids.includes(id)&&ecRkKat(id)) ids.push(id);
  for(const id of ["metz-130920","uni-24poe","syno-rs1221","uni-agg","ugreen-dxp4800p"]) if(!ids.includes(id)&&ecRkKat(id)) ids.push(id);
  const L=[], typen=new Set(); for(const id of ids){ const K=ecRkKat(id); if(L.length<6&&!typen.has(K.typ)){ L.push(K); typen.add(K.typ); } }
  for(const id of ids){ const K=ecRkKat(id); if(L.length<6&&!L.includes(K)) L.push(K); }
  return `<div class="sec-row ec-katv"><div class="sec-lbl">Aus dem Katalog</div><button class="btn-text" data-act="ecKatalog">Alle ${EC_RKKAT.length} Geräte</button></div>
    <div class="ec-katv-w"><div class="ec-katv-g">${L.map(K=>ecKatKachel(K,"netzwerk")).join("")}</div></div>`; }
/* Wo ist das Gerät verbaut? (Schränke aller Gebäude) */
function ecKatVerbaut(K){ const out=[];
  for(const g0 of live("gebaeude")){ const g=ecGebNorm(g0); for(const sc of g.schraenke||[]){ const n=ecSchrTeile(sc).filter(t=>t.kat===K.id).length; if(n) out.push({g,sc,n}); } }
  return out; }
function ecKatModellView(K){ const z=(l,v)=>v?`<div class="iz"><span>${l}</span><b>${esc(v)}</b></div>`:"", R=K.raster, Z=K.bild||{};
  const masse=K.typ==="boden"&&Z.breite?`${Z.breite} × ${Z.hoehe||"?"} mm${K.geraetTiefe?` × ${K.geraetTiefe} mm tief`:""}`:"";
  const stb=[z("Hersteller",K.hersteller),z("Modell",K.modell),z("Bauart",ecKatArt(K)),
    z("Höhe",K.typ==="boden"?`${K.he} HE inkl. Fachboden`:`${K.he} HE (${(K.he*RK_U).toFixed(2).replace(".",",")} mm)`),
    z("Ports",K.ports&&K.typ!=="boden"?`${K.ports}${K.poe?" · PoE":""}`:""),z("Gerätemaße",masse),
    z("Einbautiefe",K.tiefe?`${K.tiefe} mm`:K.geraetTiefe&&K.typ!=="boden"?`${K.geraetTiefe} mm`:""),
    z("Raster",R?`Keystone ${R.key} mm, Abstand ${R.abstand} mm, alle ${R.gruppe} Ports ${R.gl} mm Lücke`:""),
    z("Keystone",K.keystone?`${K.keystone.name} – Art.-Nr. ${K.keystone.artnr}`:""),
    z(K.artnr?"Artikelnummer":"Typ",K.artnr||K.sku),z("Notiz",K.info)].join("");
  let h=`<div class="narrow">${ecRkDefs()}<div class="sec-row"><div class="sec-lbl">Steckbrief</div></div>
    <div class="infok kat-kopf"><div class="kat-bild"><button class="foto kat-zeich" data-act="ecKatBild" aria-label="Bild groß ansehen">${ecKatBildHtml(K)}</button><span class="kat-bild-q">${ecKatFotoRec(K.id)?"Eigenes Foto":K.bildUrl?"Bild: Hersteller":"Zeichnung · Foto hinzufügen"}</span></div>
    <div class="kat-daten">${stb}<div class="by">${K.geschaetzt?"Raster wie beim Edelstahl angenommen, noch nicht nachgemessen. ":""}Maße angenähert, Zeichnung nach Herstellerangaben.</div></div></div>`;
  const V=ecKatVerbaut(K);
  if(V.length) h+=`<details class="kat-gepr"><summary>${icon("ecNetz")}<span>Bei uns verbaut: ${V.reduce((a,x)=>a+x.n,0)}× in ${V.length} Schrank${V.length>1?"en":""}</span>${icon("drop")}</summary>${listOf(V.map(({g,sc,n})=>`<div class="li" role="button" tabindex="0" data-act="ecKatVerbaut" data-o="${esc(g.ortId)}" data-s="${esc(sc.id)}"><span class="av">${icon("ecNetz")}</span><span class="lt"><span class="h">${esc(sc.name||"Netzwerkschrank")}</span><span class="s">${esc(`${ecOrt(g.ortId).titel}${n>1?` · ${n}×`:""}`)}</span></span>${icon("chev")}</div>`))}</details>`;
  return h+`</div>`; }
/* Seitenansicht: Farbe wie die Front (Edelstahl, UniFi-Alu, schwarz, weiße FRITZ!Box), Tiefe maßstäblich zur Schranktiefe */
function ecRkFarbe(t){ const K=ecRkKat(t.kat);
  if(K){ if(t.typ==="patch") return K.farbe==="edelstahl"?"inox":K.farbe==="hell"?"hell":"schwarz"; if(K.silber) return "silber"; return "schwarz"; }
  if((t.typ==="switch"||t.typ==="router")&&/unifi|ubiquiti|ubnt/i.test(t.name||"")) return "silber"; return t.typ==="blind"?"blind":"schwarz"; }
/* Schnitt: vorn Tür, dann die vordere Schiene (Abstand ~50 mm), die Geräte hängen an ihr und ragen nach hinten; hintere Schiene am Ende der nutzbaren Tiefe */
const ecRkVorn=s=>Math.min(50,Math.max(0,(ecSchrTiefe(s)-ecSchrNutzbar(s))/2));
function ecRkSeiteTeil(s,t){ const tf2=ecRkTiefe(s,t), T=ecSchrTiefe(s), v=ecRkVorn(s), zu2=tf2>ecSchrNutzbar(s), w=Math.min(100-v/T*100,tf2/T*100).toFixed(2), K=ecRkKat(t.kat);
  const tit=esc(`${ecRkName(t)}: ${tf2} mm${+t.tiefe?"":" (typisch)"}${zu2?" – zu tief":""}`), st=`grid-row:${t.pos} / span ${t.he};width:${w}%;margin-left:${(v/T*100).toFixed(2)}%`;
  if(t.typ==="boden"){ const gt=K&&K.geraetTiefe; return `<span class="rk-sb rk-boden" style="${st}" title="${tit}">${gt?`<i class="rk-sbg${K.bild&&K.bild.rot?" rot":""}" style="width:${Math.min(100,gt/tf2*100).toFixed(1)}%" title="${esc(`${ecRkName(t)}: etwa ${gt} mm tief`)}"></i>`:""}</span>`; }
  return `<span class="rk-sb rk-${t.typ} f-${ecRkFarbe(t)}${+t.tiefe||K&&K.tiefe?"":" geschaetzt"}${zu2?" zutief":""}" style="${st}" title="${tit}"></span>`; }
/* Schrank offen? – dann wie die Ladestation in EVSE: Titel = Schrank, Bereiche als Tabs (Handy) bzw. Auswahl rechts im Kopf (breit), Aktionen im ⋮-Menü */
const ecRkOffen=()=>{ const p=nav.v==="ec"&&nav.schr&&DB.echecks.get(nav.id); if(!p||p.deleted||!ecNz(p)||ecTab(p)!=="infra") return null; return ecGeb(p.ortId).schraenke.find(x=>x.id===nav.schr)||null; };
function ecRkBereiche(){ const pr=ecPr(), g=ecGeb(pr.ortId), s=ecRkOffen(); if(!s) return []; const P=ecRkPlanung(pr,g,s), nB=P.H.some(h=>h[0]==="bad"), nW=P.H.some(h=>h[0]==="wip");
  return [["ansicht","Ansicht",null],["belegung","Belegung",null],["stueck","Stückliste",null],["planung","Planung",nB?"bad":nW?"wip":"ok"]]; }
const ecRkTabsHtml=()=>ecRkBereiche().map(([k,l,st])=>`<button class="tab" role="tab" data-act="ecRkTab" data-v="${k}" aria-selected="${k===ecRkTab}"><span class="tl">${l}${st?`<i class="sd ${st}"></i>`:""}</span></button>`).join("");
const skRechts=()=>{ if(!WIDE.matches||!ecRkOffen()) return ""; const L=ecRkBereiche(), a=L.find(x=>x[0]===ecRkTab)||L[0];
  return `<button class="spick" data-act="ecRkSpick" aria-haspopup="menu" aria-label="Bereich wählen">${a[2]?`<i class="sd ${a[2]}"></i>`:`<span class="spick-ic">${icon("ecNetz")}</span>`}<span class="spick-t">${a[1]}</span><span class="spick-p">${icon("chev")}</span></button>`; };
function ecRkSpickAuf(b){ const m=$("#menu"), r=b.getBoundingClientRect();
  m.innerHTML=ecRkBereiche().map(([k,l,st])=>`<button class="mi spick-mi${k===ecRkTab?" an":""}" role="menuitem" data-act="ecRkTab" data-v="${k}">${st?`<i class="sd ${st}"></i>`:`<span class="spick-ic">${icon("ecNetz")}</span>`}<span>${l}</span></button>`).join("");
  m.style.top=(r.bottom+6)+"px"; m.style.right=(innerWidth-r.right)+"px"; m.style.left="auto"; m.style.minWidth=Math.max(240,r.width)+"px"; m.hidden=false; $("#scrim").hidden=false; }
function ecRkMenuInhalt(){ const pr=ecPr(), zu=pr.status==="fertig", id=nav.schr;
  const it=[...(zu?[]:[["ecSchrEdit","Schrank bearbeiten","edit"]]),["ecEti","Beschriften mit Brother","tag"],["ecRkHilfe","So bedienst du den Planer","info"]];
  $("#menu").innerHTML=it.map(x=>`<button class="mi" role="menuitem" data-act="${x[0]}" data-id="${esc(id)}">${icon(x[2])}<span>${x[1]}</span></button>`).join("");
  $("#menu").hidden=false; $("#scrim").hidden=false; $("#menuBtn").setAttribute("aria-expanded","true"); }
/* Seitenansicht ein/aus – merkt sich jedes Gerät selbst; Standard: am PC an, am Handy aus */
/* Seitenansicht immer am PC/iPad, am Handy nicht (zu schmal) – kein eigener Schalter */
const ecRkSeiteAn=()=>WIDE.matches;
/* Teil einsetzen: Auswahl als Liste (statt neun Chips über dem Schrank) */
function ecRkWahlDlg(){ const pr=ecPr(), g=ecGeb(pr.ortId), s=g.schraenke.find(x=>x.id===nav.schr); if(!s) return;
  const info={nas:"Netzwerkspeicher oder Videorekorder",patch:"Keystones, je Port eine Dose",switch:"verteilt die Ports ins Netz",kabel:"Bürste oder Bügel zwischen den Feldern",boden:"für Router, NAS, Glasfaser-Box",router:"Firewall, Gateway",pdu:"Strom für die Geräte im Schrank",usv:"überbrückt Stromausfall",luefter:"zieht warme Luft ab",blind:"verschließt freie HE"};
  dialog("Teil einsetzen",ecListe(["patch","switch","router","nas","boden","kabel","pdu","usv","luefter","blind"].map(t2=>ecLi({act:"ecRkNeu",lead:`${(EC_RKSTD[t2]||{he:1}).he} HE`,breit:true,kopf:esc(EC_RK[t2]),text:esc(info[t2]),extra:` data-t="${t2}"`}))),`<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button>`); }
function ecRkHilfeDlg(){ dialog("So bedienst du den Planer",ecListe([
    ecLi({lead:icon("edit"),kopf:"Teil antippen",text:"öffnet Art, Position, Höhe und Ports"}),
    ecLi({lead:icon("ziehen"),kopf:"Teil ziehen",text:"mit der Maus direkt, am Handy am Griff links. Ist die Stelle belegt, rücken die Teile dazwischen nach."}),
    ecLi({lead:icon("add"),kopf:"Freie HE antippen",text:"setzt dort ein neues Teil ein"}),
    ecLi({lead:'<i class="m3-dot"></i>',ton:"ok",kopf:"Patchport grün",text:"gemessen und in Ordnung; grau = belegt, rot = Mangel"}),
    ecLi({lead:icon("info"),kopf:"Seitenansicht",text:"Einbautiefe je Teil, Strich = nutzbare Tiefe. Blass = typischer Wert, solange keine Tiefe eingetragen ist."})]),
    `<span style="flex:1"></span><button class="btn-text" data-act="cancel">Verstanden</button>`); }
/* Teil bearbeiten */
function ecRkDlg(z){ const pr=ecPr(), g=ecGeb(pr.ortId), s=g.schraenke.find(x=>x.id===nav.schr); if(!s) return; ecDlg={rk:z}; const N=ecSchrHe(s), mitPorts=z.typ==="patch"||z.typ==="switch";
  const K=ecRkKat(z.kat), hatKat=EC_RKKAT.some(k=>k.typ===z.typ);
  dialog(z.id?`${ecRkName(z)} bearbeiten`:`${EC_RK[z.typ]} einsetzen`,`<div class="lbl">Art</div>${ecChips("rkTyp",Object.entries(EC_RK),z.typ)}
    ${hatKat?`<div class="lbl" style="margin-top:14px">Modell</div>${ecListe([ecLi({act:"ecRkKatAendern",lead:K?`${K.he} HE`:icon("book"),breit:!!K,ton:K?"plus":"",kopf:esc(K?ecRkKatName(K):"Ohne Modell"),text:esc(K?`${ecRkKatNr(K)}${K.keystone?` · ${K.keystone.name}`:""}`:"aus dem Katalog wählen – Maße und Optik stimmen dann")})])}`:""}
    <div class="fg1" style="margin-top:14px">${tf("rkName",z.typ==="patch"?"Bezeichnung (optional)":"Bezeichnung / Modell (optional)",z.name||"",{form:true,ph:{switch:"z. B. UniFi USW-24-PoE",router:"z. B. FRITZ!Box 7590",boden:"z. B. für FRITZ!Box und NAS",usv:"z. B. APC Smart-UPS 750"}[z.typ]||""})}
      <div class="reihe2">${sf("rkPos","Position (HE von oben)",String(z.pos),Array.from({length:N},(_,i)=>[String(i+1),`HE ${i+1}${ecRkFrei(s,i+1,+z.he||1,z.id)?"":" – belegt"}`]),{form:true})}${z.typ==="patch"?tf("rkNr","Patchfeld-Nummer",String(z.nr||""),{form:true,ph:"1"}):tf("rkTiefe","Einbautiefe in mm (optional)",z.tiefe?String(z.tiefe):"",{form:true,ph:`typisch ${EC_RKT[z.typ]||200}`})}</div></div>
    <div class="lbl" style="margin-top:12px">Höhe</div>${ecChips("rkHe",[["1","1 HE"],["2","2 HE"],["3","3 HE"],["4","4 HE"]],String(z.he||1))}
    ${mitPorts&&!K?`<div class="lbl" style="margin-top:12px">Ports</div>${ecChips("rkPorts",[["8","8"],["12","12"],["16","16"],["24","24"],["48","48"]],String(z.ports||24))}`:""}
    ${z.typ==="switch"?`<div class="lbl" style="margin-top:12px">PoE</div>${ecChips("rkPoe",[["0","ohne PoE"],["1","mit PoE"]],z.poe?"1":"0")}`:""}
    ${z.typ==="patch"?`<p class="meta" style="margin-top:10px">Die Nummer steht vorn in der Beschriftung der Dosen (1.13 = Patchfeld 1, Port 13) und bleibt beim Verschieben gleich.</p>`:""}`,
    `${z.id?`<button class="btn-text danger" data-act="ecRkDel">Entfernen</button>`:""}<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="ecRkOk">Speichern</button>`,{breit:true}); }
function ecRkNeuZ(s,typ,pos){ const d=EC_RKSTD[typ]||{he:1}, he=d.he, p=pos&&ecRkFrei(s,+pos,he)?+pos:pos&&ecRkFrei(s,+pos,1)?+pos:ecRkErsterFrei(s,he)||ecRkErsterFrei(s,1);
  const z={typ,pos:p||1,he:p&&!ecRkFrei(s,p,he)?1:he,ports:d.ports||0,name:"",poe:false};
  if(typ==="patch") z.nr=Math.max(0,...ecPfListe(s).map(x=>x.nr))+1; return {z,platz:!!p}; }
function ecRkLesen(){ const z=ecDlg&&ecDlg.rk; if(!z) return; const F=formVals(); if(F.rkName!=null) z.name=String(F.rkName).trim(); if(F.rkPos) z.pos=+F.rkPos; if(F.rkNr!=null&&String(F.rkNr).trim()) z.nr=+F.rkNr; if(F.rkTiefe!=null) z.tiefe=parseInt(F.rkTiefe,10)||0; }
/* Rechtsklick bzw. lange drücken (Handy) auf [data-ctx] löst die dort genannte Aktion aus, z. B. Schrank bearbeiten */
let ecCtxZeit=0, ecCtxT=null, ecCtxSchlucken=false;
let ecCtxX=0, ecCtxY=0;
function ecCtx(el){ if(Date.now()-ecCtxZeit<800) return; ecCtxZeit=Date.now(); const b=document.createElement("button"); b.hidden=true; b.dataset.act=el.dataset.ctx; b.dataset.id=el.dataset.id||""; document.body.appendChild(b); b.click(); b.remove(); }
document.addEventListener("contextmenu",e=>{ const el=e.target.closest&&e.target.closest("[data-ctx]"); if(!el) return; e.preventDefault(); ecCtxX=e.clientX; ecCtxY=e.clientY; ecCtx(el); });
document.addEventListener("pointerdown",e=>{ if(e.pointerType!=="touch") return; const el=e.target.closest&&e.target.closest("[data-ctx]"); if(!el) return; const x=e.clientX, y=e.clientY; ecCtxX=x; ecCtxY=y; clearTimeout(ecCtxT);
  ecCtxT=setTimeout(()=>{ ecCtxSchlucken=true; ecCtx(el); if(navigator.vibrate) try{ navigator.vibrate(15); }catch(_){} },550);
  const ab=ev=>{ if(ev.type==="pointermove"&&Math.hypot(ev.clientX-x,ev.clientY-y)<10) return; clearTimeout(ecCtxT); document.removeEventListener("pointermove",ab); document.removeEventListener("pointerup",ab); document.removeEventListener("pointercancel",ab); };
  document.addEventListener("pointermove",ab); document.addEventListener("pointerup",ab); document.addEventListener("pointercancel",ab); });
document.addEventListener("click",e=>{ if(ecCtxSchlucken){ ecCtxSchlucken=false; e.preventDefault(); e.stopImmediatePropagation(); } },true);
/* Frontansicht der Teile als SVG in echten Maßen (mm): 19" = 482,6 mm, 1 HE = 44,45 mm, Ohren 16,5 mm, Lochabstand 465,1 mm.
   So stimmen die Proportionen wie im echten Schrank; die Zeichnung skaliert mit der HE-Höhe. */
const ecRkKurz=n=>String(n||"").slice(0,34);
const RK_B=482.6, RK_U=44.45;
/* Farbverläufe einmal pro Seite (in der Schrank- und der Infrastruktur-Ansicht eingebunden) */
/* ---- Katalog für den Schrankplaner: Modelle mit echten Maßen (Raster in mm: Keystone-Breite, Abstand, Ports je Gruppe, Gruppenlücke) ----
   Metz Connect laut Beipackzettel „Modulare Patchfelder unbestückt“ (G353, 2025-06-25) und Messung von Max am 130921-00-E. */
const EC_RKKAT=[
  {id:"metz-130921",typ:"patch",hersteller:"Metz Connect",modell:"Modulträger 1 HE 24 Port Edelstahl",artnr:"130921-00-E",he:1,ports:24,farbe:"edelstahl",raster:{key:15,abstand:2,gruppe:6,gl:10},keystone:{name:"Metz Connect E-DAT modul Cat.6A",artnr:"130910KI"},bildUrl:"https://static01.galaxus.com/productimages/5/9/1/8/4/8/6/4/2/4/9/2/5/0/5/7/1/6/2/a1b65bb9-7cc6-40d2-8eb6-4af93e5f6680_cropped.jpg_720.jpeg"},
  {id:"metz-130920",typ:"patch",hersteller:"Metz Connect",modell:"Modulträger 1 HE 24 Port",artnr:"130920-00-E",he:1,ports:24,farbe:"hell",raster:{key:15,abstand:2,gruppe:6,gl:10},keystone:{name:"Metz Connect E-DAT modul Cat.6A",artnr:"130910KI"},geschaetzt:true,bildUrl:"https://asset.re-in.de/isa/160267/c1/-/de/973708_LB_00_FB/Metz-Connect-130920-E-24-Port-Netzwerk-Patchpanel-483-mm-19-CAT-6a-1-HE-Bestueckt.webp?x=500&y=500&ex=500&ey=500&align=center&format=WEBP&quality=90"},
  {id:"metz-130920bk",typ:"patch",hersteller:"Metz Connect",modell:"Modulträger 1 HE 24 Port schwarz",artnr:"130920-BK-E",he:1,ports:24,farbe:"schwarz",raster:{key:15,abstand:2,gruppe:6,gl:10},keystone:{name:"Metz Connect E-DAT modul Cat.6A",artnr:"130910KI"},geschaetzt:true,bildUrl:"https://www.voltus.com/out/pictures/master/product/1/20003330_01.jpg"},
  /* Ubiquiti UniFi – Typbezeichnung als „sku“ */
  {id:"uni-pro24poe",typ:"switch",hersteller:"Ubiquiti",modell:"UniFi Switch Pro 24 PoE",kurz:"USW-Pro-24-PoE",sku:"USW-Pro-24-PoE",he:1,ports:24,poe:true,silber:true,zeichnung:"uniSwitch",bild:{rj:24,sfp:2,lcd:true},bildUrl:"https://cdn.ecomm.ui.com/products/5b69cdb5-e7ea-44e6-ae16-8714339038fb/18d39964-78e7-45f9-874d-e331f1408730.png"},
  {id:"uni-pro48poe",typ:"switch",hersteller:"Ubiquiti",modell:"UniFi Switch Pro 48 PoE",kurz:"USW-Pro-48-PoE",sku:"USW-Pro-48-PoE",he:1,ports:48,poe:true,silber:true,zeichnung:"uniSwitch",bild:{rj:48,sfp:4,lcd:true},bildUrl:"https://cdn.ecomm.ui.com/products/6e019f0c-26b5-4fdf-b4e1-994abd9ce6e1/483da8b5-c584-4100-a4f2-18d11fa7187e.png"},
  {id:"uni-promax24poe",typ:"switch",hersteller:"Ubiquiti",modell:"UniFi Switch Pro Max 24 PoE",kurz:"USW-Pro-Max-24-PoE",sku:"USW-Pro-Max-24-PoE",he:1,ports:24,poe:true,silber:true,zeichnung:"uniSwitch",bild:{rj:24,sfp:2,lcd:true,schnell:8},info:"16 × 1 G, 8 × 2,5 G",bildUrl:"https://linitx.com/images/products/Ubiquiti_UniFi_Pro_Max_24_PoE_Network_Switch_-_USW-Pro-Max-24-POE_main_product.jpg"},
  {id:"uni-promax48poe",typ:"switch",hersteller:"Ubiquiti",modell:"UniFi Switch Pro Max 48 PoE",kurz:"USW-Pro-Max-48-PoE",sku:"USW-Pro-Max-48-PoE",he:1,ports:48,poe:true,silber:true,zeichnung:"uniSwitch",bild:{rj:48,sfp:4,lcd:true,schnell:16},info:"32 × 1 G, 16 × 2,5 G",bildUrl:"https://cdn.ecomm.ui.com/products/51e22689-9b81-4717-beed-fe2c65c57362/18b790aa-f0b3-4e6b-9aca-63948c65535d.png"},
  {id:"uni-24poe",typ:"switch",hersteller:"Ubiquiti",modell:"UniFi Switch 24 PoE",kurz:"USW-24-PoE",sku:"USW-24-PoE",he:1,ports:24,poe:true,silber:true,zeichnung:"uniSwitch",bild:{rj:24,sfp:2,lcd:true},bildUrl:"https://cdn.ecomm.ui.com/products/467359c4-e5c3-487b-ae00-f6b7de29c6fc/1fd41f67-8fd9-4689-989e-c03b43217e3a.png"},
  {id:"uni-48poe",typ:"switch",hersteller:"Ubiquiti",modell:"UniFi Switch 48 PoE",kurz:"USW-48-PoE",sku:"USW-48-PoE",he:1,ports:48,poe:true,silber:true,zeichnung:"uniSwitch",bild:{rj:48,sfp:4,lcd:true},info:"32 Ports mit PoE",bildUrl:"https://cdn.ecomm.ui.com/products/147e90c2-da47-44ad-ad19-b98e223cb54b/378bcc80-2ebd-45f1-a2fc-0e66669824e1.png"},
  {id:"uni-24",typ:"switch",hersteller:"Ubiquiti",modell:"UniFi Switch 24",kurz:"USW-24",sku:"USW-24",he:1,ports:24,silber:true,zeichnung:"uniSwitch",bild:{rj:24,sfp:2,lcd:true},info:"ohne PoE",bildUrl:"https://cdn.ecomm.ui.com/products/d443e087-efcf-47a1-8465-7fa3e60cf916/23c2a6bc-a606-43c0-9f3c-27f04f437bdf.png"},
  {id:"uni-48",typ:"switch",hersteller:"Ubiquiti",modell:"UniFi Switch 48",kurz:"USW-48",sku:"USW-48",he:1,ports:48,silber:true,zeichnung:"uniSwitch",bild:{rj:48,sfp:4,lcd:true},info:"ohne PoE",bildUrl:"https://cdn.ecomm.ui.com/products/8a649eb8-c497-4240-92ba-a5c7a792c395/fcf3841a-9b8c-45b1-9d77-8f878bebdcba.png"},
  {id:"uni-prohd24poe",typ:"switch",hersteller:"Ubiquiti",modell:"UniFi Switch Pro HD 24 PoE",kurz:"USW-Pro-HD-24-PoE",sku:"USW-Pro-HD-24-PoE",he:1,ports:24,poe:true,silber:true,zeichnung:"uniSwitch",bild:{rj:24,sfp:4,lcd:true,schnell:24},info:"2,5 G und 10 G, 4 × SFP+",bildUrl:"https://linitx.com/images/products/Ubiquiti_USW-Pro-HD-24-EU_main_product.jpg"},
  {id:"uni-proagg",typ:"switch",hersteller:"Ubiquiti",modell:"UniFi Switch Pro Aggregation",kurz:"USW-Pro-Aggregation",sku:"USW-Pro-Aggregation",he:1,ports:32,silber:true,zeichnung:"uniSwitch",bild:{rj:0,sfp:32,lcd:true},info:"28 × SFP+, 4 × SFP28",bildUrl:"https://linitx.com/images/products/Ubiquiti_UniFi_28_Port_10Gb_SFP__Layer_3_Aggregation_Switch_Pro_-_USW-Aggregation-Pro_main_product.jpg"},
  {id:"uni-agg",typ:"switch",hersteller:"Ubiquiti",modell:"UniFi Switch Aggregation",kurz:"USW-Aggregation",sku:"USW-Aggregation",he:1,ports:8,silber:true,zeichnung:"uniSwitch",bild:{rj:0,sfp:8,lcd:false},info:"8 × SFP+ 10 G",bildUrl:"https://linitx.com/images/products/Ubiquiti_UniFi_8_Port_SFP__Layer_2_Aggregation_Switch_-_USW-Aggregation_main_product.jpg"},
  {id:"udm-pro",typ:"router",hersteller:"Ubiquiti",modell:"UniFi Dream Machine Pro",kurz:"UDM-Pro",sku:"UDM-Pro",he:1,tiefe:286,silber:true,zeichnung:"uniGateway",bild:{hdd:1},bildUrl:"https://linitx.com/images/products/Ubiquiti_UniFi_Dream_Machine_Pro_-_UDM-PRO_main_product.jpg"},
  {id:"udm-se",typ:"router",hersteller:"Ubiquiti",modell:"UniFi Dream Machine SE",kurz:"UDM-SE",sku:"UDM-SE",he:1,silber:true,zeichnung:"uniGateway",bild:{hdd:1,poe:8},info:"8 Ports mit PoE",bildUrl:"https://linitx.com/images/products/Ubiquiti_Unifi_Dream_Machine_Special_Edition_-_UDM-SE_main_product.jpg"},
  {id:"udm-promax",typ:"router",hersteller:"Ubiquiti",modell:"UniFi Dream Machine Pro Max",kurz:"UDM-Pro-Max",sku:"UDM-Pro-Max",he:1,silber:true,zeichnung:"uniGateway",bild:{hdd:2},bildUrl:"https://linitx.com/images/products/Ubiquiti_UniFi_Dream_Machine_Pro_Max_-_UDM-Pro-Max_main_product.jpg"},
  {id:"uxg-pro",typ:"router",hersteller:"Ubiquiti",modell:"UniFi Next-Gen Gateway Pro",kurz:"UXG-Pro",sku:"UXG-Pro",he:1,silber:true,zeichnung:"uniGateway",bild:{hdd:0,lan:2},info:"Gateway ohne Controller",bildUrl:"https://linitx.com/images/products/Ubiquiti_UniFi_Next-Generation_Security_Gateway_Pro_-_UXG-Pro_main_product.jpg"},
  {id:"efg",typ:"router",hersteller:"Ubiquiti",modell:"UniFi Enterprise Fortress Gateway",kurz:"EFG",sku:"EFG",he:1,silber:true,zeichnung:"uniGateway",bild:{hdd:0,lan:2},info:"Gateway für große Netze – Ports vereinfacht dargestellt",bildUrl:"https://linitx.com/images/products/Ubiquiti_Enterprise_Fortress_Gateway_-_EFG_main_product.jpg"},
  /* Tischgeräte von UniFi auf dem Fachboden – Maße angenähert (Breite × Höhe der Front, Tiefe) */
  {id:"ucg-max",typ:"boden",hersteller:"Ubiquiti",modell:"UniFi Cloud Gateway Max",kurz:"UCG-Max",sku:"UCG-Max",he:2,zeichnung:"uniDesk",bild:{art:"router",form:"flach",display:true,breite:212,hoehe:30},geraetTiefe:128,info:"5 × 2,5 GbE, Platz für NVMe (Protect) – Maße geschätzt",bildUrl:"https://linitx.com/images/products/Ubiquiti_UniFi_Cloud_Gateway_Max_-_UCG-Max_main_product.jpg"},
  {id:"ucg-fiber",typ:"boden",hersteller:"Ubiquiti",modell:"UniFi Cloud Gateway Fiber",kurz:"UCG-Fiber",sku:"UCG-Fiber",he:2,zeichnung:"uniDesk",bild:{art:"router",form:"flach",display:true,breite:212,hoehe:30},geraetTiefe:128,info:"10G SFP+ und 10GbE, 4 × 2,5 GbE – Maße geschätzt",bildUrl:"https://linitx.com/images/products/Ubiquiti_UniFi_Cloud_Gateway_Fiber_-_UCG-Fiber_main_product.jpg"},
  {id:"ucg-ultra",typ:"boden",hersteller:"Ubiquiti",modell:"UniFi Cloud Gateway Ultra",kurz:"UCG-Ultra",sku:"UCG-Ultra",he:2,zeichnung:"uniDesk",bild:{art:"router",form:"flach",breite:142,hoehe:30},geraetTiefe:128,info:"Kompakt, 4 × GbE + 2,5 GbE WAN – Maße geschätzt",bildUrl:"https://linitx.com/images/products/Ubiquiti_UniFi_Cloud_Gateway_Ultra_-_UCG-Ultra_main_product.jpg"},
  {id:"ucg-industrial",typ:"boden",hersteller:"Ubiquiti",modell:"UniFi Cloud Gateway Industrial",kurz:"UCG-Industrial",sku:"UCG-Industrial",he:2,zeichnung:"uniDesk",bild:{art:"router",form:"industrie",breite:200,hoehe:45},geraetTiefe:130,info:"Lüfterlos, für raue Umgebung – Maße geschätzt",bildUrl:"https://cdn.ecomm.ui.com/products/b5db03fd-a838-4c6c-a1ee-1451a09d41d4/9635f89d-db57-4d0f-bb2d-40999debed54.png"},
  {id:"udr7",typ:"boden",hersteller:"Ubiquiti",modell:"UniFi Dream Router 7",kurz:"UDR7",sku:"UDR7",he:5,zeichnung:"uniDesk",bild:{art:"router",form:"turm",display:true,breite:110,hoehe:184},geraetTiefe:110,info:"Gateway mit WLAN 7 – Maße geschätzt",bildUrl:"https://linitx.com/images/products/Ubiquiti_UniFi_Dream_Router_All-in-One_WiFi_7_Router_-_UDR7_main_product.jpg"},
  {id:"udr-5g-max",typ:"boden",hersteller:"Ubiquiti",modell:"UniFi Dream Router 5G Max",kurz:"UDR-5G-Max",sku:"UDR-5G-Max",he:5,zeichnung:"uniDesk",bild:{art:"router",form:"turm",display:true,breite:120,hoehe:196},geraetTiefe:120,info:"Gateway mit 5G und WLAN – Maße geschätzt",bildUrl:"https://cdn.ecomm.ui.com/products/59acabe1-9d17-43dc-8015-dfb95897fa11/7da91ff3-a17a-4c0d-80f5-f9f611c6c094.png"},
  {id:"udr",typ:"boden",hersteller:"Ubiquiti",modell:"UniFi Dream Router",kurz:"UDR",sku:"UDR",he:5,zeichnung:"uniDesk",bild:{art:"router",form:"turm",display:true,breite:110,hoehe:184},geraetTiefe:110,info:"Gateway mit WLAN 6 – Maße geschätzt",bildUrl:"https://linitx.com/images/products/Ubiquiti_UniFi_Dream_Router_All-in-One_WiFi_6_Router_-_UDR_main_product.jpg"},
  {id:"ux7",typ:"boden",hersteller:"Ubiquiti",modell:"UniFi Express 7",kurz:"UX7",sku:"UX7",he:2,zeichnung:"uniDesk",bild:{art:"router",form:"wuerfel",breite:117,hoehe:42},geraetTiefe:117,info:"Kleines Gateway mit WLAN 7 – Maße geschätzt",bildUrl:"https://linitx.com/images/products/Ubiquiti_UniFi_Express_Gateway_Access_Point_WiFi_7_Router_-_UX7_main_product.jpg"},
  {id:"ux",typ:"boden",hersteller:"Ubiquiti",modell:"UniFi Express",kurz:"UX",sku:"UX",he:2,zeichnung:"uniDesk",bild:{art:"router",form:"wuerfel",breite:98,hoehe:30},geraetTiefe:98,info:"Kleines Gateway mit WLAN 6 – Maße geschätzt",bildUrl:"https://cdn.ecomm.ui.com/products/4ed25b4c-db92-4b98-bbf3-b0989f007c0e/3ff34453-72fa-485e-b2fa-836b10dbc3be.png"},
  {id:"uxg-max",typ:"boden",hersteller:"Ubiquiti",modell:"UniFi Next-Gen Gateway Max",kurz:"UXG-Max",sku:"UXG-Max",he:2,zeichnung:"uniDesk",bild:{art:"router",form:"flach",breite:142,hoehe:30},geraetTiefe:128,info:"Gateway ohne Controller – Maße geschätzt",bildUrl:"https://linitx.com/images/products/Ubiquiti_UniFi_Next-Generation_Security_Gateway_Max_-_UXG-Max_main_product.jpg"},
  {id:"uxg-lite",typ:"boden",hersteller:"Ubiquiti",modell:"UniFi Next-Gen Gateway Lite",kurz:"UXG-Lite",sku:"UXG-Lite",he:2,zeichnung:"uniDesk",bild:{art:"router",form:"wuerfel",breite:98,hoehe:30},geraetTiefe:98,info:"Gateway ohne Controller – Maße geschätzt",bildUrl:"https://linitx.com/images/products/Ubiquiti_UniFi_Security_Gateway_Lite_-_UXG-Lite_main_product.jpg"},
  {id:"uni-unaspro",typ:"nas",hersteller:"Ubiquiti",modell:"UniFi UNAS Pro",kurz:"UNAS-Pro",sku:"UNAS-Pro",he:1,silber:true,zeichnung:"uniNvr",bild:{schaechte:7},info:"7 Festplatten, Netzwerkspeicher",bildUrl:"https://linitx.com/images/products/Ubiquiti_UNAS-PRO_main_product.jpg"},
  {id:"uni-unvrpro",typ:"nas",hersteller:"Ubiquiti",modell:"UniFi Network Video Recorder Pro",kurz:"UNVR-Pro",sku:"UNVR-Pro",he:2,silber:true,zeichnung:"uniNvr",bild:{schaechte:7},info:"7 Festplatten, Videoüberwachung",bildUrl:"https://cdn.ecomm.ui.com/products/5692c483-9bbf-4ad1-a80a-11e29e1adc3e/d31bf89f-c6b2-4cca-a0dc-b65032046da6.png"},
  {id:"uni-unvr",typ:"nas",hersteller:"Ubiquiti",modell:"UniFi Network Video Recorder",kurz:"UNVR",sku:"UNVR",he:1,silber:true,zeichnung:"uniNvr",info:"4 Festplatten, Videoüberwachung",bildUrl:"https://cdn.ecomm.ui.com/products/8a3b51c6-d3e9-4ea7-95b3-49a1253c4542/b35900e8-c2e4-41d7-82e4-e40f1534c399.png"},
  /* Synology RackStation */
  {id:"syno-rs822",typ:"nas",hersteller:"Synology",modell:"RackStation RS822+",kurz:"RS822+",sku:"RS822+",he:1,zeichnung:"synoRack",info:"4 Festplatten",bildUrl:"https://www.synology.com/img/products/detail/RS822plus/img_og_image.jpg"},
  {id:"syno-rs422",typ:"nas",hersteller:"Synology",modell:"RackStation RS422+",kurz:"RS422+",sku:"RS422+",he:1,zeichnung:"synoRack",info:"4 Festplatten",bildUrl:"https://www.synology.com/img/products/detail/RS422plus/img_og_image.jpg"},
  {id:"syno-rs2423",typ:"nas",hersteller:"Synology",modell:"RackStation RS2423+",kurz:"RS2423+",sku:"RS2423+",he:2,zeichnung:"synoRack",bild:{reihen:3},info:"12 Festplatten",bildUrl:"https://www.synology.com/img/products/detail/RS2423plus/img_og_image.jpg"},
  {id:"syno-rs1221",typ:"nas",hersteller:"Synology",modell:"RackStation RS1221+",kurz:"RS1221+",sku:"RS1221+",he:2,zeichnung:"synoRack",info:"8 Festplatten",bildUrl:"https://www.synology.com/img/products/detail/RS1221plus/img_og_image.jpg"},
  /* AVM FRITZ!Box – liegt auf einem Fachboden (2 HE) */
  {id:"fritz-5590",typ:"boden",hersteller:"AVM",modell:"FRITZ!Box 5590 Fiber",kurz:"FRITZ!Box 5590 Fiber",sku:"5590 Fiber",he:2,zeichnung:"fritz",bild:{rot:true,breite:250,hoehe:48,leds:["Power","Fiber","WLAN","Fon","Info"]},geraetTiefe:180,info:"auf Fachboden",bildUrl:"https://static01.galaxus.com/productimages/1/7/1/2/2/6/8/4/5/1/0/5/3/0/6/7/9/8/4/01a0d4dd-79f0-7544-b4c7-7a00cdc35ead_720.jpeg"},
  /* Tisch-NAS auf Fachboden – Höhe in HE so, dass das Gerät auf den Boden passt */
  {id:"syno-ds923",typ:"boden",hersteller:"Synology",modell:"DiskStation DS923+",kurz:"DS923+",sku:"DS923+",he:4,zeichnung:"desk",bild:{schaechte:4,farbe:"schwarz",breite:199,hoehe:166},geraetTiefe:223,info:"4 Festplatten, auf Fachboden",bildUrl:"https://static01.galaxus.com/productimages/3/6/3/4/3/0/7/0/5/5/9/8/3/8/0/5/9/0/9/1a5b9310-192f-4565-8e87-b6a9163262f9_cropped.jpg_720.jpeg"},
  {id:"syno-ds224",typ:"boden",hersteller:"Synology",modell:"DiskStation DS224+",kurz:"DS224+",sku:"DS224+",he:4,zeichnung:"desk",bild:{schaechte:2,farbe:"schwarz",breite:108,hoehe:165},geraetTiefe:232,info:"2 Festplatten, auf Fachboden",bildUrl:"https://www.synology.com/img/products/detail/DS224plus/img_og_image.jpg"},
  {id:"syno-ds223j",typ:"boden",hersteller:"Synology",modell:"DiskStation DS223j (weiß)",kurz:"DS223j",sku:"DS223j",he:4,zeichnung:"desk",bild:{schaechte:2,farbe:"weiss",breite:100,hoehe:166},geraetTiefe:225,info:"2 Festplatten, weiß, auf Fachboden",bildUrl:"https://www.synology.com/img/products/detail/DS223j/img_og_image.jpg"},
  {id:"ugreen-dxp2800",typ:"boden",hersteller:"UGREEN",modell:"NASync DXP2800",kurz:"DXP2800",sku:"DXP2800",he:5,zeichnung:"ugreen",bild:{schaechte:2,breite:126,hoehe:178},geraetTiefe:240,info:"2 Festplatten, auf Fachboden",bildUrl:"https://static01.galaxus.com/productimages/5/1/0/8/7/2/7/3/7/1/5/1/8/5/3/7/8/7/4/e62f80e3-4e60-4b0a-b1c7-bc482cbe959a_cropped.jpg_720.jpeg"},
  {id:"ugreen-dxp4800p",typ:"boden",hersteller:"UGREEN",modell:"NASync DXP4800 Plus",kurz:"DXP4800 Plus",sku:"DXP4800 Plus",he:5,zeichnung:"ugreen",bild:{schaechte:4,breite:256,hoehe:178,lan10:true},geraetTiefe:260,info:"4 Festplatten, 10 GbE",bildUrl:"https://static01.galaxus.com/productimages/7/7/2/3/5/6/1/4/8/5/3/6/7/0/1/7/2/2/8/18df5a12-5248-4e41-9ac4-b08425b81193_cropped.jpg_720.jpeg"},
  {id:"ugreen-dxp4800",typ:"boden",hersteller:"UGREEN",modell:"NASync DXP4800",kurz:"DXP4800",sku:"DXP4800",he:5,zeichnung:"ugreen",bild:{schaechte:4,breite:256,hoehe:178},geraetTiefe:260,info:"4 Festplatten",bildUrl:"https://www.dateks.lv/images/pic/1200/1200/472/1868.jpg"},
  {id:"ugreen-dxp6800pro",typ:"boden",hersteller:"UGREEN",modell:"NASync DXP6800 Pro",kurz:"DXP6800 Pro",sku:"DXP6800 Pro",he:5,zeichnung:"ugreen",bild:{schaechte:6,breite:300,hoehe:178,lan10:true},geraetTiefe:260,info:"6 Festplatten, 2 × 10 GbE – Maße geschätzt",bildUrl:"https://static01.galaxus.com/productimages/2/8/0/1/9/9/1/8/3/9/2/9/9/6/2/5/9/6/1/9294657d-a22f-414c-b2a2-cacebded00f6_cropped.jpg_720.jpeg"},
  {id:"ugreen-dxp8800plus",typ:"boden",hersteller:"UGREEN",modell:"NASync DXP8800 Plus",kurz:"DXP8800 Plus",sku:"DXP8800 Plus",he:5,zeichnung:"ugreen",bild:{schaechte:8,breite:345,hoehe:205,lan10:true},geraetTiefe:260,info:"8 Festplatten, 2 × 10 GbE – Maße geschätzt",bildUrl:"https://static01.galaxus.com/productimages/7/2/4/1/9/4/5/9/6/4/7/5/5/5/3/5/3/0/3/64baa33b-7159-4dda-b804-7eca99cdb2a9_cropped.jpg_720.jpeg"},
  {id:"ugreen-dxp480tplus",typ:"boden",hersteller:"UGREEN",modell:"NASync DXP480T Plus",kurz:"DXP480T Plus",sku:"DXP480T Plus",he:2,zeichnung:"ugreen",bild:{schaechte:0,breite:178,hoehe:42,lan10:true},geraetTiefe:150,info:"Nur SSD (4 × M.2), flach – Maße geschätzt",bildUrl:"https://static01.galaxus.com/productimages/8/7/2/5/3/7/2/6/9/9/7/8/6/6/7/3/7/3/b43a995c-8f2e-4363-83c2-c7e69c6a28c6_cropped.jpg_720.jpeg"},
  {id:"fritz-6690",typ:"boden",hersteller:"AVM",modell:"FRITZ!Box 6690 Cable",kurz:"FRITZ!Box 6690 Cable",sku:"6690 Cable",he:2,zeichnung:"fritz",bild:{rot:true,breite:250,hoehe:48,leds:["Power","Cable","WLAN","Fon","Info"]},geraetTiefe:180,info:"auf Fachboden, Kabelanschluss",bildUrl:"https://static01.galaxus.com/productimages/6/6/9/7/1/8/8/8/5/7/6/2/5/5/1/0/9/5341b2cb-3fa7-40fb-bfb6-b2d057953ba0_cropped.jpg_720.jpeg"},
  {id:"fritz-5690pro",typ:"boden",hersteller:"AVM",modell:"FRITZ!Box 5690 Pro",kurz:"FRITZ!Box 5690 Pro",sku:"5690 Pro",he:2,zeichnung:"fritz",bild:{rot:true,breite:254,hoehe:63,leds:["Power","Fiber","WLAN","Fon","Info"]},geraetTiefe:180,info:"auf Fachboden, Glasfaser und DSL",bildUrl:"https://static01.galaxus.com/productimages/5/7/1/5/2/1/9/3/1/2/3/5/1/9/0/8/6/7/5/01982037-d83c-70aa-b64a-3acc40dd81a7_720.jpeg"},
  {id:"fritz-7590ax",typ:"boden",hersteller:"AVM",modell:"FRITZ!Box 7590 AX",kurz:"FRITZ!Box 7590 AX",sku:"7590 AX",he:2,zeichnung:"fritz",bild:{rot:true,breite:250,hoehe:48,leds:["Power","DSL","WLAN","Fon","Info"]},geraetTiefe:180,info:"auf Fachboden",bildUrl:"https://static01.galaxus.com/productimages/8/3/7/8/7/4/3/7/1/5/1/8/0/1/8/8/5/6/1/01a0d41c-b088-74a4-bb69-288651ada758_720.jpeg"},
  /* --- UniFi: weitere Switches (Rack) --- */
  {id:"uni-pro24",typ:"switch",hersteller:"Ubiquiti",modell:"UniFi Switch Pro 24",kurz:"USW-Pro-24",sku:"USW-Pro-24",he:1,ports:24,silber:true,zeichnung:"uniSwitch",bild:{rj:24,sfp:2,lcd:true},bildUrl:"https://linitx.com/images/products/Ubiquiti_UniFi_Switch_PRO_24_-_USW-Pro-24_main_product.jpg"},
  {id:"uni-pro48",typ:"switch",hersteller:"Ubiquiti",modell:"UniFi Switch Pro 48",kurz:"USW-Pro-48",sku:"USW-Pro-48",he:1,ports:48,silber:true,zeichnung:"uniSwitch",bild:{rj:48,sfp:4,lcd:true},bildUrl:"https://cdn.ecomm.ui.com/products/17a1db0a-a705-4ea0-b538-2972ca71615a/e5caa219-3faa-48a5-a4e1-d7eea81d738b.png"},
  {id:"uni-promax24",typ:"switch",hersteller:"Ubiquiti",modell:"UniFi Switch Pro Max 24",kurz:"USW-Pro-Max-24",sku:"USW-Pro-Max-24",he:1,ports:24,silber:true,zeichnung:"uniSwitch",bild:{rj:24,sfp:2,lcd:true},bildUrl:"https://linitx.com/images/products/Ubiquiti_UniFi_Pro_Max_24_Network_Switch_-_USW-Pro-Max-24_main_product.jpg"},
  {id:"uni-promax48",typ:"switch",hersteller:"Ubiquiti",modell:"UniFi Switch Pro Max 48",kurz:"USW-Pro-Max-48",sku:"USW-Pro-Max-48",he:1,ports:48,silber:true,zeichnung:"uniSwitch",bild:{rj:48,sfp:4,lcd:true},bildUrl:"https://linitx.com/images/products/Ubiquiti_UniFi_Pro_Max_48_Network_Switch_-_USW-Pro-Max-48_main_product.jpg"},
  {id:"uni-proxg24poe",typ:"switch",hersteller:"Ubiquiti",modell:"UniFi Switch Pro XG 24 PoE",kurz:"USW-Pro-XG-24-PoE",sku:"USW-Pro-XG-24-PoE",he:1,ports:24,poe:true,silber:true,zeichnung:"uniSwitch",bild:{rj:24,sfp:2,lcd:true},info:"10 GbE an allen Ports",bildUrl:"https://cdn.ecomm.ui.com/products/b6f03374-2a31-428c-86fb-62b49739c924/89656ee3-c3f8-424e-b3b1-e493508deffa.png"},
  {id:"uni-proxg48poe",typ:"switch",hersteller:"Ubiquiti",modell:"UniFi Switch Pro XG 48 PoE",kurz:"USW-Pro-XG-48-PoE",sku:"USW-Pro-XG-48-PoE",he:1,ports:48,poe:true,silber:true,zeichnung:"uniSwitch",bild:{rj:48,sfp:4,lcd:true},info:"10 GbE an allen Ports",bildUrl:"https://cdn.ecomm.ui.com/products/b4f97072-47c3-4ea1-96aa-616b94c1ca05/ffad1ad8-f360-420b-9a67-39f12065c33e.png"},
  {id:"uni-ent24poe",typ:"switch",hersteller:"Ubiquiti",modell:"UniFi Switch Enterprise 24 PoE",kurz:"USW-Enterprise-24-PoE",sku:"USW-Enterprise-24-PoE",he:1,ports:24,poe:true,silber:true,zeichnung:"uniSwitch",bild:{rj:24,sfp:2,lcd:true},info:"2,5 GbE",bildUrl:"https://linitx.com/images/products/Ubiquiti_UniFi_24_Port_PoE__Managed_Layer_3_Enterprise_Gigabit_Network_Switch_-_USW-Enterprise-24-PoE_main_product.jpg"},
  {id:"uni-ent48poe",typ:"switch",hersteller:"Ubiquiti",modell:"UniFi Switch Enterprise 48 PoE",kurz:"USW-Enterprise-48-PoE",sku:"USW-Enterprise-48-PoE",he:1,ports:48,poe:true,silber:true,zeichnung:"uniSwitch",bild:{rj:48,sfp:4,lcd:true},info:"2,5 GbE",bildUrl:"https://cdn.ecomm.ui.com/products/81802ee3-ab5d-46f6-b6f7-2abbe2a5968b/99abbce7-11cf-457d-8cab-0418a12a82c7.png"},
  {id:"uni-entxg24",typ:"switch",hersteller:"Ubiquiti",modell:"UniFi Switch Enterprise XG 24",kurz:"USW-EnterpriseXG-24",sku:"USW-EnterpriseXG-24",he:1,ports:24,silber:true,zeichnung:"uniSwitch",bild:{rj:24,sfp:2,lcd:true},info:"10 GbE",bildUrl:"https://cdn.ecomm.ui.com/products/de04b908-bb34-45dd-834f-9b081429aa07/850cf69e-d9bc-4e63-b675-d9d9841f3d07.png"},
  {id:"uni-ecs24poe",typ:"switch",hersteller:"Ubiquiti",modell:"UniFi Switch Enterprise Campus 24 PoE",kurz:"ECS-24-PoE",sku:"ECS-24-PoE",he:1,ports:24,poe:true,silber:true,zeichnung:"uniSwitch",bild:{rj:24,sfp:4,lcd:true},info:"1050 W PoE",bildUrl:"https://cdn.ecomm.ui.com/products/f83443e3-38b7-415b-85cd-e3da1d0c044c/6cae8c8d-f8ab-4207-b0f9-111898f30f66.png"},
  {id:"uni-ecsagg",typ:"switch",hersteller:"Ubiquiti",modell:"UniFi Switch Enterprise Campus Aggregation",kurz:"ECS-Aggregation",sku:"ECS-Aggregation",he:1,ports:32,silber:true,zeichnung:"uniSwitch",bild:{rj:0,sfp:32,lcd:true},info:"Glasfaser-Verteiler (SFP28/QSFP28)",bildUrl:"https://cdn.ecomm.ui.com/products/82c1c564-0e08-4b27-a7b9-95729cca00bd/273218d0-162e-4389-8143-686302547137.png"},
  {id:"uni-proxgagg",typ:"switch",hersteller:"Ubiquiti",modell:"UniFi Switch Pro XG Aggregation",kurz:"USW-Pro-XG-Aggregation",sku:"USW-Pro-XG-Aggregation",he:1,ports:32,silber:true,zeichnung:"uniSwitch",bild:{rj:0,sfp:32,lcd:true},info:"32 × 25G SFP28",bildUrl:"https://cdn.ecomm.ui.com/products/2f42897e-4b8e-4851-af6a-5106211f979e/e541f8bf-a009-427f-815f-7966afbfd1ac.png"},
  {id:"uni-16poe",typ:"switch",hersteller:"Ubiquiti",modell:"UniFi Switch 16 PoE",kurz:"USW-16-PoE",sku:"USW-16-PoE",he:1,ports:16,poe:true,silber:true,zeichnung:"uniSwitch",bild:{rj:16,sfp:2,lcd:false},bildUrl:"https://linitx.com/images/products/Ubiquiti_UniFi_16_Port_PoE__Gen2_Gigabit_Network_Switch_-_USW-16-POE_main_product.jpg"},
  /* --- UniFi: Tisch-Switches auf dem Fachboden --- */
  {id:"uni-lite16poe",typ:"boden",hersteller:"Ubiquiti",modell:"UniFi Switch Lite 16 PoE",kurz:"USW-Lite-16-PoE",sku:"USW-Lite-16-PoE",he:2,zeichnung:"uniDesk",bild:{art:"switch",form:"flach",ports:16,breite:192,hoehe:44},geraetTiefe:185,info:"Maße geschätzt",bildUrl:"https://cdn.ecomm.ui.com/products/e726eace-a772-4f12-bfad-c68baf20e51f/9ecfc657-5e31-4135-89b5-46b3537b35fc.png"},
  {id:"uni-lite8poe",typ:"boden",hersteller:"Ubiquiti",modell:"UniFi Switch Lite 8 PoE",kurz:"USW-Lite-8-PoE",sku:"USW-Lite-8-PoE",he:2,zeichnung:"uniDesk",bild:{art:"switch",form:"flach",ports:8,breite:200,hoehe:31},geraetTiefe:119,info:"Maße geschätzt",bildUrl:"https://linitx.com/images/products/Ubiquiti_UniFi_8_Port_PoE__Gen2_Network_Switch_-_USW-Lite-8-POE_main_product.jpg"},
  {id:"uni-flexmini",typ:"boden",hersteller:"Ubiquiti",modell:"UniFi Switch Flex Mini",kurz:"USW-Flex-Mini",sku:"USW-Flex-Mini",he:1,zeichnung:"uniDesk",bild:{art:"switch",form:"flach",ports:5,breite:108,hoehe:21},geraetTiefe:70,info:"Maße geschätzt",bildUrl:"https://cdn.ecomm.ui.com/products/5a176b22-af34-40f2-820c-958610df1825/19394e07-5146-4f8c-b72d-7fdbdf679c97.png"},
  /* --- UniFi: Speicher und Video --- */
  {id:"uni-unaspro8",typ:"nas",hersteller:"Ubiquiti",modell:"UniFi UNAS Pro 8",kurz:"UNAS-Pro-8",sku:"UNAS-Pro-8",he:2,silber:true,zeichnung:"uniNvr",bild:{schaechte:8},info:"8 Festplatten",bildUrl:"https://cdn.ecomm.ui.com/products/c834c44a-84e4-426f-975b-48f0842396bd/6e6eeaf6-aee7-4694-9858-d4f04c148dd6.png"},
  {id:"uni-unaspro4",typ:"nas",hersteller:"Ubiquiti",modell:"UniFi UNAS Pro 4",kurz:"UNAS-Pro-4",sku:"UNAS-Pro-4",he:1,silber:true,zeichnung:"uniNvr",bild:{schaechte:4},info:"4 Festplatten",bildUrl:"https://cdn.ecomm.ui.com/products/1e8ea561-a3af-4f50-92b4-b7ef3a37a66a/f9894013-e187-4296-8bf6-ca52271d4d89.png"},
  {id:"uni-envr",typ:"nas",hersteller:"Ubiquiti",modell:"UniFi Enterprise NVR",kurz:"ENVR",sku:"ENVR",he:3,silber:true,zeichnung:"uniNvr",bild:{schaechte:16},info:"16 Festplatten, 3 HE",bildUrl:"https://cdn.ecomm.ui.com/products/69d591b5-0c1b-4b75-9361-0f3237df94a7/80b3e786-8416-4a75-a98a-1b3297a1a6b6.png"},
  /* --- UniFi: Strom und Rack-Zubehör --- */
  {id:"uni-pdupro",typ:"pdu",hersteller:"Ubiquiti",modell:"UniFi Power Distribution Pro",kurz:"USP-PDU-Pro",sku:"USP-PDU-Pro",he:2,silber:true,zeichnung:"uniZub",bild:{art:"pdu",dosen:16},info:"Einzeln schaltbare Dosen, per UniFi überwacht – Steckdosenart der EU-Ausführung prüfen",bildUrl:"https://cdn.ecomm.ui.com/products/b178b896-3499-4fa3-8c56-ce2822be933f/deb6718c-8791-46a3-ab20-7e126f743f60.png"},
  {id:"uni-ups2upro",typ:"usv",hersteller:"Ubiquiti",modell:"UniFi UPS 2U Pro",kurz:"UPS 2U Pro",sku:"UPS-2U-Pro",he:2,silber:true,zeichnung:"uniZub",bild:{art:"ups"},info:"USV mit 8 einzeln schaltbaren Dosen",bildUrl:"https://cdn.ecomm.ui.com/products/bd1e065b-9ed7-4753-ac94-b4c0b06bb173/d2bea2d1-57e3-45c8-b5bd-a061d67e94d9.png"},
  {id:"uni-rps",typ:"pdu",hersteller:"Ubiquiti",modell:"UniFi Redundant Power System",kurz:"USP-RPS",sku:"USP-RPS",he:1,silber:true,zeichnung:"uniZub",bild:{art:"rps"},info:"Ersatz-Stromversorgung für UniFi-Geräte",bildUrl:"https://cdn.ecomm.ui.com/products/3b8eb586-5c9a-4c5d-a60a-b6ed0676f33c/b19cd4e2-e1f7-4952-9a21-3c0a55c9861a.png"},
  {id:"uni-patchblank24",typ:"patch",hersteller:"Ubiquiti",modell:"UniFi Keystone-Patchfeld 24 (leer)",kurz:"Keystone-Patchfeld 24",sku:"UACC-Rack-Panel-Patch-Blank-24",he:1,ports:24,farbe:"silber",raster:{key:15,abstand:2.4,gruppe:12,gl:8},geschaetzt:true,keystone:{name:"UniFi Cat6 / Cat6A Keystone Jack (12er-Pack)",artnr:"im UniFi-Store"},info:"Leerer Keystone-Träger, silber",bildUrl:"https://cdn.ecomm.ui.com/products/6ab1a848-c395-4ba6-8295-5caf711dd19e/9fafb528-3340-4789-a24a-b1c83a009c22.png"},
  {id:"uni-blind1",typ:"blind",hersteller:"Ubiquiti",modell:"UniFi Blindblende 1 HE",kurz:"Blindblende 1 HE",sku:"UACC-Rack-Panel-Blank-1U",he:1,silber:true,zeichnung:"uniZub",bild:{art:"blind"},info:"Aus der Serie „Rack Mount OCD Panels“",bildUrl:"https://cdn.ecomm.ui.com/products/24c35f46-e2bf-4085-8fa4-946f927ce372/0d8482e9-f5b6-4c40-a9f4-a69e592db500.png"},
  {id:"uni-blind2",typ:"blind",hersteller:"Ubiquiti",modell:"UniFi Blindblende 2 HE",kurz:"Blindblende 2 HE",sku:"UACC-Rack-Panel-Blank-2U",he:2,silber:true,zeichnung:"uniZub",bild:{art:"blind"},info:"Aus der Serie „Rack Mount OCD Panels“",bildUrl:"https://cdn.ecomm.ui.com/products/24c35f46-e2bf-4085-8fa4-946f927ce372/0d8482e9-f5b6-4c40-a9f4-a69e592db500.png"},
  {id:"uni-vent1",typ:"blind",hersteller:"Ubiquiti",modell:"UniFi Lüftungsblende 1 HE",kurz:"Lüftungsblende 1 HE",sku:"UACC-Rack-Panel-Vented-1U",he:1,silber:true,zeichnung:"uniZub",bild:{art:"blind"},info:"Gelochte Blende für Luftzug",bildUrl:"https://cdn.ecomm.ui.com/products/24c35f46-e2bf-4085-8fa4-946f927ce372/0d8482e9-f5b6-4c40-a9f4-a69e592db500.png"},
  {id:"uni-vent2",typ:"blind",hersteller:"Ubiquiti",modell:"UniFi Lüftungsblende 2 HE",kurz:"Lüftungsblende 2 HE",sku:"UACC-Rack-Panel-Vented-2U",he:2,silber:true,zeichnung:"uniZub",bild:{art:"blind"},info:"Gelochte Blende für Luftzug",bildUrl:"https://cdn.ecomm.ui.com/products/24c35f46-e2bf-4085-8fa4-946f927ce372/0d8482e9-f5b6-4c40-a9f4-a69e592db500.png"},
  {id:"uni-kabel1",typ:"kabel",hersteller:"Ubiquiti",modell:"UniFi Bürstenblende 1 HE",kurz:"Bürstenblende 1 HE",sku:"UACC-Rack-Panel-Brush-1U",he:1,silber:true,zeichnung:"uniZub",bild:{art:"kabel"},info:"Bürstenöffnung 400 × 24 mm",bildUrl:"https://cdn.ecomm.ui.com/products/24c35f46-e2bf-4085-8fa4-946f927ce372/0d8482e9-f5b6-4c40-a9f4-a69e592db500.png"},
  /* --- UniFi: weitere Gateways und Tisch-Switches --- */
  {id:"uxg-enterprise",typ:"router",hersteller:"Ubiquiti",modell:"UniFi Enterprise Security Gateway",kurz:"UXG-Enterprise",sku:"UXG-Enterprise",he:1,silber:true,zeichnung:"uniGateway",bild:{hdd:0,lan:2},info:"Gateway ohne Controller für große Netze – Ports vereinfacht",bildUrl:"https://linitx.com/images/products/Ubiquiti_Enterprise_Security_Gateway_-_UXG-Enterprise_main_product.jpg"},
  {id:"uxg-fiber",typ:"boden",hersteller:"Ubiquiti",modell:"UniFi Next-Gen Gateway Fiber",kurz:"UXG-Fiber",sku:"UXG-Fiber",he:2,zeichnung:"uniDesk",bild:{art:"router",form:"flach",breite:212,hoehe:30},geraetTiefe:128,info:"Gateway ohne Controller, 10G – Maße geschätzt",bildUrl:"https://linitx.com/images/products/Ubiquiti_UniFi_Next-Generation_Security_Gateway_Fiber_-_UXG-Fiber_main_product.jpg"},
  {id:"uni-promax16",typ:"boden",hersteller:"Ubiquiti",modell:"UniFi Switch Pro Max 16",kurz:"USW-Pro-Max-16",sku:"USW-Pro-Max-16",he:2,zeichnung:"uniDesk",bild:{art:"switch",form:"flach",ports:16,breite:212,hoehe:44},geraetTiefe:200,info:"Maße geschätzt",bildUrl:"https://linitx.com/images/products/Ubiquiti_UniFi_Pro_Max_16_Network_Switch_-_USW-Pro-Max-16_main_product.jpg"},
  {id:"uni-promax16poe",typ:"boden",hersteller:"Ubiquiti",modell:"UniFi Switch Pro Max 16 PoE",kurz:"USW-Pro-Max-16-PoE",sku:"USW-Pro-Max-16-PoE",he:2,zeichnung:"uniDesk",bild:{art:"switch",form:"flach",ports:16,breite:212,hoehe:44},geraetTiefe:200,info:"Maße geschätzt",bildUrl:"https://linitx.com/images/products/Ubiquiti_UniFi_Pro_Max_16_PoE_Network_Switch_-_USW-Pro-Max-16-PoE_main_product.jpg"},
  {id:"uni-proxg8poe",typ:"boden",hersteller:"Ubiquiti",modell:"UniFi Switch Pro XG 8 PoE",kurz:"USW-Pro-XG-8-PoE",sku:"USW-Pro-XG-8-PoE",he:2,zeichnung:"uniDesk",bild:{art:"switch",form:"flach",ports:8,breite:212,hoehe:44},geraetTiefe:200,info:"10 GbE – Maße geschätzt",bildUrl:"https://linitx.com/images/products/Ubiquiti_UniFi_Pro_XG_8-Port_PoE_Switch_-_USW-Pro-XG-8-PoE_main_product.jpg"},
  {id:"uni-proxg10poe",typ:"boden",hersteller:"Ubiquiti",modell:"UniFi Switch Pro XG 10 PoE",kurz:"USW-Pro-XG-10-PoE",sku:"USW-Pro-XG-10-PoE",he:2,zeichnung:"uniDesk",bild:{art:"switch",form:"flach",ports:10,breite:212,hoehe:44},geraetTiefe:200,info:"10 GbE – Maße geschätzt",bildUrl:"https://linitx.com/images/products/Ubiquiti_UniFi_Pro_XG_10-Port_PoE_Switch_-_USW-Pro-XG-10-PoE_main_product.jpg"},
  {id:"uni-pro8poe",typ:"boden",hersteller:"Ubiquiti",modell:"UniFi Switch Pro 8 PoE",kurz:"USW-Pro-8-PoE",sku:"USW-Pro-8-PoE",he:2,zeichnung:"uniDesk",bild:{art:"switch",form:"flach",ports:8,breite:200,hoehe:44},geraetTiefe:200,info:"Maße geschätzt",bildUrl:"https://linitx.com/images/products/Ubiquiti_UniFi_Professional_8_PoE_Switch_-_USW-Pro-8-PoE_main_product.jpg"},
  {id:"uni-ultra",typ:"boden",hersteller:"Ubiquiti",modell:"UniFi Switch Ultra",kurz:"USW-Ultra",sku:"USW-Ultra",he:2,zeichnung:"uniDesk",bild:{art:"switch",form:"flach",ports:8,breite:110,hoehe:30},geraetTiefe:110,info:"Klein, auch für Wandmontage – Maße geschätzt",bildUrl:"https://linitx.com/images/products/Ubiquiti_UniFi_Ultra_Network_Switch_-_USW-Ultra_main_product.jpg"},
  /* --- AVM: weitere FRITZ!Boxen --- */
  {id:"fritz-7690",typ:"boden",hersteller:"AVM",modell:"FRITZ!Box 7690",kurz:"FRITZ!Box 7690",sku:"7690",he:2,zeichnung:"fritz",bild:{rot:true,breite:254,hoehe:63,leds:["Power","DSL","WLAN","Fon","Info"]},geraetTiefe:180,info:"DSL, WLAN 7",bildUrl:"https://static01.galaxus.com/productimages/7/8/9/0/7/7/5/0/4/8/8/9/3/0/2/9/3/7/2/01a0b394-7e46-7d7c-b646-bc029fa485ab_720.jpeg"},
  {id:"fritz-7530ax",typ:"boden",hersteller:"AVM",modell:"FRITZ!Box 7530 AX",kurz:"FRITZ!Box 7530 AX",sku:"7530 AX",he:2,zeichnung:"fritz",bild:{breite:210,hoehe:42,leds:["Power","DSL","WLAN","Fon","Info"]},geraetTiefe:150,info:"DSL",bildUrl:"https://static01.galaxus.com/productimages/3/3/5/7/3/4/7/8/8/6/0/8/2/7/7/5/2/8/2/01a0a481-94a8-7242-9a3c-ae058c66fa93_720.jpeg"},
  {id:"fritz-7682",typ:"boden",hersteller:"AVM",modell:"FRITZ!Box 7682",kurz:"FRITZ!Box 7682",sku:"7682",he:2,zeichnung:"fritz",bild:{rot:true,breite:254,hoehe:63,leds:["Power","DSL","WLAN","Fon","Info"]},geraetTiefe:180,info:"DSL inkl. G.fast",bildUrl:"https://static01.galaxus.com/productimages/4/0/6/4/3/4/7/6/6/2/9/1/2/2/5/6/9/0/4/01981e3c-5c73-70d6-8506-e8e738074248_720.jpeg"},
  {id:"fritz-6670",typ:"boden",hersteller:"AVM",modell:"FRITZ!Box 6670 Cable",kurz:"FRITZ!Box 6670 Cable",sku:"6670 Cable",he:2,zeichnung:"fritz",bild:{rot:true,breite:254,hoehe:63,leds:["Power","Cable","WLAN","Fon","Info"]},geraetTiefe:180,info:"Kabel (DOCSIS 3.1), WLAN 7",bildUrl:"https://static01.galaxus.com/productimages/5/6/7/4/2/8/7/4/5/8/1/8/3/1/1/0/5/9/6/1da725eb-e082-4bf9-b079-e55711ca46cb_cropped.jpg_720.jpeg"},
  {id:"fritz-6660",typ:"boden",hersteller:"AVM",modell:"FRITZ!Box 6660 Cable",kurz:"FRITZ!Box 6660 Cable",sku:"6660 Cable",he:2,zeichnung:"fritz",bild:{breite:210,hoehe:42,leds:["Power","Cable","WLAN","Fon","Info"]},geraetTiefe:150,info:"Kabel (DOCSIS 3.1)",bildUrl:"https://static01.galaxus.com/productimages/8/9/4/8/2/4/7/1/3/0/3/8/1/8/5/8/2/8/5054c08e-99fb-4c57-827a-d17e21a630e0_cropped.jpg_720.jpeg"},
  {id:"fritz-5530",typ:"boden",hersteller:"AVM",modell:"FRITZ!Box 5530 Fiber",kurz:"FRITZ!Box 5530 Fiber",sku:"5530 Fiber",he:2,zeichnung:"fritz",bild:{breite:210,hoehe:42,leds:["Power","Fiber","WLAN","Fon","Info"]},geraetTiefe:150,info:"Glasfaser",bildUrl:"https://static01.galaxus.com/productimages/3/3/0/4/6/1/5/3/7/8/8/8/7/4/9/4/6/5/01a01b67-92cd-70ac-b5cd-169b749eb411_720.jpeg"},
  {id:"fritz-4690",typ:"boden",hersteller:"AVM",modell:"FRITZ!Box 4690",kurz:"FRITZ!Box 4690",sku:"4690",he:2,zeichnung:"fritz",bild:{rot:true,breite:254,hoehe:63,leds:["Power","Internet","WLAN","Fon","Info"]},geraetTiefe:180,info:"Router hinter Glasfaser- oder Kabelmodem, 10-GbE-Port",bildUrl:"https://static01.galaxus.com/productimages/8/9/5/0/2/3/6/5/5/5/5/7/0/9/7/6/0/9/019729b2-374e-7275-80b4-e3416a812c04_720.jpeg"},
  {id:"fritz-4060",typ:"boden",hersteller:"AVM",modell:"FRITZ!Box 4060",kurz:"FRITZ!Box 4060",sku:"4060",he:2,zeichnung:"fritz",bild:{breite:210,hoehe:42,leds:["Power","Internet","WLAN","Fon","Info"]},geraetTiefe:180,info:"Router hinter Modem, 2,5-GbE-WAN",bildUrl:"https://static01.galaxus.com/productimages/1/9/7/8/1/1/7/2/7/3/1/6/8/8/7/3/9/8/6/902e8390-03b5-4d74-92fc-89ff54a578b1_cropped.jpg_720.jpeg"},
  /* --- Modems: DSL und Glasfaser (ONT) --- */
  {id:"draytek-167",typ:"boden",hersteller:"DrayTek",modell:"Vigor 167",kurz:"Vigor 167",sku:"Vigor 167",he:2,zeichnung:"kiste",bild:{art:"modem",farbe:"schwarz",breite:176,hoehe:37,leds:["PWR","ACT","DSL","LAN"],logo:"DrayTek"},geraetTiefe:110,info:"VDSL-Modem (Supervectoring) – Router dahinter per Netzwerkkabel",bildUrl:"https://static01.galaxus.com/productimages/8/8/8/7/5/8/3/3/9/2/8/2/0/4/1/3/1/0/3/01a0ae66-ddf3-7c36-ab51-752bb6f6f13c_720.jpeg"},
  {id:"genexis-fibertwist",typ:"boden",hersteller:"Genexis",modell:"FiberTwist P2410",kurz:"FiberTwist",sku:"P2410",he:2,zeichnung:"kiste",bild:{art:"modem",farbe:"weiss",breite:110,hoehe:46,leds:["Power","Fiber","LAN"],logo:"GENEXIS"},geraetTiefe:110,info:"Glasfaser-Modem (ONT), u. a. Deutsche Glasfaser – 110 × 110 × 46 mm",bildUrl:"https://genexis.eu/wp-content/uploads/2024/08/FiberTwist-P3410B-01.png"},
  {id:"telekom-gfm2",typ:"boden",hersteller:"Telekom",modell:"Glasfaser-Modem 2",kurz:"Glasfaser-Modem 2",he:2,zeichnung:"kiste",bild:{art:"modem",farbe:"weiss",breite:140,hoehe:34,leds:["Power","Fiber","LAN"],logo:"T"},geraetTiefe:130,info:"Glasfaser-Modem (ONT) der Telekom – Maße geschätzt",bildUrl:"https://static01.galaxus.com/productimages/3/3/5/3/1/2/0/1/9/2/5/7/3/4/6/3/7/0/9/01a0d4fb-43dc-7fdb-aa62-c3e3fc16d48e_720.jpeg"},
  /* --- aus dem Serverschrank Elektro Irrgang (Fotos Okt. 2026) --- */
  {id:"bintec-beipplus",typ:"boden",hersteller:"bintec elmeg",modell:"be.IP plus",kurz:"be.IP plus",sku:"5510000388",he:2,zeichnung:"kiste",bild:{art:"router",farbe:"weiss",breite:327,hoehe:44,leds:["Power","DSL","WLAN","LAN","ISDN"],logo:"bintec elmeg"},geraetTiefe:193,info:"Router mit Telefonanlage (VDSL, ISDN/SIP, WLAN) – Maße der V2"},
  {id:"apc-br1500g",typ:"boden",hersteller:"APC",modell:"Back-UPS Pro 1500",kurz:"Back-UPS Pro 1500",sku:"BR1500G-GR",he:7,zeichnung:"kiste",bild:{art:"usv",farbe:"schwarz",breite:112,hoehe:301,logo:"APC"},geraetTiefe:382,info:"USV als Standgerät (1500 VA / 865 W, 6 Schuko) – auf Fachboden oder Schrankboden",bildUrl:"https://www.tdbaltic.ee/images/ds4/BR1500G-GR-01.jpg"},
  {id:"terra-miniserver",typ:"boden",hersteller:"Wortmann",modell:"TERRA MINISERVER",kurz:"TERRA MINISERVER",he:7,zeichnung:"kiste",bild:{art:"server",farbe:"schwarz",breite:200,hoehe:270,logo:"terra"},geraetTiefe:340,info:"Kleiner Tower-Server – Maße der G5, ältere Generationen ähnlich"},
  {id:"syno-ds216se",typ:"boden",hersteller:"Synology",modell:"DiskStation DS216se (weiß)",kurz:"DS216se",sku:"DS216se",he:4,zeichnung:"desk",bild:{schaechte:2,farbe:"weiss",breite:100,hoehe:165},geraetTiefe:226,info:"2 Festplatten, weiß, auf Fachboden",bildUrl:"https://static01.galaxus.com/productimages/3/7/9/5/9/7/6/0/6/8/5/8/5/7/4/3/5/9/3/01a09ad0-2de8-725c-9339-91882f6ab300_sea.jpeg"},
  {id:"syno-ds220plus",typ:"boden",hersteller:"Synology",modell:"DiskStation DS220+",kurz:"DS220+",sku:"DS220+",he:4,zeichnung:"desk",bild:{schaechte:2,farbe:"schwarz",breite:108,hoehe:165},geraetTiefe:232,info:"2 Festplatten, auf Fachboden",bildUrl:"https://static01.galaxus.com/productimages/3/6/2/0/7/1/2/8/5.jpg_720.jpeg"},
  {id:"btr-modultraeger24",typ:"patch",hersteller:"BTR Netcom",modell:"Modulträger 1 HE 24 Port (heute Metz Connect)",kurz:"BTR Modulträger 24",he:1,ports:24,farbe:"hell",raster:{key:15,abstand:2,gruppe:6,gl:10},keystone:{name:"BTR/Metz E-DAT modul"},geschaetzt:true,info:"Älterer Modulträger von BTR Netcom – entspricht dem Metz-Connect-Modulträger"},
  {id:"inline-buerste1",typ:"kabel",hersteller:"InLine",modell:"19-Zoll-Bürstenleiste 1 HE, schwarz",kurz:"InLine Bürstenleiste",he:1,info:"Kabeldurchführung mit Bürste"}];
const ecRkKat=id=>id&&EC_RKKAT.find(k=>k.id===id)||null;
const ecRkKatName=K=>K.modell.startsWith(K.hersteller.split(" ")[0])?K.modell:`${K.hersteller} ${K.modell}`;
const ecRkKatNr=K=>K.artnr?`Art.-Nr. ${K.artnr}`:K.sku?`Typ ${K.sku}`:"";
const ecRkKatLetzt=typ=>{ try{ return (JSON.parse(localStorage.getItem("irrgang_rk_kat")||"{}"))[typ]||""; }catch(e){ return ""; } };
const ecRkKatMerken=(typ,id)=>{ try{ const m=JSON.parse(localStorage.getItem("irrgang_rk_kat")||"{}"); m[typ]=id||""; localStorage.setItem("irrgang_rk_kat",JSON.stringify(m)); }catch(e){} };
const ecRkKatAnwenden=(z,K)=>{ if(K){ z.kat=K.id; z.he=K.he; if(K.ports) z.ports=K.ports; if(z.typ!=="patch"){ z.name=K.kurz||K.modell; z.poe=!!K.poe; if(K.tiefe) z.tiefe=K.tiefe; } } else z.kat=""; return z; };
let ecRkKatModus=null;   /* {neu:true,typ,pos} beim Einsetzen, {neu:false} beim Ändern im Teil-Dialog */
function ecRkKatDlg(){ const m=ecRkKatModus; if(!m) return; const typ=m.typ, L=EC_RKKAT.filter(k=>k.typ===typ), letzt=ecRkKatLetzt(typ), akt=m.neu?letzt:(ecDlg&&ecDlg.rk&&ecDlg.rk.kat)||"";
  const S=[...L].sort((a,b)=>(b.id===letzt)-(a.id===letzt));
  dialog(`${EC_RK[typ]} – Modell`,ecListe([...S.map(K=>ecLi({act:"ecRkKatSet",id:K.id,lead:`${K.he} HE`,breit:true,ton:K.id===akt?"plus":"",kopf:esc(ecRkKatName(K)),
      text:esc([ecRkKatNr(K),K.info||(K.ports&&typ!=="router"?`${K.ports} Ports`:""),K.raster?`je ${K.raster.gruppe} in Gruppen`:"",K.keystone?`für ${K.keystone.name}`:"",K.id===letzt?"zuletzt benutzt":""].filter(Boolean).join(" · "))})),
    ecLi({act:"ecRkKatSet",id:"",lead:icon("edit"),kopf:"Ohne Modell",text:"Ports und Höhe selbst festlegen"})])
    +(L.some(K=>K.geschaetzt)?`<p class="m3-hinweis">Raster beim hellen und schwarzen Modulträger wie beim Edelstahl angenommen – noch nicht nachgemessen.</p>`:""),
    `<span style="flex:1"></span><button class="btn-text" data-act="${m.neu?"cancel":"ecRkKatZurueck"}">${m.neu?"Abbrechen":"Zurück"}</button>`); }
const ecRkDefs=()=>`<svg class="rk-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>
  <linearGradient id="rkgInox" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E9EBEC"/><stop offset=".08" stop-color="#D9DCDE"/><stop offset=".55" stop-color="#C9CDD0"/><stop offset=".92" stop-color="#BABEC2"/><stop offset="1" stop-color="#8E9398"/></linearGradient>
  <pattern id="rkpInox" width="482.6" height="14" patternUnits="userSpaceOnUse">${RK_INOX}</pattern>
  <linearGradient id="rkgUni" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBFBFC"/><stop offset=".1" stop-color="#EEF0F2"/><stop offset=".88" stop-color="#DDE0E3"/><stop offset="1" stop-color="#B7BCC1"/></linearGradient>
  <linearGradient id="rkgUniLcd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#14243F"/><stop offset="1" stop-color="#070C16"/></linearGradient>
  <linearGradient id="rkgSyno" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#34373C"/><stop offset=".1" stop-color="#25272B"/><stop offset=".9" stop-color="#1B1C1F"/><stop offset="1" stop-color="#0E0F11"/></linearGradient>
  <linearGradient id="rkgFritz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".55" stop-color="#F4F5F6"/><stop offset=".9" stop-color="#E2E4E7"/><stop offset="1" stop-color="#C9CDD1"/></linearGradient>
  <linearGradient id="rkgUgreen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4A4E54"/><stop offset=".08" stop-color="#5E6369"/><stop offset=".92" stop-color="#585D63"/><stop offset="1" stop-color="#3F4348"/></linearGradient>
  <pattern id="rkpSchlitz" width="4" height="6" patternUnits="userSpaceOnUse"><rect width="4" height="6" fill="#D5D9DD"/><rect x=".8" y=".8" width="2.4" height="4.4" rx="1.2" fill="#8E959C"/></pattern>
  <linearGradient id="rkgHell" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ECEDEA"/><stop offset=".12" stop-color="#DEE0DC"/><stop offset=".9" stop-color="#CDD0CB"/><stop offset="1" stop-color="#A9ADA8"/></linearGradient>
  <linearGradient id="rkgBlk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#34363B"/><stop offset=".08" stop-color="#26282C"/><stop offset=".92" stop-color="#1A1B1E"/><stop offset="1" stop-color="#0E0F10"/></linearGradient>
  <linearGradient id="rkgSil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FAFBFC"/><stop offset=".1" stop-color="#E9ECEF"/><stop offset=".9" stop-color="#D3D7DC"/><stop offset="1" stop-color="#AEB3B9"/></linearGradient>
  <linearGradient id="rkgEar" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#18191B"/><stop offset=".5" stop-color="#2C2E32"/><stop offset="1" stop-color="#1E1F22"/></linearGradient>
  <linearGradient id="rkgEarS" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#C9CDD2"/><stop offset=".5" stop-color="#ECEFF2"/><stop offset="1" stop-color="#C2C7CC"/></linearGradient>
  <radialGradient id="rkgScrew" cx=".35" cy=".35" r=".7"><stop offset="0" stop-color="#F2F4F6"/><stop offset=".5" stop-color="#9AA0A7"/><stop offset="1" stop-color="#55595F"/></radialGradient>
  <linearGradient id="rkgCage" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D9DDE1"/><stop offset="1" stop-color="#7F858C"/></linearGradient>
  <linearGradient id="rkgLcd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#BFEAF5"/><stop offset="1" stop-color="#6FAFC6"/></linearGradient>
  <linearGradient id="rkgKey" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#D9DCDF"/></linearGradient>
  <linearGradient id="rkgTray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5A5E65"/><stop offset="1" stop-color="#2A2C30"/></linearGradient>
  <linearGradient id="rkgDev" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".85" stop-color="#E6E8EB"/><stop offset="1" stop-color="#C8CCD1"/></linearGradient>
  <linearGradient id="rkgDevD" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3B3E44"/><stop offset="1" stop-color="#1C1D20"/></linearGradient>
  <linearGradient id="rkgRed" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF6A5E"/><stop offset="1" stop-color="#B3261E"/></linearGradient>
  <pattern id="rkpBrush" width="1.4" height="10" patternUnits="userSpaceOnUse"><rect width="1.4" height="10" fill="#0C0C0D"/><rect width=".5" height="10" fill="#34373C"/></pattern>
  <pattern id="rkpVent" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="skewX(-20)"><rect width="5" height="5" fill="#16171A"/><rect x="0" y="0" width="2.4" height="5" fill="#050506"/></pattern>
  <pattern id="rkpHex" width="6" height="5.2" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.3" r="1.1" fill="#0A0A0B"/><circle cx="4.5" cy="3.9" r="1.1" fill="#0A0A0B"/></pattern>
  <pattern id="rkpHexL" width="6" height="5.2" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.3" r="1.1" fill="rgba(0,0,0,.28)"/><circle cx="4.5" cy="3.9" r="1.1" fill="rgba(0,0,0,.28)"/></pattern>
</defs></svg>`;
/* Bauteile */
const rkOhr=(x,H,silber)=>{ let h=`<rect x="${x}" y=".4" width="16.5" height="${H-.8}" rx="1" fill="url(#${silber?"rkgEarS":"rkgEar"})"/>`;
  for(let u=0;u*RK_U<H-1;u++) [6.35,38.1].forEach(o=>{ const y=u*RK_U+o; if(y>H-3) return; h+=`<rect x="${x+4.6}" y="${y-2.3}" width="7.3" height="4.6" rx="2.3" fill="#050506"/><circle cx="${x+8.25}" cy="${y}" r="2.7" fill="url(#rkgScrew)"/><path d="M${x+6.9} ${y}h2.7M${x+8.25} ${y-1.35}v2.7" stroke="#3A3D42" stroke-width=".6"/>`; });
  return h; };
const rkKoerper=(H,fill)=>`<rect x="16.5" y=".6" width="449.6" height="${H-1.2}" rx="1.2" fill="${fill}"/><rect x="16.5" y=".6" width="449.6" height=".8" fill="rgba(255,255,255,.12)"/>`;
/* RJ45-Buchse: Rahmen, Öffnung, Rastnase, Kontakte */
const rkRj=(x,y,w,h,rahmen)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx=".6" fill="${rahmen||"#0A0B0C"}"/><rect x="${x+1.1}" y="${y+1.1}" width="${w-2.2}" height="${h-3.4}" rx=".3" fill="#000"/><rect x="${x+w/2-2}" y="${y+h-2.4}" width="4" height="1.6" fill="#000"/><rect x="${x+2}" y="${y+1.6}" width="${w-4}" height=".7" fill="#A88A3D"/>`;
const rkLed=(x,y,an,farbe)=>`<rect x="${x}" y="${y}" width="2.6" height="1.6" rx=".4" fill="${an?(farbe||"#3DDC84"):"#2E3135"}"/>`;
const rkText=(x,y,t,o={})=>`<text x="${x}" y="${y}" font-size="${o.fs||4.4}" font-weight="${o.fw||600}" fill="${o.fill||"#C9CDD2"}" text-anchor="${o.anchor||"start"}" letter-spacing=".2">${esc(t)}</text>`;
/* ---- Gerätezeichnungen aus dem Katalog (Frontansicht, Maße in mm; 19" = 482,6 mm, 1 HE = 44,45 mm) ----
   Je Modell eine Bauart: UniFi-Switch, UniFi-Gateway, UNVR, Synology RackStation, FRITZ!Box auf Fachboden. Aufbau nach Herstellerfotos, Maße angenähert. */
/* UniFi-Touchdisplay: quadratisch (1,3"), schwarzes Glas; zeigt Name, IP, Portübersicht und Last */
const rkUniLcd=(x,y,w)=>{ const q=w, g=q-4; let h=`<rect x="${x}" y="${y}" width="${q}" height="${q}" rx="2" fill="#050608" stroke="#2A2D33" stroke-width=".5"/><rect x="${x+.8}" y="${y+.8}" width="${q-1.6}" height="${q-1.6}" rx="1.4" fill="url(#rkgUniLcd)"/>`
    +`<rect x="${x+2.4}" y="${y+2.6}" width="${g*.62}" height="1.5" rx=".75" fill="#F2F6FF"/><rect x="${x+2.4}" y="${y+5.3}" width="${g*.42}" height="1" rx=".5" fill="#8EA6C8"/>`;
  for(let r=0;r<2;r++) for(let c=0;c<6;c++){ const an=(r*6+c)%4!==3; h+=`<rect x="${x+2.4+c*(g/6)}" y="${y+q*.42+r*3.1}" width="${g/6-.8}" height="2.2" rx=".4" fill="${an?"#2FBF71":"#2A2F38"}"/>`; }
  return h+`<rect x="${x+2.4}" y="${y+q-5}" width="${g}" height="1.8" rx=".9" fill="#1F2733"/><rect x="${x+2.4}" y="${y+q-5}" width="${g*.58}" height="1.8" rx=".9" fill="#1F6FEB"/>`
    +`<path d="M${x+1} ${y+1}h${q*.55}l-${q*.35} ${q*.5}H${x+1}z" fill="rgba(255,255,255,.05)"/>`; };
const rkUniLogo=()=>"";
/* RJ45 der UniFi-Geräte: schwarze Buchse in hellem Rahmen, LED-Streifen oben */
const rkUniRj=(x,y,w,h,an,farbe)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx=".7" fill="#1B1D21"/><rect x="${x+.9}" y="${y+1.6}" width="${w-1.8}" height="${h-3.6}" rx=".3" fill="#050506"/><rect x="${x+w/2-2}" y="${y+h-2.3}" width="4" height="1.5" fill="#050506"/><rect x="${x+1.8}" y="${y+2.2}" width="${w-3.6}" height=".6" fill="#A88A3D"/>`
  +`<rect x="${x+.8}" y="${y+.35}" width="${w-1.6}" height=".7" rx=".35" fill="${an?(farbe||"#E9F3FF"):"#3A3D42"}" opacity="${an?.95:.7}"/>`;
const rkSfp=(x,y,w,h)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx=".5" fill="url(#rkgCage)"/><rect x="${x+1.3}" y="${y+2.1}" width="${w-2.6}" height="${h-4.2}" fill="#0A0B0C"/><rect x="${x+1.3}" y="${y+h-1.6}" width="${w-2.6}" height=".7" fill="#5C6168"/>`;
/* Portfeld: n Ports in 2 Reihen (ungerade oben), Gruppen mit kleiner Lücke; liefert SVG und Breite */
function rkUniFeld(x0,H,n,gruppe,pitch,o={}){ const sp=Math.ceil(n/2), w=pitch-1.4, jh=10.6, y1=H/2-jh-1.1, y2=H/2+1.1; let h="";
  for(let i=0;i<sp;i++){ const x=x0+i*pitch+Math.floor(i/gruppe)*3.6;
    for(let r=0;r<2;r++){ const nr=i*2+r+1; if(nr>n) continue; h+=rkUniRj(x,r?y2:y1,w,jh,(nr*5)%7!==0,o.farbe&&o.farbe(nr)); } }
  return {h,w:sp*pitch+Math.floor((sp-1)/gruppe)*3.6}; }
const RK_ZEICH={
  /* UniFi-Switch (Gen2 Pro / Pro Max / Standard): Display links, Ports in 2 Reihen, SFP rechts */
  uniSwitch:(K,t,H)=>{ const Z=K.bild, n=Z.rj, sfp=Z.sfp||0, sc=Math.ceil(sfp/2), rechts=466.1-7-sc*15.4, links=Z.lcd?64:34;
    const gruppe=Z.gruppe||(n>24?8:6), sp=Math.ceil(n/2), gl=Math.floor((sp-1)/gruppe)*3.6, pitch=Math.min(14.6,(rechts-6-links-gl)/sp);
    const F=rkUniFeld(0,H,n,gruppe,pitch), x0=links+Math.max(0,(rechts-6-links-F.w)/2);
    let h=rkKoerper(H,"url(#rkgUni)")+(Z.lcd?rkUniLcd(25,H/2-11.5,23):"")+rkUniLogo(Z.lcd?26:24,4.2,"#8E949B")
      +rkUniFeld(x0,H,n,gruppe,pitch,{farbe:nr=>Z.schnell&&nr>n-Z.schnell?"#7FB2FF":null}).h;
    for(let i=0;i<sfp;i++) h+=rkSfp(rechts+3+Math.floor(i/2)*15.4,i%2?H/2+1.1:H/2-11.7,13.8,10.6);
    return h; },
  /* UniFi-Gateway (UDM Pro / SE / Pro Max): Display, 8 LAN + WAN + 2 SFP+, rechts HDD-Schacht */
  uniGateway:(K,t,H)=>{ const Z=K.bild, b=Z.hdd==null?1:Z.hdd, lan=Z.lan==null?8:Z.lan; let h=rkKoerper(H,"url(#rkgUni)")+rkUniLcd(25,H/2-11.5,23)+rkUniLogo(26,4.2,"#8E949B");
    const F=lan?rkUniFeld(68,H,lan,4,14.4,{farbe:nr=>Z.poe&&nr<=Z.poe?"#F5C451":null}):{h:"",w:0}; h+=F.h;
    const xw=68+(lan?F.w+8:0); h+=rkUniRj(xw,H/2-11.7,13,10.6,true,"#7FB2FF")+rkSfp(xw+16,H/2-11.7,13.8,10.6)+rkSfp(xw+16,H/2+1.1,13.8,10.6)
      +rkText(xw+6.5,H/2+8.4,"WAN",{fs:3.2,fw:700,fill:"#8E949B",anchor:"middle"});
    const bx0=b>1?250:300, bw=(466.1-8-bx0-(b-1)*4)/b;
    for(let i=0;i<b;i++){ const x=bx0+i*(bw+4), y=6, hh=H-12; h+=`<rect x="${x}" y="${y}" width="${bw}" height="${hh}" rx="2.2" fill="#E3E6E9" stroke="#AEB4BA" stroke-width=".5"/><rect x="${x+3}" y="${y+3}" width="${bw-26}" height="${hh-6}" rx="1.4" fill="url(#rkpSchlitz)"/>`
      +`<rect x="${x+bw-19}" y="${y+hh/2-6}" width="14" height="12" rx="2" fill="#CDD2D7" stroke="#9AA1A8" stroke-width=".5"/><rect x="${x+bw-15}" y="${y+hh/2-1}" width="6" height="2" rx="1" fill="#7C838B"/>`; }
    return h; },
  /* UniFi UNVR: Display, 4 Festplatten-Schächte */
  uniNvr:(K,t,H)=>{ const nb=(K.bild&&K.bild.schaechte)||4, rr=t.he>1?2:1, sp=Math.ceil(nb/rr); let h=rkKoerper(H,"url(#rkgUni)")+rkUniLcd(25,H/2-11.5,23)+rkUniLogo(26,4.2,"#8E949B"); const x0=66, bw=(466.1-8-x0-(sp-1)*3)/sp;
    for(let i=0;i<nb;i++){ const col=i%sp, row=Math.floor(i/sp), hh0=(H-10-(rr-1)*3)/rr; const x=x0+col*(bw+3), y=5+row*(hh0+3), hh=hh0; h+=`<rect x="${x}" y="${y}" width="${bw}" height="${hh}" rx="2" fill="#E3E6E9" stroke="#AEB4BA" stroke-width=".5"/><rect x="${x+4}" y="${y+4}" width="${Math.max(4,bw-24)}" height="${hh-8}" rx="1.2" fill="url(#rkpSchlitz)"/><rect x="${x+bw-16}" y="${y+hh/2-5}" width="11" height="10" rx="1.8" fill="#CDD2D7" stroke="#9AA1A8" stroke-width=".5"/>`+rkLed(x+bw-12,y+4,true,"#4FA8FF"); }
    return h; },
  /* Synology RackStation: schwarz, links Taster und LEDs, Laufwerksträger mit Lochmuster */
  synoRack:(K,t,H)=>{ const r=(K.bild&&K.bild.reihen)||Math.max(1,t.he>1?2:1), c=4, x0=82, bw=(466.1-8-x0-(c-1)*3)/c, bh=(H-10-(r-1)*3)/r;
    let h=rkKoerper(H,"url(#rkgSyno)")+rkText(24,10.5,"Synology",{fs:5.2,fw:700,fill:"#D7DADE"})+rkText(24,15.6,K.kurz||K.modell,{fs:3.4,fw:600,fill:"#8E939B"})
      +`<circle cx="31" cy="${H-11}" r="4.6" fill="#2A2C30" stroke="#5D6168" stroke-width=".6"/><circle cx="31" cy="${H-11}" r="2.2" fill="none" stroke="#4FA8FF" stroke-width=".8" style="filter:drop-shadow(0 0 .8px #4FA8FF)"/>`
      +["#3DDC84","#3DDC84","#F2B233","#3A3D42"].map((f,i)=>`<circle cx="${45+i*6.5}" cy="${H-11}" r="1.4" fill="${f}"/>`).join("");
    for(let j=0;j<r;j++) for(let i=0;i<c;i++){ const x=x0+i*(bw+3), y=5+j*(bh+3);
      h+=`<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="1.4" fill="#2B2E33" stroke="#0E0F11" stroke-width=".8"/><rect x="${x+3}" y="${y+3}" width="${bw-30}" height="${bh-6}" rx="1" fill="url(#rkpHex)"/>`
        +`<rect x="${x+bw-25}" y="${y+bh/2-4}" width="15" height="8" rx="4" fill="#3A3E44" stroke="#55595F" stroke-width=".5"/>`+`<circle cx="${x+bw-6}" cy="${y+bh/2-3}" r="1.2" fill="#3DDC84"/><circle cx="${x+bw-6}" cy="${y+bh/2+2}" r="1.2" fill="${(i+j)%2?"#3DDC84":"#2E3135"}"/>`; }
    return h; },
  /* UniFi-Tischgerät auf dem Fachboden: flach (Cloud Gateway), Turm (Dream Router), Würfel (Express), Industrie (dunkles Metall mit Rippen) */
  uniDesk:(K,t,H)=>{ const Z=K.bild, f=Z.form||"flach", dw=Z.breite||140, dh=Math.min(H-10,Z.hoehe||30), dx=(RK_B-dw)/2, dy=H-6-dh-1.6, dk=f==="industrie", rx=f==="turm"?10:f==="wuerfel"?6:4;
    const led=(x,y,w)=>`<rect x="${x}" y="${y}" width="${w}" height="1.6" rx=".8" fill="#5AB4FF" style="filter:drop-shadow(0 0 1.2px #5AB4FF)"/>`;
    let h=rkBoden(H)+`<rect x="${dx+8}" y="${dy+dh}" width="10" height="1.6" rx=".8" fill="#2A2C30"/><rect x="${dx+dw-18}" y="${dy+dh}" width="10" height="1.6" rx=".8" fill="#2A2C30"/>`
      +`<rect x="${dx}" y="${dy}" width="${dw}" height="${dh}" rx="${rx}" fill="${dk?"url(#rkgSyno)":"url(#rkgFritz)"}" stroke="${dk?"#0E0F11":"#C9CDD1"}" stroke-width=".5"/>`
      +(dk?"":`<rect x="${dx+2}" y="${dy+1}" width="${dw-4}" height="${Math.min(6,dh*.15)}" rx="${Math.max(1,rx-2)}" fill="rgba(255,255,255,.8)"/>`);
    if(f==="turm"){ const q=Math.min(20,dw*.2); if(Z.display) h+=rkUniLcd(dx+dw/2-q/2,dy+16,q);
      for(let r=0;r<9;r++) for(let c=0;c<7;c++) h+=`<circle cx="${dx+dw/2-24+c*8}" cy="${dy+dh*.48+r*7}" r="1.5" fill="#D5D9DD"/>`;
      h+=led(dx+dw/2-9,dy+dh-12,18); }
    else if(f==="wuerfel"){ h+=led(dx+dw/2-12,dy+dh-6,24); }
    else if(f==="industrie"){ for(let i=0;i<14;i++) h+=`<rect x="${dx+dw*.32+i*((dw*.62)/14)}" y="${dy+5}" width="3" height="${dh-10}" rx="1" fill="#1F2124" stroke="#3A3D42" stroke-width=".4"/>`;
      h+=["#3DDC84","#3DDC84","#5AB4FF"].map((c2,i)=>`<circle cx="${dx+12+i*7}" cy="${dy+dh/2}" r="1.6" fill="${c2}"/>`).join("")+rkText(dx+10,dy+9,"UniFi",{fs:4,fw:700,fill:"#C9CDD2"}); }
    else if(Z.ports){ const n=Z.ports, pw=Math.min(12,(dw-30)/n-1.4), ph=Math.min(10,dh-10); for(let i=0;i<n;i++) h+=rkUniRj(dx+14+i*(pw+1.4),dy+dh/2-ph/2,pw,ph,false,null);
      h+=led(dx+4,dy+dh/2-.8,6); }
    else { const q=Math.min(dh-8,20); if(Z.display) h+=rkUniLcd(dx+10,dy+dh/2-q/2,q);
      h+=led(dx+dw-34,dy+dh/2-.8,22); }
    return h; },
  /* UGREEN NASync: Aluminium dunkelgrau, links Leiste mit Ein-Taste (Lichtring), Status-LEDs, USB-C, USB-A, SD; rechts Laufwerksträger mit Lüftungsrippen, Laufwerks-LED und Entriegelung */
  ugreen:(K,t,H)=>{ const Z=K.bild, sw=Z.schaechte||0, dw=Z.breite||256, dh=Math.min(H-10,Z.hoehe||178), dx=(RK_B-dw)/2, dy=H-6-dh-1.6, flach=!sw;
    let h=rkBoden(H)+`<rect x="${dx+8}" y="${dy+dh}" width="14" height="1.6" rx=".8" fill="#1E2023"/><rect x="${dx+dw-22}" y="${dy+dh}" width="14" height="1.6" rx=".8" fill="#1E2023"/>`
      +`<rect x="${dx}" y="${dy}" width="${dw}" height="${dh}" rx="6" fill="url(#rkgUgreen)" stroke="#2A2D31" stroke-width=".6"/>`
      +`<rect x="${dx+1.5}" y="${dy+1}" width="${dw-3}" height="2.4" rx="1.2" fill="rgba(255,255,255,.28)"/><rect x="${dx}" y="${dy+dh-4}" width="${dw}" height="4" rx="2" fill="rgba(0,0,0,.25)"/>`;
    if(flach){ h+=rkText(dx+12,dy+dh/2+2,"UGREEN",{fs:6,fw:800,fill:"#E6E8EA"})+`<circle cx="${dx+dw-16}" cy="${dy+dh/2}" r="4.2" fill="#2B2E32" stroke="#8FD1FF" stroke-width=".9" style="filter:drop-shadow(0 0 1px #8FD1FF)"/>`
        +[0,1,2,3].map(i=>`<rect x="${dx+dw-44+i*6}" y="${dy+dh/2-.8}" width="3.6" height="1.6" rx=".8" fill="${i<3?"#3DDC84":"#4A4E54"}"/>`).join(""); return h; }
    const L=Math.min(30,dw*.14), lx=dx+5, ly=dy+8, lh=dh-16;
    h+=`<rect x="${lx}" y="${ly}" width="${L}" height="${lh}" rx="3" fill="rgba(0,0,0,.18)"/>`
      +`<text transform="translate(${lx+L/2+1.6},${ly+lh*.32}) rotate(-90)" font-size="5.2" font-weight="800" fill="#E6E8EA" text-anchor="middle" letter-spacing=".6">UGREEN</text>`
      +`<circle cx="${lx+L/2}" cy="${ly+lh*.62}" r="5.2" fill="#2B2E32" stroke="#8FD1FF" stroke-width="1" style="filter:drop-shadow(0 0 1.2px #8FD1FF)"/><circle cx="${lx+L/2}" cy="${ly+lh*.62}" r="2" fill="none" stroke="#C9CDD2" stroke-width=".6"/>`
      +["#3DDC84","#3DDC84","#4A4E54"].map((c,i)=>`<rect x="${lx+L/2-5+i*4}" y="${ly+lh*.62+9}" width="2.4" height="1.4" rx=".7" fill="${c}"/>`).join("")
      +`<rect x="${lx+L/2-3}" y="${ly+lh-26}" width="6" height="2.6" rx="1.3" fill="#121315" stroke="#5A5F66" stroke-width=".4"/>`
      +`<rect x="${lx+L/2-4}" y="${ly+lh-19}" width="8" height="3.6" rx=".6" fill="#121315" stroke="#5A5F66" stroke-width=".4"/><rect x="${lx+L/2-3}" y="${ly+lh-18}" width="6" height="1.2" fill="#2F6BFF"/>`
      +`<rect x="${lx+L/2-4.5}" y="${ly+lh-11}" width="9" height="1.4" rx=".7" fill="#121315" stroke="#5A5F66" stroke-width=".3"/>`;
    const bx=lx+L+5, bw=(dx+dw-6-bx-(sw-1)*2.2)/sw, by=dy+8, bh=dh-16;
    h+=`<rect x="${bx-1.5}" y="${by-1.5}" width="${dx+dw-6-bx+3}" height="${bh+3}" rx="3" fill="#15171A"/>`;
    for(let i=0;i<sw;i++){ const x=bx+i*(bw+2.2);
      h+=`<rect x="${x}" y="${by}" width="${bw}" height="${bh}" rx="2" fill="#2C2F34" stroke="#3E4248" stroke-width=".5"/>`;
      const n=Math.max(3,Math.floor((bw-8)/3.2)); for(let j=0;j<n;j++) h+=`<rect x="${x+4+j*3.2}" y="${by+6}" width="1.4" height="${bh*.42}" rx=".7" fill="#1C1E21"/>`;
      h+=`<rect x="${x+bw/2-4}" y="${by+3}" width="8" height="1.2" rx=".6" fill="#3DDC84" style="filter:drop-shadow(0 0 .8px #3DDC84)"/>`
        +`<rect x="${x+3}" y="${by+bh-22}" width="${bw-6}" height="15" rx="2.5" fill="#383C42" stroke="#4C5157" stroke-width=".4"/><rect x="${x+bw/2-5}" y="${by+bh-15.5}" width="10" height="2" rx="1" fill="#22252A"/>`
        +rkText(x+bw/2,by+bh-3,String(i+1),{fs:3.2,fw:700,fill:"#80868D",anchor:"middle"}); }
    return h; },
  /* Kleine Kiste auf dem Fachboden (Modem, ONT): Farbe, Logo, LED-Reihe mit Beschriftung */
  kiste:(K,t,H)=>{ const Z=K.bild, dw=Z.breite||140, dh=Math.min(H-10,Z.hoehe||34), dx=(RK_B-dw)/2, dy=H-6-dh-1.6, w=Z.farbe==="weiss", L=Z.leds||[];
    let h=rkBoden(H)+`<rect x="${dx+8}" y="${dy+dh}" width="10" height="1.6" rx=".8" fill="#2A2C30"/><rect x="${dx+dw-18}" y="${dy+dh}" width="10" height="1.6" rx=".8" fill="#2A2C30"/>`
      +`<rect x="${dx}" y="${dy}" width="${dw}" height="${dh}" rx="5" fill="${w?"url(#rkgFritz)":"url(#rkgSyno)"}" stroke="${w?"#C9CDD1":"#0E0F11"}" stroke-width=".5"/>`
      +`<rect x="${dx+2}" y="${dy+1}" width="${dw-4}" height="3" rx="1.5" fill="${w?"rgba(255,255,255,.8)":"rgba(255,255,255,.12)"}"/>`
      +(Z.logo==="T"?`<rect x="${dx+9}" y="${dy+dh/2-5}" width="10" height="10" rx="1.5" fill="#E20074"/>`+rkText(dx+14,dy+dh/2+3.2,"T",{fs:8,fw:900,fill:"#FFF",anchor:"middle"})
        :rkText(dx+9,dy+dh/2+2,Z.logo||"",{fs:5,fw:800,fill:w?"#4A4F55":"#D7DADE"}));
    const sx=Math.min(16,(dw*.5)/Math.max(1,L.length)), x0=dx+dw-10-sx*(L.length-1);
    L.forEach((l,i)=>{ const x=x0+i*sx; h+=`<circle cx="${x}" cy="${dy+dh/2-2}" r="1.4" fill="${i<L.length-1?"#33D17A":"#4A4E54"}"/>`+rkText(x,dy+dh/2+4.2,l,{fs:2.4,fw:600,fill:w?"#7A7F86":"#9AA0A6",anchor:"middle"}); });
    return h; },
  /* UniFi-Zubehör im Rack (silber): Blindblende, Kabelführung, Steckdosenleiste Pro, USV, Redundante Stromversorgung */
  uniZub:(K,t,H)=>{ const a=(K.bild||{}).art; let h=rkKoerper(H,"url(#rkgUni)");
    if(a==="blind"){ for(let r=0;r<Math.max(1,Math.round(H/14));r++) for(let c=0;c<40;c++) h+=`<circle cx="${70+c*8.6}" cy="${H/2+(r-(Math.round(H/14)-1)/2)*8}" r="1" fill="#C4C9CE"/>`; return h; }
    if(a==="kabel"){ return h+`<rect x="30" y="${H*.28}" width="422" height="${H*.44}" rx="${H*.22}" fill="#2A2D31"/><rect x="34" y="${H*.48}" width="414" height=".8" fill="#4A4E54"/>`; }
    h+=rkUniLcd(25,H/2-11.5,23);
    if(a==="pdu"){ const n=(K.bild||{}).dosen||16, rows=t.he>1?2:1, per=Math.ceil(n/rows), x0=62, dxp=(466.1-12-x0)/per, hh=(H-12-(rows-1)*4)/rows;
      for(let r=0;r<rows;r++) for(let c=0;c<per;c++){ const x=x0+c*dxp, y=6+r*(hh+4); h+=`<rect x="${x+2}" y="${y}" width="${dxp-4}" height="${hh}" rx="3" fill="#E7EAED" stroke="#AEB4BA" stroke-width=".5"/><circle cx="${x+dxp/2-2.5}" cy="${y+hh/2}" r="1.4" fill="#2A2D31"/><circle cx="${x+dxp/2+2.5}" cy="${y+hh/2}" r="1.4" fill="#2A2D31"/><circle cx="${x+dxp-5}" cy="${y+3.4}" r=".9" fill="#3DDC84"/>`; }
      return h; }
    if(a==="ups"){ h+=`<rect x="60" y="6" width="250" height="${H-12}" rx="2" fill="url(#rkpVent)" opacity=".55"/>`;
      for(let i=0;i<4;i++) h+=`<rect x="${325+i*9}" y="${H/2-1}" width="6" height="2" rx="1" fill="${i<3?"#3DDC84":"#C4C9CE"}"/>`;
      return h+`<circle cx="440" cy="${H/2}" r="5" fill="#E7EAED" stroke="#9AA1A8" stroke-width=".7"/><circle cx="440" cy="${H/2}" r="2" fill="none" stroke="#3B8BEB" stroke-width=".8"/>`; }
    if(a==="rps"){ for(let i=0;i<6;i++) h+=`<rect x="${70+i*30}" y="${H/2-6}" width="22" height="12" rx="3" fill="#2A2D31"/><circle cx="${81+i*30}" cy="${H/2}" r="2.4" fill="#5A5F66"/>`; return h; }
    return h; },
  /* FRITZ!Box liegend auf einem Fachboden */
  /* FRITZ!Box liegend: gewölbte weiße Front, Lüftungsschlitze, rotes Logo, LED-Reihe mit Beschriftung, Tasten; 7590 mit rotem Deckel */
  fritz:(K,t,H)=>{ const Z=K.bild, dw=Z.breite||250, fh=Math.min(H-22,Z.hoehe||48), tp=Math.max(8,Math.min(22,H-10-fh)), dx=(RK_B-dw)/2, dy=H-6-fh-tp-1.2, fy=dy+tp, rot=!!Z.rot, ins=Math.min(14,dw*.05);
    const L=Z.leds||["Power","Fiber","WLAN","Fon","Info"], tg=`fz${K.id.replace(/[^a-z0-9]/gi,"")}`;
    let h=rkBoden(H)+`<defs><linearGradient id="${tg}t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${rot?"#B80016":"#E9EBEE"}"/><stop offset="1" stop-color="${rot?"#E3001B":"#FAFBFC"}"/></linearGradient>
      <linearGradient id="${tg}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".7" stop-color="#F1F2F4"/><stop offset="1" stop-color="#D9DCE0"/></linearGradient></defs>`
      +`<ellipse cx="${dx+dw/2}" cy="${H-6}" rx="${dw*.48}" ry="2.2" fill="rgba(0,0,0,.35)"/>`
      /* Oberseite in leichter Draufsicht – bei den großen Modellen rot */
      +`<path d="M${dx+ins} ${dy}H${dx+dw-ins}L${dx+dw} ${fy}H${dx}Z" fill="url(#${tg}t)" stroke="${rot?"#9E0013":"#C9CDD1"}" stroke-width=".4" stroke-linejoin="round"/>`
      +`<text x="${dx+ins+10}" y="${dy+tp*.68}" font-size="${Math.min(10,tp*.62)}" font-weight="900" font-style="italic" fill="${rot?"#FFFFFF":"#E2001A"}" letter-spacing="-.3" font-family="Arial Black,Arial,sans-serif">FRITZ!</text>`
      /* Vorderseite: weiß, unten gerundet, Kante oben hell */
      +`<path d="M${dx} ${fy}H${dx+dw}V${fy+fh-6}Q${dx+dw} ${fy+fh} ${dx+dw-6} ${fy+fh}H${dx+6}Q${dx} ${fy+fh} ${dx} ${fy+fh-6}Z" fill="url(#${tg}f)" stroke="#C3C7CB" stroke-width=".4"/>`
      +`<rect x="${dx+.6}" y="${fy}" width="${dw-1.2}" height="1.1" fill="${rot?"#FF4D5E":"#FFFFFF"}" opacity=".9"/>`;
    /* LED-Reihe mit Beschriftung, Tasten links davon */
    const sp=Math.min(20,(dw*.52)/L.length), lx=dx+dw-16-sp*(L.length-1), ly=fy+fh*.34;
    L.forEach((l,i)=>{ const x=lx+i*sp, an=i<3; h+=`<rect x="${x-3.4}" y="${ly}" width="6.8" height="2.2" rx="1.1" fill="${an?"#3DDC84":"#D3D7DB"}"${an?' style="filter:drop-shadow(0 0 1.2px #3DDC84)"':""}/>`+rkText(x,ly+7,l,{fs:2.8,fw:600,fill:"#80868D",anchor:"middle"}); });
    ["Connect","WLAN"].forEach((l,i)=>{ const x=dx+18+i*24; h+=`<rect x="${x}" y="${ly-1.6}" width="18" height="5.4" rx="2.7" fill="#F7F8F9" stroke="#BFC4C9" stroke-width=".5"/>`+rkText(x+9,ly+9,l,{fs:2.6,fw:600,fill:"#9AA0A6",anchor:"middle"}); });
    /* Lüftungsschlitze unten */
    const n=Math.floor((dw-40)/3.4); for(let i=0;i<n;i++) h+=`<rect x="${dx+20+i*3.4}" y="${fy+fh-11}" width="1.5" height="4" rx=".75" fill="#D8DBDF"/>`;
    h+=rkText(dx+dw-14,fy+fh-15,K.kurz.replace(/^FRITZ!Box\s*/,""),{fs:3,fw:700,fill:"#A3A8AE",anchor:"end"});
    return h; },
  /* Tischgerät auf dem Fachboden: Synology DiskStation (schwarz oder weiß) und UGREEN NASync */
  desk:(K,t,H)=>{ const Z=K.bild, sw=Z.schaechte||2, dw=Z.breite||(sw>2?200:108), dh=Math.min(H-10,Z.hoehe||166), dx=(RK_B-dw)/2, dy=H-6-dh-1.6, weiss=Z.farbe==="weiss", ug=Z.marke==="ugreen";
    const grund=ug?"url(#rkgUgreen)":weiss?"url(#rkgFritz)":"url(#rkgSyno)", schrift=weiss?"#5F6368":"#C9CDD2";
    let h=rkBoden(H)+`<rect x="${dx+6}" y="${dy+dh}" width="12" height="1.8" rx=".9" fill="#2A2C30"/><rect x="${dx+dw-18}" y="${dy+dh}" width="12" height="1.8" rx=".9" fill="#2A2C30"/>`
      +`<rect x="${dx}" y="${dy}" width="${dw}" height="${dh}" rx="${ug?5:4}" fill="${grund}" stroke="${weiss?"#C9CDD1":"#0E0F11"}" stroke-width=".6"/>`;
    if(weiss&&!Z.schaechteSichtbar){ /* DiskStation „j“: geschlossene weiße Front */
      h+=`<rect x="${dx+6}" y="${dy+8}" width="${dw-12}" height="${dh-30}" rx="3" fill="rgba(0,0,0,.035)"/>`+rkText(dx+dw/2,dy+dh*.42,"Synology",{fs:7,fw:700,fill:"#4A4F55",anchor:"middle"})
        +["STATUS","LAN","DISK 1","DISK 2"].map((l,i)=>`<circle cx="${dx+14+i*((dw-28)/3)}" cy="${dy+dh-16}" r="1.5" fill="${i<3?"#33D17A":"#C9CDD2"}"/>`+rkText(dx+14+i*((dw-28)/3),dy+dh-11.5,l,{fs:2.6,fw:600,fill:"#8E939A",anchor:"middle"})).join("")
        +`<circle cx="${dx+dw/2}" cy="${dy+dh-26}" r="3.6" fill="#F4F5F6" stroke="#9AA0A6" stroke-width=".7"/><circle cx="${dx+dw/2}" cy="${dy+dh-26}" r="1.6" fill="none" stroke="#4FA8FF" stroke-width=".6"/>`;
      return h; }
    const leiste=ug?22:18, bx=dx+leiste, bw=(dw-leiste-6-(sw-1)*2.4)/sw, by=dy+(ug?12:6), bh=dh-(ug?18:12);
    for(let i=0;i<sw;i++){ const x=bx+i*(bw+2.4);
      h+=ug?`<rect x="${x}" y="${by}" width="${bw}" height="${bh}" rx="2" fill="#2A2D31" stroke="#121315" stroke-width=".5"/><rect x="${x+bw/2-3}" y="${by+6}" width="6" height="${bh*.5}" rx="3" fill="#3B3F45"/><rect x="${x+bw/2-1.2}" y="${by+bh-10}" width="2.4" height="5" rx="1.2" fill="#33D17A"/>`
        :`<rect x="${x}" y="${by}" width="${bw}" height="${bh}" rx="1.6" fill="${weiss?"#ECEDEE":"#2B2E33"}" stroke="${weiss?"#BFC3C7":"#0E0F11"}" stroke-width=".6"/><rect x="${x+3}" y="${by+4}" width="${bw-6}" height="${bh*.62}" rx="1" fill="url(#rkpHex)" opacity="${weiss?.25:1}"/><rect x="${x+bw/2-4}" y="${by+bh*.62+9}" width="8" height="14" rx="4" fill="${weiss?"#D5D8DB":"#3A3E44"}"/><circle cx="${x+bw/2}" cy="${by+bh-6}" r="1.3" fill="#33D17A"/>`; }
    h+=ug?rkText(dx+leiste/2,dy+7.6,"UGREEN",{fs:3.6,fw:800,fill:"#E8EAED",anchor:"middle"})+`<circle cx="${dx+leiste/2}" cy="${dy+dh-14}" r="3.4" fill="#26282C" stroke="#55C1FF" stroke-width=".7"/>`+`<rect x="${dx+leiste/2-3}" y="${dy+dh-30}" width="6" height="3" rx="1" fill="#0E0F11"/><rect x="${dx+leiste/2-2}" y="${dy+dh-24}" width="4" height="2.2" rx="1" fill="#0E0F11"/>`
      :`<text transform="translate(${dx+leiste/2+1.3},${dy+52}) rotate(-90)" font-size="4" font-weight="700" fill="${schrift}" text-anchor="middle" letter-spacing=".3">Synology</text>`+`<circle cx="${dx+leiste/2}" cy="${dy+dh-12}" r="3.2" fill="${weiss?"#F4F5F6":"#26282C"}" stroke="#4FA8FF" stroke-width=".7"/>`+[0,1,2].map(i=>`<circle cx="${dx+leiste/2}" cy="${dy+24+i*6}" r="1.2" fill="${i<2?"#33D17A":"#F2B233"}"/>`).join("");
    return h; }
};
const rkBoden=H=>`<rect x="16.5" y="${H-6}" width="449.6" height="5" rx="1" fill="url(#rkgTray)"/><rect x="16.5" y="${H-6}" width="449.6" height=".8" fill="rgba(255,255,255,.18)"/>`;
/* gebürsteter Edelstahl: feine waagrechte Striche, einmal erzeugt (feste Zufallsfolge, damit es bei jedem Zeichnen gleich aussieht) */
const RK_INOX=(()=>{ let s=11; const rnd=()=>(s=(s*16807)%2147483647)/2147483647; let o="";
  for(let i=0;i<280;i++){ const y=(rnd()*14).toFixed(2), x=(rnd()*520-30).toFixed(1), w=(20+rnd()*300).toFixed(1), hh=(.04+rnd()*.16).toFixed(2), a=(.08+rnd()*.26).toFixed(3); o+=`<rect x="${x}" y="${y}" width="${w}" height="${hh}" fill="${rnd()<.55?"#FFFFFF":"#4E5359"}" opacity="${a}"/>`; }
  return o; })();
function ecRkTeilHtml(pr,g,s,t,M){
  const he=t.he||1, H=he*RK_U, N=String(t.name||""), silber=/unifi|ubiquiti|ubnt/i.test(N)&&["switch","router"].includes(t.typ);
  let h="";
  const KP=t.typ==="patch"&&ecRkKat(t.kat), KZ=ecRkKat(t.kat), ZF=KZ&&KZ.zeichnung&&RK_ZEICH[KZ.zeichnung];
  if(ZF) h+=ZF(KZ,t,H);
  else if(KP&&KP.raster&&Math.max(1,+t.ports||24)<=24){ const n=Math.max(1,+t.ports||24), R=KP.raster, gr=Math.ceil(n/R.gruppe), W=n*R.key+(n-gr)*R.abstand+(gr-1)*R.gl, x0=(482.6-W)/2, ph=Math.min(17,H-15), y=H-ph-6;
    const body=KP.farbe==="edelstahl"?"url(#rkgInox)":KP.farbe==="schwarz"?"url(#rkgBlk)":KP.farbe==="silber"?"url(#rkgUni)":"url(#rkgHell)", tc=KP.farbe==="schwarz"?"#C9CDD2":"#2A2C30", loch=KP.farbe==="schwarz"?"#060607":"#141517";
    h+=rkKoerper(H,body)+(KP.farbe==="edelstahl"?`<rect x="16.5" y=".6" width="449.6" height="${H-1.2}" rx="1.2" fill="url(#rkpInox)"/>`:"")+rkText(19.5,7.6,`P${t.nr}`,{fs:5.4,fw:800,fill:tc});
    for(let i=0;i<n;i++){ const nr=i+1, gx=Math.floor(i/R.gruppe), x=x0+i*(R.key+R.abstand)+gx*(R.gl-R.abstand), L=t.voll?null:M.get(`${t.nr}.${nr}`);
      if(t.voll){ h+=rkText(x+R.key/2,y-1.8,nr,{fs:5.2,fw:700,fill:tc,anchor:"middle"})+`<rect x="${x}" y="${y}" width="${R.key}" height="${ph}" rx=".8" fill="url(#rkgSil)" stroke="#7E8389" stroke-width=".35"/>${rkRj(x+2,y+2.2,R.key-4,ph-5,"#4A4E54")}<rect x="${x+3}" y="${y+ph-2}" width="${R.key-6}" height=".8" rx=".4" fill="#9AA0A6"/>`; continue; }
      h+=rkText(x+R.key/2,y-1.8,nr,{fs:5.2,fw:700,fill:tc,anchor:"middle"});
      if(!L){ h+=`<g><title>${t.nr}.${nr} frei</title><rect x="${x}" y="${y}" width="${R.key}" height="${ph}" rx=".8" fill="${loch}"/><rect x="${x}" y="${y}" width="${R.key}" height="1.2" fill="rgba(0,0,0,.35)"/></g>`; continue; }
      const st=ecNetStand(pr,L[0]), kl=L.length>1?"bad":st==="ok"?"ok":st==="bad"?"bad":"belegt";
      h+=`<g class="rk-pg ${kl}" data-act="ecRkPort" data-id="${esc(L[0].d.id)}"><title>${esc(`${t.nr}.${nr} · ${ecRaumName(g,L[0].raumId)}${L.length>1?" · doppelt vergeben":""}`)}</title><rect x="${x}" y="${y}" width="${R.key}" height="${ph}" rx=".8" fill="url(#rkgSil)" stroke="#7E8389" stroke-width=".35"/>${rkRj(x+2,y+2.2,R.key-4,ph-5,"#4A4E54")}<rect x="${x+3}" y="${y+ph-2}" width="${R.key-6}" height=".8" rx=".4" fill="#9AA0A6"/>${ecPkStecker(g,L[0],x+2.4,y+3,R.key-4.8,ph-6)}${kl!=="belegt"?`<rect x="${x}" y="${y+ph+1}" width="${R.key}" height="1.8" rx=".5" fill="${kl==="ok"?"#3DDC84":"#FF5A5F"}"/>`:""}</g>`; } }
  else if(t.typ==="patch"){ const n=Math.max(1,+t.ports||24), zwei=n>24, pro=zwei?Math.ceil(n/2):n, gruppe=6, gruppen=Math.ceil(pro/gruppe), x0=42, breit=466.1-6-x0, luecke=6, pw=Math.min(14.2,(breit-(gruppen-1)*luecke)/pro-1.4);
    h+=rkKoerper(H,"url(#rkgBlk)")+`<rect x="20" y="${H/2-7}" width="19" height="14" rx="1" fill="#F2F1EC"/>`+rkText(29.5,H/2+2.6,`P${t.nr}`,{fs:7,fw:800,fill:"#1E1F22",anchor:"middle"});
    for(let r=0;r<(zwei?2:1);r++) for(let i=0;i<pro;i++){ const nr=zwei?(i*2+r+1):(i+1); if(nr>n) continue;
      const gx=Math.floor(i/gruppe), x=x0+i*(pw+1.4)+gx*luecke, y=zwei?(r?24:7.5):15.5, ph=zwei?12:14.5, L=M.get(`${t.nr}.${nr}`);
      if(!zwei) h+=rkText(x+pw/2,11.4,nr,{fs:pw>12?5:4.2,fw:700,fill:"#A9AEB5",anchor:"middle"});
      if(!L){ h+=`<g><title>${t.nr}.${nr} frei</title><rect x="${x}" y="${y}" width="${pw}" height="${ph}" rx=".8" fill="#202226" stroke="#34373C" stroke-width=".5"/></g>`; continue; }
      const st=ecNetStand(pr,L[0]), kl=L.length>1?"bad":st==="ok"?"ok":st==="bad"?"bad":"belegt";
      h+=`<g class="rk-pg ${kl}" data-act="ecRkPort" data-id="${esc(L[0].d.id)}"><title>${esc(`${t.nr}.${nr} · ${ecRaumName(g,L[0].raumId)}${L.length>1?" · doppelt vergeben":""}`)}</title><rect x="${x-.6}" y="${y-.6}" width="${pw+1.2}" height="${ph+1.2}" rx="1" fill="url(#rkgKey)"/>${rkRj(x+1.1,y+1.2,pw-2.2,ph-2.6)}${ecPkStecker(g,L[0],x+1.5,y+1.8,pw-3,ph-3.6)}${kl!=="belegt"?`<rect x="${x}" y="${y+ph+(zwei?.4:1)}" width="${pw}" height="${zwei?1.1:1.8}" rx=".5" fill="${kl==="ok"?"#3DDC84":"#FF5A5F"}"/>`:""}</g>`; } }
  else if(t.typ==="switch"||t.typ==="router"){ const n=t.typ==="router"?8:Math.max(1,+t.ports||24), body=silber?"url(#rkgSil)":"url(#rkgBlk)", txt=silber?"#3A3D42":"#C9CDD2", rahmen=silber?"#2A2C30":"#0A0B0C";
    const zwei=n>8, pro=zwei?Math.ceil(n/2):n, blk=n>16?6:4, bl=Math.ceil(pro/blk), sfp=t.typ==="router"?2:n>=24?4:2, sc=zwei?Math.ceil(sfp/2):Math.min(sfp,2), rechts=466.1-8-sc*15.6-10;
    const links=t.typ==="router"?140:118, pt=Math.min(12.8,(rechts-links-(bl-1)*5)/pro), pw=pt-1.2, x0=t.typ==="router"?links:Math.max(links,rechts-(pro*pt+(bl-1)*5));
    h+=rkKoerper(H,body)+rkText(22,H/2-1,ecRkKurz(N||EC_RK[t.typ]).replace(/^(UniFi|Ubiquiti)\s+/i,""),{fs:7,fw:700,fill:txt})+(t.poe?`<rect x="22" y="${H/2+3}" width="17" height="7.5" rx="1.2" fill="#F2C14E"/>`+rkText(30.5,H/2+8.6,"PoE",{fs:5.4,fw:800,fill:"#1E2024",anchor:"middle"}):"")+rkLed(t.poe?43:22,H/2+5.6,true,"#4FA8FF");
    if(t.typ==="router") h+=`<rect x="98" y="${H/2-8}" width="30" height="16" rx="1.5" fill="#0B0C0E"/><rect x="100" y="${H/2-6}" width="26" height="12" rx="1" fill="url(#rkgLcd)" opacity=".9"/>`+rkText(113,H/2+1.6,"WAN ok",{fs:3.2,fw:700,fill:"#0B2533",anchor:"middle"});
    for(let r=0;r<(zwei?2:1);r++) for(let i=0;i<pro;i++){ const nr=zwei?(i*2+r+1):(i+1); if(nr>n) continue; const x=x0+i*pt+Math.floor(i/blk)*5, y=zwei?(r?23.2:8.4):16;
      h+=rkRj(x,y,pw,10.6,rahmen)+rkLed(x+.8,zwei?(r?34.6:5.6):13.4,(nr*7)%5!==0,(nr%3===0&&t.poe)?"#F2B233":"#3DDC84"); }
    for(let i=0;i<(zwei?sfp:sc);i++){ const x=rechts+10+(zwei?Math.floor(i/2):i)*15.6, y=zwei?(i%2?23.2:8.4):16; h+=`<rect x="${x}" y="${y}" width="13.8" height="10.6" rx=".5" fill="url(#rkgCage)"/><rect x="${x+1.4}" y="${y+2.2}" width="11" height="6.2" fill="#0A0B0C"/>`; }
    if(t.typ==="switch") h+=`<rect x="${rechts-2}" y="${H/2-4}" width="7" height="6" rx=".8" fill="${rahmen}"/>`; }
  else if(t.typ==="luefter"){ h+=rkKoerper(H,"url(#rkgBlk)")+rkText(22,H/2+2.4,"FAN",{fs:7,fw:800,fill:"#8E939B"});
    [130,200,270,340].forEach(cx=>{ const cy=H/2, r=Math.min(18,H/2-3); h+=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="#0B0C0D" stroke="#3E4247" stroke-width="1"/>${[.82,.6,.38].map(f=>`<circle cx="${cx}" cy="${cy}" r="${r*f}" fill="none" stroke="#3A3D42" stroke-width=".8"/>`).join("")}<path d="M${cx-r*.7} ${cy-r*.7}L${cx+r*.7} ${cy+r*.7}M${cx+r*.7} ${cy-r*.7}L${cx-r*.7} ${cy+r*.7}" stroke="#3A3D42" stroke-width=".9"/><circle cx="${cx}" cy="${cy}" r="${r*.18}" fill="#3A3D42"/>`; });
    h+=`<rect x="392" y="${H/2-5.5}" width="26" height="11" rx="1" fill="#06140C"/>`+rkText(405,H/2+2,"24 °C",{fs:5,fw:700,fill:"#5EF29A",anchor:"middle"})+`<rect x="430" y="${H/2-7}" width="8" height="14" rx="1.2" fill="#111"/><rect x="430.8" y="${H/2-6.2}" width="6.4" height="6" rx=".8" fill="#2E3135"/>`; }
  else if(t.typ==="usv"){ const m=H/2; h+=rkKoerper(H,"url(#rkgBlk)")+`<rect x="24" y="5" width="${he>1?220:150}" height="${H-10}" rx="2" fill="url(#rkpVent)"/>`;
    const px=he>1?258:186, pw2=466.1-8-px, py=he>1?14:5, ph2=H-py*2;
    h+=`<rect x="${px}" y="${py}" width="${pw2}" height="${ph2}" rx="3" fill="#202226" stroke="#34373C" stroke-width=".6"/><rect x="${px+10}" y="${m-9}" width="64" height="18" rx="1.5" fill="url(#rkgLcd)"/>`+rkText(px+14,m-1,"230 V  50 Hz",{fs:4.4,fw:700,fill:"#0B2533"})+rkText(px+14,m+5.5,"Last 34 %  Akku 100 %",{fs:3.4,fw:600,fill:"#173B4A"})
      +[0,1,2,3].map(i=>`<circle cx="${px+88+i*9}" cy="${m}" r="3" fill="#33363B" stroke="#4A4E54" stroke-width=".5"/>`).join("")
      +`<circle cx="${px+pw2-18}" cy="${m}" r="6.5" fill="#26282C" stroke="#3DDC84" stroke-width="1.6" style="filter:drop-shadow(0 0 1.2px #3DDC84)"/><path d="M${px+pw2-18} ${m-3.6}v3.2" stroke="#9AA0A6" stroke-width="1.1"/>`
      +(he>1?rkText(px+pw2-6,py+ph2-4,ecRkKurz(N||"USV"),{fs:6.5,fw:700,fill:"#A9AEB5",anchor:"end"}):""); }
  else if(t.typ==="pdu"){ const k=he>1?12:8, x0=58, dx=(466.1-14-x0)/k; h+=rkKoerper(H,"url(#rkgBlk)")+`<rect x="26" y="${H/2-8}" width="11" height="16" rx="1.5" fill="#111"/><rect x="27" y="${H/2-7}" width="9" height="8" rx="1" fill="url(#rkgRed)" style="filter:drop-shadow(0 0 1.5px #FF5A4E)"/>`;
    for(let i=0;i<k;i++){ const cx=x0+dx*(i+.5), cy=H/2, r=Math.min(15,dx/2-2,H/2-4); h+=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="#2B2E33" stroke="#3E4247" stroke-width=".8"/><circle cx="${cx}" cy="${cy}" r="${r*.78}" fill="#17181B"/><circle cx="${cx-r*.36}" cy="${cy}" r="${r*.12}" fill="#000"/><circle cx="${cx+r*.36}" cy="${cy}" r="${r*.12}" fill="#000"/><rect x="${cx-r*.22}" y="${cy-r*.8}" width="${r*.44}" height="${r*.14}" fill="#A9AEB4"/><rect x="${cx-r*.22}" y="${cy+r*.66}" width="${r*.44}" height="${r*.14}" fill="#A9AEB4"/>`; } }
  else if(t.typ==="kabel") h+=rkKoerper(H,"url(#rkgBlk)")+`<rect x="30" y="${H*.27}" width="422" height="${H*.46}" rx="2" fill="url(#rkpBrush)" stroke="#000" stroke-width=".8"/><rect x="30" y="${H*.27}" width="422" height="${H*.08}" fill="rgba(0,0,0,.45)"/>`;
  else if(t.typ==="blind") h+=`<rect x="16.5" y=".6" width="449.6" height="${H-1.2}" rx="1" style="fill:var(--rk-blind)"/><rect x="60" y="${H*.3}" width="362" height="${H*.4}" fill="url(#rkpHexL)"/>`;
  else if(t.typ==="boden"){ const weiss=/fritz|speedport|easybox|vodafone|telekom|o2|modem|glasfaser|ont/i.test(N), dh=Math.min(H-9,he>1?40:30), dw=weiss?210:240, dx=(RK_B-dw)/2, dy=H-6-dh;
    h+=`<rect x="16.5" y="${H-6}" width="449.6" height="5" rx="1" fill="url(#rkgTray)"/><rect x="16.5" y="${H-6}" width="449.6" height=".8" fill="rgba(255,255,255,.18)"/>`
      +`<rect x="${dx}" y="${dy}" width="${dw}" height="${dh}" rx="${weiss?5:2.5}" fill="url(#${weiss?"rkgDev":"rkgDevD"})"/><rect x="${dx}" y="${dy+dh-2}" width="${dw}" height="2" rx="1" fill="rgba(0,0,0,.25)"/>`
      +[0,1,2,3,4].map(i=>rkLed(dx+12+i*7,dy+dh/2-.8,i<3,weiss?"#3DDC84":"#4FA8FF")).join("")
      +rkText(dx+dw-8,dy+dh/2+2.4,ecRkKurz(N||"Fachboden").replace(/\s*\+.*$/,""),{fs:6.5,fw:700,fill:weiss?"#5F6368":"#C9CDD2",anchor:"end"}); }
  else if(/nas|synology|qnap|storage/i.test(N)){ const r=he>1?2:1, c=4, bw=78, bh=(H-12-(r-1)*3)/r, x0=466.1-8-c*bw-(c-1)*3;
    h+=rkKoerper(H,"url(#rkgBlk)")+rkText(24,14,ecRkKurz(N).replace(/^(Synology|QNAP)\s+/i,""),{fs:7.5,fw:700})+`<circle cx="34" cy="${H-12}" r="5" fill="#26282C" stroke="#4FA8FF" stroke-width="1.2" style="filter:drop-shadow(0 0 1px #4FA8FF)"/>`+[0,1,2].map(i=>rkLed(46+i*6,H-12.8,i<2)).join("");
    for(let j=0;j<r;j++) for(let i=0;i<c;i++){ const x=x0+i*(bw+3), y=6+j*(bh+3); h+=`<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="1.5" fill="#2C2F34" stroke="#121315" stroke-width=".8"/><rect x="${x+4}" y="${y+bh/2-2.5}" width="${bw-24}" height="5" rx="2.5" fill="#1A1C1F"/>`+rkLed(x+bw-14,y+bh/2-3,true)+rkLed(x+bw-14,y+bh/2+1.2,false); } }
  else if(/server|proxmox|esx|hyper|host/i.test(N)){ const c=he>1?12:8, bw=(466.1-150)/c-2.4, bh=H-12;
    h+=rkKoerper(H,"url(#rkgBlk)")+rkText(24,14,ecRkKurz(N).replace(/\s*\(.*$/,""),{fs:7.5,fw:700})+`<circle cx="34" cy="${H-12}" r="5" fill="#26282C" stroke="#3DDC84" stroke-width="1.2"/>`+[0,1,2,3].map(i=>rkLed(46+i*6,H-12.8,i!==2)).join("");
    for(let i=0;i<c;i++){ const x=150+i*(bw+2.4), y=6; h+=`<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="1.2" fill="#2C2F34" stroke="#121315" stroke-width=".7"/><rect x="${x+bw/2-2}" y="${y+5}" width="4" height="${bh-16}" rx="2" fill="#1A1C1F"/>`+rkLed(x+bw/2-1.3,y+bh-7,i<c-2); } }
  else { h+=rkKoerper(H,"url(#rkgBlk)")+rkText(24,H/2+2.4,ecRkKurz(N||EC_RK[t.typ]||"Gerät"),{fs:7,fw:700})+`<rect x="300" y="${H*.25}" width="155" height="${H*.5}" fill="url(#rkpHex)"/>`+rkLed(285,H/2-.8,true); }
  if(t.typ!=="boden"){ const sO=silber||!!(KP&&KP.farbe!=="schwarz")||!!(KZ&&KZ.silber); h+=rkOhr(0,H,sO)+rkOhr(RK_B-16.5,H,sO); }
  else h+=`<rect x="0" y="${H-6}" width="16.5" height="5" fill="url(#rkgEar)"/><rect x="${RK_B-16.5}" y="${H-6}" width="16.5" height="5" fill="url(#rkgEar)"/>`;
  return `<div class="rk-t rk-${t.typ}" data-act="ecRkTeil" data-id="${esc(t.id)}" data-rk="${esc(t.id)}" style="grid-row:${t.pos} / span ${he}" title="${esc(ecRkName(t))}">
    <svg class="rk-svg" viewBox="0 0 ${RK_B} ${H}" preserveAspectRatio="none" aria-hidden="true">${h}</svg><span class="rk-griff" data-act="ecRkGriff" data-drag="${esc(t.id)}" aria-label="verschieben"></span></div>`; }

/* ---- Beschriftung mit dem Brother P-touch (Pro Label Tool) ----
   Zwei Wege: (1) eigene Etikettendatei (.lbxs/.lbx) im Format der App – nachgebaut an einer echten Datei der Vorlage „Verteiler“,
   (2) CSV als Datenbank („Datenbankdatei verbinden/serialisieren“). Profile (Bandbreite, Block-Abstand, Trennzeichen …) gelten firmenweit. */
const EC_ETI={patch:["Patchfeld-Streifen","je Patchfeld ein Streifen, je Port ein Block – Vorlage „Verteiler“"],schild:["Patchfeld-Schilder","je Patchfeld ein Schild, z. B. „Patchfeld 1“ – breites Band oder große Schrift"],dosen:["Datendosen","je Dose ein Etikett, z. B. „1.13 / 1.14“"],kabel:["Kabel-Fähnchen","je Link zwei Fähnchen: Schrankseite und Dosenseite"],geraete:["Geräte im Schrank","je Teil ein Etikett mit HE und Name"]};
const EC_ETI_INH=[["nr","nur Nummer"],["nr_raum","Nummer + Raum"],["raum","nur Raum"]];
let ecEti={art:"patch",inh:"nr",sId:"",prof:"",fmt:"lbxs"};
try{ const v=JSON.parse(localStorage.getItem("irrgang_eti")||"null"); if(v){ ecEti.prof=v.prof||""; ecEti.fmt=v.fmt||"lbxs"; } }catch(e){}
const ecEtiMerken=()=>{ try{ localStorage.setItem("irrgang_eti",JSON.stringify({prof:ecEti.prof,fmt:ecEti.fmt})); }catch(e){} };
/* Bänder: Werte aus echten Dateien (9 mm Verteiler, 12 mm Doppeltaster). Andere Breiten erst, wenn wir eine Musterdatei haben. */
const EC_BAND={9:{papier:25.6,hoehe:20,format:258,schrift:10},12:{papier:33.6,hoehe:28,format:259,schrift:14}};
/* [Wert in der Datei, Name in der App, aus echter Datei bestätigt] */
const EC_TRENN=[["DOT","Markierungspunkte",false],["DASH","Gedankenstrich",false],["LINE","Linie",true],["BOLD","Fett",false],["FRAME","Rahmen",false],["NONE","Kein(e)",false]];
const EC_MUSTER=[["{nr}","Nummer"],["{nr} {raum}","Nummer + Raum"],["{raum}","Raum"],["P{pf}-{port2}","P1-13"]];
const EC_ETI_STD={id:"metz24",name:"Metz Connect 24 Port",band:9,block:18,anzahl:24,trenn:"LINE",vertikal:false,umkehren:false,mult:[],muster:"{nr}",frei:"nr",drucker:"PT-E560BT"};
const ecEtiProfile=()=>{ const r=DB.einstellungen&&DB.einstellungen.get("etiketten"); return r&&!r.deleted&&Array.isArray(r.profile)&&r.profile.length?r.profile:[EC_ETI_STD]; };
/* „{pf}.{port}“ hieß früher „Nummer“ – jetzt {nr}, damit bei mehreren Schränken die Schranknummer vorn mitkommt */
const ecEtiProfil=id=>{ const L=ecEtiProfile(), p={...EC_ETI_STD,...(L.find(p=>p.id===id)||L[0])}; p.muster=String(p.muster||"{nr}").replace("{pf}.{port}","{nr}"); return p; };
function ecEtiProfileSpeichern(L){ const neu=!DB.einstellungen.has("etiketten"), r=DB.einstellungen.get("etiketten")||{id:"etiketten"}; r.profile=L; r.deleted=false; saveRec("einstellungen",r,neu); }
const ecEtiN=p=>Math.max(1,Math.min(50,Math.round(+p.anzahl)||24));
const ecEtiMult=p=>Array.from({length:ecEtiN(p)},(_,i)=>Math.max(.5,Math.min(9.9,+((p.mult||[])[i])||1)));
const ecEtiMm=(p,mm)=>String(Math.round(mm*10)/10).replace(".",",");
/* ohne Sonderzeichen wie „·“ und „→“ – nicht jede Schrift im Drucker hat sie */
const ecEtiRaum=(g,raumId)=>ecRaumName(g,raumId).replace(/\s*·\s*/g," ");
const ecEtiMuster=(m,w)=>String(m||"{pf}.{port}").replace(/\{(\w+)\}/g,(_,k)=>w[k]??"").replace(/\s+/g," ").replace(/^[\s\-–.,/]+|[\s\-–.,/]+$/g,"").trim();
/* Patchfeld-Streifen: je Patchfeld so viele Blöcke wie das Profil hat – größere Felder werden auf mehrere Streifen verteilt */
function ecEtiStreifen(g,p){ const S=ecEti.sId?g.schraenke.filter(s=>s.id===ecEti.sId):g.schraenke, n=ecEtiN(p), R=[];
  S.forEach(s=>{ const {M}=ecRkLinks(g,s); ecPfListe(s).forEach(pf=>{ const T=[];
    for(let port=1;port<=pf.ports;port++){ const L=M.get(`${pf.nr}.${port}`), raum=L?ecEtiRaum(g,L[0].raumId):"", lage=L?L[0].d.lage||"":"";
      T.push({port,raum,lage,belegt:!!L,text:!L&&p.frei==="leer"?"":ecEtiMuster(p.muster,{nr:`${pf.nr}.${port}`,voll:ecPpText(g,s.id,pf.nr,port),kennung:String(s.kennung||"").trim(),snr:ecSchrNr(g,s),pf:pf.nr,port,port2:String(port).padStart(2,"0"),raum,lage,schrank:s.name})}); }
    for(let a=0;a<T.length;a+=n){ const teil=T.slice(a,a+n); R.push({s,pf,von:a+1,bis:a+teil.length,teile:Math.ceil(T.length/n),T:teil}); } }); });
  return R; }
function ecEtiZeilen(pr,g){ const S=ecEti.sId?g.schraenke.filter(s=>s.id===ecEti.sId):g.schraenke, inh=ecEti.inh, Z=[];
  const text=(nr,raum)=>inh==="raum"?raum:inh==="nr_raum"?[nr,raum].filter(Boolean).join(" "):nr;
  if(ecEti.art==="patch"){ Z.push(["Schrank","Patchfeld","Port","Etikett","Raum","Lage"]);
    ecEtiStreifen(g,ecEtiProfil(ecEti.prof)).forEach(st=>st.T.forEach(t=>Z.push([st.s.name,`P${st.pf.nr}`,String(t.port),t.text,t.raum,t.lage]))); }
  else if(ecEti.art==="dosen"){ Z.push(["Schrank","Raum","Dose","Etikett","Lage"]);
    ecRaeume(g).forEach(r=>{ g.dosen.filter(d=>d.raumId===r.id&&(!ecEti.sId||d.sId===ecEti.sId)).sort((a,b)=>(a.ord||0)-(b.ord||0)).forEach(d=>{ const n=Math.max(1,+d.ports||1), roh=Array.from({length:n},(_,i)=>((d.pp||{})[i+1]||"").trim()).filter(Boolean), sch=g.schraenke.find(x=>x.id===d.sId), kenn=ecBeschr(g)==="kennung"&&sch&&String(sch.kennung||"").trim(), raum=ecEtiRaum(g,r.id);
      const pp=kenn&&roh.length?[`${kenn} ${roh.map(t=>{ const x=ecPpTeile(t); return x?`${x.pf}.${x.port}`:t; }).join(" / ")}`]:roh.map(t=>ecPpVoll(g,d.sId,t));   /* Kennung nur einmal vorn */
      Z.push([ecSchrName(g,d.sId),raum,pp.join(" / "),text(pp.join(" / "),raum),d.lage||""]); }); }); }
  else if(ecEti.art==="kabel"){ Z.push(["Schrank","Port","Seite","Etikett","Gegenstelle"]);
    S.forEach(s=>{ ecNetListe({},g).filter(p=>p.d.sId===s.id&&p.pp).forEach(p=>{ const raum=ecEtiRaum(g,p.raumId);
      Z.push([s.name,p.pp,"Schrank",text(p.pp,raum),`zu ${raum}${p.d.lage?` (${p.d.lage})`:""}`]); Z.push([s.name,p.pp,"Dose",text(p.pp,raum),`zu ${s.name} P${(ecPpTeile(p.ppk)||{}).pf||""}`]); }); }); }
  else if(ecEti.art==="schild"){ Z.push(["Schrank","Patchfeld","Etikett"]); S.forEach(s=>ecPfListe(s).forEach(pf=>Z.push([s.name,`P${pf.nr}`,`Patchfeld ${pf.nr}`]))); }
  else { Z.push(["Schrank","HE","Etikett","Art"]);
    S.forEach(s=>ecSchrTeile(s).filter(t=>!["blind","kabel"].includes(t.typ)).forEach(t=>Z.push([s.name,String(t.pos),`HE ${t.pos} ${ecRkName(t)}`,EC_RK[t.typ]||""]))); }
  return Z; }
const ecCsv=Z=>"﻿"+Z.map(r=>r.map(v=>{ v=String(v??""); return /[",;\n]/.test(v)?`"${v.replace(/"/g,'""')}"`:v; }).join(",")).join("\r\n")+"\r\n";

/* maßstäbliche Vorschau eines Streifens (mm), Trennzeichen so ähnlich wie in der App */
function ecEtiSvg(p,texte,klein){ const n=ecEtiN(p), m=ecEtiMult(p), w=m.map(x=>(+p.block||18)*x), L=w.reduce((a,x)=>a+x,0), H=+p.band||9, fs=H*.4;
  const T=Array.from({length:n},(_,i)=>String(texte[i]??"")), O=p.umkehren?[...T].reverse():T; let x=0, g="";
  const trenn=xx=>{ const t=p.trenn; if(t==="NONE"||t==="FRAME") return "";
    const st=t==="BOLD"?`stroke-width=".7"`:t==="DOT"?`stroke-width=".45" stroke-linecap="round" stroke-dasharray="0 1.1"`:t==="DASH"?`stroke-width=".3" stroke-dasharray="1.2 .9"`:`stroke-width=".25"`;
    return `<line x1="${xx}" x2="${xx}" y1="${t==="DOT"?.8:0}" y2="${t==="DOT"?H-.8:H}" stroke="#111" ${st}/>`; };
  w.forEach((b,i)=>{ const cx=x+b/2, t=O[i], platz=(p.vertikal?H:b)-1.4, breit=[...t].length*fs*.6;
    if(p.trenn==="FRAME") g+=`<rect x="${x+.35}" y=".35" width="${b-.7}" height="${H-.7}" fill="none" stroke="#111" stroke-width=".3"/>`;
    if(i) g+=trenn(x);
    if(t) g+=`<text x="${cx}" y="${H/2}" font-size="${fs}" ${breit>platz?`textLength="${platz}" lengthAdjust="spacingAndGlyphs"`:""} ${p.vertikal?`transform="rotate(-90 ${cx} ${H/2})"`:""}>${esc(t)}</text>`;
    x+=b; });
  return `<svg class="ec-band${klein?" klein":""}" viewBox="-.3 -.3 ${L+.6} ${H+.6}" style="width:${((L+.6)*(klein?2.2:3.4)).toFixed(0)}px" role="img" aria-label="Etikett ${ecEtiMm(p,L)} mm"><rect x="0" y="0" width="${L}" height="${H}" rx=".6" fill="#FFF" stroke="#999" stroke-width=".2"/>${g}</svg>`; }

/* ---- .lbx / .lbxs selbst schreiben: .lbxs = ZIP { config.json, <name>.lbx }, .lbx = ZIP { label.xml, prop.xml } ---- */
const ecPtS=v=>{ const x=Math.round(v*10)/10; return (Number.isInteger(x)?String(x):x.toFixed(1))+"pt"; };
const ecXml=t=>String(t??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const ecLbxId=()=>Math.floor(Math.random()*0xFFFFF).toString(16);
function ecLbxVerteiler(p,texte){ const B=EC_BAND[p.band]||EC_BAND[9], n=ecEtiN(p), m=ecEtiMult(p), b=(+p.block||18)*2.83428, h=B.hoehe;   /* mm→pt: Faktor an den Rasterwerten der App nachgemessen */
  const gx=[0]; m.forEach((f,i)=>gx.push(gx[i]+b*f)); for(let i=0;i<gx.length;i++) gx[i]=Math.round(gx[i]*10)/10; const L=gx[n];
  const stift=`<pt:pen style="NULL" widthX="0.5pt" widthY="0.5pt" color="#666666" printColorNumber="1"></pt:pen><pt:brush style="NULL" color="#FFFFFF" printColorNumber="1" id="0"></pt:brush>`;
  const schrift=`<text:ptFontInfo><text:logFont name="sans-serif" width="0" italic="false" weight="700" charSet="0" pitchAndFamily="2"></text:logFont><text:fontExt effect="NOEFFECT" underline="0" strikeout="0" size="${B.schrift}pt" orgSize="28.8pt" textColor="#000000" textPrintColorNumber="1"></text:fontExt></text:ptFontInfo>`;
  const zelle=i=>{ const t=String(texte[i]??""); return `<table:cell addressX="${i+1}" addressY="1" spanX="1" spanY="1" backColor="#FFFFFF" backPrintColorNumber="0"><text:text><pt:objectStyle x="${ecPtS(7.3+gx[i])}" y="4.5pt" width="${ecPtS(gx[i+1]-gx[i]-2.7)}" height="${ecPtS(h-3.4)}" backColor="#FFFFFF" backPrintColorNumber="0" ropMode="COPYPEN" angle="0" anchor="TOPLEFT" flip="NONE">${stift}<pt:expanded objectName="" objectID="${ecLbxId()}" ID="0" lock="0" templateMergeTarget="LABELLIST" templateMergeType="NONE" templateMergeID="0" allowOutOfBoundsTransfer="false" linkStatus="NONE" linkID="0"></pt:expanded></pt:objectStyle>${schrift}<text:textControl control="FIXEDFRAME" clipFrame="false" aspectNormal="true" shrink="true" autoLF="false" avoidImage="false"></text:textControl><text:textAlign horizontalAlignment="CENTER" verticalAlignment="CENTER" inLineAlignment="BASELINE"></text:textAlign><text:textStyle vertical="${p.vertikal?"true":"false"}" nullBlock="false" charSpace="0" lineSpace="0" orgPoint="${B.schrift}pt" combinedChars="false"></text:textStyle><text:transferSettings editOnPrintFormat="" editOnPrintOrder="0"></text:transferSettings><pt:data>${ecXml(t)}</pt:data><text:stringItem charLen="${[...t].length}">${schrift}</text:stringItem></text:text><pt:brush style="NULL" color="#000000" printColorNumber="1" id="0"></pt:brush></table:cell>`; };
  return `<?xml version="1.0" encoding="UTF-8"?>\n<pt:document xmlns:pt="http://schemas.brother.info/ptouch/2007/lbx/main" xmlns:style="http://schemas.brother.info/ptouch/2007/lbx/style" xmlns:text="http://schemas.brother.info/ptouch/2007/lbx/text" xmlns:draw="http://schemas.brother.info/ptouch/2007/lbx/draw" xmlns:image="http://schemas.brother.info/ptouch/2007/lbx/image" xmlns:barcode="http://schemas.brother.info/ptouch/2007/lbx/barcode" xmlns:database="http://schemas.brother.info/ptouch/2007/lbx/database" xmlns:table="http://schemas.brother.info/ptouch/2007/lbx/table" xmlns:cable="http://schemas.brother.info/ptouch/2007/lbx/cable" version="1.11" generator="com.brother.ptouch.mobilecablelabeltool2"><pt:body currentSheet="1" direction="LTR"><style:sheet name="1">`
    +`<style:paper media="0" width="${ecPtS(B.papier)}" height="${ecPtS(Math.round((L+2)*10)/10+11.2)}" marginLeft="2.8pt" marginTop="5.6pt" marginRight="2.8pt" marginBottom="5.6pt" orientation="landscape" autoLength="false" monochromeDisplay="true" printColorDisplay="false" printColorsID="0" paperColor="#FFFFFF" paperInk="#000000" split="1" format="${B.format}" backgroundTheme="0" printerID="32560" printerName="Brother ${ecXml(p.drucker||"PT-E560BT")}"></style:paper><style:cutLine regularCut="0pt" freeCut=""></style:cutLine>`
    +`<style:backGround x="5.6pt" y="2.8pt" width="${ecPtS(L+2)}" height="${ecPtS(h)}" brushStyle="NULL" brushId="0" userPattern="NONE" userPatternId="0" color="#000000" printColorNumber="1" backColor="#FFFFFF" backPrintColorNumber="0"></style:backGround><pt:objects><cable:cable>`
    +`<pt:objectStyle x="5.6pt" y="2.8pt" width="${ecPtS(L+.7)}" height="${ecPtS(h)}" backColor="#FFFFFF" backPrintColorNumber="0" ropMode="COPYPEN" angle="0" anchor="TOPLEFT" flip="NONE"><pt:pen style="SOLID" widthX="0.5pt" widthY="0.5pt" color="#666666" printColorNumber="1"></pt:pen><pt:brush style="NULL" color="#FFFFFF" printColorNumber="1" id="0"></pt:brush><pt:expanded objectName="" objectID="${ecLbxId()}" ID="0" lock="2" templateMergeTarget="LABELLIST" templateMergeType="NONE" templateMergeID="0" allowOutOfBoundsTransfer="false" linkStatus="NONE" linkID="0"></pt:expanded></pt:objectStyle>`
    +`<cable:cableStyle cableType="PATCHPANEL" fontName="sans-serif" printerFont="false"></cable:cableStyle><cable:gridPosition x="${gx.map(ecPtS).join(" ")}" y="0pt ${ecPtS(h-.7)}"></cable:gridPosition>`
    +`<cable:patchpanel fontSize="${B.schrift}pt" uiType="0" blocklength="${ecPtS(b)}" blocknumber="${n}" separator="${ecXml(p.trenn||"LINE")}" reverse="${p.umkehren?"true":"false"}" orientation="${p.vertikal?"true":"false"}" multipliers="${Array.from({length:50},(_,i)=>Math.round((m[i]||1)*10)).join(" ")}"></cable:patchpanel>`
    +`<table:cells>${Array.from({length:n},(_,i)=>zelle(i)).join("")}</table:cells></cable:cable></pt:objects></style:sheet></pt:body></pt:document>`; }
const ecLbxProp=titel=>{ const jetzt=new Date().toISOString().replace(/\.\d+Z$/,"Z");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<meta:properties xmlns:meta="http://schemas.brother.info/ptouch/2007/lbx/meta" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/"><meta:appName>com.brother.ptouch.mobilecablelabeltool2</meta:appName><dc:title>${ecXml(titel)}</dc:title><dc:subject></dc:subject><dc:creator>Elektro Irrgang</dc:creator><meta:keyword></meta:keyword><dc:description>{"databaseTypeKey":2}</dc:description><meta:template></meta:template><dcterms:created>${jetzt}</dcterms:created><dcterms:modified>${jetzt}</dcterms:modified><meta:lastPrinted></meta:lastPrinted><meta:modifiedBy></meta:modifiedBy><meta:revision>1</meta:revision><meta:editTime>0</meta:editTime><meta:numPages>1</meta:numPages><meta:numWords>0</meta:numWords><meta:numChars>0</meta:numChars><meta:security>0</meta:security><meta:transferScript></meta:transferScript></meta:properties>`; };
/* ZIP ohne Kompression (Methode 0) – reicht für die kleinen Dateien und braucht keine Bibliothek */
const EC_CRC=(()=>{ const t=new Uint32Array(256); for(let n=0;n<256;n++){ let c=n; for(let k=0;k<8;k++) c=c&1?0xEDB88320^(c>>>1):c>>>1; t[n]=c>>>0; } return t; })();
const ecCrc=d=>{ let c=0xFFFFFFFF; for(let i=0;i<d.length;i++) c=EC_CRC[(c^d[i])&255]^(c>>>8); return (c^0xFFFFFFFF)>>>0; };
function ecZip(dateien){ const enc=new TextEncoder(), teile=[], zentral=[]; let pos=0;
  const d=new Date(), zeit=(d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1), datum=((d.getFullYear()-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate();
  for(const f of dateien){ const name=enc.encode(f.name), daten=typeof f.daten==="string"?enc.encode(f.daten):f.daten, crc=ecCrc(daten);
    const k=new DataView(new ArrayBuffer(30)); k.setUint32(0,0x04034b50,true); k.setUint16(4,20,true); k.setUint16(6,0x0800,true); k.setUint16(10,zeit,true); k.setUint16(12,datum,true);
    k.setUint32(14,crc,true); k.setUint32(18,daten.length,true); k.setUint32(22,daten.length,true); k.setUint16(26,name.length,true);
    teile.push(new Uint8Array(k.buffer),name,daten);
    const z=new DataView(new ArrayBuffer(46)); z.setUint32(0,0x02014b50,true); z.setUint16(4,20,true); z.setUint16(6,20,true); z.setUint16(8,0x0800,true); z.setUint16(12,zeit,true); z.setUint16(14,datum,true);
    z.setUint32(16,crc,true); z.setUint32(20,daten.length,true); z.setUint32(24,daten.length,true); z.setUint16(28,name.length,true); z.setUint32(42,pos,true);
    zentral.push(new Uint8Array(z.buffer),name); pos+=30+name.length+daten.length; }
  const zl=zentral.reduce((a,x)=>a+x.length,0), e=new DataView(new ArrayBuffer(22)); e.setUint32(0,0x06054b50,true); e.setUint16(8,dateien.length,true); e.setUint16(10,dateien.length,true); e.setUint32(12,zl,true); e.setUint32(16,pos,true);
  const alle=[...teile,...zentral,new Uint8Array(e.buffer)], out=new Uint8Array(alle.reduce((a,x)=>a+x.length,0)); let o=0; for(const x of alle){ out.set(x,o); o+=x.length; } return out; }
const ecLbx=(name,p,texte)=>ecZip([{name:"label.xml",daten:ecLbxVerteiler(p,texte)},{name:"prop.xml",daten:ecLbxProp(name)}]);
const ecLbxs=(name,p,texte)=>ecZip([{name:"config.json",daten:JSON.stringify({Version:"1.0",CurrentLbx:name+".lbx",CurrentCsv:""})},{name:name+".lbx",daten:ecLbx(name,p,texte)}]);

/* ---- Dialog „Beschriften“ ---- */
function ecEtiDlg(sId){ if(sId!==undefined) ecEti.sId=sId; const pr=ecPr(), g=ecGeb(pr.ortId), andr=/android/i.test(navigator.userAgent), patch=ecEti.art==="patch";
  const PL=ecEtiProfile(); if(!PL.some(p=>p.id===ecEti.prof)) ecEti.prof=PL[0].id; const p=ecEtiProfil(ecEti.prof), fmt=patch?ecEti.fmt:"csv";
  let vorschau="";
  if(patch){ const ST=ecEtiStreifen(g,p), L=ecEtiMult(p).reduce((a,x)=>a+x*(+p.block||18),0);
    vorschau=`<div class="lbl" style="margin-top:14px">Vorschau · ${ST.length} Streifen à ${ecEtiN(p)} Blöcke · ${ecEtiMm(p,L)} × ${p.band} mm</div>
      <div class="ec-baender">${ST.length?ST.map(st=>`<div class="ec-bd"><div class="ec-bd-k">${esc(st.s.name)} · Patchfeld ${st.pf.nr}${st.teile>1?` · Port ${st.von}–${st.bis}`:""}</div><div class="ec-bd-s">${ecEtiSvg(p,st.T.map(t=>t.text))}</div></div>`).join(""):`<p class="meta">Kein Patchfeld im Schrank.</p>`}</div>
      ${ST.some(st=>st.pf.ports%ecEtiN(p))?`<p class="meta" style="margin:6px 4px 0">Hinweis: Ein Patchfeld hat nicht ${ecEtiN(p)} Ports – der letzte Streifen hat leere Blöcke.</p>`:""}`; }
  else { const Z=ecEtiZeilen(pr,g), D=Z.slice(1), ki=Z[0].indexOf("Etikett"), mitText=D.filter(r=>r[ki]).length;
    vorschau=`<div class="lbl" style="margin-top:14px">Vorschau · ${D.length} Zeile${D.length===1?"":"n"}${mitText<D.length?` (${D.length-mitText} leer)`:""}</div>
      <div class="ec-eti-v">${D.slice(0,24).map(r=>`<span class="ec-eti${r[ki]?"":" leer"}" title="${esc(r.join(" · "))}">${esc(r[ki]||"–")}</span>`).join("")}${D.length>24?`<span class="ec-eti mehr">+${D.length-24}</span>`:""}</div>`; }
  const hilfe=fmt==="csv"?`<li>CSV teilen oder herunterladen (landet in „Downloads“).</li>
      <li>Pro Label Tool öffnen, Vorlage wählen – ${patch?"„Verteiler“":ecEti.art==="kabel"?"„Fähnchen“":"„Selbstlaminierend“ oder ein Standard-Etikett"}.</li>
      <li>„Datenbankdatei verbinden/serialisieren“ → die CSV wählen → „Erste Zeile als Kopfzeile“ an → Feld „Etikett“ zuordnen.</li>`
    :`<li>Datei teilen und „Pro Label Tool“ wählen – oder herunterladen und in der App unter „Öffnen“ bzw. „Importieren“ laden.</li>
      <li>Je Patchfeld kommt eine Datei; Blöcke, Abstand und Trennzeichen sind schon eingestellt, die Texte stehen drin.</li>
      <li>Falls die App die Datei nicht annimmt: Format „CSV“ wählen und wie gewohnt als Datenbank verbinden.</li>`;
  dialog("Beschriften mit Brother",`<p class="ec-sub">Für die <b>Brother Pro Label Tool</b>-App (P-touch, z. B. PT-E560BT).</p>
    <div class="lbl">Was beschriften?</div>${ecChips("etiArt",Object.entries(EC_ETI).map(([k,v])=>[k,v[0]]),ecEti.art)}
    <p class="meta" style="margin:6px 4px 0">${esc(EC_ETI[ecEti.art][1])}</p>
    ${patch?`<div class="lbl" style="margin-top:12px">Profil</div><div class="chips ec-wahl">${PL.map(x=>`<button type="button" class="chip" data-act="ecWahl" data-g="etiProf" data-v="${esc(x.id)}" aria-pressed="${x.id===ecEti.prof}">${esc(x.name)}</button>`).join("")}<button type="button" class="chip ec-chip-neu" data-act="ecEtiProf" data-id="">${icon("add")}Neues Profil</button></div>
      <button type="button" class="ec-etp-kurz" data-act="ecEtiProf" data-id="${esc(p.id)}"><span>${p.band} mm Band · Block ${ecEtiMm(p,+p.block||18)} mm · ${ecEtiN(p)} Blöcke · ${esc((EC_TRENN.find(t=>t[0]===p.trenn)||EC_TRENN[2])[1])}${p.vertikal?" · vertikal":""}${p.umkehren?" · umgekehrt":""}</span>${icon("edit")}</button>`
      :ecEti.art==="dosen"||ecEti.art==="kabel"?`<div class="lbl" style="margin-top:12px">Text auf dem Etikett</div>${ecChips("etiInh",EC_ETI_INH,ecEti.inh)}`:""}
    ${g.schraenke.length>1?`<div class="lbl" style="margin-top:12px">Schrank</div>${ecChips("etiS",[["","alle"],...g.schraenke.map(s=>[s.id,s.name])],ecEti.sId)}`:""}
    ${vorschau}
    ${patch?`<div class="lbl" style="margin-top:14px">Format</div>${ecChips("etiFmt",[["lbxs","Brother-Datei (.lbxs)"],["lbx","Etikett (.lbx)"],["csv","CSV-Datenbank"]],fmt)}`:""}
    <details class="ec-eti-hilfe"><summary>So druckst du in der App</summary><ol>${hilfe}</ol>
      <p class="meta">Für den Drucker allein (ohne Handy): in der App unter Einstellungen „CSV-Datei übertragen“.</p></details>`,
    `${andr?`<button class="btn-text" data-act="ecEtiApp">App öffnen</button>`:""}<span style="flex:1"></span><button class="btn-text" data-act="cancel">Schließen</button><button class="btn-text" data-act="ecEtiLaden">Herunterladen</button><button class="btn-text" data-act="ecEtiTeilen">Teilen</button>`,{breit:true}); }
async function ecEtiAusgeben(teilen){ const pr=ecPr(), g=ecGeb(pr.ortId), fmt=ecEti.art==="patch"?ecEti.fmt:"csv", ort=ecOrt(pr.ortId).titel, F=[];
  if(fmt==="csv"){ const Z=ecEtiZeilen(pr,g); if(Z.length<2){ toast("Nichts zu beschriften"); return; }
    const s=ecEti.sId&&g.schraenke.find(x=>x.id===ecEti.sId); F.push(new File([ecCsv(Z)],bbFs(`Etiketten ${EC_ETI[ecEti.art][0]}${s?" "+s.name:""} ${ort}`)+".csv",{type:"text/csv"})); }
  else { const p=ecEtiProfil(ecEti.prof), ST=ecEtiStreifen(g,p); if(!ST.length){ toast("Kein Patchfeld zum Beschriften"); return; }
    ST.forEach(st=>{ const name=bbFs(`${st.s.name} P${st.pf.nr}${st.teile>1?` ${st.von}-${st.bis}`:""}`), T=st.T.map(t=>t.text);
      F.push(new File([fmt==="lbx"?ecLbx(name,p,T):ecLbxs(name,p,T)],`${name}.${fmt}`,{type:"application/octet-stream"})); }); }
  if(teilen&&navigator.canShare&&navigator.canShare({files:F})){ try{ await navigator.share({files:F,title:F.length===1?F[0].name:`Etiketten ${ort}`}); return; }catch(e){ if(e&&e.name==="AbortError") return; } }
  F.forEach((f,i)=>setTimeout(()=>{ const a=document.createElement("a"); a.href=URL.createObjectURL(f); a.download=f.name; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },1500); },i*400));
  const was=F.length===1?F[0].name.split(".").pop().toUpperCase()+"-Datei":`${F.length} Dateien`;
  toast(teilen?`Teilen geht hier nicht – ${was} heruntergeladen`:`${was} heruntergeladen`); }

/* ---- Profil bearbeiten (wie „Verteiler“-Einstellungen in der App) ---- */
let ecEtp=null;
function ecEtiProfDlg(id){ const L=ecEtiProfile(), alt=id?L.find(p=>p.id===id):null;
  if(!ecEtp||ecEtp.id!==(alt?alt.id:"")) ecEtp={id:alt?alt.id:"",w:{...EC_ETI_STD,...(alt||{}),id:alt?alt.id:"",name:alt?alt.name:"",mult:[...((alt&&alt.mult)||[])]}};
  const W=ecEtp.w; W.muster=String(W.muster||"{nr}").replace("{pf}.{port}","{nr}");
  dialog(alt?"Etiketten-Profil bearbeiten":"Neues Etiketten-Profil",`<div class="ec-etp">
    <div class="fg1">${tf("etpName","Name",W.name,{form:true,ph:"z. B. Metz Connect 24 Port"})}</div>
    <div class="lbl" style="margin-top:14px">Bandbreite</div>${ecChips("etpBand",Object.keys(EC_BAND).map(b=>[b,`${b} mm`]),String(W.band))}
    <div class="fg" style="margin-top:12px">${tf("etpBlock","Block-Abstand",ecEtiMm(W,+W.block||18),{form:true,im:"decimal",sfx:"mm"})}${tf("etpAnz","Anzahl der Blöcke",String(ecEtiN(W)),{form:true,im:"numeric"})}</div>
    <div class="lbl" style="margin-top:14px">Trennzeichen</div>${ecChips("etpTrenn",EC_TRENN.map(t=>[t[0],t[1]]),W.trenn)}
    <div class="lbl" style="margin-top:12px">Textausrichtung</div>${ecZSeg("ecEtpSeg",W.vertikal?"v":"h",[["h","Horizontal"],["v","Vertikal"]]).replace(/data-act="ecEtpSeg"/g,'data-act="ecEtpSeg" data-k="vertikal"')}
    <div class="lbl" style="margin-top:12px">Umkehren</div>${ecZSeg("ecEtpSeg",W.umkehren?"j":"n",[["n","Aus"],["j","An"]]).replace(/data-act="ecEtpSeg"/g,'data-act="ecEtpSeg" data-k="umkehren"')}
    <div class="lbl" style="margin-top:14px">Text je Block</div>
    <div class="fg1">${tf("etpMuster","Muster",W.muster,{form:true,ph:"{nr}"})}</div>
    <div class="chips ec-wahl" style="margin-top:6px">${EC_MUSTER.map(([v,t])=>`<button type="button" class="chip" data-act="ecEtpMuster" data-v="${esc(v)}">${esc(t)}</button>`).join("")}</div>
    <p class="meta" style="margin:6px 4px 0">Platzhalter: {nr} Patchfeld.Port (1.13), {voll} wie auf der Dose (z. B. 1.1.13), {kennung} des Schranks, {snr} Schranknummer, {pf} Patchfeld, {port} Port, {port2} Port zweistellig, {raum}, {lage}, {schrank} Name</p>
    <div class="lbl" style="margin-top:12px">Freie Ports</div>${ecChips("etpFrei",[["nr","trotzdem beschriften"],["leer","leer lassen"]],W.frei)}
    <details class="ec-etp-m"${W.mult.some(x=>x&&+x!==1)?" open":""}><summary>Blocklängen-Verhältnis je Block</summary><div id="etpMult">${ecEtpMultHtml(W)}</div></details>
    <div class="lbl" style="margin-top:14px">Vorschau <span id="etpLaenge"></span></div><div class="ec-baender"><div class="ec-bd-s" id="etpVorschau"></div></div>
    ${EC_TRENN.find(t=>t[0]===W.trenn&&!t[2])?`<p class="meta ec-etp-warn">„${esc(EC_TRENN.find(t=>t[0]===W.trenn)[1])}“ ist noch nicht an einer echten App-Datei geprüft – bei Problemen „Linie“ nehmen oder uns eine Musterdatei schicken.</p>`:""}
  </div>`,`${alt&&L.length>1?`<button class="btn-text danger" data-act="ecEtpDel">Löschen</button>`:""}<span style="flex:1"></span><button class="btn-text" data-act="ecEtpZurueck">Abbrechen</button><button class="btn-text" data-act="ecEtpOk">Speichern</button>`,{breit:true});
  ecEtpVorschau(); }
const ecEtpMultHtml=W=>`<div class="ec-etp-mg">${ecEtiMult(W).map((x,i)=>`<label><span>${i+1}</span><input type="text" inputmode="decimal" data-etpm="${i}" value="${String(x).replace(".",",")}"></label>`).join("")}</div><p class="meta">1,0 = normaler Block, 2,0 = doppelt so lang (z. B. für einen Doppelport).</p>`;
const ecEtpZahl=v=>{ const x=parseFloat(String(v||"").replace(",",".")); return isFinite(x)?x:NaN; };
function ecEtpLesen(){ if(!ecEtp) return; const W=ecEtp.w, v=id=>{ const e=document.getElementById(id); return e?e.value:null; };
  if(v("f_etpName")!=null) W.name=v("f_etpName").trim();
  if(v("f_etpBlock")!=null){ const b=ecEtpZahl(v("f_etpBlock")); if(b>=3&&b<=100) W.block=Math.round(b*10)/10; }
  if(v("f_etpAnz")!=null){ const n=Math.round(ecEtpZahl(v("f_etpAnz"))); if(n>=1&&n<=50) W.anzahl=n; }
  if(v("f_etpMuster")!=null) W.muster=v("f_etpMuster").trim()||"{nr}";
  document.querySelectorAll("#dlg [data-etpm]").forEach(e=>{ const x=ecEtpZahl(e.value); W.mult[+e.dataset.etpm]=x>=.5&&x<=9.9?Math.round(x*10)/10:1; }); }
function ecEtpVorschau(){ const el=document.getElementById("etpVorschau"); if(!el||!ecEtp) return; const W=ecEtp.w, n=ecEtiN(W);
  el.innerHTML=ecEtiSvg(W,Array.from({length:n},(_,i)=>ecEtiMuster(W.muster,{nr:`1.${i+1}`,voll:`1.1.${i+1}`,kennung:"ZVERT 2.2",snr:1,pf:1,port:i+1,port2:String(i+1).padStart(2,"0"),raum:"Büro",lage:"",schrank:"Schrank"})));
  const l=document.getElementById("etpLaenge"); if(l) l.textContent=`· ${ecEtiMm(W,ecEtiMult(W).reduce((a,x)=>a+x*(+W.block||18),0))} × ${W.band} mm`; }
function ecEtpOk(){ ecEtpLesen(); const W=ecEtp.w; if(!W.name){ toast("Bitte einen Namen eingeben"); return; }
  const L=ecEtiProfile().map(p=>({...p})), n=ecEtiN(W), mult=ecEtiMult(W), p={...W,anzahl:n,mult:mult.every(x=>x===1)?[]:mult};
  if(!p.id){ p.id="etp"+Date.now().toString(36); L.push(p); } else { const i=L.findIndex(x=>x.id===p.id); if(i<0) L.push(p); else L[i]=p; }
  ecEtiProfileSpeichern(L); ecEti.prof=p.id; ecEtiMerken(); ecEtp=null; toast("Profil gespeichert"); ecEtiDlg(); }

/* Verschieben: Ziel frei ⇒ einfach hin; belegt ⇒ die Teile dazwischen rücken nach (wie Tauschen bei gleich hohen Teilen) */
function ecRkPlan(s,id,np){ const T=ecSchrTeile(s).map(x=>({...x})), t=T.find(x=>x.id===id), N=ecSchrHe(s); if(!t) return null; const he=t.he;
  np=Math.max(1,Math.min(N-he+1,np)); if(np===t.pos) return {teile:T,art:"gleich",pos:np,n:0};
  const frei=ecRkFrei(s,np,he,id); if(frei){ t.pos=np; return {teile:T,art:"frei",pos:np,n:0}; }
  let n=0;
  if(np<t.pos){ const occ=T.find(x=>x!==t&&x.pos<np&&x.pos+x.he-1>=np); if(occ) np=occ.pos;
    T.forEach(x=>{ if(x!==t&&x.pos>=np&&x.pos<t.pos){ x.pos+=he; n++; } }); t.pos=np; }
  else { let end=np+he-1; const occ=T.find(x=>x!==t&&x.pos<=end&&x.pos+x.he-1>end); if(occ) end=occ.pos+occ.he-1; np=end-he+1;
    T.forEach(x=>{ if(x!==t&&x.pos>t.pos+he-1&&x.pos+x.he-1<=end){ x.pos-=he; n++; } }); t.pos=np; }
  for(const a of T){ if(a.pos<1||a.pos+a.he-1>N) return null; for(const b of T) if(a!==b&&a.pos<=b.pos+b.he-1&&b.pos<=a.pos+a.he-1) return null; }
  return {teile:T,art:"tausch",pos:np,n}; }
/* Ziehen: mit der Maus am ganzen Teil (ab 5 px Bewegung, sonst ist es ein Klick), am Handy am Griff */
let ecRkZug=null;
document.addEventListener("pointerdown",e=>{ if(e.button) return; const el=e.target.closest&&e.target.closest(".rk:not(.mini) .rk-t"); if(!el) return; const pr=ecPr(); if(!pr||pr.status==="fertig") return;
  const griff=e.target.closest("[data-drag]"); if(e.pointerType!=="mouse"&&!griff) return;
  const g=ecGeb(pr.ortId), s=g.schraenke.find(x=>x.id===nav.schr), t=s&&ecSchrTeile(s).find(x=>x.id===el.dataset.rk); if(!t) return;
  const rk=el.closest(".rk"), schritt=parseFloat(getComputedStyle(rk).gridTemplateRows)+(parseFloat(getComputedStyle(rk).rowGap)||0);
  ecRkZug={id:t.id,y0:e.clientY,el,rk,s,schritt,pos0:t.pos,he:t.he,aktiv:false,plan:null,pid:e.pointerId};
  if(griff){ e.preventDefault(); ecRkStart(); } });
function ecRkStart(){ const z=ecRkZug; z.aktiv=true; try{ z.el.setPointerCapture(z.pid); }catch(_){} z.el.classList.add("zieh"); document.body.classList.add("rk-zieht");
  z.ziel=document.createElement("div"); z.ziel.className="rk-ziel"; z.rk.appendChild(z.ziel); ecRkZiel(); }
function ecRkZiel(d){ const z=ecRkZug; const np=z.pos0+(d||0), p=ecRkPlan(z.s,z.id,np); z.plan=p; const pos=p?p.pos:Math.max(1,Math.min(ecSchrHe(z.s)-z.he+1,np));
  z.ziel.style.gridRow=`${pos} / span ${z.he}`; z.ziel.className="rk-ziel "+(p?p.art:"nein"); z.ziel.textContent=p?(p.art==="tausch"?`HE ${pos} · ${p.n} Teil${p.n>1?"e":""} rücken nach`:`HE ${pos}`):"kein Platz"; }
document.addEventListener("pointermove",e=>{ const z=ecRkZug; if(!z) return; const dy=e.clientY-z.y0;
  if(!z.aktiv){ if(Math.abs(dy)<5) return; ecRkStart(); }
  e.preventDefault(); z.el.style.transform=`translateY(${dy}px)`; ecRkZiel(Math.round(dy/z.schritt)); });
const ecRkLos=()=>{ const z=ecRkZug; if(!z) return; ecRkZug=null; if(!z.aktiv) return;
  z.el.style.transform=""; z.el.classList.remove("zieh"); document.body.classList.remove("rk-zieht"); if(z.ziel) z.ziel.remove(); ecCtxSchlucken=true; setTimeout(()=>{ ecCtxSchlucken=false; },350);
  const p=z.plan; if(!p||p.art==="gleich"){ if(!p) toast("Dort passt das Teil nicht hin"); return; }
  const pr=ecPr(), g=ecGeb(pr.ortId), s=g.schraenke.find(x=>x.id===nav.schr); if(!s) return;
  s.teile=p.teile.sort((a,b)=>a.pos-b.pos); ecGebSpeichern(g); render(); if(p.art==="tausch") toast(`Verschoben auf HE ${p.pos} – ${p.n} Teil${p.n>1?"e sind":" ist"} nachgerückt`); };
document.addEventListener("pointerup",ecRkLos); document.addEventListener("pointercancel",ecRkLos);


/* Messen */
/* Messen (Netzwerk): je Schrank eine Karte mit der M3-Liste, oben Filter; Antippen öffnet die Messwerte */
let ecNetFilter="alle";
function ecNetMessView(pr){ const g=ecGeb(pr.ortId), L=ecNetListe(pr,g);
  if(!L.length) return `${ecKennzahlen(pr)}<div class="ec-spalte"><section class="card"><h3>Messen</h3><p class="meta">Noch nichts zu messen. Unter „Gebäude“ die Datendosen anlegen und unter „Infrastruktur“ den Netzwerkschrank.</p></section></div>`+ecWeiter("abschluss","Weiter zum Abschluss");
  const ST=new Map(L.map(p=>[p.id,ecNetStand(pr,p)])), nOffen=L.filter(p=>["open","wip"].includes(ST.get(p.id))).length, nBad=L.filter(p=>ST.get(p.id)==="bad").length;
  const f=ecNetFilter, passt=p=>f==="offen"?["open","wip"].includes(ST.get(p.id)):f==="maengel"?ST.get(p.id)==="bad":true;
  const werte=(w,p)=>{ if(w.ng) return `nicht gemessen: ${w.ng}`; const v=ecNetV(w), t=[w.wm==="nok"?`Belegung Fehler${w.wmF?` (${w.wmF})`:""}`:w.wm==="ok"?"Belegung i. O.":"",w.len?`${w.len} m`:"",v?v.t.replace(" M"," Mbit/s").replace(" G"," Gbit/s"):"",w.poe==="ok"?"PoE i. O.":w.poe==="nok"?"PoE Fehler":""].filter(Boolean);
    return t.length?t.join(" · "):[ecDoseName(p.d),p.d.lage].filter(Boolean).join(" · "); };
  const zeile=p=>{ const w=ecW(pr,p.id); return ecLi({act:"ecNetMess",id:p.id,lead:esc(p.pp||"–"),breit:true,ton:ST.get(p.id)==="bad"?"bad":"",kopf:esc(ecLinkOrt(g,p)),text:esc(werte(w,p)),rechts:ecSt(ST.get(p.id))}); };
  const chips=`<div class="ec-filter">${[["alle",`Alle ${L.length}`],["offen",`Offen ${nOffen}`],["maengel",`Mängel ${nBad}`]].map(([v,t])=>`<button type="button" class="m3-filter" data-act="ecNetFilter" data-v="${v}" aria-pressed="${f===v}">${t}</button>`).join("")}</div>`;
  const karten=[...g.schraenke,{id:"",name:"Ohne Schrank"}].map(s=>{ const T=L.filter(p=>s.id?p.d.sId===s.id:(!p.d.sId||!g.schraenke.some(x=>x.id===p.d.sId))), V=T.filter(passt); if(!T.length) return "";
    const fe=T.filter(p=>!["open","wip"].includes(ST.get(p.id))).length;
    return `<section class="card"><h3>${esc(s.name)} <span class="m3-neben">${fe} von ${T.length} gemessen</span></h3>${V.length?ecListe(V.map(zeile)):`<p class="meta">${f==="maengel"?"Keine Mängel.":"Alles gemessen."}</p>`}</section>`; }).join("");
  return `${ecKennzahlen(pr)}${chips}<div class="ec-spalte">${karten}</div><p class="m3-hinweis">Link antippen: Belegung, Länge, Übertragung und PoE eintragen. „Weiter“ springt zum nächsten Port.</p>`+ecWeiter("abschluss","Weiter zum Abschluss"); }
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
    ["Prüfdatum",ecDatum(pr.datum)],["Prüfer",pr.pruefer],["Messgerät",G.mess],["Seriennr.",[G.sn,G.snR&&"Gegenstelle "+G.snR].filter(Boolean).join(" | ")],...(nz&&!G.kal?[]:[["Kal. gültig bis",G.kal]]),nz?["Verkabelung",[pr.kabel,ecVkText(ecVk(ecGeb(pr.ortId),null)),ecWmStd(pr),pr.schirm==="nein"?"ungeschirmt":"geschirmt"].filter(Boolean).join(" | ")]:an?["Netzform",`${N.form||"-"} | 230/400 V${N.hak?` | HAK ${N.hak}`:""}`]:["Anzahl Geräte",String(ecGeraeteAm(pr.ortId).filter(b=>!["open","ng"].includes(ecGerStand(pr,b))).length)],
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
  if(el.id==="f_anRouter"&&ecDlg&&ecDlg.an){ ecAnLesen(); ecAnDlg(); return; }
  if(ecEtp&&el.closest&&el.closest("#dlg .ec-etp")){ ecEtpLesen(); if(el.id==="f_etpAnz"){ const m=document.getElementById("etpMult"); if(m) m.innerHTML=ecEtpMultHtml(ecEtp.w); } ecEtpVorschau(); return; }
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
  case "ecOeffnen": { const p=DB.echecks.get(b.dataset.id); if(p){ nav.schr=null; go({v:"ec",id:p.id,tab:p.status==="fertig"?"abschluss":ecTabGemerkt(p.id)||"auftrag"}); } return; }
  case "ecPrCtx": { const p=DB.echecks.get(b.dataset.id); if(!p) return; const an=ecPins().includes(p.id), id=p.id;
    kontextMenu(ecCtxX,ecCtxY,[{t:an?"Nicht mehr anpinnen":"Anpinnen",ic:an?"pinOff":"pin",fn:()=>ecPinUm(id)},"-",{t:"Löschen",ic:"del",gefahr:true,fn:()=>{ const x=document.createElement("button"); x.hidden=true; x.dataset.act="ecPrLoeschen"; x.dataset.id=id; document.body.appendChild(x); x.click(); x.remove(); }}]); return; }
  case "ecListeAlle": ecListeAlle[b.dataset.n]=!ecListeAlle[b.dataset.n]; fNeu(b.dataset.n); return;
  case "ecPrLoeschen": { const p=DB.echecks.get(b.dataset.id); if(!p) return; if(SYNC_ON&&!canEdit(p)&&!p.demo){ toast("Diese Prüfung darf nur der Ersteller oder ein Admin löschen"); return; } ecPrWeg=p.id;
    confirmDlg("Prüfung löschen?",`${ecOrt(p.ortId).titel} · ${ecDatum(p.datum)} – die Prüfung wird in allen Apps entfernt. Gebäude, Räume, Schränke und Dosen bleiben erhalten.`,"Löschen","ecPrWeg"); return; }
  case "ecPrWeg": { const p=DB.echecks.get(ecPrWeg); closeOverlays(); if(!p) return; p.deleted=true; saveRec("echecks",p); render(); toast("Prüfung gelöscht"); return; }
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
    if(ecDlg&&ecDlg.an&&["anArt","anOnt","anWeg"].includes(gr)){ ecAnLesen(); ecDlg.w[{anArt:"art",anOnt:"ont",anWeg:"weg"}[gr]]=b.dataset.v; ecAnDlg(); return; }
    if(gr==="beschr"&&false){ const g0=ecGeb(ecPr().ortId); g0.beschr=b.dataset.v; ecGebSpeichern(g0); render(); return; }
    if(gr==="etiProf"||gr==="etiFmt"){ ecEti[gr==="etiProf"?"prof":"fmt"]=b.dataset.v; ecEtiMerken(); ecEtiDlg(); return; }
    if(gr==="etpBand"||gr==="etpTrenn"||gr==="etpFrei"){ ecEtpLesen(); const v=b.dataset.v; ecEtp.w[{etpBand:"band",etpTrenn:"trenn",etpFrei:"frei"}[gr]]=gr==="etpBand"?+v:v; ecEtiProfDlg(ecEtp.id); return; }
    if(gr==="etiArt"||gr==="etiInh"||gr==="etiS"){ ecEti[{etiArt:"art",etiInh:"inh",etiS:"sId"}[gr]]=b.dataset.v; ecEtiDlg(); return; }
    if(ecDlg&&"geplant" in ecDlg&&["vor","bauart","he","breite","tiefe","farbe","pfAnz","pfPorts"].includes(gr)){ const v=b.dataset.v; ecSchrLesen();
      if(gr==="vor"){ const p=EC_RKVOR[+v]; Object.assign(ecDlg.w,{bauart:p[0],he:String(p[1]),breite:String(p[2]),tiefe:String(p[3])}); ecSchrDlg(); return; }
      ecDlg.w[gr]=v; if(gr==="bauart"){ const T=EC_RKTIEFEN[v]; if(!T.includes(+ecDlg.w.tiefe)) ecDlg.w.tiefe=String(v==="stand"?800:450); ecSchrDlg(); } return; }
    if(ecDlg&&ecDlg.rk&&/^rk/.test(gr)){ const z=ecDlg.rk, v=b.dataset.v; ecRkLesen();
      if(gr==="rkTyp"){ const s2=g&&g.schraenke.find(x=>x.id===nav.schr), d=EC_RKSTD[v]||{he:1}; z.typ=v; z.kat=""; z.he=d.he; z.ports=d.ports||0; if(v==="patch"&&!z.nr&&s2) z.nr=Math.max(0,...ecPfListe(s2).map(x=>x.nr))+1; ecRkDlg(z); return; }
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
  /* Beschriftung (Brother Pro Label Tool) */
  case "ecEti": ecEtiDlg(b.dataset.id||""); return;
  case "ecEtiProf": ecEtp=null; ecEtiProfDlg(b.dataset.id||""); return;
  case "ecEtpSeg": { ecEtpLesen(); ecEtp.w[b.dataset.k]=b.dataset.v==="v"||b.dataset.v==="j"; ecEtiProfDlg(ecEtp.id); return; }
  case "ecEtpMuster": { const i=document.getElementById("f_etpMuster"); if(i){ i.value=b.dataset.v; i.parentElement.classList.add("fl"); } ecEtpLesen(); ecEtpVorschau(); return; }
  case "ecEtpOk": ecEtpOk(); return;
  case "ecEtpZurueck": ecEtp=null; ecEtiDlg(); return;
  case "ecEtpDel": { const id=ecEtp&&ecEtp.id, L=ecEtiProfile().filter(p=>p.id!==id); if(!id||!L.length) return; ecEtiProfileSpeichern(L); if(ecEti.prof===id){ ecEti.prof=L[0].id; ecEtiMerken(); } ecEtp=null; toast("Profil gelöscht"); ecEtiDlg(); return; }
  case "ecEtiLaden": ecEtiAusgeben(false); return;
  case "ecEtiTeilen": ecEtiAusgeben(true); return;
  case "ecEtiApp": location.href="intent://#Intent;package=com.brother.ptouch.mobilecablelabeltool2;end"; return;
  /* Schrankplaner */
  case "ecRkAuf": ecRkTab="ansicht"; nav.schr=b.dataset.id; closeOverlays(); render(); scrollTo(0,0); return;
  case "ecRkZu": nav.schr=null; render(); scrollTo(0,0); return;
  case "ecRkGriff": return;
  case "ecRkWahl": ecRkWahlDlg(); return;
  case "ecNetFilter": ecNetFilter=b.dataset.v; render(); return;
  case "ecKatFilter": { ecKatFilter=b.dataset.v; const r0=$("#res"); if(r0){ r0.innerHTML=ecKatListe(); document.querySelectorAll(".nk-filter .m3-filter").forEach(x=>x.setAttribute("aria-pressed",x.dataset.v===ecKatFilter)); } else render(); return; }
  case "ecKatAuf": query=""; go({v:"netzkatmodell",id:b.dataset.id,von:b.dataset.von||""}); return;
  case "ecKatBild": { const K=ecRkKat(nav.id); if(K) ecKatBildDlg(K); return; }
  case "ecKatFotoNeu": ecKatFotoWaehlen(nav.id); return;
  case "ecKatFotoWeg": ecKatFotoSpeichern(nav.id,{foto:"",url:""}); closeOverlays(); render(); toast("Foto entfernt – wieder die Zeichnung"); return;
  case "ecKatLink": { const r=ecKatFotoRec(nav.id); dialog("Bild-Link",`<div class="fg1">${tf("katUrl","Adresse des Bildes (https://…)",(r&&r.url)||"",{form:true,ph:"z. B. Produktbild von der Herstellerseite"})}</div><p class="sup" style="margin:8px 4px 0">Rechtsklick aufs Bild beim Hersteller → „Bildadresse kopieren“. Ein eigenes Foto hat Vorrang.</p>`,`<span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="ecKatLinkOk">Speichern</button>`); return; }
  case "ecKatLinkOk": { const u=String((formVals().katUrl)||"").trim(); if(u&&!/^https:\/\//i.test(u)){ toast("Bitte eine https-Adresse eintragen"); return; } ecKatFotoSpeichern(nav.id,{url:u}); closeOverlays(); render(); toast(u?"Bild-Link gespeichert":"Bild-Link entfernt"); return; }
  case "ecKatVerbaut": { const o=b.dataset.o, P=live("echecks").filter(x=>String(x.ortId)===o&&x.art==="netz").sort((x,y)=>String(y.datum||"").localeCompare(String(x.datum||"")));
    if(!P.length){ toast("Keine Netzwerkprüfung zu diesem Gebäude"); return; } ecRkTab="ansicht"; go({v:"ec",id:P[0].id,tab:"infra",schr:b.dataset.s}); return; }
  case "ecKatalog": query=""; go({v:"netzkatalog"}); return;
  case "ecPkDlg": { if(!nichtZu()) return; ecDlg=null; ecPkDialog(); return; }
  case "ecPkWahl": { if(!ecDlg||!ecDlg.pk) return; const zw=b.dataset.z, f=b.dataset.f; if(f) ecDlg.z[zw]=f; else delete ecDlg.z[zw];
    b.parentNode.querySelectorAll(".pk-sw").forEach(x=>x.classList.toggle("an",x===b)); return; }
  case "ecPkOk": { if(!ecDlg||!ecDlg.pk) return; const g0=ecGeb(pr.ortId); g0.pkFarben={an:true,z:{...ecDlg.z}}; ecGebSpeichern(g0); ecDlg=null; closeOverlays(); render(); toast("Farbschema gespeichert"); return; }
  case "ecPkAus": { const g0=ecGeb(pr.ortId); g0.pkFarben={...(g0.pkFarben||{}),an:false}; ecGebSpeichern(g0); ecDlg=null; closeOverlays(); render(); return; }
  case "ecAnschluss": { if(!nichtZu()) return; ecDlg=null; ecAnDlg(); return; }
  case "ecAnOk": { ecAnLesen(); const W=ecDlg&&ecDlg.w; if(!W) return; const g0=ecGeb(pr.ortId); if(W.routerKat) W.routerText=""; g0.anschluss={...W}; ecGebSpeichern(g0); ecDlg=null; closeOverlays(); render(); return; }
  case "ecAnWeg": { const g0=ecGeb(pr.ortId); delete g0.anschluss; ecGebSpeichern(g0); ecDlg=null; closeOverlays(); render(); return; }
  case "ecRkTab": ecRkTab=b.dataset.v; closeOverlays(); render(); scrollTo(0,0); return;
  case "ecRkSpick": ecRkSpickAuf(b); return;
  case "ecRkHilfe": ecRkHilfeDlg(); return;
  case "ecRkKatAendern": { if(!ecDlg||!ecDlg.rk) return; ecRkLesen(); ecRkKatModus={neu:false,typ:ecDlg.rk.typ}; ecRkKatDlg(); return; }
  case "ecRkKatZurueck": if(ecDlg&&ecDlg.rk) ecRkDlg(ecDlg.rk); return;
  case "ecRkKatSet": { const K=ecRkKat(b.dataset.id), m=ecRkKatModus; if(!m) return; ecRkKatMerken(m.typ,K?K.id:"");
    if(!m.neu){ if(ecDlg&&ecDlg.rk) ecRkDlg(ecRkKatAnwenden(ecDlg.rk,K)); return; }
    const s2=g.schraenke.find(x=>x.id===nav.schr); if(!s2) return; const r=ecRkNeuZ(s2,m.typ,m.pos); if(!r.platz){ toast("Kein Platz mehr frei – Schrank größer wählen oder etwas entfernen"); return; }
    ecRkKatAnwenden(r.z,K); if(K&&!ecRkFrei(s2,r.z.pos,r.z.he)){ const p2=ecRkErsterFrei(s2,r.z.he); if(!p2){ toast(`Für ${K.he} HE ist kein Platz frei`); return; } r.z.pos=p2; } ecRkDlg(r.z); return; }
  case "ecRkNeu": case "ecRkLeer": { if(!nichtZu()) return; const s2=g.schraenke.find(x=>x.id===nav.schr); if(!s2) return;
    if(a==="ecRkNeu"&&EC_RKKAT.some(k=>k.typ===(b.dataset.t||"patch"))){ ecRkKatModus={neu:true,typ:b.dataset.t||"patch",pos:b.dataset.pos}; ecRkKatDlg(); return; }
    const r=ecRkNeuZ(s2,b.dataset.t||"patch",b.dataset.pos); if(r.z.typ==="patch"&&ecRkKatLetzt("patch")&&r.platz) ecRkKatAnwenden(r.z,ecRkKat(ecRkKatLetzt("patch")));
    if(!r.platz){ toast("Kein Platz mehr frei – Schrank größer wählen oder etwas entfernen"); return; } ecRkDlg(r.z); return; }
  case "ecRkTeil": { if(!nichtZu()) return; const s2=g.schraenke.find(x=>x.id===nav.schr), t=s2&&ecSchrTeile(s2).find(x=>x.id===b.dataset.id); if(t) ecRkDlg({...t}); return; }
  case "ecRkPort": { if(!nichtZu()) return; ecDoseDlg(b.dataset.id); if(ecDlg) ecDlg.ausRack=true; return; }
  case "ecRkOk": { const s2=g.schraenke.find(x=>x.id===nav.schr); if(!s2||!ecDlg||!ecDlg.rk) return; ecRkLesen(); const z=ecDlg.rk;
    let nachruecken=null; if(!ecRkFrei(s2,z.pos,z.he,z.id)){ const alt=z.id&&ecSchrTeile(s2).find(x=>x.id===z.id); nachruecken=alt&&alt.he===z.he?ecRkPlan(s2,z.id,z.pos):null;
      if(!nachruecken){ toast(`Ab HE ${z.pos} ist nicht genug Platz für ${z.he} HE`); return; } z.pos=nachruecken.pos; }
    if(z.typ==="patch"){ if(!(z.nr>0)){ toast("Bitte eine Patchfeld-Nummer angeben"); return; } if(ecPfListe(s2).some(x=>x.nr===z.nr&&x.id!==z.id)){ toast(`Patchfeld ${z.nr} gibt es schon`); return; } }
    const t={id:z.id||uid(),typ:z.typ,pos:z.pos,he:z.he}; if(z.name) t.name=z.name; if(z.typ==="patch"||z.typ==="switch") t.ports=z.ports||24; if(z.typ==="patch") t.nr=z.nr; if(z.typ==="switch"&&z.poe) t.poe=true; if(z.kat) t.kat=z.kat; if(z.tiefe&&z.typ!=="patch") t.tiefe=z.tiefe;
    const L=(nachruecken?nachruecken.teile:ecSchrTeile(s2)).filter(x=>x.id!==t.id); s2.teile=[...L,t].sort((a2,b2)=>a2.pos-b2.pos); sp(); closeOverlays(); render(); return; }
  case "ecRkDel": { const s2=g.schraenke.find(x=>x.id===nav.schr); if(!s2||!ecDlg||!ecDlg.rk) return; const z=ecDlg.rk;
    if(z.typ==="patch"&&!b.dataset.ok){ const n=[...ecRkLinks(g,s2).M.keys()].filter(k=>ecPpTeile(k).pf===z.nr).length; if(n){ b.dataset.ok="1"; b.textContent=`Trotzdem entfernen (${n} Port${n>1?"s":""} belegt)`; return; } }
    s2.teile=ecSchrTeile(s2).filter(x=>x.id!==z.id); sp(); closeOverlays(); render(); return; }
  /* Netzwerk */
  case "ecUmfangS": { if(!nichtZu()) return; const alle=g.schraenke.map(s=>s.id); let L=pr.umfang&&pr.umfang.sIds?[...pr.umfang.sIds]:[...alle];
    L=L.includes(b.dataset.id)?L.filter(x=>x!==b.dataset.id):[...L,b.dataset.id]; if(!L.length){ toast("Mindestens ein Schrank gehört zur Prüfung"); return; }
    pr.umfang=alle.every(x=>L.includes(x))?null:{sIds:L}; saveRec("echecks",pr); render(); return; }
  case "ecSchrNeu": case "ecSchrEdit": { if(!nichtZu()) return; const s2=a==="ecSchrEdit"&&g.schraenke.find(x=>x.id===b.dataset.id);
    ecDlg={schr:s2?s2.id:null,geplant:!!(s2&&Array.isArray(s2.teile)),w:{name:s2?s2.name:(g.schraenke.length?"":"Netzwerkschrank"),raumId:s2?s2.raumId||"":"",pfAnz:String(ecSchrPf(s2)),pfPorts:String(ecSchrPorts(s2)),
      nr:String(s2?ecSchrNr(g,s2):Math.max(0,...g.schraenke.map(x=>ecSchrNr(g,x)))+1),kennung:s2&&s2.kennung||"",he:String(s2?ecSchrHe(s2):12),bauart:s2&&s2.bauart||"wand",breite:String(s2?ecSchrBreite(s2):600),tiefe:String(s2?ecSchrTiefe(s2):450),farbe:s2&&s2.farbe||"auto"}}; ecSchrDlg(); return; }
  case "ecSchrOk": { ecSchrLesen(); const W=ecDlg.w, n=(W.name||"").trim(); if(!n){ toast("Bitte eine Bezeichnung eingeben"); return; } const he=+W.he||12;
    const daten={name:n,raumId:W.raumId||"",he,bauart:W.bauart,breite:+W.breite||600,tiefe:+W.tiefe||450,farbe:W.farbe||"auto"};
    if(W.kennung!=null) daten.kennung=String(W.kennung).trim();
    if(ecBeschr(g)==="nr"&&g.schraenke.length+(ecDlg.schr?0:1)>1){ const nr=parseInt(W.nr,10); if(!(nr>=1&&nr<=99)){ toast("Bitte eine Schranknummer von 1 bis 99 eingeben"); return; }
      const belegt=g.schraenke.find(x=>x.id!==ecDlg.schr&&ecSchrNr(g,x)===nr); if(belegt){ toast(`Nummer ${nr} hat schon „${belegt.name}“`); return; }
      g.schraenke.forEach(x=>{ if(!(+x.nr>0)) x.nr=ecSchrNr(g,x); }); daten.nr=nr; }   /* Nummern festschreiben, damit sie beim Löschen nicht rutschen */
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
    const nurErster=pp1[0]&&!pp1.slice(1,n).some(Boolean), basis={ports:n,lage:(F.ecLage||"").trim(),sId:F.ecSchr||"",nutz:Object.fromEntries([1,2,3,4].filter(i=>i<=n&&F["nz"+i]).map(i=>[i,F["nz"+i]])),vk:F.vkArt||F.vkFarbe?{art:F.vkArt||"",farbe:F.vkFarbe||""}:undefined}; ecLetzterSchr=basis.sId;
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
  case "ecBeschrSet": { if(!nichtZu()) return; const g0=ecGeb(pr.ortId); g0.beschr=b.dataset.v; ecGebSpeichern(g0); render(); return; }
  case "ecVkArt": case "ecVkFarbe": { if(!nichtZu()) return; const g0=ecGeb(pr.ortId), k=a==="ecVkArt"?"art":"farbe", v=b.dataset.v; g0.vk={...(g0.vk||{}),[k]:(g0.vk||{})[k]===v?"":v}; ecGebSpeichern(g0); render(); return; }
  case "ecVkDose": { const k=b.dataset.k, el=document.getElementById(k==="art"?"f_vkArt":"f_vkFarbe"); if(!el) return; el.value=b.dataset.v; b.parentNode.querySelectorAll("button").forEach(x=>{ x.classList.toggle("an",x===b); x.setAttribute("aria-pressed",String(x===b)); }); return; }
  case "ecSchirmStd": { if(!nichtZu()) return; pr.schirm=b.dataset.v; saveRec("echecks",pr); render(); return; }
  case "ecNetGeh": { ecNetLesen(); const L=ecNetListe(pr,g), i=L.findIndex(p=>p.id===(ecDlg&&ecDlg.netMess)), d=+b.dataset.d; if(d&&L[i+d]){ render(); ecNetMessDlg(L[i+d].id); return; } closeOverlays(); ecDlg=null; render(); return; }
  case "ecGerTri": { b.parentElement.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x===b&&x.getAttribute("aria-pressed")!=="true"))); return; }
  case "ecGerGeh": { ecGerLesen(); const B=ecGeraeteAm(pr.ortId), i=B.findIndex(x=>x.id===ecDlg.ger), d=+b.dataset.d; if(d&&B[i+d]){ render(); ecGerDlg(B[i+d].id); return; } closeOverlays(); ecDlg=null; render(); return; }
  }
},true);
