import type { ToolWithHandler } from "./types";

/**
 * get_participants tool - Get participants of a group/channel
 */
export const getParticipantsTool: ToolWithHandler = {
  definition: {
    name: "get_participants",
    description:
      "Get the list of participants/members in a group or channel. Useful for analyzing group membership.",
    inputSchema: {
      type: "object",
      properties: {
        chatId: {
          type: "string",
          description: "The ID of the group or channel",
        },
        limit: {
          type: "number",
          description: "Maximum number of participants to return (default: 100)",
        },
        offset: {
          type: "number",
          description: "Number of participants to skip (default: 0)",
        },
      },
      required: ["chatId"],
    },
  },
  handler: async (args, { telegramService }) => {
    const chatId = args?.chatId as string;
    const limit = args?.limit as number | undefined;
    const offset = args?.offset as number | undefined;

    if (!chatId) {
      throw new Error("chatId is required");
    }

    const result = await telegramService.getParticipants(chatId, limit, offset);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              chatId,
              participants: result.participants.map((p) => ({
                id: p.id,
                username: p.username,
                firstName: p.firstName,
                lastName: p.lastName,
                isBot: p.isBot,
                role: p.role,
                joinedAt: p.joinedAt,
              })),
              total: result.total,
              limit: limit || 100,
              offset: offset || 0,
            },
            null,
            2,
          ),
        },
      ],
    };
  },
};
