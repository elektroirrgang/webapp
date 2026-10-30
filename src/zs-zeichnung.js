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

  /* Zählerfeld wie im echten Schrank (Maße in mm ab Feldoberkante, auf 1050 mm Feldhöhe bezogen):
     Zählernummer · N/PE-Zuleitung · Abdeckstreifen · Hauptleitungsabzweigklemme · BKE-I-Anschlussblöcke ·
     Zählerplatz (BKE-I ohne Zähler – die Zähler sehen je Netzbetreiber anders aus) · NAR mit SLS, ÜSS und Sammelschiene */
  const zaehler=(f,x)=>{ const n=f.n||1, Y=mm=>fy+mm*fh/1050, X=mm=>x+mm;
    const zps=Array.from({length:n},(_,p)=>zs.zp&&zs.zp.find(q=>q.feldId===f.id&&(q.pos||0)===p)); let s="";
    const halb=[[18,112],[135,233]];
    /* oberer Abschluss */
    s+=R(X(14),Y(2),222,16,"#FCFCFC",C.lin,.8)+[30,60,90,160,190,220].map(d=>O(X(d),Y(10),2,C.weiss,"#6E6E6E",.8)).join("");
    /* Zuleitung N und PE senkrecht, graue Steuerleitung */
    for(let p=0;p<Math.max(1,n);p++){ const bx=p?125:0; s+=L(X(bx+77),Y(18),X(bx+77),Y(292),C.bl,3.4)+L(X(bx+84),Y(18),X(bx+84),Y(292),C.gn,3.4)+L(X(bx+84),Y(18),X(bx+84),Y(292),C.ge,3.4,` stroke-dasharray="8 8"`); }
    s+=L(X(126),Y(30),X(126),Y(290),"#9A9A9A",2,` stroke-dasharray="14 4"`);
    s+=streifen(x,Y(88));
    /* Hauptleitungsabzweigklemme je Zählerplatz, Leitungen nach unten in den BKE-Block */
    for(let p=0;p<n;p++){ const hx=X(27+p*125), hy=Y(198);
      [0,1,2].forEach(k=>{ s+=`<path d="M${k1(hx+8+k*14)} ${k1(hy+42)}C${k1(hx+8+k*14)} ${k1(hy+62)} ${k1(hx-6+k*12)} ${k1(Y(272))} ${k1(hx-6+k*12)} ${k1(Y(300))}" stroke="${C.br}" stroke-width="5" fill="none"/>`; }); }
    s+=streifen(x,Y(208));
    for(let p=0;p<n;p++){ const hx=X(27+p*125), hy=Y(198); s+=R(hx,hy,56,44,"#2E2E2E",null,0,3); for(let r=0;r<3;r++) for(let c=0;c<4;c++) s+=R(hx+4+c*13,hy+4+r*13,10,10,C.weiss,null,0,2.5); }
    /* BKE-I-Anschlussblöcke oben und darunter: Zählerplatz-Klemmen links, rechts Steueranschlüsse oder zweiter Platz */
    const block=(y,hh)=>{ let t=""; halb.forEach(([a,b],p)=>{ const zp=p<n; t+=R(X(a),y,b-a,hh,C.weiss,C.lin,1,2);
        if(zp){ [[0,C.br],[1,C.br],[2,C.bl],[3,C.gn]].forEach(([k,c])=>{ const cx=X(a+12+k*18), cy=y+hh*.55; t+=R(cx-6,cy-9,12,18,C.weiss,"#666",.9,2)+L(cx,y+2,cx,cy-9,c,4)+(c===C.gn?L(cx,y+2,cx,cy-9,C.ge,4,` stroke-dasharray="4 4"`):""); });
          t+=R(X(b-26),y+hh*.25,18,hh*.5,C.weiss,"#666",.9,2); }
        else { [[0,0],[1,0],[0,1],[1,1]].forEach(([c,r])=>{ t+=R(X(a+28+c*30),y+hh*.2+r*hh*.38,22,hh*.26,C.weiss,"#555",.9,3); }); t+=R(X(a+8),y+hh*.35,12,hh*.3,C.weiss,"#666",.9,2); } }); return t; };
    s+=block(Y(292),Y(358)-Y(292));
    s+=R(X(10),Y(358),230,Y(388)-Y(358),C.weiss,C.lin,1,2)+L(X(12),Y(366),X(238),Y(366),"#DADADA",1)+L(X(124),Y(358),X(124),Y(388),C.lin,.8);
    s+=block(Y(396),Y(450)-Y(396));
    /* Zählerplätze */
    halb.forEach(([a,b],p)=>{ const w=b-a, ya=Y(455), yb=Y(745);
      if(p>=n){ s+=R(X(a+4),ya,w-8,yb-ya,C.weiss,C.lin,1,6)+R(X(a+10),ya+8,w-20,yb-ya-16,"none","#D0D0D0",1,4); return; }
      const zz=zps[p], an=aktiv&&aktiv===`${f.id}:${p}`, frei=zz&&!zsBelegt(zz), ym=Y(650);
      s+=R(X(a),ya,w,yb-ya,an?C.aktH:C.weiss,an?C.akt:C.lin,an?1.8:1,2);
      /* BKE-I-Adapter */
      s+=R(X(a+6),ya+6,w-12,ym-ya-10,an?C.aktH:C.weiss,"#666",1,2)+R(X(a+8),ya+10,30,18,C.weiss,"#666",.9,1)+O(X(a+44),ya+19,3,C.weiss,"#666",.9);
      [0,1,2,3].forEach(k=>{ s+=R(X(a+18+k*18),ya+40,9,26,C.weiss,"#666",.9,4); });
      s+=`<path d="M${k1(X(a+26))} ${k1(ya+74)}c10 18 -10 30 0 48s-10 30 0 44M${k1(X(a+34))} ${k1(ya+74)}c-10 18 10 30 0 48s10 30 0 44" stroke="#777" stroke-width="1.2" fill="none"/>`;
      s+=R(X(a+56),ya+82,12,22,C.weiss,"#666",.9,5)+R(X(a+72),ya+82,12,22,C.weiss,"#666",.9,5)+R(X(a+64),ya+120,10,16,C.weiss,"#666",.9,4)+R(X(a+40),ym-30,10,12,C.weiss,"#666",.9,2);
      /* Abdeckung unten mit Zweck */
      s+=R(X(a+6),ym,w-12,yb-ym-6,C.weiss,"#666",1,2);
      const tx=frei?"frei":zz?(zz.bez||zsTxt(ZS_ZWECK,zz.zweck)):""; if(tx) s+=T(X(a+w/2),ym+(yb-ym)/2+5,esc(tx).slice(0,16),{s:12,w:600,f:frei?C.grau:C.text}); });
    s+=L(X(10),Y(748),X(240),Y(748),C.lin,1);
    /* NAR: Tragholme, Sammelschiene, SLS je Zählerplatz, ÜSS einmal im Schrank, PE-Leiter */
    s+=R(X(2),Y(752),18,Y(1046)-Y(752),"#2E2E2E",null,0,2)+R(X(222),Y(752),18,Y(1046)-Y(752),"#2E2E2E",null,0,2);
    [800,842,884,926,968].forEach(m=>{ s+=R(X(18),Y(m),206,Y(m+12)-Y(m),C.or,C.orK,.8,1.5); });
    const sw=n>1?76:96; let sx=4; const sl=[];
    zps.forEach(zz=>{ sl.push([sx,zz]); sx+=sw+4; });
    const ue=!uess; if(ue) uess=true;
    const pe=ue?sx+52:sx+14; s+=L(X(pe),Y(750),X(pe),Y(1044),C.gn,3.4)+L(X(pe),Y(750),X(pe),Y(1044),C.ge,3.4,` stroke-dasharray="8 8"`);
    sl.forEach(([ax,zz])=>{ const a=X(ax), w=sw, y1=Y(795), y2=Y(968);
      [0,1,2].forEach(k=>{ const cx=a+w*(.2+k*.3); s+=L(cx,Y(750),cx,y1+4,[C.sw,C.sw,C.bl][k],4); });
      s+=R(a,y1,w,y2-y1,"#E9EBEE","#666",1,4);
      [0,1,2].forEach(k=>{ const cx=a+w*(.2+k*.3); s+=R(cx-w*.11,y1+3,w*.22,26,"#2F3E55",null,0,3)+R(cx-w*.07,y1+8,w*.14,10,"#4E6A8E",null,0,2); });
      const amp=zz&&zz.sls&&zz.sls!=="keiner"?zz.sls.slice(1)+"A":"";
      if(amp) s+=T(a+w/2,y1+62,amp,{s:n>1?24:28,w:800,f:"#111"});
      s+=R(a+2,y1+72,w-4,34,"#BFD3E6","#7F99B3",.8,2); [0,1,2].forEach(k=>{ const cx=a+w*(.2+k*.3); s+=R(cx-6,y1+78,12,22,"#5B6B7D",null,0,3); });
      s+=T(a+w/2,y2-16,"SLS",{s:n>1?20:24,w:800,f:"#111"}); });
    if(ue){ const a=X(sx), y1=Y(782), y2=Y(1000); s+=R(a,y1,46,y2-y1,C.rot,"#A8160F",1,3)+R(a+6,y1+8,34,y2-y1-16,"#EF3A2F",null,0,2)+R(a+8,y1+(y2-y1)*.36,30,28,C.weiss,"#A8160F",.8,2)+R(a+12,y1+(y2-y1)*.36+6,8,8,"#8BCB4A")+T(a+23,y2-18,"ÜSS",{s:12,w:800,f:C.weiss}); }
    /* Zählernummer groß oben links */
    for(let p=0;p<n;p++){ const nr=zn+p+1, an=aktiv&&aktiv===`${f.id}:${p}`, bx=X(6+p*125); s+=R(bx,Y(8),80,Y(84)-Y(8),an?C.akt:"#A3A3A3",null,0,10)+T(bx+40,Y(8)+(Y(84)-Y(8))/2+13,nr,{s:36,w:500,f:an?C.weiss:"#222"}); }
    zn+=n;
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
