import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { MockTelegramProvider } from "~/telegram/MockTelegramProvider";

describe("MockTelegramProvider", () => {
  let provider: MockTelegramProvider;

  beforeEach(() => {
    provider = new MockTelegramProvider({ delayMs: 0 });
  });

  afterEach(() => {
    provider.reset();
  });

  describe("authentication", () => {
    it("should not be authenticated initially", () => {
      expect(provider.isAuthenticated()).toBe(false);
    });

    it("should authenticate with a phone number", async () => {
      await provider.login("+1234567890");
      expect(provider.isAuthenticated()).toBe(true);
    });

    it("should return user info after login", async () => {
      await provider.login("+1234567890");
      const user = await provider.getCurrentUser();
      expect(user).toBeTruthy();
      expect(user?.phone).toBe("+1234567890");
    });

    it("should logout successfully", async () => {
      await provider.login("+1234567890");
      await provider.logout();
      expect(provider.isAuthenticated()).toBe(false);
      expect(await provider.getCurrentUser()).toBeNull();
    });
  });

  describe("listChats", () => {
    it("should throw error when not authenticated", async () => {
      await expect(provider.listChats()).rejects.toThrow("Not authenticated");
    });

    it("should return list of chats after authentication", async () => {
      await provider.login("+1234567890");
      const chats = await provider.listChats();
      expect(chats).toHaveLength(3);
      expect(chats[0]).toHaveProperty("id");
      expect(chats[0]).toHaveProperty("title");
      expect(chats[0]).toHaveProperty("type");
    });

    it("should return chats with correct types", async () => {
      await provider.login("+1234567890");
      const chats = await provider.listChats();
      const types = chats.map((c) => c.type);
      expect(types).toContain("private");
      expect(types).toContain("group");
      expect(types).toContain("channel");
    });
  });

  describe("getMessages", () => {
    it("should throw error when not authenticated", async () => {
      await expect(provider.getMessages("chat-1", { limit: 10 })).rejects.toThrow(
        "Not authenticated",
      );
    });

    it("should return messages for a chat", async () => {
      await provider.login("+1234567890");
      const messages = await provider.getMessages("chat-1", { limit: 10 });
      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0]).toHaveProperty("text");
      expect(messages[0]).toHaveProperty("timestamp");
    });

    it("should respect limit parameter", async () => {
      await provider.login("+1234567890");
      const messages = await provider.getMessages("chat-1", { limit: 1 });
      expect(messages).toHaveLength(1);
    });

    it("should return empty array for non-existent chat", async () => {
      await provider.login("+1234567890");
      const messages = await provider.getMessages("non-existent", { limit: 10 });
      expect(messages).toHaveLength(0);
    });
  });

  describe("sendMessage", () => {
    it("should throw error when not authenticated", async () => {
      await expect(provider.sendMessage("chat-1", "Hello")).rejects.toThrow(
        "Not authenticated",
      );
    });

    it("should send a message successfully", async () => {
      await provider.login("+1234567890");
      await expect(
        provider.sendMessage("chat-1", "Hello"),
      ).resolves.not.toThrow();
    });

    it("should throw error for non-existent chat", async () => {
      await provider.login("+1234567890");
      await expect(
        provider.sendMessage("non-existent", "Hello"),
      ).rejects.toThrow("Chat not found");
    });

    it("should add message to chat messages", async () => {
      await provider.login("+1234567890");
      await provider.sendMessage("chat-1", "Test message");
      const messages = await provider.getMessages("chat-1", { limit: 10 });
      expect(messages[0].text).toBe("Test message");
    });
  });

  describe("error simulation", () => {
    it("should throw simulated error when enabled", async () => {
      provider.setSimulateError(true);
      await expect(provider.login("+1234567890")).rejects.toThrow(
        "Simulated Telegram API error",
      );
    });

    it("should not throw error when simulation is disabled", async () => {
      provider.setSimulateError(false);
      await expect(provider.login("+1234567890")).resolves.not.toThrow();
    });
  });

  describe("delay simulation", () => {
    it("should respect delay setting", async () => {
      provider.setDelay(100);
      const start = Date.now();
      await provider.login("+1234567890");
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(90); // Allow some tolerance
    });
  });

  describe("getChatInfo", () => {
    it("should throw error when not authenticated", async () => {
      await expect(provider.getChatInfo("chat-1")).rejects.toThrow(
        "Not authenticated",
      );
    });

    it("should return chat info for existing chat", async () => {
      await provider.login("+1234567890");
      const chatInfo = await provider.getChatInfo("chat-1");
      expect(chatInfo).toBeTruthy();
      expect(chatInfo?.id).toBe("chat-1");
      expect(chatInfo?.type).toBe("private");
      expect(chatInfo?.username).toBe("john_doe");
    });

    it("should return null for non-existent chat", async () => {
      await provider.login("+1234567890");
      const chatInfo = await provider.getChatInfo("non-existent");
      expect(chatInfo).toBeNull();
    });

    it("should return participants count for group", async () => {
      await provider.login("+1234567890");
      const chatInfo = await provider.getChatInfo("chat-2");
      expect(chatInfo?.participantsCount).toBe(15);
    });

    it("should return participants count for channel", async () => {
      await provider.login("+1234567890");
      const chatInfo = await provider.getChatInfo("chat-3");
      expect(chatInfo?.participantsCount).toBe(1250);
    });

    it("should return last message", async () => {
      await provider.login("+1234567890");
      const chatInfo = await provider.getChatInfo("chat-1");
      expect(chatInfo?.lastMessage).toBeDefined();
      expect(chatInfo?.lastMessage?.text).toBeDefined();
    });

    it("should return pinned message for chat with pinned message", async () => {
      await provider.login("+1234567890");
      const chatInfo = await provider.getChatInfo("chat-2");
      expect(chatInfo?.pinnedMessage).toBeDefined();
      expect(chatInfo?.pinnedMessage?.text).toBe(
        "Please read the project guidelines",
      );
    });

    it("should return undefined pinned message for chat without pinned message", async () => {
      await provider.login("+1234567890");
      const chatInfo = await provider.getChatInfo("chat-1");
      expect(chatInfo?.pinnedMessage).toBeUndefined();
    });
  });
});
