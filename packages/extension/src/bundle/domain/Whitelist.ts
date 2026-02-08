// Whitelist - Value Object (First class collection, Wrap primitives)
import { User } from './User.js';
import type { IUserObject } from '../../types/domain.js';

/**
 * Value Object que representa uma whitelist de usuários (coleção de primeira classe)
 */
export class Whitelist {
  private readonly _users: User[];

  constructor(users: (User | IUserObject)[] = []) {
    this._users = this._normalizeUsers(users);
  }

  static createEmpty(): Whitelist {
    return new Whitelist([]);
  }

  static fromArray(users: (User | IUserObject)[]): Whitelist {
    return new Whitelist(users);
  }

  private _normalizeUsers(users: (User | IUserObject)[]): User[] {
    return users.map(user => {
      if (user instanceof User) {
        return user;
      }
      return User.fromObject(user);
    });
  }

  add(user: User | IUserObject): Whitelist {
    if (this.contains(user)) {
      return this;
    }
    
    const normalizedUser = user instanceof User ? user : User.fromObject(user);
    return new Whitelist([...this._users, normalizedUser]);
  }

  remove(user: User | IUserObject): Whitelist {
    const userToRemove = user instanceof User ? user : User.fromObject(user);
    const filtered = this._users.filter(u => !u.equals(userToRemove));
    
    if (filtered.length === this._users.length) {
      return this;
    }
    
    return new Whitelist(filtered);
  }

  contains(user: User | IUserObject): boolean {
    const userToCheck = user instanceof User ? user : User.fromObject(user);
    return this._users.some(u => u.equals(userToCheck));
  }

  isEmpty(): boolean {
    return this._users.length === 0;
  }

  size(): number {
    return this._users.length;
  }

  toArray(): User[] {
    return [...this._users];
  }

  toObjectArray(): ReturnType<User['toObject']>[] {
    return this._users.map(user => user.toObject());
  }

  equals(other: unknown): boolean {
    if (!(other instanceof Whitelist)) {
      return false;
    }
    if (this._users.length !== other._users.length) {
      return false;
    }
    
    return this._users.every(user => other.contains(user));
  }
}
