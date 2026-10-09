'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const origin='https://alvorada.firmaconecta.com';
(async()=>{
  const response=await fetch(origin+'/offline-assets.json');
  if(!response.ok)throw new Error('Não foi possível obter os arquivos da interface.');
  const assets=await response.json();
  if(!Array.isArray(assets)||assets.length>2000)throw new Error('Manifesto de interface inválido.');
  const directory=path.join(__dirname,'assets','shell');fs.mkdirSync(directory,{recursive:true});
  const manifest={};
  for(const url of [...assets,'/logo.svg']){
    if(typeof url!=='string'||!/^\/(_next\/static\/|logo\.svg$)/.test(url)||url.includes('..'))throw new Error('Caminho de interface inválido.');
    const result=await fetch(origin+url);if(!result.ok)throw new Error('Arquivo indisponível: '+url);
    const body=Buffer.from(await result.arrayBuffer());
    const file=crypto.createHash('sha256').update(url).digest('hex');
    fs.writeFileSync(path.join(directory,file),body);
    manifest[url]={file,type:result.headers.get('content-type')||'application/octet-stream',sha256:crypto.createHash('sha256').update(body).digest('hex')};
  }
  fs.writeFileSync(path.join(directory,'manifest.json'),JSON.stringify(manifest));
  console.log(`${Object.keys(manifest).length} arquivos de interface incluídos no aplicativo.`);
})().catch(error=>{console.error(error.message);process.exitCode=1;});
