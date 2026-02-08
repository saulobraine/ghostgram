// Testes unitários - Logo component
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { getIcon, Logo } from '../../../src/bundle/components/Logo.js';

describe('Logo', () => {
  let savedDocument;

  beforeEach(() => {
    // jest.setup.js sobrescreve document com mock simplificado;
    // Logo() precisa do document real do jsdom para style
    savedDocument = global.document;
    global.document = globalThis._jsdomDocument;
  });

  afterEach(() => {
    global.document = savedDocument;
  });

  describe('getIcon', () => {
    it('deve retornar o emoji fantasma', () => {
      expect(getIcon()).toBe('👻');
    });

    it('deve retornar sempre o mesmo valor', () => {
      expect(getIcon()).toBe(getIcon());
    });
  });

  describe('Logo()', () => {
    it('deve retornar um elemento span', () => {
      const element = Logo();
      expect(element.tagName).toBe('SPAN');
    });

    it('deve conter o emoji como textContent', () => {
      const element = Logo();
      expect(element.textContent).toBe('👻');
    });

    it('deve ter fontSize de 28px', () => {
      const element = Logo();
      expect(element.style.fontSize).toBe('28px');
    });

    it('deve ter lineHeight de 1', () => {
      const element = Logo();
      expect(element.style.lineHeight).toBe('1');
    });
  });
});
