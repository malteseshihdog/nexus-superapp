import 'api_service.dart';
import 'storage_service.dart';

/// Background sync service that pushes locally cached changes to the server.
class SyncService {
  SyncService._();
  static final instance = SyncService._();

  static const _pendingKey = 'nexus_pending_changes';

  Future<void> queueChange(String projectId, String fileId, String content) async {
    final pending = await StorageService.instance.get<List<dynamic>>(_pendingKey) ?? [];
    final existing = pending.indexWhere((e) => (e as Map)['fileId'] == fileId);
    final change = {'projectId': projectId, 'fileId': fileId, 'content': content, 'timestamp': DateTime.now().toIso8601String()};
    if (existing >= 0) {
      pending[existing] = change;
    } else {
      pending.add(change);
    }
    await StorageService.instance.set(_pendingKey, pending);
  }

  Future<Map<String, int>> syncPending() async {
    final pending = await StorageService.instance.get<List<dynamic>>(_pendingKey) ?? [];
    if (pending.isEmpty) return {'synced': 0, 'failed': 0};

    int synced = 0, failed = 0;
    final remaining = <dynamic>[];

    for (final item in pending) {
      final change = item as Map<String, dynamic>;
      try {
        await ApiService.instance.post(
          '/projects/${change['projectId']}/files/${change['fileId']}',
          {'content': change['content'], 'changeType': 'update', 'timestamp': change['timestamp']},
        );
        synced++;
      } catch (_) {
        failed++;
        remaining.add(change);
      }
    }

    await StorageService.instance.set(_pendingKey, remaining);
    return {'synced': synced, 'failed': failed};
  }
}
