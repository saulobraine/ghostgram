import { dbService } from './DatabaseService.js';
import { ACTION_TYPES, ACTION_SOURCES } from '../../constants/Constants.js';

interface ActionRecord {
  userId: string;
  username: string;
  actionType: string;
  source: string;
  timestamp: number;
}

/**
 * FollowMonitor - Monitora cliques manuais em botões de "Seguir" e "Deixar de seguir" no Instagram
 */
export class FollowMonitor {
  private _observers: MutationObserver[];
  private _isListening: boolean;
  private _boundHandler: (event: MouseEvent) => void;
  private _followXPath: string;
  private _pendingUnfollowUsername: string | null;

  constructor() {
    this._observers = [];
    this._isListening = false;
    this._boundHandler = this._handleDocumentClick.bind(this);
    this._followXPath = '/html/body/div[1]/div/div/div[2]/div/div/div[1]/div[2]/div[2]/section/main/div/div/header/section[1]/div/div/div/div/div[1]/button';
    // Username pendente de unfollow (quando clica em "Seguindo" e aparece o dialog)
    this._pendingUnfollowUsername = null;
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
  }

  /**
   * Detecta botão de seguir via XPath
   */
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
    } catch (e) {
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

    // Reject unfollow buttons (Seguindo/Following/Solicitado/Requested)
    if (['Seguindo', 'Following', 'Solicitado', 'Requested'].includes(text)) {
      return null;
    }

    if (text === 'Seguir' || text === 'Follow') {
      return button;
    }

    // Fallback: verifica via XPath, but still check text
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
    // O botão fica dentro de um dialog/modal do Instagram
    // Verificar se o texto é "Deixar de seguir" ou "Unfollow"
    const clickable = target.closest('button, div[role="button"], [tabindex]') as HTMLElement | null;
    if (!clickable) return false;

    const text = (clickable.innerText || clickable.textContent || '').trim();
    if (text === 'Deixar de seguir' || text === 'Unfollow') {
      return true;
    }

    // Fallback: verifica se está dentro de um dialog e tem texto vermelho (Instagram usa vermelho para ações destrutivas)
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
    const target = event.target as HTMLElement;

    // 1. Verifica se clicou em "Seguindo" (abre dialog de unfollow)
    const unfollowTrigger = this._isUnfollowTriggerButton(target);
    if (unfollowTrigger) {
      const username = this._extractUsernameFromContext(unfollowTrigger);
      if (username && !['explore', 'reels', 'direct', 'stories'].includes(username)) {
        this._pendingUnfollowUsername = username;
        console.log(`[FollowMonitor] Botão "Seguindo" clicado para @${username}, aguardando confirmação...`);
      }
      return;
    }

    // 2. Verifica se clicou em "Deixar de seguir" (confirmação no dialog)
    if (this._isUnfollowConfirmButton(target)) {
      const username = this._pendingUnfollowUsername || this._extractUsernameFromUrl();
      this._pendingUnfollowUsername = null;

      if (username && !['explore', 'reels', 'direct', 'stories'].includes(username)) {
        await dbService.logAction({
          userId: username,
          username: username,
          actionType: ACTION_TYPES.UNFOLLOW,
          source: ACTION_SOURCES.MANUAL
        });
        console.log(`[FollowMonitor] Unfollow manual registrado: @${username}`);
      }
      return;
    }

    // 3. Verifica se clicou em "Seguir"
    const button = this._isFollowButton(target);
    if (!button) return;

    this._pendingUnfollowUsername = null;

    const username = this._extractUsernameFromContext(button);

    // Registra todos os cliques em seguir
    if (username && !['explore', 'reels', 'direct', 'stories'].includes(username)) {
      // Verifica histórico de unfollow automático
      const hasUnfollowHistory = await this._checkUnfollowHistory(button, username, event);
      
      // Se não teve histórico de unfollow (ou seja, não foi interceptado), registra como follow normal
      if (!hasUnfollowHistory) {
        await dbService.logAction({
          userId: username,
          username: username,
          actionType: ACTION_TYPES.FOLLOW,
          source: ACTION_SOURCES.MANUAL
        });
        console.log(`[FollowMonitor] Follow manual registrado: @${username}`);
      }
    }
  }

  /**
   * Verifica se o usuário já foi deixado de seguir pela ferramenta e avisa o usuário
   * @returns true se tinha histórico de unfollow (interceptou o clique)
   */
  private async _checkUnfollowHistory(button: HTMLButtonElement, username: string, event: MouseEvent): Promise<boolean> {
    try {
      const allActions: ActionRecord[] = await dbService.getAllActions();
      const prevUnfollow = allActions.find(a =>
        a.username === username &&
        a.actionType === 'unfollow' &&
        a.source === 'auto'
      );

      if (prevUnfollow) {
        const date = new Date(prevUnfollow.timestamp).toLocaleDateString('pt-BR');
        console.log(`[FollowMonitor] Aviso: Usuário ${username} já foi removido pelo GhostGram em ${date}`);

        const confirmed = confirm(
          `⚠️ GhostGram: Você está tentando seguir @${username}, mas já deixou de seguir este usuário usando o GhostGram em ${date}.\n\nDeseja seguir novamente?`
        );

        if (confirmed) {
          await dbService.logAction({
            userId: username,
            username: username,
            actionType: ACTION_TYPES.RE_FOLLOW_ACCEPTED,
            source: ACTION_SOURCES.MANUAL
          });
          console.log(`[FollowMonitor] Re-follow aceito: @${username}`);
        } else {
          event.preventDefault();
          event.stopImmediatePropagation();
          await dbService.logAction({
            userId: username,
            username: username,
            actionType: ACTION_TYPES.RE_FOLLOW_REJECTED,
            source: ACTION_SOURCES.MANUAL
          });
          console.log(`[FollowMonitor] Re-follow rejeitado: @${username}`);
        }
        return true;
      }

      return false;
    } catch (error) {
      console.error('[FollowMonitor] Erro ao verificar histórico:', error);
      return false;
    }
  }

  /**
   * Tenta extrair o username baseado no contexto do botão
   */
  private _extractUsernameFromContext(button: HTMLElement): string | null {
    // 1. Procura em links próximos (comum em listas)
    const container = button.closest('div');
    if (container) {
      const links = container.querySelectorAll('a');
      for (const link of links) {
        const href = link.getAttribute('href');
        if (href && href.length > 1 && !href.includes('/')) {
          return href.replace('/', '');
        }
        // Links de perfil costumam ser /username/
        const parts = href!.split('/').filter(Boolean);
        if (parts.length === 1) return parts[0];
      }
    }

    // 2. Se for na página de perfil direto, pega da URL
    if (location.pathname.split('/').length >= 2) {
      const pathUsername = location.pathname.split('/')[1];
      if (pathUsername && !['explore', 'reels', 'direct', 'stories'].includes(pathUsername)) {
        return pathUsername;
      }
    }

    return null;
  }

  /**
   * Extrai username da URL da página de perfil
   */
  private _extractUsernameFromUrl(): string | null {
    const parts = location.pathname.split('/').filter(Boolean);
    if (parts.length >= 1 && !['explore', 'reels', 'direct', 'stories', 'accounts'].includes(parts[0])) {
      return parts[0];
    }
    return null;
  }
}

export const followMonitor = new FollowMonitor();
