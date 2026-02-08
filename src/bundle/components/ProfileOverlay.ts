import { dbService } from '../services/DatabaseService.js';
import { createElement } from '../utils/DOMRenderer.js';
import { ACTION_TYPES, ACTION_SOURCES } from '../../constants/Constants.js';

interface ActionRecord {
  id: string;
  userId: string;
  username: string;
  actionType: string;
  source: string;
  timestamp: number;
}

/**
 * ProfileOverlay - Injeta informações de histórico nas páginas de perfil do Instagram
 */
export class ProfileOverlay {
  private _currentUsername: string | null;
  private _observer: MutationObserver | null;

  constructor() {
    this._currentUsername = null;
    this._observer = null;
  }

  /**
   * Inicia a observação da página
   */
  init(): void {
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
   * @private
   */
  private _extractUsernameFromUrl(): string | null {
    const parts = location.pathname.split('/').filter(Boolean);
    if (parts.length === 1 && !['explore', 'reels', 'direct', 'stories'].includes(parts[0])) {
      return parts[0];
    }
    return null;
  }

  /**
   * Verifica se está em um perfil e tenta injetar o overlay
   * @private
   */
  private async _checkProfile(): Promise<void> {
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
   * @private
   */
  private _waitForHeader(): Promise<HTMLElement | null> {
    return new Promise((resolve) => {
      let attempts = 0;
      const interval = setInterval(() => {
        // Seletor comum para o header do perfil
        const header = document.querySelector('header section') as HTMLElement | null;
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
   * @private
   */
  private async _injectInfo(container: HTMLElement, username: string): Promise<void> {
    try {
      // Busca histórico no banco de dados (especificamente unfollows via GhostGram)
      const allActions = await dbService.getAllActions();
      const ghostUnfollowActions = allActions.filter((a: ActionRecord) =>
        a.username === username &&
        a.actionType === ACTION_TYPES.UNFOLLOW &&
        a.source === ACTION_SOURCES.AUTO
      );

      if (ghostUnfollowActions.length === 0) return;

      const lastAction = ghostUnfollowActions[0];
      const date = new Date(lastAction.timestamp).toLocaleDateString('pt-BR');

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
        createElement('span', {}, `Deixou de seguir em: ${date} (via ferramenta)`)
      );

      // Insere no final do header
      container.appendChild(infoElement);
    } catch (error) {
      console.error('[ProfileOverlay] Erro ao injetar info:', error);
    }
  }
}

export const profileOverlay = new ProfileOverlay();
