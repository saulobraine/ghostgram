// Popup script - Inicializa os controllers e elementos do popup
import { PopupController } from './src/popup/PopupController.js';
import { QuickSettingsController } from './src/popup/QuickSettingsController.js';

/**
 * Verifica se a aba ativa é do Instagram
 */
async function isOnInstagram(): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = tabs[0]?.url || '';
      resolve(url.startsWith('https://www.instagram.com'));
    });
  });
}

/**
 * Mostra o popup quando NÃO está no Instagram
 */
function showNotOnInstagram(): void {
  const mainToggle = document.querySelector('.popup-main-toggle') as HTMLElement | null;
  const settings = document.querySelector('.popup-settings') as HTMLElement | null;
  if (mainToggle) mainToggle.style.display = 'none';
  if (settings) settings.style.display = 'none';

  const actionsSection = document.getElementById('actionsSection');
  if (!actionsSection) return;
  actionsSection.innerHTML = '';
  actionsSection.className = 'popup-not-instagram';

  const msg = document.createElement('p');
  msg.className = 'popup-not-instagram__msg';
  msg.textContent = 'Acesse o Instagram para usar o GhostGram.';
  actionsSection.appendChild(msg);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'popup-actions__btn popup-actions__btn--primary';
  btn.innerHTML = '<span class="popup-actions__btn-icon">📷</span><span>Ir para o Instagram</span>';
  btn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://www.instagram.com/' });
    window.close();
  });
  actionsSection.appendChild(btn);
}

/**
 * Mostra feedback visual temporário no popup
 */
function showToast(text: string, parent: HTMLElement): void {
  const existing = parent.querySelector('.popup-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'popup-toast';
  toast.textContent = text;
  parent.appendChild(toast);
  setTimeout(() => toast.remove(), 1800);
}

/**
 * Mostra o popup quando ESTÁ no Instagram
 */
async function showOnInstagram(): Promise<void> {
  const actionsSection = document.getElementById('actionsSection');
  if (!actionsSection) return;
  actionsSection.className = 'popup-actions popup-actions--column';
  actionsSection.innerHTML = '';

  // Follow cooldown select
  const cooldownItem = document.createElement('div');
  cooldownItem.className = 'popup-settings__item';
  const cooldownLabel = document.createElement('span');
  cooldownLabel.className = 'popup-settings__item-label';
  cooldownLabel.textContent = 'Ignorar perfis seguidos por';
  cooldownItem.appendChild(cooldownLabel);

  const cooldownSelect = document.createElement('select');
  cooldownSelect.className = 'popup-cooldown-select';
  cooldownSelect.innerHTML = `
    <option value="0">Desativado</option>
    <option value="24">24 horas</option>
    <option value="168">1 semana</option>
    <option value="720">1 mês</option>
  `;
  cooldownItem.appendChild(cooldownSelect);
  actionsSection.appendChild(cooldownItem);

  // Load stored value
  const stored = await chrome.storage.local.get(['ghostgram_follow_cooldown_hours']);
  cooldownSelect.value = String(stored.ghostgram_follow_cooldown_hours || 0);
  cooldownSelect.addEventListener('change', () => {
    chrome.storage.local.set({ ghostgram_follow_cooldown_hours: parseInt(cooldownSelect.value) });
    showToast('✓ Salvo', actionsSection);
  });

  const settingsBtn = document.createElement('button');
  settingsBtn.type = 'button';
  settingsBtn.id = 'openSettings';
  settingsBtn.className = 'popup-actions__btn popup-actions__btn--secondary';
  settingsBtn.innerHTML = '<span class="popup-actions__btn-icon">⚠️</span><span>Configurações Avançadas</span>';
  actionsSection.appendChild(settingsBtn);

  const clearScansBtn = document.createElement('button');
  clearScansBtn.type = 'button';
  clearScansBtn.className = 'popup-actions__btn popup-actions__btn--danger';
  clearScansBtn.innerHTML = '<span class="popup-actions__btn-icon">🗑️</span><span>Limpar Scans</span>';
  clearScansBtn.addEventListener('click', async () => {
    if (confirm('Limpar todo o histórico de scans salvos?')) {
      await chrome.storage.local.set({ ghostgram_scan_history: [] });
      showToast('✓ Scans limpos', actionsSection);
    }
  });
  actionsSection.appendChild(clearScansBtn);
}

document.addEventListener('DOMContentLoaded', async () => {
  const onInstagram = await isOnInstagram();

  if (!onInstagram) {
    showNotOnInstagram();
    return;
  }

  await showOnInstagram();

  // Inicializa o controller principal (toggle de extensão)
  const popupController = new PopupController();
  popupController.initialize({
    mainToggle: document.getElementById('mainToggle') as HTMLInputElement | null,
    statusBadge: document.getElementById('statusBadge') as HTMLElement | null,
    openInstagramBtn: null,
    openSettingsBtn: document.getElementById('openSettings') as HTMLButtonElement | null
  });

  // Inicializa o controller de configurações rápidas
  const quickSettingsController = new QuickSettingsController();
  await quickSettingsController.initialize({
    startExpandedToggle: document.getElementById('startExpandedToggle') as HTMLInputElement | null,
    stealthModeToggle: document.getElementById('stealthModeToggle') as HTMLInputElement | null
  });
});
