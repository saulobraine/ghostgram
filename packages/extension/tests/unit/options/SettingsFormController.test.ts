import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { SettingsFormController } from '../../../src/options/SettingsFormController.js';
import { DEFAULT_SETTINGS } from '../../../src/constants/Constants.js';
import { createChromeMock, clearChromeMock } from '../../mocks/chrome-api.mock.js';
import { createDOMMock, clearDOMMock } from '../../mocks/dom.mock.js';

function createFormInputsMock() {
  const d = DEFAULT_SETTINGS;
  const inputs = {
    '#timeBetweenSearchCycles': { value: '2000' },
    '#timeToWaitAfterFiveSearchCycles': { value: '20000' },
    '#timeBetweenUnfollows': { value: '5000' },
    '#timeToWaitAfterFiveUnfollows': { value: '400000' },
    '#successMessageDuration': { value: String(d.successMessageDuration) },
    '#unfollowersPerPage': { value: String(d.unfollowersPerPage) },
    '#withoutProfilePictureUrlIds': { value: d.withoutProfilePictureUrlIds.join(', ') },
    '#instagramGraphqlQueryHash': { value: d.instagramGraphqlQueryHash },
    '#instagramGraphqlBaseUrl': { value: d.instagramGraphqlBaseUrl },
    '#instagramUnfollowBaseUrl': { value: d.instagramUnfollowBaseUrl }
  };
  return jest.fn((id) => inputs[id] || null);
}

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
    formElement = domMock.mockDocument.createElement('form');
    cancelButton = domMock.mockDocument.createElement('button');
    successElement = domMock.mockDocument.createElement('div');
    controller = new SettingsFormController();
  });

  afterEach(() => {
    clearChromeMock();
    clearDOMMock();
  });

  describe('initialize', () => {
    it('should setup form submit handler', () => {
      formElement.querySelector = createFormInputsMock();
      controller.initialize(formElement, cancelButton, successElement);
      expect(formElement.addEventListener).toHaveBeenCalledWith('submit', expect.any(Function));
    });

    it('should setup cancel button handler', () => {
      formElement.querySelector = createFormInputsMock();
      controller.initialize(formElement, cancelButton, successElement);
      expect(cancelButton.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });
  });

  describe('_handleSubmit', () => {
    it('should save settings and show success message', async () => {
      formElement.querySelector = createFormInputsMock();
      controller.initialize(formElement, cancelButton, successElement);
      await controller._handleSubmit(formElement);
      expect(successElement.classList.add).toHaveBeenCalledWith('show');
    });
  });

  describe('_loadAndPopulate', () => {
    it('should load and populate form with settings', async () => {
      chromeMock.storageSync.data.timeBetweenSearchCycles = 2000;
      formElement.querySelector = createFormInputsMock();
      controller.initialize(formElement, cancelButton, successElement);
      await controller._loadAndPopulate(formElement);
      // After populate, querySelector should have been called for all settings
      expect(formElement.querySelector).toHaveBeenCalled();
    });
  });
});

