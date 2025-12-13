// User - Value Object (Wrap primitives)
export class User {
  constructor(id, username, fullName, profilePicUrl, isVerified, isPrivate, followsViewer) {
    this._validate(id, username, profilePicUrl);

    this._id = String(id);
    this._username = String(username);
    this._fullName = String(fullName || '');
    this._profilePicUrl = String(profilePicUrl || '');
    this._isVerified = Boolean(isVerified);
    this._isPrivate = Boolean(isPrivate);
    this._followsViewer = Boolean(followsViewer);
  }

  static fromObject(obj) {
    if (!obj || !obj.id || !obj.username) {
      throw new Error('Invalid user object: id and username are required');
    }

    return new User(
      obj.id,
      obj.username,
      obj.full_name || obj.fullName || '',
      obj.profile_pic_url || obj.profilePicUrl || '',
      obj.is_verified || obj.isVerified || false,
      obj.is_private || obj.isPrivate || false,
      obj.follows_viewer || obj.followsViewer || false
    );
  }

  _validate(id, username, profilePicUrl) {
    if (!id) {
      throw new Error('User id is required');
    }
    if (!username) {
      throw new Error('User username is required');
    }
  }

  getId() {
    return this._id;
  }

  getUsername() {
    return this._username;
  }

  getFullName() {
    return this._fullName;
  }

  getProfilePicUrl() {
    return this._profilePicUrl;
  }

  isVerified() {
    return this._isVerified;
  }

  isPrivate() {
    return this._isPrivate;
  }

  followsViewer() {
    return this._followsViewer;
  }

  equals(other) {
    if (!(other instanceof User)) {
      return false;
    }
    return this._id === other._id;
  }

  toObject() {
    return {
      id: this._id,
      username: this._username,
      full_name: this._fullName,
      profile_pic_url: this._profilePicUrl,
      is_verified: this._isVerified,
      is_private: this._isPrivate,
      follows_viewer: this._followsViewer
    };
  }
}

