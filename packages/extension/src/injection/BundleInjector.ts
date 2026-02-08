// BundleInjector - SRP: Single Responsibility (inject bundle script)
import { BUNDLE_SCRIPT_NAME } from '../constants/Constants.js';

/**
 * Injetor responsável por injetar o bundle script na página
 */
export class BundleInjector {
  private _chromeRuntime: typeof chrome.runtime;

  constructor(chromeRuntime: typeof chrome.runtime = chrome.runtime) {
    this._chromeRuntime = chromeRuntime;
  }

  inject(): void {
    console.log('[BundleInjector] Tentando injetar bundle...');
    console.log('[BundleInjector] Document ready state:', document.readyState);
    if (this._isDocumentReady()) {
      console.log('[BundleInjector] Documento pronto, executando injeção');
      this._execute();
      return;
    }
    console.log('[BundleInjector] Documento não pronto, aguardando DOMContentLoaded');
    this._waitForDocumentReady();
  }

  private _isDocumentReady(): boolean {
    return document.readyState !== 'loading';
  }

  private _waitForDocumentReady(): void {
    document.addEventListener('DOMContentLoaded', () => this._execute());
  }

  private _execute(): void {
    console.log('[BundleInjector] Executando injeção...');
    const script = this._createScript();
    console.log('[BundleInjector] Script criado:', script.src);
    this._attachScript(script);
    console.log('[BundleInjector] Script anexado ao DOM');
  }

  private _createScript(): HTMLScriptElement {
    const script = document.createElement('script');
    const url = this._chromeRuntime.getURL(BUNDLE_SCRIPT_NAME);
    script.src = url;
    console.log('[BundleInjector] URL do bundle:', url);
    script.onload = () => {
      console.log('[BundleInjector] Bundle carregado com sucesso!');
      script.remove();
    };
    script.onerror = (error: Event | string) => {
      console.error('[BundleInjector] Erro ao carregar bundle:', error);
      this._handleError();
    };
    return script;
  }

  private _attachScript(script: HTMLScriptElement): void {
    (document.head || document.documentElement).appendChild(script);
  }

  private _handleError(): void {
    console.error('Failed to load bundle.js. Make sure the original bundle code is in bundle.js');
  }
}
