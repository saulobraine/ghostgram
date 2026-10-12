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

  it('deve conter contêiner de lista e lista com estrutura e estilos de overflow adequados', () => {
    const listContainer = document.querySelector('.iu-unfollow-modal-list-container');
    const list = document.querySelector('.iu-unfollow-modal-list');
    const footer = document.querySelector('.iu-unfollow-modal-footer');
    const styleEl = document.getElementById('iu-modal-anim-styles');

    expect(listContainer).not.toBeNull();
    expect(list).not.toBeNull();
    expect(footer).not.toBeNull();
    expect(listContainer?.contains(list!)).toBe(true);

    // Verifica se os estilos essenciais de contenção e overflow foram injetados
    expect(styleEl?.textContent).toContain('.iu-unfollow-modal-list-container');
    expect(styleEl?.textContent).toContain('overflow: hidden');
    expect(styleEl?.textContent).toContain('overflow-y: auto');
    expect(styleEl?.textContent).toContain('.iu-unfollow-modal-footer');

    // Ao atualizar, itens devem ser inseridos dentro da lista
    const log = [
      UnfollowLogEntry.createSuccess(createUser(1, 'luiza.pfeiffer')),
      UnfollowLogEntry.createSuccess(createUser(2, 'flaviih_coosta'))
    ];
    modal.update(33, log);

    const items = list?.querySelectorAll('.iu-unfollow-modal-item');
    expect(items?.length).toBe(2);
    expect(list?.textContent).toContain('@luiza.pfeiffer');
    expect(list?.textContent).toContain('@flaviih_coosta');
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

  describe('Minimização do modal (XP/TDD)', () => {
    it('deve renderizar botão de minimizar no cabeçalho do modal', () => {
      const minimizeBtn = document.querySelector('.iu-unfollow-modal-btn-minimize');
      expect(minimizeBtn).not.toBeNull();
      expect(minimizeBtn?.getAttribute('title')).toBe('Minimizar');
    });

    it('ao minimizar, deve ocultar o overlay, restaurar o scroll do body e exibir o mini-widget', () => {
      document.body.style.overflow = 'hidden';

      expect(modal.isMinimized()).toBe(false);

      modal.minimize();

      expect(modal.isMinimized()).toBe(true);
      expect(document.body.style.overflow).toBe('');

      const overlay = document.querySelector('.iu-unfollow-modal-overlay') as HTMLElement;
      expect(overlay.style.display).toBe('none');

      const miniWidget = document.querySelector('.iu-unfollow-mini-widget');
      expect(miniWidget).not.toBeNull();
      expect(document.body.textContent).toContain('Deixando de seguir...');
    });

    it('ao maximizar pelo mini-widget, deve remover o mini-widget e restaurar o modal e scroll bloqueado', () => {
      modal.minimize();

      const maximizeBtn = document.querySelector('.iu-unfollow-mini-btn-maximize') as HTMLButtonElement;
      expect(maximizeBtn).not.toBeNull();
      maximizeBtn.click();

      expect(modal.isMinimized()).toBe(false);
      expect(document.body.style.overflow).toBe('hidden');

      const overlay = document.querySelector('.iu-unfollow-modal-overlay') as HTMLElement;
      expect(overlay.style.display).not.toBe('none');

      const miniWidget = document.querySelector('.iu-unfollow-mini-widget');
      expect(miniWidget).toBeNull();
    });

    it('deve disparar callbacks onMinimize e onMaximize', () => {
      document.body.innerHTML = '';
      const onMinimize = jest.fn();
      const onMaximize = jest.fn();
      const customModal = new UnfollowProgressModal({
        totalCount: 10,
        onMinimize,
        onMaximize
      });
      customModal.show();
      customModal.minimize();
      expect(onMinimize).toHaveBeenCalledTimes(1);
      customModal.maximize();
      expect(onMaximize).toHaveBeenCalledTimes(1);
    });

    it('deve minimizar ao clicar no botão de minimizar do cabeçalho', () => {
      const minimizeBtn = document.querySelector('.iu-unfollow-modal-btn-minimize') as HTMLButtonElement;
      expect(minimizeBtn).not.toBeNull();

      minimizeBtn.click();

      expect(modal.isMinimized()).toBe(true);
      const miniWidget = document.querySelector('.iu-unfollow-mini-widget');
      expect(miniWidget).not.toBeNull();
    });

    it('deve refletir o progresso atualizado no mini-widget quando minimizado', () => {
      modal.minimize();

      const log = [
        UnfollowLogEntry.createSuccess(createUser(1)),
        UnfollowLogEntry.createSuccess(createUser(2))
      ];

      modal.update(33, log);

      const miniPct = document.querySelector('.iu-unfollow-mini-pct');
      const miniCount = document.querySelector('.iu-unfollow-mini-count');
      const miniBarFill = document.querySelector('.iu-unfollow-mini-bar-fill') as HTMLElement;

      expect(miniPct?.textContent).toBe('33%');
      expect(miniCount?.textContent).toContain('2/6');
      expect(miniBarFill.style.width).toBe('33%');
    });

    it('deve permitir pausar e retomar a partir do mini-widget', () => {
      const onPause = jest.fn();
      const onResume = jest.fn();
      const modalWithControls = new UnfollowProgressModal({
        totalCount: 6,
        onPause,
        onResume
      });
      modalWithControls.show();
      modalWithControls.minimize();

      const miniPauseBtn = document.querySelector('.iu-unfollow-mini-btn-pause') as HTMLButtonElement;
      expect(miniPauseBtn).not.toBeNull();

      // Pausa
      miniPauseBtn.click();
      expect(onPause).toHaveBeenCalledTimes(1);
      expect(miniPauseBtn.textContent).toContain('▶');

      // Retoma
      miniPauseBtn.click();
      expect(onResume).toHaveBeenCalledTimes(1);
      expect(miniPauseBtn.textContent).toContain('⏸');
    });

    it('deve expandir automaticamente para o modal de resumo quando complete() for chamado enquanto minimizado', () => {
      modal.minimize();
      expect(modal.isMinimized()).toBe(true);

      const log = [
        UnfollowLogEntry.createSuccess(createUser(1)),
        UnfollowLogEntry.createSuccess(createUser(2))
      ];

      modal.complete(log);

      expect(modal.isMinimized()).toBe(false);
      const miniWidget = document.querySelector('.iu-unfollow-mini-widget');
      expect(miniWidget).toBeNull();

      const overlay = document.querySelector('.iu-unfollow-modal-overlay') as HTMLElement;
      expect(overlay.style.display).not.toBe('none');
      expect(document.body.textContent).toContain('Concluído!');
      expect(document.body.textContent).toContain('2 removidos com sucesso');
    });

    it('deve limpar o mini-widget e restaurar o scroll do body ao chamar destroy() enquanto minimizado', () => {
      modal.minimize();
      expect(document.querySelector('.iu-unfollow-mini-widget')).not.toBeNull();

      modal.destroy();

      expect(document.querySelector('.iu-unfollow-mini-widget')).toBeNull();
      expect(document.body.style.overflow).toBe('');
    });

    it('deve aplicar classes e variáveis de morph ao minimizar com animação ativada', () => {
      jest.useFakeTimers();
      const overlay = document.querySelector('.iu-unfollow-modal-overlay') as HTMLElement;
      const modalCard = document.querySelector('.iu-unfollow-modal') as HTMLElement;

      modal.minimize(true, true);

      expect(overlay.classList.contains('iu-overlay-minimizing')).toBe(true);
      expect(modalCard.classList.contains('iu-modal-morph-to-mini')).toBe(true);
      expect(modalCard.style.getPropertyValue('--morph-x')).not.toBe('');
      expect(modalCard.style.getPropertyValue('--morph-y')).not.toBe('');
      expect(modalCard.style.getPropertyValue('--target-width')).toBe('320px');

      jest.advanceTimersByTime(280);

      expect(overlay.style.display).toBe('none');
      expect(overlay.classList.contains('iu-overlay-minimizing')).toBe(false);
      expect(modalCard.classList.contains('iu-modal-morph-to-mini')).toBe(false);
      expect(document.querySelector('.iu-unfollow-mini-widget')).not.toBeNull();
      jest.useRealTimers();
    });

    it('deve aplicar classes e variáveis de expansão reversa ao maximizar com animação ativada', () => {
      jest.useFakeTimers();
      modal.minimize(false);

      const overlay = document.querySelector('.iu-unfollow-modal-overlay') as HTMLElement;
      const modalCard = document.querySelector('.iu-unfollow-modal') as HTMLElement;

      modal.maximize(true, true);

      expect(overlay.style.display).toBe('');
      expect(overlay.classList.contains('iu-overlay-maximizing')).toBe(true);
      expect(modalCard.classList.contains('iu-modal-morph-from-mini')).toBe(true);
      expect(modalCard.style.getPropertyValue('--morph-x')).not.toBe('');
      expect(modalCard.style.getPropertyValue('--morph-y')).not.toBe('');

      jest.advanceTimersByTime(300);

      expect(overlay.classList.contains('iu-overlay-maximizing')).toBe(false);
      expect(modalCard.classList.contains('iu-modal-morph-from-mini')).toBe(false);
      expect(document.querySelector('.iu-unfollow-mini-widget')).toBeNull();
      jest.useRealTimers();
    });
  });
});
