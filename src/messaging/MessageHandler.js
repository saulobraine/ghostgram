// MessageHandler - Strategy pattern for message actions (OCP: Open/Closed)
import { MESSAGE_ACTIONS, MESSAGE_TYPES, STORAGE_KEYS } from '../constants/Constants.js';
import { ExtensionState } from '../domain/ExtensionState.js';
import { LocalStorageAdapter } from '../storage/LocalStorageAdapter.js';

/**
 * Handler responsável por processar mensagens entre diferentes contextos da extensão
 * Implementa padrão Strategy para diferentes ações de mensagem
 */
export class MessageHandler {
  /**
   * @param {LocalStorageAdapter} storageAdapter - Adapter de storage (opcional)
   */
  constructor(storageAdapter) {
    this._storage = storageAdapter || new LocalStorageAdapter();
    this._handlers = this._createHandlers();
  }

  /**
   * Processa uma mensagem recebida
   * @param {Object} request - Objeto de requisição com action
   * @param {Object} sender - Informações do remetente
   * @param {Function} sendResponse - Função para enviar resposta
   * @returns {boolean} True se a mensagem foi processada
   */
  handle(request, sender, sendResponse) {
    const handler = this._handlers[request.action];
    if (!handler) {
      return false;
    }
    handler(request, sender, sendResponse);
    return true;
  }

  _createHandlers() {
    return {
      [MESSAGE_ACTIONS.TOGGLE]: (request, sender, sendResponse) => 
        this._handleToggle(sendResponse),
      [MESSAGE_ACTIONS.GET_STATUS]: (request, sender, sendResponse) => 
        this._handleGetStatus(sendResponse),
      [MESSAGE_ACTIONS.UPDATE_STATUS]: (request, sender, sendResponse) => 
        this._handleUpdateStatus(request, sendResponse),
      [MESSAGE_ACTIONS.START_SCAN]: (request, sender, sendResponse) =>
        this._handleStartScan(sendResponse)
    };
  }

  _handleToggle(sendResponse) {
    this._getCurrentState().then(state => {
      const newState = state.toggle();
      this._saveState(newState).then(() => {
        this._reloadPage();
        sendResponse({ success: true });
      });
    });
  }

  _handleGetStatus(sendResponse) {
    this._getCurrentState().then(state => {
      sendResponse({ enabled: state.isEnabled() });
    });
  }

  _handleUpdateStatus(request, sendResponse) {
    const state = ExtensionState.fromStorageValue(request.enabled);
    this._saveState(state).then(() => {
      sendResponse({ success: true });
    });
  }

  _getCurrentState() {
    return this._storage.get(STORAGE_KEYS.ENABLED)
      .then(value => ExtensionState.fromStorageValue(value));
  }

  _saveState(state) {
    return this._storage.set(STORAGE_KEYS.ENABLED, state.toStorageValue());
  }

  _reloadPage() {
    location.reload();
  }

  _handleStartScan(sendResponse) {
    // Envia mensagem para o FloatingPanelApp
    try {
      window.postMessage({
        type: MESSAGE_TYPES.INSTAGRAM_UNFOLLOWERS_START_SCAN,
        source: 'content-script'
      }, '*');

      sendResponse({ success: true });
    } catch (error) {
      console.error('Erro ao enviar mensagem para FloatingPanelApp:', error);
      sendResponse({ success: false, error: error.message });
    }

    return true; // Indica resposta assíncrona
  }

}

