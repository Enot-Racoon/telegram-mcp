import type { ToolWithHandler } from "./types";

/**
 * logout tool - Logout from Telegram
 */
export const logoutTool: ToolWithHandler = {
  definition: {
    name: "logout",
    description: "Logout from the current Telegram session.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  handler: async (args, { telegramService }) => {
    await telegramService.logout();

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              message: "Logged out successfully",
            },
            null,
            2,
          ),
        },
      ],
    };
  },
};
