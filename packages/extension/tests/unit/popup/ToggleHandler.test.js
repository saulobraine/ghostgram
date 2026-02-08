import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ToggleHandler } from '../../../src/popup/ToggleHandler.js';
import { ExtensionState } from '../../../src/domain/ExtensionState.js';
import { LocalStorageAdapter } from '../../../src/storage/LocalStorageAdapter.js';
import { createChromeMock, clearChromeMock } from '../../mocks/chrome-api.mock.js';

describe('ToggleHandler', () => {
  let handler;
  let chromeMock;

  beforeEach(() => {
    chromeMock = createChromeMock();
    handler = new ToggleHandler(new LocalStorageAdapter());
  });

  afterEach(() => {
    clearChromeMock();
  });

  describe('toggle', () => {
    it('should toggle from enabled to disabled', async () => {
      chromeMock.storageLocal.data.enabled = true;
      await handler.toggle();
      expect(chromeMock.storageLocal.data.enabled).toBe(false);
    });

    it('should toggle from disabled to enabled', async () => {
      chromeMock.storageLocal.data.enabled = false;
      await handler.toggle();
      expect(chromeMock.storageLocal.data.enabled).toBe(true);
    });
  });

  describe('_getCurrentState', () => {
    it('should get current state from storage', async () => {
      chromeMock.storageLocal.data.enabled = true;
      const state = await handler._getCurrentState();
      expect(state.isEnabled()).toBe(true);
    });
  });

  describe('_saveState', () => {
    it('should save state to storage', async () => {
      const state = ExtensionState.createEnabled();
      await handler._saveState(state);
      expect(chromeMock.storageLocal.data.enabled).toBe(true);
    });
  });

  describe('_notifyContentScript', () => {
    it('should send message to active tab', async () => {
      chromeMock.storageLocal.data.enabled = true;
      await handler._notifyContentScript();
      expect(chromeMock.tabs.query).toHaveBeenCalled();
      expect(chromeMock.tabs.sendMessage).toHaveBeenCalled();
    });
  });
});

