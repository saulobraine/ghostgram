import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { SettingsSaver } from '../../../src/options/SettingsSaver.js';
import { SyncStorageAdapter } from '../../../src/storage/SyncStorageAdapter.js';
import { DEFAULT_SETTINGS } from '../../../src/constants/Constants.js';
import { SETTINGS_KEYS } from '../../../src/constants/Constants.js';
import { createChromeMock, clearChromeMock } from '../../mocks/chrome-api.mock.js';
import { createDOMMock, clearDOMMock } from '../../mocks/dom.mock.js';

function createInput(value, readOnly = false) {
  return {
    value,
    hasAttribute: jest.fn((attribute) => readOnly && attribute === 'readonly')
  };
}

function createFormMock(overrides = {}) {
  const d = DEFAULT_SETTINGS;
  const inputs = {
    [`#${SETTINGS_KEYS.TIME_BETWEEN_SEARCH_CYCLES}`]: createInput(String(overrides.timeBetweenSearchCycles ?? 2000)),
    [`#${SETTINGS_KEYS.TIME_TO_WAIT_AFTER_FIVE_SEARCH_CYCLES}`]: createInput(String(overrides.timeToWaitAfterFiveSearchCycles ?? 20000)),
    [`#${SETTINGS_KEYS.TIME_BETWEEN_UNFOLLOWS}`]: createInput(String(overrides.timeBetweenUnfollows ?? 5000)),
    [`#${SETTINGS_KEYS.TIME_TO_WAIT_AFTER_FIVE_UNFOLLOWS}`]: createInput(String(overrides.timeToWaitAfterFiveUnfollows ?? 400000)),
    [`#${SETTINGS_KEYS.SUCCESS_MESSAGE_DURATION}`]: createInput(String(d.successMessageDuration)),
    [`#${SETTINGS_KEYS.UNFOLLOWERS_PER_PAGE}`]: createInput(String(d.unfollowersPerPage)),
    [`#${SETTINGS_KEYS.UNFOLLOWS_PER_CYCLE}`]: createInput(String(d.unfollowsPerCycle)),
    [`#${SETTINGS_KEYS.WITHOUT_PROFILE_PICTURE_URL_IDS}`]: createInput(d.withoutProfilePictureUrlIds.join(', ')),
    [`#${SETTINGS_KEYS.INSTAGRAM_GRAPHQL_QUERY_HASH}`]: createInput(d.instagramGraphqlQueryHash, true),
    [`#${SETTINGS_KEYS.INSTAGRAM_GRAPHQL_BASE_URL}`]: createInput(d.instagramGraphqlBaseUrl, true),
    [`#${SETTINGS_KEYS.INSTAGRAM_UNFOLLOW_BASE_URL}`]: createInput(d.instagramUnfollowBaseUrl, true)
  };
  return { inputs, querySelector: jest.fn((id) => inputs[id] || null) };
}

describe('SettingsSaver', () => {
  let saver;
  let chromeMock;
  let domMock;

  beforeEach(() => {
    chromeMock = createChromeMock();
    domMock = createDOMMock();
    saver = new SettingsSaver(new SyncStorageAdapter());
  });

  afterEach(() => {
    clearChromeMock();
    clearDOMMock();
  });

  describe('saveFromForm', () => {
    it('should extract and save settings from form', async () => {
      const formElement = domMock.mockDocument.createElement();
      const form = createFormMock();
      formElement.querySelector = form.querySelector;
      await saver.saveFromForm(formElement);
      expect(chromeMock.storageSync.data.timeBetweenSearchCycles).toBe(2000);
      expect(chromeMock.storageSync.data.timeToWaitAfterFiveSearchCycles).toBe(20000);
      expect(chromeMock.storageSync.data.timeBetweenUnfollows).toBe(5000);
      expect(chromeMock.storageSync.data.timeToWaitAfterFiveUnfollows).toBe(400000);
    });
  });

  describe('_extractFromForm', () => {
    it('should extract settings from form inputs', () => {
      const formElement = domMock.mockDocument.createElement();
      const form = createFormMock();
      formElement.querySelector = form.querySelector;
      const settings = saver._extractFromForm(formElement);
      expect(settings.getTimeBetweenSearchCycles()).toBe(2000);
      expect(settings.getTimeToWaitAfterFiveSearchCycles()).toBe(20000);
    });

    it('should preserve protected instagram settings', () => {
      const formElement = domMock.mockDocument.createElement();
      const form = createFormMock();
      formElement.querySelector = form.querySelector;
      const settings = saver._extractFromForm(formElement);
      expect(settings.getInstagramGraphqlQueryHash()).toBe(DEFAULT_SETTINGS.instagramGraphqlQueryHash);
      expect(settings.getInstagramGraphqlBaseUrl()).toBe(DEFAULT_SETTINGS.instagramGraphqlBaseUrl);
      expect(settings.getInstagramUnfollowBaseUrl()).toBe(DEFAULT_SETTINGS.instagramUnfollowBaseUrl);
    });
  });
});
