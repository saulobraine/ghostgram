/**
 * DatabaseService - Gerenciamento de persistência com chrome.storage.local
 * Armazena histórico de ações (follow/unfollow) de forma robusta.
 * Usa LocalStorageAdapter para garantir acesso em todos os contextos da extensão.
 */
import { LocalStorageAdapter } from '../../storage/LocalStorageAdapter.js';
import { STORAGE_KEYS, ACTION_SOURCES, type ActionType, type ActionSource } from '../../constants/Constants.js';

interface ActionRecord {
  id: string;
  userId: string;
  username: string;
  actionType: ActionType;
  source: ActionSource;
  timestamp: number;
}

interface LogActionData {
  userId: string;
  username: string;
  actionType: ActionType;
  source?: ActionSource;
}

/**
 * Serviço responsável por gerenciar histórico de ações (follow/unfollow)
 */
export class DatabaseService {
  private _storage: LocalStorageAdapter;

  constructor() {
    this._storage = new LocalStorageAdapter();
  }

  /**
   * Registra uma ação no histórico
   * @param data - Dados da ação
   * @returns ID do registro criado
   */
  async logAction({ userId, username, actionType, source = ACTION_SOURCES.MANUAL }: LogActionData): Promise<string> {
    const actions = await this._getActions();

    const record: ActionRecord = {
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
   * @param userId - ID do usuário no Instagram
   * @returns Lista de ações ordenadas por timestamp (mais recente primeiro)
   */
  async getActionsByUser(userId: string): Promise<ActionRecord[]> {
    const actions = await this._getActions();
    return actions
      .filter(a => a.userId === userId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Busca todas as ações (histórico global)
   * @returns Lista de ações ordenadas por timestamp (mais recente primeiro)
   */
  async getAllActions(): Promise<ActionRecord[]> {
    const actions = await this._getActions();
    return actions.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Limpa o histórico
   */
  async clearHistory(): Promise<void> {
    await this._storage.set(STORAGE_KEYS.ACTIONS_HISTORY, []);
    console.log('[DatabaseService] Histórico limpo');
  }

  /**
   * Obtém todas as ações do storage
   * @private
   */
  private async _getActions(): Promise<ActionRecord[]> {
    const actions = await this._storage.get(STORAGE_KEYS.ACTIONS_HISTORY);
    return (actions as ActionRecord[]) || [];
  }
}

// Exporta instância única
export const dbService = new DatabaseService();
