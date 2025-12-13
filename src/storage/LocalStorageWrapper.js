// LocalStorageWrapper - SRP: Single Responsibility (adapt chrome.storage to localStorage API)
import { SyncStorageAdapter } from './SyncStorageAdapter.js';

export class LocalStorageWrapper {
  constructor(storageAdapter) {
    this._storage = storageAdapter || new SyncStorageAdapter();
    this._cache = {};
    this._initialized = false;
    this._initialize();
  }

  _initialize() {
    this._storage.getAll().then(result => {
      this._cache = result;
      this._initialized = true;
    });
  }

  getItem(key) {
    if (this._cache[key] !== undefined) {
      return this._cache[key];
    }
    this._loadKey(key);
    return this._cache[key] || null;
  }

  setItem(key, value) {
    this._cache[key] = value;
    this._storage.set(key, value);
  }

  removeItem(key) {
    delete this._cache[key];
    this._storage.remove(key);
  }

  clear() {
    this._cache = {};
    this._storage.clear();
    this._initialized = true;
  }

  get length() {
    return Object.keys(this._cache).length;
  }

  key(index) {
    return Object.keys(this._cache)[index] || null;
  }

  _loadKey(key) {
    this._storage.get(key).then(value => {
      if (value !== null) {
        this._cache[key] = value;
      }
    });
  }
}

