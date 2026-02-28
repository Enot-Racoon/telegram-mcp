import type { Chat, Message } from "~/types";

import type { TelegramProvider } from "./TelegramProvider";

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
   * Get messages from a chat
   */
  async getMessages(chatId: string, limit: number = 50): Promise<Message[]> {
    return this.provider.getMessages(chatId, limit);
  }

  /**
   * Send a message to a chat
   */
  async sendMessage(chatId: string, text: string): Promise<void> {
    await this.provider.sendMessage(chatId, text);
  }

  /**
   * Get chat by ID
   */
  async getChat(chatId: string): Promise<Chat | null> {
    const chats = await this.provider.listChats();
    return chats.find((chat) => chat.id === chatId) || null;
  }

  /**
   * Search messages in a chat
   */
  async searchMessages(
    chatId: string,
    query: string,
    limit: number = 20,
  ): Promise<Message[]> {
    const messages = await this.provider.getMessages(chatId, 100);
    const lowerQuery = query.toLowerCase();

    return messages
      .filter((msg) => msg.text.toLowerCase().includes(lowerQuery))
      .slice(0, limit);
  }

  /**
   * Get unread messages count across all chats
   */
  async getUnreadCount(): Promise<number> {
    const chats = await this.provider.listChats();
    return chats.reduce((sum, chat) => sum + chat.unreadCount, 0);
  }
}
