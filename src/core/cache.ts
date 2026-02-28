import { eq, like, lt, count, sum, type SQL, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";

import { cache as cacheTable } from "~/core/database";
import type { CacheStats } from "~/types";

/**
 * Cache manager using Drizzle ORM with SQLite storage
 */
export class CacheManager {
  private db: ReturnType<typeof drizzle>;
  private hitCount = 0;
  private missCount = 0;

  constructor(db: Database.Database) {
    this.db = drizzle(db, { schema: { cache: cacheTable } });
  }

  /**
   * Set a value in cache with optional TTL
   */
  async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    const now = Date.now();
    const expiresAt = ttlMs ? now + ttlMs : null;

    await this.db
      .insert(cacheTable)
      .values({
        key,
        value: JSON.stringify(value),
        expiresAt,
        createdAt: now,
      })
      .onConflictDoUpdate({
        target: cacheTable.key,
        set: {
          value: JSON.stringify(value),
          expiresAt,
          createdAt: now,
        },
      });
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const result = await this.db
      .select()
      .from(cacheTable)
      .where(eq(cacheTable.key, key))
      .get();

    if (!result) {
      this.missCount++;
      return null;
    }

    // Check if expired
    if (result.expiresAt && result.expiresAt < Date.now()) {
      await this.delete(key);
      this.missCount++;
      return null;
    }

    this.hitCount++;
    return JSON.parse(result.value) as T;
  }

  /**
   * Delete a key from cache
   */
  async delete(key: string): Promise<boolean> {
    const result = await this.db
      .delete(cacheTable)
      .where(eq(cacheTable.key, key))
      .run();

    return result.changes > 0;
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    await this.db.delete(cacheTable).run();
  }

  /**
   * Clear cache entries by prefix
   */
  async clearByPrefix(prefix: string): Promise<void> {
    await this.db
      .delete(cacheTable)
      .where(like(cacheTable.key, `${prefix}%`))
      .run();
  }

  /**
   * Get cache statistics
   */
  async stats(): Promise<CacheStats> {
    const now = Date.now();

    const totalResult = await this.db
      .select({ count: count() })
      .from(cacheTable)
      .get();

    const expiredResult = await this.db
      .select({ count: count() })
      .from(cacheTable)
      .where(lt(cacheTable.expiresAt, now))
      .get();

    const sizeResult = await this.db
      .select({ size: sum(sql`length(${cacheTable.value})`) as never })
      .from(cacheTable)
      .get();

    return {
      totalEntries: totalResult?.count ?? 0,
      expiredEntries: expiredResult?.count ?? 0,
      hitCount: this.hitCount,
      missCount: this.missCount,
      size: Number(sizeResult?.size) ?? 0,
    };
  }

  /**
   * Clean up expired entries
   */
  async cleanup(): Promise<number> {
    const now = Date.now();
    const result = await this.db
      .delete(cacheTable)
      .where(lt(cacheTable.expiresAt, now))
      .run();

    return result.changes;
  }

  /**
   * Reset statistics (useful for testing)
   */
  resetStats(): void {
    this.hitCount = 0;
    this.missCount = 0;
  }
}
