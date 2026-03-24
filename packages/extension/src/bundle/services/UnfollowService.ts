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
  private _maxRetries: number;

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
    this._maxRetries = 2; // Tenta 3 vezes no total (1 inicial + 2 retries)
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
    const userId = user.getId();
    const username = user.getUsername();
    let lastError: Error | null = null;
    let apiSuccess = false;

    // Tenta até 3 vezes com backoff exponencial
    for (let attempt = 0; attempt <= this._maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const backoffMs = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 1000, 10000);
          console.log(`[UnfollowService] Retry ${attempt} for user ${username} after ${Math.round(backoffMs)}ms`);
          await DelayHelper.sleep(backoffMs);
        }

        await this._apiClient.unfollowUser(this._settings, userId);
        apiSuccess = true;
        break; // Sucesso, sai do loop
      } catch (error) {
        lastError = error as Error;

        // Se for erro 429 (rate limit) ou 5xx, tenta novamente
        if (this._shouldRetry(error as Error)) {
          console.warn(`[UnfollowService] Attempt ${attempt + 1} failed for ${username}, will retry. Error:`, lastError.message);
          continue;
        }

        // Erros não recuperáveis (400, 403 não-rate-limit, 404, etc)
        console.error(`[UnfollowService] Non-retryable error for ${username}:`, lastError.message);
        break;
      }
    }

    // Loga no histórico apenas se a API teve sucesso (requisito: não registrar ações malsucedidas como concluídas)
    if (apiSuccess) {
      try {
        await dbService.logAction({
          userId,
          username,
          actionType: ACTION_TYPES.UNFOLLOW,
          source: ACTION_SOURCES.AUTO
        });
      } catch (logError) {
        console.error('[UnfollowService] Failed to log unfollow action:', logError);
        // Não altera apiSuccess - o log é separado
      }
    }

    if (apiSuccess) {
      console.log(`[UnfollowService] Successfully unfollowed ${username}`);
      return UnfollowLogEntry.createSuccess(user);
    } else {
      console.error(`[UnfollowService] Failed to unfollow ${username}:`, lastError?.message || 'Unknown error');
      return UnfollowLogEntry.createFailure(user);
    }
  }

  private _shouldRetry(error: Error): boolean {
    // Extrai status code da mensagem de erro
    const match = error.message.match(/Failed to unfollow user \d+: (\d+)/);
    if (match) {
      const statusCode = parseInt(match[1], 10);
      // Retry em 429 (rate limit) e 5xx (server errors)
      return statusCode === 429 || (statusCode >= 500 && statusCode < 600);
    }

    // Se não conseguiu extrair status, assumimos erro de rede ou problema transitório
    // Tipicamente erros como "Failed to fetch" ou typeerrors
    const knownTransientErrors: string[] = [
      'Failed to fetch',
      'NetworkError',
      'TypeError',
      'AbortError'
    ];
    const errorMsg = error.message.toLowerCase();
    const isTransient = knownTransientErrors.some((err: string) => errorMsg.includes(err.toLowerCase()));

    return isTransient;
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
    const perCycle = this._settings.getUnfollowsPerCycle();
    return index > 0 && (index + 1) % perCycle === 0;
  }

  private _notifyProgress(percentage: number, log: UnfollowLogEntry[]): void {
    if (this._onProgress) {
      this._onProgress(percentage, log);
    }
  }
}
