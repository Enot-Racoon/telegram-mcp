import type { LogRepository, LogEntry, LogQueryOptions, LogLevel } from "~/core/repositories";

/**
 * Logger level priority
 */
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
} as const;

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
 * Structured logger using repository pattern
 */
export class Logger {
  private logRepository: LogRepository;
  private minLevel: LogLevel;

  constructor(
    logRepository: LogRepository,
    minLevel: LogLevel = "info",
  ) {
    this.logRepository = logRepository;
    this.minLevel = minLevel;
  }

  /**
   * Get the server ID
   */
  getServerId(): string {
    return this.logRepository.getServerId();
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
    return this.logRepository.query(options);
  }

  /**
   * Get log count with optional filters
   */
  async count(
    options: Omit<LogQueryOptions, "limit" | "offset"> = {},
  ): Promise<number> {
    return this.logRepository.count(options);
  }

  /**
   * Trim old logs to keep only maxEntries
   */
  async trim(maxEntries: number): Promise<number> {
    return this.logRepository.trim(maxEntries);
  }

  /**
   * Clear all logs
   */
  async clear(): Promise<void> {
    this.logRepository.clear();
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    // Check if level should be logged
    if (LOG_LEVELS[level] < LOG_LEVELS[this.minLevel]) {
      return;
    }

    this.logRepository.insert({
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
      serverId: context?.serverId ?? this.logRepository.getServerId(),
      metadata: context?.metadata ? JSON.stringify(context.metadata) : null,
    });
  }
}
