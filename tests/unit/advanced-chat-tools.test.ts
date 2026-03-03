import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { MockTelegramProvider } from "~/telegram/MockTelegramProvider";
import { TelegramService } from "~/telegram/TelegramService";

describe("Advanced Chat Tools", () => {
  let provider: MockTelegramProvider;
  let service: TelegramService;

  beforeEach(() => {
    provider = new MockTelegramProvider({ delayMs: 0 });
    service = new TelegramService(provider);
  });

  afterEach(() => {
    provider.reset();
  });

  describe("sendToSavedMessages", () => {
    it("should send message to saved messages", async () => {
      await service.login("+1234567890");
      const message = await service.sendToSavedMessages("Test note");
      
      expect(message).toBeDefined();
      expect(message.text).toBe("Test note");
      expect(message.chatId).toBe("saved_messages");
    });

    it("should store messages in saved messages", async () => {
      await service.login("+1234567890");
      await service.sendToSavedMessages("Note 1");
      await service.sendToSavedMessages("Note 2");
      
      const messages = await service.getMessages("saved_messages", {});
      expect(messages.length).toBe(2);
    });
  });

  describe("getParticipants", () => {
    it("should get participants of a group", async () => {
      await service.login("+1234567890");
      const result = await service.getParticipants("chat-2");
      
      expect(result.participants.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThan(0);
    });

    it("should respect limit and offset", async () => {
      await service.login("+1234567890");
      const result1 = await service.getParticipants("chat-2", 1, 0);
      const result2 = await service.getParticipants("chat-2", 1, 1);
      
      expect(result1.participants.length).toBe(1);
      expect(result2.participants.length).toBe(1);
      expect(result1.participants[0].id).not.toBe(result2.participants[0].id);
    });

    it("should return participant details", async () => {
      await service.login("+1234567890");
      const result = await service.getParticipants("chat-2");
      
      const participant = result.participants[0];
      expect(participant).toHaveProperty("id");
      expect(participant).toHaveProperty("username");
      expect(participant).toHaveProperty("role");
    });
  });

  describe("resolvePeer", () => {
    it("should resolve @username format", async () => {
      await service.login("+1234567890");
      const chatId = await service.resolvePeer("@project_team");
      expect(chatId).toBe("chat-2");
    });

    it("should resolve username without @", async () => {
      await service.login("+1234567890");
      const chatId = await service.resolvePeer("project_team");
      expect(chatId).toBe("chat-2");
    });

    it("should resolve t.me links", async () => {
      await service.login("+1234567890");
      const chatId = await service.resolvePeer("t.me/project_team");
      expect(chatId).toBe("chat-2");
    });

    it("should resolve chat title", async () => {
      await service.login("+1234567890");
      const chatId = await service.resolvePeer("Project Team");
      expect(chatId).toBe("chat-2");
    });

    it("should resolve raw chat ID", async () => {
      await service.login("+1234567890");
      const chatId = await service.resolvePeer("chat-1");
      expect(chatId).toBe("chat-1");
    });

    it("should return null for non-existent peer", async () => {
      await service.login("+1234567890");
      const chatId = await service.resolvePeer("non_existent_chat");
      expect(chatId).toBeNull();
    });
  });

  describe("subscribeToChat", () => {
    it("should subscribe to a chat", async () => {
      await service.login("+1234567890");
      const state = await service.subscribeToChat("chat-1");
      
      expect(state.chatId).toBe("chat-1");
      expect(state.isActive).toBe(true);
      expect(state.startedAt).toBeDefined();
    });

    it("should track last message ID", async () => {
      await service.login("+1234567890");
      const state = await service.subscribeToChat("chat-1");
      
      expect(state.lastMessageId).toBeDefined();
    });

    it("should throw error for non-existent chat", async () => {
      await service.login("+1234567890");
      await expect(service.subscribeToChat("non-existent"))
        .rejects.toThrow("Chat not found");
    });
  });

  describe("unsubscribeFromChat", () => {
    it("should unsubscribe from a chat", async () => {
      await service.login("+1234567890");
      await service.subscribeToChat("chat-1");
      
      const result = await service.unsubscribeFromChat("chat-1");
      expect(result).toBe(true);
      
      const subscriptions = await service.getActiveSubscriptions();
      expect(subscriptions.find(s => s.chatId === "chat-1")).toBeUndefined();
    });

    it("should return false for non-existent subscription", async () => {
      await service.login("+1234567890");
      const result = await service.unsubscribeFromChat("chat-1");
      expect(result).toBe(false);
    });
  });

  describe("getActiveSubscriptions", () => {
    it("should return empty array when no subscriptions", async () => {
      await service.login("+1234567890");
      const subscriptions = await service.getActiveSubscriptions();
      expect(subscriptions).toHaveLength(0);
    });

    it("should return active subscriptions", async () => {
      await service.login("+1234567890");
      await service.subscribeToChat("chat-1");
      await service.subscribeToChat("chat-2");
      
      const subscriptions = await service.getActiveSubscriptions();
      expect(subscriptions.length).toBe(2);
    });
  });

  describe("waitForNewMessage", () => {
    it("should return new message after subscription", async () => {
      await service.login("+1234567890");
      await service.subscribeToChat("chat-1");

      // Send a new message
      await service.sendMessage("chat-1", "New message!");

      const message = await service.waitForNewMessage({ chatId: "chat-1" });
      expect(message).toBeDefined();
      expect(message?.text).toBe("New message!");
    });

    it("should filter by fromUserId", async () => {
      await service.login("+1234567890");
      await service.subscribeToChat("chat-1");

      // Send message from current user
      await service.sendMessage("chat-1", "Test message");

      const message = await service.waitForNewMessage({
        chatId: "chat-1",
        fromUserId: "non-existent-user"
      });
      expect(message).toBeNull();
    });

    it("should return message from subscribed chat", async () => {
      await service.login("+1234567890");
      const state = await service.subscribeToChat("chat-1");

      // Send message and verify subscription updates
      await service.sendMessage("chat-1", "Update!");
      const message = await service.waitForNewMessage({ chatId: "chat-1" });

      expect(message).toBeDefined();
      expect(message?.text).toBe("Update!");
    });
  });
});
