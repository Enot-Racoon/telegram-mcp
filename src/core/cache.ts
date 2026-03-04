import type { CacheRepository, CacheStats } from "~/core/repositories";

/**
 * Cache manager using repository pattern
 */
export class CacheManager {
  private cacheRepository: CacheRepository;

  constructor(cacheRepository: CacheRepository) {
    this.cacheRepository = cacheRepository;
  }

  /**
   * Set a value in cache with optional TTL
   */
  async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    const expiresAt = ttlMs ? Date.now() + ttlMs : null;
    this.cacheRepository.set(key, value, expiresAt);
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cacheRepository.get<T>(key);
    return entry ? entry.value : null;
  }

  /**
   * Delete a key from cache
   */
  async delete(key: string): Promise<boolean> {
    return this.cacheRepository.delete(key);
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    this.cacheRepository.clear();
  }

  /**
   * Clear cache entries by prefix
   */
  async clearByPrefix(prefix: string): Promise<void> {
    this.cacheRepository.clearByPrefix(prefix);
  }

  /**
   * Get cache statistics
   */
  async stats(): Promise<CacheStats> {
    return this.cacheRepository.stats();
  }

  /**
   * Clean up expired entries
   */
  async cleanup(): Promise<number> {
    return this.cacheRepository.cleanup();
  }

  /**
   * Reset statistics (useful for testing)
   */
  resetStats(): void {
    this.cacheRepository.resetStats();
  }
}
