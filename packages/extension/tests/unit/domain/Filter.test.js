import { describe, it, expect } from '@jest/globals';
import { Filter } from '../../../src/bundle/domain/Filter.js';

describe('Filter', () => {
  describe('constructor', () => {
    it('should create filter with valid values', () => {
      const filter = new Filter(true, false, true, false, true);

      expect(filter.showNonFollowers()).toBe(true);
      expect(filter.showFollowers()).toBe(false);
      expect(filter.showVerified()).toBe(true);
      expect(filter.showPrivate()).toBe(false);
      expect(filter.showWithOutProfilePicture()).toBe(true);
    });

    it('should convert values to boolean', () => {
      const filter = new Filter(1, 0, 'truthy', null, undefined);

      expect(filter.showNonFollowers()).toBe(true);
      expect(filter.showFollowers()).toBe(false);
      expect(filter.showVerified()).toBe(true);
      expect(filter.showPrivate()).toBe(false);
      expect(filter.showWithOutProfilePicture()).toBe(false);
    });
  });

  describe('createDefault', () => {
    it('should create filter with default values', () => {
      const filter = Filter.createDefault();

      expect(filter.showNonFollowers()).toBe(true);
      expect(filter.showFollowers()).toBe(false);
      expect(filter.showVerified()).toBe(true);
      expect(filter.showPrivate()).toBe(true);
      expect(filter.showWithOutProfilePicture()).toBe(true);
    });
  });

  describe('createUnfollowFilter', () => {
    it('should create filter with all values set to false', () => {
      const filter = Filter.createUnfollowFilter();

      expect(filter.showNonFollowers()).toBe(false);
      expect(filter.showFollowers()).toBe(false);
      expect(filter.showVerified()).toBe(false);
      expect(filter.showPrivate()).toBe(false);
      expect(filter.showWithOutProfilePicture()).toBe(false);
    });
  });

  describe('fromObject', () => {
    it('should create filter from object with all properties', () => {
      const obj = {
        showNonFollowers: false,
        showFollowers: true,
        showVerified: false,
        showPrivate: true,
        showWithOutProfilePicture: false
      };

      const filter = Filter.fromObject(obj);

      expect(filter.showNonFollowers()).toBe(false);
      expect(filter.showFollowers()).toBe(true);
      expect(filter.showVerified()).toBe(false);
      expect(filter.showPrivate()).toBe(true);
      expect(filter.showWithOutProfilePicture()).toBe(false);
    });

    it('should use defaults for missing properties', () => {
      const obj = {
        showNonFollowers: false
      };

      const filter = Filter.fromObject(obj);

      expect(filter.showNonFollowers()).toBe(false);
      expect(filter.showFollowers()).toBe(false);
      expect(filter.showVerified()).toBe(true);
      expect(filter.showPrivate()).toBe(true);
      expect(filter.showWithOutProfilePicture()).toBe(true);
    });

    it('should create default filter when object is null', () => {
      const filter = Filter.fromObject(null);

      expect(filter.showNonFollowers()).toBe(true);
      expect(filter.showFollowers()).toBe(false);
      expect(filter.showVerified()).toBe(true);
      expect(filter.showPrivate()).toBe(true);
      expect(filter.showWithOutProfilePicture()).toBe(true);
    });

    it('should create default filter when object is undefined', () => {
      const filter = Filter.fromObject(undefined);

      expect(filter.showNonFollowers()).toBe(true);
      expect(filter.showFollowers()).toBe(false);
      expect(filter.showVerified()).toBe(true);
      expect(filter.showPrivate()).toBe(true);
      expect(filter.showWithOutProfilePicture()).toBe(true);
    });

    it('should handle explicit false values', () => {
      const obj = {
        showNonFollowers: false,
        showFollowers: false,
        showVerified: false,
        showPrivate: false,
        showWithOutProfilePicture: false
      };

      const filter = Filter.fromObject(obj);

      expect(filter.showNonFollowers()).toBe(false);
      expect(filter.showFollowers()).toBe(false);
      expect(filter.showVerified()).toBe(false);
      expect(filter.showPrivate()).toBe(false);
      expect(filter.showWithOutProfilePicture()).toBe(false);
    });
  });

  describe('getters', () => {
    it('should return correct values', () => {
      const filter = new Filter(true, false, true, false, true);

      expect(filter.showNonFollowers()).toBe(true);
      expect(filter.showFollowers()).toBe(false);
      expect(filter.showVerified()).toBe(true);
      expect(filter.showPrivate()).toBe(false);
      expect(filter.showWithOutProfilePicture()).toBe(true);
    });
  });

  describe('update', () => {
    it('should create new filter with updated values', () => {
      const original = new Filter(true, false, true, false, true);
      const updated = original.update({
        showNonFollowers: false,
        showFollowers: true
      });

      expect(updated.showNonFollowers()).toBe(false);
      expect(updated.showFollowers()).toBe(true);
      expect(updated.showVerified()).toBe(true);
      expect(updated.showPrivate()).toBe(false);
      expect(updated.showWithOutProfilePicture()).toBe(true);
    });

    it('should preserve original values for unspecified properties', () => {
      const original = new Filter(true, false, true, false, true);
      const updated = original.update({
        showNonFollowers: false
      });

      expect(updated.showNonFollowers()).toBe(false);
      expect(updated.showFollowers()).toBe(false);
      expect(updated.showVerified()).toBe(true);
      expect(updated.showPrivate()).toBe(false);
      expect(updated.showWithOutProfilePicture()).toBe(true);
    });

    it('should not mutate original filter', () => {
      const original = new Filter(true, false, true, false, true);
      const updated = original.update({
        showNonFollowers: false
      });

      expect(original.showNonFollowers()).toBe(true);
      expect(updated.showNonFollowers()).toBe(false);
      expect(original).not.toBe(updated);
    });

    it('should handle empty update object', () => {
      const original = new Filter(true, false, true, false, true);
      const updated = original.update({});

      expect(updated.showNonFollowers()).toBe(true);
      expect(updated.showFollowers()).toBe(false);
      expect(updated.showVerified()).toBe(true);
      expect(updated.showPrivate()).toBe(false);
      expect(updated.showWithOutProfilePicture()).toBe(true);
    });
  });

  describe('toObject', () => {
    it('should convert filter to object', () => {
      const filter = new Filter(true, false, true, false, true);
      const obj = filter.toObject();

      expect(obj).toEqual({
        showNonFollowers: true,
        showFollowers: false,
        showVerified: true,
        showPrivate: false,
        showWithOutProfilePicture: true
      });
    });
  });

  describe('equals', () => {
    it('should return true for filters with same values', () => {
      const filter1 = new Filter(true, false, true, false, true);
      const filter2 = new Filter(true, false, true, false, true);

      expect(filter1.equals(filter2)).toBe(true);
    });

    it('should return false for filters with different values', () => {
      const filter1 = new Filter(true, false, true, false, true);
      const filter2 = new Filter(false, false, true, false, true);

      expect(filter1.equals(filter2)).toBe(false);
    });

    it('should return false when comparing with non-Filter object', () => {
      const filter = new Filter(true, false, true, false, true);

      expect(filter.equals({ showNonFollowers: true })).toBe(false);
      expect(filter.equals(null)).toBe(false);
      expect(filter.equals(undefined)).toBe(false);
      expect(filter.equals('filter')).toBe(false);
    });

    it('should compare all properties', () => {
      const filter1 = new Filter(true, false, true, false, true);
      const filter2 = new Filter(true, false, true, false, false);

      expect(filter1.equals(filter2)).toBe(false);
    });
  });
});
