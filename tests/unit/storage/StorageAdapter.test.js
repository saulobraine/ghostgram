import { describe, it, expect } from '@jest/globals';
import { StorageAdapter } from '../../../src/storage/StorageAdapter.js';

describe('StorageAdapter', () => {
  class TestAdapter extends StorageAdapter {
    async get(key) {
      return 'test';
    }
  }

  it('should throw error when get is not implemented', async () => {
    const adapter = new StorageAdapter();
    await expect(adapter.get('key')).rejects.toThrow('get() must be implemented');
  });

  it('should throw error when set is not implemented', async () => {
    const adapter = new StorageAdapter();
    await expect(adapter.set('key', 'value')).rejects.toThrow('set() must be implemented');
  });

  it('should throw error when remove is not implemented', async () => {
    const adapter = new StorageAdapter();
    await expect(adapter.remove('key')).rejects.toThrow('remove() must be implemented');
  });

  it('should throw error when getAll is not implemented', async () => {
    const adapter = new StorageAdapter();
    await expect(adapter.getAll()).rejects.toThrow('getAll() must be implemented');
  });

  it('should throw error when clear is not implemented', async () => {
    const adapter = new StorageAdapter();
    await expect(adapter.clear()).rejects.toThrow('clear() must be implemented');
  });

  it('should allow implementation in subclass', async () => {
    const adapter = new TestAdapter();
    const result = await adapter.get('key');
    expect(result).toBe('test');
  });
});

