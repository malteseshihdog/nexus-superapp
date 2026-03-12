import { GitManager } from '../versionControl/src/git/gitManager';
import { GitClient } from '../versionControl/src/git/gitClient';
import { CommitHandler } from '../versionControl/src/git/commitHandler';
import { BranchManager } from '../versionControl/src/git/branchManager';
import { MergeHandler } from '../versionControl/src/git/mergeHandler';
import { DiffGenerator } from '../versionControl/src/git/diffGenerator';
import { GitHubClient } from '../versionControl/src/github/githubClient';
import { PRHandler } from '../versionControl/src/github/prHandler';
import { IssueHandler } from '../versionControl/src/github/issueHandler';

describe('Version Control - Git', () => {
  it('should initialize GitManager', () => {
    const manager = new GitManager({ repoPath: '/tmp/test-repo' });
    expect(manager).toBeInstanceOf(GitManager);
    expect(manager.getConfig().repoPath).toBe('/tmp/test-repo');
  });

  it('should return empty status', async () => {
    const manager = new GitManager({ repoPath: '/tmp/test-repo' });
    const status = await manager.status();
    expect(status.branch).toBe('main');
    expect(status.staged).toEqual([]);
    expect(status.ahead).toBe(0);
  });

  it('should initialize GitClient', () => {
    const client = new GitClient('/tmp/test-repo');
    expect(client).toBeInstanceOf(GitClient);
    expect(client.getRepoPath()).toBe('/tmp/test-repo');
  });

  it('should return current branch as main', async () => {
    const client = new GitClient('/tmp/test-repo');
    const branch = await client.getCurrentBranch();
    expect(branch).toBe('main');
  });

  it('should create a commit via CommitHandler', async () => {
    const handler = new CommitHandler('/tmp/test-repo');
    const result = await handler.commit({ message: 'test commit' });
    expect(result.message).toBe('test commit');
    expect(result.hash).toBeDefined();
    expect(result.date).toBeInstanceOf(Date);
  });

  it('should list branches with BranchManager', async () => {
    const manager = new BranchManager('/tmp/test-repo');
    const branches = await manager.list();
    expect(Array.isArray(branches)).toBe(true);
    expect(branches[0].name).toBe('main');
    expect(branches[0].isCurrent).toBe(true);
  });

  it('should get current branch from BranchManager', async () => {
    const manager = new BranchManager('/tmp/test-repo');
    const branch = await manager.getCurrentBranch();
    expect(branch).toBe('main');
  });

  it('should return successful merge with MergeHandler', async () => {
    const handler = new MergeHandler('/tmp/test-repo');
    const result = await handler.merge('feature/test');
    expect(result.success).toBe(true);
    expect(result.conflicts).toEqual([]);
  });

  it('should not be in merge in progress by default', async () => {
    const handler = new MergeHandler('/tmp/test-repo');
    const inProgress = await handler.isMergeInProgress();
    expect(inProgress).toBe(false);
  });

  it('should return empty diff from DiffGenerator', async () => {
    const generator = new DiffGenerator('/tmp/test-repo');
    const diff = await generator.getDiff();
    expect(Array.isArray(diff)).toBe(true);
  });

  it('should format diff output', () => {
    const generator = new DiffGenerator('/tmp/test-repo');
    const result = generator.formatDiff([{
      oldPath: 'a.ts',
      newPath: 'a.ts',
      status: 'modified',
      additions: 5,
      deletions: 2,
      hunks: [],
    }]);
    expect(result).toContain('a.ts');
    expect(result).toContain('+5');
  });
});

describe('Version Control - GitHub', () => {
  it('should initialize GitHubClient', () => {
    const client = new GitHubClient({ token: 'test-token' });
    expect(client).toBeInstanceOf(GitHubClient);
  });

  it('should return null for non-existent repository', async () => {
    const client = new GitHubClient({ token: 'test-token' });
    const repo = await client.getRepository('test', 'repo');
    expect(repo).toBeNull();
  });

  it('should initialize PRHandler', () => {
    const handler = new PRHandler('owner', 'repo', 'token');
    expect(handler).toBeInstanceOf(PRHandler);
  });

  it('should return empty PR list', async () => {
    const handler = new PRHandler('owner', 'repo', 'token');
    const prs = await handler.list();
    expect(Array.isArray(prs)).toBe(true);
    expect(prs).toHaveLength(0);
  });

  it('should initialize IssueHandler', () => {
    const handler = new IssueHandler('owner', 'repo', 'token');
    expect(handler).toBeInstanceOf(IssueHandler);
  });

  it('should return empty issue list', async () => {
    const handler = new IssueHandler('owner', 'repo', 'token');
    const issues = await handler.list();
    expect(Array.isArray(issues)).toBe(true);
    expect(issues).toHaveLength(0);
  });
});
