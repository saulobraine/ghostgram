// StatusUpdater - SRP: Update UI status
export class StatusUpdater {
  constructor(statusElement, toggleButton, startScanButton = null) {
    this._statusElement = statusElement;
    this._toggleButton = toggleButton;
    this._startScanButton = startScanButton;
  }

  update(enabled) {
    if (enabled) {
      this._setActive();
      return;
    }
    this._setInactive();
  }

  _setActive() {
    this._statusElement.textContent = 'Extension is Active';
    this._statusElement.className = 'status active';
    this._toggleButton.textContent = 'Disable Extension';
    this._toggleButton.classList.remove('primary');
    if (this._startScanButton) {
      this._startScanButton.style.display = 'block';
    }
  }

  _setInactive() {
    this._statusElement.textContent = 'Extension is Inactive';
    this._statusElement.className = 'status inactive';
    this._toggleButton.textContent = 'Enable Extension';
    this._toggleButton.classList.add('primary');
    if (this._startScanButton) {
      this._startScanButton.style.display = 'none';
    }
  }
}

