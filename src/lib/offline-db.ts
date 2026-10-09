// Utility to manage IndexedDB for Offline-First POS
const databaseName = (scope: string) => { if(!scope || !/^[a-zA-Z0-9:-]+$/.test(scope)) throw new Error('Loja e usuário são obrigatórios para o cache.'); return `AlvoradaOfflineV2:${scope}`; };
const DB_VERSION = 1;
function safeCache(key:string,value:any){
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
    console.error('Failed to save to offline cache:', err);
  }
}

export async function getFromCache<T>(scope: string, key: string): Promise<T | null> {
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
