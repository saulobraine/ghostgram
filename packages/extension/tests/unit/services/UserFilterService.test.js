// Testes unitários - UserFilterService
import { describe, it, expect, beforeEach } from '@jest/globals';
import { UserFilterService } from '../../../src/bundle/services/UserFilterService.js';
import { User } from '../../../src/bundle/domain/User.js';
import { Filter } from '../../../src/bundle/domain/Filter.js';
import { Whitelist } from '../../../src/bundle/domain/Whitelist.js';
import { Settings } from '../../../src/domain/Settings.js';

function createUser(overrides = {}) {
  return User.fromObject({
    id: '1',
    username: 'testuser',
    full_name: 'Test User',
    profile_pic_url: 'https://instagram.com/pic.jpg',
    is_verified: false,
    is_private: false,
    follows_viewer: false,
    ...overrides
  });
}

describe('UserFilterService', () => {
  let service;
  let settings;

  beforeEach(() => {
    service = new UserFilterService();
    settings = Settings.createDefault();
  });

  describe('filtragem por aba', () => {
    it('non_whitelisted deve excluir usuários na whitelist', () => {
      const user1 = createUser({ id: '1', username: 'user1' });
      const user2 = createUser({ id: '2', username: 'user2' });
      const whitelist = Whitelist.fromArray([user1]);
      const filter = Filter.createDefault();

      const result = service.filter([user1, user2], filter, '', whitelist, 'non_whitelisted', settings);

      expect(result).toHaveLength(1);
      expect(result[0].getUsername()).toBe('user2');
    });

    it('whitelisted deve incluir apenas usuários na whitelist', () => {
      const user1 = createUser({ id: '1', username: 'user1' });
      const user2 = createUser({ id: '2', username: 'user2' });
      const whitelist = Whitelist.fromArray([user1]);
      const filter = Filter.createDefault();

      const result = service.filter([user1, user2], filter, '', whitelist, 'whitelisted', settings);

      expect(result).toHaveLength(1);
      expect(result[0].getUsername()).toBe('user1');
    });

    it('aba desconhecida deve retornar todos', () => {
      const user1 = createUser({ id: '1', username: 'user1' });
      const user2 = createUser({ id: '2', username: 'user2' });
      const whitelist = Whitelist.fromArray([user1]);
      const filter = Filter.createDefault();

      const result = service.filter([user1, user2], filter, '', whitelist, 'all', settings);

      expect(result).toHaveLength(2);
    });
  });

  describe('filtragem por tipo', () => {
    const whitelist = Whitelist.createEmpty();

    it('deve filtrar usuários privados quando showPrivate é false', () => {
      const users = [
        createUser({ id: '1', is_private: true }),
        createUser({ id: '2', is_private: false })
      ];
      const filter = Filter.createDefault().update({ showPrivate: false });

      const result = service.filter(users, filter, '', whitelist, 'non_whitelisted', settings);

      expect(result).toHaveLength(1);
      expect(result[0].getId()).toBe('2');
    });

    it('deve filtrar usuários verificados quando showVerified é false', () => {
      const users = [
        createUser({ id: '1', is_verified: true }),
        createUser({ id: '2', is_verified: false })
      ];
      const filter = Filter.createDefault().update({ showVerified: false });

      const result = service.filter(users, filter, '', whitelist, 'non_whitelisted', settings);

      expect(result).toHaveLength(1);
      expect(result[0].getId()).toBe('2');
    });

    it('deve filtrar seguidores quando showFollowers é false', () => {
      const users = [
        createUser({ id: '1', follows_viewer: true }),
        createUser({ id: '2', follows_viewer: false })
      ];
      // Default filter já tem showFollowers: false
      const filter = Filter.createDefault();

      const result = service.filter(users, filter, '', whitelist, 'non_whitelisted', settings);

      expect(result).toHaveLength(1);
      expect(result[0].getId()).toBe('2');
    });

    it('deve filtrar não-seguidores quando showNonFollowers é false', () => {
      const users = [
        createUser({ id: '1', follows_viewer: true }),
        createUser({ id: '2', follows_viewer: false })
      ];
      const filter = Filter.createDefault().update({ showNonFollowers: false, showFollowers: true });

      const result = service.filter(users, filter, '', whitelist, 'non_whitelisted', settings);

      expect(result).toHaveLength(1);
      expect(result[0].getId()).toBe('1');
    });
  });

  describe('filtragem por busca', () => {
    const whitelist = Whitelist.createEmpty();
    const filter = Filter.createDefault();

    it('deve filtrar por username parcial', () => {
      const users = [
        createUser({ id: '1', username: 'john_doe' }),
        createUser({ id: '2', username: 'jane_smith' })
      ];

      const result = service.filter(users, filter, 'john', whitelist, 'non_whitelisted', settings);

      expect(result).toHaveLength(1);
      expect(result[0].getUsername()).toBe('john_doe');
    });

    it('deve filtrar por fullName parcial', () => {
      const users = [
        createUser({ id: '1', username: 'user1', full_name: 'John Doe' }),
        createUser({ id: '2', username: 'user2', full_name: 'Jane Smith' })
      ];

      const result = service.filter(users, filter, 'smith', whitelist, 'non_whitelisted', settings);

      expect(result).toHaveLength(1);
      expect(result[0].getFullName()).toBe('Jane Smith');
    });

    it('deve ser case-insensitive', () => {
      const users = [createUser({ id: '1', username: 'JohnDoe' })];

      const result = service.filter(users, filter, 'johndoe', whitelist, 'non_whitelisted', settings);

      expect(result).toHaveLength(1);
    });

    it('deve retornar todos quando busca é vazia', () => {
      const users = [
        createUser({ id: '1', username: 'user1' }),
        createUser({ id: '2', username: 'user2' })
      ];

      const result = service.filter(users, filter, '', whitelist, 'non_whitelisted', settings);

      expect(result).toHaveLength(2);
    });

    it('deve retornar vazio quando não há match', () => {
      const users = [createUser({ id: '1', username: 'user1' })];

      const result = service.filter(users, filter, 'nonexistent', whitelist, 'non_whitelisted', settings);

      expect(result).toHaveLength(0);
    });
  });

  describe('combinações', () => {
    it('deve aplicar filtro + busca + aba simultaneamente', () => {
      const user1 = createUser({ id: '1', username: 'john_public', is_private: false });
      const user2 = createUser({ id: '2', username: 'john_private', is_private: true });
      const user3 = createUser({ id: '3', username: 'jane_public', is_private: false });
      const whitelist = Whitelist.fromArray([user1]);
      const filter = Filter.createDefault().update({ showPrivate: false });

      // Aba non_whitelisted + sem privados + busca "john"
      const result = service.filter(
        [user1, user2, user3], filter, 'john', whitelist, 'non_whitelisted', settings
      );

      // user1 excluído pela aba (whitelisted), user2 excluído pelo filtro (privado)
      expect(result).toHaveLength(0);
    });
  });

  describe('normalização de inputs', () => {
    it('deve aceitar plain object como filter', () => {
      const users = [createUser({ id: '1' })];
      const plainFilter = { showNonFollowers: true, showFollowers: false, showVerified: true, showPrivate: true, showWithOutProfilePicture: true };
      const whitelist = Whitelist.createEmpty();

      const result = service.filter(users, plainFilter, '', whitelist, 'non_whitelisted', settings);

      expect(result).toHaveLength(1);
    });

    it('deve aceitar array como whitelist', () => {
      const user1 = createUser({ id: '1', username: 'user1' });
      const users = [user1];
      const filter = Filter.createDefault();

      const result = service.filter(users, filter, '', [user1], 'whitelisted', settings);

      expect(result).toHaveLength(1);
    });

    it('deve tratar whitelist null como vazia', () => {
      const users = [createUser({ id: '1' })];
      const filter = Filter.createDefault();

      const result = service.filter(users, filter, '', null, 'non_whitelisted', settings);

      expect(result).toHaveLength(1);
    });
  });
});
