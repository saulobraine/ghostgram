// ScanState - Value Object (Wrap primitives)

export type ScanStatus = 'initial' | 'scanning' | 'unfollowing' | 'paused' | 'completed';

/**
 * Value Object que representa o estado do scan
 */
export class ScanState {
  private readonly _status: ScanStatus;

  constructor(status: ScanStatus) {
    this._validate(status);
    this._status = status;
  }

  static createInitial(): ScanState {
    return new ScanState('initial');
  }

  static createScanning(): ScanState {
    return new ScanState('scanning');
  }

  static createUnfollowing(): ScanState {
    return new ScanState('unfollowing');
  }

  static createPaused(): ScanState {
    return new ScanState('paused');
  }

  static createCompleted(): ScanState {
    return new ScanState('completed');
  }

  static fromString(status: string): ScanState {
    return new ScanState(status as ScanStatus);
  }

  private _validate(status: unknown): void {
    const validStatuses: ScanStatus[] = ['initial', 'scanning', 'unfollowing', 'paused', 'completed'];
    if (!validStatuses.includes(status as ScanStatus)) {
      throw new Error(`Invalid scan state: ${status}`);
    }
  }

  isInitial(): boolean {
    return this._status === 'initial';
  }

  isScanning(): boolean {
    return this._status === 'scanning';
  }

  isUnfollowing(): boolean {
    return this._status === 'unfollowing';
  }

  isPaused(): boolean {
    return this._status === 'paused';
  }

  isCompleted(): boolean {
    return this._status === 'completed';
  }

  transitionTo(newStatus: ScanStatus): ScanState {
    return ScanState.fromString(newStatus);
  }

  toString(): string {
    return this._status;
  }

  equals(other: unknown): boolean {
    if (!(other instanceof ScanState)) {
      return false;
    }
    return this._status === other._status;
  }
}
