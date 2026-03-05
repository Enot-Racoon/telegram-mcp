import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

import type { BetterSqliteAdapter } from "~/core/database";

/**
 * Apply migrations to a test database
 */
export function applyMigrations(adapter: BetterSqliteAdapter): void {
  const migrationsDir = path.join(process.cwd(), "drizzle");

  if (!fs.existsSync(migrationsDir)) {
    throw new Error(
      `Migrations directory not found at ${migrationsDir}. Run "bun run db:generate" first.`,
    );
  }

  // Create migrations tracking table
  adapter.ensureMigrationTable();

  // Get applied migrations
  const appliedHashes = new Set(adapter.getAppliedMigrations());

  // Apply pending migrations
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of migrationFiles) {
    const hash = file;

    if (!appliedHashes.has(hash)) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, "utf-8");
      adapter.runMigrations(sql);
      adapter.recordMigration(hash);
    }
  }
}
