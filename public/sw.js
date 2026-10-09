/* Application shell only. API responses, credentials and mutation requests are never cached. */
const VERSION='__ALVORADA_BUILD__';
const ASSETS='alvorada-assets-'+VERSION;
const META='alvorada-offline-meta';
let activeScope='';
const scopeReady=caches.open(META).then(async c=>{const r=await c.match('/__scope');activeScope=r?await r.text():'';});
const allowed=p=>p==='/pos'||p==='/dashboard'||p.startsWith('/dashboard/');
const shell=()=> 'alvorada-shell-'+VERSION+'-'+activeScope;
async function cacheAssets(html){
 const urls=[...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)].map(m=>m[1]).filter(u=>u.startsWith('/_next/static/')||u.startsWith('/fonts/'));
 const cache=await caches.open(ASSETS);
 await Promise.allSettled([...new Set(urls)].map(async u=>{if(await cache.match(u))return;const r=await fetch(u);if(r.ok)await cache.put(u,r);}));
}
async function warm(path){
 if(!activeScope||!allowed(new URL(path,self.location.origin).pathname))return;
 const scope=activeScope;
 const r=await fetch(path,{credentials:'same-origin',cache:'no-store',headers:{'X-Alvorada-Warm':'1'}});
 if(!r.ok||r.redirected||!(r.headers.get('content-type')??'').includes('text/html')||activeScope!==scope)return;
 const html=await r.clone().text();await caches.open(shell()).then(c=>c.put(path,r));await cacheAssets(html);
}
self.addEventListener('install',()=>{});
self.addEventListener('activate',event=>event.waitUntil((async()=>{await scopeReady;await self.clients.claim();/* Keep old assets until the new shell is prepared; pending records live in IndexedDB. */})()));
self.addEventListener('message',event=>{
 event.waitUntil((async()=>{
  await scopeReady;
  if(event.data?.type==='LOCK'){
   activeScope='';await caches.open(META).then(c=>c.delete('/__scope'));
   for(const key of await caches.keys())if(key.startsWith('alvorada-shell-'))await caches.delete(key);
  }
  if(event.data?.type==='PREPARE'&&/^[a-zA-Z0-9:-]+$/.test(event.data.scope)){
   activeScope=event.data.scope;await caches.open(META).then(c=>c.put('/__scope',new Response(activeScope)));
   const paths=Array.isArray(event.data.paths)?event.data.paths.filter(p=>typeof p==='string'&&p.startsWith('/')&&!p.startsWith('//')&&allowed(p)).slice(0,30):[];
   let assetsReady=true;
   try{const manifest=await fetch('/offline-assets.json',{cache:'no-store'}).then(r=>r.json());const cache=await caches.open(ASSETS);for(const asset of manifest){try{if(await cache.match(asset))continue;const response=await fetch(asset);if(!response.ok)throw new Error('asset');await cache.put(asset,response);}catch{assetsReady=false;}}}catch{assetsReady=false;}
   let prepared=0;
   for(const path of paths){try{await warm(path);const hit=await caches.open(shell()).then(c=>c.match(path));if(hit)prepared++;}catch{}}
   const cache=await caches.open(shell());const ready=assetsReady&&paths.every(path=>allowed(path))&&prepared===paths.length;
   event.ports[0]?.postMessage({ready,prepared,total:paths.length});
   if(ready)for(const key of await caches.keys())if(key.startsWith('alvorada-shell-')&&key!==shell())await caches.delete(key);
  }
 })());
});
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);
 if(req.method!=='GET'||url.origin!==self.location.origin)return;
 if((url.pathname.startsWith('/_next/static/')||/^\/\.next-[a-z-]+\/static\//.test(url.pathname))||url.pathname.startsWith('/fonts/')||url.pathname==='/logo.svg'){
  event.respondWith((async()=>{const c=await caches.open(ASSETS);const hit=await c.match(req);if(hit)return hit;const r=await fetch(req);if(r.ok)await c.put(req,r.clone());return r;})());return;
 }
 if(req.mode==='navigate'&&(allowed(url.pathname)||url.pathname==='/')){
  event.respondWith((async()=>{
   await scopeReady;
   try{const r=await fetch(req,{signal:AbortSignal.timeout(5000)});if(r.ok&&!r.redirected&&activeScope){const copy=r.clone();await caches.open(shell()).then(c=>c.put(url.pathname,copy));}return r;}
   catch{if(activeScope){const c=await caches.open(shell());const hit=await c.match(url.pathname==='/'?'/pos':url.pathname);if(hit)return hit;}
    return new Response('<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Alvorada offline</title><body style="font:16px system-ui;padding:40px"><h1>Esta página ainda não foi preparada</h1><p>As operações salvas neste dispositivo continuam preservadas. Conecte para preparar o aplicativo ou volte ao PDV disponível.</p><a href="/pos">Abrir PDV</a></body></html>',{status:503,headers:{'Content-Type':'text/html;charset=utf-8'}});
   }
  })());
 }
});
