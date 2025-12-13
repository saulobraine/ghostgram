// useWhitelist - Custom hook for whitelist management
import { useState, useEffect } from 'react';
import { Whitelist } from '../domain/Whitelist.js';
import { WhitelistRepository } from '../storage/WhitelistRepository.js';
import { LocalStorageAdapter } from '../../storage/LocalStorageAdapter.js';

export function useWhitelist() {
  const [whitelist, setWhitelist] = useState(Whitelist.createEmpty());
  const [repository] = useState(() => new WhitelistRepository(new LocalStorageAdapter()));

  useEffect(() => {
    loadWhitelist();
  }, []);

  async function loadWhitelist() {
    const loaded = await repository.load();
    setWhitelist(loaded);
  }

  async function add(user) {
    const updated = await repository.add(user);
    setWhitelist(updated);
  }

  async function remove(user) {
    const updated = await repository.remove(user);
    setWhitelist(updated);
  }

  function contains(user) {
    return whitelist.contains(user);
  }

  return {
    whitelist,
    add,
    remove,
    contains,
    reload: loadWhitelist
  };
}

