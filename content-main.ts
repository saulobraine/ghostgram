// Content script main - Versão Simplificada
// Carrega o FloatingPanelApp automaticamente quando no Instagram

import { HostnameValidator } from './src/hostname/HostnameValidator.js';
import { MESSAGE_TYPES } from './src/constants/Constants.js';
import type { FloatingPanelApp } from './src/bundle/FloatingPanelApp.js';

interface MessageRequest {
  action?: string;
  [key: string]: any;
}

class ContentScript {
  private _initialized: boolean;
  private _container: HTMLElement | null;
  private _app: FloatingPanelApp | null;
  private _currentUrl: string;
  private _isEnabled: boolean;

  constructor() {
    this._initialized = false;
    this._container = null;
    this._app = null;
    this._currentUrl = '';
    this._isEnabled = false;
  }

  async initialize(): Promise<void> {
    // Evita inicialização duplicada
    if (this._initialized || window.__GHOSTGRAM_INITIALIZED__) {
      console.log('[GhostGram] Já inicializado');
      return;
    }

    // Verifica se está no Instagram
    if (!HostnameValidator.isValid(location)) {
      console.log('[GhostGram] Não está no Instagram, ignorando');
      return;
    }

    console.log('[GhostGram] Inicializando no Instagram...');
    this._initialized = true;
    window.__GHOSTGRAM_INITIALIZED__ = true;

    // Configura listener para mensagens do popup
    this._setupMessageListener();

    // Verifica estado inicial e carrega o painel se ativado
    await this._checkEnabledState();

    // Inicia monitoramento de URL para stories
    this._startUrlMonitor();
  }

  /**
   * Configura listener para mensagens do popup (toggle)
   * @private
   */
  private _setupMessageListener(): void {
    chrome.runtime.onMessage.addListener((
      message: MessageRequest,
      _sender: chrome.runtime.MessageSender,
      sendResponse: (response?: any) => void
    ) => {
      if (message.action === 'toggle') {
        this._handleToggle();
        sendResponse({ success: true });
      }
      return true;
    });
  }

  /**
   * Verifica o estado habilitado no storage
   * @private
   */
  private async _checkEnabledState(): Promise<void> {
    try {
      const result = await chrome.storage.local.get('enabled');
      // Se o valor é null/undefined, considera como ativado (mesmo comportamento de ExtensionState)
      // Só considera desativado se explicitamente for false
      this._isEnabled = result.enabled !== false;

      console.log('[GhostGram] Estado inicial:', this._isEnabled ? 'Ativado' : 'Desativado');

      if (this._isEnabled) {
        await this._loadFloatingPanel();
      }
    } catch (error) {
      console.error('[GhostGram] Erro ao verificar estado:', error);
      // Em caso de erro, carrega por padrão
      await this._loadFloatingPanel();
    }
  }

  /**
   * Trata mudança de estado do toggle
   * @private
   */
  private async _handleToggle(): Promise<void> {
    try {
      const result = await chrome.storage.local.get('enabled');
      // Mesma lógica: só é desativado se explicitamente false
      this._isEnabled = result.enabled !== false;

      console.log('[GhostGram] Toggle:', this._isEnabled ? 'Ativado' : 'Desativado');

      if (this._isEnabled) {
        await this._showPanel();
      } else {
        this._hidePanel();
      }
    } catch (error) {
      console.error('[GhostGram] Erro ao processar toggle:', error);
    }
  }

  /**
   * Mostra o painel (carrega se necessário)
   * @private
   */
  private async _showPanel(): Promise<void> {
    if (!this._container || !this._app) {
      await this._loadFloatingPanel();
      return;
    }

    this._container.style.display = 'block';
  }

  /**
   * Esconde o painel
   * @private
   */
  private _hidePanel(): void {
    if (this._container) {
      this._container.style.display = 'none';
    }
  }

  private async _loadFloatingPanel(): Promise<void> {
    try {
      // Configura bridge de comunicação antes de carregar o app
      this._setupCommunicationBridge();

      // Importa e inicializa o FloatingPanelApp
      const module = await import(
        chrome.runtime.getURL('src/bundle/FloatingPanelApp.js')
      ) as { FloatingPanelApp: new () => FloatingPanelApp };

      // Cria container se não existir
      this._container = document.getElementById('ghostgram-panel');
      if (!this._container) {
        this._container = document.createElement('div');
        this._container.id = 'ghostgram-panel';
        document.body.appendChild(this._container);
      }

      // Inicializa o app
      this._app = new module.FloatingPanelApp();
      await this._app.init(this._container);

      console.log('[GhostGram] Painel flutuante carregado com sucesso');
    } catch (error) {
      console.error('[GhostGram] Erro ao carregar painel:', error);
    }
  }

  /**
   * Configura bridge de comunicação entre o app (contexto da página) e o background (via content script)
   * O FloatingPanelApp roda no contexto da página e não tem acesso ao chrome.runtime
   * @private
   */
  private _setupCommunicationBridge(): void {
    window.addEventListener('message', async (event: MessageEvent) => {
      // Ignora mensagens de outras origens
      if (event.source !== window) {
        return;
      }

      // Processa apenas mensagens do GhostGram
      if (event.data?.type !== MESSAGE_TYPES.GHOSTGRAM_TO_BACKGROUND) {
        return;
      }

      const { action, payload } = event.data as { action: string; payload?: Record<string, any> };
      console.log('[GhostGram Bridge] Encaminhando para background:', action);

      try {
        const response = await chrome.runtime.sendMessage({ action, ...payload });

        // Envia resposta de volta para o app
        window.postMessage({
          type: 'GHOSTGRAM_FROM_BACKGROUND',
          action,
          response,
          success: true
        }, '*');
      } catch (error) {
        const err = error as Error;
        console.error('[GhostGram Bridge] Erro:', error);
        window.postMessage({
          type: 'GHOSTGRAM_FROM_BACKGROUND',
          action,
          error: err.message,
          success: false
        }, '*');
      }
    });
  }

  /**
   * Inicia monitoramento de URL para ocultar em stories
   * @private
   */
  private _startUrlMonitor(): void {
    // Verifica URL inicial
    this._checkUrl();

    // Monitora mudanças de URL (Instagram usa SPA)
    this._currentUrl = location.href;

    // Usa MutationObserver para detectar mudanças na página
    const observer = new MutationObserver(() => {
      if (location.href !== this._currentUrl) {
        this._currentUrl = location.href;
        this._checkUrl();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Também escuta popstate para navegação do browser
    window.addEventListener('popstate', () => this._checkUrl());
  }

  /**
   * Verifica URL e oculta/mostra widget conforme necessário
   * @private
   */
  private _checkUrl(): void {
    if (!this._container || !this._isEnabled) {
      return;
    }

    const isStories = this._isStoriesUrl(location.pathname);
    const isReels = this._isReelsUrl(location.pathname);
    const isPost = this._isPostUrl(location.pathname);
    const shouldHide = isStories || isReels || isPost;

    if (shouldHide) {
      this._container.style.display = 'none';
    } else {
      this._container.style.display = 'block';
    }
  }

  /**
   * Verifica se está na URL de stories
   * @private
   */
  private _isStoriesUrl(pathname: string): boolean {
    return pathname.includes('/stories/');
  }

  /**
   * Verifica se está na URL de reels
   * @private
   */
  private _isReelsUrl(pathname: string): boolean {
    return pathname.includes('/reels/') || pathname.startsWith('/reel/');
  }

  /**
   * Verifica se está na URL de publicações (posts, IGTV, Reels)
   * @private
   */
  private _isPostUrl(pathname: string): boolean {
    return pathname.startsWith('/p/') ||
      pathname.startsWith('/tv/') ||
      pathname.startsWith('/reel/');
  }
}

// Inicializa quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ContentScript().initialize();
  });
} else {
  new ContentScript().initialize();
}

// Exporta para uso externo se necessário
export function initializeContentScript(): void {
  new ContentScript().initialize();
}
