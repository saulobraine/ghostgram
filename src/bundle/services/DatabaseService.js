/**
 * DatabaseService - Gerenciamento de persistência com IndexedDB
 * Armazena histórico de ações (follow/unfollow) de forma robusta e relacional.
 */
export class DatabaseService {
  constructor() {
    this._dbName = 'ghostgram_db';
    this._dbVersion = 1;
    this._db = null;
  }

  /**
   * Inicializa o banco de dados
   */
  async init() {
    if (this._db) return this._db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this._dbName, this._dbVersion);

      request.onerror = (event) => {
        console.error('[DatabaseService] Erro ao abrir banco:', event.target.error);
        reject(event.target.error);
      };

      request.onsuccess = (event) => {
        this._db = event.target.result;
        resolve(this._db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Store de ações
        if (!db.objectStoreNames.contains('actions')) {
          const store = db.createObjectStore('actions', { keyPath: 'id', autoIncrement: true });
          store.createIndex('userId', 'userId', { unique: false });
          store.createIndex('username', 'username', { unique: false });
          store.createIndex('actionType', 'actionType', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * Registra uma ação no histórico
   * @param {Object} data - Dados da ação
   */
  async logAction({ userId, username, actionType, source = 'manual' }) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this._db.transaction(['actions'], 'readwrite');
      const store = transaction.objectStore('actions');

      const record = {
        userId,
        username,
        actionType, // 'follow' ou 'unfollow'
        source,     // 'manual' ou 'auto'
        timestamp: Date.now()
      };

      const request = store.add(record);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Busca histórico de um usuário específico
   * @param {string} userId - ID do usuário no Instagram
   */
  async getActionsByUser(userId) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this._db.transaction(['actions'], 'readonly');
      const store = transaction.objectStore('actions');
      const index = store.index('userId');
      const request = index.getAll(userId);

      request.onsuccess = () => {
        // Ordena por timestamp decrescente (mais recente primeiro)
        const results = request.result.sort((a, b) => b.timestamp - a.timestamp);
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Busca todas as ações (histórico global)
   */
  async getAllActions() {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this._db.transaction(['actions'], 'readonly');
      const store = transaction.objectStore('actions');
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result.sort((a, b) => b.timestamp - a.timestamp);
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Limpa o histórico
   */
  async clearHistory() {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this._db.transaction(['actions'], 'readwrite');
      const store = transaction.objectStore('actions');
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Exporta instância única
export const dbService = new DatabaseService();
