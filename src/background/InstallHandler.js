// InstallHandler - SRP: Handle extension installation
import { ExtensionState } from '../domain/ExtensionState.js';
import { Settings } from '../domain/Settings.js';
import { LocalStorageAdapter } from '../storage/LocalStorageAdapter.js';
import { SyncStorageAdapter } from '../storage/SyncStorageAdapter.js';
import { STORAGE_KEYS } from '../constants/Constants.js';

export class InstallHandler {
  constructor(localStorage, syncStorage) {
    this._localStorage = localStorage || new LocalStorageAdapter();
    this._syncStorage = syncStorage || new SyncStorageAdapter();
  }

  async handle(details) {
    if (!this._isInstall(details)) {
      return;
    }
    await this._initializeExtension();
  }

  _isInstall(details) {
    return details.reason === 'install';
  }

  async _initializeExtension() {
    await this._setDefaultState();
    await this._setDefaultSettings();
  }

  async _setDefaultState() {
    const defaultState = ExtensionState.createEnabled();
    await this._localStorage.set(STORAGE_KEYS.ENABLED, defaultState.toStorageValue());
  }

  async _setDefaultSettings() {
    const defaultSettings = Settings.createDefault();
    const settingsData = defaultSettings.toObject();
    await this._saveSettings(settingsData);
  }

  async _saveSettings(settingsData) {
    for (const [key, value] of Object.entries(settingsData)) {
      await this._syncStorage.set(key, value);
    }
  }
}

