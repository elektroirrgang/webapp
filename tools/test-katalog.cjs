const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const index=JSON.parse(read('src/katalog/index.json')).assets,profiles=JSON.parse(read('src/katalog/profiles.json'));
assert.equal(index.length,2205);assert.equal(new Set(index.map(a=>a.id)).size,2205);
const bilderDa=fs.existsSync(path.join(root,'src/katalog/assets'));for(const a of index){if(bilderDa)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'src/katalog',a.file))).digest('hex'),a.sha256);assert(a.dimension.width>0&&a.dimension.height>0);assert(/^[0-9a-f]{64}$/.test(a.sha256));}
let counter=0;
const box={IC:{},console,Map,Set,URL,TextEncoder,Uint8Array,Blob,crypto:crypto.webcrypto,
 document:{addEventListener(){},querySelector(){return null;},querySelectorAll(){return [];},getElementById(){return null;}},window:{},localStorage:{getItem(){return null;}},matchMedia(){return{matches:false,addEventListener(){}}},uid(){return 'ID'+(++counter);},esc(v){return String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');},location:{href:'http://localhost/echeck/'},nav:{v:'legende',id:'L'},DB:{legenden:new Map()},META:{},ecHeute:()=> '2026-11-28'};
vm.createContext(box);
vm.runInContext(read('src/legende.js'),box);
vm.runInContext(read('src/katalog/klemmen-engine.js'),box);
vm.runInContext(read('src/geraetekatalog.js').replace('/*KATALOG_INDEX*/[]',JSON.stringify(index)).replace('/*KATALOG_PROFILE*/{}',JSON.stringify(profiles)),box);
vm.runInContext(read('src/verteiler.js'),box);
const run=s=>vm.runInContext(s,box);
run('DB.legenden.set("L",{id:"L",teReihe:12,teMm:18,eintraege:[]})');
// A 6.2-mm terminal must fit 34 times in a 216-mm row; three-pole defaults must not widen it.
run('testEntry={id:"test",art:"ge",bez:"WAGO",katalog:{widthMm:6.2,heightMm:52.3,frontCenterMm:26.15,data:"data:image/svg+xml;base64,AA=="}}');
assert(Math.abs(run('legTE(testEntry)')-6.2/18)<1e-10);
run('testL=legAkt();testL.eintraege=Array.from({length:35},(_,i)=>({...testEntry,id:String(i)}))');
assert.equal(run('legReihen(testL).length'),2);assert.equal(run('legReihen(testL)[0].g.length'),34);
// Drawing preserves millimetres and uses the embedded asset, without distorting it to old photo proportions.
const image=run('legGeraetBild(testEntry,0,legTE(testEntry),0,50)');assert(image.includes('width="17.22222222222222"'));assert(image.includes('data:image/svg+xml'));
assert.equal(run('gkFilter(GK_INDEX,"Schneider DALI", "", "").length')>=3,true);
assert.equal(run('gkFilter(GK_INDEX,"", "Merten", "").every(a=>a.manufacturer==="Merten")'),true);
assert.equal(run('gkTechnik(GK_INDEX.find(a=>a.type==="QFD")).schutz.includes("FI/LS")'),true);
assert.equal(run('gkTechnik(GK_INDEX.find(a=>a.type==="QD")).schutz.includes("mA")'),true);
// Virtual building storage must round-trip the image and editable bridge project.
run('testGeb={id:"G",ortId:"k:K",verteiler:[{id:"V",name:"Test"}],rcds:[],stromkreise:[],vtTeile:[],stellen:[]};ecGebNorm=g=>g;ecOrt=()=>({kunde:null});ecGebSpeichern=g=>{};DB.gebaeude=new Map([["G",testGeb]]);ecNr=()=>0;adrText=()=>"";legNummern=()=>{};legNummernVolta=()=>{};testL={_geb:"G",_v:"V",titel:"Test",eintraege:[{...testEntry,klemmenProjekt:{terminals:[{id:"T1"}],bridges:[]}}]};vtSchreiben(testL);testRound=vtL("G","V")');
assert.equal(run('testRound.eintraege[0].katalog.data'),run('testEntry.katalog.data'));assert.equal(run('testRound.eintraege[0].klemmenProjekt.terminals[0].id'),'T1');
// A copied block must not share mutable terminal/bridge objects with its original.
run('testCopy={eintraege:[{...testEntry,klemmenProjekt:{terminals:[{id:"T1",label:{text:"A"}}],bridges:[]}}]};legKopien(testCopy,0,1);testCopy.eintraege[1].klemmenProjekt.terminals[0].label.text="B"');
assert.equal(run('testCopy.eintraege[0].klemmenProjekt.terminals[0].label.text'),'A');
// Nachtrag Resi9/Hager: eigene Bilder genau zugeordnet, fehlende Resi9-Werte über das B16-Grundbild mit neuem Aufdruck.
assert.equal(run('gkMatAsset("R9F23116").file'),'assets/asset_'+index.find(a=>a.article==='R9F23116').id.slice(6)+'.svg');
assert.equal(run('gkMatAsset("EGN200").dimension.width'),35.8);
assert.equal(run('JSON.stringify(gkMatAsset("R9F24340")._anp.ersetzen)'),JSON.stringify([["R9F23316","R9F24340"],["B16","C40"]]));
// Leerplatz: kein Gerätebild, keine Blindabdeckung.
assert(!run('legGeraetBild({id:"r",art:"res",pole:1},0,1,0,50)').includes('<image'));
const engine=require('../src/katalog/klemmen-engine.js');
const terminals=Array.from({length:12},(_,i)=>({id:'T'+i,profile:'wago_2004_1201',manufacturer:'WAGO',netId:'N'+Math.floor(i/2),rcdGroup:'R1',label:{text:String(i+1)}}));
const project={schemaVersion:1,units:'mm',terminals,bridges:Array.from({length:5},(_,i)=>({id:'B'+i,article:'2004-402',contacts:[{terminalId:'T'+i*2,slotId:'A'},{terminalId:'T'+(i*2+1),slotId:'A'}]}))};
engine.validate(project,profiles);let copy=structuredClone(project);copy.bridges.splice(2,1);assert.equal(engine.validate(copy,profiles).length,12);assert.equal(copy.bridges.length,4);
copy=structuredClone(project);copy.terminals[1].rcdGroup='R2';assert.throws(()=>engine.validate(copy,profiles),/RCD/);
copy=structuredClone(project);copy.terminals[1].netId='other';assert.throws(()=>engine.validate(copy,profiles),/Netze/);
copy=structuredClone(project);copy.bridges[0].article='wrong';assert.throws(()=>engine.validate(copy,profiles),/artikel/i);
for(const app of ['echeck','uebersicht','evse','baustelle']){for(const m of read(app+'/index.html').matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi))new vm.Script(m[1]);}
console.log((bilderDa?'OK: 2.184 Bildprüfsummen,':'OK (Bilder liegen im SharePoint, Prüfsummen nur im Index geprüft):')+' Millimeterlayout, Suche, Schutzdaten, Gebäudespeicherung, Kopien, fünf unabhängige Brücken und vier App-Builds.');
