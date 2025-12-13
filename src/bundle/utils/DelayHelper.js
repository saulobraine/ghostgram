// DelayHelper - Utility for delays and sleep
export class DelayHelper {
  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static calculateRandomDelay(min, max) {
    const minMs = Math.floor(min);
    const maxMs = Math.floor(max);
    return Math.floor(Math.random() * (maxMs - minMs)) + minMs;
  }

  static calculateRandomDelayWithVariation(base, variationPercent) {
    const variation = base * variationPercent;
    const min = base - variation;
    const max = base + variation;
    return DelayHelper.calculateRandomDelay(min, max);
  }
}

