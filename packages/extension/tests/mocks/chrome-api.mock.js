// Mock for Chrome Extension APIs
import { jest } from '@jest/globals';

export const createChromeMock = () => {
  const storageSync = {
    data: {},
    get: jest.fn((keys, callback) => {
      if (typeof keys === 'string') {
        keys = [keys];
      }
      const result = {};
      if (keys === null) {
        Object.assign(result, storageSync.data);
      } else {
        keys.forEach(key => {
          result[key] = key in storageSync.data ? storageSync.data[key] : undefined;
        });
      }
      if (callback) {
        callback(result);
      }
      return Promise.resolve(result);
    }),
    set: jest.fn((items, callback) => {
      Object.assign(storageSync.data, items);
      if (callback) {
        callback();
      }
      return Promise.resolve();
    }),
    remove: jest.fn((keys, callback) => {
      if (typeof keys === 'string') {
        keys = [keys];
      }
      keys.forEach(key => {
        delete storageSync.data[key];
      });
      if (callback) {
        callback();
      }
      return Promise.resolve();
    }),
    clear: jest.fn((callback) => {
      storageSync.data = {};
      if (callback) {
        callback();
      }
      return Promise.resolve();
    })
  };

  const storageLocal = {
    data: {},
    get: jest.fn((keys, callback) => {
      if (typeof keys === 'string') {
        keys = [keys];
      }
      const result = {};
      if (keys === null) {
        Object.assign(result, storageLocal.data);
      } else {
        keys.forEach(key => {
          result[key] = key in storageLocal.data ? storageLocal.data[key] : undefined;
        });
      }
      if (callback) {
        callback(result);
      }
      return Promise.resolve(result);
    }),
    set: jest.fn((items, callback) => {
      Object.assign(storageLocal.data, items);
      if (callback) {
        callback();
      }
      return Promise.resolve();
    }),
    remove: jest.fn((keys, callback) => {
      if (typeof keys === 'string') {
        keys = [keys];
      }
      keys.forEach(key => {
        delete storageLocal.data[key];
      });
      if (callback) {
        callback();
      }
      return Promise.resolve();
    }),
    clear: jest.fn((callback) => {
      storageLocal.data = {};
      if (callback) {
        callback();
      }
      return Promise.resolve();
    })
  };

  const tabs = {
    query: jest.fn((queryInfo, callback) => {
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
    sendMessage: jest.fn((tabId, message, callback) => {
      if (callback) {
        callback({ success: true });
      }
      return Promise.resolve({ success: true });
    }),
    reload: jest.fn((tabId, callback) => {
      if (callback) {
        callback();
      }
      return Promise.resolve();
    }),
    create: jest.fn((props, callback) => {
      if (callback) callback({ id: 2, ...props });
      return Promise.resolve({ id: 2, ...props });
    }),
    onUpdated: {
      addListener: jest.fn()
    }
  };

  const runtime = {
    getURL: jest.fn((path) => `chrome-extension://test-id/${path}`),
    openOptionsPage: jest.fn(() => Promise.resolve()),
    onMessage: {
      addListener: jest.fn()
    },
    onInstalled: {
      addListener: jest.fn()
    },
    lastError: null
  };

  global.chrome = {
    storage: {
      sync: storageSync,
      local: storageLocal
    },
    tabs: tabs,
    runtime: runtime
  };

  return {
    storageSync,
    storageLocal,
    tabs,
    runtime
  };
};

export const clearChromeMock = () => {
  delete global.chrome;
};

