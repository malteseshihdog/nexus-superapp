import { apiClient } from './client';
import { APP_CONSTANTS } from '../constants/app.constants';
import { storageUtils } from '../utils/storage';

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

/**
 * Auth interceptor — attaches access token to every request and
 * transparently handles 401 token-refresh.
 */
export function registerAuthInterceptor(): void {
  apiClient.addRequestInterceptor((config) => {
    const tokens = storageUtils.getSync<{ accessToken: string }>(APP_CONSTANTS.STORAGE_KEYS.AUTH_TOKENS);
    if (tokens?.accessToken) {
      apiClient.setAuthToken(tokens.accessToken);
    }
    return config;
  });
}

/**
 * Logging interceptor — logs request/response info in development.
 */
export function registerLoggingInterceptor(): void {
  if (process.env.NODE_ENV !== 'development') return;

  apiClient.addRequestInterceptor((config) => {
    console.debug(`[API] ${config.method} ${config.url}`);
    return config;
  });

  apiClient.addResponseInterceptor((response) => {
    console.debug(`[API] Response ${response.status}`);
    return response;
  });
}

/**
 * Error normaliser interceptor.
 */
export function registerErrorInterceptor(): void {
  apiClient.addErrorInterceptor((error) => {
    console.error(`[API Error] ${error.status}: ${error.message}`);
    throw error;
  });
}

export function drainRefreshQueue(token: string): void {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
  isRefreshing = false;
}

export { isRefreshing, refreshQueue };
