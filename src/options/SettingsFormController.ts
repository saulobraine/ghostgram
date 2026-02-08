// SettingsFormController - Orchestrates settings form
import { SettingsLoader } from './SettingsLoader.js';
import { SettingsSaver } from './SettingsSaver.js';
import { SuccessMessage } from './SuccessMessage.js';

/**
 * Controller responsável por orquestrar o formulário de configurações
 */
export class SettingsFormController {
  private _loader: SettingsLoader;
  private _saver: SettingsSaver;
  private _successMessage: SuccessMessage | null;

  constructor() {
    this._loader = new SettingsLoader();
    this._saver = new SettingsSaver();
    this._successMessage = null;
  }

  initialize(
    formElement: HTMLFormElement,
    cancelButton: HTMLButtonElement,
    successElement: HTMLElement
  ): void {
    this._successMessage = new SuccessMessage(successElement);
    this._setupFormSubmit(formElement);
    this._setupCancelButton(cancelButton, formElement);
    this._loadAndPopulate(formElement);
  }

  private _setupFormSubmit(formElement: HTMLFormElement): void {
    formElement.addEventListener('submit', (e: Event) => {
      e.preventDefault();
      this._handleSubmit(formElement);
    });
  }

  private _setupCancelButton(button: HTMLButtonElement, formElement: HTMLFormElement): void {
    button.addEventListener('click', () => {
      this._loadAndPopulate(formElement);
    });
  }

  private async _handleSubmit(formElement: HTMLFormElement): Promise<void> {
    await this._saver.saveFromForm(formElement);
    if (this._successMessage) {
      this._successMessage.show();
    }
  }

  private async _loadAndPopulate(formElement: HTMLFormElement): Promise<void> {
    const settings = await this._loader.load();
    this._loader.populateForm(settings, formElement);
  }
}
