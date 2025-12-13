// SuccessMessage - SRP: Show success feedback
import { SUCCESS_MESSAGE_DURATION } from '../constants/Constants.js';

export class SuccessMessage {
  constructor(element) {
    this._element = element;
  }

  show() {
    this._element.classList.add('show');
    setTimeout(() => this._hide(), SUCCESS_MESSAGE_DURATION);
  }

  _hide() {
    this._element.classList.remove('show');
  }
}

