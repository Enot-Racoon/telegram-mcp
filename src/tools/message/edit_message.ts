import type { ToolWithHandler } from "../types";

/**
 * edit_message tool - Edit an existing message
 */
export const editMessageTool: ToolWithHandler = {
  definition: {
    name: "edit_message",
    description:
      "Edit the text of an existing message. Only your own messages can be edited. The chat parameter accepts chat IDs, @username, or t.me links.",
    inputSchema: {
      type: "object",
      properties: {
        chatId: {
          type: "string",
          description: "The ID of the chat containing the message (deprecated: use 'chat' instead)",
        },
        chat: {
          type: "string",
          description: "Chat reference: chat ID, @username, username, or t.me link",
        },
        messageId: {
          type: "string",
          description: "The ID of the message to edit",
        },
        newText: {
          type: "string",
          description: "The new text for the message",
        },
      },
      required: ["messageId", "newText"],
    },
  },
  handler: async (args, { telegramService }) => {
    const chatId = args?.chatId as string | undefined;
    const chat = args?.chat as string | undefined;
    const messageId = args?.messageId as string;
    const newText = args?.newText as string;

    if (!messageId || !newText) {
      throw new Error("messageId and newText are required");
    }

    // Use chat if provided, otherwise fall back to chatId for backward compatibility
    const targetChat = chat || chatId;

    if (!targetChat) {
      throw new Error("chat or chatId is required");
    }

    const result = await telegramService.editMessage(targetChat, messageId, newText);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              message: {
                id: result.id,
                chatId: result.chatId,
                text: result.text,
                timestamp: result.timestamp,
                edited: true,
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
