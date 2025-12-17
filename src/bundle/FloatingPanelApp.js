// FloatingPanelApp - Minimal app that only renders FloatingPanel (Vanilla JS)
import { FloatingPanel } from './components/FloatingPanel.js';
import { FloatingPanelState } from './managers/FloatingPanelState.js';
import { ScanningManager } from './managers/ScanningManager.js';
import { UnfollowingManager } from './managers/UnfollowingManager.js';
import { LocalStorageAdapter } from '../storage/LocalStorageAdapter.js';
import { ExtensionState } from '../domain/ExtensionState.js';
import { STORAGE_KEYS } from '../constants/Constants.js';
import { UserFilterService } from './services/UserFilterService.js';
import { Filter } from './domain/Filter.js';

export class FloatingPanelApp {
  constructor() {
    this._scanning = new ScanningManager();
    this._unfollowing = new UnfollowingManager();
    this._floatingPanelState = new FloatingPanelState(false);
    this._extensionEnabled = true;
    this._floatingPanel = null;
    this._container = null;
    this._unsubscribers = [];
    this._setupStateListeners();
    this._setupStorageListener();
    this._loadExtensionState();
  }

  /**
   * Setup state change listeners
   * @private
   */
  _setupStateListeners() {
    // Listen to floating panel state changes
    const unsubscribePanel = this._floatingPanelState.subscribe(() => {
      this._render();
    });
    this._unsubscribers.push(unsubscribePanel);

    // Listen to scanning state changes
    const unsubscribeScanning = this._scanning.subscribe(() => {
      this._render();
    });
    this._unsubscribers.push(unsubscribeScanning);

    // Listen to unfollowing state changes
    const unsubscribeUnfollowing = this._unfollowing.subscribe(() => {
      this._render();
    });
    this._unsubscribers.push(unsubscribeUnfollowing);
  }

  /**
   * Setup storage change listener
   * @private
   */
  _setupStorageListener() {
    const handleStorageChange = (changes, areaName) => {
      if (areaName === 'local' && changes[STORAGE_KEYS.ENABLED]) {
        const state = ExtensionState.fromStorageValue(changes[STORAGE_KEYS.ENABLED].newValue);
        this._extensionEnabled = state.isEnabled();
        this._render();
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    this._storageListener = handleStorageChange;
  }

  /**
   * Load extension state from storage
   * @private
   */
  async _loadExtensionState() {
    try {
      const adapter = new LocalStorageAdapter();
      const value = await adapter.get(STORAGE_KEYS.ENABLED);
      const state = ExtensionState.fromStorageValue(value);
      this._extensionEnabled = state.isEnabled();
      this._render();
    } catch (error) {
      console.error('[FloatingPanelApp] Error loading extension state:', error);
    }
  }

  /**
   * Handle start scan action
   * @private
   */
  async _handleStartScan() {
    // Double-check to prevent multiple scans
    const scanningState = this._scanning.getState();
    if (scanningState.status?.isScanning?.()) {
      console.log('[FloatingPanelApp] Scan já está em andamento');
      return;
    }

    try {
      await this._scanning.start();
    } catch (error) {
      console.error('[FloatingPanelApp] Erro ao iniciar scan:', error);
    }
  }

  /**
   * Get filtered non-followers (users who don't follow back)
   * @private
   * @returns {Array} Filtered users
   */
  _getFilteredNonFollowers() {
    const scanningState = this._scanning.getState();
    const allResults = scanningState.results || [];

    if (allResults.length === 0) {
      return [];
    }

    // Use default filter which shows only non-followers
    const defaultFilter = Filter.createDefault();
    const filterService = new UserFilterService();

    // Filter to show only non-followers (no whitelist, no search term, non_whitelisted tab)
    return filterService.filter(
      allResults,
      defaultFilter,
      '', // no search term
      [], // no whitelist
      'non_whitelisted' // default tab
    );
  }

  /**
   * Handle copy list action
   * @private
   */
  _handleCopyList() {
    const filteredUsers = this._getFilteredNonFollowers();
    if (filteredUsers.length === 0) {
      alert('Nenhum usuário encontrado');
      return;
    }
    const list = filteredUsers.map(u => u.getUsername ? u.getUsername() : (u.username || u.id)).join('\n');
    navigator.clipboard.writeText(list).then(() => {
      alert('Lista copiada!');
    });
  }

  /**
   * Render the floating panel
   * @private
   */
  _render() {
    if (!this._container) {
      return;
    }

    const panelState = this._floatingPanelState.getState();
    const scanningState = this._scanning.getState();
    const unfollowingState = this._unfollowing.getState();
    const selectedResultsCount = scanningState.selectedResults?.length || 0;

    // Get filtered non-followers for display
    const filteredNonFollowers = this._getFilteredNonFollowers();

    // Create modified scanning state with filtered results for display
    const filteredScanningState = {
      ...scanningState,
      results: filteredNonFollowers
    };

    if (!this._floatingPanel) {
      // Create new panel
      this._floatingPanel = new FloatingPanel({
        isExpanded: panelState.isExpanded,
        onToggle: () => this._floatingPanelState.toggle(),
        scanningState: filteredScanningState,
        unfollowingState: unfollowingState,
        extensionEnabled: this._extensionEnabled,
        onStartScan: () => this._handleStartScan(),
        onCopyList: () => this._handleCopyList(),
        selectedResultsCount: selectedResultsCount,
        onPauseScanning: () => this._scanning.pause(),
        onResumeScanning: () => this._scanning.resume(),
        isScanningPaused: this._scanning.isPaused(),
        onPauseUnfollowing: () => this._unfollowing.pause(),
        onResumeUnfollowing: () => this._unfollowing.resume(),
        isUnfollowingPaused: this._unfollowing.isPaused()
      });

      const panelElement = this._floatingPanel.render();
      if (panelElement) {
        this._container.appendChild(panelElement);
      }
    } else {
      // Update existing panel
      this._floatingPanel.update({
        isExpanded: panelState.isExpanded,
        scanningState: filteredScanningState,
        unfollowingState: unfollowingState,
        extensionEnabled: this._extensionEnabled,
        selectedResultsCount: selectedResultsCount,
        onPauseScanning: () => this._scanning.pause(),
        onResumeScanning: () => this._scanning.resume(),
        isScanningPaused: this._scanning.isPaused(),
        onPauseUnfollowing: () => this._unfollowing.pause(),
        onResumeUnfollowing: () => this._unfollowing.resume(),
        isUnfollowingPaused: this._unfollowing.isPaused()
      });
    }
  }

  /**
   * Initialize and mount the app
   * @param {HTMLElement} container - Container element to mount to
   */
  init(container) {
    this._container = container;
    // Clear container before rendering
    if (container) {
      container.innerHTML = '';
    }
    this._render();
  }

  /**
   * Handle messages from content script
   * @param {Object} message - Message object
   */
  handleMessage(message) {
    if (message.type === 'INSTAGRAM_UNFOLLOWERS_START_SCAN') {
      // Prevent multiple simultaneous scans
      const scanningState = this._scanning.getState();
      if (scanningState.status?.isScanning?.()) {
        console.log('[FloatingPanelApp] Scan já está em andamento, ignorando nova solicitação');
        return;
      }
      this._handleStartScan();
    }
  }

  /**
   * Cleanup and destroy the app
   */
  destroy() {
    // Unsubscribe from all state changes
    this._unsubscribers.forEach(unsubscribe => unsubscribe());
    this._unsubscribers = [];

    // Remove storage listener
    if (this._storageListener) {
      chrome.storage.onChanged.removeListener(this._storageListener);
      this._storageListener = null;
    }

    // Destroy managers
    this._floatingPanelState.destroy();

    // Destroy floating panel
    if (this._floatingPanel) {
      this._floatingPanel.destroy();
      this._floatingPanel = null;
    }

    // Clear container
    if (this._container) {
      this._container.innerHTML = '';
      this._container = null;
    }
  }
}
