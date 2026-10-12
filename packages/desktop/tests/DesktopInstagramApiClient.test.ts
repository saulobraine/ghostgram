import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  DesktopInstagramApiClient,
  INSTAGRAM_WEB_APP_ID,
} from '../src/main/DesktopInstagramApiClient';
import { net, session } from 'electron';

vi.mock('electron', () => {
  const mockCookies = [
    { name: 'sessionid', value: 'sess_123' },
    { name: 'ds_user_id', value: 'user_456' },
    { name: 'csrftoken', value: 'csrf_789' },
  ];

  const mockSession = {
    cookies: {
      get: vi.fn().mockResolvedValue(mockCookies),
    },
  };

  return {
    session: {
      fromPartition: vi.fn().mockReturnValue(mockSession),
    },
    net: {
      fetch: vi.fn(),
    },
  };
});

describe('DesktopInstagramApiClient', () => {
  let client: DesktopInstagramApiClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new DesktopInstagramApiClient();
  });

  it('deve formatar url e headers corretamente ao buscar following', async () => {
    const mockJson = {
      users: [{ pk: 1, username: 'testuser', full_name: 'Test', is_private: false, is_verified: false, profile_pic_url: '' }],
      has_more: false,
      status: 'ok',
    };

    (net.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockJson),
    });

    const res = await client.fetchFriendshipsPage('following', 'user_456', 'cursor_abc', 50);

    expect(net.fetch).toHaveBeenCalledWith(
      'https://www.instagram.com/api/v1/friendships/user_456/following/?count=50&max_id=cursor_abc',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'X-IG-App-ID': INSTAGRAM_WEB_APP_ID,
          'X-Requested-With': 'XMLHttpRequest',
          'Cookie': 'sessionid=sess_123; ds_user_id=user_456; csrftoken=csrf_789',
        }),
      })
    );

    expect(res.users.length).toBe(1);
    expect(res.users[0].username).toBe('testuser');
  });

  it('deve realizar requisição POST com CSRF token e headers corretos para unfollowUser', async () => {
    (net.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ status: 'ok' }),
    });

    const res = await client.unfollowUser('target_999', 'csrf_789');

    expect(net.fetch).toHaveBeenCalledWith(
      'https://www.instagram.com/web/friendships/target_999/unfollow/',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-CSRFToken': 'csrf_789',
          'X-IG-App-ID': INSTAGRAM_WEB_APP_ID,
        }),
      })
    );

    expect(res.status).toBe('ok');
  });

  it('deve lançar erro descritivo em caso de resposta HTTP com falha', async () => {
    (net.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: () => Promise.resolve('Checkpoint required'),
    });

    await expect(client.unfollowUser('target_999', 'csrf_789')).rejects.toThrow(
      'Erro HTTP 403 ao deixar de seguir target_999: Checkpoint required'
    );
  });
});
