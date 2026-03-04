import type { Session } from "~/types";

/**
 * Account repository interface
 * Defines data access operations for account/session management
 */
export interface AccountRepository {
  /**
   * Create a new session/account
   */
  create(session: Session): void;

  /**
   * Find session by ID
   */
  findById(id: string): Session | null;

  /**
   * Find session by phone number
   */
  findByPhone(phone: string): Session | null;

  /**
   * Get all sessions
   */
  getAll(): Session[];

  /**
   * Get active session
   */
  getActive(): Session | null;

  /**
   * Set session as active
   */
  setActive(id: string): void;

  /**
   * Deactivate all sessions and activate one (atomic operation)
   */
  setActiveExclusively(id: string): void;

  /**
   * Deactivate a specific session (atomic operation)
   */
  deactivateOne(id: string): void;

  /**
   * Deactivate all sessions
   */
  deactivateAll(): void;

  /**
   * Update session user info
   */
  updateUserInfo(
    id: string,
    userId: string,
    username?: string,
  ): void;

  /**
   * Update last active timestamp
   */
  touch(id: string): void;

  /**
   * Delete session by ID
   */
  delete(id: string): void;

  /**
   * Count all sessions
   */
  count(): number;
}
