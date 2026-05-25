import * as SecureStore from 'expo-secure-store';
import {
  RegisterDTO,
  LoginDTO,
  AuthResponseDTO,
  UserDTO,
  PlanLimitsDTO,
  RefreshTokenDTO,
} from '@ghostgram/shared';

const ACCESS_TOKEN_STORAGE_KEY = 'ghostgram_token';
const REFRESH_TOKEN_STORAGE_KEY = 'ghostgram_refresh_token';
const DEFAULT_DEV_BASE_URL = 'http://localhost:3001/api/v1';
const ENVIRONMENT_API_URL_KEY = 'EXPO_PUBLIC_API_URL';

function getEnvironmentApiUrl(): string | null {
  const normalizedValue = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (!normalizedValue) {
    return null;
  }

  return normalizedValue.replace(/\/+$/, '');
}

function resolveBaseUrl(): string {
  const environmentApiUrl = getEnvironmentApiUrl();

  if (environmentApiUrl) {
    return environmentApiUrl;
  }

  if (__DEV__) {
    return DEFAULT_DEV_BASE_URL;
  }

  return '';
}

class ApiClient {
  private accessToken: string | null;
  private baseUrl: string;
  private refreshPromise: Promise<boolean> | null;

  constructor() {
    this.accessToken = null;
    this.baseUrl = resolveBaseUrl();
    this.refreshPromise = null;
  }

  async setSession(response: AuthResponseDTO): Promise<void> {
    this.accessToken = response.accessToken;
    await SecureStore.setItemAsync(REFRESH_TOKEN_STORAGE_KEY, response.refreshToken);
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_STORAGE_KEY);
  }

  async clearSession(): Promise<void> {
    this.accessToken = null;
    this.refreshPromise = null;
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_STORAGE_KEY);
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_STORAGE_KEY);
  }

  async restoreSession(): Promise<boolean> {
    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_STORAGE_KEY);

    if (!refreshToken) {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_STORAGE_KEY);
      return false;
    }

    try {
      return await this.refreshSession(refreshToken);
    } catch (error) {
      console.error('[ApiClient] Falha ao restaurar sessão:', error);
      return false;
    }
  }

  async logout(): Promise<void> {
    await this.clearSession();
  }

  private getBaseUrl(): string {
    if (this.baseUrl) {
      return this.baseUrl;
    }

    throw new Error(`Defina ${ENVIRONMENT_API_URL_KEY} com a URL da API para usar o app.`);
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    hasRetried = false,
  ): Promise<T> {
    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');

    if (this.accessToken) {
      headers.set('Authorization', `Bearer ${this.accessToken}`);
    }

    const response = await fetch(`${this.getBaseUrl()}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401 && !hasRetried && this.shouldRefreshSession(endpoint)) {
      const sessionRefreshed = await this.refreshSession();

      if (sessionRefreshed) {
        return this.request<T>(endpoint, options, true);
      }
    }

    if (!response.ok) {
      if (response.status === 401) {
        await this.clearSession();
      }

      throw new Error(await this.getErrorMessage(response));
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  private shouldRefreshSession(endpoint: string): boolean {
    return endpoint !== '/auth/login'
      && endpoint !== '/auth/register'
      && endpoint !== '/auth/refresh';
  }

  private async refreshSession(refreshToken?: string): Promise<boolean> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshTokenValue = refreshToken ?? await SecureStore.getItemAsync(REFRESH_TOKEN_STORAGE_KEY);

    if (!refreshTokenValue) {
      await this.clearSession();
      return false;
    }

    this.refreshPromise = this.executeRefresh(refreshTokenValue);

    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async executeRefresh(refreshToken: string): Promise<boolean> {
    const response = await fetch(`${this.getBaseUrl()}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken } satisfies RefreshTokenDTO),
    });

    if (response.status === 401) {
      await this.clearSession();
      return false;
    }

    if (!response.ok) {
      throw new Error(await this.getErrorMessage(response));
    }

    const data = await response.json() as AuthResponseDTO;
    await this.setSession(data);
    return true;
  }

  private async getErrorMessage(response: Response): Promise<string> {
    try {
      const error = await response.json() as { message?: string | string[] };

      if (typeof error.message === 'string' && error.message.trim()) {
        return error.message;
      }

      if (Array.isArray(error.message) && error.message.length > 0) {
        return error.message[0];
      }
    } catch {
      // Ignora respostas sem JSON.
    }

    return 'Request failed';
  }

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
}

export const apiClient = new ApiClient();
