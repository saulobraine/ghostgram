// I18nService - Internationalization service with browser language detection
class I18nService {
  constructor() {
    this._translations = {};
    this._currentLocale = null;
    this._loadPromise = null;
  }

  /**
   * Detects browser language and maps to supported locales
   * @returns {string} Locale code (pt-BR or en-US)
   */
  _detectLocale() {
    const browserLang = navigator.language || navigator.languages?.[0] || 'en-US';

    // Check if browser language starts with 'pt' (pt-BR, pt-PT, etc.)
    if (browserLang.toLowerCase().startsWith('pt')) {
      return 'pt-BR';
    }

    // Default to English
    return 'en-US';
  }

  /**
   * Loads translation file for the given locale
   * @param {string} locale - Locale code (pt-BR or en-US)
   * @returns {Promise<Object>} Translation object
   */
  async _loadTranslations(locale) {
    try {
      const response = await fetch(chrome.runtime.getURL(`src/bundle/locales/${locale}.json`));
      if (!response.ok) {
        throw new Error(`Failed to load translations for ${locale}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`[I18nService] Error loading translations for ${locale}:`, error);
      // Fallback to English if current locale fails
      if (locale !== 'en-US') {
        return this._loadTranslations('en-US');
      }
      // If English also fails, return empty object
      return {};
    }
  }

  /**
   * Initializes the i18n service
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this._loadPromise) {
      return this._loadPromise;
    }

    this._loadPromise = (async () => {
      this._currentLocale = this._detectLocale();
      console.log('[I18nService] Detected locale:', this._currentLocale);

      this._translations = await this._loadTranslations(this._currentLocale);
      console.log('[I18nService] Translations loaded:', Object.keys(this._translations));
    })();

    return this._loadPromise;
  }

  /**
   * Gets the current locale
   * @returns {string} Current locale code
   */
  getLocale() {
    return this._currentLocale || this._detectLocale();
  }

  /**
   * Translates a key with optional variable interpolation
   * @param {string} key - Translation key (supports dot notation, e.g., 'floatingPanel.title')
   * @param {Object} vars - Variables for interpolation
   * @returns {string} Translated string
   */
  t(key, vars = {}) {
    // Ensure translations are loaded
    if (!this._translations || Object.keys(this._translations).length === 0) {
      console.warn('[I18nService] Translations not loaded yet, returning key:', key);
      return key;
    }

    // Navigate through nested object using dot notation
    const keys = key.split('.');
    let value = this._translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Key not found, return the key itself
        console.warn(`[I18nService] Translation key not found: ${key}`);
        return key;
      }
    }

    // If value is not a string, return the key
    if (typeof value !== 'string') {
      console.warn(`[I18nService] Translation value is not a string for key: ${key}`);
      return key;
    }

    // Interpolate variables
    let result = value;
    for (const [varKey, varValue] of Object.entries(vars)) {
      const regex = new RegExp(`{{\\s*${varKey}\\s*}}`, 'g');
      result = result.replace(regex, String(varValue));
    }

    return result;
  }

  /**
   * Checks if a translation key exists
   * @param {string} key - Translation key
   * @returns {boolean} True if key exists
   */
  hasKey(key) {
    const keys = key.split('.');
    let value = this._translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return false;
      }
    }

    return typeof value === 'string';
  }
}

// Export singleton instance
export const i18nService = new I18nService();
