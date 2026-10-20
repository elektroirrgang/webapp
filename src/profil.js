/* Eigenes Profil – gemeinsam für alle Apps (tools/build.py setzt es ein).
   Datensatz „profile“ je Mitarbeiter (id = Mail, klein): {vorname, nachname, ruf, bild (kleines JPEG als data-URL)}.
   Liegt in „Kundendaten/_App-Daten/profile“, damit Name und Bild in allen Apps und auf allen Geräten gleich sind.
   Ändern kann jeder nur sein eigenes Profil. Die Rolle kommt aus Microsoft (Chef weist sie zu), hier wird sie nur angezeigt. */
const ROLLE_TXT={Admin:["Admin","darf alles, vergibt Rollen in Microsoft"],Buero:["Büro","Aufträge, Material bestellen, Kunden pflegen"],
  Entwickler:["Entwickler","wie Admin, dazu Testwerkzeuge"],Mitarbeiter:["Mitarbeiter","bearbeitet eigene Prüfungen, Übergaben und Notizen"]};
function meineRollen(){ const a=typeof Auth!=="undefined"&&Auth.account; return (a&&a.idTokenClaims&&a.idTokenClaims.roles)||[]; }
function meineRolle(){ const R=meineRollen(); const k=["Admin","Entwickler","Buero","Mitarbeiter"].find(x=>R.includes(x)); return k?ROLLE_TXT[k]:ME.admin?ROLLE_TXT.Admin:ROLLE_TXT.Mitarbeiter; }
const profilVon=mail=>mail&&DB.profile?DB.profile.get(String(mail).toLowerCase()):null;
let msName=null;
/* Microsoft-Anzeigename bereinigen: „Maximilian Pevec / Elektro Irrgang“, „Joachim Irrgang | Elektro Irrgang“, „Pevec, Max“ → Vor- und Nachname */
const nameSauber=n=>String(n||"").split(/\s+[|/–]\s+|\s*[|/]\s*/)[0].replace(/\s+/g," ").trim();
function nameTeile(n){ n=nameSauber(n); if(n.includes("@")) return {vor:"",nach:""}; if(n.includes(",")){ const [nach,vor]=n.split(",").map(x=>x.trim()); return {vor:vor||"",nach:nach||""}; }
  const t=n.split(" ").filter(Boolean); return t.length>1?{vor:t.slice(0,-1).join(" "),nach:t[t.length-1]}:{vor:t[0]||"",nach:""}; }
const pfKaputt=p=>!!(p&&/[|/]/.test(`${p.vorname||""}${p.nachname||""}`));
/* Profil auf ME anwenden: Name für „erstellt von“, Prüfer usw.; ruf für die Begrüßung */
function profilAnwenden(){
  if(!ME||!ME.mail) return; if(msName==null||!ME._pf){ const t=nameTeile(ME.name); msName=[t.vor,t.nach].filter(Boolean).join(" ")||ME.name; }
  const p0=profilVon(ME.mail), p=pfKaputt(p0)?null:p0, voll=p?[p.vorname,p.nachname].filter(Boolean).join(" ").trim():"";
  ME.name=voll||msName||ME.name; ME.ruf=(p&&(p.ruf||p.vorname))||nameTeile(msName).vor||ME.name; ME.bild=p&&p.bild||""; ME._pf=true;
}
function profilAvatar(){ profilAnwenden(); const b=document.getElementById("avBtn"), t=document.getElementById("avTxt"); if(!b) return;
  if(ME.bild){ b.style.backgroundImage=`url("${ME.bild}")`; b.classList.add("mit-bild"); if(t) t.textContent=""; }
  else { b.style.backgroundImage=""; b.classList.remove("mit-bild"); } }
let pfBild=null;
function kontoDialog(){
  profilAnwenden(); const p0=profilVon(ME.mail)||{}, kaputt=pfKaputt(p0), p=kaputt?Object.assign({},p0,{vorname:null,nachname:null}):p0, r=meineRolle(); pfBild=p.bild||"";
  const t=nameTeile(msName||ME.name), vn=p.vorname!=null&&p.vorname!==""?p.vorname:t.vor, nn=p.nachname!=null&&p.nachname!==""?p.nachname:t.nach;
  dialog("Mein Profil",`<div class="pf-kopf"><button type="button" class="pf-bild" data-act="pfBildWahl" aria-label="Profilbild ändern" style="${pfBild?`background-image:url('${pfBild}')`:""}">${pfBild?"":esc(initials(ME.name))}<span class="pf-cam">${icon("cam")}</span></button>
      <div class="pf-info"><b>${esc(ME.mail)}</b><span class="pf-rolle">${esc(r[0])}</span><small>${esc(r[1])}</small></div></div>
    ${pfBild?`<button type="button" class="btn-text pf-weg" data-act="pfBildWeg">Bild entfernen</button>`:""}
    <div class="fg1" style="margin-top:12px"><div class="row2">${tf("vorname","Vorname",vn,{form:true})}${tf("nachname","Nachname",nn,{form:true})}</div>
      ${tf("ruf","So möchte ich begrüßt werden",p.ruf||"",{form:true,ph:vn||"z. B. Max"})}</div>
    <p class="sup" style="margin:12px 4px 0">Den Namen sehen alle Kollegen, z. B. bei „Dabei“ und als Ersteller von Übergaben. Die Rolle vergibt der Chef in Microsoft.</p>
    ${typeof syncText==="function"?`<p class="sup" id="syncState" style="margin:8px 4px 0">${esc(syncText())}</p>`:""}
    <input type="file" id="pfDatei" accept="image/*" hidden>`,
    `<button class="btn-text danger" data-act="logout">Abmelden</button><span style="flex:1"></span><button class="btn-text" data-act="cancel">Abbrechen</button><button class="btn-text" data-act="pfSave">Speichern</button>`);
}
async function pfBildLaden(f){
  try{ const url=URL.createObjectURL(f), img=new Image(); await new Promise((ok,no)=>{ img.onload=ok; img.onerror=no; img.src=url; });
    const s=Math.min(img.width,img.height), c=document.createElement("canvas"); c.width=c.height=192;
    c.getContext("2d").drawImage(img,(img.width-s)/2,(img.height-s)/2,s,s,0,0,192,192); URL.revokeObjectURL(url);
    pfBild=c.toDataURL("image/jpeg",0.82); const b=document.querySelector(".pf-bild"); if(b){ b.style.backgroundImage=`url('${pfBild}')`; b.firstChild&&b.firstChild.nodeType===3&&(b.firstChild.textContent=""); }
  }catch(e){ toast("Das Bild konnte nicht gelesen werden"); } }
function pfSpeichern(){
  const F={}; document.querySelectorAll("#dlg [data-f]").forEach(e=>F[e.dataset.f]=String(e.value||"").trim());
  const id=String(ME.mail||"").toLowerCase(); if(!id) return; const alt=DB.profile.get(id), r=alt||{id};
  Object.assign(r,{vorname:F.vorname,nachname:F.nachname,ruf:F.ruf,bild:pfBild||""}); saveRec("profile",r,!alt);
  ME._pf=false; profilAnwenden(); closeOverlays(); render(); toast("Profil gespeichert");
}
/* Klicks und Dateiwahl – eigene Abfangung, damit die Apps nur „konto“ umleiten müssen */
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act="pfBildWahl"],[data-act="pfBildWeg"],[data-act="pfSave"]'); if(!b) return;
  e.stopPropagation(); const a=b.dataset.act;
  if(a==="pfBildWahl"){ const i=document.getElementById("pfDatei"); if(i) i.click(); }
  else if(a==="pfBildWeg"){ pfBild=""; const x=document.querySelector(".pf-bild"); if(x){ x.style.backgroundImage=""; } b.remove(); }
  else if(a==="pfSave") pfSpeichern(); },true);
document.addEventListener("change",e=>{ if(e.target&&e.target.id==="pfDatei"&&e.target.files[0]) pfBildLaden(e.target.files[0]); });
