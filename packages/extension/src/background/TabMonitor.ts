// TabMonitor - SRP: Monitor tab updates
import { LocalStorageAdapter } from '../storage/LocalStorageAdapter.js';
import { ExtensionState } from '../domain/ExtensionState.js';
import { STORAGE_KEYS } from '../constants/Constants.js';
import type { StorageAdapter } from '../storage/StorageAdapter.js';

/**
 * Monitor responsável por monitorar atualizações de abas
 */
export class TabMonitor {
  private _storage: StorageAdapter;

  constructor(storageAdapter?: StorageAdapter) {
    this._storage = storageAdapter || new LocalStorageAdapter();
  }

  async handle(
    tabId: number,
    changeInfo: chrome.tabs.TabChangeInfo,
    tab: chrome.tabs.Tab
  ): Promise<void> {
    if (!this._isComplete(changeInfo)) {
      return;
    }
    if (!this._isInstagramTab(tab)) {
      return;
    }
    await this._checkAndNotify(tabId);
  }

  private _isComplete(changeInfo: chrome.tabs.TabChangeInfo): boolean {
    return changeInfo.status === 'complete';
  }

  private _isInstagramTab(tab: chrome.tabs.Tab): boolean {
    return tab.url !== undefined && tab.url.includes('instagram.com');
  }

  private async _checkAndNotify(_tabId: number): Promise<void> {
    const enabled = await this._isExtensionEnabled();
    if (!enabled) {
      return;
    }
    // Extension is enabled, content script will handle injection
  }

  private async _isExtensionEnabled(): Promise<boolean> {
    const value = await this._storage.get(STORAGE_KEYS.ENABLED);
    const state = ExtensionState.fromStorageValue(value);
    return state.isEnabled();
  }
}
