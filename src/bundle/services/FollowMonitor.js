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
      this._interceptFollow(button);
    }
  }

  /**
   * Tenta identificar o usuário que está sendo seguido e registra o log
   */
  async _interceptFollow(button) {
    try {
      // Tenta encontrar o nome de usuário próximo ao botão
      // No Instagram, o username geralmente está em um header ou link próximo
      let username = this._extractUsernameFromContext(button);

      if (!username) {
        // Se for na página de perfil direto, pega da URL
        if (location.pathname.split('/').length >= 2) {
          username = location.pathname.split('/')[1];
        }
      }

      if (username && username !== 'explore' && username !== 'reels' && username !== 'direct') {
        console.log(`[FollowMonitor] Detectado "Seguir" para: ${username}`);

        await dbService.logAction({
          userId: 'manual_trace', // ID real é difícil de pegar via DOM sem API
          username: username,
          actionType: 'follow',
          source: 'manual'
        });
      }
    } catch (error) {
      console.error('[FollowMonitor] Erro ao interceptar follow:', error);
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
