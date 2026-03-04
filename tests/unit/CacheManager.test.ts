import { describe, it, expect, beforeEach } from "vitest";

import { CacheManager } from "~/core/cache";
import { InMemoryCacheRepository } from "~/core/repositories";

describe("CacheManager", () => {
  let cache: CacheManager;
  let cacheRepository: InMemoryCacheRepository;

  beforeEach(() => {
    cacheRepository = new InMemoryCacheRepository();
    cache = new CacheManager(cacheRepository);
  });

  describe("set and get", () => {
    it("should store and retrieve a string value", async () => {
      await cache.set("key1", "value1");
      const value = await cache.get<string>("key1");
      expect(value).toBe("value1");
    });

    it("should store and retrieve a number value", async () => {
      await cache.set("key2", 42);
      const value = await cache.get<number>("key2");
      expect(value).toBe(42);
    });

    it("should store and retrieve an object value", async () => {
      const obj = { foo: "bar", num: 123 };
      await cache.set("key3", obj);
      const value = await cache.get<typeof obj>("key3");
      expect(value).toEqual(obj);
    });

    it("should return null for non-existent key", async () => {
      const value = await cache.get("non-existent");
      expect(value).toBeNull();
    });
  });

  describe("TTL", () => {
    it("should expire value after TTL", async () => {
      await cache.set("temp", "value", 50);
      
      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 100));
      
      const value = await cache.get("temp");
      expect(value).toBeNull();
    });

    it("should not expire value without TTL", async () => {
      await cache.set("permanent", "value");
      
      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100));
      
      const value = await cache.get("permanent");
      expect(value).toBe("value");
    });
  });

  describe("delete", () => {
    it("should delete existing key", async () => {
      await cache.set("key", "value");
      const deleted = await cache.delete("key");
      expect(deleted).toBe(true);
      expect(await cache.get("key")).toBeNull();
    });

    it("should return false for non-existent key", async () => {
      const deleted = await cache.delete("non-existent");
      expect(deleted).toBe(false);
    });
  });

  describe("clear", () => {
    it("should remove all entries", async () => {
      await cache.set("key1", "value1");
      await cache.set("key2", "value2");
      
      await cache.clear();
      
      expect(await cache.get("key1")).toBeNull();
      expect(await cache.get("key2")).toBeNull();
    });
  });

  describe("clearByPrefix", () => {
    it("should remove entries matching prefix", async () => {
      await cache.set("user:1", "value1");
      await cache.set("user:2", "value2");
      await cache.set("other:1", "value3");
      
      await cache.clearByPrefix("user:");
      
      expect(await cache.get("user:1")).toBeNull();
      expect(await cache.get("user:2")).toBeNull();
      expect(await cache.get("other:1")).toBe("value3");
    });
  });

  describe("stats", () => {
    it("should return correct statistics", async () => {
      await cache.set("key1", "value1");
      await cache.set("key2", "value2");
      
      await cache.get("key1");
      await cache.get("key2");
      await cache.get("non-existent");
      
      const stats = await cache.stats();
      
      expect(stats.totalEntries).toBe(2);
      expect(stats.hitCount).toBe(2);
      expect(stats.missCount).toBe(1);
    });

    it("should count expired entries separately", async () => {
      await cache.set("temp", "value", 50);
      await cache.set("permanent", "value");
      
      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 100));
      
      const stats = await cache.stats();
      expect(stats.expiredEntries).toBe(1);
    });
  });

  describe("cleanup", () => {
    it("should remove expired entries", async () => {
      await cache.set("temp1", "value1", 50);
      await cache.set("temp2", "value2", 50);
      await cache.set("permanent", "value3");
      
      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 100));
      
      const cleaned = await cache.cleanup();
      expect(cleaned).toBe(2);
      
      expect(await cache.get("temp1")).toBeNull();
      expect(await cache.get("temp2")).toBeNull();
      expect(await cache.get("permanent")).toBe("value3");
    });
  });
});
