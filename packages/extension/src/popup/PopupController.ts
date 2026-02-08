// PopupController - Orquestra funcionalidades principais do popup
import { ToggleHandler } from './ToggleHandler.js';
import { ExtensionState } from '../domain/ExtensionState.js';
import { LocalStorageAdapter } from '../storage/LocalStorageAdapter.js';
import { STORAGE_KEYS } from '../constants/Constants.js';

interface PopupElements {
  mainToggle: HTMLInputElement | null;
  statusBadge: HTMLElement | null;
  openInstagramBtn: HTMLButtonElement | null;
  openSettingsBtn: HTMLButtonElement | null;
}

/**
 * Controller responsável por orquestrar funcionalidades principais do popup
 */
export class PopupController {
  private _storage: LocalStorageAdapter;
  private _toggleHandler: ToggleHandler;
  private _elements: PopupElements;

  constructor() {
    this._storage = new LocalStorageAdapter();
    this._toggleHandler = new ToggleHandler(this._storage);
    this._elements = {
      mainToggle: null,
      statusBadge: null,
      openInstagramBtn: null,
      openSettingsBtn: null
    };
  }

  initialize(elements: PopupElements): void {
    this._elements = elements;
    this._setupMainToggle();
    this._setupOpenInstagramBtn();
    this._setupOpenSettingsBtn();
    this._loadInitialState();
  }

  private _setupMainToggle(): void {
    if (this._elements.mainToggle) {
      this._elements.mainToggle.addEventListener('change', () => this._handleToggle());
    }
  }

  private _setupOpenInstagramBtn(): void {
    if (this._elements.openInstagramBtn) {
      this._elements.openInstagramBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://www.instagram.com/' });
        window.close();
      });
    }
  }

  private _setupOpenSettingsBtn(): void {
    if (this._elements.openSettingsBtn) {
      this._elements.openSettingsBtn.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
      });
    }
  }

  private async _handleToggle(): Promise<void> {
    console.log('[PopupController] Toggle clicado');
    await this._toggleHandler.toggle();
    console.log('[PopupController] Toggle executado, atualizando UI');
    await this._updateStatusUI();
  }

  private async _loadInitialState(): Promise<void> {
    console.log('[PopupController] Carregando estado inicial');
    await this._updateStatusUI();
  }

  private async _updateStatusUI(): Promise<void> {
    const state = await this._getCurrentState();
    const isEnabled = state.isEnabled();
    console.log('[PopupController] Estado atual:', isEnabled ? 'Ativado' : 'Desativado');

    if (this._elements.mainToggle) {
      this._elements.mainToggle.checked = isEnabled;
    }
    this._updateStatusBadge(isEnabled);
  }

  private _updateStatusBadge(isEnabled: boolean): void {
    const badge = this._elements.statusBadge;
    if (!badge) return;

    if (isEnabled) {
      badge.textContent = 'Ativo';
      badge.className = 'popup-header__status popup-header__status--active';
      return;
    }

    badge.textContent = 'Inativo';
    badge.className = 'popup-header__status popup-header__status--inactive';
  }

  private async _getCurrentState(): Promise<ExtensionState> {
    const value = await this._storage.get(STORAGE_KEYS.ENABLED);
    return ExtensionState.fromStorageValue(value);
  }
}
