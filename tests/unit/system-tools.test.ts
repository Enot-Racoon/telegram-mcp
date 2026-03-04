import { describe, it, expect, beforeEach } from "vitest";

import { Logger } from "~/core/logging";
import { CacheManager } from "~/core/cache";
import { InMemoryLogRepository, InMemoryCacheRepository } from "~/core/repositories";

describe("System Tools", () => {
  let logger: Logger;
  let cache: CacheManager;
  let logRepository: InMemoryLogRepository;
  let cacheRepository: InMemoryCacheRepository;

  beforeEach(() => {
    logRepository = new InMemoryLogRepository();
    cacheRepository = new InMemoryCacheRepository();
    logger = new Logger(logRepository, "debug");
    cache = new CacheManager(cacheRepository);
  });

  describe("get_logs", () => {
    it("should return empty logs when none exist", async () => {
      const logs = await logger.query();
      expect(logs).toHaveLength(0);
    });

    it("should return logs after logging", async () => {
      logger.info("Test message", { tool: "test" });
      logger.error("Error message", { tool: "test" });

      const logs = await logger.query();
      expect(logs.length).toBe(2);
    });

    it("should filter logs by level", async () => {
      logger.debug("Debug message");
      logger.info("Info message");
      logger.warn("Warn message");
      logger.error("Error message");

      const errorLogs = await logger.query({ level: "error" });
      expect(errorLogs.length).toBe(1);
      expect(errorLogs[0].level).toBe("error");
    });

    it("should filter logs by tool", async () => {
      logger.info("Message 1", { tool: "tool1" });
      logger.info("Message 2", { tool: "tool2" });
      logger.info("Message 3", { tool: "tool1" });

      const tool1Logs = await logger.query({ tool: "tool1" });
      expect(tool1Logs.length).toBe(2);
    });

    it("should respect limit and offset", async () => {
      for (let i = 0; i < 10; i++) {
        logger.info(`Message ${i}`);
      }

      const limited = await logger.query({ limit: 5 });
      expect(limited.length).toBe(5);

      const offsetLogs = await logger.query({ limit: 5, offset: 5 });
      expect(offsetLogs.length).toBe(5);
    });

    it("should return correct count", async () => {
      logger.info("Message 1");
      logger.info("Message 2");
      logger.info("Message 3");

      const count = await logger.count();
      expect(count).toBe(3);
    });
  });

  describe("clear_cache", () => {
    it("should clear all cache", async () => {
      await cache.set("key1", "value1");
      await cache.set("key2", "value2");
      await cache.set("prefix_key3", "value3");

      const statsBefore = await cache.stats();
      expect(statsBefore.totalEntries).toBe(3);

      await cache.clear();

      const statsAfter = await cache.stats();
      expect(statsAfter.totalEntries).toBe(0);
    });

    it("should clear cache by prefix", async () => {
      await cache.set("key1", "value1");
      await cache.set("key2", "value2");
      await cache.set("prefix_key3", "value3");
      await cache.set("prefix_key4", "value4");

      await cache.clearByPrefix("prefix_");

      const stats = await cache.stats();
      expect(stats.totalEntries).toBe(2);

      const key1 = await cache.get("key1");
      expect(key1).toBe("value1");

      const prefixKey3 = await cache.get("prefix_key3");
      expect(prefixKey3).toBeNull();
    });
  });

  describe("get_cache_stats", () => {
    it("should return cache statistics", async () => {
      const stats = await cache.stats();

      expect(stats).toHaveProperty("totalEntries");
      expect(stats).toHaveProperty("expiredEntries");
      expect(stats).toHaveProperty("hitCount");
      expect(stats).toHaveProperty("missCount");
      expect(stats).toHaveProperty("size");
    });

    it("should track hit and miss counts", async () => {
      await cache.set("key1", "value1");

      // Get existing key (hit)
      await cache.get("key1");
      // Get non-existing key (miss)
      await cache.get("nonexistent");

      const stats = await cache.stats();
      expect(stats.hitCount).toBe(1);
      expect(stats.missCount).toBe(1);
    });

    it("should count entries correctly", async () => {
      await cache.set("key1", "value1");
      await cache.set("key2", "value2");
      await cache.set("key3", "value3");

      const stats = await cache.stats();
      expect(stats.totalEntries).toBe(3);
    });

    it("should count expired entries", async () => {
      // Set with very short TTL
      await cache.set("expiring", "value", 1);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 10));

      const stats = await cache.stats();
      expect(stats.expiredEntries).toBe(1);
    });
  });
});
