// MessageHandler - Strategy pattern for message actions (OCP: Open/Closed)
import { MESSAGE_ACTIONS, MESSAGE_TYPES, STORAGE_KEYS } from '../constants/Constants.js';
import { ExtensionState } from '../domain/ExtensionState.js';
import { LocalStorageAdapter } from '../storage/LocalStorageAdapter.js';
import type { StorageAdapter } from '../storage/StorageAdapter.js';

interface MessageRequest {
  action: string;
  enabled?: boolean;
  [key: string]: any;
}

type MessageHandlerFunction = (
  request: MessageRequest,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
) => void;

/**
 * Handler responsável por processar mensagens entre diferentes contextos da extensão
 * Implementa padrão Strategy para diferentes ações de mensagem
 */
export class MessageHandler {
  private _storage: StorageAdapter;
  private _handlers: Record<string, MessageHandlerFunction>;

  /**
   * @param storageAdapter - Adapter de storage (opcional)
   */
  constructor(storageAdapter?: StorageAdapter) {
    this._storage = storageAdapter || new LocalStorageAdapter();
    this._handlers = this._createHandlers();
  }

  /**
   * Processa uma mensagem recebida
   * @param request - Objeto de requisição com action
   * @param sender - Informações do remetente
   * @param sendResponse - Função para enviar resposta
   * @returns True se a mensagem foi processada
   */
  handle(
    request: MessageRequest,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): boolean {
    const handler = this._handlers[request.action];
    if (!handler) {
      return false;
    }
    handler(request, sender, sendResponse);
    return true;
  }

  private _createHandlers(): Record<string, MessageHandlerFunction> {
    return {
      [MESSAGE_ACTIONS.TOGGLE]: (_request, _sender, sendResponse) => 
        this._handleToggle(sendResponse),
      [MESSAGE_ACTIONS.GET_STATUS]: (_request, _sender, sendResponse) => 
        this._handleGetStatus(sendResponse),
      [MESSAGE_ACTIONS.UPDATE_STATUS]: (request, _sender, sendResponse) => 
        this._handleUpdateStatus(request, sendResponse),
      [MESSAGE_ACTIONS.START_SCAN]: (_request, _sender, sendResponse) =>
        this._handleStartScan(sendResponse)
    };
  }

  private _handleToggle(sendResponse: (response?: any) => void): void {
    this._getCurrentState().then(state => {
      const newState = state.toggle();
      this._saveState(newState).then(() => {
        this._reloadPage();
        sendResponse({ success: true });
      });
    });
  }

  private _handleGetStatus(sendResponse: (response?: any) => void): void {
    this._getCurrentState().then(state => {
      sendResponse({ enabled: state.isEnabled() });
    });
  }

  private _handleUpdateStatus(
    request: MessageRequest,
    sendResponse: (response?: any) => void
  ): void {
    const state = ExtensionState.fromStorageValue(request.enabled);
    this._saveState(state).then(() => {
      sendResponse({ success: true });
    });
  }

  private _getCurrentState(): Promise<ExtensionState> {
    return this._storage.get(STORAGE_KEYS.ENABLED)
      .then(value => ExtensionState.fromStorageValue(value));
  }

  private _saveState(state: ExtensionState): Promise<void> {
    return this._storage.set(STORAGE_KEYS.ENABLED, state.toStorageValue()) as Promise<void>;
  }

  private _reloadPage(): void {
    location.reload();
  }

  private _handleStartScan(sendResponse: (response?: any) => void): boolean {
    // Envia mensagem para o FloatingPanelApp
    try {
      window.postMessage({
        type: MESSAGE_TYPES.INSTAGRAM_UNFOLLOWERS_START_SCAN,
        source: 'content-script'
      }, '*');

      sendResponse({ success: true });
    } catch (error) {
      const err = error as Error;
      console.error('Erro ao enviar mensagem para FloatingPanelApp:', error);
      sendResponse({ success: false, error: err.message });
    }

    return true; // Indica resposta assíncrona
  }
}
