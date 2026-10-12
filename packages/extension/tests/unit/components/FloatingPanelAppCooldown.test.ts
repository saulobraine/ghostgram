// Testes unitários - Cooldown de 24h para unfollow no FloatingPanelApp
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { FloatingPanelApp } from '../../../src/bundle/FloatingPanelApp.js';
import { STORAGE_KEYS, UNFOLLOW_COOLDOWN_MS } from '../../../src/constants/Constants.js';

describe('FloatingPanelApp - Cooldown de 24h pós erro 400', () => {
  let app: any;
  let alertMock: jest.Mock;

  beforeEach(() => {
    alertMock = jest.fn();
    global.alert = alertMock as any;
    app = new FloatingPanelApp();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve carregar cooldown ativo do storage na inicialização', async () => {
    const futureTime = Date.now() + 10 * 60 * 60 * 1000; // 10 horas no futuro
    jest.spyOn(app._localStorage, 'get').mockImplementation(async (key: string) => {
      if (key === STORAGE_KEYS.UNFOLLOW_BLOCK_UNTIL) {
        return futureTime;
      }
      return null;
    });

    await app._loadUnfollowCooldown();

    expect(app._state.unfollowBlockUntil).toBe(futureTime);
    expect(app._isUnfollowCooldownActive()).toBe(true);
  });

  it('deve limpar cooldown expirado do storage', async () => {
    const pastTime = Date.now() - 1000; // 1 segundo no passado
    jest.spyOn(app._localStorage, 'get').mockImplementation(async (key: string) => {
      if (key === STORAGE_KEYS.UNFOLLOW_BLOCK_UNTIL) {
        return pastTime;
      }
      return null;
    });
    const removeSpy = jest.spyOn(app._localStorage, 'remove').mockResolvedValue(undefined as any);

    await app._loadUnfollowCooldown();

    expect(app._state.unfollowBlockUntil).toBeNull();
    expect(removeSpy).toHaveBeenCalledWith(STORAGE_KEYS.UNFOLLOW_BLOCK_UNTIL);
    expect(app._isUnfollowCooldownActive()).toBe(false);
  });

  it('deve bloquear _handleStartUnfollow quando cooldown estiver ativo', async () => {
    app._state.unfollowBlockUntil = Date.now() + 5 * 60 * 60 * 1000;
    app._state.selectedUsers = new Set(['123']);
    app._state.nonFollowers = [{ getId: () => '123' }];

    jest.spyOn(app, '_loadUnfollowCooldown').mockResolvedValue(undefined);

    await app._handleStartUnfollow();

    expect(alertMock).toHaveBeenCalledTimes(1);
    expect(alertMock.mock.calls[0][0]).toContain('bloqueada temporariamente');
    expect(alertMock.mock.calls[0][0]).toContain('Tempo restante');
    expect(app._state.isUnfollowing).toBe(false);
  });

  it('deve definir cooldown de 24h ao chamar _setUnfollowCooldown', async () => {
    const setSpy = jest.spyOn(app._localStorage, 'set').mockResolvedValue(undefined as any);
    const before = Date.now();

    await app._setUnfollowCooldown();

    expect(app._state.unfollowBlockUntil).toBeGreaterThanOrEqual(before + UNFOLLOW_COOLDOWN_MS);
    expect(setSpy).toHaveBeenCalledWith(
      STORAGE_KEYS.UNFOLLOW_BLOCK_UNTIL,
      expect.any(Number)
    );
  });

  it('deve formatar tempo restante corretamente em horas e minutos', () => {
    const targetMs = Date.now() + (2 * 3600 * 1000 + 15 * 60 * 1000);
    const text = app._formatRemainingCooldown(targetMs);
    expect(text).toMatch(/2h 1[5-6]m/);
  });
});

describe('FloatingPanelApp - Cooldown de pelo menos 10 minutos pós checkpoint no scan', () => {
  let app: any;

  beforeEach(() => {
    app = new FloatingPanelApp();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve carregar cooldown ativo de scan do storage', async () => {
    const futureTime = Date.now() + 10 * 60 * 1000;
    jest.spyOn(app._localStorage, 'get').mockImplementation(async (key: string) => {
      if (key === STORAGE_KEYS.SCAN_BLOCK_UNTIL) return futureTime;
      if (key === STORAGE_KEYS.SCAN_LAST_ERROR) return 'Checkpoint solicitado';
      return null;
    });

    await app._loadScanCooldown();

    expect(app._state.scanBlockUntil).toBe(futureTime);
    expect(app._state.scanErrorMessage).toBe('Checkpoint solicitado');
    expect(app._isScanCooldownActive()).toBe(true);
  });

  it('deve limpar cooldown de scan expirado do storage', async () => {
    const pastTime = Date.now() - 5000;
    jest.spyOn(app._localStorage, 'get').mockImplementation(async (key: string) => {
      if (key === STORAGE_KEYS.SCAN_BLOCK_UNTIL) return pastTime;
      return null;
    });
    const removeSpy = jest.spyOn(app._localStorage, 'remove').mockResolvedValue(undefined as any);

    await app._loadScanCooldown();

    expect(app._state.scanBlockUntil).toBeNull();
    expect(removeSpy).toHaveBeenCalledWith(STORAGE_KEYS.SCAN_BLOCK_UNTIL);
    expect(removeSpy).toHaveBeenCalledWith(STORAGE_KEYS.SCAN_LAST_ERROR);
    expect(app._isScanCooldownActive()).toBe(false);
  });

  it('deve definir cooldown de pelo menos 10 minutos ao acionar _setScanCooldown', async () => {
    const setSpy = jest.spyOn(app._localStorage, 'set').mockResolvedValue(undefined as any);
    const before = Date.now();

    await app._setScanCooldown(10 * 60 * 1000, 'Checkpoint solicitado');

    expect(app._state.scanBlockUntil).toBeGreaterThanOrEqual(before + 10 * 60 * 1000);
    expect(app._state.scanErrorMessage).toBe('Checkpoint solicitado');
    expect(setSpy).toHaveBeenCalledWith(STORAGE_KEYS.SCAN_BLOCK_UNTIL, expect.any(Number));
    expect(setSpy).toHaveBeenCalledWith(STORAGE_KEYS.SCAN_LAST_ERROR, 'Checkpoint solicitado');
  });

  it('deve bloquear _handleStartScan quando scanBlockUntil estiver ativo', async () => {
    app._state.scanBlockUntil = Date.now() + 8 * 60 * 1000;
    const updateSpy = jest.spyOn(app, '_update').mockImplementation(() => {});

    await app._handleStartScan();

    expect(app._state.isScanning).toBe(false);
    expect(app._state.scanErrorMessage).toContain('Intervalo de proteção ativo');
    expect(updateSpy).toHaveBeenCalled();
  });
});
