/* Technische Zeichnung des Zählerschranks – Maßstab 1 Einheit = 1 mm, Felder 250 mm, Breite = Felder × 250 + 50.
   Aufbau wie ein realer Zählerschrank (Hager-Raster): Zählerfeld mit Hauptleitungsabzweigklemme, BKE-I-Anschlussraum,
   Zählerplatz und NAR mit SLS, ÜSS und Sammelschiene · Verteilerfeld mit N/PE-Klemmleisten und Abdeckstreifen ·
   APZ-Einsatz · Multimediafeld mit Patchfeld und Lochblechen. Positionen in mm ab Feldoberkante, bezogen auf 1050 mm Feldhöhe. */
const ZSZ={FW:250,WAND:25,ML:64,MT:58,MR:16};
const ZSZ_F={lin:"#8C8C8C",fein:"#C4C4C4",feld:"#F2F2F2",weiss:"#FFFFFF",hell:"#F8F8F8",dunkel:"#3A3C40",text:"#262626",grau:"#7A7A7A",
  br:"#8B5A2B",sw:"#2E2E2E",gr:"#8E8E8E",bl:"#1E9BE6",gn:"#86CF3A",ge:"#E2C41C",or:"#F39020",orK:"#C06A12",rot:"#E3231B",akt:"#C8102E",aktH:"#FCE8EB"};
const ZSZ_KURZ={haushalt:"HA",wp:"WP",wallbox:"EM",pv:"PV",allgemein:"ALG",gewerbe:"GEW",frei:"RES"};
function zsHoeheMm(zs){ return +zs.hoehe===1400?1400:1100; }
function zsGeo(zs,ed){ const n=zs.felder.length, H=zsHoeheMm(zs), MB=ed===false?16:78, B=n*ZSZ.FW+2*ZSZ.WAND, vw=ZSZ.ML+B+ZSZ.MR, vh=ZSZ.MT+H+MB;
  return {n,H,B,vw,vh,MB,links:(ZSZ.ML+ZSZ.WAND)/vw*100,breite:n*ZSZ.FW/vw*100,oben:ZSZ.MT/vh*100,hoehe:(H+MB)/vh*100}; }
function zsZeichnung(zs,reihen,aktiv,selFeld){
  const ed=selFeld!=null, C=ZSZ_F, g=zsGeo(zs,ed), F=zs.felder, FW=ZSZ.FW, x0=ZSZ.ML, y0=ZSZ.MT, fy=y0+ZSZ.WAND, fh=g.H-2*ZSZ.WAND, k1=v=>(+v).toFixed(1);
  const R=(x,y,w,h,f,s,sw,rx,ex)=>`<rect x="${k1(x)}" y="${k1(y)}" width="${k1(Math.max(0,w))}" height="${k1(Math.max(0,h))}"${rx?` rx="${rx}"`:""} fill="${f||"none"}"${s?` stroke="${s}" stroke-width="${sw||1}"`:""}${ex||""}/>`;
  const T=(x,y,t,o={})=>`<text x="${k1(x)}" y="${k1(y)}" font-size="${o.s||22}" font-weight="${o.w||600}" fill="${o.f||C.text}" text-anchor="${o.a||"middle"}"${o.ex||""}>${t}</text>`;
  const L=(x1,y1,x2,y2,s,sw,ex)=>`<path d="M${k1(x1)} ${k1(y1)}L${k1(x2)} ${k1(y2)}" stroke="${s}" stroke-width="${sw||2}" fill="none"${ex||""}/>`;
  const P=(d,s,sw,f)=>`<path d="${d}" stroke="${s}" stroke-width="${sw||1}" fill="${f||"none"}"/>`;
  const O=(cx,cy,r,f,s,sw)=>`<circle cx="${k1(cx)}" cy="${k1(cy)}" r="${r}" fill="${f||"none"}"${s?` stroke="${s}" stroke-width="${sw||1}"`:""}/>`;
  const pe=(x1,y1,x2,y2,w)=>L(x1,y1,x2,y2,C.gn,w||3.4)+L(x1,y1,x2,y2,C.ge,w||3.4,` stroke-dasharray="7 7"`);

  /* ---------- Grundaufbau eines Feldes ---------- */
  const feldGrund=x=>R(x,fy,FW,fh,C.feld,C.lin,1)+R(x+1,fy+fh-170,FW-2,169,"url(#zsSchatten)");
  const holm=hx=>R(hx,fy,10,fh,C.hell,"#9A9A9A",.7)+L(hx+3.5,fy+4,hx+3.5,fy+fh-4,"#A0A0A0",2.2,` stroke-dasharray="3 5"`)+L(hx+7,fy+8,hx+7,fy+fh-4,"#B8B8B8",1.4,` stroke-dasharray="2 8"`);
  const winkel=(wx,wy)=>R(wx,wy,15,15,C.dunkel,null,0,2)+O(wx+7.5,wy+7.5,2.6,"#77797D");
  const holme=(x,ohneWinkel)=>holm(x+2)+holm(x+FW-12)+(ohneWinkel?"":winkel(x+1,fy+1)+winkel(x+FW-16,fy+1)+winkel(x+1,fy+fh-16)+winkel(x+FW-16,fy+fh-16));
  /* Abdeckstreifen über die ganze Feldbreite */
  const vt=(cx,cy)=>{ const d=3.4; return P(`M${k1(cx-d)} ${k1(cy-d)}l${2*d} ${2*d}M${k1(cx+d)} ${k1(cy-d)}l${-2*d} ${2*d}`,"#6A6A6A",1)+R(cx-2,cy-2,4,4,C.weiss,"#6A6A6A",.8)+O(cx-d,cy-d,1.2,"#6A6A6A")+O(cx+d,cy-d,1.2,"#6A6A6A")+O(cx-d,cy+d,1.2,"#6A6A6A")+O(cx+d,cy+d,1.2,"#6A6A6A"); };
  const kr=(cx,cy,r)=>O(cx,cy,r||2,C.weiss,"#6A6A6A",.8);
  const streifen=(x,y)=>{ const w=FW, m=y+12; let s=R(x,y,w,24,"#FBFBFB",C.lin,.9)+L(x+1,y+3.5,x+w-1,y+3.5,"#D6D6D6",1)+L(x+1,y+21,x+w-1,y+21,"#E4E4E4",1);
    s+=O(x+7,m,2.2,"#4A4A4A")+O(x+w-7,m,2.2,"#4A4A4A")+kr(x+16,m+5,1.6)+kr(x+23,m)+kr(x+29,m)+kr(x+35,m)+O(x+41,m,1.4,"#6A6A6A");
    s+=vt(x+w*.29,m)+kr(x+w*.41,m+5,1.6)+vt(x+w*.45,m)+kr(x+w*.5-4,m)+kr(x+w*.5+4,m)+vt(x+w*.55,m)+vt(x+w*.71,m);
    s+=O(x+w-41,m,1.4,"#6A6A6A")+kr(x+w-35,m)+kr(x+w-29,m)+kr(x+w-23,m); return s; };
  /* N/PE-Klemmleiste mit Haltern an beiden Holmen */
  const klemmleiste=(x,y)=>{ const a=x+22, b=x+FW-22, w=b-a; let s=R(x+1,y-6,21,36,C.dunkel,null,0,3)+R(x+FW-22,y-6,21,36,C.dunkel,null,0,3)+O(x+11,y+4,3,"#77797D")+O(x+FW-11,y+4,3,"#77797D");
    const blk=(bx,bw,f,k)=>{ let t=R(bx,y,bw,22,f,k,1,1)+L(bx+1,y+24.5,bx+bw-1,y+24.5,"#2E2E2E",5,` stroke-dasharray="1.6 1.6"`)+L(bx+1,y+24.5,bx+bw-1,y+24.5,C.ge,5,` stroke-dasharray="1.6 1.6" stroke-dashoffset="1.6"`);
      t+=R(bx+2,y+5,4,12,C.weiss,k,.7,1); for(let cx=bx+13;cx<bx+bw-4;cx+=12) t+=O(cx,y+11,3.2,C.weiss,"#333",.9); return t; };
    s+=blk(a,w*.36,C.bl,"#0E6FA8")+blk(a+w*.36,w*.44,C.gn,"#5A9A1C")+blk(a+w*.8,w*.2,C.bl,"#0E6FA8"); return s; };
  const titel=(x,y,t)=>T(x+FW/2,y,t,{s:40,w:500,f:C.text});
  const loch=(x,y,w,h,id)=>R(x,y,w,h,`url(#${id||"zsLoch"})`,C.lin,.9,1);

  /* ---------- APZ-Einsatz (Höhe ca. 330 mm) ---------- */
  const apzEinsatz=(x,y,h)=>{ const Y=m=>y+m*h/330; let s="";
    s+=R(x+3,Y(0),24,Y(30)-Y(0),"#ECECEC",C.lin,.8,2)+O(x+15,Y(18),4,C.weiss,"#666",.9)+R(x+FW-27,Y(0),24,Y(30)-Y(0),"#ECECEC",C.lin,.8,2)+O(x+FW-15,Y(18),4,C.weiss,"#666",.9);
    s+=R(x+6,Y(30),FW-12,h-(Y(30)-Y(0)),C.weiss,C.lin,1,2)+R(x+10,Y(34),FW-20,Y(42)-Y(34),"#F2F2F2",C.fein,.7);
    s+=R(x+20,Y(50),48,Y(84)-Y(50),"none","#555",1.2,6,` stroke-dasharray="5 4"`)+loch(x+78,Y(48),94,Y(88)-Y(48),"zsLochR")+R(x+FW-68,Y(50),48,Y(84)-Y(50),"none","#555",1.2,6,` stroke-dasharray="5 4"`);
    s+=R(x+14,Y(92),FW-28,Y(118)-Y(92),"#F4F4F4",C.lin,1,2)+L(x+16,Y(96),x+FW-16,Y(96),"#DDD",1);
    [[x+40,"#666"],[x+60,"#666"],[x+FW-58,"#666"]].forEach(([ox,c])=>{ s+=R(ox,Y(101),16,Y(109)-Y(101),C.weiss,c,1,4); });
    s+=R(x+FW-80,Y(84),18,Y(126)-Y(84),C.weiss,C.lin,1,3);
    s+=loch(x+78,Y(124),94,Y(300)-Y(124),"zsLochR");
    [[x+28,Y(150)],[x+FW-72,Y(150)],[x+28,Y(205)],[x+FW-72,Y(205)],[x+28,Y(262)],[x+FW-72,Y(262)]].forEach(([dx,dy])=>{ s+=R(dx,dy,44,Y(40)-Y(0),"none","#555",1.2,6,` stroke-dasharray="5 4"`); });
    [x+96,x+136].forEach(hx=>{ s+=P(`M${k1(hx)} ${k1(Y(160))}l4 26h16l4-26`,"#555",1.1,C.weiss)+P(`M${k1(hx+6)} ${k1(Y(160))}l3 14l3-14`,"#555",1)+R(hx+4,Y(186),16,Y(300)-Y(186),C.weiss,"#555",1,2)+R(hx+2,Y(222),20,Y(240)-Y(222),C.weiss,"#555",1,2); });
    s+=R(x+20,Y(306),70,Y(330)-Y(306),"none","#555",1.2,4,` stroke-dasharray="5 4"`)+R(x+FW-90,Y(306),70,Y(330)-Y(306),"none","#555",1.2,4,` stroke-dasharray="5 4"`);
    return s; };

  const KAB=[C.sw,"#555",C.gr];
  let zn=0, nv=0, nm=0, uess=false; const nMM=F.filter(f=>f.typ==="m").length;

  /* ---------- Zählerfeld ---------- */
  const zaehler=(f,x)=>{ const n=Math.min(2,f.n||1), Y=mm=>fy+mm*fh/1050, X=mm=>x+mm;
    const zps=Array.from({length:n},(_,p)=>zs.zp&&zs.zp.find(q=>q.feldId===f.id&&(q.pos||0)===p)); let s="";
    /* oberer Abschluss mit Klemmstreifen */
    s+=R(X(14),Y(1),222,13,"#EFEFEF",C.lin,.8)+[40,54,68,150,164,178,192,206].map(d=>R(X(d),Y(4),10,6,C.weiss,"#777",.7,2)).join("");
    /* N- und PE-Leiter je Zählerplatz von oben in den Anschlussraum */
    for(let p=0;p<n;p++){ const o=p*125; s+=P(`M${k1(X(o+62))} ${k1(Y(14))}C${k1(X(o+62))} ${k1(Y(40))} ${k1(X(o+80))} ${k1(Y(46))} ${k1(X(o+80))} ${k1(Y(80))}L${k1(X(o+80))} ${k1(Y(302))}`,C.bl,3.6);
      s+=P(`M${k1(X(o+100))} ${k1(Y(14))}C${k1(X(o+100))} ${k1(Y(40))} ${k1(X(o+87))} ${k1(Y(46))} ${k1(X(o+87))} ${k1(Y(80))}L${k1(X(o+87))} ${k1(Y(302))}`,C.gn,3.6)
        +P(`M${k1(X(o+100))} ${k1(Y(14))}C${k1(X(o+100))} ${k1(Y(40))} ${k1(X(o+87))} ${k1(Y(46))} ${k1(X(o+87))} ${k1(Y(80))}L${k1(X(o+87))} ${k1(Y(302))}`,C.ge,3.6).replace("/>",` stroke-dasharray="7 7"/>`); }
    /* Gewindestange */
    [n>1?232:118].forEach(gx=>{ s+=L(X(gx),Y(36),X(gx),Y(296),"#9A9A9A",3,` stroke-dasharray="40 5"`)+L(X(gx),Y(36),X(gx),Y(296),"#C8C8C8",1,` stroke-dasharray="40 5"`); });
    s+=streifen(x,Y(90));
    /* Hauptleitungsabzweigklemme mit drei Außenleitern nach unten */
    for(let p=0;p<n;p++){ const hx=X(18+p*125), hy=Y(200);
      [0,1,2].forEach(k=>{ s+=P(`M${k1(hx+9+k*15)} ${k1(hy+44)}C${k1(hx+9+k*15)} ${k1(hy+70)} ${k1(hx+3+k*12)} ${k1(Y(276))} ${k1(hx+3+k*12)} ${k1(Y(306))}`,C.br,6)+P(`M${k1(hx+9+k*15)} ${k1(hy+44)}C${k1(hx+9+k*15)} ${k1(hy+70)} ${k1(hx+3+k*12)} ${k1(Y(276))} ${k1(hx+3+k*12)} ${k1(Y(306))}`,"#B07A45",1.6); }); }
    s+=streifen(x,Y(208));
    for(let p=0;p<n;p++){ const hx=X(18+p*125), hy=Y(200); s+=R(hx,hy,60,44,"#2E2E2E",null,0,3); for(let r=0;r<3;r++) for(let c=0;c<4;c++) s+=R(hx+3.5+c*14,hy+3.5+r*13.5,11,10.5,C.weiss,null,0,3);
      s+=R(hx+60,hy+4,8,12,C.weiss,"#666",.8,1)+R(hx+60,hy+28,8,12,C.weiss,"#666",.8,1); }
    /* Anschlussraum mit BKE-I-Anschlussblöcken: links Zählerplatz-Klemmen, rechts Steueranschlüsse */
    const A=[8,118], B=[138,242];
    s+=R(X(8),Y(300),234,Y(748)-Y(300),C.weiss,C.lin,1)+R(X(118),Y(300),20,Y(748)-Y(300),C.weiss,C.lin,.9);
    const klemmen=(a,y1,y2,zp)=>{ let t=""; const h=y2-y1;
      if(zp){ [[0,C.br],[1,C.br],[3,C.bl],[4,C.gn]].forEach(([k,c])=>{ const cx=X(a+14+k*16); t+=R(cx-5,y1+h*.25,10,h*.5,C.weiss,"#666",.8,1.5)+R(cx-3,y1+h*.3,6,h*.18,c)+R(cx-3,y1+h*.55,6,h*.14,c===C.gn?C.ge:c); });
        t+=R(X(a+6),y1+h*.12,14,h*.76,C.weiss,"#666",.8,1.5)+L(X(a+8),y1+h*.2,X(a+8),y1+h*.8,C.br,4)+L(X(a+14),y1+h*.2,X(a+14),y1+h*.8,C.br,4); }
      else { t+=R(X(a+6),y1+h*.3,10,h*.4,C.weiss,"#666",.8,1); [[0,0],[1,0],[0,1],[1,1]].forEach(([c,r])=>{ t+=R(X(a+30+c*32),y1+h*.18+r*h*.36,24,h*.28,C.weiss,"#444",.9,4); }); }
      return t; };
    const zone=(y1,y2)=>{ let t=""; [A,B].forEach(([a,b],p)=>{ t+=R(X(a+2),y1,b-a-4,y2-y1,C.weiss,C.lin,.9,1.5)+klemmen(a,y1,y2,p<n); }); return t; };
    s+=zone(Y(304),Y(358));
    s+=R(X(8),Y(362),234,Y(392)-Y(362),"#F6F6F6",C.lin,1)+L(X(10),Y(368),X(240),Y(368),"#DADADA",1)+L(X(10),Y(386),X(240),Y(386),"#DADADA",1);
    s+=zone(Y(396),Y(452));
    /* Zählerplätze */
    [A,B].forEach(([a,b],p)=>{ const ya=Y(458), yb=Y(742), w=b-a;
      if(p>=n){ s+=R(X(a+6),ya,w-12,yb-ya,C.weiss,C.lin,1,3)+R(X(a+12),ya+6,w-24,yb-ya-12,"none",C.fein,1,3)+L(X(a+14),ya+10,X(a+14),yb-10,"#DADADA",1)+L(X(b-14),ya+10,X(b-14),yb-10,"#DADADA",1); return; }
      const zz=zps[p], an=aktiv&&aktiv===`${f.id}:${p}`, ym=Y(652), nr=zn+p+1;
      s+=R(X(a+6),ya,w-12,yb-ya,an?C.aktH:C.weiss,an?C.akt:C.lin,an?2:1,2);
      s+=R(X(a+10),ya+4,w-20,ym-ya-8,an?C.aktH:C.weiss,"#666",.9,1.5)+R(X(a+12),ya+8,28,16,C.weiss,"#666",.8,1)+O(X(a+44),ya+16,2.6,C.weiss,"#666",.8);
      s+=R(X(a+12),ya+30,8,52,C.weiss,"#777",.8,1);
      [0,1,2,3].forEach(k=>{ s+=R(X(a+52+(k%2)*18),ya+34+Math.floor(k/2)*40,8,24,C.weiss,"#666",.8,4); });
      s+=P(`M${k1(X(a+28))} ${k1(ya+30)}c12 22 -12 40 0 62s-12 40 0 60M${k1(X(a+36))} ${k1(ya+30)}c-12 22 12 40 0 62s12 40 0 60`,"#777",1.1);
      s+=R(X(a+30),ya+150,10,14,C.weiss,"#666",.8,2)+R(X(a+70),ya+122,10,20,C.weiss,"#666",.8,4);
      s+=R(X(a+10),ym,w-20,yb-ym-4,C.weiss,"#666",.9,1.5)+L(X(a+10),ym+10,X(b-10),ym+10,"#DADADA",1);
      const kz=zz?(zz.bez?esc(zz.bez).slice(0,10):ZSZ_KURZ[zz.zweck]||""):"";
      s+=T(X(a+w/2),ym+(yb-ym)/2-4,`ZP ${nr}`,{s:20,w:500})+(kz?T(X(a+w/2),ym+(yb-ym)/2+20,kz,{s:18,w:500}):""); });
    s+=R(X(8),Y(742),234,Y(750)-Y(742),"#EDEDED",C.lin,.8);
    [124,158].forEach(cx=>{ s+=P(`M${k1(X(cx))} ${k1(Y(750))}v14h12v-14`,"#666",1,C.weiss); });
    /* NAR: Tragholme, Sammelschiene, Leiter, SLS je Zählerplatz, ÜSS einmal im Schrank */
    [[6,22],[220,236]].forEach(([a,b])=>{ s+=R(X(a),Y(754),b-a,Y(1046)-Y(754),"#2E2E2E",null,0,2); for(let m=790;m<1040;m+=42) s+=L(X(a+2),Y(m),X(b-2),Y(m),"#555",1.2); });
    const bars=[800,842,884,926,968]; bars.forEach(m=>{ s+=R(X(22),Y(m),198,Y(m+11)-Y(m),C.or,C.orK,.8,1); });
    const sw=n>1?56:96, slsX=Array.from({length:n},(_,p)=>4+p*(sw+3)), ue=!uess; if(ue) uess=true;
    const ueX=4+n*(sw+3), peX=ue?ueX+46:ueX+12, nX=n>1?ueX-14:72;
    s+=L(X(nX),Y(752),X(nX),Y(805),C.bl,3.4)+R(X(nX)-4,Y(796),8,Y(812)-Y(796),C.weiss,"#555",.8,1);
    s+=pe(X(peX),Y(752),X(peX),Y(1044))+R(X(peX)-4,Y(962),8,Y(978)-Y(962),C.weiss,"#555",.8,1);
    zps.forEach((zz,p)=>{ const a=X(slsX[p]), w=sw, y1=Y(792), y2=Y(976), amp=zz&&zz.sls&&zz.sls!=="keiner"?zz.sls.slice(1)+"A":"";
      [0,1,2].forEach(k=>{ const cx=a+w*(.2+k*.3); s+=L(cx,Y(752),cx,y1+6,KAB[k],4); });
      s+=R(a,y1,w,y2-y1,"#EBEDF0","#777",1,3)+R(a,y1+(y2-y1)*.62,w,(y2-y1)*.38,"#DCDFE3",null,0,3);
      [0,1,2].forEach(k=>{ const cx=a+w*(.2+k*.3); s+=R(cx-w*.12,y1+3,w*.24,Y(830)-y1,"#2F3E55",null,0,3)+R(cx-w*.08,y1+9,w*.16,Y(818)-y1-6,"#57749A",null,0,2); });
      if(amp) s+=T(a+w/2,Y(880),amp,{s:n>1?24:34,w:800,f:"#111"});
      s+=R(a+1,Y(892),w-2,Y(924)-Y(892),"#BFD6EA","#89A6C2",.8,1.5); [0,1,2].forEach(k=>{ const cx=a+w*(.2+k*.3); s+=R(cx-5,Y(896),10,Y(920)-Y(896),"#56606B",null,0,3)+R(cx-3,Y(898),6,6,"#9AA4AE",null,0,1); });
      s+=T(a+w/2,Y(962),"SLS",{s:n>1?22:30,w:800,f:"#111"}); });
    if(ue){ const a=X(ueX), y1=Y(780), y2=Y(1012), w=40;
      s+=P(`M${k1(a+4)} ${k1(y1)}h${w-8}v${k1(Y(806)-y1)}h6v${k1(Y(842)-Y(806))}h-6v${k1(y2-Y(842))}h${-(w-8)}v${k1(-(y2-Y(860)))}h-4v${k1(-(Y(860)-Y(806)))}h4z`,"#A8160F",1,C.rot);
      s+=R(a+8,y1+10,w-16,(y2-y1)-20,"#EE3B30",null,0,2)+R(a+6,Y(872),w-12,Y(904)-Y(872),C.weiss,"#A8160F",.8,1.5)+R(a+10,Y(878),7,7,"#8BCB4A")+R(a+20,Y(878),10,7,"#D33")+R(a+10,Y(890),20,3,"#BBB"); }
    /* Zählernummer groß oben links */
    for(let p=0;p<n;p++){ const nr=zn+p+1, an=aktiv&&aktiv===`${f.id}:${p}`, bx=X(4+p*125); s+=R(bx,Y(3),78,Y(80)-Y(3),an?C.akt:"#A2A2A2",null,0,9)+T(bx+39,Y(3)+(Y(80)-Y(3))/2+14,nr,{s:40,w:400,f:an?C.weiss:"#222"}); }
    zn+=n; return s; };

  /* ---------- Verteilerfeld (mit oder ohne APZ) ---------- */
  const verteiler=(f,x)=>{ const apz=zs.apz&&zs.apz.feldId===f.id?zs.apz.lage:"", oben=apz==="oben", Y=mm=>fy+mm*fh/1050, ah=330*fh/1050;
    const r=Math.max(1,Math.min(zsReihenFeld(zs,f,reihen),12)); let s="", t0=fy, t1=fy+fh;
    if(apz==="oben"){ s+=apzEinsatz(x,fy+2,ah-4); t0=fy+ah; } else if(apz) t1=fy+fh-ah;
    s+=klemmleiste(x,t0+8);
    const a=t0+126*fh/1050, e=apz?t1-30:fy+973*fh/1050, n=apz?r-1:r, pitch=(e-a)/Math.max(1,n), mitte=apz?-1:Math.ceil(n/2);
    for(let k=0;k<=n;k++){ const y=a+k*pitch; s+=k===mitte?klemmleiste(x,y-24):streifen(x,y-12); }
    if(apz==="unten") s+=apzEinsatz(x,t1+4,ah-6);
    s+=titel(x,t0+92*fh/1050,apz?"APZ":`VTF ${++nv}`);
    return s; };

  /* ---------- Multimediafeld: Patchfeld oben, darunter Lochbleche ---------- */
  const media=(f,x)=>{ nm++; const apz=zs.apz&&zs.apz.feldId===f.id?zs.apz.lage:"", ah=330*fh/1050, Y=mm=>fy+mm*fh/1050;
    let s="", t0=fy, t1=fy+fh;
    if(apz==="oben"){ s+=apzEinsatz(x,fy+2,ah-4); t0=fy+ah; } else if(apz){ t1=fy+fh-ah; s+=apzEinsatz(x,t1+4,ah-6); }
    const sk=(t1-t0)/fh;
    s+=titel(x,t0+92*fh/1050,nMM>1?`MM ${nm}`:"MM");
    /* Patchfeld */
    const py=t0+108*fh/1050; s+=R(x+2,py-6,22,64,C.dunkel,null,0,3)+R(x+FW-24,py-6,22,64,C.dunkel,null,0,3);
    s+=R(x+20,py,FW-40,34,"#E8EEF6","#8A94A3",1,2)+L(x+22,py+6,x+FW-22,py+6,C.weiss,2)+R(x+20,py+34,FW-40,20,"#C9CED6","#6B7380",.9,1);
    for(let k=0;k<12;k++) s+=R(x+30+k*((FW-60)/12),py+39,(FW-60)/12-5,10,"#3E4652",null,0,1.5);
    /* Lochbleche */
    const b0=py+90*sk, bEnd=t1-150*fh/1050*(apz?0.4:1), nb=Math.max(1,Math.round((bEnd-b0)/(172*fh/1050))), bh=(bEnd-b0)/nb;
    for(let k=0;k<nb;k++){ const by=b0+k*bh; s+=R(x+8,by+2,FW-16,bh-6,"#FAFAFA",C.lin,1,2)+R(x+26,by+18,FW-52,bh-38,"url(#zsLochR)",C.fein,.8);
      for(let j=0;j<11;j++){ s+=R(x+30+j*((FW-60)/11),by+7,(FW-60)/11-6,7,C.weiss,"#777",.7,1)+R(x+30+j*((FW-60)/11),by+bh-17,(FW-60)/11-6,7,C.weiss,"#777",.7,1); }
      [.3,.7].forEach(q=>{ s+=R(x+12,by+bh*q-6,10,12,C.weiss,"#777",.7,1)+R(x+FW-22,by+bh*q-6,10,12,C.weiss,"#777",.7,1); }); }
    return s; };

  let inn="";
  F.forEach((f,i)=>{ const x=x0+ZSZ.WAND+i*FW;
    inn+=feldGrund(x)+holme(x,f.typ==="z")+(f.typ==="z"?zaehler(f,x):f.typ==="v"?verteiler(f,x):f.typ==="m"?media(f,x):titel(x,fy+fh/2,ZS_TYP_KURZ[f.typ]||""));
    if(ed){ const gw=i===selFeld; if(gw) inn+=R(x+FW/2-76,y0+g.H+18,152,40,"#E3E5E8",null,0,20);
      inn+=T(x+FW/2,y0+g.H+46,ZS_TYP_KURZ[f.typ]||"",{s:24,w:gw?800:600,f:gw?C.text:C.grau}); } });
  const masse=L(x0+2,y0-38,x0+2,y0-10,C.grau,1.2)+T(x0+16,y0-18,`Breite ${g.B} mm  →`,{s:22,w:400,f:C.grau,a:"start"})
    +L(x0-40,y0+2,x0-12,y0+2,C.grau,1.2)+T(0,0,`Höhe ${g.H} mm`,{s:22,w:400,f:C.grau,a:"end",ex:` transform="translate(${x0-20} ${y0+16}) rotate(-90)"`})+T(x0-26,y0+250,"↓",{s:22,w:400,f:C.grau});
  return `<svg class="zs-svg zs-z" viewBox="0 0 ${g.vw} ${g.vh}" style="--n:${g.n};max-width:${g.n*124}px" font-family="'Open Sans',Manrope,system-ui,sans-serif" aria-hidden="true">`
    +`<defs><pattern id="zsLoch" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="#FFFFFF"/><circle cx="6" cy="6" r="2.4" fill="#9A9A9A"/></pattern>`
    +`<pattern id="zsLochR" width="9" height="8" patternUnits="userSpaceOnUse"><rect width="9" height="8" fill="#FFFFFF"/><circle cx="2.2" cy="2" r="1.7" fill="none" stroke="#8A8A8A" stroke-width=".7"/><circle cx="6.7" cy="6" r="1.7" fill="none" stroke="#8A8A8A" stroke-width=".7"/></pattern>`
    +`<linearGradient id="zsSchatten" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D0D0D0" stop-opacity="0"/><stop offset="1" stop-color="#C4C4C4" stop-opacity=".95"/></linearGradient></defs>`
    +masse+R(x0,y0,g.B,g.H,C.weiss,"#6A6A6A",2.5,2)+R(x0+9,y0+9,g.B-18,g.H-18,"none","#B0B0B0",1)+inn+`</svg>`; }
