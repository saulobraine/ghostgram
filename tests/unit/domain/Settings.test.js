import { describe, it, expect } from '@jest/globals';
import { Settings } from '../../../src/domain/Settings.js';
import { DEFAULT_SETTINGS } from '../../../src/constants/Constants.js';

describe('Settings', () => {
  describe('constructor', () => {
    it('should create settings with valid values', () => {
      const settings = new Settings(1000, 10000, 4000, 300000);
      expect(settings.getTimeBetweenSearchCycles()).toBe(1000);
      expect(settings.getTimeToWaitAfterFiveSearchCycles()).toBe(10000);
      expect(settings.getTimeBetweenUnfollows()).toBe(4000);
      expect(settings.getTimeToWaitAfterFiveUnfollows()).toBe(300000);
    });

    it('should throw error for invalid values', () => {
      expect(() => new Settings(-1, 10000, 4000, 300000)).toThrow();
      expect(() => new Settings(1000, 0, 4000, 300000)).toThrow();
      expect(() => new Settings(1000, 10000, null, 300000)).toThrow();
    });
  });

  describe('createDefault', () => {
    it('should create settings with default values', () => {
      const settings = Settings.createDefault();
      expect(settings.getTimeBetweenSearchCycles()).toBe(DEFAULT_SETTINGS.timeBetweenSearchCycles);
      expect(settings.getTimeToWaitAfterFiveSearchCycles()).toBe(DEFAULT_SETTINGS.timeToWaitAfterFiveSearchCycles);
      expect(settings.getTimeBetweenUnfollows()).toBe(DEFAULT_SETTINGS.timeBetweenUnfollows);
      expect(settings.getTimeToWaitAfterFiveUnfollows()).toBe(DEFAULT_SETTINGS.timeToWaitAfterFiveUnfollows);
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
      const settings = new Settings(1000, 10000, 4000, 300000);
      const obj = settings.toObject();
      expect(obj).toEqual({
        timeBetweenSearchCycles: 1000,
        timeToWaitAfterFiveSearchCycles: 10000,
        timeBetweenUnfollows: 4000,
        timeToWaitAfterFiveUnfollows: 300000
      });
    });
  });

  describe('getters', () => {
    it('should return correct values', () => {
      const settings = new Settings(1000, 10000, 4000, 300000);
      expect(settings.getTimeBetweenSearchCycles()).toBe(1000);
      expect(settings.getTimeToWaitAfterFiveSearchCycles()).toBe(10000);
      expect(settings.getTimeBetweenUnfollows()).toBe(4000);
      expect(settings.getTimeToWaitAfterFiveUnfollows()).toBe(300000);
    });
  });
});

