import type { ToolWithHandler } from "./types";

/**
 * set_default_account tool - Set the default active account
 */
export const setDefaultAccountTool: ToolWithHandler = {
  definition: {
    name: "set_default_account",
    description:
      "Set the default (active) account. This account will be used for subsequent operations.",
    inputSchema: {
      type: "object",
      properties: {
        accountId: {
          type: "string",
          description: "The ID of the account to set as default",
        },
        phone: {
          type: "string",
          description: "Or phone number of the account to set as default",
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

    if (accountId) {
      success = accountManager.setDefaultAccount(accountId);
    } else {
      success = accountManager.setDefaultAccountByPhone(phone!);
    }

    if (!success) {
      throw new Error(
        `Account not found: ${accountId || phone}`,
      );
    }

    const authStatus = accountManager.getAuthStatus();

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              message: `Account ${accountId || phone} is now active`,
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
