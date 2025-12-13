// Content script entry point - Normal script (no ES6 modules)
// This file loads content-main.js via dynamic import()

console.log('[ContentScript] Entry point carregado!', new Date().toISOString());
console.log('[ContentScript] Chrome runtime ID:', chrome.runtime.id);

(async () => {
  try {
    // Carrega o módulo principal usando import() dinâmico
    const src = chrome.runtime.getURL('content-main.js');
    console.log('[ContentScript] Carregando módulo principal de:', src);

    const contentMain = await import(src);
    console.log('[ContentScript] Módulo principal carregado com sucesso');
    console.log('[ContentScript] Exports disponíveis:', Object.keys(contentMain));

    // Inicializa o ContentScript
    if (contentMain.initializeContentScript) {
      console.log('[ContentScript] Inicializando ContentScript...');
      contentMain.initializeContentScript();
    } else {
      console.error('[ContentScript] Função initializeContentScript não encontrada no módulo');
      console.error('[ContentScript] Exports disponíveis:', Object.keys(contentMain));
    }
  } catch (error) {
    console.error('[ContentScript] Erro ao carregar módulo principal:', error);
    console.error('[ContentScript] Stack trace:', error.stack);
    console.error('[ContentScript] Detalhes do erro:', {
      message: error.message,
      name: error.name,
      fileName: error.fileName,
      lineNumber: error.lineNumber
    });
  }
})();
