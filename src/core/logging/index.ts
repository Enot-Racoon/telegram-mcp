import type Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import type { LogEntry, LogQueryOptions } from '../../types/index.js';

/**
 * Logger level priority
 */
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

/**
 * Structured logger with SQLite storage
 */
export class Logger {
  private db: Database.Database;
  private minLevel: LogLevel;
  private serverId: string;

  constructor(db: Database.Database, minLevel: LogLevel = 'info', serverId?: string) {
    this.db = db;
    this.minLevel = minLevel;
    this.serverId = serverId || uuidv4();
  }

  /**
   * Get the server ID
   */
  getServerId(): string {
    return this.serverId;
  }

  /**
   * Log a debug message
   */
  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  /**
   * Log an info message
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  /**
   * Log an error message
   */
  error(message: string, context?: LogContext): void {
    this.log('error', message, context);
  }

  /**
   * Log a tool execution
   */
  logTool(
    tool: string,
    action: string,
    args: Record<string, unknown>,
    result: unknown,
    duration: number,
    context?: Omit<LogContext, 'tool' | 'action' | 'arguments' | 'result' | 'duration'>
  ): void {
    this.log('info', `Tool executed: ${tool}.${action}`, {
      ...context,
      tool,
      action,
      arguments: args,
      result,
      duration,
    });
  }

  /**
   * Log a tool error
   */
  logToolError(
    tool: string,
    action: string,
    args: Record<string, unknown>,
    error: Error,
    duration: number,
    context?: Omit<LogContext, 'tool' | 'action' | 'arguments' | 'error' | 'duration'>
  ): void {
    this.log('error', `Tool error: ${tool}.${action}`, {
      ...context,
      tool,
      action,
      arguments: args,
      error: error.message,
      duration,
    });
  }

  /**
   * Query logs with filters
   */
  query(options: LogQueryOptions = {}): LogEntry[] {
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (options.level) {
      conditions.push('level = ?');
      params.push(options.level);
    }

    if (options.tool) {
      conditions.push('tool = ?');
      params.push(options.tool);
    }

    if (options.sessionId) {
      conditions.push('session_id = ?');
      params.push(options.sessionId);
    }

    if (options.startDate) {
      conditions.push('timestamp >= ?');
      params.push(options.startDate);
    }

    if (options.endDate) {
      conditions.push('timestamp <= ?');
      params.push(options.endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = options.limit || 100;
    const offset = options.offset || 0;

    const stmt = this.db.prepare(`
      SELECT * FROM logs
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `);

    const rows = stmt.all(...params, limit, offset) as Array<Record<string, unknown>>;

    return rows.map((row) => this.rowToLogEntry(row));
  }

  /**
   * Get log count with optional filters
   */
  count(options: Omit<LogQueryOptions, 'limit' | 'offset'> = {}): number {
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (options.level) {
      conditions.push('level = ?');
      params.push(options.level);
    }

    if (options.tool) {
      conditions.push('tool = ?');
      params.push(options.tool);
    }

    if (options.sessionId) {
      conditions.push('session_id = ?');
      params.push(options.sessionId);
    }

    if (options.startDate) {
      conditions.push('timestamp >= ?');
      params.push(options.startDate);
    }

    if (options.endDate) {
      conditions.push('timestamp <= ?');
      params.push(options.endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM logs ${whereClause}`);
    const result = stmt.get(...params) as { count: number };

    return result.count;
  }

  /**
   * Trim old logs to keep only maxEntries
   */
  trim(maxEntries: number): number {
    const stmt = this.db.prepare(`
      DELETE FROM logs
      WHERE id NOT IN (
        SELECT id FROM logs
        ORDER BY timestamp DESC
        LIMIT ?
      )
    `);
    const result = stmt.run(maxEntries);
    return result.changes;
  }

  /**
   * Clear all logs
   */
  clear(): void {
    this.db.exec('DELETE FROM logs');
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    // Check if level should be logged
    if (LOG_LEVELS[level] < LOG_LEVELS[this.minLevel]) {
      return;
    }

    const entry: LogEntry = {
      id: uuidv4(),
      timestamp: Date.now(),
      level,
      tool: context?.tool,
      action: context?.action,
      arguments: context?.arguments,
      result: context?.result,
      error: context?.error,
      duration: context?.duration,
      sessionId: context?.sessionId,
      projectId: context?.projectId,
      serverId: context?.serverId || this.serverId,
      metadata: context?.metadata,
    };

    const stmt = this.db.prepare(`
      INSERT INTO logs (id, timestamp, level, tool, action, arguments, result, error, duration, session_id, project_id, server_id, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      entry.id,
      entry.timestamp,
      entry.level,
      entry.tool || null,
      entry.action || null,
      entry.arguments ? JSON.stringify(entry.arguments) : null,
      entry.result !== undefined ? JSON.stringify(entry.result) : null,
      entry.error || null,
      entry.duration || null,
      entry.sessionId || null,
      entry.projectId || null,
      entry.serverId || null,
      entry.metadata ? JSON.stringify(entry.metadata) : null
    );
  }

  private rowToLogEntry(row: Record<string, unknown>): LogEntry {
    return {
      id: row.id as string,
      timestamp: row.timestamp as number,
      level: row.level as LogLevel,
      tool: row.tool as string | undefined,
      action: row.action as string | undefined,
      arguments: row.arguments ? JSON.parse(row.arguments as string) : undefined,
      result: row.result ? JSON.parse(row.result as string) : undefined,
      error: row.error as string | undefined,
      duration: row.duration as number | undefined,
      sessionId: row.session_id as string | undefined,
      projectId: row.project_id as string | undefined,
      serverId: row.server_id as string | undefined,
      metadata: row.metadata ? JSON.parse(row.metadata as string) : undefined,
    };
  }
}

interface LogContext {
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
