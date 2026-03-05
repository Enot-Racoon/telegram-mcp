import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getConfig } from "~/core/config";
import { initializeDatabase } from "~/core/database";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Run database migrations
 */
async function runMigrations(): Promise<void> {
  const config = getConfig();
  const dbPath = config.databasePath;

  const adapter = initializeDatabase(dbPath);

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
    adapter.ensureMigrationTable();

    // Get applied migrations
    const appliedHashes = new Set(adapter.getAppliedMigrations());

    // Apply pending migrations
    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, "utf-8");

      // Simple hash from file content
      const hash = file;

      if (!appliedHashes.has(hash)) {
        console.log(`Applying migration: ${file}`);
        adapter.runMigrations(sql);
        adapter.recordMigration(hash);
      }
    }

    console.log("Migrations completed successfully");
  } finally {
    adapter.close();
  }
}

// Run migrations
runMigrations().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
