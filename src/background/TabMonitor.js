// TabMonitor - SRP: Monitor tab updates
import { LocalStorageAdapter } from '../storage/LocalStorageAdapter.js';
import { ExtensionState } from '../domain/ExtensionState.js';
import { STORAGE_KEYS } from '../constants/Constants.js';

export class TabMonitor {
  constructor(storageAdapter) {
    this._storage = storageAdapter || new LocalStorageAdapter();
  }

  async handle(tabId, changeInfo, tab) {
    if (!this._isComplete(changeInfo)) {
      return;
    }
    if (!this._isInstagramTab(tab)) {
      return;
    }
    await this._checkAndNotify(tabId);
  }

  _isComplete(changeInfo) {
    return changeInfo.status === 'complete';
  }

  _isInstagramTab(tab) {
    return tab.url && tab.url.includes('instagram.com');
  }

  async _checkAndNotify(tabId) {
    const enabled = await this._isExtensionEnabled();
    if (!enabled) {
      return;
    }
    // Extension is enabled, content script will handle injection
  }

  async _isExtensionEnabled() {
    const value = await this._storage.get(STORAGE_KEYS.ENABLED);
    const state = ExtensionState.fromStorageValue(value);
    return state.isEnabled();
  }
}

