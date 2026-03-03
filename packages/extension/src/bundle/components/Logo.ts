// Logo - Componente de apresentação (Vanilla JS)

/**
 * Retorna a URL do ícone PNG do GhostGram.
 * Ponto centralizado para definição do ícone em toda a extensão.
 */
export function getIconUrl(): string {
  return chrome.runtime.getURL('icons/icon48.png');
}

/**
 * Retorna o elemento <img> inline do ícone do GhostGram.
 * Usado em textos onde o ícone precisa aparecer inline.
 */
export function getIcon(): string {
  const url = typeof chrome !== 'undefined' && chrome.runtime ? getIconUrl() : '';
  return `<img src="${url}" alt="GhostGram" width="16" height="16" style="vertical-align:middle;margin-right:4px;">`;
}

/**
 * Cria o elemento <img> do logo do GhostGram usando PNG
 */
export function Logo(): HTMLImageElement {
  const img = document.createElement('img');
  img.src = getIconUrl();
  img.alt = 'GhostGram';
  img.width = 28;
  img.height = 28;
  img.style.verticalAlign = 'middle';
  return img;
}
