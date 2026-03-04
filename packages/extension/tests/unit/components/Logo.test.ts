// Testes unitários - Logo component
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { getIcon, getIconUrl, Logo } from '../../../src/bundle/components/Logo.js';

describe('Logo', () => {
  let savedDocument;

  beforeEach(() => {
    // jest.setup.js sobrescreve document com mock simplificado;
    // Logo() precisa do document real do jsdom para style
    savedDocument = global.document;
    global.document = (globalThis as any)._jsdomDocument;
  });

  afterEach(() => {
    global.document = savedDocument;
  });

  describe('getIconUrl', () => {
    it('deve retornar URL do ícone PNG via chrome.runtime.getURL', () => {
      const url = getIconUrl();
      expect(url).toContain('icons/icon48.png');
    });
  });

  describe('getIcon', () => {
    it('deve retornar tag <img> inline com o ícone PNG', () => {
      const icon = getIcon();
      expect(icon).toContain('<img');
      expect(icon).toContain('icon48.png');
      expect(icon).toContain('alt="GhostGram"');
    });

    it('deve retornar sempre o mesmo valor', () => {
      expect(getIcon()).toBe(getIcon());
    });
  });

  describe('Logo()', () => {
    it('deve retornar um elemento img', () => {
      const element = Logo();
      expect(element.tagName).toBe('IMG');
    });

    it('deve ter src apontando para ícone PNG', () => {
      const element = Logo();
      expect(element.src).toContain('icons/icon48.png');
    });

    it('deve ter alt "GhostGram"', () => {
      const element = Logo();
      expect(element.alt).toBe('GhostGram');
    });

    it('deve ter width 28 e height 28', () => {
      const element = Logo();
      expect(element.width).toBe(28);
      expect(element.height).toBe(28);
    });
  });
});
