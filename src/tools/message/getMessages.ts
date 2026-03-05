import type { ToolWithHandler } from "../types";

/**
 * get_messages tool - Get messages from a specific chat
 */
export const getMessagesTool: ToolWithHandler = {
  definition: {
    name: "get_messages",
    description:
      "Get messages from a specific chat. Supports pagination with limit, offset, before_id, after_id. The chat parameter accepts chat IDs, @username, or t.me links.",
    inputSchema: {
      type: "object",
      properties: {
        chatId: {
          type: "string",
          description: "The ID of the chat to get messages from (deprecated: use 'chat' instead)",
        },
        chat: {
          type: "string",
          description: "Chat reference: chat ID, @username, username, or t.me link",
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
      required: [],
    },
  },
  handler: async (args, { telegramService }) => {
    const chatId = args?.chatId as string | undefined;
    const chat = args?.chat as string | undefined;
    const limit = args?.limit as number | undefined;
    const offset = args?.offset as number | undefined;
    const beforeId = args?.beforeId as string | undefined;
    const afterId = args?.afterId as string | undefined;

    // Use chat if provided, otherwise fall back to chatId for backward compatibility
    const targetChat = chat || chatId;

    if (!targetChat) {
      throw new Error("chat or chatId is required");
    }

    const result = await telegramService.getMessages(targetChat, {
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
              chatId: targetChat,
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
