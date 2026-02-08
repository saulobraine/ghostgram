// InstagramApiClient - Service for Instagram API communication
import { UrlGenerator } from '../utils/UrlGenerator.js';
import { CookieHelper } from '../utils/CookieHelper.js';
import { User } from '../domain/User.js';
import type { Settings } from '../../domain/Settings.js';

interface FollowersResponse {
  users: User[];
  hasNextPage: boolean;
  endCursor: string | null;
  totalCount: number;
}

interface InstagramApiResponse {
  data: {
    user: {
      edge_follow: {
        edges: Array<{
          node: any;
        }>;
        page_info: {
          has_next_page: boolean;
          end_cursor: string | null;
        };
        count: number;
      };
    };
  };
}

/**
 * Cliente para comunicação com a API do Instagram
 * Responsável por buscar seguidores e realizar unfollow
 */
export class InstagramApiClient {
  /**
   * Busca seguidores do usuário logado
   * @param settings - Configurações do sistema
   * @param cursor - Cursor para paginação (opcional)
   * @returns Objeto com users, hasNextPage, endCursor, totalCount
   * @throws {Error} Se a requisição falhar
   */
  async fetchFollowers(settings: Settings, cursor: string | null = null): Promise<FollowersResponse> {
    const url = UrlGenerator.generateFollowersUrl(settings, cursor);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch followers: ${response.status}`);
    }

    const data: InstagramApiResponse = await response.json();
    return this._parseFollowersResponse(data);
  }

  /**
   * Deixa de seguir um usuário
   * @param settings - Configurações do sistema
   * @param userId - ID do usuário para deixar de seguir
   * @returns True se bem-sucedido
   * @throws {Error} Se o token CSRF não for encontrado ou a requisição falhar
   */
  async unfollowUser(settings: Settings, userId: string): Promise<boolean> {
    const csrfToken = CookieHelper.getCsrfToken();
    if (!csrfToken) {
      throw new Error('CSRF token not found');
    }

    const url = UrlGenerator.generateUnfollowUrl(settings, userId);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'x-csrftoken': csrfToken
      },
      mode: 'cors',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Failed to unfollow user: ${response.status}`);
    }

    return true;
  }

  private _parseFollowersResponse(data: InstagramApiResponse): FollowersResponse {
    if (!data || !data.data || !data.data.user) {
      throw new Error('Invalid API response structure');
    }

    const edgeFollow = data.data.user.edge_follow;
    const users = edgeFollow.edges.map(edge => User.fromObject(edge.node));

    return {
      users: users,
      hasNextPage: edgeFollow.page_info.has_next_page,
      endCursor: edgeFollow.page_info.end_cursor,
      totalCount: edgeFollow.count
    };
  }
}
