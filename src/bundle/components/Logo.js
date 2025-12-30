// Logo - Componente de apresentação (Vanilla JS)

/**
 * Cria o elemento SVG do logo do GhostGram
 * @returns {SVGElement} Elemento SVG criado
 */
export function Logo() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '32');
  svg.setAttribute('height', '32');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('fill', 'none');

  // Defs para gradiente
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

  // Gradiente rosa/roxo/magenta
  const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
  gradient.setAttribute('id', 'ghostGrad');
  gradient.setAttribute('x1', '0%');
  gradient.setAttribute('y1', '0%');
  gradient.setAttribute('x2', '100%');
  gradient.setAttribute('y2', '100%');

  const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop1.setAttribute('offset', '0%');
  stop1.setAttribute('stop-color', '#ff6b9d');

  const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop2.setAttribute('offset', '50%');
  stop2.setAttribute('stop-color', '#c44569');

  const stop3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop3.setAttribute('offset', '100%');
  stop3.setAttribute('stop-color', '#6b5b95');

  gradient.appendChild(stop1);
  gradient.appendChild(stop2);
  gradient.appendChild(stop3);
  defs.appendChild(gradient);

  // Glow filter
  const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
  filter.setAttribute('id', 'glow');
  filter.setAttribute('x', '-50%');
  filter.setAttribute('y', '-50%');
  filter.setAttribute('width', '200%');
  filter.setAttribute('height', '200%');

  const feGaussianBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
  feGaussianBlur.setAttribute('stdDeviation', '3');
  feGaussianBlur.setAttribute('result', 'coloredBlur');

  const feMerge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
  const feMergeNode1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
  feMergeNode1.setAttribute('in', 'coloredBlur');
  const feMergeNode2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
  feMergeNode2.setAttribute('in', 'SourceGraphic');
  feMerge.appendChild(feMergeNode1);
  feMerge.appendChild(feMergeNode2);

  filter.appendChild(feGaussianBlur);
  filter.appendChild(feMerge);
  defs.appendChild(filter);

  svg.appendChild(defs);

  // Corpo do fantasma
  const ghostBody = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  ghostBody.setAttribute('d', 'M50 8 C25 8 12 28 12 48 L12 82 Q17 88 22 82 Q27 88 32 82 Q37 88 42 82 Q47 88 52 82 Q57 88 62 82 Q67 88 72 82 Q77 88 82 82 Q87 88 88 82 L88 48 C88 28 75 8 50 8 Z');
  ghostBody.setAttribute('fill', 'url(#ghostGrad)');
  ghostBody.setAttribute('filter', 'url(#glow)');
  svg.appendChild(ghostBody);

  // Olho esquerdo (fundo branco)
  const leftEyeBg = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
  leftEyeBg.setAttribute('cx', '35');
  leftEyeBg.setAttribute('cy', '42');
  leftEyeBg.setAttribute('rx', '10');
  leftEyeBg.setAttribute('ry', '12');
  leftEyeBg.setAttribute('fill', '#FFFFFF');
  svg.appendChild(leftEyeBg);

  // Pupila esquerda
  const leftPupil = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
  leftPupil.setAttribute('cx', '38');
  leftPupil.setAttribute('cy', '45');
  leftPupil.setAttribute('rx', '5');
  leftPupil.setAttribute('ry', '6');
  leftPupil.setAttribute('fill', '#1a1a2e');
  svg.appendChild(leftPupil);

  // Olho direito (fundo branco)
  const rightEyeBg = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
  rightEyeBg.setAttribute('cx', '65');
  rightEyeBg.setAttribute('cy', '42');
  rightEyeBg.setAttribute('rx', '10');
  rightEyeBg.setAttribute('ry', '12');
  rightEyeBg.setAttribute('fill', '#FFFFFF');
  svg.appendChild(rightEyeBg);

  // Pupila direita
  const rightPupil = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
  rightPupil.setAttribute('cx', '68');
  rightPupil.setAttribute('cy', '45');
  rightPupil.setAttribute('rx', '5');
  rightPupil.setAttribute('ry', '6');
  rightPupil.setAttribute('fill', '#1a1a2e');
  svg.appendChild(rightPupil);

  return svg;
}
