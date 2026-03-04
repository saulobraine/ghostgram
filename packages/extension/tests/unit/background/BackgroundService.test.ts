import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { BackgroundService } from '../../../src/background/BackgroundService.js';
import { createChromeMock, clearChromeMock } from '../../mocks/chrome-api.mock.js';

describe('BackgroundService', () => {
  let service;
  let chromeMock;

  beforeEach(() => {
    chromeMock = createChromeMock();
    service = new BackgroundService();
  });

  afterEach(() => {
    clearChromeMock();
  });

  describe('initialize', () => {
    it('should setup install listener', () => {
      service.initialize();
      expect(chromeMock.runtime.onInstalled.addListener).toHaveBeenCalled();
    });

    it('should setup message listener', () => {
      service.initialize();
      expect(chromeMock.runtime.onMessage.addListener).toHaveBeenCalled();
    });

    it('should setup tab update listener', () => {
      service.initialize();
      expect(chrome.tabs.onUpdated.addListener).toHaveBeenCalled();
    });
  });
});

