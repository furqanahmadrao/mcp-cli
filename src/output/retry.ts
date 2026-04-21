/**
 * Retry utility with exponential backoff
 */

import { log, logWarn } from "../output/formatters.js";

export interface RetryOptions {
    maxAttempts?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    backoffMultiplier?: number;
    shouldRetry?: (error: Error) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
    maxAttempts: 3,
    initialDelayMs: 100,
    maxDelayMs: 5000,
    backoffMultiplier: 2,
    shouldRetry: (error: Error) => {
        // Retry on transient errors
        const message = error.message.toLowerCase();
        return (
            message.includes("timeout") ||
            message.includes("econnrefused") ||
            message.includes("econnreset") ||
            message.includes("network")
        );
    },
};

async function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute function with retry logic
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    let lastError: Error | null = null;
    let delay = opts.initialDelayMs;

    for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
        try {
            log(
                `Attempt ${attempt}/${opts.maxAttempts}`
            );
            return await fn();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            // Check if we should retry
            if (!opts.shouldRetry(lastError) || attempt === opts.maxAttempts) {
                throw lastError;
            }

            // Calculate delay with exponential backoff
            const nextDelay = Math.min(
                delay * opts.backoffMultiplier,
                opts.maxDelayMs
            );

            logWarn(
                `Attempt ${attempt} failed: ${lastError.message}. Retrying in ${delay}ms...`
            );

            await sleep(delay);
            delay = nextDelay;
        }
    }

    throw lastError || new Error("Unknown error in retry logic");
}
