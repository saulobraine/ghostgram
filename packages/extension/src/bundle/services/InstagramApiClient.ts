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
      throw new Error('CSRF token not found. Make sure you are logged in to Instagram.');
    }

    const rolloutHash = CookieHelper.getRolloutHash();
    const headers: Record<string, string> = {
      'content-type': 'application/x-www-form-urlencoded',
      'x-csrftoken': csrfToken,
      'x-requested-with': 'XMLHttpRequest',
      'x-ig-app-id': '936619743392459'
    };

    if (rolloutHash) {
      headers['x-instagram-ajax'] = rolloutHash;
    } else {
      console.warn('[InstagramApiClient] Rollout hash not found. Proceeding without x-instagram-ajax header. This may cause request rejection.');
    }

    const url = UrlGenerator.generateUnfollowUrl(settings, userId);
    const response = await fetch(url, {
      method: 'POST',
      headers,
      mode: 'same-origin',
      credentials: 'include'
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new Error(`Failed to unfollow user ${userId}: ${response.status} ${response.statusText}. Body: ${errorBody.substring(0, 200)}`);
    }

    // Valida se a resposta contém indicador de sucesso
    try {
      const responseData = await response.json();
      // Instagram geralmente retorna {status: 'ok'} ou similar
      if (responseData.status !== 'ok' && responseData.status !== 'success') {
        console.warn('[InstagramApiClient] Unfollow response status not ok:', responseData);
        // Não lança erro, pois 200 OK geralmente significa sucesso mesmo sem status explícito
      }
    } catch (e) {
      // Se não for JSON, é okay (algumas respostas são vazias)
      console.log('[InstagramApiClient] Unfollow response is not JSON (likely empty)');
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
