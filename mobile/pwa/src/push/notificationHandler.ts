import type { PushPayload } from './pushManager';

export type NotificationType = 'deployment' | 'collaboration' | 'error' | 'general';

export const notificationHandler = {
  buildDeploymentPayload(success: boolean, projectName: string): PushPayload {
    return {
      title: success ? '🚀 Deployment Successful' : '❌ Deployment Failed',
      body: `Project "${projectName}" ${success ? 'deployed successfully.' : 'failed to deploy.'}`,
      icon: '/icons/icon-192.png',
      url: '/deployments',
    };
  },

  buildCollaborationPayload(actor: string, action: string): PushPayload {
    return {
      title: '👥 Collaboration Update',
      body: `${actor} ${action}`,
      icon: '/icons/icon-192.png',
      url: '/',
    };
  },

  buildErrorPayload(message: string): PushPayload {
    return {
      title: '⚠️ Error',
      body: message,
      icon: '/icons/icon-192.png',
      url: '/',
    };
  },

  /** Request browser notification permission. */
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
  },

  /** Show a simple browser notification directly (no service worker). */
  showDirect(payload: PushPayload): void {
    if (Notification.permission !== 'granted') return;
    new Notification(payload.title, {
      body: payload.body,
      icon: payload.icon,
    });
  },
};
