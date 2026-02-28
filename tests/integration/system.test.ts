import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import * as fs from "node:fs";
import * as path from "node:path";
import { tmpdir } from "node:os";

import { CacheManager } from "~/core/cache";
import { Logger } from "~/core/logging";
import { AccountManager } from "~/accounts/AccountManager";
import { TelegramService } from "~/telegram/TelegramService";
import { MockTelegramProvider } from "~/telegram/MockTelegramProvider";
import { initializeDatabase, closeDatabase } from "~/core/database";

import { applyMigrations } from "../setup";

/**
 * Integration tests for the complete system
 * Tests interaction between multiple components
 */
describe("Integration Tests", () => {
  let db: Database.Database;
  let cache: CacheManager;
  let logger: Logger;
  let accountManager: AccountManager;
  let telegramService: TelegramService;
  let dbPath: string;

  beforeEach(() => {
    dbPath = path.join(tmpdir(), `test-integration-${Date.now()}.db`);
    db = initializeDatabase(dbPath);
    applyMigrations(db);
    cache = new CacheManager(db);
    logger = new Logger(db, "debug");
    accountManager = new AccountManager(db);
    telegramService = new TelegramService(
      new MockTelegramProvider({ delayMs: 0 }),
    );
  });

  afterEach(() => {
    closeDatabase(db);
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
  });

  describe("Account and Session Flow", () => {
    it("should create account, authenticate, and log activity", async () => {
      // Create account
      const account = accountManager.createAccount("+1234567890");
      expect(account.status).toBe("pending_auth");

      // Log the account creation
      logger.info("Account created", {
        sessionId: account.id,
        metadata: { phone: account.phone },
      });

      // Authenticate with Telegram
      await telegramService.login("+1234567890");

      // Activate session
      accountManager.activateSession(
        account.id,
        "telegram-user-123",
        "testuser",
      );

      // Verify account is now active
      const updated = accountManager.getAccount(account.id);
      expect(updated?.status).toBe("active");
      expect(updated?.session?.username).toBe("testuser");

      // Verify log was created
      const logs = await logger.query({ sessionId: account.id });
      expect(logs.length).toBeGreaterThan(0);
    });
  });

  describe("Cache and Logging Integration", () => {
    it("should cache data and log cache operations", async () => {
      const cacheKey = "chats:list";
      const cacheData = [{ id: "1", title: "Test" }];

      // Cache the data
      await cache.set(cacheKey, cacheData, 60000);
      logger.debug("Cache set", { metadata: { key: cacheKey } });

      // Retrieve from cache
      const cached = await cache.get<typeof cacheData>(cacheKey);
      logger.debug("Cache get", {
        metadata: { key: cacheKey, hit: cached !== null },
      });

      expect(cached).toEqual(cacheData);

      // Verify logs
      const cacheLogs = await logger.query({ level: "debug" });
      expect(cacheLogs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Full Workflow: Login, List Chats, Send Message", () => {
    it("should complete a full user workflow", async () => {
      // 1. Create account
      const account = accountManager.createAccount("+1234567890");
      logger.info("Starting workflow", { sessionId: account.id });

      // 2. Login to Telegram
      await telegramService.login("+1234567890");
      logger.logTool("telegram", "login", { phone: "+1234567890" }, {}, 50, {
        sessionId: account.id,
      });

      // 3. Activate session
      accountManager.activateSession(account.id, "user-123");
      accountManager.touchSession(account.id);

      // 4. List chats
      const chats = await telegramService.getChats();
      logger.logTool("telegram", "listChats", {}, chats, 30, {
        sessionId: account.id,
      });

      // 5. Cache the chats
      await cache.set(`chats:${account.id}`, chats, 300000);

      // 6. Send a message
      if (chats.length > 0) {
        await telegramService.sendMessage(
          chats[0].id,
          "Hello from integration test!",
        );
        logger.logTool(
          "telegram",
          "sendMessage",
          { chatId: chats[0].id },
          {},
          20,
          { sessionId: account.id },
        );
      }

      // 7. Verify everything worked
      expect(telegramService.isAuthenticated()).toBe(true);
      expect(chats.length).toBeGreaterThan(0);
      expect(accountManager.getAccount(account.id)?.status).toBe("active");

      // 8. Verify logs were created
      const allLogs = await logger.query();
      expect(allLogs.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe("Error Handling and Logging", () => {
    it("should log errors properly", async () => {
      const account = accountManager.createAccount("+1234567890");

      // Simulate an error scenario - try to get chats without logging in
      try {
        await telegramService.getChats();
      } catch (error) {
        logger.logToolError("telegram", "getChats", {}, error as Error, 0, {
          sessionId: account.id,
        });
      }

      // Verify error was logged
      const errorLogs = await logger.query({ level: "error" });
      expect(errorLogs.length).toBeGreaterThan(0);
      expect(errorLogs[0].error).toBeDefined();
    });
  });

  describe("Multi-Account Support", () => {
    it("should handle multiple accounts independently", async () => {
      // Create two accounts
      const account1 = accountManager.createAccount("+1111111111");
      const account2 = accountManager.createAccount("+2222222222");

      // Login first account and get chats
      await telegramService.login("+1111111111");
      const chats1 = await telegramService.getChats();

      // Login second account and get chats
      await telegramService.login("+2222222222");
      const chats2 = await telegramService.getChats();

      // Cache separately
      await cache.set(`chats:${account1.id}`, chats1);
      await cache.set(`chats:${account2.id}`, chats2);

      // Verify independent caches
      const cached1 = await cache.get(`chats:${account1.id}`);
      const cached2 = await cache.get(`chats:${account2.id}`);

      expect(cached1).toEqual(chats1);
      expect(cached2).toEqual(chats2);
    });
  });

  describe("Cache Cleanup and Log Trimming", () => {
    it("should clean up expired cache and trim logs", async () => {
      // Create some cache entries with short TTL
      await cache.set("temp1", "value1", 50);
      await cache.set("temp2", "value2", 50);
      await cache.set("permanent", "value3");

      // Create some logs
      for (let i = 0; i < 20; i++) {
        logger.info(`Log message ${i}`);
      }

      // Wait for cache expiration
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Cleanup cache
      const cleaned = await cache.cleanup();
      expect(cleaned).toBe(2);

      // Trim logs to 10
      await logger.trim(10);
      expect(await logger.count()).toBeLessThanOrEqual(10);
    });
  });
});
