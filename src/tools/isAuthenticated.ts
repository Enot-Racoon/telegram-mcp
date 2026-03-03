import type { ToolWithHandler } from "./types";

/**
 * is_authenticated tool - Check if the server is authenticated with Telegram
 */
export const isAuthenticatedTool: ToolWithHandler = {
  definition: {
    name: "is_authenticated",
    description: "Check if the server is authenticated with Telegram.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  handler: async (args, { telegramService }) => {
    const authStatus = telegramService.isAuthenticated();

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ authenticated: authStatus }, null, 2),
        },
      ],
    };
  },
};
