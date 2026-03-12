import type { ApiError, ApiResponse, RequestConfig } from '../types/api.types';
import { API_CONSTANTS } from '../constants/api.constants';

type RequestInterceptor = (config: RequestConfig & { url: string; method: string; body?: unknown }) => RequestConfig & { url: string; method: string; body?: unknown };
type ResponseInterceptor = <T>(response: ApiResponse<T>) => ApiResponse<T>;
type ErrorInterceptor = (error: ApiError) => never;

class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  constructor(baseUrl: string = API_CONSTANTS.BASE_URL) {
    this.baseUrl = `${baseUrl}/api/${API_CONSTANTS.VERSION}`;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  setAuthToken(token: string): void {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  clearAuthToken(): void {
    delete this.defaultHeaders['Authorization'];
  }

  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  addErrorInterceptor(interceptor: ErrorInterceptor): void {
    this.errorInterceptors.push(interceptor);
  }

  private async executeRequest<T>(
    url: string,
    method: string,
    body?: unknown,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    let reqConfig = {
      url: `${this.baseUrl}${url}`,
      method,
      body,
      headers: { ...this.defaultHeaders, ...(config.headers ?? {}) },
      timeout: config.timeout ?? API_CONSTANTS.TIMEOUT,
    };

    for (const interceptor of this.requestInterceptors) {
      reqConfig = interceptor(reqConfig);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), reqConfig.timeout);

    try {
      const res = await fetch(reqConfig.url, {
        method: reqConfig.method,
        headers: reqConfig.headers,
        body: body !== undefined ? JSON.stringify(reqConfig.body) : undefined,
        signal: config.signal ?? controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        const apiError: ApiError = {
          message: (errBody as { message?: string }).message ?? res.statusText,
          status: res.status,
          code: (errBody as { code?: string }).code,
        };
        for (const interceptor of this.errorInterceptors) {
          interceptor(apiError);
        }
        throw apiError;
      }

      const data: T = await res.json();
      let response: ApiResponse<T> = { data, status: res.status };

      for (const interceptor of this.responseInterceptors) {
        response = interceptor(response);
      }

      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      if ((err as ApiError).status !== undefined) throw err;
      throw {
        message: (err as Error).message ?? 'Network error',
        status: 0,
      } as ApiError;
    }
  }

  get<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.executeRequest<T>(url, 'GET', undefined, config);
  }

  post<T>(url: string, body?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.executeRequest<T>(url, 'POST', body, config);
  }

  put<T>(url: string, body?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.executeRequest<T>(url, 'PUT', body, config);
  }

  patch<T>(url: string, body?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.executeRequest<T>(url, 'PATCH', body, config);
  }

  delete<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.executeRequest<T>(url, 'DELETE', undefined, config);
  }
}

export const apiClient = new ApiClient();
export default ApiClient;
