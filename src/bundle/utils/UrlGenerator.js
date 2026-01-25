import { CookieHelper } from './CookieHelper.js';

/**
 * Classe utilitária para geração de URLs do Instagram
 */
export class UrlGenerator {
  /**
   * Gera a URL para buscar seguidores
   * @param {Object} settings - Configurações do sistema
   * @param {string} cursor - Cursor para paginação (opcional)
   * @returns {string} URL completa
   */
  static generateFollowersUrl(settings, cursor) {
    const userId = CookieHelper.getUserId();
    if (!userId) {
      throw new Error('ID do usuário não encontrado nos cookies');
    }

    const variables = {
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
   * @param {Object} settings - Configurações do sistema
   * @param {string} userId - ID do usuário para dar unfollow
   * @returns {string} URL completa
   */
  static generateUnfollowUrl(settings, userId) {
    const baseUrl = settings.getInstagramUnfollowBaseUrl();
    return `${baseUrl}${userId}/unfollow/`;
  }
}


