/**
 * Modular tool registry
 * Assembles tools from domain modules
 */

import type { ToolWithHandler } from "./types";

// Import domain modules
import * as auth from "./auth";
import * as chat from "./chat";
import * as message from "./message";
import * as system from "./system";

/**
 * Tool registry interface
 */
export interface ToolRegistry {
  [key: string]: ToolWithHandler;
}

/**
 * All available tools organized by domain
 */
export const tools: ToolRegistry = {
  // Auth tools
  login: auth.loginTool,
  login_start: auth.loginStartTool,
  login_submit_code: auth.loginSubmitCodeTool,
  login_submit_password: auth.loginSubmitPasswordTool,
  logout: auth.logoutTool,
  is_authenticated: auth.isAuthenticatedTool,
  is_logged_in: auth.isLoggedInTool,
  get_auth_status: auth.getAuthStatusTool,
  switch_account: auth.switchAccountTool,
  set_default_account: auth.setDefaultAccountTool,
  list_accounts: auth.listAccountsTool,
  get_me: auth.getMeTool,

  // Chat tools
  list_chats: chat.listChatsTool,
  get_chat_info: chat.getChatInfoTool,
  search_chats: chat.searchChatsTool,
  resolve_chat: chat.resolveChatTool,
  list_recent_chats: chat.listRecentChatsTool,
  get_dialogs_page: chat.getDialogsPageTool,
  get_participants: chat.getParticipantsTool,
  resolve_peer: chat.resolvePeerTool,
  subscribe_to_chat: chat.subscribeToChatTool,
  wait_for_new_message: chat.waitForNewMessageTool,
  get_unread_count: chat.getUnreadCountTool,

  // Message tools
  send_message: message.sendMessageTool,
  get_messages: message.getMessagesTool,
  reply_to_message: message.replyToMessageTool,
  edit_message: message.editMessageTool,
  delete_message: message.deleteMessageTool,
  search_messages: message.searchMessagesTool,
  get_unread_messages: message.getUnreadMessagesTool,
  get_updates_since: message.getUpdatesSinceTool,
  get_last_message: message.getLastMessageTool,
  send_to_saved_messages: message.sendToSavedMessagesTool,

  // System tools
  clear_cache: system.clearCacheTool,
  get_cache_stats: system.getCacheStatsTool,
  get_logs: system.getLogsTool,
  get_connection_status: system.getConnectionStatusTool,
  get_user_info: system.getUserInfoTool,
  mark_as_read: system.markAsReadTool,
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
  const tool = tools[name];
  return tool?.handler;
}

/**
 * Get available tool names
 */
export function getToolNames(): string[] {
  return Object.keys(tools);
}
