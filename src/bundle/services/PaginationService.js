// PaginationService - Service for pagination operations
import { UNFOLLOWERS_PER_PAGE } from '../../constants/Constants.js';

/**
 * Serviço responsável por operações de paginação de usuários
 */
export class PaginationService {
  /**
   * Retorna os usuários de uma página específica
   * @param {Array<User>} users - Lista completa de usuários
   * @param {number} pageNumber - Número da página (começa em 1)
   * @returns {Array<User>} Usuários da página solicitada
   */
  static getPage(users, pageNumber) {
    const startIndex = UNFOLLOWERS_PER_PAGE * (pageNumber - 1);
    const endIndex = startIndex + UNFOLLOWERS_PER_PAGE;
    return users.slice(startIndex, endIndex);
  }

  /**
   * Calcula o número máximo de páginas para uma lista de usuários
   * @param {Array<User>} users - Lista de usuários
   * @returns {number} Número máximo de páginas (mínimo 1)
   */
  static getMaxPage(users) {
    if (!users || users.length === 0) {
      return 1;
    }
    
    const maxPage = Math.ceil(users.length / UNFOLLOWERS_PER_PAGE);
    return maxPage < 1 ? 1 : maxPage;
  }

  /**
   * Retorna os usuários da página atual (alias para getPage)
   * @param {Array<User>} users - Lista completa de usuários
   * @param {number} pageNumber - Número da página (começa em 1)
   * @returns {Array<User>} Usuários da página solicitada
   */
  static getCurrentPage(users, pageNumber) {
    return PaginationService.getPage(users, pageNumber);
  }
}

