// Settings - Objeto de Valor (Encapsula primitivos)
import { DEFAULT_SETTINGS, INSTAGRAM_GRAPHQL_BASE_URL, INSTAGRAM_GRAPHQL_QUERY_HASH, INSTAGRAM_UNFOLLOW_BASE_URL } from '../constants/Constants.js';
import type { ISettingsObject } from '../types/domain.js';

/**
 * Classe que representa as configurações do sistema
 */
export class Settings {
  private readonly _timeBetweenSearchCycles: number;
  private readonly _timeToWaitAfterFiveSearchCycles: number;
  private readonly _timeBetweenUnfollows: number;
  private readonly _timeToWaitAfterFiveUnfollows: number;
  private readonly _successMessageDuration: number;
  private readonly _unfollowersPerPage: number;
  private readonly _unfollowsPerCycle: number;
  private readonly _withoutProfilePictureUrlIds: string[];
  private readonly _instagramGraphqlQueryHash: string;
  private readonly _instagramGraphqlBaseUrl: string;
  private readonly _instagramUnfollowBaseUrl: string;

  constructor(
    timeBetweenSearchCycles: number,
    timeToWaitAfterFiveSearchCycles: number,
    timeBetweenUnfollows: number,
    timeToWaitAfterFiveUnfollows: number,
    successMessageDuration: number,
    unfollowersPerPage: number,
    unfollowsPerCycle: number,
    withoutProfilePictureUrlIds: string[],
    instagramGraphqlQueryHash: string,
    instagramGraphqlBaseUrl: string,
    instagramUnfollowBaseUrl: string
  ) {
    this._validate(
      timeBetweenSearchCycles,
      timeToWaitAfterFiveSearchCycles,
      timeBetweenUnfollows,
      timeToWaitAfterFiveUnfollows,
      successMessageDuration,
      unfollowersPerPage,
      unfollowsPerCycle,
      withoutProfilePictureUrlIds,
      instagramGraphqlQueryHash,
      instagramGraphqlBaseUrl,
      instagramUnfollowBaseUrl
    );

    this._timeBetweenSearchCycles = timeBetweenSearchCycles;
    this._timeToWaitAfterFiveSearchCycles = timeToWaitAfterFiveSearchCycles;
    this._timeBetweenUnfollows = timeBetweenUnfollows;
    this._timeToWaitAfterFiveUnfollows = timeToWaitAfterFiveUnfollows;
    this._successMessageDuration = successMessageDuration;
    this._unfollowersPerPage = unfollowersPerPage;
    this._unfollowsPerCycle = unfollowsPerCycle;
    this._withoutProfilePictureUrlIds = [...withoutProfilePictureUrlIds];
    this._instagramGraphqlQueryHash = instagramGraphqlQueryHash;
    this._instagramGraphqlBaseUrl = instagramGraphqlBaseUrl;
    this._instagramUnfollowBaseUrl = instagramUnfollowBaseUrl;
  }

  /**
   * Cria uma instância com valores padrão
   * @returns Instância padrão
   */
  static createDefault(): Settings {
    return new Settings(
      DEFAULT_SETTINGS.timeBetweenSearchCycles,
      DEFAULT_SETTINGS.timeToWaitAfterFiveSearchCycles,
      DEFAULT_SETTINGS.timeBetweenUnfollows,
      DEFAULT_SETTINGS.timeToWaitAfterFiveUnfollows,
      DEFAULT_SETTINGS.successMessageDuration,
      DEFAULT_SETTINGS.unfollowersPerPage,
      DEFAULT_SETTINGS.unfollowsPerCycle,
      [...DEFAULT_SETTINGS.withoutProfilePictureUrlIds],
      DEFAULT_SETTINGS.instagramGraphqlQueryHash,
      DEFAULT_SETTINGS.instagramGraphqlBaseUrl,
      DEFAULT_SETTINGS.instagramUnfollowBaseUrl
    );
  }

  /**
   * Cria uma instância a partir de um objeto
   * @param obj - Objeto com as configurações
   * @returns Nova instância
   */
  static fromObject(obj: ISettingsObject): Settings {
    return new Settings(
      obj.timeBetweenSearchCycles || DEFAULT_SETTINGS.timeBetweenSearchCycles,
      obj.timeToWaitAfterFiveSearchCycles || DEFAULT_SETTINGS.timeToWaitAfterFiveSearchCycles,
      obj.timeBetweenUnfollows || DEFAULT_SETTINGS.timeBetweenUnfollows,
      obj.timeToWaitAfterFiveUnfollows || DEFAULT_SETTINGS.timeToWaitAfterFiveUnfollows,
      obj.successMessageDuration || DEFAULT_SETTINGS.successMessageDuration,
      obj.unfollowersPerPage || DEFAULT_SETTINGS.unfollowersPerPage,
      obj.unfollowsPerCycle || DEFAULT_SETTINGS.unfollowsPerCycle,
      obj.withoutProfilePictureUrlIds ? [...obj.withoutProfilePictureUrlIds] : [...DEFAULT_SETTINGS.withoutProfilePictureUrlIds],
      obj.instagramGraphqlQueryHash || DEFAULT_SETTINGS.instagramGraphqlQueryHash,
      obj.instagramGraphqlBaseUrl || DEFAULT_SETTINGS.instagramGraphqlBaseUrl,
      obj.instagramUnfollowBaseUrl || DEFAULT_SETTINGS.instagramUnfollowBaseUrl
    );
  }

  getTimeBetweenSearchCycles(): number {
    return this._timeBetweenSearchCycles;
  }

  /**
   * Valida os parâmetros de entrada
   * @private
   */
  private _validate(
    timeBetweenSearchCycles: unknown,
    timeToWaitAfterFiveSearchCycles: unknown,
    timeBetweenUnfollows: unknown,
    timeToWaitAfterFiveUnfollows: unknown,
    successMessageDuration: unknown,
    unfollowersPerPage: unknown,
    unfollowsPerCycle: unknown,
    withoutProfilePictureUrlIds: unknown,
    instagramGraphqlQueryHash: unknown,
    instagramGraphqlBaseUrl: unknown,
    instagramUnfollowBaseUrl: unknown
  ): void {
    this._validatePositive(timeBetweenSearchCycles, 'timeBetweenSearchCycles');
    this._validatePositive(timeToWaitAfterFiveSearchCycles, 'timeToWaitAfterFiveSearchCycles');
    this._validatePositive(timeBetweenUnfollows, 'timeBetweenUnfollows');
    this._validatePositive(timeToWaitAfterFiveUnfollows, 'timeToWaitAfterFiveUnfollows');
    this._validatePositive(successMessageDuration, 'successMessageDuration');
    this._validatePositive(unfollowersPerPage, 'unfollowersPerPage');
    this._validatePositive(unfollowsPerCycle, 'unfollowsPerCycle');
    this._validateThumbnailIds(withoutProfilePictureUrlIds);
    this._validateGraphqlQueryHash(instagramGraphqlQueryHash);
    this._validateInstagramUrl(instagramGraphqlBaseUrl, INSTAGRAM_GRAPHQL_BASE_URL, '/graphql/query/', 'instagramGraphqlBaseUrl');
    this._validateInstagramUrl(instagramUnfollowBaseUrl, INSTAGRAM_UNFOLLOW_BASE_URL, '/web/friendships/', 'instagramUnfollowBaseUrl');
  }

  /**
   * Valida se um valor é um número positivo
   * @private
   */
  private _validatePositive(value: unknown, name: string): void {
    if (typeof value !== 'number' || value <= 0) {
      throw new Error(`${name} deve ser um número positivo`);
    }
  }

  private _validateThumbnailIds(value: unknown): void {
    if (!Array.isArray(value)) {
      throw new Error('withoutProfilePictureUrlIds deve ser um array');
    }

    const allAreStrings = value.every(item => typeof item === 'string' && item.trim().length > 0);
    if (!allAreStrings) {
      throw new Error('withoutProfilePictureUrlIds deve conter apenas strings não vazias');
    }
  }

  private _validateGraphqlQueryHash(value: unknown): void {
    if (typeof value !== 'string' || !/^[a-f0-9]{32}$/i.test(value.trim())) {
      throw new Error('instagramGraphqlQueryHash inválido');
    }
  }

  private _validateInstagramUrl(
    value: unknown,
    expectedUrl: string,
    expectedPath: string,
    name: string
  ): void {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new Error(`${name} inválido`);
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(value);
    } catch {
      throw new Error(`${name} inválido`);
    }

    if (parsedUrl.protocol !== 'https:') {
      throw new Error(`${name} deve usar https`);
    }

    if (parsedUrl.hostname !== 'www.instagram.com') {
      throw new Error(`${name} deve usar www.instagram.com`);
    }

    if (parsedUrl.pathname !== expectedPath) {
      throw new Error(`${name} deve usar o caminho ${expectedPath}`);
    }

    if (parsedUrl.search || parsedUrl.hash) {
      throw new Error(`${name} não pode conter query string ou hash`);
    }

    if (parsedUrl.toString() !== expectedUrl) {
      throw new Error(`${name} deve corresponder ao endpoint permitido`);
    }
  }

  getTimeBetweenUnfollows(): number {
    return this._timeBetweenUnfollows;
  }

  getTimeToWaitAfterFiveUnfollows(): number {
    return this._timeToWaitAfterFiveUnfollows;
  }

  getTimeToWaitAfterFiveSearchCycles(): number {
    return this._timeToWaitAfterFiveSearchCycles;
  }

  getSuccessMessageDuration(): number {
    return this._successMessageDuration;
  }

  getUnfollowersPerPage(): number {
    return this._unfollowersPerPage;
  }

  getWithoutProfilePictureUrlIds(): string[] {
    return this._withoutProfilePictureUrlIds;
  }

  getInstagramGraphqlQueryHash(): string {
    return this._instagramGraphqlQueryHash;
  }

  getInstagramGraphqlBaseUrl(): string {
    return this._instagramGraphqlBaseUrl;
  }

  getInstagramUnfollowBaseUrl(): string {
    return this._instagramUnfollowBaseUrl;
  }

  getUnfollowsPerCycle(): number {
    return this._unfollowsPerCycle;
  }

  /**
   * Converte as configurações para um objeto
   * @returns Objeto com as configurações
   */
  toObject(): ISettingsObject {
    return {
      timeBetweenSearchCycles: this._timeBetweenSearchCycles,
      timeToWaitAfterFiveSearchCycles: this._timeToWaitAfterFiveSearchCycles,
      timeBetweenUnfollows: this._timeBetweenUnfollows,
      timeToWaitAfterFiveUnfollows: this._timeToWaitAfterFiveUnfollows,
      successMessageDuration: this._successMessageDuration,
      unfollowersPerPage: this._unfollowersPerPage,
      unfollowsPerCycle: this._unfollowsPerCycle,
      withoutProfilePictureUrlIds: this._withoutProfilePictureUrlIds,
      instagramGraphqlQueryHash: this._instagramGraphqlQueryHash,
      instagramGraphqlBaseUrl: this._instagramGraphqlBaseUrl,
      instagramUnfollowBaseUrl: this._instagramUnfollowBaseUrl
    };
  }
}
