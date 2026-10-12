import { describe, it, expect, vi } from 'vitest';
import { DesktopUnfollowEngine } from '../src/main/DesktopUnfollowEngine';
import { DesktopInstagramApiClient } from '../src/main/DesktopInstagramApiClient';

describe('DesktopUnfollowEngine', () => {
  it('deve processar fila de unfollow com sucesso para usuários selecionados', async () => {
    const mockApiClient = {
      unfollowUser: vi.fn().mockResolvedValue({ status: 'ok' }),
    } as unknown as DesktopInstagramApiClient;

    // Zero delays para execução instantânea no teste
    const engine = new DesktopUnfollowEngine(mockApiClient, {
      minDelayMs: 0,
      maxDelayMs: 0,
    });

    const targets = [
      { id: '101', username: 'user101' },
      { id: '102', username: 'user102' },
    ];

    const results = await engine.runUnfollowQueue(targets, 'dummy_token', null);

    expect(results.length).toBe(2);
    expect(results[0].success).toBe(true);
    expect(results[1].success).toBe(true);
    expect(mockApiClient.unfollowUser).toHaveBeenCalledTimes(2);
  });

  it('deve registrar falhas individuais sem interromper a fila', async () => {
    const mockApiClient = {
      unfollowUser: vi.fn()
        .mockRejectedValueOnce(new Error('Rate limited'))
        .mockResolvedValueOnce({ status: 'ok' }),
    } as unknown as DesktopInstagramApiClient;

    const engine = new DesktopUnfollowEngine(mockApiClient, {
      minDelayMs: 0,
      maxDelayMs: 0,
    });

    const targets = [
      { id: '101', username: 'user101' },
      { id: '102', username: 'user102' },
    ];

    const results = await engine.runUnfollowQueue(targets, 'dummy_token', null);

    expect(results.length).toBe(2);
    expect(results[0].success).toBe(false);
    expect(results[0].error).toContain('Rate limited');
    expect(results[1].success).toBe(true);
  });
});
