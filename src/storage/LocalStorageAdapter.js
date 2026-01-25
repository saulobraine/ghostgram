// LocalStorageAdapter - Concrete implementation (DIP)
import { StorageAdapter } from './StorageAdapter.js';

export class LocalStorageAdapter extends StorageAdapter {
  get(key) {
    return this._promisify(chrome.storage.local.get([key]))
      .then(result => {
        // Usa verificação explícita porque result[key] pode ser false (valor válido)
        return result[key] !== undefined ? result[key] : null;
      });
  }

  set(key, value) {
    return this._promisify(chrome.storage.local.set({ [key]: value }));
  }

  remove(key) {
    return this._promisify(chrome.storage.local.remove([key]));
  }

  getAll() {
    return this._promisify(chrome.storage.local.get(null))
      .then(result => result || {});
  }

  clear() {
    return this._promisify(chrome.storage.local.clear());
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

