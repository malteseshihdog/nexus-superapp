export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  status: number;
}

export interface ApiError {
  message: string;
  code?: string;
  status: number;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T = unknown> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface RequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
  signal?: AbortSignal;
}

export interface ApiRequestInterceptor {
  onRequest: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
}

export interface ApiResponseInterceptor {
  onResponse: <T>(response: ApiResponse<T>) => ApiResponse<T> | Promise<ApiResponse<T>>;
  onError: (error: ApiError) => ApiError | Promise<ApiError>;
}
