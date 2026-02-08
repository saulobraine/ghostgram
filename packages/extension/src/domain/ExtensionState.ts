// ExtensionState - Objeto de Valor (Encapsula primitivos)

/**
 * Value Object que representa o estado da extensão (habilitada/desabilitada)
 */
export class ExtensionState {
  private readonly _enabled: boolean;

  constructor(enabled: boolean) {
    this._enabled = Boolean(enabled);
  }

  /**
   * Cria um estado habilitado
   * @returns ExtensionState habilitado
   */
  static createEnabled(): ExtensionState {
    return new ExtensionState(true);
  }

  /**
   * Cria um estado desabilitado
   * @returns ExtensionState desabilitado
   */
  static createDisabled(): ExtensionState {
    return new ExtensionState(false);
  }

  /**
   * Cria um estado a partir de um valor do armazenamento
   * @param value - Valor vindo do storage (null, undefined ou false = desabilitado)
   * @returns ExtensionState
   */
  static fromStorageValue(value: unknown): ExtensionState {
    return new ExtensionState(value !== false);
  }

  isEnabled(): boolean {
    return this._enabled;
  }

  isDisabled(): boolean {
    return !this._enabled;
  }

  /**
   * Alterna o estado de habilitado/desabilitado
   * @returns Nova instância com o estado alternado
   */
  toggle(): ExtensionState {
    return new ExtensionState(!this._enabled);
  }

  toStorageValue(): boolean {
    return this._enabled;
  }

  /**
   * Compara se dois estados são iguais
   * @param other - Outro estado a comparar
   * @returns Verdadeiro se forem iguais
   */
  equals(other: unknown): boolean {
    if (!(other instanceof ExtensionState)) {
      return false;
    }
    return this._enabled === other._enabled;
  }
}
