/**
 * Shared utilities — reusable across all adapters and the orchestrator.
 * Extracted from the original Copart scraper's utils.ts.
 */

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Add jitter to a delay to avoid detection patterns.
 * Returns a value between delay * 0.5 and delay * 1.5.
 */
export function jitteredDelay(baseDelay: number): number {
  const jitter = 0.5 + Math.random();
  return Math.round(baseDelay * jitter);
}

/**
 * Retry a function with exponential backoff.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  label: string = "operation"
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries) {
        const delay = jitteredDelay(baseDelay * Math.pow(2, attempt - 1));
        log("warn", `${label} failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms: ${lastError.message}`);
        await sleep(delay);
      }
    }
  }

  throw new Error(`${label} failed after ${maxRetries} attempts: ${lastError?.message}`);
}

/**
 * Colorized console logger.
 */
export function log(
  level: "info" | "warn" | "error" | "success" | "debug",
  message: string
): void {
  const colors: Record<string, string> = {
    info: "\x1b[36m",
    warn: "\x1b[33m",
    error: "\x1b[31m",
    success: "\x1b[32m",
    debug: "\x1b[90m",
  };
  const reset = "\x1b[0m";
  const timestamp = new Date().toISOString().split("T")[1]?.slice(0, 8);
  console.log(`${colors[level]}[${timestamp}] [${level.toUpperCase()}]${reset} ${message}`);
}
