import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import * as fs from "node:fs";
import * as path from "node:path";
import { tmpdir } from "node:os";

import { AccountManager } from "~/accounts/AccountManager";
import { initializeDatabase, closeDatabase } from "~/core/database";

import { applyMigrations } from "../setup";

describe("AccountManager", () => {
  let db: Database.Database;
  let accountManager: AccountManager;
  let dbPath: string;

  beforeEach(() => {
    dbPath = path.join(tmpdir(), `test-accounts-${Date.now()}.db`);
    db = initializeDatabase(dbPath);
    applyMigrations(db);
    accountManager = new AccountManager(db);
  });

  afterEach(() => {
    closeDatabase(db);
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
  });

  describe("createAccount", () => {
    it("should create a new account with pending_auth status", () => {
      const account = accountManager.createAccount("+1234567890");
      expect(account.phone).toBe("+1234567890");
      expect(account.status).toBe("pending_auth");
      expect(account.id).toBeDefined();
    });

    it("should create unique IDs for each account", () => {
      const account1 = accountManager.createAccount("+1111111111");
      const account2 = accountManager.createAccount("+2222222222");
      expect(account1.id).not.toBe(account2.id);
    });
  });

  describe("getAccount", () => {
    it("should retrieve account by ID", () => {
      const created = accountManager.createAccount("+1234567890");
      const retrieved = accountManager.getAccount(created.id);
      expect(retrieved).toBeTruthy();
      expect(retrieved?.phone).toBe("+1234567890");
    });

    it("should return null for non-existent account", () => {
      const account = accountManager.getAccount("non-existent-id");
      expect(account).toBeNull();
    });
  });

  describe("getAccountByPhone", () => {
    it("should retrieve account by phone", () => {
      accountManager.createAccount("+1234567890");
      const account = accountManager.getAccountByPhone("+1234567890");
      expect(account).toBeTruthy();
      expect(account?.phone).toBe("+1234567890");
    });

    it("should return null for non-existent phone", () => {
      const account = accountManager.getAccountByPhone("+9999999999");
      expect(account).toBeNull();
    });
  });

  describe("getAllAccounts", () => {
    it("should return all accounts", () => {
      accountManager.createAccount("+1111111111");
      accountManager.createAccount("+2222222222");
      accountManager.createAccount("+3333333333");

      const accounts = accountManager.getAllAccounts();
      expect(accounts).toHaveLength(3);
    });

    it("should return empty array when no accounts", () => {
      const accounts = accountManager.getAllAccounts();
      expect(accounts).toHaveLength(0);
    });
  });

  describe("activateSession", () => {
    it("should activate a session", () => {
      const account = accountManager.createAccount("+1234567890");
      accountManager.activateSession(account.id, "user-123", "testuser");

      const updated = accountManager.getAccount(account.id);
      expect(updated?.status).toBe("active");
      expect(updated?.session?.userId).toBe("user-123");
      expect(updated?.session?.username).toBe("testuser");
    });
  });

  describe("deactivateSession", () => {
    it("should deactivate a session", () => {
      const account = accountManager.createAccount("+1234567890");
      accountManager.activateSession(account.id, "user-123");
      accountManager.deactivateSession(account.id);

      const updated = accountManager.getAccount(account.id);
      expect(updated?.status).toBe("inactive");
    });
  });

  describe("deleteAccount", () => {
    it("should delete an account", () => {
      const account = accountManager.createAccount("+1234567890");
      const deleted = accountManager.deleteAccount(account.id);
      expect(deleted).toBe(true);
      expect(accountManager.getAccount(account.id)).toBeNull();
    });

    it("should return false for non-existent account", () => {
      const deleted = accountManager.deleteAccount("non-existent");
      expect(deleted).toBe(false);
    });
  });

  describe("getActiveAccounts", () => {
    it("should return only active accounts", () => {
      const account1 = accountManager.createAccount("+1111111111");
      const account2 = accountManager.createAccount("+2222222222");
      accountManager.createAccount("+3333333333");

      accountManager.activateSession(account1.id, "user-1");
      accountManager.activateSession(account2.id, "user-2");

      const active = accountManager.getActiveAccounts();
      expect(active).toHaveLength(2);
    });
  });

  describe("touchSession", () => {
    it("should update last_active_at timestamp", () => {
      const account = accountManager.createAccount("+1234567890");
      const before = accountManager.getAccount(account.id);

      // Wait a bit
      const start = Date.now();
      while (Date.now() - start < 10) {
        // Busy wait
      }

      accountManager.touchSession(account.id);
      const after = accountManager.getAccount(account.id);

      expect(after?.updatedAt).toBeGreaterThanOrEqual(before?.updatedAt || 0);
    });
  });

  describe("count", () => {
    it("should return correct count", () => {
      expect(accountManager.count()).toBe(0);

      accountManager.createAccount("+1111111111");
      expect(accountManager.count()).toBe(1);

      accountManager.createAccount("+2222222222");
      expect(accountManager.count()).toBe(2);
    });
  });
});
