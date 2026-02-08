// Performance tests for storage operations
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { SyncStorageAdapter } from '../../src/storage/SyncStorageAdapter.js';
import { LocalStorageWrapper } from '../../src/storage/LocalStorageWrapper.js';
import { createChromeMock, clearChromeMock } from '../mocks/chrome-api.mock.js';

describe('Storage Performance', () => {
  let chromeMock;
  let adapter;
  let wrapper;

  beforeEach(() => {
    chromeMock = createChromeMock();
    adapter = new SyncStorageAdapter();
    wrapper = new LocalStorageWrapper(adapter);
  });

  afterEach(() => {
    clearChromeMock();
  });

  describe('SyncStorageAdapter Performance', () => {
    it('should handle 100 sequential get operations efficiently', async () => {
      const startTime = performance.now();

      for (let i = 0; i < 100; i++) {
        await adapter.get(`key${i}`);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete 100 operations in less than 1 second
      expect(duration).toBeLessThan(1000);
    });

    it('should handle 100 sequential set operations efficiently', async () => {
      const startTime = performance.now();

      for (let i = 0; i < 100; i++) {
        await adapter.set(`key${i}`, `value${i}`);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000);
    });

    it('should handle batch operations efficiently', async () => {
      const startTime = performance.now();

      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(adapter.set(`key${i}`, `value${i}`));
      }
      await Promise.all(promises);

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Batch operations should be faster
      expect(duration).toBeLessThan(500);
    });
  });

  describe('LocalStorageWrapper Cache Performance', () => {
    it('should use cache for repeated getItem calls', () => {
      wrapper.setItem('testKey', 'testValue');

      const startTime = performance.now();

      // First call should hit storage
      const value1 = wrapper.getItem('testKey');

      // Subsequent calls should use cache (much faster)
      for (let i = 0; i < 1000; i++) {
        wrapper.getItem('testKey');
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(value1).toBe('testValue');
      // 1000 cache hits should be very fast (< 10ms)
      expect(duration).toBeLessThan(10);
    });

    it('should handle large data efficiently', () => {
      const largeData = 'x'.repeat(10000);

      const startTime = performance.now();
      wrapper.setItem('largeKey', largeData);
      const retrieved = wrapper.getItem('largeKey');
      const endTime = performance.now();

      expect(retrieved).toBe(largeData);
      expect(endTime - startTime).toBeLessThan(50);
    });

    it('should maintain performance with many keys', () => {
      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        wrapper.setItem(`key${i}`, `value${i}`);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(wrapper.length).toBe(1000);
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Memory Performance', () => {
    it('should not leak memory with repeated operations', () => {
      const initialLength = wrapper.length;

      for (let i = 0; i < 100; i++) {
        wrapper.setItem(`temp${i}`, `value${i}`);
        wrapper.removeItem(`temp${i}`);
      }

      // Length should return to initial state
      expect(wrapper.length).toBe(initialLength);
    });

    it('should handle clear efficiently with many keys', () => {
      for (let i = 0; i < 1000; i++) {
        wrapper.setItem(`key${i}`, `value${i}`);
      }

      const startTime = performance.now();
      wrapper.clear();
      const endTime = performance.now();

      expect(wrapper.length).toBe(0);
      expect(endTime - startTime).toBeLessThan(50);
    });
  });
});

