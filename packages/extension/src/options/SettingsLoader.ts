// SettingsLoader - SRP: Load settings from storage
import { Settings } from '../domain/Settings.js';
import { SyncStorageAdapter } from '../storage/SyncStorageAdapter.js';
import { SETTINGS_KEYS } from '../constants/Constants.js';
import type { StorageAdapter } from '../storage/StorageAdapter.js';

/**
 * Loader responsável por carregar configurações do storage
 */
export class SettingsLoader {
  private _storage: StorageAdapter;

  constructor(storageAdapter?: StorageAdapter) {
    this._storage = storageAdapter || new SyncStorageAdapter();
  }

  async load(): Promise<Settings> {
    const stored = await this._getStoredSettings();
    return Settings.fromObject(stored);
  }

  private async _getStoredSettings(): Promise<Record<string, any>> {
    return await this._storage.getAll() as Record<string, any>;
  }

  populateForm(settings: Settings, formElement: HTMLFormElement): void {
    this._setInputValue(SETTINGS_KEYS.TIME_BETWEEN_SEARCH_CYCLES,
      settings.getTimeBetweenSearchCycles(), formElement);
    this._setInputValue(SETTINGS_KEYS.TIME_TO_WAIT_AFTER_FIVE_SEARCH_CYCLES,
      settings.getTimeToWaitAfterFiveSearchCycles(), formElement);
    this._setInputValue(SETTINGS_KEYS.TIME_BETWEEN_UNFOLLOWS,
      settings.getTimeBetweenUnfollows(), formElement);
    this._setInputValue(SETTINGS_KEYS.TIME_TO_WAIT_AFTER_FIVE_UNFOLLOWS,
      settings.getTimeToWaitAfterFiveUnfollows(), formElement);
    this._setInputValue(SETTINGS_KEYS.SUCCESS_MESSAGE_DURATION,
      settings.getSuccessMessageDuration(), formElement);
    this._setInputValue(SETTINGS_KEYS.UNFOLLOWERS_PER_PAGE,
      settings.getUnfollowersPerPage(), formElement);
    this._setInputValue(SETTINGS_KEYS.WITHOUT_PROFILE_PICTURE_URL_IDS,
      settings.getWithoutProfilePictureUrlIds().join(', '), formElement);
    this._setInputValue(SETTINGS_KEYS.INSTAGRAM_GRAPHQL_QUERY_HASH,
      settings.getInstagramGraphqlQueryHash(), formElement);
    this._setInputValue(SETTINGS_KEYS.INSTAGRAM_GRAPHQL_BASE_URL,
      settings.getInstagramGraphqlBaseUrl(), formElement);
    this._setInputValue(SETTINGS_KEYS.INSTAGRAM_UNFOLLOW_BASE_URL,
      settings.getInstagramUnfollowBaseUrl(), formElement);
  }

  private _setInputValue(key: string, value: any, formElement: HTMLFormElement): void {
    const input = formElement.querySelector(`#${key}`) as HTMLInputElement | null;
    if (input) {
      input.value = value;
    }
  }
}
