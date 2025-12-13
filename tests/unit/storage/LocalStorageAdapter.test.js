import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { LocalStorageAdapter } from '../../../src/storage/LocalStorageAdapter.js';
import { createChromeMock, clearChromeMock } from '../../mocks/chrome-api.mock.js';

describe('LocalStorageAdapter', () => {
  let adapter;
  let chromeMock;

  beforeEach(() => {
    chromeMock = createChromeMock();
    adapter = new LocalStorageAdapter();
  });

  afterEach(() => {
    clearChromeMock();
  });

  describe('get', () => {
    it('should get value from chrome.storage.local', async () => {
      chromeMock.storageLocal.data.testKey = 'testValue';
      const value = await adapter.get('testKey');
      expect(value).toBe('testValue');
      expect(chromeMock.storageLocal.get).toHaveBeenCalledWith(['testKey']);
    });

    it('should return null for non-existent key', async () => {
      const value = await adapter.get('nonExistent');
      expect(value).toBeNull();
    });
  });

  describe('set', () => {
    it('should set value in chrome.storage.local', async () => {
      await adapter.set('testKey', 'testValue');
      expect(chromeMock.storageLocal.set).toHaveBeenCalledWith({ testKey: 'testValue' });
      expect(chromeMock.storageLocal.data.testKey).toBe('testValue');
    });
  });

  describe('remove', () => {
    it('should remove value from chrome.storage.local', async () => {
      chromeMock.storageLocal.data.testKey = 'testValue';
      await adapter.remove('testKey');
      expect(chromeMock.storageLocal.remove).toHaveBeenCalledWith(['testKey']);
      expect(chromeMock.storageLocal.data.testKey).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('should get all values from chrome.storage.local', async () => {
      chromeMock.storageLocal.data.key1 = 'value1';
      chromeMock.storageLocal.data.key2 = 'value2';
      const all = await adapter.getAll();
      expect(all).toEqual({ key1: 'value1', key2: 'value2' });
      expect(chromeMock.storageLocal.get).toHaveBeenCalledWith(null);
    });
  });

  describe('clear', () => {
    it('should clear all data from chrome.storage.local', async () => {
      chromeMock.storageLocal.data.key1 = 'value1';
      await adapter.clear();
      expect(chromeMock.storageLocal.clear).toHaveBeenCalled();
      expect(chromeMock.storageLocal.data).toEqual({});
    });
  });
});

