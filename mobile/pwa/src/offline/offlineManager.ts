const CACHE_NAME = 'nexus-ide-v1';
const API_CACHE = 'nexus-api-v1';

export const offlineManager = {
  /** Cache-first strategy — serve from cache, fall back to network. */
  async cacheFirst(request: Request): Promise<Response> {
    const cached = await caches.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  },

  /** Network-first strategy — try network, fall back to cache. */
  async networkFirst(request: Request): Promise<Response> {
    try {
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(API_CACHE);
        cache.put(request, response.clone());
      }
      return response;
    } catch {
      const cached = await caches.match(request);
      if (cached) return cached;
      return new Response(JSON.stringify({ error: 'Offline', status: 503 }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },

  /** Pre-cache a list of URLs. */
  async precache(urls: string[]): Promise<void> {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(urls);
  },

  /** Delete all cached entries matching a URL prefix. */
  async invalidate(prefix: string): Promise<void> {
    const cache = await caches.open(API_CACHE);
    const keys = await cache.keys();
    await Promise.all(
      keys
        .filter((req) => req.url.startsWith(prefix))
        .map((req) => cache.delete(req))
    );
  },
};
