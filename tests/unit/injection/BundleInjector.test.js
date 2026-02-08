import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { BundleInjector } from '../../../src/injection/BundleInjector.js';
import { createChromeMock, clearChromeMock } from '../../mocks/chrome-api.mock.js';

describe('BundleInjector', () => {
  let injector;
  let chromeMock;
  let createElementSpy;
  let appendChildSpy;
  let addEventListenerSpy;

  beforeEach(() => {
    chromeMock = createChromeMock();
    // Spy on real jsdom document methods
    createElementSpy = jest.spyOn(document, 'createElement');
    appendChildSpy = jest.spyOn(document.head, 'appendChild').mockImplementation((el) => el);
    addEventListenerSpy = jest.spyOn(document, 'addEventListener');
    injector = new BundleInjector(chromeMock.runtime);
  });

  afterEach(() => {
    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    addEventListenerSpy.mockRestore();
    clearChromeMock();
  });

  describe('inject', () => {
    it('should inject script when document is ready', () => {
      injector.inject();
      expect(createElementSpy).toHaveBeenCalledWith('script');
      expect(chromeMock.runtime.getURL).toHaveBeenCalled();
    });

    it('should wait for DOMContentLoaded when document is loading', () => {
      Object.defineProperty(document, 'readyState', { value: 'loading', configurable: true });
      injector.inject();
      expect(addEventListenerSpy).toHaveBeenCalledWith('DOMContentLoaded', expect.any(Function));
      Object.defineProperty(document, 'readyState', { value: 'complete', configurable: true });
    });
  });

  describe('_createScript', () => {
    it('should create script element with correct src', () => {
      injector.inject();
      expect(createElementSpy).toHaveBeenCalledWith('script');
      const script = createElementSpy.mock.results[0].value;
      expect(script.src).toContain('bundle.js');
    });

    it('should set onload handler', () => {
      injector.inject();
      const script = createElementSpy.mock.results[0].value;
      expect(script.onload).toBeInstanceOf(Function);
    });

    it('should set onerror handler', () => {
      injector.inject();
      const script = createElementSpy.mock.results[0].value;
      expect(script.onerror).toBeInstanceOf(Function);
    });
  });

  describe('_attachScript', () => {
    it('should append script to document head', () => {
      injector.inject();
      expect(appendChildSpy).toHaveBeenCalled();
    });
  });

  describe('_handleError', () => {
    it('should log error to console', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      injector.inject();
      const script = createElementSpy.mock.results[0].value;
      script.onerror('test error');
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load bundle.js. Make sure the original bundle code is in bundle.js');
      consoleSpy.mockRestore();
    });
  });
});

