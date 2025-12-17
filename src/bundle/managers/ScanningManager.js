// ScanningManager - Manages scanning state and operations
import { ScanState } from '../domain/ScanState.js';
import { ScanService } from '../services/ScanService.js';
import { InstagramApiClient } from '../services/InstagramApiClient.js';
import { Settings } from '../../domain/Settings.js';
import { LocalStorageAdapter } from '../../storage/LocalStorageAdapter.js';
import { SyncStorageAdapter } from '../../storage/SyncStorageAdapter.js';
import { StateManager } from '../utils/StateManager.js';
import { STORAGE_KEYS } from '../../constants/Constants.js';
import { User } from '../domain/User.js';

export class ScanningManager {
  constructor() {
    this._stateManager = new StateManager({
      status: ScanState.createInitial(),
      results: [],
      percentage: 0,
      page: 1,
      searchTerm: '',
      currentTab: 'non_whitelisted',
      selectedResults: []
    });
    this._isPaused = false;
    this._scanService = null;
    this._storageAdapter = new LocalStorageAdapter();
    // Load saved state asynchronously (don't await in constructor)
    this._loadSavedState().catch(error => {
      console.error('[ScanningManager] Error in _loadSavedState:', error);
    });
  }

  /**
   * Get current state
   * @returns {Object} Current state
   */
  getState() {
    return this._stateManager.getState();
  }

  /**
   * Subscribe to state changes
   * @param {Function} listener - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    return this._stateManager.subscribe(listener);
  }

  /**
   * Check if scanning is paused
   * @returns {boolean}
   */
  isPaused() {
    return this._isPaused || this._stateManager.getState().status.isPaused();
  }

  /**
   * Load saved state from storage
   * @private
   */
  async _loadSavedState() {
    try {
      const savedState = await this._storageAdapter.get(STORAGE_KEYS.SCAN_STATE);
      if (savedState && (savedState.status === 'paused' || savedState.status === 'completed')) {
        const results = (savedState.results || []).map(userObj => User.fromObject(userObj));
        this._stateManager.setState({
          status: ScanState.fromString(savedState.status),
          results,
          percentage: savedState.percentage || 0
        });
        if (savedState.status === 'paused') {
          this._isPaused = true;
        }
      }
    } catch (error) {
      console.error('[ScanningManager] Error loading saved scan state:', error);
    }
  }

  /**
   * Save current state to storage
   * @private
   */
  async _saveState() {
    try {
      const currentState = this._stateManager.getState();
      const stateToSave = {
        status: currentState.status.toString(),
        results: currentState.results.map(user => user.toObject()),
        percentage: currentState.percentage,
        timestamp: Date.now()
      };
      await this._storageAdapter.set(STORAGE_KEYS.SCAN_STATE, stateToSave);
    } catch (error) {
      console.error('[ScanningManager] Error saving scan state:', error);
    }
  }

  /**
   * Clear saved state from storage
   * @private
   */
  async _clearSavedState() {
    try {
      await this._storageAdapter.remove(STORAGE_KEYS.SCAN_STATE);
    } catch (error) {
      console.error('[ScanningManager] Error clearing saved scan state:', error);
    }
  }

  /**
   * Handle progress updates
   * @param {number} percentage - Progress percentage
   * @param {Array} results - Scan results
   * @private
   */
  _handleProgress = (percentage, results) => {
    this._stateManager.setState({
      percentage,
      results
    });
    // Save progress if scanning
    const currentState = this._stateManager.getState();
    if (currentState.status.isScanning()) {
      this._saveState();
    }
  };

  /**
   * Load settings from storage
   * @returns {Promise<Settings>}
   * @private
   */
  async _loadSettings() {
    const adapter = new SyncStorageAdapter();
    const data = await adapter.get('settings');

    if (!data) {
      return Settings.createDefault();
    }

    return Settings.fromObject(data);
  }

  /**
   * Start scanning
   */
  async start() {
    const settings = await this._loadSettings();
    const apiClient = new InstagramApiClient();
    const scanService = new ScanService(apiClient, settings, this._handleProgress);
    this._scanService = scanService;

    this._stateManager.setState({
      status: ScanState.createScanning(),
      percentage: 0,
      results: [],
      selectedResults: []
    });

    this._isPaused = false;

    try {
      const results = await scanService.start();
      this._stateManager.setState({
        status: ScanState.createCompleted(),
        results,
        percentage: 100
      });
      this._saveState();
    } catch (error) {
      console.error('Scan error:', error);
      this._stateManager.setState({
        status: ScanState.createInitial()
      });
      this._clearSavedState();
    }
  }

  /**
   * Pause scanning
   */
  pause() {
    if (this._scanService) {
      this._scanService.pause();
      this._isPaused = true;
      this._stateManager.setState({
        status: ScanState.createPaused()
      });
      this._saveState();
    }
  }

  /**
   * Resume scanning
   */
  resume() {
    if (this._scanService) {
      this._scanService.resume();
      this._isPaused = false;
      this._stateManager.setState({
        status: ScanState.createScanning()
      });
      this._saveState();
    }
  }

  /**
   * Stop scanning
   */
  stop() {
    if (this._scanService) {
      this._scanService.stop();
      this._isPaused = false;
      this._stateManager.setState({
        status: ScanState.createInitial()
      });
      this._clearSavedState();
    }
  }

  /**
   * Update state directly (for external updates)
   * @param {Object} updates - Partial state updates
   */
  setState(updates) {
    this._stateManager.setState(updates);
  }
}
