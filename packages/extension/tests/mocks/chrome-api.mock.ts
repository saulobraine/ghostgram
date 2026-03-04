// Mock for Chrome Extension APIs
import { jest } from '@jest/globals';

export const createChromeMock = () => {
  const storageSync = {
    data: {} as Record<string, any>,
    get: jest.fn((keys: any, callback?: any) => {
      if (typeof keys === 'string') {
        keys = [keys];
      }
      const result: Record<string, any> = {};
      if (keys === null) {
        Object.assign(result, storageSync.data);
      } else {
        keys.forEach((key: string) => {
          result[key] = key in storageSync.data ? storageSync.data[key] : undefined;
        });
      }
      if (callback) {
        callback(result);
      }
      return Promise.resolve(result);
    }),
    set: jest.fn((items: any, callback?: any) => {
      Object.assign(storageSync.data, items);
      if (callback) {
        callback();
      }
      return Promise.resolve();
    }),
    remove: jest.fn((keys: any, callback?: any) => {
      if (typeof keys === 'string') {
        keys = [keys];
      }
      keys.forEach((key: string) => {
        delete storageSync.data[key];
      });
      if (callback) {
        callback();
      }
      return Promise.resolve();
    }),
    clear: jest.fn((callback?: any) => {
      storageSync.data = {};
      if (callback) {
        callback();
      }
      return Promise.resolve();
    })
  };

  const storageLocal = {
    data: {} as Record<string, any>,
    get: jest.fn((keys: any, callback?: any) => {
      if (typeof keys === 'string') {
        keys = [keys];
      }
      const result: Record<string, any> = {};
      if (keys === null) {
        Object.assign(result, storageLocal.data);
      } else {
        keys.forEach((key: string) => {
          result[key] = key in storageLocal.data ? storageLocal.data[key] : undefined;
        });
      }
      if (callback) {
        callback(result);
      }
      return Promise.resolve(result);
    }),
    set: jest.fn((items: any, callback?: any) => {
      Object.assign(storageLocal.data, items);
      if (callback) {
        callback();
      }
      return Promise.resolve();
    }),
    remove: jest.fn((keys: any, callback?: any) => {
      if (typeof keys === 'string') {
        keys = [keys];
      }
      keys.forEach((key: string) => {
        delete storageLocal.data[key];
      });
      if (callback) {
        callback();
      }
      return Promise.resolve();
    }),
    clear: jest.fn((callback?: any) => {
      storageLocal.data = {};
      if (callback) {
        callback();
      }
      return Promise.resolve();
    })
  };

  const tabs = {
    query: jest.fn((_queryInfo: any, callback?: any) => {
      const mockTabs = [{
        id: 1,
        url: 'https://www.instagram.com',
        active: true
      }];
      if (callback) {
        callback(mockTabs);
      }
      return Promise.resolve(mockTabs);
    }),
    sendMessage: jest.fn((_tabId: any, _message: any, callback?: any) => {
      if (callback) {
        callback({ success: true });
      }
      return Promise.resolve({ success: true });
    }),
    reload: jest.fn((_tabId: any, callback?: any) => {
      if (callback) {
        callback();
      }
      return Promise.resolve();
    }),
    create: jest.fn((props: any, callback?: any) => {
      if (callback) callback({ id: 2, ...props });
      return Promise.resolve({ id: 2, ...props });
    }),
    onUpdated: {
      addListener: jest.fn()
    },
    onRemoved: {
      addListener: jest.fn()
    }
  };

  const runtime = {
    getURL: jest.fn((path: string) => `chrome-extension://test-id/${path}`),
    openOptionsPage: jest.fn(() => Promise.resolve()),
    onMessage: {
      addListener: jest.fn()
    },
    onInstalled: {
      addListener: jest.fn()
    },
    lastError: null
  };

  (global as any).chrome = {
    storage: {
      sync: storageSync,
      local: storageLocal
    },
    tabs: tabs,
    runtime: runtime,
    action: {
      setIcon: jest.fn(() => Promise.resolve())
    },
    scripting: {
      executeScript: jest.fn(() => Promise.resolve([]))
    }
  };

  return {
    storageSync,
    storageLocal,
    tabs,
    runtime
  };
};

export const clearChromeMock = () => {
  delete (global as any).chrome;
};

