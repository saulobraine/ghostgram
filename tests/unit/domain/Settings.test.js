import { describe, it, expect } from '@jest/globals';
import { Settings } from '../../../src/domain/Settings.js';
import { DEFAULT_SETTINGS } from '../../../src/constants/Constants.js';

// Helper para criar Settings com todos os 10 parâmetros
function createSettings(overrides = {}) {
  const d = DEFAULT_SETTINGS;
  const has = (k) => Object.prototype.hasOwnProperty.call(overrides, k);
  return new Settings(
    has('timeBetweenSearchCycles') ? overrides.timeBetweenSearchCycles : 1000,
    has('timeToWaitAfterFiveSearchCycles') ? overrides.timeToWaitAfterFiveSearchCycles : 10000,
    has('timeBetweenUnfollows') ? overrides.timeBetweenUnfollows : 4000,
    has('timeToWaitAfterFiveUnfollows') ? overrides.timeToWaitAfterFiveUnfollows : 300000,
    has('successMessageDuration') ? overrides.successMessageDuration : d.successMessageDuration,
    has('unfollowersPerPage') ? overrides.unfollowersPerPage : d.unfollowersPerPage,
    has('withoutProfilePictureUrlIds') ? overrides.withoutProfilePictureUrlIds : [...d.withoutProfilePictureUrlIds],
    has('instagramGraphqlQueryHash') ? overrides.instagramGraphqlQueryHash : d.instagramGraphqlQueryHash,
    has('instagramGraphqlBaseUrl') ? overrides.instagramGraphqlBaseUrl : d.instagramGraphqlBaseUrl,
    has('instagramUnfollowBaseUrl') ? overrides.instagramUnfollowBaseUrl : d.instagramUnfollowBaseUrl
  );
}

describe('Settings', () => {
  describe('constructor', () => {
    it('should create settings with valid values', () => {
      const settings = createSettings();
      expect(settings.getTimeBetweenSearchCycles()).toBe(1000);
      expect(settings.getTimeToWaitAfterFiveSearchCycles()).toBe(10000);
      expect(settings.getTimeBetweenUnfollows()).toBe(4000);
      expect(settings.getTimeToWaitAfterFiveUnfollows()).toBe(300000);
    });

    it('should throw error for invalid values', () => {
      expect(() => createSettings({ timeBetweenSearchCycles: -1 })).toThrow();
      expect(() => createSettings({ timeToWaitAfterFiveSearchCycles: 0 })).toThrow();
      expect(() => createSettings({ timeBetweenUnfollows: null })).toThrow();
    });
  });

  describe('createDefault', () => {
    it('should create settings with default values', () => {
      const settings = Settings.createDefault();
      expect(settings.getTimeBetweenSearchCycles()).toBe(DEFAULT_SETTINGS.timeBetweenSearchCycles);
      expect(settings.getTimeToWaitAfterFiveSearchCycles()).toBe(DEFAULT_SETTINGS.timeToWaitAfterFiveSearchCycles);
      expect(settings.getTimeBetweenUnfollows()).toBe(DEFAULT_SETTINGS.timeBetweenUnfollows);
      expect(settings.getTimeToWaitAfterFiveUnfollows()).toBe(DEFAULT_SETTINGS.timeToWaitAfterFiveUnfollows);
      expect(settings.getSuccessMessageDuration()).toBe(DEFAULT_SETTINGS.successMessageDuration);
      expect(settings.getUnfollowersPerPage()).toBe(DEFAULT_SETTINGS.unfollowersPerPage);
    });
  });

  describe('fromObject', () => {
    it('should create settings from object', () => {
      const obj = {
        timeBetweenSearchCycles: 2000,
        timeToWaitAfterFiveSearchCycles: 20000,
        timeBetweenUnfollows: 5000,
        timeToWaitAfterFiveUnfollows: 400000
      };
      const settings = Settings.fromObject(obj);
      expect(settings.getTimeBetweenSearchCycles()).toBe(2000);
      expect(settings.getTimeToWaitAfterFiveSearchCycles()).toBe(20000);
      expect(settings.getTimeBetweenUnfollows()).toBe(5000);
      expect(settings.getTimeToWaitAfterFiveUnfollows()).toBe(400000);
    });

    it('should use defaults for missing values', () => {
      const obj = {
        timeBetweenSearchCycles: 2000
      };
      const settings = Settings.fromObject(obj);
      expect(settings.getTimeBetweenSearchCycles()).toBe(2000);
      expect(settings.getTimeToWaitAfterFiveSearchCycles()).toBe(DEFAULT_SETTINGS.timeToWaitAfterFiveSearchCycles);
    });

    it('should use defaults for empty object', () => {
      const settings = Settings.fromObject({});
      expect(settings.getTimeBetweenSearchCycles()).toBe(DEFAULT_SETTINGS.timeBetweenSearchCycles);
    });
  });

  describe('toObject', () => {
    it('should convert settings to object', () => {
      const settings = createSettings();
      const obj = settings.toObject();
      expect(obj.timeBetweenSearchCycles).toBe(1000);
      expect(obj.timeToWaitAfterFiveSearchCycles).toBe(10000);
      expect(obj.timeBetweenUnfollows).toBe(4000);
      expect(obj.timeToWaitAfterFiveUnfollows).toBe(300000);
      expect(obj.successMessageDuration).toBeDefined();
      expect(obj.unfollowersPerPage).toBeDefined();
      expect(obj.instagramGraphqlQueryHash).toBeDefined();
      expect(obj.instagramGraphqlBaseUrl).toBeDefined();
      expect(obj.instagramUnfollowBaseUrl).toBeDefined();
    });
  });

  describe('getters', () => {
    it('should return correct values', () => {
      const settings = createSettings({ timeBetweenSearchCycles: 1500 });
      expect(settings.getTimeBetweenSearchCycles()).toBe(1500);
      expect(settings.getTimeToWaitAfterFiveSearchCycles()).toBe(10000);
      expect(settings.getTimeBetweenUnfollows()).toBe(4000);
      expect(settings.getTimeToWaitAfterFiveUnfollows()).toBe(300000);
      expect(settings.getSuccessMessageDuration()).toBe(DEFAULT_SETTINGS.successMessageDuration);
      expect(settings.getUnfollowersPerPage()).toBe(DEFAULT_SETTINGS.unfollowersPerPage);
      expect(settings.getInstagramGraphqlQueryHash()).toBe(DEFAULT_SETTINGS.instagramGraphqlQueryHash);
    });
  });
});

