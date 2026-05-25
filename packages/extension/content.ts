// Content script - Ponto de entrada único
// Injetado automaticamente pelo Chrome no Instagram (manifest.json → content_scripts)
// Executa no mundo isolado do content script (acesso a chrome.* APIs + DOM da página)

// Constantes inlinadas para evitar imports estáticos (content scripts clássicos não suportam ESM)
const INSTAGRAM_HOSTNAME = 'www.instagram.com';

interface FloatingPanelAppInterface {
  init(container: HTMLElement): Promise<void>;
  destroy?(): void;
}

interface MessageRequest {
  action?: string;
  [key: string]: any;
}

class ContentScript {
  private _initialized: boolean;
  private _container: HTMLElement | null;
  private _app: FloatingPanelAppInterface | null;
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
    if (location.hostname !== INSTAGRAM_HOSTNAME) {
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

  /**
   * Carrega o FloatingPanelApp via import() dinâmico.
   * O import() dinâmico funciona em content scripts desde Chrome 89+,
   * e carrega o módulo ESM no mundo isolado do content script.
   * @private
   */
  private async _loadFloatingPanel(): Promise<void> {
    try {
      // Importa e inicializa o FloatingPanelApp
      const moduleUrl = chrome.runtime.getURL('src/bundle/FloatingPanelApp.js');
      const module = await import(/* @vite-ignore */ moduleUrl) as {
        FloatingPanelApp: new () => FloatingPanelAppInterface
      };

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
   * Inicia monitoramento de URL para ocultar em stories/reels/posts
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

    const pathname = location.pathname;
    const shouldHide = pathname.includes('/stories/') ||
      pathname.includes('/reels/') ||
      pathname.startsWith('/reel/') ||
      pathname.startsWith('/p/') ||
      pathname.startsWith('/tv/');

    this._container.style.display = shouldHide ? 'none' : 'block';
  }
}

// Inicializa quando o DOM estiver pronto
(async (): Promise<void> => {
  if (window.__GHOSTGRAM_CONTENT_LOADED__) {
    return;
  }
  window.__GHOSTGRAM_CONTENT_LOADED__ = true;

  const contentScript = new ContentScript();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      contentScript.initialize();
    });
  } else {
    await contentScript.initialize();
  }
})();
