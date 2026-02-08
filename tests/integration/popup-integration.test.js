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
      
      const elements = {
        mainToggle: domMock.mockDocument.createElement(),
        statusBadge: domMock.mockDocument.createElement(),
        openInstagramBtn: domMock.mockDocument.createElement(),
        openSettingsBtn: domMock.mockDocument.createElement()
      };
      
      const controller = new PopupController();
      controller.initialize(elements);
      
      await controller._handleToggle();
      
      expect(chromeMock.storageLocal.data.enabled).toBe(false);
    });

    it('should update status after toggle', async () => {
      chromeMock.storageLocal.data.enabled = false;
      
      const elements = {
        mainToggle: domMock.mockDocument.createElement(),
        statusBadge: domMock.mockDocument.createElement(),
        openInstagramBtn: domMock.mockDocument.createElement(),
        openSettingsBtn: domMock.mockDocument.createElement()
      };
      
      const controller = new PopupController();
      controller.initialize(elements);
      
      await controller._handleToggle();
      await controller._updateStatusUI();
      
      expect(elements.statusBadge.textContent).toBe('Ativo');
    });
  });
});

