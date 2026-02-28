#!/usr/bin/env node

import { TelegramMCPServer } from "~/server";
import { getConfig, ensureDatabaseDirectory } from "~/core/config";

/**
 * Print help message
 */
function printHelp(): void {
  console.log(`
Telegram MCP Server v0.1.0

Usage:
  telegram-mcp [options]

Options:
  --help, -h     Show this help message
  --version, -v  Show version number

Environment Variables:
  TELEGRAM_MCP_DB_PATH      Path to SQLite database (default: ~/.telegram-mcp/telegram.db)
  TELEGRAM_MCP_LOG_LEVEL    Log level: debug, info, warn, error (default: info)
  TELEGRAM_MCP_CACHE_TTL    Default cache TTL in milliseconds (default: 3600000)
  TELEGRAM_MCP_MAX_LOGS     Maximum log entries to keep (default: 10000)

Description:
  This MCP server provides Telegram integration for AI assistants.
  
  Stage 1 (Foundation):
  - Mock Telegram provider (no real API calls)
  - SQLite storage for sessions, cache, and logs
  - Account/session management
  - Structured logging

Examples:
  # Run as MCP server (via stdio)
  telegram-mcp

  # Run with custom database path
  TELEGRAM_MCP_DB_PATH=/path/to/db.db telegram-mcp

  # Run with debug logging
  TELEGRAM_MCP_LOG_LEVEL=debug telegram-mcp
`);
}

/**
 * Print version
 */
function printVersion(): void {
  console.log("0.1.0");
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // Handle CLI arguments
  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  if (args.includes("--version") || args.includes("-v")) {
    printVersion();
    process.exit(0);
  }

  // Get configuration
  const config = getConfig();
  ensureDatabaseDirectory(config.databasePath);

  // Create and start server
  const server = new TelegramMCPServer(config);

  // Handle graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    console.error(`\nReceived ${signal}, shutting down gracefully...`);
    try {
      await server.stop();
      console.error("Shutdown complete");
      process.exit(0);
    } catch (error) {
      console.error("Error during shutdown:", error);
      process.exit(1);
    }
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  try {
    await server.start();
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Run main
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
