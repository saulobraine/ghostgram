import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { LocalStorageWrapper } from '../../src/storage/LocalStorageWrapper.js';
import { SyncStorageAdapter } from '../../src/storage/SyncStorageAdapter.js';
import { createChromeMock, clearChromeMock } from '../mocks/chrome-api.mock.js';

describe('Storage Integration', () => {
  let chromeMock;

  beforeEach(() => {
    chromeMock = createChromeMock();
  });

  afterEach(() => {
    clearChromeMock();
  });

  describe('LocalStorageWrapper -> SyncStorageAdapter -> chrome.storage', () => {
    it('should sync data through all layers', async () => {
      const wrapper = new LocalStorageWrapper(new SyncStorageAdapter());
      
      // Set item through wrapper
      wrapper.setItem('testKey', 'testValue');
      
      // Verify it's in cache
      expect(wrapper._cache.testKey).toBe('testValue');
      
      // Verify it's in chrome.storage
      expect(chromeMock.storageSync.data.testKey).toBe('testValue');
      
      // Get item through wrapper
      const value = wrapper.getItem('testKey');
      expect(value).toBe('testValue');
    });

    it('should maintain consistency across operations', async () => {
      const wrapper = new LocalStorageWrapper(new SyncStorageAdapter());
      
      wrapper.setItem('key1', 'value1');
      wrapper.setItem('key2', 'value2');
      wrapper.removeItem('key1');
      
      expect(wrapper.getItem('key1')).toBeNull();
      expect(wrapper.getItem('key2')).toBe('value2');
      expect(wrapper.length).toBe(1);
      expect(chromeMock.storageSync.data.key1).toBeUndefined();
      expect(chromeMock.storageSync.data.key2).toBe('value2');
    });
  });
});

