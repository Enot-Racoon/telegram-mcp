/**
 * Cache entry structure
 */
export interface CacheEntry<T = unknown> {
  key: string;
  value: T;
  expiresAt?: number | null;
  createdAt: number;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  totalEntries: number;
  expiredEntries: number;
  hitCount: number;
  missCount: number;
  size: number;
}

/**
 * Cache repository interface
 * Defines data access operations for caching
 */
export interface CacheRepository {
  /**
   * Set a value in cache
   */
  set<T>(key: string, value: T, expiresAt?: number | null): void;

  /**
   * Get a value from cache
   */
  get<T>(key: string): CacheEntry<T> | null;

  /**
   * Delete a key from cache
   */
  delete(key: string): boolean;

  /**
   * Clear all cache entries
   */
  clear(): void;

  /**
   * Clear cache entries by prefix
   */
  clearByPrefix(prefix: string): void;

  /**
   * Get cache statistics
   */
  stats(): CacheStats;

  /**
   * Clean up expired entries
   */
  cleanup(): number;

  /**
   * Reset statistics (for testing)
   */
  resetStats(): void;

  /**
   * Get hit count
   */
  getHitCount(): number;

  /**
   * Get miss count
   */
  getMissCount(): number;
}
