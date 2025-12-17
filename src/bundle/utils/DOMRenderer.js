// DOMRenderer - Helper functions for DOM manipulation

/**
 * Convert camelCase to kebab-case for HTML attributes
 * @param {string} str - camelCase string
 * @returns {string} kebab-case string
 */
function camelToKebab(str) {
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Create a DOM element with props and children
 * @param {string} tag - HTML tag name
 * @param {Object} props - Element properties (className, onClick, etc.)
 * @param {...(string|Node|Array)} children - Child elements or text
 * @returns {HTMLElement} Created element
 */
export function createElement(tag, props = {}, ...children) {
  const element = document.createElement(tag);

  // Handle props
  Object.entries(props).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'class') {
      element.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else if (key.startsWith('on') && typeof value === 'function') {
      // Event handlers: onClick -> click, onMouseEnter -> mouseenter
      const eventName = key.slice(2).toLowerCase();
      element.addEventListener(eventName, value);
    } else if (key === 'dangerouslySetInnerHTML') {
      element.innerHTML = value.__html;
    } else if (key !== 'key' && key !== 'ref') {
      // Handle boolean attributes (disabled, checked, selected, etc.)
      const booleanAttributes = ['disabled', 'checked', 'selected', 'readonly', 'required', 'multiple', 'autofocus', 'autoplay', 'controls', 'loop', 'muted', 'open'];
      const attrName = camelToKebab(key);
      if (booleanAttributes.includes(attrName)) {
        if (value) {
          element.setAttribute(attrName, '');
          // Also set the property for proper behavior
          element[attrName] = true;
        } else {
          element.removeAttribute(attrName);
          element[attrName] = false;
        }
      } else {
        // Convert camelCase to kebab-case for HTML attributes
        element.setAttribute(attrName, value);
      }
    }
  });

  // Handle children
  children.forEach(child => {
    if (child === null || child === undefined || child === false) {
      // Skip null/undefined/false children
      return;
    } else if (typeof child === 'string' || typeof child === 'number') {
      element.appendChild(document.createTextNode(String(child)));
    } else if (child instanceof Node) {
      element.appendChild(child);
    } else if (Array.isArray(child)) {
      // Flatten arrays
      child.forEach(c => {
        if (c instanceof Node) {
          element.appendChild(c);
        } else if (typeof c === 'string' || typeof c === 'number') {
          element.appendChild(document.createTextNode(String(c)));
        }
      });
    }
  });

  return element;
}

/**
 * Update element properties
 * @param {HTMLElement} element - Element to update
 * @param {Object} props - New properties
 */
export function updateElement(element, props) {
  Object.entries(props).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'class') {
      element.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else if (key.startsWith('on') && typeof value === 'function') {
      // Remove old listener and add new one
      const eventName = key.slice(2).toLowerCase();
      // Note: This is simplified - in production you'd want to track old listeners
      element.addEventListener(eventName, value);
    } else if (key === 'dangerouslySetInnerHTML') {
      element.innerHTML = value.__html;
    } else if (key !== 'key' && key !== 'ref') {
      // Handle boolean attributes (disabled, checked, selected, etc.)
      const booleanAttributes = ['disabled', 'checked', 'selected', 'readonly', 'required', 'multiple', 'autofocus', 'autoplay', 'controls', 'loop', 'muted', 'open'];
      const attrName = camelToKebab(key);
      if (booleanAttributes.includes(attrName)) {
        if (value) {
          element.setAttribute(attrName, '');
          // Also set the property for proper behavior
          element[attrName] = true;
        } else {
          element.removeAttribute(attrName);
          element[attrName] = false;
        }
      } else {
        // Convert camelCase to kebab-case for HTML attributes
        element.setAttribute(attrName, value);
      }
    }
  });
}

/**
 * Render element to parent
 * @param {HTMLElement} parent - Parent element
 * @param {HTMLElement} element - Element to render
 */
export function render(parent, element) {
  if (parent && element) {
    parent.appendChild(element);
  }
}

/**
 * Remove all children from element
 * @param {HTMLElement} element - Element to clear
 */
export function clearElement(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

/**
 * Replace element's children with new content
 * @param {HTMLElement} element - Element to update
 * @param {HTMLElement|Array} newContent - New content
 */
export function replaceChildren(element, newContent) {
  clearElement(element);
  if (Array.isArray(newContent)) {
    newContent.forEach(child => {
      if (child instanceof Node) {
        element.appendChild(child);
      }
    });
  } else if (newContent instanceof Node) {
    element.appendChild(newContent);
  }
}
