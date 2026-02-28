import { eq, and, gte, lte, desc, count, type SQL, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";
import { logs as logsTable, type Log } from "../database/schema";
import type { LogEntry, LogQueryOptions } from "../../types";

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

/**
 * Structured logger with Drizzle ORM and SQLite storage
 */
export class Logger {
  private db: ReturnType<typeof drizzle>;
  private minLevel: LogLevel;
  private serverId: string;

  constructor(
    db: Database.Database,
    minLevel: LogLevel = "info",
    serverId?: string,
  ) {
    this.db = drizzle(db, { schema: { logs: logsTable } });
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
    this.log("debug", message, context);
  }

  /**
   * Log an info message
   */
  info(message: string, context?: LogContext): void {
    this.log("info", message, context);
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: LogContext): void {
    this.log("warn", message, context);
  }

  /**
   * Log an error message
   */
  error(message: string, context?: LogContext): void {
    this.log("error", message, context);
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
    context?: Omit<
      LogContext,
      "tool" | "action" | "arguments" | "result" | "duration"
    >,
  ): void {
    this.log("info", `Tool executed: ${tool}.${action}`, {
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
    context?: Omit<
      LogContext,
      "tool" | "action" | "arguments" | "error" | "duration"
    >,
  ): void {
    this.log("error", `Tool error: ${tool}.${action}`, {
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
  async query(options: LogQueryOptions = {}): Promise<LogEntry[]> {
    const conditions: SQL[] = [];

    if (options.level) {
      conditions.push(eq(logsTable.level, options.level));
    }

    if (options.tool) {
      conditions.push(eq(logsTable.tool, options.tool));
    }

    if (options.sessionId) {
      conditions.push(eq(logsTable.sessionId, options.sessionId));
    }

    if (options.startDate) {
      conditions.push(gte(logsTable.timestamp, options.startDate));
    }

    if (options.endDate) {
      conditions.push(lte(logsTable.timestamp, options.endDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const limit = options.limit || 100;
    const offset = options.offset || 0;

    const rows = await this.db
      .select()
      .from(logsTable)
      .where(whereClause)
      .orderBy(desc(logsTable.timestamp))
      .limit(limit)
      .offset(offset);

    return rows.map((row) => this.rowToLogEntry(row));
  }

  /**
   * Get log count with optional filters
   */
  async count(
    options: Omit<LogQueryOptions, "limit" | "offset"> = {},
  ): Promise<number> {
    const conditions: SQL[] = [];

    if (options.level) {
      conditions.push(eq(logsTable.level, options.level));
    }

    if (options.tool) {
      conditions.push(eq(logsTable.tool, options.tool));
    }

    if (options.sessionId) {
      conditions.push(eq(logsTable.sessionId, options.sessionId));
    }

    if (options.startDate) {
      conditions.push(gte(logsTable.timestamp, options.startDate));
    }

    if (options.endDate) {
      conditions.push(lte(logsTable.timestamp, options.endDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const result = await this.db
      .select({ count: count() })
      .from(logsTable)
      .where(whereClause)
      .get();

    return result?.count ?? 0;
  }

  /**
   * Trim old logs to keep only maxEntries
   */
  async trim(maxEntries: number): Promise<number> {
    // Get IDs to keep
    const rowsToKeep = await this.db
      .select({ id: logsTable.id })
      .from(logsTable)
      .orderBy(desc(logsTable.timestamp))
      .limit(maxEntries);

    if (rowsToKeep.length === 0) {
      const result = await this.db.delete(logsTable).run();
      return result.changes;
    }

    const idsToKeep = new Set(rowsToKeep.map((r) => r.id));

    // Get all IDs
    const allRows = await this.db.select({ id: logsTable.id }).from(logsTable);
    const idsToDelete = allRows
      .filter((r) => !idsToKeep.has(r.id))
      .map((r) => r.id);

    if (idsToDelete.length === 0) {
      return 0;
    }

    // Delete in batches
    let deleted = 0;
    for (let i = 0; i < idsToDelete.length; i += 100) {
      const batch = idsToDelete.slice(i, i + 100);
      const result = await this.db
        .delete(logsTable)
        .where(inArray(logsTable.id, batch))
        .run();
      deleted += result.changes;
    }

    return deleted;
  }

  /**
   * Clear all logs
   */
  async clear(): Promise<void> {
    await this.db.delete(logsTable).run();
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    // Check if level should be logged
    if (LOG_LEVELS[level] < LOG_LEVELS[this.minLevel]) {
      return;
    }

    const entry: Log = {
      id: uuidv4(),
      timestamp: Date.now(),
      level,
      tool: context?.tool ?? null,
      action: context?.action ?? null,
      arguments: context?.arguments ? JSON.stringify(context.arguments) : null,
      result:
        context?.result !== undefined ? JSON.stringify(context.result) : null,
      error: context?.error ?? null,
      duration: context?.duration ?? null,
      sessionId: context?.sessionId ?? null,
      projectId: context?.projectId ?? null,
      serverId: context?.serverId ?? this.serverId,
      metadata: context?.metadata ? JSON.stringify(context.metadata) : null,
    };

    this.db.insert(logsTable).values(entry).run();
  }

  private rowToLogEntry(row: Log): LogEntry {
    return {
      id: row.id,
      timestamp: row.timestamp,
      level: row.level as LogLevel,
      tool: row.tool ?? undefined,
      action: row.action ?? undefined,
      arguments: row.arguments ? JSON.parse(row.arguments) : undefined,
      result: row.result ? JSON.parse(row.result) : undefined,
      error: row.error ?? undefined,
      duration: row.duration ?? undefined,
      sessionId: row.sessionId ?? undefined,
      projectId: row.projectId ?? undefined,
      serverId: row.serverId ?? undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    };
  }
}
