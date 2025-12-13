// MessageHandler - Strategy pattern for message actions (OCP: Open/Closed)
import { MESSAGE_ACTIONS } from '../constants/Constants.js';
import { ExtensionState } from '../domain/ExtensionState.js';
import { LocalStorageAdapter } from '../storage/LocalStorageAdapter.js';

export class MessageHandler {
  constructor(storageAdapter) {
    this._storage = storageAdapter || new LocalStorageAdapter();
    this._handlers = this._createHandlers();
  }

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
    return this._storage.get('enabled')
      .then(value => ExtensionState.fromStorageValue(value));
  }

  _saveState(state) {
    return this._storage.set('enabled', state.toStorageValue());
  }

  _reloadPage() {
    location.reload();
  }

  _handleStartScan(sendResponse) {
    // Aguarda o bundle estar pronto antes de enviar a mensagem
    this._waitForBundleReady().then(() => {
      try {
        window.postMessage({
          type: 'INSTAGRAM_UNFOLLOWERS_START_SCAN',
          source: 'content-script'
        }, '*');

        sendResponse({ success: true });
      } catch (error) {
        console.error('Erro ao enviar mensagem para o bundle:', error);
        sendResponse({ success: false, error: error.message });
      }
    }).catch(error => {
      console.error('Erro ao aguardar bundle:', error);
      // Tenta enviar mesmo assim
      try {
        window.postMessage({
          type: 'INSTAGRAM_UNFOLLOWERS_START_SCAN',
          source: 'content-script'
        }, '*');
        sendResponse({ success: true });
      } catch (e) {
        sendResponse({ success: false, error: error.message });
      }
    });

    return true; // Indica resposta assíncrona
  }

  async _waitForBundleReady() {
    const maxWait = 3000; // 3 segundos máximo
    const checkInterval = 100; // verifica a cada 100ms
    let waited = 0;

    while (waited < maxWait) {
      // Verifica se o bundle foi carregado procurando pelo elemento principal
      // ou por uma variável global que o bundle pode definir
      const bundleReady = document.getElementById('main') !== null ||
        document.querySelector('[id*="iu"]') !== null ||
        window.__INSTAGRAM_UNFOLLOWERS_READY__ === true;

      if (bundleReady) {
        // Aguarda mais um pouco para garantir que o React/Preact esteja totalmente inicializado
        await new Promise(resolve => setTimeout(resolve, 300));
        return Promise.resolve();
      }

      await new Promise(resolve => setTimeout(resolve, checkInterval));
      waited += checkInterval;
    }

    // Se chegou aqui, o bundle pode não estar pronto, mas vamos tentar mesmo assim
    return Promise.resolve();
  }
}

