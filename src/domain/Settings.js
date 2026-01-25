// Settings - Objeto de Valor (Encapsula primitivos)
import { DEFAULT_SETTINGS } from '../constants/Constants.js';

/**
 * Classe que representa as configurações do sistema
 */
export class Settings {
  constructor(
    timeBetweenSearchCycles,
    timeToWaitAfterFiveSearchCycles,
    timeBetweenUnfollows,
    timeToWaitAfterFiveUnfollows,
    successMessageDuration,
    unfollowersPerPage,
    withoutProfilePictureUrlIds,
    instagramGraphqlQueryHash,
    instagramGraphqlBaseUrl,
    instagramUnfollowBaseUrl
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
    this._withoutProfilePictureUrlIds = withoutProfilePictureUrlIds;
    this._instagramGraphqlQueryHash = instagramGraphqlQueryHash;
    this._instagramGraphqlBaseUrl = instagramGraphqlBaseUrl;
    this._instagramUnfollowBaseUrl = instagramUnfollowBaseUrl;
  }

  /**
   * Cria uma instância com valores padrão
   * @returns {Settings} Instância padrão
   */
  static createDefault() {
    return new Settings(
      DEFAULT_SETTINGS.timeBetweenSearchCycles,
      DEFAULT_SETTINGS.timeToWaitAfterFiveSearchCycles,
      DEFAULT_SETTINGS.timeBetweenUnfollows,
      DEFAULT_SETTINGS.timeToWaitAfterFiveUnfollows,
      DEFAULT_SETTINGS.successMessageDuration,
      DEFAULT_SETTINGS.unfollowersPerPage,
      DEFAULT_SETTINGS.withoutProfilePictureUrlIds,
      DEFAULT_SETTINGS.instagramGraphqlQueryHash,
      DEFAULT_SETTINGS.instagramGraphqlBaseUrl,
      DEFAULT_SETTINGS.instagramUnfollowBaseUrl
    );
  }

  /**
   * Cria uma instância a partir de um objeto
   * @param {Object} obj - Objeto com as configurações
   * @returns {Settings} Nova instância
   */
  static fromObject(obj) {
    return new Settings(
      obj.timeBetweenSearchCycles || DEFAULT_SETTINGS.timeBetweenSearchCycles,
      obj.timeToWaitAfterFiveSearchCycles || DEFAULT_SETTINGS.timeToWaitAfterFiveSearchCycles,
      obj.timeBetweenUnfollows || DEFAULT_SETTINGS.timeBetweenUnfollows,
      obj.timeToWaitAfterFiveUnfollows || DEFAULT_SETTINGS.timeToWaitAfterFiveUnfollows,
      obj.successMessageDuration || DEFAULT_SETTINGS.successMessageDuration,
      obj.unfollowersPerPage || DEFAULT_SETTINGS.unfollowersPerPage,
      obj.withoutProfilePictureUrlIds || DEFAULT_SETTINGS.withoutProfilePictureUrlIds,
      obj.instagramGraphqlQueryHash || DEFAULT_SETTINGS.instagramGraphqlQueryHash,
      obj.instagramGraphqlBaseUrl || DEFAULT_SETTINGS.instagramGraphqlBaseUrl,
      obj.instagramUnfollowBaseUrl || DEFAULT_SETTINGS.instagramUnfollowBaseUrl
    );
  }

  /**
   * Valida os parâmetros de entrada
   * @private
   */
  _validate(
    timeBetweenSearchCycles,
    timeToWaitAfterFiveSearchCycles,
    timeBetweenUnfollows,
    timeToWaitAfterFiveUnfollows,
    successMessageDuration,
    unfollowersPerPage
  ) {
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
  _validatePositive(value, name) {
    if (typeof value !== 'number' || value <= 0) {
      throw new Error(`${name} deve ser um número positivo`);
    }
  }

  getTimeBetweenSearchCycles() {
    return this._timeBetweenSearchCycles;
  }

  getTimeToWaitAfterFiveSearchCycles() {
    return this._timeToWaitAfterFiveSearchCycles;
  }

  getTimeBetweenUnfollows() {
    return this._timeBetweenUnfollows;
  }

  getTimeToWaitAfterFiveUnfollows() {
    return this._timeToWaitAfterFiveUnfollows;
  }

  getSuccessMessageDuration() {
    return this._successMessageDuration;
  }

  getUnfollowersPerPage() {
    return this._unfollowersPerPage;
  }

  getWithoutProfilePictureUrlIds() {
    return this._withoutProfilePictureUrlIds;
  }

  getInstagramGraphqlQueryHash() {
    return this._instagramGraphqlQueryHash;
  }

  getInstagramGraphqlBaseUrl() {
    return this._instagramGraphqlBaseUrl;
  }

  getInstagramUnfollowBaseUrl() {
    return this._instagramUnfollowBaseUrl;
  }

  /**
   * Converte para objeto plano
   * @returns {Object} Representação em objeto
   */
  toObject() {
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


