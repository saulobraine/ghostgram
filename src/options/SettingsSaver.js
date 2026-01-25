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
      this._getIntValue(SETTINGS_KEYS.TIME_TO_WAIT_AFTER_FIVE_UNFOLLOWS, formElement),
      this._getIntValue(SETTINGS_KEYS.SUCCESS_MESSAGE_DURATION, formElement),
      this._getIntValue(SETTINGS_KEYS.UNFOLLOWERS_PER_PAGE, formElement),
      this._getIdsValue(SETTINGS_KEYS.WITHOUT_PROFILE_PICTURE_URL_IDS, formElement),
      this._getStringValue(SETTINGS_KEYS.INSTAGRAM_GRAPHQL_QUERY_HASH, formElement),
      this._getStringValue(SETTINGS_KEYS.INSTAGRAM_GRAPHQL_BASE_URL, formElement),
      this._getStringValue(SETTINGS_KEYS.INSTAGRAM_UNFOLLOW_BASE_URL, formElement)
    );
  }

  _getIntValue(key, formElement) {
    const input = formElement.querySelector(`#${key}`);
    return parseInt(input.value, 10);
  }

  _getStringValue(key, formElement) {
    const input = formElement.querySelector(`#${key}`);
    return input.value.trim();
  }

  _getIdsValue(key, formElement) {
    const value = this._getStringValue(key, formElement);
    return value.split(',').map(id => id.trim()).filter(id => id.length > 0);
  }

  async _save(settings) {
    const data = settings.toObject();
    const savePromises = Object.entries(data).map(([key, value]) => this._saveSetting(key, value));
    await Promise.all(savePromises);
  }

  async _saveSetting(key, value) {
    await this._storage.set(key, value);
  }
}

