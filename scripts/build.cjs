
const fs=require('node:fs'),path=require('node:path');
const business=require('../config/business.cjs');
const out=path.resolve(__dirname,'../dist');
fs.mkdirSync(out,{recursive:true});
fs.copyFileSync(path.join(__dirname,'../index.html'),path.join(out,'index.html'));
function copyTree(source,target){fs.mkdirSync(target,{recursive:true});for(const entry of fs.readdirSync(source,{withFileTypes:true})){const src=path.join(source,entry.name),dest=path.join(target,entry.name);if(entry.isDirectory())copyTree(src,dest);else fs.copyFileSync(src,dest);}}
copyTree(path.join(__dirname,'../assets'),path.join(out,'assets'));
fs.writeFileSync(path.join(out,'assets/js/business.js'),'window.NEXGUARD = '+JSON.stringify({whatsapp:business.whatsapp,whatsappLabel:business.whatsappLabel,email:business.email})+';\n');
fs.writeFileSync(path.join(out,'assets/prices.json'),JSON.stringify({approved:business.prices.approved,items:business.prices.approved?business.prices.items:[]}));
let html=fs.readFileSync(path.join(out,'index.html'),'utf8');
html=html.replaceAll('5519993427954',business.whatsapp).replaceAll('(19) 99342-7954',business.whatsappLabel).replaceAll('contato@nexguardtech.com.br',business.email);
fs.writeFileSync(path.join(out,'index.html'),html);
console.log('Build estático concluído. Preços: '+(business.prices.approved?'aprovados':'ocultos')+'.');
