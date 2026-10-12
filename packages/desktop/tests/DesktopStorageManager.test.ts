import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { DesktopStorageManager } from '../src/main/DesktopStorageManager';

describe('DesktopStorageManager', () => {
  const testDir = path.join(__dirname, '.test-storage');
  let storage: DesktopStorageManager;

  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    storage = new DesktopStorageManager(testDir);
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('deve inicializar com whitelist vazia e adicionar itens corretamente', () => {
    expect(storage.getWhitelist()).toEqual([]);

    const updated = storage.addToWhitelist({ id: '123', username: 'user1' });
    expect(updated.length).toBe(1);
    expect(updated[0].username).toBe('user1');

    // Não deve duplicar
    const dup = storage.addToWhitelist({ id: '123', username: 'user1' });
    expect(dup.length).toBe(1);
  });

  it('deve remover itens da whitelist por id ou username', () => {
    storage.addToWhitelist({ id: '123', username: 'user1' });
    storage.addToWhitelist({ id: '456', username: 'user2' });

    expect(storage.getWhitelist().length).toBe(2);

    const afterRemoveId = storage.removeFromWhitelist('123');
    expect(afterRemoveId.length).toBe(1);
    expect(afterRemoveId[0].username).toBe('user2');

    const afterRemoveUsername = storage.removeFromWhitelist('user2');
    expect(afterRemoveUsername.length).toBe(0);
  });

  it('deve salvar e recuperar configurações personalizadas', () => {
    const defaultSettings = storage.getSettings();
    expect(defaultSettings.unfollowDelayMin).toBe(4);
    expect(defaultSettings.cooldownSeconds).toBe(300);

    const updated = storage.saveSettings({ unfollowDelayMin: 6, cooldownSeconds: 180 });
    expect(updated.unfollowDelayMin).toBe(6);
    expect(updated.cooldownSeconds).toBe(180);

    const reloaded = storage.getSettings();
    expect(reloaded.unfollowDelayMin).toBe(6);
  });

  it('deve registrar histórico de ações com timestamp', () => {
    expect(storage.getHistory()).toEqual([]);

    storage.addHistoryEntry({
      type: 'scan',
      details: 'Scan concluído com 50 perfis',
      totalCount: 50,
      successCount: 12,
    });

    const history = storage.getHistory();
    expect(history.length).toBe(1);
    expect(history[0].type).toBe('scan');
    expect(history[0].successCount).toBe(12);
  });

  it('deve exportar dados para formato CSV corretamente', () => {
    const data = [
      { username: 'maria', full_name: 'Maria Silva', follows_viewer: 'nao' },
      { username: 'joao', full_name: 'João Souza, Jr.', follows_viewer: 'sim' },
    ];

    const csv = storage.exportToCsv(data);
    expect(csv).toContain('username,full_name,follows_viewer');
    expect(csv).toContain('"maria","Maria Silva","nao"');
    expect(csv).toContain('"joao","João Souza, Jr.","sim"');
  });
});
