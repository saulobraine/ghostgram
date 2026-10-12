import { CookieHelper } from './CookieHelper.js';
import type { Settings } from '../../domain/Settings.js';

/**
 * Classe utilitária para geração de URLs do Instagram
 */
export class UrlGenerator {
  /**
   * Gera a URL para o endpoint REST de amizades (following ou followers)
   * @param endpoint - 'following' ou 'followers'
   * @param maxId - Cursor de paginação (opcional)
   * @param count - Quantidade de usuários por página (padrão: 50)
   * @returns URL completa
   * @throws {Error} Se o ID do usuário não for encontrado
   */
  static generateFriendshipsUrl(
    endpoint: 'following' | 'followers',
    maxId?: string | null,
    count: number = 50
  ): string {
    const userId = CookieHelper.getUserId();
    if (!userId) {
      throw new Error('ID do usuário (ds_user_id) não encontrado nos cookies');
    }

    const origin = (typeof window !== 'undefined' && window.location?.origin?.includes('instagram.com'))
      ? window.location.origin
      : 'https://www.instagram.com';

    let url = `${origin}/api/v1/friendships/${encodeURIComponent(userId)}/${endpoint}/?count=${count}&search_surface=follow_list_page`;
    return maxId ? `${url}&max_id=${encodeURIComponent(maxId)}` : url;
  }

  /**
   * Gera a URL para buscar seguidores
   * @param settings - Configurações do sistema
   * @param cursor - Cursor para paginação (opcional)
   * @returns URL completa
   * @throws {Error} Se o ID do usuário não for encontrado
   */
  static generateFollowersUrl(settings: Settings, cursor: string | null = null): string {
    const userId = CookieHelper.getUserId();
    if (!userId) {
      throw new Error('ID do usuário não encontrado nos cookies');
    }

    const variables: Record<string, string | boolean> = {
      id: userId,
      include_reel: true,
      fetch_mutual: false,
      first: settings.getUnfollowersPerPage().toString()
    };

    if (cursor) {
      variables.after = cursor;
    }

    const variablesJson = JSON.stringify(variables);
    const baseUrl = settings.getInstagramGraphqlBaseUrl();
    const queryHash = settings.getInstagramGraphqlQueryHash();

    return `${baseUrl}?query_hash=${queryHash}&variables=${encodeURIComponent(variablesJson)}`;
  }

  /**
   * Gera a URL para realizar unfollow
   * @param settings - Configurações do sistema
   * @param userId - ID do usuário para dar unfollow
   * @returns URL completa
   */
  static generateUnfollowUrl(settings: Settings, userId: string): string {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new Error(`Invalid user ID for unfollow: ${userId}`);
    }
    const baseUrl = settings.getInstagramUnfollowBaseUrl();
    // Usa encodeURIComponent para safety, embora IDs do Instagram sejam numéricos
    return `${baseUrl}${encodeURIComponent(userId.trim())}/unfollow/`;
  }
}
