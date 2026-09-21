/**
 * NagarDrishti — Centralized API Gateway Client
 * Communicates strictly with FastAPI backend using VITE_API_BASE_URL.
 */

// Format base URL cleanly (handles http://localhost:8000 or http://localhost:8000/v1)
const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/v1';
export const API_BASE_URL = RAW_BASE_URL.endsWith('/v1') 
  ? RAW_BASE_URL 
  : `${RAW_BASE_URL.replace(/\/+$/, '')}/v1`;

export interface ApiClientOptions extends RequestInit {
  timeoutMs?: number;
  params?: Record<string, string | number | boolean | undefined | null>;
}

export class ApiError extends Error {
  public status: number;
  public detail: any;

  constructor(status: number, message: string, detail?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

export async function apiClient<T>(endpoint: string, options: ApiClientOptions = {}): Promise<T> {
  const { timeoutMs = 15000, params, headers = {}, ...customConfig } = options;

  let url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  if (params) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, String(val));
      }
    });
    const queryString = query.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  // Ready for optional JWT bearer token integration without polluting components
  const token = typeof window !== 'undefined' ? localStorage.getItem('nd_auth_token') : null;

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  try {
    const response = await fetch(url, {
      ...customConfig,
      headers: {
        ...defaultHeaders,
        ...(headers as Record<string, string>),
      },
      signal: controller.signal,
    });

    clearTimeout(id);

    if (!response.ok) {
      let errorDetail: any = null;
      let errorMessage = `HTTP ${response.status} ${response.statusText}`;

      try {
        const errorData = await response.json();
        errorDetail = errorData.detail || errorData;
        if (typeof errorDetail === 'string') {
          errorMessage = errorDetail;
        } else if (Array.isArray(errorDetail)) {
          errorMessage = errorDetail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
        }
      } catch {
        // Body was not JSON
      }

      throw new ApiError(response.status, errorMessage, errorDetail);
    }

    return (await response.json()) as T;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new ApiError(408, `Request timeout after ${timeoutMs}ms: ${endpoint}`);
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(0, error.message || 'Network connection failed');
  }
}
