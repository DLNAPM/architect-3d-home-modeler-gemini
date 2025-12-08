import { SavedDesign } from '../types';

const DB_NAME = 'Architect3D_DB';
const STORE_NAME = 'designs';
const DB_VERSION = 1;

export const dbService = {
  async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject("Error opening database");

      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          // Create object store with 'id' from the housePlan as the key
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'housePlan.id' });
          // Create an index to query designs by userId
          store.createIndex('userId', 'userId', { unique: false });
        }
      };
    });
  },

  async saveDesign(design: SavedDesign, userId: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      // We store the userId along with the design to filter by user later.
      // IndexedDB allows storing structured objects, so we can just add the property.
      const record = { ...design, userId };
      
      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async getUserDesigns(userId: string): Promise<SavedDesign[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('userId');
      const request = index.getAll(userId);

      request.onsuccess = () => {
         resolve(request.result as SavedDesign[]);
      };
      request.onerror = () => reject(request.error);
    });
  },

  async deleteDesign(id: string): Promise<void> {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
          const transaction = db.transaction([STORE_NAME], 'readwrite');
          const store = transaction.objectStore(STORE_NAME);
          const request = store.delete(id);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
      });
  },

  /**
   * Updates the userId for a set of designs. Used when migrating anonymous designs to a logged-in user.
   */
  async reassignDesigns(oldUserId: string, newUserId: string): Promise<void> {
      const designs = await this.getUserDesigns(oldUserId);
      if (designs.length === 0) return;

      const db = await this.openDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      return new Promise((resolve, reject) => {
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);

          designs.forEach(design => {
              // Delete old record (though 'put' handles update, semantically we are moving ownership)
              // Actually, since keyPath is ID, 'put' will just overwrite. 
              // We just need to update the userId property and save it again.
              const updatedRecord = { ...design, userId: newUserId };
              store.put(updatedRecord);
          });
      });
  }
};