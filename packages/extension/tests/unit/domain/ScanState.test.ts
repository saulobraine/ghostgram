import { describe, it, expect } from '@jest/globals';
import { ScanState } from '../../../src/bundle/domain/ScanState.js';

describe('ScanState', () => {
  describe('constructor', () => {
    it('should create scan state with valid status', () => {
      const state = new ScanState('initial');
      expect(state.toString()).toBe('initial');
    });

    it('should throw error for invalid status', () => {
      expect(() => {
        new ScanState('invalid');
      }).toThrow('Invalid scan state: invalid');

      expect(() => {
        new ScanState('');
      }).toThrow('Invalid scan state: ');

      expect(() => {
        new ScanState(null);
      }).toThrow('Invalid scan state: null');
    });
  });

  describe('createInitial', () => {
    it('should create initial state', () => {
      const state = ScanState.createInitial();
      expect(state.isInitial()).toBe(true);
      expect(state.isScanning()).toBe(false);
      expect(state.isUnfollowing()).toBe(false);
      expect(state.toString()).toBe('initial');
    });
  });

  describe('createScanning', () => {
    it('should create scanning state', () => {
      const state = ScanState.createScanning();
      expect(state.isInitial()).toBe(false);
      expect(state.isScanning()).toBe(true);
      expect(state.isUnfollowing()).toBe(false);
      expect(state.toString()).toBe('scanning');
    });
  });

  describe('createUnfollowing', () => {
    it('should create unfollowing state', () => {
      const state = ScanState.createUnfollowing();
      expect(state.isInitial()).toBe(false);
      expect(state.isScanning()).toBe(false);
      expect(state.isUnfollowing()).toBe(true);
      expect(state.toString()).toBe('unfollowing');
    });
  });

  describe('fromString', () => {
    it('should create state from valid string', () => {
      const state = ScanState.fromString('scanning');
      expect(state.isScanning()).toBe(true);
    });

    it('should throw error for invalid string', () => {
      expect(() => {
        ScanState.fromString('invalid');
      }).toThrow('Invalid scan state: invalid');
    });
  });

  describe('isInitial', () => {
    it('should return true for initial state', () => {
      const state = new ScanState('initial');
      expect(state.isInitial()).toBe(true);
    });

    it('should return false for non-initial states', () => {
      expect(new ScanState('scanning').isInitial()).toBe(false);
      expect(new ScanState('unfollowing').isInitial()).toBe(false);
    });
  });

  describe('isScanning', () => {
    it('should return true for scanning state', () => {
      const state = new ScanState('scanning');
      expect(state.isScanning()).toBe(true);
    });

    it('should return false for non-scanning states', () => {
      expect(new ScanState('initial').isScanning()).toBe(false);
      expect(new ScanState('unfollowing').isScanning()).toBe(false);
    });
  });

  describe('isUnfollowing', () => {
    it('should return true for unfollowing state', () => {
      const state = new ScanState('unfollowing');
      expect(state.isUnfollowing()).toBe(true);
    });

    it('should return false for non-unfollowing states', () => {
      expect(new ScanState('initial').isUnfollowing()).toBe(false);
      expect(new ScanState('scanning').isUnfollowing()).toBe(false);
    });
  });

  describe('transitionTo', () => {
    it('should create new state with new status', () => {
      const initial = ScanState.createInitial();
      const scanning = initial.transitionTo('scanning');

      expect(initial.isInitial()).toBe(true);
      expect(scanning.isScanning()).toBe(true);
      expect(initial).not.toBe(scanning);
    });

    it('should allow transition to any valid state', () => {
      const initial = ScanState.createInitial();
      const unfollowing = initial.transitionTo('unfollowing');

      expect(unfollowing.isUnfollowing()).toBe(true);
    });

    it('should throw error for invalid transition', () => {
      const initial = ScanState.createInitial();

      expect(() => {
        initial.transitionTo('invalid');
      }).toThrow('Invalid scan state: invalid');
    });
  });

  describe('toString', () => {
    it('should return status string', () => {
      expect(new ScanState('initial').toString()).toBe('initial');
      expect(new ScanState('scanning').toString()).toBe('scanning');
      expect(new ScanState('unfollowing').toString()).toBe('unfollowing');
    });
  });

  describe('equals', () => {
    it('should return true for states with same status', () => {
      const state1 = new ScanState('initial');
      const state2 = new ScanState('initial');
      const state3 = ScanState.createInitial();

      expect(state1.equals(state2)).toBe(true);
      expect(state1.equals(state3)).toBe(true);
    });

    it('should return false for states with different status', () => {
      const initial = ScanState.createInitial();
      const scanning = ScanState.createScanning();
      const unfollowing = ScanState.createUnfollowing();

      expect(initial.equals(scanning)).toBe(false);
      expect(initial.equals(unfollowing)).toBe(false);
      expect(scanning.equals(unfollowing)).toBe(false);
    });

    it('should return false when comparing with non-ScanState object', () => {
      const state = ScanState.createInitial();

      expect(state.equals({ status: 'initial' })).toBe(false);
      expect(state.equals(null)).toBe(false);
      expect(state.equals(undefined)).toBe(false);
      expect(state.equals('initial')).toBe(false);
    });
  });
});
