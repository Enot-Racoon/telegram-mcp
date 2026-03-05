import { describe, it, expect } from "vitest";

import { TelegramExecutor } from "~/telegram/TelegramExecutor";

describe("TelegramExecutor", () => {
  const executor = new TelegramExecutor();

  describe("execute", () => {
    it("should return result on successful execution", async () => {
      const result = await executor.execute(() => Promise.resolve("success"));
      expect(result).toBe("success");
    });

    it("should retry on transient network errors", async () => {
      let attempts = 0;

      const result = await executor.execute(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error("NETWORK_ERROR");
        }
        return Promise.resolve("success after retry");
      });

      expect(result).toBe("success after retry");
      expect(attempts).toBe(3);
    });

    it("should stop retrying after max retries", async () => {
      let attempts = 0;

      await expect(
        executor.execute(() => {
          attempts++;
          throw new Error("NETWORK_ERROR");
        }),
      ).rejects.toThrow("NETWORK_ERROR");

      // Initial attempt + 3 retries = 4 total attempts
      expect(attempts).toBe(4);
    });

    it("should not retry non-retryable errors", async () => {
      let attempts = 0;

      await expect(
        executor.execute(() => {
          attempts++;
          throw new Error("Invalid phone number");
        }),
      ).rejects.toThrow("Invalid phone number");

      expect(attempts).toBe(1);
    });

    it("should handle FLOOD_WAIT errors with delay", async () => {
      let attempts = 0;
      const startTime = Date.now();

      const result = await executor.execute(() => {
        attempts++;
        if (attempts === 1) {
          const err = new Error("FLOOD_WAIT_1");
          throw err;
        }
        return Promise.resolve("success after flood wait");
      });

      const elapsed = Date.now() - startTime;

      expect(result).toBe("success after flood wait");
      expect(attempts).toBe(2);
      // Should have waited at least 1 second for flood wait
      expect(elapsed).toBeGreaterThanOrEqual(900);
    });

    it("should handle multiple FLOOD_WAIT errors", async () => {
      let attempts = 0;

      const result = await executor.execute(() => {
        attempts++;
        if (attempts === 1) {
          throw new Error("FLOOD_WAIT_1");
        }
        if (attempts === 2) {
          throw new Error("FLOOD_WAIT_2");
        }
        return Promise.resolve("success after multiple flood waits");
      });

      expect(result).toBe("success after multiple flood waits");
      expect(attempts).toBe(3);
    });

    it("should retry on TIMEOUT errors", async () => {
      let attempts = 0;

      const result = await executor.execute(() => {
        attempts++;
        if (attempts < 2) {
          throw new Error("Request TIMEOUT");
        }
        return Promise.resolve("success after timeout");
      });

      expect(result).toBe("success after timeout");
      expect(attempts).toBe(2);
    });

    it("should retry on ECONNRESET errors", async () => {
      let attempts = 0;

      const result = await executor.execute(() => {
        attempts++;
        if (attempts < 2) {
          throw new Error("read ECONNRESET");
        }
        return Promise.resolve("success after connection reset");
      });

      expect(result).toBe("success after connection reset");
      expect(attempts).toBe(2);
    });
  });

  describe("isRetryable", () => {
    it("should identify NETWORK errors as retryable", () => {
      const executor = new TelegramExecutor();
      // Access private method via any cast for testing
      const isRetryable = (executor as any).isRetryable.bind(executor);

      expect(isRetryable(new Error("NETWORK_ERROR"))).toBe(true);
    });

    it("should identify TIMEOUT errors as retryable", () => {
      const executor = new TelegramExecutor();
      const isRetryable = (executor as any).isRetryable.bind(executor);

      expect(isRetryable(new Error("Request TIMEOUT"))).toBe(true);
    });

    it("should identify ECONNRESET errors as retryable", () => {
      const executor = new TelegramExecutor();
      const isRetryable = (executor as any).isRetryable.bind(executor);

      expect(isRetryable(new Error("read ECONNRESET"))).toBe(true);
    });

    it("should identify ETIMEDOUT errors as retryable", () => {
      const executor = new TelegramExecutor();
      const isRetryable = (executor as any).isRetryable.bind(executor);

      expect(isRetryable(new Error("ETIMEDOUT"))).toBe(true);
    });

    it("should identify ENOTFOUND errors as retryable", () => {
      const executor = new TelegramExecutor();
      const isRetryable = (executor as any).isRetryable.bind(executor);

      expect(isRetryable(new Error("ENOTFOUND"))).toBe(true);
    });

    it("should not identify validation errors as retryable", () => {
      const executor = new TelegramExecutor();
      const isRetryable = (executor as any).isRetryable.bind(executor);

      expect(isRetryable(new Error("Invalid phone number"))).toBe(false);
      expect(isRetryable(new Error("Chat not found"))).toBe(false);
    });
  });
});
