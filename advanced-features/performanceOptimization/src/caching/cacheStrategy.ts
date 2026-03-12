export type CacheStrategyType = 'lru' | 'lfu' | 'ttl' | 'fifo' | 'arc';

export interface CacheConfig {
  strategy: CacheStrategyType;
  maxSize?: number;
  ttlMs?: number;
  maxMemoryMb?: number;
}

export interface CacheEntry<T = unknown> {
  key: string;
  value: T;
  createdAt: number;
  expiresAt?: number;
  hitCount: number;
  lastAccessedAt: number;
  size: number;
}

export class CacheStrategy<T = unknown> {
  private entries: Map<string, CacheEntry<T>> = new Map();
  private config: CacheConfig;
  private accessCounter = 0;

  constructor(config: CacheConfig) {
    this.config = config;
  }

  get(key: string): T | null {
    const entry = this.entries.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.entries.delete(key);
      return null;
    }
    entry.hitCount++;
    entry.lastAccessedAt = ++this.accessCounter;
    return entry.value;
  }

  set(key: string, value: T, ttlMs?: number): void {
    if (this.config.maxSize && this.entries.size >= this.config.maxSize) {
      this.evict();
    }
    const entry: CacheEntry<T> = {
      key,
      value,
      createdAt: Date.now(),
      expiresAt: ttlMs ? Date.now() + ttlMs : (this.config.ttlMs ? Date.now() + this.config.ttlMs : undefined),
      hitCount: 0,
      lastAccessedAt: ++this.accessCounter,
      size: JSON.stringify(value).length,
    };
    this.entries.set(key, entry);
  }

  delete(key: string): boolean {
    return this.entries.delete(key);
  }

  has(key: string): boolean {
    const entry = this.entries.get(key);
    if (!entry) return false;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.entries.delete(key);
      return false;
    }
    return true;
  }

  clear(): void {
    this.entries.clear();
  }

  private evict(): void {
    switch (this.config.strategy) {
      case 'lru': {
        let oldest: CacheEntry<T> | null = null;
        for (const entry of this.entries.values()) {
          if (!oldest || entry.lastAccessedAt < oldest.lastAccessedAt) oldest = entry;
        }
        if (oldest) this.entries.delete(oldest.key);
        break;
      }
      case 'lfu': {
        let leastUsed: CacheEntry<T> | null = null;
        for (const entry of this.entries.values()) {
          if (!leastUsed || entry.hitCount < leastUsed.hitCount) leastUsed = entry;
        }
        if (leastUsed) this.entries.delete(leastUsed.key);
        break;
      }
      case 'fifo': {
        const firstKey = this.entries.keys().next().value;
        if (firstKey) this.entries.delete(firstKey);
        break;
      }
      default: {
        const firstKey = this.entries.keys().next().value;
        if (firstKey) this.entries.delete(firstKey);
      }
    }
  }

  getStats(): { size: number; hitRate: number; memoryUsageBytes: number } {
    const totalHits = Array.from(this.entries.values()).reduce((s, e) => s + e.hitCount, 0);
    const totalAccesses = totalHits + this.entries.size;
    return {
      size: this.entries.size,
      hitRate: totalAccesses > 0 ? totalHits / totalAccesses : 0,
      memoryUsageBytes: Array.from(this.entries.values()).reduce((s, e) => s + e.size, 0),
    };
  }
}
