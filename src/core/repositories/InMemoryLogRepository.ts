import { v4 as uuidv4 } from "uuid";
import type { LogRepository, LogEntry, LogQueryOptions } from "./LogRepository";

/**
 * In-memory implementation of LogRepository for testing
 */
export class InMemoryLogRepository implements LogRepository {
  private logs: LogEntry[] = [];
  private serverId: string;

  constructor(serverId?: string) {
    this.serverId = serverId || uuidv4();
  }

  insert(entry: Omit<LogEntry, "id">): void {
    const newEntry: LogEntry = {
      ...entry,
      id: uuidv4(),
      serverId: entry.serverId ?? this.serverId,
    };
    this.logs.push(newEntry);
  }

  query(options?: LogQueryOptions): LogEntry[] {
    let filtered = [...this.logs];

    if (options?.level) {
      filtered = filtered.filter((log) => log.level === options.level);
    }

    if (options?.tool) {
      filtered = filtered.filter((log) => log.tool === options.tool);
    }

    if (options?.sessionId) {
      filtered = filtered.filter((log) => log.sessionId === options.sessionId);
    }

    if (options?.startDate) {
      filtered = filtered.filter((log) => log.timestamp >= options.startDate!);
    }

    if (options?.endDate) {
      filtered = filtered.filter((log) => log.timestamp <= options.endDate!);
    }

    // Sort by timestamp DESC
    filtered.sort((a, b) => b.timestamp - a.timestamp);

    const limit = options?.limit ?? 100;
    const offset = options?.offset ?? 0;

    return filtered.slice(offset, offset + limit);
  }

  count(options?: Omit<LogQueryOptions, "limit" | "offset">): number {
    let filtered = [...this.logs];

    if (options?.level) {
      filtered = filtered.filter((log) => log.level === options.level);
    }

    if (options?.tool) {
      filtered = filtered.filter((log) => log.tool === options.tool);
    }

    if (options?.sessionId) {
      filtered = filtered.filter((log) => log.sessionId === options.sessionId);
    }

    if (options?.startDate) {
      filtered = filtered.filter((log) => log.timestamp >= options.startDate!);
    }

    if (options?.endDate) {
      filtered = filtered.filter((log) => log.timestamp <= options.endDate!);
    }

    return filtered.length;
  }

  trim(maxEntries: number): number {
    if (this.logs.length <= maxEntries) {
      return 0;
    }

    // Sort by timestamp DESC
    this.logs.sort((a, b) => b.timestamp - a.timestamp);

    const deleted = this.logs.length - maxEntries;
    this.logs = this.logs.slice(0, maxEntries);

    return deleted;
  }

  clear(): void {
    this.logs = [];
  }

  getServerId(): string {
    return this.serverId;
  }
}
