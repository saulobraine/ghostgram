// DOMRenderer - Funções auxiliares para manipulação do DOM

/**
 * Converte camelCase para kebab-case para atributos HTML
 * @param {string} str - String em camelCase
 * @returns {string} String em kebab-case
 */
function camelToKebab(str) {
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Cria um elemento DOM com propriedades e filhos
 * @param {string} tag - Nome da tag HTML
 * @param {Object} props - Propriedades do elemento (className, onClick, etc.)
 * @param {...(string|Node|Array)} children - Elementos filhos ou texto
 * @returns {HTMLElement} Elemento criado
 */
export function createElement(tag, props = {}, ...children) {
  const element = document.createElement(tag);

  // Tratar propriedades
  Object.entries(props).forEach(([key, value]) => {
    if (key === 'className' || key === 'class') {
      element.className = value;
      return;
    }

    if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
      return;
    }

    if (key.startsWith('on') && typeof value === 'function') {
      // Manipuladores de eventos: onClick -> click, onMouseEnter -> mouseenter
      const eventName = key.slice(2).toLowerCase();
      element.addEventListener(eventName, value);
      return;
    }

    if (key === 'dangerouslySetInnerHTML') {
      element.innerHTML = value.__html;
      return;
    }

    if (key === 'key' || key === 'ref') {
      return;
    }

    // Tratar atributos booleanos (disabled, checked, selected, etc.)
    const booleanAttributes = ['disabled', 'checked', 'selected', 'readonly', 'required', 'multiple', 'autofocus', 'autoplay', 'controls', 'loop', 'muted', 'open'];
    const attrName = camelToKebab(key);

    if (booleanAttributes.includes(attrName)) {
      element[attrName] = !!value;
      if (value) {
        element.setAttribute(attrName, '');
        return;
      }
      element.removeAttribute(attrName);
      return;
    }

    // Converter camelCase para kebab-case para atributos HTML normais
    element.setAttribute(attrName, value);
  });

  // Tratar filhos
  children.forEach(child => {
    if (child === null || child === undefined || child === false) {
      return;
    }

    if (typeof child === 'string' || typeof child === 'number') {
      element.appendChild(document.createTextNode(String(child)));
      return;
    }

    if (child instanceof Node) {
      element.appendChild(child);
      return;
    }

    if (Array.isArray(child)) {
      // Achatar arrays
      child.forEach(c => {
        if (c instanceof Node) {
          element.appendChild(c);
          return;
        }
        if (typeof c === 'string' || typeof c === 'number') {
          element.appendChild(document.createTextNode(String(c)));
        }
      });
    }
  });

  return element;
}

/**
 * Atualiza propriedades de um elemento
 * @param {HTMLElement} element - Elemento a atualizar
 * @param {Object} props - Novas propriedades
 */
export function updateElement(element, props) {
  Object.entries(props).forEach(([key, value]) => {
    if (key === 'className' || key === 'class') {
      element.className = value;
      return;
    }

    if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
      return;
    }

    if (key.startsWith('on') && typeof value === 'function') {
      // Nota: Isso é simplificado - em produção seria ideal rastrear listeners antigos
      const eventName = key.slice(2).toLowerCase();
      element.addEventListener(eventName, value);
      return;
    }

    if (key === 'dangerouslySetInnerHTML') {
      element.innerHTML = value.__html;
      return;
    }

    if (key === 'key' || key === 'ref') {
      return;
    }

    // Tratar atributos booleanos
    const booleanAttributes = ['disabled', 'checked', 'selected', 'readonly', 'required', 'multiple', 'autofocus', 'autoplay', 'controls', 'loop', 'muted', 'open'];
    const attrName = camelToKebab(key);

    if (booleanAttributes.includes(attrName)) {
      element[attrName] = !!value;
      if (value) {
        element.setAttribute(attrName, '');
        return;
      }
      element.removeAttribute(attrName);
      return;
    }

    element.setAttribute(attrName, value);
  });
}

/**
 * Renderiza elemento no pai
 * @param {HTMLElement} parent - Elemento pai
 * @param {HTMLElement} element - Elemento a renderizar
 */
export function render(parent, element) {
  if (parent && element) {
    parent.appendChild(element);
  }
}

/**
 * Remove todos os filhos de um elemento
 * @param {HTMLElement} element - Elemento a limpar
 */
export function clearElement(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

/**
 * Substitui os filhos de um elemento por novo conteúdo
 * @param {HTMLElement} element - Elemento a atualizar
 * @param {HTMLElement|Array} newContent - Novo conteúdo
 */
export function replaceChildren(element, newContent) {
  clearElement(element);

  if (Array.isArray(newContent)) {
    newContent.forEach(child => {
      if (child instanceof Node) {
        element.appendChild(child);
      }
    });
    return;
  }

  if (newContent instanceof Node) {
    element.appendChild(newContent);
  }
}

