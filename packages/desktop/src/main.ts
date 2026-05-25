import { app, BrowserWindow, shell } from 'electron';
import * as path from 'path';

const DEV_SERVER_URL = 'http://localhost:8081';
const ALLOWED_EXTERNAL_HOSTS = new Set(['instagram.com', 'www.instagram.com']);

let mainWindow: BrowserWindow | null = null;

if (require('electron-squirrel-startup')) {
  app.quit();
}

function isAllowedAppUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);

    if (app.isPackaged) {
      return parsedUrl.protocol === 'file:';
    }

    return parsedUrl.origin === DEV_SERVER_URL;
  } catch {
    return false;
  }
}

function isAllowedExternalUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'https:' && ALLOWED_EXTERNAL_HOSTS.has(parsedUrl.hostname);
  } catch {
    return false;
  }
}

function openExternalUrl(url: string): void {
  if (!isAllowedExternalUrl(url)) {
    return;
  }

  void shell.openExternal(url);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (isAllowedAppUrl(url)) {
      return;
    }

    event.preventDefault();
    openExternalUrl(url);
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    openExternalUrl(url);
    return { action: 'deny' };
  });

  if (!app.isPackaged) {
    console.log('Running in development mode');
    void mainWindow.loadURL(DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    console.log('Running in production mode');
    void mainWindow.loadFile(path.join(__dirname, '../../app/dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

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
