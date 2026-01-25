// User - Objeto de Valor (Encapsula primitivos)
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

  /**
   * Cria uma instância de User a partir de um objeto
   * @param {Object} obj - Objeto com dados do usuário
   * @returns {User} Nova instância de User
   */
  static fromObject(obj) {
    if (!obj) {
      throw new Error('Invalid user object: object is null or undefined');
    }

    const id = obj.id || obj._id;
    const username = obj.username || obj._username;

    if (!id || !username) {
      throw new Error('Invalid user object: id and username are required');
    }

    return new User(
      id,
      username,
      obj.full_name || obj.fullName || obj._fullName || '',
      obj.profile_pic_url || obj.profilePicUrl || obj._profilePicUrl || '',
      obj.is_verified ?? obj.isVerified ?? obj._isVerified ?? false,
      obj.is_private ?? obj.isPrivate ?? obj._isPrivate ?? false,
      obj.follows_viewer ?? obj.followsViewer ?? obj._followsViewer ?? false
    );
  }

  /**
   * Valida os dados obrigatórios do usuário
   * @private
   */
  _validate(id, username) {
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

  /**
   * Compara se dois usuários são o mesmo
   * @param {User} other - Outro usuário a comparar
   * @returns {boolean} Verdadeiro se forem o mesmo
   */
  equals(other) {
    if (!(other instanceof User)) {
      return false;
    }
    return this._id === other._id;
  }

  /**
   * Converte a instância para um objeto plano
   * @returns {Object} Representação em objeto
   */
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


