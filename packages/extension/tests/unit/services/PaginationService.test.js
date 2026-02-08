// Testes unitários - PaginationService
import { describe, it, expect } from '@jest/globals';
import { PaginationService } from '../../../src/bundle/services/PaginationService.js';

// UNFOLLOWERS_PER_PAGE = 50 (de Constants.js)
const PAGE_SIZE = 50;

function createUsers(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: String(i + 1),
    username: `user_${i + 1}`
  }));
}

describe('PaginationService', () => {
  describe('getPage', () => {
    it('deve retornar a primeira página corretamente', () => {
      const users = createUsers(120);
      const page = PaginationService.getPage(users, 1);
      expect(page).toHaveLength(PAGE_SIZE);
      expect(page[0].id).toBe('1');
      expect(page[PAGE_SIZE - 1].id).toBe(String(PAGE_SIZE));
    });

    it('deve retornar página intermediária corretamente', () => {
      const users = createUsers(120);
      const page = PaginationService.getPage(users, 2);
      expect(page).toHaveLength(PAGE_SIZE);
      expect(page[0].id).toBe(String(PAGE_SIZE + 1));
    });

    it('deve retornar última página com itens restantes', () => {
      const users = createUsers(120);
      const page = PaginationService.getPage(users, 3);
      expect(page).toHaveLength(20); // 120 - 100 = 20
      expect(page[0].id).toBe('101');
    });

    it('deve retornar array vazio para página além do limite', () => {
      const users = createUsers(50);
      const page = PaginationService.getPage(users, 2);
      expect(page).toHaveLength(0);
    });

    it('deve retornar array vazio para lista vazia', () => {
      const page = PaginationService.getPage([], 1);
      expect(page).toHaveLength(0);
    });
  });

  describe('getMaxPage', () => {
    it('deve retornar 1 para lista vazia', () => {
      expect(PaginationService.getMaxPage([])).toBe(1);
    });

    it('deve retornar 1 para null', () => {
      expect(PaginationService.getMaxPage(null)).toBe(1);
    });

    it('deve retornar 1 para lista com 1 item', () => {
      expect(PaginationService.getMaxPage(createUsers(1))).toBe(1);
    });

    it('deve retornar 1 para lista exata de 1 página', () => {
      expect(PaginationService.getMaxPage(createUsers(PAGE_SIZE))).toBe(1);
    });

    it('deve retornar 2 para lista com PAGE_SIZE + 1 itens', () => {
      expect(PaginationService.getMaxPage(createUsers(PAGE_SIZE + 1))).toBe(2);
    });

    it('deve calcular múltiplas páginas corretamente', () => {
      expect(PaginationService.getMaxPage(createUsers(150))).toBe(3);
    });
  });

  describe('getCurrentPage', () => {
    it('deve ser equivalente a getPage', () => {
      const users = createUsers(120);
      const page1 = PaginationService.getPage(users, 2);
      const page2 = PaginationService.getCurrentPage(users, 2);
      expect(page1).toEqual(page2);
    });
  });
});
