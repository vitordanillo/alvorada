'use strict';
// Publish the manifest last, after all referenced files exist and match hashes.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const yaml=require('js-yaml');
const target=path.resolve(process.argv[2]||'');
if(path.basename(target)!=='desktop-updates')throw new Error('Destino de publicação inválido.');
const dist=path.join(__dirname,'dist');
const metadata=fs.readFileSync(path.join(dist,'latest.yml'));
const info=yaml.load(metadata.toString());
const version=/^\d+\.\d+\.\d+$/;
if(!version.test(info.version)||!Array.isArray(info.files)||info.files.length!==1)throw new Error('Manifesto inválido.');
const expected=`Alvorada-${info.version}-x64.exe`;
const installer=fs.readFileSync(path.join(dist,expected));
const hash=crypto.createHash('sha512').update(installer).digest('base64');
if(info.path!==expected||info.files[0].url!==expected||info.sha512!==hash||info.files[0].sha512!==hash||info.files[0].size!==installer.length)throw new Error('Hash ou tamanho do instalador divergente.');
const blockmap=fs.readFileSync(path.join(dist,expected+'.blockmap'));
fs.mkdirSync(target,{recursive:true});
const currentFile=path.join(target,'latest.yml');
if(fs.existsSync(currentFile)){
  const current=yaml.load(fs.readFileSync(currentFile,'utf8'));
  const compare=(a,b)=>{const left=a.split('.').map(BigInt),right=b.split('.').map(BigInt);for(let i=0;i<3;i++){if(left[i]>right[i])return 1;if(left[i]<right[i])return -1;}return 0;};
  if(!version.test(current.version)||compare(info.version,current.version)<0)throw new Error('Publicação de versão anterior bloqueada.');
  if(current.version===info.version&&current.sha512!==hash)throw new Error('Uma versão publicada é imutável. Aumente a versão.');
}
function atomic(name,body){const destination=path.join(target,name);const temporary=destination+`.staging-${process.pid}`;fs.writeFileSync(temporary,body);fs.renameSync(temporary,destination);}
atomic(expected,installer);
atomic(expected+'.blockmap',blockmap);
atomic('Alvorada-Setup.exe',installer);
atomic('latest.json',JSON.stringify({version:info.version,downloadUrl:`https://alvorada.firmaconecta.com/desktop-updates/${expected}`,sha512:hash}));
if(fs.existsSync(currentFile))fs.copyFileSync(currentFile,path.join(target,'previous.yml'));
atomic('latest.yml',metadata);
console.log(`DESKTOP_PUBLISHED ${info.version} ${installer.length} bytes`);
