import type {
  CacheRepository,
  CacheEntry,
  CacheStats,
} from "./CacheRepository";

/**
 * In-memory implementation of CacheRepository for testing
 */
export class InMemoryCacheRepository implements CacheRepository {
  private cache: Map<string, CacheEntry> = new Map();
  private hitCount = 0;
  private missCount = 0;

  set<T>(key: string, value: T, expiresAt?: number | null): void {
    this.cache.set(key, {
      key,
      value,
      expiresAt: expiresAt ?? null,
      createdAt: Date.now(),
    });
  }

  get<T>(key: string): CacheEntry<T> | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.missCount++;
      return null;
    }

    // Check if expired
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      this.missCount++;
      return null;
    }

    this.hitCount++;
    return entry as CacheEntry<T>;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  clearByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  stats(): CacheStats {
    const now = Date.now();
    let expiredEntries = 0;

    for (const entry of this.cache.values()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        expiredEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      expiredEntries,
      hitCount: this.hitCount,
      missCount: this.missCount,
      size: Array.from(this.cache.values()).reduce(
        (sum, e) => sum + JSON.stringify(e.value).length,
        0,
      ),
    };
  }

  cleanup(): number {
    const now = Date.now();
    let count = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        this.cache.delete(key);
        count++;
      }
    }

    return count;
  }

  resetStats(): void {
    this.hitCount = 0;
    this.missCount = 0;
  }

  getHitCount(): number {
    return this.hitCount;
  }

  getMissCount(): number {
    return this.missCount;
  }
}
