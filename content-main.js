// Content script main - Versão Simplificada
// Carrega o FloatingPanelApp automaticamente quando no Instagram

import { HostnameValidator } from './src/hostname/HostnameValidator.js';

class ContentScript {
  constructor() {
    this._initialized = false;
    this._container = null;
    this._currentUrl = '';
  }

  async initialize() {
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

    // Carrega o painel flutuante diretamente
    await this._loadFloatingPanel();

    // Inicia monitoramento de URL para stories
    this._startUrlMonitor();
  }

  async _loadFloatingPanel() {
    try {
      // Importa e inicializa o FloatingPanelApp
      const { FloatingPanelApp } = await import(
        chrome.runtime.getURL('src/bundle/FloatingPanelApp.js')
      );

      // Cria container se não existir
      this._container = document.getElementById('ghostgram-panel');
      if (!this._container) {
        this._container = document.createElement('div');
        this._container.id = 'ghostgram-panel';
        document.body.appendChild(this._container);
      }

      // Inicializa o app
      const app = new FloatingPanelApp();
      app.init(this._container);

      console.log('[GhostGram] Painel flutuante carregado com sucesso');
    } catch (error) {
      console.error('[GhostGram] Erro ao carregar painel:', error);
    }
  }

  /**
   * Inicia monitoramento de URL para ocultar em stories
   */
  _startUrlMonitor() {
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
   */
  _checkUrl() {
    if (!this._container) {
      return;
    }

    const isStories = this._isStoriesUrl(location.pathname);
    const isReels = this._isReelsUrl(location.pathname);
    const shouldHide = isStories || isReels;

    if (shouldHide) {
      this._container.style.display = 'none';
    } else {
      this._container.style.display = 'block';
    }
  }

  /**
   * Verifica se está na URL de stories
   */
  _isStoriesUrl(pathname) {
    return pathname.includes('/stories/');
  }

  /**
   * Verifica se está na URL de reels
   */
  _isReelsUrl(pathname) {
    return pathname.includes('/reels/') || pathname.startsWith('/reel/');
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
export function initializeContentScript() {
  new ContentScript().initialize();
}
