// LocalStorageAdapter - Concrete implementation (DIP)
import { StorageAdapter } from './StorageAdapter.js';

/**
 * Implementação concreta de StorageAdapter usando chrome.storage.local
 */
export class LocalStorageAdapter extends StorageAdapter {
  get(key: string): Promise<any> {
    return this._promisify(chrome.storage.local.get([key]))
      .then((result: Record<string, any>) => {
        // Usa verificação explícita porque result[key] pode ser false (valor válido)
        return result[key] !== undefined ? result[key] : null;
      });
  }

  set(key: string, value: any): Promise<void> {
    return this._promisify(chrome.storage.local.set({ [key]: value })) as Promise<void>;
  }

  remove(key: string): Promise<void> {
    return this._promisify(chrome.storage.local.remove([key])) as Promise<void>;
  }

  getAll(): Promise<Record<string, any>> {
    return this._promisify(chrome.storage.local.get(null))
      .then((result: Record<string, any>) => result || {});
  }

  clear(): Promise<void> {
    return this._promisify(chrome.storage.local.clear()) as Promise<void>;
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
