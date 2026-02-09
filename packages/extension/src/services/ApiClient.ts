/**
 * API Client for GhostGram backend
 * Handles all HTTP requests to the API
 */

import {
  RegisterDTO,
  LoginDTO,
  AuthResponseDTO,
  UserDTO,
  AddInstagramAccountDTO,
  InstagramAccountDTO,
  CreateScanDTO,
  ScanResultDTO,
  SyncActionsDTO,
  ActionHistoryDTO,
  ActionStatsDTO,
  AddToWhitelistDTO,
  SyncWhitelistDTO,
  WhitelistEntryDTO,
  CreateCheckoutDTO,
  CheckoutResponseDTO,
  SubscriptionDTO,
  PlanLimitsDTO
} from '@ghostgram/shared';

export class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = 'http://localhost:3001/api/v1') {
    this.baseUrl = baseUrl;
    this.loadToken();
  }

  private async loadToken() {
    const result = await chrome.storage.local.get('ghostgram_api_token');
    this.token = result.ghostgram_api_token || null;
  }

  private async saveToken(token: string) {
    this.token = token;
    await chrome.storage.local.set({ ghostgram_api_token: token });
  }

  private async clearToken() {
    this.token = null;
    await chrome.storage.local.remove('ghostgram_api_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    // Merge with provided headers
    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      if (response.status === 401) {
        await this.clearToken();
      }
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  // Auth
  async register(dto: RegisterDTO): Promise<AuthResponseDTO> {
    const response = await this.request<AuthResponseDTO>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(dto)
    });
    await this.saveToken(response.accessToken);
    return response;
  }

  async login(dto: LoginDTO): Promise<AuthResponseDTO> {
    const response = await this.request<AuthResponseDTO>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(dto)
    });
    await this.saveToken(response.accessToken);
    return response;
  }

  async logout() {
    await this.clearToken();
  }

  async getMe(): Promise<UserDTO> {
    return this.request<UserDTO>('/auth/me');
  }

  // Users
  async getPlanLimits(): Promise<PlanLimitsDTO> {
    return this.request<PlanLimitsDTO>('/users/plan');
  }

  // Scans
  async createScan(dto: CreateScanDTO): Promise<ScanResultDTO> {
    return this.request<ScanResultDTO>('/scans', {
      method: 'POST',
      body: JSON.stringify(dto)
    });
  }

  // History
  async syncActions(dto: SyncActionsDTO): Promise<{ synced: number }> {
    return this.request<{ synced: number }>('/history/sync', {
      method: 'POST',
      body: JSON.stringify(dto)
    });
  }

  // Whitelist
  async syncWhitelist(dto: SyncWhitelistDTO): Promise<{ synced: number }> {
    return this.request<{ synced: number }>('/whitelist/sync', {
      method: 'POST',
      body: JSON.stringify(dto)
    });
  }

  // Billing
  async createCheckout(dto: CreateCheckoutDTO): Promise<CheckoutResponseDTO> {
    return this.request<CheckoutResponseDTO>('/billing/checkout', {
      method: 'POST',
      body: JSON.stringify(dto)
    });
  }

  // Health check
  async isOnline(): Promise<boolean> {
    try {
      await fetch(`${this.baseUrl}/health`);
      return true;
    } catch {
      return false;
    }
  }

  isAuthenticated(): boolean {
    return this.token !== null;
  }
}

// Singleton instance
export const apiClient = new ApiClient();
