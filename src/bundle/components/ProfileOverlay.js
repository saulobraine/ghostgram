import { dbService } from '../services/DatabaseService.js';
import { createElement } from '../utils/DOMRenderer.js';

/**
 * ProfileOverlay - Injeta informações de histórico nas páginas de perfil do Instagram
 */
export class ProfileOverlay {
  constructor() {
    this._currentUsername = null;
    this._observer = null;
  }

  /**
   * Inicia a observação da página
   */
  init() {
    this._checkProfile();

    // Monitora mudanças na URL e no DOM (Instagram é SPA)
    this._observer = new MutationObserver(() => {
      const username = this._extractUsernameFromUrl();
      if (username !== this._currentUsername) {
        this._currentUsername = username;
        this._checkProfile();
      }
    });

    this._observer.observe(document.body, { childList: true, subtree: true });
  }

  /**
   * Extrai o username da URL atual
   */
  _extractUsernameFromUrl() {
    const parts = location.pathname.split('/').filter(Boolean);
    if (parts.length === 1 && !['explore', 'reels', 'direct', 'stories'].includes(parts[0])) {
      return parts[0];
    }
    return null;
  }

  /**
   * Verifica se está em um perfil e tenta injetar o overlay
   */
  async _checkProfile() {
    const username = this._extractUsernameFromUrl();
    if (!username) return;

    // Aguarda o header do perfil aparecer
    const header = await this._waitForHeader();
    if (!header) return;

    // Se já tiver injetado para este usuário, pula
    if (header.querySelector('.ghostgram-profile-info')) return;

    this._injectInfo(header, username);
  }

  /**
   * Aguarda o elemento do header do perfil aparecer
   */
  async _waitForHeader() {
    return new Promise((resolve) => {
      let attempts = 0;
      const interval = setInterval(() => {
        // Seletor comum para o header do perfil
        const header = document.querySelector('header section');
        if (header) {
          clearInterval(interval);
          resolve(header);
        }
        if (attempts++ > 10) {
          clearInterval(interval);
          resolve(null);
        }
      }, 500);
    });
  }

  /**
   * Injeta as informações de histórico
   */
  async _injectInfo(container, username) {
    try {
      // Busca histórico no banco de dados (pelo username pois o ID real é difícil de ter aqui)
      const allActions = await dbService.getAllActions();
      const userActions = allActions.filter(a => a.username === username);

      if (userActions.length === 0) return;

      const lastAction = userActions[0];
      const date = new Date(lastAction.timestamp).toLocaleString('pt-BR');
      const actionText = lastAction.actionType === 'unfollow' ? 'Deixou de seguir' : 'Seguiu';
      const sourceText = lastAction.source === 'auto' ? '(via GhostGram)' : '(manual)';

      const infoElement = createElement('div', {
        className: 'ghostgram-profile-info',
        style: {
          marginTop: '10px',
          padding: '8px 12px',
          background: 'rgba(196, 69, 105, 0.1)',
          borderLeft: '4px solid #c44569',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#c44569',
          display: 'flex',
          flexDirection: 'column'
        }
      },
        createElement('strong', { style: { marginBottom: '2px' } }, '📜 Histórico GhostGram'),
        createElement('span', {}, `${actionText} em: ${date} ${sourceText}`)
      );

      // Insere no final do header
      container.appendChild(infoElement);
    } catch (error) {
      console.error('[ProfileOverlay] Erro ao injetar info:', error);
    }
  }
}

export const profileOverlay = new ProfileOverlay();
