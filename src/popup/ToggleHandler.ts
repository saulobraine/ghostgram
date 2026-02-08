// ToggleHandler - SRP: Handle toggle action
import { ExtensionState } from '../domain/ExtensionState.js';
import { LocalStorageAdapter } from '../storage/LocalStorageAdapter.js';
import { STORAGE_KEYS } from '../constants/Constants.js';
import type { StorageAdapter } from '../storage/StorageAdapter.js';

/**
 * Handler responsável por processar ações de toggle da extensão
 */
export class ToggleHandler {
  private _storage: StorageAdapter;

  constructor(storageAdapter?: StorageAdapter) {
    this._storage = storageAdapter || new LocalStorageAdapter();
  }

  async toggle(): Promise<void> {
    const currentState = await this._getCurrentState();
    console.log('[ToggleHandler] Estado atual:', currentState.isEnabled() ? 'Ativado' : 'Desativado');
    const newState = currentState.toggle();
    console.log('[ToggleHandler] Novo estado:', newState.isEnabled() ? 'Ativado' : 'Desativado');
    await this._saveState(newState);
    console.log('[ToggleHandler] Estado salvo no storage');
    await this._notifyContentScript();
  }

  private async _getCurrentState(): Promise<ExtensionState> {
    const value = await this._storage.get(STORAGE_KEYS.ENABLED);
    console.log('[ToggleHandler] Valor lido do storage:', value);
    return ExtensionState.fromStorageValue(value);
  }

  private async _saveState(state: ExtensionState): Promise<void> {
    const value = state.toStorageValue();
    console.log('[ToggleHandler] Salvando no storage:', value);
    await this._storage.set(STORAGE_KEYS.ENABLED, value);
  }

  private async _notifyContentScript(): Promise<void> {
    const tabs = await this._getInstagramTabs();

    for (const tab of tabs) {
      await this._sendToggleMessage(tab);
    }
  }

  private _getInstagramTabs(): Promise<chrome.tabs.Tab[]> {
    return new Promise(resolve => {
      chrome.tabs.query({ url: 'https://www.instagram.com/*' }, (tabs) => {
        resolve(tabs);
      });
    });
  }

  private async _sendToggleMessage(tab: chrome.tabs.Tab): Promise<void> {
    try {
      if (tab.id !== undefined) {
        await this._sendMessage(tab.id);
      }
    } catch (error) {
      // Ignora erro - estado já foi salvo no storage
      // O content script vai ler o novo estado quando a página recarregar
      console.log('[ToggleHandler] Content script não respondeu na aba', tab.id);
    }
  }

  private _sendMessage(tabId: number): Promise<any> {
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, { action: 'toggle' }, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        resolve(response);
      });
    });
  }
}
