/* Gerätebilder bleiben unverändert. Die Platzierung speichert Maße, Asset-ID und ein
   eingebettetes Bild: auch Druck, Projektexport und Offlinebetrieb brauchen keinen Server. */
const GK_INDEX=/*KATALOG_INDEX*/[];
const GK_PROFILE=/*KATALOG_PROFILE*/{};
const GK_ROOT=/*KATALOG_ROOT*/"";
const GK_MAP=new Map(GK_INDEX.map(a=>[a.id,a]));
let GK=null, GK_BLOCK=null;
const gkClone=v=>JSON.parse(JSON.stringify(v));
const gkZahl=n=>Number(n.toFixed(2)).toLocaleString("de-DE");
const gkURL=a=>new URL(GK_ROOT+a.file,location.href).href;
const gkSuch=v=>String(v||"").toLocaleLowerCase("de").normalize("NFD").replace(/[\u0300-\u036f]/g,"");
function gkFilter(items,q,manufacturer,category){ const words=gkSuch(q).split(/\s+/).filter(Boolean);return items.filter(a=>(!manufacturer||a.manufacturer===manufacturer)&&(!category||a.category===category)&&words.every(w=>gkSuch([a.manufacturer,a.model,a.article,a.series,a.category,...Object.values(a.params)].join(" ")).includes(w))); }
function gkOpen(target){ if(!legAkt()||legAkt().fertig)return; GK={target:target||null,q:"",manufacturer:"",category:"",limit:48,busy:false}; gkDialog(); }
function gkDialog(){
 const options=(key,label)=>`<label class="gk-field">${label}<select id="gk-${key}"><option value="">Alle</option>${[...new Set(GK_INDEX.map(a=>a[key]))].sort((a,b)=>a.localeCompare(b,"de")).map(v=>`<option value="${esc(v)}"${GK[key]===v?" selected":""}>${esc(v)}</option>`).join("")}</select></label>`;
 dialog("Gerätekatalog",`<div class="gk-filter"><label class="gk-field">Suche<input id="gk-q" type="search" placeholder="Hersteller, Gerät oder Artikelnummer" value="${esc(GK.q)}"></label>${options("manufacturer","Hersteller")}${options("category","Kategorie")}</div>${typeof BSP!=="undefined"&&BSP.liste&&!gkImSp()?`<p class="meta gk-fehlt">Die Gerätebilder liegen noch nicht im SharePoint. Der Entwickler lädt sie einmal hoch: Einstellungen › Labor › „Gerätekatalog-Bilder hochladen“.</p>`:""}<div id="gk-grid"></div>`,
 `<button class="btn-text" data-act="gkBlockNeu">Klemmblock planen</button><span style="flex:1"></span><button class="btn-tonal" data-act="awZu">Fertig</button>`,{breit:true});gkGrid();
}
function gkGrid(){ const el=document.getElementById("gk-grid");if(!el||!GK)return;
 const list=gkFilter(GK_INDEX,GK.q,GK.manufacturer,GK.category),shown=list.slice(0,GK.limit);
 el.innerHTML=`<p class="meta" role="status">${list.length} Varianten · ${shown.length} angezeigt</p><div class="aw-grid">${shown.map(a=>`<button type="button" class="aw-g" data-act="gkWahl" data-v="${a.id}"${GK.busy?" disabled":""}><span class="mat-foto aw-gb"><img loading="lazy" src="${esc(gkURL(a))}" alt="${esc(a.manufacturer+" "+a.model)}"></span><b>${esc(a.manufacturer)} · ${esc(a.model)}</b><small>${esc([a.article,...Object.values(a.params).slice(0,4)].filter(Boolean).join(" · "))}</small><small>${gkZahl(a.dimension.width)} × ${gkZahl(a.dimension.height)} mm${a.isExampleAssembly?" · Beispielaufbau":""}</small></button>`).join("")}</div>${list.length>shown.length?'<button class="btn-tonal" data-act="gkMehr">Weitere anzeigen</button>':""}${list.length?"":'<p class="meta">Keine Geräte gefunden.</p>'}`;
}
async function gkData(a){ const r=await fetch(gkURL(a));if(!r.ok)throw Error("Gerätebild konnte nicht geladen werden. Bitte online erneut versuchen.");const bytes=await r.arrayBuffer(),hash=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes)),n=>n.toString(16).padStart(2,"0")).join("");if(hash!==a.sha256)throw Error("Gerätebild ist unvollständig. Bitte erneut laden.");return new Promise((resolve,reject)=>{const reader=new FileReader;reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error("Bild konnte nicht gelesen werden."));reader.readAsDataURL(new Blob([bytes],{type:a.format==="SVG"?"image/svg+xml":"image/png"}));}); }
function gkPayload(a,data){ const d=a.dimension;if(!Number.isFinite(d.width)||d.width<=0||!Number.isFinite(d.height)||d.height<=0)throw Error("Gerätemaße fehlen.");return {schemaVersion:1,assetId:a.id,manufacturer:a.manufacturer,model:a.model,article:a.article,widthMm:d.width,heightMm:d.height,frontCenterMm:Number.isFinite(d.faceCenterFromTop)?d.faceCenterFromTop:d.height/2,data}; }
function gkTechnik(a){const p=a.params||{},rcd=a.type==="QD",sk=["QF","QFD"].includes(a.type),art=rcd?"rcd":sk?"sk":"ge",pole=sk&&/^(3|4)/.test(String(p.poles))?3:1;
 return {art,pole,schutz:rcd?[[p.amperage&&p.amperage+" A",p.residualCurrent&&p.residualCurrent+" mA"].filter(Boolean).join(" / "),p.RCDtype&&"Typ "+p.RCDtype].filter(Boolean).join(" "):sk?`${p.curve||""}${p.amperage||""}${a.type==="QFD"?" FI/LS":""}`:""};}
function gkPitch(L){return [17.5,18].includes(+L?.teMm)?+L.teMm:legGerTe(L||{});}
function gkTE(e,L){return e.katalog.widthMm/gkPitch(L||legAkt()||{});}
function gkExtents(row,L,H){const scale=LEG_P/gkPitch(L),a=row.g.filter(([e])=>e.katalog).map(([e])=>e.katalog);return {top:Math.min(0,...a.map(a=>H/2-a.frontCenterMm*scale)),bottom:Math.max(H,...a.map(a=>H/2+(a.heightMm-a.frontCenterMm)*scale))};}
function gkEintrag(a,payload,L){const tech=gkTechnik(a);return {id:uid(),...tech,kz:tech.art==="ge"?"":awKz(L,tech.art).kz,bez:[a.manufacturer,a.model].join(" "),te:payload.widthMm/gkPitch(L),katalog:payload};}
async function gkWahl(id){if(!GK||GK.busy)return;const state=GK,a=GK_MAP.get(id),L=legAkt();if(!a||!L||L.fertig)return;state.busy=true;gkGrid();
 try{const data=await gkData(a);if(GK!==state||!document.getElementById("gk-grid")||legAkt()?.id!==L.id)return;const payload=gkPayload(a,data);if(payload.widthMm> (+L.teReihe||12)*gkPitch(L)+.01)throw Error("Dieses Gerät ist breiter als die eingestellte Reihe. Bitte zuerst die Verteilerbreite ändern.");
 if(state.target){const old=legE(L).find(e=>e.id===state.target);if(!old)throw Error("Gerät ist nicht mehr vorhanden.");const tech=gkTechnik(a);if(old.art!==tech.art||(old.art==="sk"&&(+old.pole||1)!==tech.pole))throw Error("Bitte ein Gerät derselben Art und Polzahl wählen. Andere Geräte als neuen Eintrag einsetzen.");Object.assign(old,{katalog:payload,te:payload.widthMm/gkPitch(L)});if(tech.art!=="ge")Object.assign(old,{schutz:tech.schutz,pole:tech.pole});delete old.mat;delete old.klemmenProjekt;legSpeichern(L);render();}
 else awEinsetzen(gkEintrag(a,payload,L));toast(a.manufacturer+" "+a.model+" eingesetzt");if(state.target){awZu();GK=null;}else {state.busy=false;gkDialog();}
 }catch(err){toast(err.message);state.busy=false;gkGrid();}}
/* Exakt derselbe Maßstab wie die Reihe: Breite wird niemals auf eine volle TE gerundet.
   Der 45-mm-Frontbezug liegt in derselben Höhe wie der bisherige Editor. */
function gkBild(e,x,y0,P){const a=e.katalog,L=legAkt(),scale=P/gkPitch(L),mid=y0+P*400/92/2;
 return `<image href="${esc(a.data)}" x="${x}" y="${mid-a.frontCenterMm*scale}" width="${a.widthMm*scale}" height="${a.heightMm*scale}" preserveAspectRatio="xMidYMid meet"/>`; }
function gkDetail(id){const L=legAkt(),e=L&&legE(L).find(x=>x.id===id);if(!e||!e.katalog)return;
 const a=e.katalog;dialog(a.manufacturer+" "+a.model,`<div class="gk-preview"><img src="${esc(a.data)}" alt="Gerätefront"></div><p>${esc(a.article||"Keine bestätigte Artikelnummer")} · ${gkZahl(a.widthMm)} × ${gkZahl(a.heightMm)} mm</p>`,
 `<button class="btn-text" data-act="gkBeschriftung" data-id="${e.id}">Beschriftung</button>${e.klemmenProjekt?`<button class="btn-text" data-act="gkBlockEdit" data-id="${e.id}">Klemmen und Brücken</button>`:`<button class="btn-text" data-act="gkErsetzen" data-id="${e.id}">Ersetzen</button>`}<span style="flex:1"></span><button class="btn-tonal" data-act="awZu">Schließen</button>`,{breit:true});}
function gkBlockNeu(id){const L=legAkt();if(!L||L.fertig)return;const entry=id&&legE(L).find(e=>e.id===id);GK_BLOCK={target:id||null,p:entry?gkClone(entry.klemmenProjekt):{schemaVersion:1,units:"mm",title:"Klemmblock",labelMode:"manual",showBridges:true,terminals:[gkTerminal()],bridges:[]},undo:[],redo:[],data:null};gkBlockDialog();}
function gkTerminal(){return {id:uid(),manufacturer:"WAGO",profile:"wago_2004_1201",netId:"",rcdGroup:"",label:{text:"",locked:false}};}
function gkBlockChange(fn){const s=GK_BLOCK,old=s.editBefore||gkClone(s.p);s.editBefore=null;try{fn(s.p);KlemmenEngine.validate(s.p,GK_PROFILE);s.undo.push(old);s.redo=[];gkBlockDialog();}catch(err){s.p=old;toast(err.message);gkBlockDialog();}}
function gkBlockDialog(){const s=GK_BLOCK;if(!s)return;const p=s.p,opts=p.terminals.map(t=>`<option value="${t.id}">${esc(t.label.text||t.id)}</option>`).join("");
 dialog("Klemmblock",`<p class="meta">WAGO 2004-1201 · 6,2 mm. Brücken 2004-402 zwischen direkt benachbarten Klemmen. Das Profil ist eine visuelle Planungsvorlage.</p><div id="gk-block-preview" class="gk-block-preview"></div><div class="gk-toolbar"><button class="btn-tonal" data-act="gkTAdd">Klemme hinzufügen</button><button class="btn-text" data-act="gkNum">Nummerieren</button><button class="btn-text" data-act="gkUndo"${s.undo.length?"":" disabled"}>Rückgängig</button><button class="btn-text" data-act="gkRedo"${s.redo.length?"":" disabled"}>Wiederholen</button></div><div class="gk-terminal-list">${p.terminals.map((t,i)=>`<div class="gk-terminal"><b>${i+1}</b><label class="gk-field">Beschriftung<input data-gk-t="${t.id}" data-gk-field="label" value="${esc(t.label.text)}"></label><label class="gk-field">Netz-ID<input data-gk-t="${t.id}" data-gk-field="netId" value="${esc(t.netId)}"></label><label class="gk-field">RCD-Gruppe<input data-gk-t="${t.id}" data-gk-field="rcdGroup" value="${esc(t.rcdGroup)}"></label><label><input type="checkbox" data-gk-t="${t.id}" data-gk-field="locked"${t.label.locked?" checked":""}> Fest</label><button class="btn-text" data-act="gkTCopy" data-id="${t.id}">Kopieren</button><button class="btn-text" data-act="gkTDel" data-id="${t.id}"${p.terminals.length===1?" disabled":""}>Entfernen</button></div>`).join("")}</div><h3>Brücken</h3><p class="meta">Netz-ID und RCD-Gruppe werden ausdrücklich an den Klemmen gesetzt. Eine Beschriftung verbindet keine Netze.</p><div class="gk-filter"><label class="gk-field">Von<select id="gk-von">${opts}</select></label><label class="gk-field">Nach<select id="gk-nach">${opts}</select></label><label class="gk-field">Schacht<select id="gk-slot"><option>A</option><option>B</option></select></label><button class="btn-tonal" data-act="gkBAdd">Brücke einsetzen</button></div>${p.bridges.map(b=>`<p>2004-402 · ${b.contacts.map(c=>esc(p.terminals.find(t=>t.id===c.terminalId)?.label.text||c.terminalId)+" / "+c.slotId).join(" ↔ ")} <button class="btn-text" data-act="gkBDel" data-id="${b.id}">Entfernen</button></p>`).join("")}`,
 `<button class="btn-text" data-act="gkBlockSvg">SVG exportieren</button><span style="flex:1"></span><button class="btn-text" data-act="awZu">Abbrechen</button><button class="btn-tonal" data-act="gkBlockSave">Übernehmen</button>`,{breit:true});gkBlockPreview();}
async function gkBlockPreview(){const state=GK_BLOCK;if(!state)return;try{if(!state.data)state.data=await gkData(GK_MAP.get(GK_PROFILE.wago_2004_1201.assetId));if(GK_BLOCK!==state)return;const el=document.getElementById("gk-block-preview");if(el)el.innerHTML=KlemmenEngine.render(state.p,GK_PROFILE,{[GK_PROFILE.wago_2004_1201.assetId]:state.data});}catch(err){toast(err.message);}}
function gkBlockSvg(){const s=GK_BLOCK;if(!s?.data)throw Error("Gerätebild wird noch geladen.");return KlemmenEngine.render(s.p,GK_PROFILE,{[GK_PROFILE.wago_2004_1201.assetId]:s.data});}
function gkDownload(text,name,type){const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
document.addEventListener("input",ev=>{const t=ev.target;if(t.id==="gk-q"&&GK){GK.q=t.value;GK.limit=48;gkGrid();}
 if(t.dataset.gkT&&GK_BLOCK&&t.type!=="checkbox"){const s=GK_BLOCK,a=s.p.terminals.find(a=>a.id===t.dataset.gkT);if(!a)return;s.editBefore=s.editBefore||gkClone(s.p);if(t.dataset.gkField==="label")a.label.text=t.value;else a[t.dataset.gkField]=t.value;gkBlockPreview();}});
document.addEventListener("change",ev=>{const t=ev.target;if(GK&&["gk-manufacturer","gk-category"].includes(t.id)){GK[t.id.slice(3)]=t.value;GK.limit=48;gkGrid();}
 if(t.dataset.gkT&&GK_BLOCK)gkBlockChange(p=>{const a=p.terminals.find(a=>a.id===t.dataset.gkT),k=t.dataset.gkField;if(k==="label")a.label.text=t.value;else if(k==="locked")a.label.locked=t.checked;else a[k]=t.value;});});
document.addEventListener("click",ev=>{const b=ev.target.closest?.('[data-act^="gk"],[data-act="legProdukt"]');if(!b||b.disabled)return;const act=b.dataset.act,id=b.dataset.id;
 if(act==="legProdukt"){const e=legAkt()&&legE(legAkt()).find(e=>e.id===id);if(!e?.katalog)return;ev.stopImmediatePropagation();gkDetail(id);return;}
 ev.stopImmediatePropagation();ev.preventDefault();try{switch(act){
 case "gkOpen":gkOpen();break;case "gkMehr":GK.limit+=48;gkGrid();break;case "gkWahl":gkWahl(b.dataset.v);break;
 case "gkErsetzen":gkOpen(id);break;case "gkBeschriftung":legSkDlg(id);break;
 case "gkBlockNeu":gkBlockNeu();break;case "gkBlockEdit":gkBlockNeu(id);break;
 case "gkTAdd":gkBlockChange(p=>p.terminals.push(gkTerminal()));break;
 case "gkTCopy":gkBlockChange(p=>{const i=p.terminals.findIndex(t=>t.id===id),t=gkClone(p.terminals[i]);t.id=uid();t.netId="";t.rcdGroup="";p.terminals.splice(i+1,0,t);});break;
 case "gkTDel":gkBlockChange(p=>{p.terminals=p.terminals.filter(t=>t.id!==id);p.bridges=p.bridges.filter(b=>!b.contacts.some(c=>c.terminalId===id));});break;
 case "gkNum":gkBlockChange(p=>p.terminals.forEach((t,i)=>{if(!t.label.locked)t.label.text=String(i+1);}));break;
 case "gkBAdd":gkBlockChange(p=>p.bridges.push({id:uid(),article:"2004-402",contacts:[{terminalId:document.getElementById("gk-von").value,slotId:document.getElementById("gk-slot").value},{terminalId:document.getElementById("gk-nach").value,slotId:document.getElementById("gk-slot").value}]}));break;
 case "gkBDel":gkBlockChange(p=>{p.bridges=p.bridges.filter(b=>b.id!==id);});break;
 case "gkUndo":case "gkRedo":{const s=GK_BLOCK,from=act==="gkUndo"?s.undo:s.redo,to=act==="gkUndo"?s.redo:s.undo;if(from.length){to.push(gkClone(s.p));s.p=from.pop();gkBlockDialog();}break;}
 case "gkBlockSvg":gkDownload(gkBlockSvg(),"Klemmblock.svg","image/svg+xml");break;
 case "gkBlockSave":{const L=legAkt(),s=GK_BLOCK;if(!L||L.fertig)break;const svg=gkBlockSvg(),width=s.p.terminals.length*6.2;if(width>(+L.teReihe||12)*gkPitch(L)+.01)throw Error("Klemmblock ist breiter als die Reihe.");const payload={schemaVersion:1,assetId:"block-"+(s.target||uid()),manufacturer:"WAGO",model:"Klemmblock",article:null,widthMm:width,heightMm:52.3,frontCenterMm:26.15,data:"data:image/svg+xml;base64,"+btoa(unescape(encodeURIComponent(svg)))};const e={id:s.target||uid(),art:"ge",kz:"",bez:"WAGO Klemmblock",te:width/gkPitch(L),katalog:payload,klemmenProjekt:gkClone(s.p)};if(s.target){const old=legE(L).find(t=>t.id===s.target);if(!old)throw Error("Klemmblock fehlt.");Object.assign(old,{katalog:payload,klemmenProjekt:e.klemmenProjekt,te:e.te});legSpeichern(L);render();}else awEinsetzen(e);GK_BLOCK=null;awZu();break;}
 }}catch(err){toast(err.message);}
},true);

/* ===== Katalogbilder in den SharePoint laden (Entwickler, 28.11.2026) =====
   Die Bilder liegen nicht öffentlich auf dem Server. Der Entwickler wählt einmal den Ordner „Katalog“ vom Laptop; jede SVG-/PNG-Datei wird
   über ihre SHA-256-Prüfsumme einem Eintrag des Index zugeordnet und als „katalog~assets~<id>.<endung>“ nach „_App/Bilder“ geladen.
   Schon vorhandene Bilder werden übersprungen. Danach liefert der Service Worker sie wie alle Produktbilder aus (nur nach der Anmeldung). */
const GK_HOCH={laeuft:false,gesamt:0,fertig:0,neu:0,da:0,fremd:0,fehler:0};
const gkSpName=a=>bspName("/bilder/katalog/"+a.file);
function gkImSp(){ const L=(typeof BSP!=="undefined"&&BSP.liste)||{}; return GK_INDEX.filter(a=>L[bspPfad(gkSpName(a))]).length; }
function gkUploadZeile(){ if(!GK_INDEX.length) return ""; const n=gkImSp(), U=GK_HOCH;
  return `<div class="li" role="button" tabindex="0" data-act="gkHoch"><span class="av">${icon("upload")}</span><span class="lt"><span class="h">Gerätekatalog-Bilder hochladen</span><span class="s">${esc(U.laeuft?`Läuft … ${U.fertig} von ${U.gesamt} Dateien geprüft · ${U.neu} hochgeladen`:`${n.toLocaleString("de-DE")} von ${GK_INDEX.length.toLocaleString("de-DE")} im SharePoint – Ordner „Katalog“ vom Laptop wählen`)}</span></span>${icon("chev")}</div>`; }
async function gkHochladen(files){ const U=GK_HOCH; if(U.laeuft) return;
  if(typeof SYNC_ON==="undefined"||!SYNC_ON||!ME.signedIn){ toast("Erst mit dem Firmenkonto anmelden"); return; }
  const F=[...files].filter(f=>/\.(svg|png)$/i.test(f.name)); if(!F.length){ toast("Im gewählten Ordner sind keine SVG- oder PNG-Dateien"); return; }
  Object.assign(U,{laeuft:true,gesamt:F.length,fertig:0,neu:0,da:0,fremd:0,fehler:0}); toast(`${F.length.toLocaleString("de-DE")} Dateien werden geprüft …`);
  const nachHash=new Map(); GK_INDEX.forEach(a=>{ if(!nachHash.has(a.sha256)) nachHash.set(a.sha256,[]); nachHash.get(a.sha256).push(a); });
  try{ await bspListe(true); const L=BSP.liste||{}; await syncRoot(); const fid=await folderId(BSP_ORDNER,BSP_BIB);
    const arbeit=async()=>{ while(F.length){ const f=F.shift();
      try{ const buf=await f.arrayBuffer(), h=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",buf)),n=>n.toString(16).padStart(2,"0")).join(""), A=nachHash.get(h);
        if(!A){ U.fremd++; continue; }
        for(const a of A){ const name=gkSpName(a); if(L[bspPfad(name)]){ U.da++; continue; }
          const r=await g(`/drives/${fid}:/${encodeURIComponent(name)}:/content`,{method:"PUT",headers:{"Content-Type":/\.svg$/i.test(a.file)?"image/svg+xml":"image/png"},body:new Blob([buf])});
          if(r.ok){ U.neu++; L[bspPfad(name)]=1; } else U.fehler++; } }
      catch(e){ U.fehler++; }
      finally{ U.fertig++; if(U.fertig%40===0&&typeof nav!=="undefined"&&nav.v==="labor") render(); } } };
    await Promise.all([arbeit(),arbeit(),arbeit(),arbeit()]);
  }catch(e){ toast("Hochladen abgebrochen: "+(e.message||e)); }
  U.laeuft=false; await bspListe(true);
  toast(`${U.neu.toLocaleString("de-DE")} hochgeladen · ${U.da.toLocaleString("de-DE")} waren schon da${U.fremd?` · ${U.fremd} gehören nicht zum Katalog`:""}${U.fehler?` · ${U.fehler} Fehler`:""}`);
  if(typeof nav!=="undefined"&&nav.v==="labor") render(); }
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act="gkHoch"]'); if(!b) return; e.preventDefault(); e.stopPropagation();
  if(typeof istEntwickler!=="function"||!istEntwickler()) return;
  if(GK_HOCH.laeuft){ toast(`Läuft noch … ${GK_HOCH.fertig} von ${GK_HOCH.gesamt}`); return; }
  const i=document.createElement("input"); i.type="file"; i.multiple=true; i.webkitdirectory=true; i.hidden=true; document.body.appendChild(i);
  i.onchange=()=>{ const fs=i.files; i.remove(); if(fs&&fs.length) gkHochladen(fs); }; i.click(); },true);
