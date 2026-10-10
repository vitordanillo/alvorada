'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {net}=require('electron');
const ORIGIN='https://alvorada.firmaconecta.com';
const allowed=url=>url.pathname==='/pos'||url.pathname==='/dashboard'||url.pathname.startsWith('/dashboard/');
// net.fetch rejects manual redirects instead of returning their HTTP response.
// Return the redirect to Chromium so it navigates normally and retains the URL.
function forward(session,request,timeout){
  return new Promise((resolve,reject)=>{
    const headers=Object.fromEntries([...request.headers].filter(([name])=>!['content-length','host','connection','transfer-encoding','keep-alive','te','trailer','upgrade'].includes(name)));
    // Chromium omits Origin from protocol Request.headers. Preserve the actual
    // renderer initiator, including untrusted origins, for server CSRF checks.
    const origin=request.initiatorOrigin||request.headers.get('origin')||undefined;
    if(origin)headers.origin=origin;
    const upstream=net.request({url:request.url,method:request.method,headers,origin,session,credentials:'include',redirect:'manual',bypassCustomProtocolHandlers:true});
    const timer=setTimeout(()=>{reject(new Error('Tempo de conexão excedido.'));upstream.abort();},timeout);
    const responseHeaders=values=>{
      const result=new Headers();
      for(const [name,items] of Object.entries(values)){
        if(['content-length','content-encoding','transfer-encoding','connection'].includes(name.toLowerCase()))continue;
        for(const value of Array.isArray(items)?items:[items])result.append(name,value);
      }
      return result;
    };
    upstream.on('error',error=>{clearTimeout(timer);reject(error);});
    upstream.on('redirect',(status,_method,url,values)=>{
      clearTimeout(timer);
      const headers=responseHeaders(values);headers.set('Location',url);
      resolve(new Response(null,{status,headers}));
      upstream.abort();
    });
    upstream.on('response',incoming=>{
      const empty=request.method==='HEAD'||[204,205,304].includes(incoming.statusCode);
      const body=new ReadableStream({start(controller){
        incoming.on('data',chunk=>{if(!empty)controller.enqueue(new Uint8Array(chunk));});
        incoming.on('end',()=>{clearTimeout(timer);controller.close();});
        incoming.on('error',error=>{clearTimeout(timer);controller.error(error);});
        incoming.on('aborted',()=>{clearTimeout(timer);controller.error(new Error('Conexão interrompida.'));});
      },cancel(){clearTimeout(timer);upstream.abort();}});
      resolve(new Response(empty?null:body,{status:incoming.statusCode,headers:responseHeaders(incoming.headers)}));
    });
    (async()=>{
      if(request.body){upstream.chunkedEncoding=true;const reader=request.body.getReader();try{for(;;){const {done,value}=await reader.read();if(done)break;upstream.write(Buffer.from(value));}}finally{reader.releaseLock();}}
      upstream.end();
    })().catch(error=>{clearTimeout(timer);reject(error);upstream.abort();});
  });
}
class LocalShell {
  constructor(session,storage){
    this.storage=storage;
    this.directory=path.join(__dirname,'assets','shell');
    const manifest=path.join(this.directory,'manifest.json');
    this.assets=fs.existsSync(manifest)?JSON.parse(fs.readFileSync(manifest,'utf8')):{};
    this.scope=JSON.parse(storage.protection.decode(storage.db.prepare("SELECT value FROM metadata WHERE id='activeScope'").get()?.value)||'null');
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
        const response=await forward(session,request,document?15000:30000);
        if(document&&response.ok&&!response.redirected&&response.headers.get('content-type')?.includes('text/html')&&this.validScope(scope)&&this.scope?.id===scope.id){
          const html=await response.clone().text();
          if(Buffer.byteLength(html)<8*1024*1024)this.storage.db.prepare('INSERT INTO shell(scope,path,html) VALUES (?,?,?) ON CONFLICT(scope,path) DO UPDATE SET html=excluded.html').run(scope.id,url.pathname,this.storage.protection.encode(html));
        }
        return response;
      }catch(error){
        if(document&&this.validScope(scope)&&this.scope?.id===scope.id){
          const row=this.storage.db.prepare('SELECT html FROM shell WHERE scope=? AND path=?').get(scope.id,url.pathname);
          if(row)return new Response(this.storage.protection.decode(row.html),{headers:{'Content-Type':'text/html;charset=utf-8','Cache-Control':'no-store'}});
        }
        // Never cache or fabricate confirmation for API, authentication or POST.
        throw error;
      }
    });
  }
  validScope(scope){return scope&&scope.verified===true&&typeof scope.id==='string'&&scope.expires>Date.now();}
  activate(scope,expires,role){
    this.storage.validate(scope,'cachedData','_');
    if(!Number.isFinite(expires)||expires<=Date.now()||expires>Date.now()+7*86400000+60000)throw new Error('Sessão local inválida.');
    if(!['Administrador','Gerente','Operador de Caixa','Estoquista'].includes(role))throw new Error('Cargo local inválido.');
    this.scope={id:scope,expires,role,verified:true};
    this.storage.db.prepare("INSERT OR REPLACE INTO metadata(id,value) VALUES ('activeScope',?)").run(this.storage.protection.encode(JSON.stringify(this.scope)));
  }
  lock(){this.scope=null;this.storage.db.exec("DELETE FROM metadata WHERE id='activeScope'; DELETE FROM shell;");}
}
module.exports={LocalShell};
