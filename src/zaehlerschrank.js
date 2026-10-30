/* ===== Zählerschrank: Felder (Zählerfeld, Verteilerfeld, APZ/RfZ, Multimedia) und Zählerplätze =====
   Liegt am Verteiler als zs = {felder:[{id,typ:"z"|"v"|"a"|"m"}], zp:[{id,feldId,zweck,art,sls,nr,bez}]}.
   Jedes Zählerfeld hat genau einen Zählerplatz. Aufbau per Vorlage, danach anpassbar; je Zählerplatz ein Fenster.
   Wird im Assistenten (vt-aufnahme.js, Art „Zählerschrank / HV“) und auf der Verteilerseite (Karte „Zählerschrank“) benutzt. */
const ZS_TYP={z:"Zählerfeld",v:"Verteilerfeld",a:"APZ / RfZ",m:"Multimedia"}, ZS_TYP_KURZ={z:"Zähler",v:"Verteiler",a:"APZ",m:"Media"};
const ZS_VORL=[["1z","1 Zähler","Zählerfeld · Verteilerfeld · APZ",["z","v","a"]],["2z","2 Zähler","2 Zählerfelder · Verteilerfeld · APZ",["z","z","v","a"]],
  ["2zm","2 Zähler mit Multimedia","2 Zählerfelder · Verteilerfeld · APZ · Multimedia",["z","z","v","a","m"]],["2z2v","2 Zähler, 2 Verteilerfelder","z. B. Zweifamilienhaus",["z","z","v","v","a"]],
  ["3z","3 Zähler","z. B. Haushalt, Wärmepumpe, Wallbox",["z","z","z","v","a"]]];
const ZS_ZWECK=[["haushalt","Haushalt"],["wp","Wärmepumpe"],["wallbox","Wallbox"],["pv","PV / Einspeisung"],["allgemein","Allgemein"],["gewerbe","Gewerbe"]];
const ZS_ART=[["ehz","eHZ","Stecktechnik"],["3pkt","3-Punkt","Schraubbefestigung"]];
const ZS_SLS=[["E35","SLS E35"],["E40","SLS E40"],["E50","SLS E50"],["E63","SLS E63"],["keiner","Keiner / weiß nicht"]];
const zsTxt=(L,k)=>(L.find(x=>x[0]===k)||[])[1]||"";
function zsAusVorlage(k){ const v=ZS_VORL.find(x=>x[0]===k)||ZS_VORL[0]; const zs={felder:v[3].map(t=>({id:uid(),typ:t})),zp:[]}; zsAbgleich(zs); return zs; }
/* Zählerplätze an die Zählerfelder angleichen (Reihenfolge wie die Felder, Vorschlag für den Zweck) */
function zsAbgleich(zs){ const alt=zs.zp||[]; let n=0;
  zs.zp=zs.felder.filter(f=>f.typ==="z").map(f=>{ const z=alt.find(x=>x.feldId===f.id); n++; return z||{id:uid(),feldId:f.id,zweck:n===1?"haushalt":n===2?"wp":"wallbox",art:"ehz",sls:"E35",nr:"",bez:""}; });
  return zs; }
const zsKopie=zs=>JSON.parse(JSON.stringify(zs||{felder:[],zp:[]}));
function zsZpText(z){ return [zsTxt(ZS_ART,z.art),z.sls&&z.sls!=="keiner"?"SLS "+z.sls:"",z.nr?"Nr. "+z.nr:"Nummer fehlt"].filter(Boolean).join(" · "); }
const zsZpName=(z,i)=>`Zähler ${i+1} · ${z.bez||zsTxt(ZS_ZWECK,z.zweck)||"?"}`;

/* Vorderansicht: Felder nebeneinander, Zählerplätze nummeriert */
function zsSvg(zs,reihen,klein,aktiv){ const F=zs.felder, W=64, G=4, H=150, w=F.length*(W+G)+G, r=Math.max(1,Math.min(+reihen||4,6)); let zn=0;
  const feld=(f,i)=>{ const x=G+i*(W+G), y=4; let inn="";
    if(f.typ==="z"){ zn++; inn=`<rect x="${x+14}" y="${y+12}" width="${W-28}" height="12" rx="2" class="e"/><rect x="${x+10}" y="${y+40}" width="${W-20}" height="56" rx="4" class="e"/><rect x="${x+18}" y="${y+50}" width="${W-36}" height="12" rx="1" class="d"/><text x="${x+W/2}" y="${y+124}" class="t">Z${zn}</text>`; }
    else if(f.typ==="v") inn=Array.from({length:r},(_,k)=>{ const h=Math.min(14,(H-28)/r-8); return `<rect x="${x+8}" y="${(y+14+k*((H-24)/r)).toFixed(1)}" width="${W-16}" height="${h.toFixed(1)}" rx="2" class="e"/>`; }).join("");
    else if(f.typ==="a") inn=`<rect x="${x+8}" y="${y+12}" width="${W-16}" height="48" rx="3" class="d"/>${[0,1,2].map(k=>`<path d="M${x+14} ${y+24+k*12}h${W-28}" class="l"/>`).join("")}<rect x="${x+8}" y="${y+72}" width="${W-16}" height="62" rx="3" class="e"/><text x="${x+W/2}" y="${y+108}" class="t s">APZ</text>`;
    else inn=[0,1,2].flatMap(k=>[0,1].map(j=>`<rect x="${x+10+j*24}" y="${y+16+k*40}" width="20" height="30" rx="3" class="e"/>`)).join("");
    return `<rect x="${x}" y="${y}" width="${W}" height="${H}" rx="6" class="f${aktiv&&f.id===aktiv?" an":""}"/>${inn}${klein?"":`<text x="${x+W/2}" y="${y+H+16}" class="t u">${ZS_TYP_KURZ[f.typ]}</text>`}`; };
  return `<svg class="zs-svg${klein?" klein":""}" viewBox="0 0 ${w} ${klein?H+8:H+24}" style="max-width:${F.length*(klein?28:96)}px" aria-hidden="true">${F.map(feld).join("")}</svg>`; }

/* ---- Fenster für den Assistenten (liefern Inhalt + Fuß für awRahmen) ---- */
function zsAufbauFenster(zs){ return {frage:"Wie ist der Schrank aufgebaut?",hinweis:"Vorlage antippen – Felder lassen sich danach ändern.",
  inhalt:`<div class="aw-liste">${ZS_VORL.map(([k,t,s,f])=>awKachel("zsVorl",k,zsSvg({felder:f.map(x=>({typ:x}))},4,true),t,s)).join("")}${awKachel("zsVorl","eigen",awSvg("frei"),"Selbst zusammenstellen","Feld für Feld")}</div>`}; }
function zsFelderFenster(zs,reihen,weiterAct,weiterTxt){ return {frage:"Welche Felder, von links nach rechts?",
  inhalt:`<div class="zs-bild">${zsSvg(zs,reihen)}</div><div class="zs-felder">${zs.felder.map((f,i)=>`<div class="zs-feld"><span class="zs-fnr">${i+1}</span><div class="zs-ftyp" role="group">${Object.keys(ZS_TYP).map(t=>`<button type="button" data-act="zsTyp" data-i="${i}" data-v="${t}" aria-pressed="${f.typ===t}">${ZS_TYP_KURZ[t]}</button>`).join("")}</div><button type="button" class="icon-btn" data-act="zsFeldWeg" data-i="${i}" aria-label="Feld ${i+1} entfernen" ${zs.felder.length<2?"disabled":""}>${icon("del")}</button></div>`).join("")}</div>
    <button type="button" class="aw-unbek zs-plus" data-act="zsFeldPlus">${icon("add")}Feld anhängen</button>`,
  fuss:`<span style="flex:1"></span><button type="button" class="btn-filled" data-act="${weiterAct}">${weiterTxt}</button>`}; }
function zsZpFenster(zs,i,weiterAct,weiterTxt){ const z=zs.zp[i]; if(!z) return null;
  const gr=(lbl,act,L,cur)=>`<div class="aw-lbl">${lbl}</div><div class="aw-wahl">${L.map(([k,t])=>`<button type="button" data-act="${act}" data-v="${k}" aria-pressed="${cur===k}">${esc(t)}</button>`).join("")}</div>`;
  return {frage:`Zähler ${i+1}`,hinweis:zs.zp.length>1?`Zählerfeld ${zs.felder.findIndex(f=>f.id===z.feldId)+1} von links`:"",
    inhalt:`<div class="zs-bild">${zsSvg(zs,4,false,z.feldId)}</div>${gr("Wofür","zsZweck",ZS_ZWECK,z.zweck)}${gr("Zählerart","zsArt",ZS_ART,z.art)}${gr("SLS / Hauptschalter","zsSls",ZS_SLS,z.sls)}
      <div class="fg1 aw-eigen">${tf("zsBez","Bezeichnung (optional)",z.bez||"",{form:true,ph:"z. B. Wohnung EG"})}</div>
      <div class="fg1 aw-eigen">${tf("zsNr","Zählernummer (optional)",z.nr||"",{form:true,ph:"steht auf dem Zähler, z. B. 1EBZ01…"})}</div>`,
    fuss:`<span style="flex:1"></span><button type="button" class="btn-filled" data-act="${weiterAct}">${weiterTxt}</button>`}; }
/* Eingaben des Zählerplatz-Fensters übernehmen */
function zsZpLesen(z){ const b=document.getElementById("f_zsBez"), n=document.getElementById("f_zsNr"); if(b) z.bez=b.value.trim(); if(n) z.nr=n.value.trim().replace(/\s+/g," "); }

/* ---- Karte auf der Verteilerseite ---- */
function zsMaterial(zs,reihen){ const M=new Map(), add=t=>M.set(t,(M.get(t)||0)+1);
  zs.felder.forEach(f=>{ if(f.typ==="z"){ const z=zs.zp.find(x=>x.feldId===f.id)||{}; add(`Zählerfeld ${zsTxt(ZS_ART,z.art)||""}`.trim()); if(z.sls&&z.sls!=="keiner") add(`SLS ${z.sls} 3-polig`); }
    else if(f.typ==="v") add(`Verteilerfeld ${reihen?reihen+"-reihig":""}`.trim()); else if(f.typ==="a") add("APZ-Feld mit RfZ"); else add("Multimedia-Feld"); });
  return [...M].map(([t,n])=>`<div class="zs-mat"><b>${n}×</b><span>${esc(t)}</span></div>`).join(""); }
function zsKarte(L){ const zs=L.zs, zu=L.fertig;
  if(!zs||!zs.felder||!zs.felder.length) return `<section class="card zs-karte"><h3>Zählerschrank</h3><p class="meta">Zählerplätze, Zählerart, SLS und Zählernummern – Aufbau per Vorlage.</p>${zu?"":`<button type="button" class="btn-tonal" data-act="zsEinrichten">Zählerschrank einrichten</button>`}</section>`;
  return `<section class="card zs-karte"><div class="card-kopf"><h3>Zählerschrank</h3>${zu?"":`<button type="button" class="btn-tonal" data-act="zsAufbau">Aufbau ändern</button>`}</div>
    <div class="zs-bild">${zsSvg(zs,L.reihen)}</div>
    <div class="zs-zps">${zs.zp.map((z,i)=>`<button type="button" class="zs-zp" data-act="zsZpAuf" data-i="${i}" ${zu?"disabled":""}><span class="zs-zn">Z${i+1}</span><span class="zs-zt"><b>${esc(z.bez||zsTxt(ZS_ZWECK,z.zweck)||"Zählerplatz")}</b><small${z.nr?"":' class="fehlt"'}>${esc(zsZpText(z))}</small></span>${icon("chev")}</button>`).join("")}</div>
    <div class="aw-lbl">Material</div><div class="zs-mats">${zsMaterial(zs,L.reihen)}</div>
    <p class="meta zs-hinweis">Artikelnummern folgen, sobald die Zählerschrank-Artikel in der Materialliste stehen.</p></section>`; }

/* ---- Bearbeiten von der Karte aus: eigenes kleines Ablaufmodell im Assistenten-Rahmen ---- */
function zsBearbeiten(modus,i){ const L=legAkt(); if(!L) return;
  AW={typ:"zs",modus,i:i||0,zs:modus==="einr"?zsAusVorlage("1z"):zsKopie(L.zs),schritte:null,reihen:L.reihen};
  if(modus==="einr"){ AW.schritte=["aufbau"]; } zsZeigen(); }
function zsZeigen(){ const L=legAkt(); if(!L||!AW) return; const R={titel:"Zählerschrank",unter:L.titel||"",schritt:0,schritte:0};
  if(AW.modus==="felder") return awRahmen({...R,...zsFelderFenster(AW.zs,AW.reihen,"zsSpeichern","Speichern")});
  if(AW.modus==="zp") return awRahmen({...R,...zsZpFenster(AW.zs,AW.i,"zsSpeichern","Speichern")});
  /* einrichten: Aufbau → (Felder) → Zählerplätze */
  const S=AW.schritte, sk=S[AW.i], R2={...R,schritt:AW.i,schritte:S.length}, letzt=AW.i===S.length-1;
  if(sk==="aufbau") return awRahmen({...R2,...zsAufbauFenster(AW.zs)});
  if(sk==="felder") return awRahmen({...R2,...zsFelderFenster(AW.zs,AW.reihen,"zsWeiter","Weiter")});
  const n=+sk.slice(2); return awRahmen({...R2,...zsZpFenster(AW.zs,n,letzt?"zsSpeichern":"zsWeiter",letzt?"Speichern":"Weiter")}); }
const zsSchritte=(zs,eigen)=>[...(eigen?["felder"]:[]),...zs.zp.map((_,i)=>"zp"+i)];
/* aktueller Zählerschrank im Assistenten: beim neuen Verteiler AW.d.zs, sonst AW.zs */
const zsAkt=()=>AW?(AW.typ==="neu"?AW.d.zs:AW.zs):null;
const zsAktZp=()=>{ const zs=zsAkt(); if(!zs) return null; if(AW.typ==="neu"){ const sk=awNeuSchritte()[AW.i]||""; return sk.startsWith("zp")?zs.zp[+sk.slice(2)]:null; }
  if(AW.modus==="zp") return zs.zp[AW.i]; const sk=(AW.schritte||[])[AW.i]||""; return sk.startsWith("zp")?zs.zp[+sk.slice(2)]:null; };
function zsNeuZeichnen(){ if(!AW) return; if(AW.typ==="neu") awNeuZeigen(); else zsZeigen(); }
function zsSpeichern(){ const L=legAkt(); if(!L||!AW) return; const z=zsAktZp(); if(z) zsZpLesen(z);
  L.zs=zsAbgleich(AW.zs); legSpeichern(L); awZu(); toast("Zählerschrank gespeichert"); }

document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act^="zs"]'); if(!b||b.disabled) return; e.stopPropagation(); const a=b.dataset.act;
  if(a==="zsEinrichten"){ zsBearbeiten("einr"); return; }
  if(a==="zsAufbau"){ zsBearbeiten("felder"); return; }
  if(a==="zsZpAuf"){ zsBearbeiten("zp",+b.dataset.i); return; }
  const zs=zsAkt(); if(!zs) return;
  switch(a){
  case "zsVorl": { const k=b.dataset.v, neu=k==="eigen"?(zs.felder.length?zs:zsAusVorlage("1z")):zsAusVorlage(k);
      if(AW.typ==="neu"){ AW.d.zs=neu; AW.d.zsEigen=k==="eigen"; AW.i++; awNeuZeigen(); }
      else { AW.zs=neu; AW.schritte=["aufbau",...zsSchritte(neu,k==="eigen")]; AW.i++; zsZeigen(); } return; }
  case "zsTyp": zs.felder[+b.dataset.i].typ=b.dataset.v; zsAbgleich(zs); if(AW.typ==="zs"&&AW.schritte) AW.schritte=["aufbau",...zsSchritte(zs,true)]; zsNeuZeichnen(); return;
  case "zsFeldWeg": zs.felder.splice(+b.dataset.i,1); zsAbgleich(zs); if(AW.typ==="zs"&&AW.schritte) AW.schritte=["aufbau",...zsSchritte(zs,true)]; zsNeuZeichnen(); return;
  case "zsFeldPlus": zs.felder.push({id:uid(),typ:"z"}); zsAbgleich(zs); if(AW.typ==="zs"&&AW.schritte) AW.schritte=["aufbau",...zsSchritte(zs,true)]; zsNeuZeichnen(); return;
  case "zsZweck": case "zsArt": case "zsSls": { const z=zsAktZp(); if(!z) return; const k={zsZweck:"zweck",zsArt:"art",zsSls:"sls"}[a]; z[k]=b.dataset.v;
      b.parentElement.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",x===b)); return; }
  case "zsWeiter": { const z=zsAktZp(); if(z) zsZpLesen(z); AW.i++; zsZeigen(); return; }
  case "zsSpeichern": zsSpeichern(); return;
  } },true);
