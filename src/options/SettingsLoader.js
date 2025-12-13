// SettingsLoader - SRP: Load settings from storage
import { Settings } from '../domain/Settings.js';
import { SyncStorageAdapter } from '../storage/SyncStorageAdapter.js';
import { SETTINGS_KEYS } from '../constants/Constants.js';

export class SettingsLoader {
  constructor(storageAdapter) {
    this._storage = storageAdapter || new SyncStorageAdapter();
  }

  async load() {
    const stored = await this._getStoredSettings();
    return Settings.fromObject(stored);
  }

  async _getStoredSettings() {
    return await this._storage.getAll();
  }

  populateForm(settings, formElement) {
    this._setInputValue(SETTINGS_KEYS.TIME_BETWEEN_SEARCH_CYCLES, 
                       settings.getTimeBetweenSearchCycles(), formElement);
    this._setInputValue(SETTINGS_KEYS.TIME_TO_WAIT_AFTER_FIVE_SEARCH_CYCLES,
                       settings.getTimeToWaitAfterFiveSearchCycles(), formElement);
    this._setInputValue(SETTINGS_KEYS.TIME_BETWEEN_UNFOLLOWS,
                       settings.getTimeBetweenUnfollows(), formElement);
    this._setInputValue(SETTINGS_KEYS.TIME_TO_WAIT_AFTER_FIVE_UNFOLLOWS,
                       settings.getTimeToWaitAfterFiveUnfollows(), formElement);
  }

  _setInputValue(key, value, formElement) {
    const input = formElement.querySelector(`#${key}`);
    if (input) {
      input.value = value;
    }
  }
}

