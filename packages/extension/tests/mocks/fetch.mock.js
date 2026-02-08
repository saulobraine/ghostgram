// Mock for global fetch() API
// Provides a configurable fetch mock for testing Instagram API calls
import { jest } from '@jest/globals';

/**
 * Creates and installs a mock for the global fetch function.
 * 
 * Usage in tests:
 *   import { setupFetchMock } from '../mocks/fetch.mock.js';
 *   const fetchMock = setupFetchMock();
 *   fetchMock.mockResponseOnce(createFollowersResponse());
 *   // ... run code that calls fetch() ...
 *   expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('query_hash'));
 */
export const setupFetchMock = () => {
  const responseQueue = [];

  const mockFetch = jest.fn(async (url, options) => {
    if (responseQueue.length > 0) {
      const next = responseQueue.shift();

      if (next.error) {
        throw next.error;
      }

      return {
        ok: next.ok ?? true,
        status: next.status ?? 200,
        statusText: next.statusText ?? 'OK',
        json: async () => next.body,
        text: async () => JSON.stringify(next.body),
        headers: new Map(Object.entries(next.headers ?? {}))
      };
    }

    // Default: 200 OK with empty JSON
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({}),
      text: async () => '{}',
      headers: new Map()
    };
  });

  /**
   * Queue a successful JSON response
   * @param {Object} body - Response body
   * @param {number} status - HTTP status code
   */
  mockFetch.mockResponseOnce = (body, status = 200) => {
    responseQueue.push({ body, ok: status >= 200 && status < 300, status });
  };

  /**
   * Queue an HTTP error response
   * @param {number} status - HTTP status code
   * @param {Object} body - Response body
   */
  mockFetch.mockErrorResponseOnce = (status = 429, body = { message: 'Rate limited' }) => {
    responseQueue.push({ body, ok: false, status });
  };

  /**
   * Queue a network error (fetch rejects)
   * @param {string} message - Error message
   */
  mockFetch.mockNetworkErrorOnce = (message = 'Network error') => {
    responseQueue.push({ error: new Error(message) });
  };

  /**
   * Queue multiple successful responses
   * @param {Array<Object>} bodies - Array of response bodies
   */
  mockFetch.mockResponses = (bodies) => {
    bodies.forEach(body => mockFetch.mockResponseOnce(body));
  };

  /**
   * Clear the response queue
   */
  mockFetch.clearQueue = () => {
    responseQueue.length = 0;
  };

  global.fetch = mockFetch;

  return mockFetch;
};

export const clearFetchMock = () => {
  if (global.fetch?.mockRestore) {
    global.fetch.mockRestore();
  }
  delete global.fetch;
};
