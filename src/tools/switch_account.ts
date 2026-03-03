import type { ToolWithHandler } from "./types";

/**
 * switch_account tool - Switch to a different account
 */
export const switchAccountTool: ToolWithHandler = {
  definition: {
    name: "switch_account",
    description:
      "Switch to a different Telegram account. Deactivates the current account and activates the specified one.",
    inputSchema: {
      type: "object",
      properties: {
        accountId: {
          type: "string",
          description: "The ID of the account to switch to",
        },
        phone: {
          type: "string",
          description: "Or phone number of the account to switch to",
        },
      },
    },
  },
  handler: async (args, { accountManager }) => {
    const accountId = args?.accountId as string | undefined;
    const phone = args?.phone as string | undefined;

    if (!accountId && !phone) {
      throw new Error("Either accountId or phone must be provided");
    }

    let success: boolean;
    let targetAccountId: string;

    if (accountId) {
      targetAccountId = accountId;
      success = accountManager.setDefaultAccount(accountId);
    } else {
      const account = accountManager.getAccountByPhone(phone!);
      if (!account) {
        throw new Error(`Account not found: ${phone}`);
      }
      targetAccountId = account.id;
      success = accountManager.setDefaultAccount(account.id);
    }

    if (!success) {
      throw new Error(`Failed to switch to account: ${accountId || phone}`);
    }

    const authStatus = accountManager.getAuthStatus();

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              message: `Switched to account ${targetAccountId}`,
              activeAccount: authStatus.activeAccount,
            },
            null,
            2,
          ),
        },
      ],
    };
  },
};
