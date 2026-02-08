// BackgroundService - Orchestrates background service worker
import { InstallHandler } from './InstallHandler.js';
import { MessageRouter } from './MessageRouter.js';
import { TabMonitor } from './TabMonitor.js';

/**
 * Serviço principal do background que orquestra todos os handlers
 */
export class BackgroundService {
  private _installHandler: InstallHandler;
  private _messageRouter: MessageRouter;
  private _tabMonitor: TabMonitor;

  constructor() {
    this._installHandler = new InstallHandler();
    this._messageRouter = new MessageRouter();
    this._tabMonitor = new TabMonitor();
  }

  initialize(): void {
    this._setupInstallListener();
    this._setupMessageListener();
    this._setupTabUpdateListener();
    this._setToolbarIcon();
  }

  /**
   * Gera ícone 👻 via OffscreenCanvas e define na toolbar
   */
  private _setToolbarIcon(): void {
    const sizes = [16, 32, 48, 128];
    const imageData: Record<number, ImageData> = {};

    try {
      for (const size of sizes) {
        const canvas = new OffscreenCanvas(size, size);
        const ctx = canvas.getContext('2d')!;
        ctx.font = `${Math.floor(size * 0.85)}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('👻', size / 2, size / 2);
        imageData[size] = ctx.getImageData(0, 0, size, size);
      }
      chrome.action.setIcon({ imageData });
    } catch (e) {
      console.warn('GhostGram: não foi possível gerar ícone da toolbar', e);
    }
  }

  private _setupInstallListener(): void {
    chrome.runtime.onInstalled.addListener((details: chrome.runtime.InstalledDetails) => {
      this._installHandler.handle(details);
    });
  }

  private _setupMessageListener(): void {
    chrome.runtime.onMessage.addListener((
      request: any,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: any) => void
    ) => {
      // No MV3, para respostas assíncronas, o handler deve retornar true de forma síncrona
      this._messageRouter.route(request, sender, sendResponse);
      return true;
    });
  }

  private _setupTabUpdateListener(): void {
    chrome.tabs.onUpdated.addListener((
      tabId: number,
      changeInfo: chrome.tabs.TabChangeInfo,
      tab: chrome.tabs.Tab
    ) => {
      this._tabMonitor.handle(tabId, changeInfo, tab);
    });
  }
}
