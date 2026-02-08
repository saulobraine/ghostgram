// Testes unitários - DatabaseService
import { describe, it, expect, beforeEach } from '@jest/globals';
import { DatabaseService } from '../../../src/bundle/services/DatabaseService.js';
import { ACTION_TYPES, ACTION_SOURCES } from '../../../src/constants/Constants.js';
import { createChromeMock, clearChromeMock } from '../../mocks/chrome-api.mock.js';

describe('DatabaseService', () => {
  let service;

  beforeEach(() => {
    createChromeMock();
    service = new DatabaseService();
  });

  describe('logAction', () => {
    it('deve persistir registro com todos os campos', async () => {
      const id = await service.logAction({
        userId: '12345',
        username: 'john_doe',
        actionType: ACTION_TYPES.UNFOLLOW,
        source: ACTION_SOURCES.AUTO
      });

      expect(id).toBeDefined();
      expect(typeof id).toBe('string');

      const actions = await service.getAllActions();
      expect(actions).toHaveLength(1);
      expect(actions[0]).toEqual(expect.objectContaining({
        userId: '12345',
        username: 'john_doe',
        actionType: ACTION_TYPES.UNFOLLOW,
        source: ACTION_SOURCES.AUTO
      }));
      expect(actions[0].timestamp).toBeDefined();
      expect(actions[0].id).toBeDefined();
    });

    it('deve usar MANUAL como source padrão quando omitido', async () => {
      await service.logAction({
        userId: '12345',
        username: 'john_doe',
        actionType: ACTION_TYPES.FOLLOW
      });

      const actions = await service.getAllActions();
      expect(actions[0].source).toBe(ACTION_SOURCES.MANUAL);
    });

    it('deve acumular múltiplas ações corretamente', async () => {
      await service.logAction({ userId: '1', username: 'user1', actionType: ACTION_TYPES.UNFOLLOW });
      await service.logAction({ userId: '2', username: 'user2', actionType: ACTION_TYPES.FOLLOW });
      await service.logAction({ userId: '3', username: 'user3', actionType: ACTION_TYPES.UNFOLLOW });

      const actions = await service.getAllActions();
      expect(actions).toHaveLength(3);
    });

    it('deve gerar IDs únicos para cada ação', async () => {
      const id1 = await service.logAction({ userId: '1', username: 'u1', actionType: ACTION_TYPES.UNFOLLOW });
      const id2 = await service.logAction({ userId: '2', username: 'u2', actionType: ACTION_TYPES.UNFOLLOW });

      expect(id1).not.toBe(id2);
    });
  });

  describe('getActionsByUser', () => {
    it('deve retornar apenas ações do userId especificado', async () => {
      await service.logAction({ userId: '1', username: 'user1', actionType: ACTION_TYPES.UNFOLLOW });
      await service.logAction({ userId: '2', username: 'user2', actionType: ACTION_TYPES.UNFOLLOW });
      await service.logAction({ userId: '1', username: 'user1', actionType: ACTION_TYPES.FOLLOW });

      const actions = await service.getActionsByUser('1');

      expect(actions).toHaveLength(2);
      expect(actions.every(a => a.userId === '1')).toBe(true);
    });

    it('deve ordenar por timestamp descendente', async () => {
      await service.logAction({ userId: '1', username: 'user1', actionType: ACTION_TYPES.UNFOLLOW });
      // Pequeno delay para garantir timestamps diferentes
      await service.logAction({ userId: '1', username: 'user1', actionType: ACTION_TYPES.FOLLOW });

      const actions = await service.getActionsByUser('1');

      expect(actions[0].timestamp).toBeGreaterThanOrEqual(actions[1].timestamp);
    });

    it('deve retornar array vazio para userId sem ações', async () => {
      await service.logAction({ userId: '1', username: 'user1', actionType: ACTION_TYPES.UNFOLLOW });

      const actions = await service.getActionsByUser('999');

      expect(actions).toHaveLength(0);
    });
  });

  describe('getAllActions', () => {
    it('deve retornar todas as ações ordenadas por timestamp desc', async () => {
      await service.logAction({ userId: '1', username: 'user1', actionType: ACTION_TYPES.UNFOLLOW });
      await service.logAction({ userId: '2', username: 'user2', actionType: ACTION_TYPES.FOLLOW });

      const actions = await service.getAllActions();

      expect(actions).toHaveLength(2);
      expect(actions[0].timestamp).toBeGreaterThanOrEqual(actions[1].timestamp);
    });

    it('deve retornar array vazio quando não há ações', async () => {
      const actions = await service.getAllActions();

      expect(actions).toHaveLength(0);
    });
  });

  describe('clearHistory', () => {
    it('deve limpar todas as ações', async () => {
      await service.logAction({ userId: '1', username: 'user1', actionType: ACTION_TYPES.UNFOLLOW });
      await service.logAction({ userId: '2', username: 'user2', actionType: ACTION_TYPES.FOLLOW });

      await service.clearHistory();

      const actions = await service.getAllActions();
      expect(actions).toHaveLength(0);
    });
  });
});
