import type { ToolWithHandler } from "./types";

/**
 * reply_to_message tool - Reply to a specific message
 */
export const replyToMessageTool: ToolWithHandler = {
  definition: {
    name: "reply_to_message",
    description:
      "Send a reply to a specific message. This creates a threaded reply in the chat.",
    inputSchema: {
      type: "object",
      properties: {
        chatId: {
          type: "string",
          description: "The ID of the chat",
        },
        messageId: {
          type: "string",
          description: "The ID of the message to reply to",
        },
        text: {
          type: "string",
          description: "The reply message text",
        },
      },
      required: ["chatId", "messageId", "text"],
    },
  },
  handler: async (args, { telegramService }) => {
    const chatId = args?.chatId as string;
    const messageId = args?.messageId as string;
    const text = args?.text as string;

    if (!chatId || !messageId || !text) {
      throw new Error("chatId, messageId, and text are required");
    }

    const result = await telegramService.replyMessage(chatId, messageId, text);

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
                replyTo: result.replyTo
                  ? {
                      id: result.replyTo.id,
                      text: result.replyTo.text,
                    }
                  : null,
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
