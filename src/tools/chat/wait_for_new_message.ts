import type { ToolWithHandler } from "../types";

/**
 * wait_for_new_message tool - Wait for new message (blocking)
 */
export const waitForNewMessageTool: ToolWithHandler = {
  definition: {
    name: "wait_for_new_message",
    description:
      "Wait for a new message in subscribed chats. This is a blocking tool that returns when a new message arrives. Can filter by chat or user.",
    inputSchema: {
      type: "object",
      properties: {
        chatId: {
          type: "string",
          description: "Optional: wait for messages in specific chat only",
        },
        fromUserId: {
          type: "string",
          description: "Optional: wait for messages from specific user",
        },
        timeout: {
          type: "number",
          description: "Timeout in milliseconds (default: 30000)",
        },
      },
    },
  },
  handler: async (args, { telegramService }) => {
    const chatId = args?.chatId as string | undefined;
    const fromUserId = args?.fromUserId as string | undefined;
    const timeout = args?.timeout as number | undefined;

    const message = await telegramService.waitForNewMessage({
      chatId,
      fromUserId,
      timeout,
    });

    if (!message) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: false,
                message: null,
                reason: "No new messages found",
                tip: "Make sure to subscribe_to_chat first before waiting for messages",
              },
              null,
              2,
            ),
          },
        ],
      };
    }

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
                from: message.from,
                text: message.text,
                timestamp: message.timestamp,
                isRead: message.isRead,
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
