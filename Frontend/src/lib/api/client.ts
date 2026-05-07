// API Client with interceptors
import { toast } from 'sonner';

let API_BASE = process.env.NEXT_PUBLIC_API_URL || '/backend-api';

// Auto-detect API host for mobile/network access
// When accessed from phone/tablet, replace any hardcoded IP or localhost with the actual hostname
if (typeof window !== 'undefined') {
  const currentHost = window.location.hostname;
  // If accessing from a different host than what's configured, rewrite the API URL
  try {
    const url = new URL(API_BASE);
    if (url.hostname !== currentHost) {
      url.hostname = currentHost;
      API_BASE = url.toString().replace(/\/$/, '');
    }
  } catch {
    // API_BASE is a relative path like '/backend-api', no rewriting needed
  }
}

export class ApiError extends Error {
  success = false;
  error: string;
  code?: string;
  data?: any;

  constructor(message: string, code?: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.error = message;
    this.code = code;
    this.data = data;
  }
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  }

  private getCompanyId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('current_company_id');
  }

  private buildUrl(url: string, params?: Record<string, any>): string {
    let fullUrl = `${this.baseUrl}${url}`;
    
    // Inject companyId for multi-tenant requests
    const companyId = this.getCompanyId();
    const hasCompanyIdInUrl = url.includes('companyId=');
    const hasCompanyIdInParams = params && params.companyId;

    if (
      companyId &&
      !hasCompanyIdInUrl &&
      !hasCompanyIdInParams &&
      !url.includes('companies') &&
      !url.includes('auth') &&
      !url.includes('login') &&
      !url.includes('/register') &&
      !url.includes('/ai/')
    ) {
      const separator = fullUrl.includes('?') ? '&' : '?';
      fullUrl = `${fullUrl}${separator}companyId=${companyId}`;
    }

    // Append query params
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.set(key, String(value));
        }
      });
      const paramStr = searchParams.toString();
      if (paramStr) {
        fullUrl += (fullUrl.includes('?') ? '&' : '?') + paramStr;
      }
    }

    return fullUrl;
  }

  private async request<T = any>(
    url: string,
    options: RequestInit = {},
    params?: Record<string, any>
  ): Promise<T> {
    const fullUrl = this.buildUrl(url, params);
    const token = this.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Inject companyId into body for POST/PUT/PATCH if not present
    let body = options.body;
    const companyId = this.getCompanyId();
    if (
      companyId &&
      body &&
      typeof body === 'string' &&
      options.method !== 'GET' &&
      !url.includes('auth') &&
      !url.includes('login') &&
      !url.includes('/register')
    ) {
      try {
        const parsedBody = JSON.parse(body);
        if (typeof parsedBody === 'object' && !parsedBody.companyId) {
          parsedBody.companyId = companyId;
          body = JSON.stringify(parsedBody);
        }
      } catch (e) {
        // Not JSON, ignore
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
      const response = await fetch(fullUrl, {
        ...options,
        body,
        headers,
        credentials: 'include',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      // Handle 401 - redirect to login
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('current_company_id');
          localStorage.removeItem('user');
          window.dispatchEvent(new CustomEvent('auth:logout'));
        }
        throw new ApiError('Sesión expirada', 'UNAUTHORIZED');
      }

      // Handle 403
      if (response.status === 403) {
        toast.error('No tienes permisos para esta acción');
        throw new ApiError('Acceso denegado', 'FORBIDDEN');
      }

      // Handle 404
      if (response.status === 404) {
        throw new ApiError('Recurso no encontrado', 'NOT_FOUND');
      }

      // Handle other errors
      if (!response.ok) {
        let errorMessage = 'Error desconocido';
        let errorData: any = null;
        try {
          errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // Use default error message
        }
        throw new ApiError(errorMessage, String(response.status), errorData);
      }

      // Handle empty responses (204)
      if (response.status === 204) {
        return {} as T;
      }

      const result = await response.json();
      if (result.success && result.data !== undefined) {
        return result.data as T;
      }

      return result;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new ApiError('Tiempo de espera agotado. Revisa tu conexión.', 'TIMEOUT');
      }
      throw err;
    }

  }

  async get<T = any>(url: string, params?: Record<string, any>): Promise<T> {
    return this.request<T>(url, { method: 'GET' }, params);
  }

  async post<T = any>(url: string, data?: any, params?: Record<string, any>): Promise<T> {
    return this.request<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }, params);
  }

  async put<T = any>(url: string, data?: any, params?: Record<string, any>): Promise<T> {
    return this.request<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }, params);
  }

  async patch<T = any>(url: string, data?: any, params?: Record<string, any>): Promise<T> {
    return this.request<T>(url, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }, params);
  }

  async postStream(url: string, data?: any): Promise<ReadableStreamDefaultReader<Uint8Array>> {
    const fullUrl = this.buildUrl(url);
    const token = this.getToken();
    const companyId = this.getCompanyId();

    const body = data || {};
    if (companyId && !body.companyId) {
      body.companyId = companyId;
    }
    body.stream = true;

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error('Error en la comunicación con la IA');
    }

    return response.body!.getReader();
  }

  async delete<T = any>(url: string, params?: Record<string, any>): Promise<T> {
    return this.request<T>(url, { method: 'DELETE' }, params);
  }

  async download(url: string, filename: string, params?: Record<string, any>): Promise<void> {
    const fullUrl = this.buildUrl(url, params);
    const token = this.getToken();

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(fullUrl, { headers });

    if (!response.ok) {
      throw { success: false, error: 'Error al descargar archivo' };
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  }
}

export const apiClient = new ApiClient(API_BASE);

// Pagination helper
export function withPagination(params: Record<string, any> = {}): Record<string, any> {
  return {
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    ...params,
  };
}
