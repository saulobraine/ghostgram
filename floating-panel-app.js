// FloatingPanelApp entry point - Vanilla JS version
// This file loads the FloatingPanelApp class dynamically and renders it without React

// Guard to prevent multiple executions
if (window.__FLOATING_PANEL_APP_LOADED__) {
  console.log('[FloatingPanelApp] Já foi carregado, ignorando execução duplicada');
} else {
  window.__FLOATING_PANEL_APP_LOADED__ = true;

  (async () => {
    try {
      // Initialize i18n service first
      const { i18nService } = await import('./src/bundle/utils/I18nService.js');
      await i18nService.initialize();

      // Load FloatingPanelApp (vanilla JS version)
      const { FloatingPanelApp } = await import('./src/bundle/FloatingPanelApp.js');

      // Create container for FloatingPanel without clearing body
      let container = document.getElementById('instagram-unfollowers-floating-panel');
      if (!container) {
        container = document.createElement('div');
        container.id = 'instagram-unfollowers-floating-panel';
        document.body.appendChild(container);
      } else {
        // Container already exists - check if already initialized
        if (container.__FLOATING_PANEL_APP__) {
          console.log('[FloatingPanelApp] Container já tem app inicializado, ignorando inicialização duplicada');
          return;
        }
      }

      // Create and initialize FloatingPanelApp instance
      const app = new FloatingPanelApp();
      container.__FLOATING_PANEL_APP__ = app; // Store reference
      app.init(container);

      // Listen for messages from content script (only add once)
      if (!window.__FLOATING_PANEL_MESSAGE_LISTENER__) {
        const messageHandler = (event) => {
          if (event.data && event.data.type === 'INSTAGRAM_UNFOLLOWERS_START_SCAN') {
            const container = document.getElementById('instagram-unfollowers-floating-panel');
            if (container && container.__FLOATING_PANEL_APP__) {
              container.__FLOATING_PANEL_APP__.handleMessage(event.data);
            }
          }
        };
        window.addEventListener('message', messageHandler);
        window.__FLOATING_PANEL_MESSAGE_LISTENER__ = messageHandler;
      }

      console.log('[FloatingPanelApp] Renderizado sem React (Vanilla JS)');
    } catch (error) {
      console.error('[FloatingPanelApp] Erro ao carregar:', error);
      window.__FLOATING_PANEL_APP_LOADED__ = false; // Reset on error
    }
  })();
}
