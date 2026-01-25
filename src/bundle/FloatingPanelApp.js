// FloatingPanelApp - Aplicação simplificada para o painel flutuante
import { FloatingPanel } from './components/FloatingPanel.js';
import { InstagramApiClient } from './services/InstagramApiClient.js';
import { ScanService } from './services/ScanService.js';
import { UnfollowService } from './services/UnfollowService.js';
import { StateManager } from './utils/StateManager.js';
import { followMonitor } from './services/FollowMonitor.js';
import { profileOverlay } from './components/ProfileOverlay.js';
import { User } from './domain/User.js';
import { Settings } from '../domain/Settings.js';
import { SyncStorageAdapter } from '../storage/SyncStorageAdapter.js';
import { LocalStorageAdapter } from '../storage/LocalStorageAdapter.js';
import { STORAGE_KEYS, DEFAULT_QUICK_SETTINGS, MESSAGE_TYPES } from '../constants/Constants.js';

/**
 * Aplicação principal do painel flutuante
 * Gerencia o estado e coordena os serviços de scan e unfollow
 */
export class FloatingPanelApp {
  constructor() {
    this._container = null;
    this._floatingPanel = null;
    this._apiClient = new InstagramApiClient();
    this._settings = Settings.createDefault();
    this._storage = new SyncStorageAdapter();
    this._localStorage = new LocalStorageAdapter();

    // Inicia monitoramento de cliques manuais e sobreposição de perfil
    followMonitor.start();
    profileOverlay.init();

    // Estado da aplicação
    this._state = {
      isExpanded: false,
      isScanning: false,
      isPaused: false,
      isScanCompleted: false,
      isUnfollowing: false,
      scanProgress: 0,
      unfollowProgress: 0,
      nonFollowers: [],
      selectedUsers: new Set(),
      whitelist: new Set(),
      activeTab: 'nonFollowers',
      searchQuery: '',
      unfollowLog: []
    };

    // Configurações rápidas do popup
    this._quickSettings = {
      panelPosition: DEFAULT_QUICK_SETTINGS.panelPosition,
      startExpanded: DEFAULT_QUICK_SETTINGS.startExpanded,
      stealthMode: DEFAULT_QUICK_SETTINGS.stealthMode
    };

    // Serviços
    this._scanService = null;
    this._unfollowService = null;
  }

  /**
   * Inicializa a aplicação
   * @param {HTMLElement} container - Elemento container
   */
  async init(container) {
    this._container = container;
    await this._loadSettings();
    await this._loadQuickSettings();
    this._setupSettingsChangeListener();
    this._render();
    this._setupMessageListener();

    // Verifica se há scan para retomar
    await this._checkResumableScan();

    console.log('[FloatingPanelApp] Inicializado');
  }

  /**
   * Carrega configurações rápidas do popup
   */
  async _loadQuickSettings() {
    try {
      const panelPosition = await this._localStorage.get(STORAGE_KEYS.PANEL_POSITION);
      const startExpanded = await this._localStorage.get(STORAGE_KEYS.START_EXPANDED);
      const stealthMode = await this._localStorage.get(STORAGE_KEYS.STEALTH_MODE);

      this._quickSettings.panelPosition = panelPosition || DEFAULT_QUICK_SETTINGS.panelPosition;
      this._quickSettings.startExpanded = startExpanded || DEFAULT_QUICK_SETTINGS.startExpanded;
      this._quickSettings.stealthMode = stealthMode || DEFAULT_QUICK_SETTINGS.stealthMode;

      // Aplica configuração de iniciar expandido
      if (this._quickSettings.startExpanded && !this._state.isExpanded) {
        this._state.isExpanded = true;
      }

      console.log('[FloatingPanelApp] Configurações rápidas carregadas:', this._quickSettings);
    } catch (e) {
      console.error('[FloatingPanelApp] Erro ao carregar configurações rápidas:', e);
    }
  }

  /**
   * Configura listener para mudanças de configurações vindas do popup
   */
  _setupSettingsChangeListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action !== 'settingsChanged') {
        return;
      }

      const { data } = message;

      if (data.panelPosition !== undefined) {
        this._quickSettings.panelPosition = data.panelPosition;
        this._applyPanelPosition(true); // Força aplicação ao mudar configuração
      }

      if (data.stealthMode !== undefined) {
        this._quickSettings.stealthMode = data.stealthMode;
        this._applyStealthMode();
      }

      if (data.startExpanded !== undefined) {
        this._quickSettings.startExpanded = data.startExpanded;
      }

      sendResponse({ success: true });
    });
  }

  /**
   * Aplica posição do painel baseado na configuração
   * @param {boolean} forceApply - Se true, ignora posição customizada do usuário
   */
  _applyPanelPosition(forceApply = false) {
    if (!this._floatingPanel || !this._floatingPanel.element) {
      return;
    }

    // Se o usuário já arrastou o painel, não reaplica a posição padrão
    // (a menos que seja forçado, ex: quando muda configuração no popup)
    const currentPosition = this._floatingPanel._position;
    if (!forceApply && currentPosition && currentPosition.left !== undefined) {
      // Usuário já definiu posição via drag, mantém
      return;
    }

    const el = this._floatingPanel.element;
    const position = this._quickSettings.panelPosition;
    const margin = 20;

    // Reset posição
    el.style.left = 'auto';
    el.style.right = 'auto';
    el.style.top = 'auto';
    el.style.bottom = 'auto';

    switch (position) {
      case 'top-left':
        el.style.left = `${margin}px`;
        el.style.top = `${margin}px`;
        break;
      case 'top-right':
        el.style.right = `${margin}px`;
        el.style.top = `${margin}px`;
        break;
      case 'bottom-left':
        el.style.left = `${margin}px`;
        el.style.bottom = `${margin}px`;
        break;
      case 'bottom-right':
      default:
        el.style.right = `${margin}px`;
        el.style.bottom = `${margin}px`;
        break;
    }

    // Atualiza posição interna do FloatingPanel
    this._floatingPanel._position = this._getPositionFromSetting(position);
    this._floatingPanel._savePosition();
  }

  /**
   * Converte configuração de posição para objeto de posição usado pelo FloatingPanel
   */
  _getPositionFromSetting(position) {
    const margin = 20;

    switch (position) {
      case 'top-left':
        return { left: margin, top: margin };
      case 'top-right':
        return { right: margin, top: margin };
      case 'bottom-left':
        return { left: margin, bottom: margin };
      case 'bottom-right':
      default:
        return { right: margin, bottom: margin };
    }
  }

  /**
   * Aplica modo discreto
   */
  _applyStealthMode() {
    if (!this._floatingPanel || !this._floatingPanel.element) {
      return;
    }

    const el = this._floatingPanel.element;

    if (this._quickSettings.stealthMode) {
      el.classList.add('iu-stealth-mode');
    } else {
      el.classList.remove('iu-stealth-mode');
    }
  }

  /**
   * Verifica se há um scan em andamento/pausado para retomar
   */
  async _checkResumableScan() {
    try {
      const persisted = await this._localStorage.get(STORAGE_KEYS.SCAN_PERSISTENCE);
      if (persisted && (persisted.status === 'scanning' || persisted.status === 'paused')) {
        console.log('[FloatingPanelApp] Retomando scan persistido:', persisted);
        const results = (persisted.results || []).map(u => User.fromObject(u));
        // Não aguardamos o início do scan para não bloquear a inicialização do app
        this._handleStartScan({
          isResumed: true,
          status: persisted.status,
          results: results,
          cursor: persisted.cursor,
          processedCount: persisted.processedCount || 0,
          totalCount: persisted.totalCount || -1
        }).catch(e => console.error('[FloatingPanelApp] Erro ao retomar scan:', e));
      }
    } catch (e) {
      console.error('[FloatingPanelApp] Erro ao verificar scan resumível:', e);
    }
  }

  /**
   * Carrega configurações do storage
   */
  async _loadSettings() {
    try {
      const stored = await this._storage.getAll();
      this._settings = Settings.fromObject(stored);
      console.log('[FloatingPanelApp] Configurações carregadas');
    } catch (e) {
      console.error('[FloatingPanelApp] Erro ao carregar configurações:', e);
      // Mantém padrões em caso de erro
    }
  }

  /**
   * Configura listener para mensagens do content script
   */
  _setupMessageListener() {
    window.addEventListener('message', (event) => {
      if (event.data?.type === MESSAGE_TYPES.INSTAGRAM_UNFOLLOWERS_START_SCAN) {
        this._handleStartScan();
      }
    });
  }

  /**
   * Inicia o processo de scan
   * @param {Object} options - Opções de retomada
   */
  async _handleStartScan(options = {}) {
    if (this._state.isScanning && !options.isResumed) {
      return;
    }

    const isResumed = options.isResumed || false;

    this._state.isScanning = true;
    this._state.isPaused = options.status === 'paused';
    this._state.isScanCompleted = false;

    if (!isResumed) {
      this._state.scanProgress = 0;
      this._state.nonFollowers = [];
      this._state.selectedUsers.clear();
      this._state.isExpanded = true;
    } else {
      // Se for retomado, inicializa com os dados salvos
      this._state.nonFollowers = options.results.filter(user => !user.followsViewer());
      this._state.isExpanded = true;
      // O progresso real será atualizado no primeiro callback do ScanService
    }

    this._update();

    this._scanService = new ScanService(
      this._apiClient,
      this._settings,
      (percentage, results, cursor, processedCount, totalCount) =>
        this._onScanProgress(percentage, results, cursor, processedCount, totalCount)
    );

    try {
      const allFollowing = await this._scanService.start({
        initialResults: isResumed ? options.results : [],
        startCursor: isResumed ? options.cursor : null,
        initialProcessedCount: isResumed ? options.processedCount : 0,
        initialTotalCount: isResumed ? options.totalCount : -1
      });

      // Se foi cancelado, não atualiza estado final
      if (this._state.isScanning) {
        this._state.nonFollowers = allFollowing.filter(user => !user.followsViewer());
        this._state.isScanCompleted = true;
        this._state.isScanning = false;
        this._state.scanProgress = 100;
        console.log(`[FloatingPanelApp] Scan concluído. ${this._state.nonFollowers.length} não-seguidores encontrados.`);
        await this._clearScanPersistence();
      }
    } catch (error) {
      console.error('[FloatingPanelApp] Erro no scan:', error);
      this._state.isScanning = false;
      // Em caso de erro, talvez não devêssemos limpar a persistência para permitir nova tentativa?
      // Por enquanto limpamos para evitar loop de erro
      await this._clearScanPersistence();
    }

    this._state.isPaused = false;
    this._update();
  }

  /**
   * Pausa/resume o scan
   */
  _handleTogglePause() {
    if (!this._scanService || !this._state.isScanning) {
      return;
    }

    if (this._state.isPaused) {
      this._scanService.resume();
      this._state.isPaused = false;
    } else {
      this._scanService.pause();
      this._state.isPaused = true;
    }

    this._saveScanPersistence();
    this._update();
  }

  /**
   * Cancela o scan
   */
  async _handleCancelScan() {
    if (!this._scanService) {
      return;
    }

    this._scanService.stop();
    this._state.isScanning = false;
    this._state.isPaused = false;
    this._state.isScanCompleted = this._state.nonFollowers.length > 0;

    await this._clearScanPersistence();
    this._update();
    console.log('[FloatingPanelApp] Scan cancelado.');
  }

  /**
   * Callback de progresso do scan
   */
  _onScanProgress(percentage, results, cursor, processedCount, totalCount) {
    this._state.scanProgress = percentage;
    // Atualiza contagem parcial de não-seguidores
    this._state.nonFollowers = results.filter(user => !user.followsViewer());
    this._update();

    // Salva persistência
    this._currentScanCursor = cursor;
    this._currentScanResults = results;
    this._currentScanProcessedCount = processedCount;
    this._currentScanTotalCount = totalCount;
    this._saveScanPersistence();
  }

  /**
   * Salva o estado atual do scan para persistência
   */
  async _saveScanPersistence() {
    if (!this._state.isScanning) {
      return;
    }

    const persistence = {
      status: this._state.isPaused ? 'paused' : 'scanning',
      date: Date.now(),
      cursor: this._currentScanCursor,
      results: this._currentScanResults,
      processedCount: this._currentScanProcessedCount,
      totalCount: this._currentScanTotalCount
    };

    try {
      await this._localStorage.set(STORAGE_KEYS.SCAN_PERSISTENCE, persistence);
    } catch (e) {
      console.error('[FloatingPanelApp] Erro ao salvar persistência:', e);
    }
  }

  /**
   * Limpa os dados de persistência do scan
   */
  async _clearScanPersistence() {
    try {
      await this._localStorage.remove(STORAGE_KEYS.SCAN_PERSISTENCE);
      this._currentScanCursor = null;
      this._currentScanResults = null;
      this._currentScanProcessedCount = 0;
    } catch (e) {
      console.error('[FloatingPanelApp] Erro ao limpar persistência:', e);
    }
  }

  /**
   * Inicia o processo de unfollow
   */
  async _handleStartUnfollow() {
    if (this._state.isUnfollowing || this._state.selectedUsers.size === 0) {
      return;
    }

    // Se estiver escaneando, para o scan antes de começar o unfollow
    if (this._state.isScanning) {
      await this._handleCancelScan();
    }

    const usersToUnfollow = this._state.nonFollowers.filter(
      user => this._state.selectedUsers.has(user.getId())
    );

    this._state.isUnfollowing = true;
    this._state.unfollowProgress = 0;
    this._state.unfollowLog = [];
    this._update();

    this._unfollowService = new UnfollowService(
      this._apiClient,
      this._settings,
      (percentage, log) => this._onUnfollowProgress(percentage, log)
    );

    try {
      const log = await this._unfollowService.execute(usersToUnfollow);
      this._state.unfollowLog = log;
      this._state.isUnfollowing = false;
      this._state.unfollowProgress = 100;

      // Remove usuários que foram unfollowed da lista
      const unfollowedIds = new Set(log.filter(e => e.success).map(e => e.user.getId()));
      this._state.nonFollowers = this._state.nonFollowers.filter(
        user => !unfollowedIds.has(user.getId())
      );
      this._state.selectedUsers.clear();

      console.log(`[FloatingPanelApp] Unfollow concluído.${unfollowedIds.size} usuários removidos.`);
    } catch (error) {
      console.error('[FloatingPanelApp] Erro no unfollow:', error);
      this._state.isUnfollowing = false;
    }

    this._update();
  }

  /**
   * Callback de progresso do unfollow
   */
  _onUnfollowProgress(percentage, log) {
    this._state.unfollowProgress = percentage;
    this._state.unfollowLog = log;
    this._update();
  }

  /**
   * Toggle expansão do painel
   */
  _handleToggle() {
    this._state.isExpanded = !this._state.isExpanded;
    this._update();
  }

  /**
   * Toggle seleção de usuário
   */
  _handleToggleUser(userId) {
    if (this._state.selectedUsers.has(userId)) {
      this._state.selectedUsers.delete(userId);
    } else {
      this._state.selectedUsers.add(userId);
    }

    // Atualiza visual do item selecionado
    const userItem = this._container.querySelector(`[data-user-id="${userId}"]`);
    if (userItem) {
      userItem.classList.toggle('iu-selected');
    }

    // Atualiza contador e botão
    this._floatingPanel.update(this._getProps());
  }

  /**
   * Seleciona/deseleciona todos os usuários
   */
  _handleToggleAll(selectAll) {
    if (selectAll) {
      this._state.nonFollowers.forEach(user => {
        this._state.selectedUsers.add(user.getId());
      });
    } else {
      this._state.selectedUsers.clear();
    }

    // Re-render necessário para atualizar todos checkboxes (preservando posição)
    this._renderPreservingPosition();
  }

  /**
   * Toggle whitelist de um usuário
   */
  _handleToggleWhitelist(userId) {
    if (this._state.whitelist.has(userId)) {
      this._state.whitelist.delete(userId);
      // Também remove da seleção se estava selecionado
    } else {
      this._state.whitelist.add(userId);
      // Remove da seleção ao adicionar na whitelist
      this._state.selectedUsers.delete(userId);
    }
    this._update();
  }

  /**
   * Muda aba ativa
   */
  _handleChangeTab(tab) {
    this._state.activeTab = tab;
    this._state.searchQuery = '';
    this._update();
  }

  /**
   * Atualiza pesquisa
   */
  _handleSearch(query) {
    this._state.searchQuery = query;
    this._update();
  }

  /**
   * Abre a página de histórico completo
   * Usa bridge de comunicação pois o app roda no contexto da página, não do content script
   */
  _handleOpenHistory() {
    console.log('[FloatingPanelApp] Abrindo página de histórico via bridge...');

    window.postMessage({
      type: MESSAGE_TYPES.GHOSTGRAM_TO_BACKGROUND,
      action: 'openHistory',
      payload: {}
    }, '*');
  }

  /**
   * Retorna props para o componente
   */
  _getProps() {
    return {
      isExpanded: this._state.isExpanded,
      isScanning: this._state.isScanning,
      isPaused: this._state.isPaused,
      isScanCompleted: this._state.isScanCompleted,
      isUnfollowing: this._state.isUnfollowing,
      scanProgress: this._state.scanProgress,
      unfollowProgress: this._state.unfollowProgress,
      nonFollowers: this._state.nonFollowers,
      selectedUsers: this._state.selectedUsers,
      whitelist: this._state.whitelist,
      activeTab: this._state.activeTab,
      searchQuery: this._state.searchQuery,
      unfollowLog: this._state.unfollowLog,
      onToggle: () => this._handleToggle(),
      onStartScan: () => this._handleStartScan(),
      onTogglePause: () => this._handleTogglePause(),
      onCancelScan: () => this._handleCancelScan(),
      onStartUnfollow: () => this._handleStartUnfollow(),
      onToggleUser: (userId) => this._handleToggleUser(userId),
      onToggleAll: (selectAll) => this._handleToggleAll(selectAll),
      onToggleWhitelist: (userId) => this._handleToggleWhitelist(userId),
      onChangeTab: (tab) => this._handleChangeTab(tab),
      onSearch: (query) => this._handleSearch(query),
      onOpenHistory: () => this._handleOpenHistory()
    };
  }

  /**
   * Renderiza o painel pela primeira vez
   */
  _render() {
    if (!this._container) {
      return;
    }

    // Limpa o container
    this._container.innerHTML = '';

    // Cria o painel
    this._floatingPanel = new FloatingPanel();
    this._container.appendChild(this._floatingPanel.render(this._getProps()));
    this._isFirstRender = false;

    // Aplica configurações rápidas
    this._applyPanelPosition();
    this._applyStealthMode();
  }

  /**
   * Atualiza o painel de forma incremental
   */
  _update() {
    if (!this._floatingPanel || this._isFirstRender) {
      this._render();
      return;
    }

    this._floatingPanel.update(this._getProps());
  }

  /**
   * Renderiza o painel preservando a posição atual
   * Usado quando precisa re-render completo mas quer manter posição do usuário
   */
  _renderPreservingPosition() {
    if (!this._container) {
      return;
    }

    // Salva posição atual antes de recriar
    const savedPosition = this._floatingPanel?._preservePosition();

    // Limpa o container
    this._container.innerHTML = '';

    // Cria o painel
    this._floatingPanel = new FloatingPanel();
    this._container.appendChild(this._floatingPanel.render(this._getProps()));
    this._isFirstRender = false;

    // Restaura posição salva (se existir)
    if (savedPosition) {
      this._floatingPanel._restorePosition(savedPosition);
    } else {
      // Se não tinha posição, aplica configuração padrão
      this._applyPanelPosition();
    }

    this._applyStealthMode();
  }

  /**
   * Destrói a aplicação
   */
  destroy() {
    if (this._scanService) {
      this._scanService.stop();
    }
    if (this._unfollowService) {
      this._unfollowService.stop();
    }
    if (this._container) {
      this._container.innerHTML = '';
    }
  }
}
