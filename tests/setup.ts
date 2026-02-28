import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

/**
 * Apply migrations to a test database
 */
export function applyMigrations(db: Database.Database): void {
  const migrationsDir = path.join(process.cwd(), "drizzle");

  if (!fs.existsSync(migrationsDir)) {
    throw new Error(
      `Migrations directory not found at ${migrationsDir}. Run "bun run db:generate" first.`,
    );
  }

  // Create migrations tracking table
  db.exec(`
    CREATE TABLE IF NOT EXISTS __drizzle_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Get applied migrations
  const applied = db
    .prepare("SELECT hash FROM __drizzle_migrations")
    .all() as { hash: string }[];
  const appliedHashes = new Set(applied.map((m) => m.hash));

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
      db.exec(sql);
      db.prepare(
        "INSERT INTO __drizzle_migrations (hash) VALUES (?)",
      ).run(hash);
    }
  }
}
