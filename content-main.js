// Content script main - ES6 module version
// This file is loaded via dynamic import() from content.js

import { HostnameValidator } from './src/hostname/HostnameValidator.js';
import { LocalStorageWrapper } from './src/storage/LocalStorageWrapper.js';
import { MessageHandler } from './src/messaging/MessageHandler.js';
import { ExtensionState } from './src/domain/ExtensionState.js';
import { LocalStorageAdapter } from './src/storage/LocalStorageAdapter.js';
import { STORAGE_KEYS, MESSAGE_ACTIONS } from './src/constants/Constants.js';

class ContentScript {
  constructor() {
    this._storage = new LocalStorageAdapter();
    this._messageHandler = new MessageHandler(this._storage);
    this._appRoot = null;
    this._floatingPanelAppLoading = false;
    this._floatingPanelAppLoaded = false;
  }

  async initialize() {
    console.log('[ContentScript] Inicializando...');
    if (!this._isValidHostname()) {
      console.log('[ContentScript] Hostname inválido:', location.hostname);
      return;
    }
    console.log('[ContentScript] Hostname válido');
    await this._setupStorage();
    console.log('[ContentScript] Storage configurado');
    await this._injectIfEnabled();
    console.log('[ContentScript] Injeção verificada');
    this._setupMessageListener();
    console.log('[ContentScript] Listener de mensagens configurado');
  }

  _isValidHostname() {
    return HostnameValidator.isValid(location);
  }

  async _setupStorage() {
    const wrapper = new LocalStorageWrapper();
    Object.defineProperty(window, 'localStorage', {
      get: () => wrapper,
      configurable: true
    });
  }

  async _injectIfEnabled() {
    const enabled = await this._isExtensionEnabled();
    console.log('[ContentScript] Extensão habilitada?', enabled);
    if (!enabled) {
      console.log('[ContentScript] Extensão não habilitada');
      return;
    }
    console.log('[ContentScript] Extensão habilitada');
    // Bundle.js antigo removido - não injeta mais nada que limpe o body
  }

  async _isExtensionEnabled() {
    const value = await this._storage.get(STORAGE_KEYS.ENABLED);
    const state = ExtensionState.fromStorageValue(value);
    return state.isEnabled();
  }

  _setupMessageListener() {
    console.log('[ContentScript] Configurando listener de mensagens...');
    chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
      console.log('[ContentScript] Mensagem recebida:', request.action);

      // Se for uma mensagem START_SCAN, carrega o FloatingPanelApp primeiro
      if (request.action === MESSAGE_ACTIONS.START_SCAN) {
        console.log('[ContentScript] Carregando FloatingPanelApp para START_SCAN...');
        await this._loadFloatingPanelApp();
        // Aguarda um pouco e então envia mensagem
        setTimeout(() => {
          window.postMessage({
            type: 'INSTAGRAM_UNFOLLOWERS_START_SCAN',
            source: 'content-script'
          }, '*');
        }, 500);
        sendResponse({ success: true });
        return true;
      }

      const handled = this._messageHandler.handle(request, sender, sendResponse);
      console.log('[ContentScript] Mensagem foi tratada?', handled);
      return handled;
    });
    console.log('[ContentScript] Listener configurado com sucesso');
  }

  async _loadFloatingPanelApp() {
    // Verifica se já está carregado usando a flag global
    if (window.__FLOATING_PANEL_APP_LOADED__) {
      console.log('[ContentScript] FloatingPanelApp já está carregado (flag global)');
      this._floatingPanelAppLoaded = true;
      return;
    }

    // Verifica se o container já existe e tem app inicializado
    const container = document.getElementById('instagram-unfollowers-floating-panel');
    if (container && container.__FLOATING_PANEL_APP__) {
      console.log('[ContentScript] FloatingPanelApp já está renderizado');
      this._floatingPanelAppLoaded = true;
      return;
    }

    // Se já está carregando, aguarda
    if (this._floatingPanelAppLoading) {
      console.log('[ContentScript] FloatingPanelApp já está sendo carregado, aguardando...');
      // Aguarda até que a flag global seja definida ou timeout
      let attempts = 0;
      while (attempts < 50 && !window.__FLOATING_PANEL_APP_LOADED__) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      if (window.__FLOATING_PANEL_APP_LOADED__) {
        this._floatingPanelAppLoaded = true;
        this._floatingPanelAppLoading = false;
        console.log('[ContentScript] FloatingPanelApp carregado (aguardou)');
      }
      return;
    }

    // Marca como carregando
    this._floatingPanelAppLoading = true;

    try {
      const src = chrome.runtime.getURL('floating-panel-app.js');
      console.log('[ContentScript] Carregando FloatingPanelApp de:', src);
      await import(src);

      // Aguarda a flag global ser definida (o módulo define a flag quando carrega)
      let attempts = 0;
      while (attempts < 50 && !window.__FLOATING_PANEL_APP_LOADED__) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (window.__FLOATING_PANEL_APP_LOADED__) {
        this._floatingPanelAppLoaded = true;
        console.log('[ContentScript] FloatingPanelApp carregado com sucesso');
      } else {
        console.warn('[ContentScript] FloatingPanelApp importado mas flag não foi definida');
        this._floatingPanelAppLoading = false;
      }
    } catch (error) {
      console.error('[ContentScript] Erro ao carregar FloatingPanelApp:', error);
      this._floatingPanelAppLoading = false;
      window.__FLOATING_PANEL_APP_LOADED__ = false; // Reset on error
    } finally {
      // Only reset loading flag if we're not waiting for the global flag
      if (!window.__FLOATING_PANEL_APP_LOADED__) {
        this._floatingPanelAppLoading = false;
      }
    }
  }

}

// Exporta uma função de inicialização
export function initializeContentScript() {
  const contentScript = new ContentScript();
  contentScript.initialize();
}
