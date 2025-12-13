// ScanState - Value Object (Wrap primitives)
export class ScanState {
  constructor(status) {
    this._validate(status);
    this._status = status;
  }

  static createInitial() {
    return new ScanState('initial');
  }

  static createScanning() {
    return new ScanState('scanning');
  }

  static createUnfollowing() {
    return new ScanState('unfollowing');
  }

  static fromString(status) {
    return new ScanState(status);
  }

  _validate(status) {
    const validStatuses = ['initial', 'scanning', 'unfollowing'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid scan state: ${status}`);
    }
  }

  isInitial() {
    return this._status === 'initial';
  }

  isScanning() {
    return this._status === 'scanning';
  }

  isUnfollowing() {
    return this._status === 'unfollowing';
  }

  transitionTo(newStatus) {
    return ScanState.fromString(newStatus);
  }

  toString() {
    return this._status;
  }

  equals(other) {
    if (!(other instanceof ScanState)) {
      return false;
    }
    return this._status === other._status;
  }
}

