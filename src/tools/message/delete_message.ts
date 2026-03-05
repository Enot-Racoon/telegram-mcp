import type { ToolWithHandler } from "../types";

/**
 * delete_message tool - Delete a message
 */
export const deleteMessageTool: ToolWithHandler = {
  definition: {
    name: "delete_message",
    description:
      "Delete a message from a chat. Only your own messages can be deleted. The chat parameter accepts chat IDs, @username, or t.me links.",
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
          description: "The ID of the message to delete",
        },
      },
      required: ["messageId"],
    },
  },
  handler: async (args, { telegramService }) => {
    const chatId = args?.chatId as string | undefined;
    const chat = args?.chat as string | undefined;
    const messageId = args?.messageId as string;

    if (!messageId) {
      throw new Error("messageId is required");
    }

    // Use chat if provided, otherwise fall back to chatId for backward compatibility
    const targetChat = chat || chatId;

    if (!targetChat) {
      throw new Error("chat or chatId is required");
    }

    const success = await telegramService.deleteMessage(targetChat, messageId);

    if (!success) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: false,
                error: `Message not found: ${messageId}`,
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
              chatId: targetChat,
              messageId,
              deleted: true,
            },
            null,
            2,
          ),
        },
      ],
    };
  },
};
