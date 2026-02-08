// InstallHandler - SRP: Handle extension installation
import { ExtensionState } from '../domain/ExtensionState.js';
import { Settings } from '../domain/Settings.js';
import { LocalStorageAdapter } from '../storage/LocalStorageAdapter.js';
import { SyncStorageAdapter } from '../storage/SyncStorageAdapter.js';
import { STORAGE_KEYS } from '../constants/Constants.js';
import type { StorageAdapter } from '../storage/StorageAdapter.js';

/**
 * Handler responsável por processar instalação da extensão
 */
export class InstallHandler {
  private _localStorage: StorageAdapter;
  private _syncStorage: StorageAdapter;

  constructor(localStorage?: StorageAdapter, syncStorage?: StorageAdapter) {
    this._localStorage = localStorage || new LocalStorageAdapter();
    this._syncStorage = syncStorage || new SyncStorageAdapter();
  }

  async handle(details: chrome.runtime.InstalledDetails): Promise<void> {
    if (!this._isInstall(details)) {
      return;
    }
    await this._initializeExtension();
  }

  private _isInstall(details: chrome.runtime.InstalledDetails): boolean {
    return details.reason === 'install';
  }

  private async _initializeExtension(): Promise<void> {
    await this._setDefaultState();
    await this._setDefaultSettings();
  }

  private async _setDefaultState(): Promise<void> {
    const defaultState = ExtensionState.createEnabled();
    await this._localStorage.set(STORAGE_KEYS.ENABLED, defaultState.toStorageValue());
  }

  private async _setDefaultSettings(): Promise<void> {
    const defaultSettings = Settings.createDefault();
    const settingsData = defaultSettings.toObject();
    await this._saveSettings(settingsData);
  }

  private async _saveSettings(settingsData: Record<string, any>): Promise<void> {
    for (const [key, value] of Object.entries(settingsData)) {
      await this._syncStorage.set(key, value);
    }
  }
}
