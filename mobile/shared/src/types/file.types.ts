export interface ProjectFile {
  id: string;
  projectId: string;
  name: string;
  path: string;
  content?: string;
  language: string;
  size: number;
  isDirectory: boolean;
  parentId?: string;
  children?: ProjectFile[];
  createdAt: string;
  updatedAt: string;
  isDirty?: boolean;
}

export interface FileTreeNode {
  id: string;
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileTreeNode[];
  isExpanded?: boolean;
  isSelected?: boolean;
}

export interface FileChange {
  fileId: string;
  path: string;
  content: string;
  changeType: 'create' | 'update' | 'delete';
  timestamp: string;
}

export interface FileConflict {
  fileId: string;
  path: string;
  localContent: string;
  remoteContent: string;
  baseContent?: string;
}
