import type { ToolWithHandler } from "./types";

/**
 * get_last_message tool - Get the last message from a chat
 */
export const getLastMessageTool: ToolWithHandler = {
  definition: {
    name: "get_last_message",
    description:
      "Get the most recent message from a specific chat. Useful for checking the latest activity without fetching all messages.",
    inputSchema: {
      type: "object",
      properties: {
        chatId: {
          type: "string",
          description: "The ID of the chat to get the last message from",
        },
      },
      required: ["chatId"],
    },
  },
  handler: async (args, { telegramService }) => {
    const chatId = args?.chatId as string;

    if (!chatId) {
      throw new Error("chatId is required");
    }

    const message = await telegramService.getLastMessage(chatId);

    if (!message) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: false,
                error: `No messages found in chat: ${chatId}`,
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
              chatId,
              message: {
                id: message.id,
                chatId: message.chatId,
                from: message.from,
                text: message.text,
                timestamp: message.timestamp,
                isRead: message.isRead,
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
