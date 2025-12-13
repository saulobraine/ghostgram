// Constants - Remove magic strings and numbers
export const INSTAGRAM_HOSTNAME = 'www.instagram.com';
export const STORAGE_KEYS = {
  ENABLED: 'enabled',
  WHITELISTED_RESULTS: 'iu_whitelisted-results'
};

export const MESSAGE_ACTIONS = {
  TOGGLE: 'toggle',
  GET_STATUS: 'getStatus',
  UPDATE_STATUS: 'updateStatus',
  START_SCAN: 'startScan'
};

export const DEFAULT_SETTINGS = {
  timeBetweenSearchCycles: 1000,
  timeToWaitAfterFiveSearchCycles: 10000,
  timeBetweenUnfollows: 4000,
  timeToWaitAfterFiveUnfollows: 300000
};

export const SETTINGS_KEYS = {
  TIME_BETWEEN_SEARCH_CYCLES: 'timeBetweenSearchCycles',
  TIME_TO_WAIT_AFTER_FIVE_SEARCH_CYCLES: 'timeToWaitAfterFiveSearchCycles',
  TIME_BETWEEN_UNFOLLOWS: 'timeBetweenUnfollows',
  TIME_TO_WAIT_AFTER_FIVE_UNFOLLOWS: 'timeToWaitAfterFiveUnfollows'
};

export const BUNDLE_SCRIPT_NAME = 'bundle.js';
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

