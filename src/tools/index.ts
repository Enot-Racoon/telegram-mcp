/**
 * Tools registry - MCP tool definitions and handlers
 *
 * This module exports all MCP tools for the Telegram server.
 */

export type { ToolDefinition, ToolHandler, ToolHandlerContext, ToolWithHandler } from "./types";

// Chat operations
import { listChatsTool } from "./listChats";
import { getMessagesTool } from "./getMessages";
import { sendMessageTool } from "./sendMessage";
import { markAsReadTool } from "./markAsRead";
import { getChatInfoTool } from "./getChatInfo";

// Search & Resolve
import { searchChatsTool } from "./search_chats";
import { resolveChatTool } from "./resolve_chat";
import { searchMessagesTool } from "./search_messages";

// Message actions
import { replyToMessageTool } from "./reply_to_message";
import { editMessageTool } from "./edit_message";
import { deleteMessageTool } from "./delete_message";

// Updates & Unread
import { getUnreadMessagesTool } from "./get_unread_messages";
import { getUpdatesSinceTool } from "./get_updates_since";
import { getUnreadCountTool } from "./get_unread_count";
import { getLastMessageTool } from "./get_last_message";

// User Info
import { getUserInfoTool } from "./get_user_info";

// Connection
import { getConnectionStatusTool } from "./get_connection_status";

// Dialogs
import { listRecentChatsTool } from "./list_recent_chats";
import { getDialogsPageTool } from "./get_dialogs_page";

// System & Admin
import { getLogsTool } from "./get_logs";
import { clearCacheTool } from "./clear_cache";
import { getCacheStatsTool } from "./get_cache_stats";

// Advanced Chat Operations
import { sendToSavedMessagesTool } from "./send_to_saved_messages";
import { getParticipantsTool } from "./get_participants";
import { resolvePeerTool } from "./resolve_peer";
import { subscribeToChatTool } from "./subscribe_to_chat";
import { waitForNewMessageTool } from "./wait_for_new_message";

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

  // Search & Resolve
  search_chats: searchChatsTool,
  resolve_chat: resolveChatTool,
  search_messages: searchMessagesTool,

  // Message actions
  reply_to_message: replyToMessageTool,
  edit_message: editMessageTool,
  delete_message: deleteMessageTool,

  // Updates & Unread
  get_unread_messages: getUnreadMessagesTool,
  get_updates_since: getUpdatesSinceTool,
  get_unread_count: getUnreadCountTool,
  get_last_message: getLastMessageTool,

  // User Info
  get_user_info: getUserInfoTool,

  // Connection
  get_connection_status: getConnectionStatusTool,

  // Dialogs
  list_recent_chats: listRecentChatsTool,
  get_dialogs_page: getDialogsPageTool,

  // System & Admin
  get_logs: getLogsTool,
  clear_cache: clearCacheTool,
  get_cache_stats: getCacheStatsTool,

  // Advanced Chat Operations
  send_to_saved_messages: sendToSavedMessagesTool,
  get_participants: getParticipantsTool,
  resolve_peer: resolvePeerTool,
  subscribe_to_chat: subscribeToChatTool,
  wait_for_new_message: waitForNewMessageTool,

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
