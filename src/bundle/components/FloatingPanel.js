// FloatingPanel - Componente de painel flutuante com atualização incremental
import { createElement } from '../utils/DOMRenderer.js';
import { Logo } from './Logo.js';

/**
 * Painel flutuante para exibir não-seguidores do Instagram
 * Usa atualização incremental para evitar re-renderização completa
 */
export class FloatingPanel {
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

    // Drag state
    this._isDragging = false;
    this._dragStartX = 0;
    this._dragStartY = 0;
    this._elementStartX = 0;
    this._elementStartY = 0;
    this._hasMoved = false;
    this._position = this._loadPosition();

    // Bind handlers
    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);
  }

  /**
   * Carrega posição salva do localStorage
   */
  _loadPosition() {
    try {
      const saved = localStorage.getItem('ghostgram_panel_position');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      // Ignora erro
    }
    return { right: 20, bottom: 20 };
  }

  /**
   * Salva posição no localStorage
   */
  _savePosition() {
    try {
      localStorage.setItem('ghostgram_panel_position', JSON.stringify(this._position));
    } catch (e) {
      // Ignora erro
    }
  }

  /**
   * Renderiza o componente pela primeira vez
   */
  render(props) {
    this._props = props;

    // Container principal
    this.element = createElement('div', {
      className: 'iu-floating-panel' + (props.isExpanded ? ' iu-expanded' : '')
    });

    // Aplica posição salva
    this._applyPosition();

    if (props.isExpanded) {
      // Modo expandido: mostra apenas a janela (arrastável pelo header)
      this._refs.content = this._createContent(props);
      this.element.appendChild(this._refs.content);
    } else {
      // Modo minimizado: mostra apenas o botão
      this._refs.toggleButton = this._createToggleButton(props);
      this.element.appendChild(this._refs.toggleButton);
    }

    return this.element;
  }

  /**
   * Aplica posição salva ao elemento
   */
  _applyPosition() {
    if (this._position.left !== undefined) {
      this.element.style.left = `${this._position.left}px`;
      this.element.style.top = `${this._position.top}px`;
      this.element.style.right = 'auto';
      this.element.style.bottom = 'auto';
    } else {
      this.element.style.right = `${this._position.right}px`;
      this.element.style.bottom = `${this._position.bottom}px`;
    }
  }

  /**
   * Atualiza o componente de forma incremental
   */
  update(props) {
    const prevProps = this._props;
    this._props = props;

    // Atualiza classe expanded e alterna entre botão e janela
    if (props.isExpanded !== prevProps.isExpanded) {
      if (props.isExpanded) {
        this.element.classList.add('iu-expanded');

        // Remove botão toggle ao expandir
        if (this._refs.toggleButton) {
          this._refs.toggleButton.remove();
          this._refs.toggleButton = null;
          this._refs.badge = null;
        }

        // Cria e adiciona a janela
        this._refs.content = this._createContent(props);
        this.element.appendChild(this._refs.content);
      } else {
        this.element.classList.remove('iu-expanded');

        // Remove a janela ao minimizar
        if (this._refs.content) {
          this._refs.content.remove();
          this._refs.content = null;
          this._clearVisualRefs();
        }

        // Adiciona de volta o botão toggle
        this._refs.toggleButton = this._createToggleButton(props);
        this.element.appendChild(this._refs.toggleButton);
        this._updateBadge(props.nonFollowers.length);
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
  _updateSections(props, prevProps) {
    const stateChanged =
      props.isScanning !== prevProps.isScanning ||
      props.isScanCompleted !== prevProps.isScanCompleted ||
      props.isUnfollowing !== prevProps.isUnfollowing ||
      props.isPaused !== prevProps.isPaused; // Também verifica mudança de pausa

    // Se mudou de estado, recria as seções
    if (stateChanged) {
      this._clearSections();

      if (!props.isScanning && !props.isScanCompleted && !props.isUnfollowing) {
        this._refs.startSection = this._createStartSection(props);
        this._refs.content.appendChild(this._refs.startSection);
      } else if (props.isScanning) {
        this._refs.progressSection = this._createProgressSection(props);
        this._refs.content.appendChild(this._refs.progressSection);
      } else if (props.isUnfollowing) {
        this._refs.progressSection = this._createUnfollowProgressSection(props);
        this._refs.content.appendChild(this._refs.progressSection);
      } else if (props.isScanCompleted) {
        this._refs.resultsSection = this._createResultsSection(props);
        this._refs.content.appendChild(this._refs.resultsSection);
      }
      return;
    }

    // Atualiza progresso do scan
    if (props.isScanning && this._refs.progressBar) {
      this._updateProgress(props.scanProgress);
      this._updateUserList(props);
    }

    // Atualiza progresso do unfollow
    if (props.isUnfollowing && this._refs.progressBar) {
      this._updateProgress(props.unfollowProgress);
    }

    // Atualiza lista de resultados
    if (props.isScanCompleted && this._refs.userList) {
      this._updateSelectedCount(props);
    }
  }

  /**
   * Atualiza a barra de progresso
   */
  _updateProgress(percentage) {
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
  _updateUserList(props) {
    if (!this._refs.userList) {
      return;
    }

    // Adiciona apenas novos usuários
    props.nonFollowers.forEach(user => {
      if (!this._renderedUserIds.has(user.getId())) {
        const userItem = this._createUserItem(user, false, props.onToggleUser);
        this._refs.userList.appendChild(userItem);
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
  }

  /**
   * Atualiza contador de selecionados
   */
  _updateSelectedCount(props) {
    if (this._refs.selectedCount) {
      this._refs.selectedCount.textContent = `${props.selectedUsers.size} selecionados`;
    }

    // Atualiza botão unfollow
    if (props.selectedUsers.size > 0) {
      if (!this._refs.unfollowBtn) {
        this._refs.unfollowBtn = createElement('button', {
          className: 'iu-button iu-button-danger',
          onClick: props.onStartUnfollow
        }, `Deixar de seguir (${props.selectedUsers.size})`);
        this._refs.resultsSection.appendChild(this._refs.unfollowBtn);
      } else {
        this._refs.unfollowBtn.textContent = `Deixar de seguir (${props.selectedUsers.size})`;
      }
    } else if (this._refs.unfollowBtn) {
      this._refs.unfollowBtn.remove();
      this._refs.unfollowBtn = null;
    }
  }

  /**
   * Atualiza badge de contagem
   */
  _updateBadge(count) {
    // Só atualiza badge se o botão existir (modo minimizado)
    if (!this._refs.toggleButton) {
      return;
    }

    if (count > 0 && !this._refs.badge) {
      this._refs.badge = createElement('span', {
        className: 'iu-badge'
      }, count.toString());
      this._refs.toggleButton.appendChild(this._refs.badge);
    } else if (this._refs.badge) {
      if (count > 0) {
        this._refs.badge.textContent = count.toString();
      } else {
        this._refs.badge.remove();
        this._refs.badge = null;
      }
    }
  }

  /**
   * Limpa seções
   */
  _clearSections() {
    ['startSection', 'progressSection', 'resultsSection'].forEach(key => {
      if (this._refs[key]) {
        this._refs[key].remove();
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
  _clearVisualRefs() {
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
  _resetRefs() {
    Object.keys(this._refs).forEach(key => {
      this._refs[key] = null;
    });
    this._renderedUserIds.clear();
  }

  /**
   * Cria o botão toggle com suporte a drag
   */
  _createToggleButton(props) {
    const button = createElement('button', {
      className: 'iu-toggle-button'
    });

    // Eventos de drag
    button.addEventListener('mousedown', this._onMouseDown);
    button.addEventListener('touchstart', this._onTouchStart.bind(this), { passive: false });

    const logoSvg = Logo();
    button.appendChild(logoSvg);

    if (props.nonFollowers.length > 0) {
      this._refs.badge = createElement('span', {
        className: 'iu-badge'
      }, props.nonFollowers.length.toString());
      button.appendChild(this._refs.badge);
    }

    return button;
  }

  /**
   * Handler de mousedown para iniciar drag
   */
  _onMouseDown(e) {
    // Ignora clique direito
    if (e.button !== 0) return;

    this._isDragging = true;
    this._hasMoved = false;
    this._dragStartX = e.clientX;
    this._dragStartY = e.clientY;

    const rect = this.element.getBoundingClientRect();
    this._elementStartX = rect.left;
    this._elementStartY = rect.top;

    document.addEventListener('mousemove', this._onMouseMove);
    document.addEventListener('mouseup', this._onMouseUp);

    e.preventDefault();
  }

  /**
   * Handler de touchstart para mobile
   */
  _onTouchStart(e) {
    if (e.touches.length !== 1) return;

    const touch = e.touches[0];
    this._isDragging = true;
    this._hasMoved = false;
    this._dragStartX = touch.clientX;
    this._dragStartY = touch.clientY;

    const rect = this.element.getBoundingClientRect();
    this._elementStartX = rect.left;
    this._elementStartY = rect.top;

    document.addEventListener('touchmove', this._onTouchMove.bind(this), { passive: false });
    document.addEventListener('touchend', this._onTouchEnd.bind(this));

    e.preventDefault();
  }

  /**
   * Handler de mousemove durante drag
   */
  _onMouseMove(e) {
    if (!this._isDragging) return;

    const deltaX = e.clientX - this._dragStartX;
    const deltaY = e.clientY - this._dragStartY;

    // Se moveu mais de 5px, considera como drag
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      this._hasMoved = true;
    }

    if (this._hasMoved) {
      this._updatePosition(deltaX, deltaY);
    }
  }

  /**
   * Handler de touchmove durante drag
   */
  _onTouchMove(e) {
    if (!this._isDragging || e.touches.length !== 1) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - this._dragStartX;
    const deltaY = touch.clientY - this._dragStartY;

    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      this._hasMoved = true;
    }

    if (this._hasMoved) {
      this._updatePosition(deltaX, deltaY);
      e.preventDefault();
    }
  }

  /**
   * Atualiza posição do elemento
   */
  _updatePosition(deltaX, deltaY) {
    const newX = this._elementStartX + deltaX;
    const newY = this._elementStartY + deltaY;

    // Limita às bordas da tela
    const maxX = window.innerWidth - 70;
    const maxY = window.innerHeight - 70;

    const clampedX = Math.max(10, Math.min(newX, maxX));
    const clampedY = Math.max(10, Math.min(newY, maxY));

    // Usa left/top em vez de right/bottom para drag
    this.element.style.left = `${clampedX}px`;
    this.element.style.top = `${clampedY}px`;
    this.element.style.right = 'auto';
    this.element.style.bottom = 'auto';

    // Salva posição
    this._position = { left: clampedX, top: clampedY };
  }

  /**
   * Handler de mouseup para finalizar drag
   */
  _onMouseUp(e) {
    document.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('mouseup', this._onMouseUp);

    // Se não moveu, trata como click
    if (!this._hasMoved && this._props) {
      this._props.onToggle();
    }

    if (this._hasMoved) {
      this._savePosition();
    }

    this._isDragging = false;
  }

  /**
   * Handler de touchend para finalizar drag
   */
  _onTouchEnd(e) {
    document.removeEventListener('touchmove', this._onTouchMove);
    document.removeEventListener('touchend', this._onTouchEnd);

    if (!this._hasMoved && this._props) {
      this._props.onToggle();
    }

    if (this._hasMoved) {
      this._savePosition();
    }

    this._isDragging = false;
  }

  /**
   * Posiciona o conteúdo do painel relativo ao botão
   * Sempre abre abaixo, ajusta horizontal conforme espaço disponível
   */
  _positionContent(content) {
    // Usa posição armazenada do elemento pai para calcular
    const panelRect = this.element?.getBoundingClientRect();
    if (!panelRect) {
      content.style.top = '70px';
      content.style.right = '0px';
      return;
    }

    const panelWidth = 320;
    const margin = 10;

    // Sempre abre abaixo do botão
    content.style.top = '70px';
    content.style.bottom = 'auto';

    // Calcula espaço disponível à direita do painel
    const spaceRight = window.innerWidth - panelRect.left;
    const spaceLeft = panelRect.right;

    // Decide posição horizontal
    if (spaceRight >= panelWidth + margin) {
      // Abre à direita (alinhado com o botão)
      content.style.left = '0px';
      content.style.right = 'auto';
    } else if (spaceLeft >= panelWidth + margin) {
      // Abre à esquerda
      content.style.right = '0px';
      content.style.left = 'auto';
    } else {
      // Centraliza na tela se não couber em nenhum lado
      const centerOffset = (window.innerWidth - panelWidth) / 2 - panelRect.left;
      content.style.left = `${centerOffset}px`;
      content.style.right = 'auto';
    }
  }

  /**
   * Cria o conteúdo do painel
   */
  _createContent(props) {
    const content = createElement('div', { className: 'iu-content' });

    // Header com botão de minimizar (arrastável)
    const header = createElement('div', { className: 'iu-header iu-draggable' });

    // Adiciona eventos de drag no header
    header.addEventListener('mousedown', this._onMouseDown);
    header.addEventListener('touchstart', this._onTouchStart.bind(this), { passive: false });

    const titleContainer = createElement('div', { className: 'iu-header-title' },
      createElement('h3', {}, 'GhostGram'),
      createElement('span', { className: 'iu-subtitle' }, 'Não-seguidores')
    );
    header.appendChild(titleContainer);

    const minimizeBtn = createElement('button', {
      className: 'iu-minimize-btn',
      onClick: (e) => {
        e.stopPropagation(); // Evita drag ao clicar no botão
        props.onToggle();
      },
      title: 'Minimizar'
    }, '−');
    header.appendChild(minimizeBtn);

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
  _createStartSection(props) {
    return createElement('div', { className: 'iu-start-section' },
      createElement('p', { className: 'iu-description' },
        'Encontre quem não te segue de volta no Instagram.'
      ),
      createElement('button', {
        className: 'iu-button iu-button-primary',
        onClick: props.onStartScan
      }, 'Iniciar Scan')
    );
  }

  /**
   * Cria seção de progresso do scan com lista de usuários
   */
  _createProgressSection(props) {
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

    // Header da lista
    this._refs.resultsHeader = createElement('div', { className: 'iu-results-header' },
      createElement('span', { className: 'iu-count' }, `${props.nonFollowers.length} encontrados`)
    );
    section.appendChild(this._refs.resultsHeader);

    // Lista de usuários (será atualizada incrementalmente)
    this._refs.userList = createElement('div', { className: 'iu-user-list' });
    props.nonFollowers.forEach(user => {
      const userItem = this._createUserItem(user, false, props.onToggleUser);
      this._refs.userList.appendChild(userItem);
      this._renderedUserIds.add(user.getId());
    });
    section.appendChild(this._refs.userList);

    return section;
  }

  /**
   * Cria seção de progresso do unfollow
   */
  _createUnfollowProgressSection(props) {
    const section = createElement('div', { className: 'iu-progress-section' });

    this._refs.progressLabel = createElement('p', { className: 'iu-progress-label' }, 'Deixando de seguir...');
    section.appendChild(this._refs.progressLabel);

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
  _createResultsSection(props) {
    const section = createElement('div', { className: 'iu-results-section' });

    // Abas
    const tabs = createElement('div', { className: 'iu-tabs' });

    const tabNonFollowers = createElement('button', {
      className: `iu-tab ${props.activeTab !== 'whitelist' ? 'iu-tab-active' : ''}`,
      onClick: () => props.onChangeTab('nonFollowers')
    }, `Não-seguidores (${props.nonFollowers.length})`);
    tabs.appendChild(tabNonFollowers);

    const whitelistCount = props.whitelist?.size || 0;
    const tabWhitelist = createElement('button', {
      className: `iu-tab ${props.activeTab === 'whitelist' ? 'iu-tab-active' : ''}`,
      onClick: () => props.onChangeTab('whitelist')
    }, `Whitelist (${whitelistCount})`);
    tabs.appendChild(tabWhitelist);

    section.appendChild(tabs);

    // Campo de pesquisa
    const searchContainer = createElement('div', { className: 'iu-search-container' });
    const searchInput = createElement('input', {
      type: 'text',
      className: 'iu-search-input',
      placeholder: '🔍 Buscar usuário...',
      value: props.searchQuery || '',
      onInput: (e) => props.onSearch(e.target.value)
    });
    searchContainer.appendChild(searchInput);
    section.appendChild(searchContainer);

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
  _createNonFollowersContent(section, props) {
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
        const userItem = this._createUserItemWithActions(user, isSelected, isWhitelisted, props);
        this._refs.userList.appendChild(userItem);
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
    const allSelected = filteredUsers.length > 0 && props.selectedUsers.size === filteredUsers.length;
    const selectAllBtn = createElement('button', {
      className: 'iu-button iu-button-secondary',
      onClick: () => props.onToggleAll(!allSelected)
    }, allSelected ? 'Desmarcar todos' : 'Selecionar todos');
    footer.appendChild(selectAllBtn);

    // Botão de unfollow
    if (props.selectedUsers.size > 0) {
      this._refs.unfollowBtn = createElement('button', {
        className: 'iu-button iu-button-danger',
        onClick: props.onStartUnfollow
      }, `Deixar de seguir (${props.selectedUsers.size})`);
      footer.appendChild(this._refs.unfollowBtn);
    }

    section.appendChild(footer);
  }

  /**
   * Cria conteúdo da aba whitelist
   */
  _createWhitelistContent(section, props) {
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
        this._refs.userList.appendChild(userItem);
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
  _filterUsersBySearch(users, query) {
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
  _createUserItemWithActions(user, isSelected, isWhitelisted, props) {
    const item = createElement('div', {
      className: 'iu-user-item' + (isSelected ? ' iu-selected' : '') + (isWhitelisted ? ' iu-whitelisted' : '')
    });
    item.dataset.userId = user.getId();

    // Checkbox
    const checkbox = createElement('input', {
      type: 'checkbox',
      className: 'iu-user-checkbox',
      checked: isSelected,
      onClick: (e) => {
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
      onClick: () => window.open(profileUrl, '_blank')
    });
    item.appendChild(avatar);

    // Info
    const info = createElement('div', {
      className: 'iu-user-info',
      style: { cursor: 'pointer' },
      onClick: () => window.open(profileUrl, '_blank')
    },
      createElement('span', { className: 'iu-user-username' }, `@${user.getUsername()}`),
      createElement('span', { className: 'iu-user-fullname' }, user.getFullName() || '')
    );
    item.appendChild(info);

    // Botão whitelist
    const whitelistBtn = createElement('button', {
      className: 'iu-whitelist-btn' + (isWhitelisted ? ' iu-whitelisted' : ''),
      onClick: (e) => {
        e.stopPropagation();
        props.onToggleWhitelist(user.getId());
      },
      title: isWhitelisted ? 'Remover da whitelist' : 'Adicionar à whitelist'
    }, isWhitelisted ? '★' : '☆');
    item.appendChild(whitelistBtn);

    return item;
  }

  /**
   * Cria item para whitelist
   */
  _createWhitelistItem(user, props) {
    const item = createElement('div', { className: 'iu-user-item iu-whitelisted' });
    item.dataset.userId = user.getId();

    // Avatar
    const profileUrl = `https://www.instagram.com/${user.getUsername()}/`;
    const avatar = createElement('img', {
      src: user.getProfilePicUrl() || 'https://instagram.com/static/images/anonymousUser.jpg/23e7b3b2a737.jpg',
      className: 'iu-user-avatar',
      alt: user.getUsername(),
      style: { cursor: 'pointer' },
      onClick: () => window.open(profileUrl, '_blank')
    });
    item.appendChild(avatar);

    // Info
    const info = createElement('div', {
      className: 'iu-user-info',
      style: { cursor: 'pointer' },
      onClick: () => window.open(profileUrl, '_blank')
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
  _createUserItem(user, isSelected, onToggleUser) {
    const item = createElement('div', {
      className: 'iu-user-item' + (isSelected ? ' iu-selected' : '')
    });
    item.dataset.userId = user.getId();

    // Checkbox
    const checkbox = createElement('input', {
      type: 'checkbox',
      className: 'iu-user-checkbox',
      checked: isSelected,
      onClick: (e) => {
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
      onClick: () => window.open(profileUrl, '_blank')
    });
    item.appendChild(avatar);

    // Info
    const info = createElement('div', {
      className: 'iu-user-info',
      style: { cursor: 'pointer' },
      onClick: () => window.open(profileUrl, '_blank')
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
}
