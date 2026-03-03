import { dbService } from './DatabaseService.js';
import { ACTION_TYPES } from '../../constants/Constants.js';
import { getIconUrl } from '../components/Logo.js';

interface ActionRecord {
  username: string;
  actionType: string;
  timestamp: number;
}

interface ActionLabel {
  text: string;
  color: string;
}

/**
 * ProfileHistoryButton - Injeta botão de histórico 👻 em páginas de perfil do Instagram
 */
export class ProfileHistoryButton {
  private _currentUsername: string | null;
  private _observer: MutationObserver | null;
  private _modalElement: HTMLElement | null;

  constructor() {
    this._currentUsername = null;
    this._observer = null;
    this._modalElement = null;
  }

  /**
   * Inicia a observação da página
   */
  init(): void {
    this._injectAnimationStyles();
    this._checkProfile();

    this._observer = new MutationObserver(() => {
      const username = this._extractUsernameFromUrl();
      if (username !== this._currentUsername) {
        this._currentUsername = username;
        this._removeExistingButton();
        this._checkProfile();
      }
    });

    this._observer.observe(document.body, { childList: true, subtree: true });
  }

  private _injectAnimationStyles(): void {
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

  private _extractUsernameFromUrl(): string | null {
    const parts = location.pathname.split('/').filter(Boolean);
    if (parts.length === 1 && !['explore', 'reels', 'direct', 'stories', 'accounts'].includes(parts[0])) {
      return parts[0];
    }
    return null;
  }

  private _removeExistingButton(): void {
    const existing = document.querySelector('.ghostgram-history-btn');
    if (existing) existing.remove();
    this._closeModal(false);
  }

  private async _checkProfile(): Promise<void> {
    const username = this._extractUsernameFromUrl();
    if (!username) return;

    const actions = await this._getActionsForUser(username);
    if (actions.length === 0) return;

    const avatarContainer = await this._waitForAvatarContainer();
    if (!avatarContainer) return;
    if (avatarContainer.querySelector('.ghostgram-history-btn')) return;

    this._injectButton(avatarContainer, username, actions);
  }

  private async _getActionsForUser(username: string): Promise<ActionRecord[]> {
    try {
      const allActions: ActionRecord[] = await dbService.getAllActions();
      return allActions.filter(a => a.username === username);
    } catch (e) {
      console.error('[ProfileHistoryButton] Erro:', e);
      return [];
    }
  }

  /**
   * Aguarda o container da foto do perfil via XPath
   */
  private async _waitForAvatarContainer(): Promise<Element | null> {
    const xpath = '/html/body/div[1]/div/div/div[2]/div/div/div[1]/div[2]/div[2]/section/main/div/div/header/div/section[1]/div/span';
    return new Promise((resolve) => {
      let attempts = 0;
      const interval = setInterval(() => {
        const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        const el = result.singleNodeValue as Element | null;
        if (el) {
          clearInterval(interval);
          resolve(el);
        }
        if (attempts++ > 15) {
          clearInterval(interval);
          // Fallback: try header section
          const fallback = document.querySelector('header section');
          resolve(fallback);
        }
      }, 500);
    });
  }

  private _injectButton(container: Element, username: string, actions: ActionRecord[]): void {
    // Make container position relative so we can position absolute inside
    const htmlContainer = container as HTMLElement;
    const cs = getComputedStyle(htmlContainer);
    if (cs.position === 'static') {
      htmlContainer.style.position = 'relative';
    }

    const btn = document.createElement('button');
    btn.className = 'ghostgram-history-btn';
    btn.title = 'Ver histórico GhostGram';
    const btnIcon = document.createElement('img');
    btnIcon.src = getIconUrl();
    btnIcon.alt = 'GhostGram';
    btnIcon.width = 18;
    btnIcon.height = 18;
    btn.appendChild(btnIcon);
    btn.style.cssText = `
      position: absolute !important;
      bottom: 0 !important;
      left: 0 !important;
      background: linear-gradient(135deg, #833ab4, #e1306c, #fcaf45) !important;
      border: none !important;
      border-radius: 50% !important;
      width: 28px !important;
      height: 28px !important;
      font-size: 15px !important;
      cursor: pointer !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      transition: transform 0.2s ease !important;
      z-index: 5 !important;
    `;
    btn.addEventListener('mouseenter', () => { btn.style.transform = 'scale(1.15)'; });
    btn.addEventListener('mouseleave', () => { btn.style.transform = 'scale(1)'; });
    btn.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      this._showModal(username, actions);
    });

    container.appendChild(btn);
  }

  private _showModal(username: string, actions: ActionRecord[]): void {
    this._closeModal(false);

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
    const titleIcon = document.createElement('img');
    titleIcon.src = getIconUrl();
    titleIcon.alt = 'GhostGram';
    titleIcon.width = 18;
    titleIcon.height = 18;
    titleIcon.style.verticalAlign = 'middle';
    titleIcon.style.marginRight = '6px';
    title.appendChild(titleIcon);
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
    closeBtn.addEventListener('click', () => this._closeModal(true));
    header.appendChild(title);
    header.appendChild(closeBtn);
    modal.appendChild(header);

    // Actions list
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
      if (e.target === overlay) this._closeModal(true);
    });

    document.body.appendChild(overlay);
    this._modalElement = overlay;
  }

  /**
   * Fecha o modal com animação de saída (se animate=true)
   */
  private _closeModal(animate: boolean = false): void {
    if (!this._modalElement) return;

    if (!animate) {
      this._modalElement.remove();
      this._modalElement = null;
      return;
    }

    const overlay = this._modalElement;
    const modal = overlay.querySelector('.ghostgram-modal-content') as HTMLElement | null;
    (overlay as HTMLElement).style.animation = 'gg-overlay-out 0.2s ease-in forwards';
    if (modal) modal.style.animation = 'gg-modal-out 0.2s ease-in forwards';

    setTimeout(() => {
      overlay.remove();
      if (this._modalElement === overlay) this._modalElement = null;
    }, 220);
  }
}

export const profileHistoryButton = new ProfileHistoryButton();
