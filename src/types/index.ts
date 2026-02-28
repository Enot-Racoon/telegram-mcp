/**
 * Telegram Chat representation
 */
export interface Chat {
  id: string;
  title: string;
  type: 'private' | 'group' | 'channel';
  username?: string;
  photoUrl?: string;
  lastMessage?: Message;
  unreadCount: number;
}

/**
 * Telegram Message representation
 */
export interface Message {
  id: string;
  chatId: string;
  from: User;
  text: string;
  timestamp: number;
  replyTo?: Message;
  attachments?: Attachment[];
  isRead: boolean;
}

/**
 * Telegram User representation
 */
export interface User {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  isBot: boolean;
  photoUrl?: string;
}

/**
 * Message attachment
 */
export interface Attachment {
  type: 'photo' | 'video' | 'audio' | 'document' | 'voice';
  url?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}

/**
 * Session data for authenticated Telegram accounts
 */
export interface Session {
  id: string;
  phone: string;
  userId: string;
  username?: string;
  createdAt: number;
  lastActiveAt: number;
  isActive: boolean;
}

/**
 * Account status
 */
export type AccountStatus = 'active' | 'inactive' | 'pending_auth' | 'error';

/**
 * Account information
 */
export interface Account {
  id: string;
  phone: string;
  status: AccountStatus;
  session?: Session;
  createdAt: number;
  updatedAt: number;
  error?: string;
}

/**
 * Cache entry structure
 */
export interface CacheEntry<T = unknown> {
  key: string;
  value: T;
  expiresAt?: number;
  createdAt: number;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  totalEntries: number;
  expiredEntries: number;
  hitCount: number;
  missCount: number;
  size: number;
}

/**
 * Log entry structure
 */
export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error';
  tool?: string;
  action?: string;
  arguments?: Record<string, unknown>;
  result?: unknown;
  error?: string;
  duration?: number;
  sessionId?: string;
  projectId?: string;
  serverId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log query options
 */
export interface LogQueryOptions {
  level?: string;
  tool?: string;
  sessionId?: string;
  startDate?: number;
  endDate?: number;
  limit?: number;
  offset?: number;
}

/**
 * Configuration options
 */
export interface Config {
  databasePath: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  cacheDefaultTTL: number;
  maxLogEntries: number;
}

/**
 * Tool execution result
 */
export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
