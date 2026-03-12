/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  data?: Record<string, unknown>;
}

export const pushManager = {
  async handlePush(event: PushEvent): Promise<void> {
    let payload: PushPayload = { title: 'NEXUS IDE', body: 'You have a new notification.' };

    try {
      if (event.data) {
        payload = event.data.json() as PushPayload;
      }
    } catch {
      // use defaults
    }

    await self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon ?? '/icons/icon-192.png',
      badge: payload.badge ?? '/icons/icon-192.png',
      data: { url: payload.url ?? '/', ...payload.data },
    });
  },

  async subscribe(vapidPublicKey: string): Promise<PushSubscription | null> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
      return subscription;
    } catch {
      return null;
    }
  },

  async unsubscribe(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) return subscription.unsubscribe();
      return false;
    } catch {
      return false;
    }
  },
};

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}
