// CookieHelper - Utility for cookie operations
export class CookieHelper {
  static getCookie(name) {
    const cookies = `; ${document.cookie}`;
    const parts = cookies.split(`; ${name}=`);
    
    if (parts.length !== 2) {
      return null;
    }
    
    return parts.pop().split(';').shift();
  }

  static getCsrfToken() {
    return CookieHelper.getCookie('csrftoken');
  }

  static getUserId() {
    return CookieHelper.getCookie('ds_user_id');
  }
}

