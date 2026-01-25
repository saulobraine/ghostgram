// UserFilterService - Service for filtering users
import { Filter } from '../domain/Filter.js';
import { Whitelist } from '../domain/Whitelist.js';

/**
 * Serviço responsável por filtrar usuários baseado em critérios diversos
 * Aplica filtros de tipo, pesquisa, whitelist e configurações
 */
export class UserFilterService {
  /**
   * Filtra uma lista de usuários baseado em múltiplos critérios
   * @param {Array<User>} users - Lista de usuários para filtrar
   * @param {Filter|Object} filter - Filtro de tipos de usuários
   * @param {string} searchTerm - Termo de pesquisa (opcional)
   * @param {Whitelist|Array} whitelist - Lista de usuários na whitelist
   * @param {string} currentTab - Aba ativa ('non_whitelisted' ou 'whitelisted')
   * @param {Settings} settings - Configurações do sistema
   * @returns {Array<User>} Lista filtrada de usuários
   */
  filter(users, filter, searchTerm, whitelist, currentTab, settings) {
    const normalizedFilter = filter instanceof Filter ? filter : Filter.fromObject(filter);
    const normalizedWhitelist = whitelist instanceof Whitelist ? whitelist : Whitelist.fromArray(whitelist || []);
    const normalizedSearchTerm = (searchTerm || '').toLowerCase().trim();

    return users.filter(user => {
      return this._matchesTab(user, normalizedWhitelist, currentTab) &&
        this._matchesFilter(user, normalizedFilter, settings) &&
        this._matchesSearch(user, normalizedSearchTerm);
    });
  }

  _matchesTab(user, whitelist, currentTab) {
    const isWhitelisted = whitelist.contains(user);

    if (currentTab === 'non_whitelisted') {
      return !isWhitelisted;
    }

    if (currentTab === 'whitelisted') {
      return isWhitelisted;
    }

    return true;
  }

  _matchesFilter(user, filter, settings) {
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

  _matchesSearch(user, searchTerm) {
    if (!searchTerm) {
      return true;
    }

    const username = user.getUsername().toLowerCase();
    const fullName = user.getFullName().toLowerCase();

    return username.includes(searchTerm) || fullName.includes(searchTerm);
  }

  _hasDefaultProfilePicture(user, settings) {
    const profilePicUrl = user.getProfilePicUrl();
    const withoutPicIds = settings.getWithoutProfilePictureUrlIds();
    return withoutPicIds.some(id => profilePicUrl.includes(id));
  }
}

