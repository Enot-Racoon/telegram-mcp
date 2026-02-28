import { Server } from "@modelcontextprotocol/sdk/server";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

import type { Config } from "~/types";
import { Logger } from "~/core/logging";
import { CacheManager } from "~/core/cache";
import { AccountManager } from "~/accounts/AccountManager";
import { MockTelegramProvider } from "~/telegram/MockTelegramProvider";
import { TelegramService } from "~/telegram/TelegramService";
import { getDatabase, closeDatabase } from "~/core/database";

/**
 * Telegram MCP Server
 *
 * This server provides MCP (Model Context Protocol) integration for Telegram.
 * Stage 1: Foundation with mock provider (no real Telegram integration).
 */
export class TelegramMCPServer {
  private server: Server;
  private logger: Logger;
  private cache: CacheManager;
  private accountManager: AccountManager;
  private telegramService: TelegramService;
  private config: Config;
  private isRunning = false;

  constructor(config: Config) {
    this.config = config;

    // Initialize database
    const db = getDatabase(config.databasePath);

    // Initialize components
    this.logger = new Logger(db, config.logLevel);
    this.cache = new CacheManager(db);
    this.accountManager = new AccountManager(db);

    // Initialize Telegram service with mock provider
    const mockProvider = new MockTelegramProvider();
    this.telegramService = new TelegramService(mockProvider);

    // Initialize MCP server
    this.server = new Server(
      {
        name: "telegram-mcp",
        version: "0.1.0",
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      this.logger.debug("Listing available tools");

      return {
        tools: [
          {
            name: "listChats",
            description:
              "List all Telegram chats. Optionally filter by type (private, group, channel) or unread status.",
            inputSchema: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: ["private", "group", "channel"],
                  description: "Filter by chat type",
                },
                unreadOnly: {
                  type: "boolean",
                  description: "Only return chats with unread messages",
                },
              },
            },
          },
          {
            name: "getMessages",
            description:
              "Get messages from a specific chat. Returns up to 50 messages by default.",
            inputSchema: {
              type: "object",
              properties: {
                chatId: {
                  type: "string",
                  description: "The ID of the chat to get messages from",
                },
                limit: {
                  type: "number",
                  description: "Maximum number of messages to return (default: 50)",
                },
              },
              required: ["chatId"],
            },
          },
          {
            name: "sendMessage",
            description: "Send a text message to a chat.",
            inputSchema: {
              type: "object",
              properties: {
                chatId: {
                  type: "string",
                  description: "The ID of the chat to send message to",
                },
                text: {
                  type: "string",
                  description: "The message text to send",
                },
              },
              required: ["chatId", "text"],
            },
          },
          {
            name: "markAsRead",
            description: "Mark messages in a chat as read.",
            inputSchema: {
              type: "object",
              properties: {
                chatId: {
                  type: "string",
                  description: "The ID of the chat to mark as read",
                },
              },
              required: ["chatId"],
            },
          },
        ],
      };
    });

    // Call tool handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const startTime = Date.now();

      this.logger.info("Tool call requested", {
        tool: name,
        arguments: args,
      });

      try {
        let result: unknown;

        switch (name) {
          case "listChats": {
            const chatType = args?.type as "private" | "group" | "channel" | undefined;
            const unreadOnly = args?.unreadOnly as boolean | undefined;

            result = await this.telegramService.getChats({
              type: chatType,
              unreadOnly,
            });

            this.logger.logTool(
              "telegram",
              "listChats",
              { type: chatType, unreadOnly },
              result,
              Date.now() - startTime,
            );

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case "getMessages": {
            const chatId = args?.chatId as string;
            const limit = args?.limit as number | undefined;

            if (!chatId) {
              throw new Error("chatId is required");
            }

            result = await this.telegramService.getMessages(chatId, limit);

            this.logger.logTool(
              "telegram",
              "getMessages",
              { chatId, limit },
              result,
              Date.now() - startTime,
            );

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case "sendMessage": {
            const chatId = args?.chatId as string;
            const text = args?.text as string;

            if (!chatId || !text) {
              throw new Error("chatId and text are required");
            }

            await this.telegramService.sendMessage(chatId, text);

            result = { success: true, chatId, text };

            this.logger.logTool(
              "telegram",
              "sendMessage",
              { chatId, text },
              result,
              Date.now() - startTime,
            );

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case "markAsRead": {
            const chatId = args?.chatId as string;

            if (!chatId) {
              throw new Error("chatId is required");
            }

            // Stage 1: Mock implementation
            result = { success: true, chatId };

            this.logger.logTool(
              "telegram",
              "markAsRead",
              { chatId },
              result,
              Date.now() - startTime,
            );

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          default:
            return {
              content: [
                {
                  type: "text",
                  text: `Unknown tool: ${name}`,
                },
              ],
              isError: true,
            };
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        this.logger.logToolError(
          "telegram",
          name,
          args || {},
          error instanceof Error ? error : new Error(errorMessage),
          Date.now() - startTime,
        );

        return {
          content: [
            {
              type: "text",
              text: `Error: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });

    // Error handler
    this.server.onerror = (error) => {
      this.logger.error("Server error", { error: error.message });
    };

    // Close handler
    this.server.onclose = () => {
      this.logger.info("Server closed", {
        tool: "self",
        action: "close",
      });
      this.isRunning = false;
    };
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error("Server is already running");
    }

    this.logger.info("Starting Telegram MCP Server", {
      tool: "self",
      action: "start",
      arguments: {
        databasePath: this.config.databasePath,
        logLevel: this.config.logLevel,
      },
    });

    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    this.isRunning = true;

    this.logger.info("Telegram MCP Server started successfully", {
      tool: "self",
      action: "start",
    });
  }

  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.logger.info("Stopping Telegram MCP Server", {
      tool: "self",
      action: "stop",
    });

    await this.server.close();
    closeDatabase(getDatabase(this.config.databasePath));

    this.isRunning = false;
  }

  /**
   * Check if server is running
   */
  getRunningStatus(): boolean {
    return this.isRunning;
  }

  /**
   * Get the logger instance
   */
  getLogger(): Logger {
    return this.logger;
  }

  /**
   * Get the cache manager
   */
  getCache(): CacheManager {
    return this.cache;
  }

  /**
   * Get the account manager
   */
  getAccountManager(): AccountManager {
    return this.accountManager;
  }

  /**
   * Get the Telegram service
   */
  getTelegramService(): TelegramService {
    return this.telegramService;
  }
}
