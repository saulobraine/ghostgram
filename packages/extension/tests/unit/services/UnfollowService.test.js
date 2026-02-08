// Testes unitários - UnfollowService (usa API mock)
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { UnfollowService } from '../../../src/bundle/services/UnfollowService.js';
import { Settings } from '../../../src/domain/Settings.js';
import { User } from '../../../src/bundle/domain/User.js';
import { DelayHelper } from '../../../src/bundle/utils/DelayHelper.js';
import { dbService } from '../../../src/bundle/services/DatabaseService.js';

// Mock DelayHelper.sleep
const originalSleep = DelayHelper.sleep;
const originalCalcDelay = DelayHelper.calculateRandomDelayWithVariation;

function createUser(id, username) {
  return User.fromObject({
    id: String(id),
    username: username || `user_${id}`,
    full_name: `User ${id}`,
    profile_pic_url: 'https://instagram.com/pic.jpg',
    is_verified: false,
    is_private: false,
    follows_viewer: false
  });
}

describe('UnfollowService', () => {
  let mockApiClient;
  let settings;
  let onProgress;

  beforeEach(() => {
    DelayHelper.sleep = jest.fn(() => Promise.resolve());
    DelayHelper.calculateRandomDelayWithVariation = jest.fn(() => 0);

    settings = Settings.createDefault();
    onProgress = jest.fn();

    mockApiClient = {
      unfollowUser: jest.fn(() => Promise.resolve(true))
    };

    // Mock dbService.logAction
    dbService.logAction = jest.fn(() => Promise.resolve('action_id'));
  });

  afterEach(() => {
    DelayHelper.sleep = originalSleep;
    DelayHelper.calculateRandomDelayWithVariation = originalCalcDelay;
  });

  describe('execute', () => {
    it('deve executar unfollow em todos os users e retornar log entries', async () => {
      const users = [createUser(1), createUser(2), createUser(3)];
      const service = new UnfollowService(mockApiClient, settings, onProgress);

      const log = await service.execute(users);

      expect(log).toHaveLength(3);
      expect(log.every(entry => entry.wasSuccessful())).toBe(true);
    });

    it('deve chamar unfollowUser da API para cada user', async () => {
      const users = [createUser(1), createUser(2)];
      const service = new UnfollowService(mockApiClient, settings, onProgress);

      await service.execute(users);

      expect(mockApiClient.unfollowUser).toHaveBeenCalledTimes(2);
      expect(mockApiClient.unfollowUser).toHaveBeenCalledWith(settings, '1');
      expect(mockApiClient.unfollowUser).toHaveBeenCalledWith(settings, '2');
    });

    it('deve notificar progresso a cada user', async () => {
      const users = [createUser(1), createUser(2), createUser(3)];
      const service = new UnfollowService(mockApiClient, settings, onProgress);

      await service.execute(users);

      expect(onProgress).toHaveBeenCalledTimes(3);
      // Verifica porcentagens: 33%, 67%, 100%
      expect(onProgress.mock.calls[0][0]).toBe(33);
      expect(onProgress.mock.calls[1][0]).toBe(67);
      expect(onProgress.mock.calls[2][0]).toBe(100);
    });

    it('deve registrar ação no DatabaseService', async () => {
      const users = [createUser(1, 'john_doe')];
      const service = new UnfollowService(mockApiClient, settings, onProgress);

      await service.execute(users);

      expect(dbService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: '1',
          username: 'john_doe',
          actionType: 'unfollow',
          source: 'auto'
        })
      );
    });

    it('deve continuar após erro em um user e marcar como failure', async () => {
      const users = [createUser(1), createUser(2), createUser(3)];
      mockApiClient.unfollowUser
        .mockResolvedValueOnce(true)
        .mockRejectedValueOnce(new Error('Rate limited'))
        .mockResolvedValueOnce(true);

      const service = new UnfollowService(mockApiClient, settings, onProgress);
      const log = await service.execute(users);

      expect(log).toHaveLength(3);
      expect(log[0].wasSuccessful()).toBe(true);
      expect(log[1].wasFailure()).toBe(true);
      expect(log[2].wasSuccessful()).toBe(true);
    });

    it('deve retornar array vazio para lista vazia de users', async () => {
      const service = new UnfollowService(mockApiClient, settings, onProgress);
      const log = await service.execute([]);

      expect(log).toHaveLength(0);
      expect(mockApiClient.unfollowUser).not.toHaveBeenCalled();
    });
  });

  describe('stop', () => {
    it('deve interromper antes de processar todos os users', async () => {
      const users = [createUser(1), createUser(2), createUser(3), createUser(4), createUser(5)];
      let processedCount = 0;

      const service = new UnfollowService(mockApiClient, settings, onProgress);

      mockApiClient.unfollowUser.mockImplementation(async () => {
        processedCount++;
        if (processedCount >= 2) {
          service.stop();
        }
        return true;
      });

      const log = await service.execute(users);

      expect(log.length).toBeLessThanOrEqual(3);
    });
  });

  describe('pause e resume', () => {
    it('pause deve marcar isPaused', () => {
      const service = new UnfollowService(mockApiClient, settings, onProgress);
      service.pause();
      expect(service._isPaused).toBe(true);
    });

    it('resume deve desmarcar isPaused', () => {
      const service = new UnfollowService(mockApiClient, settings, onProgress);
      service.pause();
      service.resume();
      expect(service._isPaused).toBe(false);
    });
  });

  describe('_shouldWaitAfterFiveUnfollows', () => {
    it('deve retornar true no 5º unfollow (index 4)', () => {
      const service = new UnfollowService(mockApiClient, settings, onProgress);
      expect(service._shouldWaitAfterFiveUnfollows(4)).toBe(true);
    });

    it('deve retornar true no 10º unfollow (index 9)', () => {
      const service = new UnfollowService(mockApiClient, settings, onProgress);
      expect(service._shouldWaitAfterFiveUnfollows(9)).toBe(true);
    });

    it('deve retornar false para índices não múltiplos de 5', () => {
      const service = new UnfollowService(mockApiClient, settings, onProgress);
      expect(service._shouldWaitAfterFiveUnfollows(0)).toBe(false);
      expect(service._shouldWaitAfterFiveUnfollows(1)).toBe(false);
      expect(service._shouldWaitAfterFiveUnfollows(3)).toBe(false);
    });
  });

  describe('delays entre unfollows', () => {
    it('deve aguardar entre unfollows quando há delay configurado', async () => {
      DelayHelper.calculateRandomDelayWithVariation = jest.fn(() => 1000);
      const users = [createUser(1), createUser(2), createUser(3)];
      const service = new UnfollowService(mockApiClient, settings, onProgress);

      await service.execute(users);

      // Sleep chamado em chunks pela interruptibleSleep
      expect(DelayHelper.sleep).toHaveBeenCalled();
    });
  });
});
