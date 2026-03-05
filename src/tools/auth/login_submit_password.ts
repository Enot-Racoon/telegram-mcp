import type { ToolWithHandler } from "../types";

/**
 * login_submit_password tool - Submit 2FA password for login
 */
export const loginSubmitPasswordTool: ToolWithHandler = {
  definition: {
    name: "login_submit_password",
    description:
      "Submit the 2FA password if required after login_submit_code. This is needed when the account has cloud password enabled.",
    inputSchema: {
      type: "object",
      properties: {
        phone: {
          type: "string",
          description: "Phone number used in login_start",
        },
        password: {
          type: "string",
          description: "2FA password",
        },
      },
      required: ["phone", "password"],
    },
  },
  handler: async (args) => {
    const phone = args?.phone as string;
    const password = args?.password as string;

    if (!phone || !password) {
      throw new Error("phone and password are required");
    }

    // Stage 1: Mock implementation - accept any password
    // In real implementation, this would verify the password with Telegram API

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              phone,
              state: "authenticated",
              message: "2FA authentication successful (mock)",
            },
            null,
            2,
          ),
        },
      ],
    };
  },
};
