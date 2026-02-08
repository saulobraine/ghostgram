// StorageAdapter - Interface (DIP: Dependency Inversion Principle)

/**
 * Classe abstrata que define a interface para adapters de storage
 * Implementa Dependency Inversion Principle
 */
export class StorageAdapter {
  async get(_key: string): Promise<any> {
    throw new Error('get() must be implemented');
  }

  async set(_key: string, _value: any): Promise<void> {
    throw new Error('set() must be implemented');
  }

  async remove(_key: string): Promise<void> {
    throw new Error('remove() must be implemented');
  }

  async getAll(): Promise<Record<string, any>> {
    throw new Error('getAll() must be implemented');
  }

  async clear(): Promise<void> {
    throw new Error('clear() must be implemented');
  }
}
