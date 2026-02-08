// ClipboardHelper - Utilitário para operações de área de transferência (clipboard)
import type { User } from '../domain/User.js';
import type { IUserObject } from '../../types/domain.js';

type UserLike = User | IUserObject | { getUsername?: () => string; username?: string };

/**
 * Classe utilitária para operações com área de transferência
 */
export class ClipboardHelper {
  /**
   * Copia a lista de usuários para a área de transferência
   * @param users - Lista de usuários (objetos User ou planos)
   */
  static async copyUsersList(users: UserLike[]): Promise<void> {
    const sorted = [...users].sort((a, b) => {
      const usernameA = 'getUsername' in a && typeof a.getUsername === 'function' 
        ? a.getUsername() 
        : 'username' in a ? (a.username || '') : '';
      const usernameB = 'getUsername' in b && typeof b.getUsername === 'function'
        ? b.getUsername()
        : 'username' in b ? (b.username || '') : '';
      return usernameA.localeCompare(usernameB);
    });

    const text = sorted.map(user => {
      return 'getUsername' in user && typeof user.getUsername === 'function'
        ? user.getUsername()
        : 'username' in user ? user.username : '';
    }).join('\n');

    await navigator.clipboard.writeText(text);
  }
}
