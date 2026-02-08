import { CookieHelper } from './CookieHelper.js';
import type { Settings } from '../../domain/Settings.js';

/**
 * Classe utilitária para geração de URLs do Instagram
 */
export class UrlGenerator {
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
    const baseUrl = settings.getInstagramUnfollowBaseUrl();
    return `${baseUrl}${userId}/unfollow/`;
  }
}
