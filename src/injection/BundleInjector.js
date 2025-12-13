// BundleInjector - SRP: Single Responsibility (inject bundle script)
import { BUNDLE_SCRIPT_NAME } from '../constants/Constants.js';

export class BundleInjector {
  constructor(chromeRuntime) {
    this._chromeRuntime = chromeRuntime;
  }

  inject() {
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

  _isDocumentReady() {
    return document.readyState !== 'loading';
  }

  _waitForDocumentReady() {
    document.addEventListener('DOMContentLoaded', () => this._execute());
  }

  _execute() {
    console.log('[BundleInjector] Executando injeção...');
    const script = this._createScript();
    console.log('[BundleInjector] Script criado:', script.src);
    this._attachScript(script);
    console.log('[BundleInjector] Script anexado ao DOM');
  }

  _createScript() {
    const script = document.createElement('script');
    const url = this._chromeRuntime.getURL(BUNDLE_SCRIPT_NAME);
    script.src = url;
    console.log('[BundleInjector] URL do bundle:', url);
    script.onload = () => {
      console.log('[BundleInjector] Bundle carregado com sucesso!');
      script.remove();
    };
    script.onerror = (error) => {
      console.error('[BundleInjector] Erro ao carregar bundle:', error);
      this._handleError();
    };
    return script;
  }

  _attachScript(script) {
    (document.head || document.documentElement).appendChild(script);
  }

  _handleError() {
    console.error('Failed to load bundle.js. Make sure the original bundle code is in bundle.js');
  }
}

