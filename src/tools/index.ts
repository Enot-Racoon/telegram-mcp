/**
 * Tools registry - MCP tool definitions and handlers
 *
 * This module exports all MCP tools for the Telegram server.
 * Tools are organized by domain modules.
 */

export type { ToolDefinition, ToolHandler, ToolHandlerContext, ToolWithHandler } from "./types";

// Re-export from modular registry
export { tools, getToolDefinitions, getToolHandler, getToolNames } from "./registry";

// Re-export domain modules for direct access if needed
export * as auth from "./auth";
export * as chat from "./chat";
export * as message from "./message";
export * as system from "./system";
