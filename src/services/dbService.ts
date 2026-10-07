import { SavedDesign, RoomTransformationProject, LandscapingTransformationProject } from '../types';

const DB_NAME = 'Architect3D_DB';
const STORE_NAME = 'designs';
const ROOM_STORE_NAME = 'room_transformations';
const LANDSCAPE_STORE_NAME = 'landscaping_transformations';
const DB_VERSION = 2;

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
        if (!db.objectStoreNames.contains(ROOM_STORE_NAME)) {
          const roomStore = db.createObjectStore(ROOM_STORE_NAME, { keyPath: 'id' });
          roomStore.createIndex('userId', 'userId', { unique: false });
        }
        if (!db.objectStoreNames.contains(LANDSCAPE_STORE_NAME)) {
          const landStore = db.createObjectStore(LANDSCAPE_STORE_NAME, { keyPath: 'id' });
          landStore.createIndex('userId', 'userId', { unique: false });
        }
      };
    });
  },

  async saveDesign(design: SavedDesign, userId: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
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
              const updatedRecord = { ...design, userId: newUserId };
              store.put(updatedRecord);
          });
      });
  },

  // ==========================================
  // ROOM TRANSFORMATIONS LOCAL STORAGE
  // ==========================================
  async saveRoomTransformation(project: RoomTransformationProject, userId: string): Promise<void> {
    try {
      const db = await this.openDB();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([ROOM_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(ROOM_STORE_NAME);
        const record = { ...project, userId };
        const request = store.put(record);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.warn("IndexedDB room save failed, using localStorage fallback:", e);
    }
    // Also backup in localStorage
    try {
      const key = `architect3d_room_trans_${userId}`;
      const existingStr = localStorage.getItem(key);
      const list: RoomTransformationProject[] = existingStr ? JSON.parse(existingStr) : [];
      const updated = [project, ...list.filter(p => p.id !== project.id)];
      localStorage.setItem(key, JSON.stringify(updated.slice(0, 15)));
    } catch (lsErr) {
      console.warn("localStorage room backup failed:", lsErr);
    }
  },

  async getUserRoomTransformations(userId: string): Promise<RoomTransformationProject[]> {
    let results: RoomTransformationProject[] = [];
    try {
      const db = await this.openDB();
      results = await new Promise<RoomTransformationProject[]>((resolve, reject) => {
        const transaction = db.transaction([ROOM_STORE_NAME], 'readonly');
        const store = transaction.objectStore(ROOM_STORE_NAME);
        const index = store.index('userId');
        const request = index.getAll(userId);
        request.onsuccess = () => resolve(request.result as RoomTransformationProject[]);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.warn("IndexedDB room load failed, falling back to localStorage:", e);
    }

    if (results.length === 0) {
      try {
        const key = `architect3d_room_trans_${userId}`;
        const existingStr = localStorage.getItem(key);
        if (existingStr) {
          results = JSON.parse(existingStr);
        }
      } catch (lsErr) {
        // ignore
      }
    }

    return results;
  },

  async deleteRoomTransformation(id: string, userId?: string): Promise<void> {
    try {
      const db = await this.openDB();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([ROOM_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(ROOM_STORE_NAME);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.warn("IndexedDB room delete failed:", e);
    }
    if (userId) {
      try {
        const key = `architect3d_room_trans_${userId}`;
        const existingStr = localStorage.getItem(key);
        if (existingStr) {
          const list: RoomTransformationProject[] = JSON.parse(existingStr);
          localStorage.setItem(key, JSON.stringify(list.filter(p => p.id !== id)));
        }
      } catch (lsErr) {
        // ignore
      }
    }
  },

  async reassignRoomTransformations(oldUserId: string, newUserId: string): Promise<void> {
    const list = await this.getUserRoomTransformations(oldUserId);
    for (const item of list) {
      await this.saveRoomTransformation({ ...item, userId: newUserId }, newUserId);
    }
  },

  // ==========================================
  // LANDSCAPING TRANSFORMATIONS LOCAL STORAGE
  // ==========================================
  async saveLandscapingTransformation(project: LandscapingTransformationProject, userId: string): Promise<void> {
    try {
      const db = await this.openDB();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([LANDSCAPE_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(LANDSCAPE_STORE_NAME);
        const record = { ...project, userId };
        const request = store.put(record);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.warn("IndexedDB landscape save failed, using localStorage fallback:", e);
    }
    // Also backup in localStorage
    try {
      const key = `architect3d_landscape_trans_${userId}`;
      const existingStr = localStorage.getItem(key);
      const list: LandscapingTransformationProject[] = existingStr ? JSON.parse(existingStr) : [];
      const updated = [project, ...list.filter(p => p.id !== project.id)];
      localStorage.setItem(key, JSON.stringify(updated.slice(0, 15)));
    } catch (lsErr) {
      console.warn("localStorage landscape backup failed:", lsErr);
    }
  },

  async getUserLandscapingTransformations(userId: string): Promise<LandscapingTransformationProject[]> {
    let results: LandscapingTransformationProject[] = [];
    try {
      const db = await this.openDB();
      results = await new Promise<LandscapingTransformationProject[]>((resolve, reject) => {
        const transaction = db.transaction([LANDSCAPE_STORE_NAME], 'readonly');
        const store = transaction.objectStore(LANDSCAPE_STORE_NAME);
        const index = store.index('userId');
        const request = index.getAll(userId);
        request.onsuccess = () => resolve(request.result as LandscapingTransformationProject[]);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.warn("IndexedDB landscape load failed, falling back to localStorage:", e);
    }

    if (results.length === 0) {
      try {
        const key = `architect3d_landscape_trans_${userId}`;
        const existingStr = localStorage.getItem(key);
        if (existingStr) {
          results = JSON.parse(existingStr);
        }
      } catch (lsErr) {
        // ignore
      }
    }

    return results;
  },

  async deleteLandscapingTransformation(id: string, userId?: string): Promise<void> {
    try {
      const db = await this.openDB();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([LANDSCAPE_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(LANDSCAPE_STORE_NAME);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.warn("IndexedDB landscape delete failed:", e);
    }
    if (userId) {
      try {
        const key = `architect3d_landscape_trans_${userId}`;
        const existingStr = localStorage.getItem(key);
        if (existingStr) {
          const list: LandscapingTransformationProject[] = JSON.parse(existingStr);
          localStorage.setItem(key, JSON.stringify(list.filter(p => p.id !== id)));
        }
      } catch (lsErr) {
        // ignore
      }
    }
  },

  async reassignLandscapingTransformations(oldUserId: string, newUserId: string): Promise<void> {
    const list = await this.getUserLandscapingTransformations(oldUserId);
    for (const item of list) {
      await this.saveLandscapingTransformation({ ...item, userId: newUserId }, newUserId);
    }
  }
};