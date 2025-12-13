import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { LocalStorageWrapper } from '../../../src/storage/LocalStorageWrapper.js';
import { SyncStorageAdapter } from '../../../src/storage/SyncStorageAdapter.js';
import { createChromeMock, clearChromeMock } from '../../mocks/chrome-api.mock.js';

describe('LocalStorageWrapper', () => {
  let wrapper;
  let chromeMock;

  beforeEach(() => {
    chromeMock = createChromeMock();
    wrapper = new LocalStorageWrapper();
  });

  afterEach(() => {
    clearChromeMock();
  });

  describe('getItem', () => {
    it('should get item from cache', () => {
      wrapper._cache.testKey = 'testValue';
      const value = wrapper.getItem('testKey');
      expect(value).toBe('testValue');
    });

    it('should return null for non-existent key', () => {
      const value = wrapper.getItem('nonExistent');
      expect(value).toBeNull();
    });
  });

  describe('setItem', () => {
    it('should set item in cache and storage', () => {
      wrapper.setItem('testKey', 'testValue');
      expect(wrapper._cache.testKey).toBe('testValue');
      expect(chromeMock.storageSync.set).toHaveBeenCalledWith({ testKey: 'testValue' });
    });
  });

  describe('removeItem', () => {
    it('should remove item from cache and storage', () => {
      wrapper._cache.testKey = 'testValue';
      wrapper.removeItem('testKey');
      expect(wrapper._cache.testKey).toBeUndefined();
      expect(chromeMock.storageSync.remove).toHaveBeenCalledWith(['testKey']);
    });
  });

  describe('clear', () => {
    it('should clear cache and storage', () => {
      wrapper._cache.key1 = 'value1';
      wrapper._cache.key2 = 'value2';
      wrapper.clear();
      expect(wrapper._cache).toEqual({});
      expect(chromeMock.storageSync.clear).toHaveBeenCalled();
      expect(wrapper._initialized).toBe(true);
    });
  });

  describe('length', () => {
    it('should return number of keys in cache', () => {
      wrapper._cache.key1 = 'value1';
      wrapper._cache.key2 = 'value2';
      expect(wrapper.length).toBe(2);
    });

    it('should return 0 for empty cache', () => {
      expect(wrapper.length).toBe(0);
    });
  });

  describe('key', () => {
    it('should return key at index', () => {
      wrapper._cache.key1 = 'value1';
      wrapper._cache.key2 = 'value2';
      expect(wrapper.key(0)).toBe('key1');
      expect(wrapper.key(1)).toBe('key2');
    });

    it('should return null for invalid index', () => {
      expect(wrapper.key(0)).toBeNull();
      wrapper._cache.key1 = 'value1';
      expect(wrapper.key(1)).toBeNull();
    });
  });
});

