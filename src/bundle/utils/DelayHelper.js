// DelayHelper - Utilitário para atrasos e espera (sleep)
export class DelayHelper {
  /**
   * Pausa a execução por um determinado tempo
   * @param {number} ms - Milissegundos para esperar
   * @returns {Promise<void>}
   */
  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Calcula um atraso aleatório entre min e max
   * @param {number} min - Valor mínimo
   * @param {number} max - Valor máximo
   * @returns {number} Valor aleatório
   */
  static calculateRandomDelay(min, max) {
    const minMs = Math.floor(min);
    const maxMs = Math.floor(max);
    return Math.floor(Math.random() * (maxMs - minMs)) + minMs;
  }

  /**
   * Calcula um atraso aleatório baseado em um valor base e variação
   * @param {number} base - Valor base
   * @param {number} variationPercent - Porcentagem de variação (0 a 1)
   * @returns {number} Valor aleatório
   */
  static calculateRandomDelayWithVariation(base, variationPercent) {
    const variation = base * variationPercent;
    const min = base - variation;
    const max = base + variation;
    return DelayHelper.calculateRandomDelay(min, max);
  }
}


