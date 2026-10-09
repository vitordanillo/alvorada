'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const ORIGIN='https://alvorada.firmaconecta.com';
const allowed=url=>url.pathname==='/pos'||url.pathname==='/dashboard'||url.pathname.startsWith('/dashboard/');
class LocalShell {
  constructor(session,storage){
    this.storage=storage;
    this.directory=path.join(__dirname,'assets','shell');
    const manifest=path.join(this.directory,'manifest.json');
    this.assets=fs.existsSync(manifest)?JSON.parse(fs.readFileSync(manifest,'utf8')):{};
    this.scope=JSON.parse(storage.db.prepare("SELECT value FROM metadata WHERE id='activeScope'").get()?.value||'null');
    session.protocol.handle('https',async request=>{
      const url=new URL(request.url);
      if(url.origin!==ORIGIN)return session.fetch(request,{bypassCustomProtocolHandlers:true});
      if(request.method==='GET'&&this.assets[url.pathname]){
        const asset=this.assets[url.pathname];
        const buffer=fs.readFileSync(path.join(this.directory,asset.file));
        if(crypto.createHash('sha256').update(buffer).digest('hex')!==asset.sha256)throw new Error('Arquivo de interface corrompido.');
        return new Response(buffer,{headers:{'Content-Type':asset.type,'Cache-Control':'public,max-age=31536000,immutable'}});
      }
      const document=request.method==='GET'&&allowed(url)&&!request.headers.has('rsc')&&(request.headers.get('accept')?.includes('text/html')||request.headers.has('x-alvorada-warm'));
      const scope=this.scope;
      try{
        const response=await session.fetch(request,{bypassCustomProtocolHandlers:true,credentials:'include',redirect:'manual',signal:AbortSignal.timeout(document?5000:30000)});
        if(document&&response.ok&&!response.redirected&&response.headers.get('content-type')?.includes('text/html')&&this.validScope(scope)&&this.scope?.id===scope.id){
          const html=await response.clone().text();
          if(Buffer.byteLength(html)<8*1024*1024)this.storage.db.prepare('INSERT INTO shell(scope,path,html) VALUES (?,?,?) ON CONFLICT(scope,path) DO UPDATE SET html=excluded.html').run(scope.id,url.pathname,html);
        }
        return response;
      }catch(error){
        if(document&&this.validScope(scope)&&this.scope?.id===scope.id){
          const row=this.storage.db.prepare('SELECT html FROM shell WHERE scope=? AND path=?').get(scope.id,url.pathname);
          if(row)return new Response(row.html,{headers:{'Content-Type':'text/html;charset=utf-8','Cache-Control':'no-store'}});
        }
        // Never cache or fabricate confirmation for API, authentication or POST.
        throw error;
      }
    });
  }
  validScope(scope){return scope&&typeof scope.id==='string'&&scope.expires>Date.now();}
  activate(scope,expires){
    this.storage.validate(scope,'cachedData','_');
    if(!Number.isFinite(expires)||expires<=Date.now()||expires>Date.now()+7*86400000+60000)throw new Error('Sessão local inválida.');
    this.scope={id:scope,expires};
    this.storage.db.prepare("INSERT OR REPLACE INTO metadata(id,value) VALUES ('activeScope',?)").run(JSON.stringify(this.scope));
  }
  lock(){this.scope=null;this.storage.db.exec("DELETE FROM metadata WHERE id='activeScope'; DELETE FROM shell;");}
}
module.exports={LocalShell};
