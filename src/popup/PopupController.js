// PopupController - Orchestrates popup functionality
import { StatusUpdater } from './StatusUpdater.js';
import { ToggleHandler } from './ToggleHandler.js';
import { ExtensionState } from '../domain/ExtensionState.js';
import { LocalStorageAdapter } from '../storage/LocalStorageAdapter.js';
import { STORAGE_KEYS, MESSAGE_ACTIONS } from '../constants/Constants.js';

export class PopupController {
  constructor() {
    this._storage = new LocalStorageAdapter();
    this._statusUpdater = null;
    this._toggleHandler = new ToggleHandler(this._storage);
  }

  initialize(statusElement, toggleButton, startScanButton, optionsButton, optionsLink) {
    this._statusUpdater = new StatusUpdater(statusElement, toggleButton, startScanButton);
    this._setupToggleButton(toggleButton);
    this._setupStartScanButton(startScanButton);
    this._setupOptionsButton(optionsButton);
    this._setupOptionsLink(optionsLink);
    this._updateStatus();
  }

  _setupToggleButton(button) {
    button.addEventListener('click', () => this._handleToggle());
  }

  _setupStartScanButton(button) {
    button.addEventListener('click', () => this._handleStartScan());
  }

  _setupOptionsButton(button) {
    button.addEventListener('click', () => this._openOptions());
  }

  _setupOptionsLink(link) {
    link.addEventListener('click', e => {
      e.preventDefault();
      this._openOptions();
    });
  }

  async _handleToggle() {
    await this._toggleHandler.toggle();
    await this._updateStatus();
  }

  async _handleStartScan() {
    const state = await this._getCurrentState();
    if (!state.isEnabled()) {
      alert('Por favor, habilite a extensão primeiro.');
      return;
    }

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.url || !tab.url.includes('instagram.com')) {
        alert('Por favor, abra uma aba do Instagram primeiro.');
        return;
      }

      // Verifica se o content script está rodando
      // Tenta algumas vezes porque pode estar inicializando
      let contentScriptReady = false;
      const maxChecks = 3;

      for (let i = 0; i < maxChecks; i++) {
        try {
          const response = await chrome.tabs.sendMessage(tab.id, { action: MESSAGE_ACTIONS.GET_STATUS });
          contentScriptReady = true;
          break;
        } catch (error) {
          if (i < maxChecks - 1) {
            // Aguarda um pouco antes de tentar novamente
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }

      if (!contentScriptReady) {
        // O content script não está rodando - precisa recarregar a página
        // Não podemos injetar programaticamente porque usa módulos ES6
        if (confirm('O content script não está rodando nesta página.\n\nIsso geralmente acontece quando:\n- A página foi aberta antes de habilitar a extensão\n- A página ainda está carregando\n\nDeseja recarregar a página do Instagram para ativar o content script?')) {
          await chrome.tabs.reload(tab.id);
          alert('Página recarregada. Aguarde a página carregar completamente (alguns segundos) e então clique em "Iniciar Scan" novamente.');
          return;
        }
        return;
      }

      // Agora tenta enviar a mensagem START_SCAN
      let retries = 3;
      let lastError = null;

      while (retries > 0) {
        try {
          const response = await chrome.tabs.sendMessage(tab.id, { action: MESSAGE_ACTIONS.START_SCAN });
          if (response && response.success) {
            return; // Sucesso
          }
        } catch (error) {
          lastError = error;
          retries--;

          // Se não for erro de "recebedor não encontrado", para imediatamente
          if (!error.message.includes('Could not establish connection') &&
            !error.message.includes('Receiving end does not exist')) {
            throw error;
          }

          // Aguarda um pouco antes de tentar novamente
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }

      // Se chegou aqui, todas as tentativas falharam
      throw lastError || new Error('Não foi possível conectar com o content script');

    } catch (error) {
      console.error('Erro ao iniciar scan:', error);

      // Mensagem de erro mais específica
      let errorMessage = 'Erro ao iniciar scan. ';
      if (error.message && error.message.includes('Could not establish connection')) {
        errorMessage += 'O content script não está rodando. Tente recarregar a página do Instagram.';
      } else if (error.message && error.message.includes('Receiving end does not exist')) {
        errorMessage += 'A extensão pode não estar totalmente carregada. Tente recarregar a página do Instagram.';
      } else {
        errorMessage += 'Certifique-se de que está na página do Instagram e que a extensão está habilitada.';
      }

      alert(errorMessage);
    }
  }

  _openOptions() {
    chrome.runtime.openOptionsPage();
  }

  async _updateStatus() {
    const state = await this._getCurrentState();
    this._statusUpdater.update(state.isEnabled());
  }

  async _getCurrentState() {
    const value = await this._storage.get(STORAGE_KEYS.ENABLED);
    return ExtensionState.fromStorageValue(value);
  }
}

