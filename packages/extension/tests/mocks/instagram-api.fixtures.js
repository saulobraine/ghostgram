// Fixtures for Instagram API responses
// Used to mock fetch() calls to Instagram's GraphQL API

/**
 * Creates a mock Instagram user node (as returned by the API)
 * @param {Object} overrides - Properties to override
 * @returns {Object} User node matching Instagram API format
 */
export const createUserNode = (overrides = {}) => ({
  id: '12345678',
  username: 'testuser',
  full_name: 'Test User',
  profile_pic_url: 'https://instagram.com/pic.jpg',
  is_verified: false,
  is_private: false,
  follows_viewer: false,
  ...overrides
});

/**
 * Creates a complete followers API response
 * @param {Object} options
 * @param {Array} options.users - Array of user node overrides
 * @param {boolean} options.hasNextPage - Whether there are more pages
 * @param {string|null} options.endCursor - Pagination cursor
 * @param {number} options.totalCount - Total follower count
 * @returns {Object} Full Instagram GraphQL API response
 */
export const createFollowersResponse = ({
  users = [createUserNode()],
  hasNextPage = false,
  endCursor = null,
  totalCount = 100
} = {}) => ({
  data: {
    user: {
      edge_follow: {
        edges: users.map(user => ({ node: user })),
        page_info: {
          has_next_page: hasNextPage,
          end_cursor: endCursor
        },
        count: totalCount
      }
    }
  }
});

/**
 * Creates a paginated series of followers responses for multi-page scan testing
 * @param {number} pageCount - Number of pages
 * @param {number} usersPerPage - Users per page
 * @returns {Array} Array of followers responses
 */
export const createPaginatedFollowersResponses = (pageCount = 3, usersPerPage = 5) => {
  const responses = [];

  for (let page = 0; page < pageCount; page++) {
    const isLastPage = page === pageCount - 1;
    const users = Array.from({ length: usersPerPage }, (_, i) => {
      const index = page * usersPerPage + i;
      return createUserNode({
        id: String(1000 + index),
        username: `user_${index}`,
        full_name: `User ${index}`,
        follows_viewer: index % 3 === 0 // ~1/3 follow back
      });
    });

    responses.push(createFollowersResponse({
      users,
      hasNextPage: !isLastPage,
      endCursor: isLastPage ? null : `cursor_page_${page + 1}`,
      totalCount: pageCount * usersPerPage
    }));
  }

  return responses;
};

/**
 * Creates an unfollow success response (empty JSON, status 200)
 */
export const createUnfollowResponse = () => ({
  status: 'ok'
});

/**
 * Creates an API error response body
 * @param {string} message
 */
export const createErrorResponse = (message = 'Rate limited') => ({
  message,
  status: 'fail'
});
