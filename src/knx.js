/* ===== KNX-Etiketten für den Brother PT-E560BT (Pro Label Tool), 04.11.2026 =====
   Linie (z. B. 6.1) + Bereich (1–36) → je physikalische Adresse ein Etikett, einzelne Nummern doppelt (z. B. Raumthermostat Ober-/Unterteil).
   Format nachgebaut an Max' Musterdatei: 6-mm-Band, 23 mm lang, Text mittig, Datenbank (CSV, ohne Kopfzeile) mit Feld F1 –
   jede Zeile der CSV wird ein eigenes Etikett und einzeln abgeschnitten. Ausgabe: .lbxs = ZIP { config.json, <name>.lbx, <name>.csv }.
   Später Teil des KNX-Reiters (Geräteliste mit Adressen); bis dahin unter Einstellungen › Werkzeuge. */
let KNX_ETI={linie:"",von:1,bis:36,null:true,doppelt:[]};
try{ const v=JSON.parse(localStorage.getItem("irrgang_knx_eti")||"null"); if(v) KNX_ETI={...KNX_ETI,...v,doppelt:[]}; }catch(e){}
const knxEtiMerken=()=>{ try{ localStorage.setItem("irrgang_knx_eti",JSON.stringify({linie:KNX_ETI.linie,von:KNX_ETI.von,bis:KNX_ETI.bis,null:KNX_ETI.null})); }catch(e){} };
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

/* ---- Dialog ---- */
function knxEtiInhalt(){ const L=knxLinie(KNX_ETI.linie), A=knxListe(), von=+KNX_ETI.von||0, bis=+KNX_ETI.bis||0, d=KNX_ETI.doppelt.filter(n=>n>=von&&n<=bis).length;
  const nummern=L&&bis>=von&&bis-von<=255?Array.from({length:bis-von+1},(_,i)=>von+i).map(n=>`<button type="button" class="knx-n" data-act="knxDoppelt" data-n="${n}" aria-pressed="${KNX_ETI.doppelt.includes(n)}"><b>${esc(knxAdr(L,n))}</b>${KNX_ETI.doppelt.includes(n)?"<small>2×</small>":""}</button>`).join(""):"";
  return `${L?"":`<p class="meta">Linie wie in der ETS eingeben, z. B. 6.1</p>`}
    ${nummern?`<div class="lbl" style="margin-top:6px">Doppelt drucken? Antippen, z. B. Raumthermostat Ober- und Unterteil</div><div class="knx-gitter">${nummern}</div>`:""}
    <p class="knx-summe">${A.length?`<b>${A.length} Etiketten</b> · ${bis-von+1} Adressen${d?` · ${d} doppelt`:""} · je 23 mm auf 6-mm-Band`:"Noch keine Etiketten"}</p>`; }
function knxEtiDlg(){ dialog("KNX-Etiketten",`<div class="knx-felder">${tf("knxLinie","Linie","" + (KNX_ETI.linie||""),{form:true,ph:"z. B. 6.1",im:"decimal"})}${tf("knxVon","Von",String(KNX_ETI.von),{form:true,im:"numeric"})}${tf("knxBis","Bis",String(KNX_ETI.bis),{form:true,im:"numeric"})}</div>
    <div class="lbl" style="margin-top:10px">Gerätenummer</div><div class="knx-seg">${[[true,"zweistellig · 6.1.01"],[false,"einstellig · 6.1.1"]].map(([v,t])=>`<button type="button" data-act="knxNull" data-v="${v?1:0}" aria-pressed="${KNX_ETI.null===v}">${t}</button>`).join("")}</div>
    <div id="knxInh">${knxEtiInhalt()}</div>
    <details class="ec-eti-hilfe"><summary>So druckst du in der Pro-Label-App</summary><ol>${KNX_ANDR
      ?`<li>„Brother-Datei“ tippen – sie landet in „Downloads“.</li><li>„App öffnen“ im Hinweis unten tippen (startet die Pro-Label-App).</li><li>In der App „Öffnen“ bzw. „Importieren“ → „Downloads“ → die Datei wählen.</li>`
      :`<li>„Brother-Datei“ tippen und im Teilen-Menü „Pro Label Tool“ wählen – oder „In Dateien sichern“ und in der App über „Öffnen“ laden.</li>`}
      <li>Alle Datensätze drucken, Schnitt nach jedem Etikett – jede Adresse wird ein eigenes Etikett.</li><li>Klappt das nicht: „Nur CSV“ und in deiner eigenen Vorlage als Datenbank verbinden.</li></ol></details>`,
    `${KNX_ANDR?`<button class="btn-text" data-act="knxApp">App öffnen</button>`:""}<button class="btn-text" data-act="knxCsv">Nur CSV</button><span style="flex:1"></span><button class="btn-text" data-act="knxDruck">Brother-Datei</button>`);
  const neu=()=>{ const g=id=>document.getElementById(id); if(!g("f_knxLinie")) return; KNX_ETI.linie=g("f_knxLinie").value.trim(); KNX_ETI.von=+g("f_knxVon").value||0; KNX_ETI.bis=+g("f_knxBis").value||0; knxEtiMerken(); g("knxInh").innerHTML=knxEtiInhalt(); };
  ["f_knxLinie","f_knxVon","f_knxBis"].forEach(id=>{ const e=document.getElementById(id); if(e) e.addEventListener("input",neu); });
  setTimeout(()=>{ const e=document.getElementById("f_knxLinie"); if(e&&!e.value) e.focus(); },60); }
/* Android: Pro Label Tool taucht beim Öffnen/Teilen nicht auf – deshalb wie bei den Netzwerk-Etiketten: in „Downloads“ speichern,
   dann die App direkt starten und dort über „Öffnen“ bzw. „Importieren“ laden. iPhone/iPad: Teilen-Menü. */
const KNX_ANDR=/android/i.test(navigator.userAgent);
const knxAppAuf=()=>{ location.href="intent://#Intent;package=com.brother.ptouch.mobilecablelabeltool2;end"; };
function knxLaden(f){ const a=document.createElement("a"); a.href=URL.createObjectURL(f); a.download=f.name; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },1500); }
async function knxTeilen(f){ if(KNX_ANDR){ knxLaden(f); toast(`In „Downloads“ gespeichert – in der Pro-Label-App über „Öffnen“ laden`,"App öffnen",knxAppAuf); return; }
  if(navigator.canShare&&navigator.canShare({files:[f]})){ try{ await navigator.share({files:[f],title:f.name}); return; }catch(e){ if(e&&e.name==="AbortError") return; } }
  const a=document.createElement("a"); a.href=URL.createObjectURL(f); a.download=f.name; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },1500); toast("Datei heruntergeladen – in der Pro-Label-App öffnen"); }
document.addEventListener("click",ev=>{ const b=ev.target.closest&&ev.target.closest('[data-act^="knx"]'); if(!b) return; const a=b.dataset.act;
  if(a==="knxApp"){ ev.stopPropagation(); knxAppAuf(); return; }
  if(a==="knxEti"){ ev.stopPropagation(); KNX_ETI.doppelt=[]; knxEtiDlg(); return; }
  if(a==="knxNull"){ ev.stopPropagation(); KNX_ETI.null=b.dataset.v==="1"; knxEtiMerken(); b.parentElement.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x===b))); const h=document.getElementById("knxInh"); if(h) h.innerHTML=knxEtiInhalt(); return; }
  if(a==="knxDoppelt"){ ev.stopPropagation(); const n=+b.dataset.n, i=KNX_ETI.doppelt.indexOf(n); if(i<0) KNX_ETI.doppelt.push(n); else KNX_ETI.doppelt.splice(i,1); const h=document.getElementById("knxInh"), y=h&&h.querySelector(".knx-gitter")?.scrollTop; if(h){ h.innerHTML=knxEtiInhalt(); const gi=h.querySelector(".knx-gitter"); if(gi&&y) gi.scrollTop=y; } return; }
  if(a==="knxDruck"||a==="knxCsv"){ ev.stopPropagation(); const A=knxListe(); if(!A.length){ toast("Erst Linie und Bereich eingeben"); return; }
    const L=knxLinie(KNX_ETI.linie), name=bbFs(`KNX ${L[0]}.${L[1]} ${KNX_ETI.von}-${KNX_ETI.bis}`);
    const f=a==="knxCsv"?new File([knxCsv(A)],name+".csv",{type:"text/csv"}):new File([knxLbxs(name,A)],name+".lbxs",{type:"application/octet-stream"});
    closeOverlays(); knxTeilen(f); return; } },true);
