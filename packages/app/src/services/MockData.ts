/**
 * Mock data for GhostGram testing
 */

import {
  AuthResponseDTO,
  UserDTO,
  PlanLimitsDTO,
  Plan,
} from "@ghostgram/shared";

// Mock User
export const MOCK_USER: UserDTO = {
  id: "mock-user-id",
  email: "tester@ghostgram.com",
  displayName: "Ghost Tester",
  locale: "pt-BR",
  plan: Plan.PREMIUM,
  createdAt: new Date().toISOString(),
};

// Mock Auth Response
export const MOCK_AUTH_RESPONSE: AuthResponseDTO = {
  user: MOCK_USER,
  accessToken: "mock-access-token",
  refreshToken: "mock-refresh-token",
};

// Mock Plan Limits
export const MOCK_PLAN_LIMITS: PlanLimitsDTO = {
  scansPerDay: 999,
  unfollowPerSession: 999,
  historyRetentionDays: 999,
  maxWhitelist: 999,
  maxInstagramAccounts: 5,
  currentUsage: {
    scansToday: 2,
    unfollowsThisSession: 15,
    whitelistCount: 10,
    instagramAccountsCount: 1,
  },
};
