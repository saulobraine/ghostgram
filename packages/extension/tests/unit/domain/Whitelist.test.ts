import { describe, it, expect, beforeEach } from '@jest/globals';
import { Whitelist } from '../../../src/bundle/domain/Whitelist.js';
import { User } from '../../../src/bundle/domain/User.js';

describe('Whitelist', () => {
  let user1, user2, user3;

  beforeEach(() => {
    user1 = new User('1', 'user1', 'User One', 'pic1.jpg', false, false, false);
    user2 = new User('2', 'user2', 'User Two', 'pic2.jpg', true, false, false);
    user3 = new User('3', 'user3', 'User Three', 'pic3.jpg', false, true, false);
  });

  describe('constructor', () => {
    it('should create whitelist with User instances', () => {
      const whitelist = new Whitelist([user1, user2]);

      expect(whitelist.size()).toBe(2);
      expect(whitelist.contains(user1)).toBe(true);
      expect(whitelist.contains(user2)).toBe(true);
    });

    it('should normalize user objects to User instances', () => {
      const userObj = {
        id: '4',
        username: 'user4',
        full_name: 'User Four'
      };

      const whitelist = new Whitelist([userObj]);

      expect(whitelist.size()).toBe(1);
      const users = whitelist.toArray();
      expect(users[0]).toBeInstanceOf(User);
      expect(users[0].getId()).toBe('4');
    });

    it('should create empty whitelist when no users provided', () => {
      const whitelist = new Whitelist();
      expect(whitelist.isEmpty()).toBe(true);
      expect(whitelist.size()).toBe(0);
    });

    it('should create empty whitelist with empty array', () => {
      const whitelist = new Whitelist([]);
      expect(whitelist.isEmpty()).toBe(true);
      expect(whitelist.size()).toBe(0);
    });

    it('should handle mixed User instances and objects', () => {
      const userObj = {
        id: '5',
        username: 'user5'
      };

      const whitelist = new Whitelist([user1, userObj]);

      expect(whitelist.size()).toBe(2);
      expect(whitelist.contains(user1)).toBe(true);
    });
  });

  describe('createEmpty', () => {
    it('should create empty whitelist', () => {
      const whitelist = Whitelist.createEmpty();

      expect(whitelist.isEmpty()).toBe(true);
      expect(whitelist.size()).toBe(0);
    });
  });

  describe('fromArray', () => {
    it('should create whitelist from array of User instances', () => {
      const whitelist = Whitelist.fromArray([user1, user2, user3]);

      expect(whitelist.size()).toBe(3);
      expect(whitelist.contains(user1)).toBe(true);
      expect(whitelist.contains(user2)).toBe(true);
      expect(whitelist.contains(user3)).toBe(true);
    });

    it('should create whitelist from array of user objects', () => {
      const userObjs = [
        { id: '6', username: 'user6' },
        { id: '7', username: 'user7' }
      ];

      const whitelist = Whitelist.fromArray(userObjs);

      expect(whitelist.size()).toBe(2);
    });
  });

  describe('add', () => {
    it('should add user to empty whitelist', () => {
      const whitelist = Whitelist.createEmpty();
      const updated = whitelist.add(user1);

      expect(updated.size()).toBe(1);
      expect(updated.contains(user1)).toBe(true);
      expect(whitelist.isEmpty()).toBe(true);
    });

    it('should add user to existing whitelist', () => {
      const whitelist = new Whitelist([user1]);
      const updated = whitelist.add(user2);

      expect(updated.size()).toBe(2);
      expect(updated.contains(user1)).toBe(true);
      expect(updated.contains(user2)).toBe(true);
    });

    it('should not add duplicate user', () => {
      const whitelist = new Whitelist([user1]);
      const updated = whitelist.add(user1);

      expect(updated.size()).toBe(1);
      expect(updated).toBe(whitelist);
    });

    it('should add user from object', () => {
      const whitelist = Whitelist.createEmpty();
      const userObj = {
        id: '8',
        username: 'user8'
      };

      const updated = whitelist.add(userObj);

      expect(updated.size()).toBe(1);
      const users = updated.toArray();
      expect(users[0]).toBeInstanceOf(User);
      expect(users[0].getId()).toBe('8');
    });

    it('should not mutate original whitelist', () => {
      const whitelist = new Whitelist([user1]);
      const updated = whitelist.add(user2);

      expect(whitelist.size()).toBe(1);
      expect(updated.size()).toBe(2);
      expect(whitelist).not.toBe(updated);
    });
  });

  describe('remove', () => {
    it('should remove user from whitelist', () => {
      const whitelist = new Whitelist([user1, user2]);
      const updated = whitelist.remove(user1);

      expect(updated.size()).toBe(1);
      expect(updated.contains(user1)).toBe(false);
      expect(updated.contains(user2)).toBe(true);
    });

    it('should return same whitelist when user not found', () => {
      const whitelist = new Whitelist([user1]);
      const updated = whitelist.remove(user2);

      expect(updated.size()).toBe(1);
      expect(updated).toBe(whitelist);
    });

    it('should remove user from object', () => {
      const whitelist = new Whitelist([user1, user2]);
      const userObj = {
        id: user1.getId(),
        username: user1.getUsername()
      };

      const updated = whitelist.remove(userObj);

      expect(updated.size()).toBe(1);
      expect(updated.contains(user1)).toBe(false);
    });

    it('should not mutate original whitelist', () => {
      const whitelist = new Whitelist([user1, user2]);
      const updated = whitelist.remove(user1);

      expect(whitelist.size()).toBe(2);
      expect(updated.size()).toBe(1);
      expect(whitelist).not.toBe(updated);
    });
  });

  describe('contains', () => {
    it('should return true when user is in whitelist', () => {
      const whitelist = new Whitelist([user1, user2]);

      expect(whitelist.contains(user1)).toBe(true);
      expect(whitelist.contains(user2)).toBe(true);
    });

    it('should return false when user is not in whitelist', () => {
      const whitelist = new Whitelist([user1]);

      expect(whitelist.contains(user2)).toBe(false);
      expect(whitelist.contains(user3)).toBe(false);
    });

    it('should check by user object', () => {
      const whitelist = new Whitelist([user1]);
      const userObj = {
        id: user1.getId(),
        username: user1.getUsername()
      };

      expect(whitelist.contains(userObj)).toBe(true);
    });

    it('should return false for empty whitelist', () => {
      const whitelist = Whitelist.createEmpty();

      expect(whitelist.contains(user1)).toBe(false);
    });
  });

  describe('isEmpty', () => {
    it('should return true for empty whitelist', () => {
      const whitelist = Whitelist.createEmpty();
      expect(whitelist.isEmpty()).toBe(true);
    });

    it('should return false for non-empty whitelist', () => {
      const whitelist = new Whitelist([user1]);
      expect(whitelist.isEmpty()).toBe(false);
    });
  });

  describe('size', () => {
    it('should return 0 for empty whitelist', () => {
      const whitelist = Whitelist.createEmpty();
      expect(whitelist.size()).toBe(0);
    });

    it('should return correct size', () => {
      expect(new Whitelist([user1]).size()).toBe(1);
      expect(new Whitelist([user1, user2]).size()).toBe(2);
      expect(new Whitelist([user1, user2, user3]).size()).toBe(3);
    });
  });

  describe('toArray', () => {
    it('should return array of User instances', () => {
      const whitelist = new Whitelist([user1, user2]);
      const users = whitelist.toArray();

      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBe(2);
      expect(users[0]).toBeInstanceOf(User);
      expect(users[1]).toBeInstanceOf(User);
    });

    it('should return new array (not reference)', () => {
      const whitelist = new Whitelist([user1]);
      const users1 = whitelist.toArray();
      const users2 = whitelist.toArray();

      expect(users1).not.toBe(users2);
      expect(users1).toEqual(users2);
    });

    it('should return empty array for empty whitelist', () => {
      const whitelist = Whitelist.createEmpty();
      const users = whitelist.toArray();

      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBe(0);
    });
  });

  describe('toObjectArray', () => {
    it('should return array of user objects', () => {
      const whitelist = new Whitelist([user1, user2]);
      const objects = whitelist.toObjectArray();

      expect(Array.isArray(objects)).toBe(true);
      expect(objects.length).toBe(2);
      expect(objects[0]).toEqual(user1.toObject());
      expect(objects[1]).toEqual(user2.toObject());
    });

    it('should return empty array for empty whitelist', () => {
      const whitelist = Whitelist.createEmpty();
      const objects = whitelist.toObjectArray();

      expect(Array.isArray(objects)).toBe(true);
      expect(objects.length).toBe(0);
    });
  });

  describe('equals', () => {
    it('should return true for whitelists with same users', () => {
      const whitelist1 = new Whitelist([user1, user2]);
      const whitelist2 = new Whitelist([user1, user2]);

      expect(whitelist1.equals(whitelist2)).toBe(true);
    });

    it('should return true for empty whitelists', () => {
      const whitelist1 = Whitelist.createEmpty();
      const whitelist2 = Whitelist.createEmpty();

      expect(whitelist1.equals(whitelist2)).toBe(true);
    });

    it('should return false for whitelists with different users', () => {
      const whitelist1 = new Whitelist([user1]);
      const whitelist2 = new Whitelist([user2]);

      expect(whitelist1.equals(whitelist2)).toBe(false);
    });

    it('should return false for whitelists with different sizes', () => {
      const whitelist1 = new Whitelist([user1]);
      const whitelist2 = new Whitelist([user1, user2]);

      expect(whitelist1.equals(whitelist2)).toBe(false);
    });

    it('should return false when comparing with non-Whitelist object', () => {
      const whitelist = new Whitelist([user1]);

      expect(whitelist.equals({ users: [user1] })).toBe(false);
      expect(whitelist.equals(null)).toBe(false);
      expect(whitelist.equals(undefined)).toBe(false);
      expect(whitelist.equals([user1])).toBe(false);
    });

    it('should compare users by equality, not reference', () => {
      const user1Copy = new User(user1.getId(), user1.getUsername(), user1.getFullName(),
        user1.getProfilePicUrl(), user1.isVerified(),
        user1.isPrivate(), user1.followsViewer());
      const whitelist1 = new Whitelist([user1]);
      const whitelist2 = new Whitelist([user1Copy]);

      expect(whitelist1.equals(whitelist2)).toBe(true);
    });
  });
});
