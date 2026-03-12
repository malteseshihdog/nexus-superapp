export { GitManager } from './gitManager';
export { GitClient } from './gitClient';
export { CommitHandler } from './commitHandler';
export { BranchManager } from './branchManager';
export { MergeHandler } from './mergeHandler';
export { DiffGenerator } from './diffGenerator';

export type { GitConfig, GitStatus } from './gitManager';
export type { RemoteInfo } from './gitClient';
export type { CommitOptions, CommitResult } from './commitHandler';
export type { BranchInfo } from './branchManager';
export type { MergeOptions, MergeResult, ConflictFile } from './mergeHandler';
export type { DiffOptions, FileDiff, DiffHunk, DiffLine } from './diffGenerator';
