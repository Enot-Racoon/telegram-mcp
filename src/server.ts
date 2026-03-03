import { Server } from "@modelcontextprotocol/sdk/server";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import type { Config } from "~/types";
import { Logger } from "~/core/logging";
import { CacheManager } from "~/core/cache";
import { AccountManager } from "~/accounts/AccountManager";
import { MockTelegramProvider } from "~/telegram/MockTelegramProvider";
import { TelegramService } from "~/telegram/TelegramService";
import { getDatabase, closeDatabase } from "~/core/database";
import {
  getToolDefinitions,
  getToolHandler,
} from "~/tools";

/**
 * Telegram MCP Server
 *
 * This server provides MCP (Model Context Protocol) integration for Telegram.
 * Stage 1: Foundation with mock provider (no real Telegram integration).
 */
export class TelegramMCPServer {
  private server: Server;
  private logger: Logger;
  private cache: CacheManager;
  private accountManager: AccountManager;
  private telegramService: TelegramService;
  private config: Config;
  private isRunning = false;

  constructor(config: Config) {
    this.config = config;

    // Initialize database
    const db = getDatabase(config.databasePath);

    // Initialize components
    this.logger = new Logger(db, config.logLevel);
    this.cache = new CacheManager(db);
    this.accountManager = new AccountManager(db);

    // Initialize Telegram service with mock provider
    const mockProvider = new MockTelegramProvider();
    this.telegramService = new TelegramService(mockProvider);

    // Initialize MCP server
    this.server = new Server(
      {
        name: "telegram-mcp",
        version: "0.1.0",
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      this.logger.debug("Listing available tools");

      return {
        tools: getToolDefinitions(),
      };
    });

    // Call tool handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const startTime = Date.now();

      this.logger.info("Tool call requested", {
        tool: name,
        arguments: args,
      });

      try {
        const handler = getToolHandler(name);

        if (!handler) {
          return {
            content: [
              {
                type: "text",
                text: `Unknown tool: ${name}`,
              },
            ],
            isError: true,
          };
        }

        const result = await handler(args, {
          server: this.server,
          logger: this.logger,
          cache: this.cache,
          telegramService: this.telegramService,
          accountManager: this.accountManager,
        });

        this.logger.logTool(
          "telegram",
          name,
          args || {},
          result,
          Date.now() - startTime,
        );

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        this.logger.logToolError(
          "telegram",
          name,
          args || {},
          error instanceof Error ? error : new Error(errorMessage),
          Date.now() - startTime,
        );

        return {
          content: [
            {
              type: "text",
              text: `Error: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });

    // Error handler
    this.server.onerror = (error) => {
      this.logger.error("Server error", { error: error.message });
    };

    // Close handler
    this.server.onclose = () => {
      this.logger.info("Server closed", {
        tool: "self",
        action: "close",
      });
      this.isRunning = false;
    };
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error("Server is already running");
    }

    this.logger.info("Starting Telegram MCP Server", {
      tool: "self",
      action: "start",
      arguments: {
        databasePath: this.config.databasePath,
        logLevel: this.config.logLevel,
      },
    });

    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    this.isRunning = true;

    this.logger.info("Telegram MCP Server started successfully", {
      tool: "self",
      action: "start",
    });
  }

  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.logger.info("Stopping Telegram MCP Server", {
      tool: "self",
      action: "stop",
    });

    await this.server.close();
    closeDatabase(getDatabase(this.config.databasePath));

    this.isRunning = false;
  }

  /**
   * Check if server is running
   */
  getRunningStatus(): boolean {
    return this.isRunning;
  }

  /**
   * Get the logger instance
   */
  getLogger(): Logger {
    return this.logger;
  }

  /**
   * Get the cache manager
   */
  getCache(): CacheManager {
    return this.cache;
  }

  /**
   * Get the account manager
   */
  getAccountManager(): AccountManager {
    return this.accountManager;
  }

  /**
   * Get the Telegram service
   */
  getTelegramService(): TelegramService {
    return this.telegramService;
  }
}
