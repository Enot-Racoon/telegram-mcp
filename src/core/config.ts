import os from "node:os";
import path from "node:path";

import type { Config } from "~/types";

const DEFAULT_CONFIG: Config = {
  databasePath: path.join(os.homedir(), ".telegram-mcp", "telegram.db"),
  logLevel: "info",
  cacheDefaultTTL: 3600000, // 1 hour in ms
  maxLogEntries: 10000,
};

/**
 * Get configuration from environment variables with defaults
 */
export function getConfig(): Config {
  const config: Config = { ...DEFAULT_CONFIG };

  // Override database path if provided via environment
  const dbPath = process.env.TELEGRAM_MCP_DB_PATH;
  if (dbPath) {
    config.databasePath = dbPath;
  }

  // Override log level if provided via environment
  const logLevel = process.env.TELEGRAM_MCP_LOG_LEVEL as Config["logLevel"];
  if (logLevel && ["debug", "info", "warn", "error"].includes(logLevel)) {
    config.logLevel = logLevel;
  }

  // Override cache TTL if provided via environment
  const cacheTTL = process.env.TELEGRAM_MCP_CACHE_TTL;
  if (cacheTTL) {
    const ttl = parseInt(cacheTTL, 10);
    if (!Number.isNaN(ttl) && ttl > 0) {
      config.cacheDefaultTTL = ttl;
    }
  }

  // Override max log entries if provided via environment
  const maxLogs = process.env.TELEGRAM_MCP_MAX_LOGS;
  if (maxLogs) {
    const max = parseInt(maxLogs, 10);
    if (!Number.isNaN(max) && max > 0) {
      config.maxLogEntries = max;
    }
  }

  return config;
}

/**
 * Ensure the database directory exists
 */
export function ensureDatabaseDirectory(dbPath: string): string {
  const dir = path.dirname(dbPath);
  if (!dirExists(dir)) {
    // Directory creation is handled by the database module
  }
  return dbPath;
}

function dirExists(dir: string): boolean {
  try {
    const fs = require("node:fs") as typeof import("node:fs");
    return fs.existsSync(dir);
  } catch {
    return false;
  }
}

export { DEFAULT_CONFIG };
