import { app, BrowserWindow, ipcMain, shell } from 'electron';
import * as path from 'path';

// Configurar nome e diretório userData limpo antes de qualquer inicialização do Chromium
app.name = 'GhostGram';
app.setAppUserModelId('com.ghostgram.desktop');
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');

try {
  const customUserData = path.join(app.getPath('appData'), 'GhostGram');
  app.setPath('userData', customUserData);
} catch {
  // Ignorar caso appData ainda não esteja acessível
}

import { InstagramSessionManager } from './InstagramSessionManager';
import { DesktopInstagramApiClient } from './DesktopInstagramApiClient';
import { DesktopScanEngine } from './DesktopScanEngine';
import { DesktopUnfollowEngine, UnfollowTarget } from './DesktopUnfollowEngine';
import { DesktopStorageManager, WhitelistItem, DesktopAppSettings } from './DesktopStorageManager';

const DEV_SERVER_URL = 'http://localhost:5173';
const ALLOWED_EXTERNAL_HOSTS = new Set(['instagram.com', 'www.instagram.com', 'github.com']);

let mainWindow: BrowserWindow | null = null;

const sessionManager = new InstagramSessionManager();
const apiClient = new DesktopInstagramApiClient();
const scanEngine = new DesktopScanEngine(apiClient);
const unfollowEngine = new DesktopUnfollowEngine(apiClient);
const storageManager = new DesktopStorageManager();

function isAllowedExternalUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && ALLOWED_EXTERNAL_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 760,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#090d16',
    title: 'GhostGram Desktop',
    autoHideMenuBar: true,
    show: true,
    center: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Necessário para carregar scripts ES Module locais via file://
      sandbox: false,
    },
  });

  mainWindow.webContents.on('console-message', (_, level, message, line, sourceId) => {
    console.log(`[Renderer Log ${level}] ${message} (${sourceId}:${line})`);
  });

  mainWindow.webContents.on('did-fail-load', (_, errorCode, errorDescription, validatedURL) => {
    console.error(`[did-fail-load] URL: ${validatedURL}, Error: ${errorCode} (${errorDescription})`);
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Interface carregada com sucesso!');
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    // Permitir navegação interna do aplicativo (seja file:// ou dev server)
    if (url.startsWith('file://') || (process.env.VITE_DEV_SERVER_URL && url.startsWith(process.env.VITE_DEV_SERVER_URL))) {
      return;
    }

    event.preventDefault();
    if (isAllowedExternalUrl(url)) {
      void shell.openExternal(url);
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedExternalUrl(url)) {
      void shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  const localIndexPath = path.join(__dirname, '../renderer/index.html');

  if (process.env.VITE_DEV_SERVER_URL) {
    console.log('Ambiente de desenvolvimento ativo. Carregando:', process.env.VITE_DEV_SERVER_URL);
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL).catch(() => {
      console.log('Dev server offline. Carregando interface compilada localmente:', localIndexPath);
      if (mainWindow) {
        void mainWindow.loadFile(localIndexPath);
      }
    });
  } else {
    console.log('Carregando interface compilada localmente:', localIndexPath);
    void mainWindow.loadFile(localIndexPath).catch((err) => {
      console.error('Erro crítico ao carregar interface local:', err);
    });
  }

  mainWindow.show();
  mainWindow.focus();
  mainWindow.setAlwaysOnTop(true);
  setTimeout(() => {
    mainWindow?.setAlwaysOnTop(false);
  }, 1000);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// --- REGISTRO DE IPC ---

// 1. Autenticação e Sessão
ipcMain.handle('auth:login', async () => {
  const success = await sessionManager.openLoginWindow(mainWindow);
  if (!success) {
    return { success: false, error: 'Janela fechada ou login não concluído' };
  }
  const cookies = await sessionManager.getCookies();
  return {
    success: true,
    userId: cookies.ds_user_id,
  };
});

ipcMain.handle('auth:check-session', async () => {
  const cookies = await sessionManager.getCookies();
  const isAuthenticated = Boolean(cookies.ds_user_id && cookies.sessionid);
  let profile = null;

  if (isAuthenticated && cookies.ds_user_id) {
    try {
      profile = await apiClient.getUserInfo(cookies.ds_user_id);
    } catch {
      // Falha não crítica se rate-limited no user info
    }
  }

  return {
    isAuthenticated,
    userId: cookies.ds_user_id,
    profile,
  };
});

ipcMain.handle('auth:logout', async () => {
  await sessionManager.logout();
  return { success: true };
});

// 2. Escaneamento
ipcMain.handle('scan:start', async () => {
  const cookies = await sessionManager.getCookies();
  if (!cookies.ds_user_id) {
    throw new Error('Usuário não autenticado');
  }

  const results = await scanEngine.runScan(cookies.ds_user_id, mainWindow);

  storageManager.addHistoryEntry({
    type: 'scan',
    details: `Escaneamento executado: ${results.length} perfis analisados.`,
    totalCount: results.length,
    successCount: results.filter((r) => !r.followsViewer).length,
  });

  return results;
});

ipcMain.handle('scan:pause', () => {
  scanEngine.pause();
  return { success: true };
});

ipcMain.handle('scan:resume', () => {
  scanEngine.resume();
  return { success: true };
});

ipcMain.handle('scan:cancel', () => {
  scanEngine.cancel();
  return { success: true };
});

ipcMain.handle('scan:status', () => {
  return scanEngine.getStatus();
});

// 3. Unfollow em Lote
ipcMain.handle('unfollow:start', async (_, targets: UnfollowTarget[]) => {
  const cookies = await sessionManager.getCookies();
  if (!cookies.csrftoken) {
    throw new Error('CSRF Token ausente');
  }

  const results = await unfollowEngine.runUnfollowQueue(targets, cookies.csrftoken, mainWindow);

  const successCount = results.filter((r) => r.success).length;
  storageManager.addHistoryEntry({
    type: 'unfollow',
    details: `Unfollow em lote: ${successCount} de ${targets.length} concluídos com sucesso.`,
    totalCount: targets.length,
    successCount,
  });

  return results;
});

ipcMain.handle('unfollow:pause', () => {
  unfollowEngine.pause();
  return { success: true };
});

ipcMain.handle('unfollow:resume', () => {
  unfollowEngine.resume();
  return { success: true };
});

ipcMain.handle('unfollow:cancel', () => {
  unfollowEngine.cancel();
  return { success: true };
});

// 4. Armazenamento e Whitelist
ipcMain.handle('storage:get-whitelist', () => {
  return storageManager.getWhitelist();
});

ipcMain.handle('storage:save-whitelist', (_, items: WhitelistItem[]) => {
  storageManager.saveWhitelist(items);
  return { success: true };
});

ipcMain.handle('storage:add-whitelist', (_, item: Omit<WhitelistItem, 'addedAt'>) => {
  return storageManager.addToWhitelist(item);
});

ipcMain.handle('storage:remove-whitelist', (_, idOrUsername: string) => {
  return storageManager.removeFromWhitelist(idOrUsername);
});

ipcMain.handle('storage:get-settings', () => {
  return storageManager.getSettings();
});

ipcMain.handle('storage:save-settings', (_, settings: Partial<DesktopAppSettings>) => {
  return storageManager.saveSettings(settings);
});

ipcMain.handle('storage:get-history', () => {
  return storageManager.getHistory();
});

ipcMain.handle('storage:export-csv', (_, data: Record<string, unknown>[]) => {
  return storageManager.exportToCsv(data);
});

// --- CICLO DE VIDA DO APP ---

app.whenReady().then(() => {
  createWindow();
  console.log('[GhostGram Desktop] Aplicação pronta e janela principal criada.');
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

