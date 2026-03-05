import type { ToolWithHandler } from "../types";

/**
 * get_updates_since tool - Get messages since a specific message
 */
export const getUpdatesSinceTool: ToolWithHandler = {
  definition: {
    name: "get_updates_since",
    description:
      "Get new messages since a specific message ID. Useful for incremental updates and polling for new messages.",
    inputSchema: {
      type: "object",
      properties: {
        chatId: {
          type: "string",
          description: "The ID of the chat to get updates from",
        },
        afterMessageId: {
          type: "string",
          description: "Get messages after this message ID",
        },
        limit: {
          type: "number",
          description: "Maximum number of messages to return (default: 50)",
        },
      },
      required: ["chatId", "afterMessageId"],
    },
  },
  handler: async (args, { telegramService }) => {
    const chatId = args?.chatId as string;
    const afterMessageId = args?.afterMessageId as string;
    const limit = args?.limit as number | undefined;

    if (!chatId || !afterMessageId) {
      throw new Error("chatId and afterMessageId are required");
    }

    const results = await telegramService.getUpdatesSince(
      chatId,
      afterMessageId,
      limit,
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              chatId,
              afterMessageId,
              messages: results.map((msg) => ({
                id: msg.id,
                chatId: msg.chatId,
                from: msg.from,
                text: msg.text,
                timestamp: msg.timestamp,
                isRead: msg.isRead,
              })),
              count: results.length,
              hasMore: results.length === (limit || 50),
            },
            null,
            2,
          ),
        },
      ],
    };
  },
};
