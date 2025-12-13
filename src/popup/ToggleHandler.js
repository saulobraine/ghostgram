// ToggleHandler - SRP: Handle toggle action
import { ExtensionState } from '../domain/ExtensionState.js';
import { LocalStorageAdapter } from '../storage/LocalStorageAdapter.js';
import { STORAGE_KEYS } from '../constants/Constants.js';

export class ToggleHandler {
  constructor(storageAdapter) {
    this._storage = storageAdapter || new LocalStorageAdapter();
  }

  async toggle() {
    const currentState = await this._getCurrentState();
    const newState = currentState.toggle();
    await this._saveState(newState);
    await this._notifyContentScript();
  }

  async _getCurrentState() {
    const value = await this._storage.get(STORAGE_KEYS.ENABLED);
    return ExtensionState.fromStorageValue(value);
  }

  async _saveState(state) {
    await this._storage.set(STORAGE_KEYS.ENABLED, state.toStorageValue());
  }

  async _notifyContentScript() {
    const tabs = await this._getActiveTabs();
    if (tabs.length === 0) {
      return;
    }
    await this._sendToggleMessage(tabs[0]);
  }

  _getActiveTabs() {
    return new Promise(resolve => {
      chrome.tabs.query({ active: true, currentWindow: true }, resolve);
    });
  }

  async _sendToggleMessage(tab) {
    try {
      await this._sendMessage(tab.id);
      return;
    } catch (error) {
      this._handleMessageError(tab);
    }
  }

  _sendMessage(tabId) {
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, { action: 'toggle' }, response => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        resolve(response);
      });
    });
  }

  _handleMessageError(tab) {
    if (this._isInstagramTab(tab)) {
      chrome.tabs.reload(tab.id);
      return;
    }
    alert('Please navigate to Instagram.com to use this extension');
  }

  _isInstagramTab(tab) {
    return tab.url && tab.url.includes('instagram.com');
  }
}

