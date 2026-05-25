// Environment configuration for local development
// This file should be used when running the extension locally
// against a local API instance

// API Configuration
export const API_CONFIG = {
  // Local API URL
  baseUrl: 'http://localhost:3001',

  // API endpoints
  endpoints: {
    login: '/auth/login',
    logout: '/auth/logout',
    scan: '/scans',
    history: '/history',
    whitelist: '/whitelist',
    users: '/users',
    billing: '/billing',
    health: '/health'
  },

  // API timeout in milliseconds
  timeout: 10000,

  // Retry configuration
  retry: {
    maxAttempts: 3,
    delay: 1000
  }
};

// Extension Configuration
export const EXTENSION_CONFIG = {
  // Development mode flag
  isDevelopment: true,

  // Local API flag
  useLocalApi: true,

  // Debug mode
  debug: true,

  // Logging level
  logLevel: 'debug' as 'debug' | 'info' | 'warn' | 'error',

  // Feature flags
  features: {
    // Enable local API calls
    localApi: true,

    // Enable development tools
    devTools: true,

    // Enable debug logging
    debugLogging: true
  }
};

// Instagram Configuration
export const INSTAGRAM_CONFIG = {
  // Instagram API URLs (these are the actual URLs)
  graphqlBaseUrl: 'https://www.instagram.com/graphql/query/',
  unfollowBaseUrl: 'https://www.instagram.com/web/friendships/',

  // Timeout for Instagram API calls
  timeout: 15000,

  // Rate limiting
  rateLimit: {
    maxRequestsPerMinute: 60,
    retryDelay: 2000
  }
};

// Storage Configuration
export const STORAGE_CONFIG = {
  // Storage keys
  keys: {
    settings: 'ghostgram_settings',
    scanState: 'ghostgram_scan_state',
    whitelist: 'ghostgram_whitelist',
    history: 'ghostgram_history',
    users: 'ghostgram_users'
  },

  // Storage timeout
  timeout: 5000
};

// Export for use in the extension
export const LOCAL_CONFIG = {
  ...API_CONFIG,
  ...EXTENSION_CONFIG,
  ...INSTAGRAM_CONFIG,
  ...STORAGE_CONFIG
};