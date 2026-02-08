// HostnameValidator - SRP: Single Responsibility (validate hostname)
import { INSTAGRAM_HOSTNAME } from '../constants/Constants.js';

/**
 * Validador responsável por validar hostnames
 */
export class HostnameValidator {
  /**
   * Verifica se o hostname é válido (Instagram)
   * @param location - Objeto location a validar
   * @returns True se for Instagram
   */
  static isValid(location: Location): boolean {
    return location.hostname === INSTAGRAM_HOSTNAME;
  }

  /**
   * Valida o hostname e lança erro se inválido
   * @param location - Objeto location a validar
   * @throws {Error} Se o hostname não for Instagram
   */
  static validate(location: Location): void {
    if (!this.isValid(location)) {
      throw new Error(`Extension only works on ${INSTAGRAM_HOSTNAME}`);
    }
  }
}
