/**
 * Tools registry - MCP tool definitions and handlers
 *
 * This module exports all MCP tools for the Telegram server.
 */

export type { ToolDefinition, ToolHandler, ToolHandlerContext, ToolWithHandler } from "./types";

import { listChatsTool } from "./listChats";
import { getMessagesTool } from "./getMessages";
import { sendMessageTool } from "./sendMessage";
import { markAsReadTool } from "./markAsRead";
import { loginTool } from "./login";
import { isAuthenticatedTool } from "./isAuthenticated";
import { getChatInfoTool } from "./getChatInfo";

/**
 * All available tools
 */
export const tools = {
  list_chats: listChatsTool,
  get_messages: getMessagesTool,
  send_message: sendMessageTool,
  mark_as_read: markAsReadTool,
  login: loginTool,
  is_authenticated: isAuthenticatedTool,
  get_chat_info: getChatInfoTool,
} as const;

/**
 * Get tool definitions for ListToolsRequest handler
 */
export function getToolDefinitions() {
  return Object.values(tools).map((tool) => tool.definition);
}

/**
 * Get tool handler by name
 */
export function getToolHandler(name: string) {
  const tool = tools[name as keyof typeof tools];
  return tool?.handler;
}
