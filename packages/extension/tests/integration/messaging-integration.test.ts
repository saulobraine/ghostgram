import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { MessageHandler } from '../../src/messaging/MessageHandler.js';
import { ExtensionState } from '../../src/domain/ExtensionState.js';
import { LocalStorageAdapter } from '../../src/storage/LocalStorageAdapter.js';
import { MESSAGE_ACTIONS } from '../../src/constants/Constants.js';
import { createChromeMock, clearChromeMock } from '../mocks/chrome-api.mock.js';
import { createDOMMock, clearDOMMock } from '../mocks/dom.mock.js';

describe('Messaging Integration', () => {
  let chromeMock;
  let domMock;

  beforeEach(() => {
    chromeMock = createChromeMock();
    domMock = createDOMMock();
  });

  afterEach(() => {
    clearChromeMock();
    clearDOMMock();
  });

  describe('MessageHandler -> ExtensionState -> StorageAdapter', () => {
    it('should handle complete message flow', async () => {
      const handler = new MessageHandler(new LocalStorageAdapter());
      chromeMock.storageLocal.data.enabled = true;

      const request = { action: MESSAGE_ACTIONS.GET_STATUS };
      const sendResponse = jest.fn();

      await new Promise(resolve => {
        handler.handle(request, {}, (response) => {
          sendResponse(response);
          resolve();
        });
      });

      expect(sendResponse).toHaveBeenCalledWith({ enabled: true });
    });

    it('should toggle state through complete flow', async () => {
      const handler = new MessageHandler(new LocalStorageAdapter());
      chromeMock.storageLocal.data.enabled = true;

      const request = { action: MESSAGE_ACTIONS.TOGGLE };
      const sendResponse = jest.fn();

      await new Promise(resolve => {
        handler.handle(request, {}, (response) => {
          sendResponse(response);
          resolve();
        });
      });

      expect(chromeMock.storageLocal.data.enabled).toBe(false);
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
      expect(global.location.reload).toHaveBeenCalled();
    });
  });
});

