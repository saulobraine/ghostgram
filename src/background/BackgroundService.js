// BackgroundService - Orchestrates background service worker
import { InstallHandler } from './InstallHandler.js';
import { MessageRouter } from './MessageRouter.js';
import { TabMonitor } from './TabMonitor.js';

export class BackgroundService {
  constructor() {
    this._installHandler = new InstallHandler();
    this._messageRouter = new MessageRouter();
    this._tabMonitor = new TabMonitor();
  }

  initialize() {
    this._setupInstallListener();
    this._setupMessageListener();
    this._setupTabUpdateListener();
  }

  _setupInstallListener() {
    chrome.runtime.onInstalled.addListener(details => {
      this._installHandler.handle(details);
    });
  }

  _setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      return this._messageRouter.route(request, sender, sendResponse);
    });
  }

  _setupTabUpdateListener() {
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this._tabMonitor.handle(tabId, changeInfo, tab);
    });
  }
}

