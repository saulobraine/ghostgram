// UrlGenerator - Gera URLs para a API do Instagram
import { INSTAGRAM_GRAPHQL_BASE_URL, INSTAGRAM_GRAPHQL_QUERY_HASH, INSTAGRAM_UNFOLLOW_BASE_URL } from '../../constants/Constants.js';
import { CookieHelper } from './CookieHelper.js';

/**
 * Classe utilitária para geração de URLs do Instagram
 */
export class UrlGenerator {
  /**
   * Gera a URL para buscar seguidores
   * @param {string} cursor - Cursor para paginação (opcional)
   * @returns {string} URL completa
   */
  static generateFollowersUrl(cursor) {
    const userId = CookieHelper.getUserId();
    if (!userId) {
      throw new Error('ID do usuário não encontrado nos cookies');
    }

    const variables = {
      id: userId,
      include_reel: true,
      fetch_mutual: false,
      first: '24'
    };

    if (cursor) {
      variables.after = cursor;
    }

    const variablesJson = JSON.stringify(variables);
    return `${INSTAGRAM_GRAPHQL_BASE_URL}?query_hash=${INSTAGRAM_GRAPHQL_QUERY_HASH}&variables=${encodeURIComponent(variablesJson)}`;
  }

  /**
   * Gera a URL para realizar unfollow
   * @param {string} userId - ID do usuário para dar unfollow
   * @returns {string} URL completa
   */
  static generateUnfollowUrl(userId) {
    return `${INSTAGRAM_UNFOLLOW_BASE_URL}${userId}/unfollow/`;
  }
}


