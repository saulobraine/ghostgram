// Settings - Objeto de Valor (Encapsula primitivos)
import { DEFAULT_SETTINGS } from '../constants/Constants.js';
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
      unfollowersPerPage
    );

    this._timeBetweenSearchCycles = timeBetweenSearchCycles;
    this._timeToWaitAfterFiveSearchCycles = timeToWaitAfterFiveSearchCycles;
    this._timeBetweenUnfollows = timeBetweenUnfollows;
    this._timeToWaitAfterFiveUnfollows = timeToWaitAfterFiveUnfollows;
    this._successMessageDuration = successMessageDuration;
    this._unfollowersPerPage = unfollowersPerPage;
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
      obj.withoutProfilePictureUrlIds ? [...obj.withoutProfilePictureUrlIds] : [...DEFAULT_SETTINGS.withoutProfilePictureUrlIds],
      obj.instagramGraphqlQueryHash || DEFAULT_SETTINGS.instagramGraphqlQueryHash,
      obj.instagramGraphqlBaseUrl || DEFAULT_SETTINGS.instagramGraphqlBaseUrl,
      obj.instagramUnfollowBaseUrl || DEFAULT_SETTINGS.instagramUnfollowBaseUrl
    );
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
    unfollowersPerPage: unknown
  ): void {
    this._validatePositive(timeBetweenSearchCycles, 'timeBetweenSearchCycles');
    this._validatePositive(timeToWaitAfterFiveSearchCycles, 'timeToWaitAfterFiveSearchCycles');
    this._validatePositive(timeBetweenUnfollows, 'timeBetweenUnfollows');
    this._validatePositive(timeToWaitAfterFiveUnfollows, 'timeToWaitAfterFiveUnfollows');
    this._validatePositive(successMessageDuration, 'successMessageDuration');
    this._validatePositive(unfollowersPerPage, 'unfollowersPerPage');
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

  getTimeBetweenSearchCycles(): number {
    return this._timeBetweenSearchCycles;
  }

  getTimeToWaitAfterFiveSearchCycles(): number {
    return this._timeToWaitAfterFiveSearchCycles;
  }

  getTimeBetweenUnfollows(): number {
    return this._timeBetweenUnfollows;
  }

  getTimeToWaitAfterFiveUnfollows(): number {
    return this._timeToWaitAfterFiveUnfollows;
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

  /**
   * Converte para objeto plano
   * @returns Representação em objeto
   */
  toObject(): ISettingsObject {
    return {
      timeBetweenSearchCycles: this._timeBetweenSearchCycles,
      timeToWaitAfterFiveSearchCycles: this._timeToWaitAfterFiveSearchCycles,
      timeBetweenUnfollows: this._timeBetweenUnfollows,
      timeToWaitAfterFiveUnfollows: this._timeToWaitAfterFiveUnfollows,
      successMessageDuration: this._successMessageDuration,
      unfollowersPerPage: this._unfollowersPerPage,
      withoutProfilePictureUrlIds: this._withoutProfilePictureUrlIds,
      instagramGraphqlQueryHash: this._instagramGraphqlQueryHash,
      instagramGraphqlBaseUrl: this._instagramGraphqlBaseUrl,
      instagramUnfollowBaseUrl: this._instagramUnfollowBaseUrl
    };
  }
}
