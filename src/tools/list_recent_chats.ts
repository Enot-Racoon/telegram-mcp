import type { ToolWithHandler } from "./types";

/**
 * list_recent_chats tool - List chats sorted by recent activity
 */
export const listRecentChatsTool: ToolWithHandler = {
  definition: {
    name: "list_recent_chats",
    description:
      "List chats sorted by last message time (most recent first). Useful for seeing active conversations.",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Maximum number of chats to return (default: 50)",
        },
      },
    },
  },
  handler: async (args, { telegramService }) => {
    const limit = args?.limit as number | undefined;

    const chats = await telegramService.listRecentChats(limit);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              chats: chats.map((chat) => ({
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
                      from: chat.lastMessage.from,
                    }
                  : null,
              })),
              count: chats.length,
            },
            null,
            2,
          ),
        },
      ],
    };
  },
};
