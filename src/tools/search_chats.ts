import type { ToolWithHandler } from "./types";

/**
 * search_chats tool - Search chats by name or username
 */
export const searchChatsTool: ToolWithHandler = {
  definition: {
    name: "search_chats",
    description:
      "Search for chats by title or username. Useful for finding a specific chat without listing all chats.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query (chat title or username)",
        },
        limit: {
          type: "number",
          description: "Maximum number of results (default: 20)",
        },
      },
      required: ["query"],
    },
  },
  handler: async (args, { telegramService }) => {
    const query = args?.query as string;
    const limit = args?.limit as number | undefined;

    if (!query) {
      throw new Error("query is required");
    }

    const results = await telegramService.searchChats(query, limit);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              query,
              results: results.map((chat) => ({
                id: chat.id,
                title: chat.title,
                type: chat.type,
                username: chat.username,
                unreadCount: chat.unreadCount,
              })),
              count: results.length,
            },
            null,
            2,
          ),
        },
      ],
    };
  },
};
