// FloatingPanelProps - Tipos para props do FloatingPanel
import type { User } from '../domain/User.js';
import type { UnfollowLogEntry } from '../domain/UnfollowLogEntry.js';

export interface ScanHistoryItem {
  id: string;
  date: string | number | Date;
  nonFollowersCount: number;
}

export interface FloatingPanelProps {
  isExpanded: boolean;
  isScanning: boolean;
  isPaused: boolean;
  isScanCompleted: boolean;
  isUnfollowing: boolean;
  scanProgress: number;
  unfollowProgress: number;
  nonFollowers: User[];
  selectedUsers: Set<string>;
  whitelist: Set<string>;
  activeTab: 'nonFollowers' | 'whitelist';
  searchQuery: string;
  unfollowLog: UnfollowLogEntry[];
  scanHistory?: ScanHistoryItem[];
  onToggle: () => void;
  onStartScan: () => void;
  onTogglePause: () => void;
  onCancelScan: () => void;
  onStartUnfollow: () => void;
  onToggleUser: (userId: string) => void;
  onToggleAll: (selectAll: boolean) => void;
  onToggleWhitelist: (userId: string) => void;
  onChangeTab: (tab: 'nonFollowers' | 'whitelist') => void;
  onSearch: (query: string) => void;
  onOpenHistory: () => void;
  onLoadPreviousScan?: (scanId: string) => void;
}
