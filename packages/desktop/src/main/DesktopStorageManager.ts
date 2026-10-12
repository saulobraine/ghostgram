import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

export interface WhitelistItem {
  id: string;
  username: string;
  addedAt: number;
}

export interface DesktopAppSettings {
  unfollowDelayMin: number;
  unfollowDelayMax: number;
  consecutiveUnfollowLimit: number;
  cooldownSeconds: number;
  theme: 'dark' | 'light' | 'system';
}

export interface ActionHistoryEntry {
  id: string;
  type: 'scan' | 'unfollow';
  timestamp: number;
  details: string;
  successCount?: number;
  totalCount?: number;
}

const DEFAULT_SETTINGS: DesktopAppSettings = {
  unfollowDelayMin: 4,
  unfollowDelayMax: 8,
  consecutiveUnfollowLimit: 5,
  cooldownSeconds: 300,
  theme: 'dark',
};

export class DesktopStorageManager {
  private baseDir: string;

  constructor(customDir?: string) {
    if (customDir) {
      this.baseDir = customDir;
    } else {
      try {
        this.baseDir = path.join(app.getPath('userData'), 'ghostgram-storage');
      } catch {
        // Fallback para ambiente de teste sem Electron app pronto
        this.baseDir = path.join(process.cwd(), '.ghostgram-storage-test');
      }
    }
    this.ensureDirExists();
  }

  private ensureDirExists(): void {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  private getFilePath(filename: string): string {
    return path.join(this.baseDir, filename);
  }

  private readFileSafely<T>(filename: string, fallback: T): T {
    try {
      const filePath = this.getFilePath(filename);
      if (!fs.existsSync(filePath)) {
        return fallback;
      }
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data) as T;
    } catch {
      return fallback;
    }
  }

  private writeFileSafely<T>(filename: string, data: T): void {
    this.ensureDirExists();
    const filePath = this.getFilePath(filename);
    const tempPath = `${filePath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, filePath);
  }

  // --- WHITELIST ---
  public getWhitelist(): WhitelistItem[] {
    return this.readFileSafely<WhitelistItem[]>('whitelist.json', []);
  }

  public saveWhitelist(items: WhitelistItem[]): void {
    this.writeFileSafely('whitelist.json', items);
  }

  public addToWhitelist(item: Omit<WhitelistItem, 'addedAt'>): WhitelistItem[] {
    const list = this.getWhitelist();
    if (!list.some((w) => w.id === item.id || w.username.toLowerCase() === item.username.toLowerCase())) {
      list.push({ ...item, addedAt: Date.now() });
      this.saveWhitelist(list);
    }
    return list;
  }

  public removeFromWhitelist(idOrUsername: string): WhitelistItem[] {
    const list = this.getWhitelist().filter(
      (w) => w.id !== idOrUsername && w.username.toLowerCase() !== idOrUsername.toLowerCase()
    );
    this.saveWhitelist(list);
    return list;
  }

  // --- CONFIGURAÇÕES ---
  public getSettings(): DesktopAppSettings {
    return this.readFileSafely<DesktopAppSettings>('settings.json', DEFAULT_SETTINGS);
  }

  public saveSettings(settings: Partial<DesktopAppSettings>): DesktopAppSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    this.writeFileSafely('settings.json', updated);
    return updated;
  }

  // --- HISTÓRICO ---
  public getHistory(): ActionHistoryEntry[] {
    return this.readFileSafely<ActionHistoryEntry[]>('history.json', []);
  }

  public addHistoryEntry(entry: Omit<ActionHistoryEntry, 'id' | 'timestamp'>): ActionHistoryEntry {
    const list = this.getHistory();
    const newEntry: ActionHistoryEntry = {
      ...entry,
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
    };
    list.unshift(newEntry);
    // Limitar histórico aos últimos 100 registros
    const trimmed = list.slice(0, 100);
    this.writeFileSafely('history.json', trimmed);
    return newEntry;
  }

  // --- EXPORTAÇÃO ---
  public exportToCsv(data: Record<string, unknown>[]): string {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map((row) =>
        headers
          .map((h) => {
            const val = row[h];
            const str = val === null || val === undefined ? '' : String(val);
            return `"${str.replace(/"/g, '""')}"`;
          })
          .join(',')
      ),
    ];
    return csvRows.join('\n');
  }
}
