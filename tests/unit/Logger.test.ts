import { describe, it, expect, beforeEach } from "vitest";

import { Logger } from "~/core/logging";
import { InMemoryLogRepository } from "~/core/repositories";

describe("Logger", () => {
  let logger: Logger;
  let logRepository: InMemoryLogRepository;

  beforeEach(() => {
    logRepository = new InMemoryLogRepository();
    logger = new Logger(logRepository, "debug");
  });

  describe("log levels", () => {
    it("should log debug messages", async () => {
      logger.debug("Debug message");
      const logs = await logger.query({ level: "debug" });
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].level).toBe("debug");
    });

    it("should log info messages", async () => {
      logger.info("Info message");
      const logs = await logger.query({ level: "info" });
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].level).toBe("info");
    });

    it("should log warn messages", async () => {
      logger.warn("Warning message");
      const logs = await logger.query({ level: "warn" });
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].level).toBe("warn");
    });

    it("should log error messages", async () => {
      logger.error("Error message");
      const logs = await logger.query({ level: "error" });
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].level).toBe("error");
    });
  });

  describe("log level filtering", () => {
    it("should filter out debug messages when level is info", async () => {
      const infoLogger = new Logger(logRepository, "info");
      infoLogger.debug("Debug message");
      infoLogger.info("Info message");
      
      const logs = await infoLogger.query();
      expect(logs.every((log) => log.level !== "debug")).toBe(true);
    });

    it("should filter out debug and info when level is warn", async () => {
      const warnLogger = new Logger(logRepository, "warn");
      warnLogger.debug("Debug");
      warnLogger.info("Info");
      warnLogger.warn("Warning");
      
      const logs = await warnLogger.query();
      expect(logs.every((log) => ["warn", "error"].includes(log.level))).toBe(true);
    });
  });

  describe("context", () => {
    it("should store context information", async () => {
      logger.info("Test message", {
        tool: "test_tool",
        action: "test_action",
        sessionId: "session-123",
        metadata: { key: "value" },
      });

      const logs = await logger.query({ tool: "test_tool" });
      expect(logs[0].tool).toBe("test_tool");
      expect(logs[0].action).toBe("test_action");
      expect(logs[0].sessionId).toBe("session-123");
    });
  });

  describe("tool logging", () => {
    it("should log tool execution", async () => {
      logger.logTool("telegram", "list_chats", {}, [], 50);
      
      const logs = await logger.query({ tool: "telegram" });
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].duration).toBe(50);
    });

    it("should log tool errors", async () => {
      const error = new Error("Test error");
      logger.logToolError("telegram", "send_message", {}, error, 100);
      
      const logs = await logger.query({ level: "error" });
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].error).toBe("Test error");
      expect(logs[0].duration).toBe(100);
    });
  });

  describe("query", () => {
    it("should query logs by level", async () => {
      logger.debug("Debug");
      logger.info("Info");
      logger.warn("Warn");
      logger.error("Error");

      const errorLogs = await logger.query({ level: "error" });
      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].level).toBe("error");
    });

    it("should query logs by tool", async () => {
      logger.info("Message 1", { tool: "tool1" });
      logger.info("Message 2", { tool: "tool2" });
      logger.info("Message 3", { tool: "tool1" });

      const tool1Logs = await logger.query({ tool: "tool1" });
      expect(tool1Logs).toHaveLength(2);
    });

    it("should query logs by session", async () => {
      logger.info("Message 1", { sessionId: "session-1" });
      logger.info("Message 2", { sessionId: "session-2" });
      logger.info("Message 3", { sessionId: "session-1" });

      const session1Logs = await logger.query({ sessionId: "session-1" });
      expect(session1Logs).toHaveLength(2);
    });

    it("should respect limit", async () => {
      for (let i = 0; i < 20; i++) {
        logger.info(`Message ${i}`);
      }

      const logs = await logger.query({ limit: 10 });
      expect(logs).toHaveLength(10);
    });

    it("should respect offset", async () => {
      for (let i = 0; i < 20; i++) {
        logger.info(`Message ${i}`);
      }

      const logs = await logger.query({ limit: 10, offset: 10 });
      expect(logs).toHaveLength(10);
    });
  });

  describe("count", () => {
    it("should count logs with filters", async () => {
      logger.info("Message 1", { tool: "tool1" });
      logger.info("Message 2", { tool: "tool1" });
      logger.info("Message 3", { tool: "tool2" });

      const count = await logger.count({ tool: "tool1" });
      expect(count).toBe(2);
    });
  });

  describe("trim", () => {
    it("should keep only maxEntries", async () => {
      for (let i = 0; i < 50; i++) {
        logger.info(`Message ${i}`);
      }

      await logger.trim(20);
      
      const logs = await logger.query({ limit: 100 });
      expect(logs).toHaveLength(20);
    });
  });

  describe("clear", () => {
    it("should remove all logs", async () => {
      logger.info("Message 1");
      logger.info("Message 2");
      logger.info("Message 3");

      await logger.clear();
      
      const logs = await logger.query();
      expect(logs).toHaveLength(0);
    });
  });

  describe("serverId", () => {
    it("should generate unique server ID", () => {
      const logger1 = new Logger(new InMemoryLogRepository());
      const logger2 = new Logger(new InMemoryLogRepository());
      
      expect(logger1.getServerId()).not.toBe(logger2.getServerId());
    });

    it("should use provided server ID", () => {
      const customServerId = "custom-server-id";
      const logger = new Logger(new InMemoryLogRepository(customServerId));
      
      expect(logger.getServerId()).toBe(customServerId);
    });
  });
});
