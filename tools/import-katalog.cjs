/* Einmaliger Import: node tools/import-katalog.cjs <Katalog-Ordner> */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const source=path.resolve(process.argv[2]||'../Uebergabe-neutral/Katalog'),root=path.resolve(__dirname,'..');
const db=JSON.parse(fs.readFileSync(path.join(source,'datenbank.json'),'utf8'));
const original=JSON.parse(fs.readFileSync(path.join(source,'Integration/assets.json'),'utf8')).assets;
const byFile=new Map(db.devices.map(d=>[d.file||d.svg||d.png,d]));
const out=path.join(root,'src/katalog');fs.mkdirSync(path.join(out,'assets'),{recursive:true});
const assets=original.map(a=>{
 const d=byFile.get(a.file);if(!d)throw Error('Datensatz fehlt: '+a.file);
 const bytes=fs.readFileSync(path.join(source,a.file)),ext=a.format.toLowerCase();
 const file=a.id+'.'+ext;fs.writeFileSync(path.join(out,'assets',file),bytes);
 return {...a,file:'assets/'+file,category:d.category||a.file.split('/')[1].replaceAll('_',' '),series:d.series||a.file.split('/')[2],params:d.request?.params||{},type:d.request?.type||'',sha256:crypto.createHash('sha256').update(bytes).digest('hex')};
});
fs.writeFileSync(path.join(out,'index.json'),JSON.stringify({version:1,assets}));
for(const [from,to] of [['klemmen-engine.js','klemmen-engine.js'],['profiles.json','profiles.json']])fs.copyFileSync(path.join(source,'Integration',from),path.join(out,to));
fs.copyFileSync(path.join(source,'NUTZUNGSFREIGABE.md'),path.join(out,'NUTZUNG.md'));
console.log(`${assets.length} Geräte importiert.`);
