// Filter - Value Object (Wrap primitives)
import type { IFilterObject } from "../types/domain";

/**
 * Value Object que representa filtros de usuários
 */
export class Filter {
  private readonly _showNonFollowers: boolean;
  private readonly _showFollowers: boolean;
  private readonly _showVerified: boolean;
  private readonly _showPrivate: boolean;
  private readonly _showWithOutProfilePicture: boolean;

  constructor(
    showNonFollowers: boolean,
    showFollowers: boolean,
    showVerified: boolean,
    showPrivate: boolean,
    showWithOutProfilePicture: boolean,
  ) {
    this._showNonFollowers = Boolean(showNonFollowers);
    this._showFollowers = Boolean(showFollowers);
    this._showVerified = Boolean(showVerified);
    this._showPrivate = Boolean(showPrivate);
    this._showWithOutProfilePicture = Boolean(showWithOutProfilePicture);
  }

  static createDefault(): Filter {
    return new Filter(true, false, true, true, true);
  }

  static createUnfollowFilter(): Filter {
    return new Filter(false, false, false, false, false);
  }

  static fromObject(obj: IFilterObject | null | undefined): Filter {
    if (!obj) {
      return Filter.createDefault();
    }

    return new Filter(
      obj.showNonFollowers !== undefined ? obj.showNonFollowers : true,
      obj.showFollowers !== undefined ? obj.showFollowers : false,
      obj.showVerified !== undefined ? obj.showVerified : true,
      obj.showPrivate !== undefined ? obj.showPrivate : true,
      obj.showWithOutProfilePicture !== undefined
        ? obj.showWithOutProfilePicture
        : true,
    );
  }

  showNonFollowers(): boolean {
    return this._showNonFollowers;
  }

  showFollowers(): boolean {
    return this._showFollowers;
  }

  showVerified(): boolean {
    return this._showVerified;
  }

  showPrivate(): boolean {
    return this._showPrivate;
  }

  showWithOutProfilePicture(): boolean {
    return this._showWithOutProfilePicture;
  }

  update(updates: Partial<IFilterObject>): Filter {
    return new Filter(
      updates.showNonFollowers !== undefined
        ? updates.showNonFollowers
        : this._showNonFollowers,
      updates.showFollowers !== undefined
        ? updates.showFollowers
        : this._showFollowers,
      updates.showVerified !== undefined
        ? updates.showVerified
        : this._showVerified,
      updates.showPrivate !== undefined
        ? updates.showPrivate
        : this._showPrivate,
      updates.showWithOutProfilePicture !== undefined
        ? updates.showWithOutProfilePicture
        : this._showWithOutProfilePicture,
    );
  }

  toObject(): IFilterObject {
    return {
      showNonFollowers: this._showNonFollowers,
      showFollowers: this._showFollowers,
      showVerified: this._showVerified,
      showPrivate: this._showPrivate,
      showWithOutProfilePicture: this._showWithOutProfilePicture,
    };
  }

  equals(other: unknown): boolean {
    if (!(other instanceof Filter)) {
      return false;
    }
    return (
      this._showNonFollowers === other._showNonFollowers &&
      this._showFollowers === other._showFollowers &&
      this._showVerified === other._showVerified &&
      this._showPrivate === other._showPrivate &&
      this._showWithOutProfilePicture === other._showWithOutProfilePicture
    );
  }
}
