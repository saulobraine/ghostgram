// SuccessMessage - SRP: Show success feedback
import { SUCCESS_MESSAGE_DURATION } from '../constants/Constants.js';

/**
 * Classe responsável por exibir mensagens de sucesso
 */
export class SuccessMessage {
  private _element: HTMLElement;

  constructor(element: HTMLElement) {
    this._element = element;
  }

  show(): void {
    this._element.classList.add('options-toast--visible');
    setTimeout(() => this._hide(), SUCCESS_MESSAGE_DURATION);
  }

  private _hide(): void {
    this._element.classList.remove('options-toast--visible');
  }
}
