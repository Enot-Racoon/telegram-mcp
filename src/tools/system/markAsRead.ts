import type { ToolWithHandler } from "../types";

/**
 * mark_as_read tool - Mark messages in a chat as read
 */
export const markAsReadTool: ToolWithHandler = {
  definition: {
    name: "mark_as_read",
    description: "Mark messages in a chat as read. The chat parameter accepts chat IDs, @username, or t.me links.",
    inputSchema: {
      type: "object",
      properties: {
        chatId: {
          type: "string",
          description: "The ID of the chat to mark as read (deprecated: use 'chat' instead)",
        },
        chat: {
          type: "string",
          description: "Chat reference: chat ID, @username, username, or t.me link",
        },
      },
      required: [],
    },
  },
  handler: async (args) => {
    const chatId = args?.chatId as string | undefined;
    const chat = args?.chat as string | undefined;

    // Use chat if provided, otherwise fall back to chatId for backward compatibility
    const targetChat = chat || chatId;

    if (!targetChat) {
      throw new Error("chat or chatId is required");
    }

    // Stage 1: Mock implementation
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ success: true, chatId: targetChat }, null, 2),
        },
      ],
    };
  },
};
