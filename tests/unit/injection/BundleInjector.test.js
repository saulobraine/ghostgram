import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { BundleInjector } from '../../../src/injection/BundleInjector.js';
import { createChromeMock, clearChromeMock } from '../../mocks/chrome-api.mock.js';
import { createDOMMock, clearDOMMock } from '../../mocks/dom.mock.js';

describe('BundleInjector', () => {
  let injector;
  let chromeMock;
  let domMock;

  beforeEach(() => {
    chromeMock = createChromeMock();
    domMock = createDOMMock();
    injector = new BundleInjector(chromeMock.runtime);
  });

  afterEach(() => {
    clearChromeMock();
    clearDOMMock();
  });

  describe('inject', () => {
    it('should inject script when document is ready', () => {
      domMock.mockDocument.readyState = 'complete';
      injector.inject();
      expect(domMock.mockDocument.createElement).toHaveBeenCalledWith('script');
      expect(chromeMock.runtime.getURL).toHaveBeenCalledWith('bundle.js');
    });

    it('should wait for DOMContentLoaded when document is loading', () => {
      domMock.mockDocument.readyState = 'loading';
      injector.inject();
      expect(domMock.mockDocument.addEventListener).toHaveBeenCalledWith('DOMContentLoaded', expect.any(Function));
    });
  });

  describe('_createScript', () => {
    it('should create script element with correct src', () => {
      domMock.mockDocument.readyState = 'complete';
      injector.inject();
      const createElementCall = domMock.mockDocument.createElement.mock.calls[0];
      expect(createElementCall[0]).toBe('script');
    });

    it('should set onload handler', () => {
      domMock.mockDocument.readyState = 'complete';
      injector.inject();
      const script = domMock.mockDocument.createElement();
      expect(script.onload).toBeDefined();
    });

    it('should set onerror handler', () => {
      domMock.mockDocument.readyState = 'complete';
      injector.inject();
      const script = domMock.mockDocument.createElement();
      expect(script.onerror).toBeDefined();
    });
  });

  describe('_attachScript', () => {
    it('should append script to document head', () => {
      domMock.mockDocument.readyState = 'complete';
      injector.inject();
      expect(domMock.mockDocument.head.appendChild).toHaveBeenCalled();
    });

    it('should append to documentElement if head is not available', () => {
      domMock.mockDocument.head = null;
      domMock.mockDocument.readyState = 'complete';
      injector.inject();
      expect(domMock.mockDocument.documentElement.appendChild).toHaveBeenCalled();
    });
  });

  describe('_handleError', () => {
    it('should log error to console', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      domMock.mockDocument.readyState = 'complete';
      injector.inject();
      const script = domMock.mockDocument.createElement();
      script.onerror();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load bundle.js. Make sure the original bundle code is in bundle.js');
      consoleSpy.mockRestore();
    });
  });
});

