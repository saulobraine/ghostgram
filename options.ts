// Options script - Refactored with SOLID and Object Calisthenics
import { SettingsFormController } from './src/options/SettingsFormController.js';

document.addEventListener('DOMContentLoaded', async () => {
  const controller = new SettingsFormController();
  controller.initialize(
    document.getElementById('settingsForm') as HTMLFormElement,
    document.getElementById('cancelBtn') as HTMLButtonElement,
    document.getElementById('successMessage') as HTMLElement
  );

  const cooldownSelect = document.getElementById('followCooldownHours') as HTMLSelectElement;
  if (cooldownSelect) {
    const stored = await chrome.storage.local.get(['ghostgram_follow_cooldown_hours']);
    const value = stored.ghostgram_follow_cooldown_hours || '0';
    cooldownSelect.value = String(value);
    cooldownSelect.addEventListener('change', () => {
      chrome.storage.local.set({ ghostgram_follow_cooldown_hours: parseInt(cooldownSelect.value) });
    });
  }
});

