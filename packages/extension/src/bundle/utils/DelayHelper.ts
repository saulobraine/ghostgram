// DelayHelper - Utilitário para atrasos e espera (sleep)

/**
 * Classe utilitária para gerenciar delays e esperas
 */
export class DelayHelper {
  /**
   * Pausa a execução por um determinado tempo
   * @param ms - Milissegundos para esperar
   * @returns Promise que resolve após o tempo especificado
   */
  static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Calcula um atraso aleatório entre min e max
   * @param min - Valor mínimo
   * @param max - Valor máximo
   * @returns Valor aleatório
   */
  static calculateRandomDelay(min: number, max: number): number {
    const minMs = Math.floor(min);
    const maxMs = Math.floor(max);
    return Math.floor(Math.random() * (maxMs - minMs)) + minMs;
  }

  /**
   * Calcula um atraso aleatório baseado em um valor base e variação
   * @param base - Valor base
   * @param variationPercent - Porcentagem de variação (0 a 1)
   * @returns Valor aleatório
   */
  static calculateRandomDelayWithVariation(base: number, variationPercent: number): number {
    const variation = base * variationPercent;
    const min = base - variation;
    const max = base + variation;
    return DelayHelper.calculateRandomDelay(min, max);
  }
}
