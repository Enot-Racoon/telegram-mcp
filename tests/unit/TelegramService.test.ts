import { describe, it, expect, beforeEach } from "vitest";

import { TelegramService } from "~/telegram/TelegramService";
import { MockTelegramProvider } from "~/telegram/MockTelegramProvider";

describe("TelegramService", () => {
  let provider: MockTelegramProvider;
  let service: TelegramService;

  beforeEach(() => {
    provider = new MockTelegramProvider({ delayMs: 0 });
    service = new TelegramService(provider);
  });

  describe("authentication", () => {
    it("should not be authenticated initially", () => {
      expect(service.isAuthenticated()).toBe(false);
    });

    it("should authenticate via login", async () => {
      await service.login("+1234567890");
      expect(service.isAuthenticated()).toBe(true);
    });

    it("should logout", async () => {
      await service.login("+1234567890");
      await service.logout();
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe("getChats", () => {
    it("should return all chats", async () => {
      await service.login("+1234567890");
      const chats = await service.getChats();
      expect(chats.length).toBeGreaterThan(0);
    });

    it("should filter by type", async () => {
      await service.login("+1234567890");
      const privateChats = await service.getChats({ type: "private" });
      expect(privateChats.every((c) => c.type === "private")).toBe(true);
    });

    it("should filter unread only", async () => {
      await service.login("+1234567890");
      const unreadChats = await service.getChats({ unreadOnly: true });
      expect(unreadChats.every((c) => c.unreadCount > 0)).toBe(true);
    });
  });

  describe("getMessages", () => {
    it("should return messages from a chat", async () => {
      await service.login("+1234567890");
      const messages = await service.getMessages("chat-1", { limit: 10 });
      expect(messages.length).toBeGreaterThan(0);
    });

    it("should use default limit of 50", async () => {
      await service.login("+1234567890");
      const messages = await service.getMessages("chat-1");
      expect(messages.length).toBeLessThanOrEqual(50);
    });
  });

  describe("sendMessage", () => {
    it("should send a message", async () => {
      await service.login("+1234567890");
      const result = await service.sendMessage("chat-1", "Hello");
      expect(result).toBeDefined();
      expect(result.text).toBe("Hello");
    });
  });

  describe("getChat", () => {
    it("should return a specific chat", async () => {
      await service.login("+1234567890");
      const chat = await service.getChat("chat-1");
      expect(chat).toBeTruthy();
      expect(chat?.id).toBe("chat-1");
    });

    it("should return null for non-existent chat", async () => {
      await service.login("+1234567890");
      const chat = await service.getChat("non-existent");
      expect(chat).toBeNull();
    });
  });

  describe("searchMessages", () => {
    it("should find messages matching query", async () => {
      await service.login("+1234567890");
      const messages = await service.searchMessages({ query: "Hey", chatId: "chat-1" });
      expect(messages.length).toBeGreaterThan(0);
      expect(messages.every((m) => m.text.toLowerCase().includes("hey"))).toBe(
        true,
      );
    });

    it("should respect limit", async () => {
      await service.login("+1234567890");
      const messages = await service.searchMessages({ query: "test", chatId: "chat-1", limit: 5 });
      expect(messages.length).toBeLessThanOrEqual(5);
    });
  });

  describe("getUnreadCount", () => {
    it("should return total unread count", async () => {
      await service.login("+1234567890");
      const count = await service.getUnreadCount();
      expect(count).toBeGreaterThan(0);
    });
  });

  describe("getChatInfo", () => {
    it("should return chat info", async () => {
      await service.login("+1234567890");
      const chatInfo = await service.getChatInfo("chat-1");
      expect(chatInfo).toBeTruthy();
      expect(chatInfo?.id).toBe("chat-1");
      expect(chatInfo?.type).toBe("private");
    });

    it("should return null for non-existent chat", async () => {
      await service.login("+1234567890");
      const chatInfo = await service.getChatInfo("non-existent");
      expect(chatInfo).toBeNull();
    });

    it("should include participants count for groups", async () => {
      await service.login("+1234567890");
      const chatInfo = await service.getChatInfo("chat-2");
      expect(chatInfo?.participantsCount).toBe(15);
    });

    it("should include pinned message when available", async () => {
      await service.login("+1234567890");
      const chatInfo = await service.getChatInfo("chat-2");
      expect(chatInfo?.pinnedMessage).toBeDefined();
    });
  });
});
