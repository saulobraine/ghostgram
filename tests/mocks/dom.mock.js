// Mock for DOM APIs
import { jest } from '@jest/globals';

export const createDOMMock = () => {
  const mockElement = {
    textContent: '',
    className: '',
    value: '',
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn(() => false)
    },
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(() => []),
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    remove: jest.fn(),
    setAttribute: jest.fn(),
    getAttribute: jest.fn()
  };

  const mockDocument = {
    readyState: 'complete',
    head: {
      appendChild: jest.fn(),
      removeChild: jest.fn()
    },
    documentElement: {
      appendChild: jest.fn(),
      removeChild: jest.fn()
    },
    createElement: jest.fn((tag) => {
      const element = { ...mockElement };
      element.tagName = tag.toUpperCase();
      return element;
    }),
    getElementById: jest.fn((id) => {
      const element = { ...mockElement };
      element.id = id;
      return element;
    }),
    querySelector: jest.fn(() => mockElement),
    querySelectorAll: jest.fn(() => []),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  };

  global.document = mockDocument;
  global.location = {
    hostname: 'www.instagram.com',
    reload: jest.fn()
  };

  return {
    mockElement,
    mockDocument
  };
};

export const clearDOMMock = () => {
  delete global.document;
  delete global.location;
};

