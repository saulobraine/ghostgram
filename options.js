// Options script - Refactored with SOLID and Object Calisthenics
import { SettingsFormController } from './src/options/SettingsFormController.js';

document.addEventListener('DOMContentLoaded', () => {
  const controller = new SettingsFormController();
  controller.initialize(
    document.getElementById('settingsForm'),
    document.getElementById('cancelBtn'),
    document.getElementById('successMessage')
  );
});
