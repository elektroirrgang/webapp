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
const ZS_SLS=[["E35","SLS E35"],["E40","SLS E40"],["E50","SLS E50"],["E63","SLS E63"],["keiner","Keiner / weiß nicht"]];
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
function zsZpText(z){ if(!zsBelegt(z)) return "kein Zähler gesetzt – Platz frei für später"; if(!z.zweck) return "noch offen – später eintragen"; return [zsTxt(ZS_ART,z.art).replace(" (BKE-I)",""),z.sls&&z.sls!=="keiner"?"SLS "+z.sls:"",z.nr?"Nr. "+z.nr:"Nummer fehlt"].filter(Boolean).join(" · "); }
const zsFeldNr=(zs,id)=>zs.felder.findIndex(f=>f.id===id)+1;
const zsApzText=zs=>{ if(!zs.apz) return ""; const f=zs.felder.find(x=>x.id===zs.apz.feldId); return f?`${ZS_TYP[f.typ]} ${zsFeldNr(zs,f.id)} · ${zs.apz.lage}`:""; };

/* Vorderansicht: Zählerfeld mit AAR · RfZ · Zähler · NAR, Verteilerfeld mit APZ oben/unten, Multimediafeld */
function zsSvg(zs,reihen,klein,aktiv){ const F=zs.felder, W=72, G=4, H=176, w=F.length*(W+G)+G; let zn=0;
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
      inn=[0,1,2].flatMap(k=>[0,1].map(j=>`<rect x="${x+12+j*26}" y="${(oben?y+54:y+10)+k*38}" width="22" height="30" rx="3" class="e"/>`)).join("")
        +(apz?`<rect x="${x+4}" y="${oben?y+4:y+H-46}" width="${W-8}" height="42" rx="3" class="a"/>${T(x+W/2,(oben?y+4:y+H-46)+26,"APZ")}`:""); }
    return `<rect x="${x}" y="${y}" width="${W}" height="${H}" rx="6" class="f"/>${inn}${T(x+W/2,y+H+16,ZS_TYP_KURZ[f.typ],"u")}`; };
  return `<svg class="zs-svg${klein?" klein":""}" viewBox="0 0 ${w} ${klein?H+8:H+24}" style="max-width:${F.length*(klein?28:104)}px" aria-hidden="true">${F.map(feld).join("")}</svg>`; }

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
  const karte=m=>`<button type="button" class="aw-g zs-mod" data-act="awModell" data-v="${esc(m.hnr)}"${d.zs&&d.zs.modell&&d.zs.modell.hnr===m.hnr?' aria-pressed="true"':""}>${m.bild?`<span class="mat-foto aw-gb"><img src="${esc(typeof bildLokal==="function"?bildLokal(m.bild):m.bild)}" alt="" loading="lazy" onerror="this.parentNode.classList.add('weg')"></span>`:`<span class="aw-gb zs-mod-svg">${zsSvg({felder:m.felder.map(x=>({...x,id:""})),apz:null},4,true)}</span>`}<b>${esc(m.name)}</b><small>${esc(zsModText(m))}</small><small class="zs-mod-nr">${esc(zsHerstText(m.h).split(" ")[0])} ${esc(m.hnr)}</small></button>`;
  return {frage:"Welcher Schrank?",hinweis:passt.length?`Für ${was}. Antippen übernimmt Felder, Höhe und APZ.`:`Für ${was} gibt es kein fertiges Modell – „Ohne Modell“ stellt den Schrank aus deinen Angaben zusammen.`,
    inhalt:`${genau.length?`<div class="aw-lbl">Passt genau</div><div class="aw-grid">${genau.map(karte).join("")}</div>`:""}
      ${groesser.length?`<div class="aw-lbl">Größer</div><div class="aw-grid">${groesser.map(karte).join("")}</div>`:""}
      <div class="aw-liste" style="margin-top:14px">${awKachel("awModell","",awSvg("frei"),"Ohne Modell","Felder aus den Angaben zusammenstellen",!!d.ohneModell)}</div>`}; }
function zsBedarfFenster(b){ const st=(k,t,u)=>`<div class="zs-st"><span class="zs-stt"><b>${esc(t)}</b>${u?`<small>${esc(u)}</small>`:""}</span><button type="button" class="zs-stb" data-act="awBed" data-k="${k}" data-d="-1" aria-label="weniger">−</button><span class="zs-stn" id="awBed_${k}">${+b[k]||0}</span><button type="button" class="zs-stb" data-act="awBed" data-k="${k}" data-d="1" aria-label="mehr">+</button></div>`;
  return {frage:"Was soll dran?",hinweis:"Daraus stellt die App den Schrank zusammen – Felder, Höhe, APZ und Zählerplätze.",
    inhalt:`<div class="aw-lbl">Zählerplätze</div><div class="zs-sts">${ZS_BEDARF.map(([k,t,u])=>st(k,t,u)).join("")}</div>
      <div class="aw-lbl">Am Haushaltszähler</div><div class="zs-sts">${ZS_BEDARF_STEUER.map(([k,t,u])=>st(k,t,u)).join("")}</div>
      <div class="aw-lbl">Weitere Felder</div><div class="zs-sts">${ZS_BEDARF_FELD.map(([k,t,u])=>st(k,t,u)).join("")}</div>`,
    fuss:`<span class="aw-fuss-info zs-sum" id="awBedSum">${zsBedarfSumHtml(b)}</span><button type="button" class="btn-filled" data-act="awNeuWeiter">Weiter</button>`}; }
const zsMz=(n,e,m)=>`${n} ${n===1?e:m}`;
const zsBedarfSumText=b=>{ const n=Math.max(1,zsBedarfZp(b)), vf=Math.max(1,+b.vf||1), mm=+b.mm||0;
  return [zsMz(n,"Zählerplatz","Zählerplätze"),zsMz(Math.ceil(n/2),"Zählerfeld","Zählerfelder"),zsMz(vf,"Verteilerfeld","Verteilerfelder"),mm?zsMz(mm,"Multimediafeld","Multimediafelder"):""].filter(Boolean).join(" · "); };
/* Fuß: kleine Vorschau des Schranks plus Zusammenfassung – ändert sich mit jedem Plus/Minus */
const zsBedarfSumHtml=b=>`${zsSvg(zsAusBedarf(b,null),0,true)}<span>${esc(zsBedarfSumText(b))}</span>`;
function zsVorschlagFenster(d,ortPlz){ const zs=d.zs, nb=zs.nb, R=(k,t,u)=>`<button type="button" class="zs-zp" data-act="awSub" data-v="${k}"><span class="zs-zt"><b>${esc(t)}</b><small>${esc(u)}</small></span>${icon("chev")}</button>`;
  const nZ=zs.zp.filter(zsBelegt).length, nF=zs.zp.length-nZ, vf=zs.felder.filter(f=>f.typ==="v");
  return {frage:"Vorschlag",hinweis:"Aus deinen Angaben abgeleitet. Antippen zum Ändern – sonst „Passt so“.",
    inhalt:`<div class="zs-vs"><div class="zs-bild">${zsSvg(zs,0)}</div><div class="zs-zps">
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
function zsFelderFenster(zs,reihen,weiterAct,weiterTxt){ return {frage:"Welche Felder, von links nach rechts?",
  inhalt:`<div class="zs-bild">${zsSvg(zs,reihen)}</div><div class="aw-lbl">Schrankhöhe</div><div class="zs-ftyp zs-hoehe" role="group">${ZS_HOEHE.map(([h,t])=>`<button type="button" data-act="zsHoeheF" data-v="${h}" aria-pressed="${(+zs.hoehe||0)===h}">${h?t:"Andere"}</button>`).join("")}</div><div class="aw-lbl">Felder</div><div class="zs-felder">${zs.felder.map((f,i)=>`<div class="zs-feld"><span class="zs-fnr">${i+1}</span><div class="zs-fre">
      <div class="zs-ftyp" role="group">${["z","v","m"].map(t=>`<button type="button" data-act="zsTyp" data-i="${i}" data-v="${t}" aria-pressed="${f.typ===t}">${ZS_TYP_KURZ[t]}</button>`).join("")}</div>
      ${f.typ==="z"?`<div class="zs-ftyp zs-fn" role="group">${[1,2].map(n=>`<button type="button" data-act="zsAnz" data-i="${i}" data-v="${n}" aria-pressed="${(f.n||1)===n}">${n===1?"1 Zähler":"2 Zähler"}</button>`).join("")}</div>`:""}</div>
      <button type="button" class="icon-btn" data-act="zsFeldWeg" data-i="${i}" aria-label="Feld ${i+1} entfernen" ${zs.felder.length<2?"disabled":""}>${icon("del")}</button></div>`).join("")}</div>
    <button type="button" class="aw-unbek zs-plus" data-act="zsFeldPlus">${icon("add")}Feld anhängen</button>`,
  fuss:`<span style="flex:1"></span><button type="button" class="btn-filled" data-act="${weiterAct}">${weiterTxt}</button>`}; }
function zsHoeheFenster(zs){ return {frage:"Wie hoch ist der Schrank?",hinweis:"Daraus ergibt sich, wie viele Reihen das Verteilerfeld hat – 12 TE je Reihe.",
  inhalt:`<div class="aw-liste">${ZS_HOEHE.map(([h,t,u])=>awKachel("zsHoehe",h,"",t,u,+zs.hoehe===h&&zs.hoehe!=null)).join("")}</div>`}; }
function zsApzFenster(zs){ const O=zs.felder.filter(f=>f.typ!=="z").flatMap(f=>["oben","unten"].map(l=>[f,l]));
  return {frage:"Wo sitzt der APZ?",hinweis:"Abschlusspunkt Zählerplatz: genau einmal im Schrank, ganz oben oder ganz unten im Verteiler- oder Multimediafeld.",
    inhalt:`<div class="aw-liste">${O.map(([f,l])=>awKachel("zsApz",`${f.id}:${l}`,"",`${ZS_TYP[f.typ]} ${zsFeldNr(zs,f.id)} · ${l}`,"",zs.apz&&zs.apz.feldId===f.id&&zs.apz.lage===l)).join("")}
      ${awKachel("zsApz","","","Kein APZ","Bestandsanlage – muss nicht nachgerüstet werden",!zs.apz)}</div>`}; }
function zsZpFenster(zs,i,weiterAct,weiterTxt){ const z=zs.zp[i]; if(!z) return null; const f=zs.felder.find(x=>x.id===z.feldId)||{};
  const gr=(lbl,act,L,cur)=>`<div class="aw-lbl">${lbl}</div><div class="aw-wahl">${L.map(([k,t])=>`<button type="button" data-act="${act}" data-v="${k}" aria-pressed="${cur===k}">${esc(t)}</button>`).join("")}</div>`;
  return {frage:`Zähler ${i+1}`,hinweis:`Zählerfeld ${zsFeldNr(zs,z.feldId)} von links${f.n===2?(z.pos?", rechter Platz":", linker Platz"):""}`,
    inhalt:`<div class="zs-bild">${zsSvg(zs,4,false,`${z.feldId}:${z.pos||0}`)}</div>${gr("Wofür","zsZweck",ZS_ZWECK,z.zweck)}
      ${zsBelegt(z)?`${gr("Zählerart","zsArt",ZS_ART,z.art)}${gr("SLS im NAR","zsSls",ZS_SLS,z.sls)}
      <div class="fg1 aw-eigen">${tf("zsBez","Bezeichnung (optional)",z.bez||"",{form:true,ph:"z. B. Wohnung EG"})}</div>
      <div class="fg1 aw-eigen">${tf("zsNr","Zählernummer (optional)",z.nr||"",{form:true,ph:"steht auf dem Zähler, z. B. 1EBZ01…"})}</div>`:`<p class="aw-hinweis zs-frei-t">Der Platz bleibt frei – z. B. für eine spätere Wärmepumpe oder Wallbox. Unbenutzte Zählerplätze berührungssicher abdecken.</p>`}`,
    fuss:`<button type="button" class="btn-tonal" data-act="zsSpaeter">Später</button><span style="flex:1"></span><button type="button" class="btn-filled" data-act="${weiterAct}">${weiterTxt}</button>`}; }
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
    inhalt:zonen.map(zo=>`<div class="aw-lbl">${zo==="AAR"?"AAR · oben":zo==="NAR"?"NAR · unten":zo==="RfZ"?"RfZ · über dem Zähler":"APZ"}</div><div class="zs-best">${P.filter(b=>b.zone===zo).map(b=>{ const hat=zsBestHat(zs,b.wo,b.k), pf=b.p(zs), s=zsBestText(zs,b);
      return `<button type="button" class="zs-bp" data-act="zsBest" data-wo="${esc(b.wo)}" data-k="${b.k}" aria-pressed="${hat}"><span class="zs-bt"><b>${esc(b.t)}</b>${s?`<small>${esc(s)}</small>`:""}</span><span class="zs-bs${!hat&&pf?" offen":""}">${hat?"vorhanden":pf?"fehlt":"optional"}</span></button>`; }).join("")}</div>`).join(""),
    fuss:`<span style="flex:1"></span><button type="button" class="btn-filled" data-act="zsSpeichern">Speichern</button>`}; }
function zsNbFenster(zs){ return {frage:"Welcher Netzbetreiber?",hinweis:"Danach richten sich die Pflichtpunkte der Bestückung.",
  inhalt:`<div class="aw-liste">${ZS_NB.map(([k,t,s])=>awKachel("zsNb",k,"",t,s,zsNb(zs)===k)).join("")}</div>`}; }

/* ---- Karte auf der Verteilerseite ---- */
function zsHinweise(zs){ const H=[], nb=zsNb(zs), off=zsBestOffenGesamt(zs);
  if(nb!=="anderer"&&zs.zp.some(z=>z.art==="3pkt")) H.push(`${zsTxt(ZS_NB,nb)}: grundsätzlich eHZ auf BKE-I – 3-Punkt nur bei Wandler- oder Lastgangmessung.`);
  if(off) H.push(`Bestückung: ${off} Pflichtpunkt${off===1?"":"e"} noch nicht als vorhanden markiert.`);
  if(!zs.apz) H.push("Kein APZ eingetragen – bei neuen Zählerschränken Pflicht, im Bestand nicht nachzurüsten.");
  zs.zp.forEach((z,i)=>{ if(zsBelegt(z)&&z.zweck&&(!z.sls||z.sls==="keiner")) H.push(`Zähler ${i+1}: SLS im NAR fehlt – bei direkter Messung vorgeschrieben.`); });
  return H; }
function zsMaterial(zs,reihen){ const M=new Map(), add=t=>M.set(t,(M.get(t)||0)+1);
  if(zs.modell) add(`Zählerschrank ${zsHerstText(zs.modell.h).split(" ")[0]} ${zs.modell.hnr} (${zs.modell.name})`);
  zs.felder.forEach(f=>{ if(zs.modell){ if(f.typ==="z") zs.zp.filter(x=>x.feldId===f.id).forEach(z=>{ if(zsBelegt(z)&&z.sls&&z.sls!=="keiner") add(`SLS ${z.sls} 3-polig`); }); return; }
    if(f.typ==="z"){ const Z=zs.zp.filter(x=>x.feldId===f.id), art=Z.some(z=>z.art==="3pkt")?"3-Punkt":"eHZ";
      add(`Zählerfeld ${art}${f.n===2?", 2 Zähler":""}`); Z.forEach(z=>{ if(zsBelegt(z)&&z.sls&&z.sls!=="keiner") add(`SLS ${z.sls} 3-polig`); }); }
    else if(f.typ==="v") add(`Verteilerfeld ${zsReihenFeld(zs,f,reihen)}-reihig`); else add("Multimedia-Feld"); });
  if(zs.apz&&!zs.modell) add("APZ-Einbau 300 mm");
  /* Bestückung: Pflichtpunkte immer (Planung), optionale nur wenn angehakt */
  const brauch=(wo,k)=>{ const b=ZS_BEST.find(x=>x.k===k); return b.p(zs)||zsBestHat(zs,wo,k); };
  zs.felder.filter(f=>f.typ==="z").forEach(f=>{ const n=zs.zp.filter(z=>z.feldId===f.id&&zsBelegt(z)).length;
    if(brauch(f.id,"hs")) for(let i=0;i<n;i++) add("Hauptschalter 3-polig, plombierbar");
    if(brauch(f.id,"rj45")) add("RJ45-Buchse"); if(brauch(f.id,"ssk")) add("Steuersignalklemmleiste");
    if(brauch(f.id,"hlak")) add("Hauptleitungsabzweigklemme"); if(brauch(f.id,"relais")) add("Trennrelais §14a"); });
  if(zs.felder.some(f=>f.typ==="z")){ add("Überspannungsschutz Typ 1"); add("Spannungsversorgung RfZ/APZ mit Absicherung"); }
  return [...M].map(([t,n])=>`<div class="zs-mat"><b>${n}×</b><span>${esc(t)}</span></div>`).join(""); }
function zsKarte(L){ const zs=L.zs, zu=L.fertig;
  if(!zs||!zs.felder||!zs.felder.length) return `<section class="card zs-karte"><h3>Zählerschrank</h3><p class="meta">Zählerplätze, Zählerart, SLS, Zählernummern und APZ – Aufbau per Vorlage.</p>${zu?"":`<button type="button" class="btn-tonal" data-act="zsEinrichten">Zählerschrank einrichten</button>`}</section>`;
  const H=zsHinweise(zs);
  return `<section class="card zs-karte"><div class="card-kopf"><h3>Zählerschrank</h3>${zu?"":`<button type="button" class="btn-tonal" data-act="zsAufbau">Aufbau ändern</button>`}</div>
    <div class="zs-bild">${zsSvg(zs,L.reihen)}</div>
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
  case "zsTyp": { const f=zs.felder[+b.dataset.i]; f.typ=b.dataset.v; if(f.typ==="z"&&!f.n) f.n=1; zsAbgleich(zs); zsSchritteNeu(); zsNeuZeichnen(); return; }
  case "zsAnz": zs.felder[+b.dataset.i].n=+b.dataset.v; zsAbgleich(zs); zsSchritteNeu(); zsNeuZeichnen(); return;
  case "zsFeldWeg": zs.felder.splice(+b.dataset.i,1); zsAbgleich(zs); zsSchritteNeu(); zsNeuZeichnen(); return;
  case "zsFeldPlus": zs.felder.push({id:uid(),typ:"v"}); zsAbgleich(zs); zsSchritteNeu(); zsNeuZeichnen(); return;
  case "zsApz": { const [id,l]=String(b.dataset.v).split(":"); zs.apz=id?{feldId:id,lage:l}:null;
      if(AW.typ==="neu"){ if(AW.sub) AW.sub=null; else AW.i++; awNeuZeigen(); } else if(AW.modus==="apz") zsSpeichern(); else { AW.i++; zsZeigen(); } return; }
  case "zsHoehe": zs.hoehe=+b.dataset.v; if(AW.typ==="neu"){ if(AW.sub) AW.sub=+zs.hoehe?null:"reihen"; else AW.i++; awNeuZeigen(); } return;
  case "zsHoeheF": zs.hoehe=+b.dataset.v; zsNeuZeichnen(); return;
  case "zsSpaeter": { const z=zsAktZp(); if(z){ zsZpLesen(z); if(zsBelegt(z)){ z.zweck=""; z.sls=""; } }
      if(AW.typ==="neu"){ const S=awNeuSchritte(); if(AW.i<S.length-1){ AW.i++; awNeuZeigen(); } else awNeuAnlegen(); }
      else if(AW.schritte&&AW.i<AW.schritte.length-1){ AW.i++; zsZeigen(); } else zsSpeichern(); return; }
  case "zsZweck": { const z=zsAktZp(); if(!z) return; const war=zsBelegt(z); zsZpLesen(z); z.zweck=b.dataset.v; if(zsBelegt(z)&&!z.sls) z.sls="E35";
      if(war!==zsBelegt(z)){ zsNeuZeichnen(); return; } b.parentElement.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",x===b)); return; }
  case "zsArt": case "zsSls": { const z=zsAktZp(); if(!z) return; z[{zsArt:"art",zsSls:"sls"}[a]]=b.dataset.v;
      b.parentElement.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",x===b)); return; }
  case "zsWeiter": zsZpLesen(zsAktZp()); AW.i++; zsZeigen(); return;
  case "zsSpeichern": zsSpeichern(); return;
  case "zsBest": { const wo=b.dataset.wo, k=b.dataset.k; zs.best=zs.best||{}; zs.best[wo]=zs.best[wo]||{}; zs.best[wo][k]=!zs.best[wo][k]; if(!zs.best[wo][k]) delete zs.best[wo][k];
      const B=ZS_BEST.find(x=>x.k===k), hat=!!zs.best[wo][k]; document.querySelectorAll(`#dlg [data-act="zsBest"][data-wo="${wo}"][data-k="${k}"]`).forEach(x=>{ x.setAttribute("aria-pressed",hat); const st=x.querySelector(".zs-bs"); st.textContent=hat?"vorhanden":B.p(zs)?"fehlt":"optional"; st.classList.toggle("offen",!hat&&B.p(zs)); }); return; }
  case "zsNb": zs.nb=b.dataset.v; if(AW.typ==="neu"){ AW.d.nbAuto=false; AW.sub=null; awNeuZeigen(); } else zsSpeichern(); return;
  } },true);
