import type { TelegramProvider } from "./TelegramProvider";
import { MockTelegramProvider } from "./MockTelegramProvider";

/**
 * Provider type configuration
 */
export type ProviderType = "mock" | "telegram";

/**
 * Provider factory options
 */
export interface ProviderFactoryOptions {
  type: ProviderType;
  mockDelayMs?: number;
  mockSimulateError?: boolean;
}

/**
 * Factory for creating TelegramProvider instances
 */
export class ProviderFactory {
  /**
   * Create a TelegramProvider based on configuration
   */
  static create(options: ProviderFactoryOptions): TelegramProvider {
    switch (options.type) {
      case "mock":
        return new MockTelegramProvider({
          delayMs: options.mockDelayMs ?? 50,
          simulateError: options.mockSimulateError ?? false,
        });
      case "telegram":
        // TODO: Implement real Telegram provider
        // For now, fall back to mock
        console.warn(
          "Real Telegram provider not yet implemented. Using mock provider.",
        );
        return new MockTelegramProvider({
          delayMs: options.mockDelayMs ?? 50,
          simulateError: options.mockSimulateError ?? false,
        });
      default:
        throw new Error(`Unknown provider type: ${(options as ProviderFactoryOptions).type}`);
    }
  }
}
