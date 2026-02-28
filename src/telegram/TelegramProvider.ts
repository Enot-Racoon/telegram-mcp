import type { Chat, Message } from "../types";

/**
 * Telegram provider interface
 * Abstracts Telegram API interactions for testability
 */
export interface TelegramProvider {
  /**
   * Authenticate/login with a phone number
   */
  login(phone: string): Promise<void>;

  /**
   * List all chats/conversations
   */
  listChats(): Promise<Chat[]>;

  /**
   * Get messages from a chat
   */
  getMessages(chatId: string, limit: number): Promise<Message[]>;

  /**
   * Send a message to a chat
   */
  sendMessage(chatId: string, text: string): Promise<void>;

  /**
   * Logout from the current session
   */
  logout(): Promise<void>;

  /**
   * Check if the provider is authenticated
   */
  isAuthenticated(): boolean;

  /**
   * Get the current user info
   */
  getCurrentUser(): Promise<UserInfo | null>;
}

export interface UserInfo {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  isBot: boolean;
}
