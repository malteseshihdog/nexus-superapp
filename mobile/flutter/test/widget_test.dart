// Flutter widget tests use the Dart test framework.
// This file is intentionally minimal; run `flutter test` in mobile/flutter/.
import 'package:flutter_test/flutter_test.dart';
import '../lib/utils/helpers.dart';
import '../lib/models/user.dart';
import '../lib/models/project.dart';

void main() {
  group('helpers', () {
    test('formatBytes returns correct units', () {
      expect(formatBytes(0), '0 B');
      expect(formatBytes(1024), '1.0 KB');
      expect(formatBytes(1048576), '1.0 MB');
    });

    test('truncate shortens long text', () {
      expect(truncate('Hello World!', 8), 'Hello...');
      expect(truncate('Hi', 10), 'Hi');
    });

    test('formatRelativeTime returns string', () {
      final result = formatRelativeTime(DateTime.now().subtract(const Duration(minutes: 5)));
      expect(result, contains('m ago'));
    });
  });

  group('User model', () {
    test('fromJson round-trips', () {
      final json = {
        'id': '123',
        'email': 'test@nexus.io',
        'username': 'testuser',
        'displayName': 'Test User',
        'createdAt': DateTime.now().toIso8601String(),
      };
      final user = User.fromJson(json);
      expect(user.id, '123');
      expect(user.email, 'test@nexus.io');
      expect(user.username, 'testuser');
    });
  });

  group('Project model', () {
    test('fromJson sets status correctly', () {
      final json = {
        'id': 'proj-1',
        'name': 'My App',
        'language': 'typescript',
        'ownerId': 'user-1',
        'isPublic': false,
        'status': 'active',
        'createdAt': DateTime.now().toIso8601String(),
        'updatedAt': DateTime.now().toIso8601String(),
      };
      final project = Project.fromJson(json);
      expect(project.name, 'My App');
      expect(project.status, ProjectStatus.active);
    });
  });
}
