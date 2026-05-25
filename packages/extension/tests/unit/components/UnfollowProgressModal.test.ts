import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { UnfollowProgressModal } from '../../../src/bundle/components/UnfollowProgressModal.js';
import { UnfollowLogEntry } from '../../../src/bundle/domain/UnfollowLogEntry.js';
import { User } from '../../../src/bundle/domain/User.js';

function createUser(id: number, username?: string) {
  return User.fromObject({
    id: String(id),
    username: username || `user_${id}`,
    full_name: `User ${id}`,
    profile_pic_url: 'https://instagram.com/pic.jpg',
    is_verified: false,
    is_private: false,
    follows_viewer: false
  });
}

describe('UnfollowProgressModal', () => {
  let savedDocument: Document;
  let modal: UnfollowProgressModal;

  beforeEach(() => {
    savedDocument = global.document;
    global.document = (globalThis as any)._jsdomDocument;
    document.body.innerHTML = '';
    document.head.innerHTML = '';

    modal = new UnfollowProgressModal({
      totalCount: 6,
      timeBetweenUnfollows: 1000,
      timeAfterFive: 60000,
      unfollowsPerCycle: 2,
      onPause: jest.fn(),
      onResume: jest.fn(),
      onCancel: jest.fn(),
      onClose: jest.fn()
    });
    modal.show();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    global.document = savedDocument;
  });

  it('deve renderizar o modal no DOM', () => {
    const overlay = document.querySelector('.iu-unfollow-modal-overlay');
    expect(overlay).not.toBeNull();
    expect(document.body.textContent).toContain('Deixando de seguir...');
  });

  it('não deve criar overlay de pausa no cooldown curto entre unfollows', () => {
    const log = [UnfollowLogEntry.createSuccess(createUser(1))];

    modal.update(17, log, {
      state: 'cooldown',
      remainingMs: 7000,
      reason: null
    });

    const overlay = document.querySelector('.iu-unfollow-modal-overlay');
    const pauseState = document.querySelector('.iu-unfollow-modal-pause-state');

    expect(overlay?.classList.contains('iu-unfollow-modal-overlay-paused')).toBe(false);
    expect(pauseState).toBeNull();
  });

  it('deve criar e exibir overlay apenas na pausa automática maior', () => {
    const log = [
      UnfollowLogEntry.createSuccess(createUser(1)),
      UnfollowLogEntry.createSuccess(createUser(2))
    ];

    modal.update(33, log, {
      state: 'cycle_pause',
      remainingMs: 60000,
      reason: 'Pausa automática após 2 unfollows para reduzir o risco de bloqueio por atividade suspeita.'
    });

    const pauseState = document.querySelector('.iu-unfollow-modal-pause-state');
    const statusLine = document.querySelector('.iu-unfollow-modal-status-line');

    expect(pauseState).not.toBeNull();
    expect(document.body.textContent).toContain('Retomando em 01:00');
    expect(document.body.textContent).toContain('Pausa automática após 2 unfollows para reduzir o risco de bloqueio por atividade suspeita.');
    expect(statusLine?.textContent).toContain('2 ciclos');
    expect(statusLine?.textContent).toContain('Previsão: ~2min');
  });

  it('deve remover o overlay ao voltar para running', () => {
    const log = [UnfollowLogEntry.createSuccess(createUser(1))];

    modal.update(17, log, {
      state: 'cycle_pause',
      remainingMs: 3000,
      reason: 'Pausa automática após 2 unfollows para reduzir o risco de bloqueio por atividade suspeita.'
    });
    modal.update(17, log, {
      state: 'running',
      remainingMs: null,
      reason: null
    });

    const overlay = document.querySelector('.iu-unfollow-modal-overlay');
    const pauseState = document.querySelector('.iu-unfollow-modal-pause-state');

    expect(overlay?.classList.contains('iu-unfollow-modal-overlay-paused')).toBe(false);
    expect(pauseState).toBeNull();
  });

  it('deve usar ciclos, tempo por unfollow e pausas na previsão geral', () => {
    const statusLine = document.querySelector('.iu-unfollow-modal-status-line');
    expect(statusLine?.textContent).toContain('3 ciclos');
    expect(statusLine?.textContent).toContain('Previsão: ~3min');
  });

  it('deve adicionar 1s por usuário na previsão do unfollow', () => {
    document.body.innerHTML = '';

    const singleModal = new UnfollowProgressModal({
      totalCount: 1,
      timeBetweenUnfollows: 1000,
      timeAfterFive: 60000,
      unfollowsPerCycle: 5
    });
    singleModal.show();

    const statusLine = document.querySelector('.iu-unfollow-modal-status-line');
    expect(statusLine?.textContent).toContain('1 ciclo');
    expect(statusLine?.textContent).toContain('Previsão: ~2s');
  });
});
