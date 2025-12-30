// ExtensionState - Objeto de Valor (Encapsula primitivos)
export class ExtensionState {
  constructor(enabled) {
    this._enabled = Boolean(enabled);
  }

  /**
   * Cria um estado habilitado
   * @returns {ExtensionState}
   */
  static createEnabled() {
    return new ExtensionState(true);
  }

  /**
   * Cria um estado desabilitado
   * @returns {ExtensionState}
   */
  static createDisabled() {
    return new ExtensionState(false);
  }

  /**
   * Cria um estado a partir de um valor do armazenamento
   * @param {any} value - Valor vindo do storage
   * @returns {ExtensionState}
   */
  static fromStorageValue(value) {
    return new ExtensionState(value !== false);
  }

  isEnabled() {
    return this._enabled;
  }

  isDisabled() {
    return !this._enabled;
  }

  /**
   * Alterna o estado de habilitado/desabilitado
   * @returns {ExtensionState} Nova instância com o estado alternado
   */
  toggle() {
    return new ExtensionState(!this._enabled);
  }

  toStorageValue() {
    return this._enabled;
  }

  /**
   * Compara se dois estados são iguais
   * @param {ExtensionState} other - Outro estado a comparar
   * @returns {boolean} Verdadeiro se forem iguais
   */
  equals(other) {
    if (!(other instanceof ExtensionState)) {
      return false;
    }
    return this._enabled === other._enabled;
  }
}


