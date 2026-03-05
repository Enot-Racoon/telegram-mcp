/**
 * Telegram executor for handling retry logic and flood-wait errors
 * Wraps TelegramProvider calls with exponential backoff
 */
export class TelegramExecutor {
  private maxRetries = 3;

  /**
   * Execute a Telegram API call with retry logic
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    let attempt = 0;

    while (true) {
      try {
        return await fn();
      } catch (err: unknown) {
        const message = String(err instanceof Error ? err.message : err);

        // Handle flood wait errors (e.g., FLOOD_WAIT_60)
        const floodMatch = message.match(/FLOOD_WAIT_(\d+)/);

        if (floodMatch) {
          const seconds = Number(floodMatch[1]);
          await this.sleep(seconds * 1000);
          continue;
        }

        // Retry transient errors
        if (this.isRetryable(err) && attempt < this.maxRetries) {
          attempt++;
          await this.sleep(500 * attempt);
          continue;
        }

        throw err;
      }
    }
  }

  /**
   * Check if error is retryable (network issues, timeouts)
   */
  private isRetryable(err: unknown): boolean {
    const message = String(err instanceof Error ? err.message : err);

    return (
      message.includes("NETWORK") ||
      message.includes("TIMEOUT") ||
      message.includes("ECONNRESET") ||
      message.includes("ETIMEDOUT") ||
      message.includes("ENOTFOUND")
    );
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
