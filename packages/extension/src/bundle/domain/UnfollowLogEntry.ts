// UnfollowLogEntry - Value Object (Wrap primitives)
import { User } from './User.js';
import type { IUserObject } from '../../types/domain.js';

/**
 * Value Object que representa uma entrada de log de unfollow
 */
export class UnfollowLogEntry {
  private readonly _user: User;
  private readonly _unfollowedSuccessfully: boolean;
  private readonly _timestamp: number;

  constructor(user: User | IUserObject, unfollowedSuccessfully: boolean, timestamp?: number) {
    this._validate(user, unfollowedSuccessfully);
    
    this._user = user instanceof User ? user : User.fromObject(user);
    this._unfollowedSuccessfully = Boolean(unfollowedSuccessfully);
    this._timestamp = timestamp || Date.now();
  }

  static createSuccess(user: User | IUserObject): UnfollowLogEntry {
    return new UnfollowLogEntry(user, true);
  }

  static createFailure(user: User | IUserObject): UnfollowLogEntry {
    return new UnfollowLogEntry(user, false);
  }

  private _validate(user: unknown, unfollowedSuccessfully: unknown): void {
    if (!user) {
      throw new Error('User is required for UnfollowLogEntry');
    }
    if (typeof unfollowedSuccessfully !== 'boolean') {
      throw new Error('unfollowedSuccessfully must be a boolean');
    }
  }

  getUser(): User {
    return this._user;
  }

  wasSuccessful(): boolean {
    return this._unfollowedSuccessfully;
  }

  wasFailure(): boolean {
    return !this._unfollowedSuccessfully;
  }

  getTimestamp(): number {
    return this._timestamp;
  }

  toObject(): {
    user: ReturnType<User['toObject']>;
    unfollowedSuccessfully: boolean;
    timestamp: number;
  } {
    return {
      user: this._user.toObject(),
      unfollowedSuccessfully: this._unfollowedSuccessfully,
      timestamp: this._timestamp
    };
  }

  equals(other: unknown): boolean {
    if (!(other instanceof UnfollowLogEntry)) {
      return false;
    }
    return this._user.equals(other._user) &&
           this._unfollowedSuccessfully === other._unfollowedSuccessfully;
  }
}
