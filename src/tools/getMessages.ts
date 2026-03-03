import type { ToolWithHandler } from "./types";

/**
 * get_messages tool - Get messages from a specific chat
 */
export const getMessagesTool: ToolWithHandler = {
  definition: {
    name: "get_messages",
    description:
      "Get messages from a specific chat. Supports pagination with limit, offset, before_id, after_id.",
    inputSchema: {
      type: "object",
      properties: {
        chatId: {
          type: "string",
          description: "The ID of the chat to get messages from",
        },
        limit: {
          type: "number",
          description: "Maximum number of messages to return (default: 50)",
        },
        offset: {
          type: "number",
          description: "Number of messages to skip",
        },
        beforeId: {
          type: "string",
          description: "Get messages before this message ID",
        },
        afterId: {
          type: "string",
          description: "Get messages after this message ID",
        },
      },
      required: ["chatId"],
    },
  },
  handler: async (args, { telegramService }) => {
    const chatId = args?.chatId as string;
    const limit = args?.limit as number | undefined;
    const offset = args?.offset as number | undefined;
    const beforeId = args?.beforeId as string | undefined;
    const afterId = args?.afterId as string | undefined;

    if (!chatId) {
      throw new Error("chatId is required");
    }

    const result = await telegramService.getMessages(chatId, {
      limit,
      offset,
      beforeId,
      afterId,
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              chatId,
              messages: result.map((msg) => ({
                id: msg.id,
                chatId: msg.chatId,
                from: msg.from,
                text: msg.text,
                timestamp: msg.timestamp,
                isRead: msg.isRead,
                hasReply: !!msg.replyTo,
              })),
              count: result.length,
              hasMore: result.length === (limit || 50),
            },
            null,
            2,
          ),
        },
      ],
    };
  },
};
