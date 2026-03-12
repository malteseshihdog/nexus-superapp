export interface GitLabConfig {
  token: string;
  baseUrl?: string;
}

export interface GitLabProject {
  id: number;
  name: string;
  nameWithNamespace: string;
  path: string;
  description: string | null;
  visibility: 'private' | 'internal' | 'public';
  cloneUrl: string;
  sshUrl: string;
  defaultBranch: string;
  stars: number;
  forks: number;
}

export interface GitLabMR {
  id: number;
  iid: number;
  title: string;
  description: string | null;
  state: 'opened' | 'closed' | 'merged';
  sourceBranch: string;
  targetBranch: string;
  author: string;
  assignees: string[];
  labels: string[];
  createdAt: Date;
  updatedAt: Date;
  mergedAt?: Date;
  draft: boolean;
}

export class GitLabClient {
  private config: GitLabConfig;
  private baseUrl: string;

  constructor(config: GitLabConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://gitlab.com/api/v4';
  }

  async getProject(projectId: string | number): Promise<GitLabProject | null> {
    console.log(`Fetching project ${projectId} from ${this.baseUrl}`);
    return null;
  }

  async listProjects(options?: {
    owned?: boolean;
    membership?: boolean;
    search?: string;
  }): Promise<GitLabProject[]> {
    console.log('Listing GitLab projects', options);
    return [];
  }

  async createProject(name: string, options?: {
    description?: string;
    visibility?: 'private' | 'internal' | 'public';
    initializeWithReadme?: boolean;
  }): Promise<GitLabProject | null> {
    console.log(`Creating GitLab project: ${name}`, options);
    return null;
  }

  async listMergeRequests(projectId: string | number, options?: {
    state?: 'opened' | 'closed' | 'merged' | 'all';
    targetBranch?: string;
  }): Promise<GitLabMR[]> {
    console.log(`Listing MRs for project ${projectId}`, options);
    return [];
  }

  async createMergeRequest(projectId: string | number, options: {
    title: string;
    sourceBranch: string;
    targetBranch: string;
    description?: string;
    assigneeIds?: number[];
    labels?: string[];
  }): Promise<GitLabMR | null> {
    console.log(`Creating MR: ${options.title}`);
    return null;
  }

  async mergeMR(projectId: string | number, mrIid: number, options?: {
    squash?: boolean;
    removeSourceBranch?: boolean;
  }): Promise<void> {
    console.log(`Merging MR !${mrIid} in project ${projectId}`, options);
  }
}
