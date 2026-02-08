/**
 * Interfaces para Value Objects do domínio
 * Baseadas nos Value Objects existentes para facilitar tipagem
 */

export interface IUserObject {
  id?: string;
  _id?: string;
  username?: string;
  _username?: string;
  full_name?: string;
  fullName?: string;
  _fullName?: string;
  profile_pic_url?: string;
  profilePicUrl?: string;
  _profilePicUrl?: string;
  is_verified?: boolean;
  isVerified?: boolean;
  _isVerified?: boolean;
  is_private?: boolean;
  isPrivate?: boolean;
  _isPrivate?: boolean;
  follows_viewer?: boolean;
  followsViewer?: boolean;
  _followsViewer?: boolean;
}

export interface ISettingsObject {
  timeBetweenSearchCycles?: number;
  timeToWaitAfterFiveSearchCycles?: number;
  timeBetweenUnfollows?: number;
  timeToWaitAfterFiveUnfollows?: number;
  successMessageDuration?: number;
  unfollowersPerPage?: number;
  withoutProfilePictureUrlIds?: string[];
  instagramGraphqlQueryHash?: string;
  instagramGraphqlBaseUrl?: string;
  instagramUnfollowBaseUrl?: string;
}

export interface IFilterObject {
  showNonFollowers?: boolean;
  showFollowers?: boolean;
  showVerified?: boolean;
  showPrivate?: boolean;
  showWithOutProfilePicture?: boolean;
}

export interface IUnfollowLogEntryObject {
  user: IUserObject;
  unfollowedSuccessfully: boolean;
  timestamp?: number;
}
