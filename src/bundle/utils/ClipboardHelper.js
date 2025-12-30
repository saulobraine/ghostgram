// ClipboardHelper - Utilitário para operações de área de transferência (clipboard)
export class ClipboardHelper {
  /**
   * Copia a lista de usuários para a área de transferência
   * @param {Array} users - Lista de usuários (objetos User ou planos)
   */
  static async copyUsersList(users) {
    const sorted = [...users].sort((a, b) => {
      const usernameA = a.getUsername ? a.getUsername() : a.username;
      const usernameB = b.getUsername ? b.getUsername() : b.username;
      return usernameA.localeCompare(usernameB);
    });

    const text = sorted.map(user => {
      return user.getUsername ? user.getUsername() : user.username;
    }).join('\n');

    await navigator.clipboard.writeText(text);
  }
}


