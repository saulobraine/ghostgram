import { BrowserWindow } from 'electron';
import {
  DesktopInstagramApiClient,
  InstagramFriendshipUser,
} from './DesktopInstagramApiClient';

export interface ScannedUser {
  id: string;
  username: string;
  fullName: string;
  profilePicUrl: string;
  isPrivate: boolean;
  isVerified: boolean;
  followsViewer: boolean;
  scannedAt: number;
}

export type ScanStage = 'idle' | 'following' | 'followers' | 'analyzing' | 'completed' | 'paused' | 'error';

export interface ScanProgressPayload {
  stage: ScanStage;
  percentage: number;
  followingCount: number;
  followersCount: number;
  nonFollowersCount: number;
  message?: string;
}

export class DesktopScanEngine {
  private client: DesktopInstagramApiClient;
  private isScanning = false;
  private isPaused = false;
  private isCancelled = false;

  constructor(client: DesktopInstagramApiClient) {
    this.client = client;
  }

  public getStatus() {
    return {
      isScanning: this.isScanning,
      isPaused: this.isPaused,
      isCancelled: this.isCancelled,
    };
  }

  public pause(): void {
    if (this.isScanning) {
      this.isPaused = true;
    }
  }

  public resume(): void {
    if (this.isScanning) {
      this.isPaused = false;
    }
  }

  public cancel(): void {
    this.isCancelled = true;
    this.isPaused = false;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async checkPauseOrCancel(): Promise<void> {
    while (this.isPaused && !this.isCancelled) {
      await this.sleep(400);
    }
    if (this.isCancelled) {
      throw new Error('SCAN_CANCELLED');
    }
  }

  private emitProgress(window: BrowserWindow | null, payload: ScanProgressPayload): void {
    if (window && !window.isDestroyed()) {
      window.webContents.send('scan:progress', payload);
    }
  }

  public async runScan(
    userId: string,
    window: BrowserWindow | null
  ): Promise<ScannedUser[]> {
    if (this.isScanning) {
      throw new Error('Escaneamento já está em andamento');
    }

    this.isScanning = true;
    this.isPaused = false;
    this.isCancelled = false;

    const followingUsers: InstagramFriendshipUser[] = [];
    const followerIds = new Set<string>();
    const followerUsernames = new Set<string>();

    try {
      this.emitProgress(window, {
        stage: 'following',
        percentage: 0,
        followingCount: 0,
        followersCount: 0,
        nonFollowersCount: 0,
        message: 'Iniciando coleta de perfis seguidos...',
      });

      // FASE 1: Coleta de Following (0% a 45%)
      let followingCursor: string | undefined = undefined;
      let followingPage = 0;

      do {
        await this.checkPauseOrCancel();

        const res = await this.client.fetchFriendshipsPage('following', userId, followingCursor);
        if (res.users && res.users.length > 0) {
          followingUsers.push(...res.users);
        }

        followingCursor = res.next_max_id;
        followingPage++;

        const pct = Math.min(45, Math.round((followingUsers.length / (followingUsers.length + 100)) * 45));
        this.emitProgress(window, {
          stage: 'following',
          percentage: pct,
          followingCount: followingUsers.length,
          followersCount: 0,
          nonFollowersCount: 0,
          message: `Seguidos coletados: ${followingUsers.length}...`,
        });

        if (!followingCursor || followingPage >= 60 || !res.users || res.users.length === 0) {
          break;
        }

        // Anti-ban jitter
        const delay = Math.floor(Math.random() * 800) + 700; // 700-1500ms
        await this.sleep(delay);

        // Pausa preventiva a cada 5 páginas
        if (followingPage % 5 === 0) {
          await this.sleep(4000);
        }
      } while (followingCursor);

      // FASE 2: Coleta de Followers (45% a 95%)
      this.emitProgress(window, {
        stage: 'followers',
        percentage: 45,
        followingCount: followingUsers.length,
        followersCount: 0,
        nonFollowersCount: 0,
        message: 'Coletando lista de seguidores para cruzamento...',
      });

      let followerCursor: string | undefined = undefined;
      let followerPage = 0;

      do {
        await this.checkPauseOrCancel();

        const res = await this.client.fetchFriendshipsPage('followers', userId, followerCursor);
        if (res.users && res.users.length > 0) {
          for (const u of res.users) {
            const id = String(u.pk_id || u.pk || u.id || '').trim();
            if (id) followerIds.add(id);
            if (u.username) followerUsernames.add(u.username.toLowerCase().trim());
          }
        }

        followerCursor = res.next_max_id;
        followerPage++;

        const totalFollowersCount = followerUsernames.size || followerIds.size;
        const progressInStage = Math.min(50, Math.round((totalFollowersCount / (totalFollowersCount + 150)) * 50));
        this.emitProgress(window, {
          stage: 'followers',
          percentage: 45 + progressInStage,
          followingCount: followingUsers.length,
          followersCount: totalFollowersCount,
          nonFollowersCount: 0,
          message: `Seguidores catalogados: ${totalFollowersCount}...`,
        });

        if (!followerCursor || followerPage >= 250 || !res.users || res.users.length === 0) {
          break;
        }

        const delay = Math.floor(Math.random() * 800) + 700;
        await this.sleep(delay);

        if (followerPage % 5 === 0) {
          await this.sleep(4000);
        }
      } while (followerCursor);

      // FASE 3: Análise e cruzamento de não-seguidores (95% a 100%)
      this.emitProgress(window, {
        stage: 'analyzing',
        percentage: 95,
        followingCount: followingUsers.length,
        followersCount: followerUsernames.size || followerIds.size,
        nonFollowersCount: 0,
        message: 'Calculando não-seguidores...',
      });

      const now = Date.now();
      const results: ScannedUser[] = followingUsers.map((user) => {
        const id = String(user.pk_id || user.pk || user.id || '').trim();
        const usernameLower = (user.username || '').toLowerCase().trim();
        const followsViewer =
          (id ? followerIds.has(id) : false) ||
          (usernameLower ? followerUsernames.has(usernameLower) : false);

        return {
          id,
          username: user.username,
          fullName: user.full_name || '',
          profilePicUrl: user.profile_pic_url || '',
          isPrivate: Boolean(user.is_private),
          isVerified: Boolean(user.is_verified),
          followsViewer,
          scannedAt: now,
        };
      });

      const nonFollowers = results.filter((u) => !u.followsViewer);

      this.emitProgress(window, {
        stage: 'completed',
        percentage: 100,
        followingCount: followingUsers.length,
        followersCount: followerIds.size,
        nonFollowersCount: nonFollowers.length,
        message: `Escaneamento concluído! ${nonFollowers.length} não-seguidores identificados.`,
      });

      return results;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (errorMsg === 'SCAN_CANCELLED') {
        this.emitProgress(window, {
          stage: 'idle',
          percentage: 0,
          followingCount: followingUsers.length,
          followersCount: followerIds.size,
          nonFollowersCount: 0,
          message: 'Escaneamento cancelado pelo usuário.',
        });
        return [];
      }

      this.emitProgress(window, {
        stage: 'error',
        percentage: 0,
        followingCount: followingUsers.length,
        followersCount: followerIds.size,
        nonFollowersCount: 0,
        message: `Erro durante escaneamento: ${errorMsg}`,
      });
      throw err;
    } finally {
      this.isScanning = false;
      this.isPaused = false;
      this.isCancelled = false;
    }
  }
}
