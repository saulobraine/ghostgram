import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { PopupController } from '../../src/popup/PopupController.js';
import { ToggleHandler } from '../../src/popup/ToggleHandler.js';
import { StatusUpdater } from '../../src/popup/StatusUpdater.js';
import { ExtensionState } from '../../src/domain/ExtensionState.js';
import { LocalStorageAdapter } from '../../src/storage/LocalStorageAdapter.js';
import { createChromeMock, clearChromeMock } from '../mocks/chrome-api.mock.js';
import { createDOMMock, clearDOMMock } from '../mocks/dom.mock.js';

describe('Popup Integration', () => {
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

  describe('PopupController -> ToggleHandler -> StatusUpdater', () => {
    it('should handle complete toggle flow', async () => {
      chromeMock.storageLocal.data.enabled = true;
      
      const statusElement = domMock.mockDocument.createElement();
      const toggleButton = domMock.mockDocument.createElement();
      const optionsButton = domMock.mockDocument.createElement();
      const optionsLink = domMock.mockDocument.createElement();
      
      const controller = new PopupController();
      controller.initialize(statusElement, toggleButton, optionsButton, optionsLink);
      
      await controller._handleToggle();
      
      expect(chromeMock.storageLocal.data.enabled).toBe(false);
      expect(statusElement.textContent).toBe('Extension is Inactive');
    });

    it('should update status after toggle', async () => {
      chromeMock.storageLocal.data.enabled = false;
      
      const statusElement = domMock.mockDocument.createElement();
      const toggleButton = domMock.mockDocument.createElement();
      const optionsButton = domMock.mockDocument.createElement();
      const optionsLink = domMock.mockDocument.createElement();
      
      const controller = new PopupController();
      controller.initialize(statusElement, toggleButton, optionsButton, optionsLink);
      
      await controller._handleToggle();
      await controller._updateStatus();
      
      expect(statusElement.textContent).toBe('Extension is Active');
    });
  });
});

