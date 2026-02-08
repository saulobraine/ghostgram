import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { StatusUpdater } from '../../../src/popup/StatusUpdater.js';
import { createDOMMock, clearDOMMock } from '../../mocks/dom.mock.js';

describe('StatusUpdater', () => {
  let updater;
  let statusElement;
  let toggleButton;
  let domMock;

  beforeEach(() => {
    domMock = createDOMMock();
    statusElement = domMock.mockDocument.createElement();
    toggleButton = domMock.mockDocument.createElement();
    updater = new StatusUpdater(statusElement, toggleButton);
  });

  afterEach(() => {
    clearDOMMock();
  });

  describe('update', () => {
    it('should set active state when enabled', () => {
      updater.update(true);
      expect(statusElement.textContent).toBe('Extension is Active');
      expect(statusElement.className).toBe('status active');
      expect(toggleButton.textContent).toBe('Disable Extension');
    });

    it('should set inactive state when disabled', () => {
      updater.update(false);
      expect(statusElement.textContent).toBe('Extension is Inactive');
      expect(statusElement.className).toBe('status inactive');
      expect(toggleButton.textContent).toBe('Enable Extension');
    });
  });

  describe('_setActive', () => {
    it('should configure elements for active state', () => {
      updater._setActive();
      expect(statusElement.textContent).toBe('Extension is Active');
      expect(statusElement.className).toBe('status active');
      expect(toggleButton.textContent).toBe('Disable Extension');
      expect(toggleButton.classList.remove).toHaveBeenCalledWith('primary');
    });
  });

  describe('_setInactive', () => {
    it('should configure elements for inactive state', () => {
      updater._setInactive();
      expect(statusElement.textContent).toBe('Extension is Inactive');
      expect(statusElement.className).toBe('status inactive');
      expect(toggleButton.textContent).toBe('Enable Extension');
      expect(toggleButton.classList.add).toHaveBeenCalledWith('primary');
    });
  });
});

