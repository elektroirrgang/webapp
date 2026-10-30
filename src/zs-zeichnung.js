/* Technische Zeichnung des Zählerschranks – Strichzeichnung, Maßstab 1 Einheit = 1 mm.
   Felder 250 mm breit, Schrankwand 25 mm → Breite = Felder × 250 + 50.
   Zählerfeld von oben: AAR (Abgang, Hauptschalter) · RfZ · Zähler · NAR (SLS, ÜSS, Sammelschiene, Zuleitung).
   APZ im Verteiler- oder Multimediafeld, oben oder unten. */
const ZSZ={FW:250,WAND:25,ML:64,MT:58,MR:16,MB:78};
const ZSZ_F={rahmen:"#2B2E33",post:"#3A3E44",lin:"#4A4F55",fein:"#9AA0A6",hell:"#F3F4F6",mittel:"#E1E4E7",weiss:"#FFFFFF",text:"#2E3237",grau:"#6B7178",
  br:"#7B4A21",sw:"#232528",gr:"#9AA0A6",bl:"#2F6FD6",gn:"#2FA65A",ge:"#E8C51A",or:"#F28C28",orK:"#B9631A",rot:"#E2231A",rotH:"#FBE1DF",akt:"#C8102E",aktH:"#FCE8EB"};
function zsHoeheMm(zs){ return +zs.hoehe===1400?1400:1100; }
function zsGeo(zs){ const n=zs.felder.length, H=zsHoeheMm(zs), B=n*ZSZ.FW+2*ZSZ.WAND, vw=ZSZ.ML+B+ZSZ.MR, vh=ZSZ.MT+H+ZSZ.MB;
  return {n,H,B,vw,vh,links:(ZSZ.ML+ZSZ.WAND)/vw*100,breite:n*ZSZ.FW/vw*100,oben:ZSZ.MT/vh*100,hoehe:(H+ZSZ.MB)/vh*100}; }
function zsZeichnung(zs,reihen,aktiv,selFeld){
  const C=ZSZ_F, g=zsGeo(zs), F=zs.felder, FW=ZSZ.FW, x0=ZSZ.ML, y0=ZSZ.MT, fy=y0+ZSZ.WAND, fh=g.H-2*ZSZ.WAND, k1=v=>(+v).toFixed(1);
  const R=(x,y,w,h,f,s,sw,rx,ex)=>`<rect x="${k1(x)}" y="${k1(y)}" width="${k1(Math.max(0,w))}" height="${k1(Math.max(0,h))}"${rx?` rx="${rx}"`:""} fill="${f||"none"}"${s?` stroke="${s}" stroke-width="${sw||1.4}"`:""}${ex||""}/>`;
  const T=(x,y,t,o={})=>`<text x="${k1(x)}" y="${k1(y)}" font-size="${o.s||22}" font-weight="${o.w||700}" fill="${o.f||C.text}" text-anchor="${o.a||"middle"}"${o.ex||""}>${t}</text>`;
  const L=(x1,y1,x2,y2,s,sw,ex)=>`<path d="M${k1(x1)} ${k1(y1)}L${k1(x2)} ${k1(y2)}" stroke="${s}" stroke-width="${sw||2}" fill="none" stroke-linecap="round"${ex||""}/>`;
  const O=(cx,cy,r,f,s,sw)=>`<circle cx="${k1(cx)}" cy="${k1(cy)}" r="${r}" fill="${f||"none"}"${s?` stroke="${s}" stroke-width="${sw||1.2}"`:""}/>`;
  /* Bauteile */
  const schiene=(x,y,w)=>R(x,y,w,14,"#D9DCE0",C.lin,1.1,1)+L(x+2,y+4,x+w-2,y+4,C.fein,1)+L(x+2,y+10,x+w-2,y+10,C.fein,1)+L(x+6,y+7,x+w-6,y+7,C.fein,2.2,` stroke-dasharray="9 7"`);
  const schraube=(cx,cy)=>O(cx,cy,4.2,C.weiss,C.lin,1.3)+L(cx-2.6,cy+2.6,cx+2.6,cy-2.6,C.lin,1.2);
  const drehv=(cx,cy)=>O(cx,cy,5.4,C.weiss,C.lin,1.3)+L(cx-3.4,cy,cx+3.4,cy,C.lin,1.3)+L(cx,cy-3.4,cx,cy+3.4,C.lin,1.3);
  const streifen=(x,y,w)=>{ let s=R(x,y,w,24,"#EEF0F2",C.lin,1.3,2)+L(x+3,y+4,x+w-3,y+4,C.weiss,1.5);
    s+=schraube(x+13,y+12)+schraube(x+w-13,y+12)+drehv(x+w*.27,y+12)+drehv(x+w*.73,y+12); [-9,0,9].forEach(d=>{ s+=O(x+w/2+d,y+12,2.6,C.weiss,C.lin,1.1); }); return s; };
  const pol=(cx,cy)=>R(cx-7,cy-7,14,14,C.hell,C.lin,1)+schraube(cx,cy);
  /* Reiheneinbaugerät: te × 18 mm, Höhe 90 */
  const geraet=(x,y,te,o={})=>{ const w=te*18, h=90, k=o.rot?C.rot:C.lin;
    let s=R(x+1,y,w-2,h,C.weiss,k,1.5,3); for(let p=0;p<te;p++){ s+=pol(x+9+p*18,y+12)+pol(x+9+p*18,y+h-12); }
    s+=R(x+4,y+24,w-8,h-48,o.rot?C.rotH:C.hell,o.rot?C.rot:C.fein,1,2);
    if(o.rj) s+=R(x+w/2-6,y+h/2-8,12,12,C.sw,null,0,1)+R(x+w/2-3,y+h/2+4,6,3,C.sw);
    else if(o.kl) { for(let p=0;p<te*2;p++) s+=R(x+5+p*(w-10)/(te*2),y+h/2-7,(w-10)/(te*2)-2,14,C.mittel,C.lin,.8,1); }
    else s+=R(x+w/2-5,y+h/2-17,10,17,o.rot?C.rot:C.sw,null,0,2)+(o.t?T(x+w/2,y+h/2+16,o.t,{s:te>2?13:11,w:800,f:o.rot?C.rot:C.text}):R(x+6,y+h/2+8,w-12,5,C.mittel,null,0,1));
    return s; };
  const klemme=(x,y,w,c,pe)=>R(x,y,w,44,c,C.lin,.9,1)+(pe?R(x+w/2-1.5,y,3,44,C.ge):"")+O(x+w/2,y+9,2.8,C.weiss,C.lin,.9)+O(x+w/2,y+35,2.8,C.weiss,C.lin,.9);
  const plakette=(cx,cy,t)=>R(cx-62,cy-17,124,32,C.weiss,C.lin,1.3,4)+T(cx,cy+6,t,{s:19});
  const lochblech=(x,y,w,h)=>R(x,y,w,h,"url(#zsLoch)",C.lin,1.3,3);
  const apzBox=(x,y,w,h)=>{ let s=lochblech(x,y,w,h)+R(x+18,y+h*.2,w-36,h*.56,C.weiss,C.lin,1.6,8,` stroke-dasharray="9 6"`)
      +T(x+w/2,y+h*.2+30,"APZ",{s:26})+T(x+w/2,y+h*.2+50,"Router Netzbetreiber",{s:12,w:600,f:C.grau});
    const dx=x+w/2-20, dy=y+h*.2+h*.56-46; s+=R(dx,dy,40,34,C.weiss,C.lin,1.3,4)+R(dx+13,dy+10,14,12,C.sw,null,0,1); return s; };
  const KAB=[C.br,C.sw,C.gr,C.bl,C.gn];
  let zn=0, nv=0, nm=0, uess=false;
  const zaehler=(f,x)=>{ const n=f.n||1, aH=fh*300/1050, rH=fh*150/1050, nH=fh*300/1050, zH=fh-aH-rH-nH, ix=x+16, iw=FW-32;
    const zps=Array.from({length:n},(_,p)=>zs.zp&&zs.zp.find(q=>q.feldId===f.id&&(q.pos||0)===p)); let s="";
    /* AAR · Reihe 1: Abgangsklemmen zum Verteiler */
    const r1=fy, rh=aH/2, ky=r1+rh/2-22; s+=schiene(ix,ky+15,iw);
    let kx=ix+6; for(let p=0;p<n;p++){ KAB.forEach((c,k)=>{ s+=klemme(kx+k*12,ky,11,k<3?C.mittel:c,k===4); }); kx+=74; }
    s+=T(ix+iw-4,ky+62,"Abgang",{s:13,w:600,f:C.grau,a:"end"})+streifen(ix-6,r1+rh-12,iw+12);
    /* AAR · Reihe 2: Hauptschalter je Zähler, RJ45, Steuerklemmen */
    const r2=r1+rh, gy=r2+rh/2-45; s+=schiene(ix,gy+38,iw);
    let gx=ix+6; for(let p=0;p<n;p++){ for(let k=0;k<3;k++) s+=L(ix+6+p*74+k*12+5.5,ky+44,gx+9+k*18,gy,KAB[k],3); s+=geraet(gx,gy,3,{t:n>1?`HS ${zn+p+1}`:"HS"}); gx+=58; }
    if(gx+18<=ix+iw){ s+=geraet(gx,gy,1,{rj:1}); gx+=22; }
    if(gx+36<=ix+iw) s+=geraet(gx,gy,2,{kl:1});
    s+=streifen(ix-6,r2+rh-12,iw+12);
    /* RfZ */
    const ry=fy+aH; s+=schiene(ix,ry+rH/2-7,iw)+T(ix+2,ry+28,"RfZ",{s:15,f:C.grau,a:"start"});
    [[ix+44,4,"SMGW"],[ix+44+80,5,"Steuerbox"]].forEach(([bx,te,t])=>{ if(bx+te*18<=ix+iw+2) s+=R(bx,ry+rH/2-40,te*18-4,80,"none",C.grau,1.4,4,` stroke-dasharray="7 5"`)+T(bx+te*9-2,ry+rH/2-22,t,{s:12,w:600,f:C.grau}); });
    s+=streifen(ix-6,ry+rH-12,iw+12);
    /* Zählerplätze (BKE-I) */
    const zy=ry+rH, zw=(iw-(n-1)*10)/n;
    zps.forEach((zz,p)=>{ zn++; const zx=ix+p*(zw+10), an=aktiv&&aktiv===`${f.id}:${p}`, frei=zz&&!zsBelegt(zz), drei=zz&&zz.art==="3pkt";
      s+=R(zx,zy+16,zw,zH-30,C.hell,C.fein,1.2,4);
      if(frei){ s+=R(zx+14,zy+44,zw-28,zH-84,"none",C.grau,1.8,8,` stroke-dasharray="9 7"`)+T(zx+zw/2,zy+zH/2+8,"frei",{s:20,f:C.grau}); }
      else { const mw=Math.min(zw-22,112), mh=(zH-30)*.84, mx=zx+(zw-mw)/2, my=zy+16+(zH-30-mh)/2+4;
        s+=R(mx+mw*.12,my-10,mw*.76,16,C.mittel,C.lin,1.2,3);
        for(let k=0;k<5;k++) s+=R(mx+mw*.18+k*mw*.13,my-6,mw*.06,8,C.lin,null,0,1);
        s+=R(mx,my,mw,mh,an?C.aktH:C.weiss,an?C.akt:C.lin,2,10);
        if(drei){ s+=R(mx+10,my+mh*.12,mw-20,mh*.2,C.hell,C.lin,1.4,3); for(let k=0;k<6;k++) s+=R(mx+16+k*(mw-32)/6,my+mh*.15,(mw-32)/6-3,mh*.14,k===5?C.rot:C.sw,null,0,1);
          s+=O(mx+mw/2,my+mh*.58,Math.min(mw,mh)*.17,C.hell,C.lin,1.4)+L(mx+mw/2-Math.min(mw,mh)*.15,my+mh*.58,mx+mw/2+Math.min(mw,mh)*.15,my+mh*.58,C.rot,2); }
        else { s+=R(mx+9,my+mh*.12,mw-18,mh*.2,"#2E3640",null,0,4)+R(mx+13,my+mh*.12+4,mw-26,mh*.2-8,"#B5DCC0",null,0,2)
            +T(mx+mw/2,my+mh*.12+mh*.1+5,"012345,6",{s:Math.max(10,Math.min(15,(mw-30)/6)),w:700,f:"#1E2B22",ex:` font-family="ui-monospace,monospace"`})
            +T(mx+mw-12,my+mh*.42,"kWh",{s:11,w:600,f:C.grau,a:"end"})+O(mx+mw*.28,my+mh*.52,3.6,C.rot)+O(mx+mw*.66,my+mh*.56,10,C.weiss,C.lin,1.6)+O(mx+mw*.66,my+mh*.56,3.5,C.sw)
            +L(mx+12,my+mh*.74,mx+mw-12,my+mh*.74,C.fein,1.2)+L(mx+12,my+mh*.8,mx+mw*.6,my+mh*.8,C.fein,1.2); }
        s+=T(mx+mw/2,my+mh-10,drei?"3-Punkt":"eHZ",{s:13,w:700,f:C.grau})+R(mx+mw*.3,my+mh-2,mw*.4,9,C.mittel,C.lin,1,2); }
      s+=R(zx+5,zy+21,30,30,an?C.akt:C.post,null,0,5)+T(zx+20,zy+43,zn,{s:20,f:C.weiss}); });
    s+=streifen(ix-6,zy+zH-12,iw+12);
    /* NAR: SLS je Zählerplatz, ÜSS Typ 1 (einmal im Schrank), Sammelschiene, Zuleitung von unten */
    const ny=zy+zH, sy=ny+20, by=ny+nH*.6, bs=13; let sx=ix+4; const pole=[];
    zps.forEach(zz=>{ const a=zz&&zz.sls&&zz.sls!=="keiner"?zz.sls.slice(1)+" A":"SLS"; s+=geraet(sx,sy,3,{t:a,ts:13}); for(let k=0;k<3;k++) pole.push([sx+9+k*18,k]); sx+=58; });
    if(!uess){ uess=true; s+=geraet(sx,sy,2,{rot:1,t:"ÜSS",ts:13}); for(let k=0;k<2;k++) pole.push([sx+9+k*18,k===0?3:4]); sx+=40; }
    s=schiene(ix,sy+38,Math.max(20,sx-ix))+s;
    pole.forEach(([px,k])=>{ s+=L(px,sy+90,px,by+k*bs+5,KAB[k],3); });
    s+=R(ix+2,by-8,12,5*bs+12,C.sw,null,0,2)+R(ix+iw-14,by-8,12,5*bs+12,C.sw,null,0,2);
    for(let k=0;k<5;k++) s+=R(ix+14,by+k*bs,iw-28,9,C.or,C.orK,1,1.5);
    const cx=ix+iw-46; s+=R(cx-11,by+5*bs+4,22,fy+fh-(by+5*bs+4),"#5C6167",null,0,3);
    KAB.forEach((c,k)=>{ s+=L(cx-8+k*4,by+5*bs+6,ix+iw-24-(4-k)*6,by+k*bs+4,c,3); });
    return s; };
  const verteiler=(f,x)=>{ nv++; const apz=zs.apz&&zs.apz.feldId===f.id?zs.apz.lage:"", oben=apz==="oben", aH=apz?fh*300/1050:0, ix=x+16, iw=FW-32;
    const top=fy+(oben?aH:0), hh=fh-aH, r=Math.max(1,Math.min(zsReihenFeld(zs,f,reihen),12)), kH=58, rh=(hh-kH)/r; let s="";
    /* N/PE-Klemmen */
    s+=schiene(ix,top+22,iw); const kw=(iw-8)/16; for(let k=0;k<16;k++) s+=klemme(ix+4+k*kw,top+7,kw-1.5,k<8?C.bl:C.gn,k>=8);
    for(let k=0;k<r;k++){ const ry=top+kH+k*rh; s+=R(ix,ry+4,iw,rh-20,C.weiss,C.fein,1.1,2)+R(ix+8,ry+rh/2-30,iw-16,46,C.hell,C.fein,1,2)+streifen(ix-6,ry+rh-14,iw+12); }
    s+=plakette(x+FW/2,top+kH+rh/2-8,`Verteiler ${nv}`);
    if(apz) s+=apzBox(ix,oben?fy+8:fy+fh-aH+6,iw,aH-14);
    return s; };
  const media=(f,x)=>{ nm++; const apz=zs.apz&&zs.apz.feldId===f.id?zs.apz.lage:"", oben=apz==="oben", aH=apz?fh*300/1050:0, ix=x+16, iw=FW-32, t0=fy+(oben?aH:0), hh=fh-aH;
    let s=lochblech(ix,t0+8,iw,hh-16)+plakette(x+FW/2,t0+38,`Media ${nm}`);
    const py=t0+72; s+=R(ix+8,py,iw-16,34,C.weiss,C.lin,1.4,3); for(let k=0;k<10;k++) s+=R(ix+16+k*(iw-32)/10,py+10,(iw-32)/10-4,13,C.sw,null,0,1.5);
    const ry=py+70, rhh=Math.min(104,hh*.18); s+=L(ix+34,ry,ix+28,ry-26,C.lin,4)+L(ix+iw-34,ry,ix+iw-28,ry-26,C.lin,4)+R(ix+14,ry,iw-28,rhh,C.weiss,C.lin,1.6,12);
    [0,1,2,3].forEach(j=>{ s+=O(ix+32+j*13,ry+rhh-16,3.4,j<3?C.gn:C.hell,j<3?null:C.lin); }); s+=T(x+FW/2,ry+rhh/2+2,"Router",{s:15,w:600,f:C.grau});
    const wy=ry+rhh+28; s+=R(ix+8,wy,iw-16,32,C.weiss,C.lin,1.4,3); for(let k=0;k<8;k++) s+=R(ix+16+k*(iw-32)/8,wy+9,(iw-32)/8-5,13,C.sw,null,0,1.5);
    const sty=t0+hh-74; s+=R(ix+8,sty,iw-16,44,C.weiss,C.lin,1.5,8); [0,1,2].forEach(j=>{ const cx=ix+iw/2-56+j*56; s+=O(cx,sty+22,14,C.hell,C.lin,1.3)+O(cx-5,sty+22,2.2,C.sw)+O(cx+5,sty+22,2.2,C.sw); });
    if(apz) s+=apzBox(ix,oben?fy+8:fy+fh-aH+6,iw,aH-14);
    return s; };
  let inn="", posts="";
  F.forEach((f,i)=>{ const x=x0+ZSZ.WAND+i*FW;
    inn+=R(x,fy,FW,fh,C.weiss);
    inn+=f.typ==="z"?zaehler(f,x):f.typ==="v"?verteiler(f,x):f.typ==="m"?media(f,x):T(x+FW/2,fy+fh/2,ZS_TYP_KURZ[f.typ]||"",{s:22,f:C.grau});
    const gw=i===selFeld; if(gw) inn+=R(x+FW/2-76,y0+g.H+18,152,40,"#E3E5E8",null,0,20);
    inn+=T(x+FW/2,y0+g.H+46,ZS_TYP_KURZ[f.typ]||"",{s:24,w:gw?800:600,f:gw?C.text:C.grau}); });
  for(let i=0;i<=F.length;i++){ const b=x0+ZSZ.WAND+i*FW; posts+=R(b-6,fy,12,fh,C.post)+L(b,fy+10,b,fy+fh-10,"#C9CDD2",3,` stroke-dasharray="4 21" stroke-linecap="butt"`); }
  const masse=T(x0,y0-20,`Breite ${g.B} mm  →`,{s:24,w:600,f:C.grau,a:"start"})
    +T(0,0,`Höhe ${g.H} mm`,{s:24,w:600,f:C.grau,a:"end",ex:` transform="translate(${x0-22} ${y0}) rotate(-90)"`});
  return `<svg class="zs-svg zs-z" viewBox="0 0 ${g.vw} ${g.vh}" style="--n:${g.n};max-width:${g.n*124}px" font-family="Manrope,system-ui,sans-serif" aria-hidden="true">`
    +`<defs><pattern id="zsLoch" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="#F6F7F8"/><rect x="5" y="4" width="4" height="6" rx="1" fill="#B9BEC4"/></pattern></defs>`
    +masse+R(x0,y0,g.B,g.H,"#E9EBEE",C.rahmen,8,10)+R(x0+8,y0+8,g.B-16,g.H-16,"none","#C9CDD2",2,6)+inn+posts
    +R(x0+ZSZ.WAND-6,fy,g.n*FW+12,fh,"none",C.rahmen,2)+`</svg>`; }
