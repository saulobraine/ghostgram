/**
 * Script para gerenciar a página de histórico global (dashboard)
 * Usa chrome.storage.local diretamente para garantir compatibilidade
 */
const STORAGE_KEY = 'ghostgram_actions_history';
const PER_PAGE_KEY = 'ghostgram_history_per_page';
const DEFAULT_PER_PAGE = 25;

interface HistoryAction {
  actionType: string;
  username: string;
  timestamp: number;
  source?: string;
}

interface ActionInfo {
  text: string;
  badgeClass: string;
}

class HistoryPage {
  private _listEl: HTMLElement;
  private _listContainer: HTMLElement;
  private _emptyState: HTMLElement;
  private _refreshBtn: HTMLElement;
  private _clearBtn: HTMLElement;
  private _searchInput: HTMLInputElement;
  private _filterBtns: NodeListOf<HTMLElement>;
  private _topProfiles: HTMLElement;
  private _statTotal: HTMLElement;
  private _statUnfollows: HTMLElement;
  private _statFollows: HTMLElement;
  private _statToday: HTMLElement;
  private _prevPageBtn: HTMLButtonElement;
  private _nextPageBtn: HTMLButtonElement;
  private _pageIndicator: HTMLElement;
  private _paginationInfo: HTMLElement;
  private _perPageSelect: HTMLSelectElement;
  private _allActions: HistoryAction[];
  private _activeFilter: string;
  private _searchQuery: string;
  private _currentPage: number;
  private _perPage: number;

  constructor() {
    this._listEl = document.getElementById('historyList')!;
    this._listContainer = document.querySelector('.list-container')!;
    this._emptyState = document.getElementById('emptyState')!;
    this._refreshBtn = document.getElementById('refreshBtn')!;
    this._clearBtn = document.getElementById('clearBtn')!;
    this._searchInput = document.getElementById('searchInput') as HTMLInputElement;
    this._filterBtns = document.querySelectorAll('.filter-btn');
    this._topProfiles = document.getElementById('topProfiles')!;

    this._statTotal = document.getElementById('statTotal')!;
    this._statUnfollows = document.getElementById('statUnfollows')!;
    this._statFollows = document.getElementById('statFollows')!;
    this._statToday = document.getElementById('statToday')!;

    this._prevPageBtn = document.getElementById('prevPageBtn') as HTMLButtonElement;
    this._nextPageBtn = document.getElementById('nextPageBtn') as HTMLButtonElement;
    this._pageIndicator = document.getElementById('pageIndicator')!;
    this._paginationInfo = document.getElementById('paginationInfo')!;
    this._perPageSelect = document.getElementById('perPageSelect') as HTMLSelectElement;

    this._allActions = [];
    this._activeFilter = 'all';
    this._searchQuery = '';
    this._currentPage = 1;
    this._perPage = DEFAULT_PER_PAGE;
  }

  async init(): Promise<void> {
    await this._loadPerPage();
    this._setupEventListeners();
    await this.loadHistory();
  }

  async _loadPerPage(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.get([PER_PAGE_KEY], (result) => {
        this._perPage = result[PER_PAGE_KEY] || DEFAULT_PER_PAGE;
        this._perPageSelect.value = this._perPage.toString();
        resolve();
      });
    });
  }

  _savePerPage(value: number): void {
    this._perPage = value;
    chrome.storage.local.set({ [PER_PAGE_KEY]: value });
  }

  _setupEventListeners(): void {
    this._refreshBtn.addEventListener('click', () => this.loadHistory());
    this._clearBtn.addEventListener('click', () => this.handleClear());

    this._searchInput.addEventListener('input', (e) => {
      this._searchQuery = (e.target as HTMLInputElement).value.toLowerCase().trim();
      this._currentPage = 1;
      this._renderFiltered();
    });

    this._filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this._filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._activeFilter = (btn as HTMLElement).dataset.filter || 'all';
        this._currentPage = 1;
        this._renderFiltered();
      });
    });

    this._prevPageBtn.addEventListener('click', () => {
      if (this._currentPage > 1) {
        this._currentPage--;
        this._renderFiltered();
      }
    });

    this._nextPageBtn.addEventListener('click', () => {
      const filtered = this._getFilteredActions();
      const totalPages = Math.ceil(filtered.length / this._perPage);
      if (this._currentPage < totalPages) {
        this._currentPage++;
        this._renderFiltered();
      }
    });

    this._perPageSelect.addEventListener('change', (e) => {
      const value = parseInt((e.target as HTMLSelectElement).value, 10);
      this._savePerPage(value);
      this._currentPage = 1;
      this._renderFiltered();
    });
  }

  async loadHistory(): Promise<void> {
    try {
      this._allActions = await this._getAllActions();
      this._updateStats(this._allActions);
      this._renderTopUnfollowed(this._allActions);
      this._renderFiltered();
    } catch (error) {
      console.error('[HistoryPage] Erro ao carregar histórico:', error);
    }
  }

  async _getAllActions(): Promise<HistoryAction[]> {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        const actions: HistoryAction[] = result[STORAGE_KEY] || [];
        resolve(actions.sort((a, b) => b.timestamp - a.timestamp));
      });
    });
  }

  async _clearAllActions(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [STORAGE_KEY]: [] }, () => {
        resolve();
      });
    });
  }

  _updateStats(actions: HistoryAction[]): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTs = today.getTime();

    const follows = actions.filter(a => a.actionType === 'follow').length;
    const unfollows = actions.filter(a => a.actionType === 'unfollow').length;
    const todayCount = actions.filter(a => a.timestamp >= todayTs).length;

    this._statTotal.textContent = String(actions.length);
    this._statFollows.textContent = String(follows);
    this._statUnfollows.textContent = String(unfollows);
    this._statToday.textContent = String(todayCount);
  }

  _renderTopUnfollowed(actions: HistoryAction[]): void {
    const unfollowActions = actions.filter(a => a.actionType === 'unfollow');
    const counts: Record<string, number> = {};

    unfollowActions.forEach(a => {
      if (a.username) {
        counts[a.username] = (counts[a.username] || 0) + 1;
      }
    });

    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    this._topProfiles.innerHTML = '';

    if (sorted.length === 0) {
      this._topProfiles.innerHTML = '<span class="empty-hint">Nenhum unfollow registrado ainda.</span>';
      return;
    }

    const medals = ['🥇', '🥈', '🥉'];
    sorted.forEach(([username, count], i) => {
      const card = document.createElement('div');
      card.className = 'top-profile';
      card.innerHTML = `
        <span class="rank">${medals[i]}</span>
        <div class="profile-info">
          <a href="https://www.instagram.com/${username}/" target="_blank" class="profile-name">@${username}</a>
          <span class="profile-count">${count}× desseguido</span>
        </div>
      `;
      this._topProfiles.appendChild(card);
    });
  }

  _getFilteredActions(): HistoryAction[] {
    let actions = this._allActions;

    if (this._activeFilter !== 'all') {
      actions = actions.filter(a => a.actionType === this._activeFilter);
    }

    if (this._searchQuery) {
      actions = actions.filter(a =>
        a.username && a.username.toLowerCase().includes(this._searchQuery)
      );
    }

    return actions;
  }

  _renderFiltered(): void {
    const allFiltered = this._getFilteredActions();
    const totalPages = Math.max(1, Math.ceil(allFiltered.length / this._perPage));

    if (this._currentPage > totalPages) this._currentPage = totalPages;

    const start = (this._currentPage - 1) * this._perPage;
    const pageActions = allFiltered.slice(start, start + this._perPage);

    this._renderActions(pageActions);
    this._updatePagination(allFiltered.length, totalPages);
  }

  _updatePagination(totalItems: number, totalPages: number): void {
    this._paginationInfo.textContent = `${totalItems} registro${totalItems !== 1 ? 's' : ''}`;
    this._pageIndicator.textContent = `${this._currentPage} / ${totalPages}`;
    this._prevPageBtn.disabled = this._currentPage <= 1;
    this._nextPageBtn.disabled = this._currentPage >= totalPages;
  }

  _renderActions(actions: HistoryAction[]): void {
    this._listEl.innerHTML = '';

    if (actions.length === 0) {
      this._listEl.style.display = 'none';
      this._emptyState.style.display = 'block';
      return;
    }

    this._listEl.style.display = '';
    this._emptyState.style.display = 'none';

    actions.forEach(action => {
      const li = document.createElement('li');
      li.className = 'history-item';

      const date = this._formatSmartDate(action.timestamp);
      const actionInfo = this._getActionInfo(action.actionType);
      const isAuto = action.source === 'auto';
      const sourceText = isAuto ? 'Auto' : 'Manual';

      li.innerHTML = `
        <span class="history-item__date">${date}</span>
        <span class="history-item__user">
          <a href="https://www.instagram.com/${action.username}/" target="_blank" class="username-link">@${action.username}</a>
        </span>
        <span class="history-item__action"><span class="badge ${actionInfo.badgeClass}">${actionInfo.text}</span></span>
        <span class="history-item__source"><span class="badge badge-source${isAuto ? ' auto' : ''}">${sourceText}</span></span>
      `;

      this._listEl.appendChild(li);
    });
  }

  _getActionInfo(actionType: string): ActionInfo {
    switch (actionType) {
      case 'follow':
        return { text: 'Seguiu', badgeClass: 'badge-follow' };
      case 'unfollow':
        return { text: 'Deixou de seguir', badgeClass: 'badge-unfollow' };
      case 'reFollowAccepted':
        return { text: 'Aceitou seguir novamente', badgeClass: 'badge-refollow-accepted' };
      case 'reFollowRejected':
        return { text: 'Confirmou não seguir', badgeClass: 'badge-refollow-rejected' };
      default:
        return { text: actionType, badgeClass: 'badge-source' };
    }
  }

  _formatSmartDate(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 6);

    const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    if (date >= today) {
      return `Hoje, ${time}`;
    }
    if (date >= yesterday) {
      return `Ontem, ${time}`;
    }
    if (date >= weekAgo) {
      const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      return `${dayNames[date.getDay()]}, ${time}`;
    }
    return date.toLocaleString('pt-BR');
  }

  async handleClear(): Promise<void> {
    if (confirm('Tem certeza que deseja limpar todo o histórico? Esta ação não pode ser desfeita.')) {
      await this._clearAllActions();
      await this.loadHistory();
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const page = new HistoryPage();
  page.init();
});
