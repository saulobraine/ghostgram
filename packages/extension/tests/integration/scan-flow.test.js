// Teste de integração - Fluxo completo de scan
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { InstagramApiClient } from '../../src/bundle/services/InstagramApiClient.js';
import { ScanService } from '../../src/bundle/services/ScanService.js';
import { Settings } from '../../src/domain/Settings.js';
import { DelayHelper } from '../../src/bundle/utils/DelayHelper.js';
import { setupFetchMock } from '../mocks/fetch.mock.js';
import {
  createUserNode,
  createFollowersResponse,
  createPaginatedFollowersResponses
} from '../mocks/instagram-api.fixtures.js';

// Mock delays para execução instantânea
const originalSleep = DelayHelper.sleep;
const originalCalcDelay = DelayHelper.calculateRandomDelayWithVariation;

describe('Fluxo de Scan (Integração)', () => {
  let fetchMock;
  let settings;

  beforeEach(() => {
    fetchMock = setupFetchMock();
    settings = Settings.createDefault();
    DelayHelper.sleep = jest.fn(() => Promise.resolve());
    DelayHelper.calculateRandomDelayWithVariation = jest.fn(() => 0);

    // Mock cookies para UrlGenerator
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'ds_user_id=999999; csrftoken=fake-csrf-token'
    });
  });

  afterEach(() => {
    DelayHelper.sleep = originalSleep;
    DelayHelper.calculateRandomDelayWithVariation = originalCalcDelay;
  });

  it('deve completar scan de 3 páginas via InstagramApiClient → ScanService', async () => {
    const responses = createPaginatedFollowersResponses(3, 5);
    responses.forEach(r => fetchMock.mockResponseOnce(r));

    const apiClient = new InstagramApiClient();
    const progressCalls = [];
    const onProgress = jest.fn((pct, results, cursor, processed, total) => {
      progressCalls.push({ pct, resultCount: results.length, processed, total });
    });

    const service = new ScanService(apiClient, settings, onProgress);
    const results = await service.start();

    // Verifica resultados completos
    expect(results).toHaveLength(15);
    expect(fetchMock).toHaveBeenCalledTimes(3);

    // Verifica que progresso foi notificado
    expect(onProgress).toHaveBeenCalled();

    // Última notificação deve ter 100%
    const lastCall = progressCalls[progressCalls.length - 1];
    expect(lastCall.pct).toBe(100);
    expect(lastCall.resultCount).toBe(15);
  });

  it('deve retomar scan parcial do ponto onde parou', async () => {
    // Simula que já temos 5 users da primeira página
    const existingUsers = Array.from({ length: 5 }, (_, i) =>
      createUserNode({ id: String(i), username: `user_${i}` })
    );

    // Simula as 2 páginas restantes
    const page2Response = createFollowersResponse({
      users: Array.from({ length: 5 }, (_, i) =>
        createUserNode({ id: String(i + 5), username: `user_${i + 5}` })
      ),
      hasNextPage: true,
      endCursor: 'cursor_2',
      totalCount: 15
    });
    const page3Response = createFollowersResponse({
      users: Array.from({ length: 5 }, (_, i) =>
        createUserNode({ id: String(i + 10), username: `user_${i + 10}` })
      ),
      hasNextPage: false,
      endCursor: null,
      totalCount: 15
    });

    fetchMock.mockResponseOnce(page2Response);
    fetchMock.mockResponseOnce(page3Response);

    const apiClient = new InstagramApiClient();
    const onProgress = jest.fn();
    const service = new ScanService(apiClient, settings, onProgress);

    const results = await service.start({
      initialResults: existingUsers,
      startCursor: 'cursor_1',
      initialProcessedCount: 5,
      initialTotalCount: 15
    });

    // 5 existentes + 10 novas = 15
    expect(results).toHaveLength(15);
    // Apenas 2 chamadas fetch (páginas 2 e 3)
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('deve identificar seguidores e não-seguidores corretamente', async () => {
    const response = createFollowersResponse({
      users: [
        createUserNode({ id: '1', username: 'follower', follows_viewer: true }),
        createUserNode({ id: '2', username: 'non_follower_1', follows_viewer: false }),
        createUserNode({ id: '3', username: 'non_follower_2', follows_viewer: false })
      ],
      hasNextPage: false,
      totalCount: 3
    });
    fetchMock.mockResponseOnce(response);

    const apiClient = new InstagramApiClient();
    const service = new ScanService(apiClient, settings, jest.fn());
    const results = await service.start();

    const followers = results.filter(u => u.followsViewer());
    const nonFollowers = results.filter(u => !u.followsViewer());

    expect(followers).toHaveLength(1);
    expect(nonFollowers).toHaveLength(2);
  });

  it('deve lidar com erro na API durante scan', async () => {
    fetchMock.mockErrorResponseOnce(429, { message: 'Rate limited' });

    const apiClient = new InstagramApiClient();
    const service = new ScanService(apiClient, settings, jest.fn());

    await expect(service.start()).rejects.toThrow();
  });
});
