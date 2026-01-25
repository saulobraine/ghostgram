// Constants - Remove magic strings and numbers
export const INSTAGRAM_HOSTNAME = 'www.instagram.com';
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
  ACTIONS_HISTORY: 'ghostgram_actions_history'
};

export const PANEL_POSITIONS = {
  TOP_RIGHT: 'top-right',
  TOP_LEFT: 'top-left',
  BOTTOM_RIGHT: 'bottom-right',
  BOTTOM_LEFT: 'bottom-left'
};

export const DEFAULT_QUICK_SETTINGS = {
  panelPosition: 'bottom-right',
  startExpanded: false,
  stealthMode: false
};

export const MESSAGE_ACTIONS = {
  TOGGLE: 'toggle',
  GET_STATUS: 'getStatus',
  UPDATE_STATUS: 'updateStatus',
  START_SCAN: 'startScan',
  OPEN_HISTORY: 'openHistory'
};

export const MESSAGE_TYPES = {
  GHOSTGRAM_TO_BACKGROUND: 'GHOSTGRAM_TO_BACKGROUND',
  INSTAGRAM_UNFOLLOWERS_START_SCAN: 'INSTAGRAM_UNFOLLOWERS_START_SCAN'
};

export const ACTION_TYPES = {
  FOLLOW: 'follow',
  UNFOLLOW: 'unfollow'
};

export const ACTION_SOURCES = {
  MANUAL: 'manual',
  AUTO: 'auto'
};

export const SCAN_STATUS = {
  PAUSED: 'paused',
  SCANNING: 'scanning'
};

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
};

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
};

export const BUNDLE_SCRIPT_NAME = 'bundle.js';
export const FLOATING_PANEL_APP_SCRIPT_NAME = 'floating-panel-app.js';
export const SUCCESS_MESSAGE_DURATION = 3000;

// Bundle constants
export const UNFOLLOWERS_PER_PAGE = 50;
export const WITHOUT_PROFILE_PICTURE_URL_IDS = [
  '44884218_345707102882519_2446069589734326272_n',
  '464760996_1254146839119862_3605321457742435801_n'
];
export const INSTAGRAM_GRAPHQL_QUERY_HASH = '3dec7e2c57367ef3da3d987d89f9dbc8';
export const INSTAGRAM_GRAPHQL_BASE_URL = 'https://www.instagram.com/graphql/query/';
export const INSTAGRAM_UNFOLLOW_BASE_URL = 'https://www.instagram.com/web/friendships/';

