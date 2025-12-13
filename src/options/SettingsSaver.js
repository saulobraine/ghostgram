// SettingsSaver - SRP: Save settings to storage
import { Settings } from '../domain/Settings.js';
import { SyncStorageAdapter } from '../storage/SyncStorageAdapter.js';
import { SETTINGS_KEYS } from '../constants/Constants.js';

export class SettingsSaver {
  constructor(storageAdapter) {
    this._storage = storageAdapter || new SyncStorageAdapter();
  }

  async saveFromForm(formElement) {
    const settings = this._extractFromForm(formElement);
    await this._save(settings);
  }

  _extractFromForm(formElement) {
    return new Settings(
      this._getIntValue(SETTINGS_KEYS.TIME_BETWEEN_SEARCH_CYCLES, formElement),
      this._getIntValue(SETTINGS_KEYS.TIME_TO_WAIT_AFTER_FIVE_SEARCH_CYCLES, formElement),
      this._getIntValue(SETTINGS_KEYS.TIME_BETWEEN_UNFOLLOWS, formElement),
      this._getIntValue(SETTINGS_KEYS.TIME_TO_WAIT_AFTER_FIVE_UNFOLLOWS, formElement)
    );
  }

  _getIntValue(key, formElement) {
    const input = formElement.querySelector(`#${key}`);
    return parseInt(input.value, 10);
  }

  async _save(settings) {
    const data = settings.toObject();
    await this._saveSetting(SETTINGS_KEYS.TIME_BETWEEN_SEARCH_CYCLES, data.timeBetweenSearchCycles);
    await this._saveSetting(SETTINGS_KEYS.TIME_TO_WAIT_AFTER_FIVE_SEARCH_CYCLES, data.timeToWaitAfterFiveSearchCycles);
    await this._saveSetting(SETTINGS_KEYS.TIME_BETWEEN_UNFOLLOWS, data.timeBetweenUnfollows);
    await this._saveSetting(SETTINGS_KEYS.TIME_TO_WAIT_AFTER_FIVE_UNFOLLOWS, data.timeToWaitAfterFiveUnfollows);
  }

  async _saveSetting(key, value) {
    await this._storage.set(key, value);
  }
}

