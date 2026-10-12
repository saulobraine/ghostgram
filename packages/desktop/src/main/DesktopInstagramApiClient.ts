import { net, session } from 'electron';

export const INSTAGRAM_WEB_APP_ID = '936619743392459';

export interface InstagramFriendshipUser {
  pk: number | string;
  pk_id?: string;
  id?: string;
  username: string;
  full_name: string;
  is_private: boolean;
  profile_pic_url: string;
  is_verified: boolean;
  has_anonymous_profile_picture?: boolean;
}

export interface InstagramFriendshipsResponse {
  users: InstagramFriendshipUser[];
  big_list?: boolean;
  page_size?: number;
  next_max_id?: string;
  has_more?: boolean;
  status: string;
}

export interface InstagramUserProfile {
  pk: number | string;
  username: string;
  full_name: string;
  profile_pic_url: string;
  follower_count?: number;
  following_count?: number;
  is_private?: boolean;
  is_verified?: boolean;
}

export class DesktopInstagramApiClient {
  private readonly partition: string;

  constructor(partition = 'persist:instagram') {
    this.partition = partition;
  }

  private async getCookieHeader(): Promise<string> {
    const ses = session.fromPartition(this.partition);
    const cookies = await ses.cookies.get({ domain: '.instagram.com' });
    return cookies.map((c) => `${c.name}=${c.value}`).join('; ');
  }

  public async fetchFriendshipsPage(
    endpoint: 'following' | 'followers',
    userId: string,
    maxId?: string,
    count = 50
  ): Promise<InstagramFriendshipsResponse> {
    const cookieHeader = await this.getCookieHeader();
    const baseUrl = `https://www.instagram.com/api/v1/friendships/${userId}/${endpoint}/?count=${count}`;
    const url = maxId ? `${baseUrl}&max_id=${encodeURIComponent(maxId)}` : baseUrl;

    const headers: Record<string, string> = {
      'X-IG-App-ID': INSTAGRAM_WEB_APP_ID,
      'X-Requested-With': 'XMLHttpRequest',
      'Accept': 'application/json, text/plain, */*',
      'Referer': 'https://www.instagram.com/',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    };

    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }

    const response = await net.fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Erro HTTP ${response.status} ao buscar ${endpoint}: ${errorText}`);
    }

    const rawText = typeof response.text === 'function' ? await response.text() : null;
    if (rawText) {
      const trimmed = rawText.trim();
      if (trimmed.startsWith('<')) {
        const lower = trimmed.toLowerCase();
        if (lower.includes('checkpoint') || lower.includes('challenge')) {
          throw new Error('O Instagram solicitou uma verificação de segurança (checkpoint). Por favor, abra o Instagram e complete a verificação.');
        }
        if (lower.includes('login')) {
          throw new Error('Sua sessão no Instagram expirou. Por favor, faça login novamente no Instagram.');
        }
        throw new Error(`O Instagram retornou uma página de bloqueio temporário ou limitação ao buscar ${endpoint}.`);
      }

      try {
        return JSON.parse(rawText) as InstagramFriendshipsResponse;
      } catch (parseErr: any) {
        throw new Error(`Falha ao decodificar dados da API do Instagram (${parseErr.message})`);
      }
    }

    return (await response.json()) as InstagramFriendshipsResponse;
  }

  public async unfollowUser(targetUserId: string, csrftoken: string): Promise<{ status: string }> {
    const cookieHeader = await this.getCookieHeader();
    const url = `https://www.instagram.com/web/friendships/${targetUserId}/unfollow/`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-CSRFToken': csrftoken,
      'X-IG-App-ID': INSTAGRAM_WEB_APP_ID,
      'X-Requested-With': 'XMLHttpRequest',
      'Origin': 'https://www.instagram.com',
      'Referer': 'https://www.instagram.com/',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    };

    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }

    const response = await net.fetch(url, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Erro HTTP ${response.status} ao deixar de seguir ${targetUserId}: ${errorText}`);
    }

    return (await response.json()) as { status: string };
  }

  public async getUserInfo(userId: string): Promise<InstagramUserProfile> {
    const cookieHeader = await this.getCookieHeader();
    const url = `https://www.instagram.com/api/v1/users/${userId}/info/`;

    const headers: Record<string, string> = {
      'X-IG-App-ID': INSTAGRAM_WEB_APP_ID,
      'X-Requested-With': 'XMLHttpRequest',
      'Accept': '*/*',
      'Referer': 'https://www.instagram.com/',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    };

    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }

    const response = await net.fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Erro HTTP ${response.status} ao obter perfil ${userId}: ${errorText}`);
    }

    const data = (await response.json()) as { user: InstagramUserProfile };
    return data.user;
  }
}
