import { dbService } from './DatabaseService.js';

/**
 * FollowMonitor - Monitora cliques manuais em botões de "Seguir" no Instagram
 */
export class FollowMonitor {
  constructor() {
    this._observers = [];
    this._isListening = false;
  }

  /**
   * Inicia o monitoramento
   */
  start() {
    if (this._isListening) return;
    this._isListening = true;

    // Monitora cliques em todo o documento (delegação de eventos)
    document.addEventListener('click', this._handleDocumentClick.bind(this), true);

    console.log('[FollowMonitor] Monitoramento de cliques iniciado');
  }

  /**
   * Para o monitoramento
   */
  stop() {
    document.removeEventListener('click', this._handleDocumentClick.bind(this), true);
    this._isListening = false;
  }

  /**
   * Trata cliques no documento para identificar botões de Seguir
   */
  async _handleDocumentClick(event) {
    const target = event.target;

    // Verifica se o elemento clicado é um botão de seguir
    // O Instagram usa botões que contém o texto "Seguir" ou "Follow"
    const button = target.closest('button');
    if (!button) return;

    const text = button.innerText || button.textContent;
    const isFollowAction = text.trim() === 'Seguir' || text.trim() === 'Follow';

    if (isFollowAction) {
      this._checkUnfollowHistory(button);
    }
  }

  /**
   * Verifica se o usuário já foi deixado de seguir pela ferramenta e avisa o usuário
   */
  async _checkUnfollowHistory(button) {
    try {
      let username = this._extractUsernameFromContext(button);

      if (!username) {
        // Se for na página de perfil direto, pega da URL
        if (location.pathname.split('/').length >= 2) {
          username = location.pathname.split('/')[1];
        }
      }

      if (username && !['explore', 'reels', 'direct', 'stories'].includes(username)) {
        const allActions = await dbService.getAllActions();
        const prevUnfollow = allActions.find(a =>
          a.username === username &&
          a.actionType === 'unfollow' &&
          a.source === 'auto'
        );

        if (prevUnfollow) {
          const date = new Date(prevUnfollow.timestamp).toLocaleDateString('pt-BR');
          console.log(`[FollowMonitor] Aviso: Usuário ${username} já foi removido pelo GhostGram em ${date}`);

          // Usamos um alert para garantir que o usuário veja o aviso
          alert(`Atenção: Você está tentando seguir @${username}, mas já deixou de seguir este usuário usando o GhostGram em ${date}.`);
        }
      }
    } catch (error) {
      console.error('[FollowMonitor] Erro ao verificar histórico:', error);
    }
  }

  /**
   * Tenta extrair o username baseado no contexto do botão
   */
  _extractUsernameFromContext(button) {
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
        const parts = href.split('/').filter(Boolean);
        if (parts.length === 1) return parts[0];
      }
    }
    return null;
  }
}

export const followMonitor = new FollowMonitor();
