import {desktopStorage} from './desktop-storage';
// SQLite in the desktop application; IndexedDB in the browser.
const databaseName = (scope: string) => { if(!scope || !/^[a-zA-Z0-9:-]+$/.test(scope)) throw new Error('Loja e usuário são obrigatórios para o cache.'); return `AlvoradaOfflineV2:${scope}`; };
const DB_VERSION = 2;
function safeCache(key:string,value:any){
 if(key==='snapshot'||key.startsWith('page:')||key.startsWith('service:')||key.startsWith('report:')||key.startsWith('ledger:'))return value&&typeof value==='object'?value:null;
 if(key==='lastSync')return typeof value==='string'&&Number.isFinite(Date.parse(value))?value:null;
 if(key==='systemSettings')return value&&typeof value==='object'?{cancellationPasswordConfigured:!!value.cancellationPasswordConfigured}:null;
 if(!Array.isArray(value))return [];
 return value.filter(row=>{
  if(!row||typeof row!=='object')return false;
  if(key==='allUsers')return typeof row.uid==='string'&&typeof row.email==='string';
  if(typeof row.id!=='string')return false;
  if(key==='products')return typeof row.name==='string'&&Number.isFinite(row.stock)&&Number.isFinite(row.price)&&Number.isFinite(row.averageCost)&&Array.isArray(row.costHistory);
  if(key==='customers')return typeof row.name==='string'&&Number.isFinite(row.balance)&&Number.isFinite(row.creditLimit)&&Number.isFinite(row.loyaltyPoints);
  if(key==='sales')return Number.isFinite(Date.parse(row.date))&&Number.isFinite(row.total)&&Array.isArray(row.items)&&Array.isArray(row.paymentMethods)&&['Concluída','Cancelada','Pendente'].includes(row.status);
  if(key==='cashSessions')return Number.isFinite(Date.parse(row.openingTime))&&Number.isFinite(row.calculatedCashInDrawer)&&row.openedBy&&['Aberto','Fechado'].includes(row.status);
  return true;
 });
}

export interface OfflineSale {
  id: string; // Temporary UUID
  saleData: any;
  activeSessionId: string;
  createdAt: string;
  lastError?: string;
  attempts?: number;
}

export async function getLegacyQueuedSales(): Promise<OfflineSale[]> {
  // Never read the old shared customer/product cache. Only recover queued sales
  // after the server verifies that their cash sessions belong to the selected store.
  if(!indexedDB.databases || !(await indexedDB.databases()).some(db=>db.name==='AlvoradaOffline')) return [];
  return new Promise((resolve,reject)=>{
    const open=indexedDB.open('AlvoradaOffline');
    open.onerror=()=>reject(open.error);
    open.onsuccess=()=>{
      const db=open.result;
      if(!db.objectStoreNames.contains('salesQueue')){db.close();resolve([]);return;}
      const tx=db.transaction('salesQueue','readonly');
      const request=tx.objectStore('salesQueue').getAll();
      request.onsuccess=()=>resolve(request.result ?? []);
      request.onerror=()=>reject(request.error);
      tx.oncomplete=()=>db.close();
    };
  });
}

export async function recoverLegacySales(scope: string, sales: OfflineSale[]): Promise<void> {
  for(const sale of sales) {
    await queueOfflineSale(scope,{...sale,saleData:{...sale.saleData,clientRequestId:sale.saleData.clientRequestId ?? sale.id}});
    await new Promise<void>((resolve,reject)=>{
      const open=indexedDB.open('AlvoradaOffline');
      open.onerror=()=>reject(open.error);
      open.onsuccess=()=>{
        const db=open.result;
        const tx=db.transaction('salesQueue','readwrite');
        tx.objectStore('salesQueue').delete(sale.id);
        tx.oncomplete=()=>{db.close();resolve();};
        tx.onerror=()=>{db.close();reject(tx.error);};
      };
    });
  }
}

export function initOfflineDb(scope: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName(scope), DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB open error:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('operations')) db.createObjectStore('operations', {keyPath:'id'});
      if (!db.objectStoreNames.contains('salesQueue')) {
        db.createObjectStore('salesQueue', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('cachedData')) {
        db.createObjectStore('cachedData');
      }
    };
  });
}

export async function saveToCache(scope: string, key: string, data: any): Promise<void> {
  const desktop=await desktopStorage(scope);if(desktop){await desktop.storage('put',scope,'cachedData',key,data);return;}
  try {
    const db = await initOfflineDb(scope);
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['cachedData'], 'readwrite');
      const store = transaction.objectStore('cachedData');
      const request = store.put(data, key);

      transaction.oncomplete = () => { db.close(); resolve(); };
      transaction.onerror = () => reject(transaction.error);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    throw err;
  }
}

export async function getFromCache<T>(scope: string, key: string): Promise<T | null> {
  const desktop=await desktopStorage(scope);if(desktop)return safeCache(key,await desktop.storage('get',scope,'cachedData',key)) as T;
  try {
    const db = await initOfflineDb(scope);
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['cachedData'], 'readonly');
      const store = transaction.objectStore('cachedData');
      const request = store.get(key);
      transaction.oncomplete = () => db.close();

      request.onsuccess = () => resolve(safeCache(key,request.result) as T);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Failed to get from offline cache:', err);
    return null;
  }
}

export async function queueOfflineSale(scope: string, sale: OfflineSale): Promise<void> {
  const desktop=await desktopStorage(scope);if(desktop){await desktop.storage('put',scope,'salesQueue',sale.id,sale);return;}
  try {
    const db = await initOfflineDb(scope);
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['salesQueue'], 'readwrite');
      const store = transaction.objectStore('salesQueue');
      const request = store.put(sale);

      transaction.oncomplete = () => {db.close();resolve();};
      transaction.onerror = () => {db.close();reject(transaction.error);};
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Failed to queue offline sale:', err);
    throw err;
  }
}

export async function getQueuedSales(scope: string): Promise<OfflineSale[]> {
  const desktop=await desktopStorage(scope);if(desktop)return desktop.storage('all',scope,'salesQueue');
  try {
    const db = await initOfflineDb(scope);
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['salesQueue'], 'readonly');
      const store = transaction.objectStore('salesQueue');
      const request = store.getAll();
      transaction.oncomplete = () => db.close();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Failed to get queued sales:', err);
    throw err;
  }
}

export async function removeQueuedSale(scope: string, id: string): Promise<void> {
  const desktop=await desktopStorage(scope);if(desktop){await desktop.storage('remove',scope,'salesQueue',id);return;}
  try {
    const db = await initOfflineDb(scope);
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['salesQueue'], 'readwrite');
      const store = transaction.objectStore('salesQueue');
      const request = store.delete(id);

      transaction.oncomplete = () => {db.close();resolve();};
      transaction.onerror = () => {db.close();reject(transaction.error);};
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Failed to remove queued sale:', err);
    throw err;
  }
}

import type {OfflineOperation} from './offline-operation-types';
async function operationTransaction<T>(scope:string,mode:IDBTransactionMode,work:(store:IDBObjectStore)=>IDBRequest<T>):Promise<T>{
 const db=await initOfflineDb(scope);
 return new Promise((resolve,reject)=>{const tx=db.transaction('operations',mode);let result:T;const request=work(tx.objectStore('operations'));request.onsuccess=()=>{result=request.result;};tx.oncomplete=()=>{db.close();resolve(result);};tx.onabort=tx.onerror=()=>{db.close();reject(tx.error??new Error('Não foi possível salvar a operação no dispositivo.'));};});
}
export async function queueOperation(scope:string,item:OfflineOperation):Promise<void>{
 const desktop=await desktopStorage(scope);if(desktop){await desktop.storage('put',scope,'operations',item.id,item);return;}
 const db=await initOfflineDb(scope);
 await new Promise<void>((resolve,reject)=>{const tx=db.transaction('operations','readwrite');const store=tx.objectStore('operations');const read=store.getAll();read.onsuccess=()=>{const rows=read.result as OfflineOperation[];const prior=rows.find(r=>r.id===item.id);const sequence=prior?.sequence??Math.max(Date.now()*1000,...rows.map(r=>r.sequence??0))+1;store.put({...item,sequence});};tx.oncomplete=()=>{db.close();resolve();};tx.onabort=tx.onerror=()=>{db.close();reject(tx.error??new Error('Falha no armazenamento local.'));};});
}
export async function getOperations(scope:string):Promise<OfflineOperation[]>{const desktop=await desktopStorage(scope);const items:OfflineOperation[]=desktop?await desktop.storage('all',scope,'operations'):await operationTransaction<OfflineOperation[]>(scope,'readonly',store=>store.getAll());return items.sort((a,b)=>(a.sequence??Date.parse(a.createdAt))-(b.sequence??Date.parse(b.createdAt))||a.id.localeCompare(b.id));}
export async function removeOperation(scope:string,id:string):Promise<void>{const desktop=await desktopStorage(scope);if(desktop){await desktop.storage('remove',scope,'operations',id);return;}await operationTransaction(scope,'readwrite',store=>store.delete(id));}
