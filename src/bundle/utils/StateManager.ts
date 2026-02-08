// StateManager - Gerenciamento de estado reativo simples

type StateListener<T> = (state: T) => void;
type Unsubscribe = () => void;

/**
 * Gerenciador de estado reativo simples
 * @template T Tipo do estado
 */
export class StateManager<T extends Record<string, any> = Record<string, any>> {
  private _state: T;
  private _listeners: StateListener<T>[];

  constructor(initialState: T = {} as T) {
    this._state = { ...initialState };
    this._listeners = [];
  }

  /**
   * Retorna o estado atual (retorna uma cópia para evitar mutações)
   * @returns Estado atual
   */
  getState(): T {
    return { ...this._state };
  }

  /**
   * Atualiza o estado e notifica os ouvintes
   * @param updates - Atualizações parciais de estado
   */
  setState(updates: Partial<T>): void {
    this._state = { ...this._state, ...updates };
    this._notify();
  }

  /**
   * Se inscreve para mudanças de estado
   * @param listener - Função de callback que recebe o novo estado
   * @returns Função para cancelar a inscrição
   */
  subscribe(listener: StateListener<T>): Unsubscribe {
    this._listeners.push(listener);
    return () => {
      this._listeners = this._listeners.filter(l => l !== listener);
    };
  }

  /**
   * Cancela a inscrição de um ouvinte específico
   * @param listener - Ouvinte a remover
   */
  unsubscribe(listener: StateListener<T>): void {
    this._listeners = this._listeners.filter(l => l !== listener);
  }

  /**
   * Notifica todos os ouvintes sobre as mudanças de estado
   * @private
   */
  private _notify(): void {
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
   * @param initialState - Novo estado inicial
   */
  reset(initialState: T): void {
    this._state = { ...initialState };
    this._notify();
  }
}
