import type { Chat, Message, ChatInfo, User } from "~/types";

import type { TelegramProvider, GetMessagesOptions, SearchMessagesOptions, SendMessageOptions, ConnectionStatus } from "./TelegramProvider";

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
    return this.provider.getMessages(chatId, options);
  }

  /**
   * Search messages by text
   */
  async searchMessages(options: SearchMessagesOptions): Promise<Message[]> {
    return this.provider.searchMessages(options);
  }

  /**
   * Send a message to a chat
   */
  async sendMessage(
    chatId: string,
    text: string,
    options?: SendMessageOptions,
  ): Promise<Message> {
    return this.provider.sendMessage(chatId, text, options);
  }

  /**
   * Reply to a message
   */
  async replyMessage(
    chatId: string,
    replyToMessageId: string,
    text: string,
  ): Promise<Message> {
    return this.provider.replyMessage(chatId, replyToMessageId, text);
  }

  /**
   * Edit a message
   */
  async editMessage(
    chatId: string,
    messageId: string,
    newText: string,
  ): Promise<Message> {
    return this.provider.editMessage(chatId, messageId, newText);
  }

  /**
   * Delete a message
   */
  async deleteMessage(chatId: string, messageId: string): Promise<boolean> {
    return this.provider.deleteMessage(chatId, messageId);
  }

  /**
   * Get unread messages
   */
  async getUnreadMessages(
    chatId?: string,
    limit: number = 50,
  ): Promise<Message[]> {
    return this.provider.getUnreadMessages(chatId, limit);
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
    return this.provider.getChatInfo(chatId);
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
}
