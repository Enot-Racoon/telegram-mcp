import type { ToolWithHandler } from "./types";

/**
 * get_user_info tool - Get user information by ID
 */
export const getUserInfoTool: ToolWithHandler = {
  definition: {
    name: "get_user_info",
    description:
      "Get detailed information about a Telegram user by their user ID. Returns username, first name, last name, and bot status.",
    inputSchema: {
      type: "object",
      properties: {
        userId: {
          type: "string",
          description: "The ID of the user to get information about",
        },
      },
      required: ["userId"],
    },
  },
  handler: async (args, { telegramService }) => {
    const userId = args?.userId as string;

    if (!userId) {
      throw new Error("userId is required");
    }

    const user = await telegramService.getUserInfo(userId);

    if (!user) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: false,
                error: `User not found: ${userId}`,
              },
              null,
              2,
            ),
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              user: {
                id: user.id,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                isBot: user.isBot,
              },
            },
            null,
            2,
          ),
        },
      ],
    };
  },
};
