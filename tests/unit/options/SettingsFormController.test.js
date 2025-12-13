import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { SettingsFormController } from '../../../src/options/SettingsFormController.js';
import { createChromeMock, clearChromeMock } from '../../mocks/chrome-api.mock.js';
import { createDOMMock, clearDOMMock } from '../../mocks/dom.mock.js';

describe('SettingsFormController', () => {
  let controller;
  let chromeMock;
  let domMock;
  let formElement;
  let cancelButton;
  let successElement;

  beforeEach(() => {
    chromeMock = createChromeMock();
    domMock = createDOMMock();
    formElement = domMock.mockDocument.createElement();
    cancelButton = domMock.mockDocument.createElement();
    successElement = domMock.mockDocument.createElement();
    controller = new SettingsFormController();
  });

  afterEach(() => {
    clearChromeMock();
    clearDOMMock();
  });

  describe('initialize', () => {
    it('should setup form submit handler', () => {
      controller.initialize(formElement, cancelButton, successElement);
      expect(formElement.addEventListener).toHaveBeenCalledWith('submit', expect.any(Function));
    });

    it('should setup cancel button handler', () => {
      controller.initialize(formElement, cancelButton, successElement);
      expect(cancelButton.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });
  });

  describe('_handleSubmit', () => {
    it('should save settings and show success message', async () => {
      const input1 = { value: '2000' };
      const input2 = { value: '20000' };
      const input3 = { value: '5000' };
      const input4 = { value: '400000' };
      formElement.querySelector = jest.fn((id) => {
        if (id === '#timeBetweenSearchCycles') return input1;
        if (id === '#timeToWaitAfterFiveSearchCycles') return input2;
        if (id === '#timeBetweenUnfollows') return input3;
        if (id === '#timeToWaitAfterFiveUnfollows') return input4;
        return null;
      });
      controller.initialize(formElement, cancelButton, successElement);
      await controller._handleSubmit(formElement);
      expect(successElement.classList.add).toHaveBeenCalledWith('show');
    });
  });

  describe('_loadAndPopulate', () => {
    it('should load and populate form with settings', async () => {
      chromeMock.storageSync.data.timeBetweenSearchCycles = 2000;
      const input = { value: '' };
      formElement.querySelector = jest.fn(() => input);
      controller.initialize(formElement, cancelButton, successElement);
      await controller._loadAndPopulate(formElement);
      expect(input.value).toBe('2000');
    });
  });
});

