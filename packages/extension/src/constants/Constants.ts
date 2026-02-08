// Constants - Remove magic strings and numbers

export const INSTAGRAM_HOSTNAME = 'www.instagram.com' as const;

export const STORAGE_KEYS = {
  ENABLED: 'enabled',
  WHITELISTED_RESULTS: 'iu_whitelisted-results',
  FLOATING_PANEL_EXPANDED: 'floatingPanelExpanded',
  SCAN_STATE: 'scanState',
  // Configurações rápidas do popup
  PANEL_POSITION: 'panelPosition',
  START_EXPANDED: 'startExpanded',
  STEALTH_MODE: 'stealthMode',
  // Posição do painel flutuante (localStorage)
  PANEL_POSITION_STORAGE: 'ghostgram_panel_position',
  // Persistência do estado do scan
  SCAN_PERSISTENCE: 'ghostgram_scan_persistence',
  // Histórico de ações (follow/unfollow)
  ACTIONS_HISTORY: 'ghostgram_actions_history',
  // Histórico de scans concluídos
  SCAN_HISTORY: 'ghostgram_scan_history',
  // Tempo de cooldown para seguir novamente (24h, 1w, 1m, ou 0 para desativado)
  FOLLOW_COOLDOWN_HOURS: 'ghostgram_follow_cooldown_hours'
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

export const PANEL_POSITIONS = {
  TOP_RIGHT: 'top-right'
} as const;

export type PanelPosition = typeof PANEL_POSITIONS[keyof typeof PANEL_POSITIONS];

export const DEFAULT_QUICK_SETTINGS = {
  startExpanded: false,
  stealthMode: false
} as const;

export const MESSAGE_ACTIONS = {
  TOGGLE: 'toggle',
  GET_STATUS: 'getStatus',
  UPDATE_STATUS: 'updateStatus',
  START_SCAN: 'startScan',
  OPEN_HISTORY: 'openHistory'
} as const;

export type MessageAction = typeof MESSAGE_ACTIONS[keyof typeof MESSAGE_ACTIONS];

export const MESSAGE_TYPES = {
  GHOSTGRAM_TO_BACKGROUND: 'GHOSTGRAM_TO_BACKGROUND',
  INSTAGRAM_UNFOLLOWERS_START_SCAN: 'INSTAGRAM_UNFOLLOWERS_START_SCAN'
} as const;

export type MessageType = typeof MESSAGE_TYPES[keyof typeof MESSAGE_TYPES];

export const ACTION_TYPES = {
  FOLLOW: 'follow',
  UNFOLLOW: 'unfollow',
  RE_FOLLOW_ACCEPTED: 'reFollowAccepted',
  RE_FOLLOW_REJECTED: 'reFollowRejected'
} as const;

export type ActionType = typeof ACTION_TYPES[keyof typeof ACTION_TYPES];

export const ACTION_SOURCES = {
  MANUAL: 'manual',
  AUTO: 'auto'
} as const;

export type ActionSource = typeof ACTION_SOURCES[keyof typeof ACTION_SOURCES];

export const SCAN_STATUS = {
  PAUSED: 'paused',
  SCANNING: 'scanning'
} as const;

export type ScanStatusType = typeof SCAN_STATUS[keyof typeof SCAN_STATUS];

export const DEFAULT_SETTINGS = {
  timeBetweenSearchCycles: 1000,
  timeToWaitAfterFiveSearchCycles: 10000,
  timeBetweenUnfollows: 4000,
  timeToWaitAfterFiveUnfollows: 300000,
  successMessageDuration: 3000,
  unfollowersPerPage: 50,
  withoutProfilePictureUrlIds: [
    '44884218_345707102882519_2446069589734326272_n',
    '464760996_1254146839119862_3605321457742435801_n'
  ],
  instagramGraphqlQueryHash: '3dec7e2c57367ef3da3d987d89f9dbc8',
  instagramGraphqlBaseUrl: 'https://www.instagram.com/graphql/query/',
  instagramUnfollowBaseUrl: 'https://www.instagram.com/web/friendships/'
} as const;

export const SETTINGS_KEYS = {
  TIME_BETWEEN_SEARCH_CYCLES: 'timeBetweenSearchCycles',
  TIME_TO_WAIT_AFTER_FIVE_SEARCH_CYCLES: 'timeToWaitAfterFiveSearchCycles',
  TIME_BETWEEN_UNFOLLOWS: 'timeBetweenUnfollows',
  TIME_TO_WAIT_AFTER_FIVE_UNFOLLOWS: 'timeToWaitAfterFiveUnfollows',
  SUCCESS_MESSAGE_DURATION: 'successMessageDuration',
  UNFOLLOWERS_PER_PAGE: 'unfollowersPerPage',
  WITHOUT_PROFILE_PICTURE_URL_IDS: 'withoutProfilePictureUrlIds',
  INSTAGRAM_GRAPHQL_QUERY_HASH: 'instagramGraphqlQueryHash',
  INSTAGRAM_GRAPHQL_BASE_URL: 'instagramGraphqlBaseUrl',
  INSTAGRAM_UNFOLLOW_BASE_URL: 'instagramUnfollowBaseUrl'
} as const;

export type SettingsKey = typeof SETTINGS_KEYS[keyof typeof SETTINGS_KEYS];

export const BUNDLE_SCRIPT_NAME = 'bundle.js' as const;
export const FLOATING_PANEL_APP_SCRIPT_NAME = 'floating-panel-app.js' as const;
export const SUCCESS_MESSAGE_DURATION = 3000 as const;

// Bundle constants
export const UNFOLLOWERS_PER_PAGE = 50 as const;
export const WITHOUT_PROFILE_PICTURE_URL_IDS = [
  '44884218_345707102882519_2446069589734326272_n',
  '464760996_1254146839119862_3605321457742435801_n'
] as const;

export const INSTAGRAM_GRAPHQL_QUERY_HASH = '3dec7e2c57367ef3da3d987d89f9dbc8' as const;
export const INSTAGRAM_GRAPHQL_BASE_URL = 'https://www.instagram.com/graphql/query/' as const;
export const INSTAGRAM_UNFOLLOW_BASE_URL = 'https://www.instagram.com/web/friendships/' as const;
