import type {OfflineOperation} from './offline-operation-types';
export async function submitOfflineOperationAction(input:OfflineOperation):Promise<{ok:true;result:any}|{ok:false;confirmedRejected:boolean;error:string}>{
  const response=await fetch('/api/offline/operations',{
    method:'POST',credentials:'same-origin',cache:'no-store',
    headers:{'Content-Type':'application/json','X-Alvorada-Protocol':'1'},
    body:JSON.stringify(input),signal:AbortSignal.timeout(30000)
  });
  const result=await response.json();
  // An expired session, protocol mismatch or unavailable server must never
  // discard a sale. Only a definitive business rejection pauses the queue.
  if(!response.ok)throw new Error(result.error||'Não foi possível confirmar a operação.');
  if(typeof result.ok!=='boolean')throw new Error('Resposta de sincronização inválida.');
  return result;
}
