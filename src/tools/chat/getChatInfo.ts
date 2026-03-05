import type { ToolWithHandler } from "../types";

/**
 * get_chat_info tool - Get detailed information about a chat
 */
export const getChatInfoTool: ToolWithHandler = {
  definition: {
    name: "get_chat_info",
    description:
      "Get detailed information about a chat: type, id, username, participants count, last message, pinned message. The chat parameter accepts chat IDs, @username, or t.me links.",
    inputSchema: {
      type: "object",
      properties: {
        chatId: {
          type: "string",
          description: "The ID of the chat to get information about (deprecated: use 'chat' instead)",
        },
        chat: {
          type: "string",
          description: "Chat reference: chat ID, @username, username, or t.me link",
        },
      },
      required: [],
    },
  },
  handler: async (args, { telegramService }) => {
    const chatId = args?.chatId as string | undefined;
    const chat = args?.chat as string | undefined;

    // Use chat if provided, otherwise fall back to chatId for backward compatibility
    const targetChat = chat || chatId;

    if (!targetChat) {
      throw new Error("chat or chatId is required");
    }

    const result = await telegramService.getChatInfo(targetChat);

    if (!result) {
      throw new Error(`Chat not found: ${targetChat}`);
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
