// Settings - Value Object (Wrap primitives)
import { DEFAULT_SETTINGS } from '../constants/Constants.js';

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

  static createDefault() {
    return new Settings(
      DEFAULT_SETTINGS.timeBetweenSearchCycles,
      DEFAULT_SETTINGS.timeToWaitAfterFiveSearchCycles,
      DEFAULT_SETTINGS.timeBetweenUnfollows,
      DEFAULT_SETTINGS.timeToWaitAfterFiveUnfollows
    );
  }

  static fromObject(obj) {
    return new Settings(
      obj.timeBetweenSearchCycles || DEFAULT_SETTINGS.timeBetweenSearchCycles,
      obj.timeToWaitAfterFiveSearchCycles || DEFAULT_SETTINGS.timeToWaitAfterFiveSearchCycles,
      obj.timeBetweenUnfollows || DEFAULT_SETTINGS.timeBetweenUnfollows,
      obj.timeToWaitAfterFiveUnfollows || DEFAULT_SETTINGS.timeToWaitAfterFiveUnfollows
    );
  }

  _validate(timeBetweenSearchCycles, timeToWaitAfterFiveSearchCycles,
            timeBetweenUnfollows, timeToWaitAfterFiveUnfollows) {
    this._validatePositive(timeBetweenSearchCycles, 'timeBetweenSearchCycles');
    this._validatePositive(timeToWaitAfterFiveSearchCycles, 'timeToWaitAfterFiveSearchCycles');
    this._validatePositive(timeBetweenUnfollows, 'timeBetweenUnfollows');
    this._validatePositive(timeToWaitAfterFiveUnfollows, 'timeToWaitAfterFiveUnfollows');
  }

  _validatePositive(value, name) {
    if (typeof value !== 'number' || value <= 0) {
      throw new Error(`${name} must be a positive number`);
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

  toObject() {
    return {
      timeBetweenSearchCycles: this._timeBetweenSearchCycles,
      timeToWaitAfterFiveSearchCycles: this._timeToWaitAfterFiveSearchCycles,
      timeBetweenUnfollows: this._timeBetweenUnfollows,
      timeToWaitAfterFiveUnfollows: this._timeToWaitAfterFiveUnfollows
    };
  }
}

