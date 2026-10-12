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

export interface WhitelistItem {
  id: string;
  username: string;
  addedAt: number;
}

export interface DesktopAppSettings {
  unfollowDelayMin: number;
  unfollowDelayMax: number;
  consecutiveUnfollowLimit: number;
  cooldownSeconds: number;
  theme: 'dark' | 'light' | 'system';
}

export interface UserProfile {
  pk: number | string;
  username: string;
  full_name: string;
  profile_pic_url: string;
  follower_count?: number;
  following_count?: number;
  is_private?: boolean;
  is_verified?: boolean;
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

export type UnfollowStatus =
  | 'idle'
  | 'running'
  | 'cooling_down'
  | 'paused'
  | 'completed'
  | 'cancelled'
  | 'error';

export interface UnfollowProgressPayload {
  status: UnfollowStatus;
  currentIndex: number;
  total: number;
  currentUser?: string;
  percentage: number;
  successCount: number;
  failedCount: number;
  cooldownRemainingSeconds?: number;
  message?: string;
}

declare global {
  interface Window {
    ghostgramDesktop: {
      auth: {
        login: () => Promise<{ success: boolean; userId?: string; error?: string }>;
        checkSession: () => Promise<{ isAuthenticated: boolean; userId: string | null; profile: UserProfile | null }>;
        logout: () => Promise<{ success: boolean }>;
      };
      scan: {
        start: () => Promise<ScannedUser[]>;
        pause: () => Promise<{ success: boolean }>;
        resume: () => Promise<{ success: boolean }>;
        cancel: () => Promise<{ success: boolean }>;
        onProgress: (callback: (payload: ScanProgressPayload) => void) => () => void;
      };
      unfollow: {
        start: (targets: { id: string; username: string }[]) => Promise<any[]>;
        pause: () => Promise<{ success: boolean }>;
        resume: () => Promise<{ success: boolean }>;
        cancel: () => Promise<{ success: boolean }>;
        onProgress: (callback: (payload: UnfollowProgressPayload) => void) => () => void;
      };
      storage: {
        getWhitelist: () => Promise<WhitelistItem[]>;
        saveWhitelist: (items: WhitelistItem[]) => Promise<{ success: boolean }>;
        addToWhitelist: (item: { id: string; username: string }) => Promise<WhitelistItem[]>;
        removeFromWhitelist: (idOrUsername: string) => Promise<WhitelistItem[]>;
        getSettings: () => Promise<DesktopAppSettings>;
        saveSettings: (settings: Partial<DesktopAppSettings>) => Promise<DesktopAppSettings>;
        getHistory: () => Promise<any[]>;
        exportCsv: (data: Record<string, any>[]) => Promise<string>;
      };
    };
  }
}
