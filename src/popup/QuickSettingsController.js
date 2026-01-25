// QuickSettingsController - Gerencia configurações rápidas do popup
import { LocalStorageAdapter } from '../storage/LocalStorageAdapter.js';
import { STORAGE_KEYS, DEFAULT_QUICK_SETTINGS, PANEL_POSITIONS } from '../constants/Constants.js';

const POSITION_LABELS = {
  'top-left': 'Superior Esquerdo',
  'top-right': 'Superior Direito',
  'bottom-right': 'Inferior Direito',
  'bottom-left': 'Inferior Esquerdo'
};

export class QuickSettingsController {
  constructor() {
    this._storage = new LocalStorageAdapter();
    this._elements = {};
    this._isSelectOpen = false;
  }

  async initialize(elements) {
    this._elements = elements;
    await this._loadSettings();
    this._setupEventListeners();
  }

  async _loadSettings() {
    const panelPosition = await this._storage.get(STORAGE_KEYS.PANEL_POSITION) || DEFAULT_QUICK_SETTINGS.panelPosition;
    const startExpanded = await this._storage.get(STORAGE_KEYS.START_EXPANDED) || DEFAULT_QUICK_SETTINGS.startExpanded;
    const stealthMode = await this._storage.get(STORAGE_KEYS.STEALTH_MODE) || DEFAULT_QUICK_SETTINGS.stealthMode;

    this._updatePositionUI(panelPosition);
    this._elements.startExpandedToggle.checked = startExpanded;
    this._elements.stealthModeToggle.checked = stealthMode;
  }

  _setupEventListeners() {
    this._setupPositionSelect();
    this._setupStartExpandedToggle();
    this._setupStealthModeToggle();
    this._setupClickOutside();
  }

  _setupPositionSelect() {
    this._elements.positionSelectBtn.addEventListener('click', () => this._toggleSelect());

    const options = this._elements.positionSelectMenu.querySelectorAll('.popup-select__option');
    options.forEach(option => {
      option.addEventListener('click', () => this._handlePositionChange(option));
    });
  }

  _setupStartExpandedToggle() {
    this._elements.startExpandedToggle.addEventListener('change', async () => {
      const value = this._elements.startExpandedToggle.checked;
      await this._storage.set(STORAGE_KEYS.START_EXPANDED, value);
      await this._notifyContentScript('settingsChanged', { startExpanded: value });
    });
  }

  _setupStealthModeToggle() {
    this._elements.stealthModeToggle.addEventListener('change', async () => {
      const value = this._elements.stealthModeToggle.checked;
      await this._storage.set(STORAGE_KEYS.STEALTH_MODE, value);
      await this._notifyContentScript('settingsChanged', { stealthMode: value });
    });
  }

  _setupClickOutside() {
    document.addEventListener('click', (e) => {
      if (!this._isSelectOpen) {
        return;
      }

      const isClickInside = this._elements.positionSelect.contains(e.target);
      if (isClickInside) {
        return;
      }

      this._closeSelect();
    });
  }

  _toggleSelect() {
    if (this._isSelectOpen) {
      this._closeSelect();
      return;
    }
    this._openSelect();
  }

  _openSelect() {
    this._isSelectOpen = true;
    this._elements.positionSelect.classList.add('popup-select--open');
  }

  _closeSelect() {
    this._isSelectOpen = false;
    this._elements.positionSelect.classList.remove('popup-select--open');
  }

  async _handlePositionChange(option) {
    const value = option.dataset.value;

    await this._storage.set(STORAGE_KEYS.PANEL_POSITION, value);
    this._updatePositionUI(value);
    this._closeSelect();
    await this._notifyContentScript('settingsChanged', { panelPosition: value });
  }

  _updatePositionUI(position) {
    this._elements.positionSelectLabel.textContent = POSITION_LABELS[position] || POSITION_LABELS['bottom-right'];

    const options = this._elements.positionSelectMenu.querySelectorAll('.popup-select__option');
    options.forEach(option => {
      if (option.dataset.value === position) {
        option.classList.add('popup-select__option--selected');
        return;
      }
      option.classList.remove('popup-select__option--selected');
    });
  }

  async _notifyContentScript(action, data) {
    try {
      const tabs = await this._getInstagramTabs();

      for (const tab of tabs) {
        try {
          await chrome.tabs.sendMessage(tab.id, { action, data });
        } catch (error) {
          // Tab pode não ter content script ativo
          console.log('Não foi possível notificar aba:', tab.id);
        }
      }
    } catch (error) {
      console.error('Erro ao notificar content scripts:', error);
    }
  }

  async _getInstagramTabs() {
    return new Promise(resolve => {
      chrome.tabs.query({ url: 'https://www.instagram.com/*' }, resolve);
    });
  }
}
