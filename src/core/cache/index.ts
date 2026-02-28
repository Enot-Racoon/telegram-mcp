import type Database from 'better-sqlite3';
import type { CacheStats } from '../../types/index.js';

/**
 * Cache manager using SQLite storage
 */
export class CacheManager {
  private db: Database.Database;
  private hitCount = 0;
  private missCount = 0;

  constructor(db: Database.Database) {
    this.db = db;
  }

  /**
   * Set a value in cache with optional TTL
   */
  set<T>(key: string, value: T, ttlMs?: number): void {
    const now = Date.now();
    const expiresAt = ttlMs ? now + ttlMs : null;

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO cache (key, value, expires_at, created_at)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(key, JSON.stringify(value), expiresAt, now);
  }

  /**
   * Get a value from cache
   */
  get<T>(key: string): T | null {
    const stmt = this.db.prepare('SELECT value, expires_at FROM cache WHERE key = ?');
    const row = stmt.get(key) as { value: string; expires_at: number | null } | undefined;

    if (!row) {
      this.missCount++;
      return null;
    }

    // Check if expired
    if (row.expires_at && row.expires_at < Date.now()) {
      this.delete(key);
      this.missCount++;
      return null;
    }

    this.hitCount++;
    return JSON.parse(row.value) as T;
  }

  /**
   * Delete a key from cache
   */
  delete(key: string): boolean {
    const stmt = this.db.prepare('DELETE FROM cache WHERE key = ?');
    const result = stmt.run(key);
    return result.changes > 0;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.db.exec('DELETE FROM cache');
  }

  /**
   * Clear cache entries by prefix
   */
  clearByPrefix(prefix: string): void {
    const stmt = this.db.prepare('DELETE FROM cache WHERE key LIKE ?');
    stmt.run(`${prefix}%`);
  }

  /**
   * Get cache statistics
   */
  stats(): CacheStats {
    const totalStmt = this.db.prepare('SELECT COUNT(*) as count FROM cache');
    const expiredStmt = this.db.prepare(
      'SELECT COUNT(*) as count FROM cache WHERE expires_at IS NOT NULL AND expires_at < ?'
    );
    const sizeStmt = this.db.prepare('SELECT SUM(length(value)) as size FROM cache');

    const total = (totalStmt.get() as { count: number }).count;
    const expired = (expiredStmt.get(Date.now()) as { count: number }).count;
    const sizeResult = sizeStmt.get() as { size: number | null };

    return {
      totalEntries: total,
      expiredEntries: expired,
      hitCount: this.hitCount,
      missCount: this.missCount,
      size: sizeResult.size || 0,
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const stmt = this.db.prepare('DELETE FROM cache WHERE expires_at IS NOT NULL AND expires_at < ?');
    const result = stmt.run(Date.now());
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
