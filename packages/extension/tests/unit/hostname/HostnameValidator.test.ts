import { describe, it, expect } from '@jest/globals';
import { HostnameValidator } from '../../../src/hostname/HostnameValidator.js';

describe('HostnameValidator', () => {
  describe('isValid', () => {
    it('should return true for instagram.com hostname', () => {
      const location = { hostname: 'www.instagram.com' };
      expect(HostnameValidator.isValid(location)).toBe(true);
    });

    it('should return false for other hostnames', () => {
      const location = { hostname: 'www.google.com' };
      expect(HostnameValidator.isValid(location)).toBe(false);
    });

    it('should return false for instagram.com without www', () => {
      const location = { hostname: 'instagram.com' };
      expect(HostnameValidator.isValid(location)).toBe(false);
    });
  });

  describe('validate', () => {
    it('should not throw for valid hostname', () => {
      const location = { hostname: 'www.instagram.com' };
      expect(() => HostnameValidator.validate(location)).not.toThrow();
    });

    it('should throw error for invalid hostname', () => {
      const location = { hostname: 'www.google.com' };
      expect(() => HostnameValidator.validate(location)).toThrow('Extension only works on www.instagram.com');
    });
  });
});

