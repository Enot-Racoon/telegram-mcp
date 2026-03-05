import type { ToolWithHandler } from "../types";

/**
 * send_message tool - Send a text message to a chat
 */
export const sendMessageTool: ToolWithHandler = {
  definition: {
    name: "send_message",
    description:
      "Send a text message to a chat. Supports reply_to_message_id, parse_mode, and disable_link_preview options. The chat parameter accepts chat IDs, @username, or t.me links.",
    inputSchema: {
      type: "object",
      properties: {
        chatId: {
          type: "string",
          description: "The ID of the chat to send message to (deprecated: use 'chat' instead)",
        },
        chat: {
          type: "string",
          description: "Chat reference: chat ID, @username, username, or t.me link",
        },
        text: {
          type: "string",
          description: "The message text to send",
        },
        replyToMessageId: {
          type: "string",
          description: "Optional: ID of the message to reply to",
        },
        parseMode: {
          type: "string",
          enum: ["markdown", "html", "none"],
          description: "Optional: parse mode for the message text",
        },
        disableLinkPreview: {
          type: "boolean",
          description: "Optional: disable link preview generation",
        },
      },
      required: ["text"],
    },
  },
  handler: async (args, { telegramService }) => {
    const chatId = args?.chatId as string | undefined;
    const chat = args?.chat as string | undefined;
    const text = args?.text as string;
    const replyToMessageId = args?.replyToMessageId as string | undefined;
    const parseMode = args?.parseMode as "markdown" | "html" | "none" | undefined;
    const disableLinkPreview = args?.disableLinkPreview as boolean | undefined;

    if (!text) {
      throw new Error("text is required");
    }

    // Use chat if provided, otherwise fall back to chatId for backward compatibility
    const targetChat = chat || chatId;

    if (!targetChat) {
      throw new Error("chat or chatId is required");
    }

    const result = await telegramService.sendMessage(targetChat, text, {
      replyToMessageId,
      parseMode,
      disableLinkPreview,
    });

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
                isRead: result.isRead,
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
