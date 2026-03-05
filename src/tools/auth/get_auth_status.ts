import type { ToolWithHandler } from "../types";

/**
 * get_auth_status tool - Get detailed authentication status
 */
export const getAuthStatusTool: ToolWithHandler = {
  definition: {
    name: "get_auth_status",
    description:
      "Get detailed authentication status including: available accounts, active account, and whether login is required.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  handler: async (args, { accountManager, telegramService }) => {
    const authStatus = accountManager.getAuthStatus();
    const isTelegramAuthenticated = telegramService.isAuthenticated();

    const result = {
      ...authStatus,
      telegramAuthenticated: isTelegramAuthenticated,
      summary: authStatus.activeAccount
        ? `Active: ${authStatus.activeAccount.phone}${authStatus.activeAccount.username ? ` (@${authStatus.activeAccount.username})` : ""}`
        : "No active account",
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  },
};
