// StorageAdapter - Interface (DIP: Dependency Inversion Principle)
export class StorageAdapter {
  async get(key) {
    throw new Error('get() must be implemented');
  }

  async set(key, value) {
    throw new Error('set() must be implemented');
  }

  async remove(key) {
    throw new Error('remove() must be implemented');
  }

  async getAll() {
    throw new Error('getAll() must be implemented');
  }

  async clear() {
    throw new Error('clear() must be implemented');
  }
}

