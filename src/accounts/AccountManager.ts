import type Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import type { Account, AccountStatus, Session } from '../../types/index.js';

/**
 * Account manager for handling Telegram account sessions
 */
export class AccountManager {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  /**
   * Create a new account
   */
  createAccount(phone: string): Account {
    const now = Date.now();
    const account: Account = {
      id: uuidv4(),
      phone,
      status: 'pending_auth',
      createdAt: now,
      updatedAt: now,
    };

    const stmt = this.db.prepare(`
      INSERT INTO sessions (id, phone, user_id, username, created_at, last_active_at, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    // Create session record (will be updated when authenticated)
    stmt.run(account.id, phone, '', null, now, now, 0);

    return account;
  }

  /**
   * Get account by ID
   */
  getAccount(id: string): Account | null {
    const stmt = this.db.prepare('SELECT * FROM sessions WHERE id = ?');
    const row = stmt.get(id) as SessionRow | undefined;

    if (!row) {
      return null;
    }

    return this.rowToAccount(row);
  }

  /**
   * Get account by phone
   */
  getAccountByPhone(phone: string): Account | null {
    const stmt = this.db.prepare('SELECT * FROM sessions WHERE phone = ?');
    const row = stmt.get(phone) as SessionRow | undefined;

    if (!row) {
      return null;
    }

    return this.rowToAccount(row);
  }

  /**
   * Get all accounts
   */
  getAllAccounts(): Account[] {
    const stmt = this.db.prepare('SELECT * FROM sessions ORDER BY created_at DESC');
    const rows = stmt.all() as SessionRow[];

    return rows.map((row) => this.rowToAccount(row));
  }

  /**
   * Get active accounts
   */
  getActiveAccounts(): Account[] {
    const stmt = this.db.prepare('SELECT * FROM sessions WHERE is_active = 1 ORDER BY last_active_at DESC');
    const rows = stmt.all() as SessionRow[];

    return rows.map((row) => this.rowToAccount(row));
  }

  /**
   * Update account status
   */
  updateAccountStatus(id: string, status: AccountStatus, error?: string): void {
    const now = Date.now();
    const isActive = status === 'active' ? 1 : 0;

    const stmt = this.db.prepare(`
      UPDATE sessions
      SET is_active = ?, updated_at = ?
      WHERE id = ?
    `);

    // Note: We'd need an updated_at column for full implementation
    // For now, we just update is_active
    stmt.run(isActive, now, id);

    if (error) {
      // Store error in a separate errors table or metadata
      // For simplicity, we'll skip this in the mock implementation
    }
  }

  /**
   * Activate a session
   */
  activateSession(id: string, userId: string, username?: string): void {
    const now = Date.now();

    const stmt = this.db.prepare(`
      UPDATE sessions
      SET user_id = ?, username = ?, last_active_at = ?, is_active = 1
      WHERE id = ?
    `);

    stmt.run(userId, username || null, now, id);
  }

  /**
   * Deactivate a session
   */
  deactivateSession(id: string): void {
    const stmt = this.db.prepare(`
      UPDATE sessions
      SET is_active = 0
      WHERE id = ?
    `);

    stmt.run(id);
  }

  /**
   * Delete an account
   */
  deleteAccount(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM sessions WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Update last active timestamp
   */
  touchSession(id: string): void {
    const now = Date.now();
    const stmt = this.db.prepare(`
      UPDATE sessions
      SET last_active_at = ?
      WHERE id = ?
    `);
    stmt.run(now, id);
  }

  /**
   * Get session by ID
   */
  getSession(id: string): Session | null {
    const stmt = this.db.prepare('SELECT * FROM sessions WHERE id = ?');
    const row = stmt.get(id) as SessionRow | undefined;

    if (!row) {
      return null;
    }

    return this.rowToSession(row);
  }

  /**
   * Get active session
   */
  getActiveSession(): Session | null {
    const stmt = this.db.prepare(
      'SELECT * FROM sessions WHERE is_active = 1 ORDER BY last_active_at DESC LIMIT 1'
    );
    const row = stmt.get() as SessionRow | undefined;

    if (!row) {
      return null;
    }

    return this.rowToSession(row);
  }

  /**
   * Count accounts
   */
  count(): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM sessions');
    const result = stmt.get() as { count: number };
    return result.count;
  }

  private rowToAccount(row: SessionRow): Account {
    const status: AccountStatus = row.is_active ? 'active' : 'inactive';

    return {
      id: row.id,
      phone: row.phone,
      status,
      session: row.user_id
        ? {
            id: row.id,
            phone: row.phone,
            userId: row.user_id,
            username: row.username || undefined,
            createdAt: row.created_at,
            lastActiveAt: row.last_active_at,
            isActive: !!row.is_active,
          }
        : undefined,
      createdAt: row.created_at,
      updatedAt: row.last_active_at,
    };
  }

  private rowToSession(row: SessionRow): Session {
    return {
      id: row.id,
      phone: row.phone,
      userId: row.user_id,
      username: row.username || undefined,
      createdAt: row.created_at,
      lastActiveAt: row.last_active_at,
      isActive: !!row.is_active,
    };
  }
}

interface SessionRow {
  id: string;
  phone: string;
  user_id: string;
  username: string | null;
  created_at: number;
  last_active_at: number;
  is_active: number;
}
