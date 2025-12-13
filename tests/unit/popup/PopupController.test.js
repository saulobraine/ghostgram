import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { PopupController } from '../../../src/popup/PopupController.js';
import { createChromeMock, clearChromeMock } from '../../mocks/chrome-api.mock.js';
import { createDOMMock, clearDOMMock } from '../../mocks/dom.mock.js';

describe('PopupController', () => {
  let controller;
  let chromeMock;
  let domMock;
  let statusElement;
  let toggleButton;
  let optionsButton;
  let optionsLink;

  beforeEach(() => {
    chromeMock = createChromeMock();
    domMock = createDOMMock();
    statusElement = domMock.mockDocument.createElement();
    toggleButton = domMock.mockDocument.createElement();
    optionsButton = domMock.mockDocument.createElement();
    optionsLink = domMock.mockDocument.createElement();
    controller = new PopupController();
  });

  afterEach(() => {
    clearChromeMock();
    clearDOMMock();
  });

  describe('initialize', () => {
    it('should setup event listeners', () => {
      controller.initialize(statusElement, toggleButton, optionsButton, optionsLink);
      expect(toggleButton.addEventListener).toHaveBeenCalled();
      expect(optionsButton.addEventListener).toHaveBeenCalled();
      expect(optionsLink.addEventListener).toHaveBeenCalled();
    });
  });

  describe('_handleToggle', () => {
    it('should toggle extension state', async () => {
      chromeMock.storageLocal.data.enabled = true;
      controller.initialize(statusElement, toggleButton, optionsButton, optionsLink);
      await controller._handleToggle();
      expect(chromeMock.storageLocal.data.enabled).toBe(false);
    });
  });

  describe('_openOptions', () => {
    it('should open options page', () => {
      controller.initialize(statusElement, toggleButton, optionsButton, optionsLink);
      controller._openOptions();
      expect(chromeMock.runtime.openOptionsPage).toHaveBeenCalled();
    });
  });

  describe('_updateStatus', () => {
    it('should update status element', async () => {
      chromeMock.storageLocal.data.enabled = true;
      controller.initialize(statusElement, toggleButton, optionsButton, optionsLink);
      await controller._updateStatus();
      expect(statusElement.textContent).toBe('Extension is Active');
    });
  });
});

