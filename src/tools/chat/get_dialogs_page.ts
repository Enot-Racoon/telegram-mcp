import type { ToolWithHandler } from "../types";

/**
 * get_dialogs_page tool - Get paginated list of chats
 */
export const getDialogsPageTool: ToolWithHandler = {
  definition: {
    name: "get_dialogs_page",
    description:
      "Get a paginated list of chats/dialogs sorted by recent activity. Use offset and limit for pagination.",
    inputSchema: {
      type: "object",
      properties: {
        offset: {
          type: "number",
          description: "Number of chats to skip (default: 0)",
        },
        limit: {
          type: "number",
          description: "Maximum number of chats to return (default: 20)",
        },
      },
    },
  },
  handler: async (args, { telegramService }) => {
    const offset = args?.offset as number | undefined;
    const limit = args?.limit as number | undefined;

    const result = await telegramService.getDialogsPage(offset, limit);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              chats: result.chats.map((chat) => ({
                id: chat.id,
                title: chat.title,
                type: chat.type,
                username: chat.username,
                unreadCount: chat.unreadCount,
                lastMessage: chat.lastMessage
                  ? {
                      id: chat.lastMessage.id,
                      text: chat.lastMessage.text,
                      timestamp: chat.lastMessage.timestamp,
                    }
                  : null,
              })),
              total: result.total,
              hasMore: result.hasMore,
              offset: offset || 0,
              limit: limit || 20,
            },
            null,
            2,
          ),
        },
      ],
    };
  },
};
