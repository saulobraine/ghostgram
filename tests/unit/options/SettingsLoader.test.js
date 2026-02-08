import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { SettingsLoader } from '../../../src/options/SettingsLoader.js';
import { SyncStorageAdapter } from '../../../src/storage/SyncStorageAdapter.js';
import { DEFAULT_SETTINGS } from '../../../src/constants/Constants.js';
import { createChromeMock, clearChromeMock } from '../../mocks/chrome-api.mock.js';
import { createDOMMock, clearDOMMock } from '../../mocks/dom.mock.js';

function createFormInputsMock() {
  const inputs = {};
  const allKeys = [
    'timeBetweenSearchCycles', 'timeToWaitAfterFiveSearchCycles',
    'timeBetweenUnfollows', 'timeToWaitAfterFiveUnfollows',
    'successMessageDuration', 'unfollowersPerPage',
    'withoutProfilePictureUrlIds', 'instagramGraphqlQueryHash',
    'instagramGraphqlBaseUrl', 'instagramUnfollowBaseUrl'
  ];
  allKeys.forEach(k => { inputs[`#${k}`] = { value: '' }; });
  const querySelector = jest.fn((id) => inputs[id] || null);
  return { inputs, querySelector };
}

describe('SettingsLoader', () => {
  let loader;
  let chromeMock;
  let domMock;

  beforeEach(() => {
    chromeMock = createChromeMock();
    domMock = createDOMMock();
    loader = new SettingsLoader(new SyncStorageAdapter());
  });

  afterEach(() => {
    clearChromeMock();
    clearDOMMock();
  });

  describe('load', () => {
    it('should load settings from storage', async () => {
      chromeMock.storageSync.data.timeBetweenSearchCycles = 2000;
      chromeMock.storageSync.data.timeToWaitAfterFiveSearchCycles = 20000;
      const settings = await loader.load();
      expect(settings.getTimeBetweenSearchCycles()).toBe(2000);
    });
  });

  describe('populateForm', () => {
    it('should populate form inputs with settings', () => {
      const formElement = domMock.mockDocument.createElement();
      const form = createFormInputsMock();
      formElement.querySelector = form.querySelector;

      const d = DEFAULT_SETTINGS;
      const settings = {
        getTimeBetweenSearchCycles: () => 2000,
        getTimeToWaitAfterFiveSearchCycles: () => 20000,
        getTimeBetweenUnfollows: () => 5000,
        getTimeToWaitAfterFiveUnfollows: () => 400000,
        getSuccessMessageDuration: () => d.successMessageDuration,
        getUnfollowersPerPage: () => d.unfollowersPerPage,
        getWithoutProfilePictureUrlIds: () => d.withoutProfilePictureUrlIds,
        getInstagramGraphqlQueryHash: () => d.instagramGraphqlQueryHash,
        getInstagramGraphqlBaseUrl: () => d.instagramGraphqlBaseUrl,
        getInstagramUnfollowBaseUrl: () => d.instagramUnfollowBaseUrl
      };
      loader.populateForm(settings, formElement);
      expect(form.inputs['#timeBetweenSearchCycles'].value).toBe(2000);
      expect(form.inputs['#timeToWaitAfterFiveSearchCycles'].value).toBe(20000);
      expect(form.inputs['#timeBetweenUnfollows'].value).toBe(5000);
      expect(form.inputs['#timeToWaitAfterFiveUnfollows'].value).toBe(400000);
    });
  });
});

