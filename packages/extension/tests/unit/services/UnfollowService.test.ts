// Testes unitários - UnfollowService (usa API mock)
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { UnfollowService } from '../../../src/bundle/services/UnfollowService.js';
import { Settings } from '../../../src/domain/Settings.js';
import { User } from '../../../src/bundle/domain/User.js';
import { DelayHelper } from '../../../src/bundle/utils/DelayHelper.js';
import { dbService } from '../../../src/bundle/services/DatabaseService.js';

const originalSleep = DelayHelper.sleep;
const originalCalcDelay = DelayHelper.calculateRandomDelayWithVariation;

function createUser(id: number, username?: string) {
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
  let mockApiClient: { unfollowUser: jest.Mock };
  let settings: Settings;
  let onProgress: jest.Mock;

  beforeEach(() => {
    DelayHelper.sleep = jest.fn(() => Promise.resolve());
    DelayHelper.calculateRandomDelayWithVariation = jest.fn(() => 0);

    settings = Settings.createDefault();
    onProgress = jest.fn();

    mockApiClient = {
      unfollowUser: jest.fn(() => Promise.resolve(true))
    };

    dbService.logAction = jest.fn(() => Promise.resolve('action_id')) as any;
  });

  afterEach(() => {
    DelayHelper.sleep = originalSleep;
    DelayHelper.calculateRandomDelayWithVariation = originalCalcDelay;
  });

  describe('execute', () => {
    it('deve executar unfollow em todos os users e retornar log entries', async () => {
      const users = [createUser(1), createUser(2), createUser(3)];
      const service = new UnfollowService(mockApiClient as any, settings, onProgress);

      const log = await service.execute(users);

      expect(log).toHaveLength(3);
      expect(log.every(entry => entry.wasSuccessful())).toBe(true);
    });

    it('deve chamar unfollowUser da API para cada user', async () => {
      const users = [createUser(1), createUser(2)];
      const service = new UnfollowService(mockApiClient as any, settings, onProgress);

      await service.execute(users);

      expect(mockApiClient.unfollowUser).toHaveBeenCalledTimes(2);
      expect(mockApiClient.unfollowUser).toHaveBeenCalledWith(settings, '1');
      expect(mockApiClient.unfollowUser).toHaveBeenCalledWith(settings, '2');
    });

    it('deve notificar progresso em running a cada user', async () => {
      const users = [createUser(1), createUser(2), createUser(3)];
      const service = new UnfollowService(mockApiClient as any, settings, onProgress);

      await service.execute(users);

      const runningCalls = onProgress.mock.calls.filter(([, , uiState]) => uiState?.state === 'running');
      const runningPercentages = runningCalls.map(([percentage]) => percentage);

      expect(runningPercentages).toContain(33);
      expect(runningPercentages).toContain(67);
      expect(runningPercentages).toContain(100);
      expect(runningCalls[0][2]).toEqual({
        state: 'running',
        remainingMs: null,
        reason: null
      });
    });

    it('deve registrar ação no DatabaseService', async () => {
      const users = [createUser(1, 'john_doe')];
      const service = new UnfollowService(mockApiClient as any, settings, onProgress);

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

    it('deve parar após erro não recuperável e marcar como failure', async () => {
      const users = [createUser(1), createUser(2), createUser(3)];
      mockApiClient.unfollowUser
        .mockResolvedValueOnce(true)
        .mockRejectedValueOnce(new Error('Bad request'));

      const service = new UnfollowService(mockApiClient as any, settings, onProgress);
      const log = await service.execute(users);

      expect(log).toHaveLength(2);
      expect(log[0].wasSuccessful()).toBe(true);
      expect(log[1].wasFailure()).toBe(true);
      expect(mockApiClient.unfollowUser).toHaveBeenCalledTimes(2);
    });

    it('deve retornar array vazio para lista vazia de users', async () => {
      const service = new UnfollowService(mockApiClient as any, settings, onProgress);
      const log = await service.execute([]);

      expect(log).toHaveLength(0);
      expect(mockApiClient.unfollowUser).not.toHaveBeenCalled();
    });
  });

  describe('stop', () => {
    it('deve interromper antes de processar todos os users', async () => {
      const users = [createUser(1), createUser(2), createUser(3), createUser(4), createUser(5)];
      let processedCount = 0;

      const service = new UnfollowService(mockApiClient as any, settings, onProgress);

      mockApiClient.unfollowUser.mockImplementation(async () => {
        processedCount++;
        if (processedCount >= 2) {
          service.stop();
        }
        return true;
      });

      const log = await service.execute(users);

      expect(log.length).toBeLessThanOrEqual(2);
    });
  });

  describe('pause e resume', () => {
    it('pause deve marcar isPaused', () => {
      const service = new UnfollowService(mockApiClient as any, settings, onProgress);
      service.pause();
      expect((service as any)._isPaused).toBe(true);
    });

    it('resume deve desmarcar isPaused', () => {
      const service = new UnfollowService(mockApiClient as any, settings, onProgress);
      service.pause();
      service.resume();
      expect((service as any)._isPaused).toBe(false);
    });
  });

  describe('_shouldWaitAfterFiveUnfollows', () => {
    it('deve retornar true no 5º unfollow (index 4)', () => {
      const service = new UnfollowService(mockApiClient as any, settings, onProgress);
      expect((service as any)._shouldWaitAfterFiveUnfollows(4)).toBe(true);
    });

    it('deve retornar true no 10º unfollow (index 9)', () => {
      const service = new UnfollowService(mockApiClient as any, settings, onProgress);
      expect((service as any)._shouldWaitAfterFiveUnfollows(9)).toBe(true);
    });

    it('deve retornar false para índices não múltiplos de 5', () => {
      const service = new UnfollowService(mockApiClient as any, settings, onProgress);
      expect((service as any)._shouldWaitAfterFiveUnfollows(0)).toBe(false);
      expect((service as any)._shouldWaitAfterFiveUnfollows(1)).toBe(false);
      expect((service as any)._shouldWaitAfterFiveUnfollows(3)).toBe(false);
    });
  });

  describe('estados visuais de pausa automática', () => {
    it('deve emitir estado cooldown com remainingMs', async () => {
      const customSettings = Settings.fromObject({
        ...settings.toObject(),
        timeBetweenUnfollows: 1200,
        timeToWaitAfterFiveUnfollows: 5000,
        unfollowsPerCycle: 5
      });
      DelayHelper.calculateRandomDelayWithVariation = jest.fn(() => 1200);

      const users = [createUser(1), createUser(2)];
      const service = new UnfollowService(mockApiClient as any, customSettings, onProgress);

      await service.execute(users);

      expect(onProgress).toHaveBeenCalledWith(
        50,
        expect.any(Array),
        expect.objectContaining({
          state: 'cooldown',
          remainingMs: 1200,
          reason: null
        })
      );
    });

    it('deve emitir estado cycle_pause com motivo após fechar o ciclo', async () => {
      const customSettings = Settings.fromObject({
        ...settings.toObject(),
        timeBetweenUnfollows: 1000,
        timeToWaitAfterFiveUnfollows: 4000,
        unfollowsPerCycle: 2
      });
      DelayHelper.calculateRandomDelayWithVariation = jest.fn(() => 1000);

      const users = [createUser(1), createUser(2), createUser(3)];
      const service = new UnfollowService(mockApiClient as any, customSettings, onProgress);

      await service.execute(users);

      expect(onProgress).toHaveBeenCalledWith(
        67,
        expect.any(Array),
        expect.objectContaining({
          state: 'cycle_pause',
          remainingMs: 4000,
          reason: 'Pausa automática após 2 unfollows para reduzir o risco de bloqueio por atividade suspeita.'
        })
      );
    });

    it('deve voltar a emitir running após a pausa automática', async () => {
      const customSettings = Settings.fromObject({
        ...settings.toObject(),
        timeBetweenUnfollows: 1000,
        timeToWaitAfterFiveUnfollows: 3000,
        unfollowsPerCycle: 2
      });
      DelayHelper.calculateRandomDelayWithVariation = jest.fn(() => 1000);

      const users = [createUser(1), createUser(2), createUser(3)];
      const service = new UnfollowService(mockApiClient as any, customSettings, onProgress);

      await service.execute(users);

      const runningCalls = onProgress.mock.calls.filter(([, , uiState]) => uiState?.state === 'running');
      expect(runningCalls.length).toBeGreaterThan(0);
      expect(runningCalls[runningCalls.length - 1][2]).toEqual({
        state: 'running',
        remainingMs: null,
        reason: null
      });
    });
  });
});
