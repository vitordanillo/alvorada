type Bucket = 'cachedData' | 'operations' | 'salesQueue';
type Command = 'get' | 'all' | 'put' | 'remove' | 'migrated' | 'import' | 'legacyProtected' | 'markLegacyProtected';
export type DesktopUpdateStatus = {state:string; version:string; availableVersion?:string; percent?:number; message:string};
export interface DesktopBridge {
  version: number;
  storage(command:Command, scope:string, bucket?:Bucket, id?:string, value?:unknown):Promise<any>;
  updateStatus():Promise<DesktopUpdateStatus>;
  activateScope(scope:string,expires:number):Promise<void>;
  lock():Promise<void>;
  protectLegacy?(scope:string,value:unknown,decode?:boolean):Promise<any>;
  subscribeUpdates(callback:(status:DesktopUpdateStatus)=>void):()=>void;
}
declare global {interface Window {alvoradaDesktop?:DesktopBridge;}}
const migrations = new Map<string,Promise<void>>();
function legacyEnvelope(value:unknown):value is {granzotiProtected:true;ciphertext:string}{return !!value&&typeof value==='object'&&(value as any).granzotiProtected===true&&typeof (value as any).ciphertext==='string';}
export function desktopBridge():DesktopBridge|undefined {
  return typeof window !== 'undefined' && window.alvoradaDesktop?.version === 1 ? window.alvoradaDesktop : undefined;
}
export async function desktopStorage(scope:string):Promise<DesktopBridge|undefined> {
  const bridge=desktopBridge();if(!bridge)return;
  let migration=migrations.get(scope);
  if(!migration){
    migration=(async()=>{
      const migrated=await bridge.storage('migrated',scope);
      if(migrated&&(!bridge.protectLegacy||await bridge.storage('legacyProtected',scope)))return;
      const records:Array<{bucket:Bucket;id:string;value:unknown}>=[];
      // Preserve the legacy mirror, protecting it only after an atomic import.
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
      if(!migrated){
        for(const row of records)if(legacyEnvelope(row.value))row.value=await bridge.protectLegacy!(scope,row.value.ciphertext,true);
        await bridge.storage('import',scope,undefined,undefined,{records});
      }
      if(bridge.protectLegacy){
        const protectedRows=await Promise.all(records.map(async row=>({...row,value:legacyEnvelope(row.value)?row.value:{id:row.id,granzotiProtected:true,ciphertext:await bridge.protectLegacy!(scope,row.value)}})));
        const legacy=await new Promise<IDBDatabase>((resolve,reject)=>{const request=indexedDB.open(`AlvoradaOfflineV2:${scope}`,2);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
        try{await new Promise<void>((resolve,reject)=>{const tx=legacy.transaction(['cachedData','operations','salesQueue'],'readwrite');for(const row of protectedRows){const store=tx.objectStore(row.bucket);if(row.bucket==='cachedData')store.put(row.value,row.id);else store.put(row.value);}tx.oncomplete=()=>resolve();tx.onabort=tx.onerror=()=>reject(tx.error);});}finally{legacy.close();}
        await bridge.storage('markLegacyProtected',scope);
      }
    })();
    migrations.set(scope,migration);
    migration.catch(()=>migrations.delete(scope));
  }
  await migration;return bridge;
}
