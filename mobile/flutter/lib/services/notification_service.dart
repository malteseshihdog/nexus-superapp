import 'package:flutter_local_notifications/flutter_local_notifications.dart';

/// Push and local notification service.
class NotificationService {
  NotificationService._();
  static final instance = NotificationService._();

  final _plugin = FlutterLocalNotificationsPlugin();
  bool _initialised = false;

  Future<void> initialise() async {
    if (_initialised) return;
    const android = AndroidInitializationSettings('@mipmap/ic_launcher');
    const ios = DarwinInitializationSettings();
    await _plugin.initialize(const InitializationSettings(android: android, iOS: ios));
    _initialised = true;
  }

  Future<void> show({required String title, required String body, String? payload}) async {
    await initialise();
    const android = AndroidNotificationDetails('nexus_general', 'General', importance: Importance.high, priority: Priority.high);
    const ios = DarwinNotificationDetails();
    await _plugin.show(DateTime.now().millisecondsSinceEpoch ~/ 1000, title, body, const NotificationDetails(android: android, iOS: ios), payload: payload);
  }

  Future<void> notifyDeployment({required bool success, required String projectName}) async {
    await show(
      title: success ? '🚀 Deployment Successful' : '❌ Deployment Failed',
      body: 'Project "$projectName" ${success ? 'was deployed successfully.' : 'failed to deploy.'}',
      payload: 'deployment',
    );
  }
}
