import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('ghostgramDesktop', Object.freeze({}));
