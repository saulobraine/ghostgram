// FloatingPanelApp - Aplicação simplificada para o painel flutuante
import { FloatingPanel } from './components/FloatingPanel.js';
import { InstagramApiClient } from './services/InstagramApiClient.js';
import { ScanService } from './services/ScanService.js';
import { UnfollowService } from './services/UnfollowService.js';
import { StateManager } from './utils/StateManager.js';
import { followMonitor } from './services/FollowMonitor.js';
import { profileOverlay } from './components/ProfileOverlay.js';
import { Settings } from '../domain/Settings.js';

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

    // Serviços
    this._scanService = null;
    this._unfollowService = null;
  }

  /**
   * Inicializa a aplicação
   * @param {HTMLElement} container - Elemento container
   */
  init(container) {
    this._container = container;
    this._render();
    this._setupMessageListener();
    console.log('[FloatingPanelApp] Inicializado');
  }

  /**
   * Configura listener para mensagens do content script
   */
  _setupMessageListener() {
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'INSTAGRAM_UNFOLLOWERS_START_SCAN') {
        this._handleStartScan();
      }
    });
  }

  /**
   * Inicia o processo de scan
   */
  async _handleStartScan() {
    if (this._state.isScanning) {
      return;
    }

    this._state.isScanning = true;
    this._state.isPaused = false;
    this._state.isScanCompleted = false;
    this._state.scanProgress = 0;
    this._state.nonFollowers = [];
    this._state.selectedUsers.clear();
    this._state.isExpanded = true;
    this._update();

    this._scanService = new ScanService(
      this._apiClient,
      this._settings,
      (percentage, results) => this._onScanProgress(percentage, results)
    );

    try {
      const allFollowing = await this._scanService.start();
      // Se foi cancelado, não atualiza estado final
      if (this._state.isScanning) {
        this._state.nonFollowers = allFollowing.filter(user => !user.followsViewer());
        this._state.isScanCompleted = true;
        this._state.isScanning = false;
        this._state.scanProgress = 100;
        console.log(`[FloatingPanelApp] Scan concluído.${this._state.nonFollowers.length} não - seguidores encontrados.`);
      }
    } catch (error) {
      console.error('[FloatingPanelApp] Erro no scan:', error);
      this._state.isScanning = false;
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
    this._update();
  }

  /**
   * Cancela o scan
   */
  _handleCancelScan() {
    if (!this._scanService) {
      return;
    }

    this._scanService.stop();
    this._state.isScanning = false;
    this._state.isPaused = false;
    this._state.isScanCompleted = this._state.nonFollowers.length > 0;
    this._update();
    console.log('[FloatingPanelApp] Scan cancelado.');
  }

  /**
   * Callback de progresso do scan
   */
  _onScanProgress(percentage, results) {
    this._state.scanProgress = percentage;
    // Atualiza contagem parcial de não-seguidores
    this._state.nonFollowers = results.filter(user => !user.followsViewer());
    this._update();
  }

  /**
   * Inicia o processo de unfollow
   */
  async _handleStartUnfollow() {
    if (this._state.isUnfollowing || this._state.selectedUsers.size === 0) {
      return;
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
    const userItem = this._container.querySelector(`[data - user - id= "${userId}"]`);
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

    // Re-render necessário para atualizar todos checkboxes
    this._render();
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
    this._render();
  }

  /**
   * Muda aba ativa
   */
  _handleChangeTab(tab) {
    this._state.activeTab = tab;
    this._state.searchQuery = '';
    this._render();
  }

  /**
   * Atualiza pesquisa
   */
  _handleSearch(query) {
    this._state.searchQuery = query;
    this._render();
  }

  /**
   * Abre a página de histórico completo
   */
  _handleOpenHistory() {
    chrome.runtime.sendMessage({ action: 'openHistory' });
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
