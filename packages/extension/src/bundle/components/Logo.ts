// Logo - Componente de apresentação (Vanilla JS)

const GHOST_EMOJI = '👻';

/**
 * Retorna o emoji do GhostGram.
 * Ponto centralizado para definição do ícone em toda a extensão.
 */
export function getIcon(): string {
  return GHOST_EMOJI;
}

/**
 * Cria o elemento do logo do GhostGram usando emoji
 */
export function Logo(): HTMLSpanElement {
  const span = document.createElement('span');
  span.textContent = getIcon();
  span.style.fontSize = '28px';
  span.style.lineHeight = '1';
  return span;
}
