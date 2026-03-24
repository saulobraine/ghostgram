// Teste de integração - Fluxo completo de unfollow
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { InstagramApiClient } from '../../src/bundle/services/InstagramApiClient.js';
import { UnfollowService } from '../../src/bundle/services/UnfollowService.js';
import { Settings } from '../../src/domain/Settings.js';
import { DelayHelper } from '../../src/bundle/utils/DelayHelper.js';
import { User } from '../../src/bundle/domain/User.js';
import { setupFetchMock } from '../mocks/fetch.mock.js';
import { createUnfollowResponse } from '../mocks/instagram-api.fixtures.js';
import { dbService } from '../../src/bundle/services/DatabaseService.js';

// Mock delays para execução instantânea
const originalSleep = DelayHelper.sleep;
const originalCalcDelay = DelayHelper.calculateRandomDelayWithVariation;

describe('Fluxo de Unfollow (Integração)', () => {
  let fetchMock;
  let settings;
  let users;

  beforeEach(() => {
    fetchMock = setupFetchMock();
    settings = Settings.createDefault();
    DelayHelper.sleep = jest.fn(() => Promise.resolve());
    DelayHelper.calculateRandomDelayWithVariation = jest.fn(() => 0);

    // Mock cookies para CSRF token
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'ds_user_id=999999; csrftoken=fake-csrf-token'
    });

    // Users de teste
    users = [
      User.fromObject({ id: '1', username: 'user_one', full_name: 'User One', profile_pic_url: 'http://pic1.jpg', is_verified: false, is_private: false, follows_viewer: false }),
      User.fromObject({ id: '2', username: 'user_two', full_name: 'User Two', profile_pic_url: 'http://pic2.jpg', is_verified: false, is_private: false, follows_viewer: false }),
      User.fromObject({ id: '3', username: 'user_three', full_name: 'User Three', profile_pic_url: 'http://pic3.jpg', is_verified: false, is_private: false, follows_viewer: false })
    ];

    // Mock dbService.logAction
    dbService.logAction = jest.fn(() => Promise.resolve('mock-id'));
  });

  afterEach(() => {
    DelayHelper.sleep = originalSleep;
    DelayHelper.calculateRandomDelayWithVariation = originalCalcDelay;
  });

  it('deve fazer unfollow de todos os users e registrar no DB', async () => {
    // Cada unfollow retorna sucesso
    users.forEach(() => {
      fetchMock.mockResponseOnce(createUnfollowResponse());
    });

    const apiClient = new InstagramApiClient();
    const onProgress = jest.fn();
    const service = new UnfollowService(apiClient, settings, onProgress);

    const results = await service.execute(users);

    // 3 unfollows realizados via fetch
    expect(fetchMock).toHaveBeenCalledTimes(3);

    // 3 entradas no log
    expect(results).toHaveLength(3);
    expect(results.every(r => r.wasSuccessful())).toBe(true);

    // DatabaseService recebeu 3 chamadas logAction
    expect(dbService.logAction).toHaveBeenCalledTimes(3);

    // Verifica dados da primeira chamada de log
    expect(dbService.logAction).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: '1',
        username: 'user_one'
      })
    );
  });

  it('deve notificar progresso a cada user', async () => {
    users.forEach(() => {
      fetchMock.mockResponseOnce(createUnfollowResponse());
    });

    const apiClient = new InstagramApiClient();
    const onProgress = jest.fn();
    const service = new UnfollowService(apiClient, settings, onProgress);

    await service.execute(users);

    // Progresso deve ter sido notificado 3 vezes
    expect(onProgress).toHaveBeenCalledTimes(3);
  });

  it('deve continuar unfollow mesmo com erro em um user', async () => {
    // Primeiro sucesso, segundo erro, terceiro sucesso
    fetchMock.mockResponseOnce(createUnfollowResponse());
    fetchMock.mockErrorResponseOnce(400, { message: 'Bad request' });
    fetchMock.mockResponseOnce(createUnfollowResponse());

    const apiClient = new InstagramApiClient();
    const onProgress = jest.fn();
    const service = new UnfollowService(apiClient, settings, onProgress);

    const results = await service.execute(users);

    expect(results).toHaveLength(3);
    expect(results[0].wasSuccessful()).toBe(true);
    expect(results[1].wasSuccessful()).toBe(false);
    expect(results[2].wasSuccessful()).toBe(true);

    // Fetch chamado para todos os 3
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('deve usar POST para chamadas de unfollow', async () => {
    fetchMock.mockResponseOnce(createUnfollowResponse());

    const apiClient = new InstagramApiClient();
    const service = new UnfollowService(apiClient, settings, jest.fn());

    await service.execute([users[0]]);

    // Verifica que fetch foi chamado com método POST
    const fetchCall = fetchMock.mock.calls[0];
    expect(fetchCall[1].method).toBe('POST');
  });
});
