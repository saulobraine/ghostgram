import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { SettingsSaver } from '../../../src/options/SettingsSaver.js';
import { SyncStorageAdapter } from '../../../src/storage/SyncStorageAdapter.js';
import { DEFAULT_SETTINGS } from '../../../src/constants/Constants.js';
import { createChromeMock, clearChromeMock } from '../../mocks/chrome-api.mock.js';
import { createDOMMock, clearDOMMock } from '../../mocks/dom.mock.js';

function createFormMock(overrides = {}) {
  const d = DEFAULT_SETTINGS;
  const inputs = {
    '#timeBetweenSearchCycles': { value: String(overrides.timeBetweenSearchCycles ?? 2000) },
    '#timeToWaitAfterFiveSearchCycles': { value: String(overrides.timeToWaitAfterFiveSearchCycles ?? 20000) },
    '#timeBetweenUnfollows': { value: String(overrides.timeBetweenUnfollows ?? 5000) },
    '#timeToWaitAfterFiveUnfollows': { value: String(overrides.timeToWaitAfterFiveUnfollows ?? 400000) },
    '#successMessageDuration': { value: String(d.successMessageDuration) },
    '#unfollowersPerPage': { value: String(d.unfollowersPerPage) },
    '#withoutProfilePictureUrlIds': { value: d.withoutProfilePictureUrlIds.join(', ') },
    '#instagramGraphqlQueryHash': { value: d.instagramGraphqlQueryHash },
    '#instagramGraphqlBaseUrl': { value: d.instagramGraphqlBaseUrl },
    '#instagramUnfollowBaseUrl': { value: d.instagramUnfollowBaseUrl }
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
  });
});

