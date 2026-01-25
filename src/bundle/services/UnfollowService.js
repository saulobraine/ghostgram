// UnfollowService - Service for unfollowing users
import { InstagramApiClient } from './InstagramApiClient.js';
import { DelayHelper } from '../utils/DelayHelper.js';
import { Settings } from '../../domain/Settings.js';
import { UnfollowLogEntry } from '../domain/UnfollowLogEntry.js';
import { dbService } from './DatabaseService.js';
import { ACTION_TYPES, ACTION_SOURCES } from '../../constants/Constants.js';

/**
 * Serviço responsável pela lógica de deixar de seguir usuários no Instagram
 * Gerencia pausas, retomadas e notificações de progresso
 */
export class UnfollowService {
  /**
   * @param {InstagramApiClient} apiClient - Cliente da API do Instagram
   * @param {Settings} settings - Configurações do sistema
   * @param {Function} onProgress - Callback de progresso (percentage, log)
   */
  constructor(apiClient, settings, onProgress) {
    this._apiClient = apiClient;
    this._settings = settings;
    this._onProgress = onProgress;
    this._isPaused = false;
    this._shouldStop = false;
  }

  /**
   * Executa o processo de unfollow para uma lista de usuários
   * @param {Array<User>} users - Lista de usuários para deixar de seguir
   * @returns {Promise<Array<UnfollowLogEntry>>} Lista de entradas de log
   */
  async execute(users) {
    this._isPaused = false;
    this._shouldStop = false;

    const log = [];
    const total = users.length;

    for (let i = 0; i < users.length; i++) {
      if (this._shouldStop) {
        break;
      }

      if (this._isPaused) {
        await DelayHelper.sleep(1000);
        i--;
        continue;
      }

      const user = users[i];
      const entry = await this._unfollowUser(user);
      log.push(entry);

      const percentage = Math.round(((i + 1) / total) * 100);
      this._notifyProgress(percentage, log);

      if (i < users.length - 1) {
        await this._waitBetweenUnfollows(i);
      }
    }

    return log;
  }

  /**
   * Pausa o processo de unfollow
   */
  pause() {
    this._isPaused = true;
  }

  /**
   * Retoma o processo de unfollow pausado
   */
  resume() {
    this._isPaused = false;
  }

  /**
   * Para o processo de unfollow completamente
   */
  stop() {
    this._shouldStop = true;
    this._isPaused = false;
  }

  async _unfollowUser(user) {
    try {
      const userId = user.getId ? user.getId() : user.id;
      const username = user.getUsername ? user.getUsername() : user.username;

      await this._apiClient.unfollowUser(this._settings, userId);

      // Registra no histórico persistente
      await dbService.logAction({
        userId,
        username,
        actionType: ACTION_TYPES.UNFOLLOW,
        source: ACTION_SOURCES.AUTO
      });

      return UnfollowLogEntry.createSuccess(user);
    } catch (error) {
      console.error('Error unfollowing user:', error);
      return UnfollowLogEntry.createFailure(user);
    }
  }

  async _waitBetweenUnfollows(index) {
    const baseDelay = this._settings.getTimeBetweenUnfollows();
    const randomDelay = DelayHelper.calculateRandomDelayWithVariation(baseDelay, 0.2);
    await DelayHelper.sleep(randomDelay);

    if (this._shouldWaitAfterFiveUnfollows(index)) {
      const waitTime = this._settings.getTimeToWaitAfterFiveUnfollows();
      await DelayHelper.sleep(waitTime);
    }
  }

  _shouldWaitAfterFiveUnfollows(index) {
    return index > 0 && (index + 1) % 5 === 0;
  }

  _notifyProgress(percentage, log) {
    if (this._onProgress) {
      this._onProgress(percentage, log);
    }
  }
}

