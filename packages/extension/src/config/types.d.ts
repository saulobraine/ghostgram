// Type definitions for GhostGram Extension
// This file provides type definitions for the global configuration

interface GhostGramConfig {
  development: boolean;
  localApi: boolean;
  debug: boolean;
  devTools: boolean;
  debugLogging: boolean;
  api: {
    baseUrl: string;
    endpoints: {
      login: string;
      logout: string;
      scan: string;
      history: string;
      whitelist: string;
      users: string;
      billing: string;
      health: string;
    };
  };
  timeouts: {
    api: number;
    instagram: number;
    storage: number;
  };
  retry: {
    maxAttempts: number;
    delay: number;
    backoff: number;
  };
  logging: {
    level: string;
    enabled: boolean;
  };
}

// Extend the Window interface to include ghostgramConfig
declare global {
  interface Window {
    ghostgramConfig?: GhostGramConfig;
  }
}

// Default export
export default GhostGramConfig;
export const { api, timeouts, retry, logging } = window.ghostgramConfig || {};

// Runtime check for development mode
export const isDevelopment = () => {
  return window.ghostgramConfig?.development === true;
};

export const isLocalApi = () => {
  return window.ghostgramConfig?.localApi === true;
};