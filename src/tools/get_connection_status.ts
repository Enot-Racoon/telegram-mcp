import type { ToolWithHandler } from "./types";

/**
 * get_connection_status tool - Get Telegram connection status
 */
export const getConnectionStatusTool: ToolWithHandler = {
  definition: {
    name: "get_connection_status",
    description:
      "Get the current connection status to Telegram servers. Shows if connected, disconnected, flood_wait, or rate_limited.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  handler: async (args, { telegramService }) => {
    const status = await telegramService.getConnectionStatus();

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              state: status.state,
              isConnected: status.state === "connected",
              lastConnected: status.lastConnected,
              lastDisconnected: status.lastDisconnected,
              floodWaitSeconds: status.floodWaitSeconds,
              errorMessage: status.errorMessage,
            },
            null,
            2,
          ),
        },
      ],
    };
  },
};
