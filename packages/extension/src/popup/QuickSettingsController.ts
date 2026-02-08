// QuickSettingsController - Gerencia configurações rápidas do popup
import { LocalStorageAdapter } from '../storage/LocalStorageAdapter.js';
import { STORAGE_KEYS, DEFAULT_QUICK_SETTINGS } from '../constants/Constants.js';

interface QuickSettingsElements {
  startExpandedToggle: HTMLInputElement | null;
  stealthModeToggle: HTMLInputElement | null;
}

export class QuickSettingsController {
  private _storage: LocalStorageAdapter;
  private _elements: QuickSettingsElements;

  constructor() {
    this._storage = new LocalStorageAdapter();
    this._elements = {
      startExpandedToggle: null,
      stealthModeToggle: null
    };
  }

  async initialize(elements: QuickSettingsElements): Promise<void> {
    this._elements = elements;
    await this._loadSettings();
    this._setupEventListeners();
  }

  private async _loadSettings(): Promise<void> {
    const startExpanded = await this._storage.get(STORAGE_KEYS.START_EXPANDED) || DEFAULT_QUICK_SETTINGS.startExpanded;
    const stealthMode = await this._storage.get(STORAGE_KEYS.STEALTH_MODE) || DEFAULT_QUICK_SETTINGS.stealthMode;

    if (this._elements.startExpandedToggle) {
      this._elements.startExpandedToggle.checked = startExpanded as boolean;
    }
    if (this._elements.stealthModeToggle) {
      this._elements.stealthModeToggle.checked = stealthMode as boolean;
    }
  }

  private _setupEventListeners(): void {
    this._setupStartExpandedToggle();
    this._setupStealthModeToggle();
  }

  private _setupStartExpandedToggle(): void {
    if (!this._elements.startExpandedToggle) return;
    this._elements.startExpandedToggle.addEventListener('change', async () => {
      const value = this._elements.startExpandedToggle!.checked;
      await this._storage.set(STORAGE_KEYS.START_EXPANDED, value);
      await this._notifyContentScript('settingsChanged', { startExpanded: value });
      this._showFeedback(this._elements.startExpandedToggle!);
    });
  }

  private _setupStealthModeToggle(): void {
    if (!this._elements.stealthModeToggle) return;
    this._elements.stealthModeToggle.addEventListener('change', async () => {
      const value = this._elements.stealthModeToggle!.checked;
      await this._storage.set(STORAGE_KEYS.STEALTH_MODE, value);
      await this._notifyContentScript('settingsChanged', { stealthMode: value });
      this._showFeedback(this._elements.stealthModeToggle!);
    });
  }

  private _showFeedback(toggle: HTMLInputElement): void {
    const item = toggle.closest('.popup-settings__item');
    if (!item) return;
    const existing = item.querySelector('.popup-toggle-feedback');
    if (existing) existing.remove();
    const fb = document.createElement('span');
    fb.className = 'popup-toggle-feedback';
    fb.textContent = '✓';
    item.appendChild(fb);
    setTimeout(() => fb.remove(), 1200);
  }

  private async _notifyContentScript(action: string, data: Record<string, unknown>): Promise<void> {
    try {
      const tabs = await this._getInstagramTabs();
      for (const tab of tabs) {
        try {
          if (tab.id !== undefined) {
            await chrome.tabs.sendMessage(tab.id, { action, data });
          }
        } catch (_error) {
          console.log('Não foi possível notificar aba:', tab.id);
        }
      }
    } catch (_error) {
      console.error('Erro ao notificar content scripts:', _error);
    }
  }

  private _getInstagramTabs(): Promise<chrome.tabs.Tab[]> {
    return new Promise(resolve => {
      chrome.tabs.query({ url: 'https://www.instagram.com/*' }, resolve);
    });
  }
}
