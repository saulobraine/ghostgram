// PopupController - Orquestra funcionalidades principais do popup
import { ToggleHandler } from './ToggleHandler.js';
import { ExtensionState } from '../domain/ExtensionState.js';
import { LocalStorageAdapter } from '../storage/LocalStorageAdapter.js';
import { STORAGE_KEYS } from '../constants/Constants.js';

export class PopupController {
  constructor() {
    this._storage = new LocalStorageAdapter();
    this._toggleHandler = new ToggleHandler(this._storage);
    this._elements = {};
  }

  initialize(elements) {
    this._elements = elements;
    this._setupMainToggle();
    this._setupOpenInstagramBtn();
    this._setupOpenSettingsBtn();
    this._loadInitialState();
  }

  _setupMainToggle() {
    this._elements.mainToggle.addEventListener('change', () => this._handleToggle());
  }

  _setupOpenInstagramBtn() {
    this._elements.openInstagramBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://www.instagram.com/' });
      window.close();
    });
  }

  _setupOpenSettingsBtn() {
    this._elements.openSettingsBtn.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
  }

  async _handleToggle() {
    console.log('[PopupController] Toggle clicado');
    await this._toggleHandler.toggle();
    console.log('[PopupController] Toggle executado, atualizando UI');
    await this._updateStatusUI();
  }

  async _loadInitialState() {
    console.log('[PopupController] Carregando estado inicial');
    await this._updateStatusUI();
  }

  async _updateStatusUI() {
    const state = await this._getCurrentState();
    const isEnabled = state.isEnabled();
    console.log('[PopupController] Estado atual:', isEnabled ? 'Ativado' : 'Desativado');

    this._elements.mainToggle.checked = isEnabled;
    this._updateStatusBadge(isEnabled);
  }

  _updateStatusBadge(isEnabled) {
    const badge = this._elements.statusBadge;

    if (isEnabled) {
      badge.textContent = 'Ativo';
      badge.className = 'popup-header__status popup-header__status--active';
      return;
    }

    badge.textContent = 'Inativo';
    badge.className = 'popup-header__status popup-header__status--inactive';
  }

  async _getCurrentState() {
    const value = await this._storage.get(STORAGE_KEYS.ENABLED);
    return ExtensionState.fromStorageValue(value);
  }
}
