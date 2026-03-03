import type { Chat, Message, User, ChatInfo } from "~/types";

import type {
  TelegramProvider,
  UserInfo,
  GetMessagesOptions,
  SearchMessagesOptions,
  SendMessageOptions,
  ConnectionStatus,
  Participant,
  SubscriptionState,
  WaitForMessageOptions,
} from "./TelegramProvider";

/**
 * Mock Telegram provider for offline testing
 * Uses in-memory fake data with realistic structures
 */
export class MockTelegramProvider implements TelegramProvider {
  private isAuthenticatedFlag = false;
  private currentUser: UserInfo | null = null;
  private simulateError = false;
  private delayMs: number;

  // Connection state
  private connectionState: ConnectionStatus = {
    state: 'disconnected',
    lastDisconnected: Date.now(),
  };

  // In-memory storage
  private chats: Map<string, Chat> = new Map();
  private messages: Map<string, Message[]> = new Map();
  private pinnedMessages: Map<string, Message> = new Map();

  // Mock participants count for groups/channels
  private participantsCount: Map<string, number> = new Map([
    ["chat-2", 15], // Project Team group
    ["chat-3", 1250], // Tech News channel
  ]);

  // Mock users for get_user_info
  private users: Map<string, User> = new Map();

  // Mock participants for groups/channels
  private participants: Map<string, Participant[]> = new Map([
    ["chat-2", [ // Project Team group
      { id: "user-1", username: "john_doe", firstName: "John", lastName: "Doe", isBot: false, role: "creator", joinedAt: Date.now() - 86400000 },
      { id: "user-2", username: "jane_smith", firstName: "Jane", lastName: "Smith", isBot: false, role: "admin", joinedAt: Date.now() - 80000000 },
      { id: "user-3", username: "bob_dev", firstName: "Bob", lastName: "Developer", isBot: false, role: "member", joinedAt: Date.now() - 70000000 },
    ]],
    ["chat-3", [ // Tech News channel
      { id: "bot-1", username: "helper_bot", firstName: "Helper", lastName: "Bot", isBot: true, role: "creator", joinedAt: Date.now() - 100000000 },
    ]],
  ]);

  // Subscriptions for subscribe_to_chat
  private subscriptions: Map<string, SubscriptionState> = new Map();

  // Saved Messages chat
  private savedMessagesChatId = "saved_messages";

  constructor(options?: { simulateError?: boolean; delayMs?: number }) {
    this.simulateError = options?.simulateError ?? false;
    this.delayMs = options?.delayMs ?? 50; // Small delay to simulate network
    this.initializeMockData();
  }

  /**
   * Enable/disable error simulation
   */
  setSimulateError(value: boolean): void {
    this.simulateError = value;
  }

  /**
   * Set the simulated delay
   */
  setDelay(ms: number): void {
    this.delayMs = ms;
  }

  private async simulateDelay(): Promise<void> {
    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }
  }

  private throwIfError(): void {
    if (this.simulateError) {
      throw new Error("Simulated Telegram API error");
    }
  }

  private initializeMockData(): void {
    // Create mock users
    const users: Record<string, User> = {
      "user-1": {
        id: "user-1",
        username: "john_doe",
        firstName: "John",
        lastName: "Doe",
        isBot: false,
      },
      "user-2": {
        id: "user-2",
        username: "jane_smith",
        firstName: "Jane",
        lastName: "Smith",
        isBot: false,
      },
      "bot-1": {
        id: "bot-1",
        username: "helper_bot",
        firstName: "Helper",
        lastName: "Bot",
        isBot: true,
      },
    };

    // Store users in the map
    Object.entries(users).forEach(([id, user]) => {
      this.users.set(id, user);
    });

    // Create mock chats
    const mockChats: Chat[] = [
      {
        id: "chat-1",
        title: "John Doe",
        type: "private",
        username: "john_doe",
        unreadCount: 2,
        lastMessage: {
          id: "msg-1",
          chatId: "chat-1",
          from: users["user-1"],
          text: "Hey, how are you?",
          timestamp: Date.now() - 3600000,
          isRead: false,
        },
      },
      {
        id: "chat-2",
        title: "Project Team",
        type: "group",
        username: "project_team",
        unreadCount: 5,
        lastMessage: {
          id: "msg-2",
          chatId: "chat-2",
          from: users["user-2"],
          text: "Meeting at 3pm today",
          timestamp: Date.now() - 7200000,
          isRead: false,
        },
      },
      {
        id: "chat-3",
        title: "Tech News",
        type: "channel",
        username: "tech_news",
        unreadCount: 0,
        lastMessage: {
          id: "msg-3",
          chatId: "chat-3",
          from: users["bot-1"],
          text: "New TypeScript release available!",
          timestamp: Date.now() - 86400000,
          isRead: true,
        },
      },
    ];

    mockChats.forEach((chat) => this.chats.set(chat.id, chat));

    // Create mock messages for each chat
    this.messages.set("chat-1", [
      {
        id: "msg-1",
        chatId: "chat-1",
        from: users["user-1"],
        text: "Hey, how are you?",
        timestamp: Date.now() - 3600000,
        isRead: false,
      },
      {
        id: "msg-4",
        chatId: "chat-1",
        from: users["user-1"],
        text: "Did you see the new update?",
        timestamp: Date.now() - 7200000,
        isRead: true,
      },
    ]);

    this.messages.set("chat-2", [
      {
        id: "msg-2",
        chatId: "chat-2",
        from: users["user-2"],
        text: "Meeting at 3pm today",
        timestamp: Date.now() - 7200000,
        isRead: false,
      },
      {
        id: "msg-5",
        chatId: "chat-2",
        from: users["user-1"],
        text: "Got it, thanks!",
        timestamp: Date.now() - 10800000,
        isRead: true,
      },
      {
        id: "msg-6",
        chatId: "chat-2",
        from: users["user-2"],
        text: "Please read the project guidelines",
        timestamp: Date.now() - 14400000,
        isRead: true,
      },
    ]);

    this.messages.set("chat-3", [
      {
        id: "msg-3",
        chatId: "chat-3",
        from: users["bot-1"],
        text: "New TypeScript release available!",
        timestamp: Date.now() - 86400000,
        isRead: true,
      },
    ]);

    // Create pinned messages for mock chats
    this.pinnedMessages.set("chat-2", {
      id: "msg-6",
      chatId: "chat-2",
      from: users["user-2"],
      text: "Please read the project guidelines",
      timestamp: Date.now() - 14400000,
      isRead: true,
    });
  }

  async login(phone: string): Promise<void> {
    await this.simulateDelay();
    this.throwIfError();

    // Simulate successful login
    this.isAuthenticatedFlag = true;
    this.currentUser = {
      id: "current-user",
      phone,
      username: "mock_user",
      firstName: "Mock",
      lastName: "User",
      isBot: false,
    };
  }

  async logout(): Promise<void> {
    await this.simulateDelay();
    this.throwIfError();

    this.isAuthenticatedFlag = false;
    this.currentUser = null;
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedFlag;
  }

  async getCurrentUser(): Promise<UserInfo | null> {
    await this.simulateDelay();
    this.throwIfError();

    return this.currentUser;
  }

  async listChats(): Promise<Chat[]> {
    await this.simulateDelay();
    this.throwIfError();

    if (!this.isAuthenticatedFlag) {
      throw new Error("Not authenticated");
    }

    return Array.from(this.chats.values());
  }

  async getMessages(
    chatId: string,
    options?: GetMessagesOptions & { limit?: number },
  ): Promise<Message[]> {
    await this.simulateDelay();
    this.throwIfError();

    if (!this.isAuthenticatedFlag) {
      throw new Error("Not authenticated");
    }

    const chatMessages = this.messages.get(chatId) || [];
    let result = [...chatMessages];

    // Apply filters
    if (options?.afterId) {
      const afterIndex = result.findIndex((m) => m.id === options.afterId);
      if (afterIndex !== -1) {
        result = result.slice(afterIndex + 1);
      }
    }

    if (options?.beforeId) {
      const beforeIndex = result.findIndex((m) => m.id === options.beforeId);
      if (beforeIndex !== -1) {
        result = result.slice(0, beforeIndex);
      }
    }

    if (options?.offset) {
      result = result.slice(options.offset);
    }

    if (options?.limit) {
      result = result.slice(0, options.limit);
    } else if (options?.limit !== 0) {
      result = result.slice(0, 50);
    }

    return result;
  }

  async getChatInfo(chatId: string): Promise<ChatInfo | null> {
    await this.simulateDelay();
    this.throwIfError();

    if (!this.isAuthenticatedFlag) {
      throw new Error("Not authenticated");
    }

    const chat = this.chats.get(chatId);
    if (!chat) {
      return null;
    }

    const chatMessages = this.messages.get(chatId) || [];
    const lastMessage = chatMessages.length > 0 ? chatMessages[0] : undefined;
    const pinnedMessage = this.pinnedMessages.get(chatId);

    return {
      type: chat.type,
      id: chat.id,
      username: chat.username,
      participantsCount: this.participantsCount.get(chatId),
      lastMessage,
      pinnedMessage,
    };
  }

  async searchChats(query: string, limit: number = 20): Promise<Chat[]> {
    await this.simulateDelay();
    this.throwIfError();

    if (!this.isAuthenticatedFlag) {
      throw new Error("Not authenticated");
    }

    const lowerQuery = query.toLowerCase();
    const allChats = Array.from(this.chats.values());

    return allChats
      .filter(
        (chat) =>
          chat.title.toLowerCase().includes(lowerQuery) ||
          chat.username?.toLowerCase().includes(lowerQuery),
      )
      .slice(0, limit);
  }

  async resolveChat(ref: string): Promise<string | null> {
    await this.simulateDelay();
    this.throwIfError();

    if (!this.isAuthenticatedFlag) {
      throw new Error("Not authenticated");
    }

    // Handle different reference formats
    let normalizedRef = ref;

    // Remove @ prefix
    if (normalizedRef.startsWith("@")) {
      normalizedRef = normalizedRef.slice(1);
    }

    // Handle t.me links
    if (normalizedRef.includes("t.me/")) {
      const match = normalizedRef.match(/t\.me\/([^/?]+)/);
      if (match) {
        normalizedRef = match[1];
      }
    }

    // Remove + prefix for phone-based usernames
    if (normalizedRef.startsWith("+")) {
      normalizedRef = normalizedRef.slice(1);
    }

    // Search by username
    const allChats = Array.from(this.chats.values());
    const chat = allChats.find(
      (c) => c.username?.toLowerCase() === normalizedRef.toLowerCase(),
    );

    if (chat) {
      return chat.id;
    }

    // Search by ID
    if (this.chats.has(ref)) {
      return ref;
    }

    return null;
  }

  async searchMessages(options: SearchMessagesOptions): Promise<Message[]> {
    await this.simulateDelay();
    this.throwIfError();

    if (!this.isAuthenticatedFlag) {
      throw new Error("Not authenticated");
    }

    const { query, chatId, limit = 20, fromUserId, minDate, maxDate } = options;
    const lowerQuery = query.toLowerCase();

    let messages: Message[] = [];

    if (chatId) {
      messages = this.messages.get(chatId) || [];
    } else {
      // Search across all chats
      for (const chatMessages of this.messages.values()) {
        messages = [...messages, ...chatMessages];
      }
    }

    return messages
      .filter((msg) => msg.text.toLowerCase().includes(lowerQuery))
      .filter((msg) => (fromUserId ? msg.from.id === fromUserId : true))
      .filter((msg) => (minDate ? msg.timestamp >= minDate : true))
      .filter((msg) => (maxDate ? msg.timestamp <= maxDate : true))
      .slice(0, limit);
  }

  async sendMessage(
    chatId: string,
    text: string,
    options?: SendMessageOptions,
  ): Promise<Message> {
    await this.simulateDelay();
    this.throwIfError();

    if (!this.isAuthenticatedFlag) {
      throw new Error("Not authenticated");
    }

    const chat = this.chats.get(chatId);
    if (!chat) {
      throw new Error(`Chat not found: ${chatId}`);
    }

    // Create a new message
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      chatId,
      from: {
        id: "current-user",
        username: this.currentUser?.username,
        firstName: this.currentUser?.firstName,
        lastName: this.currentUser?.lastName,
        isBot: false,
      },
      text,
      timestamp: Date.now(),
      isRead: true,
    };

    // Add to messages
    const chatMessages = this.messages.get(chatId) || [];
    chatMessages.unshift(newMessage);
    this.messages.set(chatId, chatMessages);

    // Update last message
    chat.lastMessage = newMessage;

    return newMessage;
  }

  async replyMessage(
    chatId: string,
    replyToMessageId: string,
    text: string,
  ): Promise<Message> {
    await this.simulateDelay();
    this.throwIfError();

    if (!this.isAuthenticatedFlag) {
      throw new Error("Not authenticated");
    }

    const chat = this.chats.get(chatId);
    if (!chat) {
      throw new Error(`Chat not found: ${chatId}`);
    }

    // Find the message to reply to
    const chatMessages = this.messages.get(chatId) || [];
    const replyToMessage = chatMessages.find((m) => m.id === replyToMessageId);

    if (!replyToMessage) {
      throw new Error(`Message not found: ${replyToMessageId}`);
    }

    // Create a new message with reply
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      chatId,
      from: {
        id: "current-user",
        username: this.currentUser?.username,
        firstName: this.currentUser?.firstName,
        lastName: this.currentUser?.lastName,
        isBot: false,
      },
      text,
      timestamp: Date.now(),
      isRead: true,
      replyTo: replyToMessage,
    };

    // Add to messages
    chatMessages.unshift(newMessage);
    this.messages.set(chatId, chatMessages);

    // Update last message
    chat.lastMessage = newMessage;

    return newMessage;
  }

  async editMessage(
    chatId: string,
    messageId: string,
    newText: string,
  ): Promise<Message> {
    await this.simulateDelay();
    this.throwIfError();

    if (!this.isAuthenticatedFlag) {
      throw new Error("Not authenticated");
    }

    const chatMessages = this.messages.get(chatId) || [];
    const messageIndex = chatMessages.findIndex((m) => m.id === messageId);

    if (messageIndex === -1) {
      throw new Error(`Message not found: ${messageId}`);
    }

    // Edit the message
    chatMessages[messageIndex] = {
      ...chatMessages[messageIndex],
      text: newText,
    };

    this.messages.set(chatId, chatMessages);

    return chatMessages[messageIndex];
  }

  async deleteMessage(
    chatId: string,
    messageId: string,
  ): Promise<boolean> {
    await this.simulateDelay();
    this.throwIfError();

    if (!this.isAuthenticatedFlag) {
      throw new Error("Not authenticated");
    }

    const chatMessages = this.messages.get(chatId) || [];
    const messageIndex = chatMessages.findIndex((m) => m.id === messageId);

    if (messageIndex === -1) {
      return false;
    }

    chatMessages.splice(messageIndex, 1);
    this.messages.set(chatId, chatMessages);

    return true;
  }

  async getUnreadMessages(
    chatId?: string,
    limit: number = 50,
  ): Promise<Message[]> {
    await this.simulateDelay();
    this.throwIfError();

    if (!this.isAuthenticatedFlag) {
      throw new Error("Not authenticated");
    }

    let unreadMessages: Message[] = [];

    if (chatId) {
      const chatMessages = this.messages.get(chatId) || [];
      unreadMessages = chatMessages.filter((m) => !m.isRead);
    } else {
      // Get unread from all chats
      for (const messages of this.messages.values()) {
        unreadMessages = [
          ...unreadMessages,
          ...messages.filter((m) => !m.isRead),
        ];
      }
    }

    return unreadMessages.slice(0, limit);
  }

  async getUpdatesSince(
    chatId: string,
    afterMessageId: string,
    limit: number = 50,
  ): Promise<Message[]> {
    await this.simulateDelay();
    this.throwIfError();

    if (!this.isAuthenticatedFlag) {
      throw new Error("Not authenticated");
    }

    const chatMessages = this.messages.get(chatId) || [];
    const afterIndex = chatMessages.findIndex((m) => m.id === afterMessageId);

    if (afterIndex === -1) {
      return [];
    }

    return chatMessages.slice(0, afterIndex).slice(0, limit);
  }

  async getUserInfo(userId: string): Promise<User | null> {
    await this.simulateDelay();
    this.throwIfError();

    if (!this.isAuthenticatedFlag) {
      throw new Error("Not authenticated");
    }

    return this.users.get(userId) || null;
  }

  async listRecentChats(limit: number = 50): Promise<Chat[]> {
    await this.simulateDelay();
    this.throwIfError();

    if (!this.isAuthenticatedFlag) {
      throw new Error("Not authenticated");
    }

    const allChats = Array.from(this.chats.values());

    // Sort by last message timestamp (most recent first)
    allChats.sort((a, b) => {
      const aTime = a.lastMessage?.timestamp || 0;
      const bTime = b.lastMessage?.timestamp || 0;
      return bTime - aTime;
    });

    return allChats.slice(0, limit);
  }

  async getDialogsPage(offset: number = 0, limit: number = 20) {
    await this.simulateDelay();
    this.throwIfError();

    if (!this.isAuthenticatedFlag) {
      throw new Error("Not authenticated");
    }

    const allChats = Array.from(this.chats.values());

    // Sort by last message timestamp (most recent first)
    allChats.sort((a, b) => {
      const aTime = a.lastMessage?.timestamp || 0;
      const bTime = b.lastMessage?.timestamp || 0;
      return bTime - aTime;
    });

    const total = allChats.length;
    const chats = allChats.slice(offset, offset + limit);

    return {
      chats,
      total,
      hasMore: offset + limit < total,
    };
  }

  async getUnreadCount(): Promise<number> {
    await this.simulateDelay();
    this.throwIfError();

    if (!this.isAuthenticatedFlag) {
      throw new Error("Not authenticated");
    }

    const allChats = Array.from(this.chats.values());
    return allChats.reduce((sum, chat) => sum + chat.unreadCount, 0);
  }

  async getLastMessage(chatId: string): Promise<Message | null> {
    await this.simulateDelay();
    this.throwIfError();

    if (!this.isAuthenticatedFlag) {
      throw new Error("Not authenticated");
    }

    const chat = this.chats.get(chatId);
    if (!chat) {
      return null;
    }

    const chatMessages = this.messages.get(chatId) || [];
    return chatMessages.length > 0 ? chatMessages[0] : null;
  }

  async getConnectionStatus(): Promise<ConnectionStatus> {
    await this.simulateDelay();

    // Update connection state based on auth status
    if (this.isAuthenticatedFlag) {
      this.connectionState = {
        state: 'connected',
        lastConnected: Date.now(),
      };
    } else {
      this.connectionState = {
        state: 'disconnected',
        lastDisconnected: Date.now(),
      };
    }

    // Simulate flood wait if error simulation is enabled
    if (this.simulateError) {
      this.connectionState = {
        state: 'flood_wait',
        floodWaitSeconds: 60,
        errorMessage: 'Too many requests',
      };
    }

    return { ...this.connectionState };
  }

  async sendToSavedMessages(text: string): Promise<Message> {
    await this.simulateDelay();
    this.throwIfError();

    if (!this.isAuthenticatedFlag) {
      throw new Error("Not authenticated");
    }

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      chatId: this.savedMessagesChatId,
      from: {
        id: "current-user",
        username: this.currentUser?.username,
        firstName: this.currentUser?.firstName,
        lastName: this.currentUser?.lastName,
        isBot: false,
      },
      text,
      timestamp: Date.now(),
      isRead: true,
    };

    // Store in saved messages
    const savedMessages = this.messages.get(this.savedMessagesChatId) || [];
    savedMessages.unshift(newMessage);
    this.messages.set(this.savedMessagesChatId, savedMessages);

    return newMessage;
  }

  async getParticipants(chatId: string, limit: number = 100, offset: number = 0) {
    await this.simulateDelay();
    this.throwIfError();

    if (!this.isAuthenticatedFlag) {
      throw new Error("Not authenticated");
    }

    const chatParticipants = this.participants.get(chatId) || [];
    const total = chatParticipants.length;
    const participants = chatParticipants.slice(offset, offset + limit);

    return { participants, total };
  }

  async resolvePeer(ref: string): Promise<string | null> {
    await this.simulateDelay();
    this.throwIfError();

    if (!this.isAuthenticatedFlag) {
      throw new Error("Not authenticated");
    }

    // Handle different reference formats
    let normalizedRef = ref;

    // Remove @ prefix
    if (normalizedRef.startsWith("@")) {
      normalizedRef = normalizedRef.slice(1);
    }

    // Handle t.me links
    if (normalizedRef.includes("t.me/")) {
      const match = normalizedRef.match(/t\.me\/([^/?]+)/);
      if (match) {
        normalizedRef = match[1];
      }
    }

    // Handle t.me/c/ links (private channels/groups)
    if (normalizedRef.includes("t.me/c/")) {
      const match = normalizedRef.match(/t\.me\/c\/(\d+)/);
      if (match) {
        return `chat-${match[1]}`;
      }
    }

    // Remove + prefix
    if (normalizedRef.startsWith("+")) {
      normalizedRef = normalizedRef.slice(1);
    }

    // Search by username
    const allChats = Array.from(this.chats.values());
    const chat = allChats.find(
      (c) => c.username?.toLowerCase() === normalizedRef.toLowerCase(),
    );

    if (chat) {
      return chat.id;
    }

    // Search by title
    const chatByTitle = allChats.find(
      (c) => c.title.toLowerCase() === normalizedRef.toLowerCase(),
    );

    if (chatByTitle) {
      return chatByTitle.id;
    }

    // Search by ID
    if (this.chats.has(ref)) {
      return ref;
    }

    return null;
  }

  async subscribeToChat(chatId: string): Promise<SubscriptionState> {
    await this.simulateDelay();
    this.throwIfError();

    if (!this.isAuthenticatedFlag) {
      throw new Error("Not authenticated");
    }

    const chat = this.chats.get(chatId);
    if (!chat) {
      throw new Error(`Chat not found: ${chatId}`);
    }

    const chatMessages = this.messages.get(chatId) || [];
    const lastMessageId = chatMessages.length > 0 ? chatMessages[0].id : undefined;

    const state: SubscriptionState = {
      chatId,
      isActive: true,
      lastMessageId,
      messageCount: 0,
      startedAt: Date.now(),
    };

    this.subscriptions.set(chatId, state);

    return state;
  }

  async unsubscribeFromChat(chatId: string): Promise<boolean> {
    await this.simulateDelay();

    return this.subscriptions.delete(chatId);
  }

  async getActiveSubscriptions(): Promise<SubscriptionState[]> {
    await this.simulateDelay();

    return Array.from(this.subscriptions.values()).filter((s) => s.isActive);
  }

  async waitForNewMessage(options?: WaitForMessageOptions): Promise<Message | null> {
    await this.simulateDelay();
    this.throwIfError();

    if (!this.isAuthenticatedFlag) {
      throw new Error("Not authenticated");
    }

    const { chatId, timeout = 30000, fromUserId } = options || {};

    // If chatId specified, wait for that chat
    if (chatId) {
      const chatMessages = this.messages.get(chatId) || [];
      const subscription = this.subscriptions.get(chatId);
      const lastKnownId = subscription?.lastMessageId;

      // Find new messages since last known
      const newMessages = chatMessages.filter((m) => {
        if (lastKnownId && m.id <= lastKnownId) return false;
        if (fromUserId && m.from.id !== fromUserId) return false;
        return true;
      });

      if (newMessages.length > 0) {
        // Update subscription state
        if (subscription) {
          subscription.lastMessageId = newMessages[0].id;
          subscription.messageCount += newMessages.length;
        }
        return newMessages[0];
      }
    } else {
      // Check all subscribed chats
      for (const [cid, subscription] of this.subscriptions.entries()) {
        const chatMessages = this.messages.get(cid) || [];
        const lastKnownId = subscription.lastMessageId;

        const newMessages = chatMessages.filter((m) => {
          if (lastKnownId && m.id <= lastKnownId) return false;
          if (fromUserId && m.from.id !== fromUserId) return false;
          return true;
        });

        if (newMessages.length > 0) {
          subscription.lastMessageId = newMessages[0].id;
          subscription.messageCount += newMessages.length;
          return newMessages[0];
        }
      }
    }

    // No new messages found (in real implementation, this would block/poll)
    return null;
  }

  /**
   * Reset mock data to initial state
   */
  reset(): void {
    this.isAuthenticatedFlag = false;
    this.currentUser = null;
    this.initializeMockData();
  }
}
