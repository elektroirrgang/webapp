/* Zählerschrank-Ansicht aus Feldbildern (Baukasten): je Feldtyp ein Bild im Raster 250 mm breit,
   1050 mm (Schrank 1100) bzw. 1350 mm (Schrank 1400) hoch, nebeneinandergesetzt. Darüber liegen Zählernummer,
   SLS mit Nennstrom und der Überspannungsschutz beim ersten Zählerplatz.
   Feldbilder: zaehlerschrank24.de (Elektrotechnik Reinhold GmbH), Nutzung freigegeben per E-Mail vom 30.10.2026. */
const ZSZ={FW:250,WAND:25,ML:64,MT:58,MR:16};
const ZSZ_F={lin:"#8C8C8C",fein:"#C4C4C4",feld:"#F2F2F2",weiss:"#FFFFFF",hell:"#F8F8F8",dunkel:"#3A3C40",text:"#262626",grau:"#7A7A7A",
  br:"#8B5A2B",sw:"#2E2E2E",gr:"#8E8E8E",bl:"#1E9BE6",gn:"#86CF3A",ge:"#E2C41C",or:"#F39020",orK:"#C06A12",rot:"#E3231B",akt:"#C8102E",aktH:"#FCE8EB"};
const ZSZ_KURZ={haushalt:"HA",wp:"WP",wallbox:"EM",pv:"PV",allgemein:"ALG",gewerbe:"GEW",frei:"RES"};
const ZSZ_SLS_BILD={abb:["sls-abb.png",198,346]};
const zsBildUrl=u=>typeof bildLokal==="function"?bildLokal(u):u;
/* Reihenplätze in den Verteilerfeldern = Mitte der Hutschienen im Feldbild (Pixel, gemessen). Die Geräte rasten auf der Schiene ein,
   ihre Mitte liegt also auf der Schiene. 1100: Verteilerfeld 7 Reihen, APZ-Feld 5 · 1400: 9 bzw. 7 (wie zsReihenFeld) */
const ZSZ_REIHEN={vt:[198,397,597,796,1153,1352,1552],apz:[198,397,597,796,996],vtH:[203,407,610,813,1022,1226,1623,1826,2029],apzH:[199,399,599,799,1158,1358,1558]};
/* Bestückung, die in die Verteilerfelder gezeichnet wird – setzt zsKarte vor dem Zeichnen (Verteiler L) */
let ZSZ_L=null;
function zsReihenPlaetze(zs){ const hoch=zsHoeheMm(zs)===1400, P=[]; zs.felder.forEach(f=>{ if(f.typ!=="v") return; const apz=zs.apz&&zs.apz.feldId===f.id?zs.apz.lage:"";
    const Y=apz?(hoch?ZSZ_REIHEN.apzH:ZSZ_REIHEN.apz):(hoch?ZSZ_REIHEN.vtH:ZSZ_REIHEN.vt), off=apz==="oben"?(hoch?2154-1636:1682-1158):0; Y.forEach(y=>P.push({feldId:f.id,y:y+off})); }); return P; }
function zsHoeheMm(zs){ return +zs.hoehe===1400?1400:1100; }
/* Bis 5 Felder ein Schrank, darüber mehrere Schränke nebeneinander (gleichmäßig verteilt, je höchstens 5 Felder) */
const ZSZ_LUECKE=70;
function zsSchraenke(n){ const c=n<=5?1:Math.ceil(n/5), b=Math.floor(n/c), rest=n%c; return Array.from({length:c},(_,k)=>b+(k<rest?1:0)); }
function zsGeo(zs,ed){ const n=zs.felder.length, H=zsHoeheMm(zs), MB=ed===false?36:96; let x=ZSZ.ML; const schr=[], fx=[];
  zsSchraenke(n).forEach(m=>{ const B=m*ZSZ.FW+2*ZSZ.WAND; schr.push({x,B,m}); for(let k=0;k<m;k++) fx.push(x+ZSZ.WAND+k*ZSZ.FW); x+=B+ZSZ_LUECKE; });
  const vw=x-ZSZ_LUECKE+ZSZ.MR, vh=ZSZ.MT+H+MB;
  return {n,H,vw,vh,MB,schr,fx,felder:fx.map(v=>({links:v/vw*100,breite:ZSZ.FW/vw*100})),oben:ZSZ.MT/vh*100,hoehe:(H+MB)/vh*100}; }
function zsZeichnung(zs,reihen,aktiv,selFeld,opt){
  const ed=selFeld!=null, C=ZSZ_F, g=zsGeo(zs,ed), F=zs.felder, FW=ZSZ.FW, x0=ZSZ.ML, y0=ZSZ.MT, fy=y0+ZSZ.WAND, fh=g.H-2*ZSZ.WAND, hoch=g.H===1400, k1=v=>(+v).toFixed(1);
  const R=(x,y,w,h,f,s,sw,rx,ex)=>`<rect x="${k1(x)}" y="${k1(y)}" width="${k1(Math.max(0,w))}" height="${k1(Math.max(0,h))}"${rx?` rx="${rx}"`:""} fill="${f||"none"}"${s?` stroke="${s}" stroke-width="${sw||1}"`:""}${ex||""}/>`;
  const T=(x,y,t,o={})=>`<text x="${k1(x)}" y="${k1(y)}" font-size="${o.s||22}" font-weight="${o.w||600}" fill="${o.f||C.text}" text-anchor="${o.a||"middle"}"${o.ex||""}>${t}</text>`;
  const L=(x1,y1,x2,y2,s,sw)=>`<path d="M${k1(x1)} ${k1(y1)}L${k1(x2)} ${k1(y2)}" stroke="${s}" stroke-width="${sw||2}" fill="none"/>`;
  const B="../bilder/zs/", QH=hoch?2154:1682, sk=fh/QH, Y=mm=>fy+mm*fh/1050;
  /* Ausschnitt [q0,q1) eines Feldbildes (Pixel) an Feldposition x, Zielhöhe y in mm */
  const bild=(n,x,y,q0,q1,qh)=>{ const h=(q1-q0)*fh/(qh||QH); return `<svg x="${k1(x)}" y="${k1(y)}" width="${FW}" height="${k1(h)}" viewBox="0 ${q0} 400 ${q1-q0}" preserveAspectRatio="none"><image href="${B}${n}" width="400" height="${qh||QH}"/></svg>`; };
  const ganz=(n,x)=>bild(n,x,fy,0,QH);
  /* Zählerfeld eHZ gibt es nur für 1100 – bei 1400 wird der Anschlussraum oben mit einem Stück Leitungsweg verlängert */
  const ehzHoch=(n,x)=>{ let s="", y=fy; const h=fh/2154;
    const st=(q0,q1)=>{ const out=`<svg x="${k1(x)}" y="${k1(y)}" width="${FW}" height="${k1((q1-q0)*h)}" viewBox="0 ${q0} 400 ${q1-q0}" preserveAspectRatio="none"><image href="${B}${n}" width="400" height="1682"/></svg>`; y+=(q1-q0)*h; return out; };
    s+=st(0,330); let rest=472; while(rest>0){ const t=Math.min(140,rest); s+=st(190,190+t); rest-=t; } s+=st(330,1682); return s; };
  const APZ0=hoch?1636:1158, apzN=hoch?"zs-high-apz.png":"zs-apz.png";
  const apzFeld=(x,lage,obenN,obenQh)=>{ const n=obenN||apzN, qh=obenQh||QH;
    if(lage==="oben"){ const ah=(QH-APZ0)*sk; return bild(apzN,x,fy,APZ0,QH)+bild(n,x,fy+ah,0,APZ0,qh); }
    return bild(n,x,fy,0,APZ0,qh)+bild(apzN,x,fy+APZ0*sk,APZ0,QH); };
  const feldGrund=x=>R(x,fy,FW,fh,"#F1F1F1")+R(x,fy+fh-180,FW,180,"url(#zsSchatten)");
  let zn=0, nv=0, nm=0;
  /* NAR-Aufteilung: Einspeiseadapter im ersten Zählerfeld (links einspeisen), Überspannungsschutz im zweiten Zählerfeld, sonst im ersten.
     PE-Leiter im Feldbild: Feld mit 1 Platz bei 107,5 mm, mit 2 Plätzen bei 98,8 mm von links */
  const zF=F.filter(f=>f.typ==="z"), eiF=zs.einspeis===false?null:zF[0], ussF=zF[1]||zF[0]; const nMM=F.filter(f=>f.typ==="m").length;
  const zaehler=(f,x)=>{ const n=Math.min(2,f.n||1), zps=Array.from({length:n},(_,p)=>zs.zp&&zs.zp.find(q=>q.feldId===f.id&&(q.pos||0)===p));
    const drei=zps.length&&zps.every(z=>z&&z.art==="3pkt"), hs=zs.nb==="rheinnetz"?"-hs":"";
    let s="";
    if(drei&&n===1) s+=ganz(hoch?"zs-z1-3pkt-high-hsn.png":`zs-z1-3pkt${hs}.png`,x);
    else if(drei&&n===2&&hoch) s+=ganz("zs-z2-3pkt-hs.png",x);
    else { const nm=`zs-z${n}-ehz${hs}.png`; s+=hoch?ehzHoch(nm,x):ganz(nm,x); }
    const off0=hoch?300:0;
    /* SLS genau über den drei Außenleitern, die im Feldbild zum Zählerplatz hochgehen (Mitte in mm von links, gemessen) */
    const slsM=drei?(n>1?[96,151]:hoch?[54]:hs?[86]:[101]):[54,170];  /* rechter SLS weiter rechts (deckt die Leiter bei 141–166 mm weiter ab) – dazwischen 32 mm frei für Einspeiseadapter bzw. Überspannungsschutz */
    /* Einspeiseadapter für das Hausanschlusskabel – auf der Sammelschiene, bevorzugt im ersten Zählerfeld mit einem Platz */
    if(f===eiF){ const ey=fy+(784.8+off0)*fh/(1050+off0), eh=200*fh/(1050+off0), ew=eh*202/1800; /* Klemmen N…PE genau auf den fünf Sammelschienen (Abstand 40 mm) */ const ex=n>1?(f===ussF?x+FW-6-ew:x+112-ew/2):x+FW-30-ew; s+=`<image href="${B}einspeiseadapter.png" x="${k1(ex)}" y="${k1(ey)}" width="${k1(ew)}" height="${k1(eh)}"/>`; }
    zps.forEach((zz,p)=>{ const nr=zn+p+1, an=aktiv&&aktiv===`${f.id}:${p}`, xa=x+(p?131:8), off=hoch?300:0;
      /* aktiver Zählerplatz: rot hinterlegt */
      if(an) s+=R(x+(p?128:6),fy+(455+off)*fh/(1050+off),116,287*fh/(1050+off),C.akt,null,0,3,` fill-opacity=".16"`);
      const kz=zz?(zz.zweck==="frei"?"frei":ZSZ_KURZ[zz.zweck]||""):""; if(kz) s+=T(x+(p?190:63),fy+(700+off)*fh/(1050+off),kz,{s:22,w:700,f:zz.zweck==="frei"?"#888":"#333"});
      /* SLS mit Nennstrom */
      const amp=zz&&zz.sls&&zz.sls!=="keiner"?zz.sls.slice(1):"", ger=zsSlsGeraet(zs,zz);
      /* eigene Herstellergrafik (gleicher Stil wie die Feldbilder), sonst die Standard-SLS-Grafik mit Herstellername */
      if(amp&&ger&&ZSZ_SLS_BILD[ger.h]){ const [bn,bw0,bh0]=ZSZ_SLS_BILD[ger.h], sw=84, sh=sw*bh0/bw0, sx=x+slsM[p]-sw/2, sy=fy+(790+off)*fh/(1050+off);
        s+=`<image href="${B}${bn}" x="${k1(sx)}" y="${k1(sy)}" width="${sw}" height="${k1(sh)}"/>`+T(sx+sw/2,sy+sh*.395,amp+"A",{s:30,w:800,f:"#111"})+T(sx+sw/2,sy+sh*.865,"SLS",{s:30,w:800,f:"#111"}); }
      else if(amp){ const sw=84, sh=150, sx=x+slsM[p]-sw/2, sy=fy+(795+off)*fh/(1050+off);
        s+=R(sx+1,sy+2,sw,sh,"#000",null,0,2,` fill-opacity=".18" filter="url(#zsWeich)"`)+`<svg x="${k1(sx)}" y="${k1(sy)}" width="${sw}" height="${sh}" viewBox="0 0 ${sw} ${sh}"><image href="${B}sls-schalter.png" x="${k1(-sw*.075)}" y="${k1((sh-sw*1.15*138/94)/2)}" width="${k1(sw*1.15)}" height="${k1(sw*1.15*138/94)}"/></svg>`
          +T(sx+sw/2,sy+58,amp+"A",{s:30,w:800,f:"#111"}); } });
    /* Überspannungsschutz einmal im Schrank, beim ersten Zählerplatz */
    if(f===ussF&&zps.length){ const u=zsUssGeraet(zs), by=fy+fh-31.8*fh/1050, peX=x+(n>1?98.8:107.5), luecke=n>1;
      const ub=u&&ZS_USS_BILD[u.nr];
      if(ub){ const hh=ub[4]||200, ww=Math.min(56,hh*ub[1]/ub[2]); s+=`<image href="${B}${ub[0]}" x="${k1(luecke?x+112-ww/2:peX-(ub[5]==null?.5:ub[5])*ww)}" y="${k1(fy+fh-44-hh+(ub[3]||0)*fh/1050)}" width="${k1(ww)}" height="${hh}" preserveAspectRatio="xMidYMid meet"/>`; }
      else if(u) s+=`<image href="${B}usps.png" x="${k1(luecke?x+97:peX-29.5)}" y="${k1(by-214)}" width="59" height="202"/>`;
    }
    /* Zählernummer */
    zps.forEach((_,p)=>{ const nr=zn+p+1, an=aktiv&&aktiv===`${f.id}:${p}`; s+=R(x+(p?FW-80:0),fy,80,70,an?C.akt:"#AAAAAA",null,0,4)+T(x+(p?FW-40:40),fy+50,nr,{s:40,w:600,f:an?C.weiss:"#222"}); });
    zn+=n; return s; };
  const titel=(x,y,t)=>T(x+FW/2,y,t,{s:40,w:600,f:"#2A2A2A"});
  let inn="";
  /* Bestückung: Reihen der Legende der Reihe nach auf die Reihenplätze der Verteilerfelder legen */
  const BE=(()=>{ if(!ZSZ_L||typeof legReihen!=="function"||typeof legGeraetBild!=="function") return {}; const RR=legReihen(ZSZ_L), PL=zsReihenPlaetze(zs), M={}, TE=18;
    RR.forEach((r,k)=>{ const pl=PL[k]; if(!pl) return; const x=g.fx[F.findIndex(f=>f.id===pl.feldId)], yc=fy+pl.y*sk, H=TE*400/92; let tx=x+(FW-12*TE)/2, out="";
      r.g.forEach(([e,i,w])=>{ out+=legGeraetBild(e,tx,w,yc-H/2,TE,"../bilder/vt/"); tx+=w*TE; });
      M[pl.feldId]=(M[pl.feldId]||"")+out; });
    return M; })();
  F.forEach((f,i)=>{ const x=g.fx[i]; let s=feldGrund(x);
    if(f.typ==="z") s+=zaehler(f,x);
    else if(f.typ==="v"){ const apz=zs.apz&&zs.apz.feldId===f.id?zs.apz.lage:""; const vtN=hoch?"zs-vt-high.png":"zs-vt.png";
      s+=apz?apzFeld(x,apz):ganz(vtN,x); if(BE[f.id]) s+=BE[f.id]; s+=titel(x,fy+(apz==="oben"?(QH-APZ0)*sk:0)+(hoch?83:79),apz?"APZ":`VTF ${++nv}`); }
    else if(f.typ==="m"){ nm++; const apz=zs.apz&&zs.apz.feldId===f.id?zs.apz.lage:"", mmN=hoch?"zs-mm-fw1-high.png":"zs-mm.png";
      s+=apz?apzFeld(x,apz,mmN):ganz(mmN,x); s+=titel(x,fy+(apz==="oben"?(QH-APZ0)*sk:0)+80*fh/1050,nMM>1?`MM ${nm}`:"MM"); }
    else s+=ganz("zs-tsg.png",x)+titel(x,fy+80,"TSG");
    inn+=s;
    if(ed){ const gw=i===selFeld; if(gw) inn+=R(x+FW/2-76,y0+g.H+18,152,40,"#E3E5E8",null,0,20);
      inn+=T(x+FW/2,y0+g.H+46,ZS_TYP_KURZ[f.typ]||"",{s:24,w:gw?800:600,f:gw?C.text:C.grau}); } });
  const mehr=g.schr.length>1;
  const masse=g.schr.map((c,k)=>L(c.x+2,y0-38,c.x+2,y0-10,C.grau,1.2)+T(c.x+16,y0-18,`Breite ${c.B} mm  →`,{s:22,w:400,f:C.grau,a:"start"})+(mehr?T(c.x+c.B,y0-18,`Schrank ${k+1}`,{s:22,w:600,f:C.grau,a:"end"}):"")).join("")
    +L(x0-40,y0+2,x0-12,y0+2,C.grau,1.2)+T(0,0,`Höhe ${g.H} mm`,{s:22,w:400,f:C.grau,a:"end",ex:` transform="translate(${x0-20} ${y0+16}) rotate(-90)"`})+T(x0-26,y0+250,"↓",{s:22,w:400,f:C.grau});
  const quelle=T(g.vw-ZSZ.MR,g.vh-8,"Feldgrafiken: zaehlerschrank24.de",{s:16,w:400,f:"#9A9A9A",a:"end"});
  const gehaeuse=g.schr.map(c=>R(c.x,y0,c.B,g.H,C.weiss,"#6A6A6A",2.5,2)+R(c.x+9,y0+9,c.B-18,g.H-18,"none","#B0B0B0",1)).join("");
  const mini=opt&&opt.mini, vb=mini?`${x0-6} ${y0-6} ${g.vw-x0-ZSZ.MR+12} ${g.H+12}`:`0 0 ${g.vw} ${g.vh}`;
  return `<svg class="zs-svg zs-z${mini?" klein":""}" viewBox="${vb}" style="--n:${g.n+(g.schr.length-1)*.3};max-width:${(g.n+(g.schr.length-1)*.3)*124}px" font-family="'Open Sans',Manrope,system-ui,sans-serif" aria-hidden="true">`
    +`<defs><filter id="zsWeich" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4"/></filter><filter id="zsWeich2" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity=".35"/></filter><pattern id="zsLoch" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="#FFFFFF"/><circle cx="6" cy="6" r="2.4" fill="#9A9A9A"/></pattern>`
    +`<pattern id="zsLochR" width="9" height="8" patternUnits="userSpaceOnUse"><rect width="9" height="8" fill="#FFFFFF"/><circle cx="2.2" cy="2" r="1.7" fill="none" stroke="#8A8A8A" stroke-width=".7"/><circle cx="6.7" cy="6" r="1.7" fill="none" stroke="#8A8A8A" stroke-width=".7"/></pattern>`
    +`<linearGradient id="zsSchatten" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D0D0D0" stop-opacity="0"/><stop offset="1" stop-color="#C4C4C4" stop-opacity=".95"/></linearGradient></defs>`
    +(mini?"":masse)+gehaeuse+inn+(mini?"":quelle)+`</svg>`; }

/* Zeichnung mit antippbaren Bereichen: Felder, Zählerplätze (inkl. SLS) und APZ.
   akt = {feld:i=>'data-act=…', zp:(i)=>'…', apz:()=>'…'} – fehlende Einträge erzeugen keine Fläche. */
function zsKlick(zs,reihen,aktiv,akt){ const g=zsGeo(zs,false), F=zs.felder, FW=ZSZ.FW, fy=ZSZ.MT+ZSZ.WAND, fh=g.H-2*ZSZ.WAND, hoch=g.H===1400, nb=g.n+(g.schr.length-1)*.3;
  const pct=(x,y,w,h)=>`left:${(x/g.vw*100).toFixed(2)}%;top:${(y/g.vh*100).toFixed(2)}%;width:${(w/g.vw*100).toFixed(2)}%;height:${(h/g.vh*100).toFixed(2)}%`;
  const off=hoch?300:0, Y=mm=>fy+mm*fh/(1050+off), QH=hoch?2154:1682, A0=hoch?1636:1158, sk=fh/QH; let h="", zi=0;
  F.forEach((f,i)=>{ const x=g.fx[i];
    if(akt.feld) h+=`<button type="button" class="feld" ${akt.feld(i)} aria-label="Feld ${i+1}" style="${pct(x,fy,FW,fh)}"></button>`;
    if(f.typ==="z") for(let p=0;p<Math.min(2,f.n||1);p++){ const k=zs.zp.findIndex(q=>q.feldId===f.id&&(q.pos||0)===p);
      if(k>=0&&akt.zp){ h+=`<button type="button" class="zp" ${akt.zp(k)} aria-label="Zähler ${k+1}" style="${pct(x+(p?128:6),Y(455+off),116,Y(742+off)-Y(455+off))}"></button>`;
        h+=`<button type="button" class="zp" ${akt.zp(k)} aria-label="SLS Zähler ${k+1}" style="${pct(x+(p?FW-101:0),Y(790+off),101,Y(965+off)-Y(790+off))}"></button>`; } }
    if(akt.apz&&zs.apz&&zs.apz.feldId===f.id){ const ob=zs.apz.lage==="oben"; h+=`<button type="button" class="apz" ${akt.apz()} aria-label="APZ" style="${pct(x,ob?fy:fy+A0*sk,FW,(QH-A0)*sk)}"></button>`; } });
  return `<div class="zs-ki" style="--n:${nb}">${zsSvg(zs,reihen,false,aktiv)}<div class="zs-ki-h">${h}</div></div>`; }

/* ===== Unterverteiler (Hager volta) =====
   Innen genau das Verteilerfeld der Zählerschrank-Zeichnung (zs-vt.png von zaehlerschrank24.de): oben die N-/PE-Klemmleiste,
   dann je Reihe ein Stück mit Hutschiene, unten die Eckhalter – also derselbe Strich wie im Zählerschrank.
   Außen das Gehäuse wie beim Zählerschrank, Maße nach Hager-Datenblatt: Aufputz VA..CN 305 mm breit,
   Unterputz VU..NC 348 mm breit (Rahmen), 12 TE je Reihe, Reihenabstand 125 mm. */
const UVZ_H={ap:[245,370,515,640,765],up:[356,505.5,630.5,755.5,880.5]};
function uvMasse(L){ const n=Math.max(1,Math.min(9,+L.reihen||3)), up=L.montage!=="ap", te=+L.teReihe||12, ext=Math.max(0,te-12)*18;
  const tab=UVZ_H[up?"up":"ap"], H=n<=5?tab[n-1]:tab[4]+125*(n-5), W=(up?348:305)+ext;
  const modell=te===12&&n<=5?`${up?"VU":"VA"}${n*12}${up?"NC":"CN"}`:"";
  return {n,up,te,ext,H,W,modell}; }
const uvModellText=L=>{ const M=uvMasse(L); return M.modell?`Hager volta ${M.modell}`:`${M.n}-reihig · ${M.te} TE je Reihe`; };
function uvZeichnung(L){ const M=uvMasse(L), s=250/400 /* mm je Pixel im Feldbild */, k1=v=>(+v).toFixed(1), B="../bilder/zs/", C=ZSZ_F;
  /* Feldstücke (Pixel im Feldbild): Kopf mit Klemmleiste und 1. Schiene, je weitere Reihe ein Stück mit Schiene, Fuß mit Eckhaltern */
  const KOPF=[0,297], REIHE=[297,497], FUSS=[1597,1682];
  const fh=((KOPF[1]-KOPF[0])+(M.n-1)*(REIHE[1]-REIHE[0])+(FUSS[1]-FUSS[0]))*s, fw=250+M.ext;
  const W=M.W, H=Math.max(M.H,fh+30), ML=64, MT=58, MR=16, MB=62, vw=ML+W+MR, vh=MT+H+MB, x0=ML, y0=MT, fx=x0+(W-fw)/2, fy=y0+(H-fh)/2;
  const R=(x,y,w,h,f,st,sw,rx,ex)=>`<rect x="${k1(x)}" y="${k1(y)}" width="${k1(Math.max(0,w))}" height="${k1(Math.max(0,h))}"${rx?` rx="${rx}"`:""} fill="${f||"none"}"${st?` stroke="${st}" stroke-width="${sw||1}"`:""}${ex||""}/>`;
  const T=(x,y,t,o={})=>`<text x="${k1(x)}" y="${k1(y)}" font-size="${o.s||22}" font-weight="${o.w||600}" fill="${o.f||C.text}" text-anchor="${o.a||"middle"}"${o.ex||""}>${t}</text>`;
  const L_=(x1,y1,x2,y2,st,sw)=>`<path d="M${k1(x1)} ${k1(y1)}L${k1(x2)} ${k1(y2)}" stroke="${st}" stroke-width="${sw||2}" fill="none"/>`;
  /* ein Stück [q0,q1) über die ganze Feldbreite; bei 18/24 TE in der Mitte mit dem Stück 190–262 px verlängert */
  const stueck=(y,q0,q1)=>{ const h=q1-q0, one=(x,sx,sw)=>`<svg x="${k1(x)}" y="${k1(y)}" width="${k1(sw*s)}" height="${k1(h*s)}" viewBox="${sx} ${q0} ${sw} ${h}" preserveAspectRatio="none"><image href="${B}zs-vt.png" width="400" height="1682"/></svg>`;
    if(!M.ext) return one(fx,0,400); let o=one(fx,0,262), px=262*s, rest=M.ext/s; while(rest>0){ const t=Math.min(72,rest); o+=one(fx+px,190,t); px+=t*s; rest-=t; } return o+one(fx+px,262,138); };
  let g="", y=fy; const schienen=[];
  const wd=Math.min(25,(W-fw)/2,(H-fh)/2); g+=R(x0+wd,y0+wd,W-2*wd,H-2*wd,"#F1F1F1")+R(x0+wd,y0+H-wd-180,W-2*wd,180,"url(#zsSchatten)");
  g+=stueck(y,KOPF[0],KOPF[1]); schienen.push(y+198*s); y+=(KOPF[1]-KOPF[0])*s;
  for(let k=1;k<M.n;k++){ g+=stueck(y,REIHE[0],REIHE[1]); schienen.push(y+(397-REIHE[0])*s); y+=(REIHE[1]-REIHE[0])*s; }
  g+=stueck(y,FUSS[0],FUSS[1]);
  /* Geräte aus der Legende auf die Hutschienen – wie im Zählerschrank (18 mm je TE) */
  let ueber=0;
  if(typeof legReihen==="function"&&typeof legGeraetBild==="function"){ const RR=legReihen(L), P=18, GH=P*400/92;
    RR.forEach((r,k)=>{ if(k>=M.n){ ueber++; return; } const yc=schienen[k]; let tx=fx+(fw-M.te*P)/2;
      r.g.forEach(([e,i,w])=>{ g+=`<g class="leg-dev" data-act="legEdit" data-id="${esc(e.id)}"><title>${esc([e.kz,e.bez].filter(Boolean).join(" · "))}</title>${legGeraetBild(e,tx,w,yc-GH/2,P,"../bilder/vt/")}</g>`; tx+=w*P; }); }); }
  /* Gehäuse wie beim Zählerschrank; Wandstärke ergibt sich aus Volta-Maß und Feld */
  const geh=R(x0,y0,W,H,C.weiss,"#6A6A6A",2.5,2)+R(x0+9,y0+9,W-18,H-18,"none","#B0B0B0",1);
  const masse=L_(x0+2,y0-38,x0+2,y0-10,C.grau,1.2)+T(x0+16,y0-18,`Breite ${String(M.W).replace(".",",")} mm  →`,{s:22,w:400,f:C.grau,a:"start"})
    +L_(x0-40,y0+2,x0-12,y0+2,C.grau,1.2)+T(0,0,`Höhe ${String(M.H).replace(".",",")} mm`,{s:22,w:400,f:C.grau,a:"end",ex:` transform="translate(${x0-20} ${y0+16}) rotate(-90)"`});
  const fuss=T(x0,vh-34,esc(uvModellText(L)+" · "+(M.up?"Unterputz":"Aufputz")),{s:18,w:600,f:"#9A9A9A",a:"start"})+T(vw-MR,vh-12,"Feldgrafiken: zaehlerschrank24.de",{s:14,w:400,f:"#9A9A9A",a:"end"});
  return {svg:`<svg class="zs-svg zs-z uv-svg" viewBox="0 0 ${k1(vw)} ${k1(vh)}" style="max-width:${Math.round(vw*1.1)}px" font-family="'Open Sans',Manrope,system-ui,sans-serif" role="img" aria-label="Unterverteiler">`
    +`<defs><linearGradient id="zsSchatten" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D0D0D0" stop-opacity="0"/><stop offset="1" stop-color="#C4C4C4" stop-opacity=".95"/></linearGradient></defs>`
    +masse+geh+g+fuss+`</svg>`,ueber}; }
