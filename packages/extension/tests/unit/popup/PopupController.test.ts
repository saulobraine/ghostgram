import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { PopupController } from '../../../src/popup/PopupController.js';
import { createChromeMock, clearChromeMock } from '../../mocks/chrome-api.mock.js';
import { createDOMMock, clearDOMMock } from '../../mocks/dom.mock.js';

describe('PopupController', () => {
  let controller;
  let chromeMock;
  let domMock;
  let elements;

  beforeEach(() => {
    chromeMock = createChromeMock();
    domMock = createDOMMock();
    elements = {
      mainToggle: domMock.mockDocument.createElement(),
      statusBadge: domMock.mockDocument.createElement(),
      openInstagramBtn: domMock.mockDocument.createElement(),
      openSettingsBtn: domMock.mockDocument.createElement()
    };
    controller = new PopupController();
  });

  afterEach(() => {
    clearChromeMock();
    clearDOMMock();
  });

  describe('initialize', () => {
    it('should setup event listeners', () => {
      controller.initialize(elements);
      expect(elements.mainToggle.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
      expect(elements.openSettingsBtn.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });
  });

  describe('_handleToggle', () => {
    it('should toggle extension state', async () => {
      chromeMock.storageLocal.data.enabled = true;
      controller.initialize(elements);
      await controller._handleToggle();
      expect(chromeMock.storageLocal.data.enabled).toBe(false);
    });
  });

  describe('_updateStatusUI', () => {
    it('should update status badge when enabled', async () => {
      chromeMock.storageLocal.data.enabled = true;
      controller.initialize(elements);
      await controller._updateStatusUI();
      expect(elements.statusBadge.textContent).toBe('Ativo');
    });

    it('should update status badge when disabled', async () => {
      chromeMock.storageLocal.data.enabled = false;
      controller.initialize(elements);
      await controller._updateStatusUI();
      expect(elements.statusBadge.textContent).toBe('Inativo');
    });
  });
});

