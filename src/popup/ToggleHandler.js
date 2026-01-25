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
    console.log('[ToggleHandler] Estado atual:', currentState.isEnabled() ? 'Ativado' : 'Desativado');
    const newState = currentState.toggle();
    console.log('[ToggleHandler] Novo estado:', newState.isEnabled() ? 'Ativado' : 'Desativado');
    await this._saveState(newState);
    console.log('[ToggleHandler] Estado salvo no storage');
    await this._notifyContentScript();
  }

  async _getCurrentState() {
    const value = await this._storage.get(STORAGE_KEYS.ENABLED);
    console.log('[ToggleHandler] Valor lido do storage:', value);
    return ExtensionState.fromStorageValue(value);
  }

  async _saveState(state) {
    const value = state.toStorageValue();
    console.log('[ToggleHandler] Salvando no storage:', value);
    await this._storage.set(STORAGE_KEYS.ENABLED, value);
  }

  async _notifyContentScript() {
    const tabs = await this._getInstagramTabs();

    for (const tab of tabs) {
      await this._sendToggleMessage(tab);
    }
  }

  _getInstagramTabs() {
    return new Promise(resolve => {
      chrome.tabs.query({ url: 'https://www.instagram.com/*' }, resolve);
    });
  }

  async _sendToggleMessage(tab) {
    try {
      await this._sendMessage(tab.id);
    } catch (error) {
      // Ignora erro - estado já foi salvo no storage
      // O content script vai ler o novo estado quando a página recarregar
      console.log('[ToggleHandler] Content script não respondeu na aba', tab.id);
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

  _isInstagramTab(tab) {
    return tab.url && tab.url.includes('instagram.com');
  }
}

