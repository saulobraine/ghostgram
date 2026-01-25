/**
 * DatabaseService - Gerenciamento de persistência com chrome.storage.local
 * Armazena histórico de ações (follow/unfollow) de forma robusta.
 * Usa LocalStorageAdapter para garantir acesso em todos os contextos da extensão.
 */
import { LocalStorageAdapter } from '../../storage/LocalStorageAdapter.js';
import { STORAGE_KEYS, ACTION_TYPES, ACTION_SOURCES } from '../../constants/Constants.js';

export class DatabaseService {
  constructor() {
    this._storage = new LocalStorageAdapter();
  }

  /**
   * Registra uma ação no histórico
   * @param {Object} data - Dados da ação
   * @param {string} data.userId - ID do usuário
   * @param {string} data.username - Nome de usuário
   * @param {string} data.actionType - Tipo de ação (ACTION_TYPES.FOLLOW ou ACTION_TYPES.UNFOLLOW)
   * @param {string} data.source - Origem da ação (ACTION_SOURCES.MANUAL ou ACTION_SOURCES.AUTO)
   */
  async logAction({ userId, username, actionType, source = ACTION_SOURCES.MANUAL }) {
    const actions = await this._getActions();

    const record = {
      id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      userId,
      username,
      actionType,
      source,
      timestamp: Date.now()
    };

    actions.push(record);
    await this._storage.set(STORAGE_KEYS.ACTIONS_HISTORY, actions);

    console.log('[DatabaseService] Ação registrada:', record);
    return record.id;
  }

  /**
   * Busca histórico de um usuário específico
   * @param {string} userId - ID do usuário no Instagram
   */
  async getActionsByUser(userId) {
    const actions = await this._getActions();
    return actions
      .filter(a => a.userId === userId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Busca todas as ações (histórico global)
   */
  async getAllActions() {
    const actions = await this._getActions();
    return actions.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Limpa o histórico
   */
  async clearHistory() {
    await this._storage.set(STORAGE_KEYS.ACTIONS_HISTORY, []);
    console.log('[DatabaseService] Histórico limpo');
  }

  /**
   * Obtém todas as ações do storage
   */
  async _getActions() {
    const actions = await this._storage.get(STORAGE_KEYS.ACTIONS_HISTORY);
    return actions || [];
  }
}

// Exporta instância única
export const dbService = new DatabaseService();
