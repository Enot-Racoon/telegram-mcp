import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getConfig } from "~/core/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Run database migrations
 */
async function runMigrations(): Promise<void> {
  const config = getConfig();
  const dbPath = config.databasePath;

  // Ensure directory exists
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const db = new Database(dbPath);

  try {
    // Read migration files - use project root
    const projectRoot = path.join(__dirname, "../../..");
    const migrationsDir = path.join(projectRoot, "drizzle");

    if (!fs.existsSync(migrationsDir)) {
      console.error(
        'Migrations directory not found. Run "bun run db:generate" first.',
      );
      process.exit(1);
    }

    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    if (migrationFiles.length === 0) {
      console.log("No migrations to apply");
      return;
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
    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, "utf-8");

      // Simple hash from file content
      const hash = file;

      if (!appliedHashes.has(hash)) {
        console.log(`Applying migration: ${file}`);
        db.exec(sql);
        db.prepare("INSERT INTO __drizzle_migrations (hash) VALUES (?)").run(
          hash,
        );
      }
    }

    console.log("Migrations completed successfully");
  } finally {
    db.close();
  }
}

// Run migrations
runMigrations().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
