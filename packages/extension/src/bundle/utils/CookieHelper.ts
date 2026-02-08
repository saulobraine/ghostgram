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
    const cookies = `; ${document.cookie}`;
    const parts = cookies.split(`; ${name}=`);

    if (parts.length !== 2) {
      return null;
    }

    return parts.pop()?.split(';').shift() || null;
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
}
