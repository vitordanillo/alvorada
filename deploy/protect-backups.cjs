'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {protect,unprotect}=require('./protected-buffer.cjs');
const directory=path.resolve(__dirname,'../../backups');
let count=0;
for(const name of fs.readdirSync(directory)){
 if(!/^alvorada-\d+\.json(?:\.env|\.migrate\.env)?$/.test(name))continue;
 const source=path.resolve(directory,name),target=source+'.dpapi';
 if(path.dirname(source)!==directory)throw new Error('Caminho de backup inválido.');
 const original=fs.readFileSync(source);
 if(!fs.existsSync(target))fs.writeFileSync(target,protect(original),{flag:'wx',mode:0o600});
 const hash=data=>crypto.createHash('sha256').update(data).digest();
 if(!crypto.timingSafeEqual(hash(original),hash(unprotect(fs.readFileSync(target)))))throw new Error('Backup protegido divergente. Original preservado.');
 if(fs.existsSync(source+'.sha256'))fs.copyFileSync(source+'.sha256',target+'.sha256');
 fs.unlinkSync(source);count++;
}
console.log(JSON.stringify({protected:count,verified:true,directory}));
