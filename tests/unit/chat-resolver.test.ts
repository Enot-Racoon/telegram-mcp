import { describe, it, expect, beforeEach } from "vitest";

import { TelegramMCPServer } from "~/server";
import { getConfig } from "~/core/config";
import {
  InMemoryAccountRepository,
  InMemoryCacheRepository,
  InMemoryLogRepository,
} from "~/core/repositories";
import { Logger } from "~/core/logging";
import { CacheManager } from "~/core/cache";
import { AccountManager } from "~/accounts/AccountManager";
import { ProviderFactory, TelegramService } from "~/telegram";

/**
 * Tests for chat reference resolution in message tools
 */
describe("Chat Reference Resolution", () => {
  let server: TelegramMCPServer;
  let telegramService: TelegramService;

  beforeEach(() => {
    const config = getConfig();

    const accountRepo = new InMemoryAccountRepository();
    const cacheRepo = new InMemoryCacheRepository();
    const logRepo = new InMemoryLogRepository();

    const logger = new Logger(logRepo, config.logLevel);
    const cache = new CacheManager(cacheRepo);
    const accountManager = new AccountManager(accountRepo);
    const provider = ProviderFactory.create({
      type: "mock",
      mockDelayMs: 0,
      mockSimulateError: false,
    });
    telegramService = new TelegramService(provider);

    server = new TelegramMCPServer({
      config,
      logger,
      cache,
      accountManager,
      telegramService,
    });
  });

  describe("sendMessage with chat reference", () => {
    beforeEach(async () => {
      await telegramService.login("+1234567890");
    });

    it("should send message with raw chatId", async () => {
      const result = await telegramService.sendMessage("chat-1", "Test message");
      expect(result).toBeDefined();
      expect(result.text).toBe("Test message");
      expect(result.chatId).toBe("chat-1");
    });

    it("should send message with @username reference", async () => {
      const result = await telegramService.sendMessage("@john_doe", "Test message");
      expect(result).toBeDefined();
      expect(result.text).toBe("Test message");
      expect(result.chatId).toBe("chat-1");
    });

    it("should send message with username without @ prefix", async () => {
      const result = await telegramService.sendMessage("john_doe", "Test message");
      expect(result).toBeDefined();
      expect(result.text).toBe("Test message");
      expect(result.chatId).toBe("chat-1");
    });

    it("should send message with t.me link", async () => {
      const result = await telegramService.sendMessage("t.me/john_doe", "Test message");
      expect(result).toBeDefined();
      expect(result.text).toBe("Test message");
      expect(result.chatId).toBe("chat-1");
    });

    it("should send message with t.me link including slash", async () => {
      const result = await telegramService.sendMessage("t.me/project_team", "Test message");
      expect(result).toBeDefined();
      expect(result.text).toBe("Test message");
      expect(result.chatId).toBe("chat-2");
    });
  });

  describe("getMessages with chat reference", () => {
    beforeEach(async () => {
      await telegramService.login("+1234567890");
    });

    it("should get messages with raw chatId", async () => {
      const messages = await telegramService.getMessages("chat-1");
      expect(messages.length).toBeGreaterThan(0);
    });

    it("should get messages with @username reference", async () => {
      const messages = await telegramService.getMessages("@john_doe");
      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0].chatId).toBe("chat-1");
    });

    it("should get messages with t.me link", async () => {
      const messages = await telegramService.getMessages("t.me/john_doe");
      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0].chatId).toBe("chat-1");
    });
  });

  describe("getChatInfo with chat reference", () => {
    beforeEach(async () => {
      await telegramService.login("+1234567890");
    });

    it("should get chat info with raw chatId", async () => {
      const chatInfo = await telegramService.getChatInfo("chat-1");
      expect(chatInfo).toBeDefined();
      expect(chatInfo?.id).toBe("chat-1");
    });

    it("should get chat info with @username reference", async () => {
      const chatInfo = await telegramService.getChatInfo("@john_doe");
      expect(chatInfo).toBeDefined();
      expect(chatInfo?.id).toBe("chat-1");
    });

    it("should get chat info with t.me link", async () => {
      const chatInfo = await telegramService.getChatInfo("t.me/john_doe");
      expect(chatInfo).toBeDefined();
      expect(chatInfo?.id).toBe("chat-1");
    });
  });

  describe("replyMessage with chat reference", () => {
    beforeEach(async () => {
      await telegramService.login("+1234567890");
    });

    it("should reply with raw chatId", async () => {
      const result = await telegramService.replyMessage("chat-1", "msg-1", "Reply");
      expect(result).toBeDefined();
      expect(result.text).toBe("Reply");
      expect(result.replyTo?.id).toBe("msg-1");
    });

    it("should reply with @username reference", async () => {
      const result = await telegramService.replyMessage("@john_doe", "msg-1", "Reply");
      expect(result).toBeDefined();
      expect(result.text).toBe("Reply");
      expect(result.chatId).toBe("chat-1");
    });
  });

  describe("editMessage with chat reference", () => {
    beforeEach(async () => {
      await telegramService.login("+1234567890");
    });

    it("should edit with raw chatId", async () => {
      const result = await telegramService.editMessage("chat-1", "msg-4", "Edited text");
      expect(result).toBeDefined();
      expect(result.text).toBe("Edited text");
    });

    it("should edit with @username reference", async () => {
      const result = await telegramService.editMessage("@john_doe", "msg-4", "Edited text");
      expect(result).toBeDefined();
      expect(result.text).toBe("Edited text");
      expect(result.chatId).toBe("chat-1");
    });
  });

  describe("deleteMessage with chat reference", () => {
    beforeEach(async () => {
      await telegramService.login("+1234567890");
    });

    it("should delete with raw chatId", async () => {
      const result = await telegramService.deleteMessage("chat-1", "msg-1");
      expect(result).toBe(true);
    });

    it("should delete with @username reference", async () => {
      // First login to reset state
      await telegramService.login("+1234567890");
      const result = await telegramService.deleteMessage("@john_doe", "msg-4");
      expect(result).toBe(true);
    });
  });
});
