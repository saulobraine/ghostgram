// UserFilterService - Service for filtering users
import { Filter } from '../domain/Filter.js';
import { Whitelist } from '../domain/Whitelist.js';
import { WITHOUT_PROFILE_PICTURE_URL_IDS } from '../../constants/Constants.js';

export class UserFilterService {
  filter(users, filter, searchTerm, whitelist, currentTab) {
    const normalizedFilter = filter instanceof Filter ? filter : Filter.fromObject(filter);
    const normalizedWhitelist = whitelist instanceof Whitelist ? whitelist : Whitelist.fromArray(whitelist || []);
    const normalizedSearchTerm = (searchTerm || '').toLowerCase().trim();
    
    return users.filter(user => {
      return this._matchesTab(user, normalizedWhitelist, currentTab) &&
             this._matchesFilter(user, normalizedFilter) &&
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

  _matchesFilter(user, filter) {
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
    
    if (!filter.showWithOutProfilePicture() && this._hasDefaultProfilePicture(user)) {
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

  _hasDefaultProfilePicture(user) {
    const profilePicUrl = user.getProfilePicUrl();
    return WITHOUT_PROFILE_PICTURE_URL_IDS.some(id => profilePicUrl.includes(id));
  }
}

