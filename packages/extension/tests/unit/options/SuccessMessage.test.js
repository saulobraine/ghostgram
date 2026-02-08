import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { SuccessMessage } from '../../../src/options/SuccessMessage.js';
import { SUCCESS_MESSAGE_DURATION } from '../../../src/constants/Constants.js';
import { createDOMMock, clearDOMMock } from '../../mocks/dom.mock.js';

describe('SuccessMessage', () => {
  let message;
  let element;
  let domMock;

  beforeEach(() => {
    domMock = createDOMMock();
    element = domMock.mockElement;
    message = new SuccessMessage(element);
    jest.useFakeTimers();
  });

  afterEach(() => {
    clearDOMMock();
    jest.useRealTimers();
  });

  describe('show', () => {
    it('should add show class to element', () => {
      message.show();
      expect(element.classList.add).toHaveBeenCalledWith('show');
    });

    it('should hide after timeout', () => {
      message.show();
      jest.advanceTimersByTime(SUCCESS_MESSAGE_DURATION);
      expect(element.classList.remove).toHaveBeenCalledWith('show');
    });
  });

  describe('_hide', () => {
    it('should remove show class from element', () => {
      message._hide();
      expect(element.classList.remove).toHaveBeenCalledWith('show');
    });
  });
});

