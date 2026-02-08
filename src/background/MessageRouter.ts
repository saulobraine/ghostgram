// MessageRouter - SRP: Route messages to appropriate handlers
import { MESSAGE_ACTIONS } from '../constants/Constants.js';
import { ExtensionState } from '../domain/ExtensionState.js';
import { LocalStorageAdapter } from '../storage/LocalStorageAdapter.js';
import { STORAGE_KEYS } from '../constants/Constants.js';
import type { StorageAdapter } from '../storage/StorageAdapter.js';

interface MessageRequest {
  action: string;
  enabled?: boolean;
  [key: string]: any;
}

/**
 * Router responsável por rotear mensagens para handlers apropriados
 */
export class MessageRouter {
  private _storage: StorageAdapter;

  constructor(storageAdapter?: StorageAdapter) {
    this._storage = storageAdapter || new LocalStorageAdapter();
  }

  async route(
    request: MessageRequest,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): Promise<boolean> {
    console.log('[MessageRouter] Mensagem recebida:', request.action);

    if (request.action === MESSAGE_ACTIONS.GET_STATUS) {
      await this._handleGetStatus(sendResponse);
      return true;
    }
    if (request.action === MESSAGE_ACTIONS.UPDATE_STATUS) {
      await this._handleUpdateStatus(request, sendResponse);
      return true;
    }
    if (request.action === MESSAGE_ACTIONS.OPEN_HISTORY) {
      console.log('[MessageRouter] Processando openHistory...');
      await this._handleOpenHistory(sendResponse);
      return true;
    }
    return false;
  }

  private async _handleOpenHistory(sendResponse: (response?: any) => void): Promise<void> {
    chrome.tabs.create({ url: chrome.runtime.getURL('history.html') });
    sendResponse({ success: true });
  }

  private async _handleGetStatus(sendResponse: (response?: any) => void): Promise<void> {
    const state = await this._getCurrentState();
    sendResponse({ enabled: state.isEnabled() });
  }

  private async _handleUpdateStatus(
    request: MessageRequest,
    sendResponse: (response?: any) => void
  ): Promise<void> {
    const state = ExtensionState.fromStorageValue(request.enabled);
    await this._saveState(state);
    sendResponse({ success: true });
  }

  private async _getCurrentState(): Promise<ExtensionState> {
    const value = await this._storage.get(STORAGE_KEYS.ENABLED);
    return ExtensionState.fromStorageValue(value);
  }

  private async _saveState(state: ExtensionState): Promise<void> {
    await this._storage.set(STORAGE_KEYS.ENABLED, state.toStorageValue());
  }
}
