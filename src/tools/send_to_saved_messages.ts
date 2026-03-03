import type { ToolWithHandler } from "./types";

/**
 * send_to_saved_messages tool - Send message to Saved Messages
 */
export const sendToSavedMessagesTool: ToolWithHandler = {
  definition: {
    name: "send_to_saved_messages",
    description:
      "Send a message to your Saved Messages (Telegram's personal cloud storage). Useful for storing notes, links, or forwarding content.",
    inputSchema: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description: "The message text to save",
        },
      },
      required: ["text"],
    },
  },
  handler: async (args, { telegramService }) => {
    const text = args?.text as string;

    if (!text) {
      throw new Error("text is required");
    }

    const message = await telegramService.sendToSavedMessages(text);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              message: {
                id: message.id,
                chatId: message.chatId,
                text: message.text,
                timestamp: message.timestamp,
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
