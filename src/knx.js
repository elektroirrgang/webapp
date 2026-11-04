/* ===== KNX-Etiketten für den Brother PT-E560BT (Pro Label Tool), 04.11.2026 =====
   Linie (z. B. 6.1) + Bereich (1–36) → je physikalische Adresse ein Etikett, einzelne Nummern doppelt (z. B. Raumthermostat Ober-/Unterteil).
   Format nachgebaut an Max' Musterdatei: 6-mm-Band, 23 mm lang, Text mittig, Datenbank (CSV, ohne Kopfzeile) mit Feld F1 –
   jede Zeile der CSV wird ein eigenes Etikett und einzeln abgeschnitten. Ausgabe: .lbxs = ZIP { config.json, <name>.lbx, <name>.csv }.
   Später Teil des KNX-Reiters (Geräteliste mit Adressen); bis dahin unter Einstellungen › Werkzeuge. */
IC.knx=IC.knx||"M8.4 18.2c.38.5.6 1.12.6 1.8 0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3c.44 0 .85.09 1.23.26l1.41-1.77c-.92-1.03-1.29-2.39-1.09-3.69l-2.03-.68c-.54.83-1.46 1.38-2.52 1.38-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3c0 .07 0 .14-.01.21l2.03.68c.64-1.21 1.82-2.09 3.22-2.32V5.91C9.96 5.57 9 4.4 9 3c0-1.66 1.34-3 3-3s3 1.34 3 3c0 1.4-.96 2.57-2.25 2.91v2.16c1.4.23 2.58 1.11 3.22 2.32l2.03-.68c-.01-.07-.01-.14-.01-.21 0-1.66 1.34-3 3-3s3 1.34 3 3-1.34 3-3 3c-1.06 0-1.98-.55-2.52-1.37l-2.03.68c.2 1.29-.16 2.65-1.09 3.69l1.41 1.77c.38-.17.79-.26 1.23-.26 1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3c0-.68.22-1.3.6-1.8l-1.41-1.77c-1.35.75-3.01.76-4.37 0L8.4 18.2z";
let KNX_ETI={linie:"",von:1,bis:36,null:true,doppelt:[],fmt:"lbxs"};
try{ const v=JSON.parse(localStorage.getItem("irrgang_knx_eti")||"null"); if(v) KNX_ETI={...KNX_ETI,...v,doppelt:[]}; }catch(e){}
const knxEtiMerken=()=>{ try{ localStorage.setItem("irrgang_knx_eti",JSON.stringify({linie:KNX_ETI.linie,von:KNX_ETI.von,bis:KNX_ETI.bis,null:KNX_ETI.null,fmt:KNX_ETI.fmt})); }catch(e){} };
/* „6.1“ oder „6.1.“ → [6,1]; Bereich 0–15, Linie 0–15, Gerät 0–255 */
function knxLinie(t){ const m=String(t||"").trim().replace(/\.$/,"").match(/^(\d{1,2})\.(\d{1,2})$/); if(!m) return null; const b=+m[1], l=+m[2]; return b<=15&&l<=15?[b,l]:null; }
const knxAdr=(L,n)=>`${L[0]}.${L[1]}.${KNX_ETI.null&&n<10?"0"+n:n}`;
function knxListe(){ const L=knxLinie(KNX_ETI.linie), von=Math.max(0,Math.min(255,+KNX_ETI.von||0)), bis=Math.max(0,Math.min(255,+KNX_ETI.bis||0)); if(!L||bis<von) return [];
  const A=[]; for(let n=von;n<=bis;n++){ A.push(knxAdr(L,n)); if(KNX_ETI.doppelt.includes(n)) A.push(knxAdr(L,n)); } return A; }
/* label.xml wie in der Pro-Label-App gespeichert (6 mm, Länge 23 mm = 65,2 pt inkl. Rand) */
function knxLbx(name,erste){ const x=ecXml, csv=name+".csv", schrift=`<text:ptFontInfo><text:logFont name="Utah" width="0" italic="false" weight="400" charSet="0" pitchAndFamily="2"></text:logFont><text:fontExt effect="NOEFFECT" underline="0" strikeout="0" size="10.7pt" orgSize="28.8pt" textColor="#000000" textPrintColorNumber="1"></text:fontExt></text:ptFontInfo>`;
  return `<?xml version="1.0" encoding="UTF-8"?>\n<pt:document xmlns:pt="http://schemas.brother.info/ptouch/2007/lbx/main" xmlns:style="http://schemas.brother.info/ptouch/2007/lbx/style" xmlns:text="http://schemas.brother.info/ptouch/2007/lbx/text" xmlns:draw="http://schemas.brother.info/ptouch/2007/lbx/draw" xmlns:image="http://schemas.brother.info/ptouch/2007/lbx/image" xmlns:barcode="http://schemas.brother.info/ptouch/2007/lbx/barcode" xmlns:database="http://schemas.brother.info/ptouch/2007/lbx/database" xmlns:table="http://schemas.brother.info/ptouch/2007/lbx/table" xmlns:cable="http://schemas.brother.info/ptouch/2007/lbx/cable" version="1.11" generator="com.brother.ptouch.mobilecablelabeltool2">`
    +`<pt:body currentSheet="Blatt 1" direction="LTR"><style:sheet name="Blatt 1"><style:paper media="0" width="16.8pt" height="65.2pt" marginLeft="2pt" marginTop="5.6pt" marginRight="2pt" marginBottom="5.6pt" orientation="landscape" autoLength="false" monochromeDisplay="true" printColorDisplay="false" printColorsID="0" paperColor="#FFFFFF" paperInk="#000000" split="1" format="257" backgroundTheme="0" printerID="32560" printerName="Brother PT-E560BT"></style:paper>`
    +`<style:cutLine regularCut="0pt" freeCut=""></style:cutLine><style:backGround x="5.6pt" y="2pt" width="54pt" height="12.8pt" brushStyle="NULL" brushId="0" userPattern="NONE" userPatternId="0" color="#000000" printColorNumber="1" backColor="#FFFFFF" backPrintColorNumber="0"></style:backGround>`
    +`<pt:objects><text:text><pt:objectStyle x="5.6pt" y="2pt" width="54pt" height="12.8pt" backColor="#FFFFFF" backPrintColorNumber="0" ropMode="COPYPEN" angle="0" anchor="TOPLEFT" flip="NONE"><pt:pen style="NULL" widthX="0.5pt" widthY="0.5pt" color="#000000" printColorNumber="1"></pt:pen><pt:brush style="NULL" color="#000000" printColorNumber="1" id="0"></pt:brush>`
    +`<pt:expanded objectName="Text3" objectID="${ecLbxId()}" ID="0" lock="0" templateMergeTarget="LABELLIST" templateMergeType="NONE" templateMergeID="0" dbMergeFieldStyleName="F1" dbRecordOffset="0" allowOutOfBoundsTransfer="false" linkStatus="NONE" linkID="0"></pt:expanded></pt:objectStyle>`
    +`${schrift}<text:textControl control="LONGTEXTFIXED" clipFrame="false" aspectNormal="true" shrink="true" autoLF="true" avoidImage="false"></text:textControl><text:textAlign horizontalAlignment="CENTER" verticalAlignment="CENTER" inLineAlignment="BASELINE"></text:textAlign><text:textStyle vertical="false" nullBlock="false" charSpace="0" lineSpace="0" orgPoint="12.8pt" combinedChars="false"></text:textStyle><text:transferSettings editOnPrintFormat="" editOnPrintOrder="0"></text:transferSettings>`
    +`<pt:data>${x(erste)}</pt:data><text:stringItem charLen="${String(erste).length}">${schrift}</text:stringItem></text:text></pt:objects></style:sheet></pt:body>`
    +`<database:database type="FILE" databasePath="${x(csv)}" mergeTable="${x(csv)}" mergeTableType="NONE" currentRecord="0" containsFieldName="false" readonly="true" cellWidths=""><database:dbMergeFieldStyles><database:dbMergeFieldStyle name="F1" fieldName="F1" joinedField="false"></database:dbMergeFieldStyle></database:dbMergeFieldStyles><database:dbTables><database:dbTable name="${x(csv)}"><database:dbField fieldName="F1" joinedField="false" removeEmptyLine="false"></database:dbField></database:dbTable></database:dbTables></database:database></pt:document>`; }
function knxLbxProp(name){ const jetzt=new Date().toISOString().replace(/\.\d+Z$/,"Z");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<meta:properties xmlns:meta="http://schemas.brother.info/ptouch/2007/lbx/meta" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/"><meta:appName>com.brother.ptouch.mobilecablelabeltool2</meta:appName><dc:title>${ecXml(name)}</dc:title><dc:subject></dc:subject><dc:creator></dc:creator><meta:keyword></meta:keyword><dc:description>{"databaseTypeKey":3}</dc:description><meta:template></meta:template><dcterms:created>${jetzt}</dcterms:created><dcterms:modified>${jetzt}</dcterms:modified><meta:lastPrinted></meta:lastPrinted><meta:modifiedBy></meta:modifiedBy><meta:revision>1</meta:revision><meta:editTime>0</meta:editTime><meta:numPages>1</meta:numPages><meta:numWords>0</meta:numWords><meta:numChars>0</meta:numChars><meta:security>0</meta:security><meta:transferScript></meta:transferScript></meta:properties>`; }
const knxCsv=A=>A.join("\r\n")+"\r\n";
function knxLbxs(name,A){ const lbx=ecZip([{name:"label.xml",daten:knxLbx(name,A[0])},{name:"prop.xml",daten:knxLbxProp(name)}]);
  return ecZip([{name:"config.json",daten:JSON.stringify({Version:"1.0",CurrentLbx:name+".lbx",CurrentCsv:name+".csv"})},{name:name+".lbx",daten:lbx instanceof Uint8Array?lbx:new Uint8Array(lbx)},{name:name+".csv",daten:knxCsv(A)}]); }

/* ---- Reiter „KNX“ (Anfang: Beschriftung; Geräteliste, Begehung, Status und Programmier-Modus folgen) ---- */
function knxView(){ return `<div class="narrow"><div class="sec-lbl">Beschriftung</div>${listOf([`<div class="li" role="button" tabindex="0" data-act="knxEti"><span class="av">${icon("tag")}</span><span class="lt"><span class="h">Etiketten drucken</span><span class="s">Physikalische Adressen einer Linie für den Brother · 6 mm, 23 mm lang</span></span>${icon("chev")}</div>`])}
  <div class="empty" style="margin-top:28px">${icon("knx")}<h2>Geräteliste kommt als Nächstes</h2><p>Gebäude und Räume, Begehung vorab, Adressen nach deinem Schema, Status je Gerät und der Programmier-Modus zu zweit.</p></div></div>`; }

/* ---- Dialog ---- */
function knxEtiInhalt(){ const L=knxLinie(KNX_ETI.linie), A=knxListe(), von=+KNX_ETI.von||0, bis=+KNX_ETI.bis||0, d=KNX_ETI.doppelt.filter(n=>n>=von&&n<=bis).length;
  const nummern=L&&bis>=von&&bis-von<=255?Array.from({length:bis-von+1},(_,i)=>von+i).map(n=>`<button type="button" class="knx-n" data-act="knxDoppelt" data-n="${n}" aria-pressed="${KNX_ETI.doppelt.includes(n)}"><b>${esc(knxAdr(L,n))}</b>${KNX_ETI.doppelt.includes(n)?"<small>2×</small>":""}</button>`).join(""):"";
  return `${L?"":`<p class="meta">Linie wie in der ETS eingeben, z. B. 6.1</p>`}
    ${nummern?`<div class="lbl" style="margin-top:6px">Doppelt drucken? Antippen, z. B. Raumthermostat Ober- und Unterteil</div><div class="knx-gitter">${nummern}</div>`:""}
    <p class="knx-summe">${A.length?`<b>${A.length} Etiketten</b> · ${bis-von+1} Adressen${d?` · ${d} doppelt`:""} · je 23 mm auf 6-mm-Band`:"Noch keine Etiketten"}</p>`; }
function knxEtiDlg(){ dialog("KNX-Etiketten",`<div class="knx-felder">${tf("knxLinie","Linie","" + (KNX_ETI.linie||""),{form:true,ph:"z. B. 6.1",im:"decimal"})}${tf("knxVon","Von",String(KNX_ETI.von),{form:true,im:"numeric"})}${tf("knxBis","Bis",String(KNX_ETI.bis),{form:true,im:"numeric"})}</div>
    <div class="lbl" style="margin-top:10px">Gerätenummer</div><div class="knx-seg">${[[true,"zweistellig · 6.1.01"],[false,"einstellig · 6.1.1"]].map(([v,t])=>`<button type="button" data-act="knxNull" data-v="${v?1:0}" aria-pressed="${KNX_ETI.null===v}">${t}</button>`).join("")}</div>
    <div id="knxInh">${knxEtiInhalt()}</div>

`,
    `<span style="flex:1"></span><button class="btn-text" data-act="knxDruck">Etiketten-Liste erstellen</button>`);
  const neu=()=>{ const g=id=>document.getElementById(id); if(!g("f_knxLinie")) return; KNX_ETI.linie=g("f_knxLinie").value.trim(); KNX_ETI.von=+g("f_knxVon").value||0; KNX_ETI.bis=+g("f_knxBis").value||0; knxEtiMerken(); g("knxInh").innerHTML=knxEtiInhalt(); };
  ["f_knxLinie","f_knxVon","f_knxBis"].forEach(id=>{ const e=document.getElementById(id); if(e) e.addEventListener("input",neu); });
  setTimeout(()=>{ const e=document.getElementById("f_knxLinie"); if(e&&!e.value) e.focus(); },60); }
/* Android: Pro Label Tool taucht beim Öffnen/Teilen nicht auf – deshalb wie bei den Netzwerk-Etiketten: in „Downloads“ speichern,
   dann die App direkt starten und dort über „Öffnen“ bzw. „Importieren“ laden. iPhone/iPad: Teilen-Menü. */
const KNX_ANDR=/android/i.test(navigator.userAgent);
const knxAppAuf=()=>{ location.href="intent://#Intent;package=com.brother.ptouch.mobilecablelabeltool2;end"; };
function knxLaden(f){ const a=document.createElement("a"); a.href=URL.createObjectURL(f); a.download=f.name; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },1500); }
/* Mit Microsoft-Anbindung: Liste immer unter demselben Namen in die Firmen-Cloud legen (Bibliothek „Kundendaten“ › Ordner „Etiketten“).
   In der Pro-Label-App: Datenbank verbinden › Durchsuchen › OneDrive › … › Etiketten › KNX-Etiketten.csv – kein Laden/Sichern auf dem Gerät.
   Klappt das nicht (offline, nicht angemeldet), wie bisher laden bzw. teilen. */
const KNX_CLOUD_NAME="KNX-Etiketten.csv";
async function knxCloud(f){ if(typeof SYNC_ON==="undefined"||!SYNC_ON||typeof bbHoch!=="function"||typeof ME==="undefined"||!ME.signedIn) return false;
  try{ if(typeof syncRoot==="function") await syncRoot(); await bbHoch(typeof BIB!=="undefined"&&BIB.kunden||"Kundendaten","Etiketten/"+KNX_CLOUD_NAME,f); return true; }catch(e){ console.warn("Etiketten in die Cloud:",e); return false; } }
async function knxAusgeben(F){ if(F.length===1&&/\.csv$/i.test(F[0].name)){ toast("Etiketten-Liste wird abgelegt …"); if(await knxCloud(F[0])){ toast(`Liegt in OneDrive › Kundendaten › Etiketten › ${KNX_CLOUD_NAME} – in Pro Label als Datenbank wählen`); return; } } if(KNX_ANDR){ F.forEach((f,i)=>setTimeout(()=>knxLaden(f),i*400)); toast(`CSV in „Downloads“ – in der Pro-Label-App als Datenbank verbinden`,"App öffnen",knxAppAuf); return; }
  /* iPhone/iPad im Browser: direkt laden (Safari fragt einmal „Laden?“, Datei liegt dann in Dateien › Downloads) – spart „In Dateien sichern“.
     Als Home-Bildschirm-App lädt iOS nicht zuverlässig, dort bleibt das Teilen-Menü. */
  const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1), heimApp=navigator.standalone===true||matchMedia("(display-mode: standalone)").matches;
  if(ios&&!heimApp){ F.forEach((f,i)=>setTimeout(()=>knxLaden(f),i*400)); toast("CSV liegt in Dateien › Downloads – in der Pro-Label-App importieren"); return; }
  if(navigator.canShare&&navigator.canShare({files:F})){ try{ await navigator.share({files:F,title:F[0].name}); return; }catch(e){ if(e&&e.name==="AbortError") return; } }
  F.forEach((f,i)=>setTimeout(()=>knxLaden(f),i*400)); toast("CSV gespeichert – in der Pro-Label-App als Datenbank verbinden"); }
const knxTeilen=f=>knxAusgeben([f]);
document.addEventListener("click",ev=>{ const b=ev.target.closest&&ev.target.closest('[data-act^="knx"]'); if(!b) return; const a=b.dataset.act;
  if(a==="knxFmt"){ ev.stopPropagation(); KNX_ETI.fmt=b.dataset.v; knxEtiMerken(); b.parentElement.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x===b))); return; }
  if(a==="knxApp"){ ev.stopPropagation(); knxAppAuf(); return; }
  if(a==="knxEti"){ ev.stopPropagation(); KNX_ETI.doppelt=[]; knxEtiDlg(); return; }
  if(a==="knxNull"){ ev.stopPropagation(); KNX_ETI.null=b.dataset.v==="1"; knxEtiMerken(); b.parentElement.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x===b))); const h=document.getElementById("knxInh"); if(h) h.innerHTML=knxEtiInhalt(); return; }
  if(a==="knxDoppelt"){ ev.stopPropagation(); const n=+b.dataset.n, i=KNX_ETI.doppelt.indexOf(n); if(i<0) KNX_ETI.doppelt.push(n); else KNX_ETI.doppelt.splice(i,1); const h=document.getElementById("knxInh"), y=h&&h.querySelector(".knx-gitter")?.scrollTop; if(h){ h.innerHTML=knxEtiInhalt(); const gi=h.querySelector(".knx-gitter"); if(gi&&y) gi.scrollTop=y; } return; }
  if(a==="knxDruck"){ ev.stopPropagation(); const A=knxListe(); if(!A.length){ toast("Erst Linie und Bereich eingeben"); return; }
    /* Pro Label Tool importiert nur Excel/CSV – wie bei den Netzwerk-Etiketten: CSV mit Kopfzeile „Physikalische Adresse“, eine Spalte */
    const L=knxLinie(KNX_ETI.linie), name=bbFs(`KNX ${L[0]}.${L[1]} ${KNX_ETI.von}-${KNX_ETI.bis}`);
    closeOverlays(); knxAusgeben([new File([ecCsv([["Physikalische Adresse"],...A.map(x=>[x])])],name+".csv",{type:"text/csv"})]); return; } },true);
