import type { ApiResponse, ApiError } from '../types/api';
import { ApiException, isApiError } from '../utils/api-error';

export interface ClientConfig {
  baseUrl: string;
  credentials?: RequestCredentials;
}

export class ApiClient {
  private baseUrl: string;
  private credentials: RequestCredentials;

  constructor(config: ClientConfig) {
    this.baseUrl = config.baseUrl;
    this.credentials = config.credentials || 'include';
  }

  async request<T>(
    path: string,
    init?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...init?.headers
    };

    const response = await fetch(url, {
      ...init,
      headers,
      credentials: this.credentials
    });

    if (response.status === 204) {
      return undefined as T;
    }

    const body = await response.json();

    if (!response.ok) {
      if (isApiError(body)) {
        throw ApiException.fromResponse(response.status, body);
      }
      throw new ApiException('unknown_error', response.status);
    }

    return (body as ApiResponse<T>).data;
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' });
  }

  async post<T>(path: string, data?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async patch<T>(path: string, data: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }
}

// Default client instance
export const apiClient = new ApiClient({
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8787'
});
