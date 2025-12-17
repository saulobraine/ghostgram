// Logo - Presentation component (Vanilla JS)

export function Logo() {
  // Create SVG element using createElementNS for proper SVG rendering
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '32');
  svg.setAttribute('height', '32');
  // Tighter viewBox so logo fills available space better
  svg.setAttribute('viewBox', '26 14 76 76');
  svg.setAttribute('fill', 'none');

  // Create defs element
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

  // Create linearGradient
  const linearGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
  linearGradient.setAttribute('id', 'ghostGradLogo');
  linearGradient.setAttribute('x1', '0%');
  linearGradient.setAttribute('y1', '0%');
  linearGradient.setAttribute('x2', '100%');
  linearGradient.setAttribute('y2', '100%');

  const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop1.setAttribute('offset', '0%');
  stop1.setAttribute('stop-color', '#833AB4');
  stop1.setAttribute('stop-opacity', '1');

  const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop2.setAttribute('offset', '50%');
  stop2.setAttribute('stop-color', '#E1306C');
  stop2.setAttribute('stop-opacity', '1');

  const stop3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop3.setAttribute('offset', '100%');
  stop3.setAttribute('stop-color', '#FCAF45');
  stop3.setAttribute('stop-opacity', '1');

  linearGradient.appendChild(stop1);
  linearGradient.appendChild(stop2);
  linearGradient.appendChild(stop3);

  // Create filter
  const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
  filter.setAttribute('id', 'shadowLogo');

  const feDropShadow = document.createElementNS('http://www.w3.org/2000/svg', 'feDropShadow');
  feDropShadow.setAttribute('dx', '0');
  feDropShadow.setAttribute('dy', '4');
  feDropShadow.setAttribute('stdDeviation', '4');
  feDropShadow.setAttribute('flood-opacity', '0.3');

  filter.appendChild(feDropShadow);
  defs.appendChild(linearGradient);
  defs.appendChild(filter);
  svg.appendChild(defs);

  // Create ghost body path
  const ghostBody = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  ghostBody.setAttribute('d', 'M64 16C50 16 38 24 38 36C38 42 40 48 43 54L43 78C43 82 46 85 50 85C53 85 56 83.5 57.5 81.5L62 75C63.5 73.5 64.5 73.5 66 75L70.5 81.5C72 83.5 75 85 78 85C82 85 85 82 85 78L85 54C88 48 90 42 90 36C90 24 78 16 64 16Z');
  ghostBody.setAttribute('fill', 'url(#ghostGradLogo)');
  ghostBody.setAttribute('filter', 'url(#shadowLogo)');
  svg.appendChild(ghostBody);

  // Create wavy bottom effect
  const wavyBottom = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  wavyBottom.setAttribute('d', 'M43 78 L43 85 Q45 87 47 85 Q49 87 51 85 Q53 87 55 85 Q57 87 59 85 Q61 87 63 85 Q65 87 67 85 Q69 87 71 85 Q73 87 75 85 Q77 87 79 85 Q81 87 83 85 L85 78 Z');
  wavyBottom.setAttribute('fill', 'url(#ghostGradLogo)');
  wavyBottom.setAttribute('opacity', '0.9');
  svg.appendChild(wavyBottom);

  // Eyes (simple white, no pupils/highlights)
  const leftEye = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  leftEye.setAttribute('cx', '48');
  leftEye.setAttribute('cy', '42');
  leftEye.setAttribute('r', '5.5');
  leftEye.setAttribute('fill', '#FFFFFF');
  svg.appendChild(leftEye);

  const rightEye = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  rightEye.setAttribute('cx', '80');
  rightEye.setAttribute('cy', '42');
  rightEye.setAttribute('r', '5.5');
  rightEye.setAttribute('fill', '#FFFFFF');
  svg.appendChild(rightEye);

  return svg;
}
