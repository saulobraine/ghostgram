import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { SettingsSaver } from '../../../src/options/SettingsSaver.js';
import { SyncStorageAdapter } from '../../../src/storage/SyncStorageAdapter.js';
import { createChromeMock, clearChromeMock } from '../../mocks/chrome-api.mock.js';
import { createDOMMock, clearDOMMock } from '../../mocks/dom.mock.js';

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
      const settings = saver._extractFromForm(formElement);
      expect(settings.getTimeBetweenSearchCycles()).toBe(2000);
      expect(settings.getTimeToWaitAfterFiveSearchCycles()).toBe(20000);
    });
  });
});

