export const API_CONSTANTS = {
  BASE_URL: process.env.API_BASE_URL || 'https://api.nexus-ide.com',
  VERSION: 'v1',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    BIOMETRIC: '/auth/biometric',
  },
  PROJECTS: {
    LIST: '/projects',
    CREATE: '/projects',
    GET: (id: string) => `/projects/${id}`,
    UPDATE: (id: string) => `/projects/${id}`,
    DELETE: (id: string) => `/projects/${id}`,
    STATS: (id: string) => `/projects/${id}/stats`,
  },
  FILES: {
    LIST: (projectId: string) => `/projects/${projectId}/files`,
    GET: (projectId: string, fileId: string) => `/projects/${projectId}/files/${fileId}`,
    CREATE: (projectId: string) => `/projects/${projectId}/files`,
    UPDATE: (projectId: string, fileId: string) => `/projects/${projectId}/files/${fileId}`,
    DELETE: (projectId: string, fileId: string) => `/projects/${projectId}/files/${fileId}`,
  },
  TERMINAL: {
    SESSIONS: '/terminal/sessions',
    EXECUTE: (sessionId: string) => `/terminal/sessions/${sessionId}/execute`,
  },
  DEPLOYMENTS: {
    LIST: (projectId: string) => `/projects/${projectId}/deployments`,
    CREATE: (projectId: string) => `/projects/${projectId}/deployments`,
    GET: (projectId: string, deployId: string) => `/projects/${projectId}/deployments/${deployId}`,
  },
} as const;
