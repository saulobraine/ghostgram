import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { SettingsLoader } from '../../../src/options/SettingsLoader.js';
import { SyncStorageAdapter } from '../../../src/storage/SyncStorageAdapter.js';
import { createChromeMock, clearChromeMock } from '../../mocks/chrome-api.mock.js';
import { createDOMMock, clearDOMMock } from '../../mocks/dom.mock.js';

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
      const input1 = { value: '' };
      const input2 = { value: '' };
      const input3 = { value: '' };
      const input4 = { value: '' };
      formElement.querySelector = jest.fn((id) => {
        if (id === '#timeBetweenSearchCycles') return input1;
        if (id === '#timeToWaitAfterFiveSearchCycles') return input2;
        if (id === '#timeBetweenUnfollows') return input3;
        if (id === '#timeToWaitAfterFiveUnfollows') return input4;
        return null;
      });
      const settings = {
        getTimeBetweenSearchCycles: () => 2000,
        getTimeToWaitAfterFiveSearchCycles: () => 20000,
        getTimeBetweenUnfollows: () => 5000,
        getTimeToWaitAfterFiveUnfollows: () => 400000
      };
      loader.populateForm(settings, formElement);
      expect(input1.value).toBe(2000);
      expect(input2.value).toBe(20000);
      expect(input3.value).toBe(5000);
      expect(input4.value).toBe(400000);
    });
  });
});

