import type { Chat, Message, ChatInfo, User } from "~/types";

import type { TelegramProvider, GetMessagesOptions, SearchMessagesOptions, SendMessageOptions, ConnectionStatus, Participant, SubscriptionState, WaitForMessageOptions } from "./TelegramProvider";

/**
 * Telegram service that wraps the provider with additional functionality
 */
export class TelegramService {
  private provider: TelegramProvider;

  constructor(provider: TelegramProvider) {
    this.provider = provider;
  }

  /**
   * Login to Telegram
   */
  async login(phone: string): Promise<void> {
    if (!phone || typeof phone !== "string") {
      throw new Error("phone is required and must be a string");
    }
    await this.provider.login(phone);
  }

  /**
   * Logout from Telegram
   */
  async logout(): Promise<void> {
    await this.provider.logout();
  }

  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    return this.provider.isAuthenticated();
  }

  /**
   * Get all chats with optional filtering
   */
  async getChats(options?: {
    type?: "private" | "group" | "channel";
    unreadOnly?: boolean;
  }): Promise<Chat[]> {
    const chats = await this.provider.listChats();

    if (!options) {
      return chats;
    }

    return chats.filter((chat) => {
      if (options.type && chat.type !== options.type) {
        return false;
      }
      if (options.unreadOnly && chat.unreadCount === 0) {
        return false;
      }
      return true;
    });
  }

  /**
   * Search chats by name or username
   */
  async searchChats(query: string, limit: number = 20): Promise<Chat[]> {
    return this.provider.searchChats(query, limit);
  }

  /**
   * Resolve a chat reference to chat_id
   */
  async resolveChat(ref: string): Promise<string | null> {
    return this.provider.resolveChat(ref);
  }

  /**
   * Get messages from a chat
   */
  async getMessages(
    chatId: string,
    options?: GetMessagesOptions & { limit?: number },
  ): Promise<Message[]> {
    const resolvedChatId = await this.resolveChatRef(chatId);
    return this.provider.getMessages(resolvedChatId, options);
  }

  /**
   * Search messages by text
   */
  async searchMessages(options: SearchMessagesOptions): Promise<Message[]> {
    return this.provider.searchMessages(options);
  }

  /**
   * Resolve a chat reference to a chat ID
   * Fast-path for raw IDs to avoid unnecessary provider calls
   */
  private async resolveChatRef(chatRef: string): Promise<string> {
    // Fast path: internal mock IDs (chat-1, chat-2, etc.)
    if (chatRef.startsWith("chat-")) {
      return chatRef;
    }

    // Fast path: numeric Telegram IDs (e.g., "123456789" or "-1001234567890")
    if (/^-?\d+$/.test(chatRef)) {
      return chatRef;
    }

    // Resolve usernames, links, titles, etc.
    const resolved = await this.provider.resolveChat(chatRef);

    if (resolved) {
      return resolved;
    }

    // Fallback: assume caller passed a valid raw ID
    return chatRef;
  }

  /**
   * Send a message to a chat
   */
  async sendMessage(
    chatId: string,
    text: string,
    options?: SendMessageOptions,
  ): Promise<Message> {
    const resolvedChatId = await this.resolveChatRef(chatId);
    return this.provider.sendMessage(resolvedChatId, text, options);
  }

  /**
   * Reply to a message
   */
  async replyMessage(
    chatId: string,
    replyToMessageId: string,
    text: string,
  ): Promise<Message> {
    const resolvedChatId = await this.resolveChatRef(chatId);
    return this.provider.replyMessage(resolvedChatId, replyToMessageId, text);
  }

  /**
   * Edit a message
   */
  async editMessage(
    chatId: string,
    messageId: string,
    newText: string,
  ): Promise<Message> {
    const resolvedChatId = await this.resolveChatRef(chatId);
    return this.provider.editMessage(resolvedChatId, messageId, newText);
  }

  /**
   * Delete a message
   */
  async deleteMessage(chatId: string, messageId: string): Promise<boolean> {
    const resolvedChatId = await this.resolveChatRef(chatId);
    return this.provider.deleteMessage(resolvedChatId, messageId);
  }

  /**
   * Get unread messages
   */
  async getUnreadMessages(
    chatId?: string,
    limit: number = 50,
  ): Promise<Message[]> {
    if (chatId) {
      const resolvedChatId = await this.resolveChatRef(chatId);
      return this.provider.getUnreadMessages(resolvedChatId, limit);
    }
    return this.provider.getUnreadMessages(undefined, limit);
  }

  /**
   * Get updates since a message
   */
  async getUpdatesSince(
    chatId: string,
    afterMessageId: string,
    limit: number = 50,
  ): Promise<Message[]> {
    return this.provider.getUpdatesSince(chatId, afterMessageId, limit);
  }

  /**
   * Get chat by ID
   */
  async getChat(chatId: string): Promise<Chat | null> {
    const chats = await this.provider.listChats();
    return chats.find((chat) => chat.id === chatId) || null;
  }

  /**
   * Get detailed information about a chat
   */
  async getChatInfo(chatId: string): Promise<ChatInfo | null> {
    const resolvedChatId = await this.resolveChatRef(chatId);
    return this.provider.getChatInfo(resolvedChatId);
  }

  /**
   * Get unread messages count across all chats
   */
  async getUnreadCount(): Promise<number> {
    return this.provider.getUnreadCount();
  }

  /**
   * Get user info by ID
   */
  async getUserInfo(userId: string): Promise<User | null> {
    return this.provider.getUserInfo(userId);
  }

  /**
   * List chats sorted by last message time
   */
  async listRecentChats(limit: number = 50): Promise<Chat[]> {
    return this.provider.listRecentChats(limit);
  }

  /**
   * Get paginated dialogs
   */
  async getDialogsPage(offset: number = 0, limit: number = 20) {
    return this.provider.getDialogsPage(offset, limit);
  }

  /**
   * Get the last message from a chat
   */
  async getLastMessage(chatId: string): Promise<Message | null> {
    return this.provider.getLastMessage(chatId);
  }

  /**
   * Get connection status
   */
  async getConnectionStatus(): Promise<ConnectionStatus> {
    return this.provider.getConnectionStatus();
  }

  /**
   * Send message to Saved Messages
   */
  async sendToSavedMessages(text: string): Promise<Message> {
    return this.provider.sendToSavedMessages(text);
  }

  /**
   * Get participants of a group/channel
   */
  async getParticipants(chatId: string, limit: number = 100, offset: number = 0) {
    return this.provider.getParticipants(chatId, limit, offset);
  }

  /**
   * Resolve peer reference to chat_id
   */
  async resolvePeer(ref: string): Promise<string | null> {
    return this.provider.resolvePeer(ref);
  }

  /**
   * Subscribe to chat for new messages
   */
  async subscribeToChat(chatId: string): Promise<SubscriptionState> {
    return this.provider.subscribeToChat(chatId);
  }

  /**
   * Unsubscribe from chat
   */
  async unsubscribeFromChat(chatId: string): Promise<boolean> {
    return this.provider.unsubscribeFromChat(chatId);
  }

  /**
   * Get active subscriptions
   */
  async getActiveSubscriptions(): Promise<SubscriptionState[]> {
    return this.provider.getActiveSubscriptions();
  }

  /**
   * Wait for new message
   */
  async waitForNewMessage(options?: WaitForMessageOptions): Promise<Message | null> {
    return this.provider.waitForNewMessage(options);
  }
}
