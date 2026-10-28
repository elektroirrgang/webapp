/* ===== Anschlussbilder für „So wird gemessen“ (EVSE) =====
   Gezeichnet nach den Bedienfeldern aus den Anleitungen: Fluke FEV300 (Abb. 2) und Wiha MFT one (Übersicht/Anschlüsse).
   Ein Bild je Messgruppe, Format 16:9 (960 × 540), passt auf dem iPad in die Spalte.
   anschlussBild(id) liefert fertiges SVG; id = frei-rlo | frei-iso | spann-u | spann-zs | rcd | fkt */
const AB=(()=>{
const T=(x,y,t,s=12,f="#1c1b1f",w=600,a="middle",extra="")=>`<text x="${x}" y="${y}" text-anchor="${a}" style="font:${w} ${s}px system-ui,-apple-system,'Segoe UI',sans-serif;fill:${f}"${extra}>${t}</text>`;
const ADER={L1:"#7a4a24",L2:"#1f1f22",L3:"#8c8c92",N:"#1e63c8",PE:"#5aa02c"};
const LEIT={rot:"#e0342f",blau:"#1e7fe0",gelb:"#5aa02c"};
const defs=`<defs>
 <linearGradient id="abWb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbfbfd"/><stop offset="1" stop-color="#dcdce3"/></linearGradient>
 <linearGradient id="abFg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f6c62f"/><stop offset=".5" stop-color="#ffd84a"/><stop offset="1" stop-color="#e9b31f"/></linearGradient>
 <linearGradient id="abMg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#46474e"/><stop offset="1" stop-color="#2a2b30"/></linearGradient>
 <linearGradient id="abDs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dfeee1"/><stop offset="1" stop-color="#c6dcc9"/></linearGradient>
 <filter id="abSh" x="-10%" y="-10%" width="130%" height="130%"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#000" flood-opacity=".18"/></filter>
</defs>`;

/* --- Wallbox (allgemein): Gehäuse, Statusleiste, Typ-2-Ladedose, Zuleitung unten; offen = Abdeckung ab, Klemmen sichtbar --- */
function wallbox(x,y,{offen=false,led="#2e9b5b",schraube=false}={}){
  const w=180,h=270;
  let s=`<g filter="url(#abSh)"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="30" fill="url(#abWb)"/></g>
  <rect x="${x+82}" y="${y+h-4}" width="16" height="40" rx="5" fill="#7d7e86"/><rect x="${x+76}" y="${y+h-8}" width="28" height="14" rx="4" fill="#5d5e66"/>`;
  [[x+16,y+16],[x+w-16,y+16],[x+16,y+h-16],[x+w-16,y+h-16]].forEach(([a,b],i)=>{ s+=`<circle cx="${a}" cy="${b}" r="6" fill="#c3c4cb"/><path d="M${a-3.5} ${b}h7M${a} ${b-3.5}v7" stroke="#6b6c74" stroke-width="1.6"/>`; });
  if(!offen){
    s+=`<rect x="${x+22}" y="${y+30}" width="${w-44}" height="${h-64}" rx="20" fill="#2c2d33"/>
    <rect x="${x+50}" y="${y+50}" width="${w-100}" height="6" rx="3" fill="${led}"/>
    ${T(x+w/2,y+80,"Wallbox",13,"#e9e9ee",700)}
    <circle cx="${x+w/2}" cy="${y+160}" r="44" fill="#1b1c20"/><circle cx="${x+w/2}" cy="${y+160}" r="36" fill="#3b3c43"/>
    ${[[0,-17,6],[-16,-6,6],[16,-6,6],[-10,12,6],[10,12,6],[-7,-28,3.5],[7,-28,3.5]].map(([a,b,r])=>`<circle cx="${x+w/2+a}" cy="${y+160+b}" r="${r}" fill="#111215"/><circle cx="${x+w/2+a}" cy="${y+160+b}" r="${r*.45}" fill="#9a9ba3"/>`).join("")}
    ${T(x+w/2,y+222,"Typ-2-Ladedose",11,"#b8b9c1",600)}`;
  }else{
    s+=`<rect x="${x+22}" y="${y+30}" width="${w-44}" height="${h-64}" rx="16" fill="#e7e8ee"/>
    <rect x="${x+34}" y="${y+44}" width="${w-68}" height="92" rx="8" fill="#2f6b3f"/>${[0,1,2,3].map(i=>`<rect x="${x+48+i*24}" y="${y+60}" width="14" height="22" rx="2" fill="#1f2a22"/>`).join("")}${T(x+w/2,y+118,"Elektronik",10,"#cfe3d2",600)}
    <rect x="${x+30}" y="${y+156}" width="${w-60}" height="44" rx="6" fill="#c9cad2"/>`;
    ["L1","L2","L3","N","PE"].forEach((n,i)=>{ const cx=x+44+i*23;
      s+=`<rect x="${cx-9}" y="${y+168}" width="18" height="24" rx="3" fill="#f4f4f7"/><circle cx="${cx}" cy="${y+176}" r="4.5" fill="#9fa0a8"/><path d="M${cx-3} ${y+176}h6" stroke="#5a5b62" stroke-width="1.4"/>
      <path d="M${cx} ${y+192} C ${cx} ${y+215}, ${x+90} ${y+222}, ${x+90} ${y+h-6}" fill="none" stroke="${ADER[n]}" stroke-width="5" stroke-linecap="round"/>
      ${T(cx,y+152,n,11,"#3a3b42",700)}`; });
  }
  return s;
}
const wbSchraube=(x,y)=>[x+164,y+16];
const wbKlemme=(x,y,n)=>[x+44+["L1","L2","L3","N","PE"].indexOf(n)*23,y+176];
const wbDose=(x,y)=>[x+90,y+160];

/* --- Fluke FEV300: Hochformat wie Abb. 2 --- */
function fev(x,y,{cp="A",pp="32A",tE=false,tF=false,an=[]}={}){
  const w=230,h=440;
  const knopf=(cx,cy,winkel,lab)=>`<circle cx="${cx}" cy="${cy}" r="25" fill="#fff"/><circle cx="${cx}" cy="${cy}" r="20" fill="#26272c"/><circle cx="${cx}" cy="${cy}" r="14" fill="#36373d"/>
    <path d="M${cx} ${cy} L${(cx+17*Math.sin(winkel*Math.PI/180)).toFixed(1)} ${(cy-17*Math.cos(winkel*Math.PI/180)).toFixed(1)}" stroke="#fff" stroke-width="4" stroke-linecap="round"/>${T(cx,cy+42,lab,9.5,"#3a3b42",700)}`;
  const ppW={OPEN:-80,"13A":-40,"20A":0,"32A":40,"63A":80}[pp]??40, cpW={D:-75,B:-35,A:0,C:60}[cp]??0;
  const buchse=(cx,cy,f,n)=>`<circle cx="${cx}" cy="${cy}" r="17" fill="#d9dae0"/><circle cx="${cx}" cy="${cy}" r="13.5" fill="${f}"/><circle cx="${cx}" cy="${cy}" r="8" fill="#141518"/><circle cx="${cx}" cy="${cy}" r="3.2" fill="#8a8b92"/>${an.includes(n)?`<circle cx="${cx}" cy="${cy}" r="22" fill="none" stroke="#ffcf33" stroke-width="3.5"/>`:""}`;
  let s=`<rect x="${x+26}" y="${y-30}" width="26" height="40" rx="7" fill="#1e1f23"/>
  <rect x="${x+124}" y="${y-12}" width="18" height="16" rx="4" fill="#f2c230"/><circle cx="${x+133}" cy="${y-5}" r="4" fill="#222"/>
  <rect x="${x+150}" y="${y-12}" width="18" height="16" rx="4" fill="#4c9a3a"/><circle cx="${x+159}" cy="${y-5}" r="4" fill="#222"/>
  <g filter="url(#abSh)"><path d="M${x+20} ${y} H${x+w-20} Q${x+w} ${y} ${x+w} ${y+24} V${y+h-30} Q${x+w} ${y+h} ${x+w-30} ${y+h} H${x+30} Q${x} ${y+h} ${x} ${y+h-30} V${y+24} Q${x} ${y} ${x+20} ${y} Z" fill="url(#abFg)"/></g>
  <rect x="${x+12}" y="${y+12}" width="${w-24}" height="${h-24}" rx="22" fill="#f3f3f5"/>
  ${T(x+24,y+32,"250 V~/480 V 3~ MAX",7,"#3a3b42",600,"start")}${T(x+24,y+42,"50/60 Hz · CAT II 300 V",7,"#3a3b42",600,"start")}${T(x+24,y+52,"10 A MAX",7,"#3a3b42",600,"start")}
  ${T(x+146,y+30,"CP SIGNAL",7,"#3a3b42",700,"start")}${T(x+146,y+40,"OUTPUT ⚠",7,"#3a3b42",700,"start")}
  ${T(x+44,y+76,"13A",8,"#3a3b42")}${T(x+64,y+70,"20A",8,"#3a3b42")}${T(x+84,y+76,"32A",8,"#3a3b42")}${T(x+30,y+90,"OPEN",8,"#3a3b42")}${T(x+100,y+90,"63A",8,"#3a3b42")}
  ${knopf(x+64,y+108,ppW,"PP STATE")}
  ${T(x+164,y+70,"A",9,cp==="A"?"#c62828":"#3a3b42",800)}${T(x+140,y+78,"B",9,cp==="B"?"#c62828":"#3a3b42",800)}${T(x+124,y+96,"⊕D",9,cp==="D"?"#c62828":"#3a3b42",800)}${T(x+202,y+96,"C❄",9,cp==="C"?"#c62828":"#3a3b42",800)}
  ${knopf(x+164,y+108,cpW,"CP STATE")}
  <circle cx="${x+64}" cy="${y+176}" r="6" fill="#d0d1d7"/><circle cx="${x+64}" cy="${y+176}" r="3.5" fill="#b3b4bb"/>${T(x+64,y+196,"PE ⚠",9,"#3a3b42",700)}
  <circle cx="${x+164}" cy="${y+178}" r="15" fill="${tE?"#e53935":"#dcdde3"}"/>${tE?T(x+164,y+183,"E",13,"#fff",800):""}${T(x+164,y+206,"CP ERROR STATE „E“",8,"#3a3b42",700)}
  <circle cx="${x+64}" cy="${y+236}" r="15" fill="#dcdde3"/><circle cx="${x+64}" cy="${y+236}" r="9" fill="#cfd0d6"/>${T(x+64,y+264,"PE PRE-TEST",8,"#3a3b42",700)}
  <circle cx="${x+164}" cy="${y+238}" r="15" fill="${tF?"#e53935":"#dcdde3"}"/>${tF?T(x+164,y+243,"F",13,"#fff",800):""}${T(x+164,y+266,"PE ERROR STATE „F“",8,"#3a3b42",700)}
  <rect x="${x+24}" y="${y+282}" width="${w-48}" height="122" rx="10" fill="#c5c6ce"/>`;
  ["L1","L2","L3"].forEach((n,i)=>{ const cy=y+304+i*38; s+=buchse(x+52,cy,"#2a2b30",n)+T(x+80,cy+4,n,10,"#2a2b30",700)+`<circle cx="${x+100}" cy="${cy}" r="5" fill="#e9eaef"/><circle cx="${x+100}" cy="${cy}" r="3" fill="#a8a9b0"/>`; });
  s+=`<rect x="${x+92}" y="${y+290}" width="16" height="104" rx="8" fill="#b4b5bd"/>`;
  ["L1","L2","L3"].forEach((n,i)=>{ s+=`<circle cx="${x+100}" cy="${y+304+i*38}" r="4.5" fill="#e9eaef"/>`; });
  s+=buchse(x+178,y+304,"#3d8f33","PE")+T(x+148,y+308,"PE",10,"#2a2b30",700)
    +T(x+160,y+344,"⚠ 10 A MAX",8.5,"#2a2b30",700)
    +buchse(x+178,y+380,"#1e5fc2","N")+T(x+150,y+384,"N",10,"#2a2b30",700)
    +`<rect x="${x+24}" y="${y+412}" width="${w-48}" height="16" rx="3" fill="#e2e3e8"/>${T(x+36,y+424,"FLUKE",9.5,"#111",900,"start")}${T(x+82,y+424,"FEV300",9.5,"#111",800,"start")}${T(x+196,y+420,"EV CHARGING STATION",5.5,"#333",600)}${T(x+196,y+427,"TEST ADAPTER",5.5,"#333",600)}`;
  return s;
}
const fevBuchse=(x,y,n)=>({L1:[x+52,y+304],L2:[x+52,y+342],L3:[x+52,y+380],PE:[x+178,y+304],N:[x+178,y+380]})[n];
/* Prüfkabel FEV300 → Typ-2-Stecker in der Ladedose */
function pruefkabel(fx,fy,dx,dy){
  return `<path d="M${fx+39} ${fy-30} C ${fx+39} ${fy-90}, ${dx+120} ${dy-10}, ${dx+40} ${dy}" fill="none" stroke="#222327" stroke-width="10" stroke-linecap="round"/>
  <g transform="rotate(-20 ${dx} ${dy})"><rect x="${dx+12}" y="${dy-15}" width="52" height="30" rx="10" fill="#2c2d33"/><circle cx="${dx}" cy="${dy}" r="38" fill="#2c2d33"/><circle cx="${dx}" cy="${dy}" r="30" fill="#3b3c43"/>
  <path d="M${dx-12} ${dy-20} h24" stroke="#55565e" stroke-width="5" stroke-linecap="round"/>${T(dx,dy+6,"Typ 2",11,"#d0d1d7",700)}</g>`;
}

/* --- Wiha MFT one: 1:1 nach der Ansicht aus der Wiha-Anleitung (Querformat), eigene Koordinaten 800 × 335 ---
   Tasten links, Display Mitte, NFC + Ein/Aus oben rechts, Drehschalter rechts; Messbuchsen oben (L1/L/H rot, L2/N/E blau, L3/PE/ES gelb, S) */
const MFT_LAB={AUTO:[604,118],RISO:[655,124],RLO:[566,141],RCD:[692,141],RE:[540,180],ZS:[706,173],U:[538,224],ZI:[706,218]};
function mftL(stell,anz){
  const K=[620,182];
  const t=(tx,ty,tw,th,lab,sz=11)=>`<rect x="${tx}" y="${ty}" width="${tw}" height="${th}" rx="8" fill="#2a2b30"/><rect x="${tx+2.5}" y="${ty+2.5}" width="${tw-5}" height="${th-5}" rx="6" fill="#f4f4f6"/>${lab?T(tx+tw/2,ty+th/2+sz*.36,lab,sz,"#2a2b30",800):""}`;
  const lab=(k,txt,sub)=>{ const [x,y]=MFT_LAB[k], an=k===stell; return T(x,y,txt,an?13:11,an?"#c62828":"#2a2b30",an?900:700)+(sub?T(x,y+12,sub,7,an?"#c62828":"#5a5b62",600):""); };
  const [lx,ly]=MFT_LAB[stell], wnk=Math.atan2(ly-6-K[1],lx-K[0]), px=K[0]+39*Math.cos(wnk), py=K[1]+39*Math.sin(wnk), qx=K[0]-33*Math.cos(wnk), qy=K[1]-33*Math.sin(wnk);
  return `<rect x="512" y="-22" width="236" height="30" rx="8" fill="#26272c"/>
  ${[["#e53935",540],["#1e7fe0",598],["#f2c230",656],["#5a5b62",714]].map(([f,x])=>`<circle cx="${x}" cy="-8" r="12" fill="${f}"/><circle cx="${x}" cy="-8" r="5" fill="#141518"/>`).join("")}
  <g filter="url(#abSh)"><path d="M48 52 L118 4 Q124 0 132 0 H668 Q676 0 682 4 L752 52 Q800 60 800 92 V292 Q800 335 758 335 H42 Q0 335 0 292 V92 Q0 60 48 52 Z" fill="url(#abMg)"/></g>
  <rect x="140" y="10" width="520" height="24" rx="8" fill="#56575f"/><rect x="0" y="96" width="22" height="190" rx="10" fill="#202125"/><rect x="778" y="96" width="22" height="190" rx="10" fill="#202125"/>
  <rect x="30" y="50" width="740" height="262" rx="34" fill="#ececf0"/>
  ${t(110,76,32,28,"💾",12)}${t(154,76,44,28,"ZERO",10.5)}${t(206,76,44,28,"HELP",10.5)}
  ${t(106,114,34,30,"⚙",13)}${t(208,116,40,28,"←",14)}
  ${t(158,124,36,32,"▲",11)}${t(158,240,36,32,"▼",11)}${t(104,180,32,36,"◀",11)}${t(214,180,32,36,"▶",11)}
  <circle cx="175" cy="198" r="34" fill="#2a2b30"/><circle cx="175" cy="198" r="30" fill="#dcdde2"/>${T(175,199,"TEST",15,"#2a2b30",900)}${T(175,213,"ENTER",8,"#5a5b62",700)}
  ${T(386,74,"wiha",30,"#1c1b1f",900)}
  <rect x="276" y="88" width="246" height="190" rx="8" fill="#26272c"/><rect x="284" y="96" width="230" height="174" rx="4" fill="url(#abDs)"/>
  ${anz.map((x,i)=>T(399,148+i*42,x,i?26:30,"#173b1f",i?600:800)).join("")}
  <rect x="550" y="58" width="64" height="26" rx="6" fill="#2a2b30"/><rect x="552.5" y="60.5" width="59" height="21" rx="5" fill="#f4f4f6"/>${T(574,75,"NFC",11,"#2a2b30",900)}${T(600,75,")))",8,"#2a2b30",800)}
  <circle cx="682" cy="98" r="22" fill="#2a2b30"/><circle cx="682" cy="98" r="18" fill="#3c3d44"/><path d="M675 92 A10 10 0 1 0 689 92" fill="none" stroke="#f4f4f6" stroke-width="3"/><path d="M682 86v12" stroke="#f4f4f6" stroke-width="3"/>
  <path d="M${(K[0]+62*Math.cos(Math.atan2(141-6-K[1],566-K[0]))).toFixed(1)} ${(K[1]+62*Math.sin(Math.atan2(141-6-K[1],566-K[0]))).toFixed(1)} A62 62 0 0 1 ${(K[0]+62*Math.cos(Math.atan2(218-6-K[1],706-K[0]))).toFixed(1)} ${(K[1]+62*Math.sin(Math.atan2(218-6-K[1],706-K[0]))).toFixed(1)}" fill="none" stroke="#b8b9c1" stroke-width="6" stroke-linecap="round"/>
  ${T(640,104,"⚠",11,"#2a2b30",800)}
  ${lab("AUTO","AUTO")}${lab("RISO","R<tspan dy='4' font-size='10'>ISO</tspan>")}${lab("RLO","R<tspan dy='4' font-size='10'>LOW</tspan>")}${lab("RCD","RCD")}${lab("RE","R<tspan dy='4' font-size='10'>E</tspan>","(⏚, Ω)")}${lab("ZS","Z<tspan dy='4' font-size='10'>S</tspan>","(L-PE)")}${lab("U","U","(~, Hz)")}${lab("ZI","Z<tspan dy='4' font-size='10'>I</tspan>","(L-N, ΔU)")}
  <circle cx="${K[0]}" cy="${K[1]}" r="50" fill="#2a2b30"/><circle cx="${K[0]}" cy="${K[1]}" r="45" fill="#dcdde2"/>
  <path d="M${qx.toFixed(1)} ${qy.toFixed(1)} L${px.toFixed(1)} ${py.toFixed(1)}" stroke="#2a2b30" stroke-width="20" stroke-linecap="round"/><path d="M${K[0]} ${K[1]} L${(K[0]+35*Math.cos(wnk)).toFixed(1)} ${(K[1]+35*Math.sin(wnk)).toFixed(1)}" stroke="#f4f4f6" stroke-width="3" stroke-linecap="round"/><circle cx="${(K[0]+35*Math.cos(wnk)).toFixed(1)}" cy="${(K[1]+35*Math.sin(wnk)).toFixed(1)}" r="4.5" fill="#e53935"/>`;
}
const MFT_BU={rot:[540,-8],blau:[598,-8],gelb:[656,-8]};
/* Geräte maßstäblich platzieren: g = {x,y,s}; pt rechnet einen Punkt aus Geräte- in Bildkoordinaten um */
const gr=(g,inhalt)=>`<g transform="translate(${g.x} ${g.y}) scale(${g.s})">${inhalt}</g>`;
const pt=(g,[a,b])=>[+(g.x+a*g.s).toFixed(1),+(g.y+b*g.s).toFixed(1)];

/* Messleitung mit 4-mm-Sicherheitsstecker am MFT; Ende: Stecker (in Buchse), Prüfspitze oder Klemme */
function leitung(a,b,f,c1,c2,ende="stecker"){
  const s=`<path d="M${a[0]} ${a[1]-14} C ${a[0]+c1[0]} ${a[1]+c1[1]}, ${b[0]+c2[0]} ${b[1]+c2[1]}, ${b[0]} ${b[1]}" fill="none" stroke="${f}" stroke-width="6" stroke-linecap="round"/>
  <rect x="${a[0]-6}" y="${a[1]-26}" width="12" height="22" rx="4" fill="${f}"/>`;
  const e=ende==="spitze"?`<circle cx="${b[0]}" cy="${b[1]}" r="7" fill="${f}"/><path d="M${b[0]} ${b[1]} l-9 9" stroke="#c9cad1" stroke-width="3" stroke-linecap="round"/>`
    :ende==="klemme"?`<rect x="${b[0]-7}" y="${b[1]-4}" width="14" height="22" rx="4" fill="${f}"/><path d="M${b[0]-5} ${b[1]-4} l5 -8 l5 8" fill="#c9cad1"/>`
    :`<circle cx="${b[0]}" cy="${b[1]}" r="9" fill="${f}"/><circle cx="${b[0]}" cy="${b[1]}" r="4" fill="#fff" opacity=".55"/>`;
  return s+e;
}
const hinweis=(_x,_y,t,f="#5f6068")=>{ const x=24,y=494; return `<rect x="${x}" y="${y}" width="${t.length*7.6+28}" height="30" rx="15" fill="${f}"/>${T(x+14,y+20,t,13,"#fff",700,"start")}`; };

/* Größenverhältnis wie in echt: MFT one (Querformat) deutlich breiter als der FEV300 hoch ist */
const GW={x:16,y:166,s:.8}, GF={x:196,y:128,s:.7}, GM={x:440,y:300,s:.62};
const grund=(o={})=>{ const d=pt(GW,wbDose(0,0)), f=pt(GF,[0,0]);
  return gr(GW,wallbox(0,0,o.wb||{}))+gr(GF,fev(0,0,o.fev||{}))
    +`<path d="M${f[0]+39*GF.s} ${f[1]-30*GF.s} C ${f[0]+39*GF.s} ${f[1]-90}, ${d[0]+110} ${d[1]-10}, ${d[0]+30} ${d[1]}" fill="none" stroke="#222327" stroke-width="8" stroke-linecap="round"/>
    <g transform="rotate(-20 ${d[0]} ${d[1]})"><rect x="${d[0]+10}" y="${d[1]-12}" width="42" height="24" rx="8" fill="#2c2d33"/><circle cx="${d[0]}" cy="${d[1]}" r="31" fill="#2c2d33"/><circle cx="${d[0]}" cy="${d[1]}" r="24" fill="#3b3c43"/>${T(d[0],d[1]+4,"Typ 2",9.5,"#d0d1d7",700)}</g>`; };
const mftG=(st,anz)=>gr(GM,mftL(st,anz));
const mb=n=>pt(GM,MFT_BU[n]), fb=n=>pt(GF,fevBuchse(0,0,n));
const dreiLtg=()=>leitung(mb("rot"),fb("L1"),LEIT.rot,[0,-150],[-130,-30])+leitung(mb("blau"),fb("N"),LEIT.blau,[0,-70],[150,10])+leitung(mb("gelb"),fb("PE"),LEIT.gelb,[0,-110],[140,-10]);
const BILD={
  "frei-rlo":()=>grund({fev:{an:["PE"]}})+mftG("RLO",["R LOW","– – – Ω"])
    +leitung(mb("rot"),pt(GW,wbSchraube(0,0)),LEIT.rot,[0,-230],[70,-90],"spitze")
    +leitung(mb("gelb"),fb("PE"),LEIT.gelb,[0,-110],[140,-10])+hinweis(0,0,"Helfer am Verteiler: LS aus"),
  "frei-iso":()=>{ const g={x:70,y:24,s:1.28};
    return gr(g,wallbox(0,0,{offen:true}))+mftG("RISO",["R ISO","500 V"])
    +leitung(mb("rot"),pt(g,wbKlemme(0,0,"L1")),LEIT.rot,[0,-130],[0,-150],"klemme")
    +leitung(mb("gelb"),pt(g,wbKlemme(0,0,"PE")),LEIT.gelb,[0,-100],[0,-120],"klemme")+hinweis(0,0,"Helfer am Verteiler: LS aus"); },
  "spann-u":()=>grund({fev:{cp:"C",an:["L1","N","PE"]}})+mftG("U",["U","L–N · N–PE"])+dreiLtg()+hinweis(0,0,"Helfer: LS ein · CP STATE auf C","#2e7d32"),
  "spann-zs":()=>grund({fev:{cp:"C",an:["L1","N","PE"]}})+mftG("ZS",["Zs (L-PE)","std. RCD"])+dreiLtg()+hinweis(0,0,"Helfer: LS ein · CP STATE auf C","#2e7d32"),
  "rcd":()=>grund({fev:{cp:"C",an:["L1","N","PE"]}})+mftG("RCD",["RCD","Rampe"])+dreiLtg()+hinweis(0,0,"Helfer: RCD nach jeder Auslösung wieder ein"),
  "fkt":()=>{ const w={x:30,y:150,s:.9}, f={x:300,y:80,s:.95}, d=pt(w,wbDose(0,0)), o=pt(f,[0,0]);
    return gr(w,wallbox(0,0,{led:"#e53935"}))+gr(f,fev(0,0,{cp:"C",tE:true,tF:true}))
    +`<path d="M${o[0]+39*f.s} ${o[1]-30*f.s} C ${o[0]+39*f.s} ${o[1]-90}, ${d[0]+110} ${d[1]-10}, ${d[0]+30} ${d[1]}" fill="none" stroke="#222327" stroke-width="9" stroke-linecap="round"/><g transform="rotate(-20 ${d[0]} ${d[1]})"><circle cx="${d[0]}" cy="${d[1]}" r="34" fill="#2c2d33"/><circle cx="${d[0]}" cy="${d[1]}" r="26" fill="#3b3c43"/>${T(d[0],d[1]+4,"Typ 2",10,"#d0d1d7",700)}</g>`
    +`<path d="M${w.x+90*w.s} ${w.y+50*w.s} L${w.x+90*w.s} ${w.y-30}" stroke="#e53935" stroke-width="3"/>`+T(w.x+90*w.s,w.y-40,"Statusleiste rot",14,"#c62828",700)
    +T(770,240,"Taste E (CP-Fehler)",20,"#1c1b1f",800)+T(770,270,"oder F (PE-Fehler) drücken",20,"#1c1b1f",800)+T(770,312,"→ Ladung bricht ab",20,"#c62828",800); },
};
let nr=0;
/* eindeutige IDs je Bild – sonst greifen Verläufe/Schatten nicht, wenn ein anderes (verstecktes) Bild sie definiert */
return { bild:id=>{ if(!BILD[id]) return ""; const k="ab"+(++nr)+"x"; return `<svg class="ab-svg" viewBox="0 0 960 540" role="img" aria-label="Anschlussbild">${defs}${BILD[id]()}</svg>`.replace(/id="ab/g,`id="${k}`).replace(/url\(#ab/g,`url(#${k}`); }, ids:Object.keys(BILD) };
})();
const anschlussBild=id=>AB.bild(id);
/* Umschalter, wenn eine Gruppe zwei Bilder hat (z. B. Schutzleiter | Isolation) */
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest("[data-ab-tab]"); if(!b) return; const w=b.closest(".ab-w"); if(!w) return;
  w.querySelectorAll("[data-ab-tab]").forEach(x=>x.setAttribute("aria-pressed",String(x===b))); w.querySelectorAll(".ab-bild").forEach(x=>x.hidden=x.dataset.ab!==b.dataset.abTab); });
function anschlussHtml(ids){ if(!ids||!ids.length) return ""; const N={"frei-rlo":"Schutzleiter","frei-iso":"Isolation","spann-u":"Spannung / Drehfeld","spann-zs":"Schleifenimpedanz Zs","rcd":"RCD","fkt":"Fehlersimulation"};
  return `<div class="ab-w">${ids.length>1?`<div class="seg ab-seg" role="group">${ids.map((i,n)=>`<button type="button" data-ab-tab="${i}" aria-pressed="${!n}">${N[i]||i}</button>`).join("")}</div>`:""}${ids.map((i,n)=>`<div class="ab-bild" data-ab="${i}"${n?" hidden":""}>${anschlussBild(i)}</div>`).join("")}</div>`; }
