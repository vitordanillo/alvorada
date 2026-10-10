export type PlatformStatus={maintenance:{enabled:boolean;message:string;expectedReturn:string|null;revision:number};messages:{id:string;kind:string;title:string;body:string;version:string;publishedAt:string}[]};
const KEY='granzoti-platform-status-v1';
let etag='';
export function savedPlatformStatus():PlatformStatus|null{
 try{const s=JSON.parse(localStorage.getItem(KEY)??'null');return s&&typeof s.maintenance?.enabled==='boolean'&&Array.isArray(s.messages)?s:null;}catch{return null;}
}
export async function refreshPlatformStatus():Promise<PlatformStatus>{
 const response=await fetch('/api/platform-status',{cache:'no-store',credentials:'same-origin',headers:etag&&savedPlatformStatus()?{'If-None-Match':etag}:{},signal:AbortSignal.timeout(5000)});
 if(response.status===304){const cached=savedPlatformStatus();if(cached)return cached;throw new Error('Atualize a situação do sistema.');}
 if(!response.ok)throw new Error('Não foi possível consultar a situação do sistema.');
 const status:PlatformStatus=await response.json();
 etag=response.headers.get('etag')??'';
 if(typeof status.maintenance?.enabled!=='boolean'||!Array.isArray(status.messages))throw new Error('Situação do sistema inválida.');
 const previous=savedPlatformStatus();
 // A slower response must not overwrite a newer maintenance revision.
 if(previous&&previous.maintenance.revision>status.maintenance.revision)return previous;
 try{localStorage.setItem(KEY,JSON.stringify(status));}catch{/* State still reaches the current session. */}
 window.dispatchEvent(new CustomEvent('granzoti-platform-status',{detail:status}));
 return status;
}
export async function ensureOperationAllowed(){
 let status=savedPlatformStatus();
 if(navigator.onLine){try{status=await refreshPlatformStatus();}catch{/* Preserve known block when disconnected. */}}
 if(status?.maintenance.enabled)throw new Error(status.maintenance.message||'Sistema em manutenção. Aguarde a liberação.');
}
