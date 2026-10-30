/* Technische Zeichnung des Zählerschranks – Maßstab 1 Einheit = 1 mm.
   Grundaufbau wie ein echter Zählerschrank: Felder 250 mm mit gelochten Seitenholmen und Haltewinkeln,
   Abdeckstreifen über die ganze Feldbreite, N/PE-Klemmleisten, Reihen im 150-mm-Raster.
   Breite = Felder × 250 + 50. Zählerfeld von oben: AAR · RfZ · Zähler · NAR. APZ im Verteiler- oder Multimediafeld. */
const ZSZ={FW:250,WAND:25,ML:64,MT:58,MR:16,MB:78};
const ZSZ_F={lin:"#8C8C8C",fein:"#BDBDBD",feld:"#F2F2F2",weiss:"#FFFFFF",hell:"#F7F7F7",mittel:"#E2E2E2",dunkel:"#3E4145",text:"#2A2A2A",grau:"#777777",
  br:"#8B5A2B",sw:"#2E2E2E",gr:"#A0A0A0",bl:"#1E9BE6",gn:"#86CF3A",ge:"#E2C41C",or:"#F39020",orK:"#C06A12",rot:"#E3231B",rotH:"#FBE1DF",akt:"#C8102E",aktH:"#FCE8EB"};
function zsHoeheMm(zs){ return +zs.hoehe===1400?1400:1100; }
function zsGeo(zs){ const n=zs.felder.length, H=zsHoeheMm(zs), B=n*ZSZ.FW+2*ZSZ.WAND, vw=ZSZ.ML+B+ZSZ.MR, vh=ZSZ.MT+H+ZSZ.MB;
  return {n,H,B,vw,vh,links:(ZSZ.ML+ZSZ.WAND)/vw*100,breite:n*ZSZ.FW/vw*100,oben:ZSZ.MT/vh*100,hoehe:(H+ZSZ.MB)/vh*100}; }
function zsZeichnung(zs,reihen,aktiv,selFeld){
  const C=ZSZ_F, g=zsGeo(zs), F=zs.felder, FW=ZSZ.FW, x0=ZSZ.ML, y0=ZSZ.MT, fy=y0+ZSZ.WAND, fh=g.H-2*ZSZ.WAND, k1=v=>(+v).toFixed(1);
  const R=(x,y,w,h,f,s,sw,rx,ex)=>`<rect x="${k1(x)}" y="${k1(y)}" width="${k1(Math.max(0,w))}" height="${k1(Math.max(0,h))}"${rx?` rx="${rx}"`:""} fill="${f||"none"}"${s?` stroke="${s}" stroke-width="${sw||1}"`:""}${ex||""}/>`;
  const T=(x,y,t,o={})=>`<text x="${k1(x)}" y="${k1(y)}" font-size="${o.s||22}" font-weight="${o.w||700}" fill="${o.f||C.text}" text-anchor="${o.a||"middle"}"${o.ex||""}>${t}</text>`;
  const L=(x1,y1,x2,y2,s,sw,ex)=>`<path d="M${k1(x1)} ${k1(y1)}L${k1(x2)} ${k1(y2)}" stroke="${s}" stroke-width="${sw||2}" fill="none" stroke-linecap="round"${ex||""}/>`;
  const O=(cx,cy,r,f,s,sw)=>`<circle cx="${k1(cx)}" cy="${k1(cy)}" r="${r}" fill="${f||"none"}"${s?` stroke="${s}" stroke-width="${sw||1}"`:""}/>`;

  /* ---------- Grundaufbau ---------- */
  /* Feld: hellgrauer Grund, Schatten unten, gelochte Seitenholme, dunkle Haltewinkel in den Ecken */
  const feldGrund=x=>R(x,fy,FW,fh,C.feld,C.lin,1)+R(x+1,fy+fh-160,FW-2,159,"url(#zsSchatten)");
  const holme=x=>{ let s=""; [x+2,x+FW-14].forEach(hx=>{ s+=R(hx,fy,12,fh,C.hell,"#9A9A9A",.8)+L(hx+4,fy+6,hx+4,fy+fh-6,"#A6A6A6",2.4,` stroke-dasharray="3 6" stroke-linecap="butt"`)+L(hx+8.5,fy+9,hx+8.5,fy+fh-6,"#B4B4B4",1.6,` stroke-dasharray="2 7" stroke-linecap="butt"`); });
    [[x+1,fy,24],[x+FW-17,fy,24],[x+1,fy+fh-32,32],[x+FW-17,fy+fh-32,32]].forEach(([wx,wy,wh])=>{ s+=R(wx,wy,16,wh,C.dunkel,null,0,2)+O(wx+8,wy+wh/2,3,"#6A6D72"); }); return s; };
  /* Abdeckstreifen über die ganze Feldbreite */
  const vt=(cx,cy)=>{ const d=3.6; return R(cx-d,cy-d,2*d,2*d,C.weiss,"#6E6E6E",.9,1.2)+O(cx-d,cy-d,1.3,"#6E6E6E")+O(cx+d,cy-d,1.3,"#6E6E6E")+O(cx-d,cy+d,1.3,"#6E6E6E")+O(cx+d,cy+d,1.3,"#6E6E6E"); };
  const kr=(cx,cy,r)=>O(cx,cy,r||2.1,C.weiss,"#6E6E6E",.9);
  const streifen=(x,y)=>{ const w=FW, m=y+13; let s=R(x,y,w,26,"#FCFCFC",C.lin,1)+L(x+1,y+4,x+w-1,y+4,"#DADADA",1)+L(x+1,y+22,x+w-1,y+22,"#E6E6E6",1);
    s+=O(x+8,m,2.3,"#555")+O(x+w-8,m,2.3,"#555");
    s+=kr(x+20,m+4)+kr(x+29,m)+kr(x+35,m)+kr(x+41,m);
    s+=vt(x+w*.29,m);
    s+=kr(x+w*.41,m+5,1.8)+vt(x+w*.45,m)+kr(x+w*.5-4,m)+kr(x+w*.5+4,m)+vt(x+w*.55,m);
    s+=vt(x+w*.71,m);
    s+=kr(x+w-41,m)+kr(x+w-35,m)+kr(x+w-29,m); return s; };
  /* N/PE-Klemmleiste über die ganze Feldbreite, mit Haltern an den Holmen */
  const klemmleiste=(x,y)=>{ const a=x+20, b=x+FW-20, w=b-a; let s=R(x+1,y-4,18,34,C.dunkel,null,0,2)+R(x+FW-19,y-4,18,34,C.dunkel,null,0,2)+R(a,y+8,w,10,"#CFCFCF",C.lin,.8);
    const blk=(bx,bw,f,k)=>{ let t=R(bx,y,bw,22,f,k,1,1.5)+L(bx+1,y+24,bx+bw-1,y+24,"#2E2E2E",4,` stroke-dasharray="1.6 1.6" stroke-linecap="butt"`)+L(bx+1,y+24,bx+bw-1,y+24,C.ge,4,` stroke-dasharray="1.6 1.6" stroke-dashoffset="1.6" stroke-linecap="butt"`);
      for(let cx=bx+9;cx<bx+bw-5;cx+=12.5) t+=O(cx,y+11,3.4,C.weiss,"#333",.9); return t; };
    s+=blk(a,w*.36,C.bl,"#0E6FA8")+blk(a+w*.36,w*.42,C.gn,"#5A9A1C")+blk(a+w*.78,w*.22,C.bl,"#0E6FA8"); return s; };
  const titel=(x,y,t)=>T(x+FW/2,y,t,{s:32,w:600,f:C.text});
  const lochblech=(x,y,w,h)=>R(x,y,w,h,"url(#zsLoch)",C.lin,.9,1);

  /* ---------- Bauteile (eigene) ---------- */
  const schiene=(x,y,w)=>R(x,y,w,11,"#E4E4E4",C.lin,.8,1)+L(x+5,y+5.5,x+w-5,y+5.5,C.fein,2,` stroke-dasharray="8 6"`);
  const schraube=(cx,cy)=>O(cx,cy,3.2,C.weiss,"#6E6E6E",.9)+L(cx-2,cy+2,cx+2,cy-2,"#6E6E6E",.9);
  const pol=(cx,cy)=>R(cx-6.5,cy-6.5,13,13,C.hell,C.fein,.8)+schraube(cx,cy);
  const geraet=(x,y,te,o={})=>{ const w=te*18, h=90, k=o.rot?C.rot:C.lin;
    let s=R(x+1,y,w-2,h,C.weiss,k,1,2); for(let p=0;p<te;p++){ s+=pol(x+9+p*18,y+12)+pol(x+9+p*18,y+h-12); }
    s+=R(x+4,y+24,w-8,h-48,o.rot?C.rotH:"#EDEDED",o.rot?C.rot:C.fein,.8,2);
    if(o.rj) s+=R(x+w/2-6,y+h/2-8,12,12,C.sw,null,0,1)+R(x+w/2-3,y+h/2+4,6,3,C.sw);
    else if(o.kl) { for(let p=0;p<te*2;p++) s+=R(x+5+p*(w-10)/(te*2),y+h/2-7,(w-10)/(te*2)-2,14,C.mittel,C.lin,.8,1); }
    else s+=R(x+w/2-4,y+h/2-17,8,15,o.rot?C.rot:"#666",null,0,2)+(o.t?T(x+w/2,y+h/2+16,o.t,{s:te>2?13:11,w:800,f:o.rot?C.rot:C.text}):R(x+6,y+h/2+8,w-12,5,C.mittel,null,0,1));
    return s; };
  const klemme=(x,y,w,c,pe)=>R(x,y,w,44,c,C.lin,.7,1)+(pe?R(x+w/2-1.5,y,3,44,C.ge):"")+O(x+w/2,y+9,2.6,C.weiss,"#555",.8)+O(x+w/2,y+35,2.6,C.weiss,"#555",.8);
  /* APZ-Einsatz: Montageplatte mit Lochfeld, Tragschiene, Kabelhalter, Plätze für Router und Abschlusspunkt */
  const apzEinsatz=(x,y,h)=>{ const ix=x+16, iw=FW-32; let s=R(ix,y,iw,h,C.weiss,C.lin,1,2)+R(ix-14,y-2,16,26,C.dunkel,null,0,2)+R(ix+iw-2,y-2,16,26,C.dunkel,null,0,2);
    s+=lochblech(ix+iw*.3,y+12,iw*.4,h*.2)+R(ix+8,y+h*.3,iw-16,26,"#EFEFEF",C.lin,1,2);
    [ix+30,ix+56,ix+iw-46].forEach(ox=>{ s+=R(ox,y+h*.3+9,18,8,C.weiss,"#555",.9,4); }); s+=R(ix+iw*.62,y+h*.3-8,20,42,C.weiss,C.lin,1,3);
    s+=lochblech(ix+iw*.3,y+h*.42,iw*.4,h*.52);
    [[ix+10,y+12],[ix+iw-62,y+12],[ix+10,y+h*.5],[ix+iw-56,y+h*.5],[ix+10,y+h*.72],[ix+iw-56,y+h*.72]].forEach(([dx,dy])=>{ s+=R(dx,dy,48,h*.18,"none","#666",1.3,4,` stroke-dasharray="5 4"`); });
    [ix+iw*.38,ix+iw*.56].forEach(hx=>{ s+=`<path d="M${k1(hx)} ${k1(y+h*.5)}l6 30h12l6-30" fill="${C.weiss}" stroke="#666" stroke-width="1"/>`+R(hx+4,y+h*.5+30,16,h*.3,C.weiss,"#666",1,2); });
    return s; };
  const KAB=[C.br,C.sw,C.gr,C.bl,C.gn];
  let zn=0, nv=0, nm=0, uess=false;

  const zaehler=(f,x)=>{ const n=f.n||1, aH=fh*300/1050, rH=fh*150/1050, nH=fh*300/1050, zH=fh-aH-rH-nH, ix=x+18, iw=FW-36;
    const zps=Array.from({length:n},(_,p)=>zs.zp&&zs.zp.find(q=>q.feldId===f.id&&(q.pos||0)===p)); let s="";
    /* Zuleitung N und PE senkrecht durch den oberen Anschlussraum */
    s+=L(ix+iw*.42,fy+2,ix+iw*.42,fy+aH-6,C.bl,3)+L(ix+iw*.42+6,fy+2,ix+iw*.42+6,fy+aH-6,C.gn,3)+L(ix+iw*.42+6,fy+2,ix+iw*.42+6,fy+aH-6,C.ge,3,` stroke-dasharray="7 7"`);
    /* AAR: Abgangsklemmen, Hauptschalter je Zähler, RJ45, Steuerklemmen */
    const rh=aH/2, ky=fy+rh/2-10; s+=schiene(ix+iw*.5,ky+16,iw*.5);
    let kx=ix+iw*.5+4; for(let p=0;p<n&&p<2;p++){ KAB.forEach((c,k)=>{ s+=klemme(kx+k*10.5,ky,9.5,k<3?C.mittel:c,k===4); }); kx+=56; }
    s+=streifen(x,fy+rh-13);
    const gy=fy+rh+rh/2-45; s+=schiene(ix,gy+39,iw);
    let gx=ix+2; for(let p=0;p<n;p++){ s+=geraet(gx,gy,3,{t:n>1?`HS ${zn+p+1}`:"HS"}); gx+=56; }
    if(gx+18<=ix+iw){ s+=geraet(gx,gy,1,{rj:1}); gx+=20; }
    if(gx+36<=ix+iw) s+=geraet(gx,gy,2,{kl:1});
    s+=streifen(x,fy+aH-13);
    /* RfZ */
    const ry=fy+aH; s+=schiene(ix,ry+rH/2-6,iw)+T(ix+4,ry+30,"RfZ",{s:15,f:C.grau,a:"start"});
    [[ix+46,4,"SMGW"],[ix+46+78,5,"Steuerbox"]].forEach(([bx,te,t])=>{ if(bx+te*18<=ix+iw+2) s+=R(bx,ry+rH/2-40,te*18-4,80,"none","#777",1.2,3,` stroke-dasharray="6 4"`)+T(bx+te*9-2,ry+rH/2-22,t,{s:12,w:600,f:C.grau}); });
    s+=streifen(x,ry+rH-13);
    /* Zählerplätze (BKE-I) */
    const zy=ry+rH, zw=(iw-(n-1)*8)/n;
    zps.forEach((zz,p)=>{ zn++; const zx=ix+p*(zw+8), an=aktiv&&aktiv===`${f.id}:${p}`, frei=zz&&!zsBelegt(zz), drei=zz&&zz.art==="3pkt";
      s+=R(zx,zy+16,zw,zH-30,C.weiss,C.lin,1,2);
      if(frei){ s+=R(zx+12,zy+40,zw-24,zH-76,"none","#777",1.4,6,` stroke-dasharray="8 6"`)+T(zx+zw/2,zy+zH/2+8,"frei",{s:20,f:C.grau}); }
      else { const mw=Math.min(zw-20,112), mh=(zH-30)*.84, mx=zx+(zw-mw)/2, my=zy+16+(zH-30-mh)/2+4;
        s+=R(mx+mw*.12,my-10,mw*.76,16,C.mittel,C.lin,1,3); for(let k=0;k<5;k++) s+=R(mx+mw*.18+k*mw*.13,my-6,mw*.06,8,"#666",null,0,1);
        s+=R(mx,my,mw,mh,an?C.aktH:C.weiss,an?C.akt:"#777",1.3,8);
        if(drei){ s+=R(mx+10,my+mh*.12,mw-20,mh*.2,C.hell,C.lin,1,3); for(let k=0;k<6;k++) s+=R(mx+16+k*(mw-32)/6,my+mh*.15,(mw-32)/6-3,mh*.14,k===5?C.rot:C.sw,null,0,1);
          s+=O(mx+mw/2,my+mh*.58,Math.min(mw,mh)*.17,C.hell,C.lin,1.2)+L(mx+mw/2-Math.min(mw,mh)*.15,my+mh*.58,mx+mw/2+Math.min(mw,mh)*.15,my+mh*.58,C.rot,2); }
        else { s+=R(mx+9,my+mh*.12,mw-18,mh*.2,"#5B636C",null,0,3)+R(mx+13,my+mh*.12+4,mw-26,mh*.2-8,"#B5DCC0",null,0,2)
            +T(mx+mw/2,my+mh*.12+mh*.1+5,"012345,6",{s:Math.max(10,Math.min(15,(mw-30)/6)),w:700,f:"#1E2B22",ex:` font-family="ui-monospace,monospace"`})
            +T(mx+mw-12,my+mh*.42,"kWh",{s:11,w:600,f:C.grau,a:"end"})+O(mx+mw*.28,my+mh*.52,3.6,C.rot)+O(mx+mw*.66,my+mh*.56,10,C.weiss,"#666",1.4)+O(mx+mw*.66,my+mh*.56,3.5,C.sw)
            +L(mx+12,my+mh*.74,mx+mw-12,my+mh*.74,C.fein,1.2)+L(mx+12,my+mh*.8,mx+mw*.6,my+mh*.8,C.fein,1.2); }
        s+=T(mx+mw/2,my+mh-10,drei?"3-Punkt":"eHZ",{s:13,w:700,f:C.grau})+R(mx+mw*.3,my+mh-2,mw*.4,9,C.mittel,C.lin,1,2); } });
    s+=streifen(x,zy+zH-13);
    /* NAR: dunkle Tragholme, Sammelschiene, SLS je Zählerplatz, ÜSS Typ 1 einmal im Schrank */
    const ny=zy+zH, b0=ny+34, bs=(nH-86)/4;
    s+=R(ix-2,ny+12,14,nH-44,C.dunkel,null,0,2)+R(ix+iw-12,ny+12,14,nH-44,C.dunkel,null,0,2);
    for(let k=0;k<5;k++) s+=R(ix+12,b0+k*bs,iw-24,10,C.or,C.orK,.8,1.5);
    let sx=ix+16; const sy=ny+nH*.3;
    zps.forEach(zz=>{ const a=zz&&zz.sls&&zz.sls!=="keiner"?zz.sls.slice(1)+" A":"SLS"; for(let k=0;k<3;k++) s+=L(sx+9+k*18,sy,sx+9+k*18,ny+2,KAB[k],2.4); s+=geraet(sx,sy,3,{t:a}); sx+=58; });
    if(!uess){ uess=true; s+=L(sx+9,sy,sx+9,ny+2,C.bl,2.4)+geraet(sx,sy,2,{rot:1,t:"ÜSS"}); sx+=40; }
    s+=L(ix+iw-30,ny+2,ix+iw-30,fy+fh-2,C.gn,3)+L(ix+iw-30,ny+2,ix+iw-30,fy+fh-2,C.ge,3,` stroke-dasharray="7 7"`);
    /* Zählernummer groß oben links */
    zps.forEach((_,p)=>{ const nr=zn-n+p+1, an=aktiv&&aktiv===`${f.id}:${p}`, bx=x+8+p*(zw+8); s+=R(bx,fy+8,54,54,an?C.akt:"#A8A8A8",null,0,8)+T(bx+27,fy+47,nr,{s:30,w:600,f:an?C.weiss:C.text}); });
    return s; };

  const verteiler=(f,x)=>{ const apz=zs.apz&&zs.apz.feldId===f.id?zs.apz.lage:"", oben=apz==="oben", aH=apz?fh*300/1050:0;
    const top=fy+(oben?aH:0), hh=fh-aH, r=Math.max(1,Math.min(zsReihenFeld(zs,f,reihen),12)), kH=40, rh=(hh-kH)/r, mitte=!apz&&r>=5?Math.ceil(r/2):-1; let s="";
    s+=klemmleiste(x,top+6);
    for(let k=1;k<r;k++){ const y=top+kH+k*rh; s+=k===mitte?klemmleiste(x,y-12):streifen(x,y-13); }
    if(apz){ s+=apzEinsatz(x,oben?fy+10:fy+fh-aH+6,aH-18); if(!oben) s+=streifen(x,fy+fh-aH-13); }
    s+=titel(x,top+kH+rh/2+6,apz?"APZ":`VTF ${++nv}`);
    return s; };

  const media=(f,x)=>{ nm++; const apz=zs.apz&&zs.apz.feldId===f.id?zs.apz.lage:"", oben=apz==="oben", aH=apz?fh*300/1050:0, ix=x+18, iw=FW-36, t0=fy+(oben?aH:0), hh=fh-aH;
    let s=lochblech(ix,t0+8,iw,hh-16)+R(x+FW/2-70,t0+20,140,40,C.feld)+titel(x,t0+52,`MMF ${nm}`);
    const py=t0+76; s+=R(ix+8,py,iw-16,34,C.weiss,C.lin,1.2,3); for(let k=0;k<10;k++) s+=R(ix+16+k*(iw-32)/10,py+10,(iw-32)/10-4,12,"#777",null,0,1.5);
    const ry=py+70, rhh=Math.min(104,hh*.18); s+=L(ix+34,ry,ix+28,ry-26,"#777",4)+L(ix+iw-34,ry,ix+iw-28,ry-26,"#777",4)+R(ix+14,ry,iw-28,rhh,C.weiss,C.lin,1.3,12);
    [0,1,2,3].forEach(j=>{ s+=O(ix+32+j*13,ry+rhh-16,3.4,j<3?"#47C16A":C.hell,j<3?null:C.lin); }); s+=T(x+FW/2,ry+rhh/2+2,"Router",{s:15,w:600,f:C.grau});
    const wy=ry+rhh+28; s+=R(ix+8,wy,iw-16,32,C.weiss,C.lin,1.2,3); for(let k=0;k<8;k++) s+=R(ix+16+k*(iw-32)/8,wy+9,(iw-32)/8-5,12,"#777",null,0,1.5);
    const sty=t0+hh-78; s+=R(ix+8,sty,iw-16,44,C.weiss,C.lin,1.2,8); [0,1,2].forEach(j=>{ const cx=ix+iw/2-56+j*56; s+=O(cx,sty+22,14,C.hell,C.lin,1.1)+O(cx-5,sty+22,2.2,C.sw)+O(cx+5,sty+22,2.2,C.sw); });
    if(apz){ s+=apzEinsatz(x,oben?fy+10:fy+fh-aH+6,aH-18); s+=streifen(x,oben?t0-13:fy+fh-aH-13); }
    return s; };

  let inn="";
  F.forEach((f,i)=>{ const x=x0+ZSZ.WAND+i*FW;
    let s=feldGrund(x)+holme(x);
    s+=f.typ==="z"?zaehler(f,x):f.typ==="v"?verteiler(f,x):f.typ==="m"?media(f,x):titel(x,fy+fh/2,ZS_TYP_KURZ[f.typ]||"");
    inn+=s;
    const gw=i===selFeld; if(gw) inn+=R(x+FW/2-76,y0+g.H+18,152,40,"#E3E5E8",null,0,20);
    inn+=T(x+FW/2,y0+g.H+46,ZS_TYP_KURZ[f.typ]||"",{s:24,w:gw?800:600,f:gw?C.text:C.grau}); });
  const masse=T(x0+ZSZ.WAND,y0-20,`Breite ${g.B} mm  →`,{s:22,w:500,f:C.grau,a:"start"})+L(x0+4,y0-36,x0+4,y0-8,C.grau,1.5)
    +T(0,0,`Höhe ${g.H} mm`,{s:22,w:500,f:C.grau,a:"end",ex:` transform="translate(${x0-22} ${y0+ZSZ.WAND}) rotate(-90)"`})+L(x0-30,y0+ZSZ.WAND+170,x0-30,y0+ZSZ.WAND+196,C.grau,1.5)+`<path d="M${x0-36} ${y0+ZSZ.WAND+190}l6 8l6-8" fill="none" stroke="${C.grau}" stroke-width="1.5"/>`;
  return `<svg class="zs-svg zs-z" viewBox="0 0 ${g.vw} ${g.vh}" style="--n:${g.n};max-width:${g.n*124}px" font-family="'Open Sans',Manrope,system-ui,sans-serif" aria-hidden="true">`
    +`<defs><pattern id="zsLoch" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="#FFFFFF"/><circle cx="6" cy="6" r="2.4" fill="#9A9A9A"/></pattern>`
    +`<linearGradient id="zsSchatten" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D2D2D2" stop-opacity="0"/><stop offset="1" stop-color="#C8C8C8" stop-opacity=".9"/></linearGradient></defs>`
    +masse+R(x0,y0,g.B,g.H,C.weiss,"#666",3,2)+R(x0+9,y0+9,g.B-18,g.H-18,"none","#B0B0B0",1)+inn+`</svg>`; }
