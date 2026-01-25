// ScanService - Serviço para escanear seguidores do Instagram
import { InstagramApiClient } from './InstagramApiClient.js';
import { DelayHelper } from '../utils/DelayHelper.js';
import { Settings } from '../../domain/Settings.js';

/**
 * Serviço responsável pela lógica de consulta à API do Instagram
 */
export class ScanService {
  constructor(apiClient, settings, onProgress) {
    this._apiClient = apiClient;
    this._settings = settings;
    this._onProgress = onProgress;
    this._isPaused = false;
    this._shouldStop = false;
  }

  /**
   * Inicia o processo de scan
   * @param {Object} options - Opções de retomada (opcional)
   * @param {Array} options.initialResults - Resultados já obtidos
   * @param {string} options.startCursor - Cursor para iniciar
   * @param {number} options.initialProcessedCount - Contagem inicial de processados
   * @returns {Promise<Array>} Lista de resultados
   */
  async start(options = {}) {
    const {
      initialResults = [],
      startCursor = null,
      initialProcessedCount = 0,
      initialTotalCount = -1
    } = options;

    this._isPaused = false;
    this._shouldStop = false;

    const results = [...initialResults];
    let cursor = startCursor;
    let totalCount = initialTotalCount;
    let processedCount = initialProcessedCount;
    let cycleCount = 0;

    // Notifica progresso inicial ou retomado
    const initialPercentage = totalCount > 0 ? Math.min(100, Math.round((processedCount / totalCount) * 100)) : 0;
    this._notifyProgress(initialPercentage, results, cursor, processedCount, totalCount);

    while (!this._shouldStop) {
      if (this._isPaused) {
        await DelayHelper.sleep(1000);
        continue;
      }

      const response = await this._fetchPage(cursor);

      if (totalCount === -1) {
        totalCount = response.totalCount;
      }

      results.push(...response.users);
      processedCount += response.users.length;
      cursor = response.endCursor;

      // Calcula a porcentagem de forma segura
      let percentage = 0;
      if (totalCount > 0) {
        percentage = Math.min(100, Math.round((processedCount / totalCount) * 100));
      }

      if (totalCount <= 0 && processedCount > 0) {
        // Se ainda não sabemos o total, mostra um progresso aproximado
        percentage = Math.min(99, Math.max(1, Math.round((processedCount / (processedCount + 10)) * 100)));
      }

      this._notifyProgress(percentage, results, cursor, processedCount, totalCount);

      if (!response.hasNextPage) {
        break;
      }

      await this._waitBetweenCycles(cycleCount);
      cycleCount++;
    }

    return results;
  }

  pause() {
    this._isPaused = true;
  }

  resume() {
    this._isPaused = false;
  }

  stop() {
    this._shouldStop = true;
    this._isPaused = false;
  }

  async _fetchPage(cursor) {
    try {
      return await this._apiClient.fetchFollowers(this._settings, cursor);
    } catch (error) {
      console.error('[ScanService] Erro ao buscar seguidores:', error);
      throw error;
    }
  }

  async _waitBetweenCycles(cycleCount) {
    const baseDelay = this._settings.getTimeBetweenSearchCycles();
    const randomDelay = DelayHelper.calculateRandomDelayWithVariation(baseDelay, 0.3);
    await DelayHelper.sleep(randomDelay);

    if (this._shouldWaitAfterFiveCycles(cycleCount)) {
      const waitTime = this._settings.getTimeToWaitAfterFiveSearchCycles();
      await DelayHelper.sleep(waitTime);
    }
  }

  _shouldWaitAfterFiveCycles(cycleCount) {
    return cycleCount > 0 && cycleCount % 5 === 0;
  }

  _notifyProgress(percentage, results, cursor, processedCount, totalCount) {
    if (this._onProgress) {
      this._onProgress(percentage, results, cursor, processedCount, totalCount);
    }
  }
}


