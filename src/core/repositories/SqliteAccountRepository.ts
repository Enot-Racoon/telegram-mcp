import type { DatabaseAdapter } from "../database/DatabaseAdapter";
import type { AccountRepository } from "./AccountRepository";
import type { Session } from "~/types";

/**
 * SQLite implementation of AccountRepository
 */
export class SqliteAccountRepository implements AccountRepository {
  private adapter: DatabaseAdapter;

  constructor(adapter: DatabaseAdapter) {
    this.adapter = adapter;
  }

  create(session: Session): void {
    this.adapter.run(
      `INSERT INTO sessions (id, phone, user_id, username, created_at, last_active_at, is_active)
       VALUES (?, '', '', NULL, ?, ?, 0)`,
      [session.id, session.phone, session.createdAt, session.createdAt],
    );
  }

  findById(id: string): Session | null {
    const row = this.adapter.get<{
      id: string;
      phone: string;
      user_id: string;
      username: string | null;
      created_at: number;
      last_active_at: number;
      is_active: number;
    }>("SELECT * FROM sessions WHERE id = ?", [id]);

    if (!row) return null;
    return this.rowToSession(row);
  }

  findByPhone(phone: string): Session | null {
    const row = this.adapter.get<{
      id: string;
      phone: string;
      user_id: string;
      username: string | null;
      created_at: number;
      last_active_at: number;
      is_active: number;
    }>("SELECT * FROM sessions WHERE phone = ?", [phone]);

    if (!row) return null;
    return this.rowToSession(row);
  }

  getAll(): Session[] {
    const rows = this.adapter.all<{
      id: string;
      phone: string;
      user_id: string;
      username: string | null;
      created_at: number;
      last_active_at: number;
      is_active: number;
    }>("SELECT * FROM sessions ORDER BY created_at DESC");

    return rows.map((row) => this.rowToSession(row));
  }

  getActive(): Session | null {
    const row = this.adapter.get<{
      id: string;
      phone: string;
      user_id: string;
      username: string | null;
      created_at: number;
      last_active_at: number;
      is_active: number;
    }>(
      "SELECT * FROM sessions WHERE is_active = 1 ORDER BY last_active_at DESC LIMIT 1",
    );

    if (!row) return null;
    return this.rowToSession(row);
  }

  setActive(id: string): void {
    this.adapter.run("UPDATE sessions SET is_active = 1 WHERE id = ?", [id]);
  }

  deactivateAll(): void {
    this.adapter.run("UPDATE sessions SET is_active = 0");
  }

  updateUserInfo(id: string, userId: string, username?: string): void {
    const now = Date.now();
    this.adapter.run(
      `UPDATE sessions 
       SET user_id = ?, username = ?, last_active_at = ?, is_active = 1 
       WHERE id = ?`,
      [userId, username ?? null, now, id],
    );
  }

  touch(id: string): void {
    const now = Date.now();
    this.adapter.run(
      "UPDATE sessions SET last_active_at = ? WHERE id = ?",
      [now, id],
    );
  }

  delete(id: string): void {
    this.adapter.run("DELETE FROM sessions WHERE id = ?", [id]);
  }

  count(): number {
    const result = this.adapter.get<{ count: number }>(
      "SELECT COUNT(*) as count FROM sessions",
    );
    return result?.count ?? 0;
  }

  private rowToSession(row: {
    id: string;
    phone: string;
    user_id: string;
    username: string | null;
    created_at: number;
    last_active_at: number;
    is_active: number;
  }): Session {
    return {
      id: row.id,
      phone: row.phone,
      userId: row.user_id,
      username: row.username ?? undefined,
      createdAt: row.created_at,
      lastActiveAt: row.last_active_at,
      isActive: !!row.is_active,
    };
  }
}
