import { eq, desc, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";

import {
  sessions as sessionsTable,
  type Session as SessionRow,
} from "~/core/database";
import type { Account, AccountStatus, Session } from "~/types";

/**
 * Account manager for handling Telegram account sessions using Drizzle ORM
 */
export class AccountManager {
  private db: ReturnType<typeof drizzle>;

  constructor(db: Database.Database) {
    this.db = drizzle(db, { schema: { sessions: sessionsTable } });
  }

  /**
   * Create a new account
   */
  createAccount(phone: string): Account {
    const now = Date.now();
    const account: Account = {
      id: uuidv4(),
      phone,
      status: "pending_auth",
      createdAt: now,
      updatedAt: now,
    };

    this.db
      .insert(sessionsTable)
      .values({
        id: account.id,
        phone,
        userId: "",
        username: null,
        createdAt: now,
        lastActiveAt: now,
        isActive: 0,
      })
      .run();

    return account;
  }

  /**
   * Get account by ID
   */
  getAccount(id: string): Account | null {
    const row = this.db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.id, id))
      .get();

    if (!row) {
      return null;
    }

    return this.rowToAccount(row);
  }

  /**
   * Get account by phone
   */
  getAccountByPhone(phone: string): Account | null {
    const row = this.db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.phone, phone))
      .get();

    if (!row) {
      return null;
    }

    return this.rowToAccount(row);
  }

  /**
   * Get all accounts
   */
  getAllAccounts(): Account[] {
    const rows = this.db
      .select()
      .from(sessionsTable)
      .orderBy(desc(sessionsTable.createdAt))
      .all();

    return rows.map((row) => this.rowToAccount(row));
  }

  /**
   * Get active accounts
   */
  getActiveAccounts(): Account[] {
    const rows = this.db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.isActive, 1))
      .orderBy(desc(sessionsTable.lastActiveAt))
      .all();

    return rows.map((row) => this.rowToAccount(row));
  }

  /**
   * Update account status
   */
  updateAccountStatus(
    id: string,
    status: AccountStatus,
    _error?: string,
  ): void {
    const isActive = status === "active" ? 1 : 0;

    this.db
      .update(sessionsTable)
      .set({ isActive })
      .where(eq(sessionsTable.id, id))
      .run();
  }

  /**
   * Activate a session
   */
  activateSession(id: string, userId: string, username?: string): void {
    const now = Date.now();

    this.db
      .update(sessionsTable)
      .set({
        userId,
        username: username ?? null,
        lastActiveAt: now,
        isActive: 1,
      })
      .where(eq(sessionsTable.id, id))
      .run();
  }

  /**
   * Deactivate a session
   */
  deactivateSession(id: string): void {
    this.db
      .update(sessionsTable)
      .set({ isActive: 0 })
      .where(eq(sessionsTable.id, id))
      .run();
  }

  /**
   * Delete an account
   */
  deleteAccount(id: string): boolean {
    const result = this.db
      .delete(sessionsTable)
      .where(eq(sessionsTable.id, id))
      .run();

    return result.changes > 0;
  }

  /**
   * Update last active timestamp
   */
  touchSession(id: string): void {
    const now = Date.now();
    this.db
      .update(sessionsTable)
      .set({ lastActiveAt: now })
      .where(eq(sessionsTable.id, id))
      .run();
  }

  /**
   * Get session by ID
   */
  getSession(id: string): Session | null {
    const row = this.db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.id, id))
      .get();

    if (!row) {
      return null;
    }

    return this.rowToSession(row);
  }

  /**
   * Get active session
   */
  getActiveSession(): Session | null {
    const row = this.db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.isActive, 1))
      .orderBy(desc(sessionsTable.lastActiveAt))
      .limit(1)
      .get();

    if (!row) {
      return null;
    }

    return this.rowToSession(row);
  }

  /**
   * Count accounts
   */
  count(): number {
    const result = this.db.select({ count: count() }).from(sessionsTable).get();

    return result?.count ?? 0;
  }

  private rowToAccount(row: SessionRow): Account {
    const status: AccountStatus = row.isActive ? "active" : "inactive";

    return {
      id: row.id,
      phone: row.phone,
      status,
      session: row.userId
        ? {
            id: row.id,
            phone: row.phone,
            userId: row.userId,
            username: row.username ?? undefined,
            createdAt: row.createdAt,
            lastActiveAt: row.lastActiveAt,
            isActive: !!row.isActive,
          }
        : undefined,
      createdAt: row.createdAt,
      updatedAt: row.lastActiveAt,
    };
  }

  private rowToSession(row: SessionRow): Session {
    return {
      id: row.id,
      phone: row.phone,
      userId: row.userId,
      username: row.username ?? undefined,
      createdAt: row.createdAt,
      lastActiveAt: row.lastActiveAt,
      isActive: !!row.isActive,
    };
  }
}
