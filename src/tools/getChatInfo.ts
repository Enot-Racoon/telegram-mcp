import type { ToolWithHandler } from "./types";

/**
 * get_chat_info tool - Get detailed information about a chat
 */
export const getChatInfoTool: ToolWithHandler = {
  definition: {
    name: "get_chat_info",
    description:
      "Get detailed information about a chat: type, id, username, participants count, last message, pinned message.",
    inputSchema: {
      type: "object",
      properties: {
        chatId: {
          type: "string",
          description: "The ID of the chat to get information about",
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

    const result = await telegramService.getChatInfo(chatId);

    if (!result) {
      throw new Error(`Chat not found: ${chatId}`);
    }

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
