import { describe, it, expect } from '@jest/globals';
import { User } from '../../../src/bundle/domain/User.js';

describe('User', () => {
  describe('constructor', () => {
    it('should create user with valid values', () => {
      const user = new User(
        '123',
        'testuser',
        'Test User',
        'https://example.com/pic.jpg',
        true,
        false,
        true
      );

      expect(user.getId()).toBe('123');
      expect(user.getUsername()).toBe('testuser');
      expect(user.getFullName()).toBe('Test User');
      expect(user.getProfilePicUrl()).toBe('https://example.com/pic.jpg');
      expect(user.isVerified()).toBe(true);
      expect(user.isPrivate()).toBe(false);
      expect(user.followsViewer()).toBe(true);
    });

    it('should convert values to correct types', () => {
      const user = new User(
        123,
        'testuser',
        null,
        null,
        1,
        0,
        'truthy'
      );

      expect(user.getId()).toBe('123');
      expect(user.getUsername()).toBe('testuser');
      expect(user.getFullName()).toBe('');
      expect(user.getProfilePicUrl()).toBe('');
      expect(user.isVerified()).toBe(true);
      expect(user.isPrivate()).toBe(false);
      expect(user.followsViewer()).toBe(true);
    });

    it('should throw error when id is missing', () => {
      expect(() => {
        new User(null, 'testuser', 'Test User', 'https://example.com/pic.jpg', false, false, false);
      }).toThrow('User id is required');

      expect(() => {
        new User('', 'testuser', 'Test User', 'https://example.com/pic.jpg', false, false, false);
      }).toThrow('User id is required');

      expect(() => {
        new User(undefined, 'testuser', 'Test User', 'https://example.com/pic.jpg', false, false, false);
      }).toThrow('User id is required');
    });

    it('should throw error when username is missing', () => {
      expect(() => {
        new User('123', null, 'Test User', 'https://example.com/pic.jpg', false, false, false);
      }).toThrow('User username is required');

      expect(() => {
        new User('123', '', 'Test User', 'https://example.com/pic.jpg', false, false, false);
      }).toThrow('User username is required');

      expect(() => {
        new User('123', undefined, 'Test User', 'https://example.com/pic.jpg', false, false, false);
      }).toThrow('User username is required');
    });
  });

  describe('fromObject', () => {
    it('should create user from object with snake_case properties', () => {
      const obj = {
        id: '123',
        username: 'testuser',
        full_name: 'Test User',
        profile_pic_url: 'https://example.com/pic.jpg',
        is_verified: true,
        is_private: false,
        follows_viewer: true
      };

      const user = User.fromObject(obj);

      expect(user.getId()).toBe('123');
      expect(user.getUsername()).toBe('testuser');
      expect(user.getFullName()).toBe('Test User');
      expect(user.getProfilePicUrl()).toBe('https://example.com/pic.jpg');
      expect(user.isVerified()).toBe(true);
      expect(user.isPrivate()).toBe(false);
      expect(user.followsViewer()).toBe(true);
    });

    it('should create user from object with camelCase properties', () => {
      const obj = {
        id: '123',
        username: 'testuser',
        fullName: 'Test User',
        profilePicUrl: 'https://example.com/pic.jpg',
        isVerified: true,
        isPrivate: false,
        followsViewer: true
      };

      const user = User.fromObject(obj);

      expect(user.getId()).toBe('123');
      expect(user.getUsername()).toBe('testuser');
      expect(user.getFullName()).toBe('Test User');
      expect(user.getProfilePicUrl()).toBe('https://example.com/pic.jpg');
      expect(user.isVerified()).toBe(true);
      expect(user.isPrivate()).toBe(false);
      expect(user.followsViewer()).toBe(true);
    });

    it('should use defaults for optional properties', () => {
      const obj = {
        id: '123',
        username: 'testuser'
      };

      const user = User.fromObject(obj);

      expect(user.getFullName()).toBe('');
      expect(user.getProfilePicUrl()).toBe('');
      expect(user.isVerified()).toBe(false);
      expect(user.isPrivate()).toBe(false);
      expect(user.followsViewer()).toBe(false);
    });

    it('should prefer snake_case over camelCase when both are present', () => {
      const obj = {
        id: '123',
        username: 'testuser',
        full_name: 'Snake Case',
        fullName: 'Camel Case',
        profile_pic_url: 'snake.jpg',
        profilePicUrl: 'camel.jpg'
      };

      const user = User.fromObject(obj);

      expect(user.getFullName()).toBe('Snake Case');
      expect(user.getProfilePicUrl()).toBe('snake.jpg');
    });

    it('should throw error when object is null', () => {
      expect(() => {
        User.fromObject(null);
      }).toThrow('Invalid user object: id and username are required');
    });

    it('should throw error when object is undefined', () => {
      expect(() => {
        User.fromObject(undefined);
      }).toThrow('Invalid user object: id and username are required');
    });

    it('should throw error when id is missing', () => {
      expect(() => {
        User.fromObject({ username: 'testuser' });
      }).toThrow('Invalid user object: id and username are required');
    });

    it('should throw error when username is missing', () => {
      expect(() => {
        User.fromObject({ id: '123' });
      }).toThrow('Invalid user object: id and username are required');
    });
  });

  describe('getters', () => {
    it('should return correct values', () => {
      const user = new User(
        '123',
        'testuser',
        'Test User',
        'https://example.com/pic.jpg',
        true,
        false,
        true
      );

      expect(user.getId()).toBe('123');
      expect(user.getUsername()).toBe('testuser');
      expect(user.getFullName()).toBe('Test User');
      expect(user.getProfilePicUrl()).toBe('https://example.com/pic.jpg');
      expect(user.isVerified()).toBe(true);
      expect(user.isPrivate()).toBe(false);
      expect(user.followsViewer()).toBe(true);
    });
  });

  describe('equals', () => {
    it('should return true for users with same id', () => {
      const user1 = new User('123', 'user1', 'User 1', 'pic1.jpg', false, false, false);
      const user2 = new User('123', 'user2', 'User 2', 'pic2.jpg', true, true, true);

      expect(user1.equals(user2)).toBe(true);
    });

    it('should return false for users with different ids', () => {
      const user1 = new User('123', 'user1', 'User 1', 'pic1.jpg', false, false, false);
      const user2 = new User('456', 'user1', 'User 1', 'pic1.jpg', false, false, false);

      expect(user1.equals(user2)).toBe(false);
    });

    it('should return false when comparing with non-User object', () => {
      const user = new User('123', 'user1', 'User 1', 'pic1.jpg', false, false, false);

      expect(user.equals({ id: '123' })).toBe(false);
      expect(user.equals(null)).toBe(false);
      expect(user.equals(undefined)).toBe(false);
      expect(user.equals('123')).toBe(false);
      expect(user.equals(123)).toBe(false);
    });
  });

  describe('toObject', () => {
    it('should convert user to object with snake_case properties', () => {
      const user = new User(
        '123',
        'testuser',
        'Test User',
        'https://example.com/pic.jpg',
        true,
        false,
        true
      );

      const obj = user.toObject();

      expect(obj).toEqual({
        id: '123',
        username: 'testuser',
        full_name: 'Test User',
        profile_pic_url: 'https://example.com/pic.jpg',
        is_verified: true,
        is_private: false,
        follows_viewer: true
      });
    });

    it('should handle empty strings correctly', () => {
      const user = new User(
        '123',
        'testuser',
        '',
        '',
        false,
        false,
        false
      );

      const obj = user.toObject();

      expect(obj).toEqual({
        id: '123',
        username: 'testuser',
        full_name: '',
        profile_pic_url: '',
        is_verified: false,
        is_private: false,
        follows_viewer: false
      });
    });
  });
});
