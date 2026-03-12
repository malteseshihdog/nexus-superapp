export interface RemoteInfo {
  name: string;
  url: string;
  fetchUrl?: string;
  pushUrl?: string;
}

export class GitClient {
  private repoPath: string;

  constructor(repoPath: string) {
    this.repoPath = repoPath;
  }

  async clone(url: string, targetPath: string, options?: { depth?: number; branch?: string }): Promise<void> {
    console.log(`Cloning ${url} to ${targetPath}`, options);
  }

  async getRemotes(): Promise<RemoteInfo[]> {
    return [];
  }

  async addRemote(name: string, url: string): Promise<void> {
    console.log(`Adding remote ${name} -> ${url}`);
  }

  async removeRemote(name: string): Promise<void> {
    console.log(`Removing remote ${name}`);
  }

  async setRemoteUrl(name: string, url: string): Promise<void> {
    console.log(`Setting remote ${name} URL to ${url}`);
  }

  async getCurrentBranch(): Promise<string> {
    return 'main';
  }

  async getLog(options?: { maxCount?: number; branch?: string }): Promise<{ hash: string; message: string; author: string; date: Date }[]> {
    return [];
  }

  getRepoPath(): string {
    return this.repoPath;
  }
}
