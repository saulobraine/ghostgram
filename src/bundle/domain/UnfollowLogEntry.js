// UnfollowLogEntry - Value Object (Wrap primitives)
import { User } from './User.js';

export class UnfollowLogEntry {
  constructor(user, unfollowedSuccessfully, timestamp) {
    this._validate(user, unfollowedSuccessfully);
    
    this._user = user instanceof User ? user : User.fromObject(user);
    this._unfollowedSuccessfully = Boolean(unfollowedSuccessfully);
    this._timestamp = timestamp || Date.now();
  }

  static createSuccess(user) {
    return new UnfollowLogEntry(user, true);
  }

  static createFailure(user) {
    return new UnfollowLogEntry(user, false);
  }

  _validate(user, unfollowedSuccessfully) {
    if (!user) {
      throw new Error('User is required for UnfollowLogEntry');
    }
    if (typeof unfollowedSuccessfully !== 'boolean') {
      throw new Error('unfollowedSuccessfully must be a boolean');
    }
  }

  getUser() {
    return this._user;
  }

  wasSuccessful() {
    return this._unfollowedSuccessfully;
  }

  wasFailure() {
    return !this._unfollowedSuccessfully;
  }

  getTimestamp() {
    return this._timestamp;
  }

  toObject() {
    return {
      user: this._user.toObject(),
      unfollowedSuccessfully: this._unfollowedSuccessfully,
      timestamp: this._timestamp
    };
  }

  equals(other) {
    if (!(other instanceof UnfollowLogEntry)) {
      return false;
    }
    return this._user.equals(other._user) &&
           this._unfollowedSuccessfully === other._unfollowedSuccessfully;
  }
}

