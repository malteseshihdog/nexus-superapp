/** Lightweight synchronous/asynchronous key-value storage abstraction. */
export const storageUtils = {
  /** Synchronously retrieve a parsed JSON value (web/Node only). */
  getSync<T>(key: string): T | null {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : null;
      }
    } catch {
      // ignore
    }
    return null;
  },

  /** Asynchronously retrieve a parsed JSON value. */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : null;
      }
    } catch {
      // ignore
    }
    return null;
  },

  /** Persist a JSON-serialisable value. */
  async set<T>(key: string, value: T): Promise<void> {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch {
      // ignore
    }
  },

  /** Remove a stored key. */
  async remove(key: string): Promise<void> {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch {
      // ignore
    }
  },

  /** Remove all stored keys (full clear). */
  async clear(): Promise<void> {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
      }
    } catch {
      // ignore
    }
  },
};
