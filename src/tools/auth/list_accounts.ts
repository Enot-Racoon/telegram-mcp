import type { ToolWithHandler } from "../types";

/**
 * list_accounts tool - List all Telegram accounts
 */
export const listAccountsTool: ToolWithHandler = {
  definition: {
    name: "list_accounts",
    description:
      "List all Telegram accounts. Shows account ID, phone, status, and which one is active.",
    inputSchema: {
      type: "object",
      properties: {
        includeInactive: {
          type: "boolean",
          description: "Include inactive accounts (default: true)",
        },
      },
    },
  },
  handler: async (args, { accountManager }) => {
    const includeInactive = args?.includeInactive as boolean | undefined;

    let accounts = accountManager.getAllAccounts();

    if (includeInactive === false) {
      accounts = accountManager.getActiveAccounts();
    }

    const result = {
      accounts: accounts.map((acc) => ({
        id: acc.id,
        phone: acc.phone,
        status: acc.status,
        isActive: acc.session?.isActive ?? false,
        username: acc.session?.username,
        createdAt: acc.createdAt,
        lastActiveAt: acc.updatedAt,
      })),
      total: accounts.length,
    };

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
