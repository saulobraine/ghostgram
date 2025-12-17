// StateManager - Simple reactive state management
export class StateManager {
  constructor(initialState = {}) {
    this._state = { ...initialState };
    this._listeners = [];
  }

  /**
   * Get current state (returns a copy to prevent mutations)
   * @returns {Object} Current state
   */
  getState() {
    return { ...this._state };
  }

  /**
   * Update state and notify listeners
   * @param {Object} updates - Partial state updates
   */
  setState(updates) {
    this._state = { ...this._state, ...updates };
    this._notify();
  }

  /**
   * Subscribe to state changes
   * @param {Function} listener - Callback function that receives new state
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    this._listeners.push(listener);
    return () => {
      this._listeners = this._listeners.filter(l => l !== listener);
    };
  }

  /**
   * Unsubscribe a specific listener
   * @param {Function} listener - Listener to remove
   */
  unsubscribe(listener) {
    this._listeners = this._listeners.filter(l => l !== listener);
  }

  /**
   * Notify all listeners of state changes
   * @private
   */
  _notify() {
    const state = this.getState();
    this._listeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('[StateManager] Error in listener:', error);
      }
    });
  }

  /**
   * Reset state to initial value
   * @param {Object} initialState - New initial state
   */
  reset(initialState) {
    this._state = { ...initialState };
    this._notify();
  }
}
