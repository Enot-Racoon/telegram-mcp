import type { ToolWithHandler } from "../types";

/**
 * get_unread_messages tool - Get unread messages
 */
export const getUnreadMessagesTool: ToolWithHandler = {
  definition: {
    name: "get_unread_messages",
    description:
      "Get unread messages. Can get unread messages from a specific chat or from all chats.",
    inputSchema: {
      type: "object",
      properties: {
        chatId: {
          type: "string",
          description: "Optional: get unread messages from specific chat",
        },
        limit: {
          type: "number",
          description: "Maximum number of messages to return (default: 50)",
        },
      },
    },
  },
  handler: async (args, { telegramService }) => {
    const chatId = args?.chatId as string | undefined;
    const limit = args?.limit as number | undefined;

    const results = await telegramService.getUnreadMessages(chatId, limit);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              chatId: chatId || "all_chats",
              messages: results.map((msg) => ({
                id: msg.id,
                chatId: msg.chatId,
                from: msg.from,
                text: msg.text,
                timestamp: msg.timestamp,
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
