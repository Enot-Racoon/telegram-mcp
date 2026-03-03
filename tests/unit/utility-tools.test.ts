import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { MockTelegramProvider } from "~/telegram/MockTelegramProvider";
import { TelegramService } from "~/telegram/TelegramService";

describe("New Utility Tools", () => {
  let provider: MockTelegramProvider;
  let service: TelegramService;

  beforeEach(() => {
    provider = new MockTelegramProvider({ delayMs: 0 });
    service = new TelegramService(provider);
  });

  afterEach(() => {
    provider.reset();
  });

  describe("getUserInfo", () => {
    it("should get user info by ID", async () => {
      await service.login("+1234567890");
      const user = await service.getUserInfo("user-1");
      expect(user).toBeDefined();
      expect(user?.username).toBe("john_doe");
      expect(user?.firstName).toBe("John");
    });

    it("should return null for non-existent user", async () => {
      await service.login("+1234567890");
      const user = await service.getUserInfo("non-existent");
      expect(user).toBeNull();
    });

    it("should identify bot users", async () => {
      await service.login("+1234567890");
      const user = await service.getUserInfo("bot-1");
      expect(user?.isBot).toBe(true);
    });
  });

  describe("listRecentChats", () => {
    it("should return chats sorted by last message time", async () => {
      await service.login("+1234567890");
      const chats = await service.listRecentChats();
      expect(chats.length).toBeGreaterThan(0);
      
      // Check sorting (most recent first)
      for (let i = 1; i < chats.length; i++) {
        const prevTime = chats[i - 1].lastMessage?.timestamp || 0;
        const currTime = chats[i].lastMessage?.timestamp || 0;
        expect(prevTime).toBeGreaterThanOrEqual(currTime);
      }
    });

    it("should respect limit", async () => {
      await service.login("+1234567890");
      const chats = await service.listRecentChats(1);
      expect(chats.length).toBeLessThanOrEqual(1);
    });
  });

  describe("getDialogsPage", () => {
    it("should return paginated chats", async () => {
      await service.login("+1234567890");
      const page1 = await service.getDialogsPage(0, 2);

      expect(page1.chats.length).toBeLessThanOrEqual(2);
      expect(page1.total).toBeGreaterThan(0);
    });

    it("should support pagination", async () => {
      await service.login("+1234567890");
      const page1 = await service.getDialogsPage(0, 1);
      const page2 = await service.getDialogsPage(1, 1);

      expect(page1.chats[0].id).not.toBe(page2.chats[0].id);
    });

    it("should return hasMore correctly", async () => {
      await service.login("+1234567890");
      const allChats = await service.getDialogsPage(0, 100);
      expect(allChats.hasMore).toBe(false);
    });
  });

  describe("getUnreadCount", () => {
    it("should return total unread count", async () => {
      await service.login("+1234567890");
      const count = await service.getUnreadCount();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it("should match sum of individual chat unread counts", async () => {
      await service.login("+1234567890");
      const chats = await service.getChats();
      const expectedCount = chats.reduce((sum, chat) => sum + chat.unreadCount, 0);
      
      const count = await service.getUnreadCount();
      expect(count).toBe(expectedCount);
    });
  });

  describe("getLastMessage", () => {
    it("should get the last message from a chat", async () => {
      await service.login("+1234567890");
      const message = await service.getLastMessage("chat-1");
      
      expect(message).toBeDefined();
      expect(message?.chatId).toBe("chat-1");
    });

    it("should return null for chat with no messages", async () => {
      await service.login("+1234567890");
      const message = await service.getLastMessage("non-existent");
      expect(message).toBeNull();
    });

    it("should return the most recent message", async () => {
      await service.login("+1234567890");
      const allMessages = await service.getMessages("chat-1", {});
      const lastMessage = await service.getLastMessage("chat-1");
      
      if (allMessages.length > 0) {
        expect(lastMessage?.id).toBe(allMessages[0].id);
      }
    });
  });

  describe("getConnectionStatus", () => {
    it("should return connected status when authenticated", async () => {
      await service.login("+1234567890");
      const status = await service.getConnectionStatus();

      expect(status.state).toBe("connected");
    });

    it("should return disconnected status when not authenticated", async () => {
      const status = await service.getConnectionStatus();

      expect(status.state).toBe("disconnected");
    });

    it("should return flood_wait status when error is simulated", async () => {
      provider.setSimulateError(true);
      const status = await service.getConnectionStatus();

      expect(status.state).toBe("flood_wait");
      expect(status.floodWaitSeconds).toBe(60);
      expect(status.errorMessage).toBeDefined();
    });
  });
});
