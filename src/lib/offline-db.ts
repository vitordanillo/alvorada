// Utility to manage IndexedDB for Offline-First POS
const DB_NAME = 'AlvoradaOffline';
const DB_VERSION = 1;

export interface OfflineSale {
  id: string; // Temporary UUID
  saleData: any;
  activeSessionId: string;
  createdAt: string;
}

export function initOfflineDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

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

export async function saveToCache(key: string, data: any): Promise<void> {
  try {
    const db = await initOfflineDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['cachedData'], 'readwrite');
      const store = transaction.objectStore('cachedData');
      const request = store.put(data, key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Failed to save to offline cache:', err);
  }
}

export async function getFromCache<T>(key: string): Promise<T | null> {
  try {
    const db = await initOfflineDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['cachedData'], 'readonly');
      const store = transaction.objectStore('cachedData');
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Failed to get from offline cache:', err);
    return null;
  }
}

export async function queueOfflineSale(sale: OfflineSale): Promise<void> {
  try {
    const db = await initOfflineDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['salesQueue'], 'readwrite');
      const store = transaction.objectStore('salesQueue');
      const request = store.put(sale);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Failed to queue offline sale:', err);
  }
}

export async function getQueuedSales(): Promise<OfflineSale[]> {
  try {
    const db = await initOfflineDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['salesQueue'], 'readonly');
      const store = transaction.objectStore('salesQueue');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Failed to get queued sales:', err);
    return [];
  }
}

export async function removeQueuedSale(id: string): Promise<void> {
  try {
    const db = await initOfflineDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['salesQueue'], 'readwrite');
      const store = transaction.objectStore('salesQueue');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Failed to remove queued sale:', err);
  }
}
