import type { ToolWithHandler } from "./types";

/**
 * edit_message tool - Edit an existing message
 */
export const editMessageTool: ToolWithHandler = {
  definition: {
    name: "edit_message",
    description:
      "Edit the text of an existing message. Only your own messages can be edited.",
    inputSchema: {
      type: "object",
      properties: {
        chatId: {
          type: "string",
          description: "The ID of the chat containing the message",
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
      required: ["chatId", "messageId", "newText"],
    },
  },
  handler: async (args, { telegramService }) => {
    const chatId = args?.chatId as string;
    const messageId = args?.messageId as string;
    const newText = args?.newText as string;

    if (!chatId || !messageId || !newText) {
      throw new Error("chatId, messageId, and newText are required");
    }

    const result = await telegramService.editMessage(chatId, messageId, newText);

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
