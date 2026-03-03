// User - Objeto de Valor (Encapsula primitivos)
import type { IUserObject } from "../types/domain";

/**
 * Value Object que representa um usuário do Instagram
 */
export class User {
  private readonly _id: string;
  private readonly _username: string;
  private readonly _fullName: string;
  private readonly _profilePicUrl: string;
  private readonly _isVerified: boolean;
  private readonly _isPrivate: boolean;
  private readonly _followsViewer: boolean;

  constructor(
    id: string,
    username: string,
    fullName: string,
    profilePicUrl: string,
    isVerified: boolean,
    isPrivate: boolean,
    followsViewer: boolean,
  ) {
    this._validate(id, username);

    this._id = String(id);
    this._username = String(username);
    this._fullName = String(fullName || "");
    this._profilePicUrl = String(profilePicUrl || "");
    this._isVerified = Boolean(isVerified);
    this._isPrivate = Boolean(isPrivate);
    this._followsViewer = Boolean(followsViewer);
  }

  /**
   * Cria uma instância de User a partir de um objeto
   * @param obj - Objeto com dados do usuário
   * @returns Nova instância de User
   */
  static fromObject(obj: IUserObject): User {
    if (!obj) {
      throw new Error("Invalid user object: object is null or undefined");
    }

    const id = obj.id || obj._id;
    const username = obj.username || obj._username;

    if (!id || !username) {
      throw new Error("Invalid user object: id and username are required");
    }

    return new User(
      id,
      username,
      obj.full_name || obj.fullName || obj._fullName || "",
      obj.profile_pic_url || obj.profilePicUrl || obj._profilePicUrl || "",
      obj.is_verified ?? obj.isVerified ?? obj._isVerified ?? false,
      obj.is_private ?? obj.isPrivate ?? obj._isPrivate ?? false,
      obj.follows_viewer ?? obj.followsViewer ?? obj._followsViewer ?? false,
    );
  }

  /**
   * Valida os dados obrigatórios do usuário
   * @private
   */
  private _validate(id: unknown, username: unknown): void {
    if (!id) {
      throw new Error("User id is required");
    }
    if (!username) {
      throw new Error("User username is required");
    }
  }

  getId(): string {
    return this._id;
  }

  getUsername(): string {
    return this._username;
  }

  getFullName(): string {
    return this._fullName;
  }

  getProfilePicUrl(): string {
    return this._profilePicUrl;
  }

  isVerified(): boolean {
    return this._isVerified;
  }

  isPrivate(): boolean {
    return this._isPrivate;
  }

  followsViewer(): boolean {
    return this._followsViewer;
  }

  /**
   * Compara se dois usuários são o mesmo
   * @param other - Outro usuário a comparar
   * @returns Verdadeiro se forem o mesmo
   */
  equals(other: unknown): boolean {
    if (!(other instanceof User)) {
      return false;
    }
    return this._id === other._id;
  }

  /**
   * Converte a instância para um objeto plano
   * @returns Representação em objeto
   */
  toObject(): {
    id: string;
    username: string;
    full_name: string;
    profile_pic_url: string;
    is_verified: boolean;
    is_private: boolean;
    follows_viewer: boolean;
  } {
    return {
      id: this._id,
      username: this._username,
      full_name: this._fullName,
      profile_pic_url: this._profilePicUrl,
      is_verified: this._isVerified,
      is_private: this._isPrivate,
      follows_viewer: this._followsViewer,
    };
  }
}
