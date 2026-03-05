import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { BetterSqliteAdapter } from "./BetterSqliteAdapter";

export * from "./schema";
export type { DatabaseAdapter } from "./DatabaseAdapter";
export { BetterSqliteAdapter } from "./BetterSqliteAdapter";

/**
 * Initialize the SQLite database with Drizzle ORM
 * Returns a BetterSqliteAdapter instance
 */
export function initializeDatabase(dbPath: string): BetterSqliteAdapter {
  // Ensure directory exists
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return new BetterSqliteAdapter(dbPath);
}

/**
 * Create an in-memory database adapter (for testing)
 */
export function createInMemoryDatabase(): BetterSqliteAdapter {
  return new BetterSqliteAdapter(":memory:");
}

/**
 * Close the database connection
 */
export function closeDatabase(adapter: BetterSqliteAdapter): void {
  adapter.close();
}
