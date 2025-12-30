import { dbService } from './src/bundle/services/DatabaseService.js';

/**
 * Script para gerenciar a página de histórico global
 */
class HistoryPage {
  constructor() {
    this._tbody = document.getElementById('historyBody');
    this._emptyState = document.getElementById('emptyState');
    this._table = document.getElementById('historyTable');
    this._refreshBtn = document.getElementById('refreshBtn');
    this._clearBtn = document.getElementById('clearBtn');
  }

  async init() {
    this._setupEventListeners();
    await this.loadHistory();
  }

  _setupEventListeners() {
    this._refreshBtn.addEventListener('click', () => this.loadHistory());
    this._clearBtn.addEventListener('click', () => this.handleClear());
  }

  async loadHistory() {
    try {
      const actions = await dbService.getAllActions();
      this.renderActions(actions);
    } catch (error) {
      console.error('[HistoryPage] Erro ao carregar histórico:', error);
    }
  }

  renderActions(actions) {
    this._tbody.innerHTML = '';

    if (actions.length === 0) {
      this._table.style.display = 'none';
      this._emptyState.style.display = 'block';
      return;
    }

    this._table.style.display = 'table';
    this._emptyState.style.display = 'none';

    actions.forEach(action => {
      const tr = document.createElement('tr');

      const date = new Date(action.timestamp).toLocaleString('pt-BR');
      const actionClass = action.actionType === 'follow' ? 'action-follow' : 'action-unfollow';
      const actionText = action.actionType === 'follow' ? 'Apoiou' : 'Deixou de seguir';
      const sourceClass = action.source === 'auto' ? 'source-auto' : 'source-manual';
      const sourceText = action.source === 'auto' ? 'Automático' : 'Manual';

      tr.innerHTML = `
                <td>${date}</td>
                <td>
                    <a href="https://www.instagram.com/${action.username}/" target="_blank" class="username-link">
                        @${action.username}
                    </a>
                </td>
                <td class="${actionClass}">${actionText}</td>
                <td><span class="${sourceClass}">${sourceText}</span></td>
            `;

      this._tbody.appendChild(tr);
    });
  }

  async handleClear() {
    if (confirm('Tem certeza que deseja limpar todo o histórico? Esta ação não pode ser desfeita.')) {
      await dbService.clearHistory();
      await this.loadHistory();
    }
  }
}

// Inicializa a página
document.addEventListener('DOMContentLoaded', () => {
  const page = new HistoryPage();
  page.init();
});
