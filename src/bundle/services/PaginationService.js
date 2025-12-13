// PaginationService - Service for pagination operations
import { UNFOLLOWERS_PER_PAGE } from '../../constants/Constants.js';

export class PaginationService {
  static getPage(users, pageNumber) {
    const startIndex = UNFOLLOWERS_PER_PAGE * (pageNumber - 1);
    const endIndex = startIndex + UNFOLLOWERS_PER_PAGE;
    return users.slice(startIndex, endIndex);
  }

  static getMaxPage(users) {
    if (!users || users.length === 0) {
      return 1;
    }
    
    const maxPage = Math.ceil(users.length / UNFOLLOWERS_PER_PAGE);
    return maxPage < 1 ? 1 : maxPage;
  }

  static getCurrentPage(users, pageNumber) {
    return PaginationService.getPage(users, pageNumber);
  }
}

