// Popup script - Refactored with SOLID and Object Calisthenics
import { PopupController } from './src/popup/PopupController.js';

document.addEventListener('DOMContentLoaded', () => {
  const controller = new PopupController();
  controller.initialize(
    document.getElementById('status'),
    document.getElementById('toggleBtn'),
    document.getElementById('startScanBtn'),
    document.getElementById('optionsBtn'),
    document.getElementById('openOptions')
  );
});
