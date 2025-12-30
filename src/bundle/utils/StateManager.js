// StateManager - Gerenciamento de estado reativo simples
export class StateManager {
  constructor(initialState = {}) {
    this._state = { ...initialState };
    this._listeners = [];
  }

  /**
   * Retorna o estado atual (retorna uma cópia para evitar mutações)
   * @returns {Object} Estado atual
   */
  getState() {
    return { ...this._state };
  }

  /**
   * Atualiza o estado e notifica os ouvintes
   * @param {Object} updates - Atualizações parciais de estado
   */
  setState(updates) {
    this._state = { ...this._state, ...updates };
    this._notify();
  }

  /**
   * Se inscreve para mudanças de estado
   * @param {Function} listener - Função de callback que recebe o novo estado
   * @returns {Function} Função para cancelar a inscrição
   */
  subscribe(listener) {
    this._listeners.push(listener);
    return () => {
      this._listeners = this._listeners.filter(l => l !== listener);
    };
  }

  /**
   * Cancela a inscrição de um ouvinte específico
   * @param {Function} listener - Ouvinte a remover
   */
  unsubscribe(listener) {
    this._listeners = this._listeners.filter(l => l !== listener);
  }

  /**
   * Notifica todos os ouvintes sobre as mudanças de estado
   * @private
   */
  _notify() {
    const state = this.getState();
    this._listeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('[StateManager] Erro no listener:', error);
      }
    });
  }

  /**
   * Redefine o estado para o valor inicial
   * @param {Object} initialState - Novo estado inicial
   */
  reset(initialState) {
    this._state = { ...initialState };
    this._notify();
  }
}

