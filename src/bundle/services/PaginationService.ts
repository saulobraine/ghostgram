// PaginationService - Service for pagination operations
import { UNFOLLOWERS_PER_PAGE } from '../../constants/Constants.js';
import type { User } from '../domain/User.js';

/**
 * Serviço responsável por operações de paginação de usuários
 */
export class PaginationService {
  /**
   * Retorna os usuários de uma página específica
   * @param users - Lista completa de usuários
   * @param pageNumber - Número da página (começa em 1)
   * @returns Usuários da página solicitada
   */
  static getPage(users: User[], pageNumber: number): User[] {
    const startIndex = UNFOLLOWERS_PER_PAGE * (pageNumber - 1);
    const endIndex = startIndex + UNFOLLOWERS_PER_PAGE;
    return users.slice(startIndex, endIndex);
  }

  /**
   * Calcula o número máximo de páginas para uma lista de usuários
   * @param users - Lista de usuários
   * @returns Número máximo de páginas (mínimo 1)
   */
  static getMaxPage(users: User[] | null | undefined): number {
    if (!users || users.length === 0) {
      return 1;
    }
    
    const maxPage = Math.ceil(users.length / UNFOLLOWERS_PER_PAGE);
    return maxPage < 1 ? 1 : maxPage;
  }

  /**
   * Retorna os usuários da página atual (alias para getPage)
   * @param users - Lista completa de usuários
   * @param pageNumber - Número da página (começa em 1)
   * @returns Usuários da página solicitada
   */
  static getCurrentPage(users: User[], pageNumber: number): User[] {
    return PaginationService.getPage(users, pageNumber);
  }
}
