// Jest setup file
import { beforeEach, afterEach } from '@jest/globals';
import { createChromeMock, clearChromeMock } from '../mocks/chrome-api.mock.js';
import { createDOMMock, clearDOMMock } from '../mocks/dom.mock.js';
import { setupFetchMock, clearFetchMock } from '../mocks/fetch.mock.js';

// Preserva document original do jsdom para testes que precisam de DOM real
(globalThis as Record<string, unknown>)._jsdomDocument = globalThis.document;

// Setup mocks before each test
beforeEach(() => {
  createChromeMock();
  createDOMMock();
  setupFetchMock();
});

// Cleanup after each test
afterEach(() => {
  clearFetchMock();
  clearChromeMock();
  clearDOMMock();
  // Note: jest.clearAllMocks() is not needed when using @jest/globals
  // The mocks are automatically cleared between tests
});

