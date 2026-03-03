import type { Server } from "@modelcontextprotocol/sdk/server";
import type {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import type { Logger } from "~/core/logging";
import type { TelegramService } from "~/telegram/TelegramService";

/**
 * Tool definition structure
 */
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * Tool handler function type
 */
export interface ToolHandlerContext {
  server: Server;
  logger: Logger;
  telegramService: TelegramService;
}

export type ToolHandler = (
  args: Record<string, unknown> | undefined,
  context: ToolHandlerContext,
) => Promise<{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}>;

/**
 * Complete tool definition with handler
 */
export interface ToolWithHandler {
  definition: ToolDefinition;
  handler: ToolHandler;
}
