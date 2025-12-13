// Jest setup file
import { beforeEach, afterEach } from '@jest/globals';
import { createChromeMock, clearChromeMock } from '../mocks/chrome-api.mock.js';
import { createDOMMock, clearDOMMock } from '../mocks/dom.mock.js';

// Setup mocks before each test
beforeEach(() => {
  createChromeMock();
  createDOMMock();
});

// Cleanup after each test
afterEach(() => {
  clearChromeMock();
  clearDOMMock();
  // Note: jest.clearAllMocks() is not needed when using @jest/globals
  // The mocks are automatically cleared between tests
});

