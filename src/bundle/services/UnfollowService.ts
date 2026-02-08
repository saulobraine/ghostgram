// UnfollowService - Service for unfollowing users
import { InstagramApiClient } from './InstagramApiClient.js';
import { DelayHelper } from '../utils/DelayHelper.js';
import type { Settings } from '../../domain/Settings.js';
import { UnfollowLogEntry } from '../domain/UnfollowLogEntry.js';
import { dbService } from './DatabaseService.js';
import { ACTION_TYPES, ACTION_SOURCES } from '../../constants/Constants.js';
import type { User } from '../domain/User.js';

type UnfollowProgressCallback = (percentage: number, log: UnfollowLogEntry[]) => void;

/**
 * Serviço responsável pela lógica de deixar de seguir usuários no Instagram
 * Gerencia pausas, retomadas e notificações de progresso
 */
export class UnfollowService {
  private _apiClient: InstagramApiClient;
  private _settings: Settings;
  private _onProgress: UnfollowProgressCallback | null;
  private _isPaused: boolean;
  private _shouldStop: boolean;

  /**
   * @param apiClient - Cliente da API do Instagram
   * @param settings - Configurações do sistema
   * @param onProgress - Callback de progresso (percentage, log)
   */
  constructor(apiClient: InstagramApiClient, settings: Settings, onProgress: UnfollowProgressCallback | null = null) {
    this._apiClient = apiClient;
    this._settings = settings;
    this._onProgress = onProgress;
    this._isPaused = false;
    this._shouldStop = false;
  }

  /**
   * Executa o processo de unfollow para uma lista de usuários
   * @param users - Lista de usuários para deixar de seguir
   * @returns Lista de entradas de log
   */
  async execute(users: User[]): Promise<UnfollowLogEntry[]> {
    this._isPaused = false;
    this._shouldStop = false;

    const log: UnfollowLogEntry[] = [];
    const total = users.length;

    for (let i = 0; i < users.length; i++) {
      if (this._shouldStop) break;

      // Wait while paused
      while (this._isPaused && !this._shouldStop) {
        await DelayHelper.sleep(500);
      }
      if (this._shouldStop) break;

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
  pause(): void {
    this._isPaused = true;
  }

  /**
   * Retoma o processo de unfollow pausado
   */
  resume(): void {
    this._isPaused = false;
  }

  /**
   * Para o processo de unfollow completamente
   */
  stop(): void {
    this._shouldStop = true;
    this._isPaused = false;
  }

  private async _unfollowUser(user: User): Promise<UnfollowLogEntry> {
    try {
      const userId = user.getId();
      const username = user.getUsername();

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

  private async _waitBetweenUnfollows(index: number): Promise<void> {
    const baseDelay = this._settings.getTimeBetweenUnfollows();
    const randomDelay = DelayHelper.calculateRandomDelayWithVariation(baseDelay, 0.2);
    await this._interruptibleSleep(randomDelay);

    if (this._shouldWaitAfterFiveUnfollows(index)) {
      const waitTime = this._settings.getTimeToWaitAfterFiveUnfollows();
      await this._interruptibleSleep(waitTime);
    }
  }

  /**
   * Sleep that can be interrupted by pause or stop, checking every 500ms
   */
  private async _interruptibleSleep(ms: number): Promise<void> {
    const interval = 500;
    let remaining = ms;
    while (remaining > 0) {
      if (this._shouldStop) return;
      while (this._isPaused && !this._shouldStop) {
        await DelayHelper.sleep(interval);
      }
      if (this._shouldStop) return;
      const chunk = Math.min(remaining, interval);
      await DelayHelper.sleep(chunk);
      remaining -= chunk;
    }
  }

  private _shouldWaitAfterFiveUnfollows(index: number): boolean {
    return index > 0 && (index + 1) % 5 === 0;
  }

  private _notifyProgress(percentage: number, log: UnfollowLogEntry[]): void {
    if (this._onProgress) {
      this._onProgress(percentage, log);
    }
  }
}
