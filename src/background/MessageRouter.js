// MessageRouter - SRP: Route messages to appropriate handlers
import { MESSAGE_ACTIONS } from '../constants/Constants.js';
import { ExtensionState } from '../domain/ExtensionState.js';
import { LocalStorageAdapter } from '../storage/LocalStorageAdapter.js';
import { STORAGE_KEYS } from '../constants/Constants.js';

export class MessageRouter {
  constructor(storageAdapter) {
    this._storage = storageAdapter || new LocalStorageAdapter();
  }

  async route(request, sender, sendResponse) {
    if (request.action === MESSAGE_ACTIONS.GET_STATUS) {
      await this._handleGetStatus(sendResponse);
      return true;
    }
    if (request.action === MESSAGE_ACTIONS.UPDATE_STATUS) {
      await this._handleUpdateStatus(request, sendResponse);
      return true;
    }
    return false;
  }

  async _handleGetStatus(sendResponse) {
    const state = await this._getCurrentState();
    sendResponse({ enabled: state.isEnabled() });
  }

  async _handleUpdateStatus(request, sendResponse) {
    const state = ExtensionState.fromStorageValue(request.enabled);
    await this._saveState(state);
    sendResponse({ success: true });
  }

  async _getCurrentState() {
    const value = await this._storage.get(STORAGE_KEYS.ENABLED);
    return ExtensionState.fromStorageValue(value);
  }

  async _saveState(state) {
    await this._storage.set(STORAGE_KEYS.ENABLED, state.toStorageValue());
  }
}

