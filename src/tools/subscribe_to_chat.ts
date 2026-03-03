import type { ToolWithHandler } from "./types";

/**
 * subscribe_to_chat tool - Subscribe to chat for new messages (polling-based)
 */
export const subscribeToChatTool: ToolWithHandler = {
  definition: {
    name: "subscribe_to_chat",
    description:
      "Subscribe to a chat for receiving new messages via polling. Once subscribed, use wait_for_new_message or get_updates_since to receive new messages.",
    inputSchema: {
      type: "object",
      properties: {
        chatId: {
          type: "string",
          description: "The ID of the chat to subscribe to",
        },
      },
      required: ["chatId"],
    },
  },
  handler: async (args, { telegramService }) => {
    const chatId = args?.chatId as string;

    if (!chatId) {
      throw new Error("chatId is required");
    }

    const state = await telegramService.subscribeToChat(chatId);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              subscription: {
                chatId: state.chatId,
                isActive: state.isActive,
                lastMessageId: state.lastMessageId,
                messageCount: state.messageCount,
                startedAt: state.startedAt,
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
