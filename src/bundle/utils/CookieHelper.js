// CookieHelper - Utilitário para operações de cookies
export class CookieHelper {
  /**
   * Busca o valor de um cookie pelo nome
   * @param {string} name - Nome do cookie
   * @returns {string|null} Valor do cookie ou null se não encontrado
   */
  static getCookie(name) {
    const cookies = `; ${document.cookie}`;
    const parts = cookies.split(`; ${name}=`);

    if (parts.length !== 2) {
      return null;
    }

    return parts.pop().split(';').shift();
  }

  /**
   * Atalho para buscar o token CSRF
   * @returns {string|null} Token CSRF
   */
  static getCsrfToken() {
    return CookieHelper.getCookie('csrftoken');
  }

  /**
   * Atalho para buscar o ID do usuário logado
   * @returns {string|null} ID do usuário
   */
  static getUserId() {
    return CookieHelper.getCookie('ds_user_id');
  }
}


