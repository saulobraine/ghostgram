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
   * Define ícone da toolbar usando PNGs estáticos
   */
  private _setToolbarIcon(): void {
    try {
      chrome.action.setIcon({
        path: {
          16: 'icons/icon16.png',
          48: 'icons/icon48.png',
          128: 'icons/icon128.png'
        }
      });
    } catch (e) {
      console.warn('GhostGram: não foi possível definir ícone da toolbar', e);
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
