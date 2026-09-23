/**
 * Project "Systemic Extract" - Storage Architecture (SOLID TS Ecosystem)
 * 
 * Provides decoupled persistence interfaces and standard browser IndexedDB implementation
 * to safely persist the Anchor Hideout state without localStorage quota limitations.
 */

import { HideoutState } from '../types';

/**
 * Constraint 1: The Storage Interface
 * Clean storage contract enabling Dependency Inversion in the business logic.
 */
export interface IStorageProvider<T> {
  load(): Promise<T | null>;
  save(data: T): Promise<void>;
  clear(): Promise<void>;
}

/**
 * Constraint 2: The IndexedDB Implementation
 * Native browser IndexedDB provider for HideoutState (no external dependencies).
 * Eliminates quota crashes when handling large inventories and telemetry arrays.
 */
export class IndexedDbStorageProvider implements IStorageProvider<HideoutState> {
  private dbName: string;
  private storeName: string;
  private keyName: string;
  private dbPromise: Promise<IDBDatabase> | null = null;
  private memoryCache: HideoutState | null = null;

  constructor(
    dbName: string = 'systemic_extract_anchor_db',
    storeName: string = 'anchor_bunker_store',
    keyName: string = 'anchor_hideout_state'
  ) {
    this.dbName = dbName;
    this.storeName = storeName;
    this.keyName = keyName;
  }

  private async getDatabase(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    if (typeof indexedDB === 'undefined') {
      throw new Error('IndexedDB is not supported or accessible in this environment.');
    }

    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error || new Error('Failed to initialize IndexedDB for Faraday Anchor storage.'));
      };

      request.onblocked = () => {
        console.warn('[IndexedDB] Anchor storage upgrade blocked by open connection.');
      };
    });

    return this.dbPromise;
  }

  public async load(): Promise<HideoutState | null> {
    try {
      const db = await this.getDatabase();
      return await new Promise<HideoutState | null>((resolve, reject) => {
        const transaction = db.transaction(this.storeName, 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(this.keyName);

        request.onsuccess = () => {
          if (request.result) {
            this.memoryCache = request.result as HideoutState;
            resolve(request.result as HideoutState);
          } else {
            // One-time legacy migration check from previous versions
            if (typeof window !== 'undefined' && window.localStorage) {
              try {
                const legacy = localStorage.getItem('systemic_extract_hideout_v2');
                if (legacy) {
                  const parsed = JSON.parse(legacy) as HideoutState;
                  this.save(parsed).catch(() => {});
                  resolve(parsed);
                  return;
                }
              } catch {
                // Ignore legacy parse errors
              }
            }
            resolve(this.memoryCache);
          }
        };

        request.onerror = () => {
          reject(request.error || new Error('Error loading state from IndexedDB object store.'));
        };
      });
    } catch (error) {
      console.warn('[Anchor Storage] IndexedDB unavailable or restricted, returning memory fallback:', error);
      return this.memoryCache;
    }
  }

  public async save(data: HideoutState): Promise<void> {
    this.memoryCache = data;
    try {
      const db = await this.getDatabase();
      return await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.put(data, this.keyName);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error || new Error('Error persisting state to IndexedDB.'));
      });
    } catch (error) {
      console.warn('[Anchor Storage] Could not write to IndexedDB, retained in active memory:', error);
    }
  }

  public async clear(): Promise<void> {
    this.memoryCache = null;
    try {
      const db = await this.getDatabase();
      return await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(this.keyName);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error || new Error('Error clearing IndexedDB record.'));
      });
    } catch (error) {
      console.warn('[Anchor Storage] Error during IndexedDB clear:', error);
    }
  }
}

/**
 * In-Memory Storage Provider for unit testing, mocks, and isolated simulations.
 */
export class InMemoryStorageProvider<T> implements IStorageProvider<T> {
  private data: T | null = null;

  constructor(initialData?: T) {
    if (initialData) {
      this.data = JSON.parse(JSON.stringify(initialData));
    }
  }

  public async load(): Promise<T | null> {
    return this.data ? JSON.parse(JSON.stringify(this.data)) : null;
  }

  public async save(data: T): Promise<void> {
    this.data = JSON.parse(JSON.stringify(data));
  }

  public async clear(): Promise<void> {
    this.data = null;
  }
}
