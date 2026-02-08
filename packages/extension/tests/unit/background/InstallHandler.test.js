import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { InstallHandler } from '../../../src/background/InstallHandler.js';
import { LocalStorageAdapter } from '../../../src/storage/LocalStorageAdapter.js';
import { SyncStorageAdapter } from '../../../src/storage/SyncStorageAdapter.js';
import { createChromeMock, clearChromeMock } from '../../mocks/chrome-api.mock.js';

describe('InstallHandler', () => {
  let handler;
  let chromeMock;

  beforeEach(() => {
    chromeMock = createChromeMock();
    handler = new InstallHandler(new LocalStorageAdapter(), new SyncStorageAdapter());
  });

  afterEach(() => {
    clearChromeMock();
  });

  describe('handle', () => {
    it('should initialize extension on install', async () => {
      const details = { reason: 'install' };
      await handler.handle(details);
      expect(chromeMock.storageLocal.data.enabled).toBe(true);
      expect(chromeMock.storageSync.data.timeBetweenSearchCycles).toBeDefined();
    });

    it('should not initialize on update', async () => {
      chromeMock.storageLocal.data.enabled = false;
      const details = { reason: 'update' };
      await handler.handle(details);
      expect(chromeMock.storageLocal.data.enabled).toBe(false);
    });
  });

  describe('_isInstall', () => {
    it('should return true for install reason', () => {
      const details = { reason: 'install' };
      expect(handler._isInstall(details)).toBe(true);
    });

    it('should return false for other reasons', () => {
      const details = { reason: 'update' };
      expect(handler._isInstall(details)).toBe(false);
    });
  });

  describe('_initializeExtension', () => {
    it('should set default state and settings', async () => {
      await handler._initializeExtension();
      expect(chromeMock.storageLocal.data.enabled).toBe(true);
      expect(chromeMock.storageSync.data.timeBetweenSearchCycles).toBeDefined();
    });
  });

  describe('_setDefaultState', () => {
    it('should set enabled state to true', async () => {
      await handler._setDefaultState();
      expect(chromeMock.storageLocal.data.enabled).toBe(true);
    });
  });

  describe('_setDefaultSettings', () => {
    it('should set default settings', async () => {
      await handler._setDefaultSettings();
      expect(chromeMock.storageSync.data.timeBetweenSearchCycles).toBe(1000);
      expect(chromeMock.storageSync.data.timeToWaitAfterFiveSearchCycles).toBe(10000);
      expect(chromeMock.storageSync.data.timeBetweenUnfollows).toBe(4000);
      expect(chromeMock.storageSync.data.timeToWaitAfterFiveUnfollows).toBe(300000);
    });
  });
});

