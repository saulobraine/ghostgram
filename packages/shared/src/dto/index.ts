/**
 * API Data Transfer Objects (DTOs)
 */

import { IUserObject, IFilterObject } from "../types/domain";
import { Plan, SubscriptionStatus, ActionType } from "../constants/index";

// Auth DTOs
export interface RegisterDTO {
  email: string;
  password: string;
  displayName?: string;
  locale?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResponseDTO {
  accessToken: string;
  refreshToken: string;
  user: UserDTO;
}

export interface UserDTO {
  id: string;
  email: string;
  displayName?: string;
  locale: string;
  plan: Plan;
  createdAt: string;
}

// Instagram Account DTOs
export interface InstagramAccountDTO {
  id: string;
  igUsername: string;
  igUserId?: string;
  createdAt: string;
}

export interface AddInstagramAccountDTO {
  igUsername: string;
  igUserId?: string;
}

// Scan DTOs
export interface ScanResultDTO {
  id: string;
  accountId: string;
  totalFollowing: number;
  nonFollowers: number;
  resultData?: {
    users: IUserObject[];
    filters?: IFilterObject;
  };
  createdAt: string;
}

export interface CreateScanDTO {
  accountId: string;
  totalFollowing: number;
  nonFollowers: number;
  resultData?: {
    users: IUserObject[];
    filters?: IFilterObject;
  };
}

// Action History DTOs
export interface ActionHistoryDTO {
  id: string;
  accountId: string;
  actionType: ActionType;
  targetUsername: string;
  source: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface CreateActionDTO {
  accountId: string;
  actionType: ActionType;
  targetUsername: string;
  source?: string;
  metadata?: Record<string, any>;
}

export interface SyncActionsDTO {
  accountId: string;
  actions: Omit<CreateActionDTO, "accountId">[];
}

export interface ActionStatsDTO {
  totalActions: number;
  follows: number;
  unfollows: number;
  scans: number;
  last24Hours: {
    follows: number;
    unfollows: number;
    scans: number;
  };
}

// Whitelist DTOs
export interface WhitelistEntryDTO {
  id: string;
  accountId: string;
  igUsername: string;
  createdAt: string;
}

export interface AddToWhitelistDTO {
  accountId: string;
  igUsername: string;
}

export interface SyncWhitelistDTO {
  accountId: string;
  usernames: string[];
}

// Billing DTOs
export interface CreateCheckoutDTO {
  plan: Plan;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutResponseDTO {
  checkoutUrl: string;
  sessionId: string;
}

export interface SubscriptionDTO {
  id: string;
  userId: string;
  stripeCustomerId: string;
  stripeSubId?: string;
  plan: Plan;
  status: SubscriptionStatus;
  expiresAt?: string;
  createdAt: string;
}

// Plan Limits DTO
export interface PlanLimitsDTO {
  scansPerDay: number;
  unfollowPerSession: number;
  historyRetentionDays: number;
  maxWhitelist: number;
  maxInstagramAccounts: number;
  currentUsage: {
    scansToday: number;
    unfollowsThisSession: number;
    whitelistCount: number;
    instagramAccountsCount: number;
  };
}

// Error DTO
export interface ErrorDTO {
  statusCode: number;
  message: string;
  error?: string;
  details?: any;
}

// Pagination
export interface PaginatedResponseDTO<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}
