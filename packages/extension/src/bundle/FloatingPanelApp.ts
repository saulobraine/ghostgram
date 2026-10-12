// FloatingPanelApp - Aplicação simplificada para o painel flutuante
import { FloatingPanel } from './components/FloatingPanel.js';
import { InstagramApiClient } from './services/InstagramApiClient.js';
import { ScanService } from './services/ScanService.js';
import { UnfollowService } from './services/UnfollowService.js';
import type { UnfollowProgressUiState } from './services/UnfollowService.js';
import { UnfollowProgressModal } from './components/UnfollowProgressModal.js';
import { StateManager } from './utils/StateManager.js';
import { followMonitor } from './services/FollowMonitor.js';
// profileOverlay e profileHistoryButton não são mais inicializados na página
// O histórico de ações aparece somente no popup
import { User } from './domain/User.js';
import { Settings } from '../domain/Settings.js';
import { SyncStorageAdapter } from '../storage/SyncStorageAdapter.js';
import { LocalStorageAdapter } from '../storage/LocalStorageAdapter.js';
import { STORAGE_KEYS, DEFAULT_QUICK_SETTINGS, MESSAGE_ACTIONS, MESSAGE_TYPES, ACTION_TYPES, UNFOLLOW_COOLDOWN_MS, SCAN_CHECKPOINT_COOLDOWN_MS } from '../constants/Constants.js';
import type { UnfollowLogEntry } from './domain/UnfollowLogEntry.js';

interface ScanResumeOptions {
  isResumed?: boolean;
  status?: string;
  results?: User[];
  cursor?: string | null;
  processedCount?: number;
  totalCount?: number;
}

interface QuickSettings {
  startExpanded: boolean;
  stealthMode: boolean;
}

interface ScanRecord {
  id: number;
  date: string;
  nonFollowersCount: number;
  nonFollowers: ReturnType<User['toObject']>[];
  totalScanned: number;
}

interface ScanPersistence {
  status: 'scanning' | 'paused';
  date: number;
  cursor: string | null | undefined;
  results: User[] | null | undefined;
  processedCount: number | undefined;
  totalCount: number | undefined;
}

interface ActionHistoryEntry {
  actionType: string;
  timestamp: number;
  username: string;
}

interface AppState {
  isExpanded: boolean;
  isScanning: boolean;
  isPaused: boolean;
  isScanCompleted: boolean;
  isUnfollowing: boolean;
  isUnfollowModalOpen: boolean;
  scanProgress: number;
  unfollowProgress: number;
  nonFollowers: User[];
  selectedUsers: Set<string>;
  whitelist: Set<string>;
  activeTab: string;
  searchQuery: string;
  unfollowLog: UnfollowLogEntry[];
  scanHistory: ScanRecord[];
  unfollowBlockUntil: number | null;
  scanBlockUntil: number | null;
  scanErrorMessage: string | null;
}

/**
 * Aplicação principal do painel flutuante
 * Gerencia o estado e coordena os serviços de scan e unfollow
 */
export class FloatingPanelApp {
  private _container: HTMLElement | null;
  private _floatingPanel: FloatingPanel | null;
  private _apiClient: InstagramApiClient;
  private _settings: Settings;
  private _storage: SyncStorageAdapter;
  private _localStorage: LocalStorageAdapter;
  private _state: AppState;
  private _quickSettings: QuickSettings;
  private _scanService: ScanService | null;
  private _unfollowService: UnfollowService | null;
  private _unfollowModal: UnfollowProgressModal | null;
  private _isFirstRender: boolean | undefined;
  private _cooldownUsernames: Set<string> | undefined;
  private _currentScanCursor: string | null | undefined;
  private _currentScanResults: User[] | null | undefined;
  private _currentScanProcessedCount: number | undefined;
  private _currentScanTotalCount: number | undefined;
  private _cooldownTimer: number | null;

  constructor() {
    this._container = null;
    this._floatingPanel = null;
    this._apiClient = new InstagramApiClient();
    this._settings = Settings.createDefault();
    this._storage = new SyncStorageAdapter();
    this._localStorage = new LocalStorageAdapter();
    this._cooldownTimer = null;

    // Inicia monitoramento de cliques manuais
    followMonitor.start();
    // profileOverlay e profileHistoryButton removidos da página — histórico aparece somente no popup

    // Estado da aplicação
    this._state = {
      isExpanded: false,
      isScanning: false,
      isPaused: false,
      isScanCompleted: false,
      isUnfollowing: false,
      isUnfollowModalOpen: false,
      scanProgress: 0,
      unfollowProgress: 0,
      nonFollowers: [],
      selectedUsers: new Set(),
      whitelist: new Set(),
      activeTab: 'nonFollowers',
      searchQuery: '',
      unfollowLog: [],
      scanHistory: [],
      unfollowBlockUntil: null,
      scanBlockUntil: null,
      scanErrorMessage: null
    };

    // Configurações rápidas do popup
    this._quickSettings = {
      startExpanded: DEFAULT_QUICK_SETTINGS.startExpanded,
      stealthMode: DEFAULT_QUICK_SETTINGS.stealthMode
    };

    // Serviços
    this._scanService = null;
    this._unfollowService = null;
    this._unfollowModal = null;
  }

  /**
   * Inicializa a aplicação
   */
  async init(container: HTMLElement): Promise<void> {
    this._container = container;
    await this._loadSettings();
    await this._loadQuickSettings();
    await this._loadScanHistory();
    await this._loadWhitelist();
    await this._loadUnfollowCooldown();
    await this._loadScanCooldown();
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
  private async _loadQuickSettings(): Promise<void> {
    try {
      const startExpanded = await this._localStorage.get(STORAGE_KEYS.START_EXPANDED);
      const stealthMode = await this._localStorage.get(STORAGE_KEYS.STEALTH_MODE);

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
   * Carrega whitelist persistida
   */
  private async _loadWhitelist(): Promise<void> {
    try {
      const data = await this._localStorage.get(STORAGE_KEYS.WHITELISTED_RESULTS);
      if (Array.isArray(data)) {
        this._state.whitelist = new Set(data);
        console.log(`[FloatingPanelApp] Whitelist carregada: ${data.length} usuários`);
      }
    } catch (e) {
      console.error('[FloatingPanelApp] Erro ao carregar whitelist:', e);
    }
  }

  /**
   * Salva whitelist no storage
   */
  private async _saveWhitelist(): Promise<void> {
    try {
      await this._localStorage.set(STORAGE_KEYS.WHITELISTED_RESULTS, [...this._state.whitelist]);
    } catch (e) {
      console.error('[FloatingPanelApp] Erro ao salvar whitelist:', e);
    }
  }

  /**
   * Configura listener para mudanças de configurações vindas do popup
   */
  private _setupSettingsChangeListener(): void {
    chrome.runtime.onMessage.addListener((message: any, sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void) => {
      if (message.action === 'resetUnfollowCooldown') {
        this._state.unfollowBlockUntil = null;
        this._localStorage.remove(STORAGE_KEYS.UNFOLLOW_BLOCK_UNTIL).catch(() => {});
        this._update();
        sendResponse({ success: true });
        return;
      }

      if (message.action === 'resetScanCooldown') {
        this._state.scanBlockUntil = null;
        this._state.scanErrorMessage = null;
        this._localStorage.remove(STORAGE_KEYS.SCAN_BLOCK_UNTIL).catch(() => {});
        this._localStorage.remove(STORAGE_KEYS.SCAN_LAST_ERROR).catch(() => {});
        this._update();
        sendResponse({ success: true });
        return;
      }

      if (message.action !== 'settingsChanged') {
        return;
      }

      const { data } = message;

      if (data.panelPosition !== undefined) {
        // Posição agora é fixa no canto superior direito, ignora
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
   * Aplica modo discreto
   */
  private _applyStealthMode(): void {
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
  private async _checkResumableScan(): Promise<void> {
    try {
      const persisted: ScanPersistence | null = await this._localStorage.get(STORAGE_KEYS.SCAN_PERSISTENCE);
      if (persisted && (persisted.status === 'scanning' || persisted.status === 'paused')) {
        console.log('[FloatingPanelApp] Retomando scan persistido:', persisted);
        const results = ((persisted.results || []) as any[]).map((u: any) => User.fromObject(u));
        // Não aguardamos o início do scan para não bloquear a inicialização do app
        this._handleStartScan({
          isResumed: true,
          status: persisted.status,
          results: results,
          cursor: persisted.cursor,
          processedCount: persisted.processedCount || 0,
          totalCount: persisted.totalCount || -1
        }).catch((e: unknown) => console.error('[FloatingPanelApp] Erro ao retomar scan:', e));
      }
    } catch (e) {
      console.error('[FloatingPanelApp] Erro ao verificar scan resumível:', e);
    }
  }

  /**
   * Carrega configurações do storage
   */
  private async _loadSettings(): Promise<void> {
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
  private _setupMessageListener(): void {
    window.addEventListener('message', (event: MessageEvent) => {
      // Ignora mensagens de outras origens
      if (event.source !== window) return;

      const data = event.data as { type?: string; action?: string; success?: boolean; error?: string };

      // Mensagens do background de volta para o app
      if (data?.type === 'GHOSTGRAM_FROM_BACKGROUND') {
        console.log('[FloatingPanelApp] Resposta do background:', data.action, data.success);
        if (data.action === MESSAGE_ACTIONS.OPEN_HISTORY && data.success) {
          console.log('[FloatingPanelApp] Histórico aberto com sucesso');
        }
        return;
      }

      if (data?.type === MESSAGE_TYPES.INSTAGRAM_UNFOLLOWERS_START_SCAN) {
        this._handleStartScan();
      }
    });
  }

  /**
   * Inicia o processo de scan
   */
  private async _handleStartScan(options: ScanResumeOptions = {}): Promise<void> {
    if (this._state.isScanning && !options.isResumed) {
      return;
    }

    if (this._isScanCooldownActive()) {
      const remaining = this._formatRemainingCooldown(this._state.scanBlockUntil!);
      this._state.scanErrorMessage = `Intervalo de proteção ativo. Aguarde ${remaining} antes de iniciar um novo scan para proteger sua conta.`;
      this._update();
      return;
    }

    this._state.scanErrorMessage = null;
    const isResumed = options.isResumed || false;

    // Cache cooldown filter data before scan starts
    this._cooldownUsernames = await this._loadCooldownUsernames();

    this._state.isScanning = true;
    this._state.isPaused = options.status === 'paused';
    this._state.isScanCompleted = false;

    if (!isResumed) {
      this._state.scanProgress = 0;
      this._state.nonFollowers = [];
      this._state.selectedUsers.clear();
      this._state.isExpanded = true;
    } else {
      // Se for retomado, inicializa com os dados salvos (com filtro cooldown e deduplicação)
      let resumed = this._deduplicateUsers(
        (options.results || []).filter(user => !user.followsViewer())
      );
      if (this._cooldownUsernames && this._cooldownUsernames.size > 0) {
        resumed = resumed.filter(u => !this._cooldownUsernames!.has(u.getUsername()));
      }
      this._state.nonFollowers = resumed;
      this._state.isExpanded = true;
      // O progresso real será atualizado no primeiro callback do ScanService
    }

    this._update();

    this._scanService = new ScanService(
      this._apiClient,
      this._settings,
      (percentage: number, results: User[], cursor: string | null, processedCount: number, totalCount: number) =>
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
        let nonFollowers = this._deduplicateUsers(
          allFollowing.filter(user => !user.followsViewer())
        );
        nonFollowers = await this._applyFollowCooldownFilter(nonFollowers);
        this._state.nonFollowers = nonFollowers;
        this._state.isScanCompleted = true;
        this._state.isScanning = false;
        this._state.scanProgress = 100;
        console.log(`[FloatingPanelApp] Scan concluído. ${this._state.nonFollowers.length} não-seguidores encontrados.`);
        await this._clearScanPersistence();
        await this._saveScanToHistory(this._state.nonFollowers, allFollowing.length);
      }
    } catch (error) {
      console.error('[FloatingPanelApp] Erro no scan:', error);
      this._state.isScanning = false;
      this._state.isPaused = false;
      await this._clearScanPersistence();

      const errorMsg = error instanceof Error ? error.message : String(error);
      const lower = errorMsg.toLowerCase();
      const isSecurityOrLimit =
        lower.includes('checkpoint') ||
        lower.includes('verificação de segurança') ||
        lower.includes('challenge') ||
        lower.includes('bloqueio temporário') ||
        lower.includes('429');

      if (isSecurityOrLimit) {
        await this._setScanCooldown(SCAN_CHECKPOINT_COOLDOWN_MS, errorMsg);
      } else {
        this._state.scanErrorMessage = errorMsg;
      }
    }

    this._state.isPaused = false;
    this._update();
  }

  /**
   * Pausa/resume o scan
   */
  private _handleTogglePause(): void {
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
  private async _handleCancelScan(): Promise<void> {
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
  private _onScanProgress(percentage: number, results: User[], cursor: string | null, processedCount: number, totalCount: number): void {
    this._state.scanProgress = percentage;
    // Atualiza contagem parcial de não-seguidores (aplica cooldown filter com cache e deduplicação)
    let nonFollowers = this._deduplicateUsers(
      results.filter(user => !user.followsViewer())
    );
    if (this._cooldownUsernames && this._cooldownUsernames.size > 0) {
      nonFollowers = nonFollowers.filter(u => !this._cooldownUsernames!.has(u.getUsername()));
    }
    this._state.nonFollowers = nonFollowers;
    this._update();

    // Salva persistência (garante resultados únicos)
    this._currentScanCursor = cursor;
    this._currentScanResults = this._deduplicateUsers(results);
    this._currentScanProcessedCount = processedCount;
    this._currentScanTotalCount = totalCount;
    this._saveScanPersistence();
  }

  /**
   * Salva o estado atual do scan para persistência
   */
  private async _saveScanPersistence(): Promise<void> {
    if (!this._state.isScanning) {
      return;
    }

    const persistence: ScanPersistence = {
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
  private async _clearScanPersistence(): Promise<void> {
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
  private async _handleStartUnfollow(): Promise<void> {
    await this._loadUnfollowCooldown();
    if (this._isUnfollowCooldownActive()) {
      const remainingText = this._formatRemainingCooldown(this._state.unfollowBlockUntil!);
      alert(`Ação de unfollow bloqueada temporariamente para proteger sua conta contra bloqueios do Instagram.\n\nTempo restante de cooldown: ${remainingText}.`);
      return;
    }

    if (this._state.isUnfollowing || this._state.selectedUsers.size === 0) {
      console.warn('[FloatingPanelApp] Cannot start unfollow: already unfollowing or no users selected');
      return;
    }

    // Se estiver escaneando, para o scan antes de começar o unfollow
    if (this._state.isScanning) {
      await this._handleCancelScan();
    }

    // Filtra usuários que estão em selectedUsers E em nonFollowers
    // Filtra usuários selecionados que não estão na whitelist
    const usersToUnfollow = this._state.nonFollowers.filter(
      user => this._state.selectedUsers.has(user.getId()) && !this._state.whitelist.has(user.getId())
    );

    // Remove da seleção qualquer usuário na whitelist (proteção extra)
    this._state.whitelist.forEach(userId => {
      this._state.selectedUsers.delete(userId);
    });

    if (usersToUnfollow.length === 0) {
      console.warn('[FloatingPanelApp] No users to unfollow. Selected:', this._state.selectedUsers.size,
        'NonFollowers:', this._state.nonFollowers.length);
      return;
    }

    console.log(`[FloatingPanelApp] Starting unfollow for ${usersToUnfollow.length} users`);

    this._state.isUnfollowing = true;
    this._state.isUnfollowModalOpen = true;
    this._state.isExpanded = false;
    this._state.unfollowProgress = 0;
    this._state.unfollowLog = [];
    document.body.style.overflow = 'hidden';
    this._update();

    // Create and show the modal
    this._unfollowModal = new UnfollowProgressModal({
      onPause: () => { if (this._unfollowService) this._unfollowService.pause(); },
      onResume: () => { if (this._unfollowService) this._unfollowService.resume(); },
      onCancel: () => this._handleCancelUnfollow(),
      onClose: () => {
        document.body.style.overflow = '';
        this._unfollowModal = null;
        this._state.isUnfollowModalOpen = false;
        if (this._floatingPanel) {
          this._update();
        }
      },
      totalCount: usersToUnfollow.length,
      timeBetweenUnfollows: this._settings.getTimeBetweenUnfollows(),
      timeAfterFive: this._settings.getTimeToWaitAfterFiveUnfollows(),
      unfollowsPerCycle: this._settings.getUnfollowsPerCycle()
    });
    this._unfollowModal.show();

    this._unfollowService = new UnfollowService(
      this._apiClient,
      this._settings,
      (percentage: number, log: UnfollowLogEntry[], uiState?: UnfollowProgressUiState) =>
        this._onUnfollowProgress(percentage, log, uiState)
    );

    try {
      const log = await this._unfollowService.execute(usersToUnfollow);
      this._state.unfollowLog = log;
      this._state.isUnfollowing = false;
      this._state.unfollowProgress = 100;

      // Remove usuários que foram unfollowed da lista com sucesso
      const unfollowedIds = new Set(log.filter(e => e.wasSuccessful()).map(e => e.getUser().getId()));
      if (unfollowedIds.size > 0) {
        const removedCount = this._state.nonFollowers.filter(user => unfollowedIds.has(user.getId())).length;
        this._state.nonFollowers = this._state.nonFollowers.filter(
          user => !unfollowedIds.has(user.getId())
        );
        this._state.selectedUsers.clear();
        console.log(`[FloatingPanelApp] ${removedCount} usuários removidos da lista de não-seguidores.`);
      }

      // Verificar se houve alguma falha
      const hasFailures = log.some(entry => entry.wasFailure());

      if (hasFailures) {
        // Houve falhas - parar serviço, limpar interface e mostrar alerta
        this._state.isUnfollowing = false;
        // Parar o serviço explícitamente caso ainda esteja rodando
        if (this._unfollowService) {
          this._unfollowService.stop();
        }
        document.body.style.overflow = '';
        this._state.isUnfollowModalOpen = false;
        if (this._unfollowModal) {
          this._unfollowModal.destroy();
          this._unfollowModal = null;
        }

        // Obter a mensagem de erro da primeira falha para mostrar ao usuário
        const firstFailure = log.find(entry => entry.wasFailure());
        const errorMsg = firstFailure ? firstFailure.getErrorMessage() : 'Erro desconhecido';

        if (this._is400Error(errorMsg)) {
          await this._setUnfollowCooldown();
        }

        alert(this._getUnfollowErrorMessage(errorMsg));
        this._update();
        return;
      }

      // Todas as ações foram bem-sucedidas
      this._state.isUnfollowModalOpen = true;
      // Show completion in modal
      if (this._unfollowModal) {
        this._unfollowModal.complete(log);
      }

      const successCount = log.filter(e => e.wasSuccessful()).length;
      console.log(`[FloatingPanelApp] Unfollow concluído. ${successCount}/${usersToUnfollow.length} unfollows bem-sucedidos.`);
    } catch (error) {
      console.error('[FloatingPanelApp] Erro no unfollow:', error);
      this._state.isUnfollowing = false;
      this._state.isUnfollowModalOpen = false;
      // Parar o serviço explícitamente caso ainda esteja rodando
      if (this._unfollowService) {
        this._unfollowService.stop();
      }
      document.body.style.overflow = '';
      if (this._unfollowModal) {
        this._unfollowModal.destroy();
        this._unfollowModal = null;
      }
      // Informar o usuário sobre o erro
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      if (this._is400Error(errorMsg)) {
        await this._setUnfollowCooldown();
      }
      alert(this._getUnfollowErrorMessage(errorMsg));
    }

    this._update();
  }

  private _is400Error(errorMsg?: string | null): boolean {
    if (!errorMsg) return false;
    const lower = errorMsg.toLowerCase();
    return lower.includes('400') || lower.includes('próximo dia') || lower.includes('bad request');
  }

  private _getUnfollowErrorMessage(errorMsg?: string | null): string {
    if (this._is400Error(errorMsg)) {
      return 'Não foi possível concluir o unfollow: O Instagram retornou o erro 400 (limite temporário atingido).\n\nPara evitar o bloqueio da sua conta, um cooldown de 24h foi ativado. Você poderá deixar de seguir novamente amanhã.';
    }
    return `Não foi possível concluir o unfollow: ${errorMsg || 'Erro desconhecido'}\n\nVerifique suas configurações, especialmente o intervalo entre unfollows e o limite de ações por ciclo, se você as alterou previamente.`;
  }

  /**
   * Carrega o timestamp de cooldown de unfollow
   */
  private async _loadUnfollowCooldown(): Promise<void> {
    try {
      const stored = await this._localStorage.get(STORAGE_KEYS.UNFOLLOW_BLOCK_UNTIL);
      const blockUntil = typeof stored === 'number' ? stored : parseInt(stored, 10);
      if (blockUntil && blockUntil > Date.now()) {
        this._state.unfollowBlockUntil = blockUntil;
        return;
      }
      if (stored) {
        await this._localStorage.remove(STORAGE_KEYS.UNFOLLOW_BLOCK_UNTIL);
      }
      this._state.unfollowBlockUntil = null;
    } catch (e) {
      console.error('[FloatingPanelApp] Erro ao carregar cooldown de unfollow:', e);
      this._state.unfollowBlockUntil = null;
    }
  }

  /**
   * Define cooldown de 24 horas para unfollow após erro 400
   */
  private async _setUnfollowCooldown(): Promise<void> {
    const blockUntil = Date.now() + UNFOLLOW_COOLDOWN_MS;
    this._state.unfollowBlockUntil = blockUntil;
    try {
      await this._localStorage.set(STORAGE_KEYS.UNFOLLOW_BLOCK_UNTIL, blockUntil);
      console.log(`[FloatingPanelApp] Cooldown de unfollow ativado até ${new Date(blockUntil).toLocaleString()}`);
    } catch (e) {
      console.error('[FloatingPanelApp] Erro ao salvar cooldown de unfollow:', e);
    }
  }

  /**
   * Verifica se o cooldown de unfollow está ativo
   */
  private _isUnfollowCooldownActive(): boolean {
    if (!this._state.unfollowBlockUntil) {
      return false;
    }
    if (Date.now() >= this._state.unfollowBlockUntil) {
      this._state.unfollowBlockUntil = null;
      this._localStorage.remove(STORAGE_KEYS.UNFOLLOW_BLOCK_UNTIL).catch(() => {});
      return false;
    }
    return true;
  }

  /**
   * Formata tempo restante de cooldown
   */
  private _formatRemainingCooldown(targetMs: number): string {
    const remainingMs = Math.max(0, targetMs - Date.now());
    const totalMinutes = Math.ceil(remainingMs / (60 * 1000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  /**
   * Carrega o timestamp de cooldown de scan/checkpoint
   */
  private async _loadScanCooldown(): Promise<void> {
    try {
      const stored = await this._localStorage.get(STORAGE_KEYS.SCAN_BLOCK_UNTIL);
      const blockUntil = typeof stored === 'number' ? stored : parseInt(stored, 10);
      if (blockUntil && blockUntil > Date.now()) {
        this._state.scanBlockUntil = blockUntil;
        const lastError = await this._localStorage.get(STORAGE_KEYS.SCAN_LAST_ERROR);
        this._state.scanErrorMessage = typeof lastError === 'string' ? lastError : null;
        this._startCooldownTimer();
        return;
      }
      if (stored) {
        await this._localStorage.remove(STORAGE_KEYS.SCAN_BLOCK_UNTIL);
        await this._localStorage.remove(STORAGE_KEYS.SCAN_LAST_ERROR);
      }
      this._state.scanBlockUntil = null;
      this._state.scanErrorMessage = null;
    } catch (e) {
      console.error('[FloatingPanelApp] Erro ao carregar cooldown de scan:', e);
      this._state.scanBlockUntil = null;
      this._state.scanErrorMessage = null;
    }
  }

  /**
   * Define cooldown de scan (ex.: 10 minutos após checkpoint)
   */
  private async _setScanCooldown(durationMs: number = SCAN_CHECKPOINT_COOLDOWN_MS, errorMsg?: string): Promise<void> {
    const blockUntil = Date.now() + durationMs;
    this._state.scanBlockUntil = blockUntil;
    this._state.scanErrorMessage = errorMsg || 'O Instagram solicitou uma verificação de segurança (checkpoint). Por favor, abra o Instagram e complete a confirmação.';
    try {
      await this._localStorage.set(STORAGE_KEYS.SCAN_BLOCK_UNTIL, blockUntil);
      await this._localStorage.set(STORAGE_KEYS.SCAN_LAST_ERROR, this._state.scanErrorMessage);
      console.log(`[FloatingPanelApp] Cooldown de scan ativado até ${new Date(blockUntil).toLocaleString()}`);
    } catch (e) {
      console.error('[FloatingPanelApp] Erro ao salvar cooldown de scan:', e);
    }
    this._startCooldownTimer();
  }

  /**
   * Verifica se o cooldown de scan está ativo
   */
  private _isScanCooldownActive(): boolean {
    if (!this._state.scanBlockUntil) {
      return false;
    }
    if (Date.now() >= this._state.scanBlockUntil) {
      this._state.scanBlockUntil = null;
      this._localStorage.remove(STORAGE_KEYS.SCAN_BLOCK_UNTIL).catch(() => {});
      this._localStorage.remove(STORAGE_KEYS.SCAN_LAST_ERROR).catch(() => {});
      return false;
    }
    return true;
  }

  /**
   * Inicia timer periódico para contagem regressiva de cooldowns ativos
   */
  private _startCooldownTimer(): void {
    if (this._cooldownTimer) {
      return;
    }
    this._cooldownTimer = window.setInterval(() => {
      const isScanActive = this._isScanCooldownActive();
      const isUnfollowActive = this._isUnfollowCooldownActive();

      if (isScanActive || isUnfollowActive) {
        this._update();
      } else {
        this._stopCooldownTimer();
        this._update();
      }
    }, 5000);
  }

  /**
   * Para timer periódico de cooldown
   */
  private _stopCooldownTimer(): void {
    if (this._cooldownTimer) {
      clearInterval(this._cooldownTimer);
      this._cooldownTimer = null;
    }
  }

  /**
   * Descarta mensagem de erro quando cooldown não estiver ativo
   */
  private _onDismissScanError(): void {
    if (!this._isScanCooldownActive()) {
      this._state.scanErrorMessage = null;
      this._localStorage.remove(STORAGE_KEYS.SCAN_LAST_ERROR).catch(() => {});
      this._update();
    }
  }

  /**
   * Cancela o processo de unfollow
   */
  private _handleCancelUnfollow(): void {
    if (this._unfollowService) {
      this._unfollowService.stop();
    }
    this._state.isUnfollowing = false;
    this._state.isUnfollowModalOpen = false;
    document.body.style.overflow = '';
    if (this._unfollowModal) {
      this._unfollowModal.destroy();
      this._unfollowModal = null;
    }
    this._update();
    console.log('[FloatingPanelApp] Unfollow cancelado.');
  }

  /**
   * Callback de progresso do unfollow
   */
  private _onUnfollowProgress(
    percentage: number,
    log: UnfollowLogEntry[],
    uiState?: UnfollowProgressUiState
  ): void {
    this._state.unfollowProgress = percentage;
    this._state.unfollowLog = log;
    if (this._unfollowModal) {
      this._unfollowModal.update(percentage, log, uiState);
    }
    this._update();
  }

  /**
   * Toggle expansão do painel
   */
  private async _handleToggle(): Promise<void> {
    this._state.isExpanded = !this._state.isExpanded;
    if (this._state.isExpanded) {
      await this._loadUnfollowCooldown();
    }
    this._update();
  }

  /**
   * Toggle seleção de usuário
   */
  private _handleToggleUser(userId: string): void {
    if (this._state.selectedUsers.has(userId)) {
      this._state.selectedUsers.delete(userId);
    } else {
      this._state.selectedUsers.add(userId);
    }

    // Atualiza visual do item selecionado
    const userItem = this._container?.querySelector(`[data-user-id="${userId}"]`);
    if (userItem) {
      userItem.classList.toggle('iu-selected');
    }

    // Atualiza contador e botão
    this._floatingPanel!.update(this._getProps());
  }

  /**
   * Seleciona/deseleciona todos os usuários
   */
  private _handleToggleAll(selectAll: boolean, userIds?: string[]): void {
    const targetIds = userIds || this._state.nonFollowers.map(u => u.getId());

    if (selectAll) {
      targetIds.forEach(id => {
        this._state.selectedUsers.add(id);
      });
    } else {
      targetIds.forEach(id => {
        this._state.selectedUsers.delete(id);
      });
    }

    this._state.selectedUsers = new Set(this._state.selectedUsers);
    this._update();
  }

  /**
   * Toggle whitelist de um usuário
   */
  private _handleToggleWhitelist(userId: string): void {
    if (this._state.whitelist.has(userId)) {
      this._state.whitelist.delete(userId);
    } else {
      this._state.whitelist.add(userId);
      this._state.selectedUsers.delete(userId);
    }
    // Create new Set so FloatingPanel detects the change by reference
    this._state.whitelist = new Set(this._state.whitelist);
    this._saveWhitelist();
    this._update();
  }

  /**
   * Muda aba ativa
   */
  private _handleChangeTab(tab: string): void {
    this._state.activeTab = tab;
    this._state.searchQuery = '';
    this._update();
  }

  /**
   * Atualiza pesquisa
   */
  private _handleSearch(query: string): void {
    this._state.searchQuery = query;
    this._update();
  }

  /**
   * Abre a página de histórico completo
   * Usa bridge de comunicação pois o app roda no contexto da página, não do content script
   */
  private async _handleOpenHistory(): Promise<void> {
    console.log('[FloatingPanelApp] Abrindo página de histórico...');
    window.postMessage({
      type: MESSAGE_TYPES.GHOSTGRAM_TO_BACKGROUND,
      action: MESSAGE_ACTIONS.OPEN_HISTORY
    }, '*');
  }

  /**
   * Carrega histórico de scans anteriores
   */
  private async _loadScanHistory(): Promise<void> {
    try {
      const history = await this._localStorage.get(STORAGE_KEYS.SCAN_HISTORY);
      this._state.scanHistory = history || [];
      console.log('[FloatingPanelApp] Histórico de scans carregado:', this._state.scanHistory.length);
    } catch (e) {
      console.error('[FloatingPanelApp] Erro ao carregar histórico de scans:', e);
    }
  }

  /**
   * Carrega os usernames em cooldown (seguidos recentemente)
   */
  private async _loadCooldownUsernames(): Promise<Set<string>> {
    try {
      const stored = await this._localStorage.get(STORAGE_KEYS.FOLLOW_COOLDOWN_HOURS);
      const cooldownHours = parseInt(stored) || 0;
      if (cooldownHours <= 0) return new Set();

      const history: ActionHistoryEntry[] = (await this._localStorage.get(STORAGE_KEYS.ACTIONS_HISTORY)) || [];
      const cutoff = Date.now() - (cooldownHours * 60 * 60 * 1000);
      const recentFollows = new Set<string>();
      for (const entry of history) {
        if ((entry.actionType === ACTION_TYPES.FOLLOW || entry.actionType === ACTION_TYPES.RE_FOLLOW_ACCEPTED) &&
            entry.timestamp > cutoff) {
          recentFollows.add(entry.username);
        }
      }
      if (recentFollows.size > 0) {
        console.log(`[FloatingPanelApp] Cooldown: ${recentFollows.size} perfis em cooldown (seguidos nas últimas ${cooldownHours}h)`);
      }
      return recentFollows;
    } catch (e) {
      console.error('[FloatingPanelApp] Erro ao carregar cooldown:', e);
      return new Set();
    }
  }

  /**
   * Remove usuários duplicados garantindo unicidade por ID
   */
  private _deduplicateUsers(users: User[]): User[] {
    const seen = new Set<string>();
    return users.filter(user => {
      const id = user.getId() || user.getUsername();
      if (!id || seen.has(id)) {
        return false;
      }
      seen.add(id);
      return true;
    });
  }

  /**
   * Filtra usuários que foram seguidos recentemente (dentro do período de cooldown)
   */
  private async _applyFollowCooldownFilter(nonFollowers: User[]): Promise<User[]> {
    const cooldownSet = this._cooldownUsernames || await this._loadCooldownUsernames();
    if (cooldownSet.size === 0) return nonFollowers;
    return nonFollowers.filter(u => !cooldownSet.has(u.getUsername()));
  }

  /**
   * Salva scan concluído no histórico
   */
  private async _saveScanToHistory(nonFollowers: User[], totalScanned: number): Promise<void> {
    try {
      const history: ScanRecord[] = (await this._localStorage.get(STORAGE_KEYS.SCAN_HISTORY)) || [];
      const scanRecord: ScanRecord = {
        id: Date.now(),
        date: new Date().toISOString(),
        nonFollowersCount: nonFollowers.length,
        nonFollowers: nonFollowers.map(u => u.toObject()),
        totalScanned: totalScanned
      };
      history.unshift(scanRecord);
      // Mantém apenas os últimos 10 scans
      const trimmed = history.slice(0, 10);
      await this._localStorage.set(STORAGE_KEYS.SCAN_HISTORY, trimmed);
      this._state.scanHistory = trimmed;
      console.log('[FloatingPanelApp] Scan salvo no histórico');
    } catch (e) {
      console.error('[FloatingPanelApp] Erro ao salvar scan no histórico:', e);
    }
  }

  /**
   * Carrega um scan anterior sem re-escanear
   */
  private async _handleLoadPreviousScan(scanId: number): Promise<void> {
    const scan = this._state.scanHistory.find(s => s.id === scanId);
    if (!scan) return;

    try {
      let nonFollowers = this._deduplicateUsers(
        scan.nonFollowers.map(u => User.fromObject(u))
      );
      this._cooldownUsernames = await this._loadCooldownUsernames();
      nonFollowers = await this._applyFollowCooldownFilter(nonFollowers);
      this._state.nonFollowers = nonFollowers;
      this._state.isScanCompleted = true;
      this._state.isScanning = false;
      this._state.isPaused = false;
      this._state.scanProgress = 100;
      this._state.selectedUsers.clear();
      this._state.isExpanded = true;
      this._update();
      console.log(`[FloatingPanelApp] Scan anterior carregado: ${nonFollowers.length} não-seguidores`);
    } catch (e) {
      console.error('[FloatingPanelApp] Erro ao carregar scan anterior:', e);
    }
  }

  /**
   * Retorna props para o componente
   */
  private _getProps(): any {
    return {
      isExpanded: this._state.isExpanded,
      isScanning: this._state.isScanning,
      isPaused: this._state.isPaused,
      isScanCompleted: this._state.isScanCompleted,
      isUnfollowing: this._state.isUnfollowing,
      isUnfollowModalOpen: this._state.isUnfollowModalOpen,
      scanProgress: this._state.scanProgress,
      unfollowProgress: this._state.unfollowProgress,
      nonFollowers: this._state.nonFollowers,
      selectedUsers: new Set(this._state.selectedUsers),
      whitelist: this._state.whitelist,
      activeTab: this._state.activeTab,
      searchQuery: this._state.searchQuery,
      unfollowLog: this._state.unfollowLog,
      scanHistory: this._state.scanHistory,
      unfollowBlockUntil: this._state.unfollowBlockUntil,
      scanBlockUntil: this._state.scanBlockUntil,
      scanErrorMessage: this._state.scanErrorMessage,
      onDismissScanError: () => this._onDismissScanError(),
      onToggle: () => this._handleToggle(),
      onStartScan: () => this._handleStartScan(),
      onTogglePause: () => this._handleTogglePause(),
      onCancelScan: () => this._handleCancelScan(),
      onStartUnfollow: () => this._handleStartUnfollow(),
      onToggleUser: (userId: string) => this._handleToggleUser(userId),
      onToggleAll: (selectAll: boolean) => this._handleToggleAll(selectAll),
      onToggleWhitelist: (userId: string) => this._handleToggleWhitelist(userId),
      onChangeTab: (tab: string) => this._handleChangeTab(tab),
      onSearch: (query: string) => this._handleSearch(query),
      onOpenHistory: () => this._handleOpenHistory(),
      onLoadPreviousScan: (scanId: number) => this._handleLoadPreviousScan(scanId)
    };
  }

  /**
   * Renderiza o painel pela primeira vez
   */
  private _render(): void {
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
    this._applyStealthMode();
  }

  /**
   * Atualiza o painel de forma incremental
   */
  private _update(): void {
    if (!this._floatingPanel || this._isFirstRender) {
      this._render();
      return;
    }

    this._floatingPanel.update(this._getProps());
  }

  /**
   * Renderiza o painel com re-render completo
   */
  private _renderPreservingPosition(): void {
    if (!this._container) {
      return;
    }

    // Limpa o container
    this._container.innerHTML = '';

    // Cria o painel
    this._floatingPanel = new FloatingPanel();
    this._container.appendChild(this._floatingPanel.render(this._getProps()));
    this._isFirstRender = false;

    this._applyStealthMode();
  }

  /**
   * Destrói a aplicação
   */
  destroy(): void {
    if (this._scanService) {
      this._scanService.stop();
    }
    if (this._unfollowService) {
      this._unfollowService.stop();
    }
    if (this._unfollowModal) {
      this._unfollowModal.destroy();
      this._unfollowModal = null;
    }
    if (this._container) {
      this._container.innerHTML = '';
    }
  }
}
