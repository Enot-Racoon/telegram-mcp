import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { Logger } from '../../src/core/logging/index.js';
import { initializeDatabase, closeDatabase } from '../../src/core/database/index.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { tmpdir } from 'node:os';

describe('Logger', () => {
  let db: Database.Database;
  let logger: Logger;
  let dbPath: string;

  beforeEach(() => {
    dbPath = path.join(tmpdir(), `test-logs-${Date.now()}.db`);
    db = initializeDatabase(dbPath);
    logger = new Logger(db, 'debug');
  });

  afterEach(() => {
    closeDatabase(db);
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
  });

  describe('log levels', () => {
    it('should log debug messages', async () => {
      logger.debug('Debug message');
      const logs = await logger.query({ level: 'debug' });
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].level).toBe('debug');
    });

    it('should log info messages', async () => {
      logger.info('Info message');
      const logs = await logger.query({ level: 'info' });
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].level).toBe('info');
    });

    it('should log warn messages', async () => {
      logger.warn('Warning message');
      const logs = await logger.query({ level: 'warn' });
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].level).toBe('warn');
    });

    it('should log error messages', async () => {
      logger.error('Error message');
      const logs = await logger.query({ level: 'error' });
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].level).toBe('error');
    });
  });

  describe('log level filtering', () => {
    it('should filter out debug messages when level is info', async () => {
      const infoLogger = new Logger(db, 'info');
      infoLogger.debug('Debug message');
      infoLogger.info('Info message');

      const logs = await infoLogger.query();
      expect(logs.length).toBe(1);
      expect(logs[0].level).toBe('info');
    });

    it('should filter out debug and info when level is warn', async () => {
      const warnLogger = new Logger(db, 'warn');
      warnLogger.debug('Debug');
      warnLogger.info('Info');
      warnLogger.warn('Warn');

      const logs = await warnLogger.query();
      expect(logs.length).toBe(1);
      expect(logs[0].level).toBe('warn');
    });
  });

  describe('context', () => {
    it('should store context information', async () => {
      logger.info('Test message', {
        tool: 'test-tool',
        sessionId: 'session-123',
        metadata: { key: 'value' },
      });

      const logs = await logger.query();
      expect(logs[0].tool).toBe('test-tool');
      expect(logs[0].sessionId).toBe('session-123');
      expect(logs[0].metadata).toEqual({ key: 'value' });
    });
  });

  describe('tool logging', () => {
    it('should log tool execution', async () => {
      logger.logTool('chat', 'list', { limit: 10 }, { result: 'ok' }, 100);

      const logs = await logger.query({ tool: 'chat' });
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].action).toBe('list');
      expect(logs[0].arguments).toEqual({ limit: 10 });
      expect(logs[0].duration).toBe(100);
    });

    it('should log tool errors', async () => {
      const error = new Error('Test error');
      logger.logToolError('chat', 'send', { text: 'hello' }, error, 50);

      const logs = await logger.query({ tool: 'chat' });
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].error).toBe('Test error');
      expect(logs[0].arguments).toEqual({ text: 'hello' });
    });
  });

  describe('query', () => {
    it('should query logs by level', async () => {
      logger.debug('Debug');
      logger.info('Info');
      logger.warn('Warn');

      const infoLogs = await logger.query({ level: 'info' });
      expect(infoLogs.length).toBe(1);
    });

    it('should query logs by tool', async () => {
      logger.info('Message 1', { tool: 'tool1' });
      logger.info('Message 2', { tool: 'tool2' });
      logger.info('Message 3', { tool: 'tool1' });

      const tool1Logs = await logger.query({ tool: 'tool1' });
      expect(tool1Logs.length).toBe(2);
    });

    it('should query logs by session', async () => {
      logger.info('Message 1', { sessionId: 'session1' });
      logger.info('Message 2', { sessionId: 'session2' });

      const session1Logs = await logger.query({ sessionId: 'session1' });
      expect(session1Logs.length).toBe(1);
    });

    it('should respect limit', async () => {
      logger.info('Message 1');
      logger.info('Message 2');
      logger.info('Message 3');

      const logs = await logger.query({ limit: 2 });
      expect(logs.length).toBe(2);
    });

    it('should respect offset', async () => {
      logger.info('Message 1');
      logger.info('Message 2');
      logger.info('Message 3');

      const logs = await logger.query({ offset: 1 });
      expect(logs.length).toBe(2);
    });
  });

  describe('count', () => {
    it('should count logs with filters', async () => {
      logger.info('Message 1', { tool: 'tool1' });
      logger.info('Message 2', { tool: 'tool1' });
      logger.info('Message 3', { tool: 'tool2' });

      expect(await logger.count()).toBe(3);
      expect(await logger.count({ tool: 'tool1' })).toBe(2);
    });
  });

  describe('trim', () => {
    it('should keep only maxEntries', async () => {
      for (let i = 0; i < 10; i++) {
        logger.info(`Message ${i}`);
      }

      const trimmed = await logger.trim(5);
      expect(trimmed).toBe(5);
      expect(await logger.count()).toBe(5);
    });
  });

  describe('clear', () => {
    it('should remove all logs', async () => {
      logger.info('Message 1');
      logger.info('Message 2');

      await logger.clear();
      expect(await logger.count()).toBe(0);
    });
  });

  describe('serverId', () => {
    it('should generate unique server ID', () => {
      const logger1 = new Logger(db, 'debug');
      const logger2 = new Logger(db, 'debug');

      expect(logger1.getServerId()).toBeDefined();
      expect(logger2.getServerId()).toBeDefined();
      expect(logger1.getServerId()).not.toBe(logger2.getServerId());
    });

    it('should use provided server ID', () => {
      const customId = 'custom-server-id';
      const customLogger = new Logger(db, 'debug', customId);
      expect(customLogger.getServerId()).toBe(customId);
    });
  });
});
