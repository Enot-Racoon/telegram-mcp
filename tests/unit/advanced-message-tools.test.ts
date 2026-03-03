import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { MockTelegramProvider } from "~/telegram/MockTelegramProvider";
import { TelegramService } from "~/telegram/TelegramService";

describe("Advanced Message Tools", () => {
  let provider: MockTelegramProvider;
  let service: TelegramService;

  beforeEach(() => {
    provider = new MockTelegramProvider({ delayMs: 0 });
    service = new TelegramService(provider);
  });

  afterEach(() => {
    provider.reset();
  });

  describe("searchChats", () => {
    it("should search chats by title", async () => {
      await service.login("+1234567890");
      const results = await service.searchChats("Team");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].title).toContain("Team");
    });

    it("should search chats by username", async () => {
      await service.login("+1234567890");
      const results = await service.searchChats("tech_news");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].username).toBe("tech_news");
    });

    it("should respect limit", async () => {
      await service.login("+1234567890");
      const results = await service.searchChats("", 1);
      expect(results.length).toBeLessThanOrEqual(1);
    });

    it("should return empty array for no matches", async () => {
      await service.login("+1234567890");
      const results = await service.searchChats("nonexistent");
      expect(results).toHaveLength(0);
    });
  });

  describe("resolveChat", () => {
    it("should resolve username with @ prefix", async () => {
      await service.login("+1234567890");
      const chatId = await service.resolveChat("@project_team");
      expect(chatId).toBe("chat-2");
    });

    it("should resolve username without @ prefix", async () => {
      await service.login("+1234567890");
      const chatId = await service.resolveChat("project_team");
      expect(chatId).toBe("chat-2");
    });

    it("should resolve t.me link", async () => {
      await service.login("+1234567890");
      const chatId = await service.resolveChat("t.me/project_team");
      expect(chatId).toBe("chat-2");
    });

    it("should resolve raw chat ID", async () => {
      await service.login("+1234567890");
      const chatId = await service.resolveChat("chat-1");
      expect(chatId).toBe("chat-1");
    });

    it("should return null for non-existent chat", async () => {
      await service.login("+1234567890");
      const chatId = await service.resolveChat("@nonexistent");
      expect(chatId).toBeNull();
    });
  });

  describe("searchMessages", () => {
    it("should search messages by text", async () => {
      await service.login("+1234567890");
      const results = await service.searchMessages({ query: "Hey" });
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].text.toLowerCase()).toContain("hey");
    });

    it("should search within specific chat", async () => {
      await service.login("+1234567890");
      const results = await service.searchMessages({ 
        query: "Meeting", 
        chatId: "chat-2" 
      });
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].chatId).toBe("chat-2");
    });

    it("should search globally across all chats", async () => {
      await service.login("+1234567890");
      const results = await service.searchMessages({ query: "the" });
      expect(results.length).toBeGreaterThan(0);
    });

    it("should respect limit", async () => {
      await service.login("+1234567890");
      const results = await service.searchMessages({ query: "the", limit: 2 });
      expect(results.length).toBeLessThanOrEqual(2);
    });

    it("should filter by date range", async () => {
      await service.login("+1234567890");
      const now = Date.now();
      const results = await service.searchMessages({ 
        query: "the",
        minDate: now - 100000000,
        maxDate: now
      });
      expect(results.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("getMessages with options", () => {
    it("should get messages with limit", async () => {
      await service.login("+1234567890");
      const messages = await service.getMessages("chat-1", { limit: 1 });
      expect(messages.length).toBeLessThanOrEqual(1);
    });

    it("should get messages with offset", async () => {
      await service.login("+1234567890");
      const allMessages = await service.getMessages("chat-1", {});
      const offsetMessages = await service.getMessages("chat-1", { offset: 1 });
      expect(offsetMessages.length).toBeLessThan(allMessages.length);
    });

    it("should get messages after specific ID", async () => {
      await service.login("+1234567890");
      const messages = await service.getMessages("chat-1", {});
      if (messages.length > 1) {
        const afterMessages = await service.getMessages("chat-1", { 
          afterId: messages[messages.length - 1].id 
        });
        expect(afterMessages.length).toBeLessThan(messages.length);
      }
    });

    it("should get messages before specific ID", async () => {
      await service.login("+1234567890");
      const messages = await service.getMessages("chat-1", {});
      if (messages.length > 1) {
        const beforeMessages = await service.getMessages("chat-1", { 
          beforeId: messages[0].id 
        });
        expect(beforeMessages.length).toBeLessThan(messages.length);
      }
    });
  });

  describe("replyToMessage", () => {
    it("should reply to a message", async () => {
      await service.login("+1234567890");
      const messages = await service.getMessages("chat-1", {});
      if (messages.length > 0) {
        const reply = await service.replyMessage(
          "chat-1",
          messages[0].id,
          "Replied!"
        );
        expect(reply).toBeDefined();
        expect(reply.replyTo).toBeDefined();
        expect(reply.replyTo?.id).toBe(messages[0].id);
      }
    });

    it("should throw error for non-existent message", async () => {
      await service.login("+1234567890");
      await expect(
        service.replyMessage("chat-1", "non-existent", "Reply")
      ).rejects.toThrow("Message not found");
    });
  });

  describe("editMessage", () => {
    it("should edit a message", async () => {
      await service.login("+1234567890");
      // First send a message
      const sent = await service.sendMessage("chat-1", "Original");
      
      // Edit it
      const edited = await service.editMessage("chat-1", sent.id, "Edited");
      expect(edited.text).toBe("Edited");
    });

    it("should throw error for non-existent message", async () => {
      await service.login("+1234567890");
      await expect(
        service.editMessage("chat-1", "non-existent", "New text")
      ).rejects.toThrow("Message not found");
    });
  });

  describe("deleteMessage", () => {
    it("should delete a message", async () => {
      await service.login("+1234567890");
      // First send a message
      const sent = await service.sendMessage("chat-1", "To delete");
      
      // Delete it
      const deleted = await service.deleteMessage("chat-1", sent.id);
      expect(deleted).toBe(true);
      
      // Verify it's gone
      const messages = await service.getMessages("chat-1", {});
      expect(messages.find(m => m.id === sent.id)).toBeUndefined();
    });

    it("should return false for non-existent message", async () => {
      await service.login("+1234567890");
      const deleted = await service.deleteMessage("chat-1", "non-existent");
      expect(deleted).toBe(false);
    });
  });

  describe("getUnreadMessages", () => {
    it("should get unread messages from all chats", async () => {
      await service.login("+1234567890");
      const messages = await service.getUnreadMessages();
      expect(messages.length).toBeGreaterThanOrEqual(0);
    });

    it("should get unread messages from specific chat", async () => {
      await service.login("+1234567890");
      const messages = await service.getUnreadMessages("chat-1");
      expect(messages.length).toBeGreaterThanOrEqual(0);
      messages.forEach(m => expect(m.chatId).toBe("chat-1"));
    });

    it("should respect limit", async () => {
      await service.login("+1234567890");
      const messages = await service.getUnreadMessages(undefined, 1);
      expect(messages.length).toBeLessThanOrEqual(1);
    });
  });

  describe("getUpdatesSince", () => {
    it("should get messages after specific ID", async () => {
      await service.login("+1234567890");
      const messages = await service.getMessages("chat-1", {});
      if (messages.length > 1) {
        const lastMessage = messages[messages.length - 1];
        const updates = await service.getUpdatesSince("chat-1", lastMessage.id);
        expect(updates.length).toBeLessThan(messages.length);
      }
    });

    it("should return empty array if message not found", async () => {
      await service.login("+1234567890");
      const updates = await service.getUpdatesSince("chat-1", "non-existent");
      expect(updates).toHaveLength(0);
    });

    it("should respect limit", async () => {
      await service.login("+1234567890");
      const messages = await service.getMessages("chat-1", {});
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        const updates = await service.getUpdatesSince("chat-1", lastMessage.id, 1);
        expect(updates.length).toBeLessThanOrEqual(1);
      }
    });
  });

  describe("sendMessage with options", () => {
    it("should send message with reply_to", async () => {
      await service.login("+1234567890");
      const messages = await service.getMessages("chat-1", {});
      if (messages.length > 0) {
        const result = await service.sendMessage("chat-1", "Reply", {
          replyToMessageId: messages[0].id,
        });
        expect(result).toBeDefined();
      }
    });

    it("should send message with parse mode", async () => {
      await service.login("+1234567890");
      const result = await service.sendMessage("chat-1", "**Bold**", {
        parseMode: "markdown",
      });
      expect(result.text).toBe("**Bold**");
    });

    it("should send message with disabled link preview", async () => {
      await service.login("+1234567890");
      const result = await service.sendMessage("chat-1", "https://example.com", {
        disableLinkPreview: true,
      });
      expect(result).toBeDefined();
    });
  });
});
