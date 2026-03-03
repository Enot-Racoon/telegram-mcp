import type { ToolWithHandler } from "./types";

/**
 * get_me tool - Get information about the current account
 */
export const getMeTool: ToolWithHandler = {
  definition: {
    name: "get_me",
    description:
      "Get detailed information about the currently active Telegram account.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  handler: async (args, { accountManager, telegramService }) => {
    const authStatus = accountManager.getAuthStatus();

    if (!authStatus.activeAccount) {
      throw new Error("No active account. Please login first.");
    }

    const activeSession = accountManager.getActiveSession();

    const result = {
      id: authStatus.activeAccount.id,
      phone: authStatus.activeAccount.phone,
      username: authStatus.activeAccount.username,
      userId: activeSession?.userId,
      isActive: activeSession?.isActive ?? false,
      createdAt: activeSession?.createdAt,
      lastActiveAt: activeSession?.lastActiveAt,
      telegramAuthenticated: telegramService.isAuthenticated(),
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
