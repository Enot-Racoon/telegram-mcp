import type { DatabaseAdapter } from "../database/DatabaseAdapter";
import type {
  CacheRepository,
  CacheEntry,
  CacheStats,
} from "./CacheRepository";

/**
 * SQLite implementation of CacheRepository
 */
export class SqliteCacheRepository implements CacheRepository {
  private adapter: DatabaseAdapter;
  private hitCount = 0;
  private missCount = 0;

  constructor(adapter: DatabaseAdapter) {
    this.adapter = adapter;
  }

  set<T>(key: string, value: T, expiresAt?: number | null): void {
    const now = Date.now();
    this.adapter.run(
      `INSERT INTO cache (key, value, expires_at, created_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET
         value = excluded.value,
         expires_at = excluded.expires_at,
         created_at = excluded.created_at`,
      [key, JSON.stringify(value), expiresAt ?? null, now],
    );
  }

  get<T>(key: string): CacheEntry<T> | null {
    const row = this.adapter.get<{
      key: string;
      value: string;
      expires_at: number | null;
      created_at: number;
    }>("SELECT * FROM cache WHERE key = ?", [key]);

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
    return {
      key: row.key,
      value: JSON.parse(row.value) as T,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
    };
  }

  delete(key: string): boolean {
    const result = this.adapter.run(
      "DELETE FROM cache WHERE key = ?",
      [key],
    );
    // better-sqlite3 doesn't return changes in run() result, need to use get
    const changes = this.adapter.get<{ changes: number }>(
      "SELECT changes() as changes",
    );
    return (changes?.changes ?? 0) > 0;
  }

  clear(): void {
    this.adapter.run("DELETE FROM cache");
  }

  clearByPrefix(prefix: string): void {
    this.adapter.run("DELETE FROM cache WHERE key LIKE ?", [`${prefix}%`]);
  }

  stats(): CacheStats {
    const now = Date.now();

    const totalResult = this.adapter.get<{ count: number }>(
      "SELECT COUNT(*) as count FROM cache",
    );

    const expiredResult = this.adapter.get<{ count: number }>(
      "SELECT COUNT(*) as count FROM cache WHERE expires_at < ? AND expires_at IS NOT NULL",
      [now],
    );

    const sizeResult = this.adapter.get<{ size: number }>(
      "SELECT SUM(length(value)) as size FROM cache",
    );

    return {
      totalEntries: totalResult?.count ?? 0,
      expiredEntries: expiredResult?.count ?? 0,
      hitCount: this.hitCount,
      missCount: this.missCount,
      size: sizeResult?.size ?? 0,
    };
  }

  cleanup(): number {
    const now = Date.now();
    this.adapter.run(
      "DELETE FROM cache WHERE expires_at < ? AND expires_at IS NOT NULL",
      [now],
    );
    const changes = this.adapter.get<{ changes: number }>(
      "SELECT changes() as changes",
    );
    return changes?.changes ?? 0;
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
