// SettingsFormController - Orchestrates settings form
import { SettingsLoader } from './SettingsLoader.js';
import { SettingsSaver } from './SettingsSaver.js';
import { SuccessMessage } from './SuccessMessage.js';

export class SettingsFormController {
  constructor() {
    this._loader = new SettingsLoader();
    this._saver = new SettingsSaver();
    this._successMessage = null;
  }

  initialize(formElement, cancelButton, successElement) {
    this._successMessage = new SuccessMessage(successElement);
    this._setupFormSubmit(formElement);
    this._setupCancelButton(cancelButton, formElement);
    this._loadAndPopulate(formElement);
  }

  _setupFormSubmit(formElement) {
    formElement.addEventListener('submit', e => {
      e.preventDefault();
      this._handleSubmit(formElement);
    });
  }

  _setupCancelButton(button, formElement) {
    button.addEventListener('click', () => {
      this._loadAndPopulate(formElement);
    });
  }

  async _handleSubmit(formElement) {
    await this._saver.saveFromForm(formElement);
    this._successMessage.show();
  }

  async _loadAndPopulate(formElement) {
    const settings = await this._loader.load();
    this._loader.populateForm(settings, formElement);
  }
}

