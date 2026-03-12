export { offlineManager, syncManager, cacheStrategy } from './offline';
export { pushManager, notificationHandler } from './push';
export type { PendingChange, CacheStrategyName, CacheStrategyOptions } from './offline';
export type { PushPayload, NotificationType } from './push';

/** Register the service worker in the browser. */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', { scope: '/' });
    console.info('[PWA] Service worker registered:', registration.scope);
    return registration;
  } catch (err) {
    console.error('[PWA] Service worker registration failed:', err);
    return null;
  }
}

/** Unregister all service workers. */
export async function unregisterServiceWorkers(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((r) => r.unregister()));
}
