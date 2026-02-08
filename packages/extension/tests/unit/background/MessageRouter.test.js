import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { MessageRouter } from '../../../src/background/MessageRouter.js';
import { LocalStorageAdapter } from '../../../src/storage/LocalStorageAdapter.js';
import { MESSAGE_ACTIONS } from '../../../src/constants/Constants.js';
import { createChromeMock, clearChromeMock } from '../../mocks/chrome-api.mock.js';

describe('MessageRouter', () => {
  let router;
  let chromeMock;

  beforeEach(() => {
    chromeMock = createChromeMock();
    router = new MessageRouter(new LocalStorageAdapter());
  });

  afterEach(() => {
    clearChromeMock();
  });

  describe('route', () => {
    it('should return false for unknown action', async () => {
      const request = { action: 'unknown' };
      const result = await router.route(request, {}, () => { });
      expect(result).toBe(false);
    });

    it('should return true for GET_STATUS action', async () => {
      chromeMock.storageLocal.data.enabled = true;
      const request = { action: MESSAGE_ACTIONS.GET_STATUS };
      const sendResponse = jest.fn();
      const result = await router.route(request, {}, sendResponse);
      expect(result).toBe(true);
    });
  });

  describe('_handleGetStatus', () => {
    it('should send enabled status', async () => {
      chromeMock.storageLocal.data.enabled = true;
      const sendResponse = jest.fn();
      await router._handleGetStatus(sendResponse);
      expect(sendResponse).toHaveBeenCalledWith({ enabled: true });
    });

    it('should send disabled status', async () => {
      chromeMock.storageLocal.data.enabled = false;
      const sendResponse = jest.fn();
      await router._handleGetStatus(sendResponse);
      expect(sendResponse).toHaveBeenCalledWith({ enabled: false });
    });
  });

  describe('_handleUpdateStatus', () => {
    it('should update and save state', async () => {
      const request = { enabled: true };
      const sendResponse = jest.fn();
      await router._handleUpdateStatus(request, sendResponse);
      expect(chromeMock.storageLocal.data.enabled).toBe(true);
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });
  });
});

