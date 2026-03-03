import type { ToolWithHandler } from "./types";

/**
 * get_cache_stats tool - Get cache statistics
 */
export const getCacheStatsTool: ToolWithHandler = {
  definition: {
    name: "get_cache_stats",
    description:
      "Get cache statistics including total entries, expired entries, hit/miss counts, and size.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  handler: async (args, { cache }) => {
    const stats = await cache.stats();

    const hitRate =
      stats.hitCount + stats.missCount > 0
        ? ((stats.hitCount / (stats.hitCount + stats.missCount)) * 100).toFixed(
            2,
          )
        : "0.00";

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              totalEntries: stats.totalEntries,
              expiredEntries: stats.expiredEntries,
              validEntries: stats.totalEntries - stats.expiredEntries,
              hitCount: stats.hitCount,
              missCount: stats.missCount,
              hitRate: `${hitRate}%`,
              sizeBytes: stats.size,
              sizeKB: (stats.size / 1024).toFixed(2),
            },
            null,
            2,
          ),
        },
      ],
    };
  },
};
