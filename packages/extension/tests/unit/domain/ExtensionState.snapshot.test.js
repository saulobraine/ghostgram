// Snapshot tests for ExtensionState
import { describe, it, expect } from '@jest/globals';
import { ExtensionState } from '../../../src/domain/ExtensionState.js';

describe('ExtensionState Snapshots', () => {
  it('should match snapshot for enabled state', () => {
    const state = ExtensionState.createEnabled();
    const snapshot = {
      enabled: state.isEnabled(),
      disabled: state.isDisabled(),
      storageValue: state.toStorageValue()
    };
    expect(snapshot).toMatchSnapshot();
  });

  it('should match snapshot for disabled state', () => {
    const state = ExtensionState.createDisabled();
    const snapshot = {
      enabled: state.isEnabled(),
      disabled: state.isDisabled(),
      storageValue: state.toStorageValue()
    };
    expect(snapshot).toMatchSnapshot();
  });

  it('should match snapshot for toggled state', () => {
    const enabled = ExtensionState.createEnabled();
    const disabled = enabled.toggle();
    const snapshot = {
      original: {
        enabled: enabled.isEnabled(),
        storageValue: enabled.toStorageValue()
      },
      toggled: {
        enabled: disabled.isEnabled(),
        storageValue: disabled.toStorageValue()
      }
    };
    expect(snapshot).toMatchSnapshot();
  });

  it('should match snapshot for fromStorageValue variations', () => {
    const fromTrue = ExtensionState.fromStorageValue(true);
    const fromFalse = ExtensionState.fromStorageValue(false);
    const fromUndefined = ExtensionState.fromStorageValue(undefined);
    const fromNull = ExtensionState.fromStorageValue(null);
    
    const snapshot = {
      fromTrue: {
        enabled: fromTrue.isEnabled(),
        storageValue: fromTrue.toStorageValue()
      },
      fromFalse: {
        enabled: fromFalse.isEnabled(),
        storageValue: fromFalse.toStorageValue()
      },
      fromUndefined: {
        enabled: fromUndefined.isEnabled(),
        storageValue: fromUndefined.toStorageValue()
      },
      fromNull: {
        enabled: fromNull.isEnabled(),
        storageValue: fromNull.toStorageValue()
      }
    };
    expect(snapshot).toMatchSnapshot();
  });
});

