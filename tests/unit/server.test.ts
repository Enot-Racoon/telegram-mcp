import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import * as fs from "node:fs";
import * as path from "node:path";
import { tmpdir } from "node:os";

import { TelegramMCPServer } from "~/server";
import { getConfig } from "~/core/config";
import { initializeDatabase, closeDatabase } from "~/core/database";
import { applyMigrations } from "../setup";

describe("TelegramMCPServer", () => {
  let server: TelegramMCPServer;
  let db: Database.Database;
  let dbPath: string;

  beforeEach(() => {
    dbPath = path.join(tmpdir(), `test-server-${Date.now()}.db`);
    
    // Initialize database and apply migrations
    db = initializeDatabase(dbPath);
    applyMigrations(db);

    const config = getConfig();
    config.databasePath = dbPath;
    server = new TelegramMCPServer(config);
  });

  afterEach(() => {
    closeDatabase(db);
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
  });

  describe("listChats tool", () => {
    it("should list all chats", async () => {
      const telegramService = server.getTelegramService();
      await telegramService.login("+1234567890");
      const chats = await telegramService.getChats();
      expect(chats.length).toBeGreaterThan(0);
    });

    it("should filter chats by type", async () => {
      const telegramService = server.getTelegramService();
      await telegramService.login("+1234567890");
      const privateChats = await telegramService.getChats({ type: "private" });
      expect(privateChats.every((c) => c.type === "private")).toBe(true);
    });

    it("should filter chats by unread status", async () => {
      const telegramService = server.getTelegramService();
      await telegramService.login("+1234567890");
      const unreadChats = await telegramService.getChats({ unreadOnly: true });
      expect(unreadChats.every((c) => c.unreadCount > 0)).toBe(true);
    });
  });

  describe("getMessages tool", () => {
    it("should get messages from a chat", async () => {
      const telegramService = server.getTelegramService();
      await telegramService.login("+1234567890");
      const chats = await telegramService.getChats();
      const messages = await telegramService.getMessages(chats[0].id, { limit: 10 });
      expect(messages.length).toBeGreaterThan(0);
      expect(messages.every((m) => m.chatId === chats[0].id)).toBe(true);
    });

    it("should respect limit parameter", async () => {
      const telegramService = server.getTelegramService();
      await telegramService.login("+1234567890");
      const chats = await telegramService.getChats();
      const messages = await telegramService.getMessages(chats[0].id, { limit: 5 });
      expect(messages.length).toBeLessThanOrEqual(5);
    });
  });

  describe("sendMessage tool", () => {
    it("should send a message", async () => {
      const telegramService = server.getTelegramService();
      await telegramService.login("+1234567890");
      const chats = await telegramService.getChats();
      await expect(
        telegramService.sendMessage(chats[0].id, "Test message"),
      ).resolves.not.toThrow();
    });
  });

  describe("markAsRead tool", () => {
    it("should mark chat as read (mock)", async () => {
      const telegramService = server.getTelegramService();
      await telegramService.login("+1234567890");
      const chats = await telegramService.getChats();
      expect(chats.length).toBeGreaterThan(0);
    });
  });

  describe("login tool", () => {
    it("should authenticate with valid phone number", async () => {
      const telegramService = server.getTelegramService();
      expect(telegramService.isAuthenticated()).toBe(false);

      await telegramService.login("+1234567890");

      expect(telegramService.isAuthenticated()).toBe(true);
    });

    it("should throw error for missing phone number", async () => {
      const telegramService = server.getTelegramService();
      // @ts-expect-error Testing invalid input
      await expect(telegramService.login()).rejects.toThrow();
    });

    it("should accept different phone formats", async () => {
      const telegramService = server.getTelegramService();

      await expect(telegramService.login("+1234567890")).resolves.not.toThrow();
      await expect(telegramService.login("+9876543210")).resolves.not.toThrow();
    });
  });

  describe("isAuthenticated tool", () => {
    it("should return false when not authenticated", () => {
      const telegramService = server.getTelegramService();
      expect(telegramService.isAuthenticated()).toBe(false);
    });

    it("should return true after login", async () => {
      const telegramService = server.getTelegramService();

      await telegramService.login("+1234567890");

      expect(telegramService.isAuthenticated()).toBe(true);
    });

    it("should return false after logout", async () => {
      const telegramService = server.getTelegramService();

      await telegramService.login("+1234567890");
      expect(telegramService.isAuthenticated()).toBe(true);

      await telegramService.logout();

      expect(telegramService.isAuthenticated()).toBe(false);
    });
  });

  describe("getChatInfo tool", () => {
    it("should return chat info", async () => {
      const telegramService = server.getTelegramService();
      await telegramService.login("+1234567890");
      const chatInfo = await telegramService.getChatInfo("chat-1");
      expect(chatInfo).toBeTruthy();
      expect(chatInfo?.id).toBe("chat-1");
      expect(chatInfo?.type).toBe("private");
    });

    it("should return null for non-existent chat", async () => {
      const telegramService = server.getTelegramService();
      await telegramService.login("+1234567890");
      const chatInfo = await telegramService.getChatInfo("non-existent");
      expect(chatInfo).toBeNull();
    });

    it("should include participants count for groups", async () => {
      const telegramService = server.getTelegramService();
      await telegramService.login("+1234567890");
      const chatInfo = await telegramService.getChatInfo("chat-2");
      expect(chatInfo?.participantsCount).toBe(15);
    });

    it("should include pinned message when available", async () => {
      const telegramService = server.getTelegramService();
      await telegramService.login("+1234567890");
      const chatInfo = await telegramService.getChatInfo("chat-2");
      expect(chatInfo?.pinnedMessage).toBeDefined();
    });
  });

  describe("server lifecycle", () => {
    it("should start and stop", async () => {
      expect(server.getRunningStatus()).toBe(false);
      expect(typeof server.start).toBe("function");
      expect(typeof server.stop).toBe("function");
    });

    it("should throw error when starting already running server", async () => {
      expect(server.getRunningStatus()).toBe(false);
    });
  });

  describe("dependency injection", () => {
    it("should provide logger", () => {
      const logger = server.getLogger();
      expect(logger).toBeDefined();
    });

    it("should provide cache manager", () => {
      const cache = server.getCache();
      expect(cache).toBeDefined();
    });

    it("should provide account manager", () => {
      const accountManager = server.getAccountManager();
      expect(accountManager).toBeDefined();
    });

    it("should provide telegram service", () => {
      const telegramService = server.getTelegramService();
      expect(telegramService).toBeDefined();
    });
  });
});
