import { dbService } from './DatabaseService.js';
import { ACTION_TYPES, ACTION_SOURCES } from '../../constants/Constants.js';
import { createElement } from '../utils/DOMRenderer.js';

interface ActionRecord {
  userId: string;
  username: string;
  actionType: string;
  source: string;
  timestamp: number;
}

interface RefollowConfirmationState {
  button: HTMLButtonElement;
  container: HTMLElement;
  originalDisplay: string;
}

/**
 * FollowMonitor - Monitora cliques manuais em botões de "Seguir" e "Deixar de seguir" no Instagram
 */
export class FollowMonitor {
  private _isListening: boolean;
  private _boundHandler: (event: MouseEvent) => void;
  private _followXPath: string;
  private _pendingUnfollowUsername: string | null;
  private _pendingFollowCheckButton: HTMLButtonElement | null;
  private _allowedConfirmedFollowButton: HTMLButtonElement | null;
  private _refollowConfirmation: RefollowConfirmationState | null;

  constructor() {
    this._isListening = false;
    this._boundHandler = this._handleDocumentClick.bind(this);
    this._followXPath = '/html/body/div[1]/div/div/div[2]/div/div/div[1]/div[2]/div[2]/section/main/div/div/header/section[1]/div/div/div/div/div[1]/button';
    this._pendingUnfollowUsername = null;
    this._pendingFollowCheckButton = null;
    this._allowedConfirmedFollowButton = null;
    this._refollowConfirmation = null;
  }

  /**
   * Inicia o monitoramento
   */
  start(): void {
    if (this._isListening) return;
    this._isListening = true;

    document.addEventListener('click', this._boundHandler, true);

    console.log('[FollowMonitor] Monitoramento de cliques iniciado');
  }

  /**
   * Para o monitoramento
   */
  stop(): void {
    document.removeEventListener('click', this._boundHandler, true);
    this._isListening = false;
    this._pendingUnfollowUsername = null;
    this._pendingFollowCheckButton = null;
    this._allowedConfirmedFollowButton = null;
    this._clearRefollowConfirmation();
  }

  private _getFollowButtonByXPath(): Node | null {
    try {
      const result = document.evaluate(
        this._followXPath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      );
      return result.singleNodeValue;
    } catch {
      return null;
    }
  }

  /**
   * Verifica se um elemento é um botão de seguir (texto ou XPath)
   * Ignora botões "Seguindo"/"Following" (que são para deixar de seguir)
   */
  private _isFollowButton(target: HTMLElement): HTMLButtonElement | null {
    const button = target.closest('button') as HTMLButtonElement | null;
    if (!button) return null;

    const text = (button.innerText || button.textContent || '').trim();

    if (['Seguindo', 'Following', 'Solicitado', 'Requested'].includes(text)) {
      return null;
    }

    if (text === 'Seguir' || text === 'Follow') {
      return button;
    }

    const xpathButton = this._getFollowButtonByXPath() as HTMLButtonElement | null;
    if (xpathButton && (xpathButton === button || xpathButton.contains(target))) {
      const xpathText = (xpathButton.innerText || xpathButton.textContent || '').trim();
      if (xpathText === 'Seguir' || xpathText === 'Follow') {
        return xpathButton;
      }
    }

    return null;
  }

  /**
   * Detecta clique em botão "Seguindo"/"Following" que abre o dialog de unfollow
   */
  private _isUnfollowTriggerButton(target: HTMLElement): HTMLButtonElement | null {
    const button = target.closest('button') as HTMLButtonElement | null;
    if (!button) return null;

    const text = (button.innerText || button.textContent || '').trim();
    if (['Seguindo', 'Following'].includes(text)) {
      return button;
    }
    return null;
  }

  /**
   * Detecta clique no botão de confirmação "Deixar de seguir" no dialog do Instagram
   */
  private _isUnfollowConfirmButton(target: HTMLElement): boolean {
    const clickable = target.closest('button, div[role="button"], [tabindex]') as HTMLElement | null;
    if (!clickable) return false;

    const text = (clickable.innerText || clickable.textContent || '').trim();
    if (text === 'Deixar de seguir' || text === 'Unfollow') {
      return true;
    }

    const dialog = clickable.closest('[role="dialog"], [role="presentation"]');
    if (dialog && (text === 'Deixar de seguir' || text === 'Unfollow')) {
      return true;
    }

    return false;
  }

  /**
   * Trata cliques no documento para identificar botões de Seguir e Deixar de Seguir
   */
  private async _handleDocumentClick(event: MouseEvent): Promise<void> {
    const target = event.target as HTMLElement | null;
    if (!target) {
      return;
    }

    const unfollowTrigger = this._isUnfollowTriggerButton(target);
    if (unfollowTrigger) {
      const username = this._extractUsernameFromContext(unfollowTrigger);
      if (this._isValidProfileUsername(username)) {
        this._pendingUnfollowUsername = username;
        console.log(`[FollowMonitor] Botão "Seguindo" clicado para @${username}, aguardando confirmação...`);
      }
      return;
    }

    if (this._isUnfollowConfirmButton(target)) {
      const username = this._pendingUnfollowUsername || this._extractUsernameFromUrl();
      this._pendingUnfollowUsername = null;

      if (this._isValidProfileUsername(username)) {
        await dbService.logAction({
          userId: username,
          username,
          actionType: ACTION_TYPES.UNFOLLOW,
          source: ACTION_SOURCES.MANUAL
        });
        console.log(`[FollowMonitor] Unfollow manual registrado: @${username}`);
      }
      return;
    }

    const button = this._isFollowButton(target);
    if (!button) {
      return;
    }

    if (this._allowedConfirmedFollowButton === button) {
      this._allowedConfirmedFollowButton = null;
      this._pendingUnfollowUsername = null;
      return;
    }

    const username = this._extractUsernameFromContext(button);
    if (!this._isValidProfileUsername(username)) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();

    if (this._pendingFollowCheckButton === button) {
      return;
    }

    this._pendingUnfollowUsername = null;
    this._pendingFollowCheckButton = button;

    await this._handleFollowIntent(button, username);
  }

  private async _handleFollowIntent(button: HTMLButtonElement, username: string): Promise<void> {
    try {
      const prevUnfollow = await this._findPreviousAutoUnfollow(username);

      if (prevUnfollow) {
        const date = new Date(prevUnfollow.timestamp).toLocaleDateString('pt-BR');
        console.log(`[FollowMonitor] Aviso: Usuário ${username} já foi removido pelo GhostGram em ${date}`);
        this._releasePendingFollowCheck(button);
        this._showRefollowConfirmation(button, username, date);
        return;
      }

      await dbService.logAction({
        userId: username,
        username,
        actionType: ACTION_TYPES.FOLLOW,
        source: ACTION_SOURCES.MANUAL
      });
      console.log(`[FollowMonitor] Follow manual registrado: @${username}`);
      this._releasePendingFollowCheck(button);
      this._allowNextFollowClick(button);
    } catch (error) {
      console.error('[FollowMonitor] Erro ao verificar histórico:', error);
      this._releasePendingFollowCheck(button);
      this._allowNextFollowClick(button);
    }
  }

  private async _findPreviousAutoUnfollow(username: string): Promise<ActionRecord | undefined> {
    const allActions: ActionRecord[] = await dbService.getAllActions();
    return allActions.find(action =>
      action.username === username &&
      action.actionType === ACTION_TYPES.UNFOLLOW &&
      action.source === ACTION_SOURCES.AUTO
    );
  }

  private _showRefollowConfirmation(button: HTMLButtonElement, username: string, date: string): void {
    this._clearRefollowConfirmation();

    const parent = button.parentElement;
    if (!parent) {
      return;
    }

    const originalDisplay = button.style.display;
    const container = createElement('div', {
      className: 'iu-follow-confirmation'
    }) as HTMLElement;

    const text = createElement(
      'p',
      { className: 'iu-follow-confirmation-text' },
      `Você deixou de seguir @${username} com o GhostGram em ${date}. Deseja seguir novamente?`
    ) as HTMLElement;

    const actions = createElement('div', {
      className: 'iu-follow-confirmation-actions'
    }) as HTMLElement;

    const confirmButton = createElement('button', {
      className: 'iu-follow-confirmation-btn iu-follow-confirmation-btn-confirm',
      type: 'button',
      onClick: (clickEvent: Event) => {
        clickEvent.preventDefault();
        clickEvent.stopPropagation();
        void this._handleRefollowAccepted(button, username);
      }
    }, 'Seguir mesmo assim') as HTMLButtonElement;

    const cancelButton = createElement('button', {
      className: 'iu-follow-confirmation-btn iu-follow-confirmation-btn-cancel',
      type: 'button',
      onClick: (clickEvent: Event) => {
        clickEvent.preventDefault();
        clickEvent.stopPropagation();
        void this._handleRefollowRejected(username);
      }
    }, 'Cancelar') as HTMLButtonElement;

    actions.appendChild(confirmButton);
    actions.appendChild(cancelButton);
    container.appendChild(text);
    container.appendChild(actions);

    button.style.display = 'none';
    button.insertAdjacentElement('afterend', container);

    this._refollowConfirmation = {
      button,
      container,
      originalDisplay
    };
  }

  private async _handleRefollowAccepted(button: HTMLButtonElement, username: string): Promise<void> {
    try {
      await dbService.logAction({
        userId: username,
        username,
        actionType: ACTION_TYPES.RE_FOLLOW_ACCEPTED,
        source: ACTION_SOURCES.MANUAL
      });
      console.log(`[FollowMonitor] Re-follow aceito: @${username}`);
    } catch (error) {
      console.error('[FollowMonitor] Erro ao registrar re-follow aceito:', error);
    }

    this._clearRefollowConfirmation();
    this._allowNextFollowClick(button);
  }

  private async _handleRefollowRejected(username: string): Promise<void> {
    try {
      await dbService.logAction({
        userId: username,
        username,
        actionType: ACTION_TYPES.RE_FOLLOW_REJECTED,
        source: ACTION_SOURCES.MANUAL
      });
      console.log(`[FollowMonitor] Re-follow rejeitado: @${username}`);
    } catch (error) {
      console.error('[FollowMonitor] Erro ao registrar re-follow rejeitado:', error);
    }

    this._clearRefollowConfirmation();
  }

  private _allowNextFollowClick(button: HTMLButtonElement): void {
    this._allowedConfirmedFollowButton = button;
    window.setTimeout(() => {
      button.click();
      if (this._allowedConfirmedFollowButton === button) {
        this._allowedConfirmedFollowButton = null;
      }
    }, 0);
  }

  private _releasePendingFollowCheck(button: HTMLButtonElement): void {
    if (this._pendingFollowCheckButton === button) {
      this._pendingFollowCheckButton = null;
    }
  }

  private _clearRefollowConfirmation(): void {
    if (!this._refollowConfirmation) {
      return;
    }

    this._refollowConfirmation.button.style.display = this._refollowConfirmation.originalDisplay;
    this._refollowConfirmation.container.remove();
    this._refollowConfirmation = null;
  }

  private _isValidProfileUsername(username: string | null): username is string {
    if (!username) {
      return false;
    }

    return !['explore', 'reels', 'direct', 'stories', 'accounts'].includes(username);
  }

  /**
   * Tenta extrair o username baseado no contexto do botão
   */
  private _extractUsernameFromContext(button: HTMLElement): string | null {
    const container = button.closest('div');
    if (container) {
      const links = container.querySelectorAll('a');
      for (const link of links) {
        const href = link.getAttribute('href');
        if (!href) {
          continue;
        }

        if (href.length > 1 && !href.slice(1).includes('/')) {
          return href.replaceAll('/', '');
        }

        const parts = href.split('/').filter(Boolean);
        if (parts.length === 1) {
          return parts[0];
        }
      }
    }

    const pathUsername = location.pathname.split('/').filter(Boolean)[0];
    if (this._isValidProfileUsername(pathUsername || null)) {
      return pathUsername;
    }

    return null;
  }

  /**
   * Extrai username da URL da página de perfil
   */
  private _extractUsernameFromUrl(): string | null {
    const parts = location.pathname.split('/').filter(Boolean);
    const username = parts[0] || null;
    if (this._isValidProfileUsername(username)) {
      return username;
    }
    return null;
  }
}

export const followMonitor = new FollowMonitor();
