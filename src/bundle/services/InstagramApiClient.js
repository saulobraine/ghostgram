// InstagramApiClient - Service for Instagram API communication
import { UrlGenerator } from '../utils/UrlGenerator.js';
import { CookieHelper } from '../utils/CookieHelper.js';
import { User } from '../domain/User.js';

export class InstagramApiClient {
  async fetchFollowers(cursor) {
    const url = UrlGenerator.generateFollowersUrl(cursor);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch followers: ${response.status}`);
    }
    
    const data = await response.json();
    return this._parseFollowersResponse(data);
  }

  async unfollowUser(userId) {
    const csrfToken = CookieHelper.getCsrfToken();
    if (!csrfToken) {
      throw new Error('CSRF token not found');
    }
    
    const url = UrlGenerator.generateUnfollowUrl(userId);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'x-csrftoken': csrfToken
      },
      mode: 'cors',
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to unfollow user: ${response.status}`);
    }
    
    return true;
  }

  _parseFollowersResponse(data) {
    if (!data || !data.data || !data.data.user) {
      throw new Error('Invalid API response structure');
    }
    
    const edgeFollow = data.data.user.edge_follow;
    const users = edgeFollow.edges.map(edge => User.fromObject(edge.node));
    
    return {
      users: users,
      hasNextPage: edgeFollow.page_info.has_next_page,
      endCursor: edgeFollow.page_info.end_cursor,
      totalCount: edgeFollow.count
    };
  }
}

