// UserFilterService - Service for filtering users
import { Filter } from '../domain/Filter.js';
import { Whitelist } from '../domain/Whitelist.js';
import type { Settings } from '../../domain/Settings.js';
import type { User } from '../domain/User.js';
import type { IFilterObject } from '../../types/domain.js';

/**
 * Serviço responsável por filtrar usuários baseado em critérios diversos
 * Aplica filtros de tipo, pesquisa, whitelist e configurações
 */
export class UserFilterService {
  /**
   * Filtra uma lista de usuários baseado em múltiplos critérios
   * @param users - Lista de usuários para filtrar
   * @param filter - Filtro de tipos de usuários
   * @param searchTerm - Termo de pesquisa (opcional)
   * @param whitelist - Lista de usuários na whitelist
   * @param currentTab - Aba ativa ('non_whitelisted' ou 'whitelisted')
   * @param settings - Configurações do sistema
   * @returns Lista filtrada de usuários
   */
  filter(
    users: User[],
    filter: Filter | IFilterObject,
    searchTerm: string | null | undefined,
    whitelist: Whitelist | User[] | null | undefined,
    currentTab: string,
    settings: Settings
  ): User[] {
    const normalizedFilter = filter instanceof Filter ? filter : Filter.fromObject(filter);
    const normalizedWhitelist = whitelist instanceof Whitelist ? whitelist : Whitelist.fromArray(whitelist || []);
    const normalizedSearchTerm = (searchTerm || '').toLowerCase().trim();

    return users.filter(user => {
      return this._matchesTab(user, normalizedWhitelist, currentTab) &&
        this._matchesFilter(user, normalizedFilter, settings) &&
        this._matchesSearch(user, normalizedSearchTerm);
    });
  }

  private _matchesTab(user: User, whitelist: Whitelist, currentTab: string): boolean {
    const isWhitelisted = whitelist.contains(user);

    if (currentTab === 'non_whitelisted') {
      return !isWhitelisted;
    }

    if (currentTab === 'whitelisted') {
      return isWhitelisted;
    }

    return true;
  }

  private _matchesFilter(user: User, filter: Filter, settings: Settings): boolean {
    if (!filter.showPrivate() && user.isPrivate()) {
      return false;
    }

    if (!filter.showVerified() && user.isVerified()) {
      return false;
    }

    if (!filter.showFollowers() && user.followsViewer()) {
      return false;
    }

    if (!filter.showNonFollowers() && !user.followsViewer()) {
      return false;
    }

    if (!filter.showWithOutProfilePicture() && this._hasDefaultProfilePicture(user, settings)) {
      return false;
    }

    return true;
  }

  private _matchesSearch(user: User, searchTerm: string): boolean {
    if (!searchTerm) {
      return true;
    }

    const username = user.getUsername().toLowerCase();
    const fullName = user.getFullName().toLowerCase();

    return username.includes(searchTerm) || fullName.includes(searchTerm);
  }

  private _hasDefaultProfilePicture(user: User, settings: Settings): boolean {
    const profilePicUrl = user.getProfilePicUrl();
    const withoutPicIds = settings.getWithoutProfilePictureUrlIds();
    return withoutPicIds.some(id => profilePicUrl.includes(id));
  }
}
