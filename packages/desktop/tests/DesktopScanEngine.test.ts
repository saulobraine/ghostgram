import { describe, it, expect, vi } from 'vitest';
import { DesktopScanEngine } from '../src/main/DesktopScanEngine';
import { DesktopInstagramApiClient } from '../src/main/DesktopInstagramApiClient';

describe('DesktopScanEngine', () => {
  it('deve cruzar listas de following e followers identificando não-seguidores', async () => {
    const mockApiClient = {
      fetchFriendshipsPage: vi.fn().mockImplementation((endpoint: 'following' | 'followers') => {
        if (endpoint === 'following') {
          return Promise.resolve({
            users: [
              { pk: 1, pk_id: '1', username: 'user_one', full_name: 'User 1', is_private: false, is_verified: false },
              { pk: 2, pk_id: '2', username: 'user_two', full_name: 'User 2', is_private: true, is_verified: true },
              { pk: 3, pk_id: '3', username: 'user_three', full_name: 'User 3', is_private: false, is_verified: false },
            ],
            has_more: false,
            status: 'ok',
          });
        }
        if (endpoint === 'followers') {
          return Promise.resolve({
            users: [
              // Apenas user_two segue de volta
              { pk: 2, pk_id: '2', username: 'user_two', full_name: 'User 2', is_private: true, is_verified: true },
            ],
            has_more: false,
            status: 'ok',
          });
        }
        return Promise.resolve({ users: [], status: 'ok' });
      }),
    } as unknown as DesktopInstagramApiClient;

    const engine = new DesktopScanEngine(mockApiClient);
    const results = await engine.runScan('12345', null);

    expect(results.length).toBe(3);

    const nonFollowers = results.filter((u) => !u.followsViewer);
    expect(nonFollowers.length).toBe(2);
    expect(nonFollowers.map((u) => u.username)).toEqual(['user_one', 'user_three']);

    const followers = results.filter((u) => u.followsViewer);
    expect(followers.length).toBe(1);
    expect(followers[0].username).toBe('user_two');
  });

  it('deve cancelar a execução se cancel() for acionado', async () => {
    const mockApiClient = {
      fetchFriendshipsPage: vi.fn().mockImplementation(() => {
        return Promise.resolve({
          users: [{ pk: 1, pk_id: '1', username: 'u1' }],
          next_max_id: 'cursor_2',
          has_more: true,
          status: 'ok',
        });
      }),
    } as unknown as DesktopInstagramApiClient;

    const engine = new DesktopScanEngine(mockApiClient);

    // Disparar cancelamento após início
    setTimeout(() => {
      engine.cancel();
    }, 50);

    const results = await engine.runScan('12345', null);
    expect(results).toEqual([]);
  });
});
