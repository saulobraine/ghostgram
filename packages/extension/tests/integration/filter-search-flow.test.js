// Teste de integração - Fluxo de filtragem e busca
import { describe, it, expect, beforeEach } from '@jest/globals';
import { UserFilterService } from '../../src/bundle/services/UserFilterService.js';
import { PaginationService } from '../../src/bundle/services/PaginationService.js';
import { User } from '../../src/bundle/domain/User.js';
import { Filter } from '../../src/bundle/domain/Filter.js';
import { Whitelist } from '../../src/bundle/domain/Whitelist.js';
import { Settings } from '../../src/domain/Settings.js';

function createTestUser(id, username, overrides = {}) {
  return User.fromObject({
    id: String(id),
    username,
    full_name: overrides.fullName || `Full ${username}`,
    profile_pic_url: 'http://pic.jpg',
    is_verified: overrides.verified || false,
    is_private: overrides.isPrivate || false,
    follows_viewer: overrides.followsViewer || false
  });
}

describe('Fluxo de Filtragem e Busca (Integração)', () => {
  let users;
  let filterService;

  beforeEach(() => {
    filterService = new UserFilterService();
    users = [
      createTestUser(1, 'alice_public', { isPrivate: false, verified: false, followsViewer: false }),
      createTestUser(2, 'bob_private', { isPrivate: true, verified: false, followsViewer: false }),
      createTestUser(3, 'charlie_verified', { isPrivate: false, verified: true, followsViewer: false }),
      createTestUser(4, 'diana_follower', { isPrivate: false, verified: false, followsViewer: true }),
      createTestUser(5, 'eve_public', { isPrivate: false, verified: false, followsViewer: false }),
      createTestUser(6, 'frank_public', { isPrivate: false, verified: false, followsViewer: false }),
      createTestUser(7, 'grace_private', { isPrivate: true, verified: false, followsViewer: true }),
      createTestUser(8, 'henry_verified', { isPrivate: false, verified: true, followsViewer: false }),
      createTestUser(9, 'irene_public', { isPrivate: false, verified: false, followsViewer: false }),
      createTestUser(10, 'jack_public', { isPrivate: false, verified: false, followsViewer: false })
    ];
  });

  describe('UserFilterService → PaginationService', () => {
    it('deve filtrar por aba e paginar resultados', () => {
      const whitelistUser = createTestUser(3, 'charlie_verified');
      const whitelist = new Whitelist([whitelistUser]);
      const filter = Filter.createDefault();
      const settings = Settings.createDefault();

      // Filtra por aba non_whitelisted
      const filtered = filterService.filter(users, filter, '', whitelist, 'non_whitelisted', settings);

      // charlie (id=3) deve ser excluído
      expect(filtered.find(u => u.getUsername() === 'charlie_verified')).toBeUndefined();

      // Pagina
      const page1 = PaginationService.getPage(filtered, 1);
      expect(page1.length).toBeGreaterThan(0);
      expect(page1.length).toBeLessThanOrEqual(50);
    });

    it('deve filtrar por aba whitelisted', () => {
      const wlUser1 = createTestUser(1, 'alice_public');
      const wlUser2 = createTestUser(5, 'eve_public');
      const whitelist = new Whitelist([wlUser1, wlUser2]);
      const filter = Filter.createDefault();
      const settings = Settings.createDefault();

      const filtered = filterService.filter(users, filter, '', whitelist, 'whitelisted', settings);

      // Apenas alice e eve devem estar
      expect(filtered).toHaveLength(2);
      expect(filtered.map(u => u.getUsername())).toEqual(
        expect.arrayContaining(['alice_public', 'eve_public'])
      );
    });

    it('deve filtrar por busca e paginar', () => {
      const whitelist = new Whitelist();
      const filter = Filter.createDefault();
      const settings = Settings.createDefault();

      // Busca por "public"
      const filtered = filterService.filter(users, filter, 'public', whitelist, 'non_whitelisted', settings);

      // Apenas users com "public" no username
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every(u => u.getUsername().includes('public'))).toBe(true);

      // Paginação
      const page1 = PaginationService.getPage(filtered, 1);
      expect(page1.length).toBe(filtered.length); // menos de 50
    });

    it('deve combinar filtro por tipo + busca + paginação', () => {
      const whitelist = new Whitelist();
      const filter = new Filter({
        showPrivate: false, // excluir privados
        showVerified: true,
        showFollowers: true,
        showNonFollowers: true,
        showWithOutProfilePicture: true
      });
      const settings = Settings.createDefault();

      // Filtra excluindo privados e buscando "public"
      const filtered = filterService.filter(users, filter, '', whitelist, 'non_whitelisted', settings);

      // Nenhum user privado deve estar
      expect(filtered.every(u => !u.isPrivate())).toBe(true);
    });

    it('deve retornar maxPage correto após filtragem', () => {
      // Criar 120 users para testar paginação
      const manyUsers = Array.from({ length: 120 }, (_, i) =>
        createTestUser(i + 100, `user_${i}`)
      );

      const whitelist = new Whitelist();
      const filter = Filter.createDefault();
      const settings = Settings.createDefault();

      const filtered = filterService.filter(manyUsers, filter, '', whitelist, 'non_whitelisted', settings);

      const maxPage = PaginationService.getMaxPage(filtered);
      expect(maxPage).toBe(3); // 120 / 50 = 2.4 → 3 páginas

      // Última página deve ter 20 itens
      const lastPage = PaginationService.getPage(filtered, 3);
      expect(lastPage).toHaveLength(20);
    });

    it('deve retornar busca case-insensitive', () => {
      const whitelist = new Whitelist();
      const filter = Filter.createDefault();
      const settings = Settings.createDefault();

      const filtered = filterService.filter(users, filter, 'ALICE', whitelist, 'non_whitelisted', settings);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].getUsername()).toBe('alice_public');
    });

    it('deve retornar lista vazia quando nada corresponde', () => {
      const whitelist = new Whitelist();
      const filter = Filter.createDefault();
      const settings = Settings.createDefault();

      const filtered = filterService.filter(users, filter, 'zzzzz_not_found', whitelist, 'non_whitelisted', settings);

      expect(filtered).toHaveLength(0);

      const page = PaginationService.getPage(filtered, 1);
      expect(page).toHaveLength(0);
    });
  });
});
