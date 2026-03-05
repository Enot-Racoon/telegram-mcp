import type { ToolWithHandler } from "../types";

/**
 * login tool - Login to Telegram with a phone number
 */
export const loginTool: ToolWithHandler = {
  definition: {
    name: "login",
    description: "Login to Telegram with a phone number.",
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
  handler: async (args, { telegramService }) => {
    const phone = args?.phone as string;

    if (!phone) {
      throw new Error("phone is required");
    }

    await telegramService.login(phone);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ success: true, phone }, null, 2),
        },
      ],
    };
  },
};
