import type { ToolWithHandler } from "../types";

/**
 * delete_message tool - Delete a message
 */
export const deleteMessageTool: ToolWithHandler = {
  definition: {
    name: "delete_message",
    description:
      "Delete a message from a chat. Only your own messages can be deleted.",
    inputSchema: {
      type: "object",
      properties: {
        chatId: {
          type: "string",
          description: "The ID of the chat containing the message",
        },
        messageId: {
          type: "string",
          description: "The ID of the message to delete",
        },
      },
      required: ["chatId", "messageId"],
    },
  },
  handler: async (args, { telegramService }) => {
    const chatId = args?.chatId as string;
    const messageId = args?.messageId as string;

    if (!chatId || !messageId) {
      throw new Error("chatId and messageId are required");
    }

    const success = await telegramService.deleteMessage(chatId, messageId);

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
              chatId,
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
