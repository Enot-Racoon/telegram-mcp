import { v4 as uuidv4 } from "uuid";
import type { DatabaseAdapter } from "../database/DatabaseAdapter";
import type {
  LogRepository,
  LogEntry,
  LogQueryOptions,
} from "./LogRepository";

/**
 * SQLite implementation of LogRepository
 */
export class SqliteLogRepository implements LogRepository {
  private adapter: DatabaseAdapter;
  private serverId: string;

  constructor(adapter: DatabaseAdapter, serverId?: string) {
    this.adapter = adapter;
    this.serverId = serverId || uuidv4();
  }

  insert(entry: Omit<LogEntry, "id">): void {
    const id = uuidv4();
    this.adapter.run(
      `INSERT INTO logs (id, timestamp, level, tool, action, arguments, result, error, duration, session_id, project_id, server_id, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        entry.timestamp,
        entry.level,
        entry.tool ?? null,
        entry.action ?? null,
        entry.arguments ?? null,
        entry.result ?? null,
        entry.error ?? null,
        entry.duration ?? null,
        entry.sessionId ?? null,
        entry.projectId ?? null,
        entry.serverId ?? this.serverId,
        entry.metadata ?? null,
      ],
    );
  }

  query(options?: LogQueryOptions): LogEntry[] {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (options?.level) {
      conditions.push("level = ?");
      params.push(options.level);
    }

    if (options?.tool) {
      conditions.push("tool = ?");
      params.push(options.tool);
    }

    if (options?.sessionId) {
      conditions.push("session_id = ?");
      params.push(options.sessionId);
    }

    if (options?.startDate) {
      conditions.push("timestamp >= ?");
      params.push(options.startDate);
    }

    if (options?.endDate) {
      conditions.push("timestamp <= ?");
      params.push(options.endDate);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const limit = options?.limit ?? 100;
    const offset = options?.offset ?? 0;

    const rows = this.adapter.all<{
      id: string;
      timestamp: number;
      level: string;
      tool: string | null;
      action: string | null;
      arguments: string | null;
      result: string | null;
      error: string | null;
      duration: number | null;
      session_id: string | null;
      project_id: string | null;
      server_id: string | null;
      metadata: string | null;
    }>(
      `SELECT * FROM logs ${whereClause} ORDER BY timestamp DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    return rows.map((row) => this.rowToLogEntry(row));
  }

  count(options?: Omit<LogQueryOptions, "limit" | "offset">): number {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (options?.level) {
      conditions.push("level = ?");
      params.push(options.level);
    }

    if (options?.tool) {
      conditions.push("tool = ?");
      params.push(options.tool);
    }

    if (options?.sessionId) {
      conditions.push("session_id = ?");
      params.push(options.sessionId);
    }

    if (options?.startDate) {
      conditions.push("timestamp >= ?");
      params.push(options.startDate);
    }

    if (options?.endDate) {
      conditions.push("timestamp <= ?");
      params.push(options.endDate);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = this.adapter.get<{ count: number }>(
      `SELECT COUNT(*) as count FROM logs ${whereClause}`,
      params,
    );

    return result?.count ?? 0;
  }

  trim(maxEntries: number): number {
    // Get IDs to keep
    const rowsToKeep = this.adapter.all<{ id: string }>(
      "SELECT id FROM logs ORDER BY timestamp DESC LIMIT ?",
      [maxEntries],
    );

    if (rowsToKeep.length === 0) {
      this.adapter.run("DELETE FROM logs");
      return 0;
    }

    const idsToKeep = new Set(rowsToKeep.map((r) => r.id));

    // Get all IDs
    const allRows = this.adapter.all<{ id: string }>(
      "SELECT id FROM logs",
    );
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
      const placeholders = batch.map(() => "?").join(",");
      this.adapter.run(`DELETE FROM logs WHERE id IN (${placeholders})`, [
        ...batch,
      ]);
      deleted += batch.length;
    }

    return deleted;
  }

  clear(): void {
    this.adapter.run("DELETE FROM logs");
  }

  getServerId(): string {
    return this.serverId;
  }

  private rowToLogEntry(row: {
    id: string;
    timestamp: number;
    level: string;
    tool: string | null;
    action: string | null;
    arguments: string | null;
    result: string | null;
    error: string | null;
    duration: number | null;
    session_id: string | null;
    project_id: string | null;
    server_id: string | null;
    metadata: string | null;
  }): LogEntry {
    return {
      id: row.id,
      timestamp: row.timestamp,
      level: row.level as LogEntry["level"],
      tool: row.tool ?? undefined,
      action: row.action ?? undefined,
      arguments: row.arguments ?? undefined,
      result: row.result ?? undefined,
      error: row.error ?? undefined,
      duration: row.duration ?? undefined,
      sessionId: row.session_id ?? undefined,
      projectId: row.project_id ?? undefined,
      serverId: row.server_id ?? undefined,
      metadata: row.metadata ?? undefined,
    };
  }
}
