export interface Project {
  id: string;
  name: string;
  description?: string;
  language: string;
  framework?: string;
  ownerId: string;
  collaborators: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt?: string;
  thumbnailUrl?: string;
  status: ProjectStatus;
  tags: string[];
}

export type ProjectStatus = 'active' | 'archived' | 'deploying' | 'error';

export interface ProjectStats {
  fileCount: number;
  totalSize: number;
  commitCount: number;
  lastCommit?: string;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  language: string;
  framework?: string;
  isPublic: boolean;
  template?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  isPublic?: boolean;
  tags?: string[];
}
