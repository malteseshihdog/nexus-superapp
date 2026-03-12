import { API_ENDPOINTS } from '../constants/api.constants';
import { apiClient } from './client';
import type { User, LoginCredentials, RegisterCredentials, AuthTokens } from '../types/auth.types';
import type { Project, CreateProjectInput, UpdateProjectInput } from '../types/project.types';
import type { ProjectFile, FileChange } from '../types/file.types';
import type { PaginatedResponse } from '../types/api.types';

// Auth endpoints
export const authEndpoints = {
  login: (credentials: LoginCredentials) =>
    apiClient.post<{ user: User; tokens: AuthTokens }>(API_ENDPOINTS.AUTH.LOGIN, credentials),

  logout: () =>
    apiClient.post<void>(API_ENDPOINTS.AUTH.LOGOUT),

  register: (credentials: RegisterCredentials) =>
    apiClient.post<{ user: User; tokens: AuthTokens }>(API_ENDPOINTS.AUTH.REGISTER, credentials),

  refreshToken: (refreshToken: string) =>
    apiClient.post<AuthTokens>(API_ENDPOINTS.AUTH.REFRESH, { refreshToken }),

  getCurrentUser: () =>
    apiClient.get<User>(API_ENDPOINTS.AUTH.ME),
};

// Project endpoints
export const projectEndpoints = {
  listProjects: (page = 1, pageSize = 20) =>
    apiClient.get<PaginatedResponse<Project>>(`${API_ENDPOINTS.PROJECTS.LIST}?page=${page}&pageSize=${pageSize}`),

  createProject: (input: CreateProjectInput) =>
    apiClient.post<Project>(API_ENDPOINTS.PROJECTS.CREATE, input),

  getProject: (id: string) =>
    apiClient.get<Project>(API_ENDPOINTS.PROJECTS.GET(id)),

  updateProject: (id: string, input: UpdateProjectInput) =>
    apiClient.patch<Project>(API_ENDPOINTS.PROJECTS.UPDATE(id), input),

  deleteProject: (id: string) =>
    apiClient.delete<void>(API_ENDPOINTS.PROJECTS.DELETE(id)),
};

// File endpoints
export const fileEndpoints = {
  listFiles: (projectId: string) =>
    apiClient.get<ProjectFile[]>(API_ENDPOINTS.FILES.LIST(projectId)),

  getFile: (projectId: string, fileId: string) =>
    apiClient.get<ProjectFile>(API_ENDPOINTS.FILES.GET(projectId, fileId)),

  createFile: (projectId: string, file: Partial<ProjectFile>) =>
    apiClient.post<ProjectFile>(API_ENDPOINTS.FILES.CREATE(projectId), file),

  updateFile: (projectId: string, fileId: string, changes: FileChange) =>
    apiClient.patch<ProjectFile>(API_ENDPOINTS.FILES.UPDATE(projectId, fileId), changes),

  deleteFile: (projectId: string, fileId: string) =>
    apiClient.delete<void>(API_ENDPOINTS.FILES.DELETE(projectId, fileId)),
};
