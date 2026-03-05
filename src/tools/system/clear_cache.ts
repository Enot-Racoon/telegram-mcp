import type { ToolWithHandler } from "../types";

/**
 * clear_cache tool - Clear cache entries
 */
export const clearCacheTool: ToolWithHandler = {
  definition: {
    name: "clear_cache",
    description:
      "Clear cache entries. Can clear all cache or entries matching a specific prefix.",
    inputSchema: {
      type: "object",
      properties: {
        prefix: {
          type: "string",
          description:
            "Optional: clear only entries with keys starting with this prefix",
        },
      },
    },
  },
  handler: async (args, { cache }) => {
    const prefix = args?.prefix as string | undefined;

    let message: string;
    let clearedCount = 0;

    if (prefix) {
      // Get count before clearing
      const stats = await cache.stats();
      const beforeCount = stats.totalEntries;

      await cache.clearByPrefix(prefix);

      const afterStats = await cache.stats();
      clearedCount = beforeCount - afterStats.totalEntries;
      message = `Cleared ${clearedCount} cache entries with prefix "${prefix}"`;
    } else {
      // Get count before clearing
      const stats = await cache.stats();
      clearedCount = stats.totalEntries;

      await cache.clear();
      message = `Cleared all ${clearedCount} cache entries`;
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              message,
              clearedCount,
              prefix: prefix || "all",
            },
            null,
            2,
          ),
        },
      ],
    };
  },
};
