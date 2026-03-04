import { describe, it, expect, beforeEach } from "vitest";

import { AccountManager } from "~/accounts/AccountManager";
import { TelegramService } from "~/telegram/TelegramService";
import { MockTelegramProvider } from "~/telegram/MockTelegramProvider";
import { InMemoryAccountRepository } from "~/core/repositories";

describe("AUTH Tools", () => {
  let accountManager: AccountManager;
  let accountRepository: InMemoryAccountRepository;
  let telegramService: TelegramService;

  beforeEach(() => {
    accountRepository = new InMemoryAccountRepository();
    accountManager = new AccountManager(accountRepository);
    telegramService = new TelegramService(new MockTelegramProvider({ delayMs: 0 }));
  });

  describe("login_start", () => {
    it("should start login process", async () => {
      await telegramService.login("+1234567890");
      expect(telegramService.isAuthenticated()).toBe(true);
    });
  });

  describe("get_auth_status", () => {
    it("should return status with no accounts", () => {
      const status = accountManager.getAuthStatus();
      expect(status.hasAccounts).toBe(false);
      expect(status.accountsCount).toBe(0);
      expect(status.state).toBe("none");
      expect(status.requiresLogin).toBe(true);
    });

    it("should return status with active account", () => {
      const account = accountManager.createAccount("+1234567890");
      accountManager.activateSession(account.id, "user-123", "testuser");

      const status = accountManager.getAuthStatus();
      expect(status.hasAccounts).toBe(true);
      expect(status.state).toBe("authenticated");
      expect(status.requiresLogin).toBe(false);
      expect(status.activeAccount?.phone).toBe("+1234567890");
    });
  });

  describe("list_accounts", () => {
    it("should return empty list", () => {
      const accounts = accountManager.getAllAccounts();
      expect(accounts).toHaveLength(0);
    });

    it("should return all accounts", () => {
      accountManager.createAccount("+1111111111");
      accountManager.createAccount("+2222222222");

      const accounts = accountManager.getAllAccounts();
      expect(accounts).toHaveLength(2);
      expect(accounts.map(a => a.phone)).toContain("+1111111111");
      expect(accounts.map(a => a.phone)).toContain("+2222222222");
    });
  });

  describe("set_default_account", () => {
    it("should set account by ID", () => {
      const account1 = accountManager.createAccount("+1111111111");
      const account2 = accountManager.createAccount("+2222222222");

      accountManager.setDefaultAccount(account1.id);

      const status = accountManager.getAuthStatus();
      expect(status.activeAccount?.id).toBe(account1.id);
    });

    it("should set account by phone", () => {
      accountManager.createAccount("+1111111111");
      const account2 = accountManager.createAccount("+2222222222");

      accountManager.setDefaultAccountByPhone("+2222222222");

      const status = accountManager.getAuthStatus();
      expect(status.activeAccount?.id).toBe(account2.id);
    });
  });

  describe("switch_account", () => {
    it("should switch between accounts", () => {
      const account1 = accountManager.createAccount("+1111111111");
      const account2 = accountManager.createAccount("+2222222222");

      // Activate account1
      accountManager.setDefaultAccount(account1.id);
      expect(accountManager.getAuthStatus().activeAccount?.id).toBe(account1.id);

      // Switch to account2
      accountManager.setDefaultAccount(account2.id);
      expect(accountManager.getAuthStatus().activeAccount?.id).toBe(account2.id);
    });
  });

  describe("get_me", () => {
    it("should return undefined when no active account", () => {
      const status = accountManager.getAuthStatus();
      expect(status.activeAccount).toBeUndefined();
    });

    it("should return active account info", () => {
      const account = accountManager.createAccount("+1234567890");
      accountManager.activateSession(account.id, "user-123", "testuser");

      const status = accountManager.getAuthStatus();
      expect(status.activeAccount).toBeDefined();
      expect(status.activeAccount?.phone).toBe("+1234567890");
      expect(status.activeAccount?.username).toBe("testuser");
    });
  });

  describe("is_logged_in", () => {
    it("should return false when not authenticated", () => {
      expect(telegramService.isAuthenticated()).toBe(false);
    });

    it("should return true after login", async () => {
      await telegramService.login("+1234567890");
      expect(telegramService.isAuthenticated()).toBe(true);
    });
  });

  describe("logout", () => {
    it("should logout", async () => {
      await telegramService.login("+1234567890");
      expect(telegramService.isAuthenticated()).toBe(true);

      await telegramService.logout();
      expect(telegramService.isAuthenticated()).toBe(false);
    });
  });
});
