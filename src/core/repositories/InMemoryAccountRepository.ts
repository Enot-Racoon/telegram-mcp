import type { AccountRepository } from "./AccountRepository";
import type { Session } from "~/types";

/**
 * In-memory implementation of AccountRepository for testing
 */
export class InMemoryAccountRepository implements AccountRepository {
  private sessions: Map<string, Session> = new Map();

  create(session: Session): void {
    this.sessions.set(session.id, {
      ...session,
      userId: "",
      isActive: false,
    });
  }

  findById(id: string): Session | null {
    return this.sessions.get(id) ?? null;
  }

  findByPhone(phone: string): Session | null {
    for (const session of this.sessions.values()) {
      if (session.phone === phone) {
        return session;
      }
    }
    return null;
  }

  getAll(): Session[] {
    return Array.from(this.sessions.values()).sort(
      (a, b) => b.createdAt - a.createdAt,
    );
  }

  getActive(): Session | null {
    const active = Array.from(this.sessions.values())
      .filter((s) => s.isActive)
      .sort((a, b) => b.lastActiveAt - a.lastActiveAt);
    return active[0] ?? null;
  }

  setActive(id: string): void {
    const session = this.sessions.get(id);
    if (session) {
      session.isActive = true;
      this.sessions.set(id, session);
    }
  }

  setActiveExclusively(id: string): void {
    // Deactivate all first
    for (const session of this.sessions.values()) {
      session.isActive = false;
      this.sessions.set(session.id, session);
    }
    // Then activate the specified one
    const session = this.sessions.get(id);
    if (session) {
      session.isActive = true;
      this.sessions.set(id, session);
    }
  }

  deactivateOne(id: string): void {
    const session = this.sessions.get(id);
    if (session) {
      session.isActive = false;
      this.sessions.set(id, session);
    }
  }

  deactivateAll(): void {
    for (const session of this.sessions.values()) {
      session.isActive = false;
      this.sessions.set(session.id, session);
    }
  }

  updateUserInfo(id: string, userId: string, username?: string): void {
    const session = this.sessions.get(id);
    if (session) {
      session.userId = userId;
      session.username = username;
      session.lastActiveAt = Date.now();
      session.isActive = true;
      this.sessions.set(id, session);
    }
  }

  touch(id: string): void {
    const session = this.sessions.get(id);
    if (session) {
      session.lastActiveAt = Date.now();
      this.sessions.set(id, session);
    }
  }

  delete(id: string): void {
    this.sessions.delete(id);
  }

  count(): number {
    return this.sessions.size;
  }
}
