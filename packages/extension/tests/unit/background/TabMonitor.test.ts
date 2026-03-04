import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { TabMonitor } from '../../../src/background/TabMonitor.js';
import { LocalStorageAdapter } from '../../../src/storage/LocalStorageAdapter.js';
import { createChromeMock, clearChromeMock } from '../../mocks/chrome-api.mock.js';

// Mock chrome.tabs.onUpdated
beforeEach(() => {
  if (global.chrome && global.chrome.tabs) {
    global.chrome.tabs.onUpdated = {
      addListener: jest.fn()
    };
  }
});

describe('TabMonitor', () => {
  let monitor;
  let chromeMock;

  beforeEach(() => {
    chromeMock = createChromeMock();
    monitor = new TabMonitor(new LocalStorageAdapter());
  });

  afterEach(() => {
    clearChromeMock();
  });

  describe('handle', () => {
    it('should not process incomplete tabs', async () => {
      const changeInfo = { status: 'loading' };
      const tab = { url: 'https://www.instagram.com' };
      await monitor.handle(1, changeInfo, tab);
      expect(chromeMock.storageLocal.get).not.toHaveBeenCalled();
    });

    it('should not process non-Instagram tabs', async () => {
      const changeInfo = { status: 'complete' };
      const tab = { url: 'https://www.google.com' };
      await monitor.handle(1, changeInfo, tab);
      expect(chromeMock.storageLocal.get).not.toHaveBeenCalled();
    });

    it('should check extension state for Instagram tabs', async () => {
      chromeMock.storageLocal.data.enabled = true;
      const changeInfo = { status: 'complete' };
      const tab = { url: 'https://www.instagram.com' };
      await monitor.handle(1, changeInfo, tab);
      expect(chromeMock.storageLocal.get).toHaveBeenCalled();
    });
  });

  describe('_isComplete', () => {
    it('should return true for complete status', () => {
      const changeInfo = { status: 'complete' };
      expect(monitor._isComplete(changeInfo)).toBe(true);
    });

    it('should return false for other statuses', () => {
      const changeInfo = { status: 'loading' };
      expect(monitor._isComplete(changeInfo)).toBe(false);
    });
  });

  describe('_isInstagramTab', () => {
    it('should return true for Instagram URL', () => {
      const tab = { url: 'https://www.instagram.com' };
      expect(monitor._isInstagramTab(tab)).toBe(true);
    });

    it('should return false for other URLs', () => {
      const tab = { url: 'https://www.google.com' };
      expect(monitor._isInstagramTab(tab)).toBe(false);
    });
  });
});

