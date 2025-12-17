// Options script - Refactored with SOLID and Object Calisthenics
import { SettingsFormController } from './src/options/SettingsFormController.js';
import { i18nService } from './src/bundle/utils/I18nService.js';

/**
 * Apply translations to elements with data-i18n attribute
 */
function applyTranslations() {
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(element => {
    const key = element.getAttribute('data-i18n');
    const translation = i18nService.t(key);
    if (translation && translation !== key) {
      // Handle title tag separately
      if (element.tagName === 'TITLE') {
        element.textContent = translation;
      } else {
        element.textContent = translation;
      }
    }
  });

  // Handle placeholder translations
  const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
  placeholderElements.forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    const translation = i18nService.t(key);
    if (translation && translation !== key) {
      element.placeholder = translation;
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize i18n service
  await i18nService.initialize();

  // Apply translations
  applyTranslations();

  // Initialize settings form controller
  const controller = new SettingsFormController();
  controller.initialize(
    document.getElementById('settingsForm'),
    document.getElementById('cancelBtn'),
    document.getElementById('successMessage')
  );
});
