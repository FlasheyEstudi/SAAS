// API Client with interceptors
import { toast } from 'sonner';

let API_BASE = process.env.NEXT_PUBLIC_API_URL || '/backend-api';

// Auto-detect API host for mobile/network access
if (typeof window !== 'undefined' && API_BASE.includes('localhost') && !window.location.hostname.includes('localhost')) {
  API_BASE = API_BASE.replace('localhost', window.location.hostname);
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
    if (
      companyId &&
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

    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });

    // Handle 401 - redirect to login
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('current_company_id');
        localStorage.removeItem('user');
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }
      throw { success: false, error: 'Sesión expirada', code: 'UNAUTHORIZED' };
    }

    // Handle 403
    if (response.status === 403) {
      toast.error('No tienes permisos para esta acción');
      throw { success: false, error: 'Acceso denegado', code: 'FORBIDDEN' };
    }

    // Handle 404
    if (response.status === 404) {
      throw { success: false, error: 'Recurso no encontrado', code: 'NOT_FOUND' };
    }

    // Handle other errors
    if (!response.ok) {
      let errorMessage = 'Error desconocido';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // Use default error message
      }
      throw { success: false, error: errorMessage, code: String(response.status) };
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
