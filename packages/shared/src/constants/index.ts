/**
 * Shared constants for GhostGram
 */

export const INSTAGRAM_HOSTNAME = 'www.instagram.com' as const;

export const STORAGE_KEYS = {
  ENABLED: 'enabled',
  WHITELISTED_RESULTS: 'iu_whitelisted-results',
  FLOATING_PANEL_EXPANDED: 'floatingPanelExpanded',
  SCAN_STATE: 'scanState',
  PANEL_POSITION: 'panelPosition',
  START_EXPANDED: 'startExpanded',
  STEALTH_MODE: 'stealthMode',
  PANEL_POSITION_STORAGE: 'ghostgram_panel_position',
  SCAN_PERSISTENCE: 'ghostgram_scan_persistence',
  ACTIONS_HISTORY: 'ghostgram_actions_history',
  SCAN_HISTORY: 'ghostgram_scan_history',
  FOLLOW_COOLDOWN_HOURS: 'ghostgram_follow_cooldown_hours'
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

export const ACTION_TYPES = {
  FOLLOW: 'follow',
  UNFOLLOW: 'unfollow',
  SCAN: 'scan'
} as const;

export type ActionType = typeof ACTION_TYPES[keyof typeof ACTION_TYPES];

/**
 * Plan limits for Free and Premium users
 */
export const PLAN_LIMITS = {
  FREE: {
    SCANS_PER_DAY: 3,
    UNFOLLOW_PER_SESSION: 10,
    HISTORY_RETENTION_DAYS: 7,
    MAX_WHITELIST: 10,
    MAX_INSTAGRAM_ACCOUNTS: 1
  },
  PREMIUM: {
    SCANS_PER_DAY: Infinity,
    UNFOLLOW_PER_SESSION: Infinity,
    HISTORY_RETENTION_DAYS: Infinity,
    MAX_WHITELIST: Infinity,
    MAX_INSTAGRAM_ACCOUNTS: 5
  }
} as const;

export enum Plan {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM'
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  PAST_DUE = 'PAST_DUE'
}
