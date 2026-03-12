export type CacheStrategyName = 'cache-first' | 'network-first' | 'stale-while-revalidate' | 'network-only';

export interface CacheStrategyOptions {
  cacheName: string;
  maxAgeSeconds?: number;
  maxEntries?: number;
}

export const cacheStrategy = {
  async staleWhileRevalidate(request: Request, options: CacheStrategyOptions): Promise<Response> {
    const cache = await caches.open(options.cacheName);
    const cached = await cache.match(request);

    const networkFetch = fetch(request).then((res) => {
      if (res.ok) cache.put(request, res.clone());
      return res;
    });

    return cached ?? networkFetch;
  },

  async networkOnly(request: Request): Promise<Response> {
    return fetch(request);
  },

  async expired(response: Response, maxAgeSeconds: number): Promise<boolean> {
    const dateHeader = response.headers.get('date');
    if (!dateHeader) return false;
    const age = (Date.now() - new Date(dateHeader).getTime()) / 1000;
    return age > maxAgeSeconds;
  },
};
