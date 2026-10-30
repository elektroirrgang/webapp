/* Technische Zeichnung des Zählerschranks (Maßstab 1 Einheit = 1 mm).
   Felder 250 mm breit, Schrankwand 25 mm – Breite = Felder × 250 + 50.
   Zählerfeld von oben: AAR · RfZ · Zähler · NAR. APZ im Verteiler- oder Multimediafeld. */
const ZSZ={FW:250,WAND:25,ML:64,MT:58,MR:16,MB:78};
const ZSZ_F={rahmen:"#3C4046",feld:"#F6F7F8",kante:"#A3A9AF",schiene:"#C3C7CC",streifen:"#E4E6E9",geraet:"#F1F2F4",geraetK:"#6F757B",
  text:"#2E3237",grau:"#6B7178",br:"#8B5A2B",sw:"#26282B",gr:"#8E9399",bl:"#2F6FD6",gn:"#3DBA6B",ge:"#E8C51A",or:"#F08A24",rot:"#E2231A",akt:"#C8102E"};
function zsHoeheMm(zs){ return +zs.hoehe===1400?1400:1100; }
function zsGeo(zs){ const n=zs.felder.length, H=zsHoeheMm(zs), B=n*ZSZ.FW+2*ZSZ.WAND, vw=ZSZ.ML+B+ZSZ.MR, vh=ZSZ.MT+H+ZSZ.MB;
  return {n,H,B,vw,vh,links:(ZSZ.ML+ZSZ.WAND)/vw*100,breite:n*ZSZ.FW/vw*100,oben:ZSZ.MT/vh*100,hoehe:(H+ZSZ.MB)/vh*100}; }
function zsZeichnung(zs,reihen,aktiv,selFeld){
  const C=ZSZ_F, g=zsGeo(zs), F=zs.felder, FW=ZSZ.FW, x0=ZSZ.ML, y0=ZSZ.MT, fy=y0+ZSZ.WAND, fh=g.H-2*ZSZ.WAND;
  const R=(x,y,w,h,f,s,sw,rx,ex)=>`<rect x="${(+x).toFixed(1)}" y="${(+y).toFixed(1)}" width="${Math.max(0,w).toFixed(1)}" height="${Math.max(0,h).toFixed(1)}"${rx?` rx="${rx}"`:""} fill="${f||"none"}"${s?` stroke="${s}" stroke-width="${sw||1.5}"`:""}${ex||""}/>`;
  const T=(x,y,t,o={})=>`<text x="${(+x).toFixed(1)}" y="${(+y).toFixed(1)}" font-size="${o.s||24}" font-weight="${o.w||700}" fill="${o.f||C.text}" text-anchor="${o.a||"middle"}"${o.ex||""}>${t}</text>`;
  const L=(x1,y1,x2,y2,s,sw,ex)=>`<path d="M${(+x1).toFixed(1)} ${(+y1).toFixed(1)}L${(+x2).toFixed(1)} ${(+y2).toFixed(1)}" stroke="${s}" stroke-width="${sw||2}" fill="none"${ex||""}/>`;
  /* Hutschiene mit Abdeckstreifen darunter */
  const schiene=(x,y,w)=>R(x,y,w,12,C.schiene,C.kante,1)+L(x,y+6,x+w,y+6,"#AEB3B9",1.5);
  const streifen=(x,y,w)=>{ let s=R(x,y,w,20,C.streifen,C.kante,1.2,2); [16,w/2-14,w/2,w/2+14,w-16].forEach(d=>{ s+=`<circle cx="${(x+d).toFixed(1)}" cy="${(y+10).toFixed(1)}" r="3.4" fill="none" stroke="${C.grau}" stroke-width="1.4"/>`; }); return s; };
  /* Reiheneinbaugerät: te Teilungseinheiten (18 mm), Höhe 88 */
  const geraet=(x,y,te,o={})=>{ const w=te*18-2, h=88; let s=R(x,y,w,h,o.f||C.geraet,o.k||C.geraetK,1.5,3)+R(x+2,y+28,w-4,32,o.b||"#E3E5E8");
    for(let p=0;p<te;p++){ const cx=x+9+p*18; s+=`<circle cx="${cx}" cy="${y+12}" r="4" fill="#fff" stroke="${C.grau}" stroke-width="1.2"/><circle cx="${cx}" cy="${y+h-12}" r="4" fill="#fff" stroke="${C.grau}" stroke-width="1.2"/>`; }
    s+=R(x+w/2-6,y+34,12,20,o.h||"#3A3F45",null,0,2);
    if(o.t) s+=T(x+w/2,y+h+24,o.t,{s:o.ts||20,f:C.text});
    return s; };
  const seiten=(x)=>{ let s=""; [x+3,x+FW-13].forEach(sx=>{ s+=R(sx,fy+2,10,fh-4,"#D3D6DA")+L(sx+5,fy+8,sx+5,fy+fh-8,"#8D9298",4,` stroke-dasharray="5 20"`); }); return s; };
  const lochblech=(x,y,w,h)=>R(x,y,w,h,"url(#zsLoch)",C.kante,1.2,4);
  let zn=0, nv=0, nm=0, uess=false;
  const zaehler=(f,x)=>{ const n=f.n||1, aH=fh*.27, rH=fh*.13, nH=fh*.26, zH=fh-aH-rH-nH, ix=x+18, iw=FW-36;
    const zps=Array.from({length:n},(_,p)=>zs.zp&&zs.zp.find(q=>q.feldId===f.id&&(q.pos||0)===p));
    let s="";
    /* AAR: Hauptleitungsabzweigklemme, Zuleitung von oben, Hauptschalter, RJ45 */
    const ky=fy+aH*.34, farben=[C.br,C.sw,C.gr,C.bl,C.gn];
    farben.forEach((c,k)=>{ const kx=ix+4+k*17; s+=L(kx+8,fy+4,kx+8,ky,c,5)+(k===4?L(kx+8,fy+4,kx+8,ky,C.ge,5,` stroke-dasharray="9 9"`):"")+R(kx,ky,15,70,"#EDEEF0",C.geraetK,1.2,2)+R(kx+3,ky+30,9,14,c); });
    s+=schiene(ix,ky+31,iw);
    let gx=ix+92; for(let p=0;p<n;p++){ s+=geraet(gx,ky-9,3,{t:n>1?"HS "+(zn+p+1):"HS",ts:16}); gx+=56; }
    if(gx+18<ix+iw) s+=geraet(gx,ky-9,1,{t:"RJ45",ts:14,h:"#2F6FD6"});
    s+=streifen(ix-8,fy+aH-20,iw+16);
    /* RfZ: Raum für Zusatzanwendungen – Gateway, Steuerbox */
    const ry=fy+aH;
    s+=R(ix,ry+10,iw,rH-28,"#FBFBFC",C.kante,1.4,6,` stroke-dasharray="8 6"`)+T(x+FW/2,ry+rH/2+2,"RfZ",{s:22,f:C.grau})+T(x+FW/2,ry+rH/2+24,"Gateway · Steuerbox",{s:14,w:600,f:C.grau});
    s+=streifen(ix-8,ry+rH-16,iw+16);
    /* Zähler */
    const zy=ry+rH, zw=(iw-(n-1)*10)/n;
    zps.forEach((zz,p)=>{ zn++; const zx=ix+p*(zw+10), an=aktiv&&aktiv===`${f.id}:${p}`, frei=zz&&!zsBelegt(zz), drei=zz&&zz.art==="3pkt";
      s+=R(zx,zy+8,zw,zH-16,"#ECEEF0",C.kante,1.4,4);
      if(frei){ s+=R(zx+12,zy+30,zw-24,zH-70,"none",C.grau,2,8,` stroke-dasharray="10 8"`)+T(zx+zw/2,zy+zH/2+8,"frei",{s:22,f:C.grau}); }
      else { const mw=Math.min(zw-24,150), mh=zH*.7, mx=zx+(zw-mw)/2, my=zy+zH*.16;
        s+=R(mx,my,mw,mh,an?"#FBE3E6":"#FAFAF8",an?C.akt:"#50555B",2.4,8);
        if(drei){ s+=`<circle cx="${(mx+mw/2).toFixed(1)}" cy="${(my+mh*.38).toFixed(1)}" r="${(Math.min(mw,mh)*.24).toFixed(1)}" fill="#E9EBEE" stroke="#50555B" stroke-width="2"/>`; }
        else { s+=R(mx+mw*.14,my+mh*.16,mw*.72,mh*.2,"#39424E",null,0,3)+R(mx+mw*.2,my+mh*.21,mw*.6,mh*.1,"#9FD3B0",null,0,2)
          +`<circle cx="${(mx+mw*.3).toFixed(1)}" cy="${(my+mh*.58).toFixed(1)}" r="5" fill="${C.rot}"/><circle cx="${(mx+mw*.62).toFixed(1)}" cy="${(my+mh*.6).toFixed(1)}" r="13" fill="none" stroke="#50555B" stroke-width="2"/>`; }
        s+=T(mx+mw/2,my+mh-14,drei?"3-Pkt":"eHZ",{s:16,w:700,f:C.grau}); }
      s+=R(zx+6,zy+14,36,36,an?C.akt:"#5F656C",null,0,6)+T(zx+24,zy+40,zn,{s:24,f:"#fff"}); });
    s+=streifen(ix-8,zy+zH-14,iw+16);
    /* NAR: SLS je Zählerplatz, Überspannungsschutz Typ 1 (einmal im Schrank), Sammelschiene */
    const ny=zy+zH, sy=ny+nH*.3;
    let sx=ix; zps.forEach(zz=>{ const a=zz&&zz.sls&&zz.sls!=="keiner"?zz.sls.slice(1)+"A":"SLS"; s+=geraet(sx,sy-9,3,{t:a,ts:16,h:"#5F656C"}); sx+=56; });
    if(!uess){ uess=true; s+=geraet(sx,sy-9,2,{f:"#F7D7D5",k:C.rot,b:"#EF8F8A",h:C.rot,t:"ÜSS",ts:15}); sx+=38; }
    s=schiene(ix,sy+31,sx-ix-4)+s;
    const bx=Math.max(sx+10,ix+iw*.55), bw=ix+iw-bx; if(bw>30){ const b0=ny+30, bs=(nH-80)/4;
      s+=R(bx,b0-12,10,4*bs+33,"#D7DADE",C.kante,1,2)+R(bx+bw-10,b0-12,10,4*bs+33,"#D7DADE",C.kante,1,2);
      ["L1","L2","L3","N","PE"].forEach((t,k)=>{ const by=b0+k*bs; s+=R(bx+4,by,bw-8,10,k===3?C.bl:k===4?C.gn:C.or,null,0,2); }); }
    return s; };
  const verteiler=(f,x)=>{ nv++; const apz=zs.apz&&zs.apz.feldId===f.id?zs.apz.lage:"", oben=apz==="oben", aH=apz?fh*.29:0, ix=x+18, iw=FW-36;
    const top=fy+(oben?aH:0), hh=fh-aH, r=Math.max(1,Math.min(zsReihenFeld(zs,f,reihen),12)), kH=44, rh=(hh-kH)/r;
    let s="";
    /* N/PE-Klemmenleiste oben im Feld */
    s+=R(ix,top+10,iw,26,"#E7E9EC",C.kante,1,3); for(let k=0;k<12;k++){ s+=R(ix+6+k*(iw-12)/12,top+13,(iw-12)/12-2,20,k<6?C.bl:C.gn,null,0,2); }
    for(let k=0;k<r;k++){ const ry=top+kH+k*rh; s+=schiene(ix,ry+rh/2-6,iw)+streifen(ix-8,ry+rh-20,iw+16); }
    s+=R(x+FW/2-70,top+kH+rh/2-48,140,34,"#fff",null,0,8)+T(x+FW/2,top+kH+rh/2-23,`Verteiler ${nv}`,{s:22});
    if(apz){ const ay=oben?fy:fy+fh-aH; s+=lochblech(ix,ay+10,iw,aH-20)+R(ix+30,ay+aH*.32,iw-60,aH*.42,"#fff","#50555B",2,10,` stroke-dasharray="10 7"`)+T(x+FW/2,ay+aH*.32+aH*.21+4,"APZ",{s:28})+T(x+FW/2,ay+aH*.32+aH*.21+26,"Router Netzbetreiber",{s:13,w:600,f:C.grau}); }
    return s; };
  const media=(f,x)=>{ nm++; const apz=zs.apz&&zs.apz.feldId===f.id?zs.apz.lage:"", oben=apz==="oben", aH=apz?fh*.29:0, ix=x+18, iw=FW-36, t0=fy+(oben?aH:0), hh=fh-aH;
    let s=lochblech(ix,t0+10,iw,hh-20);
    s+=R(x+FW/2-62,t0+24,124,32,"#fff",null,0,8)+T(x+FW/2,t0+47,`Media ${nm}`,{s:20});
    const py=t0+76; s+=R(ix+10,py,iw-20,34,"#E8EAED","#50555B",1.6,3); for(let k=0;k<8;k++) s+=R(ix+18+k*(iw-36)/8,py+9,(iw-36)/8-5,16,"#3A3F45",null,0,2);
    const ry=py+66, rhh=Math.min(110,hh*.2); s+=L(ix+40,ry,ix+40,ry-22,"#50555B",4)+L(ix+iw-40,ry,ix+iw-40,ry-22,"#50555B",4)+R(ix+18,ry,iw-36,rhh,"#F3F4F6","#50555B",1.8,10);
    [0,1,2].forEach(j=>{ s+=`<circle cx="${ix+40+j*16}" cy="${(ry+rhh-18).toFixed(1)}" r="4" fill="${C.gn}"/>`; }); s+=T(x+FW/2,ry+rhh/2+6,"Router",{s:16,w:600,f:C.grau});
    const wy=ry+rhh+26; s+=R(ix+10,wy,iw-20,30,"#E8EAED","#50555B",1.6,3); for(let k=0;k<6;k++) s+=R(ix+20+k*(iw-40)/6,wy+8,(iw-40)/6-6,14,"#3A3F45",null,0,2);
    const sty=t0+hh-74; s+=R(ix+10,sty,iw-20,42,"#E8EAED","#50555B",1.6,8); [0,1,2].forEach(j=>{ s+=`<circle cx="${(ix+iw/2-50+j*50).toFixed(1)}" cy="${(sty+21).toFixed(1)}" r="12" fill="#fff" stroke="#50555B" stroke-width="1.6"/>`; });
    if(apz){ const ay=oben?fy:fy+fh-aH; s+=R(ix,ay+10,iw,aH-20,"#F3F4F6",C.kante,1.2,4)+R(ix+30,ay+aH*.32,iw-60,aH*.42,"#fff","#50555B",2,10,` stroke-dasharray="10 7"`)+T(x+FW/2,ay+aH*.32+aH*.21+4,"APZ",{s:28})+T(x+FW/2,ay+aH*.32+aH*.21+26,"Router Netzbetreiber",{s:13,w:600,f:C.grau}); }
    return s; };
  let inn="";
  F.forEach((f,i)=>{ const x=x0+ZSZ.WAND+i*FW;
    inn+=R(x+1,fy,FW-2,fh,C.feld,C.kante,2)+seiten(x);
    inn+=f.typ==="z"?zaehler(f,x):f.typ==="v"?verteiler(f,x):f.typ==="m"?media(f,x):T(x+FW/2,fy+fh/2,ZS_TYP_KURZ[f.typ]||"",{s:22,f:C.grau});
    const gw=i===selFeld, lt=ZS_TYP_KURZ[f.typ]||"";
    if(gw) inn+=R(x+FW/2-76,y0+g.H+18,152,40,"#E3E5E8",null,0,20);
    inn+=T(x+FW/2,y0+g.H+46,lt,{s:24,w:gw?800:600,f:gw?C.text:C.grau}); });
  const masse=T(x0,y0-20,`Breite ${g.B} mm  →`,{s:24,w:600,f:C.grau,a:"start"})
    +T(0,0,`Höhe ${g.H} mm`,{s:24,w:600,f:C.grau,a:"end",ex:` transform="translate(${x0-22} ${y0}) rotate(-90)"`});
  return `<svg class="zs-svg zs-z" viewBox="0 0 ${g.vw} ${g.vh}" style="--n:${g.n};max-width:${g.n*124}px" font-family="Manrope,system-ui,sans-serif" aria-hidden="true">`
    +`<defs><pattern id="zsLoch" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#F3F4F6"/><circle cx="8" cy="8" r="2.2" fill="#B9BEC4"/></pattern></defs>`
    +masse+R(x0,y0,g.B,g.H,"#fff",C.rahmen,6,8)+inn+`</svg>`; }
