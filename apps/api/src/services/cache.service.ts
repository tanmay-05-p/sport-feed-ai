import NodeCache from 'node-cache';
import { config } from '../config/app.config.js';

// Global cache instance
const cache = new NodeCache({
  stdTTL: config.cache.ttlSeconds,
  checkperiod: config.cache.checkPeriod,
  useClones: false,
});

export interface CacheService {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T, ttl?: number): boolean;
  del(key: string): number;
  flush(): void;
  keys(): string[];
  stats(): NodeCache.Stats;
}

export const cacheService: CacheService = {
  get<T>(key: string): T | undefined {
    return cache.get<T>(key);
  },

  set<T>(key: string, value: T, ttl?: number): boolean {
    if (ttl !== undefined) {
      return cache.set(key, value, ttl);
    }
    return cache.set(key, value);
  },

  del(key: string): number {
    return cache.del(key);
  },

  flush(): void {
    cache.flushAll();
  },

  keys(): string[] {
    return cache.keys();
  },

  stats(): NodeCache.Stats {
    return cache.getStats();
  },
};

/**
 * Create a cache key from components
 */
export function createCacheKey(...parts: string[]): string {
  return parts.join(':');
}

/**
 * Wrap a function with caching
 */
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  const cached = cacheService.get<T>(key);
  if (cached !== undefined) {
    return cached;
  }

  const result = await fn();
  cacheService.set(key, result, ttl);
  return result;
}
