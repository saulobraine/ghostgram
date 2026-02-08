// DOMRenderer - Funções auxiliares para manipulação do DOM

type EventHandler = (event: Event) => void;
type ElementProps = {
  className?: string;
  class?: string;
  style?: Partial<CSSStyleDeclaration> | Record<string, string>;
  dangerouslySetInnerHTML?: { __html: string };
  key?: string | number;
  ref?: (element: HTMLElement) => void;
  [key: string]: any;
} & {
  [K in `on${Capitalize<string>}`]?: EventHandler;
};

type Child = string | number | Node | null | undefined | false | Child[];

/**
 * Converte camelCase para kebab-case para atributos HTML
 * @param str - String em camelCase
 * @returns String em kebab-case
 */
function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Cria um elemento DOM com propriedades e filhos
 * @param tag - Nome da tag HTML
 * @param props - Propriedades do elemento (className, onClick, etc.)
 * @param children - Elementos filhos ou texto
 * @returns Elemento criado
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props?: ElementProps,
  ...children: Child[]
): HTMLElementTagNameMap[K];
export function createElement(
  tag: string,
  props?: ElementProps,
  ...children: Child[]
): HTMLElement {
  const element = document.createElement(tag);

  // Tratar propriedades
  if (props) {
    Object.entries(props).forEach(([key, value]) => {
      if (key === 'className' || key === 'class') {
        element.className = value as string;
        return;
      }

      if (key === 'style' && typeof value === 'object' && value !== null) {
        Object.assign(element.style, value);
        return;
      }

      if (key.startsWith('on') && typeof value === 'function') {
        // Manipuladores de eventos: onClick -> click, onMouseEnter -> mouseenter
        const eventName = key.slice(2).toLowerCase();
        element.addEventListener(eventName, value as EventHandler);
        return;
      }

      if (key === 'dangerouslySetInnerHTML' && value && typeof value === 'object' && '__html' in value) {
        element.innerHTML = (value as { __html: string }).__html;
        return;
      }

      if (key === 'key' || key === 'ref') {
        if (key === 'ref' && typeof value === 'function') {
          (value as (element: HTMLElement) => void)(element);
        }
        return;
      }

      // Tratar atributos booleanos (disabled, checked, selected, etc.)
      const booleanAttributes = ['disabled', 'checked', 'selected', 'readonly', 'required', 'multiple', 'autofocus', 'autoplay', 'controls', 'loop', 'muted', 'open'];
      const attrName = camelToKebab(key);

      if (booleanAttributes.includes(attrName)) {
        (element as any)[attrName] = !!value;
        if (value) {
          element.setAttribute(attrName, '');
          return;
        }
        element.removeAttribute(attrName);
        return;
      }

      // Converter camelCase para kebab-case para atributos HTML normais
      element.setAttribute(attrName, String(value));
    });
  }

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

  return element as HTMLElement;
}

/**
 * Atualiza propriedades de um elemento
 * @param element - Elemento a atualizar
 * @param props - Novas propriedades
 */
export function updateElement(element: HTMLElement, props: ElementProps): void {
  Object.entries(props).forEach(([key, value]) => {
    if (key === 'className' || key === 'class') {
      element.className = value as string;
      return;
    }

    if (key === 'style' && typeof value === 'object' && value !== null) {
      Object.assign(element.style, value);
      return;
    }

    if (key.startsWith('on') && typeof value === 'function') {
      // Nota: Isso é simplificado - em produção seria ideal rastrear listeners antigos
      const eventName = key.slice(2).toLowerCase();
      element.addEventListener(eventName, value as EventHandler);
      return;
    }

    if (key === 'dangerouslySetInnerHTML' && value && typeof value === 'object' && '__html' in value) {
      element.innerHTML = (value as { __html: string }).__html;
      return;
    }

    if (key === 'key' || key === 'ref') {
      if (key === 'ref' && typeof value === 'function') {
        (value as (element: HTMLElement) => void)(element);
      }
      return;
    }

    // Tratar atributos booleanos
    const booleanAttributes = ['disabled', 'checked', 'selected', 'readonly', 'required', 'multiple', 'autofocus', 'autoplay', 'controls', 'loop', 'muted', 'open'];
    const attrName = camelToKebab(key);

    if (booleanAttributes.includes(attrName)) {
      (element as any)[attrName] = !!value;
      if (value) {
        element.setAttribute(attrName, '');
        return;
      }
      element.removeAttribute(attrName);
      return;
    }

    element.setAttribute(attrName, String(value));
  });
}

/**
 * Renderiza elemento no pai
 * @param parent - Elemento pai
 * @param element - Elemento a renderizar
 */
export function render(parent: HTMLElement | null, element: HTMLElement | null): void {
  if (parent && element) {
    parent.appendChild(element);
  }
}

/**
 * Remove todos os filhos de um elemento
 * @param element - Elemento a limpar
 */
export function clearElement(element: HTMLElement): void {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

/**
 * Substitui os filhos de um elemento por novo conteúdo
 * @param element - Elemento a atualizar
 * @param newContent - Novo conteúdo
 */
export function replaceChildren(element: HTMLElement, newContent: HTMLElement | Node[]): void {
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
