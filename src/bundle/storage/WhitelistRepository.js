// WhitelistRepository - Repository for whitelist persistence
import { Whitelist } from '../domain/Whitelist.js';
import { STORAGE_KEYS } from '../../constants/Constants.js';

export class WhitelistRepository {
  constructor(storageAdapter) {
    this._storage = storageAdapter;
  }

  async load() {
    const data = await this._storage.get(STORAGE_KEYS.WHITELISTED_RESULTS);
    
    if (!data) {
      return Whitelist.createEmpty();
    }
    
    const users = Array.isArray(data) ? data : JSON.parse(data);
    return Whitelist.fromArray(users);
  }

  async save(whitelist) {
    const normalized = whitelist instanceof Whitelist ? whitelist : Whitelist.fromArray(whitelist);
    const data = normalized.toObjectArray();
    await this._storage.set(STORAGE_KEYS.WHITELISTED_RESULTS, data);
  }

  async add(user) {
    const whitelist = await this.load();
    const updated = whitelist.add(user);
    await this.save(updated);
    return updated;
  }

  async remove(user) {
    const whitelist = await this.load();
    const updated = whitelist.remove(user);
    await this.save(updated);
    return updated;
  }
}

