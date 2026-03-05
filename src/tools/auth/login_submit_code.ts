import type { ToolWithHandler } from "../types";

/**
 * login_submit_code tool - Submit verification code for login
 */
export const loginSubmitCodeTool: ToolWithHandler = {
  definition: {
    name: "login_submit_code",
    description:
      "Submit the verification code received after login_start. If 2FA is enabled, password will be required next.",
    inputSchema: {
      type: "object",
      properties: {
        phone: {
          type: "string",
          description: "Phone number used in login_start",
        },
        code: {
          type: "string",
          description: "Verification code from Telegram",
        },
      },
      required: ["phone", "code"],
    },
  },
  handler: async (args) => {
    const phone = args?.phone as string;
    const code = args?.code as string;

    if (!phone || !code) {
      throw new Error("phone and code are required");
    }

    // Stage 1: Mock implementation - accept any code
    // In real implementation, this would verify the code with Telegram API

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              phone,
              state: "authenticated",
              message: "Login successful (mock)",
            },
            null,
            2,
          ),
        },
      ],
    };
  },
};
