// Snapshot tests for Settings
import { describe, it, expect } from '@jest/globals';
import { Settings } from '../../../src/domain/Settings.js';

describe('Settings Snapshots', () => {
  it('should match snapshot for default settings', () => {
    const settings = Settings.createDefault();
    const snapshot = settings.toObject();
    expect(snapshot).toMatchSnapshot();
  });

  it('should match snapshot for custom settings', () => {
    const settings = new Settings(2000, 15000, 5000, 400000);
    const snapshot = {
      timeBetweenSearchCycles: settings.getTimeBetweenSearchCycles(),
      timeToWaitAfterFiveSearchCycles: settings.getTimeToWaitAfterFiveSearchCycles(),
      timeBetweenUnfollows: settings.getTimeBetweenUnfollows(),
      timeToWaitAfterFiveUnfollows: settings.getTimeToWaitAfterFiveUnfollows(),
      object: settings.toObject()
    };
    expect(snapshot).toMatchSnapshot();
  });

  it('should match snapshot for fromObject with partial data', () => {
    const partial = { timeBetweenSearchCycles: 3000 };
    const settings = Settings.fromObject(partial);
    const snapshot = settings.toObject();
    expect(snapshot).toMatchSnapshot();
  });

  it('should match snapshot for fromObject with all data', () => {
    const full = {
      timeBetweenSearchCycles: 2000,
      timeToWaitAfterFiveSearchCycles: 20000,
      timeBetweenUnfollows: 6000,
      timeToWaitAfterFiveUnfollows: 350000
    };
    const settings = Settings.fromObject(full);
    const snapshot = settings.toObject();
    expect(snapshot).toMatchSnapshot();
  });
});

