import type { ToolWithHandler } from "./types";

/**
 * mark_as_read tool - Mark messages in a chat as read
 */
export const markAsReadTool: ToolWithHandler = {
  definition: {
    name: "mark_as_read",
    description: "Mark messages in a chat as read.",
    inputSchema: {
      type: "object",
      properties: {
        chatId: {
          type: "string",
          description: "The ID of the chat to mark as read",
        },
      },
      required: ["chatId"],
    },
  },
  handler: async (args) => {
    const chatId = args?.chatId as string;

    if (!chatId) {
      throw new Error("chatId is required");
    }

    // Stage 1: Mock implementation
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ success: true, chatId }, null, 2),
        },
      ],
    };
  },
};
