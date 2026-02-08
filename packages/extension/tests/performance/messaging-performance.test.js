// Performance tests for messaging operations
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { MessageHandler } from '../../src/messaging/MessageHandler.js';
import { LocalStorageAdapter } from '../../src/storage/LocalStorageAdapter.js';
import { createChromeMock, clearChromeMock } from '../mocks/chrome-api.mock.js';

describe('Messaging Performance', () => {
  let chromeMock;
  let handler;

  beforeEach(() => {
    chromeMock = createChromeMock();
    handler = new MessageHandler(new LocalStorageAdapter());
  });

  afterEach(() => {
    clearChromeMock();
  });

  describe('MessageHandler Performance', () => {
    it('should handle multiple getStatus requests efficiently', async () => {
      chromeMock.storageLocal.data.enabled = true;
      
      const startTime = performance.now();
      
      const promises = [];
      for (let i = 0; i < 50; i++) {
        const sendResponse = jest.fn();
        promises.push(
          handler.handle({ action: 'getStatus' }, {}, sendResponse)
        );
      }
      
      await Promise.all(promises);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(500);
    });

    it('should handle rapid toggle operations', async () => {
      chromeMock.storageLocal.data.enabled = true;
      
      const startTime = performance.now();
      
      for (let i = 0; i < 10; i++) {
        const sendResponse = jest.fn();
        await handler.handle({ action: 'toggle' }, {}, sendResponse);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(1000);
    });
  });
});

