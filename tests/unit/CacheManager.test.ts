import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { CacheManager } from '../../src/core/cache/index.js';
import { initializeDatabase, closeDatabase } from '../../src/core/database/index.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { tmpdir } from 'node:os';

describe('CacheManager', () => {
  let db: Database.Database;
  let cache: CacheManager;
  let dbPath: string;

  beforeEach(() => {
    // Create temp database
    dbPath = path.join(tmpdir(), `test-cache-${Date.now()}.db`);
    db = initializeDatabase(dbPath);
    cache = new CacheManager(db);
  });

  afterEach(() => {
    closeDatabase(db);
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
  });

  describe('set and get', () => {
    it('should store and retrieve a string value', () => {
      cache.set('key1', 'value1');
      const result = cache.get<string>('key1');
      expect(result).toBe('value1');
    });

    it('should store and retrieve a number value', () => {
      cache.set('key1', 42);
      const result = cache.get<number>('key1');
      expect(result).toBe(42);
    });

    it('should store and retrieve an object value', () => {
      const obj = { name: 'test', value: 123 };
      cache.set('key1', obj);
      const result = cache.get<typeof obj>('key1');
      expect(result).toEqual(obj);
    });

    it('should return null for non-existent key', () => {
      const result = cache.get('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('TTL', () => {
    it('should expire value after TTL', () => {
      cache.set('key1', 'value1', 100); // 100ms TTL
      expect(cache.get('key1')).toBe('value1');

      // Wait for expiration
      const start = Date.now();
      while (Date.now() - start < 150) {
        // Busy wait for test
      }

      expect(cache.get('key1')).toBeNull();
    });

    it('should not expire value without TTL', () => {
      cache.set('key1', 'value1');
      
      // Wait a bit
      const start = Date.now();
      while (Date.now() - start < 100) {
        // Busy wait
      }

      expect(cache.get('key1')).toBe('value1');
    });
  });

  describe('delete', () => {
    it('should delete existing key', () => {
      cache.set('key1', 'value1');
      const deleted = cache.delete('key1');
      expect(deleted).toBe(true);
      expect(cache.get('key1')).toBeNull();
    });

    it('should return false for non-existent key', () => {
      const deleted = cache.delete('non-existent');
      expect(deleted).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      cache.clear();

      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
      expect(cache.get('key3')).toBeNull();
    });
  });

  describe('clearByPrefix', () => {
    it('should remove entries matching prefix', () => {
      cache.set('user:1', 'value1');
      cache.set('user:2', 'value2');
      cache.set('config:1', 'value3');

      cache.clearByPrefix('user:');

      expect(cache.get('user:1')).toBeNull();
      expect(cache.get('user:2')).toBeNull();
      expect(cache.get('config:1')).toBe('value3');
    });
  });

  describe('stats', () => {
    it('should return correct statistics', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.get('key1'); // hit
      cache.get('key1'); // hit
      cache.get('non-existent'); // miss

      const stats = cache.stats();
      expect(stats.totalEntries).toBe(2);
      expect(stats.hitCount).toBe(2);
      expect(stats.missCount).toBe(1);
    });

    it('should count expired entries separately', () => {
      cache.set('key1', 'value1', 50);
      
      // Wait for expiration
      const start = Date.now();
      while (Date.now() - start < 100) {
        // Busy wait
      }

      const stats = cache.stats();
      expect(stats.expiredEntries).toBe(1);
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', () => {
      cache.set('key1', 'value1', 50);
      cache.set('key2', 'value2');

      // Wait for expiration
      const start = Date.now();
      while (Date.now() - start < 100) {
        // Busy wait
      }

      const removed = cache.cleanup();
      expect(removed).toBe(1);
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBe('value2');
    });
  });
});
