import { Platform } from 'react-native';
import { APP_CONSTANTS } from '../../../shared/src/constants/app.constants';

export interface LocalNotification {
  id: string;
  title: string;
  body: string;
  channel?: string;
  data?: Record<string, unknown>;
}

/**
 * Lightweight notification service wrapping the platform notification APIs.
 * On iOS/Android the implementation delegates to expo-notifications when
 * the optional dependency is available; on web it uses the Notifications API.
 */
export const notificationService = {
  async requestPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'web' && 'Notification' in globalThis) {
        const result = await Notification.requestPermission();
        return result === 'granted';
      }
      // expo-notifications permission request
      const { default: Notifications } = await import('expo-notifications').catch(() => ({ default: null }));
      if (Notifications) {
        const { status } = await Notifications.requestPermissionsAsync();
        return status === 'granted';
      }
    } catch {
      // ignore
    }
    return false;
  },

  async scheduleLocal(notification: LocalNotification): Promise<void> {
    try {
      if (Platform.OS === 'web' && 'Notification' in globalThis && Notification.permission === 'granted') {
        new Notification(notification.title, { body: notification.body });
        return;
      }
      const { default: Notifications } = await import('expo-notifications').catch(() => ({ default: null }));
      if (Notifications) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: notification.title,
            body: notification.body,
            data: notification.data ?? {},
          },
          trigger: null,
        });
      }
    } catch {
      // ignore
    }
  },

  async notifyDeployment(status: 'success' | 'failed', projectName: string): Promise<void> {
    await notificationService.scheduleLocal({
      id: `deploy-${Date.now()}`,
      title: status === 'success' ? '🚀 Deployment Successful' : '❌ Deployment Failed',
      body: `Project "${projectName}" ${status === 'success' ? 'was deployed successfully.' : 'failed to deploy.'}`,
      channel: APP_CONSTANTS.NOTIFICATION_CHANNELS.DEPLOYMENTS,
    });
  },
};

export default notificationService;
