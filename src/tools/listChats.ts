import type { ToolWithHandler } from "./types";

/**
 * list_chats tool - List all Telegram chats
 */
export const listChatsTool: ToolWithHandler = {
  definition: {
    name: "list_chats",
    description:
      "List all Telegram chats. Optionally filter by type (private, group, channel) or unread status.",
    inputSchema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["private", "group", "channel"],
          description: "Filter by chat type",
        },
        unreadOnly: {
          type: "boolean",
          description: "Only return chats with unread messages",
        },
      },
    },
  },
  handler: async (args, { telegramService, logger }) => {
    const chatType = args?.type as "private" | "group" | "channel" | undefined;
    const unreadOnly = args?.unreadOnly as boolean | undefined;

    const result = await telegramService.getChats({
      type: chatType,
      unreadOnly,
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  },
};
