import type { ToolWithHandler } from "../types";

/**
 * search_messages tool - Search messages by text
 */
export const searchMessagesTool: ToolWithHandler = {
  definition: {
    name: "search_messages",
    description:
      "Search for messages by text content. Can search within a specific chat or globally across all chats.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Text to search for",
        },
        chatId: {
          type: "string",
          description: "Optional: search within specific chat",
        },
        limit: {
          type: "number",
          description: "Maximum number of results (default: 20)",
        },
        fromUserId: {
          type: "string",
          description: "Optional: filter by sender user ID",
        },
        minDate: {
          type: "number",
          description: "Optional: minimum timestamp (milliseconds)",
        },
        maxDate: {
          type: "number",
          description: "Optional: maximum timestamp (milliseconds)",
        },
      },
      required: ["query"],
    },
  },
  handler: async (args, { telegramService }) => {
    const query = args?.query as string;
    const chatId = args?.chatId as string | undefined;
    const limit = args?.limit as number | undefined;
    const fromUserId = args?.fromUserId as string | undefined;
    const minDate = args?.minDate as number | undefined;
    const maxDate = args?.maxDate as number | undefined;

    if (!query) {
      throw new Error("query is required");
    }

    const results = await telegramService.searchMessages({
      query,
      chatId,
      limit,
      fromUserId,
      minDate,
      maxDate,
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              query,
              chatId: chatId || "all_chats",
              results: results.map((msg) => ({
                id: msg.id,
                chatId: msg.chatId,
                text: msg.text,
                from: msg.from,
                timestamp: msg.timestamp,
                isRead: msg.isRead,
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
