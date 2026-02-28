import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

import * as schema from "./schema";

export * from "./schema";

/**
 * Initialize the SQLite database with Drizzle ORM
 */
export function initializeDatabase(dbPath: string): Database.Database {
  // Ensure directory exists
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(dbPath);

  // Enable WAL mode for better concurrency
  db.pragma("journal_mode = WAL");

  return db;
}

/**
 * Get Drizzle database instance with schema
 */
export function getDrizzleDb(db: Database.Database) {
  return drizzle(db, { schema });
}

/**
 * Close the database connection
 */
export function closeDatabase(db: Database.Database): void {
  db.close();
}

/**
 * Get the database instance (singleton pattern for testing)
 */
let dbInstance: Database.Database | null = null;

export function getDatabase(dbPath: string): Database.Database {
  if (!dbInstance) {
    dbInstance = initializeDatabase(dbPath);
  }
  return dbInstance;
}

export function resetDatabaseInstance(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
