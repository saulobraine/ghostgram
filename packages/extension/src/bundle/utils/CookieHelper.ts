// CookieHelper - Utilitário para operações de cookies

/**
 * Classe utilitária para operações com cookies do navegador
 */
export class CookieHelper {
  /**
   * Busca o valor de um cookie pelo nome
   * @param name - Nome do cookie
   * @returns Valor do cookie ou null se não encontrado
   */
  static getCookie(name: string): string | null {
    if (typeof document === 'undefined' || !document.cookie) {
      return null;
    }

    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }

    const cookies = `; ${document.cookie}`;
    const parts = cookies.split(`; ${name}=`);

    if (parts.length >= 2) {
      return parts.pop()?.split(';').shift() || null;
    }

    return null;
  }

  /**
   * Atalho para buscar o token CSRF
   * @returns Token CSRF ou null
   */
  static getCsrfToken(): string | null {
    return CookieHelper.getCookie('csrftoken');
  }

  /**
   * Atalho para buscar o ID do usuário logado
   * @returns ID do usuário ou null
   */
  static getUserId(): string | null {
    return CookieHelper.getCookie('ds_user_id');
  }

  /**
   * Busca o rollout hash do Instagram (necessário para requisições à API)
   * Tenta múltiplas fontes: _sharedData, meta tag, script inline, embedding data
   * @returns Rollout hash ou string vazia como fallback
   */
  static getRolloutHash(): string {
    try {
      // Tenta do _sharedData (expõe variáveis globais do Instagram)
      const sharedData = (window as any)._sharedData;
      if (sharedData?.rollout_hash) {
        return sharedData.rollout_hash;
      }
      if (sharedData?.rolloutHash) {
        return sharedData.rolloutHash;
      }

      // Tenta do additionalData (Instagram às vezes usa isso)
      const additionalData = (window as any).__additionalData;
      if (additionalData?.rollout_hash) {
        return additionalData.rollout_hash;
      }
      if (additionalData?.rolloutHash) {
        return additionalData.rolloutHash;
      }

      // Tenta do meta tag (vários formatos possíveis)
      const metaTags = [
        'rollout_hash',
        'rollout-hash',
        'rollouthash',
        'ig:rollout:hash'
      ];
      for (const name of metaTags) {
        const metaTag = document.querySelector(`meta[name="${name}"]`);
        if (metaTag) {
          const content = metaTag.getAttribute('content');
          if (content) return content;
        }
      }

      // Tenta buscar em scripts que contêm "rollout_hash"
      const scripts = document.getElementsByTagName('script');
      for (let i = 0; i < scripts.length; i++) {
        const scriptContent = scripts[i].textContent || '';
        const match = scriptContent.match(/"rollout_hash"\s*:\s*"([^"]+)"/);
        if (match && match[1]) {
          return match[1];
        }
        const match2 = scriptContent.match(/"rolloutHash"\s*:\s*"([^"]+)"/);
        if (match2 && match2[1]) {
          return match2[1];
        }
      }

      // Tenta outras variáveis globais
      const possibleVars = [
        'rolloutHash',
        'rollout_hash',
        '__ROLLOUT_HASH__',
        'igRolloutHash'
      ];
      for (const varName of possibleVars) {
        const value = (window as any)[varName];
        if (typeof value === 'string' && value.length > 0) {
          return value;
        }
      }
    } catch (error) {
      console.error('[CookieHelper] Error getting rollout hash:', error);
    }

    // Se não encontrou, loga apenas uma vez (debug level)
    if (process.env.NODE_ENV === 'development') {
      console.debug('[CookieHelper] Rollout hash not found in any source');
    }

    return '';
  }
}
