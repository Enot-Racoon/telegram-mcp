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
   * Set a custom close function
   */
  setCloseFn(fn: () => void): void {
    this.closeFn = fn;
  }

  /**
   * Run migrations - internal method for infrastructure use only
   * This method is package-private and should only be called from migrate.ts
   */
  runMigrations(migrationSql: string): void {
    this.db.exec(migrationSql);
  }

  /**
   * Check if migration table exists - internal method for infrastructure use only
   */
  hasMigrationTable(): boolean {
    try {
      const result = this.db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='__drizzle_migrations'",
        )
        .get();
      return !!result;
    } catch {
      return false;
    }
  }

  /**
   * Create migration tracking table - internal method for infrastructure use only
   */
  ensureMigrationTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS __drizzle_migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hash TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  /**
   * Get applied migration hashes - internal method for infrastructure use only
   */
  getAppliedMigrations(): string[] {
    if (!this.hasMigrationTable()) {
      return [];
    }
    const rows = this.db
      .prepare("SELECT hash FROM __drizzle_migrations")
      .all() as { hash: string }[];
    return rows.map((r) => r.hash);
  }

  /**
   * Record a migration as applied - internal method for infrastructure use only
   */
  recordMigration(hash: string): void {
    this.db
      .prepare("INSERT INTO __drizzle_migrations (hash) VALUES (?)")
      .run(hash);
  }
}
