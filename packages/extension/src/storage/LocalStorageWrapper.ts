// LocalStorageWrapper - SRP: Single Responsibility (adapt chrome.storage to localStorage API)
import { SyncStorageAdapter } from './SyncStorageAdapter.js';
import { StorageAdapter } from './StorageAdapter.js';

/**
 * Wrapper que adapta chrome.storage para API compatível com localStorage
 * Implementa interface similar ao localStorage nativo
 */
export class LocalStorageWrapper {
  private _storage: StorageAdapter;
  private _cache: Record<string, any>;
  private _initialized: boolean;

  constructor(storageAdapter?: StorageAdapter) {
    this._storage = storageAdapter || new SyncStorageAdapter();
    this._cache = {};
    this._initialized = false;
    this._initialize();
  }

  private _initialize(): void {
    this._storage.getAll().then((result: Record<string, any>) => {
      this._cache = result;
      this._initialized = true;
    });
  }

  getItem(key: string): string | null {
    if (this._cache[key] !== undefined) {
      return this._cache[key];
    }
    this._loadKey(key);
    return this._cache[key] || null;
  }

  setItem(key: string, value: string): void {
    this._cache[key] = value;
    this._storage.set(key, value);
  }

  removeItem(key: string): void {
    delete this._cache[key];
    this._storage.remove(key);
  }

  clear(): void {
    this._cache = {};
    this._storage.clear();
    this._initialized = true;
  }

  get length(): number {
    return Object.keys(this._cache).length;
  }

  key(index: number): string | null {
    return Object.keys(this._cache)[index] || null;
  }

  private _loadKey(key: string): void {
    this._storage.get(key).then((value: any) => {
      if (value !== null) {
        this._cache[key] = value;
      }
    });
  }
}
