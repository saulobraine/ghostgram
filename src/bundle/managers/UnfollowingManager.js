// UnfollowingManager - Manages unfollowing state and operations
import { ScanState } from '../domain/ScanState.js';
import { UnfollowService } from '../services/UnfollowService.js';
import { InstagramApiClient } from '../services/InstagramApiClient.js';
import { Settings } from '../../domain/Settings.js';
import { SyncStorageAdapter } from '../../storage/SyncStorageAdapter.js';
import { StateManager } from '../utils/StateManager.js';

export class UnfollowingManager {
  constructor() {
    this._stateManager = new StateManager({
      status: ScanState.createInitial(),
      percentage: 0,
      unfollowLog: [],
      searchTerm: '',
      filter: { showSucceeded: true, showFailed: true }
    });
    this._isPaused = false;
    this._unfollowService = null;
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
   * Check if unfollowing is paused
   * @returns {boolean}
   */
  isPaused() {
    return this._isPaused;
  }

  /**
   * Handle progress updates
   * @param {number} percentage - Progress percentage
   * @param {Array} log - Unfollow log entries
   * @private
   */
  _handleProgress = (percentage, log) => {
    this._stateManager.setState({
      percentage,
      unfollowLog: log
    });
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
   * Execute unfollowing for given users
   * @param {Array} users - Users to unfollow
   */
  async execute(users) {
    const settings = await this._loadSettings();
    const apiClient = new InstagramApiClient();
    const unfollowService = new UnfollowService(apiClient, settings, this._handleProgress);
    this._unfollowService = unfollowService;

    this._stateManager.setState({
      status: ScanState.createUnfollowing(),
      percentage: 0,
      unfollowLog: []
    });

    this._isPaused = false;

    try {
      const log = await unfollowService.execute(users);
      this._stateManager.setState({
        status: ScanState.createInitial(),
        percentage: 100,
        unfollowLog: log
      });
    } catch (error) {
      console.error('Unfollow error:', error);
      this._stateManager.setState({
        status: ScanState.createInitial()
      });
    }
  }

  /**
   * Pause unfollowing
   */
  pause() {
    if (this._unfollowService) {
      this._unfollowService.pause();
      this._isPaused = true;
    }
  }

  /**
   * Resume unfollowing
   */
  resume() {
    if (this._unfollowService) {
      this._unfollowService.resume();
      this._isPaused = false;
    }
  }

  /**
   * Stop unfollowing
   */
  stop() {
    if (this._unfollowService) {
      this._unfollowService.stop();
      this._isPaused = false;
      this._stateManager.setState({
        status: ScanState.createInitial()
      });
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
