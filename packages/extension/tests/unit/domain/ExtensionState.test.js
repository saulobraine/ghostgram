import { describe, it, expect } from '@jest/globals';
import { ExtensionState } from '../../../src/domain/ExtensionState.js';

describe('ExtensionState', () => {
  describe('createEnabled', () => {
    it('should create enabled state', () => {
      const state = ExtensionState.createEnabled();
      expect(state.isEnabled()).toBe(true);
      expect(state.isDisabled()).toBe(false);
    });
  });

  describe('createDisabled', () => {
    it('should create disabled state', () => {
      const state = ExtensionState.createDisabled();
      expect(state.isEnabled()).toBe(false);
      expect(state.isDisabled()).toBe(true);
    });
  });

  describe('fromStorageValue', () => {
    it('should create enabled state from true', () => {
      const state = ExtensionState.fromStorageValue(true);
      expect(state.isEnabled()).toBe(true);
    });

    it('should create enabled state from undefined', () => {
      const state = ExtensionState.fromStorageValue(undefined);
      expect(state.isEnabled()).toBe(true);
    });

    it('should create disabled state from false', () => {
      const state = ExtensionState.fromStorageValue(false);
      expect(state.isEnabled()).toBe(false);
    });
  });

  describe('toggle', () => {
    it('should toggle from enabled to disabled', () => {
      const enabled = ExtensionState.createEnabled();
      const disabled = enabled.toggle();
      expect(disabled.isEnabled()).toBe(false);
    });

    it('should toggle from disabled to enabled', () => {
      const disabled = ExtensionState.createDisabled();
      const enabled = disabled.toggle();
      expect(enabled.isEnabled()).toBe(true);
    });

    it('should return new instance', () => {
      const original = ExtensionState.createEnabled();
      const toggled = original.toggle();
      expect(toggled).not.toBe(original);
    });
  });

  describe('toStorageValue', () => {
    it('should return true for enabled state', () => {
      const state = ExtensionState.createEnabled();
      expect(state.toStorageValue()).toBe(true);
    });

    it('should return false for disabled state', () => {
      const state = ExtensionState.createDisabled();
      expect(state.toStorageValue()).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for same state', () => {
      const state1 = ExtensionState.createEnabled();
      const state2 = ExtensionState.createEnabled();
      expect(state1.equals(state2)).toBe(true);
    });

    it('should return false for different states', () => {
      const enabled = ExtensionState.createEnabled();
      const disabled = ExtensionState.createDisabled();
      expect(enabled.equals(disabled)).toBe(false);
    });

    it('should return false for non-ExtensionState object', () => {
      const state = ExtensionState.createEnabled();
      expect(state.equals({})).toBe(false);
    });
  });
});

