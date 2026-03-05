import type { ToolWithHandler } from "../types";

/**
 * get_logs tool - Query system logs
 */
export const getLogsTool: ToolWithHandler = {
  definition: {
    name: "get_logs",
    description:
      "Query system logs with filters. Can filter by level, tool, session, and date range.",
    inputSchema: {
      type: "object",
      properties: {
        level: {
          type: "string",
          enum: ["debug", "info", "warn", "error"],
          description: "Filter by log level",
        },
        tool: {
          type: "string",
          description: "Filter by tool name",
        },
        sessionId: {
          type: "string",
          description: "Filter by session ID",
        },
        startDate: {
          type: "number",
          description: "Filter logs after this timestamp (milliseconds)",
        },
        endDate: {
          type: "number",
          description: "Filter logs before this timestamp (milliseconds)",
        },
        limit: {
          type: "number",
          description: "Maximum number of logs to return (default: 100)",
        },
        offset: {
          type: "number",
          description: "Number of logs to skip",
        },
      },
    },
  },
  handler: async (args, { logger }) => {
    const level = args?.level as "debug" | "info" | "warn" | "error" | undefined;
    const tool = args?.tool as string | undefined;
    const sessionId = args?.sessionId as string | undefined;
    const startDate = args?.startDate as number | undefined;
    const endDate = args?.endDate as number | undefined;
    const limit = args?.limit as number | undefined;
    const offset = args?.offset as number | undefined;

    const logs = await logger.query({
      level,
      tool,
      sessionId,
      startDate,
      endDate,
      limit,
      offset,
    });

    const count = await logger.count({
      level,
      tool,
      sessionId,
      startDate,
      endDate,
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              logs: logs.map((log) => ({
                id: log.id,
                timestamp: log.timestamp,
                level: log.level,
                tool: log.tool,
                action: log.action,
                duration: log.duration,
                error: log.error,
                sessionId: log.sessionId,
              })),
              count: logs.length,
              total: count,
              filters: {
                level,
                tool,
                sessionId,
                startDate,
                endDate,
                limit: limit || 100,
                offset: offset || 0,
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
