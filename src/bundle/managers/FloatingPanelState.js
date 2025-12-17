// FloatingPanelState - Manages floating panel state with persistence
import { SyncStorageAdapter } from '../../storage/SyncStorageAdapter.js';
import { STORAGE_KEYS } from '../../constants/Constants.js';
import { StateManager } from '../utils/StateManager.js';

export class FloatingPanelState {
  constructor(defaultExpanded = false) {
    this._stateManager = new StateManager({
      isExpanded: defaultExpanded,
      isLoaded: false
    });
    this._storage = new SyncStorageAdapter();
    this._debounceTimer = null;
    this._defaultExpanded = defaultExpanded;
    this._loadInitialState();
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
   * Load initial state from storage
   * @private
   */
  async _loadInitialState() {
    try {
      const value = await this._storage.get(STORAGE_KEYS.FLOATING_PANEL_EXPANDED);
      const savedState = value !== null ? Boolean(value) : this._defaultExpanded;
      this._stateManager.setState({
        isExpanded: savedState,
        isLoaded: true
      });
    } catch (error) {
      console.error('[FloatingPanelState] Error loading state:', error);
      this._stateManager.setState({
        isExpanded: this._defaultExpanded,
        isLoaded: true
      });
    }
  }

  /**
   * Save state to storage with debounce
   * @param {boolean} newState - New expanded state
   * @private
   */
  _saveState(newState) {
    // Clear previous timer
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
    }

    // Set new timer
    this._debounceTimer = setTimeout(() => {
      this._storage.set(STORAGE_KEYS.FLOATING_PANEL_EXPANDED, newState).catch(error => {
        console.error('[FloatingPanelState] Error saving state:', error);
      });
    }, 300); // 300ms debounce
  }

  /**
   * Toggle expanded state
   */
  toggle() {
    const currentState = this._stateManager.getState();
    const newState = !currentState.isExpanded;
    this._stateManager.setState({ isExpanded: newState });
    this._saveState(newState);
  }

  /**
   * Set expanded state explicitly
   * @param {boolean} expanded - New expanded state
   */
  setExpanded(expanded) {
    this._stateManager.setState({ isExpanded: expanded });
    this._saveState(expanded);
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = null;
    }
  }
}
