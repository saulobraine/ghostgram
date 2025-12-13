// Whitelist - Value Object (First class collection, Wrap primitives)
import { User } from './User.js';

export class Whitelist {
  constructor(users) {
    this._users = this._normalizeUsers(users || []);
  }

  static createEmpty() {
    return new Whitelist([]);
  }

  static fromArray(users) {
    return new Whitelist(users);
  }

  _normalizeUsers(users) {
    return users.map(user => {
      if (user instanceof User) {
        return user;
      }
      return User.fromObject(user);
    });
  }

  add(user) {
    if (this.contains(user)) {
      return this;
    }
    
    const normalizedUser = user instanceof User ? user : User.fromObject(user);
    return new Whitelist([...this._users, normalizedUser]);
  }

  remove(user) {
    const userToRemove = user instanceof User ? user : User.fromObject(user);
    const filtered = this._users.filter(u => !u.equals(userToRemove));
    
    if (filtered.length === this._users.length) {
      return this;
    }
    
    return new Whitelist(filtered);
  }

  contains(user) {
    const userToCheck = user instanceof User ? user : User.fromObject(user);
    return this._users.some(u => u.equals(userToCheck));
  }

  isEmpty() {
    return this._users.length === 0;
  }

  size() {
    return this._users.length;
  }

  toArray() {
    return [...this._users];
  }

  toObjectArray() {
    return this._users.map(user => user.toObject());
  }

  equals(other) {
    if (!(other instanceof Whitelist)) {
      return false;
    }
    if (this._users.length !== other._users.length) {
      return false;
    }
    
    return this._users.every(user => other.contains(user));
  }
}

