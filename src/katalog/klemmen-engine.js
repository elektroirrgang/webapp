(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.KlemmenEngine=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
function layout(project,profiles){let x=0;const ids=new Set;return project.terminals.map(t=>{if(ids.has(t.id))throw Error('Doppelte Klemmen-ID: '+t.id);ids.add(t.id);const p=profiles[t.profile];if(!p)throw Error('Unbekanntes Profil: '+t.profile);const a={...t,xMm:x,profileData:p};x+=p.widthMm;return a;});}
function validate(project,profiles){
 if(!project||project.schemaVersion!==1||project.units!=='mm'||!Array.isArray(project.terminals)||project.terminals.length===0||!Array.isArray(project.bridges))throw Error('Ungültiges Projektformat.');
 const ts=layout(project,profiles),byId=new Map(ts.map(t=>[t.id,t])),used=new Set,bridgeIds=new Set;
 for(const b of project.bridges){if(bridgeIds.has(b.id))throw Error('Doppelte Brücken-ID: '+b.id);bridgeIds.add(b.id);if(!b.contacts||b.contacts.length!==2)throw Error('Dieses Profil unterstützt ausschließlich Zweifach-Brücker.');
  const contacts=b.contacts.map(c=>{const t=byId.get(c.terminalId);if(!t)throw Error('Unbekannte Klemme: '+c.terminalId);const slot=t.profileData.slots[c.slotId];if(!slot)throw Error('Unbekannter Brückenschacht: '+c.slotId);if(!slot.allowedBridgeArticles.includes(b.article))throw Error('Brückenartikel passt nicht zum Schachtprofil.');const key=t.id+':'+c.slotId;if(used.has(key))throw Error('Brückenschacht bereits belegt: '+key);used.add(key);return {t,slot,c};});
  const [a,z]=contacts;if(a.t.id===z.t.id)throw Error('Brücke muss zwei verschiedene Klemmen verbinden.');
  if(a.t.manufacturer!==a.t.profileData.manufacturer||z.t.manufacturer!==z.t.profileData.manufacturer)throw Error('Hersteller stimmt nicht mit dem Profil überein.');
  if(a.t.manufacturer!==z.t.manufacturer)throw Error('Keine herstellerübergreifende Brücke.');
  if(a.t.netId!==z.t.netId)throw Error('Unterschiedliche Netze dürfen nicht automatisch verbunden werden.');
  if(!a.t.netId)throw Error('Explizite Netz-ID fehlt.');if(a.t.rcdGroup!==z.t.rcdGroup)throw Error('Unterschiedliche RCD-Gruppen.');
  const pitch=a.slot.pitchMm,dx=Math.abs((a.t.xMm+a.slot.xMm)-(z.t.xMm+z.slot.xMm));
  if(Math.abs(dx-pitch)>.01||Math.abs(a.slot.pitchMm-z.slot.pitchMm)>.01)throw Error('Raster stimmt nicht: nur direkt benachbarte kompatible Klemmen.');
  if(Math.abs(a.slot.yMm-z.slot.yMm)>.01)throw Error('Brückenschächte liegen nicht auf gleicher Höhe.');
 }
 return ts;
}
function labelSvg(t,index,mode){
 const p=t.profileData,m=p.marker,raw=t.label?.text??(mode==='number'?String(index+1):t.id),lines=String(raw).split('\n').slice(0,2),font=Math.min(2.5,m.heightMm/(lines.length+1),m.widthMm/(Math.max(1,...lines.map(s=>[...s].length))*.62));
 return `<g data-label-for="${esc(t.id)}"><clipPath id="label-${index}"><rect x="${t.xMm+m.xMm}" y="${m.yMm}" width="${m.widthMm}" height="${m.heightMm}"/></clipPath><rect x="${t.xMm+m.xMm}" y="${m.yMm}" width="${m.widthMm}" height="${m.heightMm}" fill="#fffef9" stroke="#d1d6cc" stroke-width=".08"/><g clip-path="url(#label-${index})">${lines.map((line,j)=>`<text x="${t.xMm+m.xMm+m.widthMm/2}" y="${m.yMm+m.heightMm/2+(j-(lines.length-1)/2)*font*1.15+font*.34}" font-family="Arial,sans-serif" font-size="${font}" text-anchor="middle" fill="#202a22">${esc(line)}</text>`).join('')}</g></g>`;
}
function render(project,profiles,assets){
 const ts=validate(project,profiles),width=ts.reduce((n,t)=>n+t.profileData.widthMm,0),height=Math.max(...ts.map(t=>t.profileData.heightMm));let body='';
 for(const [i,t]of ts.entries()){const p=t.profileData,asset=assets[p.assetId];if(!asset)throw Error('SVG-Datei fehlt: '+p.assetId);body+=`<image x="${t.xMm}" y="0" width="${p.widthMm}" height="${p.heightMm}" href="${asset}"/>`+labelSvg(t,i,project.labelMode);}
 if(project.showBridges!==false)for(const b of project.bridges){const cs=b.contacts.map(c=>{const t=ts.find(t=>t.id===c.terminalId);return{x:t.xMm+t.profileData.slots[c.slotId].xMm,y:t.profileData.slots[c.slotId].yMm};}).sort((a,b)=>a.x-b.x);body+=`<g data-bridge-id="${esc(b.id)}" data-article="${esc(b.article)}"><rect x="${cs[0].x-1}" y="${cs[0].y-.85}" width="${cs[1].x-cs[0].x+2}" height="1.9" rx=".18" fill="#d7dcd2" stroke="#73806d" stroke-width=".12"/><path d="M${cs[0].x-.6} ${cs[0].y-.5}H${cs[1].x+.6}" stroke="#fbfdf6" stroke-width=".18"/></g>`;}
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}mm" height="${height}mm" viewBox="0 0 ${width} ${height}"><title>${esc(project.title)}</title>${body}</svg>`;
}
return{layout,validate,render};
});
