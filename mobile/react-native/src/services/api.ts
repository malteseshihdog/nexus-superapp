import { authEndpoints, projectEndpoints, fileEndpoints } from '../../../shared/src/api/endpoints';
import { apiClient } from '../../../shared/src/api/client';

export const apiService = {
  auth: authEndpoints,
  projects: projectEndpoints,
  files: fileEndpoints,
  client: apiClient,
};

export default apiService;
