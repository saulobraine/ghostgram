// Mock for DOM APIs
import { jest } from '@jest/globals';

export const createDOMMock = () => {
  const mockElement: Record<string, any> = {
    textContent: '',
    className: '',
    value: '',
    checked: false,
    style: {},
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
    createElement: jest.fn((tag: string) => {
      const element: Record<string, any> = { ...mockElement };
      element.tagName = tag ? tag.toUpperCase() : 'DIV';
      return element;
    }),
    getElementById: jest.fn((id: string) => {
      const element: Record<string, any> = { ...mockElement };
      element.id = id;
      return element;
    }),
    querySelector: jest.fn(() => mockElement),
    querySelectorAll: jest.fn(() => []),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  };

  (global as any).document = mockDocument;
  (global as any).location = {
    hostname: 'www.instagram.com',
    reload: jest.fn()
  };

  return {
    mockElement,
    mockDocument
  };
};

export const clearDOMMock = () => {
  delete (global as any).document;
  delete (global as any).location;
};

