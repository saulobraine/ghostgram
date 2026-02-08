// SyncStorageAdapter - Concrete implementation (DIP)
import { StorageAdapter } from './StorageAdapter.js';

/**
 * Implementação concreta de StorageAdapter usando chrome.storage.sync
 */
export class SyncStorageAdapter extends StorageAdapter {
  get(key: string): Promise<any> {
    return this._promisify(chrome.storage.sync.get([key]))
      .then((result: Record<string, any>) => result[key] || null);
  }

  set(key: string, value: any): Promise<void> {
    return this._promisify(chrome.storage.sync.set({ [key]: value })) as Promise<void>;
  }

  remove(key: string): Promise<void> {
    return this._promisify(chrome.storage.sync.remove([key])) as Promise<void>;
  }

  getAll(): Promise<Record<string, any>> {
    return this._promisify(chrome.storage.sync.get(null))
      .then((result: Record<string, any>) => result || {});
  }

  clear(): Promise<void> {
    return this._promisify(chrome.storage.sync.clear()) as Promise<void>;
  }

  private _promisify<T>(chromeApiCall: Promise<T> | ((callback: (result: T) => void) => void)): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      if (chromeApiCall instanceof Promise) {
        chromeApiCall.then(resolve).catch(reject);
        return;
      }
      (chromeApiCall as (callback: (result: T) => void) => void)(resolve);
    });
  }
}
