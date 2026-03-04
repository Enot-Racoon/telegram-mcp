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
import {
  getDatabase,
  closeDatabase,
  initializeDatabase,
  createInMemoryDatabase,
  type BetterSqliteAdapter,
} from "~/core/database";
import {
  SqliteAccountRepository,
  SqliteCacheRepository,
  SqliteLogRepository,
  InMemoryAccountRepository,
  InMemoryCacheRepository,
  InMemoryLogRepository,
  type AccountRepository,
  type CacheRepository,
  type LogRepository,
} from "~/core/repositories";
import {
  getToolDefinitions,
  getToolHandler,
} from "~/tools";

/**
 * Database adapters factory
 */
export class DatabaseAdapters {
  static createSqlite(dbPath: string): {
    adapter: BetterSqliteAdapter;
    accountRepository: SqliteAccountRepository;
    cacheRepository: SqliteCacheRepository;
    logRepository: SqliteLogRepository;
  } {
    const adapter = initializeDatabase(dbPath);
    
    const accountRepository = new SqliteAccountRepository(adapter);
    const cacheRepository = new SqliteCacheRepository(adapter);
    const logRepository = new SqliteLogRepository(adapter);

    return {
      adapter,
      accountRepository,
      cacheRepository,
      logRepository,
    };
  }

  static createInMemory(): {
    adapter: BetterSqliteAdapter;
    accountRepository: InMemoryAccountRepository;
    cacheRepository: InMemoryCacheRepository;
    logRepository: InMemoryLogRepository;
  } {
    const adapter = createInMemoryDatabase();
    
    const accountRepository = new InMemoryAccountRepository();
    const cacheRepository = new InMemoryCacheRepository();
    const logRepository = new InMemoryLogRepository();

    return {
      adapter,
      accountRepository,
      cacheRepository,
      logRepository,
    };
  }
}

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
  private adapter: BetterSqliteAdapter | null = null;

  constructor(
    config: Config,
    options?: {
      useInMemory?: boolean;
      accountRepository?: InMemoryAccountRepository;
      cacheRepository?: InMemoryCacheRepository;
      logRepository?: InMemoryLogRepository;
    },
  ) {
    this.config = config;

    // Initialize repositories
    let accountRepo: AccountRepository;
    let cacheRepo: CacheRepository;
    let logRepo: LogRepository;

    if (options?.useInMemory || (options?.accountRepository && options?.cacheRepository && options?.logRepository)) {
      // Use provided in-memory repositories or create new ones
      accountRepo = options.accountRepository ?? new InMemoryAccountRepository();
      cacheRepo = options.cacheRepository ?? new InMemoryCacheRepository();
      logRepo = options.logRepository ?? new InMemoryLogRepository();
    } else {
      // Use SQLite repositories
      const db = getDatabase(config.databasePath);
      this.adapter = db;

      accountRepo = new SqliteAccountRepository(db);
      cacheRepo = new SqliteCacheRepository(db);
      logRepo = new SqliteLogRepository(db);
    }

    // Initialize components with repositories
    this.logger = new Logger(logRepo, config.logLevel);
    this.cache = new CacheManager(cacheRepo);
    this.accountManager = new AccountManager(accountRepo);

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
    
    if (this.adapter) {
      closeDatabase(this.adapter);
    }

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
