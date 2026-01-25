// Popup script - Inicializa os controllers e elementos do popup
import { PopupController } from './src/popup/PopupController.js';
import { QuickSettingsController } from './src/popup/QuickSettingsController.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Inicializa o controller principal (toggle de extensão)
  const popupController = new PopupController();
  popupController.initialize({
    mainToggle: document.getElementById('mainToggle'),
    statusBadge: document.getElementById('statusBadge'),
    openInstagramBtn: document.getElementById('openInstagram'),
    openSettingsBtn: document.getElementById('openSettings')
  });

  // Inicializa o controller de configurações rápidas
  const quickSettingsController = new QuickSettingsController();
  await quickSettingsController.initialize({
    positionSelect: document.getElementById('positionSelect'),
    positionSelectBtn: document.getElementById('positionSelectBtn'),
    positionSelectLabel: document.getElementById('positionSelectLabel'),
    positionSelectMenu: document.getElementById('positionSelectMenu'),
    startExpandedToggle: document.getElementById('startExpandedToggle'),
    stealthModeToggle: document.getElementById('stealthModeToggle')
  });
});
