// Testes unitários - DelayHelper
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { DelayHelper } from '../../../src/bundle/utils/DelayHelper.js';

describe('DelayHelper', () => {
  describe('sleep', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('deve resolver após o tempo especificado', async () => {
      let resolved = false;
      const promise = DelayHelper.sleep(1000).then(() => { resolved = true; });

      expect(resolved).toBe(false);

      jest.advanceTimersByTime(999);
      await Promise.resolve(); // flush microtasks
      expect(resolved).toBe(false);

      jest.advanceTimersByTime(1);
      await promise;
      expect(resolved).toBe(true);
    });

    it('deve resolver imediatamente com 0ms', async () => {
      let resolved = false;
      const promise = DelayHelper.sleep(0).then(() => { resolved = true; });

      jest.advanceTimersByTime(0);
      await promise;
      expect(resolved).toBe(true);
    });
  });

  describe('calculateRandomDelay', () => {
    it('deve retornar valor entre min e max', () => {
      for (let i = 0; i < 50; i++) {
        const result = DelayHelper.calculateRandomDelay(100, 500);
        expect(result).toBeGreaterThanOrEqual(100);
        expect(result).toBeLessThan(500);
      }
    });

    it('deve retornar min quando min === max', () => {
      const result = DelayHelper.calculateRandomDelay(200, 200);
      expect(result).toBe(200);
    });

    it('deve retornar inteiro', () => {
      const result = DelayHelper.calculateRandomDelay(100, 500);
      expect(Number.isInteger(result)).toBe(true);
    });
  });

  describe('calculateRandomDelayWithVariation', () => {
    it('deve retornar valor dentro da faixa base ± variação', () => {
      const base = 1000;
      const variation = 0.3;
      const min = base - (base * variation); // 700
      const max = base + (base * variation); // 1300

      for (let i = 0; i < 50; i++) {
        const result = DelayHelper.calculateRandomDelayWithVariation(base, variation);
        expect(result).toBeGreaterThanOrEqual(min);
        expect(result).toBeLessThan(max);
      }
    });

    it('deve retornar valor exato quando variação é 0', () => {
      const result = DelayHelper.calculateRandomDelayWithVariation(1000, 0);
      expect(result).toBe(1000);
    });
  });
});
