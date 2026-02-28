import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import * as fs from "node:fs";
import * as path from "node:path";
import { tmpdir } from "node:os";

import { CacheManager } from "~/core/cache";
import { initializeDatabase, closeDatabase } from "~/core/database";

import { applyMigrations } from "../setup";

describe("CacheManager", () => {
  let db: Database.Database;
  let cache: CacheManager;
  let dbPath: string;

  beforeEach(() => {
    // Create temp database
    dbPath = path.join(tmpdir(), `test-cache-${Date.now()}.db`);
    db = initializeDatabase(dbPath);
    applyMigrations(db);
    cache = new CacheManager(db);
  });

  afterEach(() => {
    closeDatabase(db);
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
  });

  describe("set and get", () => {
    it("should store and retrieve a string value", async () => {
      await cache.set("key1", "value1");
      const result = await cache.get<string>("key1");
      expect(result).toBe("value1");
    });

    it("should store and retrieve a number value", async () => {
      await cache.set("key1", 42);
      const result = await cache.get<number>("key1");
      expect(result).toBe(42);
    });

    it("should store and retrieve an object value", async () => {
      const obj = { name: "test", value: 123 };
      await cache.set("key1", obj);
      const result = await cache.get<typeof obj>("key1");
      expect(result).toEqual(obj);
    });

    it("should return null for non-existent key", async () => {
      const result = await cache.get("non-existent");
      expect(result).toBeNull();
    });
  });

  describe("TTL", () => {
    it("should expire value after TTL", async () => {
      await cache.set("key1", "value1", 100); // 100ms TTL
      expect(await cache.get("key1")).toBe("value1");

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(await cache.get("key1")).toBeNull();
    });

    it("should not expire value without TTL", async () => {
      await cache.set("key1", "value1");

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(await cache.get("key1")).toBe("value1");
    });
  });

  describe("delete", () => {
    it("should delete existing key", async () => {
      await cache.set("key1", "value1");
      const deleted = await cache.delete("key1");
      expect(deleted).toBe(true);
      expect(await cache.get("key1")).toBeNull();
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
      await cache.set("key3", "value3");

      await cache.clear();

      expect(await cache.get("key1")).toBeNull();
      expect(await cache.get("key2")).toBeNull();
      expect(await cache.get("key3")).toBeNull();
    });
  });

  describe("clearByPrefix", () => {
    it("should remove entries matching prefix", async () => {
      await cache.set("user:1", "value1");
      await cache.set("user:2", "value2");
      await cache.set("config:1", "value3");

      await cache.clearByPrefix("user:");

      expect(await cache.get("user:1")).toBeNull();
      expect(await cache.get("user:2")).toBeNull();
      expect(await cache.get("config:1")).toBe("value3");
    });
  });

  describe("stats", () => {
    it("should return correct statistics", async () => {
      await cache.set("key1", "value1");
      await cache.set("key2", "value2");
      await cache.get("key1"); // hit
      await cache.get("key1"); // hit
      await cache.get("non-existent"); // miss

      const stats = await cache.stats();
      expect(stats.totalEntries).toBe(2);
      expect(stats.hitCount).toBe(2);
      expect(stats.missCount).toBe(1);
    });

    it("should count expired entries separately", async () => {
      await cache.set("key1", "value1", 50);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 100));

      const stats = await cache.stats();
      expect(stats.expiredEntries).toBe(1);
    });
  });

  describe("cleanup", () => {
    it("should remove expired entries", async () => {
      await cache.set("key1", "value1", 50);
      await cache.set("key2", "value2");

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 100));

      const removed = await cache.cleanup();
      expect(removed).toBe(1);
      expect(await cache.get("key1")).toBeNull();
      expect(await cache.get("key2")).toBe("value2");
    });
  });
});
