import { storageService } from './storage';
import { fileEndpoints } from '../../../shared/src/api/endpoints';
import { APP_CONSTANTS } from '../../../shared/src/constants/app.constants';
import type { FileChange } from '../../../shared/src/types/file.types';

interface PendingChange extends FileChange {
  projectId: string;
}

const PENDING_KEY = '@nexus/pending_changes';

export const syncService = {
  async queueChange(projectId: string, change: FileChange): Promise<void> {
    const pending = await storageService.get<PendingChange[]>(PENDING_KEY) ?? [];
    const existingIdx = pending.findIndex((c) => c.fileId === change.fileId);
    if (existingIdx >= 0) {
      pending[existingIdx] = { ...change, projectId };
    } else {
      pending.push({ ...change, projectId });
    }
    await storageService.set(PENDING_KEY, pending);
  },

  async syncPending(): Promise<{ synced: number; failed: number }> {
    const pending = await storageService.get<PendingChange[]>(PENDING_KEY) ?? [];
    if (pending.length === 0) return { synced: 0, failed: 0 };

    let synced = 0;
    let failed = 0;
    const remaining: PendingChange[] = [];

    for (const change of pending) {
      try {
        await fileEndpoints.updateFile(change.projectId, change.fileId, change);
        synced++;
      } catch {
        failed++;
        remaining.push(change);
      }
    }

    await storageService.set(PENDING_KEY, remaining);
    await storageService.set(APP_CONSTANTS.STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
    return { synced, failed };
  },

  async getPendingCount(): Promise<number> {
    const pending = await storageService.get<PendingChange[]>(PENDING_KEY) ?? [];
    return pending.length;
  },

  async clearPending(): Promise<void> {
    await storageService.remove(PENDING_KEY);
  },
};

export default syncService;
