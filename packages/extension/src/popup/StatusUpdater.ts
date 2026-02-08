// StatusUpdater - SRP: Update UI status

/**
 * Classe responsável por atualizar o status da UI do popup
 */
export class StatusUpdater {
  private _statusElement: HTMLElement;
  private _toggleButton: HTMLButtonElement;
  private _startScanButton: HTMLElement | null;

  constructor(
    statusElement: HTMLElement,
    toggleButton: HTMLButtonElement,
    startScanButton: HTMLElement | null = null
  ) {
    this._statusElement = statusElement;
    this._toggleButton = toggleButton;
    this._startScanButton = startScanButton;
  }

  update(enabled: boolean): void {
    if (enabled) {
      this._setActive();
      return;
    }
    this._setInactive();
  }

  private _setActive(): void {
    this._statusElement.textContent = 'Extension is Active';
    this._statusElement.className = 'status active';
    this._toggleButton.textContent = 'Disable Extension';
    this._toggleButton.classList.remove('primary');
    if (this._startScanButton) {
      this._startScanButton.style.display = 'block';
    }
  }

  private _setInactive(): void {
    this._statusElement.textContent = 'Extension is Inactive';
    this._statusElement.className = 'status inactive';
    this._toggleButton.textContent = 'Enable Extension';
    this._toggleButton.classList.add('primary');
    if (this._startScanButton) {
      this._startScanButton.style.display = 'none';
    }
  }
}
