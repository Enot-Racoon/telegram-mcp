import type { ToolWithHandler } from "./types";

/**
 * resolve_peer tool - Resolve and normalize peer reference to chat_id
 */
export const resolvePeerTool: ToolWithHandler = {
  definition: {
    name: "resolve_peer",
    description:
      "Resolve and normalize a peer reference to an internal chat_id. Supports: @username, username, t.me/username, t.me/c/id, chat titles, and raw chat IDs.",
    inputSchema: {
      type: "object",
      properties: {
        ref: {
          type: "string",
          description:
            "Peer reference: @username, username, t.me/link, chat title, or raw chat_id",
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

    const chatId = await telegramService.resolvePeer(ref);

    if (!chatId) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: false,
                error: `Peer not found: ${ref}`,
                ref,
                supportedFormats: [
                  "@username",
                  "username",
                  "t.me/username",
                  "t.me/c/id (private channels)",
                  "Chat Title",
                  "raw_chat_id",
                ],
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
