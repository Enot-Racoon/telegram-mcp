import type { ToolWithHandler } from "./types";

/**
 * get_unread_count tool - Get total unread messages count
 */
export const getUnreadCountTool: ToolWithHandler = {
  definition: {
    name: "get_unread_count",
    description:
      "Get the total count of unread messages across all chats. Quick way to check for new activity.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  handler: async (args, { telegramService }) => {
    const count = await telegramService.getUnreadCount();

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              unreadCount: count,
              hasUnread: count > 0,
            },
            null,
            2,
          ),
        },
      ],
    };
  },
};
