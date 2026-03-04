/**
 * Log level types
 */
export type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * Log entry structure
 */
export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  tool?: string | null;
  action?: string | null;
  arguments?: string | null;
  result?: string | null;
  error?: string | null;
  duration?: number | null;
  sessionId?: string | null;
  projectId?: string | null;
  serverId?: string | null;
  metadata?: string | null;
}

/**
 * Log query options
 */
export interface LogQueryOptions {
  level?: LogLevel | string;
  tool?: string;
  sessionId?: string;
  startDate?: number;
  endDate?: number;
  limit?: number;
  offset?: number;
}

/**
 * Log repository interface
 * Defines data access operations for logging
 */
export interface LogRepository {
  /**
   * Insert a log entry
   */
  insert(entry: Omit<LogEntry, "id">): void;

  /**
   * Query logs with filters
   */
  query(options?: LogQueryOptions): LogEntry[];

  /**
   * Count logs with filters
   */
  count(options?: Omit<LogQueryOptions, "limit" | "offset">): number;

  /**
   * Trim old logs to keep only maxEntries
   */
  trim(maxEntries: number): number;

  /**
   * Clear all logs
   */
  clear(): void;

  /**
   * Get server ID
   */
  getServerId(): string;
}
