import Database from "better-sqlite3";
import type { DatabaseAdapter } from "./DatabaseAdapter";

/**
 * Better-sqlite3 implementation of DatabaseAdapter
 * Wraps better-sqlite3 to isolate direct dependency
 */
export class BetterSqliteAdapter implements DatabaseAdapter {
  private db: Database.Database;
  private closeFn: (() => void) | null = null;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
  }

  /**
   * Create adapter from existing database instance (for testing)
   */
  static fromDatabase(db: Database.Database): BetterSqliteAdapter {
    const adapter = new BetterSqliteAdapter(":memory:");
    (adapter as unknown as { db: Database.Database }).db = db;
    return adapter;
  }

  run(sql: string, params?: unknown[]): void {
    if (params && params.length > 0) {
      this.db.prepare(sql).run(...params);
    } else {
      this.db.exec(sql);
    }
  }

  get<T>(sql: string, params?: unknown[]): T | undefined {
    return this.db.prepare(sql).get(...(params || [])) as T | undefined;
  }

  all<T>(sql: string, params?: unknown[]): T[] {
    return this.db.prepare(sql).all(...(params || [])) as T[];
  }

  transaction<T>(fn: () => T): T {
    const transaction = this.db.transaction(fn);
    return transaction();
  }

  close(): void {
    if (this.closeFn) {
      this.closeFn();
      this.closeFn = null;
    }
    if (this.db) {
      this.db.close();
    }
  }

  /**
   * Get the underlying database instance (for migrations)
   */
  getRawDatabase(): Database.Database {
    return this.db;
  }

  /**
   * Set a custom close function
   */
  setCloseFn(fn: () => void): void {
    this.closeFn = fn;
  }
}
