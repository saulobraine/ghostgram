import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { MessageHandler } from '../../../src/messaging/MessageHandler.js';
import { ExtensionState } from '../../../src/domain/ExtensionState.js';
import { LocalStorageAdapter } from '../../../src/storage/LocalStorageAdapter.js';
import { MESSAGE_ACTIONS } from '../../../src/constants/Constants.js';
import { createChromeMock, clearChromeMock } from '../../mocks/chrome-api.mock.js';
import { createDOMMock, clearDOMMock } from '../../mocks/dom.mock.js';

describe('MessageHandler', () => {
  let handler;
  let chromeMock;
  let domMock;

  beforeEach(() => {
    chromeMock = createChromeMock();
    domMock = createDOMMock();
    handler = new MessageHandler(new LocalStorageAdapter());
  });

  afterEach(() => {
    clearChromeMock();
    clearDOMMock();
  });

  describe('handle', () => {
    it('should return false for unknown action', () => {
      const request = { action: 'unknown' };
      const result = handler.handle(request, {}, () => { });
      expect(result).toBe(false);
    });

    it('should return true for known action', () => {
      chromeMock.storageLocal.data.enabled = true;
      const request = { action: MESSAGE_ACTIONS.GET_STATUS };
      const sendResponse = jest.fn();
      const result = handler.handle(request, {}, sendResponse);
      expect(result).toBe(true);
    });
  });

  describe('_handleToggle', () => {
    it('should toggle state and reload page', async () => {
      chromeMock.storageLocal.data.enabled = true;
      const sendResponse = jest.fn();
      await new Promise(resolve => {
        handler._handleToggle((response) => {
          sendResponse(response);
          resolve();
        });
      });
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
      expect(global.location.reload).toHaveBeenCalled();
    });
  });

  describe('_handleGetStatus', () => {
    it('should return enabled status', async () => {
      chromeMock.storageLocal.data.enabled = true;
      const sendResponse = jest.fn();
      await new Promise(resolve => {
        handler._handleGetStatus((response) => {
          sendResponse(response);
          resolve();
        });
      });
      expect(sendResponse).toHaveBeenCalledWith({ enabled: true });
    });

    it('should return disabled status', async () => {
      chromeMock.storageLocal.data.enabled = false;
      const sendResponse = jest.fn();
      await new Promise(resolve => {
        handler._handleGetStatus((response) => {
          sendResponse(response);
          resolve();
        });
      });
      expect(sendResponse).toHaveBeenCalledWith({ enabled: false });
    });
  });

  describe('_handleUpdateStatus', () => {
    it('should update state and send success response', async () => {
      const request = { enabled: true };
      const sendResponse = jest.fn();
      await new Promise(resolve => {
        handler._handleUpdateStatus(request, (response) => {
          sendResponse(response);
          resolve();
        });
      });
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
      expect(chromeMock.storageLocal.data.enabled).toBe(true);
    });
  });
});

