import type { Config } from "~/types";
import {
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
} from "~/core/repositories";
import { Logger } from "~/core/logging";
import { CacheManager } from "~/core/cache";
import { AccountManager } from "~/accounts/AccountManager";
import {
  ProviderFactory,
  type ProviderType,
  TelegramService,
  TelegramExecutor,
} from "~/telegram";
import { TelegramMCPServer } from "~/server";

/**
 * Bootstrap options for composition root
 */
export interface BootstrapOptions {
  config: Config;
  useInMemory?: boolean;
  providerType?: ProviderType;
}

/**
 * Composition root result
 * Contains all initialized components
 */
export interface CompositionRoot {
  adapter: BetterSqliteAdapter | null;
  logger: Logger;
  cache: CacheManager;
  accountManager: AccountManager;
  telegramService: TelegramService;
  server: TelegramMCPServer;
}

/**
 * Composition root - creates and wires all dependencies
 *
 * This is the only place where dependencies are instantiated with `new`.
 * All other classes receive dependencies via constructor injection.
 */
export function composeRoot(options: BootstrapOptions): CompositionRoot {
  const { config, useInMemory = false, providerType = "mock" } = options;

  // 1. Create database adapter
  let adapter: BetterSqliteAdapter | null = null;
  let accountRepo;
  let cacheRepo;
  let logRepo;

  if (useInMemory) {
    // In-memory databases for testing
    adapter = createInMemoryDatabase();
    accountRepo = new InMemoryAccountRepository();
    cacheRepo = new InMemoryCacheRepository();
    logRepo = new InMemoryLogRepository();
  } else {
    // SQLite databases for production
    adapter = initializeDatabase(config.databasePath);
    accountRepo = new SqliteAccountRepository(adapter);
    cacheRepo = new SqliteCacheRepository(adapter);
    logRepo = new SqliteLogRepository(adapter);
  }

  // 2. Create managers (depend only on repository interfaces)
  const logger = new Logger(logRepo, config.logLevel);
  const cache = new CacheManager(cacheRepo);
  const accountManager = new AccountManager(accountRepo);

  // 3. Create Telegram provider via factory
  const provider = ProviderFactory.create({
    type: providerType,
    mockDelayMs: 50,
    mockSimulateError: false,
  });

  // 4. Create Telegram executor for retry/flood-wait handling
  const executor = new TelegramExecutor();

  // 5. Create Telegram service
  const telegramService = new TelegramService(provider, executor);

  // 6. Create MCP server with all dependencies injected
  const server = new TelegramMCPServer({
    config,
    logger,
    cache,
    accountManager,
    telegramService,
    adapter: adapter ?? undefined,
  });

  return {
    adapter,
    logger,
    cache,
    accountManager,
    telegramService,
    server,
  };
}

/**
 * Start the server using composition root
 */
export async function startServer(
  options: BootstrapOptions,
): Promise<CompositionRoot> {
  const root = composeRoot(options);
  await root.server.start();
  return root;
}
