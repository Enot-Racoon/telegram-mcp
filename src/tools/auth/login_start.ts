import type { ToolWithHandler } from "../types";

/**
 * login_start tool - Start login process by sending phone number
 */
export const loginStartTool: ToolWithHandler = {
  definition: {
    name: "login_start",
    description:
      "Start the login process by providing a phone number. A verification code will be sent to the phone.",
    inputSchema: {
      type: "object",
      properties: {
        phone: {
          type: "string",
          description:
            "Phone number in international format (e.g., +1234567890)",
        },
      },
      required: ["phone"],
    },
  },
  handler: async (args, { telegramService, logger }) => {
    const phone = args?.phone as string;

    if (!phone) {
      throw new Error("phone is required");
    }

    // Stage 1: Mock implementation - simulate sending code
    await telegramService.login(phone);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              phone,
              state: "code_required",
              message: "Verification code sent to phone (mock)",
            },
            null,
            2,
          ),
        },
      ],
    };
  },
};
