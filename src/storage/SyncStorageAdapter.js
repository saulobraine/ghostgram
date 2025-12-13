// SyncStorageAdapter - Concrete implementation (DIP)
import { StorageAdapter } from './StorageAdapter.js';

export class SyncStorageAdapter extends StorageAdapter {
  get(key) {
    return this._promisify(chrome.storage.sync.get([key]))
      .then(result => result[key] || null);
  }

  set(key, value) {
    return this._promisify(chrome.storage.sync.set({ [key]: value }));
  }

  remove(key) {
    return this._promisify(chrome.storage.sync.remove([key]));
  }

  getAll() {
    return this._promisify(chrome.storage.sync.get(null))
      .then(result => result || {});
  }

  clear() {
    return this._promisify(chrome.storage.sync.clear());
  }

  _promisify(chromeApiCall) {
    return new Promise((resolve, reject) => {
      if (chromeApiCall.then) {
        chromeApiCall.then(resolve).catch(reject);
        return;
      }
      chromeApiCall(resolve);
    });
  }
}

