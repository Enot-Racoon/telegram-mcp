import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Initialize the SQLite database with required tables
 */
export function initializeDatabase(dbPath: string): Database.Database {
  // Ensure directory exists
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(dbPath);

  // Enable WAL mode for better concurrency
  db.pragma('journal_mode = WAL');

  // Create tables
  db.exec(`
    -- Sessions table
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      phone TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL,
      username TEXT,
      created_at INTEGER NOT NULL,
      last_active_at INTEGER NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    -- Cache table
    CREATE TABLE IF NOT EXISTS cache (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      expires_at INTEGER,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_cache_expires ON cache(expires_at);

    -- Logs table
    CREATE TABLE IF NOT EXISTS logs (
      id TEXT PRIMARY KEY,
      timestamp INTEGER NOT NULL,
      level TEXT NOT NULL,
      tool TEXT,
      action TEXT,
      arguments TEXT,
      result TEXT,
      error TEXT,
      duration INTEGER,
      session_id TEXT,
      project_id TEXT,
      server_id TEXT,
      metadata TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);
    CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level);
    CREATE INDEX IF NOT EXISTS idx_logs_session ON logs(session_id);
    CREATE INDEX IF NOT EXISTS idx_logs_tool ON logs(tool);

    -- Config table
    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    -- Stats table
    CREATE TABLE IF NOT EXISTS stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      metric_name TEXT NOT NULL,
      metric_value REAL NOT NULL,
      timestamp INTEGER NOT NULL,
      tags TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_stats_metric ON stats(metric_name);
    CREATE INDEX IF NOT EXISTS idx_stats_timestamp ON stats(timestamp);
  `);

  return db;
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
