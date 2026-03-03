/**
 * Tools registry - MCP tool definitions and handlers
 *
 * This module exports all MCP tools for the Telegram server.
 */

export type { ToolDefinition, ToolHandler, ToolHandlerContext, ToolWithHandler } from "./types";

// Chat tools
import { listChatsTool } from "./listChats";
import { getMessagesTool } from "./getMessages";
import { sendMessageTool } from "./sendMessage";
import { markAsReadTool } from "./markAsRead";
import { getChatInfoTool } from "./getChatInfo";

// Auth tools
import { loginTool } from "./login";
import { isAuthenticatedTool } from "./isAuthenticated";
import { loginStartTool } from "./login_start";
import { loginSubmitCodeTool } from "./login_submit_code";
import { loginSubmitPasswordTool } from "./login_submit_password";
import { logoutTool } from "./logout";
import { listAccountsTool } from "./list_accounts";
import { setDefaultAccountTool } from "./set_default_account";
import { isLoggedInTool } from "./is_logged_in";
import { getAuthStatusTool } from "./get_auth_status";
import { switchAccountTool } from "./switch_account";
import { getMeTool } from "./get_me";

/**
 * All available tools
 */
export const tools = {
  // Chat operations
  list_chats: listChatsTool,
  get_messages: getMessagesTool,
  send_message: sendMessageTool,
  mark_as_read: markAsReadTool,
  get_chat_info: getChatInfoTool,

  // Auth operations
  login: loginTool,
  is_authenticated: isAuthenticatedTool,
  login_start: loginStartTool,
  login_submit_code: loginSubmitCodeTool,
  login_submit_password: loginSubmitPasswordTool,
  logout: logoutTool,
  list_accounts: listAccountsTool,
  set_default_account: setDefaultAccountTool,
  is_logged_in: isLoggedInTool,
  get_auth_status: getAuthStatusTool,
  switch_account: switchAccountTool,
  get_me: getMeTool,
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
