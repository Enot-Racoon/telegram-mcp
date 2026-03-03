import type { ToolWithHandler } from "./types";

/**
 * send_message tool - Send a text message to a chat
 */
export const sendMessageTool: ToolWithHandler = {
  definition: {
    name: "send_message",
    description: "Send a text message to a chat.",
    inputSchema: {
      type: "object",
      properties: {
        chatId: {
          type: "string",
          description: "The ID of the chat to send message to",
        },
        text: {
          type: "string",
          description: "The message text to send",
        },
      },
      required: ["chatId", "text"],
    },
  },
  handler: async (args, { telegramService }) => {
    const chatId = args?.chatId as string;
    const text = args?.text as string;

    if (!chatId || !text) {
      throw new Error("chatId and text are required");
    }

    await telegramService.sendMessage(chatId, text);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ success: true, chatId, text }, null, 2),
        },
      ],
    };
  },
};
