/* ===== Brother .lbx/.lbxs und ZIP – gemeinsam für Gebäudetechnik (Etiketten, QR) und EVSE (Wallbox-QR) ===== */
const ecXml=t=>String(t??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const ecLbxProp=titel=>{ const jetzt=new Date().toISOString().replace(/\.\d+Z$/,"Z");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<meta:properties xmlns:meta="http://schemas.brother.info/ptouch/2007/lbx/meta" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/"><meta:appName>com.brother.ptouch.mobilecablelabeltool2</meta:appName><dc:title>${ecXml(titel)}</dc:title><dc:subject></dc:subject><dc:creator>Elektro Irrgang</dc:creator><meta:keyword></meta:keyword><dc:description>{"databaseTypeKey":2}</dc:description><meta:template></meta:template><dcterms:created>${jetzt}</dcterms:created><dcterms:modified>${jetzt}</dcterms:modified><meta:lastPrinted></meta:lastPrinted><meta:modifiedBy></meta:modifiedBy><meta:revision>1</meta:revision><meta:editTime>0</meta:editTime><meta:numPages>1</meta:numPages><meta:numWords>0</meta:numWords><meta:numChars>0</meta:numChars><meta:security>0</meta:security><meta:transferScript></meta:transferScript></meta:properties>`; };
/* ZIP ohne Kompression (Methode 0) – reicht für die kleinen Dateien und braucht keine Bibliothek */
const EC_CRC=(()=>{ const t=new Uint32Array(256); for(let n=0;n<256;n++){ let c=n; for(let k=0;k<8;k++) c=c&1?0xEDB88320^(c>>>1):c>>>1; t[n]=c>>>0; } return t; })();
const ecCrc=d=>{ let c=0xFFFFFFFF; for(let i=0;i<d.length;i++) c=EC_CRC[(c^d[i])&255]^(c>>>8); return (c^0xFFFFFFFF)>>>0; };
function ecZip(dateien){ const enc=new TextEncoder(), teile=[], zentral=[]; let pos=0;
  const d=new Date(), zeit=(d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1), datum=((d.getFullYear()-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate();
  for(const f of dateien){ const name=enc.encode(f.name), daten=typeof f.daten==="string"?enc.encode(f.daten):f.daten, crc=ecCrc(daten);
    const k=new DataView(new ArrayBuffer(30)); k.setUint32(0,0x04034b50,true); k.setUint16(4,20,true); k.setUint16(6,0x0800,true); k.setUint16(10,zeit,true); k.setUint16(12,datum,true);
    k.setUint32(14,crc,true); k.setUint32(18,daten.length,true); k.setUint32(22,daten.length,true); k.setUint16(26,name.length,true);
    teile.push(new Uint8Array(k.buffer),name,daten);
    const z=new DataView(new ArrayBuffer(46)); z.setUint32(0,0x02014b50,true); z.setUint16(4,20,true); z.setUint16(6,20,true); z.setUint16(8,0x0800,true); z.setUint16(12,zeit,true); z.setUint16(14,datum,true);
    z.setUint32(16,crc,true); z.setUint32(20,daten.length,true); z.setUint32(24,daten.length,true); z.setUint16(28,name.length,true); z.setUint32(42,pos,true);
    zentral.push(new Uint8Array(z.buffer),name); pos+=30+name.length+daten.length; }
  const zl=zentral.reduce((a,x)=>a+x.length,0), e=new DataView(new ArrayBuffer(22)); e.setUint32(0,0x06054b50,true); e.setUint16(8,dateien.length,true); e.setUint16(10,dateien.length,true); e.setUint32(12,zl,true); e.setUint32(16,pos,true);
  const alle=[...teile,...zentral,new Uint8Array(e.buffer)], out=new Uint8Array(alle.reduce((a,x)=>a+x.length,0)); let o=0; for(const x of alle){ out.set(x,o); o+=x.length; } return out; }
