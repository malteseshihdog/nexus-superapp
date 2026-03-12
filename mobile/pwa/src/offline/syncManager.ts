const DB_NAME = 'nexus-offline';
const STORE_NAME = 'pending_changes';
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'fileId' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export interface PendingChange {
  fileId: string;
  projectId: string;
  content: string;
  timestamp: string;
}

export const syncManager = {
  async queueChange(change: PendingChange): Promise<void> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(change);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async getAllPending(): Promise<PendingChange[]> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).getAll();
      req.onsuccess = () => resolve(req.result as PendingChange[]);
      req.onerror = () => reject(req.error);
    });
  },

  async syncPendingChanges(): Promise<{ synced: number; failed: number }> {
    const pending = await syncManager.getAllPending();
    if (pending.length === 0) return { synced: 0, failed: 0 };

    let synced = 0;
    let failed = 0;

    for (const change of pending) {
      try {
        const res = await fetch(`/api/v1/projects/${change.projectId}/files/${change.fileId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: change.content, changeType: 'update', timestamp: change.timestamp }),
        });
        if (res.ok) {
          await syncManager.removeChange(change.fileId);
          synced++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    return { synced, failed };
  },

  async removeChange(fileId: string): Promise<void> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(fileId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async clearAll(): Promise<void> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
};
