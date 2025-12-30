// Settings - Objeto de Valor (Encapsula primitivos)
import { DEFAULT_SETTINGS } from '../constants/Constants.js';

/**
 * Classe que representa as configurações do sistema
 */
export class Settings {
  constructor(timeBetweenSearchCycles, timeToWaitAfterFiveSearchCycles,
    timeBetweenUnfollows, timeToWaitAfterFiveUnfollows) {
    this._validate(timeBetweenSearchCycles, timeToWaitAfterFiveSearchCycles,
      timeBetweenUnfollows, timeToWaitAfterFiveUnfollows);

    this._timeBetweenSearchCycles = timeBetweenSearchCycles;
    this._timeToWaitAfterFiveSearchCycles = timeToWaitAfterFiveSearchCycles;
    this._timeBetweenUnfollows = timeBetweenUnfollows;
    this._timeToWaitAfterFiveUnfollows = timeToWaitAfterFiveUnfollows;
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
      DEFAULT_SETTINGS.timeToWaitAfterFiveUnfollows
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
      obj.timeToWaitAfterFiveUnfollows || DEFAULT_SETTINGS.timeToWaitAfterFiveUnfollows
    );
  }

  /**
   * Valida os parâmetros de entrada
   * @private
   */
  _validate(timeBetweenSearchCycles, timeToWaitAfterFiveSearchCycles,
    timeBetweenUnfollows, timeToWaitAfterFiveUnfollows) {
    this._validatePositive(timeBetweenSearchCycles, 'timeBetweenSearchCycles');
    this._validatePositive(timeToWaitAfterFiveSearchCycles, 'timeToWaitAfterFiveSearchCycles');
    this._validatePositive(timeBetweenUnfollows, 'timeBetweenUnfollows');
    this._validatePositive(timeToWaitAfterFiveUnfollows, 'timeToWaitAfterFiveUnfollows');
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

  /**
   * Converte para objeto plano
   * @returns {Object} Representação em objeto
   */
  toObject() {
    return {
      timeBetweenSearchCycles: this._timeBetweenSearchCycles,
      timeToWaitAfterFiveSearchCycles: this._timeToWaitAfterFiveSearchCycles,
      timeBetweenUnfollows: this._timeBetweenUnfollows,
      timeToWaitAfterFiveUnfollows: this._timeToWaitAfterFiveUnfollows
    };
  }
}


