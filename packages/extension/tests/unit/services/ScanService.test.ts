// Testes unitários - ScanService (usa API mock + fixtures)
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ScanService } from '../../../src/bundle/services/ScanService.js';
import { Settings } from '../../../src/domain/Settings.js';
import { DelayHelper } from '../../../src/bundle/utils/DelayHelper.js';
import {
  createUserNode,
  createFollowersResponse,
  createPaginatedFollowersResponses
} from '../../mocks/instagram-api.fixtures.js';

// Mock DelayHelper.sleep para evitar esperas reais
const originalSleep = DelayHelper.sleep;
const originalCalcDelay = DelayHelper.calculateRandomDelayWithVariation;

describe('ScanService', () => {
  let mockApiClient;
  let settings;
  let onProgress;

  beforeEach(() => {
    // Mock DelayHelper para execução instantânea
    DelayHelper.sleep = jest.fn(() => Promise.resolve());
    DelayHelper.calculateRandomDelayWithVariation = jest.fn(() => 0);

    settings = Settings.createDefault();
    onProgress = jest.fn();

    mockApiClient = {
      fetchFollowers: jest.fn()
    };
  });

  afterEach(() => {
    DelayHelper.sleep = originalSleep;
    DelayHelper.calculateRandomDelayWithVariation = originalCalcDelay;
  });

  describe('start', () => {
    it('deve completar scan de página única', async () => {
      const users = [
        createUserNode({ id: '1', username: 'user1' }),
        createUserNode({ id: '2', username: 'user2' })
      ];
      mockApiClient.fetchFollowers.mockResolvedValueOnce({
        users: users.map(u => u),
        hasNextPage: false,
        endCursor: null,
        totalCount: 2
      });

      const service = new ScanService(mockApiClient, settings, onProgress);
      const results = await service.start();

      expect(results).toHaveLength(2);
      expect(mockApiClient.fetchFollowers).toHaveBeenCalledTimes(1);
    });

    it('deve completar scan multi-página (3 páginas)', async () => {
      // Simula 3 páginas com 5 users cada
      const page1Users = Array.from({ length: 5 }, (_, i) => ({ id: String(i), username: `user_${i}` }));
      const page2Users = Array.from({ length: 5 }, (_, i) => ({ id: String(i + 5), username: `user_${i + 5}` }));
      const page3Users = Array.from({ length: 5 }, (_, i) => ({ id: String(i + 10), username: `user_${i + 10}` }));

      mockApiClient.fetchFollowers
        .mockResolvedValueOnce({ users: page1Users, hasNextPage: true, endCursor: 'cursor_1', totalCount: 15 })
        .mockResolvedValueOnce({ users: page2Users, hasNextPage: true, endCursor: 'cursor_2', totalCount: 15 })
        .mockResolvedValueOnce({ users: page3Users, hasNextPage: false, endCursor: null, totalCount: 15 });

      const service = new ScanService(mockApiClient, settings, onProgress);
      const results = await service.start();

      expect(results).toHaveLength(15);
      expect(mockApiClient.fetchFollowers).toHaveBeenCalledTimes(3);
    });

    it('deve notificar progresso a cada página', async () => {
      mockApiClient.fetchFollowers
        .mockResolvedValueOnce({ users: [{ id: '1' }], hasNextPage: true, endCursor: 'c1', totalCount: 2 })
        .mockResolvedValueOnce({ users: [{ id: '2' }], hasNextPage: false, endCursor: null, totalCount: 2 });

      const service = new ScanService(mockApiClient, settings, onProgress);
      await service.start();

      // Progresso inicial (0%) + 2 páginas
      expect(onProgress).toHaveBeenCalledTimes(3);

      // Última chamada deve ser 100%
      const lastCall = onProgress.mock.calls[onProgress.mock.calls.length - 1];
      expect(lastCall[0]).toBe(100);
    });

    it('deve retomar scan com initialResults e startCursor', async () => {
      const existingResults = [{ id: '1' }, { id: '2' }];
      mockApiClient.fetchFollowers
        .mockResolvedValueOnce({ users: [{ id: '3' }], hasNextPage: false, endCursor: null, totalCount: 3 });

      const service = new ScanService(mockApiClient, settings, onProgress);
      const results = await service.start({
        initialResults: existingResults,
        startCursor: 'resume_cursor',
        initialProcessedCount: 2,
        initialTotalCount: 3
      });

      expect(results).toHaveLength(3);
      expect(mockApiClient.fetchFollowers).toHaveBeenCalledWith(settings, 'resume_cursor');
    });

    it('deve propagar erro da API', async () => {
      mockApiClient.fetchFollowers.mockRejectedValueOnce(new Error('API Error'));

      const service = new ScanService(mockApiClient, settings, onProgress);

      await expect(service.start()).rejects.toThrow('API Error');
    });
  });

  describe('stop', () => {
    it('deve interromper o scan antes de completar', async () => {
      let callCount = 0;
      mockApiClient.fetchFollowers.mockImplementation(async () => {
        callCount++;
        return { users: [{ id: String(callCount) }], hasNextPage: true, endCursor: `c${callCount}`, totalCount: 100 };
      });

      const service = new ScanService(mockApiClient, settings, onProgress);

      // Stop após primeira página ser processada
      const originalSleepMock = DelayHelper.sleep;
      DelayHelper.sleep = jest.fn(async () => {
        if (callCount >= 2) service.stop();
      });

      const results = await service.start();

      // Deve parar em algum momento (não chegar a 100 chamadas)
      expect(mockApiClient.fetchFollowers.mock.calls.length).toBeLessThan(10);

      DelayHelper.sleep = originalSleepMock;
    });
  });

  describe('pause e resume', () => {
    it('pause deve marcar isPaused como true', () => {
      const service = new ScanService(mockApiClient, settings, onProgress);
      service.pause();
      expect(service._isPaused).toBe(true);
    });

    it('resume deve marcar isPaused como false', () => {
      const service = new ScanService(mockApiClient, settings, onProgress);
      service.pause();
      service.resume();
      expect(service._isPaused).toBe(false);
    });
  });

  describe('_shouldWaitAfterFiveCycles', () => {
    it('deve retornar true quando cycleCount é múltiplo de 5', () => {
      const service = new ScanService(mockApiClient, settings, onProgress);
      expect(service._shouldWaitAfterFiveCycles(5)).toBe(true);
      expect(service._shouldWaitAfterFiveCycles(10)).toBe(true);
      expect(service._shouldWaitAfterFiveCycles(15)).toBe(true);
    });

    it('deve retornar false quando cycleCount não é múltiplo de 5', () => {
      const service = new ScanService(mockApiClient, settings, onProgress);
      expect(service._shouldWaitAfterFiveCycles(1)).toBe(false);
      expect(service._shouldWaitAfterFiveCycles(3)).toBe(false);
      expect(service._shouldWaitAfterFiveCycles(7)).toBe(false);
    });

    it('deve retornar false quando cycleCount é 0', () => {
      const service = new ScanService(mockApiClient, settings, onProgress);
      expect(service._shouldWaitAfterFiveCycles(0)).toBe(false);
    });
  });

  describe('deduplicação de usuários', () => {
    it('deve deduplicar usuários repetidos entre páginas na API REST (friendships)', async () => {
      mockApiClient.fetchFriendshipsPage = jest.fn();

      // Fase 1: Following (página 1 e 2 com user2 repetido na transição)
      mockApiClient.fetchFriendshipsPage
        .mockResolvedValueOnce({
          users: [
            { pk_id: '1', username: 'user1' },
            { pk_id: '2', username: 'user2' }
          ],
          next_max_id: 'cursor_p2',
          has_more: true,
          isLegacyGraphQL: false
        })
        .mockResolvedValueOnce({
          users: [
            { pk_id: '2', username: 'user2' }, // repetido!
            { pk_id: '3', username: 'user3' }
          ],
          next_max_id: null,
          has_more: false,
          isLegacyGraphQL: false
        })
        // Fase 2: Followers (página 1)
        .mockResolvedValueOnce({
          users: [
            { pk_id: '3', username: 'user3' }
          ],
          next_max_id: null,
          has_more: false,
          isLegacyGraphQL: false
        });

      const service = new ScanService(mockApiClient, settings, onProgress);
      const results = await service.start();

      expect(results).toHaveLength(3);
      const ids = results.map(u => u.getId());
      expect(ids).toEqual(['1', '2', '3']);
      expect(new Set(ids).size).toBe(3);
    });

    it('deve deduplicar usuários repetidos no scan legado GraphQL', async () => {
      mockApiClient.fetchFollowers
        .mockResolvedValueOnce({
          users: [{ id: '1', username: 'u1' }, { id: '2', username: 'u2' }],
          hasNextPage: true,
          endCursor: 'c1',
          totalCount: 3
        })
        .mockResolvedValueOnce({
          users: [{ id: '2', username: 'u2' }, { id: '3', username: 'u3' }], // id 2 repetido
          hasNextPage: false,
          endCursor: null,
          totalCount: 3
        });

      const service = new ScanService(mockApiClient, settings, onProgress);
      const results = await service.start();

      expect(results).toHaveLength(3);
      const ids = results.map(u => (typeof u.getId === 'function' ? u.getId() : (u as any).id));
      expect(ids).toEqual(['1', '2', '3']);
    });
  });

  describe('delays entre ciclos', () => {
    it('deve chamar sleep entre páginas', async () => {
      mockApiClient.fetchFollowers
        .mockResolvedValueOnce({ users: [{ id: '1' }], hasNextPage: true, endCursor: 'c1', totalCount: 2 })
        .mockResolvedValueOnce({ users: [{ id: '2' }], hasNextPage: false, endCursor: null, totalCount: 2 });

      const service = new ScanService(mockApiClient, settings, onProgress);
      await service.start();

      // Deve ter chamado sleep ao menos 1 vez (entre as 2 páginas)
      expect(DelayHelper.sleep).toHaveBeenCalled();
    });
  });
});
