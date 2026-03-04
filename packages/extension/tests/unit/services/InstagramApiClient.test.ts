// Testes unitários - InstagramApiClient (usa fetch mock + fixtures)
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { InstagramApiClient } from '../../../src/bundle/services/InstagramApiClient.js';
import { setupFetchMock, clearFetchMock } from '../../mocks/fetch.mock.js';
import {
  createUserNode,
  createFollowersResponse,
  createUnfollowResponse,
  createErrorResponse
} from '../../mocks/instagram-api.fixtures.js';
import { Settings } from '../../../src/domain/Settings.js';

describe('InstagramApiClient', () => {
  let client;
  let fetchMock;
  let settings;

  beforeEach(() => {
    client = new InstagramApiClient();
    fetchMock = setupFetchMock();
    settings = Settings.createDefault();
    // Set up cookies for CookieHelper
    Object.defineProperty(document, 'cookie', {
      writable: true,
      configurable: true,
      value: 'csrftoken=fake-csrf-token; ds_user_id=999999'
    });
  });

  afterEach(() => {
    clearFetchMock();
    // Reset cookie
    try {
      Object.defineProperty(document, 'cookie', {
        writable: true,
        configurable: true,
        value: ''
      });
    } catch (e) {
      // ignore
    }
  });

  describe('fetchFollowers', () => {
    it('deve retornar users, hasNextPage, endCursor e totalCount', async () => {
      const apiResponse = createFollowersResponse({
        users: [
          createUserNode({ id: '1', username: 'user1' }),
          createUserNode({ id: '2', username: 'user2' })
        ],
        hasNextPage: true,
        endCursor: 'cursor_abc',
        totalCount: 200
      });
      fetchMock.mockResponseOnce(apiResponse);

      const result = await client.fetchFollowers(settings, null);

      expect(result.users).toHaveLength(2);
      expect(result.hasNextPage).toBe(true);
      expect(result.endCursor).toBe('cursor_abc');
      expect(result.totalCount).toBe(200);
    });

    it('deve parsear User objects com dados corretos', async () => {
      const apiResponse = createFollowersResponse({
        users: [createUserNode({
          id: '123',
          username: 'john_doe',
          full_name: 'John Doe',
          is_verified: true,
          is_private: false,
          follows_viewer: true
        })]
      });
      fetchMock.mockResponseOnce(apiResponse);

      const result = await client.fetchFollowers(settings, null);
      const user = result.users[0];

      expect(user.getId()).toBe('123');
      expect(user.getUsername()).toBe('john_doe');
      expect(user.getFullName()).toBe('John Doe');
      expect(user.isVerified()).toBe(true);
      expect(user.isPrivate()).toBe(false);
      expect(user.followsViewer()).toBe(true);
    });

    it('deve retornar página sem próxima quando hasNextPage é false', async () => {
      const apiResponse = createFollowersResponse({
        users: [createUserNode()],
        hasNextPage: false,
        endCursor: null
      });
      fetchMock.mockResponseOnce(apiResponse);

      const result = await client.fetchFollowers(settings, null);

      expect(result.hasNextPage).toBe(false);
      expect(result.endCursor).toBeNull();
    });

    it('deve lançar erro para HTTP 429 (rate limit)', async () => {
      fetchMock.mockErrorResponseOnce(429, createErrorResponse('Rate limited'));

      await expect(client.fetchFollowers(settings, null))
        .rejects.toThrow('Failed to fetch followers: 429');
    });

    it('deve lançar erro para resposta inválida (sem data.user)', async () => {
      fetchMock.mockResponseOnce({ invalid: 'structure' });

      await expect(client.fetchFollowers(settings, null))
        .rejects.toThrow('Invalid API response structure');
    });

    it('deve lançar erro para network error', async () => {
      fetchMock.mockNetworkErrorOnce('Network failure');

      await expect(client.fetchFollowers(settings, null))
        .rejects.toThrow('Network failure');
    });

    it('deve chamar fetch com a URL correta', async () => {
      fetchMock.mockResponseOnce(createFollowersResponse());

      await client.fetchFollowers(settings, null);

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('unfollowUser', () => {
    it('deve retornar true quando bem-sucedido', async () => {
      fetchMock.mockResponseOnce(createUnfollowResponse());

      const result = await client.unfollowUser(settings, '12345');

      expect(result).toBe(true);
    });

    it('deve enviar POST com headers corretos', async () => {
      fetchMock.mockResponseOnce(createUnfollowResponse());

      await client.unfollowUser(settings, '12345');

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'content-type': 'application/x-www-form-urlencoded',
            'x-csrftoken': expect.any(String)
          }),
          credentials: 'include'
        })
      );
    });

    it('deve lançar erro quando CSRF token não encontrado', async () => {
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: 'ds_user_id=999999'
      });

      await expect(client.unfollowUser(settings, '12345'))
        .rejects.toThrow('CSRF token not found');
    });

    it('deve lançar erro para HTTP error', async () => {
      fetchMock.mockErrorResponseOnce(403, { message: 'Forbidden' });

      await expect(client.unfollowUser(settings, '12345'))
        .rejects.toThrow('Failed to unfollow user: 403');
    });
  });
});
