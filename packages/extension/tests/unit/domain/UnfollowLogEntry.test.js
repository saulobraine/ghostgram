import { describe, it, expect, beforeEach } from '@jest/globals';
import { UnfollowLogEntry } from '../../../src/bundle/domain/UnfollowLogEntry.js';
import { User } from '../../../src/bundle/domain/User.js';

describe('UnfollowLogEntry', () => {
  let testUser;

  beforeEach(() => {
    testUser = new User('123', 'testuser', 'Test User', 'https://example.com/pic.jpg', false, false, false);
  });

  describe('constructor', () => {
    it('should create entry with User instance', () => {
      const entry = new UnfollowLogEntry(testUser, true);

      expect(entry.getUser()).toBe(testUser);
      expect(entry.wasSuccessful()).toBe(true);
      expect(entry.wasFailure()).toBe(false);
      expect(typeof entry.getTimestamp()).toBe('number');
    });

    it('should create entry with user object', () => {
      const userObj = {
        id: '456',
        username: 'anotheruser',
        full_name: 'Another User'
      };

      const entry = new UnfollowLogEntry(userObj, false);

      expect(entry.getUser()).toBeInstanceOf(User);
      expect(entry.getUser().getId()).toBe('456');
      expect(entry.getUser().getUsername()).toBe('anotheruser');
      expect(entry.wasSuccessful()).toBe(false);
      expect(entry.wasFailure()).toBe(true);
    });

    it('should use provided timestamp', () => {
      const timestamp = 1234567890;
      const entry = new UnfollowLogEntry(testUser, true, timestamp);

      expect(entry.getTimestamp()).toBe(timestamp);
    });

    it('should use current timestamp when not provided', () => {
      const before = Date.now();
      const entry = new UnfollowLogEntry(testUser, true);
      const after = Date.now();

      expect(entry.getTimestamp()).toBeGreaterThanOrEqual(before);
      expect(entry.getTimestamp()).toBeLessThanOrEqual(after);
    });

    it('should throw error when user is null', () => {
      expect(() => {
        new UnfollowLogEntry(null, true);
      }).toThrow('User is required for UnfollowLogEntry');
    });

    it('should throw error when user is undefined', () => {
      expect(() => {
        new UnfollowLogEntry(undefined, true);
      }).toThrow('User is required for UnfollowLogEntry');
    });

    it('should throw error when unfollowedSuccessfully is not boolean', () => {
      expect(() => {
        new UnfollowLogEntry(testUser, 'true');
      }).toThrow('unfollowedSuccessfully must be a boolean');

      expect(() => {
        new UnfollowLogEntry(testUser, 1);
      }).toThrow('unfollowedSuccessfully must be a boolean');

      expect(() => {
        new UnfollowLogEntry(testUser, null);
      }).toThrow('unfollowedSuccessfully must be a boolean');
    });
  });

  describe('createSuccess', () => {
    it('should create successful entry with User instance', () => {
      const entry = UnfollowLogEntry.createSuccess(testUser);

      expect(entry.getUser()).toBe(testUser);
      expect(entry.wasSuccessful()).toBe(true);
      expect(entry.wasFailure()).toBe(false);
    });

    it('should create successful entry with user object', () => {
      const userObj = {
        id: '789',
        username: 'successuser'
      };

      const entry = UnfollowLogEntry.createSuccess(userObj);

      expect(entry.getUser()).toBeInstanceOf(User);
      expect(entry.getUser().getId()).toBe('789');
      expect(entry.wasSuccessful()).toBe(true);
    });
  });

  describe('createFailure', () => {
    it('should create failure entry with User instance', () => {
      const entry = UnfollowLogEntry.createFailure(testUser);

      expect(entry.getUser()).toBe(testUser);
      expect(entry.wasSuccessful()).toBe(false);
      expect(entry.wasFailure()).toBe(true);
    });

    it('should create failure entry with user object', () => {
      const userObj = {
        id: '999',
        username: 'failuser'
      };

      const entry = UnfollowLogEntry.createFailure(userObj);

      expect(entry.getUser()).toBeInstanceOf(User);
      expect(entry.getUser().getId()).toBe('999');
      expect(entry.wasFailure()).toBe(true);
    });
  });

  describe('getUser', () => {
    it('should return the user', () => {
      const entry = new UnfollowLogEntry(testUser, true);
      expect(entry.getUser()).toBe(testUser);
    });
  });

  describe('wasSuccessful', () => {
    it('should return true for successful entries', () => {
      const entry = new UnfollowLogEntry(testUser, true);
      expect(entry.wasSuccessful()).toBe(true);
    });

    it('should return false for failed entries', () => {
      const entry = new UnfollowLogEntry(testUser, false);
      expect(entry.wasSuccessful()).toBe(false);
    });
  });

  describe('wasFailure', () => {
    it('should return true for failed entries', () => {
      const entry = new UnfollowLogEntry(testUser, false);
      expect(entry.wasFailure()).toBe(true);
    });

    it('should return false for successful entries', () => {
      const entry = new UnfollowLogEntry(testUser, true);
      expect(entry.wasFailure()).toBe(false);
    });
  });

  describe('getTimestamp', () => {
    it('should return the timestamp', () => {
      const timestamp = 9876543210;
      const entry = new UnfollowLogEntry(testUser, true, timestamp);
      expect(entry.getTimestamp()).toBe(timestamp);
    });
  });

  describe('toObject', () => {
    it('should convert entry to object', () => {
      const timestamp = 1234567890;
      const entry = new UnfollowLogEntry(testUser, true, timestamp);
      const obj = entry.toObject();

      expect(obj).toEqual({
        user: testUser.toObject(),
        unfollowedSuccessfully: true,
        timestamp: timestamp
      });
    });

    it('should include user object in correct format', () => {
      const entry = new UnfollowLogEntry(testUser, false);
      const obj = entry.toObject();

      expect(obj.user).toEqual(testUser.toObject());
      expect(obj.unfollowedSuccessfully).toBe(false);
      expect(typeof obj.timestamp).toBe('number');
    });
  });

  describe('equals', () => {
    it('should return true for entries with same user and success status', () => {
      const entry1 = new UnfollowLogEntry(testUser, true, 1000);
      const entry2 = new UnfollowLogEntry(testUser, true, 2000);

      expect(entry1.equals(entry2)).toBe(true);
    });

    it('should return false for entries with different users', () => {
      const user2 = new User('456', 'otheruser', 'Other User', '', false, false, false);
      const entry1 = new UnfollowLogEntry(testUser, true);
      const entry2 = new UnfollowLogEntry(user2, true);

      expect(entry1.equals(entry2)).toBe(false);
    });

    it('should return false for entries with different success status', () => {
      const entry1 = new UnfollowLogEntry(testUser, true);
      const entry2 = new UnfollowLogEntry(testUser, false);

      expect(entry1.equals(entry2)).toBe(false);
    });

    it('should return false when comparing with non-UnfollowLogEntry object', () => {
      const entry = new UnfollowLogEntry(testUser, true);

      expect(entry.equals({ user: testUser, unfollowedSuccessfully: true })).toBe(false);
      expect(entry.equals(null)).toBe(false);
      expect(entry.equals(undefined)).toBe(false);
      expect(entry.equals('entry')).toBe(false);
    });
  });
});
