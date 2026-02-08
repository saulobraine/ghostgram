import { describe, it, expect, beforeEach } from '@jest/globals';
import { SyncStorageAdapter } from '../../../src/storage/SyncStorageAdapter.js';
import { createChromeMock, clearChromeMock } from '../../mocks/chrome-api.mock.js';

describe('SyncStorageAdapter', () => {
  let adapter;
  let chromeMock;

  beforeEach(() => {
    chromeMock = createChromeMock();
    adapter = new SyncStorageAdapter();
  });

  afterEach(() => {
    clearChromeMock();
  });

  describe('get', () => {
    it('should get value from chrome.storage.sync', async () => {
      chromeMock.storageSync.data.testKey = 'testValue';
      const value = await adapter.get('testKey');
      expect(value).toBe('testValue');
      expect(chromeMock.storageSync.get).toHaveBeenCalledWith(['testKey']);
    });

    it('should return null for non-existent key', async () => {
      const value = await adapter.get('nonExistent');
      expect(value).toBeNull();
    });
  });

  describe('set', () => {
    it('should set value in chrome.storage.sync', async () => {
      await adapter.set('testKey', 'testValue');
      expect(chromeMock.storageSync.set).toHaveBeenCalledWith({ testKey: 'testValue' });
      expect(chromeMock.storageSync.data.testKey).toBe('testValue');
    });
  });

  describe('remove', () => {
    it('should remove value from chrome.storage.sync', async () => {
      chromeMock.storageSync.data.testKey = 'testValue';
      await adapter.remove('testKey');
      expect(chromeMock.storageSync.remove).toHaveBeenCalledWith(['testKey']);
      expect(chromeMock.storageSync.data.testKey).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('should get all values from chrome.storage.sync', async () => {
      chromeMock.storageSync.data.key1 = 'value1';
      chromeMock.storageSync.data.key2 = 'value2';
      const all = await adapter.getAll();
      expect(all).toEqual({ key1: 'value1', key2: 'value2' });
      expect(chromeMock.storageSync.get).toHaveBeenCalledWith(null);
    });

    it('should return empty object when no data', async () => {
      const all = await adapter.getAll();
      expect(all).toEqual({});
    });
  });

  describe('clear', () => {
    it('should clear all data from chrome.storage.sync', async () => {
      chromeMock.storageSync.data.key1 = 'value1';
      chromeMock.storageSync.data.key2 = 'value2';
      await adapter.clear();
      expect(chromeMock.storageSync.clear).toHaveBeenCalled();
      expect(chromeMock.storageSync.data).toEqual({});
    });
  });
});

