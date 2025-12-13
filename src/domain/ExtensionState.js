// ExtensionState - Value Object (Wrap primitives)
export class ExtensionState {
  constructor(enabled) {
    this._enabled = Boolean(enabled);
  }

  static createEnabled() {
    return new ExtensionState(true);
  }

  static createDisabled() {
    return new ExtensionState(false);
  }

  static fromStorageValue(value) {
    return new ExtensionState(value !== false);
  }

  isEnabled() {
    return this._enabled;
  }

  isDisabled() {
    return !this._enabled;
  }

  toggle() {
    return new ExtensionState(!this._enabled);
  }

  toStorageValue() {
    return this._enabled;
  }

  equals(other) {
    if (!(other instanceof ExtensionState)) {
      return false;
    }
    return this._enabled === other._enabled;
  }
}

