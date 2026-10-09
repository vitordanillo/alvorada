type Bucket = 'cachedData' | 'operations' | 'salesQueue';
type Command = 'get' | 'all' | 'put' | 'remove' | 'migrated' | 'import';
export type DesktopUpdateStatus = {state:string; version:string; availableVersion?:string; percent?:number; message:string};
export interface DesktopBridge {
  version: number;
  storage(command:Command, scope:string, bucket?:Bucket, id?:string, value?:unknown):Promise<any>;
  updateStatus():Promise<DesktopUpdateStatus>;
  activateScope(scope:string,expires:number):Promise<void>;
  lock():Promise<void>;
  subscribeUpdates(callback:(status:DesktopUpdateStatus)=>void):()=>void;
}
declare global {interface Window {alvoradaDesktop?:DesktopBridge;}}
const migrations = new Map<string,Promise<void>>();
export function desktopBridge():DesktopBridge|undefined {
  return typeof window !== 'undefined' && window.alvoradaDesktop?.version === 1 ? window.alvoradaDesktop : undefined;
}
export async function desktopStorage(scope:string):Promise<DesktopBridge|undefined> {
  const bridge=desktopBridge();if(!bridge)return;
  let migration=migrations.get(scope);
  if(!migration){
    migration=(async()=>{
      if(await bridge.storage('migrated',scope))return;
      const records:Array<{bucket:Bucket;id:string;value:unknown}>=[];
      // Import only this user's and store's cache, atomically. Keep the original
      // IndexedDB records so interrupted upgrades remain recoverable.
      const db=await new Promise<IDBDatabase>((resolve,reject)=>{
        const request=indexedDB.open(`AlvoradaOfflineV2:${scope}`,2);
        request.onupgradeneeded=()=>{for(const bucket of ['cachedData','operations','salesQueue'])if(!request.result.objectStoreNames.contains(bucket))request.result.createObjectStore(bucket,bucket==='cachedData'?undefined:{keyPath:'id'});};
        request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
      });
      try{
        await new Promise<void>((resolve,reject)=>{
          const buckets=(['cachedData','operations','salesQueue'] as Bucket[]).filter(bucket=>db.objectStoreNames.contains(bucket));
          const tx=db.transaction(buckets,'readonly');
          for(const bucket of buckets){const request=tx.objectStore(bucket).openCursor();request.onsuccess=()=>{const cursor=request.result;if(cursor){records.push({bucket,id:String(cursor.key),value:cursor.value});cursor.continue();}};}
          tx.oncomplete=()=>resolve();tx.onabort=tx.onerror=()=>reject(tx.error);
        });
      }finally{db.close();}
      await bridge.storage('import',scope,undefined,undefined,{records});
    })();
    migrations.set(scope,migration);
    migration.catch(()=>migrations.delete(scope));
  }
  await migration;return bridge;
}
