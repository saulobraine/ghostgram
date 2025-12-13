// Filter - Value Object (Wrap primitives)
export class Filter {
  constructor(showNonFollowers, showFollowers, showVerified, showPrivate, showWithOutProfilePicture) {
    this._showNonFollowers = Boolean(showNonFollowers);
    this._showFollowers = Boolean(showFollowers);
    this._showVerified = Boolean(showVerified);
    this._showPrivate = Boolean(showPrivate);
    this._showWithOutProfilePicture = Boolean(showWithOutProfilePicture);
  }

  static createDefault() {
    return new Filter(true, false, true, true, true);
  }

  static createUnfollowFilter() {
    return new Filter(false, false, false, false, false);
  }

  static fromObject(obj) {
    if (!obj) {
      return Filter.createDefault();
    }
    
    return new Filter(
      obj.showNonFollowers !== undefined ? obj.showNonFollowers : true,
      obj.showFollowers !== undefined ? obj.showFollowers : false,
      obj.showVerified !== undefined ? obj.showVerified : true,
      obj.showPrivate !== undefined ? obj.showPrivate : true,
      obj.showWithOutProfilePicture !== undefined ? obj.showWithOutProfilePicture : true
    );
  }

  showNonFollowers() {
    return this._showNonFollowers;
  }

  showFollowers() {
    return this._showFollowers;
  }

  showVerified() {
    return this._showVerified;
  }

  showPrivate() {
    return this._showPrivate;
  }

  showWithOutProfilePicture() {
    return this._showWithOutProfilePicture;
  }

  update(updates) {
    return new Filter(
      updates.showNonFollowers !== undefined ? updates.showNonFollowers : this._showNonFollowers,
      updates.showFollowers !== undefined ? updates.showFollowers : this._showFollowers,
      updates.showVerified !== undefined ? updates.showVerified : this._showVerified,
      updates.showPrivate !== undefined ? updates.showPrivate : this._showPrivate,
      updates.showWithOutProfilePicture !== undefined ? updates.showWithOutProfilePicture : this._showWithOutProfilePicture
    );
  }

  toObject() {
    return {
      showNonFollowers: this._showNonFollowers,
      showFollowers: this._showFollowers,
      showVerified: this._showVerified,
      showPrivate: this._showPrivate,
      showWithOutProfilePicture: this._showWithOutProfilePicture
    };
  }

  equals(other) {
    if (!(other instanceof Filter)) {
      return false;
    }
    return this._showNonFollowers === other._showNonFollowers &&
           this._showFollowers === other._showFollowers &&
           this._showVerified === other._showVerified &&
           this._showPrivate === other._showPrivate &&
           this._showWithOutProfilePicture === other._showWithOutProfilePicture;
  }
}

