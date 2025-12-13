// UnfollowService - Service for unfollowing users
import { InstagramApiClient } from './InstagramApiClient.js';
import { DelayHelper } from '../utils/DelayHelper.js';
import { Settings } from '../../domain/Settings.js';
import { UnfollowLogEntry } from '../domain/UnfollowLogEntry.js';

export class UnfollowService {
  constructor(apiClient, settings, onProgress) {
    this._apiClient = apiClient;
    this._settings = settings;
    this._onProgress = onProgress;
    this._isPaused = false;
    this._shouldStop = false;
  }

  async execute(users) {
    this._isPaused = false;
    this._shouldStop = false;
    
    const log = [];
    const total = users.length;
    
    for (let i = 0; i < users.length; i++) {
      if (this._shouldStop) {
        break;
      }
      
      if (this._isPaused) {
        await DelayHelper.sleep(1000);
        i--;
        continue;
      }
      
      const user = users[i];
      const entry = await this._unfollowUser(user);
      log.push(entry);
      
      const percentage = Math.round(((i + 1) / total) * 100);
      this._notifyProgress(percentage, log);
      
      if (i < users.length - 1) {
        await this._waitBetweenUnfollows(i);
      }
    }
    
    return log;
  }

  pause() {
    this._isPaused = true;
  }

  resume() {
    this._isPaused = false;
  }

  stop() {
    this._shouldStop = true;
    this._isPaused = false;
  }

  async _unfollowUser(user) {
    try {
      const userId = user.getId ? user.getId() : user.id;
      await this._apiClient.unfollowUser(userId);
      return UnfollowLogEntry.createSuccess(user);
    } catch (error) {
      console.error('Error unfollowing user:', error);
      return UnfollowLogEntry.createFailure(user);
    }
  }

  async _waitBetweenUnfollows(index) {
    const baseDelay = this._settings.getTimeBetweenUnfollows();
    const randomDelay = DelayHelper.calculateRandomDelayWithVariation(baseDelay, 0.2);
    await DelayHelper.sleep(randomDelay);
    
    if (this._shouldWaitAfterFiveUnfollows(index)) {
      const waitTime = this._settings.getTimeToWaitAfterFiveUnfollows();
      await DelayHelper.sleep(waitTime);
    }
  }

  _shouldWaitAfterFiveUnfollows(index) {
    return index > 0 && (index + 1) % 5 === 0;
  }

  _notifyProgress(percentage, log) {
    if (this._onProgress) {
      this._onProgress(percentage, log);
    }
  }
}

