import type { ToolWithHandler } from "../types";

/**
 * reply_to_message tool - Reply to a specific message
 */
export const replyToMessageTool: ToolWithHandler = {
  definition: {
    name: "reply_to_message",
    description:
      "Send a reply to a specific message. This creates a threaded reply in the chat. The chat parameter accepts chat IDs, @username, or t.me links.",
    inputSchema: {
      type: "object",
      properties: {
        chatId: {
          type: "string",
          description: "The ID of the chat (deprecated: use 'chat' instead)",
        },
        chat: {
          type: "string",
          description: "Chat reference: chat ID, @username, username, or t.me link",
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
      required: ["messageId", "text"],
    },
  },
  handler: async (args, { telegramService }) => {
    const chatId = args?.chatId as string | undefined;
    const chat = args?.chat as string | undefined;
    const messageId = args?.messageId as string;
    const text = args?.text as string;

    if (!messageId || !text) {
      throw new Error("messageId and text are required");
    }

    // Use chat if provided, otherwise fall back to chatId for backward compatibility
    const targetChat = chat || chatId;

    if (!targetChat) {
      throw new Error("chat or chatId is required");
    }

    const result = await telegramService.replyMessage(targetChat, messageId, text);

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
