// useI18n - React hook for internationalization
// Note: React must be available on window.React
if (!window.React) {
  throw new Error('React must be loaded on window.React before importing useI18n');
}

const { useState, useEffect } = window.React;
import { i18nService } from '../utils/I18nService.js';

/**
 * Hook to use i18n in React components
 * @returns {{ t: Function, locale: string, isReady: boolean }}
 */
export function useI18n() {
  const [isReady, setIsReady] = useState(false);
  const [locale, setLocale] = useState(i18nService.getLocale());

  useEffect(() => {
    let mounted = true;

    // Initialize i18n service
    i18nService.initialize().then(() => {
      if (mounted) {
        setLocale(i18nService.getLocale());
        setIsReady(true);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  /**
   * Translation function
   * @param {string} key - Translation key (supports dot notation)
   * @param {Object} vars - Variables for interpolation
   * @returns {string} Translated string
   */
  const t = (key, vars = {}) => {
    return i18nService.t(key, vars);
  };

  return { t, locale, isReady };
}
