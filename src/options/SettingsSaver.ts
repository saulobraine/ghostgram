// SettingsSaver - SRP: Save settings to storage
import { Settings } from '../domain/Settings.js';
import { SyncStorageAdapter } from '../storage/SyncStorageAdapter.js';
import { SETTINGS_KEYS } from '../constants/Constants.js';
import type { StorageAdapter } from '../storage/StorageAdapter.js';

/**
 * Saver responsável por salvar configurações no storage
 */
export class SettingsSaver {
  private _storage: StorageAdapter;

  constructor(storageAdapter?: StorageAdapter) {
    this._storage = storageAdapter || new SyncStorageAdapter();
  }

  async saveFromForm(formElement: HTMLFormElement): Promise<void> {
    const settings = this._extractFromForm(formElement);
    await this._save(settings);
  }

  private _extractFromForm(formElement: HTMLFormElement): Settings {
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

  private _getIntValue(key: string, formElement: HTMLFormElement): number {
    const input = formElement.querySelector(`#${key}`) as HTMLInputElement | null;
    if (!input) {
      throw new Error(`Input with id "${key}" not found`);
    }
    return parseInt(input.value, 10);
  }

  private _getStringValue(key: string, formElement: HTMLFormElement): string {
    const input = formElement.querySelector(`#${key}`) as HTMLInputElement | null;
    if (!input) {
      throw new Error(`Input with id "${key}" not found`);
    }
    return input.value.trim();
  }

  private _getIdsValue(key: string, formElement: HTMLFormElement): string[] {
    const value = this._getStringValue(key, formElement);
    return value.split(',').map(id => id.trim()).filter(id => id.length > 0);
  }

  private async _save(settings: Settings): Promise<void> {
    const data = settings.toObject();
    const savePromises = Object.entries(data).map(([key, value]) => this._saveSetting(key, value));
    await Promise.all(savePromises);
  }

  private async _saveSetting(key: string, value: any): Promise<void> {
    await this._storage.set(key, value);
  }
}
