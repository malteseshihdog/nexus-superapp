# NEXUS IDE — PWA

Progressive Web App layer for NEXUS IDE with offline support, caching strategies, and push notifications.

## Structure

```
src/
├── service-worker.ts      — Service worker entry point
├── offline/
│   ├── offlineManager.ts  — Cache-first / network-first strategies
│   ├── syncManager.ts     — IndexedDB pending-change queue
│   └── cacheStrategy.ts   — Stale-while-revalidate & helpers
├── push/
│   ├── pushManager.ts     — Web Push subscription management
│   └── notificationHandler.ts — Notification payload builders
├── manifest.json          — Web App Manifest
└── index.ts               — Public API & SW registration helper
```

## Features

- ✅ Installable (meets PWA criteria)
- 📶 Offline-first with IndexedDB change queue
- 🔔 Push notifications via Web Push API
- ⚡ Multiple caching strategies (cache-first, network-first, stale-while-revalidate)
- 🔄 Background sync for pending changes

## Getting Started

```bash
npm run build    # type-check
```

## Registering the Service Worker

```ts
import { registerServiceWorker } from '@nexus/mobile-pwa';
registerServiceWorker();
```
