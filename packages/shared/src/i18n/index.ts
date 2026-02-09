/**
 * i18n system for GhostGram
 * Supports pt-BR and en
 */

import ptBR from './pt-BR.json';
import en from './en.json';

export type Locale = 'pt-BR' | 'en';
export type TranslationKeys = typeof ptBR;

const translations: Record<Locale, TranslationKeys> = {
  'pt-BR': ptBR,
  'en': en
};

let currentLocale: Locale = 'pt-BR';

/**
 * Set the current locale
 */
export function setLocale(locale: Locale): void {
  if (!translations[locale]) {
    throw new Error(`Locale ${locale} not supported`);
  }
  currentLocale = locale;
}

/**
 * Get the current locale
 */
export function getLocale(): Locale {
  return currentLocale;
}

/**
 * Get a translation by key path
 * Example: t('auth.login') -> 'Entrar' (pt-BR) or 'Login' (en)
 */
export function t(keyPath: string, locale?: Locale): string {
  const activeLocale = locale || currentLocale;
  const keys = keyPath.split('.');
  let value: any = translations[activeLocale];
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      console.warn(`Translation key not found: ${keyPath} for locale ${activeLocale}`);
      return keyPath;
    }
  }
  
  return typeof value === 'string' ? value : keyPath;
}

/**
 * Get all translations for a section
 * Example: tSection('auth') -> { login: 'Entrar', register: 'Cadastrar', ... }
 */
export function tSection<K extends keyof TranslationKeys>(
  section: K,
  locale?: Locale
): TranslationKeys[K] {
  const activeLocale = locale || currentLocale;
  return translations[activeLocale][section];
}

/**
 * Check if a translation key exists
 */
export function hasTranslation(keyPath: string, locale?: Locale): boolean {
  const activeLocale = locale || currentLocale;
  const keys = keyPath.split('.');
  let value: any = translations[activeLocale];
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return false;
    }
  }
  
  return typeof value === 'string';
}

/**
 * Detect browser locale and set it if supported
 */
export function detectAndSetLocale(): Locale {
  if (typeof navigator !== 'undefined') {
    const browserLocale = navigator.language;
    
    if (browserLocale.startsWith('pt')) {
      setLocale('pt-BR');
      return 'pt-BR';
    }
  }
  
  setLocale('en');
  return 'en';
}

// Export types for type-safe translation keys
export type CommonKeys = keyof TranslationKeys['common'];
export type AuthKeys = keyof TranslationKeys['auth'];
export type ScanKeys = keyof TranslationKeys['scan'];
export type UnfollowKeys = keyof TranslationKeys['unfollow'];
export type WhitelistKeys = keyof TranslationKeys['whitelist'];
export type HistoryKeys = keyof TranslationKeys['history'];
export type SettingsKeys = keyof TranslationKeys['settings'];
export type PlanKeys = keyof TranslationKeys['plan'];
export type ErrorKeys = keyof TranslationKeys['errors'];
