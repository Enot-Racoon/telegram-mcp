import type { Chat, Message, ChatInfo, User } from "~/types";

/**
 * Participant information for get_participants tool
 */
export interface Participant {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  isBot: boolean;
  role?: "creator" | "admin" | "member" | "left" | "kicked";
  joinedAt?: number;
}

/**
 * Subscription state for subscribe_to_chat tool
 */
export interface SubscriptionState {
  chatId: string;
  isActive: boolean;
  lastMessageId?: string;
  messageCount: number;
  startedAt: number;
}

/**
 * Options for wait_for_new_message tool
 */
export interface WaitForMessageOptions {
  chatId?: string;
  timeout?: number;
  fromUserId?: string;
}

/**
 * Connection status for get_connection_status tool
 */
export type ConnectionState = 'connected' | 'disconnected' | 'flood_wait' | 'rate_limited';

/**
 * Connection status information
 */
export interface ConnectionStatus {
  state: ConnectionState;
  lastConnected?: number;
  lastDisconnected?: number;
  floodWaitSeconds?: number;
  errorMessage?: string;
}

/**
 * Options for getting messages
 */
export interface GetMessagesOptions {
  limit?: number;
  offset?: number;
  beforeId?: string;
  afterId?: string;
  includeMedia?: boolean;
  includeServiceMessages?: boolean;
}

/**
 * Options for sending messages
 */
export interface SendMessageOptions {
  replyToMessageId?: string;
  parseMode?: "markdown" | "html" | "none";
  disableLinkPreview?: boolean;
}

/**
 * Options for searching messages
 */
export interface SearchMessagesOptions {
  query: string;
  chatId?: string;
  limit?: number;
  fromUserId?: string;
  minDate?: number;
  maxDate?: number;
}

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
   * Search chats by name or username
   */
  searchChats(query: string, limit?: number): Promise<Chat[]>;

  /**
   * Resolve a chat reference (username, link, or id) to chat_id
   */
  resolveChat(ref: string): Promise<string | null>;

  /**
   * Get messages from a chat
   */
  getMessages(chatId: string, options?: GetMessagesOptions): Promise<Message[]>;

  /**
   * Search messages by text
   */
  searchMessages(options: SearchMessagesOptions): Promise<Message[]>;

  /**
   * Send a message to a chat
   */
  sendMessage(chatId: string, text: string, options?: SendMessageOptions): Promise<Message>;

  /**
   * Reply to a message
   */
  replyMessage(chatId: string, replyToMessageId: string, text: string): Promise<Message>;

  /**
   * Edit a message
   */
  editMessage(chatId: string, messageId: string, newText: string): Promise<Message>;

  /**
   * Delete a message
   */
  deleteMessage(chatId: string, messageId: string): Promise<boolean>;

  /**
   * Get unread messages count or list
   */
  getUnreadMessages(chatId?: string, limit?: number): Promise<Message[]>;

  /**
   * Get updates/messages since a specific message or timestamp
   */
  getUpdatesSince(chatId: string, afterMessageId: string, limit?: number): Promise<Message[]>;

  /**
   * Get detailed information about a chat
   */
  getChatInfo(chatId: string): Promise<ChatInfo | null>;

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

  /**
   * Get user info by ID
   */
  getUserInfo(userId: string): Promise<User | null>;

  /**
   * List chats sorted by last message time (most recent first)
   */
  listRecentChats(limit?: number): Promise<Chat[]>;

  /**
   * Get paginated list of chats/dialogs
   */
  getDialogsPage(offset?: number, limit?: number): Promise<{ chats: Chat[]; total: number; hasMore: boolean }>;

  /**
   * Get total unread messages count
   */
  getUnreadCount(): Promise<number>;

  /**
   * Get the last message from a chat
   */
  getLastMessage(chatId: string): Promise<Message | null>;

  /**
   * Get connection status
   */
  getConnectionStatus(): Promise<ConnectionStatus>;

  /**
   * Send a message to Saved Messages
   */
  sendToSavedMessages(text: string): Promise<Message>;

  /**
   * Get participants of a group/channel
   */
  getParticipants(chatId: string, limit?: number, offset?: number): Promise<{ participants: Participant[]; total: number }>;

  /**
   * Resolve and normalize peer reference (username, link, id, title) to chat_id
   */
  resolvePeer(ref: string): Promise<string | null>;

  /**
   * Subscribe to chat for new messages (polling-based)
   */
  subscribeToChat(chatId: string): Promise<SubscriptionState>;

  /**
   * Unsubscribe from chat
   */
  unsubscribeFromChat(chatId: string): Promise<boolean>;

  /**
   * Get active subscriptions
   */
  getActiveSubscriptions(): Promise<SubscriptionState[]>;

  /**
   * Wait for new message (blocking tool)
   */
  waitForNewMessage(options?: WaitForMessageOptions): Promise<Message | null>;
}

export interface UserInfo {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  isBot: boolean;
}
