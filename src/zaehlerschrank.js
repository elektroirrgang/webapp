/* ===== Zählerschrank nach VDE-AR-N 4100: Felder und Zählerplätze =====
   Liegt am Verteiler als zs = {felder:[{id,typ:"z"|"v"|"m",n?:1|2}], apz:{feldId,lage:"oben"|"unten"}|null, zp:[{id,feldId,pos,zweck,art,sls,nr,bez}]}.
   Zählerfeld von oben nach unten: AAR (Hauptschalter/HLAK) · RfZ (über dem Zähler) · Zähler (1 oder 2 nebeneinander, Doppelbelegung) · NAR (SLS, Überspannungsschutz).
   APZ genau einmal, ganz oben oder ganz unten im Verteiler- oder Multimediafeld. Aufbau per Vorlage, danach anpassbar; je Zählerplatz ein Fenster.
   Benutzt im Assistenten (vt-aufnahme.js, Art „Zählerschrank / HV“) und auf der Verteilerseite (Karte „Zählerschrank“). */
const ZS_TYP={z:"Zählerfeld",v:"Verteilerfeld",m:"Multimedia"}, ZS_TYP_KURZ={z:"Zähler",v:"Verteiler",m:"Media"};
/* Vorlagen: z1 = Zählerfeld mit 1 Zähler, z2 = Zählerfeld doppelt belegt; APZ unten im ersten Verteilerfeld (wie bei Hager univers) */
const ZS_VORL=[["1z","1 Zähler","Zählerfeld · Verteilerfeld mit APZ",["z1","v"]],["2z1","2 Zähler in einem Feld","Zählerfeld doppelt belegt · Verteilerfeld mit APZ",["z2","v"]],
  ["2z","2 Zähler in zwei Feldern","2 Zählerfelder · Verteilerfeld mit APZ",["z1","z1","v"]],["2zm","2 Zähler mit Multimedia","Zählerfeld doppelt belegt · Verteilerfeld mit APZ · Multimedia",["z2","v","m"]],
  ["4z","4 Zähler mit Multimedia","2 Zählerfelder doppelt belegt · Verteilerfeld mit APZ · Multimedia",["z2","z2","v","m"]]];
const ZS_ZWECK=[["haushalt","Haushalt"],["wp","Wärmepumpe"],["wallbox","Wallbox"],["pv","PV / Einspeisung"],["allgemein","Allgemein"],["gewerbe","Gewerbe"]];
const ZS_ART=[["ehz","eHZ (BKE-I)","Stecktechnik"],["3pkt","3-Punkt","Schraubbefestigung"]];
const ZS_SLS=[["E35","SLS E35"],["E40","SLS E40"],["E50","SLS E50"],["E63","SLS E63"],["keiner","Keiner / weiß nicht"]];
const zsTxt=(L,k)=>(L.find(x=>x[0]===k)||[])[1]||"";
const zsFeldAus=c=>c[0]==="z"?{id:uid(),typ:"z",n:+c[1]||1}:{id:uid(),typ:c};
function zsAusVorlage(k){ const v=ZS_VORL.find(x=>x[0]===k)||ZS_VORL[0], felder=v[3].map(zsFeldAus), vf=felder.find(f=>f.typ==="v")||felder.find(f=>f.typ==="m");
  const zs={felder,apz:vf?{feldId:vf.id,lage:"unten"}:null,zp:[]}; zsAbgleich(zs); return zs; }
/* Zählerplätze an die Zählerfelder angleichen (Reihenfolge: Feld von links, im Feld von links); APZ nur in Verteiler-/Multimediafeld */
function zsAbgleich(zs){ const alt=zs.zp||[]; let n=0; zs.zp=[];
  zs.felder.forEach(f=>{ if(f.typ!=="z"){ delete f.n; return; } f.n=f.n===2?2:1;
    for(let p=0;p<f.n;p++){ n++; const z=alt.find(x=>x.feldId===f.id&&(x.pos||0)===p); zs.zp.push(z?{...z,pos:p}:{id:uid(),feldId:f.id,pos:p,zweck:n===1?"haushalt":n===2?"wp":"wallbox",art:"ehz",sls:"E35",nr:"",bez:""}); } });
  if(zs.apz&&!zs.felder.some(f=>f.id===zs.apz.feldId&&f.typ!=="z")) zs.apz=null;
  return zs; }
const zsKopie=zs=>JSON.parse(JSON.stringify(zs||{felder:[],apz:null,zp:[]}));
function zsZpText(z){ return [zsTxt(ZS_ART,z.art).replace(" (BKE-I)",""),z.sls&&z.sls!=="keiner"?"SLS "+z.sls:"",z.nr?"Nr. "+z.nr:"Nummer fehlt"].filter(Boolean).join(" · "); }
const zsFeldNr=(zs,id)=>zs.felder.findIndex(f=>f.id===id)+1;
const zsApzText=zs=>{ if(!zs.apz) return ""; const f=zs.felder.find(x=>x.id===zs.apz.feldId); return f?`${ZS_TYP[f.typ]} ${zsFeldNr(zs,f.id)} · ${zs.apz.lage}`:""; };

/* Vorderansicht: Zählerfeld mit AAR · RfZ · Zähler · NAR, Verteilerfeld mit APZ oben/unten, Multimediafeld */
function zsSvg(zs,reihen,klein,aktiv){ const F=zs.felder, W=72, G=4, H=176, w=F.length*(W+G)+G, r=Math.max(1,Math.min(+reihen||4,6)); let zn=0;
  const T=(x,y,t,c)=>klein?"":`<text x="${x}" y="${y}" class="t ${c||""}">${t}</text>`;
  const feld=(f,i)=>{ const x=G+i*(W+G), y=4; let inn="";
    if(f.typ==="z"){ const n=f.n||1, zw=(W-12-(n-1)*4)/n;
      inn=`<rect x="${x+4}" y="${y+4}" width="${W-8}" height="34" rx="3" class="d"/>${T(x+W/2,y+25,"AAR","k")}`
        +`<rect x="${x+4}" y="${y+42}" width="${W-8}" height="20" rx="3" class="r"/>${T(x+W/2,y+56,"RfZ","k")}`
        +Array.from({length:n},(_,p)=>{ zn++; const zx=x+6+p*(zw+4), an=aktiv&&aktiv===`${f.id}:${p}`;
          return `<rect x="${zx}" y="${y+66}" width="${zw}" height="62" rx="3" class="e${an?" an":""}"/><rect x="${zx+4}" y="${y+74}" width="${zw-8}" height="10" rx="1" class="d"/>${T(zx+zw/2,y+112,"Z"+zn)}`; }).join("")
        +`<rect x="${x+4}" y="${y+132}" width="${W-8}" height="40" rx="3" class="n"/>${T(x+W/2,y+156,"NAR","k")}`; }
    else if(f.typ==="v"){ const apz=zs.apz&&zs.apz.feldId===f.id?zs.apz.lage:"", oben=apz==="oben", top=y+(oben?50:6), hh=H-8-(apz?46:0);
      inn=Array.from({length:r},(_,k)=>`<rect x="${x+8}" y="${(top+4+k*(hh/r)).toFixed(1)}" width="${W-16}" height="${Math.min(14,hh/r-8).toFixed(1)}" rx="2" class="e"/>`).join("")
        +(apz?`<rect x="${x+4}" y="${oben?y+4:y+H-46}" width="${W-8}" height="42" rx="3" class="a"/>${T(x+W/2,(oben?y+4:y+H-46)+26,"APZ")}`:""); }
    else { const apz=zs.apz&&zs.apz.feldId===f.id?zs.apz.lage:"", oben=apz==="oben";
      inn=[0,1,2].flatMap(k=>[0,1].map(j=>`<rect x="${x+12+j*26}" y="${(oben?y+54:y+10)+k*38}" width="22" height="30" rx="3" class="e"/>`)).join("")
        +(apz?`<rect x="${x+4}" y="${oben?y+4:y+H-46}" width="${W-8}" height="42" rx="3" class="a"/>${T(x+W/2,(oben?y+4:y+H-46)+26,"APZ")}`:""); }
    return `<rect x="${x}" y="${y}" width="${W}" height="${H}" rx="6" class="f"/>${inn}${T(x+W/2,y+H+16,ZS_TYP_KURZ[f.typ],"u")}`; };
  return `<svg class="zs-svg${klein?" klein":""}" viewBox="0 0 ${w} ${klein?H+8:H+24}" style="max-width:${F.length*(klein?28:104)}px" aria-hidden="true">${F.map(feld).join("")}</svg>`; }

/* ---- Fenster (liefern frage/inhalt/fuss für awRahmen) ---- */
function zsAufbauFenster(){ return {frage:"Wie ist der Schrank aufgebaut?",hinweis:"Vorlage antippen – Felder lassen sich danach ändern.",
  inhalt:`<div class="aw-liste">${ZS_VORL.map(([k,t,s,f])=>{ const zs={felder:f.map(zsFeldAus)}; zs.apz=(z=>z?{feldId:z.id,lage:"unten"}:null)(zs.felder.find(x=>x.typ==="v")); return awKachel("zsVorl",k,zsSvg(zs,4,true),t,s); }).join("")}${awKachel("zsVorl","eigen",awSvg("frei"),"Selbst zusammenstellen","Feld für Feld")}</div>`}; }
function zsFelderFenster(zs,reihen,weiterAct,weiterTxt){ return {frage:"Welche Felder, von links nach rechts?",
  inhalt:`<div class="zs-bild">${zsSvg(zs,reihen)}</div><div class="zs-felder">${zs.felder.map((f,i)=>`<div class="zs-feld"><span class="zs-fnr">${i+1}</span><div class="zs-fre">
      <div class="zs-ftyp" role="group">${Object.keys(ZS_TYP).map(t=>`<button type="button" data-act="zsTyp" data-i="${i}" data-v="${t}" aria-pressed="${f.typ===t}">${ZS_TYP_KURZ[t]}</button>`).join("")}</div>
      ${f.typ==="z"?`<div class="zs-ftyp zs-fn" role="group">${[1,2].map(n=>`<button type="button" data-act="zsAnz" data-i="${i}" data-v="${n}" aria-pressed="${(f.n||1)===n}">${n===1?"1 Zähler":"2 Zähler"}</button>`).join("")}</div>`:""}</div>
      <button type="button" class="icon-btn" data-act="zsFeldWeg" data-i="${i}" aria-label="Feld ${i+1} entfernen" ${zs.felder.length<2?"disabled":""}>${icon("del")}</button></div>`).join("")}</div>
    <button type="button" class="aw-unbek zs-plus" data-act="zsFeldPlus">${icon("add")}Feld anhängen</button>`,
  fuss:`<span style="flex:1"></span><button type="button" class="btn-filled" data-act="${weiterAct}">${weiterTxt}</button>`}; }
function zsApzFenster(zs){ const O=zs.felder.filter(f=>f.typ!=="z").flatMap(f=>["oben","unten"].map(l=>[f,l]));
  return {frage:"Wo sitzt der APZ?",hinweis:"Abschlusspunkt Zählerplatz: genau einmal im Schrank, ganz oben oder ganz unten im Verteiler- oder Multimediafeld.",
    inhalt:`<div class="aw-liste">${O.map(([f,l])=>awKachel("zsApz",`${f.id}:${l}`,"",`${ZS_TYP[f.typ]} ${zsFeldNr(zs,f.id)} · ${l}`,"",zs.apz&&zs.apz.feldId===f.id&&zs.apz.lage===l)).join("")}
      ${awKachel("zsApz","","","Kein APZ","Bestandsanlage – muss nicht nachgerüstet werden",!zs.apz)}</div>`}; }
function zsZpFenster(zs,i,weiterAct,weiterTxt){ const z=zs.zp[i]; if(!z) return null; const f=zs.felder.find(x=>x.id===z.feldId)||{};
  const gr=(lbl,act,L,cur)=>`<div class="aw-lbl">${lbl}</div><div class="aw-wahl">${L.map(([k,t])=>`<button type="button" data-act="${act}" data-v="${k}" aria-pressed="${cur===k}">${esc(t)}</button>`).join("")}</div>`;
  return {frage:`Zähler ${i+1}`,hinweis:`Zählerfeld ${zsFeldNr(zs,z.feldId)} von links${f.n===2?(z.pos?", rechter Platz":", linker Platz"):""}`,
    inhalt:`<div class="zs-bild">${zsSvg(zs,4,false,`${z.feldId}:${z.pos||0}`)}</div>${gr("Wofür","zsZweck",ZS_ZWECK,z.zweck)}${gr("Zählerart","zsArt",ZS_ART,z.art)}${gr("SLS im NAR","zsSls",ZS_SLS,z.sls)}
      <div class="fg1 aw-eigen">${tf("zsBez","Bezeichnung (optional)",z.bez||"",{form:true,ph:"z. B. Wohnung EG"})}</div>
      <div class="fg1 aw-eigen">${tf("zsNr","Zählernummer (optional)",z.nr||"",{form:true,ph:"steht auf dem Zähler, z. B. 1EBZ01…"})}</div>`,
    fuss:`<span style="flex:1"></span><button type="button" class="btn-filled" data-act="${weiterAct}">${weiterTxt}</button>`}; }
function zsZpLesen(z){ if(!z) return; const b=document.getElementById("f_zsBez"), n=document.getElementById("f_zsNr"); if(b) z.bez=b.value.trim(); if(n) z.nr=n.value.trim().replace(/\s+/g," "); }

/* ---- Karte auf der Verteilerseite ---- */
function zsHinweise(zs){ const H=[];
  if(!zs.apz) H.push("Kein APZ eingetragen – bei neuen Zählerschränken Pflicht, im Bestand nicht nachzurüsten.");
  zs.zp.forEach((z,i)=>{ if(!z.sls||z.sls==="keiner") H.push(`Zähler ${i+1}: SLS im NAR fehlt – bei direkter Messung vorgeschrieben.`); });
  return H; }
function zsMaterial(zs,reihen){ const M=new Map(), add=t=>M.set(t,(M.get(t)||0)+1);
  zs.felder.forEach(f=>{ if(f.typ==="z"){ const Z=zs.zp.filter(x=>x.feldId===f.id), art=Z.some(z=>z.art==="3pkt")?"3-Punkt":"eHZ";
      add(`Zählerfeld ${art}${f.n===2?", 2 Zähler":""}`); Z.forEach(z=>{ if(z.sls&&z.sls!=="keiner") add(`SLS ${z.sls} 3-polig`); }); }
    else if(f.typ==="v") add(`Verteilerfeld ${reihen?reihen+"-reihig":""}`.trim()); else add("Multimedia-Feld"); });
  if(zs.apz) add("APZ-Einbau 300 mm");
  return [...M].map(([t,n])=>`<div class="zs-mat"><b>${n}×</b><span>${esc(t)}</span></div>`).join(""); }
function zsKarte(L){ const zs=L.zs, zu=L.fertig;
  if(!zs||!zs.felder||!zs.felder.length) return `<section class="card zs-karte"><h3>Zählerschrank</h3><p class="meta">Zählerplätze, Zählerart, SLS, Zählernummern und APZ – Aufbau per Vorlage.</p>${zu?"":`<button type="button" class="btn-tonal" data-act="zsEinrichten">Zählerschrank einrichten</button>`}</section>`;
  const H=zsHinweise(zs);
  return `<section class="card zs-karte"><div class="card-kopf"><h3>Zählerschrank</h3>${zu?"":`<button type="button" class="btn-tonal" data-act="zsAufbau">Aufbau ändern</button>`}</div>
    <div class="zs-bild">${zsSvg(zs,L.reihen)}</div>
    ${H.length?`<div class="zs-hw">${H.map(h=>`<p>${icon("warn")}<span>${esc(h)}</span></p>`).join("")}</div>`:""}
    <div class="zs-zps">${zs.zp.map((z,i)=>`<button type="button" class="zs-zp" data-act="zsZpAuf" data-i="${i}" ${zu?"disabled":""}><span class="zs-zn">Z${i+1}</span><span class="zs-zt"><b>${esc(z.bez||zsTxt(ZS_ZWECK,z.zweck)||"Zählerplatz")}</b><small>${esc(zsZpText(z))}</small></span>${icon("chev")}</button>`).join("")}
      <button type="button" class="zs-zp" data-act="zsApzAuf" ${zu?"disabled":""}><span class="zs-zn zs-apzn">APZ</span><span class="zs-zt"><b>${zs.apz?"Abschlusspunkt Zählerplatz":"Kein APZ"}</b><small>${esc(zs.apz?zsApzText(zs):"Bestandsanlage")}</small></span>${icon("chev")}</button></div>
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
  L.zs=zsAbgleich(AW.zs); legSpeichern(L); awZu(); toast("Zählerschrank gespeichert"); }

document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act^="zs"]'); if(!b||b.disabled) return; e.stopPropagation(); const a=b.dataset.act;
  if(a==="zsEinrichten"){ zsBearbeiten("einr"); return; }
  if(a==="zsAufbau"){ zsBearbeiten("felder"); return; }
  if(a==="zsZpAuf"){ zsBearbeiten("zp",+b.dataset.i); return; }
  if(a==="zsApzAuf"){ zsBearbeiten("apz"); return; }
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
      if(AW.typ==="neu"){ AW.i++; awNeuZeigen(); } else if(AW.modus==="apz") zsSpeichern(); else { AW.i++; zsZeigen(); } return; }
  case "zsZweck": case "zsArt": case "zsSls": { const z=zsAktZp(); if(!z) return; z[{zsZweck:"zweck",zsArt:"art",zsSls:"sls"}[a]]=b.dataset.v;
      b.parentElement.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",x===b)); return; }
  case "zsWeiter": zsZpLesen(zsAktZp()); AW.i++; zsZeigen(); return;
  case "zsSpeichern": zsSpeichern(); return;
  } },true);
