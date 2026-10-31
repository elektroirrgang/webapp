/* ===== Zählerschrank nach VDE-AR-N 4100: Felder und Zählerplätze =====
   Liegt am Verteiler als zs = {felder:[{id,typ:"z"|"v"|"m",n?:1|2}], apz:{feldId,lage:"oben"|"unten"}|null, zp:[{id,feldId,pos,zweck,art,sls,nr,bez}]}.
   Zählerfeld von oben nach unten: AAR (Hauptschalter/HLAK) · RfZ (über dem Zähler) · Zähler (1 oder 2 nebeneinander, Doppelbelegung) · NAR (SLS, Überspannungsschutz).
   APZ genau einmal, ganz oben oder ganz unten im Verteiler- oder Multimediafeld. Aufbau per Vorlage, danach anpassbar; je Zählerplatz ein Fenster.
   Benutzt im Assistenten (vt-aufnahme.js, Art „Zählerschrank / HV“) und auf der Verteilerseite (Karte „Zählerschrank“). */
const ZS_TYP={z:"Zählerfeld",v:"Verteilerfeld",m:"Multimedia",t:"TSG-Feld"}, ZS_TYP_KURZ={z:"Zähler",v:"Verteiler",m:"Media",t:"TSG"};
/* Vorlagen: z1 = Zählerfeld mit 1 Zähler, z2 = Zählerfeld doppelt belegt; APZ unten im ersten Verteilerfeld (wie bei Hager univers) */
const ZS_VORL=[["1z","1 Zähler","Zählerfeld · Verteilerfeld mit APZ",["z1","v"]],["2z1","2 Zähler in einem Feld","Zählerfeld doppelt belegt · Verteilerfeld mit APZ",["z2","v"]],
  ["2z","2 Zähler in zwei Feldern","2 Zählerfelder · Verteilerfeld mit APZ",["z1","z1","v"]],["2zm","2 Zähler mit Multimedia","Zählerfeld doppelt belegt · Verteilerfeld mit APZ · Multimedia",["z2","v","m"]],
  ["4z","4 Zähler mit Multimedia","2 Zählerfelder doppelt belegt · Verteilerfeld mit APZ · Multimedia",["z2","z2","v","m"]]];
const ZS_ZWECK=[["haushalt","Haushalt"],["wp","Wärmepumpe"],["wallbox","Wallbox"],["pv","PV / Einspeisung"],["allgemein","Allgemein"],["gewerbe","Gewerbe"],["frei","Frei / Reserve"]];
const zsBelegt=z=>z.zweck!=="frei";   /* „frei“: Zählerplatz ohne Zähler, für später */
/* Schrankhöhen mit 150-mm-Reihenraster (Hager univers Z u. a.): Verteilerfeld 7 bzw. 9 Reihen, mit APZ im Feld 2 Reihen weniger */
const ZS_HOEHE=[[1100,"1100 mm","Zählerplatz 1050 mm · Verteilerfeld 7-reihig, mit APZ 5-reihig"],[1400,"1400 mm","Zählerplatz 1350 mm · Verteilerfeld 9-reihig, mit APZ 7-reihig"],[0,"Andere / weiß nicht","Reihen selbst angeben"]];
const zsReihenFeld=(zs,f,reihen)=>{ if(+f.reihen) return +f.reihen; const h=+zs.hoehe; if(h===1100||h===1400){ const n=h===1100?7:9; return n-(zs.apz&&zs.apz.feldId===f.id?2:0); } return +reihen||4; };
const zsReihenSumme=(zs,reihen)=>zs.felder.filter(f=>f.typ==="v").reduce((a,f)=>a+zsReihenFeld(zs,f,reihen),0);
const ZS_ART=[["ehz","eHZ (BKE-I)","Stecktechnik"],["3pkt","3-Punkt","Schraubbefestigung"]];
const ZS_SLS=[["E35","35 A"],["E40","40 A"],["E50","50 A"],["E63","63 A"],["keiner","Keiner / weiß nicht"]];
/* SLS je Zählerplatz und Überspannungsschutz je Schrank – Hersteller und Artikel (Sammelschiene im NAR).
   Schneider Electric: kein SLS für die Zählerplatz-Sammelschiene gefunden, darum nur Hager und ABB. */
const ZS_SLS_HERST=[["hager","Hager"],["abb","ABB"]];
const ZS_SLS_NR={hager:{E35:"HTS335E",E40:"HTS340E",E50:"HTS350E",E63:"HTS363E"},abb:{E35:"2CDS781001R4352",E40:"2CDS781001R4402",E50:"2CDS781001R4502",E63:"2CDS781001R4632"}};
const ZS_SLS_TYP={hager:a=>`Hager HTS3${a}E`,abb:a=>`ABB S751/3-E${a}`};
const ZS_USS=[["SPA700Z","Hager SPA700Z","Typ 1+2+3 · 3-polig · TN-C · Sammelschiene"],["SPA701Z","Hager SPA701Z","Typ 1+2+3 · 4-polig · TT/TN-S · Sammelschiene"],
  ["2CTB815799R2800","ABB OVR ZP 3N 7.5-255","Typ 1+2+3 · mit integriertem LS · Sammelschiene"],["2CTB815799R1100","ABB OVR ZP+ 3N 7.5-255","Typ 1+2 · 4-polig · TT/TN-S"],
  ["5096961","OBO MCF30-NAR-TT","Typ 1+2 · TT · Sammelschiene NAR · Art.-Nr. 5096961"],["1168940","Phoenix Contact FLT-SEC-ZP2 3S-255/7.5","Typ 1+2+3 · Sammelschiene · Art.-Nr. 1168940"],
  ["7P.04.8.255.Z007","Finder 7P.04.8.255.Z007","Typ 1+2 · mit Abgang L/N 6,3 A"],
  ["A9L16482","Schneider Acti9 iPRD1 12.5r 3P+N","Typ 1+2 · TT/TN-S · Hutschiene"],["keiner","Ohne / nicht festgelegt",""]];
/* Eigene Gerätegrafiken (Frontansicht, transparent) für die Zeichnung: Datei, Breite, Höhe in Pixeln, Versatz nach oben/unten in mm (Sammelschienen N, L1, L2, L3, PE bei 803/843/883/923/963 mm, Abstand 40 mm; Hager: Frontkasten auf Hebelhöhe der SLS (Abdeckungsausschnitt), Gerät ragt nach unten über die PE-Schiene hinaus; 5. Wert = Höhe in mm (0 = Standard 200), 6. Wert = Lage der PE-Klemme im Bild von links (0…1, Standard Mitte) – sie kommt auf den PE-Leiter) */
const ZS_USS_BILD={SPA701Z:["uss-hager-spa701z.png",181,1400,-7,0,.503],"5096961":["uss-obo-mcf30-nar-tt.png",153,700],"1168940":["uss-phoenix-flt-sec-zp2.png",67,700],"7P.04.8.255.Z007":["uss-finder-7p04.png",187,700]};
const zsSlsStd=zs=>zs&&zs.hersteller==="sj"?"abb":"hager";
const zsSlsH=(zs,z)=>z&&ZS_SLS_NR[z.slsH]?z.slsH:zsSlsStd(zs);
function zsSlsGeraet(zs,z){ if(!z||!z.sls||z.sls==="keiner") return null; const h=zsSlsH(zs,z), a=z.sls.slice(1), nr=ZS_SLS_NR[h][z.sls];
  const i=MAT_INFO[nr]||MAT_INFO[h==="abb"?"2CDS781001R4352":""]||null; return {h,nr,name:ZS_SLS_TYP[h](a),bild:i&&i.bild||""}; }
const zsUssStd=zs=>zs&&zs.hersteller==="sj"?"2CTB815799R2800":"SPA700Z";
function zsUssGeraet(zs){ const k=zs.uss||zsUssStd(zs); if(k==="keiner") return null; const e=ZS_USS.find(x=>x[0]===k)||ZS_USS[0], i=MAT_INFO[e[0]];
  return {nr:e[0],name:e[1],info:e[2],bild:i&&i.bild||""}; }
const zsTxt=(L,k)=>(L.find(x=>x[0]===k)||[])[1]||"";
const zsFeldAus=c=>c[0]==="z"?{id:uid(),typ:"z",n:+c[1]||1}:{id:uid(),typ:c};
function zsAusVorlage(k){ const v=ZS_VORL.find(x=>x[0]===k)||ZS_VORL[0], felder=v[3].map(zsFeldAus), vf=felder.find(f=>f.typ==="v")||felder.find(f=>f.typ==="m");
  const zs={felder,apz:vf?{feldId:vf.id,lage:"unten"}:null,zp:[]}; zsAbgleich(zs); return zs; }
/* Zählerplätze an die Zählerfelder angleichen (Reihenfolge: Feld von links, im Feld von links); APZ nur in Verteiler-/Multimediafeld */
function zsAbgleich(zs){ const alt=zs.zp||[]; let n=0; zs.zp=[];
  zs.felder.forEach(f=>{ if(f.typ!=="z"){ delete f.n; return; } f.n=f.n===2?2:1;
    for(let p=0;p<f.n;p++){ n++; const z=alt.find(x=>x.feldId===f.id&&(x.pos||0)===p); zs.zp.push(z?{...z,pos:p}:{id:uid(),feldId:f.id,pos:p,zweck:n===1?"haushalt":"",art:"ehz",sls:n===1?"E35":"",nr:"",bez:""}); } });
  if(zs.apz&&!zs.felder.some(f=>f.id===zs.apz.feldId&&f.typ!=="z")) zs.apz=null;
  return zs; }
const zsKopie=zs=>JSON.parse(JSON.stringify(zs||{felder:[],apz:null,zp:[]}));
function zsZpText(z){ if(!zsBelegt(z)) return "kein Zähler gesetzt – Platz frei für später"; if(!z.zweck) return "noch offen – später eintragen"; return [zsTxt(ZS_ART,z.art).replace(" (BKE-I)",""),z.sls&&z.sls!=="keiner"?"SLS "+z.sls.slice(1)+" A":"",z.nr?"Nr. "+z.nr:"Nummer fehlt"].filter(Boolean).join(" · "); }
const zsFeldNr=(zs,id)=>zs.felder.findIndex(f=>f.id===id)+1;
const zsApzText=zs=>{ if(!zs.apz) return ""; const f=zs.felder.find(x=>x.id===zs.apz.feldId); return f?`${ZS_TYP[f.typ]} ${zsFeldNr(zs,f.id)} · ${zs.apz.lage}`:""; };

/* Vorderansicht: Zählerfeld mit AAR · RfZ · Zähler · NAR, Verteilerfeld mit APZ oben/unten, Multimediafeld */
function zsSvg(zs,reihen,klein,aktiv,selFeld){ return zsZeichnung(zs,reihen,aktiv,klein?undefined:selFeld,klein?{mini:true}:null); const F=zs.felder, W=72, G=4, H=176, w=F.length*(W+G)+G; let zn=0;
  const T=(x,y,t,c)=>klein?"":`<text x="${x}" y="${y}" class="t ${c||""}">${t}</text>`;
  const feld=(f,i)=>{ const x=G+i*(W+G), y=4; let inn="";
    if(f.typ==="z"){ const n=f.n||1, zw=(W-12-(n-1)*4)/n;
      inn=`<rect x="${x+4}" y="${y+4}" width="${W-8}" height="34" rx="3" class="d"/>${T(x+W/2,y+25,"AAR","k")}`
        +`<rect x="${x+4}" y="${y+42}" width="${W-8}" height="20" rx="3" class="r"/>${T(x+W/2,y+56,"RfZ","k")}`
        +Array.from({length:n},(_,p)=>{ zn++; const zx=x+6+p*(zw+4), an=aktiv&&aktiv===`${f.id}:${p}`;
          const zz=zs.zp&&zs.zp.find(q=>q.feldId===f.id&&(q.pos||0)===p), frei=zz&&!zsBelegt(zz);
          return `<rect x="${zx}" y="${y+66}" width="${zw}" height="62" rx="3" class="e${an?" an":""}${frei?" frei":""}"/><rect x="${zx+4}" y="${y+74}" width="${zw-8}" height="10" rx="1" class="d"/>${T(zx+zw/2,y+112,"Z"+zn)}`; }).join("")
        +`<rect x="${x+4}" y="${y+132}" width="${W-8}" height="40" rx="3" class="n"/>${T(x+W/2,y+156,"NAR","k")}`; }
    else if(f.typ==="v"){ const r=Math.max(1,Math.min(zsReihenFeld(zs,f,reihen),9)), apz=zs.apz&&zs.apz.feldId===f.id?zs.apz.lage:"", oben=apz==="oben", top=y+(oben?50:6), hh=H-8-(apz?46:0);
      inn=Array.from({length:r},(_,k)=>`<rect x="${x+8}" y="${(top+4+k*(hh/r)).toFixed(1)}" width="${W-16}" height="${Math.max(4,Math.min(14,hh/r-6)).toFixed(1)}" rx="2" class="e"/>`).join("")
        +(apz?`<rect x="${x+4}" y="${oben?y+4:y+H-46}" width="${W-8}" height="42" rx="3" class="a"/>${T(x+W/2,(oben?y+4:y+H-46)+26,"APZ")}`:""); }
    else { const apz=zs.apz&&zs.apz.feldId===f.id?zs.apz.lage:"", oben=apz==="oben";
      const t0=y+(oben?50:6), t1=y+H-(apz&&!oben?50:6), hh=t1-t0;
      inn=Array.from({length:Math.floor(hh/9)},(_,k)=>Array.from({length:6},(_,j)=>`<circle cx="${x+11+j*10}" cy="${(t0+5+k*9).toFixed(1)}" r="1.2" class="p"/>`).join("")).join("")
        +`<rect x="${x+6}" y="${t0+4}" width="${W-12}" height="13" rx="2" class="e"/>${[0,1,2,3,4,5].map(j=>`<rect x="${x+10+j*9.2}" y="${t0+8}" width="6" height="5" rx="1" class="d2"/>`).join("")}`
        +`<rect x="${x+10}" y="${t0+26}" width="${W-20}" height="${Math.min(30,hh*0.2).toFixed(1)}" rx="5" class="e"/><path d="M${x+18} ${t0+26}v-6M${x+W-18} ${t0+26}v-6" class="l"/>${[0,1,2].map(j=>`<circle cx="${x+20+j*7}" cy="${t0+26+Math.min(30,hh*0.2)-7}" r="1.8" class="led"/>`).join("")}`
        +`<rect x="${x+10}" y="${(t0+26+Math.min(30,hh*0.2)+10).toFixed(1)}" width="${W-20}" height="12" rx="3" class="e"/>${[0,1,2,3,4].map(j=>`<rect x="${x+14+j*9}" y="${(t0+26+Math.min(30,hh*0.2)+14).toFixed(1)}" width="5" height="4" rx="1" class="d2"/>`).join("")}`
        +`<rect x="${x+8}" y="${(t1-22).toFixed(1)}" width="${W-16}" height="16" rx="4" class="e"/>${[0,1,2].map(j=>`<circle cx="${x+20+j*16}" cy="${(t1-14).toFixed(1)}" r="4.5" class="d2"/>`).join("")}`
        +(apz?`<rect x="${x+4}" y="${oben?y+4:y+H-46}" width="${W-8}" height="42" rx="3" class="a"/>${T(x+W/2,(oben?y+4:y+H-46)+26,"APZ")}`:""); }
    const gw=i===selFeld; return `<rect x="${x}" y="${y}" width="${W}" height="${H}" rx="6" class="f${gw?" sel":""}"/>${inn}${gw&&!klein?`<rect x="${x+4}" y="${y+H+3}" width="${W-8}" height="18" rx="9" class="lp"/>`:""}${T(x+W/2,y+H+16,ZS_TYP_KURZ[f.typ],gw?"u on":"u")}`; };
  return `<svg class="zs-svg${klein?" klein":""}" viewBox="0 0 ${w} ${klein?H+8:H+24}" style="--n:${F.length};max-width:${F.length*(klein?28:104)}px" aria-hidden="true">${F.map(feld).join("")}</svg>`; }

/* ---- Bedarf → Vorschlag (wie ein Zählerschrank-Konfigurator: erst fragen, was dran soll, dann alles ableiten) ---- */
const ZS_HERST=[["hager","Hager","univers Z"],["sj","ABB","Striebel & John"],["abn","ABN",""],["andere","Anderer / weiß nicht",""]];
const ZS_GERHERST=[["Hager","Hager",""],["Schneider Electric","Schneider Electric",""],["ABB","ABB",""],["","Gemischt / egal","alle Hersteller zeigen"]];
const zsHerstText=k=>{ const h=ZS_HERST.find(x=>x[0]===k); return h&&k!=="andere"?[h[1],h[2]].filter(Boolean).join(" "):""; };
const ZS_BEDARF=[["hh","Wohnungen / Haushalte","je Wohnung ein Zähler"],["allg","Allgemeinstrom","Treppenhaus, Keller, Außenlicht"],["gew","Gewerbe",""],
  ["wp","Wärmepumpe mit eigenem Zähler",""],["wb","Wallbox mit eigenem Zähler",""],["pv","PV mit eigenem Zähler","sonst Zweirichtungszähler am Haushalt"],["res","Reserveplätze","Platz für später, ohne Zähler"]];
const ZS_BEDARF_STEUER=[["wpH","Wärmepumpe","ohne eigenen Zähler, steuerbar nach §14a"],["wbH","Wallbox","ohne eigenen Zähler, steuerbar nach §14a"]];
const ZS_BEDARF_FELD=[["vf","Verteilerfelder",""],["mm","Multimediafelder",""]];
const zsBedarfSteuer=b=>!!b.steuer||(+b.wpH||0)+(+b.wbH||0)>0;
const zsBedarfStd=()=>({hh:1,allg:0,gew:0,wp:0,wb:0,pv:0,res:0,wpH:0,wbH:0,vf:1,mm:0});
const zsBedarfZp=b=>["hh","allg","gew","wp","wb","pv","res"].reduce((a,k)=>a+(+b[k]||0),0);
/* PLZ → Netzbetreiber (Oberberg; RheinNetz betreibt Waldbröl seit 01.01.2026, Morsbach und Reichshof seit 2017 und die AggerEnergie-Netze) */
const ZS_PLZ_NB={"51545":"rheinnetz","51597":"rheinnetz","51580":"rheinnetz","51643":"rheinnetz","51645":"rheinnetz","51647":"rheinnetz","51674":"rheinnetz","51702":"rheinnetz","51766":"rheinnetz","51709":"rheinnetz","51491":"rheinnetz"};
function zsAusBedarf(b,alt){ const N=Math.max(1,zsBedarfZp(b)), felder=[], zp=[];
  for(let n=N;n>0;n-=2) felder.push({id:uid(),typ:"z",n:n>=2?2:1});
  for(let i=0;i<Math.max(1,+b.vf||1);i++) felder.push({id:uid(),typ:"v"});
  for(let i=0;i<(+b.mm||0);i++) felder.push({id:uid(),typ:"m"});
  const zs={felder,apz:{feldId:felder.find(f=>f.typ==="v").id,lage:"unten"},zp:[],hoehe:alt&&alt.hoehe!=null?alt.hoehe:1100,nb:alt&&alt.nb,hersteller:alt&&alt.hersteller,steuerbar:zsBedarfSteuer(b),bedarf:{...b}};
  zsZpAusBedarf(zs,b); return zs; }
/* Zählerplätze in Feldreihenfolge mit dem Bedarf belegen: Wohnungen, Allgemein, Gewerbe, WP, Wallbox, PV, dann frei */
function zsBedarfListe(b){ const L=[], hh=+b.hh||0;
  for(let i=0;i<hh;i++) L.push(["haushalt",hh>1?`Wohnung ${i+1}`:""]);
  [["allg","allgemein"],["gew","gewerbe"],["wp","wp"],["wb","wallbox"],["pv","pv"]].forEach(([k,z])=>{ for(let i=0;i<(+b[k]||0);i++) L.push([z,""]); });
  return L; }
function zsZpAusBedarf(zs,b){ const liste=zsBedarfListe(b); let k=0; zs.zp=[];
  zs.felder.filter(f=>f.typ==="z").forEach(f=>{ for(let p=0;p<f.n;p++){ const [zw,bez]=liste[k++]||["frei",""]; zs.zp.push({id:uid(),feldId:f.id,pos:p,zweck:zw,art:"ehz",sls:zw==="frei"?"":"E35",nr:"",bez}); } }); }
/* ---- Schrank-Katalog: Komplettschränke je Hersteller mit Foto; ein Modell legt Felder, Höhe und APZ fest ---- */
const ZS_MODELLE=[
  /* ABB / Striebel & John – BKE-I-Komplettschränke 1100 mm (Recherche 30.10.2026; Aufbau aus den Herstellerzeichnungen: R = Reserveplatz, APZ unten rechts; Schränke mit TSG-Feld bewusst weggelassen – Steuerung läuft heute über RfZ und APZ) */
  {h:"sj",hnr:"BA27CB",name:"Komplettschrank A27 1 Zähler + 1 Reserve, 1V5 A2",hoehe:1100,breite:550,felder:[{typ:"z",n:2},{typ:"v",reihen:5,apz:"unten"}],bild:"https://emax24.b-cdn.net/media/image/21/dd/7a/Striebel-John-Komplettschrank-BA27CB-AP-BKE-I-A27.jpg"},
  {h:"sj",hnr:"BA27FM",name:"Komplettschrank A27 2Z 1V5 A2",hoehe:1100,breite:550,felder:[{typ:"z",n:2},{typ:"v",reihen:5,apz:"unten"}],bild:"https://asset.re-in.de/isa/160267/c1/-/de/RIB_0017485956PI11039043/Striebel-John-Komplettschrank-BA27FM.webp?x=500&y=500&ex=500&ey=500&align=center&format=WEBP&quality=90"},
  {h:"sj",hnr:"BA27CML",name:"Komplettschrank A27 2Z 1V5 A2 mit Überspannungsschutz",hoehe:1100,breite:550,felder:[{typ:"z",n:2},{typ:"v",reihen:5,apz:"unten"}],bild:"https://asset.re-in.de/isa/160267/c1/-/de/RIB_0016503957PI03554881/Striebel-John-Komplettschrank-BA27CML.webp?x=500&y=500&ex=500&ey=500&align=center&format=WEBP&quality=90"},
  {h:"sj",hnr:"BA37FG",name:"Komplettschrank A37 2 Zähler + 2 Reserve, 1V5 A2",hoehe:1100,breite:800,felder:[{typ:"z",n:2},{typ:"z",n:2},{typ:"v",reihen:5,apz:"unten"}],bild:"https://asset.re-in.de/isa/160267/c1/-/de/RIB_0017485713PI11014055/Striebel-John-Komplettschrank-BA37FG.webp?x=500&y=500&ex=500&ey=500&align=center&format=WEBP&quality=90"},
  /* ABN – eHZ-Komplettschränke ABNRS…E… 1100 mm (Reserveplätze zählen als Zählerplatz; APZ-Lage nicht angegeben, „unten“ angenommen) */
  {h:"abn",hnr:"ABNRS207E0011",name:"Zählerschrank 1Z 1R 1V 1APZ HLAK",hoehe:1100,breite:550,felder:[{typ:"z",n:2},{typ:"v",reihen:5,apz:"unten"}],bild:"https://www.elektro4000.de/images/product_images/info_images/ABN-ZA-EUR-hlerschrank-ABNRS207E0011-1899860_0.webp"},
  {h:"abn",hnr:"ABNRS207E0012",name:"Zählerschrank 2Z 1V 1APZ HLAK",hoehe:1100,breite:550,felder:[{typ:"z",n:2},{typ:"v",reihen:5,apz:"unten"}],bild:"https://www.elektro4000.de/images/product_images/info_images/ABN-ZA-EUR-hlerschrank-ABNRS207E0012-1899861_0.webp"},
  {h:"abn",hnr:"ABNRS307E0012",name:"Zählerschrank 2Z 2R 1V 1APZ HLAK",hoehe:1100,breite:800,felder:[{typ:"z",n:2},{typ:"z",n:2},{typ:"v",reihen:5,apz:"unten"}],bild:"https://www.elektroland24.de/media/fb/b8/30/1742896340/8e840292de7b14da730f3091d831baba89890729.jpeg?ts=1771017218"},
  {h:"abn",hnr:"ABNRS307E0022",name:"Zählerschrank 2Z 2R 1V 1APZ mit sperrbarem Hauptschalter",hoehe:1100,breite:800,felder:[{typ:"z",n:2},{typ:"z",n:2},{typ:"v",reihen:5,apz:"unten"}],bild:"https://www.elektroland24.de/media/fb/d3/d9/1742896348/61276b2d3dba84c1d2a58db2ec02392733bcd9d4.jpeg?ts=1771017218"},
  {h:"abn",hnr:"ABNRS307E0131",name:"Zählerschrank 1Z 1R 1V 1APZ mit Multimedia",hoehe:1100,breite:800,felder:[{typ:"z",n:2},{typ:"m"},{typ:"v",reihen:5,apz:"unten"}],bild:"https://www.smartgoods.de/abn-zaehlerschrank-ehz-1z-1r-1v-1apz-hlak-okk-media.1056750_highres.webp"},
  /* Hager univers Z – Komplettschränke eHZ 1100 mm; 3–4 Zähler und 1400 mm gibt es nur als Zusammenstellung Leerschrank + Komplettfeld + Verteilerfeld (Recherche 30.10.2026) */
  {h:"hager",hnr:"ZB32SEF15",name:"Komplettschrank 1 ZP, APZ, VT5, 2-feldig",hoehe:1100,breite:550,felder:[{typ:"z",n:1},{typ:"v",reihen:5,apz:"unten"}],bild:"https://www.zaehlerschrank24.de/pub/media/catalog/product/cache/e5e5f169cf45d7fe32369499586660c4/z/b/zb32sef15.jpg"},
  {h:"hager",hnr:"ZB32ET215W1",name:"Komplettschrank 1 ZP, APZ, VT5, 2-feldig",hoehe:1100,breite:550,felder:[{typ:"z",n:1},{typ:"v",reihen:5,apz:"unten"}],bild:"https://emax24.b-cdn.net/media/image/60/5e/d3/Hager-Komplettschrank-ZB32ET215W1-1ZP-BKE-I-APZ.jpg"},
  {h:"hager",hnr:"ZB32SET25LK",name:"Komplettschrank 2 ZP in einem Feld, APZ, VT5",hoehe:1100,breite:550,felder:[{typ:"z",n:2},{typ:"v",reihen:5,apz:"unten"}],bild:""},
  {h:"hager",hnr:"ZB33SET25LK",name:"Komplettschrank 2 ZP, APZ, VT5, 3-feldig",hoehe:1100,breite:800,felder:[{typ:"z",n:1},{typ:"z",n:1},{typ:"v",reihen:5,apz:"unten"}],bild:"https://www.zaehlerschrank24.de/pub/media/catalog/product/cache/e5e5f169cf45d7fe32369499586660c4/z/b/zb33set25lk.jpg"},
  {h:"hager",hnr:"ZB33ET225W1",name:"Komplettschrank 2 ZP + 2 Leerplätze, APZ, VT5, 3-feldig",hoehe:1100,breite:800,felder:[{typ:"z",n:2},{typ:"z",n:2},{typ:"v",reihen:5,apz:"unten"}],bild:"https://www.zaehlerschrank24.de/pub/media/catalog/product/cache/e5e5f169cf45d7fe32369499586660c4/z/b/zb33et225w1.jpg"},
  {h:"hager",hnr:"ZB33S + ZK3EH24 + ZU37VT5APZ2",name:"Leerschrank 3-feldig + Komplettfeld 4 ZP + Verteilerfeld 5-reihig mit APZ",hoehe:1100,breite:800,felder:[{typ:"z",n:2},{typ:"z",n:2},{typ:"v",reihen:5,apz:"unten"}],bild:"https://assets.hager.com/step-content/P/HA_86078509/11/std.lang.all/ZB33S00.webp"},
  {h:"hager",hnr:"ZB34APZ2 + ZH3EH22",name:"Systemschrank 4-feldig mit Multimedia + Komplettfeld 2 ZP",hoehe:1100,breite:1050,felder:[{typ:"z",n:2},{typ:"m"},{typ:"m"},{typ:"v",reihen:5,apz:"unten"}],bild:""},
  {h:"hager",hnr:"ZB53S + ZK5EH24 + ZU59VT7APZ2",name:"Leerschrank 1400 mm + Komplettfeld 4 ZP + Verteilerfeld 7-reihig mit APZ",hoehe:1400,breite:800,felder:[{typ:"z",n:2},{typ:"z",n:2},{typ:"v",reihen:7,apz:"unten"}],bild:"https://assets.hager.com/step-content/P/HA_86078552/11/std.lang.all/ZB53S00.webp"}];
const zsModPlaetze=m=>m.felder.filter(f=>f.typ==="z").reduce((a,f)=>a+(f.n||1),0);
const zsModText=m=>[`${zsModPlaetze(m)} eHZ`,...m.felder.filter(f=>f.typ==="v").map(f=>`Verteiler${f.reihen?" "+f.reihen+"-reihig":""}${f.apz?" mit APZ":""}`),m.felder.some(f=>f.typ==="m")?"Multimedia":"",m.hoehe?m.hoehe+" mm":""].filter(Boolean).join(" · ");
function zsAusModell(m,b,alt){ const felder=m.felder.map(x=>x.typ==="z"?{id:uid(),typ:"z",n:x.n===2?2:1}:x.typ==="v"?{id:uid(),typ:"v",...(x.reihen?{reihen:x.reihen}:{})}:{id:uid(),typ:x.typ==="t"?"t":"m"});
  if(!felder.some(f=>f.typ==="v")) felder.push({id:uid(),typ:"v"});
  const ai=m.felder.findIndex(x=>x.typ==="v"&&x.apz), af=ai>=0?felder[ai]:felder.find(f=>f.typ==="v");
  const zs={felder,apz:{feldId:af.id,lage:ai>=0?m.felder[ai].apz:"unten"},zp:[],hoehe:m.hoehe||1100,nb:alt&&alt.nb,hersteller:m.h,steuerbar:zsBedarfSteuer(b),bedarf:{...b},modell:{h:m.h,hnr:m.hnr,name:m.name,bild:m.bild||""}};
  zsZpAusBedarf(zs,b); return zs; }
const zsModAnz=(m,t)=>m.felder.filter(f=>f.typ===t).length;
function zsModellFenster(d){ const b=d.bedarf, need=Math.max(1,zsBedarfZp(b)), vf=Math.max(1,+b.vf||1), mm=+b.mm||0, A=ZS_MODELLE.filter(m=>m.h===d.hersteller);
  const ueber=m=>(zsModPlaetze(m)-need)+(zsModAnz(m,"v")-vf)*2+(zsModAnz(m,"m")-mm)*2;
  const passt=A.filter(m=>zsModPlaetze(m)>=need&&zsModAnz(m,"v")>=vf&&zsModAnz(m,"m")>=mm).sort((a,c)=>ueber(a)-ueber(c)||(a.hoehe||0)-(c.hoehe||0)||(a.breite||0)-(c.breite||0));
  const genau=passt.filter(m=>zsModPlaetze(m)===need&&zsModAnz(m,"v")===vf&&zsModAnz(m,"m")===mm), groesser=passt.filter(m=>!genau.includes(m));
  const was=zsBedarfSumText(b).split(" · ").filter(x=>!/Zählerfeld/.test(x)).join(", ");
  const karte=m=>`<button type="button" class="aw-g zs-mod" data-act="awModell" data-v="${esc(m.hnr)}"${d.zs&&d.zs.modell&&d.zs.modell.hnr===m.hnr?' aria-pressed="true"':""}><span class="aw-gb zs-mod-svg">${zsSvg(zsAusModell(m,b,d.zs),0,true)}${m.bild?`<img class="zs-mod-foto" src="${esc(typeof bildLokal==="function"?bildLokal(m.bild):m.bild)}" alt="" loading="lazy" onerror="this.remove()">`:""}</span><b>${esc(m.name)}</b><small>${esc(zsModText(m))}</small><small class="zs-mod-nr">${esc(zsHerstText(m.h).split(" ")[0])} ${esc(m.hnr)}</small></button>`;
  /* Immer zuerst: Schrank aus Leergehäuse und Feldern, genau nach Bedarf – wie im Konfigurator von zaehlerschrank24.de */
  const eig=zsAusBedarf(b,null), gg=zsGeo(eig), ft=eig.felder.map(f=>ZS_TYP_KURZ[f.typ]).join(" · ");
  const frei=`<button type="button" class="aw-g zs-mod" data-act="awModell" data-v=""${d.ohneModell?' aria-pressed="true"':""}><span class="aw-gb zs-mod-svg">${zsSvg(eig,0,true)}</span><b>Aus Feldern zusammengestellt</b><small>${gg.schr.map(c=>c.B).join(" + ")} × ${gg.H} mm${gg.schr.length>1?` · ${gg.schr.length} Schränke`:""}</small><small class="zs-mod-nr">${esc(ft)}</small></button>`;
  return {frage:"Welcher Schrank?",hinweis:`Für ${was}. Antippen übernimmt Felder, Höhe und APZ.`,
    inhalt:`<div class="aw-lbl">Passt genau</div><div class="aw-grid">${frei}${genau.map(karte).join("")}</div>
      ${groesser.length?`<div class="aw-lbl">Fertige Modelle · größer</div><div class="aw-grid">${groesser.map(karte).join("")}</div>`:""}`}; }
function zsBedarfFenster(b){ const st=(k,t,u)=>`<div class="zs-st"><span class="zs-stt"><b>${esc(t)}</b>${u?`<small>${esc(u)}</small>`:""}</span><button type="button" class="zs-stb" data-act="awBed" data-k="${k}" data-d="-1" aria-label="weniger">−</button><span class="zs-stn" id="awBed_${k}">${+b[k]||0}</span><button type="button" class="zs-stb" data-act="awBed" data-k="${k}" data-d="1" aria-label="mehr">+</button></div>`;
  return {frage:"Was soll dran?",hinweis:"Daraus stellt die App den Schrank zusammen – Felder, Höhe, APZ und Zählerplätze.",
    inhalt:`<div class="zs-vs zs-bed"><div class="zs-bild" id="awBedBild">${zsSvg(zsAusBedarf(b,null),0)}</div><div class="zs-vs-r">
      <div class="aw-lbl">Zählerplätze</div><div class="zs-sts">${ZS_BEDARF.map(([k,t,u])=>st(k,t,u)).join("")}</div>
      <div class="aw-lbl">Am Haushaltszähler</div><div class="zs-sts">${ZS_BEDARF_STEUER.map(([k,t,u])=>st(k,t,u)).join("")}</div>
      <div class="aw-lbl">Weitere Felder</div><div class="zs-sts">${ZS_BEDARF_FELD.map(([k,t,u])=>st(k,t,u)).join("")}</div></div></div>`,
    fuss:`<span class="aw-fuss-info zs-sum" id="awBedSum">${zsBedarfSumHtml(b)}</span><button type="button" class="btn-filled" data-act="awNeuWeiter">Weiter</button>`}; }
const zsMz=(n,e,m)=>`${n} ${n===1?e:m}`;
const zsBedarfSumText=b=>{ const n=Math.max(1,zsBedarfZp(b)), vf=Math.max(1,+b.vf||1), mm=+b.mm||0;
  return [zsMz(n,"Zählerplatz","Zählerplätze"),zsMz(Math.ceil(n/2),"Zählerfeld","Zählerfelder"),zsMz(vf,"Verteilerfeld","Verteilerfelder"),mm?zsMz(mm,"Multimediafeld","Multimediafelder"):""].filter(Boolean).join(" · "); };
/* Fuß: kleine Vorschau des Schranks plus Zusammenfassung – ändert sich mit jedem Plus/Minus */
const zsBedarfSumHtml=b=>`${zsSvg(zsAusBedarf(b,null),0,true)}<span>${esc(zsBedarfSumText(b))}</span>`;
function zsVorschlagFenster(d,ortPlz){ const zs=d.zs, nb=zs.nb, R=(k,t,u)=>`<button type="button" class="zs-zp" data-act="awSub" data-v="${k}"><span class="zs-zt"><b>${esc(t)}</b><small>${esc(u)}</small></span>${icon("chev")}</button>`;
  const nZ=zs.zp.filter(zsBelegt).length, nF=zs.zp.length-nZ, vf=zs.felder.filter(f=>f.typ==="v");
  return {frage:"Vorschlag",hinweis:"Aus deinen Angaben abgeleitet. Antippen zum Ändern – sonst „Passt so“.",
    inhalt:`<div class="zs-vs"><div class="zs-bild">${zsKlick(zs,0,null,{feld:()=>'data-act="awSub" data-v="felder"',zp:()=>'data-act="awSub" data-v="bedarf"',apz:()=>'data-act="awSub" data-v="apz"'})}</div><div class="zs-zps">
      ${R("modell","Schrank",zs.modell?`${zsHerstText(zs.modell.h).split(" ")[0]} ${zs.modell.hnr} · ${zs.modell.name}`:"ohne Modell – aus den Angaben")}
      ${R("bedarf","Zählerplätze",`${nZ} Zähler${nF?` + ${nF} frei`:""} · ${zs.felder.filter(f=>f.typ==="z").length} Zählerfeld${zs.felder.filter(f=>f.typ==="z").length===1?"":"er"} · eHZ (BKE-I)`)}
      ${R("felder","Felder",zs.felder.map(f=>ZS_TYP_KURZ[f.typ]).join(" · "))}
      ${R("hoehe","Schrankhöhe",+zs.hoehe?`${zs.hoehe} mm · ${vf.map(f=>zsReihenFeld(zs,f,0)+"-reihig").join(" + ")} · ${zsReihenSumme(zs,0)*12} TE`:"selbst angeben")}
      ${R("apz","APZ",zs.apz?zsApzText(zs):"kein APZ")}
      ${R("hersteller","Hersteller",zsHerstText(zs.hersteller)||"nicht festgelegt")}
      ${R("geraete","Einbaugeräte",d.gerHerst||"gemischt")}
      ${R("montage","Montage",d.montage==="ap"?"Aufputz":"Unterputz")}
      ${R("name","Name",d.name||"HV")}
      ${R("netz","Netzform",(d.netz||"").split(" |")[0]||"nicht angegeben")}
      ${R("nb","Netzbetreiber",nb?`${zsTxt(ZS_NB,nb)}${d.nbAuto?` · aus PLZ ${ortPlz}`:""}`:"unbekannt – bitte wählen")}</div></div>`,
    fuss:`<span style="flex:1"></span><button type="button" class="btn-filled" data-act="awNeuWeiter">Passt so · anlegen</button>`}; }

/* ---- Fenster (liefern frage/inhalt/fuss für awRahmen) ---- */
function zsAufbauFenster(){ return {frage:"Wie ist der Schrank aufgebaut?",hinweis:"Vorlage antippen – Felder lassen sich danach ändern.",
  inhalt:`<div class="aw-liste">${ZS_VORL.map(([k,t,s,f])=>{ const zs={felder:f.map(zsFeldAus)}; zs.apz=(z=>z?{feldId:z.id,lage:"unten"}:null)(zs.felder.find(x=>x.typ==="v")); return awKachel("zsVorl",k,zsSvg(zs,4,true),t,s); }).join("")}${awKachel("zsVorl","eigen",awSvg("frei"),"Selbst zusammenstellen","Feld für Feld")}</div>`}; }
function zsEdSel(zs){ if(!AW) return 0; AW.feldSel=Math.max(0,Math.min(zs.felder.length-1,AW.feldSel||0)); return AW.feldSel; }
function zsEdBild(zs,reihen){ const n=zs.felder.length, sel=zsEdSel(zs);
  const g=zsGeo(zs), nb=n+(g.schr.length-1)*.3;
  return `<div class="zs-ed" style="width:min(100%,${Math.round(nb*124)}px);--n:${nb}" data-n="${n}"><div class="zs-ed-svg">${zsSvg(zs,reihen,false,null,sel)}</div>
    <div class="zs-ed-hit" style="inset:auto;padding:0;left:0;width:100%;top:${g.oben.toFixed(2)}%;height:${g.hoehe.toFixed(2)}%">${zs.felder.map((f,i)=>`<button type="button" data-zsfeld="${i}" aria-label="Feld ${i+1}" aria-pressed="${i===sel}" style="left:${g.felder[i].links.toFixed(2)}%;width:${g.felder[i].breite.toFixed(2)}%"></button>`).join("")}</div></div>`; }
function zsEdKontrolle(zs){ const sel=zsEdSel(zs), f=zs.felder[sel]; if(!f) return "";
  return `<div class="zs-edk"><div class="zs-edk-t"><b>Feld ${sel+1}</b><small>${esc(ZS_TYP[f.typ]||"")}</small></div>
    <div class="zs-ftyp" role="group">${["z","v","m"].map(t=>`<button type="button" data-act="zsTyp" data-i="${sel}" data-v="${t}" aria-pressed="${f.typ===t}">${ZS_TYP_KURZ[t]}</button>`).join("")}</div>
    ${f.typ==="z"?`<div class="zs-ftyp" role="group">${[1,2].map(n=>`<button type="button" data-act="zsAnz" data-i="${sel}" data-v="${n}" aria-pressed="${(f.n||1)===n}">${n===1?"1 Zähler":"2 Zähler"}</button>`).join("")}</div>`:""}
    <div class="zs-edk-a"><button type="button" class="btn-tonal" data-act="zsFeldZiehen" data-i="${sel}" data-d="-1" ${sel?"":"disabled"} aria-label="Nach links">${icon("back")}</button><button type="button" class="btn-tonal zs-rechts" data-act="zsFeldZiehen" data-i="${sel}" data-d="1" ${sel<zs.felder.length-1?"":"disabled"} aria-label="Nach rechts">${icon("back")}</button>
      <span style="flex:1"></span><button type="button" class="btn-tonal zs-weg" data-act="zsFeldWeg" data-i="${sel}" ${zs.felder.length<2?"disabled":""}>${icon("del")}Entfernen</button></div></div>`; }
function zsFelderFenster(zs,reihen,weiterAct,weiterTxt){ return {frage:"Welche Felder, von links nach rechts?",hinweis:"Feld antippen zum Ändern – ziehen zum Verschieben.",
  inhalt:`<div class="zs-vs"><div class="zs-bild zs-edb" id="zsEdB">${zsEdBild(zs,reihen)}</div><div class="zs-vs-r">
    <div id="zsEdK">${zsEdKontrolle(zs)}</div>
    <button type="button" class="aw-unbek zs-plus" data-act="zsFeldPlus">${icon("add")}Feld anhängen</button>
    <div class="aw-lbl">Schrankhöhe</div><div class="zs-ftyp zs-hoehe" role="group">${ZS_HOEHE.map(([h,t])=>`<button type="button" data-act="zsHoeheF" data-v="${h}" aria-pressed="${(+zs.hoehe||0)===h}">${h?t:"Andere"}</button>`).join("")}</div></div></div>`,
  fuss:`<span style="flex:1"></span><button type="button" class="btn-filled" data-act="${weiterAct}">${weiterTxt}</button>`}; }
/* Ziehen in der Zeichnung: Pointer-Events (Maus, Finger, Stift) – während des Ziehens wird live umsortiert */
let ZS_ZUG=null;
document.addEventListener("pointerdown",e=>{ const b=e.target.closest&&e.target.closest("[data-zsfeld]"); if(!b) return; const zs=zsAkt(); if(!zs) return;
  const hit=b.parentElement; ZS_ZUG={hit,start:e.clientX,i:+b.dataset.zsfeld,zieht:false,id:e.pointerId}; try{ hit.setPointerCapture(e.pointerId); }catch(_){} e.preventDefault(); });
document.addEventListener("pointermove",e=>{ const Z=ZS_ZUG; if(!Z||e.pointerId!==Z.id) return; const zs=zsAkt(); if(!zs) return;
  if(!Z.zieht&&Math.abs(e.clientX-Z.start)<8) return; Z.zieht=true;
  const bs=[...Z.hit.querySelectorAll("[data-zsfeld]")], n=zs.felder.length; let ziel=Z.i, best=1e9; bs.forEach((x,k)=>{ const q=x.getBoundingClientRect(), d=Math.abs(e.clientX-(q.left+q.width/2)); if(d<best){ best=d; ziel=k; } }); ziel=Math.max(0,Math.min(n-1,ziel));
  if(ziel===Z.i) return; const [f]=zs.felder.splice(Z.i,1); zs.felder.splice(ziel,0,f); Z.i=ziel; AW.feldSel=ziel;
  const sv=Z.hit.parentElement.querySelector(".zs-ed-svg"); if(sv) sv.innerHTML=zsSvg(zs,AW.reihen||(AW.d&&AW.d.reihen),false,null,ziel);
  Z.hit.querySelectorAll("[data-zsfeld]").forEach((x,k)=>x.setAttribute("aria-pressed",k===ziel)); Z.hit.classList.add("zieht"); });
function zsZugEnde(e){ const Z=ZS_ZUG; if(!Z||e.pointerId!==Z.id) return; ZS_ZUG=null; const zs=zsAkt(); if(!zs) return;
  if(!Z.zieht) AW.feldSel=Z.i; else zsAbgleich(zs);
  zsEdNeu(); }
document.addEventListener("pointerup",zsZugEnde); document.addEventListener("pointercancel",zsZugEnde);
/* Nur Zeichnung und Bedienfeld neu – das Fenster scrollt nicht nach oben */
function zsEdNeu(){ const zs=zsAkt(); if(!zs) return; const B=document.getElementById("zsEdB"), K=document.getElementById("zsEdK"); if(!B||!K){ zsNeuZeichnen(); return; }
  B.innerHTML=zsEdBild(zs,AW.reihen||(AW.d&&AW.d.reihen)); K.innerHTML=zsEdKontrolle(zs); }
function zsHoeheFenster(zs){ return {frage:"Wie hoch ist der Schrank?",hinweis:"Daraus ergibt sich, wie viele Reihen das Verteilerfeld hat – 12 TE je Reihe.",
  inhalt:`<div class="zs-vs"><div class="zs-bild">${zsSvg(zs,0)}</div><div class="zs-vs-r"><div class="aw-liste">${ZS_HOEHE.map(([h,t,u])=>awKachel("zsHoehe",h,"",t,u,+zs.hoehe===h&&zs.hoehe!=null)).join("")}</div></div></div>`}; }
function zsApzFenster(zs){ const O=zs.felder.filter(f=>f.typ!=="z").flatMap(f=>["oben","unten"].map(l=>[f,l]));
  return {frage:"Wo sitzt der APZ?",hinweis:"Abschlusspunkt Zählerplatz: genau einmal im Schrank, ganz oben oder ganz unten im Verteiler- oder Multimediafeld.",
    inhalt:`<div class="zs-vs"><div class="zs-bild">${zsSvg(zs,0)}</div><div class="zs-vs-r"><div class="aw-liste">${O.map(([f,l])=>awKachel("zsApz",`${f.id}:${l}`,"",`${ZS_TYP[f.typ]} ${zsFeldNr(zs,f.id)} · ${l}`,"",zs.apz&&zs.apz.feldId===f.id&&zs.apz.lage===l)).join("")}
      ${awKachel("zsApz","","","Kein APZ","Bestandsanlage – muss nicht nachgerüstet werden",!zs.apz)}</div></div></div>`}; }
function zsZpFenster(zs,i,weiterAct,weiterTxt){ const z=zs.zp[i]; if(!z) return null; const f=zs.felder.find(x=>x.id===z.feldId)||{};
  const gr=(lbl,act,L,cur)=>`<div class="aw-lbl">${lbl}</div><div class="aw-wahl">${L.map(([k,t])=>`<button type="button" data-act="${act}" data-v="${k}" aria-pressed="${cur===k}">${esc(t)}</button>`).join("")}</div>`;
  return {frage:`Zähler ${i+1}`,hinweis:`Zählerfeld ${zsFeldNr(zs,z.feldId)} von links${f.n===2?(z.pos?", rechter Platz":", linker Platz"):""}`,
    inhalt:`<div class="zs-vs"><div class="zs-bild">${zsSvg(zs,4,false,`${z.feldId}:${z.pos||0}`)}</div><div class="zs-vs-r">${gr("Wofür","zsZweck",ZS_ZWECK,z.zweck)}
      ${zsBelegt(z)?`${gr("Zählerart","zsArt",ZS_ART,z.art)}${gr("SLS im NAR","zsSls",ZS_SLS,z.sls)}
      ${z.sls&&z.sls!=="keiner"?gr("SLS-Hersteller","zsSlsH",ZS_SLS_HERST,zsSlsH(zs,z))+`<p class="aw-hinweis zs-geraet">${esc((zsSlsGeraet(zs,z)||{}).name||"")} · ${esc((zsSlsGeraet(zs,z)||{}).nr||"")}</p>`:""}
      <div class="aw-lbl">Überspannungsschutz · einmal im Schrank</div><div class="aw-liste zs-uss">${ZS_USS.map(([k,t,u])=>awKachel("zsUss",k,ZS_USS_BILD[k]?`<img class="zs-uss-b" src="../bilder/zs/${ZS_USS_BILD[k][0]}" alt="">`:"",t,u,(zs.uss||zsUssStd(zs))===k)).join("")}</div>
      <div class="aw-lbl">Einspeisung · Hausanschlusskabel</div><div class="aw-wahl">${[["ja","Einspeiseadapter"],["nein","Ohne Adapter"]].map(([k,t])=>`<button type="button" data-act="zsEinsp" data-v="${k}" aria-pressed="${(zs.einspeis===false?"nein":"ja")===k}">${t}</button>`).join("")}</div>
      <div class="fg1 aw-eigen">${tf("zsBez","Bezeichnung (optional)",z.bez||"",{form:true,ph:"z. B. Wohnung EG"})}</div>
      <div class="fg1 aw-eigen">${tf("zsNr","Zählernummer (optional)",z.nr||"",{form:true,ph:"steht auf dem Zähler, z. B. 1EBZ01…"})}</div>`:`<p class="aw-hinweis zs-frei-t">Der Platz bleibt frei – z. B. für eine spätere Wärmepumpe oder Wallbox. Unbenutzte Zählerplätze berührungssicher abdecken.</p>`}</div></div>`,
    fuss:`<button type="button" class="btn-tonal" data-act="zsSpaeter">Später</button><span style="flex:1"></span><button type="button" class="btn-filled" data-act="${weiterAct}">${weiterTxt}</button>`}; }
function zsZpBildNeu(){ const zs=zsAkt(), z=zsAktZp(), el=document.querySelector("#dlg .zs-vs>.zs-bild"); if(!zs||!z||!el) return;
  el.innerHTML=zsSvg(zs,4,false,`${z.feldId}:${z.pos||0}`); const h=document.querySelector("#dlg .zs-geraet"), g=zsSlsGeraet(zs,z); if(h&&g) h.textContent=`${g.name} · ${g.nr}`; }
function zsZpLesen(z){ if(!z) return; const b=document.getElementById("f_zsBez"), n=document.getElementById("f_zsNr"); if(b) z.bez=b.value.trim(); if(n) z.nr=n.value.trim().replace(/\s+/g," "); }

/* ---- Bestückung je Feld nach VDE-AR-N 4100:2026 und Netzbetreiber ----
   zs.best = {<feldId>:{k:true}, s:{…} (einmal im Schrank), a:{…} (APZ)}; zs.nb = "rheinnetz"|"westnetz"|"anderer" (Vorgabe RheinNetz: Waldbröl, Morsbach, Reichshof, AggerEnergie-Gebiet) */
const ZS_NB=[["rheinnetz","RheinNetz","Waldbröl, Morsbach, Reichshof, Gummersbach, Wiehl …"],["westnetz","Westnetz",""],["anderer","Anderer Netzbetreiber","nur die Regeln der VDE-AR-N 4100"]];
const zsNb=zs=>zs.nb||"rheinnetz";
const zsSteuer=zs=>!!zs.steuerbar||zs.zp.some(z=>z.zweck==="wp"||z.zweck==="wallbox");
const ZS_BEST=[
  {k:"hs",ort:"z",zone:"AAR",t:"Hauptschalter 3-polig, plombierbar – je Zähler",s:"RheinNetz: hinter jeder Messeinrichtung",p:zs=>zsNb(zs)==="rheinnetz"},
  {k:"rj45",ort:"z",zone:"AAR",t:"RJ45-Buchse",s:"VDE-AR-N 4100:2026, bei RheinNetz auch bei Relaissteuerung",p:()=>true},
  {k:"ssk",ort:"z",zone:"AAR",t:"Steuersignalklemmleiste (Anhang K)",s:"für steuerbare Verbraucher nach §14a (Wärmepumpe, Wallbox)",p:zsSteuer},
  {k:"hlak",ort:"z",zone:"AAR",t:"Hauptleitungsabzweigklemme",s:"",p:()=>false},
  {k:"relais",ort:"z",zone:"AAR",t:"Trennrelais §14a",s:"",p:()=>false},
  {k:"fils",ort:"z",zone:"AAR",t:"FI/LS für Wallbox oder PV",s:"höchstens 3 × 16 A",p:()=>false},
  {k:"rfzV",ort:"z",zone:"RfZ",t:"Spannungsversorgung aus dem NAR",s:"vor der Trennvorrichtung, Sicherung im NAR",p:()=>true},
  {k:"rfzFrei",ort:"z",zone:"RfZ",t:"Frei für Gateway und Steuerbox",s:"Smart-Meter-Gateway und Steuerbox des Messstellenbetreibers – keine Kundengeräte",p:()=>true},
  {k:"schiene",ort:"z",zone:"NAR",t:"Sammelschiene 5-polig",s:"",p:()=>true},
  {k:"spd",ort:"s",zone:"NAR",t:"Überspannungsschutz Typ 1",s:"einmal im Schrank – im Hauptstromversorgungssystem nur Typ 1",p:()=>true},
  {k:"abgriff",ort:"s",zone:"NAR",t:"Spannungsabgriff für RfZ und APZ, abgesichert",s:"einmal im Schrank – 25 kA",p:()=>true},
  {k:"apzV",ort:"a",zone:"APZ",t:"Spannungsversorgung aus dem NAR",s:"eigenes Leitungspaar Phase + N",p:()=>true},
  {k:"apzDat",ort:"a",zone:"APZ",t:"Datenleitung RfZ – APZ",s:"mindestens Cat 5",p:()=>true},
  {k:"ant",ort:"a",zone:"APZ",t:"Kommunikation vorbereitet",s:"",p:()=>true},
  {k:"apzRouter",ort:"a",zone:"APZ",t:"Platz für Router des Netzbetreibers",s:"Kommunikation des Messstellenbetreibers – seit 2026 darf auch die Steuerbox hinein",p:()=>true}];
const zsBestText=(zs,b)=>b.k==="ant"?(zsNb(zs)==="rheinnetz"?"25-mm-Verschraubung, 32-mm-Rohr oder Koax mit Fakra-Stecker (Mobilfunk)":zsNb(zs)==="westnetz"?"Leerrohr vom HÜP zum APZ, mindestens 25 mm":"Antenne oder Leerrohr nach Vorgabe des Netzbetreibers"):b.s;
const zsBestHat=(zs,ort,k)=>!!((zs.best||{})[ort]||{})[k];
/* Punkte eines Ziels (Zählerfeld-ID oder "a"); schrankweite Punkte erscheinen in jedem Zählerfeld */
const zsBestPunkte=(zs,ziel)=>ZS_BEST.filter(b=>ziel==="a"?b.ort==="a":b.ort!=="a").map(b=>({...b,wo:b.ort==="s"?"s":ziel}));
function zsBestOffen(zs,ziel){ return zsBestPunkte(zs,ziel).filter(b=>b.p(zs)&&!zsBestHat(zs,b.wo,b.k)).length; }
function zsBestOffenGesamt(zs){ const ziele=[...zs.felder.filter(f=>f.typ==="z").map(f=>f.id),...(zs.apz?["a"]:[])], gez=new Set();
  let n=0; ziele.forEach(z=>zsBestPunkte(zs,z).forEach(b=>{ const key=b.wo+":"+b.k; if(gez.has(key)) return; gez.add(key); if(b.p(zs)&&!zsBestHat(zs,b.wo,b.k)) n++; })); return n; }
function zsBestFenster(zs,ziel){ const P=zsBestPunkte(zs,ziel), zonen=[...new Set(P.map(b=>b.zone))];
  const titel=ziel==="a"?"APZ":`Zählerfeld ${zsFeldNr(zs,ziel)}`;
  return {frage:`Was ist drin? · ${titel}`,hinweis:`Pflicht nach VDE-AR-N 4100:2026${zsNb(zs)!=="anderer"?" und "+zsTxt(ZS_NB,zsNb(zs)):""}. Antippen = vorhanden.`,
    inhalt:`<div class="zs-vs"><div class="zs-bild">${zsSvg(zs,0)}</div><div class="zs-vs-r">`+zonen.map(zo=>`<div class="aw-lbl">${zo==="AAR"?"AAR · oben":zo==="NAR"?"NAR · unten":zo==="RfZ"?"RfZ · über dem Zähler":"APZ"}</div><div class="zs-best">${P.filter(b=>b.zone===zo).map(b=>{ const hat=zsBestHat(zs,b.wo,b.k), pf=b.p(zs), s=zsBestText(zs,b);
      return `<button type="button" class="zs-bp" data-act="zsBest" data-wo="${esc(b.wo)}" data-k="${b.k}" aria-pressed="${hat}"><span class="zs-bt"><b>${esc(b.t)}</b>${s?`<small>${esc(s)}</small>`:""}</span><span class="zs-bs${!hat&&pf?" offen":""}">${hat?"vorhanden":pf?"fehlt":"optional"}</span></button>`; }).join("")}</div>`).join("")+`</div></div>`,
    fuss:`<span style="flex:1"></span><button type="button" class="btn-filled" data-act="zsSpeichern">Speichern</button>`}; }
function zsNbFenster(zs){ return {frage:"Welcher Netzbetreiber?",hinweis:"Danach richten sich die Pflichtpunkte der Bestückung.",
  inhalt:`<div class="aw-liste">${ZS_NB.map(([k,t,s])=>awKachel("zsNb",k,"",t,s,zsNb(zs)===k)).join("")}</div>`}; }

/* ---- Karte auf der Verteilerseite ---- */
function zsHinweise(zs){ const H=[], nb=zsNb(zs), off=zsBestOffenGesamt(zs);
  if(nb!=="anderer"&&zs.zp.some(z=>z.art==="3pkt")) H.push(`${zsTxt(ZS_NB,nb)}: grundsätzlich eHZ auf BKE-I – 3-Punkt nur bei Wandler- oder Lastgangmessung.`);
  if(off) H.push(`Bestückung: ${off} Pflichtpunkt${off===1?"":"e"} noch nicht als vorhanden markiert.`);
  if(!zs.apz) H.push("Kein APZ eingetragen – bei neuen Zählerschränken Pflicht, im Bestand nicht nachzurüsten.");
  { const zF=zs.felder.filter(f=>f.typ==="z"), uf=zF[1]||zF[0], u=zsUssGeraet(zs), ub=u&&ZS_USS_BILD[u.nr];
    if(uf&&(uf.n||1)>1&&ub&&(ub[4]||200)*ub[1]/ub[2]>32) H.push(`${u.name} ist zu breit für die Lücke zwischen den beiden SLS im Zählerfeld ${zsFeldNr(zs,uf.id)} (32 mm frei) – schmaleren Ableiter wählen oder ein Zählerfeld mit einem Platz einplanen.`); }
  zs.zp.forEach((z,i)=>{ if(zsBelegt(z)&&z.zweck&&(!z.sls||z.sls==="keiner")) H.push(`Zähler ${i+1}: SLS im NAR fehlt – bei direkter Messung vorgeschrieben.`); });
  return H; }
function zsMaterial(zs,reihen){ const M=new Map(), add=t=>M.set(t,(M.get(t)||0)+1);
  if(zs.modell) add(`Zählerschrank ${zsHerstText(zs.modell.h).split(" ")[0]} ${zs.modell.hnr} (${zs.modell.name})`);
  zs.felder.forEach(f=>{ if(zs.modell){ if(f.typ==="z") zs.zp.filter(x=>x.feldId===f.id).forEach(z=>{ const g=zsBelegt(z)&&zsSlsGeraet(zs,z); if(g) add(`SLS ${g.name} (${g.nr})`); }); return; }
    if(f.typ==="z"){ const Z=zs.zp.filter(x=>x.feldId===f.id), art=Z.some(z=>z.art==="3pkt")?"3-Punkt":"eHZ";
      add(`Zählerfeld ${art}${f.n===2?", 2 Zähler":""}`); Z.forEach(z=>{ const g=zsBelegt(z)&&zsSlsGeraet(zs,z); if(g) add(`SLS ${g.name} (${g.nr})`); }); }
    else if(f.typ==="v") add(`Verteilerfeld ${zsReihenFeld(zs,f,reihen)}-reihig`); else add("Multimedia-Feld"); });
  if(zs.apz&&!zs.modell) add("APZ-Einbau 300 mm");
  /* Bestückung: Pflichtpunkte immer (Planung), optionale nur wenn angehakt */
  const brauch=(wo,k)=>{ const b=ZS_BEST.find(x=>x.k===k); return b.p(zs)||zsBestHat(zs,wo,k); };
  zs.felder.filter(f=>f.typ==="z").forEach(f=>{ const n=zs.zp.filter(z=>z.feldId===f.id&&zsBelegt(z)).length;
    if(brauch(f.id,"hs")) for(let i=0;i<n;i++) add("Hauptschalter 3-polig, plombierbar");
    if(brauch(f.id,"rj45")) add("RJ45-Buchse"); if(brauch(f.id,"ssk")) add("Steuersignalklemmleiste");
    if(brauch(f.id,"hlak")) add("Hauptleitungsabzweigklemme"); if(brauch(f.id,"relais")) add("Trennrelais §14a"); });
  if(zs.felder.some(f=>f.typ==="z")){ const u=zsUssGeraet(zs); add(u?`Überspannungsschutz ${u.name} (${u.nr})`:"Überspannungsschutz Typ 1 – noch festlegen"); add("Spannungsversorgung RfZ/APZ mit Absicherung"); if(zs.einspeis!==false) add("Einspeiseadapter Sammelschiene 5-polig (N, L1, L2, L3, PE)"); }
  return [...M].map(([t,n])=>`<div class="zs-mat"><b>${n}×</b><span>${esc(t)}</span></div>`).join(""); }
function zsKarte(L){ const zs=L.zs, zu=L.fertig;
  if(!zs||!zs.felder||!zs.felder.length) return `<section class="card zs-karte"><h3>Zählerschrank</h3><p class="meta">Zählerplätze, Zählerart, SLS, Zählernummern und APZ – Aufbau per Vorlage.</p>${zu?"":`<button type="button" class="btn-tonal" data-act="zsEinrichten">Zählerschrank einrichten</button>`}</section>`;
  const H=zsHinweise(zs);
  return `<section class="card zs-karte"><div class="card-kopf"><h3>Zählerschrank</h3>${zu?"":`<button type="button" class="btn-tonal" data-act="zsAufbau">Aufbau ändern</button>`}</div>
    <div class="zs-bild">${zu?zsSvg(zs,L.reihen):zsKlick(zs,L.reihen,null,{feld:()=>'data-act="zsAufbau"',zp:k=>`data-act="zsZpAuf" data-i="${k}"`,apz:()=>'data-act="zsApzAuf"'})}</div>
    ${H.length?`<div class="zs-hw">${H.map(h=>`<p>${icon("warn")}<span>${esc(h)}</span></p>`).join("")}</div>`:""}
    <div class="zs-zps">${zs.zp.map((z,i)=>`<button type="button" class="zs-zp" data-act="zsZpAuf" data-i="${i}" ${zu?"disabled":""}><span class="zs-zn${zsBelegt(z)&&z.zweck?"":" leer"}">Z${i+1}</span><span class="zs-zt"><b>${esc(zsBelegt(z)?(z.bez||zsTxt(ZS_ZWECK,z.zweck)||"Noch offen"):"Frei / Reserve")}</b><small>${esc(zsZpText(z))}</small></span>${icon("chev")}</button>`).join("")}
      <button type="button" class="zs-zp" data-act="zsApzAuf" ${zu?"disabled":""}><span class="zs-zn zs-apzn">APZ</span><span class="zs-zt"><b>${zs.apz?"Abschlusspunkt Zählerplatz":"Kein APZ"}</b><small>${esc(zs.apz?zsApzText(zs):"Bestandsanlage")}</small></span>${icon("chev")}</button></div>
    <div class="aw-lbl">Bestückung</div><div class="zs-zps">
      <button type="button" class="zs-zp" data-act="zsNbAuf" ${zu?"disabled":""}><span class="zs-zn zs-apzn">NB</span><span class="zs-zt"><b>${esc(zsTxt(ZS_NB,zsNb(zs)))}</b><small>Netzbetreiber${zs.nb?"":" – angenommen, bitte prüfen"}</small></span>${icon("chev")}</button>
      ${[...zs.felder.filter(f=>f.typ==="z").map(f=>[f.id,`Zählerfeld ${zsFeldNr(zs,f.id)}`,"AAR · RfZ · NAR"]),...(zs.apz?[["a","APZ",zsApzText(zs)]]:[])].map(([z,t,u])=>{ const o=zsBestOffen(zs,z);
        return `<button type="button" class="zs-zp" data-act="zsBestAuf" data-v="${esc(z)}" ${zu?"disabled":""}><span class="zs-zt"><b>${esc(t)}</b><small>${esc(u)}</small></span><span class="zs-bs${o?" offen":""}">${o?`${o} offen`:"vollständig"}</span>${icon("chev")}</button>`; }).join("")}</div>
    <div class="aw-lbl">Material</div><div class="zs-mats">${zsMaterial(zs,L.reihen)}</div>
    <p class="meta zs-hinweis">Artikelnummern folgen, sobald die Zählerschrank-Artikel in der Materialliste stehen.</p></section>`; }

/* ---- Bearbeiten von der Karte aus ---- */
function zsBearbeiten(modus,i){ const L=legAkt(); if(!L) return;
  AW={typ:"zs",modus,i:i||0,zs:modus==="einr"?zsAusVorlage("1z"):zsKopie(L.zs),schritte:modus==="einr"?["aufbau"]:null,reihen:L.reihen};
  if(!AW.zs.apz&&AW.zs.apz!==null) AW.zs.apz=null; zsZeigen(); }
const zsSchritte=(zs,eigen)=>[...(eigen?["felder","apz"]:[]),...zs.zp.map((_,i)=>"zp"+i)];
function zsZeigen(){ const L=legAkt(); if(!L||!AW) return; const R={titel:"Zählerschrank",unter:L.titel||"",schritt:0,schritte:0};
  if(AW.modus==="felder") return awRahmen({...R,...zsFelderFenster(AW.zs,AW.reihen,"zsSpeichern","Speichern")});
  if(AW.modus==="zp") return awRahmen({...R,...zsZpFenster(AW.zs,AW.i,"zsSpeichern","Speichern")});
  if(AW.modus==="apz") return awRahmen({...R,...zsApzFenster(AW.zs)});
  if(AW.modus==="best") return awRahmen({...R,...zsBestFenster(AW.zs,AW.ziel)});
  if(AW.modus==="nb") return awRahmen({...R,...zsNbFenster(AW.zs)});
  const S=AW.schritte, sk=S[AW.i], R2={...R,schritt:AW.i,schritte:S.length}, letzt=AW.i===S.length-1;
  if(sk==="aufbau") return awRahmen({...R2,...zsAufbauFenster()});
  if(sk==="felder") return awRahmen({...R2,...zsFelderFenster(AW.zs,AW.reihen,"zsWeiter","Weiter")});
  if(sk==="apz") return awRahmen({...R2,...zsApzFenster(AW.zs)});
  return awRahmen({...R2,...zsZpFenster(AW.zs,+sk.slice(2),letzt?"zsSpeichern":"zsWeiter",letzt?"Speichern":"Weiter")}); }
const zsAkt=()=>AW?(AW.typ==="neu"?AW.d.zs:AW.zs):null;
const zsSchritt=()=>!AW?"":AW.typ==="neu"?(awNeuSchritte()[AW.i]||""):AW.modus==="zp"?"zp"+AW.i:AW.modus==="apz"?"apz":((AW.schritte||[])[AW.i]||"");
const zsAktZp=()=>{ const zs=zsAkt(), sk=zsSchritt(); return zs&&sk.startsWith("zp")?zs.zp[+sk.slice(2)]:null; };
function zsNeuZeichnen(){ if(!AW) return; if(AW.typ==="neu") awNeuZeigen(); else zsZeigen(); }
function zsSchritteNeu(){ if(AW&&AW.typ==="zs"&&AW.schritte) AW.schritte=["aufbau",...zsSchritte(AW.zs,true)]; }
function zsSpeichern(){ const L=legAkt(); if(!L||!AW) return; zsZpLesen(zsAktZp());
  L.zs=zsAbgleich(AW.zs); if(+L.zs.hoehe) L.reihen=zsReihenSumme(L.zs,L.reihen); legSpeichern(L); awZu(); toast("Zählerschrank gespeichert"); }

document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act^="zs"]'); if(!b||b.disabled) return; e.stopPropagation(); const a=b.dataset.act;
  if(a==="zsEinrichten"){ zsBearbeiten("einr"); return; }
  if(a==="zsAufbau"){ zsBearbeiten("felder"); return; }
  if(a==="zsZpAuf"){ zsBearbeiten("zp",+b.dataset.i); return; }
  if(a==="zsApzAuf"){ zsBearbeiten("apz"); return; }
  if(a==="zsBestAuf"){ zsBearbeiten("best"); if(AW){ AW.ziel=b.dataset.v; zsZeigen(); } return; }
  if(a==="zsNbAuf"){ zsBearbeiten("nb"); return; }
  const zs=zsAkt(); if(!zs) return;
  switch(a){
  case "zsVorl": { const k=b.dataset.v, eigen=k==="eigen", neu=eigen?(zs.felder.length?zs:zsAusVorlage("1z")):zsAusVorlage(k);
      if(AW.typ==="neu"){ AW.d.zs=neu; AW.d.zsEigen=eigen; AW.i++; awNeuZeigen(); }
      else { AW.zs=neu; AW.schritte=["aufbau",...zsSchritte(neu,eigen)]; AW.i++; zsZeigen(); } return; }
  case "zsTyp": { const f=zs.felder[+b.dataset.i]; f.typ=b.dataset.v; if(f.typ==="z"&&!f.n) f.n=1; zsAbgleich(zs); zsSchritteNeu(); zsEdNeu(); return; }
  case "zsAnz": zs.felder[+b.dataset.i].n=+b.dataset.v; zsAbgleich(zs); zsSchritteNeu(); zsEdNeu(); return;
  case "zsFeldWeg": zs.felder.splice(+b.dataset.i,1); AW.feldSel=Math.max(0,+b.dataset.i-1); zsAbgleich(zs); zsSchritteNeu(); zsEdNeu(); return;
  case "zsFeldPlus": zs.felder.push({id:uid(),typ:"v"}); AW.feldSel=zs.felder.length-1; zsAbgleich(zs); zsSchritteNeu(); zsEdNeu(); return;
  case "zsFeldZiehen": { const i=+b.dataset.i, j=i+(+b.dataset.d); if(j<0||j>=zs.felder.length) return; [zs.felder[i],zs.felder[j]]=[zs.felder[j],zs.felder[i]]; AW.feldSel=j; zsAbgleich(zs); zsEdNeu(); return; }
  case "zsApz": { const [id,l]=String(b.dataset.v).split(":"); zs.apz=id?{feldId:id,lage:l}:null;
      if(AW.typ==="neu"){ if(AW.sub) AW.sub=null; else AW.i++; awNeuZeigen(); } else if(AW.modus==="apz") zsSpeichern(); else { AW.i++; zsZeigen(); } return; }
  case "zsHoehe": zs.hoehe=+b.dataset.v; if(AW.typ==="neu"){ if(AW.sub) AW.sub=+zs.hoehe?null:"reihen"; else AW.i++; awNeuZeigen(); } return;
  case "zsHoeheF": zs.hoehe=+b.dataset.v; b.parentElement.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",x===b)); zsEdNeu(); return;
  case "zsSpaeter": { const z=zsAktZp(); if(z){ zsZpLesen(z); if(zsBelegt(z)){ z.zweck=""; z.sls=""; } }
      if(AW.typ==="neu"){ const S=awNeuSchritte(); if(AW.i<S.length-1){ AW.i++; awNeuZeigen(); } else awNeuAnlegen(); }
      else if(AW.schritte&&AW.i<AW.schritte.length-1){ AW.i++; zsZeigen(); } else zsSpeichern(); return; }
  case "zsZweck": { const z=zsAktZp(); if(!z) return; const war=zsBelegt(z); zsZpLesen(z); z.zweck=b.dataset.v; if(zsBelegt(z)&&!z.sls) z.sls="E35";
      if(war!==zsBelegt(z)){ zsNeuZeichnen(); return; } b.parentElement.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",x===b)); return; }
  case "zsArt": case "zsSls": case "zsSlsH": { const z=zsAktZp(); if(!z) return; zsZpLesen(z); z[{zsArt:"art",zsSls:"sls",zsSlsH:"slsH"}[a]]=b.dataset.v;
      if(a==="zsSls"){ zsNeuZeichnen(); return; }
      b.parentElement.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",x===b)); zsZpBildNeu(); return; }
  case "zsUss": { zsZpLesen(zsAktZp()); zs.uss=b.dataset.v; zsNeuZeichnen(); return; }
  case "zsEinsp": { zs.einspeis=b.dataset.v==="ja"; b.parentElement.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",x===b)); zsZpBildNeu(); return; }
  case "zsWeiter": zsZpLesen(zsAktZp()); AW.i++; zsZeigen(); return;
  case "zsSpeichern": zsSpeichern(); return;
  case "zsBest": { const wo=b.dataset.wo, k=b.dataset.k; zs.best=zs.best||{}; zs.best[wo]=zs.best[wo]||{}; zs.best[wo][k]=!zs.best[wo][k]; if(!zs.best[wo][k]) delete zs.best[wo][k];
      const B=ZS_BEST.find(x=>x.k===k), hat=!!zs.best[wo][k]; document.querySelectorAll(`#dlg [data-act="zsBest"][data-wo="${wo}"][data-k="${k}"]`).forEach(x=>{ x.setAttribute("aria-pressed",hat); const st=x.querySelector(".zs-bs"); st.textContent=hat?"vorhanden":B.p(zs)?"fehlt":"optional"; st.classList.toggle("offen",!hat&&B.p(zs)); }); return; }
  case "zsNb": zs.nb=b.dataset.v; if(AW.typ==="neu"){ AW.d.nbAuto=false; AW.sub=null; awNeuZeigen(); } else zsSpeichern(); return;
  } },true);
