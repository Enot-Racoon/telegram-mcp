import type { ToolWithHandler } from "./types";

/**
 * is_logged_in tool - Check if currently logged in
 */
export const isLoggedInTool: ToolWithHandler = {
  definition: {
    name: "is_logged_in",
    description:
      "Check if the server is currently logged in to Telegram (has an active session).",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  handler: async (args, { telegramService }) => {
    const authenticated = telegramService.isAuthenticated();

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              isLoggedIn: authenticated,
            },
            null,
            2,
          ),
        },
      ],
    };
  },
};
