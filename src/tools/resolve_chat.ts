import type { ToolWithHandler } from "./types";

/**
 * resolve_chat tool - Resolve a chat reference to chat_id
 */
export const resolveChatTool: ToolWithHandler = {
  definition: {
    name: "resolve_chat",
    description:
      "Resolve a chat reference (username, t.me link, or chat ID) to an internal chat_id. Supports formats: @username, username, t.me/username, or raw chat_id.",
    inputSchema: {
      type: "object",
      properties: {
        ref: {
          type: "string",
          description:
            "Chat reference: @username, username, t.me/username, or chat_id",
        },
      },
      required: ["ref"],
    },
  },
  handler: async (args, { telegramService }) => {
    const ref = args?.ref as string;

    if (!ref) {
      throw new Error("ref is required");
    }

    const chatId = await telegramService.resolveChat(ref);

    if (!chatId) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: false,
                error: `Chat not found: ${ref}`,
                ref,
              },
              null,
              2,
            ),
          },
        ],
        isError: true,
      };
    }

    // Get chat info for additional context
    const chat = await telegramService.getChat(chatId);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              ref,
              chatId,
              chat: chat
                ? {
                    id: chat.id,
                    title: chat.title,
                    type: chat.type,
                    username: chat.username,
                  }
                : null,
            },
            null,
            2,
          ),
        },
      ],
    };
  },
};
