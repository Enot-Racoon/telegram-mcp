import type { ToolWithHandler } from "./types";

/**
 * get_messages tool - Get messages from a specific chat
 */
export const getMessagesTool: ToolWithHandler = {
  definition: {
    name: "get_messages",
    description:
      "Get messages from a specific chat. Returns up to 50 messages by default.",
    inputSchema: {
      type: "object",
      properties: {
        chatId: {
          type: "string",
          description: "The ID of the chat to get messages from",
        },
        limit: {
          type: "number",
          description:
            "Maximum number of messages to return (default: 50)",
        },
      },
      required: ["chatId"],
    },
  },
  handler: async (args, { telegramService }) => {
    const chatId = args?.chatId as string;
    const limit = args?.limit as number | undefined;

    if (!chatId) {
      throw new Error("chatId is required");
    }

    const result = await telegramService.getMessages(chatId, limit);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  },
};
