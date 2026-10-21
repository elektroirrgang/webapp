/* Abgleich holen – gemeinsam für alle Apps (tools/build.py setzt es ein).
   Früher wurde bei jedem Abgleich jeder Datenordner einzeln und nacheinander komplett aufgelistet (Übersicht: 12 Ordner),
   auch wenn sich nichts geändert hatte. Jetzt:
   1. SharePoint wird je Bibliothek nur nach Änderungen seit dem letzten Abgleich gefragt („Delta“) – meist 1 Anfrage, egal wie viele Daten.
   2. Beim ersten Mal (oder wenn SharePoint den Stand nicht mehr kennt) wird wie bisher alles aufgelistet, aber mehrere Ordner gleichzeitig.
   3. Geänderte Einträge werden gleichzeitig (max. 6) heruntergeladen statt einzeln nacheinander.
   Klappt Delta nicht (z. B. fehlende Berechtigung), bleibt es dauerhaft beim gleichzeitigen Auflisten. */
async function gleichzeitig(L,n,fn){ const out=new Array(L.length); let i=0;
  await Promise.all(Array.from({length:Math.min(n,L.length)},async()=>{ while(i<L.length){ const j=i++; out[j]=await fn(L[j],j); } })); return out; }
async function abHolen(k,it){ const id=it.name.slice(0,-5), loc=DB[k].get(id); if(loc&&loc._etag===it.eTag) return false;
  try{ const rec=await (await readItem(it)).json(); return !!(rec&&rec.id===id&&takeServer(k,rec,it)); }catch(e){ if(e&&e.auth) throw e; return false; } }
const abJson=it=>!!(it&&it.file&&!it.deleted&&it.name&&it.name.endsWith(".json"));
/* komplett auflisten (gleichzeitig) */
async function abVoll(Fs){ const L=await gleichzeitig(Fs,6,async([k,fid])=>[k,await listAll(fid)]), todo=[];
  L.forEach(([k,items])=>items.forEach(it=>{ if(abJson(it)) todo.push([k,it]); }));
  return (await gleichzeitig(todo,6,([k,it])=>abHolen(k,it))).some(Boolean); }
async function abDeltaStart(drive){ const j=await gj(`/drives/${drive}/root/delta?token=latest`); return j&&j["@odata.deltaLink"]; }
async function pull(){
  const S=META.sync; S.delta=S.delta||{};
  const Fs=await gleichzeitig(KINDS,6,async k=>[k,await folderId(`${CONFIG.dataFolder}/${k}`,BIB[k])]);
  if(S.deltaAus) return abVoll(Fs);
  const proDrive={}; Fs.forEach(([k,fid])=>{ const d=fid.split("/")[0]; (proDrive[d]=proDrive[d]||[]).push([k,fid]); });
  let changed=false;
  for(const [d,F] of Object.entries(proDrive)){
    const key=d+"|"+CONFIG.dataFolder, st=S.delta[key], ordner={}; F.forEach(([k,fid])=>{ ordner[fid.split("/").pop()]=k; });
    try{
      if(!st||!st.link){ const link=await abDeltaStart(d); if(await abVoll(F)) changed=true; S.delta[key]={link,kinds:F.map(x=>x[0])}; metaSave(); continue; }
      /* neu dazugekommene Datenarten (App-Update) einmal komplett holen */
      const fehlt=F.filter(([k])=>!(st.kinds||[]).includes(k)); if(fehlt.length&&await abVoll(fehlt)) changed=true;
      let url=st.link, next=null; const neu=new Map();
      while(url){ const r=await g(url);
        if(r.status===410||r.status===400||r.status===404){ /* Stand bei SharePoint verfallen: neu aufsetzen */
          const link=await abDeltaStart(d); if(await abVoll(F)) changed=true; next=link; neu.clear(); break; }
        if(!r.ok) throw Object.assign(new Error(`Microsoft meldet Fehler ${r.status}`),{status:r.status});
        const j=await r.json(); (j.value||[]).forEach(it=>{ const k=it.parentReference&&ordner[it.parentReference.id]; if(k&&abJson(it)) neu.set(it.id,[k,it]); });
        url=j["@odata.nextLink"]||null; if(j["@odata.deltaLink"]) next=j["@odata.deltaLink"]; }
      if((await gleichzeitig([...neu.values()],6,([k,it])=>abHolen(k,it))).some(Boolean)) changed=true;
      S.delta[key]={link:next||st.link,kinds:F.map(x=>x[0])}; metaSave();
    }catch(e){ if(e&&e.auth) throw e;
      if(e&&(e.status===403||e.status===401||e.status===501)){ S.deltaAus=true; metaSave(); if(await abVoll(F)) changed=true; } else throw e; }
  }
  return changed;
}
