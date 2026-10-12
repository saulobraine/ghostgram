// Mock for global fetch() API
// Provides a configurable fetch mock for testing Instagram API calls
import { jest } from '@jest/globals';

interface MockResponse {
  body?: any;
  ok?: boolean;
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  error?: Error;
  redirected?: boolean;
  url?: string;
}

interface MockFetch {
  (...args: any[]): Promise<any>;
  mockResponseOnce: (
    body: any,
    status?: number,
    meta?: { headers?: Record<string, string>; redirected?: boolean; url?: string }
  ) => void;
  mockErrorResponseOnce: (status?: number, body?: any) => void;
  mockNetworkErrorOnce: (message?: string) => void;
  mockResponses: (bodies: any[]) => void;
  clearQueue: () => void;
  mockRestore?: () => void;
}

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
export const setupFetchMock = (): MockFetch => {
  const responseQueue: MockResponse[] = [];

  const mockFetchFn = jest.fn(async (_url: string, _options?: any) => {
    if (responseQueue.length > 0) {
      const next = responseQueue.shift()!;

      if (next.error) {
        throw next.error;
      }

      const headersMap = new Map<string, string>();
      if (next.headers) {
        for (const [k, v] of Object.entries(next.headers)) {
          headersMap.set(k.toLowerCase(), v);
        }
      }

      return {
        ok: next.ok ?? true,
        status: next.status ?? 200,
        statusText: next.statusText ?? 'OK',
        redirected: next.redirected ?? false,
        url: next.url ?? _url,
        json: async () => {
          if (typeof next.body === 'string') {
            return JSON.parse(next.body);
          }
          return next.body;
        },
        text: async () => typeof next.body === 'string' ? next.body : JSON.stringify(next.body),
        headers: {
          get: (name: string) => headersMap.get(name.toLowerCase()) || null,
          has: (name: string) => headersMap.has(name.toLowerCase())
        }
      };
    }

    // Default: 200 OK with empty JSON
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      redirected: false,
      url: _url,
      json: async () => ({}),
      text: async () => '{}',
      headers: {
        get: () => null,
        has: () => false
      }
    };
  });

  const mockFetch = mockFetchFn as unknown as MockFetch;

  /**
   * Queue a successful JSON response
   */
  mockFetch.mockResponseOnce = (
    body: any,
    status = 200,
    meta?: { headers?: Record<string, string>; redirected?: boolean; url?: string }
  ) => {
    responseQueue.push({
      body,
      ok: status >= 200 && status < 300,
      status,
      headers: meta?.headers,
      redirected: meta?.redirected,
      url: meta?.url
    });
  };

  /**
   * Queue an HTTP error response
   */
  mockFetch.mockErrorResponseOnce = (status = 429, body: any = { message: 'Rate limited' }) => {
    responseQueue.push({ body, ok: false, status });
  };

  /**
   * Queue a network error (fetch rejects)
   */
  mockFetch.mockNetworkErrorOnce = (message = 'Network error') => {
    responseQueue.push({ error: new Error(message) });
  };

  /**
   * Queue multiple successful responses
   */
  mockFetch.mockResponses = (bodies: any[]) => {
    bodies.forEach(body => mockFetch.mockResponseOnce(body));
  };

  /**
   * Clear the response queue
   */
  mockFetch.clearQueue = () => {
    responseQueue.length = 0;
  };

  (global as any).fetch = mockFetch;

  return mockFetch;
};

export const clearFetchMock = () => {
  if ((global as any).fetch?.mockRestore) {
    (global as any).fetch.mockRestore();
  }
  delete (global as any).fetch;
};
