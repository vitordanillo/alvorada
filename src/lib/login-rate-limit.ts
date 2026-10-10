import fs from 'node:fs';
import path from 'node:path';
import {createHmac} from 'node:crypto';
const windowMs=15*60*1000;
let lastCleanup=0;
function location(key:string){
  const directory=process.env.ALVORADA_SECURITY_DIR||path.resolve(process.cwd(),'..','security','rate-limits');
  fs.mkdirSync(directory,{recursive:true});
  if(Date.now()-lastCleanup>windowMs){
    lastCleanup=Date.now();
    for(const name of fs.readdirSync(directory)){
      if(!/^[a-f0-9]{64}\.json(?:\.lock|\.tmp)?$/.test(name))continue;
      const file=path.resolve(directory,name);
      if(path.dirname(file)!==path.resolve(directory))throw new Error('Caminho de segurança inválido.');
      try{if(Date.now()-fs.statSync(file).mtimeMs>2*windowMs)fs.rmSync(file,{recursive:name.endsWith('.lock'),force:true});}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
    }
  }
  return path.join(directory,createHmac('sha256',process.env.AUTH_SESSION_SECRET||'local-development').update(key).digest('hex')+'.json');
}

export function recordLoginAttempt(key:string,limit=10){
  const file=location(key),lock=file+'.lock',now=Date.now();
  if(fs.existsSync(lock)&&now-fs.statSync(lock).mtimeMs>30000)fs.rmdirSync(lock);
  try{fs.mkdirSync(lock);}catch{throw new Error('Aguarde alguns minutos antes de tentar novamente.');}
  try{
    let entry={count:0,expires:now+windowMs};
    if(fs.existsSync(file)){const prior=JSON.parse(fs.readFileSync(file,'utf8'));if(prior.expires>now)entry=prior;}
    if(entry.count>=limit)throw new Error('Muitas tentativas de login. Aguarde 15 minutos.');
    entry.count++;
    const temporary=file+'.tmp';fs.writeFileSync(temporary,JSON.stringify(entry),{mode:0o600});fs.renameSync(temporary,file);
  }finally{fs.rmdirSync(lock);}
}

export function clearLoginAttempts(key:string){fs.rmSync(location(key),{force:true});}
