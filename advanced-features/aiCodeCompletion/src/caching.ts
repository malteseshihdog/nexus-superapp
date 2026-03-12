import type { CompletionRequest, CompletionResponse } from './providers/openai.provider';

export interface CacheEntry {
  response: CompletionResponse;
  createdAt: Date;
  expiresAt: Date;
  hitCount: number;
}

export interface CacheStats {
  totalEntries: number;
  hitRate: number;
  hits: number;
  misses: number;
  memoryUsageBytes: number;
}

export class CompletionCache {
  private cache: Map<string, CacheEntry> = new Map();
  private hits = 0;
  private misses = 0;
  private ttlMs: number;
  private maxEntries: number;

  constructor(ttlMs = 5 * 60 * 1000, maxEntries = 500) {
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
  }

  private buildKey(request: CompletionRequest): string {
    return `${request.language}::${request.code}::${request.cursorPosition.line}:${request.cursorPosition.column}`;
  }

  get(request: CompletionRequest): CompletionResponse | null {
    const key = this.buildKey(request);
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    if (new Date() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    entry.hitCount++;
    this.hits++;
    return entry.response;
  }

  set(request: CompletionRequest, response: CompletionResponse): void {
    if (this.cache.size >= this.maxEntries) {
      this.evictOldest();
    }

    const key = this.buildKey(request);
    this.cache.set(key, {
      response,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.ttlMs),
      hitCount: 0,
    });
  }

  private evictOldest(): void {
    let oldestKey = '';
    let oldestTime = Infinity;
    for (const [key, entry] of this.cache.entries()) {
      const time = entry.createdAt.getTime();
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }
    if (oldestKey) this.cache.delete(oldestKey);
  }

  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      totalEntries: this.cache.size,
      hitRate: total > 0 ? this.hits / total : 0,
      hits: this.hits,
      misses: this.misses,
      memoryUsageBytes: this.cache.size * 1024,
    };
  }
}
