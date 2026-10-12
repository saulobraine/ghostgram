// InstagramApiClient - Service for Instagram API communication
import { UrlGenerator } from '../utils/UrlGenerator.js';
import { CookieHelper } from '../utils/CookieHelper.js';
import { User } from '../domain/User.js';
import type { Settings } from '../../domain/Settings.js';
import { INSTAGRAM_WEB_APP_ID } from '../../constants/Constants.js';

export interface FriendshipUserRaw {
  pk: number | string;
  pk_id?: string;
  username: string;
  full_name?: string;
  profile_pic_url?: string;
  is_private?: boolean;
  is_verified?: boolean;
  has_anonymous_profile_picture?: boolean;
  follows_viewer?: boolean;
}

export interface FriendshipPageResponse {
  users: FriendshipUserRaw[];
  next_max_id?: string | null;
  has_more?: boolean;
  status: string;
  isLegacyGraphQL?: boolean;
}

interface FollowersResponse {
  users: User[];
  hasNextPage: boolean;
  endCursor: string | null;
  totalCount: number;
}

interface InstagramApiResponse {
  data?: {
    user?: {
      edge_follow?: {
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
  users?: FriendshipUserRaw[];
  next_max_id?: string;
  has_more?: boolean;
  status?: string;
}

/**
 * Cliente para comunicação com a API do Instagram
 * Responsável por buscar seguidores e realizar unfollow
 */
export class InstagramApiClient {
  /**
   * Busca uma página de 'following' ou 'followers' usando a API REST do Instagram Web
   * @param endpoint - 'following' ou 'followers'
   * @param maxId - Cursor de paginação (opcional)
   * @param count - Quantidade por ciclo (padrão 50)
   */
  async fetchFriendshipsPage(
    endpoint: 'following' | 'followers',
    maxId?: string | null,
    count: number = 50,
    retries: number = 2
  ): Promise<FriendshipPageResponse> {
    const url = UrlGenerator.generateFriendshipsUrl(endpoint, maxId, count);
    const csrfToken = CookieHelper.getCsrfToken();
    const headers: Record<string, string> = {
      'X-IG-App-ID': INSTAGRAM_WEB_APP_ID,
      'X-ASBD-ID': '129477',
      'X-Requested-With': 'XMLHttpRequest',
      'Accept': 'application/json, text/plain, */*'
    };

    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }

    let lastError: any = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) {
          // Backoff exponencial para retry: 2s, 4s...
          await new Promise(resolve => setTimeout(resolve, attempt * 2000));
        }

        const response = await fetch(url, {
          method: 'GET',
          credentials: 'include',
          headers
        });

        if (!response.ok) {
          const err = new Error(`Instagram retornou HTTP ${response.status} ao buscar ${endpoint}`);
          if (response.status === 429 || response.status === 401 || response.status === 403) {
            throw err;
          }
          if (attempt === retries) {
            throw err;
          }
          lastError = err;
          continue;
        }

        // Detecta se a requisição foi redirecionada para checkpoint ou tela de login
        if (response.redirected) {
          const redirectUrl = (response.url || '').toLowerCase();
          if (redirectUrl.includes('challenge') || redirectUrl.includes('checkpoint')) {
            throw new Error(
              'O Instagram solicitou uma verificação de segurança (checkpoint). ' +
              'Por favor, abra o Instagram em outra aba e conclua a verificação.'
            );
          }
          if (redirectUrl.includes('login') || redirectUrl.includes('accounts/login')) {
            throw new Error(
              'Sua sessão no Instagram expirou. Por favor, faça login novamente no Instagram.'
            );
          }
        }

        // Verifica Content-Type antes de parsear JSON
        const contentType = (response.headers?.get ? response.headers.get('content-type') : '') || '';
        const isHtmlContentType = contentType.toLowerCase().includes('text/html');

        const rawText = await response.text();
        const trimmed = rawText.trim();

        // Se for página HTML ou se o corpo começar com tag HTML / DOCTYPE
        if (isHtmlContentType || trimmed.startsWith('<')) {
          const lowerText = trimmed.toLowerCase();
          if (lowerText.includes('checkpoint') || lowerText.includes('challenge')) {
            throw new Error(
              'O Instagram solicitou uma verificação de segurança (checkpoint). ' +
              'Por favor, abra o Instagram e complete a confirmação.'
            );
          }
          if (lowerText.includes('login') || lowerText.includes('accounts/login')) {
            throw new Error(
              'Sua sessão no Instagram expirou. Por favor, faça login novamente no Instagram.'
            );
          }
          throw new Error(
            `O Instagram retornou uma página de bloqueio temporário ou limitação ao buscar ${endpoint}. ` +
            'Por favor, aguarde alguns minutos antes de tentar novamente para que o Instagram libere o acesso.'
          );
        }

        let data: any;
        try {
          data = JSON.parse(rawText);
        } catch (parseError: any) {
          throw new Error(`Falha ao decodificar dados da API do Instagram: ${parseError.message}`);
        }

        // Suporte para respostas mockadas de teste (GraphQL em fixtures legadas)
        if (data?.data?.user?.edge_follow) {
          const edgeFollow = data.data.user.edge_follow;
          const users: FriendshipUserRaw[] = edgeFollow.edges.map((e: any) => ({
            pk: e.node.id,
            pk_id: e.node.id,
            username: e.node.username,
            full_name: e.node.full_name || '',
            profile_pic_url: e.node.profile_pic_url || '',
            is_private: Boolean(e.node.is_private),
            is_verified: Boolean(e.node.is_verified),
            follows_viewer: Boolean(e.node.follows_viewer)
          }));

          return {
            users,
            next_max_id: edgeFollow.page_info?.end_cursor || null,
            has_more: Boolean(edgeFollow.page_info?.has_next_page),
            status: 'ok',
            isLegacyGraphQL: true
          };
        }

        const rawUsers: FriendshipUserRaw[] = data.users || [];
        const nextMaxId = data.next_max_id || null;
        const hasMore = Boolean(data.has_more || (nextMaxId && rawUsers.length > 0));
        return {
          users: rawUsers,
          next_max_id: nextMaxId,
          has_more: hasMore,
          status: data.status || 'ok',
          isLegacyGraphQL: false
        };
      } catch (err: any) {
        lastError = err;
        console.warn(`[InstagramApiClient] Tentativa ${attempt + 1}/${retries + 1} para ${endpoint} falhou:`, err);
        if (
          attempt === retries ||
          err?.message?.includes('429') ||
          err?.message?.includes('401') ||
          err?.message?.includes('403') ||
          err?.message?.includes('verificação de segurança') ||
          err?.message?.includes('checkpoint') ||
          err?.message?.includes('sessão') ||
          err?.message?.includes('bloqueio temporário')
        ) {
          throw err;
        }
      }
    }

    throw lastError || new Error(`Falha ao buscar ${endpoint}`);
  }

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
      throw new Error(`Failed to unfollow user: ${response.status} ${response.statusText}. Body: ${errorBody.substring(0, 200)}`);
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

  private _parseFollowersResponse(data: any): FollowersResponse {
    if (data?.data?.user?.edge_follow) {
      const edgeFollow = data.data.user.edge_follow;
      const users = edgeFollow.edges.map((edge: any) => User.fromObject(edge.node));
      return {
        users,
        hasNextPage: edgeFollow.page_info.has_next_page,
        endCursor: edgeFollow.page_info.end_cursor,
        totalCount: edgeFollow.count
      };
    }

    if (Array.isArray(data?.users)) {
      const users = data.users.map((raw: any) => User.fromObject({
        id: String(raw.pk_id ?? raw.pk),
        username: raw.username,
        full_name: raw.full_name,
        profile_pic_url: raw.profile_pic_url,
        is_verified: raw.is_verified,
        is_private: raw.is_private,
        follows_viewer: false
      }));
      return {
        users,
        hasNextPage: Boolean(data.has_more && data.next_max_id),
        endCursor: data.next_max_id || null,
        totalCount: data.users.length
      };
    }

    throw new Error('Invalid API response structure');
  }
}
