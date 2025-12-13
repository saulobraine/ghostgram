// Content script main - ES6 module version
// This file is loaded via dynamic import() from content.js

import { HostnameValidator } from './src/hostname/HostnameValidator.js';
import { LocalStorageWrapper } from './src/storage/LocalStorageWrapper.js';
import { BundleInjector } from './src/injection/BundleInjector.js';
import { MessageHandler } from './src/messaging/MessageHandler.js';
import { ExtensionState } from './src/domain/ExtensionState.js';
import { LocalStorageAdapter } from './src/storage/LocalStorageAdapter.js';
import { STORAGE_KEYS, MESSAGE_ACTIONS } from './src/constants/Constants.js';

class ContentScript {
  constructor() {
    this._storage = new LocalStorageAdapter();
    this._messageHandler = new MessageHandler(this._storage);
    this._bundleInjector = new BundleInjector(chrome.runtime);
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
      console.log('[ContentScript] Extensão não habilitada, não injetando bundle');
      return;
    }
    console.log('[ContentScript] Injetando bundle...');
    this._bundleInjector.inject();
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

      // Se for uma mensagem START_SCAN, garante que o bundle esteja injetado primeiro
      if (request.action === MESSAGE_ACTIONS.START_SCAN) {
        console.log('[ContentScript] Garantindo que bundle esteja injetado...');
        await this._ensureBundleInjected();
      }

      const handled = this._messageHandler.handle(request, sender, sendResponse);
      console.log('[ContentScript] Mensagem foi tratada?', handled);
      return handled;
    });
    console.log('[ContentScript] Listener configurado com sucesso');
  }

  async _ensureBundleInjected() {
    console.log('[ContentScript] Verificando se bundle está injetado...');
    // Verifica se o bundle já foi injetado
    const scriptTag = document.querySelector('script[src*="bundle.js"]');
    const mainElement = document.getElementById('main');
    const globalFlag = window.__INSTAGRAM_UNFOLLOWERS_LOADED__;

    console.log('[ContentScript] Script tag encontrado?', scriptTag !== null);
    console.log('[ContentScript] Elemento main encontrado?', mainElement !== null);
    console.log('[ContentScript] Flag global?', globalFlag);

    const bundleInjected = scriptTag !== null || mainElement !== null || globalFlag;

    if (!bundleInjected) {
      console.log('[ContentScript] Bundle não encontrado, tentando injetar...');
      // Se não estiver injetado e a extensão estiver habilitada, injeta
      const enabled = await this._isExtensionEnabled();
      if (enabled) {
        console.log('[ContentScript] Extensão habilitada, injetando bundle...');
        this._bundleInjector.inject();
        // Aguarda um pouco para o bundle começar a carregar
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('[ContentScript] Aguardou 500ms após injeção');
      } else {
        console.log('[ContentScript] Extensão não habilitada, não pode injetar');
      }
    } else {
      console.log('[ContentScript] Bundle já está injetado');
    }
  }
}

// Exporta uma função de inicialização
export function initializeContentScript() {
  const contentScript = new ContentScript();
  contentScript.initialize();
}
