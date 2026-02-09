/**
 * API Client for GhostGram Mobile App
 */

import * as SecureStore from 'expo-secure-store';
import {
  RegisterDTO,
  LoginDTO,
  AuthResponseDTO,
  UserDTO,
  PlanLimitsDTO,
} from '@ghostgram/shared';

class ApiClient {
  private baseUrl: string;

  constructor() {
    // Use localhost for development
    // For production, use your deployed API URL
    this.baseUrl = 'http://localhost:3001/api/v1';
  }

  private async getToken(): Promise<string | null> {
    return await SecureStore.getItemAsync('ghostgram_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: { ...headers, ...options.headers },
    });

    if (!response.ok) {
      if (response.status === 401) {
        await SecureStore.deleteItemAsync('ghostgram_token');
        await SecureStore.deleteItemAsync('ghostgram_refresh_token');
      }
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  // Auth
  async register(dto: RegisterDTO): Promise<AuthResponseDTO> {
    return this.request<AuthResponseDTO>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async login(dto: LoginDTO): Promise<AuthResponseDTO> {
    return this.request<AuthResponseDTO>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async getMe(): Promise<UserDTO> {
    return this.request<UserDTO>('/auth/me');
  }

  async getPlanLimits(): Promise<PlanLimitsDTO> {
    return this.request<PlanLimitsDTO>('/users/plan');
  }

  async logout() {
    await SecureStore.deleteItemAsync('ghostgram_token');
    await SecureStore.deleteItemAsync('ghostgram_refresh_token');
  }
}

export const apiClient = new ApiClient();
