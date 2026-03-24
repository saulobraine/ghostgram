// FloatingPanel - Componente de painel flutuante com atualização incremental
import { createElement } from '../utils/DOMRenderer.js';
import { Logo, getIconUrl } from './Logo.js';
import { dbService } from '../services/DatabaseService.js';
import { ACTION_TYPES } from '../../constants/Constants.js';
import type { FloatingPanelProps } from './FloatingPanelProps.js';
import type { User } from '../domain/User.js';

interface ActionRecord {
  username: string;
  actionType: string;
  timestamp: number;
}

interface ActionLabel {
  text: string;
  color: string;
}

interface PanelRefs {
  toggleButton: HTMLElement | null;
  badge: HTMLElement | null;
  content: HTMLElement | null;
  progressBar: HTMLElement | null;
  progressText: HTMLElement | null;
  progressLabel: HTMLElement | null;
  userList: HTMLElement | null;
  resultsHeader: HTMLElement | null;
  selectedCount: HTMLElement | null;
  unfollowBtn: HTMLButtonElement | null;
  startSection: HTMLElement | null;
  progressSection: HTMLElement | null;
  resultsSection: HTMLElement | null;
}

/**
 * Painel flutuante para exibir não-seguidores do Instagram
 * Fixo no canto superior direito, expande com efeito slide lateral
 */
export class FloatingPanel {
  element: HTMLElement | null;
  private _refs: PanelRefs;
  private _renderedUserIds: Set<string>;
  private _props: FloatingPanelProps | null;
  private _historyModal: HTMLElement | null;

  constructor() {
    this.element = null;
    this._refs = {
      toggleButton: null,
      badge: null,
      content: null,
      progressBar: null,
      progressText: null,
      progressLabel: null,
      userList: null,
      resultsHeader: null,
      selectedCount: null,
      unfollowBtn: null,
      startSection: null,
      progressSection: null,
      resultsSection: null
    };
    this._renderedUserIds = new Set();
    this._props = null;
    this._historyModal = null;
    this._injectHistoryAnimationStyles();
  }

  /**
   * Injeta estilos de animação para o modal de histórico
   */
  private _injectHistoryAnimationStyles(): void {
    if (document.getElementById('ghostgram-history-anim')) return;
    const style = document.createElement('style');
    style.id = 'ghostgram-history-anim';
    style.textContent = `
      @keyframes gg-overlay-in { from { opacity: 0; } to { opacity: 1; } }
      @keyframes gg-overlay-out { from { opacity: 1; } to { opacity: 0; } }
      @keyframes gg-modal-in { from { opacity: 0; transform: scale(0.92) translateY(12px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      @keyframes gg-modal-out { from { opacity: 1; transform: scale(1) translateY(0); } to { opacity: 0; transform: scale(0.92) translateY(12px); } }
      @keyframes gg-item-in { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
    `;
    document.head.appendChild(style);
  }

  /**
   * Verifica se o usuário tem histórico e exibe o botão
   */
  private async _loadUserHistoryBadge(username: string, btn: HTMLElement): Promise<void> {
    try {
      const allActions: ActionRecord[] = await dbService.getAllActions();
      const userActions = allActions.filter(a => a.username === username);
      if (userActions.length > 0) {
        btn.style.display = 'inline-flex';
      }
    } catch {
      // Silencia erro — botão permanece oculto
    }
  }

  /**
   * Manipula clique no botão de histórico com feedback visual
   */
  private _handleHistoryClick(btn: HTMLElement, username: string): void {
    btn.style.opacity = '1';
    btn.style.transform = 'scale(0.9)';
    setTimeout(() => {
      btn.style.transform = 'scale(1)';
      btn.style.opacity = '0.4';
    }, 200);
    this._showUserHistory(username);
  }

  /**
   * Renderiza o componente pela primeira vez
   */
  render(props: FloatingPanelProps): HTMLElement {
    this._props = props;

    // Container principal — fixo no canto superior direito
    this.element = createElement('div', {
      className: 'iu-floating-panel' + (props.isExpanded ? ' iu-expanded' : '')
    });

    if (props.isExpanded) {
      this._refs.content = this._createContent(props);
      this.element.appendChild(this._refs.content);
    } else {
      this._refs.toggleButton = this._createToggleButton(props);
      this.element.appendChild(this._refs.toggleButton);
    }

    return this.element;
  }

  /**
   * Atualiza o componente de forma incremental
   */
  update(props: FloatingPanelProps): void {
    const prevProps = this._props!;
    this._props = props;

    // Atualiza classe expanded e alterna entre botão e janela
    if (props.isExpanded !== prevProps.isExpanded) {
      if (props.isExpanded) {
        this.element!.classList.add('iu-expanded');

        // Remove botão toggle ao expandir
        if (this._refs.toggleButton) {
          this._refs.toggleButton.remove();
          this._refs.toggleButton = null;
          this._refs.badge = null;
        }

        // Cria e adiciona a janela
        this._refs.content = this._createContent(props);
        this.element!.appendChild(this._refs.content);
      } else {
        // Slide-out: anima antes de remover
        if (this._refs.content) {
          this._refs.content.classList.add('iu-sliding-out');
          this._refs.content.addEventListener('animationend', () => {
            if (this._refs.content) {
              this._refs.content.remove();
              this._refs.content = null;
              this._clearVisualRefs();
            }
            this.element!.classList.remove('iu-expanded');

            // Adiciona de volta o botão toggle
            this._refs.toggleButton = this._createToggleButton(props);
            this.element!.appendChild(this._refs.toggleButton);
            this._updateBadge(props.nonFollowers.length);
          }, { once: true });
        } else {
          this.element!.classList.remove('iu-expanded');
          this._refs.toggleButton = this._createToggleButton(props);
          this.element!.appendChild(this._refs.toggleButton);
          this._updateBadge(props.nonFollowers.length);
        }
      }
      return;
    }

    // Atualiza badge
    this._updateBadge(props.nonFollowers.length);

    // Se não está expandido, não precisa atualizar conteúdo
    if (!props.isExpanded) {
      return;
    }

    // Atualiza seções baseado no estado
    this._updateSections(props, prevProps);
  }

  /**
   * Atualiza as seções do painel
   */
  private _updateSections(props: FloatingPanelProps, prevProps: FloatingPanelProps): void {
    const stateChanged =
      props.isScanning !== prevProps.isScanning ||
      props.isScanCompleted !== prevProps.isScanCompleted ||
      props.isUnfollowing !== prevProps.isUnfollowing ||
      props.isPaused !== prevProps.isPaused;

    // Detecta mudanças de tab ou busca (requer recriação da seção)
    const tabOrSearchChanged =
      props.activeTab !== prevProps.activeTab ||
      props.searchQuery !== prevProps.searchQuery;

    // Detecta mudança de whitelist (compare by reference since we create new Set on change)
    const whitelistChanged = props.whitelist !== prevProps.whitelist;

    // Detecta mudança de seleção
    const selectionChanged = props.selectedUsers.size !== prevProps.selectedUsers.size;

    // Se mudou de estado principal, recria as seções
    if (stateChanged) {
      this._clearSections();

      if (!props.isScanning && !props.isScanCompleted && !props.isUnfollowing) {
        this._refs.startSection = this._createStartSection(props);
        this._refs.content!.appendChild(this._refs.startSection);
      } else if (props.isScanning) {
        this._refs.progressSection = this._createProgressSection(props);
        this._refs.content!.appendChild(this._refs.progressSection);
      } else if (props.isUnfollowing) {
        this._refs.progressSection = this._createUnfollowProgressSection(props);
        this._refs.content!.appendChild(this._refs.progressSection);
      } else if (props.isScanCompleted) {
        this._refs.resultsSection = this._createResultsSection(props);
        this._refs.content!.appendChild(this._refs.resultsSection);
      }

      return;
    }

    // Mudança de tab ou busca: recria seção de resultados
    if (tabOrSearchChanged && props.isScanCompleted && this._refs.resultsSection) {
      this._refs.resultsSection.remove();
      this._refs.resultsSection = null;
      this._refs.userList = null;
      this._refs.resultsHeader = null;
      this._refs.selectedCount = null;
      this._refs.unfollowBtn = null;
      this._renderedUserIds.clear();

      this._refs.resultsSection = this._createResultsSection(props);
      this._refs.content!.appendChild(this._refs.resultsSection);

      return;
    }

    // Tab/search change during scanning: recreate progress section
    if (tabOrSearchChanged && props.isScanning && this._refs.progressSection) {
      this._refs.progressSection.remove();
      this._refs.progressSection = null;
      this._refs.userList = null;
      this._refs.resultsHeader = null;
      this._refs.selectedCount = null;
      this._renderedUserIds.clear();

      this._refs.progressSection = this._createProgressSection(props);
      this._refs.content!.appendChild(this._refs.progressSection);

      return;
    }

    // Whitelist mudou: atualiza apenas o item afetado
    if (whitelistChanged && (props.isScanCompleted || props.isScanning) && this._refs.userList) {
      this._updateAllWhitelistStates(props);
      this._updateSelectedCount(props);
      return;
    }

    // Seleção mudou: atualiza checkboxes e classes sem recriar
    if (selectionChanged && props.isScanCompleted && this._refs.userList) {
      this._updateAllSelections(props);
      this._updateSelectedCount(props);
      return;
    }

    // Atualiza progresso do scan
    if (props.isScanning && this._refs.progressBar) {
      this._updateProgress(props.scanProgress);
      this._updateUserList(props);
      this._updateSelectedCount(props, this._refs.progressSection);
    }

    // Atualiza progresso do unfollow
    if (props.isUnfollowing && this._refs.progressBar) {
      this._updateProgress(props.unfollowProgress);
    }

    // Atualiza lista de resultados (apenas contadores, não recria lista)
    if (props.isScanCompleted && this._refs.userList) {
      this._updateSelectedCount(props);
    }
  }

  /**
   * Atualiza estado de whitelist de todos os itens visíveis
   */
  private _updateAllWhitelistStates(props: FloatingPanelProps): void {
    if (!this._refs.userList) return;

    const items = this._refs.userList.querySelectorAll('.iu-user-item') as NodeListOf<HTMLElement>;
    items.forEach(item => {
      const userId = item.dataset.userId;
      if (!userId) return;

      const isWhitelisted = props.whitelist?.has(userId);
      const whitelistBtn = item.querySelector('.iu-whitelist-btn');

      if (whitelistBtn) {
        whitelistBtn.textContent = isWhitelisted ? '★' : '☆';
        (whitelistBtn as HTMLElement).title = isWhitelisted ? 'Remover da whitelist' : 'Adicionar à whitelist';
        if (isWhitelisted) {
          whitelistBtn.classList.add('iu-whitelisted');
          item.classList.add('iu-whitelisted');
        } else {
          whitelistBtn.classList.remove('iu-whitelisted');
          item.classList.remove('iu-whitelisted');
        }
      }

      // Ao adicionar na whitelist, desmarca seleção
      if (isWhitelisted) {
        item.classList.remove('iu-selected');
        const checkbox = item.querySelector('.iu-user-checkbox') as HTMLInputElement | null;
        if (checkbox) checkbox.checked = false;
      }
    });

    // Atualiza contadores das tabs em tempo real
    this._updateTabCounters(props);
  }

  /**
   * Atualiza os contadores das tabs (Encontrados/Non-seguidores / Whitelist)
   */
  private _updateTabCounters(props: FloatingPanelProps): void {
    const section = this._refs.progressSection || this._refs.resultsSection;
    if (!section) return;
    const tabs = section.querySelectorAll('.iu-tab');
    if (tabs.length >= 2) {
      // Determine the correct label for the first tab based on the section
      const isProgressSection = !!this._refs.progressSection;
      const firstTabLabel = isProgressSection ? 'Encontrados' : 'Não-seguidores';
      tabs[0].textContent = `${firstTabLabel} (${props.nonFollowers.length})`;
      tabs[1].textContent = `Whitelist (${props.whitelist?.size || 0})`;
    }
  }

  /**
   * Atualiza seleção de todos os itens sem recriar DOM
   */
  private _updateAllSelections(props: FloatingPanelProps): void {
    if (!this._refs.userList) return;

    const items = this._refs.userList.querySelectorAll('.iu-user-item') as NodeListOf<HTMLElement>;
    items.forEach(item => {
      const userId = item.dataset.userId;
      if (!userId) return;

      const isSelected = props.selectedUsers.has(userId);
      const checkbox = item.querySelector('.iu-user-checkbox') as HTMLInputElement | null;

      if (isSelected) {
        item.classList.add('iu-selected');
      } else {
        item.classList.remove('iu-selected');
      }

      if (checkbox) {
        checkbox.checked = isSelected;
      }
    });

    // Atualiza texto do botão "Selecionar todos"
    const footer = this._refs.resultsSection?.querySelector('.iu-footer');
    if (footer) {
      const selectAllBtn = footer.querySelector('.iu-button-secondary');
      if (selectAllBtn) {
        const filteredUsers = this._filterUsersBySearch(props.nonFollowers, props.searchQuery);
        const allFilteredSelected = filteredUsers.length > 0 && filteredUsers.every(u => props.selectedUsers.has(u.getId()));
        selectAllBtn.textContent = allFilteredSelected ? 'Desmarcar todos' : 'Selecionar todos';
      }
    }
  }

  /**
   * Atualiza a barra de progresso
   */
  private _updateProgress(percentage: number): void {
    if (this._refs.progressBar) {
      this._refs.progressBar.style.width = `${percentage}%`;
    }
    if (this._refs.progressText) {
      this._refs.progressText.textContent = `${percentage}%`;
    }
  }

  /**
   * Atualiza a lista de usuários incrementalmente
   */
  private _updateUserList(props: FloatingPanelProps): void {
    if (!this._refs.userList) {
      return;
    }

    // Decide which users based on active tab
    let usersToShow = props.nonFollowers;
    if (props.activeTab === 'whitelist') {
      usersToShow = props.nonFollowers.filter(u => props.whitelist?.has(u.getId()));
    }

    // Adiciona apenas novos usuários
    usersToShow.forEach(user => {
      if (!this._renderedUserIds.has(user.getId())) {
        const isSelected = props.selectedUsers.has(user.getId());
        const isWhitelisted = props.whitelist?.has(user.getId());
        const userItem = this._createUserItemWithActions(user, isSelected, !!isWhitelisted, props);
        this._refs.userList!.appendChild(userItem);
        this._renderedUserIds.add(user.getId());
      }
    });

    // Atualiza contador no header
    if (this._refs.resultsHeader) {
      const countSpan = this._refs.resultsHeader.querySelector('.iu-count');
      if (countSpan) {
        countSpan.textContent = `${props.nonFollowers.length} encontrados`;
      }
    }

    // Atualiza contadores das tabs
    this._updateTabCounters(props);
  }

  /**
   * Atualiza contador de selecionados
   */
  private _updateSelectedCount(props: FloatingPanelProps, targetSection: HTMLElement | null = null): void {
    if (this._refs.selectedCount) {
      this._refs.selectedCount.textContent = `${props.selectedUsers.size} selecionados`;
    }

    const section = targetSection || this._refs.resultsSection;

    // Atualiza botão unfollow
    if (props.nonFollowers.length > 0 && section) {
      if (!this._refs.unfollowBtn) {
        this._refs.unfollowBtn = createElement('button', {
          className: 'iu-button iu-button-danger',
          onClick: props.onStartUnfollow,
          disabled: props.selectedUsers.size === 0
        }, `Deixar de seguir (${props.selectedUsers.size})`) as HTMLButtonElement;
        section.appendChild(this._refs.unfollowBtn);
      } else {
        this._refs.unfollowBtn.textContent = `Deixar de seguir (${props.selectedUsers.size})`;
        this._refs.unfollowBtn.disabled = props.selectedUsers.size === 0;
      }
    } else if (this._refs.unfollowBtn) {
      this._refs.unfollowBtn.remove();
      this._refs.unfollowBtn = null;
    }
  }

  /**
   * Atualiza badge de contagem
   */
  private _updateBadge(count: number): void {
    // Só atualiza badge se o botão existir (modo minimizado)
    if (!this._refs.toggleButton) {
      return;
    }

    const badgeText = count > 99 ? '99+' : count.toString();

    if (count > 0 && !this._refs.badge) {
      this._refs.badge = createElement('span', {
        className: 'iu-badge'
      }, badgeText);
      this._refs.toggleButton.appendChild(this._refs.badge);
    } else if (this._refs.badge) {
      if (count > 0) {
        this._refs.badge.textContent = badgeText;
      } else {
        this._refs.badge.remove();
        this._refs.badge = null;
      }
    }
  }

  /**
   * Limpa seções
   */
  private _clearSections(): void {
    (['startSection', 'progressSection', 'resultsSection'] as const).forEach(key => {
      if (this._refs[key]) {
        this._refs[key]!.remove();
        this._refs[key] = null;
      }
    });
    this._refs.progressBar = null;
    this._refs.progressText = null;
    this._refs.userList = null;
    this._refs.resultsHeader = null;
    this._refs.selectedCount = null;
    this._refs.unfollowBtn = null;
    this._renderedUserIds.clear();
  }

  /**
   * Limpa refs visuais sem limpar o estado de usuários renderizados
   * Usado quando minimiza o painel para preservar estado
   */
  private _clearVisualRefs(): void {
    this._refs.progressBar = null;
    this._refs.progressText = null;
    this._refs.progressLabel = null;
    this._refs.userList = null;
    this._refs.resultsHeader = null;
    this._refs.selectedCount = null;
    this._refs.unfollowBtn = null;
    this._refs.startSection = null;
    this._refs.progressSection = null;
    this._refs.resultsSection = null;
    // NÃO limpa _renderedUserIds para preservar estado
  }

  /**
   * Reset refs completo (usado em reset total)
   */
  private _resetRefs(): void {
    (Object.keys(this._refs) as (keyof PanelRefs)[]).forEach(key => {
      this._refs[key] = null;
    });
    this._renderedUserIds.clear();
  }

  /**
   * Cria o botão toggle
   */
  private _createToggleButton(props: FloatingPanelProps): HTMLElement {
    const button = createElement('button', {
      className: 'iu-toggle-button',
      onClick: () => props.onToggle()
    });

    const logoEl = Logo();
    button.appendChild(logoEl);

    if (props.nonFollowers.length > 0) {
      this._refs.badge = createElement('span', {
        className: 'iu-badge'
      }, props.nonFollowers.length.toString());
      button.appendChild(this._refs.badge);
    }

    return button;
  }

  /**
   * Cria o conteúdo do painel
   */
  private _createContent(props: FloatingPanelProps): HTMLElement {
    const content = createElement('div', { className: 'iu-content' });

    // Header com botão de minimizar
    const header = createElement('div', { className: 'iu-header' });

    const titleH3 = createElement('h3', {}) as HTMLElement;
    const headerIcon = document.createElement('img');
    headerIcon.src = getIconUrl();
    headerIcon.alt = 'GhostGram';
    headerIcon.width = 20;
    headerIcon.height = 20;
    headerIcon.style.verticalAlign = 'middle';
    headerIcon.style.marginRight = '6px';
    titleH3.appendChild(headerIcon);
    titleH3.appendChild(document.createTextNode('GhostGram'));
    const titleContainer = createElement('div', { className: 'iu-header-title' },
      titleH3,
      createElement('span', { className: 'iu-subtitle' }, 'Não-seguidores')
    );
    header.appendChild(titleContainer);

    const actionsContainer = createElement('div', { className: 'iu-header-actions' });

    const historyBtn = createElement('button', {
      className: 'iu-history-btn',
      onClick: (e: Event) => {
        e.stopPropagation();
        props.onOpenHistory();
      },
      title: 'Ver Histórico Completo'
    }, '📜');
    actionsContainer.appendChild(historyBtn);

    const minimizeBtn = createElement('button', {
      className: 'iu-minimize-btn',
      onClick: (e: Event) => {
        e.stopPropagation(); // Evita drag ao clicar no botão
        props.onToggle();
      },
      title: 'Minimizar'
    }, '−');
    actionsContainer.appendChild(minimizeBtn);

    header.appendChild(actionsContainer);
    content.appendChild(header);

    // Estado inicial
    if (!props.isScanning && !props.isScanCompleted && !props.isUnfollowing) {
      this._refs.startSection = this._createStartSection(props);
      content.appendChild(this._refs.startSection);
    } else if (props.isScanning) {
      this._refs.progressSection = this._createProgressSection(props);
      content.appendChild(this._refs.progressSection);
    } else if (props.isUnfollowing) {
      this._refs.progressSection = this._createUnfollowProgressSection(props);
      content.appendChild(this._refs.progressSection);
    } else if (props.isScanCompleted) {
      this._refs.resultsSection = this._createResultsSection(props);
      content.appendChild(this._refs.resultsSection);
    }

    return content;
  }

  /**
   * Cria seção inicial
   */
  private _createStartSection(props: FloatingPanelProps): HTMLElement {
    const section = createElement('div', { className: 'iu-start-section' },
      createElement('p', { className: 'iu-description' },
        'Encontre quem não te segue de volta no Instagram.'
      ),
      createElement('button', {
        className: 'iu-button iu-button-primary',
        onClick: props.onStartScan
      }, 'Iniciar Scan')
    );

    // Scans anteriores
    if (props.scanHistory && props.scanHistory.length > 0) {
      const historySection = createElement('div', { className: 'iu-scan-history' });
      historySection.appendChild(createElement('p', { className: 'iu-scan-history-title' }, 'Scans anteriores'));

      props.scanHistory.forEach(scan => {
        const date = new Date(scan.date).toLocaleDateString('pt-BR', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });
        const card = createElement('div', {
          className: 'iu-scan-history-card',
          onClick: () => props.onLoadPreviousScan?.(scan.id)
        },
          createElement('span', { className: 'iu-scan-history-date' }, date),
          createElement('span', { className: 'iu-scan-history-count' }, `${scan.nonFollowersCount} não seguidores`)
        );
        historySection.appendChild(card);
      });

      section.appendChild(historySection);
    }

    return section;
  }

  /**
   * Cria seção de progresso do scan com lista de usuários
   */
  private _createProgressSection(props: FloatingPanelProps): HTMLElement {
    const section = createElement('div', { className: 'iu-progress-section' });

    // Label de progresso
    const statusText = props.isPaused ? 'Pausado' : 'Escaneando...';
    this._refs.progressLabel = createElement('p', { className: 'iu-progress-label' }, statusText);
    section.appendChild(this._refs.progressLabel);

    // Barra de progresso
    const progressBarContainer = createElement('div', { className: 'iu-progress-bar' });
    this._refs.progressBar = createElement('div', {
      className: 'iu-progress-fill',
      style: { width: `${props.scanProgress}%` }
    });
    progressBarContainer.appendChild(this._refs.progressBar);
    section.appendChild(progressBarContainer);

    this._refs.progressText = createElement('p', { className: 'iu-progress-text' }, `${props.scanProgress}%`);
    section.appendChild(this._refs.progressText);

    // Botões de controle
    const controls = createElement('div', { className: 'iu-scan-controls' });

    const pauseBtn = createElement('button', {
      className: 'iu-button iu-button-secondary iu-button-small',
      onClick: props.onTogglePause
    }, props.isPaused ? '▶ Retomar' : '⏸ Pausar');
    controls.appendChild(pauseBtn);

    const cancelBtn = createElement('button', {
      className: 'iu-button iu-button-danger iu-button-small',
      onClick: props.onCancelScan
    }, '✕ Cancelar');
    controls.appendChild(cancelBtn);

    section.appendChild(controls);

    // Campo de pesquisa (só mostra se tiver 2 ou mais usuários)
    if (props.nonFollowers.length >= 2) {
      const searchContainer = createElement('div', { className: 'iu-search-container' });
      const searchInput = createElement('input', {
        type: 'text',
        className: 'iu-search-input',
        placeholder: '🔍 Buscar usuário...',
        value: props.searchQuery || '',
        onInput: (e: Event) => props.onSearch((e.target as HTMLInputElement).value)
      });
      searchContainer.appendChild(searchInput);
      section.appendChild(searchContainer);
    }

    // Tabs (Encontrados / Whitelist) — always visible during scan
    {
      const whitelistCount = props.whitelist?.size || 0;
      const tabs = createElement('div', { className: 'iu-tabs' });

      const tabFound = createElement('button', {
        className: `iu-tab ${props.activeTab !== 'whitelist' ? 'iu-tab-active' : ''}`,
        onClick: () => props.onChangeTab('nonFollowers')
      }, `Encontrados (${props.nonFollowers.length})`);
      tabs.appendChild(tabFound);

      const tabWhitelist = createElement('button', {
        className: `iu-tab ${props.activeTab === 'whitelist' ? 'iu-tab-active' : ''}`,
        onClick: () => props.onChangeTab('whitelist')
      }, `Whitelist (${whitelistCount})`);
      tabs.appendChild(tabWhitelist);

      section.appendChild(tabs);
    }

    // Header da lista
    this._refs.resultsHeader = createElement('div', { className: 'iu-results-header' },
      createElement('span', { className: 'iu-count' }, `${props.nonFollowers.length} encontrados`),
      createElement('span', { className: 'iu-selected-count' }, `${props.selectedUsers.size} selecionados`)
    );
    this._refs.selectedCount = this._refs.resultsHeader.querySelector('.iu-selected-count');
    section.appendChild(this._refs.resultsHeader);

    // Decide which users to show based on active tab
    let usersToShow = props.nonFollowers;
    if (props.activeTab === 'whitelist') {
      usersToShow = props.nonFollowers.filter(u => props.whitelist?.has(u.getId()));
    }

    // Filtra usuários se houver busca
    const filteredUsers = this._filterUsersBySearch(usersToShow, props.searchQuery);

    // Lista de usuários (será atualizada incrementalmente)
    this._refs.userList = createElement('div', { className: 'iu-user-list' });
    filteredUsers.forEach(user => {
      const isSelected = props.selectedUsers.has(user.getId());
      const isWhitelisted = props.whitelist?.has(user.getId());
      const userItem = this._createUserItemWithActions(user, isSelected, !!isWhitelisted, props);
      this._refs.userList!.appendChild(userItem);
      this._renderedUserIds.add(user.getId());
    });

    if (props.activeTab === 'whitelist' && filteredUsers.length === 0) {
      const emptyMessage = createElement('p', { className: 'iu-empty-message' },
        'Whitelist vazia. Adicione usuários para ignorar.'
      );
      this._refs.userList.appendChild(emptyMessage);
    }

    section.appendChild(this._refs.userList);

    // Adiciona o botão de unfollow inicial (que será atualizado pelo updateSelectedCount)
    this._updateSelectedCount(props, section);

    return section;
  }

  /**
   * Cria seção de progresso do unfollow
   */
  private _createUnfollowProgressSection(props: FloatingPanelProps): HTMLElement {
    const section = createElement('div', { className: 'iu-progress-section' });

    this._refs.progressLabel = createElement('p', { className: 'iu-progress-label' }) as HTMLElement;
    const progressIcon = document.createElement('img');
    progressIcon.src = getIconUrl();
    progressIcon.alt = 'GhostGram';
    progressIcon.width = 16;
    progressIcon.height = 16;
    progressIcon.style.verticalAlign = 'middle';
    progressIcon.style.marginRight = '6px';
    this._refs.progressLabel.appendChild(progressIcon);
    this._refs.progressLabel.appendChild(document.createTextNode('Unfollow em andamento...'));
    section.appendChild(this._refs.progressLabel);

    const hint = createElement('p', { className: 'iu-progress-text' }, 'Veja o progresso no modal.');
    section.appendChild(hint);

    const progressBarContainer = createElement('div', { className: 'iu-progress-bar' });
    this._refs.progressBar = createElement('div', {
      className: 'iu-progress-fill',
      style: { width: `${props.unfollowProgress}%` }
    });
    progressBarContainer.appendChild(this._refs.progressBar);
    section.appendChild(progressBarContainer);

    this._refs.progressText = createElement('p', { className: 'iu-progress-text' }, `${props.unfollowProgress}%`);
    section.appendChild(this._refs.progressText);

    return section;
  }

  /**
   * Cria seção de resultados com abas
   */
  private _createResultsSection(props: FloatingPanelProps): HTMLElement {
    const section = createElement('div', { className: 'iu-results-section' });

    // Abas
    const tabs = createElement('div', { className: 'iu-tabs' });

    const tabNonFollowers = createElement('button', {
      className: `iu-tab ${props.activeTab !== 'whitelist' ? 'iu-tab-active' : ''}`,
      onClick: () => props.onChangeTab('nonFollowers')
    }, `Encontrados (${props.nonFollowers.length})`);
    tabs.appendChild(tabNonFollowers);

    const whitelistCount = props.whitelist?.size || 0;
    const tabWhitelist = createElement('button', {
      className: `iu-tab ${props.activeTab === 'whitelist' ? 'iu-tab-active' : ''}`,
      onClick: () => props.onChangeTab('whitelist')
    }, `Whitelist (${whitelistCount})`);
    tabs.appendChild(tabWhitelist);

    section.appendChild(tabs);

    // Campo de pesquisa (só mostra se tiver 2 ou mais usuários)
    const totalUsers = props.nonFollowers.length + (props.whitelist?.size || 0);
    if (totalUsers >= 2) {
      const searchContainer = createElement('div', { className: 'iu-search-container' });
      const searchInput = createElement('input', {
        type: 'text',
        className: 'iu-search-input',
        placeholder: '🔍 Buscar usuário...',
        value: props.searchQuery || '',
        onInput: (e: Event) => props.onSearch((e.target as HTMLInputElement).value)
      });
      searchContainer.appendChild(searchInput);
      section.appendChild(searchContainer);
    }

    // Conteúdo baseado na aba ativa
    if (props.activeTab === 'whitelist') {
      this._createWhitelistContent(section, props);
    } else {
      this._createNonFollowersContent(section, props);
    }

    return section;
  }

  /**
   * Cria conteúdo da aba de não-seguidores
   */
  private _createNonFollowersContent(section: HTMLElement, props: FloatingPanelProps): void {
    // Filtra por pesquisa
    const filteredUsers = this._filterUsersBySearch(props.nonFollowers, props.searchQuery);

    // Header com contagem
    this._refs.resultsHeader = createElement('div', { className: 'iu-results-header' },
      createElement('span', {}, `${filteredUsers.length} usuários`),
      createElement('span', { className: 'iu-selected-count' }, `${props.selectedUsers.size} selecionados`)
    );
    this._refs.selectedCount = this._refs.resultsHeader.querySelector('.iu-selected-count');
    section.appendChild(this._refs.resultsHeader);

    // Lista de usuários
    this._refs.userList = createElement('div', { className: 'iu-user-list' });

    if (filteredUsers.length > 0) {
      filteredUsers.forEach(user => {
        const isSelected = props.selectedUsers.has(user.getId());
        const isWhitelisted = props.whitelist?.has(user.getId());
        const userItem = this._createUserItemWithActions(user, isSelected, !!isWhitelisted, props);
        this._refs.userList!.appendChild(userItem);
        this._renderedUserIds.add(user.getId());
      });
    } else {
      const emptyMessage = createElement('p', { className: 'iu-empty-message' },
        props.searchQuery ? 'Nenhum usuário encontrado.' : 'Parabéns! Todos te seguem de volta.'
      );
      this._refs.userList.appendChild(emptyMessage);
    }
    section.appendChild(this._refs.userList);

    // Footer com botões
    const footer = createElement('div', { className: 'iu-footer' });

    // Botão selecionar todos
    const filteredUserIds = filteredUsers.map(u => u.getId());
    const allFilteredSelected = filteredUsers.length > 0 && filteredUsers.every(u => props.selectedUsers.has(u.getId()));
    const selectAllBtn = createElement('button', {
      className: 'iu-button iu-button-secondary',
      onClick: () => props.onToggleAll(!allFilteredSelected, filteredUserIds)
    }, allFilteredSelected ? 'Desmarcar todos' : 'Selecionar todos');
    footer.appendChild(selectAllBtn);

    // Botão de unfollow
    if (filteredUsers.length > 0) {
      this._refs.unfollowBtn = createElement('button', {
        className: 'iu-button iu-button-danger',
        onClick: props.onStartUnfollow,
        disabled: props.selectedUsers.size === 0
      }, `Deixar de seguir (${props.selectedUsers.size})`) as HTMLButtonElement;
      footer.appendChild(this._refs.unfollowBtn);
    }

    section.appendChild(footer);
  }

  /**
   * Cria conteúdo da aba whitelist
   */
  private _createWhitelistContent(section: HTMLElement, props: FloatingPanelProps): void {
    const whitelistUsers = props.nonFollowers.filter(u => props.whitelist?.has(u.getId()));
    const filteredUsers = this._filterUsersBySearch(whitelistUsers, props.searchQuery);

    // Header
    const header = createElement('div', { className: 'iu-results-header' },
      createElement('span', {}, `${filteredUsers.length} na whitelist`),
      createElement('span', { className: 'iu-whitelist-info' }, 'Usuários ignorados')
    );
    section.appendChild(header);

    // Lista
    this._refs.userList = createElement('div', { className: 'iu-user-list' });

    if (filteredUsers.length > 0) {
      filteredUsers.forEach(user => {
        const userItem = this._createWhitelistItem(user, props);
        this._refs.userList!.appendChild(userItem);
      });
    } else {
      const emptyMessage = createElement('p', { className: 'iu-empty-message' },
        props.searchQuery ? 'Nenhum usuário encontrado.' : 'Whitelist vazia. Adicione usuários para ignorar.'
      );
      this._refs.userList.appendChild(emptyMessage);
    }
    section.appendChild(this._refs.userList);
  }

  /**
   * Filtra usuários por pesquisa
   */
  private _filterUsersBySearch(users: User[], query: string): User[] {
    if (!query || query.trim() === '') {
      return users;
    }
    const lowerQuery = query.toLowerCase();
    return users.filter(user =>
      user.getUsername().toLowerCase().includes(lowerQuery) ||
      (user.getFullName() && user.getFullName().toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Cria item de usuário com ações (selecionar e whitelist)
   */
  private _createUserItemWithActions(user: User, isSelected: boolean, isWhitelisted: boolean, props: FloatingPanelProps): HTMLElement {
    const item = createElement('div', {
      className: 'iu-user-item' + (isSelected ? ' iu-selected' : '') + (isWhitelisted ? ' iu-whitelisted' : '')
    });
    item.dataset.userId = user.getId();

    // Checkbox
    const checkbox = createElement('input', {
      type: 'checkbox',
      className: 'iu-user-checkbox',
      checked: isSelected,
      onClick: (e: Event) => {
        e.stopPropagation();
        props.onToggleUser(user.getId());
      }
    });
    item.appendChild(checkbox);

    // Avatar
    const profileUrl = `https://www.instagram.com/${user.getUsername()}/`;
    const avatar = createElement('img', {
      src: user.getProfilePicUrl() || 'https://instagram.com/static/images/anonymousUser.jpg/23e7b3b2a737.jpg',
      className: 'iu-user-avatar',
      alt: user.getUsername(),
      style: { cursor: 'pointer' },
      onClick: () => location.href = profileUrl
    });
    item.appendChild(avatar);

    // Info
    const info = createElement('div', {
      className: 'iu-user-info',
      style: { cursor: 'pointer' },
      onClick: () => location.href = profileUrl
    },
      createElement('span', { className: 'iu-user-username' }, `@${user.getUsername()}`),
      createElement('span', { className: 'iu-user-fullname' }, user.getFullName() || '')
    );
    item.appendChild(info);

    // Botão whitelist
    const whitelistBtn = createElement('button', {
      className: 'iu-whitelist-btn' + (isWhitelisted ? ' iu-whitelisted' : ''),
      onClick: (e: Event) => {
        e.stopPropagation();
        props.onToggleWhitelist(user.getId());
      },
      title: isWhitelisted ? 'Remover da whitelist' : 'Adicionar à whitelist'
    }, isWhitelisted ? '★' : '☆');
    item.appendChild(whitelistBtn);

    // Botão histórico — só exibe se o usuário tiver histórico
    const historyBtn = createElement('button', {
      className: 'iu-history-ghost-btn',
      onClick: (e: Event) => {
        e.stopPropagation();
        this._handleHistoryClick(historyBtn as HTMLElement, user.getUsername());
      },
      title: 'Ver histórico GhostGram'
    });
    const historyIcon = document.createElement('img');
    historyIcon.src = getIconUrl();
    historyIcon.alt = 'GhostGram';
    historyIcon.width = 18;
    historyIcon.height = 18;
    historyBtn.appendChild(historyIcon);
    (historyBtn as HTMLElement).style.cssText = `
      display: none !important;
      background: none !important;
      border: none !important;
      font-size: 16px !important;
      cursor: pointer !important;
      padding: 2px 4px !important;
      opacity: 0.4 !important;
      transition: opacity 0.2s ease, transform 0.2s ease !important;
      flex-shrink: 0 !important;
    `;
    historyBtn.addEventListener('mouseenter', () => { (historyBtn as HTMLElement).style.opacity = '1'; (historyBtn as HTMLElement).style.transform = 'scale(1.15)'; });
    historyBtn.addEventListener('mouseleave', () => { (historyBtn as HTMLElement).style.opacity = '0.4'; (historyBtn as HTMLElement).style.transform = 'scale(1)'; });

    // Verifica se tem histórico para mostrar o botão
    this._loadUserHistoryBadge(user.getUsername(), historyBtn as HTMLElement);

    item.appendChild(historyBtn);

    return item;
  }

  /**
   * Cria item para whitelist
   */
  private _createWhitelistItem(user: User, props: FloatingPanelProps): HTMLElement {
    const item = createElement('div', { className: 'iu-user-item iu-whitelisted' });
    item.dataset.userId = user.getId();

    // Avatar
    const profileUrl = `https://www.instagram.com/${user.getUsername()}/`;
    const avatar = createElement('img', {
      src: user.getProfilePicUrl() || 'https://instagram.com/static/images/anonymousUser.jpg/23e7b3b2a737.jpg',
      className: 'iu-user-avatar',
      alt: user.getUsername(),
      style: { cursor: 'pointer' },
      onClick: () => location.href = profileUrl
    });
    item.appendChild(avatar);

    // Info
    const info = createElement('div', {
      className: 'iu-user-info',
      style: { cursor: 'pointer' },
      onClick: () => location.href = profileUrl
    },
      createElement('span', { className: 'iu-user-username' }, `@${user.getUsername()}`),
      createElement('span', { className: 'iu-user-fullname' }, user.getFullName() || '')
    );
    item.appendChild(info);

    // Botão remover
    const removeBtn = createElement('button', {
      className: 'iu-remove-btn',
      onClick: () => props.onToggleWhitelist(user.getId()),
      title: 'Remover da whitelist'
    }, '✕');
    item.appendChild(removeBtn);

    return item;
  }

  /**
   * Cria item de usuário
   */
  private _createUserItem(user: User, isSelected: boolean, onToggleUser: (userId: string) => void): HTMLElement {
    const item = createElement('div', {
      className: 'iu-user-item' + (isSelected ? ' iu-selected' : '')
    });
    item.dataset.userId = user.getId();

    // Checkbox
    const checkbox = createElement('input', {
      type: 'checkbox',
      className: 'iu-user-checkbox',
      checked: isSelected,
      onClick: (e: Event) => {
        e.stopPropagation();
        onToggleUser(user.getId());
      }
    });
    item.appendChild(checkbox);

    // Avatar
    const profileUrl = `https://www.instagram.com/${user.getUsername()}/`;
    const avatar = createElement('img', {
      src: user.getProfilePicUrl() || 'https://instagram.com/static/images/anonymousUser.jpg/23e7b3b2a737.jpg',
      className: 'iu-user-avatar',
      alt: user.getUsername(),
      style: { cursor: 'pointer' },
      onClick: () => location.href = profileUrl
    });
    item.appendChild(avatar);

    // Info
    const info = createElement('div', {
      className: 'iu-user-info',
      style: { cursor: 'pointer' },
      onClick: () => location.href = profileUrl
    },
      createElement('span', { className: 'iu-user-username' }, `@${user.getUsername()}`),
      createElement('span', { className: 'iu-user-fullname' }, user.getFullName() || '')
    );
    item.appendChild(info);

    // Badge verificado
    if (user.isVerified()) {
      const verifiedBadge = createElement('span', { className: 'iu-verified-badge' }, '✓');
      item.appendChild(verifiedBadge);
    }

    return item;
  }

  /**
   * Exibe modal de histórico de ações para um usuário
   */
  private async _showUserHistory(username: string): Promise<void> {
    this._closeHistoryModal(false);

    const allActions: ActionRecord[] = await dbService.getAllActions();
    const actions = allActions.filter(a => a.username === username);
    if (actions.length === 0) {
      return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'ghostgram-modal-overlay';
    overlay.style.cssText = `
      position: fixed !important;
      top: 0 !important; left: 0 !important;
      width: 100vw !important; height: 100vh !important;
      background: rgba(0,0,0,0.7) !important;
      z-index: 999999 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-family: 'Noto Sans', system-ui, sans-serif !important;
      animation: gg-overlay-in 0.25s ease-out both !important;
    `;

    const modal = document.createElement('div');
    modal.className = 'ghostgram-modal-content';
    modal.style.cssText = `
      background: #111 !important;
      border-radius: 16px !important;
      padding: 24px !important;
      max-width: 420px !important;
      width: 90% !important;
      max-height: 80vh !important;
      overflow-y: auto !important;
      color: #fafafa !important;
      border: 1px solid #27272a !important;
      animation: gg-modal-in 0.3s ease-out both !important;
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      margin-bottom: 16px !important;
      padding-bottom: 12px !important;
      border-bottom: 1px solid #27272a !important;
    `;
    const title = document.createElement('h3');
    const histTitleIcon = document.createElement('img');
    histTitleIcon.src = getIconUrl();
    histTitleIcon.alt = 'GhostGram';
    histTitleIcon.width = 18;
    histTitleIcon.height = 18;
    histTitleIcon.style.verticalAlign = 'middle';
    histTitleIcon.style.marginRight = '6px';
    title.appendChild(histTitleIcon);
    title.appendChild(document.createTextNode(`Histórico de @${username}`));
    title.style.cssText = `
      font-size: 16px !important;
      font-weight: 600 !important;
      margin: 0 !important;
      background: linear-gradient(135deg, #833ab4, #e1306c, #fcaf45) !important;
      -webkit-background-clip: text !important;
      -webkit-text-fill-color: transparent !important;
    `;
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = `
      background: none !important;
      border: none !important;
      color: #a1a1aa !important;
      font-size: 18px !important;
      cursor: pointer !important;
      padding: 4px !important;
    `;
    closeBtn.addEventListener('click', () => this._closeHistoryModal(true));
    header.appendChild(title);
    header.appendChild(closeBtn);
    modal.appendChild(header);

    // Lista de ações
    const list = document.createElement('div');
    list.style.cssText = `display: flex !important; flex-direction: column !important; gap: 8px !important;`;

    const actionLabels: Record<string, ActionLabel> = {
      [ACTION_TYPES.FOLLOW]: { text: 'Seguiu', color: '#22c55e' },
      [ACTION_TYPES.UNFOLLOW]: { text: 'Deixou de seguir', color: '#ef4444' },
      [ACTION_TYPES.RE_FOLLOW_ACCEPTED]: { text: 'Aceitou seguir novamente', color: '#3b82f6' },
      [ACTION_TYPES.RE_FOLLOW_REJECTED]: { text: 'Confirmou não seguir', color: '#f59e0b' }
    };

    const displayActions = actions.slice(0, 50);
    displayActions.forEach((action, index) => {
      const item = document.createElement('div');
      item.style.cssText = `
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        padding: 10px 12px !important;
        background: #1a1a1a !important;
        border-radius: 8px !important;
        border: 1px solid #27272a !important;
        animation: gg-item-in 0.3s ease-out ${0.05 * index}s both !important;
      `;

      const info = actionLabels[action.actionType] || { text: action.actionType, color: '#a1a1aa' };
      const actionSpan = document.createElement('span');
      actionSpan.textContent = info.text;
      actionSpan.style.cssText = `
        font-size: 13px !important;
        font-weight: 500 !important;
        color: ${info.color} !important;
      `;

      const dateSpan = document.createElement('span');
      dateSpan.textContent = new Date(action.timestamp).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
      dateSpan.style.cssText = `font-size: 11px !important; color: #71717a !important;`;

      item.appendChild(actionSpan);
      item.appendChild(dateSpan);
      list.appendChild(item);
    });

    if (actions.length > 50) {
      const more = document.createElement('p');
      more.textContent = `... e mais ${actions.length - 50} ações`;
      more.style.cssText = `text-align: center !important; color: #71717a !important; font-size: 12px !important; margin-top: 8px !important;`;
      list.appendChild(more);
    }

    modal.appendChild(list);
    overlay.appendChild(modal);
    overlay.addEventListener('click', (e: Event) => {
      if (e.target === overlay) this._closeHistoryModal(true);
    });

    document.body.appendChild(overlay);
    this._historyModal = overlay;
  }

  /**
   * Fecha o modal de histórico com animação opcional
   */
  private _closeHistoryModal(animate: boolean = false): void {
    if (!this._historyModal) return;

    if (!animate) {
      this._historyModal.remove();
      this._historyModal = null;
      return;
    }

    const overlay = this._historyModal;
    const modal = overlay.querySelector('.ghostgram-modal-content') as HTMLElement | null;
    (overlay as HTMLElement).style.animation = 'gg-overlay-out 0.2s ease-in forwards';
    if (modal) modal.style.animation = 'gg-modal-out 0.2s ease-in forwards';

    setTimeout(() => {
      overlay.remove();
      if (this._historyModal === overlay) this._historyModal = null;
    }, 220);
  }
}
