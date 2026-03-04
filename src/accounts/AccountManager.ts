import { v4 as uuidv4 } from "uuid";
import type { AccountRepository } from "~/core/repositories";
import type { Account, Session, AuthStatus, AccountStatus } from "~/types";

/**
 * Account manager for handling Telegram account sessions
 * Uses repository pattern for data persistence
 */
export class AccountManager {
  private accountRepository: AccountRepository;

  constructor(accountRepository: AccountRepository) {
    this.accountRepository = accountRepository;
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

    this.accountRepository.create({
      id: account.id,
      phone,
      userId: "",
      username: undefined,
      createdAt: now,
      lastActiveAt: now,
      isActive: false,
    });

    return account;
  }

  /**
   * Get account by ID
   */
  getAccount(id: string): Account | null {
    const session = this.accountRepository.findById(id);

    if (!session) {
      return null;
    }

    return this.sessionToAccount(session);
  }

  /**
   * Get account by phone
   */
  getAccountByPhone(phone: string): Account | null {
    const session = this.accountRepository.findByPhone(phone);

    if (!session) {
      return null;
    }

    return this.sessionToAccount(session);
  }

  /**
   * Get all accounts
   */
  getAllAccounts(): Account[] {
    const sessions = this.accountRepository.getAll();
    return sessions.map((session) => this.sessionToAccount(session));
  }

  /**
   * Get active accounts
   */
  getActiveAccounts(): Account[] {
    const activeSession = this.accountRepository.getActive();
    return activeSession ? [this.sessionToAccount(activeSession)] : [];
  }

  /**
   * Activate a session
   */
  activateSession(id: string, userId: string, username?: string): void {
    this.accountRepository.updateUserInfo(id, userId, username);
  }

  /**
   * Deactivate a session
   */
  deactivateSession(id: string): void {
    this.accountRepository.deactivateOne(id);
  }

  /**
   * Delete an account
   */
  deleteAccount(id: string): boolean {
    const session = this.accountRepository.findById(id);
    if (!session) {
      return false;
    }
    this.accountRepository.delete(id);
    return true;
  }

  /**
   * Update last active timestamp
   */
  touchSession(id: string): void {
    this.accountRepository.touch(id);
  }

  /**
   * Get session by ID
   */
  getSession(id: string): Session | null {
    return this.accountRepository.findById(id);
  }

  /**
   * Get active session
   */
  getActiveSession(): Session | null {
    return this.accountRepository.getActive();
  }

  /**
   * Count accounts
   */
  count(): number {
    return this.accountRepository.count();
  }

  /**
   * Get auth status
   */
  getAuthStatus(): AuthStatus {
    const allAccounts = this.getAllAccounts();
    const activeAccount = this.getActiveSession();

    return {
      state: activeAccount ? "authenticated" : "none",
      hasAccounts: allAccounts.length > 0,
      accountsCount: allAccounts.length,
      activeAccount: activeAccount
        ? {
            id: activeAccount.id,
            phone: activeAccount.phone,
            username: activeAccount.username,
          }
        : undefined,
      requiresLogin: !activeAccount,
    };
  }

  /**
   * Set default (active) account by ID
   */
  setDefaultAccount(id: string): boolean {
    const account = this.getAccount(id);
    if (!account) {
      return false;
    }

    // Atomic operation: deactivate all and activate one
    this.accountRepository.setActiveExclusively(id);

    return true;
  }

  /**
   * Set default account by phone
   */
  setDefaultAccountByPhone(phone: string): boolean {
    const account = this.getAccountByPhone(phone);
    if (!account) {
      return false;
    }

    return this.setDefaultAccount(account.id);
  }

  private sessionToAccount(session: Session): Account {
    const status: AccountStatus = session.isActive ? "active" : "inactive";

    return {
      id: session.id,
      phone: session.phone,
      status,
      session: session.userId
        ? {
            id: session.id,
            phone: session.phone,
            userId: session.userId,
            username: session.username,
            createdAt: session.createdAt,
            lastActiveAt: session.lastActiveAt,
            isActive: session.isActive,
          }
        : undefined,
      createdAt: session.createdAt,
      updatedAt: session.lastActiveAt,
    };
  }
}
