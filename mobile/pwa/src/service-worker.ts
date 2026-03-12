/// <reference lib="webworker" />
import { offlineManager } from './offline/offlineManager';
import { syncManager } from './offline/syncManager';
import { pushManager } from './push/pushManager';

const CACHE_NAME = 'nexus-ide-v1';
const STATIC_ASSETS = ['/', '/index.html', '/manifest.json'];

declare const self: ServiceWorkerGlobalScope;

self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event: FetchEvent) => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('/api/')) {
    event.respondWith(offlineManager.networkFirst(event.request));
  } else {
    event.respondWith(offlineManager.cacheFirst(event.request));
  }
});

self.addEventListener('sync', (event: SyncEvent) => {
  if (event.tag === 'sync-changes') {
    event.waitUntil(syncManager.syncPendingChanges());
  }
});

self.addEventListener('push', (event: PushEvent) => {
  event.waitUntil(pushManager.handlePush(event));
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  event.waitUntil(
    self.clients.openWindow(event.notification.data?.url ?? '/')
  );
});
