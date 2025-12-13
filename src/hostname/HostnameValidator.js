// HostnameValidator - SRP: Single Responsibility (validate hostname)
import { INSTAGRAM_HOSTNAME } from '../constants/Constants.js';

export class HostnameValidator {
  static isValid(location) {
    return location.hostname === INSTAGRAM_HOSTNAME;
  }

  static validate(location) {
    if (!this.isValid(location)) {
      throw new Error(`Extension only works on ${INSTAGRAM_HOSTNAME}`);
    }
  }
}

