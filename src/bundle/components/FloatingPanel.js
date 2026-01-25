// FloatingPanel - Componente de painel flutuante com atualização incremental
import { createElement } from '../utils/DOMRenderer.js';
import { Logo } from './Logo.js';
import { STORAGE_KEYS } from '../../constants/Constants.js';

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
    this._onWindowResize = this._onWindowResize.bind(this);

    // Inicia observer de redimensionamento
    this._setupResizeObserver();
  }

  /**
   * Carrega posição salva do localStorage
   * Valida os limites para garantir que o painel fique visível
   */
  _loadPosition() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PANEL_POSITION_STORAGE);
      if (saved) {
        const pos = JSON.parse(saved);
        // Valida se a posição está dentro dos limites da tela
        if (pos.left !== undefined) {
          const margin = 10;
          const maxX = Math.max(margin, window.innerWidth - 320 - margin);
          const maxY = Math.max(margin, window.innerHeight - 400 - margin);
          return {
            left: Math.max(margin, Math.min(pos.left, maxX)),
            top: Math.max(margin, Math.min(pos.top, maxY))
          };
        }
        return pos;
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
      localStorage.setItem(STORAGE_KEYS.PANEL_POSITION_STORAGE, JSON.stringify(this._position));
    } catch (e) {
      // Ignora erro
    }
  }

  /**
   * Configura observer de redimensionamento da janela
   */
  _setupResizeObserver() {
    window.addEventListener('resize', this._onWindowResize);
  }

  /**
   * Handler de redimensionamento da janela
   * Garante que o painel permaneça visível na tela e atualiza limites de drag
   */
  _onWindowResize() {
    // Usa debounce para evitar chamadas excessivas durante resize
    if (this._resizeTimeout) {
      clearTimeout(this._resizeTimeout);
    }

    this._resizeTimeout = setTimeout(() => {
      this._updateDragBounds();
      this._constrainPosition();
    }, 100);
  }

  /**
   * Atualiza os limites de drag baseado nas dimensões atuais da página
   * Chamado automaticamente no resize da janela
   */
  _updateDragBounds() {
    if (!this.element) return;

    // Recalcula os limites máximos baseados na janela atual
    const width = this.element.offsetWidth || (this.element.classList.contains('iu-expanded') ? 320 : 64);
    const height = this.element.offsetHeight || (this.element.classList.contains('iu-expanded') ? 400 : 64);

    // Armazena limites para uso no drag
    this._dragBounds = {
      minX: 10,
      minY: 10,
      maxX: Math.max(10, window.innerWidth - width - 10),
      maxY: Math.max(10, window.innerHeight - height - 10)
    };
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

    // Aplica posição salva (já validada no _loadPosition)
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
   * Converte right/bottom para left/top para facilitar o controle de limites
   */
  _applyPosition() {
    const margin = 10;

    if (this._position.left !== undefined) {
      // Posição já em left/top - aplica diretamente
      this.element.style.left = `${this._position.left}px`;
      this.element.style.top = `${this._position.top}px`;
      this.element.style.right = 'auto';
      this.element.style.bottom = 'auto';
    } else {
      // Converte right/bottom para left/top
      const width = this.element.classList.contains('iu-expanded') ? 320 : 64;
      const height = this.element.classList.contains('iu-expanded') ? 400 : 64;

      const left = Math.max(margin, window.innerWidth - width - (this._position.right || 20));
      const top = Math.max(margin, window.innerHeight - height - (this._position.bottom || 20));

      this.element.style.left = `${left}px`;
      this.element.style.top = `${top}px`;
      this.element.style.right = 'auto';
      this.element.style.bottom = 'auto';

      // Atualiza para usar left/top internamente
      this._position = { left, top };
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

        // Posiciona a janela e garante que está na tela
        setTimeout(() => {
          this._positionContent(this._refs.content);
          this._constrainPosition();
        }, 0);
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
      props.isPaused !== prevProps.isPaused;

    // Detecta mudanças que requerem recriação da seção de resultados
    const resultsNeedUpdate =
      props.activeTab !== prevProps.activeTab ||
      props.whitelist?.size !== prevProps.whitelist?.size ||
      props.searchQuery !== prevProps.searchQuery;

    // Se mudou de estado principal, recria as seções preservando a posição
    if (stateChanged) {
      // Salva posição atual antes de recriar seções
      const savedPosition = this._preservePosition();

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

      // Restaura posição após recriar seções
      this._restorePosition(savedPosition);
      return;
    }

    // Se mudou tab, whitelist ou busca durante resultados, recria apenas a seção de resultados
    if (resultsNeedUpdate && props.isScanCompleted && this._refs.resultsSection) {
      const savedPosition = this._preservePosition();

      this._refs.resultsSection.remove();
      this._refs.resultsSection = null;
      this._refs.userList = null;
      this._refs.resultsHeader = null;
      this._refs.selectedCount = null;
      this._refs.unfollowBtn = null;
      this._renderedUserIds.clear();

      this._refs.resultsSection = this._createResultsSection(props);
      this._refs.content.appendChild(this._refs.resultsSection);

      this._restorePosition(savedPosition);
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
        const isSelected = props.selectedUsers.has(user.getId());
        const userItem = this._createUserItem(user, isSelected, props.onToggleUser);
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
  _updateSelectedCount(props, targetSection = null) {
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
        }, `Deixar de seguir (${props.selectedUsers.size})`);
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

    // Eventos de drag (isToggleButton = true para permitir toggle ao clicar)
    button.addEventListener('mousedown', (e) => this._onMouseDown(e, true));
    button.addEventListener('touchstart', (e) => this._onTouchStart(e, true), { passive: false });

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
   * @param {MouseEvent} e - Evento de mouse
   * @param {boolean} isToggleButton - Se o drag foi iniciado no botão toggle
   */
  _onMouseDown(e, isToggleButton = false) {
    // Ignora clique direito
    if (e.button !== 0) return;

    this._isDragging = true;
    this._hasMoved = false;
    this._isToggleButtonDrag = isToggleButton;
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
   * @param {TouchEvent} e - Evento de touch
   * @param {boolean} isToggleButton - Se o drag foi iniciado no botão toggle
   */
  _onTouchStart(e, isToggleButton = false) {
    if (e.touches.length !== 1) return;

    const touch = e.touches[0];
    this._isDragging = true;
    this._hasMoved = false;
    this._isToggleButtonDrag = isToggleButton;
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

    // Atualiza limites de drag se não existirem
    if (!this._dragBounds) {
      this._updateDragBounds();
    }

    // Usa limites calculados ou recalcula se necessário
    const bounds = this._dragBounds || {
      minX: 10,
      minY: 10,
      maxX: window.innerWidth - (this.element.offsetWidth || 64) - 10,
      maxY: window.innerHeight - (this.element.offsetHeight || 64) - 10
    };

    const clampedX = Math.max(bounds.minX, Math.min(newX, bounds.maxX));
    const clampedY = Math.max(bounds.minY, Math.min(newY, bounds.maxY));

    // Força left/top para drag
    this.element.style.left = `${clampedX}px`;
    this.element.style.top = `${clampedY}px`;
    this.element.style.right = 'auto';
    this.element.style.bottom = 'auto';

    // Salva posição
    this._position = { left: clampedX, top: clampedY };
  }

  /**
   * Preserva a posição atual do elemento
   * @returns {Object} Posição salva para restauração posterior
   */
  _preservePosition() {
    if (!this.element) return null;

    const rect = this.element.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top
    };
  }

  /**
   * Restaura a posição do elemento
   * @param {Object} savedPosition - Posição a ser restaurada
   */
  _restorePosition(savedPosition) {
    if (!this.element || !savedPosition) return;

    // Valida os limites antes de aplicar
    const width = this.element.offsetWidth || (this.element.classList.contains('iu-expanded') ? 320 : 64);
    const height = this.element.offsetHeight || (this.element.classList.contains('iu-expanded') ? 400 : 64);
    const margin = 10;
    const maxX = Math.max(margin, window.innerWidth - width - margin);
    const maxY = Math.max(margin, window.innerHeight - height - margin);

    const clampedX = Math.max(margin, Math.min(savedPosition.left, maxX));
    const clampedY = Math.max(margin, Math.min(savedPosition.top, maxY));

    // Aplica a posição validada
    this.element.style.left = `${clampedX}px`;
    this.element.style.top = `${clampedY}px`;
    this.element.style.right = 'auto';
    this.element.style.bottom = 'auto';

    // Atualiza o estado interno
    this._position = { left: clampedX, top: clampedY };
  }

  /**
   * Garante que o elemento está visível na tela
   * Força a correção da posição para manter o painel dentro dos limites da página
   */
  _constrainPosition() {
    if (!this.element) return;

    const rect = this.element.getBoundingClientRect();
    const width = rect.width || (this.element.classList.contains('iu-expanded') ? 320 : 64);
    const height = rect.height || (this.element.classList.contains('iu-expanded') ? 400 : 64);

    // Calcula limites máximos (margem de 10px)
    const margin = 10;
    const maxX = Math.max(margin, window.innerWidth - width - margin);
    const maxY = Math.max(margin, window.innerHeight - height - margin);

    // Calcula posição atual
    let currentX = rect.left;
    let currentY = rect.top;

    // Se a posição ainda não foi definida corretamente, usa a posição salva
    if (this._position && this._position.left !== undefined) {
      currentX = this._position.left;
      currentY = this._position.top;
    }

    // Força os limites
    const clampedX = Math.max(margin, Math.min(currentX, maxX));
    const clampedY = Math.max(margin, Math.min(currentY, maxY));

    // Sempre aplica a posição para garantir consistência
    this.element.style.left = `${clampedX}px`;
    this.element.style.top = `${clampedY}px`;
    this.element.style.right = 'auto';
    this.element.style.bottom = 'auto';

    // Atualiza estado interno
    this._position = { left: clampedX, top: clampedY };

    // Salva apenas se a posição mudou
    if (clampedX !== currentX || clampedY !== currentY) {
      this._savePosition();
    }
  }

  /**
   * Handler de mouseup para finalizar drag
   */
  _onMouseUp(e) {
    document.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('mouseup', this._onMouseUp);

    // Se não moveu e foi no botão toggle, trata como click para expandir/minimizar
    if (!this._hasMoved && this._isToggleButtonDrag && this._props) {
      this._props.onToggle();
    }

    if (this._hasMoved) {
      this._savePosition();
    }

    this._isDragging = false;
    this._isToggleButtonDrag = false;
  }

  /**
   * Handler de touchend para finalizar drag
   */
  _onTouchEnd(e) {
    document.removeEventListener('touchmove', this._onTouchMove);
    document.removeEventListener('touchend', this._onTouchEnd);

    // Se não moveu e foi no botão toggle, trata como click para expandir/minimizar
    if (!this._hasMoved && this._isToggleButtonDrag && this._props) {
      this._props.onToggle();
    }

    if (this._hasMoved) {
      this._savePosition();
    }

    this._isDragging = false;
    this._isToggleButtonDrag = false;
  }

  /**
   * Posiciona o conteúdo do painel relativo ao botão
   * Sempre abre abaixo, ajusta horizontal conforme espaço disponível
   */
  _positionContent(content) {
    const panelRect = this.element?.getBoundingClientRect();
    if (!panelRect) return;

    const panelWidth = 320;
    const margin = 10;

    // Verifica espaço vertical (abre acima se não couber abaixo)
    const contentHeight = content.offsetHeight || 400;
    const spaceBelow = window.innerHeight - panelRect.top - 70; // 70 é o offset do topo do content

    if (spaceBelow < contentHeight && panelRect.top > contentHeight) {
      // Abre acima do botão
      content.style.bottom = '70px';
      content.style.top = 'auto';
    } else {
      // Abre abaixo do botão
      content.style.top = '70px';
      content.style.bottom = 'auto';
    }

    // Calcula espaço horizontal
    const spaceRight = window.innerWidth - panelRect.left;
    const spaceLeft = panelRect.right;

    if (spaceRight >= panelWidth + margin) {
      content.style.left = '0px';
      content.style.right = 'auto';
    } else if (spaceLeft >= panelWidth + margin) {
      content.style.right = '0px';
      content.style.left = 'auto';
    } else {
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

    const actionsContainer = createElement('div', { className: 'iu-header-actions' });

    const historyBtn = createElement('button', {
      className: 'iu-history-btn',
      onClick: (e) => {
        e.stopPropagation();
        props.onOpenHistory();
      },
      title: 'Ver Histórico Completo'
    }, '📜');
    actionsContainer.appendChild(historyBtn);

    const minimizeBtn = createElement('button', {
      className: 'iu-minimize-btn',
      onClick: (e) => {
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

    // Campo de pesquisa (só mostra se tiver 2 ou mais usuários)
    if (props.nonFollowers.length >= 2) {
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
    }

    // Header da lista
    this._refs.resultsHeader = createElement('div', { className: 'iu-results-header' },
      createElement('span', { className: 'iu-count' }, `${props.nonFollowers.length} encontrados`),
      createElement('span', { className: 'iu-selected-count' }, `${props.selectedUsers.size} selecionados`)
    );
    this._refs.selectedCount = this._refs.resultsHeader.querySelector('.iu-selected-count');
    section.appendChild(this._refs.resultsHeader);

    // Filtra usuários se houver busca
    const filteredUsers = this._filterUsersBySearch(props.nonFollowers, props.searchQuery);

    // Lista de usuários (será atualizada incrementalmente)
    this._refs.userList = createElement('div', { className: 'iu-user-list' });
    filteredUsers.forEach(user => {
      const isSelected = props.selectedUsers.has(user.getId());
      const userItem = this._createUserItem(user, isSelected, props.onToggleUser);
      this._refs.userList.appendChild(userItem);
      this._renderedUserIds.add(user.getId());
    });
    section.appendChild(this._refs.userList);

    // Adiciona o botão de unfollow inicial (que será atualizado pelo updateSelectedCount)
    this._updateSelectedCount(props, section);

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

    // Campo de pesquisa (só mostra se tiver 2 ou mais usuários)
    const totalUsers = props.nonFollowers.length + (props.whitelist?.size || 0);
    if (totalUsers >= 2) {
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
    if (filteredUsers.length > 0) {
      this._refs.unfollowBtn = createElement('button', {
        className: 'iu-button iu-button-danger',
        onClick: props.onStartUnfollow,
        disabled: props.selectedUsers.size === 0
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
}
