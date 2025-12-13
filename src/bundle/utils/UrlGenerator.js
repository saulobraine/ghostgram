// UrlGenerator - Generates Instagram API URLs
import { INSTAGRAM_GRAPHQL_BASE_URL, INSTAGRAM_GRAPHQL_QUERY_HASH, INSTAGRAM_UNFOLLOW_BASE_URL } from '../../constants/Constants.js';
import { CookieHelper } from './CookieHelper.js';

export class UrlGenerator {
  static generateFollowersUrl(cursor) {
    const userId = CookieHelper.getUserId();
    if (!userId) {
      throw new Error('User ID not found in cookies');
    }
    
    const variables = {
      id: userId,
      include_reel: true,
      fetch_mutual: false,
      first: '24'
    };
    
    if (cursor) {
      variables.after = cursor;
    }
    
    const variablesJson = JSON.stringify(variables);
    return `${INSTAGRAM_GRAPHQL_BASE_URL}?query_hash=${INSTAGRAM_GRAPHQL_QUERY_HASH}&variables=${encodeURIComponent(variablesJson)}`;
  }

  static generateUnfollowUrl(userId) {
    return `${INSTAGRAM_UNFOLLOW_BASE_URL}${userId}/unfollow/`;
  }
}

