import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { SettingsFormController } from '../../../src/options/SettingsFormController.js';
import { DEFAULT_SETTINGS, SETTINGS_KEYS } from '../../../src/constants/Constants.js';
import { createChromeMock, clearChromeMock } from '../../mocks/chrome-api.mock.js';
import { createDOMMock, clearDOMMock } from '../../mocks/dom.mock.js';

function createFormInputsMock() {
  const d = DEFAULT_SETTINGS;
  const inputs = {
    [`#${SETTINGS_KEYS.TIME_BETWEEN_SEARCH_CYCLES}`]: { value: '2000' },
    [`#${SETTINGS_KEYS.TIME_TO_WAIT_AFTER_FIVE_SEARCH_CYCLES}`]: { value: '20000' },
    [`#${SETTINGS_KEYS.TIME_BETWEEN_UNFOLLOWS}`]: { value: '5000' },
    [`#${SETTINGS_KEYS.TIME_TO_WAIT_AFTER_FIVE_UNFOLLOWS}`]: { value: '400000' },
    [`#${SETTINGS_KEYS.SUCCESS_MESSAGE_DURATION}`]: { value: String(d.successMessageDuration) },
    [`#${SETTINGS_KEYS.UNFOLLOWERS_PER_PAGE}`]: { value: String(d.unfollowersPerPage) },
    [`#${SETTINGS_KEYS.UNFOLLOWS_PER_CYCLE}`]: { value: String(d.unfollowsPerCycle) },
    [`#${SETTINGS_KEYS.WITHOUT_PROFILE_PICTURE_URL_IDS}`]: { value: d.withoutProfilePictureUrlIds.join(', ') },
    [`#${SETTINGS_KEYS.INSTAGRAM_GRAPHQL_QUERY_HASH}`]: { value: d.instagramGraphqlQueryHash },
    [`#${SETTINGS_KEYS.INSTAGRAM_GRAPHQL_BASE_URL}`]: { value: d.instagramGraphqlBaseUrl },
    [`#${SETTINGS_KEYS.INSTAGRAM_UNFOLLOW_BASE_URL}`]: { value: d.instagramUnfollowBaseUrl }
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
      expect(successElement.classList.add).toHaveBeenCalledWith('options-toast--visible');
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

