// WhitelistRepository - Repository for whitelist persistence
import { Whitelist } from '../domain/Whitelist.js';
import { STORAGE_KEYS } from '../../constants/Constants.js';
import type { StorageAdapter } from '../../storage/StorageAdapter.js';
import type { User } from '../domain/User.js';
import type { IUserObject } from '../../types/domain.js';

/**
 * Repositório responsável por persistência da whitelist
 */
export class WhitelistRepository {
  private _storage: StorageAdapter;

  constructor(storageAdapter: StorageAdapter) {
    this._storage = storageAdapter;
  }

  async load(): Promise<Whitelist> {
    const data = await this._storage.get(STORAGE_KEYS.WHITELISTED_RESULTS);
    
    if (!data) {
      return Whitelist.createEmpty();
    }
    
    const users = Array.isArray(data) ? data : JSON.parse(data as string);
    return Whitelist.fromArray(users);
  }

  async save(whitelist: Whitelist | (User | IUserObject)[]): Promise<void> {
    const normalized = whitelist instanceof Whitelist ? whitelist : Whitelist.fromArray(whitelist);
    const data = normalized.toObjectArray();
    await this._storage.set(STORAGE_KEYS.WHITELISTED_RESULTS, data);
  }

  async add(user: User | IUserObject): Promise<Whitelist> {
    const whitelist = await this.load();
    const updated = whitelist.add(user);
    await this.save(updated);
    return updated;
  }

  async remove(user: User | IUserObject): Promise<Whitelist> {
    const whitelist = await this.load();
    const updated = whitelist.remove(user);
    await this.save(updated);
    return updated;
  }
}
