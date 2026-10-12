import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export interface GhostgramDesktopBridge {
  auth: {
    login: () => Promise<{ success: boolean; userId?: string; error?: string }>;
    checkSession: () => Promise<{ isAuthenticated: boolean; userId: string | null; profile: any }>;
    logout: () => Promise<{ success: boolean }>;
  };
  scan: {
    start: () => Promise<any[]>;
    pause: () => Promise<{ success: boolean }>;
    resume: () => Promise<{ success: boolean }>;
    cancel: () => Promise<{ success: boolean }>;
    onProgress: (callback: (payload: any) => void) => () => void;
  };
  unfollow: {
    start: (targets: { id: string; username: string }[]) => Promise<any[]>;
    pause: () => Promise<{ success: boolean }>;
    resume: () => Promise<{ success: boolean }>;
    cancel: () => Promise<{ success: boolean }>;
    onProgress: (callback: (payload: any) => void) => () => void;
  };
  storage: {
    getWhitelist: () => Promise<any[]>;
    saveWhitelist: (items: any[]) => Promise<{ success: boolean }>;
    addToWhitelist: (item: { id: string; username: string }) => Promise<any[]>;
    removeFromWhitelist: (idOrUsername: string) => Promise<any[]>;
    getSettings: () => Promise<any>;
    saveSettings: (settings: any) => Promise<any>;
    getHistory: () => Promise<any[]>;
    exportCsv: (data: Record<string, any>[]) => Promise<string>;
  };
}

const desktopBridge: GhostgramDesktopBridge = {
  auth: {
    login: () => ipcRenderer.invoke('auth:login'),
    checkSession: () => ipcRenderer.invoke('auth:check-session'),
    logout: () => ipcRenderer.invoke('auth:logout'),
  },
  scan: {
    start: () => ipcRenderer.invoke('scan:start'),
    pause: () => ipcRenderer.invoke('scan:pause'),
    resume: () => ipcRenderer.invoke('scan:resume'),
    cancel: () => ipcRenderer.invoke('scan:cancel'),
    onProgress: (callback: (payload: any) => void) => {
      const handler = (_: IpcRendererEvent, data: any) => callback(data);
      ipcRenderer.on('scan:progress', handler);
      return () => {
        ipcRenderer.removeListener('scan:progress', handler);
      };
    },
  },
  unfollow: {
    start: (targets) => ipcRenderer.invoke('unfollow:start', targets),
    pause: () => ipcRenderer.invoke('unfollow:pause'),
    resume: () => ipcRenderer.invoke('unfollow:resume'),
    cancel: () => ipcRenderer.invoke('unfollow:cancel'),
    onProgress: (callback: (payload: any) => void) => {
      const handler = (_: IpcRendererEvent, data: any) => callback(data);
      ipcRenderer.on('unfollow:progress', handler);
      return () => {
        ipcRenderer.removeListener('unfollow:progress', handler);
      };
    },
  },
  storage: {
    getWhitelist: () => ipcRenderer.invoke('storage:get-whitelist'),
    saveWhitelist: (items) => ipcRenderer.invoke('storage:save-whitelist', items),
    addToWhitelist: (item) => ipcRenderer.invoke('storage:add-whitelist', item),
    removeFromWhitelist: (idOrUsername) => ipcRenderer.invoke('storage:remove-whitelist', idOrUsername),
    getSettings: () => ipcRenderer.invoke('storage:get-settings'),
    saveSettings: (settings) => ipcRenderer.invoke('storage:save-settings', settings),
    getHistory: () => ipcRenderer.invoke('storage:get-history'),
    exportCsv: (data) => ipcRenderer.invoke('storage:export-csv', data),
  },
};

contextBridge.exposeInMainWorld('ghostgramDesktop', desktopBridge);
