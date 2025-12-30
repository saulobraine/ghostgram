// Content script - Ponto de entrada
// Carrega o módulo principal dinamicamente

(async () => {
  // Evita execução duplicada
  if (window.__GHOSTGRAM_CONTENT_LOADED__) {
    return;
  }
  window.__GHOSTGRAM_CONTENT_LOADED__ = true;

  console.log('[GhostGram] Carregando extensão...');

  try {
    // Importa o módulo principal
    const moduleUrl = chrome.runtime.getURL('content-main.js');
    await import(moduleUrl);
    console.log('[GhostGram] Módulo carregado com sucesso');
  } catch (error) {
    console.error('[GhostGram] Erro ao carregar módulo:', error);
  }
})();
